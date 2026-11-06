import assert from "node:assert/strict";
import {
  computeEquationSolution,
  renderAlgebraTilesLab,
} from "../math/fluency-lab/algebra-tiles-lab.js";
import { classifyAngle, renderAngleProtractor } from "../math/fluency-lab/angle-protractor.js";
import { renderBase10Regrouping } from "../math/fluency-lab/base10-regrouping.js";
import {
  compute5NumberSummary,
  renderBoxWhiskerPlot,
} from "../math/fluency-lab/box-whisker-plot.js";
import { CHALLENGE_CATALOG, renderChallengeBanner } from "../math/fluency-lab/challenge-engine.js";
import { computeCircleMetrics, renderCirclePiLab } from "../math/fluency-lab/circle-pi-lab.js";
import { renderCoordinateExplorer } from "../math/fluency-lab/coordinate-explorer.js";
import {
  computeDilation,
  DILATION_SHAPES,
  renderDilationTransformLab,
} from "../math/fluency-lab/dilation-transform-lab.js";
import { defaults, renderTool } from "../math/fluency-lab/drill-tools.js";
import {
  renderFractionSlicer,
  renderPhysicsBalance,
  renderScrubbableAreaModel,
} from "../math/fluency-lab/explorable-manipulatives.js";
import { evaluateFunction, renderFunctionMachine } from "../math/fluency-lab/function-machine.js";
import { GLITCH_CATALOG, renderGlitchHuntCard } from "../math/fluency-lab/glitch-hunter.js";
import {
  evaluateIntegerOperation,
  renderIntegerVectorHops,
} from "../math/fluency-lab/integer-vector-hops.js";
import { renderUniverseHub, UNIVERSE_MODELS } from "../math/fluency-lab/interactive-universe.js";
import { renderNet3DFolder } from "../math/fluency-lab/net-3d-folder.js";
import {
  computeGcfLcm,
  getPrimeFactorization,
  renderPrimeFactorLab,
} from "../math/fluency-lab/prime-factor-lab.js";
import { renderProbabilitySandbox } from "../math/fluency-lab/probability-sandbox.js";
import { renderProofWithoutWords } from "../math/fluency-lab/proof-without-words.js";
import { computePythagoras, renderPythagorasLab } from "../math/fluency-lab/pythagoras-lab.js";
import { renderRatioScaler } from "../math/fluency-lab/ratio-scaler.js";
import { MATH_KEYWORDS, renderConfidenceGauge } from "../math/fluency-lab/speech-sparkles.js";
import {
  getAvailableStrategies,
  renderStrategySelector,
} from "../math/fluency-lab/strategy-paths.js";
import { renderTriangleShear } from "../math/fluency-lab/triangle-shear.js";
import { computeTrigState, renderTrigWaveStudio } from "../math/fluency-lab/trig-wave-studio.js";
import { renderUnitRateComparator } from "../math/fluency-lab/unit-rate-comparator.js";
import {
  calculateMetrics,
  renderWonderCityStudio,
  TILES,
} from "../math/fluency-lab/wonder-city.js";

console.log("Starting Fluency Interactive Enhancements Verification Suite...");

