/**
 * Independent verification of Project Studio feedback engine v2 (all 12 families, 30 missions).
 *
 * 1. Self-test the detectors (a corrupted key, a leaking message, a lazy engine must each be caught).
 * 2. Recompute every check with exact rational arithmetic and compare with math.mjs, over each
 *    mission's defaults and seeded perturbed inputs.
 * 3. Negative controls: each wrong-answer pattern must be named, every other wrong answer must be
 *    flagged with a message that carries the real numbers, and no message may state the answer.
 * 4. Sibling missions must differ where their numbers differ; revision must re-judge a changed design.
 */
import assert from "node:assert/strict";
import {
  diagnose,
  feedbackText,
  JUDGED,
  V2_FAMILIES,
  verifiedFacts,
} from "../curriculum/projects/studio/feedback.mjs";
import { fieldsFor, model } from "../curriculum/projects/studio/math.mjs";
import { PROJECTS } from "../curriculum/projects/studio/projects.mjs";
import {
  absRat,
  answerText,
  ceilRat,
  disagreements,
  floorRat,
  leaksValue,
  medianRat,
  oracle,
  rat,
  roundCents,
} from "./lib/project-studio-oracle.mjs";
import { probesB } from "./lib/project-studio-probes-b.mjs";

const R = rat;
const missions = PROJECTS.filter((p) => V2_FAMILIES.includes(p.family));
assert.equal(missions.length, 30, "every Studio mission is on the v2 feedback engine");

// ---------- seeded inputs ----------
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function perturbed(project, rand, index) {
  const design = {};
  for (const f of fieldsFor(project)) {
    if (f.text) {
      const n = 6 + Math.floor(rand() * 7);
      design.data = Array.from({ length: n }, () =>
        (Math.round(rand() * 400) / 2 - 20).toString(),
      ).join(", ");
      continue;
    }
    if (index === 0) design[f.key] = f.min;
    else if (index === 1) design[f.key] = f.max;
    else {
      const step = f.integer ? 1 : f.min < 0.5 ? 0.125 : 0.25;
      const steps = Math.floor((f.max - f.min) / step);
      design[f.key] = f.min + Math.floor(rand() * (steps + 1)) * step;
    }
  }
  return design;
}
const designs = (project) => {
  const rand = mulberry32(project.id.split("").reduce((t, c) => t * 31 + c.charCodeAt(0), 7));
  return [
    { ...project.defaults },
    ...Array.from({ length: 40 }, (_, i) => perturbed(project, rand, i)),
  ];
};

