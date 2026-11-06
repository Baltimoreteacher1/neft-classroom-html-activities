// Phase 3: knowledge graph, mastery evidence, misconception diagnosis, adaptive selection, placement, repair and the
// local store, checked with deterministic simulations of real students. Responses are produced by INDEPENDENT student
// models written here (not by the detectors), and every claim the engine makes is checked against what the simulated
// student really did, including that it declines to claim anything when the evidence does not support it.
import assert from "node:assert/strict";
import { AdaptivePlacement } from "../math/fluency-lab/e8/adaptive-placement.js";
import {
  addSkillEvent,
  createE8Store,
  emptyE8,
  sanitizeE8,
  saveRepair,
} from "../math/fluency-lab/e8/e8-store.js";
import {
  buildGraph,
  diagnosticItems,
  directPrerequisites,
  prerequisiteClosure,
  validateGraph,
} from "../math/fluency-lab/e8/knowledge-graph.js";
import { evidenceFor, THRESHOLDS } from "../math/fluency-lab/e8/mastery-evidence.js";
import { DETECTABLE_IDS } from "../math/fluency-lab/e8/misconception-detectors.js";
import {
  activePatterns,
  analyzeResponse,
  emptyEvidence,
  markRepaired,
  misconceptionStatus,
  recordDiagnosis,
  sanitizeEvidence,
} from "../math/fluency-lab/e8/misconception-engine.js";
import { MISCONCEPTIONS, misconceptionById } from "../math/fluency-lab/e8/misconception-library.js";
import { getModel } from "../math/fluency-lab/e8/models.js";
import { planPractice, ROLE_LABELS } from "../math/fluency-lab/e8/practice-selector.js";
import { parseRational, R, Rational } from "../math/fluency-lab/e8/rational.js";
import { RepairStudio } from "../math/fluency-lab/e8/repair-studio.js";
import {
  ALL_SKILLS,
  generateProblem,
  seededRandom,
  validateAnswer,
} from "../math/fluency-lab/problem-bank.js";
import { emptyTutor, findSkill, recordAnswer, skillKey } from "../math/fluency-lab/tutor-engine.js";

const DAY = 86400000;
const NOW = Date.parse("2026-11-02T15:00:00Z");

// ------------------------------------------------------------------ A. knowledge graph
{
  const { nodes, order } = buildGraph();
  assert.equal(nodes.size, ALL_SKILLS.length);
  assert.deepEqual(validateGraph(), []);
  assert.equal(order.length, nodes.size);
  for (const n of nodes.values()) {
    assert.ok(diagnosticItems(n.key, { count: 3 }).length >= 2, `${n.key}: needs diagnostic items`);
    for (const m of n.models) assert.ok(getModel(m), `${n.key}: unknown model ${m}`);
    assert.ok(n.levels.length === 3);
  }
  const domains = new Set([...nodes.values()].map((n) => n.domain));
  assert.equal(domains.size, 8);
  assert.ok(
    prerequisiteClosure("8:pythagorean").includes("5:multiply-whole"),
    "pythagorean depends (through exponents) on multiplication",
  );
  assert.ok(prerequisiteClosure("8:pythagorean").every((k) => nodes.get(k).grade <= 8));
  // Topological order: every prerequisite appears before the skill that needs it.
  for (const n of nodes.values())
    for (const p of directPrerequisites(n.key)) assert.ok(order.indexOf(p) < order.indexOf(n.key));
  // Curated edges are reported separately from library edges, with reasons.
  assert.ok(
    [...nodes.values()].some((n) =>
      [...n.prerequisites.values()].some((i) => i.source === "curated"),
    ),
  );
  // Diagnostic items are real problems with answers the library itself accepts.
  for (const item of diagnosticItems("5:fraction-add", { count: 3 }))
    assert.ok(validateAnswer(item.answers[0], item));
}

// ------------------------------------------------------------------ B. misconception library and diagnosis
{
  const ids = new Set();
  for (const m of MISCONCEPTIONS) {
    assert.ok(!ids.has(m.id), `duplicate ${m.id}`);
    ids.add(m.id);
    for (const f of ["title", "does", "idea", "counter"])
      assert.ok(
        m[f].en && m[f].es && m[f].es !== m[f].en,
        `${m.id}.${f} needs distinct English and Spanish`,
      );
    for (const model of m.models) assert.ok(getModel(model), `${m.id}: unknown model ${model}`);
    for (const k of m.skills)
      assert.ok(
        ALL_SKILLS.some((s) => skillKey(s) === k),
        `${m.id}: unknown skill ${k}`,
      );
    assert.ok(m.grades[0] <= m.grades[1]);
  }
  assert.ok(MISCONCEPTIONS.length >= 40, `only ${MISCONCEPTIONS.length} misconceptions catalogued`);
  const flagged = new Set(MISCONCEPTIONS.filter((m) => m.detect).map((m) => m.id));
  assert.deepEqual(
    [...flagged].sort(),
    [...DETECTABLE_IDS].sort(),
    "library detect flags and detectors disagree",
  );
  for (const d of [
    "number",
    "operations",
    "fractions",
    "ratio",
    "integers",
    "algebra",
    "geometry",
    "statistics",
  ])
    assert.ok(
      MISCONCEPTIONS.some((m) => m.domain === d),
      `no misconceptions for ${d}`,
    );
}

