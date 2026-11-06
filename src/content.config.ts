import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { fetchFeed, parseFeed } from './lib/substack-feed.mjs';

const projects = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      tags: z.array(z.string()).default([]),
      stack: z.array(z.string()).default([]),
      repoUrl: z.url().optional(),
      liveUrl: z.url().optional(),
      releaseUrl: z.url().optional(),
      screenshots: z
        .array(z.object({ src: image(), alt: z.string(), fit: z.enum(['cover', 'contain']).default('cover') }))
        .default([]),
      date: z.coerce.date(),
      featured: z.boolean().default(false),
      /** Earlier work kept for the record, out of the active rotation. */
      archived: z.boolean().default(false),
      /**
       * One number that sizes the project, shown where a screenshot would go
       * when there isn't one. Keep it exact and keep it checkable.
       */
      metric: z.object({ value: z.string(), label: z.string() }).optional(),
      /** Which homepage shelf this belongs on. Omit to keep it off the home page. */
      shelf: z.enum(['tools', 'side']).optional(),
      status: z
        .enum(['shipped', 'alpha', 'prototype', 'demo', 'wip', 'deprecated'])
        .default('wip'),
      order: z.number().default(99),
      /**
       * Date `npm run verify:projects` last confirmed the links resolve.
       * Required for anything shown on the home page, so an unchecked claim
       * cannot reach the site.
       */
      verified: z.coerce.date().optional(),
    })
    .superRefine((project, ctx) => {
      if (project.shelf && !project.archived && !project.verified) {
        ctx.addIssue({
          code: 'custom',
          message:
            'Listed on the home page but never verified. Run `npm run verify:projects -- --write`, or remove the shelf.',
          path: ['verified'],
        });
      }
    }),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    canonicalUrl: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

const guides = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    verifiedDate: z.coerce.date(),
    kind: z.enum(['guide', 'build-note', 'idea']),
    series: z.literal('deepseek-harness'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
  }),
});

/**
 * Posts from the public Substack feed, read at build time. The writing page
 * shows any of these that are not mirrored in `blog` yet, as links to Substack.
 *
 * A failed fetch, or a feed with no usable posts, must not fail the build: the
 * loader logs a warning and keeps whatever the store already holds (nothing on
 * a cold build, so the page lists mirrored posts only). Set
 * SUBSTACK_FEED=off to skip the fetch, for an offline build.
 */
const substack = defineCollection({
  loader: {
    name: 'substack-feed',
    load: async ({ store, logger, parseData }) => {
      if (process.env.SUBSTACK_FEED === 'off') {
        logger.info('SUBSTACK_FEED=off, skipping the Substack feed.');
        return;
      }

      let posts;
      try {
        const xml = await fetchFeed();
        // A 200 answer can still be an error page or a cut-off feed. Treat a
        // feed without its closing tag, or with no usable posts, as a failed
        // read, so the last good posts stay.
        if (!xml.includes('</rss>')) throw new Error('the feed is incomplete');
        posts = parseFeed(xml);
        if (posts.length === 0) throw new Error('no posts in the feed');
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        logger.warn(
          `Substack feed unavailable (${reason}). Keeping the posts from the last good read, if any.`,
        );
        return;
      }

      store.clear();
      for (const { id, ...post } of posts) {
        store.set({ id, data: await parseData({ id, data: post }) });
      }
      logger.info(`${posts.length} post(s) read from the Substack feed.`);
    },
  },
  schema: z.object({
    title: z.string(),
    url: z.url(),
    pubDate: z.coerce.date(),
    description: z.string(),
  }),
});

export const collections = { projects, blog, guides, substack };
