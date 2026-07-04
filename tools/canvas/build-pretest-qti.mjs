#!/usr/bin/env node
/**
 * build-pretest-qti.mjs — convert the 10 unit pre-tests into ONE native Canvas
 * quiz package (QTI .zip): a "Unit N Pre-Test" quiz per unit, item-scored, in a
 * "Pre-Tests" assignment group. Canvas grades every question itself — this is
 * the stronger alternative to the pre-tests' SCORM completion packages.
 *
 * Question data is read from the pre-test pages' own inline JS (the same data
 * that drives the page), so the quiz and the page can never disagree:
 *   - const SECTIONS = [{ questions: [...] }]   (units 1, 7-10)
 *   - const questions = [...]                   (units 2-6)
 * Items: type "mc"   → multiple_choice_question  (answer = correct index)
 *        type "fill" → short_answer_question     (accept[] = exact matches)
 *
 * Self-validates before zipping (like build-course.mjs): every generated item's
 * answer key is re-checked against the page source; a mismatch ABORTS the build.
 *
 * Usage:  node tools/canvas/build-pretest-qti.mjs [outDir]
 * Output: <outDir|canvas-packages>/neft-pretest-quizzes.zip
 * Import: Canvas → Settings → Import Course Content → "QTI .zip file".
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { execSync } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import vm from "vm";
import { LETTERS, xml, qtiAssessment, assessmentMeta } from "./lib/qti.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "../..");
const outDir = resolve(repoRoot, process.argv[2] || "canvas-packages");

/* ---- extract the question-data literal from a pre-test page ---- */
// Scan a balanced [...] starting at `from` (the "["), skipping strings,
// template literals, and comments, so we lift EXACTLY the array literal.
function balancedArray(src, from) {
  let depth = 0;
  let i = from;
  let mode = null; // null | '"' | "'" | "`" | "//" | "/*"
  for (; i < src.length; i++) {
    const c = src[i];
    const two = src.slice(i, i + 2);
    if (mode === null) {
      if (c === '"' || c === "'" || c === "`") mode = c;
      else if (two === "//") mode = "//";
      else if (two === "/*") mode = "/*";
      else if (c === "[") depth++;
      else if (c === "]") {
        depth--;
        if (depth === 0) return src.slice(from, i + 1);
      }
    } else if (mode === "//") {
      if (c === "\n") mode = null;
    } else if (mode === "/*") {
      if (two === "*/") {
        mode = null;
        i++;
      }
    } else {
      if (c === "\\")
        i++; // skip escaped char inside a string
      else if (c === mode) mode = null;
    }
  }
  throw new Error("unbalanced array literal");
}

function evalLiteral(src, declRe) {
  const m = src.match(declRe);
  if (!m) return null;
  const lit = balancedArray(src, m.index + m[0].length - 1);
  // The data literal may call small page helpers. Provide quiz-safe versions:
  // frac() renders page-CSS-dependent HTML there — plain "n/d" reads correctly
  // inside Canvas. Anything else undefined should fail loudly, not guess.
  const sandbox = Object.create(null);
  sandbox.frac = (n, d) => `${n}/${d}`;
  return vm.runInNewContext("(" + lit + ")", sandbox, { timeout: 2000 });
}

