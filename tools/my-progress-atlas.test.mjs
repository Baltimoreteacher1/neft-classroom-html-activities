#!/usr/bin/env node
/* ==========================================================================
 * my-progress-atlas.test.mjs — the student Learning Atlas on My Progress.
 *
 * What this guards, in the order a student would be hurt by it:
 *   1. WORDS: every prerequisite edge has a plain-language sentence in both
 *      languages, none is empty, none repeats the teacher's `why`, none uses
 *      deficit language. The graph and data/atlas-student-why.json cannot drift.
 *   2. OWNED IS EARNED: a passing check, then a passing re-check no sooner than
 *      seven days later. Never a grade, never from one sitting.
 *   3. THE STORE: nt-atlas:v1 is versioned, capped, survives hostile storage,
 *      and merges on restore without losing a proof.
 *   4. THE MATCHER: typed answers go through the site's one answer matcher, and
 *      the copy shipped to this page is not stale.
 *   5. THE PAGE: map and list say the same thing, the map is keyboard
 *      operable, nothing is written but nt-atlas:v1, and both My Progress
 *      routes load every module in order.
 * ========================================================================== */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { expected as expectedMatcher, TARGET as MATCH_PATH } from "./sync-progress-atlas-match.mjs";

const ROOT = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, ROOT), "utf8");
const readJson = (p) => JSON.parse(read(p));
let checks = 0;
const ok = (cond, msg) => {
  checks += 1;
  assert.ok(cond, msg);
};
const eq = (a, b, msg) => {
  checks += 1;
  assert.deepEqual(a, b, msg);
};

const DAY = 86400000;
const prereq = readJson("data/standards-prerequisites.json");
const words = readJson("data/atlas-student-why.json");
const retrieval = readJson("data/retrieval-bank.json");

/* ─── 1. the words ───────────────────────────────────────────────────────── */
const DEFICIT = [
  /\bweak(ness|nesses|er)?\b/i,
  /\bgaps?\b/i,
  /\bfail(ed|ing|s|ure)?\b/i,
  /\bbehind\b/i,
  /\bstruggl\w*/i,
  /\bpoor(ly)?\b/i,
  /\bdeficien\w*/i,
  /\bwrong\b/i,
  /\bcan't\b|\bcannot\b/i,
  /\bnot mastered\b/i,
  /\bbelow\b/i,
  /\bdébil(es)?\b|\bdeficien\w*|\bfracas\w*|\batrasad\w*|\bmal\b|\bincorrect\w*/i,
];
const nodeCodes = [...new Set(prereq.edges.flatMap((e) => [e.from, e.to]))];
const key = (e) => `${e.from}>${e.to}`;
{
  const byKey = new Map(words.edges.map((e) => [key(e), e]));
  ok(byKey.size === words.edges.length, "no edge is written twice in atlas-student-why.json");
  eq(
    prereq.edges.map(key).sort(),
    [...byKey.keys()].sort(),
    "atlas-student-why.json has exactly one entry per edge of standards-prerequisites.json",
  );
  for (const e of prereq.edges) {
    const w = byKey.get(key(e));
    for (const lang of ["en", "es"]) {
      ok(
        typeof w[lang] === "string" && w[lang].trim().length >= 25,
        `${key(e)} has a real ${lang} sentence`,
      );
      ok(w[lang].split(/\s+/).length <= 28, `${key(e)} ${lang} stays at a Grade 6 sentence length`);
      for (const bad of DEFICIT)
        ok(!bad.test(w[lang]), `${key(e)} ${lang} must not use deficit language (${bad})`);
    }
    ok(w.en !== w.es, `${key(e)} Spanish is not the English copied over`);
    ok(
      w.en.trim() !== e.why.trim(),
      `${key(e)} is written for a student, not copied from the teacher's why`,
    );
    ok(
      /[.?!"]$/.test(w.en.trim()) && /[.?!"]$/.test(w.es.trim()),
      `${key(e)} is a finished sentence in both languages`,
    );
  }
  eq(
    Object.keys(words.nodes).sort(),
    [...nodeCodes].sort(),
    "every graph node has a student name, and no extra names exist",
  );
  const seenNames = new Set();
  for (const c of nodeCodes) {
    const n = words.nodes[c];
    ok(n.en.trim() && n.es.trim(), `${c} is named in both languages`);
    ok(!seenNames.has(n.en), `${c} has a unique English name`);
    seenNames.add(n.en);
    for (const bad of DEFICIT)
      ok(!bad.test(n.en) && !bad.test(n.es), `${c} name has no deficit language`);
  }
}

/* ─── load the modules the page loads, in the order it loads them ────────── */
globalThis.window = globalThis;
const asset = (f) => new URL(`../assets/my-progress/${f}`, import.meta.url).href;
await import(asset("progress-atlas-match.js"));
await import(asset("progress-atlas-store.js"));
await import(asset("progress-atlas-model.js"));
const ST = globalThis.NTAtlasStore;
const M = globalThis.NTAtlasModel;
const AM = globalThis.NTAnswerMatch;
const graph = M.buildGraph(prereq, words, retrieval.sequence);

