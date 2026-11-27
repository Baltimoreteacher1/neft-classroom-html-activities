// Intelligent document fitting for printables.
//
//   const r = await fitDocument(activity, "one-page", { lang, measurePages });
//   r -> { ok, goal, options, pages, measured, notes: [{en, es}], alternative? }
//
// A goal is met by walking a ladder of layouts from generous to tight (see fit-levels.js) and keeping the first one
// that fits. The ladder only trades spacing, work-box height, margins, two-column choices and text size, and stops
// at the usability floors (11pt body, 14pt for large print, work boxes of about half an inch, 0.5in margins). It
// never removes or reorders content and never puts an answer on the student sheet. When the goal cannot be met
// without going under a floor, ok is false, options is null, and `alternative` says what does work.
//
// `measurePages(html, options)` is injected: it returns a page count or { pages, heightIn, clipped } for the STUDENT
// document html, from a real layout engine (see fit-dom.js and tools/studio-x-fit-e2e.mjs). Without it the pure
// estimate in fit-estimate.js is used and `measured` is false.
//
// Print a fit with renderFitted(activity, options, { part, lang }) from fit-levels.js.

import { normalizeActivity } from "../core/schema.js";
import { estimateLayout, sheetItems } from "./fit-estimate.js";
import { LEVEL_ORDER, levelOptions, renderFitted } from "./fit-levels.js";
import { GOAL_COPY, describeFit, failureCopy } from "./fit-notes.js";

export const FIT_GOALS = GOAL_COPY;
export const FIT_GOAL_IDS = Object.freeze(GOAL_COPY.map((g) => g.id));
export { pageThumbnails } from "./fit-estimate.js";
export { renderFitted } from "./fit-levels.js";

const LARGE_PAGE_CAP = 6;
const MAX_REMOVALS = 3;
const halfHeight = (marginIn) => (11 - 2 * marginIn - 0.2) / 2;

function makeMeasure(lang, measurePages) {
  const cache = new Map();
  return async (activity, options) => {
    const key = `${activity.blocks.length}|${JSON.stringify(options)}`;
    if (cache.has(key)) return cache.get(key);
    const html = renderFitted(activity, options, { part: "student", lang }).html;
    const est = estimateLayout(activity, options);
    let m;
    if (typeof measurePages === "function") {
      const got = await measurePages(html, options);
      const r = typeof got === "number" ? { pages: got } : got || {};
      m = {
        pages: Number(r.pages) || est.pages,
        heightIn: Number.isFinite(r.heightIn) ? r.heightIn : est.heightIn,
        clipped: Array.isArray(r.clipped) ? r.clipped : [],
        stranded: Array.isArray(r.stranded) ? r.stranded : [],
        measured: true,
      };
    } else
      m = { pages: est.pages, heightIn: est.heightIn, clipped: [], stranded: [], measured: false };
    cache.set(key, m);
    return m;
  };
}

const sameFit = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** The ladder of layouts for `activity`, generous to tight, without repeats (a trim a sheet cannot use is dropped). */
function ladder(activity, { from = "standard", extra = {} } = {}) {
  const out = [];
  for (const id of LEVEL_ORDER.slice(LEVEL_ORDER.indexOf(from))) {
    const o = levelOptions(id, activity, extra);
    if (!out.some((x) => sameFit(x, { ...o, level: x.level }))) out.push(o);
  }
  return out;
}

const usable = (m) => m.clipped.length === 0;

/** Question numbers (as printed) whose removal would let the sheet meet `fits`, fewest first; null if more than a few. */
async function removalSuggestion(activity, options, measure, fits) {
  const items = sheetItems(activity, options)
    .filter((i) => i.number)
    .sort((x, y) => y.h - x.h);
  for (let k = 1; k <= Math.min(MAX_REMOVALS, items.length - 1); k++) {
    const drop = items.slice(0, k);
    const ids = new Set(drop.map((i) => i.id));
    const trimmed = { ...activity, blocks: activity.blocks.filter((b) => !ids.has(b.id)) };
    const m = await measure(trimmed, options);
    if (usable(m) && fits(m)) return drop.map((i) => i.number).sort((a, b) => a - b);
  }
  return null;
}

function ok(goal, options, m, extra = {}) {
  return {
    ok: true,
    goal,
    options,
    pages: m.pages,
    measured: m.measured,
    notes: describeFit(options, { pages: m.pages, measured: m.measured }),
    ...extra,
  };
}

async function fitPages(activity, goal, maxPages, measure, from) {
  const steps = ladder(activity, { from });
  let last = null;
  let lastOptions = steps.at(-1);
  for (const o of steps) {
    const m = await measure(activity, o);
    last = m;
    lastOptions = o;
    if (usable(m) && m.pages <= maxPages) return { done: ok(goal, o, m) };
  }
  return { failed: { m: last, options: lastOptions } };
}

