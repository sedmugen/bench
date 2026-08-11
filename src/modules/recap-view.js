import { Repository } from '../core/repository.js';
import { SettingsStore } from '../core/settings-store.js';
import { EventBus } from '../core/event-bus.js';

/**
 * Log View Module
 * Supports dual views: Calendar view (date grid + daily completions) & Journal view (chronological history by date).
 */
export function renderRecapView(container) {
  container.innerHTML = '';

  const settings = SettingsStore.load();
  let currentViewMode = settings.logDefaultViewMode || 'calendar';

  const today = new Date();
  let displayYear = today.getFullYear();
  let displayMonth = today.getMonth(); // 0-indexed
  let selectedDay = today.getDate();

  const wrapper = document.createElement('div');
  wrapper.className = 'recap-container';

  // Log Header Bar (Month Nav on Left, View Switcher on Right)
  const headerBar = document.createElement('div');
  headerBar.className = 'log-header-bar';

  // Month navigation header (for Calendar view)
  const nav = document.createElement('div');
  nav.className = 'recap-month-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'recap-nav-btn';
  prevBtn.setAttribute('aria-label', 'Previous month');
  prevBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="15 18 9 12 15 6"/></svg>`;

  const monthLabel = document.createElement('span');
  monthLabel.className = 'recap-month-label';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'recap-nav-btn';
  nextBtn.setAttribute('aria-label', 'Next month');
  nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="9 18 15 12 9 6"/></svg>`;

  nav.appendChild(prevBtn);
  nav.appendChild(monthLabel);
  nav.appendChild(nextBtn);

  // View Switcher (Calendar | Journal)
  const viewSwitcher = document.createElement('div');
  viewSwitcher.className = 'log-view-switcher';
  viewSwitcher.setAttribute('role', 'tablist');
  viewSwitcher.setAttribute('aria-label', 'Log view mode switcher');

  const calendarTab = document.createElement('button');
  calendarTab.type = 'button';
  calendarTab.className = `log-view-tab ${currentViewMode === 'calendar' ? 'active' : ''}`;
  calendarTab.setAttribute('role', 'tab');
  calendarTab.setAttribute('aria-selected', currentViewMode === 'calendar' ? 'true' : 'false');
  calendarTab.textContent = 'Calendar';

  const divider = document.createElement('span');
  divider.className = 'log-view-divider';
  divider.textContent = '|';

  const journalTab = document.createElement('button');
  journalTab.type = 'button';
  journalTab.className = `log-view-tab ${currentViewMode === 'journal' ? 'active' : ''}`;
  journalTab.setAttribute('role', 'tab');
  journalTab.setAttribute('aria-selected', currentViewMode === 'journal' ? 'true' : 'false');
  journalTab.textContent = 'Journal';

  viewSwitcher.appendChild(calendarTab);
  viewSwitcher.appendChild(divider);
  viewSwitcher.appendChild(journalTab);

  headerBar.appendChild(nav);
  headerBar.appendChild(viewSwitcher);

  // Calendar View Elements
  const calendarEl = document.createElement('div');
  calendarEl.className = 'recap-calendar';

  const sectionDivider = document.createElement('div');
  sectionDivider.className = 'recap-section-divider';

  const historyEl = document.createElement('div');
  historyEl.className = 'recap-history';

  // Journal View Container
  const journalEl = document.createElement('div');
  journalEl.className = 'log-journal-container';

  wrapper.appendChild(headerBar);
  wrapper.appendChild(calendarEl);
  wrapper.appendChild(sectionDivider);
  wrapper.appendChild(historyEl);
  wrapper.appendChild(journalEl);
  container.appendChild(wrapper);

  // --- Helpers ---

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  function buildCompletionSet(year, month) {
    const items = Repository.getAll();
    const set = new Set();
    items.forEach(item => {
      if (item.type === 'area' || item.status !== 'completed') return;
      const timestamp = item.completedAt || item.updatedAt || item.createdAt;
      if (!timestamp) return;
      const d = new Date(timestamp);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }

  function getCompletedTasksForDate(year, month, day) {
    const items = Repository.getAll();
    return items.filter(item => {
      if (item.type === 'area' || item.status !== 'completed') return false;
      const timestamp = item.completedAt || item.updatedAt || item.createdAt;
      if (!timestamp) return false;
      const d = new Date(timestamp);
      return (
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getDate() === day
      );
    });
  }

  function renderHistory() {
    historyEl.innerHTML = '';

    const header = document.createElement('div');
    header.className = 'recap-history-header';

    const titleText = document.createElement('span');
    titleText.className = 'recap-history-title';
    titleText.textContent = `COMPLETED — ${monthNames[displayMonth].toUpperCase()} ${selectedDay}, ${displayYear}`;
    header.appendChild(titleText);

    historyEl.appendChild(header);

    const completedTasks = getCompletedTasksForDate(displayYear, displayMonth, selectedDay);

    if (completedTasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'recap-empty-history';
      empty.textContent = 'No tasks completed on this date.';
      historyEl.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'recap-task-list';

    // Map area IDs to names for context badges
    const areas = Repository.getAll().filter(i => i.type === 'area');
    const areaMap = new Map(areas.map(a => [a.id, a.name]));

    completedTasks.forEach(task => {
      const row = document.createElement('div');
      row.className = 'recap-task-item';

      const check = document.createElement('span');
      check.className = 'recap-task-check';
      check.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="20 6 9 17 4 12"/></svg>`;

      const title = document.createElement('span');
      title.className = 'recap-task-title';
      title.textContent = task.title;

      row.appendChild(check);
      row.appendChild(title);

      if (task.areaId && areaMap.has(task.areaId)) {
        const areaBadge = document.createElement('span');
        areaBadge.className = 'area-status-badge status-archived recap-area-badge';
        areaBadge.textContent = areaMap.get(task.areaId);
        row.appendChild(areaBadge);
      }

      list.appendChild(row);
    });

    historyEl.appendChild(list);
  }

  function renderCalendar() {
    calendarEl.innerHTML = '';

    const completedDays = buildCompletionSet(displayYear, displayMonth);
    monthLabel.textContent = `${monthNames[displayMonth]} ${displayYear}`;

    // Day-of-week headers (Monday first)
    const dayHeaders = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const headerRow = document.createElement('div');
    headerRow.className = 'recap-day-headers';
    dayHeaders.forEach(d => {
      const cell = document.createElement('span');
      cell.className = 'recap-day-header';
      cell.textContent = d;
      headerRow.appendChild(cell);
    });
    calendarEl.appendChild(headerRow);

    const divider = document.createElement('div');
    divider.className = 'recap-grid-divider';
    calendarEl.appendChild(divider);

    // Build day grid
    const grid = document.createElement('div');
    grid.className = 'recap-grid';

    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6

    // Clamp selectedDay if month has fewer days
    if (selectedDay > lastDay.getDate()) {
      selectedDay = lastDay.getDate();
    }

    // Leading blank cells (prev month overflow)
    const prevMonthLastDay = new Date(displayYear, displayMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'recap-day other-month';
      
      const dayNum = document.createElement('span');
      dayNum.className = 'recap-day-num';
      dayNum.textContent = prevMonthLastDay - i;
      cell.appendChild(dayNum);

      grid.appendChild(cell);
    }

    // Current month days
    const isCurrentMonth =
      displayYear === today.getFullYear() && displayMonth === today.getMonth();

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const cell = document.createElement('div');
      cell.className = 'recap-day clickable';
      cell.setAttribute('tabindex', '0');
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-selected', day === selectedDay ? 'true' : 'false');
      cell.setAttribute('aria-label', `${monthNames[displayMonth]} ${day}, ${displayYear}`);

      if (isCurrentMonth && day === today.getDate()) {
        cell.classList.add('today');
      }

      if (day === selectedDay) {
        cell.classList.add('selected');
      }

      const dayNum = document.createElement('span');
      dayNum.className = 'recap-day-num';
      dayNum.textContent = day;
      cell.appendChild(dayNum);

      if (completedDays.has(day)) {
        cell.classList.add('has-completions');
        const dot = document.createElement('span');
        dot.className = 'recap-dot';
        dot.setAttribute('aria-label', 'Has completed tasks');
        cell.appendChild(dot);
      }

      // Click / keydown handler to select date
      const selectThisDay = () => {
        selectedDay = day;
        renderCalendar();
        renderHistory();
      };

      cell.addEventListener('click', selectThisDay);
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectThisDay();
        }
      });

      grid.appendChild(cell);
    }

    // Trailing blank cells (next month overflow)
    const totalCells = startOffset + lastDay.getDate();
    const trailingCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= trailingCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'recap-day other-month';

      const dayNum = document.createElement('span');
      dayNum.className = 'recap-day-num';
      dayNum.textContent = i;
      cell.appendChild(dayNum);

      grid.appendChild(cell);
    }

    calendarEl.appendChild(grid);
  }

  function renderJournalView() {
    journalEl.innerHTML = '';

    const allItems = Repository.getAll();
    const completedTasks = allItems.filter(item => item.type !== 'area' && item.status === 'completed');

    if (completedTasks.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'recap-empty-history';
      empty.textContent = 'No completed tasks logged yet.';
      journalEl.appendChild(empty);
      return;
    }

    // Group tasks by date string (YYYY-MM-DD)
    const groupsMap = new Map();
    completedTasks.forEach(task => {
      const timestamp = task.completedAt || task.updatedAt || task.createdAt;
      if (!timestamp) return;
      const d = new Date(timestamp);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          dateObj: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
          tasks: []
        });
      }
      groupsMap.get(key).tasks.push(task);
    });

    // Sort date keys in descending chronological order (most recent at top)
    const sortedKeys = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

    const areas = Repository.getAll().filter(i => i.type === 'area');
    const areaMap = new Map(areas.map(a => [a.id, a.name]));

    sortedKeys.forEach(key => {
      const group = groupsMap.get(key);
      const groupEl = document.createElement('div');
      groupEl.className = 'log-journal-group';

      const header = document.createElement('div');
      header.className = 'log-journal-header';

      const dateLabel = document.createElement('span');
      dateLabel.className = 'log-journal-date';
      const mName = monthNames[group.dateObj.getMonth()].toUpperCase();
      dateLabel.textContent = `${mName} ${group.dateObj.getDate()}, ${group.dateObj.getFullYear()}`;

      header.appendChild(dateLabel);
      groupEl.appendChild(header);

      const list = document.createElement('div');
      list.className = 'recap-task-list';

      group.tasks.forEach(task => {
        const row = document.createElement('div');
        row.className = 'recap-task-item';

        const check = document.createElement('span');
        check.className = 'recap-task-check';
        check.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="20 6 9 17 4 12"/></svg>`;

        const title = document.createElement('span');
        title.className = 'recap-task-title';
        title.textContent = task.title;

        row.appendChild(check);
        row.appendChild(title);

        if (task.areaId && areaMap.has(task.areaId)) {
          const areaBadge = document.createElement('span');
          areaBadge.className = 'area-status-badge status-archived recap-area-badge';
          areaBadge.textContent = areaMap.get(task.areaId);
          row.appendChild(areaBadge);
        }

        list.appendChild(row);
      });

      groupEl.appendChild(list);
      journalEl.appendChild(groupEl);
    });
  }

  function updateViewDisplay(mode) {
    currentViewMode = mode;
    
    calendarTab.classList.toggle('active', mode === 'calendar');
    calendarTab.setAttribute('aria-selected', mode === 'calendar' ? 'true' : 'false');
    
    journalTab.classList.toggle('active', mode === 'journal');
    journalTab.setAttribute('aria-selected', mode === 'journal' ? 'true' : 'false');

    if (mode === 'calendar') {
      nav.style.display = 'flex';
      calendarEl.style.display = 'block';
      sectionDivider.style.display = 'block';
      historyEl.style.display = 'block';
      journalEl.style.display = 'none';
      renderCalendar();
      renderHistory();
    } else {
      nav.style.display = 'none';
      calendarEl.style.display = 'none';
      sectionDivider.style.display = 'none';
      historyEl.style.display = 'none';
      journalEl.style.display = 'block';
      renderJournalView();
    }

    // Persist view mode preference
    const currentSettings = SettingsStore.load();
    if (currentSettings.logDefaultViewMode !== mode) {
      SettingsStore.save({ ...currentSettings, logDefaultViewMode: mode });
    }
  }

  calendarTab.addEventListener('click', () => updateViewDisplay('calendar'));
  journalTab.addEventListener('click', () => updateViewDisplay('journal'));

  // Keyboard navigation for View Switcher
  viewSwitcher.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const targetMode = currentViewMode === 'calendar' ? 'journal' : 'calendar';
      updateViewDisplay(targetMode);
      if (targetMode === 'calendar') calendarTab.focus();
      else journalTab.focus();
    }
  });

  // --- Calendar Event handlers ---
  prevBtn.addEventListener('click', () => {
    if (displayMonth === 0) {
      displayMonth = 11;
      displayYear -= 1;
    } else {
      displayMonth -= 1;
    }
    renderCalendar();
    renderHistory();
  });

  nextBtn.addEventListener('click', () => {
    if (displayMonth === 11) {
      displayMonth = 0;
      displayYear += 1;
    } else {
      displayMonth += 1;
    }
    renderCalendar();
    renderHistory();
  });

  // Reactive update on repository item / area changes
  const handleItemChange = () => {
    if (container && (!document.body || !document.body.contains || document.body.contains(container))) {
      updateViewDisplay(currentViewMode);
    }
  };

  EventBus.on('itemCreated', handleItemChange);
  EventBus.on('itemUpdated', handleItemChange);
  EventBus.on('itemDeleted', handleItemChange);
  EventBus.on('itemMoved', handleItemChange);
  EventBus.on('areaCreated', handleItemChange);
  EventBus.on('areaUpdated', handleItemChange);
  EventBus.on('areaDeleted', handleItemChange);

  // Auto-cleanup listeners when view is unmounted from DOM
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (!document.body.contains(container)) {
        EventBus.off('itemCreated', handleItemChange);
        EventBus.off('itemUpdated', handleItemChange);
        EventBus.off('itemDeleted', handleItemChange);
        EventBus.off('itemMoved', handleItemChange);
        EventBus.off('areaCreated', handleItemChange);
        EventBus.off('areaUpdated', handleItemChange);
        EventBus.off('areaDeleted', handleItemChange);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initial View Render
  updateViewDisplay(currentViewMode);
}
