# Product Requirements Document (PRD)

# Bench — Desktop Command Center

Status: Active (`v0.3.1`)

---

# Vision

Bench is a lightweight, local-first, keyboard-first desktop command center and prioritization engine.

Bench does not try to organize everything. Bench exists to answer one question within five seconds:

> **"What should I be doing right now?"**

---

# Core Product Principles

- **Reduce Cognitive Load:** Every interaction simplifies the user's mental model.
- **Focus Is Finite:** Hard limit of maximum 3 active Focus tasks.
- **Local-First & Offline:** 100% functional without internet connectivity or forced accounts.
- **Keyboard-First:** All navigation, capture, triage, and editing accessible via keystrokes.
- **Calm Interface:** Monospace typography, flat TUI aesthetic, zero distraction animations.

---

# Module Scope & Capabilities

## 1. Focus Module (`λ` / `Alt+1`)
- Displays up to 3 active priority tasks.
- Inline task creation, editing, checkbox completion, drag-and-drop ordering, and Area filtering.
- Automatic cap enforcement: creation collapses into constraint banner when 3 tasks are active.

## 2. Capture Module (`κ` / `Alt+2`)
- Rapid frictionless thought inbox.
- Triage shortcuts to Focus (`F`), Parking Lot (`P`), Archive (`A`), or Delete (`D`).

## 3. Areas Module (`α` / `Alt+3`)
- Multi-tier recursive initiative hierarchy (`parentId`).
- Cycle prevention, task reassignment, child reparenting, and live aggregated progress counts.

## 4. Parking Lot Module (`π` / `Alt+4`)
- Intentional incubator for deferred tasks that matter, just not today.
- Relative elapsed time tracking and single-key promotion to Focus or Capture.

## 5. Archive Module (`Ω` / `Alt+5`)
- Permanent low-contrast audit record of completed and retired items with restore options.

## 6. Jot Module (`ν` / `Alt+6`)
- Instant markdown scratchpad with live preview and debounced auto-saving.

## 7. Log Module (`Σ` / `Alt+7`)
- Completion journal with calendar timeline and chronological views.

## 8. Clips Module (`γ` / `Alt+8`)
- Visual card canvas with 15-color palette, normalized tag filtering, pinned cards, and masonry layout.

## 9. Settings Module (`⌘J` / `Ctrl+J`)
- Two-pane preferences suite managing 7 theme luminance levels, accent colors, typography, icon styles, and database resets.

## 10. Global Systems
- **Command Palette (`Ctrl+K` / `⌘K`)**: Fuzzy finder across commands, areas, tasks, and notes.
- **Quick Capture (`Ctrl+N` / `⌘N` / `C`)**: Universal modal overlay for instant capture from any view.
- **Inspector Panel**: Resizable contextual details drawer.
- **Dual Runtime**: Native Tauri v2 desktop shell + zero-dependency web browser development server (`npm run dev:web`).

---

# Technical Architecture

- **Desktop Shell:** Tauri v2 (Rust 2021)
- **Frontend:** Pure Vanilla JavaScript (ES Modules), Semantic HTML5, CSS3 Custom Properties
- **Persistence:** Local Storage JSON repository (isolated for future SQLite engine driver)
- **Testing:** Node.js native test runner (`node:test`)
