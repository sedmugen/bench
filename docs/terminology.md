# Bench Terminology

> Consistent language reduces cognitive load.
>
> Bench uses one term for one concept. Avoid synonyms in documentation,
> code, UI, commit messages, and discussions.

---

# Vocabulary Rules

- One concept → One name.
- If a term is defined here, use it everywhere.
- New terminology must be documented before it is adopted.

---

# Domain Entities & Value Objects

## Workspace

The user's entire Bench environment. Exactly one Workspace exists and owns all persistent data.

## Entity

A persistent object with an immutable identifier and lifecycle.

Entities in Bench:
- **Area**: The primary organizational container for initiatives and responsibilities, supporting recursive parent-child hierarchy.
- **Task**: A single actionable piece of work. Belongs optionally to an Area and possesses a module routing state (`capture`, `focus`, `parking-lot`, `archive`) and focus flag.
- **Clip**: A visual note card featuring markdown content, normalized tags, color coding (15 palette choices), and pinned state.
- **Jot**: Free-form markdown scratchpad text.

## Value Objects

An object that exists only as part of an Entity or Module configuration.
- **Tag**: Normalized label string attached to Clips (`normalizeTags`).
- **AreaPath**: Hierarchical ancestor trail string (e.g. `Projects > Bench > Core`).

---

# Core Modules

Modules are user-facing operational functional areas (not persistent entities themselves).

1. **Focus (`λ` / `Alt+1`)**: The 3-task active priority cockpit. Focus is **derived state** (`focused == true`, `status == 'active'`).
2. **Capture (`κ` / `Alt+2`)**: Frictionless inbox for rapid thought collection and triage.
3. **Areas (`α` / `Alt+3`)**: Recursive initiative hierarchy with cycle detection, task reassignment, and aggregated live stats.
4. **Parking Lot (`π` / `Alt+4`)**: Intentional incubator for deferred tasks ("matters, just not today").
5. **Archive (`Ω` / `Alt+5`)**: Permanent low-contrast audit trail of completed and retired items.
6. **Jot (`ν` / `Alt+6`)**: Instant auto-saving markdown scratchpad with live preview.
7. **Log (`Σ` / `Alt+7`)**: Chronological and calendar-based completion activity journal.
8. **Clips (`γ` / `Alt+8`)**: Color-coded visual card canvas with responsive masonry layout.
9. **Settings (`⌘J` / `Ctrl+J`)**: Configuration center for themes, accent colors, typography, and shortcut styles.

---

# UI Components & Overlay Shell

- **Titlebar**: Custom frameless window drag region and system window control buttons.
- **Sidebar**: Primary module navigation bar, collapsible to a 56px icon-only rail.
- **Command Palette (`Ctrl+K` / `⌘K`)**: Global modal fuzzy finder for commands, areas, tasks, and notes.
- **Quick Capture (`Ctrl+N` / `⌘N` / `C`)**: Global modal overlay for instant thought input.
- **Inspector**: Contextual right-hand drawer (resizable 260px–520px) for in-depth task notes and Area workspace management.
- **Toast**: Non-blocking notification banner supporting optional single-click actions (e.g. "Undo").

---

# Derived State

Information computed dynamically from persistent data on read:
- **Focus Tasks** = Active tasks where `focused == true` and `status == 'active'`.
- **Area Statistics** = Aggregated counts of active, completed, and parked tasks referencing an `areaId`.
- **Area Hierarchy Path** = Ancestor path string resolved by recursively traversing `parentId`.
- **Relative Timestamps** = Human-readable elapsed times ("2h ago", "yesterday") derived from epoch timestamps.

---

# Preferred Terminology Matrix

| Preferred Term | Avoid |
|---|---|
| Module | Feature / Tab / Screen |
| View | Page / Window |
| Area | Project / Category / Folder |
| Task | Todo / Item (generic) |
| Capture | Inbox / Dump |
| Parking Lot | Someday / Backlog |
| Clips | Sticky Notes / Cards |
| Jot | Scratchpad / Pad |
| Log | History / Recap |
| Command Palette | Quick Open / Search bar |

---

> *The terminology is the contract. Build the contract faithfully.*
