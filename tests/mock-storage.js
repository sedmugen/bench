/**
 * Minimal in-memory localStorage mock for Node test environments.
 */
class MemoryStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    const val = this.store.get(String(key));
    return val !== undefined ? val : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(String(key));
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
}

if (!globalThis.localStorage) {
  globalThis.localStorage = new MemoryStorage();
}
