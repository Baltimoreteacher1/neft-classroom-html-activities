// Learning Journey core: state transitions, independence rules, import merge, recommendations.
//
//   node --test tools/access-journey-state.test.mjs
//
// Pure engine tests (src/journey/state.js, recommend.js, wida.js) plus the store.importProgressData round trip.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { WIDA_LANGUAGE_EXPECTATIONS } from "../access-practice-lab/src/acc/wida/catalog.js";
import {
  FEATURES,
  MISSION_IDS,
  MISSIONS,
  STEP_IDS,
  UNITS,
} from "../access-practice-lab/src/journey/curriculum.js";
import { recommendNext, reviewCandidates } from "../access-practice-lab/src/journey/recommend.js";
import {
  assign,
  bandState,
  completeStep,
  emptyState,
  getStep,
  KEY,
  loadJourney,
  mergeJourney,
  missionProgress,
  missionStatus,
  nextCursorAfter,
  noteHelp,
  parseState,
  revisitStep,
  saveJourney,
  setCursor,
  setSupport,
  stepStatus,
  updateStepData,
  validJourney,
} from "../access-practice-lab/src/journey/state.js";
import { WIDA_LIMITS, widaFor } from "../access-practice-lab/src/journey/wida.js";
import {
  importProgressData,
  PREFIX,
  progressKey,
  saveRecord,
} from "../access-practice-lab/src/store.js";

const dom = new JSDOM("<p></p>", { url: "https://lab.test/" });
for (const key of ["window", "document", "localStorage"]) globalThis[key] = dom.window[key];

const B = "6-8";
const D0 = Date.parse("2026-11-01T12:00:00Z");
const at = (days = 0) => new Date(D0 + days * 864e5).toISOString();
const done = (s, mission, steps, { independent = false, day = 0 } = {}) =>
  steps.reduce((x, step) => completeStep(x, B, mission, step, { independent, now: at(day) }), s);
const finishMission = (s, mission, { showIndependent = false, day = 0 } = {}) =>
  completeStep(done(s, mission, STEP_IDS.slice(0, 5), { day }), B, mission, "show", {
    independent: showIndependent,
    now: at(day),
  });
const isPair = (t) =>
  Array.isArray(t) && t.length === 2 && t.every((x) => typeof x === "string" && x.trim());

// ── state transitions ─────────────────────────────────────────────────────────
test("a new journey is empty, with defaults filled per band", () => {
  const s = emptyState();
  assert.equal(missionStatus(s, B, "m01"), "not-started");
  assert.deepEqual(bandState(s, B), {
    support: "A",
    cursor: { mission: "m01", step: "discover" },
    missions: {},
    assigned: null,
  });
  assert.equal(stepStatus(s, B, "m01", "discover"), "new");
  assert.deepEqual(missionProgress(s, B, "m01"), { done: 0, total: 6, revisited: false });
});

test("updates return new states and never mutate their input", () => {
  const s0 = emptyState();
  const frozen = JSON.stringify(s0);
  const s1 = updateStepData(s0, B, "m08", "discover", "scene", { examined: ["a"] }, at());
  assert.equal(JSON.stringify(s0), frozen);
  assert.equal(stepStatus(s1, B, "m08", "discover"), "started");
  const s2 = updateStepData(s1, B, "m08", "discover", "scene", { sent: true }, at());
  assert.deepEqual(getStep(s2, B, "m08", "discover").data.scene, { examined: ["a"], sent: true });
  assert.deepEqual(getStep(s1, B, "m08", "discover").data.scene, { examined: ["a"] });
  assert.equal(bandState(s2, "3-5").missions.m08, undefined, "the other band is untouched");
});

test("a step finished with no help opened is independent", () => {
  const s = completeStep(emptyState(), B, "m08", "build", {
    independent: true,
    summary: { ok: 2 },
    now: at(),
  });
  assert.equal(stepStatus(s, B, "m08", "build"), "done-independent");
  assert.deepEqual(getStep(s, B, "m08", "build").data.result, { ok: 2 });
  assert.equal(getStep(s, B, "m08", "build").attempts, 1);
});

test("help opened before completion makes the step supported even if the shell says independent", () => {
  let s = noteHelp(emptyState(), B, "m08", "build", "frames", at());
  assert.equal(stepStatus(s, B, "m08", "build"), "started");
  s = completeStep(s, B, "m08", "build", { independent: true, now: at() });
  assert.equal(stepStatus(s, B, "m08", "build"), "done-supported");
  assert.deepEqual(getStep(s, B, "m08", "build").help, ["frames"]);
});

