import { ModuleRegistry } from './module-registry.js';
import { EventBus } from './event-bus.js';

const STORAGE_KEY = 'bench_settings';

const DEFAULT_SETTINGS = {
  useSystemTheme: false,
  themeLevel: 1,
  theme: 'dark',
  accentColor: 'blue',
  compactMode: false,
  fontSize: 'medium',
  reduceAnimations: false,
  clipTaskTitles: true,
  shortcutStyle: (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)) ? 'mac' : 'windows',
  navigationIconStyle: 'bench-symbols',
  
  // Behavior
  confirmDelete: true,
  confirmArchive: false,
  startupModule: 'focus',
  rememberLastModule: false,
  lastOpenedModule: 'focus',
  showSidebarShortcuts: true,
  showHeaderUtilityButtons: true,
  
  // Focus
  autoClearCompleted: false,
  
  // Areas
  confirmArchiveArea: true,
  defaultArea: 'none',
  enableAreaTaskStatusTints: true,
  
  // Jot
  jotFontFamily: 'monospace',
  jotFontSize: 'normal',
  jotLineHeight: 'normal',
  jotTabSize: 'tab',
  jotWordWrap: true,
  jotSpellCheck: false,
  jotAutoSave: true,
  jotShowLineNumbers: false,
  jotSmartLists: true,
  jotDefaultViewMode: 'edit',
  jotEditorWidth: 'full',
  jotShowFormattingToolbar: true,
  enableJotFormatting: true,
  enableJotMarkdown: true,

  // Log
  logDefaultViewMode: 'calendar',

  // Clips
  clipsDefaultView: 'grid',
  clipsDefaultSort: 'updated-desc',
  clipsShowPreviews: true,
  clipsConfirmDelete: true,
  clipsDefaultColor: 'default',

  // Data Management
  lastExportLocation: ''
};

