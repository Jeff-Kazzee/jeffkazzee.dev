---
name: agent-ready-site
description: Make a static site readable and callable by AI agents. Covers Link headers, Content Signals, Markdown content negotiation, the well-known discovery documents, MCP and A2A endpoints, and DNS-AID records, with the exact paths scanners probe and the mistakes that silently break each one.
license: CC-BY-4.0
---

# Make a site agent-ready

Use this when a site should be discoverable and usable by AI agents, not only by
browsers and search crawlers. It assumes a static site behind a CDN. It is
written from a working implementation, so each section names the failure that
wastes the most time.

## Decide the honest surface first

Publish only what you can back. A discovery document that points at an endpoint
which returns 404, or an `auth.md` describing a registration flow the site does
not have, is worse than publishing nothing: an agent trusts it, calls it, and
fails.

Work through this list and mark each one real or not applicable:

| Document | Publish it when |
| --- | --- |
| `robots.txt` with Content Signals | Always |
| `llms.txt`, `llms-full.txt` | Always |
| Markdown twins of each page | Always |
| `/.well-known/api-catalog` | The site has at least one callable endpoint |
| `/.well-known/mcp/server-card.json` | An MCP endpoint answers |
| `/.well-known/agent-card.json` | An A2A endpoint answers |
| `/.well-known/agent-skills/index.json` | You publish skills of your own |
| `/.well-known/ard.json` | You have resources worth cataloguing |
| `auth.md` | Always. State the auth model, even when it is "none" |
| OAuth metadata | The site actually protects a resource |

A portfolio or documentation site usually has no accounts. Publish an `auth.md`
that says so plainly and lists the open endpoints: an agent then stops probing
for a login instead of guessing. Give it an H1 containing "auth.md", which is
what scanners look for.

Skip the OAuth documents entirely. They describe how to obtain and present
credentials for a protected resource, so publishing them for an open site
describes a handshake that cannot complete.

## Link headers, RFC 8288

Serve `Link` response headers on HTML responses pointing at the machine-readable
resources. Registered relation types that scanners look for are `api-catalog`,
`service-desc`, `service-doc`, and `describedby`.

```
Link: </.well-known/api-catalog>; rel="api-catalog", </.well-known/mcp/server-card.json>; rel="service-desc", </llms.txt>; rel="service-doc"
```

Multiple relations can share one header, comma separated, or be sent as separate
`Link` headers. Both are valid.

**The failure:** setting these in a host-specific file the host ignores. A
`_headers` file only works on Cloudflare Pages and Netlify. On Vercel the
equivalent is the `headers` array in `vercel.json`, or middleware. Verify with
`curl -sI https://example.com | grep -i '^link'` against the deployed site, not
against a local preview.

## Content Signals in robots.txt

Declare how the content may be used, inside the `User-agent` block it applies to:

```
User-agent: *
Allow: /
Content-Signal: ai-train=yes, search=yes, ai-input=yes
```

The three signals are independent. `search` covers indexing, `ai-input` covers
retrieval into a model's context at answer time, and `ai-train` covers training
data. A site that wants to be cited by assistants but not trained on sets
`ai-input=yes, ai-train=no`.

**The failure:** putting the directive above the first `User-agent` line, where
it belongs to nothing.

## Markdown content negotiation

When a request carries `Accept: text/markdown`, return Markdown instead of HTML
at the same URL, with `Content-Type: text/markdown`. Keep HTML the default.

Two parts:

1. **Generate the Markdown.** Emit a `.md` twin for every page at build time
   from the same source that renders the HTML. Generating it from the rendered
   HTML instead means a parser bug becomes a content bug.
2. **Serve it on negotiation.** Run one middleware that inspects `Accept`,
   fetches the twin, and returns it with the right content type. Add
   `Vary: Accept` so caches do not serve Markdown to a browser.

Set `X-Markdown-Tokens` to an estimated token count when you can. Scanners treat
it as optional.

**The failure:** a rewrite rule that loops. Exclude `.md` paths from the
middleware matcher, or the twin request re-enters negotiation.

## The well-known documents

Paths that scanners probe, exactly as written:

- `/.well-known/api-catalog` (no file extension, `application/linkset+json`)
- `/.well-known/mcp/server-card.json`
- `/.well-known/agent-card.json`
- `/.well-known/agent-skills/index.json`
- `/.well-known/ard.json`, with `/.well-known/ai-catalog.json` as the older path
- `/auth.md` at the site root, not under `.well-known`

**The failure:** the extensionless `api-catalog` file being served as
`application/octet-stream`, or a build tool skipping the `.well-known`
directory because the name starts with a dot. Check the built output directory
before deploying.

## ARD discovery has three entry points

Publish all three. They cost nothing and each is checked separately:

```
# robots.txt
Agentmap: https://example.com/.well-known/ard.json
```

```html
<link rel="ard" href="/.well-known/ard.json">
<link rel="ai-catalog" href="/.well-known/ai-catalog.json">
```

The manifest envelope requires a `specVersion` string. Without it a validator
rejects the whole document even when every entry inside it is correct.

Give every entry two to five `representativeQueries`. They are what semantic
retrieval matches against, so write the questions a user would actually ask, not
a description of the resource.

## MCP over Streamable HTTP

One endpoint that accepts POST. Revision `2026-07-28` removed the `initialize`
handshake and protocol-level sessions: protocol metadata now travels in
`_meta["io.modelcontextprotocol/protocolVersion"]` and is mirrored into the
`MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` headers.

Most deployed clients still open with `initialize`. Answer both eras from the
same endpoint: handle `initialize` when it arrives, and handle bare
`tools/list` and `tools/call` when it does not.

Respond to GET and DELETE with `405`. Answer an unknown method with `404` and
JSON-RPC error `-32601`, which is what distinguishes a modern server from a
legacy one that does not host the endpoint at all.

## DNS-AID

Publish SVCB or HTTPS records under the `_agents` namespace of the domain:

```
_index._agents.example.com. 3600 IN SVCB 1 example.com. alpn="h2" port=443
_mcp._agents.example.com.   3600 IN SVCB 1 example.com. alpn="h2" port=443
```

Sign the zone with DNSSEC so validating resolvers return authenticated data.

**The failure:** a DNS provider whose UI has no SVCB record type. Check before
promising it. A `TXT` record at `_index._agents` is accepted as a fallback by
some scanners but is not the specification.

## Verify against the deployed site

Local previews do not run CDN middleware. Check the real origin:

```bash
curl -sI https://example.com | grep -i '^link'
curl -s -D- -o /dev/null -H 'Accept: text/markdown' https://example.com | grep -i 'content-type'
curl -s https://example.com/robots.txt
curl -s https://example.com/.well-known/api-catalog | head
curl -s -X POST https://example.com/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```
