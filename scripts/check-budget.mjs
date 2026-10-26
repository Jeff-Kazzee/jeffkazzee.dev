/**
 * Fails the build when the home page gets heavy.
 *
 * Counts what a first visit on a phone has to download before the page is
 * whole: the HTML, every stylesheet and script it links, the preloaded fonts,
 * and the smallest hero image in each format. Text files are counted gzipped,
 * the way they travel. Raise a limit on purpose, in this file, with a reason.
 *
 *     node scripts/check-budget.mjs
 */

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));

const BUDGET_KB = {
  /** HTML + CSS + JS, gzipped. */
  code: 60,
  /** Preloaded fonts. */
  fonts: 60,
  /** The hero image a phone downloads (smallest AVIF). */
  heroPhone: 140,
  /** Everything above, together. */
  total: 240,
};

const kb = (bytes) => bytes / 1024;
const html = readFileSync(join(DIST, 'index.html'), 'utf8');
const local = (url) => join(DIST, url.split('?')[0]);
const gz = (path) => gzipSync(readFileSync(path), { level: 9 }).length;

const unique = (re) => [...new Set([...html.matchAll(re)].map((m) => m[1]))].filter((u) => u.startsWith('/'));

const styles = unique(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g);
const scripts = unique(/<script[^>]+src="([^"]+)"/g);
const fonts = unique(/<link[^>]+rel="preload"[^>]+href="([^"]+\.woff2)"/g);

const avifSource = [...html.matchAll(/<source[^>]*>/g)].map((m) => m[0]).find((tag) => tag.includes('image/avif'));
const heroSrcset = avifSource?.match(/srcset="([^"]+)"/)?.[1] ?? '';
const heroPhone = heroSrcset
  .split(',')
  .map((s) => s.trim().split(/\s+/))
  .filter(([url]) => url?.startsWith('/'))
  .sort((a, b) => parseInt(a[1]) - parseInt(b[1]))[0]?.[0];

const sizes = {
  code: gzipSync(html, { level: 9 }).length + [...styles, ...scripts].reduce((n, u) => n + gz(local(u)), 0),
  fonts: fonts.reduce((n, u) => n + statSync(local(u)).size, 0),
  heroPhone: heroPhone ? statSync(local(heroPhone)).size : Infinity,
};
sizes.total = sizes.code + sizes.fonts + sizes.heroPhone;

let failed = false;
console.log('Home page budget (first visit, phone)\n');
for (const [key, limit] of Object.entries(BUDGET_KB)) {
  const used = kb(sizes[key]);
  const ok = used <= limit;
  failed ||= !ok;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${key.padEnd(10)} ${used.toFixed(1).padStart(6)} KB of ${limit} KB`);
}
console.log(`\n  ${styles.length} stylesheet(s), ${scripts.length} script(s), ${fonts.length} preloaded font(s)`);

if (!heroPhone) {
  console.error('\nNo AVIF hero found in dist/index.html. The hero should be a <Picture> with AVIF.');
  process.exit(1);
}
if (failed) {
  console.error('\nOver budget. Make it lighter, or raise the limit in scripts/check-budget.mjs with a reason.');
  process.exit(1);
}
