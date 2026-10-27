// Rounds for grades 5 to 7 that place operations, forms or expressions: order-of-operations target puzzles, equal values
// in different forms on a balance, inequality scales, and equivalent expressions. Many of these accept every correct
// answer, so a prompt never claims there is only one. @fm2 FM-017 FM-051 FM-052 FM-053 FM-054 FM-058 FM-060
import { add, cmp, eq, frac, mul, toDecimalString, toMixedString } from "../../rational.js";
import { balanceRound } from "./gen-early.js";
import {
  cmpRule,
  int,
  makePool,
  numberPool,
  openCell,
  pick,
  placeRound,
  sample,
  shuffle,
  T,
} from "./gen-kit.js";
import { evalTokens } from "./rules.js";

// ---- order of operations: reach the target with the given numbers and operations -----------------------------
// Each template lists the tokens left to right; cells are numbers at even spots and operations at odd spots.
const num = (i) => ({ c: i });
const TEMPLATES = {
  flat3: {
    toks: [num(0), num(1), num(2), num(3), num(4)],
    types: ["num", "op", "num", "op", "num"],
  },
  left3: {
    toks: ["(", num(0), num(1), num(2), ")", num(3), num(4)],
    types: ["num", "op", "num", "op", "num"],
  },
  right3: {
    toks: [num(0), num(1), "(", num(2), num(3), num(4), ")"],
    types: ["num", "op", "num", "op", "num"],
  },
  pair4: {
    toks: ["(", num(0), num(1), num(2), ")", num(3), "(", num(4), num(5), num(6), ")"],
    types: ["num", "op", "num", "op", "num", "op", "num"],
  },
  left4: {
    toks: ["(", num(0), num(1), num(2), ")", num(3), num(4), num(5), num(6)],
    types: ["num", "op", "num", "op", "num", "op", "num"],
  },
  mid4: {
    toks: [num(0), num(1), "(", num(2), num(3), num(4), ")", num(5), num(6)],
    types: ["num", "op", "num", "op", "num", "op", "num"],
  },
};
const FORMS = [["flat3"], ["left3", "right3"], ["pair4", "left4", "mid4"]];

export function targetOps(level, rng) {
  const count = level === 3 ? 4 : 3;
  const opSet = level === 1 ? ["+", "−", "×"] : ["+", "−", "×", "÷"];
  for (let tries = 0; tries < 2000; tries += 1) {
    const form = pick(rng, FORMS[level - 1]);
    const tpl = TEMPLATES[form];
    const numbers = sample(rng, [2, 3, 4, 5, 6, 7, 8, 9], count);
    const ops = sample(rng, opSet, count - 1);
    const vals = [];
    let nextNum = 0;
    let nextOp = 0;
    for (const type of tpl.types) vals.push(type === "num" ? numbers[nextNum++] : ops[nextOp++]);
    const trace = [];
    const result = evalTokens(tpl.toks, vals, "standard", trace);
    if (!result || result.d !== 1 || result.n < 2 || result.n > 99) continue;
    if (trace.some((q) => q.d !== 1 || q.n < 1)) continue;
    // keep rounds where the parentheses actually matter to the learner
    const bare = evalTokens(tpl.toks, vals, "noparen");
    if (level > 1 && bare && eq(bare, result)) continue;
    const target = result.n;
    const opText = ops.join(" ");
    const cells = tpl.types.map((type) => ({ v: null, type }));
    const pool = makePool([
      ...numbers.sort((a, b) => a - b).map((v) => ({ v, kind: "num" })),
      ...ops.map((v) => ({ v, kind: "op" })),
    ]);
    return placeRound(rng, {
      level,
      layout: "expr",
      reuse: false,
      toks: tpl.toks,
      target,
      cells,
      pool,
      rules: [{ k: "expr", toks: tpl.toks, to: target }],
      prompt: T(
        `Use the numbers ${listEn(numbers)} and the operations ${opText}, each once, to make the expression equal ${target}. Follow the order of operations.`,
        `Usa los números ${listEs(numbers)} y las operaciones ${opText}, cada uno una vez, para que la expresión sea igual a ${target}. Sigue el orden de las operaciones.`,
      ),
    });
  }
  throw new Error("could not build a target puzzle");
}

const listEn = (list) =>
  list.length === 2
    ? `${list[0]} and ${list[1]}`
    : `${list.slice(0, -1).join(", ")} and ${list.at(-1)}`;
const listEs = (list) =>
  list.length === 2
    ? `${list[0]} y ${list[1]}`
    : `${list.slice(0, -1).join(", ")} y ${list.at(-1)}`;

