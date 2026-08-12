/**
 * Shared task-row builder.
 *
 * Produces a consistent .task-item DOM element for use across Focus, Capture,
 * Parking Lot, and Archive. Context-awareness is expressed via the `options`
 * object — only relevant action buttons should be passed in per module.
 *
 * Usage:
 *   const row = buildTaskRow(task, {
 *     isSelected:     boolean,
 *     showCheckbox:   boolean,
 *     timeText:       string | null,      // e.g. "19d ago", "parked 2d ago"
 *     showAreaBadge:  boolean,            // show [Area Name] as secondary metadata
 *     actions:        Array<HTMLElement>, // contextual buttons (module-specific)
 *     onSelect:       (id) => void,
 *     onToggle:       (id) => void,       // checkbox / completion toggle
 *   });
 *
 * The shared row DOES NOT contain any business logic.
 * Business logic (toggleFocus, archiveItem, etc.) lives in each module file.
 */

import { Repository } from '../core/repository.js';
import { createCheckbox } from './checkbox.js';

/**
 * Build a standard task row element.
 *
 * @param {Object}  task              - Task data object from Repository.
 * @param {Object}  options
 * @param {boolean} [options.isSelected=false]   - Whether this row is selected.
 * @param {boolean} [options.showCheckbox=true]  - Whether to render the completion checkbox.
 * @param {string|null} [options.timeText=null]  - Secondary metadata text (age/date). Null hides it.
 * @param {boolean} [options.showAreaBadge=false]- Whether to display the [Area Name] badge inline.
 * @param {HTMLElement[]} [options.actions=[]]   - Contextual action buttons (appear on hover/select).
 * @param {Function} [options.onSelect]          - Called with task.id when the row is clicked.
 * @param {Function} [options.onToggle]          - Called with task.id when checkbox is toggled.
 * @returns {HTMLDivElement}
 */
export function buildTaskRow(task, options = {}) {
  const {
    isSelected = false,
    showCheckbox = true,
    timeText = null,
    showAreaBadge = false,
    actions = [],
    onSelect = null,
    onToggle = null,
  } = options;

  const isCompleted = task.status === 'completed';
  const isFocused   = task.focused && task.status === 'active';

  // --- Root row element ---
  const row = document.createElement('div');
  row.className = 'task-item';
  row.setAttribute('data-id', task.id);

  if (isCompleted) {
    row.classList.add('completed');
    row.setAttribute('role', 'listitem');
    row.setAttribute('tabindex', '-1');
  } else {
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    row.setAttribute('tabindex', '0');
    if (isSelected)  row.classList.add('selected');
  }

  if (isFocused) row.classList.add('focused');

  // --- Checkbox ---
  if (showCheckbox) {
    row.appendChild(createCheckbox({
      checked: isCompleted,
      onChange: () => { if (onToggle) onToggle(task.id); }
    }));
  }

  // --- Content column (Title + optional Area subtext underneath) ---
  const contentCol = document.createElement('div');
  contentCol.className = 'task-content';

  const titleSpan = document.createElement('span');
  titleSpan.className = 'task-title';
  titleSpan.appendChild(document.createTextNode(task.title || ''));
  contentCol.appendChild(titleSpan);

  if (showAreaBadge && task.areaId) {
    const area = Repository.getAreas().find(a => a.id === task.areaId);
    if (area) {
      const areaSubtext = document.createElement('span');
      areaSubtext.className = 'task-area-subtext';
      areaSubtext.textContent = `· ${area.name}`;
      contentCol.appendChild(areaSubtext);
    }
  }

  row.appendChild(contentCol);

  // --- Time metadata (secondary, right-aligned) ---
  if (timeText) {
    const timeBadge = document.createElement('span');
    timeBadge.className = 'task-time-meta';
    timeBadge.textContent = timeText;
    row.appendChild(timeBadge);
  }

  // --- Contextual actions (hidden by default; revealed on hover/select via CSS) ---
  if (actions.length > 0) {
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'task-actions';

    // Inline actions (visible on wide rows)
    const inlineWrap = document.createElement('div');
    inlineWrap.className = 'task-actions-inline';
    actions.forEach(btn => inlineWrap.appendChild(btn));
    actionsWrap.appendChild(inlineWrap);

    // Compact overflow (···) for narrow rows — driven by container query in CSS
    const moreWrap = document.createElement('div');
    moreWrap.className = 'task-actions-more';

    const moreBtn = document.createElement('button');
    moreBtn.className = 'action-btn task-more-btn';
    moreBtn.setAttribute('tabindex', '-1');
    moreBtn.setAttribute('aria-label', 'More task actions');
    moreBtn.textContent = '···';
    moreBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openTaskActionMenu(e, actions);
    });
    moreWrap.appendChild(moreBtn);
    actionsWrap.appendChild(moreWrap);

    row.appendChild(actionsWrap);
  }

  // --- Click handler ---
  if (!isCompleted && onSelect) {
    row.addEventListener('click', () => onSelect(task.id));
  }

  return row;
}

/**
 * Open a floating contextual action menu.
 * Reuses the same floating-menu pattern as task-action-menu.js.
 * Kept here as a local copy so this module is self-contained.
 */
function openTaskActionMenu(e, actionButtons) {
  e.stopPropagation();

  const existing = document.querySelector('.task-action-menu');
  if (existing) existing.remove();

  const triggerEl = e.currentTarget || e.target;
  const rect = triggerEl.getBoundingClientRect();

  const menu = document.createElement('div');
  menu.className = 'task-action-menu';

  const leftPos = Math.min(rect.left + window.scrollX, window.innerWidth - 130);
  menu.style.top  = `${rect.bottom + window.scrollY + 2}px`;
  menu.style.left = `${Math.max(10, leftPos)}px`;

  actionButtons.forEach(btn => {
    const item = document.createElement('button');
    item.className = 'task-action-menu-item';
    if (btn.classList.contains('btn-danger')) item.classList.add('btn-danger');
    if (btn.classList.contains('active'))     item.classList.add('active');
    item.textContent = btn.textContent;
    item.addEventListener('click', (evt) => {
      evt.stopPropagation();
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', handleKeydown);
      btn.click();
    });
    menu.appendChild(item);
  });

  document.body.appendChild(menu);

  const closeMenu = (evt) => {
    if (!menu.contains(evt.target) && !triggerEl.contains(evt.target)) {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', handleKeydown);
    }
  };

  const handleKeydown = (evt) => {
    if (evt.key === 'Escape') {
      menu.remove();
      document.removeEventListener('mousedown', closeMenu);
      document.removeEventListener('keydown', handleKeydown);
    }
  };

  setTimeout(() => {
    document.addEventListener('mousedown', closeMenu);
    document.addEventListener('keydown', handleKeydown);
  }, 0);
}
