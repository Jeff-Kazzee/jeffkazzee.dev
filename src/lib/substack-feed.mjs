/**
 * Reads the public Substack RSS feed.
 *
 * Essays are mirrored into src/content/blog/ by hand, so the archive lives on
 * this domain. A new post can land on Substack before anyone mirrors it. The
 * build reads this feed so the writing page lists that post anyway, linking
 * straight to Substack until the mirror exists.
 *
 * No XML library: Substack's feed has a fixed, flat item shape, and this file
 * only needs four fields from each item. scripts/substack-feed.test.mjs pins
 * the parser to a saved copy of the feed.
 */

export const SUBSTACK_FEED_URL = 'https://jeffkazzee.substack.com/feed';

/** Longest summary shown on a card. Substack subtitles are short; this caps a long one. */
const MAX_DESCRIPTION = 280;

const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, code) => {
    if (code[0] === '#') {
      const point = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(point) ? String.fromCodePoint(point) : whole;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? whole;
  });
}

/** Text of the first <tag> in an item, with CDATA unwrapped, tags stripped and entities decoded. */
function field(item, tag) {
  const match = item.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`));
  if (!match) return '';
  const raw = match[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  // CDATA holds raw HTML: strip tags, then decode its entities. Plain XML text
  // is entity-encoded HTML: decode once, then strip. Never decode twice.
  const stripTags = (html) => html.replace(/<[^>]*>/g, ' ');
  const text = cdata ? decodeEntities(stripTags(cdata[1])) : stripTags(decodeEntities(raw));
  return text.replace(/\s+/g, ' ').trim();
}

function clip(text) {
  if (text.length <= MAX_DESCRIPTION) return text;
  const cut = text.slice(0, MAX_DESCRIPTION);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,.;:]+$/, '')}…`;
}

/**
 * The part of a post URL that stays the same between a feed link and a
 * mirrored post's canonicalUrl: host and path, no trailing slash, no query.
 */
export function postKey(url) {
  const parsed = new URL(url);
  return `${parsed.host.replace(/^www\./, '')}${parsed.pathname.replace(/\/+$/, '')}`;
}

/** The post's Substack slug: the last part of the path. */
export function slugFromUrl(url) {
  return new URL(url).pathname.replace(/\/+$/, '').split('/').pop() ?? '';
}

/**
 * Turns feed XML into posts, newest first. Items without a title, a valid
 * date, or an https link are dropped, because each one becomes a link on the
 * site.
 *
 * @param {string} xml
 * @returns {{ id: string, title: string, url: string, pubDate: string, description: string }[]}
 */
export function parseFeed(xml) {
  const posts = [];
  for (const [, item] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const title = field(item, 'title');
    const link = field(item, 'link');
    const date = new Date(field(item, 'pubDate'));

    let url;
    try {
      url = new URL(link);
    } catch {
      continue;
    }
    if (!title || url.protocol !== 'https:' || Number.isNaN(date.valueOf())) continue;

    url.search = '';
    url.hash = '';
    const id = slugFromUrl(url.href);
    if (!id) continue;

    posts.push({
      id,
      title,
      url: url.href,
      pubDate: date.toISOString(),
      description: clip(field(item, 'description')),
    });
  }
  return posts.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

/**
 * Fetches the feed text. Throws on a network error, a timeout, or a non-2xx
 * answer; the caller decides what a missing feed means.
 */
export async function fetchFeed(url = SUBSTACK_FEED_URL, { timeoutMs = 8000, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/rss+xml, application/xml;q=0.9', 'user-agent': 'jeffkazzee.dev build' },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.text();
}
