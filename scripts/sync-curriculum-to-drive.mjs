#!/usr/bin/env node
/**
 * Sync colleague-facing curriculum resources into Google Drive.
 *
 * Source of truth (NO hardcoded unit/lesson lists here):
 *   data/curriculum-download-manifest.json  — units -> lessons -> resources (+ file paths)
 *   data/pacing-unit-ranges.json            — teacher-facing unit ORDER and district labels
 *   data/pacing-unit-lessons.json           — assembled units (Pre-Unit) whose membership is authored
 *
 * Layout produced:  Curriculum Resources / NN - <Unit> / Lesson X-Y — <Title> / <Category> / <file>
 *
 * Safe to re-run: copies only when missing or changed (size/hash). Never deletes.
 * Stale files already on Drive are reported (and listed in SYNC-STATE.json).
 * Inability to delete is not treated as "safe to ignore."
 *
 * Usage: node scripts/sync-curriculum-to-drive.mjs [--dry-run] [--verify] [--dest <path>]
 *   --verify  exit 2 when the destination contains files this run does not own
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const REPO = path.resolve(import.meta.dirname, "..");
const SITE = "https://eduwonderlab.com";
const DEFAULT_DEST = path.join(
  process.env.HOME,
  "Library/CloudStorage/GoogleDrive-neftjd@gmail.com/My Drive/2026-2027/Curriculum Resources",
);

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const VERIFY = argv.includes("--verify");
const destArg = argv.indexOf("--dest");
const DEST = destArg >= 0 ? argv[destArg + 1] : DEFAULT_DEST;

/** Paths this run intends to own, relative to DEST. Used to REPORT stale
 *  Drive copies. Never used to delete — inability to delete is not a reason
 *  to ignore a leftover file. */
const expected = new Set();
const record = (abs) => {
  const rel = path.relative(DEST, abs);
  if (rel && !rel.startsWith("..") && !path.isAbsolute(rel)) expected.add(rel);
};

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(REPO, rel), "utf8"));
const manifest = readJson("data/curriculum-download-manifest.json");
const pacingRanges = readJson("data/pacing-unit-ranges.json");
const pacingLessons = readJson("data/pacing-unit-lessons.json");

const stats = {
  units: 0,
  lessons: 0,
  filesCopied: 0,
  filesUnchanged: 0,
  linksWritten: 0,
  skippedScorm: 0,
  unmatched: [],
  notes: [],
};

