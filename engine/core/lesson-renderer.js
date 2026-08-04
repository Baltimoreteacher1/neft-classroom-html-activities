// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
import { extractDivisionDiagram } from "./division-helper.js";
import {
  renderActivityChooser,
  renderOptionalPracticeOptIn,
} from "../components/activity-chooser.js";
import {
  renderAlgebraTiles,
  renderBalanceScale,
  renderBarModel,
  renderCoordinateGrid,
  renderCoordinatePlane,
  renderDragSort,
  renderErrorAnalysis,
  renderFillTable,
  renderFractionBars,
  renderMatchingGame,
  renderMultipleChoice,
  renderNetFolder,
  renderNumberLine,
  renderOpenResponse,
  renderRemediation,
  renderTwrWriting,
  renderWhichOneDoesntBelong,
} from "../components/index.js";
import { attachRegenPractice } from "../components/regen-practice.js";
import { attachAnnotator } from "../components/scene-annotate.js";
import { attachVoiceInput } from "../components/voice-explain.js";
import { createAdaptiveSequence } from "./adaptive.js";
import { enableWordProblemAnnotation, observeWordProblemAnnotation } from "./annotate.js";
import { fullerFormHint, isRight } from "./answer-match.js";
import { createApp } from "./app.js";
import { fireCelebrationFX, renderCelebrationPicker } from "./celebration-picker.js";
import { mountCertificateDownload } from "./certificate-export.js";
import { mountChalkAnnotations } from "./chalk-annotate.js";
import { deriveCommonMistake, deriveErrorExample } from "./content-enrichment.js";
import { mountDiscussionMoment } from "./discourse.js";
import { getFeedbackMode, MODES, mountFeedbackModeToggle } from "./feedback-mode.js";
import {
  fadeNoteFor,
  framePartsFor,
  recordTurnAndTalk,
  resolveFrameLevel,
} from "./frame-fading.js";
import { createGoDeeper } from "./go-deeper.js";
import { buildGradeCard } from "./grade.js";
import { recommendedNext } from "./grade-emit.js";
import { mountHintLadder } from "./hint-ladder.js";
import { badgeName, getPreferredLang, phaseName, stackHtml, t } from "./i18n.js";
import { attachImageZoom, isLightboxOpen } from "./image-zoom.js";
import { interactiveVisualHost, mountInteractiveVisuals } from "./interactive-visual.js";
import { mountLevel3Launch } from "./level3-launch.js";
import { getLevel, levelOverride, mountLevelSelector } from "./levels.js";
import { augmentVocabWithGlossary } from "./math-glossary.js";
import { renderMathText } from "./math-typography.js";
import { diagnoseChoice } from "./misconceptions.js";
import {
  normalizeAcademicWord,
  resolveNoticeWonderAcademicWord,
} from "./notice-wonder-glossary.js";
import { resolveObjectiveVisuals } from "./objective-visuals.js";
import { studentFirstName, toThirdPersonObjective } from "./objective-voice.js";
import { mountPeerExchange } from "./peer-exchange.js";
import {
  buildPhaseTransitionMeta,
  buildPrintableSummary,
  checkBadges,
  getBadgeDefs,
  renderLaunchStoryBeats,
} from "./premium.js";
import { createProblemCard, problemTypeLabel } from "./problem-shell.js";
import { mountReadingProgress } from "./reading-progress.js";
import { mountRetrievalOpener } from "./retrieval.js";
import { mountQuestionLadderReader } from "./socratic.js";
import { mountStuckSupport } from "./stuck-support.js";
import { isTeacherMode } from "./teacher-mode.js";
import { renderThemeIllustration } from "./theme-illustrations.js";
import { toolMeta } from "./tool-catalog.js";
import { isToolsMode, mountToolsMenuItem, renderToolsPage } from "./tools-mode.js";
import { stampTeachL4Meta } from "./uifr.js";
import {
  barChartSVG,
  boxPlotSVG,
  coordPlaneSVG,
  dotPlotSVG,
  factorTreeSVG,
  figureAria,
  histogramSVG,
  numberLineSVG,
  tapeDiagramSVG,
} from "./visual-figures.js";
import resolveVocabImage, { hasRealVocabImage, vocabImageAlt } from "./vocab-images.js";
import { buildVocabMatcher } from "./vocab-match.js";
import { mountWodbOpener } from "./wodb.js";
import { deriveWorkedSteps } from "./worked-steps.js";

export function bootLesson(config) {
  // Hidden, student-invisible BCPS UIFR (TEACH · Level 4) evidence stamp in
  // <head> — never rendered on screen; discoverable via View Source / DevTools
  // and mirrored in the Teacher Mode panel + reports/uifr-teach-l4-coverage.*.
  stampTeachL4Meta(config);
  // Studio Journey breadcrumb: lets the curriculum hub offer "pick up where
  // you left off". Local-only, no PII (lesson id + title + path).
  try {
    localStorage.setItem(
      "nt-journey-last",
      JSON.stringify({
        id: config.lessonId,
        title: config.title || "",
        path: window.location.pathname,
        t: Date.now(),
      }),
    );
  } catch (_error) {
    /* private mode — breadcrumb is optional */
  }
  // Standalone "Interactive Tools" practice page (?mode=tools): surface just the
  // lesson's manipulatives, skipping the graded flow. Reversible via a back link.
  if (isToolsMode()) {
    renderToolsPage(config, document.getElementById("app"));
    return;
  }
  createApp({
    ...config,
    // Vocabulary lives only in the Vocab tab now (the Vocab Explorer), so it is
    // no longer a graded phase. Phases: Launch, Explore, Practice, Connect,
    // Reflect (indices 0–4). See migrateVocabPhaseRemoval in state.js.
    phases: [
      (el, state, ctx) => renderWarmupPhase(el, state, ctx, config),
      (el, state, ctx) => renderObjectivesIntroPhase(el, state, ctx, config),
      (el, state, ctx) => renderLaunchPhase(el, state, ctx, config),
      (el, state, ctx) => renderExplorePhase(el, state, ctx, config),
      (el, state, ctx) => renderPracticePhase(el, state, ctx, config),
      (el, state, ctx) => renderConnectPhase(el, state, ctx, config),
      (el, state, ctx) => renderReflectPhase(el, state, ctx, config),
      (el, state, ctx) => renderObjectivesReviewPhase(el, state, ctx, config),
    ],
  });

  // Slim scroll-progress rail across the top of the lesson (additive, defensive).
  mountReadingProgress();
  // Markup tools (highlight / underline / bold) on EVERY text-based problem —
  // phases render lazily and practice regenerates, so watch the whole page and
  // auto-wire any stem marked data-annotate="word-problem" the moment it mounts.
  observeWordProblemAnnotation(document.body);
  // Hand-drawn chalk marks around key answers (warm-deck skin only, additive).
  mountChalkAnnotations(document);
  // Tools menu → "Interactive Tools" (?mode=tools) when the lesson has any.
  mountToolsMenuItem(config);
}

// ── Helpers ──
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// Derive a SHORT, non-answer-giving scaffold hint for a Level 1 practice item.
// Prefers an authored item.scaffold/item.hint; otherwise builds a type-aware
// nudge ("what to look at / what to ask yourself") from the item's shape. It
// NEVER reveals the choice/index/answer/explanation. Degrades to a generic
// process cue if the item has no usable fields.
function deriveScaffold(prob) {
  if (!prob) return "";
  if (prob.scaffold) return String(prob.scaffold).trim();
  if (prob.hint) return String(prob.hint).trim();

  switch (prob.type) {
    case "multiple-choice":
      return "Read each choice carefully. Cross out the ones you can rule out first, then check the rest against the question.";
    case "drag-sort":
      return "Read each category label first. For every card, ask which label it matches best before you drag it.";
    case "matching-game":
    case "matching":
      return "Start with the pair you are most sure about. Match those first, then use what is left to figure out the rest.";
    case "number-line":
      return "Find 0 and the end points first. Count the equal spaces between the marks before you place your point.";
    case "fill-table":
      return "Fill in the cells you already know first. Look for the pattern or rule between the rows or columns to find the rest.";
    case "coordinate-grid":
    case "coordinate-plane":
      return "Start at the origin (0, 0). Move across for the x value, then up or down for the y value.";
    case "open-response":
      return "Underline what the question is asking. Show your steps and use one number or word from the problem as evidence.";
    case "error-analysis":
      return "Read each step and check it against the rule. Find the first step where the work stops being true.";
    default:
      return "Re-read the question and underline what it is asking. Plan your first step before you answer.";
  }
}

function phaseHeader(el, icon, iconClass, title, desc) {
  const h = document.createElement("div");
  h.className = "section-header";
  h.innerHTML = `
    <div class="section-icon ${iconClass}">${icon}</div>
    <div>
      <div class="section-title">${esc(title)}</div>
      <div class="section-desc">${esc(desc)}</div>
    </div>`;
  el.append(h);
}

function instructionCallout(el, icon, html) {
  const box = document.createElement("div");
  box.className = "instruction-callout";
  box.innerHTML = `<span class="instruction-callout-icon" aria-hidden="true">${icon}</span><span>${html}</span>`;
  el.append(box);
  return box;
}

// Unified visual builder → HTML string. Returns "" for unknown/empty kinds.
function buildVisual(v) {
  if (!v) return "";
  switch (v.kind) {
    // "Data Live" — authored data figures become explore-first interactive
    // widgets (tap to read, reveal mean vs. median, opt-in "What if?" sandbox).
    // The static SVG stays as the JS-off / print fallback so it never blanks.
    case "histogram":
      return interactiveVisualHost(v, {
        ariaLabel: figureAria(v, "Interactive histogram"),
        fallback: histogramSVG(v),
      });
    case "dot-plot":
      return interactiveVisualHost(v, {
        ariaLabel: figureAria(v, "Interactive dot plot"),
        fallback: dotPlotSVG(v),
      });
    case "box-plot":
      return interactiveVisualHost(v, {
        ariaLabel: figureAria(v, "Interactive box plot"),
        fallback: boxPlotSVG(v),
      });
    case "bar-chart":
      return interactiveVisualHost(v, {
        ariaLabel: figureAria(v, "Interactive bar chart"),
        fallback: barChartSVG(v),
      });
    case "number-line": {
      // Three tasks behind one kind: `problems` → the graph-and-read inequality
      // lab, `points` → "place the points", neither → a static reference line.
      // The static line stays as the JS-off / print fallback in every case.
      const isInequality = Array.isArray(v.problems) && v.problems.length > 0;
      return interactiveVisualHost(v, {
        ariaLabel: isInequality
          ? `Inequality graphs to read: ${v.problems.length} graphed inequalities. For each one, read the circle and the shading, then write the inequality it shows.`
          : figureAria(v, "Number line"),
        fallback: numberLineSVG(v),
      });
    }
    case "tape-diagram":
      // Interactive "count the equal parts" tape (interactive-visual bridge).
      // The static SVG stays as the JS-off / print fallback.
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive tape diagram: ${v.title || "count the equal parts"}. Tap each part to count how many equal parts there are in all.`,
        fallback: tapeDiagramSVG(v),
      });
    case "coordinate-plane":
      // Interactive "plot the points" grid (interactive-visual bridge). The
      // static SVG stays as the JS-off / print fallback.
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive coordinate plane: ${v.title || "plot the points"}. Tap the grid to plot each listed point.`,
        fallback: coordPlaneSVG(v),
      });
    case "factor-tree":
      // Fill-in-the-blank factor tree (interactive-visual bridge). The static
      // SVG stays as the JS-off / print fallback so the figure never blanks.
      return interactiveVisualHost(v, {
        ariaLabel: `Fill-in-the-blank factor tree for ${v.value ?? "a number"}. Complete each branch so it multiplies to the number above and every end number is prime.`,
        fallback: factorTreeSVG(v),
      });
    case "solid-3d": {
      // Interactive 3D solid explorer (drag/keyboard rotate, tap faces, unfold
      // net). Emits a mount host that mountInteractiveVisuals() hydrates.
      const shapeName = String(v.shape || "cube").replace(/-/g, " ");
      const labelText = v.label ? ` — ${v.label}` : "";
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive 3D ${shapeName} model${labelText}. Drag or use arrow keys to rotate; unfold its net to see the flat faces.`,
        fallback: `3D ${shapeName} model${labelText}. Turn on JavaScript to rotate it and unfold its net.`,
      });
    }
    case "step-solver": {
      // "Work It Out" step lab: solve line by line; every step is checked for
      // mathematical equivalence (same solution / same value) without ever
      // revealing the answer.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Work It Out step lab. Type each line of your solving work; every step is checked to make sure it stays mathematically equivalent.",
        fallback:
          "Step-by-step solving workspace. Turn on JavaScript to work the problem out line by line with instant feedback.",
      });
    }
    case "decimal-columns": {
      // Vertical decimal add/subtract with hands-on carrying and borrowing:
      // numbers stack aligned by the decimal point, and the student works each
      // column, filling the carry/regroup boxes and the answer.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Vertical decimal addition and subtraction lab. Fill the carry or regroup boxes and the answer, keeping the decimal points lined up.",
        fallback:
          "Vertical decimal add/subtract workspace. Turn on JavaScript to line up the place values and work each column.",
      });
    }
    case "lcm-lab": {
      // Interactive least-common-multiple lab: two lanes of multiples; the
      // student clicks the first value that appears in both lanes.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Least common multiple lab. Two lanes of multiples; click the first number that appears in both lanes.",
        fallback:
          "Least common multiple workspace. Turn on JavaScript to count by each number and find the first shared multiple.",
      });
    }
    case "decimal-product": {
      // Guided multiply-decimals lab: multiply as whole numbers, then place the
      // decimal point by counting decimal places.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Multiply decimals lab. Multiply the digits, count the decimal places, then place the decimal point.",
        fallback:
          "Multiply-decimals workspace. Turn on JavaScript to multiply the digits and place the decimal point.",
      });
    }
    case "decimal-quotient": {
      // Guided divide-decimals lab: shift both decimals to make the divisor
      // whole, then divide.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Divide decimals lab. Shift both decimals to make the divisor whole, then divide.",
        fallback:
          "Divide-decimals workspace. Turn on JavaScript to make the divisor whole and divide.",
      });
    }
    case "fraction-divide": {
      // Guided divide-fractions lab: rewrite to improper fractions, keep–change–
      // flip, then multiply and simplify.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Divide fractions lab. Rewrite as improper fractions, keep change flip, then multiply and simplify.",
        fallback:
          "Divide-fractions workspace. Turn on JavaScript to keep, change, flip, and simplify.",
      });
    }
    case "algebra-expand": {
      // Distribute lab: expand a(x + c) on a tap-to-fill area model.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Distribute lab. Expand a times the quantity x plus c on an area model of x-tiles and unit tiles.",
        fallback: "Distribute workspace. Turn on JavaScript to expand a(x + c) with an area model.",
      });
    }
    case "combine-like-terms": {
      // Combine-like-terms lab: add the x-terms, add the constants, simplify.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Combine like terms lab. Add the x-terms, add the constants, then write the simplified expression.",
        fallback:
          "Combine-like-terms workspace. Turn on JavaScript to combine the x-terms and constants.",
      });
    }
    case "box-plot-builder": {
      // Box-plot construction lab: drag the five-number summary onto a number
      // line over a dot plot of the data; each statistic is coached on Check.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Box plot builder. Drag the minimum, quartile, median, and maximum handles onto the number line to build the box plot from the data.",
        fallback:
          "Box plot construction lab. Turn on JavaScript to drag the five-number summary into place and check your plot.",
      });
    }
    case "histogram-builder": {
      // Histogram construction lab: bin the data and raise each bar to its
      // count; each interval is coached on Check.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Histogram builder. Count how many data values fall in each interval and raise each bar to match to build the histogram.",
        fallback:
          "Histogram construction lab. Turn on JavaScript to build the histogram bar by bar and check your intervals.",
      });
    }
    case "equation-balance-lab": {
      // Interactive equation balance: apply the same operation to both sides
      // and watch the equation transform while the scale stays balanced.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Equation balance lab. Apply the same operation to both sides of the equation to isolate the variable while keeping the scale balanced.",
        fallback:
          "Equation balance scale. Turn on JavaScript to solve the equation by keeping both sides balanced.",
      });
    }
    case "stats-data-lab": {
      // Interactive data workbench: build a data set and watch mean, median,
      // mode, range, and MAD update live over a dot plot.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Data lab. Add or remove data values and watch the mean, median, mode, range, and mean absolute deviation update over a dot plot.",
        fallback:
          "Interactive data lab. Turn on JavaScript to build a data set and see its center and spread measures update live.",
      });
    }
    case "number-line-explorer": {
      // Interactive number line: drag a point to see absolute value as its
      // distance from zero (and its opposite), or compare two numbers.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Number line explorer. Drag a point to see its absolute value as the distance from zero, along with its opposite, or compare two numbers.",
        fallback:
          "Interactive number line. Turn on JavaScript to drag a point and explore absolute value and opposites.",
      });
    }
    case "line-grapher": {
      // Draggable y = kx grapher for proportional relationships / linear equations.
      const yN = v.yName || "y";
      const xN = v.xName || "x";
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive y = kx grapher relating ${yN} to ${xN}. Adjust the constant to see the line, table, and points update.`,
        fallback: `Interactive grapher for ${yN} versus ${xN}. Turn on JavaScript to drag the line and read values.`,
      });
    }
    case "area-morph": {
      // Animated area-transformation explorer: drag the slider to shear,
      // rotate-copy, or decompose the figure into one whose area is known.
      const figName = String(v.figure || "parallelogram").replace(/-/g, " ");
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive area transformation for a ${figName}. Drag the Transform slider to rearrange it into a shape whose area formula you know.`,
        fallback: `Area transformation explorer for a ${figName}. Turn on JavaScript to animate the figure into a known shape.`,
      });
    }
    case "stat-towers": {
      // 3D data towers: tap to change values; "Level them" animates the mean.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive 3D data towers. Tap a tower to change its value, then level the towers to see the mean as the fair-share height.",
        fallback:
          "Interactive 3D data towers. Turn on JavaScript to build data and level the towers to find the mean.",
      });
    }
    case "dist-explorer": {
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive distribution explorer. Tap the number line to add data points and watch the mean, median, and mode update.",
        fallback:
          "Interactive distribution explorer. Turn on JavaScript to build a data set and see the mean, median, and mode.",
      });
    }
    case "cross-section": {
      const shapeName = String(v.shape || "rectangular-prism").replace(/-/g, " ");
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive cross-section explorer for a ${shapeName}. Move the slice plane up and down to see the 2D shape each slice makes.`,
        fallback: `Cross-section explorer for a ${shapeName}. Turn on JavaScript to slice it and see the 2D cross-sections.`,
      });
    }
    case "net-folder": {
      // Fold a 2D net into a 3D solid. It has been in the interactive-visual
      // REGISTRY (for small-group labs, which mount via figureBlock) without a
      // case here, so a lesson that authored it as a `diagram` rendered nothing
      // at all — scripts/validate-lesson-visuals.mjs is the gate that sees this.
      const solidName = String(v.solid || v.shape || "cube").replace(/-/g, " ");
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive net folder for a ${solidName}. Drag the Fold slider to fold the flat net into the solid and count its faces.`,
        fallback: `Net folder for a ${solidName}. Turn on JavaScript to fold the flat net into the solid.`,
      });
    }
    case "manip": {
      // Any shared/projects manipulative (number-line, fraction-bar,
      // algebra-tiles, …) surfaced via the interactive-visual bridge.
      const name = String(v.manip || "").replace(/-/g, " ");
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive ${name} manipulative. Explore it to build and check your thinking.`,
        fallback: `Interactive ${name} manipulative. Turn on JavaScript to use it.`,
      });
    }
    case "factor-tree-lab": {
      // Interactive prime-factorization lab: students type a number and build
      // its factor tree; "gcf" / "lcm" modes compare two numbers.
      const modeLabel =
        v.mode === "gcf"
          ? "find the greatest common factor of two numbers"
          : v.mode === "lcm"
            ? "find the least common multiple of two numbers"
            : "break a number into its prime factors";
      return interactiveVisualHost(v, {
        ariaLabel: `Interactive factor tree lab. Type a number and build its prime factor tree to ${modeLabel}.`,
        fallback: `Interactive factor tree builder. Turn on JavaScript to type a number and build its factor tree.`,
      });
    }
    case "power-builder": {
      // Interactive powers & exponents lab: type a base and exponent, expand
      // into repeated multiplication, and evaluate.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive powers and exponents lab. Type a base and an exponent to expand the power into repeated multiplication and evaluate it.",
        fallback:
          "Interactive powers and exponents builder. Turn on JavaScript to type a base and exponent and expand the power.",
      });
    }
    case "distributive-builder": {
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive distributive property lab. Type a, b, and c to see an area model of a times the quantity b plus c and how it equals a·b plus a·c.",
        fallback:
          "Interactive distributive property builder. Turn on JavaScript to model a(b + c) = a·b + a·c.",
      });
    }
    case "percent-grid": {
      // Hundred-square grid: shade squares and reveal the SAME amount written
      // three ways — percent, decimal, fraction.
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive hundred-square percent grid. Tap squares to change how much is shaded, then reveal the same amount as a percent, a decimal, and a fraction.",
        fallback:
          "Interactive hundred-square grid. Turn on JavaScript to shade squares and read the amount as a percent, a decimal, and a fraction.",
      });
    }
    case "percent-builder": {
      return interactiveVisualHost(v, {
        ariaLabel: v.apply
          ? "Interactive percent problem lab. Type a percent and a price, then choose whether the amount is taken off (discount) or added on (tax, tip, markup) to see the finished total."
          : "Interactive percent-of-a-number lab. Type a percent and a whole to find that part on a double number line.",
        fallback: v.apply
          ? "Interactive percent problem lab. Turn on JavaScript to find a percent of a price and then take it off or add it on."
          : "Interactive percent-of-a-number builder. Turn on JavaScript to find a percent of a number.",
      });
    }
    case "unit-rate-builder": {
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive unit-rate lab. Type two quantities and divide to find each per-one rate.",
        fallback: "Interactive unit-rate builder. Turn on JavaScript to find the unit rate.",
      });
    }
    case "long-division-builder": {
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive long-division lab. Work the standard algorithm one step at a time — divide, multiply, subtract, bring down, repeat — to find the quotient and remainder.",
        fallback:
          "Interactive long-division builder. Turn on JavaScript to work the divide, multiply, subtract, bring down cycle.",
      });
    }
    case "ratio-table-builder": {
      return interactiveVisualHost(v, {
        ariaLabel:
          "Interactive ratio-table lab. Type a ratio to build a table of equivalent ratios and read the unit rate.",
        fallback:
          "Interactive ratio-table builder. Turn on JavaScript to build a table of equivalent ratios.",
      });
    }
    default:
      return "";
  }
}

function renderLaunchVisual(host, visual) {
  if (!visual) return;
  if (visual.kind === "data-chips" && Array.isArray(visual.values)) {
    const card = document.createElement("div");
    card.style.cssText =
      "margin-top:var(--sp-4); padding:var(--sp-4); background:var(--cream,#fdf6ec); border:1px solid rgba(0,0,0,0.06); border-radius:var(--radius-md,12px);";
    const chips = visual.values
      .map(
        (v) =>
          `<span style="display:inline-flex; align-items:center; justify-content:center; min-width:34px; padding:4px 8px; background:#fff; border:1px solid rgba(42,157,143,0.4); border-radius:8px; font-weight:700; color:var(--navy,#264653); font-size:0.9rem;">${esc(v)}</span>`,
      )
      .join("");
    card.innerHTML =
      (visual.title
        ? `<div style="font-weight:700; color:var(--navy,#264653); margin-bottom:var(--sp-3); display:flex; align-items:center; gap:8px;"><span>📊</span><span>${esc(visual.title)}</span></div>`
        : "") +
      `<div style="display:flex; flex-wrap:wrap; gap:8px;">${chips}</div>` +
      (visual.unit
        ? `<div style="font-size:0.8rem; color:var(--muted); margin-top:var(--sp-2);">${esc(visual.unit)}</div>`
        : "");
    host.append(card);
  } else {
    const html = buildVisual(visual);
    if (html) {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = html;
      host.append(card);
      mountInteractiveVisuals(card);
    }
  }
}

// (The Launch concept-teaching block was removed: the lesson's conceptIntro now
// renders in exactly one student-facing place — the Learn It page — instead of
// triple-rendering across Launch, Learn It, and Notes.)
//
// The old renderLearnItBridge "Open Learn It" CTA was removed too: the curated
// flow now routes students Launch (Be Curious) → Vocab → Learn It → Lesson via
// the Continue buttons on each panel, so a stray Launch shortcut into Learn It
// (which would bypass Vocab) is no longer wanted. The Launch scenario + Show
// Your Work now render UNDER the Learn It panel — see ctx.renderLearnItExtras in
// renderLaunchPhase and app.js openExtra("learn").

// ── Turn & Talk (non-graded student discussion moments) ──────────────────────
// A reusable, visually distinct "🗣️ Turn & Talk" block. It is driven by an
// optional config field `config.turnAndTalk` (array of
// `{ phase, question, stems:[...] }`) but ALWAYS falls back to engine defaults
// so every lesson surfaces at least one discussion moment per supported phase.
// Turn & Talk never affects phase completion, scoring, stars, or XP — it is a
// purely formative prompt the student confirms with a "We talked! ✓" button.

// Bilingual sentence stems used when a lesson supplies none of its own.
const DEFAULT_TURN_TALK_STEMS = [
  { en: "I think ___ because ___.", es: "Pienso que ___ porque ___." },
  { en: "First I ___, then I ___.", es: "Primero ___, luego ___." },
  {
    en: "I agree / disagree because ___.",
    es: "Estoy de acuerdo / en desacuerdo porque ___.",
  },
];

// Build a generic, topic-aware prompt for a phase when the lesson has no
// authored turn-and-talk entry. Keeps language simple for English learners.
function defaultTurnTalkPrompt(phase, config) {
  const topic = config.title || "today's math";
  if (phase === "explore") {
    return {
      phase,
      question: `Turn and talk: explain your thinking about ${topic} to your partner.`,
      stems: DEFAULT_TURN_TALK_STEMS,
    };
  }
  return {
    phase,
    question: `Turn and talk: how does ${topic} connect to the real world or to what you already know?`,
    stems: DEFAULT_TURN_TALK_STEMS,
  };
}

