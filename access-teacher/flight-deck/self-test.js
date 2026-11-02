import { SeedEngine } from "./seed-engine.js";
import { MathSVGService } from "./math-svg-service.js";
import { PortalStateMachine } from "./state-machine.js";
export function selfTest() {
  const cases = [{ unit: 1, lesson: 0, tier: 0, misconception: 0, streak: false }, { unit: 7, lesson: 31, tier: 3, misconception: 7, streak: true }, { unit: 10, lesson: 12, tier: 2, misconception: 5, streak: false }];
  for (const item of cases) if (JSON.stringify(SeedEngine.decode(SeedEngine.encode(item))) !== JSON.stringify(item)) throw new Error("Seed round trip failed.");
  const vectors = [
    MathSVGService.makeNumberLineSVG(),
    MathSVGService.makeNumberLineSVG({ min: -9, max: 3, value: -2, circleType: "open", arrowDir: "left", label: "x ≤ −2" }),
    MathSVGService.makeDoubleNumberLineSVG(),
    MathSVGService.makeDoubleNumberLineSVG({ ratios: [{ top: 0, bottom: 0 }, { top: 3, bottom: 1 }, { top: 6, bottom: 2 }] }),
    MathSVGService.makeFractionTapeSVG(),
    MathSVGService.makeFractionTapeSVG({ parts: 12, shaded: 7, comparisonParts: 8 }),
    MathSVGService.makeCoordinatePlaneSVG(),
    MathSVGService.makeCoordinatePlaneSVG({ quadrants: 1, points: [{ x: 5, y: 6, label: "A" }], showGrid: false }),
  ];
  for (const svg of vectors) {
    if (!svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"') || !svg.endsWith("</svg>") || /NaN|undefined/.test(svg)) throw new Error("SVG generation failed.");
    if (typeof DOMParser !== "undefined" && new DOMParser().parseFromString(svg, "image/svg+xml").querySelector("parsererror")) throw new Error("SVG is not valid XML.");
  }
  let latest; const controller = PortalStateMachine.create((s) => { latest = s; }); controller.mode("live"); controller.projector(true); controller.mode("triage"); if (latest.mode !== "triage" || !latest.projector) throw new Error("State transition failed."); controller.timerStop();
  return { seeds: cases.length, svgVectors: vectors.length, stateTransitions: 3 };
}
