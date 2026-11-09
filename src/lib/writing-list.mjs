import { postKey } from './substack-feed.mjs';

/** Combine published local records and feed links using the existing mirror identity rule. */
export function mergeWriting(posts, feed) {
  const mirrored = new Set();
  const local = posts.map(post => {
    mirrored.add(post.slug);
    if (post.canonicalUrl) mirrored.add(postKey(post.canonicalUrl));
    return { id: post.slug, title: post.title, description: post.description,
      pubDate: new Date(post.pubDate), href: `/blog/${post.slug}/`, external: false };
  });
  const seen = new Set();
  const remote = feed.filter(post => {
    const key = postKey(post.url);
    if (mirrored.has(post.id) || mirrored.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(post => ({ id: post.id, title: post.title, description: post.description,
    pubDate: new Date(post.pubDate), href: post.url, external: true }));
  return [...local, ...remote].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}

const escape = value => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Same escaped card HTML for the static fallback and the runtime Writing page. */
export function renderWritingCard(post, index = 0) {
  const date = new Date(post.pubDate);
  const human = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
  return `<article class="post writing-post reveal" style="--i: ${index % 6}"><p class="date"><time datetime="${date.toISOString().slice(0, 10)}">${human}</time>${post.external ? '<span> · On Substack</span>' : ''}</p><h2><a href="${escape(post.href)}"${post.external ? ' rel="noopener"' : ''}>${escape(post.title)}</a></h2><p class="desc">${escape(post.description)}</p></article>`;
}
