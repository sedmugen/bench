import { Repository } from '../core/repository.js';
import { EventBus } from '../core/event-bus.js';
import { ToastService } from '../ui/toast.js';
import { DialogService } from '../ui/dialog.js';
import { createInput } from '../ui/input.js';
import { getRelativeTime } from '../ui/utils.js';
import { createSearchInput } from '../ui/search.js';
import { openAreaPicker } from '../ui/area-picker.js';
import { SettingsStore } from '../core/settings-store.js';

let containerEl = null;
let items = [];
let selectedItemId = null;
let editingItemId = null;
let filterAreaId = '';
let searchQuery = '';

/**
 * Mount the Parking Lot view.
 */
export function renderParkingLotView(container) {
  container.innerHTML = '';
  containerEl = document.createElement('div');
  containerEl.className = 'parking-lot-view';
  container.appendChild(containerEl);

  items = Repository.getByModule('parking-lot').sort((a, b) => b.updatedAt - a.updatedAt);
  searchQuery = '';

  if (selectedItemId && !items.find(i => i.id === selectedItemId)) {
    setSelectedItemId(null);
  }

  if (!selectedItemId) editingItemId = null;

  renderView();

  cleanupEventBus();
  EventBus.on('itemCreated', handleItemChange);
  EventBus.on('itemUpdated', handleItemChange);
  EventBus.on('itemDeleted', handleItemChange);
  EventBus.on('itemMoved', handleItemChange);
  EventBus.on('areaCreated', handleItemChange);
  EventBus.on('areaUpdated', handleItemChange);
  EventBus.on('areaDeleted', handleItemChange);

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
 * Focus and highlight a specific parked item.
 * Called by the Command Palette.
 */
export function focusAndSelectParkedTask(itemId) {
  setSelectedItemId(itemId);
  const activeContainer = document.getElementById('active-view');
  if (activeContainer) renderParkingLotView(activeContainer);
}

function handleItemChange() {
  items = Repository.getByModule('parking-lot').sort((a, b) => b.updatedAt - a.updatedAt);
  if (filterAreaId && !Repository.getAreas().find(a => a.id === filterAreaId && !a.archived)) {
    filterAreaId = '';
  }
  renderView();
}

function setSelectedItemId(id) {
  selectedItemId = id;
  if (id) {
    const item = items.find(i => i.id === id);
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

// --- Rendering ---
function handleSearch(query) {
  searchQuery = query;
  const contentArea = document.getElementById('view-content-area');
  if (!contentArea) return;

  let filteredItems = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  if (items.length === 0) {
    renderEmpty(contentArea);
  } else if (filteredItems.length === 0) {
    contentArea.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No tasks match the selected Area filter.'}</p>
      </div>
    `;
  } else {
    renderParkingList(contentArea, filteredItems);
  }
}

function renderView() {
  if (!containerEl) return;

  let filteredItems = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(t => (t.title || '').toLowerCase().includes(q));
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

  if (items.length === 0) {
    renderEmpty(contentArea);
  } else if (filteredItems.length === 0) {
    contentArea.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No tasks match the selected Area filter.'}</p>
      </div>
    `;
  } else {
    renderParkingList(contentArea, filteredItems);
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
      <h2>parking lot</h2>
      <p>Nothing parked.</p>
      <p style="color: var(--color-text-muted); font-size: var(--font-size-xs); max-width: 320px; margin: var(--space-sm) 0 0 0; line-height: 1.4;">
        The Parking Lot is for things that matter, just not today.
      </p>
    </div>
  `;
}

function renderParkingList(targetEl, listItems) {
  targetEl.innerHTML = `
    <div class="completed-header" style="margin-bottom: var(--space-sm);">Parked items</div>
    <div class="tasks-list-active" id="parking-items-list" role="listbox" aria-label="Parked items"></div>
  `;

  const listEl = document.getElementById('parking-items-list');
  listItems.forEach(item => {
    listEl.appendChild(buildParkRow(item));
  });

  // Restore keyboard focus (only if user is not editing in the Inspector)
  if (selectedItemId && !editingItemId) {
    const activeEl = document.activeElement;
    const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
    if (!isEditingInInspector) {
      const el = listEl.querySelector(`[data-id="${selectedItemId}"]`);
      if (el) requestAnimationFrame(() => el.focus());
    }
  }
}

function buildParkRow(item) {
  const row = document.createElement('div');
  row.className = 'task-item';
  row.setAttribute('data-id', item.id);
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', item.id === selectedItemId ? 'true' : 'false');
  row.setAttribute('tabindex', '0');

  if (item.id === selectedItemId) row.classList.add('selected');
  if (item.focused && item.status === 'active') row.classList.add('focused');

  const isEditing = item.id === editingItemId;

  if (isEditing) {
    const input = createInput({
      value: item.title,
      onKeyDown: (e) => handleEditKeyDown(e, item.id),
      onBlur: (e) => commitEdit(item.id, e.target.value),
      className: 'task-edit-input'
    });
    row.appendChild(input);
    requestAnimationFrame(() => { input.focus(); input.select(); });
  } else {
    // Title with Area badge (Parking Lot is a flat list; area context is useful)
    const title = document.createElement('span');
    title.className = 'task-title';
    const area = item.areaId ? Repository.getAreas().find(a => a.id === item.areaId) : null;
    if (area) {
      const badge = document.createElement('span');
      badge.className = 'task-area-label';
      badge.textContent = `[${area.name}] `;
      title.appendChild(badge);
    }
    title.appendChild(document.createTextNode(item.title || ''));
    row.appendChild(title);
  }

  // Time metadata — "parked X ago"
  const timeBadge = document.createElement('span');
  timeBadge.className = 'task-time-meta';
  timeBadge.textContent = `parked ${getRelativeTime(item.updatedAt)}`;
  row.appendChild(timeBadge);

  // Contextual action buttons.
  // Parking Lot: omit the 'park' action — tasks are already parked.
  // Show: focus (toggle), area, capture (move back), archive, del
  const actionButtons = [];

  const focusBtn = document.createElement('button');
  focusBtn.className = 'action-btn';
  if (item.focused && item.status === 'active') focusBtn.classList.add('active');
  focusBtn.setAttribute('aria-label', 'Toggle Focus');
  focusBtn.setAttribute('tabindex', '-1');
  focusBtn.textContent = 'focus';
  focusBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFocus(item.id); });
  actionButtons.push(focusBtn);

  const assignBtn = document.createElement('button');
  assignBtn.className = 'action-btn';
  assignBtn.textContent = 'area';
  assignBtn.setAttribute('aria-label', 'Assign Area');
  assignBtn.setAttribute('tabindex', '-1');
  assignBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAreaPicker(e, item, (areaId) => Repository.update(item.id, { areaId }));
  });
  actionButtons.push(assignBtn);

  const captureBtn = document.createElement('button');
  captureBtn.className = 'action-btn';
  captureBtn.setAttribute('aria-label', 'Move to Capture');
  captureBtn.setAttribute('tabindex', '-1');
  captureBtn.textContent = 'capture';
  captureBtn.addEventListener('click', (e) => { e.stopPropagation(); moveToCapture(item.id); });
  actionButtons.push(captureBtn);

  const archiveBtn = document.createElement('button');
  archiveBtn.className = 'action-btn';
  archiveBtn.setAttribute('aria-label', 'Archive task');
  archiveBtn.setAttribute('tabindex', '-1');
  archiveBtn.textContent = 'archive';
  archiveBtn.addEventListener('click', (e) => { e.stopPropagation(); moveToArchive(item.id); });
  actionButtons.push(archiveBtn);

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn btn-danger';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.setAttribute('tabindex', '-1');
  delBtn.textContent = 'del';
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteItem(item.id); });
  actionButtons.push(delBtn);

  // Wrap actions (hidden by default; revealed on hover/select via CSS)
  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'task-actions';

  const inlineWrap = document.createElement('div');
  inlineWrap.className = 'task-actions-inline';
  actionButtons.forEach(btn => inlineWrap.appendChild(btn));
  actionsWrap.appendChild(inlineWrap);

  const moreWrap = document.createElement('div');
  moreWrap.className = 'task-actions-more';
  const moreBtn = document.createElement('button');
  moreBtn.className = 'action-btn task-more-btn';
  moreBtn.setAttribute('tabindex', '-1');
  moreBtn.setAttribute('aria-label', 'More task actions');
  moreBtn.textContent = '···';
  moreBtn.addEventListener('click', (e) => { e.stopPropagation(); openParkActionMenu(e, actionButtons); });
  moreWrap.appendChild(moreBtn);
  actionsWrap.appendChild(moreWrap);
  row.appendChild(actionsWrap);

  if (!isEditing) {
    row.addEventListener('click', () => {
      setSelectedItemId(item.id);
      renderView();
    });
    row.addEventListener('dblclick', () => startEditing(item.id));
  }

  return row;
}

function openParkActionMenu(e, actionButtons) {
  e.stopPropagation();
  const existing = document.querySelector('.task-action-menu');
  if (existing) existing.remove();
  const triggerEl = e.currentTarget || e.target;
  const rect = triggerEl.getBoundingClientRect();
  const menu = document.createElement('div');
  menu.className = 'task-action-menu';
  const leftPos = Math.min(rect.left + window.scrollX, window.innerWidth - 130);
  menu.style.top  = `${rect.bottom + window.scrollY + 2}px`;
  menu.style.left = `${Math.max(10, leftPos)}px`;
  actionButtons.forEach(btn => {
    const item = document.createElement('button');
    item.className = 'task-action-menu-item';
    if (btn.classList.contains('btn-danger')) item.classList.add('btn-danger');
    if (btn.classList.contains('active'))     item.classList.add('active');
    item.textContent = btn.textContent;
    item.addEventListener('click', (evt) => {
      evt.stopPropagation();
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', kbHandler);
      btn.click();
    });
    menu.appendChild(item);
  });
  document.body.appendChild(menu);
  const closeMenu = (evt) => {
    if (!menu.contains(evt.target) && !triggerEl.contains(evt.target)) {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', kbHandler);
    }
  };
  const kbHandler = (evt) => {
    if (evt.key === 'Escape') {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', kbHandler);
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', kbHandler);
  }, 0);
}


// --- Park Operations ---
function toggleFocus(itemId) {
  const item = Repository.getAll().find(i => i.id === itemId);
  if (!item) return;

  if (item.focused) {
    Repository.update(itemId, { focused: false });
    ToastService.show('Removed from Focus.', 'info');
  } else {
    const activeFocus = Repository.getFocusedTasks().filter(t => t.status === 'active');
    if (activeFocus.length >= 3) {
      ToastService.show('Focus is full. Complete something first.', 'info');
      return;
    }
    Repository.update(itemId, { focused: true });
    ToastService.show('Added to Focus.', 'success');
  }
}

function moveToCapture(itemId) {
  Repository.move(itemId, 'capture');
  if (selectedItemId === itemId) setSelectedItemId(null);
  ToastService.show('Moved to Capture.', 'success');
}

function moveToArchive(itemId) {
  const item = Repository.get(itemId);
  if (!item) return;

  const performArchive = () => {
    Repository.move(itemId, 'archive');
    if (selectedItemId === itemId) setSelectedItemId(null);
    ToastService.show('Archived.', 'success');
  };

  const settings = SettingsStore.load();
  if (settings.confirmArchive) {
    DialogService.confirm({
      title: 'Archive Item',
      message: `Are you sure you want to archive "${item.title || 'Untitled'}"?`,
      confirmText: 'Archive',
      variant: 'primary'
    }).then(confirmed => {
      if (confirmed) performArchive();
    });
  } else {
    performArchive();
  }
}

function deleteItem(itemId) {
  const item = Repository.get(itemId);
  if (!item) return;

  const performDelete = () => {
    Repository.remove(itemId);
    if (selectedItemId === itemId) setSelectedItemId(null);
    if (editingItemId === itemId) editingItemId = null;
    ToastService.show('Deleted permanently.', 'info');
  };

  const settings = SettingsStore.load();
  if (settings.confirmDelete) {
    DialogService.confirm({
      title: 'Delete Parked Item',
      message: `Are you sure you want to permanently delete this parked item?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then((confirmed) => {
      if (confirmed) performDelete();
    });
  } else {
    performDelete();
  }
}

function startEditing(itemId) {
  editingItemId = itemId;
  setSelectedItemId(itemId);
  renderView();
}

function handleEditKeyDown(event, itemId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    commitEdit(itemId, event.target.value);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    editingItemId = null;
    setSelectedItemId(null);
    renderView();
  }
}

function commitEdit(itemId, newTitle) {
  const item = items.find(i => i.id === itemId);
  const title = newTitle.trim();

  if (item && title && item.title !== title) {
    Repository.update(itemId, { title });
  }

  editingItemId = null;
  renderView();
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
    el.isContentEditable
  );
  if (editing) return;

  let filtered = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  if (!selectedItemId || editingItemId) {
    if (event.key === 'ArrowDown' && filtered.length > 0) {
      event.preventDefault();
      setSelectedItemId(filtered[0].id);
      renderView();
    }
    return;
  }

  const idx = filtered.findIndex(i => i.id === selectedItemId);
  if (idx === -1) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (idx < filtered.length - 1) {
        setSelectedItemId(filtered[idx + 1].id);
        renderView();
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (idx > 0) {
        setSelectedItemId(filtered[idx - 1].id);
        renderView();
      } else {
        setSelectedItemId(null);
        renderView();
      }
      break;
    case 'Enter':
    case 'e':
    case 'E':
      event.preventDefault();
      startEditing(selectedItemId);
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
    case 'p':
    case 'P':
    case 'f':
    case 'F':
      event.preventDefault();
      toggleFocus(selectedItemId);
      break;
    case 'c':
    case 'C':
      event.preventDefault();
      moveToCapture(selectedItemId);
      break;
    case 'a':
    case 'A':
      event.preventDefault();
      moveToArchive(selectedItemId);
      break;
  }
}
