#!/usr/bin/env node
/**
 * build-library-cartridge.mjs — turn the ENTIRE EduWonderLab library (every
 * lesson, activity, game, project, assessment — current AND future) into one
 * Canvas-importable Common Cartridge, organized into Modules.
 *
 * Where the older tools (build-cartridge / build-course) read only the 64–74
 * curriculum lessons in data/curriculum-manifest.json, this reads
 * data/registry.json — the auto-generated source of truth for all 624+ items.
 * Add a new activity folder, run `npm run generate-registry`, rebuild here, and
 * the new item lands in Canvas automatically. That is the "future work" promise.
 *
 * Each item becomes either:
 *   - a Canvas Page (default, --mode=link)  — a live link + objective; or
 *   - a graded assignment (--mode=graded)   — online-text-entry completion code,
 *     mirroring build-cartridge.mjs's proven assignment format.
 * Items are grouped into Modules by unit / subject / type, in a stable order.
 *
 * Student-safe by design: teacher tools, hubs, and anything marked private /
 * teacher / admin / family in data/routes.json is excluded so nothing internal
 * lands in a student course. Override with --include-private (not recommended).
 *
 * Import: Canvas → Settings → Import Course Content → "Common Cartridge 1.x
 * Package" → upload → Import. Everything imports UNPUBLISHED.
 *
 * Usage:
 *   node tools/canvas/build-library-cartridge.mjs                 # whole library, link mode
 *   node tools/canvas/build-library-cartridge.mjs --mode=graded   # completion-code assignments
 *   node tools/canvas/build-library-cartridge.mjs --type=Game     # only one activity type
 *   node tools/canvas/build-library-cartridge.mjs --section=math  # only urls under /math/
 *   node tools/canvas/build-library-cartridge.mjs --limit=25      # cap (smoke test)
 *   npm run library-cartridge -- --type=Project
 *
 * Env: NEFT_SITE overrides the base site (default https://eduwonderlab.com).
 * Output: canvas-packages/neft-library[-suffix].imscc  (+ a manifest .json sidecar)
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { selectLibrary, norm } from "./lib/library-select.mjs";
import { validateCartridgeDir } from "./validate-cartridge.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");

const args = process.argv.slice(2);
const getOpt = (name, dflt = null) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : dflt;
};
const MODE = getOpt("mode", "link") === "graded" ? "graded" : "link";
const TYPE_FILTER = getOpt("type"); // e.g. Game, Project, Activity, Lesson
const SECTION_FILTER = getOpt("section"); // url substring, e.g. "math", "esol"
const LIMIT = Number(getOpt("limit", 0)) || 0;
const INCLUDE_PRIVATE = args.includes("--include-private");

// Exact selection exported from Canvas Studio. --select=<file> reads a JSON
// { urls:[...] } (or a bare array / newline list); --select-urls=a,b,c is inline.
const SELECT_FILE = getOpt("select");
const SELECT_INLINE = getOpt("select-urls");
let SELECT_URLS = null;
if (SELECT_FILE) {
  const f = resolve(repoRoot, SELECT_FILE);
  if (!existsSync(f)) {
    console.error(`Selection file not found: ${f}`);
    process.exit(1);
  }
  const raw = readFileSync(f, "utf8").trim();
  try {
    const parsed = JSON.parse(raw);
    SELECT_URLS = Array.isArray(parsed) ? parsed : Array.isArray(parsed.urls) ? parsed.urls : [];
  } catch {
    // tolerate a plain newline/comma list
    SELECT_URLS = raw.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
  }
} else if (SELECT_INLINE) {
  SELECT_URLS = SELECT_INLINE.split(",").map((s) => s.trim()).filter(Boolean);
}
if (SELECT_URLS && !SELECT_URLS.length) {
  console.error("Selection is empty — nothing to build.");
  process.exit(1);
}

const xml = (s) =>
  String(s == null ? "" : s).replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );

/* ---------- select + group (shared source of truth) ---------- */
const { items, modules: orderedModules } = selectLibrary(repoRoot, {
  typeFilter: TYPE_FILTER,
  sectionFilter: SECTION_FILTER,
  limit: LIMIT,
  includePrivate: INCLUDE_PRIVATE,
  selectUrls: SELECT_URLS,
});

if (!items.length) {
  console.error("No items matched the given filters.");
  process.exit(1);
}
// Surface any selected urls that didn't resolve (e.g. removed from the library).
if (SELECT_URLS) {
  const got = new Set(items.map((i) => norm(i.url)));
  const missing = SELECT_URLS.map(norm).filter((u) => !got.has(u));
  if (missing.length)
    console.warn(`⚠ ${missing.length} selected url(s) not in the current library (skipped):\n  ${missing.slice(0, 8).join("\n  ")}`);
}

