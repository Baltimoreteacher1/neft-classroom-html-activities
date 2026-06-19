#!/usr/bin/env node
/**
 * build-course.mjs — generate a full Canvas course package (Common Cartridge)
 * with NATIVE auto-graded quizzes. No SCORM, no LTI, no codes, no admin.
 *
 * For each lesson it produces, organized into a Module per unit:
 *   1. A "Lesson" Page (ungraded) — link to the live interactive lesson + objective.
 *   2. A "Check" Quiz (graded) — QTI multiple-choice built from the lesson's
 *      questions, which Canvas grades automatically into the gradebook. Each
 *      question's explanation becomes answer feedback.
 *
 * Import: Canvas → Settings → Import Course Content → "Common Cartridge 1.x
 * Package" → upload → Import. Everything imports UNPUBLISHED.
 *
 * Usage:
 *   node tools/canvas/build-course.mjs            # all units
 *   node tools/canvas/build-course.mjs 1          # just Unit 1 (recommended first test)
 *   npm run course -- 1
 * Env: NEFT_SITE (default https://eduwonderlab.com), QUIZ_MAX (default 8 questions).
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const SITE = (process.env.NEFT_SITE || "https://eduwonderlab.com").replace(/\/$/, "");
const QUIZ_MAX = Number(process.env.QUIZ_MAX || 8);
const args = process.argv.slice(2);
// --quizzes-only emits just the QTI quizzes (no pages/modules) for Canvas's
// dedicated "QTI .zip file" import path — the most reliable way to land quizzes.
const QUIZ_ONLY = args.includes("--quizzes-only") || !!process.env.QUIZ_ONLY;
const unitArg = args.find((a) => /^\d+$/.test(a));
const unitFilter = unitArg ? Number(unitArg) : null;

const xml = (s) =>
  String(s == null ? "" : s).replace(
    /[<>&'"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );
const html = (s) => xml(s); // same escaping for our simple text content

const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "data/curriculum-manifest.json"), "utf8"),
);
let lessons = (
  Array.isArray(manifest.lessons) ? manifest.lessons : Object.values(manifest.lessons)
).filter((l) => l && l.id && !l.flagship);
if (unitFilter) lessons = lessons.filter((l) => Number(l.unit) === unitFilter);
if (!lessons.length) {
  console.error("No lessons matched.");
  process.exit(1);
}

/* ---- tallies for the post-build summary ---- */
// `bySource` breaks the converted counts down by the original component type so
// the teacher can see drag-sort/fill-table/error-analysis are now auto-graded.
const tally = {
  mc: 0,
  match: 0,
  skipped: {},
  capped: 0,
  bySource: { "multiple-choice": 0, "matching-game": 0, "drag-sort": 0, "fill-table": 0, "error-analysis": 0 },
};
// Question-ish component types we deliberately do NOT convert to QTI (no safe,
// reliable auto-graded representation). Counted so the teacher knows what the
// quiz omits rather than silently dropping it. drag-sort / fill-table /
// error-analysis are NO LONGER here — they are converted by the helpers below.
const UNSUPPORTED_TYPES = new Set([
  "drag-and-drop",
  "sequence",
  "ordering",
  "sorting",
  "fill-blank",
  "fill-in-the-blank",
  "short-answer",
  "open-response",
  "number-line",
  "graphing",
]);

/* ---- converters for the three newly-supported component types ----
 * These MUST mirror the re-derivation logic in validate-course.mjs exactly so
 * the answer-key cross-check lines up item-for-item. Each returns a question in
 * the SAME shape the existing mcItem/matchItem QTI generators already consume
 * ({kind:"mc",...} / {kind:"match",...}), or null when the component is
 * degenerate / not safely gradeable (caller counts it under tally.skipped). */
const distinctCount = (arr) => new Set(arr).size;

