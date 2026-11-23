// Vocabulary Academy — Vocabulary Arcade engine tests (SPEC §7, §10). Pure: no DOM, no network.
// Sweeps every game engine over the reference unit and every real unit file under content/vocab-academy.
// Run: node tools/vocab-academy-games.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const GAMES = new URL("access-practice-lab/src/vocab-academy/games/", ROOT);
const load = (f) => import(new URL(f, GAMES));
const { GAMES: REGISTRY, fitsGrade } = await load("index.js");
const { normalize, groupsFor } = await load("data.js");
const Q = await load("questions.js");
const MR = await load("morph-records.js");
const WB = await load("word-builder.js");
const MM = await load("meaning-match.js");
const WS = await load("word-sort.js");
const WC = await load("word-connections.js");
const CD = await load("context-detective.js");
const RM = await load("reading-mystery.js");
const SL = await load("sentence-lab.js");
const WQ = await load("word-quest.js");
const MA = await load("word-mastery.js");
const AR = await load("vocab-arena.js");
const { GAME_IDS } = await import(
  new URL("access-practice-lab/src/vocab-academy/contract.js", ROOT)
);
const { rngFor } = await import(new URL("access-practice-lab/src/vocab-academy/rng.js", ROOT));
const { scan } = await import(new URL("tools/validate-game-rules.mjs", ROOT));

const json = (u) => JSON.parse(readFileSync(u, "utf8"));
const reference = json(new URL("docs/vocab-academy/reference-unit.json", ROOT));
const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const real = [];
for (const g of existsSync(CONTENT) ? readdirSync(CONTENT) : [])
  if (/^g(K|\d+)$/.test(g))
    for (const f of readdirSync(new URL(`${g}/`, CONTENT)))
      if (/^u\d+\.json$/.test(f))
        try {
          real.push(json(new URL(`${g}/${f}`, CONTENT)));
        } catch {
          /* a unit still being written is the content agents' to fix */
        }
const units = [reference, ...real.filter((u) => Array.isArray(u.words) && u.words.length)];
const pools = units.map((unit) => normalize({ unit, review: [] }));
const seed = (name, pool) => `${name}:${pool.id}:0`;
const same = (a, b) =>
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));

test("registry: the ten games, in GAME_IDS order, with the frozen shape", () => {
  assert.deepEqual(
    REGISTRY.map((g) => g.id),
    GAME_IDS,
  );
  assert.equal(REGISTRY.length, 10);
  for (const g of REGISTRY) {
    assert.ok(g.title && g.blurb && g.purpose, g.id);
    assert.equal(typeof g.mount, "function", g.id);
    assert.ok(Array.isArray(g.dims) && g.dims.length, g.id);
    assert.ok(fitsGrade(g, "6"), `${g.id} fits grade 6`);
  }
  assert.equal(
    fitsGrade(
      REGISTRY.find((g) => g.id === "word-builder"),
      "K",
    ),
    false,
  );
});

test("determinism: every engine gives the same run from the same seed", () => {
  for (const pool of pools) {
    same(
      Q.buildMix(pool, rngFor(seed("a", pool)), { count: 10 }),
      Q.buildMix(pool, rngFor(seed("a", pool)), { count: 10 }),
    );
    same(MM.buildLevels(pool, rngFor(1)), MM.buildLevels(pool, rngFor(1)));
    same(WS.buildSort(pool, rngFor(2)), WS.buildSort(pool, rngFor(2)));
    same(WC.buildWeb(pool, rngFor(3)), WC.buildWeb(pool, rngFor(3)));
    same(CD.buildCases(pool, rngFor(4)), CD.buildCases(pool, rngFor(4)));
    same(RM.buildMystery(pool, rngFor(5)), RM.buildMystery(pool, rngFor(5)));
    same(SL.buildLab(pool, rngFor(6)), SL.buildLab(pool, rngFor(6)));
    same(WQ.buildQuest(pool, rngFor(7)), WQ.buildQuest(pool, rngFor(7)));
    same(AR.buildArena(pool, rngFor(8)), AR.buildArena(pool, rngFor(8)));
    const recs = MR.buildRecords(pool);
    same(WB.buildBuilder(pool, recs, rngFor(9)), WB.buildBuilder(pool, recs, rngFor(9)));
    same(
      MA.buildMastery(pool, rngFor(10), { now: 5 }),
      MA.buildMastery(pool, rngFor(10), { now: 5 }),
    );
  }
});

