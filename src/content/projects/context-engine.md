---
title: Context Engine
description: An experimental, opt-in plugin that lets Claude Code or Codex edit its own Working Context with ordinary tools. Based on the Context Language Models paper. Pre-release 0.1.6, Linux only.
tags: [agents, context, experimental]
stack: [TypeScript, Claude Code, Codex]
repoUrl: https://github.com/Jeff-Kazzee/context-engine-claude
date: 2026-10-18
featured: true
status: alpha
order: 0.5
---
Context Engine gives a coding agent a plain file, its Working Context, and lets the agent rewrite that file with the Read, Edit and Write tools it already has. In Claude Code, the plugin rebuilds the conversation from the file at each new user turn. In Codex, it rebuilds when the agent calls `new_context`. Material the agent deleted or offloaded is no longer sent with each request. It adapts the mechanism of the [Context Language Models paper](https://arxiv.org/abs/2609.37725) by Rulin Shao and colleagues. None of the paper's code is copied. Context Engine is MIT-licensed.

**[Try the interactive demo](/context-engine/)** to see what the model receives before and after an edit.

## The work

There are two public distributions that share one pinned core: [Context Engine for Claude Code](https://github.com/Jeff-Kazzee/context-engine-claude) and [Context Engine for Codex](https://github.com/Jeff-Kazzee/context-engine-codex). Each installs default-off and runs only in projects you enable.

I build it with AI coding agents. Install copies every runner config file it touches before changing it, and uninstall puts back the exact original bytes of any file nothing else changed.

## What is established

- **Pre-release 0.1.6** was published on November 2, 2026 for [Claude Code](https://github.com/Jeff-Kazzee/context-engine-claude/releases/tag/v0.1.6) and [Codex](https://github.com/Jeff-Kazzee/context-engine-codex/releases/tag/v0.1.6).
- **Codex live acceptance** passed on October 15, 2026 on a Linux server. The recorded requests after an edit carry the full edited Working Context. After a reset, the discarded history is gone from them.
- **Claude Code live acceptance** passed on October 16, 2026 on Claude Code 2.1.300. The model edited its Working Context, the next turn's request carried the edit, and the model recalled the edited value with no tool call. The recall request held only the Working Context frame and the prompt.

## What is not established

Linux with `/proc` mounted and Node 24 or newer is the only supported host. On Windows and macOS the plugin stops with an error before it changes anything. The project makes no accuracy, speed or token-saving claim, and it does not claim the paper's benchmark results. A follow-up security change that raises the minimum Node version is open and not yet released.