// Genuine "press for reasoning" follow-ups. A post-activity discussion must ask
// something NEW — why a strategy works, when it breaks, how to convince a
// partner — never a verbatim repeat of the activity/discourse prompt.
// Universally-sensible reasoning prompts — every one fits any math topic and
// none presuppose the method can "fail" (which reads oddly for always-true
// formulas). Used only when the lesson gives us no keywords/authored follow-up.
const DISCUSS_FOLLOWUPS = [
  "Why does this method work — what makes it true every time?",
  "How could you convince a partner that your answer is right?",
  "What is one mistake someone could make here, and how would you catch it?",
  "How would you explain your steps to someone who was absent today?",
  "What stays the same, and what changes, if the numbers were different?",
];

// Turn an authored discourse SEED into a DISTINCT spoken follow-up question.
// Preference order: (1) an explicitly authored follow-up; (2) a KEYWORD prompt
// that asks students to reason using the activity's own math vocabulary — always
// on-topic and distinct from the activity's question; (3) a generic reasoning
// prompt, chosen deterministically per lesson so it stays stable across renders.
function deriveDiscussionFollowUp(seed, config, opts = {}) {
  if (opts.authored && String(opts.authored).trim()) return String(opts.authored).trim();

  // Keep only real vocabulary words (drop bare numbers like "48" / "1/2").
  const kws = (Array.isArray(opts.keywords) ? opts.keywords : [])
    .map((k) => String(k || "").trim())
    .filter((k) => /[a-zA-Z]/.test(k))
    .slice(0, 3);
  if (kws.length >= 2) {
    return `Explain to your partner HOW you got your answer, using the words: ${kws.join(", ")}.`;
  }

  const key = String(config.lessonId || config.title || (seed ?? "lesson"));
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return DISCUSS_FOLLOWUPS[h % DISCUSS_FOLLOWUPS.length];
}

// Resolve the turn-and-talk prompt for a given phase: prefer the authored
// config entry, otherwise return the engine default so the block always shows.
function resolveTurnTalk(phase, config) {
  const authored = Array.isArray(config.turnAndTalk)
    ? config.turnAndTalk.find((t) => t && t.phase === phase)
    : null;
  if (authored && authored.question) {
    // Normalize stems: accept ["..."] strings or {en, es} objects.
    const stems =
      Array.isArray(authored.stems) && authored.stems.length
        ? authored.stems.map((s) =>
            typeof s === "string" ? { en: s, es: "" } : { en: s.en || "", es: s.es || "" },
          )
        : DEFAULT_TURN_TALK_STEMS;
    // Surface the richer authored fields so the live lesson mirrors the notes:
    // a Level 1 "Start here" kernel + word bank, and a Level 2 extend prompt
    // with stretch stems. `listenFor` is intentionally omitted (teacher-only).
    const wordBank = Array.isArray(authored.wordBank) ? authored.wordBank.filter(Boolean) : [];
    const kernel = typeof authored.kernel === "string" ? authored.kernel.trim() : "";
    const extend = typeof authored.extend === "string" ? authored.extend.trim() : "";
    const extendStems = Array.isArray(authored.extendStems)
      ? authored.extendStems.filter(Boolean)
      : [];
    return {
      phase,
      question: authored.question,
      stems,
      kernel,
      wordBank,
      extend,
      extendStems,
    };
  }
  return defaultTurnTalkPrompt(phase, config);
}

let turnTalkSeq = 0;

// Render the Turn & Talk card into `host`. Calls `onDone` (if given) when the
// student confirms they talked. Fully keyboard- and screen-reader-accessible.
// `config` is needed for the unit (the span the scaffold ladder counts over) —
// see frame-fading.js. Appended rather than inserted so the existing positional
// call sites keep reading naturally.
function renderTurnAndTalk(host, prompt, state, phaseId, onDone, config) {
  const uid = `tt-${phaseId}-${turnTalkSeq++}`;
  const respKey = `turntalk_${prompt.phase}`;
  const alreadyDone = state.getResponse(phaseId, respKey) === "done";

  const card = document.createElement("section");
  card.className = "card card-coral turn-talk speech-bubble-card";
  card.setAttribute("aria-labelledby", `${uid}-title`);

  const stemsHtml = prompt.stems
    .map(
      (s) => `
      <li class="sentence-frame" style="margin-bottom:var(--sp-2); list-style:none;">
        <span style="font-weight:700;">${esc(s.en)}</span>
        ${s.es ? `<span style="display:block; color:var(--muted); font-style:italic; font-weight:600;">${esc(s.es)}</span>` : ""}
      </li>`,
    )
    .join("");

  // Level 1 (support): a "Start here" kernel + a word-bank chip strip. Both are
  // optional — older configs without these fields simply render nothing here.
  const kernelHtml = prompt.kernel
    ? `<p style="margin:0 0 var(--sp-3); font-weight:600;"><span style="display:inline-block; font-weight:800; color:var(--coral); margin-right:var(--sp-2);">Start here:</span>${esc(prompt.kernel)}</p>`
    : "";
  const wordBankHtml =
    Array.isArray(prompt.wordBank) && prompt.wordBank.length
      ? `<div style="margin:0 0 var(--sp-3);">
      <span style="font-weight:700; margin-right:var(--sp-2);">Word bank:</span>
      <span style="display:inline-flex; flex-wrap:wrap; gap:var(--sp-2); vertical-align:middle;">${prompt.wordBank
        .map((w) => `<span class="badge badge-teal">${esc(w)}</span>`)
        .join("")}</span>
    </div>`
      : "";
  // Scaffold fading: how much of the support block LEADS depends on how much
  // Turn & Talk this student has already done in this unit (see frame-fading.js).
  // Everything the fade hides stays one tap away — the "Show sentence starters"
  // control below restores the full block, always, at no cost.
  const frameLevel = resolveFrameLevel({
    unit: config?.unit,
    chosenLevel: getLevel(state),
  });
  const parts = framePartsFor(frameLevel);
  const fadeNote = fadeNoteFor(frameLevel);

  const shownStemsHtml =
    parts.stems === 0
      ? ""
      : prompt.stems
          .slice(0, parts.stems === Number.POSITIVE_INFINITY ? undefined : parts.stems)
          .map(
            (s) => `
      <li class="sentence-frame" style="margin-bottom:var(--sp-2); list-style:none;">
        <span style="font-weight:700;">${esc(s.en)}</span>
        ${s.es ? `<span style="display:block; color:var(--muted); font-style:italic; font-weight:600;">${esc(s.es)}</span>` : ""}
      </li>`,
          )
          .join("");

  const supportInner = (kernel, stems, bank, showLabel) => `
      ${showLabel ? '<span class="badge badge-teal" style="margin-bottom:var(--sp-2);">Sentence support</span>' : ""}
      ${kernel}
      ${stems ? `<p style="font-weight:700; margin:var(--sp-2) 0 var(--sp-2);">Use a sentence starter / <span style="font-style:italic;">Usa un inicio de oración</span>:</p><ul style="margin:0 0 var(--sp-3); padding:0;">${stems}</ul>` : ""}
      ${bank}`;

  const shownKernel = parts.kernel ? kernelHtml : "";
  const shownBank = parts.wordBank ? wordBankHtml : "";
  const hasShownSupport = Boolean(shownKernel || shownBank || shownStemsHtml);
  const hasMoreSupport =
    Boolean(kernelHtml || wordBankHtml || stemsHtml) &&
    (parts.stems !== Number.POSITIVE_INFINITY || !parts.kernel || !parts.wordBank);

  const supportHtml = hasShownSupport
    ? `<div class="tt-support" style="border-left:4px solid var(--teal); padding-left:var(--sp-3); margin:0 0 var(--sp-4);">
      ${supportInner(shownKernel, shownStemsHtml, shownBank, true)}
      ${fadeNote ? `<p class="tt-fade-note" style="margin:0; font-size:0.85rem; color:var(--muted);">${esc(fadeNote)}</p>` : ""}
    </div>`
    : fadeNote
      ? `<p class="tt-fade-note" style="margin:0 0 var(--sp-3); font-size:0.85rem; color:var(--muted);">${esc(fadeNote)}</p>`
      : "";

  // Level 2 (enrichment): a deeper "extend" push question + stretch stems.
  const extendStemsHtml =
    Array.isArray(prompt.extendStems) && prompt.extendStems.length
      ? `<ul style="margin:var(--sp-2) 0 0; padding-left:var(--sp-4);">${prompt.extendStems
          .map((s) => `<li style="margin-bottom:var(--sp-1);">${esc(s)}</li>`)
          .join("")}</ul>`
      : "";
  const extendHtml =
    prompt.extend || extendStemsHtml
      ? `<div style="border-left:4px solid var(--amber); padding-left:var(--sp-3); margin:0 0 var(--sp-3);">
      <span class="badge badge-amber" style="margin-bottom:var(--sp-2);">Level 2</span>
      ${prompt.extend ? `<p style="font-weight:700; margin:0;">${esc(prompt.extend)}</p>` : ""}
      ${extendStemsHtml}
    </div>`
      : "";

  card.innerHTML = `
    <div style="display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-2);">
      <span style="font-size:1.6rem;" aria-hidden="true">🗣️</span>
      <h4 id="${uid}-title" style="color:var(--coral); margin:0;">Turn &amp; Talk</h4>
    </div>
    <p style="font-weight:700; font-size:1.05rem; margin:0 0 var(--sp-3);">${esc(prompt.question)}</p>
    <div style="display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-bottom:var(--sp-3);">
      <span class="badge badge-teal">🅰️ Partner A shares first</span>
      <span class="badge badge-amber">🅱️ Partner B goes next</span>
    </div>
    ${supportHtml}
    ${extendHtml}
  `;

  // The escape hatch that makes fading legitimate. It is a plain, unremarkable
  // button — no "are you sure", no counter, nothing recorded — because a student
  // who hesitates to ask for the frames will simply not talk instead.
  if (hasMoreSupport) {
    const moreBtn = document.createElement("button");
    moreBtn.type = "button";
    moreBtn.className = "btn btn-secondary btn-sm tt-show-frames";
    moreBtn.style.cssText = "margin:0 0 var(--sp-3);";
    moreBtn.textContent = "Show sentence starters";
    moreBtn.addEventListener("click", () => {
      const full = document.createElement("div");
      full.className = "tt-support tt-support-full";
      full.style.cssText =
        "border-left:4px solid var(--teal); padding-left:var(--sp-3); margin:0 0 var(--sp-4);";
      full.innerHTML = supportInner(kernelHtml, stemsHtml, wordBankHtml, true);
      moreBtn.replaceWith(full);
      card.querySelector(".tt-fade-note")?.remove();
    });
    card.append(moreBtn);
  }

  // Optional ~60s talk timer (low-friction, fully optional).
  const timerRow = document.createElement("div");
  timerRow.style.cssText =
    "display:flex; align-items:center; gap:var(--sp-3); flex-wrap:wrap; margin-bottom:var(--sp-3);";
  const timerBtn = document.createElement("button");
  timerBtn.type = "button";
  timerBtn.className = "btn btn-secondary";
  timerBtn.textContent = "⏱️ Start 60s timer";
  const timerLabel = document.createElement("span");
  timerLabel.setAttribute("role", "timer");
  timerLabel.setAttribute("aria-live", "polite");
  timerLabel.style.cssText = "font-weight:800; color:var(--coral);";
  let timerId = null;
  timerBtn.addEventListener("click", () => {
    if (timerId) return;
    let remaining = 60;
    timerLabel.textContent = `0:${String(remaining).padStart(2, "0")}`;
    timerBtn.disabled = true;
    timerBtn.style.opacity = "0.6";
    timerId = setInterval(() => {
      remaining--;
      timerLabel.textContent = `0:${String(Math.max(remaining, 0)).padStart(2, "0")}`;
      if (remaining <= 0) {
        clearInterval(timerId);
        timerId = null;
        timerLabel.textContent = "⏰ Time! Wrap up your ideas.";
        timerBtn.disabled = false;
        timerBtn.style.opacity = "1";
        timerBtn.textContent = "⏱️ Restart 60s timer";
      }
    }, 1000);
  });
  timerRow.append(timerBtn, timerLabel);
  card.append(timerRow);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "btn btn-primary";
  const markDone = ({ fresh = false } = {}) => {
    confirmBtn.textContent = "We talked! ✓";
    confirmBtn.classList.add("btn-success");
    confirmBtn.setAttribute("aria-pressed", "true");
    confirmBtn.disabled = true;
    state.saveResponse(phaseId, respKey, "done");
    // Only a NEW completion advances the ladder. Re-rendering a lesson the
    // student already finished must not fast-forward their scaffolding.
    if (fresh) recordTurnAndTalk(config?.unit);
  };
  if (alreadyDone) {
    markDone();
  } else {
    confirmBtn.textContent = "We talked! ✓";
    confirmBtn.setAttribute("aria-pressed", "false");
    confirmBtn.addEventListener("click", () => {
      markDone({ fresh: true });
      onDone?.();
    });
  }
  card.append(confirmBtn);

  host.append(card);
  return card;
}

async function completePhase(el, ctx, state, phaseIdx, name, correct, total, opts = {}) {
  // phaseIdx is the legacy five-phase semantic index used by authored lesson
  // renderers. The shared shell now has Warmup + Objectives before those
  // phases, so navigation and progress must use the phase currently on screen.
  // Reading live state also keeps completion correct after resume/sidebar use.
  const activePhaseIdx = state.get().currentPhase ?? phaseIdx;
  // Participation coins for non-practice phases
  if (activePhaseIdx !== 4) {
    state.awardPhaseParticipation(activePhaseIdx, 2);
  }
  const xp = ctx.engagement.awardXP(activePhaseIdx, { correct, total });
  // `quiet` skips the full "Phase Done! → up next" celebration. Used for the
  // Launch → Vocab hand-off, where the student is stepping into the Vocab →
  // Learn It pre-work, NOT the next graded phase — a "Continue to Explore" card
  // there would be misleading. Awards + phase advance still happen underneath.
  if (!opts.quiet) {
    const stars = state.get().phases[activePhaseIdx]?.stars ?? 0;
    const transitionMeta = buildPhaseTransitionMeta(state, activePhaseIdx, name, xp, stars);
    await ctx.engagement.showPhaseComplete(el, name, xp, stars, transitionMeta);
  }
  ctx.nextPhase();
}

/**
 * Misconception capture on wrong answers. The tag comes from optional config
 * authoring — `misconceptionTags[i]` (one per choice) or a single
 * `misconceptionTag` on the item. Untagged wrong answers are simply not
 * reported here (recordAnswer already counts them). All sinks are optional:
 * lesson state (persists per student), NTtelemetry (teacher radar/mastery),
 * and NTSignal (device-local, drives arcade difficulty + hub suggestions).
 */
function reportMisconception(problemDef, selected, state) {
  try {
    // Authored tag first, then the inference engine. Before this, the ONLY items
    // that could ever report a named misconception were the 91 (of 1,840) that
    // carried an authored `misconceptionTags` array — every other wrong answer
    // recorded a bare `correct: false` and the teacher heatmap saw nothing but a
    // miss count. diagnoseChoice() reads the stem and predicts what each named
    // error would produce, and stays silent when two of them predict the same
    // number, so a tag here still means one specific thing.
    const inferred = diagnoseChoice(problemDef, selected);
    const tag =
      (Array.isArray(problemDef.misconceptionTags) &&
        selected != null &&
        problemDef.misconceptionTags[selected]) ||
      problemDef.misconceptionTag ||
      inferred?.id ||
      null;
    const meta = (typeof window !== "undefined" && window.__ntLessonMeta) || {};
    if (window.NTSignal)
      window.NTSignal.record({
        standard: meta.standard || "",
        correct: false,
        misconceptionTag: tag || undefined,
        lesson: meta.lesson,
      });
    if (!tag) return;
    if (state && state.recordMisconception) state.recordMisconception(tag);
    if (window.NTtelemetry)
      window.NTtelemetry.track("misconception", { tag, standard: meta.standard || "" });
  } catch {
    /* signals must never break a lesson */
  }
}