// ---- equal values in different forms on a balance -------------------------------------------------------------
const NICE = [
  [1, 2],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 10],
  [3, 10],
  [7, 10],
  [9, 10],
  [1, 20],
  [3, 20],
  [1, 8],
  [3, 8],
];
const NICE_UP = [
  [5, 4],
  [3, 2],
  [7, 4],
  [6, 5],
  [11, 10],
  [5, 2],
  [9, 5],
  [13, 10],
];

// Text forms of a value, with the form name: reduced fraction, an unreduced twin, decimal and percent.
export function formsOf(q) {
  const out = [{ label: toMixedString(q), form: "frac" }];
  if (q.n < q.d)
    for (const k of [2, 3]) out.push({ label: `${q.n * k}/${q.d * k}`, form: "frac2" });
  const dec = toDecimalString(q);
  if (dec) out.push({ label: dec, form: "dec" });
  const pct = toDecimalString(mul(q, frac(100)));
  if (pct) out.push({ label: `${pct}%`, form: "pct" });
  return out;
}

function labelFor(q, rng, allowed) {
  const options = formsOf(q).filter((f) => allowed.includes(f.form));
  return pick(rng, options.length ? options : formsOf(q).slice(0, 1));
}

const rat = ([n, d]) => frac(n, d);

export function equalForms(level, rng, grade) {
  const bank = grade >= 6 ? [...NICE, ...NICE_UP] : NICE;
  for (let tries = 0; tries < 500; tries += 1) {
    let leftTerms;
    let rightTerms;
    let target;
    let addAcross = null;
    let pieces;
    if (level === 1) {
      const q = rat(pick(rng, bank));
      const f = labelFor(q, rng, ["frac", "dec"]);
      leftTerms = [{ v: q, f: f.label }];
      rightTerms = [{ c: 0 }];
      target = q;
      pieces = [q];
    } else {
      const a = rat(
        pick(
          rng,
          NICE.filter((p) => p[1] <= 10),
        ),
      );
      const b = rat(
        pick(
          rng,
          NICE.filter((p) => p[1] <= 10),
        ),
      );
      const total = add(a, b);
      if (total.d > 20 || (grade < 6 && cmp(total, frac(1)) > 0)) continue;
      const forms = level === 2 ? ["frac"] : ["frac", "dec", "pct"];
      const fa = labelFor(a, rng, forms);
      const fb = labelFor(b, rng, level === 3 ? ["dec", "pct", "frac"] : forms);
      leftTerms = [
        { v: a, f: fa.label },
        { v: b, f: fb.label },
      ];
      if (level === 2) {
        rightTerms = [{ c: 0 }];
        target = total;
        addAcross = [a.n + b.n, a.d + b.d];
      } else {
        const s = rat(
          pick(
            rng,
            NICE.filter((p) => p[1] <= 10),
          ),
        );
        target = total;
        const rest = add(total, frac(-s.n, s.d));
        if (rest.n <= 0 || rest.d > 20) continue;
        const fs = labelFor(s, rng, ["frac", "dec", "pct"]);
        rightTerms = [{ v: s, f: fs.label }, { c: 0 }];
        target = rest;
      }
      pieces = [a, b];
    }
    const correct = formsOf(target).filter(
      (f) => !leftTerms.some((t) => "f" in t && t.f === f.label),
    );
    const correctPick = sample(rng, correct, Math.min(2, correct.length));
    if (!correctPick.length) continue;
    const taken = new Set(correctPick.map((f) => f.label));
    const tiles = correctPick.map((f) => ({ v: target, label: f.label }));
    const bad = [];
    const addBad = (q, label, why) => {
      if (eq(q, target) || taken.has(label) || bad.some((b) => b.label === label)) return;
      bad.push({ v: q, label, why });
    };
    const dec = toDecimalString(target);
    if (dec) {
      addBad(mul(target, frac(10)), toDecimalString(mul(target, frac(10))) ?? dec, "decimal-shift");
      addBad(
        mul(target, frac(1, 10)),
        toDecimalString(mul(target, frac(1, 10))) ?? dec,
        "decimal-shift",
      );
      addBad(mul(target, frac(1, 100)), `${dec}%`, "percent-slip");
    }
    if (addAcross)
      addBad(frac(addAcross[0], addAcross[1]), `${addAcross[0]}/${addAcross[1]}`, "add-across");
    if (target.n > 1 && target.n < target.d)
      addBad(frac(target.d, target.n), `${target.d}/${target.n}`, "inverted");
    for (const delta of [frac(1, 20), frac(-1, 20)]) {
      const near = add(target, delta);
      const text = toDecimalString(near);
      if (near.n > 0 && text) addBad(near, text, "close-not-equal");
    }
    if (bad.length < 3) continue;
    // one distractor for each kind of mistake, in a random order, so every named mistake can turn up
    const kinds = shuffle(rng, [...new Set(bad.map((b) => b.why))]);
    const chosen = kinds.slice(0, 6 - tiles.length).map((why) => pick(rng, bad.filter((b) => b.why === why)));
    const pool = makePool(shuffle(rng, [...tiles, ...chosen]));
    const ref = Math.max(1, Number(pieces.reduce((s, p) => s + p.n / p.d, 0)) * 1.2);
    return balanceRound(
      rng,
      {
        level,
        reuse: true,
        prompt: T(
          "Place a weight on the empty spot so the scale balances. Any weight with exactly the same value works, in any form.",
          "Coloca una pesa en el lugar vacío para que la balanza quede equilibrada. Sirve cualquier pesa con exactamente el mismo valor, en cualquier forma.",
        ),
        cells: [openCell()],
        pool,
        unit: "value",
      },
      [{ l: leftTerms, r: rightTerms, rel: "=" }],
      ref,
    );
  }
  throw new Error("could not build an equal-forms round");
}