test("completing without claiming independence is supported", () => {
  const s = completeStep(emptyState(), B, "m08", "build", { now: at() });
  assert.equal(stepStatus(s, B, "m08", "build"), "done-supported");
});

test("help noted later never downgrades a finished independent step; it counts as a revisit", () => {
  let s = completeStep(emptyState(), B, "m08", "show", { independent: true, now: at() });
  s = noteHelp(s, B, "m08", "show", "hint", at(1));
  const step = getStep(s, B, "m08", "show");
  assert.equal(stepStatus(s, B, "m08", "show"), "done-independent");
  assert.deepEqual(step.help, []);
  assert.equal(step.revisits, 1);
  s = completeStep(s, B, "m08", "show", { independent: false, now: at(2) });
  assert.equal(
    stepStatus(s, B, "m08", "show"),
    "done-independent",
    "a later supported attempt keeps the better stage",
  );
  assert.equal(getStep(s, B, "m08", "show").attempts, 2);
});

test("a supported step stays supported on a new attempt, and help is kept", () => {
  let s = noteHelp(emptyState(), B, "m08", "build", "model", at());
  s = completeStep(s, B, "m08", "build", { independent: true, now: at() });
  s = completeStep(s, B, "m08", "build", { independent: true, now: at(1) });
  assert.equal(stepStatus(s, B, "m08", "build"), "done-supported");
  assert.equal(getStep(s, B, "m08", "build").attempts, 2);
});

test("revisitStep counts revisits on a finished step and ignores steps never finished", () => {
  let s = completeStep(emptyState(), B, "m02", "discover", { now: at() });
  s = revisitStep(s, B, "m02", "discover", at(1));
  s = revisitStep(s, B, "m02", "build", at(1));
  assert.equal(getStep(s, B, "m02", "discover").revisits, 1);
  assert.equal(stepStatus(s, B, "m02", "build"), "new");
  assert.equal(missionProgress(s, B, "m02").revisited, true);
});

test("mission status: in progress, completed with support, independently demonstrated", () => {
  let s = done(emptyState(), "m01", ["discover"]);
  assert.equal(missionStatus(s, B, "m01"), "in-progress");
  const supported = finishMission(s, "m01");
  assert.equal(missionStatus(supported, B, "m01"), "completed-with-support");
  const independent = finishMission(s, "m01", { showIndependent: true });
  assert.equal(missionStatus(independent, B, "m01"), "independently-demonstrated");
  assert.deepEqual(missionProgress(independent, B, "m01"), { done: 6, total: 6, revisited: false });
  // an independent show with an unfinished earlier step is not a demonstrated mission
  const skipped = completeStep(emptyState(), B, "m01", "show", { independent: true });
  assert.equal(missionStatus(skipped, B, "m01"), "in-progress");
  // an independent earlier step does not make a supported show independent
  const mixed = finishMission(
    done(emptyState(), "m01", STEP_IDS.slice(0, 5), { independent: true }),
    "m01",
  );
  assert.equal(missionStatus(mixed, B, "m01"), "completed-with-support");
});

test("support, cursor and assignment validate their input and leave progress alone", () => {
  let s = setSupport(emptyState(), B, "C");
  assert.equal(bandState(s, B).support, "C");
  assert.equal(setSupport(s, B, "Z"), s);
  s = setCursor(s, B, "m05", "build");
  assert.deepEqual(bandState(s, B).cursor, { mission: "m05", step: "build" });
  assert.equal(setCursor(s, B, "m99", "build"), s);
  assert.equal(setCursor(s, B, "m05", "dance"), s);
  const progress = done(s, "m05", ["discover"]);
  const assigned = assign(progress, B, { mission: "m08", step: "communicate" });
  assert.deepEqual(bandState(assigned, B).assigned, { mission: "m08", step: "communicate" });
  assert.equal(stepStatus(assigned, B, "m08", "communicate"), "new");
  assert.equal(stepStatus(assigned, B, "m05", "discover"), "done-supported");
  assert.equal(assign(assigned, B, { mission: "m08", step: "nope" }), assigned);
  assert.equal(bandState(assign(assigned, B, null), B).assigned, null);
  const finished = completeStep(assigned, B, "m08", "communicate", { now: at() });
  assert.equal(
    bandState(finished, B).assigned,
    null,
    "finishing the assigned step clears the assignment",
  );
});

