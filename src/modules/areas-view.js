import { Repository } from '../core/repository.js';
import { EventBus } from '../core/event-bus.js';
import { ToastService } from '../ui/toast.js';
import { DialogService } from '../ui/dialog.js';
import { createInput } from '../ui/input.js';
import { crossfade } from '../ui/utils.js';
import { createSearchInput } from '../ui/search.js';
import { showAreaDeleteDialog } from '../ui/area-delete-dialog.js';
import { SettingsStore } from '../core/settings-store.js';
import { createResponsiveTaskActions } from '../ui/task-action-menu.js';
import { getAreaIconSvg } from '../ui/area-icons.js';

let areas = [];
let selectedAreaId = null;
let editingAreaId = null;
let containerEl = null;
let isCreating = false;
let sortBy = 'alphabetical';
let searchQuery = '';

function loadAndSortAreas() {
  const rawAreas = Repository.getAreas().filter(a => !a.archived);
  const allItems = Repository.getAll();

  if (sortBy === 'alphabetical') {
    areas = rawAreas.sort((a, b) => (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase()));
  } else if (sortBy === 'alphabetical-desc') {
    areas = rawAreas.sort((a, b) => (b.name || '').toLowerCase().localeCompare((a.name || '').toLowerCase()));
  } else if (sortBy === 'created') {
    areas = rawAreas.sort((a, b) => b.createdAt - a.createdAt);
  } else if (sortBy === 'active') {
    areas = rawAreas.sort((a, b) => {
      const activeA = allItems.filter(item => item.type !== 'area' && item.areaId === a.id && item.module === 'capture' && item.status !== 'completed').length;
      const activeB = allItems.filter(item => item.type !== 'area' && item.areaId === b.id && item.module === 'capture' && item.status !== 'completed').length;
      if (activeA !== activeB) {
        return activeB - activeA;
      }
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    });
  } else if (sortBy === 'total-tasks') {
    areas = rawAreas.sort((a, b) => {
      const totalA = allItems.filter(item => item.type !== 'area' && item.areaId === a.id && item.module !== 'archive').length;
      const totalB = allItems.filter(item => item.type !== 'area' && item.areaId === b.id && item.module !== 'archive').length;
      if (totalA !== totalB) {
        return totalB - totalA;
      }
      return (a.name || '').toLowerCase().localeCompare((b.name || '').toLowerCase());
    });
  } else {
    areas = rawAreas.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

/**
 * Mount the Areas view.
 */
export function renderAreasView(container) {
  container.innerHTML = '';
  containerEl = document.createElement('div');
  containerEl.className = 'areas-view';
  container.appendChild(containerEl);

  loadAndSortAreas();
  searchQuery = '';

  if (!selectedAreaId) editingAreaId = null;

  renderView();

  cleanupEventBus();
  EventBus.on('areaCreated', handleAreaChange);
  EventBus.on('areaUpdated', handleAreaChange);
  EventBus.on('areaDeleted', handleAreaChange);
  EventBus.on('itemCreated', handleAreaChange);
  EventBus.on('itemUpdated', handleAreaChange);
  EventBus.on('itemDeleted', handleAreaChange);

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

export function focusAndSelectArea(areaId) {
  setSelectedAreaId(areaId);
  editingAreaId = null;
  isCreating = false;
  const activeContainer = document.getElementById('active-view');
  if (activeContainer) renderAreasView(activeContainer);
}

function handleAreaChange() {
  loadAndSortAreas();
  if (selectedAreaId && !areas.find(a => a.id === selectedAreaId)) {
    setSelectedAreaId(null);
  }
  renderView();
}

function cleanupEventBus() {
  EventBus.off('areaCreated', handleAreaChange);
  EventBus.off('areaUpdated', handleAreaChange);
  EventBus.off('areaDeleted', handleAreaChange);
  EventBus.off('itemCreated', handleAreaChange);
  EventBus.off('itemUpdated', handleAreaChange);
  EventBus.off('itemDeleted', handleAreaChange);
}

function cleanupListeners() {
  cleanupEventBus();
  window.removeEventListener('keydown', handleGlobalKeydown);
  setSelectedAreaId(null);
}

function updateSelection(id) {
  const prevId = selectedAreaId;
  setSelectedAreaId(id);
  isCreating = false;

  if (!containerEl) return;
  const listEl = document.getElementById('areas-items-list');
  if (!listEl) return;

  // Remove selection from previous
  if (prevId && prevId !== id) {
    const prevRow = listEl.querySelector(`[data-id="${prevId}"]`);
    if (prevRow) {
      prevRow.classList.remove('selected');
      prevRow.setAttribute('aria-selected', 'false');
    }
  }

  // Add selection to new
  if (id) {
    const newRow = listEl.querySelector(`[data-id="${id}"]`);
    if (newRow) {
      newRow.classList.add('selected');
      newRow.setAttribute('aria-selected', 'true');
      
      // Focus if appropriate
      const activeEl = document.activeElement;
      const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
      if (!isEditingInInspector) {
        newRow.focus();
      }
    }
  }
}

function setSelectedAreaId(id) {
  selectedAreaId = id;
  if (id) {
    const area = areas.find(a => a.id === id) || Repository.getAreas().find(a => a.id === id);
    EventBus.emit('itemSelected', area || null);
  } else {
    EventBus.emit('itemSelected', null);
  }
  EventBus.emit('viewTitleChanged', { title: 'Areas', breadcrumb: null });
}

// --- Rendering ---
function renderView() {
  if (!containerEl) return;

  const hasList = containerEl.querySelector('.focus-container');
  const hasEmpty = containerEl.querySelector('.placeholder-view');
  const isEmpty = areas.length === 0 && !isCreating;

  if (isEmpty) {
    if (hasList) {
      crossfade(containerEl, () => renderEmpty());
    } else {
      renderEmpty();
    }
  } else {
    if (hasEmpty) {
      crossfade(containerEl, () => renderAreasList());
    } else {
      renderAreasList();
    }
  }
}

function renderEmpty() {
  containerEl.innerHTML = `
    <div class="placeholder-view" style="height: auto; padding: var(--space-lg) 0; margin: 0 auto;">
      <span style="color: var(--color-text-muted); display: block; margin-bottom: var(--space-sm);">${FOLDER_ICON}</span>
      <h2>areas</h2>
      <p style="margin-bottom: 2px;">No Areas yet.</p>
      <p style="color: var(--color-text-secondary); margin-bottom: var(--space-md); font-size: var(--font-size-xs);">Areas help organize related work.</p>
      <p style="color: var(--color-text-muted); margin-top: var(--space-xs);">Press <span style="color: var(--color-accent-blue)">N</span> to create your first Area.</p>
      <div style="margin-top: var(--space-md);">
        <button id="add-area-btn-empty" class="action-btn" style="border: 1px solid var(--color-border); padding: var(--space-xs) var(--space-sm); border-radius: 2px;">+ New Area</button>
      </div>
    </div>
  `;

  const btn = document.getElementById('add-area-btn-empty');
  if (btn) {
    btn.addEventListener('click', () => {
      isCreating = true;
      renderView();
    });
  }
}

function handleSearch(query) {
  searchQuery = query;
  const listEl = document.getElementById('areas-items-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  // Input row if creating
  if (isCreating) {
    const inputRow = document.createElement('div');
    inputRow.className = 'task-item selected';
    const input = createInput({
      placeholder: 'New Area name\u2026',
      onKeyDown: handleCreateKeyDown,
      onBlur: () => {
        isCreating = false;
        renderView();
      },
      id: 'new-area-input'
    });
    inputRow.appendChild(input);
    listEl.appendChild(inputRow);
    requestAnimationFrame(() => input.focus());
  }

  let filteredAreas = areas;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredAreas = areas.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  if (filteredAreas.length === 0 && !isCreating) {
    listEl.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">No matching Areas found.</p>
      </div>
    `;
  } else {
    filteredAreas.forEach(area => {
      listEl.appendChild(buildAreaRow(area));
    });
  }

  // Restore keyboard focus to selected area
  if (selectedAreaId && !editingAreaId && !isCreating) {
    const activeEl = document.activeElement;
    const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
    if (!isEditingInInspector) {
      const el = listEl.querySelector(`[data-id="${selectedAreaId}"]`);
      if (el) requestAnimationFrame(() => el.focus());
    }
  }
}

function renderAreasList() {
  let filteredAreas = areas;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredAreas = areas.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  containerEl.innerHTML = `
    <div class="focus-container">
      <div class="view-filter-bar">
        <div class="view-filter-group">
          <span style="color: var(--color-text-muted);">sort</span>
          <select id="area-sort-select" class="inspector-select" style="width: auto; padding: 2px 4px; border: 1px solid var(--color-border);">
            <option value="alphabetical" ${sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical (A-Z)</option>
            <option value="alphabetical-desc" ${sortBy === 'alphabetical-desc' ? 'selected' : ''}>Alphabetical (Z-A)</option>
            <option value="active" ${sortBy === 'active' ? 'selected' : ''}>Most Active</option>
            <option value="total-tasks" ${sortBy === 'total-tasks' ? 'selected' : ''}>Most Tasks</option>
            <option value="updated" ${sortBy === 'updated' ? 'selected' : ''}>Recently Updated</option>
            <option value="created" ${sortBy === 'created' ? 'selected' : ''}>Recently Created</option>
          </select>
        </div>
        <div id="view-search-portal"></div>
        <button id="add-area-btn-list" class="action-btn header-add-btn" style="text-decoration:none;" title="New Area (C)" aria-label="New Area"><span class="header-add-icon" aria-hidden="true">+</span><span class="header-add-label"> New Area</span></button>
      </div>
      <div class="tasks-list-active" id="areas-items-list" role="listbox" aria-label="Areas list"></div>
    </div>
  `;

  const listEl = document.getElementById('areas-items-list');

  const searchPortal = containerEl.querySelector('#view-search-portal');
  if (searchPortal) {
    searchPortal.appendChild(createSearchInput({
      value: searchQuery,
      onInput: handleSearch
    }));
  }

  const sortSelect = document.getElementById('area-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      loadAndSortAreas();
      renderView();
    });
  }

  // Input row if creating
  if (isCreating) {
    const inputRow = document.createElement('div');
    inputRow.className = 'task-item selected';
    const input = createInput({
      placeholder: 'New Area name\u2026',
      onKeyDown: handleCreateKeyDown,
      onBlur: () => {
        isCreating = false;
        renderView();
      },
      id: 'new-area-input'
    });
    inputRow.appendChild(input);
    listEl.appendChild(inputRow);
    requestAnimationFrame(() => input.focus());
  }

  if (filteredAreas.length === 0 && !isCreating) {
    listEl.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">No matching Areas found.</p>
      </div>
    `;
  } else {
    filteredAreas.forEach(area => {
      listEl.appendChild(buildAreaRow(area));
    });
  }

  const btn = document.getElementById('add-area-btn-list');
  if (btn) {
    btn.addEventListener('click', () => {
      isCreating = true;
      renderView();
    });
  }

  // Restore keyboard focus to selected area
  if (selectedAreaId && !editingAreaId && !isCreating) {
    const activeEl = document.activeElement;
    const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
    if (!isEditingInInspector) {
      const el = listEl.querySelector(`[data-id="${selectedAreaId}"]`);
      if (el) requestAnimationFrame(() => el.focus());
    }
  }
}



function formatTimeAgo(timestamp) {
  if (!timestamp) return 'updated long ago';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'updated just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `updated ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `updated ${days}d ago`;
}

function buildAreaRow(area) {
  const row = document.createElement('div');
  row.className = 'task-item';
  row.setAttribute('data-id', area.id);
  row.setAttribute('role', 'option');
  row.setAttribute('aria-selected', area.id === selectedAreaId ? 'true' : 'false');
  row.setAttribute('tabindex', '0');

  if (area.id === selectedAreaId) {
    row.classList.add('selected');
  }

  const isEditing = area.id === editingAreaId;

  if (isEditing) {
    const input = createInput({
      value: area.name,
      onKeyDown: (e) => handleEditKeyDown(e, area.id),
      onBlur: (e) => commitEdit(area.id, e.target.value),
      className: 'task-edit-input'
    });
    row.appendChild(input);
    requestAnimationFrame(() => { input.focus(); input.select(); });
  } else {
    // Add area-task-item to row to override vertical alignment of selection indicator
    row.classList.add('area-task-item');

    // Create a container body for the two vertical rows (Line 1 and Line 2)
    const body = document.createElement('div');
    body.className = 'area-row-body';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '2px';
    body.style.width = '100%';
    body.style.minWidth = '0';

    // Line 1: Top row (Folder icon + Name/Description + Updated Time)
    const line1 = document.createElement('div');
    line1.style.display = 'flex';
    line1.style.alignItems = 'center';
    line1.style.width = '100%';
    line1.style.minWidth = '0';

    // Add area icon on the left of Line 1
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = getAreaIconSvg(area.icon);
    iconSpan.style.display = 'flex';
    iconSpan.style.alignItems = 'center';
    iconSpan.style.flexShrink = '0';
    iconSpan.style.marginRight = '10px';
    line1.appendChild(iconSpan);

    // Content container for name & optional description
    const content = document.createElement('div');
    content.className = 'area-row-content';
    content.style.display = 'flex';
    content.style.flexDirection = 'row';
    content.style.alignItems = 'baseline';
    content.style.gap = 'var(--space-sm)';
    content.style.flex = '1';
    content.style.minWidth = '0';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'task-title';
    nameSpan.textContent = area.name;
    nameSpan.style.whiteSpace = 'nowrap';
    nameSpan.style.overflow = 'hidden';
    nameSpan.style.textOverflow = 'ellipsis';
    content.appendChild(nameSpan);

    if (area.description) {
      const descSpan = document.createElement('span');
      descSpan.className = 'area-desc';
      descSpan.textContent = area.description;
      descSpan.style.fontSize = 'var(--font-size-xs)';
      descSpan.style.color = 'var(--color-text-secondary)';
      descSpan.style.whiteSpace = 'nowrap';
      descSpan.style.overflow = 'hidden';
      descSpan.style.textOverflow = 'ellipsis';
      descSpan.style.flex = '1'; // Let the description shrink first
      content.appendChild(descSpan);
    }
    line1.appendChild(content);

    // "Updated Xh ago" on the right of Line 1
    const timeSpan = document.createElement('span');
    timeSpan.className = 'area-updated-time';
    timeSpan.style.fontSize = '10px';
    timeSpan.style.color = 'var(--color-text-muted)';
    timeSpan.style.fontFamily = 'var(--font-mono)';
    timeSpan.style.marginLeft = 'auto';
    timeSpan.style.flexShrink = '0';
    timeSpan.textContent = formatTimeAgo(area.updatedAt);
    line1.appendChild(timeSpan);

    body.appendChild(line1);

    // Line 2: Bottom row (Statistics left-aligned under the content)
    const line2 = document.createElement('div');
    line2.style.display = 'flex';
    line2.style.alignItems = 'center';
    line2.style.width = '100%';
    line2.style.paddingLeft = '24px'; // 14px icon + 10px marginRight = 24px to align under content
    line2.style.boxSizing = 'border-box';

    // Compute active, completed, parked, archived counts for the Area
    const allItems = Repository.getAll().filter(item => item.type !== 'area' && item.areaId === area.id);
    const activeCount = allItems.filter(item => item.module === 'capture' && item.status !== 'completed').length;
    const completedCount = allItems.filter(item => item.status === 'completed' && item.module !== 'archive').length;
    const parkedCount = allItems.filter(item => item.module === 'parking-lot' && item.status !== 'completed').length;
    const archivedCount = allItems.filter(item => item.module === 'archive').length;

    const statsContainer = document.createElement('div');
    statsContainer.className = 'area-stats-container';
    statsContainer.style.display = 'flex';
    statsContainer.style.alignItems = 'center';
    statsContainer.style.gap = 'var(--space-xs)';
    statsContainer.style.fontSize = 'var(--font-size-xs)';

    statsContainer.innerHTML = `
      <span class="area-status-badge status-active">${activeCount} active</span>
      <span class="area-status-badge status-completed">${completedCount} completed</span>
      <span class="area-status-badge status-parked">${parkedCount} parked</span>
      <span class="area-status-badge status-archived">${archivedCount} archived</span>
    `;
    line2.appendChild(statsContainer);

    body.appendChild(line2);
    row.appendChild(body);
  }

  // Contextual actions
  const actionButtons = [];

  if (!isEditing) {
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.textContent = 'edit';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startEditing(area.id);
    });
    actionButtons.push(editBtn);

    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'action-btn';
    archiveBtn.textContent = 'archive';
    archiveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      archiveArea(area.id);
    });
    actionButtons.push(archiveBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn btn-danger';
    delBtn.textContent = 'del';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAreaWorkflow(area.id);
    });
    actionButtons.push(delBtn);

    row.appendChild(createResponsiveTaskActions(actionButtons));
  }

  if (!isEditing) {
    row.addEventListener('click', () => {
      updateSelection(area.id);
    });
  }

  return row;
}