const sanitize = (s) =>
  String(s)
    .replace(/[\/\\:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "")
    .trim();

function ensureDir(p) {
  record(p);
  if (DRY) return;
  fs.mkdirSync(p, { recursive: true });
}

const hash = (p) => crypto.createHash("sha1").update(fs.readFileSync(p)).digest("hex");
const sameContent = (a, b) => hash(a) === hash(b);

function copyIfChanged(src, dest) {
  const abs = path.join(REPO, src);
  if (!fs.existsSync(abs)) {
    stats.unmatched.push(`missing source file: ${src}`);
    return;
  }
  const s = fs.statSync(abs);
  record(dest);
  if (fs.existsSync(dest)) {
    const d = fs.statSync(dest);
    // Drive rewrites mtimes on upload, so mtime alone would re-copy every run. Same size
    // plus same hash is the only reliable "unchanged" signal here.
    if (d.size === s.size && sameContent(abs, dest)) {
      stats.filesUnchanged++;
      return;
    }
  }
  ensureDir(path.dirname(dest));
  if (!DRY) fs.copyFileSync(abs, dest);
  stats.filesCopied++;
}

function writeIfChanged(dest, content) {
  record(dest);
  if (fs.existsSync(dest) && fs.readFileSync(dest, "utf8") === content) {
    stats.filesUnchanged++;
    return;
  }
  ensureDir(path.dirname(dest));
  if (!DRY) fs.writeFileSync(dest, content);
  stats.filesCopied++;
}

const titleCase = (t) => t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function resourceLabel(r) {
  return sanitize(r.label || titleCase(r.type));
}

/** Write link resources as .url shortcuts plus a previewable Links.txt index. */
function writeLinks(dir, links, heading) {
  if (!links.length) return;
  const lines = [
    heading,
    "=".repeat(heading.length),
    "",
    "These resources are interactive and live on EduWonderLab.",
    "",
  ];
  // Several entries in one folder can share a type label (both small groups have a
  // "Small Group Lesson"). Disambiguate with the entry id so no shortcut overwrites another.
  const counts = new Map();
  for (const r of links) counts.set(resourceLabel(r), (counts.get(resourceLabel(r)) || 0) + 1);
  const used = new Set();
  for (const r of links) {
    const url = SITE + r.url;
    let label = resourceLabel(r);
    if (counts.get(label) > 1) {
      const suffix = String(r.lesson || r.unit || "").replace(/^\d+-\d+-?/, "") || "alt";
      let candidate = sanitize(`${label} — ${suffix}`);
      let n = 2;
      while (used.has(candidate)) candidate = sanitize(`${label} — ${suffix} ${n++}`);
      label = candidate;
    }
    used.add(label);
    lines.push(`${label}: ${url}`);
    writeIfChanged(path.join(dir, "Links", `${label}.url`), `[InternetShortcut]\r\nURL=${url}\r\n`);
    stats.linksWritten++;
  }
  writeIfChanged(path.join(dir, "Links.txt"), lines.join("\n") + "\n");
}

/** zipPath is "<Lesson-X-Y>/<Category>/<file>" for lessons, "<Category>/<file>" for unit resources. */
function subPath(zipPath, stripFirst) {
  const parts = zipPath.split("/");
  return (stripFirst ? parts.slice(1) : parts).join("/");
}

function placeResources(dir, resources, { stripFirst }) {
  const links = [];
  for (const r of resources) {
    if (r.delivery === "scorm") {
      stats.skippedScorm++;
      continue;
    }
    if (r.delivery === "link") {
      links.push(r);
      continue;
    }
    if (r.delivery === "file") {
      if (!r.zipPath) {
        stats.unmatched.push(`file resource without zipPath: ${r.type} ${r.file}`);
        continue;
      }
      copyIfChanged(r.file, path.join(dir, subPath(r.zipPath, stripFirst)));
      continue;
    }
    stats.unmatched.push(`unknown delivery "${r.delivery}": ${r.type} ${r.url}`);
  }
  return links;
}

// ---- Index the manifest by lesson id and by curriculum unit -------------------
const unitsByNumber = new Map(manifest.units.map((u) => [u.unit, u]));
// A lesson folder gathers its lesson, small-group and catch-up entries. Those entries can
// be filed under different units in the manifest (a catch-up for 3-8 lives in Unit 4), so
// the folder is placed once, in the unit that owns the `lesson` entry itself.
const lessonEntries = new Map(); // lesson folder id -> { unit, entries[] }
for (const u of manifest.units) {
  for (const l of u.lessons) {
    const key = l.folder;
    if (!lessonEntries.has(key)) lessonEntries.set(key, { unit: u.unit, entries: [] });
    const bucket = lessonEntries.get(key);
    if (l.kind === "lesson") bucket.unit = u.unit;
    bucket.entries.push(l);
  }
}
const foldersByUnit = new Map();
for (const [folder, bucket] of lessonEntries) {
  if (!foldersByUnit.has(bucket.unit)) foldersByUnit.set(bucket.unit, []);
  foldersByUnit.get(bucket.unit).push(folder);
}
const lessonFolderFor = (id) => `Lesson-${id}`;

function lessonTitle(bucket) {
  const primary = bucket.entries.find((e) => e.kind === "lesson") || bucket.entries[0];
  return primary.title || primary.label;
}

function writeLessonFolder(unitDir, folderKey) {
  const bucket = lessonEntries.get(folderKey);
  if (!bucket) {
    stats.unmatched.push(`no manifest entry for ${folderKey}`);
    return;
  }
  const id = folderKey.replace(/^Lesson-/, "");
  const dir = path.join(unitDir, sanitize(`Lesson ${id} — ${lessonTitle(bucket)}`));
  ensureDir(dir);
  stats.lessons++;
  const all = bucket.entries.flatMap((e) => e.resources);
  const links = placeResources(dir, all, { stripFirst: true });
  writeLinks(dir, links, `Lesson ${id} — Interactive Resources on EduWonderLab`);
}

// ---- Build the teacher-facing unit sequence ----------------------------------
const sequence = [];
for (const u of pacingRanges.units) {
  const authored = pacingLessons.units[u.key];
  sequence.push({
    key: u.key,
    label: u.districtLabel,
    curriculumUnit: u.curriculumUnit,
  });
  // An assembled unit (e.g. the Pre-Unit) borrows lessons from several units and does
  // NOT own the curriculum unit it maps to — that unit still needs a home of its own,
  // placed right here in the pacing order.
  if (authored && typeof u.curriculumUnit === "number" && unitsByNumber.has(u.curriculumUnit)) {
    const cu = unitsByNumber.get(u.curriculumUnit);
    sequence.push({
      key: `U${cu.unit}`,
      label: `Unit ${cu.unit}: ${cu.name}`,
      curriculumUnit: cu.unit,
    });
  }
}

const usedCurriculumUnits = new Set(
  sequence
    .filter((s) => !pacingLessons.units[s.key])
    .map((s) => s.curriculumUnit)
    .filter((n) => typeof n === "number"),
);
// Any curriculum unit the district sequence never names still gets a home.
for (const u of manifest.units) {
  if (!usedCurriculumUnits.has(u.unit)) {
    sequence.push({
      key: `U${u.unit}`,
      label: `Unit ${u.unit}: ${u.name}`,
      curriculumUnit: u.unit,
      sequence: sequence.length + 1,
      extra: true,
    });
  }
}

const pad = (n) => String(n).padStart(2, "0");

for (const [i, s] of sequence.entries()) {
  // ":" is illegal in Drive/Windows paths — read it as the em-dash separator it stands for.
  const unitDir = path.join(DEST, sanitize(`${pad(i + 1)} - ${s.label.replace(/:\s*/g, " — ")}`));
  ensureDir(unitDir);
  stats.units++;

  // Authored membership (e.g. the assembled Pre-Unit) wins; otherwise inherit the
  // curriculum unit's own lesson list, in manifest order.
  const authored = pacingLessons.units[s.key];
  let folders = [];
  let unitResources = [];

  if (authored) {
    folders = authored.lessons.map(lessonFolderFor);
    writeIfChanged(
      path.join(unitDir, "About this unit.txt"),
      `${s.label}\n\n${authored.reason}\n\nLessons: ${authored.lessons.join(", ")}\n` +
        `Each of these lessons also appears in its own curriculum unit folder.\n`,
    );
  } else if (typeof s.curriculumUnit === "number" && unitsByNumber.has(s.curriculumUnit)) {
    const cu = unitsByNumber.get(s.curriculumUnit);
    folders = foldersByUnit.get(cu.unit) || [];
    unitResources = cu.resources || [];
  } else {
    stats.notes.push(`"${s.label}" has no curriculum unit in the manifest — folder created empty.`);
    writeIfChanged(
      path.join(unitDir, "About this unit.txt"),
      `${s.label}\n\nThis is a district pacing block with no EduWonderLab unit of its own.\n` +
        `See ${SITE}/curriculum/ for review and test-prep materials.\n`,
    );
    continue;
  }

  for (const f of folders) writeLessonFolder(unitDir, f);

  if (unitResources.length) {
    const dir = path.join(unitDir, "_Unit Resources");
    ensureDir(dir);
    const links = placeResources(dir, unitResources, { stripFirst: false });
    writeLinks(dir, links, `${s.label} — Unit-Level Interactive Resources`);
  }
}

writeIfChanged(
  path.join(DEST, "READ ME FIRST.txt"),
  [
    "EduWonderLab — Curriculum Resources",
    "===================================",
    "",
    "Folders follow the district pacing order: Pre-Unit, then the units in the order we teach them.",
    "Inside each unit, one folder per lesson; inside each lesson, materials grouped by type",
    "(Slides, Guided Notes, Homework, Handouts, Small Groups, Family pages, Teacher Notes).",
    "",
    "HTML files: download and open in a browser (Chrome). They work offline.",
    "Links.txt / Links folders point to the interactive versions on eduwonderlab.com,",
    "which cannot be exported as files.",
    "",
    `Full interactive curriculum: ${SITE}/curriculum/`,
    "",
    "Generated from the EduWonderLab curriculum manifest. Re-running the sync refreshes",
    "changed files only and never deletes anything.",
  ].join("\n") + "\n",
);

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    stats.notes.push(`cannot read ${dir}: ${err.message}`);
    return acc;
  }
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.name === "SYNC-STATE.json") continue;
    if (ent.isDirectory()) walkFiles(p, acc);
    else if (ent.isFile() || ent.isSymbolicLink()) acc.push(path.relative(DEST, p));
  }
  return acc;
}

