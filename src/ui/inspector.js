import { EventBus } from '../core/event-bus.js';
import { getRelativeTime } from './utils.js';
import { Repository } from '../core/repository.js';
import { QuickCapture } from '../core/quick-capture.js';
import { AREA_ICONS } from './area-icons.js';
import { SettingsStore } from '../core/settings-store.js';
import { DialogService } from './dialog.js';
import { ToastService } from './toast.js';

const STORAGE_KEY_WIDTH = 'bench_inspector_width';
const DEFAULT_WIDTH = 320;
const MIN_WIDTH = 260;
const MAX_WIDTH = 520;
const DEBOUNCE_MS = 500;
const SAVED_FADE_MS = 2000;

let panelEl = null;
let currentItem = null;
let previousItem = null;
let debounceTimer = null;
let pendingField = null;
let pendingValue = null;
let savedFadeTimer = null;
const collapsedAreaSections = new Set();

// DOM references cached after render
let titleInput = null;
let notesTextarea = null;
let saveIndicator = null;
let areaField = null;
let moduleField = null;
let createdField = null;
let updatedField = null;

/**
 * The Inspector is a presentation-only component.
 * It emits `inspectorUpdate` events rather than calling Repository directly.
 */
export const Inspector = {
  resolveAreaName: null,

  /**
   * Subscribe to EventBus and bind to the #inspector-panel element.
   */
  init() {
    panelEl = document.getElementById('inspector-panel');
    if (!panelEl) return;

    // Restore saved width
    const savedWidth = localStorage.getItem(STORAGE_KEY_WIDTH);
    if (savedWidth) {
      const w = parseInt(savedWidth, 10);
      if (w >= MIN_WIDTH && w <= MAX_WIDTH) {
        panelEl.style.setProperty('--inspector-width', `${w}px`);
      }
    }

    EventBus.on('itemSelected', (item) => {
      if (item) {
        this.open(item);
      } else {
        this.close();
      }
    });

    EventBus.on('itemCreated', () => {
      if (currentItem && currentItem.type === 'area') {
        syncFields();
      }
    });

    EventBus.on('itemUpdated', (updatedItem) => {
      if (!currentItem) return;
      if (currentItem.type === 'area') {
        syncFields();
        return;
      }
      if (updatedItem.id !== currentItem.id) return;
      currentItem = { ...currentItem, ...updatedItem };
      syncFields();
      showSaveState('Saved');
    });

    EventBus.on('itemDeleted', (deletedItem) => {
      if (!currentItem) return;
      if (currentItem.type === 'area') {
        syncFields();
        return;
      }
      if (deletedItem.id === currentItem.id) {
        this.close();
      }
    });

    EventBus.on('areaUpdated', (updatedArea) => {
      if (!currentItem || updatedArea.id !== currentItem.id) return;
      currentItem = { ...currentItem, ...updatedArea };
      syncFields();
      showSaveState('Saved');
    });

    EventBus.on('areaDeleted', (deletedArea) => {
      if (currentItem && deletedArea.id === currentItem.id) {
        this.close();
      }
    });

    // Panel-level keyboard handler
    panelEl.addEventListener('keydown', handlePanelKeydown);

    renderEmpty();
  },

  /**
   * Display item details in the panel.
   */
  open(item) {
    if (!panelEl) return;
    if (currentItem && currentItem.id === item.id) {
      currentItem = { ...currentItem, ...item };
      syncFields();
      return;
    }
    this.flushPendingSaves();
    if (currentItem && currentItem.id !== item.id) {
      previousItem = { ...currentItem };
    }
    currentItem = { ...item };
    panelEl.classList.add('open');
    renderItem();
  },

  /**
   * Hide the panel and clear selection.
   */
  close() {
    if (!panelEl) return;
    this.flushPendingSaves();
    currentItem = null;
    previousItem = null;
    panelEl.classList.remove('open');
    clearDomRefs();
    renderEmpty();
  },

  /**
   * Returns true if the Inspector is currently open.
   */
  isOpen() {
    return panelEl !== null && panelEl.classList.contains('open');
  },

  /**
   * Returns the currently displayed item ID or null.
   */
  getItemId() {
    return currentItem ? currentItem.id : null;
  },

  /**
   * Immediately emit any debounced inspectorUpdate.
   * Call before module switch, window close, app exit.
   */
  flushPendingSaves() {
    if (debounceTimer && pendingField && currentItem) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
      EventBus.emit('inspectorUpdate', {
        id: currentItem.id,
        field: pendingField,
        value: pendingValue
      });
      pendingField = null;
      pendingValue = null;
    }
  }
};