// --- Area Operations ---
function handleCreateKeyDown(event) {
  if (event.key === 'Enter') {
    const name = event.target.value.trim();
    if (!name) {
      ToastService.show('Area name is required.', 'error');
      return;
    }
    if (name.length > 50) {
      ToastService.show('Area name must be 50 characters or less.', 'error');
      return;
    }

    const duplicate = areas.some(a => a.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      ToastService.show('An Area with this name already exists.', 'error');
      return;
    }

    const saved = Repository.saveArea({ name });
    isCreating = false;
    if (saved) {
      setSelectedAreaId(saved.id);
      renderView();
    } else {
      renderView();
    }
  } else if (event.key === 'Escape') {
    isCreating = false;
    renderView();
  }
}

function startEditing(areaId) {
  editingAreaId = areaId;
  setSelectedAreaId(areaId);
  isCreating = false;
  renderView();
}

function handleEditKeyDown(event, areaId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    commitEdit(areaId, event.target.value);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    editingAreaId = null;
    setSelectedAreaId(null);
    renderView();
  }
}

function commitEdit(areaId, newName) {
  const area = areas.find(a => a.id === areaId);
  const name = newName.trim();

  if (!name) {
    ToastService.show('Area name is required.', 'error');
    editingAreaId = null;
    renderView();
    return;
  }
  if (name.length > 50) {
    ToastService.show('Area name must be 50 characters or less.', 'error');
    editingAreaId = null;
    renderView();
    return;
  }

  if (area && area.name !== name) {
    const duplicate = areas.some(a => a.id !== areaId && a.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      ToastService.show('An Area with this name already exists.', 'error');
      editingAreaId = null;
      renderView();
      return;
    }
    Repository.saveArea({ ...area, name });
  }

  editingAreaId = null;
  setSelectedAreaId(areaId);
  renderView();
}

