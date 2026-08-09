/**
 * Area Icons Registry
 * Provides Lucide outline SVG icons for Bench Areas.
 */

export const DEFAULT_AREA_ICON = 'folder';

export const AREA_ICONS = [
  { 
    id: 'folder', 
    label: 'Folder', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z"/></svg>` 
  },
  { 
    id: 'briefcase', 
    label: 'Briefcase', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>` 
  },
  { 
    id: 'user', 
    label: 'Personal', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>` 
  },
  { 
    id: 'heart', 
    label: 'Health', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>` 
  },
  { 
    id: 'book', 
    label: 'Learning', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6.5 2v18"/></svg>` 
  },
  { 
    id: 'code', 
    label: 'Code', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>` 
  },
  { 
    id: 'home', 
    label: 'Home', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>` 
  },
  { 
    id: 'star', 
    label: 'Star', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` 
  },
  { 
    id: 'tag', 
    label: 'Tag', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>` 
  },
  { 
    id: 'target', 
    label: 'Goals', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>` 
  },
  { 
    id: 'zap', 
    label: 'Ideas', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>` 
  },
  { 
    id: 'layers', 
    label: 'Projects', 
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="area-folder-icon" style="color: var(--color-text-muted); flex-shrink: 0;"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>` 
  }
];

/**
 * Get the SVG markup for a given area icon ID with a fallback to the default folder icon.
 * @param {string} iconId 
 * @returns {string} SVG HTML string
 */
export function getAreaIconSvg(iconId) {
  const found = AREA_ICONS.find(i => i.id === iconId);
  return found ? found.svg : AREA_ICONS[0].svg;
}
