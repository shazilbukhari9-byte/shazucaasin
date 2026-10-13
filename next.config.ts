import path from "node:path";
import type { NextConfig } from "next";

// The page content is read relative to the project folder, even when the dev server is started from another directory.
if (process.cwd() !== path.resolve(import.meta.dirname)) process.chdir(path.resolve(import.meta.dirname));

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(import.meta.dirname) },
  // Pages are plain static documents with their own scripts. Each page is fully unmounted when the visitor leaves it
  // (Cache Components would keep hidden copies of earlier pages in the DOM, and their styles and element ids would clash).
  cacheComponents: false,
  // the page scripts run once per page and are cleaned up on navigation; a second, simulated mount in development would run them twice
  reactStrictMode: false,
  async headers() {
    return [
      // the site CSS / JS keeps its file name between releases: always revalidate (a cheap 304), so a page and its styles never get out of step
      { source: "/assets/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }] },
      // fonts and the big shared stylesheets never change under the same name: cache them for a year (later rules win)
      { source: "/assets/fonts/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
      { source: "/assets/css/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  async redirects() {
    return [
      // old links and bookmarks: "page.html" -> "/page", and the homepage lives at "/"
      { source: "/ucaas-homepage.html", destination: "/", permanent: true },
      { source: "/ucaas-homepage", destination: "/", permanent: true },
      { source: "/:slug([a-z0-9-]+)\\.html", destination: "/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
