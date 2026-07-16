import { renderAreaMorph } from "../components/area-morph.js";
import { renderBalanceScale } from "../components/balance-scale.js";
import { renderDistExplorer } from "../components/dist-explorer.js";
import { renderDistributiveBuilder } from "../components/distributive-builder.js";
import { renderFactorTree } from "../components/factor-tree.js";
import { renderFractionBars } from "../components/fraction-bars.js";
import { renderLongDivisionBuilder } from "../components/long-division-builder.js";
import { renderPercentBuilder } from "../components/percent-builder.js";
import { renderPowerBuilder } from "../components/power-builder.js";
import { renderRatioTableBuilder } from "../components/ratio-table-builder.js";
import { renderUnitRateBuilder } from "../components/unit-rate-builder.js";

export function mountSmallGroupMathTool(container, config) {
  const topic =
    `${config.title || ""} ${config.standard || ""} ${config.contentObjective || ""}`.toLowerCase();
  const host = document.createElement("div");
  host.className = "sg-tool";
  host.innerHTML =
    '<div class="sg-tool-head"><span aria-hidden="true">🧰</span><div><strong>Try the math tool</strong><span>Change the numbers. Notice what stays the same.</span></div></div>';
  const stage = document.createElement("div");
  stage.className = "sg-tool-stage";
  host.appendChild(stage);

  let mounted = true;
  if (/prime|factor|gcf|lcm/.test(topic)) renderFactorTree(stage, { start: 60 });
  else if (/exponent|power/.test(topic)) renderPowerBuilder(stage, { base: 3, exponent: 2 });
  else if (/fraction/.test(topic)) {
    renderFractionBars(stage, {
      instructions: "Build 3/4. Tap three of four equal parts.",
      target: { numerator: 3, denominator: 4 },
    });
  } else if (/unit rate/.test(topic)) renderUnitRateBuilder(stage, { total: 120, units: 3 });
  else if (/ratio|equivalent rate/.test(topic)) renderRatioTableBuilder(stage, { a: 2, b: 3 });
  else if (/percent/.test(topic)) renderPercentBuilder(stage, { percent: 25, whole: 80 });
  else if (/equation|inequality/.test(topic)) {
    renderBalanceScale(stage, {
      equation: "x + 4 = 10",
      variable: "x",
      answer: 6,
      hints: ["Undo adding 4 by subtracting 4 from both sides."],
      label: "Keep both sides balanced while you solve for x.",
    });
  } else if (/distributive|expression/.test(topic)) {
    renderDistributiveBuilder(stage, { a: 3, b: 4, c: 2 });
  } else if (/mean|median|mode|data|statistic/.test(topic)) {
    renderDistExplorer(stage, { max: 20, label: "Build a data set and watch its center change." });
  } else if (/triangle|trapezoid|parallelogram|area|polygon/.test(topic)) {
    const figure = /trapezoid/.test(topic)
      ? "trapezoid"
      : /parallelogram/.test(topic)
        ? "parallelogram"
        : /polygon/.test(topic)
          ? "polygon"
          : "triangle";
    renderAreaMorph(stage, { figure, b: 8, h: 5, a: 4, unit: "units" });
  } else if (/divid|quotient|decimal operation/.test(topic)) {
    renderLongDivisionBuilder(stage, { dividend: 156, divisor: 12 });
  } else mounted = false;

  if (!mounted) return null;
  container.appendChild(host);
  return host;
}
