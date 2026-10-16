/* Client queue + sync, driven against the REAL endpoint and a REAL SQL engine.
 *
 * The fake `fetch` here hands each request to functions/api/class-data, so what
 * is proved is the actual contract: an entry saved offline reaches the class
 * exactly once however the network misbehaves, and nothing that identifies a
 * person ever crosses the wire.
 */

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";

import { onRequest } from "../../functions/api/class-data/[[path]].js";
import { createStore } from "./store.js";
import { createClient, flushQueue, refreshDataset } from "./sync.js";

const KEY = "k-for-tests";

function d1(sqlite) {
  const make = (sql, params) => ({
    bind: (...next) => make(sql, next),
    first: async () => sqlite.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: sqlite.prepare(sql).all(...params) }),
    run: async () => ({ success: true, meta: { changes: Number(sqlite.prepare(sql).run(...params).changes) } }),
  });
  return {
    prepare: (sql) => make(sql, []),
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const out = [];
        for (const s of statements) out.push(await s.run());
        sqlite.exec("COMMIT");
        return out;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
}

let ip = 0;
/** A network between the browser and the endpoint that the test can break. */
function network(env) {
  const wire = [];
  const net = {
    wire,
    down: false, // nothing leaves the device
    dropResponse: false, // the server applies the request, the reply is lost
    status: 0, // force an HTTP status instead of calling the server
    async fetch(url, init = {}) {
      if (net.down) throw new TypeError("Failed to fetch");
      const path = new URL(url, "https://example.test").pathname.replace("/api/class-data/", "");
      wire.push({ path, body: init.body ? JSON.parse(init.body) : null });
      if (net.status) return new Response(JSON.stringify({ ok: false, error: "forced" }), { status: net.status });
      const request = new Request(new URL(url, "https://example.test"), {
        ...init,
        headers: { ...init.headers, "CF-Connecting-IP": `10.1.0.${(ip++ % 250) + 1}` },
      });
      const res = await onRequest({ request, env, params: { path: path.split("?")[0].split("/") } });
      if (net.dropResponse) throw new TypeError("Failed to fetch (response lost)");
      return res;
    },
  };
  return net;
}

function setup() {
  const sqlite = new DatabaseSync(":memory:");
  const env = { DB: d1(sqlite), TEACHER_KEY: KEY };
  const net = network(env);
  const client = createClient({ fetchFn: net.fetch });
  const memory = new Map();
  const storage = {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => memory.set(k, String(v)),
    removeItem: (k) => memory.delete(k),
  };
  const store = createStore(storage);
  store.setInvestigation("pencil-handspan", {});
  return { sqlite, env, net, client, storage, store };
}

async function makeClass(s, templateId = "pencil-handspan") {
  const r = await s.client.create(KEY, { templateId });
  assert.equal(r.ok, true);
  return r.data.code;
}
const rows = (s) => s.sqlite.prepare("SELECT COUNT(*) AS n FROM class_data_entry").get().n;

test("SOLO MODE: no code means no server — contributing never touches the network", async () => {
  const s = setup();
  s.net.down = true;
  assert.equal(s.store.mode, "solo");
  const added = s.store.add({ values: { pencil: 14, handSpan: 18 } });
  assert.equal(added.ok, true);
  assert.equal(s.net.wire.length, 0);
  assert.deepEqual(s.store.dataset().map((e) => e.v), [{ pencil: 14, handSpan: 18 }]);
});

test("OFFLINE QUEUE: saved on the device first, sent once the network returns", async () => {
  const s = setup();
  const code = await makeClass(s);
  s.store.joinClass(code);
  s.store.setInvestigation("pencil-handspan", {});
  s.net.down = true;

  assert.equal(s.store.add({ values: { pencil: 15, handSpan: 19 } }).ok, true);
  assert.equal(s.store.dataset().length, 1, "the student sees their own dot while offline");
  assert.equal(s.store.dataset()[0].mine, true);

  const offline = await flushQueue(s.store, s.client);
  assert.deepEqual([offline.sent, offline.left, offline.offline], [0, 1, true]);
  assert.equal(rows(s), 0);

  s.net.down = false;
  const online = await flushQueue(s.store, s.client);
  assert.deepEqual([online.sent, online.left, online.offline], [1, 0, false]);
  assert.equal(rows(s), 1);
});

test("IDEMPOTENT: the server applied it but the reply was lost — the resend counts once", async () => {
  const s = setup();
  const code = await makeClass(s);
  s.store.joinClass(code);
  s.store.setInvestigation("pencil-handspan", {});
  s.store.add({ values: { pencil: 12, handSpan: 17 } });

  s.net.dropResponse = true;
  const lost = await flushQueue(s.store, s.client);
  assert.equal(lost.left, 1, "the client cannot know it landed");
  assert.equal(rows(s), 1, "but the server has it");

  s.net.dropResponse = false;
  const retry = await flushQueue(s.store, s.client);
  assert.deepEqual([retry.sent, retry.left], [1, 0]);
  assert.equal(rows(s), 1, "still exactly one row");
  // Flushing again is a no-op, not a duplicate.
  await flushQueue(s.store, s.client);
  assert.equal(rows(s), 1);
});

test("a server that is down or throttling (503 / 429) keeps the entry pending, never loses it", async () => {
  const s = setup();
  const code = await makeClass(s);
  s.store.joinClass(code);
  s.store.setInvestigation("pencil-handspan", {});
  s.store.add({ values: { pencil: 12, handSpan: 17 } });
  for (const status of [503, 429, 500]) {
    s.net.status = status;
    const r = await flushQueue(s.store, s.client);
    assert.deepEqual([r.left, r.offline, s.store.rejected().length], [1, true, 0], String(status));
  }
  s.net.status = 0;
  assert.equal((await flushQueue(s.store, s.client)).sent, 1);
});

