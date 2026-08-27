import { getCollection } from 'astro:content';

import { SITE } from '../data/agent-surface.mjs';
import { libraries, totalItems } from '../data/libraries.mjs';

/** Absolute URL for a site path. */
export const abs = (path: string) => new URL(path, SITE).href;

export type ProjectRecord = {
  slug: string;
  url: string;
  markdownUrl: string;
  title: string;
  description: string;
  status: string;
  tags: string[];
  stack: string[];
  date: string;
  featured: boolean;
  archived: boolean;
  shelf?: string;
  builtOn?: string;
  repoUrl?: string;
  liveUrl?: string;
  releaseUrl?: string;
};

export type PostRecord = {
  slug: string;
  url: string;
  markdownUrl: string;
  title: string;
  description: string;
  pubDate: string;
  tags: string[];
  canonicalUrl?: string;
};

const iso = (date: Date) => date.toISOString().slice(0, 10);

export async function getProjects(): Promise<ProjectRecord[]> {
  const projects = await getCollection('projects');

  return projects
    .sort((a, b) => a.data.order - b.data.order || b.data.date.valueOf() - a.data.date.valueOf())
    .map((project) => ({
      slug: project.id,
      url: abs(`/projects/${project.id}/`),
      markdownUrl: abs(`/projects/${project.id}.md`),
      title: project.data.title,
      description: project.data.description,
      status: project.data.status,
      tags: project.data.tags,
      stack: project.data.stack,
      date: iso(project.data.date),
      featured: project.data.featured,
      archived: project.data.archived,
      shelf: project.data.shelf,
      builtOn: project.data.builtOn,
      repoUrl: project.data.repoUrl,
      liveUrl: project.data.liveUrl,
      releaseUrl: project.data.releaseUrl,
    }));
}

export async function getPosts(): Promise<PostRecord[]> {
  const posts = await getCollection('blog', ({ data }) => !data.draft);

  return posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      slug: post.id,
      url: abs(`/blog/${post.id}/`),
      markdownUrl: abs(`/blog/${post.id}.md`),
      title: post.data.title,
      description: post.data.description,
      pubDate: iso(post.data.pubDate),
      tags: post.data.tags,
      canonicalUrl: post.data.canonicalUrl,
    }));
}

/** The free guide libraries, flattened for machine consumers. */
export const libraryIndex = () => ({
  totalItems,
  libraries: libraries.map(({ id, name, url, summary, count, items, verified }) => ({
    id,
    name,
    url,
    summary,
    count,
    items,
    verified,
  })),
});
