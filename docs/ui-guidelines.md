# UI & Design System Guidelines

> **Bench should feel calm, intentional, and invisible.**  
> *The interface exists to support thinking, not compete with it.*

---

## 1. Design Philosophy

Bench is designed to stay open all day as a quiet companion on your secondary screen or desktop workspace. It feels more like an operating system terminal utility than a flashy web app.

### Core Aesthetic Principles:
- **Calm Over Stimulation:** Flat borders, monospace typography, zero rounded corners (`--radius: 0px`), zero box shadows (`--shadow: none`), and zero flashy gradient backgrounds.
- **Color Communicates, Never Decorates:** Color is used exclusively for state semantics (Focus active accent, danger/destructive action, area tags, and 15 calibrated clip tints).
- **Instant Response:** Zero gratuitous animation delays. View transitions use instant, subtle cross-fades (`100ms`).

---

## 2. Layout Structure

Bench uses an adaptive three-column desktop grid:

```
┌────────────────────────────────────────────────────────┐
│ [≡] bench (Custom Titlebar)          [Ctrl+K] [-] [□] [x]│
├──────────────┬──────────────────────────┬──────────────┤
│              │ Header: λ Focus          │              │
│  λ Focus     ├──────────────────────────┤  Inspector   │
│  κ Capture   │                          │  Drawer      │
│  α Areas     │ Primary Workspace View   │  (Contextual │
│  π Parking   │                          │   Details &  │
│  Ω Archive   │                          │   Area Tasks)│
│  ν Jot       │                          │              │
│  Σ Log       │                          │              │
│  γ Clips     │                          │              │
│  ─────────── │                          │              │
│  ⌘J Settings │                          │              │
│  ⌘L Collapse │                          │              │
└──────────────┴──────────────────────────┴──────────────┘
```

1. **Titlebar (34px):** Frameless native drag region with application branding, Command Palette trigger button, and native window control triggers.
2. **Sidebar (200px):** Module navigation rail. Collapsible to a 56px icon-only rail (auto-collapses below 700px viewport width).
3. **Primary Content (`#active-view`):** The focused workspace rendering the active module.
4. **Inspector Drawer (320px default, resizable 260px–520px):** Contextual inspection and editing panel for tasks and areas. Automatically closes below 900px viewport width.
5. **Portals:** `#toast-portal` (non-blocking toast notifications with Undo) and `#overlay-portal` (modals and command palette).

---

## 3. Typography & Design Tokens

### Monospace Typography
- **Primary Typeface:** `JetBrains Mono`, monospace
- **Alternative Configurable Fonts:** `Fira Code`, `Source Code Pro`, `Inter`, `Lora`, `Merriweather`
- **Scale:**
  - `--font-size-xs`: `12px` (meta badges, timestamps, shortcuts)
  - `--font-size-sm`: `13px` (subtitles, secondary labels)
  - `--font-size-md`: `14px` (task titles, note body, inputs)
  - `--font-size-lg`: `16px` (headers, titlebar branding)

### Spacing Scale
- `--space-2xs`: `4px`
- `--space-xs`: `8px`
- `--space-sm`: `12px`
- `--space-md`: `16px`
- `--space-lg`: `24px`
- `--space-xl`: `32px`

---

## 4. Theme Luminance Levels

Bench supports 7 calibrated theme levels controlled via `data-theme`:
1. `deep-dark`: Pitch-black OLED background (`#000000`)
2. `dark`: Standard Tokyo Night near-black (`#0b0b0b`)
3. `nord-dark`: Deep slate blue palette (`#1a1b26`)
4. `neutral-dark`: Balanced charcoal dark (`#18181b`)
5. `sand-light`: Warm parchment light theme (`#f5f2eb`)
6. `neutral-light`: Clean neutral grey light theme (`#f4f4f5`)
7. `light`: Pure crisp white light theme (`#ffffff`)

---

## 5. Iconography & Symbol System

Bench supports two iconography modes via `ModuleRegistry`:
1. **Bench Greek Symbols (`data-nav-icon-style="bench-symbols"`):**
   - Focus: `λ` (Lambda)
   - Capture: `κ` (Kappa)
   - Areas: `α` (Alpha)
   - Parking Lot: `π` (Pi)
   - Archive: `Ω` (Omega)
   - Jot: `ν` (Nu)
   - Log: `Σ` (Sigma)
   - Clips: `γ` (Gamma)
2. **Classic Icons (`data-nav-icon-style="classic-icons"`):**
   - Clean, monochrome Lucide SVG paths embedded inline with `currentColor`.
