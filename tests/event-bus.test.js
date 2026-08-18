import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { EventBus } from '../src/core/event-bus.js';

describe('EventBus', () => {
  beforeEach(() => {
    // Clear any listeners
    EventBus.listeners = {};
  });

  test('should subscribe and receive emitted events with payload', () => {
    let received = null;
    EventBus.on('testEvent', (payload) => {
      received = payload;
    });

    EventBus.emit('testEvent', { message: 'hello bench' });
    assert.deepEqual(received, { message: 'hello bench' });
  });

  test('should support unregistering a listener via off', () => {
    let count = 0;
    const handler = () => { count++; };

    EventBus.on('countEvent', handler);
    EventBus.emit('countEvent');
    assert.equal(count, 1);

    EventBus.off('countEvent', handler);
    EventBus.emit('countEvent');
    assert.equal(count, 1);
  });

  test('should isolate errors in listeners without breaking other listeners', () => {
    let secondHandlerCalled = false;

    EventBus.on('errEvent', () => {
      throw new Error('Listener failure');
    });

    EventBus.on('errEvent', () => {
      secondHandlerCalled = true;
    });

    assert.doesNotThrow(() => {
      EventBus.emit('errEvent');
    });

    assert.equal(secondHandlerCalled, true);
  });
});
