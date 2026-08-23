# Agent-readiness research: 2026-08-23

Status: static discovery implemented. This file does not implement any
authentication flow, payment flow, or agent service protocol.

## Scope and starting assumptions

The current site is a static Astro personal portfolio/blog deployed as static
files. It has no API, user account, OAuth authorization server, protected
resource, MCP server, published Agent Skill, product catalog, checkout, payment
handler, or commerce backend.

The existing machine-facing file is
[public/robots.txt](../../public/robots.txt). It allows crawling and points to
the sitemap. The existing site-wide response headers in
[public/_headers](../../public/_headers) are ordinary security headers. They
do not establish an agent protocol.

The source review below uses the official specification or proposal for each
item. "Publish now" means that a client could truthfully fetch it from this
site today. A route that is syntactically valid but advertises a service that
does not exist is not considered a useful implementation.

## Bottom line

For this site, publish **no new protocol endpoint**. Keep the existing
`robots.txt`, normal HTML, canonical metadata, and sitemap. Do not publish empty
catalogs, placeholder credentials, public
keys, payment challenges, or "agent cards" merely to look discoverable. Those
files are service advertisements and can cause clients to make requests that
the site cannot satisfy.

The site now publishes one advisory content-usage preference in robots.txt:
search and real-time AI answers may use the site, while model training may not.

The Cloudflare Content Signals syntax is a convention, not an IETF standard.
The IETF AI Preferences work uses a
different draft Content-Usage field. Do not publish both
with potentially contradictory values.

## Recommendation table

| Item | Current status and what it actually advertises | Decision for this static portfolio |
| --- | --- | --- |
| Content Signals / AIPREF | A robots preference about search, AI input, or training. Cloudflare documents Content-Signal. The IETF AI Preferences drafts define Content-Usage and the train-ai/search vocabulary. Neither is an access-control mechanism. | **Published.** `search=yes, ai-input=yes, ai-train=no` supports indexing and cited AI answers while reserving training rights. |
| Web Bot Auth | A draft HTTP Message Signatures protocol for authenticating automated HTTP clients to an origin, including key-directory discovery. It requires an origin that verifies signatures and has a key lifecycle. | **Do not publish.** A static public portfolio has no bot-gated resource or verifier. A key directory alone would make an unsupported identity claim. |
| RFC 9727 API Catalog | A Standards Track well-known URI for a publisher that has APIs. The catalog MUST contain hyperlinks to API endpoints and uses Linkset JSON. | **Do not publish.** There is no API to list. An empty catalog is not an API catalog. |
| OAuth/OIDC discovery and RFC 9728 | Metadata describing an actual OAuth authorization server, OIDC provider, or OAuth-protected resource. It contains real issuers, resource identifiers, and endpoint relationships. | **Do not publish.** Empty or invented metadata would make clients believe that authentication or a protected API exists. |
| auth.md | A service-authentication guide for an actual agent-facing service, with registration/claiming and credential details. It composes protected-resource metadata rather than replacing it. | **Do not publish.** "No auth here" is not an auth.md protocol implementation, and placeholder scopes or endpoints are harmful. |
| MCP Server Card | An experimental metadata extension for a real remote MCP server. The proposal is explicitly for prototyping and is not an official accepted MCP extension. | **Do not publish.** The portfolio has no Streamable HTTP MCP transport, tools, or server card to describe. |
| Agent Skills discovery index | A Cloudflare draft for indexing real SKILL.md or archive artifacts at a well-known path, with digests. | **Do not publish.** There are no skills to index. An invented name, URL, or digest is worse than no index. |
| WebMCP | A W3C Community Group draft JavaScript API for registering tools in a live web page (document.modelContext). It is not a well-known URL or server-discovery format. | **Do not add.** A static portfolio has no meaningful browser tool capability. Draft tool registration would add attack surface without a user task. |
| ARD / AI Catalog | An emerging catalog format/discovery convention for real AI artifacts such as MCP cards, skills, agents, or APIs. An empty entries array may be structurally allowed, but has no discoverable value. | **Do not publish.** There is no artifact to catalog. Do not imply that the personal site is an agent registry. |
| x402 | An HTTP 402 payment challenge and retry/settlement flow for a real paid resource. The v2 flow uses PAYMENT-REQUIRED, PAYMENT-SIGNATURE, and PAYMENT-RESPONSE. | **Do not publish.** A static 402 page or payment header without verification/settlement is a fake paid API. |
| MPP | A payment protocol and draft service-discovery convention for an actual paid API. The optional discovery proposal describes a real OpenAPI document and payment metadata. | **Do not publish.** There is no paid API, OpenAPI surface, or payment facilitator. |
| UCP | A commerce business profile and protocol for actual catalog, checkout/order, capability, identity, and payment-handler services. | **Do not publish.** The site sells no machine-discoverable product or checkout service. |
| ACP discovery | An unreleased/proposed checkout discovery document for a seller with a real ACP REST or MCP checkout API. | **Do not publish.** A skeleton /.well-known/acp.json would falsely advertise a seller and checkout API. |