// --- Rendering ---

function clearDomRefs() {
  titleInput = null;
  notesTextarea = null;
  saveIndicator = null;
  areaField = null;
  moduleField = null;
  createdField = null;
  updatedField = null;
}

function renderEmpty() {
  if (!panelEl) return;
  panelEl.innerHTML = `
    <div class="inspector-empty">
      <p>No item selected.</p>
      <p class="inspector-empty-hint">Select something to see its details.</p>
    </div>
  `;
  clearDomRefs();
}

function renderItem() {
  if (!panelEl || !currentItem) return;

  const isArea = currentItem.type === 'area';
  let fieldsHtml = '';
  let notesLabel = 'notes';
  let notesPlaceholder = 'write notes here…';
  let notesValue = currentItem.notes || '';
  let titlePlaceholder = 'title';
  let titleValue = currentItem.title || '';

  if (isArea) {
    titlePlaceholder = 'name';
    titleValue = currentItem.name || '';
    notesLabel = 'description';
    notesPlaceholder = 'write description here…';
    notesValue = currentItem.description || '';

    const activeCount = typeof Inspector.resolveActiveCount === 'function' ? Inspector.resolveActiveCount(currentItem.id) : 0;

    fieldsHtml = `
      <div class="inspector-field">
        <label class="inspector-label">name</label>
        <textarea class="inspector-title-input" id="inspector-title-input"
                  placeholder="${titlePlaceholder}" spellcheck="false" rows="1">${escapeHtml(titleValue)}</textarea>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">icon</label>
        <div class="inspector-icon-picker-container" style="display: flex; flex-direction: column; gap: var(--space-xs); width: 100%;">
          <select class="inspector-select" id="inspector-area-icon-select">
            ${AREA_ICONS.map(i => `<option value="${i.id}" ${(currentItem.icon || 'folder') === i.id ? 'selected' : ''}>${i.label}</option>`).join('')}
          </select>
          <div class="inspector-icon-picker-grid" id="inspector-icon-picker-grid">
            ${AREA_ICONS.map(i => `
              <button type="button" 
                      class="inspector-icon-btn ${(currentItem.icon || 'folder') === i.id ? 'selected' : ''}" 
                      data-icon-id="${i.id}" 
                      title="${i.label}" 
                      aria-label="${i.label}">
                ${i.svg}
              </button>
            `).join('')}
          </div>
        </div>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">active items</label>
        <span class="inspector-value" id="inspector-active-items-value">${activeCount}</span>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">archived</label>
        <span class="inspector-value" id="inspector-archived-value">${currentItem.archived ? 'yes' : 'no'}</span>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">created</label>
        <span class="inspector-value" id="inspector-created-value">${getRelativeTime(currentItem.createdAt)}</span>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">updated</label>
        <span class="inspector-value" id="inspector-updated-value">${getRelativeTime(currentItem.updatedAt)}</span>
      </div>
    `;
  } else {
    const moduleLabel = formatModule(currentItem.module);
    const activeAreas = typeof Inspector.resolveAreas === 'function' ? Inspector.resolveAreas() : [];
    
    let selectOptionsHtml = `<option value="">—</option>`;
    activeAreas.forEach(a => {
      selectOptionsHtml += `<option value="${a.id}" ${currentItem.areaId === a.id ? 'selected' : ''}>${escapeHtml(a.name)}</option>`;
    });

    const areaSelectorHtml = `
      <select class="inspector-select" id="inspector-area-select">
        ${selectOptionsHtml}
      </select>
    `;

    fieldsHtml = `
      <div class="inspector-field">
        <label class="inspector-label">title</label>
        <textarea class="inspector-title-input" id="inspector-title-input"
                  placeholder="${titlePlaceholder}" spellcheck="false" rows="1">${escapeHtml(titleValue)}</textarea>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">area</label>
        <span class="inspector-value" style="width: 100%;">${areaSelectorHtml}</span>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">module</label>
        <span class="inspector-value" id="inspector-module-value">${moduleLabel}</span>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">created</label>
        <span class="inspector-value" id="inspector-created-value">${getRelativeTime(currentItem.createdAt)}</span>
      </div>
      <div class="inspector-field">
        <label class="inspector-label">updated</label>
        <span class="inspector-value" id="inspector-updated-value">${getRelativeTime(currentItem.updatedAt)}</span>
      </div>
    `;
  }

  let actionButtonsHtml = '';
  if (!isArea) {
    const isArchived = currentItem.archived === true || currentItem.module === 'archive';
    const isParked = currentItem.module === 'parking-lot';
    const isCompleted = currentItem.status === 'completed';

    actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-edit" aria-label="Edit title">edit</button>`;

    if (!isArchived && !isCompleted) {
      if (currentItem.focused) {
        actionButtonsHtml += `<button type="button" class="action-btn active" id="inspector-action-focus" aria-label="Remove focus">unfocus</button>`;
      } else {
        actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-focus" aria-label="Focus task">focus</button>`;
      }
    }

    if (!isArchived) {
      actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-area" aria-label="Assign area">area</button>`;
    }

    if (!isArchived) {
      if (isParked) {
        actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-capture" aria-label="Move to capture">capture</button>`;
      } else {
        actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-park" aria-label="Park task">park</button>`;
      }
    }

    if (isArchived) {
      actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-restore" aria-label="Restore task">restore</button>`;
    } else {
      actionButtonsHtml += `<button type="button" class="action-btn" id="inspector-action-archive" aria-label="Archive task">archive</button>`;
    }

    actionButtonsHtml += `<button type="button" class="action-btn btn-danger" id="inspector-action-delete" aria-label="Delete task">del</button>`;
  }

  panelEl.innerHTML = `
    <div class="inspector-resize-handle" id="inspector-resize-handle"></div>
    <div class="inspector-content">
      <div class="inspector-header">
        <span class="inspector-title-label">
          ${(!isArea && previousItem && previousItem.type === 'area' && currentItem.areaId === previousItem.id) ? `<span class="inspector-breadcrumb-link" style="cursor: pointer; color: var(--color-text-muted); text-decoration: underline;" data-area-id="${previousItem.id}">${escapeHtml(previousItem.name)}</span> &gt; ` : ''}details
        </span>
        <div class="inspector-header-right">
          <span class="inspector-save-indicator" id="inspector-save-indicator"></span>
          <button class="inspector-close-btn" id="inspector-close-btn" tabindex="0" aria-label="Close inspector" title="Close inspector (Esc)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="inspector-fields">
        ${fieldsHtml}
      </div>
      <div class="inspector-section future-metadata"></div>
      ${isArea ? `
        <div class="inspector-area-tasks-section" style="margin-top: var(--space-md); border-top: 1px solid var(--color-border); padding-top: var(--space-sm);">
          <div class="inspector-label" style="text-transform: lowercase; margin-bottom: var(--space-2xs);">tasks</div>
          <div id="inspector-area-tasks-list-portal"></div>
        </div>
      ` : ''}
      <div class="inspector-notes-section" style="${isArea ? 'flex: none; height: auto; min-height: 120px; margin-top: var(--space-xs);' : ''}">
        <label class="inspector-label">${notesLabel}</label>
        <textarea class="inspector-notes-editor" id="inspector-notes-editor"
                  placeholder="${notesPlaceholder}" spellcheck="false">${escapeHtml(notesValue)}</textarea>
      </div>
      ${!isArea ? `
        <div class="inspector-actions-section" style="margin-top: var(--space-md); border-top: 1px solid var(--color-border); padding-top: var(--space-sm);">
          <label class="inspector-label" style="margin-bottom: var(--space-xs);">actions</label>
          <div class="inspector-actions-bar" style="display: flex; gap: var(--space-xs); flex-wrap: wrap;">
            ${actionButtonsHtml}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Cache DOM refs
  titleInput = document.getElementById('inspector-title-input');
  notesTextarea = document.getElementById('inspector-notes-editor');
  saveIndicator = document.getElementById('inspector-save-indicator');
  moduleField = document.getElementById('inspector-module-value');
  createdField = document.getElementById('inspector-created-value');
  updatedField = document.getElementById('inspector-updated-value');

  // Populate tasks list if Area
  if (isArea) {
    syncAreaTasks();
  }

  // Bind title events
  titleInput.addEventListener('input', handleTitleInput);
  titleInput.addEventListener('blur', handleTitleBlur);
  titleInput.addEventListener('keydown', handleTitleKeydown);
  autoGrowTextarea(titleInput);

  // Bind notes events
  notesTextarea.addEventListener('input', handleNotesInput);
  notesTextarea.addEventListener('blur', handleNotesBlur);
  notesTextarea.addEventListener('keydown', handleNotesKeydown);
  autoGrowTextarea(notesTextarea);

  // Bind Area dropdown Select change & Actions Bar if not an Area item
  if (!isArea) {
    const areaSelect = document.getElementById('inspector-area-select');
    if (areaSelect) {
      areaSelect.addEventListener('change', (e) => {
        const val = e.target.value || null;
        EventBus.emit('inspectorUpdate', {
          id: currentItem.id,
          field: 'areaId',
          value: val
        });
        showSaveState('Saving…');
      });
    }

    const editBtn = document.getElementById('inspector-action-edit');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      });
    }

    const focusBtn = document.getElementById('inspector-action-focus');
    if (focusBtn) {
      focusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = currentItem.id;
        if (currentItem.focused) {
          Repository.update(targetId, { focused: false });
          ToastService.show('Removed from Focus', 'info');
        } else {
          const activeFocus = Repository.getFocusedTasks().filter(t => t.status === 'active');
          if (activeFocus.length >= 3) {
            ToastService.show('Focus is full. Complete something first.', 'info');
            return;
          }
          Repository.update(targetId, { focused: true });
          ToastService.show('Added to Focus', 'success');
        }
      });
    }

    const areaBtn = document.getElementById('inspector-action-area');
    if (areaBtn) {
      areaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (areaSelect) {
          areaSelect.focus();
        }
      });
    }

    const captureBtn = document.getElementById('inspector-action-capture');
    if (captureBtn) {
      captureBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = currentItem.id;
        Repository.move(targetId, 'capture');
        ToastService.show('Moved to Capture', 'success');
      });
    }

    const parkBtn = document.getElementById('inspector-action-park');
    if (parkBtn) {
      parkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = currentItem.id;
        Repository.move(targetId, 'parking-lot');
        ToastService.show('Moved to Parking Lot', 'success');
      });
    }

    const archiveBtn = document.getElementById('inspector-action-archive');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = currentItem.id;
        const targetTitle = currentItem.title || 'task';
        const settings = SettingsStore.load();
        const performArchive = () => {
          Repository.move(targetId, 'archive');
          ToastService.show('Task archived', 'success');
        };
        if (settings.confirmArchive) {
          DialogService.confirm({
            title: 'Archive Task',
            message: `Are you sure you want to archive "${targetTitle}"?`,
            confirmLabel: 'Archive',
            isDanger: false
          }).then(confirmed => {
            if (confirmed) performArchive();
          });
        } else {
          performArchive();
        }
      });
    }

    const restoreBtn = document.getElementById('inspector-action-restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = currentItem.id;
        Repository.update(targetId, { module: 'capture', archived: false });
        ToastService.show('Task restored', 'success');
      });
    }

    const deleteBtn = document.getElementById('inspector-action-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = currentItem.id;
        const targetTitle = currentItem.title || 'task';
        const settings = SettingsStore.load();
        const performDelete = () => {
          Repository.remove(targetId);
          ToastService.show('Task deleted', 'info');
        };
        if (settings.confirmDelete) {
          DialogService.confirm({
            title: 'Delete Task',
            message: `Are you sure you want to delete "${targetTitle}"?`,
            confirmLabel: 'Delete',
            isDanger: true
          }).then(confirmed => {
            if (confirmed) performDelete();
          });
        } else {
          performDelete();
        }
      });
    }
  } else {
    const iconSelect = document.getElementById('inspector-area-icon-select');
    if (iconSelect) {
      iconSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        EventBus.emit('inspectorUpdate', {
          id: currentItem.id,
          field: 'icon',
          value: val
        });
        showSaveState('Saving…');
      });
    }

    const iconGrid = panelEl.querySelector('#inspector-icon-picker-grid');
    if (iconGrid) {
      iconGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.inspector-icon-btn');
        if (btn) {
          e.stopPropagation();
          const val = btn.getAttribute('data-icon-id');
          if (iconSelect) iconSelect.value = val;
          EventBus.emit('inspectorUpdate', {
            id: currentItem.id,
            field: 'icon',
            value: val
          });
          showSaveState('Saving…');
        }
      });
    }
  }

  // Bind Area Tasks interactions
  if (isArea) {
    const listContainer = panelEl.querySelector('.inspector-area-tasks-section');
    if (listContainer) {
      listContainer.addEventListener('click', (e) => {
        const toggleEl = e.target.closest('.inspector-task-toggle');
        if (toggleEl) {
          e.stopPropagation();
          const taskId = toggleEl.getAttribute('data-task-id');
          const task = Repository.getAll().find(t => t.id === taskId);
          if (task) {
            const nextStatus = task.status === 'completed' ? 'active' : 'completed';
            Repository.update(taskId, { status: nextStatus });
          }
          return;
        }

        const titleEl = e.target.closest('.inspector-task-title');
        if (titleEl) {
          e.stopPropagation();
          const taskId = titleEl.getAttribute('data-task-id');
          const task = Repository.getAll().find(t => t.id === taskId);
          if (task) {
            EventBus.emit('itemSelected', task);
          }
        }
      });
    }
  }

  // Bind breadcrumb links
  const breadcrumb = panelEl.querySelector('.inspector-breadcrumb-link');
  if (breadcrumb) {
    breadcrumb.addEventListener('click', (e) => {
      e.stopPropagation();
      const areaId = breadcrumb.getAttribute('data-area-id');
      const area = Repository.getAreas().find(a => a.id === areaId);
      if (area) {
        EventBus.emit('itemSelected', area);
      }
    });
  }

  // Bind close button
  const closeBtn = document.getElementById('inspector-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      EventBus.emit('itemSelected', null);
    });
  }

  // Bind resize handle
  const resizeHandle = document.getElementById('inspector-resize-handle');
  if (resizeHandle) {
    resizeHandle.addEventListener('pointerdown', handleResizeStart);
    resizeHandle.addEventListener('dblclick', handleResizeReset);
  }
}

