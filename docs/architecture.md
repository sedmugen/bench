# Architecture & System Design

> **The architecture exists to protect the domain model.**

---

## 1. Architectural Overview

Bench is engineered as a **Documentation-Driven, Layered Architecture** with strict boundary separation between host platform integration, domain business rules, persistence gateways, and presentation rendering.

```
┌────────────────────────────────────────────────────────┐
│                   1. Presentation                      │
│   src/index.html · src/styles.css · src/theme/         │
│   src/modules/* (Views) · src/ui/* (Components/Modals) │
└───────────────────────────▲────────────────────────────┘
                            │ (DOM Events / Injected Resolvers)
┌───────────────────────────┴────────────────────────────┐
│                2. Application Bridge                   │
│   src/main.js · src/core/shortcuts.js · EventBus       │
└───────────────────────────▲────────────────────────────┘
                            │ (Domain Events & Operations)
┌───────────────────────────┴────────────────────────────┐
│               3. Domain & Persistence                  │
│   src/core/repository.js · src/core/clips-store.js     │
│   src/core/jot-store.js · src/core/settings-store.js   │
└───────────────────────────▲────────────────────────────┘
                            │ (Storage Engine Abstraction)
┌───────────────────────────┴────────────────────────────┐
│                 4. Host Runtime Shell                  │
│   src-tauri/ (Tauri v2, Rust) / scripts/dev-server.js   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Layer Responsibilities & Isolation Rules

### 1. Presentation Layer (`src/modules/`, `src/ui/`, `src/theme/`)
- **Role:** Pure rendering of state and capture of user interaction.
- **Components:** View modules (Focus, Areas, Clips, etc.), reusable atomic UI widgets (Button, Checkbox, Dialog, Toast, Inspector), and design token styling.
- **Rule:** The Presentation layer contains zero business rules. It never modifies raw storage directly; it dispatches intents to the Application/Domain layer and listens to `EventBus` for reactive re-renders.

### 2. Application & Coordination Layer (`src/main.js`, `src/core/view-manager.js`, `src/core/shortcuts.js`)
- **Role:** Coordinates application bootstrap, global keybinding registries, view routing, breakpoint adaptation, and inter-module event bridging.
- **Rule:** Mediates between UI components (such as the Inspector) and Domain stores, injecting label resolvers to prevent circular dependencies.

### 3. Domain & Persistence Layer (`src/core/repository.js`, `src/core/clips-store.js`, `src/core/jot-store.js`, `src/core/settings-store.js`)
- **Role:** The heart of Bench. Encapsulates business invariants (e.g. 3-task Focus limit, acyclic Area hierarchies, tag normalization) and provides single-source-of-truth storage gateways.
- **Rule:** Completely independent of DOM, CSS, Tauri, or browser UI concepts. Can be tested headlessly in pure Node.js environments.

### 4. Host Platform Layer (`src-tauri/`, `scripts/dev-server.js`, `src/core/platform.js`)
- **Role:** Provides OS window host chrome (Tauri v2) or zero-dependency browser HTTP hosting (`scripts/dev-server.js`).
- **Rule:** Exposes platform capabilities behind the unified `Platform` abstraction.

---

## 3. Data Flow & Reactive Lifecycle

```
[User Keystroke / Action]
          │
          ▼
[View Handler / Command]
          │
          ▼
[Domain Store Method (e.g. Repository.save)]
          │ (Enforces Business Rules & Validations)
          ▼
[Storage Engine Write (localStorage / SQLite)]
          │
          ▼
[EventBus Domain Notification (e.g. 'itemCreated')]
          │
          ▼
[Subscribed Views Re-render Reactive Slices]
```

---

## 4. Physical Directory Layout

```
src/
├── core/                         # Cross-cutting domain & application infrastructure
│   ├── repository.js             # Primary Task & Area single source of truth
│   ├── clips-store.js            # Clips visual notes store & tag normalizer
│   ├── jot-store.js              # Markdown scratchpad persistence
│   ├── settings-store.js         # Configuration & multi-theme engine
│   ├── module-registry.js        # Module metadata, symbols, and icon registry
│   ├── event-bus.js              # Synchronous decoupled event dispatcher
│   ├── shortcuts.js              # Keyboard shortcut manager
│   ├── view-manager.js           # View routing and mounting manager
│   ├── quick-capture.js          # Global quick capture modal controller
│   └── platform.js               # Runtime environment detector (Tauri vs Browser)
├── modules/                      # Operational view controllers
│   ├── focus-view.js             # Focus 3-task cockpit
│   ├── capture-view.js           # Capture inbox triage
│   ├── areas-view.js             # Hierarchical areas tree & statistics
│   ├── parking-lot-view.js       # Deferred ideas incubator
│   ├── archive-view.js           # Completed & retired audit trail
│   ├── jot-view.js               # Markdown scratchpad editor
│   ├── recap-view.js             # Activity & completion journal (Log)
│   ├── clips-view.js             # Color-coded visual masonry canvas
│   └── settings-view.js          # Preference panel
├── ui/                           # Reusable presentation widgets & helpers
│   ├── inspector.js              # Contextual details drawer
│   ├── task-row.js               # Standardized task row component
│   ├── modal.js / dialog.js      # Modal frames and promise-based confirmations
│   ├── toast.js                  # Toast notification service with Undo support
│   └── markdown-renderer.js      # Zero-dependency XSS-safe markdown compiler
├── theme/
│   └── theme.css                 # CSS custom property tokens and color palettes
├── index.html                    # Application HTML shell
├── main.js                       # Bootstrap and application bridge
└── styles.css                    # Global application styles
```

---

## 5. Architectural Invariants & Golden Rules

1. **Domain Independence:** The Domain must never know about the UI or DOM.
2. **Derived State Is Never Persisted:** All aggregated statistics, active Focus sets, hierarchical trees, and breadcrumbs are computed dynamically.
3. **Single Source of Truth:** Data mutations occur strictly through the designated store gateways.
4. **Documentation Drives Implementation:** Code is the execution of documented architecture, never an improvisation.
