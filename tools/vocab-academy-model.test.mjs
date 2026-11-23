// Vocabulary Academy — pure learning-model tests (SPEC §4): states from evidence, half weight for heavy supports,
// review intervals, lapse step-down, due ordering, reviewPerDay cap, save/import/export, corrupted storage.
// Run: node tools/vocab-academy-model.test.mjs
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

// A tiny localStorage so storage.js (src/util.js) behaves as in a browser; `quota` makes writes fail like a full disk.
const mem = new Map();
const fake = { quota: false, blocked: false };
const methods = {
  getItem: (k) => {
    if (fake.blocked) throw new Error("blocked");
    return mem.has(k) ? mem.get(k) : null;
  },
  setItem: (k, v) => {
    if (fake.quota || fake.blocked)
      throw Object.assign(new Error("quota"), { name: "QuotaExceededError" });
    mem.set(k, String(v));
  },
  removeItem: (k) => void mem.delete(k),
};
// Like the browser's Storage, stored keys are enumerable own properties (src/store.js lists them with Object.keys).
globalThis.localStorage = new Proxy(methods, {
  get: (t, k) => (k in t ? t[k] : mem.get(k)),
  ownKeys: () => [...mem.keys()],
  getOwnPropertyDescriptor: (t, k) =>
    mem.has(k) ? { value: mem.get(k), enumerable: true, configurable: true } : undefined,
  has: (t, k) => k in t || mem.has(k),
});

const LAB = new URL("../access-practice-lab/src/", import.meta.url);
const model = await import(new URL("vocab-academy/model.js", LAB));
const srs = await import(new URL("vocab-academy/srs.js", LAB));
const store = await import(new URL("vocab-academy/store.js", LAB));
const contract = await import(new URL("vocab-academy/contract.js", LAB));
const util = await import(new URL("util.js", LAB));

const at = (d, h = 12) => new Date(2026, 10, 1 + d, h); // local noon on Nov (1 + d), 2026
const W = "va.cautious.adj";
const rec = (p, d, patch) => model.recordResult(p, { wordId: W, now: at(d), ...patch });
const stateOf = (p, id = W) => model.wordEntry(p, id).state;
const fresh = () => model.blankProgress();
const reset = () => {
  mem.clear();
  fake.quota = false;
  fake.blocked = false;
  util.storage.remove(contract.VA_KEY);
  util.storage.remove(store.CORRUPT_KEY);
};

test("contract: spaced intervals and review range are the spec's", () => {
  assert.deepEqual(srs.INTERVAL_DAYS, [1, 3, 7, 14, 30, 60]);
  assert.deepEqual(contract.REVIEW_PER_DAY, { min: 3, max: 20, default: 8 });
});

test("states: a word nobody met is new; exposure alone is learning", () => {
  const p = fresh();
  assert.equal(stateOf(p), "new");
  model.markSeen(p, W, { now: at(0) });
  assert.equal(stateOf(p), "learning");
  assert.equal(model.wordEntry(p, W).due, "2026-11-02", "first exposure schedules tomorrow");
});

test("states: one answer never makes a word applying or secure", () => {
  for (const dim of contract.DIMS) {
    const p = fresh();
    rec(p, 0, { dim, ok: true });
    assert.ok(["learning", "developing"].includes(stateOf(p)), `${dim} -> ${stateOf(p)}`);
  }
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  assert.equal(stateOf(p), "developing");
});

test("states: developing needs a correct meaning answer or recognition correct in 2 of the last 3", () => {
  const a = fresh();
  rec(a, 0, { dim: "rec", ok: true });
  assert.equal(stateOf(a), "learning");
  rec(a, 0, { dim: "rec", ok: false });
  assert.equal(stateOf(a), "learning");
  rec(a, 0, { dim: "rec", ok: true });
  assert.equal(stateOf(a), "developing", "ok, miss, ok = 2 of the last 3");
  const b = fresh();
  for (const ok of [true, false, false]) rec(b, 0, { dim: "rec", ok });
  assert.equal(stateOf(b), "learning", "1 of 3 is not enough");
});

test("states: a correct answer with heavy support counts at half weight and never counts against the student", () => {
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true, sup: ["wordBank"] });
  assert.equal(stateOf(p), "learning", "half weight alone does not advance");
  rec(p, 0, { dim: "mean", ok: true, sup: ["model"] });
  assert.equal(stateOf(p), "developing", "two heavy-support answers equal one unsupported answer");
  // light supports (picture, audio, frames) are full weight
  const q = fresh();
  rec(q, 0, { dim: "mean", ok: true, sup: ["picture", "audio", "frames"] });
  assert.equal(stateOf(q), "developing");
  // a heavy-support correct never lowers anything: attempts and correct counts both record it
  const ev = model.wordEntry(p, W).ev.mean;
  assert.equal(ev.n, 2);
  assert.equal(ev.c, 2);
  assert.equal(ev.cw, 1);
  assert.equal(model.supportWeight(["chunked"]), 0.5);
  assert.equal(model.supportWeight([]), 1);
  // heavy-support recognition: three of them are worth 1.5, still short of 2
  const r = fresh();
  for (let i = 0; i < 3; i++) rec(r, 0, { dim: "rec", ok: true, sup: ["readAloud"] });
  assert.equal(stateOf(r), "learning");
  rec(r, 0, { dim: "rec", ok: true });
  assert.equal(stateOf(r), "developing", "h,h,1 in the last three = 2");
});