// 1. Stage 1: Explorable Manipulatives
{
  const slicerHtml = renderFractionSlicer(2, 3, 2);
  assert.ok(slicerHtml.includes('data-slicer-root="true"'), "Fraction slicer has root element");
  assert.ok(slicerHtml.includes("4/6"), "Fraction slicer computes equivalent 4/6");
  assert.ok(
    slicerHtml.includes("data-slicer-factor"),
    "Fraction slicer carries partition factor pills",
  );

  const areaHtml = renderScrubbableAreaModel(6, 14, 10);
  assert.ok(
    areaHtml.includes('data-scrubber-root="true"'),
    "Scrubbable area model has root element",
  );
  assert.ok(areaHtml.includes("6 × 10"), "Area model decomposes first partial product");
  assert.ok(areaHtml.includes("6 × 4"), "Area model decomposes second partial product");
  assert.ok(areaHtml.includes(">84</strong>"), "Area model computes total product 84");

  const balHtml = renderPhysicsBalance({
    coeff: 2,
    constant: 6,
    rightTotal: 14,
    leftRemoved: 6,
    rightRemoved: 6,
  });
  assert.ok(balHtml.includes('data-balance-root="true"'), "Balance scale has root element");
  assert.ok(balHtml.includes("Perfectly Balanced"), "Balanced equation reports balanced status");
  assert.ok(balHtml.includes("rotate(0deg)"), "Balanced equation has 0deg tilt");

  const unbalHtml = renderPhysicsBalance({
    coeff: 2,
    constant: 6,
    rightTotal: 14,
    leftRemoved: 6,
    rightRemoved: 0,
  });
  assert.ok(unbalHtml.includes("Unbalanced"), "Unequal operation reports unbalanced status");
  assert.ok(!unbalHtml.includes("rotate(0deg)"), "Unequal operation has non-zero tilt");
}
console.log("✓ Stage 1 Explorable Manipulatives verified.");

// 2. Stage 2: Glitch Hunter & Strategy Paths
{
  assert.ok(GLITCH_CATALOG.length >= 4, "Glitch catalog has at least 4 misconceptions");
  const glitch = GLITCH_CATALOG[0];
  const glitchHtml = renderGlitchHuntCard(glitch);
  assert.ok(
    glitchHtml.includes('data-glitch-id="frac-add-denominators"'),
    "Glitch card renders id",
  );
  assert.ok(glitchHtml.includes("Spot the Glitch"), "Glitch card carries header tag");
  assert.ok(glitchHtml.includes("glitch-step-item"), "Glitch card renders step items");

  const addStrats = getAvailableStrategies({ question: "48 + 35 = ?" });
  assert.ok(addStrats.length >= 2, "Addition problem generates multiple strategic pathways");
  const stratHtml = renderStrategySelector(addStrats);
  assert.ok(stratHtml.includes("strategy-selector-panel"), "Strategy selector renders panel");
  assert.ok(stratHtml.includes("Place Value Split"), "Strategy selector offers Place Value Split");
}
console.log("✓ Stage 2 Glitch Hunter and Strategy Pathways verified.");

// 3. Stage 3: Confidence Gauge & Keywords
{
  const confHtml = renderConfidenceGauge("confident");
  assert.ok(confHtml.includes("confidence-gauge-wrap"), "Confidence gauge renders wrapper");
  assert.ok(
    confHtml.includes("Pretty Confident"),
    "Confidence gauge carries Pretty Confident option",
  );
  assert.ok(
    confHtml.includes('aria-pressed="true"'),
    "Selected confidence option has aria-pressed true",
  );

  assert.ok(MATH_KEYWORDS.includes("numerator"), "Keywords include numerator");
  assert.ok(MATH_KEYWORDS.includes("distributive"), "Keywords include distributive");
  assert.ok(MATH_KEYWORDS.includes("zero pair"), "Keywords include zero pair");
}
console.log("✓ Stage 3 Metacognitive Calibration & Speech Sparkles verified.");

// 4. Stage 4: Wonder City & Geometry Architect
{
  assert.ok(TILES.length >= 4, "Wonder city catalog has at least 4 tile types");
  const metrics = calculateMetrics([
    { type: "square", x: 0, y: 0 },
    { type: "square", x: 25, y: 0 },
    { type: "hexagon", x: 50, y: 0 },
  ]);
  assert.equal(metrics.tileCount, 3, "Metrics calculates accurate tile count");
  assert.ok(Number(metrics.totalArea) > 4, "Metrics calculates composite area");

  const studioHtml = renderWonderCityStudio();
  assert.ok(studioHtml.includes("wonder-city-container"), "Wonder city renders studio container");
  assert.ok(studioHtml.includes("wonder-city-canvas-box"), "Wonder city renders canvas box");
}
console.log("✓ Stage 4 Wonder City Studio verified.");

