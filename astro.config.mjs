// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import markdownTidy from './src/lib/markdown-tidy.mjs';
import { canonicalSitemapFilter } from './src/lib/sitemap-policy.mjs';

// The filter reads the HTML emitted before the sitemap integration runs.
const outDir = './dist/';

export default defineConfig({
  outDir,
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
      filter: canonicalSitemapFilter(new URL(outDir, import.meta.url)),
    }),
  ],
  markdown: {
    processor: satteri({ mdastPlugins: [markdownTidy] }),
    shikiConfig: {
      theme: 'github-dark-high-contrast',
    },
  },
});
