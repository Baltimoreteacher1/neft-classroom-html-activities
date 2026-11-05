// Moving progress between eduwonderlab.com and thelanguagepage.com. What must hold: nothing already on the device is
// ever overwritten, bad or foreign data is refused before anything is written, a message is believed only from
// the exact partner origin, and the two spellings of the product name (server and app) cannot drift apart.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { BRAND, brandTitle } from "../access-practice-lab/src/brand.js";
import { makeEntry } from "../access-practice-lab/src/lang/ledger.js";
import { PREFIX } from "../access-practice-lab/src/store.js";
import {
  applyTransfer,
  collectTransfer,
  KIND,
  LIMITS,
  MSG_DATA,
  MSG_READY,
  offerTo,
  parseTransferFile,
  peerOrigin,
  receiveFrom,
  summarizeTransfer,
  validateTransfer,
} from "../access-practice-lab/src/transfer.js";
import { storage } from "../access-practice-lab/src/util.js";
import { LAB_BRAND } from "../functions/_lib/language-page.js";

globalThis.location = { origin: "https://eduwonderlab.com", hostname: "eduwonderlab.com" };
const clear = () => {
  for (const key of storage.keys()) storage.remove(key);
};
const payload = (data) => ({
  kind: KIND,
  v: 1,
  from: "https://eduwonderlab.com",
  at: "2026-11-05T00:00:00Z",
  data,
});
const record = (id) => JSON.stringify({ complete: [id], answers: { [id]: "a" } });

test("each home knows the other, and previews have none", () => {
  const at = (hostname, port = "", protocol = "https:") => peerOrigin({ hostname, port, protocol });
  assert.equal(at("eduwonderlab.com"), "https://thelanguagepage.com");
  assert.equal(at("thelanguagepage.com"), "https://eduwonderlab.com");
  assert.equal(at("localhost", "4173", "http:"), "http://127.0.0.1:4173");
  assert.equal(at("127.0.0.1", "4173", "http:"), "http://localhost:4173");
  assert.equal(at("eduwonderlab-abc.pages.dev"), null);
  assert.equal(at("www.eduwonderlab.com"), null);
  assert.equal(at("thelanguagepage.com.evil.example"), null);
});

test("collect takes every lab key (including learner text outside the progress prefix) and nothing else", () => {
  clear();
  storage.set(`${PREFIX}:studentName`, "Ana");
  storage.set("accessPracticeLab:listenNotes:v1:abc", "notes");
  storage.set("accessPracticeLab:evidenceNotebook:v1", "{}");
  storage.set("accessTeacher:v1:roster", "TEACHER DATA");
  storage.set("unrelated", "x");
  const out = collectTransfer();
  assert.equal(out.kind, KIND);
  assert.deepEqual(Object.keys(out.data).sort(), [
    "accessPracticeLab:evidenceNotebook:v1",
    "accessPracticeLab:listenNotes:v1:abc",
    `${PREFIX}:studentName`,
  ]);
  assert.ok(
    !JSON.stringify(out).includes("TEACHER DATA"),
    "a teacher's roster never travels with student progress",
  );
});

