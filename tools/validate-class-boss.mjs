#!/usr/bin/env node
/* =============================================================================
 * validate-class-boss.mjs — gate for the Class Boss raid.
 * -----------------------------------------------------------------------------
 *   node tools/validate-class-boss.mjs
 *
 * Asserts, with no dependencies and no network:
 *   1. Every misconception tag in data/misconception-labels.json has >= 4
 *      question templates, and the bank invents no tag the repo does not know.
 *   2. Every generated question's stated correct answer is REALLY correct. The
 *      expectations below are written from the word problem, not copied from the
 *      bank, and they only ever see the template's `values` — so a typo in the
 *      bank's arithmetic cannot agree with a typo here by construction.
 *   3. Every question's tag distractor is EXACTLY the error the tag names (the
 *      un-divided total for rate-not-per-one, the flipped pair for
 *      ratio-inverted, and so on) — not merely "a wrong number".
 *   4. No timer anywhere in the raid. Timed pressure is banned platform-wide.
 *   5. No file under curriculum/class-boss/ contains the string "ESOL".
 *
 * Exits non-zero on the first failing class of check, printing every failure.
 * ========================================================================== */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const BOSS_DIR = join(ROOT, "curriculum", "class-boss");
const MIN_TEMPLATES = 4;
// Every ISO week of a year, plus attempt salts: enough draws to surface a
// template whose numbers only collide occasionally.
const SEEDS = [];
for (let week = 1; week <= 53; week += 1) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    SEEDS.push(`2026-W${String(week).padStart(2, "0")}#${attempt}`);
  }
}

const failures = [];
const fail = (msg) => failures.push(msg);

/* --- independent math helpers (deliberately NOT imported from the bank) --- */
function g(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}
const F = (n, d) => {
  const s = d < 0 ? -1 : 1;
  const N = s * n;
  const D = s * d;
  const k = g(N, D);
  return D / k === 1 ? String(N / k) : `${N / k}/${D / k}`;
};
const R = (a, b) => `${a / g(a, b)} : ${b / g(a, b)}`;
const rd = (x, p = 4) => Math.round(x * 10 ** p) / 10 ** p;
const sum = (v) => v.reduce((s, x) => s + x, 0);

/* ---------------------------------------------------------------------------
 * Expected [correct, distractor] per template id, recomputed from `values`.
 * Read each line against the prompt in questions.js, not against its code.
 * ------------------------------------------------------------------------- */
