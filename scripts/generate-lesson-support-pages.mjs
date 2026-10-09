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
import { FAMILY_LANGUAGES, familyFieldProblems } from "./lib/family-content.mjs";
import { writeGenerated } from "./lib/preserve-injected.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

import { LESSONS_DIR as lessonsDir } from "../tools/lib/curriculum-source.mjs";

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
  return Array.isArray(cfg.vocabulary) ? cfg.vocabulary.filter((v) => v.term) : [];
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
  <h2>Play with today's math <span class="es">· Jueguen con las matemáticas</span></h2>
  <p><strong>${esc(copy.name)}</strong> — ${esc(copy.blurb)}</p>
  <p class="es-text">${esc(copy.nameEs)} — ${esc(copy.blurbEs)}</p>
  <div class="tool-host" data-lesson-model-host>${model.html}</div>
  <p class="muted-note">Works on a phone, a tablet, or a computer. Nothing to install, nothing to sign in to.</p>
</section>`;
}

/* ---------- the family language picker ---------- */

/**
 * "Read this in your language": the key idea and key words in English, Spanish
 * and the three machine-translated languages from `familyLanguages`. Pure HTML +
 * CSS (radio inputs drive which panel shows), so it works with scripts off and on
 * every device a family has. The machine-translated panels say so — in their own
 * language AND in English, so the teacher reading over a shoulder knows too.
 * Arabic and Dari panels are right-to-left; English terms inside them are
 * isolated with <bdi> so a term like "Ratio table" keeps its own direction.
 */
function familyLanguagesSection(cfg, vocabList) {
  const fl = cfg.familyLanguages;
  if (!fl) return "";
  const keyIdeaEn = cfg.familyKeyIdea || cfg.launch?.conceptIntro?.keyIdea || "";
  const keyIdeaEs = cfg.familyKeyIdeaEs || cfg.launch?.conceptIntro?.keyIdeaEs || "";
  const panelBody = (code) => {
    if (code === "en")
      return {
        keyIdea: keyIdeaEn,
        words: vocabList.map((w) => ({ t: w.term, d: w.definition || "" })),
      };
    if (code === "es")
      return {
        keyIdea: keyIdeaEs,
        words: vocabList
          .filter((w) => w.termEs || w.definitionEs)
          .map((w) => ({ t: w.termEs || w.term, d: w.definitionEs || "" })),
      };
    const entry = fl[code];
    return {
      keyIdea: entry.keyIdea,
      words: entry.vocabulary.map((w) => ({ t: w.translation, d: w.definition, en: w.term })),
    };
  };
  const radios = FAMILY_LANGUAGES.map(
    (l, i) =>
      `<input type="radio" class="lang-radio" name="family-lang" id="family-lang-${l.code}" value="${l.code}"${i === 0 ? " checked" : ""}><label for="family-lang-${l.code}" lang="${l.code}">${esc(l.name)}</label>`,
  ).join("");
  const panels = FAMILY_LANGUAGES.map((l) => {
    const { keyIdea, words } = panelBody(l.code);
    const dir = l.rtl ? ' dir="rtl"' : "";
    const auto = l.machine
      ? `<p class="auto-label">${esc(l.autoLabel)} · <span lang="en" dir="ltr">Automatic translation</span></p>`
      : "";
    const list = words.length
      ? `<ul>${words
          .map(
            (w) =>
              `<li><span class="kw"><bdi>${esc(w.t)}</bdi></span>${w.en ? ` (<bdi lang="en">${esc(w.en)}</bdi>)` : ""} — ${esc(w.d)}</li>`,
          )
          .join("")}</ul>`
      : "";
    return `<div class="lang-panel" data-lang="${l.code}" lang="${l.code}"${dir}>${auto}${
      keyIdea ? `<p class="callout">${esc(keyIdea)}</p>` : ""
    }${list}</div>`;
  }).join("\n  ");
  return `
<section class="lang-section">
  <h2>Read this in your language <span class="es">· Lea esto en su idioma</span></h2>
  <div class="lang-picker">${radios}
  <div class="lang-panels">
  ${panels}
  </div>
  </div>
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

