# jeffkazzee.dev

Personal site: the projects and the writing.

It is also a working example of an agent-ready site. Every page is served as
Markdown on request, and the site exposes an MCP server, an A2A agent card,
published agent skills, and the well-known discovery documents. See
[/for-agents/](https://jeffkazzee.dev/for-agents/), or the
[agent-ready-site skill](public/.well-known/agent-skills/agent-ready-site/SKILL.md)
that describes how it was done.

Built with [Astro](https://astro.build) and hand-rolled CSS. Deployed on
**Vercel**.

## Commands

| Command | Action |
| :--- | :--- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Type-check, build to `dist/`, then check the page weight budget |
| `npm run preview` | Serve the build locally |
| `npm run verify` | Check the agent surface against the build |
| `npm run agent-surface` | Regenerate the well-known documents only |
| `npm run budget` | Check the home page weight budget against the last build |
| `node scripts/localize-remote-images.mjs` | Copy Substack images in posts into the repo |

`agent-surface` runs automatically before `dev` and `build`.

## Layout

```
src/data/agent-surface.mjs  Endpoints, tools, skills, Link headers.
src/lib/agent-answers.mjs   The answers behind MCP, A2A, and WebMCP.
src/lib/mcp-server.mjs      MCP over Streamable HTTP.
src/lib/a2a-server.mjs      A2A JSON-RPC binding.
middleware.ts               Markdown negotiation and the two endpoints.
scripts/                    Surface generator, verifiers, DNS publisher.
scripts/lib/frontmatter.mjs Block-preserving front matter read and write.
```

Content lives in `src/content/projects/*.md` and `src/content/blog/*.md`. Blog
posts mirrored from Substack carry `canonicalUrl` pointing at the original.

## The two halves

**Static.** `astro build` produces the pages, a Markdown twin of every page, the
content index at `/api/content.json`, `robots.txt`, and `llms.txt`.
`scripts/build-agent-surface.mjs` writes the well-known documents from the data
modules before the build runs.

**Runtime.** `middleware.ts` is the only server-side code. It handles content
negotiation on `Accept`, the MCP endpoint, and the A2A endpoint. Link and
security headers live in `vercel.json` instead, so they survive even if the
middleware fails to deploy.

Vercel does not support `vercel.json` rewrites on Astro projects, which is why
negotiation runs in middleware rather than as a rewrite rule.

## Speed

The site is static HTML with no framework on the client. What makes it fast:

- **Instant navigation.** A `<script type="speculationrules">` in `BaseHead.astro` tells Chrome and Edge to render a page in the background once its link is hovered for about 200 ms (or pressed on a phone). The click shows a page that is already painted. Agent endpoints and raw files are excluded. Other browsers get Astro's hover prefetch.
- **No render-blocking requests.** CSS is inlined into each page. Fonts are self-hosted, Latin-subset, and only the body font is preloaded. Fallback fonts are scaled to the same width, so nothing moves when the real fonts arrive.
- **Images.** The hero is AVIF with a WebP fallback, 21 KB on a phone. Every image has width and height set. The first image on a page loads at once; the rest load lazily. Blog images are served from this site, not Substack.
- **Native page transitions.** `@view-transition` in `global.css` cross-fades between pages with no JavaScript router.
- **Service worker** (`public/sw.js`). Pages are network-first with a 3 second timeout, then the saved copy, then `/offline/`. Hashed `/_astro/` files are cache-first. The main pages are saved on install. It never handles `/api/`, `/.well-known/`, or `.md`/`.txt`/`.json`/`.xml`, so Markdown negotiation and the MCP and A2A endpoints always reach the network. To retire it, see the comment at the top of the file.
- **Budget.** `scripts/check-budget.mjs` fails the build if a first phone visit to the home page passes 240 KB. It is about 58 KB.

## Adding or changing a project

Project front matter drives the home page. `shelf` picks the section
(`community`, `tools`, or `side`), and omitting it keeps the project on
`/projects/` only. `metric` supplies one exact number to show where a
screenshot would go when there isn't one.

Then run the check:

```bash
npm run verify:projects -- --write
```

It fetches every `liveUrl`, follows redirects, and queries every `repoUrl` to
confirm the repository exists, isn't a fork of someone else's work, and holds
more than a README. Passing stamps `verified:` into the front matter, and the
build refuses to ship a shelved project without that stamp.

Three projects once described things that did not exist, and a second
hand-written link list on `/work-with-me/` carried two dead URLs under the
words "live right now". Both now derive from checked data.

Edit front matter through `scripts/lib/frontmatter.mjs`, not with regex. Ad-hoc
regex flattened every nested `screenshots:` block twice.

## Adding an agent skill

Create `public/.well-known/agent-skills/<name>/SKILL.md` with `name` and
`description` in the front matter. The build hashes it and adds it to
`index.json`. A skill missing a description fails the build.

## Verifying

```bash
npm run build && npm run verify
```

That drives the MCP and A2A handlers and checks every discovery document
against a real build. It does not exercise the deployed middleware, so after a
deploy check the live origin too:

```bash
curl -sI https://jeffkazzee.dev | grep -i '^link'
curl -s -D- -o /dev/null -H 'Accept: text/markdown' https://jeffkazzee.dev | grep -i 'content-type'
```

## DNS

The DNS-AID records are the one part of the agent surface that does not deploy
with the site. See [docs/dns-aid.md](docs/dns-aid.md).

## The other sites

Four of the other public sites ship an empty shell and publish almost nothing a
crawler or agent can read. Findings, priority, and the work each one needs:
[docs/agent-readiness-audit.md](docs/agent-readiness-audit.md).

```bash
npm run audit:properties
```

## Deploy

Vercel, framework preset **Astro**, build `npm run build`, output `dist`,
`NODE_VERSION=22`.