// ---- inequality scale -------------------------------------------------------------------------------------------
export function inequalityScale(level, rng, grade) {
  const hi = grade === 6 ? 20 : 40;
  const heavier = rng() < 0.5; // true: left must be heavier
  const rel = heavier ? ">" : "<";
  if (level === 3) {
    const k = int(rng, 2, grade === 7 ? 5 : 3);
    const a = int(rng, 1, 9);
    const b = int(rng, k * 3 + a, k * 3 + a + hi / 2);
    const threshold = (b - a) / k; // k*x + a  vs  b : equal when x = threshold
    const named = [];
    const edge = Number.isInteger(threshold) ? threshold : null;
    if (edge) named.push([edge, "equal-not-tip"]);
    const wrongWay = heavier ? Math.floor(threshold) - 1 : Math.ceil(threshold) + 1;
    named.push([wrongWay, "wrong-way"], [wrongWay - 1, "wrong-way"]);
    const good = heavier ? Math.floor(threshold) + 2 : Math.ceil(threshold) - 2;
    return inequalityRound(rng, {
      level,
      rel,
      pans: { l: [{ c: 0, m: k, box: "x" }, { v: a }], r: [{ v: b }] },
      cells: [openCell()],
      include: [Math.max(1, good), Math.max(1, good + (heavier ? 3 : -3))],
      named,
      hi: Math.ceil(b / k) + 6,
      prompt: T(
        `Each x-box weighs the number you place. Choose a weight for x that makes the left pan ${heavier ? "heavier" : "lighter"} than the right pan.`,
        `Cada caja x pesa el número que coloques. Elige un peso para x que haga que el platillo izquierdo pese ${heavier ? "más" : "menos"} que el derecho.`,
      ),
    });
  }
  if (level === 2) {
    const a = int(rng, 1, 6);
    const b = int(rng, 1, 6);
    return inequalityRound(rng, {
      level,
      rel,
      pans: { l: [{ c: 0 }, { v: a }], r: [{ c: 1 }, { v: b }] },
      cells: [openCell(), openCell()],
      include: [],
      named: [],
      hi: hi / 2,
      prompt: T(
        `Place a number in each empty spot so the left pan is ${heavier ? "heavier" : "lighter"} than the right pan. Many choices work.`,
        `Coloca un número en cada lugar vacío para que el platillo izquierdo pese ${heavier ? "más" : "menos"} que el derecho. Sirven muchas opciones.`,
      ),
    });
  }
  const a = int(rng, 2, Math.floor(hi / 2));
  const b = int(rng, a + 3, a + Math.floor(hi / 2));
  const edge = b - a;
  return inequalityRound(rng, {
    level,
    rel,
    pans: { l: [{ c: 0 }, { v: a }], r: [{ v: b }] },
    cells: [openCell()],
    include: [Math.max(1, heavier ? edge + 2 : edge - 2)],
    named: [
      [edge, "equal-not-tip"],
      [heavier ? edge - 2 : edge + 2, "wrong-way"],
      [heavier ? edge - 1 : edge + 1, "wrong-way"],
    ],
    hi: b,
    prompt: T(
      `Place a number so the left pan is ${heavier ? "heavier" : "lighter"} than the right pan.`,
      `Coloca un número para que el platillo izquierdo pese ${heavier ? "más" : "menos"} que el derecho.`,
    ),
  });
}

