import PageRuntime from "@/components/PageRuntime";
import StyleGate from "@/components/StyleGate";
import type { StaticPageData } from "@/lib/pages";

/**
 * Renders one page of the UCaaS site exactly as it was designed:
 * its stylesheets first, then its markup, then its scripts (run on the client, and cleaned up when the visitor leaves).
 */
export default function StaticPage({ page }: { page: StaticPageData }) {
  return (
    <>
      {/* the page's own <style> and <link> tags, in their original order */}
      <div id="ucaas-head" hidden dangerouslySetInnerHTML={{ __html: page.head }} />
      {/* display: contents keeps the original body > header / main / footer layout */}
      <div id="ucaas-page" style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: page.body }} />
      <StyleGate key={`g-${page.slug}`} slug={page.slug} />
      <PageRuntime key={page.slug} slug={page.slug} scripts={page.scripts} />
    </>
  );
}