// drag-sort → matching. term = item.text, match = category LABEL (by id).
function convertDragSort(o) {
  const items = o.items;
  const cats = o.categories;
  if (!Array.isArray(items) || !items.length || !Array.isArray(cats) || !cats.length) return null;
  if (!items.every((it) => it && it.text != null && it.category != null)) return null;
  const labelOf = (id) => {
    const c = cats.find((c) => c && c.id === id);
    return c && c.label != null ? String(c.label) : String(id);
  };
  const pairs = items.slice(0, 6).map((it) => ({ term: String(it.text), match: labelOf(it.category) }));
  if (pairs.length < 2) return null;
  if (distinctCount(pairs.map((p) => p.match)) < 2) return null; // 1-bucket = degenerate
  return { kind: "match", prompt: o.instructions || "Sort each item into the correct category.", pairs };
}

// fill-table → matching. term = first value of a row, match = last value.
function convertFillTable(o) {
  const cols = o.columns;
  const rows = o.rows;
  if (!Array.isArray(cols) || cols.length < 2 || !Array.isArray(rows) || !rows.length) return null;
  const pairs = [];
  for (const r of rows.slice(0, 6)) {
    if (!r || typeof r !== "object") continue;
    const vals = Object.values(r);
    if (vals.length < 2) continue;
    const term = String(vals[0]);
    const match = String(vals[vals.length - 1]);
    if (!term.trim() || !match.trim()) continue;
    pairs.push({ term, match });
  }
  if (pairs.length < 2) return null;
  if (distinctCount(pairs.map((p) => p.match)) < 2) return null; // all-same match = degenerate
  return { kind: "match", prompt: o.label || "Match each item to its correct value.", pairs };
}

// error-analysis → multiple-choice. correctIndex = errorStep (0-indexed).
function convertErrorAnalysis(o) {
  const we = o.workedExample;
  if (!Array.isArray(we) || we.length < 2) return null;
  const es = o.errorStep;
  if (!Number.isInteger(es) || es < 0 || es >= we.length) return null;
  const choices = we.map((s) => `${s && s.label != null ? s.label : ""}: ${s && s.work != null ? s.work : ""}`);
  const stem = (o.title ? o.title + " — " : "") + "Which step contains the error?";
  return { kind: "mc", stem, choices, correct: es, explanation: o.correctWork || "" };
}

/* ---- pull gradeable questions (multiple-choice + matching) from a config ---- */
function extractQuestions(id) {
  const p = resolve(repoRoot, "lessons", id, "config.json");
  if (!existsSync(p)) return [];
  let cfg;
  try {
    cfg = JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    return [];
  }
  // mc / match keep build's existing ordering (all MC-shaped first, then all
  // matching-shaped). `srcMc` / `srcMatch` track the original component type of
  // each question, index-aligned, purely for the per-source-type summary.
  const mc = [];
  const srcMc = [];
  const match = [];
  const srcMatch = [];
  const skip = (t) => {
    tally.skipped[t] = (tally.skipped[t] || 0) + 1;
  };
  (function walk(o) {
    if (o && typeof o === "object") {
      if (o.type === "multiple-choice" && Array.isArray(o.choices) && o.choices.length >= 2 && Number.isInteger(o.correctIndex)) {
        mc.push({ kind: "mc", stem: o.stem || o.question || "", choices: o.choices.map(String), correct: o.correctIndex, explanation: o.explanation || "" });
        srcMc.push("multiple-choice");
      } else if (o.type === "error-analysis") {
        const q = convertErrorAnalysis(o);
        if (q) { mc.push(q); srcMc.push("error-analysis"); }
        else skip("error-analysis");
      } else if (o.type === "matching-game" && Array.isArray(o.pairs) && o.pairs.length >= 2 && o.pairs.every((x) => x && x.term != null && x.match != null)) {
        match.push({ kind: "match", prompt: o.label || "Match each item to its answer.", pairs: o.pairs.slice(0, 6).map((x) => ({ term: String(x.term), match: String(x.match) })) });
        srcMatch.push("matching-game");
      } else if (o.type === "drag-sort") {
        const q = convertDragSort(o);
        if (q) { match.push(q); srcMatch.push("drag-sort"); }
        else skip("drag-sort");
      } else if (o.type === "fill-table") {
        const q = convertFillTable(o);
        if (q) { match.push(q); srcMatch.push("fill-table"); }
        else skip("fill-table");
      } else if (o && typeof o.type === "string" && UNSUPPORTED_TYPES.has(o.type)) {
        skip(o.type);
      }
      for (const k in o) walk(o[k]);
    }
  })(cfg);
  // Interleave MC and matching (mc[0], match[0], mc[1], ...) so each capped
  // quiz samples BOTH types instead of filling every slot with MC. MC leads
  // each round (most reliable). q + source arrays stay in lockstep.
  const all = [];
  const allSrc = [];
  for (let i = 0; i < Math.max(mc.length, match.length); i++) {
    if (i < mc.length) { all.push(mc[i]); allSrc.push(srcMc[i]); }
    if (i < match.length) { all.push(match[i]); allSrc.push(srcMatch[i]); }
  }
  const kept = all.slice(0, QUIZ_MAX);
  tally.capped += all.length - kept.length;
  for (let i = 0; i < kept.length; i++) {
    tally[kept[i].kind === "match" ? "match" : "mc"]++;
    if (tally.bySource[allSrc[i]] != null) tally.bySource[allSrc[i]]++;
  }
  return kept;
}

