// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/** Reached only after an action, so there is nothing here to rank for. */
const NOINDEX_PAGES = ['/contact-thanks/'];

export default defineConfig({
  site: 'https://jeffkazzee.dev',
  integrations: [
    sitemap({
      // Pages a search engine has no reason to hold. Keep this in step with
      // the `noindex` prop on the page itself: the sitemap stops advertising
      // it, the meta tag stops it being indexed if something links to it.
      filter: (page) => !NOINDEX_PAGES.some((path) => page.endsWith(path)),
    }),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark-high-contrast',
    },
  },
});
