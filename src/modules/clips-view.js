import { ClipsStore, normalizeTags } from '../core/clips-store.js';
import { Repository } from '../core/repository.js';
import { EventBus } from '../core/event-bus.js';
import { ToastService } from '../ui/toast.js';
import { renderEmptyState } from '../ui/empty-state.js';
import { DialogService } from '../ui/dialog.js';
import { getRelativeTime } from '../ui/utils.js';
import { renderMarkdown, escapeHtml } from '../ui/markdown-renderer.js';
import { openAreaPicker } from '../ui/area-picker.js';
import { getAreaIconSvg } from '../ui/area-icons.js';
import { SettingsStore } from '../core/settings-store.js';

let containerEl = null;
let searchQuery = '';
let selectedAreaFilter = '';
let selectedTagFilter = '';
let viewArchiveMode = false;
let viewLayoutMode = 'grid'; // 'grid' | 'list'
let sortOrder = 'updated-desc'; // 'updated-desc' | 'created-desc' | 'title-asc' | 'title-desc'
let editingClipId = null;
let selectedClipId = null;

// Preserved Creation state across renders
let newClipTitle = '';
let newClipContent = '';
let newClipTags = '';
let newClipAreaId = null;
let newClipPinned = false;

/**
 * Clips View Module
 * Terminal-inspired, compact cards and list notes view.
 */
