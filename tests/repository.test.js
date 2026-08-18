import './mock-storage.js';
import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { Repository } from '../src/core/repository.js';
import { EventBus } from '../src/core/event-bus.js';

describe('Repository & Domain Model', () => {
  beforeEach(() => {
    localStorage.clear();
    EventBus.listeners = {};
  });

  test('should create, retrieve, update, and remove tasks', () => {
    const task = Repository.save({
      title: 'Complete compiler assignment',
      notes: 'Test parser and lexer',
      module: 'capture'
    });

    assert.ok(task.id);
    assert.equal(task.title, 'Complete compiler assignment');
    assert.equal(task.module, 'capture');
    assert.equal(task.status, 'active');

    const retrieved = Repository.get(task.id);
    assert.equal(retrieved.id, task.id);

    const updated = Repository.update(task.id, { notes: 'Updated notes' });
    assert.equal(updated.notes, 'Updated notes');

    const removed = Repository.remove(task.id);
    assert.equal(removed, true);
    assert.equal(Repository.get(task.id), null);
  });

  test('should enforce the hard limit of 3 active Focus tasks', () => {
    Repository.save({ id: 't1', title: 'Task 1', module: 'capture', focused: true, status: 'active' });
    Repository.save({ id: 't2', title: 'Task 2', module: 'capture', focused: true, status: 'active' });
    Repository.save({ id: 't3', title: 'Task 3', module: 'capture', focused: true, status: 'active' });

    assert.equal(Repository.getActiveFocusTasks().length, 3);

    // Attempting to save a 4th active focused task should prevent focus promotion
    const fourth = Repository.save({ id: 't4', title: 'Task 4', module: 'capture', focused: true, status: 'active' });
    assert.equal(fourth.focused, false);
    assert.equal(Repository.getActiveFocusTasks().length, 3);
  });

  test('should correctly identify Focus tasks via isFocusTask', () => {
    const activeFocus = { type: undefined, status: 'active', module: 'capture', focused: true };
    const completedFocus = { type: undefined, status: 'completed', module: 'capture', focused: true };
    const archivedFocus = { type: undefined, status: 'active', module: 'archive', focused: true };
    const area = { type: 'area', status: 'active', module: 'capture', focused: true };

    assert.equal(Repository.isFocusTask(activeFocus), true);
    assert.equal(Repository.isFocusTask(completedFocus), false);
    assert.equal(Repository.isFocusTask(archivedFocus), false);
    assert.equal(Repository.isFocusTask(area), false);
  });

  test('should manage Area entity CRUD and validate name constraints', () => {
    const area = Repository.saveArea({ name: 'Academics', description: 'CS Coursework' });
    assert.ok(area.id);
    assert.equal(area.name, 'Academics');

    // Duplicate name at same parent level should be rejected
    const dup = Repository.saveArea({ name: 'academics' });
    assert.equal(dup, null);

    // Name exceeding 50 chars should be rejected
    const longName = 'A'.repeat(51);
    assert.equal(Repository.saveArea({ name: longName }), null);
  });

  test('should detect and prevent cycles in recursive Area hierarchies', () => {
    const root = Repository.saveArea({ id: 'a-root', name: 'Root' });
    const child = Repository.saveArea({ id: 'a-child', name: 'Child', parentId: 'a-root' });
    const grandchild = Repository.saveArea({ id: 'a-grandchild', name: 'Grandchild', parentId: 'a-child' });

    assert.equal(Repository.wouldCauseCycle('a-root', 'a-grandchild'), true);
    assert.equal(Repository.wouldCauseCycle('a-child', 'a-root'), false);
  });

  test('should construct hierarchical area paths and formatted path strings', () => {
    Repository.saveArea({ id: 'p1', name: 'Projects' });
    Repository.saveArea({ id: 'p2', name: 'Bench', parentId: 'p1' });
    Repository.saveArea({ id: 'p3', name: 'Core Engine', parentId: 'p2' });

    const pathString = Repository.getAreaPathString('p3');
    assert.equal(pathString, 'Projects > Bench > Core Engine');
  });

  test('should force-delete Area, reparent child areas, and reassign tasks', () => {
    const parentArea = Repository.saveArea({ id: 'parent-1', name: 'Parent Area' });
    const childArea = Repository.saveArea({ id: 'child-1', name: 'Child Area', parentId: 'parent-1' });
    const task = Repository.save({ title: 'Task in Parent', areaId: 'parent-1' });
    const targetArea = Repository.saveArea({ id: 'target-1', name: 'Target Area' });

    const success = Repository.deleteAreaForce('parent-1', 'target-1');
    assert.equal(success, true);

    // Child area should now have null parent
    const updatedChild = Repository.get('child-1');
    assert.equal(updatedChild.parentId, null);

    // Task should be reassigned to targetArea
    const updatedTask = Repository.get(task.id);
    assert.equal(updatedTask.areaId, 'target-1');
  });
});