test("validation refuses anything that is not the lab's own data, before reading or writing", () => {
  assert.equal(validateTransfer(null).ok, false);
  assert.equal(validateTransfer({ kind: "other", v: 1, data: {} }).ok, false);
  assert.equal(validateTransfer({ kind: KIND, v: 2, data: {} }).ok, false);
  assert.equal(validateTransfer(payload([])).ok, false);
  assert.equal(validateTransfer(payload({ "accessTeacher:v1:roster": "x" })).ok, false);
  assert.equal(validateTransfer(payload({ [`${PREFIX}:ok`]: 5 })).ok, false);
  assert.equal(validateTransfer(payload({ "accessPracticeLab:bad key": "x" })).ok, false);
  assert.equal(
    validateTransfer(payload({ "accessPracticeLab:__proto__": "x" })).ok,
    true,
    "a plain string key is just a key",
  );
  const tooMany = Object.fromEntries(
    Array.from({ length: LIMITS.keys + 1 }, (_, i) => [`accessPracticeLab:k${i}`, "x"]),
  );
  assert.equal(validateTransfer(payload(tooMany)).ok, false);
  assert.equal(
    validateTransfer(payload({ [`${PREFIX}:big`]: "x".repeat(LIMITS.chars + 1) })).ok,
    false,
  );
  assert.equal(validateTransfer(payload({ [`${PREFIX}:studentName`]: "Ana" })).ok, true);
  assert.throws(() => applyTransfer(payload({ "other:key": "x" })), /do not belong/);
  assert.throws(() => parseTransferFile("not json"), /not a lab progress file/);
  assert.throws(() => parseTransferFile("x".repeat(LIMITS.chars * 2)), /too large/);
});

test("summary names kinds and counts only, never the work", () => {
  clear();
  storage.set(`${PREFIX}:studentName`, "Local");
  const s = summarizeTransfer(
    payload({
      [`${PREFIX}:studentName`]: "SECRET-ANSWER",
      [`${PREFIX}:journey`]: "{}",
      [`${PREFIX}:scaffold`]: "{}",
    }),
  );
  assert.equal(s.ok, true);
  assert.equal(s.count, 3);
  assert.equal(s.already, 1);
  assert.deepEqual(s.families, ["journey", "scaffold", "studentName"]);
  assert.ok(!JSON.stringify(s).includes("SECRET-ANSWER"));
});

test("applying never overwrites what is already on the device and adds what is missing, including newer record families", () => {
  clear();
  storage.set(`${PREFIX}:studentName`, "Local name");
  storage.set(`${PREFIX}:scaffold`, '{"mine":true}');
  const incoming = payload({
    [`${PREFIX}:studentName`]: "Incoming name",
    [`${PREFIX}:scaffold`]: '{"theirs":true}',
    "accessPracticeLab:v1:flashcards": '{"cards":1}',
    [`${PREFIX}:pathway`]: "6-8",
  });
  const result = applyTransfer(incoming);
  assert.equal(storage.get(`${PREFIX}:studentName`), "Local name");
  assert.equal(storage.get(`${PREFIX}:scaffold`), '{"mine":true}');
  assert.equal(
    storage.get("accessPracticeLab:v1:flashcards"),
    '{"cards":1}',
    "a family store.js does not merge is added when absent",
  );
  assert.equal(storage.get(`${PREFIX}:pathway`), "6-8");
  assert.ok(result.added >= 1);
});

test("a ledger record merges instead of replacing, so entries made on either site survive", () => {
  clear();
  const entry = (task, t) =>
    makeEntry({
      id: task,
      t,
      src: "activity",
      task,
      domain: "Reading",
      use: "Inform",
      stage: "independent",
      m: {},
    });
  storage.set(
    `${PREFIX}:ledger`,
    JSON.stringify({ entries: [entry("local-1", "2026-11-01T00:00:00Z")] }),
  );
  applyTransfer(
    payload({
      [`${PREFIX}:ledger`]: JSON.stringify({ entries: [entry("moved-1", "2026-11-02T00:00:00Z")] }),
    }),
  );
  const tasks = JSON.parse(storage.get(`${PREFIX}:ledger`))
    .entries.map((e) => e.task)
    .sort();
  assert.deepEqual(tasks, ["local-1", "moved-1"]);
});

test("a progress record merges activity by activity and keeps local answers", () => {
  clear();
  const key = `${PREFIX}:Reading:A`;
  storage.set(key, record("act-1"));
  applyTransfer(
    payload({
      [key]: JSON.stringify({
        complete: ["act-1", "act-2"],
        answers: { "act-1": "b", "act-2": "c" },
      }),
    }),
  );
  const merged = JSON.parse(storage.get(key));
  assert.deepEqual(merged.complete.sort(), ["act-1", "act-2"]);
  assert.equal(merged.answers["act-1"], "a", "the answer already here wins");
  assert.equal(merged.answers["act-2"], "c");
});