const checkMc = (q, where) => {
  const keys = q.choices.map((c) => String(c).toLowerCase().trim());
  assert.equal(new Set(keys).size, keys.length, `${where}: duplicate choices in ${q.id}`);
  assert.ok(
    Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.choices.length,
    `${where}: answer index ${q.id}`,
  );
  assert.ok(q.choices.length >= 2, where);
  assert.ok(q.wordId && q.dim && q.stem, `${where}: ${q.id} fields`);
};

test("every multiple-choice step has exactly one correct, distinct answer", () => {
  let n = 0;
  for (const pool of pools) {
    const where = pool.id;
    for (const q of Q.buildMix(pool, rngFor(11), { count: 14 })) checkMc(q, where), n++;
    for (const t of Q.QTYPE_IDS)
      for (const w of pool.words) {
        if (!Q.available(w, pool).includes(t)) continue;
        const q = Q.buildQuestion(t, w, pool, rngFor(`${t}${w.id}`));
        if (q) checkMc(q, where), n++;
      }
    for (const c of WQ.buildQuest(pool, rngFor(12)).regions)
      for (const q of c.qs) checkMc(q, where), n++;
    for (const c of CD.buildCases(pool, rngFor(13))) checkMc(c.q, where), n++;
    for (const c of RM.buildMystery(pool, rngFor(14)))
      for (const q of c.steps) checkMc(q, where), n++;
    for (const r of WS.buildSort(pool, rngFor(15)).reasons) checkMc(r, where), n++;
    // the picked answer text must be unique among the choices
    for (const q of Q.buildMix(pool, rngFor(16), { count: 12 }))
      assert.equal(
        q.choices.filter((c) => c === q.choices[q.answer]).length,
        1,
        `${where} ${q.id}`,
      );
  }
  assert.ok(n > 300, `only ${n} questions were checked`);
});

test("word builder offers only real derivations", () => {
  let words = 0;
  for (const pool of pools) {
    const recs = MR.buildRecords(pool);
    const valid = MR.validKeys(recs, null, pool);
    for (const r of recs) {
      words++;
      assert.ok(
        MR.spellsWord(
          r.parts.map((p) => p.form),
          r.word,
        ),
        `${r.word} is not spelled by its parts`,
      );
      assert.ok(
        r.parts.length >= 2 &&
          r.parts.some((p) => p.type === "prefix" || p.type === "suffix" || p.type === "compound"),
      );
    }
    for (const round of WB.buildBuilder(pool, recs, rngFor(17), { count: 8 })) {
      assert.ok(valid.has(MR.keyOf(round.rec.parts)), `round word ${round.rec.word} is a record`);
      if (round.mode !== "build") continue;
      // every part of the answer is in the tray, and every filled-in combination is judged by the real-word table only
      for (const p of round.rec.parts)
        assert.ok(
          round.tray.some((t) => t.k === p.k),
          `${p.k} missing from tray`,
        );
      for (const a of round.tray)
        for (const b of round.tray) {
          const r = {
            ...round,
            slots: round.rec.parts.length === 2 ? [a.k, b.k] : round.slots.map(() => a.k),
          };
          const j = WB.judgeBuild(r, valid);
          assert.equal(
            j.kind === "none",
            !valid.has(r.slots.join("+")),
            `${r.slots.join("+")} judged wrongly`,
          );
          assert.equal(j.kind === "target", r.slots.join("+") === MR.keyOf(round.rec.parts));
        }
    }
  }
  assert.ok(words > 0, "no real unit supports Word Builder");
  // a made-up combination of real parts is never accepted
  const pool = normalize({ unit: reference });
  const fake = {
    rec: {
      parts: [
        { k: "pre:un-", type: "prefix" },
        { k: "base:kind", type: "base" },
      ],
    },
    slots: ["pre:un-", "base:happyx"],
  };
  assert.equal(WB.judgeBuild(fake, MR.validKeys([], null, pool)).kind, "none");
  // the Word Study dataset, when present, is filtered through isRealDerivation
  const ds = {
    parts: [{ id: "pre.un", form: "un-", type: "prefix", meaning: "not" }],
    derivations: [
      { word: "unkind", parts: ["pre.un", "base:kind"], gloss: "not kind" },
      { word: "unfoo", parts: ["pre.un", "base:foo"], gloss: "x" },
    ],
  };
  const out = MR.recordsFromDataset(ds, pool, (parts) => !parts.includes("base:foo"));
  assert.deepEqual(
    out.map((r) => r.word),
    ["unkind"],
  );
});

