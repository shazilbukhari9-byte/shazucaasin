"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

declare global {
  interface Window {
    __ucaasNavigate?: (href: string) => void;
  }
}

/**
 * The page markup uses plain <a href="/route"> links. This turns them into Next.js client-side navigation:
 * the next page is prefetched when a link is hovered or focused, and opens without a full page reload.
 * Links that open a new tab, download a file, point to another site or only jump within the page keep their normal behaviour.
 */
export default function LinkRouter() {
  const router = useRouter();
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  // A page opened from a link starts at its hero. Back / forward keep the position the browser restores,
  // and links with a #section jump to that section as usual.
  useEffect(() => {
    const onPop = () => { fromHistory.current = true; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    if (fromHistory.current) { fromHistory.current = false; return; }
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) { el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" }); return; }
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  // Header menus are rendered once the page is idle, so the first hover on a nav item opens instantly.
  useEffect(() => {
    const warm = () => document.querySelectorAll(".mega.cold").forEach((m) => m.classList.remove("cold"));
    const t = window.setTimeout(() => {
      const ric = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
      if (ric) ric(warm, { timeout: 1500 }); else warm();
    }, 900);
    return () => window.clearTimeout(t);
  }, [pathname]);

  // Looping CSS animations only run for sections that are on (or next to) the screen, so the rest of the page
  // costs nothing while scrolling.
  useEffect(() => {
    let io: IntersectionObserver | undefined;
    const t = window.setTimeout(() => {
      if (!("IntersectionObserver" in window)) return;
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => e.target.classList.toggle("anim-off", !e.isIntersecting)),
        { rootMargin: "200px 0px" },
      );
      document.querySelectorAll("#ucaas-page section, #ucaas-page .stage").forEach((el) => io!.observe(el));
    }, 900);
    return () => {
      window.clearTimeout(t);
      io?.disconnect();
    };
  }, [pathname]);

  // Timeline circles (.kx-tl) sit level with the first element of their step: the offset is measured here because steps differ
  // (a label on one page, a card or a button on another).
  useEffect(() => {
    const lists = Array.from(document.querySelectorAll<HTMLElement>("#ucaas-page .kx-tl"));
    if (!lists.length) return;
    const place = () => {
      lists.forEach((ol) => {
        ol.querySelectorAll<HTMLElement>(":scope > li").forEach((li) => {
          const first = li.firstElementChild as HTMLElement | null;
          if (!first) return;
          const y = first.offsetTop + Math.min(first.offsetHeight / 2, 22);
          li.style.setProperty("--tl-y", y + "px");
        });
      });
    };
    place();
    const t = window.setTimeout(place, 400);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(place) : null;
    lists.forEach((ol) => ro?.observe(ol));
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => {
      window.clearTimeout(t);
      ro?.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [pathname]);

  // Mobile / tablet menu: backdrop, scroll lock, X icon, Escape and outside-click to close, focus kept inside while open and
  // returned to the toggle on close. The page script owns the open state (the `hidden` attribute); this only observes and helps.
  useEffect(() => {
    const btn = document.getElementById("mbtn") as HTMLButtonElement | null;
    const menu = document.getElementById("mnav") as HTMLElement | null;
    if (!btn || !menu) return;
    const root = document.documentElement;
    const backdrop = document.createElement("div");
    backdrop.className = "mnav-backdrop";
    backdrop.setAttribute("aria-hidden", "true");
    document.body.appendChild(backdrop);
    // the same "Sign in" is already in the top bar
    menu.querySelectorAll<HTMLElement>("a[data-auth=signin]").forEach((a) => { a.hidden = true; a.style.display = "none"; });
    // an X icon shown while the menu is open
    if (!btn.querySelector(".x-ico")) {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("class", "i x-ico");
      svg.setAttribute("aria-hidden", "true");
      const p = document.createElementNS(ns, "path");
      p.setAttribute("d", "M6 6l12 12M18 6L6 18");
      p.setAttribute("fill", "none"); p.setAttribute("stroke", "currentColor"); p.setAttribute("stroke-width", "2"); p.setAttribute("stroke-linecap", "round");
      svg.appendChild(p);
      btn.appendChild(svg);
    }
    const isOpen = () => !menu.hidden;
    const sync = () => {
      const open = isOpen();
      root.classList.toggle("mnav-open", open);
      btn.setAttribute("aria-label", open ? "Close menu" : "Menu");
      if (open) {
        const first = menu.querySelector<HTMLElement>("button:not([hidden]), a[href]:not([hidden])");
        window.setTimeout(() => first?.focus({ preventScroll: true }), 30);
      }
    };
    const close = (refocus: boolean) => { if (isOpen()) { btn.click(); if (refocus) btn.focus(); } };
    const mo = new MutationObserver(sync);
    mo.observe(menu, { attributes: true, attributeFilter: ["hidden"] });
    const onKey = (e: KeyboardEvent) => {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.preventDefault(); close(true); return; }
      if (e.key !== "Tab") return;
      const items = [btn, ...Array.from(menu.querySelectorAll<HTMLElement>("button:not([hidden]), a[href]:not([hidden])"))].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1], cur = document.activeElement;
      if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
      else if (!items.includes(cur as HTMLElement)) { e.preventDefault(); first.focus(); }
    };
    const onDown = (e: MouseEvent) => {
      if (!isOpen()) return;
      const t = e.target as Node;
      if (!menu.contains(t) && !btn.contains(t)) close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    sync();
    return () => {
      mo.disconnect();
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
      backdrop.remove();
      root.classList.remove("mnav-open");
    };
  }, [pathname]);

  // Once the page is idle, the pages in the main menu are prefetched in small batches, so a click opens at once.
  // Skipped on data-saver and slow connections.
  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || (conn?.effectiveType && !/4g/.test(conn.effectiveType))) return;
    let cancelled = false;
    const timers: number[] = [];
    const start = window.setTimeout(() => {
      const seen = new Set<string>();
      const hrefs: string[] = [];
      document.querySelectorAll<HTMLAnchorElement>("header.nav a[href^=\"/\"], #ucaas-page .mega a[href^=\"/\"]").forEach((a) => {
        const u = new URL(a.href, location.href);
        if (u.origin !== location.origin || u.pathname === location.pathname || /\.[a-z0-9]+$/i.test(u.pathname) || u.pathname.startsWith("/assets/")) return;
        if (!seen.has(u.pathname)) { seen.add(u.pathname); hrefs.push(u.pathname); }
      });
      hrefs.slice(0, 8).forEach((h, i) => {
        timers.push(window.setTimeout(() => { if (!cancelled) router.prefetch(h); }, Math.floor(i / 3) * 500));
      });
    }, 3500);
    return () => { cancelled = true; window.clearTimeout(start); timers.forEach((x) => window.clearTimeout(x)); };
  }, [pathname, router]);

  useEffect(() => {
    const prefetched = new Set<string>();

    const internalPath = (a: HTMLAnchorElement): URL | null => {
      if (!a.href || a.hasAttribute("download")) return null;
      if (a.target && a.target !== "_self") return null;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return null;
      if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/_next/") || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
      return url;
    };

    const onClick = (e: MouseEvent) => {
      // runs on window, after the page's own click handlers, so links they already handled are left alone
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = internalPath(a);
      if (!url) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page: let the #hash jump happen
      e.preventDefault();
      router.push(url.pathname + url.search + url.hash);
    };

    const onIntent = (e: Event) => {
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const url = internalPath(a);
      if (!url || url.pathname === location.pathname || prefetched.has(url.pathname)) return;
      prefetched.add(url.pathname);
      router.prefetch(url.pathname);
    };

    window.__ucaasNavigate = (href: string) => router.push(href);
    window.addEventListener("click", onClick);
    document.addEventListener("mouseover", onIntent, { passive: true });
    document.addEventListener("focusin", onIntent);
    document.addEventListener("touchstart", onIntent, { passive: true });
    return () => {
      window.removeEventListener("click", onClick);
      document.removeEventListener("mouseover", onIntent);
      document.removeEventListener("focusin", onIntent);
      document.removeEventListener("touchstart", onIntent);
      delete window.__ucaasNavigate;
    };
  }, [router]);

  return null;
}
