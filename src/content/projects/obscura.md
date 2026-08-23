---
title: Obscura
description: Archived local-first desktop media studio for AI asset work.
tags: [desktop, windows, ai]
stack: [Electron, React 19, TypeScript, Vite, SQLite, OpenRouter]
repoUrl: https://github.com/Jeff-Kazzee/obscura
releaseUrl: https://github.com/Jeff-Kazzee/obscura/releases/latest
screenshots:
  - src: ./_images/obscura-studio.png
    alt: The Studio showing a prompt, model choice, and estimated cost before generation
  - src: ./_images/obscura-models.png
    alt: OpenRouter model catalog with per-image pricing
  - src: ./_images/obscura-gallery.png
    alt: The local gallery showing assets stored on disk and ready to search
date: 2026-05-15
featured: false
visibility: archived
status: archived
order: 1
---

Obscura was a local-first desktop app for generating and managing AI images and media. Files stayed on your disk, metadata lived in a SQLite database, and each generation showed its estimated cost before it ran.

I am no longer working on Obscura. I am keeping this page and the repository as a record of the project.

## Why I built it

Most AI image tools keep your library in someone else's cloud. Obscura put the files on your machine instead. The app used OpenRouter's model catalog while keeping the generated assets and their metadata local.

## What it included

- An OpenRouter image-model catalog with model-specific controls
- A prompt improvement flow with configurable models
- A chat view with streamed reasoning channels
- Cost estimates before generation
- Local file storage and SQLite metadata

## The last build

The repository still has the Windows installer and portable build from the project. See the [release archive](https://github.com/Jeff-Kazzee/obscura/releases/latest) if you want to inspect them.

## How it was built

I built it with a docs-first workflow, a small design system, decision logs, and separate UI and backend work. The project was also an experiment in coordinating coding agents without losing track of the work.
