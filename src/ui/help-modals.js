import { createModal } from './modal.js';
import { SettingsStore } from '../core/settings-store.js';
import { ModuleRegistry } from '../core/module-registry.js';

/**
 * Display the lightweight Keyboard Shortcuts modal overlay
 */
export function showShortcutsModal() {
  const settings = SettingsStore.load();
  const isMac = settings.shortcutStyle === 'mac';

  const format = (win, mac) => {
    if (isMac) {
      return `<span style="color: var(--color-text-muted); font-weight: normal;">${win}</span> <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 4px;">/</span> <span>${mac}</span>`;
    } else {
      return `<span>${win}</span> <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 4px;">/</span> <span style="color: var(--color-text-muted); font-weight: normal;">${mac}</span>`;
    }
  };

  const currentSettings = SettingsStore.load();
  const iconStyle = currentSettings.navigationIconStyle || 'bench-symbols';
  const getGraphic = (id) => ModuleRegistry.renderGraphic(id, iconStyle);

  const content = `
    <div class="shortcuts-modal-container">
      <div class="shortcuts-group-title">Global Navigation</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">${format('Ctrl+N / C', '⌘N / C')}</td><td class="shortcuts-desc">Open Quick Capture</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+1', '⌥1')}</td><td class="shortcuts-desc">Go to Focus (${getGraphic('focus')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+2', '⌥2')}</td><td class="shortcuts-desc">Go to Capture (${getGraphic('capture')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+3', '⌥3')}</td><td class="shortcuts-desc">Go to Areas (${getGraphic('areas')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+4', '⌥4')}</td><td class="shortcuts-desc">Go to Parking Lot (${getGraphic('parking-lot')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+5', '⌥5')}</td><td class="shortcuts-desc">Go to Archive (${getGraphic('archive')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+6', '⌥6')}</td><td class="shortcuts-desc">Go to Jot (${getGraphic('jot')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+7', '⌥7')}</td><td class="shortcuts-desc">Go to Log (${getGraphic('recap')})</td></tr>
        <tr><td class="shortcuts-key">${format('Alt+8', '⌥8')}</td><td class="shortcuts-desc">Go to Clips (${getGraphic('clips')})</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+J', '⌘J')}</td><td class="shortcuts-desc">Go to Settings</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+L', '⌘L')}</td><td class="shortcuts-desc">Toggle Sidebar</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Close active overlay / modal</td></tr>
      </table>
      
      <div class="shortcuts-group-title">Task List Navigation & Actions</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">Arrow Up / Down</td><td class="shortcuts-desc">Move selection</td></tr>
        <tr><td class="shortcuts-key">Enter / E</td><td class="shortcuts-desc">Edit selected item inline</td></tr>
        <tr><td class="shortcuts-key">Space</td><td class="shortcuts-desc">Toggle completion of selected item</td></tr>
        <tr><td class="shortcuts-key">F</td><td class="shortcuts-desc">Move selected item to Focus</td></tr>
        <tr><td class="shortcuts-key">P</td><td class="shortcuts-desc">Move selected item to Parking Lot</td></tr>
        <tr><td class="shortcuts-key">A</td><td class="shortcuts-desc">Move selected item to Archive</td></tr>
        <tr><td class="shortcuts-key">D / Delete</td><td class="shortcuts-desc">Delete selected item</td></tr>
        <tr><td class="shortcuts-key">R</td><td class="shortcuts-desc">Restore item (Archive)</td></tr>
      </table>

      <div class="shortcuts-group-title">Clips Navigation & Actions</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">N / C</td><td class="shortcuts-desc">Focus new clip creation input</td></tr>
        <tr><td class="shortcuts-key">/</td><td class="shortcuts-desc">Focus live search filter</td></tr>
        <tr><td class="shortcuts-key">j / k / Arrows</td><td class="shortcuts-desc">Navigate selection across clip cards</td></tr>
        <tr><td class="shortcuts-key">Enter / E</td><td class="shortcuts-desc">Edit selected clip inline</td></tr>
        <tr><td class="shortcuts-key">P</td><td class="shortcuts-desc">Toggle pin on selected clip</td></tr>
        <tr><td class="shortcuts-key">A</td><td class="shortcuts-desc">Archive or restore selected clip</td></tr>
        <tr><td class="shortcuts-key">D / Delete</td><td class="shortcuts-desc">Delete selected clip</td></tr>
        <tr><td class="shortcuts-key">${format('Ctrl+Enter', '⌘Enter')}</td><td class="shortcuts-desc">Save new clip or commit inline edits</td></tr>
        <tr><td class="shortcuts-key">Escape</td><td class="shortcuts-desc">Clear search / cancel edit / deselect</td></tr>
      </table>
      
      <div class="shortcuts-group-title">Inspector & Notes Editor</div>
      <table class="shortcuts-table">
        <tr><td class="shortcuts-key">${format('Ctrl+T', '⌘T')}</td><td class="shortcuts-desc">Focus title field</td></tr>
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
 * Display the dynamic, interactive Bench Guide modal
 */
export function showBenchGuide() {
  const currentSettings = SettingsStore.load();
  const iconStyle = currentSettings.navigationIconStyle || 'bench-symbols';
  const getGraphic = (id) => ModuleRegistry.renderGraphic(id, iconStyle);

  const entry = (term, desc) =>
    `<div class="guide-info-row"><span class="guide-info-label">${term}</span><span class="guide-info-val">${desc}</span></div>`;

  const tabs = [
    { id: 'overview', label: 'Overview', symbol: 'λ', shortcut: 'Intro' },
    { id: 'focus', label: 'Focus', symbol: getGraphic('focus'), shortcut: 'Alt+1' },
    { id: 'capture', label: 'Capture', symbol: getGraphic('capture'), shortcut: 'Alt+2' },
    { id: 'areas', label: 'Areas', symbol: getGraphic('areas'), shortcut: 'Alt+3' },
    { id: 'parking-lot', label: 'Parking Lot', symbol: getGraphic('parking-lot'), shortcut: 'Alt+4' },
    { id: 'archive', label: 'Archive', symbol: getGraphic('archive'), shortcut: 'Alt+5' },
    { id: 'jot', label: 'Jot', symbol: getGraphic('jot'), shortcut: 'Alt+6' },
    { id: 'recap', label: 'Log', symbol: getGraphic('recap'), shortcut: 'Alt+7' },
    { id: 'clips', label: 'Clips', symbol: getGraphic('clips'), shortcut: 'Alt+8' },
    { id: 'shortcuts', label: 'Shortcuts', symbol: '⌘', shortcut: 'Ctrl+J' }
  ];

  let activeTabId = 'overview';

  const container = document.createElement('div');
  container.className = 'guide-layout';

  // Left Sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'guide-sidebar';

  const sidebarList = document.createElement('div');
  sidebarList.className = 'guide-sidebar-list';
  sidebarList.setAttribute('role', 'tablist');

  const sidebarFooter = document.createElement('div');
  sidebarFooter.className = 'guide-sidebar-footer';
  sidebarFooter.innerHTML = `<span><kbd>↑</kbd> <kbd>↓</kbd> or <kbd>1-9</kbd></span>`;

  sidebar.appendChild(sidebarList);
  sidebar.appendChild(sidebarFooter);

  // Right Content Pane
  const contentPane = document.createElement('div');
  contentPane.className = 'guide-content-pane';

  function renderTabContent(tabId) {
    activeTabId = tabId;

    // Update active class on sidebar items
    sidebarList.querySelectorAll('.guide-sidebar-item').forEach(btn => {
      const isSelected = btn.getAttribute('data-tab') === tabId;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    switch (tabId) {
      case 'overview':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('focus')}</span>
              <h2 class="guide-detail-title">The Bench System</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Philosophy</span>
              <span class="guide-badge-constraint">DDD Architecture</span>
            </div>
          </div>
          <p class="guide-detail-intro">Bench is an opinionated, documentation-driven productivity workstation designed to eliminate decision fatigue, context switching, and cognitive overload.</p>
          
          <div class="guide-workflow-strip">
            <span class="guide-workflow-item">1. Capture</span>
            <span class="guide-workflow-arrow">→</span>
            <span class="guide-workflow-item">2. Organise</span>
            <span class="guide-workflow-arrow">→</span>
            <span class="guide-workflow-item">3. Focus</span>
            <span class="guide-workflow-arrow">→</span>
            <span class="guide-workflow-item">4. Complete</span>
            <span class="guide-workflow-arrow">→</span>
            <span class="guide-workflow-item">5. Log</span>
          </div>

          <div class="guide-cards-grid">
            ${entry('Single Source of Truth', 'All tasks, areas, scratchpads, and notes remain local-first with zero speculative abstractions or cloud dependencies.')}
            ${entry('Max 3 Focus Tasks', 'Bench enforces a hard limit of 3 today tasks to force deliberate prioritization over endless backlogs.')}
            ${entry('Max 5 Focus Projects', 'Areas limits active Focus Projects to 5 to prevent simultaneous overcommitment.')}
            ${entry('Keyboard-First', 'Every module, action, triage flow, and editor is fully accessible via fast terminal-style keybindings.')}
            ${entry('Clips vs. Tasks', 'Tasks represent actionable work with strict lifecycle tracking; Clips provide isolated, searchable reference material.')}
          </div>
        `;
        break;

      case 'focus':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('focus')}</span>
              <h2 class="guide-detail-title">Focus</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+1 / ⌥1</span>
              <span class="guide-badge-constraint">Max 3 Tasks</span>
            </div>
          </div>
          <p class="guide-detail-intro">Your active execution engine for today. Focus keeps you locked into your highest-priority items without distraction.</p>
          <div class="guide-cards-grid">
            ${entry('The 3-Task Rule', 'You can hold at most 3 tasks in Focus at any given moment. This deliberate constraint eliminates choice overload.')}
            ${entry('Triage Flow', 'When you finish a task, hit <kbd>Space</kbd> to complete it, then promote your next task from the Parking Lot with <kbd>F</kbd>.')}
            ${entry('Key Actions', '<kbd>Space</kbd> toggle done &bull; <kbd>P</kbd> send to Parking Lot &bull; <kbd>A</kbd> archive &bull; <kbd>E</kbd> edit &bull; <kbd>D</kbd> delete.')}
            ${entry('Start Fresh', 'Use Start Fresh to clear completed tasks and reset your focus board when planning a new working sprint.')}
          </div>
        `;
        break;

      case 'capture':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('capture')}</span>
              <h2 class="guide-detail-title">Capture</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+2 / ⌥2</span>
              <span class="guide-badge-constraint">Global Inbox</span>
            </div>
          </div>
          <p class="guide-detail-intro">Your zero-friction inbox. Offload thoughts, ideas, and incoming requests immediately so your mind remains clear.</p>
          <div class="guide-cards-grid">
            ${entry('Zero Friction', 'Dump thoughts instantly without worrying about categories, dates, or formatting during capture.')}
            ${entry('Triage Later', 'Review your Capture inbox regularly. Assign items to Areas, promote urgent ones directly to Focus (<kbd>F</kbd>), or park them (<kbd>P</kbd>).')}
            ${entry('Global Capture', 'Press <kbd>Ctrl+N</kbd> or <kbd>C</kbd> from anywhere across Bench to summon quick capture.')}
            ${entry('Inline Details', 'Hit <kbd>Ctrl+T</kbd> to edit titles or open the Inspector panel to add detailed markdown notes.')}
          </div>
        `;
        break;

      case 'areas':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('areas')}</span>
              <h2 class="guide-detail-title">Areas</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+3 / ⌥3</span>
              <span class="guide-badge-constraint">Max 5 Projects</span>
            </div>
          </div>
          <p class="guide-detail-intro">High-level containers representing ongoing spheres of responsibility (e.g. Engineering, Product, Personal, Health).</p>
          <div class="guide-cards-grid">
            ${entry('Focus Projects', 'Bench limits active Focus Projects to 5 to protect your cognitive bandwidth from sprawl.')}
            ${entry('Hierarchy', 'Nest sub-areas cleanly to represent structured systems, teams, or clients.')}
            ${entry('Visual Cues', 'Assign custom terminal icons and distinct accent color tints to quickly identify domains.')}
            ${entry('Isolation', 'Area task counts reflect only actionable tasks; reference clips remain isolated.')}
          </div>
        `;
        break;

      case 'parking-lot':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('parking-lot')}</span>
              <h2 class="guide-detail-title">Parking Lot</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+4 / ⌥4</span>
              <span class="guide-badge-constraint">Holding Queue</span>
            </div>
          </div>
          <p class="guide-detail-intro">The waiting pipeline for tasks that matter but are not scheduled for execution today.</p>
          <div class="guide-cards-grid">
            ${entry('Prevent Sprawl', 'Keep your active Focus list lean by parking valuable future tasks here.')}
            ${entry('Promotion', 'When a slot opens up in Focus, press <kbd>F</kbd> on a parked task to promote it.')}
            ${entry('Organization', 'Filter parked tasks by Area or sort by creation order to review candidate tasks during planning.')}
            ${entry('Key Actions', '<kbd>F</kbd> promote to Focus &bull; <kbd>A</kbd> send to Archive &bull; <kbd>D</kbd> delete.')}
          </div>
        `;
        break;

      case 'archive':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('archive')}</span>
              <h2 class="guide-detail-title">Archive</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+5 / ⌥5</span>
              <span class="guide-badge-constraint">Completed Vault</span>
            </div>
          </div>
          <p class="guide-detail-intro">The historical repository for completed and shelved tasks kept for permanent reference.</p>
          <div class="guide-cards-grid">
            ${entry('Searchable Record', 'Quickly look up past work, inspect completion dates, and review notes attached to finished tasks.')}
            ${entry('Restoration', 'Need to reactivate a task? Select it and press <kbd>R</kbd> or click Restore to return it to active workflow.')}
            ${entry('Area Filtering', 'Filter archived tasks by Area to inspect historic deliverables for specific projects.')}
          </div>
        `;
        break;

      case 'jot':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('jot')}</span>
              <h2 class="guide-detail-title">Jot</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+6 / ⌥6</span>
              <span class="guide-badge-constraint">Thinking Stream</span>
            </div>
          </div>
          <p class="guide-detail-intro">A distraction-free, unified scratchpad for continuous stream-of-consciousness writing, scratch notes, and drafting.</p>
          <div class="guide-cards-grid">
            ${entry('Three View Modes', '<kbd>Edit</kbd> raw monospace &bull; <kbd>Preview</kbd> rendered Markdown &bull; <kbd>Split</kbd> side-by-side editing.')}
            ${entry('Markdown & Tooling', 'Supports headings, code blocks, smart lists, blockquotes, bold/italic, and horizontal dividers.')}
            ${entry('Typography Controls', 'Configurable fonts (JetBrains Mono, Fira Code, Inter, Lora), line heights, widths, and line numbering in Settings.')}
            ${entry('Instant Autosave', 'Never lose an idea. Changes persist automatically and save instantly to disk.')}
          </div>
        `;
        break;

      case 'recap':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('recap')}</span>
              <h2 class="guide-detail-title">Log</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+7 / ⌥7</span>
              <span class="guide-badge-constraint">Activity Journal</span>
            </div>
          </div>
          <p class="guide-detail-intro">A historical activity journal and reflection dashboard for tracking your completed tasks and productivity over time.</p>
          <div class="guide-cards-grid">
            ${entry('Calendar View', 'Interactive monthly grid displaying completed task volume per day, completion indicators, and an itemized breakdown of tasks finished on any selected date.')}
            ${entry('Journal View', 'Continuous chronological stream of completed tasks grouped by day for rapid vertical retrospective review.')}
            ${entry('Metrics & Streaks', 'Tracks total completed task counts and active streak days to maintain daily momentum.')}
            ${entry('Navigation', 'Jump to Log anytime with <kbd>Alt+7</kbd>. Navigate previous/next months with header arrow buttons or switch views via header tabs.')}
          </div>
        `;
        break;

      case 'clips':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">${getGraphic('clips')}</span>
              <h2 class="guide-detail-title">Clips</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Alt+8 / ⌥8</span>
              <span class="guide-badge-constraint">Card Scratchpad</span>
            </div>
          </div>
          <p class="guide-detail-intro">A modular, terminal-inspired card scratchpad for quick reference cards, code snippets, and checklists.</p>
          <div class="guide-cards-grid">
            ${entry('Dynamic Masonry', 'Cards dynamically adjust their height to fit content organically and pack tightly into multi-column masonry flow.')}
            ${entry('Collapsible Creation', 'Compact <kbd>+ Clip</kbd> bar expands into the full creation template when triggered via <kbd>N</kbd> or <kbd>C</kbd>.')}
            ${entry('15-Color Palette', 'Customize any note with 15 terminal-aesthetic color tints directly from card menus.')}
            ${entry('Tags & Areas', 'Tag notes with <kbd>#tags</kbd> and filter instantly by clicking tag chips. Optionally assign to Areas for domain grouping.')}
            ${entry('Key Shortcuts', '<kbd>N</kbd>/<kbd>C</kbd> create &bull; <kbd>/</kbd> live search &bull; <kbd>j</kbd>/<kbd>k</kbd> navigate &bull; <kbd>P</kbd> pin &bull; <kbd>A</kbd> archive &bull; <kbd>E</kbd> edit &bull; <kbd>D</kbd> delete.')}
          </div>
        `;
        break;

      case 'shortcuts':
        contentPane.innerHTML = `
          <div class="guide-detail-header">
            <div class="guide-detail-title-row">
              <span class="guide-detail-symbol">⌘</span>
              <h2 class="guide-detail-title">Shortcuts & Settings</h2>
            </div>
            <div class="guide-detail-badges">
              <span class="guide-badge-shortcut">Ctrl+J / ⌘J</span>
              <span class="guide-badge-constraint">Cheatsheet</span>
            </div>
          </div>
          <p class="guide-detail-intro">Bench is designed for complete keyboard navigation. Master these keybindings for maximum speed.</p>
          <div class="guide-cards-grid">
            ${entry('Global Navigation', '<kbd>Alt+1</kbd> Focus &bull; <kbd>Alt+2</kbd> Capture &bull; <kbd>Alt+3</kbd> Areas &bull; <kbd>Alt+4</kbd> Parking &bull; <kbd>Alt+5</kbd> Archive &bull; <kbd>Alt+6</kbd> Jot &bull; <kbd>Alt+7</kbd> Log &bull; <kbd>Alt+8</kbd> Clips &bull; <kbd>Ctrl+J</kbd> Settings &bull; <kbd>Ctrl+L</kbd> Sidebar.')}
            ${entry('Task Management', '<kbd>Space</kbd> Toggle complete &bull; <kbd>F</kbd> Move to Focus &bull; <kbd>P</kbd> Move to Parking &bull; <kbd>A</kbd> Archive &bull; <kbd>D</kbd> Delete &bull; <kbd>E</kbd>/<kbd>Enter</kbd> Edit &bull; <kbd>R</kbd> Restore.')}
            ${entry('Inspector & Notes', '<kbd>Ctrl+T</kbd> Focus title &bull; <kbd>Ctrl+Enter</kbd> Save & exit &bull; <kbd>Esc</kbd> Blur/dismiss.')}
            ${entry('Clips Navigation', '<kbd>N</kbd>/<kbd>C</kbd> Take clip &bull; <kbd>/</kbd> Live search &bull; <kbd>j</kbd>/<kbd>k</kbd> Card navigation &bull; <kbd>P</kbd> Pin &bull; <kbd>A</kbd> Archive &bull; <kbd>D</kbd> Delete.')}
          </div>
        `;
        break;
    }
  }

  // Create Sidebar Items
  tabs.forEach(t => {
    const btn = document.createElement('button');
    btn.className = `guide-sidebar-item ${t.id === activeTabId ? 'active' : ''}`;
    btn.setAttribute('data-tab', t.id);
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', t.id === activeTabId ? 'true' : 'false');
    btn.innerHTML = `
      <div class="guide-item-left">
        <span class="guide-item-symbol">${t.symbol}</span>
        <span class="guide-item-label">${t.label}</span>
      </div>
      <span class="guide-item-shortcut">${t.shortcut}</span>
    `;
    btn.addEventListener('click', () => {
      renderTabContent(t.id);
    });
    sidebarList.appendChild(btn);
  });

  container.appendChild(sidebar);
  container.appendChild(contentPane);

  renderTabContent(activeTabId);

  // Keyboard navigation within the guide (Arrow Up/Down or Number keys 1-9)
  const handleGuideKeydown = (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (currentIndex + 1) % tabs.length;
      renderTabContent(tabs[nextIndex].id);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const currentIndex = tabs.findIndex(t => t.id === activeTabId);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      renderTabContent(tabs[prevIndex].id);
    } else if (/^[1-9]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx < tabs.length) {
        e.preventDefault();
        renderTabContent(tabs[idx].id);
      }
    }
  };

  window.addEventListener('keydown', handleGuideKeydown);

  createModal({
    title: 'bench guide',
    contentNode: container,
    customClass: 'guide-modal-frame',
    onClose: () => {
      window.removeEventListener('keydown', handleGuideKeydown);
    }
  });
}
