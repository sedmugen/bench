const STORAGE_KEY = 'bench_settings';

const DEFAULT_SETTINGS = {
  theme: 'system',
  accentColor: 'blue',
  compactMode: false,
  fontSize: 'medium',
  reduceAnimations: false,
  clipTaskTitles: true,
  shortcutStyle: (typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)) ? 'mac' : 'windows',
  
  // Behavior
  confirmDelete: true,
  confirmArchive: false,
  startupModule: 'focus',
  rememberLastModule: false,
  lastOpenedModule: 'focus',
  showSidebarShortcuts: true,
  
  // Focus
  autoClearCompleted: false,
  
  // Areas
  confirmArchiveArea: true,
  defaultArea: 'none',
  enableAreaTaskStatusTints: true,
  
  // Jot
  jotFontFamily: 'monospace',
  jotTabSize: 'tab',
  jotAutoSave: true,
  jotShowLineNumbers: false,
  jotDefaultViewMode: 'edit',
  jotShowFormattingToolbar: true,
  enableJotFormatting: true,
  enableJotMarkdown: true
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
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  apply(settings) {
    const root = document.documentElement;

    // Apply Theme
    if (settings.theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (settings.theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      // System
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
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

    // Apply Shortcut Style
    this.applyShortcutStyle(settings.shortcutStyle || 'windows');
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
          'recap': 7
        };
        const num = numMap[moduleName];
        if (num) {
          shortcutSpan.textContent = isMac ? `⌥${num}` : `Alt+${num}`;
        } else if (moduleName === 'settings') {
          shortcutSpan.textContent = isMac ? '⌘,' : 'Ctrl+,';
        }
      }
    });

    // Update Palette button shortcut
    const paletteBtn = document.getElementById('sidebar-palette-btn');
    if (paletteBtn) {
      const shortcutSpan = paletteBtn.querySelector('.nav-shortcut');
      if (shortcutSpan) {
        shortcutSpan.textContent = isMac ? '⌘K' : 'Ctrl+K';
      }
    }

    // Update Toggle Sidebar button shortcut
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) {
      const shortcutSpan = toggleBtn.querySelector('.nav-shortcut');
      if (shortcutSpan) {
        shortcutSpan.textContent = isMac ? '⌘B' : 'Ctrl+B';
      }
    }
  },

  initialize() {
    const settings = this.load();
    this.apply(settings);

    // Listen to system theme changes if using 'system' theme
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const current = this.load();
      if (current.theme === 'system') {
        this.apply(current);
      }
    });
  }
};