test("nextCursorAfter walks steps, then the next open step, then the next mission", () => {
  const s = emptyState();
  assert.deepEqual(nextCursorAfter(s, B, "m01", "discover"), {
    mission: "m01",
    step: "understand",
  });
  assert.deepEqual(nextCursorAfter(s, B, "m01", "build"), { mission: "m01", step: "communicate" });
  assert.deepEqual(
    nextCursorAfter(s, B, "m01", "show"),
    { mission: "m01", step: "discover" },
    "open steps first",
  );
  assert.deepEqual(nextCursorAfter(finishMission(s, "m01"), B, "m01", "show"), {
    mission: "m02",
    step: "discover",
  });
  const all = MISSION_IDS.reduce((x, id) => finishMission(x, id), s);
  assert.deepEqual(nextCursorAfter(all, B, "m12", "show"), { mission: "m12", step: "show" });
  assert.deepEqual(nextCursorAfter(s, B, "m99", "show"), bandState(s, B).cursor);
});

// ── storage and corrupt input ─────────────────────────────────────────────────
test("save then load round-trips through one storage key; load never throws", () => {
  localStorage.clear();
  const s = finishMission(emptyState(), "m03", { showIndependent: true });
  const mem = new Map();
  assert.ok(saveJourney(s, (k, v) => mem.set(k, v)));
  assert.deepEqual([...mem.keys()], [KEY]);
  assert.equal(KEY, "accessPracticeLab:v1:journey");
  assert.deepEqual(
    loadJourney((k) => mem.get(k)),
    s,
  );
  assert.deepEqual(
    loadJourney(() => null),
    emptyState(),
  );
  assert.deepEqual(
    loadJourney(() => "{not json"),
    emptyState(),
  );
  saveJourney(s);
  assert.deepEqual(loadJourney(), s);
});

test("parseState survives corrupt, old and hostile input", () => {
  const junk = [
    undefined,
    null,
    "",
    "null",
    "[]",
    "42",
    '"x"',
    "{",
    {},
    { v: 2, bands: {} },
    { v: 0, bands: {} },
    { v: 1 },
    { v: 1, bands: [] },
    { v: 1, bands: "x" },
    { v: 1, bands: { "6-8": null, "3-5": 7 } },
    { v: 1, bands: { "6-8": { missions: [] } } },
    { v: 1, bands: { "6-8": { missions: { m01: "x" } } } },
    { v: 1, bands: { "6-8": { missions: { m01: { steps: { discover: { status: "wat" } } } } } } },
    {
      v: 1,
      bands: {
        "6-8": {
          missions: {
            m01: {
              steps: { discover: { status: "done", help: 5, attempts: -3, doneAt: "never" } },
            },
          },
        },
      },
    },
    JSON.parse(
      '{"v":1,"bands":{"__proto__":{"x":1},"6-8":{"missions":{"__proto__":{"y":1},"constructor":{}}}}}',
    ),
  ];
  for (const raw of junk) {
    const s = parseState(raw);
    assert.equal(s.v, 1);
    assert.ok(validJourney(s));
    for (const band of ["3-5", "6-8"]) {
      for (const id of MISSION_IDS) assert.ok(missionStatus(s, band, id));
      assert.ok(isPair([bandState(s, band).cursor.mission, "x"]));
    }
  }
  assert.deepEqual(
    parseState({ v: 2, bands: { "6-8": { support: "C" } } }),
    emptyState(),
    "unknown version",
  );
  assert.equal({}.y, undefined, "no prototype pollution");
  const odd = parseState({
    v: 1,
    bands: {
      "6-8": {
        support: "Q",
        cursor: { mission: "zz", step: "discover" },
        assigned: { mission: "m01" },
        missions: {
          m99: { steps: {} },
          m01: {
            steps: {
              discover: { status: "done", stage: "independent", help: ["hint"] },
              bogus: { status: "done" },
            },
          },
        },
      },
    },
  });
  const b = bandState(odd, B);
  assert.equal(b.support, "A");
  assert.deepEqual(b.cursor, { mission: "m01", step: "discover" });
  assert.equal(b.assigned, null);
  assert.equal(b.missions.m99, undefined);
  assert.equal(b.missions.m01.steps.bogus, undefined);
  assert.equal(
    stepStatus(odd, B, "m01", "discover"),
    "done-supported",
    "independent with help on record is supported",
  );
  // writes on garbage states and bad ids do not throw
  assert.doesNotThrow(() => completeStep("garbage", B, "m01", "discover", {}));
  assert.doesNotThrow(() => completeStep(emptyState(), B, "m77", "discover", {}));
  assert.doesNotThrow(() => noteHelp(emptyState(), "9-12", "m01", "discover", "x"));
  assert.doesNotThrow(() => recommendNext("garbage", B, {}));
});

