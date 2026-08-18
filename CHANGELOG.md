# Changelog

All notable changes to Bench will be documented in this file.

This project follows the principles of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and adheres to Semantic Versioning.

---

## [Unreleased]

### Added

- Initial repository structure.
- Documentation-driven development workflow.
- Product philosophy and engineering principles.
- Domain model documentation.
- Architecture documentation.
- UI guidelines.
- Code style guide.
- Architecture Decision Records (ADR) system.

### Changed

- Nothing yet.

### Deprecated

- Nothing yet.

### Removed

- Nothing yet.

### Fixed

- Nothing yet.

### Security

- Nothing yet.

---

# v0.3.1 — Web Platform, Clips, Testing & Documentation Overhaul

Release date: 2026-08-18

## Added

- **Web Browser Platform Support**: Enabled standalone browser runtime mode with full `localStorage` persistence, allowing Bench to run in any modern web browser without native Tauri dependencies.
- **Web Development Server**: Added `npm run dev:web` zero-dependency local development server (`scripts/dev-server.js`) with automatic port resolution and static asset serving.
- **Vercel Cloud Deployment**: Added `vercel.json` routing configuration for instant single-command deployment to Vercel and static hosting platforms.
- **Interactive Multi-Module Guide**: Redesigned the Bench Guide into a two-column terminal-inspired interactive master-detail explorer with interactive walkthroughs across Focus, Capture, Areas, Parking Lot, Archive, Jot, Log, and Clips.
- **Clips Module**: Standalone Google Keep inspired visual notes module with dynamic content-height cards, multi-column CSS column masonry layout, and full-text search.
- **Color Customization**: Per-note color picker offering 15 rich Tokyo Night and pastel palette selections.
- **Tag Management**: Color tag filtering bar with responsive flex-wrapping, clear filters button, and instant filter toggling.
- **Quick Creation Bar**: Collapsible `+ Clip` input bar with auto-expanding text fields and Enter-to-create shortcuts.
- **Clips Persistence**: Full local JSON storage integration for clips notes with unified export and import support.
- **Automated Unit Test Suite**: Introduced native Node.js automated unit testing suite (`npm test`, `npm run check`) covering `Repository`, `EventBus`, `MarkdownRenderer`, and `ClipsStore` domain logic with 100% passing checks.
- **Continuous Integration (CI)**: Added GitHub Actions automated CI workflow (`.github/workflows/ci.yml`) for multi-platform linting, syntax validation, unit testing, and Tauri compilation.
- **Architecture Decision Records (ADRs)**: Documented official ADRs 0005 (Area Hierarchy & Cycle Prevention), 0006 (Jot Markdown Rendering), 0007 (Clips Standalone Module), and 0008 (Two-Pane Settings Interface).
- **Comprehensive Documentation Suite**: Overhauled and synchronized PRD, domain data model, architecture specifications, terminology glossary, API reference (`docs/api.md`), security policy (`SECURITY.md`), and high-resolution visual showcase.

## Fixed & Refactored

- **Jot Typography & Ligatures**: Prevented character jumping and font ligature collapsing when typing consecutive hyphens (`--`) in the Jot editor.
- **Lifecycle & Keyboard Safety**: Prevented unmounted views from re-rendering on `settingsChanged` events and guarded global keyboard event handlers across all modules to prevent shortcut hijacking while editing.
- **Production Polish**: Cleaned up debug console logging, streamlined application bootstrap, and standardized package scripts.

---

# v0.3.0 — Craft

Release date: 2026-08-18

## Added

- **Areas Hierarchy & TUI Redesign**: Dense TUI drill-down navigation, hierarchical parent-child Area relationships with cycle prevention, curated Lucide outline area icons with visual icon picker, and live task statistics.
- **Log Module**: Dedicated Log view (formerly Recap) featuring completed task history, interactive daily completion calendar, and journal timeline with real-time reactive event updates.
- **Jot Markdown & Live Preview**: Split pane markdown editor with live preview, in-preview editing, formatting toolbar, formatting keyboard shortcuts, and curated web font options.
- **Two-Pane Settings Redesign**: Categorized settings interface (General, Jot, Navigation, Danger Zone, About), interactive terminal-inspired theme spectrum slider, Help & Reference guide, and destination-aware JSON export dialog.
- **Standardized Dynamic Inspector & Task Actions**: Dynamic Inspector actions across Focus, Capture, Parking Lot, Areas, and Archive modules, hover actions in Archive, and standardized area metadata subtext.

## Changed

- Unified task model across Focus, Capture, and Parking Lot, ensuring task completions are preserved in repository history.
- Promoted header actions and streamlined keyboard navigation (`Alt+1` to `Alt+7`, `Ctrl+,` for Settings).
- Refined module typography with Greek glyph indicators and Tokyo Night accent highlighting.

---

# v0.2.1 — Polish & Usability

Release date: 2026-07-22

## Changed

- Usability and layout refinements across modules.
- Window constraints and custom Tokyo Night scrollbar polish.

---

# v0.2.0 — Sharpen

Release date: 2026-07-09

## Added

- Areas foundation and task assignment.
- Jot scratchpad module.
- Global search across modules.
- Command Palette and Keyboard Shortcuts overlay.
- Multi-resolution application icon suite across desktop and web targets.
- Initial Settings view.

---

# v0.1.0 — Workbench

Release date: TBD

## Added

- Initial Tauri application.
- Projects module.
- Focus module.
- Capture module.
- Lists module.
- Parking Lot module.
- Local JSON persistence.
- Keyboard-first navigation.
- Dark mode.

---

## Versioning Policy

Bench follows Semantic Versioning.

MAJOR

Breaking architectural or product changes.

Example:

v2.0.0

---

MINOR

New features.

Example:

v1.3.0

---

PATCH

Bug fixes.

Example:

v1.3.2

---

## Release Codenames

Bench releases have both semantic versions and internal codenames.

| Version | Codename |
|----------|-----------|
| v0.1.0 | Workbench |
| v0.2.0 | Sharpen |
| v0.3.0 | Craft |
| v1.0.0 | Built |

---

## Philosophy

A changelog is not a Git history.

It documents meaningful changes from a user's perspective.

Not every commit belongs here.

Every release does.