const destExists = fs.existsSync(DEST);
let staleOnDrive = [];
if (destExists) {
  const present = walkFiles(DEST);
  staleOnDrive = present.filter((rel) => !expected.has(rel));
  stats.notes.push(
    staleOnDrive.length
      ? `${staleOnDrive.length} path(s) on Drive are not in this run's expected set. They were NOT deleted.`
      : "Drive destination contains no unexpected files.",
  );
} else {
  stats.notes.push(`destination does not exist (${DEST}) — extras cannot be verified.`);
}

const state = {
  generatedAt: new Date().toISOString(),
  dryRun: DRY,
  dest: DEST,
  destExists,
  expectedCount: expected.size,
  staleCount: staleOnDrive.length,
  staleOnDrive: staleOnDrive.slice(0, 50),
  policy: "never-delete; stale paths are reported, not ignored",
};
const statePath = path.join(DEST, "SYNC-STATE.json");
if (destExists || !DRY) {
  ensureDir(DEST);
  writeIfChanged(statePath, JSON.stringify(state, null, 2) + "\n");
}

console.log(
  JSON.stringify(
    {
      dest: DEST,
      dryRun: DRY,
      verify: VERIFY || destExists,
      ...stats,
      unmatched: stats.unmatched.slice(0, 20),
      unmatchedTotal: stats.unmatched.length,
      expectedCount: expected.size,
      staleOnDrive: staleOnDrive.slice(0, 20),
      staleTotal: staleOnDrive.length,
    },
    null,
    2,
  ),
);
if (VERIFY && !destExists) process.exit(2);
if (VERIFY && staleOnDrive.length) process.exit(2);
