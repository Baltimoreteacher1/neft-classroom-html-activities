// Hash chain over the review log. Pure and browser safe so the Pages Function, the tests and any later
// verify tool compute the identical digest.
//
//   digest = sha256( canonicalJson({ blockId, kind, dimension, lang, fromState, toState, reviewer,
//                                    contentHash, comment, createdAt, bulkId, priorDigest }) )
//
// content_hash stands for the snapshot: verifyEventChain also re-hashes a snapshot when one is supplied,
// so editing the stored content breaks the log as surely as editing a state.
import { canonicalJson, contentHash } from "./v2.mjs";

export const GENESIS_DIGEST = "";

const hex = (bytes) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** The fields a digest covers, from a database row or an in-memory event. */
export function digestInput(e) {
  return {
    blockId: e.blockId ?? e.block_id,
    kind: e.kind,
    dimension: e.dimension,
    lang: e.lang ?? "",
    fromState: e.fromState ?? e.from_state,
    toState: e.toState ?? e.to_state,
    reviewer: {
      name: e.reviewer?.name ?? e.reviewer_name,
      role: e.reviewer?.role ?? e.reviewer_role,
      date: e.reviewer?.date ?? e.reviewer_date,
      actor: e.reviewer?.actor ?? e.actor,
    },
    contentHash: e.contentHash ?? e.content_hash,
    comment: e.comment ?? "",
    createdAt: Number(e.createdAt ?? e.created_at),
    bulkId: e.bulkId ?? e.bulk_id ?? null,
    priorDigest: e.priorDigest ?? e.prior_digest,
  };
}

export async function eventDigest(e) {
  const text = canonicalJson(digestInput(e));
  return hex(await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

/**
 * Verify an ordered chain of event rows (ascending seq). Returns string[] of problems; empty = intact.
 * A row whose snapshot_json is present must hash to its content_hash.
 */
export async function verifyEventChain(rows, startPrior = GENESIS_DIGEST) {
  const errors = [];
  let prior = startPrior;
  for (const [i, row] of rows.entries()) {
    const at = `event ${i} (${row?.id ?? "?"})`;
    const want = await eventDigest(row);
    if (want !== row.digest) errors.push(`${at}: digest mismatch`);
    else if (row.prior_digest !== prior)
      errors.push(`${at}: chain broken, expected prior ${prior || "(empty)"}`);
    if (row.snapshot_json) {
      let snap;
      try {
        snap = JSON.parse(row.snapshot_json);
      } catch {
        errors.push(`${at}: snapshot is not JSON`);
      }
      if (snap !== undefined && (await contentHash(snap)) !== row.content_hash) {
        errors.push(`${at}: snapshot does not match content_hash`);
      }
    }
    prior = row.digest ?? prior;
  }
  return errors;
}