const EXPECT = {
  // rate-not-per-one — distractor is the total, never divided by the count.
  "rate-apples": (v) => [v.total / v.n, v.total],
  "rate-drive": (v) => [v.d / v.h, v.d],
  "rate-notebooks": (v) => [v.total / v.n, v.total],
  "rate-printer": (v) => [v.p / v.m, v.p],

  // ratio-inverted — distractor is the same ratio written back to front.
  "ratio-marbles": (v) => [R(v.first, v.second), R(v.second, v.first)],
  "ratio-pets": (v) => [R(v.first, v.second), R(v.second, v.first)],
  "ratio-recipe": (v) => [R(v.first, v.second), R(v.second, v.first)],
  "ratio-class": (v) => [R(v.first, v.second), R(v.second, v.first)],

  // percent-scale-off-by-100 — distractor is the answer 100 times too big.
  "pct-plain": (v) => [(v.n * v.p) / 100, v.n * v.p],
  "pct-tax": (v) => [(v.n * v.p) / 100, v.n * v.p],
  "pct-bus": (v) => [(v.n * v.p) / 100, v.n * v.p],
  "pct-miles": (v) => [(v.n * v.p) / 100, v.n * v.p],

  // percent-used-as-whole-number — distractor adds/subtracts the percent itself.
  "pctwn-points": (v) => [v.n + (v.n * v.p) / 100, v.n + v.p],
  "pctwn-price": (v) => [v.n + (v.n * v.p) / 100, v.n + v.p],
  "pctwn-cars": (v) => [v.n - (v.n * v.p) / 100, v.n - v.p],
  "pctwn-books": (v) => [v.n + (v.n * v.p) / 100, v.n + v.p],

  // decimal-place-value — distractor keeps the digits, moves the point.
  "dec-tenths-product": (v) => [rd((v.a / 10) * (v.b / 10)), rd((v.a * v.b) / 10)],
  "dec-tenth-whole": (v) => [rd((v.a / 10) * v.b), v.a * v.b],
  "dec-div-100": (v) => [rd(v.n / 100), rd(v.n / 10)],
  "dec-times-10": (v) => [rd((v.w + v.f / 10) * 10), rd((v.w + v.f / 10) * 100)],

  // exponent-as-multiplication — distractor multiplies base by exponent.
  "exp-power": (v) => [Math.pow(v.b, v.e), v.b * v.e],
  "exp-cube": (v) => [Math.pow(v.s, 3), v.s * 3],
  "exp-square": (v) => [Math.pow(v.b, 2), v.b * 2],
  "exp-ten": (v) => [Math.pow(10, v.e), 10 * v.e],

  // fraction-added-denominators — distractor adds tops and bottoms.
  "fadd-unit": (v) => [F(1 * v.d + 1 * v.b, v.b * v.d), F(1 + 1, v.b + v.d)],
  "fadd-general": (v) => [F(v.a * v.d + v.c * v.b, v.b * v.d), F(v.a + v.c, v.b + v.d)],
  "fadd-pizza": (v) => [F(v.a * v.d + v.c * v.b, v.b * v.d), F(v.a + v.c, v.b + v.d)],
  "fadd-walk": (v) => [F(v.a * v.d + v.c * v.b, v.b * v.d), F(v.a + v.c, v.b + v.d)],

  // fraction-no-reciprocal — distractor multiplies across without flipping.
  "fdiv-plain": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],
  "fdiv-cups": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],
  "fdiv-ribbon": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],
  "fdiv-paint": (v) => [F(v.a * v.d, v.b * v.c), F(v.a * v.c, v.b * v.d)],

  // fraction-straight-across-division — distractor divides tops and bottoms
  // straight across in the direction that comes out whole (c÷a over d÷b).
  "fsa-plain": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],
  "fsa-juice": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],
  "fsa-wood": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],
  "fsa-trail": (v) => [F(v.a * v.d, v.b * v.c), F(v.c / v.a, v.d / v.b)],

  // measure-area-perimeter-swap — distractor is the other measure entirely.
  "tri-sail": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "tri-garden": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "tri-ramp": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "tri-flag": (v) => [(v.b * v.h) / 2, v.b * v.h],
  "vol-box": (v) => [v.l * v.w * v.h, v.l + v.w + v.h],
  "vol-tank": (v) => [v.l * v.w * v.h, v.l + v.w + v.h],
  "vol-locker": (v) => [v.l * v.w * v.h, v.l + v.w + v.h],
  "vol-cube": (v) => [v.s * v.s * v.s, 3 * v.s],
  "dist-sum": (v) => [v.a * (v.b + v.c), v.a * v.b + v.c],
  "dist-tickets": (v) => [v.a * (v.b + v.c), v.a * v.b + v.c],
  "dist-garden": (v) => [v.a * (v.b + v.c), v.a * v.b + v.c],
  "dist-diff": (v) => [v.a * (v.b - v.c), v.a * v.b - v.c],
  "ap-area": (v) => [v.l * v.w, 2 * v.l + 2 * v.w],
  "ap-perimeter": (v) => [2 * v.l + 2 * v.w, v.l * v.w],
  "ap-square": (v) => [v.s * v.s, 4 * v.s],
  "ap-carpet": (v) => [v.l * v.w, 2 * v.l + 2 * v.w],

  // op-added-instead-of-multiplied
  "mul-boxes": (v) => [v.a * v.b, v.a + v.b],
  "mul-rows": (v) => [v.a * v.b, v.a + v.b],
  "mul-tickets": (v) => [v.a * v.b, v.a + v.b],
  "mul-batches": (v) => [v.a * v.b, v.a + v.b],

  // op-divided-instead-of-multiplied
  "muldiv-bags": (v) => [v.a * v.b, v.a / v.b],
  "muldiv-pages": (v) => [v.a * v.b, v.a / v.b],
  "muldiv-stickers": (v) => [v.a * v.b, v.a / v.b],
  "muldiv-laps": (v) => [v.a * v.b, v.a / v.b],

  // op-multiplied-instead-of-added
  "add-collect": (v) => [v.a + v.b, v.a * v.b],
  "add-scores": (v) => [v.a + v.b, v.a * v.b],
  "add-lengths": (v) => [v.a + v.b, v.a * v.b],
  "add-money": (v) => [v.a + v.b, v.a * v.b],

  // op-multiplied-instead-of-divided
  "div-share": (v) => [v.a / v.b, v.a * v.b],
  "div-rows": (v) => [v.a / v.b, v.a * v.b],
  "div-packs": (v) => [v.a / v.b, v.a * v.b],
  "div-time": (v) => [v.a / v.b, v.a * v.b],

  // op-reversed-division — distractor divides the other way round.
  "revdiv-share": (v) => [rd(v.a / v.b), rd(v.b / v.a)],
  "revdiv-cost": (v) => [rd(v.a / v.b), rd(v.b / v.a)],
  "revdiv-teams": (v) => [rd(v.a / v.b), rd(v.b / v.a)],
  "revdiv-minutes": (v) => [rd(v.a / v.b), rd(v.b / v.a)],

  // op-reversed-subtraction — distractor subtracts the other way round.
  "revsub-height": (v) => [v.a - v.b, v.b - v.a],
  "revsub-money": (v) => [v.a - v.b, v.b - v.a],
  "revsub-points": (v) => [v.a - v.b, v.b - v.a],
  "revsub-distance": (v) => [v.a - v.b, v.b - v.a],

  // order-of-operations-left-to-right — distractor evaluates strictly L-to-R.
  "ooo-add-mult": (v) => [v.a + v.b * v.c, (v.a + v.b) * v.c],
  "ooo-sub-mult": (v) => [v.a - v.b * v.c, (v.a - v.b) * v.c],
  "ooo-add-div": (v) => [v.a + v.b / v.c, (v.a + v.b) / v.c],
  "ooo-two-products": (v) => [v.a * v.b + v.c * v.d, (v.a * v.b + v.c) * v.d],

  // sign-dropped — distractor is the right size with the minus sign lost.
  "sign-temp": (v) => [v.a - v.b, v.b - v.a],
  "sign-sub": (v) => [-v.a + v.b, v.a - v.b],
  "sign-account": (v) => [-v.a - v.b, v.a + v.b],
  "sign-product": (v) => [-1 * v.a * v.b, v.a * v.b],

  // stat-summed-instead-of-averaged — distractor is the untouched total.
  "mean-scores": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
  "mean-minutes": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
  "mean-points": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
  "mean-temps": (v) => [sum(v.vals) / v.vals.length, sum(v.vals)],
};

