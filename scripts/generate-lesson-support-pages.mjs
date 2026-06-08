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

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const lessonsDir = join(root, "lessons");
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
// directions; the `term` is the thing to solve) and the exit ticket.
// Returns { directions, problems:[{q,a}] }. `q` is shown verbatim under the
// directions, so a bare term like "12" reads correctly with its instruction.
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
  const et = cfg.reflect?.exitTicket;
  if (et?.stem && Array.isArray(et.choices) && et.choices[et.correctIndex] != null) {
    // Exit-ticket stems are full questions, so they don't need the directions line.
    out.push({ q: et.stem, a: String(et.choices[et.correctIndex]), standalone: true });
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

/* ---------- shared page chrome ---------- */

const PALETTE = `
:root{--navy:#12355b;--teal:#1fa6a2;--teal-light:#dff2ee;--amber:#f2c15b;
  --amber-light:#fef0d8;--cream:#f7f4ec;--ink:#21313f;--muted:#5f6f80;--line:#d7e2ed;}
*{box-sizing:border-box}
body{margin:0;background:var(--cream);color:var(--ink);
  font-family:Calibri,"Segoe UI",system-ui,sans-serif;line-height:1.6;font-size:17px;}
.wrap{max-width:760px;margin:0 auto;padding:24px 18px 64px;}
a{color:var(--navy);}
.eyebrow{color:var(--teal);font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  font-size:13px;margin:0;}
h1{font-family:Outfit,system-ui,sans-serif;color:var(--navy);margin:6px 0 4px;font-size:27px;line-height:1.2;}
.sub{color:var(--muted);margin:0 0 18px;font-size:15px;}
.crumbs{font-size:14px;margin:0 0 16px;}
.crumbs a{color:var(--teal);text-decoration:none;font-weight:600;}
.crumbs a:hover{text-decoration:underline;}
section{background:#fff;border:1px solid var(--line);border-radius:12px;padding:16px 18px;margin:0 0 14px;}
section h2{color:var(--navy);font-size:19px;margin:0 0 10px;}
section h2 .es{color:var(--muted);font-size:14px;font-weight:600;}
ul,ol{margin:0;padding-left:22px;}
li{margin:0 0 6px;}
.kw{font-weight:700;color:var(--navy);}
.es-text{color:var(--muted);font-style:italic;}
.callout{background:var(--amber-light);border:1px solid var(--amber);border-radius:10px;padding:12px 14px;}
.answer{background:var(--teal-light);border:1px solid var(--teal);border-radius:10px;padding:6px 12px;
  display:inline-block;font-weight:700;color:var(--navy);margin-top:4px;}
.frame{background:var(--teal-light);border:1px dashed var(--teal);border-radius:8px;padding:8px 12px;margin:0 0 6px;}
.std{display:inline-block;background:var(--teal-light);color:var(--teal);border:1px solid var(--teal);
  border-radius:999px;font-size:12px;font-weight:700;padding:2px 10px;margin-left:6px;vertical-align:middle;}
footer{color:var(--muted);font-size:13px;text-align:center;margin-top:24px;}
@media print{.crumbs,footer{display:none;}body{background:#fff;}section{break-inside:avoid;border-color:#bbb;}}
`;

function page({ title, kind, head, body, id }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>${esc(title)}</title>
<!-- generated:support-page kind=${kind} lesson=${id} — regenerate: npm run generate-support-pages -->
<style>${PALETTE}</style>
</head>
<body>
<div class="wrap">
<nav class="crumbs"><a href="/curriculum/">← Curriculum Hub</a> · <a href="/lessons/${esc(id)}/">Open Lesson ${esc(id)}</a></nav>
${head}
${body}
<footer>Neft Teacher · Grade 6 Math · auto-generated from the lesson plan — a teacher may edit and lock this page.</footer>
</div>
</body>
</html>`;
}

/* ---------- builders ---------- */

function familyPage(id, cfg, unit, lesson) {
  const v = vocab(cfg);
  const example = workedExampleLines(cfg);
  const { directions, problems } = practiceProblems(cfg, 3);
  const stdBadge = cfg.standard ? `<span class="std">${esc(cfg.standard)}</span>` : "";

  const learning = cfg.launch?.conceptIntro?.intro || cfg.contentObjective || "";
  const keyIdea = cfg.launch?.conceptIntro?.keyIdea || "";

  const kwList = v.length
    ? `<ul>${v
        .map(
          (w) =>
            `<li><span class="kw">${esc(w.term)}</span> — ${esc(w.definition || "")}${
              w.definitionEs ? `<br><span class="es-text">Español: ${esc(w.termEs || w.term)} — ${esc(w.definitionEs)}</span>` : ""
            }</li>`,
        )
        .join("")}</ul>`
    : `<p>See the lesson page for key words.</p>`;

  const exampleHtml = example.length
    ? `<ol>${example.map((l) => `<li>${esc(l)}</li>`).join("")}</ol>`
    : `<p>Open the guided notes for a worked example.</p>`;

  const dirLine = directions ? `<p>${esc(directions)}</p>` : "";
  const practiceHtml = problems.length
    ? `${dirLine}<ol>${problems.map((p) => `<li>${esc(p.q)}</li>`).join("")}</ol>`
    : `<p>Use the homework for practice problems.</p>`;

  const answerHtml = problems.length
    ? `<ol>${problems.map((p) => `<li>${esc(p.q)} → <span class="answer">${esc(p.a)}</span></li>`).join("")}</ol>`
    : `<p>Answers are in the guided notes.</p>`;

  const esWords = v
    .filter((w) => w.termEs || w.definitionEs)
    .map((w) => `${esc(w.termEs || w.term)} — ${esc(w.definitionEs || w.definition || "")}`);

  const head = `<p class="eyebrow">Family Lesson Support</p>
<h1>Unit ${unit}, Lesson ${lesson}: ${esc(cfg.title || id)}${stdBadge}</h1>
<p class="sub">A quick guide for families and for any student who missed class.</p>`;

  const body = `
<section>
  <h2>What students are learning</h2>
  <p>${esc(learning)}</p>
  ${keyIdea ? `<p class="callout"><strong>Key idea:</strong> ${esc(keyIdea)}</p>` : ""}
</section>
<section>
  <h2>Key words</h2>
  ${kwList}
</section>
<section>
  <h2>Example</h2>
  ${exampleHtml}
</section>
<section>
  <h2>Practice at home</h2>
  ${practiceHtml}
</section>
<section>
  <h2>Answer check</h2>
  ${answerHtml}
</section>
<section>
  <h2>Common mistake</h2>
  <p>${esc(cfg.practice?.commonMistake || "Slow down and re-read the question before solving.")}</p>
</section>
<section>
  <h2>How families can help at home</h2>
  <ul>
    <li>Ask your student to teach you the example above in their own words.</li>
    <li>Have them say <em>why</em> each step works, not just the answer.</li>
    <li>Use the sentence starters below so they explain their thinking in full sentences.</li>
  </ul>
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

  return page({ title: `Family Support — Unit ${unit} Lesson ${lesson}: ${cfg.title || id}`, kind: "family", head, body, id });
}

function teacherNotesPage(id, cfg, unit, lesson) {
  const v = vocab(cfg);
  const et = cfg.reflect?.exitTicket;
  const ci = cfg.launch?.conceptIntro;
  const stdBadge = cfg.standard ? `<span class="std">${esc(cfg.standard)}</span>` : "";

  const extension =
    cfg.connect?.scenario || (Array.isArray(cfg.practice?.extending) ? "See the 'extending' practice tier in the lesson." : "");

  const exitHtml = et?.stem
    ? `<p>${esc(et.stem)}</p>${
        Array.isArray(et.choices)
          ? `<ul>${et.choices
              .map((c, i) => `<li>${esc(c)}${i === et.correctIndex ? ' <span class="answer">✓ correct</span>' : ""}</li>`)
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
    <li>Preview the key vocabulary below with ESOL students.</li>
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
  <h2>ESOL / SPED supports</h2>
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

  return page({ title: `Teacher Notes — Unit ${unit} Lesson ${lesson}: ${cfg.title || id}`, kind: "teacher-notes", head, body, id });
}

function studentHelpPage(id, cfg, unit, lesson) {
  const v = vocab(cfg);
  const steps = workedExampleLines(cfg);
  const et = cfg.reflect?.exitTicket;
  const stdBadge = cfg.standard ? `<span class="std">${esc(cfg.standard)}</span>` : "";

  const kwList = v.length
    ? `<ul>${v.map((w) => `<li><span class="kw">${esc(w.term)}</span> — ${esc(w.definition || "")}</li>`).join("")}</ul>`
    : `<p>See the lesson for key words.</p>`;

  const tryIt = et?.stem || (cfg.launch?.conceptIntro?.youDo?.lines?.[0] || "");
  const tryAns = et?.choices?.[et?.correctIndex];

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
  ${et?.explanation ? `<p class="es-text">${esc(et.explanation)}</p>` : ""}
</section>`
    : ""
}
<section>
  <h2>Sentence starter</h2>
  <p class="frame">${esc(SENTENCE_FRAMES[0])}</p>
  ${cfg.languageObjective ? `<p class="es-text">Goal: ${esc(cfg.languageObjective)}</p>` : ""}
</section>`;

  return page({ title: `Student Help — Lesson ${lesson}: ${cfg.title || id}`, kind: "student-help", head, body, id });
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
    writeFileSync(absFile, html);
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
