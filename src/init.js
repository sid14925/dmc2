/**
 * Project initializer — reads storage.config.json and exports a
 * pre-configured MobileStorage instance as the default project store.
 *
 * Usage:
 *   import storage from './init.js';
 *   await storage.set('user', { name: 'Alice' });
 */

import { MobileStorage } from './MobileStorage.js';
import config from '../storage.config.json' with { type: 'json' };

const storage = new MobileStorage({
  backend: config.backend,
  prefix: config.prefix,
  dbName: config.dbName,
  storeName: config.storeName,
});

// On first load, request persistent storage so mobile browsers won't evict data
if (config.persistOnInit) {
  MobileStorage.requestPersistence().catch(() => {});
}

export default storage;
export { config };