test("validJourney accepts real states and rejects wrong shapes", () => {
  assert.ok(validJourney(emptyState()));
  assert.ok(validJourney(finishMission(emptyState(), "m01")));
  for (const bad of [
    null,
    [],
    "x",
    {},
    { v: 2, bands: {} },
    { v: 1, bands: [] },
    { v: 1, bands: { "6-8": [] } },
    { v: 1, bands: { "6-8": { missions: [] } } },
    { v: 1, bands: { "6-8": { missions: { m01: { steps: { discover: "done" } } } } } },
    { v: 1, bands: { "6-8": { missions: { m01: { steps: { discover: { status: "bad" } } } } } } },
  ])
    assert.equal(validJourney(bad), false, JSON.stringify(bad));
});

// ── merge ─────────────────────────────────────────────────────────────────────
const samples = () => {
  const a = done(emptyState(), "m01", ["discover", "understand"]);
  const b = completeStep(
    done(emptyState(), "m01", ["discover"], { independent: true, day: 1 }),
    B,
    "m02",
    "build",
    { now: at(1) },
  );
  const c = noteHelp(
    updateStepData(emptyState(), B, "m01", "understand", "listen", { n: 1 }, at(2)),
    B,
    "m01",
    "understand",
    "replay",
    at(2),
  );
  const d = completeStep(
    completeStep(emptyState(), B, "m01", "discover", { now: at(3) }),
    B,
    "m01",
    "discover",
    { now: at(4) },
  );
  return [emptyState(), a, b, c, d];
};
const shape = (s) =>
  MISSION_IDS.flatMap((m) => STEP_IDS.map((st) => `${m}.${st}=${stepStatus(s, B, m, st)}`)).join(
    "|",
  );

test("merge: done beats started, independent beats supported, more attempts wins, local wins ties", () => {
  const started = updateStepData(
    emptyState(),
    B,
    "m01",
    "discover",
    "scene",
    { who: "local" },
    at(),
  );
  const finished = completeStep(emptyState(), B, "m01", "discover", { now: at(1) });
  assert.equal(stepStatus(mergeJourney(started, finished), B, "m01", "discover"), "done-supported");
  assert.equal(stepStatus(mergeJourney(finished, started), B, "m01", "discover"), "done-supported");
  const independent = completeStep(emptyState(), B, "m01", "discover", {
    independent: true,
    now: at(1),
  });
  assert.equal(
    stepStatus(mergeJourney(finished, independent), B, "m01", "discover"),
    "done-independent",
  );
  assert.equal(
    stepStatus(mergeJourney(independent, finished), B, "m01", "discover"),
    "done-independent",
  );
  const twice = completeStep(finished, B, "m01", "discover", { now: at(2) });
  assert.equal(getStep(mergeJourney(finished, twice), B, "m01", "discover").attempts, 2);
  const mine = updateStepData(finished, B, "m01", "discover", "scene", { who: "local" }, at(3));
  const theirs = updateStepData(
    finished,
    B,
    "m01",
    "discover",
    "scene",
    { who: "incoming" },
    at(3),
  );
  assert.equal(getStep(mergeJourney(mine, theirs), B, "m01", "discover").data.scene.who, "local");
  assert.equal(
    getStep(mergeJourney(theirs, mine), B, "m01", "discover").data.scene.who,
    "incoming",
  );
});

test("merge: an independent step carries no help; supported work keeps help from both sides", () => {
  const helped = noteHelp(emptyState(), B, "m01", "build", "frames", at());
  const helped2 = noteHelp(emptyState(), B, "m01", "build", "model", at());
  assert.deepEqual(getStep(mergeJourney(helped, helped2), B, "m01", "build").help.sort(), [
    "frames",
    "model",
  ]);
  const independent = completeStep(emptyState(), B, "m01", "build", {
    independent: true,
    now: at(1),
  });
  const merged = mergeJourney(helped, independent);
  assert.equal(stepStatus(merged, B, "m01", "build"), "done-independent");
  assert.deepEqual(getStep(merged, B, "m01", "build").help, []);
});

test("merge: idempotent, commutative on status and stage, never loses a step", () => {
  const all = samples();
  for (const x of all) {
    assert.deepEqual(mergeJourney(x, x), parseState(x), "idempotent");
    assert.deepEqual(mergeJourney(x, emptyState()), parseState(x), "empty is the identity");
    assert.deepEqual(mergeJourney(emptyState(), x), parseState(x));
    for (const y of all) {
      assert.equal(
        shape(mergeJourney(x, y)),
        shape(mergeJourney(y, x)),
        "commutative on status and stage",
      );
      const m = mergeJourney(x, y);
      for (const src of [x, y])
        for (const id of MISSION_IDS)
          for (const st of STEP_IDS) {
            const was = stepStatus(src, B, id, st);
            if (was === "new") continue;
            const now = stepStatus(m, B, id, st);
            assert.notEqual(now, "new", `${id}.${st} lost`);
            const order = ["new", "started", "done-supported", "done-independent"];
            assert.ok(order.indexOf(now) >= order.indexOf(was), `${id}.${st} downgraded`);
          }
      assert.deepEqual(mergeJourney(m, y), m, "re-importing the same backup changes nothing");
    }
  }
  const three = mergeJourney(mergeJourney(all[1], all[2]), all[3]);
  const other = mergeJourney(all[1], mergeJourney(all[2], all[3]));
  assert.equal(shape(three), shape(other), "associative on status and stage");
  assert.ok(validJourney(three));
});