/* ─── 2. graph order ─────────────────────────────────────────────────────── */
{
  eq(
    graph.nodes.length,
    nodeCodes.length,
    "every standard in the prerequisite graph becomes a node",
  );
  eq(
    graph.units.map((u) => u.key),
    ["PRE", "U3", "U4", "U6", "U7", "U8", "U9", "U5", "U2"],
    "columns run in the order the class learns the units (district order, not 1..10)",
  );
  const col = (c) => graph.byCode[c].col;
  const at = (c) => graph.byCode[c].at;
  ok(
    col("6.AT.1") < col("6.AT.4") && col("6.AT.4") < col("6.AT.5"),
    "ratios, then percents, then exponents",
  );
  ok(
    at("6.AT.6") < at("6.AT.6a") && at("6.AT.6") < at("6.AT.6b"),
    "6.AT.6 (no lesson of its own) sits before its parts",
  );
  ok(
    at("6.NOS.6") < at("6.NOS.6b") && col("6.NOS.6b") === col("6.NOS.6"),
    "an unscheduled sub-skill lands beside its parent",
  );
  ok(at("6.DS.6") < at("6.DS.6c"), "describing a data set comes before its steps");
  for (const e of graph.edges) {
    ok(graph.byCode[e.from] && graph.byCode[e.to], `${key(e)} joins two real nodes`);
    ok(e.en && e.es, `${key(e)} carries its student words into the graph`);
  }
  const rows = {};
  for (const n of graph.nodes) {
    const k = `${n.col}:${n.row}`;
    ok(!rows[k], `${n.code} has its own cell on the map`);
    rows[k] = 1;
  }
}

/* ─── 3. states: the same bands and recency My Progress already uses ────── */
const rowOf = (attempts, correct, lastTs) => ({
  code: "x",
  attempts,
  correct,
  rate: correct / attempts,
  lastTs,
  band: correct / attempts >= 0.8 ? "solid" : correct / attempts >= 0.5 ? "growing" : "revisit",
});
{
  const now = Date.now();
  const st = (row, rec, bank = 8) => M.nodeStatus(row, rec, bank, now);
  eq(st(null, undefined).state, "notyet", "no evidence is not-yet, never a deficit");
  eq(st(rowOf(5, 5, now - DAY)).state, "solid", "80%+ is solid (progress-stores band)");
  eq(st(rowOf(5, 3, now - DAY)).state, "growing", "50-79% is growing");
  eq(st(rowOf(5, 1, now - DAY)).state, "revisit", "under 50% is worth another look");
  ok(!st(rowOf(5, 5, now - DAY)).due, "fresh work is not due");
  ok(st(rowOf(5, 5, now - 20 * DAY)).due, "a skill untouched for 14+ days is time to revisit");
  eq(st(rowOf(5, 5, now - 20 * DAY)).dueReason, "time", "and says it is recency, not a verdict");
  ok(st(rowOf(5, 1, now - DAY)).due, "a revisit-band skill is time to revisit");
  eq(
    st(null, { p: now - DAY, o: 0, l: now - DAY, c: [], seen: [] }).state,
    "growing",
    "one passed proof with no other evidence reads as growing",
  );
  eq(
    st(rowOf(5, 1, now - DAY), { p: 1, o: now - DAY, l: now, c: [], seen: [] }).state,
    "owned",
    "owned wins over the band",
  );
  eq(
    st(null, undefined, 0).phase,
    "none",
    "a standard with fewer than three bank questions offers no check",
  );
  eq(st(null, undefined).phase, "challenge", "a fresh standard can be challenged");
  eq(
    st(null, { p: now - 2 * DAY, o: 0, l: now, c: [], seen: [] }).phase,
    "wait",
    "two days after passing the re-check is not open yet",
  );
  eq(
    st(null, { p: now - 8 * DAY, o: 0, l: now, c: [], seen: [] }).phase,
    "recheck",
    "eight days after passing the re-check is open",
  );
  ok(!("accuracy" in st(rowOf(5, 5, now))), "a status exposes no accuracy figure");
}

