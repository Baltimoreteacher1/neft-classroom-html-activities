// Vocabulary Academy — the Spelling Studio (unit/spell.js). The pure engine is swept over every real lesson and every
// unit-sized mix of lessons: tiles spell the word exactly, extras never make a second valid spelling, runs are
// deterministic by seed, the letter feedback says nothing about letters the learner has not tried, and nothing counts down.
// Run: node tools/vocab-academy-spell.test.mjs
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const VA = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const load = (f) => import(new URL(f, VA));
const SP = await load("unit/spell.js");
const EXTRAS = await load("unit/extras.js");
const { normalize } = await load("games/data.js");
const { rngFor } = await load("rng.js");
const { DIMS } = await load("contract.js");
const { toHtml } = await import(new URL("../access-practice-lab/src/util.js", import.meta.url));

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
const run = (pool, seed = `spell:${pool.id}`) => SP.buildSpelling(pool, rngFor(seed));

/** Every distinct way to pick tiles (any order) whose joined text is `word`, as sorted tile-text multisets. */
function spellings(tiles, word) {
  const found = new Set();
  const used = new Array(tiles.length).fill(false);
  const picked = [];
  const go = (at) => {
    if (at === word.length) {
      found.add([...picked].sort().join("|"));
      return;
    }
    for (let k = 0; k < tiles.length; k++) {
      if (used[k] || !word.startsWith(tiles[k], at)) continue;
      used[k] = true;
      picked.push(tiles[k]);
      go(at + tiles[k].length);
      picked.pop();
      used[k] = false;
    }
  };
  go(0);
  return found;
}

test("registry: the spelling studio is one entry with both languages and a lazy loader", () => {
  const e = EXTRAS.extraOf("spell");
  assert.ok(e, "registered as `spell`");
  for (const k of ["title", "short", "blurb", "lead", "assign", "doneLabel"])
    assert.ok(
      Array.isArray(e[k]) && e[k][0] && e[k][1] && e[k][0] !== e[k][1],
      `${k} is an [en, es] pair`,
    );
  assert.equal(typeof e.load, "function");
  assert.equal(new Set(EXTRAS.EXTRA_IDS).size, EXTRAS.EXTRA_IDS.length, "ids are unique");
});

test("spellable: runs of letters only; phrases and hyphenated words are left out", () => {
  assert.ok(SP.spellable("memoir") && SP.spellable("cat"));
  assert.ok(
    !SP.spellable("due to") &&
      !SP.spellable("one-sided") &&
      !SP.spellable("up") &&
      !SP.spellable(""),
  );
});

test("every real lesson and unit-sized mix builds a valid run: tiles spell the word exactly", () => {
  let built = 0;
  for (const pool of allPools) {
    const s = run(pool);
    if (!s.items.length) continue;
    built += 1;
    const ids = new Set(pool.words.map((w) => w.id));
    const words = new Set(s.items.map((i) => i.wordId));
    assert.ok(words.size >= 2 && words.size <= 5, `${pool.id}: 2-5 words`);
    assert.equal(s.items.length, words.size * 3, `${pool.id}: every word is met once per step`);
    for (const it of s.items) {
      assert.ok(ids.has(it.wordId), `${pool.id}: a word of the unit`);
      assert.ok(SP.spellable(it.hw) && it.hw === it.hw.toLowerCase());
      assert.equal(it.tokens.join(""), it.hw, `${it.hw}: tokens spell the word`);
      assert.equal(it.n, it.tokens.length);
      assert.equal(it.done, false);
      if (it.mode === "tiles") {
        const have = (it.step === 1 ? 0 : it.extras.length) + it.tokens.length;
        assert.equal(
          it.tiles.length,
          have,
          `${it.hw}: tiles are the word's tokens plus the extras`,
        );
        assert.equal(it.slots.length, it.n);
        // The tiles minus the extras are exactly the tokens (same multiset).
        const rest = [...it.tiles.map((t) => t.t)];
        for (const x of it.extras || []) rest.splice(rest.indexOf(x), 1);
        assert.deepEqual(
          [...rest].sort(),
          [...it.tokens].sort(),
          `${it.hw}: exact letters or chunks`,
        );
        assert.ok(SP.trayTiles(it).length === it.tiles.length, "all tiles start in the tray");
      } else {
        assert.equal(it.tiles, undefined, "a typed step carries no tiles");
      }
    }
    // The steps rise across the run: all of step 1, then step 2, then step 3.
    assert.deepEqual(
      s.items.map((i) => i.step),
      [...s.items.map((i) => i.step)].sort(),
      `${pool.id}: steps rise`,
    );
    assert.deepEqual([...new Set(s.items.map((i) => i.step))], [1, 2, 3]);
    for (let k = 1; k < s.items.length; k++)
      assert.notEqual(
        s.items[k].wordId,
        s.items[k - 1].wordId,
        `${pool.id}: the same word never runs back to back`,
      );
  }
  assert.ok(built >= allPools.length * 0.95, `built ${built} of ${allPools.length}`);
  assert.ok(unitPools.length >= 40, "unit-sized pools were swept");
});

