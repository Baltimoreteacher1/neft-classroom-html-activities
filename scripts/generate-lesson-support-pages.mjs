#!/usr/bin/env node
/**
 * Lesson Support Page Generator (family / teacher-notes / student-help)
 * --------------------------------------------------------------------------
 * For every lesson, generates the three support pages the curriculum audit
 * flags as missing, using REAL content from that lesson's config.json:
 *
 *   lessons/<id>/family/index.html        family lesson support
 *   lessons/<id>/teacher-notes/index.html one-page teacher prep
 *   lessons/<id>/student-help/index.html  student "I can..." help card
 *
 * Content is derived only from data already in config.json (objectives,
 * vocabulary w/ Spanish, conceptIntro I-do/we-do/you-do, practice problems with
 * known answers, common mistake, connect scenario, exit ticket). No math is
 * invented — practice answers come from matching-game pairs and the exit ticket,
 * which carry their own answers.
 *
 * SAFE / ADDITIVE:
 *   - Only writes the three target files. Never touches lesson.html, notes, etc.
 *   - Skips any target that already contains "<!-- hand-edited -->" so a teacher
 *     can lock a page from regeneration.
 *   - Never deletes anything.
 *
 * Usage:
 *   node scripts/generate-lesson-support-pages.mjs            # all lessons
 *   node scripts/generate-lesson-support-pages.mjs 1-2 3-4    # specific lessons
 *   node scripts/generate-lesson-support-pages.mjs --dry      # report only
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { interactiveVisualHost } from "@eduwonderlab/engine/core/interactive-visual.js";
import { familyFieldProblems } from "./lib/family-content.mjs";
import { FAMILY_LETTER_CSS, FAMILY_PAPER } from "./lib/family-paper-css.mjs";
import { withPlainDefinitions } from "./lib/family-plain-definitions.mjs";
import { writeGenerated } from "./lib/preserve-injected.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

import { DATA_DIR, LESSONS_DIR as lessonsDir } from "../tools/lib/curriculum-source.mjs";

const notesDir = join(__dirname, "..", "data", "family-homework-notes");

const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry");
const onlyIds = argv.filter((a) => LESSON_DIR_RE.test(a));

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const SENTENCE_FRAMES = [
  "I know ___ because ___.",
  "First, I ___. Then, I ___.",
  "The answer is ___, so ___.",
];

/* ---------- content extraction (no invention; answers come from config) ---------- */

// Up to `n` accurate practice problems with answers, drawn from data that
// already carries its own answer: matching-game pairs (the block `label` is the
// directions; the `term` is the thing to solve) and the lesson's `familyCheck`.
// Returns { directions, problems:[{q,a}] }. `q` is shown verbatim under the
// directions, so a bare term like "12" reads correctly with its instruction.
//
// NEVER the exit ticket. This page is public and prints answers, and until
// 2026-10-08 it appended `reflect.exitTicket` here — 55 of 84 family pages
// handed out the lesson's own exit-ticket question WITH its answer before the
// student had taken it. `familyCheck` is an authored PARALLEL item (same skill,
// different numbers and context). A lesson without one gets no check item at
// all; there is deliberately no fallback. `validate:family-exit-ticket` pins it.
function practiceProblems(cfg, n = 3) {
  const out = [];
  let directions = "";
  const onLevel = Array.isArray(cfg.practice?.onLevel) ? cfg.practice.onLevel : [];
  for (const block of onLevel) {
    if (block?.type === "matching-game" && Array.isArray(block.pairs)) {
      if (!directions && block.label) directions = block.label;
      for (const p of block.pairs) {
        if (p.term && p.match != null) out.push({ q: String(p.term), a: String(p.match) });
      }
    }
  }
  const fc = cfg.familyCheck;
  if (fc?.stem && Array.isArray(fc.choices) && fc.choices[fc.correctIndex] != null) {
    // familyCheck stems are full questions, so they don't need the directions line.
    out.push({
      q: fc.stem,
      a: String(fc.choices[fc.correctIndex]),
      choices: fc.choices.map(String),
      standalone: true,
    });
  }
  const seen = new Set();
  const picked = [];
  for (const item of out) {
    const k = item.q.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    picked.push(item);
    if (picked.length >= n) break;
  }
  return { directions, problems: picked };
}