test("states: applying needs developing + a correct in-context answer + a using-it attempt", () => {
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  rec(p, 0, { dim: "ctx", ok: true });
  assert.equal(stateOf(p), "developing", "no productive attempt yet");
  rec(p, 0, { dim: "prod", ok: false });
  assert.equal(
    stateOf(p),
    "applying",
    "attempting (even missing) counts; the answer does not have to be right",
  );
  const q = fresh();
  rec(q, 0, { dim: "ctx", ok: true });
  rec(q, 0, { dim: "prod", ok: true });
  assert.equal(stateOf(q), "learning", "applying never skips developing");
});

test("states: secure needs delayed retrieval after 7+ days and two dimensions correct", () => {
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  rec(p, 0, { dim: "ctx", ok: true });
  rec(p, 0, { dim: "prod", ok: true });
  assert.equal(stateOf(p), "applying");
  rec(p, 3, { dim: "delay", ok: true });
  assert.equal(stateOf(p), "applying", "a 3-day gap is not a 7-day interval");
  rec(p, 11, { dim: "delay", ok: true });
  assert.equal(stateOf(p), "secure", "8 days since it was last seen");
  rec(p, 11, { dim: "delay", ok: true });
  assert.equal(model.wordEntry(p, W).ev.delay.q, 1, "the second item the same day was not delayed");
});

test("states: a review item counts as delayed retrieval whichever dimension it tests", () => {
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  rec(p, 0, { dim: "ctx", ok: true });
  rec(p, 0, { dim: "prod", ok: true });
  rec(p, 10, { dim: "mean", ok: true, type: "review" });
  assert.equal(stateOf(p), "secure");
});

test("states: a miss on a secure or applying word after its due date is review-needed; the next correct due answer clears it", () => {
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  rec(p, 0, { dim: "ctx", ok: true });
  rec(p, 0, { dim: "prod", ok: true });
  rec(p, 11, { dim: "delay", ok: true });
  assert.equal(stateOf(p), "secure");
  const due = model.wordEntry(p, W).due;
  rec(p, 11, { dim: "mean", ok: false }); // not due yet: no flag
  assert.notEqual(stateOf(p), "review-needed", "a miss before the due date never flags");
  const day = (iso) => Math.round((new Date(`${iso}T12:00:00`) - at(0)) / 86400000);
  rec(p, day(due) + 2, { dim: "mean", ok: false });
  assert.equal(stateOf(p), "review-needed");
  rec(p, day(due) + 2, { dim: "mean", ok: true });
  assert.equal(stateOf(p), "review-needed", "a retry the same day does not clear it");
  const next = model.wordEntry(p, W).due;
  rec(p, day(next), { dim: "mean", ok: true });
  assert.notEqual(stateOf(p), "review-needed");
  // a miss on a merely developing word never flags
  const q = fresh();
  rec(q, 0, { dim: "mean", ok: true });
  rec(q, 5, { dim: "mean", ok: false });
  assert.equal(stateOf(q), "developing");
});

test("srs: intervals 1, 3, 7, 14, 30, 60 when answered on the due day, then it stays at 60", () => {
  const p = fresh();
  model.markSeen(p, W, { now: at(0) });
  let day = 0;
  const seen = [];
  for (let i = 0; i < 7; i++) {
    const due = model.wordEntry(p, W).due;
    day = Math.round((new Date(`${due}T12:00:00`) - at(0)) / 86400000);
    rec(p, day, { dim: "mean", ok: true });
    seen.push(Math.round((new Date(`${model.wordEntry(p, W).due}T12:00:00`) - at(day)) / 86400000));
  }
  assert.deepEqual(seen, [3, 7, 14, 30, 60, 60, 60]);
  assert.equal(model.wordEntry(p, W).step, 5);
});

test("srs: an early correct answer leaves the step and the due date alone; on-time or late advances", () => {
  const p = fresh();
  model.markSeen(p, W, { now: at(0) });
  rec(p, 0, { dim: "mean", ok: true });
  const e = model.wordEntry(p, W);
  assert.equal(e.step, 0);
  assert.equal(e.due, "2026-11-02");
  rec(p, 3, { dim: "mean", ok: true }); // late: still advances
  assert.equal(model.wordEntry(p, W).step, 1);
  assert.equal(model.wordEntry(p, W).due, "2026-11-07");
  rec(p, 4, { dim: "mean", ok: true }); // early
  assert.equal(model.wordEntry(p, W).step, 1);
  assert.equal(model.wordEntry(p, W).due, "2026-11-07");
});