test("merge keeps this device's support, cursor and assignment, and unions both bands", () => {
  const local = assign(setCursor(setSupport(emptyState(), B, "C"), B, "m04", "build"), B, {
    mission: "m04",
    step: "show",
  });
  const incoming = setCursor(
    setSupport(finishMission(emptyState(), "m01"), B, "A"),
    B,
    "m09",
    "show",
  );
  const m = mergeJourney(local, incoming);
  const b = bandState(m, B);
  assert.equal(b.support, "C");
  assert.deepEqual(b.cursor, { mission: "m04", step: "build" });
  assert.deepEqual(b.assigned, { mission: "m04", step: "show" });
  assert.equal(missionStatus(m, B, "m01"), "completed-with-support");
  const other = done(emptyState(), "m02", ["discover"]);
  const both = mergeJourney(
    completeStep(emptyState(), "3-5", "m01", "discover", { now: at() }),
    completeStep(other, B, "m03", "discover", { now: at() }),
  );
  assert.equal(stepStatus(both, "3-5", "m01", "discover"), "done-supported");
  assert.equal(stepStatus(both, B, "m03", "discover"), "done-supported");
});

// ── store.importProgressData ──────────────────────────────────────────────────
const JKEY = `${PREFIX}:journey`;
const actKey = progressKey("6-8", "Writing", "A");

test("import: a backup with no journey key leaves existing progress and the journey untouched", () => {
  localStorage.clear();
  saveRecord("6-8", "Writing", "A", { notes: { x: "Keep me" }, complete: [] });
  saveJourney(finishMission(emptyState(), "m01"));
  localStorage.setItem(`${PREFIX}:prefs`, '{"band":"3-5"}');
  const before = localStorage.getItem(JKEY);
  const written = importProgressData({ [`${PREFIX}:prefs`]: '{"band":"6-8"}' });
  assert.equal(written, 0);
  assert.equal(localStorage.getItem(JKEY), before);
  assert.equal(JSON.parse(localStorage.getItem(actKey)).notes.x, "Keep me");
});

test("import: a journey key restores on a fresh device and merges into an existing journey", () => {
  localStorage.clear();
  const backup = finishMission(emptyState(), "m01", { showIndependent: true });
  assert.equal(importProgressData({ [JKEY]: JSON.stringify(backup) }), 1);
  assert.deepEqual(loadJourney(), backup);

  localStorage.clear();
  saveJourney(done(emptyState(), "m02", ["discover", "understand"]));
  assert.equal(importProgressData({ [JKEY]: JSON.stringify(backup) }), 1);
  const merged = loadJourney();
  assert.equal(missionStatus(merged, B, "m01"), "independently-demonstrated");
  assert.equal(stepStatus(merged, B, "m02", "understand"), "done-supported");
  assert.equal(
    importProgressData({ [JKEY]: JSON.stringify(backup) }),
    0,
    "importing twice changes nothing",
  );
});

test("import: an invalid journey rejects before anything is written", () => {
  localStorage.clear();
  saveRecord("6-8", "Writing", "A", { notes: { x: "Keep me" } });
  const snapshot = JSON.stringify(Object.entries(localStorage).sort());
  const incoming = { [`${PREFIX}:studentName`]: "Ada", [JKEY]: '{"v":1,"bands":[]}' };
  for (const bad of [
    '{"v":1,"bands":[]}',
    "null",
    "[]",
    "not json",
    '{"v":2,"bands":{}}',
    '{"v":1,"bands":{"6-8":{"missions":{"m01":{"steps":{"discover":"x"}}}}}}',
  ])
    assert.throws(
      () => importProgressData({ [`${PREFIX}:studentName`]: "Ada", [JKEY]: bad }),
      /invalid practice record/,
      bad,
    );
  assert.throws(() => importProgressData(incoming));
  assert.equal(
    JSON.stringify(Object.entries(localStorage).sort()),
    snapshot,
    "nothing was written",
  );
});

