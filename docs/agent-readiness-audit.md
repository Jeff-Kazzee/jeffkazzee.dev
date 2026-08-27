# Agent readiness across the public sites

jeffkazzee.dev is agent-ready. The other five sites are not, and four of them
publish almost nothing a crawler or an agent can read.

Numbers below were measured on 2026-08-27. They are a snapshot. Re-run the
measurement instead of trusting them:

```bash
npm run audit:properties
```

## What was measured

| Site | robots | signals | llms.txt | llms-full | sitemap | Link | md | crawlable HTML |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| jeffkazzee.dev | yes | yes | 5KB | 11KB | 26 | yes | yes | 3KB |
| Zo Deep Dives | yes | no | 37KB | **1,406KB** | 90 | no | no | **21KB** |
| Zo Computer 101 | yes | no | 25KB | 429KB | 67 | no | no | **33B** |
| Zo Cookbook | yes | no | 976B | 1KB | **1,237** | no | no | **47B** |
| Open World Factbook | **no** | no | **0B** | **0B** | **0** | no | no | 2KB |
| LLM Arcade | yes | no | 2KB | 2KB | 0 | no | no | **37B** |

"Crawlable HTML" is the text left after stripping scripts, styles, and tags:
what a search engine or an agent sees without running JavaScript. It is the
number that matters most, and it is the one that looks worst.

## The finding

Four sites are client-rendered applications that ship an empty shell. Zo
Cookbook serves 47 bytes of text for 1,162 recipes. Zo Computer 101 serves 33
bytes for 203 items. Nothing indexes them, and no agent reads them without
driving a browser.

Zo Deep Dives is the exception, and it is the exception because it already
renders a crawler fallback into `#root`. Same stack, same host, 21KB of real
text. **The pattern is already solved in your own work.** The other sites need
it copied, not invented.

## Priority

### 1. Open World Factbook

The worst state and the best opportunity.

No `robots.txt`, no sitemap, no `llms.txt`. 262 countries of open data
published as free forever, and right now nothing can take it.

It is also the strongest candidate for an MCP server anywhere in this set. The
content is structured, factual, and queryable, which is what a tool call is
for. "What is the population of Chad" should be a function call, not a page
fetch. An MCP server over open country data is a more interesting portfolio
piece than anything else on the list.

Work:

- Add `robots.txt` with Content Signals, a sitemap, `llms.txt`, and
  `llms-full.txt`.
- Render country data into the HTML so the pages exist without JavaScript.
- Publish an MCP server with tools such as `get_country`, `compare_countries`,
  and `search_countries`.
- Add Link headers and an API catalog.

### 2. Zo Cookbook

The largest corpus and the thinnest exposure. 1,237 URLs in the sitemap, a
976-byte `llms.txt`, and 47 bytes of HTML. The sitemap says the pages exist and
nothing says what is in them.

Work:

- Render recipe content into the HTML.
- Expand `llms.txt` and generate a real `llms-full.txt` from the recipe source.
- Add Content Signals and Link headers.

### 3. Zo Computer 101

Half solved. 429KB of `llms-full.txt` means an agent can already read the
corpus. 33 bytes of HTML means a search engine cannot, and only 67 of roughly
203 items are in the sitemap.

Work:

- Render guides into the HTML.
- Extend the sitemap to every guide and recipe.
- Add Content Signals and Link headers.

### 4. Zo Deep Dives

The closest to done. It has the crawler fallback, a large `llms-full.txt`, an
editorial policy, and structured data.

Work:

- Add Content Signals to `robots.txt`.
- Add Link headers.
- Add Markdown content negotiation.

### 5. LLM Arcade

Different problem. 37 bytes of HTML, no sitemap, and a meta description that
still reads "Opening soon" while the arcade is open. Search engines and social
previews describe a closed arcade with no games.

Work:

- Fix the meta description first. It costs one line and it is wrong on every
  share.
- Render the game list and each game's description into the HTML.
- Add a sitemap.

## How to do the work

The procedure is written down and published:

- [agent-ready-site](https://jeffkazzee.dev/.well-known/agent-skills/agent-ready-site/SKILL.md),
  which covers every document, the exact paths scanners probe, and the mistakes
  that waste the most time.
- This repository is the worked example. `src/pages/[...path].md.ts` generates
  the Markdown twins, `scripts/build-agent-surface.mjs` writes the well-known
  documents, and `middleware.ts` handles content negotiation.

Two lessons from doing it here that are worth carrying over:

1. **Check the deployed origin, not a local preview.** A `_headers` file sat in
   this repository for months doing nothing, because the site runs on Vercel and
   that file only works on Cloudflare Pages and Netlify.
2. **Publish only what you can back.** A discovery document pointing at a dead
   endpoint is worse than no document. An agent trusts it, calls it, and fails.

## Verifying any of them

```bash
curl -sI https://example.com | grep -i '^link'
curl -s -D- -o /dev/null -H 'Accept: text/markdown' https://example.com | grep -i 'content-type'
curl -s https://example.com/robots.txt
curl -s https://example.com/llms.txt | head
```

For the full readiness scan:

```bash
curl -s -X POST https://isitagentready.com/api/scan \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```