test("extras never make a second valid spelling, and the tiles never start in the answer's order", () => {
  let checked = 0;
  for (const pool of allPools) {
    for (const it of run(pool).items) {
      if (it.mode !== "tiles") continue;
      const texts = it.tiles.map((t) => t.t);
      const ways = spellings(texts, it.hw);
      assert.equal(
        ways.size,
        1,
        `${pool.id} ${it.hw}: exactly one set of tiles spells it (${[...ways].join(" / ")})`,
      );
      for (const x of it.extras || []) {
        assert.equal(x.length, 1);
        assert.ok(!it.hw.includes(x), `${it.hw}: extra "${x}" is not in the word`);
      }
      assert.equal(new Set(it.extras || []).size, (it.extras || []).length, "extras are distinct");
      const order = it.tiles.map((t) => t.t).filter((t) => !(it.extras || []).includes(t));
      if (new Set(it.tokens).size > 1 && it.tokens.length > 1)
        assert.notEqual(order.join("|"), it.tokens.join("|"), `${it.hw}: scrambled`);
      checked += 1;
    }
  }
  assert.ok(checked > 1000, `swept ${checked} tile items`);
});

test("early grades get chunk tiles that spell the word; later grades get single letters", () => {
  const early = unitPools.filter((p) => p.band === "early");
  const middle = unitPools.filter((p) => p.band === "middle");
  assert.ok(early.length && middle.length);
  let chunked = 0;
  let total = 0;
  for (const p of early)
    for (const it of run(p).items.filter((i) => i.mode === "tiles" && i.step === 1)) {
      total += 1;
      assert.equal(it.tokens.join(""), it.hw);
      if (it.tokens.some((t) => t.length > 1)) chunked += 1;
    }
  assert.ok(chunked / total > 0.9, `most early words use chunks (${chunked}/${total})`);
  for (const p of middle)
    for (const it of run(p).items.filter((i) => i.mode === "tiles"))
      assert.ok(
        it.tokens.every((t) => t.length === 1),
        "letters after grade 2",
      );
  // Word-part data is used when it spells the word exactly.
  assert.deepEqual(
    SP.chunksOf({ hw: "unhappy", morph: { segs: [{ s: "un-" }, { s: "happy" }] } }),
    ["un", "happy"],
  );
  assert.deepEqual(SP.chunksOf({ hw: "family", morph: {} }), ["fa", "mi", "ly"]);
  assert.deepEqual(SP.chunksOf({ hw: "same" }), ["s", "ame"], "a silent e stays with its chunk");
  assert.equal(
    SP.chunksOf({ hw: "unhappy", morph: { segs: [{ s: "un-" }, { s: "sad" }] } }).join(""),
    "unhappy",
    "wrong word-part data is ignored",
  );
});

test("the same pool and seed give the same run; a different seed differs", () => {
  const pool = unitPools[0];
  const a = run(pool, "same");
  const b = run(pool, "same");
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  const c = run(pool, "other");
  assert.notDeepEqual(
    a.items.map((i) => i.id + i.tiles?.map((t) => t.t).join("")),
    c.items.map((i) => i.id + i.tiles?.map((t) => t.t).join("")),
  );
});

test("a pool with too few spellable words is unplayable, never a broken run", () => {
  const pool = normalize({
    unit: {
      id: "x",
      grade: "4",
      words: [
        { id: "va.a", hw: "due to", def: "d" },
        { id: "va.b", hw: "memoir", def: "d" },
      ],
    },
  });
  assert.deepEqual(SP.buildSpelling(pool, rngFor(1)).items, []);
});

test("marks: one mark per tried token, right / elsewhere / not in the word, with repeated letters handled", () => {
  assert.deepEqual(SP.markTokens([..."cat"], [..."cat"]), ["ok", "ok", "ok"]);
  assert.deepEqual(SP.markTokens([..."cat"], [..."act"]), ["move", "move", "ok"]);
  assert.deepEqual(SP.markTokens([..."cat"], [..."dog"]), ["no", "no", "no"]);
  // Two l's guessed where the word has one: only one of them can be "elsewhere".
  assert.deepEqual(SP.markTokens([..."plan"], [..."llll"]), ["no", "ok", "no", "no"]);
  assert.deepEqual(SP.markTokens([..."apple"], [..."pappy"]), ["move", "move", "ok", "no", "no"]);
  assert.deepEqual(SP.markTokens(["un", "happy"], ["happy", "un"]), ["move", "move"]);
  assert.equal(
    SP.markTokens([..."cat"], [..."ca"]).length,
    2,
    "a short try gets a short row of marks",
  );
});

