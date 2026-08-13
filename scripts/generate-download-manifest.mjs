#!/usr/bin/env node
/**
 * Download Manifest Generator
 * --------------------------------------------------------------------------
 * Builds data/curriculum-download-manifest.json — the inventory the bulk
 * downloader (assets/curriculum-download.js) reads.
 *
 * It DERIVES, it does not declare. There is no hand-maintained list of
 * downloadable resources anywhere: a lesson or resource that appears on the
 * site appears in the downloader because one of these sources already knows
 * about it.
 *
 *   data/curriculum-manifest.json        lesson files, with on-disk existence
 *                                        (itself generated from lessons/<id>/config.json)
 *   data/curriculum-launch-manifest.json small groups, catch-ups, end-of-unit
 *   curriculum/units/index.html          the curated unit-level rows (projects,
 *                                        assessments, study guides, games,
 *                                        graphic novels) and the external
 *                                        Google links — these live nowhere else
 *   data/curriculum-unit-identities.json unit titles/icons
 *   lessons/<id>-group{1,2}/             small-group worksheets + homework on disk
 *
 * Regenerate after adding a lesson or resource:
 *   node scripts/generate-download-manifest.mjs
 *
 * Writes exactly one file and never touches a lesson folder.
 */

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import {
  GROUPS,
  isTeacherSurface,
  PRESETS,
  SCORMABLE_TYPES,
  safeName,
  TYPE_BY_ID,
  TYPES,
} from "./lib/download-taxonomy.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), "utf8"));

