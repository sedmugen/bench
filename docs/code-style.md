# Code Style & Engineering Standards

> **Code is read far more often than it is written.**

This document defines the engineering conventions, naming standards, and architectural hygiene rules for Bench.

---

## 1. Core Engineering Philosophy

- **Simplicity Over Abstraction:** Write explicit, predictable code. Avoid premature generic abstractions.
- **Single Responsibility:** Each file, module, and class owns exactly one concern.
- **Zero Runtime Dependencies:** Maintain a zero-dependency frontend runtime architecture.
- **Zero Production Clutter:** No dead code, commented-out blocks, or debug `console.log` statements.

---

## 2. Naming Conventions

### Files & Directories
- **`kebab-case`** for all source files, modules, stylesheets, and documentation:
  - `focus-view.js`
  - `clips-store.js`
  - `markdown-renderer.js`

### Variables & Properties
- **`camelCase`** using explicit, self-documenting names without cryptic abbreviations:
  - `activeFocusCount` (not `cnt` or `afc`)
  - `targetParentId`
  - `isCollapsed`

### Functions & Methods
- **`camelCase`** starting with an imperative verb describing the action:
  - `saveArea()`
  - `deleteAreaForce()`
  - `normalizeTags()`
  - `wouldCauseCycle()`

### Constants
- **`UPPER_SNAKE_CASE`** reserved exclusively for true static constants:
  - `STORAGE_KEY`
  - `DEFAULT_SETTINGS`

---

## 3. Directory & Folder Organization

```
src/
├── core/       # Infrastructure, storage gateways, domain models, shortcuts, platform
├── modules/    # User-facing view controllers (one file per primary module)
├── ui/         # Reusable presentation widgets, modals, dialogs, inspector
├── theme/      # CSS custom properties, tokens, color definitions
└── assets/     # Static iconography and brand graphics
tests/          # Native automated unit test files (*.test.js)
```

---

## 4. Module & Function Guidelines

- **Early Returns:** Guard conditions should return early to prevent deeply nested `if/else` blocks.
- **Pure Domain Operations:** Keep domain methods pure and easily testable wherever practical.
- **Explicit Imports:** All module imports belong at the very top of the file in structured order:
  1. Node standard libraries (in tests)
  2. External dependencies (`@tauri-apps/cli`)
  3. Internal core stores & utilities
  4. UI components and helpers
- **JSDoc Annotations:** All exported functions, methods, and classes must include clear JSDoc docstrings specifying parameter types and return contracts.

---

## 5. Git & Contribution Workflow

- **Branch Naming:** `<category>/<short-description>` (`feature/`, `bugfix/`, `docs/`, `chore/`, `refactor/`, `test/`).
- **Commit Messages:** Strict adherence to [Conventional Commits](https://www.conventionalcommits.org/):
  ```
  <type>(<optional-scope>): <imperative description>
  ```
  - Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`, `perf`, `ci`, `build`.
- **Pre-Commit Verification:**
  - Run `npm test` to verify all automated test suites pass.
  - Verify zero lint/syntax errors via `node --check`.
  - Confirm all changes match documentation in `docs/`.
