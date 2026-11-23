// Vocabulary Academy — the Word Galaxy (unit/galaxy.js, unit/galaxy-engine.js). The engine is swept over every real lesson and
// every unit-sized mix of lessons. The connections are re-derived here from the raw word records, independently of the engine,
// so a pair the engine calls "same meaning" or "not connected" has to be true by the data. Run: node tools/vocab-academy-galaxy.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const VA = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const load = (f) => import(new URL(f, VA));
const ENGINE = await load("unit/galaxy-engine.js");
const GALAXY = await load("unit/galaxy.js");
const EXTRAS = await load("unit/extras.js");
const { normalize, groupsFor } = await load("games/data.js");
const { rngFor } = await load("rng.js");
const { DIMS } = await load("contract.js");
const { makeI18n } = await import(new URL("access-practice-lab/src/i18n.js", ROOT));

const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const lessons = [];
for (const g of readdirSync(CONTENT).filter((d) => /^g(K|\d+)$/.test(d)))
  for (const f of readdirSync(new URL(`${g}/`, CONTENT)).filter((x) => /^u\d+\.json$/.test(x)))
    lessons.push(JSON.parse(readFileSync(new URL(`${g}/${f}`, CONTENT), "utf8")));
const byGrade = new Map();
for (const l of lessons) byGrade.set(l.grade, [...(byGrade.get(l.grade) || []), l]);
const unitPools = [];
for (const [grade, list] of byGrade)
  for (let i = 0; i + 2 < list.length; i += 3)
    unitPools.push(
      normalize({
        unit: {
          ...list[i],
          id: `g${grade}-unit${i / 3 + 1}`,
          words: list.slice(i, i + 3).flatMap((l) => l.words),
        },
      }),
    );
const lessonPools = lessons.map((unit) => normalize({ unit }));
const allPools = [...lessonPools, ...unitPools];

// ── independent truth, written from the raw data (deliberately not the engine's code) ─────────────────────────
const n = (s) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
const list = (a) => (a || []).map(n);
const common = (x, y) => x.some((v) => y.includes(v));
const partsOf = (w) =>
  (w.morph?.segs || [])
    .filter((s) => s.t !== "suffix")
    .map((s) => n(s.s).replace(/[-–…]/g, ""))
    .filter((p) => p.length >= 3);
function truth(pool, a, b) {
  const A = {
    hw: n(a.hw),
    syn: list(a.syn),
    ant: list(a.ant),
    fam: list((a.family || []).map((f) => f.w)),
    parts: partsOf(a),
    id: a.id,
    rel: n(a.rel),
  };
  const B = {
    hw: n(b.hw),
    syn: list(b.syn),
    ant: list(b.ant),
    fam: list((b.family || []).map((f) => f.w)),
    parts: partsOf(b),
    id: b.id,
    rel: n(b.rel),
  };
  const syn =
    A.syn.includes(B.hw) || B.syn.includes(A.hw) || common(A.syn, B.syn) || common(A.ant, B.ant);
  const ant =
    A.ant.includes(B.hw) || B.ant.includes(A.hw) || common(A.syn, B.ant) || common(A.ant, B.syn);
  const morph =
    common(A.parts, B.parts) ||
    A.fam.includes(B.hw) ||
    B.fam.includes(A.hw) ||
    common(A.fam, B.fam);
  const groups = groupsFor(pool);
  const group =
    Boolean(A.id && B.id) &&
    (groups.some((g) => g.ids.includes(A.id) && g.ids.includes(B.id)) ||
      (pool.relations.groups || []).some(
        (g) => (g.ids || []).includes(A.id) && (g.ids || []).includes(B.id),
      ) ||
      (A.rel && A.rel === B.rel));
  const spelling =
    A.hw === B.hw ||
    A.hw.includes(B.hw) ||
    B.hw.includes(A.hw) ||
    A.hw.slice(0, 5) === B.hw.slice(0, 5);
  const touching = common(
    [A.hw, ...A.syn, ...A.ant, ...A.fam],
    [B.hw, ...B.syn, ...B.ant, ...B.fam],
  );
  return {
    syn,
    ant,
    morph,
    group,
    any:
      syn ||
      ant ||
      morph ||
      group ||
      touching ||
      (A.hw.length >= 4 && B.hw.length >= 4 && spelling),
  };
}
const starWord = (pool, st) => (st.unit ? pool.byId.get(st.id) : { hw: st.hw });