test("srs: a miss steps down two (minimum 0), adds a lapse, and is due tomorrow", () => {
  const p = fresh();
  p.words[W] = {
    ev: {},
    seen: 4,
    first: "2026-10-01",
    lastDay: "2026-11-01",
    at: at(0).toISOString(),
    due: "2026-11-30",
    step: 4,
    lapses: 0,
  };
  rec(p, 5, { dim: "mean", ok: false });
  let e = model.wordEntry(p, W);
  assert.deepEqual([e.step, e.lapses, e.due], [2, 1, "2026-11-07"]);
  rec(p, 5, { dim: "mean", ok: false }); // same day: no second penalty
  e = model.wordEntry(p, W);
  assert.deepEqual([e.step, e.lapses], [2, 1]);
  rec(p, 8, { dim: "mean", ok: false });
  e = model.wordEntry(p, W);
  assert.deepEqual([e.step, e.lapses], [0, 2], "never below 0");
  assert.equal(e.due, "2026-11-10");
});

test("srs: a miss on the day a word is first met is learning, not a lapse", () => {
  const p = fresh();
  rec(p, 0, { dim: "rec", ok: false });
  rec(p, 0, { dim: "rec", ok: false });
  const e = model.wordEntry(p, W);
  assert.deepEqual([e.step, e.lapses, e.due], [0, 0, "2026-11-02"]);
});

test("srs: heavy-support correct answers advance a step only in pairs", () => {
  const p = fresh();
  model.markSeen(p, W, { now: at(0) });
  rec(p, 1, { dim: "mean", ok: true, sup: ["wordBank"] });
  assert.equal(model.wordEntry(p, W).step, 0);
  assert.equal(model.wordEntry(p, W).due, "2026-11-03", "comes back after the same interval");
  rec(p, 2, { dim: "mean", ok: true, sup: ["wordBank"] });
  assert.equal(model.wordEntry(p, W).step, 1);
  assert.deepEqual(
    srs.nextReview({ step: 5, due: "2026-11-01" }, true, at(9)).step,
    5,
    "stays at the last interval",
  );
});

test("due words: most overdue first, review-needed before equals, deterministic", () => {
  const p = fresh();
  const mk = (id, due, extra = {}) =>
    (p.words[id] = { ev: {}, seen: 1, due, step: 1, lapses: 0, ...extra });
  mk("va.c.n", "2026-11-05");
  mk("va.a.n", "2026-11-03");
  mk("va.b.n", "2026-11-03", { rn: true });
  mk("va.d.n", "2026-11-20"); // future
  mk("va.e.n", "2026-11-03", { step: 0 });
  assert.deepEqual(model.dueWords(p, { now: at(6), limit: 10 }), [
    "va.b.n",
    "va.e.n",
    "va.a.n",
    "va.c.n",
  ]);
  assert.deepEqual(model.dueWords(p, { now: at(6), limit: 2 }), ["va.b.n", "va.e.n"]);
  assert.deepEqual(model.dueWords(p, { now: at(0), limit: 10 }), [], "nothing due yet");
  p.words["va.a.n"].g = "6";
  p.words["va.c.n"].g = "7";
  assert.deepEqual(model.dueWords(p, { now: at(6), limit: 10, grade: "6" }), [
    "va.b.n",
    "va.e.n",
    "va.a.n",
  ]);
  // an unlabelled word is never hidden; a labelled one is filtered
  assert.deepEqual(
    model.dueWords(p, {
      now: at(6),
      limit: 10,
      grade: "7",
      gradeOf: (id) => (id === "va.e.n" ? "6" : ""),
    }),
    ["va.b.n", "va.c.n"],
  );
});

test("reviewPerDay: default 8, teacher range 3-20, and today's reviews use up the cap", () => {
  const p = fresh();
  for (let i = 0; i < 30; i++)
    p.words[`va.w${String(i).padStart(2, "0")}.n`] = {
      ev: {},
      seen: 1,
      due: "2026-11-02",
      step: 0,
      lapses: 0,
    };
  assert.equal(model.reviewPerDay(p), 8);
  assert.equal(model.dueWords(p, { now: at(2) }).length, 8, "default cap");
  model.setReviewPerDay(p, 1);
  assert.equal(model.reviewPerDay(p), 3);
  model.setReviewPerDay(p, 99);
  assert.equal(model.reviewPerDay(p), 20);
  model.setReviewPerDay(p, "abc");
  assert.equal(model.reviewPerDay(p), 8);
  model.setReviewPerDay(p, 5);
  assert.equal(model.dueWords(p, { now: at(2) }).length, 5);
  assert.equal(srs.reviewLoad(p, at(2)).due, 30);
  assert.equal(srs.reviewLoad(p, at(2)).today, 5);
  // review two words today: only three remain under the cap of 5
  for (const id of model.dueWords(p, { now: at(2), limit: 2 }))
    model.recordResult(p, { wordId: id, dim: "mean", ok: true, now: at(2) });
  const load = srs.reviewLoad(p, at(2));
  assert.deepEqual([load.doneToday, load.today, load.due], [2, 3, 28]);
  assert.equal(model.dueWords(p, { now: at(2) }).length, 3);
  assert.equal(model.dueWords(p, { now: at(3) }).length, 5, "a new day starts a new allowance");
});