test("letter feedback never reveals a letter the learner has not tried", () => {
  // Changing the answer only where the attempt has no say (positions past it, letters it never used) cannot change a mark.
  let compared = 0;
  const words = [
    ...new Set(lessons.flatMap((l) => l.words.map((w) => w.hw)).filter(SP.spellable)),
  ].map((w) => w.toLowerCase());
  const rng = rngFor("leak");
  for (let k = 0; k < 4000; k++) {
    const word = rng.pick(words);
    const cut = 1 + rng.int(word.length - 1);
    const attempt = [...word.slice(0, cut)];
    if (rng.next() < 0.5)
      attempt[rng.int(attempt.length)] = "abcdefghijklmnopqrstuvwxyz"[rng.int(26)];
    const used = new Set(attempt);
    const spare = [..."abcdefghijklmnopqrstuvwxyz"].filter((c) => !used.has(c));
    const twin = [...word].map((c, i) =>
      i >= attempt.length && !used.has(c) ? rng.pick(spare) : c,
    );
    assert.deepEqual(
      SP.markTokens([...word], attempt),
      SP.markTokens(twin, attempt),
      `${word} vs ${twin.join("")} for ${attempt.join("")}`,
    );
    compared += 1;
  }
  assert.equal(compared, 4000);
});

test("tiles: placing, lifting, a wrong check locks only the right places, hints fill one, a right check finishes", () => {
  const pool = unitPools.find((p) => p.band === "middle");
  const s = run(pool);
  const it = s.items.find((i) => i.mode === "tiles" && i.step === 2);
  assert.equal(SP.checkTiles(it), null, "an unfilled build is not a check");
  // Fill the slots with the tiles in tray order (wrong on purpose unless it happens to be right).
  for (const t of [...it.tiles]) SP.placeTile(it, t.id);
  assert.ok(SP.slotsFull(it));
  assert.equal(
    SP.placeTile(it, it.tiles.find((t) => !it.slots.includes(t.id))?.id ?? -1),
    false,
    "no room left",
  );
  // Take everything back, then build it right using only the answer's tokens.
  assert.ok(SP.clearSlots(it));
  assert.equal(
    SP.placed(it).every((x) => x === null),
    true,
  );
  // One wrong tile in the first slot, the rest right.
  const wrong = it.tiles.find((t) => it.extras.includes(t.t));
  SP.placeTile(it, wrong.id);
  for (const tok of it.tokens.slice(1))
    SP.placeTile(it, SP.trayTiles(it).find((t) => t.t === tok).id);
  assert.ok(SP.slotsFull(it));
  const miss = SP.checkTiles(it);
  assert.equal(miss.ok, false);
  assert.equal(it.misses, 1);
  assert.equal(it.marks[0], "no", "the extra letter is marked not in the word");
  assert.ok(
    it.locked.slice(1).every(Boolean) && !it.locked[0],
    "right places lock, the wrong one stays free",
  );
  assert.equal(SP.liftSlot(it, 1), false, "a locked place cannot be lifted");
  assert.equal(SP.liftSlot(it, 0), true);
  assert.equal(it.slots[0], null);
  assert.equal(it.marks[0], null, "a lifted place forgets its mark");
  // Retry is free: place the right first tile and finish.
  const first = SP.trayTiles(it).find((t) => t.t === it.tokens[0]);
  SP.placeTile(it, first.id);
  const ok = SP.checkTiles(it);
  assert.equal(ok.ok, true);
  assert.equal(it.done, true);
  assert.equal(SP.placeTile(it, 0), false, "a finished item no longer changes");
});

test("hints reveal one letter at a time, at most three, and never the whole word", () => {
  for (const pool of unitPools.slice(0, 20)) {
    const s = run(pool);
    for (const it of s.items) {
      let n = 0;
      while (SP.hintItem(it)) n += 1;
      assert.ok(n >= 1 && n <= 3, `${it.hw}: ${n} hints`);
      assert.ok(n < it.n || it.n <= 3, `${it.hw}: the hints do not spell the whole word`);
      if (it.mode === "type") {
        assert.equal(new Set(it.hinted).size, it.hinted.length);
        assert.ok(it.hinted.every((k) => k >= 0 && k < it.n));
      } else {
        assert.equal(it.locked.filter(Boolean).length, n);
        assert.ok(
          SP.placed(it).every((tok, k) => tok === null || tok === it.tokens[k]),
          "a hinted tile is the right one",
        );
      }
    }
  }
});

