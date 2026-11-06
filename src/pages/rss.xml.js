import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getGuides } from '../lib/content-index';

export async function GET(context) {
  const posts = (await getCollection('blog')).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );

  const guides = await getGuides();

  return rss({
    title: 'jeffkazzee.dev',
    description:
      'Essays and field notes on AI-assisted building from Jeff Kazzee.',
    site: context.site,
    items: [...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
    })), ...guides.map((guide) => ({
      title: guide.title,
      description: guide.description,
      pubDate: new Date(guide.pubDate),
      link: guide.url,
    }))].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()),
  });
}
