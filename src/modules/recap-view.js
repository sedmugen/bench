import { Repository } from '../core/repository.js';

/**
 * Recap View Module
 * Displays a monthly calendar showing dates that contain completed tasks,
 * and lists tasks completed on the selected date.
 */
export function renderRecapView(container) {
  container.innerHTML = '';

  const today = new Date();
  let displayYear = today.getFullYear();
  let displayMonth = today.getMonth(); // 0-indexed
  let selectedDay = today.getDate();

  const wrapper = document.createElement('div');
  wrapper.className = 'recap-container';

  // Month navigation header
  const nav = document.createElement('div');
  nav.className = 'recap-month-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'recap-nav-btn';
  prevBtn.setAttribute('aria-label', 'Previous month');
  prevBtn.textContent = '◂';

  const monthLabel = document.createElement('span');
  monthLabel.className = 'recap-month-label';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'recap-nav-btn';
  nextBtn.setAttribute('aria-label', 'Next month');
  nextBtn.textContent = '▸';

  nav.appendChild(prevBtn);
  nav.appendChild(monthLabel);
  nav.appendChild(nextBtn);

  // Calendar grid
  const calendarEl = document.createElement('div');
  calendarEl.className = 'recap-calendar';

  // Task history panel below calendar
  const historyEl = document.createElement('div');
  historyEl.className = 'recap-history';

  wrapper.appendChild(nav);
  wrapper.appendChild(calendarEl);
  wrapper.appendChild(historyEl);
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
      if (item.type === 'area' || !item.completedAt) return;
      const d = new Date(item.completedAt);
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }

  function getCompletedTasksForDate(year, month, day) {
    const items = Repository.getAll();
    return items.filter(item => {
      if (item.type === 'area' || !item.completedAt) return false;
      const d = new Date(item.completedAt);
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
    header.textContent = `COMPLETED — ${monthNames[displayMonth].toUpperCase()} ${selectedDay}, ${displayYear}`;
    historyEl.appendChild(header);

    const divider = document.createElement('div');
    divider.className = 'recap-grid-divider';
    historyEl.appendChild(divider);

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

    // Map area IDs to names for optional context
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
        areaBadge.className = 'recap-task-area';
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

    // Clamp selectedDay if month has fewer days (e.g. Feb 28 vs Jan 31)
    if (selectedDay > lastDay.getDate()) {
      selectedDay = lastDay.getDate();
    }

    // Leading blank cells (prev month overflow)
    const prevMonthLastDay = new Date(displayYear, displayMonth, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const cell = document.createElement('div');
      cell.className = 'recap-day other-month';
      cell.textContent = prevMonthLastDay - i;
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

    // Trailing blank cells
    const totalCells = startOffset + lastDay.getDate();
    const trailingCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= trailingCount; i++) {
      const cell = document.createElement('div');
      cell.className = 'recap-day other-month';
      cell.textContent = i;
      grid.appendChild(cell);
    }

    calendarEl.appendChild(grid);
  }

  // --- Event handlers ---

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

  // Initial render
  renderCalendar();
  renderHistory();
}
