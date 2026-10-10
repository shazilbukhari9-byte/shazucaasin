// Imports the finished static site into the Next.js app without changing any markup, style or script.
// For every page it keeps the <head> assets (styles, links) and the <body> markup exactly as they are,
// and lists the page's scripts in the order the browser would have run them.
// Usage: node scripts/import-static.mjs [path-to-static-site]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.resolve(process.argv[2] || path.join(ROOT, "..")); // Downloads folder by default
const OUT = path.join(ROOT, "content", "pages");
const PUBLIC_ASSETS = path.join(ROOT, "public", "assets");

export const PAGES = [
  "ucaas-homepage", "phone-texting-full", "video-meetings-full", "toll-free-numbers-full", "team-messaging-full", "blog-full",
  "ai-receptionist", "ai-agent-assist", "conversation-intelligence", "unified-communications", "phone-system", "business-sms",
  "online-fax", "auto-attendant", "call-recording", "supervisor-tools", "remote-teams", "smb-owners", "enterprise-it",
  "sales-teams", "financial-services", "retail-ecom", "saas-tech", "logistics", "support-teams",
  "live-chat", "ai-chatbot", "inbox", "omnichannel", "ai-follow-ups", "ai-call-scheduling", "preview-dialing",
  "progressive-dialing", "predictive-dialing", "auto-dialer", "crm-integrations", "helpdesk-ticketing", "productivity-tools",
  "healthcare-ehr", "rest-apis", "local-numbers", "mobile-numbers", "by-country", "callback-scheduling", "live-wallboards",
  "compare", "integrations", "free-tools",
  "auth", "privacy-policy", "terms",
];

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'");
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
};
const hasAttr = (tag, name) => new RegExp(`\\s${name}(\\s|=|>|$)`, "i").test(tag);

function splitScripts(html, inHead) {
  const scripts = [];
  const rest = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (whole, attrs, code) => {
    const open = `<script${attrs}>`;
    const src = attr(open, "src");
    const type = attr(open, "type");
    if (type && !/^(text\/javascript|module|application\/javascript)$/i.test(type)) return whole; // data blocks stay in the markup
    const mode = src && (hasAttr(open, "defer") || hasAttr(open, "async")) ? "defer" : (inHead ? "head" : "sync");
    scripts.push(src ? { src, mode, ...(type === "module" ? { module: true } : {}) } : { code, mode, ...(type === "module" ? { module: true } : {}) });
    return "";
  });
  return { rest, scripts };
}

function convert(slug) {
  const file = path.join(SRC, `${slug}.html`);
  const html = fs.readFileSync(file, "utf8");
  const headM = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyM = html.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
  if (!headM || !bodyM) throw new Error(`${slug}: no head/body`);
  let head = headM[1];
  const title = decode((head.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, "UCaaS"])[1].trim());
  const descTag = head.match(/<meta\s[^>]*name=["']description["'][^>]*>/i);
  const description = descTag ? attr(descTag[0], "content") : null;
  // Next.js writes these itself (charset, viewport, title, description); everything else stays.
  head = head
    .replace(/<meta\s[^>]*charset[^>]*>/gi, "")
    .replace(/<meta\s[^>]*name=["']viewport["'][^>]*>/gi, "")
    .replace(/<title[^>]*>[\s\S]*?<\/title>/i, "")
    .replace(/<meta\s[^>]*name=["']description["'][^>]*>/gi, "");
  const h = splitScripts(head, true);
  const b = splitScripts(bodyM[2], false);
  // run order the browser uses: blocking head scripts, then body scripts in order, then deferred scripts
  const ordered = [...h.scripts.filter((s) => s.mode === "head"), ...b.scripts, ...h.scripts.filter((s) => s.mode === "defer")];
  // the same external file listed twice runs once (it was linked twice by accident in a few pages)
  const seen = new Set();
  const scripts = ordered.filter((s) => {
    if (!s.src) return true;
    const key = s.src.split("?")[0];
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const lang = attr((html.match(/<html[^>]*>/i) || ["<html>"])[0], "lang") || "en";
  const bodyClass = attr(`<body${bodyM[1]}>`, "class");
  return { slug, title, description, lang, bodyClass, head: toRoutes(h.rest.trim()), body: toRoutes(b.rest.trim()), scripts };
}

// page links become app routes: "live-chat.html#faq" -> "/live-chat#faq", the homepage -> "/"
export const routeOf = (slug) => (slug === "ucaas-homepage" ? "/" : `/${slug}`);
function toRoutes(html) {
  return html.replace(/href="([a-z0-9-]+)\.html(#[^"]*)?"/g, (whole, slug, hash = "") => {
    if (!PAGES.includes(slug)) return whole;
    const route = routeOf(slug);
    return `href="${route === "/" && hash ? `/${hash}` : route + hash}"`;
  });
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = [];
for (const slug of PAGES) {
  const page = convert(slug);
  fs.writeFileSync(path.join(OUT, `${slug}.json`), JSON.stringify(page));
  manifest.push({ slug, title: page.title });
  console.log(`${slug.padEnd(26)} head ${String(page.head.length).padStart(7)}  body ${String(page.body.length).padStart(7)}  scripts ${page.scripts.length}`);
}
fs.writeFileSync(path.join(OUT, "_manifest.json"), JSON.stringify(manifest, null, 2));

// shared assets (fonts, css, js, logo, favicon) are served from /assets exactly as before
fs.rmSync(PUBLIC_ASSETS, { recursive: true, force: true });
fs.cpSync(path.join(SRC, "assets"), PUBLIC_ASSETS, { recursive: true });
console.log(`\n${manifest.length} pages imported, assets copied to public/assets`);
