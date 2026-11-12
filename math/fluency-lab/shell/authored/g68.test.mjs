// Grade 6–8 authored content contract (shell/authored/band-68.js):
//   1. every Grade 6–8 skill has concept, reasons, misconception, detectors and a transfer, in English AND Spanish;
//   2. every transfer answer is recomputed here, independently, and accepted by the app's own answer checker;
//   3. every detector fires on the wrong answer its slip produces (computed here, independently) and never on
//      the right answer, over 200 generated items per skill at every practice level;
//   4. no text shown before an answer states it (concept, reasons, misconception, transfer prompt and hint), and
//      no misconception feedback states the answer of the problem it fires on (the student still has a try left);
//   5. every living model mounts, labels every control, survives every control at its extremes, and its
//      representations agree with an independent recomputation of the model's own state.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { GRADES, generateProblem, seededRandom, validateAnswer } from "../../problem-bank.js";
import { adaptiveProblem } from "../../tutor-engine.js";
import { revealsAnswer } from "../content.js";
import { BAND } from "./band-68.js";
import { num } from "./kit-68.js";
import { PERCENTS } from "./living-68-ratio.js";

const SKILLS = GRADES.filter((g) => g.grade >= 6).flatMap((g) => g.skills.map((s) => ({ ...s, grade: g.grade })));
const KEYS = SKILLS.map((s) => `${s.grade}:${s.id}`).filter((k) => k !== "6:ratios");
assert.equal(KEYS.length, 49, "Grades 6–8 have 49 skills besides the 6:ratios exemplar");

// ---- 1. coverage and language ---------------------------------------------------------------------------
// Spanish may equal English only when there is no sentence to translate (a formula, or a loanword unit).
const wordy = (s) => /[a-záéíóúñ]{4,}[^a-záéíóúñ]+[a-záéíóúñ]{3,}/i.test(s);
function bilingual(v, where) {
  assert.ok(v && typeof v.en === "string" && typeof v.es === "string", `${where}: {en, es}`);
  assert.ok(v.en.trim().length > 0 && v.es.trim().length > 0, `${where}: both languages written`);
  if (wordy(v.en)) assert.notEqual(v.es, v.en, `${where}: Spanish is not a copy of the English`);
  assert.ok(!/\b(TODO|FIXME|TBD)\b|lorem ipsum/.test(v.en + v.es), `${where}: no placeholder`);
}
const LIVING_REQUIRED = [
  "6:order-rational", "6:equivalent-expressions", "6:write-inequalities", "6:volume-fractional", "7:fraction-ops",
  "7:like-terms", "7:circumference", "7:angle-facts", "7:sampling", "8:scientific-ops", "8:volume-round",
  "8:transformations-move", "8:compare-functions", "6:unit-rates", "6:percent", "6:percent-whole", "7:integer-add",
  "6:one-step", "6:triangle-area",
];
for (const key of KEYS) {
  const e = BAND[key];
  assert.ok(e, `${key} is authored`);
  bilingual(e.concept, `${key} concept`);
  bilingual(e.misconception, `${key} misconception`);
  assert.ok(Array.isArray(e.reasons) && e.reasons.length >= 2 && e.reasons.length <= 4, `${key} has 2–4 reasons`);
  e.reasons.forEach((r, i) => bilingual(r, `${key} reason ${i}`));
  if (e.title) bilingual(e.title, `${key} title`);
  assert.ok(e.misconceptions?.length >= 1, `${key} names at least one misconception with a detector`);
  for (const m of e.misconceptions) {
    assert.equal(typeof m.detect, "function", `${key}/${m.id} detect`);
    bilingual(m.feedback, `${key}/${m.id} feedback`);
  }
  assert.ok(e.another?.text, `${key} has an "Another way"`);
  bilingual(e.another.text, `${key} another`);
  const t = e.transfer;
  assert.ok(t, `${key} transfer`);
  bilingual(t.prompt, `${key} transfer prompt`);
  bilingual(t.explanation, `${key} transfer explanation`);
  if (t.hint) bilingual(t.hint, `${key} transfer hint`);
  if (t.unit) bilingual(t.unit, `${key} transfer unit`);
  assert.ok(t.answers?.length && t.kind, `${key} transfer answers and kind`);
}
for (const key of LIVING_REQUIRED) assert.equal(typeof BAND[key]?.living?.mount, "function", `${key} has a living model`);

