# dmc2 — Mobile Storage Project

## Overview
This project provides a unified mobile storage library (`MobileStorage`) that wraps localStorage, sessionStorage, and IndexedDB behind a single async API.

## Default Storage Configuration
The default storage config is in `storage.config.json`. To change the backend (e.g. to IndexedDB), edit the `"backend"` field.

## Quick Start
```js
import storage from './src/init.js';

await storage.set('key', value);
const val = await storage.get('key');
```

## Project Structure
- `src/MobileStorage.js` — core storage class
- `src/init.js` — auto-configured singleton (reads `storage.config.json`)
- `src/index.js` — public exports
- `storage.config.json` — default backend & prefix settings
- `test/storage.test.js` — unit tests (`npm test`)

## Key Commands
- Run tests: `npm test`
