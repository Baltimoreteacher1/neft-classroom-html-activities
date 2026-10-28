import assert from "node:assert/strict";
import test from "node:test";
import {
  renderCoordinatePlaneSVG,
  renderDoubleNumberLineSVG,
  renderFractionBarOrGridSVG,
  renderHangerBalanceSVG,
  renderNumberLineSVG,
  renderTapeDiagramSVG,
} from "../scripts/lib/homework-svg-models.mjs";

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
