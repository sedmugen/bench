import { EventBus } from './event-bus.js';

const STORAGE_KEY = 'bench_clips';

/**
 * Normalizes an array of tags (lowercased, trimmed, unique, no leading #).
 * @param {Array<string>|string} rawTags
 * @returns {Array<string>}
 */
export function normalizeTags(rawTags) {
  if (!rawTags) return [];
  const list = Array.isArray(rawTags) ? rawTags : String(rawTags).split(/[,\s]+/);
  const tagSet = new Set();
  list.forEach(t => {
    const cleaned = t.replace(/^#+/, '').trim().toLowerCase();
    if (cleaned) tagSet.add(cleaned);
  });
  return Array.from(tagSet);
}

/**
 * ClipsStore
 * Unified persistence layer for the standalone Clips module.
 * Isolates localStorage interactions from the UI view and maintains a single source of truth.
 */
export const ClipsStore = {
  /**
   * Retrieve all saved clips.
   * @returns {Array<object>}
   */
  getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const clips = JSON.parse(data);
        if (Array.isArray(clips)) {
          return clips;
        }
      }
      return [];
    } catch (e) {
      console.error('Failed to load clips from storage:', e);
      return [];
    }
  },

  /**
   * Retrieve non-archived clips.
   * @returns {Array<object>}
   */
  getActive() {
    return this.getAll().filter(c => !c.archived);
  },

  /**
   * Retrieve archived clips.
   * @returns {Array<object>}
   */
  getArchived() {
    return this.getAll().filter(c => c.archived === true);
  },

  /**
   * Retrieve a single clip by ID.
   * @param {string} id
   * @returns {object|null}
   */
  get(id) {
    if (!id) return null;
    return this.getAll().find(c => c.id === id) || null;
  },

  /**
   * Retrieve all unique tags across all clips.
   * @returns {Array<string>}
   */
  getAllTags() {
    const tagsSet = new Set();
    this.getAll().forEach(clip => {
      if (Array.isArray(clip.tags)) {
        clip.tags.forEach(t => tagsSet.add(t));
      }
    });
    return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
  },

  /**
   * Sort an array of clips by the specified sort mode.
   * @param {Array<object>} clips
   * @param {string} sortOrder - 'updated-desc' | 'created-desc' | 'title-asc' | 'title-desc'
   * @returns {Array<object>}
   */
  sortClips(clips, sortOrder = 'updated-desc') {
    const copy = [...clips];
    switch (sortOrder) {
      case 'created-desc':
        return copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      case 'title-asc':
        return copy.sort((a, b) => (a.title || a.content || '').toLowerCase().localeCompare((b.title || b.content || '').toLowerCase()));
      case 'title-desc':
        return copy.sort((a, b) => (b.title || b.content || '').toLowerCase().localeCompare((a.title || a.content || '').toLowerCase()));
      case 'updated-desc':
      default:
        return copy.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    }
  },

  /**
   * Create and persist a new clip.
   * @param {object} clipData
   * @returns {object} The created clip
   */
  create(clipData = {}) {
    const clips = this.getAll();
    const now = Date.now();

    const newClip = {
      id: clipData.id || crypto.randomUUID(),
      title: (clipData.title || '').trim(),
      content: clipData.content || '',
      tags: normalizeTags(clipData.tags),
      areaId: clipData.areaId || null,
      pinned: clipData.pinned === true,
      color: clipData.color || '',
      archived: clipData.archived === true,
      createdAt: clipData.createdAt || now,
      updatedAt: now
    };

    clips.unshift(newClip);
    this._saveRaw(clips);

    EventBus.emit('clipCreated', newClip);
    return newClip;
  },

  /**
   * Update properties of an existing clip.
   * @param {string} id
   * @param {object} updates
   * @returns {object|null} The updated clip or null if not found
   */
  update(id, updates = {}) {
    const clips = this.getAll();
    const idx = clips.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const existing = clips[idx];
    const updatedClip = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    if (updates.title !== undefined) {
      updatedClip.title = updates.title.trim();
    }

    if (updates.tags !== undefined) {
      updatedClip.tags = normalizeTags(updates.tags);
    }

    if (updates.areaId !== undefined) {
      updatedClip.areaId = updates.areaId || null;
    }

    clips[idx] = updatedClip;
    this._saveRaw(clips);

    EventBus.emit('clipUpdated', updatedClip);
    return updatedClip;
  },

  /**
   * Delete a clip by ID.
   * @param {string} id
   * @returns {boolean} True if deleted, false if not found
   */
  delete(id) {
    const clips = this.getAll();
    const clip = clips.find(c => c.id === id);
    if (!clip) return false;

    const filtered = clips.filter(c => c.id !== id);
    this._saveRaw(filtered);

    EventBus.emit('clipDeleted', clip);
    return true;
  },

  /**
   * Toggle pinned state of a clip.
   * @param {string} id
   * @returns {object|null}
   */
  togglePin(id) {
    const clip = this.get(id);
    if (!clip) return null;
    return this.update(id, { pinned: !clip.pinned });
  },

  /**
   * Archive a clip (clearing pinned flag).
   * @param {string} id
   * @returns {object|null}
   */
  archive(id) {
    return this.update(id, { archived: true, pinned: false });
  },

  /**
   * Restore an archived clip.
   * @param {string} id
   * @returns {object|null}
   */
  restore(id) {
    return this.update(id, { archived: false });
  },

  /**
   * Clear all clips.
   */
  clearAll() {
    this._saveRaw([]);
  },

  /**
   * Disassociate a deleted Area from all clips that referenced it.
   * @param {string} deletedAreaId
   */
  handleAreaDeleted(deletedAreaId) {
    if (!deletedAreaId) return;
    const clips = this.getAll();
    let hasChanges = false;
    clips.forEach(clip => {
      if (clip.areaId === deletedAreaId) {
        clip.areaId = null;
        clip.updatedAt = Date.now();
        hasChanges = true;
      }
    });
    if (hasChanges) {
      this._saveRaw(clips);
      EventBus.emit('clipsRefreshed');
    }
  },

  /**
   * Internal wrapper to write clips array directly to localStorage.
   * @param {Array<object>} clips
   */
  _saveRaw(clips) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
    } catch (e) {
      console.error('Failed to save clips payload:', e);
    }
  }
};

// Listen to Area deletions to maintain integrity without coupling Areas to Clips
EventBus.on('areaDeleted', (deletedArea) => {
  if (deletedArea && deletedArea.id) {
    ClipsStore.handleAreaDeleted(deletedArea.id);
  }
});