function workedExampleLines(cfg) {
  const ci = cfg.launch?.conceptIntro;
  if (ci?.iDo?.lines?.length) return ci.iDo.lines;
  if (ci?.intro) return [ci.intro];
  return [];
}

function vocab(cfg) {
  return withPlainDefinitions(
    Array.isArray(cfg.vocabulary) ? cfg.vocabulary.filter((v) => v.term) : [],
    cfg.id || cfg.lessonId,
  );
}

/**
 * The lesson's own "Family Activity Corner" (mission, question, watch-out),
 * authored per lesson in data/family-homework-notes/<id>.json. 43 of 84 lessons
 * have one; the rest return null and the page shows no mission block rather than
 * a generic one.
 */
function familyCorner(id) {
  const file = join(notesDir, `${id}.json`);
  if (!existsSync(file)) return null;
  const corner = JSON.parse(readFileSync(file, "utf8")).corner;
  if (!corner?.mission?.en || !corner.mission.es) return null;
  return corner;
}

/* ---------- the lesson's own interactive tool, for families ---------- */

/**
 * The interactive models a lesson declares, in the order a family should meet
 * them. Same priority the homework generator uses (scripts/generate-homework-html.mjs):
 * practice is the most actionable, then explore/connect, then the launch visual —
 * so a family opening this page gets the same tool the student used in class.
 */
function lessonModelCandidates(cfg) {
  const out = [];
  const add = (value) => {
    if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === "object" && typeof value.kind === "string") out.push(value);
  };
  add(cfg.practice?.diagram);
  add(cfg.explore?.diagram);
  add(cfg.connect?.diagram);
  add(cfg.launch?.visual);
  return out;
}

/**
 * Build the mount host for the first candidate that is a REGISTERED interactive
 * kind. `interactiveVisualHost` returns "" for static/unknown kinds, so an
 * unregistered diagram falls through instead of rendering an empty box.
 * Returns null when the lesson has no interactive model at all.
 */
function selectFamilyModel(cfg) {
  for (const candidate of lessonModelCandidates(cfg)) {
    const html = interactiveVisualHost(candidate, {
      ariaLabel: `Interactive ${candidate.title || cfg.title || "lesson model"}`,
      fallback: "Turn on JavaScript to use this tool. The steps above work on paper too.",
    });
    if (html) return { kind: candidate.kind, title: candidate.title || "", html };
  }
  return null;
}

/**
 * Family-facing name and coaching line per tool kind. A parent needs to know
 * what the thing in front of them IS before they will touch it, so every
 * registered kind that reaches a family page gets a plain-language label.
 * Unlisted kinds fall back to a generic line rather than being hidden.
 */
const FAMILY_TOOL_COPY = {
  "long-division-builder": {
    name: "Long Division Calculator",
    nameEs: "Calculadora de división larga",
    blurb:
      "Type any division problem and work it one step at a time. It checks each step and says what to fix.",
    blurbEs:
      "Escriba cualquier problema de división y resuélvalo paso a paso. Revisa cada paso y le dice qué corregir.",
  },
};

const FAMILY_TOOL_FALLBACK = {
  name: "Interactive Lesson Model",
  nameEs: "Modelo interactivo de la lección",
  blurb:
    "This is the exact same interactive tool your student used in class today. Change the numbers and watch what happens!",
  blurbEs:
    "Esta es la misma herramienta interactiva que su estudiante usó en clase hoy. ¡Cambie los números y observe qué sucede!",
};

/**
 * The "Try the tool together" section. Rendered only when the lesson declares a
 * registered interactive model. `data-lesson-model-host` is the hook the shared
 * mount module (/assets/homework-lesson-models.js) looks for — the same one the
 * homework pages use, so there is one mounting path, not two.
 */
function familyToolSection(model) {
  if (!model) return "";
  const copy = FAMILY_TOOL_COPY[model.kind] || FAMILY_TOOL_FALLBACK;
  return `
<section class="section-tool tool-section">
  <h2>Play with today's math <span class="es">Jueguen con las matemáticas</span></h2>
  <p><strong>${esc(copy.name)}</strong> — ${esc(copy.blurb)}</p>
  <p class="es-text">${esc(copy.nameEs)} — ${esc(copy.blurbEs)}</p>
  <div class="tool-host" data-lesson-model-host>${model.html}</div>
  <p class="muted-note">Works on a phone, a tablet, or a computer. Nothing to install, nothing to sign in to.</p>
</section>`;
}

