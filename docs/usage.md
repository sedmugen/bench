# User & Workflow Guide

> **A practical guide to operating Bench as your daily prioritization engine.**

---

## 1. The Core Mental Model

Bench is designed around one guiding truth:

> **Your brain is for making decisions, not storing them.**

Unlike typical project management software that encourages endless organizing, Bench provides a focused daily triage loop:

```
[ Incoming Thought / Task ]
            │
            ▼
     [ 1. Capture ] ───(Triage)───► [ Parking Lot (Defer) ]
            │                     ► [ Archive (Retire) ]
            ▼
  [ 2. Assign to Area ]
            │
            ▼
    [ 3. Promote to Focus ] (Max 3 Tasks Active)
            │
            ▼
     [ 4. Execute & Complete ]
```

---

## 2. Daily Workflows by Module

### 1. Focus (`Alt+1` / `λ`)
- **The Golden Rule:** You can have at most **3 active tasks** in Focus at any given moment.
- **Adding Tasks:** Press `A` or use the input line at the top. Once 3 active tasks are reached, the create input hides to protect your attention.
- **Completing Tasks:** Check the checkbox or press `Space`. Completed tasks remain visible below active tasks for glanceable daily accomplishment tracking.
- **Reordering:** Drag items using the grab handle or reorder via keyboard to set immediate execution sequence.
- **Area Assignment:** Click the Area tag or open the task in the Inspector to assign it to an initiative.

![Focus Cockpit](../assets/images/focus.png)

### 2. Capture (`Alt+2` / `κ`)
- **Frictionless Entry:** Use **Quick Capture** (`Ctrl+N` / `⌘N` or `C`) from any screen.
- **Triage Keystrokes:**
  - `F`: Promote selected item immediately into Focus (respecting the 3-task limit).
  - `P`: Defer to Parking Lot.
  - `A`: Move to Archive.
  - `D` or `Delete`: Delete item with instant Undo toast support.

### 3. Areas (`Alt+3` / `α`)
- **Hierarchical Initiatives:** Create nested responsibility trees (e.g. `Academics > Computer Science > Compilers`).
- **Inspection & Editing:** Selecting an Area opens its workspace in the Inspector drawer, showing its full path, description, child areas, and live task statistics.
- **Safe Deletion:** Deleting an Area provides an intelligent dialog to reassign active tasks and reparent child areas without data loss.

![Areas Hierarchy](../assets/images/areas.png)

### 4. Parking Lot (`Alt+4` / `π`)
- **Incubate Without Distraction:** Move tasks here when they are important but not actionable today.
- **Relative Age:** Displays elapsed parked time ("parked 3d ago") to assist in periodic review.

### 5. Archive (`Alt+5` / `Ω`)
- **Permanent Audit Trail:** Contains retired and completed historical items rendered with calm, muted contrast.
- **Restoration:** Press `R` or click Restore to re-route an archived item back to Focus, Capture, or Parking Lot.

### 6. Jot (`Alt+6` / `ν`)
- **Markdown Scratchpad:** Instant, persistent scratchpad for meeting notes, temporary code snippets, and daily planning.
- **Formatting Toolbar & Live Preview:** Switch seamlessly between raw markdown editing and rich preview. Supports custom fonts, line heights, and editor widths.

![Jot Markdown Scratchpad](../assets/images/jot.png)

### 7. Log (`Alt+7` / `Σ`)
- **Activity Journal:** View completed milestones in a calendar-based or chronological activity log.

### 8. Clips (`Alt+8` / `γ`)
- **Visual Reference Cards:** Store snippets, bookmarks, and reference materials.
- **Color Coding:** Assign one of 15 custom palette tints.
- **Tags:** Organize using `#tags` which are automatically normalized and searchable.
- **Pinning:** Pin critical cards to keep them locked to the top of the masonry board.

![Clips Board](../assets/images/clips.png)

### 9. Command Palette (`Ctrl+K` / `⌘K`)
- **Global Finder:** Instantly search across all modules, commands, area names, and task titles. Type to filter, use `↑`/`↓` to navigate, and press `Enter` to jump.

![Command Palette](../assets/images/palette.png)

---

## 3. Keyboard Master Cheatsheet

### Global Shell Shortcuts
| Key | Action |
|---|---|
| `Ctrl+K` / `⌘K` | Toggle Command Palette |
| `Ctrl+N` / `⌘N` / `C` | Open Quick Capture modal |
| `Ctrl+B` / `⌘B` / `Ctrl+L` | Toggle Sidebar collapse |
| `Ctrl+J` / `⌘J` | Open Settings |
| `Alt+1` … `Alt+8` | Navigate modules: Focus (`1`), Capture (`2`), Areas (`3`), Parking Lot (`4`), Archive (`5`), Jot (`6`), Log (`7`), Clips (`8`) |
| `Escape` | Close active modal / clear selection / blur editor |

### List & Task Actions
| Key | Action |
|---|---|
| `↑` / `↓` | Move selection cursor |
| `Enter` / `E` | Open selected item in Inspector / inline edit |
| `Space` | Toggle task completion checkbox |
| `F` | Promote selected item to Focus |
| `P` | Move selected item to Parking Lot |
| `A` | Move selected item to Archive |
| `D` / `Delete` | Delete selected item |
| `R` | Restore item (in Archive) |

---

## 4. Customization & Themes

Navigate to **Settings** (`Ctrl+J` / `⌘J`) to customize:
- **Theme Luminance:** 7 calibrated dark and light themes (Deep Dark, Dark, Nord Dark, Neutral Dark, Sand Light, Neutral Light, Light).
- **Accent Tints:** Blue, Green, Amber, Rose, Purple, or Cyan.
- **Navigation Style:** Modern Greek Bench Symbols (`λ`, `κ`, `α`, `π`, `Ω`, `ν`, `Σ`, `γ`) or Classic Lucide SVGs.
- **Keybinding Presentation:** Mac (`⌥1`, `⌘J`) or Windows (`Alt+1`, `Ctrl+J`).
- **Typography:** JetBrains Mono, Fira Code, Source Code Pro, Inter, or system fonts.
