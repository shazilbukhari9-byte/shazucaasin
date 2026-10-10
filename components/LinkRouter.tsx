"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
