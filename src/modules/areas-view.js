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
import { escapeHtml } from '../ui/markdown-renderer.js';
import { createCheckbox } from '../ui/checkbox.js';

let areas = [];
let selectedAreaId = null;
let editingAreaId = null;
let containerEl = null;
let isCreating = false;
let isCreatingTask = false;
let navStack = [];
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
  if (areaId) {
    const path = Repository.getAreaPath(areaId);
    navStack = path.map(a => a.id);
  } else {
    navStack = [];
  }
  editingAreaId = null;
  isCreating = false;
  isCreatingTask = false;
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
  navStack = [];
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

function renderBreadcrumbsBar() {
  if (navStack.length === 0) {
    return null;
  }

  const breadcrumbBar = document.createElement('div');
  breadcrumbBar.className = 'area-breadcrumb-bar';

  const rootItem = document.createElement('span');
  rootItem.className = 'breadcrumb-item';
  rootItem.textContent = 'Areas';
  rootItem.addEventListener('click', () => {
    navStack = [];
    setSelectedAreaId(null);
    renderView();
  });
  breadcrumbBar.appendChild(rootItem);

  const activeAreaId = navStack[navStack.length - 1];
  const path = Repository.getAreaPath(activeAreaId);

  path.forEach((ancestor, idx) => {
    const sep = document.createElement('span');
    sep.className = 'breadcrumb-separator';
    sep.textContent = '/';
    breadcrumbBar.appendChild(sep);

    if (idx === path.length - 1) {
      const curr = document.createElement('span');
      curr.className = 'breadcrumb-current';
      curr.textContent = ancestor.name;
      breadcrumbBar.appendChild(curr);
    } else {
      const item = document.createElement('span');
      item.className = 'breadcrumb-item';
      item.textContent = ancestor.name;
      item.addEventListener('click', () => {
        navStack = path.slice(0, idx + 1).map(a => a.id);
        setSelectedAreaId(ancestor.id);
        renderView();
      });
      breadcrumbBar.appendChild(item);
    }
  });

  return breadcrumbBar;
}

function handleSearch(query) {
  searchQuery = query;
  renderView();
}

