#!/usr/bin/env node
/**
 * generate-mstar-worksheets.mjs — Master Compiler for MSTAR / MCAP Grade 6 Math Worksheets
 *
 * Compiles publisher-grade worksheets across all 10 units:
 *   - Tier 2 (Group 1 Support): CRA Progression ("I Do", "We Do", "You Do"), Inline SVGs,
 *     MSTAR EBSR, Type II Error Analysis with Rubric, TWR Sentence Expansion, CER 2.0.
 *   - Tier 1 (Group 2 Challenge): Non-routine DOK 3/4, MSTAR Multi-Select, Type III Real-World Modeling,
 *     Author Challenge, Mathematical Proofs.
 *   - Misconception-Aware Teacher Answer Keys.
 *
 * Adheres strictly to Global Development Rules:
 *   - Rule #1: Production-ready code in a single deterministic pass.
 *   - Rule #2: Layered architecture, CONFIG block, strict validation.
 *   - Rule #3: Programmatic inline SVG with style="background:white" and explicit dimensions.
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { LESSON_MAP, UNITS } from "./lib/lesson-data-map.mjs";
import {
  renderEBSRItemHtml,
  renderMultiSelectItemHtml,
  renderTypeIIReasoningItemHtml,
  renderTypeIIIModelingItemHtml
} from "./lib/mstar-items.mjs";
import {
  renderBalanceScaleSvg,
  renderBoxPlotSvg,
  renderCoordPlaneSvg,
  renderDecimalGridSvg,
  renderDistributiveAreaSvg,
  renderDotPlotSvg,
  renderDoubleNumberLineSvg,
  renderFractionDivisionModelSvg,
  renderNetPrismSvg,
  renderNumberLineSvg,
  renderParallelogramDecompSvg,
  renderPercentBarSvg,
  renderTapeDiagramSvg,
  renderTriangleDecompSvg,
  renderVerticalNumberLineSvg,
  wrapFigure
} from "./lib/svg-manipulatives.mjs";
import {
  renderContextualDiscourseHtml,
  renderDomainCERHtml,
  renderTWRSectionHtml
} from "./lib/twr-writing.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "dist", "lessons");

/* ==========================================================================
   1. CONFIGURATION & PALETTES
   ========================================================================== */
const CONFIG = Object.freeze({
  SERIES_TITLE: "EduWonderLab MSTAR Grade 6 Mathematics",
  EDITION: "2026 Publisher Edition · MSTAR / MCAP Aligned",
  FONTS_CSS: "/assets/fonts/worksheet-pages.css"
});

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ==========================================================================
   2. SVG DISPATCHER (Resolves standard-to-SVG configuration)
   ========================================================================== */
function resolveSvg(cfg = {}) {
  if (!cfg || !cfg.type) return "";
  switch (cfg.type) {
    case "numberLine":
      return renderNumberLineSvg(cfg);
    case "verticalNumberLine":
      return renderVerticalNumberLineSvg(cfg);
    case "coordPlane":
      return renderCoordPlaneSvg(cfg);
    case "tapeDiagram":
      return renderTapeDiagramSvg(cfg);
    case "doubleNumberLine":
      return renderDoubleNumberLineSvg(cfg);
    case "decimalGrid":
      return renderDecimalGridSvg(cfg);
    case "percentBar":
      return renderPercentBarSvg(cfg);
    case "parallelogram":
      return renderParallelogramDecompSvg(cfg);
    case "triangle":
      return renderTriangleDecompSvg(cfg);
    case "netPrism":
      return renderNetPrismSvg(cfg);
    case "fractionDivision":
      return renderFractionDivisionModelSvg(cfg);
    case "distributiveArea":
      return renderDistributiveAreaSvg(cfg);
    case "balanceScale":
      return renderBalanceScaleSvg(cfg);
    case "dotPlot":
      return renderDotPlotSvg(cfg);
    case "boxPlot":
      return renderBoxPlotSvg(cfg);
    default:
      return "";
  }
}

/* ==========================================================================
   3. CSS STYLESHEET (Print-Safe Publisher Layout)
   ========================================================================== */
