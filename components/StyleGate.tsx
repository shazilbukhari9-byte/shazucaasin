"use client";

import { useLayoutEffect } from "react";

declare global {
  interface Window {
    __ucaasCss?: Promise<void>;
  }
}

/**
 * A page's stylesheets are <link> tags inside its markup. When the visitor moves to another page without a reload,
 * those links are inserted together with the markup, so the browser would paint the new page before its CSS arrives.
 * This keeps the new page invisible (the old one is already gone) until every stylesheet has loaded, then reveals it
 * in one step. Page scripts wait for the same promise so they never measure an unstyled page.
 */
export default function StyleGate({ slug }: { slug: string }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const pending = [...document.querySelectorAll<HTMLLinkElement>("#ucaas-head link[rel='stylesheet']")].filter((l) => !l.sheet);
    if (!pending.length) {
      window.__ucaasCss = Promise.resolve();
      return;
    }
    root.setAttribute("data-css-wait", "");
    let done = false;
    const release = () => {
      if (done) return;
      done = true;
      root.removeAttribute("data-css-wait");
    };
    window.__ucaasCss = new Promise<void>((resolve) => {
      let left = pending.length;
      const one = () => { if (--left <= 0) { release(); resolve(); } };
      pending.forEach((l) => {
        l.addEventListener("load", one, { once: true });
        l.addEventListener("error", one, { once: true });
      });
      // never leave the visitor on a blank page if a file is slow or blocked
      window.setTimeout(() => { release(); resolve(); }, 4000);
    });
    return () => release();
  }, [slug]);

  return null;
}
