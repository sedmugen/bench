import { Repository } from '../core/repository.js';

/**
 * Get a valid, visible trigger element for dropdown positioning.
 * Falls back to task-more-btn, task-item, or document.body if target is hidden.
 */
function getVisibleTrigger(e) {
  if (e && e instanceof HTMLElement) {
    const rect = e.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return e;
  }
  let el = e?.currentTarget || e?.target;
  if (el && el instanceof HTMLElement) {
    const rect = el.getBoundingClientRect();
    if (rect.width > 0 || rect.height > 0) return el;

    const taskItem = el.closest('.task-item');
    if (taskItem) {
      const moreBtn = taskItem.querySelector('.task-more-btn');
      if (moreBtn && moreBtn.getBoundingClientRect().width > 0) return moreBtn;
      return taskItem;
    }
  }
  return document.body;
}

/**
 * Open floating Area picker dropdown next to active trigger element.
 * @param {Event|HTMLElement} e - Click event or trigger element
 * @param {object} item - Item that is being assigned
 * @param {Function} onSelect - Callback when an area is selected or cleared
 */
export function openAreaPicker(e, item, onSelect) {
  if (e && e.stopPropagation) e.stopPropagation();

  // Remove existing dropdowns
  const existing = document.querySelector('.area-picker-dropdown');
  if (existing) existing.remove();

  const triggerEl = getVisibleTrigger(e);
  const rect = triggerEl.getBoundingClientRect();
  const picker = document.createElement('div');
  picker.className = 'area-picker-dropdown';

  const areasList = Repository.getActiveAreas();

  const closeAndRemove = () => {
    picker.remove();
    document.removeEventListener('mousedown', closePicker);
    document.removeEventListener('keydown', handleKeydown);
  };

  if (areasList.length === 0) {
    const disabledItem = document.createElement('div');
    disabledItem.className = 'area-picker-item disabled';
    disabledItem.textContent = 'No Areas created';
    picker.appendChild(disabledItem);
  } else {
    // [None] selection to un-assign the area
    const noneItem = document.createElement('div');
    noneItem.className = 'area-picker-item';
    noneItem.textContent = '[None]';
    noneItem.addEventListener('click', (evt) => {
      evt.stopPropagation();
      onSelect(null);
      closeAndRemove();
    });
    picker.appendChild(noneItem);

    areasList.forEach(area => {
      const el = document.createElement('div');
      el.className = 'area-picker-item';
      el.textContent = `[${area.name}]`;
      if (item.areaId === area.id) {
        el.classList.add('active');
      }
      el.addEventListener('click', (evt) => {
        evt.stopPropagation();
        onSelect(area.id);
        closeAndRemove();
      });
      picker.appendChild(el);
    });
  }

  document.body.appendChild(picker);

  // Position and clamp within viewport
  const pickerWidth = picker.offsetWidth || 140;
  const pickerHeight = picker.offsetHeight || 120;

  let top = rect.bottom + window.scrollY + 2;
  let left = rect.left + window.scrollX;

  // Flip upward if overflowing bottom viewport edge
  if (rect.bottom + pickerHeight > window.innerHeight && rect.top - pickerHeight > 0) {
    top = rect.top + window.scrollY - pickerHeight - 2;
  }

  // Clamp within right viewport edge
  if (left + pickerWidth > window.innerWidth - 10) {
    left = window.innerWidth - pickerWidth - 10;
  }

  // Clamp within left viewport edge
  left = Math.max(10, left);

  picker.style.top = `${top}px`;
  picker.style.left = `${left}px`;

  // Close dropdown on click outside
  const closePicker = (event) => {
    if (!picker.contains(event.target) && event.target !== triggerEl) {
      closeAndRemove();
    }
  };

  // Close dropdown on Escape key
  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closeAndRemove();
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', closePicker);
    document.addEventListener('keydown', handleKeydown);
  }, 0);
}
