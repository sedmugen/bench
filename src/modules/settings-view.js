import { SettingsStore } from '../core/settings-store.js';
import { Repository } from '../core/repository.js';
import { DialogService } from '../ui/dialog.js';
import { ToastService } from '../ui/toast.js';
import { JotStore } from '../core/jot-store.js';
import { ClipsStore } from '../core/clips-store.js';
import { escapeHtml } from '../ui/markdown-renderer.js';
import { showBenchGuide, showShortcutsModal } from '../ui/help-modals.js';

let currentCategory = 'general';

export function renderSettingsView(container) {
  const settings = SettingsStore.load();

  let useSystemTheme = settings.useSystemTheme;
  if (useSystemTheme === undefined) {
    useSystemTheme = settings.theme === 'system';
  }

  let themeLevel = settings.themeLevel;
  if (themeLevel === undefined || themeLevel === null) {
    if (settings.theme === 'light') themeLevel = 6;
    else if (settings.theme === 'deep-dark') themeLevel = 0;
    else if (settings.theme === 'nord-dark') themeLevel = 2;
    else if (settings.theme === 'neutral-dark') themeLevel = 3;
    else if (settings.theme === 'sand-light') themeLevel = 4;
    else if (settings.theme === 'neutral-light') themeLevel = 5;
    else themeLevel = 1;
  }

  const themeLabels = ['OLED Black', 'Bench Dark', 'Nordic Charcoal', 'Slate Dark', 'Warm Sand', 'Soft Light', 'Pure Light'];
  const themeMapNames = ['deep-dark', 'dark', 'nord-dark', 'neutral-dark', 'sand-light', 'neutral-light', 'light'];

  const activeAreas = Repository.getActiveAreas();
  const areaOptions = activeAreas.map(area => 
    `<option value="${area.id}" ${settings.defaultArea === area.id ? 'selected' : ''}>${area.name}</option>`
  ).join('');

  const backup = localStorage.getItem('bench_local_backup');
  let backupTimeText = '';
  if (backup) {
    try {
      const parsed = JSON.parse(backup);
      if (parsed.timestamp) {
        backupTimeText = ` (Last backup: ${new Date(parsed.timestamp).toLocaleString()})`;
      }
    } catch (e) {
      console.error('Failed to parse backup timestamp:', e);
    }
  }

  container.innerHTML = `
    <div class="settings-view-container">
      
      <!-- Top Header / Title Bar -->
      <div class="settings-header-bar">
        <h1 class="settings-main-title">Settings</h1>
      </div>

      <!-- Main Two-Pane Split Layout -->
      <div class="settings-two-pane-container">
        
        <!-- Left Navigation Index Pane -->
        <aside class="settings-nav-pane">
          <div class="settings-nav-group">
            <button class="settings-nav-item ${currentCategory === 'general' ? 'active' : ''}" data-nav="general">
              <span class="settings-nav-indicator">${currentCategory === 'general' ? '›' : ' '}</span>
              <span>General</span>
            </button>
            <button class="settings-nav-item ${currentCategory === 'productivity' ? 'active' : ''}" data-nav="productivity">
              <span class="settings-nav-indicator">${currentCategory === 'productivity' ? '›' : ' '}</span>
              <span>Productivity</span>
            </button>
            <button class="settings-nav-item ${currentCategory === 'editor' ? 'active' : ''}" data-nav="editor">
              <span class="settings-nav-indicator">${currentCategory === 'editor' ? '›' : ' '}</span>
              <span>Editor</span>
            </button>
            <button class="settings-nav-item ${currentCategory === 'clips' ? 'active' : ''}" data-nav="clips">
              <span class="settings-nav-indicator">${currentCategory === 'clips' ? '›' : ' '}</span>
              <span>Clips</span>
            </button>
            <button class="settings-nav-item ${currentCategory === 'data' ? 'active' : ''}" data-nav="data">
              <span class="settings-nav-indicator">${currentCategory === 'data' ? '›' : ' '}</span>
              <span>Data</span>
            </button>
            <button class="settings-nav-item ${currentCategory === 'about' ? 'active' : ''}" data-nav="about">
              <span class="settings-nav-indicator">${currentCategory === 'about' ? '›' : ' '}</span>
              <span>About</span>
            </button>
            <button class="settings-nav-item nav-danger ${currentCategory === 'danger' ? 'active' : ''}" data-nav="danger">
              <span class="settings-nav-indicator">${currentCategory === 'danger' ? '›' : ' '}</span>
              <span>Danger Zone</span>
            </button>
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
                  <div class="settings-label-group">
                    <span class="settings-label">Use system theme</span>
                    <div class="settings-row-desc">Automatically match system dark/light preference.</div>
                  </div>
                  <input type="checkbox" id="settings-use-system-theme" class="bench-checkbox" ${useSystemTheme ? 'checked' : ''}>
                </div>

                <div id="theme-spectrum-container" class="theme-spectrum-container ${useSystemTheme ? 'disabled' : ''}">
                  <div class="theme-spectrum-header">
                    <span class="theme-spectrum-title">Theme Spectrum</span>
                    <span id="theme-spectrum-value-label" class="theme-spectrum-value">${themeLabels[themeLevel] || 'Bench Dark'}</span>
                  </div>

                  <div class="theme-spectrum-track-wrapper">
                    <span class="spectrum-label-end">Dark</span>
                    <div class="theme-spectrum-track" id="theme-spectrum-track" tabindex="${useSystemTheme ? '-1' : '0'}" role="slider" aria-valuemin="0" aria-valuemax="6" aria-valuenow="${themeLevel}" aria-valuetext="${themeLabels[themeLevel] || 'Bench Dark'}" aria-label="Theme Spectrum Slider">
                      <div class="theme-spectrum-rail"></div>
                      <div class="theme-spectrum-ticks">
                        <span class="theme-tick ${themeLevel === 0 ? 'active' : ''}" data-level="0"></span>
                        <span class="theme-tick ${themeLevel === 1 ? 'active' : ''}" data-level="1"></span>
                        <span class="theme-tick ${themeLevel === 2 ? 'active' : ''}" data-level="2"></span>
                        <span class="theme-tick ${themeLevel === 3 ? 'active' : ''}" data-level="3"></span>
                        <span class="theme-tick ${themeLevel === 4 ? 'active' : ''}" data-level="4"></span>
                        <span class="theme-tick ${themeLevel === 5 ? 'active' : ''}" data-level="5"></span>
                        <span class="theme-tick ${themeLevel === 6 ? 'active' : ''}" data-level="6"></span>
                      </div>
                      <div class="theme-spectrum-thumb" id="theme-spectrum-thumb" style="left: ${(themeLevel / 6) * 100}%">
                        <span class="theme-thumb-dot">●</span>
                      </div>
                    </div>
                    <span class="spectrum-label-end">Light</span>
                  </div>
                </div>

                <div class="settings-item">
                  <span class="settings-label">Accent color</span>
                  <select id="settings-accent" class="settings-select">
                    <option value="blue"       ${settings.accentColor === 'blue'       ? 'selected' : ''}>Blue (Default)</option>
                    <option value="cyan"       ${settings.accentColor === 'cyan'       ? 'selected' : ''}>Cyan</option>
                    <option value="frost"      ${settings.accentColor === 'frost'      ? 'selected' : ''}>Frost</option>
                    <option value="teal"       ${settings.accentColor === 'teal'       ? 'selected' : ''}>Teal</option>
                    <option value="emerald"    ${settings.accentColor === 'emerald'    ? 'selected' : ''}>Emerald</option>
                    <option value="amber"      ${settings.accentColor === 'amber'      ? 'selected' : ''}>Amber</option>
                    <option value="lavender"   ${settings.accentColor === 'lavender'   ? 'selected' : ''}>Lavender</option>
                    <option value="purple"     ${settings.accentColor === 'purple'     ? 'selected' : ''}>Purple</option>
                    <option value="iris"       ${settings.accentColor === 'iris'       ? 'selected' : ''}>Iris</option>
                    <option value="rose"       ${settings.accentColor === 'rose'       ? 'selected' : ''}>Rose</option>
                    <option value="crimson"    ${settings.accentColor === 'crimson'    ? 'selected' : ''}>Crimson</option>
                    <option value="monochrome" ${settings.accentColor === 'monochrome' ? 'selected' : ''}>Monochrome</option>
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

            <div class="settings-subheader">Help & Reference</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Bench Guide</span>
                  <div class="settings-row-desc">Learn Bench's workflow loop and core concepts.</div>
                </div>
                <button id="settings-open-guide" class="settings-btn">open guide</button>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Keyboard Shortcuts</span>
                  <div class="settings-row-desc">View all keyboard shortcuts and navigation hotkeys.</div>
                </div>
                <button id="settings-open-shortcuts" class="settings-btn">view shortcuts</button>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Show header utility buttons</span>
                  <div class="settings-row-desc">Display Bench Guide and Keyboard Shortcuts icon buttons in the title bar.</div>
                </div>
                <input type="checkbox" id="settings-show-header-utility-buttons" class="bench-checkbox" ${settings.showHeaderUtilityButtons !== false ? 'checked' : ''}>
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

            <!-- Section 1: WRITING -->
            <div class="settings-subheader">writing</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Font family</span>
                  <div class="settings-row-desc">Typography style for writing and note preview.</div>
                </div>
                <select id="settings-jot-font-family" class="settings-select" style="max-width: 200px;">
                  <optgroup label="Monospace">
                    <option value="jetbrains-mono" ${(settings.jotFontFamily === 'jetbrains-mono' || settings.jotFontFamily === 'monospace') ? 'selected' : ''}>JetBrains Mono (Default)</option>
                    <option value="fira-code" ${settings.jotFontFamily === 'fira-code' ? 'selected' : ''}>Fira Code</option>
                    <option value="source-code-pro" ${settings.jotFontFamily === 'source-code-pro' ? 'selected' : ''}>Source Code Pro</option>
                  </optgroup>
                  <optgroup label="Sans-Serif">
                    <option value="inter" ${(settings.jotFontFamily === 'inter' || settings.jotFontFamily === 'sans-serif') ? 'selected' : ''}>Inter</option>
                    <option value="system" ${settings.jotFontFamily === 'system' ? 'selected' : ''}>System UI</option>
                  </optgroup>
                  <optgroup label="Serif">
                    <option value="lora" ${(settings.jotFontFamily === 'lora' || settings.jotFontFamily === 'serif') ? 'selected' : ''}>Lora</option>
                    <option value="merriweather" ${settings.jotFontFamily === 'merriweather' ? 'selected' : ''}>Merriweather</option>
                  </optgroup>
                </select>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Font size</span>
                  <div class="settings-row-desc">Base text size in editor workspace.</div>
                </div>
                <div class="bench-segmented" id="settings-jot-font-size-group">
                  <button type="button" class="bench-segmented-btn ${settings.jotFontSize === 'small' ? 'active' : ''}" data-value="small">Small</button>
                  <button type="button" class="bench-segmented-btn ${(!settings.jotFontSize || settings.jotFontSize === 'normal') ? 'active' : ''}" data-value="normal">Normal</button>
                  <button type="button" class="bench-segmented-btn ${settings.jotFontSize === 'large' ? 'active' : ''}" data-value="large">Large</button>
                </div>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Line height</span>
                  <div class="settings-row-desc">Vertical spacing between lines of text.</div>
                </div>
                <div class="bench-segmented" id="settings-jot-line-height-group">
                  <button type="button" class="bench-segmented-btn ${settings.jotLineHeight === 'tight' ? 'active' : ''}" data-value="tight">Tight</button>
                  <button type="button" class="bench-segmented-btn ${(!settings.jotLineHeight || settings.jotLineHeight === 'normal') ? 'active' : ''}" data-value="normal">Normal</button>
                  <button type="button" class="bench-segmented-btn ${settings.jotLineHeight === 'relaxed' ? 'active' : ''}" data-value="relaxed">Relaxed</button>
                </div>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Tab size</span>
                  <div class="settings-row-desc">Indent width when pressing the Tab key.</div>
                </div>
                <select id="settings-jot-tab-size" class="settings-select" style="max-width: 160px;">
                  <option value="tab" ${settings.jotTabSize === 'tab' ? 'selected' : ''}>Tab Character</option>
                  <option value="2" ${settings.jotTabSize === '2' ? 'selected' : ''}>2 Spaces</option>
                  <option value="4" ${settings.jotTabSize === '4' ? 'selected' : ''}>4 Spaces</option>
                </select>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Word wrap</span>
                  <div class="settings-row-desc">Wrap text lines dynamically to fit container.</div>
                </div>
                <input type="checkbox" id="settings-jot-word-wrap" class="bench-checkbox" ${settings.jotWordWrap !== false ? 'checked' : ''}>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Spell check</span>
                  <div class="settings-row-desc">Highlight misspellings using browser spellcheck.</div>
                </div>
                <input type="checkbox" id="settings-jot-spell-check" class="bench-checkbox" ${settings.jotSpellCheck ? 'checked' : ''}>
              </div>
            </div>

            <!-- Section 2: BEHAVIOR -->
            <div class="settings-subheader">behavior</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Auto-save</span>
                  <div class="settings-row-desc">Automatically save note edits continuously.</div>
                </div>
                <input type="checkbox" id="settings-jot-auto-save" class="bench-checkbox" ${settings.jotAutoSave ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Show line numbers</span>
                  <div class="settings-row-desc">Display line numbers along left editor margin.</div>
                </div>
                <input type="checkbox" id="settings-jot-show-line-numbers" class="bench-checkbox" ${settings.jotShowLineNumbers ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Smart lists</span>
                  <div class="settings-row-desc">Automatically continue list formatting on Enter.</div>
                </div>
                <input type="checkbox" id="settings-jot-smart-lists" class="bench-checkbox" ${settings.jotSmartLists !== false ? 'checked' : ''}>
              </div>
            </div>

            <!-- Section 3: MARKDOWN -->
            <div class="settings-subheader">markdown</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Markdown</span>
                  <div class="settings-row-desc">Enable Markdown formatting and rendering.</div>
                </div>
                <input type="checkbox" id="settings-enable-jot-markdown" class="bench-checkbox" ${settings.enableJotMarkdown !== false ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Formatting toolbar</span>
                  <div class="settings-row-desc">Show quick formatting actions bar above editor.</div>
                </div>
                <input type="checkbox" id="settings-jot-show-formatting-toolbar" class="bench-checkbox" ${settings.jotShowFormattingToolbar !== false ? 'checked' : ''}>
              </div>
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Markdown preview</span>
                  <div class="settings-row-desc">Render formatted preview pane for Markdown text.</div>
                </div>
                <input type="checkbox" id="settings-enable-jot-formatting" class="bench-checkbox" ${settings.enableJotFormatting !== false ? 'checked' : ''}>
              </div>
            </div>

            <!-- Section 4: VIEW -->
            <div class="settings-subheader">view</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Default view</span>
                  <div class="settings-row-desc">Initial workspace mode when opening Jot.</div>
                </div>
                <div class="bench-segmented" id="settings-jot-default-view-group">
                  <button type="button" class="bench-segmented-btn ${(!settings.jotDefaultViewMode || settings.jotDefaultViewMode === 'edit') ? 'active' : ''}" data-value="edit">Edit</button>
                  <button type="button" class="bench-segmented-btn ${settings.jotDefaultViewMode === 'preview' ? 'active' : ''}" data-value="preview">Preview</button>
                  <button type="button" class="bench-segmented-btn ${settings.jotDefaultViewMode === 'split' ? 'active' : ''}" data-value="split">Split</button>
                </div>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Editor width</span>
                  <div class="settings-row-desc">Maximum width threshold for editor container.</div>
                </div>
                <div class="bench-segmented" id="settings-jot-editor-width-group">
                  <button type="button" class="bench-segmented-btn ${settings.jotEditorWidth === 'compact' ? 'active' : ''}" data-value="compact">Compact</button>
                  <button type="button" class="bench-segmented-btn ${settings.jotEditorWidth === 'comfortable' ? 'active' : ''}" data-value="comfortable">Comfortable</button>
                  <button type="button" class="bench-segmented-btn ${settings.jotEditorWidth === 'wide' ? 'active' : ''}" data-value="wide">Wide</button>
                  <button type="button" class="bench-segmented-btn ${(!settings.jotEditorWidth || settings.jotEditorWidth === 'full') ? 'active' : ''}" data-value="full">Full</button>
                </div>
              </div>
            </div>
            
          </div>
        </div>

        <!-- Clips Category -->
        <div class="settings-category-panel" data-category="clips" style="display: ${currentCategory === 'clips' ? 'block' : 'none'};">
          <h2 class="settings-category-title">Clips</h2>
          <div class="settings-list-group">
            
            <div class="settings-subheader">View & Layout</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Default view</span>
                  <div class="settings-row-desc">Initial layout mode when opening the Clips module.</div>
                </div>
                <div class="bench-segmented" id="settings-clips-default-view-group">
                  <button type="button" class="bench-segmented-btn ${(!settings.clipsDefaultView || settings.clipsDefaultView === 'grid') ? 'active' : ''}" data-value="grid">Grid</button>
                  <button type="button" class="bench-segmented-btn ${settings.clipsDefaultView === 'list' ? 'active' : ''}" data-value="list">List</button>
                </div>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Default sort</span>
                  <div class="settings-row-desc">Initial ordering criteria for clips.</div>
                </div>
                <select id="settings-clips-default-sort" class="settings-select">
                  <option value="updated-desc" ${(!settings.clipsDefaultSort || settings.clipsDefaultSort === 'updated-desc') ? 'selected' : ''}>Recently Updated</option>
                  <option value="created-desc" ${settings.clipsDefaultSort === 'created-desc' ? 'selected' : ''}>Recently Created</option>
                  <option value="title-asc" ${settings.clipsDefaultSort === 'title-asc' ? 'selected' : ''}>Title (A-Z)</option>
                </select>
              </div>

              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Show clip previews</span>
                  <div class="settings-row-desc">Render full formatted content preview in clip cards.</div>
                </div>
                <input type="checkbox" id="settings-clips-show-previews" class="bench-checkbox" ${settings.clipsShowPreviews !== false ? 'checked' : ''}>
              </div>
            </div>

            <div class="settings-subheader">Behavior</div>
            <div class="settings-list">
              <div class="settings-item">
                <div class="settings-label-group">
                  <span class="settings-label">Confirm before deleting</span>
                  <div class="settings-row-desc">Prompt for confirmation before permanently removing a clip.</div>
                </div>
                <input type="checkbox" id="settings-clips-confirm-delete" class="bench-checkbox" ${settings.clipsConfirmDelete !== false ? 'checked' : ''}>
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
          <div class="settings-about-header">
            <img src="assets/icon/bench-icon-ver0.3.0/64x64.png" alt="Bench Logo" class="settings-about-icon" />
            <div class="settings-about-title-group">
              <div class="settings-about-app-name">bench</div>
              <div class="settings-about-tagline">Build less. Focus more. Keep the bench clean.</div>
            </div>
          </div>
          <div class="settings-list">
            <div class="settings-item">
              <span class="settings-label">Version</span>
              <span class="settings-value">0.3.1</span>
            </div>
            <div class="settings-item">
              <span class="settings-label">Changelog</span>
              <span class="settings-value">v0.3.1</span>
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
      const isTarget = item.getAttribute('data-nav') === catId;
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
      const catId = item.getAttribute('data-nav');
      switchCategory(catId);
    });
  });

  // Keyboard navigation on left category nav pane (ArrowUp / ArrowDown)
  const navPane = container.querySelector('.settings-nav-pane');
  if (navPane) {
    navPane.addEventListener('keydown', (e) => {
      const itemList = Array.from(navItems);
      const activeIdx = itemList.findIndex(item => item.getAttribute('data-nav') === currentCategory);
      if (activeIdx === -1) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const nextIdx = (activeIdx + 1) % itemList.length;
        itemList[nextIdx].focus();
        switchCategory(itemList[nextIdx].getAttribute('data-nav'));
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevIdx = (activeIdx - 1 + itemList.length) % itemList.length;
        itemList[prevIdx].focus();
        switchCategory(itemList[prevIdx].getAttribute('data-nav'));
      }
    });
  }

  // Bind change events to save configuration state
  const useSystemThemeCheck = container.querySelector('#settings-use-system-theme');
  const themeSpectrumContainer = container.querySelector('#theme-spectrum-container');
  const themeSpectrumTrack = container.querySelector('#theme-spectrum-track');
  const themeSpectrumValueLabel = container.querySelector('#theme-spectrum-value-label');
  const themeSpectrumThumb = container.querySelector('#theme-spectrum-thumb');
  const themeTicks = container.querySelectorAll('.theme-tick');

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
  const showHeaderUtilityButtonsCheck = container.querySelector('#settings-show-header-utility-buttons');
  const openGuideBtn = container.querySelector('#settings-open-guide');
  const openShortcutsBtn = container.querySelector('#settings-open-shortcuts');
  const autoClearCompletedCheck = container.querySelector('#settings-auto-clear-completed');
  const enableAreaStatusTintsCheck = container.querySelector('#settings-enable-area-status-tints');
  const confirmArchiveAreaCheck = container.querySelector('#settings-confirm-archive-area');
  const defaultAreaSelect = container.querySelector('#settings-default-area');
  const logDefaultViewModeSelect = container.querySelector('#settings-log-default-view-mode');
  const jotFontFamilySelect = container.querySelector('#settings-jot-font-family');
  const jotFontSizeGroup = container.querySelector('#settings-jot-font-size-group');
  const jotLineHeightGroup = container.querySelector('#settings-jot-line-height-group');
  const jotTabSizeSelect = container.querySelector('#settings-jot-tab-size');
  const jotWordWrapCheck = container.querySelector('#settings-jot-word-wrap');
  const jotSpellCheckCheck = container.querySelector('#settings-jot-spell-check');
  const jotAutoSaveCheck = container.querySelector('#settings-jot-auto-save');
  const jotShowLineNumbersCheck = container.querySelector('#settings-jot-show-line-numbers');
  const jotSmartListsCheck = container.querySelector('#settings-jot-smart-lists');
  const jotDefaultViewGroup = container.querySelector('#settings-jot-default-view-group');
  const jotEditorWidthGroup = container.querySelector('#settings-jot-editor-width-group');
  const enableJotFormattingCheck = container.querySelector('#settings-enable-jot-formatting');
  const enableJotMarkdownCheck = container.querySelector('#settings-enable-jot-markdown');
  const jotShowFormattingToolbarCheck = container.querySelector('#settings-jot-show-formatting-toolbar');

  const clipsDefaultViewGroup = container.querySelector('#settings-clips-default-view-group');
  const clipsDefaultSortSelect = container.querySelector('#settings-clips-default-sort');
  const clipsShowPreviewsCheck = container.querySelector('#settings-clips-show-previews');
  const clipsConfirmDeleteCheck = container.querySelector('#settings-clips-confirm-delete');
  const clipsDefaultColorSelect = container.querySelector('#settings-clips-default-color');

  function getVal(el, fallback = '') {
    return el ? el.value : fallback;
  }

  function getCheck(el, fallback = false) {
    return el ? el.checked : fallback;
  }

  function getSegmentedValue(groupEl, fallback) {
    if (!groupEl) return fallback;
    const activeBtn = groupEl.querySelector('.bench-segmented-btn.active');
    return activeBtn ? activeBtn.getAttribute('data-value') : fallback;
  }

  function bindChange(el, handler) {
    if (el) {
      el.addEventListener('change', handler);
      el.addEventListener('input', handler);
    }
  }

  let currentThemeLevel = themeLevel;

  function updateThemeSpectrumUI(level) {
    currentThemeLevel = Math.max(0, Math.min(6, level));
    const label = themeLabels[currentThemeLevel];
    if (themeSpectrumValueLabel) themeSpectrumValueLabel.textContent = label;
    if (themeSpectrumThumb) themeSpectrumThumb.style.left = `${(currentThemeLevel / 6) * 100}%`;
    if (themeSpectrumTrack) {
      themeSpectrumTrack.setAttribute('aria-valuenow', currentThemeLevel);
      themeSpectrumTrack.setAttribute('aria-valuetext', label);
    }
    themeTicks.forEach(tick => {
      const tickLevel = parseInt(tick.getAttribute('data-level'), 10);
      if (tickLevel === currentThemeLevel) {
        tick.classList.add('active');
      } else {
        tick.classList.remove('active');
      }
    });
  }

  function updateSettings() {
    const currentStored = SettingsStore.load();
    const isSystem = useSystemThemeCheck ? useSystemThemeCheck.checked : (currentStored.useSystemTheme || false);

    const nextSettings = {
      ...currentStored,
      useSystemTheme: isSystem,
      themeLevel: currentThemeLevel,
      theme: isSystem ? 'system' : themeMapNames[currentThemeLevel]
    };

    if (accentSelect) nextSettings.accentColor = accentSelect.value;
    if (compactCheck) nextSettings.compactMode = compactCheck.checked;
    if (fontSizeSelect) nextSettings.fontSize = fontSizeSelect.value;
    if (reduceAnimCheck) nextSettings.reduceAnimations = reduceAnimCheck.checked;
    if (clipTaskTitlesCheck) nextSettings.clipTaskTitles = clipTaskTitlesCheck.checked;
    if (navIconStyleSelect) nextSettings.navigationIconStyle = navIconStyleSelect.value;

    if (confirmDeleteCheck) nextSettings.confirmDelete = confirmDeleteCheck.checked;
    if (confirmArchiveCheck) nextSettings.confirmArchive = confirmArchiveCheck.checked;
    if (startupModuleSelect) nextSettings.startupModule = startupModuleSelect.value;
    if (rememberLastModuleCheck) nextSettings.rememberLastModule = rememberLastModuleCheck.checked;
    if (shortcutStyleSelect) nextSettings.shortcutStyle = shortcutStyleSelect.value;
    if (showSidebarShortcutsCheck) nextSettings.showSidebarShortcuts = showSidebarShortcutsCheck.checked;
    if (showHeaderUtilityButtonsCheck) nextSettings.showHeaderUtilityButtons = showHeaderUtilityButtonsCheck.checked;

    if (autoClearCompletedCheck) nextSettings.autoClearCompleted = autoClearCompletedCheck.checked;
    if (enableAreaStatusTintsCheck) nextSettings.enableAreaTaskStatusTints = enableAreaStatusTintsCheck.checked;
    if (confirmArchiveAreaCheck) nextSettings.confirmArchiveArea = confirmArchiveAreaCheck.checked;
    if (defaultAreaSelect) nextSettings.defaultArea = defaultAreaSelect.value;
    if (logDefaultViewModeSelect) nextSettings.logDefaultViewMode = logDefaultViewModeSelect.value;

    if (jotFontFamilySelect) nextSettings.jotFontFamily = jotFontFamilySelect.value;
    if (jotFontSizeGroup) nextSettings.jotFontSize = getSegmentedValue(jotFontSizeGroup, currentStored.jotFontSize || 'normal');
    if (jotLineHeightGroup) nextSettings.jotLineHeight = getSegmentedValue(jotLineHeightGroup, currentStored.jotLineHeight || 'normal');
    if (jotTabSizeSelect) nextSettings.jotTabSize = jotTabSizeSelect.value;
    if (jotWordWrapCheck) nextSettings.jotWordWrap = jotWordWrapCheck.checked;
    if (jotSpellCheckCheck) nextSettings.jotSpellCheck = jotSpellCheckCheck.checked;
    if (jotAutoSaveCheck) nextSettings.jotAutoSave = jotAutoSaveCheck.checked;
    if (jotShowLineNumbersCheck) nextSettings.jotShowLineNumbers = jotShowLineNumbersCheck.checked;
    if (jotSmartListsCheck) nextSettings.jotSmartLists = jotSmartListsCheck.checked;
    if (jotDefaultViewGroup) nextSettings.jotDefaultViewMode = getSegmentedValue(jotDefaultViewGroup, currentStored.jotDefaultViewMode || 'edit');
    if (jotEditorWidthGroup) nextSettings.jotEditorWidth = getSegmentedValue(jotEditorWidthGroup, currentStored.jotEditorWidth || 'full');
    if (enableJotFormattingCheck) nextSettings.enableJotFormatting = enableJotFormattingCheck.checked;
    if (enableJotMarkdownCheck) nextSettings.enableJotMarkdown = enableJotMarkdownCheck.checked;
    if (jotShowFormattingToolbarCheck) nextSettings.jotShowFormattingToolbar = jotShowFormattingToolbarCheck.checked;

    if (clipsDefaultViewGroup) nextSettings.clipsDefaultView = getSegmentedValue(clipsDefaultViewGroup, currentStored.clipsDefaultView || 'grid');
    if (clipsDefaultSortSelect) nextSettings.clipsDefaultSort = clipsDefaultSortSelect.value;
    if (clipsShowPreviewsCheck) nextSettings.clipsShowPreviews = clipsShowPreviewsCheck.checked;
    if (clipsConfirmDeleteCheck) nextSettings.clipsConfirmDelete = clipsConfirmDeleteCheck.checked;

    if (themeSpectrumContainer) {
      if (isSystem) {
        themeSpectrumContainer.classList.add('disabled');
        if (themeSpectrumTrack) themeSpectrumTrack.setAttribute('tabindex', '-1');
      } else {
        themeSpectrumContainer.classList.remove('disabled');
        if (themeSpectrumTrack) themeSpectrumTrack.setAttribute('tabindex', '0');
      }
    }

    if (startupModuleSelect && rememberLastModuleCheck) {
      startupModuleSelect.disabled = rememberLastModuleCheck.checked;
    }

    SettingsStore.save(nextSettings);
  }

  // Event Delegation for all inputs & selects inside settings container
  container.addEventListener('change', () => updateSettings());
  container.addEventListener('input', () => updateSettings());

  function handleTrackClick(e) {
    if (useSystemThemeCheck && useSystemThemeCheck.checked) return;
    if (!themeSpectrumTrack) return;
    const rect = themeSpectrumTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const level = Math.round(ratio * 6);
    updateThemeSpectrumUI(level);
    updateSettings();
  }

  if (themeSpectrumTrack) {
    themeSpectrumTrack.addEventListener('click', handleTrackClick);
    themeSpectrumTrack.addEventListener('keydown', (e) => {
      if (useSystemThemeCheck && useSystemThemeCheck.checked) return;
      let newLevel = currentThemeLevel;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        newLevel = Math.max(0, currentThemeLevel - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        e.preventDefault();
        newLevel = Math.min(6, currentThemeLevel + 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        newLevel = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        newLevel = 6;
      }
      if (newLevel !== currentThemeLevel) {
        updateThemeSpectrumUI(newLevel);
        updateSettings();
      }
    });
  }

  container.querySelectorAll('.bench-segmented-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      if (parent) {
        parent.querySelectorAll('.bench-segmented-btn').forEach(b => b.classList.remove('active'));
      }
      btn.classList.add('active');
      updateSettings();
    });
  });

  if (openGuideBtn) {
    openGuideBtn.addEventListener('click', () => showBenchGuide());
  }
  if (openShortcutsBtn) {
    openShortcutsBtn.addEventListener('click', () => showShortcutsModal());
  }

  // Data actions
  const importBtn = container.querySelector('#settings-data-import');
  const exportBtn = container.querySelector('#settings-data-export');
  const backupBtn = container.querySelector('#settings-data-backup');
  const restoreBtn = container.querySelector('#settings-data-restore');

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        const exportData = {
          version: '0.3.1',
          items: Repository.getAll(),
          settings: SettingsStore.load(),
          jot: JotStore.loadJot(),
          clips: ClipsStore.getAll()
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
                if (imported.clips && Array.isArray(imported.clips)) {
                  localStorage.setItem('bench_clips', JSON.stringify(imported.clips));
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
          jot: JotStore.loadJot(),
          clips: ClipsStore.getAll()
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
            if (parsed.clips && Array.isArray(parsed.clips)) {
              localStorage.setItem('bench_clips', JSON.stringify(parsed.clips));
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