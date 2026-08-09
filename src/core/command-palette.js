import { navigateTo } from './view-manager.js';
import { Repository } from './repository.js';
import { CommandRegistry } from './command-registry.js';
import { ToastService } from '../ui/toast.js';
import { DialogService } from '../ui/dialog.js';
import { createModal } from '../ui/modal.js';
import { SettingsStore } from './settings-store.js';

// Icons
const TARGET_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`;
const INBOX_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`;
const LAYERS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>`;
const COFFEE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`;
const ARCHIVE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
const SETTINGS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
const JOT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /><path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" /><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>`;
const TRASH_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;
const CHECKBOX_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`;
const CHECKED_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;

// Register core default commands on initialization

const KEYBOARD_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" rx="2" x="2" y="6"/><path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/><path d="M6 16h.01"/><path d="M18 16h.01"/><path d="M10 16h4"/></svg>`;
const BOOK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`;
CommandRegistry.register({ id: 'show-shortcuts', label: 'Show Keyboard Shortcuts', category: 'Help', action: showShortcutsModal, icon: KEYBOARD_ICON });
CommandRegistry.register({ id: 'show-guide', label: 'Bench Guide', category: 'Help', action: showBenchGuide, icon: BOOK_ICON });

CommandRegistry.register({ id: 'action-start-fresh', label: 'Start fresh (Clear Completed Focus Tasks)', category: 'Actions', action: triggerStartFresh, icon: CHECKED_ICON });
CommandRegistry.register({ id: 'action-clear-workspace', label: 'Clear Workspace (Wipe Database)', category: 'Actions', action: triggerClearWorkspace, icon: TRASH_ICON });

// Internal state
let isOpen = false;
let backdropEl = null;
let selectedIndex = 0;
let visibleItems = [];

export const CommandPalette = {
  /**
   * Toggle opening and closing of the palette
   */
  toggle() {
    if (isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  /**
   * Open the command palette modal overlay
   */
  open() {
    if (isOpen) return;
    
    const portal = document.getElementById('overlay-portal');
    if (!portal) return;

    isOpen = true;
    selectedIndex = 0;

    // Create modal structures
    backdropEl = document.createElement('div');
    backdropEl.className = 'modal-backdrop';

    const palette = document.createElement('div');
    palette.className = 'command-palette';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'command-palette-input';
    input.placeholder = 'Search commands or focus tasks...';
    input.autocomplete = 'off';

    const results = document.createElement('div');
    results.className = 'command-palette-results';

    palette.appendChild(input);
    palette.appendChild(results);
    backdropEl.appendChild(palette);
    portal.appendChild(backdropEl);

    // Fade transitions
    requestAnimationFrame(() => {
      backdropEl.classList.add('fade-in');
      input.focus();
    });

    // Event Bindings
    input.addEventListener('input', (e) => handleSearchInput(e.target.value));
    input.addEventListener('keydown', handleKeyNavigation);
    backdropEl.addEventListener('click', (e) => {
      if (e.target === backdropEl) this.close();
    });

    // Initial draw
    updateResults('');
  },

  /**
   * Dismiss the command palette
   */
  close() {
    if (!isOpen || !backdropEl) return;

    backdropEl.classList.remove('fade-in');
    isOpen = false;

    setTimeout(() => {
      const portal = document.getElementById('overlay-portal');
      if (portal && portal.contains(backdropEl)) {
        portal.removeChild(backdropEl);
      }
      backdropEl = null;
    }, 150);
  }
};

/**
 * Filter items based on query.
 */
function updateResults(query) {
  const normalizedQuery = query.toLowerCase().trim();
  const allItems = Repository.getAll();
  const tasks = allItems.filter(item => item.type !== 'area');
  const areas = allItems.filter(item => item.type === 'area' && !item.archived);
  const registeredCommands = CommandRegistry.getAll();

  const filteredCommands = registeredCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(normalizedQuery)
  );

  const filteredAreas = areas.filter(area => 
    area.name.toLowerCase().includes(normalizedQuery) ||
    (area.description && area.description.toLowerCase().includes(normalizedQuery))
  );

  const filteredItems = tasks.filter(item => 
    item.title.toLowerCase().includes(normalizedQuery) ||
    (item.notes && item.notes.toLowerCase().includes(normalizedQuery))
  );

  // Rank title matches higher than note-only matches
  filteredItems.sort((a, b) => {
    const aTitleMatch = a.title.toLowerCase().includes(normalizedQuery);
    const bTitleMatch = b.title.toLowerCase().includes(normalizedQuery);
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    return 0;
  });

  visibleItems = [];

  // Group commands
  if (filteredCommands.length > 0) {
    visibleItems.push({ type: 'header', label: 'Commands' });
    filteredCommands.forEach(cmd => {
      visibleItems.push({ type: 'command', ...cmd });
    });
  }

  // Group Areas (appearing before Tasks)
  if (filteredAreas.length > 0) {
    visibleItems.push({ type: 'header', label: 'Areas' });
    filteredAreas.forEach(area => {
      visibleItems.push({
        type: 'area',
        label: area.name,
        icon: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-accent-blue)"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
        action: () => triggerSelectArea(area.id)
      });
    });
  }

  // Partition items
  const focusItems = filteredItems.filter(i => Repository.isFocusTask(i));
  const parkingItems = filteredItems.filter(i => i.module === 'parking-lot' && !i.focused && i.status === 'active');

  // Focus
  if (focusItems.length > 0) {
    visibleItems.push({ type: 'header', label: 'Focus Tasks' });
    focusItems.forEach(task => {
      visibleItems.push({
        type: 'task',
        label: task.title,
        icon: CHECKBOX_ICON,
        action: () => triggerSelectTask(task.id)
      });
    });
  }

  // Parking Lot
  if (parkingItems.length > 0) {
    visibleItems.push({ type: 'header', label: 'Parking Lot' });
    parkingItems.forEach(task => {
      visibleItems.push({
        type: 'task',
        label: task.title,
        icon: CHECKBOX_ICON,
        action: () => triggerSelectParked(task.id)
      });
    });
  }

  // Cap selection index
  const selectablesCount = visibleItems.filter(item => item.type !== 'header').length;
  if (selectedIndex >= selectablesCount) {
    selectedIndex = Math.max(0, selectablesCount - 1);
  }

  renderList();
}

/**
 * Render the filtered item rows in DOM.
 */
function renderList() {
  const resultsContainer = backdropEl.querySelector('.command-palette-results');
  resultsContainer.innerHTML = '';

  if (visibleItems.length === 0) {
    resultsContainer.innerHTML = `<div class="command-palette-empty">No results found</div>`;
    return;
  }

  let selectableIdx = 0;

  visibleItems.forEach((item) => {
    if (item.type === 'header') {
      const header = document.createElement('div');
      header.className = 'command-palette-group-title';
      header.textContent = item.label;
      resultsContainer.appendChild(header);
      return;
    }

    const row = document.createElement('div');
    row.className = 'command-palette-item';
    if (selectableIdx === selectedIndex) {
      row.classList.add('selected');
    }
    if (item.id === 'action-start-fresh') {
      row.classList.add('success');
    } else if (item.id === 'action-clear-workspace') {
      row.classList.add('danger');
    }

    row.innerHTML = `
      ${item.icon || ''}
      <span>${escapeHtml(item.label)}</span>
      ${item.shortcut ? `<span class="command-palette-item-shortcut">${item.shortcut}</span>` : ''}
    `;

    // Map selection index for pointer hover override
    const currentIdx = selectableIdx;
    row.addEventListener('mousemove', () => {
      if (selectedIndex !== currentIdx) {
        selectedIndex = currentIdx;
        const selected = resultsContainer.querySelector('.command-palette-item.selected');
        if (selected) selected.classList.remove('selected');
        row.classList.add('selected');
      }
    });

    row.addEventListener('click', () => {
      executeItem(item);
    });

    resultsContainer.appendChild(row);
    selectableIdx++;
  });

  const activeRow = resultsContainer.querySelector('.command-palette-item.selected');
  if (activeRow) {
    activeRow.scrollIntoView({ block: 'nearest' });
  }
}

/**
 * Update query on typing.
 */
function handleSearchInput(value) {
  updateResults(value);
}

/**
 * Handle Arrow Keys and Enter selection.
 */
function handleKeyNavigation(event) {
  const selectables = visibleItems.filter(item => item.type !== 'header');
  if (selectables.length === 0) {
    if (event.key === 'Escape') {
      event.preventDefault();
      CommandPalette.close();
    }
    return;
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault();
    selectedIndex = (selectedIndex + 1) % selectables.length;
    renderList();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    selectedIndex = (selectedIndex - 1 + selectables.length) % selectables.length;
    renderList();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    const item = selectables[selectedIndex];
    if (item) executeItem(item);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    CommandPalette.close();
  }
}

/**
 * Trigger the selected item's action.
 */
function executeItem(item) {
  CommandPalette.close();
  if (item.action) {
    item.action();
  }
}

/**
 * Action: Display the lightweight Keyboard Shortcuts modal overlay
 */
function showShortcutsModal() {
  const settings = SettingsStore.load();
  const isMac = settings.shortcutStyle === 'mac';

  const format = (win, mac) => {
    if (isMac) {
      return `<span style="color: var(--color-text-muted); font-weight: normal;">${win}</span> <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 4px;">/</span> <span>${mac}</span>`;
    } else {
      return `<span>${win}</span> <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 4px;">/</span> <span style="color: var(--color-text-muted); font-weight: normal;">${mac}</span>`;
    }
  };

  const content = `
    <div class="shortcuts-modal-container">
      <div class="shortcuts-group-title">Global</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">${format('Ctrl+K', '⌘K')}</td><td class="shortcuts-desc">Open Command Palette</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+N / C', '⌘N / C')}</td><td class="shortcuts-desc">Open Quick Capture</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+1', '⌥1')}</td><td class="shortcuts-desc">Go to Focus</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+2', '⌥2')}</td><td class="shortcuts-desc">Go to Capture</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+3', '⌥3')}</td><td class="shortcuts-desc">Go to Areas</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+4', '⌥4')}</td><td class="shortcuts-desc">Go to Parking Lot</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+5', '⌥5')}</td><td class="shortcuts-desc">Go to Archive</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+6', '⌥6')}</td><td class="shortcuts-desc">Go to Jot</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+7', '⌥7')}</td><td class="shortcuts-desc">Go to Settings</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+B', '⌘B')}</td><td class="shortcuts-desc">Toggle Sidebar</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Close active overlay / modal</td></tr>
      </table>
      
      <div class="shortcuts-group-title">List Navigation & Actions</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">Arrow Up / Down</td><td class="shortcuts-desc">Move selection</td></tr>
        <tr><td class="shortcuts-key">Enter / E</td><td class="shortcuts-desc">Edit selected item inline</td></tr>
        <tr><td class="shortcuts-key">Space</td><td class="shortcuts-desc">Toggle completion of selected item</td></tr>
        <tr><td class="shortcuts-key">F</td><td class="shortcuts-desc">Move selected item to Focus</td></tr>
        <tr><td class="shortcuts-key">P</td><td class="shortcuts-desc">Move selected item to Parking Lot</td></tr>
        <tr><td class="shortcuts-key">A</td><td class="shortcuts-desc">Move selected item to Archive</td></tr>
        <tr><td class="shortcuts-key">D / Delete</td><td class="shortcuts-desc">Delete selected item</td></tr>
        <tr><td class="shortcuts-key">R</td><td class="shortcuts-desc">Restore item (Archive) / Clear completed (Focus)</td></tr>
      </table>
      
      <div class="shortcuts-group-title">Inspector & Notes Editor</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">${format('Ctrl+L', '⌘L')}</td><td class="shortcuts-desc">Focus title field</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+Enter', '⌘Enter')}</td><td class="shortcuts-desc">Save changes & return focus to list</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+S', '⌘S')}</td><td class="shortcuts-desc">Force immediate save</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Blur editor first / close Inspector</td></tr>
        <tr><td class="shortcuts-key">Tab</td><td class="shortcuts-desc">Insert 2 spaces</td></tr>
      </table>
    </div>
  `;

  createModal({
    title: 'keyboard shortcuts',
    contentNode: content
  });
}

