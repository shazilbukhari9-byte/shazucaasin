"use client";

import { useEffect } from "react";
import type { PageScript } from "@/lib/pages";

/*
 * Runs a page's original scripts and cleans up after them.
 *
 * The site moves between pages without a reload, so the scripts of the page being left must not keep running:
 * every window/document listener, timer, animation frame and observer a page script creates is recorded while that
 * page is on screen and removed when the visitor moves on. Nodes the scripts appended to <body>/<head> and classes they
 * put on <html>/<body> are reset too. The next page's scripts then run in their original order, as on a fresh load.
 */

type Listener = EventListenerOrEventListenerObject;
type Queued = { target: EventTarget; type: string; fn: Listener };

type Sandbox = {
  dead: boolean;
  queue: Queued[] | null; // DOMContentLoaded / load listeners added while the scripts run
  listeners: [EventTarget, string, Listener, boolean | AddEventListenerOptions | undefined][];
  timeouts: Set<number>;
  intervals: Set<number>;
  observers: { disconnect(): void }[];
  nodes: Node[]; // nodes the page scripts (and our script tags) put directly into <body> or <head>
};

let current: Sandbox | null = null;
let installed = false;
let pristine: { html: [string | null, string | null]; body: [string | null, string | null] } | null = null;
let selfUrl = "";

function call(fn: Listener, target: EventTarget, ev: Event) {
  try {
    if (typeof fn === "function") fn.call(target, ev);
    else fn.handleEvent(ev);
  } catch (err) {
    console.error(err);
  }
}

/* true when the code that called a patched API belongs to the page (its inline scripts, /assets files or the Motion CDN),
   false for Next.js / React internals, which must never be cleaned up */
function fromPage(): boolean {
  const lines = (new Error().stack || "").split("\n").slice(1);
  for (const line of lines) {
    if (selfUrl && line.includes(selfUrl)) continue; // our own wrappers
    return !(line.includes("/_next/") || line.includes("node_modules") || line.includes("webpack-internal"));
  }
  return false;
}

const isGlobalTarget = (t: EventTarget) =>
  t === window || t === document || t === document.documentElement || t === document.body || (typeof MediaQueryList !== "undefined" && t instanceof MediaQueryList);

function install() {
  if (installed) return;
  installed = true;
  selfUrl = ((new Error().stack || "").split("\n")[1]?.match(/(https?:\/\/[^\s)]+?):\d+:\d+/) || [])[1] || "";

  const P = EventTarget.prototype;
  const add = P.addEventListener;
  P.addEventListener = function (this: EventTarget, type: string, fn: Listener | null, opt?: boolean | AddEventListenerOptions) {
    const sb = current;
    if (sb && fn && (this === window || this === document) && (type === "DOMContentLoaded" || (type === "load" && this === window))) {
      // the page has already loaded: hold these while the scripts run, otherwise fire them right away
      if (sb.queue) { sb.queue.push({ target: this, type, fn }); return; }
      const target = this;
      window.setTimeout(() => call(fn, target, new Event(type)), 0);
      return;
    }
    if (sb && fn && isGlobalTarget(this) && fromPage()) sb.listeners.push([this, type, fn, opt]);
    return add.call(this, type, fn, opt);
  } as typeof P.addEventListener;

  // remember nodes the page scripts add straight into <body> or <head>, so they can be taken out again
  const N = Node.prototype;
  const appendChild = N.appendChild, insertBefore = N.insertBefore;
  const track = (parent: Node, node: Node) => {
    const sb = current;
    if (sb && (parent === document.body || parent === document.head) && fromPage()) sb.nodes.push(node);
  };
  N.appendChild = function <T extends Node>(this: Node, node: T): T { track(this, node); return appendChild.call(this, node) as T; };
  N.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T { track(this, node); return insertBefore.call(this, node, ref) as T; };
  const E = Element.prototype;
  const append = E.append, prepend = E.prepend;
  E.append = function (this: Element, ...nodes: (Node | string)[]) { nodes.forEach((n) => typeof n !== "string" && track(this, n)); return append.apply(this, nodes); };
  E.prepend = function (this: Element, ...nodes: (Node | string)[]) { nodes.forEach((n) => typeof n !== "string" && track(this, n)); return prepend.apply(this, nodes); };

  const st = window.setTimeout, si = window.setInterval, raf = window.requestAnimationFrame;
  window.setTimeout = function (...a: Parameters<typeof setTimeout>) {
    const id = st.apply(window, a) as unknown as number;
    const sb = current; if (sb && fromPage()) sb.timeouts.add(id);
    return id;
  } as typeof window.setTimeout;
  window.setInterval = function (...a: Parameters<typeof setInterval>) {
    const id = si.apply(window, a) as unknown as number;
    const sb = current; if (sb && fromPage()) sb.intervals.add(id);
    return id;
  } as typeof window.setInterval;
  window.requestAnimationFrame = function (cb: FrameRequestCallback) {
    const sb = current;
    if (sb && fromPage()) return raf.call(window, (t) => { if (!sb.dead) cb(t); });
    return raf.call(window, cb);
  };

  for (const name of ["IntersectionObserver", "ResizeObserver", "MutationObserver"] as const) {
    const Orig = window[name] as unknown as new (...a: unknown[]) => { disconnect(): void };
    if (!Orig) continue;
    const Wrapped = class extends Orig {
      constructor(...a: unknown[]) {
        super(...a);
        const sb = current; if (sb && fromPage()) sb.observers.push(this);
      }
    };
    (window as unknown as Record<string, unknown>)[name] = Wrapped;
  }
}

