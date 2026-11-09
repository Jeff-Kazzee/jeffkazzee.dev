import { readFileSync } from 'node:fs';

/** Read the canonical emitted by BaseHead, independent of attribute order. */
export function htmlCanonical(html) {
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    if (!/\brel=["']canonical["']/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']+)["']/i)?.[1];
    return href?.replaceAll('&amp;', '&');
  }
}

/** Astro calls this after rendering its directory-format static pages. */
export function canonicalSitemapFilter(outDir) {
  return (page) => {
    const path = new URL(page).pathname.replace(/^\//, '');
    const html = readFileSync(new URL(`${path}index.html`, outDir), 'utf8');
    const canonical = htmlCanonical(html);
    if (!canonical) throw new Error(`Missing canonical on built page: ${page}`);
    const noindex = [...html.matchAll(/<meta\b[^>]*>/gi)].some(([tag]) =>
      /\bname=["']robots["']/i.test(tag) && /\bcontent=["'][^"']*\bnoindex\b/i.test(tag));
    return !noindex && canonical === page;
  };
}
