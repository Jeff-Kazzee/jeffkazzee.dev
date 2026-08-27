import type { APIRoute } from 'astro';

import { SITE, availability, documents } from '../data/agent-surface.mjs';
import { libraries, totalItems } from '../data/libraries.mjs';
import { getPosts, getProjects } from '../lib/content-index';

export const GET: APIRoute = async () => {
  const projects = await getProjects();
  const posts = await getPosts();

  const libraryBlocks = libraries
    .map(
      (library) => `### ${library.name}

${library.summary}

- Size: ${library.count} (verified ${library.verified})
- Read it: ${library.url}
${library.examples.length ? `- Example guides: ${library.examples.join('; ')}` : ''}`,
    )
    .join('\n\n');

  const projectBlocks = projects
    .filter((project) => !project.archived)
    .map((project) => {
      const links = [
        project.repoUrl && `source ${project.repoUrl}`,
        project.liveUrl && `live ${project.liveUrl}`,
        project.releaseUrl && `download ${project.releaseUrl}`,
      ]
        .filter(Boolean)
        .join(', ');

      return `### ${project.title}

${project.description}

- Status: ${project.status}
- Stack: ${project.stack.join(', ') || 'not recorded'}
- Page: ${project.url} (Markdown: ${project.markdownUrl})
${links ? `- Links: ${links}` : ''}`;
    })
    .join('\n\n');

  const archived = projects.filter((project) => project.archived);

  const body = `# Jeff Kazzee, expanded index

Everything published at ${SITE}, in one file. Generated at build time from the
same source that renders the site, so this file and the pages cannot disagree.

Every page is also available as Markdown on its own: send \`Accept: text/markdown\`
or append \`.md\` to the path.

---

## Free guide libraries

${totalItems.toLocaleString('en-US')} guides and recipes for building real systems on Zo Computer, a
personal server you own. All public, no email gate.

${libraryBlocks}

---

## Projects

${projectBlocks}

${
  archived.length
    ? `### Archived

Earlier work, kept for the record and no longer under active development.

${archived.map((project) => `- ${project.title}: ${project.description} (${project.url})`).join('\n')}`
    : ''
}

---

## Writing

${posts
  .map(
    (post) => `### ${post.title}

${post.description}

- Published: ${post.pubDate}
- Page: ${post.url} (Markdown: ${post.markdownUrl})${post.canonicalUrl ? `\n- Original: ${post.canonicalUrl}` : ''}`,
  )
  .join('\n\n')}

---

## Machine interfaces

${documents.map((doc) => `- ${doc.title} (${doc.spec}): ${SITE}${doc.path}\n  ${doc.description}`).join('\n')}

---

## Availability and contact

Open to:
${availability.openTo.map((item) => `- ${item}`).join('\n')}

Contact:
${availability.contact.map((item) => `- ${item.label}: ${item.href}`).join('\n')}
`;

  return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
