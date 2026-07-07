import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

// Exercises the client real-time transport (live: WebSocket → SyncRoom DO):
//   - connect() opens a socket and, on open, announces the current state
//   - broadcastLocal() frames the local state as a {type:"push"} message
//   - _onMessage() routes an inbound peer state through the SAME conflict-safe
//     merge (cloud._applyRemote) a KV pull uses
//   - _applyRemote() unions a peer's checked routine step into local state
// Together these prove a routine check made on one device is applied on another
// the instant it arrives over the live channel — no polling, no KV lag.

const appJs = readFileSync("focus-school/app.js", "utf8");

// Minimal WebSocket double wired so the test can act as the server end.
class FakeWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.sent = [];
    this._listeners = {};
    FakeWebSocket.last = this;
    setTimeout(() => {
      this.readyState = 1; // OPEN
      this._emit("open", {});
    }, 0);
  }
  addEventListener(type, fn) {
    (this._listeners[type] = this._listeners[type] || []).push(fn);
  }
  _emit(type, ev) {
    (this._listeners[type] || []).forEach((fn) => fn(ev));
  }
  send(data) {
    this.sent.push(data);
  }
  close() {
    this.readyState = 3; // CLOSED
    this._emit("close", {});
  }
  // Test helper: the "server" (a peer via the DO) delivers a frame to the client.
  serverSend(obj) {
    this._emit("message", { data: JSON.stringify(obj) });
  }
}

const sandbox = {
  console,
  setInterval() {
    return 0;
  },
  clearInterval() {},
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
  WebSocket: FakeWebSocket,
  location: { protocol: "https:", host: "noam.eduwonderlab.com", search: "" },
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
sandbox.window.WebSocket = FakeWebSocket;

vm.runInNewContext(appJs, sandbox, { filename: "focus-school/app.js" });

const api = sandbox.window.__FOCUS_SCHOOL_TEST__;
const { cloud, live } = api;
const tick = () => new Promise((r) => setTimeout(r, 0));
let passed = 0;
function ok(name) {
  console.log(`  ✓ ${name}`);
  passed += 1;
}

const base = () => {
  const st = api.getState();
  st.settings.sync.enabled = true;
  st.settings.sync.code = "focus-hawk-testcode1";
  st.routineLog = {};
  st.updatedAt = 1000;
  return st;
};

{
  base();
  live.connect();
  await tick();
  await tick();
  assert.equal(live.connected, true, "socket reaches the open state");
  const ws = FakeWebSocket.last;
  assert.ok(ws.sent.length >= 1, "client announced its state on open");
  const first = JSON.parse(ws.sent[0]);
  assert.equal(first.type, "push", "the announce frame is a push");
  assert.ok(first.state && typeof first.state === "object", "announce carries the full state");
  live.close();
  assert.equal(live.connected, false, "close() tears the socket down");
  ok("connect() opens the socket and announces local state on open");
}

{
  base();
  const openSock = { readyState: 1, sent: [], send(d) { this.sent.push(d); } };
  live.ws = openSock;
  const st = api.getState();
  st.routineLog = { "2026-06-29": { r1: ["s1"] } };
  const okSend = live.broadcastLocal();
  assert.equal(okSend, true, "broadcastLocal returns true when the socket is open");
  const frame = JSON.parse(openSock.sent[0]);
  assert.equal(frame.type, "push");
  assert.deepEqual(frame.state.routineLog["2026-06-29"].r1, ["s1"], "frame carries the checked step");
  live.ws = null;
  assert.equal(live.broadcastLocal(), false, "broadcastLocal is a no-op when not connected");
  ok("broadcastLocal frames the current state and only sends when open");
}

{
  base();
  let captured = null;
  const orig = cloud._applyRemote;
  cloud._applyRemote = async (remoteState, remoteUpdated, opts) => {
    captured = { remoteState, remoteUpdated, opts };
    return false;
  };
  live._onMessage({ data: JSON.stringify({ updatedAt: 2000, state: { hello: 1 } }) });
  cloud._applyRemote = orig;
  assert.ok(captured, "an inbound frame is routed to the shared merge");
  assert.equal(captured.remoteUpdated, 2000, "remote updatedAt is passed through");
  assert.equal(captured.opts.doRender, true, "live merges render immediately");
  ok("_onMessage routes peer frames through the shared conflict-safe merge");
}

{
  const st = base();
  st.routineLog = { "2026-06-29": { r1: ["mine"] } };
  st.updatedAt = 1000;
  const peer = {
    ...api.seed(),
    assignments: [],
    classes: [],
    routines: [],
    routineLog: { "2026-06-29": { r1: ["theirs"] } },
    updatedAt: 2000,
  };
  await cloud._applyRemote(peer, 2000, { doRender: false });
  const merged = api.getState().routineLog["2026-06-29"].r1;
  assert.deepEqual(
    [...merged].sort(),
    ["mine", "theirs"],
    "a peer's checked step unions with this device's — neither is lost",
  );
  ok("_applyRemote unions concurrent routine checks from a live peer");
}

console.log(`\nfocus-school-realtime-sync: ${passed}/4 checks passed`);