/**
 * Action: Display the Bench Guide overview modal
 */
function showBenchGuide() {
  const entry = (term, desc) =>
    `<div class="guide-entry"><span class="guide-term">${term}</span><span class="guide-desc">${desc}</span></div>`;

  const content = `
    <div class="shortcuts-modal-container">

      <div class="shortcuts-group-title">The Workflow</div>
      <p class="guide-intro">Bench follows one simple loop: capture everything, organise it into areas, pick your three tasks for today, and work through them.</p>
      <div class="guide-workflow">
        <span class="guide-step">Capture</span>
        <span class="guide-arrow">→</span>
        <span class="guide-step">Organise</span>
        <span class="guide-arrow">→</span>
        <span class="guide-step">Focus</span>
        <span class="guide-arrow">→</span>
        <span class="guide-step">Complete</span>
      </div>

      <div class="shortcuts-group-title">Concepts</div>
      ${entry('Capture', 'Your inbox. Dump any idea, task, or thought here the moment it appears. Don\'t judge it — just capture it.')}
      ${entry('Focus', 'Your today list. Hold at most 3 tasks at a time. When you finish one, pull the next from the Parking Lot.')}
      ${entry('Areas', 'Containers for related tasks (e.g. Work, Personal, Health). Use them to keep things organised and filterable.')}
      ${entry('Parking Lot', 'Tasks that matter but aren\'t urgent today. Promote them to Focus when you have capacity.')}
      ${entry('Archive', 'Completed or shelved tasks you want to keep for reference but no longer act on.')}
      ${entry('Jot', 'A distraction-free scratchpad for free-form notes, ideas, and thinking. Nothing here is a task.')}
      ${entry('Command Palette', 'Press Ctrl+K (or ⌘K) anywhere to search tasks, areas, and run actions without touching the mouse.')}

      <div class="shortcuts-group-title">Why only 3 Focus tasks?</div>
      <p class="guide-intro">Limiting Focus to three tasks forces you to choose what actually matters today. A shorter list means less indecision, less context switching, and more meaningful progress.</p>

    </div>
  `;

  createModal({
    title: 'bench guide',
    contentNode: content
  });
}