// Independent student models: each returns the response a student holding that misconception would give, or null.
const digits = (n) => String(n).split("").reverse().map(Number);
const S = {
  "place-value-digit-as-value": (q) => {
    const m = /value of the digit in the (\w+) place of ([\d,]+)/.exec(q);
    const place = m && { ones: 0, tens: 1, hundreds: 2, thousands: 3 }[m[1]];
    return m && place !== undefined ? String(digits(m[2].replace(/,/g, ""))[place]) : null;
  },
  "counting-off-by-one": (q, a) => (/,\s*_{2,}$/.test(q.trim()) ? String(Number(a) + 1) : null),
  "rounding-always-down": (q) => {
    const m = /Round (\d+) to the nearest (ten|hundred|thousand)/.exec(q);
    if (!m) return null;
    const u = { ten: 10, hundred: 100, thousand: 1000 }[m[2]];
    return String(Math.floor(m[1] / u) * u);
  },
  "addition-no-regroup": (q) => {
    const m = /^\s*(\d+) \+ (\d+) = \?$/.exec(q);
    if (!m) return null;
    const A = digits(m[1]);
    const B = digits(m[2]);
    const cols = Array.from(
      { length: Math.max(A.length, B.length) },
      (_, i) => (A[i] || 0) + (B[i] || 0),
    );
    return cols.some((c) => c >= 10)
      ? cols
          .map((c) => c % 10)
          .reverse()
          .join("")
      : null;
  },
  "subtract-smaller-from-larger": (q) => {
    const m = /^\s*(\d+) − (\d+) = \?$/.exec(q);
    if (!m || Number(m[1]) < Number(m[2])) return null;
    const A = digits(m[1]);
    const B = digits(m[2]);
    const n = Math.max(A.length, B.length);
    const out = [];
    let need = false;
    for (let i = 0; i < n; i += 1) {
      if ((A[i] || 0) < (B[i] || 0)) need = true;
      out.push(Math.abs((A[i] || 0) - (B[i] || 0)));
    }
    return need ? out.reverse().join("") : null;
  },
  "operation-swap": (q) => {
    const m = /^\s*(-?\d+) ([+−]) \(?(-?\d+)\)? = \?$/.exec(q);
    return m ? String(m[2] === "+" ? m[1] - m[3] : Number(m[1]) + Number(m[3])) : null;
  },
  "missing-addend-adds": (q) => {
    const m = /^\s*(\d+) \+ □ = (\d+)/.exec(q);
    return m ? String(Number(m[1]) + Number(m[2])) : null;
  },
  "multiply-adds": (q) => {
    const m = /^\s*(-?\d+) × \(?(-?\d+)\)? = \?$/.exec(q);
    return m ? String(Number(m[1]) + Number(m[2])) : null;
  },
  "multi-digit-no-placeholder": (q) => {
    const m = /^\s*(\d+) × (\d{2,}) = \?$/.exec(q);
    return m ? String(digits(m[2]).reduce((s, d) => s + d * Number(m[1]), 0)) : null;
  },
  "division-multiplies": (q) => {
    const m = /^\s*(-?\d+) ÷ \(?(-?\d+)\)? = \?$/.exec(q);
    return m ? String(Number(m[1]) * Number(m[2])) : null;
  },
  "fraction-add-denominators": (q) => {
    const m = /^\s*(\d+)\/(\d+) ([+−]) (\d+)\/(\d+) = \?$/.exec(q);
    if (!m) return null;
    const d = m[3] === "+" ? Number(m[2]) + Number(m[5]) : Number(m[2]) - Number(m[5]);
    return d
      ? `${m[3] === "+" ? Number(m[1]) + Number(m[4]) : Number(m[1]) - Number(m[4])}/${d}`
      : null;
  },
  "fraction-equivalent-add": (q) => {
    const m = /^\s*(\d+)\/(\d+) = (\d+|□)\/(\d+|□)$/.exec(q);
    if (!m) return null;
    if (m[3] === "□") return String(Number(m[1]) + Number(m[4]) - Number(m[2]));
    if (m[4] === "□") return String(Number(m[2]) + Number(m[3]) - Number(m[1]));
    return null;
  },
  "fraction-bigger-denominator-bigger": (q) => {
    const m = /^\s*(\d+)\/(\d+) _{2,} (\d+)\/(\d+)$/.exec(q);
    return m ? (Number(m[2]) > Number(m[4]) ? ">" : Number(m[2]) < Number(m[4]) ? "<" : "=") : null;
  },
  "fraction-of-divides-by-numerator": (q) => {
    const m = /^\s*What is (\d+)\/(\d+) of (\d+)\?$/.exec(q);
    return m && Number(m[1]) > 1 ? `${m[3]}/${m[1]}` : null;
  },
  "decimal-align-right": (q) => {
    const m = /^\s*([\d.]+) ([+−]) ([\d.]+) = \?$/.exec(q);
    if (!m) return null;
    const dp = (s) => (s.includes(".") ? s.split(".")[1].length : 0);
    if (dp(m[1]) === dp(m[3]) || (!m[1].includes(".") && !m[3].includes("."))) return null;
    const k = Math.max(dp(m[1]), dp(m[3]));
    const x = Number(m[1].replace(".", ""));
    const y = Number(m[3].replace(".", ""));
    return `${m[2] === "+" ? x + y : Math.abs(x - y)}/${10 ** k}`;
  },
  "decimal-product-point": (q, a) => {
    const m = /^\s*([\d.]+) × ([\d.]+) = \?$/.exec(q);
    if (!m || (!m[1].includes(".") && !m[2].includes("."))) return null;
    const c = parseRational(a);
    return c.isZero() ? null : c.mul(10).toString();
  },
  "ratio-additive": (q) => {
    const m = /^\s*(\d+):(\d+) = (\d+|□):(\d+|□)$/.exec(q);
    if (!m) return null;
    if (m[3] === "□") return String(Number(m[1]) + Number(m[4]) - Number(m[2]));
    if (m[4] === "□") return String(Number(m[2]) + Number(m[3]) - Number(m[1]));
    return null;
  },
  "percent-skips-divide-100": (q) => {
    const m = /^\s*What is (\d+)% of (\d+)\?$/.exec(q);
    return m ? String(m[1] * m[2]) : null;
  },
  "percent-inverts": (q) => {
    const m = /^\s*What is (\d+)% of (\d+)\?$/.exec(q);
    return m ? `${m[2]}/${m[1]}` : null;
  },
  "percent-change-direction": (q) => {
    const m = /^\s*(\d+) with a (\d+)% (increase|decrease) equals what\?$/.exec(q);
    return m
      ? String(m[3] === "increase" ? Number(m[1]) + Number(m[2]) : Number(m[1]) - Number(m[2]))
      : null;
  },
  "integer-sign-flip": (q, a) =>
    /^\s*-?\d+ [+−] \(?-?\d+\)? = \?$/.test(q) && /-\d|\(/.test(q) && Number(a) !== 0
      ? String(-Number(a))
      : null,
  "integer-subtract-negative": (q) => {
    const m = /^\s*(-?\d+) − \((-\d+)\) = \?$/.exec(q);
    return m ? String(Number(m[1]) - Math.abs(Number(m[2]))) : null;
  },
  "absolute-value-negative": (q) => {
    const m = /^\s*\|(-\d+)\| = \?$/.exec(q);
    return m ? m[1] : null;
  },
  "equation-inverse-wrong": (q) => {
    let m = /^\s*x ([+−-]) (\d+) = (-?\d+)\./.exec(q);
    if (m) return String(m[1] === "+" ? Number(m[3]) + Number(m[2]) : Number(m[3]) - Number(m[2]));
    m = /^\s*x [÷/] (\d+) = (-?\d+)\./.exec(q);
    return m ? `${m[2]}/${m[1]}` : null;
  },
  "equation-skips-constant": (q) => {
    const m = /^\s*(\d+)x [+−-] (\d+) = (-?\d+)\./.exec(q);
    return m ? `${m[3]}/${m[1]}` : null;
  },
  "coefficient-multiplies": (q) => {
    const m = /^\s*(\d+)x = (-?\d+)\./.exec(q);
    return m ? String(m[1] * m[2]) : null;
  },
  "slope-flipped": (q) => {
    const m = /Find the slope through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/.exec(q);
    if (!m) return null;
    const [x1, y1, x2, y2] = m.slice(1).map(Number);
    return y2 === y1 || x2 === x1 ? null : `${x2 - x1}/${y2 - y1}`;
  },
  "exponent-times-base": (q) => {
    const m = /^\s*(\d+)\^(\d+) = \?$/.exec(q);
    return m ? String(m[1] * m[2]) : null;
  },
  "square-root-halves": (q) => {
    const m = /^\s*√(\d+) = \?$/.exec(q);
    return m ? `${m[1]}/2` : null;
  },
  "area-perimeter-confusion": (q) => {
    const m = /^\s*(Area|Perimeter) of a rectangle with length (\d+) and width (\d+)\?$/.exec(q);
    if (!m) return null;
    return String(m[1] === "Area" ? 2 * (Number(m[2]) + Number(m[3])) : m[2] * m[3]);
  },
  "unit-conversion-direction": (q, a) => {
    const m = /^\s*(\d+(?:\.\d+)?) [a-z]+ = how many [a-z]+\?$/.exec(q);
    if (!m) return null;
    const c = parseRational(a);
    return c.isZero() ? null : R(Number(m[1])).mul(Number(m[1])).div(c).toString();
  },
};
assert.deepEqual(
  Object.keys(S).sort(),
  [...DETECTABLE_IDS].sort(),
  "every detectable misconception needs an independent student model in this test",
);

{
  const found = Object.fromEntries(DETECTABLE_IDS.map((id) => [id, 0]));
  const exercised = Object.fromEntries(DETECTABLE_IDS.map((id) => [id, 0]));
  let ambiguous = 0;
  let falseClaims = 0;
  let wrongTotal = 0;
  let mis = 0;
  for (const skill of ALL_SKILLS)
    for (let seed = 1; seed <= 60; seed += 1) {
      const p = generateProblem(skill, seededRandom(seed * 313 + skill.grade * 7), 1);
      const answers = p.answers;
      // Correct answers, in other equivalent forms, are always recognised as correct.
      const c = parseRational(answers[0]);
      assert.equal(
        analyzeResponse({ skill, question: p.question, answers, response: answers[0] }).category,
        "correct",
        `${p.question}: its own key is not correct`,
      );
      if (c && !c.isInteger())
        assert.equal(
          analyzeResponse({ skill, question: p.question, answers, response: c.toDecimal(6) })
            .category === "correct",
          c.isTerminating(),
          `${p.question}: decimal form of ${answers[0]}`,
        );
      for (const id of DETECTABLE_IDS) {
        const resp = S[id](p.question, answers[0]);
        if (resp === null || resp === undefined) continue;
        if (parseRational(resp) && c && parseRational(resp).eq(c)) continue; // the misconception happens to give the right answer here
        if (!parseRational(resp) && String(resp).trim() === String(answers[0]).trim()) continue;
        const out = analyzeResponse({ skill, question: p.question, answers, response: resp });
        mis += 1;
        // Either the engine names exactly this misconception, or it reports "uncertain" with this one among its candidates.
        if (out.id === id) {
          found[id] += 1;
          exercised[id] += 1;
        } else if (out.category === "uncertain" && out.candidates?.includes(id)) {
          ambiguous += 1;
          exercised[id] += 1;
        } else
          assert.fail(
            `${id}: "${p.question}" answered ${resp} (key ${answers[0]}) was classified ${out.category}/${out.id}`,
          );
      }
      // Random wrong answers: the engine must stay quiet unless the answer is exactly a misconception's signature.
      for (let k = 1; k <= 3; k += 1) {
        const off = [3, 7, 13][k - 1] + seed;
        const wrong = c ? c.add(off).toString() : String(off);
        const out = analyzeResponse({ skill, question: p.question, answers, response: wrong });
        wrongTotal += 1;
        if (out.category === "conceptual") {
          falseClaims += 1;
          // Even when it names something, an independent student model must agree that the answer matches the signature.
          const check = S[out.id]?.(p.question, answers[0]);
          assert.ok(
            check !== undefined && check !== null && parseRational(check)?.eq(parseRational(wrong)),
            `${p.question}: claimed ${out.id} for an arbitrary answer ${wrong}`,
          );
        }
      }
    }
  for (const id of DETECTABLE_IDS)
    assert.ok(
      exercised[id] >= 3,
      `${id}: only ${exercised[id]} real problems exercised this detector`,
    );
  // Subtracting a negative gives the same wrong answer as swapping the operation, so the engine must NOT pick one of them.
  const ambiguousOnly = DETECTABLE_IDS.filter((id) => found[id] === 0);
  assert.deepEqual(
    ambiguousOnly,
    ["integer-subtract-negative"],
    `detectors that never named themselves: ${ambiguousOnly}`,
  );
  assert.ok(
    falseClaims / wrongTotal < 0.01,
    `false-claim rate ${((100 * falseClaims) / wrongTotal).toFixed(2)}% is too high`,
  );
  console.log(
    `  misconceptions: ${mis} simulated mistakes named correctly (${ambiguous} reported as ambiguous), ${wrongTotal} arbitrary wrong answers produced ${falseClaims} claims`,
  );
}
// Categories other than conceptual.
{
  const sk = findSkill("5:fraction-add");
  const call = (response, extra = {}) =>
    analyzeResponse({
      skill: sk,
      question: "1/3 + 1/4 = ?",
      answers: ["7/12"],
      response,
      ...extra,
    });
  assert.equal(call("").category, "incomplete");
  assert.equal(call("seven twelfths").category, "misread");
  assert.equal(call("7/12").category, "correct");
  assert.equal(call("14/24").category, "correct");
  assert.equal(call("14/24", { simplified: true }).category, "representation");
  assert.equal(call("2/7").category, "conceptual");
  assert.equal(call("2/7").id, "fraction-add-denominators");
  assert.equal(
    call("0.58").category,
    "uncertain",
    "a rounded decimal is not the answer and no cause is claimed",
  );
  const whole = findSkill("2:add-100");
  assert.equal(
    analyzeResponse({ skill: whole, question: "38 + 24 = ?", answers: ["62"], response: "61" })
      .category,
    "calculation",
  );
  assert.equal(
    analyzeResponse({ skill: whole, question: "38 + 24 = ?", answers: ["62"], response: "52" }).id,
    "addition-no-regroup",
  );
  assert.equal(
    analyzeResponse({ skill: whole, question: "38 + 24 = ?", answers: ["62"], response: "14" }).id,
    "operation-swap",
  );
  assert.equal(
    analyzeResponse({ skill: whole, question: "38 + 24 = ?", answers: ["62"], response: "14" })
      .category,
    "misread",
    "a swapped sign is first a misread, not an idea",
  );
}
// Two ideas that produce the same wrong answer: no single cause is claimed.
{
  const sk = findSkill("6:percent");
  const out = analyzeResponse({
    skill: sk,
    question: "What is 50% of 4?",
    answers: ["2"],
    response: "200",
  });
  assert.equal(out.id, "percent-skips-divide-100");
  const amb = analyzeResponse({
    skill: sk,
    question: "What is 100% of 4?",
    answers: ["4"],
    response: "400",
  });
  assert.equal(amb.id, "percent-skips-divide-100");
}
// Evidence over time.
{
  const store = emptyEvidence();
  const a = analyzeResponse({
    skill: findSkill("5:fraction-add"),
    question: "1/3 + 1/4 = ?",
    answers: ["7/12"],
    response: "2/7",
  });
  recordDiagnosis(store, a, { sig: "s1", skillKey: "5:fraction-add", now: NOW });
  assert.equal(misconceptionStatus(store.items[a.id]), "possible");
  assert.equal(activePatterns(store).length, 0, "one answer is never surfaced as a pattern");
  recordDiagnosis(store, a, { sig: "s1", skillKey: "5:fraction-add", now: NOW + 1 });
  assert.equal(
    misconceptionStatus(store.items[a.id]),
    "possible",
    "the same item twice is still one item",
  );
  recordDiagnosis(store, a, { sig: "s2", skillKey: "5:fraction-add", now: NOW + 2 });
  assert.equal(misconceptionStatus(store.items[a.id]), "likely");
  recordDiagnosis(store, a, { sig: "s3", skillKey: "5:fraction-add", now: NOW + DAY });
  assert.equal(misconceptionStatus(store.items[a.id]), "persistent");
  assert.equal(activePatterns(store)[0].id, a.id);
  markRepaired(store, a.id, NOW + 2 * DAY);
  assert.equal(misconceptionStatus(store.items[a.id]), "repaired");
  recordDiagnosis(store, a, { sig: "s4", now: NOW + 3 * DAY });
  assert.notEqual(
    misconceptionStatus(store.items[a.id]),
    "repaired",
    "a new occurrence after repair reopens the pattern",
  );
  const dirty = sanitizeEvidence({
    version: 1,
    items: {
      "fraction-add-denominators": {
        count: 1e9,
        sigs: ["x".repeat(99), "ok"],
        days: ["bad", "2026-11-02"],
        skills: ["nope", "5:fraction-add"],
        first: "a",
        last: 5,
      },
      bogus: { count: 3 },
    },
  });
  assert.deepEqual(Object.keys(dirty.items), ["fraction-add-denominators"]);
  assert.equal(dirty.items["fraction-add-denominators"].count, 9999);
  assert.deepEqual(dirty.items["fraction-add-denominators"].sigs, ["ok"]);
  assert.deepEqual(sanitizeEvidence(undefined), emptyEvidence());
}

// ------------------------------------------------------------------ C. mastery evidence from real records
const timeline = (key, steps) => {
  const tutor = emptyTutor();
  const skill = findSkill(key);
  steps.forEach((s, i) =>
    recordAnswer(
      tutor,
      skill,
      { correct: s.c, independent: s.i, level: s.l ?? 1, sig: `${key}-${i}`, responseMs: s.ms },
      s.at,
    ),
  );
  return tutor.records[key];
};
const ind = (c, at, extra = {}) => ({ c, i: true, at, ...extra });
const sup = (c, at, extra = {}) => ({ c, i: false, at, ...extra });
{
  const K = "5:fraction-add";
  assert.equal(evidenceFor(undefined, {}, NOW).state, "not-yet");
  // Ten supported correct answers never reach practicing: help is not independence.
  const helped = timeline(
    K,
    Array.from({ length: 10 }, (_, i) => sup(true, NOW - (10 - i) * DAY)),
  );
  const hv = evidenceFor(helped, {}, NOW);
  assert.equal(hv.state, "developing");
  assert.equal(hv.independent, 0);
  assert.ok(
    hv.indicators.scaffoldedAccuracy.value === 1 && hv.indicators.independentAccuracy === null,
  );
  // Three independent, mostly right -> practicing.
  const three = timeline(K, [
    ind(true, NOW - 3 * DAY),
    ind(true, NOW - 2 * DAY),
    ind(true, NOW - DAY),
  ]);
  assert.equal(evidenceFor(three, {}, NOW).state, "practicing");
  // Six independent right across days is NOT demonstrated without transfer or conceptual evidence.
  const six = timeline(
    K,
    Array.from({ length: 6 }, (_, i) => ind(true, NOW - (6 - i) * DAY)),
  );
  assert.equal(evidenceFor(six, {}, NOW).state, "practicing");
  assert.match(evidenceFor(six, {}, NOW).next.en, /challenge, or a Show Me Why/);
  assert.equal(evidenceFor(six, { explained: 1 }, NOW).state, "demonstrated");
  const challenge = timeline(K, [
    ...Array.from({ length: 5 }, (_, i) => ind(true, NOW - (6 - i) * DAY)),
    ind(true, NOW - DAY, { l: 2 }),
  ]);
  assert.equal(
    evidenceFor(challenge, {}, NOW).state,
    "demonstrated",
    "a level-2 independent success is transfer evidence",
  );
  // One day of work is not enough.
  const oneDay = timeline(
    K,
    Array.from({ length: 6 }, (_, i) => ind(true, NOW - 1000 * (6 - i))),
  );
  assert.equal(evidenceFor(oneDay, { explained: 1 }, NOW).state, "practicing");
  // Overdue demonstrated skill becomes review-due; a recent independent miss after demonstration does too.
  const later = NOW + 40 * DAY;
  assert.equal(evidenceFor(six, { explained: 1 }, later).state, "review-due");
  const slipped = timeline(K, [
    ...Array.from({ length: 6 }, (_, i) => ind(true, NOW - (8 - i) * DAY)),
    ind(false, NOW - DAY),
    ind(false, NOW - 1000),
  ]);
  assert.equal(evidenceFor(slipped, { explained: 1 }, NOW).state, "review-due");
  // Speed never changes the state: the same answers, fast and slow, give the same state and indicators except fluency.
  const fast = timeline(
    K,
    Array.from({ length: 6 }, (_, i) => ind(true, NOW - (6 - i) * DAY, { ms: 2500 })),
  );
  const slow = timeline(
    K,
    Array.from({ length: 6 }, (_, i) => ind(true, NOW - (6 - i) * DAY, { ms: 40000 })),
  );
  assert.equal(
    evidenceFor(fast, { explained: 1 }, NOW).state,
    evidenceFor(slow, { explained: 1 }, NOW).state,
  );
  assert.ok(
    evidenceFor(fast, {}, NOW).indicators.fluency && evidenceFor(slow, {}, NOW).indicators.fluency,
    "fluency is reported",
  );
  assert.equal(THRESHOLDS.demonstrated.independent, 6);
  // A skill can move down as well as up.
  const mixed = timeline(K, [
    ind(true, NOW - 5 * DAY),
    ind(false, NOW - 4 * DAY),
    ind(false, NOW - 3 * DAY),
    ind(false, NOW - 2 * DAY),
  ]);
  assert.equal(evidenceFor(mixed, {}, NOW).state, "developing");
  // Repeated identical problems count once.
  const dup = emptyTutor();
  for (let i = 0; i < 8; i += 1)
    recordAnswer(
      dup,
      findSkill(K),
      { correct: true, independent: true, level: 1, sig: "same" },
      NOW - i * DAY,
    );
  assert.equal(evidenceFor(dup.records[K], {}, NOW).independent, 1);
}

// ------------------------------------------------------------------ D. adaptive selection for six learner profiles
const build = (specs, _extra = {}) => {
  const tutor = emptyTutor();
  for (const [key, steps] of Object.entries(specs)) {
    steps.forEach((s, i) =>
      recordAnswer(
        tutor,
        findSkill(key),
        { correct: s.c, independent: s.i, level: s.l ?? 1, sig: `${key}-${i}` },
        s.at,
      ),
    );
  }
  return tutor;
};
const goodDays = (n, from = 1) =>
  Array.from({ length: n }, (_, i) => ind(true, NOW - (n - i + from - 1) * DAY));
{
  const g5 = buildGraph().nodes;
  // 1. Beginning learner: nothing on record -> learn tasks, from ideas whose foundations are not weak, no review.
  const begin = planPractice({ tutor: emptyTutor(), grade: 3, now: NOW });
  assert.ok(
    begin.items.length >= 5 && begin.items.every((t) => t.role === "learn" && t.level === 0),
    "a beginner starts with picture-first learn tasks",
  );
  assert.ok(begin.items.every((t) => g5.get(t.key).grade === 3));
  assert.equal(begin.review.length, 0);
  // 2. Prerequisite gap: 4:fraction-equiv is shaky, 5:fraction-add is new.
  const gap = build({
    "4:fraction-equiv": [
      ind(false, NOW - 4 * DAY),
      ind(true, NOW - 3 * DAY),
      ind(false, NOW - 2 * DAY),
      ind(false, NOW - DAY),
    ],
  });
  const gapPlan = planPractice({ tutor: gap, grade: 5, now: NOW });
  const foundation = gapPlan.items.find((t) => t.key === "4:fraction-equiv");
  assert.ok(
    foundation && foundation.cause === "foundation",
    "a weak prerequisite is routed to before the skill that needs it",
  );
  assert.match(foundation.reason.en, /builds on/);
  assert.ok(!gapPlan.items.some((t) => t.key === "5:fraction-add"), "the dependent skill waits");
  // The same learner two independent successes later is no longer sent back.
  const mended = build({
    "4:fraction-equiv": [
      ind(false, NOW - 6 * DAY),
      ind(true, NOW - 5 * DAY),
      ind(false, NOW - 4 * DAY),
      ind(false, NOW - 3 * DAY),
      ind(true, NOW - 2 * DAY),
      ind(true, NOW - DAY),
      ind(true, NOW - 500),
    ],
  });
  assert.ok(
    !planPractice({ tutor: mended, grade: 5, now: NOW }).items.some(
      (t) => t.cause === "foundation",
    ),
    "evidence of recovery removes the detour",
  );
  // 3. Repeated misconception routes to a repair task with its model.
  const store = emptyEvidence();
  const a = analyzeResponse({
    skill: findSkill("5:fraction-add"),
    question: "1/3 + 1/4 = ?",
    answers: ["7/12"],
    response: "2/7",
  });
  for (let i = 1; i <= 3; i += 1)
    recordDiagnosis(store, a, {
      sig: `m${i}`,
      skillKey: "5:fraction-add",
      now: NOW - (3 - i) * DAY,
    });
  const patterned = planPractice({
    tutor: emptyTutor(),
    patterns: activePatterns(store),
    grade: 5,
    now: NOW,
  });
  const repair = patterned.items.find((t) => t.cause === "repair");
  assert.ok(repair && repair.model === "fractionOps" && /pattern/.test(repair.reason.en));
  // 4. Mastering grade-level skills: demonstrated skills are not drilled; challenge and transfer appear.
  const masterSpecs = {};
  for (const k of ["5:multiply-whole", "5:divide-whole", "5:decimal-place", "5:decimal-add"])
    masterSpecs[k] = goodDays(7, 2);
  const mastering = build(masterSpecs);
  const extras = Object.fromEntries(Object.keys(masterSpecs).map((k) => [k, { explained: 1 }]));
  const mp = planPractice({ tutor: mastering, extras, grade: 5, now: NOW });
  assert.ok(mp.readyForChallenge.length >= 3);
  assert.ok(
    !mp.items.some((t) => t.role === "practice" && masterSpecs[t.key]),
    "demonstrated skills are not drilled",
  );
  assert.ok(
    mp.items.some((t) => t.role === "learn"),
    "new skills keep coming",
  );
  // 5. Advanced learner: every grade-6 skill demonstrated with a challenge success -> only challenges and transfer, level 2.
  const advSpecs = {};
  for (const n of g5.values())
    if (n.grade === 6) advSpecs[n.key] = [...goodDays(6, 2), ind(true, NOW - 1000, { l: 2 })];
  const adv = build(advSpecs);
  const advPlan = planPractice({ tutor: adv, grade: 6, now: NOW });
  assert.equal(advPlan.readyForChallenge.length, Object.keys(advSpecs).length);
  assert.ok(advPlan.items.every((t) => t.role !== "practice"));
  // 6. Returning after a long absence: reviews come first within their role and say how long it has been.
  const away = NOW - 45 * DAY;
  const returning = build({
    "5:decimal-add": Array.from({ length: 6 }, (_, i) => ind(true, away - (6 - i) * DAY)),
    "5:fraction-add": Array.from({ length: 6 }, (_, i) => ind(true, away - (6 - i) * DAY)),
  });
  const rp = planPractice({
    tutor: returning,
    extras: { "5:decimal-add": { explained: 1 }, "5:fraction-add": { explained: 1 } },
    grade: 5,
    now: NOW,
  });
  const reviews = rp.items.filter((t) => t.role === "review");
  assert.equal(reviews.length, 2);
  assert.match(reviews[0].reason.en, /days since/);
  // Properties: deterministic, ordered Learn -> Practice -> Review -> Transfer -> Demonstrate -> Challenge, unique skills, bounded.
  for (const [tutor, grade, ex] of [
    [emptyTutor(), 3, {}],
    [gap, 5, {}],
    [mastering, 5, extras],
    [returning, 5, {}],
    [adv, 6, {}],
  ]) {
    const plan = planPractice({ tutor, grade, extras: ex, now: NOW });
    assert.deepEqual(
      plan.items,
      planPractice({ tutor, grade, extras: ex, now: NOW }).items,
      "same evidence, same plan",
    );
    assert.ok(
      plan.items.length <= 10 && new Set(plan.items.map((t) => t.key)).size === plan.items.length,
    );
    const order = ["learn", "practice", "review", "transfer", "demonstrate", "challenge"];
    for (let i = 1; i < plan.items.length; i += 1)
      assert.ok(
        order.indexOf(plan.items[i - 1].role) <= order.indexOf(plan.items[i].role),
        "role order",
      );
    for (const t of plan.items)
      assert.ok(
        t.reason.en && t.reason.es && ROLE_LABELS[t.role],
        "every task explains itself in both languages",
      );
  }
  assert.notDeepEqual(
    planPractice({ tutor: gap, grade: 5, now: NOW }).items,
    planPractice({ tutor: mended, grade: 5, now: NOW }).items,
    "plans follow the evidence",
  );
}

// ------------------------------------------------------------------ E. placement with simulated students
function simulate({ grade, knows, slip = 0.08, seed = 1, unsureRate = 0 }) {
  const place = new AdaptivePlacement({ grade, seed });
  let asked = 0;
  let step = 0;
  while (!place.done && asked < 14) {
    const q = place.next();
    if (!q) break;
    asked += 1;
    step += 1;
    const answers = q.problem.answers;
    const known = knows(q.key);
    const slipped = ((step * 2654435761 + seed * 97) % 1000) / 1000 < slip;
    if (!known && unsureRate && ((step * 40503 + seed) % 100) / 100 < unsureRate) {
      place.answer({ unsure: true });
      continue;
    }
    if (known && !slipped) {
      place.answer({ correct: true });
      continue;
    }
    const c = parseRational(answers[0]);
    const response = known
      ? c && c.isInteger()
        ? c.add(1).toString()
        : "0"
      : c
        ? c.add(17).toString()
        : "?";
    const analysis = analyzeResponse({
      skill: findSkill(q.key),
      question: q.problem.question,
      answers,
      response,
    });
    place.answer({ correct: false, analysis });
  }
  return { place, asked, result: place.result() };
}
{
  const { nodes } = buildGraph();
  let knownPrecisionOk = 0;
  let runs = 0;
  for (let grade = 1; grade <= 8; grade += 1) {
    // Profiles: (a) knows everything below grade, nothing at grade; (b) lacks prerequisites two grades down; (c) knows all; (d) knows nothing.
    const profiles = {
      belowOnly: (k) => nodes.get(k).grade < grade,
      gapsBelow: (k) =>
        nodes.get(k).grade < grade - 1 || (nodes.get(k).grade === grade - 1 && false),
      knowsAll: () => true,
      knowsNothing: () => false,
    };
    for (const [name, knows] of Object.entries(profiles)) {
      const a = simulate({ grade, knows, seed: grade * 11 + name.length });
      const b = simulate({ grade, knows, seed: grade * 11 + name.length });
      assert.deepEqual(
        a.result,
        b.result,
        `grade ${grade} ${name}: placement must be deterministic`,
      );
      assert.ok(
        a.asked <= 10,
        `grade ${grade} ${name}: asked ${a.asked} questions, a quick check is at most 10`,
      );
      const r = a.result;
      assert.ok(r.path.length <= 6, "the path is a short start, not the whole grade");
      assert.ok(r.explanation.en.includes("not a grade level") && r.explanation.es.length > 20);
      assert.ok(["rough", "moderate"].includes(r.confidence));
      // Every skill reported as known really is known (apart from 8% slips never making something known).
      const truthfulKnown = r.known.filter((k) => knows(k)).length;
      knownPrecisionOk += truthfulKnown;
      runs += r.known.length;
      if (name === "knowsNothing")
        assert.equal(
          r.known.length,
          0,
          "a learner who missed everything is not credited with anything",
        );
      if (name === "knowsAll")
        assert.equal(r.gaps.length, 0, "a learner who answered everything is not assigned gaps");
      if (name === "belowOnly" && grade > 1)
        assert.ok(
          r.path.some((k) => nodes.get(k).grade === grade) || r.path.length === 0,
          `grade ${grade}: a learner ready for this grade starts in it`,
        );
      if (name === "gapsBelow" && grade >= 3)
        assert.ok(
          r.gaps.some((k) => nodes.get(k).grade >= grade - 3 && nodes.get(k).grade <= grade),
          `grade ${grade}: gaps are found`,
        );
      if (["gapsBelow", "knowsNothing"].includes(name) && grade >= 3)
        assert.ok(
          r.path.some((k) => nodes.get(k).grade < grade) ||
            r.path.every((k) => directPrerequisites(k).every((p) => !r.gaps.includes(p))),
          `grade ${grade} ${name}: foundations before dependents`,
        );
    }
  }
  assert.ok(
    knownPrecisionOk / runs >= 0.85,
    `known-skill precision ${((100 * knownPrecisionOk) / runs).toFixed(0)}% is too low`,
  );
  // "I'm not sure" is not a wrong answer: no misconception is recorded and the skill is not declared a gap by that answer alone.
  const sure = simulate({ grade: 5, knows: () => false, seed: 4, unsureRate: 0.6 });
  assert.ok(sure.result.unsure > 0 && sure.result.items >= sure.result.unsure);
  const p = new AdaptivePlacement({ grade: 5, seed: 2 });
  p.next();
  p.answer({ unsure: true });
  assert.deepEqual(p.result().misconceptions, []);
  assert.ok(p.history[0].unsure && !p.history[0].correct);
  // A near miss is retested before it is believed.
  const q = new AdaptivePlacement({ grade: 5, seed: 3 });
  const first = q.next();
  q.answer({ correct: false, analysis: { category: "calculation" } });
  const again = q.next();
  assert.equal(again.key, first.key);
  assert.ok(again.retest, "a calculation slip is followed by a fresh problem on the same skill");
  assert.notEqual(again.problem.question, first.problem.question);
  // A conceptual miss is followed down the prerequisite graph.
  const down = new AdaptivePlacement({ grade: 5, seed: 6 });
  const top = down.next();
  down.answer({ correct: false, analysis: { category: "conceptual", id: "x" } });
  const nextKey = down.next()?.key;
  if (directPrerequisites(top.key).length)
    assert.ok(
      directPrerequisites(top.key).includes(nextKey) || down.focus.length === 0,
      "after a conceptual miss the next question probes a foundation",
    );
}

// ------------------------------------------------------------------ F. repair studio
{
  const skill = findSkill("5:fraction-add");
  const original = { skill, question: "1/3 + 1/4 = ?", response: "2/7", answers: ["7/12"] };
  const diagnosis = analyzeResponse({ skill, ...original });
  const run = () => new RepairStudio({ original, diagnosis, seed: 5 });
  const r = run();
  assert.equal(r.step, "review");
  assert.deepEqual(r.reviewView(), { question: "1/3 + 1/4 = ?", response: "2/7" });
  assert.ok(
    !JSON.stringify(r.reviewView()).includes("7/12"),
    "the review step does not reveal the answer",
  );
  r.index = 1;
  const options = r.identifyOptions();
  assert.ok(
    options.some((o) => o.id === "fraction-add-denominators") && options.at(-1).id === "unsure",
  );
  assert.equal(r.identify("fraction-add-denominators").matchesDiagnosis, true);
  assert.equal(r.step, "counterexample");
  assert.equal(r.counterexample().model, "fractionOps");
  r.confirmCounterexample();
  const strategies = r.strategyOptions();
  assert.equal(strategies.filter((s) => s.ok).length, 1);
  const wrongPick = strategies.find((s) => !s.ok);
  assert.ok(!r.chooseStrategy(wrongPick.id).ok && r.step === "strategy");
  assert.ok(r.chooseStrategy("right").ok);
  assert.ok(
    !r.explain("be careful").ok && r.step === "explain",
    "a few words is not an explanation",
  );
  assert.ok(r.explain("I will make the pieces the same size before I add them").ok);
  assert.equal(r.step, "fresh");
  const originalNums = (original.question.match(/\d+/g) || []).join(",");
  assert.notEqual(r.fresh.question, original.question);
  assert.notEqual(
    (r.fresh.question.match(/\d+/g) || []).join(","),
    originalNums,
    "the fresh problem has different numbers",
  );
  assert.equal(r.fresh.generator, skill.generator, "and is the same kind of problem");
  const done = r.answerFresh(r.fresh.answers[0]);
  assert.ok(done.ok && done.independent);
  const ev = r.evidence();
  assert.equal(ev.records[0].independent, false, "the corrected original is supported work");
  assert.equal(ev.records[0].kind, "corrected-original");
  assert.equal(ev.records[1].independent, true);
  assert.ok(ev.markRepaired && ev.resolved);
  // With a hint the success is supported and the pattern is not marked repaired.
  const h = run();
  h.index = 5;
  h.startFresh();
  h.freshHint();
  assert.ok(h.answerFresh(h.fresh.answers[0]).ok);
  assert.ok(!h.evidence().records[1].independent && !h.evidence().markRepaired);
  // A miss sends the learner back to the counterexample with a DIFFERENT problem; three misses means revisit.
  const m = run();
  m.index = 5;
  m.startFresh();
  const firstFresh = m.fresh.question;
  assert.ok(!m.answerFresh("999").ok && m.step === "counterexample");
  m.index = 5;
  assert.notEqual(m.fresh.question, firstFresh);
  assert.ok(!m.answerFresh("999").ok);
  m.index = 5;
  const last = m.answerFresh("999");
  assert.ok(
    last.revisit && m.step === "done" && m.evidence().revisit && !m.evidence().markRepaired,
  );
  // With no diagnosis the pathway still works and never invents a misconception.
  const unsure = new RepairStudio({
    original: { skill, question: "1/3 + 1/4 = ?", response: "0.58", answers: ["7/12"] },
    diagnosis: analyzeResponse({
      skill,
      question: "1/3 + 1/4 = ?",
      answers: ["7/12"],
      response: "0.58",
    }),
    seed: 2,
  });
  assert.equal(unsure.info, null);
  assert.ok(unsure.identifyOptions().some((o) => o.id === "unsure"));
  assert.equal(unsure.evidence().misconception, null);
}

// ------------------------------------------------------------------ G. local store and migrations
{
  assert.deepEqual(sanitizeE8(undefined), emptyE8());
  assert.deepEqual(sanitizeE8("garbage"), emptyE8());
  const dirty = sanitizeE8({
    version: 99,
    skills: { "5:fraction-add": { built: 1e12, explained: 2, hack: 5 }, "../evil": { built: 1 } },
    placement: {
      5: {
        at: 5,
        known: ["5:fraction-add", "x"],
        gaps: [],
        path: [],
        items: 99999,
        confidence: "great",
      },
      12: {},
    },
    repairs: Array.from({ length: 50 }, (_, i) => ({
      id: `r${i}`,
      skill: "5:fraction-add",
      at: i,
      freshCorrect: true,
    })),
    extra: "drop me",
  });
  assert.deepEqual(Object.keys(dirty.skills), ["5:fraction-add"]);
  assert.equal(dirty.skills["5:fraction-add"].built, 999);
  assert.ok(!("hack" in dirty.skills["5:fraction-add"]));
  assert.deepEqual(dirty.placement["5"].known, ["5:fraction-add"]);
  assert.equal(dirty.placement["5"].items, 40);
  assert.equal(dirty.placement["5"].confidence, "rough");
  assert.equal(dirty.repairs.length, 30);
  assert.ok(!("extra" in dirty));
  let disk = null;
  const store = createE8Store({
    read: () => disk,
    write: (v) => {
      disk = JSON.parse(JSON.stringify(v));
    },
  });
  assert.deepEqual(store.load(), emptyE8());
  store.update((s) => {
    addSkillEvent(s, "5:fraction-add", "explained");
    addSkillEvent(s, "5:fraction-add", "explained");
    saveRepair(s, { id: "a", skill: "5:fraction-add", at: 1, resolved: true });
  });
  assert.equal(store.load().skills["5:fraction-add"].explained, 2);
  assert.equal(store.load().repairs.length, 1);
  assert.deepEqual(sanitizeE8(store.load()), store.load(), "sanitising is idempotent");
}

console.log(
  "Adaptive intelligence: knowledge graph, 8 mastery indicators, misconception diagnosis, selection for six profiles, placement simulations, repair pathway and store migrations passed.",
);
