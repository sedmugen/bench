import { initializeViewManager } from './core/view-manager.js';
import { initializeShortcuts, registerShortcut } from './core/shortcuts.js';
import { showBenchGuide, showShortcutsModal } from './ui/help-modals.js';
import { QuickCapture } from './core/quick-capture.js';
import { Inspector } from './ui/inspector.js';
import { Repository } from './core/repository.js';
import { EventBus } from './core/event-bus.js';
import { ToastService } from './ui/toast.js';
import { SettingsStore } from './core/settings-store.js';
import { Platform } from './core/platform.js';

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('bench_sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }
}

function initializeWindowControls() {
  if (Platform.isTauri()) {
    const { getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
    const appWindow = getCurrentWebviewWindow();

    const minBtn = document.getElementById('win-min');
    const maxBtn = document.getElementById('win-max');
    const closeBtn = document.getElementById('win-close');

    // Function to update icon based on actual maximized state
    const updateIcon = async () => {
      if (!maxBtn) return;
      const isMax = await appWindow.isMaximized();
      if (isMax) {
        maxBtn.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <path d="M3 1 H9 V7" stroke-width="1"/>
            <rect x="1" y="3" width="6" height="6"/>
          </svg>
        `;
        maxBtn.setAttribute('aria-label', 'restore');
      } else {
        maxBtn.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor">
            <rect x="1" y="1" width="8" height="8"/>
          </svg>
        `;
        maxBtn.setAttribute('aria-label', 'maximize');
      }
    };

    if (minBtn) {
      minBtn.addEventListener('click', () => {
        appWindow.minimize();
      });
    }

    if (maxBtn) {
      maxBtn.addEventListener('click', async () => {
        await appWindow.toggleMaximize();
        updateIcon();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        appWindow.close();
      });
    }

    // Support double click on drag region to toggle maximize
    const dragRegion = document.querySelector('.title-bar-drag');
    if (dragRegion) {
      dragRegion.addEventListener('dblclick', async () => {
        await appWindow.toggleMaximize();
        updateIcon();
      });
    }

    // Update icon initially and on window resize (which happens on maximize/restore)
    updateIcon();
    window.addEventListener('resize', updateIcon);
  } else {
    console.log('Custom window controls running in browser mock mode.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Initialize platform environment detection (Tauri vs Browser)
  Platform.initialize();

  // Initialize settings storage & apply configuration rules
  SettingsStore.initialize();

  // Initialize custom window titlebar controls
  initializeWindowControls();

  // Initialize dynamic view/module routing
  initializeViewManager();

  // Initialize global and navigation keyboard shortcuts
  initializeShortcuts();

  // Header help action buttons
  const guideBtn = document.getElementById('btn-guide');
  if (guideBtn) {
    guideBtn.addEventListener('click', () => showBenchGuide());
  }

  const shortcutsBtn = document.getElementById('btn-shortcuts');
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', () => showShortcutsModal());
  }

  const sidebar = document.querySelector('.sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  
  // Track previous breakpoint states
  let wasAbove900 = window.innerWidth >= 900;
  let wasAbove700 = window.innerWidth >= 700;

  function handleWindowResize() {
    const width = window.innerWidth;

    // Narrow breakpoint (< 900px): Automatically close Inspector when transitioning from wide
    if (width < 900 && wasAbove900) {
      if (Inspector.isOpen()) {
        EventBus.emit('itemSelected', null);
      }
    }

    // Very narrow breakpoint (< 700px): Force collapse sidebar to icon-only mode
    if (sidebar) {
      if (width < 700) {
        sidebar.classList.add('collapsed');
      } else if (width >= 700 && !wasAbove700) {
        const isCollapsed = localStorage.getItem('bench_sidebar_collapsed') === 'true';
        if (isCollapsed) {
          sidebar.classList.add('collapsed');
        } else {
          sidebar.classList.remove('collapsed');
        }
      }
    }

    wasAbove900 = width >= 900;
    wasAbove700 = width >= 700;
  }

  // Restore persisted sidebar collapsed state on startup (if width allows)
  if (sidebar && window.innerWidth >= 700) {
    const isCollapsed = localStorage.getItem('bench_sidebar_collapsed') === 'true';
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
    }
  }

  window.addEventListener('resize', handleWindowResize);
  // Apply initial breakpoint state
  handleWindowResize();

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      toggleSidebar();
    });
  }

  // Register Ctrl+L / Cmd+L and Ctrl+B / Cmd+B shortcuts to toggle sidebar
  registerShortcut('ctrl+l', () => toggleSidebar());
  registerShortcut('meta+l', () => toggleSidebar());
  registerShortcut('ctrl+b', () => toggleSidebar());
  registerShortcut('meta+b', () => toggleSidebar());

  // Register Quick Capture shortcuts
  registerShortcut('ctrl+n', () => QuickCapture.open());
  registerShortcut('meta+n', () => QuickCapture.open());
  registerShortcut('c', () => QuickCapture.open());

  // Wire Area resolver for the Inspector to decouple it from storage
  Inspector.resolveAreaName = (areaId) => {
    const areas = Repository.getAreas();
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : null;
  };

  Inspector.resolveAreas = () => {
    return Repository.getActiveAreas();
  };

  Inspector.resolveActiveCount = (areaId) => {
    return Repository.getAll().filter(item => 
      item.type !== 'area' && 
      item.areaId === areaId && 
      item.module !== 'archive'
    ).length;
  };

  // Initialize Inspector panel
  Inspector.init();

  // Application-layer persistence bridge:
  // Inspector emits inspectorUpdate events, this listener calls Repository
  EventBus.on('inspectorUpdate', ({ id, field, value }) => {
    const items = Repository.getAll();
    const item = items.find(i => i.id === id);
    if (item && item.type === 'area') {
      if (field === 'name') {
        const name = value.trim();
        if (!name) {
          ToastService.show('Area name is required.', 'error');
          EventBus.emit('itemSelected', item);
          return;
        }
        if (name.length > 50) {
          ToastService.show('Area name must be 50 characters or less.', 'error');
          EventBus.emit('itemSelected', item);
          return;
        }
        const duplicate = items.some(i => i.type === 'area' && i.id !== id && i.name.toLowerCase() === name.toLowerCase());
        if (duplicate) {
          ToastService.show('An Area with this name already exists.', 'error');
          EventBus.emit('itemSelected', item);
          return;
        }
      }
    }
    Repository.update(id, { [field]: value });
  });

  // Flush pending Inspector saves on window close / tab close
  window.addEventListener('beforeunload', () => {
    Inspector.flushPendingSaves();
  });

  console.log('Bench application shell successfully initialized.');
});
