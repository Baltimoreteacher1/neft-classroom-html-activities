// invent-first.js — try your own way first, then meet the lesson's.
//
// "Invent first" is an invitation, never a gate: before a lesson shows its
// estimating methods, a student may try to invent one in a small scene (marks on
// a double number line, an optional friendlier number, an estimate). This module
// is the config-driven brain behind that scene:
//
//   classifyStrategy(config, moves)  which of the lesson's methods the student's
//                                    moves resemble — deterministic, no model,
//                                    and honest about doubt (it answers "unsure"
//                                    rather than guess).
//   validateConfig(config)           the contract a lesson's invent-first file
//                                    must meet.
//   inventFirstToolFor(lessonConfig) the supplementary tool block for a pilot
//                                    lesson.
//
// Where the methods come from. A config does not invent pedagogy: every method
// it can name quotes the lesson's own config.json (keyIdea, explore cards, the
// worked example), and invent-first.test.mjs fails if a quote stops being a
// literal run of that lesson's text. The detectors below recognise the SHAPE of
// a student's moves — which numbers they marked and how those numbers relate —
// not whether the estimate is good. Nothing here ever computes an answer to show.
//
// No imports: the same file runs in the browser, in node tests and in a build.

/** Lessons that carry an invent-first file at data/invent-first/<id>.json. */
export const PILOT_LESSONS = ["4-3"];

export const LIMITS = { marks: 12, percent: 200, amount: 1_000_000 };

const BASE_ID = /^(\d+-\d+)(?:-|$)/;

/**
 * The invent-first tool for a pilot lesson (and its group, part-2 and catch-up
 * variants), or null. Reads only the lesson id; it adds a tool and touches no
 * lesson content.
 */
export function inventFirstToolFor(config) {
  const base = BASE_ID.exec(String(config?.lessonId || ""))?.[1];
  return base && PILOT_LESSONS.includes(base) ? { kind: "invent-first", lesson: base } : null;
}

const round2 = (v) => Math.round(v * 100) / 100;
const num = (v) => {
  if (v == null || (typeof v === "string" && !v.trim())) return null;
  return Number.isFinite(Number(v)) ? Number(v) : null;
};

/**
 * Clean a student's raw entries into the moves the detectors read. Anything that
 * is not a usable number is dropped, never repaired: a mark needs a percent; its
 * amount is optional; the friendlier whole and the estimate are optional.
 *
 * @returns {{marks: {p: number, x: number|null}[], whole: number|null, estimate: number|null}}
 */
export function normalizeMoves(raw) {
  const marks = [];
  for (const m of Array.isArray(raw?.marks) ? raw.marks : []) {
    const raw = num(m?.p);
    const p = raw === null ? null : round2(raw);
    if (p === null || p <= 0 || p > LIMITS.percent) continue;
    const x = num(m?.x);
    marks.push({ p, x: x !== null && x >= 0 && x <= LIMITS.amount ? round2(x) : null });
    if (marks.length === LIMITS.marks) break;
  }
  const whole = num(raw?.whole);
  const estimate = num(raw?.estimate);
  return {
    marks,
    whole: whole !== null && whole > 0 && whole <= LIMITS.amount ? round2(whole) : null,
    estimate:
      estimate !== null && estimate >= 0 && estimate <= LIMITS.amount ? round2(estimate) : null,
  };
}

/** |a - b| within a fraction of b. */
const close = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-9);