// Family-page-only rules (choice lists, language picker). Kept out of PALETTE so
// the teacher-notes and student-help pages do not churn for styles they never use.
const FAMILY_CSS = `
body { background: #f1f5f9; font-family: "Outfit", system-ui, sans-serif; }
.wrap { max-width: 800px; padding: 0 0 64px 0; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,0.06); border-radius: 0 0 32px 32px; overflow: hidden; margin: 0 auto; }

/* The new Hero header */
.hero-header { background: linear-gradient(135deg, var(--navy), #1a4f8a); padding: 56px 32px; color: #fff; text-align: center; }
.hero-header .eyebrow { color: var(--teal-light); font-size: 16px; margin-bottom: 12px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; }
.hero-header h1 { color: #fff; font-size: 44px; margin: 0; line-height: 1.1; font-weight: 800; }
.hero-header .std { display: inline-block; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; margin-top:16px; border-radius: 999px; padding: 4px 12px; font-size: 14px; font-weight: 700; }

/* Upgrade sections to look like cards */
section { padding: 40px 32px; border: none; margin: 0; border-bottom: 1px solid #edf1f5; }
section h2 { font-size: 30px; font-weight: 800; color: var(--navy); display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
section h2::before { content: "✨"; font-size: 28px; }

/* Specific icons for sections */
.section-learning h2::before { content: "💡"; }
.section-kitchen h2::before { content: "🍕"; }
.section-tool h2::before { content: "🕹️"; }
.section-vocab h2::before { content: "💬"; }
.section-example h2::before { content: "🏫"; }
.section-practice h2::before { content: "✏️"; }
.section-stuck h2::before { content: "🆘"; }

ol.choices{margin:16px 0 8px;list-style:none;padding-left:0;}
ol.choices li{background: #f8fafc; border:2px solid #e2e8f0;border-radius:16px;padding:16px 20px;margin-bottom:12px;font-weight:600; font-size: 20px; cursor: pointer; transition: all 0.2s; color: var(--navy); }
ol.choices li:hover { border-color: var(--teal); background: var(--teal-light); }

.welcome-note{background:var(--teal-light);border:none;border-radius:20px;padding:24px 32px;margin-bottom:0; text-align: left; }
.welcome-note strong{display:block;font-size:26px;font-weight: 800; color:var(--navy);margin-bottom:8px;}
.welcome-note p{margin:0;color:var(--navy);font-size:20px; line-height: 1.5; }

.callout { border: none; border-radius: 20px; padding: 24px 32px; background: #f8fafc; font-size: 22px; line-height: 1.5; }

.lang-radio{position:absolute;opacity:0;width:1px;height:1px;}
.lang-radio + label{display:inline-block;border:2px solid #e2e8f0;border-radius:999px;padding:8px 24px;
  margin:0 12px 16px 0;cursor:pointer;font-weight:700;color:var(--navy);background:#fff; font-size: 18px; transition: all 0.2s;}
.lang-radio:checked + label{background:var(--navy);color:#fff;border-color:var(--navy);}
.lang-radio:focus-visible + label{outline:3px solid var(--amber);outline-offset:2px;}
.lang-panel{display:none;margin-top:6px;}
#family-lang-en:checked ~ .lang-panels [data-lang="en"],
#family-lang-es:checked ~ .lang-panels [data-lang="es"],
#family-lang-ar:checked ~ .lang-panels [data-lang="ar"],
#family-lang-fr:checked ~ .lang-panels [data-lang="fr"],
#family-lang-prs:checked ~ .lang-panels [data-lang="prs"]{display:block;}
.lang-panel[dir="rtl"] ul{padding-left:0;padding-right:22px;}
.auto-label{display:inline-block;background:var(--amber-light);border:1px solid var(--amber);border-radius:999px;
  padding:4px 16px;font-size:15px;font-weight:700;color:var(--ink);margin:0 0 12px;}
`;