// 5. Additional Models: Coordinate, Triangle Shear, Base10, Ratio Scaler
{
  const coordHtml = renderCoordinateExplorer({ p1: { x: 3, y: 4 }, p2: { x: -2, y: -1 } });
  assert.ok(coordHtml.includes("coord-explorer-wrap"), "Coordinate plane renders wrapper");
  assert.ok(coordHtml.includes("Slope: 1.00"), "Coordinate plane calculates correct slope");
  assert.ok(coordHtml.includes("Distance: 7.07"), "Coordinate plane calculates Euclidean distance");

  const triHtml = renderTriangleShear({ base: 10, height: 6, shearX: 5 });
  assert.ok(triHtml.includes("triangle-shear-wrap"), "Triangle shear renders wrapper");
  assert.ok(triHtml.includes("Area = ½ × 10 × 6 = 30.0"), "Triangle shear computes invariant area");

  const pvHtml = renderBase10Regrouping({ hundreds: 1, tens: 4, ones: 12 });
  assert.ok(pvHtml.includes("base10-mat-wrap"), "Base 10 mat renders wrapper");
  assert.ok(pvHtml.includes("Total Value = 152"), "Base 10 mat calculates total value 152");
  assert.ok(pvHtml.includes("pv-needs-group"), "Base 10 mat flags ones needing regrouping");

  const ratioHtml = renderRatioScaler({ a: 2, b: 3, multiplier: 3 });
  assert.ok(ratioHtml.includes("ratio-scaler-wrap"), "Ratio scaler renders wrapper");
  assert.ok(ratioHtml.includes("6 : 9"), "Ratio scaler computes scaled ratio 6 : 9");
}
console.log("✓ Coordinate Explorer, Triangle Shear, Base-10 Mat, and Ratio Scaler verified.");