/* ---- QTI 1.2 items ---- */
const LETTERS = "ABCDEFGHIJKLMNOP".split("");
function mcItem(q, ident, qi) {
  const labels = q.choices
    .map((c, i) => `          <response_label ident="${LETTERS[i]}"><material><mattext texttype="text/html">${html(c)}</mattext></material></response_label>`)
    .join("\n");
  const correct = LETTERS[q.correct] || "A";
  const fb = q.explanation
    ? `    <itemfeedback ident="general_fb"><flow_mat><material><mattext texttype="text/html">${html(q.explanation)}</mattext></material></flow_mat></itemfeedback>`
    : "";
  const fbRef = q.explanation ? `        <displayfeedback feedbacktype="Response" linkrefid="general_fb"/>` : "";
  return `  <item ident="${ident}" title="Question ${qi}">
    <itemmetadata><qtimetadata>
      <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>multiple_choice_question</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1.0</fieldentry></qtimetadatafield>
    </qtimetadata></itemmetadata>
    <presentation>
      <material><mattext texttype="text/html">${html(q.stem)}</mattext></material>
      <response_lid ident="response_${qi}" rcardinality="Single">
        <render_choice>
${labels}
        </render_choice>
      </response_lid>
    </presentation>
    <resprocessing>
      <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
      <respcondition continue="No">
        <conditionvar><varequal respident="response_${qi}">${correct}</varequal></conditionvar>
        <setvar action="Set" varname="SCORE">100</setvar>
${fbRef}
      </respcondition>
    </resprocessing>
${fb}
  </item>`;
}
function matchItem(q, ident, qi) {
  // unique right-column options; each ident "mN"; correct per term = its match's ident
  const matches = [];
  q.pairs.forEach((p) => { if (!matches.includes(p.match)) matches.push(p.match); });
  const optionXml = (rid) => matches.map((m, i) => `            <response_label ident="m${i}"><material><mattext texttype="text/html">${html(m)}</mattext></material></response_label>`).join("\n");
  const per = Math.round((100 / q.pairs.length) * 100) / 100;
  const responses = q.pairs
    .map((p, i) => `      <response_lid ident="response_${qi}_${i}" rcardinality="Single">
        <material><mattext texttype="text/html">${html(p.term)}</mattext></material>
        <render_choice>
${optionXml(i)}
        </render_choice>
      </response_lid>`)
    .join("\n");
  const conds = q.pairs
    .map((p, i) => {
      const mi = matches.indexOf(p.match);
      return `      <respcondition continue="Yes">
        <conditionvar><varequal respident="response_${qi}_${i}">m${mi}</varequal></conditionvar>
        <setvar action="Add" varname="SCORE">${per}</setvar>
      </respcondition>`;
    })
    .join("\n");
  return `  <item ident="${ident}" title="Question ${qi}">
    <itemmetadata><qtimetadata>
      <qtimetadatafield><fieldlabel>question_type</fieldlabel><fieldentry>matching_question</fieldentry></qtimetadatafield>
      <qtimetadatafield><fieldlabel>points_possible</fieldlabel><fieldentry>1.0</fieldentry></qtimetadatafield>
    </qtimetadata></itemmetadata>
    <presentation>
      <material><mattext texttype="text/html">${html(q.prompt)}</mattext></material>
${responses}
    </presentation>
    <resprocessing>
      <outcomes><decvar maxvalue="100" minvalue="0" varname="SCORE" vartype="Decimal"/></outcomes>
${conds}
    </resprocessing>
  </item>`;
}
function qtiItem(q, qi, quizId) {
  const ident = quizId + "_q" + qi;
  return q.kind === "match" ? matchItem(q, ident, qi) : mcItem(q, ident, qi);
}