/* ---------- shared page chrome ---------- */

const PALETTE = `
:root{--navy:#12355b;--teal:#1fa6a2;--teal-light:#dff2ee;--amber:#f2c15b;
  --amber-light:#fef0d8;--cream:#f7f4ec;--ink:#21313f;--muted:#5f6f80;--line:#d7e2ed;}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.6;font-size:20px;}
.wrap{max-width:760px;margin:0 auto;padding:24px 18px 64px;}
a{color:var(--navy);}
.eyebrow{color:var(--teal-ink);font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  font-size:15px;margin:0;}
h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);margin:6px 0 4px;font-size:32px;line-height:1.2;}
.sub{color:var(--muted);margin:0 0 18px;font-size:18px;}
.crumbs{font-size:16px;margin:0 0 16px;}
.crumbs a{color:var(--teal-ink);text-decoration:none;font-weight:600;}
.crumbs a:hover{text-decoration:underline;}
section{background:transparent;border:none;border-bottom:1px solid var(--line);border-radius:0;padding:24px 0;margin:0;}
section:last-of-type{border-bottom:none;}
section h2{color:var(--navy);font-size:24px;margin:0 0 12px;}
section h2 .es{color:var(--muted);font-size:16px;font-weight:600;}
ul,ol{margin:0;padding-left:22px;}
li{margin:0 0 6px;}
.kw{font-weight:700;color:var(--navy);}
.es-text{color:var(--muted);font-style:italic;}
.callout{background:var(--amber-light);border:1px solid var(--amber);border-radius:10px;padding:12px 14px;}
.answer{background:var(--teal-light);border:1px solid var(--teal);border-radius:10px;padding:6px 12px;
  display:inline-block;font-weight:700;color:var(--navy);margin-top:4px;}
.frame{background:var(--teal-light);border:1px dashed var(--teal);border-radius:8px;padding:8px 12px;margin:0 0 6px;}
.std{display:inline-block;background:var(--teal-light);color:var(--teal-ink);border:1px solid var(--teal-ink);
  border-radius:999px;font-size:12px;font-weight:700;padding:2px 10px;margin-left:6px;vertical-align:middle;}
footer{color:var(--muted);font-size:13px;text-align:center;margin-top:24px;}
.tool-section{border-color:var(--teal);}
.tool-host{margin:12px 0 6px;}
.tool-host .interactive-visual{margin:0 !important;}
.interactive-visual-fallback{background:var(--amber-light);border:1px solid var(--amber);border-radius:10px;padding:12px 14px;}
.muted-note{color:var(--muted);font-size:14px;margin:6px 0 0;}
@media print{.crumbs,footer{display:none;}body{background:#fff;}section{break-inside:avoid;border-color:#bbb;}
  .tool-section{display:none;}}
`;

// Family-page-only rules. Kept out of PALETTE so the teacher-notes and student-help
// pages do not churn for styles they never use. The tokens (paper, ink, unit hue)
// come from assets/family-paper.css, the one source for every family surface.
// Guide-only rules: the letter layout (text column + right-margin note), glossary,
// answer choices and welcome note. The shared look is scripts/lib/family-paper-css.mjs.
const FAMILY_CSS = `
main { display: grid; grid-template-columns: minmax(0, 1fr); column-gap: 40px; }
main > * { min-width: 0; }
main > * { grid-column: 1; }

.more-practice { margin: 20px 0 0; font-weight: 600; }
.glossary { margin: 0; }
.gloss-item { padding: 14px 0; border-bottom: 1px solid var(--fp-rule); }
.gloss-item:last-child { border-bottom: 0; }
.gloss-item dt { font-size: 21px; }
.gloss-item .gloss-es { color: var(--fp-muted); font-weight: 600; }
.gloss-item .gloss-es::before { content: "· "; }
.gloss-item dd { margin: 4px 0 0; font-size: 18px; }
.gloss-item dd.es-text { font-size: 17px; margin-top: 8px; }
.frame { background: var(--fp-wash); border: 0; border-bottom: 1px solid var(--fp-rule); border-radius: 0; padding: 12px 14px; margin: 0; font-family: var(--fp-serif); color: var(--fp-ink); }

ol.choices { margin: 16px 0 8px; list-style: none; padding-left: 0; }
ol.choices li { background: var(--fp-page); border: 1px solid var(--fp-rule); border-radius: 10px; padding: 14px 18px; margin-bottom: 10px; font-weight: 600; font-size: 19px; color: var(--fp-ink); }

.welcome-note { background: var(--fp-unit-tint); border: 0; border-radius: 10px; padding: 20px 24px; }
.welcome-note strong { display: block; font-family: var(--fp-serif); font-size: 24px; color: var(--fp-ink); margin-bottom: 6px; }
.welcome-note p { margin: 0; color: var(--fp-ink); font-size: 19px; line-height: 1.5; }

/* Wide screens: the "if they get stuck" note moves to the right margin, like a family letter. */
@media (min-width: 980px) {
  main { grid-template-columns: minmax(0, 1fr) 280px; }
  main > .hero-header { grid-column: 1 / -1; }
  main > .section-stuck { grid-column: 2; grid-row: 2 / span 7; align-self: start; position: sticky; top: 16px; border-bottom: 0; padding-top: 32px; }
  main > .section-stuck h2 { font-size: 20px; }
  main > .section-stuck .callout { font-size: 17px; padding: 16px 18px; }
}
`;

