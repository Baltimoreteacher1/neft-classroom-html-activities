/**
 * prune-stale.mjs — remove superseded SCORM package generations from
 * scorm-packages/.
 *
 * Why this exists: scorm-packages/ is gitignored, purely additive build
 * output, and the package NAMING has changed across generations while the
 * manifest identifiers have not. Twice now (2026-09-01: 744 zips / 519 ids;
 * 2026-09-06: 992 files / 479 duplicate ids) the folder accumulated old
 * generations that reused the identifiers of current packages — an LMS keys
 * on that identifier, so a teacher importing the wrong file sees it as a
 * repeat of an activity they already have, and the upload picker cannot show
 * which file is live. validate:scorm:shipped catches the state after the
 * fact; this module is what stops it from arising: every batch builder prunes
 * what it has just superseded.
 *
 * Two operations, deliberately different in reach:
 *
 * - pruneSupersededByIdentifier(dir, writtenFiles): safe for ANY builder run,
 *   including a scoped one (`--unit 3`). Deletes only a zip that (a) was not
 *   written by this run and (b) carries a manifest identifier this run just
 *   re-emitted — the definition of a superseded generation. A zip it cannot
 *   read or that has no identifier is never touched: prune deletes only what
 *   it can positively identify as replaced.
 *
 * - pruneOutsideExpectedSet(dir, expectedZipNames): the full sweep, for a
 *   builder that has just enumerated EVERY package family the folder should
 *   hold (build-canvas-scorm-page.mjs). Deletes any .zip whose NAME is not in
 *   the intended catalog — which also clears packages whose lesson/activity
 *   was removed from the catalog entirely. Never touches non-zip files (the
 *   checklists), and refuses an empty expected set: a full sweep expecting
 *   nothing is a caller bug, not an empty catalog.
 *
 * Per-package build-scorm.mjs does NOT prune: a single-package build has no
 * business scanning 500 archives, and the batch builders that follow it do.
 */
import { readdirSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";
import { readZip } from "../zip-read.mjs";

const ID_RE = /<manifest\s+identifier="([^"]+)"/;

/** Manifest identifier of a package zip, or null if it cannot be determined. */
export function manifestIdOf(zipPath) {
  try {
    const entries = readZip(readFileSync(zipPath));
    const manifest = entries.find((e) => e.name === "imsmanifest.xml");
    return manifest ? (ID_RE.exec(manifest.text())?.[1] ?? null) : null;
  } catch {
    return null;
  }
}

/**
 * Delete zips in `dir` that a run writing `writtenFiles` (zip basenames) has
 * superseded: not written this run, but carrying an identifier this run just
 * re-emitted. Returns [{ file, id, supersededBy }].
 */
export function pruneSupersededByIdentifier(dir, writtenFiles) {
  const written = new Set(writtenFiles);
  const ownedIds = new Map();
  for (const f of written) {
    const id = manifestIdOf(join(dir, f));
    if (id) ownedIds.set(id, f);
  }
  const removed = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".zip") || written.has(f)) continue;
    const id = manifestIdOf(join(dir, f));
    if (id === null || !ownedIds.has(id)) continue;
    unlinkSync(join(dir, f));
    removed.push({ file: f, id, supersededBy: ownedIds.get(id) });
  }
  return removed;
}

/**
 * Delete every .zip in `dir` whose basename is not in `expectedZipNames` —
 * the intended full catalog, including packages whose build failed this run
 * (a stale-but-current-named wrapper beats a missing one). Non-zip files
 * survive. Returns the removed basenames.
 */
export function pruneOutsideExpectedSet(dir, expectedZipNames) {
  if (!expectedZipNames.length)
    throw new Error("pruneOutsideExpectedSet: empty expected set — refusing to sweep the folder");
  const expected = new Set(expectedZipNames);
  const removed = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".zip") || expected.has(f)) continue;
    unlinkSync(join(dir, f));
    removed.push(f);
  }
  return removed;
}

/** Shared console line so every builder reports pruning the same way. */
export function reportPrune(removed) {
  if (!removed.length) {
    console.log("  pruned: 0 stale packages");
    return;
  }
  console.log(`  pruned: ${removed.length} stale package(s)`);
  for (const r of removed) {
    if (typeof r === "string") console.log(`    − ${r}`);
    else console.log(`    − ${r.file} (identifier ${r.id} now carried by ${r.supersededBy})`);
  }
}
