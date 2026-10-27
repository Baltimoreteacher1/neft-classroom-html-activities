// Math suite for Fraction Kitchen (game 3, partition-and-pour). Every expected value comes from an oracle written in
// this file (integer fractions; brute force over every cut / mark / scoop combination), never from the game's own
// generator or checker. @fm2 FM-009 FM-017 FM-019 FM-020 FM-032 FM-033 FM-050 FM-051 FM-052 FM-053 FM-054 FM-055
// @fm2 FM-057 FM-059 FM-060 FM-061 FM-062 FM-063 FM-065
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as art from "../../math/fluency-lab/family/fm2/art/fractions.js";
import { validateGame } from "../../math/fluency-lab/family/fm2/contract.js";
import game from "../../math/fluency-lab/family/fm2/games/fraction-kitchen/index.js";
import { makeRng, seedFrom } from "../../math/fluency-lab/family/fm2/rng.js";

let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks += 1;
};

// ---- independent fraction oracle (integers only) --------------------------------------------------------
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
const F = (n, d = 1) => {
  const g = gcd(n, d) * (d < 0 ? -1 : 1);
  return { n: n / g, d: d / g };
};
const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a, b) => F(a.n * b.n, a.d * b.d);
const div = (a, b) => F(a.n * b.d, a.d * b.n);
const cmp = (a, b) => Math.sign(a.n * b.d - b.n * a.d);
const eq = (a, b) => cmp(a, b) === 0;
const sum = (list, start = F(0)) => list.reduce((s, x) => add(s, x), start);
const str = (a) => (a.d === 1 ? String(a.n) : `${a.n}/${a.d}`);
const mixed = (a) =>
  a.d === 1 || Math.abs(a.n) < a.d
    ? str(a)
    : `${Math.trunc(a.n / a.d)} ${Math.abs(a.n) % a.d}/${a.d}`;