const same = (a, b) =>
  typeof a === "number" && typeof b === "number" ? rd(a, 6) === rd(b, 6) : String(a) === String(b);

/* --- run ----------------------------------------------------------------- */
const bank = await import(pathToFileURL(join(BOSS_DIR, "questions.js")).href);
const { QUESTION_BANK, BOSS_TAGS, buildQuestion } = bank;

const labels = JSON.parse(readFileSync(join(ROOT, "data", "misconception-labels.json"), "utf8"));
const dataTags = Object.keys(labels.tags).sort();

// 1. tag coverage
for (const tag of dataTags) {
  const templates = QUESTION_BANK[tag];
  if (!templates) {
    fail(`tag "${tag}" from data/misconception-labels.json has no questions in the bank`);
    continue;
  }
  if (templates.length < MIN_TEMPLATES) {
    fail(`tag "${tag}" has ${templates.length} templates, needs >= ${MIN_TEMPLATES}`);
  }
}
for (const tag of Object.keys(QUESTION_BANK)) {
  if (!dataTags.includes(tag)) fail(`bank invents tag "${tag}" that the repo vocabulary lacks`);
}
if (BOSS_TAGS.slice().sort().join("|") !== dataTags.join("|")) {
  fail("BOSS_TAGS does not match the tag list in data/misconception-labels.json");
}

