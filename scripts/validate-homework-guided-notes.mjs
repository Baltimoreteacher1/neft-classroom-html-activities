#!/usr/bin/env node
/**
 * Quality gate for generated family homework guided notes.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";

const root = join(import.meta.dirname, "..");
const lessonsDir = join(root, "lessons");
// Every page the homework generator writes, not every core lesson: a bridge or
// review lesson that opted in ships a homework.html too, and a page nobody
// sweeps is a page that can rot silently. Presence of the FILE is the evidence,
// so this stays in step with the generator without duplicating its predicate.
const HOMEWORK_DIR_RE = /^[0-9][0-9a-z-]*$/;

// Cases a grade-6 student really types, run against each page's own inlined
// copy of the shared answer matcher. Accepted forms must all be credited;
// rejected forms must stay wrong, so "be tolerant" never becomes "accept
// anything".
const MATCH_CASES = [
  { input: "7", answer: "m = 7", want: true },
  { input: "m = 7", answer: "7", want: true },
  { input: "24", answer: "24 sq. ft.", want: true },
  { input: "24 square feet", answer: "24", want: true },
  { input: ".5", answer: "1/2", want: true },
  { input: "4", answer: "m = 7", want: false },
  { input: "42", answer: "2 × 3 × 7", want: false },
  { input: "", answer: "7", want: false },
];

// Core Quick Check = the Warm-up tier + the Level-up (challenge) tier.
// Bonus / Más problems are excluded by design.
//
// Anchored on the rendered badge element on purpose: an earlier version matched
// the bare label anywhere in the file, which also counted the two mentions inside
// the stylesheet comment documenting the old " / Repaso" suffix bug. Every one of
// the 74 pages then reported 8 instead of its real 6, so the HIGH warning fired
// site-wide and meant nothing.
/**
 * Counts the core practice badges. The badge used to be one bilingual string
 * ("Warm-up / Calentamiento 1"); it is now two language spans, because the
 * family page defaults to ONE language and a hardcoded "X / Y" printed Spanish
 * onto an English page. The counter reads the English span, which is the label
 * that is always present regardless of the reader's language choice.
 */
export function countQuickChecks(html) {
  return (
    html.match(
      /class="problem-number-badge"><span class="lang-en">(?:Warm-up|Level up)<\/span>[\s\S]*?<\/span> \d/g,
    ) || []
  ).length;
}

// Self-test first, so a counter that silently stops counting fails loudly instead
// of reporting a clean curriculum (same rule as validate:math / validate:workflow-yaml).
function selfTestCountQuickChecks() {
  const badge = (en, es, n) =>
    `<div class="problem-number-badge"><span class="lang-en">${en}</span>` +
    `<span class="lang-es" lang="es">${es}</span> ${n}</div>`;
  const cases = [
    ["counts warm-up badges", badge("Warm-up", "Calentamiento", 1), 1],
    ["counts level-up badges", badge("Level up", "Reto", 2), 1],
    [
      "counts a full 3+3 core set",
      [1, 2, 3].map((n) => badge("Warm-up", "Calentamiento", n)).join("") +
        [1, 2, 3].map((n) => badge("Level up", "Reto", n)).join(""),
      6,
    ],
    [
      "ignores the label inside a comment (the 8-vs-6 regression)",
      `/* ("Warm-up / Calentamiento 1"), so appending " / Repaso" produced
         "Warm-up / Calentamiento 1 / Repaso" on every problem. */` +
        badge("Warm-up", "Calentamiento", 1),
      1,
    ],
    [
      "ignores an unnumbered label",
      '<div class="problem-number-badge"><span class="lang-en">Warm-up</span>' +
        '<span class="lang-es" lang="es">Calentamiento</span></div>',
      0,
    ],
    [
      "ignores the OLD single-string badge, so a stale generator cannot pass",
      '<div class="problem-number-badge">Warm-up / Calentamiento 1</div>',
      0,
    ],
    ["ignores Bonus", badge("Bonus", "Más", 1), 0],
    ["empty document counts zero", "<html></html>", 0],
  ];
  const failures = [];
  for (const [name, html, expected] of cases) {
    const got = countQuickChecks(html);
    if (got !== expected) failures.push(`  ✗ ${name}: expected ${expected}, got ${got}`);
  }
  if (failures.length) {
    console.error(`countQuickChecks self-test: ${failures.length} FAILED`);
    for (const f of failures) console.error(f);
    process.exit(1);
  }
  console.log(`countQuickChecks self-test: ${cases.length} passed, 0 failed`);
}

