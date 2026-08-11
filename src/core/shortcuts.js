import { navigateTo } from './view-manager.js';
import { CommandPalette } from './command-palette.js';

// Dictionary of registered key combinations and their callbacks
const shortcutRegistry = {};

/**
 * Register a callback for a specific keyboard shortcut combination.
 * Format examples: 'alt+1', 'ctrl+k', 'alt+shift+a'
 */
export function registerShortcut(keyCombo, callback) {
  const normalizedCombo = keyCombo.toLowerCase().replace(/\s+/g, '');
  shortcutRegistry[normalizedCombo] = callback;
}

/**
 * Handle keydown events and match them against registered shortcuts.
 */
function handleKeyDown(event) {
  // Avoid capturing shortcuts if the user is typing in a text field
  const activeEl = document.activeElement;
  const isTextInput = activeEl && (
    activeEl.tagName === 'INPUT' || 
    activeEl.tagName === 'TEXTAREA' || 
    activeEl.isContentEditable
  );

  // Allow command palette triggers even inside input fields
  const isPaletteShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

  if (isTextInput && !isPaletteShortcut && !event.altKey && !event.ctrlKey && !event.metaKey) {
    return;
  }

  const comboParts = [];
  if (event.ctrlKey) comboParts.push('ctrl');
  if (event.altKey) comboParts.push('alt');
  if (event.shiftKey) comboParts.push('shift');
  if (event.metaKey) comboParts.push('meta');

  let keyName = event.key.toLowerCase();
  if (keyName === ' ') keyName = 'space';

  // Avoid pushing duplicate modifier keynames if they are the primary key pressed (e.g. pressing Alt itself)
  if (!['control', 'alt', 'shift', 'meta'].includes(keyName)) {
    comboParts.push(keyName);
  } else {
    // If only modifier is pressed, don't trigger anything yet
    return;
  }

  const comboString = comboParts.join('+');

  if (shortcutRegistry[comboString]) {
    event.preventDefault();
    shortcutRegistry[comboString](event);
  }
}

/**
 * Initialize global event listener and register core navigation shortcuts.
 */
export function initializeShortcuts() {
  window.addEventListener('keydown', handleKeyDown);

  // Pre-register navigation shortcuts (Alt + 1 to 6)
  registerShortcut('alt+1', () => navigateTo('focus'));
  registerShortcut('alt+2', () => navigateTo('capture'));
  registerShortcut('alt+3', () => navigateTo('areas'));
  registerShortcut('alt+4', () => navigateTo('parking-lot'));
  registerShortcut('alt+5', () => navigateTo('archive'));
  registerShortcut('alt+6', () => navigateTo('jot'));
  registerShortcut('alt+7', () => navigateTo('settings'));
  registerShortcut('alt+8', () => navigateTo('recap'));

  // Pre-register Command Palette shortcuts
  registerShortcut('ctrl+k', () => CommandPalette.toggle());
  registerShortcut('meta+k', () => CommandPalette.toggle());

  console.log('Keyboard shortcuts initialized: Alt+1 to Alt+7 navigate; Ctrl+K opens Command Palette.');
}
