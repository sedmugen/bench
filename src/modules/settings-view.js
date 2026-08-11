import { SettingsStore } from '../core/settings-store.js';
import { Repository } from '../core/repository.js';
import { DialogService } from '../ui/dialog.js';
import { ToastService } from '../ui/toast.js';
import { JotStore } from '../core/jot-store.js';

let currentCategory = 'general';

export function renderSettingsView(container) {
  const settings = SettingsStore.load();
  const activeAreas = Repository.getActiveAreas();
  const areaOptions = activeAreas.map(area => 
    `<option value="${area.id}" ${settings.defaultArea === area.id ? 'selected' : ''}>${area.name}</option>`
  ).join('');

  const backup = localStorage.getItem('bench_local_backup');
  let backupTimeText = '';
  if (backup) {
    try {
      const parsed = JSON.parse(backup);
      if (parsed && parsed.timestamp) {
        const timeStr = new Date(parsed.timestamp).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        backupTimeText = `(backup: ${timeStr})`;
      }
    } catch (e) {}
  }

  const categories = [
    { id: 'general', label: 'General' },
    { id: 'productivity', label: 'Productivity' },
    { id: 'editor', label: 'Editor' },
    { id: 'data', label: 'Data' },
    { id: 'about', label: 'About' },
    { id: 'danger', label: 'Danger Zone', isDanger: true }
  ];

  const primaryNavHtml = categories.map(cat => `
    <button type="button" 
            class="settings-nav-item ${cat.isDanger ? 'nav-danger' : ''} ${cat.id === currentCategory ? 'active' : ''}" 
            data-category="${cat.id}"
            role="tab"
            aria-selected="${cat.id === currentCategory ? 'true' : 'false'}">
      <span class="settings-nav-indicator">${cat.id === currentCategory ? '&gt;' : ''}</span>
      <span class="settings-nav-label">${cat.label}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="settings-two-pane-container">
      
      <!-- Left Pane: Category Navigation Index -->
      <aside class="settings-nav-pane" aria-label="Settings categories">
        <div class="settings-nav-group">
          ${primaryNavHtml}
        </div>
      </aside>

      <!-- Right Pane: Active Category Content -->
      <main class="settings-content-pane">
        
        <!-- General Category -->
        <div class="settings-category-panel" data-category="general" style="display: ${currentCategory === 'general' ? 'block' : 'none'};">
          <h2 class="settings-category-title">General</h2>
          <div class="settings-list-group">
            
            <div class="settings-subheader">Appearance</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Theme</span>
                <select id="settings-theme" class="settings-select">
                  <option value="system" ${settings.theme === 'system' ? 'selected' : ''}>System</option>
                  <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                  <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Accent color</span>
                <select id="settings-accent" class="settings-select">
                  <option value="blue"    ${settings.accentColor === 'blue'     ? 'selected' : ''}>Blue</option>
                  <option value="cyan"    ${settings.accentColor === 'cyan'     ? 'selected' : ''}>Cyan</option>
                  <option value="frost"   ${settings.accentColor === 'frost'    ? 'selected' : ''}>Frost</option>
                  <option value="teal"    ${settings.accentColor === 'teal'     ? 'selected' : ''}>Teal</option>
                  <option value="lavender" ${settings.accentColor === 'lavender' ? 'selected' : ''}>Lavender</option>
                  <option value="purple"  ${settings.accentColor === 'purple'   ? 'selected' : ''}>Purple</option>
                  <option value="iris"    ${settings.accentColor === 'iris'     ? 'selected' : ''}>Iris</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Font size</span>
                <select id="settings-font-size" class="settings-select">
                  <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                  <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                  <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Compact mode</span>
                <input type="checkbox" id="settings-compact" class="bench-checkbox" ${settings.compactMode ? 'checked' : ''}>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Reduce animations</span>
                  <div class="settings-row-desc">Disable smooth transitions for a faster TUI feel.</div>
                </div>
                <input type="checkbox" id="settings-reduce-animations" class="bench-checkbox" ${settings.reduceAnimations ? 'checked' : ''}>
              </div>
            </div>

            <div class="settings-subheader">Navigation</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Navigation icon style</span>
                  <div class="settings-row-desc">Choose between Bench Greek symbols and classic icons.</div>
                </div>
                <select id="settings-navigation-icon-style" class="settings-select">
                  <option value="bench-symbols" ${settings.navigationIconStyle !== 'classic-icons' ? 'selected' : ''}>Bench Symbols</option>
                  <option value="classic-icons" ${settings.navigationIconStyle === 'classic-icons' ? 'selected' : ''}>Classic Icons</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Startup module</span>
                <select id="settings-startup-module" class="settings-select" ${settings.rememberLastModule ? 'disabled' : ''}>
                  <option value="focus" ${settings.startupModule === 'focus' ? 'selected' : ''}>Focus</option>
                  <option value="capture" ${settings.startupModule === 'capture' ? 'selected' : ''}>Capture</option>
                  <option value="areas" ${settings.startupModule === 'areas' ? 'selected' : ''}>Areas</option>
                  <option value="parking-lot" ${settings.startupModule === 'parking-lot' ? 'selected' : ''}>Parking Lot</option>
                  <option value="archive" ${settings.startupModule === 'archive' ? 'selected' : ''}>Archive</option>
                  <option value="jot" ${settings.startupModule === 'jot' ? 'selected' : ''}>Jot</option>
                  <option value="recap" ${settings.startupModule === 'recap' ? 'selected' : ''}>Log</option>
                  <option value="settings" ${settings.startupModule === 'settings' ? 'selected' : ''}>Settings</option>
                </select>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Remember last module</span>
                  <div class="settings-row-desc">Overrides startup module to open the view you were last on.</div>
                </div>
                <input type="checkbox" id="settings-remember-last-module" class="bench-checkbox" ${settings.rememberLastModule ? 'checked' : ''}>
              </div>

              <div class="settings-item">
                <span class="settings-label">Shortcut style</span>
                <select id="settings-shortcut-style" class="settings-select">
                  <option value="windows" ${settings.shortcutStyle === 'windows' ? 'selected' : ''}>Windows</option>
                  <option value="mac" ${settings.shortcutStyle === 'mac' ? 'selected' : ''}>macOS</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Show sidebar shortcuts</span>
                <input type="checkbox" id="settings-show-sidebar-shortcuts" class="bench-checkbox" ${settings.showSidebarShortcuts !== false ? 'checked' : ''}>
              </div>
            </div>

            <div class="settings-subheader">Behavior & Confirmations</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Confirm delete</span>
                <input type="checkbox" id="settings-confirm-delete" class="bench-checkbox" ${settings.confirmDelete ? 'checked' : ''}>
              </div>

              <div class="settings-item">
                <span class="settings-label">Confirm archive</span>
                <input type="checkbox" id="settings-confirm-archive" class="bench-checkbox" ${settings.confirmArchive ? 'checked' : ''}>
              </div>
            </div>

          </div>
        </div>

        <!-- Productivity Category -->
        <div class="settings-category-panel" data-category="productivity" style="display: ${currentCategory === 'productivity' ? 'block' : 'none'};">
          <h2 class="settings-category-title">Productivity</h2>
          <div class="settings-list-group">
            
            <div class="settings-subheader">Focus</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Max focus tasks</span>
                <span class="settings-value">3 (Strict Limit)</span>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Auto-clear completed</span>
                  <div class="settings-row-desc">Automatically clear completed tasks from Focus on view load.</div>
                </div>
                <input type="checkbox" id="settings-auto-clear-completed" class="bench-checkbox" ${settings.autoClearCompleted ? 'checked' : ''}>
              </div>
            </div>

            <div class="settings-subheader">Areas</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Enable status tints</span>
                  <div class="settings-row-desc">Color-code task rows in Areas based on their status.</div>
                </div>
                <input type="checkbox" id="settings-enable-area-status-tints" class="bench-checkbox" ${settings.enableAreaTaskStatusTints !== false ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Confirm archive</span>
                <input type="checkbox" id="settings-confirm-archive-area" class="bench-checkbox" ${settings.confirmArchiveArea ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Default area</span>
                <select id="settings-default-area" class="settings-select">
                  <option value="none" ${settings.defaultArea === 'none' ? 'selected' : ''}>None</option>
                  ${areaOptions}
                </select>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Clip long task titles</span>
                  <div class="settings-row-desc">Truncate task titles with ellipses instead of wrapping.</div>
                </div>
                <input type="checkbox" id="settings-clip-task-titles" class="bench-checkbox" ${settings.clipTaskTitles !== false ? 'checked' : ''}>
              </div>
            </div>

            <div class="settings-subheader">Log</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Default view mode</span>
                <select id="settings-log-default-view-mode" class="settings-select">
                  <option value="calendar" ${settings.logDefaultViewMode === 'calendar' || !settings.logDefaultViewMode ? 'selected' : ''}>Calendar</option>
                  <option value="journal" ${settings.logDefaultViewMode === 'journal' ? 'selected' : ''}>Journal</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        <!-- Editor Category -->
        <div class="settings-category-panel" data-category="editor" style="display: ${currentCategory === 'editor' ? 'block' : 'none'};">
          <h2 class="settings-category-title">Editor</h2>
          <div class="settings-list-group">

            <div class="settings-subheader">Jot</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Font family</span>
                <select id="settings-jot-font-family" class="settings-select">
                  <option value="monospace" ${settings.jotFontFamily === 'monospace' ? 'selected' : ''}>Monospace</option>
                  <option value="sans-serif" ${settings.jotFontFamily === 'sans-serif' ? 'selected' : ''}>Sans-serif</option>
                  <option value="serif" ${settings.jotFontFamily === 'serif' ? 'selected' : ''}>Serif</option>
                </select>
              </div>
              <div class="settings-item">
                <span class="settings-label">Tab size</span>
                <select id="settings-jot-tab-size" class="settings-select">
                  <option value="tab" ${settings.jotTabSize === 'tab' ? 'selected' : ''}>Tab Character</option>
                  <option value="2" ${settings.jotTabSize === '2' ? 'selected' : ''}>2 Spaces</option>
                  <option value="4" ${settings.jotTabSize === '4' ? 'selected' : ''}>4 Spaces</option>
                </select>
              </div>
              <div class="settings-item">
                <span class="settings-label">Auto-save</span>
                <input type="checkbox" id="settings-jot-auto-save" class="bench-checkbox" ${settings.jotAutoSave ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Show line numbers</span>
                <input type="checkbox" id="settings-jot-show-line-numbers" class="bench-checkbox" ${settings.jotShowLineNumbers ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Default view mode</span>
                <select id="settings-jot-default-view-mode" class="settings-select">
                  <option value="edit" ${settings.jotDefaultViewMode === 'edit' || !settings.jotDefaultViewMode ? 'selected' : ''}>Edit</option>
                  <option value="preview" ${settings.jotDefaultViewMode === 'preview' ? 'selected' : ''}>Preview</option>
                  <option value="split" ${settings.jotDefaultViewMode === 'split' ? 'selected' : ''}>Split</option>
                </select>
              </div>
              <div class="settings-item">
                <span class="settings-label">Enable text formatting</span>
                <input type="checkbox" id="settings-enable-jot-formatting" class="bench-checkbox" ${settings.enableJotFormatting !== false ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Enable Markdown preview</span>
                <input type="checkbox" id="settings-enable-jot-markdown" class="bench-checkbox" ${settings.enableJotMarkdown !== false ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Show formatting toolbar</span>
                <input type="checkbox" id="settings-jot-show-formatting-toolbar" class="bench-checkbox" ${settings.jotShowFormattingToolbar !== false ? 'checked' : ''}>
              </div>
            </div>
            
          </div>
        </div>

        <!-- Data Category -->
        <div class="settings-category-panel" data-category="data" style="display: ${currentCategory === 'data' ? 'block' : 'none'};">
          <h2 class="settings-category-title">Data Management</h2>
          <div class="settings-list">
            <div class="settings-item">
              <div class="settings-label-group">
                <span class="settings-label">Import JSON</span>
                <div class="settings-row-desc">Import tasks, projects, areas, settings, and jots from file.</div>
              </div>
              <button id="settings-data-import" class="settings-btn">import JSON</button>
            </div>
            <div class="settings-item">
              <div class="settings-label-group">
                <span class="settings-label">Export JSON</span>
                <div class="settings-row-desc">Export full local backup as a single JSON file. Prompts for destination folder.</div>
                <div id="settings-export-location-desc" class="settings-row-desc" style="margin-top: 2px; color: var(--color-accent-blue); font-size: var(--font-size-xs);">
                  ${settings.lastExportLocation ? `Last saved to: ${escapeHtml(settings.lastExportLocation)}` : 'Location: Prompts for save destination on export.'}
                </div>
              </div>
              <button id="settings-data-export" class="settings-btn">export JSON</button>
            </div>
            <div class="settings-item">
              <div class="settings-label-group">
                <span class="settings-label">Local Backup</span>
                <div class="settings-row-desc">Save a local snapshot to browser storage.</div>
              </div>
              <button id="settings-data-backup" class="settings-btn">create backup</button>
            </div>
            <div class="settings-item">
              <div class="settings-label-group">
                <span class="settings-label">Restore Snapshot <span id="settings-data-restore-details" style="font-weight: normal; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-left: var(--space-xs);">${backupTimeText}</span></span>
                <div class="settings-row-desc">Restore state from your latest browser snapshot.</div>
              </div>
              <button id="settings-data-restore" class="settings-btn">restore</button>
            </div>
          </div>
        </div>

        <!-- About Category -->
        <div class="settings-category-panel" data-category="about" style="display: ${currentCategory === 'about' ? 'block' : 'none'};">
          <h2 class="settings-category-title">About Bench</h2>
          <div class="settings-list">
            <div class="settings-item">
              <span class="settings-label">Version</span>
              <span class="settings-value">0.2.0</span>
            </div>
            <div class="settings-item">
              <span class="settings-label">Changelog</span>
              <span class="settings-value">v0.2.1</span>
            </div>
            <div class="settings-item">
              <span class="settings-label">Credits</span>
              <span class="settings-value">Saad M.</span>
            </div>
          </div>
        </div>

        <!-- Danger Zone Category -->
        <div class="settings-category-panel" data-category="danger" style="display: ${currentCategory === 'danger' ? 'block' : 'none'};">
          <div class="settings-danger-zone-container">
            <h2 class="settings-category-title danger-title">Danger Zone</h2>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Clear Archive</span>
                  <div class="settings-row-desc">Permanently delete archived tasks, projects, and areas.</div>
                </div>
                <button id="settings-danger-clear-archive" class="settings-btn btn-danger">clear archive</button>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Clear Database</span>
                  <div class="settings-row-desc">Permanently wipe all tasks, projects, areas, and settings.</div>
                </div>
                <button id="settings-danger-clear-database" class="settings-btn btn-danger">wipe database</button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  `;

  // Bind Left Pane Category Navigation Items
  const navItems = container.querySelectorAll('.settings-nav-item');
  
  function switchCategory(catId) {
    currentCategory = catId;
    navItems.forEach(item => {
      const isTarget = item.getAttribute('data-category') === catId;
      item.classList.toggle('active', isTarget);
      item.setAttribute('aria-selected', isTarget ? 'true' : 'false');
      const indicator = item.querySelector('.settings-nav-indicator');
      if (indicator) {
        indicator.innerHTML = isTarget ? '&gt;' : '';
      }
    });

    const panels = container.querySelectorAll('.settings-category-panel');
    panels.forEach(panel => {
      const isTarget = panel.getAttribute('data-category') === catId;
      panel.style.display = isTarget ? 'block' : 'none';
    });
  }

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const catId = item.getAttribute('data-category');
      switchCategory(catId);
    });
  });

  // Keyboard navigation on left category nav pane (ArrowUp / ArrowDown)
  const navPane = container.querySelector('.settings-nav-pane');
  if (navPane) {
    navPane.addEventListener('keydown', (e) => {
      const itemList = Array.from(navItems);
      const activeIdx = itemList.findIndex(item => item.getAttribute('data-category') === currentCategory);
      if (activeIdx === -1) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = (activeIdx + 1) % itemList.length;
        itemList[nextIdx].focus();
        switchCategory(itemList[nextIdx].getAttribute('data-category'));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIdx = (activeIdx - 1 + itemList.length) % itemList.length;
        itemList[prevIdx].focus();
        switchCategory(itemList[prevIdx].getAttribute('data-category'));
      }
    });
  }

  // Bind change events to save configuration state
  const themeSelect = container.querySelector('#settings-theme');
  const accentSelect = container.querySelector('#settings-accent');
  const compactCheck = container.querySelector('#settings-compact');
  const fontSizeSelect = container.querySelector('#settings-font-size');
  const reduceAnimCheck = container.querySelector('#settings-reduce-animations');
  const clipTaskTitlesCheck = container.querySelector('#settings-clip-task-titles');
  const navIconStyleSelect = container.querySelector('#settings-navigation-icon-style');

  const confirmDeleteCheck = container.querySelector('#settings-confirm-delete');
  const confirmArchiveCheck = container.querySelector('#settings-confirm-archive');
  const startupModuleSelect = container.querySelector('#settings-startup-module');
  const rememberLastModuleCheck = container.querySelector('#settings-remember-last-module');
  const shortcutStyleSelect = container.querySelector('#settings-shortcut-style');
  const showSidebarShortcutsCheck = container.querySelector('#settings-show-sidebar-shortcuts');
  const autoClearCompletedCheck = container.querySelector('#settings-auto-clear-completed');
  const enableAreaStatusTintsCheck = container.querySelector('#settings-enable-area-status-tints');
  const confirmArchiveAreaCheck = container.querySelector('#settings-confirm-archive-area');
  const defaultAreaSelect = container.querySelector('#settings-default-area');
  const logDefaultViewModeSelect = container.querySelector('#settings-log-default-view-mode');
  const jotFontFamilySelect = container.querySelector('#settings-jot-font-family');
  const jotTabSizeSelect = container.querySelector('#settings-jot-tab-size');
  const jotAutoSaveCheck = container.querySelector('#settings-jot-auto-save');
  const jotShowLineNumbersCheck = container.querySelector('#settings-jot-show-line-numbers');
  const jotDefaultViewModeSelect = container.querySelector('#settings-jot-default-view-mode');
  const enableJotFormattingCheck = container.querySelector('#settings-enable-jot-formatting');
  const enableJotMarkdownCheck = container.querySelector('#settings-enable-jot-markdown');
  const jotShowFormattingToolbarCheck = container.querySelector('#settings-jot-show-formatting-toolbar');

  function updateSettings() {
    const nextSettings = {
      theme: themeSelect.value,
      accentColor: accentSelect.value,
      compactMode: compactCheck.checked,
      fontSize: fontSizeSelect.value,
      reduceAnimations: reduceAnimCheck.checked,
      clipTaskTitles: clipTaskTitlesCheck.checked,
      navigationIconStyle: navIconStyleSelect.value,

      confirmDelete: confirmDeleteCheck.checked,
      confirmArchive: confirmArchiveCheck.checked,
      startupModule: startupModuleSelect.value,
      rememberLastModule: rememberLastModuleCheck.checked,
      shortcutStyle: shortcutStyleSelect.value,
      lastOpenedModule: settings.lastOpenedModule,
      showSidebarShortcuts: showSidebarShortcutsCheck.checked,
      
      autoClearCompleted: autoClearCompletedCheck.checked,
      enableAreaTaskStatusTints: enableAreaStatusTintsCheck.checked,
      confirmArchiveArea: confirmArchiveAreaCheck.checked,
      defaultArea: defaultAreaSelect.value,
      logDefaultViewMode: logDefaultViewModeSelect ? logDefaultViewModeSelect.value : 'calendar',
      jotFontFamily: jotFontFamilySelect.value,
      jotTabSize: jotTabSizeSelect.value,
      jotAutoSave: jotAutoSaveCheck.checked,
      jotShowLineNumbers: jotShowLineNumbersCheck.checked,
      jotDefaultViewMode: jotDefaultViewModeSelect.value,
      enableJotFormatting: enableJotFormattingCheck.checked,
      enableJotMarkdown: enableJotMarkdownCheck.checked,
      jotShowFormattingToolbar: jotShowFormattingToolbarCheck.checked
    };

    startupModuleSelect.disabled = rememberLastModuleCheck.checked;
    SettingsStore.save(nextSettings);
  }

  themeSelect.addEventListener('change', updateSettings);
  accentSelect.addEventListener('change', updateSettings);
  compactCheck.addEventListener('change', updateSettings);
  fontSizeSelect.addEventListener('change', updateSettings);
  reduceAnimCheck.addEventListener('change', updateSettings);
  clipTaskTitlesCheck.addEventListener('change', updateSettings);
  navIconStyleSelect.addEventListener('change', updateSettings);

  confirmDeleteCheck.addEventListener('change', updateSettings);
  confirmArchiveCheck.addEventListener('change', updateSettings);
  startupModuleSelect.addEventListener('change', updateSettings);
  rememberLastModuleCheck.addEventListener('change', updateSettings);
  shortcutStyleSelect.addEventListener('change', updateSettings);
  showSidebarShortcutsCheck.addEventListener('change', updateSettings);
  autoClearCompletedCheck.addEventListener('change', updateSettings);
  enableAreaStatusTintsCheck.addEventListener('change', updateSettings);
  confirmArchiveAreaCheck.addEventListener('change', updateSettings);
  defaultAreaSelect.addEventListener('change', updateSettings);
  if (logDefaultViewModeSelect) logDefaultViewModeSelect.addEventListener('change', updateSettings);
  jotFontFamilySelect.addEventListener('change', updateSettings);
  jotTabSizeSelect.addEventListener('change', updateSettings);
  jotAutoSaveCheck.addEventListener('change', updateSettings);
  jotShowLineNumbersCheck.addEventListener('change', updateSettings);
  jotDefaultViewModeSelect.addEventListener('change', updateSettings);
  enableJotFormattingCheck.addEventListener('change', updateSettings);
  enableJotMarkdownCheck.addEventListener('change', updateSettings);
  jotShowFormattingToolbarCheck.addEventListener('change', updateSettings);

  // Data actions
  const importBtn = container.querySelector('#settings-data-import');
  const exportBtn = container.querySelector('#settings-data-export');
  const backupBtn = container.querySelector('#settings-data-backup');
  const restoreBtn = container.querySelector('#settings-data-restore');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const exportData = {
          version: '0.2.1',
          items: Repository.getAll(),
          settings: SettingsStore.load(),
          jot: JotStore.loadJot()
        };
        const jsonString = JSON.stringify(exportData, null, 2);
        const fileName = `bench_export_${new Date().toISOString().slice(0, 10)}.json`;

        let savedLocation = '';

        // 1. Tauri Native File Save Dialog if available
        if (window.__TAURI__ && window.__TAURI__.dialog && window.__TAURI__.dialog.save) {
          const filePath = await window.__TAURI__.dialog.save({
            defaultPath: fileName,
            filters: [{ name: 'JSON Files', extensions: ['json'] }]
          });
          if (!filePath) return; // User cancelled
          if (window.__TAURI__.fs && window.__TAURI__.fs.writeTextFile) {
            await window.__TAURI__.fs.writeTextFile(filePath, jsonString);
          }
          savedLocation = filePath;
        }
        // 2. Modern Web File System Access API (opens native Save As dialog)
        else if (typeof window.showSaveFilePicker === 'function') {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [{
              description: 'JSON Backup File',
              accept: { 'application/json': ['.json'] }
            }]
          });
          const writable = await handle.createWritable();
          await writable.write(jsonString);
          await writable.close();
          savedLocation = handle.name ? `Chosen folder (${handle.name})` : fileName;
        }
        // 3. Browser Download Fallback
        else {
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          savedLocation = `Downloads folder (${fileName})`;
        }

        if (savedLocation) {
          const currentSettings = SettingsStore.load();
          currentSettings.lastExportLocation = savedLocation;
          SettingsStore.save(currentSettings);

          const descEl = container.querySelector('#settings-export-location-desc');
          if (descEl) {
            descEl.textContent = `Last saved to: ${savedLocation}`;
          }

          ToastService.show('Data exported successfully.', 'success');
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          // User closed/cancelled save file picker dialog
          return;
        }
        console.error(err);
        ToastService.show('Failed to export data.', 'error');
      }
    });
  }

  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (!imported || !Array.isArray(imported.items)) {
              ToastService.show('Invalid file format. Missing items.', 'error');
              return;
            }
            DialogService.confirm({
              title: 'Import Data',
              message: 'Importing will completely overwrite all your current tasks, projects, areas, settings, and jots. Are you sure you want to proceed?',
              confirmText: 'Import',
              cancelText: 'Cancel',
              variant: 'danger'
            }).then((confirmed) => {
              if (confirmed) {
                localStorage.setItem('bench_items', JSON.stringify(imported.items));
                if (imported.settings) {
                  SettingsStore.save(imported.settings);
                }
                if (imported.jot !== undefined) {
                  localStorage.setItem('bench_jot', imported.jot);
                }
                ToastService.show('Data imported successfully.', 'success');
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }
            });
          } catch (err) {
            ToastService.show('Failed to parse JSON file.', 'error');
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  if (backupBtn) {
    backupBtn.addEventListener('click', () => {
      try {
        const backupData = {
          timestamp: Date.now(),
          items: Repository.getAll(),
          settings: SettingsStore.load(),
          jot: JotStore.loadJot()
        };
        localStorage.setItem('bench_local_backup', JSON.stringify(backupData));
        ToastService.show('Local backup created successfully.', 'success');
        
        const restoreDetails = container.querySelector('#settings-data-restore-details');
        if (restoreDetails) {
          const timeStr = new Date(backupData.timestamp).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          restoreDetails.textContent = `(backup: ${timeStr})`;
        }
      } catch (err) {
        console.error(err);
        ToastService.show('Failed to create backup.', 'error');
      }
    });
  }

  if (restoreBtn) {
    restoreBtn.addEventListener('click', () => {
      const backup = localStorage.getItem('bench_local_backup');
      if (!backup) {
        ToastService.show('No local backup found. Create a backup first.', 'error');
        return;
      }
      try {
        const parsed = JSON.parse(backup);
        const backupTime = new Date(parsed.timestamp).toLocaleString();
        DialogService.confirm({
          title: 'Restore Backup',
          message: `Restoring will replace all your current data with the backup from ${backupTime}. Are you sure you want to proceed?`,
          confirmText: 'Restore',
          cancelText: 'Cancel',
          variant: 'danger'
        }).then((confirmed) => {
          if (confirmed) {
            localStorage.setItem('bench_items', JSON.stringify(parsed.items));
            if (parsed.settings) {
              SettingsStore.save(parsed.settings);
            }
            if (parsed.jot !== undefined) {
              localStorage.setItem('bench_jot', parsed.jot);
            }
            ToastService.show('Data restored successfully.', 'success');
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        });
      } catch (err) {
        console.error(err);
        ToastService.show('Failed to restore backup.', 'error');
      }
    });
  }

  // Danger Zone actions
  const clearArchiveBtn = container.querySelector('#settings-danger-clear-archive');
  const clearDatabaseBtn = container.querySelector('#settings-danger-clear-database');

  if (clearArchiveBtn) {
    clearArchiveBtn.addEventListener('click', () => {
      DialogService.confirm({
        title: 'Clear Archive',
        message: 'Are you sure you want to permanently delete all archived projects, tasks, and areas? This action cannot be undone.',
        confirmText: 'Clear Archive',
        cancelText: 'Cancel',
        variant: 'danger'
      }).then((confirmed) => {
        if (confirmed) {
          Repository.clearModule('archive');
          // Also clear archived areas
          Repository.getAreas().forEach(area => {
            if (area.archived) {
              Repository.deleteAreaForce(area.id, null);
            }
          });
          ToastService.show('Archive cleared successfully.', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    });
  }

  if (clearDatabaseBtn) {
    clearDatabaseBtn.addEventListener('click', () => {
      DialogService.confirm({
        title: 'Clear Database',
        message: 'Are you sure you want to permanently wipe the entire database? This will delete all tasks, projects, areas, and checklists. This action cannot be undone.',
        confirmText: 'Wipe Everything',
        cancelText: 'Cancel',
        variant: 'danger'
      }).then((confirmed) => {
        if (confirmed) {
          Repository.clearAll();
          ToastService.show('Database cleared successfully.', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });
    });
  }
}