export function renderClipsView(container) {
  const settings = SettingsStore.load();
  viewLayoutMode = localStorage.getItem('bench_clips_view_mode') || settings.clipsDefaultView || 'grid';
  sortOrder = localStorage.getItem('bench_clips_sort_order') || settings.clipsDefaultSort || 'updated-desc';

  container.innerHTML = '';
  containerEl = document.createElement('div');
  containerEl.className = `clips-view layout-${viewLayoutMode} ${settings.clipsShowPreviews !== false ? '' : 'hide-previews'}`;
  container.appendChild(containerEl);

  editingClipId = null;
  selectedClipId = null;
  renderView();

  cleanupEventBus();
  EventBus.on('clipCreated', handleClipsChange);
  EventBus.on('clipUpdated', handleClipsChange);
  EventBus.on('clipDeleted', handleClipsChange);
  EventBus.on('clipsRefreshed', handleClipsChange);
  EventBus.on('areaCreated', handleClipsChange);
  EventBus.on('areaUpdated', handleClipsChange);
  EventBus.on('areaDeleted', handleClipsChange);
  EventBus.on('settingsChanged', handleSettingsChange);

  window.removeEventListener('keydown', handleGlobalKeydown);
  window.addEventListener('keydown', handleGlobalKeydown);

  // Monitor unmounting to clean up event handlers
  const observer = new MutationObserver(() => {
    if (!document.body.contains(containerEl)) {
      cleanupListeners();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function handleClipsChange() {
  if (!containerEl || !document.body.contains(containerEl)) {
    cleanupListeners();
    return;
  }
  renderView();
}

function handleSettingsChange(newSettings) {
  if (!containerEl || !document.body.contains(containerEl)) {
    cleanupListeners();
    return;
  }
  const showPreviews = newSettings.clipsShowPreviews !== false;
  containerEl.className = `clips-view layout-${viewLayoutMode} ${showPreviews ? '' : 'hide-previews'}`;
}

function cleanupListeners() {
  cleanupEventBus();
  window.removeEventListener('keydown', handleGlobalKeydown);
}

function cleanupEventBus() {
  EventBus.off('clipCreated', handleClipsChange);
  EventBus.off('clipUpdated', handleClipsChange);
  EventBus.off('clipDeleted', handleClipsChange);
  EventBus.off('clipsRefreshed', handleClipsChange);
  EventBus.off('areaCreated', handleClipsChange);
  EventBus.off('areaUpdated', handleClipsChange);
  EventBus.off('areaDeleted', handleClipsChange);
  EventBus.off('settingsChanged', handleSettingsChange);
}

function setSelectedClipId(id) {
  selectedClipId = id;
  if (!containerEl) return;
  const cards = containerEl.querySelectorAll('.clip-card');
  cards.forEach(card => {
    const isSelected = card.getAttribute('data-id') === id;
    if (isSelected) {
      card.classList.add('selected');
      card.setAttribute('aria-selected', 'true');
      card.focus();
      card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } else {
      card.classList.remove('selected');
      card.setAttribute('aria-selected', 'false');
    }
  });
}

function handleGlobalKeydown(e) {
  if (!containerEl || !document.body.contains(containerEl)) return;

  const activeEl = document.activeElement;
  const isInput = activeEl && (
    activeEl.tagName === 'INPUT' ||
    activeEl.tagName === 'TEXTAREA' ||
    activeEl.isContentEditable ||
    (typeof activeEl.closest === 'function' && (activeEl.closest('[contenteditable="true"]') !== null || activeEl.closest('#inspector-panel') !== null))
  );

  if (isInput) {
    if (e.key === 'Escape') {
      e.preventDefault();
      activeEl.blur();
      if (editingClipId) {
        editingClipId = null;
        renderView();
      }
    }
    return;
  }

  // Never intercept shortcuts when modifier keys are held
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return;
  }

  const filtered = getFilteredClips();
  const currentIndex = filtered.findIndex(c => c.id === selectedClipId);

  if (e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') {
    e.preventDefault();
    const titleInput = containerEl.querySelector('#clip-input-title');
    if (titleInput) {
      titleInput.focus();
    }
  } else if (e.key === '/') {
    e.preventDefault();
    const searchInput = containerEl.querySelector('#clips-search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  } else if (e.key === 'j' || e.key === 'ArrowDown' || e.key === 'ArrowRight') {
    if (filtered.length > 0) {
      e.preventDefault();
      const nextIndex = currentIndex < filtered.length - 1 ? currentIndex + 1 : 0;
      setSelectedClipId(filtered[nextIndex].id);
    }
  } else if (e.key === 'k' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
    if (filtered.length > 0) {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : filtered.length - 1;
      setSelectedClipId(filtered[prevIndex].id);
    }
  } else if (e.key === 'p' || e.key === 'P') {
    if (selectedClipId) {
      e.preventDefault();
      ClipsStore.togglePin(selectedClipId);
    }
  } else if (e.key === 'a' || e.key === 'A') {
    if (selectedClipId) {
      e.preventDefault();
      const clip = ClipsStore.get(selectedClipId);
      if (clip) {
        if (clip.archived) {
          ClipsStore.restore(clip.id);
          ToastService.show('Clip restored.', 'info');
        } else {
          ClipsStore.archive(clip.id);
          ToastService.show('Clip archived.', 'info');
        }
      }
    }
  } else if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') {
    if (selectedClipId && !editingClipId) {
      e.preventDefault();
      editingClipId = selectedClipId;
      renderView();
    }
  } else if (e.key === 'd' || e.key === 'D' || e.key === 'Delete') {
    if (selectedClipId) {
      e.preventDefault();
      const targetId = selectedClipId;
      const settings = SettingsStore.load();
      if (settings.clipsConfirmDelete === false) {
        ClipsStore.delete(targetId);
        ToastService.show('Clip deleted.', 'info');
        return;
      }
      DialogService.confirm({
        title: 'Delete Clip',
        message: 'Are you sure you want to delete this clip? This action cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        variant: 'danger'
      }).then(confirmed => {
        if (confirmed) {
          ClipsStore.delete(targetId);
          ToastService.show('Clip deleted.', 'info');
        }
      });
    }
  } else if (e.key === 'Escape') {
    if (searchQuery) {
      searchQuery = '';
      renderView();
    } else if (selectedClipId) {
      setSelectedClipId(null);
    }
  }
}

function getFilteredClips() {
  const allClips = viewArchiveMode ? ClipsStore.getArchived() : ClipsStore.getActive();
  const query = searchQuery.trim().toLowerCase();

  const filtered = allClips.filter(clip => {
    // Area filter
    if (selectedAreaFilter) {
      if (selectedAreaFilter === '__none__' && clip.areaId) return false;
      if (selectedAreaFilter !== '__none__' && clip.areaId !== selectedAreaFilter) return false;
    }

    // Tag filter
    if (selectedTagFilter) {
      if (!Array.isArray(clip.tags) || !clip.tags.includes(selectedTagFilter.toLowerCase())) {
        return false;
      }
    }

    // Text search query (across title, content, tags, area)
    if (query) {
      const matchTitle = (clip.title || '').toLowerCase().includes(query);
      const matchContent = (clip.content || '').toLowerCase().includes(query);
      const matchTags = Array.isArray(clip.tags) && clip.tags.some(t => t.toLowerCase().includes(query));
      const area = clip.areaId ? Repository.get(clip.areaId) : null;
      const matchArea = area && area.name.toLowerCase().includes(query);

      if (!matchTitle && !matchContent && !matchTags && !matchArea) {
        return false;
      }
    }

    return true;
  });

  return ClipsStore.sortClips(filtered, sortOrder);
}

function renderView() {
  if (!containerEl || !document.body.contains(containerEl)) return;
  const settings = SettingsStore.load();
  containerEl.className = `clips-view layout-${viewLayoutMode} ${settings.clipsShowPreviews !== false ? '' : 'hide-previews'}`;
  containerEl.innerHTML = '';

  const activeAreas = Repository.getActiveAreas();
  const allTags = ClipsStore.getAllTags();
  const archivedCount = ClipsStore.getArchived().length;

  // 1. Toolbar Header (Search, Area Filter, Sort, Layout Toggle, Archive Toggle)
  const toolbar = document.createElement('div');
  toolbar.className = 'clips-toolbar';

  const areaOptionsHtml = activeAreas.map(a => `
    <option value="${a.id}" ${selectedAreaFilter === a.id ? 'selected' : ''}>[${escapeHtml(a.name)}]</option>
  `).join('');

  const gridIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
  const listIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`;
  const archiveIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;

  toolbar.innerHTML = `
    <div class="clips-toolbar-left">
      <div class="clips-search-box">
        <span class="clips-search-icon" title="Search shortcut: /">/</span>
        <input type="text" id="clips-search-input" class="clips-search-input" placeholder="Search clips, #tags, areas... (/)" value="${escapeHtml(searchQuery)}" autocomplete="off" />
        ${searchQuery ? '<button class="clips-search-clear" id="clips-search-clear" title="Clear search (Esc)">&times;</button>' : ''}
      </div>

      <div class="clips-filter-select-wrapper">
        <select id="clips-area-filter" class="clips-filter-select" title="Filter by Area">
          <option value="">All Areas</option>
          <option value="__none__" ${selectedAreaFilter === '__none__' ? 'selected' : ''}>No Area</option>
          ${areaOptionsHtml}
        </select>
      </div>

      <div class="clips-filter-select-wrapper">
        <select id="clips-sort-select" class="clips-filter-select" title="Sort clips">
          <option value="updated-desc" ${sortOrder === 'updated-desc' ? 'selected' : ''}>Recently Updated</option>
          <option value="created-desc" ${sortOrder === 'created-desc' ? 'selected' : ''}>Recently Created</option>
          <option value="title-asc" ${sortOrder === 'title-asc' ? 'selected' : ''}>Title (A-Z)</option>
          <option value="title-desc" ${sortOrder === 'title-desc' ? 'selected' : ''}>Title (Z-A)</option>
        </select>
      </div>
    </div>

    <div class="clips-toolbar-right">
      <div class="clips-toggle-group">
        <button id="clips-btn-grid" class="clips-tool-btn ${viewLayoutMode === 'grid' ? 'active' : ''}" title="Grid view" aria-label="Grid view">
          ${gridIcon}
        </button>
        <button id="clips-btn-list" class="clips-tool-btn ${viewLayoutMode === 'list' ? 'active' : ''}" title="List view" aria-label="List view">
          ${listIcon}
        </button>
      </div>

      <button id="clips-btn-archive-view" class="clips-tool-btn clips-archive-tab ${viewArchiveMode ? 'active' : ''}" title="${viewArchiveMode ? 'View Active Clips' : 'View Archived Clips'}">
        ${archiveIcon}
        <span>${viewArchiveMode ? 'Archived' : 'Archive'}</span>
        ${archivedCount > 0 ? `<span class="clips-count-pill">${archivedCount}</span>` : ''}
      </button>
    </div>
  `;

  // Bind Toolbar Events
  const searchInput = toolbar.querySelector('#clips-search-input');
  const searchClear = toolbar.querySelector('#clips-search-clear');
  const areaFilter = toolbar.querySelector('#clips-area-filter');
  const sortSelect = toolbar.querySelector('#clips-sort-select');
  const gridBtn = toolbar.querySelector('#clips-btn-grid');
  const listBtn = toolbar.querySelector('#clips-btn-list');
  const archiveViewBtn = toolbar.querySelector('#clips-btn-archive-view');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderView();
    const input = containerEl.querySelector('#clips-search-input');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  });

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      searchQuery = '';
      renderView();
    });
  }

  areaFilter.addEventListener('change', (e) => {
    selectedAreaFilter = e.target.value;
    renderView();
  });

  sortSelect.addEventListener('change', (e) => {
    sortOrder = e.target.value;
    localStorage.setItem('bench_clips_sort_order', sortOrder);
    renderView();
  });

  gridBtn.addEventListener('click', () => {
    viewLayoutMode = 'grid';
    localStorage.setItem('bench_clips_view_mode', 'grid');
    renderView();
  });

  listBtn.addEventListener('click', () => {
    viewLayoutMode = 'list';
    localStorage.setItem('bench_clips_view_mode', 'list');
    renderView();
  });

  archiveViewBtn.addEventListener('click', () => {
    viewArchiveMode = !viewArchiveMode;
    renderView();
  });

  containerEl.appendChild(toolbar);

  // 2. Tag Filter Bar (if tags exist)
  if (allTags.length > 0) {
    const tagBar = document.createElement('div');
    tagBar.className = 'clips-tag-bar';

    const allTagBtn = document.createElement('button');
    allTagBtn.className = `clip-tag-chip ${!selectedTagFilter ? 'active' : ''}`;
    allTagBtn.textContent = 'All Tags';
    allTagBtn.title = 'Show all tags';
    allTagBtn.addEventListener('click', () => {
      selectedTagFilter = '';
      renderView();
    });
    tagBar.appendChild(allTagBtn);

    allTags.forEach(tag => {
      const chip = document.createElement('button');
      chip.className = `clip-tag-chip ${selectedTagFilter === tag ? 'active' : ''}`;
      chip.textContent = `#${tag}`;
      chip.title = `Filter by #${tag}`;
      chip.addEventListener('click', () => {
        selectedTagFilter = selectedTagFilter === tag ? '' : tag;
        renderView();
      });
      tagBar.appendChild(chip);
    });

    containerEl.appendChild(tagBar);
  }

  // 3. Quick Creation Bar (only on Active clips view)
  if (!viewArchiveMode) {
    const createBar = document.createElement('div');
    createBar.className = 'clips-create-bar';

    const assignedArea = newClipAreaId ? Repository.get(newClipAreaId) : null;
    const areaLabel = assignedArea ? `[${escapeHtml(assignedArea.name)}]` : '+ Area';

    createBar.innerHTML = `
      <div class="clips-create-form">
        <div class="clips-create-row-top">
          <input type="text" id="clip-input-title" class="clips-input-title" placeholder="Title (optional)... (N / C)" value="${escapeHtml(newClipTitle)}" autocomplete="off" />
          <button id="clip-create-pin-btn" class="clip-card-action-btn btn-pin ${newClipPinned ? 'pinned' : ''}" title="${newClipPinned ? 'Pinned' : 'Pin clip (P)'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${newClipPinned ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
          </button>
        </div>
        <textarea id="clip-input-content" class="clips-input-content" placeholder="Take a clip... (Supports Markdown, #tags, Enter to save)" rows="1">${escapeHtml(newClipContent)}</textarea>
        
        <div class="clips-create-meta-row">
          <input type="text" id="clip-input-tags" class="clips-input-tags" placeholder="Tags (e.g. #notes, dev, ideas)..." value="${escapeHtml(newClipTags)}" autocomplete="off" />
          <button id="clip-create-area-btn" class="clip-meta-btn ${assignedArea ? 'has-area' : ''}" title="Assign Area">
            ${assignedArea ? getAreaIconSvg(assignedArea.icon) : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>'}
            <span>${areaLabel}</span>
          </button>
        </div>

        <div class="clips-create-actions">
          <span class="clips-create-hint"><kbd>N</kbd> to focus &bull; <kbd>Ctrl+Enter</kbd> to save</span>
          <button id="clip-btn-add" class="clips-btn-primary" title="Add Clip (Enter / Ctrl+Enter)">Add Clip</button>
        </div>
      </div>
    `;

    const titleInput = createBar.querySelector('#clip-input-title');
    const contentInput = createBar.querySelector('#clip-input-content');
    const tagsInput = createBar.querySelector('#clip-input-tags');
    const areaBtn = createBar.querySelector('#clip-create-area-btn');
    const pinBtn = createBar.querySelector('#clip-create-pin-btn');
    const addBtn = createBar.querySelector('#clip-btn-add');

    titleInput.addEventListener('input', () => {
      newClipTitle = titleInput.value;
    });

    contentInput.addEventListener('input', () => {
      newClipContent = contentInput.value;
      contentInput.style.height = 'auto';
      contentInput.style.height = Math.min(contentInput.scrollHeight, 240) + 'px';
    });

    tagsInput.addEventListener('input', () => {
      newClipTags = tagsInput.value;
    });

    pinBtn.addEventListener('click', () => {
      newClipPinned = !newClipPinned;
      renderView();
    });

    areaBtn.addEventListener('click', (e) => {
      openAreaPicker(e, { areaId: newClipAreaId }, (selectedId) => {
        newClipAreaId = selectedId;
        renderView();
      });
    });

    const submitNewClip = () => {
      const title = titleInput.value.trim();
      const content = contentInput.value.trim();
      const rawTags = tagsInput.value.trim();

      const inlineTags = [];
      const tagMatches = `${title} ${content} ${rawTags}`.match(/#([\w-]+)/g);
      if (tagMatches) {
        tagMatches.forEach(m => inlineTags.push(m.replace('#', '')));
      }

      if (!title && !content) {
        ToastService.show('Please enter content for the clip.', 'info');
        contentInput.focus();
        return;
      }

      const settings = SettingsStore.load();
      ClipsStore.create({
        title,
        content,
        tags: inlineTags.concat(rawTags.split(/[\s,]+/)),
        areaId: newClipAreaId,
        pinned: newClipPinned,
        color: settings.clipsDefaultColor || 'default'
      });

      newClipTitle = '';
      newClipContent = '';
      newClipTags = '';
      newClipAreaId = null;
      newClipPinned = false;
      renderView();
      ToastService.show('Clip created.', 'success');
    };

    addBtn.addEventListener('click', submitNewClip);

    contentInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        e.preventDefault();
        submitNewClip();
      }
    });

    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        contentInput.focus();
      }
    });

    tagsInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitNewClip();
      }
    });

    containerEl.appendChild(createBar);
  }

  // 4. Content Area & Clips Rendering
  const contentArea = document.createElement('div');
  contentArea.className = 'clips-content-area';
  containerEl.appendChild(contentArea);

  const filteredClips = getFilteredClips();

  // Empty states handling
  if (filteredClips.length === 0) {
    const emptyContainer = document.createElement('div');
    emptyContainer.className = 'clips-empty-wrapper';

    if (searchQuery || selectedAreaFilter || selectedTagFilter) {
      const searchSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
      renderEmptyState(
        emptyContainer,
        'No matching clips',
        'Try adjusting your search query, area filter, or selected tag.',
        searchSvg
      );
    } else if (viewArchiveMode) {
      const archiveSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
      renderEmptyState(
        emptyContainer,
        'Archive is empty',
        'Clips you archive will appear here.',
        archiveSvg
      );
    } else {
      const paperclipSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;
      renderEmptyState(
        emptyContainer,
        'No clips yet',
        'Quick notes, code snippets, and thoughts. Create a clip to keep it handy.',
        paperclipSvg
      );
    }

    contentArea.appendChild(emptyContainer);
    return;
  }

  // Section Grouping: PINNED vs OTHERS
  const hasFilterActive = Boolean(searchQuery || selectedAreaFilter || selectedTagFilter);

  if (viewArchiveMode || hasFilterActive) {
    const sectionHeader = document.createElement('div');
    sectionHeader.className = 'clips-section-header';
    sectionHeader.textContent = viewArchiveMode ? `ARCHIVED CLIPS (${filteredClips.length})` : `SEARCH RESULTS (${filteredClips.length})`;
    contentArea.appendChild(sectionHeader);

    const grid = document.createElement('div');
    grid.className = `clips-container-${viewLayoutMode}`;
    filteredClips.forEach(clip => {
      grid.appendChild(renderClipItem(clip));
    });
    contentArea.appendChild(grid);
  } else {
    const pinnedClips = filteredClips.filter(c => c.pinned);
    const otherClips = filteredClips.filter(c => !c.pinned);

    if (pinnedClips.length > 0) {
      const pinnedHeader = document.createElement('div');
      pinnedHeader.className = 'clips-section-header';
      pinnedHeader.textContent = `PINNED (${pinnedClips.length})`;
      contentArea.appendChild(pinnedHeader);

      const pinnedGrid = document.createElement('div');
      pinnedGrid.className = `clips-container-${viewLayoutMode}`;
      pinnedClips.forEach(clip => {
        pinnedGrid.appendChild(renderClipItem(clip));
      });
      contentArea.appendChild(pinnedGrid);
    }

    if (otherClips.length > 0) {
      if (pinnedClips.length > 0) {
        const othersHeader = document.createElement('div');
        othersHeader.className = 'clips-section-header';
        othersHeader.textContent = `OTHERS (${otherClips.length})`;
        contentArea.appendChild(othersHeader);
      }

      const othersGrid = document.createElement('div');
      othersGrid.className = `clips-container-${viewLayoutMode}`;
      otherClips.forEach(clip => {
        othersGrid.appendChild(renderClipItem(clip));
      });
      contentArea.appendChild(othersGrid);
    }
  }
}

