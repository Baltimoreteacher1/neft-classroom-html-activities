/* =============================================================================
 * signal.js — Act 3. Live class signal, and the honest silence when there
 * isn't any.
 * -----------------------------------------------------------------------------
 * Two very different reads:
 *   /api/class-pulse         student-safe, no auth, k-anonymity floor enforced
 *                            server-side. `suppressed: true` is a NORMAL answer,
 *                            never an error, and must never surface as one.
 *   /api/misconception-heatmap  teacher-only, gated on TEACHER_KEY. Any failure
 *                            (401 / 503 / offline) is swallowed in silence so a
 *                            student device shows exactly the neutral view.
 * ========================================================================== */

import { normalizeStandard } from "./data.js";

const PULSE_URL = "/api/class-pulse";
const HEATMAP_URL = "/api/misconception-heatmap?days=30";
const TEACHER_KEY_STORAGE = "neft.teacher.key";

export const QUIET_MESSAGE =
  "Live class signal appears once enough of the class has worked in the lessons. Showing the curriculum view.";

export function createSignal() {
  // days -> Promise<pulse>. One request per window, ever, unless it failed.
  const cache = new Map();

  function pulse(days) {
    const n = Math.min(45, Math.max(1, Math.round(days) || 7));
    const hit = cache.get(n);
    if (hit) return hit;
    const promise = fetchPulse(n).then((result) => {
      // A transient network failure must not pin the map into the quiet state
      // for the rest of the session, so an unreachable window is not kept.
      if (result.stale) cache.delete(n);
      return result;
    });
    cache.set(n, promise);
    return promise;
  }

  async function fetchPulse(n) {
    try {
      const res = await fetch(`${PULSE_URL}?days=${n}`, { credentials: "same-origin" });
      if (!res.ok) return quiet(n, true);
      const data = await res.json();
      if (!data || data.ok === false) return quiet(n, true);
      return {
        ok: true,
        days: data.days || n,
        cohort: data.cohort || 0,
        minCohort: data.minCohort || 0,
        suppressed: data.suppressed !== false,
        totalTagged: data.totalTagged || 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        stale: false,
      };
    } catch {
      return quiet(n, true);
    }
  }

  function quiet(days, stale) {
    return {
      ok: true,
      days,
      cohort: 0,
      minCohort: 0,
      suppressed: true,
      totalTagged: 0,
      tags: [],
      stale: !!stale,
    };
  }

  return { pulse };
}

/**
 * node id -> 0..1 intensity, summed across every tag that names it, normalised
 * against the loudest standard so one dominant tag doesn't wash the map out.
 */
export function signalMap(pulse, model) {
  const out = new Map();
  if (!pulse || pulse.suppressed || !Array.isArray(pulse.tags)) return out;
  for (const tag of pulse.tags) {
    for (const raw of tag.standards || []) {
      const id = model.resolve(raw);
      if (!id) continue;
      out.set(id, (out.get(id) || 0) + (Number(tag.share) || 0));
    }
  }
  let max = 0;
  for (const v of out.values()) if (v > max) max = v;
  if (max > 0) for (const [k, v] of out) out.set(k, Math.min(1, v / max));
  return out;
}

/** Rank standards by live share, for the "where the class is stuck" rail. */
export function stuckList(pulse, model) {
  if (!pulse || pulse.suppressed || !Array.isArray(pulse.tags)) return [];
  const rows = [];
  for (const tag of pulse.tags) {
    for (const raw of tag.standards || []) {
      const id = model.resolve(raw);
      const node = id ? model.byId.get(id) : null;
      if (!node) continue;
      rows.push({
        id,
        node,
        tag: tag.tag,
        label: tag.label,
        share: tag.share || 0,
        count: tag.count || 0,
      });
    }
  }
  rows.sort((a, b) => b.share - a.share || a.id.localeCompare(b.id));
  return rows.slice(0, 6);
}

/**
 * Teacher enrichment. Returns a Map of normalised standard id -> rows[], or an
 * empty Map on any failure. Never throws, never logs, never blocks.
 */
export async function loadTeacherRows(model) {
  const empty = new Map();
  let key = "";
  try {
    key = localStorage.getItem(TEACHER_KEY_STORAGE) || "";
  } catch {
    return empty;
  }
  if (!key) return empty;

  try {
    const res = await fetch(HEATMAP_URL, {
      credentials: "same-origin",
      headers: { "x-teacher-key": key },
    });
    if (!res.ok) return empty;
    const data = await res.json();
    if (!data || data.ok === false || !Array.isArray(data.rows)) return empty;

    const byStandard = new Map();
    for (const row of data.rows) {
      const id = model.resolve(row.standard) || normalizeStandard(row.standard);
      if (!id || !model.byId.has(id)) continue;
      if (!byStandard.has(id)) byStandard.set(id, []);
      byStandard.get(id).push(row);
    }
    for (const rows of byStandard.values()) {
      rows.sort(
        (a, b) =>
          (b.misses || 0) + (b.misconceptions || 0) - ((a.misses || 0) + (a.misconceptions || 0)),
      );
    }
    return byStandard;
  } catch {
    return empty;
  }
}