/**
 * Reactively update rendered fields without re-mounting.
 */
function syncFields() {
  if (!currentItem) return;

  const isArea = currentItem.type === 'area';

  // Only update title if the user is not actively editing it
  if (titleInput && document.activeElement !== titleInput) {
    titleInput.value = isArea ? currentItem.name : currentItem.title;
    autoGrowTextarea(titleInput);
  }

  // Only update notes if the user is not actively editing them
  if (notesTextarea && document.activeElement !== notesTextarea) {
    notesTextarea.value = isArea ? (currentItem.description || '') : (currentItem.notes || '');
    autoGrowTextarea(notesTextarea);
  }

  if (isArea) {
    const currIcon = currentItem.icon || 'folder';

    const iconSelect = document.getElementById('inspector-area-icon-select');
    if (iconSelect && document.activeElement !== iconSelect) {
      iconSelect.value = currIcon;
    }

    const iconGrid = panelEl.querySelector('#inspector-icon-picker-grid');
    if (iconGrid) {
      iconGrid.querySelectorAll('.inspector-icon-btn').forEach(btn => {
        const isSel = btn.getAttribute('data-icon-id') === currIcon;
        btn.classList.toggle('selected', isSel);
        btn.setAttribute('aria-selected', isSel);
      });
    }

    const activeItemsEl = document.getElementById('inspector-active-items-value');
    if (activeItemsEl && typeof Inspector.resolveActiveCount === 'function') {
      activeItemsEl.textContent = Inspector.resolveActiveCount(currentItem.id);
    }
    const archivedEl = document.getElementById('inspector-archived-value');
    if (archivedEl) {
      archivedEl.textContent = currentItem.archived ? 'yes' : 'no';
    }
    syncAreaTasks();
  } else {
    const areaSelect = document.getElementById('inspector-area-select');
    if (areaSelect && document.activeElement !== areaSelect) {
      areaSelect.value = currentItem.areaId || '';
    }
    if (moduleField) moduleField.textContent = formatModule(currentItem.module);
  }

  if (createdField) createdField.textContent = getRelativeTime(currentItem.createdAt);
  if (updatedField) updatedField.textContent = getRelativeTime(currentItem.updatedAt);
}