// 2 + 3. per-question math
let questionsChecked = 0;
for (const tag of Object.keys(QUESTION_BANK)) {
  const templates = QUESTION_BANK[tag] || [];
  for (let i = 0; i < templates.length; i += 1) {
    const id = templates[i].id;
    const expect = EXPECT[id];
    if (!expect) {
      fail(`template "${id}" (${tag}) has no independent expectation in the validator`);
      continue;
    }
    for (const seed of SEEDS) {
      const q = buildQuestion(tag, i, seed);
      questionsChecked += 1;
      const where = `${tag}/${id}@${seed}`;

      const [wantCorrect, wantDistractor] = expect(q.values);
      if (!same(q.correct, wantCorrect)) {
        fail(`${where}: correct answer is ${q.correct}, independent check says ${wantCorrect}`);
      }
      if (!same(q.distractor, wantDistractor)) {
        fail(
          `${where}: distractor is ${q.distractor}, but the "${tag}" error produces ${wantDistractor}`,
        );
      }
      if (same(q.correct, q.distractor)) {
        fail(`${where}: the tag error yields the correct answer, so nothing is being taught`);
      }

      const asText = q.choices.map(String);
      if (q.choices.length !== 4) fail(`${where}: expected 4 choices, got ${q.choices.length}`);
      if (new Set(asText).size !== q.choices.length) fail(`${where}: duplicate choices`);
      if (!asText.includes(String(q.correct))) fail(`${where}: correct answer is not offered`);
      if (!asText.includes(String(q.distractor))) fail(`${where}: tag distractor is not offered`);
      for (const c of q.choices) {
        if (typeof c === "number" && !Number.isFinite(c)) fail(`${where}: non-finite choice ${c}`);
      }

      if (!q.prompt || !q.prompt.en || !q.prompt.es) fail(`${where}: prompt missing en or es`);
      else if (q.prompt.en === q.prompt.es) fail(`${where}: Spanish prompt is the English prompt`);
      else if (/\b(What is|How many|Evaluate|Write the|There are)\b/.test(q.prompt.es)) {
        fail(`${where}: Spanish prompt still contains untranslated English`);
      }

      const again = buildQuestion(tag, i, seed);
      if (JSON.stringify(again) !== JSON.stringify(q)) {
        fail(`${where}: not reproducible — two builds from one seed differ`);
      }

      const text = `${q.prompt.en} ${q.prompt.es}`;
      if (/\btimer\b|countdown|seconds left|time'?s up|cronómetro|cuenta regresiva/i.test(text)) {
        fail(`${where}: question text mentions a timer`);
      }
    }
  }
}

// 4 + 5. file-level bans
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const bossFiles = walk(BOSS_DIR);
for (const file of bossFiles) {
  const rel = file.replace(`${ROOT}/`, "");
  const src = readFileSync(file, "utf8");
  if (src.includes("ESOL")) fail(`${rel}: contains the banned string "ESOL"`);
  if (/countdown|secondsLeft|timeLeft|timeLimit|time'?s up|cuenta regresiva/i.test(src)) {
    fail(`${rel}: looks like it counts time down — timed pressure is banned`);
  }
  if (extname(file) === ".js" && /questions\.js$/.test(file)) {
    if (/setTimeout|setInterval|requestAnimationFrame|Date\.now|performance\.now/.test(src)) {
      fail(`${rel}: question bank must not touch the clock`);
    }
  }
}

/* --- report -------------------------------------------------------------- */
if (failures.length) {
  console.error("Class Boss validation FAILED:");
  for (const f of failures) console.error(`  - ${f}`);
  console.error(`${failures.length} problem(s).`);
  process.exit(1);
}

const perTag = dataTags.map((t) => QUESTION_BANK[t].length);
console.log(
  `Class Boss OK — ${dataTags.length} tags, ${bank.bankSize()} templates ` +
    `(min ${Math.min(...perTag)}/tag), ${questionsChecked} generated questions verified ` +
    `against independent math, ${bossFiles.length} files clean (no timers, no "ESOL").`,
);
