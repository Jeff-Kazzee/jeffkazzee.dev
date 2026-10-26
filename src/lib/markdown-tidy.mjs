/**
 * Markdown plugin for Sätteri, Astro's Markdown processor. Two fixes applied
 * to every Markdown page (posts and project write-ups):
 *
 * 1. Headings run in order. The page title is the h1, so the body should
 *    start at h2. Posts mirrored from Substack start at h3, which skips a
 *    level for screen readers. Every heading moves up by the same amount, so
 *    the post keeps its own structure.
 *
 * 2. The first image loads at once. It is usually the largest thing on the
 *    first screen, so lazy loading it makes the reader wait. The rest stay
 *    lazy.
 *
 * The plugin is a factory so each document gets its own state.
 */

/** Smallest ATX heading level in the source, ignoring fenced code. */
function topHeading(source) {
  let top = 7;
  let fenced = false;
  for (const line of source.split('\n')) {
    if (/^\s{0,3}(```|~~~)/.test(line)) fenced = !fenced;
    if (fenced) continue;
    const m = /^\s{0,3}(#{1,6})\s/.exec(line);
    if (m) top = Math.min(top, m[1].length);
  }
  return top;
}

export default function markdownTidy({ source }) {
  const top = topHeading(source);
  const shift = top < 7 && top > 2 ? top - 2 : 0;
  let firstImage = true;

  return {
    name: 'markdown-tidy',
    heading(node, ctx) {
      if (shift) ctx.setProperty(node, 'depth', node.depth - shift);
    },
    image(node, ctx) {
      if (!firstImage) return;
      firstImage = false;
      ctx.setProperty(node, 'data', {
        ...(node.data ?? {}),
        hProperties: { ...(node.data?.hProperties ?? {}), loading: 'eager', fetchpriority: 'high' },
      });
    },
  };
}
