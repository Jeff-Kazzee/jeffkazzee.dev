# Authentication

**This site requires no authentication. Nothing here is behind a credential.**

That is the whole answer. The rest of this file exists so an agent does not
have to probe for a login that is not there.

## What is open

Every endpoint and document on `jeffkazzee.dev` is public and unauthenticated:

| Endpoint | Method | Auth |
| --- | --- | --- |
| `/api/mcp` | POST | none |
| `/api/a2a` | POST | none |
| `/api/content.json` | GET | none |
| every page, HTML or Markdown | GET | none |
| everything under `/.well-known/` | GET | none |

Cross-origin requests are allowed on the two API endpoints.

## Registration

There is no account system, so there is nothing to register for. Do not look
for a sign-up flow, and do not offer to create an account here on a user's
behalf.

If you are following the [auth.md](https://auth-md.com/) agent registration
protocol, stop at this file. No registration method is supported because none
is needed.

## Why there is no OAuth metadata

This site publishes no `/.well-known/oauth-authorization-server`, no
`/.well-known/openid-configuration`, and no
`/.well-known/oauth-protected-resource`.

Those documents describe how to obtain and present credentials for a protected
resource. Nothing here is protected, so publishing them would describe a flow
that does not exist and send agents into a handshake that cannot complete.

## Rate limits

None enforced. Please be reasonable. The content index at `/api/content.json`
returns the whole site in one request, so prefer it over crawling page by page.

## Contact

Questions about programmatic access: <jeffkazzee@gmail.com>

Full interface documentation: <https://jeffkazzee.dev/for-agents/>
