import { Repository } from '../core/repository.js';
import { EventBus } from '../core/event-bus.js';
import { ToastService } from '../ui/toast.js';
import { renderEmptyState } from '../ui/empty-state.js';
import { createButton } from '../ui/button.js';
import { createInput } from '../ui/input.js';
import { createCheckbox } from '../ui/checkbox.js';
import { crossfade } from '../ui/utils.js';
import { createSearchInput } from '../ui/search.js';
import { openAreaPicker } from '../ui/area-picker.js';
import { createResponsiveTaskActions } from '../ui/task-action-menu.js';
import { SettingsStore } from '../core/settings-store.js';
import { DialogService } from '../ui/dialog.js';

let tasks = [];
let editingTaskId = null;
let selectedTaskId = null;
let containerEl = null;
let isCreating = false;
let filterAreaId = '';
let searchQuery = '';

const EDIT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`;
const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;

/**
 * Mount the Focus view into the given container.
 */
export function renderFocusView(container) {
  container.innerHTML = '';
  containerEl = document.createElement('div');
  containerEl.className = 'focus-view';
  container.appendChild(containerEl);

  tasks = Repository.getFocusedTasks();
  searchQuery = '';

  if (!selectedTaskId) editingTaskId = null;

  renderView();

  // Reset EventBus listeners to prevent duplicate registration
  cleanupEventBus();
  
  // Register EventBus listeners for reactive rendering
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
 * Navigate to a specific task and open it for editing.
 * Called by the Command Palette search.
 */
export function focusAndSelectTask(taskId) {
  setSelectedTaskId(taskId);
  editingTaskId = taskId;
  const activeContainer = document.getElementById('active-view');
  if (activeContainer) renderFocusView(activeContainer);
}

// --- Event Handlers & Cleanup ---

function setSelectedTaskId(id) {
  selectedTaskId = id;
  if (id) {
    const task = tasks.find(t => t.id === id) || Repository.getAll().find(t => t.id === id);
    EventBus.emit('itemSelected', task || null);
  } else {
    EventBus.emit('itemSelected', null);
  }
}

function handleItemChange() {
  tasks = Repository.getFocusedTasks();
  if (filterAreaId && !Repository.getAreas().find(a => a.id === filterAreaId && !a.archived)) {
    filterAreaId = '';
  }
  renderView();
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
  setSelectedTaskId(null);
}

// --- Rendering ---

function handleSearch(query) {
  searchQuery = query;
  const contentArea = document.getElementById('view-content-area');
  if (!contentArea) return;

  const active = tasks.filter(t => t.status === 'active');
  const completed = tasks.filter(t => t.status === 'completed');

  let filteredActive = filterAreaId ? active.filter(t => t.areaId === filterAreaId) : active;
  let filteredCompleted = filterAreaId ? completed.filter(t => t.areaId === filterAreaId) : completed;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredActive = filteredActive.filter(t => (t.title || '').toLowerCase().includes(q));
    filteredCompleted = filteredCompleted.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  if (tasks.length === 0 && !isCreating) {
    renderEmpty(contentArea);
  } else if (filteredActive.length === 0 && filteredCompleted.length === 0 && !isCreating) {
    contentArea.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No tasks match the selected Area filter.'}</p>
      </div>
    `;
  } else if (filteredActive.length === 0 && tasks.length > 0 && !isCreating) {
    renderAllComplete(contentArea);
  } else {
    renderTaskList(contentArea, filteredActive, filteredCompleted);
  }
}

function renderView() {
  if (!containerEl) return;

  const active = tasks.filter(t => t.status === 'active');
  const completed = tasks.filter(t => t.status === 'completed');

  let filteredActive = filterAreaId ? active.filter(t => t.areaId === filterAreaId) : active;
  let filteredCompleted = filterAreaId ? completed.filter(t => t.areaId === filterAreaId) : completed;

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredActive = filteredActive.filter(t => (t.title || '').toLowerCase().includes(q));
    filteredCompleted = filteredCompleted.filter(t => (t.title || '').toLowerCase().includes(q));
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

  if (tasks.length === 0 && !isCreating) {
    renderEmpty(contentArea);
  } else if (filteredActive.length === 0 && filteredCompleted.length === 0 && !isCreating) {
    contentArea.innerHTML = `
      <div class="placeholder-view" style="height: auto; padding: var(--space-md) 0;">
        <p style="color: var(--color-text-muted);">${searchQuery ? 'No matching tasks found.' : 'No tasks match the selected Area filter.'}</p>
      </div>
    `;
  } else if (filteredActive.length === 0 && tasks.length > 0 && !isCreating) {
    renderAllComplete(contentArea);
  } else {
    renderTaskList(contentArea, filteredActive, filteredCompleted);
  }
}

