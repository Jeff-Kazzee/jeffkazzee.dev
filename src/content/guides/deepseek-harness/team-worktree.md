---
title: "Team Worktree: separate checkouts, reviewed merges"
description: "Give DeepSeek Harness teammates isolated Git worktrees while keeping review, tests and merge decisions with the Lead."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, team-worktree, git]
---

Two coding agents can have separate conversations and still edit the same working files. Team Worktree addresses that filesystem problem. It gives a DSH Agent Teams teammate its own Git worktree, then leaves review and merging with the coordinating agent, called the Lead.

Agent Teams and the worktree runtime ship with DeepSeek Harness. My addition composes them into one Lead-only tool, `spawn_teammate_in_worktree`. It is not a replacement task scheduler or a separate concurrency engine.

## Prerequisites and installation

Use a Git repository with a committed starting point. You need Git 2.45 or newer, the experimental Agent Teams packages available in DSH and a session file policy that permits creating and editing the checkout. The bundle's declared DSH range is `>=0.2.1-rc.5 <0.3.0`.

Open **Plugins**, enable **Custom plugin markets** under Experimental plugins, then open **Discover**. Add:

```text
https://raw.githubusercontent.com/Jeff-Kazzee/dsh-plugins/main/index.json
```

Install `dsh-plugin-team-worktree`. The inspected index lists version 1.0.0 pinned to commit `2c443a867806b30382f2bafc851c53b30abbc7d2`. These are source-checked installation steps, not a fresh-machine installation receipt.

The bundle adds its tool and the shipped worktree runtime. Check for an existing runtime row before changing an established profile.

## Delegate from a known base

A hypothetical task might be to add a CSV export to a small reporting app while the Lead updates help text. Before spawning the teammate, commit the shared starting code. Uncommitted and untracked files do not travel into the new worktree.

Give the tool a unique lowercase `name`, a short `description`, the source repository's absolute `repositoryRoot` and a self-contained `prompt`. The optional `from` selects a local starting commit. It defaults to `HEAD`. Context can be fresh or forked.

For the hypothetical CSV task, the prompt should name the export behavior, allowed files and test command. It should also say what is outside scope. The tool supplies a protocol requiring the teammate to stay in its checkout, test, commit and send a receipt without merging.

During creation, the tool temporarily enters the repository, creates the worktree and spawns the teammate there. It restores the Lead's directory even if spawning fails. That directory restoration is separate from whether the teammate completes its assignment.

## Review before combining work

The receipt should identify the branch, head commit, changed files, exact test command and exit code. Read the diff rather than treating the receipt as approval. Run the relevant tests, merge only the accepted change, then verify the combined result.

Separate worktrees prevent simultaneous writes to the same working files. They do not prevent two branches from changing the same lines. The public README records both a clean merge and a later conflict that the Lead resolved. Isolation makes the changes separable, not automatically compatible.

Dependencies, generated files and ignored configuration are not copied from the source checkout. Plan their setup explicitly. Removing the bundle does not remove retained branches or worktrees. Cleanup remains a separate, deliberate action after preserving anything needed.

## Sources and limits

Checked on November 2, 2026 against the pinned [Team Worktree README](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/team-worktree/README.md), [package requirements](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/team-worktree/package.json) and [market index](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json). Disable the `team-worktree` and `worktrees` rows, or uninstall the bundle, to roll back activation. That does not undo merges. The CSV scenario is hypothetical, and no speedup or conflict-free parallelism is claimed.
