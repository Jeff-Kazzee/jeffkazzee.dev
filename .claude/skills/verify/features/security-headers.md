# Security headers

Every page carries the Content-Security-Policy from `vercel.json`, and every
origin that client code sends data to is allowed by it. Without that, the
browser silently drops the requests, for example Sentry error reports.

## Sub-features

- `csp-connect` allows each data origin found in client code (A10).
- `csp-enforced` shows no CSP violation in the browser on any page (A4).
- `csp-live` keeps the `vercel.json` policy equal to the live header (A11).

## How to get to it (user POV)

- Load any page. The browser applies the header before any script runs.

## Driving it with checks.mjs and browser.mjs

Preconditions:

- Doctor passes. `serve.mjs` sends the `vercel.json` headers.

- **Allowlist.** Client code is every `dist/_astro/*.js` file and every inline script except JSON-LD and speculation rules. Data origins are Sentry DSN hosts and literal URLs passed to `fetch`, `sendBeacon`, `EventSource` or `WebSocket`. Each must match `connect-src`, or `default-src` when `connect-src` is absent.
- **Enforced.** The browser journeys run with the real header. A blocked connection shows as an error log entry naming the policy, and A4 fails.
- **Live.** The `content-security-policy` header on live `/` is compared with `vercel.json`. A difference is CHANGED.

## Gotchas

- A10 finds the Sentry ingest host from the DSN. A12 checks the reporter the
  Error reporting table in `acceptance.md` names, so removing Sentry from the
  build fails A12 even though A10 then sees no origin to check.
- Requests to `*sentry.io*` are intercepted and failed inside the driven
  Chrome, so a run never reports to production. Chrome checks CSP first, so a
  violation still shows. A clean page load sends nothing, which is why A12
  throws an error on purpose and requires an error event for that exception.
- Known gap, not yet fixed (review of 2026-11-01): A10 finds origins only as
  string literals passed straight to `fetch`, `sendBeacon`, `EventSource` or
  `WebSocket`. A fetch to an endpoint held in a variable, inside a handler the
  browser journeys never trigger, is invisible to both A10 and A4.
