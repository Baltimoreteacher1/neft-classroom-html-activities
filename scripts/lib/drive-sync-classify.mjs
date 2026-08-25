/**
 * Drive sync classifications. The sync never deletes. These labels are for
 * verification reports so a leftover renamed lesson is visible instead of
 * silently sharing a folder with the live copy.
 */
export const DRIVE_CLASS = Object.freeze({
  SYNCED: "SYNCED",
  SOURCE_NEWER: "SOURCE NEWER",
  DESTINATION_MISSING: "DESTINATION MISSING",
  DESTINATION_EXTRA: "DESTINATION EXTRA",
  DRIVE_UNAVAILABLE: "DRIVE UNAVAILABLE",
  PERMISSION_BLOCKED: "PERMISSION BLOCKED",
  DUPLICATE: "DUPLICATE",
  WRONG_UNIT: "WRONG UNIT",
  AMBIGUOUS: "AMBIGUOUS",
});

/**
 * Classify one destination relative to this run's expected set.
 *
 * destExists false → DRIVE UNAVAILABLE (Google Drive desktop not mounted).
 * permissionError → PERMISSION BLOCKED.
 * present - expected → DESTINATION EXTRA (leftover; never deleted).
 * expected - present → DESTINATION MISSING.
 * hash mismatch on a present expected file → SOURCE NEWER.
 * otherwise SYNCED.
 *
 * Drive mtimes lie (the desktop client rewrites them), so "destination newer"
 * cannot be decided from mtime and is never emitted.
 */
export function classifyDriveState({
  destExists = false,
  permissionError = false,
  expected = [],
  present = [],
  sourceNewer = [],
} = {}) {
  if (permissionError) {
    return [{ class: DRIVE_CLASS.PERMISSION_BLOCKED, path: null }];
  }
  if (!destExists) {
    return [{ class: DRIVE_CLASS.DRIVE_UNAVAILABLE, path: null }];
  }
  const exp = new Set(expected);
  const have = new Set(present);
  const rows = [];
  for (const rel of present) {
    if (!exp.has(rel)) rows.push({ class: DRIVE_CLASS.DESTINATION_EXTRA, path: rel });
  }
  for (const rel of expected) {
    if (!have.has(rel)) rows.push({ class: DRIVE_CLASS.DESTINATION_MISSING, path: rel });
  }
  const extra = new Set(sourceNewer);
  for (const rel of sourceNewer) {
    if (exp.has(rel) && have.has(rel)) rows.push({ class: DRIVE_CLASS.SOURCE_NEWER, path: rel });
  }
  for (const rel of expected) {
    if (have.has(rel) && !extra.has(rel)) rows.push({ class: DRIVE_CLASS.SYNCED, path: rel });
  }
  return rows;
}

export function summarizeDriveClasses(rows) {
  const counts = Object.fromEntries(Object.values(DRIVE_CLASS).map((c) => [c, 0]));
  for (const r of rows) counts[r.class] = (counts[r.class] || 0) + 1;
  return counts;
}