test("typed step: only the letters count, a miss gives marks and not the answer, the right word finishes", () => {
  const it = run(unitPools.find((p) => p.band === "upper-elem")).items.find(
    (i) => i.mode === "type",
  );
  it.text = "  ";
  assert.equal(SP.checkTyped(it), null, "nothing typed is not a check");
  it.text = `${it.hw.slice(0, -1)}q`;
  const miss = SP.checkTyped(it);
  assert.equal(miss.ok, false);
  assert.equal(it.misses, 1);
  assert.equal(it.marks.length, it.hw.length, "one mark for each letter tried");
  assert.equal(it.marks.at(-1), it.hw.includes("q") ? it.marks.at(-1) : "no");
  assert.equal(JSON.stringify(it.marks).includes(it.hw), false, "the marks never carry the word");
  it.text = it.hw.toUpperCase().split("").join(" ");
  assert.equal(SP.cleanTyped(it.text), it.hw, "case and spaces do not matter");
  assert.equal(SP.checkTyped(it).ok, true);
  assert.equal(it.done, true);
});

test("a definition never prints its own headword", () => {
  assert.equal(
    SP.maskWord("A memoir is a true story. Memoirs are fun.", "memoir"),
    "A ___ is a true story. ___ are fun.",
  );
  let masked = 0;
  for (const l of lessons)
    for (const w of l.words) {
      if (!SP.spellable(w.hw)) continue;
      const out = SP.maskWord(w.def, w.hw);
      assert.ok(
        !new RegExp(`\\b${w.hw}`, "i").test(out),
        `${w.hw}: the meaning does not give it away`,
      );
      if (out !== w.def) masked += 1;
    }
  assert.ok(masked >= 0);
});

test("results go through the model on the right dimension: tiles are recognition, typing is production", () => {
  const src = readFileSync(new URL("unit/spell.js", VA), "utf8");
  assert.ok(/dim = it\.mode === "type" \? "prod" : "rec"/.test(src));
  assert.ok(DIMS.includes("prod") && DIMS.includes("rec"));
  assert.ok(/env\.use\("model"\)/.test(src), "peek and hints are recorded as a model support");
  assert.ok(/recordResult\(/.test(src) && /unitWork|workOf\(/.test(src));
});

test("the screen never prints the word being spelled, or its example sentence", () => {
  const I = { S: (en) => en, T: (en) => en };
  let rendered = 0;
  for (const pool of unitPools.slice(0, 60)) {
    const state = run(pool);
    const env = {
      I,
      uid: "t",
      pool,
      sup: { picture: true, glossaryEs: true },
      pic: () => "",
      gloss: () => "",
    };
    state.items.forEach((it, i) => {
      state.i = i;
      SP.hintItem(it);
      const word = pool.byId.get(it.wordId);
      const out = toHtml(SP.spellSpec.view(state, env));
      const text = out.replace(/<[^>]*>/g, " ").replace(/\s+/g, "");
      assert.ok(
        !text.toLowerCase().includes(it.hw),
        `${pool.id}: ${it.hw} is not printed while it is being spelled`,
      );
      assert.ok(
        !new RegExp(`="[^"]*\\b${it.hw}\\b`, "i").test(out),
        `${it.hw}: not in an attribute either`,
      );
      if (word.ex)
        assert.ok(!out.includes(word.ex), `${pool.id}: the example sentence is only spoken`);
      rendered += 1;
    });
  }
  assert.ok(rendered > 200);
});

test("Joel's game rules: no countdown, no link out, no answer printed, no purple; the only timer is the peek flash", () => {
  const src = readFileSync(new URL("unit/spell.js", VA), "utf8");
  assert.ok(
    !/setInterval|countdown|timeLeft|seconds left|beat the clock/i.test(src),
    "nothing counts down",
  );
  assert.equal((src.match(/setTimeout\(/g) || []).length, 1, "one timeout: the peek hides again");
  assert.ok(/PEEK_TIMER = setTimeout/.test(src));
  assert.ok(!/href="[^"]*(games|curriculum)\/?"/.test(src), "no link back to a hub");
  const css = readFileSync(new URL("access-practice-lab/vocab-academy-spell.css", ROOT), "utf8");
  assert.ok(!/#(?:[0-9a-f]{0,2})?(?:7c3aed|8b5cf6|6d28d9|a78bfa|5b21b6)/i.test(css), "no purple");
  assert.ok(
    /prefers-reduced-motion/.test(css) &&
      /border-style: dashed/.test(css) &&
      /border-style: dotted/.test(css),
    "marks are shapes too",
  );
  const index = readFileSync(new URL("index.js", VA), "utf8");
  assert.ok(
    /"unit-activity": \[[^\]]*vocab-academy-spell\.css/.test(index),
    "the stylesheet loads on the unit-activity view",
  );
});
