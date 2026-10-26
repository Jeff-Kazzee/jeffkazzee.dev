// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import markdownTidy from './src/lib/markdown-tidy.mjs';

/** Reached only after an action, so there is nothing here to rank for. */
const NOINDEX_PAGES = ['/contact-thanks/', '/offline/'];

export default defineConfig({
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
      // Pages a search engine has no reason to hold. Keep this in step with
      // the `noindex` prop on the page itself: the sitemap stops advertising
      // it, the meta tag stops it being indexed if something links to it.
      filter: (page) => !NOINDEX_PAGES.some((path) => page.endsWith(path)),
    }),
  ],
  markdown: {
    processor: satteri({ mdastPlugins: [markdownTidy] }),
    shikiConfig: {
      theme: 'github-dark-high-contrast',
    },
  },
});
