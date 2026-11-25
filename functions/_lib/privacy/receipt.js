// Deletion receipts: canonical JSON, digest and chain verification. Pure and dependency-free so the
// Pages Function, the verify CLI and the tests compute the identical digest.
//
// digest = sha256( canonicalJson({ scope, counts, deletedAt, priorReceiptDigest }) )
// A receipt holds counts per table, never content. `id` and `actor` are labels outside the digest.

const HEX = (bytes) =>
  [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** JSON with object keys sorted at every depth, so the same value always serialises the same way. */
export function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const keys = Object.keys(value)
    .filter((k) => value[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`).join(",")}}`;
}

export async function receiptDigest({ scope, counts, deletedAt, priorReceiptDigest }) {
  const text = canonicalJson({ scope, counts, deletedAt, priorReceiptDigest });
  return HEX(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
}

/** The scope object as it enters the digest: { type, code } or { type, code, studentId }. */
export const scopeOf = (row) =>
  row.scope_type === "student"
    ? { type: "student", code: row.class_code, studentId: row.student_id }
    : { type: "class", code: row.class_code };

export function receiptFromRow(row) {
  return {
    id: row.id,
    scope: scopeOf(row),
    counts: JSON.parse(row.counts_json),
    deletedAt: Number(row.deleted_at),
    priorReceiptDigest: row.prior_digest,
    digest: row.digest,
    actor: row.actor,
  };
}

/** Recompute one receipt's digest. Returns an error string or null. */
export async function checkReceipt(receipt) {
  for (const key of ["scope", "counts", "deletedAt", "priorReceiptDigest", "digest"]) {
    if (receipt?.[key] === undefined || receipt?.[key] === null) return `receipt has no ${key}`;
  }
  const want = await receiptDigest(receipt);
  return want === receipt.digest ? null : `digest mismatch (recomputed ${want})`;
}

/**
 * Verify an ordered chain: every digest recomputes and each receipt's prior digest is the previous
 * receipt's digest. `startPrior` is the digest the first receipt must follow ("" for the whole chain).
 */
export async function verifyChain(receipts, startPrior = "") {
  const errors = [];
  let prior = startPrior;
  for (const [i, receipt] of receipts.entries()) {
    const bad = await checkReceipt(receipt);
    if (bad) errors.push(`receipt ${i} (${receipt?.id ?? "?"}): ${bad}`);
    else if (receipt.priorReceiptDigest !== prior)
      errors.push(
        `receipt ${i} (${receipt.id}): chain broken, expected prior ${prior || "(empty)"}`,
      );
    prior = receipt?.digest ?? prior;
  }
  return errors;
}
