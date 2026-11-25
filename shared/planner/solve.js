// "My Week" solver: priority-weighted knapsack over a dependency forest, then day placement under per-day caps.
// Deterministic: same candidates + params (incl. seed) -> byte-identical plan. No clock, no Math.random.
//
//  1. minutes and value per candidate from the band mix (BAND_TIME_FACTOR, BAND_DOMAIN_EMPHASIS) and its priority
//     (arc position, first-covered standards, domain balance via per-domain decay);
//  2. best dependency-closed set within block x days minutes (preorder DP: take an item, or skip its whole subtree);
//  3. place the set into days in teaching order, a dependency always on the same day earlier or on an earlier day;
//     if fragmentation leaves an item unplaced, shrink the budget by its minutes and solve again;
//  4. everything not placed is listed in `dropped` with a code and a reason. A day over its cap is never returned.
import {
  ARC_SPAN,
  ARC_TOP,
  BAND_DOMAIN_EMPHASIS,
  BAND_KEYS,
  BAND_TIME_FACTOR,
  DOMAIN_DECAY,
  MATERIALS,
  PLANNER_VERSION,
  STANDARD_BONUS,
  STANDARD_BONUS_CAP,
  TIE_JITTER,
  VALUE_SCALE,
  WIDA_NOTE,
} from "./constants.js";
import { PlannerError } from "./errors.js";

export { PlannerError };

/** FNV-1a 32-bit over the UTF-16 code units of `text`: a stable, dependency-free tie-break hash (not a PRNG). */
function tieHash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const bandTotal = (bands) => BAND_KEYS.reduce((n, k) => n + bands[k], 0);

/** Count-weighted time factor of the mix. */
export function timeFactor(bands) {
  const total = bandTotal(bands);
  return BAND_KEYS.reduce((n, k) => n + bands[k] * BAND_TIME_FACTOR[k], 0) / total;
}

/** Count-weighted emphasis of a domain for the mix (1 when no band has an opinion). */
export function emphasis(bands, domain) {
  const total = bandTotal(bands);
  return (
    BAND_KEYS.reduce((n, k) => n + bands[k] * (BAND_DOMAIN_EMPHASIS[k][domain] ?? 1), 0) / total
  );
}

export function priceCandidates(candidates, params) {
  const factor = timeFactor(params.bands);
  return candidates.map((c) => {
    const base =
      ARC_TOP - ARC_SPAN * c.arc + Math.min(STANDARD_BONUS_CAP, STANDARD_BONUS * c.newStandards);
    const weighted = base * DOMAIN_DECAY ** c.domainRank * emphasis(params.bands, c.domain);
    const jitter = params.seed ? tieHash(`${params.seed}|${c.id}`) % (TIE_JITTER + 1) : 0;
    return {
      ...c,
      minutes: Math.max(1, Math.round(c.baseMinutes * factor)),
      value: Math.round(VALUE_SCALE * weighted) + jitter,
    };
  });
}

/** Preorder of the dependency forest (roots and children in teaching order) with subtree sizes. */
function preorder(items) {
  const kids = new Map();
  const roots = [];
  for (const it of items) {
    if (it.dependsOn) {
      if (!kids.has(it.dependsOn)) kids.set(it.dependsOn, []);
      kids.get(it.dependsOn).push(it);
    } else roots.push(it);
  }
  const seq = [];
  const walk = (it) => {
    seq.push(it);
    for (const k of kids.get(it.id) || []) walk(k);
  };
  for (const r of roots) walk(r);
  if (seq.length !== items.length) throw new PlannerError("dependency cycle in candidates");
  const index = new Map(seq.map((it, i) => [it.id, i]));
  const next = seq.map((_, i) => i + 1);
  for (let i = seq.length - 1; i >= 0; i--) {
    for (const k of kids.get(seq[i].id) || []) next[i] = Math.max(next[i], next[index.get(k.id)]);
  }
  return { seq, next };
}

/** Best-value dependency-closed set within `budget` minutes. -> Set of ids. */
function knapsack({ seq, next }, budget, block) {
  const n = seq.length;
  const width = budget + 1;
  const best = new Float64Array((n + 1) * width);
  const took = new Uint8Array(n * width);
  for (let i = n - 1; i >= 0; i--) {
    const m = seq[i].minutes;
    const eligible = m <= block;
    for (let w = 0; w < width; w++) {
      const skip = best[next[i] * width + w];
      let value = skip;
      if (eligible && m <= w) {
        const take = seq[i].value + best[(i + 1) * width + (w - m)];
        if (take > skip) {
          value = take;
          took[i * width + w] = 1;
        }
      }
      best[i * width + w] = value;
    }
  }
  const chosen = new Set();
  for (let i = 0, w = budget; i < n; ) {
    if (took[i * width + w]) {
      chosen.add(seq[i].id);
      w -= seq[i].minutes;
      i += 1;
    } else i = next[i];
  }
  return chosen;
}