export function renderComponent(container, problemDef, onAnswer, shellOpts) {
  const useShell = shellOpts && shellOpts.number != null;
  let body = container;
  let setResult = () => {};

  if (useShell) {
    const shell = createProblemCard({
      number: shellOpts.number,
      total: shellOpts.total,
      tier: shellOpts.tier,
      typeLabel: problemTypeLabel(problemDef),
      stem: problemDef.stem || problemDef.prompt || problemDef.label,
    });
    container.append(shell.card);
    body = shell.body;
    setResult = shell.setResult;

    if (shellOpts.state && !shellOpts.skipHints) {
      mountHintLadder(shell.card, {
        problem: problemDef,
        state: shellOpts.state,
      });
    }
    // Hide duplicate stem inside child components when shell shows it
    if (problemDef.stem || problemDef.prompt) {
      problemDef = { ...problemDef, hideStem: true };
    }
  }

  const wrappedOnAnswer = (isCorrect, selected) => {
    if (useShell) setResult(isCorrect ? "correct" : "incorrect");
    if (!isCorrect) reportMisconception(problemDef, selected, shellOpts && shellOpts.state);
    onAnswer?.(isCorrect);
  };

  // Optional per-item visual: an explicit or auto-extracted `diagram`
  // (long-division-builder, factor-tree, tape-diagram, …) renders above the
  // component through the buildVisual bridge.
  const itemDiagram = problemDef.diagram || extractDivisionDiagram(problemDef);
  if (itemDiagram?.kind) {
    const fig = document.createElement("div");
    fig.className = "problem-item-figure";
    fig.innerHTML = buildVisual(itemDiagram);
    if (fig.firstElementChild) {
      body.append(fig);
      mountInteractiveVisuals(fig);
    }
  }

  switch (problemDef.type) {
    case "multiple-choice":
      renderMultipleChoice(body, { ...problemDef, onAnswer: wrappedOnAnswer });
      break;
    case "drag-sort":
      if (problemDef.instructions) {
        const p = document.createElement("p");
        p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
        p.textContent = problemDef.instructions;
        body.append(p);
      }
      renderDragSort(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "wodb":
      // Ungradeable by construction: every quadrant is defensible, so the
      // component always reports true. Authors put it in Launch or Connect,
      // never inside a scored practice set.
      renderWhichOneDoesntBelong(body, {
        ...problemDef,
        onComplete: () => wrappedOnAnswer(true),
      });
      break;
    case "error-analysis":
      renderErrorAnalysis(body, {
        ...problemDef,
        onAnswer: (ok) => wrappedOnAnswer(ok),
      });
      break;
    case "fill-table":
      renderFillTable(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "number-line":
      renderNumberLine(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "coordinate-grid":
      renderCoordinateGrid(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "matching-game":
      renderMatchingGame(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "matching": {
      const pairs = (problemDef.pairs || []).map((p) => ({
        term: p.left || p.term || p.prompt || "",
        match: p.right || p.match || p.answer || "",
      }));
      renderMatchingGame(body, {
        pairs,
        columns: problemDef.columns || 2,
        label: problemDef.hideStem ? problemDef.label : problemDef.stem || problemDef.label,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    }
    case "bar-model":
      renderBarModel(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "balance-scale":
      renderBalanceScale(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "algebra-tiles":
      renderAlgebraTiles(body, {
        ...problemDef,
        onComplete: (c) => wrappedOnAnswer(c > 0),
      });
      break;
    case "fraction-bars":
      renderFractionBars(body, {
        ...problemDef,
        onComplete: (c) => wrappedOnAnswer(c > 0),
      });
      break;
    case "net-folder":
      renderNetFolder(body, {
        ...problemDef,
        onComplete: (c) => wrappedOnAnswer(c > 0),
      });
      break;
    case "coordinate-plane":
      renderCoordinatePlane(body, {
        ...problemDef,
        onComplete: (c, t) => wrappedOnAnswer(c === t),
      });
      break;
    case "open-response":
      renderOpenResponse(body, {
        ...problemDef,
        onSubmit: (_text, ok) => wrappedOnAnswer(ok),
      });
      break;
    default:
      renderUnknownComponentFallback(body, problemDef);
      {
        const continueBtn = document.createElement("button");
        continueBtn.type = "button";
        continueBtn.className = "btn btn-secondary mt-4";
        continueBtn.textContent = "Continue";
        continueBtn.addEventListener("click", () => wrappedOnAnswer(true));
        body.append(continueBtn);
      }
  }

  // Teacher Mode: let a teacher advance past any item WITHOUT doing the work,
  // so they can walk/project the whole lesson freely. Students never see this.
  // It runs the same completion path as a correct answer, so the practice
  // sequence (and phase) advances normally.
  if (isTeacherMode()) {
    const skip = document.createElement("button");
    skip.type = "button";
    skip.className = "btn btn-secondary btn-sm teacher-skip no-print";
    skip.textContent = "⏭ Next (teacher)";
    skip.title = "Teacher Mode — advance without answering";
    skip.addEventListener("click", () => wrappedOnAnswer(true));
    body.append(skip);
  }
}

// Readable, non-blank fallback for component types the renderer does not know.
// Shows instructions and any items/rows as text instead of rendering nothing.
function renderUnknownComponentFallback(container, def = {}) {
  const card = document.createElement("div");
  card.className = "card";

  const text = def.instructions || def.label || def.prompt || def.stem;
  if (text) {
    const p = document.createElement("p");
    p.style.cssText = "font-weight:600; margin-bottom:var(--sp-3);";
    p.textContent = text;
    card.append(p);
  }

  const source = Array.isArray(def.items) ? def.items : Array.isArray(def.rows) ? def.rows : [];
  const cols = Array.isArray(def.columns)
    ? def.columns
    : Array.isArray(def.headers)
      ? def.headers
      : [];

  if (source.length) {
    const list = document.createElement("ul");
    list.style.cssText = "margin:0; padding-left:1.2rem; line-height:1.6;";
    source.forEach((row) => {
      const li = document.createElement("li");
      if (row && typeof row === "object" && !Array.isArray(row)) {
        const keys = Object.keys(row);
        li.textContent = keys.map((k, i) => `${cols[i] || k}: ${row[k]}`).join("  ·  ");
      } else if (Array.isArray(row)) {
        li.textContent = row.map((v, i) => `${cols[i] ? cols[i] + ": " : ""}${v}`).join("  ·  ");
      } else {
        li.textContent = String(row);
      }
      list.append(li);
    });
    card.append(list);
  } else if (!text) {
    card.innerHTML = `<p class="feedback feedback-hint visible"><span>Content type "${esc(
      def.type,
    )}" is not yet interactive here.</span></p>`;
  }

  container.append(card);
}

// ── Reveal Math slides (inline, additive) ───────────────────────────────────
// A sibling pipeline may write `config.revealSlides`: an array of
//   { src, caption?, placement, page? }
// where `placement` is one of the canonical sections:
//   launch | explore | vocabulary | instruction | practice | connect | closure
//
// Each lesson section renders the slides whose placement maps to it, appended
// at the END of that section's content. Section ↔ placement mapping:
//   Launch  ← launch, instruction   (no dedicated "instruction" phase exists;
//                                     Launch holds the teaching/concept block,
//                                     so it is the nearest sensible home)
//   Vocab   ← vocabulary            (the Vocab phase IS rendered separately)
//   Explore ← explore
//   Practice← practice
//   Connect ← connect
//   Reflect ← closure               (Reflect is the closing/reflect section)
// Every placement therefore surfaces in exactly one rendered section; none are
// silently dropped.
//
// STRICT no-op guarantee: when `config.revealSlides` is missing, not an array,
// or contains no slide for the requested placement(s), this appends NOTHING —
// no container, no heading, no console output. Lessons without the field render
// byte-for-byte as before.
function revealSlidesFor(config, placements) {
  const all = Array.isArray(config?.revealSlides) ? config.revealSlides : [];
  if (!all.length) return [];
  const wanted = Array.isArray(placements) ? placements : [placements];
  return all.filter((s) => s && typeof s.src === "string" && s.src && wanted.includes(s.placement));
}

// Append an accessible Reveal Math figure list for the given placement(s) to
// `host`. Returns early (no DOM) when there are no matching slides.
function renderRevealSlides(host, config, placements) {
  const slides = revealSlidesFor(config, placements);
  if (!slides.length) return;

  const section = document.createElement("section");
  section.className = "reveal-slides";
  section.setAttribute("aria-label", "Reveal Math slides");

  const heading = document.createElement("div");
  heading.className = "reveal-slides-heading";
  heading.innerHTML = `<span class="reveal-slides-tag" aria-hidden="true">📘 Reveal Math</span>`;
  section.append(heading);

  slides.forEach((slide, i) => {
    const fig = document.createElement("figure");
    fig.className = "reveal-slides-figure";

    const img = document.createElement("img");
    img.className = "reveal-slides-img";
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = slide.src;
    const pageNum = Number.isFinite(slide.page) ? slide.page : i + 1;
    img.alt = slide.caption ? String(slide.caption) : `Reveal Math slide ${pageNum}`;
    fig.append(img);
    attachImageZoom(img);

    if (slide.caption) {
      const cap = document.createElement("figcaption");
      cap.className = "reveal-slides-caption";
      cap.textContent = String(slide.caption);
      fig.append(cap);
    }

    section.append(fig);
  });

  host.append(section);
}

// ── Click-to-zoom for lesson content images ─────────────────────────────────
// Photo figures (Notice & Wonder, Reveal Math slides, word-problem images) and
// vocabulary illustrations open in a shared, accessible full-screen lightbox on
// click / Enter / Space. The implementation lives in ./image-zoom.js so the
// vocabulary surfaces that never load this file (the small-group word wall and
// the generated vocab.html page) can use the very same affordance.

// ── Notice & Wonder (Reveal data-context) ───────────────────────────────────
// Opt-in card driven by `config.noticeAndWonder`. Rendered immediately after the
// Launch Objectives block. Shows a data-context image, a framing sentence, then
// two columns ("What do you notice?" / "What do you wonder?"), each with tappable
// sentence-starter chips that insert into a typeable textarea. The textareas
// persist via the lesson's canonical save/resume API (state.saveResponse /
// state.getResponse on phaseId 0 — the Launch phase — with stable keys), so
// answers survive reload exactly like every other lesson input.
//
// STRICT no-op: when `config.noticeAndWonder` is absent or not an object, this
// renders NOTHING — no container, no heading, no console output.
function renderNoticeAndWonder(host, config, state) {
  const nw = config && config.noticeAndWonder;
  if (!nw || typeof nw !== "object") return;

  const noticeStarters = Array.isArray(nw.noticeStarters)
    ? nw.noticeStarters.filter((s) => typeof s === "string" && s.trim())
    : [];
  const wonderStarters = Array.isArray(nw.wonderStarters)
    ? nw.wonderStarters.filter((s) => typeof s === "string" && s.trim())
    : [];

  const card = document.createElement("section");
  card.className = "card nw-card";
  card.setAttribute("aria-label", "Notice and Wonder");

  const head = document.createElement("div");
  head.className = "nw-head";
  head.innerHTML = `
    <h3 class="nw-title">👀 Notice &amp; Wonder</h3>`;
  card.append(head);

  if (nw.context) {
    const ctxP = document.createElement("p");
    ctxP.className = "nw-context";
    ctxP.textContent = String(nw.context);
    card.append(ctxP);
  }

  // Image and the notice/wonder boxes sit SIDE BY SIDE (image left, boxes right)
  // so students can look at the scene while they write. `.nw-layout` stacks to a
  // single column on narrow screens.
  const layout = document.createElement("div");
  layout.className = "nw-layout";

  const objVisuals = resolveObjectiveVisuals(config);
  // Only ever show the lesson's OWN data-context image. This used to fall back to
  // the generic objective illustration, which put a stock classroom scene next to
  // starters like "I notice the two totals differ by ___" — 29 lessons author no
  // nw.image, so every one of them asked students to describe a picture that was
  // not about their problem. `.nw-layout-noimg` already handles the no-image case.
  const imgSrc = nw.image || null;

  if (imgSrc) {
    const fig = document.createElement("figure");
    fig.className = "nw-figure";
    fig.style.cssText =
      "background:#ffffff; padding:10px; border-radius:12px; border:1px solid #cbd5e1;";
    const img = document.createElement("img");
    img.className = "nw-img";
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = String(imgSrc);
    img.alt = nw.context
      ? String(nw.context)
      : objVisuals?.content?.caption || config.title || "Notice and Wonder data display";
    fig.append(img);
    attachImageZoom(img);
    // "Annotate the scene": a draw overlay so students can circle/underline what
    // they notice before writing. Off by default so tap-to-zoom still works;
    // turning Draw on captures the pen. No-op if the figure can't be measured.
    attachAnnotator(fig, { label: "Circle what you notice" });
    layout.append(fig);
  } else {
    layout.classList.add("nw-layout-noimg");
  }

  const grid = document.createElement("div");
  grid.className = "nw-grid";

  // Build one column (notice or wonder): starter chips + a save/resume textarea.
  const buildColumn = (opts) => {
    const col = document.createElement("div");
    col.className = `nw-col ${opts.colClass}`;

    const h4 = document.createElement("h4");
    h4.className = "nw-col-title";
    h4.innerHTML = `${opts.icon} ${esc(opts.heading)}`;
    col.append(h4);

    const ta = document.createElement("textarea");
    ta.className = "text-input nw-textarea";
    ta.rows = 4;
    ta.placeholder = opts.placeholder;
    ta.id = `nw-${opts.key}`;
    ta.value = (state && state.getResponse && state.getResponse(0, opts.responseKey)) || "";

    if (opts.starters.length) {
      const chips = document.createElement("div");
      chips.className = "nw-chips";
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "Sentence starters — tap one to add it to your answer");
      opts.starters.forEach((starter) => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "nw-chip";
        chip.textContent = starter;
        chip.title = "Tap to add this sentence starter";
        chip.addEventListener("click", () => {
          const needsSpace = ta.value && !/\s$/.test(ta.value);
          ta.value = `${ta.value}${needsSpace ? " " : ""}${starter} `;
          ta.focus();
          // Route persistence through the single input handler below.
          ta.dispatchEvent(new Event("input", { bubbles: true }));
        });
        chips.append(chip);
      });
      col.append(chips);
    }

    ta.addEventListener("input", () => {
      if (state && state.saveResponse) {
        state.saveResponse(0, opts.responseKey, ta.value);
      }
    });
    col.append(ta);

    return col;
  };

  grid.append(
    buildColumn({
      colClass: "nw-col-notice",
      icon: "👁",
      heading: "What do you notice?",
      placeholder: "I notice that…",
      key: "notice",
      responseKey: "nw_notice",
      starters: noticeStarters,
    }),
    buildColumn({
      colClass: "nw-col-wonder",
      icon: "💭",
      heading: "What do you wonder?",
      placeholder: "I wonder…",
      key: "wonder",
      responseKey: "nw_wonder",
      starters: wonderStarters,
    }),
  );

  layout.append(grid);
  card.append(layout);
  host.append(card);
}

// ── Show Your Work (Launch "Apply" + guided solve-it) ───────────────────────
// Renders, inside the Launch, the application problem the student works on PLUS a
// guided, typeable "Show Your Work" scaffold. This is where students actually do
// and show math — replacing the old display-only word-problem card that had no
// place to type.
//
// It maps directly to the BCPS UIFR (Instructional Framework Rubric) Level 4
// "Highly Effective" student-agency moves:
//   • TEACH 2 (L4): students DETERMINE AND SELECT a strategy   → strategy chips
//   • TEACH 3 (L4): students JUSTIFY answers using evidence     → "How I know" box
//   • TEACH 4 (L4): students CORRECT/CLARIFY/EXPAND/REDO work
//     in response to feedback                                   → self-check + Revise
//
// The problem text/image come from `config.revealWordProblem` when present (the
// 52 lessons that ship an authored Apply problem); otherwise the scaffold points
// back at the Launch scenario already shown above, so EVERY lesson gets a
// typeable show-your-work area. All fields persist via the lesson's canonical
// save/resume API on phaseId 0 (Launch) with stable keys.
function renderShowYourWork(host, config, state) {
  const wp = config && config.revealWordProblem;
  const hasAuthored = wp && typeof wp === "object" && (wp.text || wp.image);
  const get = (k) => (state && state.getResponse && state.getResponse(0, k)) || "";
  const set = (k, v) => state && state.saveResponse && state.saveResponse(0, k, v);

  const card = document.createElement("section");
  card.className = "card wp-card syw-card";
  card.setAttribute("aria-label", "Show your work");

  const head = document.createElement("div");
  head.className = "wp-head";
  head.innerHTML = `
    <span class="wp-badge" aria-hidden="true">✏️ Apply</span>
    <h3 class="wp-title">${esc((hasAuthored && wp.title) || "Show Your Work")}</h3>`;
  card.append(head);

  // The problem to solve.
  if (hasAuthored && wp.text) {
    const p = document.createElement("p");
    p.className = "wp-text";
    p.setAttribute("data-annotate", "word-problem");
    p.textContent = String(wp.text);
    card.append(p);
  } else {
    const p = document.createElement("p");
    p.className = "wp-text";
    p.textContent = "Use the scenario above. Work it out step by step below.";
    card.append(p);
  }
  if (hasAuthored && wp.image) {
    const fig = document.createElement("figure");
    fig.className = "wp-figure";
    const img = document.createElement("img");
    img.className = "wp-img";
    img.setAttribute("loading", "lazy");
    img.setAttribute("decoding", "async");
    img.src = String(wp.image);
    img.alt = wp.title ? String(wp.title) : "Word problem image";
    fig.append(img);
    attachImageZoom(img);
    card.append(fig);
  }

  // Helper: a labeled, persisted text field (textarea or single-line input).
  const field = (key, label, hint, opts = {}) => {
    const wrap = document.createElement("div");
    wrap.className = "syw-field";
    const lab = document.createElement("label");
    lab.className = "syw-label";
    lab.setAttribute("for", `syw-${key}`);
    lab.innerHTML = `${label}${hint ? ` <span class="syw-hint">${hint}</span>` : ""}`;
    wrap.append(lab);
    const input = opts.single
      ? document.createElement("input")
      : document.createElement("textarea");
    if (opts.single) input.type = "text";
    else input.rows = opts.rows || 3;
    input.id = `syw-${key}`;
    input.className = "text-input syw-input";
    input.placeholder = opts.placeholder || "";
    input.value = get(key);
    input.addEventListener("input", () => set(key, input.value));
    wrap.append(input);
    // Optional minimum-word goal with a live counter (writing scaffold #4).
    if (opts.minWords) {
      const counter = document.createElement("div");
      counter.className = "syw-wordcount";
      const countWords = (v) => (v.trim() ? v.trim().split(/\s+/).length : 0);
      const update = () => {
        const n = countWords(input.value);
        counter.textContent = `${n} / ${opts.minWords} words`;
        counter.classList.toggle("is-ready", n >= opts.minWords);
      };
      input.addEventListener("input", update);
      update();
      wrap.append(counter);
    }
    return wrap;
  };

  // Shared "I'm stuck" support bar — hint / first step / example / vocab /
  // sentence starter / simpler words, available on every lesson's solve.
  mountStuckSupport(card, { config, state });

  const steps = document.createElement("div");
  steps.className = "syw-steps";
  steps.append(
    field("know", "1 · What I know", "facts and numbers from the problem", {
      placeholder: "I know that…",
    }),
    field("find", "2 · What I need to find", "", {
      placeholder: "I need to find…",
    }),
    field("work", "3 · My work", "show each step", {
      rows: 5,
      minWords: 15,
      placeholder: "Step 1…\nStep 2…",
    }),
    field("answer", "4 · My answer", "label your units", {
      single: true,
      placeholder: "My answer is…",
    }),
  );
  card.append(steps);

  // TEACH 4 (L4): self-check feedback that prompts students to revise their work.
  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "btn btn-secondary syw-check-btn";
  checkBtn.textContent = "✅ Check my thinking";
  const checklist = document.createElement("div");
  checklist.className = "syw-checklist";
  checklist.hidden = true;
  checklist.innerHTML = `
    <p class="syw-check-title">Reread your work and fix anything that's off:</p>
    <ul>
      <li>Did you answer <strong>everything</strong> the question asked?</li>
      <li>Did you <strong>label the units</strong> (people, $, packs, halves…)?</li>
      <li>Does your answer <strong>make sense</strong> for the situation?</li>
      <li>Could you <strong>explain your steps</strong> to a partner?</li>
    </ul>
    <p class="syw-check-note">If something's off, go back up and <strong>revise</strong> — good mathematicians redo their work.</p>`;
  checkBtn.addEventListener("click", () => {
    checklist.hidden = !checklist.hidden;
  });
  card.append(checkBtn, checklist);

  // Turn & Talk is integrated into the problem itself: after showing their work,
  // students discuss their reasoning with a partner (non-graded). Uses the same
  // authored/derived launch prompt the lesson already carries.
  const tt = resolveTurnTalk("launch", config);
  if (tt && tt.question) {
    const stems = Array.isArray(tt.stems) ? tt.stems.filter((s) => s && s.en) : [];
    const talk = document.createElement("div");
    talk.className = "syw-turntalk";
    talk.style.cssText =
      "margin-top:var(--sp-4); padding:var(--sp-3); border-radius:var(--radius-md,12px); background:rgba(217,121,93,0.08); border:1px solid rgba(217,121,93,0.28);";
    talk.innerHTML =
      `<div style="font-weight:800; color:var(--coral); margin-bottom:var(--sp-2);">🗣️ Turn &amp; Talk</div>` +
      `<p style="margin:0 0 var(--sp-2); font-weight:600;">${esc(tt.question)}</p>` +
      (stems.length
        ? `<div style="font-size:0.9rem; color:var(--muted);">Try starting with: ${stems
            .slice(0, 2)
            .map((s) => `“${esc(s.en)}”`)
            .join(" · ")}</div>`
        : "");
    card.append(talk);
  }

  host.append(card);
}

// ── Phase 1: Launch ──
// Resolve the "I can ..." Content Objective with graceful fallbacks.
export function resolveContentObjective(config) {
  if (config.contentObjective) return esc(config.contentObjective);
  // Fallbacks to any pre-existing objective field, prefixed with "I can ".
  const legacy = config.objective || (config.launch && config.launch.objective) || "";
  if (legacy) {
    const trimmed = String(legacy).trim();
    return /^i can\b/i.test(trimmed) ? esc(trimmed) : `I can ${esc(trimmed)}`;
  }
  // Last-resort friendly placeholder using the lesson topic.
  return `I can solve problems about ${esc(config.title || "this topic")}.`;
}

// Resolve the "I can ..." Language Objective with a friendly placeholder.
export function resolveLanguageObjective(config) {
  if (config.languageObjective) return esc(config.languageObjective);
  return `I can talk and write about ${esc(config.title || "this topic")} using math words.`;
}

// Top-of-launch block: Name/Period fields and Homework download. The Content /
// Language objectives are rendered separately by renderObjectives so the
// "Be Curious" (Notice & Wonder) card can sit BETWEEN the identity fields and
// the objectives — curiosity first, then the formal "I can…" goals.
// Pre-lesson materials (Get Ready / Notes) now live as their own sidebar tabs
// under "Before the lesson" — see app.js preLessonNavHtml / openExtra.
function renderLaunchHeader(el, state, config) {
  const s = state.get();
  const homeworkHref = `/lessons/${encodeURIComponent(config.lessonId)}/homework.docx`;

  const block = document.createElement("div");
  block.className = "card launch-intro";
  block.innerHTML = `
    ${
      config.readiness
        ? `<div class="launch-prelesson-hint" style="display:flex; align-items:center; gap:var(--sp-3); background:var(--cream, #fdf3e0); border:1px solid var(--gold, #d4952a); border-radius:var(--radius-md, 12px); padding:var(--sp-3, 14px) var(--sp-4, 18px); margin-bottom:var(--sp-4, 18px);">
            <span style="font-size:1.6rem;">📚</span>
            <span>New to this skill? Open <strong>Get Ready</strong> and <strong>Notes</strong> under <em>Before the lesson</em> in the sidebar first — they're quick and not graded.</span>
          </div>`
        : ""
    }
    <div class="launch-identity" style="display:flex; flex-wrap:wrap; gap:var(--sp-3); align-items:flex-end; margin-bottom:var(--sp-4);">
      <div class="launch-field" style="flex:1 1 220px;">
        <label for="launch-name" style="display:block; font-weight:600; margin-bottom:var(--sp-1);">Name</label>
        <input id="launch-name" class="text-input" type="text"
          placeholder="First name Last initial" autocomplete="off"
          value="${esc(s.studentName || "")}" />
      </div>
      <div class="launch-field launch-field-period" style="flex:0 1 120px;">
        <label for="launch-period" style="display:block; font-weight:600; margin-bottom:var(--sp-1);">Period</label>
        <input id="launch-period" class="text-input" type="text"
          placeholder="e.g. 3" autocomplete="off"
          value="${esc(s.studentPeriod || "")}" />
      </div>
      <a class="btn btn-secondary launch-homework-link" href="${homeworkHref}"
        download>📄 Homework (Word doc)</a>
    </div>
  `;
  el.append(block);

  const nameInput = block.querySelector("#launch-name");
  const periodInput = block.querySelector("#launch-period");
  nameInput.addEventListener("change", () => {
    const name = nameInput.value.trim();
    if (name) state.set({ studentName: name });
  });
  periodInput.addEventListener("change", () => {
    state.set({ studentPeriod: periodInput.value.trim() });
  });
}

// Underline every lesson-vocabulary term that appears inside an objective and
// turn it into a tap-to-open button. `escapedText` is the already-HTML-escaped
// objective string (from resolveContentObjective / resolveLanguageObjective);
// the vocab terms are plain words, so matching on the escaped text is safe.
// Each match is wrapped in <button class="obj-term" data-term-idx="…"> so a
// single delegated handler can open the glossary popup for that term. Terms not
// present in the objective are simply left untouched.
export function linkifyObjectiveTerms(escapedText, vocab) {
  if (!escapedText || !Array.isArray(vocab) || !vocab.length) return escapedText;
  // Same index the phase bodies use (engine/core/vocab-match.js): whole terms,
  // explicit `aliases`, the auto-derived short forms ("prime", "commutative"),
  // and plural heads including "-y" → "-ies". An objective is where a lesson is
  // MOST likely to write a term in its natural short form, so the naive
  // whole-term match this used to do left the goal card's key words dead.
  const matcher = buildVocabMatcher(vocab);
  if (!matcher) return escapedText;
  const re = matcher.createRegex();
  const linked = escapedText.replace(re, (match) => {
    const idx = matcher.resolveIndex(match);
    if (idx < 0) return match;
    return `<button type="button" class="obj-term" data-term-idx="${idx}" aria-haspopup="dialog">${match}</button>`;
  });
  // Glue trailing punctuation to the term: buttons are atomic inline boxes,
  // so without this the browser may wrap a bare "." or "," onto its own line
  // right after the underlined term.
  return linked.replace(
    /(<button[^>]*class="obj-term"[^>]*>[^<]*<\/button>)\s*([.,;:!?)’”]+)/g,
    '<span class="obj-nowrap">$1$2</span>',
  );
}

// Singleton glossary popup shared across all objective terms on the page.
let objectivePopupEl = null;
let objectivePopupKeyHandler = null;
let objectivePopupLastFocus = null;

function getObjectivePopup() {
  if (objectivePopupEl) return objectivePopupEl;
  const backdrop = document.createElement("div");
  backdrop.className = "obj-popup-backdrop";
  backdrop.hidden = true;
  backdrop.innerHTML = `
    <div class="obj-popup" role="dialog" aria-modal="true" aria-labelledby="obj-popup-term">
      <button type="button" class="obj-popup-close" aria-label="Close">&times;</button>
      <h3 id="obj-popup-term" class="obj-popup-term"></h3>
      <p class="obj-popup-translation">
        <span class="obj-popup-tr-label">Español:</span>
        <span class="obj-popup-tr-es" lang="es"></span>
      </p>
      <p class="obj-popup-def"></p>
      <p class="obj-popup-def-es" lang="es"></p>
      <figure class="obj-popup-visual">
        <img class="obj-popup-img" alt="" />
        <figcaption class="obj-popup-example"></figcaption>
      </figure>
    </div>`;
  document.body.append(backdrop);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeObjectivePopup();
  });
  backdrop.querySelector(".obj-popup-close").addEventListener("click", () => closeObjectivePopup());
  objectivePopupEl = backdrop;
  return backdrop;
}

function openObjectiveTermPopup(entry) {
  if (!entry) return;
  const backdrop = getObjectivePopup();
  const term = String(entry.term || "").trim();
  // An acronym titles itself with what it stands for ("LCM — least common
  // multiple") and then shows the full term's definition unchanged.
  const title = entry.expandsTo ? `${term} — ${String(entry.expandsTo).trim()}` : term;
  backdrop.querySelector(".obj-popup-term").textContent = title;

  // Spanish translation of the word itself (e.g. Ratio → Razón). Hidden when
  // the vocab entry has no termEs so we never show an empty "Español:" row.
  const trRow = backdrop.querySelector(".obj-popup-translation");
  const trEs = backdrop.querySelector(".obj-popup-tr-es");
  const termEs = entry.termEs ? String(entry.termEs).trim() : "";
  if (termEs) {
    trEs.textContent = termEs;
    trRow.hidden = false;
  } else {
    trEs.textContent = "";
    trRow.hidden = true;
  }

  // Only show a picture when the term has a real, term-specific illustration.
  // Descriptive words (corner, leans, slanted side, straight up…) have a
  // definition but no image, and would otherwise fall back to the generic "#"
  // number-category tile — an unrelated picture. In that case hide the image and
  // let the definition stand alone.
  // The objective cards used to suppress this picture on the theory that the
  // goal's own visual-model card was picture enough. It read as a bug: the term
  // has a drawing (commutative-property.svg and friends are dedicated art), the
  // popup is a modal over the card, and a definition-only popup on a goal looked
  // broken next to the same word's illustrated popup in the phase body. The
  // picture now rides along everywhere the term actually has one.
  const img = backdrop.querySelector(".obj-popup-img");
  const showImg = hasRealVocabImage(term, entry.image);
  if (showImg) {
    img.src = resolveVocabImage(term, entry.image);
    img.alt = vocabImageAlt(title, entry.definition);
    img.hidden = false;
    // Tap the picture to blow it up. The lightbox is a top-layer <dialog>, so it
    // paints above this pop-up's z-index:1100 backdrop, and closing it returns
    // focus to the picture rather than to the top of the document.
    attachImageZoom(img);
  } else {
    img.removeAttribute("src");
    img.alt = "";
    img.hidden = true;
  }

  const ex = backdrop.querySelector(".obj-popup-example");
  const visual = entry.visual ? String(entry.visual) : "";
  ex.textContent = visual;
  ex.hidden = !visual;

  // Collapse the whole figure when it has neither a picture nor an example so
  // the popup does not leave an empty framed gap.
  const fig = backdrop.querySelector(".obj-popup-visual");
  if (fig) fig.hidden = !showImg && !visual;

  backdrop.querySelector(".obj-popup-def").textContent = entry.definition
    ? String(entry.definition)
    : "";

  const esEl = backdrop.querySelector(".obj-popup-def-es");
  if (entry.definitionEs) {
    esEl.textContent = String(entry.definitionEs);
    esEl.hidden = false;
  } else {
    esEl.textContent = "";
    esEl.hidden = true;
  }

  objectivePopupLastFocus = document.activeElement;
  backdrop.hidden = false;
  document.body.classList.add("obj-popup-open");
  backdrop.querySelector(".obj-popup-close").focus();
  objectivePopupKeyHandler = (e) => {
    // One Escape closes ONE thing. While the enlarged picture is open it owns
    // the key; without this guard a single press dismissed the lightbox and the
    // definition underneath it together.
    if (e.key === "Escape" && !isLightboxOpen()) closeObjectivePopup();
  };
  document.addEventListener("keydown", objectivePopupKeyHandler);
}

function closeObjectivePopup() {
  if (!objectivePopupEl) return;
  objectivePopupEl.hidden = true;
  document.body.classList.remove("obj-popup-open");
  if (objectivePopupKeyHandler) {
    document.removeEventListener("keydown", objectivePopupKeyHandler);
    objectivePopupKeyHandler = null;
  }
  if (objectivePopupLastFocus && typeof objectivePopupLastFocus.focus === "function") {
    objectivePopupLastFocus.focus();
  }
  objectivePopupLastFocus = null;
}

// Delegate clicks on underlined objective terms to the shared glossary popup.
// Every surface — goal cards, cover screen, review restatement, phase bodies —
// opens the SAME card: EN/ES definition plus the term's illustration when it has
// a real one (see openObjectiveTermPopup). The objective cards used to suppress
// the picture; that made the goal card's words the only place on the site where
// a vocab popup had no image.
export function wireObjectiveTermPopups(block, vocab) {
  if (!block.querySelector(".obj-term")) return;
  block.addEventListener("click", (e) => {
    const btn = e.target.closest(".obj-term");
    if (!btn || !block.contains(btn)) return;
    // Prevent the click from bubbling to an enclosing <label> (e.g. the
    // "Did I get it?" review rows) and toggling its checkbox.
    e.preventDefault();
    // …and stop it reaching an OUTER delegated handler. underlineVocabTerms
    // wires the whole phase container, so without this the objective block's
    // definition-only popup was immediately reopened by the container's
    // handler — with the picture — and the picture won because it ran last.
    e.stopPropagation();
    const idx = Number(btn.dataset.termIdx);
    if (Number.isInteger(idx)) openObjectiveTermPopup(vocab[idx]);
  });
}

// Text nodes we never rewrite: interactive controls, answer inputs, rendered
// visuals/math, and terms already turned into a glossary button. Underlining a
// word inside a <button>/<label> would break the control; inside an <svg> or
// interactive visual it would corrupt the figure.
const VOCAB_BODY_EXCLUSIONS =
  "button, a[href], input, textarea, select, option, label, summary, script, style, svg, code, kbd, .obj-term, .obj-popup-backdrop, [contenteditable], [data-no-vocab], .interactive-visual, .section-icon, .katex, .MathJax, mjx-container";

// Underline EVERY lesson-vocabulary term wherever it appears in a rendered
// phase body (not just the objectives) and wire each one to the same tap-to-open
// glossary popup — a kid-friendly EN/ES explanation plus an illustration. This
// mirrors the small-group renderer so English learners get the academic
// vocabulary defined in context throughout the lesson. Idempotent per container;
// capped at 2 hits per term per phase to stay readable. Excludes controls,
// inputs, and visuals via VOCAB_BODY_EXCLUSIONS.
export function underlineVocabTerms(container, vocab) {
  if (!container) return;
  const list = Array.isArray(vocab) ? vocab : [];
  // Term index, aliases, plural handling and acronym case rules all live in
  // engine/core/vocab-match.js — shared with linkifyObjectiveTerms so the goal
  // cards and the phase bodies can never again underline different words.
  const matcher = buildVocabMatcher(list);
  if (!matcher) return;
  const re = matcher.createRegex();

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!node.textContent || !node.textContent.trim() || !parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(VOCAB_BODY_EXCLUSIONS)) return NodeFilter.FILTER_REJECT;
      re.lastIndex = 0;
      return re.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });
  const textNodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) textNodes.push(n);
  if (!textNodes.length) return;

  // Wire EVERY occurrence of a vocab term — wherever a math word is listed it
  // should open its definition+image popup, not just the first couple of times.
  // (Previously capped at 2 hits/term/phase, which left later listings — e.g. a
  // term repeated in a practice stem or a sort label — underline-less and dead.)
  for (const textNode of textNodes) {
    const text = textNode.textContent;
    const fragment = document.createDocumentFragment();
    let cursor = 0;
    let changed = false;
    re.lastIndex = 0;
    for (const match of text.matchAll(re)) {
      // resolveIndex also enforces the acronym rule, so "MAD" opens the
      // mean-absolute-deviation popup and "mad" in a sentence never does.
      const idx = matcher.resolveIndex(match[0]);
      if (idx < 0) continue;
      fragment.append(text.slice(cursor, match.index));
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "obj-term";
      btn.dataset.termIdx = String(idx);
      btn.setAttribute("aria-haspopup", "dialog");
      btn.setAttribute("aria-label", `${matcher.termFor(idx) || match[0]}: open definition`);
      btn.textContent = match[0];
      fragment.appendChild(btn);
      cursor = match.index + match[0].length;
      changed = true;
    }
    if (!changed) continue;
    fragment.append(text.slice(cursor));
    textNode.replaceWith(fragment);
  }
  wireObjectiveTermPopups(container, list);
}

