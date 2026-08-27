---
title: Obscura
description: Local-first desktop media studio for AI asset work. Your files, your database, your machine, with the costs visible.
tags: [desktop, windows, ai]
stack: [Electron, React 19, TypeScript, Vite, SQLite, OpenRouter]
repoUrl: https://github.com/Jeff-Kazzee/obscura
releaseUrl: https://github.com/Jeff-Kazzee/obscura/releases/latest
screenshots:
  - src: ./_images/obscura-studio.png
    alt: The Studio, compose a prompt, pick a model, and see the cost before you generate
  - src: ./_images/obscura-models.png
    alt: Live OpenRouter model catalog with per-image pricing
  - src: ./_images/obscura-gallery.png
    alt: The local gallery, every asset on your own disk, searchable
date: 2026-05-15
featured: false
status: alpha
order: 40
archived: true
verified: 2026-08-27
---
Obscura is a digital darkroom: a desktop app for generating and managing AI images and media that keeps everything **local-first**. Files live on your disk, metadata lives in a SQLite database you own, and every generation shows you what it actually costs before you run it.

## Why it exists

Most AI image tools live in someone else's cloud, with your library held hostage to a subscription. Obscura flips that: the app talks to OpenRouter's live model catalog, but everything it produces lands on your machine, organized and searchable, with no lock-in.

## What it does

- Live OpenRouter image-model catalog with model-specific controls
- Prompt improvement flow with configurable models
- Chat surface with streamed reasoning channels
- Cost visibility on every call, no surprise bills
- Local file storage + SQLite metadata, fully portable

## For Windows users

Obscura ships as a Windows installer and a portable EXE, grab either from the releases page. It's early alpha and moving fast.

## How it was built

Built AI-assisted with a docs-first workflow: PRD, design system, decision logs, and multiple coding agents working defined lanes (UI/renderer vs backend), coordinated through DEVLOGs and handoff protocols.