function renderClipItem(clip) {
  const card = document.createElement('div');
  const colorClass = clip.color && clip.color !== 'default' ? `color-${clip.color}` : '';
  const isSelected = selectedClipId === clip.id;

  card.className = `clip-card ${clip.pinned ? 'pinned' : ''} ${clip.archived ? 'archived' : ''} ${colorClass} ${isSelected ? 'selected' : ''}`.trim();
  card.setAttribute('data-id', clip.id);
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'article');
  card.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  card.setAttribute('aria-label', clip.title || clip.content || 'Clip');

  card.addEventListener('click', () => {
    setSelectedClipId(clip.id);
  });

  const isEditing = editingClipId === clip.id;

  if (isEditing) {
    card.classList.add('editing');
    const assignedArea = clip.areaId ? Repository.get(clip.areaId) : null;
    const areaName = assignedArea ? `[${assignedArea.name}]` : '+ Area';
    const tagString = Array.isArray(clip.tags) ? clip.tags.map(t => `#${t}`).join(' ') : '';

    card.innerHTML = `
      <div class="clip-edit-form">
        <input type="text" class="clip-edit-title" value="${escapeHtml(clip.title || '')}" placeholder="Title (optional)..." />
        <textarea class="clip-edit-content" rows="4" placeholder="Content...">${escapeHtml(clip.content || '')}</textarea>
        
        <div class="clip-edit-meta-row">
          <input type="text" class="clip-edit-tags" value="${escapeHtml(tagString)}" placeholder="Tags (e.g. #ideas, dev)..." />
          <button class="clip-meta-btn clip-edit-area-btn ${assignedArea ? 'has-area' : ''}" title="Assign Area">
            ${assignedArea ? getAreaIconSvg(assignedArea.icon) : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>'}
            <span>${escapeHtml(areaName)}</span>
          </button>
        </div>

        <div class="clip-edit-actions">
          <button class="clip-btn-cancel clip-btn-secondary" title="Cancel edit (Esc)">Cancel</button>
          <button class="clip-btn-save clip-btn-primary" title="Save changes (Ctrl+Enter)">Save</button>
        </div>
      </div>
    `;

    const editTitle = card.querySelector('.clip-edit-title');
    const editContent = card.querySelector('.clip-edit-content');
    const editTags = card.querySelector('.clip-edit-tags');
    const editAreaBtn = card.querySelector('.clip-edit-area-btn');
    const saveBtn = card.querySelector('.clip-btn-save');
    const cancelBtn = card.querySelector('.clip-btn-cancel');

    let currentAreaId = clip.areaId || null;

    editAreaBtn.addEventListener('click', (e) => {
      openAreaPicker(e, { areaId: currentAreaId }, (selectedId) => {
        currentAreaId = selectedId;
        const area = selectedId ? Repository.get(selectedId) : null;
        editAreaBtn.innerHTML = `
          ${area ? getAreaIconSvg(area.icon) : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>'}
          <span>${area ? `[${escapeHtml(area.name)}]` : '+ Area'}</span>
        `;
        if (area) editAreaBtn.classList.add('has-area');
        else editAreaBtn.classList.remove('has-area');
      });
    });

    saveBtn.addEventListener('click', () => {
      const title = editTitle.value.trim();
      const content = editContent.value.trim();
      const rawTags = editTags.value.trim();

      if (!title && !content) {
        ToastService.show('Clip cannot be empty.', 'info');
        return;
      }

      ClipsStore.update(clip.id, {
        title,
        content,
        tags: rawTags.split(/[\s,]+/),
        areaId: currentAreaId
      });
      editingClipId = null;
      renderView();
      ToastService.show('Clip updated.', 'success');
    });

    cancelBtn.addEventListener('click', () => {
      editingClipId = null;
      renderView();
    });

    editContent.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveBtn.click();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelBtn.click();
      }
    });

    setTimeout(() => editContent.focus(), 0);
    return card;
  }

  // Normal Card / List Row Display
  const area = clip.areaId ? Repository.get(clip.areaId) : null;
  const areaBadgeHtml = area ? `
    <span class="clip-area-badge" data-area-id="${area.id}" title="Filter by Area: ${escapeHtml(area.name)}">
      ${getAreaIconSvg(area.icon)}
      <span>[${escapeHtml(area.name)}]</span>
    </span>
  ` : '';

  const tagsHtml = Array.isArray(clip.tags) && clip.tags.length > 0 ? `
    <div class="clip-card-tags">
      ${clip.tags.map(t => `<span class="clip-tag-badge" data-tag="${escapeHtml(t)}" title="Filter by #${escapeHtml(t)}">#${escapeHtml(t)}</span>`).join('')}
    </div>
  ` : '';

  const pinIcon = clip.pinned 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`;

  const areaIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polygon points="2 17 12 22 22 17"/><polygon points="2 12 12 17 22 12"/></svg>`;
  const archiveIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>`;
  const restoreIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
  const editIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`;
  const deleteIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>`;

  const markdownContent = renderMarkdown(clip.content || '');
  const updatedDateStr = new Date(clip.updatedAt || clip.createdAt).toLocaleString();

  card.innerHTML = `
    <div class="clip-card-header">
      <div class="clip-card-header-left">
        ${areaBadgeHtml}
        ${clip.title ? `<span class="clip-card-title">${escapeHtml(clip.title)}</span>` : ''}
      </div>
      <button class="clip-card-action-btn btn-pin ${clip.pinned ? 'pinned' : ''}" title="${clip.pinned ? 'Unpin (P)' : 'Pin (P)'}" aria-label="Pin">
        ${pinIcon}
      </button>
    </div>

    <div class="clip-card-body">
      ${markdownContent}
    </div>

    ${tagsHtml}

    <div class="clip-card-footer">
      <span class="clip-card-time" title="Updated: ${updatedDateStr}">${getRelativeTime(clip.updatedAt || clip.createdAt)}</span>
      <div class="clip-card-actions">
        <button class="clip-card-action-btn btn-area" title="Assign Area" aria-label="Area">
          ${areaIcon}
        </button>
        <button class="clip-card-action-btn btn-edit" title="Edit clip (E / Enter)" aria-label="Edit">
          ${editIcon}
        </button>
        <button class="clip-card-action-btn btn-archive" title="${clip.archived ? 'Restore clip (A)' : 'Archive clip (A)'}" aria-label="${clip.archived ? 'Restore' : 'Archive'}">
          ${clip.archived ? restoreIcon : archiveIcon}
        </button>
        <button class="clip-card-action-btn btn-delete" title="Delete clip (D / Del)" aria-label="Delete">
          ${deleteIcon}
        </button>
      </div>
    </div>
  `;

  // Bind Actions
  const pinBtn = card.querySelector('.btn-pin');
  const areaBtn = card.querySelector('.btn-area');
  const editBtn = card.querySelector('.btn-edit');
  const archiveBtn = card.querySelector('.btn-archive');
  const deleteBtn = card.querySelector('.btn-delete');
  const areaBadge = card.querySelector('.clip-area-badge');
  const tagBadges = card.querySelectorAll('.clip-tag-badge');

  pinBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    ClipsStore.togglePin(clip.id);
  });

  areaBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openAreaPicker(e, { areaId: clip.areaId }, (selectedAreaId) => {
      ClipsStore.update(clip.id, { areaId: selectedAreaId });
    });
  });

  if (areaBadge) {
    areaBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedAreaFilter = clip.areaId;
      renderView();
    });
  }

  tagBadges.forEach(badge => {
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      const tag = badge.getAttribute('data-tag');
      selectedTagFilter = tag;
      renderView();
    });
  });

  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    editingClipId = clip.id;
    renderView();
  });

  card.addEventListener('dblclick', () => {
    editingClipId = clip.id;
    renderView();
  });

  archiveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (clip.archived) {
      ClipsStore.restore(clip.id);
      ToastService.show('Clip restored.', 'info');
    } else {
      ClipsStore.archive(clip.id);
      ToastService.show('Clip archived.', 'info');
    }
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const settings = SettingsStore.load();
    if (settings.clipsConfirmDelete === false) {
      ClipsStore.delete(clip.id);
      ToastService.show('Clip deleted.', 'info');
      return;
    }
    DialogService.confirm({
      title: 'Delete Clip',
      message: 'Are you sure you want to delete this clip? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'danger'
    }).then(confirmed => {
      if (confirmed) {
        ClipsStore.delete(clip.id);
        ToastService.show('Clip deleted.', 'info');
      }
    });
  });

  return card;
}
