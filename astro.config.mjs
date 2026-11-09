// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import markdownTidy from './src/lib/markdown-tidy.mjs';

/** Reached only after an action, so there is nothing here to rank for. */
const NOINDEX_PAGES = ['/contact-thanks/', '/offline/'];

/** These mirrors identify Substack as their canonical location. */
const EXTERNAL_CANONICAL_PAGES = [
  '/blog/cheap-ai-was-a-sale-the-bill-is-coming/',
  '/blog/how-to-learn-with-ai-without-getting/',
  '/blog/techs-silence-on-ice-is-not-neutral/',
  '/blog/whose-computer-are-you-building-on/',
];
const SITEMAP_EXCLUDED_PAGES = new Set([
  ...NOINDEX_PAGES, ...EXTERNAL_CANONICAL_PAGES,
]);

export default defineConfig({
  // src/scripts/sentry.ts reports these as its environment and release, so
  // Vercel previews do not count as production. A build outside Vercel
  // reports environment "local" and no release.
  vite: {
    define: {
      'import.meta.env.VERCEL_ENV': JSON.stringify(process.env.VERCEL_ENV ?? 'local'),
      'import.meta.env.VERCEL_GIT_COMMIT_SHA': JSON.stringify(process.env.VERCEL_GIT_COMMIT_SHA ?? ''),
    },
  },
  site: 'https://jeffkazzee.dev',
  // Astro 7 defaults to 'jsx', which drops the space between inline elements
  // ("are Vivary," renders as "areVivary,"). Keep the HTML-aware behavior.
  compressHTML: true,
  // Fallback for browsers without the Speculation Rules API (see BaseHead):
  // fetch a page when its link is hovered, so the click still feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Put the CSS in the page. The first paint then waits on nothing but the
  // HTML itself: no second round trip for a stylesheet.
  build: { inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      // Advertise canonical pages; keep intentional noindex pages excluded.
      filter: (page) => !SITEMAP_EXCLUDED_PAGES.has(new URL(page).pathname),
    }),
  ],
  markdown: {
    processor: satteri({ mdastPlugins: [markdownTidy] }),
    shikiConfig: {
      theme: 'github-dark-high-contrast',
    },
  },
});