test("spelling rules accept real joins and reject non-words", () => {
  assert.ok(MR.spellsWord(["happy", "-ness"], "happiness"));
  assert.ok(MR.spellsWord(["space", "-ious"], "spacious"));
  assert.ok(MR.spellsWord(["thin", "-er"], "thinner"));
  assert.ok(MR.spellsWord(["un-", "kind"], "unkind"));
  assert.ok(!MR.spellsWord(["un-", "kind"], "unkinds"));
  assert.ok(!MR.spellsWord(["re-", "kind"], "unkind"));
});

test("vocabulary arena score depends on correctness and variety, never on time", () => {
  const log = [
    { type: "def-word", ok: true, firstTry: true },
    { type: "cloze", ok: true, firstTry: false },
    { type: "cloze", ok: true, firstTry: true },
  ];
  const base = Q.arenaScore(log);
  const slow = Q.arenaScore(
    log.map((e, i) => ({ ...e, ms: 90000 * (i + 1), elapsed: 999, t: Date.now() + i })),
  );
  const fast = Q.arenaScore(log.map((e) => ({ ...e, ms: 1, elapsed: 0 })));
  assert.deepEqual(slow, base);
  assert.deepEqual(fast, base);
  assert.equal(base.base, 10 + 6 + 10);
  assert.equal(base.points, base.base + 2 * Q.ARENA_POINTS.variety);
  const src =
    readFileSync(new URL("vocab-arena.js", GAMES), "utf8") +
    readFileSync(new URL("questions.js", GAMES), "utf8");
  const score = src.slice(src.indexOf("export function arenaScore"));
  assert.ok(
    !/Date\.now|performance\.now|elapsed|\.ms\b/.test(score.slice(0, score.indexOf("\n}\n") + 3)),
    "arenaScore reads a clock",
  );
});

test("word mastery asks for due words first, then weak, then the rest", () => {
  const pool = pools.find((p) => p.words.length >= 6) || pools[0];
  const words = pool.all.slice(0, 6);
  const now = Date.parse("2026-11-20T12:00:00Z");
  const day = 86400000;
  const entries = {
    [words[0].id]: {
      state: "secure",
      seen: 4,
      due: new Date(now + 20 * day).toISOString(),
      lapses: 0,
    },
    [words[1].id]: {
      state: "learning",
      seen: 1,
      due: new Date(now + 1 * day).toISOString(),
      lapses: 0,
    },
    [words[2].id]: {
      state: "applying",
      seen: 3,
      due: new Date(now - 2 * day).toISOString(),
      lapses: 0,
    },
    [words[3].id]: {
      state: "review-needed",
      seen: 3,
      due: new Date(now + 5 * day).toISOString(),
      lapses: 1,
    },
    [words[4].id]: { state: "new", seen: 0 },
  };
  const picks = MA.pickMasteryWords(words, (id) => entries[id], now, 6);
  const order = picks.map((p) => p.word.id);
  assert.deepEqual(
    new Set(order.slice(0, 2)),
    new Set([words[2].id, words[3].id]),
    "due and review-needed come first",
  );
  assert.equal(order[2], words[1].id, "weak next");
  assert.ok(order.slice(-2).includes(words[4].id), "not-started last");
  assert.ok(picks.slice(0, 2).every((p) => p.reason === "due"));
  const m = MA.buildMastery(pool, rngFor(18), { entryOf: (id) => entries[id], now, limit: 4 });
  assert.deepEqual(
    new Set(m.picks.slice(0, 2).map((p) => p.id)),
    new Set([words[2].id, words[3].id]),
  );
  for (let i = 1; i < m.qs.length; i++)
    assert.notEqual(m.qs[i].wordId + m.qs[i].type, m.qs[i - 1].wordId + m.qs[i - 1].type);
  const out = MA.masteryOutcome(
    m.picks,
    [
      { wordId: words[2].id, ok: false },
      { wordId: words[0].id, ok: true },
    ],
    (id) => entries[id],
  );
  assert.ok(out.review.some((x) => x.id === words[2].id));
});

