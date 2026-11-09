import { pathToFileURL } from 'node:url';
import { fetchFeed, parseFeed, postKey } from '../src/lib/substack-feed.mjs';

const SITE = 'https://jeffkazzee.dev';

/** Count an article only when the writing page actually links to it. */
export function missingPosts(posts, html, index) {
  const links = new Set();
  for (const [, href] of html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    try { links.add(postKey(new URL(href.replaceAll('&amp;', '&'), SITE).href)); } catch { /* Invalid links are not evidence. */ }
  }
  return posts.filter(post => {
    if (links.has(postKey(post.url))) return false;
    return !(index.posts ?? []).some(local => {
      if (!local.url) return false;
      try {
        const url = new URL(local.url);
        return url.origin === SITE && url.pathname.startsWith('/blog/') &&
          (local.slug === post.id || (local.canonicalUrl && postKey(local.canonicalUrl) === postKey(post.url))) &&
          links.has(postKey(local.url));
      } catch { return false; }
    });
  });
}

export async function checkRefresh({ fetchImpl = fetch } = {}) {
  const xml = await fetchFeed(undefined, { fetchImpl });
  const posts = parseFeed(xml);
  if (!xml.includes('</rss>') || posts.length === 0) throw new Error('Substack feed is incomplete or contains no usable posts');
  const read = async (path) => {
    const response = await fetchImpl(`${SITE}${path}`, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`HTTP ${response.status} reading ${path}`);
    return response;
  };
  const [page, content] = await Promise.all([read('/blog/'), read('/api/content.json')]);
  const index = await content.json();
  if (!Array.isArray(index.posts)) throw new Error('Content index has no posts array');
  return { checked: posts.length, missing: missingPosts(posts, await page.text(), index) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await checkRefresh();
    console.log(`Checked ${result.checked} feed posts; ${result.missing.length} missing from the writing page.`);
    for (const post of result.missing) console.log(`${post.pubDate} ${post.url}`);
    if (result.missing.length) process.exitCode = 1;

  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
