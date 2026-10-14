"use client";

import { useLayoutEffect } from "react";

declare global {
  interface Window {
    __ucaasCss?: Promise<void>;
  }
}

const HEAL_KEY = "ucaas-heal";

/** Reload the page once (never in a loop) when a stylesheet could not be loaded, so a visitor never stays on an unstyled page. */
function heal() {
  try {
    const last = Number(sessionStorage.getItem(HEAL_KEY) || 0);
    if (Date.now() - last < 15000) return false;
    sessionStorage.setItem(HEAL_KEY, String(Date.now()));
  } catch {
    /* storage blocked: still try once below */
  }
  window.location.reload();
  return true;
}

/**
 * A page's stylesheets are <link> tags inside its markup. When the visitor moves to another page without a reload,
 * those links are inserted together with the markup, so the browser would paint the new page before its CSS arrives.
 * This keeps the new page invisible (the old one is already gone) until every stylesheet has loaded, then reveals it
 * in one step. Page scripts wait for the same promise so they never measure an unstyled page.
 *
 * If a stylesheet fails to load (network drop, or a new release replaced the file while the tab was open) the page is
 * reloaded once so it comes back fully styled instead of broken.
 */
/** For a moment after a page appears, CSS transitions on it are off, so it shows at once instead of easing from its initial state. */
function arrive(root: HTMLElement) {
  root.classList.add("ucaas-arrive");
  // what is already on screen is shown at once; the rest still reveals as it is scrolled into view
  const h = window.innerHeight;
  document.querySelectorAll<HTMLElement>("#ucaas-page .rv, #ucaas-page [data-r]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < h + 40 && r.bottom > -40) el.classList.add(el.hasAttribute("data-r") ? "kx-seen" : "in");
  });
  window.setTimeout(() => root.classList.remove("ucaas-arrive"), 900);
}

export default function StyleGate({ slug }: { slug: string }) {
  useLayoutEffect(() => {
    const root = document.documentElement;
    arrive(root);
    const links = [...document.querySelectorAll<HTMLLinkElement>("#ucaas-head link[rel='stylesheet']")];
    const pending = links.filter((l) => !l.sheet);
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
      arrive(root);
    };
    window.__ucaasCss = new Promise<void>((resolve) => {
      let left = pending.length;
      let failed = false;
      const settle = () => {
        if (--left > 0) return;
        if (failed && heal()) return; // reloading: keep the page hidden until it comes back
        release();
        resolve();
      };
      pending.forEach((l) => {
        l.addEventListener("load", settle, { once: true });
        l.addEventListener("error", () => { failed = true; settle(); }, { once: true });
      });
      // a very slow connection: wait up to 12s, then recover with one reload instead of showing an unstyled page
      window.setTimeout(() => {
        if (done) return;
        if (pending.some((l) => !l.sheet) && heal()) return;
        release();
        resolve();
      }, 12000);
    });
    return () => release();
  }, [slug]);

  return null;
}