// Keep vocab popups working on DYNAMICALLY-rendered content. A phase body is
// underlined once on render, but several phases inject fresh DOM afterward —
// Practice serves problems one at a time into a swap area, the Level 1/2/Adaptive
// selector re-serves a problem, matching games and optional activities mount
// their own markup. Without re-running the pass, math words in that later markup
// are listed but never open their definition popup. This watches a phase
// container and underlines each newly-added subtree, idempotently (terms already
// wrapped live inside .obj-term, which underlineVocabTerms excludes). The
// observer is disconnected while it writes so its own DOM edits never re-trigger
// it. Returns the observer so the caller can disconnect it when the phase unmounts.
export function observeVocabTerms(container, vocab) {
  const list = Array.isArray(vocab) ? vocab : [];
  if (!container || !list.length || typeof MutationObserver === "undefined") return null;
  const pending = new Set();
  let scheduled = false;
  const obs = new MutationObserver((records) => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (node.nodeType === 1) pending.add(node);
      }
    }
    if (!pending.size || scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      obs.disconnect();
      for (const node of pending) {
        if (node.isConnected) underlineVocabTerms(node, list);
      }
      pending.clear();
      obs.takeRecords(); // drop the mutations our own underlining just made
      if (container.isConnected) obs.observe(container, { childList: true, subtree: true });
    });
  });
  obs.observe(container, { childList: true, subtree: true });
  return obs;
}

// Content / Language "I can…" objectives. Rendered AFTER the "Be Curious"
// Notice & Wonder card so students get curious about the scenario before they
// read the formal goals (see renderLaunchPhase ordering). Key vocabulary words
// named in the objectives are underlined and open a tap-to-view popup with a
// simple kid-friendly explanation + a visual (see linkifyObjectiveTerms).
// Two "I can…" goal cards (Content + Language). Each card carries a student
// self-check checkbox ("Got it") that persists on Launch (phase 0) via the
// canonical save/resume API, plus a short "Talk about it" discussion prompt so
// students unpack what the goal means. The checkbox label wraps ONLY the "Got
// it" text — never the objective sentence — because the objective may contain
// tappable vocab-term buttons (linkifyObjectiveTerms), and a wrapping <label>
// would otherwise toggle the checkbox when a student taps a term for its popup.
// The picture under each goal card, its alt text and its caption all come from
// engine/core/objective-visuals.js — see that file for why the old unit-number
// caption ladder had to go (it described manipulatives that are not in any of
// the three photographs, against a unit numbering that has since been re-cut).
//
// Renders the two "I can…" goal cards (Content + Language).
//
// `opts.review` switches the block into end-of-lesson mode (Phase 8): the goals
// are restated in the third person using the name the student typed on Launch —
// "Samuel can now compare ratios using a table." — the discussion prompts look
// backwards instead of forwards, and the self-checks persist under their own
// keys so ticking "Did it" at the end does not rewrite the "Got it" the student
// ticked at the start. With no name entered it degrades to the ordinary
// first-person wording, so nothing depends on the Name field being filled in.
// Talk targets are short bullets now, not one long sentence. Older callers (and
// any lesson that pins its own prompt text) may still hand over a single string,
// so normalise both shapes to a list before rendering.
function talkList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  const s = String(value || "").trim();
  return s ? [s] : [];
}

// esc() escapes < > &, but NOT the double quotes a JSON list is full of, so the
// list is percent-encoded before it goes into an attribute. Encoding rather than
// re-escaping keeps the round trip lossless no matter what a prompt contains.
function talkAttr(value) {
  return encodeURIComponent(JSON.stringify(talkList(value)));
}

function talkBulletsHtml(value) {
  return talkList(value)
    .map((line) => `<li style="margin:2px 0;">${esc(line)}</li>`)
    .join("");
}

function renderObjectives(el, config, state, opts = {}) {
  const review = !!opts.review;
  const name = review ? studentFirstName(state) : "";
  const phrase = (text) => (review ? toThirdPersonObjective(text, name) : text);

  const vocab = augmentVocabWithGlossary(config.vocabulary);
  // Re-phrase BEFORE linkifying: the third-person rewrite matches on the leading
  // pronoun, and linkifyObjectiveTerms would otherwise be free to wrap part of
  // that opener in an <button class="obj-term"> and break the match.
  const contentHtml = linkifyObjectiveTerms(phrase(resolveContentObjective(config)), vocab);
  const languageHtml = linkifyObjectiveTerms(phrase(resolveLanguageObjective(config)), vocab);

  const visuals = resolveObjectiveVisuals(config);

  const card = (o) => `
    <div class="card ${o.cardClass} launch-objective">
      <div class="launch-objective-head" style="display:flex; align-items:center; justify-content:space-between; gap:var(--sp-2); margin-bottom:var(--sp-2);">
        <h4 style="color:${o.ink}; margin:0; font-size:1.28rem; font-weight:800; letter-spacing:-0.01em;">${o.label}</h4>
        <label class="objective-check" style="display:inline-flex; align-items:center; gap:6px; margin:0; font-size:.85rem; font-weight:800; color:${o.ink}; cursor:pointer; white-space:nowrap;">
          <input type="checkbox" class="objective-check-box" data-obj-key="${o.key}" aria-label="${o.checkAria}"
                 style="width:18px; height:18px; accent-color:${o.ink}; cursor:pointer;" />
          ${o.checkLabel}
        </label>
      </div>
      <p style="margin:0; font-size:1.32rem; font-weight:800; color:#0f172a; line-height:1.55; letter-spacing:-0.005em; -webkit-font-smoothing:antialiased;">${o.text}</p>
      
      <!-- PUBLISHER-GRADE VISUAL MODEL CARD DIRECTLY BELOW OBJECTIVE TEXT -->
      <div class="visual-model-wrapper" style="margin-top:16px; margin-bottom:16px; border-radius:14px; overflow:hidden; border:1.5px solid rgba(15,23,42,0.18); box-shadow:0 6px 20px rgba(0,0,0,0.08); background:#0b0f19; cursor:zoom-in;">
        <img src="${o.img}" alt="${esc(o.alt)}" style="width:100%; height:auto; display:block; cursor:zoom-in;" />
        <div style="padding:12px 16px; background:#ffffff; border-top:1.5px solid #e2e8f0; font-size:0.96rem; color:#0f172a; font-weight:800; line-height:1.5; -webkit-font-smoothing:antialiased;">
          ${o.icon} <strong>Visual Representation:</strong> ${esc(o.caption)} <span style="display:inline-block; font-size:0.78rem; font-weight:800; color:#0284c7; background:rgba(2,132,199,0.08); padding:3px 8px; border-radius:6px; margin-left:6px; border:1px solid rgba(2,132,199,0.2);">🔍 Click to enlarge</span>
        </div>
        ${
          o.talkPrompts
            ? `
        <div class="language-talk-card" data-lang="en" data-say-en="${talkAttr(o.talkPrompts.say)}" data-say-es="${talkAttr(o.talkPrompts.sayEs || o.talkPrompts.say)}" data-listen-en="${talkAttr(o.talkPrompts.listen)}" data-listen-es="${talkAttr(o.talkPrompts.listenEs || o.talkPrompts.listen)}" style="padding:14px 16px; background:#fff7ed; border-top:2px solid #fdba74; font-size:0.95rem; color:#0f172a; line-height:1.55; -webkit-font-smoothing:antialiased;">
          <div style="font-weight:900; font-size:0.82rem; color:#c2410c; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:8px; display:flex; align-items:center; justify-content:space-between; gap:6px; flex-wrap:wrap;">
            <span>🗣️ Student Talk Targets (What to Say & Listen For):</span>
            <div style="display:inline-flex; align-items:center; gap:6px;">
              <button type="button" class="talk-lang-toggle btn btn-xs btn-outline" title="Switch English / Spanish" style="padding:2px 8px; font-size:0.75rem; font-weight:800; border-radius:6px; background:white; color:#0369a1; border:1px solid #7dd3fc; cursor:pointer;">🇲🇽 ES</button>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            <div style="background:rgba(234,88,12,0.06); padding:9px 12px; border-radius:8px; border-left:4px solid #ea580c;">
              <strong style="color:#c2410c; font-weight:900; font-size:0.95rem;">What to Say:</strong>
              <ul class="talk-say-text talk-bullets" style="margin:6px 0 0; padding-left:20px; font-weight:750; font-size:1rem; color:#0f172a; font-style:italic; line-height:1.6;">${talkBulletsHtml(o.talkPrompts.say)}</ul>
            </div>
            <div style="background:rgba(2,132,199,0.06); padding:9px 12px; border-radius:8px; border-left:4px solid #0284c7;">
              <strong style="color:#0369a1; font-weight:900; font-size:0.95rem;">What to Listen For:</strong>
              <ul class="talk-listen-text talk-bullets" style="margin:6px 0 0; padding-left:20px; font-weight:750; font-size:1rem; color:#0f172a; line-height:1.6;">${talkBulletsHtml(o.talkPrompts.listen)}</ul>
            </div>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <div class="objective-discuss" style="margin-top:var(--sp-3); padding-top:var(--sp-2); border-top:1px dashed rgba(0,0,0,0.12);">
        <span style="display:block; font-size:1.1rem; font-weight:800; letter-spacing:.02em; color:${o.ink}; margin-bottom:6px;">💬 Talk about it</span>
        <span style="display:block; font-size:1.25rem; font-weight:700; color:#1e293b; line-height:1.6;">${o.discuss}</span>
      </div>
    </div>`;

  // The end-of-lesson block reads as evidence of growth ("Content Objective —
  // Achieved"), so the labels, self-check wording and talk prompts all shift to
  // the past tense. `who` is the student's name when we have one and a neutral
  // stand-in when we do not, so the sentences never read "  can now".
  const who = name || "You";
  const block = document.createElement("div");
  block.className = `launch-objectives grid-2${review ? " launch-objectives-review" : ""}`;
  block.innerHTML =
    card({
      cardClass: "card-teal",
      ink: "var(--teal-ink)",
      label: review ? "Content Objective — Achieved" : "Content Objective",
      key: "content",
      text: contentHtml,
      img: visuals.content.src,
      alt: visuals.content.alt,
      icon: "🎯",
      caption: visuals.content.caption,
      talkPrompts: visuals.content.talkPrompts,
      checkLabel: review ? "Did it" : "Got it",
      checkAria: review
        ? `${who} can now do the content objective`
        : `I understand the content objective`,
      discuss: review
        ? `In your own words, what can ${who} do now that ${who === "You" ? "you" : who} could not do at the start of this lesson? Give one example.`
        : "In your own words, what will you be able to do by the end of this lesson? Give one example.",
    }) +
    card({
      cardClass: "card-coral",
      ink: "var(--coral)",
      label: review ? "Language Objective — Achieved" : "Language Objective",
      key: "language",
      text: languageHtml,
      img: visuals.language.src,
      alt: visuals.language.alt,
      icon: "🗣️",
      caption: visuals.language.caption,
      talkPrompts: visuals.language.talkPrompts,
      checkLabel: review ? "Did it" : "Got it",
      checkAria: review
        ? `${who} can now do the language objective`
        : `I understand the language objective`,
      discuss: review
        ? "Which math words did you actually use today? Explain one of them to a partner in your own words."
        : "Which math words in this goal are new to you? How would you explain this goal to a partner?",
    });
  el.append(block);
  // Definition-only popups on the goals: the picture for this card is the visual
  // model below the text, and it opens on its own click (attachImageZoom).
  wireObjectiveTermPopups(block, vocab);
  // Underline vocabulary terms in ALL text within the objectives block — captions,
  // discussion prompts, "Talk about it" sections, talk targets, and the "Visual
  // Representation" caption — not just the "I can…" sentence (which was already
  // linkified inline by linkifyObjectiveTerms). underlineVocabTerms respects
  // .obj-term so it never double-wraps the objective text, and it respects the
  // exclusion list (buttons, labels, svg…) so controls remain untouched.
  underlineVocabTerms(block, vocab);

  block.querySelectorAll(".visual-model-wrapper img").forEach((img) => {
    attachImageZoom(img);
  });

  block.querySelectorAll(".talk-lang-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const cardEl = btn.closest(".language-talk-card");
      if (!cardEl) return;
      const isEs = cardEl.getAttribute("data-lang") === "es";
      cardEl.setAttribute("data-lang", isEs ? "en" : "es");
      const sayEl = cardEl.querySelector(".talk-say-text");
      const listenEl = cardEl.querySelector(".talk-listen-text");
      // Both language variants ride along as JSON lists, so switching language
      // rebuilds the bullets instead of swapping one sentence.
      const readList = (attr) => {
        try {
          return talkList(JSON.parse(decodeURIComponent(cardEl.getAttribute(attr) || "%5B%5D")));
        } catch (_e) {
          return [];
        }
      };
      const sayText = readList(isEs ? "data-say-en" : "data-say-es");
      const listenText = readList(isEs ? "data-listen-en" : "data-listen-es");
      if (sayEl) sayEl.innerHTML = talkBulletsHtml(sayText);
      if (listenEl) listenEl.innerHTML = talkBulletsHtml(listenText);
      btn.textContent = isEs ? "🇲🇽 ES" : "🇺🇸 EN";
    });
  });

  // Persist each self-check on Launch (phase 0) so it survives reload, exactly
  // like every other lesson input. The review block uses its own key prefix so
  // the end-of-lesson "Did it" is a separate answer from the opening "Got it".
  // No-op when state is unavailable.
  block.querySelectorAll(".objective-check-box").forEach((box) => {
    const key = `${review ? "objective_achieved" : "objective_understood"}_${box.dataset.objKey}`;
    if (state && state.getResponse && state.getResponse(0, key) === "1") box.checked = true;
    box.addEventListener("change", () => {
      if (state && state.saveResponse) state.saveResponse(0, key, box.checked ? "1" : "0");
    });
  });
}

// Be-Curious ESOL support: academic vocabulary + sentence phrases tied to the
// picture, each a chip the student TAPS to insert into whichever Notice/Wonder
// box they were last typing in. Supports English learners in observing and
// describing the scene. Driven by config.launch.beCurious = { vocab:[], phrases:[] }.
// Strict no-op when absent, so older configs render nothing.
// `fieldRoot` scopes the focus tracking and the tap-to-insert textarea lookup.
// It defaults to `host`, but when the support card is laid out in its own column
// beside the notice/wonder boxes, the caller passes the shared parent row so the
// chips still insert into whichever notice/wonder box the student was using.
function renderNoticeWonderSupport(host, support, config, fieldRoot = host) {
  if (!support || typeof support !== "object") return;
  const vocab = Array.isArray(support.vocab) ? support.vocab.filter(Boolean) : [];
  const phrases = Array.isArray(support.phrases) ? support.phrases.filter(Boolean) : [];
  if (!vocab.length && !phrases.length) return;

  // Look up the lesson's vocabulary entries that carry popup content (a simple
  // definition and/or an authored visual) so an academic word can open the same
  // glossary popup used by the objectives — an image + a kid-friendly definition
  // in English and Spanish. Shared entries fill any lesson-local vocabulary gaps.
  const lessonVocab = Array.isArray(config && config.vocabulary) ? config.vocabulary : [];
  const sharedVocabByTerm = new Map(
    vocab.map((label) => [
      normalizeAcademicWord(label),
      resolveNoticeWonderAcademicWord(label, lessonVocab),
    ]),
  );
  const hasPopupContent = (v) => !!(v && (v.definition || v.definitionEs || v.visual || v.example));
  const normTerm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/s$/, "")
      .trim();
  const vocabByTerm = new Map();
  lessonVocab.forEach((v) => {
    const key = normTerm(v && v.term);
    if (key && hasPopupContent(v) && !vocabByTerm.has(key)) vocabByTerm.set(key, v);
  });

  // Track the most recently focused textarea inside the Be-Curious area (the
  // only textareas in the Launch phase are the Notice/Wonder boxes) so a tapped
  // chip lands in the box the student was using.
  let lastField = null;
  fieldRoot.addEventListener("focusin", (e) => {
    if (e.target && e.target.tagName === "TEXTAREA") lastField = e.target;
  });

  const insert = (text) => {
    const field = lastField || fieldRoot.querySelector("textarea");
    if (!field) return;
    const cur = field.value;
    const sep = cur && !/\s$/.test(cur) ? " " : "";
    field.value = cur + sep + text;
    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.focus();
  };

  const card = document.createElement("section");
  card.className = "card nw-support";
  card.style.cssText =
    "background:var(--cream,#fdf6ec); border:1px solid rgba(42,157,143,0.35); border-radius:var(--radius,12px); margin-top:var(--sp-3);";

  // A plain insert chip: one tap drops the text into the current answer box.
  const insertChip = (it, cls) =>
    `<button type="button" class="badge ${cls} nw-chip" data-insert="${esc(it)}" style="cursor:pointer; border:none;">${esc(it)} <span aria-hidden="true">＋</span></button>`;

  // An academic-word pill: the word (underlined) opens the definition popup with
  // an image + simple meaning; the trailing ＋ still inserts it into the answer.
  const wordPill = (it, cls) => {
    const entry = vocabByTerm.get(normTerm(it)) || sharedVocabByTerm.get(normalizeAcademicWord(it));
    if (!entry) return insertChip(it, cls);
    return `<span class="badge ${cls} nw-vocab">
        <button type="button" class="nw-vocab-word" data-term="${esc(it)}" aria-haspopup="dialog" aria-label="Open definition and picture for ${esc(it)}" title="Tap for a picture and meaning">${esc(it)}</button>
        <button type="button" class="nw-vocab-add" data-insert="${esc(it)}" aria-label="Add ${esc(it)} to your answer" title="Add to your answer">＋</button>
      </span>`;
  };

  // A labeled chip strip: the label holds its own column and the chips wrap
  // cleanly beside it with even spacing (no ragged line-height hack).
  const row = (label, items, cls, chipFn) =>
    items.length
      ? `<div style="display:flex; flex-wrap:wrap; align-items:baseline; gap:var(--sp-2) var(--sp-3); margin-bottom:var(--sp-3);">
          <span style="flex:0 0 auto; font-weight:800; color:var(--navy,#264653);">${esc(label)}</span>
          <span style="display:flex; flex-wrap:wrap; gap:var(--sp-2);">${items
            .map((it) => chipFn(it, cls))
            .join("")}</span>
        </div>`
      : "";
  card.innerHTML =
    `<h4 style="color:var(--teal-ink); margin:0 0 var(--sp-2);">🗝️ Words &amp; phrases to use</h4>
     <p style="margin:0 0 var(--sp-3); color:var(--muted); font-size:0.95rem;">Tap a word for a picture and meaning, or tap ＋ to add it to your answer.</p>` +
    row("Academic words:", vocab, "badge-teal", wordPill) +
    row("Sentence phrases:", phrases, "badge-amber", insertChip);
  host.append(card);

  // Delegate: ＋ / plain chips insert; underlined words open the shared popup.
  card.addEventListener("click", (e) => {
    const ins = e.target.closest("[data-insert]");
    if (ins && card.contains(ins)) {
      insert(ins.getAttribute("data-insert"));
      return;
    }
    const word = e.target.closest(".nw-vocab-word");
    if (word && card.contains(word)) {
      const label = word.getAttribute("data-term");
      const entry =
        vocabByTerm.get(normTerm(label)) || sharedVocabByTerm.get(normalizeAcademicWord(label));
      if (entry) openObjectiveTermPopup(entry);
    }
  });
}

// Teacher-configurable warmup countdown length, in seconds. The value is a
// GLOBAL setting served by /api/settings/warmup (D1-backed): whatever a teacher
// sets applies universally — every student and every teacher device renders the
// same countdown on the interactive-lesson Phase 1 Warmup. localStorage mirrors
// the last-known value so the timer renders instantly and still works offline
// or when the shared backend is unavailable. Editing is Teacher-Mode only.
const WARMUP_TIME_KEY = "nt-warmup-seconds";
const WARMUP_TIME_DEFAULT = 180;
const WARMUP_TIME_MIN = 15;
const WARMUP_TIME_MAX = 3600;
const WARMUP_SETTINGS_URL = "/api/settings/warmup";

function clampWarmupSeconds(n) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return null;
  return Math.min(WARMUP_TIME_MAX, Math.max(WARMUP_TIME_MIN, v));
}

// The locally cached value (last global value we saw), used for instant render.
function getWarmupSeconds() {
  try {
    const raw = clampWarmupSeconds(localStorage.getItem(WARMUP_TIME_KEY));
    if (raw != null) return raw;
  } catch {
    /* localStorage unavailable — fall through to the default */
  }
  return WARMUP_TIME_DEFAULT;
}

// Write the local cache only (does not touch the shared backend).
function setWarmupSeconds(seconds) {
  const clamped = clampWarmupSeconds(seconds) ?? WARMUP_TIME_DEFAULT;
  try {
    localStorage.setItem(WARMUP_TIME_KEY, String(clamped));
  } catch {
    /* localStorage unavailable — nothing to persist */
  }
  return clamped;
}

// Read the GLOBAL warmup length from the shared backend and refresh the local
// cache. Returns the clamped seconds, or null if the backend is unavailable.
async function fetchGlobalWarmupSeconds() {
  try {
    const r = await fetch(WARMUP_SETTINGS_URL, { cache: "no-store" });
    if (!r.ok) return null;
    const j = await r.json();
    const s = clampWarmupSeconds(j && j.seconds);
    if (s == null) return null;
    setWarmupSeconds(s); // mirror into the local cache for the next render
    return s;
  } catch {
    return null;
  }
}

// Persist the warmup length GLOBALLY (all devices). Requires the teacher key,
// reusing the same `neft.teacher.key` / x-teacher-key mechanism as the other
// teacher tools. Returns one of: "ok" | "need-key" | "unauthorized" | "error".
async function saveGlobalWarmupSeconds(seconds) {
  let key = "";
  try {
    key = (localStorage.getItem("neft.teacher.key") || "").trim();
  } catch {
    /* ignore */
  }
  if (!key) return "need-key";
  try {
    const r = await fetch(WARMUP_SETTINGS_URL, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-teacher-key": key },
      body: JSON.stringify({ seconds }),
    });
    if (r.ok) return "ok";
    if (r.status === 401) return "unauthorized";
    return "error";
  } catch {
    return "error";
  }
}

function fmtWarmupClock(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function renderWarmupPhase(el, state, ctx, config) {
  const warmup = config.warmup;
  if (!warmup || !Array.isArray(warmup.questions) || warmup.questions.length === 0) return;

  phaseHeader(
    el,
    "1",
    "section-icon-teal",
    "Phase 1: Warmup",
    "Complete these 3–4 quick warmup questions reviewing previous lesson material before starting today's lesson.",
  );

  // Spaced retrieval runs BEFORE today's warmup. The warmup reviews the previous
  // lesson (yesterday); this reviews what the schedule says is about to be
  // forgotten (weeks ago). They answer different questions and both belong here,
  // in that order — nearest first, so the student warms up before reaching back.
  // Renders nothing at all when nothing is due, which is most page loads.
  const retrievalHost = document.createElement("div");
  el.append(retrievalHost);
  mountRetrievalOpener(retrievalHost, config, state, 0).catch(() => {
    /* the opener is additive — never block Warmup on it */
  });

  const card = document.createElement("div");
  card.className = "card card-warmup-phase";
  card.style.cssText =
    "margin: 16px 0 24px; border: 2px solid #0f6d78; border-radius: 16px; padding: 22px; background: #ffffff; box-shadow: 0 6px 20px rgba(15,109,120,0.12);";

  const prevTitle = warmup.prevLessonTitle ? ` (${warmup.prevLessonTitle})` : "";
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
      <div>
        <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#0f6d78; background:#e6f4f6; padding:4px 10px; border-radius:6px;">Phase 1 · Warmup</span>
        <h3 style="margin:6px 0 0; font-size:22px; font-weight:800; color:#14223a;">⚡ Warmup: Previous Lesson Check${esc(prevTitle)}</h3>
      </div>
      <div id="warmupScoreBadge" style="font-size:14.5px; font-weight:800; color:#0b5a63; background:#f0fdf4; border:1px solid #bbf7d0; padding:7px 15px; border-radius:10px;">
        ${warmup.questions.length} Questions · Autograded
      </div>
    </div>
    <p style="margin:0 0 16px; font-size:16.5px; font-weight:600; line-height:1.55; color:#3f4a5f;">
      Answer these 3–4 warmup questions reviewing previous lesson material before starting today's lesson.
    </p>
  `;

  const savedAnswers = state.getResponse(0, "warmup_answers") || {};

  // --- Warmup Timer (Teacher-Mode only) ---
  // The whole countdown — bar, controls, and auto-submit-on-expiry — is a
  // teacher facilitation tool. Students never see a timer; they just answer the
  // warmup questions. Everything below is gated to Teacher Mode. `timerBar` /
  // `warmupTimerId` are declared out here (null for students) because the
  // submit handler further down still touches them, guarded by `if (timerBar)`.
  let timerBar = null;
  let warmupTimerId = null;
  if (isTeacherMode()) {
    timerBar = document.createElement("div");
    timerBar.className = "warmup-timer-bar";
    timerBar.style.cssText =
      "display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:16px; margin:4px 0 20px; padding:20px 28px; background:linear-gradient(135deg, #f0f9ff, #e6f4f6); border:2px solid #bae6fd; border-radius:16px;";
    timerBar.innerHTML = `
    <span style="font-size:2.6rem; line-height:1;">⏱️</span>
    <span id="warmupTimerDisplay" style="font-size:56px; font-weight:900; color:#0f6d78; font-variant-numeric:tabular-nums; line-height:1;">${fmtWarmupClock(getWarmupSeconds())}</span>
    <span class="warmup-timer-label" style="font-size:20px; font-weight:700; color:#56627a;">press Start</span>
  `;
    // Place the timer immediately under the "Phase 1 · Warmup" header (above the
    // intro line) so it's the first thing students and teachers see.
    const warmupHeaderBlock = card.firstElementChild;
    if (warmupHeaderBlock) warmupHeaderBlock.after(timerBar);
    else card.prepend(timerBar);

    const initialLocalSeconds = getWarmupSeconds();
    let warmupSecondsLeft = initialLocalSeconds;
    const timerDisplay = timerBar.querySelector("#warmupTimerDisplay");
    const timerLabel = timerBar.querySelector(".warmup-timer-label");

    // Paint the bar in the palette matching the time left: calm teal (>30s),
    // amber (11–30s), red (≤10s). Separated so pause/resume/reset restore the
    // right colors for the current count.
    function applyWarmupPalette(s) {
      if (s <= 10) {
        timerDisplay.style.color = "#dc2626";
        timerBar.style.background = "linear-gradient(135deg, #fef2f2, #fee2e2)";
        timerBar.style.borderColor = "#fca5a5";
      } else if (s <= 30) {
        timerDisplay.style.color = "#b45309";
        timerBar.style.background = "linear-gradient(135deg, #fffbeb, #fef3c7)";
        timerBar.style.borderColor = "#fcd34d";
      } else {
        timerDisplay.style.color = "#0f6d78";
        timerBar.style.background = "linear-gradient(135deg, #f0f9ff, #e6f4f6)";
        timerBar.style.borderColor = "#bae6fd";
      }
    }

    // One countdown tick. Extracted so the interval can be re-armed on resume
    // without duplicating the color/pulse/expiry logic.
    function warmupTick() {
      warmupSecondsLeft--;
      timerDisplay.textContent = fmtWarmupClock(warmupSecondsLeft);
      applyWarmupPalette(warmupSecondsLeft);
      if (warmupSecondsLeft <= 10 && warmupSecondsLeft > 0) {
        timerDisplay.style.animation = "none";
        timerDisplay.offsetHeight; // reflow
        timerDisplay.style.animation = "pulse 0.6s ease-in-out";
      }
      if (warmupSecondsLeft <= 0) {
        clearInterval(warmupTimerId);
        warmupTimerId = null;
        timerDisplay.textContent = "0:00";
        timerLabel.textContent = "time's up!";
        syncWarmupControls();
        if (!savedAnswers.checked) checkBtn.click();
      }
    }

    // Assigned once the Pause/Reset controls are built so button labels track the
    // running/paused state; a no-op until then.
    let syncWarmupControls = () => {};

    // Paint the clock for the current remaining time WITHOUT running it. This is
    // the state the timer opens in: the warmup countdown is teacher-controlled,
    // so it never starts on its own — a class that arrives mid-transition should
    // not find 90 seconds already burned.
    function showWarmupCountdown() {
      timerDisplay.style.animation = "none";
      applyWarmupPalette(warmupSecondsLeft);
      timerDisplay.textContent = fmtWarmupClock(warmupSecondsLeft);
      timerLabel.textContent = warmupTimerId ? "remaining" : "press Start";
      syncWarmupControls();
    }

    // Start (or restart) the countdown from warmupSecondsLeft — only ever from
    // the teacher pressing Start.
    function startWarmupCountdown() {
      if (warmupTimerId) clearInterval(warmupTimerId);
      if (warmupSecondsLeft <= 0) return;
      timerDisplay.style.animation = "none";
      applyWarmupPalette(warmupSecondsLeft);
      timerDisplay.textContent = fmtWarmupClock(warmupSecondsLeft);
      timerLabel.textContent = "remaining";
      warmupTimerId = setInterval(warmupTick, 1000);
      syncWarmupControls();
    }

    // Stop the running countdown, keeping the remaining time intact so Start
    // picks up exactly where it left off.
    function stopWarmupCountdown() {
      if (!warmupTimerId) return;
      clearInterval(warmupTimerId);
      warmupTimerId = null;
      timerDisplay.style.animation = "none";
      timerLabel.textContent = "stopped";
      syncWarmupControls();
    }

    // Reset back to the configured warmup duration, STOPPED — the teacher starts
    // it again when the class is ready.
    function resetWarmupCountdown() {
      if (warmupTimerId) clearInterval(warmupTimerId);
      warmupTimerId = null;
      warmupSecondsLeft = getWarmupSeconds();
      showWarmupCountdown();
    }

    // Small transient confirmation shown inside the timer bar (its own line).
    function flashTimerNote(msg, ok = true) {
      let note = timerBar.querySelector(".warmup-timer-note");
      if (!note) {
        note = document.createElement("span");
        note.className = "warmup-timer-note";
        note.style.cssText = "width:100%; text-align:center; font-size:14px; font-weight:800;";
        timerBar.append(note);
      }
      note.style.color = ok ? "#15803d" : "#b45309";
      note.textContent = msg;
      clearTimeout(note._t);
      note._t = setTimeout(() => note.remove(), 3200);
    }

    if (!savedAnswers.checked) {
      // Deliberately NOT started here — see showWarmupCountdown(). The timer is
      // armed at the full time and waits for the teacher to press Start.
      showWarmupCountdown();

      // Start/Stop + Reset controls so the teacher running the lesson decides when
      // the warmup clock runs, can hold it (e.g. to finish a point), and can
      // restart it cleanly.
      const controlBtnCss =
        "padding:10px 18px; font-size:16px; font-weight:800; color:#0f6d78; background:#ffffff; border:2px solid #0f6d78; border-radius:10px; cursor:pointer;";

      // The primary control. It carries the whole start/stop contract, so it is
      // styled as the filled button in the bar — at rest it reads "▶ Start",
      // which is also the instruction for what to do next.
      const runBtn = document.createElement("button");
      runBtn.type = "button";
      runBtn.className = "warmup-timer-pause";
      runBtn.style.cssText = controlBtnCss;

      const resetBtn = document.createElement("button");
      resetBtn.type = "button";
      resetBtn.className = "warmup-timer-reset";
      resetBtn.textContent = "↻ Reset";
      resetBtn.title = "Set the warmup timer back to the full time (stopped)";
      resetBtn.style.cssText = controlBtnCss;

      // Keep the Start/Stop button label in sync with the timer state.
      syncWarmupControls = () => {
        const running = !!warmupTimerId;
        runBtn.textContent = running ? "⏹ Stop" : "▶ Start";
        runBtn.title = running ? "Stop the warmup timer" : "Start the warmup timer";
        runBtn.disabled = warmupSecondsLeft <= 0;
        runBtn.style.opacity = runBtn.disabled ? "0.5" : "1";
        runBtn.style.cursor = runBtn.disabled ? "default" : "pointer";
        // Filled while stopped so "press Start" is unmissable; outlined while
        // running so the countdown itself stays the loudest thing on screen.
        runBtn.style.background = running ? "#ffffff" : "#0f6d78";
        runBtn.style.color = running ? "#0f6d78" : "#ffffff";
      };

      runBtn.addEventListener("click", () => {
        if (warmupTimerId) stopWarmupCountdown();
        else startWarmupCountdown();
      });
      resetBtn.addEventListener("click", () => resetWarmupCountdown());

      timerBar.append(runBtn, resetBtn);
      syncWarmupControls();

      // Adopt the GLOBAL (universal) warmup length. Render started from the local
      // cache for instant paint; if the shared backend returns a different value
      // and the student hasn't started working yet (countdown still essentially
      // full), switch to it so every device shows the same teacher-set time.
      fetchGlobalWarmupSeconds().then((g) => {
        if (g == null || savedAnswers.checked) return;
        const elapsed = initialLocalSeconds - warmupSecondsLeft;
        if (g !== warmupSecondsLeft && elapsed <= 3) {
          warmupSecondsLeft = g;
          // Adopt the shared time on the clock face only. Late-arriving config
          // must never start a timer the teacher has not started, and must never
          // restart one they deliberately stopped.
          if (warmupTimerId) startWarmupCountdown();
          else showWarmupCountdown();
        }
      });

      // Change the warmup time allowed for EVERYONE. Saves globally via
      // /api/settings/warmup (teacher key) so every student and teacher device
      // inherits it; the local cache + countdown update immediately.
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "warmup-timer-edit";
      editBtn.title = "Teacher: set the warmup time allowed (applies to all devices)";
      editBtn.textContent = "✏️ Set time";
      editBtn.style.cssText =
        "margin-left:8px; padding:10px 18px; font-size:16px; font-weight:800; color:#0f6d78; background:#ffffff; border:2px solid #0f6d78; border-radius:10px; cursor:pointer;";

      async function pushGlobal(seconds) {
        let result = await saveGlobalWarmupSeconds(seconds);
        if (result === "need-key" || result === "unauthorized") {
          let existing = "";
          try {
            existing = localStorage.getItem("neft.teacher.key") || "";
          } catch {
            /* ignore */
          }
          const key = window.prompt(
            "Enter your teacher key to apply this time to ALL devices (saved for next time):",
            existing,
          );
          if (key && key.trim()) {
            try {
              localStorage.setItem("neft.teacher.key", key.trim());
            } catch {
              /* ignore */
            }
            result = await saveGlobalWarmupSeconds(seconds);
          }
        }
        if (result === "ok") flashTimerNote("✓ Applied to all devices", true);
        else if (result === "unauthorized")
          flashTimerNote("Saved here only — teacher key not accepted", false);
        else flashTimerNote("Saved on this device only", false);
      }

      editBtn.addEventListener("click", () => {
        const currentMin = Math.round((getWarmupSeconds() / 60) * 10) / 10;
        const answer = window.prompt(
          "Warmup time allowed, in minutes.\nApplies to ALL devices — you and every other teacher.",
          String(currentMin),
        );
        if (answer == null) return;
        const mins = parseFloat(answer);
        if (!Number.isFinite(mins) || mins <= 0) {
          window.alert("Please enter a number of minutes greater than 0 (e.g. 3 or 1.5).");
          return;
        }
        const seconds = setWarmupSeconds(mins * 60);
        warmupSecondsLeft = seconds;
        // Setting the time re-arms the clock; it does not start it. If the timer
        // was already running, keep it running on the new length.
        if (warmupTimerId) startWarmupCountdown();
        else showWarmupCountdown();
        pushGlobal(seconds);
      });
      timerBar.append(editBtn);
    } else {
      timerDisplay.textContent = "✅";
      timerLabel.textContent = "Submitted";
    }
  } // end if (isTeacherMode()) — warmup timer is teacher-only

  const questionsContainer = document.createElement("div");
  questionsContainer.className = "warmup-questions-list";
  questionsContainer.style.cssText = "display:flex; flex-direction:column; gap:16px;";

  const total = warmup.questions.length;

  warmup.questions.forEach((q, qIdx) => {
    const qBox = document.createElement("div");
    qBox.className = "warmup-question-card";
    qBox.style.cssText =
      "border:1px solid #cbd5e1; border-radius:12px; padding:16px; background:#f8fafc;";

    // Warmup text is read from across the room and by students who need larger
    // print, so the stem is deliberately heavier and larger than body copy.
    const qTitle = document.createElement("div");
    qTitle.style.cssText =
      "font-weight:800; font-size:19px; line-height:1.5; color:#0f172a; margin-bottom:12px;";
    qTitle.innerHTML = `<span style="color:#0f6d78; font-weight:900; margin-right:6px;">Q${qIdx + 1}.</span> ${esc(q.stem)}`;
    qBox.append(qTitle);

    const choicesGroup = document.createElement("div");
    choicesGroup.style.cssText = "display:flex; flex-direction:column; gap:8px;";

    const feedbackBox = document.createElement("div");
    feedbackBox.className = "warmup-fb-box";
    feedbackBox.style.cssText =
      "display:none; font-size:15.5px; font-weight:700; line-height:1.5; padding:11px 14px; border-radius:8px; margin-top:10px;";

    const selectedIdx = savedAnswers[qIdx];

    q.choices.forEach((choiceText, cIdx) => {
      const choiceLabel = document.createElement("label");
      choiceLabel.style.cssText =
        "display:flex; align-items:center; gap:12px; padding:12px 14px; border:1px solid #cbd5e1; border-radius:8px; background:#ffffff; cursor:pointer; font-size:17px; font-weight:600; line-height:1.45; color:#0f172a; transition:all 0.15s;";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `warmup_q_p0_${qIdx}`;
      radio.value = cIdx;
      // Larger hit target so the choice is easy to see and tap on a Chromebook.
      radio.style.cssText = "width:20px; height:20px; flex:0 0 auto; accent-color:#0f6d78;";
      if (selectedIdx === cIdx) radio.checked = true;

      radio.addEventListener("change", () => {
        savedAnswers[qIdx] = cIdx;
        state.saveResponse(0, "warmup_answers", savedAnswers);
      });

      choiceLabel.append(radio);
      const span = document.createElement("span");
      span.innerHTML = esc(choiceText);
      choiceLabel.append(span);
      choicesGroup.append(choiceLabel);
    });

    qBox.append(choicesGroup);
    qBox.append(feedbackBox);

    if (savedAnswers.checked) {
      evaluateWarmupQuestion(qBox, q, selectedIdx, feedbackBox);
    }

    questionsContainer.append(qBox);
  });

  const btnRow = document.createElement("div");
  btnRow.style.cssText =
    "margin-top:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;";

  const checkBtn = document.createElement("button");
  checkBtn.type = "button";
  checkBtn.className = "btn btn-primary";
  checkBtn.style.cssText =
    "padding:12px 24px; font-weight:800; font-size:16.5px; background:#0f6d78; color:#ffffff; border:none; border-radius:10px; cursor:pointer;";
  checkBtn.textContent = savedAnswers.checked ? "Score Final (Submitted)" : "Submit Warmup Answers";
  if (savedAnswers.checked) {
    checkBtn.disabled = true;
    checkBtn.style.background = "#64748b";
    checkBtn.style.cursor = "default";
  }

  checkBtn.addEventListener("click", () => {
    if (warmupTimerId) {
      clearInterval(warmupTimerId);
      warmupTimerId = null;
    }
    // Timer chrome only exists in Teacher Mode; students have no bar to update.
    if (timerBar) {
      const td = card.querySelector("#warmupTimerDisplay");
      if (td) td.textContent = "✅";
      const tl = timerBar.querySelector(".warmup-timer-label");
      if (tl) tl.textContent = "Submitted";
      // Retire the teacher "Set time" control once the warmup is locked in.
      timerBar.querySelector(".warmup-timer-edit")?.remove();
      timerBar.style.background = "linear-gradient(135deg, #f0fdf4, #dcfce7)";
      timerBar.style.borderColor = "#86efac";
    }

    let correctCount = 0;
    savedAnswers.checked = true;

    warmup.questions.forEach((q, qIdx) => {
      const qBox = questionsContainer.children[qIdx];
      const selIdx = savedAnswers[qIdx];
      const fb = qBox.querySelector(".warmup-fb-box");
      if (selIdx === q.correctIndex) correctCount++;
      evaluateWarmupQuestion(qBox, q, selIdx, fb);
    });

    state.saveResponse(0, "warmup_answers", savedAnswers);
    state.markCompleted(0);

    checkBtn.disabled = true;
    checkBtn.textContent = "Score Final (Submitted)";
    checkBtn.style.background = "#64748b";
    checkBtn.style.cursor = "default";

    const badge = card.querySelector("#warmupScoreBadge");
    if (badge) {
      badge.textContent = `Final Score: ${correctCount}/${total} (${Math.round((correctCount / total) * 100)}%)`;
      badge.style.background = correctCount === total ? "#dcfce7" : "#fef3c7";
      badge.style.color = correctCount === total ? "#15803d" : "#b45309";
    }

    if (correctCount / total <= 0.75) {
      renderReteachHelper(card, warmup, correctCount, total, config);
    }
  });

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn btn-teal";
  nextBtn.style.cssText =
    "padding:12px 26px; font-weight:800; font-size:16.5px; background:#14223a; color:#ffffff; border:none; border-radius:10px; cursor:pointer;";
  nextBtn.textContent = "Continue to Phase 2: Objectives 🎯";
  nextBtn.addEventListener("click", () => {
    if (ctx && typeof ctx.nextPhase === "function") {
      ctx.nextPhase();
    }
  });

  btnRow.append(checkBtn, nextBtn);
  card.append(questionsContainer);
  card.append(btnRow);

  if (savedAnswers.checked) {
    let correctCount = 0;
    warmup.questions.forEach((q, qIdx) => {
      if (savedAnswers[qIdx] === q.correctIndex) correctCount++;
    });
    const badge = card.querySelector("#warmupScoreBadge");
    if (badge) {
      badge.textContent = `Final Score: ${correctCount}/${total} (${Math.round((correctCount / total) * 100)}%)`;
      badge.style.background = correctCount === total ? "#dcfce7" : "#fef3c7";
      badge.style.color = correctCount === total ? "#15803d" : "#b45309";
    }

    if (correctCount / total <= 0.75) {
      renderReteachHelper(card, warmup, correctCount, total, config);
    }
  }

  el.append(card);
}

