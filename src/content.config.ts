import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

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
        .array(z.object({ src: image(), alt: z.string() }))
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
      shelf: z.enum(['zo', 'community', 'tools', 'side']).optional(),
      builtOn: z.enum(['zo']).optional(),
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

export const collections = { projects, blog };