/**
 * Action: Clear workspace confirmed trigger
 */
function triggerClearWorkspace() {
  DialogService.confirm({
    title: 'Wipe Database',
    message: 'This will permanently delete all tasks in Focus. This action cannot be undone.',
    confirmText: 'Clear Database',
    cancelText: 'Cancel',
    variant: 'danger'
  }).then((confirmed) => {
    if (confirmed) {
      Repository.clearModule('focus');
      ToastService.show('Workspace database wiped successfully.', 'success');
      
      const activeContainer = document.getElementById('active-view');
      const activeTitle = document.getElementById('view-title');
      if (activeTitle && activeTitle.textContent === 'Focus' && activeContainer) {
        import('../modules/focus-view.js').then((module) => {
          module.renderFocusView(activeContainer);
        });
      }
    }
  });
}

/**
 * Action: Clear completed tasks trigger
 */
function triggerStartFresh() {
  const tasks = Repository.getFocusedTasks();
  const completed = tasks.filter(t => t.status === 'completed');

  if (completed.length === 0) {
    ToastService.show('No completed tasks to clear.', 'info');
    return;
  }

  completed.forEach(t => Repository.remove(t.id));
  ToastService.show(`Cleared ${completed.length} completed task${completed.length > 1 ? 's' : ''}.`, 'success');

  const activeContainer = document.getElementById('active-view');
  const activeTitle = document.getElementById('view-title');
  if (activeTitle && activeTitle.textContent === 'Focus' && activeContainer) {
    import('../modules/focus-view.js').then((module) => {
      module.renderFocusView(activeContainer);
    });
  }
}