test("an invalid record in the file writes nothing at all", () => {
  clear();
  storage.set(`${PREFIX}:studentName`, "Local");
  assert.throws(
    () =>
      applyTransfer(
        payload({
          [`${PREFIX}:pathway`]: "6-8",
          [`${PREFIX}:ledger`]: JSON.stringify({ entries: "not-an-array" }),
        }),
      ),
    /invalid practice record/,
  );
  assert.equal(
    storage.get(`${PREFIX}:pathway`),
    null,
    "nothing was written before the bad record was found",
  );
});

/** A tiny window: records listeners and lets a test deliver a message from any origin and source. */
function fakeWindow(extra = {}) {
  const listeners = new Set();
  return {
    ...extra,
    addEventListener: (type, fn) => type === "message" && listeners.add(fn),
    removeEventListener: (type, fn) => type === "message" && listeners.delete(fn),
    deliver: (message) => [...listeners].forEach((fn) => fn(message)),
    count: () => listeners.size,
  };
}

test("the sender answers only the partner origin and only the window it opened", () => {
  const peer = "https://thelanguagepage.com";
  const sent = [];
  const target = { postMessage: (data, origin) => sent.push({ data, origin }) };
  const stranger = { postMessage: () => assert.fail("must not answer a stranger") };
  const win = fakeWindow();
  offerTo(peer, target, win);
  win.deliver({ origin: "https://evil.example", source: target, data: { type: MSG_READY } });
  win.deliver({ origin: peer, source: stranger, data: { type: MSG_READY } });
  win.deliver({ origin: peer, source: target, data: { type: "something-else" } });
  assert.equal(sent.length, 0);
  win.deliver({ origin: peer, source: target, data: { type: MSG_READY } });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].origin, peer, "the data is addressed to the exact partner origin");
  assert.equal(sent[0].data.type, MSG_DATA);
  assert.equal(sent[0].data.payload.kind, KIND);
  assert.equal(win.count(), 0, "it stops listening after answering once");
});

test("the receiver asks its opener and accepts only the partner origin's data", () => {
  const peer = "https://eduwonderlab.com";
  const asked = [];
  const opener = { postMessage: (data, origin) => asked.push({ data, origin }) };
  const win = fakeWindow({ opener });
  const got = [];
  assert.ok(receiveFrom(peer, (p) => got.push(p), win));
  assert.deepEqual(asked, [{ data: { type: MSG_READY }, origin: peer }]);
  win.deliver({
    origin: "https://evil.example",
    source: opener,
    data: { type: MSG_DATA, payload: { x: 1 } },
  });
  win.deliver({ origin: peer, source: {}, data: { type: MSG_DATA, payload: { x: 2 } } });
  assert.equal(got.length, 0);
  win.deliver({ origin: peer, source: opener, data: { type: MSG_DATA, payload: { x: 3 } } });
  assert.deepEqual(got, [{ x: 3 }]);
  assert.equal(
    receiveFrom(peer, () => {}, fakeWindow()),
    null,
    "with no opener there is nothing to receive from",
  );
});

test("the server and the app spell the product name the same way", () => {
  assert.equal(BRAND.name, LAB_BRAND.name);
  assert.equal(BRAND.poweredBy, LAB_BRAND.poweredBy);
  globalThis.location = { hostname: "thelanguagepage.com" };
  assert.equal(brandTitle("My Language Path"), "My Language Path · The Language Page");
  globalThis.location = { hostname: "eduwonderlab.com" };
  assert.equal(brandTitle("My Language Path"), "My Language Path · ACCESS Practice Lab");
  assert.equal(brandTitle(""), "ACCESS Practice Lab");
  const worker = readFileSync(
    new URL("../functions/_lib/language-page.js", import.meta.url),
    "utf8",
  );
  assert.ok(worker.includes('name: "The Language Page"'));
});