// 6. Next-Gen Grade 4-8 Models: Angles, Prime Trees, Probability, 3D Nets, Function Machine, Unit Rates
{
  // Angle Protractor
  assert.equal(classifyAngle(45).type, "acute");
  assert.equal(classifyAngle(90).type, "right");
  assert.equal(classifyAngle(120).type, "obtuse");
  const angleHtml = renderAngleProtractor({ angle: 60, mode: "single" });
  assert.ok(angleHtml.includes("angle-protractor-wrap"), "Angle studio renders wrapper");
  assert.ok(angleHtml.includes("60°"), "Angle studio renders angle readout");

  // Prime Factor Lab
  assert.deepEqual(getPrimeFactorization(36), [2, 2, 3, 3], "Factorizes 36 correctly");
  const gcfLcm = computeGcfLcm(24, 36);
  assert.equal(gcfLcm.gcf, 12, "GCF of 24 and 36 is 12");
  assert.equal(gcfLcm.lcm, 72, "LCM of 24 and 36 is 72");
  const primeHtml = renderPrimeFactorLab({ targetNum: 36, numA: 24, numB: 36, tab: "tree" });
  assert.ok(primeHtml.includes("prime-lab-wrap"), "Prime factor lab renders wrapper");
  assert.ok(
    primeHtml.includes("36 = 2 × 2 × 3 × 3"),
    "Prime factor lab reports prime factorization",
  );
  const primeVennHtml = renderPrimeFactorLab({ targetNum: 36, numA: 24, numB: 36, tab: "venn" });
  assert.ok(primeVennHtml.includes("GCF(24, 36) = 12"), "Prime factor lab reports correct GCF");

  // Probability Sandbox
  const probHtml = renderProbabilitySandbox({ spins: 10, counts: { red: 5, blue: 3, green: 2 } });
  assert.ok(probHtml.includes("prob-sandbox-wrap"), "Probability sandbox renders wrapper");
  assert.ok(probHtml.includes("Total Spins: 10"), "Probability sandbox displays total spins");

  // 3D Net Folder
  const netHtml = renderNet3DFolder({ l: 4, w: 3, h: 2, foldPercent: 50 });
  assert.ok(netHtml.includes("net-folder-wrap"), "3D Net folder renders wrapper");
  assert.ok(netHtml.includes("= 52.0 sq units"), "3D Net folder computes total surface area 52.0");

  // Function Machine
  assert.equal(evaluateFunction(3, -2, 4), 10, "Calculates y = 3(4) - 2 = 10");
  const funcHtml = renderFunctionMachine({ m: 3, b: -2, currentInput: 3 });
  assert.ok(funcHtml.includes("function-machine-wrap"), "Function machine renders wrapper");
  assert.ok(funcHtml.includes("y = 3x − 2"), "Function machine displays algebraic equation");

  // Unit Rate Comparator
  const rateHtml = renderUnitRateComparator({
    itemA: { name: "Package A", quantity: 16, cost: 4.0, unit: "oz" },
    itemB: { name: "Package B", quantity: 24, cost: 5.4, unit: "oz" },
  });
  assert.ok(rateHtml.includes("unit-rate-wrap"), "Unit rate comparator renders wrapper");
  assert.ok(rateHtml.includes(">$0.250</strong> / oz"), "Unit rate computes Package A rate");
  assert.ok(rateHtml.includes(">$0.225</strong> / oz"), "Unit rate computes Package B rate");

  // Circle & Pi Lab
  const circleMet = computeCircleMetrics(4);
  assert.equal(circleMet.diameter, 8);
  assert.equal(circleMet.formattedC, "25.13");
  const circleHtml = renderCirclePiLab({ radius: 4, mode: "unroll", unrollProgress: 50 });
  assert.ok(circleHtml.includes("circle-lab-wrap"), "Circle lab renders wrapper");
  assert.ok(circleHtml.includes("C = 2πr = 25.13"), "Circle lab displays formatted circumference");

  // Pythagoras Lab
  const pythMet = computePythagoras(3, 4);
  assert.equal(pythMet.c, 5);
  assert.equal(pythMet.isTriple, true);
  const pythHtml = renderPythagorasLab({ a: 3, b: 4, showSquares: true });
  assert.ok(pythHtml.includes("pythagoras-lab-wrap"), "Pythagoras lab renders wrapper");
  assert.ok(pythHtml.includes("a² = 9"), "Pythagoras lab renders a² square");
  assert.ok(pythHtml.includes("b² = 16"), "Pythagoras lab renders b² square");

  // Box-and-Whisker Plot
  const boxSummary = compute5NumberSummary([10, 12, 14, 16, 18, 20, 22]);
  assert.equal(boxSummary.median, 16);
  assert.equal(boxSummary.q1, 12);
  assert.equal(boxSummary.q3, 20);
  assert.equal(boxSummary.iqr, 8);
  const boxHtml = renderBoxWhiskerPlot({ data: [10, 12, 14, 16, 18, 20, 22] });
  assert.ok(boxHtml.includes("box-plot-wrap"), "Box plot renders wrapper");
  assert.ok(boxHtml.includes("Median: 16"), "Box plot displays median");

  // Directed Integer Vector Line
  const intOp1 = evaluateIntegerOperation(-3, "-", -5);
  assert.equal(intOp1.result, 2);
  const intOp2 = evaluateIntegerOperation(4, "+", -7);
  assert.equal(intOp2.result, -3);
  const intHtml = renderIntegerVectorHops({ a: -3, op: "-", b: -5 });
  assert.ok(intHtml.includes("integer-vector-wrap"), "Integer vector renders wrapper");
  assert.ok(intHtml.includes("= 2"), "Integer vector computes (-3) - (-5) = 2");

  // Algebra Tiles Lab
  const sol1 = computeEquationSolution(2, 3, 0, 11);
  assert.equal(sol1.solution, 4);
  const tilesHtml = renderAlgebraTilesLab({ leftX: 2, leftConst: 3, rightX: 0, rightConst: 11 });
  assert.ok(tilesHtml.includes("algebra-tiles-wrap"), "Algebra tiles renders wrapper");
  assert.ok(tilesHtml.includes("Solution: x = 4"), "Algebra tiles displays correct solution");

  // Dilation Transform Lab
  const dilData = computeDilation(DILATION_SHAPES.triangle, 2);
  assert.equal(dilData.scaledPerimeter, 24);
  assert.equal(dilData.scaledArea, 24);
  const dilHtml = renderDilationTransformLab({ shapeKey: "triangle", k: 2 });
  assert.ok(dilHtml.includes("dilation-lab-wrap"), "Dilation lab renders wrapper");
  assert.ok(dilHtml.includes("Scale Factor: k = 2"), "Dilation lab displays scale factor");

  // Proofs Without Words
  const proofParaHtml = renderProofWithoutWords({ theorem: "parallelogram", progress: 50 });
  assert.ok(proofParaHtml.includes("proof-words-wrap"), "Proof without words renders wrapper");
  assert.ok(proofParaHtml.includes("Area = base × height"), "Proof without words renders formula");

  // Trig Wave Studio
  const trig0 = computeTrigState(0);
  assert.equal(trig0.sinVal, 0);
  assert.equal(trig0.cosVal, 1);
  const trig90 = computeTrigState(90);
  assert.equal(trig90.sinVal, 1);
  const trigHtml = renderTrigWaveStudio({ angle: 90 });
  assert.ok(trigHtml.includes("trig-wave-wrap"), "Trig wave studio renders wrapper");
  assert.ok(trigHtml.includes("sin(θ) = 1.000"), "Trig wave studio calculates sin(90)");
}
console.log(
  "✓ Next-Gen Models (Angles, Prime Trees, Probability, 3D Nets, Function Machine, Unit Rate, Circle/Pi, Pythagoras, Box Plot, Integer Vectors, Algebra Tiles, Dilation, Proofs Without Words, Trig Wave) verified.",
);

