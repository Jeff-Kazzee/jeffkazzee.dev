/**
 * WebMCP tool registration.
 *
 * Lets a browser-resident agent call this site's tools without leaving the
 * page. It costs nothing until a tool is called: the data is fetched lazily
 * from /api/content.json on first use.
 *
 * The API surface is still moving. The explainer puts it on
 * `document.modelContext`, several implementations and scanners look at
 * `navigator.modelContext`, and registration is either `registerTool` or
 * `provideContext`. All four combinations are handled, and a browser with
 * none of them runs nothing.
 */

type ToolResult = { content: { type: 'text'; text: string }[] };

type ToolDescriptor = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
};

/** Shape of /api/content.json, narrowed to what these tools read. */
type SiteIndex = {
  guides: {
    totalItems: number;
    libraries: { name: string; url: string; summary: string; count: string }[];
  };
  projects: {
    title: string;
    description: string;
    status: string;
    url: string;
    tags: string[];
    archived: boolean;
  }[];
};

type ModelContext = {
  registerTool?: (tool: ToolDescriptor) => unknown;
  provideContext?: (context: { tools: ToolDescriptor[] }) => unknown;
};

const text = (value: string): ToolResult => ({ content: [{ type: 'text', text: value }] });

let indexPromise: Promise<SiteIndex> | null = null;

const siteIndex = () => {
  indexPromise ??= fetch('/api/content.json').then((response) => response.json() as Promise<SiteIndex>);
  return indexPromise;
};

const tools: ToolDescriptor[] = [
  {
    name: 'list_guide_libraries',
    description:
      'List the free guide and recipe libraries published by this site, with how many are in each and where to read them.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    async execute() {
      const { guides } = await siteIndex();

      const lines = guides.libraries.map(
        (library) => `${library.name} (${library.count})\n  ${library.summary}\n  ${library.url}`,
      );

      return text(
        `${guides.totalItems.toLocaleString('en-US')} free guides and recipes.\n\n${lines.join('\n\n')}`,
      );
    },
  },
  {
    name: 'list_projects',
    description:
      'List the projects published on this site with status and links. Optionally filter by tag.',
    inputSchema: {
      type: 'object',
      properties: { tag: { type: 'string', description: 'Only projects carrying this tag.' } },
      additionalProperties: false,
    },
    async execute({ tag }) {
      const { projects } = await siteIndex();
      const matching = projects.filter(
        (project) => !project.archived && (!tag || project.tags.includes(String(tag))),
      );

      if (matching.length === 0) return text('No projects match that filter.');

      return text(
        matching
          .map(
            (project) => `${project.title} (${project.status}): ${project.description}\n  ${project.url}`,
          )
          .join('\n'),
      );
    },
  },
  {
    name: 'read_page',
    description:
      'Fetch any page of this site as Markdown. Pass a site path, for example / or /projects/llm-arcade/.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Site path beginning with a slash.' } },
      required: ['path'],
      additionalProperties: false,
    },
    async execute({ path }) {
      const requested = String(path ?? '/');
      if (!requested.startsWith('/')) return text('Path must begin with a slash.');

      const twin = requested === '/' ? '/index.md' : `${requested.replace(/\/+$/, '')}.md`;
      const response = await fetch(twin);

      return text(response.ok ? await response.text() : `No page at ${requested}.`);
    },
  },
];

function register(): void {
  const context: ModelContext | undefined =
    (navigator as unknown as { modelContext?: ModelContext }).modelContext ??
    (document as unknown as { modelContext?: ModelContext }).modelContext;

  if (!context) return;

  try {
    if (typeof context.provideContext === 'function') {
      context.provideContext({ tools });
      return;
    }

    if (typeof context.registerTool === 'function') {
      for (const tool of tools) context.registerTool(tool);
    }
  } catch {
    // A browser mid-way through implementing the proposal is not an error the
    // reader needs to see.
  }
}

register();

// The site uses Astro's client router, so re-register after a soft navigation.
document.addEventListener('astro:page-load', register);
