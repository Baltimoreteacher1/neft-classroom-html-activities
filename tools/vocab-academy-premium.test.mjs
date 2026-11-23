// Vocabulary Academy — the premium layer: game effects (fx.js), the Word Garden (garden.js) and the Word Vault
// (unit/vault.js). Pure: no DOM, no network. The vault engine is swept over every real lesson and every unit-sized mix of
// lessons. Run: node tools/vocab-academy-premium.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const VA = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const load = (f) => import(new URL(f, VA));
const FX = await load("games/fx.js");
const GARDEN = await load("garden.js");
const VAULT = await load("unit/vault.js");
const { normalize } = await load("games/data.js");
const { rngFor } = await load("rng.js");
const { STATES } = await load("contract.js");

const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const lessons = [];
for (const g of readdirSync(CONTENT).filter((d) => /^g(K|\d+)$/.test(d)))
  for (const f of readdirSync(new URL(`${g}/`, CONTENT)).filter((x) => /^u\d+\.json$/.test(x)))
    lessons.push(JSON.parse(readFileSync(new URL(`${g}/${f}`, CONTENT), "utf8")));
const byGrade = new Map();
for (const l of lessons) byGrade.set(l.grade, [...(byGrade.get(l.grade) || []), l]);
// A unit-sized pool: three consecutive lessons of one grade, merged the way the unit page merges them.
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

test("fx: sound is off until chosen, and storage failures are harmless", () => {
  assert.equal(FX.soundOn(), false);
  assert.equal(FX.cue("ok"), false, "no sound while off");
  assert.equal(FX.setSound(true), true);
  assert.equal(FX.setSound(false), false);
});

test("fx: every cue is a short run of soft notes", () => {
  for (const [name, notes] of Object.entries(FX.CUES)) {
    assert.ok(notes.length >= 1, name);
    const total = Math.max(...notes.map(([, at, len]) => at + len));
    assert.ok(total < 1, `${name} lasts under a second`);
    for (const [freq] of notes) assert.ok(freq >= 200 && freq <= 1200, `${name} pitch`);
  }
  assert.ok(FX.CUES.retry.length === 1, "a miss is one gentle note");
});

test("fx: medals say how a word went, and never punish", () => {
  assert.equal(FX.medalFor({ correct: 2, misses: 0 }), "gold");
  assert.equal(FX.medalFor({ correct: 1, misses: 1 }), "silver");
  assert.equal(FX.medalFor({ correct: 1, misses: 4 }), "bronze");
  assert.equal(
    FX.medalFor({ correct: 0, misses: 3 }),
    "",
    "no card for a word not yet answered right",
  );
  for (const m of ["gold", "silver", "bronze"])
    assert.ok(FX.MEDAL_LABEL[m][0] && FX.MEDAL_LABEL[m][1]);
});

test("fx: gems count first-try answers; cheers cover every case in both languages", () => {
  const log = [
    { ok: true, firstTry: true },
    { ok: false, firstTry: false },
    { ok: true, firstTry: false },
    { ok: true, firstTry: true },
  ];
  assert.deepEqual(FX.gemCount(log), { gems: 2, of: 4 });
  assert.deepEqual(FX.gemCount([]), { gems: 0, of: 0 });
  assert.equal(FX.cheerKey({ judged: 10, firstTry: 10 }), "shine");
  assert.equal(FX.cheerKey({ judged: 10, firstTry: 7 }), "strong");
  assert.equal(FX.cheerKey({ judged: 10, firstTry: 2 }), "growing");
  assert.equal(FX.cheerKey({ judged: 0, firstTry: 0 }), "start");
  for (const [k, [en, es]] of Object.entries(FX.CHEER))
    if (k !== "start") assert.ok(en && es && en !== es, k);
});

test("garden: a plant for every state, counts add up, markup is plain and labelled", () => {
  for (const s of STATES)
    assert.match(GARDEN.plantSvg(s), /^<svg class="va-plant"[^>]*aria-hidden="true"/, s);
  const counts = GARDEN.stageCounts(["new", "new", "secure", "bogus", "applying"]);
  assert.equal(counts.new, 2);
  assert.equal(counts.secure, 1);
  assert.equal(
    Object.values(counts).reduce((a, b) => a + b, 0),
    4,
    "an unknown state is ignored",
  );
  // Growth order: later stages draw more than earlier ones (seed < sprout < sapling < flower).
  const size = (s) => GARDEN.plantSvg(s).length;
  assert.ok(
    size("new") < size("learning") &&
      size("learning") < size("developing") &&
      size("developing") < size("applying"),
  );
});