selfTestCountQuickChecks();

const REQUIRED_MARKERS = [
  "Family Math Night",
  "Ayuda a tu estudiante",
  "What we're learning tonight",
  "Qué aprendemos hoy",
  "The big idea",
  "La idea principal",
  "Follow the picture path",
  "Sigan la ruta visual",
  "In one sentence",
  "En una frase",
  "Try this together",
  "Inténtenlo juntos",
  "Words to know",
  "Palabras clave",
  "If your student gets stuck",
  "Si se atora",
  "Quick check",
  "Repaso rápido",
  "You did it together",
  "Lo lograron juntos",
  "Check This Problem",
  "NTAnswerMatch",
  'class="homework-tab-bar"',
  'class="concept-quick-path"',
  'class="learning-word-chips"',
  'class="step-lead lang-en"',
  'class="family-visual-lab"',
  'data-visual-lab="',
  'class="visual-lab-stage"',
  'data-lesson-model="',
  "data-lesson-model-host",
  'class="interactive-visual"',
  "/assets/homework-lesson-models.js",
  'class="visual-representation-grid"',
  "TOUCH &amp; TRY",
  "TOCA Y PRUEBA",
  'data-tab-panel="play"',
  // The workbench is a drawer inside Together now, not a tab of its own.
  "workbench-drawer",
  "Math Workbench",
  // Help is a drawer that floats over every stop rather than tab 8 of 10.
  'id="hw_help_drawer"',
  "toggleHelpDrawer",
  // Every game lives in one arcade on the Play stop.
  'data-arcade-game="quiz"',
  'data-arcade-game="full"',
  "external-resource-list",
  "help_modal_overlay",
  "switchHomeworkTab",
  "initHomeworkGame",
  "Learn more online",
  "Play together",
];

const BAD_SPANISH = [
  /Puedo use\b/i,
  /Puedo explain\b/i,
  /Puedo write\b/i,
  /Puedo find\b/i,
  /Puedo describe\b/i,
  /\bununa\b/i,
  /Exponenteee/i,
  /Volumenn\b/i,
  /Sigue el mismo patrón en cada fila/,
  /Mira cómo funciona paso a paso/,
];

/**
 * THE PAGE MAY NOT PRINT TWO LANGUAGES AT A READER WHO CHOSE ONE.
 *
 * Every string on this page is supposed to ship as a `.lang-en` / `.lang-es`
 * pair so the language control can show one of them. Roughly forty were
 * authored as a single hardcoded "English / Español" run instead — badges,
 * problem numbers, coaching labels, the sign-off heading — and those printed
 * BOTH languages no matter what a family selected. That is not a translation
 * bug, it is the "too technical and complicated" complaint made literal: half
 * of every line is words the reader cannot use.
 *
 * A hardcoded run is decidable from the text alone: a leaf run containing
 * " / " whose right-hand side opens with a Spanish tell. Deliberately narrow —
 * it does NOT try to judge prose, only this one shape — and the four legitimate
 * cases are named, because the language selector must label itself in both
 * languages and a comparison phrase ("At least / At most") is one language's
 * own wording.
 */
/* Spaces on BOTH sides are required. Every hardcoded pair on this page was
   authored as " / " with spaces, while an unspaced slash is nearly always one
   language's own grammar — Spanish gendered articles write "El/La ___ depende
   de el/la ___", which the first version of this reported as a translation. */
const BILINGUAL_RUN = /[a-zA-Z)] \/ (?:[A-ZÁÉÍÓÚÑ¿¡]|el |la |los |las |un |una |para |qué |cómo )/;
const BILINGUAL_ALLOWED = new Set([
  // The language control names the languages it offers, in those languages.
  "Language / Idioma",
  "Bilingual / Bilingüe",
  // Both halves are one language's own phrasing, inside its own span.
  "At least / At most",
  "Al menos / A lo más",
]);