/* ─── 4. owned is earned: pass, then re-check at least 7 days later ─────── */
{
  const t0 = 1_800_000_000_000;
  let s = ST.emptyStore();
  let r = M.applyCheck(s, "6.AT.1", "c", 2, ["a", "b", "c"], t0);
  eq(r.outcome, "notyet", "2 of 3 is not a pass");
  ok(!r.store.nodes["6.AT.1"].p, "a miss records no proof");
  r = M.applyCheck(r.store, "6.AT.1", "c", 3, ["d", "e", "f"], t0 + 1000);
  eq(r.outcome, "passed", "3 of 3 passes the first check");
  ok(r.store.nodes["6.AT.1"].p && !r.store.nodes["6.AT.1"].o, "passing once never owns a skill");
  const passedAt = r.store.nodes["6.AT.1"].p;
  const early = M.applyCheck(
    r.store,
    "6.AT.1",
    "r",
    3,
    ["g", "h", "i"],
    passedAt + 6 * DAY + DAY - 1,
  );
  eq(early.outcome, "notyet", "a perfect re-check one millisecond short of 7 days does not own it");
  ok(!early.store.nodes["6.AT.1"].o, "and records no ownership");
  const late = M.applyCheck(r.store, "6.AT.1", "r", 3, ["g", "h", "i"], passedAt + 7 * DAY);
  eq(late.outcome, "owned", "a passing re-check 7 days later owns it");
  eq(late.store.nodes["6.AT.1"].o, passedAt + 7 * DAY, "with the date it happened");
  const missed = M.applyCheck(r.store, "6.AT.1", "r", 2, ["g", "h", "i"], passedAt + 9 * DAY);
  eq(missed.outcome, "notyet", "a missed re-check does not own it");
  eq(
    missed.store.nodes["6.AT.1"].p,
    passedAt,
    "and does NOT take back the first proof (no punishment)",
  );
  const orphan = M.applyCheck(ST.emptyStore(), "6.AT.1", "r", 3, ["x", "y", "z"], t0 + 30 * DAY);
  eq(orphan.outcome, "notyet", "a re-check with no earlier proof can never own a skill");
  const again = M.applyCheck(r.store, "6.AT.1", "c", 3, ["j", "k", "l"], passedAt + 20 * DAY);
  eq(
    again.store.nodes["6.AT.1"].p,
    passedAt,
    "a second first-check cannot move the first-proof date",
  );
  eq(
    M.applyCheck(s, "../bad", "c", 3, [], t0).outcome,
    "notyet",
    "a hostile standard code is refused",
  );
  for (let i = 0; i < 12; i++)
    s = M.applyCheck(s, "6.AT.2", "c", 0, [`i${i}a`, `i${i}b`, `i${i}c`], t0 + i).store;
  ok(
    s.nodes["6.AT.2"].c.length <= 6 && s.nodes["6.AT.2"].seen.length <= 16,
    "check history and seen-questions are bounded",
  );
}

/* ─── 5. the store ───────────────────────────────────────────────────────── */
{
  const mem = (init = {}) => {
    const d = { ...init };
    return {
      getItem: (k) => (k in d ? d[k] : null),
      setItem: (k, v) => void (d[k] = String(v)),
      d,
    };
  };
  eq(ST.readStore(mem()), ST.emptyStore(), "an empty device reads as an empty store");
  eq(
    ST.readStore(mem({ "nt-atlas:v1": "{not json" })),
    ST.emptyStore(),
    "corrupt JSON reads as empty",
  );
  eq(
    ST.readStore(mem({ "nt-atlas:v1": JSON.stringify({ v: 2, nodes: { "6.AT.1": { p: 5 } } }) })),
    ST.emptyStore(),
    "an unknown version reads as empty, never half-trusted",
  );
  const hostile = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  };
  eq(ST.readStore(hostile), ST.emptyStore(), "a throwing getItem reads as empty");
  eq(
    ST.writeStore(hostile, ST.emptyStore()),
    false,
    "a throwing setItem returns false instead of throwing",
  );
  const dirty = ST.sanitize({
    v: 1,
    nodes: {
      "6.AT.1": {
        p: "x",
        o: -4,
        l: 1e30,
        c: [{ at: 5, k: "z", s: 9 }, null, { at: 7, k: "c", s: 99 }],
        seen: ["ok1", "BAD KEY!!", 5],
      },
      "<script>": { p: 1 },
    },
    snaps: [{ at: 1, r: { "6.AT.1": 9, "6.AT.2": 2 } }, "no"],
  });
  eq(Object.keys(dirty.nodes), ["6.AT.1"], "a hostile standard code is dropped on read");
  eq(dirty.nodes["6.AT.1"].p, 0, "junk values become 0");
  eq(
    dirty.nodes["6.AT.1"].c.map((c) => c.s),
    [3],
    "scores are clamped and bad rows dropped",
  );
  eq(dirty.nodes["6.AT.1"].seen, ["ok1"], "seen ids are validated");
  eq(dirty.snaps[0].r, { "6.AT.2": 2 }, "snapshot ranks outside 1..4 are dropped");
  // size cap: 64 nodes with full history and a full week of snapshots
  const big = ST.emptyStore();
  for (let n = 0; n < 64; n++) {
    big.nodes[`6.XX.${n}`] = {
      p: 1,
      o: 2,
      l: 3,
      c: Array.from({ length: 6 }, (_, i) => ({ at: 1000 + i, k: "c", s: 3, n: 3 })),
      seen: Array.from({ length: 16 }, (_, i) => `a${i}b${n}`),
    };
  }
  for (let i = 0; i < 8; i++)
    big.snaps.push({
      at: 1000 + i,
      r: Object.fromEntries(Array.from({ length: 64 }, (_, n) => [`6.XX.${n}`, 4])),
    });
  const store = mem();
  ok(ST.writeStore(store, big), "a large store still writes");
  ok(
    store.d["nt-atlas:v1"].length <= ST.STORE_MAX_CHARS,
    `the written store stays under ${ST.STORE_MAX_CHARS} characters`,
  );
  ok(JSON.parse(store.d["nt-atlas:v1"]).v === 1, "and is still a valid v1 store after trimming");
  // merge keeps every proof
  const a = {
    v: 1,
    nodes: {
      "6.AT.1": { p: 100, o: 0, l: 100, c: [{ at: 100, k: "c", s: 3, n: 3 }], seen: ["a"] },
    },
    snaps: [],
  };
  const b = {
    v: 1,
    nodes: {
      "6.AT.1": { p: 50, o: 900, l: 900, c: [{ at: 900, k: "r", s: 3, n: 3 }], seen: ["b"] },
      "6.AT.2": { p: 7, o: 0, l: 7, c: [], seen: [] },
    },
    snaps: [],
  };
  const m = ST.mergeStores(a, b);
  eq(
    [m.nodes["6.AT.1"].p, m.nodes["6.AT.1"].o],
    [50, 900],
    "restore keeps the earliest proof and the ownership from either side",
  );
  eq(m.nodes["6.AT.1"].c.length, 2, "and both devices' check history");
  ok(m.nodes["6.AT.2"], "and standards only one side had");
  eq(ST.mergeStores(a, a), ST.sanitize(a), "merging a store with itself changes nothing");
}