/* ---------- staging ---------- */
const stage = resolve(repoRoot, "canvas-packages", "_librarystage");
rmSync(stage, { recursive: true, force: true });
mkdirSync(resolve(stage, "course_settings"), { recursive: true });
mkdirSync(resolve(stage, "wiki_content"), { recursive: true });

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "item";

const steps = `<ol style="font-size:15px;line-height:1.7;">
  <li><strong>Open the activity</strong> with the button below.</li>
  <li><strong>Complete it.</strong> A <strong>completion code</strong> appears at the end and is copied automatically.</li>
  <li><strong>Return to Canvas</strong> and <strong>paste the code</strong> in the box below.</li>
  <li>Click <strong>Submit Assignment</strong>.</li>
</ol>`;

const linkBtn = (url, title) =>
  `<p style="margin:14px 0;"><a href="${xml(url)}" target="_blank" rel="noopener" style="display:inline-block;background:#12355b;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;">▶ Open: ${xml(title)}</a></p>`;

const pageHtml = (it, url, pageId) =>
  `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${xml(it.title)}</title><meta name="identifier" content="${pageId}"></head><body>
<h2>${xml(it.title)}</h2>
${it.standard ? `<p><strong>Standard:</strong> ${xml(it.standard)}</p>` : ""}
<p><strong>Type:</strong> ${xml(it.activityType)}</p>
${linkBtn(url, it.title)}
<p style="color:#475569;font-size:14px;">Interactive activity — opens in a new tab. Your progress saves automatically.</p>
</body></html>`;

const assignmentHtml = (it, url) =>
  `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${xml(it.title)}</title></head><body>
<h2>${xml(it.title)}</h2>
${it.standard ? `<p><strong>Standard:</strong> ${xml(it.standard)}</p>` : ""}
<p><strong>How to turn this in:</strong></p>
${steps}
${linkBtn(url, it.title)}
<p style="color:#475569;font-size:14px;">Tip: type your name exactly as it appears in Canvas when asked.</p>
</body></html>`;

const assignmentSettingsXml = (it, ident, pos, groupRef) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<assignment identifier="${ident}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${xml(it.title)}</title>
  <assignment_group_identifierref>${groupRef}</assignment_group_identifierref>
  <points_possible>100.0</points_possible>
  <grading_type>points</grading_type>
  <submission_types>online_text_entry</submission_types>
  <position>${pos}</position>
  <workflow_state>unpublished</workflow_state>
</assignment>`;

const resources = [];
const moduleMeta = []; // { id, title, order, items:[{idref,title,kind}] }
const sidecar = []; // human-readable inventory of what shipped
let pos = 0;

for (const mod of orderedModules) {
  const groupId = "g_" + mod.key.replace(/[^a-z0-9]+/gi, "_");
  const modItems = [];
  for (const it of mod.items) {
    pos += 1;
    const base = slug(it.url || it.title) + "_" + pos;
    const url = it.url.startsWith("http") ? it.url : `${SITE}${norm(it.url)}`;

    if (MODE === "graded") {
      const ident = "neftlib_" + base;
      const dir = ident;
      mkdirSync(resolve(stage, dir), { recursive: true });
      writeFileSync(resolve(stage, dir, `${ident}.html`), assignmentHtml(it, url));
      writeFileSync(
        resolve(stage, dir, "assignment_settings.xml"),
        assignmentSettingsXml(it, ident, pos, groupId),
      );
      resources.push(
        `    <resource identifier="res_${ident}" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="${dir}/${ident}.html">\n` +
          `      <file href="${dir}/${ident}.html"/>\n` +
          `      <file href="${dir}/assignment_settings.xml"/>\n` +
          `    </resource>`,
      );
      modItems.push({ idref: `res_${ident}`, title: it.title, kind: "Assignment" });
    } else {
      const pageId = "page_" + base;
      const pageFile = `wiki_content/${pageId}.html`;
      writeFileSync(resolve(stage, pageFile), pageHtml(it, url, pageId));
      resources.push(
        `    <resource identifier="${pageId}" type="webcontent" href="${pageFile}"><file href="${pageFile}"/></resource>`,
      );
      modItems.push({ idref: pageId, title: it.title, kind: "WikiPage" });
    }
    sidecar.push({ module: mod.title, title: it.title, type: it.activityType, url });
  }
  moduleMeta.push({ id: groupId, title: mod.title, order: mod.order, items: modItems });
}

/* ---------- assignment groups (graded mode only) ---------- */
if (MODE === "graded") {
  writeFileSync(
    resolve(stage, "course_settings", "assignment_groups.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>
<assignmentGroups xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
${moduleMeta
  .map(
    (m, i) =>
      `  <assignmentGroup identifier="${m.id}"><title>${xml(m.title)}</title><position>${i + 1}</position><group_weight>0.0</group_weight></assignmentGroup>`,
  )
  .join("\n")}
</assignmentGroups>`,
  );
}

