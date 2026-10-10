import fs from "node:fs";
import path from "node:path";

export type PageScript = {
  src?: string;
  code?: string;
  mode: "head" | "sync" | "defer";
  module?: boolean;
};

export type StaticPageData = {
  slug: string;
  title: string;
  description: string | null;
  lang: string;
  bodyClass: string | null;
  head: string;
  body: string;
  scripts: PageScript[];
};

const DIR = path.join(process.cwd(), "content", "pages");

export const HOME_SLUG = "ucaas-homepage";

export async function listSlugs(): Promise<string[]> {
  const manifest = JSON.parse(fs.readFileSync(path.join(DIR, "_manifest.json"), "utf8")) as { slug: string }[];
  return manifest.map((p) => p.slug);
}

export async function getPage(slug: string): Promise<StaticPageData | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(DIR, `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as StaticPageData;
}
