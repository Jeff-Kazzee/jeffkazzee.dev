---
title: "Advisor Models: a second opinion without handing off the job"
description: "How a DeepSeek Harness agent can ask another model a bounded question, then check the advice against the actual work."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, advisor-models, agent-workflows]
---

A coding agent can explain a plan convincingly and still miss its weakest assumption. Advisor Models gives the working agent a way to ask another model about that assumption without transferring the whole job.

I built Advisor Models as an addition to DeepSeek Harness, not a stock DSH feature. It adds the `advisor` tool and a conversation view of the exchange. It does not replace subagents or teammates.

## What the advisor receives

Each consultation is one turn. The advisor receives a question, optional supporting context and its configured instructions. It has no tools, no conversation history and no ability to act on the project. If a decision depends on a file, the working agent must read it and supply the relevant excerpt.

The built-in presets separate three jobs. `reviewer` looks for objections and a test that could expose them. `architect` weighs a design decision. `quick` gives a short second opinion. Their shipped route uses DeepSeek, not an included Opus model.

Use a teammate when the task requires someone to inspect a repository or implement a change. Use an advisor when the question can be answered from a compact packet of evidence.

## The review behind this section

While preparing this section on November 2, 2026, my agent asked an Opus 5.5 architecture advisor whether these original guides should have their own collection or sit inside the site's existing blog archive. The question supplied the proposed structure and constraints. The advisor did not inspect the repository itself.

It recommended a separate Guides collection and flagged a useful failure case. Hiding a draft's HTML page is not enough if the same draft leaks into RSS, Markdown pages or the machine-readable content index.

Its proposed check was specific: build with a draft guide and confirm that none of those outputs includes it, then approve the guide and check that the intended outputs include it. My agent still has to inspect the implementation and run those checks. The recommendation is a test requirement, not proof that the website already passes.

Opus is my local choice for that consultation. It is not the plugin's shipped default or an included subscription.

The transcript view shows the question, supplied context, replies, model route, token use and latency. That makes the reasoning available for review. It does not make the reply verified evidence.

## Setup and costs

The [source README](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/advisor-models/README.md) documents a linked local installation through DSH's Plugin Manager. The [package metadata](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/advisor-models/package.json) identifies version 1.3.0 and marks the package private. Public source availability is not the same as a published package.

There is no Advisor entry in the inspected market index, and this guide does not establish a fresh portable installation on another machine. Treat it as a source-backed workflow explanation, not a one-click install announcement.

You need an available, authorized model route. Paid providers are not included. Selecting another provider does not grant access to it. Each uncached consultation makes a separate model request. Call limits, token settings, timeouts and exact-repeat caching help bound use, but they are not a verified currency spending cap.

## Sources and limits

Checked on November 2, 2026 against the pinned [Advisor documentation](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/advisor-models/README.md) and [market index](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json). No comparative model benchmark or new installation test is claimed. A second model can repeat the first model's mistake. The value depends on the question, the supplied evidence and the check that follows.