export const SettingsStore = {
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  },

  save(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      this.apply(settings);
      EventBus.emit('settingsChanged', settings);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  apply(settings) {
    const root = document.documentElement;

    // Apply Theme
    let useSystem = settings.useSystemTheme;
    if (useSystem === undefined) {
      useSystem = settings.theme === 'system';
    }

    if (useSystem) {
      const isDark = (typeof window !== 'undefined' && window.matchMedia) ? window.matchMedia('(prefers-color-scheme: dark)').matches : true;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      let level = settings.themeLevel;
      if (level === undefined || level === null) {
        if (settings.theme === 'light') level = 6;
        else if (settings.theme === 'deep-dark') level = 0;
        else if (settings.theme === 'nord-dark') level = 2;
        else if (settings.theme === 'neutral-dark') level = 3;
        else if (settings.theme === 'sand-light') level = 4;
        else if (settings.theme === 'neutral-light') level = 5;
        else level = 1;
      }
      const themeMap = ['deep-dark', 'dark', 'nord-dark', 'neutral-dark', 'sand-light', 'neutral-light', 'light'];
      const selectedTheme = themeMap[level] !== undefined ? themeMap[level] : 'dark';
      root.setAttribute('data-theme', selectedTheme);
    }

    // Apply Accent Color
    root.setAttribute('data-accent', settings.accentColor || 'blue');

    // Apply Compact Mode
    root.setAttribute('data-compact', settings.compactMode ? 'true' : 'false');

    // Apply Font Size
    root.setAttribute('data-font-size', settings.fontSize);

    // Apply Reduce Animations
    root.setAttribute('data-reduce-animations', settings.reduceAnimations ? 'true' : 'false');

    // Apply Sidebar Shortcuts visibility
    root.setAttribute('data-sidebar-shortcuts', settings.showSidebarShortcuts === false ? 'false' : 'true');

    // Apply Area Task Status Tints
    root.setAttribute('data-area-status-tints', settings.enableAreaTaskStatusTints !== false ? 'true' : 'false');

    // Apply Task Title Clipping
    root.setAttribute('data-clip-titles', settings.clipTaskTitles !== false ? 'true' : 'false');

    // Apply Header Utility Buttons visibility
    root.setAttribute('data-header-utility-buttons', settings.showHeaderUtilityButtons !== false ? 'true' : 'false');

    // Apply Jot Font Family
    const fontMap = {
      'jetbrains-mono': "'JetBrains Mono', monospace",
      'monospace': "'JetBrains Mono', monospace",
      'fira-code': "'Fira Code', monospace",
      'source-code-pro': "'Source Code Pro', monospace",
      'inter': "'Inter', sans-serif",
      'sans-serif': "'Inter', sans-serif",
      'system': 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'lora': "'Lora', serif",
      'serif': "'Lora', serif",
      'merriweather': "'Merriweather', serif"
    };
    const fontVal = fontMap[settings.jotFontFamily] || fontMap['monospace'];
    root.style.setProperty('--font-jot', fontVal);
    root.setAttribute('data-jot-font-family', settings.jotFontFamily || 'monospace');
    root.setAttribute('data-jot-width', settings.jotEditorWidth || 'full');
    root.setAttribute('data-jot-font-size', settings.jotFontSize || 'normal');
    root.setAttribute('data-jot-line-height', settings.jotLineHeight || 'normal');
    root.setAttribute('data-jot-word-wrap', settings.jotWordWrap !== false ? 'true' : 'false');

    // Apply Shortcut Style
    this.applyShortcutStyle(settings.shortcutStyle || 'windows');

    // Apply Navigation Icon Style (Bench Symbols vs Classic Icons)
    this.applyNavigationIconStyle(settings.navigationIconStyle || 'bench-symbols');
  },

  applyNavigationIconStyle(style = 'bench-symbols') {
    if (typeof document === 'undefined') return;
    const mode = style === 'classic-icons' ? 'classic-icons' : 'bench-symbols';
    document.documentElement.setAttribute('data-nav-icon-style', mode);

    ModuleRegistry.getAllModules().forEach(mod => {
      const item = document.querySelector(`.sidebar-nav-primary .nav-item[data-module="${mod.id}"]`);
      if (item) {
        const iconBox = item.querySelector('.nav-icon-container');
        if (iconBox) {
          iconBox.innerHTML = ModuleRegistry.renderGraphic(mod.id, mode);
        }
      }
    });

    EventBus.emit('navigationIconStyleChanged', { style: mode });
  },

  applyShortcutStyle(style) {
    if (typeof document === 'undefined') return;
    const isMac = style === 'mac';

    // Update sidebar nav items navigation shortcuts
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item[data-module]');
    navItems.forEach(item => {
      const shortcutSpan = item.querySelector('.nav-shortcut');
      if (shortcutSpan) {
        const moduleName = item.getAttribute('data-module');
        const numMap = {
          'focus': 1,
          'capture': 2,
          'areas': 3,
          'parking-lot': 4,
          'archive': 5,
          'jot': 6,
          'recap': 7,
          'clips': 8
        };
        const num = numMap[moduleName];
        if (num) {
          shortcutSpan.textContent = isMac ? `⌥${num}` : `Alt+${num}`;
        } else if (moduleName === 'settings') {
          shortcutSpan.textContent = isMac ? '⌘J' : 'Ctrl+J';
        }
      }
    });

    // Update Toggle Sidebar button shortcut
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      const shortcutSpan = toggleBtn.querySelector('.nav-shortcut');
      if (shortcutSpan) {
        shortcutSpan.textContent = isMac ? '⌘L' : 'Ctrl+L';
      }
    }
  },

  initialize() {
    const settings = this.load();
    this.apply(settings);

    // Listen to system theme changes if using system theme
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const current = this.load();
        if (current.useSystemTheme || current.theme === 'system') {
          this.apply(current);
        }
      });
    }
  }
};