// ── recommendations ───────────────────────────────────────────────────────────
const entry = (task, { stage = "supported", moves, t = at(), kind = "first" } = {}) => ({
  id: `${task}-${t}`,
  t,
  src: "mission",
  task,
  band: B,
  stage,
  kind,
  supports: {},
  m: { words: 20, moves },
});
const ledgerOf = (...entries) => ({ v: 1, entries });
const FORWARD = new Set([
  "continue",
  "next-mission",
  "unit-complete",
  "journey-complete",
  "start",
  "assigned",
]);

/** The result names a real step with a bilingual reason, and the learner always has a way forward. */
function assertWellFormed(r, label = "") {
  assert.ok(MISSION_IDS.includes(r.mission), `${label} mission ${r.mission}`);
  assert.ok(STEP_IDS.includes(r.step), `${label} step ${r.step}`);
  assert.ok(isPair(r.reason), `${label} reason is a bilingual pair`);
  assert.ok(Array.isArray(r.alternatives));
  for (const a of r.alternatives) {
    assert.ok(
      MISSION_IDS.includes(a.mission) && STEP_IDS.includes(a.step),
      `${label} alternative target`,
    );
    assert.ok(isPair(a.label) && isPair(a.reason), `${label} alternative text`);
  }
  assert.ok(
    FORWARD.has(r.kind) || r.kind === "continue" || r.alternatives.length > 0,
    `${label} ${r.kind} has a forward action`,
  );
}

test("recommend: a new student starts the journey", () => {
  const r = recommendNext(emptyState(), B, { now: at() });
  assert.equal(r.kind, "start");
  assert.deepEqual([r.mission, r.step], ["m01", "discover"]);
  assertWellFormed(r);
  assert.equal(
    recommendNext(setSupport(emptyState(), B, "B"), B).kind,
    "start",
    "support choice alone is not progress",
  );
});

test("recommend: a started step is resumed, with the cursor's mission first", () => {
  let s = updateStepData(emptyState(), B, "m08", "build", "construct", { n: 1 }, at());
  s = updateStepData(s, B, "m02", "understand", "listen", { n: 1 }, at());
  s = setCursor(s, B, "m08", "build");
  const r = recommendNext(s, B, { now: at() });
  assert.equal(r.kind, "continue");
  assert.deepEqual([r.mission, r.step], ["m08", "build"]);
  assert.match(r.reason[0], /started this step/i);
  assertWellFormed(r);
  const elsewhere = recommendNext(setCursor(s, B, "m05", "discover"), B, { now: at() });
  assert.deepEqual(
    [elsewhere.mission, elsewhere.step],
    ["m02", "understand"],
    "other missions in order when the cursor mission has none",
  );
});

test("recommend: a teacher assignment outranks everything and keeps a forward alternative", () => {
  const s = updateStepData(emptyState(), B, "m01", "build", "construct", {}, at());
  const viaLink = recommendNext(s, B, {
    assigned: { mission: "m08", step: "communicate" },
    now: at(),
  });
  assert.equal(viaLink.kind, "assigned");
  assert.deepEqual([viaLink.mission, viaLink.step], ["m08", "communicate"]);
  assert.ok(
    viaLink.alternatives.some((a) => a.mission === "m01" && a.step === "build"),
    "the started step stays reachable",
  );
  assertWellFormed(viaLink);
  const stored = recommendNext(assign(s, B, { mission: "m03", step: "show" }), B, { now: at() });
  assert.equal(stored.kind, "assigned");
  assert.equal(
    recommendNext(s, B, { assigned: { mission: "zz", step: "show" }, now: at() }).kind,
    "continue",
    "a garbage link is ignored",
  );
});

test("recommend: struggling after a supported attempt offers support AND keeps the forward action", () => {
  let s = done(emptyState(), "m08", STEP_IDS.slice(0, 4), { day: 0 });
  s = setCursor(s, B, "m08", "communicate");
  const ledger = ledgerOf(
    entry("m08.communicate", {
      moves: { phenomenon: 1, cause: 0, chain: 0, support: 0 },
      t: at(0.5),
    }),
  );
  const r = recommendNext(s, B, { ledger, now: at(0.6) });
  assert.equal(r.kind, "support");
  assert.equal(r.mission, "m08");
  assert.equal(r.step, "build", "the earlier relevant step");
  assert.deepEqual(r.missing, ["cause", "chain", "support"]);
  const forward = r.alternatives.find((a) => a.mission === "m08" && a.step === "improve");
  assert.ok(forward, "the forward step is always an alternative");
  assert.ok(
    r.alternatives.some((a) => a.mission === MISSIONS.m08.reviews[0]),
    "a spiral-edge review is offered too",
  );
  assertWellFormed(r);
  // not struggling: all moves present, or independent, or a different mission's entry
  for (const quiet of [
    ledgerOf(entry("m08.communicate", { moves: { cause: 1, chain: 1 }, t: at(0.5) })),
    ledgerOf(entry("m08.communicate", { stage: "independent", moves: { cause: 0 }, t: at(0.5) })),
    ledgerOf(entry("m07.communicate", { moves: { cause: 0 }, t: at(0.5) })),
    ledgerOf(),
  ])
    assert.notEqual(recommendNext(s, B, { ledger: quiet, now: at(0.6) }).kind, "support");
  // moving on (any other step of the mission touched after the attempt) clears it: never a dead end
  const moved = updateStepData(s, B, "m08", "improve", "mirror", { n: 1 }, at(0.7));
  const after = recommendNext(moved, B, { ledger, now: at(0.8) });
  assert.notEqual(after.kind, "support");
  assertWellFormed(after);
});

