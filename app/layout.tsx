import type { Metadata, Viewport } from "next";
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
  return (
    <html lang="en" suppressHydrationWarning>
      {/* the page scripts add classes to <html> and <body> after load, so their attributes are allowed to differ */}
      <body suppressHydrationWarning>
        {children}
        <LinkRouter />
      </body>
    </html>
  );
}
