import { ModuleRegistry } from './module-registry.js';
import { renderFocusView } from '../modules/focus-view.js';
import { renderCaptureView } from '../modules/capture-view.js';
import { renderAreasView } from '../modules/areas-view.js';
import { renderParkingLotView } from '../modules/parking-lot-view.js';
import { renderArchiveView } from '../modules/archive-view.js';
import { renderSettingsView } from '../modules/settings-view.js';
import { renderJotView } from '../modules/jot-view.js';
import { renderRecapView } from '../modules/recap-view.js';
import { renderClipsView } from '../modules/clips-view.js';
import { Inspector } from '../ui/inspector.js';
import { EventBus } from './event-bus.js';
import { SettingsStore } from './settings-store.js';

// Mapping of module names to their titles and render functions
const viewMap = {
  'focus': { title: 'Focus', render: renderFocusView },
  'capture': { title: 'Capture', render: renderCaptureView },
  'areas': { title: 'Areas', render: renderAreasView },
  'parking-lot': { title: 'Parking Lot', render: renderParkingLotView },
  'archive': { title: 'Archive', render: renderArchiveView },
  'settings': { title: 'Settings', render: renderSettingsView },
  'jot': { title: 'Jot', render: renderJotView },
  'recap': { title: 'Log', render: renderRecapView },
  'clips': { title: 'Clips', render: renderClipsView }
};

const initialSettings = SettingsStore.load();
let activeModule = initialSettings.rememberLastModule 
  ? (initialSettings.lastOpenedModule || 'focus') 
  : (initialSettings.startupModule || 'focus');
let switchViewFn = null;
let viewTitleEl = null;

export function setViewTitle(title, breadcrumb = null) {
  if (!viewTitleEl) return;
  const activeTarget = viewMap[activeModule];
  if (activeTarget && title !== activeTarget.title) {
    // Ignore updates from unmounted/inactive views
    return;
  }

  const currentSettings = SettingsStore.load();
  const graphicMarkup = ModuleRegistry.renderGraphic(activeModule, currentSettings.navigationIconStyle || 'bench-symbols');

  const mainTitleHtml = `<span class="view-title-graphic">${graphicMarkup}</span><span class="view-title-text">${title}</span>`;

  if (breadcrumb) {
    viewTitleEl.innerHTML = `${mainTitleHtml} <span style="color: var(--color-text-muted); font-weight: normal; margin: 0 6px;">&gt;</span> ${breadcrumb}`;
  } else {
    viewTitleEl.innerHTML = mainTitleHtml;
  }
}

export function initializeViewManager() {
  const navItems = document.querySelectorAll('.nav-item');
  const activeViewContainer = document.getElementById('active-view');
  viewTitleEl = document.getElementById('view-title');

  if (!activeViewContainer || !viewTitleEl) {
    console.error('View manager initialization failed: layout elements not found.');
    return;
  }

  // Listen to breadcrumb/title changes from views
  EventBus.on('viewTitleChanged', ({ title, breadcrumb }) => {
    setViewTitle(title, breadcrumb);
  });

  // Listen to navigation icon style changes from settings
  EventBus.on('navigationIconStyleChanged', () => {
    const activeTarget = viewMap[activeModule];
    if (activeTarget) {
      setViewTitle(activeTarget.title);
    }
  });

  // Switches the active module state and re-renders the UI
  function switchView(moduleId) {
    const targetView = viewMap[moduleId];
    if (!targetView) {
      console.warn(`View renderer for module "${moduleId}" does not exist.`);
      return;
    }

    activeModule = moduleId;

    // Persist last opened module state if enabled
    const currentSettings = SettingsStore.load();
    if (currentSettings.rememberLastModule) {
      currentSettings.lastOpenedModule = moduleId;
      SettingsStore.save(currentSettings);
    }

    // Flush pending Inspector saves and close it before switching views
    Inspector.flushPendingSaves();
    EventBus.emit('itemSelected', null);

    // Update title
    setViewTitle(targetView.title);

    // Update active class in sidebar nav items
    navItems.forEach(item => {
      if (item.getAttribute('data-module') === moduleId) {
        item.classList.add('active');
        item.focus(); // Shift focus for accessibility/keyboard comfort
      } else {
        item.classList.remove('active');
      }
    });

    // Clear and render new content
    activeViewContainer.innerHTML = '';
    targetView.render(activeViewContainer);
  }

  // Bind click handlers to navigation items
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const moduleId = item.getAttribute('data-module');
      switchView(moduleId);
    });
  });

  // Load the default initial view
  switchView(activeModule);

  // Expose switchView to global module scope so shortcuts can trigger it
  switchViewFn = switchView;
}

export function navigateTo(moduleId) {
  if (switchViewFn) {
    switchViewFn(moduleId);
  }
}

export function getActiveModule() {
  return activeModule;
}