const decimal = (a) => {
  const places = [0, 1, 2, 3, 4, 5, 6].find((p) => Number.isInteger((a.n * 10 ** p) / a.d));
  return places === undefined ? null : (a.n / a.d).toFixed(places);
};
const isFrac = (x) => x && typeof x === "object" && Number.isInteger(x.n) && Number.isInteger(x.d);
const wordIn = (text, token) => {
  const safe = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\w/.,])${safe}(?![\\w/.])`).test(text);
};
const walk = (value, visit, key = "") => {
  if (isFrac(value)) visit(value, key);
  else if (Array.isArray(value)) for (const item of value) walk(item, visit, key);
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) if (k !== "prompt") walk(v, visit, k);
};
// repeating decimals by a separate algorithm: strip 2s and 5s for the lead, find the order of 10 for the period
function decimalShape(a) {
  let rest = a.d;
  let [twos, fives, period] = [0, 0, 0];
  while (rest % 2 === 0) [rest, twos] = [rest / 2, twos + 1];
  while (rest % 5 === 0) [rest, fives] = [rest / 5, fives + 1];
  const lead = Math.max(twos, fives);
  if (rest > 1)
    for (let p = 1, power = 10 % rest; !period; p += 1, power = (power * 10) % rest)
      if (power === 1) period = p;
  const digits = [];
  for (let i = 0, r = a.n % a.d; i < lead + period; i += 1, r %= a.d)
    digits.push(Math.floor((r *= 10) / a.d));
  return { lead: digits.slice(0, lead).join(""), rep: digits.slice(lead).join("") };
}
const repeatValue = (lead, block) =>
  F(Number(lead + block) - (lead ? Number(lead) : 0), 10 ** lead.length * (10 ** block.length - 1));
const sciValue = ({ m, e }) => {
  const [whole, frac = ""] = m.split(".");
  const power = e - frac.length;
  return power >= 0 ? F(Number(whole + frac) * 10 ** power) : F(Number(whole + frac), 10 ** -power);
};
// biome-ignore format: four constants, 9 digits each
const CONSTANTS = { pi: F(314159265, 1e8), sqrt2: F(141421356, 1e8), sqrt3: F(173205081, 1e8), e: F(271828183, 1e8) };

// ---- declared limits ------------------------------------------------------------------------------------
const MAX_DEN = { 0: 4, 1: 4, 2: 4, 3: 8, 4: 12, 5: 12, 6: 12, 7: 12, 8: 12 }; // operand denominators by grade
const MAX_VALUE = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 12, 5: 12, 6: 12, 7: 12, 8: 12 };
const SEEDS = 40;
const roundOf = (skill, level, grade, seed) => {
  const rng = makeRng(seedFrom("fk-test", skill.id, level, grade, seed));
  return game.makeRound(skill.id, level, rng, grade);
};
const skillOf = (id) => game.skills.find((s) => s.id === id);

// ---- 1. contract and inventory --------------------------------------------------------------------------
ok(validateGame(game).length === 0, `validateGame: ${validateGame(game)}`);
ok(game.id === "fraction-kitchen" && game.order === 3, "id and order");
ok(game.mechanic === "partition-and-pour" && !/quiz|multiple/i.test(game.mechanic), "mechanic tag");
ok(game.skills.length >= 14, `at least 14 skills (${game.skills.length})`);
for (let g = 0; g <= 8; g += 1) {
  const covering = game.skills.filter((s) => s.grades[0] <= g && g <= s.grades[1]);
  ok(covering.length >= 2, `grade ${g} has at least 2 skills`);
}
for (const s of game.skills) ok(/^(K|\d)\.[A-Z]+\.[A-Z](\.\d+)?(\.[a-z])?$/.test(s.standard), s.id);
ok(game.howTo.en.length >= 3 && game.howTo.es.length === game.howTo.en.length, "howTo steps");
ok(game.together.en !== game.together.es && game.cssHref.endsWith("/game.css"), "together, css");

// ---- 2. rounds: ranges, targets, prompts, variety, difficulty -----------------------------------------------
const OPERANDS = ["ref", "base", "factor", "amount", "size", "of", "start"];
const HIDDEN = [
  "percent-amount",
  "pour-spill",
  "batch-recipe",
  "unlike-bars",
  "part-of-part",
  "sci-measures",
];
function oracleTarget(r) {
  switch (r.skillId) {
    case "fair-shares":
      return F(r.serveCount, r.friends);
    case "serve-parts":
      return F(r.ask[0], r.ask[1]);
    case "percent-amount":
      return mul(F(r.percent, 100), r.of);
    case "pour-spill":
      return sum(r.moves, r.start);
    case "batch-recipe":
      return mul(F(r.batches), r.amount);
    case "unlike-bars":
      return r.op === "diff" ? sub(r.terms[0], r.terms[1]) : sum(r.terms);
    case "part-of-part":
      return mul(r.base, r.factor);
    case "divide-unit":
      return r.kind === "serving" ? div(r.amount, r.size) : mul(r.base, F(1, r.friends));
    case "divide-fractions":
      return div(r.amount, r.size);
    case "sci-measures":
      return sum(r.terms.map(sciValue));
    case "fix-the-cuts":
      return F(1, r.friends);
    case "pizza-equiv":
    case "compare-pieces":
      return r.ref;
    case "rational-approx":
      return null;
    default:
      return r.target;
  }
}
const isHidden = (r) =>
  HIDDEN.includes(r.skillId) || (r.skillId === "divide-unit" && r.kind === "area");
const givens = (r) =>
  [...OPERANDS.map((k) => r[k]), ...(r.terms ?? []), ...(r.moves ?? [])].filter(isFrac);
const fingerprints = new Map();
const demand = new Map();
const negatives = { spill: 0, other: 0 };
const allRounds = [];

// A declared difficulty proxy: operand size, how many fractions are non-unit, and the representation demands
function difficulty(round) {
  let [maxDen, count, nonUnit] = [1, 0, 0];
  walk(round, (f, key) => {
    if (key === "value" || key === "startCuts") return;
    [maxDen, count, nonUnit] = [
      Math.max(maxDen, f.d),
      count + 1,
      nonUnit + (Math.abs(f.n) > 1 ? 1 : 0),
    ];
  });
  const mode = { sameDen: 0, sameNum: 2, den: 5 }[round.mode] ?? 0;
  // biome-ignore format: one demand per line
  const extras = [
    round.friends, (round.serveCount ?? 0) / 2, (round.batches ?? 0) / 2, round.ask?.[1], (round.ask?.[0] ?? 0) / 2,
    (round.den ?? 0) / 2, round.terms?.length, round.moves?.length, round.startCuts?.length, mode,
    round.wholes > 1 ? 2 : 0, round.blind ? 2 : 0, round.minKinds > 1 || round.single ? 2 : 0,
    round.mode === "dec" ? round.places.length * 2 : 0, round.target?.n > round.target?.d ? 2 : 0,
  ];
  return maxDen + count / 2 + nonUnit * 2 + extras.reduce((a, b) => a + (b || 0), 0);
}
function inspect(skill, grade, level, seed, round) {
  assert.deepEqual(JSON.parse(JSON.stringify(round)), round, `JSON round ${skill.id}`);
  assert.deepEqual(roundOf(skill, level, grade, seed), round, "rounds are pure in the seed");
  const { en, es } = round.prompt;
  ok(round.skillId === skill.id && round.level === level && round.grade === grade, "coordinates");
  ok(en.length > 20 && es.length > 20 && en !== es, `prompts in both languages: ${en}`);
  ok(!/undefined|NaN|\{\w+\}|\[object/.test(`${en} ${es}`), `template debris: ${en}`);
  walk(round, (f, key) => {
    if (["startCuts", "value", "tol"].includes(key) || (round.kind === "place" && key === "target"))
      return;
    ok(f.d <= MAX_DEN[grade], `${skill.id} g${grade}: denominator ${f.d} too large (${key})`);
    ok(Math.abs(f.n) <= f.d * MAX_VALUE[grade], `${skill.id} g${grade}: ${str(f)} too large`);
    if (f.n < 0) negatives[skill.id === "pour-spill" ? "spill" : "other"] += 1;
  });
  if (round.kind === "place")
    ok(round.target.d <= 1000 && grade >= 4, "decimals only from grade 4");
  if (grade <= 2) ok((round.friends ?? 4) <= 4 && round.wholes === 1, "early grades stay small");
  const target = oracleTarget(round);
  if (target && round.target) ok(eq(round.target, target), `${skill.id}: target vs oracle`);
  if (round.kind === "serving") ok(target.d === 1 && target.n >= 2, "whole-number quotient");
  if (round.op === "share") ok(eq(round.factor, F(1, round.friends)), "share factor is 1/friends");
  for (const key of OPERANDS) {
    const x = round[key];
    if (!isFrac(x) || (key === "start" && (round.skill !== "net" || x.n === 0))) continue;
    if (key === "of" && x.d === 1 && x.n === 1) continue;
    const texts = [
      str(x),
      mixed(x),
      ...(round.refAsk && key === "ref" ? [round.refAsk.join("/")] : []),
    ];
    for (const prompt of [en, es]) {
      ok(
        texts.some((t) => prompt.includes(t)) || (key === "factor" && round.op === "share"),
        `prints ${key}`,
      );
    }
  }
  if (isHidden(round) && target) {
    const known = new Set(
      givens(round).flatMap((x) => [str(x), mixed(x), mixed(F(Math.abs(x.n), x.d))]),
    );
    const stripped = [...known]
      .sort((a, b) => b.length - a.length)
      .reduce((t, k) => t.replaceAll(k, " "), en);
    for (const form of [str(target), mixed(target), decimal(target)]) {
      if (form && !/^\d+$/.test(form) && !known.has(form))
        ok(!wordIn(stripped, form), `hidden ${form}: ${en}`);
    }
  }
  if (skill.id === "pour-spill")
    ok(round.moves.length === level && eq(round.target, target), "net change");
  if (skill.id === "percent-amount") ok(en.includes(`${round.percent}%`), "percent in the prompt");
  const key = JSON.stringify({ ...round, prompt: 0 });
  (fingerprints.get(skill.id) ?? fingerprints.set(skill.id, new Set()).get(skill.id)).add(key);
  const slot0 = `${skill.id}|${grade}|${level}`;
  demand.set(slot0, [...(demand.get(slot0) ?? []), difficulty(round)]);
}
for (const skill of game.skills) {
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    for (let level = 1; level <= 3; level += 1) {
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const round = roundOf(skill, level, grade, seed);
        allRounds.push([skill, grade, level, seed, round]);
        inspect(skill, grade, level, seed, round);
      }
    }
  }
}
ok(
  negatives.other === 0 && negatives.spill > 40,
  `FM-055 negatives only in pour-spill: ${JSON.stringify(negatives)}`,
);
for (const skill of game.skills) {
  for (let grade = skill.grades[0]; grade <= skill.grades[1]; grade += 1) {
    const mean = (level) =>
      demand.get(`${skill.id}|${grade}|${level}`).reduce((a, b) => a + b, 0) / SEEDS;
    ok(mean(3) > mean(1), `FM-019 ${skill.id} g${grade}: L3 ${mean(3)} > L1 ${mean(1)}`);
    ok(mean(3) >= mean(2) - 0.01, `${skill.id} g${grade}: L3 ${mean(3)} >= L2 ${mean(2)}`);
  }
  const prints = new Set(fingerprints.get(skill.id));
  for (let seed = SEEDS; seed < 100; seed += 1) {
    for (const grade of skill.grades) {
      for (const level of [1, 2, 3])
        prints.add(JSON.stringify({ ...roundOf(skill, level, grade, seed), prompt: 0 }));
    }
  }
  ok(prints.size >= 30, `FM-061 ${skill.id}: ${prints.size} distinct rounds across 100 seeds`);
}

// ---- 3. brute-force oracles for every kind of response ---------------------------------------------------
const cutsOf = (n) => Array.from({ length: n - 1 }, (_, i) => ({ n: i + 1, d: n })); // unreduced on purpose
const range = (n) => Array.from({ length: n }, (_, i) => i);
const shapeResp = (n, served, wholes = 1) => ({
  cuts: cutsOf(n),
  served: range(n * wholes).map((i) => served.has(i)),
});
const first = (k) => new Set(range(k));
function shapeOracle(r, n, served) {
  const k = served.size;
  const value = F(k, n);
  const sides = { more: 1, less: -1 };
  switch (r.kind) {
    case "fair":
      return n === r.friends && k === r.serveCount;
    case "fix":
      return n === r.friends;
    case "serve":
      return k > 0 && (!r.den || n === r.den) && eq(value, F(r.ask[0], r.ask[1]));
    case "equiv":
      return k > 0 && eq(value, r.ref) && (!r.den || n === r.den) && n !== r.ref.d;
    case "compare": {
      const wrong = k === 0 || (r.den && n !== r.den) || (r.num && k !== r.num);
      return !wrong && cmp(value, r.ref) === sides[r.relation];
    }
    default: {
      const target = mul(r.base, r.op === "of" ? r.factor : F(1, r.friends));
      const inside = [...served].every((i) => cmp(F((i % n) + 1, n), r.base) <= 0);
      return k > 0 && inside && eq(value, target);
    }
  }
}
function measureOracle(r, ticks, steps, verdict) {
  const level = F(steps, ticks);
  if (!r.irr) return eq(level, oracleTarget(r));
  const gap = sub(level, CONSTANTS[r.irr.id]);
  return cmp(F(Math.abs(gap.n), gap.d), r.irr.tol) <= 0 && verdict === "close";
}
function fillOracle(r, scoops) {
  if (!scoops.length || !scoops.every((s) => r.scoops.some((a) => eq(a, s)))) return false;
  const kinds = new Set(scoops.map(str)).size;
  return eq(sum(scoops), oracleTarget(r)) && (!r.single || kinds === 1) && kinds >= r.minKinds;
}
function placeOracle(r, p) {
  const target = oracleTarget(r);
  const { rep } = decimalShape(target);
  if (r.mode === "repeat" && rep) return p.never === true && p.block === rep;
  const [o, t, h, th] = p.digits;
  return !p.never && o * 1000 + t * 100 + h * 10 + th === (target.n * 1000) / target.d;
}
const seen = new Map();
const note = (round, result) => {
  const set = seen.get(round.skillId) ?? seen.set(round.skillId, new Map()).get(round.skillId);
  set.set(result.mistake, result);
};
function agree(round, response, expected, label) {
  const result = game.check(round, response);
  const where = `${round.skillId} L${round.level} g${round.grade} ${label}: ${round.prompt.en}`;
  ok(result.correct === expected, `${where} -> expected ${expected}, got ${result.mistake}`);
  if (expected) return;
  const { en, es } = result.feedback;
  ok(result.mistake && en.length > 12 && es.length > 12 && en !== es, `named feedback: ${where}`);
  ok(!/undefined|NaN|\{\w+\}/.test(`${en} ${es}`), `feedback debris: ${en}`);
  note(round, result);
}
const SHAPES = ["fair", "fix", "serve", "equiv", "compare", "area"];
const picked = (resp) => new Set(resp.served.flatMap((on, i) => (on ? [i] : [])));
function accepts(r, resp) {
  if (SHAPES.includes(r.kind)) return shapeOracle(r, resp.cuts.length + 1, picked(resp));
  if (r.kind === "cup" || r.kind === "line")
    return measureOracle(r, resp.ticks, resp.steps, resp.verdict);
  if (r.kind === "fill")
    return fillOracle(
      r,
      resp.scoops.map((s) => F(s.n, s.d)),
    );
  if (r.kind === "serving") return eq(mul(F(resp.servings), r.size), r.amount);
  return placeOracle(r, resp);
}
// every response worth trying for a round: all cuts, all marks, scoop mixes, place-value digits, servings
function* cases(r, seed) {
  if (SHAPES.includes(r.kind)) {
    for (let n = 1; n <= 12; n += 1) {
      for (let k = 0; k <= n * r.wholes; k += 1) {
        yield [shapeResp(n, first(k), r.wholes), `n=${n} k=${k}`];
        if (r.kind === "area" && k > 0 && k <= n) {
          yield [
            shapeResp(n, new Set(range(k).map((i) => n - 1 - i)), r.wholes),
            `last ${k} of ${n}`,
          ];
        }
      }
    }
  } else if (r.kind === "cup" || r.kind === "line") {
    for (const ticks of r.ticksOptions) {
      for (let steps = r.lo * ticks; steps <= r.hi * ticks; steps += 1) {
        for (const verdict of r.irr ? ["close", "equal", null] : [null]) {
          yield [{ ticks, steps, verdict }, `${steps}/${ticks}`];
        }
      }
    }
  } else if (r.kind === "fill") {
    for (const a of r.scoops) {
      for (let count = 0; count <= 24; count += 1)
        yield [{ scoops: Array(count).fill(a) }, `${count} x ${str(a)}`];
    }
    for (let i = 0; i < r.scoops.length && seed < 3; i += 1) {
      for (const b of r.scoops.slice(i + 1)) {
        for (let x = 1; x <= 12; x += 1) {
          for (let y = 1; x + y <= 24; y += 1) {
            yield [
              { scoops: [...Array(x).fill(r.scoops[i]), ...Array(y).fill(b)] },
              `${x}+${y} of ${str(b)}`,
            ];
          }
        }
      }
    }
  } else if (r.kind === "serving") {
    for (let k = 0; k <= 30; k += 1) yield [{ servings: k }, `${k} servings`];
  } else {
    const combos = r.places.length <= 3 || seed < 2 ? 10 ** r.places.length : 0;
    for (let i = 0; i < combos; i += 1) {
      const digits = [0, 0, 0, 0];
      r.places.forEach((p, at) => {
        digits[p] = Math.floor(i / 10 ** at) % 10;
      });
      for (const never of r.mode === "repeat" ? [false, true] : [false])
        yield [{ digits, never }, `${digits}`];
    }
    for (const block of r.blocks ?? [])
      yield [{ digits: [0, 0, 0, 0], never: true, block }, `block ${block}`];
  }
}
const GRIDS = [
  [6, 7],
  [4, 5],
  [3, 8],
  [2, 6, 9],
  [1, 5, 10],
  [3, 4, 8],
  [2, 3, 7, 11],
];
for (const [skill, , , seed, round] of allRounds) {
  const solved = game.solve(round);
  const result = game.check(round, solved);
  ok(
    result.correct && result.feedback.en && result.feedback.es,
    `solve() accepted: ${skill.id} ${seed}`,
  );
  ok(accepts(round, solved), `${skill.id}: solve() agrees with the oracle`);
  if (seed >= 8) continue;
  for (const [response, label] of cases(round, seed))
    agree(round, response, accepts(round, response), label);
  if (SHAPES.includes(round.kind)) {
    for (const grid of GRIDS) {
      const widths = [grid[0], ...grid.slice(1).map((g, i) => g - grid[i]), 12 - grid.at(-1)];
      if (widths.every((w) => w === widths[0])) continue;
      const cuts = grid.map((g) => ({ n: g, d: 12 }));
      const r = game.check(round, { cuts, served: Array(grid.length + 1).fill(true) });
      ok(!r.correct && r.mistake === "unequal", "unequal parts are never accepted");
      ok(
        /equal-sized/.test(r.feedback.en) && /mismo tamaño/.test(r.feedback.es),
        "FM-063 unequal named",
      );
    }
  }
  if (round.mode === "repeat") {
    const { lead, rep } = decimalShape(round.target);
    ok(round.blocks.includes(rep || round.blocks[0]), "block choices include the true block");
    ok(new Set(round.blocks).size === round.blocks.length, "block choices are distinct");
    for (const block of round.blocks) {
      if (rep && block !== rep)
        ok(!eq(repeatValue(lead, block), round.target), "decoy is different");
    }
  }
  if (round.kind === "fill") {
    const target = oracleTarget(round);
    ok(
      round.scoops.some((s) => (target.n * s.d) % target.d === 0),
      "a scoop measures the target",
    );
  }
}

// ---- 4. every catalogued mistake gets its own specific feedback -------------------------------------------
// biome-ignore format: one regex pair per line reads as a table
const WORDS = {
  malformed: [/not set up right/, /no está bien armado/],
  unequal: [/equal-sized/, /mismo tamaño/],
  noneServed: [/Nothing is served/, /no has servido nada/],
  wrongParts: [/equal parts/, /partes iguales/],
  wrongServed: [/asks you to serve/, /Serviste/],
  wrongCount: [/order says to serve exactly/, /pedido dice servir exactamente/],
  wrongDenom: [/order says to use|order asks for/, /pedido dice usar|pedido pide/],
  partsMismatch: [/bottom number of a fraction/, /número de abajo de una fracción/],
  tooMuch: [/more than/, /más (de|que)/],
  tooLittle: [/less than/, /menos (de|que)/],
  additive: [/added to the top and the bottom/, /sumó el mismo número arriba y abajo/],
  sameCut: [/same cut/, /mismo corte/],
  equalToRef: [/equal to the amount to beat/, /igual a la cantidad de comparación/],
  wrongSide: [/is (more|less) than the reference/, /es (mayor|menor) que la de comparación/],
  biggerBottom: [/smaller.*less, not more/, /más pequeñas da menos/],
  smallerBottom: [/bigger.*more, not less/, /más grandes da más/],
  outside: [/outside the dashed line/, /fuera de la línea de rayas/],
  tookAll: [/all of the leftover/, /todo lo que sobra/],
  ofWhole: [/part of the leftover, not a part of the whole/, /parte de lo que sobra, no una parte del entero/],
  forgotLeftover: [/of the leftover, not of the whole/, /de lo que sobra, no del entero/],
  wrongMarks: [/falls between two marks/, /queda entre dos marcas/],
  countedMarks: [/counted -?\d+ marks/, /Contaste -?\d+ marcas/],
  signFlip: [/spill was counted as a pour/, /derrame se contó como si fuera echar/],
  forgotStart: [/did not start at 0/, /no empezó en 0/],
  ignoredAmount: [/out of 100 of ONE whole/, /de cada 100 de UN entero/],
  saysEqual: [/No fraction is exactly/, /Ninguna fracción es exactamente/],
  needVerdict: [/is your fraction exactly/, /es exactamente/],
  tooFar: [/not close enough/, /no está lo bastante cerca/],
  mixedSizes: [/only one size of scoop/, /un solo tamaño de cucharón/],
  empty: [/pitcher is empty/, /jarra está vacía/],
  topBottom: [/tops were added/, /sumaron los números de arriba/],
  oneBatch: [/only one batch/, /solo una tanda/],
  wholeOnly: [/only the whole cups/, /solo las tazas enteras/],
  fractionOnly: [/only the fraction part/, /solo la parte de la fracción/],
  needTwoKinds: [/at least two kinds of scoop/, /al menos dos tipos de cucharón/],
  stoppedEarly: [/still .* in the pitcher/, /Todavía quedan/],
  placeShift: [/one place off/, /un lugar corrido/],
  digitsSwapped: [/right digits are in the wrong places/, /dígitos correctos están en lugares/],
  overfill: [/more than the order/, /más que el pedido/],
  underfill: [/less than the order/, /menos que el pedido/],
  claimedExact: [/always left over/, /siempre sobra un poquito/],
  needBlock: [/Choose which digits repeat/, /Elige qué dígitos/],
  wrongBlock: [/do not repeat forever/, /no se repiten para siempre/],
  claimedNever: [/can be filled exactly/, /sí se puede llenar con exactitud/],
};
const wordsOk = (key, feedback) =>
  WORDS[key]?.[0].test(feedback.en) && WORDS[key][1].test(feedback.es);
for (const [id, keys] of seen) {
  for (const [key, result] of keys)
    ok(wordsOk(key, result.feedback), `${id}: ${key} text: ${result.feedback.en}`);
}
const by = (id, level, grade, pred) => {
  for (let seed = 0; seed < 600; seed += 1) {
    const round = roundOf(skillOf(id), level, grade, 1000 + seed);
    if (pred(round)) return round;
  }
  throw new Error(`no round for ${id}`);
};
const expectMistake = (round, response, key) => {
  const result = game.check(round, response);
  ok(
    !result.correct && result.mistake === key,
    `${round.skillId}: wanted ${key}, got ${result.mistake}`,
  );
  ok(
    wordsOk(key, result.feedback),
    `${key} names the mistake: ${result.feedback.en} | ${result.feedback.es}`,
  );
  note(round, result);
};
// biome-ignore format: dense, one catalogued mistake per line
function targeted() {
  const sh = shapeResp;
  const digitsResp = (digits) => ({ digits, never: false, block: null });
  const fair = by("fair-shares", 1, 1, (r) => r.friends === 4 && r.serveCount === 1);
  expectMistake(fair, sh(3, first(1)), "wrongParts");
  expectMistake(fair, sh(4, first(3)), "wrongServed");
  expectMistake(fair, sh(4, first(0)), "noneServed");
  const serve = by("serve-parts", 2, 3, (r) => r.ask[1] >= 6 && !r.den && r.ask[0] >= 2);
  const [a, b] = serve.ask;
  expectMistake(serve, sh(b, first(a + 1)), "tooMuch");
  expectMistake(serve, sh(b, first(a - 1)), "tooLittle");
  expectMistake(serve, sh(b - 1, first(a)), "partsMismatch");
  const den = by("serve-parts", 3, 3, (r) => r.den && r.ask[1] >= 4);
  expectMistake(den, sh(den.den - 1, first(den.ask[0])), "wrongDenom");
  const equiv = by("pizza-equiv", 1, 3, (r) => r.ref.d === 3 && r.ref.n === 2);
  expectMistake(equiv, sh(3, first(2)), "sameCut");
  expectMistake(equiv, sh(4, first(3)), "additive");
  const sameNum = by("compare-pieces", 2, 3, (r) => r.mode === "sameNum" && r.relation === "more" && r.ref.d < 8);
  expectMistake(sameNum, sh(sameNum.ref.d + 2, first(sameNum.num)), "biggerBottom");
  const sameDen = by("compare-pieces", 1, 3, (r) => r.mode === "sameDen" && r.relation === "more" && r.refAsk[0] > 1);
  expectMistake(sameDen, sh(sameDen.den, first(1)), "wrongSide");
  expectMistake(sameDen, sh(sameDen.den, first(sameDen.refAsk[0])), "equalToRef");
  const area = by("part-of-part", 2, 5, (r) => r.base.d === 3 && r.factor.d === 2 && r.factor.n === 1);
  expectMistake(area, sh(6, new Set([0, 1, 2, 3, 4])), "outside");
  const share = by("divide-unit", 2, 5, (r) => r.kind === "area" && r.friends === 3 && r.base.d === 2);
  expectMistake(share, sh(3, first(1)), "forgotLeftover");
  const cup = by("pour-cup", 2, 3, (r) => r.ticksOptions.some((m) => m % r.target.d));
  expectMistake(cup, { ticks: cup.ticksOptions.find((m) => m % cup.target.d), steps: 1 }, "wrongMarks");
  const alt = (r, m) => m !== r.target.d && (m * r.target.n) % r.target.d === 0;
  const counted = by("pour-cup", 3, 3, (r) => r.target.n > 1 && r.ticksOptions.some((m) => alt(r, m)));
  expectMistake(counted, { ticks: counted.ticksOptions.find((m) => alt(counted, m)), steps: counted.target.n }, "countedMarks");
  const net = by("pour-spill", 3, 7, (r) => r.start.n && r.moves.some((m) => m.n < 0) && r.moves.some((m) => m.n > 0));
  const fine = net.ticksOptions.find((m) => [net.start, ...net.moves].every((x) => m % x.d === 0));
  const at = (x) => ({ ticks: fine, steps: (x.n * fine) / x.d });
  const flipped = sum(net.moves.map((m) => F(Math.abs(m.n), m.d)), net.start);
  const plain = sum(net.moves);
  if (!eq(flipped, net.target) && Math.abs(flipped.n) <= 3 * flipped.d) expectMistake(net, at(flipped), "signFlip");
  if (!eq(plain, net.target) && !eq(plain, flipped) && Math.abs(plain.n) <= 3 * plain.d) expectMistake(net, at(plain), "forgotStart");
  const pct = by("percent-amount", 2, 6, (r) => r.of.d === 1 && r.of.n > 1 && r.ticksOptions.some((m) => (m * r.percent) % 100 === 0));
  const m100 = pct.ticksOptions.find((m) => (m * pct.percent) % 100 === 0);
  expectMistake(pct, { ticks: m100, steps: (m100 * pct.percent) / 100 }, "ignoredAmount");
  const approx = by("rational-approx", 2, 8, () => true);
  const best = game.solve(approx);
  expectMistake(approx, { ...best, verdict: "equal" }, "saysEqual");
  expectMistake(approx, { ticks: 2, steps: approx.lo * 2, verdict: "close" }, "tooFar");
  const unlike = by("unlike-bars", 2, 5, (r) => r.scoops.length > 2);
  expectMistake(unlike, { scoops: [unlike.scoops[0], unlike.scoops[1]] }, "mixedSizes");
  const tb = (r) => r.terms[0].d + r.terms[1].d;
  const topBottom = by("unlike-bars", 1, 5, (r) => {
    const [x, y] = r.terms;
    return r.op === "sum" && r.terms.length === 2 && x.n + y.n <= 24 && r.scoops.some((s) => s.d === tb(r)) && !eq(F(x.n + y.n, tb(r)), r.target);
  });
  expectMistake(topBottom, { scoops: Array(topBottom.terms[0].n + topBottom.terms[1].n).fill(F(1, tb(topBottom))) }, "topBottom");
  const batch = by("batch-recipe", 1, 4, (r) => r.batches >= 3);
  expectMistake(batch, { scoops: Array(batch.amount.n).fill(batch.scoops[0]) }, "oneBatch");
  const mixedR = by("mixed-scoops", 1, 4, (r) => r.target.d > 1 && r.target.n > r.target.d && r.scoops[0].d <= 6);
  const cups = Math.floor(mixedR.target.n / mixedR.target.d) * mixedR.scoops[0].d;
  expectMistake(mixedR, { scoops: Array(cups).fill(mixedR.scoops[0]) }, "wholeOnly");
  const two = by("mixed-scoops", 3, 4, (r) => (r.target.n * r.scoops[0].d) % r.target.d === 0);
  expectMistake(two, { scoops: Array((two.target.n * two.scoops[0].d) / two.target.d).fill(two.scoops[0]) }, "needTwoKinds");
  const serving = by("divide-fractions", 2, 6, (r) => div(r.amount, r.size).n >= 3);
  expectMistake(serving, { servings: div(serving.amount, serving.size).n - 1 }, "stoppedEarly");
  const dec = by("tenths-cup", 2, 4, (r) => r.places.length === 2);
  const [tenths, hundredths] = [1, 2].map((i) => Math.floor((dec.target.n * 10 ** i) / dec.target.d) % 10);
  if (tenths !== hundredths) {
    expectMistake(dec, digitsResp([0, 0, tenths, hundredths]), "placeShift");
    expectMistake(dec, digitsResp([0, hundredths, tenths, 0]), "digitsSwapped");
  }
  expectMistake(dec, digitsResp([0, 9, 9, 9]), "overfill");
  const rep = by("repeating-decimals", 1, 7, (r) => decimalShape(r.target).rep !== "");
  const end = by("repeating-decimals", 1, 7, (r) => decimalShape(r.target).rep === "");
  const wrongBlock = rep.blocks.find((x) => x !== decimalShape(rep.target).rep);
  expectMistake(rep, digitsResp([0, 3, 3, 3]), "claimedExact");
  expectMistake(rep, { digits: [0, 0, 0, 0], never: true, block: null }, "needBlock");
  expectMistake(rep, { digits: [0, 0, 0, 0], never: true, block: wrongBlock }, "wrongBlock");
  expectMistake(end, { digits: [0, 0, 0, 0], never: true, block: end.blocks[0] }, "claimedNever");
}
targeted();
for (const skill of game.skills)
  ok(seen.get(skill.id)?.size >= 1, `FM-063 ${skill.id}: a named mistake`);
for (const result of [...seen.values()].flatMap((m) => [...m.values()])) {
  ok(result.feedback.en.length < 260 && result.feedback.es.length < 330, "feedback stays short");
}

// ---- 5. hints: tiers 0-2 never leak the answer, tier 3 states it -----------------------------------------
const answerForms = (round) => {
  const out = new Set([game.answerText(round)]);
  const target = oracleTarget(round);
  if (round.kind === "serving") out.add(String(target.n));
  else if (target && !["equiv", "compare"].includes(round.kind)) {
    for (const form of [str(target), mixed(target), decimal(target)]) if (form) out.add(form);
  }
  return [...out];
};
const SOLUTION_TEXT = {
  fair: (r) => `${r.friends} equal parts`,
  serve: (r) => `${r.ask[1]} equal parts`,
  serving: (r) => ` ${oracleTarget(r).n} servings`,
  fill: (r) => mixed(oracleTarget(r)),
};
let hinted = 0;
for (const [skill, , level, seed, round] of allRounds) {
  if (seed % 2) continue;
  const tiers = [0, 1, 2, 3].map((t) => game.hint(round, t, null));
  const label = `${skill.id} L${level}`;
  tiers.forEach((hint, t) => {
    ok(
      hint.en.length > 25 && hint.es.length > 25 && hint.en !== hint.es,
      `${label}: hint ${t} text`,
    );
    ok(!/undefined|NaN|\{\w+\}/.test(`${hint.en} ${hint.es}`), `${label}: hint ${t} debris`);
    for (const form of t < 3 ? answerForms(round) : []) {
      for (const lang of ["en", "es"])
        ok(!wordIn(hint[lang], form), `FM-062 ${label} tier ${t}: "${form}" in ${hint[lang]}`);
    }
  });
  ok(new Set(tiers.slice(0, 3).map((h) => h.en)).size === 3, "tiers 0-2 differ");
  const answer = game.answerText(round);
  ok(
    tiers[3].en.includes(answer) && tiers[3].es.includes(answer),
    `${label}: tier 3 has ${answer}`,
  );
  ok(answer.length > 0 && answer.length < 24, "answerText is short");
  const wanted = SOLUTION_TEXT[round.kind]?.(round);
  if (wanted) ok(tiers[3].en.includes(wanted), `${label}: tier 3 says "${wanted}": ${tiers[3].en}`);
  if (skill.id === "pour-spill")
    ok(tiers[3].en.includes(mixed(round.start)), "net walk starts at the start");
  if (skill.id === "rational-approx")
    ok(/not exactly/.test(tiers[3].en), "approx solution says not exact");
  hinted += 1;
}
ok(hinted > 1000, `hint ladders checked on ${hinted} rounds`);

// ---- 6. drawn models equal their fractions (FM-059) ---------------------------------------------------------
const dom = (html) => new JSDOM(`<body>${html}</body>`).window.document;
const turn = (x, y, cx, cy) => (Math.atan2(x - cx, -(y - cy)) / (2 * Math.PI) + 1) % 1;
const near = (x, y, tol = 0.002) => Math.abs(x - y) <= tol;
const num = (el, name) => Number(el.getAttribute(name));
const even = art.evenCuts;
// biome-ignore format: tables of figures to draw
const PARTS = [even(2), even(3), even(5), even(7), even(12), [F(1, 12), F(5, 12)], [F(1, 6), F(1, 2), F(11, 12)]];
// biome-ignore format: tables of figures to draw
const VESSELS = [[F(3, 8), 1, 8], [F(11, 8), 2, 8], [F(0), 1, 4], [F(2, 3), 1, 3], [F(5), 5, 1]];
// biome-ignore format: tables of figures to draw
const STRIPS = [[F(2, 3), 0, 1], [F(-3, 2), -3, 3], [F(22, 7), 3, 4], [F(7, 4), 0, 3]];
const SECTOR =
  /^M ([\d.-]+) ([\d.-]+) L ([\d.-]+) ([\d.-]+) A [\d.-]+ [\d.-]+ 0 (\d) 1 ([\d.-]+) ([\d.-]+) Z$/;
for (const cuts of PARTS) {
  const edges = [F(0), ...cuts, F(1)];
  const sizes = edges.slice(1).map((e, i) => sub(e, edges[i]));
  const served = sizes.map((_, i) => i % 2 === 0);
  const pizza = dom(art.pizzaSvg({ cuts, served, label: "pizza" }));
  const pieces = [...pizza.querySelectorAll(".fk-piece")];
  ok(pieces.length === sizes.length, "one pizza piece per part");
  pieces.forEach((piece, i) => {
    const want = sizes[i].n / sizes[i].d;
    ok(
      piece.getAttribute("fill") === (served[i] ? "#1d9a6c" : "#fbefcf"),
      "served pieces are filled",
    );
    ok(piece.getAttribute("data-size") === str(sizes[i]), "data-size is the exact fraction");
    const m = SECTOR.exec(piece.getAttribute("d"));
    ok(Boolean(m), "slice is a sector");
    const [cx, cy, x0, y0, large, x1, y1] = m.slice(1).map(Number);
    const a0 = turn(x0, y0, cx, cy);
    const drawn = (turn(x1, y1, cx, cy) - a0 + 1) % 1 || 1;
    const gap = Math.abs(a0 - edges[i].n / edges[i].d);
    ok(near(drawn, want), `slice angle ${(drawn * 360).toFixed(2)} equals ${str(sizes[i])}`);
    ok(
      Math.min(gap, 1 - gap) < 0.002 && large === (want > 0.5 ? 1 : 0),
      "slice start and arc flag",
    );
  });
  const bar = dom(art.barSvg({ cuts, served, label: "bar" }));
  const frame = bar.querySelector(".fk-whole");
  [...bar.querySelectorAll(".fk-piece")].forEach((rect, i) => {
    const [x, w] = [num(rect, "x") - num(frame, "x"), num(rect, "width")];
    ok(
      near(w / num(frame, "width"), sizes[i].n / sizes[i].d, 0.0015),
      `bar width ${str(sizes[i])}`,
    );
    ok(
      near(x / num(frame, "width"), edges[i].n / edges[i].d, 0.0015),
      "bar piece starts at its cut",
    );
  });
}
const twin = dom(
  art.pizzaSvg({ cuts: even(4), served: Array(8).fill(false), wholes: 2, label: "two" }),
);
ok(
  twin.querySelectorAll(".fk-piece").length === 8 &&
    twin.querySelectorAll(".fk-crust").length === 2,
  "two pizzas",
);
for (const [level, cap, marks] of VESSELS) {
  const cup = dom(art.vesselSvg({ level, cap, marks, label: "cup" }));
  const [liquid, frame] = [".fk-liquid", ".fk-vessel"].map((q) => cup.querySelector(q));
  ok(
    near(num(liquid, "height") / num(frame, "height"), level.n / level.d / cap),
    `liquid is ${str(level)}`,
  );
  const [floor, bottom] = [
    num(liquid, "y") + num(liquid, "height"),
    num(frame, "y") + num(frame, "height"),
  ];
  ok(near(floor, bottom, 0.01), "liquid sits on the bottom");
}
for (const [marker, lo, hi] of STRIPS) {
  const strip = dom(art.stripSvg({ lo, hi, marks: 4, marker, label: "strip" }));
  const ticks = [...strip.querySelectorAll("line")].filter(
    (l) => !l.getAttribute("class") && l.getAttribute("y1") !== l.getAttribute("y2"),
  );
  const xs = ticks.map((l) => num(l, "x1"));
  const share =
    (num(strip.querySelector(".fk-marker-line"), "x1") - Math.min(...xs)) /
    (Math.max(...xs) - Math.min(...xs));
  ok(near(share, (marker.n / marker.d - lo) / (hi - lo), 0.003), `marker ${str(marker)}`);
  ok(ticks.length === (hi - lo) * 4 + 1, "one tick per mark");
}
const cups = dom(art.servingsSvg({ count: 5, size: F(3, 4), label: "servings" }));
const [fill, glass] = [".fk-serving-fill", ".fk-serving"].map((q) => cups.querySelector(q));
ok(cups.querySelectorAll(".fk-serving").length === 5, "one cup per serving");
ok(near(num(fill, "height") / num(glass, "height"), 0.75, 0.01), "each serving is 3/4 full");

console.log(
  `fraction-kitchen math: ${checks} checks passed (${allRounds.length} rounds, ${game.skills.length} skills).`,
);