test("units: lessons, resume pointer, status, assessments and the summary", () => {
  const p = fresh();
  model.setUnitStage(p, "g6-u01", "a", { done: true, now: at(0) });
  model.setUnitStage(p, "g6-u01", "B", { pos: 3, now: at(1) });
  assert.deepEqual(p.last, { unit: "g6-u01", lesson: "b", at: at(1).toISOString() });
  let st = model.unitStatus(p, "g6-u01", ["x.n"]);
  assert.deepEqual(Object.keys(st.lessons), ["a", "b", "c", "d", "e", "f", "g", "h"]);
  assert.equal(st.doneCount, 1);
  assert.equal(st.lessons.b.pos, 3);
  assert.equal(st.lessons.b.done, false);
  assert.equal(st.wordStates.new, 1);
  assert.throws(() => model.setUnitStage(p, "g6-u01", "z", {}), RangeError);
  model.recordAssessment(p, "g6-u01", "A", {
    score: 7,
    total: 10,
    perWord: { [W]: { ok: true } },
    now: at(2),
  });
  model.recordAssessment(p, "g6-u01", "A", { score: 9, total: 10, now: at(9) });
  st = model.unitStatus(p, "g6-u01");
  assert.equal(st.assess.A.score, 9);
  assert.equal(st.assess.A.attempts.length, 2);
  assert.equal(st.assess.B, null);
  assert.throws(() => model.recordAssessment(p, "g6-u01", "C", {}), RangeError);
  rec(p, 0, { dim: "mean", ok: true, unit: "g6-u01", grade: "6" });
  assert.equal(
    model.unitStatus(p, "g6-u01").wordStates.developing,
    1,
    "words recorded with a unit id are counted without a list",
  );
  const sum = model.studentSummary(p, { now: at(0) });
  assert.equal(sum.words.total, 1);
  assert.equal(sum.words.byState.developing, 1);
  assert.equal(sum.units.started, 1);
  assert.equal(sum.units.completed, 0);
  assert.equal(sum.learned, 0);
});

test("recordResult rejects programmer errors loudly", () => {
  const p = fresh();
  assert.throws(() => model.recordResult(p, { wordId: W, dim: "nope", ok: true }), RangeError);
  assert.throws(() => model.recordResult(p, { wordId: "", dim: "rec", ok: true }), TypeError);
  assert.throws(
    () => model.recordResult(p, { wordId: "__proto__", dim: "rec", ok: true }),
    TypeError,
  );
  assert.throws(
    () => model.recordResult(p, { wordId: W, dim: "rec", ok: true, now: "not a date" }),
    RangeError,
  );
});

test("save state: saving then saved, and error-recoverable when storage refuses the write", () => {
  reset();
  const events = [];
  const off = store.onSaveState((s) => events.push(s.state));
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  assert.equal(store.saveProgress(p).state, "saved");
  assert.deepEqual(events, ["saving", "saved"]);
  fake.quota = true;
  rec(p, 1, { dim: "ctx", ok: true });
  const res = store.saveProgress(p);
  assert.equal(res.state, "error-recoverable");
  assert.equal(store.getSaveState().state, "error-recoverable");
  assert.equal(store.loadProgress().words[W].ev.ctx.n, 1, "work is still held in this tab");
  off();
  fake.quota = false;
  assert.equal(store.saveProgress(p).state, "saved");
  assert.equal(events.length, 4, "unsubscribed listeners hear nothing more");
  // storage that throws on every access (blocked cookies) must not break loading or saving
  fake.blocked = true;
  assert.doesNotThrow(() => store.loadProgress());
  assert.equal(store.saveProgress(p).state, "error-recoverable");
  fake.blocked = false;
  // a broken listener never breaks a save
  store.onSaveState(() => {
    throw new Error("boom");
  });
  assert.equal(store.saveProgress(p).state, "saved");
});

