"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Card carousels (`.kx-hs`, `.ch-car-t`, `.ch-hs`) have no arrow buttons or dots. When the section fits on screen it is pinned while the
 * page scrolls and the cards slide sideways with the scroll; once the last card is reached the page carries on to the next section.
 * If the section is taller than the screen, or the visitor prefers reduced motion, the cards stay a normal swipeable row.
 */
const SCROLLERS = ".kx-hs, .ch-car-t, .ch-hs";
const TOP_GAP = 92; // clears the floating header

type Pin = { sec: HTMLElement; wrap: HTMLElement; par: HTMLElement; track: HTMLElement; extra: number; max: number; off: number; stick: number };

export default function ScrollCarousels() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let pins: Pin[] = [];
    let raf = 0;
    let timer = 0;

    const teardown = () => {
      pins.forEach(({ sec, wrap, par, track }) => {
        par.style.height = ""; sec.style.overflow = "";
        wrap.style.position = ""; wrap.style.top = "";
        track.classList.remove("sc-pinned"); track.scrollLeft = 0;
      });
      pins = [];
    };

    const update = () => {
      raf = 0;
      for (const p of pins) {
        const t = p.par.getBoundingClientRect().top;
        const prog = Math.min(1, Math.max(0, (p.stick - p.off - t) / p.extra));
        p.track.scrollLeft = prog * p.max;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    const setup = () => {
      teardown();
      if (reduce) return;
      const vh = window.innerHeight;
      document.querySelectorAll<HTMLElement>(SCROLLERS).forEach((track) => {
        const sec = track.closest("section") as HTMLElement | null;
        if (!sec) return;
        const max = track.scrollWidth - track.clientWidth;
        if (max < 40) return;
        // pin the whole section when it fits on screen, otherwise just the row of cards
        const whole = Array.from(sec.children).find((c) => c.contains(track)) as HTMLElement | undefined;
        let wrap: HTMLElement | undefined = whole;
        if (!wrap || wrap.getBoundingClientRect().height > vh - TOP_GAP - 16) {
          const row = track.closest(".kx-hswrap, .ch-car") as HTMLElement | null;
          wrap = row && row !== sec ? row : track;
        }
        const par = wrap.parentElement as HTMLElement | null;
        const wrapH = wrap.getBoundingClientRect().height;
        if (!par || wrapH > vh - TOP_GAP - 16) return; // does not fit: keep the swipeable row
        const stick = Math.max(TOP_GAP, Math.round((vh - wrapH) / 2));
        const extra = Math.min(max, Math.round(vh * 2.4));
        const off = wrap.getBoundingClientRect().top - par.getBoundingClientRect().top;
        par.style.height = par.offsetHeight + extra + "px";
        sec.style.overflow = "visible";
        wrap.style.position = "sticky";
        wrap.style.top = stick + "px";
        track.classList.add("sc-pinned");
        pins.push({ sec, wrap, par, track, extra, max, off, stick });
      });
      update();
    };

    const start = () => { window.clearTimeout(timer); timer = window.setTimeout(setup, 350); };
    start();
    window.addEventListener("load", start);
    window.addEventListener("resize", start);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      window.removeEventListener("load", start);
      window.removeEventListener("resize", start);
      window.removeEventListener("scroll", onScroll);
      teardown();
    };
  }, [pathname]);

  return null;
}