function renderAreasList() {
  const activeAreaId = navStack.length > 0 ? navStack[navStack.length - 1] : null;
  const activeArea = activeAreaId ? (areas.find(a => a.id === activeAreaId) || Repository.get(activeAreaId)) : null;

  let directChildren = areas.filter(a => (a.parentId || null) === activeAreaId);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    directChildren = directChildren.filter(a => 
      (a.name || '').toLowerCase().includes(q) || 
      (a.description || '').toLowerCase().includes(q)
    );
  }

  const directTasks = activeAreaId 
    ? Repository.getAll().filter(item => item.type !== 'area' && item.areaId === activeAreaId && item.module !== 'archive')
    : [];

  containerEl.innerHTML = `
    <div class="focus-container">
      <div id="area-breadcrumb-portal"></div>
      ${activeArea ? `
        <div class="area-header-banner">
          <div class="area-header-title-row">
            <span style="display:flex;align-items:center;">${getAreaIconSvg(activeArea.icon)}</span>
            <span class="area-header-title">${escapeHtml(activeArea.name)}</span>
          </div>
          ${activeArea.description ? `<div class="area-header-desc">${escapeHtml(activeArea.description)}</div>` : ''}
        </div>
      ` : ''}
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
      </div>

      <!-- AREAS Section -->
      <div class="area-section-header">
        <span class="area-section-title">AREAS</span>
        <button id="add-area-btn-list" class="action-btn header-add-btn" style="text-decoration:none;" title="New Area">
          <span class="header-add-icon" aria-hidden="true">+</span><span class="header-add-label"> New Area</span>
        </button>
      </div>
      <div class="tasks-list-active" id="areas-items-list" role="listbox" aria-label="Areas list"></div>

      ${activeArea ? `
        <!-- TASKS Section -->
        <div class="area-section-header" style="margin-top: var(--space-lg);">
          <span class="area-section-title">TASKS</span>
          <button id="add-task-btn-list" class="action-btn header-add-btn" style="text-decoration:none;" title="New Task">
            <span class="header-add-icon" aria-hidden="true">+</span><span class="header-add-label"> New Task</span>
          </button>
        </div>
        <div class="tasks-list-active" id="area-tasks-items-list" role="listbox" aria-label="Area tasks list"></div>
      ` : ''}
    </div>
  `;

  const breadcrumbPortal = containerEl.querySelector('#area-breadcrumb-portal');
  if (breadcrumbPortal) {
    const bar = renderBreadcrumbsBar();
    if (bar) breadcrumbPortal.appendChild(bar);
  }

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

  // Input row if creating area
  if (isCreating) {
    const inputRow = document.createElement('div');
    inputRow.className = 'task-item selected';
    const input = createInput({
      placeholder: activeArea ? `New Sub-Area under [${activeArea.name}]\u2026` : 'New Area name\u2026',
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

  if (directChildren.length === 0 && !isCreating) {
    listEl.innerHTML = `
      <div style="padding: var(--space-xs) 0; color: var(--color-text-muted); font-size: var(--font-size-xs);">
        No sub-areas yet.
      </div>
    `;
  } else {
    directChildren.forEach(area => {
      listEl.appendChild(buildAreaRow(area));
    });
  }

  const addAreaBtn = document.getElementById('add-area-btn-list');
  if (addAreaBtn) {
    addAreaBtn.addEventListener('click', () => {
      isCreating = true;
      isCreatingTask = false;
      renderView();
    });
  }

  // Render direct tasks list if drilled in
  if (activeArea) {
    const tasksListEl = document.getElementById('area-tasks-items-list');
    if (tasksListEl) {
      if (isCreatingTask) {
        const inputRow = document.createElement('div');
        inputRow.className = 'task-item selected';
        const input = createInput({
          placeholder: 'New Task title\u2026',
          onKeyDown: (e) => handleCreateTaskKeyDown(e, activeArea.id),
          onBlur: () => {
            isCreatingTask = false;
            renderView();
          },
          id: 'new-area-task-input'
        });
        inputRow.appendChild(input);
        tasksListEl.appendChild(inputRow);
        requestAnimationFrame(() => input.focus());
      }

      if (directTasks.length === 0 && !isCreatingTask) {
        tasksListEl.innerHTML = `
          <div style="padding: var(--space-xs) 0; color: var(--color-text-muted); font-size: var(--font-size-xs);">
            No tasks directly assigned to this Area.
          </div>
        `;
      } else {
        directTasks.forEach(task => {
          tasksListEl.appendChild(buildAreaTaskRow(task));
        });
      }

      const addTaskBtn = document.getElementById('add-task-btn-list');
      if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
          isCreatingTask = true;
          isCreating = false;
          renderView();
        });
      }
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
  row.className = 'task-item area-task-item';
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
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = getAreaIconSvg(area.icon);
    iconSpan.style.display = 'flex';
    iconSpan.style.alignItems = 'center';
    iconSpan.style.flexShrink = '0';
    iconSpan.style.marginRight = '10px';
    iconSpan.style.cursor = 'pointer';
    iconSpan.title = 'Enter Area';
    iconSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      navStack.push(area.id);
      renderView();
    });
    row.appendChild(iconSpan);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'task-title';
    nameSpan.textContent = area.name;
    nameSpan.style.cursor = 'pointer';
    nameSpan.title = 'Enter Area';
    nameSpan.addEventListener('click', (e) => {
      e.stopPropagation();
      navStack.push(area.id);
      renderView();
    });
    row.appendChild(nameSpan);

    if (area.description) {
      const descSpan = document.createElement('span');
      descSpan.className = 'area-desc';
      descSpan.textContent = area.description;
      descSpan.style.fontSize = 'var(--font-size-xs)';
      descSpan.style.color = 'var(--color-text-secondary)';
      descSpan.style.whiteSpace = 'nowrap';
      descSpan.style.overflow = 'hidden';
      descSpan.style.textOverflow = 'ellipsis';
      descSpan.style.marginLeft = 'var(--space-xs)';
      row.appendChild(descSpan);
    }

    const allItems = Repository.getAll().filter(item => item.type !== 'area' && item.areaId === area.id);
    const activeCount = allItems.filter(item => item.module === 'capture' && item.status !== 'completed').length;

    const statsSpan = document.createElement('span');
    statsSpan.className = 'area-status-badge status-active';
    statsSpan.style.fontSize = '10px';
    statsSpan.style.marginLeft = 'auto';
    statsSpan.style.marginRight = 'var(--space-xs)';
    statsSpan.textContent = `${activeCount} active`;
    row.appendChild(statsSpan);

    const enterPrompt = document.createElement('span');
    enterPrompt.className = 'area-row-enter-prompt';
    enterPrompt.textContent = '>';
    enterPrompt.title = 'Enter Area';
    enterPrompt.addEventListener('click', (e) => {
      e.stopPropagation();
      navStack.push(area.id);
      renderView();
    });
    row.appendChild(enterPrompt);
  }

  // Contextual actions
  const actionButtons = [];

  if (!isEditing) {
    const detailsBtn = document.createElement('button');
    detailsBtn.className = 'action-btn';
    detailsBtn.textContent = 'details';
    detailsBtn.title = 'Inspect Area';
    detailsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateSelection(area.id);
    });
    actionButtons.push(detailsBtn);

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
      navStack.push(area.id);
      renderView();
    });
  }

  return row;
}