function renderAreaFilter() {
  const select = document.getElementById('area-filter-select');
  if (!select) return;

  const activeAreas = Repository.getAreas().filter(a => !a.archived);
  let html = `<option value="">all</option>`;
  activeAreas.forEach(a => {
    html += `<option value="${a.id}" ${filterAreaId === a.id ? 'selected' : ''}>${a.name}</option>`;
  });
  select.innerHTML = html;

  select.addEventListener('change', (e) => {
    filterAreaId = e.target.value;
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task && task.areaId !== filterAreaId && filterAreaId !== '') {
        setSelectedTaskId(null);
      }
    }
    renderView();
  });
}

function renderEmpty(targetEl) {
  targetEl.innerHTML = `
    <div class="placeholder-view" style="height: auto; padding: var(--space-lg) 0;">
      <h2>focus</h2>
      <p>No active tasks.</p>
      <p style="color: var(--color-text-muted); margin-top: var(--space-xs);">Press <span style="color: var(--color-accent-blue)">A</span> to create one.</p>
    </div>
  `;
}

function renderAllComplete(targetEl) {
  targetEl.innerHTML = `
    <div class="placeholder-view" style="height: auto; padding: var(--space-lg) 0;">
      <h2>nice work.</h2>
      <p>Everything in Focus is complete.</p>
      <p style="color: var(--color-text-muted); margin-top: var(--space-xs);">Press <span style="color: var(--color-accent-blue)">R</span> to start fresh.</p>
    </div>
  `;
}

function renderTaskList(targetEl, active, completed) {
  const atLimit = active.length >= 3;
  const showInput = !atLimit || isCreating;

  targetEl.innerHTML = `
    <div style="display: flex; flex-direction: column;">
      ${atLimit ? `<div class="focus-limit-banner" role="status" style="margin-bottom: var(--space-xs);">You\u2019re focusing on enough already. Complete something before adding more.</div>` : ''}
      ${showInput ? `<div id="task-input-portal" class="task-input-container"></div>` : ''}
      <div class="tasks-list-active" id="active-tasks-list" role="listbox" aria-label="Active focus tasks"></div>
      ${completed.length > 0 ? `
        <div class="completed-header" style="margin-top: var(--space-md);">Completed</div>
        <div class="tasks-list-completed" id="completed-tasks-list" role="list" aria-label="Completed tasks"></div>
      ` : ''}
    </div>
  `;

  // Input
  if (showInput) {
    const portal = document.getElementById('task-input-portal');
    const input = createInput({
      placeholder: 'Add a focus task\u2026',
      onKeyDown: handleCreateKeyDown,
      id: 'new-task-input'
    });
    input.setAttribute('aria-label', 'Create a new focus task');
    portal.appendChild(input);

    if (!selectedTaskId || isCreating) {
      requestAnimationFrame(() => input.focus());
    }
  }

  // Active tasks
  const activeList = document.getElementById('active-tasks-list');
  active.forEach(task => activeList.appendChild(buildTaskRow(task)));

  // Completed tasks
  const completedList = document.getElementById('completed-tasks-list');
  if (completedList) {
    completed.forEach(task => completedList.appendChild(buildTaskRow(task)));
  }

  // Restore keyboard focus to selected task after re-render (only if user is not editing in the Inspector)
  if (selectedTaskId && !editingTaskId && !isCreating) {
    const activeEl = document.activeElement;
    const isEditingInInspector = activeEl && activeEl.closest('#inspector-panel');
    if (!isEditingInInspector) {
      const el = activeList.querySelector(`[data-id="${selectedTaskId}"]`);
      if (el) requestAnimationFrame(() => el.focus());
    }
  }
}

// --- Task Row Builder ---

