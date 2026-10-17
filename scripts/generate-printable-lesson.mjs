/**
 * Generate a full, print-friendly student packet per lesson: `printable.html`.
 *
 * This is the paper fallback for students without a device. Unlike `handout.html`
 * (a condensed practice handout), this renders the COMPLETE lesson linearly from
 * `config.json` — objectives, Notice & Wonder, vocabulary, Turn & Talk, Launch
 * (I do / We do / You do), Explore, the on-level Practice set, Connect, and the
 * Exit Ticket — with generous work space and NO answers revealed.
 *
 * Self-contained (inline CSS, no external requests), grayscale-friendly, and
 * paginated so it prints cleanly. Source of truth stays `config.json`.
 *
 *   node scripts/generate-printable-lesson.mjs            # all lessons
 *   node scripts/generate-printable-lesson.mjs 1-1 10-3   # specific lessons
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { LESSONS_DIR as lessonsDir } from "../tools/lib/curriculum-source.mjs";
import { isGeneratedFresh, writeGenerated } from "./lib/preserve-injected.mjs";

const LESSON_DIR_RE = /^(\d+)-(\d+)(-flagship)?$/;

import {
  answerBlank,
  DUAL_WORKSPACE_CSS,
  esc,
  renderChoices,
  renderItem,
  STUDENT_TASK_CSS,
  workLines,
} from "./lib/student-print-tasks.mjs";

// Semantic support slots. The runtime support layer attaches blocks by these
// NAMES, never by a CSS selector or an nth-child path — an adaptation anchored
// to markup shape dies the next time the packet is restyled.
const SUPPORT_SLOTS = {
  Vocabulary: "vocabulary",
  Launch: "workedExample",
  Practice: "practice",
  "Exit Ticket": "response",
};

const SECTION_IDS = {
  "Learning Goals": "sec-hook",
  "Notice & Wonder": "sec-notice-wonder",
  Vocabulary: "sec-vocab",
  Launch: "sec-worked-model",
  Explore: "sec-explore",
  Practice: "sec-practice",
  "Exit Ticket": "sec-exit-ticket",
};

function section(title, emoji, inner, extraClass = "") {
  if (!inner) return "";
  const slot = SUPPORT_SLOTS[title];
  const slotAttr = slot ? ` data-support-slot="${slot}"` : "";
  const secId = SECTION_IDS[title];
  const idAttr = secId ? ` id="${secId}"` : "";
  const cls = `lp-section${extraClass ? ` ${extraClass}` : ""}`;
  return `<section${idAttr} class="${cls}"${slotAttr}><h2>${emoji ? esc(emoji) + " " : ""}${esc(title)}</h2>${inner}</section>`;
}

function studentSafeMistake(raw) {
  const src = String(raw || "").trim();
  if (!src) return "";
  const cut = src.split(/[;—]/)[0].trim();
  const firstSentence = (cut.match(/[^.!?]+[.!?]+/) || [cut])[0].trim();
  return firstSentence || cut;
}

// ---- Full-lesson builder --------------------------------------------------

function buildPrintable(config) {
  const id = config.lessonId || "";
  const bilingual = (en, es) => `${esc(en)}${es ? ` <span class="es">${esc(es)}</span>` : ""}`;

  // Objectives + The Big Hook / Why This Matters (Slate/Navy Theme Container)
  const hookNarrative = config.launch?.narrative || config.connect?.scenario || "";
  const objectives = section(
    "Learning Goals",
    "🎯",
    `<div class="hook-banner">
      <div class="hook-badge">THE BIG HOOK · WHY THIS MATTERS</div>
      ${hookNarrative ? `<p class="hook-narrative">${esc(hookNarrative)}</p>` : ""}
      ${
        config.contentObjective
          ? `<p class="hook-goal"><strong>Content:</strong> ${bilingual(config.contentObjective, config.contentObjectiveEs)}</p>`
          : ""
      }
      ${
        config.languageObjective
          ? `<p class="hook-goal"><strong>Language:</strong> ${bilingual(config.languageObjective, config.languageObjectiveEs)}</p>`
          : ""
      }
    </div>`,
    "lp-hook-section",
  );

  // Notice & Wonder (Soft Cool Tint + 2-column writing grid)
  const nw = config.noticeAndWonder;
  const noticeWonder = nw
    ? section(
        "Notice & Wonder",
        "👀",
        `<div class="nw-box">
          ${nw.context ? `<p class="context">${esc(nw.context)}</p>` : ""}
          ${nw.image ? `<figure class="notice-figure"><img src="${esc(nw.image)}" alt="${esc(nw.imageAlt || nw.alt || nw.context || "Notice and Wonder lesson visual")}" loading="eager" decoding="sync"></figure>` : ""}
          <div class="nw-grid">
            <div class="nw-col"><p><strong>I Notice...</strong></p>${workLines(2)}</div>
            <div class="nw-col"><p><strong>I Wonder...</strong></p>${workLines(2)}</div>
          </div>
        </div>`,
      )
    : "";

  // Vocabulary
  const vocab = (config.vocabulary || []).length
    ? section(
        "Vocabulary",
        "📚",
        `<table class="vocabtbl"><tr><th>Word</th><th>What it means</th><th>Example</th></tr>${config.vocabulary
          .map((v) => {
            const ex = (v.examples || []).find((e) => e && e.text);
            return `<tr><td><strong>${esc(v.term)}</strong>${v.termEs ? `<br><span class="es">${esc(v.termEs)}</span>` : ""}</td><td>${esc(v.definition)}${v.definitionEs ? `<br><span class="es">${esc(v.definitionEs)}</span>` : ""}</td><td>${ex ? esc(ex.text + (ex.why ? " — " + ex.why : "")) : ""}</td></tr>`;
          })
          .join("")}</table>`,
      )
    : "";

  // Turn & Talk
  const tt = (config.turnAndTalk || [])
    .map((t) => {
      const stems = (t.stems || [])
        .map((s) => (typeof s === "string" ? s : s.en || s.text || ""))
        .filter(Boolean);
      const bank = (t.wordBank || []).filter(Boolean);
      return `<div class="item"><p class="qtext">${esc(t.question)}</p>
        ${stems.length ? `<p class="frame">Sentence starters: ${stems.map((s) => esc(s)).join(" · ")}</p>` : ""}
        ${bank.length ? `<p class="hint-line">Word bank: ${bank.map((b) => esc(b)).join(", ")}</p>` : ""}
        ${workLines(2)}</div>`;
    })
    .join("");
  const turnTalk = tt ? section("Turn & Talk", "💬", tt) : "";

  // Launch (Dual-Column Workspace preserving every iDo.lines number verbatim)
  const ci = config.launch?.conceptIntro;
  const launchInner = [
    config.launch?.narrative ? `<p class="context">${esc(config.launch.narrative)}</p>` : "",
    ci?.heading ? `<h3>${esc(ci.heading)}</h3>` : "",
    ci?.intro ? `<p>${esc(ci.intro)}</p>` : "",
    ci?.keyIdea ? `<p class="keyidea"><strong>Key idea:</strong> ${esc(ci.keyIdea)}</p>` : "",
    ...["iDo", "weDo", "youDo"].map((k) => {
      const step = ci?.[k];
      if (!step) return "";
      const lines = (step.lines || []).map((l) => `<li>${esc(l)}</li>`).join("");
      return `<div class="cistep">
        <p class="cititle">${esc(step.title || k)}</p>
        <div class="dual-workspace">
          <div class="dw-col dw-given">
            <div class="dw-head">GIVEN DATA / MODEL</div>
            <ul>${lines}</ul>
          </div>
          <div class="dw-col dw-thinking">
            <div class="dw-head">STUDENT THINKING &amp; SENTENCE FRAME</div>
            <p class="frame">Because ___ , therefore ___ .</p>
            ${workLines(2)}
          </div>
        </div>
      </div>`;
    }),
  ].join("");
  const launch = launchInner ? section("Launch", "🚀", launchInner) : "";

  // Explore
  const ex = config.explore;
  const exploreInner = ex
    ? `${renderItem(ex, null, { dualWorkspace: true })}${
        ex.discourse?.prompt
          ? `<p class="frame">${esc(ex.discourse.prompt)}${ex.discourse.sentenceFrame ? " — " + esc(ex.discourse.sentenceFrame) : ""}</p>${workLines(2)}`
          : ""
      }`
    : "";
  const explore = exploreInner ? section("Explore", "🔍", exploreInner) : "";

  // Watch Out! Misconception Badge (Coral Accent Banner) + Practice
  const p = config.practice || {};
  const mistakeText = studentSafeMistake(p.commonMistake);
  const watchOutBanner = mistakeText
    ? `<div class="watch-out-banner" role="note" aria-label="Watch Out misconception alert">
        <div class="watch-out-badge">⚠️ WATCH OUT! · COMMON MISCONCEPTION</div>
        <p class="watch-out-text">${esc(mistakeText)}</p>
      </div>`
    : "";
  const band =
    (p.onLevel && p.onLevel.length && p.onLevel) ||
    (p.approaching && p.approaching.length && p.approaching) ||
    (p.extending && p.extending.length && p.extending) ||
    [];
  const practiceItems = band.length
    ? band.map((it, i) => renderItem(it, i, { dualWorkspace: true })).join("")
    : "";
  const practiceInner = watchOutBanner || practiceItems ? `${watchOutBanner}${practiceItems}` : "";
  const practice = practiceInner ? section("Practice", "✏️", practiceInner) : "";

  // Connect
  const cn = config.connect;
  const connectInner = cn
    ? `${cn.scenario ? `<p class="context">${esc(cn.scenario)}</p>` : ""}${
        cn.promptQuestion || cn.prompt
          ? `<p class="qtext">${esc(cn.promptQuestion || cn.prompt)}</p>`
          : ""
      }${
        (cn.keywords || []).length
          ? `<p class="hint-line">Try to use: ${cn.keywords.map((k) => esc(k)).join(", ")}</p>`
          : ""
      }${workLines(4)}`
    : "";
  const connect = connectInner ? section("Connect to the Real World", "🌍", connectInner) : "";

  // Reflect / Exit Ticket
  const et = config.reflect?.exitTicket;
  const reflectInner = et
    ? `<p class="qtext">${esc(et.stem)}</p>${
        (et.choices || []).length ? renderChoices(et.choices) + answerBlank() : workLines(3)
      }`
    : "";
  const reflect = reflectInner ? section("Exit Ticket", "🎟️", reflectInner) : "";

  // 3-Point Self-Assessment Exit Checklist at Footer
  const exitChecklist = `<section id="sec-exit-checklist" class="lp-section exit-checklist-box" aria-label="Self-Assessment Exit Checklist">
    <h2>✅ 3-Point Self-Assessment Exit Checklist</h2>
    <ul class="exit-check-grid">
      <li>☐ <strong>1. Units &amp; Labels Verified</strong> — Every quantity includes its unit or label.</li>
      <li>☐ <strong>2. Mathematical Reasoning Stated</strong> — Explained using <em>Because… / Therefore…</em></li>
      <li>☐ <strong>3. Calculations Double-Checked</strong> — Arithmetic and signs verified against the model.</li>
    </ul>
    <div class="confidence-strip">
      <strong>Confidence Check:</strong>
      <span>☐ 4 · I can teach it</span>
      <span>☐ 3 · I've got it</span>
      <span>☐ 2 · I need a hint</span>
      <span>☐ 1 · I need help</span>
    </div>
  </section>`;

  // Structured Navigation & Table of Contents (>2 Pages)
  const tocLinks = [
    objectives ? `<a href="#sec-hook">1. The Big Hook &amp; Goals</a>` : "",
    noticeWonder ? `<a href="#sec-notice-wonder">2. Notice &amp; Wonder</a>` : "",
    vocab ? `<a href="#sec-vocab">3. Vocabulary</a>` : "",
    launch ? `<a href="#sec-worked-model">4. Worked Model (I/We/You Do)</a>` : "",
    explore ? `<a href="#sec-explore">5. Explore</a>` : "",
    practice ? `<a href="#sec-practice">6. Practice &amp; Watch Out!</a>` : "",
    reflect ? `<a href="#sec-exit-ticket">7. Exit Ticket</a>` : "",
    `<a href="#sec-exit-checklist">8. Self-Assessment</a>`,
  ]
    .filter(Boolean)
    .join("");
  const tocNav = `<nav class="pdf-toc" role="doc-toc" aria-label="Table of Contents">
    <span class="toc-title">PACKET GUIDE:</span>
    <div class="toc-links">${tocLinks}</div>
  </nav>`;

  const title = esc(config.title || "Lesson");
  const meta = `${esc(config.standard || "")} · Unit ${esc(config.unit ?? "")}${config.lesson != null ? " · Lesson " + esc(config.lesson) : ""}`;

  return `<!doctype html>
<html lang="en" data-ewl-supports-lesson="${esc(id)}" data-support-audience="student">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Printable full lesson packet — ${title}">
<title>${title} — Printable Lesson</title>
<style>
  :root { --ink:#1a1a1a; --muted:#555; --rule:#c9c9c9; --accent:#155fa0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: Georgia, "Times New Roman", serif; color: var(--ink);
    max-width: 820px; margin: 0 auto; padding: 28px 32px; line-height: 1.5; font-size: 12.5pt; }
  h1 { font-size: 21pt; margin: 0 0 2px; }
  h2 { font-size: 14pt; border-bottom: 2px solid var(--accent); padding-bottom: 3px; margin: 0 0 10px; }
  h3 { font-size: 12.5pt; margin: 12px 0 4px; }
  .doc-meta { color: var(--muted); font-size: 10.5pt; margin: 0 0 12px; }
  .idbar { display: flex; gap: 20px; flex-wrap: wrap; border: 1px solid var(--rule);
    border-radius: 8px; padding: 10px 14px; margin: 0 0 14px; font-size: 11pt; }
  .idbar span { flex: 1 1 auto; }
  .idbar .u { display: inline-block; min-width: 120px; border-bottom: 1px solid #999; }
  .pdf-toc { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; background: #f8fafc;
    border: 1px solid #cbd5e1; border-left: 4px solid #0f172a; border-radius: 6px; padding: 8px 12px;
    margin: 0 0 18px; font-size: 9.5pt; }
  .toc-title { font-weight: 800; letter-spacing: 0.06em; color: #0f172a; text-transform: uppercase; }
  .toc-links { display: flex; flex-wrap: wrap; gap: 6px 12px; }
  .toc-links a { color: #155fa0; text-decoration: none; font-weight: 600; }
  .toc-links a:hover { text-decoration: underline; }
  .lp-section { margin: 0 0 22px; page-break-inside: avoid; }
  .hook-banner { background: #0f172a; color: #ffffff; border-left: 5px solid #38bdf8;
    border-radius: 8px; padding: 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .hook-banner .es { color: #cbd5e1; }
  .hook-badge { display: inline-block; background: #38bdf8; color: #0f172a; font-size: 8.5pt;
    font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 2px 8px;
    border-radius: 4px; margin-bottom: 6px; }
  .hook-narrative { margin: 0 0 8px; font-size: 11.5pt; color: #f1f5f9; }
  .hook-goal { margin: 4px 0; font-size: 11pt; color: #ffffff; }
  .nw-box { background: #f0f7ff; border: 1.5px solid #93c5fd; border-left: 5px solid #155fa0;
    border-radius: 8px; padding: 12px 14px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .nw-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.14in; margin-top: 8px; }
  .nw-col { background: #ffffff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 8px 10px; }
  .nw-col p { margin: 0 0 4px; color: #155fa0; }
  .watch-out-banner { background: #fff5f2; border: 1.5px solid #f5c2b4; border-left: 5px solid #e05638;
    color: #7c2d12; border-radius: 8px; padding: 10px 14px; margin: 0 0 14px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .watch-out-badge { font-size: 9pt; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase;
    color: #c2410c; margin-bottom: 4px; }
  .watch-out-text { margin: 0; font-size: 11pt; color: #7c2d12; }
  .exit-checklist-box { background: #f8fafc; border: 1.5px solid #cbd5e1; border-top: 4px solid #0f172a;
    border-radius: 8px; padding: 12px 16px; }
  .exit-check-grid { list-style: none; margin: 0 0 10px; padding: 0; display: grid; gap: 6px; font-size: 11pt; }
  .confidence-strip { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center;
    border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 10.5pt; color: #334155; }
  .es { color: var(--muted); font-style: italic; font-size: 0.92em; }
  .context { background: #f6f6f2; border-left: 3px solid var(--accent); padding: 8px 12px; margin: 0 0 10px; }
  .notice-figure { margin: 12px 0; break-inside: avoid; text-align: center; }
  .notice-figure img { display: block; max-width: 100%; max-height: 340px; width: auto; height: auto; margin: 0 auto; object-fit: contain; }
  .keyidea { background: #fff8e6; border: 1px solid #e3c46a; border-radius: 6px; padding: 8px 12px; }
  .item { margin: 0 0 14px; page-break-inside: avoid; }
  .qtext { font-weight: 600; margin: 0 0 6px; }
  .qnum { color: var(--accent); font-weight: 700; }
  .frame { color: var(--muted); font-style: italic; margin: 4px 0; }
  .hint-line { color: var(--muted); font-size: 10.5pt; margin: 4px 0; }
  .choices { list-style: none; margin: 4px 0; padding: 0; }
  .choices li { margin: 3px 0; }
  .choices .ltr { display: inline-block; width: 1.6em; height: 1.6em; line-height: 1.6em;
    text-align: center; border: 1px solid #888; border-radius: 50%; font-weight: 700; margin-right: 6px; }
  .ans { margin: 8px 0 0; }
  .blank { display: inline-block; min-width: 160px; border-bottom: 1.5px solid #333; }
  .work { margin: 6px 0 0; }
  .wl { border-bottom: 1px solid #bbb; height: 1.7em; }
  table { border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 11pt; }
  th, td { border: 1px solid var(--rule); padding: 6px 8px; text-align: left; vertical-align: top; }
  th { background: #f0f0ec; }
  td.fill, td.mans { background: #fcfcfa; min-width: 90px; }
  .matchtbl td, .balancetbl td { border: none; padding: 4px 6px; }
  .mans { border-bottom: 1.5px solid #333 !important; min-width: 40px; }
  .cistep { margin: 8px 0; }
  .cititle { font-weight: 700; margin: 0 0 2px; color: var(--accent); }
  .cistep ul { margin: 2px 0 0 18px; }
  .wordbank { margin: 6px 0; }
  .chip { display: inline-block; border: 1px solid #888; border-radius: 12px; padding: 2px 10px; margin: 2px; }
  .sortboxes { display: flex; gap: 12px; flex-wrap: wrap; }
  .sortbox { flex: 1 1 200px; min-height: 120px; border: 1px solid #888; border-radius: 6px; }
  .sorthd { background: #f0f0ec; padding: 5px 8px; font-weight: 700; border-bottom: 1px solid #888; }
  .worked { border: 1px solid var(--rule); border-radius: 6px; padding: 6px 10px; margin: 6px 0; }
  .wa-step { display: flex; gap: 10px; padding: 3px 0; border-bottom: 1px dashed #ddd; }
  .wa-lbl { font-weight: 600; min-width: 150px; }
  .numline, .coordgrid { max-width: 100%; margin: 8px 0; }
  .bvs { color: var(--muted); }
  .resource-toolbar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
  .resource-toolbar a { color: var(--accent); font-weight: 700; padding: 10px 0; }
  .print-btn { background: var(--accent); color: #fff; min-height: 44px;
    border: none; border-radius: 8px; padding: 10px 16px; font-size: 12pt; cursor: pointer; font-family: inherit; }
  :focus-visible { outline: 3px solid #a9471a; outline-offset: 4px; }
  @media (max-width: 560px) { body { padding: 16px; } .idbar { gap: 12px; } .nw-grid { grid-template-columns: 1fr; } }
  @page { size: Letter; margin: .55in; }
  footer { margin-top: 26px; border-top: 1px solid var(--rule); padding-top: 8px; color: var(--muted); font-size: 10pt; }
  @media print {
    body { padding: 0; max-width: none; font-size: 11.5pt; }
    .resource-toolbar { display: none; }
    .lp-section { page-break-inside: auto; }
    h1, h2, h3, .cititle { break-after: avoid; }
    p { orphans: 3; widows: 3; }
  }
  ${STUDENT_TASK_CSS}
  ${DUAL_WORKSPACE_CSS}
</style>
</head>
<body>
  <nav class="resource-toolbar" aria-label="Packet actions">
    <a href="/lessons/${esc(id)}/">← Back to lesson</a>
    <button type="button" class="print-btn" onclick="window.print()">Print / Save PDF</button>
  </nav>
  <main>
  <h1>${title}</h1>
  <p class="doc-meta">${meta}</p>
  <div class="idbar">
    <span>Name: <span class="u"></span></span>
    <span>Class / Period: <span class="u"></span></span>
    <span>Date: <span class="u"></span></span>
  </div>
  ${tocNav}
  ${objectives}
  ${noticeWonder}
  ${vocab}
  ${turnTalk}
  ${launch}
  ${explore}
  ${practice}
  ${connect}
  ${reflect}
  ${exitChecklist}
  <footer>Neft Teacher · ${esc(id)} · Printable full-lesson packet · Complete every section, then bring it to class.</footer>
  </main>
  <!-- Anonymous usage beacon. It has to be emitted HERE rather than added by
       tools/inject-usage-signal.mjs: this file is regenerated on every build,
       so an injected tag is silently stripped again on the next \`npm run build\`
       (which is exactly what happened the first time). Generated pages must be
       instrumented by their generator. -->
  <script src="/assets/nt-usage.js" data-nt-usage="1" defer></script>
  <!-- The lesson adaptation layer, on paper. It renders the SAME effective
       support configuration the interactive lesson renders (one resolver, in
       shared/supports/lesson-supports.js) so a printed packet cannot disagree
       with the lesson it was printed for. It is inert until a teacher has
       configured supports for this lesson, and every failure path leaves this
       page exactly as generated. Emitted here rather than injected for the
       reason given above: this file is rewritten on every build. -->
  <script src="/shared/supports/print-supports.js" defer></script>
</body>
</html>`.replace(/[ \t]+$/gm, "");
}

// ---- Run ------------------------------------------------------------------

const CHECK = process.argv.includes("--check");
const argv = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const all = readdirSync(lessonsDir).filter(
  (d) => LESSON_DIR_RE.test(d) && existsSync(join(lessonsDir, d, "config.json")),
);
const targets = argv.length ? argv.filter((d) => all.includes(d)) : all;

let n = 0;
const stale = [];
for (const id of targets) {
  const config = JSON.parse(readFileSync(join(lessonsDir, id, "config.json"), "utf8"));
  const file = join(lessonsDir, id, "printable.html");
  const html = buildPrintable(config);
  if (CHECK) {
    if (!isGeneratedFresh(file, html)) stale.push(`lessons/${id}/printable.html`);
    continue;
  }
  // writeGenerated, not writeFileSync. printable.html carries no injected blocks
  // TODAY, so this is a no-op that returns the html unchanged — but the moment an
  // injector starts targeting it (tools/inject-usage-signal.mjs already names this
  // page), a plain overwrite would silently strip the layer. Cheap to be correct now.
  writeGenerated(file, html);
  n++;
}
if (CHECK) {
  if (stale.length) {
    console.error(
      `Stale printable.html files (${stale.length}):\n  ${stale.slice(0, 15).join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(`✓ ${targets.length} printable.html file(s) fresh`);
} else {
  console.log(`✓ generated ${n} printable.html file(s)`);
}