// ---- 2. transfer answers, recomputed independently --------------------------------------------------------
const g = (a, b) => (b ? g(b, a % b) : a);
const TRANSFER = {
  "6:gcf": () => g(84, 126),
  "6:lcm": () => (6 * 8) / g(6, 8),
  "6:divide-fractions": () => (3 / 4) / (1 / 8),
  "6:decimal-ops": () => Math.round(4.75 * 2.4 * 100) / 100,
  "6:unit-rates": () => 90 / 18,
  "6:percent": () => 0.25 * 40,
  "6:percent-whole": () => 18 / 0.3,
  "6:evaluate": () => 3 + 2 * 7,
  "6:one-step": () => 23 + 14,
  "6:integers": () => 6 - -3,
  "6:triangle-area": () => (6 * 9) / 2,
  "6:multi-digit-division": () => 9672 / 24,
  "6:order-rational": () => ["−2.5, −1 1/2, −3/4, 0.5", [-2.5, -1.5, -0.75, 0.5]],
  "6:equivalent-expressions": () => "5s + 15",
  "6:write-inequalities": () => "p <= 12",
  "6:data-displays": () => 3 + 7 + 6 + 4,
  "6:center-spread": () => {
    const s = [4, 9, 6, 12, 8, 5, 11].sort((a, b) => a - b);
    const lo = s.slice(0, 3);
    const hi = s.slice(4);
    return hi[1] - lo[1];
  },
  "6:surface-area-nets": () => 2 * (8 * 5 + 8 * 3 + 5 * 3),
  "6:volume-fractional": () => 3.5 * 2 * 0.5,
  "7:integer-add": () => -8 + 15 - 11,
  "7:integer-mul": () => 9 * -3,
  "7:fraction-ops": () => "-5/8",
  "7:unit-rate": () => Math.min(5.4 / 12, 3 / 6),
  "7:proportions": () => (3 / 4) * 10,
  "7:percent-change": () => 80 * (1 - 0.15),
  "7:scale-drawing": () => (15 / 2) * 7,
  "7:equations": () => (47 - 15) / 4,
  "7:inequalities": () => (-15 <= -18 ? "yes" : "no"),
  "7:circle-area": () => (6 / 2) ** 2,
  "7:probability": () => "3/10",
  "7:like-terms": () => "8x + 2",
  "7:circumference": () => Math.round(3.14 * 50 * 100) / 100,
  "7:angle-facts": () => 180 - 90 - 28,
  "7:sampling": () => (6 / 30) * 900,
  "8:exponents": () => 3 ** 4,
  "8:powers-ten": () => 2.5 / 1000,
  "8:square-roots": () => Math.sqrt(196),
  "8:linear-equations": () => (10 + 22) / 4,
  "8:slope": () => (900 - 1200) / (8 - 2),
  "8:functions": () => 45 * 3 + 60,
  "8:systems": () => (30 + 8) / 2,
  "8:angle-relations": () => 90 - 68,
  "8:pythagorean": () => Math.hypot(24, 32),
  "8:association": () => "negative",
  "8:transformations": () => "(-3,-5)",
  "8:scientific-ops": () => {
    const c = 3 * 9;
    return `${c / 10}×10^${5 + 4 + 1}`;
  },
  "8:volume-round": () => Math.round(((3.14 * 3 * 3 * 9) / 3) * 100) / 100,
  "8:transformations-move": () => "(-5,2)",
  "8:compare-functions": () => (15 > 12 ? "B" : "A"),
};
for (const key of KEYS) {
  const t = BAND[key].transfer;
  const want = TRANSFER[key]?.();
  assert.ok(want !== undefined, `${key}: transfer recomputed in this test`);
  const item = { answers: t.answers, kind: t.kind };
  if (Array.isArray(want)) {
    assert.ok(validateAnswer(want[0], item), `${key}: transfer accepts ${want[0]}`);
    const listed = t.answers[0].split(",").map((s) => Number(s.replace("−", "-").replace(/(-?)(\d+) 1\/2/, (_, m, w) => `${m}${w}.5`).replace("-3/4", "-0.75")));
    assert.deepEqual(listed, want[1], `${key}: transfer key is in order`);
  } else {
    assert.ok(validateAnswer(String(want), item), `${key}: transfer key accepts the recomputed ${want} (keys: ${t.answers})`);
    if (typeof want === "number") assert.ok(!validateAnswer(String(want + 1), item), `${key}: transfer rejects ${want + 1}`);
  }
  // Pre-answer text: the prompt and hint never print the answer. A number that is also a given in the prompt
  // (a data value equal to the answer) is not a leak; "= answer" in the prompt always is.
  for (const lang of ["en", "es"]) {
    const prompt = String(t.prompt[lang]).replaceAll(",", "").replaceAll("−", "-");
    for (const a of t.answers) {
      const n = String(a).replaceAll("−", "-");
      if (!/^-?\d+(\.\d+)?$/.test(n)) continue;
      const re = new RegExp(`(^|[^\\d.])${n.replace(".", "\\.")}(?![\\d]|\\.\\d)`);
      assert.ok(!new RegExp(`=\\s*${n.replace(".", "\\.")}(?![\\d]|\\.\\d)`).test(prompt), `${key}: transfer prompt (${lang}) states = ${n}`);
      if (t.hint) {
        const hint = String(t.hint[lang]).replaceAll(",", "").replaceAll("−", "-");
        assert.ok(!re.test(hint) || re.test(prompt), `${key}: transfer hint (${lang}) states the answer ${n}`);
      }
    }
  }
}

