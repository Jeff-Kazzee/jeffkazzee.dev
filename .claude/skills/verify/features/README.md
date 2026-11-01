# jeffkazzee.dev verification map

This directory maps each visitor-facing feature to the journeys in
[../acceptance.md](../acceptance.md) that prove it. Read this index first, then
the feature file.

## Baseline preconditions

- Run on the server. `launch.sh` printed `LAUNCH_RESULT=pass` and `doctor.sh`
  printed `DOCTOR_RESULT=pass` for the same `VERIFY_PORT`.
- `https://jeffkazzee.dev` is reachable. Parity and palette checks need it.
- Drive only an instance this run started.

## Proof and skip reporting

- Report each journey ID with its verdict and the evidence folder.
- A journey that could not run is reported as not verified, with the reason.
  Never report it as passed through another journey.

## Features

- [Navigation](./navigation.md) covers the main nav, the name mark, and every sitemap page loading cleanly.
- [Links](./links.md) covers every internal and external link on every built page.
- [Home page and theme](./home-and-theme.md) covers the home heading, the phone budget, the palette, and the expired Halloween theme.
- [Security headers](./security-headers.md) covers the CSP and what client code may connect to.
