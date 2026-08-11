import { Repository } from '../core/repository.js';

/**
 * Recap View Module
 * Displays a monthly calendar showing dates that contain completed tasks.
 * Navigation state is ephemeral — resets to the current month on each mount.
 */
export function renderRecapView(container) {
  container.innerHTML = '';

  const today = new Date();
  let displayYear = today.getFullYear();
  let displayMonth = today.getMonth(); // 0-indexed

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

  // Calendar grid (header + day cells rebuilt on navigate)
  const calendarEl = document.createElement('div');
  calendarEl.className = 'recap-calendar';

  wrapper.appendChild(nav);
  wrapper.appendChild(calendarEl);
  container.appendChild(wrapper);

  // --- Render helpers ---

  function buildCompletionSet(year, month) {
    // Returns a Set of day-of-month numbers (1-indexed) that have ≥1 completedAt in view month
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

  function renderCalendar() {
    calendarEl.innerHTML = '';

    const completedDays = buildCompletionSet(displayYear, displayMonth);

    // Month/year label
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
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

    // First day of the month; day-of-week adjusted for Monday=0
    const firstDay = new Date(displayYear, displayMonth, 1);
    const lastDay = new Date(displayYear, displayMonth + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0 … Sun=6

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
      cell.className = 'recap-day';

      if (isCurrentMonth && day === today.getDate()) {
        cell.classList.add('today');
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

      grid.appendChild(cell);
    }

    // Trailing blank cells (next month overflow) to fill the last row
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
  });

  nextBtn.addEventListener('click', () => {
    if (displayMonth === 11) {
      displayMonth = 0;
      displayYear += 1;
    } else {
      displayMonth += 1;
    }
    renderCalendar();
  });

  // Initial render
  renderCalendar();
}
