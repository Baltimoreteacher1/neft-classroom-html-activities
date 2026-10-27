import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CO_LEARNING_CSS, CO_LEARNING_JS } from "../scripts/lib/homework-co-learning.mjs";
import {
  renderCoordinatePlaneSVG,
  renderDoubleNumberLineSVG,
  renderFractionBarOrGridSVG,
  renderHangerBalanceSVG,
  renderNumberLineSVG,
  renderTapeDiagramSVG,
} from "../scripts/lib/homework-svg-models.mjs";
import { lessonPath } from "./lib/curriculum-source.mjs";

test("6 parameterized SVG generators return crisp inline SVGs with explicit width, height, viewBox, and white background", () => {
  const svgs = [
    renderTapeDiagramSVG(
      [
        { value: 4, label: "4" },
        { value: 4, label: "4" },
        { value: 4, label: "?" },
      ],
      { title: "Ratio Tape", total: "12" },
      2,
    ),
    renderNumberLineSVG(
      -5,
      5,
      1,
      [
        { value: -3, label: "-3" },
        { value: 2, label: "2" },
      ],
      [{ from: 0, to: -3, label: "-3" }],
    ),
    renderDoubleNumberLineSVG(
      "Batches",
      "Cups",
      [
        { top: 1, bottom: 3 },
        { top: 2, bottom: 6 },
        { top: 3, bottom: 9 },
      ],
      [2],
    ),
    renderCoordinatePlaneSVG(
      4,
      [
        { x: -3, y: 2, label: "A(-3, 2)" },
        { x: 4, y: 2, label: "B(4, 2)" },
      ],
      [{ from: [-3, 2], to: [4, 2], label: "7 units" }],
    ),
    renderFractionBarOrGridSVG(2, 5, 7, {
      topLabel: "70% shaded",
      bottomLabel: "7/10 = 70%",
    }),
    renderHangerBalanceSVG(["x", "x", "4"], ["12"], true),
  ];

  for (const svg of svgs) {
    assert.match(svg, /^<svg\b/);
    assert.match(svg, /\bwidth="\d+"/);
    assert.match(svg, /\bheight="\d+"/);
    assert.match(svg, /\bviewBox="0 0 \d+ \d+"/);
    assert.match(svg, /style="background:white\b/);
    assert.match(svg, /<\/svg>$/);
  }
});

test("Part 1 vs Part 2 cognitive differentiation and Dual-Persona Mode Switcher render in generated homework pages", () => {
  const part1Html = readFileSync(lessonPath("3-1", "homework.html"), "utf8");
  const part2Html = readFileSync(lessonPath("3-1-part2", "homework.html"), "utf8");

  // Part 1 badge & cognitive focus
  assert.match(
    part1Html,
    /Family Practice · Part 1 \(Optional\) — Core Concept &amp; Fluency \(~8–10 mins\)/,
  );
  assert.match(part1Html, /data-part-mode="part1"/);

  // Part 2 badge & cognitive focus
  assert.match(
    part2Html,
    /Family Practice · Part 2 \(Optional\) — Deepening, Error Analysis &amp; Real-World Connection \(~10 mins\)/,
  );
  assert.match(part2Html, /data-part-mode="part2"/);

  // Dual-Persona Mode Switcher
  for (const html of [part1Html, part2Html]) {
    assert.match(html, /id="hw_colearn_hud"/);
    assert.match(html, /data-persona-btn="student"/);
    assert.match(html, /data-persona-btn="copilot"/);
    assert.match(html, /id="hw_hud_completed"/);
    assert.match(html, /id="hw_hud_accuracy"/);
    assert.match(html, /id="hw_hud_streak"/);
    assert.match(html, /id="hw_vocab_drawer"/);
    assert.match(html, /id="hw_theme_toggle_btn"/);

    // Part 1 & Part 2 pedagogical sections
    assert.match(html, /id="hw_family_bridge_60s"/);
    assert.match(html, /id="hw_worked_partner_example"/);
    assert.match(html, /id="hw_part2_application"/);
    assert.match(html, /id="hw_spot_the_glitch"/);
    assert.match(html, /id="hw_spiral_remember"/);
    assert.match(html, /id="hw_kitchen_table_prompt"/);
    assert.match(html, /id="hw_print_socratic_footer"/);

    // 3-step progressive hints
    assert.match(html, /Hint 1: Nudge/);
    assert.match(html, /Hint 2: Visual Model Setup/);
    assert.match(html, /Hint 3: Step-by-Step/);
  }
});

test("Co-Learning CSS and JS include @media print rules, dark theme support, light default, and diagnostics validator", () => {
  assert.match(CO_LEARNING_CSS, /@media print/);
  assert.match(CO_LEARNING_CSS, /\.hw-print-socratic-footer/);
  assert.match(CO_LEARNING_CSS, /html\[data-theme="dark"\]/);
  assert.match(CO_LEARNING_CSS, /prefers-reduced-motion: reduce/);
  assert.match(CO_LEARNING_CSS, /\.hw-lightbox/);
  assert.match(CO_LEARNING_CSS, /\.is-zoomable/);
  assert.match(CO_LEARNING_JS, /window\.runHomeworkDiagnostics/);
  assert.match(CO_LEARNING_JS, /window\.setHomeworkPersona/);
  assert.match(CO_LEARNING_JS, /window\.toggleVocabQuickGlossary/);
  assert.match(CO_LEARNING_JS, /window\.toggleHomeworkTheme/);
  assert.match(CO_LEARNING_JS, /installHomeworkImageZoom/);
  assert.match(CO_LEARNING_JS, /ensureHomeworkLightbox/);
  assert.match(CO_LEARNING_JS, /data-theme['"],\s*['"]light['"]/);
  assert.doesNotMatch(CO_LEARNING_JS, /prefers-color-scheme:\s*dark/);
});
