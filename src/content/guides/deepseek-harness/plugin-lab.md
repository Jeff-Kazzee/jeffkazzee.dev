---
title: "Plugin Lab: decide the checks before installing the plugin"
description: "Use a starter bundle, fixed acceptance checks and a separate verification channel to evaluate a DeepSeek Harness capability."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, plugin-lab, verification]
---

Installing a plugin answers whether it can mount. It does not answer whether it does the job you wanted. Plugin Lab separates those questions with a written acceptance file, a starter bundle and a keep, revise or disable decision.

Plugin Lab is my workflow and template collection for DeepSeek Harness. It is not an installed plugin factory. DSH provides the Plugin Manager and runtime. The author still writes the capability, installs it, runs the checks and decides what to keep.

## Start with one observable capability

The Lab README recommends one capability per plugin. Keep the gap small enough to describe in one sentence and check from outside the plugin.

For a hypothetical exercise, suppose you want a tool that returns the number of entries in a supplied list. Before implementation, define the expected behavior for an empty list, a short list and invalid input. Decide whether the tool needs filesystem or network access. For this example, it should need neither.

These are proposed checks, not a report of a plugin that has been built or measured.

Copy the [acceptance template](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/ACCEPTANCE.template.md) outside the plugin package. Fill in the capability, exposed surface, exact checks, expected results, verification channel and rollback action. Record a SHA-256 hash before installation. Keep the checks fixed and append observations afterward.

The hash records which acceptance text you started with. It does not enforce a security boundary or make the tests sufficient.

## Adapt the starter, do not install it unchanged

The [starter instructions](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/TEMPLATE/README.md) explicitly say to copy and adapt the template rather than install it as-is. Its example Host plugin exposes `lab_ping`, which returns a ping receipt. That proves a small callable surface, not a finished development toolkit.

Rename the package, bundle row, exported plugin name, tool, locale entry and icon for the actual capability. Replace the example implementation. Check the current DSH service and tool contracts before authoring against them.

Prerequisites are a working DSH development setup, access to the relevant runtime interfaces and permission to install a local bundle. The starter metadata is private and does not declare a DSH compatibility range. This guide does not establish compatibility with every release or provide a verified portable installation.

Install the adapted directory through the Plugin Manager's `install_bundle` operation, one capability at a time. Plugin Lab itself has no entry in the inspected public market index.

## Verify through a separate channel

Run the predefined checks using something the new plugin does not control. A separate shell can inspect output. Browser tools can check a UI. A reviewer can inspect an artifact and compare it with the acceptance file.

For the hypothetical counting tool, compare returned counts with the known input lists and inspect invalid-input behavior. A plugin's own success message is not enough. Append observed results, including failures, and choose keep, revise or roll back.

Disable the exact row or uninstall the bundle if it should not remain active. That stops activation. It does not necessarily reverse files written or other external side effects. Define those recovery steps before testing a capability that changes state.

## Sources and limits

Checked on November 2, 2026 against the pinned [Lab workflow](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/README.md), [starter implementation](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/TEMPLATE/index.js) and [starter metadata](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/plugin-lab/TEMPLATE/package.json). These are workflow requirements, not an automatic sandbox or self-verification system. No new plugin execution or ready-made download is claimed here.
