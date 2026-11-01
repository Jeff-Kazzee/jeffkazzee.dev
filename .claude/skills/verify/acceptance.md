# Acceptance table

The answer key for `.claude/skills/verify`. Written 2026-11-01 against the live
site at `https://jeffkazzee.dev` (main at 096b721), before the skill drives
anything. The checks read their expected values from this file or from live
production, never from the build under test.

The checks read this file from `origin/main` only. A branch that edits it fails
the KEY check, and so does a run where `origin/main` has no readable copy. A
change to this file lands in its own reviewed PR before any branch relies on it.

## Visitor journeys

| ID | User action | Expected result | Check |
|---|---|---|---|
| A1 | Open the home page | Status 200. The heading reads "I build tools for working with AI." | browser |
| A2 | Click each main nav link from the home page | The browser lands on the destination in the nav table with its heading | browser |
| A3 | Click the "Jeff Kazzee" mark on an inner page | The browser lands on `/` | browser |
| A4 | Visit every page in the sitemap and the nav pages | No console error, no uncaught exception, no CSP violation | browser |
| A5 | Look at the home page and an inner page | The rendered palette matches live production: body background, text color, `--bg` and `--ink` | browser |
| A6 | Load any page after 2026-11-01T00:00-06:00 | No request to `/halloween/` and no `data-halloween` attribute | browser |
| A7 | Follow any internal link on any built page | Status 200 from the local server | links |
| A8 | Follow any external link on any built page | No 5xx status. Network failures and 4xx are listed as warnings | links |
| A9 | Load the home page on a phone, first visit | The repo budget passes. Code stays under 60 KB gzipped | budget |
| A10 | Any client script that sends data off the page | Its origin is allowed by `connect-src`, or `default-src` when `connect-src` is absent | csp |
| A11 | Any page the branch does not mean to change | Its built HTML is byte-identical to the live page | parity |
| A12 | A script error happens on the home page | The reporter in the Error reporting table is on the page. An error event for that exception reaches its ingest host past the CSP. The event does not ask for IP inference and does not carry the page's query string or fragment | browser |

## Main navigation

| Label | Destination | Heading starts with |
|---|---|---|
| Projects | `/projects/` | Projects |
| Writing | `/blog/` | Writing |
| For agents | `/for-agents/` | This site has a machine interface. |
| Work with me | `/work-with-me/` | You don't need a degree to build with AI |

## Error reporting

The reporter the site must ship. Set Reporter to `none` to require that no
reporter is on the page. Between this file landing on `main` and Sentry landing
(PR #12), `main` itself fails A12. That is expected.

| Field | Expected |
|---|---|
| Reporter | sentry |
| Ingest host | `o4510204952117248.ingest.us.sentry.io` |

## Known defects

Defects live production has, each checked on live on 2026-11-01. A check reports
a match as KNOWN, not PASS. Delete a row when its fix lands. Never add a row to
make a new failure pass.

| Path | Found on 2026-11-01 |
|---|---|
| `/404/` | The 404 page's canonical link points to `/404/`, which is a 404 on live |
| `/404.md` | The 404 page's Markdown alternate link has no file. 404 on live |
| `/contact-thanks.md` | The Markdown alternate link on a noindex page has no file. 404 on live |
| `/offline.md` | The Markdown alternate link on a noindex page has no file. 404 on live |

## Home page

| Field | Expected |
|---|---|
| Heading | I build tools for working with AI. |
| Inner page for the mark check | `/projects/` |