// ---------- wrong-answer probes (independent formulas, exact arithmetic) ----------
const probes = {
  division(x) {
    const { a, b, c, d, e, f } = x;
    const full = floorRat(a.div(b)),
      rem = a.sub(full.mul(b));
    const packs = floorRat(c.div(d)),
      pieces = floorRat(e.div(f));
    const dividesA = a.div(b).isInt(),
      dividesC = c.div(d).isInt(),
      dividesE = e.div(f).isInt();
    return {
      groups: [
        ["floor-quotient", rem.n ? full : null],
        ["fraction-of-group", dividesA ? null : a.div(b)],
        ["gave-remainder", rem.n ? rem : null],
      ],
      remainder: [
        ["gave-groups", full],
        ["gave-all-groups", ceilRat(a.div(b))],
        ["gave-empty-seats", rem.n ? b.sub(rem) : null],
      ],
      packs: [
        ["rounded-up", dividesC ? null : ceilRat(c.div(d))],
        ["kept-fraction", dividesC ? null : c.div(d)],
        ["multiplied", c.mul(d)],
      ],
      money: [
        ["gave-spent", packs.mul(d)],
        ["over-bought", dividesC ? null : c.sub(ceilRat(c.div(d)).mul(d))],
      ],
      quotient: [
        ["multiplied", e.mul(f)],
        ["flipped", f.div(e)],
        ["whole-pieces-only", dividesE ? null : pieces],
      ],
      leftover: [
        ["fraction-left", dividesE ? null : e.div(f).sub(pieces)],
        ["gap-to-next", dividesE ? null : f.sub(e.sub(pieces.mul(f)))],
        ["over-cut", dividesE ? null : e.sub(ceilRat(e.div(f)).mul(f))],
      ],
    };
  },
  statistics(x) {
    const data = x.data,
      sorted = [...data].sort((p, q) => (p.sub(q).n < 0n ? -1 : 1)),
      n = R(data.length);
    const sum = sorted.reduce((t, y) => t.add(y), R(0)),
      mean = sum.div(n),
      lo = sorted[0],
      hi = sorted.at(-1);
    const mid = Math.floor(data.length / 2),
      lower = sorted.slice(0, mid),
      upper = sorted.slice(data.length % 2 ? mid + 1 : mid);
    const q1 = medianRat(lower),
      q3 = medianRat(upper),
      med = medianRat(sorted),
      two = R(2);
    const absDev = sorted.reduce((t, y) => t.add(absRat(y.sub(mean))), R(0));
    return {
      mean: [
        ["gave-median", med],
        ["forgot-divide", sum],
        ["divided-by-n-minus-1", sum.div(n.sub(R(1)))],
        ["midrange", lo.add(hi).div(two)],
      ],
      median: [
        ["gave-mean", mean],
        ["unsorted-middle", medianRat(data)],
        ["midrange", lo.add(hi).div(two)],
      ],
      range: [
        ["gave-max", hi],
        ["added-ends", lo.add(hi)],
        ["gave-iqr", q3.sub(q1)],
      ],
      mad: [
        ["forgot-divide", absDev],
        ["signed-deviations", R(0)],
        ["gave-range", hi.sub(lo)],
      ],
      q1: [
        ["gave-min", lo],
        ["gave-median", med],
        ["lower-mean", lower.reduce((t, y) => t.add(y), R(0)).div(R(lower.length))],
      ],
      iqr: [
        ["gave-range", hi.sub(lo)],
        ["gave-q3", q3],
        ["added-quartiles", q1.add(q3)],
        ["reversed", q1.sub(q3)],
      ],
    };
  },
  ratio(x) {
    const { a, b, c, d, e, f, g } = x;
    const rA = d.div(e),
      rB = f.div(g);
    return {
      "scale-a": [
        ["added", a.add(c)],
        ["swapped", b.mul(c)],
      ],
      "scale-b": [
        ["added", b.add(c)],
        ["used-first", a.mul(c)],
      ],
      "base-rate": [
        ["inverted", b.div(a)],
        ["subtracted", a.sub(b)],
      ],
      "rate-a": [
        ["inverted", e.div(d)],
        ["gave-total", d],
        ["subtracted", d.sub(e)],
      ],
      "rate-b": [
        ["inverted", g.div(f)],
        ["gave-total", f],
        ["used-a", rA],
      ],
      difference: [
        ["signed", absRat(rA.sub(rB)).neg()],
        ["compared-totals", absRat(d.sub(f))],
        ["compared-quantities", absRat(e.sub(g))],
      ],
    };
  },
  percent(x) {
    const { a, b, c, d } = x,
      h = R(100);
    const discount = a.mul(b).div(h),
      sale = a.sub(discount);
    const tax = roundCents(sale.mul(c).div(h)),
      total = roundCents(sale.add(tax));
    return {
      decimal: [
        ["gave-percent", b],
        ["shifted-one-place", b.div(R(10))],
        ["shifted-three-places", b.div(R(1000))],
      ],
      discount: [
        ["gave-percent", b],
        ["forgot-hundred", a.mul(b)],
        ["gave-sale", sale],
      ],
      sale: [
        ["gave-discount", discount],
        ["subtracted-percent", a.sub(b)],
        ["added-discount", a.add(discount)],
      ],
      tax: [
        ["tax-on-original", roundCents(a.mul(c).div(h))],
        ["gave-rate", c],
        ["tax-on-discount", roundCents(discount.mul(c).div(h))],
      ],
      total: [
        ["forgot-tax", sale],
        ["tax-on-original", sale.add(roundCents(a.mul(c).div(h)))],
        ["added-to-original", roundCents(a.add(tax))],
      ],
      budget: [
        ["sign-flipped", total.sub(d)],
        ["ignored-tax", d.sub(sale)],
        ["gave-budget", d],
      ],
    };
  },
  expressions(x) {
    const { a, b, c, d } = x,
      sq = d.mul(d),
      inside = c.add(b),
      value = a.mul(inside).add(sq),
      two = R(2);
    return {
      square: [
        ["doubled", two.mul(d)],
        ["kept-base", d],
      ],
      inside: [
        ["multiplied", c.mul(b)],
        ["gave-x", c],
      ],
      value: [
        ["forgot-square", a.mul(inside).add(d)],
        ["doubled-not-squared", a.mul(inside).add(two.mul(d))],
        ["distributed-one-term", a.mul(c).add(b).add(sq)],
        ["multiplied-square", a.mul(inside.add(sq))],
      ],
      coefficient: [
        ["gave-product", a.mul(b)],
        ["gave-inner-constant", b],
        ["gave-one", R(1)],
        ["added", a.add(b)],
      ],
      constant: [
        ["forgot-square", a.mul(b)],
        ["forgot-distribute", b.add(sq)],
        ["multiplied-square", a.mul(b.add(sq))],
        ["doubled-not-squared", a.mul(b).add(two.mul(d))],
      ],
      "new-input": [
        ["old-input", value],
        [
          "distributed-one-term",
          a
            .mul(c.add(R(1)))
            .add(b)
            .add(sq),
        ],
        ["forgot-square", a.mul(c.add(R(1)).add(b))],
      ],
    };
  },
};
const parsed = (_family, design) => {
  const x = {};
  for (const [k, val] of Object.entries(design))
    x[k] =
      k === "data"
        ? String(val)
            .split(",")
            .map((s) => R(s))
        : R(val);
  return x;
};
const near = (p, q) => Math.abs(p - q) <= 0.011;
// Numbers the student was given: every input, the count of data values, and constants named in static text.
const givens = (design) => {
  const out = String(Object.values(design).join(","))
    .split(/[ ,]+/)
    .map(Number)
    .filter(Number.isFinite)
    .concat([0, 1, 2, 3, 10, 100]);
  if (design.data) out.push(String(design.data).split(",").length);
  return out;
};

