import { Repository } from '../core/repository.js';
import { EventBus } from '../core/event-bus.js';
import { ToastService } from '../ui/toast.js';
import { getRelativeTime } from '../ui/utils.js';
import { createSearchInput } from '../ui/search.js';
import { openAreaPicker } from '../ui/area-picker.js';
import { QuickCapture } from '../core/quick-capture.js';
import { createCheckbox } from '../ui/checkbox.js';
import { SettingsStore } from '../core/settings-store.js';
import { DialogService } from '../ui/dialog.js';

let containerEl = null;
let items = [];
let selectedItemId = null;
let filterAreaId = '';
let searchQuery = '';
let groupMode = 'area'; // Default grouping mode: 'area' or 'none'

export function renderCaptureView(container) {
  container.innerHTML = '';
  containerEl = document.createElement('div');
  containerEl.className = 'capture-view';
  container.appendChild(containerEl);

  items = Repository.getByModule('capture').sort((a, b) => b.createdAt - a.createdAt);
  searchQuery = '';

  if (selectedItemId && !items.find(i => i.id === selectedItemId)) {
    setSelectedItemId(null);
  }

  renderView();

  // Reset and subscribe to event updates
  cleanupEventBus();
  EventBus.on('itemCreated', handleItemChange);
  EventBus.on('itemUpdated', handleItemChange);
  EventBus.on('itemDeleted', handleItemChange);
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

function handleItemChange() {
  items = Repository.getByModule('capture').sort((a, b) => b.createdAt - a.createdAt);
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

  const active = filteredItems.filter(t => t.status === 'active');
  const completed = filteredItems.filter(t => t.status === 'completed');
  const { ordered: orderedActive } = getOrderedActiveTasks(active);

  if (items.length === 0) {
    renderEmpty(contentArea);
  } else if (filteredItems.length === 0) {
    contentArea.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No tasks match the selected Area filter.'}</p>
      </div>
    `;
  } else {
    renderCaptureList(contentArea, groupMode === 'area' ? orderedActive : active, completed);
  }
}

function renderView() {
  if (!containerEl) return;

  let filteredItems = filterAreaId ? items.filter(t => t.areaId === filterAreaId) : items;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  const activeTasks = items.filter(t => t.status === 'active');
  const activeAreas = Repository.getActiveAreas();
  const activeAreaIds = new Set(activeAreas.map(a => a.id));
  const unassignedCount = activeTasks.filter(t => !t.areaId || !activeAreaIds.has(t.areaId)).length;

  containerEl.innerHTML = `
    <div class="focus-container">
      
      <!-- Capture Header & Toolbar Bar -->
      <div class="capture-header-bar">
        <div class="capture-header-stats">
          <span class="capture-stat-active">${activeTasks.length} active</span>
          <span class="capture-stat-divider">·</span>
          <span class="capture-stat-unassigned">${unassignedCount} unassigned</span>
        </div>

        <div class="capture-toolbar-controls">
          <select id="area-filter-select" class="inspector-select capture-toolbar-select" title="Filter by Area">
          </select>

          <select id="group-mode-select" class="inspector-select capture-toolbar-select" title="Group Mode">
            <option value="area" ${groupMode === 'area' ? 'selected' : ''}>Group: Area</option>
            <option value="none" ${groupMode === 'none' ? 'selected' : ''}>Group: None</option>
          </select>

          <div id="view-search-portal"></div>

          <button id="add-capture-btn-list" class="action-btn header-add-btn" style="text-decoration:none;" title="New Capture (C)" aria-label="New Capture">
            <span class="header-add-icon" aria-hidden="true">+</span>
            <span class="header-add-label"> New Capture</span>
          </button>
        </div>
      </div>

      <div id="view-content-area"></div>
    </div>
  `;

  renderAreaFilter();

  const groupSelect = containerEl.querySelector('#group-mode-select');
  if (groupSelect) {
    groupSelect.addEventListener('change', (e) => {
      groupMode = e.target.value;
      renderView();
    });
  }

  const addBtn = containerEl.querySelector('#add-capture-btn-list');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      QuickCapture.open(filterAreaId || undefined);
    });
  }

  const searchPortal = containerEl.querySelector('#view-search-portal');
  if (searchPortal) {
    searchPortal.appendChild(createSearchInput({
      value: searchQuery,
      onInput: handleSearch
    }));
  }

  const contentArea = document.getElementById('view-content-area');

  const active = filteredItems.filter(t => t.status === 'active');
  const completed = filteredItems.filter(t => t.status === 'completed');
  const { ordered: orderedActive } = getOrderedActiveTasks(active);

  if (items.length === 0) {
    renderEmpty(contentArea);
  } else if (filteredItems.length === 0) {
    contentArea.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No tasks match the selected Area filter.'}</p>
      </div>
    `;
  } else {
    renderCaptureList(contentArea, groupMode === 'area' ? orderedActive : active, completed);
  }
}

function renderAreaFilter() {
  const select = document.getElementById('area-filter-select');
  if (!select) return;

  const activeAreas = Repository.getActiveAreas();
  let html = `<option value="">All Areas</option>`;
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
      <h2>capture</h2>
      <p>No captured thoughts.</p>
      <p style="color: var(--color-text-muted); margin-top: var(--space-xs);">Press <span style="color: var(--color-accent-blue)">C</span> to capture an idea.</p>
    </div>
  `;
}

const collapsedCaptureSections = new Set();

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderCaptureList(targetEl, active, completed) {
  targetEl.innerHTML = `<div style="display: flex; flex-direction: column;" id="capture-content-wrapper"></div>`;
  const contentWrapper = document.getElementById('capture-content-wrapper');

  if (groupMode === 'none') {
    // Mode 2: Flat List (No area grouping)
    if (active.length > 0) {
      const listEl = document.createElement('div');
      listEl.className = 'tasks-list-active';
      listEl.setAttribute('role', 'listbox');
      listEl.setAttribute('tabindex', '-1');
      active.forEach(item => {
        listEl.appendChild(buildCaptureRow(item, false));
      });
      contentWrapper.appendChild(listEl);
    }

    if (completed.length > 0) {
      const sectionKey = 'section:completed';
      const isCollapsed = collapsedCaptureSections.has(sectionKey);

      const completedWrapper = document.createElement('div');
      completedWrapper.className = 'capture-section-wrapper';
      completedWrapper.style.marginTop = active.length > 0 ? 'var(--space-md)' : '0';

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'completed-header capture-section-header';
      header.setAttribute('aria-expanded', !isCollapsed);
      header.setAttribute('aria-label', 'Toggle completed section');

      header.innerHTML = `
        <span class="capture-section-toggle-icon">${isCollapsed ? '►' : '▼'}</span>
        <span class="capture-section-title">Completed</span>
        <span class="capture-section-count">(${completed.length})</span>
      `;

      header.addEventListener('click', (e) => {
        e.stopPropagation();
        if (collapsedCaptureSections.has(sectionKey)) {
          collapsedCaptureSections.delete(sectionKey);
        } else {
          collapsedCaptureSections.add(sectionKey);
        }
        renderView();
      });

      const completedListEl = document.createElement('div');
      completedListEl.className = 'tasks-list-completed capture-section-tasks';
      completedListEl.setAttribute('role', 'list');
      completedListEl.setAttribute('aria-label', 'Completed tasks');
      completedListEl.style.display = isCollapsed ? 'none' : 'flex';
      completedListEl.style.flexDirection = 'column';

      completed.forEach(item => {
        completedListEl.appendChild(buildCaptureRow(item, false));
      });

      completedWrapper.appendChild(header);
      completedWrapper.appendChild(completedListEl);
      contentWrapper.appendChild(completedWrapper);
    }

  } else {
    // Mode 1: Grouped by Area (Section Headers with counts)
    const { noAreaTasks, activeAreas, areaTasksMap } = getOrderedActiveTasks(active);

    // 1. Render default section (no area)
    if (noAreaTasks.length > 0) {
      if (activeAreas.length > 0) {
        const sectionKey = 'area:none';
        const isCollapsed = collapsedCaptureSections.has(sectionKey);

        const unassignedWrapper = document.createElement('div');
        unassignedWrapper.className = 'capture-section-wrapper';

        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'completed-header capture-section-header';
        header.setAttribute('aria-expanded', !isCollapsed);
        header.setAttribute('aria-label', 'Toggle unassigned section');

        header.innerHTML = `
          <span class="capture-section-toggle-icon">${isCollapsed ? '►' : '▼'}</span>
          <span class="capture-section-title">Unassigned</span>
          <span class="capture-section-count">(${noAreaTasks.length})</span>
        `;

        header.addEventListener('click', (e) => {
          e.stopPropagation();
          if (collapsedCaptureSections.has(sectionKey)) {
            collapsedCaptureSections.delete(sectionKey);
          } else {
            collapsedCaptureSections.add(sectionKey);
          }
          renderView();
        });

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'tasks-list-active capture-section-tasks';
        tasksContainer.setAttribute('role', 'listbox');
        tasksContainer.setAttribute('tabindex', '-1');
        tasksContainer.style.display = isCollapsed ? 'none' : 'flex';
        tasksContainer.style.flexDirection = 'column';

        noAreaTasks.forEach(item => {
          tasksContainer.appendChild(buildCaptureRow(item, true)); // isGroupedByArea = true
        });

        unassignedWrapper.appendChild(header);
        unassignedWrapper.appendChild(tasksContainer);
        contentWrapper.appendChild(unassignedWrapper);
      } else {
        const listEl = document.createElement('div');
        listEl.className = 'tasks-list-active';
        listEl.setAttribute('role', 'listbox');
        listEl.setAttribute('tabindex', '-1');
        noAreaTasks.forEach(item => {
          listEl.appendChild(buildCaptureRow(item, true));
        });
        contentWrapper.appendChild(listEl);
      }
    }

    // 2. Render each Area section with its toggle header
    activeAreas.forEach((area, index) => {
      const tasksInArea = areaTasksMap[area.id] || [];
      if (tasksInArea.length > 0) {
        const sectionKey = `area:${area.id}`;
        const isCollapsed = collapsedCaptureSections.has(sectionKey);

        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'capture-section-wrapper';
        if (index > 0 || noAreaTasks.length > 0) {
          sectionWrapper.style.marginTop = 'var(--space-md)';
        }

        const header = document.createElement('button');
        header.type = 'button';
        header.className = 'completed-header capture-section-header';
        header.setAttribute('aria-expanded', !isCollapsed);
        header.setAttribute('aria-label', `Toggle ${area.name} section`);

        header.innerHTML = `
          <span class="capture-section-toggle-icon">${isCollapsed ? '►' : '▼'}</span>
          <span class="capture-section-title">${escapeHtml(area.name)}</span>
          <span class="capture-section-count">(${tasksInArea.length})</span>
        `;

        header.addEventListener('click', (e) => {
          e.stopPropagation();
          if (collapsedCaptureSections.has(sectionKey)) {
            collapsedCaptureSections.delete(sectionKey);
          } else {
            collapsedCaptureSections.add(sectionKey);
          }
          renderView();
        });

        const tasksContainer = document.createElement('div');
        tasksContainer.className = 'tasks-list-active capture-section-tasks';
        tasksContainer.setAttribute('role', 'listbox');
        tasksContainer.setAttribute('tabindex', '-1');
        tasksContainer.style.display = isCollapsed ? 'none' : 'flex';
        tasksContainer.style.flexDirection = 'column';

        tasksInArea.forEach(item => {
          tasksContainer.appendChild(buildCaptureRow(item, true)); // isGroupedByArea = true
        });

        sectionWrapper.appendChild(header);
        sectionWrapper.appendChild(tasksContainer);
        contentWrapper.appendChild(sectionWrapper);
      }
    });

    // 3. Render completed section
    if (completed.length > 0) {
      const sectionKey = 'section:completed';
      const isCollapsed = collapsedCaptureSections.has(sectionKey);

      const completedWrapper = document.createElement('div');
      completedWrapper.className = 'capture-section-wrapper';
      completedWrapper.style.marginTop = 'var(--space-md)';

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'completed-header capture-section-header';
      header.setAttribute('aria-expanded', !isCollapsed);
      header.setAttribute('aria-label', 'Toggle completed section');

      header.innerHTML = `
        <span class="capture-section-toggle-icon">${isCollapsed ? '►' : '▼'}</span>
        <span class="capture-section-title">Completed</span>
        <span class="capture-section-count">(${completed.length})</span>
      `;

      header.addEventListener('click', (e) => {
        e.stopPropagation();
        if (collapsedCaptureSections.has(sectionKey)) {
          collapsedCaptureSections.delete(sectionKey);
        } else {
          collapsedCaptureSections.add(sectionKey);
        }
        renderView();
      });

      const completedListEl = document.createElement('div');
      completedListEl.className = 'tasks-list-completed capture-section-tasks';
      completedListEl.setAttribute('role', 'list');
      completedListEl.setAttribute('aria-label', 'Completed tasks');
      completedListEl.style.display = isCollapsed ? 'none' : 'flex';
      completedListEl.style.flexDirection = 'column';

      completed.forEach(item => {
        completedListEl.appendChild(buildCaptureRow(item, true));
      });

      completedWrapper.appendChild(header);
      completedWrapper.appendChild(completedListEl);
      contentWrapper.appendChild(completedWrapper);
    }
  }

  // Restore focus if an item was selected
  if (selectedItemId) {
    const activeEl = document.activeElement;
    const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
    if (!isEditingInInspector) {
      const selectedEl = contentWrapper.querySelector(`[data-id="${selectedItemId}"]`);
      if (selectedEl) selectedEl.focus();
    }
  }
}

function buildCaptureRow(item, isGroupedByArea = true) {
  const row = document.createElement('div');
  row.className = 'task-item';
  row.setAttribute('data-id', item.id);

  const isCompleted = item.status === 'completed';
  const isFocused = item.focused && item.status === 'active';

  if (isCompleted) {
    row.classList.add('completed');
    row.setAttribute('role', 'listitem');
    row.setAttribute('tabindex', '-1');
  } else {
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', item.id === selectedItemId ? 'true' : 'false');
    row.setAttribute('tabindex', '0');
    if (item.id === selectedItemId) row.classList.add('selected');
  }

  if (isFocused) row.classList.add('focused');

  // Checkbox
  row.appendChild(createCheckbox({
    checked: isCompleted,
    onChange: () => toggleCompletion(item.id)
  }));

  // Title — Area prefix omitted when grouped under an Area section header
  const title = document.createElement('span');
  title.className = 'task-title';
  if (!isGroupedByArea && item.areaId) {
    const area = Repository.getAreas().find(a => a.id === item.areaId);
    if (area) {
      const badge = document.createElement('span');
      badge.className = 'task-area-label';
      badge.textContent = `[${area.name}] `;
      title.appendChild(badge);
    }
  }
  title.appendChild(document.createTextNode(item.title || ''));
  row.appendChild(title);

  // Time metadata
  const timeBadge = document.createElement('span');
  timeBadge.className = 'task-time-meta';
  timeBadge.textContent = getRelativeTime(item.createdAt);
  row.appendChild(timeBadge);

  // Contextual action buttons
  const actionButtons = [];

  const focusBtn = document.createElement('button');
  focusBtn.className = 'action-btn';
  if (item.focused && item.status === 'active') focusBtn.classList.add('active');
  focusBtn.textContent = 'focus';
  focusBtn.setAttribute('tabindex', '-1');
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

  const parkBtn = document.createElement('button');
  parkBtn.className = 'action-btn';
  parkBtn.textContent = 'park';
  parkBtn.setAttribute('tabindex', '-1');
  parkBtn.addEventListener('click', (e) => { e.stopPropagation(); parkItem(item.id); });
  actionButtons.push(parkBtn);

  const archiveBtn = document.createElement('button');
  archiveBtn.className = 'action-btn';
  archiveBtn.textContent = 'archive';
  archiveBtn.setAttribute('tabindex', '-1');
  archiveBtn.addEventListener('click', (e) => { e.stopPropagation(); archiveItem(item.id); });
  actionButtons.push(archiveBtn);

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn btn-danger';
  delBtn.textContent = 'del';
  delBtn.setAttribute('tabindex', '-1');
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
  moreBtn.addEventListener('click', (e) => { e.stopPropagation(); openCaptureActionMenu(e, actionButtons); });
  moreWrap.appendChild(moreBtn);
  actionsWrap.appendChild(moreWrap);
  row.appendChild(actionsWrap);

  if (!isCompleted) {
    row.addEventListener('click', () => {
      setSelectedItemId(selectedItemId === item.id ? null : item.id);
      renderView();
    });
  }

  return row;
}

function openCaptureActionMenu(e, actionButtons) {
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

// --- Capture Operations ---
function toggleCompletion(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const nextStatus = item.status === 'completed' ? 'active' : 'completed';
  if (nextStatus === 'completed' && selectedItemId === itemId) {
    setSelectedItemId(null);
  }

  const settings = SettingsStore.load();
  if (nextStatus === 'completed' && settings.autoClearCompleted) {
    Repository.remove(itemId);
    ToastService.show('Task completed and cleared.', 'success');
    return;
  }

  const updated = Repository.update(itemId, { status: nextStatus });
  if (nextStatus === 'active' && item.focused && updated && !updated.focused) {
    return;
  }
  ToastService.show(nextStatus === 'completed' ? 'Task completed.' : 'Task reopened.', nextStatus === 'completed' ? 'success' : 'info');
}

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

function parkItem(itemId) {
  Repository.move(itemId, 'parking-lot');
  if (selectedItemId === itemId) setSelectedItemId(null);
  ToastService.show('Parked.', 'success');
}

function archiveItem(itemId) {
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
    ToastService.show('Deleted.', 'info');
  };

  const settings = SettingsStore.load();
  if (settings.confirmDelete) {
    DialogService.confirm({
      title: 'Delete Item',
      message: `Are you sure you want to delete "${item.title || 'Untitled'}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) performDelete();
    });
  } else {
    performDelete();
  }
}

