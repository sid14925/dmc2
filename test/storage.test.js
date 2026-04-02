/**
 * Basic unit tests for MobileStorage (localStorage backend).
 * Runs in Node.js with a minimal localStorage shim.
 */

// Minimal localStorage shim for Node
const store = {};
globalThis.localStorage = {
  _data: store,
  getItem(key) { return key in store ? store[key] : null; },
  setItem(key, value) { store[key] = String(value); },
  removeItem(key) { delete store[key]; },
  key(i) { return Object.keys(store)[i] || null; },
  get length() { return Object.keys(store).length; },
  clear() { Object.keys(store).forEach((k) => delete store[k]); },
};

import { MobileStorage, STORAGE_BACKENDS } from '../src/index.js';

let passed = 0;
let failed = 0;

async function assert(label, fn) {
  try {
    await fn();
    passed++;
    console.log(`  PASS: ${label}`);
  } catch (err) {
    failed++;
    console.error(`  FAIL: ${label} — ${err.message}`);
  }
}

function eq(a, b) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(`Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  }
}

async function run() {
  console.log('MobileStorage tests\n');

  const storage = new MobileStorage({ prefix: 'test_' });

  await assert('set and get a string', async () => {
    await storage.set('name', 'hello');
    eq(await storage.get('name'), 'hello');
  });

  await assert('set and get an object', async () => {
    await storage.set('obj', { a: 1, b: [2, 3] });
    eq(await storage.get('obj'), { a: 1, b: [2, 3] });
  });

  await assert('has returns true for existing key', async () => {
    eq(await storage.has('name'), true);
  });

  await assert('has returns false for missing key', async () => {
    eq(await storage.has('nonexistent'), false);
  });

  await assert('get returns undefined for missing key', async () => {
    eq(await storage.get('missing'), undefined);
  });

  await assert('keys lists stored keys', async () => {
    const keys = await storage.keys();
    eq(keys.includes('name'), true);
    eq(keys.includes('obj'), true);
  });

  await assert('size returns correct count', async () => {
    eq(await storage.size(), 2);
  });

  await assert('remove deletes a key', async () => {
    await storage.remove('name');
    eq(await storage.has('name'), false);
    eq(await storage.size(), 1);
  });

  await assert('clear removes all prefixed keys', async () => {
    // Add a non-prefixed key to verify it survives
    globalThis.localStorage.setItem('other_key', 'keep');
    await storage.clear();
    eq(await storage.size(), 0);
    eq(globalThis.localStorage.getItem('other_key'), 'keep');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run();
