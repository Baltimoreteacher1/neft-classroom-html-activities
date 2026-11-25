// Reviewer queue and unit summaries: pure functions over index rows (blocks.js) and stored review state.
import { DIMENSIONS, REVIEW_STATES } from "../../../shared/content-schema/review-rules.js";
import { applyOverlay, effectiveStates, rollupBadge } from "./decide.js";

const DAY_MS = 86_400_000;

/** Lightweight block (no content) with the same shape the schema functions read. */
export function shellOf(row, stateRows = []) {
  const empty = () => ({ state: "draft", reviewers: [], reviewedHash: null });
  const review = { translation: {} };
  for (const d of DIMENSIONS) review[d] = empty();
  for (const lang of row.languages) review.translation[lang] = empty();
  return applyOverlay({ id: row.id, review, provenance: { contentHash: row.hash } }, stateRows);
}

export function parseFilters(params) {
  const get = (k) => (params.get(k) || "").trim();
  const age = get("olderThanDays");
  const bad = [];
  const dimension = get("dimension");
  const state = get("state");
  if (dimension && ![...DIMENSIONS, "translation"].includes(dimension)) bad.push("dimension");
  if (state && !REVIEW_STATES.includes(state)) bad.push("state");
  if (age && !/^\d{1,4}$/.test(age)) bad.push("olderThanDays");
  const limit = Math.min(200, Math.max(1, Number(get("limit")) || 50));
  const offset = Math.max(0, Number(get("offset")) || 0);
  return {
    bad,
    filters: {
      grade: get("grade"),
      subject: get("subject").toLowerCase(),
      unit: get("unit"),
      dimension,
      state,
      olderThanDays: age === "" ? null : Number(age),
      verifier: get("verifier"),
      limit,
      offset,
    },
  };
}

/**
 * Queue rows. `state` and `dimension` filter per dimension: with both, the block must be in that state for
 * that dimension; with only `state`, any required dimension in that state matches; with only `dimension`,
 * blocks that dimension applies to. age_days is whole days since the block's last review activity (null =
 * never touched, which counts as older than any threshold). verifier failure counts come from
 * `verifierCounts` ({ name: { blockId: n } }).
 */
export function buildQueue({ rows, stateByBlock, activity, now, filters, verifierCounts = {} }) {
  const f = filters;
  const out = [];
  for (const row of rows) {
    const shell = shellOf(row, stateByBlock.get(row.id));
    const subject = row.subject;
    const states = effectiveStates(shell, subject);
    const flat = Object.entries(states).flatMap(([d, v]) =>
      d === "translation" ? Object.values(v).map((s) => [d, s]) : [[d, v]],
    );
    if (f.dimension && !flat.some(([d]) => d === f.dimension)) continue;
    const scoped = f.dimension ? flat.filter(([d]) => d === f.dimension) : flat;
    if (f.state && !scoped.some(([, s]) => s === f.state)) continue;
    const at = activity.get(row.id);
    const age = at === undefined ? null : Math.floor((now - at) / DAY_MS);
    if (f.olderThanDays !== null && age !== null && age < f.olderThanDays) continue;
    const failures = {};
    let failureTotal = 0;
    for (const [name, byBlock] of Object.entries(verifierCounts)) {
      const n = byBlock[row.id] || 0;
      if (n) {
        failures[name] = n;
        failureTotal += n;
      }
    }
    if (f.verifier && !failures[f.verifier]) continue;
    out.push({
      id: row.id,
      kind: row.kind,
      unitId: row.unitId,
      grade: row.grade,
      subject,
      title: row.title,
      badge: rollupBadge(states),
      states,
      age_days: age,
      verifierFailures: failures,
      verifierFailureTotal: failureTotal,
    });
  }
  // Oldest activity first, never-touched blocks last, then a stable id order.
  out.sort((a, b) => (b.age_days ?? -1) - (a.age_days ?? -1) || a.id.localeCompare(b.id));
  return { total: out.length, items: out.slice(f.offset, f.offset + f.limit) };
}

/** Badge counts and the unit's overall badge. A unit is Reviewed only when every one of its blocks is. */
export function summarizeUnit(rows, stateByBlock) {
  const counts = { draft: 0, in_review: 0, reviewed: 0, retired: 0 };
  const blocks = [];
  for (const row of rows) {
    const badge = rollupBadge(effectiveStates(shellOf(row, stateByBlock.get(row.id)), row.subject));
    counts[badge] += 1;
    blocks.push({ id: row.id, kind: row.kind, badge });
  }
  const total = rows.length;
  let state = "in_review";
  if (!total || counts.draft === total) state = "draft";
  else if (counts.reviewed === total) state = "reviewed";
  else if (counts.retired === total) state = "retired";
  return { state, counts, blocks };
}