test("export / import: round trip, unknown keys kept, merge is idempotent and loses nothing", () => {
  reset();
  const a = fresh();
  a.prefs.reviewPerDay = 6;
  a.prefs.custom = { keep: "me" };
  a.teacherNote = { id: 1 };
  rec(a, 0, { dim: "mean", ok: true });
  model.setUnitStage(a, "g6-u01", "a", { done: true, now: at(0) });
  store.saveProgress(a);
  const exported = JSON.parse(JSON.stringify(store.exportProgress()));
  assert.equal(exported.v, 1);
  assert.deepEqual(exported.prefs, { reviewPerDay: 6, custom: { keep: "me" } });
  assert.deepEqual(exported.teacherNote, { id: 1 });

  // another device that practised a different word and the same word later
  reset();
  const b = fresh();
  model.recordResult(b, { wordId: "va.other.n", dim: "rec", ok: true, now: at(2) });
  model.recordResult(b, { wordId: W, dim: "ctx", ok: true, now: at(5) });
  model.setUnitStage(b, "g6-u01", "b", { done: true, now: at(3) });
  store.saveProgress(b);
  const first = store.importProgress(exported);
  assert.equal(first.state, "saved");
  let merged = store.loadProgress();
  assert.ok(merged.words["va.other.n"], "this device's word kept");
  assert.equal(merged.words[W].ev.ctx.n, 1, "the more recently updated record wins whole");
  assert.equal(merged.words[W].ev.mean, undefined);
  assert.equal(
    model.unitStatus(merged, "g6-u01").doneCount,
    2,
    "lessons done on either device stay done",
  );
  assert.deepEqual(merged.prefs, { reviewPerDay: 6, custom: { keep: "me" } });
  const once = JSON.stringify(merged);
  store.importProgress(exported);
  assert.equal(
    JSON.stringify(store.loadProgress()),
    once,
    "importing the same backup again changes nothing",
  );
  // a pure merge with nothing local is the incoming record
  assert.deepEqual(model.mergeProgress(null, exported).words, exported.words);
  // invalid imports change nothing
  const before = JSON.stringify(store.loadProgress());
  for (const bad of [null, [], "text", { v: 2 }, { words: {} }])
    assert.throws(() => store.importProgress(bad), /not a Vocabulary Academy backup/);
  assert.equal(JSON.stringify(store.loadProgress()), before);
});

test("corrupted storage: unreadable or hostile records load as blank, are kept once, and never throw", () => {
  reset();
  util.storage.set(contract.VA_KEY, "{not json");
  const p = store.loadProgress();
  assert.deepEqual(p, model.blankProgress());
  assert.equal(util.storage.get(store.CORRUPT_KEY), "{not json", "a copy survives for recovery");
  util.storage.set(contract.VA_KEY, '{"v":9,"words":{}}');
  assert.deepEqual(store.loadProgress(), model.blankProgress());
  assert.equal(
    util.storage.get(store.CORRUPT_KEY),
    "{not json",
    "the first copy is not overwritten",
  );

  const messy = {
    v: 1,
    grade: "99",
    pathway: "weird",
    words: {
      [W]: {
        ev: {
          mean: { c: 99, n: 2, cw: "x", r: "zzzz", last: "nope", q: -4 },
          rec: "bad",
          nope: { c: 1, n: 1 },
        },
        seen: "7",
        step: 99,
        lapses: -3,
        due: "tomorrow",
        rn: "yes",
      },
      "bad id with spaces": { ev: {} },
      "va.arr.n": [],
      ["__proto__"]: { polluted: true },
    },
    units: {
      "g6-u01": {
        lessons: { a: { done: "true" }, z: { done: true } },
        assess: { A: { score: 99, total: 10 }, C: {} },
      },
      "../x": {},
    },
    last: { unit: "g6-u01", lesson: "zz" },
    prefs: { reviewPerDay: 500 },
    daily: { day: "yesterday", words: "x" },
  };
  util.storage.set(contract.VA_KEY, JSON.stringify(messy));
  const clean = store.loadProgress();
  assert.equal(clean.grade, "");
  assert.equal(clean.pathway, "grade");
  assert.deepEqual(Object.keys(clean.words), [W]);
  const w = clean.words[W];
  assert.equal(w.ev.mean.n, 2);
  assert.equal(w.ev.mean.c, 2, "c can never exceed n");
  assert.equal(w.ev.mean.r, "");
  assert.equal(w.ev.mean.last, null);
  assert.equal(w.ev.mean.q, 0);
  assert.equal(w.ev.rec, undefined);
  assert.equal(w.ev.nope, undefined);
  assert.deepEqual([w.seen, w.step, w.lapses, w.rn], [7, 5, 0, false]);
  assert.equal(w.due, undefined);
  assert.equal(clean.units["g6-u01"].lessons.a.done, false);
  assert.equal(clean.units["g6-u01"].lessons.z, undefined);
  assert.equal(clean.units["g6-u01"].assess.A.score, 10);
  assert.equal(clean.units["g6-u01"].assess.C, undefined);
  assert.equal(clean.units["../x"], undefined);
  assert.equal(clean.last, null);
  assert.equal(clean.prefs.reviewPerDay, 20);
  assert.deepEqual(clean.daily, { day: "", words: [] });
  assert.equal({}.polluted, undefined, "Object.prototype untouched");
  assert.doesNotThrow(() => model.studentSummary(clean, { now: at(0) }));
  assert.doesNotThrow(() => model.dueWords(clean, { now: at(40) }));
  // hostile import
  const hostile = JSON.parse(
    '{"v":1,"__proto__":{"admin":true},"words":{"__proto__":{"x":1},"constructor":{"y":1}},"prefs":{"__proto__":{"z":1}}}',
  );
  const merged = model.mergeProgress(model.blankProgress(), hostile);
  assert.equal(merged.admin, undefined);
  assert.equal({}.admin, undefined);
  assert.equal({}.z, undefined);
  // a truthful, cleaned export
  assert.equal(JSON.stringify(store.exportProgress()).includes("polluted"), false);
});