function renderObjectivesIntroPhase(el, state, ctx, config) {
  phaseHeader(
    el,
    "2",
    "section-icon-teal",
    "Phase 2: Learning Objectives",
    "Review today's Content and Language Objectives so you know what you are aiming for!",
  );

  const card = document.createElement("div");
  card.className = "card card-objectives-intro-phase";
  card.style.cssText =
    "margin: 16px 0 24px; border: 2px solid #0f6d78; border-radius: 16px; padding: 22px; background: #ffffff; box-shadow: 0 6px 20px rgba(15,109,120,0.12);";

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
      <div>
        <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#0f6d78; background:#e6f4f6; padding:4px 10px; border-radius:6px;">Phase 2 · Objectives</span>
        <h3 style="margin:6px 0 0; font-size:22px; font-weight:800; color:#14223a;">🎯 Today's Learning Objectives</h3>
      </div>
      <div style="font-size:13px; font-weight:800; color:#0f6d78; background:#e0f2fe; border:1px solid #bae6fd; padding:6px 14px; border-radius:10px;">
        Goal Setting
      </div>
    </div>
    <p style="margin:0 0 16px; font-size:15px; color:#56627a;">
      Read through today's Content Goal and Language Goal. These are the skills you will master by the end of today's lesson!
    </p>
  `;

  renderObjectives(card, config, state);

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "btn btn-teal";
  nextBtn.style.cssText =
    "margin-top:20px; padding:12px 24px; font-weight:800; font-size:15px; background:#14223a; color:#ffffff; border:none; border-radius:10px; cursor:pointer;";
  nextBtn.textContent = "Continue to Phase 3: Launch 🚀";
  nextBtn.addEventListener("click", () => {
    state.markCompleted(1);
    if (ctx && typeof ctx.nextPhase === "function") {
      ctx.nextPhase();
    }
  });

  card.append(nextBtn);
  el.append(card);
}

function renderReteachHelper(container, warmup, _correctCount, _total, config) {
  if (container.querySelector(".warmup-reteach-card")) return;

  const reteachBox = document.createElement("div");
  reteachBox.className = "warmup-reteach-card";
  reteachBox.style.cssText =
    "margin-top:20px; border:2px solid #eab308; border-radius:14px; padding:18px; background:#fefce8; box-shadow:0 4px 14px rgba(234,179,8,0.15);";

  const prevTitle = warmup.prevLessonTitle
    ? esc(warmup.prevLessonTitle)
    : "Previous Lesson Concept";

  reteachBox.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
      <span style="font-size:22px;">💡</span>
      <div>
        <h4 style="margin:0; font-size:18px; font-weight:800; color:#713f12;">Quick Reteach: ${prevTitle}</h4>
        <div style="font-size:14.5px; font-weight:600; color:#7c4a0e;">Let's quickly review this step-by-step before moving to Phase 2 Launch!</div>
      </div>
    </div>
    <div style="background:#ffffff; border:1px solid #fef08a; border-radius:10px; padding:14px; margin-bottom:14px; font-size:16px; font-weight:500; color:#293548; line-height:1.6;">
      <div style="font-weight:800; font-size:16.5px; color:#0f172a; margin-bottom:6px;">📌 Core Strategy Recap:</div>
      <div>To tackle ${prevTitle}, break the problem into clear steps:</div>
      <ul style="margin:6px 0 0 20px; padding:0;">
        <li>Identify what key quantity or relationship the problem asks for.</li>
        <li>Use a visual representation (like a number line, array, or tape diagram) to model the values.</li>
        <li>Verify your answer choice before finalizing.</li>
      </ul>
    </div>
    <div id="reteachMiniCheck" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:10px; padding:14px;">
      <div style="font-weight:800; font-size:16px; color:#0f172a; margin-bottom:8px;">
        <span style="color:#a16207; font-weight:900;">Mini-Check:</span> Try this quick practice item to rebuild your confidence:
      </div>
      <div style="font-size:16.5px; font-weight:600; line-height:1.5; color:#293548; margin-bottom:10px;">
        Which strategy helps verify your answer when solving math problems?
      </div>
      <div style="display:flex; flex-direction:column; gap:8px;">
        <button type="button" class="btn-reteach-opt" data-correct="false" style="text-align:left; padding:11px 14px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; cursor:pointer; font-size:16px; font-weight:600; line-height:1.45; color:#0f172a;">Guessing quickly without writing steps</button>
        <button type="button" class="btn-reteach-opt" data-correct="true" style="text-align:left; padding:11px 14px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; cursor:pointer; font-size:16px; font-weight:600; line-height:1.45; color:#0f172a;">Modeling the problem and checking key calculations</button>
      </div>
      <div id="reteachFb" style="display:none; margin-top:10px; padding:9px 14px; border-radius:8px; font-size:15px; font-weight:800;"></div>
    </div>
  `;

  const miniCheck = reteachBox.querySelector("#reteachMiniCheck");
  const fb = reteachBox.querySelector("#reteachFb");

  miniCheck.querySelectorAll(".btn-reteach-opt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const isCorrect = btn.dataset.correct === "true";
      miniCheck.querySelectorAll(".btn-reteach-opt").forEach((b) => (b.disabled = true));
      fb.style.display = "block";
      if (isCorrect) {
        btn.style.background = "#dcfce7";
        btn.style.borderColor = "#22c55e";
        fb.style.background = "#f0fdf4";
        fb.style.color = "#15803d";
        fb.innerHTML = "Great job! You're ready for Phase 2: Launch 🚀";
      } else {
        btn.style.background = "#fef2f2";
        btn.style.borderColor = "#ef4444";
        fb.style.background = "#fef2f2";
        fb.style.color = "#b91c1c";
        fb.innerHTML = "Remember to break the problem into steps! You've got this.";
      }
      try {
        if (window.NTSignal && typeof window.NTSignal.record === "function") {
          window.NTSignal.record({
            standard: config.standard || "WARMUP_RETEACH",
            correct: isCorrect,
            misconceptionTag: "warmup_reteach",
            lesson: config.lessonId || "",
          });
        }
      } catch (_e) {}
    });
  });

  const btnRow = container.querySelector(".btn-warmup-actions") || container.lastChild;
  container.insertBefore(reteachBox, btnRow);
}

function evaluateWarmupQuestion(qBox, q, selectedIdx, feedbackBox) {
  const choices = qBox.querySelectorAll("label");
  const inputs = qBox.querySelectorAll("input[type='radio']");

  // Disable choices once checked (score is final)
  inputs.forEach((input) => {
    input.disabled = true;
  });

  choices.forEach((lbl, cIdx) => {
    lbl.style.borderColor = "#cbd5e1";
    lbl.style.background = "#ffffff";
    lbl.style.cursor = "default";

    if (selectedIdx === cIdx) {
      if (cIdx === q.correctIndex) {
        lbl.style.borderColor = "#22c55e";
        lbl.style.background = "#f0fdf4";
        lbl.style.fontWeight = "800";
      } else {
        lbl.style.borderColor = "#ef4444";
        lbl.style.background = "#fef2f2";
      }
    }
  });

  feedbackBox.style.display = "block";
  if (selectedIdx === q.correctIndex) {
    feedbackBox.style.background = "#f0fdf4";
    feedbackBox.style.color = "#15803d";
    feedbackBox.style.border = "1px solid #bbf7d0";
    feedbackBox.innerHTML = `<strong>Correct! ✓</strong>`;
  } else if (selectedIdx !== undefined) {
    feedbackBox.style.background = "#fef2f2";
    feedbackBox.style.color = "#b91c1c";
    feedbackBox.style.border = "1px solid #fecaca";
    feedbackBox.innerHTML = `<strong>Incorrect. ✘</strong>`;
  } else {
    feedbackBox.style.background = "#fffbe0";
    feedbackBox.style.color = "#92400e";
    feedbackBox.style.border = "1px solid #fef08a";
    feedbackBox.innerHTML = `<strong>Unanswered.</strong>`;
  }
}

