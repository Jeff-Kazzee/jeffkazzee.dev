# Navigation

A visitor moves between the home page, Projects, Writing, For agents and Work
with me from the header on every page, and returns home through the name mark.

## Sub-features

- `nav-main` takes each header link to its page (A2).
- `nav-home` returns home from the "Jeff Kazzee" mark (A3).
- `nav-clean` loads every sitemap page with no console error, exception or CSP violation (A4).

## How to get to it (user POV)

- Click a link in the header nav, labeled Main for screen readers.
- Click "Jeff Kazzee" at the top left of any page.
- Open any URL from `/sitemap-0.xml`.

## Driving it with browser.mjs

Preconditions:

- Doctor passes.

- **Main nav.** From `/`, click each `nav[aria-label="Main"] a` by its text. The pathname and the first `h1` match the Main navigation table in `acceptance.md`, and the document status is 200. Screens: `nav-<page>.png`.
- **Name mark.** From `/projects/`, click `header a.mark` with the text "Jeff Kazzee". The pathname is `/`.
- **Clean load.** Visit every `<loc>` in `dist/sitemap-0.xml` plus the nav pages. No `Runtime.exceptionThrown`, no `console.error`, no error-level log entry.

## Gotchas

- The nav table in `acceptance.md` is the answer key, read from the fetched production ref.
  A nav change needs its own reviewed PR to the key first.
- A click that goes nowhere waits five seconds, then reports where it stayed.
- Prerendering is off, so a click always loads a fresh document.