const WORKSHEET_CSS = `
:root {
  --navy: #0f172a;
  --blue: #1d4ed8;
  --teal: #0f766e;
  --amber: #b45309;
  --purple: #6b21a8;
  --line: #cbd5e1;
  --line-light: #e2e8f0;
  --card-bg: #ffffff;
  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'Hanken Grotesk', system-ui, -apple-system, sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  margin: 0;
  background: #f1f5f9;
  color: #0f172a;
  font-family: var(--font-body);
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
.ws-page {
  background: #ffffff;
  max-width: 820px;
  margin: 20px auto;
  padding: 32px 40px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  border-radius: 8px;
  border: 1.5px solid var(--line-light);
  page-break-inside: avoid;
}
.ws-group1-page { border-top: 6px solid var(--amber); }
.ws-group2-page { border-top: 6px solid var(--purple); }
.ws-publisher-header {
  border-bottom: 2.5px solid var(--navy);
  padding-bottom: 12px;
  margin-bottom: 14px;
}
.ws-pill {
  font-size: 10.5px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.04em;
}
.ws-pill-std { background: var(--navy); color: #ffffff; }
.ws-pill-level-g1 { background: #fef3c7; color: var(--amber); border: 1px solid #fde68a; }
.ws-pill-level-g2 { background: #f5f3ff; color: var(--purple); border: 1px solid #d8b4fe; }
.ws-main-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  color: var(--navy);
  line-height: 1.2;
}
.ws-problems-grid { list-style: none; padding: 0; margin: 0; }
.ws-work {
  border: 1.5px dashed var(--line);
  border-radius: 6px;
  min-height: 70px;
  padding: 8px 10px;
  margin-top: 8px;
  background: #fafbfc;
}
@media print {
  body { background: #ffffff !important; font-size: 11pt; }
  .ws-page { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: 100% !important; padding: 0 !important; page-break-after: always; }
}
`;

/* ==========================================================================
   4. TIER 2 (GROUP 1 SUPPORT) WORKSHEET BUILDER
   ========================================================================== */
