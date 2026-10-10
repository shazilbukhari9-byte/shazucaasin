# UCaaS website (Next.js)

The UCaaS marketing site as a Next.js 16 app (App Router). Every page keeps the design, layout, mockups, animations and features of the finished static site exactly as they were.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. The homepage is at `/`, every other page at `/<page>` (for example `/live-chat`, `/auth#signup`). Links between pages are app routes: the next page is prefetched when a link is hovered and opens without a full page reload, and the browser back/forward buttons work the same way. Old `page.html` addresses redirect to the matching route.

Production build:

```bash
npm run build
npm start
```

## How it is put together

| Path | What it is |
|---|---|
| `app/page.tsx` | Homepage route (`/`). |
| `app/[slug]/page.tsx` | All other pages, generated at build time (51 pages in total). |
| `components/StaticPage.tsx` | Renders a page: its own styles, then its markup. |
| `components/PageRuntime.tsx` | Runs the page's original scripts in their original order, and removes their listeners, timers, observers and added nodes when the visitor moves to another page. |
| `components/LinkRouter.tsx` | Turns the page links into Next.js client-side navigation with prefetching. |
| `lib/pages.ts` | Reads a page from `content/pages`. |
| `content/pages/*.json` | One file per page: title, description, styles, markup and scripts. |
| `public/assets/` | Shared CSS, JS, fonts, logo and favicon (served at `/assets/...`). |
| `scripts/import-static.mjs` | Re-imports the pages from the static site. |
| `next.config.ts` | Redirects `/<page>.html` to `/<page>`; Cache Components is off so each page is fully unmounted when you leave it. |

## Updating a page

The pages were imported from the static HTML site. To pick up changes made to that site, run:

```bash
npm run import-static -- "C:/Users/Windows 10 Pro/Downloads"
```

This rewrites `content/pages/*.json` and `public/assets/` from the HTML files in that folder.

## Backup

The static site this app was built from is backed up in `Downloads/ucaas-backup-2026-10-10/` and `Downloads/ucaas-backup-2026-10-10.zip`.
