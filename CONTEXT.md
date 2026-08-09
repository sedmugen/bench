# CONTEXT.md

> **Onboarding guide for Bench.**
>
> This document is a complete, self-contained reference for any developer or
> AI agent working on Bench. It describes both what Bench *is designed to be*
> (per its documentation) and what the code *currently does* (per the
> implementation), and it explicitly flags where the two diverge.
>
> Bench is developed with **Documentation-Driven Development (DDD)**:
> documentation is the source of truth and code implements it. When this file
> and the `docs/` tree disagree, the `docs/` tree wins (see the authority
> order below). This file is descriptive; it does not change any documented
> product decision.

---

## Table of Contents

1. Project Overview and Purpose
2. Core Philosophy and Design Principles
3. Document Authority and Reading Order
4. Architecture Overview
5. Repository Structure
6. Data Model and Entities
7. Event Flow and Application Lifecycle
8. UI Structure and Navigation
9. Module Responsibilities
10. State Management Patterns
11. Repository and Persistence Layer
12. Keyboard Shortcuts and Interactions
13. Design System
14. Coding Conventions and Architectural Rules
15. Existing Features and Their Behavior
16. Known Constraints and Non-Goals
17. Important Implementation Details and Decisions
18. Documentation vs. Implementation Divergences
19. Build, Run, and Contribution Workflow
20. Future Roadmap
21. Glossary

---

## 1. Project Overview and Purpose