function buildTaskRow(task) {
  const row = document.createElement('div');
  row.className = 'task-item';
  row.setAttribute('data-id', task.id);

  const isCompleted = task.status === 'completed';

  if (isCompleted) {
    row.classList.add('completed');
    row.setAttribute('role', 'listitem');
    row.setAttribute('tabindex', '-1');
  } else {
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', task.id === selectedTaskId ? 'true' : 'false');
    row.setAttribute('tabindex', '0');
    if (task.id === selectedTaskId) row.classList.add('selected');
  }

  if (task.focused && task.status === 'active') {
    row.classList.add('focused');
  }

  const isEditing = task.id === editingTaskId && !isCompleted;

  // Checkbox
  row.appendChild(createCheckbox({
    checked: isCompleted,
    onChange: () => toggleCompletion(task.id)
  }));

  // Title or edit input
  if (isEditing) {
    const input = createInput({
      value: task.title,
      onKeyDown: (e) => handleEditKeyDown(e, task.id),
      onBlur: (e) => commitEdit(task.id, e.target.value),
      className: 'task-edit-input'
    });
    input.setAttribute('aria-label', 'Edit task title');
    row.appendChild(input);
    requestAnimationFrame(() => { input.focus(); input.select(); });
  } else {
    const area = task.areaId ? Repository.getAreas().find(a => a.id === task.areaId) : null;
    const title = document.createElement('span');
    title.className = 'task-title';
    if (area) {
      const areaLabel = document.createElement('span');
      areaLabel.className = 'task-area-label';
      areaLabel.textContent = `[${area.name}] `;
      title.appendChild(areaLabel);
    }
    const textNode = document.createTextNode(task.title);
    title.appendChild(textNode);
    row.appendChild(title);
  }

  // Contextual actions
  const actionButtons = [];

  if (!isCompleted && !isEditing) {
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.setAttribute('tabindex', '-1');
    editBtn.textContent = 'edit';
    editBtn.addEventListener('click', (e) => { e.stopPropagation(); startEditing(task.id); });
    actionButtons.push(editBtn);

    const assignBtn = document.createElement('button');
    assignBtn.className = 'action-btn';
    assignBtn.setAttribute('aria-label', 'Assign Area');
    assignBtn.setAttribute('tabindex', '-1');
    assignBtn.textContent = 'area';
    assignBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openAreaPicker(e, task, (areaId) => {
        Repository.update(task.id, { areaId });
      });
    });
    actionButtons.push(assignBtn);

    const parkBtn = document.createElement('button');
    parkBtn.className = 'action-btn';
    parkBtn.setAttribute('aria-label', 'Park task');
    parkBtn.setAttribute('tabindex', '-1');
    parkBtn.textContent = 'park';
    parkBtn.addEventListener('click', (e) => { e.stopPropagation(); parkTask(task.id); });
    actionButtons.push(parkBtn);
  }

  if (!isEditing) {
    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'action-btn';
    archiveBtn.setAttribute('aria-label', 'Archive task');
    archiveBtn.setAttribute('tabindex', '-1');
    archiveBtn.textContent = 'archive';
    archiveBtn.addEventListener('click', (e) => { e.stopPropagation(); archiveTask(task.id); });
    actionButtons.push(archiveBtn);
  }

  const delBtn = document.createElement('button');
  delBtn.className = 'action-btn btn-danger';
  delBtn.setAttribute('aria-label', 'Delete task');
  delBtn.setAttribute('tabindex', '-1');
  delBtn.textContent = 'del';
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); deleteTask(task.id); });
  actionButtons.push(delBtn);

  row.appendChild(createResponsiveTaskActions(actionButtons));

  // Click to select (active, non-editing only)
  if (!isCompleted && !isEditing) {
    row.addEventListener('click', () => {
      setSelectedTaskId(task.id);
      isCreating = false;
      renderView();
    });
  }

  return row;
}

// --- Task Operations ---

function handleCreateKeyDown(event) {
  if (event.key === 'Enter') {
    const title = event.target.value.trim();
    if (!title) return;

    const settings = SettingsStore.load();
    const defaultAreaId = settings.defaultArea && settings.defaultArea !== 'none' ? settings.defaultArea : '';

    Repository.save({
      title,
      status: 'active',
      module: 'focus',
      areaId: filterAreaId || defaultAreaId
    });
    event.target.value = '';
    isCreating = false;
  } else if (event.key === 'Escape') {
    isCreating = false;
    renderView();
  }
}

function toggleCompletion(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const nextStatus = task.status === 'completed' ? 'active' : 'completed';
  if (nextStatus === 'completed' && selectedTaskId === taskId) {
    setSelectedTaskId(null);
  }
  
  const settings = SettingsStore.load();
  if (nextStatus === 'completed' && settings.autoClearCompleted) {
    Repository.remove(taskId);
    ToastService.show('Task completed and cleared.', 'success');
    return;
  }

  const updated = Repository.update(taskId, { status: nextStatus });
  if (nextStatus === 'active' && task.focused && updated && !updated.focused) {
    return;
  }
  ToastService.show(nextStatus === 'completed' ? 'Task completed.' : 'Task reopened.', nextStatus === 'completed' ? 'success' : 'info');
}

function startEditing(taskId) {
  editingTaskId = taskId;
  setSelectedTaskId(taskId);
  isCreating = false;
  renderView();
}