function cleanup(sb: Sandbox) {
  sb.dead = true;
  sb.queue = null;
  for (const [t, type, fn, opt] of sb.listeners) t.removeEventListener(type, fn, opt);
  sb.timeouts.forEach((id) => clearTimeout(id));
  sb.intervals.forEach((id) => clearInterval(id));
  sb.observers.forEach((o) => { try { o.disconnect(); } catch {} });
  // only nodes the page put into <body>/<head> itself; everything React rendered is left to React
  for (const n of sb.nodes) {
    if (!n.parentNode || (n.parentNode !== document.body && n.parentNode !== document.head)) continue;
    if (n.nodeType === 1 && ((n as Element).classList.contains("pt-veil") || (n as Element).id === "pt-style")) continue; // the demo transition hands its veil (and its style) to the next page
    n.parentNode.removeChild(n);
  }
  if (pristine) {
    const set = (el: Element, [cls, style]: [string | null, string | null]) => {
      if (cls === null) el.removeAttribute("class"); else el.setAttribute("class", cls);
      if (style === null) el.removeAttribute("style"); else el.setAttribute("style", style);
    };
    set(document.documentElement, pristine.html);
    set(document.body, pristine.body);
  }
  if (current === sb) current = null;
}

function runInline(sb: Sandbox, s: PageScript) {
  const el = document.createElement("script");
  if (s.module) el.type = "module";
  el.textContent = s.code ?? "";
  sb.nodes.push(el);
  document.body.appendChild(el); // classic inline scripts run synchronously here
}

function runExternal(sb: Sandbox, s: PageScript) {
  return new Promise<void>((resolve) => {
    const el = document.createElement("script");
    if (s.module) el.type = "module";
    el.src = s.src!;
    el.async = false;
    el.onload = () => resolve();
    el.onerror = () => resolve();
    sb.nodes.push(el);
    document.body.appendChild(el);
  });
}

export default function PageRuntime({ slug, scripts }: { slug: string; scripts: PageScript[] }) {
  useEffect(() => {
    install();
    if (!pristine) {
      pristine = {
        html: [document.documentElement.getAttribute("class"), document.documentElement.getAttribute("style")],
        body: [document.body.getAttribute("class"), document.body.getAttribute("style")],
      };
    }
    const sb: Sandbox = {
      dead: false, queue: [], listeners: [], timeouts: new Set(), intervals: new Set(), observers: [],
      nodes: [],
    };
    current = sb;

    (async () => {
      // the page's stylesheets come first, so scripts that measure the layout see the styled page
      await (window as unknown as { __ucaasCss?: Promise<void> }).__ucaasCss;
      for (const s of scripts) {
        if (sb.dead) return;
        // the Motion library only needs loading once
        if (s.src && /motion(@[\d.]+)?\/dist\/motion(\.min)?\.js/.test(s.src) && (window as unknown as { Motion?: unknown }).Motion) continue;
        if (s.src) await runExternal(sb, s);
        else runInline(sb, s);
      }
      if (sb.dead) return;
      const queued = sb.queue || [];
      sb.queue = null;
      queued.filter((q) => q.type === "DOMContentLoaded").forEach((q) => call(q.fn, q.target, new Event("DOMContentLoaded")));
      queued.filter((q) => q.type === "load").forEach((q) => call(q.fn, q.target, new Event("load")));
    })();

    return () => cleanup(sb);
  }, [slug, scripts]);

  return null;
}
