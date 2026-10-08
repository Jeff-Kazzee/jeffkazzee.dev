---
title: Context Engine
description: Experimental, opt-in context tooling inspired by the Context Language Models paper, with separate Claude Code and Codex repositories. Live acceptance remains open.
tags: [agents, context, experimental]
stack: [TypeScript, Claude Code, Codex]
repoUrl: https://github.com/Jeff-Kazzee/context-engine-codex
date: 2026-10-08
featured: true
status: prototype
order: 0.5
---
Context Engine explores file-based working context for coding agents. It is based on the [Context Language Models paper](https://arxiv.org/abs/2609.37725), which treats context as a file the model can update.

## The work

There are separate [Codex](https://github.com/Jeff-Kazzee/context-engine-codex) and [Claude Code](https://github.com/Jeff-Kazzee/context-engine-claude) repositories. The proposed plugins share a context core while adapting setup and hooks to each runtime. They are experimental and opt-in, starting disabled in each project.

I am developing this with AI coding agents, with attention to scoped activation, recovery, and clear setup and rollback instructions.

## What is established

As of October 8, 2026, both public default branches are bootstrap pages. The implementation and validation records are in the open release PRs for [Codex](https://github.com/Jeff-Kazzee/context-engine-codex/pull/1) and [Claude Code](https://github.com/Jeff-Kazzee/context-engine-claude/pull/1), pending merge and release approval.

Those records cover automated and offline checks. Live native-agent context delivery and long-session acceptance have not yet been established. This project does not claim the paper's benchmark results or a production-ready integration.
