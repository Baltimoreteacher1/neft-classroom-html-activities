import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Regression test for the routine-sync drop: ticking several routine steps in a
// quick burst fires cloud.push() while a previous PUT is still in flight. The old
// code dropped those follow-up pushes (`if (this._busy) return`) and the 10s
// auto-pull never retried them, so the later checks stayed local-only and never
// reached the other device. The fix coalesces an in-flight-overlap into exactly
// one follow-up push that carries the newest state.

const appJs = readFileSync("focus-school/app.js", "utf8");

let putBodies = [];
let fetchCall = 0;
let releaseFirst;

const sandbox = {
  console,
  setInterval() {
    return 0;
  },
  clearInterval() {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  location: { protocol: "https:", search: "", origin: "https://noam.eduwonderlab.com", pathname: "/" },
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
  fetch(url, opts) {
    if (opts && opts.method === "PUT") {
      putBodies.push(JSON.parse(opts.body));
      const n = ++fetchCall;
      // Hold the first PUT open so the burst of follow-up push() calls all land
      // while it is still in flight — exactly the overlap the fix targets.
      if (n === 1) {
        return new Promise((resolve) => {
          releaseFirst = () => resolve({ ok: true });
        });
      }
      return Promise.resolve({ ok: true });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  },
  document: {
    readyState: "loading",
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
  },
  window: { __FOCUS_SCHOOL_TEST__: {}, addEventListener() {} },
  addEventListener() {},
};
sandbox.window.window = sandbox.window;
sandbox.window.document = sandbox.document;
sandbox.window.navigator = sandbox.navigator;
sandbox.window.location = sandbox.location;
sandbox.window.localStorage = sandbox.localStorage;
sandbox.window.sessionStorage = sandbox.sessionStorage;
sandbox.window.fetch = sandbox.fetch;

vm.runInNewContext(appJs, sandbox, { filename: "focus-school/app.js" });

const api = sandbox.window.__FOCUS_SCHOOL_TEST__;
let passed = 0;
function ok(name) {
  console.log(`  ✓ ${name}`);
  passed += 1;
}

const st = api.getState();
st.settings.sync.enabled = true;
st.settings.sync.code = "focus-test-code";
st.routineLog = { "2026-06-29": { r1: ["s1"] } };
st.updatedAt = 1000;

// First push begins and hangs (in flight). Simulate more steps being ticked
// while it is still open — each fires another push().
const p1 = api.cloud.push();
st.routineLog["2026-06-29"].r1.push("s2");
st.updatedAt = 1001;
api.cloud.push(); // coalesced, must not be dropped
st.routineLog["2026-06-29"].r1.push("s3");
st.updatedAt = 1002;
api.cloud.push(); // still just one pending follow-up

await Promise.resolve();
assert.equal(putBodies.length, 1, "only the first PUT is in flight while busy");

releaseFirst();
await p1;
// Let the coalesced follow-up push run to completion.
await new Promise((r) => setTimeout(r, 5));

{
  assert.equal(
    putBodies.length,
    2,
    "exactly one coalesced follow-up push fires (not zero dropped, not three racing)",
  );
  ok("burst of routine checks during an in-flight sync is not dropped");
}

{
  const last = putBodies[putBodies.length - 1].state.routineLog["2026-06-29"].r1;
  assert.deepEqual(
    [...last].sort(),
    ["s1", "s2", "s3"],
    "the follow-up push carries every checked step, including the last ones",
  );
  ok("the coalesced push carries the newest routine state to the cloud");
}

console.log(`\nfocus-school-push-coalesce: ${passed}/2 checks passed`);