function inequalityRound(rng, spec) {
  const { level, rel, pans, cells, include, named, hi, prompt } = spec;
  const open = cells.length;
  let pool;
  if (open === 2) {
    pool = makePool(
      sample(
        rng,
        Array.from({ length: hi }, (_, i) => i + 1),
        6,
      )
        .sort((a, b) => a - b)
        .map((v) => ({ v })),
    );
  } else {
    pool = numberPool(rng, {
      include: include.filter((v) => v >= 1),
      named: named.filter(([v]) => v >= 1),
      lo: 1,
      hi: Math.max(hi, ...include, 8),
      size: 6,
    });
  }
  const ref = Math.max(8, ...pans.l.concat(pans.r).map((t) => t.v ?? 0));
  return balanceRound(
    rng,
    { level, reuse: true, prompt, cells, pool, inequality: true },
    [{ l: pans.l, r: pans.r, rel }],
    ref * 1.4,
  );
}

// ---- equivalent expressions ---------------------------------------------------------------------------------------
export const linText = ([a, b]) => `${a === 1 ? "" : a}x${b ? ` + ${b}` : ""}`;

export function equivExpr(level, rng) {
  const xs = int(rng, 2, 4);
  let text;
  let correct;
  let named;
  const form = level === 1 ? 1 : level === 2 ? 2 : pick(rng, [3, 4]);
  if (form === 1) {
    const a = int(rng, 2, 4);
    const b = int(rng, 1, 6);
    text = `${a}(x + ${b})`;
    correct = [a, a * b];
    named = [
      [[a, b], "distribute-first"],
      [[1, a * b], "dropped-multiplier"],
      [[a, a + b], "added-not-multiplied"],
    ];
  } else if (form === 2) {
    const a = int(rng, 1, 4);
    const c = int(rng, 1, 4);
    const b = int(rng, 1, 9);
    text = `${a === 1 ? "" : a}x + ${b} + ${c === 1 ? "" : c}x`;
    correct = [a + c, b];
    named = [
      [[a + c, 0], "dropped-constant"],
      [[a, b + c], "combined-unlike"],
      [[a + b + c, 0], "combined-unlike"],
    ];
  } else if (form === 3) {
    const a = int(rng, 2, 4);
    const b = int(rng, 2, 3);
    const c = int(rng, 1, 5);
    const d = int(rng, 1, 6);
    text = `${a}(${b}x + ${c}) + ${d}`;
    correct = [a * b, a * c + d];
    named = [
      [[a * b, c + d], "distribute-first"],
      [[a * b, a * c], "dropped-constant"],
      [[a + b, a * c + d], "added-not-multiplied"],
    ];
  } else {
    const a = int(rng, 2, 3);
    const b = int(rng, 1, 5);
    const c = int(rng, 2, 3);
    const d = int(rng, 1, 5);
    text = `${a}(x + ${b}) + ${c}(x + ${d})`;
    correct = [a + c, a * b + c * d];
    named = [
      [[a + c, b + d], "distribute-first"],
      [[a * c, a * b + c * d], "multiplied-coefficients"],
      [[a + c, a * b + d], "distribute-first"],
    ];
  }
  const at = (t) => t[0] * xs + t[1];
  const tiles = [{ lin: correct, label: linText(correct) }];
  const seen = new Set([linText(correct)]);
  const push = (lin, why) => {
    const label = linText(lin);
    if (
      seen.has(label) ||
      lin.some((x) => x < 0) ||
      (lin[0] === correct[0] && lin[1] === correct[1])
    )
      return;
    seen.add(label);
    tiles.push({ lin, label, why });
  };
  for (const [lin, why] of named) push(lin, why);
  // a tile that balances at this x but is not equivalent: it fails as soon as x changes
  push([correct[0] + 1, correct[1] - xs], "same-here");
  push([Math.max(1, correct[0] - 1), correct[1] + xs], "same-here");
  const pool = makePool(
    shuffle(rng, tiles.slice(0, 6)).map((t) => ({
      v: { lin: t.lin },
      label: t.label,
      ...(t.why ? { why: t.why } : {}),
    })),
  );
  return placeRound(rng, {
    level,
    layout: "balance",
    equiv: true,
    reuse: true,
    xs,
    xRange: [1, 6],
    ref: at(correct) * 1.2,
    scales: [{ l: [{ lin: correct, text }], r: [{ c: 0 }], rel: "=" }],
    cells: [openCell()],
    pool,
    rules: [{ k: "equiv", c: 0, lin: correct }],
    prompt: T(
      "Place the expression that balances the scale for every weight of x. Use the x buttons to try other weights.",
      "Coloca la expresión que equilibra la balanza para cualquier peso de x. Usa los botones de x para probar otros pesos.",
    ),
  });
}
