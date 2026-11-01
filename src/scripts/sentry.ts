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

// Sampling stays at the default of every event, because sampling would hide
// the rare errors a small reading site has. The free plan's 5,000 errors a
// month is guarded instead by this cap: most error loops repeat on one page,
// so a page sends at most five events.
let sent = 0;

// A URL's query string and fragment can carry a subscriber id or a token.
// Finding every URL shape after the fact failed three review rounds, so URLs
// are kept out at their sources instead:
//   - only console breadcrumbs are built. Fetch, XHR, navigation and click
//     breadcrumbs carry URLs, and beforeBreadcrumb drops them if any appear,
//   - beforeSend rebuilds request.url from location.origin and
//     location.pathname, drops the Referer header and query_string, and
//     reduces each stack frame filename to its origin and path,
//   - every other string is cut at the first ? or # that follows a / or sits
//     in a token longer than one character, and everything after it is
//     dropped. Sentry records the raw string code passed in, so a fragment can
//     hold spaces, and only cutting to the end removes all of it. This damages
//     text that is not a URL, such as "div#main > a", which becomes "div".
// Error reports lose fetch and navigation context. That is the accepted cost.
const URL_CATEGORIES = new Set(['fetch', 'xhr', 'navigation', 'ui.click']);
const URL_FIELDS = ['url', 'from', 'to'];
function cutText(text: string): string {
  let end = text.length;
  const slash = text.indexOf('/');
  if (slash >= 0) {
    const after = text.slice(slash).search(/[?#]/);
    if (after >= 0) end = slash + after;
  }
  for (const match of text.matchAll(/\S+/g)) {
    if ((match.index ?? 0) >= end) break;
    const cut = match[0].search(/[?#]/);
    if (match[0].length > 1 && cut >= 0) {
      end = Math.min(end, (match.index ?? 0) + cut);
      break;
    }
  }
  return text.slice(0, end);
}
function originAndPath(url: string): string {
  try {
    const parsed = new URL(url, location.href);
    return /^https?:$/.test(parsed.protocol) ? parsed.origin + parsed.pathname : '<redacted>';
  } catch {
    return '<redacted>';
  }
}
function cutTails(value: unknown): unknown {
  if (typeof value === 'string') return cutText(value);
  if (Array.isArray(value)) return value.map(cutTails);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of Object.keys(record)) record[key] = cutTails(record[key]);
  }
  return value;
}

function start() {
  Sentry.init({
    dsn: 'https://9addb530203e7f35d68f08a11ca0233b@o4510204952117248.ingest.us.sentry.io/4512340518961152',
    // @sentry/browser 11 has no sendDefaultPii option. dataCollection.userInfo
    // defaults to true, and then the SDK marks events infer_ip "auto" and
    // sessions ip_address "{{auto}}", so Sentry's ingest fills in the visitor's
    // IP address. This site has no reason to collect it.
    dataCollection: { userInfo: false, urlQueryParams: false },
    // astro.config.mjs passes these in from the Vercel build. A build outside
    // Vercel, such as the verify skill's, reports environment "local".
    environment: import.meta.env.VERCEL_ENV,
    release: import.meta.env.VERCEL_GIT_COMMIT_SHA || undefined,
    integrations: [Sentry.breadcrumbsIntegration({ dom: false, fetch: false, xhr: false, history: false })],
    beforeBreadcrumb: (breadcrumb) => {
      if (URL_CATEGORIES.has(breadcrumb.category ?? '')) return null;
      if (breadcrumb.data) for (const field of URL_FIELDS) delete breadcrumb.data[field];
      return breadcrumb;
    },
    beforeSend: (event) => {
      if (++sent > 5) return null;
      if (event.request) {
        event.request.url = location.origin + location.pathname;
        delete event.request.query_string;
        if (event.request.headers) delete event.request.headers.Referer;
      }
      for (const value of event.exception?.values ?? []) {
        for (const frame of value.stacktrace?.frames ?? []) {
          if (frame.filename && frame.filename !== '<anonymous>') frame.filename = originAndPath(frame.filename);
        }
      }
      return cutTails(event) as typeof event;
    },
    // Browser noise that the SDK does not already ignore. Each would spend part
    // of the monthly error allowance without naming a defect in this site.
    ignoreErrors: ['ResizeObserver loop limit exceeded', /^Non-Error promise rejection captured/],
    // An error raised by a browser extension is not this site's defect.
    denyUrls: [/^chrome-extension:\/\//i, /^moz-extension:\/\//i, /^safari-extension:\/\//i, /^safari-web-extension:\/\//i],
  });
}

// Speculation rules prerender pages a visitor may never open. Starting here
// would count a session for each of them, so wait until the page is shown.
// TypeScript's DOM types do not include document.prerendering yet.
const prerendering = (document as Document & { prerendering?: boolean }).prerendering;
if (prerendering) document.addEventListener('prerenderingchange', start, { once: true });
else start();