const BAND_ALLOWED = { early: ["syn", "ant", "none"] };

function checkGalaxy(g, pool) {
  const ids = new Set(pool.words.map((w) => w.id));
  assert.ok(g.rounds.length >= 3, `${pool.id}: at least three pairs`);
  const pairs = new Set();
  for (const r of g.rounds) {
    const q = r.q;
    const a = g.stars[r.a];
    const b = g.stars[r.b];
    assert.ok(a && b && r.a !== r.b, `${pool.id}: both stars of a pair exist and differ`);
    for (const st of [a, b])
      if (st.unit) assert.ok(ids.has(st.id), `${pool.id}: a unit star is a unit word`);
    assert.ok(a.unit || b.unit, `${pool.id}: at least one star of every pair is a unit word`);
    const key = [r.a, r.b].sort().join("|");
    assert.ok(!pairs.has(key), `${pool.id}: no pair is asked twice`);
    pairs.add(key);
    // the menu
    assert.equal(new Set(q.rels).size, q.rels.length, "distinct choices");
    assert.equal(q.choices.length, q.rels.length);
    assert.ok(q.rels.length >= 3 && q.rels.length <= 4, `${pool.id}: three or four choices`);
    assert.equal(q.rels[q.answer], r.rel, "the answer index points at the connection");
    assert.ok(DIMS.includes(q.dim), `${pool.id}: ${q.dim} is a model dimension`);
    assert.ok(ids.has(q.wordId), "results are credited to a unit word");
    assert.equal(r.mc.done, false);
    if (BAND_ALLOWED[pool.band])
      for (const rel of q.rels)
        assert.ok(
          BAND_ALLOWED[pool.band].includes(rel),
          `${pool.id}: early grades only get ${rel}?`,
        );
    // exactly one correct connection, by the data
    const t = truth(pool, starWord(pool, a), starWord(pool, b));
    const holds = (rel) => (rel === "none" ? !t.any : Boolean(t[rel]));
    assert.ok(holds(r.rel), `${pool.id}: ${a.hw} / ${b.hw} really are ${r.rel}`);
    for (const rel of q.rels)
      if (rel !== r.rel)
        assert.ok(
          !holds(rel),
          `${pool.id}: ${a.hw} / ${b.hw}: "${rel}" is shown as a wrong answer, so it must be false`,
        );
    if (r.rel === "none") {
      assert.ok(a.unit && b.unit, "a not-connected pair is two unit words");
      assert.ok(!t.any, `${pool.id}: ${a.hw} / ${b.hw} share nothing in the data`);
    }
    if (r.rel === "syn" || r.rel === "ant")
      assert.ok(
        !q.rels.includes("group") || !(t.syn || t.ant),
        "no 'same group' distractor on a same-meaning or opposite pair",
      );
  }
  // the first pair is never a not-connected pair that gives a sky of one star
  for (const key of Object.keys(g.stars))
    assert.ok(
      g.rounds.some((r) => r.a === key || r.b === key),
      "no star without a pair",
    );
}

test("galaxy: every real lesson and every unit-sized mix builds a valid sky (or none)", () => {
  let built = 0;
  let withNone = 0;
  const kinds = new Set();
  for (const pool of allPools) {
    const g = ENGINE.buildGalaxy(pool, rngFor(`galaxy:${pool.id}`));
    if (!g.rounds.length) continue;
    checkGalaxy(g, pool);
    built += 1;
    if (g.rounds.some((r) => r.rel === "none")) withNone += 1;
    for (const r of g.rounds) kinds.add(r.rel);
  }
  assert.ok(unitPools.length >= 40, "unit-sized pools were swept");
  assert.ok(built >= allPools.length * 0.95, `built ${built} of ${allPools.length}`);
  assert.ok(withNone >= built * 0.9, `a not-connected pair in ${withNone} of ${built} skies`);
  for (const k of ["syn", "ant", "morph", "group", "none"])
    assert.ok(kinds.has(k), `the sweep produced a "${k}" pair`);
});