/* ─── 6. questions and the matcher ──────────────────────────────────────── */
{
  eq(
    read("assets/my-progress/progress-atlas-match.js"),
    expectedMatcher(),
    "progress-atlas-match.js is current — run node tools/sync-progress-atlas-match.mjs",
  );
  const engine = await import(new URL("../engine/core/answer-match.js", import.meta.url).href);
  for (const [typed, answer] of [
    ["8", "c = 8"],
    ["c = 8", "8 cups"],
    ["1,200", "1200"],
    ["3/4", "0.75"],
    ["12", "13"],
    ["240", "2 × 3 × 7"],
  ]) {
    eq(
      AM.isRight(typed, answer),
      engine.isRight(typed, answer),
      `the page's matcher agrees with engine/core/answer-match.js on ${typed} vs ${answer}`,
    );
  }
  const item = (stem, choices, correctIndex) => ({
    lesson: "1-1",
    stem,
    choices,
    correctIndex,
    explanation: "",
  });
  const typed = item(
    "A box holds 24 pencils. How many pencils are in 6 boxes?",
    ["30 pencils", "144 pencils", "18 pencils"],
    1,
  );
  ok(M.isTyped(typed), "a bare number with a short unit is typed");
  ok(
    M.judge({ ...typed, typed: true }, { text: "144" }),
    "typing the value is right (the matcher ignores the unit)",
  );
  ok(
    M.judge({ ...typed, typed: true }, { text: "144 pencils" }),
    "typing the value with its unit is right too",
  );
  ok(!M.judge({ ...typed, typed: true }, { text: "141" }), "a different number is not");
  ok(!M.judge({ ...typed, typed: true }, { text: "" }), "an empty answer is not");
  ok(
    !M.isTyped(
      item(
        "A box is 8 in by 3 in by 10 in. What is its volume?",
        ["240 cubic inches", "240 square inches", "21 cubic inches"],
        0,
      ),
    ),
    "equal values with different units stay multiple choice",
  );
  ok(
    !M.isTyped(item("Write 3 2/5 as an improper fraction.", ["17/5", "6/5", "5/17"], 0)),
    "a fraction answer stays multiple choice (the form is the point)",
  );
  ok(
    !M.isTyped(item("Which number is greater?", ["12", "9", "7"], 0)),
    "a 'which' stem stays multiple choice",
  );
  ok(
    !M.isTyped(
      item(
        "A ribbon is 950 cm. You cut 40 cm pieces. 950 ÷ 40 = 23 R 30. What does the 30 mean?",
        ["30 cm of ribbon is left over.", "23 pieces", "40 cm"],
        0,
      ),
    ),
    "a 'what does it mean' stem stays multiple choice",
  );
  const mc = item("Which is a counterexample?", ["a", "b", "c", "d"], 2);
  ok(
    M.judge(mc, { index: 2 }) && !M.judge(mc, { index: 1 }),
    "multiple choice is judged by the authored index",
  );
  let typedCount = 0;
  const bankCodes = Object.keys(retrieval.bank);
  for (const code of bankCodes)
    for (const it of retrieval.bank[code]) {
      ok(
        Array.isArray(it.choices) && it.choices.length >= 3 && Number.isInteger(it.correctIndex),
        `${code}: bank item is well formed`,
      );
      if (M.isTyped(it)) typedCount += 1;
    }
  ok(
    typedCount > 50 && typedCount < 250,
    `a sensible share of bank questions are typed (${typedCount})`,
  );
  // every typed item accepts its own authored answer string and rejects its distractors
  for (const code of bankCodes)
    for (const it of retrieval.bank[code])
      if (M.isTyped(it)) {
        const typedItem = { ...it, typed: true };
        ok(
          M.judge(typedItem, { text: it.choices[it.correctIndex] }),
          `${code}: a typed item accepts its authored answer`,
        );
        it.choices.forEach((c, i) => {
          if (i !== it.correctIndex)
            ok(!M.judge(typedItem, { text: c }), `${code}: a typed item rejects distractor "${c}"`);
        });
      }
  // question selection
  const pool = retrieval.bank["6.AT.1"];
  let rec = { seen: [], c: [] };
  const used = [];
  for (let turn = 0; turn < 2; turn++) {
    const pick = M.pickItems(pool, rec);
    eq(pick.length, 3, "a check is exactly three questions");
    eq(new Set(pick.map((p) => p.id)).size, 3, "three different questions");
    used.push(...pick.map((p) => p.id));
    rec = { seen: rec.seen.concat(pick.map((p) => p.id)), c: rec.c.concat([{}]) };
  }
  eq(
    new Set(used).size,
    6,
    "a second check shows questions the first did not (re-check is not the same three)",
  );
  eq(
    M.pickItems(pool, { seen: [], c: [] }).map((p) => p.id),
    M.pickItems(pool, { seen: [], c: [] }).map((p) => p.id),
    "selection is deterministic",
  );
  eq(
    M.pickItems([pool[0]], null).length,
    1,
    "a short bank returns what it has (the UI refuses to open it)",
  );
  const noCheck = graph.nodes
    .filter((n) => (retrieval.bank[n.code] || []).length < M.CHECK_SIZE)
    .map((n) => n.code);
  ok(
    noCheck.length > 0 &&
      noCheck.every(
        (c) =>
          M.nodeStatus(null, undefined, (retrieval.bank[c] || []).length, Date.now()).phase ===
          "none",
      ),
    "standards with no bank are shown honestly as having no check yet",
  );
}