function page({ title, kind, head, body, id, scripts = "" }) {
  return `<!doctype html>
<html lang="en"${kind === "family" ? ` data-unit="${Number.parseInt(id, 10)}"` : ""}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)}</title>
<!-- generated:support-page kind=${kind} lesson=${id} — regenerate: npm run generate-support-pages -->
${kind === "family" ? `<link rel="stylesheet" href="/assets/fonts/fraunces-hanken-grotesk-e8a3b5.css" />\n` : ""}<style>${PALETTE}${kind === "family" ? FAMILY_PAPER + FAMILY_LETTER_CSS + FAMILY_CSS : ""}</style>
</head>
<body>
<div class="wrap">
${kind === "family" ? "" : `<nav class="crumbs"><a href="/curriculum/">← Curriculum Hub</a> · <a href="/lessons/${esc(id)}/">Open Lesson ${esc(id)}</a></nav>\n`}<main id="main">
${head}
${body}
</main>
<footer>Neft Teacher · Grade 6 Math · auto-generated from the lesson plan — a teacher may edit and lock this page.</footer>
</div>
${scripts}
</body>
</html>`;
}

/* ---------- builders ---------- */

/**
 * ONE bilingual glossary: each word once, with its Spanish and a plain meaning
 * in both languages. The page used to list the same words three times (key
 * words, "Vocabulary you might hear", "Spanish support").
 */
function glossary(v) {
  if (!v.length) return "";
  return `<dl class="glossary" data-glossary>${v
    .map(
      (w) =>
        `<div class="gloss-item"><dt><span class="kw">${esc(w.term)}</span>${
          w.termEs ? ` <span class="gloss-es" lang="es">${esc(w.termEs)}</span>` : ""
        }</dt><dd>${esc(w.definition || "")}</dd>${
          w.definitionEs ? `<dd class="es-text" lang="es">${esc(w.definitionEs)}</dd>` : ""
        }</div>`,
    )
    .join("")}</dl>`;
}

/** The lesson's own mission and conversation question, in both languages. */
function missionSection(corner) {
  if (!corner) return "";
  const pair = (p) => `<p>${esc(p.en)}</p><p class="es-text" lang="es">${esc(p.es)}</p>`;
  return `
<section class="section-mission" data-mission>
  <h2>Try at home <span class="es">Para hacer en casa</span></h2>
  <div class="callout">${pair(corner.mission)}</div>
  ${
    corner.question?.en && corner.question.es
      ? `<p><strong>Talk about it:</strong></p>${pair(corner.question)}`
      : ""
  }
</section>`;
}

/** A lesson with an authored word-problem set links to it from its family guide. */
function wordProblemsLink(id) {
  const file = join(DATA_DIR, "family-word-problems", `${id}.json`);
  if (!existsSync(file)) return "";
  const { title } = JSON.parse(readFileSync(file, "utf8"));
  return `<p class="more-practice"><a href="/lessons/${esc(id)}/family/word-problems/">More practice: ${esc(title.en)}</a> <span class="es-text" lang="es"><a href="/lessons/${esc(id)}/family/word-problems/">Más práctica: ${esc(title.es)}</a></span></p>`;
}

