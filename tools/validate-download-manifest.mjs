#!/usr/bin/env node
/**
 * Gate for the bulk resource downloader.
 *
 * The downloader promises a teacher two things a normal check cannot see:
 * that a package contains what the summary said it would, and that nothing was
 * dropped on the floor. Both are properties of the generated manifest, so this
 * reads the manifest and holds it to them.
 *
 * It also self-tests its own detectors first. A gate that silently stops firing
 * reports a clean inventory, which is worse than no gate — the failure mode this
 * whole feature is trying to avoid.
 *
 *   node tools/validate-download-manifest.mjs
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isTeacherSurface,
  PRESETS,
  safeName,
  TYPE_BY_ID,
} from "../scripts/lib/download-taxonomy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = resolve(ROOT, "data/curriculum-download-manifest.json");

let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`   ✗ ${message}`);
};

console.log("curriculum download manifest");

if (!existsSync(MANIFEST)) {
  console.error("   ✗ data/curriculum-download-manifest.json is missing — run:");
  console.error("     node scripts/generate-download-manifest.mjs");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const curriculum = JSON.parse(readFileSync(resolve(ROOT, "data/curriculum-manifest.json"), "utf8"));

/* -- 0. the detectors still fire ------------------------------------------ */
{
  const selfTests = [
    [
      "safeName strips Windows-reserved characters",
      () => !/[<>:"/\\|?*]/.test(safeName('a<b>c:"d/e')),
    ],
    ["safeName never returns an empty name", () => safeName("   ...   ") === "resource"],
    ["safeName keeps digits", () => safeName("3-1 Notes") === "3-1-Notes"],
    ["isTeacherSurface flags teacher-notes", () => isTeacherSurface("/lessons/3-1/teacher-notes/")],
    [
      "isTeacherSurface flags answer keys",
      () => isTeacherSurface("/math/unit-3/projects/answer-key/"),
    ],
    ["isTeacherSurface leaves student lessons open", () => !isTeacherSurface("/lessons/3-1/")],
    ["isTeacherSurface leaves /assets open", () => !isTeacherSurface("/assets/curriculum-hub.css")],
  ];
  for (const [name, check] of selfTests) {
    if (!check()) fail(`self-test failed: ${name}`);
  }
  if (failures) {
    console.error("   detectors are broken; refusing to report on the manifest");
    process.exit(1);
  }
  console.log(`   self-tests          : ${selfTests.length} ✓`);
}

const units = manifest.units || [];
const unitNumbers = new Set(units.map((u) => u.unit));
const everyResource = [];
for (const unit of units) {
  for (const res of unit.resources) everyResource.push({ res, unit, lesson: null });
  for (const lesson of unit.lessons) {
    for (const res of lesson.resources) everyResource.push({ res, unit, lesson });
  }
}

/* -- 1. every resource belongs to a real unit ----------------------------- */
for (const { res, unit } of everyResource) {
  if (!unitNumbers.has(res.unit))
    fail(`resource ${res.url} claims unit ${res.unit}, which has no entry`);
  if (res.unit !== unit.unit)
    fail(`resource ${res.url} sits under unit ${unit.unit} but claims ${res.unit}`);
  if (!TYPE_BY_ID.has(res.type)) fail(`resource ${res.url} has unknown type "${res.type}"`);
}

/* -- 2. ids are unique where the downloader relies on it ------------------ */
{
  const lessonIds = new Set();
  for (const unit of units) {
    for (const lesson of unit.lessons) {
      if (lessonIds.has(lesson.id)) fail(`lesson id ${lesson.id} appears twice`);
      lessonIds.add(lesson.id);
      const seen = new Set();
      for (const res of lesson.resources) {
        const id = `${res.type}|${res.url}`;
        // The browser keys the selection Set on type|url. Two resources sharing
        // one id would tick and untick together.
        if (seen.has(id)) fail(`lesson ${lesson.id} has two resources with id ${id}`);
        seen.add(id);
      }
    }
    const seen = new Set();
    for (const res of unit.resources) {
      const id = `${res.type}|${res.url}`;
      if (seen.has(id)) fail(`unit ${unit.unit} has two resources with id ${id}`);
      seen.add(id);
    }
  }
}

/* -- 3. every packaged file actually exists ------------------------------- */
{
  let checked = 0;
  for (const { res } of everyResource) {
    if (res.delivery !== "file") continue;
    checked++;
    if (!res.file) {
      fail(`${res.url} is delivery:"file" with no local path`);
      continue;
    }
    const abs = resolve(ROOT, res.file);
    if (!existsSync(abs) || !statSync(abs).isFile() || statSync(abs).size === 0) {
      fail(`${res.file} is packaged but missing or empty on disk`);
    }
  }
  if (!checked)
    fail('no delivery:"file" resources at all — the generator found nothing to package');
  console.log(`   packaged files      : ${checked} ✓`);
}

/* -- 4. no two entries can overwrite each other inside a package ---------- */
{
  const byPath = new Map();
  for (const { res, unit } of everyResource) {
    if (!res.zipPath) {
      if (res.delivery !== "link") fail(`${res.url} is ${res.delivery} but has no zipPath`);
      continue;
    }
    // zipPaths are unit-relative; a cross-unit package prefixes them, so the
    // collision that matters is within one unit.
    const key = `${unit.unit}/${res.zipPath}`;
    if (byPath.has(key)) {
      fail(`two resources map to ${key}: ${byPath.get(key)} and ${res.url}`);
    }
    byPath.set(key, res.url);
    if (/\.\.|^\/|\\/.test(res.zipPath)) fail(`unsafe zip path: ${res.zipPath}`);
    for (const segment of res.zipPath.split("/")) {
      if (segment !== safeName(segment, segment))
        fail(`zip path segment is not filename-safe: ${segment}`);
    }
  }
  console.log(`   unique zip paths    : ${byPath.size} ✓`);
}

/* -- 5. presets select what they claim ------------------------------------ */
{
  for (const preset of PRESETS) {
    for (const type of preset.types) {
      if (!TYPE_BY_ID.has(type)) fail(`preset "${preset.id}" names unknown type "${type}"`);
    }
    const types = new Set(preset.types);
    const perUnit = units.map((u) =>
      [...u.resources, ...u.lessons.flatMap((l) => l.resources)].filter((r) => types.has(r.type)),
    );
    const empty = perUnit.filter((list) => !list.length).length;
    if (empty === units.length) fail(`preset "${preset.id}" selects nothing in any unit`);
    // Every selected resource must be of a type the preset asked for — the
    // property the download summary's counts rest on.
    for (const list of perUnit) {
      for (const res of list) {
        if (!types.has(res.type)) fail(`preset "${preset.id}" leaked type ${res.type}`);
      }
    }
  }
  const shipped = new Set(manifest.presets.map((p) => p.id));
  for (const preset of PRESETS) {
    if (!shipped.has(preset.id)) fail(`preset "${preset.id}" is defined but not in the manifest`);
  }
  console.log(`   presets             : ${PRESETS.length} ✓`);
}

/* -- 6. links and protected resources are represented honestly ------------ */
{
  for (const { res } of everyResource) {
    if (res.external && res.delivery !== "link") {
      fail(`${res.url} is external but claims delivery:"${res.delivery}"`);
    }
    if (res.teacherOnly && res.delivery !== "link") {
      // Packaging a teacher surface would hand its contents to anyone who can
      // open the downloader, which is the whole public hub.
      fail(`${res.url} is a teacher surface but is packaged as a file`);
    }
    if (!res.external && isTeacherSurface(res.url) && !res.teacherOnly) {
      fail(`${res.url} is a teacher surface but is not flagged teacherOnly`);
    }
    if (res.delivery === "link" && res.zipPath) fail(`${res.url} is a link but claims a zipPath`);
    if (res.delivery === "file" && !/^\/(?!\/)/.test(res.url)) {
      fail(`${res.url} is packaged but is not a site-relative path`);
    }
  }
  console.log(`   link/teacher rules  : ${everyResource.length} resources ✓`);
}

/* -- 7. SCORM reuses the existing endpoint -------------------------------- */
{
  let scorm = 0;
  for (const { res } of everyResource) {
    if (res.delivery !== "scorm") continue;
    scorm++;
    if (!res.url.startsWith("/api/scorm?activity=")) {
      fail(`SCORM entry does not use the existing /api/scorm endpoint: ${res.url}`);
    }
    const target = new URLSearchParams(res.url.split("?")[1]).get("activity");
    if (!target || !target.startsWith("/"))
      fail(`SCORM entry has no site-relative activity: ${res.url}`);
  }
  if (!scorm) fail("no SCORM entries — the Canvas/SCORM pack would be empty");
  console.log(`   SCORM entries       : ${scorm} ✓`);
}

/* -- 8. the inventory has not drifted from the curriculum ----------------- */
{
  const known = new Set();
  for (const unit of units) for (const lesson of unit.lessons) known.add(lesson.id);
  const missing = curriculum.lessons.filter((l) => !known.has(l.id)).map((l) => l.id);
  if (missing.length) {
    fail(
      `${missing.length} lesson(s) in data/curriculum-manifest.json are absent from the downloader ` +
        `(${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", …" : ""}). ` +
        `Run: node scripts/generate-download-manifest.mjs`,
    );
  }
  console.log(
    `   lesson coverage     : ${curriculum.lessons.length - missing.length}/${curriculum.lessons.length} ✓`,
  );
}

/* -- 9. the pages load the downloader with a current cache stamp ---------- */
{
  const stamp = (file) =>
    createHash("sha256")
      .update(readFileSync(resolve(ROOT, file), "utf8"))
      .digest("hex")
      .slice(0, 8);

  // The stylesheet is referenced by the MODULE, not by a <link> in either page:
  // /curriculum/ is held to a 60-request budget and the downloader is
  // teacher-only, so it must cost that page nothing until it is opened.
  const moduleSource = readFileSync(resolve(ROOT, "assets/curriculum-download.js"), "utf8");
  const cssRef = /\/assets\/curriculum-download\.css\?v=([a-f0-9]+)/.exec(moduleSource);
  const cssWant = stamp("assets/curriculum-download.css");
  if (!cssRef) {
    fail("assets/curriculum-download.js does not load its own stylesheet");
  } else if (cssRef[1] !== cssWant) {
    fail(
      `curriculum-download.css changed but curriculum-download.js still says ?v=${cssRef[1]} — ` +
        `replace it with ?v=${cssWant}`,
    );
  }

  const jsWant = stamp("assets/curriculum-download.js");
  const pages = ["curriculum/index.html", "curriculum/units/index.html"];
  for (const page of pages) {
    const html = readFileSync(resolve(ROOT, page), "utf8");
    const found = /\/assets\/curriculum-download\.js\?v=([a-f0-9]+)/.exec(html);
    if (!found) {
      fail(`${page} does not load /assets/curriculum-download.js?v=<hash>`);
    } else if (found[1] !== jsWant) {
      fail(
        `curriculum-download.js changed but ${page} still says ?v=${found[1]} — ` +
          `replace it with ?v=${jsWant}`,
      );
    }
  }
  console.log(`   hub wiring          : ${pages.length} pages ✓`);
}

if (failures) {
  console.error(`\nRESULT: FAIL ❌ (${failures} problem${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(
  `RESULT: PASS ✅ (${manifest.total} resources · ${manifest.counts.files} files · ` +
    `${manifest.counts.links} links · ${manifest.counts.scorm} SCORM)`,
);
