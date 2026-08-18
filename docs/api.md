# Bench Core API Reference

> **Developer Reference for Core Domain, Persistence Stores, and Infrastructure APIs.**

---

## 1. Repository (`src/core/repository.js`)

The `Repository` is the single gateway to persistence and domain entity operations for Tasks and Areas.

### Task Management

#### `getAll(): Array<Item>`
Retrieves all items stored in local persistence. Automatically migrates legacy task records if found.

#### `get(id: string): Item | null`
Finds an item or Area entity by its UUID.

#### `isFocusTask(item: Item): boolean`
Evaluates whether an item qualifies as an active Focus task (`status === 'active'`, `focused === true`, not in `parking-lot` or `archive`).

#### `getActiveFocusTasks(): Array<Item>`
Returns all items currently active in the Focus view (capped at 3).

#### `getByModule(moduleName: string): Array<Item>`
Retrieves all non-area, non-archived items belonging to a specific module (`'capture'`, `'focus'`, `'parking-lot'`, `'archive'`).

#### `save(item: Partial<Item>, atIndex?: number): Item`
Creates a new task or updates an existing one. Enforces the 3-task Focus limit and assigns UUIDs/timestamps. Fires `itemCreated` or `itemUpdated`.

#### `update(id: string, updates: Partial<Item>): Item | null`
Applies partial property updates to an item. Handles focus promotion checks and stamps `completedAt`. Fires `itemUpdated`.

#### `remove(id: string): boolean`
Permanently removes an item from storage. Fires `itemDeleted`.

#### `move(id: string, targetModule: string): Item | null`
Transfers a task between modules (`'focus'`, `'capture'`, `'parking-lot'`, `'archive'`). Clears focus state if moving to parking lot or archive.

#### `reorder(moduleName: string, orderedIds: string[]): void`
Persists the updated order of tasks within a module (e.g. following drag-and-drop). Fires `itemMoved`.

#### `clearModule(moduleName: string): void`
Deletes all items belonging to a specified module. Fires `itemDeleted` per item.

#### `clearAll(): void`
Completely wipes all items, Jot notes, and Clips from local storage.

---

### Area Hierarchy Management

#### `getAreas(): Array<Area>`
Returns all Area entities.

#### `getActiveAreas(): Array<Area>`
Returns non-archived Areas sorted case-insensitively by name.

#### `saveArea(area: Partial<Area>): Area | null`
Creates or updates an Area entity. Validates name constraints (required, ≤ 50 chars, unique among siblings). Fires `areaCreated` or `areaUpdated`.

#### `deleteArea(id: string): boolean`
Deletes an Area if no tasks currently reference it. Fires `areaDeleted`.

#### `deleteAreaForce(id: string, reassignAreaId: string | null): boolean`
Force-deletes an Area, reassigning all orphaned tasks to `reassignAreaId` and reparenting child areas to the deleted area's parent. Fires `areaDeleted` and `itemUpdated`.

#### `wouldCauseCycle(areaId: string, targetParentId: string): boolean`
Traverses ancestors to determine if assigning `targetParentId` to `areaId` would create a circular dependency.

#### `getAreaPath(areaId: string): Array<Area>`
Returns an array of ancestor Area objects from root down to `areaId`.

#### `getAreaPathString(areaId: string, separator?: string): string`
Returns a formatted breadcrumb trail (e.g. `"Projects > Bench > Core"`).

#### `getHierarchicalActiveAreas(): Array<Area & { depth: number, pathString: string }>`
Returns a depth-first ordered list of active areas annotated with tree depth and formatted path strings.

---

## 2. ClipsStore (`src/core/clips-store.js`)

Unified persistence layer for visual note cards.

#### `getAll(): Array<Clip>`
Retrieves all saved clips.

#### `getActive(): Array<Clip>`
Retrieves non-archived clips.

#### `getArchived(): Array<Clip>`
Retrieves archived clips.

#### `get(id: string): Clip | null`
Finds a clip by UUID.

#### `getAllTags(): string[]`
Returns an alphabetical list of all unique normalized tags across clips.

#### `normalizeTags(rawTags: string[] | string): string[]`
Helper function that trims whitespace, strips `#`, lowercases, and deduplicates tags.

#### `sortClips(clips: Clip[], sortOrder: string): Clip[]`
Sorts clips by `'updated-desc'`, `'created-desc'`, `'title-asc'`, or `'title-desc'`.

#### `create(clipData: Partial<Clip>): Clip`
Creates and persists a new clip. Fires `clipCreated`.

#### `update(id: string, updates: Partial<Clip>): Clip | null`
Updates an existing clip's properties. Fires `clipUpdated`.

#### `delete(id: string): boolean`
Deletes a clip. Fires `clipDeleted`.

#### `togglePin(id: string): Clip | null`
Toggles the pinned status of a clip.

#### `archive(id: string) / restore(id: string): Clip | null`
Transitions a clip between active and archived states.

---

## 3. JotStore (`src/core/jot-store.js`)

Persistence gateway for the free-form markdown scratchpad.

#### `loadJot(): string`
Retrieves the saved markdown text string.

#### `saveJot(content: string): void`
Persists the raw markdown text string to storage.

#### `clearJot(): void`
Purges the scratchpad text from storage.

---

## 4. SettingsStore (`src/core/settings-store.js`)

Central configuration management and theme engine.

#### `load(): Settings`
Loads user settings with fallback defaults.

#### `save(settings: Partial<Settings>): void`
Persists updated settings, applies them to the DOM, and emits `settingsChanged`.

#### `apply(settings: Settings): void`
Applies theme tokens (`data-theme`), accent colors (`data-accent`), compact mode, font sizing, and typography rules directly to `document.documentElement`.

#### `applyNavigationIconStyle(style: 'bench-symbols' | 'classic-icons'): void`
Switches sidebar navigation graphics between Greek glyphs and Lucide SVGs.

#### `applyShortcutStyle(style: 'mac' | 'windows'): void`
Updates UI shortcut hints between Mac (`⌥1`, `⌘J`) and Windows (`Alt+1`, `Ctrl+J`).

---

## 5. EventBus (`src/core/event-bus.js`)

Decoupled pub/sub dispatcher for cross-module events.

```javascript
EventBus.on(event: string, callback: Function): void
EventBus.off(event: string, callback: Function): void
EventBus.emit(event: string, payload?: any): void
```

### Standard System Events:
- `itemCreated`, `itemUpdated`, `itemDeleted`, `itemMoved`
- `areaCreated`, `areaUpdated`, `areaDeleted`
- `clipCreated`, `clipUpdated`, `clipDeleted`, `clipsRefreshed`
- `settingsChanged`, `navigationIconStyleChanged`
- `itemSelected` (payload: `Item | null`)
- `viewTitleChanged` (payload: `{ title: string, breadcrumb?: string }`)
- `inspectorUpdate` (payload: `{ id: string, field: string, value: any }`)

---

## 6. Platform (`src/core/platform.js`)

Environment detector for native Tauri vs. Web browser runtime.

```javascript
Platform.initialize(): void
Platform.isTauri(): boolean
Platform.isBrowser(): boolean
Platform.getName(): 'tauri' | 'browser'
```
