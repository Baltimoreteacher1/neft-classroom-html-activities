// Read path: queue, block detail, unit summaries, log export, chain verification, releases.
import { verifyEventChain } from "../../../shared/content-schema/review-chain.js";
import { VERIFIER_COUNTS } from "../../../shared/content-schema/review-verifier-counts.js";
import { indexRows, isUnitId, loadBlock, subjectKey, unitRows } from "./blocks.js";
import { logCsv } from "./csv.js";
import { applyOverlay, DecisionError, effectiveStates, rollupBadge } from "./decide.js";
import { buildQueue, parseFilters, summarizeUnit } from "./queue.js";
import { diffManifests } from "./release.js";
import { currentRelease, releaseById } from "./release-store.js";
import {
  groupByBlock,
  lastActivity,
  lastReviewed,
  listEvents,
  recentEvents,
  stateRows,
} from "./store.js";

export async function queue({ db, params, now, verifierCounts = VERIFIER_COUNTS }) {
  const { bad, filters } = parseFilters(params);
  if (bad.length) throw new DecisionError("bad-filter", `invalid filter: ${bad.join(", ")}`, 400);
  if (filters.unit && !isUnitId(filters.unit))
    throw new DecisionError("bad-filter", "invalid filter: unit", 400);
  const rows = await indexRows(filters);
  const stateByBlock = groupByBlock(
    await stateRows(db, filters.unit ? { unitId: filters.unit } : {}),
  );
  const activity = await lastActivity(db);
  return {
    ok: true,
    ...buildQueue({ rows, stateByBlock, activity, now, filters, verifierCounts }),
    limit: filters.limit,
    offset: filters.offset,
  };
}

export async function blockDetail({ db, blockId }) {
  const found = await loadBlock(blockId);
  if (!found) throw new DecisionError("block-not-found", `no block ${blockId}`, 404);
  const block = applyOverlay(found.block, await stateRows(db, { blockId }));
  const subject = subjectKey(found.unit);
  const states = effectiveStates(block, subject);
  return {
    ok: true,
    block: {
      id: block.id,
      kind: block.kind,
      unitId: found.unit.id,
      grade: String(found.unit.grade),
      subject,
      content: block.content,
      provenance: block.provenance,
      review: block.review,
    },
    states,
    badge: rollupBadge(states),
    lastReviewed: await lastReviewed(db, blockId),
    history: await recentEvents(db, blockId),
  };
}

/** Aggregate badges only. With ?unit= the unit and its blocks; without, every unit's badge. */
export async function summary({ db, params }) {
  const unit = (params.get("unit") || "").trim();
  if (unit) {
    if (!isUnitId(unit)) throw new DecisionError("bad-filter", "invalid unit", 400);
    const rows = await unitRows(unit);
    const stateByBlock = groupByBlock(await stateRows(db, { unitId: unit }));
    return { ok: true, unit, ...summarizeUnit(rows, stateByBlock) };
  }
  const stateByBlock = groupByBlock(await stateRows(db));
  const units = {};
  for (const row of await indexRows()) (units[row.unitId] ||= []).push(row);
  return {
    ok: true,
    units: Object.fromEntries(
      Object.entries(units).map(([id, rows]) => [id, summarizeUnit(rows, stateByBlock).state]),
    ),
  };
}

export async function logExport({ db, params }) {
  const afterSeq = Math.max(0, Number(params.get("afterSeq")) || 0);
  const limit = Math.min(20000, Math.max(1, Number(params.get("limit")) || 5000));
  const rows = await listEvents(db, { afterSeq, limit: limit + 1 });
  const page = rows.slice(0, limit);
  return { csv: logCsv(page), next: rows.length > limit ? page.at(-1).seq : null };
}

export async function verifyLog({ db }) {
  const rows = await listEvents(db, { limit: 20000 });
  const errors = await verifyEventChain(rows);
  return { ok: errors.length === 0, events: rows.length, errors, truncated: rows.length === 20000 };
}

export async function currentWithDrift({ db, drift }) {
  const cur = await currentRelease(db);
  if (!cur) return { ok: true, current: null };
  const { manifest_json: manifest, ...meta } = cur;
  const out = {
    ok: true,
    current: {
      ...meta,
      changelog: JSON.parse(meta.changelog_json),
      verifiers_ran: JSON.parse(meta.verifiers_ran_json),
    },
  };
  if (drift) {
    const live = Object.fromEntries((await indexRows()).map((r) => [r.id, r.hash]));
    out.drift = diffManifests(JSON.parse(manifest), live).counts;
  }
  return out;
}

export async function releaseDetail({ db, id }) {
  const row = await releaseById(db, id);
  if (!row) throw new DecisionError("release-not-found", `no release ${id}`, 404);
  const { manifest_json: manifest, ...meta } = row;
  return {
    ok: true,
    release: {
      ...meta,
      manifest: JSON.parse(manifest),
      changelog: JSON.parse(meta.changelog_json),
      verifiers_ran: JSON.parse(meta.verifiers_ran_json),
    },
  };
}