function qtiAssessment(quizId, title, qs) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<questestinterop xmlns="http://www.imsglobal.org/xsd/ims_qtiasiv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/ims_qtiasiv1p2 http://www.imsglobal.org/xsd/ims_qtiasiv1p2p1.xsd">
  <assessment ident="${quizId}" title="${xml(title)}">
    <qtimetadata>
      <qtimetadatafield><fieldlabel>cc_maxattempts</fieldlabel><fieldentry>unlimited</fieldentry></qtimetadatafield>
    </qtimetadata>
    <section ident="root_section">
${qs.map((q, i) => qtiItem(q, i + 1, quizId)).join("\n")}
    </section>
  </assessment>
</questestinterop>`;
}

function assessmentMeta(quizId, asgId, title, points, groupRef) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<quiz identifier="${quizId}" xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <title>${xml(title)}</title>
  <points_possible>${points}.0</points_possible>
  <quiz_type>assignment</quiz_type>
  <assignment_group_identifierref>${groupRef}</assignment_group_identifierref>
  <allowed_attempts>-1</allowed_attempts>
  <scoring_policy>keep_highest</scoring_policy>
  <shuffle_answers>true</shuffle_answers>
  <show_correct_answers>true</show_correct_answers>
  <available>false</available>
  <published>false</published>
  <assignment identifier="${asgId}">
    <title>${xml(title)}</title>
    <points_possible>${points}.0</points_possible>
    <grading_type>points</grading_type>
    <assignment_group_identifierref>${groupRef}</assignment_group_identifierref>
    <submission_types>online_quiz</submission_types>
    <workflow_state>unpublished</workflow_state>
  </assignment>
</quiz>`;
}