// 7. Drill Tools Drawer Integration
{
  const defs = defaults();
  assert.ok(defs.slicer, "Drawer defaults include slicer");
  assert.ok(defs.coord, "Drawer defaults include coord");
  assert.ok(defs.triShear, "Drawer defaults include triShear");
  assert.ok(defs.pvMat, "Drawer defaults include pvMat");
  assert.ok(defs.ratioScale, "Drawer defaults include ratioScale");
  assert.ok(defs.angle, "Drawer defaults include angle");
  assert.ok(defs.primeLab, "Drawer defaults include primeLab");
  assert.ok(defs.probSpinner, "Drawer defaults include probSpinner");
  assert.ok(defs.net3d, "Drawer defaults include net3d");
  assert.ok(defs.funcMach, "Drawer defaults include funcMach");
  assert.ok(defs.rateComp, "Drawer defaults include rateComp");
  assert.ok(defs.circlePi, "Drawer defaults include circlePi");
  assert.ok(defs.pythagoras, "Drawer defaults include pythagoras");
  assert.ok(defs.boxPlot, "Drawer defaults include boxPlot");
  assert.ok(defs.intVector, "Drawer defaults include intVector");
  assert.ok(defs.algebraTiles, "Drawer defaults include algebraTiles");
  assert.ok(defs.dilation, "Drawer defaults include dilation");
  assert.ok(defs.proofWords, "Drawer defaults include proofWords");
  assert.ok(defs.trigWave, "Drawer defaults include trigWave");

  const slicerToolHtml = renderTool("slicer", defs, { locked: false });
  assert.ok(slicerToolHtml.includes("expl-slicer-wrap"), "Drawer renders fraction slicer tool");

  const coordToolHtml = renderTool("coord", defs, { locked: false });
  assert.ok(coordToolHtml.includes("coord-explorer-wrap"), "Drawer renders coordinate plane tool");

  const triToolHtml = renderTool("triShear", defs, { locked: false });
  assert.ok(triToolHtml.includes("triangle-shear-wrap"), "Drawer renders triangle shear tool");

  const pvToolHtml = renderTool("pvMat", defs, { locked: false });
  assert.ok(pvToolHtml.includes("base10-mat-wrap"), "Drawer renders base10 mat tool");

  const ratioToolHtml = renderTool("ratioScale", defs, { locked: false });
  assert.ok(ratioToolHtml.includes("ratio-scaler-wrap"), "Drawer renders ratio scaler tool");

  const angleToolHtml = renderTool("angle", defs, { locked: false });
  assert.ok(angleToolHtml.includes("angle-protractor-wrap"), "Drawer renders angle studio tool");

  const primeToolHtml = renderTool("primeLab", defs, { locked: false });
  assert.ok(primeToolHtml.includes("prime-lab-wrap"), "Drawer renders prime factor lab tool");

  const probToolHtml = renderTool("probSpinner", defs, { locked: false });
  assert.ok(probToolHtml.includes("prob-sandbox-wrap"), "Drawer renders probability spinner tool");

  const netToolHtml = renderTool("net3d", defs, { locked: false });
  assert.ok(netToolHtml.includes("net-folder-wrap"), "Drawer renders 3D net folder tool");

  const funcToolHtml = renderTool("funcMach", defs, { locked: false });
  assert.ok(funcToolHtml.includes("function-machine-wrap"), "Drawer renders function machine tool");

  const rateToolHtml = renderTool("rateComp", defs, { locked: false });
  assert.ok(rateToolHtml.includes("unit-rate-wrap"), "Drawer renders unit rate comparator tool");

  const circleToolHtml = renderTool("circlePi", defs, { locked: false });
  assert.ok(circleToolHtml.includes("circle-lab-wrap"), "Drawer renders circle pi lab tool");

  const pythToolHtml = renderTool("pythagoras", defs, { locked: false });
  assert.ok(pythToolHtml.includes("pythagoras-lab-wrap"), "Drawer renders pythagoras lab tool");

  const boxToolHtml = renderTool("boxPlot", defs, { locked: false });
  assert.ok(boxToolHtml.includes("box-plot-wrap"), "Drawer renders box plot tool");

  const intToolHtml = renderTool("intVector", defs, { locked: false });
  assert.ok(intToolHtml.includes("integer-vector-wrap"), "Drawer renders integer vector tool");

  const tilesToolHtml = renderTool("algebraTiles", defs, { locked: false });
  assert.ok(tilesToolHtml.includes("algebra-tiles-wrap"), "Drawer renders algebra tiles tool");

  const dilationToolHtml = renderTool("dilation", defs, { locked: false });
  assert.ok(dilationToolHtml.includes("dilation-lab-wrap"), "Drawer renders dilation tool");

  const proofToolHtml = renderTool("proofWords", defs, { locked: false });
  assert.ok(proofToolHtml.includes("proof-words-wrap"), "Drawer renders proofs without words tool");

  const trigToolHtml = renderTool("trigWave", defs, { locked: false });
  assert.ok(trigToolHtml.includes("trig-wave-wrap"), "Drawer renders trig wave tool");
}
console.log("✓ Math Tool Drawer integration verified.");

