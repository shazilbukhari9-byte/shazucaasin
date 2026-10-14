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