// The 10 pre-tests use several dialects of the same idea. Normalize them all:
//   - flat `const questions = [...]` (units 2-4, 9-10)
//   - `const SECTIONS = [{questions:[...]}]` (units 1, 7-8)
//   - `const sections = [{questions:[...]}]` (units 5-6)
// Item keys vary (text|prompt, options|choices, explain|explanation), so items
// are classified by SHAPE: a choice array + integer answer index = MC; a bare
// string/number answer = short-answer. Anything else is skipped (counted).
function extractItems(file) {
  const src = readFileSync(file, "utf8");
  let qs = evalLiteral(src, /const questions\s*=\s*\[/);
  if (!qs) {
    const sections = evalLiteral(src, /const (?:SECTIONS|sections)\s*=\s*\[/);
    if (sections) qs = sections.flatMap((s) => (s && s.questions) || []);
  }
  if (!qs || !qs.length) throw new Error("no question data found");
  const items = [];
  let skipped = 0;
  for (const q of qs) {
    if (!q || typeof q !== "object") continue;
    const stem = q.text ?? q.prompt;
    const choices = q.options ?? q.choices;
    const explanation = q.explain ?? q.explanation ?? "";
    if (stem == null) continue;
    if (
      Array.isArray(choices) &&
      choices.length >= 2 &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer < choices.length
    ) {
      items.push({
        kind: "mc",
        stem: String(stem),
        choices: choices.map(String),
        correct: q.answer,
        explanation,
        src: q,
      });
    } else if (
      !Array.isArray(choices) &&
      (typeof q.answer === "string" ||
        typeof q.answer === "number" ||
        (Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length))
    ) {
      const accept = (
        Array.isArray(q.accept) && q.accept.length
          ? q.accept
          : Array.isArray(q.acceptedAnswers) && q.acceptedAnswers.length
            ? q.acceptedAnswers
            : [q.answer]
      ).map(String);
      items.push({
        kind: "short",
        stem: String(stem),
        answer: String(q.answer ?? accept[0]),
        accept,
        explanation,
        src: q,
      });
    } else skipped++;
  }
  return { items, skipped, total: qs.length };
}

/* ---- answer-key guard: re-check every generated item against source ---- */
function validateQuizXml(xmlStr, items, unit) {
  const itemBlocks = xmlStr.split("<item ").slice(1);
  if (itemBlocks.length !== items.length)
    throw new Error(`unit ${unit}: ${itemBlocks.length} XML items vs ${items.length} source`);
  items.forEach((q, i) => {
    const block = itemBlocks[i];
    const keys = [...block.matchAll(/<varequal respident="[^"]+">([^<]*)<\/varequal>/g)].map(
      (m) => m[1],
    );
    if (q.kind === "mc") {
      const want = LETTERS[q.src.answer];
      if (keys.length !== 1 || keys[0] !== want)
        throw new Error(`unit ${unit} Q${i + 1}: key ${keys.join(",")} ≠ source ${want}`);
    } else {
      const want = new Set(q.accept.map((a) => xml(String(a).trim())));
      if (keys.length !== want.size || keys.some((k) => !want.has(k)))
        throw new Error(`unit ${unit} Q${i + 1}: short-answer keys ${keys.join("|")} ≠ source`);
    }
  });
}

/* ---- build the package ---- */
const stage = resolve(outDir, "_stage-pretest-qti");
rmSync(stage, { recursive: true, force: true });
mkdirSync(resolve(stage, "course_settings"), { recursive: true });

const resources = [];
const built = [];
let mcCount = 0;
let fillCount = 0;
const GROUP = "g_pretests";

for (let unit = 1; unit <= 10; unit++) {
  const page = resolve(repoRoot, `pre-test/unit${unit}-review.html`);
  if (!existsSync(page)) throw new Error(`missing pre-test page for unit ${unit}`);
  const { items, skipped, total } = extractItems(page);
  if (!items.length) throw new Error(`unit ${unit}: no gradeable questions extracted`);
  if (skipped)
    console.log(`  · unit ${unit}: ${skipped}/${total} question(s) not QTI-gradeable — skipped`);
  const quizId = `quiz_pretest_unit${unit}`;
  const asgId = `quizasg_pretest_unit${unit}`;
  const title = `Unit ${unit} Pre-Test`;
  const body = qtiAssessment(quizId, title, items);
  validateQuizXml(body, items, unit);
  mkdirSync(resolve(stage, quizId), { recursive: true });
  writeFileSync(resolve(stage, quizId, quizId + ".xml"), body);
  writeFileSync(
    resolve(stage, quizId, "assessment_meta.xml"),
    assessmentMeta(quizId, asgId, title, items.length, GROUP),
  );
  resources.push(
    `    <resource identifier="${quizId}" type="imsqti_xmlv1p2/imscc_xmlv1p1/assessment" href="${quizId}/${quizId}.xml">\n` +
      `      <file href="${quizId}/${quizId}.xml"/>\n` +
      `      <dependency identifierref="${quizId}_meta"/>\n` +
      `    </resource>\n` +
      `    <resource identifier="${quizId}_meta" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="${quizId}/assessment_meta.xml">\n` +
      `      <file href="${quizId}/assessment_meta.xml"/>\n` +
      `    </resource>`,
  );
  mcCount += items.filter((q) => q.kind === "mc").length;
  fillCount += items.filter((q) => q.kind === "short").length;
  built.push({ unit, questions: items.length });
}

writeFileSync(
  resolve(stage, "course_settings", "assignment_groups.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<assignmentGroups xmlns="http://canvas.instructure.com/xsd/cccv1p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://canvas.instructure.com/xsd/cccv1p0 https://canvas.instructure.com/xsd/cccv1p0.xsd">
  <assignmentGroup identifier="${GROUP}"><title>Pre-Tests</title><position>1</position><group_weight>0.0</group_weight></assignmentGroup>
</assignmentGroups>`,
);
writeFileSync(
  resolve(stage, "course_settings", "canvas_export.txt"),
  "Canvas QTI export — Neft unit pre-tests (item-scored native quizzes).\n",
);
writeFileSync(
  resolve(stage, "imsmanifest.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="neft-pretest-quizzes" xmlns="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1" xmlns:lom="http://ltsc.ieee.org/xsd/imsccv1p1/LOM/resource" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsccv1p1/imscp_v1p1 http://www.imsglobal.org/profile/cc/ccv1p1/ccv1p1_imscp_v1p2_v1p0.xsd">
  <metadata><schema>IMS Common Cartridge</schema><schemaversion>1.1.0</schemaversion></metadata>
  <organizations><organization identifier="org_1" structure="rooted-hierarchy"><item identifier="root"/></organization></organizations>
  <resources>
${resources.join("\n")}
    <resource identifier="res_course_settings" type="associatedcontent/imscc_xmlv1p1/learning-application-resource" href="course_settings/canvas_export.txt">
      <file href="course_settings/assignment_groups.xml"/>
      <file href="course_settings/canvas_export.txt"/>
    </resource>
  </resources>
</manifest>`,
);

mkdirSync(outDir, { recursive: true });
const outFile = resolve(outDir, "neft-pretest-quizzes.zip");
rmSync(outFile, { force: true });
execSync(`cd "${stage}" && zip -r -q -X "${outFile}" . -x ".*"`);
rmSync(stage, { recursive: true, force: true });

const total = built.reduce((n, b) => n + b.questions, 0);
console.log(`✓ Pre-test QTI package: ${outFile}`);
console.log(
  `  Quizzes: ${built.length} (one per unit) · ${total} questions (${mcCount} MC + ${fillCount} short-answer)`,
);
console.log(`  Answer keys: VALIDATED ✓ (every key re-checked against the page source)`);
console.log(`\nImport: Canvas → Settings → Import Course Content → "QTI .zip file".`);
