---
name: verify
description: Verify the jeffkazzee.dev portfolio site the way a visitor meets it. Builds the site as CI does, serves it with the vercel.json headers, drives headless Chrome through the nav, checks every internal and external link, the home page budget, the CSP, and byte parity with live production. Use after any change to src/, public/, vercel.json or astro.config.mjs, before calling the change done.
---

# Verify jeffkazzee.dev

The site is static Astro output in `dist/`, deployed by Vercel from `main`.
A visitor meets it in a browser. This skill proves a change against answer keys
the building agent did not write. Those keys are live production, the repo's own
budget script, `vercel.json`, and the dated table in
[acceptance.md](acceptance.md). The table is read from `origin/main`, never from
the branch under test (`scripts/answer-key.mjs`). Set `VERIFY_ANSWER_KEY_REF` to
use another ref. The KEY line fails when the branch edits the table and when
`origin/main` has no readable table. There is no fallback to the branch's copy.
Run `git fetch origin main` first so the key is current.

Run it on a Linux build host, not on a laptop. It needs Node, pnpm,
`google-chrome`, `curl`, `ss`, `ps` and `jq`. It installs nothing beyond the
repo's own lockfile.

## Fast path

```bash
.claude/skills/verify/scripts/run-all.sh
```

Run it from the repo root. It runs launch, doctor, every journey and cleanup, then
prints `VERIFY_RESULT=pass|fail`, exits 0 or 1 to match, and lists every line
that still needs a reason. A `FAIL` line is a finding. A `CHANGED` line needs a
reason from the branch's intent, or it is a finding too. A `WARN` or `KNOWN` line
goes in the report as is.

## Launch

```bash
.claude/skills/verify/scripts/launch.sh
```

It runs CI's sequence (`scripts/prepare-ci.mjs`, `pnpm install
--frozen-lockfile`, `pnpm run agent-surface`, then `astro check` and `astro
build`) and logs it to `build.log` in the evidence folder. It leaves out the
budget step of `pnpm run build`, which A9 runs, so a bloated home page fails A9
and the other journeys still run. It builds with `VERCEL_ENV=production` and
`VERCEL_GIT_COMMIT_SHA` set to `origin/main`, the values live was built with,
because `astro.config.mjs` bakes both into the script bundle and A11 compares
pages byte for byte. Run `git fetch origin main` first. Then it serves `dist/` with
`scripts/serve.mjs`, which applies the redirects and headers from `vercel.json`.
Ready is the line `LAUNCH_RESULT=pass http://127.0.0.1:<port>`.

`LAUNCH_RESULT=fail` is a verdict, not a reason to stop. Report it as a failed
verification with the tail of `build.log`.

Set `VERIFY_PORT` (default `4410`) to run two copies side by side. Chrome uses
`VERIFY_PORT + 1`. Each checkout and port has its own state folder,
`/tmp/jeffkazzee-verify-<hash of the checkout path>-<port>`.

## Doctor

```bash
.claude/skills/verify/scripts/doctor.sh
```

Read-only. It passes when the server process this skill started is alive and
owns the port, `dist/` was built from the current tree (HEAD plus uncommitted
changes), the home page returns 200, and Chrome is installed. Run it first
whenever a result looks odd. If it fails on the build check, run cleanup, then
launch.

## Drive

```bash
node .claude/skills/verify/scripts/checks.mjs "$PWD" 4410 <evidence>
node .claude/skills/verify/scripts/browser.mjs "$PWD" 4410 4411 <state-folder> <evidence>
```

`checks.mjs` covers the KEY check and A7 to A11. Those are internal links on
every built page, external links, the budget, the CSP `connect-src` allowlist
against the origins client code sends to, and byte parity of every page with
live production. A10 fails when the bundle carries the Sentry SDK but no ingest
origin is found.

`browser.mjs` covers A1 to A6 and A12 in headless Chrome over the DevTools
protocol. It clicks the nav the way a visitor does (`nav[aria-label="Main"] a`
by link text, then `header a.mark`), loads every sitemap page with the real CSP,
and compares the rendered palette with live production. A12 throws an error on
the home page, one with a stack and one without. It fails unless the reporter
the key's Error reporting table names is on the page and an error event for
each reaches the key's ingest host. Every report sent from the moment the page
starts loading must be free of IP inference and of the page's query and
fragment. Requests to `*sentry.io*` are
intercepted, saved to `reports.txt` and failed, so a run never sends events to
Jeff's Sentry project. Chrome checks CSP before interception, so a CSP violation
still shows. That order was tested by hand on 2026-11-01.

The feature map in [features/README.md](features/README.md) says which journey
proves which feature.

## Evidence

Each run writes to `../<repo>.evidence/<UTC time>-<short sha>/` beside the
checkout, outside git, or to `$VERIFY_EVIDENCE_ROOT` when set:

- `summary.txt` is the full console output with every verdict.
- `build.log` is the CI build log.
- `checks.json` and `browser.json` hold the verdicts.
- `live/` holds the live HTML each parity check compared against.
- `built/` holds the local HTML of each page A11 reports as changed.
- `screens/` holds the home page, each nav destination, and the palette pages.
- `reports.txt` holds the Sentry envelopes A12 captured.

Proof standards: drive the real user path (clicks, real HTTP, the real CSP),
never internal setters. Bind the result to the tree. `doctor.sh` refuses a
`dist/` built from another tree. Report the evidence path with the verdict.

## Cleanup

```bash
.claude/skills/verify/scripts/cleanup.sh
```

It stops only the server and the Chrome process group this skill started. It
kills a pid from a pid file only while that process's command line still names
this checkout. `prepare-ci.mjs` overwrites `pnpm-lock.yaml` and
`pnpm-workspace.yaml`, so launch saves any that exist. Cleanup restores those and
removes the ones launch created, then removes the state folder. It keeps
`node_modules/`, `dist/`, and the evidence folder. Run it after every failed
attempt too.

## What this skill cannot see

- Vercel middleware (`middleware.ts`) does not run locally. `/api/*` links are
  checked against live production instead.
- Headers and redirects come from `vercel.json`, not from Vercel's server. A11
  compares the CSP with the live header.
- Speculation-rules prerendering is off in the driven Chrome
  (`--disable-features=Prerender2`), because a prerendered page swaps the
  DevTools target.
- Feel and taste have no answer key here. Jeff judges them from `screens/`.