function familyPage(id, cfg, unit, lesson) {
  const problems0 = familyFieldProblems(cfg);
  if (problems0.length)
    throw new Error(`lessons/${id}/config.json family fields:\n  - ${problems0.join("\n  - ")}`);
  const v = vocab(cfg);
  const model = selectFamilyModel(cfg);
  const corner = familyCorner(id);
  const example = workedExampleLines(cfg);
  const { directions, problems } = practiceProblems(cfg, 1);
  const stdBadge = cfg.standard ? `<span class="std">Standard ${esc(cfg.standard)}</span>` : "";

  // \`familyKeyIdea\` is the plain-language (grade-4 reading level) version a
  // family can use; the teacher key idea is the fallback, never the other way.
  const keyIdea =
    cfg.familyKeyIdea ||
    cfg.launch?.conceptIntro?.keyIdea ||
    "Ask your student what the main idea was today!";
  const keyIdeaEs = cfg.familyKeyIdea ? cfg.familyKeyIdeaEs || "" : "";

  const exampleHtml = example.length
    ? `<div class="callout"><ol>${example.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></div>`
    : `<p>Open the guided notes for a worked example.</p>`;

  const dirLine = directions ? `<p><strong>${esc(directions)}</strong></p>` : "";
  const choiceList = (p) =>
    p.choices?.length
      ? `<ol class="choices">${p.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>`
      : "";
  const practiceHtml = problems.length
    ? `<div class="callout callout--work">
         ${dirLine}
         <p class="problem">${esc(problems[0].q)}</p>
         ${choiceList(problems[0])}
         <details>
           <summary>Check the answer</summary>
           <p>The answer is: <strong class="answer">${esc(problems[0].a)}</strong></p>
         </details>
       </div>`
    : `<p>Use the homework for practice problems.</p>`;

  // The watch-out is the lesson's own corner tip (English + Spanish) when it has
  // one, else the config's common mistake (English).
  const watchOut = corner?.watchOut?.en
    ? `${esc(corner.watchOut.en)}${corner.watchOut.es ? `<br><span class="es-text" lang="es">Atención: ${esc(corner.watchOut.es)}</span>` : ""}`
    : esc(cfg.practice?.commonMistake || "Slow down and re-read the question before solving.");

  const head = `
<div class="hero-header">
  <p class="eyebrow">Family Math Studio · Lesson guide <span class="es">Guía de la lección</span></p>
  <h1>Unit ${unit}, Lesson ${lesson}: ${esc(cfg.title || id)}</h1>
  ${stdBadge}
</div>`;

  const body = `
<section class="section-learning">
  <h2>What students are learning <span class="es">Qué aprenden</span></h2>
  <p class="callout callout--key"><strong>Key idea:</strong> ${esc(keyIdea)}${keyIdeaEs ? `<span class="es-text" lang="es">Idea clave: ${esc(keyIdeaEs)}</span>` : ""}</p>
</section>
${missionSection(corner)}
${familyToolSection(model)}
<section class="section-vocab">
  <h2>Words to know <span class="es">Palabras clave</span></h2>
  ${glossary(v) || `<p>See the lesson page for key words.</p>`}
</section>
<section class="section-example">
  <h2>How we did it in class today <span class="es">Cómo lo hicimos hoy en clase</span></h2>
  ${exampleHtml}
</section>
<section class="section-practice">
  <h2>Try this together <span class="es">Inténtenlo juntos</span></h2>
  <p class="sub" style="margin-top:-6px;">Pick one question to talk about. You don't need to do them all!</p>
  ${practiceHtml}
  ${wordProblemsLink(id)}
</section>
<section class="section-stuck">
  <h2>If they get stuck... <span class="es">Si se traban...</span></h2>
  <div class="callout callout--note">
    <p style="margin-top:0;"><strong>Watch out for this:</strong> ${watchOut}</p>
    <p style="margin-bottom:0;"><strong>Try asking:</strong> "Can you show me how you got that? Did we miss a step?"<br><span class="es-text" lang="es">Pregunte: «¿Puedes mostrarme cómo lo hiciste? ¿Nos saltamos algún paso?» Hablar de las matemáticas en voz alta ayuda mucho.</span></p>
  </div>
</section>
<section class="section-frames">
  <h2>Sentence starters <span class="es">Frases para empezar</span></h2>
  ${SENTENCE_FRAMES.map((f) => `<p class="frame">${esc(f)}</p>`).join("")}
</section>`;

  return page({
    title: `Family Math Studio · Lesson guide — Unit ${unit} Lesson ${lesson}: ${cfg.title || id}`,
    kind: "family",
    head,
    body,
    id,
    // Only ship the mount module on pages that actually have a tool to mount.
    scripts: model ? `<script type="module" src="/assets/homework-lesson-models.js"></script>` : "",
  });
}

