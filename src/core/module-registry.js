/**
 * ModuleRegistry
 * Central module metadata source for Bench primary modules.
 */
export const ModuleRegistry = {
  modules: [
    {
      id: 'focus',
      label: 'Focus',
      shortcutNumber: 1,
      benchSymbol: 'λ',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`
    },
    {
      id: 'capture',
      label: 'Capture',
      shortcutNumber: 2,
      benchSymbol: 'κ',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>`
    },
    {
      id: 'areas',
      label: 'Areas',
      shortcutNumber: 3,
      benchSymbol: 'α',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>`
    },
    {
      id: 'parking-lot',
      label: 'Parking Lot',
      shortcutNumber: 4,
      benchSymbol: 'π',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>`
    },
    {
      id: 'archive',
      label: 'Archive',
      shortcutNumber: 5,
      benchSymbol: 'Ω',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`
    },
    {
      id: 'jot',
      label: 'Jot',
      shortcutNumber: 6,
      benchSymbol: 'ν',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.4" /><path d="M2 6h4" /><path d="M2 10h4" /><path d="M2 14h4" /><path d="M2 18h4" /><path d="M21.378 5.626a1 1 0 1 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" /></svg>`
    },
    {
      id: 'recap',
      label: 'Log',
      shortcutNumber: 7,
      benchSymbol: 'Σ',
      classicIcon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`
    }
  ],

  getModule(id) {
    return this.modules.find(m => m.id === id);
  },

  getAllModules() {
    return this.modules;
  },

  renderGraphic(id, style = 'bench-symbols') {
    const mod = this.getModule(id);
    if (!mod) return '';
    if (style === 'classic-icons') {
      return mod.classicIcon;
    }
    return `<span class="bench-symbol">${mod.benchSymbol}</span>`;
  }
};
