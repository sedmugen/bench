import { Repository } from '../core/repository.js';
import { EventBus } from '../core/event-bus.js';
import { ToastService } from '../ui/toast.js';
import { DialogService } from '../ui/dialog.js';
import { getRelativeTime } from '../ui/utils.js';
import { createSearchInput } from '../ui/search.js';
import { showAreaDeleteDialog } from '../ui/area-delete-dialog.js';
import { SettingsStore } from '../core/settings-store.js';
import { createCheckbox } from '../ui/checkbox.js';
import { getAreaIconSvg } from '../ui/area-icons.js';

let containerEl = null;
let items = [];
let selectedItemId = null;
let filterAreaId = '';
let searchQuery = '';

/**
 * Mount the Archive view.
 */
export function renderArchiveView(container) {
  container.innerHTML = '';
  containerEl = document.createElement('div');
  containerEl.className = 'archive-view';
  container.appendChild(containerEl);

  items = Repository.getArchivedTasks().sort((a, b) => b.updatedAt - a.updatedAt);
  searchQuery = '';

  if (selectedItemId && !items.find(i => i.id === selectedItemId)) {
    setSelectedItemId(null);
  }

  renderView();

  cleanupEventBus();
  EventBus.on('itemCreated', handleItemChange);
  EventBus.on('itemUpdated', handleItemChange);
  EventBus.on('itemDeleted', handleItemChange);
  EventBus.on('areaCreated', handleItemChange);
  EventBus.on('areaUpdated', handleItemChange);
  EventBus.on('areaDeleted', handleItemChange);
  EventBus.on('itemMoved', handleItemChange);

  window.removeEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('keydown', handleGlobalKeydown);

  // Monitor element removal to cleanup event handlers
  const observer = new MutationObserver(() => {
    if (!document.body.contains(containerEl)) {
      cleanupListeners();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Focus and highlight a specific archived item.
 * Called by the Command Palette.
 */
export function focusAndSelectArchivedTask(itemId) {
  setSelectedItemId(itemId);
  const activeContainer = document.getElementById('active-view');
  if (activeContainer) renderArchiveView(activeContainer);
}

function handleItemChange() {
  items = Repository.getArchivedTasks().sort((a, b) => b.updatedAt - a.updatedAt);
  if (selectedItemId) {
    const allSelectable = [...items, ...Repository.getArchivedAreas()];
    if (!allSelectable.find(i => i.id === selectedItemId)) {
      setSelectedItemId(null);
    }
  }
  renderView();
}

function setSelectedItemId(id) {
  selectedItemId = id;
  if (id) {
    const item = items.find(i => i.id === id) || Repository.getArchivedAreas().find(a => a.id === id);
    EventBus.emit('itemSelected', item || null);
  } else {
    EventBus.emit('itemSelected', null);
  }
}

function cleanupEventBus() {
  EventBus.off('itemCreated', handleItemChange);
  EventBus.off('itemUpdated', handleItemChange);
  EventBus.off('itemDeleted', handleItemChange);
  EventBus.off('itemMoved', handleItemChange);
  EventBus.off('areaCreated', handleItemChange);
  EventBus.off('areaUpdated', handleItemChange);
  EventBus.off('areaDeleted', handleItemChange);
}

function cleanupListeners() {
  cleanupEventBus();
  window.removeEventListener('keydown', handleGlobalKeydown);
  setSelectedItemId(null);
}

function handleSearch(query) {
  searchQuery = query;
  const contentArea = document.getElementById('view-content-area');
  if (!contentArea) return;

  let filteredItems = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  const archivedAreas = Repository.getArchivedAreas();
  let filteredAreas = filterAreaId ? [] : archivedAreas;
  if (searchQuery && !filterAreaId) {
    const q = searchQuery.toLowerCase();
    filteredAreas = archivedAreas.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  if (items.length === 0 && archivedAreas.length === 0) {
    renderEmpty(contentArea);
  } else {
    renderArchiveContent(contentArea, filteredItems, filteredAreas);
  }
}

function renderView() {
  if (!containerEl) return;

  let filteredItems = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  const archivedAreas = Repository.getArchivedAreas();
  let filteredAreas = filterAreaId ? [] : archivedAreas;
  if (searchQuery && !filterAreaId) {
    const q = searchQuery.toLowerCase();
    filteredAreas = archivedAreas.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  containerEl.innerHTML = `
    <div class="focus-container">
      <div class="view-filter-bar">
        <div class="view-filter-group">
          <span style="color: var(--color-text-muted);">area</span>
          <select id="area-filter-select" class="inspector-select" style="width: auto; min-width: 80px; padding: 2px 4px; border: 1px solid var(--color-border);">
          </select>
        </div>
        <div id="view-search-portal"></div>
      </div>
      <div id="view-content-area"></div>
    </div>
  `;

  renderAreaFilter();

  const searchPortal = containerEl.querySelector('#view-search-portal');
  if (searchPortal) {
    searchPortal.appendChild(createSearchInput({
      value: searchQuery,
      onInput: handleSearch
    }));
  }

  const contentArea = document.getElementById('view-content-area');

  if (items.length === 0 && archivedAreas.length === 0) {
    renderEmpty(contentArea);
  } else {
    renderArchiveContent(contentArea, filteredItems, filteredAreas);
  }
}

function renderAreaFilter() {
  const select = document.getElementById('area-filter-select');
  if (!select) return;

  const activeAreas = Repository.getActiveAreas();
  let html = `<option value="">all</option>`;
  activeAreas.forEach(a => {
    html += `<option value="${a.id}" ${filterAreaId === a.id ? 'selected' : ''}>${a.name}</option>`;
  });
  select.innerHTML = html;

  select.addEventListener('change', (e) => {
    filterAreaId = e.target.value;
    if (selectedItemId) {
      const task = items.find(t => t.id === selectedItemId);
      if (task && task.areaId !== filterAreaId && filterAreaId !== '') {
        setSelectedItemId(null);
      }
    }
    renderView();
  });
}

function renderEmpty(targetEl) {
  targetEl.innerHTML = `
    <div class="placeholder-view" style="height: auto; padding: var(--space-lg) 0;">
      <h2>archive</h2>
      <p>Archive is empty.</p>
      <p style="color: var(--color-text-muted); font-size: var(--font-size-xs); max-width: 320px; margin: var(--space-sm) 0 0 0; line-height: 1.4;">
        Finished work and discarded ideas will live here.
      </p>
    </div>
  `;
}

function renderArchiveContent(targetEl, listItems, listAreas) {
  targetEl.innerHTML = `
    <div class="archive-split-container" style="display: flex; flex-direction: column; gap: var(--space-md);">
      <div class="archive-section-tasks">
        <div class="completed-header" style="margin-bottom: var(--space-sm);">archived tasks</div>
        <div class="tasks-list-active" id="archive-tasks-list" role="listbox" aria-label="Archived tasks"></div>
      </div>
      <div class="archive-section-areas" style="margin-top: var(--space-sm);">
        <div class="completed-header" style="margin-bottom: var(--space-sm);">archived areas</div>
        <div class="tasks-list-active" id="archive-areas-list" role="listbox" aria-label="Archived areas"></div>
      </div>
    </div>
  `;

  const tasksListEl = document.getElementById('archive-tasks-list');
  const areasListEl = document.getElementById('archive-areas-list');

  if (listItems.length === 0) {
    tasksListEl.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-sm) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No archived tasks.'}</p>
      </div>
    `;
  } else {
    listItems.forEach(item => {
      tasksListEl.appendChild(buildArchiveRow(item));
    });
  }

  if (listAreas.length === 0) {
    areasListEl.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-sm) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching areas found.' : 'No archived areas.'}</p>
      </div>
    `;
  } else {
    listAreas.forEach(area => {
      areasListEl.appendChild(buildArchivedAreaRow(area));
    });
  }

  // Restore keyboard focus
  if (selectedItemId) {
    const activeEl = document.activeElement;
    const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
    if (!isEditingInInspector) {
      const el = document.querySelector(`[data-id="${selectedItemId}"]`);
      if (el) requestAnimationFrame(() => el.focus());
    }
  }
}

function buildArchivedAreaRow(area) {
  const row = document.createElement('div');
  row.className = 'task-item completed'; // Render muted/completed style
  row.style.opacity = '0.6';
  row.setAttribute('data-id', area.id);
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', area.id === selectedItemId ? 'true' : 'false');
  row.setAttribute('tabindex', '0');

  if (area.id === selectedItemId) {
    row.classList.add('selected');
    row.style.opacity = '0.95';
  }

  // Folder icon + Name
  const title = document.createElement('span');
  title.className = 'task-title';
  title.style.display = 'flex';
  title.style.alignItems = 'center';
  title.style.gap = '8px';
  title.innerHTML = `${getAreaIconSvg(area.icon)} ${escapeHtml(area.name)}`;
  row.appendChild(title);

  // Archived time badge
  const archivedTime = document.createElement('span');
  archivedTime.className = 'task-time-meta';
  archivedTime.textContent = `archived ${getRelativeTime(area.updatedAt)}`;
  row.appendChild(archivedTime);

  // Hover Action Buttons: Restore and Del
  const actionsCol = document.createElement('div');
  actionsCol.className = 'task-actions';

  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'action-btn';
  restoreBtn.textContent = 'restore';
  restoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    restoreArea(area);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn btn-danger';
  delBtn.textContent = 'del';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteItem(area.id);
  });

  actionsCol.appendChild(restoreBtn);
  actionsCol.appendChild(delBtn);
  row.appendChild(actionsCol);

  row.addEventListener('click', () => {
    setSelectedItemId(selectedItemId === area.id ? null : area.id);
    renderView();
  });

  return row;
}

function restoreArea(area) {
  Repository.update(area.id, { archived: false });
  if (selectedItemId === area.id) setSelectedItemId(null);
  ToastService.show('Area restored.', 'info');
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildArchiveRow(item) {
  const row = document.createElement('div');
  row.className = 'task-item';
  row.style.opacity = '0.6'; // Make archived items feel intentionally quiet
  row.setAttribute('data-id', item.id);
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', item.id === selectedItemId ? 'true' : 'false');
  row.setAttribute('tabindex', '0');

  if (item.id === selectedItemId) {
    row.classList.add('selected');
    row.style.opacity = '1';
  }

  // Checkbox (read-only in archive — always checked)
  row.appendChild(createCheckbox({
    checked: true,
    onChange: () => {}
  }));

  const contentCol = document.createElement('div');
  contentCol.className = 'task-content';

  const title = document.createElement('span');
  title.className = 'task-title';
  title.appendChild(document.createTextNode(item.title || ''));
  contentCol.appendChild(title);

  const area = item.areaId ? Repository.getAreas().find(a => a.id === item.areaId) : null;
  if (area) {
    const areaSubtext = document.createElement('span');
    areaSubtext.className = 'task-area-subtext';
    areaSubtext.textContent = `· ${area.name}`;
    contentCol.appendChild(areaSubtext);
  }

  row.appendChild(contentCol);

  // Time metadata — "archived X ago"
  const timeBadge = document.createElement('span');
  timeBadge.className = 'task-time-meta';
  timeBadge.textContent = `archived ${getRelativeTime(item.updatedAt)}`;
  row.appendChild(timeBadge);

  // Hover Action Buttons: Restore and Del
  const actionsCol = document.createElement('div');
  actionsCol.className = 'task-actions';

  const restoreBtn = document.createElement('button');
  restoreBtn.className = 'action-btn';
  restoreBtn.textContent = 'restore';
  restoreBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openRestorePicker(e, item);
  });

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn btn-danger';
  delBtn.textContent = 'del';
  delBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    deleteItem(item.id);
  });

  actionsCol.appendChild(restoreBtn);
  actionsCol.appendChild(delBtn);
  row.appendChild(actionsCol);

  row.addEventListener('click', () => {
    setSelectedItemId(selectedItemId === item.id ? null : item.id);
    renderView();
  });

  return row;
}