/* ─── 7. growth: what moved, never raw accuracy ─────────────────────────── */
{
  const now = Date.now();
  const mk = (specs) =>
    graph.nodes.map((n) => ({
      node: n,
      lastTs: (specs[n.code] || {}).lastTs || 0,
      rank: (specs[n.code] || {}).rank || 0,
    }));
  const base = (r) => ({ at: now - 6 * DAY, r });
  const store = { v: 1, nodes: {}, snaps: [base({ "6.AT.1": 1, "6.AT.2": 2 })] };
  const g = M.growth(
    store,
    mk({
      "6.AT.1": { rank: 3, lastTs: now },
      "6.AT.2": { rank: 2, lastTs: now - DAY },
      "6.AT.3": { rank: 1, lastTs: now },
      "6.NOS.2": { rank: 4, lastTs: now },
    }),
    now,
  );
  eq(
    [g.grown, g.up, g.started, g.owned],
    [3, 1, 1, 1],
    "moved up, started and owned are counted from the baseline",
  );
  eq(g.codes.sort(), ["6.AT.1", "6.AT.3", "6.NOS.2"], "and name the skills that grew");
  eq(g.practiced, 4, "practiced this week counts skills touched in the last 7 days");
  eq(
    M.growth({ v: 1, nodes: {}, snaps: [] }, mk({}), now).grown,
    null,
    "with no baseline it says null, not zero or a guess",
  );
  eq(
    M.growth({ v: 1, nodes: {}, snaps: [{ at: now, r: {} }] }, mk({}), now).grown,
    null,
    "today's own snapshot is not a baseline",
  );
  ok(
    !Object.keys(g).some((k) => /acc|rate|percent|score/i.test(k)),
    "growth carries no accuracy figure",
  );
  const lower = M.growth(
    { v: 1, nodes: {}, snaps: [base({ "6.AT.1": 4 })] },
    mk({ "6.AT.1": { rank: 1, lastTs: now } }),
    now,
  );
  eq(
    lower.grown,
    0,
    "a skill that slipped a band is not counted as growth (and is never reported as loss)",
  );
  const t = ST.touchSnap(ST.emptyStore(), mk({ "6.AT.1": { rank: 3 } }), now);
  eq(t.snaps.length, 1, "touching records one snapshot");
  eq(
    ST.touchSnap(t, mk({ "6.AT.1": { rank: 3 } }), now + 1000).snaps.length,
    1,
    "a second touch the same day replaces it",
  );
  eq(ST.touchSnap(t, mk({}), now + DAY).snaps.length, 2, "a touch the next day adds one");
}

/* ─── 8. the page: both routes, in a real DOM ───────────────────────────── */
const pages = {
  "/curriculum/my-progress/": read("curriculum/my-progress/index.html"),
  "/math/my-progress/": read("math/my-progress/index.html"),
};
const ATLAS_ASSETS = [
  "progress-atlas-match.js",
  "progress-atlas-store.js",
  "progress-atlas-model.js",
  "progress-atlas-ui.js",
  "progress-atlas-map.js",
  "progress-atlas-check.js",
  "progress-atlas.js",
];
const sha8 = (f) =>
  createHash("sha256")
    .update(readFileSync(new URL(`assets/my-progress/${f}`, ROOT)))
    .digest("hex")
    .slice(0, 8);