test("a permanent refusal is recorded, shown, and never retried forever", async () => {
  const s = setup();
  const code = await makeClass(s);
  s.store.joinClass(code);
  s.store.setInvestigation("pencil-handspan", {});
  s.store.add({ values: { pencil: 12, handSpan: 17 } });
  // The teacher moves the class to a different investigation before the send.
  await s.client.activate(KEY, { code, templateId: "get-to-school" });

  const r = await flushQueue(s.store, s.client);
  assert.deepEqual([r.sent, r.rejected, r.left], [0, 1, 0]);
  assert.equal(s.store.rejected()[0].reason, "not-active");
  const before = s.net.wire.length;
  await flushQueue(s.store, s.client);
  assert.equal(s.net.wire.length, before, "no further attempts for a refused entry");
  assert.equal(s.store.dataset().length, 0, "a refused entry is not drawn as class data");
});

test("refreshDataset merges the class data with unsent entries without double counting", async () => {
  const s = setup();
  const code = await makeClass(s);
  s.store.joinClass(code);
  s.store.setInvestigation("pencil-handspan", {});

  const other = setup();
  const otherNet = network(s.env);
  const classmate = createStore(other.storage);
  classmate.joinClass(code);
  classmate.setInvestigation("pencil-handspan", {});
  classmate.add({ values: { pencil: 13, handSpan: 18 } });
  await flushQueue(classmate, createClient({ fetchFn: otherNet.fetch }));

  s.store.add({ values: { pencil: 15, handSpan: 20 } });
  assert.equal(s.store.dataset().length, 1);
  assert.equal((await refreshDataset(s.store, s.client, "pencil-handspan")).ok, true);
  assert.equal(s.store.dataset().length, 2, "classmate's dot + my unsent dot");

  await flushQueue(s.store, s.client);
  await refreshDataset(s.store, s.client, "pencil-handspan");
  const data = s.store.dataset();
  assert.equal(data.length, 2, "now both are on the server — still two, not three");
  assert.deepEqual(data.map((d) => d.mine), [false, true]);
});

test("a shared Chromebook: 'next person' starts a fresh anonymous id, and the cap holds per id", async () => {
  const s = setup();
  s.store.add({ values: { pencil: 12, handSpan: 17 } });
  const again = s.store.add({ values: { pencil: 13, handSpan: 18 } });
  assert.equal(again.ok, false);
  assert.equal(again.error, "contributor-limit");
  const before = s.store.state.clientId;
  s.store.nextPerson();
  assert.notEqual(s.store.state.clientId, before);
  assert.equal(s.store.add({ values: { pencil: 13, handSpan: 18 } }).ok, true);
});

test("the form's own validation refuses what the server would refuse", () => {
  const s = setup();
  for (const values of [{ pencil: 999, handSpan: 18 }, { pencil: 15 }, { pencil: 15, handSpan: 18, name: "Ana" }]) {
    assert.equal(s.store.add({ values }).ok, false, JSON.stringify(values));
  }
  assert.equal(s.store.dataset().length, 0);
});

test("a malformed class code never joins a class", () => {
  const s = setup();
  for (const bad of ["", "abc", "ABCDEFG", "ABC DE!", "OOOOOO", null, undefined]) {
    assert.equal(s.store.joinClass(bad), false, String(bad));
  }
  assert.equal(s.store.mode, "solo");
  assert.equal(s.store.joinClass(" abc-def "), true);
  assert.equal(s.store.state.code, "ABCDEF");
});

test("state survives a reload; blocked storage degrades to memory instead of throwing", async () => {
  const s = setup();
  s.store.add({ values: { pencil: 12, handSpan: 17 } });
  const reloaded = createStore(s.storage);
  assert.equal(reloaded.dataset().length, 1);
  assert.equal(reloaded.state.clientId, s.store.state.clientId);

  const hostile = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  const blocked = createStore(hostile);
  blocked.setInvestigation("pencil-handspan", {});
  assert.equal(blocked.add({ values: { pencil: 12, handSpan: 17 } }).ok, true);
  assert.equal(blocked.dataset().length, 1);
});

test("NO PII ON THE WIRE: every request carries only declared keys, a random hex id and in-range numbers", async () => {
  const s = setup();
  const code = await makeClass(s);
  s.store.joinClass(code);
  s.store.setInvestigation("pencil-handspan", {});
  s.store.add({ values: { pencil: 15, handSpan: 19 } });
  await flushQueue(s.store, s.client);
  await refreshDataset(s.store, s.client, "pencil-handspan");

  const sends = s.net.wire.filter((w) => w.path === "contribute");
  assert.equal(sends.length, 1);
  for (const { body } of sends) {
    assert.deepEqual(Object.keys(body).sort(), ["clientId", "code", "entryId", "source", "templateId", "values"]);
    assert.match(body.clientId, /^[a-f0-9]{32}$/);
    assert.match(body.entryId, /^[a-f0-9]{24}$/);
    assert.deepEqual(Object.keys(body.values).sort(), ["handSpan", "pencil"]);
    for (const v of Object.values(body.values)) assert.equal(typeof v, "number");
  }
  // Nothing readable on the device looks like a person either.
  const saved = JSON.stringify(s.store.state);
  assert.ok(!/(name|email|@|phone|address)/i.test(saved.replace(/"templateId"|"clientId"|"entryId"/g, "")));
});