function buildAreaTaskRow(task) {
  const row = document.createElement('div');
  const isCompleted = task.status === 'completed';
  row.className = `task-item ${isCompleted ? 'completed' : ''}`;
  row.setAttribute('data-id', task.id);
  row.setAttribute('role', 'option');

  row.appendChild(createCheckbox({
    checked: isCompleted,
    onChange: () => {
      const nextStatus = isCompleted ? 'active' : 'completed';
      Repository.update(task.id, { status: nextStatus });
    }
  }));

  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.textContent = task.title;
  row.appendChild(titleSpan);

  row.addEventListener('click', () => {
    EventBus.emit('itemSelected', task);
  });

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

    const activeAreaId = navStack.length > 0 ? navStack[navStack.length - 1] : null;
    const duplicate = areas.some(a => (a.parentId || null) === activeAreaId && a.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      ToastService.show('An Area with this name already exists under this parent.', 'error');
      return;
    }

    const saved = Repository.saveArea({ name, parentId: activeAreaId });
    isCreating = false;
    if (saved) {
      ToastService.show(`Area "${saved.name}" created.`, 'success');
      renderView();
    } else {
      renderView();
    }
  } else if (event.key === 'Escape') {
    isCreating = false;
    renderView();
  }
}

function handleCreateTaskKeyDown(event, areaId) {
  if (event.key === 'Enter') {
    const title = event.target.value.trim();
    if (!title) {
      ToastService.show('Task title is required.', 'error');
      return;
    }
    Repository.save({
      title,
      areaId,
      module: 'capture',
      status: 'active'
    });
    isCreatingTask = false;
    ToastService.show('Task created.', 'success');
    renderView();
  } else if (event.key === 'Escape') {
    isCreatingTask = false;
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

  const isBackspace = event.key === 'Backspace';
  const isAltLeft = event.altKey && event.key === 'ArrowLeft';

  // Backspace / Alt+Left parent navigation safety check
  if ((isBackspace || isAltLeft) && navStack.length > 0) {
    const el = document.activeElement;
    const isEditingInput = el && (
      el.tagName === 'INPUT' || 
      el.tagName === 'TEXTAREA' || 
      el.isContentEditable ||
      el.closest('#inspector-panel')
    );
    const isDialogOpen = document.querySelector('.dialog-overlay, .modal-backdrop');

    if (!isEditingInput && !isDialogOpen && !isCreating && !isCreatingTask && !editingAreaId) {
      event.preventDefault();
      event.stopPropagation();
      navStack.pop();
      setSelectedAreaId(navStack.length > 0 ? navStack[navStack.length - 1] : null);
      renderView();
      return;
    }
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

  const activeAreaId = navStack.length > 0 ? navStack[navStack.length - 1] : null;
  const directChildren = areas.filter(a => (a.parentId || null) === activeAreaId);

  if (!selectedAreaId || editingAreaId) {
    if (event.key === 'ArrowDown' && directChildren.length > 0) {
      event.preventDefault();
      updateSelection(directChildren[0].id);
    }
    return;
  }

  const idx = directChildren.findIndex(a => a.id === selectedAreaId);

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (idx !== -1 && idx < directChildren.length - 1) {
        updateSelection(directChildren[idx + 1].id);
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (idx > 0) {
        updateSelection(directChildren[idx - 1].id);
      } else {
        updateSelection(null);
      }
      break;
    case 'Enter':
      event.preventDefault();
      if (selectedAreaId) {
        navStack.push(selectedAreaId);
        renderView();
      }
      break;
    case 'e':
    case 'E':
      event.preventDefault();
      if (selectedAreaId) startEditing(selectedAreaId);
      break;
    case 'Escape':
      // Strictly reserved for existing dismissal behavior
      break;
    case 'Delete':
    case 'd':
    case 'D':
      event.preventDefault();
      if (selectedAreaId) deleteAreaWorkflow(selectedAreaId);
      break;
  }
}