// ---- 3 + 4. misconception detectors over generated practice ----------------------------------------------
// Each slip is computed here from the question text alone, without the module's helpers.
const C = (q) => String(q).replaceAll("−", "-").replaceAll("–", "-");
const N = (q) => (C(q).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const pt = (x, y) => `(${x}, ${y})`;
const sortN = (v) => [...v].sort((a, b) => a - b);
const med = (v) => {
  const s = sortN(v);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const after = (q) => N(String(q).split(":").slice(1).join(":"));
const SLIPS = {
  "6:gcf": {
    "gave-lcm": (q) => { const [a, b] = N(q); return (a * b) / g(a, b); },
    "smaller-number": (q) => { const [a, b] = N(q); return Math.max(a, b) % Math.min(a, b) ? Math.min(a, b) : null; },
  },
  "6:lcm": { product: (q) => { const [a, b] = N(q); return a * b; }, "gave-gcf": (q) => { const [a, b] = N(q); return g(a, b); } },
  "6:divide-fractions": {
    "no-flip": (q) => { const [a, b, c, d] = N(q); return `${a * c}/${b * d}`; },
    "flip-first": (q) => { const [a, b, c, d] = N(q); return `${b * c}/${a * d}`; },
  },
  "6:decimal-ops": { "decimal-place": (q, k) => String(Math.round(Number(k) * 10 * 1e6) / 1e6) },
  "6:unit-rates": {
    multiplied: (q) => (/How much for 1/.test(q) ? N(q)[0] * N(q)[1] : null),
    "conversion-direction": (q, k) => (/How much/.test(q) ? null : N(q)[0]),
  },
  "6:percent": { "percent-as-quantity": (q) => N(q)[0], place: (q, k) => Number(k) * 10 },
  "6:percent-whole": { "percent-of-part": (q) => (N(q)[0] * N(q)[1]) / 100, "percent-as-quantity": (q) => N(q)[1] },
  "6:evaluate": {
    "left-to-right": (q) => { const m = C(q).match(/^(\d+) \+ (\d+) × (\d+)/); return m ? (Number(m[1]) + Number(m[2])) * Number(m[3]) : null; },
    "ignored-parentheses": (q) => { const m = C(q).match(/^\((\d+) \+ (\d+)\) × (\d+)/); return m ? Number(m[1]) + Number(m[2]) * Number(m[3]) : null; },
    juxtaposed: (q) => { const m = C(q).match(/Evaluate (\d+)x ([+-]) (\d+) when x = (\d+)/); return m ? Number(m[1] + m[4]) + (m[2] === "+" ? 1 : -1) * Number(m[3]) : null; },
  },
  "6:one-step": {
    "same-operation": (q) => {
      const s = C(q);
      let m = s.match(/^x \+ (\d+) = (\d+)/); if (m) return Number(m[1]) + Number(m[2]);
      m = s.match(/^x - (\d+) = (\d+)/); if (m) return Number(m[2]) - Number(m[1]);
      m = s.match(/^(\d+)x = (\d+)/); if (m) return Number(m[1]) * Number(m[2]);
      m = s.match(/^x ÷ (\d+) = (\d+)/); if (m) return Number(m[2]) / Number(m[1]);
      return null;
    },
  },
  "6:integers": {
    "wrong-axis": (q) => { const m = C(q).match(/Reflect \((-?\d+), (-?\d+)\) across the ([xy])/); if (!m) return null; const [x, y] = [Number(m[1]), Number(m[2])]; return m[3] === "x" ? pt(-x, y) : pt(x, -y); },
    "subtracted-across-axis": (q) => { const m = C(q).match(/between \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/); if (!m) return null; const [x1, y1, x2, y2] = m.slice(1).map(Number); const [a, b] = x1 === x2 ? [y1, y2] : [x1, x2]; return a * b < 0 ? Math.abs(Math.abs(a) - Math.abs(b)) : null; },
    "negative-absolute": (q, k) => (q.startsWith("|") ? -Number(k) : null),
  },
  "6:triangle-area": { "forgot-half": (q) => N(q)[0] * N(q)[1], added: (q) => N(q)[0] + N(q)[1] },
  "6:multi-digit-division": {
    "lost-zero": (q, k) => (String(k).includes("0") ? Number(String(k).replace("0", "")) : null),
    "gave-remainder": (q) => (/remainder/.test(q) ? N(C(q).replaceAll(",", ""))[0] % N(C(q).replaceAll(",", ""))[1] : null),
  },
  "6:order-rational": {
    "negatives-reversed": (q, k) => {
      const parts = String(k).split(", ");
      const neg = parts.filter((p) => p.startsWith("−") || p.startsWith("-"));
      return neg.length > 1 ? [...neg.reverse(), ...parts.filter((p) => !neg.includes(p))].join(", ") : null;
    },
  },
  "6:equivalent-expressions": {
    "first-term-only": (q) => { const m = C(q).match(/(\d+)\(x \+ (\d+)\)( \+ (\d+)x)?/); if (!m || /^Factor/.test(q)) return null; return `${Number(m[1]) + Number(m[4] || 0)}x + ${m[2]}`; },
    "unlike-terms": (q) => { const m = C(q).match(/Combine like terms: (\d+)x \+ (\d+) \+ (\d+)x/); return m ? `${Number(m[1]) + Number(m[2]) + Number(m[3])}x` : null; },
    "not-greatest": (q) => {
      const m = C(q).match(/Factor (\d+)x \+ (\d+)/); if (!m) return null;
      const [p, r] = [Number(m[1]), Number(m[2])]; const G = g(p, r);
      for (let k = G - 1; k >= 2; k -= 1) if (G % k === 0) return `${k}(${p / k}x + ${r / k})`;
      return null;
    },
  },
  "6:write-inequalities": {
    direction: (q, k) => String(k).replace(/[<>≤≥]/, (o) => ({ "<": ">", ">": "<", "≤": "≥", "≥": "≤" })[o]),
    boundary: (q, k) => String(k).replace(/[<>≤≥]/, (o) => ({ "<": "≤", ">": "≥", "≤": "<", "≥": ">" })[o]),
  },
  "6:data-displays": {
    "counted-things": (q) => { const p = [...C(q).matchAll(/(\d+) [a-z]+: (\d+)/g)]; return p.length ? p.reduce((t, m) => t + Number(m[1]) * Number(m[2]), 0) : null; },
    "interval-edge": (q) => { const m = C(q).match(/data (.*) in intervals of \d+\. How many values are in the interval (\d+)-(\d+)/); if (!m) return null; const d = N(m[1]); return d.filter((v) => v >= Number(m[2]) && v <= Number(m[3]) + 1).length; },
  },
  "6:center-spread": {
    "range-for-iqr": (q) => (/IQR/.test(q) ? Math.max(...after(q)) - Math.min(...after(q)) : null),
    "unsorted-median": (q) => { if (!/median/.test(q)) return null; const d = after(q); const m = Math.floor(d.length / 2); return d.length % 2 ? d[m] : (d[m - 1] + d[m]) / 2; },
    "signed-deviation": (q) => (/MAD/.test(q) ? 0 : null),
    "median-for-mean": (q) => (/mean of/.test(q) ? med(after(q)) : null),
  },
  "6:surface-area-nets": {
    volume: (q) => (/prism/.test(q) ? N(q)[0] * N(q)[1] * N(q)[2] : null),
    "three-faces": (q) => { if (!/prism/.test(q)) return null; const [l, w, h] = N(q); return l * w + l * h + w * h; },
    "triangle-half": (q) => { if (!/pyramid/.test(q)) return null; const [s, , h] = N(q); return s * s + 4 * s * h; },
  },
  "6:volume-fractional": {
    "whole-parts": (q) => { const e = [...C(q).matchAll(/(\d+ \d\/\d|\d\/\d|\d+) ft/g)].map((m) => (m[1].includes(" ") ? Number(m[1].split(" ")[0]) : m[1].includes("/") ? 0 : Number(m[1]))); return e[0] * e[1] * e[2]; },
    added: (q) => { const e = [...C(q).matchAll(/(\d+ \d\/\d|\d\/\d|\d+) ft/g)].map((m) => m[1].split(" ").reduce((t, p) => t + (p.includes("/") ? Number(p.split("/")[0]) / Number(p.split("/")[1]) : Number(p)), 0)); return e[0] + e[1] + e[2]; },
  },
  "7:integer-add": {
    "subtract-negative": (q) => { const m = C(q).match(/^(-?\d+) - \((-\d+)\)/); return m ? Number(m[1]) + Number(m[2]) : null; },
    sign: (q, k) => -Number(k),
    "ignored-sign": (q) => { const m = C(q).match(/^\(?(-?\d+)\)? ([+-]) \(?(-?\d+)\)?/); if (!m) return null; const [a, b] = [Math.abs(Number(m[1])), Math.abs(Number(m[3]))]; return m[2] === "+" ? a + b : a - b; },
  },
  "7:integer-mul": { sign: (q, k) => -Number(k) },
  "7:fraction-ops": {
    sign: (q, k) => (String(k).startsWith("-") ? String(k).slice(1) : `-${k}`),
    across: (q) => { const m = C(q).match(/^\(?(-?\d+)\/(\d+)\)? ([+-]) \(?(-?\d+)\/(\d+)\)?/); if (!m) return null; const [a, b, c, d] = [Number(m[1]), Number(m[2]), Number(m[4]), Number(m[5])]; return `${m[3] === "+" ? a + c : a - c}/${b + d}`; },
    "no-flip": (q) => { const m = C(q).match(/^\(?(-?\d+)\/(\d+)\)? ÷ \(?(-?\d+)\/(\d+)\)?/); return m ? `${Number(m[1]) * Number(m[3])}/${Number(m[2]) * Number(m[4])}` : null; },
  },
  "7:unit-rate": { multiplied: (q) => Math.round(N(q)[0] * N(q)[1] * 100) / 100, "decimal-place": (q, k) => Math.round(Number(k) * 1000) / 100 },
  "7:proportions": { additive: (q) => { const [a, b, c] = N(q); return a + c - b; }, inverted: (q) => { const [a, b, c] = N(q); return (b * c) / a; } },
  "7:percent-change": {
    "percent-as-amount": (q) => { const [n, p] = N(q); return /increase/.test(q) ? n + p : n - p; },
    "change-only": (q) => (N(q)[0] * N(q)[1]) / 100,
    "wrong-direction": (q) => { const [n, p] = N(q); return /increase/.test(q) ? n - (n * p) / 100 : n + (n * p) / 100; },
  },
  "7:scale-drawing": { added: (q) => N(q)[1] + N(q)[2], divided: (q) => N(q)[2] / N(q)[1] },
  "7:equations": {}, // filled below from the shared equation slips
  "7:inequalities": {
    absolute: (q) => { const m = C(q).match(/Is (-?\d+) a solution to x ([<>≤≥]) (-?\d+)/); if (!m || (Number(m[1]) >= 0 && Number(m[3]) >= 0)) return null; const [v, b] = [Math.abs(Number(m[1])), Math.abs(Number(m[3]))]; return { "<": v < b, ">": v > b, "≤": v <= b, "≥": v >= b }[m[2]] ? "yes" : "no"; },
    boundary: (q, k) => { const m = C(q).match(/Is (-?\d+) a solution to x [<>≤≥] (-?\d+)/); return m && m[1] === m[2] ? (k === "yes" ? "no" : "yes") : null; },
  },
  "7:circle-area": { doubled: (q) => 2 * N(q)[0] },
  "7:probability": {
    "part-to-part": (q) => { if (!/P\(win\)/.test(q)) return null; const [w, t] = N(q); return t - w ? `${w}/${t - w}` : null; },
    "unsorted-median": (q) => { if (!/median/.test(q)) return null; const d = after(q); const m = Math.floor(d.length / 2); return d.length % 2 ? d[m] : (d[m - 1] + d[m]) / 2; },
    "range-extreme": (q) => (/range/.test(q) ? Math.max(...after(q)) : null),
  },
  "7:like-terms": {
    "dropped-sign": (q) => { const m = C(q).match(/: (\d*)x \+ (\d+) ([+-]) (\d*)x ([+-]) (\d+)/); if (!m) return null; const [a, b, c, d] = [Number(m[1] || 1), Number(m[2]), Number(m[4] || 1), Number(m[6])]; if (m[3] !== "-") return null; const cs = m[5] === "-" ? b - d : b + d; return `${a + c}x ${cs < 0 ? "-" : "+"} ${Math.abs(cs)}`; },
    unlike: (q, k) => { const m = C(k).replace(/\s/g, "").match(/^(-?\d*)x([+-]\d+)$/); if (!m) return null; const x = m[1] === "" ? 1 : m[1] === "-" ? -1 : Number(m[1]); return `${x + Number(m[2])}x`; },
  },
  "7:circumference": {
    "radius-diameter": (q) => { const s = C(q); const n = N(s.replace("3.14", ""))[0]; const r = (v) => Math.round(v * 100) / 100; if (/radius of/.test(s)) return r(3.14 * n); if (/diameter of/.test(s)) return r(6.28 * n); if (/its diameter/.test(s)) return r(n / 6.28); if (/its radius/.test(s)) return r(n / 3.14); return null; },
    area: (q) => { const s = C(q); if (!/What is its circumference/.test(s)) return null; const n = N(s.replace("3.14", ""))[0]; const r = /radius of/.test(s) ? n : n / 2; return Math.round(3.14 * r * r * 100) / 100; },
  },
  "7:angle-facts": {
    "used-90": (q) => (/straight line|next to it/.test(q) && N(q)[0] < 90 ? 90 - N(q)[0] : null),
    "vertical-adjacent": (q) => (/Two lines cross/.test(q) ? (/across/.test(q) ? 180 - N(q)[0] : N(q)[0]) : null),
    "used-360": (q) => { if (!/triangle/.test(q)) return null; if (/x°/.test(q)) { const p = [...C(q).matchAll(/(\d*)x°/g)].map((m) => Number(m[1] || 1)); return 360 / p.reduce((s, v) => s + v, 0); } return 360 - N(q)[0] - N(q)[1]; },
  },
  "7:sampling": { additive: (q) => { const [n, k, N2] = N(q); return k + N2 - n; }, "count-as-percent": (q) => (N(q)[1] * N(q)[2]) / 100 },
  "8:exponents": { "times-exponent": (q) => N(q)[0] * N(q)[1], "one-short": (q) => (N(q)[1] > 1 ? N(q)[0] ** (N(q)[1] - 1) : null) },
  "8:powers-ten": {
    direction: (q) => { const m = C(q).match(/^(\d+(?:\.\d+)?) × 10\^(-?\d+)/); return m ? Number((Number(m[1]) * 10 ** -Number(m[2])).toPrecision(12)) : null; },
    count: (q, k) => Number((Number(k) * 10).toPrecision(12)),
    "negative-value": (q, k) => -Number(k),
  },
  "8:square-roots": { half: (q) => N(q)[0] / 2 },
  "8:linear-equations": {},
  "8:slope": { "run-over-rise": (q) => { const [x1, y1, x2, y2] = N(q); return y2 !== y1 ? (x2 - x1) / (y2 - y1) : null; }, sign: (q, k) => -Number(k) },
  "8:functions": {
    "dropped-input-sign": (q) => { const m = C(q).match(/y = (-?\d*)x ([+-]) (\d+), find y when x = (-?\d+)/); if (!m || Number(m[4]) >= 0) return null; const mm = m[1] === "" ? 1 : Number(m[1]); return mm * -Number(m[4]) + (m[2] === "+" ? 1 : -1) * Number(m[3]); },
    "added-rate": (q) => { const m = C(q).match(/y = (-?\d*)x ([+-]) (\d+), find y when x = (-?\d+)/); if (!m) return null; const mm = m[1] === "" ? 1 : Number(m[1]); return mm + Number(m[4]) + (m[2] === "+" ? 1 : -1) * Number(m[3]); },
  },
  "8:systems": { "forgot-halve": (q) => N(q)[0] + N(q)[1], "found-y": (q) => (N(q)[0] - N(q)[1]) / 2 },
  "8:angle-relations": {
    "swapped-totals": (q) => (/complementary/.test(q) ? 180 - N(q)[0] : /supplementary/.test(q) && N(q)[0] < 90 ? 90 - N(q)[0] : null),
    "vertical-supplement": (q) => (/vertical/.test(q) ? 180 - N(q)[0] : null),
  },
  "8:pythagorean": { "added-legs": (q) => N(q)[0] + N(q)[1], "no-root": (q) => N(q)[0] ** 2 + N(q)[1] ** 2 },
  "8:association": { direction: (q, k) => ({ positive: "negative", negative: "positive" })[k] ?? null, "trend-in-noise": (q, k) => (k === "none" ? "positive" : null) },
  "8:transformations": { "wrong-axis": (q) => { const m = C(q).match(/Reflect \((-?\d+), (-?\d+)\) across the (x-axis|y-axis|origin)/); if (!m) return null; const [x, y] = [Number(m[1]), Number(m[2])]; return m[3] === "x-axis" ? pt(-x, y) : m[3] === "y-axis" ? pt(x, -y) : pt(-x, y); } },
  "8:scientific-ops": {
    "multiplied-exponents": (q) => { const m = sciQ(q); return m && m.op === "×" && m.e1 * m.e2 !== m.e1 + m.e2 ? `${m.c1 * m.c2} × 10^${m.e1 * m.e2}` : null; },
    "not-normalized": (q) => { const m = sciQ(q); if (!m || m.op !== "×" || m.c1 * m.c2 < 10) return null; return `${Number((m.c1 * m.c2 / 10).toPrecision(6))} × 10^${m.e1 + m.e2}`; },
    "added-exponents-in-sum": (q) => { const m = sciQ(q); return m && m.op === "+" ? `${m.c1 + m.c2} × 10^${m.e1 + m.e2}` : null; },
  },
  "8:volume-round": {
    "doubled-radius": (q) => { const s = C(q); const [r, h] = N(s.replace("3.14", "")); if (/cylinder/.test(s)) return Math.round(3.14 * 2 * r * h * 100) / 100; if (/cone/.test(s)) return Math.round(((3.14 * 2 * r * h) / 3) * 100) / 100; return null; },
    "cone-third": (q) => { const s = C(q); if (!/cone/.test(s)) return null; const [r, h] = N(s.replace("3.14", "")); return Math.round(3.14 * r * r * h * 100) / 100; },
    "sphere-formula": (q) => { const s = C(q); if (!/sphere/.test(s)) return null; const [r] = N(s.replace("3.14", "")); return Math.round(4 * 3.14 * r * r * 100) / 100; },
  },
  "8:transformations-move": {
    "reflection-for-rotation": (q) => { const m = C(q).match(/Rotate \((-?\d+), (-?\d+)\) 180/); return m ? pt(-Number(m[1]), Number(m[2])) : null; },
    clockwise: (q) => { const m = C(q).match(/Rotate \((-?\d+), (-?\d+)\) 90° counterclockwise/); return m ? pt(Number(m[2]), -Number(m[1])) : null; },
    "swapped-axes": (q) => { const m = C(q).match(/Translate \((-?\d+), (-?\d+)\) (\d+) (left|right) and (\d+) (up|down)/); if (!m) return null; const h = Number(m[3]) * (m[4] === "left" ? -1 : 1); const v = Number(m[5]) * (m[6] === "down" ? -1 : 1); return pt(Number(m[1]) - h, Number(m[2]) - v); },
    "added-scale": (q) => { const m = C(q).match(/Dilate \((-?\d+), (-?\d+)\) by a scale factor of (\d+(?:\.\d+)?)/); return m ? pt(Number(m[1]) + Number(m[3]), Number(m[2]) + Number(m[3])) : null; },
  },
  "8:compare-functions": {
    "compared-intercepts": (q, k) => { const f = fnQ(q); if (!f || f.A.b === f.B.b) return null; const s = f.A.b > f.B.b ? "A" : "B"; return s === k ? null : s; },
    "read-a-point": (q, k) => { const m = C(q).match(/through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/); const f = fnQ(q); if (!m || !f) return null; const s = Number(m[4]) > f.A.m ? "B" : f.A.m > Number(m[4]) ? "A" : null; return s === k ? null : s; },
  },
};
const EQ_SLIPS = {
  "one-side": (q) => { const e = twoStepQ(q); return e ? e.c / e.a : null; },
  "wrong-inverse": (q) => { const e = twoStepQ(q); return e ? (e.c + e.b) / e.a : null; },
  sign: (q, k) => -Number(k),
};
SLIPS["7:equations"] = EQ_SLIPS;
SLIPS["8:linear-equations"] = EQ_SLIPS;
function twoStepQ(q) {
  const m = C(q).match(/^(-?\d*)x ([+-]) (\d+) = (-?\d+)/);
  return m ? { a: m[1] === "" ? 1 : Number(m[1]), b: (m[2] === "+" ? 1 : -1) * Number(m[3]), c: Number(m[4]) } : null;
}
function sciQ(q) {
  const sup = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
  const s = C(q).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => sup[c]);
  const m = s.match(/\((\d+(?:\.\d+)?) × 10(\d+)\) ([×+]) \((\d+(?:\.\d+)?) × 10(\d+)\)/);
  return m ? { c1: Number(m[1]), e1: Number(m[2]), op: m[3], c2: Number(m[4]), e2: Number(m[5]) } : null;
}
function fnQ(q) {
  const s = C(q);
  const eq = (t) => { const m = t.match(/y = (-?\d*)x \+ (-?\d+)/); return m ? { m: m[1] === "" ? 1 : Number(m[1]), b: Number(m[2]) } : null; };
  const [, a, b] = s.split(/Function [AB] /);
  const A = eq(a);
  let B = eq(b);
  if (!B) {
    const r = b.match(/rate of change of (-?\d+) and a y-intercept of (-?\d+)/);
    const p = b.match(/through \((-?\d+), (-?\d+)\) and \((-?\d+), (-?\d+)\)/);
    B = r ? { m: Number(r[1]), b: Number(r[2]) } : { m: (p[4] - p[2]) / (p[3] - p[1]), b: Number(p[2]) - ((p[4] - p[2]) / (p[3] - p[1])) * p[1] };
  }
  return { A, B };
}

const fired = new Map();
const problems = [];
for (const skill of SKILLS) {
  const key = `${skill.grade}:${skill.id}`;
  if (key === "6:ratios") continue;
  const entry = BAND[key];
  for (const m of entry.misconceptions) assert.ok(SLIPS[key]?.[m.id], `${key}/${m.id}: this test computes its slip`);
  for (let s = 0; s < 200; s += 1) {
    const rng = seededRandom(s * 977 + skill.grade * 13);
    const item = s % 4 === 3 ? generateProblem(skill, rng) : adaptiveProblem(skill, rng, s % 4);
    for (const right of item.answers)
      for (const m of entry.misconceptions)
        if (m.detect(item, right)) problems.push(`${key}/${m.id} fires on the RIGHT answer ${right} for "${item.question}"`);
    // Concept, reasons and misconception are shown on See and Try, before any practice problem: they may use
    // small worked examples, but never state a RESULT ("= n") equal to a practice answer.
    // "Another way" sits beside the problem itself, so it is held to the strict help-rung rule.
    for (const lang of ["en", "es"])
      if (revealsAnswer(entry.another.text[lang], item)) problems.push(`${key}: "Another way" states ${item.answers[0]} for "${item.question}"`);
    for (const text of [entry.concept, entry.misconception, ...entry.reasons])
      for (const lang of ["en", "es"])
        for (const a of item.answers) {
          const n = String(a).replaceAll("−", "-").trim();
          if (/^-?\d+(\.\d+)?$/.test(n) && new RegExp(`=\\s*${n.replace(".", "\\.")}(?![\\d]|[.,]\\d)`).test(String(text[lang]).replaceAll("−", "-").replaceAll(",", ".")))
            problems.push(`${key}: pre-answer text states = ${n} for "${item.question}": ${text[lang].slice(0, 70)}`);
        }
    for (const m of entry.misconceptions) {
      const raw = SLIPS[key][m.id](item.question, item.answers[0]);
      if (raw === null || raw === undefined || !Number.isFinite(Number(raw)) && typeof raw === "number") continue;
      if (validateAnswer(String(raw), item)) continue; // the slip happens to give the right answer here
      if (m.detect(item, String(raw))) {
        fired.set(`${key}/${m.id}`, (fired.get(`${key}/${m.id}`) || 0) + 1);
        for (const lang of ["en", "es"])
          if (revealsAnswer(m.feedback[lang], item)) problems.push(`${key}/${m.id}: feedback states the answer ${item.answers[0]}`);
      } else if (!entry.misconceptions.some((o) => o !== m && o.detect(item, String(raw))))
        problems.push(`${key}/${m.id} does not fire on its slip ${raw} for "${item.question}" (key ${item.answers[0]})`);
    }
  }
}
// A detector whose question shape the generator never produces is dead code: every one must fire somewhere.
for (const key of KEYS) for (const m of BAND[key].misconceptions) if (!fired.get(`${key}/${m.id}`)) problems.push(`${key}/${m.id} never fired in 200 items`);
console.log(`detectors ${[...fired.keys()].length}, firings ${[...fired.values()].reduce((a, b) => a + b, 0)}, problems ${problems.length}`);
if (problems.length) {
  const seen = new Map();
  for (const p of problems) {
    const k = p.split(/ (fires|does|never|feedback|pre-answer)/)[0] + p.split(" ")[1];
    if (!seen.has(k)) seen.set(k, p);
  }
  console.log([...seen.values()].join("\n"));
}
assert.equal(problems.length, 0, "detector or leak problems");

// The prompt's named example: 25% of 40 answered 25 is read as the percent-as-quantity slip and explained as
// one-fourth / four equal groups, without stating the answer.
{
  const item = { question: "What is 25% of 40?", answers: ["10"], kind: "number" };
  const hit = BAND["6:percent"].misconceptions.find((m) => m.detect(item, "25"));
  assert.equal(hit?.id, "percent-as-quantity");
  assert.match(hit.feedback.en, /one-fourth/);
  assert.match(hit.feedback.en, /four equal groups/);
  assert.ok(!revealsAnswer(hit.feedback.en, item) && !/\b10\b/.test(hit.feedback.en));
  assert.ok(!BAND["6:percent"].misconceptions.some((m) => m.detect(item, "10")));
}

// ---- 5. living models ------------------------------------------------------------------------------------
const dom = new JSDOM("<!doctype html><body></body>");
globalThis.document = dom.window.document;
const bad = /NaN|undefined|Infinity|\[object/;
let mounted = 0;
for (const key of KEYS) {
  const living = BAND[key].living;
  if (!living) continue;
  for (const lang of ["en", "es"]) {
    const host = document.createElement("div");
    document.body.append(host);
    const said = [];
    const api = living.mount(host, { lang: () => lang, say: (t) => said.push(t) });
    mounted += 1;
    assert.equal(typeof api.observed, "function", `${key} observed()`);
    for (const el of host.querySelectorAll("button, input")) {
      const name = el.tagName === "INPUT" ? el.closest("label")?.textContent : el.textContent || el.getAttribute("aria-label");
      assert.ok(String(name || "").trim().length > 0, `${key}: every control has a name`);
    }
    for (const svgEl of host.querySelectorAll("svg")) assert.ok(svgEl.getAttribute("aria-label"), `${key}: picture is described`);
    const check = () => {
      const t = host.textContent + host.innerHTML;
      assert.ok(!bad.test(t), `${key} (${lang}) renders a broken value: ${t.match(bad)}`);
      assert.ok(host.querySelector("[data-eq]").textContent.trim(), `${key}: equation line present`);
    };
    check();
    const fire = (el, type) => el.dispatchEvent(new dom.window.Event(type, { bubbles: true }));
    for (const input of host.querySelectorAll('input[type="range"]'))
      for (const v of [input.min, input.max, input.min]) {
        input.value = v;
        fire(input, "input");
        check();
      }
    for (const b of host.querySelectorAll("button")) {
      b.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
      check();
    }
    assert.ok(said.length > 0, `${key}: changes are announced`);
  }
}
console.log(`living models mounted ${mounted / 2} (× English and Spanish)`);

// Synchronization: drive every state of the percent and unit-rate models and recompute each representation.
function mountOf(key, lang = "en") {
  const host = document.createElement("div");
  const api = BAND[key].living.mount(host, { lang: () => lang, say: () => {} });
  const set = (id, v) => {
    const input = host.querySelector(`[data-sl="${id}"]`);
    input.value = String(v);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  };
  const click = (sel) => host.querySelector(sel).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  return { host, api, set, click, eq: () => host.querySelector("[data-eq]").textContent, cells: () => [...host.querySelectorAll("td")].map((td) => td.textContent) };
}
for (const mode of ["6:percent", "6:percent-whole"]) {
  const m = mountOf(mode);
  for (let pi = 0; pi < PERCENTS.length; pi += 1)
    for (let gsz = 1; gsz <= 12; gsz += 1) {
      m.set("pi", pi);
      m.set("g", gsz);
      const p = PERCENTS[pi];
      const parts = 100 / g(p, 100);
      const whole = parts * gsz;
      const part = (p / 100) * whole;
      assert.ok(Number.isInteger(part), `${mode}: part is whole for ${p}% of ${whole}`);
      const want = [];
      for (const [pc, amt] of [[100 / parts, gsz], [p, part], [100, whole]]) if (!want.includes(`${pc}%`)) want.push(`${pc}%`, String(amt));
      assert.deepEqual(m.cells(), want, `${mode}: table for ${p}%, group ${gsz}`);
      const nums = m.eq().match(/\d+/g).map(Number);
      assert.ok(nums.includes(part) && nums.includes(whole), `${mode}: equation names part ${part} and whole ${whole}`);
      const labels = [...m.host.querySelectorAll("text")].map((t) => t.textContent);
      assert.ok(labels.includes(String(whole)) && labels.includes(String(part)) && labels.includes(`${p}%`), `${mode}: double number line marks ${p}% ↔ ${part} and 100% ↔ ${whole}`);
      const shaded = [...m.host.querySelectorAll("rect")].filter((r) => r.getAttribute("fill") === "var(--q1)").length;
      assert.equal(shaded, (p / 100) * parts, `${mode}: tape shades ${p}% of ${parts} parts`);
    }
  assert.ok(m.api.observed());
}
{
  const m = mountOf("6:unit-rates");
  for (let u = 1; u <= 12; u += 1)
    for (let k = 1; k <= 8; k += 1) {
      m.set("u", u);
      m.set("k", k);
      const rows = m.cells();
      for (let i = 0; i < rows.length; i += 2) assert.equal(Number(rows[i + 1]), Number(rows[i]) * u, `unit rate table row ${rows[i]} items at $${u}`);
      assert.match(m.eq(), new RegExp(`^${k} items cost \\$${u * k}\\. ${u * k} ÷ ${k} = ${u},`));
    }
}
{
  const m = mountOf("7:integer-add");
  for (const op of ["+", "-"]) {
    m.click(`[data-tg="op"][data-v="${op}"]`);
    for (let a = -6; a <= 6; a += 1)
      for (let b = -6; b <= 6; b += 1) {
        m.set("a", a);
        m.set("b", b);
        const want = op === "+" ? a + b : a - b;
        const last = m.eq().split("=").at(-1).trim().split(".")[0].replace("−", "-");
        assert.equal(Number(last), want, `integers: ${a} ${op} ${b}`);
        // Chips left after taking away (not crossed out) must also total the answer.
        const live = [...m.host.querySelectorAll("circle")].filter((c) => c.getAttribute("fill-opacity") !== "0.18");
        const total = live.reduce((t, c) => t + (c.getAttribute("fill") === "var(--q1)" ? 1 : -1), 0);
        assert.equal(total, want, `integers: chips for ${a} ${op} ${b}`);
      }
  }
}
{
  const m = mountOf("6:one-step");
  for (const form of ["add", "mul"]) {
    m.click(`[data-tg="form"][data-v="${form}"]`);
    for (let a = 1; a <= 6; a += 1)
      for (let x = 1; x <= 4; x += 1) {
        m.set("a", a);
        m.set("x", x);
        m.click('[data-bt="both"]');
        assert.match(m.eq(), new RegExp(`so x = ${x}\\.`), `balance ${form} a=${a} x=${x}`);
        m.click('[data-bt="left"]');
        assert.match(m.eq(), /breaks the balance/);
        m.click('[data-bt="reset"]');
      }
  }
}
{
  const m = mountOf("8:scientific-ops");
  for (let c1 = 1; c1 <= 9; c1 += 1)
    for (let c2 = 1; c2 <= 9; c2 += 1) {
      m.set("c1", c1);
      m.set("c2", c2);
      m.set("e1", 4);
      m.set("e2", 3);
      const value = c1 * 1e4 * c2 * 1e3;
      const tail = m.eq().split(". ")[0].split("=").at(-1).trim();
      const sup = { "⁰": 0, "¹": 1, "²": 2, "³": 3, "⁴": 4, "⁵": 5, "⁶": 6, "⁷": 7, "⁸": 8, "⁹": 9 };
      const mm = tail.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => sup[c]).match(/^(\d+(?:\.\d+)?) × 10(\d+)$/) || tail.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => sup[c]).match(/^(\d+) × 10(\d+)/);
      assert.ok(mm, `scientific: ${tail}`);
      assert.ok(Math.abs(Number(mm[1]) * 10 ** Number(mm[2]) - value) < 1e-3, `scientific: ${c1}e4 × ${c2}e3`);
      assert.ok(Number(mm[1]) >= 1 && Number(mm[1]) < 10, `scientific: normalized ${tail}`);
    }
}
{
  const m = mountOf("6:volume-fractional");
  for (const l of [0.5, 1.5, 2.5, 4]) for (const w of [0.5, 1, 3]) for (const h of [0.5, 1.5, 3]) {
    m.set("l", l);
    m.set("w", w);
    m.set("h", h);
    const [count, , vol] = m.cells().slice(-3);
    assert.equal(count, `${2 * l} × ${2 * w} × ${2 * h} = ${8 * l * w * h}`, `volume: ${l}×${w}×${h} half-cube count`);
    assert.equal(num(vol.split("=")[1]), l * w * h, `volume: ${l}×${w}×${h} = ${l * w * h}`);
    // The ruled faces show exactly the half-unit grid: interior lines per face = (cells − 1) per direction.
    assert.equal(m.host.querySelectorAll("svg line").length, 2 * (2 * l - 1) + 2 * (2 * h - 1) + 2 * (2 * w - 1), `volume: grid lines for ${l}×${w}×${h}`);
  }
}
console.log("living-model synchronization checks passed");
dom.window.close();
