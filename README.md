# Bench

> **Your brain is for making decisions, not storing them.**

![Status](https://img.shields.io/badge/status-early%20alpha-orange)
![Version](https://img.shields.io/badge/version-v0.3.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![Built with Tauri](https://img.shields.io/badge/built%20with-Tauri-24C8DB)

A lightweight, local-first desktop command center built with Tauri.

------------------------------------------------------------------------

# Current Status

Bench is in **early alpha**. Focus, Capture, Areas, Parking Lot, Archive,
Jot, the Command Palette, and Settings all work end-to-end and are used
daily by the author — but expect rough edges, incomplete polish, and
occasional breaking changes between releases until `v1.0.0`.

If you're trying Bench out for the first time, treat it as a daily-driver
experiment, not a finished product yet.

------------------------------------------------------------------------

# Screenshots

### Focus

![Focus View](./screenshots/focus.png)

### Areas

![Areas View](./screenshots/areas.png)

### Command Palette

![Command Palette](./screenshots/palette.png)

------------------------------------------------------------------------

# Why Bench Exists

Bench exists because modern productivity software has become
increasingly complex.

More features. More dashboards. More notifications. More customization.

Yet the hardest question remains unanswered:

> **What should I be doing right now?**

Bench is designed to answer that question within five seconds.

It is intentionally opinionated.

It prefers clarity over flexibility, focus over features, and calmness
over customization.

Bench is not trying to replace every productivity tool.

It is trying to become the one application that stays open all day and
quietly tells you what deserves your attention.

------------------------------------------------------------------------

# Philosophy

Bench is founded on one belief:

> **Your brain is for making decisions, not storing them.**

Ideas belong in Capture.

Tasks belong in Areas.

Areas belong inside Bench.

Your attention belongs on your work.

------------------------------------------------------------------------

# Why Another Productivity App?

Bench is not competing with Notion, Obsidian, Todoist, Trello, ClickUp,
or Jira.

Those applications solve organization.

Bench solves prioritization.

Bench exists to reduce the mental effort required to decide what to do
next.

------------------------------------------------------------------------

# The Manifesto

## Your brain is for thinking.

Not remembering.

------------------------------------------------------------------------

## Focus is finite.

If everything is important, nothing is.

Bench intentionally embraces constraints.

------------------------------------------------------------------------

## Complexity is failure.

Every feature must justify its existence.

If it increases cognitive load, it does not belong.

------------------------------------------------------------------------

## Local first.

Your information belongs to you.

Bench should remain fully usable offline.

------------------------------------------------------------------------

## Organize less.

Do more.

Bench should disappear into your workflow rather than become another
project to maintain.

------------------------------------------------------------------------

# Core Values

## Clarity

Always know what deserves your attention.

## Calm

The interface should never compete with your thoughts.

## Intentionality

Everything in Bench exists for a reason.

------------------------------------------------------------------------

# What Bench Is

-   A desktop command center
-   A focus system
-   An Areas companion
-   Local-first
-   Keyboard-first
-   Opinionated by design

------------------------------------------------------------------------

# What Bench Is Not

-   Notion
-   Obsidian
-   ClickUp
-   Jira
-   Trello
-   CRM software
-   Team collaboration software
-   AI assistant
-   Calendar replacement

Bench intentionally solves a smaller problem.

------------------------------------------------------------------------

# Product Principles

-   Simplicity over flexibility
-   Clarity over customization
-   Local over cloud
-   Keyboard over mouse
-   Opinionated over configurable
-   Areas over categories
-   Decisions over organization

------------------------------------------------------------------------

# Design Philosophy

Bench should feel calm.

Whitespace is a feature.

Animations should be subtle.

Color should communicate, never decorate.

The interface should feel like a quiet desk, not a busy dashboard.

------------------------------------------------------------------------

# Installation

Bench doesn't yet ship packaged installers — it's built from source (see
**Development** below). Packaged builds for Windows, macOS, and Linux are
planned ahead of `v1.0.0`.

If a build is available, check the
[Releases page](https://github.com/TheIllumi/bench/releases) for the
latest one.

------------------------------------------------------------------------

# Development

### Prerequisites

-   [Git](https://git-scm.com/)
-   [Node.js](https://nodejs.org/) (current LTS)
-   [Rust](https://www.rust-lang.org/tools/install) (via `rustup`)
-   Platform-specific [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS

### Setup

```bash
git clone https://github.com/TheIllumi/bench.git
cd bench
npm install

# Desktop (Tauri)
npm run tauri dev

# Web Browser (Zero native dependencies)
npm run dev:web
```

### Build

```bash
# Desktop App Bundle
npm run tauri build
```

> Using `pnpm` instead? Swap in `pnpm install` / `pnpm tauri dev` — just
> keep a single package manager's lockfile committed so contributors
> don't collide.

------------------------------------------------------------------------

# Features (v0.3.1)

-   Capture
-   Focus
-   Areas
-   Parking Lot
-   Archive
-   Jot
-   Log
-   Clips
-   Command Palette
-   Settings
-   Quick Capture
-   Multi-resolution Application Icons
-   Local-first persistence
-   Keyboard-first workflow

------------------------------------------------------------------------

# Keyboard Shortcuts

### Global Navigation & Shell

| Shortcut | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Open Command Palette |
| `Ctrl+N` / `⌘N` / `C` | Quick Capture |
| `Ctrl+B` / `⌘B` | Toggle Sidebar |
| `Alt+1` / `⌥1` | Switch to Focus |
| `Alt+2` / `⌥2` | Switch to Capture |
| `Alt+3` / `⌥3` | Switch to Areas |
| `Alt+4` / `⌥4` | Switch to Parking Lot |
| `Alt+5` / `⌥5` | Switch to Archive |
| `Alt+6` / `⌥6` | Switch to Jot |
| `Alt+7` / `⌥7` | Switch to Log |
| `Ctrl+,` / `⌘,` | Switch to Settings |
| `Escape` | Close active modal / clear selection |

### List Navigation & Actions

| Shortcut | Action |
|---|---|
| `N` | Create a new item in current module |
| `↑` / `↓` | Move list selection |
| `Enter` / `E` | Open Inspector / edit selection |
| `Space` | Toggle item completion |
| `F` | Move selected item to Focus |
| `P` | Move selected item to Parking Lot |
| `A` | Move selected item to Archive |
| `Delete` / `D` | Delete / archive selected item |
| `R` | Restore item (Archive) / Clear completed (Focus) |

> Press `Ctrl+K` and select **Keyboard Shortcuts** for the complete, always-current overlay.

------------------------------------------------------------------------

# Roadmap

Bench is built incrementally, one milestone at a time. The short version:

-   **v0.1.0 — Workbench** ✅ the foundation (shipped)
-   **v0.2.0 — Sharpen** ✅ Areas, Jot, Settings, search, Command Palette
    and keyboard improvements (shipped)
-   **v0.3.0 — Craft** ✅ Areas hierarchy & TUI redesign, Log module,
    Jot Markdown preview, two-pane Settings, unified task model (shipped)
-   **v0.3.1 — Polish** 🚧 Clips visual notes module, masonry layout,
    color tagging, event lifecycle hardening (current)
-   **v1.0.0 — Built** 🔜 stability, accessibility, and polish for a
    recommendable release

See [`ROADMAP.md`](./ROADMAP.md) for the full breakdown, including what's
already done and what's next.

------------------------------------------------------------------------

# Success

Bench succeeds if opening the application answers one question within
five seconds:

> **What should I be doing right now?**

If Bench ever requires more effort to maintain than the clarity it
provides,

Bench has failed.

------------------------------------------------------------------------

> Build less.
>
> Focus more.
>
> Keep the bench clean.