test("recommend: review of a feature used only with support is due after a day, one at a time, then rests a week", () => {
  // m01 finished with help on day 0; the learner is on m02, whose spiral edge is m01.
  let s = finishMission(emptyState(), "m01", { day: 0 });
  s = setCursor(s, B, "m02", "discover");
  assert.equal(reviewCandidates(s, B, { now: at(0.2) }).length, 0, "settles for a day first");
  const due = reviewCandidates(s, B, { now: at(2) });
  assert.equal(due.length, 1);
  assert.equal(due[0].mission, "m01");
  assert.equal(due[0].step, "show");
  assert.ok(FEATURES[due[0].feature] && MISSIONS.m02.features.includes(due[0].feature));
  assert.ok(isPair(due[0].reason));
  const r = recommendNext(s, B, { now: at(2) });
  assert.equal(r.kind, "review");
  assert.deepEqual([r.mission, r.step], ["m01", "show"]);
  assert.ok(
    r.alternatives.some((a) => a.mission === "m02" && a.step === "discover"),
    "forward action kept",
  );
  assertWellFormed(r);
  // doing the review (an independent show) removes it
  const reviewed = completeStep(s, B, "m01", "show", { independent: true, now: at(2) });
  assert.equal(reviewCandidates(reviewed, B, { now: at(3) }).length, 0);
  assert.equal(recommendNext(reviewed, B, { now: at(3) }).kind, "next-mission");
  // going back over supported work (a revisit) rests it for a week, then it is due again
  const revisited = revisitStep(s, B, "m01", "communicate", at(2));
  assert.equal(reviewCandidates(revisited, B, { now: at(5) }).length, 0);
  assert.equal(reviewCandidates(revisited, B, { now: at(10) }).length, 1);
  // work shown independently is never a review candidate
  const demonstrated = setCursor(
    finishMission(emptyState(), "m01", { showIndependent: true }),
    B,
    "m02",
    "discover",
  );
  assert.equal(reviewCandidates(demonstrated, B, { now: at(9) }).length, 0);
  // only one review is ever the recommendation even when several are due
  let many = finishMission(finishMission(emptyState(), "m01"), "m02");
  many = setCursor(many, B, "m03", "discover");
  assert.ok(reviewCandidates(many, B, { now: at(3) }).length >= 2);
  assert.equal(
    recommendNext(many, B, { now: at(3) }).alternatives.filter((a) => a.mission !== "m03").length,
    0,
  );
});

test("recommend: next incomplete step, next mission, unit complete, journey complete", () => {
  const s = done(emptyState(), "m01", ["discover", "understand"], { independent: true });
  const next = recommendNext(setCursor(s, B, "m01", "understand"), B, { now: at() });
  assert.equal(next.kind, "continue");
  assert.deepEqual([next.mission, next.step], ["m01", "build"]);
  assertWellFormed(next);

  const mission = finishMission(emptyState(), "m01", { showIndependent: true });
  const nm = recommendNext(setCursor(mission, B, "m01", "show"), B, { now: at() });
  assert.equal(nm.kind, "next-mission");
  assert.deepEqual([nm.mission, nm.step], ["m02", "discover"]);
  assertWellFormed(nm);
  const advanced = recommendNext(setCursor(mission, B, "m02", "discover"), B, { now: at() });
  assert.equal(
    advanced.kind,
    "next-mission",
    "same answer whether or not the cursor already moved on",
  );

  const unit1 = UNITS[0].missions.reduce(
    (x, id) => finishMission(x, id, { showIndependent: true }),
    emptyState(),
  );
  const uc = recommendNext(setCursor(unit1, B, "m03", "show"), B, { now: at() });
  assert.equal(uc.kind, "unit-complete");
  assert.deepEqual([uc.mission, uc.step], ["m04", "discover"]);
  assert.match(uc.reason[0], /Unit 1/);
  assertWellFormed(uc);

  const everything = MISSION_IDS.reduce(
    (x, id) => finishMission(x, id, { showIndependent: true }),
    emptyState(),
  );
  const jc = recommendNext(setCursor(everything, B, "m12", "show"), B, { now: at() });
  assert.equal(jc.kind, "journey-complete");
  assertWellFormed(jc);
  const partly = MISSION_IDS.reduce(
    (x, id) => finishMission(x, id, { showIndependent: id !== "m05" }),
    emptyState(),
  );
  const retry = recommendNext(partly, B, { now: at() });
  assert.equal(retry.kind, "journey-complete");
  assert.deepEqual(
    [retry.mission, retry.step],
    ["m05", "show"],
    "offers the mission not yet shown independently",
  );
});