## Detailed findings and future implementation boundaries

### 1. Content policies for AI use

[Content Signals](https://contentsignals.org/) describes a robots.txt
directive with search, ai-input, and ai-train values. Cloudflare's
[policy announcement](https://blog.cloudflare.com/content-signals-policy/)
shows the compatibility form:

~~~text
User-Agent: *
Content-Signal: search=yes, ai-train=no
Allow: /
~~~

This is an operator preference. It does not technically prevent a crawler from
fetching or using content. Omitting a signal expresses no preference. The
existing robots.txt is therefore already the truthful baseline.

The site uses one Content-Signal line in the existing wildcard group, served
as plain text:

~~~text
Content-Signal: search=yes, ai-input=yes, ai-train=no
~~~

This permits ordinary search indexing and real-time AI grounding. It reserves
permission for model training.

The IETF drafts differ. [draft-ietf-aipref-attach](https://datatracker.ietf.org/doc/draft-ietf-aipref-attach/)
defines a Content-Usage HTTP field and a Content-Usage robots rule, while
[draft-ietf-aipref-vocab](https://datatracker.ietf.org/doc/draft-ietf-aipref-vocab/)
defines train-ai and search values (y or n). The draft's example is
Content-Usage: train-ai=n, search=y.

It is still an Internet-Draft and says the preference is not a security
mechanism. It also does not define
the Cloudflare ai-input term. Do not present Content-Usage as a finalized
standard or silently add both spellings. The normative crawling baseline
remains [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html).

**Decision.** Keep the published compatibility preference and document its
advisory status. Re-check the IETF draft before adopting Content-Usage.

### 2. Web Bot authentication

The [Web Bot Auth working group](https://datatracker.ietf.org/wg/webbotauth/)
has an active, changing Internet-Draft,
[draft-meunier-webbotauth-httpsig-protocol](https://datatracker.ietf.org/doc/draft-meunier-webbotauth-httpsig-protocol/).
It uses HTTP Message Signatures for an automated client and a
Signature-Agent reference that a verifier can resolve to key material. The
draft's well-known key directory is:

~~~text
GET /.well-known/http-message-signatures-directory
Accept: application/http-message-signatures-directory+json

HTTP/1.1 200 OK
Content-Type: application/http-message-signatures-directory+json
~~~

That route is useful only when an origin verifies signed requests and rotates,
revokes, and attributes keys. A valid signature proves control of a key for
the signed request. It is not a blanket statement that an automated operator
is benign or authorized.

**Recommendation.** Do not create
public/.well-known/http-message-signatures-directory, and do not emit
Signature-Agent/Signature-Input/Signature headers. A static portfolio
has nothing to protect with this draft.

### 3. API catalogs under RFC 9727

[RFC 9727](https://www.rfc-editor.org/rfc/rfc9727.html) is a published IETF
Standards Track document for HTTPS servers that publish APIs.
An implementation supports GET /.well-known/api-catalog, and HEAD on that
URI includes the api-catalog link relation. The catalog MUST contain
hyperlinks to API endpoints and MUST support the Linkset media type:

~~~text
Content-Type: application/linkset+json
~~~

The optional Linkset profile parameter is
https://www.rfc-editor.org/info/rfc9727. A future static API publisher could
use public/.well-known/api-catalog only if every listed HTTPS endpoint is
real, maintained, and documented. A catalog with no endpoint hyperlinks does
not meet the purpose of RFC 9727.

**Recommendation.** Do not add the route or a Link header that declares the
api-catalog relation.

### 4. OAuth/OIDC discovery and RFC 9728

[RFC 8414](https://www.rfc-editor.org/rfc/rfc8414.html) defines OAuth
authorization-server metadata, normally at
/.well-known/oauth-authorization-server. OpenID Connect Discovery defines
/.well-known/openid-configuration for an OIDC issuer
([specification](https://openid.net/specs/openid-connect-discovery-1_0.html)).
Both documents describe real issuer and endpoint metadata. They are not
generic "this site supports agents" badges.


[RFC 9728](https://www.rfc-editor.org/rfc/rfc9728.html) defines protected
resource metadata. For a resource with no path, the general location is:

~~~text
GET /.well-known/oauth-protected-resource

HTTP/1.1 200 OK
Content-Type: application/json
~~~

The JSON object must identify the actual protected resource with resource
and may identify its authorization servers and supported bearer methods. If
the resource identifier includes a path, RFC 9728 inserts the well-known
segment before that path (for example,
/.well-known/oauth-protected-resource/resource1).

**Recommendation.** Publish none of these routes. If a future API needs
protection, first deploy the actual authorization and resource behavior, then
publish complete metadata whose issuer, resource identifier, and endpoints
resolve to that behavior. A static metadata file cannot substitute for OAuth
or OIDC.

### 5. auth.md

The [WorkOS auth.md repository](https://github.com/workos/auth.md) and its
[protocol documentation](https://workos.com/auth-md/docs) describe a
Markdown-based way for an agent to learn how to register, claim, or
authenticate to a real service.

The documentation includes agent-verified and
user-claimed flows and relies on actual credential issuance and protected
resource metadata. The repository's AUTH.md example documents the protocol.
A deployed service commonly exposes a lower-case /auth.md.

**Recommendation.** Do not add /auth.md or AUTH.md to the portfolio.
There is no account, registration, credential, scope, or protected API to
describe. If you later build an agent-facing service, publish a truthful
Markdown guide at the service origin and include only implemented flows,
scopes, URLs, and revocation behavior. Do not invent a "no auth required"
protocol page.

### 6. MCP Server Card proposal

The [MCP experimental Server Card repository](https://github.com/modelcontextprotocol/experimental-ext-server-card)
labels itself experimental and "not accepted or official" as an MCP
extension. Its current prototype uses a card route beneath a real Streamable
HTTP MCP server:

~~~text
GET <streamable-http-url>/server-card
Accept: application/mcp-server-card+json

Content-Type: application/mcp-server-card+json
~~~

The associated [discovery proposal](https://github.com/modelcontextprotocol/experimental-ext-server-card/blob/main/docs/discovery.md)
mentions an optional /.well-known/ai-catalog.json index. Older MCP proposals
used different well-known paths. A future implementation must pin the accepted
extension revision. Do not combine routes from old issues.

**Recommendation.** Do not add a Server Card, MCP well-known file, or AI
Catalog entry. The portfolio has no MCP transport or tools. A card would be
false.

### 7. Agent Skills discovery index

The [Cloudflare Agent Skills discovery proposal](https://github.com/cloudflare/agent-skills-discovery-rfc)
is a draft mechanism, not a finalized general standard. It defines:

~~~text
GET /.well-known/agent-skills/index.json
Content-Type: application/json
~~~

The top-level document uses the draft schema URL and a skills array. Each
entry needs a real name, type, description, url, and SHA-256 digest in
the form sha256:<64 lowercase hex characters>. The draft requires GET and
HEAD.

SKILL.md artifacts use text/markdown or text/plain. A .tar.gz file uses
application/gzip, and .zip uses application/zip. Clients must verify the
digest before use.

**Recommendation.** Do not add an index. The site does not publish a skill
artifact. If you later distribute a real skill, add
public/.well-known/agent-skills/index.json only with a digest computed from
the exact published artifact, and make the static host return the required
media types and HEAD behavior.

### 8. WebMCP

[WebMCP](https://webmachinelearning.github.io/webmcp/) is a Web Machine
Learning Community Group draft report, explicitly not a W3C Standard or
standards-track document. It is a browser API for a web application to expose
JavaScript tools through document.modelContext, including tool registration.
It is not a server-side discovery document.

**Recommendation.** Do not add a WebMCP script. A portfolio's semantic HTML,
ordinary links, sitemap, and accessible controls are useful to browsers and
agents already. Adding draft tool registration without a real, bounded task
would add client-side attack surface (including tool/prompt and output
injection concerns discussed by the draft) without creating a capability.

### 9. ARD and AI Catalog

The [AI Catalog specification](https://ai-catalog.io/spec/) defines the media
type application/ai-catalog+json and an optional automated discovery path:

~~~text
GET /.well-known/ai-catalog.json
Content-Type: application/ai-catalog+json
~~~

A minimal catalog has a specVersion and entries. Each real entry points to
an artifact via url or embeds data. The spec also allows an HTTP
Link header that declares the ai-catalog relation, or an HTML link with
type="application/ai-catalog+json".

The
[ARD specification](https://github.com/ards-project/ard-spec/blob/main/spec/ard.md)
uses the same well-known location as an optional static discovery surface and
also describes more involved registry/search behavior.

An empty catalog can be structurally harmless, but it does not make the
portfolio agent-ready and can imply that a catalog owner is maintaining
artifact discovery. The site has no MCP card, Agent Skill, agent,
API, or registry entry.

**Recommendation.** Do not add /.well-known/ai-catalog.json, an Agentmap
robots extension, or a catalog link. If you later publish a real artifact,
list only that artifact with its actual media type and stable HTTPS URL.

### 10. x402

[Coinbase's x402 documentation](https://docs.cdp.coinbase.com/x402/welcome)
describes an HTTP payment protocol. In the v2 flow, a real server returns 402
Payment Required with a PAYMENT-REQUIRED challenge. A client retries with
PAYMENT-SIGNATURE.

The server can report a successful settlement with
PAYMENT-RESPONSE. The [migration guide](https://docs.cdp.coinbase.com/x402/migration-guide)
documents the v2 header names and network identifiers.

**Recommendation.** Do not return 402 from a static page. Do not add payment
headers, wallet addresses, or an "x402 enabled" badge. A truthful
implementation requires a paid resource, challenge verification, settlement,
and a facilitator or equivalent backend. A static placeholder cannot provide
that behavior.

### 11. MPP

The [Tempo MPP repository](https://github.com/tempoxyz/mpp) and the
[payment discovery draft](https://paymentauth.org/draft-payment-discovery-00.html)
describe an emerging payment protocol and optional discovery for a real paid
HTTP API. The discovery draft uses an OpenAPI document at
GET /openapi.json, served as Content-Type: application/json, with payment
metadata such as x-payment-info on relevant paths and responses.

It recommends
Cache-Control: max-age=300. The runtime 402 challenge remains authoritative,
and the discovery document is not a substitute for payment behavior.

**Recommendation.** Do not add /openapi.json, an MPP challenge, a payment
credential, or a payment directory. If you build a paid API later, publish an
OpenAPI document that matches its live routes and MPP conformance. Then add the
discovery headers and cache policy that the chosen version requires.

### 12. UCP

[UCP's official repository](https://github.com/Universal-Commerce-Protocol/ucp)
and [specification](https://ucp.dev/2026-04-08/specification/overview/)
define a commerce profile for businesses, platforms, and agents. Clients
discover a business profile at:

~~~text
GET /.well-known/ucp
Content-Type: application/json
~~~

The profile is meaningful only when it declares actual services,
capabilities, payment handlers, and (where applicable) identity/signing
metadata. REST requests and responses use JSON, and an agent calling the
service can identify its profile with a UCP-Agent header. Those declarations
are contracts with checkout/order/catalog behavior, not descriptive prose.

**Recommendation.** Do not add /.well-known/ucp, a UCP-Agent header, a signing key,
payment handler, product catalog, or checkout endpoint. If the site becomes a
real commerce seller, implement the services first, then publish a profile
whose URLs, capabilities, and payment handlers are all live and tested.

### 13. ACP discovery

The official ACP repository's
[discovery RFC](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/blob/main/rfcs/rfc.discovery.md)
is explicitly a proposal with an unreleased version. It proposes:

~~~text
GET /.well-known/acp.json
Content-Type: application/json
Cache-Control: public, max-age=3600
~~~

The response must describe a real ACP seller with protocol, api_base_url,
a nonempty transports list including rest, and nonempty capabilities. The
proposal treats a 404 as "unsupported". The discovery document is not a
product catalog and does not create checkout behavior.

**Recommendation.** Do not add an ACP discovery file. Publish it only after a
real ACP REST or MCP checkout API exists. Generate the discovery object from
the implemented capabilities.

## Smallest future route/file map

These are conditional future surfaces, not files to add in this task:

| If the site later has… | Then the truthful surface could be… | Required response details |
| --- | --- | --- |
| A public API | public/.well-known/api-catalog | GET/HEAD, Linkset application/linkset+json, catalog hyperlinks to live API endpoints, and an optional RFC 9727 profile. |
| An OAuth-protected resource | /.well-known/oauth-protected-resource (or the RFC 9728 path-derived form) | 200, application/json, actual resource, real authorization-server metadata. |
| Its own OAuth/OIDC issuer | /.well-known/oauth-authorization-server or /.well-known/openid-configuration, or both | Complete metadata whose issuer, authorization, token, and JWKS URLs work. |
| Agent registration/authentication | /auth.md | Markdown describing only implemented registration/claiming, scopes, credentials, and revocation. |
| A verified bot boundary | public/.well-known/http-message-signatures-directory | Current Web Bot Auth draft media type and real keys, plus an origin verifier and rotation policy. |
| A real published Agent Skill | public/.well-known/agent-skills/index.json | application/json, valid draft schema/entries, an exact artifact digest, and SKILL.md served as Markdown/plain text. |
| A real AI artifact catalog | public/.well-known/ai-catalog.json | application/ai-catalog+json, specVersion, real entries, optional Link relation. |
| A remote MCP server | The actual server's /server-card route | An accepted MCP card revision, application/mcp-server-card+json, and a live Streamable HTTP transport. |
| A paid x402/MPP API | The actual payment middleware and, for MPP discovery, /openapi.json | Real 402 challenge, verification, and settlement. Add MPP OpenAPI JSON and payment metadata only when conformance is real. |
| UCP commerce | /.well-known/ucp | application/json profile with live services/capabilities/payment handlers. |
| ACP checkout | /.well-known/acp.json | application/json, cache policy, and required fields pointing to a live ACP API. |

## Decision rule

Do not add a machine-readable protocol surface because a client might someday
look for it. Add it when the site has the underlying capability, can return
the exact required media type and headers, and can keep every advertised URL,
key, digest, scope, capability, payment handler, and version current.

Until then, truthful HTML, `robots.txt`, a sitemap, and ordinary HTTP security
headers are the complete implementation.