// 8. Challenge Quests & Interactive Math Universe Hub
{
  assert.ok(CHALLENGE_CATALOG.angle.length >= 1, "Angle challenges exist");
  assert.ok(CHALLENGE_CATALOG.pythagoras.length >= 1, "Pythagoras challenges exist");
  assert.ok(CHALLENGE_CATALOG.dilation.length >= 1, "Dilation challenges exist");

  const activeBanner = renderChallengeBanner("angle", { angle: 45 });
  assert.ok(activeBanner.includes("Active Quest"), "Unsolved challenge shows Active Quest");
  assert.ok(activeBanner.includes("Target: 120° Obtuse Angle"), "Shows challenge title");

  const solvedBanner = renderChallengeBanner("angle", { angle: 120 });
  assert.ok(solvedBanner.includes("is-quest-solved"), "Solved challenge has is-quest-solved class");
  assert.ok(solvedBanner.includes("SOLVED!"), "Solved challenge displays SOLVED badge");

  assert.ok(UNIVERSE_MODELS.length >= 16, "Universe catalog has all 16+ models");
  const univHtml = renderUniverseHub({ activeCategory: "all", activeModelKey: "algebraTiles" });
  assert.ok(univHtml.includes("EduWonderLab Math Universe"), "Renders Universe Hub title");
  assert.ok(univHtml.includes("Interactive Manipulatives"), "Renders manipulative count");
  assert.ok(univHtml.includes("universe-stage-grid"), "Renders stage grid");
  assert.ok(univHtml.includes("algebra-tiles-wrap"), "Renders active model on playground");

  const geomUnivHtml = renderUniverseHub({
    activeCategory: "geometry",
    activeModelKey: "pythagoras",
  });
  assert.ok(geomUnivHtml.includes("pythagoras-lab-wrap"), "Renders filtered geometry model");
}
console.log("✓ Challenge Quests & Interactive Math Universe Hub verified.");

