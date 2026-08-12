import { EventBus } from './event-bus.js';
import { ToastService } from '../ui/toast.js';
import { JotStore } from './jot-store.js';

const STORAGE_KEY = 'bench_items';
const OLD_STORAGE_KEY = 'bench_focus_tasks';

/**
 * Unified Repository Layer for Bench.
 * Isolates data storage details from UI modules. Replaces module-specific
 * persistence layers with a single source of truth using a flat Item model.
 */
export const Repository = {
  /**
   * Retrieve all items in the store.
   * Performs migration from the old `bench_focus_tasks` local storage key if needed.
   * @returns {Array<object>}
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const items = JSON.parse(data);
        let hasChanges = false;
        items.forEach(item => {
          if (item.type !== 'area' && item.module === 'focus') {
            item.module = 'capture';
            item.focused = true;
            hasChanges = true;
          }
          if (item.type !== 'area' && item.status === 'completed' && !item.completedAt) {
            item.completedAt = item.updatedAt || item.createdAt || Date.now();
            hasChanges = true;
          }
          if (item.type !== 'area' && item.status !== 'completed' && item.completedAt) {
            item.completedAt = null;
            hasChanges = true;
          }
        });
        if (hasChanges) {
          this._saveRaw(items);
        }
        return items;
      }

      // Check for legacy localStorage data
      const oldData = localStorage.getItem(OLD_STORAGE_KEY);
      if (oldData) {
        const oldTasks = JSON.parse(oldData);
        const migrated = oldTasks.map(t => ({
          id: t.id,
          title: t.title,
          notes: '',
          status: t.completed ? 'completed' : 'active',
          module: 'capture',
          focused: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }));

        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        localStorage.removeItem(OLD_STORAGE_KEY);
        console.log(`Migrated ${migrated.length} tasks to the unified domain repository.`);
        return migrated;
      }

      return [];
    } catch (e) {
      console.error('Failed to load items from repository:', e);
      return [];
    }
  },

  /**
   * Retrieve a single item by ID (task or area).
   * @param {string} id
   * @returns {object|null} The item, or null if not found
   */
  get(id) {
    if (!id) return null;
    return this.getAll().find(item => item.id === id) || null;
  },

  /**
   * Determine if an item is an active Focus task.
   * Single source of truth across the application.
   * @param {object} item
   * @returns {boolean}
   */
  isFocusTask(item) {
    if (!item || item.type === 'area') return false;
    if (item.status !== 'active') return false;
    if (item.module === 'archive' || item.module === 'parking-lot') return false;
    return item.focused === true;
  },

  /**
   * Retrieve all currently active Focus tasks.
   * @returns {Array<object>}
   */
  getActiveFocusTasks() {
    return this.getAll().filter(item => this.isFocusTask(item));
  },

  /**
   * Retrieve all items currently focused.
   * @returns {Array<object>}
   */
  getFocusedTasks() {
    return this.getAll().filter(item => 
      item.type !== 'area' && 
      item.module !== 'archive' &&
      item.module !== 'parking-lot' &&
      item.archived !== true &&
      item.focused === true
    );
  },

  /**
   * Retrieve all archived task items.
   * @returns {Array<object>}
   */
  getArchivedTasks() {
    return this.getAll().filter(item => 
      item.type !== 'area' && (item.archived === true || item.module === 'archive')
    );
  },

  /**
   * Retrieve all archived area items.
   * @returns {Array<object>}
   */
  getArchivedAreas() {
    return this.getAll().filter(item => 
      item.type === 'area' && item.archived === true
    );
  },

  /**
   * Retrieve all items belonging to a specific module.
   * @param {string} moduleName
   * @returns {Array<object>}
   */
  getByModule(moduleName) {
    if (moduleName === 'archive') {
      return this.getArchivedTasks();
    }
    if (moduleName === 'focus') {
      return this.getFocusedTasks();
    }
    return this.getAll().filter(item => 
      item.module === moduleName && 
      item.type !== 'area' && 
      item.archived !== true
    );
  },

  /**
   * Create or replace an item.
   * Fires event `itemCreated` or `itemUpdated`.
   * @param {object} item
   * @param {number} [atIndex] Optional index to insert the new item at
   * @returns {object} The saved item
   */
  save(item, atIndex = undefined) {
    const items = this.getAll();
    const now = Date.now();

    let targetModule = item.module || 'capture';
    let focused = item.focused;

    if (targetModule === 'focus') {
      targetModule = 'capture';
      if (focused === undefined) focused = true;
    }

    if (targetModule === 'archive' || targetModule === 'parking-lot' || item.status === 'completed') {
      focused = false;
    } else if (focused === true && (item.status === 'active' || !item.status)) {
      const activeFocusCount = items.filter(i => i.id !== item.id && i.type !== 'area' && i.status === 'active' && i.focused === true).length;
      if (activeFocusCount >= 3) {
        focused = false;
        ToastService.show("Focus is full. Complete a task first.", "info");
      }
    } else if (focused === undefined) {
      focused = false;
    }

    const newItem = {
      id: item.id || crypto.randomUUID(),
      title: item.title || '',
      notes: item.notes || '',
      status: item.status || 'active',
      module: targetModule,
      focused,
      areaId: item.areaId || undefined,
      completedAt: item.status === 'completed' ? (item.completedAt || now) : null,
      createdAt: item.createdAt || now,
      updatedAt: now
    };

    const idx = items.findIndex(i => i.id === newItem.id);
    if (idx !== -1) {
      items[idx] = newItem;
      this._saveRaw(items);
      EventBus.emit('itemUpdated', newItem);
    } else {
      if (atIndex !== undefined && atIndex >= 0 && atIndex <= items.length) {
        items.splice(atIndex, 0, newItem);
      } else {
        items.push(newItem);
      }
      this._saveRaw(items);
      EventBus.emit('itemCreated', newItem);
    }

    return newItem;
  },

  /**
   * Update specific properties of an existing item.
   * Fires event `itemUpdated`.
   * @param {string} id
   * @param {object} updates
   * @returns {object|null} The updated item, or null if not found
   */
  update(id, updates) {
    const items = this.getAll();
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;

    const item = items[idx];
    if (item.type === 'area') {
      const merged = { ...item, ...updates };
      const name = (merged.name || '').trim();
      if (!name || name.length > 50) return null;
      const duplicate = items.some(i => i.type === 'area' && i.id !== id && i.name.toLowerCase() === name.toLowerCase());
      if (duplicate) return null;
    }

    if (updates.module === 'focus') {
      updates.module = 'capture';
      updates.focused = true;
    }

    // Handle toggle or direct focus changes:
    if (updates.focused === true && updates.status !== 'completed' && item.status !== 'completed') {
      const activeFocusCount = items.filter(i => i.id !== id && i.type !== 'area' && i.status === 'active' && i.focused === true).length;
      if (activeFocusCount >= 3) {
        updates.focused = false;
        ToastService.show("Focus is full. Complete a task first.", "info");
      }
    }

    // Handle completed / active transition:
    // Reopening a task:
    if (updates.status === 'active' && item.status === 'completed' && item.focused === true) {
      const activeFocusCount = items.filter(i => i.id !== id && i.type !== 'area' && i.status === 'active' && i.focused === true).length;
      if (activeFocusCount >= 3) {
        // Clear focus state because Focus is full, and show toast
        updates.focused = false;
        ToastService.show("Focus is full. Task restored.", "info");
      } else {
        // Keep focused: true
        updates.focused = true;
      }
    }

    // Stamp completedAt when a task is completed; clear it on re-open.
    if (updates.status === 'completed') {
      if (!item.completedAt || item.status !== 'completed') {
        updates.completedAt = Date.now();
      }
      updates.focused = false;
    } else if (updates.status === 'active') {
      updates.completedAt = null;
    } else if (item.status === 'completed' && !item.completedAt && !updates.completedAt) {
      updates.completedAt = item.updatedAt || item.createdAt || Date.now();
    }

    // Moving/Parking/Archiving:
    if (updates.module && updates.module !== 'capture') {
      // If task is moved to another module (like parking-lot or archive), remove focus
      updates.focused = false;
    }

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: Date.now()
    };

    items[idx] = updatedItem;
    this._saveRaw(items);

    if (updatedItem.type === 'area') {
      EventBus.emit('areaUpdated', updatedItem);
    } else {
      EventBus.emit('itemUpdated', updatedItem);
    }
    return updatedItem;
  },

  /**
   * Remove an item from the repository.
   * Fires event `itemDeleted`.
   * @param {string} id
   * @returns {boolean} True if deleted successfully, false otherwise
   */
  remove(id) {
    const items = this.getAll();
    const item = items.find(i => i.id === id);
    if (!item) return false;

    const filtered = items.filter(i => i.id !== id);
    this._saveRaw(filtered);

    EventBus.emit('itemDeleted', item);
    return true;
  },

  /**
   * Move an item from one module to another.
   * Fires event `itemUpdated`.
   * @param {string} id
   * @param {string} targetModule
   * @returns {object|null}
   */
  move(id, targetModule) {
    const isArchiving = targetModule === 'archive';
    return this.update(id, { 
      module: targetModule, 
      archived: isArchiving,
      focused: isArchiving ? false : undefined
    });
  },

  /**
   * Save a newly ordered list of items within a module.
   * Fires event `itemMoved`.
   * @param {string} moduleName
   * @param {Array<string>} orderedIds
   */
  reorder(moduleName, orderedIds) {
    const allItems = this.getAll();
    let moduleItems, otherItems;
    if (moduleName === 'focus') {
      moduleItems = allItems.filter(item => item.type !== 'area' && item.focused === true);
      otherItems = allItems.filter(item => item.type === 'area' || item.focused !== true);
    } else {
      moduleItems = allItems.filter(item => item.module === moduleName && item.type !== 'area');
      otherItems = allItems.filter(item => item.module !== moduleName || item.type === 'area');
    }

    // Map according to the orderedIds list
    const sortedModuleItems = orderedIds
      .map(id => moduleItems.find(item => item.id === id))
      .filter(Boolean);

    // Safety fallback: append any module items missing from the orderedIds
    moduleItems.forEach(item => {
      if (!orderedIds.includes(item.id)) {
        sortedModuleItems.push(item);
      }
    });

    const combined = [...sortedModuleItems, ...otherItems];
    this._saveRaw(combined);

    EventBus.emit('itemMoved', { module: moduleName, items: sortedModuleItems });
  },

  /**
   * Wipe all items belonging to a specific module.
   * Fires event `itemDeleted` for each removed item.
   * @param {string} moduleName
   */
  clearModule(moduleName) {
    const allItems = this.getAll();
    const toKeep = allItems.filter(i => i.module !== moduleName);
    const toDelete = allItems.filter(i => i.module === moduleName);

    this._saveRaw(toKeep);
    toDelete.forEach(item => EventBus.emit('itemDeleted', item));
  },

  /**
   * Wipe all items from the repository and clear Jot notes.
   */
  clearAll() {
    this._saveRaw([]);
    JotStore.clearJot();
  },

  /**
   * Get all Area entities.
   * @returns {Array<object>}
   */
  getAreas() {
    return this.getAll().filter(item => item.type === 'area');
  },

  /**
   * Get all active Area entities sorted case-insensitively by name.
   * @returns {Array<object>}
   */
  getActiveAreas() {
    return this.getAreas()
      .filter(a => !a.archived)
      .sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
  },

  /**
   * Create or update an Area entity.
   * Fires event `areaCreated` or `areaUpdated`.
   * @param {object} area
   * @returns {object} The saved area
   */
  saveArea(area) {
    const items = this.getAll();
    const now = Date.now();
    const name = (area.name || '').trim();

    if (!name || name.length > 50) {
      return null;
    }

    const targetParentId = area.parentId || null;
    const duplicate = items.some(i => i.type === 'area' && i.id !== area.id && (i.parentId || null) === targetParentId && i.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      return null;
    }

    const newArea = {
      id: area.id || crypto.randomUUID(),
      type: 'area',
      name,
      description: area.description || '',
      icon: area.icon || 'folder',
      color: area.color || '',
      parentId: targetParentId,
      createdAt: area.createdAt || now,
      updatedAt: now,
      archived: area.archived !== undefined ? area.archived : false
    };

    const idx = items.findIndex(i => i.id === newArea.id && i.type === 'area');
    if (idx !== -1) {
      items[idx] = newArea;
      this._saveRaw(items);
      EventBus.emit('areaUpdated', newArea);
    } else {
      items.push(newArea);
      this._saveRaw(items);
      EventBus.emit('areaCreated', newArea);
    }
    return newArea;
  },

  /**
   * Delete an Area entity if not referenced by any items.
   * Fires event `areaDeleted`.
   * @param {string} id
   * @returns {boolean} True if deleted, false if in-use or not found
   */
  deleteArea(id) {
    const items = this.getAll();

    // Check if in use by any focus or capture tasks/items
    const inUse = items.some(item => item.areaId === id);
    if (inUse) {
      return false;
    }

    const area = items.find(i => i.id === id && i.type === 'area');
    if (!area) return false;

    const parentId = area.parentId || null;
    const filtered = items.filter(i => i.id !== id).map(i => {
      if (i.type === 'area' && i.parentId === id) {
        return { ...i, parentId, updatedAt: Date.now() };
      }
      return i;
    });

    this._saveRaw(filtered);

    EventBus.emit('areaDeleted', area);
    return true;
  },

  /**
   * Check if setting targetParentId as parent for areaId would create a cycle.
   */
  wouldCauseCycle(areaId, targetParentId) {
    if (!areaId || !targetParentId) return false;
    if (areaId === targetParentId) return true;

    const areasMap = new Map(this.getAreas().map(a => [a.id, a]));
    let curr = areasMap.get(targetParentId);
    const visited = new Set();

    while (curr && !visited.has(curr.id)) {
      if (curr.id === areaId) return true;
      visited.add(curr.id);
      curr = curr.parentId ? areasMap.get(curr.parentId) : null;
    }
    return false;
  },

  /**
   * Returns array of ancestor Area objects from root down to areaId.
   */
  getAreaPath(areaId) {
    if (!areaId) return [];
    const areasMap = new Map(this.getAreas().map(a => [a.id, a]));
    const path = [];
    let currId = areaId;
    const visited = new Set();

    while (currId && !visited.has(currId)) {
      visited.add(currId);
      const area = areasMap.get(currId);
      if (!area) break;
      path.unshift(area);
      currId = area.parentId || null;
    }
    return path;
  },

  /**
   * Returns formatted path string e.g. "YouTube > Channel A > Project Alpha".
   */
  getAreaPathString(areaId, separator = ' > ') {
    const path = this.getAreaPath(areaId);
    return path.map(a => a.name).join(separator);
  },

  /**
   * Returns active areas ordered hierarchically (parents followed by children with depth).
   */
  getHierarchicalActiveAreas() {
    const activeAreas = this.getAreas().filter(a => !a.archived);
    const childrenMap = new Map();

    activeAreas.forEach(a => {
      const pId = a.parentId || null;
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId).push(a);
    });

    for (const list of childrenMap.values()) {
      list.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
    }

    const result = [];
    const traverse = (parentId, depth, pathPrefix) => {
      const children = childrenMap.get(parentId) || [];
      children.forEach(child => {
        const fullPath = pathPrefix ? `${pathPrefix} > ${child.name}` : child.name;
        result.push({
          ...child,
          depth,
          pathString: fullPath
        });
        traverse(child.id, depth + 1, fullPath);
      });
    };

    traverse(null, 0, '');
    return result;
  },

  /**
   * Returns Set of all descendant Area IDs for a given areaId.
   */
  getDescendantAreaIds(areaId) {
    const descendants = new Set();
    if (!areaId) return descendants;

    const childrenMap = new Map();
    this.getAreas().forEach(a => {
      const pId = a.parentId || null;
      if (!childrenMap.has(pId)) childrenMap.set(pId, []);
      childrenMap.get(pId).push(a.id);
    });

    const traverse = (id) => {
      const children = childrenMap.get(id) || [];
      children.forEach(childId => {
        descendants.add(childId);
        traverse(childId);
      });
    };

    traverse(areaId);
    return descendants;
  },

  /**
   * Delete an Area entity and reassign its tasks and reparent its child areas.
   */
  deleteAreaForce(id, reassignAreaId = null) {
    const items = this.getAll();
    const area = items.find(i => i.id === id && i.type === 'area');
    if (!area) return false;

    const targetParentId = area.parentId || null;

    const updated = items.map(item => {
      if (item.type === 'area' && item.parentId === id) {
        return { ...item, parentId: targetParentId, updatedAt: Date.now() };
      }
      if (item.areaId === id) {
        return { ...item, areaId: reassignAreaId, updatedAt: Date.now() };
      }
      return item;
    });

    const filtered = updated.filter(i => i.id !== id);
    this._saveRaw(filtered);

    items.forEach(item => {
      if (item.areaId === id) {
        const updatedItem = { ...item, areaId: reassignAreaId, updatedAt: Date.now() };
        EventBus.emit('itemUpdated', updatedItem);
      }
    });

    EventBus.emit('areaDeleted', area);
    return true;
  },

  /**
   * Internal wrapper to write items array directly to localStorage.
   */
  _saveRaw(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save raw items payload:', e);
    }
  }
};