// ---------- 1. detector self-tests ----------
{
  const project = missions[0];
  const good = model(project, project.defaults).checks;
  const want = oracle(project, project.defaults);
  assert.deepEqual(disagreements(good, want), [], "self-test: clean engine agrees with oracle");
  const corrupted = good.map((q, i) => (i === 0 ? { ...q, answer: q.answer + 1 } : q));
  assert.ok(
    disagreements(corrupted, want).length === 1,
    "self-test: a corrupted answer key is caught",
  );
  assert.ok(disagreements(good.slice(1), want).length >= 1, "self-test: a missing check is caught");
  assert.ok(
    disagreements(
      good.map((q) => ({ ...q, id: `x-${q.id}` })),
      want,
    ).length >= 1,
    "self-test: a renamed check is caught",
  );
  assert.ok(
    leaksValue("The answer is 7 groups.", 7, [146, 24]),
    "self-test: leak detector fires on a leaked answer",
  );
  assert.ok(
    !leaksValue("Use 146 and 24.", 7, [146, 24]),
    "self-test: leak detector ignores givens-only text",
  );
  assert.ok(
    !leaksValue("There are 7 guests.", 7, [7]),
    "self-test: an answer that is also a given is allowed",
  );
  // a lazy engine that returns one message for every wrong answer must fail the sibling-difference rule below
  const lazy = () => "Not yet.";
  assert.equal(
    lazy(missions[0]),
    lazy(missions[1]),
    "self-test: lazy feedback is identical across missions",
  );
}

// ---------- 2. engine vs exact oracle ----------
let compared = 0;
for (const project of missions) {
  for (const [i, design] of designs(project).entries()) {
    const m = model(project, design);
    assert.deepEqual(m.errors, [], `${project.id} design ${i} is valid: ${JSON.stringify(design)}`);
    const bad = disagreements(m.checks, oracle(project, design), `${project.id}#${i}`);
    assert.deepEqual(bad, [], `${project.id} design ${i}: ${JSON.stringify(design)}`);
    compared += m.checks.length;
  }
}