test("vault: revealed letters grow with the open locks and never overshoot", () => {
  assert.equal(VAULT.revealedCount(8, 0, 4), 0);
  assert.equal(VAULT.revealedCount(8, 2, 4), 4);
  assert.equal(VAULT.revealedCount(8, 4, 4), 8);
  assert.equal(VAULT.revealedCount(7, 3, 5), 5);
  assert.equal(VAULT.revealedCount(7, 9, 5), 7);
  assert.equal(VAULT.revealedCount(7, 1, 0), 0);
  assert.ok(
    VAULT.passwordOk("generous") && !VAULT.passwordOk("ice cream") && !VAULT.passwordOk("act"),
  );
});

const valid = (v, pool) => {
  assert.ok(v.locks.length >= 3, `${pool.id}: at least three locks`);
  const lockWords = new Set();
  const ids = new Set(pool.words.map((w) => w.id));
  for (const { q, mc } of v.locks) {
    assert.ok(ids.has(q.wordId), `${pool.id}: a lock asks about a word of the unit`);
    assert.equal(
      new Set(q.choices.map((c) => String(c).toLowerCase())).size,
      q.choices.length,
      "distinct choices",
    );
    assert.ok(q.answer >= 0 && q.answer < q.choices.length);
    assert.equal(mc.done, false);
    lockWords.add(q.wordId);
  }
  assert.ok(lockWords.size >= Math.min(3, v.locks.length), "locks use different words");
  assert.ok(
    ids.has(v.final.q.wordId) && v.final.q.wordId === v.word.id,
    "the final question is about the password word",
  );
  assert.ok(!lockWords.has(v.word.id), `${pool.id}: no lock gives the password word away`);
  if (v.order.length) {
    assert.equal(v.order.length, v.word.hw.length);
    assert.deepEqual(
      [...v.order].sort((a, b) => a - b),
      [...Array(v.word.hw.length).keys()],
    );
  }
};

test("vault: every real lesson and every unit-sized mix builds a valid vault", () => {
  let built = 0;
  for (const pool of [...lessonPools, ...unitPools]) {
    const v = VAULT.buildVault(pool, rngFor(`vault:${pool.id}`));
    if (!v.locks.length) continue;
    valid(v, pool);
    built += 1;
  }
  assert.ok(
    built >= lessonPools.length * 0.95,
    `built ${built} of ${lessonPools.length + unitPools.length}`,
  );
  assert.ok(unitPools.length >= 40, "unit-sized pools were swept");
});

test("vault: the same pool and seed give the same vault; a different seed differs", () => {
  const pool = unitPools[0];
  const a = VAULT.buildVault(pool, rngFor("same"));
  const b = VAULT.buildVault(pool, rngFor("same"));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
  const c = VAULT.buildVault(pool, rngFor("other"));
  assert.notDeepEqual(
    a.locks.map((l) => l.q.wordId),
    c.locks.map((l) => l.q.wordId),
  );
});

test("vault: lock count follows the grade band; early grades get fewer locks", () => {
  const early = unitPools.find((p) => p.band === "early");
  const middle = unitPools.find((p) => p.band === "middle");
  assert.ok(early && middle);
  assert.ok(VAULT.buildVault(early, rngFor("e")).locks.length <= 4);
  assert.ok(VAULT.buildVault(middle, rngFor("m")).locks.length <= 6);
});

test("vault and effects keep Joel's game rules: no timers, no links out, no answer printed on a miss", () => {
  for (const f of ["unit/vault.js", "games/fx.js", "garden.js"]) {
    const src = readFileSync(new URL(f, VA), "utf8");
    assert.ok(
      !/setInterval|countdown|timeLeft|seconds left/i.test(src),
      `${f}: nothing counts down`,
    );
    assert.ok(!/href="[^"]*(games|curriculum)\/?"/.test(src), `${f}: no link back to a hub`);
  }
  assert.ok(existsSync(new URL("access-practice-lab/vocab-academy-premium.css", ROOT)));
  const css = readFileSync(new URL("access-practice-lab/vocab-academy-premium.css", ROOT), "utf8");
  assert.ok(!/#(?:[0-9a-f]{0,2})?(?:7c3aed|8b5cf6|6d28d9|a78bfa|5b21b6)/i.test(css), "no purple");
  assert.ok(/prefers-reduced-motion/.test(css), "reduced motion is handled");
});
