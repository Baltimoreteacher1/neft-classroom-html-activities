import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Locks in the adaptive pull cadence that makes cross-device sync feel immediate
// while in use without hammering the KV endpoint when idle:
//   - actively in use (recent local change / interaction) → fast (~2.5s)
//   - idle                                                → relaxed (~12s)
//   - tab hidden                                          → paused (Infinity)

const appJs = readFileSync("focus-school/app.js", "utf8");

const doc = {
  readyState: "loading",
  visibilityState: "visible",
  addEventListener() {},
  getElementById() {
    return null;
  },
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
};

const sandbox = {
  console,
  setInterval() {
    return 0;
  },
  clearInterval() {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  location: { protocol: "https:", search: "" },
  navigator: { userAgent: "Mozilla/5.0 (Macintosh)", onLine: true },
  crypto: { getRandomValues: (a) => a },
  localStorage: {
    _m: {},
    getItem(k) {
      return this._m[k] ?? null;
    },
    setItem(k, v) {
      this._m[k] = String(v);
    },
    removeItem(k) {
      delete this._m[k];
    },
  },
  sessionStorage: {
    getItem() {
      return null;
    },
    setItem() {},
    removeItem() {},
  },
  fetch: () => Promise.resolve({ ok: true, json: async () => ({}) }),
  document: doc,
  window: { __FOCUS_SCHOOL_TEST__: {}, addEventListener() {} },
  addEventListener() {},
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.location = sandbox.location;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.sessionStorage = sandbox.sessionStorage;

vm.runInNewContext(appJs, sandbox, { filename: "focus-school/app.js" });

const api = sandbox.window.__FOCUS_SCHOOL_TEST__;
const cloud = api.cloud;
let passed = 0;
function ok(name) {
  console.log(`  ✓ ${name}`);
  passed += 1;
}

{
  cloud._activeUntil = 0; // no recent activity
  doc.visibilityState = "visible";
  assert.equal(cloud._cadence(), 12000, "idle + visible → relaxed 12s cadence");
  ok("idle visible tab uses the relaxed cadence");
}

{
  cloud.markActive();
  doc.visibilityState = "visible";
  const c = cloud._cadence();
  assert.ok(c <= 2500 && c > 0, `active + visible → fast cadence, got ${c}`);
  ok("recent activity switches the loop to the fast cadence");
}

{
  cloud.markActive(); // still "active"
  doc.visibilityState = "hidden";
  assert.equal(cloud._cadence(), Infinity, "hidden tab pauses polling regardless of activity");
  ok("a hidden tab pauses polling to save the KV endpoint");
}

console.log(`\nfocus-school-adaptive-sync: ${passed}/3 checks passed`);