function syncAreaTasks() {
  if (!currentItem || currentItem.type !== 'area') return;
  const listContainer = document.getElementById('inspector-area-tasks-list-portal');
  if (!listContainer) return;

  const allTasks = Repository.getAll().filter(item => 
    item.type !== 'area' && 
    item.areaId === currentItem.id
  );

  let tasksHtml = '';
  const totalCount = allTasks.length;

  if (totalCount === 0) {
    tasksHtml = `
      <div class="inspector-area-tasks-empty" style="font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-muted); line-height: 1.6; padding-top: var(--space-xs);">
        No tasks yet.<br>
        Tasks assigned to this Area<br>
        will appear here.
      </div>
    `;
  } else {
    const modulesToRender = [
      { id: 'focus', label: 'focus', filter: t => t.focused === true && t.module === 'capture' && t.status !== 'completed' },
      { id: 'capture', label: 'capture', filter: t => !t.focused && t.module === 'capture' && t.status !== 'completed' },
      { id: 'parking-lot', label: 'parking lot', filter: t => t.module === 'parking-lot' && t.status !== 'completed' },
      { id: 'completed', label: 'completed', filter: t => t.status === 'completed' && t.module !== 'archive' },
      { id: 'archive', label: 'archive', filter: t => t.module === 'archive' }
    ];

    modulesToRender.forEach(m => {
      const moduleTasks = allTasks.filter(m.filter);
      if (moduleTasks.length > 0) {
        const key = `${currentItem.id}:${m.id}`;
        const isCollapsed = collapsedAreaSections.has(key);

        tasksHtml += `
          <div class="inspector-area-module-group" style="margin-top: var(--space-xs);">
            <button type="button" 
                    class="inspector-area-module-header" 
                    data-section-key="${key}"
                    aria-expanded="${!isCollapsed}"
                    aria-label="Toggle ${m.label} tasks">
              <span class="inspector-module-toggle-icon">${isCollapsed ? '►' : '▼'}</span>
              <span class="inspector-module-label">${m.label}</span>
              <span class="inspector-module-count">(${moduleTasks.length})</span>
            </button>
            <div class="inspector-area-module-tasks" style="display: ${isCollapsed ? 'none' : 'flex'}; flex-direction: column; gap: 3px; padding-left: var(--space-xs); margin-top: 2px;">
        `;
        moduleTasks.forEach(task => {
          let statusState = 'active';
          if (task.module === 'archive') {
            statusState = 'archived';
          } else if (task.status === 'completed') {
            statusState = 'completed';
          } else if (task.module === 'parking-lot') {
            statusState = 'parked';
          }

          tasksHtml += `
            <div class="inspector-area-task-item area-task-item-tint status-${statusState}" style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-xs); font-family: var(--font-mono); font-size: var(--font-size-xs); color: var(--color-text-secondary); line-height: 1.4; padding: 3px 6px;">
              <div style="display: flex; align-items: center; gap: var(--space-xs); flex: 1; min-width: 0;">
                <span style="color: var(--color-text-muted); cursor: pointer; user-select: none;" class="inspector-task-toggle" data-task-id="${task.id}">
                  ${task.status === 'completed' ? '■' : '□'}
                </span>
                <span style="cursor: pointer; text-decoration: ${task.status === 'completed' ? 'line-through' : 'none'}; word-break: break-all; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" class="inspector-task-title" data-task-id="${task.id}">
                  ${escapeHtml(task.title)}
                </span>
              </div>
              <span class="area-status-badge status-${statusState}">${statusState}</span>
            </div>
          `;
        });
        tasksHtml += `
            </div>
          </div>
        `;
      }
    });
  }

  listContainer.innerHTML = tasksHtml;

  // Bind collapse/expand section toggles
  listContainer.querySelectorAll('.inspector-area-module-header').forEach(header => {
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      const sectionKey = header.getAttribute('data-section-key');
      if (collapsedAreaSections.has(sectionKey)) {
        collapsedAreaSections.delete(sectionKey);
      } else {
        collapsedAreaSections.add(sectionKey);
      }
      syncAreaTasks();
    });
  });
}

