---
title: "Browser Verification"
description: "Give your agent a specific interaction to check in the running app."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, browser-verification, practical-guides]
---

A Save button can look right and still lose your change on reload. Ask your agent to check what happens after the click.

Browser Verification connects DeepSeek Harness to the upstream Chrome DevTools MCP server and adds a Desktop login helper. The upstream server supplies the browser tools. My bundle does not run a test suite for you.

## Check one interaction

Use this hypothetical settings check, not a claimed test run:

1. Open the intended running app. Take a snapshot of its accessible text and controls.
2. Find the label field and Save button from that snapshot.
3. Enter a disposable label and save it.
4. Reload the page. Check whether the label remains.
5. Read console errors and failed network requests.
6. Take a screenshot to inspect the appearance.

A screenshot shows appearance. Reloading checks whether the change survived. Neither a clean console nor one working interaction proves the whole app works.

Use the correct app URL, not a replacement server. Agree on cleanup before changing data. Keep sensitive page content out of evidence.

## Setup and source limits

In DSH, open **Plugins** and enable **Custom plugin markets** under Experimental plugins. In **Discover**, add the [public index](https://raw.githubusercontent.com/Jeff-Kazzee/dsh-plugins/main/index.json). Select `dsh-plugin-browser-verify`. Wait for the `mcp__browser__*` tools.

The November 2, 2026 [index review](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json) lists version 1.0.0 at commit `2c443a867806b30382f2bafc851c53b30abbc7d2`. Its declared DSH range is `>=0.2.1-rc.5 <0.3.0`. You need Google Chrome and Node.js 20.19 or later, 22.12 or later, or 23 and newer. That range comes from the upstream `chrome-devtools-mcp` 1.12.0 package, checked November 3, 2026.

The [bundle configuration](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/browser-verify/cordis.patch.yml) runs an isolated browser through `npx` and requests upstream `latest`. Review package execution and network access before activation. The bundle pin does not freeze the browser dependency. The tools can execute page JavaScript.

The [README](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/browser-verify/README.md) records a November 2 GUI snapshot, click and screenshot check, not full app acceptance. No fresh-machine install was performed for this guide. Disable `browser-verify` or uninstall the bundle to stop using it.

Correction, November 3, 2026: an earlier version said Node.js 20 or newer.

[Back to DeepSeek Harness](/deepseek-harness/).
