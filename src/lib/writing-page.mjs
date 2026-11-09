import { fetchFeed, parseFeed } from './substack-feed.mjs';
import { mergeWriting, renderWritingCard } from './writing-list.mjs';

// Astro adds scoped attributes to these tags; match their IDs, not exact markup.
const START = /<template\b[^>]*\bid="writing-start"[^>]*><\/template>/;
const END = /<template\b[^>]*\bid="writing-end"[^>]*><\/template>/;

/** Refresh on reads, coalescing concurrent requests. Cache is per warm function instance. */
export function createWritingPage({ template, localPosts, fetchImpl = fetch, now = Date.now }) {
  const start = START.exec(template);
  const end = END.exec(template);
  if (!start || !end || end.index < start.index) throw new Error('Built Writing page is missing its article boundaries');
  let html = template;
  let fresh = false;
  let retryAt = 0;
  let pending;
  return async () => {
    if (now() < retryAt) return { html, fresh };
    if (pending) return pending;
    pending = (async () => {
      try {
        const xml = await fetchFeed(undefined, { timeoutMs: 2000, fetchImpl });
        if (!xml.includes('</rss>')) throw new Error('Incomplete feed');
        const posts = parseFeed(xml).filter(post => {
          const url = new URL(post.url);
          return url.hostname.replace(/^www\./, '') === 'jeffkazzee.substack.com' && url.pathname.startsWith('/p/');
        });
        if (!posts.length) throw new Error('No usable feed posts');
        const cards = mergeWriting(localPosts, posts).map(renderWritingCard).join('');
        html = template.slice(0, start.index + start[0].length) + cards + template.slice(end.index);
        fresh = true;
        retryAt = now() + 60000;
      } catch {
        // Never replace working HTML with an outage/partial feed. Cold instances
        // have the complete static page; warm instances keep their last good HTML.
        fresh = false;
        retryAt = now() + 30000;
      }
      return { html, fresh };
    })();
    try { return await pending; } finally { pending = undefined; }
  };
}