test("the lab's Passport export carries this record, imports merge it, Start Fresh clears it", async () => {
  reset();
  const lab = await import(new URL("store.js", LAB));
  const p = fresh();
  rec(p, 0, { dim: "mean", ok: true });
  p.grade = "6";
  store.saveProgress(p);
  const code = lab.exportCode();
  const data = JSON.parse(decodeURIComponent(escape(atob(code.slice(8))))).data;
  assert.ok(data[contract.VA_KEY], "VA_KEY is inside the ACCESS1 code");

  // restore on a clean device
  reset();
  assert.equal(lab.importCode(code) > 0, true);
  assert.equal(store.loadProgress().words[W].ev.mean.c, 1);
  assert.equal(store.loadProgress().grade, "6");
  // importing again changes nothing; a device with newer work keeps it
  assert.equal(lab.importCode(code), 0);
  const local = store.loadProgress();
  rec(local, 3, { dim: "ctx", ok: true });
  store.saveProgress(local);
  lab.importCode(code);
  assert.equal(
    store.loadProgress().words[W].ev.ctx.n,
    1,
    "newer local work survives an older backup",
  );
  // a malformed record refuses the whole import and writes nothing
  const bad = `ACCESS1.${btoa(unescape(encodeURIComponent(JSON.stringify({ v: 1, data: { [contract.VA_KEY]: "[1,2]", "accessPracticeLab:v1:studentName": "Nope" } }))))}`;
  const snapshot = JSON.stringify(store.loadProgress());
  assert.throws(() => lab.importCode(bad), /invalid Vocabulary Academy record/);
  assert.equal(JSON.stringify(store.loadProgress()), snapshot);
  assert.equal(
    util.storage.get("accessPracticeLab:v1:studentName"),
    null,
    "nothing else was written either",
  );
  lab.clearAll();
  assert.equal(util.storage.get(contract.VA_KEY), null, "Start Fresh clears it");
});

test("teacher mode reuses the lab's audience memory and the tab's site key, nothing new", () => {
  reset();
  assert.equal(store.isTeacherMode(), false);
  util.storage.set("accessPracticeLab:v1:audience", "student");
  assert.equal(store.isTeacherMode(), false);
  util.storage.set("accessPracticeLab:v1:audience", "teacher");
  assert.equal(store.isTeacherMode(), true);
  util.storage.set(
    "accessPracticeLab:v1:audience",
    JSON.stringify({ audience: "teacher", role: "esol" }),
  );
  assert.equal(store.isTeacherMode(), true);
  util.storage.set("accessPracticeLab:v1:audience", "garbage");
  assert.equal(store.isTeacherMode(), false);
  util.storage.remove("accessPracticeLab:v1:audience");
});

// ── routes, data loading and the Core views (no browser: views are pure render functions) ─────────────────────
const router = await import(new URL("vocab-academy/router.js", LAB));
const data = await import(new URL("vocab-academy/data.js", LAB));
const { makeI18n } = await import(new URL("i18n.js", LAB));
const { toHtml } = util;
const ROOT = new URL("../", import.meta.url);

test("router: every route in SPEC section 2 resolves to its sub-view; anything else is notfound", () => {
  const r = (...p) => router.resolve(p);
  assert.equal(r().name, "dashboard");
  assert.equal(r("grades").name, "grades");
  assert.deepEqual(r("grade", "6"), { name: "grade", params: { grade: "6" }, teacherOnly: false });
  assert.deepEqual(r("grade", "k", "lesson", "3").params, { grade: "K", n: 3 });
  assert.equal(r("grade", "k", "lesson", "3").name, "lesson-home");
  assert.deepEqual(r("grade", "6", "lesson", "1", "C").params, { grade: "6", n: 1, letter: "c" });
  assert.equal(r("grade", "6", "lesson", "1", "z").name, "notfound");
  assert.equal(r("grade", "6", "lesson", "0").name, "notfound");
  // a unit is a group of lessons, with a crossword and a test of its own
  assert.deepEqual(r("grade", "k", "unit", "3").params, { grade: "K", u: 3 });
  assert.equal(r("grade", "k", "unit", "3").name, "unit");
  assert.deepEqual(r("grade", "6", "unit", "2", "crossword"), {
    name: "unit-activity",
    params: { grade: "6", u: 2, activity: "crossword" },
    teacherOnly: false,
  });
  assert.equal(r("grade", "6", "unit", "2", "test").name, "unit-activity");
  assert.equal(r("grade", "6", "unit", "2", "a").name, "notfound");
  assert.equal(r("grade", "6", "unit", "0").name, "notfound");
  assert.equal(r("grade", "6", "unit", "cu_x").name, "notfound");
  assert.equal(r("grade", "99").name, "notfound");
  assert.equal(r("word", "va_cautious_adj").params.wordId, "va.cautious.adj");
  assert.equal(r("word", "va.cautious.adj").params.wordId, "va.cautious.adj");
  for (const name of ["word-study", "practice", "review", "family"])
    assert.equal(r(name).name, name);
  assert.equal(r("games").name, "games");
  assert.equal(r("games", "word-quest").params.gameId, "word-quest");
  assert.equal(r("teacher").teacherOnly, true);
  assert.equal(r("teacher", "custom").name, "custom");
  assert.equal(r("teacher", "custom").teacherOnly, true);
  assert.deepEqual(r("present", "6", "1").params, { grade: "6", n: 1 });
  for (const kind of contract.PRINT_KINDS) {
    const hit = r("print", "6", "1", kind);
    assert.equal(hit.name, "print");
    assert.equal(hit.teacherOnly, kind === "teacher" || kind === "assessment-key", kind);
  }
  assert.equal(r("print", "6", "1", "nope").name, "notfound");
  assert.equal(r("elsewhere").name, "notfound");
  for (const loader of Object.values(router.SUBVIEW_LOADERS))
    assert.equal(typeof loader, "function");
});

