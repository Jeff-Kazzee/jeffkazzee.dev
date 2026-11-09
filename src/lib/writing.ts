import { getCollection } from 'astro:content';

import { mergeWriting } from './writing-list.mjs';

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
 * is mirrored, its Substack link drops off the list when that mirror is deployed.
 */
export async function getWriting(): Promise<WritingItem[]> {
  const blog = await getCollection('blog', ({ data }) => !data.draft);
  const feed = await getCollection('substack');

  return mergeWriting(
    blog.map(post => ({ slug: post.id, ...post.data })),
    feed.map(post => ({ id: post.id, ...post.data })),
  );
}
