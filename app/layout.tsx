import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import LinkRouter from "@/components/LinkRouter";

export const metadata: Metadata = {
  title: "UCaaS",
  description: "Unified Customer Experience Management Platform. Calls, messages, meetings and AI on one number.",
  icons: { icon: "/assets/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // the four Filson weights are used on every page; preloading them here (once, in the shared layout) means
  // moving between pages never re-inserts a preload for a font that is already loaded
  for (const n of [0, 1, 2, 3]) preload(`/assets/fonts/filson-${n}.woff2`, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  return (
    // the pages use smooth scrolling for in-page jumps; Next.js is told so it can pause it during route changes
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      {/* the page scripts add classes to <html> and <body> after load, so their attributes are allowed to differ */}
      <body suppressHydrationWarning>
        {children}
        <LinkRouter />
      </body>
    </html>
  );
}
