---
title: "Advisor Models"
description: "Ask another model to review a decision before your agent acts."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, advisor-models, agent-workflows]
---

While building this section, my agent asked Opus 5.5 where the guides should live. The reply raised a problem worth testing: a draft could stay off the website and still leak into RSS.

I built Advisor Models so my working agent can ask another model a question, read its reply, then continue the job. The advisor gets what we send it. It cannot open files or change the project.

## Give the advisor enough to answer

Each consultation is one turn. The advisor receives the question, optional supporting context and its configured instructions. It has no tools, no conversation history and no ability to change the project.

If the question depends on a file, the working agent must read that file and include the relevant excerpt. The advisor cannot retrieve missing evidence for itself.

The plugin has three presets:

- `reviewer` looks for objections and a test that could expose a problem.
- `architect` weighs a design decision.
- `quick` gives a short second opinion.

Use an advisor for a question that can be answered from the supplied evidence. Use a subagent or teammate when the task requires repository inspection or implementation.

## A review from this website

On November 2, 2026, my agent asked an Opus 5.5 architecture advisor where these guides should live. Should they have their own collection or join the site's existing blog archive?

The question included the proposed structure and constraints. The advisor did not inspect the repository.

It recommended a separate Guides collection. It also identified a publication risk: a draft could stay hidden on the HTML website while appearing in RSS, a Markdown page or the machine-readable content index.

The advisor proposed this test:

1. Build the site with a draft guide.
2. Check that the draft is absent from the HTML pages, RSS, Markdown pages and content index.
3. Approve the guide and rebuild.
4. Check that it appears in the intended outputs.

Then my agent had to run the test. The first [Linux run](https://github.com/Jeff-Kazzee/jeffkazzee.dev/actions/runs/41562213993) failed: my check looked for Astro's content store in the wrong folder. I fixed the path, and the [next run](https://github.com/Jeff-Kazzee/jeffkazzee.dev/actions/runs/41563519067) passed.

I chose Opus 5.5 for that review. The plugin's shipped presets use DeepSeek. You must supply your own model access.

## Inspect the exchange

The conversation view shows the question, supplied context, replies, model route, token use and latency. Use it to check what the advisor actually received and what it recommended.

A second model can repeat the first model's mistake. Check the recommendation against the relevant files and tests before relying on it.

## Setup, version and testing limits

The pinned [README](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/advisor-models/README.md) describes a linked local installation through DSH's Plugin Manager. The [package metadata](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/advisor-models/package.json) identifies version 1.3.0 and marks the package private.

The November 2, 2026 source review found no Advisor entry in the inspected [market index](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json). These are dated source findings. They do not establish the current release status or a successful installation on another machine.

You need an authorized model route. Paid providers are not included. Selecting a provider does not grant access to it.

Each uncached consultation makes a separate model request. Call limits, token settings, timeouts and exact-repeat caching help bound use. They are not a verified spending cap in currency.

This guide explains the workflow and its source-documented limits. It makes no comparative model-performance claim and reports no fresh installation test.

[Back to DeepSeek Harness](/deepseek-harness/).