async function fitHalf(activity, goal, measure) {
  const copies = goal === "two-per-page" ? 2 : 1;
  const steps = ladder(activity, { from: "standard", extra: { copies, marginIn: 0.5 } });
  let last = null;
  let lastOptions = steps.at(-1);
  for (const o of steps) {
    const m = await measure(activity, o);
    last = m;
    lastOptions = o;
    if (usable(m) && m.heightIn <= halfHeight(o.marginIn))
      return { done: ok(goal, o, { ...m, pages: 1 }) };
  }
  return { failed: { m: last, options: lastOptions } };
}

async function fitCompact(activity, measure) {
  const steps = ladder(activity, { from: "trim5" });
  const rows = [];
  for (const o of steps) rows.push({ o, m: await measure(activity, o) });
  const good = rows.filter((r) => usable(r.m));
  const pick = good.length ? good : rows;
  const min = Math.min(...pick.map((r) => r.m.pages));
  const best = pick.find((r) => r.m.pages === min);
  return ok("compact-review", best.o, best.m);
}

async function fitMoreWorkspace(activity, measure) {
  const base = await measure(activity, levelOptions("standard", activity));
  const cap = base.pages + 1;
  for (const id of ["generous", "spacious"]) {
    const o = levelOptions(id, activity);
    const m = await measure(activity, o);
    if (usable(m) && m.pages <= cap) return ok("more-workspace", o, m);
  }
  const o = levelOptions("spacious", activity);
  return ok("more-workspace", o, await measure(activity, o));
}

async function fitLarge(activity, measure) {
  const o = levelOptions("large", activity);
  const m = await measure(activity, o);
  return { o, m };
}

/**
 * Fit `activity` to `goal` (one of FIT_GOAL_IDS).
 * @param {object} activity an lp-activity/1 worksheet
 * @param {string} goal
 * @param {{ lang?: string, measurePages?: (html: string, options: object) => Promise<number | {pages: number, heightIn?: number, clipped?: string[]}> }} [opts]
 */
export async function fitDocument(input, goal, { lang = "en", measurePages } = {}) {
  if (!FIT_GOAL_IDS.includes(goal)) throw new RangeError(`unknown fit goal: ${goal}`);
  const activity = normalizeActivity(input);
  const measure = makeMeasure(lang, measurePages);
  return run(activity, goal, measure, true);
}

async function run(activity, goal, measure, withAlternative) {
  const alternative = async (order, why) => {
    if (!withAlternative) return undefined;
    for (const g of order) {
      const r = await run(activity, g, measure, false);
      if (r.ok) return { goal: g, options: r.options, pages: r.pages, notes: r.notes, ...why(r) };
    }
    return undefined;
  };
  const fail = async (copyArgs, order, removeFits) => {
    const nums =
      withAlternative && removeFits
        ? await removalSuggestion(activity, copyArgs.options, measure, removeFits)
        : null;
    const alt = await alternative(order, (r) => ({ message: null, pages: r.pages }));
    const message = failureCopy(goal, {
      ...copyArgs,
      nums,
      altPages: alt?.pages,
      altGoal: alt?.goal,
    });
    if (alt) alt.message = message.at(-1);
    return {
      ok: false,
      goal,
      options: null,
      pages: copyArgs.pages,
      measured: copyArgs.measured,
      notes: message,
      ...(alt ? { alternative: alt } : {}),
      ...(nums ? { removeQuestions: nums } : {}),
    };
  };

  if (goal === "one-page" || goal === "two-pages") {
    const target = goal === "one-page" ? 1 : 2;
    const { done, failed } = await fitPages(
      activity,
      goal,
      target,
      measure,
      goal === "one-page" ? "standard" : "airy",
    );
    if (done) return done;
    return fail(
      { pages: failed.m.pages, target, measured: failed.m.measured, options: failed.options },
      goal === "one-page" ? ["two-pages", "compact-review"] : ["compact-review"],
      (m) => m.pages <= target,
    );
  }
  if (goal === "half-page" || goal === "two-per-page") {
    const { done, failed } = await fitHalf(activity, goal, measure);
    if (done) return done;
    return fail(
      {
        pages: 1,
        target: 1,
        measured: failed.m.measured,
        needIn: failed.m.heightIn,
        halfIn: halfHeight(failed.options.marginIn),
        options: failed.options,
      },
      ["one-page", "two-pages"],
      (m) => m.heightIn <= halfHeight(failed.options.marginIn),
    );
  }
  if (goal === "compact-review") return fitCompact(activity, measure);
  if (goal === "more-workspace") return fitMoreWorkspace(activity, measure);
  const { o, m } = await fitLarge(activity, measure);
  if (usable(m) && m.pages <= LARGE_PAGE_CAP) return ok(goal, o, m);
  return fail(
    { pages: m.pages, measured: m.measured, options: o },
    ["two-pages", "compact-review"],
    null,
  );
}
