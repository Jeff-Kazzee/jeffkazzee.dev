---
title: "Team Worktree"
description: "Keep each agent's changes separate, then review the combined result."
pubDate: 2026-11-02
draft: false
verifiedDate: 2026-11-02
kind: guide
series: deepseek-harness
tags: [deepseek-harness, team-worktree, git]
---

Separate conversations do not separate files. Two agents sharing one checkout can leave you untangling their edits before you can review either job.

Team Worktree starts a teammate in a Git worktree, a separate working copy on its own branch. My tool, `spawn_teammate_in_worktree`, combines DSH's existing Agent Teams and worktree runtime. Only the coordinating agent can call it. It is not a task scheduler or concurrency engine.

## Give one teammate a bounded job

1. Commit the shared starting code. Uncommitted, untracked and ignored files do not travel into the new worktree.
2. Supply a unique lowercase `name`, `description`, absolute `repositoryRoot` and self-contained `prompt`. Name the allowed files, expected behavior and test command.
3. Use `from` to choose a local starting commit, or accept `HEAD`. Set `context` to `fresh` for a new conversation or `fork` to inherit the coordinating agent's conversation.
4. Wait for the teammate's receipt: branch, head commit, changed files, test command and exit code.

The tool tells the teammate to stay in its checkout, test, commit and report without merging. It restores the coordinating agent's directory even if spawning fails. That does not establish whether the teammate finished.

Read the diff and run the relevant tests. Merge only the accepted change, then check the combined result. The [published example](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/team-worktree/README.md) includes a clean merge and a later conflict. Separate working files do not make branches compatible.

## Setup and source limits

You need Git 2.45 or newer, the experimental Agent Teams packages and permission to create and edit the checkout. Plan dependency, generated-file and ignored-configuration setup separately.

In **Plugins**, enable **Custom plugin markets** under Experimental plugins. In **Discover**, add the [public index](https://raw.githubusercontent.com/Jeff-Kazzee/dsh-plugins/main/index.json), then install `dsh-plugin-team-worktree`. Check for an existing worktree runtime row first.

The November 2, 2026 [index review](https://github.com/Jeff-Kazzee/dsh-plugins/blob/9cd00145e3817f1c0e0e122593b2b38b983ba625/index.json) lists version 1.0.0 at commit `2c443a867806b30382f2bafc851c53b30abbc7d2`. The [package](https://github.com/Jeff-Kazzee/dsh-plugins/blob/2c443a867806b30382f2bafc851c53b30abbc7d2/team-worktree/package.json) declares DSH `>=0.2.1-rc.5 <0.3.0`. These are source-checked steps, not a fresh-machine install receipt or speedup claim.

Disable `team-worktree` and `worktrees`, or uninstall the bundle, to stop activation. That does not undo merges or remove retained branches and worktrees. Preserve needed work before deliberate cleanup.

[Back to DeepSeek Harness](/deepseek-harness/).