/** Bytes on disk for a site path, or null when the path is not a static file. */
function fileFor(sitePath) {
  const clean = String(sitePath || "").split(/[?#]/)[0];
  if (!clean.startsWith("/") || clean.endsWith("/")) return null;
  const rel = clean.replace(/^\/+/, "");
  const abs = join(root, rel);
  if (!existsSync(abs)) return null;
  const st = statSync(abs);
  if (!st.isFile() || st.size === 0) return null;
  return { file: rel, bytes: st.size };
}

const DOWNLOADABLE_EXT = new Set([
  ".pdf",
  ".docx",
  ".doc",
  ".pptx",
  ".html",
  ".htm",
  ".md",
  ".csv",
  ".png",
  ".jpg",
  ".svg",
  ".zip",
]);

// ---------------------------------------------------------------------------
// Resource-type classification for links that only exist in the units page.
// Ordered: first match wins. `text` is the visible label, `href` the target.
// ---------------------------------------------------------------------------
const LINK_RULES = [
  [/graphic-novels?\//i, null, "graphic-novel"],
  [/\/pre-test\//i, /pre-?test/i, "pre-test"],
  [/\/post-test\//i, /post-?test/i, "post-test"],
  [/\/study-guide/i, /study guide/i, "study-guide"],
  [/\/activities\/architect\//i, /architect/i, "architect-challenge"],
  [/\/projects\//i, /project/i, "project"],
  [/\/games?\//i, /game|arcade/i, "unit-game"],
  [/teacher-tools\/post-forms/i, /google form/i, "google-form"],
  [/docs\.google\.com|slides\.google\.com/i, /slides/i, "editable-slides"],
  // Must precede the plain slides rule — editable-slides.html also ends in
  // slides.html, and they are two different decks in the same lesson folder.
  [/editable-slides\.html$/i, /editable slides|reveal math/i, "editable-slides"],
  [/slides\.html$/i, /slides/i, "slides"],
  [/notes\.html$/i, /notes/i, "guided-notes"],
  [/-notes\.pdf$/i, /pdf/i, "notes-pdf"],
  [/-notes\.docx$/i, /docx/i, "notes-docx"],
  [/homework\.docx$/i, /homework/i, "homework-docx"],
  [/homework\.html$/i, /homework/i, "homework"],
  [/handout\.html$/i, /handout/i, "handout"],
  [/worksheet\.html$/i, /worksheet/i, "small-group-worksheet"],
  // These three are decided by href alone. Matching their labels as well used
  // to file the unit-level "Small-Group Studio" tile as a small-group LESSON.
  [/\/lessons\/\d+-\d+-catchup\/?$/i, null, "catchup-lesson"],
  [/\/lessons\/\d+-\d+-group[12]\/?$/i, null, "small-group-lesson"],
  [/\/lessons\/[^/]+\/?$/i, null, "interactive-lesson"],
];

// The href is checked against EVERY rule before any label is consulted. Doing
// both in one pass let an early rule's loose label pattern outrank a later
// rule's exact href: "Notes PDF" matched /notes/i and filed 3-1-notes.pdf as
// Guided Notes, and "Google Slides" matched /slides/i and filed slides.html as
// an external Google deck.
/**
 * Which unit a unit-level link belongs to.
 *
 * curriculum/units/index.html nests several End-of-Unit rows under the wrong
 * card — Unit 5's block contains Unit 10's row, Unit 2's contains Unit 8's, and
 * six more (verified against the source, 2026-08-13). Every one of those links
 * names its unit in the href, so the href decides and the containing card is
 * only the fallback. Without this, "Download Unit 5" hands a teacher Unit 10's
 * pre-test and Unit 10's package is empty.
 */
function unitOfLink(href, fallbackUnit) {
  const match = /(?:^|[/-])unit-?(\d{1,2})(?:[/-]|$)/i.exec(String(href || ""));
  const n = match ? Number(match[1]) : NaN;
  return Number.isFinite(n) && n >= 1 && n <= 10 ? n : fallbackUnit;
}

function classifyLink(href, text) {
  for (const [hrefRe, , type] of LINK_RULES) {
    if (hrefRe.test(href)) return type;
  }
  for (const [, textRe, type] of LINK_RULES) {
    if (textRe?.test(text)) return type;
  }
  return "unit-resource";
}

/** Manifest resource key → downloader type id. Keys with no entry are skipped. */
const MANIFEST_KEY_TYPE = {
  lesson: "interactive-lesson",
  slides: "slides",
  guidedNotes: "guided-notes",
  guidedNotesPdf: "notes-pdf",
  guidedNotesDocx: "notes-docx",
  handout: "handout",
  homework: "homework",
  homeworkDocx: "homework-docx",
  studentPractice: "student-practice",
  activityPack: "activity-pack",
  subPlan: "sub-plan",
  interactive: "interactive-bundle",
  familyPage: "family-page",
  studentHelp: "student-help",
  teacherNotes: "teacher-notes",
  // printablePacket points at the same file as subPlan; exitTicket is an anchor
  // inside the lesson, not a resource of its own. Both intentionally omitted.
};

// ---------------------------------------------------------------------------
// Parse curriculum/units/index.html — the only home of the unit-level rows.
// ---------------------------------------------------------------------------
function parseUnitsPage() {
  const html = readFileSync(join(root, "curriculum/units/index.html"), "utf8");
  const { document } = new JSDOM(html).window;
  const units = [];

  for (const unitEl of document.querySelectorAll("details.unit")) {
    const numText = unitEl.querySelector(".unit-num")?.textContent?.trim() || "";
    const unit = Number((numText.match(/(\d+)/) || [])[1]);
    if (!Number.isFinite(unit)) continue;

    const links = (row) =>
      [...row.querySelectorAll("a.res")].map((a) => {
        const sub = a.querySelector(".res-sub")?.textContent?.trim() || "";
        const label = a.textContent.replace(sub, "").replace(/\s+/g, " ").trim();
        return { href: a.getAttribute("href") || "", label, sub };
      });

    const unitResources = [];
    for (const res of unitEl.querySelectorAll(":scope > .unit-body > .unit-res")) {
      const section = res.querySelector(".unit-res-label")?.textContent?.trim() || "Unit resources";
      for (const row of res.querySelectorAll(".res-row")) {
        for (const link of links(row)) unitResources.push({ ...link, section });
      }
    }

    const lessons = [];
    for (const lessonEl of unitEl.querySelectorAll(":scope > .unit-body > details.lesson")) {
      const search = lessonEl.getAttribute("data-search") || "";
      const id = search.split(/\s+/)[0] || "";
      if (!id) continue;
      const head = lessonEl.querySelector(".lesson-head")?.textContent?.replace(/\s+/g, " ").trim();
      const badge = lessonEl.querySelector(".badge-sg")?.textContent?.trim() || "";
      const resources = [];
      for (const row of lessonEl.querySelectorAll(".res-row")) resources.push(...links(row));
      lessons.push({
        id,
        head: head || id,
        badge,
        objective: lessonEl.querySelector(".lesson-obj")?.textContent?.replace(/\s+/g, " ").trim(),
        resources,
      });
    }

    units.push({
      unit,
      name: unitEl.querySelector(".unit-name")?.textContent?.trim() || `Unit ${unit}`,
      blurb: unitEl.querySelector(".unit-blurb")?.textContent?.trim() || "",
      cluster: unitEl.querySelector(".badge-cluster")?.textContent?.trim() || "",
      unitResources,
      lessons,
    });
  }
  return units;
}

// ---------------------------------------------------------------------------
// Resource construction
// ---------------------------------------------------------------------------
const SG_LEVEL = { group1: "Extra Support", group2: "Challenge" };

function lessonFolder(id) {
  const core = id.replace(/-(group[12]|catchup|flagship)$/, "");
  return `Lesson-${core}`;
}

/** Build one resource record. Returns null when nothing usable is there. */
function makeResource({ unit, lessonId, lessonTitle, type, url, label, note, section }) {
  const meta = TYPE_BY_ID.get(type);
  if (!meta) return null;

  const external = /^https?:\/\//i.test(url);
  const teacherOnly = !external && isTeacherSurface(url);
  const onDisk = external || teacherOnly ? null : fileFor(url);
  const ext = onDisk ? extname(onDisk.file).toLowerCase() : "";
  const isFile = Boolean(onDisk) && DOWNLOADABLE_EXT.has(ext);

  return {
    key: `${lessonId || `unit-${unit}`}|${type}|${url}`,
    unit,
    lesson: lessonId || null,
    lessonTitle: lessonTitle || null,
    type,
    typeLabel: meta.label,
    group: meta.group,
    order: meta.order,
    label: label || meta.label,
    title: lessonTitle ? `${lessonTitle} — ${label || meta.label}` : label || meta.label,
    url,
    // "file" is fetched and written into the zip; "link" is listed in LINKS.html
    // with a working URL. Never claim a live page or a Google doc was packaged.
    delivery: isFile ? "file" : "link",
    file: isFile ? onDisk.file : null,
    bytes: isFile ? onDisk.bytes : 0,
    external,
    teacherOnly,
    section: section || null,
    note: note || null,
    scormAvailable: !external && !teacherOnly && SCORMABLE_TYPES.has(type),
  };
}

function scormResourceFor(res) {
  const meta = TYPE_BY_ID.get("scorm");
  const who = res.lesson || `unit-${res.unit}`;
  return {
    key: `${who}|scorm|${res.url}`,
    unit: res.unit,
    lesson: res.lesson,
    lessonTitle: res.lessonTitle,
    type: "scorm",
    typeLabel: meta.label,
    group: meta.group,
    order: meta.order,
    label: `SCORM · ${res.label}`,
    scormTypeLabel: res.label || res.typeLabel,
    title: `${res.title} — SCORM Package`,
    // The EXISTING generator. No second SCORM pipeline exists.
    url: `/api/scorm?activity=${encodeURIComponent(res.url)}&title=${encodeURIComponent(res.title)}`,
    delivery: "scorm",
    scormTarget: res.url,
    scormTitle: res.title,
    file: null,
    bytes: 0,
    external: false,
    teacherOnly: false,
    section: null,
    note: null,
    scormAvailable: false,
  };
}

/** Assign a unique, readable path inside the package. */
function assignZipPaths(resources, seen) {
  for (const res of resources) {
    if (res.delivery === "link") {
      res.zipPath = null;
      continue;
    }
    const meta = TYPE_BY_ID.get(res.type);
    const parts = [];
    if (res.lesson) {
      parts.push(lessonFolder(res.lesson));
      const sgMatch = res.lesson.match(/-(group[12])$/);
      if (sgMatch) {
        parts.push("Small-Group", safeName(SG_LEVEL[sgMatch[1]]));
      } else if (res.lesson.endsWith("-catchup")) {
        parts.push("Catch-Up");
      } else if (meta.folder) {
        parts.push(meta.folder);
      }
    } else if (meta.folder) {
      parts.push(meta.folder);
    }

    const ext = res.delivery === "scorm" ? ".zip" : extname(res.file || "") || ".html";
    // Readable names, never ids or hashes. A lesson resource is named for its
    // lesson and type; a unit-level one for the label the Hub shows, which is
    // the only thing that tells two graphic novels apart.
    const who = res.lesson || `Unit-${res.unit}`;
    const stem =
      res.delivery === "scorm"
        ? safeName(`${who}_${res.scormTypeLabel}_SCORM`, "SCORM-package")
        : res.lesson
          ? safeName(`${who}-${res.typeLabel}`, "resource")
          : safeName(`${who}-${res.label || res.typeLabel}`, "resource");
    let name = `${stem}${ext}`;
    let path = [...parts, name].join("/");
    // Two resources must never resolve to the same entry: a zip with duplicate
    // paths silently keeps whichever the reader unpacks last.
    let n = 2;
    while (seen.has(path)) {
      name = `${stem}-${n++}${ext}`;
      path = [...parts, name].join("/");
    }
    seen.add(path);
    res.zipPath = path;
  }
}

// ---------------------------------------------------------------------------
function main() {
  const curriculum = readJson("data/curriculum-manifest.json");
  const launch = readJson("data/curriculum-launch-manifest.json");
  const identities = readJson("data/curriculum-unit-identities.json").units || {};
  const parsed = parseUnitsPage();

  const lessonById = new Map(curriculum.lessons.map((l) => [l.id, l]));
  const launchById = new Map(
    [...launch.lessons, ...launch.smallGroups, ...launch.catchUps, ...launch.endOfUnit].map((l) => [
      l.id,
      l,
    ]),
  );

  const units = [];
  const zipSeen = new Set();

  // Catch-up stations are generated lessons that the units page does not list,
  // so they come from the launch manifest and are slotted in after the lesson
  // they catch students up on.
  const catchUpsByUnit = new Map();
  for (const cu of launch.catchUps) {
    if (!catchUpsByUnit.has(cu.unit)) catchUpsByUnit.set(cu.unit, []);
    catchUpsByUnit.get(cu.unit).push({
      id: cu.id,
      head: cu.title,
      badge: "",
      objective: cu.objective || "",
      resources: [
        { href: cu.resources?.lesson || `/lessons/${cu.id}/`, label: "Catch-Up Station", sub: "" },
      ],
    });
  }

  // Unit-level rows are bucketed by the unit their HREF names, across every
  // card, before any of them is attached — see unitOfLink().
  const unitLevel = new Map();
  for (const pu of parsed) {
    for (const link of pu.unitResources) {
      if (!link.href) continue;
      const target = unitOfLink(link.href, pu.unit);
      if (!unitLevel.has(target)) unitLevel.set(target, new Map());
      const bucket = unitLevel.get(target);
      if (bucket.has(link.href)) continue;
      const res = makeResource({
        unit: target,
        lessonId: null,
        lessonTitle: null,
        type: classifyLink(link.href, link.label),
        url: link.href,
        label: link.label || undefined,
        note: link.sub || undefined,
        section: link.section,
      });
      if (res) bucket.set(link.href, res);
    }
  }

  for (const pu of parsed.sort((a, b) => a.unit - b.unit)) {
    const identity = identities[String(pu.unit)] || {};
    const lessons = [];

    for (const cu of catchUpsByUnit.get(pu.unit) || []) {
      const parent = String(cu.id).replace(/-catchup$/, "");
      const at = pu.lessons.findLastIndex((l) => l.id === parent || l.id.startsWith(`${parent}-`));
      if (at >= 0) pu.lessons.splice(at + 1, 0, cu);
      else pu.lessons.push(cu);
    }

    for (const pl of pu.lessons) {
      const man = lessonById.get(pl.id);
      const lax = launchById.get(pl.id);
      const title = man?.title || lax?.title || pl.head;
      const isSmallGroup = /-group[12]$/.test(pl.id);
      const isCatchUp = /-catchup$/.test(pl.id);

      const byKey = new Map();
      const add = (res) => {
        if (!res) return;
        // Keyed by URL alone. Keying on type+url let one file enter twice under
        // two names: /lessons/3-2/bundle/activity-pack.html arrived from the
        // manifest as "Activity Pack" and again from the units page (whose link
        // says "Activity Pack" in prose the classifier could not place) as a
        // generic Unit Resource, and both were packaged.
        if (byKey.has(res.url)) {
          // The units page carries the teacher-facing wording; keep it.
          const first = byKey.get(res.url);
          if (!first.label && res.label) first.label = res.label;
          return;
        }
        byKey.set(res.url, res);
      };

      // 1. Files the curriculum manifest proved exist on disk.
      for (const [key, entry] of Object.entries(man?.resources || {})) {
        const type = MANIFEST_KEY_TYPE[key];
        if (!type || !entry?.exists) continue;
        add(
          makeResource({
            unit: pu.unit,
            lessonId: pl.id,
            lessonTitle: title,
            type,
            url: entry.path,
          }),
        );
      }

      // 2. Curated links from the units page (Google Forms/Slides, small-group
      //    worksheets, anything the hub shows that is not a lesson file).
      for (const link of pl.resources) {
        if (!link.href) continue;
        let type = classifyLink(link.href, link.label);
        if (isSmallGroup && type === "interactive-lesson") type = "small-group-lesson";
        if (isCatchUp && type === "interactive-lesson") type = "catchup-lesson";
        add(
          makeResource({
            unit: pu.unit,
            lessonId: pl.id,
            lessonTitle: title,
            type,
            url: link.href,
            label: link.label || undefined,
            note: link.sub || undefined,
          }),
        );
      }

      // 3. Small-group / catch-up files that exist on disk but are not linked
      //    anywhere on the site.
      if (isSmallGroup || isCatchUp) {
        for (const [rel, type] of [
          [`/lessons/${pl.id}/worksheet.html`, "small-group-worksheet"],
          [`/lessons/${pl.id}/homework.docx`, "small-group-homework"],
        ]) {
          if (fileFor(rel)) {
            add(
              makeResource({
                unit: pu.unit,
                lessonId: pl.id,
                lessonTitle: title,
                type,
                url: rel,
              }),
            );
          }
        }
      }

      const resources = [...byKey.values()];
      for (const res of resources.filter((r) => r.scormAvailable)) {
        resources.push(scormResourceFor(res));
      }
      resources.sort((a, b) => a.order - b.order);
      assignZipPaths(resources, zipSeen);

      lessons.push({
        id: pl.id,
        kind: isSmallGroup ? "small-group" : isCatchUp ? "catch-up" : "lesson",
        level: isSmallGroup ? SG_LEVEL[pl.id.match(/-(group[12])$/)[1]] : null,
        label: pl.head,
        title,
        standard: man?.standard || lax?.standard || "",
        objective: pl.objective || man?.objective || "",
        folder: lessonFolder(pl.id),
        resources,
      });
    }

    units.push({
      unit: pu.unit,
      name: pu.name,
      blurb: pu.blurb,
      cluster: pu.cluster,
      icon: identity.icon || "📘",
      identity: identity.title || "",
      folder: safeName(`EduWonderLab_Unit-${pu.unit}_${pu.name}`, `Unit-${pu.unit}`),
      lessons,
      resources: [],
    });
  }

  for (const unit of units) {
    const resources = [...(unitLevel.get(unit.unit)?.values() || [])];
    for (const res of resources.filter((r) => r.scormAvailable)) {
      resources.push(scormResourceFor(res));
    }
    resources.sort((a, b) => a.order - b.order);
    assignZipPaths(resources, zipSeen);
    unit.resources = resources;
  }

  const all = units.flatMap((u) => [...u.resources, ...u.lessons.flatMap((l) => l.resources)]);

  // Trim fields the client can derive from `types` before writing. The file is
  // fetched on a school Chromebook the moment a teacher opens the downloader,
  // and typeLabel/group/order/title are pure functions of `type` and `lesson`.
  for (const res of all) {
    if (res.label === res.typeLabel) res.label = null;
    res.typeLabel = undefined;
    res.group = undefined;
    res.order = undefined;
    res.title = undefined;
    res.key = undefined;
    if (!res.bytes) res.bytes = undefined;
    if (!res.note) res.note = undefined;
    if (!res.section) res.section = undefined;
    if (!res.external) res.external = undefined;
    if (!res.teacherOnly) res.teacherOnly = undefined;
    if (!res.scormAvailable) res.scormAvailable = undefined;
    if (!res.file) res.file = undefined;
    if (!res.zipPath) res.zipPath = undefined;
    if (!res.lesson) res.lesson = undefined;
    if (!res.lessonTitle) res.lessonTitle = undefined;
  }
  const manifest = {
    note: "GENERATED by scripts/generate-download-manifest.mjs — do not hand-edit. Sources: data/curriculum-manifest.json, data/curriculum-launch-manifest.json, curriculum/units/index.html, data/curriculum-unit-identities.json.",
    schemaVersion: 1,
    total: all.length,
    counts: {
      units: units.length,
      lessons: units.reduce((n, u) => n + u.lessons.length, 0),
      files: all.filter((r) => r.delivery === "file").length,
      links: all.filter((r) => r.delivery === "link").length,
      scorm: all.filter((r) => r.delivery === "scorm").length,
      bytes: all.reduce((n, r) => n + (r.bytes || 0), 0),
    },
    types: TYPES.map((t, i) => ({ ...t, order: i })),
    groups: GROUPS,
    presets: PRESETS,
    units,
  };

  writeFileSync(
    join(root, "data/curriculum-download-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(
    `✓ Wrote ${manifest.total} resources across ${manifest.counts.units} units ` +
      `(${manifest.counts.files} files, ${manifest.counts.links} links, ${manifest.counts.scorm} SCORM) ` +
      `→ data/curriculum-download-manifest.json`,
  );
}

main();
