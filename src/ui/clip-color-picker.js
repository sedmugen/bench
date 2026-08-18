/**
 * Clip Color Picker
 * Floating contextual popover to pick individual clip card note colors.
 */

export const CLIP_COLORS = [
  { id: 'default', name: 'Default', hex: 'var(--color-text-muted)', bg: 'transparent', label: 'Default' },
  { id: 'red', name: 'Red', hex: '#f7768e', bg: 'rgba(247, 118, 142, 0.12)', label: 'Red' },
  { id: 'orange', name: 'Orange', hex: '#ff9e64', bg: 'rgba(255, 158, 100, 0.12)', label: 'Orange' },
  { id: 'amber', name: 'Amber', hex: '#e0af68', bg: 'rgba(224, 175, 104, 0.12)', label: 'Amber' },
  { id: 'yellow', name: 'Yellow', hex: '#eed49f', bg: 'rgba(238, 212, 159, 0.12)', label: 'Yellow' },
  { id: 'lime', name: 'Lime', hex: '#a6da95', bg: 'rgba(166, 218, 149, 0.12)', label: 'Lime' },
  { id: 'green', name: 'Green', hex: '#9ece6a', bg: 'rgba(158, 206, 106, 0.12)', label: 'Green' },
  { id: 'teal', name: 'Teal', hex: '#73daca', bg: 'rgba(115, 218, 202, 0.12)', label: 'Teal' },
  { id: 'cyan', name: 'Cyan', hex: '#7dcfff', bg: 'rgba(125, 207, 255, 0.12)', label: 'Cyan' },
  { id: 'blue', name: 'Blue', hex: '#7aa2f7', bg: 'rgba(122, 162, 247, 0.12)', label: 'Blue' },
  { id: 'indigo', name: 'Indigo', hex: '#8caaee', bg: 'rgba(140, 170, 238, 0.12)', label: 'Indigo' },
  { id: 'purple', name: 'Purple', hex: '#bb9af7', bg: 'rgba(187, 154, 247, 0.12)', label: 'Purple' },
  { id: 'pink', name: 'Pink', hex: '#f678b4', bg: 'rgba(246, 120, 180, 0.12)', label: 'Pink' },
  { id: 'brown', name: 'Brown', hex: '#cf9c7c', bg: 'rgba(207, 156, 124, 0.12)', label: 'Brown' },
  { id: 'gray', name: 'Gray', hex: '#6c7086', bg: 'rgba(108, 112, 134, 0.12)', label: 'Gray' }
];

/**
 * Open floating color picker next to trigger element.
 * @param {Event|HTMLElement} trigger - Trigger click event or DOM element
 * @param {string} currentColor - Currently active color id
 * @param {Function} onSelect - Callback receiving selected color id (e.g. 'blue', 'default')
 */
export function openClipColorPicker(trigger, currentColor = 'default', onSelect) {
  if (trigger && typeof trigger.stopPropagation === 'function') {
    trigger.stopPropagation();
  }

  // Remove existing color pickers
  const existing = document.querySelector('.clip-color-picker-popover');
  if (existing) existing.remove();

  const triggerEl = trigger && trigger.currentTarget ? trigger.currentTarget : (trigger instanceof HTMLElement ? trigger : document.body);
  const rect = triggerEl.getBoundingClientRect();

  const popover = document.createElement('div');
  popover.className = 'clip-color-picker-popover';
  popover.setAttribute('role', 'dialog');
  popover.setAttribute('aria-label', 'Select note color');

  // Position popover
  const popoverWidth = 190;
  const leftPos = Math.min(Math.max(10, rect.left + window.scrollX - 40), window.innerWidth - popoverWidth - 20);
  
  // Decide whether to pop above or below
  if (rect.bottom + 140 > window.innerHeight && rect.top > 140) {
    popover.style.bottom = `${window.innerHeight - rect.top + 6}px`;
  } else {
    popover.style.top = `${rect.bottom + window.scrollY + 6}px`;
  }
  popover.style.left = `${leftPos}px`;

  const header = document.createElement('div');
  header.className = 'clip-color-picker-header';
  header.textContent = 'Note Color';
  popover.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'clip-color-picker-grid';

  const swatches = [];

  CLIP_COLORS.forEach((color, idx) => {
    const swatch = document.createElement('button');
    const isSelected = (currentColor || 'default') === color.id;
    swatch.className = `clip-color-swatch color-${color.id} ${isSelected ? 'selected' : ''}`;
    swatch.title = color.name;
    swatch.setAttribute('aria-label', color.name);
    swatch.setAttribute('data-color', color.id);
    swatch.setAttribute('tabindex', '0');

    if (color.id === 'default') {
      swatch.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    } else {
      swatch.style.backgroundColor = color.hex;
      if (isSelected) {
        swatch.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
      }
    }

    swatch.addEventListener('click', (e) => {
      e.stopPropagation();
      cleanup();
      if (typeof onSelect === 'function') {
        onSelect(color.id);
      }
    });

    grid.appendChild(swatch);
    swatches.push(swatch);
  });

  popover.appendChild(grid);
  document.body.appendChild(popover);

  const activeSwatch = swatches.find(s => s.classList.contains('selected')) || swatches[0];
  if (activeSwatch) {
    setTimeout(() => activeSwatch.focus(), 0);
  }

  function cleanup() {
    popover.remove();
    document.removeEventListener('mousedown', handleOutsideClick);
    document.removeEventListener('keydown', handleKeydown);
  }

  function handleOutsideClick(e) {
    if (!popover.contains(e.target) && !triggerEl.contains(e.target)) {
      cleanup();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cleanup();
      if (typeof triggerEl.focus === 'function') triggerEl.focus();
      return;
    }

    const currentFocused = document.activeElement;
    const curIdx = swatches.indexOf(currentFocused);
    if (curIdx === -1) return;

    const cols = 5;
    let nextIdx = curIdx;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIdx = (curIdx + 1) % swatches.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIdx = (curIdx - 1 + swatches.length) % swatches.length;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = curIdx + cols < swatches.length ? curIdx + cols : curIdx;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = curIdx - cols >= 0 ? curIdx - cols : curIdx;
    }

    if (nextIdx !== curIdx) {
      swatches[nextIdx].focus();
    }
  }

  setTimeout(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeydown);
  }, 0);
}