/** Leaf text runs between tags, with script and style bodies removed. */
export function findBilingualRuns(html) {
  const body = String(html).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "");
  const out = [];
  for (const m of body.matchAll(/>([^<>{}]{3,120}?)</g)) {
    const run = m[1].trim();
    if (!run || BILINGUAL_ALLOWED.has(run)) continue;
    // "Parent/Guardian", "and/or", a URL, and a fraction are not translations.
    if (/Parent\/Guardian|and\/or|https?:\/\/|\d\s?\/\s?\d|\bw\//.test(run)) continue;
    if (BILINGUAL_RUN.test(run)) out.push(run);
  }
  return [...new Set(out)];
}

function selfTestBilingualRuns() {
  const cases = [
    ["catches a badge", "<span>WHY THIS MATTERS / ¿POR QUÉ IMPORTA?</span>", 1],
    ["catches a problem number", '<div class="b">Warm-up / Calentamiento 1</div>', 1],
    ["catches a lowercase Spanish head", "<strong>Family role / Rol de la familia:</strong>", 1],
    ["allows the language control", "<span>Language / Idioma</span><b>Bilingual / Bilingüe</b>", 0],
    ["allows a fraction", "<p>How many 1/4-cup scoops fit into 3/2 cups?</p>", 0],
    ["allows Parent/Guardian", "<span>Parent/Guardian Name:</span>", 0],
    ["allows a URL", '<a href="x">https://khanacademy.org/a/B</a>', 0],
    [
      "allows a proper span pair",
      '<span class="lang-en">Words</span><span class="lang-es">Palabras</span>',
      0,
    ],
    ["ignores script bodies", "<script>var a = 'Warm-up / Calentamiento';</script>", 0],
    ["ignores style bodies", "<style>/* Warm-up / Calentamiento */</style>", 0],
    [
      "allows Spanish gendered articles, which use an unspaced slash",
      "<p>Usa la oración: &#39;El/La ___ depende de el/la ___.&#39;</p>",
      0,
    ],
  ];
  const failures = [];
  for (const [name, html, expected] of cases) {
    const got = findBilingualRuns(html).length;
    if (got !== expected) failures.push(`  ✗ ${name}: expected ${expected}, got ${got}`);
  }
  if (failures.length) {
    console.error(`findBilingualRuns self-test: ${failures.length} FAILED`);
    for (const f of failures) console.error(f);
    process.exit(1);
  }
  console.log(`findBilingualRuns self-test: ${cases.length} passed, 0 failed`);
}

selfTestBilingualRuns();

const lessonIds = readdirSync(lessonsDir)
  .filter(
    (d) =>
      HOMEWORK_DIR_RE.test(d) &&
      existsSync(join(lessonsDir, d, "config.json")) &&
      existsSync(join(lessonsDir, d, "homework.html")),
  )
  .sort();

if (!lessonIds.length) {
  console.error("validate-homework-guided-notes FAILED: found zero homework pages to check");
  process.exit(1);
}

let issues = [];

