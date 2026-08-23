// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const siteUrl = new URL('https://jeffkazzee.dev');
const blogDirectory = fileURLToPath(new URL('./src/content/blog/', import.meta.url));

/**
 * @param {string} directory
 * @returns {string[]}
 */
function findMarkdownFiles(directory) {
  /** @type {string[]} */
  const files = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(path));
      continue;
    }

    if (!entry.isFile() || extname(entry.name) !== '.md' || entry.name.startsWith('_')) continue;

    files.push(path);
  }

  return files;
}

function findExternallyCanonicalBlogPaths() {
  const paths = new Set();

  for (const file of findMarkdownFiles(blogDirectory)) {
    const source = readFileSync(file, 'utf8');
    const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)?.[1];
    const match = frontmatter?.match(
      /^canonicalUrl:\s*(?:"([^"]+)"|'([^']+)'|(\S+))\s*$/m,
    );
    const value = match?.slice(1).find(Boolean);

    if (!value) continue;

    const canonicalUrl = new URL(value, siteUrl);
    if (canonicalUrl.origin === siteUrl.origin) continue;

    const extension = extname(file);
    const slug = relative(blogDirectory, file)
      .slice(0, -extension.length)
      .split(sep)
      .join('/');

    paths.add(`/blog/${slug}`);
  }

  return paths;
}

const excludedSitemapPaths = new Set([
  '/contact-thanks',
  '/projects/obscura',
  ...findExternallyCanonicalBlogPaths(),
]);

/** @param {string} page */
function includeInSitemap(page) {
  const pathname = new URL(page).pathname.replace(/\/+$/, '') || '/';
  return !excludedSitemapPaths.has(pathname);
}

export default defineConfig({
  site: siteUrl.href,
  integrations: [sitemap({ filter: includeInSitemap })],
  vite: {
    environments: {
      astro: {
        optimizeDeps: {
          // Astro's content loader reaches this CommonJS dependency outside Vite's scan.
          include: ['picomatch'],
        },
      },
    },
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-high-contrast',
    },
  },
});
