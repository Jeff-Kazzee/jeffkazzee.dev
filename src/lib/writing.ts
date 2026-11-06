import { getCollection } from 'astro:content';

import { postKey } from './substack-feed.mjs';

/** One row on a writing list: a mirrored post on this site, or a Substack post not mirrored yet. */
export type WritingItem = {
  id: string;
  title: string;
  description: string;
  pubDate: Date;
  href: string;
  /** True when the link leaves this site for Substack. */
  external: boolean;
};

/**
 * Every published essay, newest first.
 *
 * Mirrored posts in src/content/blog/ win. A feed post counts as mirrored when
 * a blog post has the same slug, or a canonicalUrl pointing at it. Once a post
 * is mirrored, its Substack link drops off the list on the next build.
 */
export async function getWriting(): Promise<WritingItem[]> {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  const feed = await getCollection('substack');

  const mirrored = new Set<string>();
  for (const post of blog) {
    mirrored.add(post.id);
    if (post.data.canonicalUrl) mirrored.add(postKey(post.data.canonicalUrl));
  }

  const local: WritingItem[] = blog.map((post) => ({
    id: post.id,
    title: post.data.title,
    description: post.data.description,
    pubDate: post.data.pubDate,
    href: `/blog/${post.id}/`,
    external: false,
  }));

  const remote: WritingItem[] = feed
    .filter((post) => !mirrored.has(post.id) && !mirrored.has(postKey(post.data.url)))
    .map((post) => ({
      id: post.id,
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      href: post.data.url,
      external: true,
    }));

  return [...local, ...remote].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}