function renderLaunchPhase(el, state, ctx, config) {
  const cfg = config.launch;

  // When the lesson ships a richer Reveal "Notice & Wonder" card (rendered by
  // renderNoticeAndWonder, which has its own response boxes), it owns the
  // notice/wonder capture and we skip the generic grid below — no duplicates.
  const hasRevealNW = !!(config.noticeAndWonder && typeof config.noticeAndWonder === "object");

  // Top: student identity (name / period), homework link, pre-lesson hint.
  renderLaunchHeader(el, state, config);

  // ── Phase 3: Launch ────────────────────────────────────────────────────────
  phaseHeader(
    el,
    "3",
    "section-icon-teal",
    "Phase 3: Launch",
    "Look at today's scene. What do you notice? What do you wonder?",
  );

  // The observation visual (the scene students look at) renders FIRST, so the
  // "I notice / I wonder" prompts have something concrete to observe and the
  // sentence starters / academic vocabulary can sit directly beneath the boxes.
  // Opt-in; no-op when the lesson has no launch visual.
  renderLaunchVisual(el, cfg.visual);

  // Which One Doesn't Belong — a low-floor argument before any notation appears.
  // It sits between the scene and the notice/wonder boxes on purpose: it warms
  // up the same justification move those boxes ask for, but with four concrete
  // objects instead of a blank field. Async and opt-in — a lesson whose standard
  // has no authored set renders nothing here and the phase is unchanged.
  const wodbHost = document.createElement("div");
  el.append(wodbHost);
  mountWodbOpener(wodbHost, config, state, 0).catch(() => {
    /* the opener is additive — never block Launch on it */
  });

  // Level 3 · Adaptive Small Group launch link. Teacher-only, and only for
  // lessons with a validated configuration. Additive: see level3-launch.js.
  mountLevel3Launch(el, config);

  // Notice & Wonder + language support laid out side-by-side: the notice/wonder
  // boxes fill the left column (nwMain); the "Words & phrases to use" support
  // card sits to their right (nwAside) and drops below on narrow screens.
  const nwMain = document.createElement("div");
  nwMain.className = "nw-support-main";

  // Notice & Wonder (Reveal data-context) capture — image + notice/wonder boxes.
  // No-op when absent.
  renderNoticeAndWonder(nwMain, config, state);

  // Generic Notice / Wonder capture — only when the lesson has no richer Reveal
  // Notice & Wonder card (see hasRevealNW), so students never see two identical
  // notice/wonder prompts.
  let noticeTA = null;
  let wonderTA = null;
  if (!hasRevealNW) {
    const grid = document.createElement("div");
    grid.className = "grid-2";

    const noticeCard = document.createElement("div");
    noticeCard.className = "card card-teal";
    noticeCard.innerHTML = `<h4 style="color:var(--teal-ink); margin-bottom:var(--sp-3);">👀 I Notice...</h4>
      ${(cfg.noticePrompts || []).map((p) => `<div class="sentence-frame" style="margin-bottom:var(--sp-2);"><span style="font-weight:600;">${esc(p)}</span></div>`).join("")}`;
    noticeTA = document.createElement("textarea");
    noticeTA.className = "text-input";
    noticeTA.rows = 3;
    noticeTA.placeholder = "I notice that...";
    noticeTA.value = state.getResponse(0, "notice") || "";
    noticeTA.addEventListener("input", () => state.saveResponse(0, "notice", noticeTA.value));
    noticeCard.append(noticeTA);

    const wonderCard = document.createElement("div");
    wonderCard.className = "card card-coral";
    wonderCard.innerHTML = `<h4 style="color:var(--coral); margin-bottom:var(--sp-3);">🤔 I Wonder...</h4>
      ${(cfg.wonderPrompts || []).map((p) => `<div class="sentence-frame" style="margin-bottom:var(--sp-2); border-color:rgba(217,121,93,0.25); background:rgba(217,121,93,0.06);"><span style="font-weight:600;">${esc(p)}</span></div>`).join("")}`;
    wonderTA = document.createElement("textarea");
    wonderTA.className = "text-input";
    wonderTA.rows = 3;
    wonderTA.placeholder = "I wonder if...";
    wonderTA.value = state.getResponse(0, "wonder") || "";
    wonderTA.addEventListener("input", () => state.saveResponse(0, "wonder", wonderTA.value));
    wonderCard.append(wonderTA);

    grid.append(noticeCard, wonderCard);
    nwMain.append(grid);
  }

  // ESOL support, rendered to the RIGHT of the notice/wonder boxes: academic
  // words + sentence phrases tied to the picture, tap to insert into whichever
  // response box is focused. `fieldRoot` (the shared row) lets the chips still
  // find the notice/wonder textareas in the sibling column. `config` lets
  // academic words open the glossary popup when the lesson defines that term.
  // ESOL support (academic words + sentence phrases) renders in a full-width
  // strip BELOW the image + notice/wonder boxes, so the layout reads top-to-
  // bottom: scene image beside the boxes, then the word/phrase bank under them.
  // Tapped chips still insert into whichever notice/wonder box was focused —
  // `nwStack` is the shared root that scopes that focus lookup.
  const nwStack = document.createElement("div");
  nwStack.className = "nw-support-stack";
  nwStack.append(nwMain);
  renderNoticeWonderSupport(nwStack, cfg.beCurious, config, nwStack);
  el.append(nwStack);

  // Note: Objectives card sits directly in between Warmup and Launch (rendered at bottom of Warmup phase).

  // ── Launch is now "Be Curious" only ─────────────────────────────────────────
  // The application scenario (word problem) and the guided "Show Your Work" solve
  // have MOVED out of the Launch phase. They now render UNDER the Learn It panel
  // (app.js openExtra("learn")), below the learn.html iframe, via the
  // ctx.renderLearnItExtras hook set below. The new curated flow is:
  //   Launch (Be Curious) → Vocab → Learn It (concept + moved problems) → Lesson.
  //
  // The hook closes over this lesson's cfg / config / state. Show Your Work still
  // reads and writes on phase index 0 (Launch) — see renderShowYourWork — so any
  // work a student saved persists exactly as before, wherever it is rendered.
  ctx.renderLearnItExtras = (learnHost) => {
    if (!learnHost) return;

    // 1) The application scenario card (the word problem + optional theme art).
    const scenario = document.createElement("div");
    scenario.className = "card launch-scenario-card";
    scenario.innerHTML = `
      <div class="badge badge-amber mb-4">${esc(cfg.badge || config.title)}</div>
      <p class="launch-narrative" data-annotate="word-problem">${renderMathText(cfg.narrative)}</p>`;
    if (cfg.contextImage || config.theme || config.heroFigure) {
      renderThemeIllustration(scenario, config.theme, cfg.contextImage || null, config.heroFigure);
    }
    learnHost.append(scenario);

    // Tap-to-reveal story beats: the same narrative chunked into labeled
    // parts ("Set the Scene" → "Your Role") for readers who lose the thread
    // in the full paragraph. Authored-but-unwired until the 2026-07-20
    // dormant-feature sweep; renders nothing for 1-2 sentence narratives.
    renderLaunchStoryBeats(learnHost, config);

    // 2) Inline Reveal Math slides for the launch + instruction sections — the
    //    "how it's taught" visuals belong with Learn It, not with Be Curious.
    renderRevealSlides(learnHost, config, ["launch", "instruction"]);

    // 3) Show Your Work — the application problem + a guided, typeable solve-it
    //    scaffold. Persists on phase index 0 (Launch) so saved work survives.
    renderShowYourWork(learnHost, config, state);

    // 4) Let students mark up the word problems (highlight / underline / bold).
    //    (Turn & Talk is now integrated into the Show Your Work problem above,
    //    via renderShowYourWork — not a separate card.)
    enableWordProblemAnnotation(learnHost);
  };

  const isEs = getPreferredLang() === "es";
  const btn = document.createElement("button");
  btn.className = "btn btn-primary btn-lg mt-6";
  const isStudied = (state.get() || {}).vocabVisited || (state.get() || {}).notesVisited;
  btn.textContent = isStudied
    ? isEs
      ? "Continuar a la Fase 4: Explorar 🔍 →"
      : "Continue to Phase 4: Explore 🔍 →"
    : isEs
      ? "🔑 Vocabulario 🚀 →"
      : "🔑 Vocabulary 🚀 →";

  btn.addEventListener("click", async () => {
    if (
      noticeTA &&
      wonderTA &&
      (noticeTA.value.trim().length < 5 || wonderTA.value.trim().length < 5)
    ) {
      let fb = el.querySelector(".launch-fb");
      if (!fb) {
        fb = ctx.engagement.createFeedback(
          "hint",
          "Write at least a short response in both boxes.",
        );
        fb.classList.add("launch-fb");
        el.append(fb);
      }
      return;
    }
    el.querySelector(".launch-fb")?.remove();
    await completePhase(el, ctx, state, 2, "Launch", 1, 1, { quiet: true });
    if (isStudied) {
      if (typeof ctx.navigateTo === "function") {
        ctx.navigateTo(3);
      } else if (typeof ctx.nextPhase === "function") {
        ctx.nextPhase();
      }
    } else {
      ctx.openExtra("vocab");
    }
  });
  el.append(btn);
}

// ── Phase 3: Explore ──
function renderExplorePhase(el, state, ctx, config) {
  const cfg = config.explore;
  phaseHeader(
    el,
    "🔍",
    "section-icon-teal",
    "Explore",
    cfg.instructions || "Investigate the concept with an interactive tool.",
  );

  // Opt-in data diagram shown up front so students can SEE and read the visual
  // while they work the interaction below it. `diagram` accepts any visual kind
  // (histogram, dot-plot, box-plot, bar-chart, number-line); `histogram` kept
  // for back-compat.
  const exploreDiagram = cfg.diagram || cfg.histogram;
  let exploreFig = null;
  if (exploreDiagram) {
    exploreFig = document.createElement("div");
    exploreFig.className = "card";
    exploreFig.innerHTML = cfg.diagram ? buildVisual(cfg.diagram) : histogramSVG(cfg.histogram);
    // Held, not appended: it is placed beside the activity below rather than
    // stacked above it. Mounted after placement so the component measures a
    // node that is already in its final column.
  }

  // Surface a Turn & Talk discussion moment after the Explore interaction.
  // It is non-graded: confirming it advances the phase. A "Skip / Continue"
  // affordance is built into the button flow so it never blocks progress.
  // An optional `ttPrompt` overrides the generic explore prompt — used to run
  // the authored post-activity discussion as a SPOKEN follow-up (see below).
  const showTurnTalkThenComplete = (ttPrompt) => {
    renderTurnAndTalk(
      el,
      ttPrompt || resolveTurnTalk("explore", config),
      state,
      2,
      () => {
        completePhase(el, ctx, state, 1, "Explore", 1, 1);
      },
      config,
    );
    const cont = document.createElement("button");
    cont.type = "button";
    cont.className = "btn btn-primary btn-lg mt-4";
    cont.textContent = "Continue to Practice →";
    cont.addEventListener("click", () => completePhase(el, ctx, state, 1, "Explore", 1, 1));
    el.append(cont);
  };

  const exploreShell = document.createElement("div");
  exploreShell.className = "explore-problem-wrap";
  if (exploreFig) {
    // Figure on the right, the activity it describes on the left, so a student
    // reading the data can work the interaction without scrolling away from it.
    const pair = openWorkPair(el);
    pair.main.append(exploreShell);
    pair.tool.append(exploreFig);
    // Explore is where the building happens, so this is the mount that most
    // needs to remember. phaseId 1 = Explore.
    mountInteractiveVisuals(exploreFig, { state, phaseId: 1 });
  } else {
    el.append(exploreShell);
  }

  // Inline Reveal Math slides for the Explore section.
  renderRevealSlides(el, config, "explore");

  renderComponent(
    exploreShell,
    // `diagram` is already rendered once as the section-level figure above
    // (exploreDiagram). Drop it here so renderComponent's per-item diagram
    // slot doesn't render the SAME figure a second time (was producing two
    // identical balance widgets in Explore).
    { ...cfg, diagram: undefined, stem: cfg.instructions || cfg.stem },
    () => {
      if (cfg.discourse) {
        // Post-activity discussion is now a SPOKEN Turn & Talk (not a writing
        // box) that asks a DISTINCT follow-up — "press for reasoning" — rather
        // than repeating the activity's prompt. The authored discourse prompt is
        // used only as a topic seed. Non-graded; the Continue button always
        // advances the phase.
        showTurnTalkThenComplete({
          phase: "explore-discuss",
          question: deriveDiscussionFollowUp(cfg.discourse.prompt, config, {
            authored: cfg.discourse.followUp,
            keywords: cfg.discourse.keywords,
          }),
          stems: DEFAULT_TURN_TALK_STEMS,
        });
      } else {
        showTurnTalkThenComplete();
      }
    },
    { number: 1, total: 1, skipHints: true },
  );
}

// ── Phase 4: Practice (adaptive) ──
const TIER_LABELS = {
  level1: { name: "Level 1", badge: "badge-teal" },
  core: { name: "On Level", badge: "badge-amber" },
  level2: { name: "Level 2", badge: "badge-navy" },
};

// Leveled coaching register per tier — the same voice contract the
// small-group studio uses (supportive build / steady core / skeptic press).
// Chrome only; the problems themselves are untouched.
const TIER_VOICE = {
  level1: "One step at a time — the hint below is part of the plan, not a penalty.",
  core: "Solve it, check it, and be ready to say your because out loud.",
  level2: "Push further: would your reasoning convince a skeptic?",
};

function renderWorkedExamplePanel(host, config) {
  const worked = deriveWorkedSteps(config);
  if (!worked.iDo) return;

  const panel = document.createElement("details");
  panel.className = "worked-example-panel";
  panel.open = true;

  const steps = (worked.iDo.steps || [])
    .map(
      (s, i) =>
        `<li class="worked-step"><span class="worked-step-num">${i + 1}</span><span>${esc(s)}</span></li>`,
    )
    .join("");

  panel.innerHTML = `
    <summary class="worked-example-summary">
      <span class="worked-example-icon" aria-hidden="true">📝</span>
      <span><strong>Worked Example</strong> — watch how it's done before you practice</span>
    </summary>
    <div class="worked-example-body">
      <p class="worked-example-problem">${esc(worked.iDo.problem)}</p>
      <ol class="worked-example-steps">${steps}</ol>
      ${worked.iDo.answer ? `<div class="worked-example-answer"><strong>Answer:</strong> ${esc(worked.iDo.answer)}</div>` : ""}
    </div>`;
  host.append(panel);
}

function renderCommonMistakeCallout(host, config) {
  const text = deriveCommonMistake(config);
  if (!text) return;

  // Compact: lead with the core warning (first sentence) so the callout stays a
  // quick glance; tuck any elaboration (examples, "before you submit…") into a
  // collapsible instead of a full paragraph.
  const parts = String(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lead = parts.shift() || text;
  const rest = parts.join(" ");

  const box = document.createElement("div");
  box.className = "common-mistake-callout";
  box.innerHTML = `
    <span class="common-mistake-icon" aria-hidden="true">⚠️</span>
    <div>
      <strong>${stackHtml(t("commonMistake", "en"), t("commonMistake", "es"))}</strong>
      <p style="margin:2px 0 0;">${esc(lead)}</p>
      ${
        rest
          ? `<details class="cm-more" style="margin-top:4px;"><summary style="cursor:pointer; font-size:.85rem; color:var(--muted);">See an example</summary><p style="margin:4px 0 0;">${esc(rest)}</p></details>`
          : ""
      }
    </div>`;
  host.append(box);
}

// Normalize a typed math answer for the "is this simple enough to mark wrong?"
// heuristic below: lowercase, strip spaces, unify the many multiplication
// symbols, and turn unicode superscripts into ^n. Equivalence itself is decided
// by the site-wide matcher in answer-match.js, not here.
function normalizeAnswer(s) {
  return String(s == null ? "" : s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[×x*·•]/g, "*")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/⁴/g, "^4")
    .replace(/[.,;]+$/, "");
}

// Decide whether a typed answer can be auto-graded, and if so whether it's
// correct. Returns {graded:false} for complex expressions (formatting varies too
// much to grade fairly) so the UI falls back to a self-check reveal.
//
// Correctness goes through the shared matcher, so "7", "m = 7" and "7 boxes"
// all count when the authored answer is "m = 7" — the variable label and the
// unit are habits worth suggesting, not grounds for a red X. `hint` carries the
// fuller authored form so the UI can suggest it after crediting the answer.
function gradeSkillAnswer(student, correct) {
  if (!normalizeAnswer(student)) return { graded: false };
  if (isRight(student, correct))
    return { graded: true, correct: true, hint: fullerFormHint(student, correct) };
  // Short, simple answers (one word/number, no operators) are safe to mark wrong.
  const b = normalizeAnswer(stripLabelForGrading(correct));
  if (b.length <= 12 && !/[*^/+]/.test(b)) return { graded: true, correct: false };
  return { graded: false };
}

// "m = 7" is as simple to grade as "7"; judge the value, not the label.
function stripLabelForGrading(correct) {
  const first = Array.isArray(correct) ? correct.find((a) => a != null) : correct;
  return String(first ?? "").replace(/^\s*[a-z][a-z0-9]?\s*=\s*/i, "");
}

// Real skill practice: a few of the lesson's own problems presented as "solve
// it" — show your steps, write the answer, then check. Numbers and short answers
// are auto-graded (✅/❌); complex expressions fall back to a self-check reveal.
// Genuinely practices the skill (not only matching/sorting games), and saves
// work to the Practice phase responses. No-op when there are no solvable items.
// Put an interactive tool beside the work it supports instead of above it.
// Returns the two columns: `main` for the problems, `tool` for the manipulative.
// Callers append the tool once and then keep appending problem content to
// `main`; anything appended to the original host afterwards still lands full
// width below the pair, which is what wide content wants.
function openWorkPair(host) {
  const pair = document.createElement("div");
  pair.className = "nt-work-pair";
  const main = document.createElement("div");
  main.className = "nt-work-main";
  const tool = document.createElement("div");
  tool.className = "nt-work-tool";
  pair.append(main, tool);
  host.append(pair);
  return { main, tool };
}

function renderSkillPractice(host, config, state) {
  const p = config.practice || {};
  // The Worked Example panel above (renderWorkedExamplePanel) reveals the I-Do
  // problem AND its answer, derived from the first eligible practice stem item.
  // Skip that exact item here so "Problem 1" isn't the same question the student
  // was just handed the answer to — otherwise practice starts pre-solved.
  const revealedStem = deriveWorkedSteps(config).iDo?.problem || null;
  const pool = []
    .concat(p.approaching || [], p.onLevel || [], p.extending || [])
    .filter(
      (it) =>
        it &&
        it.stem &&
        it.stem !== revealedStem &&
        (Array.isArray(it.choices) || it.sampleAnswer || it.answer) &&
        (it.type === "multiple-choice" || it.type === "open-response" || !it.type),
    )
    .slice(0, 3);
  if (!pool.length) return;

  const total = pool.length;
  const delayed = getFeedbackMode(config) === MODES.delayed;
  const checkers = [];
  const card = document.createElement("div");
  card.className = `card skill-practice${delayed ? " skill-practice-delayed" : ""}`;
  card.innerHTML = `
    <h4 style="color:var(--navy,#264653); margin:0 0 var(--sp-2,8px);">✏️ Practice the skill — solve these</h4>
    <p class="sp-intro">${
      delayed
        ? `Work all ${total} problems first. You will see how you did once every answer is in — thinking it through without a hint after each one is what makes it stick.`
        : "Work each problem. Show your steps, write your answer, then tap <strong>Check answer</strong>."
    }</p>`;

  // The teacher control sits ABOVE the problems so a teacher setting up the room
  // sees it before the class does, and re-renders the section on change so the
  // switch takes effect immediately instead of on the next lesson.
  if (isTeacherMode()) {
    const toggleSlot = document.createElement("div");
    card.append(toggleSlot);
    mountFeedbackModeToggle(toggleSlot, config, () => {
      card.remove();
      renderSkillPractice(host, config, state);
    });
  }

  pool.forEach((it, i) => {
    const answer =
      Array.isArray(it.choices) && typeof it.correctIndex === "number"
        ? it.choices[it.correctIndex]
        : it.sampleAnswer || it.answer || "";
    // Show the answer choices for multiple-choice items. Without this, a stem
    // whose numbers live only in the options ("Which of these numbers is
    // composite?") renders with nothing to work from. Choices are reference
    // options — the student still writes their answer in the free-text box the
    // grader reads, so no interaction change, just the missing information.
    const choicesHtml = Array.isArray(it.choices)
      ? `<ul class="sp-choices" style="margin:var(--sp-2,8px) 0 var(--sp-3,12px); padding-left:1.4rem; line-height:1.7;">${it.choices
          .map((c) => `<li>${esc(String(c))}</li>`)
          .join("")}</ul>`
      : "";
    const wrap = document.createElement("div");
    wrap.className = "sp-problem";
    wrap.innerHTML = `
      <p class="sp-stem"><span class="sp-num" aria-hidden="true">${i + 1}</span><span class="sp-stem-text" data-annotate="word-problem"><span class="sr-only">Problem ${i + 1} of ${total}. </span>${esc(it.stem)}</span></p>
      ${choicesHtml}
      <textarea class="sp-work text-input" rows="3" placeholder="Show your steps here…" aria-label="Problem ${i + 1}: show your steps"></textarea>
      <div class="sp-row">
        <label class="sp-answer-label">My answer: <input class="sp-answer" type="text" aria-label="Problem ${i + 1}: my answer" /></label>
        <button type="button" class="btn btn-secondary sp-check">Check answer</button>
      </div>
      <div class="sp-reveal" hidden aria-live="polite"></div>`;

    const workEl = wrap.querySelector(".sp-work");
    const ansEl = wrap.querySelector(".sp-answer");
    const reveal = wrap.querySelector(".sp-reveal");
    workEl.value = state.getResponse(2, `sp-work-${i}`) || "";
    ansEl.value = state.getResponse(2, `sp-ans-${i}`) || "";
    workEl.addEventListener("input", () => state.saveResponse(2, `sp-work-${i}`, workEl.value));
    ansEl.addEventListener("input", () => state.saveResponse(2, `sp-ans-${i}`, ansEl.value));
    // Attempt-gated, two-stage checking: an empty check asks for a real try;
    // a first miss coaches (no answer named) so "check again" stays meaningful;
    // only a second miss reveals the answer. No zero-effort giveaways.
    let spMisses = 0;
    const checkBtn = wrap.querySelector(".sp-check");
    const runCheck = () => {
      reveal.hidden = false;
      const why = it.explanation
        ? `<br><span style="color:var(--muted,#5f6f80);">${esc(it.explanation)}</span>`
        : "";
      if (!ansEl.value.trim() && !workEl.value.trim()) {
        reveal.style.background = "rgba(230,168,0,0.10)";
        reveal.style.borderColor = "var(--amber-ink,#8a5a00)";
        reveal.innerHTML = `<strong>✏️</strong> ${stackHtml(t("spTryFirst", "en"), t("spTryFirst", "es"))}`;
        (ansEl.value.trim() ? workEl : ansEl).focus();
        return;
      }
      const r = gradeSkillAnswer(ansEl.value, answer);
      if (r.graded && r.correct) {
        reveal.style.background = "rgba(46,158,91,0.10)";
        reveal.style.borderColor = "#2e9e5b";
        // Credit first, coach second: when the authored answer names the
        // variable or carries a unit the student left off, show it as a next
        // step, never as a correction.
        const fuller = r.hint
          ? `<br><span style="color:var(--muted,#5f6f80);">Nice — mathematicians often write it as <strong>${esc(r.hint)}</strong>. Either way, your answer is correct.</span>`
          : "";
        reveal.innerHTML = `<strong>✅ Correct!</strong> ${esc(answer)}${fuller}${why}`;
      } else if (r.graded && spMisses === 0) {
        spMisses = 1;
        reveal.style.background = "rgba(217,83,79,0.08)";
        reveal.style.borderColor = "#d9534f";
        reveal.innerHTML = `<strong>🔍</strong> ${stackHtml(t("spFirstMiss", "en"), t("spFirstMiss", "es"))}`;
      } else if (r.graded) {
        reveal.style.background = "rgba(217,83,79,0.08)";
        reveal.style.borderColor = "#d9534f";
        reveal.innerHTML = `<strong>❌ Not quite.</strong> The answer is <strong>${esc(answer)}</strong>.${why}`;
      } else {
        reveal.style.background = "rgba(42,157,143,0.08)";
        reveal.style.borderColor = "var(--teal,#2a9d8f)";
        reveal.innerHTML = `<strong>✅ Answer:</strong> ${esc(answer)}${why} <br><span style="color:var(--muted,#5f6f80);">Compare each of your steps with this answer. Where do they match? Where do they differ?</span>`;
      }
    };
    checkBtn.addEventListener("click", runCheck);
    // Delayed mode drives every problem from ONE set-level button below, so the
    // per-problem buttons are removed rather than hidden: a disabled-looking
    // control that does nothing reads as a bug to a twelve-year-old.
    if (delayed) checkBtn.remove();
    checkers.push({
      run: runCheck,
      hasAnswer: () => Boolean(ansEl.value.trim() || workEl.value.trim()),
    });
    card.append(wrap);
    // "Try another like this": generator-backed infinite reps, shown only when
    // this problem can be safely regenerated (correctness-verified variants).
    attachRegenPractice(wrap, it);
  });

  if (delayed) {
    const submitRow = document.createElement("div");
    submitRow.className = "sp-submit-row";
    submitRow.style.cssText =
      "margin-top:var(--sp-4); display:flex; gap:var(--sp-3); align-items:center; flex-wrap:wrap;";
    const submit = document.createElement("button");
    submit.type = "button";
    submit.className = "btn btn-primary";
    submit.textContent = `Check all ${total} answers`;
    const note = document.createElement("span");
    note.setAttribute("role", "status");
    note.style.cssText = "font-size:0.9rem; color:var(--muted);";
    submit.addEventListener("click", () => {
      const blank = checkers.filter((c) => !c.hasAnswer()).length;
      if (blank) {
        // Nudge rather than block: a student who genuinely cannot do one of them
        // still needs to reach the feedback, and refusing to mark the set would
        // strand them on the problem they most need the answer to.
        note.textContent = `${blank} still blank — check them anyway?`;
        if (!submitRow.dataset.warned) {
          submitRow.dataset.warned = "1";
          return;
        }
      }
      checkers.forEach((c) => c.run());
      submit.disabled = true;
      submit.textContent = "Answers checked";
      note.textContent = "Scroll up — every problem is marked.";
    });
    submitRow.append(submit, note);
    card.append(submitRow);
  }

  host.append(card);
  // Let students mark up each problem stem (highlight / underline / bold).
  enableWordProblemAnnotation(card);
}

// Caption for a practice lab: the tool's canonical name and what it is for,
// bilingual when the catalog carries Spanish. Returns "" for an uncatalogued
// kind so the lab still renders rather than showing a title-cased slug.
function practiceLabHeaderHtml(lab) {
  const meta = toolMeta(lab);
  if (!meta.catalogued) return "";
  const name = meta.nameEs ? stackHtml(meta.name, meta.nameEs) : esc(meta.name);
  const purpose = meta.purposeEs ? stackHtml(meta.purpose, meta.purposeEs) : esc(meta.purpose);
  return (
    `<div class="practice-lab-head" style="margin-bottom:var(--sp-3);">` +
    `<div style="display:flex; align-items:center; gap:8px; font-weight:800; color:var(--navy,#264653);"><span aria-hidden="true">🧰</span><span>${name}</span></div>` +
    (meta.purpose
      ? `<p style="margin:var(--sp-2) 0 0; font-size:0.9rem; color:var(--muted); line-height:1.5;">${purpose}</p>`
      : "") +
    (meta.instance
      ? `<p style="margin:var(--sp-1) 0 0; font-size:0.85rem; font-weight:600; color:var(--navy,#264653);">${esc(meta.instance)}</p>`
      : "") +
    `</div>`
  );
}