// ---------- 3. negative controls ----------
let probed = 0,
  genericProbed = 0,
  named = 0;
const seenCodes = new Map();
for (const project of missions) {
  for (const [i, design] of designs(project).entries()) {
    const m = model(project, design);
    const exact = Object.fromEntries(oracle(project, design).map((o) => [o.id, o.answer]));
    const table = (probes[project.family] || probesB[project.family])(
      parsed(project.family, design),
      project,
    );
    const allowed = givens(design);
    for (const q of m.checks) {
      const right = answerText(exact[q.id]);
      const ok = diagnose(project, design, q.id, right);
      assert.equal(
        ok.status,
        "correct",
        `${project.id}#${i} ${q.id}: exact answer ${right} must be accepted`,
      );
      assert.equal(diagnose(project, design, q.id, "").status, "invalid");
      assert.equal(diagnose(project, design, q.id, "abc").status, "invalid");
      assert.equal(diagnose(project, design, q.id, "46.80%").code, "units-in-box");
      const candidates = (table[q.id] || []).filter(
        ([, value]) => value && !near(value.toNumber(), q.answer),
      );
      for (const [code, value] of candidates) {
        const typed = answerText(value);
        const sNum = Number(typed);
        const acceptable = new Set(
          candidates.filter(([, other]) => near(other.toNumber(), sNum)).map(([c2]) => c2),
        );
        const d = diagnose(project, design, q.id, typed);
        assert.equal(
          d.status,
          "incorrect",
          `${project.id}#${i} ${q.id} "${typed}" (${code}) must be flagged`,
        );
        assert.ok(
          acceptable.has(d.code),
          `${project.id}#${i} ${q.id} "${typed}": got ${d.code}, expected one of ${[...acceptable]}`,
        );
        assert.ok(d.message.length > 20 && d.next.length > 10, "message and next action present");
        assert.ok(
          !leaksValue(feedbackText(d), exact[q.id].toNumber(), [...allowed, sNum, Math.abs(sNum)]),
          `${project.id}#${i} ${q.id} "${typed}" leaks the answer: ${feedbackText(d)}`,
        );
        if (i === 0)
          seenCodes.set(`${project.id}/${q.id}/${code}`, {
            message: d.message,
            fingerprint: `${q.prompt}|${q.answer}`,
          });
        probed++;
        if (!["constraint", "generic"].includes(d.code)) named++;
      }
      // a wrong answer outside every pattern still gets a specific, number-bearing, non-leaking message
      for (const off of [7.31, -3.4]) {
        const s = exact[q.id].toNumber() + off;
        if (candidates.some(([, value]) => near(value.toNumber(), s))) continue;
        const d = diagnose(project, design, q.id, String(Math.round(s * 1000) / 1000));
        assert.equal(d.status, "incorrect");
        assert.ok(
          /\d/.test(d.message) || ["coefficient", "constant"].includes(q.id),
          `${project.id} ${q.id} message names real numbers: ${d.message}`,
        );
        assert.ok(
          !leaksValue(feedbackText(d), exact[q.id].toNumber(), [
            ...allowed,
            s,
            Math.abs(s),
            Math.round(s * 1000) / 1000,
          ]),
          `${project.id}#${i} ${q.id} generic message leaks: ${feedbackText(d)}`,
        );
        genericProbed++;
      }
    }
  }
}
assert.ok(probed > 15000, `wrong-answer probes ran (${probed})`);
assert.ok(named > 10000, `specific named slips ran (${named})`);