// --- Title Handling ---

function handleTitleInput() {
  autoGrowTextarea(titleInput);
}

function handleTitleBlur() {
  if (!currentItem || !titleInput) return;
  const newTitle = titleInput.value.trim();
  const currentVal = currentItem.type === 'area' ? currentItem.name : currentItem.title;
  if (newTitle && newTitle !== currentVal) {
    const fieldName = currentItem.type === 'area' ? 'name' : 'title';
    EventBus.emit('inspectorUpdate', {
      id: currentItem.id,
      field: fieldName,
      value: newTitle
    });
    showSaveState('Saving…');
  }
}

function handleTitleKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    titleInput.blur();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    titleInput.blur();
  }
}

// --- Notes Handling ---

function handleNotesInput() {
  if (!currentItem || !notesTextarea) return;
  autoGrowTextarea(notesTextarea);

  const value = notesTextarea.value;
  pendingField = currentItem.type === 'area' ? 'description' : 'notes';
  pendingValue = value;

  showSaveState('Saving…');

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    EventBus.emit('inspectorUpdate', {
      id: currentItem.id,
      field: pendingField,
      value: pendingValue
    });
    pendingField = null;
    pendingValue = null;
  }, DEBOUNCE_MS);
}

function handleNotesBlur() {
  if (!currentItem || !notesTextarea) return;
  // Flush any pending debounce immediately
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    if (pendingField) {
      EventBus.emit('inspectorUpdate', {
        id: currentItem.id,
        field: pendingField,
        value: pendingValue
      });
      pendingField = null;
      pendingValue = null;
    }
  }
}