/**
 * Action: Navigate and select a specific task
 */
function triggerSelectTask(taskId) {
  import('./view-manager.js').then((vm) => {
    vm.navigateTo('focus');
    import('../modules/focus-view.js').then((module) => {
      module.focusAndSelectTask(taskId);
    });
  });
}

function triggerSelectCapture(itemId) {
  import('./view-manager.js').then((vm) => {
    vm.navigateTo('capture');
    import('../modules/capture-view.js').then((module) => {
      module.focusAndSelectCaptureTask(itemId);
    });
  });
}

function triggerSelectParked(itemId) {
  import('./view-manager.js').then((vm) => {
    vm.navigateTo('parking-lot');
    import('../modules/parking-lot-view.js').then((module) => {
      module.focusAndSelectParkedTask(itemId);
    });
  });
}

function triggerSelectArchived(itemId) {
  import('./view-manager.js').then((vm) => {
    vm.navigateTo('archive');
    import('../modules/archive-view.js').then((module) => {
      module.focusAndSelectArchivedTask(itemId);
    });
  });
}

function triggerSelectArea(areaId) {
  import('./view-manager.js').then((vm) => {
    vm.navigateTo('areas');
    import('../modules/areas-view.js').then((module) => {
      module.focusAndSelectArea(areaId);
    });
  });
}

/**
 * XSS Helper.
 */
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