test("meaning match, word sort and connections build only valid items", () => {
  for (const pool of pools) {
    for (const L of MM.buildLevels(pool, rngFor(19))) {
      const ids = new Set(L.cards.map((c) => c.pair));
      assert.equal(
        L.cards.length,
        ids.size * 2,
        `${pool.id} ${L.kind}: each word has exactly one partner`,
      );
      assert.ok(ids.size >= 3);
    }
    const sort = WS.buildSort(pool, rngFor(20));
    for (const c of sort.cards) assert.ok(sort.cats[c.cat], "card category exists");
    if (sort.mode === "groups")
      for (const c of sort.cards)
        assert.ok(
          groupsFor(pool).some((g) => g.ids.includes(c.id) && g.label === sort.cats[c.cat].label),
        );
    const web = WC.buildWeb(pool, rngFor(21));
    for (const l of web.valid) {
      assert.ok(web.nodes.some((n) => n.id === l.a) && web.nodes.some((n) => n.id === l.b));
      assert.equal(WC.judgeLink(web, [], l.a, l.b, l.type).kind, "ok");
      const wrong = WC.LINKS.find(
        (x) =>
          x.id !== l.type &&
          !web.valid.some(
            (v) =>
              v.type === x.id && ((v.a === l.a && v.b === l.b) || (v.a === l.b && v.b === l.a)),
          ),
      );
      assert.notEqual(WC.judgeLink(web, [], l.a, l.b, wrong.id).kind, "ok");
    }
    const bad = web.nodes.find((n) => n.kind === "meaning");
    const other = web.nodes.find((n) => n.kind === "word" && n.owner !== bad?.owner);
    if (bad && other) assert.notEqual(WC.judgeLink(web, [], bad.id, other.id, "means").kind, "ok");
  }
});

test("reading mystery finds the evidence sentence and falls back when it cannot", () => {
  let cases = 0;
  for (const pool of pools)
    for (const c of RM.buildMystery(pool, rngFor(22))) {
      cases++;
      const clue = c.steps[0];
      assert.ok(c.steps[0].choices[clue.answer].length > 10);
      assert.equal(c.steps.length, 3);
      assert.ok(
        pool.passage.paras.join(" ").includes(c.steps[0].choices[clue.answer].slice(0, 20)),
        "clue card is passage text",
      );
    }
  assert.ok(cases > 0, "no real passage supports a mystery case");
  const none = normalize({ words: pools[0].words });
  assert.equal(RM.buildMystery(none, rngFor(1)).length, 0);
  assert.equal(RM.supported(none), false);
});

test("sentence lab rules are transparent and word-specific", () => {
  const w = reference.words[0];
  const ok = SL.checkSentence(
    `The ${w.hw === "x" ? "boy" : "team"} was ${w.hw} when the storm began last night.`,
    w,
    { band: "middle" },
  );
  assert.ok(ok.checks.find((c) => c.id === "word").ok);
  const none = SL.checkSentence("The dog ran home.", w, { band: "middle" });
  assert.equal(none.passed, false);
  assert.equal(none.checks.find((c) => c.id === "word").ok, false);
  const copy = SL.checkSentence(w.ex, w, { band: "middle" });
  assert.equal(copy.checks.find((c) => c.id === "own").ok, false, "copying the example is caught");
  assert.equal(
    SL.checkSentence("no capital or stop", w, { band: "middle" }).checks.find(
      (c) => c.id === "form",
    ).ok,
    false,
  );
  assert.ok(
    ok.checks.every((c) => c.en && c.es),
    "every rule is stated in both languages",
  );
});

test("context detective: clue words come from the word's own data; the sense answer is unique", () => {
  let cases = 0;
  for (const pool of pools)
    for (const c of CD.buildCases(pool, rngFor(23))) {
      cases++;
      const word = pool.byId.get(c.wordId);
      assert.ok(word);
      if (c.clue.length) assert.equal(CD.judgeClues({ ...c, sel: [c.clue[0]] }).ok, true);
      assert.equal(CD.judgeClues({ ...c, sel: [] }).ok, false);
    }
  assert.ok(cases > 0);
});

test("game rules: no hub links, no countdowns, no solution-on-miss in the arcade files", () => {
  const dir = new URL("access-practice-lab/src/vocab-academy/", ROOT);
  const files = [
    ...readdirSync(GAMES)
      .filter((f) => f.endsWith(".js"))
      .map((f) => new URL(f, GAMES)),
    new URL("views/games.js", dir),
  ];
  assert.ok(files.length >= 14);
  for (const f of files) assert.deepEqual(scan(readFileSync(f, "utf8")), [], f.pathname);
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert.ok(
      !/\bfetch\(|XMLHttpRequest|sendBeacon|https?:\/\//.test(src.replace(/\/\/.*$/gm, "")),
      `${f.pathname} makes or names an external request`,
    );
  }
});