function getVisibleTrigger(e) {
  if (e && e instanceof HTMLElement) {
    const rect = e.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return e;
  }
  let el = e?.currentTarget || e?.target;
  if (el && el instanceof HTMLElement) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return el;

    const taskItem = el.closest('.task-item');
    if (taskItem) {
      const moreBtn = taskItem.querySelector('.task-more-btn');
      if (moreBtn && moreBtn.getBoundingClientRect().width > 0) return moreBtn;
      return taskItem;
    }
  }
  return document.body;
}

// --- Archive Operations ---

function openRestorePicker(e, item) {
  if (e && e.stopPropagation) e.stopPropagation();

  if (item.type === 'area') {
    restoreArea(item);
    return;
  }

  // Remove existing dropdowns
  const existing = document.querySelector('.restore-picker-dropdown');
  if (existing) existing.remove();

  const triggerEl = getVisibleTrigger(e);
  const rect = triggerEl.getBoundingClientRect();
  const picker = document.createElement('div');
  picker.className = 'restore-picker-dropdown';

  const destinations = [
    { name: 'Focus', value: 'focus' },
    { name: 'Capture', value: 'capture' },
    { name: 'Parking Lot', value: 'parking-lot' }
  ];

  const closeAndRemove = () => {
    picker.remove();
    document.removeEventListener('mousedown', closePicker);
    document.removeEventListener('keydown', handleKeydown);
  };

  destinations.forEach(dest => {
    const el = document.createElement('div');
    el.className = 'restore-picker-item';
    el.textContent = dest.name;
    el.addEventListener('click', (evt) => {
      evt.stopPropagation();
      restoreItem(item, dest.value);
      closeAndRemove();
    });
    picker.appendChild(el);
  });

  document.body.appendChild(picker);

  // Position and clamp within viewport
  const pickerWidth = picker.offsetWidth || 120;
  const pickerHeight = picker.offsetHeight || 100;

  let top = rect.bottom + window.scrollY + 2;
  let left = rect.left + window.scrollX;

  if (rect.bottom + pickerHeight > window.innerHeight && rect.top - pickerHeight > 0) {
    top = rect.top + window.scrollY - pickerHeight - 2;
  }
  if (left + pickerWidth > window.innerWidth - 10) {
    left = window.innerWidth - pickerWidth - 10;
  }
  left = Math.max(10, left);

  picker.style.top = `${top}px`;
  picker.style.left = `${left}px`;

  // Close dropdown on click outside
  const closePicker = (event) => {
    if (!picker.contains(event.target) && event.target !== triggerEl) {
      closeAndRemove();
    }
  };

  // Close dropdown on Escape key
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeAndRemove();
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', closePicker);
    document.addEventListener('keydown', handleKeydown);
  }, 0);
}