test("galaxy: early grades only see same meaning, opposites and not connected; older grades add parts and groups", () => {
  const early = unitPools.filter((p) => p.band === "early");
  const older = unitPools.filter((p) => p.band === "middle");
  assert.ok(early.length && older.length);
  for (const p of early)
    for (const r of ENGINE.buildGalaxy(p, rngFor("e")).rounds)
      assert.ok(["syn", "ant", "none"].includes(r.rel) && r.q.rels.length === 3);
  const seen = new Set(
    older.flatMap((p) => ENGINE.buildGalaxy(p, rngFor("m")).rounds.map((r) => r.rel)),
  );
  assert.ok(seen.has("morph") && seen.has("group"), "older grades get word-part and group pairs");
});

test("galaxy: the same pool and seed give the same sky; a different seed differs", () => {
  const pool = unitPools.find((p) => p.band === "middle");
  const a = ENGINE.buildGalaxy(pool, rngFor("same"));
  const b = ENGINE.buildGalaxy(pool, rngFor("same"));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  const c = ENGINE.buildGalaxy(pool, rngFor("other"));
  assert.notDeepEqual(
    a.rounds.map((r) => `${r.a}|${r.b}`),
    c.rounds.map((r) => `${r.a}|${r.b}`),
  );
  // the layout is deterministic too
  const done = (g) => {
    for (const r of g.rounds) r.mc.done = true;
    return ENGINE.layoutStars(g);
  };
  assert.deepEqual(done(a), done(b));
});

test("galaxy: the sky grows without moving earlier stars, stays inside the map and keeps stars apart", () => {
  for (const pool of unitPools.slice(0, 60)) {
    const g = ENGINE.buildGalaxy(pool, rngFor(`sky:${pool.id}`));
    if (!g.rounds.length) continue;
    let before = {};
    for (let k = 0; k < g.rounds.length; k++) {
      g.rounds[k].mc.done = true;
      const pos = ENGINE.layoutStars(g);
      for (const [key, p] of Object.entries(before))
        assert.deepEqual(pos[key], p, `${pool.id}: ${key} never moves`);
      before = pos;
    }
    const pts = Object.values(before);
    assert.equal(
      pts.length,
      Object.keys(g.stars).length,
      "every star of a finished sky has a place",
    );
    for (const p of pts)
      assert.ok(
        p.x >= 20 && p.x <= ENGINE.MAP.w - 20 && p.y >= 20 && p.y <= ENGINE.MAP.h - 20,
        `${pool.id}: inside the map`,
      );
    let clashes = 0;
    for (let i = 0; i < pts.length; i++)
      for (let j = i + 1; j < pts.length; j++)
        if (Math.abs(pts[i].x - pts[j].x) < 70 && Math.abs(pts[i].y - pts[j].y) < 26) clashes += 1;
    assert.ok(
      clashes <= 1,
      `${pool.id}: stars (and their labels) mostly keep apart (${clashes} clashes)`,
    );
  }
});