test("links: word URLs never end in a file-looking extension, and round trip", () => {
  const id = "va.cautious.adj";
  assert.equal(data.wordSegment(id), "va_cautious_adj");
  assert.equal(data.wordIdFromSegment(data.wordSegment(id)), id);
  assert.equal(data.wordIdFromSegment(data.wordSegment("va.bat.n.2")), "va.bat.n.2");
  assert.ok(!/\.[a-z0-9]+$/i.test(new URL(data.wordHref(id), "http://x").pathname));
  assert.equal(
    data.lessonHref("6", 1, "C"),
    "/access-practice-lab/vocabulary-academy/grade/6/lesson/1/c",
  );
});

// A fake static host serving the real content files from disk (or 404).
const diskFetch =
  (overrides = {}) =>
  async (url) => {
    const path = new URL(url, "http://x").pathname;
    if (path in overrides)
      return {
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => overrides[path],
      };
    const file = new URL(`.${path}`, ROOT);
    if (!path.startsWith("/access-practice-lab/content/") || !existsSync(file))
      return { ok: false };
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => JSON.parse(readFileSync(file, "utf8")),
    };
  };
const CONTENT = "/access-practice-lab/content/vocab-academy";

test("data: a missing index or unit file is a truthful empty result, never a throw", async () => {
  data.configureData({ fetchImpl: async () => ({ ok: false }) });
  assert.equal((await data.getIndex()).missing, true);
  assert.equal(await data.getUnit("g6-u01"), null);
  assert.equal(await data.getWord("va.cautious.adj"), null);
  assert.deepEqual(await data.getWords(["va.x.n"]), []);
  assert.equal(await data.getGrade("nope"), null);
  const o = await data.getGradeOverview("6");
  assert.equal(o.status, "planned");
  assert.equal(o.publishedCount, 0);
  data.configureData({
    fetchImpl: async () => ({
      ok: true,
      headers: { get: () => "text/html" },
      json: async () => ({}),
    }),
  });
  assert.equal((await data.getIndex()).missing, true, "an HTML shell answer is not content");
});

test("data: grade overview merges the scope with what the index publishes; grades 9-12 are 'later'", async () => {
  const scope = {
    schema: 1,
    grade: "6",
    focus: "f",
    arc: ["a"],
    units: [
      {
        id: "g6-u01",
        n: 1,
        title: "One",
        theme: "t",
        strand: "thematic",
        words: [{ hw: "a", pos: "n" }],
      },
      {
        id: "g6-u02",
        n: 2,
        title: "Two",
        theme: "t",
        strand: "morphology",
        words: [{ hw: "b", pos: "n" }],
      },
    ],
  };
  const index = {
    schema: 1,
    totals: {},
    words: {},
    grades: {
      6: {
        unitCount: 1,
        wordCount: 1,
        units: [
          {
            id: "g6-u01",
            n: 1,
            title: "One",
            theme: "t",
            strand: "thematic",
            file: "x",
            wordIds: ["va.a.n"],
            words: [{ id: "va.a.n", hw: "a", pos: "n" }],
          },
        ],
      },
    },
  };
  data.configureData({
    fetchImpl: diskFetch({ [`${CONTENT}/index.json`]: index, [`${CONTENT}/g6/grade.json`]: scope }),
  });
  const o = await data.getGradeOverview("6");
  assert.equal(o.status, "partial");
  assert.deepEqual(
    o.units.map((u) => [u.n, u.published]),
    [
      [1, true],
      [2, false],
    ],
  );
  assert.equal(o.planned, 2);
  const later = await data.getGradeOverview("9");
  assert.equal(later.status, "later");
  assert.deepEqual(later.units, []);
  assert.ok(!contract.SHIPPED_GRADES.includes("9"));
});