function handleNotesKeydown(e) {
  // Tab inserts 2 spaces instead of changing focus
  if (e.key === 'Tab') {
    e.preventDefault();
    const start = notesTextarea.selectionStart;
    const end = notesTextarea.selectionEnd;
    const value = notesTextarea.value;
    notesTextarea.value = value.substring(0, start) + '  ' + value.substring(end);
    notesTextarea.selectionStart = notesTextarea.selectionEnd = start + 2;
    // Trigger input event for debounce
    notesTextarea.dispatchEvent(new Event('input'));
  }

  // Ctrl+S forces immediate save
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = null;
    const fieldName = currentItem.type === 'area' ? 'description' : 'notes';
    EventBus.emit('inspectorUpdate', {
      id: currentItem.id,
      field: fieldName,
      value: notesTextarea.value
    });
    pendingField = null;
    pendingValue = null;
    showSaveState('Saving…');
  }

  // Escape blurs notes editor first, stops event propagation
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    notesTextarea.blur();
  }
}

// --- Panel Keyboard Handler ---

function handlePanelKeydown(e) {
  // Escape closes the Inspector (or returns to Area if viewing an Area Task)
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (currentItem && currentItem.type !== 'area' && previousItem && previousItem.type === 'area' && currentItem.areaId === previousItem.id) {
      const area = Repository.getAreas().find(a => a.id === previousItem.id);
      if (area) {
        EventBus.emit('itemSelected', area);
        return;
      }
    }
    Inspector.close();
    EventBus.emit('itemSelected', null);
    return;
  }

  // Ctrl+Enter returns focus to the main list
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    const activeView = document.getElementById('active-view');
    if (activeView) {
      const firstFocusable = activeView.querySelector('[tabindex="0"], input, button');
      if (firstFocusable) firstFocusable.focus();
      else activeView.focus();
    }
    return;
  }

  // Ctrl+T focuses the title input
  if (e.key.toLowerCase() === 't' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (titleInput) {
      titleInput.focus();
      titleInput.select();
    }
    return;
  }

  // Press N to create a task in the active Area
  if (e.key.toLowerCase() === 'n' && currentItem && currentItem.type === 'area') {
    const el = document.activeElement;
    const editing = el && (
      el.tagName === 'INPUT' || 
      el.tagName === 'TEXTAREA' || 
      el.isContentEditable
    );
    if (!editing) {
      e.preventDefault();
      QuickCapture.open(currentItem.id);
      return;
    }
  }
}