function renderPracticePhase(el, state, ctx, config) {
  phaseHeader(
    el,
    "✏️",
    "section-icon-navy",
    "Practice",
    "Problems adapt to how you're doing — keep going!",
  );

  instructionCallout(
    el,
    "🎯",
    "<strong>Adaptive practice:</strong> Pick <strong>Level 1</strong> for step-by-step hints, <strong>Level 2</strong> for a stretch challenge, or <strong>Adaptive</strong> to let the activity adjust. Wrong answers teach — read the feedback and try again.",
  );

  // Optional interactive "practice lab(s)" (factor-tree-lab, power-builder,
  // equation-balance-lab, step-solver, …) — a put-your-own-numbers-in tool
  // mounted at the top of Practice so students can rehearse the skill before the
  // adaptive items. `practice.diagram` accepts any interactive/static visual
  // kind, or an ARRAY of them to stack several complementary labs.
  const labCards = [];
  if (config.practice?.diagram) {
    const labs = Array.isArray(config.practice.diagram)
      ? config.practice.diagram
      : [config.practice.diagram];
    for (const lab of labs) {
      if (!lab) continue;
      const labCard = document.createElement("div");
      labCard.className = "card";
      // Name the tool before it appears. An unlabelled manipulative at the top
      // of Practice reads as decoration; the catalog already carries a student-
      // facing name and purpose for every registered kind, so say what it is
      // and what it is for. Falls back to the bare tool when a kind somehow has
      // no catalog entry (tools/interactive-tools.test.mjs gates against that).
      labCard.innerHTML = practiceLabHeaderHtml(lab) + buildVisual(lab);
      labCards.push(labCard);
      mountInteractiveVisuals(labCard, { state, phaseId: 2 });
    }
  }

  // The lab sits BESIDE the work it is for. Stacked above it, a student on
  // problem 3 had already scrolled the tool off screen.
  let workHost = el;
  if (labCards.length) {
    const pair = openWorkPair(el);
    labCards.forEach((c) => pair.tool.append(c));
    workHost = pair.main;
  }

  renderWorkedExamplePanel(workHost, config);
  renderCommonMistakeCallout(workHost, config);

  // Lead with real skill practice — solve problems, show steps — before the
  // interactive games/sorts below.
  renderSkillPractice(workHost, config, state);

  // Opt-in discussion moment: after doing the skill, students compare and
  // question each other's strategies. Non-graded, dismissible, never blocks.
  mountDiscussionMoment(el, { phase: "practice", phaseId: 2, config, state, variant: "practice" });

  // Non-stigmatizing Level 1 / Level 2 / Adaptive selector. Changing the level
  // immediately re-serves a problem at the chosen tier — without an onChange the
  // pick only took effect on the next item, so the selector looked broken.
  const selectorSlot = document.createElement("div");
  el.append(selectorSlot);
  mountLevelSelector(selectorSlot, state, () => {
    if (seq.servedCount < seq.total) next();
  });

  // Sticky practice score bar
  const scoreBar = document.createElement("div");
  scoreBar.className = "practice-score-bar";
  scoreBar.innerHTML = `
    <span class="practice-score-coins" aria-live="polite">🪙 <span class="coin-count">0</span></span>
    <span class="practice-score-streak" aria-live="polite"></span>
    <span class="practice-score-accuracy" aria-live="polite"></span>`;
  el.append(scoreBar);

  const tierBadge = document.createElement("div");
  tierBadge.className = "badge badge-amber mb-4";
  el.append(tierBadge);

  // One-line leveled voice beside the badge, refreshed per problem tier.
  const tierVoice = document.createElement("p");
  tierVoice.className = "practice-tier-voice";
  tierVoice.style.cssText =
    "margin:-6px 0 var(--sp-4); font-size:0.9rem; font-weight:600; color:var(--muted);";
  el.append(tierVoice);

  const area = document.createElement("div");
  el.append(area);

  // Inline Reveal Math slides for the Practice section. Appended after the
  // (dynamically replaced) problem area so they remain visible as a stable
  // reference while problems cycle through `area`.
  renderRevealSlides(el, config, "practice");

  const seq = createAdaptiveSequence(config, state);
  let totalCorrect = 0,
    totalAttempts = 0,
    shown = 0,
    coins = 0;

  function updateScoreBar() {
    const coinEl = scoreBar.querySelector(".coin-count");
    const accEl = scoreBar.querySelector(".practice-score-accuracy");
    const streakEl = scoreBar.querySelector(".practice-score-streak");
    if (coinEl) coinEl.textContent = String(coins);
    if (accEl && totalAttempts > 0) {
      accEl.textContent = `${Math.round((totalCorrect / totalAttempts) * 100)}% correct`;
    }
    const s = state.get();
    if (streakEl && s.streak >= 2) {
      streakEl.textContent = `🔥 ${s.streak} streak`;
    } else if (streakEl) {
      streakEl.textContent = "";
    }
  }

  function finishPractice() {
    area.innerHTML = "";
    // Finishing the whole practice set is the phase's big moment.
    if (totalCorrect > 0) ctx.engagement.showBurstConfetti();
    completePhase(el, ctx, state, 2, "Practice", totalCorrect, totalAttempts);
  }

  // Run the ungraded optional items through the shared component loop, then
  // finish. Correctness is intentionally ignored — these never affect scoring.
  function runOptionalPractice(host, items, done) {
    let i = 0;
    function step() {
      if (i >= items.length) {
        done();
        return;
      }
      host.innerHTML = "";
      const label = document.createElement("div");
      label.style.cssText =
        "font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:var(--sp-3);";
      const stepWord = config.practice?.optionalActivity?.stepLabel || "Extra Practice";
      label.textContent = `${stepWord} ${i + 1} of ${items.length}`;
      host.append(label);
      const slot = document.createElement("div");
      host.append(slot);
      renderComponent(slot, items[i], () => {
        i++;
        setTimeout(step, 800);
      });
    }
    step();
  }

  function next() {
    const prob = seq.nextProblem(levelOverride(state));
    if (!prob) {
      area.innerHTML = "";
      // Optional, ungraded Extra Practice opt-in. Does not touch scoring,
      // stars, or adaptive logic. Lessons without practice.optional finish
      // exactly as before.
      const optional = config.practice?.optional;
      if (optional?.length) {
        tierBadge.textContent = "";
        tierBadge.className = "";
        renderOptionalPracticeOptIn(area, {
          activity: config.practice?.optionalActivity,
          onSkip: finishPractice,
          onTry: () => runOptionalPractice(area, optional, finishPractice),
        });
        return;
      }
      finishPractice();
      return;
    }
    shown++;
    const tl = TIER_LABELS[prob.tier] || TIER_LABELS.core;
    tierBadge.className = `badge ${tl.badge} mb-4`;
    tierBadge.textContent = tl.name;
    tierVoice.textContent = TIER_VOICE[prob.tier] || TIER_VOICE.core;

    area.innerHTML = "";

    // Level 1 items get an always-visible scaffold hint. Uses an authored
    // scaffold/hint when present, otherwise derives a short, type-aware,
    // non-answer-giving nudge so every support item is scaffolded.
    if (prob.tier === "level1") {
      const scaffoldText = deriveScaffold(prob);
      if (scaffoldText) {
        const hint = document.createElement("details");
        hint.className = "scaffold-panel";
        hint.open = true;
        hint.innerHTML = `<summary>💡 Hint — read this first</summary><p style="margin:var(--sp-2) 0 0;">${esc(scaffoldText)}</p>`;
        area.append(hint);
      }
    }

    renderComponent(
      area,
      prob,
      (isCorrect) => {
        totalAttempts++;
        if (isCorrect) {
          totalCorrect++;
          coins++;
          state.awardCoin(1);
          const result = ctx.engagement.recordCorrect(null);
          if (result.streakMessage) {
            const toast = document.createElement("div");
            toast.className = "feedback feedback-success visible practice-toast";
            toast.style.animation = "feedbackIn 0.3s var(--ease-spring)";
            toast.innerHTML = `<span class="feedback-icon">✓</span><span>${result.message} ${result.streakMessage}</span>`;
            area.append(toast);
          }
          // Streak milestones earn real confetti (was authored but never
          // wired). Fires only at 3/5/8 so celebration stays an event, not
          // wallpaper; the engagement layer mounts its own overlay.
          if ([3, 5, 8].includes(result.streak)) ctx.engagement.showConfetti();
          updateScoreBar();
          setTimeout(() => next(), 1500);
        } else {
          ctx.engagement.recordIncorrect(null);
          updateScoreBar();
          // Run the scaffolded remediation sequence (hint -> worked example ->
          // guided steps -> easier retry) before advancing. The flow also biases
          // the adaptive tier toward Level 1 on repeated misses via state hooks.
          const remSlot = document.createElement("div");
          remSlot.className = "mt-4";
          area.append(remSlot);
          renderRemediation(remSlot, {
            question: prob,
            state,
            level: prob.tier,
            onComplete() {
              setTimeout(() => next(), 600);
            },
          });
        }
      },
      { number: shown, total: seq.total, tier: prob.tier, state },
    );
  }
  next();

  // Go Deeper: the optional advanced path (solve a stretch problem → convince
  // a skeptic → author your own harder version). Invitation-only — collapsed,
  // never counted toward phase completion, safe for every tier.
  const goDeeper = createGoDeeper({ config, lessonId: config.lessonId, variant: "lesson" });
  if (goDeeper) el.append(goDeeper);
}

// ── Connect answer-checking helpers ──
//
// Connect used to be write-only: the scenario posed a question ("your friend
// says 35%, another says 60% — who is right?"), the sentence frame drew dead
// `___` spans a student could not type into, and Submit always replied "Great
// response!" no matter what was written. A student could finish the phase
// having never answered the question the scenario asked, and never find out
// whether the friend was right. These helpers make the frame answerable and
// the answer checkable.

// One blank accepts a single string or an array of equivalent strings, matched
// by the site-wide matcher — so "$16", "16", "16.00", "16 dollars" and
// "c = 16" all count for the same blank, and blanks that hold words
// ("60% off", "decimal") still compare as text.
// `null`/omitted means "no authored answer" — the blank is still typed into and
// still saved, it just is not marked right or wrong.
function blankIsCorrect(value, accepted) {
  if (accepted == null) return null;
  if (!String(value ?? "").trim()) return false;
  return isRight(value, accepted);
}

/**
 * "Check Your Thinking" — auto-graded questions that walk the student through
 * the scenario BEFORE they write about it, each with immediate feedback and an
 * authored explanation. Optional: returns null when a lesson authors no
 * `connect.check`, so every existing lesson keeps its current behavior.
 *
 * Returns { el, correctCount(), total } so the caller can fold the result into
 * phase scoring.
 */
function renderConnectCheck(cfg, state) {
  const items = Array.isArray(cfg.check) ? cfg.check.filter((q) => q && q.stem) : [];
  if (items.length === 0) return null;

  const card = document.createElement("div");
  card.className = "card card-amber connect-check-card";
  card.innerHTML = `
    <div class="connect-check-header">
      <span class="badge badge-amber">🤔 Check Your Thinking</span>
      <p class="connect-check-intro">Answer these before you write. You get feedback right away.</p>
    </div>`;

  const results = new Array(items.length).fill(false);

  items.forEach((q, qi) => {
    const key = `connect_check_${qi}`;
    const box = document.createElement("div");
    box.className = "connect-check-item";

    const stem = document.createElement("p");
    stem.className = "connect-check-stem";
    stem.innerHTML = `<span class="connect-check-num">${qi + 1}</span> ${renderMathText(q.stem)}`;
    box.append(stem);

    const choices = Array.isArray(q.choices) ? q.choices : [];
    const answerIdx = Number(q.answer ?? q.correct ?? 0);

    const opts = document.createElement("div");
    opts.className = "connect-check-choices";

    const fb = document.createElement("div");
    fb.className = "connect-check-feedback";

    // Restore a previously chosen answer so Save/Resume brings the student back
    // to the graded state rather than a blank question.
    const saved = state.getResponse(3, key);
    const savedIdx = saved === null || saved === undefined || saved === "" ? null : Number(saved);

    const settle = (picked) => {
      const isRight = picked === answerIdx;
      results[qi] = isRight;
      opts.querySelectorAll("button").forEach((b, bi) => {
        b.disabled = true;
        b.classList.toggle("is-correct", bi === answerIdx);
        b.classList.toggle("is-wrong", bi === picked && !isRight);
      });
      fb.classList.add("visible", isRight ? "is-correct" : "is-wrong");
      fb.innerHTML = `<span class="connect-check-icon">${isRight ? "✓" : "💡"}</span><span>${
        isRight ? "Yes — " : "Not quite. "
      }${esc(q.explanation || "")}</span>`;
    };

    choices.forEach((choice, ci) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "connect-check-choice";
      btn.innerHTML = renderMathText(String(choice));
      btn.addEventListener("click", () => {
        state.saveResponse(3, key, String(ci));
        settle(ci);
        if (ci !== answerIdx) reportMisconception(q, ci, state);
      });
      opts.append(btn);
    });

    box.append(opts, fb);
    card.append(box);

    if (savedIdx !== null && Number.isFinite(savedIdx) && choices[savedIdx] !== undefined) {
      settle(savedIdx);
    }
  });

  return { el: card, correctCount: () => results.filter(Boolean).length, total: items.length };
}

/**
 * Turns the authored sentence frame into typed blanks. Every `___` in
 * `connect.prompt` becomes a real input; `connect.answers[i]` (string or array
 * of equivalents) is the accepted answer for blank i. Lessons that author no
 * `answers` still get typable, saved blanks — an "opportunity to answer" —
 * they just are not marked.
 *
 * Returns null when the prompt has no blanks, so the caller falls back to the
 * original static frame.
 */
function renderConnectFrame(cfg, state) {
  const raw = String(cfg.prompt || "");
  const segments = raw.split("___");
  const blankCount = segments.length - 1;
  if (blankCount < 1) return null;

  const answers = Array.isArray(cfg.answers) ? cfg.answers : [];

  const frame = document.createElement("div");
  frame.className = "sentence-frame sentence-frame-live";

  const inputs = [];
  segments.forEach((text, i) => {
    if (text) frame.append(document.createTextNode(text.replace(/\s+/g, " ")));
    if (i >= blankCount) return;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "frame-blank";
    input.autocomplete = "off";
    input.setAttribute("aria-label", `Blank ${i + 1} of ${blankCount}`);
    input.value = state.getResponse(3, `connect_blank_${i}`) || "";
    input.addEventListener("input", () => {
      state.saveResponse(3, `connect_blank_${i}`, input.value);
      input.classList.remove("is-correct", "is-wrong");
    });
    frame.append(input);
    inputs.push(input);
  });

  // Fill the frame in with what the student typed, so the saved response reads
  // as a complete sentence rather than a bag of fragments.
  const composed = () =>
    segments
      .map((text, i) => text + (i < blankCount ? ` ${inputs[i].value.trim() || "___"} ` : ""))
      .join("")
      .replace(/\s+/g, " ")
      .trim();

  const grade = () => {
    let graded = 0;
    let right = 0;
    inputs.forEach((input, i) => {
      const verdict = blankIsCorrect(input.value, answers[i]);
      if (verdict === null) return;
      graded += 1;
      if (verdict) right += 1;
      input.classList.toggle("is-correct", verdict);
      input.classList.toggle("is-wrong", !verdict);
    });
    return { graded, right, allFilled: inputs.every((i) => i.value.trim().length > 0) };
  };

  return { el: frame, inputs, composed, grade, blankCount };
}

