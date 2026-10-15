import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Tell app.js to expose pure functions on window.__test
globalThis.window = globalThis.window || globalThis;
globalThis.window.__TEST_MODE__ = true;

// Stub localStorage for the jsdom environment
const localStorageData = {};
globalThis.localStorage = {
  getItem: (k) => localStorageData[k] ?? null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { for (const k in localStorageData) delete localStorageData[k]; },
};

// Load app.js as a script string and evaluate it in the global context
// (app.js uses plain global var declarations, no import/export)
const appCode = readFileSync(join(__dirname, '../js/app.js'), 'utf8');

// Wrap in a function to avoid top-level const redeclaration issues on re-import
const fn = new Function(appCode);
fn();