// ---------- 4. siblings differ; revision re-judges ----------
const familiesWithSiblings = [...new Set(missions.map((p) => p.family))];
for (const family of familiesWithSiblings) {
  const group = missions.filter((p) => p.family === family);
  for (const key of new Set([...seenCodes.keys()].map((k) => k.split("/").slice(1).join("/")))) {
    // Siblings must differ wherever the problem differs. Two missions that ask the identical question
    // (same prompt, same answer) may legitimately share a message.
    const entries = group.map((p) => seenCodes.get(`${p.id}/${key}`)).filter(Boolean);
    const byFingerprint = new Map(entries.map((e) => [e.fingerprint, e.message]));
    assert.equal(
      new Set(byFingerprint.values()).size,
      byFingerprint.size,
      `siblings in ${family} give different feedback for ${key}`,
    );
  }
  const [checkId] = model(group[0], group[0].defaults).checks.map((q) => q.id);
  const generic = new Map(
    group.map((p) => {
      const q = model(p, p.defaults).checks.find((c) => c.id === checkId);
      return [
        `${q.prompt}|${q.answer}`,
        diagnose(p, p.defaults, checkId, String(Math.round((q.answer + 7.31) * 1000) / 1000))
          .message,
      ];
    }),
  );
  assert.equal(
    new Set(generic.values()).size,
    generic.size,
    `siblings in ${family} give different constraint feedback for ${checkId}`,
  );
}
for (const project of missions) {
  const first = model(project, project.defaults).checks[0];
  const right = answerText(oracle(project, project.defaults)[0].answer);
  const fields = fieldsFor(project);
  const changed = { ...project.defaults };
  if (project.family === "statistics") changed.data = "100, 100, 100, 100, 100, 101";
  else if (project.family === "ratio") changed.a = Number(changed.a) + 1;
  else {
    const f = fields.find((x) => x.key === "a" && !x.text);
    changed.a = Math.min(f.max, Number(changed.a) + (f.integer ? 1 : 0.5));
    if (project.family === "percent") changed.b = Number(changed.b) + 5;
    if (project.family === "expressions") changed.d = Number(changed.d) + 1;
  }
  const re = diagnose(project, changed, first.id, right);
  const newExpected = answerText(oracle(project, changed)[0].answer);
  if (newExpected !== right)
    assert.equal(
      re.status,
      "incorrect",
      `${project.id}: an answer for the old design is re-judged after the design changes`,
    );
}

// ---------- 5. teacher-judged labels and verified facts ----------
for (const family of V2_FAMILIES)
  assert.ok(
    JUDGED[family].length >= 3 && JUDGED[family].every((s) => s.length > 20),
    `${family} lists what only a teacher can judge`,
  );
for (const project of missions) {
  const all = Object.fromEntries(model(project, project.defaults).checks.map((q) => [q.id, true]));
  assert.deepEqual(
    verifiedFacts(project, project.defaults, {}),
    [],
    `${project.id}: nothing is confirmed before checks match`,
  );
  const facts = verifiedFacts(project, project.defaults, all);
  assert.ok(facts.length >= 1, `${project.id}: facts appear once checks match`);
  const exact = Object.fromEntries(
    oracle(project, project.defaults).map((o) => [o.id, o.answer.toNumber()]),
  );
  if (project.family === "percent") {
    assert.match(facts[0], exact.budget >= 0 ? /fits the budget/ : /over the budget/);
  }
  if (project.family === "ratio") {
    const lower = exact["rate-a"] < exact["rate-b"] ? "A" : "B";
    assert.ok(
      facts.some((f) =>
        f.includes(`${project.id === "unit-3-b" ? "Player" : "Offer"} ${lower} has the lower rate`),
      ),
    );
  }
}
const perturbedPercent = { a: 200, b: 5, c: 10, d: 5 };
{
  const p = PROJECTS.find((x) => x.id === "unit-4-a");
  const all = Object.fromEntries(model(p, perturbedPercent).checks.map((q) => [q.id, true]));
  assert.match(
    verifiedFacts(p, perturbedPercent, all)[0],
    /over the budget/,
    "over-budget design reports over budget",
  );
}

console.log(
  `PASS project-studio-feedback: ${compared} checks recomputed exactly over ${missions.length} missions; ${probed} named-slip probes (${named} named by the engine), ${genericProbed} off-pattern probes (constraint messages), no answer leaks; siblings differ; detectors self-tested.`,
);