test("recommend: every kind appears, and every result is well formed on a sweep of states", () => {
  const kinds = new Set();
  const states = [emptyState()];
  for (const id of MISSION_IDS) {
    states.push(updateStepData(emptyState(), B, id, "discover", "scene", {}, at()));
    states.push(finishMission(emptyState(), id));
    states.push(finishMission(emptyState(), id, { showIndependent: true }));
  }
  states.push(...samples());
  states.push(
    MISSION_IDS.reduce((x, id) => finishMission(x, id, { showIndependent: true }), emptyState()),
  );
  states.push(
    UNITS[0].missions.reduce(
      (x, id) => finishMission(x, id, { showIndependent: true }),
      emptyState(),
    ),
  );
  for (const s of states)
    for (const cursor of MISSION_IDS)
      for (const days of [0, 3, 30]) {
        const r = recommendNext(setCursor(s, B, cursor, "discover"), B, { now: at(days) });
        kinds.add(r.kind);
        assertWellFormed(r, `${cursor}+${days}d`);
      }
  for (const k of [
    "start",
    "continue",
    "next-mission",
    "unit-complete",
    "review",
    "journey-complete",
  ])
    assert.ok(kinds.has(k), `kind ${k} reachable`);
  assert.ok(!kinds.has("support") && !kinds.has("assigned"), "those need a ledger / an assignment");
});

// ── WIDA reference ────────────────────────────────────────────────────────────
test("widaFor lists explicit catalog rows for the mission's standard, Key Language Use and grade clusters", () => {
  for (const id of MISSION_IDS)
    for (const band of ["3-5", "6-8"]) {
      const w = widaFor(id, band);
      assert.equal(w.standard, MISSIONS[id].wida[band].standard);
      assert.ok(w.standardLabel, `${id}.${band} standard label`);
      assert.equal(w.keyUse, MISSIONS[id].klu);
      assert.ok(w.expectationRows.length > 0, `${id}.${band} has explicit catalog rows`);
      for (const row of w.expectationRows) {
        assert.ok(
          WIDA_LANGUAGE_EXPECTATIONS.includes(row),
          "rows come from the catalog, none invented",
        );
        assert.equal(row.standard, w.standard);
        assert.equal(row.keyUse, w.keyUse);
      }
      assert.deepEqual(w.dimensions, MISSIONS[id].wida[band].dimensions);
      assert.deepEqual(Object.keys(w.dimensionNotes), w.dimensions);
      assert.ok(
        Object.values(w.dimensionNotes).every((n) => typeof n === "string" && n.length > 20),
      );
      assert.match(w.source, /^https:\/\/wida\.wisc\.edu/);
      assert.ok(isPair(w.note));
    }
  assert.ok(widaFor("m01", "3-5").expectationRows.some((r) => r.gradeCluster === "2-3"));
  assert.ok(widaFor("m01", "3-5").expectationRows.some((r) => r.gradeCluster === "4-5"));
  assert.ok(widaFor("m01", "6-8").expectationRows.every((r) => r.gradeCluster === "6-8"));
  assert.equal(widaFor("m99", B), null);
  assert.equal(widaFor("m01", "9-12"), null);
});

test("WIDA limits are bilingual and say what the lab is not", () => {
  assert.ok(isPair(WIDA_LIMITS));
  assert.match(WIDA_LIMITS[0], /locally developed/i);
  assert.match(WIDA_LIMITS[0], /not official WIDA items/i);
  assert.match(WIDA_LIMITS[0], /do not estimate an ACCESS score/i);
  assert.match(WIDA_LIMITS[0], /Proficiency Level Descriptors/);
  assert.match(WIDA_LIMITS[1], /WIDA/);
});
