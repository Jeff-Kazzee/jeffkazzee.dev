// Sentry, for errors.
//
// The DSN is a public, write-only ingest key. It can send events and never read
// them back, so it belongs in the bundle the same way any other public
// identifier does.
//
// Two things outside this file have to agree with it:
//   1. `connect-src` in vercel.json must allow the ingest host. Without it the
//      browser blocks every event before it leaves the page, and the site looks
//      instrumented while sending nothing.
//   2. scripts/check-budget.mjs counts this file against the home page budget,
//      because BaseLayout links it on every page.
//
// Session Replay stays off on purpose. This is a reading site, the free plan
// caps replays, and replay would need `worker-src blob:` added to the CSP.
// Errors are the signal this site wants.
//
// Tracing is off as well, which is why no `tracesSampleRate` appears below. The
// SDK reads that option as "sample traces", not "stop tracing", and
// `browserTracingIntegration` is not on by default, so a rate here would only
// describe something that never runs. Turning both on would also cost more of
// the home page budget measured in scripts/check-budget.mjs.

import * as Sentry from '@sentry/browser';

// Most error loops repeat on one page, so a page sends at most five events.
let sent = 0;

// A URL's query string and fragment can carry a subscriber id or a token, and
// the SDK copies URLs into many fields: request.url, navigation breadcrumbs
// (data.from, data.to), fetch breadcrumbs (data.url), and the frame filename
// it invents for a stackless error. urlQueryParams covers only some of them,
// so strip both parts from every URL-shaped string before an event leaves.
// A token counts as a URL when the part before its first ? or # holds a / or
// a dot. That covers any scheme in any case (HTTPS://), root-relative paths
// (/a?b) and relative ones (api/content.json#c), and leaves "token ?" and
// '#id' alone. Splitting into tokens first keeps this linear on long strings.
const TOKEN = /[^\s"'<>()]+/g;
function stripTail(token: string): string {
  const cut = token.search(/[?#]/);
  return cut > 0 && /[./]/.test(token.slice(0, cut)) ? token.slice(0, cut) : token;
}
function stripUrlTails(value: unknown): unknown {
  if (typeof value === 'string') return value.replace(TOKEN, stripTail);
  if (Array.isArray(value)) return value.map(stripUrlTails);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) record[key] = stripUrlTails(record[key]);
  }
  return value;
}

Sentry.init({
  dsn: 'https://9addb530203e7f35d68f08a11ca0233b@o4510204952117248.ingest.us.sentry.io/4512340518961152',
  // SDK 11 dropped sendDefaultPii and collects user info unless told not to.
  // With userInfo on, every event and session asks Sentry to store the
  // visitor's IP address (infer_ip: "auto"). This site has no reason to.
  // The page URL goes into every event too, so drop its query string, which
  // can carry whatever a link put there, such as a newsletter subscriber id.
  dataCollection: { userInfo: false, urlQueryParams: false },
  // Vercel sets VERCEL_ENV at build time, and astro.config.mjs passes it in,
  // so preview deployments report as "preview". A build outside Vercel falls
  // back to the old production or development split.
  environment: import.meta.env.VERCEL_ENV ?? (import.meta.env.PROD ? 'production' : 'development'),
  // Keep every error. Sampling would hide the rare errors a small reading site
  // has. The free plan's 5,000 errors a month is guarded by the per-page cap
  // below, not by dropping events at random.
  sampleRate: 1,
  beforeSend: (event) => (++sent > 5 ? null : (stripUrlTails(event) as typeof event)),
  // Browser noise. Each of these would spend part of the monthly error
  // allowance without naming a defect in this site.
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /^Non-Error promise rejection captured/,
  ],
  // An error raised by a browser extension is not this site's defect.
  denyUrls: [/^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i, /^safari-web-extension:\/\//i],
});

export {};