function subsets(items, sizes) {
  const out = [];
  const walk = (start, picked) => {
    if (sizes.includes(picked.length)) out.push([...picked]);
    if (picked.length === Math.max(...sizes)) return;
    for (let i = start; i < items.length; i += 1) {
      picked.push(items[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  };
  walk(0, []);
  return out;
}

/**
 * Each signal is one fact about a student's moves. It returns evidence — the
 * student's own marks that make it true — or null. `ctx` carries the problem,
 * the cleaned moves, and the config's benchmarks and tolerances.
 */
export const SIGNALS = {
  /** A benchmark percent was marked close to the target percent. */
  nearBenchmark(ctx) {
    const near = ctx.marks
      .filter((m) => ctx.benchmarks.includes(m.p) && Math.abs(m.p - ctx.target) <= ctx.tol.near)
      .sort((a, b) => Math.abs(a.p - ctx.target) - Math.abs(b.p - ctx.target) || a.p - b.p);
    return near.length ? { marks: [near[0]] } : null;
  },

  /** The estimate sits at the amount of that nearby benchmark. */
  estimateAtBenchmark(ctx) {
    const found = SIGNALS.nearBenchmark(ctx);
    if (!found || ctx.estimate === null) return null;
    const [m] = found.marks;
    const amount = m.x ?? (m.p / 100) * ctx.whole;
    return close(ctx.estimate, amount, ctx.tol.estimate) ? found : null;
  },

  /** Benchmark marks on both sides of the target percent, each with an amount. */
  bracketBenchmarks(ctx) {
    const have = ctx.marks.filter((m) => ctx.benchmarks.includes(m.p) && m.x !== null);
    const below = have.filter((m) => m.p < ctx.target).sort((a, b) => b.p - a.p)[0];
    const above = have.filter((m) => m.p > ctx.target).sort((a, b) => a.p - b.p)[0];
    return below && above ? { marks: [below, above] } : null;
  },

  /** The estimate lies clearly between the two bracketing amounts, at neither end. */
  estimateBetween(ctx) {
    const found = SIGNALS.bracketBenchmarks(ctx);
    if (!found || ctx.estimate === null) return null;
    const [lo, hi] = found.marks;
    const slack = ctx.tol.estimate;
    return ctx.estimate > lo.x * (1 + slack) && ctx.estimate < hi.x * (1 - slack) ? found : null;
  },

  /** A 10% mark, and other multiples of 10% whose amounts are whole multiples of it. */
  tenChunkLadder(ctx) {
    const ten = ctx.marks.find((m) => m.p === 10 && m.x !== null);
    if (!ten) return null;
    const climbs = ctx.marks.filter(
      (m) =>
        m.x !== null &&
        m.p !== 10 &&
        m.p % 10 === 0 &&
        close(m.x, (m.p / 10) * ten.x, ctx.tol.amount),
    );
    return climbs.length ? { marks: [ten, ...climbs] } : null;
  },

  /** Two or three marks whose percents add up to the target and whose amounts add up to the estimate. */
  combineSum(ctx) {
    if (ctx.estimate === null) return null;
    const usable = ctx.marks.filter((m) => m.x !== null);
    for (const group of subsets(usable, [2, 3])) {
      const percent = group.reduce((s, m) => s + m.p, 0);
      const amount = group.reduce((s, m) => s + m.x, 0);
      if (
        Math.abs(percent - ctx.target) <= ctx.tol.sumPercent &&
        close(ctx.estimate, amount, ctx.tol.estimate)
      ) {
        return { marks: group };
      }
    }
    return null;
  },

  /** Two marks where both the percent and the amount are halved or doubled. */
  scalePair(ctx) {
    const usable = ctx.marks.filter((m) => m.x !== null && m.x > 0);
    for (const a of usable) {
      for (const b of usable) {
        if (a === b) continue;
        if (close(b.p, a.p / 2, 0.01) && close(b.x, a.x / 2, ctx.tol.amount)) {
          return { marks: [a, b] };
        }
      }
    }
    return null;
  },

  /** The student named an easier number to use in place of the whole. */
  compatibleWhole(ctx) {
    const w = ctx.moves.whole;
    if (w === null || w === ctx.problem.whole) return null;
    return close(w, ctx.problem.whole, ctx.tol.friendlierWhole) ? { whole: w } : null;
  },

  /** Several tries at the target percent itself, with different amounts. */
  repeatedGuesses(ctx) {
    const tries = ctx.marks.filter((m) => Math.abs(m.p - ctx.target) <= 1 && m.x !== null);
    return tries.length >= 3 && new Set(tries.map((m) => m.x)).size >= 2 ? { marks: tries } : null;
  },
};

/**
 * Which strategy do these moves resemble?
 *
 * A strategy matches when EVERY signal it `needs` holds. More specific matches
 * (more needs) outrank less specific ones, and the rest are reported as `also`.
 * When the best matches are equally specific the answer is "unsure" with the
 * tied candidates, and when nothing matches it is "unsure" with none: a wrong
 * label shown to a child is worse than an honest "I can't tell".
 *
 * @returns {{id: string, thinking: string|null, also: string[], candidates: string[],
 *            evidence: Record<string, any>}}
 */
export function classifyStrategy(config, rawMoves) {
  const moves = normalizeMoves(rawMoves);
  const ctx = {
    problem: config.problem,
    target: config.problem.percent,
    moves,
    marks: moves.marks,
    estimate: moves.estimate,
    whole: moves.whole ?? config.problem.whole,
    benchmarks: config.benchmarks,
    tol: config.tolerance,
  };
  const evidence = {};
  for (const name of Object.keys(SIGNALS)) {
    const found = SIGNALS[name](ctx);
    if (found) evidence[name] = found;
  }
  const matched = config.strategies
    .filter((s) => s.needs.every((need) => evidence[need]))
    .sort((a, b) => b.needs.length - a.needs.length);
  const unsure = (candidates) => ({
    id: "unsure",
    thinking: null,
    also: [],
    candidates,
    evidence,
  });
  if (!matched.length) return unsure([]);
  const top = matched.filter((s) => s.needs.length === matched[0].needs.length);
  if (top.length > 1) return unsure(top.map((s) => s.id));
  return {
    id: top[0].id,
    thinking: top[0].thinking ?? null,
    also: matched.slice(1).map((s) => s.id),
    candidates: [],
    evidence,
  };
}

const isText = (t) =>
  t && typeof t.en === "string" && t.en.trim() && typeof t.es === "string" && t.es.trim();

/** Every contract a lesson's invent-first file must meet. Returns problems; empty means valid. */
export function validateConfig(config) {
  const problems = [];
  const need = (ok, message) => {
    if (!ok) problems.push(message);
  };
  need(config?.schemaVersion === 1, "schemaVersion must be 1");
  need(/^\d+-\d+$/.test(config?.lesson || ""), "lesson must be a core lesson id");
  for (const key of ["title", "invitation"]) need(isText(config?.[key]), `${key} needs en and es`);
  const p = config?.problem;
  need(
    p && p.percent > 0 && p.percent < 100 && p.whole > 0 && isText(p.context),
    "problem needs percent (0-100), whole and a bilingual context",
  );
  need(
    Array.isArray(config?.benchmarks) && config.benchmarks.every((b) => b > 0 && b <= 100),
    "benchmarks must be percents",
  );
  for (const key of ["amount", "estimate", "near", "sumPercent", "friendlierWhole"]) {
    need(config?.tolerance?.[key] > 0, `tolerance.${key} must be positive`);
  }
  for (const key of ["adding", "scaling"]) {
    need(isText(config?.thinking?.[key]), `thinking.${key} needs en and es`);
  }
  const methods = new Map((config?.methods || []).map((m) => [m.id, m]));
  need(
    methods.size === (config?.methods || []).length && methods.size > 0,
    "method ids must be unique",
  );
  for (const m of methods.values()) {
    need(isText(m.name) && isText(m.quote), `method ${m.id} needs a bilingual name and quote`);
  }
  const ids = new Set();
  for (const s of config?.strategies || []) {
    need(!ids.has(s.id) && s.id !== "unsure", `strategy id ${s.id} is duplicated or reserved`);
    ids.add(s.id);
    need(
      Array.isArray(s.needs) && s.needs.length > 0 && s.needs.every((n) => n in SIGNALS),
      `strategy ${s.id} needs known signals`,
    );
    need(methods.has(s.method), `strategy ${s.id} compares to an unknown lesson method`);
    need(["adding", "scaling", null, undefined].includes(s.thinking), `strategy ${s.id} thinking`);
    for (const key of ["name", "noticed", "contrast"]) {
      need(isText(s[key]), `strategy ${s.id} needs a bilingual ${key}`);
    }
  }
  for (const key of ["none", "mixed"])
    need(isText(config?.unsure?.[key]), `unsure.${key} needs en and es`);
  need(isText(config?.unsure?.contrast), "unsure.contrast needs en and es");
  return problems;
}