**Bench** is a lightweight, **local-first**, **keyboard-first** desktop command
center built with **Tauri** (Rust shell) and a plain **HTML/CSS/JavaScript**
frontend (no framework, no bundler beyond Tauri's dev server).

Its tagline and founding belief:

> **Your brain is for making decisions, not storing them.**

Bench does not try to organize everything. It exists to answer a single
question within five seconds:

> **What should I be doing right now?**

Bench deliberately solves **prioritization**, not **organization**. It is
explicitly *not* competing with Notion, Obsidian, Todoist, Trello, ClickUp, or
Jira. It is intentionally opinionated and constrained: it prefers clarity over
flexibility, focus over features, and calm over customization.

- **Target users:** individuals juggling multiple long-term responsibilities —
  developers, students, freelancers, founders, creators.
- **Current version:** `v0.1.0` (codename **Workbench**), the foundation
  milestone. Status in the PRD is "Draft (Frozen)".
- **License:** MIT, © 2026 Saad Mughal.
- **Tauri identifier:** `com.saadm.bench`.

---

## 2. Core Philosophy and Design Principles

Bench's north star: **Reduce the next decision.** Every feature must reduce
cognitive load; if it adds decisions, it does not belong.

### Product principles (`docs/principles.md`)

1. **Reduce Cognitive Load** — every interaction should simplify the user's mental model.
2. **Focus Is Finite** — hard caps: **max 3 Focus Tasks**, **max 5 Focus Projects**. Design constraints, not technical ones.
3. **Opinionated Over Configurable** — excellent defaults over endless settings.
4. **Local First** — must work fully offline; cloud, if ever added, stays optional.
5. **Keyboard First** — primary workflows never require the mouse.
6. **Projects Are First-Class Citizens** — everything meaningful belongs to a Project (see divergence note in §18: implemented as **Areas**).
7. **Glanceability** — answer "what should I work on?" in five seconds.
8. **Calm Interface** — whitespace is a feature; animations subtle; color communicates, never decorates.
9. **Organizing Should Never Become Work** — capture in seconds, return to work immediately.
10. **Build Less** — every feature must justify its existence; removing complexity is as valuable as adding it.

### Engineering principles

- **Documentation is the Source of Truth** — conversations are drafts; behavior becomes real only when documented.
- **Strive for Consistency** — one concept, one name, everywhere (docs, UI, code, commits).
- **Derived State Is Never Stored** — if it can be computed, compute it.
- **Stable Identity** — entity IDs are immutable; names and states may change, IDs never do.
- **The UI Is Temporary; the Data Model Is Forever** — the domain model must survive UI/storage changes.

### Values

**Clarity. Calm. Intentionality.**

### The Bench Test (gate for any new module/feature)

1. Does it reduce cognitive load?
2. Does it reduce the next decision?
3. Will it be used regularly / can it be explained in one sentence?
4. Is it documented?
5. Is it simpler than the alternatives?

If any answer is "No" — stop and ask.

---

## 3. Document Authority and Reading Order

`AGENTS.md` defines a strict authority order. Lower-priority documents must
never contradict higher-priority ones; if they appear to, **stop and ask**.

**Authority (highest first):**

1. `README.md`
2. `docs/principles.md`
3. `docs/terminology.md`
4. `docs/prd.md`
5. `docs/data-model.md`
6. `docs/architecture.md`
7. `docs/ui-guidelines.md`
8. `docs/code-style.md`
9. `docs/decisions/` (ADRs)
10. `BUILD.md`
11. `CONTRIBUTING.md`

`AGENTS.md` itself is the "AI Engineering Constitution" and `docs/INDEX.md` is
the handbook entry point. Recommended onboarding reading order is essentially
the authority list above, ending with `AGENTS.md`.

**Architecture Decision Records (ADRs):**

- **ADR 0001 — Documentation Is the Source of Truth.** Docs are authoritative; ideas in chat are proposals until documented. Divergences are resolved by updating code or writing a new ADR.
- **ADR 0002 — Focus Is Derived State.** Focus is not an entity; it is a module presenting tasks where `focused == true` (Focused Projects = projects where `state == Focused`). Focus owns no persistent data.
- **ADR 0003 — Projects Are First-Class Citizens.** Everything meaningful belongs to exactly one Project; tasks/notes/resources cannot exist without one.
- **ADR 0004 — Local First.** The app must function fully offline; cloud is optional and never a dependency.

ADRs are numbered sequentially, are append-only ("existing ADRs should never
be modified to change history"), and significant product/architectural changes
require a new ADR.

---

## 4. Architecture Overview

Bench follows a **layered architecture** whose entire purpose is to protect the
domain model. Higher layers depend on lower layers through well-defined
interfaces; lower layers never depend on higher ones.

```
Documentation
     ↓
Domain            (business concepts: Project/Area, Task, Note, List, CaptureItem)
     ↓
Application       (workflows / business rules: create, complete, move, archive, convert)
     ↓
Persistence       (store & load only — JSON via localStorage today, SQLite later)
     ↓
Presentation/UI   (Tauri + HTML/CSS/JS: render data, capture input, show feedback)
```

**Golden rules (`docs/architecture.md`):**

1. The Domain must never know about the UI.
2. The UI must never bypass Application logic.
3. Persistence stores state; it does not define it.
4. Documentation is the architectural source of truth.

**How the current implementation maps onto these layers** (the code does not
use physical `domain/`, `services/`, `storage/` folders — the layering is
logical):

- **Domain / Persistence** — `src/core/repository.js` is the single source of truth. It defines the flat `Item` shape, validation for `area` entities, and all reads/writes to `localStorage`.
- **Application / coordination** — `src/main.js` wires an application-layer bridge: the Inspector emits `inspectorUpdate` events, and `main.js` translates them into `Repository.update(...)` calls (with validation for Areas). The `EventBus` decouples producers from consumers.
- **Presentation** — `src/modules/*` (views) and `src/ui/*` (reusable components) render state and capture input. Views read from the Repository and subscribe to `EventBus` events to re-render reactively.
- **Native shell** — `src-tauri/` is a near-stock Tauri 2 app. Its only Rust command is a scaffold `greet` (unused by the frontend). Bench's logic lives entirely in the web layer; the Rust side just hosts the webview with custom (decorationless) window chrome.

**Performance goals:** cold start under ~1s, minimal memory, no background
processes, instant navigation.

**Error handling:** fail loudly in development, fail gracefully in production,
never silently swallow errors, protect user data. In practice the Repository
wraps `localStorage` access in `try/catch` and logs via `console.error`.

---

## 5. Repository Structure

```
bench/
├── AGENTS.md                 # AI engineering constitution (authority + rules)
├── BUILD.md                  # Build/run/setup guide
├── CHANGELOG.md              # Keep a Changelog + SemVer, release codenames
├── CODE_OF_CONDUCT.md        # Community standards
├── CONTRIBUTING.md           # Contribution workflow
├── LICENSE                   # MIT
├── README.md                 # Overview, philosophy, manifesto
├── ROADMAP.md                # Milestones v0.1 → v1.0 and beyond
├── package.json              # name "bench", type module, @tauri-apps/cli devDep
├── package-lock.json
├── .gitattributes            # Enforces LF line endings (CRLF for .bat/.cmd)
├── .gitignore                # node_modules, dist, src-tauri/target, .env, Cargo.lock, ...
├── .github/
│   ├── ISSUE_TEMPLATE/       # bug_report, feature_request, documentation, question
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/
│   ├── INDEX.md              # Documentation handbook + reading order
│   ├── principles.md         # Product + engineering principles ("constitution")
│   ├── terminology.md        # Canonical vocabulary
│   ├── prd.md                # Product Requirements Document (v0.1 Workbench)
│   ├── data-model.md         # Persistent entities, value objects, invariants
│   ├── architecture.md       # Layered architecture + golden rules
│   ├── ui-guidelines.md      # UI/UX philosophy, layout, states, accessibility
│   ├── code-style.md         # Naming, folders, functions, commits, branches
│   └── decisions/            # ADRs 0001–0004
├── src/                      # Frontend (all application logic)
│   ├── index.html            # App shell: titlebar, sidebar, main panel, inspector, portals
│   ├── main.js               # Bootstrap: window controls, view manager, shortcuts, inspector bridge
│   ├── styles.css            # ~1300 lines; imports theme, all component styling
│   ├── theme/theme.css       # Design tokens (colors, spacing, type, motion)
│   ├── assets/               # javascript.svg, tauri.svg (scaffold assets)
│   ├── core/                 # Cross-cutting infrastructure
│   │   ├── repository.js        # Single source of truth + localStorage persistence
│   │   ├── event-bus.js         # Pub/sub decoupling
│   │   ├── view-manager.js      # Module routing / view mounting
│   │   ├── shortcuts.js         # Global keyboard shortcut registry
│   │   ├── command-palette.js   # Ctrl+K palette (commands + entity search)
│   │   ├── command-registry.js  # Dynamic command registration
│   │   └── quick-capture.js     # Ctrl+N / C frictionless capture modal
│   ├── modules/              # One file per user-facing module (view)
│   │   ├── focus-view.js
│   │   ├── capture-view.js
│   │   ├── areas-view.js
│   │   ├── parking-lot-view.js
│   │   ├── archive-view.js
│   │   └── settings-view.js
│   └── ui/                   # Reusable presentation components/services
│       ├── inspector.js         # Right-hand details/editing panel
│       ├── modal.js             # Modal overlay frame
│       ├── dialog.js            # Promise-based confirm dialogs
│       ├── toast.js             # Non-blocking notifications (with optional action)
│       ├── button.js, input.js, checkbox.js, empty-state.js
│       └── utils.js             # crossfade(), getRelativeTime()
└── src-tauri/                # Rust/Tauri desktop shell
    ├── Cargo.toml            # tauri 2, tauri-plugin-opener, serde/serde_json
    ├── build.rs
    ├── tauri.conf.json       # window 800×600, decorations:false, frontendDist ../src
    ├── capabilities/default.json  # window permissions (close/minimize/maximize/drag)
    ├── icons/
    └── src/
        ├── main.rs           # Calls temp_bench_lib::run()
        └── lib.rs            # Tauri builder + scaffold greet command
```

**Note:** `docs/architecture.md` and `docs/code-style.md` describe an *intended*
folder layout (`components/`, `modules/`, `domain/`, `services/`, `storage/`,
`utils/`). The actual layout uses `core/`, `modules/`, `ui/`, `theme/`,
`assets/`. See §18.

---

## 6. Data Model and Entities

The data model (`docs/data-model.md`) is defined independently of UI, framework,
and storage engine. It has four conceptual layers:

1. **Entities** — persistent objects with identity.
2. **Modules** — user-facing functionality (not stored).
3. **Views** — screens inside modules.
4. **Components** — reusable UI elements (implementation details).

### Documented entities

| Entity | Purpose | Key fields | Constraints |
|---|---|---|---|
| **Workspace** | The user's entire Bench; owns all data | `id`, `createdAt`, `updatedAt` | Exactly one; cannot be deleted |
| **Project** | Long-term initiative | `id`, `title`, `description`, `state`, `order`, `createdAt`, `updatedAt` | One state; max 5 Focused; archived cannot hold Focus Tasks |
| **Task** | One actionable piece of work | `id`, `projectId`, `title`, `completed`, `focused`, `order`, `createdAt`, `updatedAt` | Belongs to exactly one Project; completed cannot be focused; archived-project tasks cannot be focused; max 3 focused globally |
| **Note** | Long-form project knowledge | `id`, `projectId`, `title`, `content`, `createdAt`, `updatedAt` | Cannot exist without a Project |
| **CaptureItem** | Unprocessed thought | `id`, `text`, `createdAt` | Never belongs to a Project; converted to Task/Project or deleted |
| **List** | Reusable checklist | `id`, `title`, `order`, `createdAt`, `updatedAt` | Contains ListItems |

### Documented value objects (no independent identity)

- **Resource** — `title`, `url`, `icon`; exists only inside Projects.
- **ListItem** — `text`, `completed`, `order`; exists only inside Lists.

### Documented project states

- **Focused** — active attention (max 5).
- **Active** — ongoing but not focused.
- **Parked** — paused intentionally.
- **Archived** — completed/retired (cannot contain Focus Tasks).

### Documented global invariants

- Exactly one Workspace.
- Every Task/Note belongs to exactly one Project.
- Max 3 Focus Tasks; max 5 Focused Projects.
- IDs are immutable.
- Archived Projects cannot contain Focus Tasks.
- Derived state is never stored.

### Documented derived state

- **Focus** = Tasks where `focused == true`.
- **Focused Projects** = Projects where `state == Focused`.
- **Project Progress** = completed tasks ÷ total tasks.

### Implemented data model (the flat `Item` model)

The code implements a **single flat `Item` collection** stored under one
`localStorage` key, rather than separate typed entity stores. Two record shapes
coexist in the same array:

**Task/idea item** (`type` is undefined):

```js
{
  id: string,          // crypto.randomUUID()
  title: string,
  notes: string,       // long-form notes (edited in the Inspector)
  status: 'active' | 'completed',
  module: 'focus' | 'capture' | 'parking-lot' | 'archive',
  areaId: string | undefined,   // optional link to an Area entity
  createdAt: number,   // epoch ms
  updatedAt: number
}
```

**Area entity** (`type === 'area'`):

```js
{
  id: string,
  type: 'area',
  name: string,        // required, ≤ 50 chars, unique (case-insensitive)
  description: string,
  icon: string,        // present in schema, not surfaced in UI yet
  color: string,       // present in schema, not surfaced in UI yet
  archived: boolean,
  createdAt: number,
  updatedAt: number
}
```

**Key mapping / divergence** (full list in §18): the implementation replaces
the documented **Project** entity with an **Area** entity, replaces the `state`
field with a `module` field on each item ("which list the item lives in"), and
does not implement Note (as a separate entity), List/ListItem, Resource, or a
Workspace record. "Focus" and "completion" are still derived (`module === 'focus'`,
`status === 'completed'`).

**Derived state, as actually computed:**

- Focus tasks = items where `module === 'focus'` (active ones = `status === 'active'`).
- The Focus cap of 3 is enforced on **active** focus items (`status === 'active'`), not total.
- Area stats (active/completed/parked counts) are computed on the fly in `areas-view.js` and the Inspector — never stored.
- Relative timestamps ("2h ago") are derived from `createdAt`/`updatedAt` via `getRelativeTime()`.

---

## 7. Event Flow and Application Lifecycle

### Documented event flow

```
User Action → Application Logic → Domain Validation → Persistence → UI Refresh
```

### Documented DDD workflow

```
Idea → Discussion → Decision → Documentation → Implementation → Review → Release
```

### Actual runtime flow

Bench is event-driven around a lightweight global **EventBus** (`core/event-bus.js`),
a synchronous, dependency-free pub/sub with `on` / `off` / `emit` (listener
errors are caught and logged so one bad subscriber can't break others).

**Write path (typical):**

1. A view (or the Inspector) calls a `Repository` method (`save`, `update`, `move`, `remove`, `reorder`, `clearModule`, `saveArea`, `deleteArea`).
2. The Repository mutates the flat item array and persists it to `localStorage` (`_saveRaw`).
3. The Repository emits a domain event: `itemCreated`, `itemUpdated`, `itemDeleted`, `itemMoved`, `areaCreated`, `areaUpdated`, or `areaDeleted`.
4. Subscribed views re-read their slice (`Repository.getByModule(...)`) and re-render; the Inspector reconciles the currently displayed item.

**Inspector edit path (application-layer bridge, in `main.js`):**

- The Inspector never calls the Repository directly. It emits `inspectorUpdate` with `{ id, field, value }`.
- `main.js` listens for `inspectorUpdate`, applies Area-specific validation (non-empty name, ≤ 50 chars, unique), shows error toasts on failure, and otherwise calls `Repository.update(id, { [field]: value })`. This keeps the Inspector presentation-only.

**Selection event:** `itemSelected` (payload = an item or `null`) is the single
channel for opening/closing the Inspector. Views emit it on selection changes;
the Inspector subscribes and opens/closes accordingly.

**Title/breadcrumb event:** `viewTitleChanged` (`{ title, breadcrumb }`) updates
the header (currently used by Areas to show `Areas > AreaName`).

### Application lifecycle (bootstrap in `main.js`, on `DOMContentLoaded`)

1. `initializeWindowControls()` — wires custom titlebar min/max/close buttons and double-click-to-maximize via `window.__TAURI__`; logs "browser mock mode" when Tauri is absent (i.e. plain browser).
2. `initializeViewManager()` — binds sidebar nav, mounts the default `focus` view, subscribes to `viewTitleChanged`.
3. `initializeShortcuts()` — installs the global keydown handler and registers Alt+1–6 navigation and Ctrl/⌘+K palette shortcuts.
4. Wires the command-palette titlebar button.
5. Sets up responsive breakpoint handling and restores the persisted sidebar collapsed state.
6. Registers Ctrl+B (toggle sidebar) and Ctrl+N / ⌘+N / C (Quick Capture).
7. Installs Inspector resolver callbacks (`resolveAreaName`, `resolveAreas`, `resolveActiveCount`) so the Inspector stays decoupled from the Repository, then `Inspector.init()`.
8. Registers the `inspectorUpdate` → Repository bridge and a `beforeunload` handler that flushes pending Inspector saves.

**Legacy data migration:** on first `Repository.getAll()`, if the new
`bench_items` key is empty but a legacy `bench_focus_tasks` key exists, its
tasks are migrated into the flat model (mapped to `module: 'focus'`, `status`
from `completed`) and the old key is removed.

---

## 8. UI Structure and Navigation

### Layout

`docs/ui-guidelines.md` specifies a **three-column layout**, implemented in
`index.html` as a CSS grid (`grid-template-columns: auto 1fr auto`) beneath a
custom title bar:

1. **Custom title bar** (`.title-bar`, 34px) — draggable region with the `bench`
   logo, a centered `ctrl+k` command-palette button, and window controls
   (minimize / maximize-restore / close) that are hidden chrome because
   `decorations: false` in `tauri.conf.json`.
2. **Sidebar** (`.sidebar`, left) — module navigation. Collapsible to a 56px
   icon-only rail; collapse state persists in `localStorage`
   (`bench_sidebar_collapsed`).
3. **Primary panel** (`.main-content` → `#active-view`) — hosts the active
   module's view, with a header title (`#view-title`) that supports a breadcrumb.
4. **Inspector panel** (`.inspector-panel` / `#inspector-panel`, right) — a
   contextual details/edit panel that opens when an item is selected and hides
   otherwise. Resizable (260–520px, default 320px; width persisted in
   `bench_inspector_width`).
5. **Portals** — `#toast-portal` (notifications) and `#overlay-portal` (modals,
   command palette, quick capture).

### Sidebar navigation items (in order)

| Label | `data-module` | Shortcut shown | Icon (Lucide) |
|---|---|---|---|
| Focus | `focus` | ⌥1 | target/concentric circles |
| Capture | `capture` | ⌥2 | inbox |
| Areas | `areas` | ⌥3 | layers |
| Parking Lot | `parking-lot` | ⌥4 | coffee cup |
| Archive | `archive` | ⌥5 | archive box |
| Settings | `settings` (bottom) | ⌥6 | gear |
| Collapse | (toggle button) | ^B | chevron |

> The sidebar labels shown in the UI ("Areas", "Archive") differ from the
> documented sidebar ("Projects", "Lots"/"Parking Lot") — see §18.

### View manager (`core/view-manager.js`)

- Holds a `viewMap` of `moduleId → { title, render }`.
- `switchView(moduleId)`: flushes pending Inspector saves, clears selection (`itemSelected: null`), updates the header title, toggles the active nav item (and focuses it for keyboard comfort), clears `#active-view`, and calls the module's `render(container)`.
- Exposes `navigateTo(moduleId)` (used by shortcuts and the command palette) and `getActiveModule()`.
- `setViewTitle(title, breadcrumb)` guards against stale updates from unmounted views.

### Responsive behavior (`main.js`)

- **< 900px:** auto-close the Inspector when shrinking below the breakpoint.
- **< 700px:** force-collapse the sidebar to the icon rail; restore the user's persisted preference when growing back above 700px.
- Minimum body width is 600px (matches Tauri `minWidth: 600`).
- There are **no `@media` queries**; responsiveness is handled imperatively in JS via `window.resize` listeners.

---

## 9. Module Responsibilities

Each module is a single file in `src/modules/` exporting a `render<Name>View(container)`
function, plus (for searchable modules) a `focusAndSelect...` helper used by the
command palette. All list modules share a common shape: mount → read slice →
render → subscribe to EventBus → attach a global keydown handler → observe DOM
removal via `MutationObserver` to clean up listeners.

### Focus (`focus-view.js`) — `module: 'focus'`

The centerpiece. Shows active focus tasks and, below, completed ones.

- **Cap of 3 active tasks.** When 3 active tasks exist, the create input hides and a banner appears: *"You're focusing on enough already. Complete something before adding more."*
- **Create:** press `A` (or use the inline input) → adds an active focus task.
- **Complete/reopen:** checkbox or `Space` toggles `status`; completing a selected task clears the selection.
- **Edit:** `E`/`Enter`/`edit` action → inline title edit (Enter commits, Escape cancels).
- **Assign Area:** the `area` action opens a floating Area picker dropdown ([None] + each Area).
- **Park / Archive / Delete:** row actions and keys move the item to `parking-lot`/`archive` or remove it. Delete shows an **Undo** toast that re-inserts the item at its original index.
- **Reorder:** drag handle (grip icon) with a floating ghost preview; on drop, `Repository.reorder('focus', ids)` persists the new order.
- **Area filter:** a top "area" `<select>` filters visible tasks by Area.
- **Empty states:** "No active tasks — press A"; "nice work — everything complete — press R to start fresh".
- **Clear:** `R` (when there are only completed tasks) clears the Focus module.

### Capture (`capture-view.js`) — `module: 'capture'`

Frictionless inbox of unprocessed thoughts, newest first.

- Items are created via **Quick Capture** (Ctrl+N / ⌘+N / C from anywhere) or by moving items in.
- Each row shows a relative-time badge and actions: **focus** (move to Focus, respecting the cap-of-3), **park**, **archive**, **del**.
- Keys: `F` focus, `P` park, `A` archive, `D`/Delete delete; arrows navigate; Escape deselects.
- Area filter select as in Focus.

### Areas (`areas-view.js`) — entities with `type: 'area'`

The organizational unit (documented as **Projects**; see §18).

- Lists non-archived Areas under a "Responsibilities" header, each showing name, optional description, and computed stats: `N active`, `N completed`, `N parked`.
- **Create:** `N` or `A` (or "+ New Area") → inline name input. Validation: required, ≤ 50 chars, unique (case-insensitive). Errors surface as toasts.
- **Edit:** inline rename with the same validation.
- **"Archive" (delete):** the row's `archive`/`del` action sets `archived: true` (Areas are never hard-deleted through the UI). Guarded: an Area with non-archived tasks cannot be archived until those tasks are moved/archived; a confirm dialog is shown.
- Selecting an Area opens it in the Inspector with a breadcrumb (`Areas > Name`) and a grouped task list (focus / capture / parking-lot). Pressing `N` while an Area is selected in the Inspector opens Quick Capture pre-assigned to that Area.

### Parking Lot (`parking-lot-view.js`) — `module: 'parking-lot'`

Intentionally deferred ideas ("things that matter, just not today"), sorted by
most recently updated.

- Rows show a `parked <relative time>` badge and actions: **focus** (respect cap), **capture** (move back to Capture), **archive**, **del** (confirm dialog).
- Keys: `P` → focus, `C` → capture, `A` → archive, Delete → delete; double-click to rename inline.

### Archive (`archive-view.js`) — `module: 'archive'`

Permanent record of finished work and discarded ideas, muted (opacity 0.6),
sorted by most recently updated.

- Actions: **restore** (opens a picker to move back to Focus / Capture / Parking Lot; Focus respects the cap) and **del** (permanent delete, confirm dialog).
- Keys: `Enter`/`R` open the restore picker, Delete → delete.

### Settings (`settings-view.js`) — `module: 'settings'`

Currently a **placeholder** empty state only ("Configure your local database and
interface preferences."). No functional settings are implemented, consistent
with the "Opinionated Over Configurable" principle for v0.1.

---

## 10. State Management Patterns

- **Single source of truth:** the flat item array in `localStorage`, accessed exclusively through `Repository`. No other module writes storage directly.
- **No duplicated/derived storage:** Focus membership, completion, Area stats, and progress are always recomputed from the item array (per ADR 0002 and the "derived state is never stored" principle).
- **Reactive rendering via EventBus:** views subscribe to `item*` / `area*` events and re-render from a fresh Repository read. They deliberately re-register listeners on each mount and clean them up on unmount to avoid duplicate subscriptions.
- **Per-view module-scoped state:** each view keeps small module-level variables (`selectedTaskId`, `editingTaskId`, `isCreating`, `filterAreaId`, cached `containerEl`). This is transient UI state, not persisted.
- **Selection is centralized:** the `itemSelected` event is the only way the Inspector opens/closes; only one item is "selected" app-wide at a time.
- **Presentation stays dumb:** the Inspector emits intent (`inspectorUpdate`) and relies on injected resolver callbacks (`resolveAreas`, `resolveAreaName`, `resolveActiveCount`) instead of importing storage, keeping the domain/UI boundary clean.
- **Debounced persistence for free-text:** Inspector notes/description edits debounce (500ms) before emitting `inspectorUpdate`; pending saves are flushed on blur, module switch, and `beforeunload`.
- **UI-only preferences in dedicated keys:** sidebar collapse (`bench_sidebar_collapsed`) and Inspector width (`bench_inspector_width`) live in their own `localStorage` keys, separate from domain data.

---

## 11. Repository and Persistence Layer

`src/core/repository.js` is the persistence + domain gateway. Storage is
browser `localStorage` (JSON), matching "JSON (v0.1)"; the docs anticipate
SQLite later without domain changes.

- **Keys:** `bench_items` (current), `bench_focus_tasks` (legacy, migrated once then removed).
- **`getAll()`** — returns the parsed array; performs one-time legacy migration; returns `[]` and logs on parse error.
- **`getByModule(name)`** — items whose `module === name` and `type !== 'area'`.
- **`save(item, atIndex?)`** — creates (assigns `crypto.randomUUID()`, defaults, timestamps) or replaces by id; emits `itemCreated` / `itemUpdated`. `atIndex` supports Undo re-insertion at the original position.
- **`update(id, updates)`** — merges updates, bumps `updatedAt`; for `area` records validates name (non-empty, ≤ 50, unique) and emits `areaUpdated`, otherwise emits `itemUpdated`.
- **`remove(id)`** — deletes and emits `itemDeleted`.
- **`move(id, targetModule)`** — convenience wrapper over `update` that changes `module`; emits `itemUpdated`.
- **`reorder(module, orderedIds)`** — reorders a module's items (appends any missing ids as a safety net), persists, emits `itemMoved`.
- **`clearModule(name)`** — removes all items in a module; emits `itemDeleted` per removed item.
- **`getAreas()` / `saveArea(area)` / `deleteArea(id)`** — Area CRUD. `saveArea` enforces name rules and uniqueness; `deleteArea` refuses if any item references the Area (`areaId`), emitting `areaDeleted` only on success. (Note: the Areas *view* archives via `update(..., {archived:true})` rather than calling `deleteArea`.)
- **`_saveRaw(items)`** — the single private writer to `localStorage`, wrapped in try/catch.

**Persistence characteristics & caveats:**

- Data is per-webview `localStorage` — local-first and offline by construction, but not yet backed by a file/DB, so it is not portable/exportable in v0.1 (import/export is roadmap v0.3).
- IDs are UUIDs and never rewritten (stable identity).
- There is no schema versioning beyond the single legacy-key migration.

---

## 12. Keyboard Shortcuts and Interactions

Bench is keyboard-first. Shortcuts are handled globally in `core/shortcuts.js`
(a normalized `modifier+key` registry) plus per-view keydown handlers and the
Inspector's own handler. The canonical, user-facing list lives in the **Keyboard
Shortcuts modal** (Command Palette → "Show Keyboard Shortcuts").

### Global

| Keys | Action |
|---|---|
| `Ctrl+K` / `⌘+K` | Open/close Command Palette (works even inside inputs) |
| `Ctrl+N` / `⌘+N` / `C` | Open Quick Capture |
| `Alt+1` … `Alt+6` | Navigate to Focus / Capture / Areas / Parking Lot / Archive / Settings |
| `Ctrl+B` | Toggle sidebar collapse |
| `Escape` | Close active overlay / modal |

The global handler ignores plain keystrokes while typing in inputs/textareas
(so `c`, `a`, etc. don't fire), but still allows Ctrl/⌘/Alt combos and always
allows the palette shortcut.

### List navigation & actions (within views)

| Keys | Action |
|---|---|
| `↑` / `↓` | Move selection |
| `Enter` | Open selected item (edit inline, or open in Inspector / restore picker depending on module) |
| `A` | Focus: create task · Capture: archive · Areas: new Area · Parking Lot: archive |
| `F` | Move selected item to Focus (Capture) |
| `P` | Park (Capture) · move to Focus (Parking Lot) |
| `C` | Move to Capture (Parking Lot) |
| `R` | Focus: start fresh / clear · Archive: open restore picker |
| `Space` | Toggle completion (Focus) |
| `D` / `Delete` / `Backspace` (also `x`/`X` in Focus) | Delete selected item |
| `N` | Create new Area (Areas) / create task in current Area (Inspector) |

> Per-module key meanings vary (e.g. `A` and `P` do different things in
> different views). The modal in `command-palette.js` is the source of truth for
> the intended set; individual view handlers implement the specifics above.

### Inspector & notes editor

| Keys | Action |
|---|---|
| `Ctrl+L` / `⌘+L` | Focus the title field |
| `Ctrl+Enter` / `⌘+Enter` | Save changes & return focus to the list |
| `Ctrl+S` / `⌘+S` | Force immediate save |
| `Escape` | Blur editor first, then close Inspector |
| `Tab` (in notes) | Insert 2 spaces instead of moving focus |

### Command Palette (`Ctrl+K`)

Fuzzy-ish substring search across: registered **commands** (navigation, Help →
Show Keyboard Shortcuts, Actions → Start fresh / Clear Workspace), **Areas**, and
**tasks/items** grouped by module (Focus / Captured Ideas / Parking Lot /
Archive). `↑`/`↓` move, `Enter` executes, `Escape` closes; selecting an entity
navigates to its module and selects it. Commands are registered dynamically via
`CommandRegistry.register(...)`.

---

## 13. Design System

Bench's aesthetic is a calm, flat **TUI / terminal** look: monospace type, near-
black background, hairline borders, zero border-radius, no shadows, subtle
motion, and color used only to communicate. Design tokens live in
`src/theme/theme.css`; all component styling is in `src/styles.css` (~1300
lines, no `@media` queries).

### Typography

- **Font:** `JetBrains Mono` (imported from Google Fonts), monospace fallback. Text is frequently lowercase by design (e.g. `bench`, `focus`, `capture`).
- **Sizes:** `--font-size-xs: 12px`, `--font-size-sm: 13px`, `--font-size-md: 14px`, `--font-size-lg: 16px`. Few sizes, strong contrast, comfortable line height.

### Color tokens (dark, near-monochrome)

| Token | Value | Use |
|---|---|---|
| `--color-bg-workspace` / `-sidebar` / `-content` | `#0b0b0b` | Backgrounds (unified near-black) |
| `--color-text-primary` | `#e8e8e8` | Primary text |
| `--color-text-secondary` | `#8b8b8b` | Secondary text |
| `--color-text-muted` | `#4e4e4e` | Muted/hint text, scrollbar |
| `--color-border` | `#1c1c1c` | Hairline borders |
| `--color-accent-blue` | `#7aa2f7` | Primary accent (logo, hints, active) |
| `--color-accent-focus` | `#111111` | Subtle hover/active fill |
| `--color-success` | `#9ece6a` | Success |
| `--color-warning` | `#e0af68` | Warning |
| `--color-danger` | `#f7768e` | Danger/destructive |

(The palette is Tokyo-Night-like.)

### Spacing scale

`--space-2xs: 4px`, `--space-xs: 8px`, `--space-sm: 12px`, `--space-md: 16px`,
`--space-lg: 24px`, `--space-xl: 32px`. Generous whitespace; whitespace over
separators.

### Shape & motion

- **Radii:** all `0px` (`--radius-sm/md/lg`) — deliberately flat.
- **Shadows:** all `none` — flatness enforced via borders only.
- **Motion:** `--duration-fast: 100ms`, `--duration-normal: 150ms`, easing `--ease-standard: cubic-bezier(0.25, 1, 0.5, 1)`. Transitions are used for hover/opacity/width/transform; the only `@keyframes` is `toast-in`. `crossfade()` (in `ui/utils.js`) provides view fade transitions with a safety-timeout fallback. Motion communicates, never entertains.

### Layout tokens

`--sidebar-width: 200px` (collapses to 56px), `--header-height: 48px`.

### Components (in `src/ui/`)

Each component solves exactly one problem and is reused everywhere:

- **Button** (`button.js`) — variants `primary` / `secondary` / `danger`.
- **Input** (`input.js`) — text input primitive with keydown/blur hooks.
- **Checkbox** (`checkbox.js`) — button with `role="checkbox"`, SVG check.
- **Modal** (`modal.js`) — backdrop + framed content, Escape/backdrop close, returns `{ close, element }`.
- **Dialog** (`dialog.js`) — promise-based confirm built on Modal (`primary`/`danger` variant).
- **Toast** (`toast.js`) — non-blocking notification with `success`/`error`/`info` icons and an optional action button (e.g. "Undo"); auto-dismiss.
- **Empty state** (`empty-state.js`) — consistent icon + title + description placeholder.
- **Inspector** (`inspector.js`) — the right-hand details/editing panel (see §9, §10).
- **Utils** (`utils.js`) — `crossfade()`, `getRelativeTime()`.

### Interaction states & accessibility

- Every interactive element supports Default / Hover / Focus / Active / Disabled, kept visually consistent.
- Accessibility is treated as a feature: keyboard navigation throughout, visible focus, ARIA roles (`listbox`/`option`, `checkbox`, `aria-selected`, `aria-label`), adequate contrast. Icons are minimal, monochrome, and reinforce (never replace) labels.
- **Icons** are inline Lucide-style SVGs embedded directly in markup (no icon dependency).

### Visual identity

Professional, quiet, intentional, durable — "never trendy, never flashy, never
distracting." Golden rule: *if a visual element does not improve clarity, remove
it.*

---

## 14. Coding Conventions and Architectural Rules

From `docs/code-style.md`, `AGENTS.md`, and observed practice:

- **Language/stack:** ES modules (`"type": "module"`), no framework, no TypeScript, no build step beyond Tauri. DOM is manipulated imperatively.
- **Naming:** files `kebab-case` (`focus-view.js`); variables `camelCase`, descriptive, no abbreviations; functions are verbs (`createProject`, `archiveTask`, `loadWorkspace`); `UPPER_SNAKE_CASE` only for true constants (e.g. `STORAGE_KEY`, `DEBOUNCE_MS`).
- **Functions:** small, single-responsibility, pure where practical; prefer early returns; avoid deep nesting.
- **Files/components:** one responsibility per file; avoid components over ~300 lines without justification (Note: several views exceed this — `focus-view.js` ~693 lines, `inspector.js` ~762 lines).
- **Imports order:** standard library → third-party → internal, kept consistent. All imports at the top of the file.
- **Comments:** explain *why*, not *what*; delete commented-out code. (Existing files use concise JSDoc for exported services and inline "why" comments.)
- **Error handling:** never silently swallow; fail loudly in dev, gracefully in prod; protect user data.
- **State:** one source of truth, no duplicated state, compute derived state.
- **Dependencies:** minimal by design. Before adding one, ask if the standard library or existing code already solves it and whether it meaningfully reduces complexity. Bench values a small dependency graph (frontend has *zero* runtime deps; only `@tauri-apps/cli` dev dep).
- **Security hygiene:** user-provided strings are escaped before HTML insertion (`escapeHtml` in the command palette and Inspector) to avoid injection.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`), focused.
- **Branches:** `feature/…`, `fix/…`, `docs/…`.
- **Line endings:** enforced LF via `.gitattributes` (CRLF only for `.bat`/`.cmd`).

### Domain-protection rules (`AGENTS.md`)

- Never introduce UI concepts into the Domain layer; the Domain must be independent of HTML/CSS/JS frameworks, Tauri, and storage engines.
- The UI depends on the Domain; the Domain never depends on the UI; the UI must not bypass Application logic.
- Never persist derived state.
- Never invent undocumented features (AI, cloud sync, notifications, calendars, analytics, settings, animations, plugins, themes, config options) — feature creep is a defect.
- Respect product constraints (max 3 Focus Tasks, max 5 Focus Projects, local-first, keyboard-first, documentation-first).
- Prefer the simplest implementation; avoid speculative architecture, clever code, premature optimization, god objects, hidden side effects, and circular dependencies.
- Refactor only to reduce complexity / improve readability / remove duplication / better match docs — not for personal preference.

### PR checklist (before "done")

Docs still match implementation · no undocumented behavior · naming follows
`terminology.md` · code follows `code-style.md` · no duplicated state · product
constraints intact · the project builds.

---

## 15. Existing Features and Their Behavior

Summary of what actually works today (v0.1 implementation):

- **Focus module** with a hard cap of 3 active tasks, inline create/edit, complete/reopen, drag-to-reorder with ghost preview, Area assignment, park/archive/delete, Undo on delete, "start fresh" clearing, and Area filtering.
- **Capture module** — Quick Capture from anywhere; triage each item to Focus / Parking Lot / Archive or delete.
- **Areas module** — create/rename/archive Areas with validation (required, ≤ 50 chars, unique); computed active/completed/parked stats; guarded archiving; Inspector shows an Area's grouped task list and supports creating a task pre-assigned to the Area.
- **Parking Lot module** — deferred items with relative "parked" time; move to Focus/Capture/Archive or delete (confirm).
- **Archive module** — muted permanent record; restore to Focus/Capture/Parking Lot or permanently delete (confirm).
- **Command Palette** (Ctrl+K) — searches commands, Areas, and items across modules; runs actions; jumps to and selects entities.
- **Quick Capture** (Ctrl+N / C) — a terminal-style prompt modal that saves an active capture item (optionally pre-assigned to an Area).
- **Inspector** — details + editing for tasks (title, notes, area, module, timestamps) and Areas (name, description, active-items count, archived flag, task list); debounced autosave with a save-state indicator; resizable and width-persisted.
- **Shell/UX** — custom decorationless titlebar with working window controls, collapsible sidebar (persisted), responsive breakpoints, toasts (with Undo), promise-based confirm dialogs, crossfade view transitions, keyboard-first navigation everywhere.
- **Persistence** — local `localStorage` JSON with a one-time legacy-key migration.
- **Settings** — placeholder only.

---

## 16. Known Constraints and Non-Goals

### Intentional product constraints

- **Max 3 Focus Tasks** and **max 5 Focused Projects** (design limits to force prioritization). *Implementation note: the 3-task cap is enforced (on active focus items); the 5-Focused-Projects cap is a documented Project-state rule that does not directly apply to the current Area model.*
- **Local-first**, fully offline; no accounts.
- **Keyboard-first**; mouse supported but never required.
- **Opinionated, minimal configuration.**
- **Documentation-first** development.

### Explicit non-goals / anti-goals

Bench must **never** try to become Notion, Obsidian, ClickUp, Jira, Trello, a
CRM, a team-collaboration platform, a knowledge base, an AI assistant, a
calendar, a habit tracker, or a time tracker.

**Explicitly excluded from v0.1:** Search, Cloud Sync, Accounts, AI, Calendar,
Notifications, Plugins, Themes, Time tracking, Collaboration. (Some — search,
themes, sync, import/export — are on the roadmap; see §20.)

**Success/failure definition:** Bench succeeds if opening it answers "what
should I do right now?" within five seconds and stays open all day. If it ever
becomes something the user *manages* rather than something that quietly helps
them work — or costs more effort than the clarity it provides — it has failed.

---

## 17. Important Implementation Details and Decisions

- **No framework, no bundler.** Plain ES modules loaded via `<script type="module">`; Tauri serves `../src` directly (`frontendDist`). This keeps cold start fast and the dependency graph tiny, in line with the principles.
- **`withGlobalTauri: true`** exposes `window.__TAURI__`; `main.js` feature-detects it and falls back to "browser mock mode" so the frontend runs in a plain browser for development.
- **Decorationless window** (`decorations: false`) with a custom titlebar and `data-tauri-drag-region`; window controls use `getCurrentWebviewWindow()` APIs; capabilities in `src-tauri/capabilities/default.json` grant only close/minimize/toggle-maximize/start-dragging.
- **The Rust backend is essentially untouched scaffold** — a single unused `greet` command and the `tauri-plugin-opener` plugin. All product logic is in JavaScript. The lib crate is named `temp_bench_lib` (Windows name-collision workaround).
- **EventBus is synchronous and global**, with per-listener try/catch. Views must unsubscribe on unmount (done via explicit `cleanup*` + `MutationObserver`) to avoid leaks/duplicate handlers.
- **Inspector is strictly presentation-only** — it emits `inspectorUpdate` and uses injected resolvers; `main.js` owns the validation + Repository bridge. This is the clearest example of the documented layer boundary in the code.
- **Debounced + flushed saves** ensure free-text edits persist without thrashing storage and are never lost on navigation/close.
- **Undo** is implemented by capturing the deleted item and its index, then re-saving at that index if the user clicks the toast action.
- **XSS-safety:** any user string rendered via `innerHTML` is passed through `escapeHtml`.
- **Icons are inline SVG** (Lucide-style) rather than an icon font/library — zero dependency, monochrome, `currentColor`.
- **Legacy migration** from `bench_focus_tasks` → `bench_items` runs once and is safe to remove in a future cleanup.

---

## 18. Documentation vs. Implementation Divergences

> These are recorded for accuracy, not as endorsements. Per ADR 0001 and the
> `AGENTS.md` authority order, **documentation wins** until intentionally
> revised. An agent asked to *implement* Bench should follow the docs (and raise
> the divergence); an agent *reasoning about the current code* should be aware
> of these gaps.

1. **Projects → Areas.** Docs (`terminology.md`, `data-model.md`, ADR 0003, PRD) make **Project** the first-class organizational entity with a `state` field (Focused/Active/Parked/Archived). The code implements an **Area** entity (`type: 'area'`) with `name`/`description`/`icon`/`color`/`archived`, and models the four "states" as a per-item **`module`** field (`focus`/`capture`/`parking-lot`/`archive`). The sidebar shows **"Areas"**, not "Projects".
2. **Focus/Parking/Archive are modules, not project states.** In the docs, an item's lifecycle is a Project `state`; in the code it is *which list* (`module`) the item lives in. "Focused" ≈ `module === 'focus'`; "Parked" ≈ `module === 'parking-lot'`; "Archived" ≈ `module === 'archive'`.
3. **Archive is a first-class module in the app** but is described only as a Project *state* / roadmap concern in the docs; it has its own sidebar entry, view, and Alt+5 shortcut.
4. **Notes.** The docs define **Note** as a separate entity with `title`/`content` per Project. The code has no Note entity; instead every task item has a free-text **`notes`** field edited in the Inspector, and Areas have a **`description`** field. There is no per-Area/per-Project notes collection.
5. **Lists / ListItems and the Lists module are not implemented.** Documented (PRD, terminology, data model) but absent from the sidebar, views, and Repository.
6. **Resource value object is not implemented.**
7. **Workspace entity is not materialized** as a record; there is a single implicit workspace (the `localStorage` store). No `Workspace` object with `id`/timestamps exists.
8. **Focus cap semantics.** Docs say "max 3 Focus Tasks" globally; the code enforces "max 3 **active** focus items" (completed focus tasks don't count toward the cap).
9. **Folder layout.** Docs describe `src/{components,modules,domain,services,storage,utils,assets}`; the code uses `src/{core,modules,ui,theme,assets}`. The logical layers still exist but not as those directories.
10. **Sidebar/module naming.** UI uses "Areas" and "Archive"; docs/terminology use "Projects", "Capture", "Lists", "Parking Lot". Terminology consistency (a stated engineering principle) is not fully realized in the current code.
11. **Settings** appears in the sidebar/nav (Alt+6) but is documented as excluded/opinionated-away for v0.1; it is a placeholder.

If you change any of the above to *match* the docs (or change the docs to match
the code), do so deliberately — via a new ADR where the decision is significant.

---

## 19. Build, Run, and Contribution Workflow

### Prerequisites (`BUILD.md`)

- **Git**, **Node.js** (current LTS), **Rust** (via rustup). Tauri OS
  prerequisites for your platform. Recommended editor extensions: Rust Analyzer,
  Even Better TOML, ESLint, Prettier, GitLens.
- **Primary dev platform:** Windows 11; supported: Windows, macOS, Linux.

### Commands

```bash
npm install            # install @tauri-apps/cli
npm run tauri dev      # launch Bench in development
npm run tauri build    # produce distributable artifacts
```

(There is no separate frontend build/test/lint script in `package.json`; the
frontend is served as-is. `npm run tauri` is the only script.)

### Development workflow

Documentation-Driven: **Idea → Discussion → Decision → Documentation →
Implementation → Review → Commit.** Never skip the documentation step. Before a
PR: docs updated, code follows `code-style.md`, architecture still aligns, new
terminology documented, project builds, commit messages follow Conventional
Commits, and the change passes the Bench Test.

### Contribution & community

- Read (in order) README → principles → terminology → prd → data-model →
  relevant ADRs before contributing.
- AI is welcome for implementation, but a human owns product/architecture
  decisions and must review AI output.
- Significant decisions require a new ADR; don't silently change documented
  behavior.
- Issue templates: bug report, feature request, documentation, question. A PR
  template is provided.
- Code of Conduct: be respectful, critique ideas not people, assume good intent.

### Changelog & versioning

Keep a Changelog format + Semantic Versioning. Release codenames: v0.1.0
**Workbench**, v0.2.0 **Sharpen**, v0.3.0 **Craft**, v1.0.0 **Built**. The
changelog documents user-meaningful changes per release, not every commit.

---

## 20. Future Roadmap

From `ROADMAP.md` / `docs/prd.md` (documented intentions, not promises). Every
milestone must reduce cognitive load, improve clarity, preserve simplicity,
respect the documentation-first workflow, and avoid feature creep.

- **v0.1.0 — Workbench (current):** foundation — Tauri app, sidebar nav, Projects, Tasks, Focus, Capture, Lists, Parking Lot, Notes, local JSON persistence, keyboard shortcuts, dark mode. Goal: already replace a Notepad workflow.
- **v0.2.0 — Sharpen:** global search, better archive management, improved keyboard navigation, faster interactions, UI polish, performance. Goal: noticeably faster/smoother without added complexity.
- **v0.3.0 — Craft:** SQLite persistence, import/export, backup/restore, attachments, improved data reliability. Goal: resilient for long-term daily use.
- **v1.0.0 — Built:** stability, bug fixes, documentation review, performance optimization, accessibility improvements. Goal: polished, reliable, recommendable.

**Beyond 1.0 (explicitly *not planned*; must pass the Bench Test first):**
optional cloud sync, multiple workspaces, plugin system, mobile companion,
calendar integration.

**Will never be a goal:** becoming Notion / ClickUp / Jira / Trello / a CRM / a
team collaboration platform / a knowledge management system / a habit tracker /
a time tracker.

---

## 21. Glossary

- **Bench** — the product; a local-first desktop command center for prioritization.
- **Workspace** — the user's entire Bench environment; owns all persistent data. Exactly one exists. (Implicit in code; not a materialized record.)
- **Entity** — a persistent object with an immutable ID and a lifecycle (Workspace, Project, Task, Note, CaptureItem, List).
- **Value Object** — an object with no independent identity that lives inside an Entity (Resource, ListItem).
- **Project** — *(documented)* the primary organizational unit; everything meaningful belongs to exactly one. **Implemented as "Area".**
- **Area** — *(implemented)* the organizational entity (`type: 'area'`): `name`, `description`, `icon`, `color`, `archived`. Items reference an Area via `areaId`.
- **Task / Item** — a single actionable piece of work. In code, a flat `Item` with `title`, `notes`, `status`, `module`, optional `areaId`, timestamps.
- **Module** — user-facing functionality / a section of the app (Focus, Capture, Areas, Parking Lot, Archive, Settings). Not stored; presents data. In code, also the per-item field naming which list an item belongs to.
- **Focus** — the module (and derived set) of tasks the user is actively working on; `module === 'focus'`. Focus is **derived**, never stored (ADR 0002). Cap: 3 active.
- **Capture** — frictionless inbox of unprocessed thoughts (`module === 'capture'`); later triaged.
- **Parking Lot** — intentionally deferred ideas (`module === 'parking-lot'`) — "matter, just not today."
- **Archive** — permanent record of finished/discarded items (`module === 'archive'`).
- **Note** — *(documented)* long-form knowledge attached to a Project. **In code:** the free-text `notes` field on each item (Areas use `description`).
- **CaptureItem** — *(documented)* a temporary unprocessed thought entity. **In code:** an item with `module: 'capture'`.
- **List / ListItem** — *(documented)* reusable checklists and their entries. **Not implemented.**
- **Resource** — *(documented)* reference material (title/url/icon) inside a Project. **Not implemented.**
- **State (Project)** — *(documented)* Focused / Active / Parked / Archived. **In code:** approximated by the `module` field.
- **Derived State** — information computed from existing data instead of stored (Focus, Focused Projects, Project Progress, Area stats, relative times).
- **View** — a screen within a Module (Focus View, Areas View, etc.); mounted by the View Manager into `#active-view`.
- **Component** — a reusable UI building block (Button, Input, Checkbox, Modal, Dialog, Toast, Inspector, Empty State). Implementation detail, not part of the domain.
- **Inspector** — the right-hand contextual details/editing panel; presentation-only, emits `inspectorUpdate`.
- **Command Palette** — the `Ctrl+K` overlay for running commands and searching entities.
- **Quick Capture** — the `Ctrl+N` / `C` prompt modal for instant capture.
- **EventBus** — the global synchronous pub/sub used to decouple producers and consumers of domain events.
- **Repository** — the single gateway to persistence and the flat item store; the app's single source of truth.
- **DDD (Documentation-Driven Development)** — Bench's process where documentation precedes and defines implementation.
- **ADR (Architecture Decision Record)** — a numbered, append-only record of a significant decision (`docs/decisions/`).
- **The Bench Test** — the five-question gate every feature must pass.
- **Glanceability** — the property of answering "what should I do right now?" within five seconds.

---

> Build less. Focus more. Keep the bench clean.
