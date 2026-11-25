// F5 Per-Field Content Provenance.
// Pure ESM module that tracks field-level provenance (`draft` vs human-approved `reviewed`).
// Automated pipelines may only emit `status: "draft"`; setting `status: "reviewed"` without a
// named human `reviewerId` AND `reviewedAt` timestamp is explicitly refused.

export const PROVENANCE_STATUSES = Object.freeze(["draft", "reviewed"]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Attach per-field provenance metadata to a content record (returns a new shallow-cloned object).
 * @param {Record<string, unknown>} record
 * @param {{ source: string, fields?: string[], status?: "draft" | "reviewed", reviewerId?: string, reviewedAt?: string }} options
 */
export function attachFieldProvenance(
  record,
  { source, fields, status = "draft", reviewerId, reviewedAt } = {},
) {
  if (!isPlainObject(record)) {
    throw new Error("attachFieldProvenance requires a plain object record.");
  }
  const cleanSource = typeof source === "string" ? source.trim() : "";
  if (!cleanSource) {
    throw new Error("attachFieldProvenance requires a non-empty source.");
  }
  if (!PROVENANCE_STATUSES.includes(status)) {
    throw new Error(`Invalid provenance status "${status}": must be "draft" or "reviewed".`);
  }

  if (status === "reviewed") {
    const cleanReviewer = typeof reviewerId === "string" ? reviewerId.trim() : "";
    const cleanTimestamp = typeof reviewedAt === "string" ? reviewedAt.trim() : "";
    if (!cleanReviewer || !cleanTimestamp) {
      throw new Error(
        'Refused: cannot set provenance status "reviewed" without both human reviewerId and reviewedAt timestamp.',
      );
    }
  }

  const targetFields =
    Array.isArray(fields) && fields.length > 0
      ? fields
      : Object.keys(record).filter((k) => !k.startsWith("_"));

  const existing = isPlainObject(record._provenance) ? { ...record._provenance } : {};

  for (const field of targetFields) {
    if (typeof field !== "string" || !field.trim() || field.startsWith("_")) continue;
    existing[field] =
      status === "reviewed"
        ? {
            status: "reviewed",
            source: cleanSource,
            derived: false,
            reviewerId: reviewerId.trim(),
            reviewedAt: reviewedAt.trim(),
          }
        : {
            status: "draft",
            source: cleanSource,
            derived: true,
          };
  }

  return {
    ...record,
    _provenance: existing,
  };
}

/**
 * Summarize per-field provenance coverage on a record.
 * @param {Record<string, unknown>} record
 * @returns {{ totalFields: number, draftFields: number, reviewedFields: number, unattributedFields: number }}
 */
export function summarizeFieldProvenance(record) {
  if (!isPlainObject(record)) {
    return { totalFields: 0, draftFields: 0, reviewedFields: 0, unattributedFields: 0 };
  }
  const dataFields = Object.keys(record).filter((k) => !k.startsWith("_"));
  const prov = isPlainObject(record._provenance) ? record._provenance : {};

  let draftFields = 0;
  let reviewedFields = 0;
  let unattributedFields = 0;

  for (const field of dataFields) {
    const entry = prov[field];
    if (!isPlainObject(entry) || !entry.status) {
      unattributedFields += 1;
    } else if (entry.status === "reviewed") {
      reviewedFields += 1;
    } else if (entry.status === "draft") {
      draftFields += 1;
    } else {
      unattributedFields += 1;
    }
  }

  return {
    totalFields: dataFields.length,
    draftFields,
    reviewedFields,
    unattributedFields,
  };
}
