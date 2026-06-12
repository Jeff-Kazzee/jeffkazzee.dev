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
      builtOn: z.enum(['zo']).optional(),
      status: z
        .enum(['shipped', 'alpha', 'prototype', 'demo', 'wip'])
        .default('wip'),
      order: z.number().default(99),
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