// 9. Keep-Change-Flip (KCF) Studio & Vertical Fractions
{
  const { renderKCFStudio, verticalFracHtml } = await import(
    "../math/fluency-lab/keep-change-flip-lab.js"
  );
  const { formatVerticalFractions, mathText } = await import(
    "../math/fluency-lab/trail-pictures.js"
  );
  const { drawerSeed } = await import("../math/fluency-lab/problem-numbers.js");

  const vFrac = verticalFracHtml(3, 4);
  assert.ok(vFrac.includes('class="v-frac"'), "Vertical fraction has v-frac class");
  assert.ok(vFrac.includes('class="v-num">3<'), "Vertical fraction has numerator");
  assert.ok(vFrac.includes('class="v-den">4<'), "Vertical fraction has denominator");

  const formatted = formatVerticalFractions(mathText("2/3 ÷ 4/5 = ?"));
  assert.ok(
    formatted.includes(
      '<span class="v-frac"><span class="v-num">2</span><span class="v-den">3</span></span>',
    ),
    "formatVerticalFractions formats first fraction vertically",
  );
  assert.ok(
    formatted.includes(
      '<span class="v-frac"><span class="v-num">4</span><span class="v-den">5</span></span>',
    ),
    "formatVerticalFractions formats second fraction vertically",
  );

  const kcfHtml = renderKCFStudio({ a: 2, b: 3, c: 4, d: 5 });
  assert.ok(kcfHtml.includes("Dividing Fractions: Keep · Change · Flip"), "Renders KCF title");
  assert.ok(kcfHtml.includes("card-keep"), "Has KEEP step card");
  assert.ok(kcfHtml.includes("card-change"), "Has CHANGE step card");
  assert.ok(kcfHtml.includes("card-flip"), "Has FLIP step card");
  assert.ok(kcfHtml.includes("Visual Measurement Model"), "Has visual measurement model");

  const seed = drawerSeed({ question: "2/3 ÷ 4/5 = ?" });
  assert.strictEqual(seed.tool, "kcfLab", "Fraction division auto-selects kcfLab tool");
  assert.deepStrictEqual(seed.kcfLab, { a: 2, b: 3, c: 4, d: 5 }, "Seeds exact problem fractions");
}
console.log("✓ Keep-Change-Flip (KCF) Studio & Vertical Fractions verified.");

console.log("\nALL INTERACTIVE ENHANCEMENTS & MODELS VERIFIED SUCCESSFULLY! 🎉✨");
