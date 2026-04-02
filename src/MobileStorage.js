/**
 * MobileStorage - Unified mobile storage API.
 *
 * Supports localStorage, sessionStorage, and IndexedDB with a single interface.
 * Handles quota limits, serialization, and graceful fallbacks for mobile browsers.
 */

const STORAGE_BACKENDS = {
  LOCAL: 'localStorage',
  SESSION: 'sessionStorage',
  INDEXEDDB: 'indexedDB',
};

class MobileStorage {
  constructor(options = {}) {
    this.prefix = options.prefix || 'dmc2_';
    this.backend = options.backend || STORAGE_BACKENDS.LOCAL;
    this.dbName = options.dbName || 'dmc2_store';
    this.storeName = options.storeName || 'keyval';
    this._db = null;
  }

  _prefixKey(key) {
    return `${this.prefix}${key}`;
  }

  // --- localStorage / sessionStorage ---

  _getWebStorage() {
    if (this.backend === STORAGE_BACKENDS.SESSION) {
      return globalThis.sessionStorage;
    }
    return globalThis.localStorage;
  }

  async set(key, value) {
    if (this.backend === STORAGE_BACKENDS.INDEXEDDB) {
      return this._idbSet(key, value);
    }
    const storage = this._getWebStorage();
    try {
      storage.setItem(this._prefixKey(key), JSON.stringify(value));
    } catch (err) {
      if (isQuotaError(err)) {
        throw new StorageQuotaError(key);
      }
      throw err;
    }
  }

  async get(key) {
    if (this.backend === STORAGE_BACKENDS.INDEXEDDB) {
      return this._idbGet(key);
    }
    const raw = this._getWebStorage().getItem(this._prefixKey(key));
    if (raw === null) return undefined;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  async remove(key) {
    if (this.backend === STORAGE_BACKENDS.INDEXEDDB) {
      return this._idbRemove(key);
    }
    this._getWebStorage().removeItem(this._prefixKey(key));
  }

  async clear() {
    if (this.backend === STORAGE_BACKENDS.INDEXEDDB) {
      return this._idbClear();
    }
    const storage = this._getWebStorage();
    const keysToRemove = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k.startsWith(this.prefix)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  }

  async keys() {
    if (this.backend === STORAGE_BACKENDS.INDEXEDDB) {
      return this._idbKeys();
    }
    const storage = this._getWebStorage();
    const result = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k.startsWith(this.prefix)) {
        result.push(k.slice(this.prefix.length));
      }
    }
    return result;
  }

  async has(key) {
    if (this.backend === STORAGE_BACKENDS.INDEXEDDB) {
      return (await this._idbGet(key)) !== undefined;
    }
    return this._getWebStorage().getItem(this._prefixKey(key)) !== null;
  }

  async size() {
    return (await this.keys()).length;
  }

  // --- IndexedDB helpers ---

  _openDB() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.storeName);
      };
      request.onsuccess = () => {
        this._db = request.result;
        resolve(this._db);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async _idbSet(key, value) {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).put(value, this._prefixKey(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async _idbGet(key) {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).get(this._prefixKey(key));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async _idbRemove(key) {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete(this._prefixKey(key));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async _idbClear() {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async _idbKeys() {
    const db = await this._openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).getAllKeys();
      req.onsuccess = () => {
        const keys = req.result
          .filter((k) => typeof k === 'string' && k.startsWith(this.prefix))
          .map((k) => k.slice(this.prefix.length));
        resolve(keys);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async close() {
    if (this._db) {
      this._db.close();
      this._db = null;
    }
  }

  /** Estimate available storage (Storage API). */
  static async estimateQuota() {
    if (navigator?.storage?.estimate) {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage, quota, remaining: quota - usage };
    }
    return null;
  }

  /** Request persistent storage on mobile (prevents eviction). */
  static async requestPersistence() {
    if (navigator?.storage?.persist) {
      return navigator.storage.persist();
    }
    return false;
  }
}

class StorageQuotaError extends Error {
  constructor(key) {
    super(`Storage quota exceeded while writing key: ${key}`);
    this.name = 'StorageQuotaError';
    this.key = key;
  }
}

function isQuotaError(err) {
  return (
    err instanceof DOMException &&
    (err.code === 22 ||
      err.code === 1014 ||
      err.name === 'QuotaExceededError' ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}

export { MobileStorage, StorageQuotaError, STORAGE_BACKENDS };
export default MobileStorage;
