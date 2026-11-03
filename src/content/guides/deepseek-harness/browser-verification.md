---
title: "Browser Verification: check the running page, not just the code"
description: "Install the DeepSeek Harness browser bundle and use a bounded interaction to check what a UI change actually does."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, browser-verification, practical-guides]
---

A successful build does not show whether a button opens the right panel. Browser Verification lets a DeepSeek Harness agent inspect a running page, interact with it and read browser errors. The checks still need to be chosen and run.

My bundle connects DSH's MCP client to the upstream Chrome DevTools MCP server and adds a Desktop GUI access helper. The browser automation comes from that upstream server. This is not a new browser engine or an automatic test suite.

## Install the published bundle

The inspected market entry offers `dsh-plugin-browser-verify` version 1.0.0. It requires DSH `>=0.2.1-rc.5 <0.3.0`, Node.js 20 or newer and Google Chrome.

1. Open **Plugins** in DSH.
2. Enable **Custom plugin markets** under Experimental plugins.
3. Open **Discover** and add this public index URL:

```text
https://raw.githubusercontent.com/Jeff-Kazzee/dsh-plugins/main/index.json
```

4. Select `dsh-plugin-browser-verify` and install it.
5. Wait for the `mcp__browser__*` tools to appear before attempting a check.

The bundle starts a headless, isolated browser server. Its first run resolves Chrome DevTools MCP through `npx`, so network access and package execution are involved. Review that dependency before activation. The bundle currently requests the upstream `latest` version, so pinning the bundle does not freeze the entire browser toolchain.

The index currently pins this bundle to commit `2c443a867806b30382f2bafc851c53b30abbc7d2`. These steps were checked against the public installation documentation and index. A fresh-machine install was not performed for this guide.

## Give the agent a specific check

Consider a hypothetical settings panel with a Save button. The intended behavior is to retain a changed display label after the page reloads. This is an example test, not a report of a completed run.

Ask the agent to:

1. Open the intended running application and take an accessibility snapshot.
2. Find the display-label field and Save button from that snapshot.
3. Enter a harmless test label and save it.
4. Reload the page and inspect the field again.
5. Read console errors and inspect failed network requests.
6. Capture a screenshot if the visual result matters.

The snapshot gives the agent a text representation of accessible page elements. The screenshot shows appearance. Neither alone demonstrates that saving persisted. The reload and subsequent inspection address that part of the requirement.

Keep the target explicit. Opening a different development server would not verify the application you meant to change. Use disposable test data and agree on cleanup before running an interaction that changes state.

## What this does not prove

A clean console is not proof of correct behavior. One successful interaction does not cover other users, browsers, viewports or failure paths. Browser checks complement tests and stronger verification methods rather than replacing them.

The tools can interact with real pages and execute page JavaScript. Review permissions and avoid collecting sensitive page content in evidence. Disable the `browser-verify` row or uninstall the bundle through the Plugin Manager to stop using it.

## Sources and limits

The pinned [Browser README](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/browser-verify/README.md), [bundle configuration](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/browser-verify/cordis.patch.yml) and [market index](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json) were checked on November 2, 2026. The README records a live GUI snapshot, click and screenshot check. That historical result is narrower than full application acceptance and is not a new verification run for this article.