function lessonPageHtml(l, url) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${xml(l.title)}</title><meta name="identifier" content="page_${l.id.replace(/[^a-z0-9]+/gi, "_")}"></head><body>
<h2>${xml(`Unit ${l.unit} Lesson ${l.lesson}: ${l.title}`)}</h2>
<p><strong>Standard:</strong> ${xml(l.standard || "")}</p>
<p><strong>Objective:</strong> ${xml(l.objective || l.contentObjective || "")}</p>
<p><a href="${xml(url)}" target="_blank" rel="noopener">▶ Open the interactive lesson</a></p>
<p>Do the lesson, then take the <strong>Check</strong> quiz to record your grade.</p>
</body></html>`;
}

/* ---- stage ---- */
const stage = resolve(repoRoot, "canvas-packages", "_coursestage");
rmSync(stage, { recursive: true, force: true });
mkdirSync(resolve(stage, "course_settings"), { recursive: true });
mkdirSync(resolve(stage, "wiki_content"), { recursive: true });

const resources = [];
const groups = {}; // unit -> groupId
const modules = {}; // unit -> [{type, idref, title}]
let quizzesMade = 0,
  pagesMade = 0;

for (const l of lessons) {
  const safe = l.id.replace(/[^a-z0-9]+/gi, "_");
  const unit = Number(l.unit);
  const groupId = "g_unit_" + unit;
  groups[unit] = groupId;
  modules[unit] = modules[unit] || [];
  const url = `${SITE}/lessons/${l.id}/`;

  // 1. Lesson page (ungraded content) — skipped in quiz-only mode
  if (!QUIZ_ONLY) {
    const pageId = "page_" + safe;
    const pageFile = `wiki_content/${pageId}.html`;
    writeFileSync(resolve(stage, pageFile), lessonPageHtml(l, url));
    resources.push(
      `    <resource identifier="${pageId}" type="webcontent" href="${pageFile}"><file href="${pageFile}"/></resource>`,
    );
    modules[unit].push({
      idref: pageId,
      title: `Unit ${l.unit} Lesson ${l.lesson}: ${l.title}`,
      kind: "page",
    });
    pagesMade++;
  }

  // 2. Auto-graded quiz (multiple-choice + matching)
  const qs = extractQuestions(l.id);
  if (qs.length) {
    const quizId = "quiz_" + safe;
    const asgId = "quizasg_" + safe;
    const dir = quizId;
    mkdirSync(resolve(stage, dir), { recursive: true });
    const title = `Unit ${l.unit} Lesson ${l.lesson} Check: ${l.title}`;
    writeFileSync(resolve(stage, dir, quizId + ".xml"), qtiAssessment(quizId, title, qs));
    writeFileSync(
      resolve(stage, dir, "assessment_meta.xml"),
      assessmentMeta(quizId, asgId, title, qs.length, groupId),
    );
    resources.push(
      `    <resource identifier="${quizId}" type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment" href="${dir}/${quizId}.xml">\n` +
        `      <file href="${dir}/${quizId}.xml"/>\n` +
        `      <dependency identifierref="${quizId}_meta"/>\n` +
        `    </resource>\n` +
        `    <resource identifier="${quizId}_meta" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="${dir}/assessment_meta.xml">\n` +
        `      <file href="${dir}/assessment_meta.xml"/>\n` +
        `    </resource>`,
    );
    modules[unit].push({ idref: quizId, title: title, kind: "quiz" });
    quizzesMade++;
  }
}

/* ---- assignment groups (one per unit) ---- */
const unitNums = Object.keys(groups)
  .map(Number)
  .sort((a, b) => a - b);