function getOrderedActiveTasks(activeTasks) {
  const activeAreas = Repository.getActiveAreas();
  const activeAreaIds = new Set(activeAreas.map(a => a.id));

  const noAreaTasks = activeTasks.filter(t => !t.areaId || !activeAreaIds.has(t.areaId));
  const areaTasksMap = {};
  activeTasks.forEach(t => {
    if (t.areaId && activeAreaIds.has(t.areaId)) {
      if (!areaTasksMap[t.areaId]) areaTasksMap[t.areaId] = [];
      areaTasksMap[t.areaId].push(t);
    }
  });

  const ordered = [...noAreaTasks];
  activeAreas.forEach(area => {
    const tasksInArea = areaTasksMap[area.id] || [];
    ordered.push(...tasksInArea);
  });

  return { ordered, activeAreas, areaTasksMap, noAreaTasks };
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

  const active = items.filter(t => t.status === 'active');
  const { ordered: orderedActive } = getOrderedActiveTasks(active);
  const targetList = groupMode === 'area' ? orderedActive : active;
  let filtered = filterAreaId ? targetList.filter(t => t.areaId === filterAreaId) : targetList;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  if (!selectedItemId) {
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
    case 'Escape':
      event.preventDefault();
      setSelectedItemId(null);
      renderView();
      break;
    case ' ':
      event.preventDefault();
      toggleCompletion(selectedItemId);
      break;
    case 'f':
    case 'F':
      event.preventDefault();
      toggleFocus(selectedItemId);
      break;
    case 'p':
    case 'P':
      event.preventDefault();
      parkItem(selectedItemId);
      break;
    case 'a':
    case 'A':
      event.preventDefault();
      archiveItem(selectedItemId);
      break;
    case 'd':
    case 'D':
    case 'Delete':
    case 'Backspace':
      event.preventDefault();
      deleteItem(selectedItemId);
      break;
  }
}

/**
 * Focus and highlight a specific captured item.
 * Called by the Command Palette.
 */
export function focusAndSelectCaptureTask(itemId) {
  setSelectedItemId(itemId);
  const activeContainer = document.getElementById('active-view');
  if (activeContainer) renderCaptureView(activeContainer);
}
