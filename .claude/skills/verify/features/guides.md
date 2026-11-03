# Guides

Feature scope, 2026-11-02: separate guides collection with publication-safe drafts.
The main navigation remains unchanged. Discover guides through Writing.

## Journeys

- Open Writing, then DeepSeek Harness. A7 checks these links.
- Published guide articles use the existing layout and source-check dates. A4,
  A5 and A10 cover their browser behavior, palette and CSP once published.
- A11 should report Writing as an intentional change. For agents intentionally updates the writing-tool description. The Harness hub
  and its articles are intentional new routes. Existing blog article canonicals do not change.
- Run `node --test scripts/guides.test.mjs` for publication-policy properties.
- Run `pnpm run verify` after a Linux build. Its guide checks scan generated files
  for every draft ID and sentinel marker, check public guide HTML, Markdown,
  RSS, sitemap, content API, llms files, MCP and A2A.

The answer key is unchanged and must come from origin/main. Full exact-tree
verification uses the existing Linux skill. CI now runs that full skill after
the build, agent-surface checks and property tests. CI records the tested SHA,
fetches the origin/main key, uploads evidence and always attempts cleanup.
The workflow has not been run for this unpublished tree.

Do not publish draft articles to make a route check pass. With no approved
articles the Harness hub is public, but contains no draft metadata.