for (const [route, html] of Object.entries(pages)) {
  const srcs = [
    ...html.matchAll(/<script src="(\/assets\/my-progress\/[^"?]+)(?:\?v=([0-9a-f]+))?" defer>/g),
  ];
  const order = srcs.map((m) => m[1].split("/").pop());
  for (const f of ATLAS_ASSETS) ok(order.includes(f), `${route} loads ${f}`);
  ok(
    order.indexOf("progress-atlas.js") < order.indexOf("progress-view.js"),
    `${route} loads the Atlas before progress-view.js mounts it`,
  );
  ok(
    order.indexOf("progress-atlas-store.js") < order.indexOf("progress-atlas-model.js") &&
      order.indexOf("progress-atlas-model.js") < order.indexOf("progress-atlas-ui.js") &&
      order.indexOf("progress-atlas-ui.js") < order.indexOf("progress-atlas-map.js") &&
      order.indexOf("progress-atlas-map.js") < order.indexOf("progress-atlas.js"),
    `${route} loads the Atlas modules in dependency order`,
  );
  ok(
    order.indexOf("progress-sections.js") < order.indexOf("progress-atlas-ui.js"),
    `${route} loads the section helpers the Atlas uses first`,
  );
  for (const m of srcs) {
    const f = m[1].split("/").pop();
    if (ATLAS_ASSETS.includes(f) || f === "progress-view.js")
      eq(m[2], sha8(f), `${route} stamps ${f} with its content hash (?v=${sha8(f)})`);
  }
  const css = html.match(/progress-atlas\.css\?v=([0-9a-f]+)/);
  ok(
    css && css[1] === sha8("progress-atlas.css"),
    `${route} links progress-atlas.css stamped ${sha8("progress-atlas.css")}`,
  );
}
const viewSrc = read("assets/my-progress/progress-view.js");
{
  const re = viewSrc.match(/var SNAPSHOT_KEY =\s*(\/.*\/);/)[1];
  const rx = new RegExp(re.slice(1, -1));
  ok(rx.test("nt-atlas:v1"), "My Progress backup includes nt-atlas:v1");
  ok(
    !rx.test("nt-atlas:v2") && rx.test("nt-signal:v1"),
    "and still includes the older stores without widening to a new version",
  );
  ok(
    !/setItem\(\s*["']nt-atlas/.test(viewSrc),
    "progress-view.js never writes the Atlas store itself (the Atlas merges its own restore)",
  );
}
const atlasSrc = ATLAS_ASSETS.map((f) => [f, read(`assets/my-progress/${f}`)]);
for (const [f, src] of atlasSrc) {
  if (f === "progress-atlas-match.js") continue;
  ok(!/\bremoveItem\(/.test(src), `${f} never deletes anything`);
  ok(
    !/method:\s*["']POST/i.test(src) && !/sendBeacon|XMLHttpRequest|WebSocket/.test(src),
    `${f} never sends anything`,
  );
  ok(
    !/https?:\/\//.test(src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "")),
    `${f} loads nothing from another origin`,
  );
  if (f !== "progress-atlas-store.js")
    ok(!/\.setItem\(/.test(src), `${f} writes only through the store module`);
}
{
  const fetched = [
    ...read("assets/my-progress/progress-atlas.js").matchAll(/getJson\(\s*"([^"]+)"/g),
  ].map((m) => m[1]);
  eq(
    fetched.sort(),
    [
      "/data/atlas-student-why.json",
      "/data/retrieval-bank.json",
      "/data/standards-prerequisites.json",
    ],
    "the Atlas reads exactly three static data files",
  );
}

function boot(route, seed = {}, { now = Date.now(), files = true } = {}) {
  const dom = new JSDOM(pages[route].replace(/<script[\s\S]*?<\/script>/g, ""), {
    url: `https://eduwonderlab.com${route}`,
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  for (const [k, v] of Object.entries(seed))
    w.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
  if (files)
    w.fetch = async (url) => {
      try {
        const body = readFileSync(new URL(`.${url.split("?")[0]}`, ROOT), "utf8");
        return { ok: true, status: 200, json: async () => JSON.parse(body) };
      } catch (_e) {
        return { ok: false, status: 404, json: async () => ({}) };
      }
    };
  w.Date.now = () => now;
  const srcs = [...pages[route].matchAll(/<script src="\/assets\/my-progress\/([^"?]+)/g)].map(
    (m) => m[1],
  );
  for (const f of srcs) w.eval(read(`assets/my-progress/${f}`));
  return dom;
}
const settle = async (w) => {
  await w.NTProgressAtlas.load();
  await new Promise((r) => setTimeout(r, 0));
};
const text = (el) => el.textContent.replace(/\s+/g, " ");

{
  const now = Date.now();
  const seed = {
    "nt-signal:v1": {
      standards: {
        "6.AT.1": { attempts: 6, correct: 6, lastTs: now - DAY },
        "6.AT.2": { attempts: 5, correct: 3, lastTs: now - 2 * DAY },
        "6.NOS.2": { attempts: 4, correct: 1, lastTs: now - 3 * DAY },
        "6.NOS.3": { attempts: 5, correct: 5, lastTs: now - 20 * DAY },
      },
    },
  };
  for (const route of Object.keys(pages)) {
    const dom = boot(route, seed, { now });
    const w = dom.window;
    await settle(w);
    const doc = w.document;
    const root = doc.querySelector("#learning-atlas");
    ok(root, `${route} renders the Learning Atlas`);
    eq(
      doc.querySelectorAll(".at-node").length,
      nodeCodes.length,
      `${route} map shows every standard`,
    );
    eq(
      doc.querySelectorAll(".at-edge-line").length,
      prereq.edges.length,
      `${route} map draws every connection`,
    );
    eq(
      doc.querySelectorAll(".at-item").length,
      nodeCodes.length,
      `${route} text view lists every standard`,
    );
    eq(
      [...doc.querySelectorAll(".at-node")].filter((n) => n.getAttribute("tabindex") === "0")
        .length,
      1,
      `${route} map is one tab stop (roving tabindex)`,
    );
    for (const n of doc.querySelectorAll(".at-node")) {
      ok(
        n.getAttribute("role") === "button" && /\.\s/.test(n.getAttribute("aria-label")),
        `${route} ${n.dataset.code} is a named button with its state in words`,
      );
    }
    // equal value: every connection sentence is readable in the text view
    const listText = text(doc.querySelector('[data-at="list"]'));
    for (const e of graph.edges) {
      ok(
        listText.includes(e.en) && listText.includes(e.es),
        `${route} text view carries the ${key(e)} connection in both languages`,
      );
    }
    for (const n of graph.nodes)
      ok(
        listText.includes(n.en) && listText.includes(n.es),
        `${route} text view names ${n.code} in both languages`,
      );
    // the same state in both views
    for (const s of doc.querySelectorAll(".at-node")) {
      const item = doc
        .querySelector(`.at-item details[data-code="${s.dataset.code}"]`)
        .closest(".at-item");
      eq(
        [...item.classList].find((c) => c.startsWith("s-")),
        [...s.classList].find((c) => c.startsWith("s-")),
        `${route} map and list agree on ${s.dataset.code}`,
      );
    }
    // keyboard: arrows move focus, Enter opens details
    const first = doc.querySelector('.at-node[tabindex="0"]');
    first.focus();
    const press = (el, key) =>
      el.dispatchEvent(new w.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
    const from = doc.activeElement.dataset.code;
    press(doc.activeElement, "ArrowRight");
    ok(
      doc.activeElement.dataset.code !== from && doc.activeElement.classList.contains("at-node"),
      `${route} ArrowRight moves focus to another skill`,
    );
    const moved = doc.activeElement.dataset.code;
    press(doc.activeElement, "Enter");
    ok(
      text(doc.querySelector('[data-at="detail"]')).includes(graph.byCode[moved].en),
      `${route} Enter opens that skill's details`,
    );
    press(doc.activeElement, "End");
    eq(
      doc.activeElement.dataset.code,
      graph.nodes[graph.nodes.length - 1].code,
      `${route} End jumps to the last skill`,
    );
    press(doc.activeElement, "Home");
    eq(
      doc.activeElement.dataset.code,
      graph.nodes[0].code,
      `${route} Home jumps to the first skill`,
    );
    // copy: positive framing, bilingual, no accuracy figures
    const all = text(root);
    for (const bad of DEFICIT)
      ok(
        !bad.test(all.replace(/Look again|Mira otra vez/g, "")),
        `${route} Atlas copy has no deficit language (${bad})`,
      );
    ok(
      /Skills grown this week/.test(all) && /Habilidades que crecieron esta semana/.test(all),
      `${route} shows the "Skills grown this week" block in both languages`,
    );
    ok(
      /Time to revisit/.test(all) && /Hora de repasar/.test(all),
      `${route} shows Time to revisit in both languages`,
    );
    ok(
      !/\d\s?%/.test(text(doc.querySelector('[data-at="stats"]'))),
      `${route} stats block shows no percentage`,
    );
    // reading it changed nothing but (at most) the Atlas's own daily snapshot
    const keys = new Set();
    for (let i = 0; i < w.localStorage.length; i++) keys.add(w.localStorage.key(i));
    ok(
      [...keys].every((k) => k === "nt-signal:v1" || k === "nt-atlas:v1"),
      `${route} wrote nothing outside nt-atlas:v1 (${[...keys]})`,
    );
    eq(
      JSON.parse(w.localStorage.getItem("nt-signal:v1")),
      seed["nt-signal:v1"],
      `${route} left nt-signal:v1 untouched`,
    );
  }

  // the check flow, end to end, on the real page
  {
    const t0 = now;
    const dom = boot("/curriculum/my-progress/", seed, { now: t0 });
    const w = dom.window;
    await settle(w);
    const doc = w.document;
    const bank = retrieval.bank["6.AT.1"];
    const open = () => {
      doc
        .querySelector('.at-node[data-code="6.AT.1"]')
        .dispatchEvent(
          new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
        );
      doc.querySelector('[data-at="detail"] [data-act="check"]').click();
    };
    const answer = (right) => {
      const stems = [...doc.querySelectorAll(".at-q-stem span[lang=en]")].map((e) => e.textContent);
      stems.forEach((stem, i) => {
        const item = bank.find((b) => b.stem.replace(/^\(Lesson\s+[\d.]+\)\s*/, "") === stem);
        const choice = right ? item.correctIndex : (item.correctIndex + 1) % item.choices.length;
        const radio = doc.querySelector(`input[name="atq${i}"][value="${choice}"]`);
        if (radio) radio.checked = true;
        else
          doc.querySelector(`input[name="atq${i}"]`).value = right
            ? item.choices[item.correctIndex]
            : "-1";
      });
    };
    const submit = () =>
      doc
        .querySelector(".at-form")
        .dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
    open();
    ok(
      !doc.querySelector('[data-at="check"]').hidden,
      "the proof check opens from the skill's details",
    );
    eq(doc.querySelectorAll(".at-q").length, 3, "the check has three questions");
    submit();
    ok(
      /Answer all three/.test(doc.querySelector('[data-at="msg"]').textContent),
      "submitting with blanks asks for all three, and says nothing about a score",
    );
    answer(false);
    submit();
    ok(
      /Not yet, and that is okay/.test(text(doc.querySelector('[data-at="check"]'))) &&
        !/\d\s?(\/|of|out of)\s?3/.test(text(doc.querySelector('[data-at="check"]'))),
      "a miss is 'not yet' with no score and no grade",
    );
    eq(
      JSON.parse(w.localStorage.getItem("nt-atlas:v1")).nodes["6.AT.1"].p,
      0,
      "a miss records no proof",
    );
    doc.querySelector('[data-at="again"]').click();
    answer(true);
    submit();
    ok(
      /You showed it/.test(text(doc.querySelector('[data-at="check"]'))),
      "three right shows the proof message",
    );
    doc.querySelector('[data-at="close"]').click();
    const stored = JSON.parse(w.localStorage.getItem("nt-atlas:v1"));
    ok(
      stored.nodes["6.AT.1"].p > 0 && stored.nodes["6.AT.1"].o === 0,
      "the first proof is saved and the skill is NOT owned yet",
    );
    ok(
      /re-check opens/.test(text(doc.querySelector('[data-at="detail"]'))),
      "the details say when the re-check opens",
    );
    ok(
      !doc.querySelector('[data-at="detail"] [data-act="check"]'),
      "and offer no second check until then",
    );
    // a week later
    stored.nodes["6.AT.1"].p -= 8 * DAY;
    w.localStorage.setItem("nt-atlas:v1", JSON.stringify(stored));
    w.dispatchEvent(new w.Event("storage"));
    doc
      .querySelector('.at-node[data-code="6.AT.1"]')
      .dispatchEvent(
        new w.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      );
    ok(
      doc.querySelector('[data-at="detail"] [data-act="check"]'),
      "eight days later the re-check is offered",
    );
    doc.querySelector('[data-at="detail"] [data-act="check"]').click();
    answer(true);
    submit();
    ok(
      /Owned!/.test(text(doc.querySelector('[data-at="check"]'))),
      "a passing re-check says Owned",
    );
    doc.querySelector('[data-at="close"]').click();
    ok(
      doc.querySelector('.at-node[data-code="6.AT.1"]').classList.contains("s-owned"),
      "and the map shows the skill owned",
    );
    eq(
      JSON.parse(w.localStorage.getItem("nt-signal:v1")),
      seed["nt-signal:v1"],
      "taking checks never touches the lesson signal store",
    );
    // snapshot for the dashboard
    const snap = w.NTProgressAtlas.snapshot();
    eq(snap.counts.owned, 1, "snapshot() reports the owned skill");
    eq(snap.nodes.length, nodeCodes.length, "snapshot() lists every skill in class order");
    ok(
      JSON.stringify(snap).length < 4000,
      `snapshot() stays compact (${JSON.stringify(snap).length} bytes)`,
    );
    ok(
      !Object.keys(snap).some((k) => /acc|percent|score/i.test(k)),
      "snapshot() exposes no accuracy figure",
    );
    ok(
      snap.href === "/curriculum/my-progress/#learning-atlas",
      "snapshot() carries the link the dashboard card uses",
    );
    // the mini card for the dashboard
    const host = doc.createElement("div");
    doc.body.append(host);
    w.NTProgressAtlas.mountMini(host);
    await settle(w);
    ok(
      host.querySelector(".at-mini .at-dots") &&
        /My Learning Atlas/.test(host.textContent) &&
        /Mi Atlas de aprendizaje/.test(host.textContent),
      "mountMini() renders a bilingual card",
    );
    ok(
      host.querySelector(".at-dots").getAttribute("role") === "img" &&
        /owned/.test(host.querySelector(".at-dots").getAttribute("aria-label")),
      "the mini dot strip has a text summary",
    );
    // restore merges a backup into the Atlas store
    const before = JSON.parse(w.localStorage.getItem("nt-atlas:v1"));
    const incoming = {
      "nt-atlas:v1": JSON.stringify({
        v: 1,
        nodes: { "6.AT.2": { p: 123, o: 0, l: 123, c: [], seen: [] } },
        snaps: [],
      }),
    };
    ok(w.NTProgressAtlas.restore(incoming), "restore() accepts an Atlas store from a backup");
    const after = JSON.parse(w.localStorage.getItem("nt-atlas:v1"));
    ok(
      after.nodes["6.AT.2"].p === 123 && after.nodes["6.AT.1"].o === before.nodes["6.AT.1"].o,
      "and merges it without losing what is here",
    );
    ok(
      !w.NTProgressAtlas.restore({}) && !w.NTProgressAtlas.restore({ "nt-atlas:v1": "{bad" }),
      "restore() ignores a backup with no Atlas store or a corrupt one",
    );
  }

  // a device with nothing saved still renders, and a storage failure cannot break the page
  {
    const dom = boot("/curriculum/my-progress/", {}, { now });
    await settle(dom.window);
    eq(
      dom.window.document.querySelectorAll(".at-node").length,
      nodeCodes.length,
      "an empty device still shows the whole map",
    );
    ok(
      /Your first week is the baseline/.test(
        dom.window.document.querySelector('[data-at="stats"]').textContent,
      ),
      "and explains the empty growth block instead of showing a zero",
    );
    const none = boot("/curriculum/my-progress/", {}, { now, files: false });
    none.window.fetch = async () => {
      throw new Error("offline");
    };
    await new Promise((r) => setTimeout(r, 20));
    ok(
      /could not load/.test(none.window.document.querySelector("#learning-atlas").textContent) &&
        /safe/.test(none.window.document.querySelector("#learning-atlas").textContent),
      "if the data cannot load the Atlas says so and says progress is safe",
    );
  }
}

console.log(`my progress atlas: ${checks} checks passed.`);