function page({ title, kind, head, body, id, scripts = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)}</title>
<!-- generated:support-page kind=${kind} lesson=${id} — regenerate: npm run generate-support-pages -->
<style>${PALETTE}${kind === "family" ? FAMILY_CSS : ""}</style>
</head>
<body>
<div class="wrap">
${kind === "family" ? "" : `<nav class="crumbs"><a href="/curriculum/">← Curriculum Hub</a> · <a href="/lessons/${esc(id)}/">Open Lesson ${esc(id)}</a></nav>\n`}${head}
${body}
<footer>Neft Teacher · Grade 6 Math · auto-generated from the lesson plan — a teacher may edit and lock this page.</footer>
</div>
${scripts}
</body>
</html>`;
}

/* ---------- builders ---------- */

function familyPage(id, cfg, unit, lesson) {
  const problems0 = familyFieldProblems(cfg);
  if (problems0.length)
    throw new Error(`lessons/${id}/config.json family fields:\n  - ${problems0.join("\n  - ")}`);
  const v = vocab(cfg);
  const model = selectFamilyModel(cfg);
  const example = workedExampleLines(cfg);
  const { directions, problems } = practiceProblems(cfg, 1);
  const stdBadge = cfg.standard ? `<span class="std">${esc(cfg.standard)}</span>` : "";

  // Remove the complex 'learning' objective and only use the simple key idea.
  // \`familyKeyIdea\` is the plain-language (grade-4 reading level) version a
  // family can use; the teacher key idea is the fallback, never the other way.
  const keyIdea =
    cfg.familyKeyIdea ||
    cfg.launch?.conceptIntro?.keyIdea ||
    "Ask your student what the main idea was today!";
  const keyIdeaEs = cfg.familyKeyIdea ? cfg.familyKeyIdeaEs || "" : "";

  const kwList = v.length
    ? `<ul>${v
        .map(
          (w) =>
            `<li><span class="kw">${esc(w.term)}</span> — ${esc(w.definition || "")}${
              w.definitionEs
                ? `<br><span class="es-text">Español: ${esc(w.termEs || w.term)} — ${esc(w.definitionEs)}</span>`
                : ""
            }</li>`,
        )
        .join("")}</ul>`
    : `<p>See the lesson page for key words.</p>`;

  const exampleHtml = example.length
    ? `<div class="callout" style="background:#fff;border-color:var(--line);"><ol>${example.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></div>`
    : `<p>Open the guided notes for a worked example.</p>`;

  const dirLine = directions ? `<p><strong>${esc(directions)}</strong></p>` : "";
  const choiceList = (p) =>
    p.choices?.length
      ? `<ol class="choices">${p.choices.map((c) => `<li>${esc(c)}</li>`).join("")}</ol>`
      : "";
  const practiceHtml = problems.length
    ? `<div class="callout" style="background:var(--cream);border-color:var(--line); padding-bottom:16px;">
         ${dirLine}
         <p style="font-size:22px;color:var(--navy);margin:12px 0;">${esc(problems[0].q)}</p>
         ${choiceList(problems[0])}
         <details style="margin-top: 20px; font-size: 18px;">
           <summary style="cursor: pointer; color: var(--teal); font-weight: 600;">Check the answer</summary>
           <p style="margin-top: 12px; margin-bottom:0;">The answer is: <strong class="answer" style="font-size:20px;">${esc(problems[0].a)}</strong></p>
         </details>
       </div>`
    : `<p>Use the homework for practice problems.</p>`;

  const esWords = v
    .filter((w) => w.termEs || w.definitionEs)
    .map((w) => `${esc(w.termEs || w.term)} — ${esc(w.definitionEs || w.definition || "")}`);

  const head = `
<div class="hero-header">
  <p class="eyebrow">Family Lesson Support</p>
  <h1>Unit ${unit}, Lesson ${lesson}: ${esc(cfg.title || id)}</h1>
  ${stdBadge}
</div>`;

  const body = `
<section class="section-learning">
  <h2>What students are learning</h2>
  <p class="callout" style="font-size:22px;"><strong>Key idea:</strong> ${esc(keyIdea)}${keyIdeaEs ? `<br><span class="es-text" lang="es" style="font-size:18px;">Idea clave: ${esc(keyIdeaEs)}</span>` : ""}</p>
</section>
${familyLanguagesSection(cfg, v)}
<section class="section-kitchen">
  <h2>Kitchen Table Math</h2>
  <div class="welcome-note" style="background:var(--yellow-light); border-left-color:var(--yellow); margin-bottom: 0;">
    <strong>Math is everywhere!</strong>
    <p>Try exploring this topic while you are cooking, shopping, or driving. Ask your student to be the teacher and explain it to you in their own words.</p>
  </div>
</section>
${familyToolSection(model)}
<section class="section-vocab">
  <h2>Vocabulary you might hear</h2>
  ${kwList}
</section>
<section class="section-example">
  <h2>How we did it in class today</h2>
  ${exampleHtml}
</section>
<section class="section-practice">
  <h2>Try this together</h2>
  <p class="sub" style="margin-top:-6px;">Pick one question to talk about. You don't need to do them all!</p>
  ${practiceHtml}
</section>
<section class="section-stuck">
  <h2>If they get stuck...</h2>
  <div class="callout" style="border-left: 6px solid #ff9800; background: #fff8e1;">
    <p style="margin-top:0;"><strong>Watch out for this:</strong> ${esc(cfg.practice?.commonMistake || "Slow down and re-read the question before solving.")}</p>
    <p style="margin-bottom:0;"><strong>Try asking:</strong> "Can you show me how you got that? Did we miss a step?"</p>
  </div>
</section>
<section>
  <h2>Spanish support <span class="es">· Apoyo en español</span></h2>
  ${
    esWords.length
      ? `<p>Palabras clave de esta lección:</p><ul>${esWords.map((w) => `<li>${w}</li>`).join("")}</ul>`
      : ""
  }
  <p class="es-text">En casa: pida a su estudiante que le explique el ejemplo y por qué funciona cada paso. Hablar de las matemáticas en voz alta ayuda mucho.</p>
</section>
<section>
  <h2>Sentence starters <span class="es">· Frases para empezar</span></h2>
  ${SENTENCE_FRAMES.map((f) => `<p class="frame">${esc(f)}</p>`).join("")}
</section>`;

  return page({
    title: `Family Support — Unit ${unit} Lesson ${lesson}: ${cfg.title || id}`,
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
