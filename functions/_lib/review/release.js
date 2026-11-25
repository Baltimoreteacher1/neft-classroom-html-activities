// Release trains, pure part: manifest, changelog diff, release ids, rollback target. No I/O.
// A release is a snapshot of every block's content hash. Its manifest is stored as canonical JSON, so a
// rollback that moves the pointer back returns the identical bytes.
import { canonicalJson, contentHash } from "../../../shared/content-schema/v2.mjs";
import { DecisionError } from "./decide.js";

/** { blockId: hash } for every row, as canonical JSON text. */
export const manifestText = (rows) =>
  canonicalJson(Object.fromEntries(rows.map((r) => [r.id, r.hash])));

export const manifestDigest = (text) => contentHash(JSON.parse(text));

/** What changed between two manifests (objects). Lists are sorted so the changelog is deterministic. */
export function diffManifests(previous, next) {
  const before = previous || {};
  const added = Object.keys(next)
    .filter((id) => !(id in before))
    .sort();
  const removed = Object.keys(before)
    .filter((id) => !(id in next))
    .sort();
  const changed = Object.keys(next)
    .filter((id) => id in before && before[id] !== next[id])
    .sort();
  return {
    added,
    removed,
    changed,
    counts: {
      added: added.length,
      removed: removed.length,
      changed: changed.length,
      total: Object.keys(next).length,
    },
  };
}

/** content-YYYY.M.N: N is one more than the highest N already used in that year and month. */
export function nextReleaseId(existingIds, now) {
  const d = new Date(now);
  const prefix = `content-${d.getUTCFullYear()}.${d.getUTCMonth() + 1}.`;
  let max = 0;
  for (const id of existingIds) {
    if (id.startsWith(prefix)) max = Math.max(max, Number(id.slice(prefix.length)) || 0);
  }
  return `${prefix}${max + 1}`;
}

/**
 * One-step rollback target. `current` is the pointer's release; `byId` looks releases up. The target is the
 * release the current one was cut from (its previous_id). Throws when there is nothing to go back to.
 */
export function rollbackTarget(current, byId) {
  if (!current) throw new DecisionError("no-current-release", "no release is current", 409);
  if (!current.previous_id)
    throw new DecisionError("no-previous-release", `${current.id} has no previous release`, 409);
  const to = byId(current.previous_id);
  if (!to)
    throw new DecisionError(
      "no-previous-release",
      `previous release ${current.previous_id} is missing`,
      409,
    );
  return { from: current.id, to: to.id };
}