test("galaxy: constellations partition the drawn stars, and unconnected stars are the ones with no line", () => {
  for (const pool of unitPools.slice(0, 60)) {
    const g = ENGINE.buildGalaxy(pool, rngFor(`con:${pool.id}`));
    if (!g.rounds.length) continue;
    assert.equal(ENGINE.constellationsOf(g).length, 0, "no constellation before an answer");
    for (const r of g.rounds) r.mc.done = true;
    const cons = ENGINE.constellationsOf(g);
    const joined = new Set(ENGINE.drawnRounds(g).flatMap((r) => [r.a, r.b]));
    const inCons = cons.flatMap((c) => c.keys);
    assert.equal(new Set(inCons).size, inCons.length, "a star is in one constellation only");
    assert.deepEqual([...new Set(inCons)].sort(), [...joined].sort());
    for (const e of ENGINE.drawnRounds(g))
      assert.ok(
        cons.some((c) => c.keys.includes(e.a) && c.keys.includes(e.b)),
        "both ends of a line are in one constellation",
      );
    const lone = ENGINE.loneStars(g).map((s) => s.key);
    for (const k of lone) assert.ok(!joined.has(k) && g.stars[k].unit);
    for (const r of g.rounds.filter((x) => x.rel === "none"))
      for (const k of [r.a, r.b])
        assert.ok(
          joined.has(k) || lone.includes(k),
          "a not-connected star is either connected elsewhere or listed as on its own",
        );
  }
});

// ── what a learner reads ─────────────────────────────────────────────────────────────────────────────────────
const textOf = (h) =>
  String(h?.[Object.getOwnPropertySymbols(h)[0]] ?? h)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ");
function fakeEnv(pool, lang = "en") {
  const I = makeI18n(lang, "en");
  return {
    I,
    pool,
    sup: { picture: pool.band === "early" },
    pic: () => "",
    speakBtn: () => "",
    gloss: () => "",
    say() {},
  };
}
const MENTIONS_RIGHT =
  /mean almost the same|are opposites|share the word part|same word family|belong together|not connected in this unit|glowing line joins|stay apart/i;

test("galaxy: a miss never says what the connection is; a clue is about a word's meaning; the answer shows only when right", () => {
  const pool = unitPools.find((p) => p.band === "middle");
  const g = ENGINE.buildGalaxy(pool, rngFor("miss"));
  const env = fakeEnv(pool);
  const r = g.rounds[0];
  const wrong = r.q.rels.findIndex((_, i) => i !== r.q.answer);
  r.mc.tries = 1;
  r.mc.wrong.push(wrong);
  let seen = textOf(GALAXY.galaxySpec.view(g, env));
  assert.match(seen, /Not that connection\. Try again/);
  assert.ok(!MENTIONS_RIGHT.test(seen), "no answer printed after a miss");
  r.mc.hints = 1;
  seen = textOf(GALAXY.galaxySpec.view(g, env));
  const focus = pool.byId.get(r.q.hints[0].id);
  assert.ok(
    seen.includes(focus.def.replace(/\s+/g, " ").trim()),
    "hint one is a clue about a word's meaning",
  );
  assert.ok(!MENTIONS_RIGHT.test(seen), "no answer printed by a hint");
  r.mc.hints = 3;
  r.mc.hidden.push(r.q.rels.findIndex((_, i) => i !== r.q.answer && i !== wrong));
  assert.ok(
    !MENTIONS_RIGHT.test(textOf(GALAXY.galaxySpec.view(g, env))),
    "a hint that removes choices prints no answer either",
  );
  r.mc.done = true;
  seen = textOf(GALAXY.galaxySpec.view(g, env));
  assert.ok(MENTIONS_RIGHT.test(seen), "once it is right, the connection is explained");
  assert.match(seen, /<?svg|Your galaxy/);
});

