// Item engine (Enterprise 8, Phase 6): checks a learner's response against an authored bank item, picks items for a
// purpose, and builds assessments. Answer equivalence uses exact rational arithmetic (the same evaluator that proved the
// key), so 0.75, 3/4 and "75%" agree, "6/8" is correct but not simplified when simplified form is required, and a
// response that cannot be read is "unreadable", never "wrong". Written responses are never auto-graded: the learner
// checks themselves against a rubric, and the result says so. Nothing here uses time or speed.
import { evaluate } from "./exact-eval.js";
import { Rational } from "./rational.js";
import { seededRandom } from "../problem-bank.js";

export const MODES = Object.freeze({
  practice: { size: 8, dok: [1, 2, 3] },
  diagnostic: { size: 12, dok: [1, 2] },
  exit: { size: 3, dok: [1, 2] },
  quiz: { size: 10, dok: [1, 2, 3] },
  unit: { size: 20, dok: [1, 2, 3] },
  pretest: { size: 15, dok: [1, 2] },
  challenge: { size: 6, dok: [3] },
});
const bi = (en, es) => ({ en, es });
// Match pairs may be plain text or {en, es}; responses are keyed by the English text so both languages share one key.
export const side = (v) => (v && typeof v === "object" ? v.en : String(v));

// ---------------------------------------------------------------- reading what a person typed
const UNIT_WORDS = /\s*[a-zA-Zµ°²³]+(?:\s+[a-zA-Z]+)*\s*$/;
export function readNumber(text) {
  let s = unSuper(String(text ?? "").trim())
    .replace(/[−–]/g, "-")
    .replace(/\$/g, "");
  if (!s) return null;
  s = s.replace(/(\d),(?=\d{3}(\D|$))/g, "$1");
  const mixed = /^(-?)(\d+)\s+(\d+)\/(\d+)$/.exec(s);
  if (mixed) {
    if (Number(mixed[4]) === 0) return null;
    const v = Rational.of(mixed[2]).add(
      Rational.of(mixed[3]).div(Rational.of(mixed[4])),
    );
    return mixed[1] ? v.neg() : v;
  }
  for (const candidate of [s, s.replace(UNIT_WORDS, "").trim()]) {
    if (!candidate || !/^[-+0-9.(]/.test(candidate)) continue;
    try {
      return evaluate(candidate);
    } catch {
      /* try the next reading */
    }
  }
  return null;
}
const sameValue = (a, b) => {
  try {
    return a.eq(b);
  } catch {
    return false;
  }
};
const lowestTerms = (text) => {
  const m = /^\s*-?(\d+)\s*\/\s*(\d+)\s*$/.exec(
    String(text).replace(/[−–]/g, "-"),
  );
  if (!m) return true; // a whole number or decimal has no fraction form to reduce
  let a = Number(m[1]);
  let b = Number(m[2]);
  while (b) [a, b] = [b, a % b];
  return a === 1;
};

// ---------------------------------------------------------------- scoring
const result = (status, extra = {}) => ({
  status,
  correct: status === "correct",
  points: 0,
  ...extra,
});
export const feedbackKinds = Object.freeze([
  "correct",
  "incorrect",
  "partial",
  "unreadable",
  "self-check",
  "invalid",
]);

function wrongChoiceFeedback(item, ids) {
  const picked = item.choices.filter((c) => ids.includes(c.id) && c.why);
  return picked.length
    ? bi(picked[0].why, picked[0].whyEs || picked[0].why)
    : null;
}

export function checkResponse(item, response) {
  const max = item.scoring?.points ?? 1;
  const done = (r) => ({
    ...r,
    max,
    points:
      r.status === "correct"
        ? max
        : r.status === "partial"
          ? Math.round(max * (r.share ?? 0) * 100) / 100
          : 0,
  });
  switch (item.type) {
    case "mc": {
      if (response === undefined || response === null || response === "")
        return done(result("invalid"));
      const ok = response === item.answer.correct;
      return done(
        result(
          ok ? "correct" : "incorrect",
          ok ? {} : { why: wrongChoiceFeedback(item, [response]) },
        ),
      );
    }
    case "multi": {
      const picked = [...new Set(Array.isArray(response) ? response : [])];
      if (!picked.length) return done(result("invalid"));
      const key = new Set(item.answer.correct);
      const hits = picked.filter((id) => key.has(id)).length;
      const wrong = picked.filter((id) => !key.has(id)).length;
      if (hits === key.size && !wrong) return done(result("correct"));
      const share = Math.max(0, (hits - wrong) / key.size);
      return done(
        result(share > 0 ? "partial" : "incorrect", {
          share,
          why: wrongChoiceFeedback(
            item,
            picked.filter((id) => !key.has(id)),
          ),
        }),
      );
    }
    case "numeric":
    case "application": {
      if (item.type === "application" && !item.answer?.value)
        return done(result("self-check"));
      const got = readNumber(response);
      if (!got)
        return done(
          result(String(response ?? "").trim() ? "unreadable" : "invalid"),
        );
      const ok = sameValue(
        got,
        Rational.of(String(item.answer.value).replace(/,/g, "")),
      );
      if (item.type === "application" && ok)
        return done(result("correct", { selfCheck: item.rubric }));
      return done(result(ok ? "correct" : "incorrect"));
    }
    case "fraction": {
      const got = readNumber(response);
      if (!got)
        return done(
          result(String(response ?? "").trim() ? "unreadable" : "invalid"),
        );
      if (!sameValue(got, readNumber(item.answer.value)))
        return done(result("incorrect"));
      if (item.answer.form === "simplified" && !lowestTerms(response)) {
        return done(
          result("incorrect", {
            why: bi(
              "That amount is right. Write it in lowest terms.",
              "Esa cantidad es correcta. Escríbela en su mínima expresión.",
            ),
            valueRight: true,
          }),
        );
      }
      return done(result("correct"));
    }
    case "equation": {
      const v = item.verify.solve.var;
      const text = String(response ?? "").replace(/\s+/g, "");
      if (!text) return done(result("invalid"));
      const parts = text.includes("=") ? text.split("=") : [v, text];
      if (parts.length !== 2 || parts[0] !== v) return done(result("unreadable"));
      const got = readNumber(parts[1]);
      if (!got) return done(result("unreadable"));
      return done(
        result(
          sameValue(got, readNumber(item.verify.solve.value))
            ? "correct"
            : "incorrect",
        ),
      );
    }
    case "expression": {
      const text = String(response ?? "").trim();
      if (!text) return done(result("invalid"));
      const { a, vars } = item.verify.identity;
      const names = Object.keys(vars);
      const n = Math.min(...names.map((k) => vars[k].length));
      try {
        for (let i = 0; i < n; i += 1) {
          const env = Object.fromEntries(names.map((k) => [k, vars[k][i]]));
          if (!evaluate(implicit(text), env).eq(evaluate(a, env)))
            return done(result("incorrect"));
        }
        return done(result("correct"));
      } catch {
        return done(result("unreadable"));
      }
    }
    case "numberline": {
      const got = readNumber(response);
      if (!got)
        return done(
          result(String(response ?? "").trim() ? "unreadable" : "invalid"),
        );
      return done(
        result(
          sameValue(got, readNumber(item.answer.point))
            ? "correct"
            : "incorrect",
        ),
      );
    }
    case "graph": {
      const pts = Array.isArray(response) ? response : [];
      if (!pts.length) return done(result("invalid"));
      const key = item.answer.points.map((p) => p.join(","));
      const got = pts.map((p) => (Array.isArray(p) ? p.join(",") : ""));
      const hits = got.filter((p) => key.includes(p)).length;
      if (hits === key.length && got.length === key.length)
        return done(result("correct"));
      return done(
        result(hits ? "partial" : "incorrect", { share: hits / key.length }),
      );
    }
    case "match": {
      const map = response && typeof response === "object" ? response : {};
      const ok = item.pairs.filter((p) => map[side(p.left)] === side(p.right)).length;
      if (!Object.keys(map).length) return done(result("invalid"));
      return done(
        result(
          ok === item.pairs.length ? "correct" : ok ? "partial" : "incorrect",
          { share: ok / item.pairs.length },
        ),
      );
    }
    case "sort": {
      const map = response && typeof response === "object" ? response : {};
      const all = item.bins.flatMap((b, bi_) =>
        b.items.map((it) => ({ key: it.en, bin: bi_ })),
      );
      if (!Object.keys(map).length) return done(result("invalid"));
      const ok = all.filter((x) => Number(map[x.key]) === x.bin).length;
      return done(
        result(ok === all.length ? "correct" : ok ? "partial" : "incorrect", {
          share: ok / all.length,
        }),
      );
    }
    case "error": {
      const n = Number(response);
      if (!Number.isInteger(n)) return done(result("invalid"));
      return done(
        result(n === item.answer.errorStep ? "correct" : "incorrect"),
      );
    }
    case "model": {
      const facts = response && typeof response === "object" ? response : null;
      if (!facts) return done(result("invalid"));
      const goal = item.verify.goalFacts;
      const ok = Object.keys(goal).every(
        (k) => String(facts[k]) === String(goal[k]),
      );
      return done(result(ok ? "correct" : "incorrect"));
    }
    case "constructed":
    case "explain": {
      // Written reasoning is checked by the learner against the rubric. We never guess at its quality.
      const text = String(response?.text ?? response ?? "").trim();
      if (!text) return done(result("invalid"));
      return done(
        result("self-check", {
          rubric: item.rubric,
          sample: item.rubric.sample,
        }),
      );
    }
    default:
      return done(result("invalid"));
  }
}

// "3(x+4)" and "2x" are ordinary ways to write expressions. Insert the multiplication sign so the evaluator can read them.
const SUP = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
// Superscript digits are how a worksheet writes an exponent: x⁵ means x^5, 10² means 10^2.
export const unSuper = (text) => String(text).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^${[...m].map((c) => SUP[c]).join("")}`);
export function implicit(text) {
  return unSuper(text)
    .replace(/(\d|\))(?=[a-zA-Z(])/g, "$1*")
    .replace(/([a-zA-Z])(?=\d)/g, "$1*")
    .replace(/(\))(?=\()/g, "$1*")
    .replace(/(\))(?=\d)/g, "$1*");
}

// ---------------------------------------------------------------- selection
const stable = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1)
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};

// Pick items for a purpose. Same seed, same list. Spread across standards first, then fill; never repeat an id or an
// item the learner just saw; honour DOK, type, representation and standard filters.
export function selectItems(
  bank,
  {
    mode = "practice",
    grade = null,
    standards = null,
    skills = null,
    types = null,
    dok = null,
    exclude = [],
    count = null,
    seed = 1,
    representations = null,
  } = {},
) {
  const spec = MODES[mode] || MODES.practice;
  const wantDok = dok || spec.dok;
  const skip = new Set(exclude);
  const pool = bank.filter(
    (it) =>
      (grade === null || it.grade === Number(grade)) &&
      !skip.has(it.id) &&
      wantDok.includes(it.dok) &&
      (!standards ||
        standards.some(
          (s) => it.standard === s || it.standard.startsWith(`${s}.`),
        )) &&
      (!skills || (it.skill && skills.includes(it.skill))) &&
      (!types || types.includes(it.type)) &&
      (!representations || representations.includes(it.representation)),
  );
  const n = Math.min(count ?? spec.size, pool.length);
  const rng = seededRandom(stable(`${mode}:${grade}:${seed}`));
  const byStd = new Map();
  for (const it of [...pool].sort((a, b) => a.id.localeCompare(b.id))) {
    if (!byStd.has(it.standard)) byStd.set(it.standard, []);
    byStd.get(it.standard).push(it);
  }
  for (const list of byStd.values()) list.sort(() => rng() - 0.5);
  const order = [...byStd.keys()].sort(() => rng() - 0.5);
  const picked = [];
  const types_ = new Map();
  // Round-robin across standards; inside a standard prefer a type not yet used so a set is varied.
  while (picked.length < n && order.some((k) => byStd.get(k).length)) {
    for (const k of order) {
      const list = byStd.get(k);
      if (!list.length || picked.length >= n) continue;
      list.sort(
        (a, b) => (types_.get(a.type) || 0) - (types_.get(b.type) || 0),
      );
      const it = list.shift();
      types_.set(it.type, (types_.get(it.type) || 0) + 1);
      picked.push(it);
    }
  }
  return picked;
}

// An assessment: items + a blueprint that says exactly what it covers, so a teacher can see what a score is a score OF.
export function buildAssessment(bank, options = {}) {
  const items = selectItems(bank, options);
  const blueprint = {
    mode: options.mode || "practice",
    count: items.length,
    standards: [...new Set(items.map((i) => i.standard))].sort(),
    dok: countBy(items, (i) => i.dok),
    types: countBy(items, (i) => i.type),
    points: items.reduce((s, i) => s + (i.scoring?.points ?? 1), 0),
    selfChecked: items.filter((i) =>
      ["constructed", "explain"].includes(i.type),
    ).length,
  };
  return { items, blueprint, seed: options.seed ?? 1 };
}
const countBy = (list, f) =>
  list.reduce((o, x) => ({ ...o, [f(x)]: (o[f(x)] || 0) + 1 }), {});

// Score a finished assessment. Self-checked items are reported separately and never silently added to the auto score.
export function scoreAssessment(assessment, responses) {
  let earned = 0;
  let possible = 0;
  const detail = assessment.items.map((item) => {
    const r = checkResponse(item, responses[item.id]);
    if (r.status !== "self-check") {
      earned += r.points;
      possible += r.max;
    }
    return {
      id: item.id,
      standard: item.standard,
      dok: item.dok,
      status: r.status,
      points: r.points,
      max: r.max,
    };
  });
  const byStandard = {};
  for (const d of detail) {
    if (d.status === "self-check") continue;
    const e = (byStandard[d.standard] ||= { earned: 0, possible: 0 });
    e.earned += d.points;
    e.possible += d.max;
  }
  return {
    earned,
    possible,
    share: possible ? earned / possible : null,
    byStandard,
    detail,
    selfCheck: detail.filter((d) => d.status === "self-check").map((d) => d.id),
  };
}