for (const id of lessonIds) {
  const path = join(lessonsDir, id, "homework.html");
  const html = readFileSync(path, "utf8");

  for (const marker of REQUIRED_MARKERS) {
    if (!html.includes(marker)) {
      issues.push({ id, level: "CRITICAL", msg: `Missing marker: ${marker}` });
    }
  }

  const quickChecks = countQuickChecks(html);
  if (quickChecks > 6) {
    issues.push({ id, level: "HIGH", msg: `Too many quick check problems: ${quickChecks}` });
  }
  if (quickChecks === 0) {
    issues.push({ id, level: "HIGH", msg: "No quick check problems" });
  }

  // Student practice tools (AI Learning Lab + Math Workbench) are allowed links.
  const htmlNoAiHub = html.replace(/\/curriculum\/(ai-hub|math-workbench)\/[^"'\s]*/gi, "");
  if (
    /\/curriculum\//i.test(htmlNoAiHub) ||
    /Curriculum Hub/i.test(html) ||
    /Back to curriculum/i.test(html)
  ) {
    issues.push({ id, level: "CRITICAL", msg: "Contains curriculum/hub navigation link" });
  }

  const extLinks = (html.match(/class="external-resource-link"/g) || []).length;
  if (extLinks === 0) {
    issues.push({ id, level: "HIGH", msg: "No external resource links" });
  }

  const bilingualRuns = findBilingualRuns(html);
  if (bilingualRuns.length) {
    issues.push({
      id,
      level: "HIGH",
      msg: `${bilingualRuns.length} hardcoded bilingual run(s) — a reader who chose one language sees both: ${bilingualRuns
        .slice(0, 3)
        .map((r) => JSON.stringify(r))
        .join(", ")}`,
    });
  }

  for (const bad of BAD_SPANISH) {
    if (bad.test(html)) {
      issues.push({ id, level: "CRITICAL", msg: `Bad Spanish pattern: ${bad}` });
    }
  }

  const learningBlocks = html.match(/<p class="learning-big">[\s\S]*?<\/p>/g) || [];
  if (learningBlocks.some((block) => /\.\.<\/p>/.test(block))) {
    issues.push({ id, level: "HIGH", msg: "Learning summary has doubled punctuation" });
  }

  const visualLabs = (html.match(/class="family-visual-lab"/g) || []).length;
  const lessonModels = (html.match(/data-lesson-model="/g) || []).length;
  const representationCards = (html.match(/class="visual-representation-card /g) || []).length;
  if (visualLabs !== 1) {
    issues.push({
      id,
      level: "CRITICAL",
      msg: `Expected one visual math lab, found ${visualLabs}`,
    });
  }
  if (lessonModels !== 1) {
    issues.push({
      id,
      level: "CRITICAL",
      msg: `Expected one shared lesson model, found ${lessonModels}`,
    });
  }
  if (representationCards !== 3) {
    issues.push({
      id,
      level: "HIGH",
      msg: `Expected three representations, found ${representationCards}`,
    });
  }

  const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  if (!script) {
    issues.push({ id, level: "CRITICAL", msg: "Missing inline script" });
  } else {
    try {
      new vm.Script(script);
    } catch (e) {
      issues.push({ id, level: "CRITICAL", msg: `Script syntax error: ${e.message}` });
    }
    // Grade the answer matcher on behaviour, not on its source text. The old
    // gate grepped for one regex inside `normalizeMath`, which pinned that
    // exact implementation in place: it stayed green while the matcher marked
    // a correct "7" wrong against an authored "m = 7". Run the page's own
    // inlined copy and check the cases students actually type.
    assertAnswerMatcherWorks(id, html);
  }
}

function assertAnswerMatcherWorks(id, html) {
  // Run the matcher IIFE alone. The surrounding page script touches `window`
  // and the DOM, which this check has no business booting.
  const start = html.indexOf("var NTAnswerMatch = (function () {");
  const end = start === -1 ? -1 : html.indexOf("\n})();", start);
  if (start === -1 || end === -1) {
    issues.push({ id, level: "CRITICAL", msg: "Shared answer matcher is not inlined" });
    return;
  }
  const block = html.slice(start, end + "\n})();".length);
  let isRight;
  try {
    const context = vm.createContext({});
    new vm.Script(`${block}\n;globalThis.__isRight = NTAnswerMatch.isRight;`).runInContext(
      context,
      {
        timeout: 5000,
      },
    );
    isRight = context.__isRight;
  } catch (e) {
    issues.push({ id, level: "CRITICAL", msg: `Answer matcher did not load: ${e.message}` });
    return;
  }
  if (typeof isRight !== "function") {
    issues.push({ id, level: "CRITICAL", msg: "NTAnswerMatch.isRight is missing" });
    return;
  }
  for (const { input, answer, want } of MATCH_CASES) {
    if (isRight(input, answer) !== want) {
      issues.push({
        id,
        level: "CRITICAL",
        msg: `Answer matcher should ${want ? "accept" : "reject"} ${JSON.stringify(input)} for ${JSON.stringify(answer)}`,
      });
    }
  }
}

const critical = issues.filter((i) => i.level === "CRITICAL");
const high = issues.filter((i) => i.level === "HIGH");

console.log(`Checked ${lessonIds.length} lessons`);
console.log(`CRITICAL: ${critical.length}, HIGH: ${high.length}`);

if (issues.length) {
  for (const i of issues.slice(0, 40)) {
    console.log(`[${i.level}] ${i.id}: ${i.msg}`);
  }
  if (issues.length > 40) console.log(`...and ${issues.length - 40} more`);
  process.exit(critical.length ? 1 : 0);
}

console.log("All guided-notes quality checks passed.");