function restoreItem(item, destination) {
  if (destination === 'focus') {
    const activeFocus = Repository.getFocusedTasks().filter(t => t.status === 'active');
    if (activeFocus.length >= 3) {
      ToastService.show('Focus is full. Complete something first.', 'info');
      return;
    }
    Repository.update(item.id, { module: 'focus', focused: true, archived: false });
  } else {
    Repository.update(item.id, { module: destination, focused: false, archived: false });
  }
  if (selectedItemId === item.id) setSelectedItemId(null);
  ToastService.show(`Restored to ${destination === 'parking-lot' ? 'Parking Lot' : destination.charAt(0).toUpperCase() + destination.slice(1)}.`, 'success');
}

function deleteItem(itemId) {
  const area = Repository.getAreas().find(a => a.id === itemId);
  if (area) {
    showAreaDeleteDialog(area).then((deleted) => {
      if (deleted) {
        if (selectedItemId === itemId) setSelectedItemId(null);
      }
    });
    return;
  }

  const performDelete = () => {
    Repository.remove(itemId);
    if (selectedItemId === itemId) setSelectedItemId(null);
    ToastService.show('Deleted permanently.', 'info');
  };

  const settings = SettingsStore.load();
  if (settings.confirmDelete) {
    DialogService.confirm({
      title: 'Delete Archived Item',
      message: 'Are you sure you want to permanently delete this archived item from your history?',
      confirmText: 'Delete permanently',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then((confirmed) => {
      if (confirmed) performDelete();
    });
  } else {
    performDelete();
  }
}

// --- Keyboard Navigation ---

function handleGlobalKeydown(event) {
  if (!containerEl || !document.body.contains(containerEl)) {
    cleanupListeners();
    return;
  }

  const el = document.activeElement;
  const editing = el && (
    el.tagName === 'INPUT' || 
    el.tagName === 'TEXTAREA' || 
    el.isContentEditable ||
    (typeof el.closest === 'function' && (el.closest('[contenteditable="true"]') !== null || el.closest('#inspector-panel') !== null))
  );
  if (editing) return;

  if (event.ctrlKey || event.metaKey || event.altKey) return;

  let filtered = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  const archivedAreas = Repository.getAreas().filter(a => a.archived);
  let filteredAreas = archivedAreas;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredAreas = archivedAreas.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  const allSelectable = [...filtered, ...filteredAreas];

  if (!selectedItemId) {
    if (event.key === 'ArrowDown' && allSelectable.length > 0) {
      event.preventDefault();
      setSelectedItemId(allSelectable[0].id);
      renderView();
    }
    return;
  }

  const idx = allSelectable.findIndex(i => i.id === selectedItemId);
  if (idx === -1) return;

  const currentItem = allSelectable[idx];

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (idx < allSelectable.length - 1) {
        setSelectedItemId(allSelectable[idx + 1].id);
        renderView();
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (idx > 0) {
        setSelectedItemId(allSelectable[idx - 1].id);
        renderView();
      } else {
        setSelectedItemId(null);
        renderView();
      }
      break;
    case 'Enter':
    case 'r':
    case 'R':
      event.preventDefault();
      if (currentItem.type === 'area') {
        restoreArea(currentItem);
      } else {
        // Locate the restore button element in DOM to position picker
        const row = containerEl.querySelector(`[data-id="${selectedItemId}"]`);
        if (row) {
          const restoreBtn = [...row.querySelectorAll('.action-btn')].find(b => b.textContent === 'restore');
          if (restoreBtn) {
            openRestorePicker({ stopPropagation: () => {}, target: restoreBtn }, currentItem);
          }
        }
      }
      break;
    case 'Escape':
      event.preventDefault();
      setSelectedItemId(null);
      renderView();
      break;
    case 'Delete':
    case 'Backspace':
      event.preventDefault();
      deleteItem(selectedItemId);
      break;
  }
}