function teacherNotesPage(id, cfg, unit, lesson) {
  const v = vocab(cfg);
  const et = cfg.reflect?.exitTicket;
  const ci = cfg.launch?.conceptIntro;
  const stdBadge = cfg.standard ? `<span class="std">${esc(cfg.standard)}</span>` : "";

  const extension =
    cfg.connect?.scenario ||
    (Array.isArray(cfg.practice?.extending)
      ? "See the 'extending' practice tier in the lesson."
      : "");

  const exitHtml = et?.stem
    ? `<p>${esc(et.stem)}</p>${
        Array.isArray(et.choices)
          ? `<ul>${et.choices
              .map(
                (c, i) =>
                  `<li>${esc(c)}${i === et.correctIndex ? ' <span class="answer">✓ correct</span>' : ""}</li>`,
              )
              .join("")}</ul>`
          : ""
      }${et.explanation ? `<p class="es-text">${esc(et.explanation)}</p>` : ""}`
    : `<p>Use a quick 1-question check on the lesson objective.</p>`;

  const head = `<p class="eyebrow">Teacher Notes · One-Page Prep</p>
<h1>Unit ${unit}, Lesson ${lesson}: ${esc(cfg.title || id)}${stdBadge}</h1>
<p class="sub">Everything you need to teach this tomorrow. ${esc(cfg.timeEstimate || "~45 min")}.</p>`;

  const body = `
<section>
  <h2>Objectives</h2>
  <p><strong>Content:</strong> ${esc(cfg.contentObjective || "")}</p>
  <p><strong>Language:</strong> ${esc(cfg.languageObjective || "")}</p>
</section>
<section>
  <h2>Before class</h2>
  <ul>
    <li>Print / open: <a href="/lessons/${esc(id)}/notes.html">guided notes</a>, <a href="/lessons/${esc(id)}/homework.html">homework</a>, <a href="/lessons/${esc(id)}/slides.html">slides</a>.</li>
    <li>Have the <a href="/lessons/${esc(id)}/family/">family page</a> link ready for absent students.</li>
    <li>Preview the key vocabulary below before the lesson.</li>
  </ul>
</section>
<section>
  <h2>Warm-up</h2>
  <p>${esc(ci?.weDo?.lines?.[0] || "Quick review of the prior lesson's skill, then preview today's key words.")}</p>
</section>
<section>
  <h2>Teaching notes</h2>
  ${ci?.keyIdea ? `<p class="callout"><strong>Key idea:</strong> ${esc(ci.keyIdea)}</p>` : ""}
  ${ci?.iDo?.lines?.length ? `<p><strong>I do:</strong></p><ol>${ci.iDo.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` : ""}
  ${ci?.youDo?.lines?.length ? `<p><strong>You do:</strong> ${esc(ci.youDo.lines.join(" "))}</p>` : ""}
</section>
<section>
  <h2>Common misconception</h2>
  <p>${esc(cfg.practice?.commonMistake || "Watch for students who memorize steps without understanding the key idea above.")}</p>
</section>
<section>
  <h2>Language &amp; learning supports</h2>
  <ul>
    ${v.length ? `<li>Pre-teach: ${v.map((w) => `<span class="kw">${esc(w.term)}</span>`).join(", ")} (Spanish + visuals are in the lesson vocabulary).</li>` : ""}
    <li>Offer the sentence frames: ${SENTENCE_FRAMES.map((f) => `“${esc(f)}”`).join(" ")}</li>
    <li>Chunk the I-do steps; let students restate each step to a partner before moving on.</li>
    <li>Provide the worked example as a reference while they practice.</li>
  </ul>
</section>
<section>
  <h2>Exit ticket</h2>
  ${exitHtml}
</section>
<section>
  <h2>Reteach</h2>
  <p>Re-run the I-do example with smaller numbers and have students narrate each step using the key idea.</p>
</section>
<section>
  <h2>Extension</h2>
  <p>${esc(extension || "Have early finishers create their own problem and trade with a partner to check.")}</p>
</section>`;

  return page({
    title: `Teacher Notes — Unit ${unit} Lesson ${lesson}: ${cfg.title || id}`,
    kind: "teacher-notes",
    head,
    body,
    id,
  });
}

function studentHelpPage(id, cfg, _unit, lesson) {
  const v = vocab(cfg);
  const steps = workedExampleLines(cfg);
  const check = cfg.familyCheck;
  const stdBadge = cfg.standard ? `<span class="std">${esc(cfg.standard)}</span>` : "";

  const kwList = v.length
    ? `<ul>${v.map((w) => `<li><span class="kw">${esc(w.term)}</span> — ${esc(w.definition || "")}</li>`).join("")}</ul>`
    : `<p>See the lesson for key words.</p>`;

  const tryIt = check?.stem || cfg.launch?.conceptIntro?.youDo?.lines?.[0] || "";
  const tryAns =
    check?.choices?.[check?.correctIndex] ?? (check?.answer != null ? check.answer : null);
  const tryExpl = check?.explanation || "";

  const head = `<p class="eyebrow">Student Help Card</p>
<h1>Lesson ${lesson}: ${esc(cfg.title || id)}${stdBadge}</h1>
<p class="sub">Stuck? Start here. Read the steps, try the problem, then check your answer.</p>`;

  const body = `
<section>
  <h2>I can…</h2>
  <p class="callout">${esc(cfg.contentObjective || "")}</p>
</section>
<section>
  <h2>Key words</h2>
  ${kwList}
</section>
<section>
  <h2>Steps</h2>
  ${steps.length ? `<ol>${steps.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>` : `<p>Open the guided notes for the steps.</p>`}
</section>
${
  tryIt
    ? `<section>
  <h2>Try it</h2>
  <p>${esc(tryIt)}</p>
</section>
<section>
  <h2>Check your answer</h2>
  ${tryAns != null ? `<p><span class="answer">${esc(tryAns)}</span></p>` : "<p>Check with your guided notes.</p>"}
  ${tryExpl ? `<p class="es-text">${esc(tryExpl)}</p>` : ""}
</section>`
    : ""
}
<section>
  <h2>Sentence starter</h2>
  <p class="frame">${esc(SENTENCE_FRAMES[0])}</p>
  ${cfg.languageObjective ? `<p class="es-text">Goal: ${esc(cfg.languageObjective)}</p>` : ""}
</section>`;

  return page({
    title: `Student Help — Lesson ${lesson}: ${cfg.title || id}`,
    kind: "student-help",
    head,
    body,
    id,
  });
}

/* ---------- write ---------- */

const BUILDERS = [
  { sub: "family", build: familyPage },
  { sub: "teacher-notes", build: teacherNotesPage },
  { sub: "student-help", build: studentHelpPage },
];

function writeIfSafe(absFile, html, stat) {
  if (existsSync(absFile)) {
    const cur = readFileSync(absFile, "utf8");
    if (cur.includes("<!-- hand-edited -->")) {
      stat.locked++;
      return;
    }
    if (cur === html) {
      stat.unchanged++;
      return;
    }
    stat.updated++;
  } else {
    stat.created++;
  }
  if (!DRY) {
    mkdirSync(dirname(absFile), { recursive: true });
    // Preserve any injected layers already on the page — see scripts/lib/preserve-injected.mjs.
    writeGenerated(absFile, html);
  }
}

function main() {
  const ids = readdirSync(lessonsDir)
    .filter((d) => LESSON_DIR_RE.test(d))
    .filter((d) => existsSync(join(lessonsDir, d, "config.json")))
    .filter((d) => !onlyIds.length || onlyIds.includes(d))
    .sort();

  const stat = { created: 0, updated: 0, unchanged: 0, locked: 0 };
  for (const id of ids) {
    const cfg = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
    const m = id.match(LESSON_DIR_RE);
    const unit = cfg.unit ?? Number(m[1]);
    const lesson = cfg.lesson ?? Number(m[2]);
    for (const { sub, build } of BUILDERS) {
      const html = build(id, cfg, unit, lesson);
      writeIfSafe(join(lessonsDir, id, sub, "index.html"), html, stat);
    }
  }

  console.log(
    `${DRY ? "[dry] " : ""}Support pages for ${ids.length} lessons — created ${stat.created}, updated ${stat.updated}, unchanged ${stat.unchanged}, locked ${stat.locked}`,
  );
}

main();
