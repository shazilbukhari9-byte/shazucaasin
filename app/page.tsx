import type { Metadata } from "next";
import { notFound } from "next/navigation";
import StaticPage from "@/components/StaticPage";
import { getPage, HOME_SLUG } from "@/lib/pages";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(HOME_SLUG);
  return page ? { title: page.title, ...(page.description ? { description: page.description } : {}) } : {};
}

export default async function Home() {
  const page = await getPage(HOME_SLUG);
  if (!page) notFound();
  return <StaticPage page={page} />;
}