test("views: lesson page shows teacher tools ONLY to a teacher; grades page offers K-8 and never opens 9-12", async () => {
  const unitJson = JSON.parse(
    readFileSync(new URL("docs/vocab-academy/reference-unit.json", ROOT), "utf8"),
  );
  const index = {
    schema: 1,
    totals: {},
    grades: {
      6: {
        unitCount: 1,
        wordCount: 10,
        units: [
          {
            id: "g6-u01",
            n: 1,
            title: unitJson.title,
            theme: unitJson.theme,
            strand: unitJson.strand,
            file: "x",
            wordIds: unitJson.words.map((w) => w.id),
            words: unitJson.words.map((w) => ({ id: w.id, hw: w.hw, pos: w.pos })),
          },
        ],
      },
    },
    words: Object.fromEntries(
      unitJson.words.map((w) => [
        w.id,
        { unit: "g6-u01", grade: "6", hw: w.hw, pos: w.pos, tier: w.tier },
      ]),
    ),
  };
  data.configureData({
    fetchImpl: diskFetch({
      [`${CONTENT}/index.json`]: index,
      [`${CONTENT}/g6/u01.json`]: unitJson,
    }),
  });
  const I = makeI18n("en");
  const va = (teacher) => ({
    I,
    params: { grade: "6", n: 1 },
    progress: model.blankProgress(),
    teacher,
    supports: () => contract.emptySupports(),
    save() {},
    route: { path: [], q: {} },
  });
  const unit = await import(new URL("vocab-academy/views/lesson-home.js", LAB));
  const student = toHtml((await unit.render({ band: "6-8" }, va(false))).html);
  const teacher = toHtml((await unit.render({ band: "6-8" }, va(true))).html);
  assert.ok(
    !/va-teacher-strip|For teachers|\/present\/|\/print\//.test(student),
    "no teacher markup for a student",
  );
  assert.match(teacher, /va-teacher-strip/);
  assert.equal(
    (student.match(/class="va-lesson"/g) || []).length,
    8,
    "eight sections: word list, A-F, review",
  );
  for (const letter of "abcdefgh") assert.match(student, new RegExp(`/lesson/1/${letter}"`));
  assert.match(student, /class="va-wl-entry"/, "the Word List shows every word with its meaning");
  assert.equal((student.match(/class="va-wl-entry"/g) || []).length, unitJson.words.length);
  assert.match(student, /Exercise 1A: Finding Meanings/);
  assert.match(student, /Exercise 1F: Using the Words/);
  assert.match(student, /va_cautious_adj/);
  const grades = await import(new URL("vocab-academy/views/grades.js", LAB));
  const page = toHtml(
    (await grades.render({ band: "6-8" }, { I, progress: model.blankProgress() })).html,
  );
  for (const g of contract.SHIPPED_GRADES) assert.match(page, new RegExp(`/grade/${g}"`));
  assert.ok(!/\/grade\/(9|10|11|12)"/.test(page), "no 9-12 card opens");
  assert.match(page, /Grades 9 to 12 are coming later/);
  const word = await import(new URL("vocab-academy/views/word.js", LAB));
  const out = await word.render(
    { band: "6-8" },
    { ...va(false), params: { wordId: "va.cautious.adj" } },
  );
  const wordHtml = toHtml(out.html);
  assert.match(wordHtml, /KAW-shus/);
  assert.match(wordHtml, /data-say="cautious"/);
  assert.ok(wordHtml.includes("Careful to avoid danger"), "the definition is on the card");
});

test("word card: the self-check grades a fit/misfit sentence, records meaning evidence, and one answer cannot make a word secure", () => {
  const word = { id: "va.cautious.adj", misuse: { s: "x" } };
  assert.deepEqual(wordCheck("fit", "yes"), { ok: true, said: "yes", fits: true });
  assert.equal(wordCheck("fit", "no").ok, false);
  assert.equal(wordCheck("misfit", "no").ok, true);
  assert.equal(wordCheck("misfit", "yes").ok, false);
  assert.ok(["fit", "misfit"].includes(wordFirst(word)));
  assert.equal(wordFirst(word), wordFirst(word), "stable per word");
  assert.equal(wordFirst({ id: "va.x.n" }), "fit", "no misuse sentence → always the fitting one");
  const p = fresh();
  model.markSeen(p, W, { now: at(0) });
  model.recordResult(p, {
    wordId: W,
    dim: "mean",
    ok: true,
    sup: [],
    type: "wordcard",
    now: at(0),
  });
  assert.ok(["learning", "developing"].includes(stateOf(p)));
});
const wordMod = await import(new URL("vocab-academy/views/word.js", LAB));
const wordCheck = wordMod.gradeCheck;
const wordFirst = wordMod.firstVariant;
