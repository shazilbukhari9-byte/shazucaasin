import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaticPage from "@/components/StaticPage";
import { getPage, listSlugs } from "@/lib/pages";

// every page is generated at build time; any other slug is a 404
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return page ? { title: page.title, ...(page.description ? { description: page.description } : {}) } : {};
}

export default async function SitePage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return <StaticPage page={page} />;
}