// --- Resize Handle ---

let resizing = false;
let resizeStartX = 0;
let resizeStartWidth = 0;

function handleResizeStart(e) {
  e.preventDefault();
  resizing = true;
  resizeStartX = e.clientX;
  resizeStartWidth = panelEl.offsetWidth;

  document.addEventListener('pointermove', handleResizeMove);
  document.addEventListener('pointerup', handleResizeEnd);
  document.body.style.cursor = 'col-resize';
  document.body.style.userSelect = 'none';
}

function handleResizeMove(e) {
  if (!resizing) return;
  // Dragging left increases width, dragging right decreases
  const delta = resizeStartX - e.clientX;
  let newWidth = resizeStartWidth + delta;

  const containerWidth = window.innerWidth;
  const sidebarEl = document.querySelector('.sidebar');
  const sidebarWidth = sidebarEl ? sidebarEl.offsetWidth : 200;
  const minMainWidth = 180;
  const maxAllowedWidth = Math.max(MIN_WIDTH, containerWidth - sidebarWidth - minMainWidth);

  const clampedMax = Math.min(MAX_WIDTH, maxAllowedWidth);
  newWidth = Math.max(MIN_WIDTH, Math.min(clampedMax, newWidth));
  panelEl.style.setProperty('--inspector-width', `${newWidth}px`);
}