function handleEditKeyDown(event, taskId) {
  if (event.key === 'Enter') {
    event.preventDefault();
    commitEdit(taskId, event.target.value);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    editingTaskId = null;
    setSelectedTaskId(null);
    renderView();
  }
}

function commitEdit(taskId, newTitle) {
  const task = tasks.find(t => t.id === taskId);
  const title = newTitle.trim();

  if (task && title && task.title !== title) {
    Repository.update(taskId, { title });
  }

  editingTaskId = null;
  setSelectedTaskId(null);
  renderView();
}

function deleteTask(taskId) {
  const allItems = Repository.getAll();
  const deletedTask = allItems.find(t => t.id === taskId);
  if (!deletedTask) return;
  
  const performDelete = () => {
    const deletedIndex = allItems.indexOf(deletedTask);
    Repository.remove(taskId);
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    if (editingTaskId === taskId) editingTaskId = null;

    ToastService.show('Task removed.', 'info', 5000, {
      label: 'Undo',
      callback: () => {
        Repository.save(deletedTask, deletedIndex);
      }
    });
  };

  const settings = SettingsStore.load();
  if (settings.confirmDelete) {
    DialogService.confirm({
      title: 'Delete Task',
      message: `Are you sure you want to delete "${deletedTask.title || 'Untitled'}"?`,
      confirmText: 'Delete',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) performDelete();
    });
  } else {
    performDelete();
  }
}

function parkTask(taskId) {
  Repository.move(taskId, 'parking-lot');
  if (selectedTaskId === taskId) setSelectedTaskId(null);
  ToastService.show('Parked.', 'success');
}

function archiveTask(taskId) {
  const task = Repository.get(taskId);
  if (!task) return;

  const performArchive = () => {
    Repository.move(taskId, 'archive');
    if (selectedTaskId === taskId) setSelectedTaskId(null);
    ToastService.show('Archived.', 'success');
  };

  const settings = SettingsStore.load();
  if (settings.confirmArchive) {
    DialogService.confirm({
      title: 'Archive Task',
      message: `Are you sure you want to archive "${task.title || 'Untitled'}"?`,
      confirmText: 'Archive',
      variant: 'primary'
    }).then(confirmed => {
      if (confirmed) performArchive();
    });
  } else {
    performArchive();
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

  const active = tasks.filter(t => t.status === 'active');
  let filteredActive = filterAreaId ? active.filter(t => t.areaId === filterAreaId) : active;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredActive = filteredActive.filter(t => (t.title || '').toLowerCase().includes(q));
  }

  // Global Keys (when not typing)
  if (event.key.toLowerCase() === 'a') {
    if (selectedTaskId) {
      event.preventDefault();
      archiveTask(selectedTaskId);
    } else {
      if (active.length < 3) {
        event.preventDefault();
        isCreating = true;
        setSelectedTaskId(null);
        renderView();
      } else {
        ToastService.show("Focus is full. Complete a task first.", "info");
      }
    }
    return;
  }

  // Clear workspace (R key on completed view)
  if (event.key.toLowerCase() === 'r') {
    if (active.length === 0 && tasks.length > 0) {
      event.preventDefault();
      Repository.clearModule('focus');
      isCreating = false;
      ToastService.show('Focus cleared.', 'info');
    }
    return;
  }

  if (!selectedTaskId || editingTaskId) {
    // If no task selected, pressing ArrowDown selects first active task
    if (event.key === 'ArrowDown' && filteredActive.length > 0) {
      event.preventDefault();
      setSelectedTaskId(filteredActive[0].id);
      renderView();
    }
    return;
  }

  const idx = filteredActive.findIndex(t => t.id === selectedTaskId);
  if (idx === -1) return;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      if (idx < filteredActive.length - 1) {
        setSelectedTaskId(filteredActive[idx + 1].id);
        renderView();
      }
      break;
    case 'ArrowUp':
      event.preventDefault();
      if (idx > 0) {
        setSelectedTaskId(filteredActive[idx - 1].id);
        renderView();
      } else {
        setSelectedTaskId(null);
        renderView();
      }
      break;
    case 'Enter':
    case 'e':
    case 'E':
      event.preventDefault();
      startEditing(selectedTaskId);
      break;
    case 'Escape':
      event.preventDefault();
      setSelectedTaskId(null);
      renderView();
      break;
    case ' ':
      event.preventDefault();
      toggleCompletion(selectedTaskId);
      break;
    case 'Delete':
    case 'Backspace':
    case 'd':
    case 'D':
    case 'x':
    case 'X':
      event.preventDefault();
      deleteTask(selectedTaskId);
      break;
    case 'p':
    case 'P':
      event.preventDefault();
      parkTask(selectedTaskId);
      break;
  }
}