test("galaxy: the finished view lists every connection as text and the lines carry four distinct styles", () => {
  const pool = unitPools.find((p) => p.grade === "7");
  const g = ENGINE.buildGalaxy(pool, rngFor("finish"));
  for (const r of g.rounds) r.mc.done = true;
  g.claimed = true;
  const env = fakeEnv(pool);
  const raw = GALAXY.galaxySpec.finishExtra(g, env);
  const html = String(raw[Object.getOwnPropertySymbols(raw)[0]]);
  const rels = new Set(
    [...html.matchAll(/class="va-gal-link[^"]*" data-rel="(\w+)"/g)].map((m) => m[1]),
  );
  for (const rel of ENGINE.drawnRounds(g).map((r) => r.rel))
    assert.ok(rels.has(rel), `a ${rel} line is drawn`);
  assert.equal(
    (html.match(/<li>/g) || []).length >= g.rounds.length,
    true,
    "a text list item per connection",
  );
  assert.match(html, /aria-label="Star map with/);
  assert.match(html, /Stars that stayed on their own/);
  for (const rel of ["syn", "ant", "morph", "group"])
    assert.ok(ENGINE.REL[rel].line && ENGINE.REL[rel].lineEn && ENGINE.REL[rel].lineEs);
  assert.equal(
    new Set(["syn", "ant", "morph", "group"].map((k) => ENGINE.REL[k].line)).size,
    4,
    "four line styles",
  );
});

test("galaxy: every string a learner reads has Spanish beside the English", () => {
  for (const [k, v] of Object.entries(ENGINE.REL))
    assert.ok(v.en && v.es && v.en !== v.es && v.lineEn && v.lineEs, k);
  const pool = unitPools.find((p) => p.band === "early");
  const g = ENGINE.buildGalaxy(pool, rngFor("es"));
  const en = textOf(GALAXY.galaxySpec.view(g, fakeEnv(pool, "en")));
  const es = textOf(GALAXY.galaxySpec.view(g, fakeEnv(pool, "es")));
  assert.match(en, /How are these words connected\?/);
  assert.match(es, /¿Cómo se relacionan estas palabras\?/);
  assert.ok(!/How are these words/.test(es), "Spanish mode drops the English chrome");
  const bi = textOf(GALAXY.galaxySpec.view(g, fakeEnv(pool, "bi")));
  assert.ok(
    /How are these words/.test(bi) && /¿Cómo se relacionan/.test(bi),
    "bilingual mode shows both",
  );
  for (const steps of GALAXY.galaxySpec.howTo)
    assert.ok(steps[0] && steps[1] && steps[0] !== steps[1]);
});

test("galaxy: registered as a unit activity with a bilingual entry, its own stylesheet and Joel's game rules", () => {
  const x = EXTRAS.extraOf("galaxy");
  assert.ok(x, "registered in EXTRAS");
  for (const k of ["title", "short", "blurb", "lead", "assign", "doneLabel"])
    assert.ok(Array.isArray(x[k]) && x[k][0] && x[k][1], k);
  assert.equal(typeof x.load, "function");
  assert.ok(EXTRAS.EXTRA_IDS.includes("galaxy"));
  const index = readFileSync(new URL("index.js", VA), "utf8");
  assert.match(index, /"unit-activity":[^\]]*vocab-academy-galaxy\.css/);
  const cssUrl = new URL("access-practice-lab/vocab-academy-galaxy.css", ROOT);
  assert.ok(existsSync(cssUrl));
  const css = readFileSync(cssUrl, "utf8");
  assert.ok(!/#(?:[0-9a-f]{0,2})?(?:7c3aed|8b5cf6|6d28d9|a78bfa|5b21b6)/i.test(css), "no purple");
  assert.ok(/prefers-reduced-motion/.test(css) && /forced-colors/.test(css));
  for (const f of ["unit/galaxy.js", "unit/galaxy-engine.js"]) {
    const src = readFileSync(new URL(f, VA), "utf8");
    assert.ok(
      !/setInterval|setTimeout|countdown|timeLeft|seconds left/i.test(src),
      `${f}: nothing counts down`,
    );
    assert.ok(!/href="[^"]*(games|curriculum)\/?"/.test(src), `${f}: no link back to a hub`);
  }
});

test("galaxy: results go through the model and the run is kept under unitWork.galaxy", () => {
  const src = readFileSync(new URL("unit/galaxy.js", VA), "utf8");
  assert.match(src, /recordResult\(/);
  assert.match(src, /workOf\(va\.progress, gid\)\.galaxy/);
  assert.match(src, /export function start\(host, ctx, va, \{ gid, merged, g \}\)/);
});