/* ---------- modules ---------- */
writeFileSync(
  resolve(stage, "course_settings", "module_meta.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<modules xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
${moduleMeta
  .map((m, mi) => {
    const items = m.items
      .map(
        (it, ii) =>
          `    <item identifier="modi_${mi}_${ii}" identifierref="${it.idref}"><content_type>${it.kind}</content_type><title>${xml(it.title)}</title><position>${ii + 1}</position></item>`,
      )
      .join("\n");
    return `  <module identifier="mod_${m.id}"><title>${xml(m.title)}</title><position>${mi + 1}</position><workflow_state>unpublished</workflow_state><items>\n${items}\n  </items></module>`;
  })
  .join("\n")}
</modules>`,
);

writeFileSync(
  resolve(stage, "course_settings", "canvas_export.txt"),
  "Canvas Common Cartridge export — EduWonderLab full library (modules of live activities).\n",
);

/* ---------- manifest ---------- */
const courseSettingsFiles = [
  `      <file href="course_settings/module_meta.xml"/>`,
  `      <file href="course_settings/canvas_export.txt"/>`,
];
if (MODE === "graded")
  courseSettingsFiles.unshift(`      <file href="course_settings/assignment_groups.xml"/>`);

const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="neft-library-cartridge" xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
  <metadata><schema>IMS Common Cartridge</schema><schemaversion>1.1.0</schemaversion></metadata>
  <organizations><organization identifier="org_1" structure="rooted-hierarchy"><item identifier="root"/></organization></organizations>
  <resources>
${resources.join("\n")}
    <resource identifier="res_course_settings" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="course_settings/canvas_export.txt">
${courseSettingsFiles.join("\n")}
    </resource>
  </resources>
</manifest>`;
writeFileSync(resolve(stage, "imsmanifest.xml"), manifestXml);

/* ---------- zip ---------- */
const suffix = [
  SELECT_URLS ? "selection" : null,
  TYPE_FILTER ? TYPE_FILTER.toLowerCase() : null,
  SECTION_FILTER ? SECTION_FILTER.toLowerCase() : null,
  MODE === "graded" ? "graded" : null,
].filter(Boolean).join("-");
const outName = suffix ? `neft-library-${suffix}.imscc` : "neft-library.imscc";
// Self-validate the staged package BEFORE shipping (mirrors build-course.mjs's
// answer-key guard). A structural defect aborts the build rather than producing
// a broken .imscc.
const check = validateCartridgeDir(stage);
if (!check.ok) {
  console.error(`\n✗ ABORTED: staged cartridge failed validation (package NOT written):`);
  for (const e of check.errors) console.error(`  ✗ ${e}`);
  console.error(`  Inspect the staged dir: ${stage}`);
  process.exit(1);
}

const outFile = resolve(repoRoot, "canvas-packages", outName);
rmSync(outFile, { force: true });
execSync(`cd "${stage}" && zip -r -q -X "${outFile}" . -x ".*"`);

// human-readable sidecar (what shipped, by module)
const sidecarFile = outFile.replace(/\.imscc$/, ".manifest.json");
writeFileSync(
  sidecarFile,
  JSON.stringify(
    {
      generatedFrom: "data/registry.json",
      site: SITE,
      mode: MODE,
      filters: { type: TYPE_FILTER, section: SECTION_FILTER, limit: LIMIT || null },
      totals: { items: items.length, modules: orderedModules.length },
      modules: orderedModules.map((m) => ({ title: m.title, count: m.items.length })),
      items: sidecar,
    },
    null,
    2,
  ) + "\n",
);

rmSync(stage, { recursive: true, force: true });

console.log(`\n✓ Library Common Cartridge: ${outFile}`);
console.log(`  Validated:  ✓ structure clean (${check.stats.manifestHrefs} hrefs, ${check.stats.moduleItems} module items resolve)`);
console.log(`  Items:    ${items.length}  (mode=${MODE})`);
console.log(`  Modules:  ${orderedModules.length}`);
for (const m of orderedModules) console.log(`    • ${m.title.padEnd(34)} ${m.items.length}`);
if (TYPE_FILTER || SECTION_FILTER || LIMIT)
  console.log(`  Filters:  ${[TYPE_FILTER && `type=${TYPE_FILTER}`, SECTION_FILTER && `section=${SECTION_FILTER}`, LIMIT && `limit=${LIMIT}`].filter(Boolean).join(", ")}`);
console.log(`  Inventory: ${sidecarFile}`);
console.log(`\nImport: Canvas → Settings → Import Course Content → "Common Cartridge 1.x Package" → upload → Import.`);
console.log(`Everything imports UNPUBLISHED. ${MODE === "graded" ? "Assignments use completion-code (online text entry)." : "Pages link to the live activities."}`);
