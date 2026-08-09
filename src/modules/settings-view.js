import { SettingsStore } from '../core/settings-store.js';
import { Repository } from '../core/repository.js';
import { DialogService } from '../ui/dialog.js';
import { ToastService } from '../ui/toast.js';
import { JotStore } from '../core/jot-store.js';

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

  container.innerHTML = `
    <div class="settings-view">
      <div style="display: flex; flex-direction: column; gap: var(--space-xl);">
        
        <!-- General -->
        <div>
          <div class="settings-section-header">General</div>
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
                <span class="settings-label">Compact mode</span>
                <input type="checkbox" id="settings-compact" class="bench-checkbox" ${settings.compactMode ? 'checked' : ''}>
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
                <span class="settings-label">Reduce animations</span>
                <input type="checkbox" id="settings-reduce-animations" class="bench-checkbox" ${settings.reduceAnimations ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <span class="settings-label">Clip long task titles</span>
                <input type="checkbox" id="settings-clip-task-titles" class="bench-checkbox" ${settings.clipTaskTitles !== false ? 'checked' : ''}>
              </div>
            </div>

            <div class="settings-subheader">Behavior</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Confirm delete</span>
                <input type="checkbox" id="settings-confirm-delete" class="bench-checkbox" ${settings.confirmDelete ? 'checked' : ''}>
              </div>

              <div class="settings-item">
                <span class="settings-label">Confirm archive</span>
                <input type="checkbox" id="settings-confirm-archive" class="bench-checkbox" ${settings.confirmArchive ? 'checked' : ''}>
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
                  <option value="settings" ${settings.startupModule === 'settings' ? 'selected' : ''}>Settings</option>
                </select>
              </div>

              <div class="settings-item">
                <span class="settings-label">Remember last module</span>
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

          </div>
        </div>

        <!-- Productivity -->
        <div>
          <div class="settings-section-header">Productivity</div>
          <div class="settings-list-group">
            
            <div class="settings-subheader">Focus</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Max focus tasks</span>
                <span class="settings-value">3 (Strict Limit)</span>
              </div>
              <div class="settings-item">
                <span class="settings-label">Auto-clear completed</span>
                <input type="checkbox" id="settings-auto-clear-completed" class="bench-checkbox" ${settings.autoClearCompleted ? 'checked' : ''}>
              </div>

            </div>

            <div class="settings-subheader">Areas</div>
            <div class="settings-list">
              <div class="settings-item">
                <span class="settings-label">Enable status tints</span>
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
            </div>

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
            </div>
            
          </div>
        </div>

        <!-- Data -->
        <div>
          <div class="settings-section-header">Data</div>
          <div class="settings-list">
            <div class="settings-item">
              <span class="settings-label">Import</span>
              <button id="settings-data-import" class="settings-btn">import JSON</button>
            </div>
            <div class="settings-item">
              <span class="settings-label">Export</span>
              <button id="settings-data-export" class="settings-btn">export JSON</button>
            </div>
            <div class="settings-item">
              <span class="settings-label">Backup</span>
              <button id="settings-data-backup" class="settings-btn">create backup</button>
            </div>
            <div class="settings-item">
              <span class="settings-label">Restore <span id="settings-data-restore-details" style="font-weight: normal; font-size: var(--font-size-xs); color: var(--color-text-muted); margin-left: var(--space-xs);">${backupTimeText}</span></span>
              <button id="settings-data-restore" class="settings-btn">restore</button>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-danger-zone-container">
          <div class="settings-section-header">Danger Zone</div>
          <div class="settings-list">
            <div class="settings-item">
              <span class="settings-label">Clear Archive</span>
              <button id="settings-danger-clear-archive" class="settings-btn btn-danger">clear</button>
            </div>
            <div class="settings-item">
              <span class="settings-label">Clear Database</span>
              <button id="settings-danger-clear-database" class="settings-btn btn-danger">wipe</button>
            </div>
          </div>
        </div>

        <!-- About -->
        <div>
          <div class="settings-section-header">About</div>
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

      </div>
    </div>
  `;

  // Bind change events to save configuration state
  const themeSelect = container.querySelector('#settings-theme');
  const accentSelect = container.querySelector('#settings-accent');
  const compactCheck = container.querySelector('#settings-compact');
  const fontSizeSelect = container.querySelector('#settings-font-size');
  const reduceAnimCheck = container.querySelector('#settings-reduce-animations');
  const clipTaskTitlesCheck = container.querySelector('#settings-clip-task-titles');

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
  const jotFontFamilySelect = container.querySelector('#settings-jot-font-family');
  const jotTabSizeSelect = container.querySelector('#settings-jot-tab-size');
  const jotAutoSaveCheck = container.querySelector('#settings-jot-auto-save');
  const jotShowLineNumbersCheck = container.querySelector('#settings-jot-show-line-numbers');

  function updateSettings() {
    const nextSettings = {
      theme: themeSelect.value,
      accentColor: accentSelect.value,
      compactMode: compactCheck.checked,
      fontSize: fontSizeSelect.value,
      reduceAnimations: reduceAnimCheck.checked,
      clipTaskTitles: clipTaskTitlesCheck.checked,

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
      jotFontFamily: jotFontFamilySelect.value,
      jotTabSize: jotTabSizeSelect.value,
      jotAutoSave: jotAutoSaveCheck.checked,
      jotShowLineNumbers: jotShowLineNumbersCheck.checked
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
  jotFontFamilySelect.addEventListener('change', updateSettings);
  jotTabSizeSelect.addEventListener('change', updateSettings);
  jotAutoSaveCheck.addEventListener('change', updateSettings);
  jotShowLineNumbersCheck.addEventListener('change', updateSettings);

  // Data actions
  const importBtn = container.querySelector('#settings-data-import');
  const exportBtn = container.querySelector('#settings-data-export');
  const backupBtn = container.querySelector('#settings-data-backup');
  const restoreBtn = container.querySelector('#settings-data-restore');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      try {
        const exportData = {
          version: '0.2.1',
          items: Repository.getAll(),
          settings: SettingsStore.load(),
          jot: JotStore.loadJot()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bench_export_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        ToastService.show('Data exported successfully.', 'success');
      } catch (err) {
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
