import './mock-storage.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { ClipsStore, normalizeTags } from '../src/core/clips-store.js';

describe('ClipsStore & Tag Normalizer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('normalizeTags should clean, trim, lowercase and deduplicate tags', () => {
    assert.deepEqual(normalizeTags(['#Rust', ' javascript ', 'RUST', '#bench']), ['rust', 'javascript', 'bench']);
    assert.deepEqual(normalizeTags('dev, #frontend, dev'), ['dev', 'frontend']);
    assert.deepEqual(normalizeTags(null), []);
  });

  test('should create, retrieve, update, and delete clips', () => {
    const clip = ClipsStore.create({
      title: 'Architectural Notes',
      content: 'Bench uses a layered DDD structure.',
      tags: ['#arch', 'domain']
    });

    assert.ok(clip.id);
    assert.equal(clip.title, 'Architectural Notes');
    assert.deepEqual(clip.tags, ['arch', 'domain']);

    const retrieved = ClipsStore.get(clip.id);
    assert.equal(retrieved.title, 'Architectural Notes');

    const updated = ClipsStore.update(clip.id, { title: 'Updated Architectural Notes', color: 'slate' });
    assert.equal(updated.title, 'Updated Architectural Notes');
    assert.equal(updated.color, 'slate');

    const deleted = ClipsStore.delete(clip.id);
    assert.equal(deleted, true);
    assert.equal(ClipsStore.get(clip.id), null);
  });

  test('should sort clips accurately according to sortOrder', () => {
    ClipsStore.create({ id: '1', title: 'Beta', createdAt: 100, updatedAt: 300 });
    ClipsStore.create({ id: '2', title: 'Alpha', createdAt: 200, updatedAt: 100 });
    ClipsStore.create({ id: '3', title: 'Gamma', createdAt: 300, updatedAt: 200 });

    const all = ClipsStore.getAll();
    const sortedByTitleAsc = ClipsStore.sortClips(all, 'title-asc');
    assert.equal(sortedByTitleAsc[0].title, 'Alpha');
    assert.equal(sortedByTitleAsc[1].title, 'Beta');
    assert.equal(sortedByTitleAsc[2].title, 'Gamma');

    const sortedByUpdatedDesc = ClipsStore.sortClips(all, 'updated-desc');
    assert.equal(sortedByUpdatedDesc[0].id, '1');
  });

  test('should disassociate deleted Area ID from clips', () => {
    const clip = ClipsStore.create({ title: 'Area Task', areaId: 'area-123' });
    assert.equal(ClipsStore.get(clip.id).areaId, 'area-123');

    ClipsStore.handleAreaDeleted('area-123');
    assert.equal(ClipsStore.get(clip.id).areaId, null);
  });
});
