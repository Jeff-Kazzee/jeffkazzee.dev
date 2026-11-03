---
title: "Plugin Lab"
description: "Set the checks before you install a capability, then test outside the plugin."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, plugin-lab, verification]
---

Suppose you want a tool that counts entries in a list. Loading the tool does not tell you whether it counts correctly.

Plugin Lab is my DeepSeek Harness workflow and template collection. You write the capability, install it, run the checks and decide what to keep. The Lab is not an installed plugin factory.

## Set the checks before installation

For this hypothetical counting tool, define results for an empty list, a short list and invalid input. It should need no filesystem or network access. This is an exercise, not a completed plugin.

Copy the [acceptance template](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/ACCEPTANCE.template.md) outside the package. Write the tool's expected behavior, exact checks, expected results and a way to disable it. State who or what will run the checks.

Record a SHA-256 hash before installing. The hash identifies those checks. It does not stop edits or make the checks sufficient. Keep them fixed and append observations afterward.

## Adapt the starter

Copy and adapt the [starter](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/TEMPLATE/README.md). Do not install it unchanged. Its [example tool](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/TEMPLATE/index.js), `lab_ping`, returns a ping receipt, not your finished capability.

Rename the package, bundle row, exported plugin name, tool, locale entry and icon. Replace the example implementation. Check current DSH service and tool contracts before authoring.

Install the adapted directory through the Plugin Manager's `install_bundle` operation. Test one capability at a time through a channel the plugin does not control. Use a separate shell, browser tools or a reviewer.

Compare the counting tool's answers with the input lists. Record failures too. Keep, revise or disable the plugin. Plan recovery before testing state-changing work. Disabling or uninstalling stops activation, not necessarily its external side effects.

## Setup and source limits

You need a working DSH development setup, access to its interfaces and permission to install a local bundle.

The November 2, 2026 source review found [starter version 0.1.0](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/TEMPLATE/package.json), marked private, with no declared DSH compatibility range. Plugin Lab had no entry in the [inspected market index](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json).

The [workflow](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/README.md) is not an automatic sandbox or self-verification system. No fresh portable installation, new plugin execution or ready-made download is established here.

[Back to DeepSeek Harness](/deepseek-harness/).