// ── Phase 5: Connect ──
function renderConnectPhase(el, state, ctx, config) {
  const cfg = config.connect;
  phaseHeader(
    el,
    "🌎",
    "section-icon-teal",
    "Real-World Connection",
    "Where does this math live in the wild?",
  );

  const card = document.createElement("div");
  card.className = "card connect-scenario-card";
  card.innerHTML = `
    <div class="connect-scenario-header">
      <span class="connect-scenario-icon" aria-hidden="true">${config.themeEmoji || "🌎"}</span>
      <div>
        <div class="badge badge-amber mb-2">Math in the Wild</div>
        <div class="connect-scenario-theme">${esc(config.theme?.replace(/-/g, " ") || "Real World")}</div>
      </div>
    </div>
    <p class="connect-scenario-text" data-annotate="word-problem">${renderMathText(cfg.scenario)}</p>`;
  if (cfg.diagram) card.innerHTML += buildVisual(cfg.diagram);
  else if (cfg.histogram) card.innerHTML += histogramSVG(cfg.histogram);
  // Optional scenario simulator: a slider that recomputes a proportional /
  // percent / linear relationship live, so students experiment before writing.
  if (cfg.simulator && cfg.simulator.type) {
    card.innerHTML += interactiveVisualHost(
      { kind: "scenario-sim", ...cfg.simulator },
      {
        ariaLabel: cfg.simulator.title || "Scenario simulator",
        fallback: "Turn on JavaScript to explore this relationship with a slider.",
      },
    );
  }
  el.append(card);
  mountInteractiveVisuals(card, { state, phaseId: 3 });

  // "Check Your Thinking": auto-graded questions about the scenario itself,
  // placed BEFORE the written response so the student settles the math first.
  const check = renderConnectCheck(cfg, state);
  if (check) el.append(check.el);

  // Turn & Talk primes the written response below. Non-graded.
  renderTurnAndTalk(el, resolveTurnTalk("connect", config), state, 4, undefined, config);

  // The Writing Revolution (TWR) writing step — directly matches the Connect scenario right above it!
  renderTwrWriting(el, config, {
    getResponse: (key) => state.getResponse(3, key),
    saveResponse: (key, val) => state.saveResponse(3, key, val),
  });

  // Inline Reveal Math slides for the Connect section.
  renderRevealSlides(el, config, "connect");

  // Editable response box (core-owned), mirroring Launch/Reflect persistence.
  const minLength = 25;
  const promptText =
    cfg.promptQuestion ||
    `Explain your mathematical solution for ${config.title || "this scenario"}:`;

  const respCard = document.createElement("div");
  respCard.className = "card card-teal";

  const fieldId = "connect-response";

  const label = document.createElement("label");
  label.setAttribute("for", fieldId);
  label.className = "connect-prompt-label";
  label.style.cssText =
    "font-weight:800; font-size:1.1rem; color:var(--teal-ink); margin-bottom:10px; display:block;";
  label.textContent = promptText;
  respCard.append(label);

  // Typable sentence frame. Falls back to the original read-only frame only if
  // the authored prompt has no blanks at all.
  const frameUi = cfg.prompt ? renderConnectFrame(cfg, state) : null;
  if (frameUi) {
    respCard.append(frameUi.el);
  } else if (cfg.prompt) {
    const frame = document.createElement("div");
    frame.className = "sentence-frame";
    frame.innerHTML = String(cfg.prompt).replace(/___/g, '<span class="blank">&nbsp;</span>');
    respCard.append(frame);
  }

  const textarea = document.createElement("textarea");
  textarea.id = fieldId;
  textarea.className = "text-input";
  textarea.rows = 4;
  textarea.placeholder = "Type your response here...";
  textarea.setAttribute("aria-label", promptText);
  textarea.value = state.getResponse(3, "connect") || "";
  respCard.append(textarea);
  // "Explain Out Loud": speak the response and have it transcribed here, with
  // the target math vocabulary highlighting as it is said. No-op (typing still
  // works) where the browser has no speech recognition.
  attachVoiceInput(textarea, { keywords: cfg.keywords || [] });

  const charCount = document.createElement("div");
  charCount.className = "connect-charcount";
  const updateCount = () => {
    const len = textarea.value.trim().length;
    charCount.textContent = `${len} / ${minLength} characters minimum`;
    charCount.style.color = len >= minLength ? "var(--success)" : "var(--muted)";
  };
  updateCount();
  respCard.append(charCount);

  // Persist on every keystroke and restore on reload.
  textarea.addEventListener("input", () => {
    state.saveResponse(3, "connect", textarea.value);
    updateCount();
  });

  const feedbackSlot = document.createElement("div");
  feedbackSlot.className = "mt-4";
  respCard.append(feedbackSlot);

  const submitBtn = document.createElement("button");
  submitBtn.className = "btn btn-primary mt-4";
  submitBtn.textContent = "Submit Response";

  let submitted = false;

  const showFeedback = (type, message) => {
    feedbackSlot.innerHTML = "";
    const fb = document.createElement("div");
    fb.className = `feedback feedback-${type} visible`;
    fb.setAttribute("role", "alert");
    fb.innerHTML = `<span class="feedback-icon">${
      type === "success" ? "✓" : "💡"
    }</span><span>${esc(message)}</span>`;
    feedbackSlot.append(fb);
  };

  submitBtn.addEventListener("click", () => {
    if (submitted) return;
    const text = textarea.value.trim();

    // The sentence frame is part of the answer, so it is checked first: a
    // student who leaves the blanks empty has not answered the question the
    // scenario asked, however long their paragraph is.
    let frameScore = null;
    if (frameUi) {
      frameScore = frameUi.grade();
      if (!frameScore.allFilled) {
        showFeedback("hint", `Fill in all ${frameUi.blankCount} blanks in the sentence first.`);
        return;
      }
      if (frameScore.graded > 0 && frameScore.right < frameScore.graded) {
        // Wrong blanks are marked in place, and the student gets another try
        // rather than a silent pass. Only after a retry does Submit go through,
        // so nobody is trapped on a blank they cannot get.
        showFeedback(
          "hint",
          `Check the highlighted blanks — ${frameScore.right} of ${frameScore.graded} match. Look back at the scenario, then submit again.`,
        );
        frameUi.el.dataset.retried = "1";
        if (frameUi.el.dataset.warned !== "1") {
          frameUi.el.dataset.warned = "1";
          return;
        }
      }
    }

    if (text.length < minLength) {
      showFeedback("hint", `Write at least ${minLength} characters. You have ${text.length}.`);
      return;
    }

    let valid = true;
    if (cfg.keywords && cfg.keywords.length > 0) {
      const lower = text.toLowerCase();
      const found = cfg.keywords.filter((kw) => lower.includes(String(kw).toLowerCase()));
      if (found.length === 0) {
        showFeedback(
          "hint",
          `Try using math vocabulary in your response. Think about: ${cfg.keywords
            .filter((kw) => !/^[\d.$%/\s-]+$/.test(String(kw)))
            .slice(0, 3)
            .join(", ")}.`,
        );
        return;
      }
      const missing = cfg.keywords.length - found.length;
      valid = missing <= Math.ceil(cfg.keywords.length / 2);
    }

    submitted = true;
    // Persist the filled-in sentence alongside the paragraph, so the teacher
    // view and Save/Resume show the complete answer.
    const composedAnswer = frameUi ? `${frameUi.composed()}\n\n${textarea.value}` : textarea.value;
    state.saveResponse(3, "connect", composedAnswer);
    textarea.readOnly = true;
    if (frameUi) frameUi.inputs.forEach((i) => (i.readOnly = true));
    submitBtn.style.display = "none";

    const blanksRight =
      frameScore && frameScore.graded > 0 && frameScore.right === frameScore.graded;
    showFeedback(
      "success",
      blanksRight
        ? "Correct — and your explanation is recorded."
        : "Your thinking is recorded. Check the answer below.",
    );

    const earned = (valid ? 1 : 0) + (check ? check.correctCount() : 0) + (blanksRight ? 1 : 0);
    const total = 1 + (check ? check.total : 0) + (frameScore && frameScore.graded > 0 ? 1 : 0);
    const finish = () => completePhase(el, ctx, state, 3, "Connect", earned, total);

    // Answer reveal. Until now a student could finish Connect without ever
    // learning whether the friend in the scenario was right. `modelAnswer` is
    // the authored resolution; the diagram caption is the fallback, since it
    // already states the worked result for most lessons.
    //
    // completePhase() advances to the next phase as soon as it is called, which
    // tears this card off the screen — so the reveal MUST gate it behind an
    // explicit "continue". Calling completePhase() first would render the
    // answer into a DOM node the student never sees.
    const modelText = cfg.modelAnswer || cfg.diagram?.caption || cfg.visual?.caption;
    if (!modelText) {
      finish();
      return;
    }

    const reveal = document.createElement("div");
    reveal.className = "connect-reveal";
    reveal.innerHTML = `
      <div class="connect-reveal-title">✅ The answer</div>
      <p class="connect-reveal-body">${renderMathText(String(modelText))}</p>`;
    const continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "btn btn-primary mt-4";
    continueBtn.textContent = "Got it — continue →";
    continueBtn.addEventListener("click", finish, { once: true });
    reveal.append(continueBtn);
    respCard.append(reveal);
    reveal.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  respCard.append(submitBtn);
  el.append(respCard);

  // Peer explanation exchange (MLR 3). Placed AFTER the response card, because
  // the justification the student just wrote is what they trade — asking them to
  // exchange before they have written one would be asking them to read first,
  // which is exactly what the routine is designed to prevent. Renders its own
  // "start or join a table" affordance and degrades to nothing without D1.
  mountPeerExchange(el, {
    config,
    state,
    phaseId: 3,
    itemKey: "connect",
    prompt: cfg?.prompt || "Why does your answer work?",
  });
}

// ── Phase 6: Reflect ──
function renderReflectPhase(el, state, ctx, config) {
  const cfg = config.reflect;
  phaseHeader(el, "💡", "section-icon-coral", phaseName(4), t("reflectDesc"));

  // Teacher-only: the Socratic question ladders this student worked through.
  // Reflect is where a teacher conferring with a student ends up, so the record
  // of which question stopped them belongs here rather than behind another tab.
  if (isTeacherMode()) mountQuestionLadderReader(el, state);

  // 3-2-1
  const rCard = document.createElement("div");
  rCard.className = "card";
  rCard.innerHTML = `<div class="badge badge-teal mb-4">${stackHtml(t("reflection321", "en"), t("reflection321", "es"))}</div>`;
  [
    { n: 3, color: "teal", label: t("thingsLearned"), icon: "📝" },
    { n: 2, color: "amber", label: t("connectionsMade"), icon: "🔗" },
    { n: 1, color: "coral", label: t("questionStillHave"), icon: "❓" },
  ].forEach((r) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:grid; grid-template-columns:auto 1fr; gap:var(--sp-3); align-items:start; margin-bottom:var(--sp-3);";
    row.innerHTML = `<span class="badge badge-${r.color}">${r.icon} ${r.n}</span>`;
    const ta = document.createElement("textarea");
    ta.className = "text-input";
    ta.rows = r.n > 1 ? 2 : 1;
    ta.placeholder = `${r.n} ${r.label}...`;
    ta.value = state.getResponse(4, `reflect_${r.n}`) || "";
    ta.addEventListener("input", () => state.saveResponse(4, `reflect_${r.n}`, ta.value));
    row.append(ta);
    rCard.append(row);
  });
  el.append(rCard);

  // One thing I learned (exit ticket prep)
  const learnedCard = document.createElement("div");
  learnedCard.className = "card card-amber";
  learnedCard.innerHTML = `<h4 style="color:var(--amber-ink); margin-bottom:var(--sp-3);">✨ ${stackHtml(t("oneThingToday", "en"), t("oneThingToday", "es"))}</h4>`;
  const learnedTA = document.createElement("textarea");
  learnedTA.className = "text-input";
  learnedTA.rows = 2;
  learnedTA.placeholder = t("oneThingPlaceholder");
  learnedTA.value = state.getResponse(4, "one_thing_learned") || "";
  learnedTA.addEventListener("input", () =>
    state.saveResponse(4, "one_thing_learned", learnedTA.value),
  );
  learnedCard.append(learnedTA);
  el.append(learnedCard);

  // Confidence slider (1–5)
  const confCard = document.createElement("div");
  confCard.className = "card card-teal confidence-card";
  const savedConf = Number(state.getResponse(4, "confidence")) || 3;
  confCard.innerHTML = `
    <h4 style="color:var(--teal-ink); margin-bottom:var(--sp-3);">${t("howConfident")} ${esc(config.title)}?</h4>
    <div class="confidence-slider-wrap">
      <input type="range" class="confidence-slider" min="1" max="5" step="1" value="${savedConf}" aria-label="Confidence level 1 to 5" />
      <div class="confidence-labels">
        <span>😅 ${stackHtml(t("notYet", "en"), t("notYet", "es"))}</span><span>🤔 ${stackHtml(t("gettingThere", "en"), t("gettingThere", "es"))}</span><span>😊 ${stackHtml(t("gotIt", "en"), t("gotIt", "es"))}</span>
      </div>
      <output class="confidence-output" aria-live="polite">${savedConf}/5</output>
    </div>
    <div class="self-assess-quick" style="display:flex; gap:var(--sp-2); margin-top:var(--sp-3); justify-content:center;">
      ${[`😊 ${t("gotIt")}|5`, `🤔 ${t("almost")}|3`, `😅 ${t("needHelp")}|1`]
        .map((s) => {
          const [txt, lv] = s.split("|");
          return `<button type="button" class="btn btn-secondary self-assess" data-level="${lv}" style="flex:1; max-width:140px;">${txt}</button>`;
        })
        .join("")}
    </div>`;
  const slider = confCard.querySelector(".confidence-slider");
  const output = confCard.querySelector(".confidence-output");
  slider.addEventListener("input", () => {
    output.textContent = `${slider.value}/5`;
    state.saveResponse(4, "confidence", slider.value);
    state.saveResponse(4, "self-assess", slider.value);
  });
  confCard.querySelectorAll(".self-assess").forEach((btn) => {
    btn.addEventListener("click", () => {
      slider.value = btn.dataset.level;
      output.textContent = `${btn.dataset.level}/5`;
      state.saveResponse(4, "confidence", btn.dataset.level);
      state.saveResponse(4, "self-assess", btn.dataset.level);
      confCard.querySelectorAll(".self-assess").forEach((b) => {
        b.classList.toggle("is-selected", b === btn);
      });
    });
  });
  el.append(confCard);

  // Capstone discussion moment: right before the exit ticket, students convince
  // and question a partner about their answer. Opt-in, non-graded, dismissible.
  mountDiscussionMoment(el, { phase: "connect", phaseId: 4, config, state, variant: "capstone" });

  // el.append(buildPrintableSummary(state, config));

  // Inline Reveal Math slides for the closing/reflect section.
  renderRevealSlides(el, config, "closure");

  // Exit ticket — 3 quick questions: an auto-graded skill check, an
  // explain-your-thinking response, and a mistake-analysis response. Q2/Q3
  // reuse curated lesson content (the authored MC explanation and the
  // common-mistake text) as attempt-gated self-check model answers, so every
  // lesson gets a full ticket without inventing new math.
  phaseHeader(el, "🎯", "section-icon-navy", "Exit Ticket", t("exitTicketIntro"));

  const etCard = (labelKey) => {
    const card = document.createElement("div");
    card.className = "card exit-ticket-card";
    card.innerHTML = `<div class="badge badge-navy mb-4">${stackHtml(t(labelKey, "en"), t(labelKey, "es"))}</div>`;
    el.append(card);
    return card;
  };

  // Open-response ticket item: sentence-frame chips + saved textarea +
  // attempt-gated model-answer reveal (no zero-effort giveaways).
  const buildOpenET = ({
    labelKey,
    promptKey,
    promptOverride,
    frames,
    responseKey,
    model,
    errorExample,
  }) => {
    const card = etCard(labelKey);

    // "Spot the mistake" needs a mistake to spot: show the flawed worked example
    // (the step with the error highlighted) so the question isn't open-ended.
    if (errorExample?.steps?.length) {
      const work = document.createElement("div");
      work.className = "et-flawed-work";
      work.style.cssText =
        "border:1px solid var(--line,#cbd5e1); border-left:4px solid var(--amber-ink,#8a5a00); border-radius:10px; padding:10px 12px; margin:0 0 var(--sp-3,12px); background:var(--surface-2,#f8fafc);";
      const head = document.createElement("div");
      head.style.cssText = "font-weight:800; color:var(--navy,#12355b); margin-bottom:6px;";
      head.textContent = "Someone solved it like this — find their mistake:";
      work.append(head);
      const ol = document.createElement("ol");
      ol.style.cssText = "margin:0; padding-left:1.2rem;";
      errorExample.steps.forEach((s, i) => {
        const li = document.createElement("li");
        const flagged = errorExample.errorStep === i;
        li.style.cssText = flagged ? "font-weight:700;" : "";
        li.innerHTML = `${s.label ? `<strong>${esc(s.label)}:</strong> ` : ""}${esc(s.work)}${
          flagged ? ' <span aria-hidden="true">⚠️</span>' : ""
        }`;
        ol.append(li);
      });
      work.append(ol);
      card.append(work);
    }

    const prompt = document.createElement("p");
    prompt.className = "problem-stem";
    // Let students mark up the question text (highlight / underline / bold).
    prompt.setAttribute("data-annotate", "word-problem");
    prompt.innerHTML = promptOverride
      ? stackHtml(promptOverride.en, promptOverride.es)
      : stackHtml(t(promptKey, "en"), t(promptKey, "es"));
    card.append(prompt);

    const ta = document.createElement("textarea");
    ta.className = "text-input";
    ta.rows = 3;
    ta.placeholder = frames[0];
    ta.setAttribute("aria-label", t(promptKey));
    ta.value = state.getResponse(4, responseKey) || "";
    ta.addEventListener("input", () => state.saveResponse(4, responseKey, ta.value));

    const chips = document.createElement("div");
    chips.className = "nw-chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "Sentence starters — tap one to add it to your answer");
    frames.forEach((frame) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "nw-chip";
      chip.textContent = frame;
      chip.title = "Tap to add this sentence starter";
      chip.addEventListener("click", () => {
        const needsSpace = ta.value && !/\s$/.test(ta.value);
        ta.value = `${ta.value}${needsSpace ? " " : ""}${frame} `;
        ta.focus();
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      });
      chips.append(chip);
    });
    card.append(chips, ta);

    if (model) {
      const row = document.createElement("div");
      row.className = "problem-check-row";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-secondary";
      btn.textContent = t("etCompareModel");
      const out = document.createElement("div");
      out.className = "problem-check-result";
      out.setAttribute("aria-live", "polite");
      btn.addEventListener("click", () => {
        if (ta.value.trim().replace(/_/g, "").length < 12) {
          out.className = "problem-check-result visible is-incorrect";
          out.innerHTML = `<span class="feedback-icon">✏️</span><span>${stackHtml(t("etWriteFirst", "en"), t("etWriteFirst", "es"))}</span>`;
          ta.focus();
          return;
        }
        out.className = "problem-check-result visible is-correct";
        out.innerHTML = `<span class="feedback-icon">📖</span><span><strong>${t("etModelAnswer")}:</strong> ${esc(model)}</span>`;
        btn.style.display = "none";
      });
      row.append(btn);
      card.append(row, out);
    }
    return ta;
  };

  let q2TA = null;
  let q3TA = null;

  // Q1 — authored skill-check MC. XP is awarded on the answer exactly as
  // before, but the full-screen phase-complete takeover now waits for an
  // explicit "Finish lesson" tap so Questions 2–3 stay reachable.
  const q1Card = etCard("etQ1Label");
  const finishRow = document.createElement("div");
  finishRow.className = "problem-check-row";
  finishRow.style.cssText = "justify-content:center; margin-top:var(--sp-4);";
  const finishNote = document.createElement("div");
  finishNote.className = "problem-check-result";
  let finishWarned = false;

  renderMultipleChoice(q1Card, {
    ...cfg.exitTicket,
    onAnswer(isCorrect) {
      // Adaptive follow-up: a missed skill check offers a fresh, generator-
      // verified variant to retry before finishing. Self-contained tray (no XP,
      // no gating) — attachRegenPractice no-ops when the item can't be safely
      // regenerated. The graded Q1 result above stays exactly as answered.
      if (!isCorrect && !q1Card.dataset.regenOffered) {
        q1Card.dataset.regenOffered = "1";
        attachRegenPractice(
          q1Card,
          {
            ...cfg.exitTicket,
            answer:
              cfg.exitTicket?.answer ?? cfg.exitTicket?.choices?.[cfg.exitTicket?.correctIndex],
          },
          { label: "Not quite — try a similar one before you finish:" },
        );
      }
      const xp = ctx.engagement.awardXP(4, {
        correct: isCorrect ? 1 : 0,
        total: 1,
      });
      const finishBtn = document.createElement("button");
      finishBtn.type = "button";
      finishBtn.className = "btn btn-primary";
      finishBtn.textContent = "🏁 Finish lesson / Terminar la lección";
      finishBtn.addEventListener("click", async () => {
        // One gentle nudge toward the written questions; never a hard block.
        if (!finishWarned && (!q2TA?.value.trim() || !q3TA?.value.trim())) {
          finishWarned = true;
          finishNote.className = "problem-check-result visible is-incorrect";
          finishNote.innerHTML = `<span class="feedback-icon">📝</span><span>${stackHtml(t("etFinishReminder", "en"), t("etFinishReminder", "es"))}</span>`;
          return;
        }
        finishNote.className = "problem-check-result";
        finishNote.innerHTML = "";
        const stars = state.get().phases[4]?.stars ?? 0;
        await ctx.engagement.showPhaseComplete(el, "Reflect", xp, stars);
        showFinalSummary(el, state, config);
      });
      finishRow.append(finishBtn);
      finishBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    },
  });

  // Q2 — reasoning: justify the Q1 answer with a sentence frame.
  q2TA = buildOpenET({
    labelKey: "etQ2Label",
    promptKey: "etQ2Prompt",
    frames: [
      "I know ___ because ___.",
      "My answer makes sense because ___.",
      "Sé que ___ porque ___.",
    ],
    responseKey: "exit_explain",
    model: cfg.exitTicket?.explanation || "",
  });

  // Q3 — mistake analysis, self-checked against the lesson's common-mistake text.
  // "Spot the mistake": show the lesson's flawed worked example to critique. When
  // one exists, the prompt points at that work and the model answer is the fix;
  // otherwise fall back to the open self-generated question.
  const errorExample = deriveErrorExample(config);
  q3TA = buildOpenET({
    labelKey: "etQ3Label",
    promptKey: "etQ3Prompt",
    promptOverride: errorExample
      ? {
          en: "Find the mistake in the work above. Which step is wrong, and how would you fix it?",
          es: "Encuentra el error en el trabajo de arriba. ¿Qué paso está mal y cómo lo corregirías?",
        }
      : null,
    frames: [
      "The mistake is ___ because ___.",
      "To catch it, I would check ___.",
      "El error es ___ porque ___.",
    ],
    responseKey: "exit_mistake",
    model: errorExample?.fix || deriveCommonMistake(config),
    errorExample,
  });

  // The Finish button appears inside finishRow once Q1 is answered.
  el.append(finishNote, finishRow);
}

// End-of-lesson objective self-review ("Did I get it?"). Reuses the same
// objective resolvers as the launch header so the text matches exactly.
function renderObjectiveReview(state, config) {
  const card = document.createElement("section");
  card.className = "card card-teal objective-review";
  card.setAttribute("aria-labelledby", "obj-review-title");
  card.style.cssText = "text-align:left; margin-top:var(--sp-6);";

  // Same treatment as the Launch header and Objectives page: key vocabulary is
  // underlined + tap-to-open the glossary popup (wired on the card below).
  // On the completion certificate the goals are stated in the third person with
  // the student's own name — "Samuel can now …" — matching the Phase 8 review.
  const vocab = augmentVocabWithGlossary(config.vocabulary);
  const name = studentFirstName(state);
  const phrase = (text) => toThirdPersonObjective(text, name);
  const items = [
    {
      key: "review_content",
      label: t("contentObjective"),
      html: linkifyObjectiveTerms(phrase(resolveContentObjective(config)), vocab),
    },
    {
      key: "review_language",
      label: t("languageObjective"),
      html: linkifyObjectiveTerms(phrase(resolveLanguageObjective(config)), vocab),
    },
  ];

  const reviewTitle = name
    ? `✅ ${esc(name)} Can Now…`
    : `✅ ${stackHtml(t("didIGetIt", "en"), t("didIGetIt", "es"))}`;
  const reviewNote = name
    ? `Check off each goal ${esc(name)} can do. Be honest — it helps you know what to practice!`
    : "Check off each goal you can do. Be honest — it helps you know what to practice!";

  card.innerHTML = `
    <h4 id="obj-review-title" style="color:var(--teal-ink); margin-bottom:var(--sp-2);">${reviewTitle}</h4>
    <p style="color:var(--muted); margin:0 0 var(--sp-4); font-size:0.92rem;">${reviewNote}</p>
  `;

  items.forEach((item) => {
    const checked = state.getResponse(4, item.key) === "yes";
    const row = document.createElement("label");
    row.style.cssText =
      "display:flex; align-items:flex-start; gap:var(--sp-3); padding:var(--sp-3); background:white; border-radius:var(--radius-sm); margin-bottom:var(--sp-3); cursor:pointer; border:1px solid var(--line);";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = checked;
    cb.style.cssText =
      "width:1.4rem; height:1.4rem; margin-top:2px; flex:0 0 auto; cursor:pointer;";
    cb.setAttribute(
      "aria-label",
      name ? `${name} can do this — ${item.label}` : `I can do this — ${item.label}`,
    );

    const text = document.createElement("div");
    text.innerHTML = `
      <div style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.04em; color:var(--teal-ink); margin-bottom:2px;">${item.label}</div>
      <div style="font-weight:600;">${item.html}</div>
    `;

    cb.addEventListener("change", () => {
      state.saveResponse(4, item.key, cb.checked ? "yes" : "no");
      row.style.borderColor = cb.checked ? "var(--teal)" : "var(--line)";
      row.style.background = cb.checked ? "var(--teal-light)" : "white";
    });
    if (checked) {
      row.style.borderColor = "var(--teal)";
      row.style.background = "var(--teal-light)";
    }

    row.append(cb, text);
    card.append(row);
  });

  // Definition-only, like every other objective surface.
  wireObjectiveTermPopups(card, vocab);
  return card;
}

function showFinalSummary(el, state, config) {
  el.innerHTML = "";
  const s = state.get();
  const totalStars = s.phases.reduce((sum, p) => sum + p.stars, 0);
  const pct = totalStars / 18;
  const grade =
    pct >= 0.9
      ? `🏆 ${t("gradeOutstanding")}`
      : pct >= 0.7
        ? `⭐ ${t("gradeGreat")}`
        : pct >= 0.5
          ? `👍 ${t("gradeGood")}`
          : `💪 ${t("gradeKeep")}`;
  const streakText = s.bestStreak >= 3 ? `🔥 Best streak: ${s.bestStreak} in a row` : "";
  const accuracy = s.totalAttempts > 0 ? Math.round((s.totalCorrect / s.totalAttempts) * 100) : 100;
  checkBadges(state);
  const earnedBadges = (s.badges || [])
    .map((id) => getBadgeDefs().find((b) => b.id === id))
    .filter(Boolean);

  const paceBadge =
    s.totalAttempts > 0 && s.totalCorrect / s.totalAttempts >= 0.85
      ? "🎯 Sharpshooter"
      : s.totalAttempts >= 8
        ? "🧠 Deep Thinker"
        : "";

  const badgeRow = earnedBadges.length
    ? `<div class="certificate-badges">${earnedBadges.map((b) => `<span class="cert-badge-pill">${b.emoji} ${esc(badgeName(b.id))}</span>`).join("")}</div>`
    : "";

  const summary = document.createElement("div");
  summary.className = "completion-certificate";
  summary.style.animation = "phaseIn 0.5s var(--ease-out)";
  summary.innerHTML = `
    <div class="certificate-ribbon" aria-hidden="true">🏆</div>
    <div class="certificate-header">
      <div class="certificate-badge">${stackHtml(t("lessonComplete", "en"), t("lessonComplete", "es"))}</div>
      <h2 class="certificate-title">${esc(config.title)}</h2>
      <p class="certificate-subtitle">${grade}</p>
    </div>
    <div class="certificate-student">
      <span class="certificate-label">${stackHtml(t("awardedTo", "en"), t("awardedTo", "es"))}</span>
      <span class="certificate-name">${esc(s.studentName || t("mathematician"))}</span>
      ${s.studentPeriod ? `<span class="certificate-period">Period ${esc(s.studentPeriod)}</span>` : ""}
    </div>
    <div class="certificate-stats">
      <div class="cert-stat"><div class="cert-stat-value xp-counter">0</div><div class="cert-stat-label">${stackHtml(t("xpEarned", "en"), t("xpEarned", "es"))}</div></div>
      <div class="cert-stat"><div class="cert-stat-value cert-stars">${totalStars}<span class="cert-stat-denom">/18</span></div><div class="cert-stat-label">${stackHtml(t("stars", "en"), t("stars", "es"))}</div></div>
      <div class="cert-stat"><div class="cert-stat-value">${s.coins || 0}</div><div class="cert-stat-label">${stackHtml(t("coins", "en"), t("coins", "es"))}</div></div>
      <div class="cert-stat"><div class="cert-stat-value">${accuracy}%</div><div class="cert-stat-label">${stackHtml(t("accuracy", "en"), t("accuracy", "es"))}</div></div>
    </div>
    ${badgeRow}
    ${streakText ? `<div class="certificate-streak">${esc(streakText)}</div>` : ""}
    ${paceBadge ? `<div class="certificate-pace">${paceBadge}</div>` : ""}
    <div class="certificate-phases">
      ${s.phases.map((p) => `<div class="cert-phase-row"><span class="cert-phase-name">${esc(p.name)}</span><span class="cert-phase-stars" aria-label="${p.stars} of 3 stars">${"★".repeat(p.stars)}${"☆".repeat(3 - p.stars)}</span></div>`).join("")}
    </div>
    <div class="certificate-footer">
      <span class="certificate-standard badge badge-teal">${esc(config.standard)}</span>
      <span class="certificate-date">${new Date().toLocaleDateString()}</span>
      <span class="certificate-brand">Neft Teacher</span>
    </div>
    <button type="button" class="btn btn-secondary certificate-print-btn" onclick="window.print()">🖨️ ${stackHtml(t("printCertificate", "en"), t("printCertificate", "es"))}</button>`;
  el.append(summary);
  mountCertificateDownload(summary, config, state);
  renderCelebrationPicker(summary, config);

  if (window.fireConfetti) window.fireConfetti();

  // "Did I get it?" objective self-review. Re-shows the same Content + Language
  // objectives from the launch header, each with a checkbox the student ticks
  // to self-assess. Checks persist to state (localStorage). No new config —
  // reuses the existing objective fields and the launch-header fallbacks.
  el.append(renderObjectiveReview(state, config));

  // Auto-grade + save/export (additive; does not affect scoring above).
  // Grades the student, persists to the localStorage gradebook, and offers
  // CSV/JSON/Print exports for the teacher. Local-first only — no network.
  try {
    el.append(buildGradeCard(state, config));
  } catch (_) {
    /* grading/export must never break the completion screen */
  }

  // "Recommended next" — a targeted next step from the device-local signal
  // store: arcade practice at the right difficulty plus the family page.
  // Pure client-side; renders nothing when signals are unavailable.
  try {
    const rec = recommendedNext(config);
    if (rec) {
      const next = document.createElement("div");
      next.className = "completion-next card";
      next.style.cssText = "margin-top:var(--sp-6); padding:var(--sp-5);";
      next.innerHTML = `
        <h3 style="margin:0 0 var(--sp-2);">🧭 ${stackHtml("Recommended next", "Siguiente paso recomendado")}</h3>
        <div style="display:flex; gap:var(--sp-3); flex-wrap:wrap;">
          <a class="btn btn-primary" href="${rec.arcadeHref}">🕹️ ${esc(rec.arcadeLabel)}</a>
          <a class="btn btn-secondary" href="${rec.familyHref}">🏠 ${stackHtml("Family page", "Página familiar")}</a>
        </div>`;
      el.append(next);
    }
  } catch (_) {
    /* recommendations must never break the completion screen */
  }

  // Optional "Choose an Activity" menu — surfaced at completion on every
  // lesson. Auto-populated from existing lesson data (vocab terms +
  // optional practice); everything here is ungraded and does not affect
  // the summary above. Renders nothing if the lesson has no eligible
  // activities.
  const chooserSlot = document.createElement("div");
  chooserSlot.style.cssText = "margin-top:var(--sp-6);";
  renderActivityChooser(chooserSlot, { config, renderComponent });
  if (chooserSlot.childNodes.length) el.append(chooserSlot);

  const counterEl = summary.querySelector(".xp-counter");
  if (counterEl && s.xp > 0) {
    let current = 0;
    const step = Math.max(1, Math.ceil(s.xp / 30));
    const interval = setInterval(() => {
      current = Math.min(current + step, s.xp);
      counterEl.textContent = current;
      if (current >= s.xp) clearInterval(interval);
    }, 30);
  }
}

function renderObjectivesReviewPhase(el, state, _ctx, config) {
  const phaseIndex = state.get().currentPhase ?? 7;
  phaseHeader(
    el,
    "8",
    "section-icon-teal",
    "Phase 8: Objectives Review",
    "Revisit today's Content and Language Objectives to check your growth and celebrate what you learned!",
  );

  const card = document.createElement("div");
  card.className = "card card-objectives-review-phase";
  card.style.cssText =
    "margin: 16px 0 24px; border: 2px solid #0f6d78; border-radius: 16px; padding: 22px; background: #ffffff; box-shadow: 0 6px 20px rgba(15,109,120,0.12);";

  // Name the student in the goals themselves: "Samuel can now …" reads as
  // evidence of growth rather than as the same goal repeated. Falls back to the
  // original wording when the Name field on Launch was left empty.
  const name = studentFirstName(state);
  const heading = name ? `🎯 ${esc(name)} Can Now…` : "🎯 Learning Objectives Mastery Check";
  const intro = name
    ? `Look at what ${esc(name)} could not do at the start of today's lesson — and can do now. Read each goal and check off the ones ${esc(name)} can do.`
    : "Now that you've completed today's lesson, revisit the goals you set at the beginning and check off what you mastered!";

  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:12px;">
      <div>
        <span style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#0f6d78; background:#e6f4f6; padding:4px 10px; border-radius:6px;">Phase 8 · Objectives Review</span>
        <h3 style="margin:6px 0 0; font-size:22px; font-weight:800; color:#14223a;">${heading}</h3>
      </div>
      <div style="font-size:13px; font-weight:800; color:#0f6d78; background:#f0fdf4; border:1px solid #bbf7d0; padding:6px 14px; border-radius:10px;">
        Self-Check &amp; Growth
      </div>
    </div>
    <p style="margin:0 0 16px; font-size:15px; color:#56627a;">
      ${intro}
    </p>
  `;

  renderObjectives(card, config, state, { review: true });

  const checkWrap = document.createElement("div");
  checkWrap.style.cssText =
    "margin-top:20px; padding:16px; background:#f8fafc; border:1px solid #cbd5e1; border-radius:12px; display:flex; flex-direction:column; gap:10px;";

  const savedChecks = state.getResponse(phaseIndex, "objectives_mastery") || {};

  // Third person to match the goal cards above: "Samuel can now demonstrate…".
  const subject = name ? esc(name) : "I";
  const verb = name ? "can now" : "can";
  const usedVerb = name ? `${esc(name)} used` : "I used";

  checkWrap.innerHTML = `
    <div style="font-size:14px; font-weight:800; color:#0f172a;">${name ? `Track ${esc(name)}'s Goal Mastery:` : "Track Your Goal Mastery:"}</div>
    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:14px; color:#334155;">
      <input type="checkbox" id="chkObjContent" ${savedChecks.content ? "checked" : ""}>
      <span><strong>Content Goal:</strong> ${subject} ${verb} demonstrate and apply today's math concept!</span>
    </label>
    <label style="display:flex; align-items:center; gap:10px; cursor:pointer; font-size:14px; color:#334155;">
      <input type="checkbox" id="chkObjLang" ${savedChecks.lang ? "checked" : ""}>
      <span><strong>Language Goal:</strong> ${usedVerb} academic vocabulary and clear math reasoning!</span>
    </label>
  `;

  checkWrap.querySelectorAll("input[type='checkbox']").forEach((chk) => {
    chk.addEventListener("change", () => {
      savedChecks.content = checkWrap.querySelector("#chkObjContent").checked;
      savedChecks.lang = checkWrap.querySelector("#chkObjLang").checked;
      state.saveResponse(phaseIndex, "objectives_mastery", savedChecks);
      state.markCompleted(phaseIndex);
    });
  });

  card.append(checkWrap);

  const finishBtn = document.createElement("button");
  finishBtn.type = "button";
  finishBtn.className = "btn btn-teal";
  finishBtn.style.cssText =
    "margin-top:20px; padding:12px 24px; font-weight:800; font-size:15px; background:#0f6d78; color:#ffffff; border:none; border-radius:10px; cursor:pointer;";
  finishBtn.textContent = "Finish Lesson & Celebrate 🎉";
  finishBtn.addEventListener("click", () => {
    state.markCompleted(phaseIndex);
    showFinalSummary(el, state, config);
  });

  card.append(finishBtn);
  el.append(card);
}
