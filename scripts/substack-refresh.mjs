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

export async function requestBuild(hook, { fetchImpl = fetch } = {}) {
  if (!hook) throw new Error('Missing VERCEL_DEPLOY_HOOK_URL: configure an existing main-branch deploy hook before enabling refresh');
  const url = new URL(hook);
  if (url.protocol !== 'https:' || url.hostname !== 'api.vercel.com' || !url.pathname.startsWith('/v1/integrations/deploy/')) {
    throw new Error('Expected a Vercel HTTPS deploy hook');
  }
  // Never print the hook URL, response body, or network error (which can contain it).
  let response;
  try { response = await fetchImpl(hook, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(20000) }); }
  catch { throw new Error('Vercel build request failed; inspect the configured hook privately'); }
  if (!response.ok) throw new Error(`Vercel build request returned HTTP ${response.status}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await checkRefresh();
    console.log(`Checked ${result.checked} feed posts; ${result.missing.length} missing from the writing page.`);
    for (const post of result.missing) console.log(`${post.pubDate} ${post.url}`);
    if (result.missing.length) {
      if (process.argv.includes('--request-build')) {
        await requestBuild(process.env.VERCEL_DEPLOY_HOOK_URL);
        console.log('Build requested. This is not confirmation of deployment or article visibility; rerun the check after deployment.');
      } else process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