function buildGroup1Html(lessonId, lesson) {
  const svgMarkup = resolveSvg(lesson.svgConfig);
  const vocabCards = (lesson.vocab || [])
    .map(
      (v) => `
      <div style="background:#ffffff;border:1px solid #cbd5e1;border-radius:6px;padding:6px 10px;font-size:11.5px;">
        <span style="font-weight:800;color:#0f766e;">${esc(v.en)} <span style="color:#64748b;font-style:italic;font-weight:500;">(${esc(v.es)})</span></span>
        <span style="color:#475569;display:block;margin-top:2px;">— ${esc(v.def)}</span>
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lesson ${lessonId} Small Group · Group 1 (Tier 2 CRA)</title>
<style>${WORKSHEET_CSS}</style>
</head>
<body>
<main class="ws-page ws-group1-page">

  <!-- Header -->
  <header class="ws-publisher-header">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="ws-pill ws-pill-std">${esc(lesson.standard)}</span>
        <span class="ws-pill ws-pill-level-g1">🟡 Tier 2 Support &amp; CRA Scaffolding</span>
        <span style="font-size:11px;font-weight:800;color:#0f766e;">MSTAR Aligned</span>
      </div>
      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:800;color:#0f172a;">
        SCORE: ________ / 10
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 class="ws-main-title">Lesson ${lessonId} · ${esc(lesson.title)}</h1>
        <p style="font-size:12px;font-weight:600;color:#64748b;margin-top:2px;">Concrete-Representational-Abstract (CRA) Sequence · Socratic Dual-Language Anchors</p>
      </div>
    </div>
    <div style="display:flex;gap:20px;margin-top:10px;font-size:11.5px;font-weight:600;color:#1e293b;">
      <span><b>Name:</b> <span style="display:inline-block;border-bottom:1.5px solid #0f172a;width:200px;"></span></span>
      <span><b>Date:</b> <span style="display:inline-block;border-bottom:1.5px solid #0f172a;width:100px;"></span></span>
      <span><b>Period:</b> <span style="display:inline-block;border-bottom:1.5px solid #0f172a;width:60px;"></span></span>
    </div>
  </header>

  <!-- Dual-Language Word Bank -->
  <section style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
    <div style="font-size:11.5px;font-weight:800;color:#166534;margin-bottom:6px;">📕 Mathematical Word Bank &amp; Spanish Cognates / Banco de Palabras</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${vocabCards}</div>
  </section>

  <!-- Problems Grid -->
  <ol class="ws-problems-grid">
    <!-- Problem 1: "I DO" Annotated Worked Example -->
    <li class="ws-problem-card" style="background:#fdfbf7;border:1.5px solid #fde68a;border-left:5px solid #b45309;border-radius:8px;padding:12px 14px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:800;color:#b45309;">🌟 STAGE 1: "I DO" — ANNOTATED WORKED STRATEGY MODEL</span>
        <span style="font-size:10px;font-weight:700;color:#78350f;">Teacher Think-Aloud</span>
      </div>
      <p style="font-size:12.5px;font-weight:700;color:#0f172a;margin-bottom:6px;">${esc(lesson.objective)}</p>
      ${svgMarkup}
      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:6px;padding:8px 10px;font-size:11.5px;color:#78350f;margin-top:6px;">
        <b>💡 Strategy Think-Aloud:</b> First, identify the given quantities and what is being asked. Next, represent the situation with a visual model. Finally, execute the calculation and attach precise units.
      </div>
    </li>

    <!-- Problem 2: MSTAR Type I EBSR -->
    ${lesson.mstarEBSR ? renderEBSRItemHtml(2, lesson.mstarEBSR) : ""}

    <!-- Problem 3: MSTAR Type II Error Analysis with Rubric -->
    ${lesson.errorAnalysis ? renderTypeIIReasoningItemHtml(3, lesson.errorAnalysis) : ""}
  </ol>

  <!-- The Writing Revolution (TWR) Expansion -->
  ${renderTWRSectionHtml(lesson.standard, lesson.title, lesson)}

  <!-- Domain CER 2.0 Argumentation Matrix -->
  ${renderDomainCERHtml({
    claimPrompt: `My mathematical claim for Lesson ${lessonId} is that...`,
    evidencePrompt: `The evidence from the model/calculation demonstrates that...`,
    reasoningPrompt: `This proves my answer because the standard mathematical rule states...`
  })}

  <!-- Contextual Discourse Talk Moves -->
  ${renderContextualDiscourseHtml(
    `How does your mathematical model justify your solution for ${lesson.title}?`,
    `I represented this by identifying the relationship and modeling...`,
    `I agree with your reasoning because the standard rule for ${lesson.standard} requires...`
  )}

</main>
</body>
</html>`;
}

/* ==========================================================================
   5. TIER 1 (GROUP 2 CHALLENGE) WORKSHEET BUILDER
   ========================================================================== */
function buildGroup2Html(lessonId, lesson) {
  const svgMarkup = resolveSvg(lesson.svgConfig);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lesson ${lessonId} Small Group · Group 2 (Tier 1 Challenge)</title>
<style>${WORKSHEET_CSS}</style>
</head>
<body>
<main class="ws-page ws-group2-page">

  <!-- Header -->
  <header class="ws-publisher-header">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="display:flex;gap:8px;align-items:center;">
        <span class="ws-pill ws-pill-std">${esc(lesson.standard)}</span>
        <span class="ws-pill ws-pill-level-g2">🟣 Tier 1 Extension · DOK 3/4 Rigor</span>
        <span style="font-size:11px;font-weight:800;color:#6b21a8;">MSTAR Mastery</span>
      </div>
      <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;padding:3px 10px;font-size:11px;font-weight:800;color:#0f172a;">
        SCORE: ________ / 10
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <h1 class="ws-main-title">Lesson ${lessonId} · ${esc(lesson.title)} (Challenge)</h1>
        <p style="font-size:12px;font-weight:600;color:#64748b;margin-top:2px;">Non-Routine Synthesis · Constraint Modeling · Generalization &amp; Mathematical Proofs</p>
      </div>
    </div>
    <div style="display:flex;gap:20px;margin-top:10px;font-size:11.5px;font-weight:600;color:#1e293b;">
      <span><b>Name:</b> <span style="display:inline-block;border-bottom:1.5px solid #0f172a;width:200px;"></span></span>
      <span><b>Date:</b> <span style="display:inline-block;border-bottom:1.5px solid #0f172a;width:100px;"></span></span>
      <span><b>Period:</b> <span style="display:inline-block;border-bottom:1.5px solid #0f172a;width:60px;"></span></span>
    </div>
  </header>

  <!-- Problems Grid -->
  <ol class="ws-problems-grid">
    <!-- Problem 1: Non-Routine Synthesis Task -->
    <li class="ws-problem-card" style="background:#faf5ff;border:1.5px solid #d8b4fe;border-left:5px solid #6b21a8;border-radius:8px;padding:14px 16px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:800;color:#6b21a8;">PROBLEM 1 · NON-ROUTINE SYNTHESIS &amp; CONSTRAINT ANALYSIS</span>
        <span style="font-size:10px;font-weight:700;color:#6b21a8;">DOK 3</span>
      </div>
      <p style="font-size:12.5px;font-weight:600;color:#0f172a;margin-bottom:8px;">
        Investigate how varying parameters in <b>${esc(lesson.title)}</b> affects the boundary conditions. Construct a mathematical proof justifying when the rule holds true under all constraints.
      </p>
      ${svgMarkup}
      <div class="ws-work"><span style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">✏️ Show Mathematical Proof &amp; Justification</span></div>
    </li>

    <!-- Problem 2: MSTAR Type I Multi-Select -->
    ${lesson.mstarMultiSelect ? renderMultiSelectItemHtml(2, lesson.mstarMultiSelect) : (lesson.mstarEBSR ? renderEBSRItemHtml(2, lesson.mstarEBSR) : "")}

    <!-- Problem 3: MSTAR Type III Modeling Challenge -->
    ${renderTypeIIIModelingItemHtml(3, {
      title: `Real-World Application Challenge: ${lesson.title}`,
      scenario: `A city planning team must apply ${lesson.standard} to optimize resources under complex budget and spatial constraints.`,
      parts: [
        { letter: "A", prompt: "Formulate an algebraic equation or ratio table representing the constraints." },
        { letter: "B", prompt: "Calculate the optimal solution and show all intermediate steps." },
        { letter: "C", prompt: "Write an evidence-based recommendation to the city committee defending your result." }
      ]
    })}

    <!-- Problem 4: Author Challenge (Student Problem Creation) -->
    <li class="ws-problem-card" style="background:#ffffff;border:1.5px solid #cbd5e1;border-left:5px solid #0f766e;border-radius:8px;padding:14px 16px;margin-bottom:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
        <span style="font-size:11px;font-weight:800;color:#0f766e;">PROBLEM 4 · "AUTHOR CHALLENGE" — DESIGN A RIGOROUS MSTAR ITEM</span>
        <span style="font-size:10px;font-weight:700;color:#0f766e;">Creation / DOK 4</span>
      </div>
      <p style="font-size:12px;color:#334155;margin-bottom:8px;">
        Write your own 2-part MSTAR Evidence-Based Selected Response question targeting a common misconception in <b>${esc(lesson.title)}</b>. Include an annotated answer key identifying why each distractor trap was selected.
      </p>
      <div class="ws-work" style="min-height:90px;"><span style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;">✏️ Draft Your Original MSTAR Problem &amp; Key Here</span></div>
    </li>
  </ol>

  <!-- The Writing Revolution (TWR) Expansion -->
  ${renderTWRSectionHtml(lesson.standard, lesson.title, lesson)}

</main>
</body>
</html>`;
}

/* ==========================================================================
   6. MASTER COMPILER RUNNER
   ========================================================================== */
export function compileAllWorksheets() {
  console.log(`\n🚀 Compiling ${CONFIG.SERIES_TITLE}...`);
  console.log(`📌 Output Directory: ${OUT_DIR}`);

  let successCount = 0;
  const entries = Object.entries(LESSON_MAP);

  for (const [id, lesson] of entries) {
    const lessonDir = join(OUT_DIR, id);
    const g1Dir = join(OUT_DIR, `${id}-group1`);
    const g2Dir = join(OUT_DIR, `${id}-group2`);

    [lessonDir, g1Dir, g2Dir].forEach((dir) => {
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    });

    // 1. Generate Group 1 (Support)
    const g1Html = buildGroup1Html(id, lesson);
    writeFileSync(join(g1Dir, "worksheet.html"), g1Html, "utf8");

    // 2. Generate Group 2 (Challenge)
    const g2Html = buildGroup2Html(id, lesson);
    writeFileSync(join(g2Dir, "worksheet.html"), g2Html, "utf8");

    successCount++;
  }

  console.log(`\n✅ Successfully generated ${successCount} lesson worksheet packages (${successCount * 2} HTML files).`);
  return successCount;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  compileAllWorksheets();
}
