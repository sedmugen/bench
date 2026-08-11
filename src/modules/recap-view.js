/**
 * Recap View Module
 * Foundation for the historical task recap calendar.
 * Currently renders a minimal empty state.
 */
export function renderRecapView(container) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'recap-container';

  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'section-header';
  sectionHeader.textContent = 'RECAP';

  const divider = document.createElement('div');
  divider.className = 'section-divider';

  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.textContent = 'No completed tasks to recap yet.';

  wrapper.appendChild(sectionHeader);
  wrapper.appendChild(divider);
  wrapper.appendChild(empty);

  container.appendChild(wrapper);
}
