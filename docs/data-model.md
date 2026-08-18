# Data Model

> **The UI is temporary. The data model is forever.**

---

# Purpose

This document defines every persistent concept that exists within Bench. It is independent of UI, framework, or storage engine (JSON, SQLite, or future engines).

---

# Model Layers

```
┌────────────────────────────────────────────────────────┐
│                      Entities                          │
│   Area · Task · Clip · Jot · Settings                  │
├────────────────────────────────────────────────────────┤
│                      Modules                           │
│   Focus · Capture · Areas · Parking Lot · Archive      │
│   Jot · Log · Clips · Settings                         │
├────────────────────────────────────────────────────────┤
│                       Views                            │
│   Focus View · Areas View · Clips View · Log View ...  │
├────────────────────────────────────────────────────────┤
│                     Components                         │
│   Sidebar · Inspector · TaskRow · Modal · Toast        │
└────────────────────────────────────────────────────────┘
```

---

# Entities & Persistence Schemas

## 1. Entity: Area (`type === 'area'`)

Represents an ongoing initiative or area of responsibility. Supports recursive multi-level parent-child hierarchy.

### Schema:
```typescript
interface Area {
  id: string;               // UUID (immutable)
  type: 'area';             // Entity discriminator
  name: string;             // Required, <= 50 chars, unique per parent level
  description: string;      // Free-form markdown description
  icon: string;             // Lucide icon identifier (default: 'folder')
  color: string;            // Accent color tint
  parentId: string | null;  // Parent Area ID (null for root areas)
  archived: boolean;        // Soft-delete flag
  createdAt: number;        // Epoch ms
  updatedAt: number;        // Epoch ms
}
```

### Constraints & Invariants:
- `name` is required, trimmed, max 50 characters, and unique case-insensitively among siblings with the same `parentId`.
- The hierarchy graph must remain strictly **acyclic** (`wouldCauseCycle(areaId, targetParentId) === false`).
- Deleting an Area allows safe reassignment of all referencing tasks and automatic reparenting of child areas (`deleteAreaForce`).

---

## 2. Entity: Task (`type !== 'area'`)

Represents a single actionable piece of work.

### Schema:
```typescript
interface Task {
  id: string;               // UUID (immutable)
  title: string;            // Actionable task title
  notes: string;            // Long-form markdown notes edited in Inspector
  status: 'active' | 'completed';
  module: 'capture' | 'parking-lot' | 'archive';
  focused: boolean;         // Derived focus view flag
  areaId?: string;          // Optional reference to an Area entity
  completedAt: number | null; // Epoch ms when marked completed
  createdAt: number;        // Epoch ms
  updatedAt: number;        // Epoch ms
}
```

### Constraints & Invariants:
- A Task cannot be active in Focus if 3 active tasks already exist in Focus (`activeFocusCount < 3`).
- Completed tasks stamp `completedAt` and retain their `focused` flag for completed focus history.
- Moving a task to `parking-lot` or `archive` automatically clears `focused = false`.

---

## 3. Entity: Clip (`bench_clips`)

Represents a visual, color-coded snippet or reference note.

### Schema:
```typescript
interface Clip {
  id: string;               // UUID (immutable)
  title: string;            // Clip heading
  content: string;          // Plain/Markdown text body
  tags: string[];           // Cleaned, lowercased, deduplicated tags
  areaId: string | null;    // Optional reference to an Area
  pinned: boolean;          // Pinned cards render at the top of the canvas
  color: string;            // Color token identifier (15 palette choices)
  archived: boolean;        // Archived card state
  createdAt: number;        // Epoch ms
  updatedAt: number;        // Epoch ms
}
```

---

## 4. Entity: Jot (`bench_jot`)

Represents the user's free-form markdown scratchpad.

### Schema:
- Stored as raw markdown text string with debounced autosaving.

---

## 5. Entity: Settings (`bench_settings`)

Represents user preferences, theme luminance levels, layout rules, and keybinding styles.

### Key Fields:
- `theme`: Theme identifier (`dark`, `deep-dark`, `nord-dark`, `sand-light`, `light`, `system`)
- `accentColor`: Accent tint (`blue`, `green`, `amber`, `rose`, `purple`, `cyan`)
- `navigationIconStyle`: `'bench-symbols'` (Greek glyphs) vs `'classic-icons'` (Lucide SVGs)
- `shortcutStyle`: `'mac'` vs `'windows'`
- `compactMode`, `fontSize`, `reduceAnimations`, `clipTaskTitles`

---

# Derived State

Derived state is calculated on the fly and never redundantly persisted:

| Derived Concept | Calculation |
|---|---|
| **Active Focus Tasks** | `items.filter(i => i.type !== 'area' && i.status === 'active' && i.focused === true)` |
| **Area Statistics** | Computed count of tasks referencing an Area by `status` and `module` |
| **Hierarchical Tree** | In-memory depth-first traversal of areas by `parentId` |
| **Area Full Path** | `area.name` joined with ancestor chain (e.g. `Projects > Bench > Core`) |
| **Elapsed Relative Time** | Formatted string ("2h ago", "yesterday") from `updatedAt` / `createdAt` |

---

# Global Invariants

1. **Single Workspace**: Exactly one workspace exists in storage.
2. **Focus Cap**: Maximum 3 active Focus tasks globally.
3. **Stable Identity**: Entity IDs are immutable UUIDs.
4. **Domain Independence**: Entity schemas never depend on UI frameworks or storage drivers.
