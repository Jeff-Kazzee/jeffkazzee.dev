# Links

Every link a visitor can follow from a built page goes somewhere that answers.

## Sub-features

- `links-internal` returns 200 for every same-site `href` and `src` (A7).
- `links-external` returns no 5xx for any off-site link (A8).

## How to get to it (user POV)

- Click any link or load any image on any page of the site.

## Driving it with checks.mjs

Preconditions:

- Doctor passes.

- **Internal.** Every `href` and `src` on every `dist/**/*.html` that resolves to `https://jeffkazzee.dev` or a root path is fetched from the local server, following redirects. Each must end at 200. `/api/*` is fetched from live, because Vercel middleware serves it.
- **External.** Each unique off-site URL gets a HEAD, then a GET when HEAD fails or returns 4xx or more, with a 12 second timeout. A 5xx fails. A 4xx, a timeout or a network error is a WARN line.

## Gotchas

- Many sites refuse bots: LinkedIn returns 999, several news and AI sites return 403. Those are WARN lines, not failures.
- A host that is down returns 503 or similar. That is the failure class that
  caught the retired Zo sites.
- Rows in the Known defects table of `acceptance.md` report as KNOWN. Remove a
  row when its fix lands. The table is read from `origin/main`, so a branch
  cannot add a row for its own broken link.
- Known gap, not yet fixed (review of 2026-11-01): a host that answers HEAD with
  200 but GET with 503 passes A8, because GET runs only after a failed HEAD. A
  visitor's browser sends GET. Until the probe always uses GET, a passing A8
  does not rule this out.
