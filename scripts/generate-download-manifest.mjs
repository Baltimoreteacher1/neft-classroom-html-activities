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

import { existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
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

/**
 * The resource page's own topic, used to tell two same-typed resources apart.
 *
 * Units 2, 5 and 6 each merge two pre-TOC units, so they legitimately carry two
 * pre-tests, two post-test projects, four graphic novels and two unit games. A
 * bare "-2" tells a teacher nothing about which is which; every one of these
 * pages states its topic in its own title, so that is what the filename uses.
 */
const topicCache = new Map();
function topicOf(sitePath) {
  const clean = String(sitePath || "").split(/[?#]/)[0];
  if (topicCache.has(clean)) return topicCache.get(clean);
  let topic = null;
  const rel = clean.replace(/^\/+/, "").replace(/\/$/, "");
  const strip = (raw) =>
    String(raw)
      .replace(/&amp;/g, "and")
      // Leading emoji would otherwise defeat the boilerplate strip below and
      // leave "Unit 10 Review" as the distinguishing token.
      .replace(
        /^[\s\u{1F000}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE00}-\u{FE0F}\u{2B00}-\u{2BFF}\u{200D}]+/gu,
        "",
      )
      .replace(/^\s*Unit\s+\d+\s+Review\s*:?\s*/i, "")
      .replace(/^\s*Graphic Novel\s*#?\d*\s*[·:—-]\s*/i, "")
      .split(/\s+[|—]\s+/)[0]
      .replace(/\s+/g, " ")
      .trim();

  for (const candidate of [rel, `${rel}/index.html`]) {
    const abs = join(root, candidate);
    if (!candidate || !existsSync(abs) || !statSync(abs).isFile()) continue;
    const html = readFileSync(abs, "utf8");
    // Both headings are tried: /pre-test/unit10-review.html puts its topic in a
    // nested span, so its <h1> strips down to nothing while its <title> is
    // "Unit 10 Review: Volume and Surface Area".
    for (const source of [/<h1[^>]*>([^<]+)/, /<title>([^<]+)/]) {
      const raw = source.exec(html)?.[1];
      const stripped = raw ? strip(raw) : "";
      if (stripped) {
        topic = stripped;
        break;
      }
    }
    break;
  }
  topicCache.set(clean, topic || null);
  return topic || null;
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
  // Set B — the second practice form. Same resource kind as Set A, so it
  // files under the same type and rides the same presets; the label the hub
  // supplies is what distinguishes the two rows.
  [/worksheet-2\.html$/i, /worksheet/i, "small-group-worksheet"],
  [/\/practice\.html$/i, /practice set/i, "small-group-practice"],
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
    note: res.note || null,
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

/**
 * Assign a unique, readable path inside the package.
 *
 * Names are metadata, never counters. Units 2, 5 and 6 each merge two pre-TOC
 * units and so legitimately hold two pre-tests, two post-test projects, four
 * graphic novels and two unit games. When a name would be used twice, EVERY
 * member of that group is qualified by its own topic — qualifying only the
 * second produced "Unit-5-Pre-Test" beside "Unit-5-Pre-Test-+-L1-L2", where the
 * qualifier was shared boilerplate and the pair still could not be told apart.
 * Numbering is the last resort, when no metadata separates them.
 */
function assignZipPaths(resources, seen) {
  const planned = [];
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
    const who = res.lesson || `Unit-${res.unit}`;
    const stem =
      res.delivery === "scorm"
        ? safeName(`${who}_${res.scormTypeLabel}_SCORM`, "SCORM-package")
        : res.lesson
          ? safeName(`${who}-${res.typeLabel}`, "resource")
          : safeName(`${who}-${res.label || res.typeLabel}`, "resource");
    planned.push({ res, parts, stem, ext });
  }

  const groups = new Map();
  for (const item of planned) {
    const key = `${item.parts.join("/")}/${item.stem}${item.ext}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }

  for (const group of groups.values()) {
    if (group.length > 1) {
      // Topic first: it is the one fact that actually differs between an Area
      // review and a Volume review. res-sub and the URL slug are the fallbacks.
      // res-sub first — it is the teacher-facing subtitle the Hub already shows
      // ("Aquarium Architect"), and it beats a page whose own <h1> is generic
      // ("Mission Briefing"). It is skipped automatically when it is shared
      // boilerplate ("+ L1/L2"), because then it fails the distinctness test.
      for (const pick of [
        (item) => item.res.note,
        (item) => topicOf(item.res.scormTarget || item.res.url),
        (item) =>
          (item.res.scormTarget || item.res.url)
            .split(/[?#]/)[0]
            .replace(/\/$/, "")
            .split("/")
            .pop()
            .replace(/\.[a-z0-9]+$/i, ""),
      ]) {
        const named = group.map((item) => ({
          item,
          stem: safeName(`${item.stem}-${pick(item) || ""}`, item.stem),
        }));
        const distinct = new Set(named.map((n) => `${n.item.parts.join("/")}/${n.stem}`));
        if (named.every((n) => pick(n.item)) && distinct.size === group.length) {
          for (const n of named) n.item.stem = n.stem;
          break;
        }
      }
    }
    for (const item of group) {
      let path = `${[...item.parts, `${item.stem}${item.ext}`].join("/")}`;
      let n = 2;
      while (seen.has(path)) {
        path = [...item.parts, `${item.stem}-${n++}${item.ext}`].join("/");
      }
      seen.add(path);
      item.res.zipPath = path;
    }
  }
}

// ---------------------------------------------------------------------------
function main() {
  const curriculum = readJson("data/curriculum-manifest.json");
  const launch = readJson("data/curriculum-launch-manifest.json");
  // Decorative only (icon/identity blurb). This file is keyed by the
  // PRE-renumber numbering — its "9" is "Integer Outpost", its "10" is "Volume
  // Vault" — so it must never be used to decide which unit owns a resource.
  const identities = readJson("data/curriculum-unit-identities.json").units || {};
  // Teachers still search by the CCSS codes ("6.RP.A.3") the district used
  // before the 2025 MCCRS re-code, and lessons now carry the new ids ("6.AT.3").
  // data/standards-crosswalk-2025.json already maps the two, so the old code
  // becomes a search alias rather than a dead query.
  const legacyStandards = new Map();
  const dropCluster = (id) => String(id || "").replace(/\.[A-Z](?=\.)/, "");
  for (const entry of readJson("data/standards-crosswalk-2025.json").entries || []) {
    const key = dropCluster(entry.newId);
    if (!key) continue;
    const aliases = [entry.oldId, entry.oldShortForm].filter(Boolean);
    legacyStandards.set(key, [...new Set([...(legacyStandards.get(key) || []), ...aliases])]);
  }
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

  // Unit-level rows belong to the unit whose card contains them — rule 2 of the
  // ownership order documented beside CANONICAL_UNIT in
  // scripts/lib/download-taxonomy.mjs, and enforced by
  // tools/validate-unit-resource-placement.mjs.
  //
  // This deliberately does NOT infer the unit from the href (rule 4: a path
  // number is a diagnostic clue, never authority). Most unit-level assets carry
  // LEGACY numbering from before the 2026-08-10 Reveal-TOC renumber —
  // /pre-test/unit9-review.html is titled "Integers and Coordinate Plane" and
  // belongs to Unit 7; /math/unit-10/projects/ is "Volume & Surface Area in
  // Action" and belongs to Unit 5. Trusting the href moved dozens of
  // correctly-placed resources into the wrong package.
  const unitLevel = new Map();
  for (const pu of parsed) {
    for (const link of pu.unitResources) {
      if (!link.href) continue;
      const target = pu.unit;
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
          [`/lessons/${pl.id}/worksheet-2.html`, "small-group-worksheet"],
          [`/lessons/${pl.id}/practice.html`, "small-group-practice"],
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
        legacyStandard:
          legacyStandards
            .get(dropCluster(man?.standard || lax?.standard || "").replace(/[a-z]$/, ""))
            ?.join(" ") || undefined,
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
      // No brand prefix: the same thirteen characters on every unit folder and on
      // every download's root, pushing the unit number a teacher scans for off
      // the left edge of a Downloads list. The site the zip came from is not in
      // question by the time it is on their disk.
      folder: safeName(`Unit-${pu.unit}_${pu.name}`, `Unit-${pu.unit}`),
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

  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  const out = join(root, "data/curriculum-download-manifest.json");

  /* --stdout: produce the manifest WITHOUT touching the tracked file.
   *
   * This is how the freshness ratchet in tools/download-manifest.test.mjs asks
   * "would the generator write something different?" without answering it by
   * overwriting the very file it is checking. A ratchet that repairs what it
   * measures fails once and passes forever after, which is worse than no
   * ratchet: a stale manifest reaches main as soon as anyone runs the suite
   * twice. */
  if (process.argv.includes("--stdout")) {
    process.stdout.write(body);
    return;
  }

  /* Atomic write: full content to a temp sibling, then rename over the target.
   * `writeFileSync` truncates first, so a reader that opens the file mid-write
   * sees a partial document. Inside `npm run qa:loop` the readers are real —
   * validate:downloads runs concurrently with the rest of the gate — and a
   * partial JSON read there would surface as a baffling parse error in a check
   * that had nothing to do with the cause. rename(2) is atomic on the same
   * filesystem, so a reader sees either the old file or the new one. */
  const tmp = `${out}.tmp-${process.pid}`;
  writeFileSync(tmp, body);
  renameSync(tmp, out);
  console.log(
    `✓ Wrote ${manifest.total} resources across ${manifest.counts.units} units ` +
      `(${manifest.counts.files} files, ${manifest.counts.links} links, ${manifest.counts.scorm} SCORM) ` +
      `→ data/curriculum-download-manifest.json`,
  );
}

main();