writeFileSync(
  resolve(stage, "course_settings", "assignment_groups.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<assignmentGroups xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
${unitNums.map((u, i) => `  <assignmentGroup identifier="${groups[u]}"><title>Unit ${u}</title><position>${i + 1}</position><group_weight>0.0</group_weight></assignmentGroup>`).join("\n")}
</assignmentGroups>`,
);

/* ---- modules (one per unit) ---- */
writeFileSync(
  resolve(stage, "course_settings", "module_meta.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<modules xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
${unitNums
  .map((u, ui) => {
    const items = modules[u]
      .map(
        (it, ii) =>
          `    <item identifier="modi_${u}_${ii}" identifierref="${it.idref}"><content_type>${it.kind === "quiz" ? "Quizzes::Quiz" : "WikiPage"}</content_type><title>${xml(it.title)}</title><position>${ii + 1}</position></item>`,
      )
      .join("\n");
    return `  <module identifier="mod_unit_${u}"><title>Unit ${u}</title><position>${ui + 1}</position><workflow_state>unpublished</workflow_state><items>\n${items}\n  </items></module>`;
  })
  .join("\n")}
</modules>`,
);
writeFileSync(
  resolve(stage, "course_settings", "canvas_export.txt"),
  "Canvas Common Cartridge export — Neft math course (pages + auto-graded quizzes).\n",
);

/* ---- manifest ---- */
const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="neft-course-cartridge" xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
  <metadata><schema>IMS Common Cartridge</schema><schemaversion>1.1.0</schemaversion></metadata>
  <organizations><organization identifier="org_1" structure="rooted-hierarchy"><item identifier="root"/></organization></organizations>
  <resources>
${resources.join("\n")}
    <resource identifier="res_course_settings" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="course_settings/canvas_export.txt">
      <file href="course_settings/assignment_groups.xml"/>
      <file href="course_settings/module_meta.xml"/>
      <file href="course_settings/canvas_export.txt"/>
    </resource>
  </resources>
</manifest>`;
writeFileSync(resolve(stage, "imsmanifest.xml"), manifestXml);

/* ---- guard: validate answer keys in the staged package BEFORE shipping ----
 * A silent off-by-one would grade every student wrong. validate-course.mjs
 * re-derives keys from source, so a passing run means the package is safe. If
 * it fails we abort (leaving the stage for inspection) rather than ship.       */
const validator = resolve(__dirname, "validate-course.mjs");
let validated = false;
if (quizzesMade > 0 && existsSync(validator)) {
  try {
    execSync(`node ${JSON.stringify(validator)} ${JSON.stringify(stage)}`, {
      stdio: "inherit",
      env: { ...process.env, QUIZ_MAX: String(QUIZ_MAX) },
    });
    validated = true;
  } catch (e) {
    console.error(
      `\n✗ ABORTED: answer-key validation failed for the staged package.\n` +
        `  The package was NOT written. Inspect: ${stage}\n` +
        `  Fix the failing lesson config(s), then rebuild.`,
    );
    process.exit(1);
  }
}

const base = QUIZ_ONLY ? "neft-quizzes" : "neft-course";
const ext = QUIZ_ONLY ? "zip" : "imscc";
const outName = unitFilter ? `${base}-unit${unitFilter}.${ext}` : `${base}.${ext}`;
const outFile = resolve(repoRoot, "canvas-packages", outName);
rmSync(outFile, { force: true });
execSync(`cd "${stage}" && zip -r -q -X "${outFile}" . -x ".*"`);
rmSync(stage, { recursive: true, force: true });

const totalQs = tally.mc + tally.match;
const skippedTypes = Object.entries(tally.skipped);
console.log(`\n✓ ${QUIZ_ONLY ? "QTI quiz package" : "Canvas course package"}: ${outFile}`);
console.log(`  Quizzes:        ${quizzesMade} auto-graded   (across ${unitNums.length} unit(s))`);
if (!QUIZ_ONLY) console.log(`  Lesson pages:   ${pagesMade}`);
console.log(`  Questions:      ${totalQs} total  →  ${tally.mc} multiple-choice, ${tally.match} matching`);
{
  const bs = tally.bySource;
  console.log(
    `  Converted from: multiple-choice×${bs["multiple-choice"]}, matching-game×${bs["matching-game"]}, ` +
      `drag-sort×${bs["drag-sort"]}, fill-table×${bs["fill-table"]}, error-analysis×${bs["error-analysis"]}`,
  );
}
if (tally.capped > 0)
  console.log(`  Capped:         ${tally.capped} extra question(s) dropped (QUIZ_MAX=${QUIZ_MAX}/quiz)`);
if (skippedTypes.length)
  console.log(
    `  Skipped types:  ${skippedTypes.map(([t, n]) => `${t}×${n}`).join(", ")} (not auto-gradeable in Canvas QTI)`,
  );
else console.log(`  Skipped types:  none`);
console.log(`  Answer keys:    ${validated ? "VALIDATED ✓ (every key matches source)" : "not validated"}`);
if (QUIZ_ONLY) {
  console.log(`\nImport: Canvas → Settings → Import Course Content → "QTI .zip file" → upload → Import.`);
  console.log(`Creates auto-graded quizzes directly (most reliable quiz path). Imports UNPUBLISHED.`);
} else {
  console.log(`\nImport: Canvas → Settings → Import Course Content → "Common Cartridge 1.x Package" → upload → Import.`);
  console.log(`Everything imports UNPUBLISHED. Quizzes grade themselves into the gradebook.`);
}