function handleResizeEnd() {
  if (!resizing) return;
  resizing = false;
  document.removeEventListener('pointermove', handleResizeMove);
  document.removeEventListener('pointerup', handleResizeEnd);
  document.body.style.cursor = '';
  document.body.style.userSelect = '';

  // Persist width
  const currentWidth = panelEl.offsetWidth;
  localStorage.setItem(STORAGE_KEY_WIDTH, String(currentWidth));

  // Recalculate text height once at the end of resize reflow
  autoGrowTextarea(notesTextarea);
  autoGrowTextarea(titleInput);
}

function handleResizeReset() {
  panelEl.style.setProperty('--inspector-width', `${DEFAULT_WIDTH}px`);
  localStorage.setItem(STORAGE_KEY_WIDTH, String(DEFAULT_WIDTH));
  
  // Recalculate text height once at the end of resize reflow
  autoGrowTextarea(notesTextarea);
  autoGrowTextarea(titleInput);
}

// --- Save State Indicator ---

function showSaveState(text) {
  if (!saveIndicator) return;
  saveIndicator.textContent = text;
  saveIndicator.classList.add('visible');

  if (savedFadeTimer) clearTimeout(savedFadeTimer);

  if (text === 'Saved') {
    savedFadeTimer = setTimeout(() => {
      if (saveIndicator) saveIndicator.classList.remove('visible');
    }, SAVED_FADE_MS);
  }
}

// --- Auto-grow Textarea ---

function autoGrowTextarea(textarea) {
  if (!textarea) return;
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// --- Helpers ---

function getAreaName(areaId) {
  if (!areaId) return null;
  if (typeof Inspector.resolveAreaName === 'function') {
    return Inspector.resolveAreaName(areaId);
  }
  return null;
}

function formatModule(mod) {
  const labels = {
    'focus': 'Focus',
    'capture': 'Capture',
    'parking-lot': 'Parking Lot',
    'archive': 'Archive'
  };
  return labels[mod] || mod;
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