function archiveArea(areaId) {
  const area = areas.find(a => a.id === areaId);
  if (!area) return;

  const performArchive = () => {
    Repository.update(areaId, { archived: true });
    if (selectedAreaId === areaId) setSelectedAreaId(null);
    if (editingAreaId === areaId) editingAreaId = null;
    ToastService.show('Area archived.', 'info');
  };

  const settings = SettingsStore.load();
  if (settings.confirmArchiveArea) {
    DialogService.confirm({
      title: 'Archive Area',
      message: `Are you sure you want to archive the Area [${area.name}]?`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then((confirmed) => {
      if (confirmed) performArchive();
    });
  } else {
    performArchive();
  }
}

function deleteAreaWorkflow(areaId) {
  const area = areas.find(a => a.id === areaId);
  if (!area) return;

  const settings = SettingsStore.load();
  const allTasks = Repository.getAll().filter(item => 
    item.type !== 'area' && 
    item.areaId === area.id
  );

  if (!settings.confirmDelete && allTasks.length === 0) {
    Repository.deleteArea(areaId);
    ToastService.show('Area deleted.', 'success');
    if (selectedAreaId === areaId) setSelectedAreaId(null);
    if (editingAreaId === areaId) editingAreaId = null;
  } else {
    showAreaDeleteDialog(area).then((deleted) => {
      if (deleted) {
        if (selectedAreaId === areaId) setSelectedAreaId(null);
        if (editingAreaId === areaId) editingAreaId = null;
      }
    });
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
    el.isContentEditable
  );
  if (editing) return;



  // Press N to create an Area (or press A)
  if (event.key.toLowerCase() === 'n' || event.key.toLowerCase() === 'a') {
    event.preventDefault();
    isCreating = true;
    setSelectedAreaId(null);
    renderView();
    return;
  }

  let filtered = areas;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = areas.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  if (!selectedAreaId || editingAreaId) {
    if (event.key === 'ArrowDown' && filtered.length > 0) {
      event.preventDefault();
      updateSelection(filtered[0].id);
    }
    return;
  }

  const idx = filtered.findIndex(a => a.id === selectedAreaId);
  if (idx === -1) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (idx < filtered.length - 1) {
        updateSelection(filtered[idx + 1].id);
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (idx > 0) {
        updateSelection(filtered[idx - 1].id);
      } else {
        updateSelection(null);
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (event.ctrlKey || event.metaKey) {
        setSelectedAreaId(selectedAreaId);
        const titleInput = document.getElementById('inspector-title-input');
        if (titleInput) {
          titleInput.focus();
          titleInput.select();
        }
      } else {
        updateSelection(selectedAreaId);
      }
      break;
    case 'e':
    case 'E':
      event.preventDefault();
      startEditing(selectedAreaId);
      break;
    case 'Escape':
      event.preventDefault();
      updateSelection(null);
      break;
    case 'Delete':
    case 'Backspace':
    case 'd':
    case 'D':
      event.preventDefault();
      deleteAreaWorkflow(selectedAreaId);
      break;
  }
}
