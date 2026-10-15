import PageRuntime from "@/components/PageRuntime";
import StyleGate from "@/components/StyleGate";
import type { StaticPageData } from "@/lib/pages";

// Scripts that size the hero mockup run during the first parse of the document (the page is hidden until it has loaded),
// so a refresh never shows the unscaled, oversized hero. On client-side navigation PageRuntime runs them as usual.
const EARLY = /\.style\.zoom\s*=|style\.setProperty\(["']--cp-/;

/**
 * Renders one page of the UCaaS site exactly as it was designed:
 * its stylesheets first, then its markup, then its scripts (run on the client, and cleaned up when the visitor leaves).
 */
export default function StaticPage({ page }: { page: StaticPageData }) {
  const early = page.scripts
    .filter((s) => s.code && EARLY.test(s.code))
    .map((s) => "try{" + (s.code || "").replace(/<\/script/gi, "<\\/script") + "}catch(e){}")
    .join("\n");
  // The early script is part of the page markup string (not a React <script> element): the browser runs it while the server HTML
  // is parsed, and it is inert when the markup is inserted by a client-side navigation, so React never sees a script tag.
  const body = early ? page.body + "<script>" + early + "</script>" : page.body;
  return (
    <>
      {/* the page's own <style> and <link> tags, in their original order */}
      <div id="ucaas-head" hidden dangerouslySetInnerHTML={{ __html: page.head }} />
      {/* display: contents keeps the original body > header / main / footer layout; the early hero-fit script changes a
          style attribute inside before hydration, so the markup is allowed to differ */}
      <div id="ucaas-page" style={{ display: "contents" }} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: body }} />
      <StyleGate key={`g-${page.slug}`} slug={page.slug} />
      <PageRuntime key={page.slug} slug={page.slug} scripts={page.scripts} />
    </>
  );
}