/** Fill days in order; an item is ready once its dependency is placed (earlier day, or earlier on this day). */
function place(selected, days, block) {
  const pending = [...selected].sort((a, b) => a.order - b.order);
  const placedIds = new Set();
  const plan = [];
  for (let d = 0; d < days; d++) {
    const items = [];
    let used = 0;
    for (;;) {
      const at = pending.findIndex(
        (it) => used + it.minutes <= block && (!it.dependsOn || placedIds.has(it.dependsOn)),
      );
      if (at < 0) break;
      const [it] = pending.splice(at, 1);
      items.push(it);
      placedIds.add(it.id);
      used += it.minutes;
    }
    plan.push(items);
  }
  return { plan, unplaced: pending };
}

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

function dropReason(it, byId, placed, params) {
  if (it.minutes > params.block) {
    return {
      code: "too_long",
      reason: `Takes ${it.minutes} minutes; one block is ${params.block}.`,
    };
  }
  const parent = it.dependsOn ? byId.get(it.dependsOn) : null;
  if (parent && !placed.has(parent.id)) {
    return {
      code: "needs_dropped",
      reason: `Needs "${parent.title}" first, and that was dropped.`,
      needs: parent.id,
    };
  }
  return {
    code: "low_priority",
    reason: `Lower priority than the items kept for ${params.block * params.days} available minutes (${params.days} x ${params.block}).`,
  };
}

const slim = (it) => ({
  id: it.id,
  source: it.source,
  title: it.title,
  domain: it.domain,
  minutes: it.minutes,
  standards: it.standards,
  dependsOn: it.dependsOn,
});

/**
 * planWeek(candidates, params, { unit, dates }) -> plan
 *  candidates: buildCandidates() output; params: parseParams().params; dates: ISO date per day, or null.
 */
export function planWeek(candidates, params, { unit = null, dates = null } = {}) {
  if (dates && dates.length !== params.days) throw new PlannerError("dates must match days");
  const items = priceCandidates(candidates, params);
  const byId = new Map(items.map((it) => [it.id, it]));
  const forest = preorder(items);

  let budget = params.block * params.days;
  let result = { plan: Array.from({ length: params.days }, () => []), unplaced: [] };
  while (budget > 0) {
    const chosen = knapsack(forest, budget, params.block);
    result = place(
      items.filter((it) => chosen.has(it.id)),
      params.days,
      params.block,
    );
    if (!result.unplaced.length) break;
    budget -= Math.max(
      1,
      result.unplaced.reduce((n, it) => n + it.minutes, 0),
    );
  }
  if (budget <= 0) result = { plan: Array.from({ length: params.days }, () => []), unplaced: [] };

  const placed = new Set(result.plan.flat().map((it) => it.id));
  const days = result.plan.map((list, i) => ({
    day: i + 1,
    date: dates ? dates[i] : null,
    cap: params.block,
    minutes: list.reduce((n, it) => n + it.minutes, 0),
    items: list.map(slim),
  }));
  const over = days.find((d) => d.minutes > d.cap);
  if (over)
    throw new PlannerError(
      `refused: day ${over.day} would hold ${over.minutes} of ${over.cap} minutes`,
    );

  const dropped = items
    .filter((it) => !placed.has(it.id))
    .map((it) => ({ ...slim(it), ...dropReason(it, byId, placed, params) }));
  const standardsAll = new Set(items.flatMap((it) => it.standards));
  const standardsCovered = new Set(result.plan.flat().flatMap((it) => it.standards));
  const domainMinutes = {};
  for (const it of result.plan.flat())
    domainMinutes[it.domain] = (domainMinutes[it.domain] || 0) + it.minutes;

  return {
    version: PLANNER_VERSION,
    params,
    unit,
    materials: MATERIALS,
    note: WIDA_NOTE,
    days,
    dropped,
    summary: {
      capacity: params.block * params.days,
      plannedMinutes: days.reduce((n, d) => n + d.minutes, 0),
      droppedMinutes: dropped.reduce((n, it) => n + it.minutes, 0),
      poolMinutes: items.reduce((n, it) => n + it.minutes, 0),
      medianDayMinutes: median(days.map((d) => d.minutes)),
      domainMinutes,
      standardsCovered: [...standardsCovered].sort(),
      standardsTotal: standardsAll.size,
      timeFactor: Math.round(timeFactor(params.bands) * 1000) / 1000,
    },
  };
}
