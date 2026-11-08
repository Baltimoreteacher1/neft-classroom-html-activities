import assert from "node:assert/strict";
import {
  analyzeDataExplanation,
  analyzeEquationBalanceExplanation,
  analyzeFractionalVolumeExplanation,
  analyzeFractionDivisionExplanation,
  analyzeFractionExplanation,
  analyzeFractionLineExplanation,
  analyzePercentExplanation,
  analyzeRatioExplanation,
  analyzeSurfaceAreaExplanation,
  checkDataTransfer,
  checkEquationBalanceTransfer,
  checkFractionalVolumeTransfer,
  checkFractionDivisionTransfer,
  checkFractionLineTransfer,
  checkFractionTransfer,
  checkPercentTransfer,
  checkRatioTransfer,
  checkSurfaceAreaTransfer,
  dataSupportForLevel,
  equationBalanceSupportForLevel,
  fractionalVolumeSupportForLevel,
  fractionDivisionSupportForLevel,
  fractionLineSupportForLevel,
  fractionSupportForLevel,
  parseRatioPair,
  percentSupportForLevel,
  pyramidSurfaceAreaSupportForLevel,
  ratioTransferBase,
  supportForLevel,
  surfaceAreaSupportForLevel,
} from "../access-practice-lab/src/studios/math-reasoning-bridge.js";
import * as languageStudios from "../access-practice-lab/src/views/language-studios.js";
import { generateProblem, getSkill, seededRandom } from "../math/fluency-lab/problem-bank.js";
import { mountTry } from "../math/fluency-lab/studio/panel-try.js";
import { SIMS } from "../math/fluency-lab/studio/sims.js";
import {
  applyEquationMove,
  equationHolds,
  equationMoves,
  formatLinearEquation,
  parseLinearEquation,
} from "../shared/math/equation-balance.js";
import {
  createRatioExplanationUrl,
  readMathLanguageBridge,
} from "../shared/math-language-bridge/v1.js";
import {
  createDataExplanationUrl,
  createEquationBalanceExplanationUrl,
  createFractionalVolumeExplanationUrl,
  createFractionDivisionExplanationUrl,
  createFractionExplanationUrl,
  createFractionNumberLineExplanationUrl,
  createPercentExplanationUrl,
  createPyramidSurfaceAreaExplanationUrl,
  createSurfaceAreaExplanationUrl,
  readMathLanguageBridge as readBridgeV2,
} from "../shared/math-language-bridge/v2.js";
import { makeCtx, mount, win } from "./lib/access-studios-dom.mjs";

const sharedEquation = parseLinearEquation("2x + 4 = 20. Find x.");
assert.equal(sharedEquation?.x, 8);
assert.deepEqual(equationMoves(sharedEquation.eq), [
  { kind: "add", n: -4 },
  { kind: "div", n: 2 },
]);
const afterSubtract = applyEquationMove(sharedEquation.eq, { kind: "add", n: -4 });
const afterDivide = applyEquationMove(afterSubtract, { kind: "div", n: 2 });
assert.equal(formatLinearEquation(afterSubtract), "2x = 16");
assert.equal(formatLinearEquation(afterDivide), "x = 8");
assert.equal(equationHolds(sharedEquation.eq, 8), true);
assert.equal(equationHolds(sharedEquation.eq, 7), false);
assert.equal(parseLinearEquation("x ÷ 3 = 4")?.x, 12);

const url = new URL(createRatioExplanationUrl({ first: 2, second: 3, grade: 6 }));
assert.equal(url.origin, "https://thelanguagepage.com");
assert.equal(url.pathname, "/access-practice-lab/language-studios");
assert.deepEqual([...url.searchParams.keys()].sort(), [
  "first",
  "grade",
  "schema",
  "second",
  "task",
]);
assert.deepEqual(readMathLanguageBridge(url.searchParams), {
  schema: "edu-wonderlab.math-language/1",
  task: "ratio-equivalence",
  grade: 6,
  first: 2,
  second: 3,
});
assert.equal(
  readMathLanguageBridge(`${url.search}&student=Alex`),
  null,
  "identity fields are rejected",
);
assert.equal(
  readMathLanguageBridge(
    "?schema=edu-wonderlab.math-language/2&task=ratio-equivalence&grade=6&first=2&second=3",
  ),
  null,
);
assert.throws(() => createRatioExplanationUrl({ first: 0, second: 3 }), RangeError);

assert.deepEqual(parseRatioPair("8 : 12"), [8, 12]);
assert.deepEqual(ratioTransferBase({ first: 2, second: 3 }), [3, 5]);
assert.equal(checkRatioTransfer({ first: 2, second: 3 }, "12:20"), true);
assert.equal(checkRatioTransfer({ first: 2, second: 3 }, "12:18"), false);
assert.equal(checkRatioTransfer({ first: 2, second: 3 }, "2:3"), false);

const firstTry = analyzeRatioExplanation(
  "Both quantities were multiplied, so the ratio stays the same.",
);
assert.equal(firstTry.evidence.namesBoth, true);
assert.equal(firstTry.evidence.usesRatioWord, true);
assert.equal(firstTry.evidence.connectsReason, true);
const spanishTry = analyzeRatioExplanation(
  "Ambas cantidades mantienen la razón porque cambia cada parte por igual.",
  "es",
);
assert.equal(spanishTry.evidence.namesBoth, true);
assert.equal(spanishTry.evidence.usesRatioWord, true);
assert.equal(spanishTry.evidence.connectsReason, true);
assert.ok(supportForLevel(1, "en").frame);
assert.ok(supportForLevel(3, "es").frame);
assert.equal(supportForLevel(5, "en"), null, "highest support level fades the sentence frame");

const percentUrl = new URL(createPercentExplanationUrl({ percent: 30, whole: 50, grade: 6 }));
assert.deepEqual([...percentUrl.searchParams.keys()].sort(), [
  "grade",
  "percent",
  "schema",
  "task",
  "whole",
]);
const percentBridge = readBridgeV2(percentUrl.searchParams);
assert.deepEqual(percentBridge, {
  schema: "edu-wonderlab.math-language/2",
  task: "percent-part-whole",
  grade: 6,
  percent: 30,
  whole: 50,
  part: 15,
  transferWhole: 60,
  transferPart: 18,
});
assert.equal(
  readBridgeV2(url.searchParams)?.task,
  "ratio-equivalence",
  "v1 ratio links remain supported",
);
assert.equal(readBridgeV2(`${percentUrl.search}&student=Alex`), null);
assert.equal(checkPercentTransfer(percentBridge, "60"), true);
assert.equal(checkPercentTransfer(percentBridge, "59"), false);
assert.equal(checkPercentTransfer(percentBridge, "60.5"), false);
assert.equal(
  percentSupportForLevel(2, "es", { percent: 30, whole: 50, part: 15 }).frame.includes("15"),
  true,
);
assert.equal(percentSupportForLevel(5, "en", { percent: 30, whole: 50, part: 15 }), null);
const fractionUrl = new URL(
  createFractionExplanationUrl({ numerator: 3, denominator: 4, whole: 20, grade: 5 }),
);
const fractionBridge = readBridgeV2(fractionUrl.searchParams);
assert.deepEqual(fractionBridge, {
  schema: "edu-wonderlab.math-language/2",
  task: "fraction-of-whole",
  grade: 5,
  numerator: 3,
  denominator: 4,
  whole: 20,
  part: 15,
  transferWhole: 24,
  transferPart: 18,
});
assert.equal(
  readBridgeV2(`${fractionUrl.search}&percent=30`),
  null,
  "fraction contracts reject percent fields",
);
assert.equal(checkFractionTransfer(fractionBridge, "24"), true);
assert.equal(checkFractionTransfer(fractionBridge, "23"), false);
assert.equal(checkFractionTransfer(fractionBridge, "24.5"), false);
assert.equal(
  analyzeFractionExplanation("3/4 of the whole is the part because each piece is equal.").evidence
    .namesWhole,
  true,
);
assert.equal(
  fractionSupportForLevel(5, "en", { numerator: 3, denominator: 4, whole: 20, part: 15 }),
  null,
);
const fractionLineUrl = new URL(
  createFractionNumberLineExplanationUrl({ numerator: 2, denominator: 5, grade: 3 }),
);
assert.deepEqual([...fractionLineUrl.searchParams.keys()].sort(), [
  "denominator",
  "grade",
  "numerator",
  "schema",
  "task",
]);
const fractionLineBridge = readBridgeV2(fractionLineUrl.searchParams);
assert.deepEqual(fractionLineBridge, {
  schema: "edu-wonderlab.math-language/2",
  task: "fraction-number-line",
  grade: 3,
  numerator: 2,
  denominator: 5,
  transferNumerator: 3,
  transferDenominator: 6,
});
assert.equal(readBridgeV2(`${fractionLineUrl.search}&student=private`), null);
assert.throws(
  () => createFractionNumberLineExplanationUrl({ numerator: 5, denominator: 5 }),
  RangeError,
);
assert.equal(
  checkFractionLineTransfer(fractionLineBridge, "3/6"),
  true,
  "equivalent fraction responses are accepted",
);
assert.equal(checkFractionLineTransfer(fractionLineBridge, "3/5"), false);
assert.equal(
  analyzeFractionLineExplanation(
    "The whole has five equal intervals. From zero I count two because P is there.",
  ).evidence.countsFromZero,
  true,
);
assert.ok(
  fractionLineSupportForLevel(2, "es", { numerator: 2, denominator: 5 }).frame.includes("5"),
);
assert.equal(fractionLineSupportForLevel(5, "en", { numerator: 2, denominator: 5 }), null);
const dataUrl = new URL(createDataExplanationUrl({ values: [2, 3, 4, 5], grade: 7 }));
assert.deepEqual([...dataUrl.searchParams.keys()].sort(), ["grade", "schema", "task", "values"]);
const dataBridge = readBridgeV2(dataUrl.searchParams);
assert.deepEqual(dataBridge, {
  schema: "edu-wonderlab.math-language/2",
  task: "data-center",
  grade: 7,
  values: [2, 3, 4, 5],
  transferValues: [9, 13, 17, 21],
  selectedIndex: 1,
  transferMean: 20,
  transferMedian: 17,
  transferOutlier: 40,
});
assert.equal(
  readBridgeV2(`${dataUrl.search}&name=student`),
  null,
  "data contract excludes identity fields",
);
assert.throws(() => createDataExplanationUrl({ values: [1, 2, 3] }), RangeError);
assert.equal(checkDataTransfer(dataBridge, "20", "17"), true);
assert.equal(checkDataTransfer(dataBridge, "19.9", "17"), false);
assert.equal(checkDataTransfer(dataBridge, "20", "17.5"), false);
assert.equal(
  dataSupportForLevel(5, "en"),
  null,
  "the data sentence frame fades at the independent level",
);
const dataAnalysis = analyzeDataExplanation(
  "The mean changes more than the median because the data point is far away.",
);
assert.deepEqual(dataAnalysis.evidence, {
  namesBothMeasures: true,
  namesObservation: true,
  connectsReason: true,
});
assert.equal(analyzeDataExplanation("The number changed.").evidence.namesBothMeasures, false);

const surfaceUrl = new URL(
  createSurfaceAreaExplanationUrl({ length: 2, width: 3, height: 4, grade: 6 }),
);
const surfaceBridge = readBridgeV2(surfaceUrl.searchParams);
assert.deepEqual(surfaceBridge, {
  schema: "edu-wonderlab.math-language/2",
  task: "surface-area-prism",
  grade: 6,
  length: 2,
  width: 3,
  height: 4,
  unit: "in",
  faceAreas: [6, 8, 12],
  surfaceArea: 52,
  transferDimensions: [3, 4, 5],
  transferSurfaceArea: 94,
});
assert.equal(readBridgeV2(`${surfaceUrl.search}&student=private`), null);
assert.equal(checkSurfaceAreaTransfer(surfaceBridge, "94"), true);
assert.equal(checkSurfaceAreaTransfer(surfaceBridge, "47"), false);
assert.equal(checkSurfaceAreaTransfer(surfaceBridge, "94.5"), false);
assert.deepEqual(
  analyzeSurfaceAreaExplanation(
    "The faces form three pairs because both faces count in square units.",
  ).evidence,
  {
    namesFaces: true,
    explainsPairs: true,
    namesArea: false,
    namesUnits: true,
    connectsReason: true,
  },
);
assert.ok(surfaceAreaSupportForLevel(2, "en", surfaceBridge).frame.includes("2×3"));
assert.equal(surfaceAreaSupportForLevel(5, "es", surfaceBridge), null);
assert.throws(
  () => createSurfaceAreaExplanationUrl({ length: 0, width: 2, height: 3 }),
  RangeError,
);
assert.equal(readBridgeV2(`${surfaceUrl.search}&values=1,2,3,4`), null);
const pyramidUrl = new URL(createPyramidSurfaceAreaExplanationUrl({ side: 6, triangleHeight: 5 }));
const pyramidBridge = readBridgeV2(pyramidUrl.searchParams);
assert.deepEqual(pyramidBridge, {
  schema: "edu-wonderlab.math-language/2",
  task: "surface-area-pyramid",
  grade: 6,
  side: 6,
  triangleHeight: 5,
  unit: "cm",
  baseArea: 36,
  triangleArea: 15,
  surfaceArea: 96,
  transferSide: 7,
  transferTriangleHeight: 6,
  transferSurfaceArea: 133,
});
assert.equal(readBridgeV2(`${pyramidUrl.search}&name=private`), null);
assert.equal(checkSurfaceAreaTransfer(pyramidBridge, "133"), true);
assert.equal(checkSurfaceAreaTransfer(pyramidBridge, "132"), false);
assert.ok(pyramidSurfaceAreaSupportForLevel(2, "es", pyramidBridge).frame.includes("6×5÷2"));
assert.equal(pyramidSurfaceAreaSupportForLevel(5, "en", pyramidBridge), null);
const fractionalVolumeUrl = new URL(
  createFractionalVolumeExplanationUrl({
    lengthHalves: 2,
    widthHalves: 3,
    heightHalves: 4,
  }),
);
const fractionalVolumeBridge = readBridgeV2(fractionalVolumeUrl.searchParams);
assert.equal(fractionalVolumeBridge.task, "fractional-volume");
assert.equal(fractionalVolumeBridge.volumeEighths, 24);
assert.equal(fractionalVolumeBridge.volumeCubicFeet, 3);
assert.equal(checkFractionalVolumeTransfer(fractionalVolumeBridge, "15"), true);
assert.equal(checkFractionalVolumeTransfer(fractionalVolumeBridge, "120/8"), true);
assert.equal(checkFractionalVolumeTransfer(fractionalVolumeBridge, "5.999"), false);
assert.equal(readBridgeV2(`${fractionalVolumeUrl.search}&student=private`), null);
assert.throws(
  () => createFractionalVolumeExplanationUrl({ lengthHalves: 0, widthHalves: 3, heightHalves: 4 }),
  RangeError,
);
assert.deepEqual(
  analyzeFractionalVolumeExplanation(
    "I multiplied length, width, and height because each half-foot cube is one eighth ft³, so volume uses cubic feet.",
  ).evidence,
  {
    namesDimensions: true,
    connectsMultiplication: true,
    namesCubicUnits: true,
    explainsFractionalUnit: true,
    connectsReason: true,
  },
);
assert.ok(fractionalVolumeSupportForLevel(2, "en").frame.includes("1/8 ft³"));
assert.equal(fractionalVolumeSupportForLevel(5, "es"), null);
const fractionDivisionUrl = new URL(
  createFractionDivisionExplanationUrl({
    dividendNumerator: 2,
    dividendDenominator: 3,
    divisorNumerator: 1,
    divisorDenominator: 6,
  }),
);
const fractionDivisionBridge = readBridgeV2(fractionDivisionUrl.searchParams);
assert.equal(fractionDivisionBridge.task, "fraction-division");
assert.deepEqual(
  [fractionDivisionBridge.quotientNumerator, fractionDivisionBridge.quotientDenominator],
  [4, 1],
);
assert.deepEqual(
  [
    fractionDivisionBridge.transferQuotientNumerator,
    fractionDivisionBridge.transferQuotientDenominator,
  ],
  [6, 1],
);
assert.equal(checkFractionDivisionTransfer(fractionDivisionBridge, "6"), true);
assert.equal(checkFractionDivisionTransfer(fractionDivisionBridge, "12/2"), true);
assert.equal(checkFractionDivisionTransfer(fractionDivisionBridge, "5"), false);
assert.equal(readBridgeV2(`${fractionDivisionUrl.search}&student=private`), null);
assert.throws(
  () =>
    createFractionDivisionExplanationUrl({
      dividendNumerator: 2,
      dividendDenominator: 3,
      divisorNumerator: 0,
      divisorDenominator: 6,
    }),
  RangeError,
);
assert.deepEqual(
  analyzeFractionDivisionExplanation(
    "The dividend is 2/3 and the divisor is 1/6. Equal-sized pieces show four groups because I multiply by the reciprocal and check by multiplying the quotient back.",
  ).evidence,
  {
    identifiesDividendAndDivisor: true,
    explainsEqualSizedPieces: true,
    connectsReciprocal: true,
    checksByMultiplying: true,
    connectsReason: true,
  },
);
assert.ok(
  fractionDivisionSupportForLevel(2, "en").frame.toLowerCase().includes("equal-sized pieces"),
);
assert.equal(fractionDivisionSupportForLevel(5, "es"), null);
const equationCases = [
  [{ form: "add", amount: 7, result: 19 }, [12, 20]],
  [{ form: "subtract", amount: 4, result: 2 }, [6, 3]],
  [{ form: "multiply", amount: 4, result: 28 }, [7, 32]],
  [{ form: "divide", amount: 4, result: 7 }, [28, 8]],
  [{ form: "two-step", amount: 3, shift: 4, result: 19 }, [5, 22]],
  [{ form: "two-step", amount: 3, shift: -5, result: 16 }, [7, 19]],
];
for (const [input, [solution, transferResult]] of equationCases) {
  const equationUrl = new URL(createEquationBalanceExplanationUrl({ ...input, grade: 6 }));
  const equationBridge = readBridgeV2(equationUrl.searchParams);
  assert.equal(equationBridge.solution, solution);
  assert.equal(equationBridge.transferResult, transferResult);
  assert.equal(
    checkEquationBalanceTransfer(equationBridge, String(equationBridge.transferSolution)),
    true,
  );
  assert.equal(checkEquationBalanceTransfer(equationBridge, String(solution)), false);
  assert.equal(readBridgeV2(`${equationUrl.search}&student=private`), null);
}
assert.throws(
  () => createEquationBalanceExplanationUrl({ form: "multiply", amount: 4, result: 7 }),
  RangeError,
);
assert.throws(
  () => createEquationBalanceExplanationUrl({ form: "two-step", amount: 3, shift: 0, result: 18 }),
  RangeError,
);
const equationEvidence = analyzeEquationBalanceExplanation(
  "I subtract 4 from both sides to keep the equation equal because it is the inverse. I check by substituting 6.",
);
assert.equal(equationEvidence.evidence.preservesEquality, true);
assert.equal(equationEvidence.evidence.namesInverse, true);
assert.equal(equationEvidence.evidence.checksSolution, true);
assert.equal(equationEvidence.evidence.connectsReason, true);
assert.deepEqual(
  analyzeEquationBalanceExplanation(
    "Resto 7 a ambos lados para mantener la igualdad porque es la inversa. Compruebo al sustituir 12.",
  ).evidence,
  {
    namesUnknown: false,
    preservesEquality: true,
    namesInverse: true,
    checksSolution: true,
    connectsReason: true,
  },
);
assert.ok(equationBalanceSupportForLevel(2, "es").frame.includes("ambos lados"));
assert.equal(equationBalanceSupportForLevel(5, "en"), null);
const nonWholeDivisionBridge = readBridgeV2(
  new URL(
    createFractionDivisionExplanationUrl({
      dividendNumerator: 2,
      dividendDenominator: 3,
      divisorNumerator: 4,
      divisorDenominator: 5,
    }),
  ).searchParams,
);
assert.deepEqual(
  [nonWholeDivisionBridge.quotientNumerator, nonWholeDivisionBridge.quotientDenominator],
  [5, 6],
);
assert.equal(checkFractionDivisionTransfer(nonWholeDivisionBridge, "1 1/4"), true);
assert.equal(checkFractionDivisionTransfer(nonWholeDivisionBridge, "1.25"), true);
assert.equal(checkFractionDivisionTransfer(nonWholeDivisionBridge, "1.24"), false);
assert.equal(
  analyzePercentExplanation(
    "30 percent of the whole is the part because the grid has equal squares.",
  ).evidence.connectsReason,
  true,
);

const bridge = readMathLanguageBridge(url.searchParams);
Object.defineProperty(globalThis, "SpeechRecognition", {
  value: class SpeechRecognition {
    start() {}
    stop() {}
  },
  configurable: true,
});
const ctx = makeCtx("language-studios");
ctx.route.mathBridge = bridge;
let { root } = await mount(languageStudios, ctx);
assert.match(root.textContent, /Why do 2:3 and 6:9 describe the same relationship/);
assert.ok(
  root.querySelector('[data-dictate="mlb-draft"]'),
  `first explanation has optional speech entry: ${root.innerHTML.slice(-1800)}`,
);
root.querySelector("#mlb-draft").value =
  "Both quantities were multiplied by three, so the ratio stays equivalent.";
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Improve your explanation/);
assert.match(root.textContent, /Names both quantities/);
root.querySelector("#mlb-revision").value =
  "Both quantities use the same factor, so their ratio remains equivalent.";
root
  .querySelector("[data-bridge-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /A new problem starts with 3:5/);
root.querySelector("#mlb-transfer").value = "12:20";
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Now explain the new example independently/);
assert.ok(
  root.querySelector('[data-dictate="mlb-transfer-explain"]'),
  "independent explanation has optional speech entry",
);
root.querySelector("#mlb-transfer-explain").value =
  "Both parts were multiplied by four because the same relationship stays equivalent.";
root
  .querySelector("[data-bridge-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Investigation complete/);
assert.match(root.textContent, /not an official WIDA score/);

ctx.route.mathBridge = percentBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /What do 30%, 15, and 50 represent/);
assert.equal(root.querySelectorAll(".mlb-percent-cell").length, 100);
root.querySelector("#mlb-pct-draft").value =
  "30 percent of the whole is 15 because 30 of 100 equal squares are shaded.";
root.querySelector("#mlb-pct-draft").dispatchEvent(new win.Event("input", { bubbles: true }));
const savedBridgeKey = Array.from({ length: globalThis.localStorage.length }, (_, index) =>
  globalThis.localStorage.key(index),
).find((key) => key?.includes("math-language%2F2"));
assert.ok(
  savedBridgeKey &&
    JSON.parse(globalThis.localStorage.getItem(savedBridgeKey)).data.percentDraft.includes(
      "30 percent",
    ),
  "session draft is saved locally",
);
ctx.route.mathBridge = bridge;
await mount(languageStudios, ctx);
ctx.route.mathBridge = percentBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(
  root.querySelector("#mlb-pct-draft").value,
  /30 percent of the whole is 15/,
  "partial percent explanation restores when the task is reopened",
);
root
  .querySelector("[data-pct-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Improve your explanation/);
root.querySelector("#mlb-pct-revision").value =
  "The part is 30% of the whole because 30 of the 100 equal squares are shaded.";
root
  .querySelector("[data-pct-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /18 is 30% of what whole/);
root.querySelector("#mlb-pct-transfer").value = "60";
root
  .querySelector("[data-pct-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /That whole is correct/);
root.querySelector("#mlb-pct-transfer-explain").value =
  "18 is 30 percent of 60 because 18 divided by 0.30 equals the whole.";
root
  .querySelector("[data-pct-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /solved a new percent problem independently/);

ctx.route.mathBridge = fractionBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /What do 3\/4, 15, and 20 represent/);
assert.equal(root.querySelectorAll(".mlb-fraction-cell").length, 4);
root
  .querySelector('[data-frac-scale="2"]')
  .dispatchEvent(new win.Event("click", { bubbles: true }));
({ root } = await mount(languageStudios, ctx));
assert.equal(root.querySelectorAll(".mlb-fraction-cell").length, 8);
assert.equal(root.querySelectorAll(".mlb-fraction-cell.is-shaded").length, 6);
root.querySelector("#mlb-frac-draft").value =
  "Three fourths of the whole is 15 because six twelfths shade the same amount.";
root
  .querySelector("[data-frac-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Improve your explanation/);
root.querySelector("#mlb-frac-revision").value =
  "Three fourths names 15 of the whole 20 because each fourth is equal.";
root
  .querySelector("[data-frac-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /18 is 3\/4 of what whole/);
root.querySelector("#mlb-frac-transfer").value = "23";
root
  .querySelector("[data-frac-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.doesNotMatch(root.textContent, /That whole is correct/);
root.querySelector("#mlb-frac-transfer").value = "24";
root
  .querySelector("[data-frac-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /That whole is correct/);
root.querySelector("#mlb-frac-transfer-explain").value =
  "18 is three fourths of 24 because each fourth is 6 and three groups make 18.";
root
  .querySelector("[data-frac-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /solved a new fraction problem independently/);

ctx.route.mathBridge = fractionLineBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Place P at 2\/5/);
assert.equal(root.querySelectorAll(".mlb-numberline-svg").length, 1);
root
  .querySelector('[data-fline-move="1"]')
  .dispatchEvent(new win.Event("click", { bubbles: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /P is at mark 1 of 5/);
root
  .querySelector('[data-fline-move="1"]')
  .dispatchEvent(new win.Event("click", { bubbles: true }));
({ root } = await mount(languageStudios, ctx));
root.querySelector("[data-fline-check]").dispatchEvent(new win.Event("click", { bubbles: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Point P is in the correct position/);
root.querySelector("#mlb-fline-draft").value =
  "The whole has five equal intervals. From zero I count two because P is at two fifths.";
root
  .querySelector("[data-fline-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Improve your explanation/);
assert.match(root.textContent, /Names the whole interval/);
root.querySelector("#mlb-fline-revision").value =
  "The denominator shows five equal intervals in one whole, and from zero P is two intervals away.";
root
  .querySelector("[data-fline-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /has 6 equal intervals/);
root.querySelector("#mlb-fline-transfer").value = "3/6";
root
  .querySelector("[data-fline-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Correct\. Now explain the new fraction independently/);
root.querySelector("#mlb-fline-transfer-explain").value =
  "The denominator is six equal intervals. From zero I count three because the point is halfway.";
root
  .querySelector("[data-fline-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /solved a new fraction-line problem independently/);
assert.match(root.textContent, /not a WIDA score or a math achievement score/);

ctx.route.mathBridge = dataBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Move observation 2/);
const moveSlider = root.querySelector("[data-data-move-value]");
assert.equal(
  moveSlider.getAttribute("type"),
  "range",
  "the data model has an accessible manipulation control",
);
moveSlider.value = "30";
moveSlider.dispatchEvent(new win.Event("input", { bubbles: true }));
assert.equal(root.querySelector("[data-data-out]").textContent, "30");
assert.match(root.querySelector(".mlb-data-stats").textContent, /After the move/);
assert.match(root.querySelector(".mlb-data-stats").textContent, /mean 10\.3.*median 4\.5/);
root.querySelector("#mlb-data-draft").value =
  "The mean and median change when the data point moves because it is far away.";
root.querySelector("#mlb-data-draft").dispatchEvent(new win.Event("input", { bubbles: true }));
const dataSaveKey = Array.from({ length: globalThis.localStorage.length }, (_, index) =>
  globalThis.localStorage.key(index),
).find((key) => key?.includes("data-center"));
assert.ok(dataSaveKey, "partial data bridge work is saved locally");
ctx.route.mathBridge = bridge;
await mount(languageStudios, ctx);
ctx.route.mathBridge = dataBridge;
({ root } = await mount(languageStudios, ctx));
assert.equal(root.querySelector("[data-data-move-value]").value, "30");
assert.match(root.querySelector("#mlb-data-draft").value, /data point moves/);
root.querySelector("#mlb-data-draft").value =
  "The mean increased more than the median when the data point moved to 30 because it is far from the other values.";
root
  .querySelector("[data-data-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Improve your explanation/);
assert.match(root.textContent, /Names mean and median/);
root.querySelector("#mlb-data-revision").value =
  "The mean increased more than the median because moving one data point far from the other values changes the total more than the middle.";
root
  .querySelector("[data-data-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Prove it with a new data set/);
root.querySelector("#mlb-data-mean").value = String(dataBridge.transferMean);
root.querySelector("#mlb-data-median").value = String(dataBridge.transferMedian);
root
  .querySelector("[data-data-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Both values are correct/);
root.querySelector("#mlb-data-transfer-explain").value =
  "The mean changes more than the median because data point 40 is far above the other values.";
root
  .querySelector("[data-data-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /solved a new statistics problem independently/);

ctx.route.mathBridge = surfaceBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Describe how the net accounts for every outside face/);
assert.match(root.textContent, /6 in²/);
root.querySelector("#mlb-draft").value =
  "The faces form three pairs because both faces count in square units.";
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Improve your explanation/);
assert.match(root.textContent, /square units/);
root.querySelector("#mlb-revision").value =
  "The surface area is 52 square inches because each of the three face areas has a matching opposite face.";
root
  .querySelector("[data-bridge-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /3 × 4 × 5/);
root.querySelector("#mlb-transfer").value = "47";
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Not yet\. Find the three face areas/);
root.querySelector("#mlb-transfer").value = "94";
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Correct\. Explain your new reasoning independently/);
root.querySelector("#mlb-transfer-explain").value =
  "The prism has three matching pairs, so I doubled each face area and added square units.";
root
  .querySelector("[data-bridge-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /Investigation complete/);
assert.match(root.textContent, /52 in²/);

ctx.route.mathBridge = pyramidBridge;
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /one square base and four matching triangles/i);
assert.match(root.textContent, /36 cm²/);
root.querySelector("#mlb-draft").value =
  "The square base is 36 square centimeters and four triangles have area 15 each because the net has four triangular faces.";
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
root.querySelector("#mlb-revision").value =
  "Surface area is one 36 square centimeter base plus four 15 square centimeter triangles because every face counts.";
root
  .querySelector("[data-bridge-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /base side 7 cm and triangle height 6 cm/);
root.querySelector("#mlb-transfer").value = "133";
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
root.querySelector("#mlb-transfer-explain").value =
  "I found the square base and four triangle areas, so I added all five faces.";
root
  .querySelector("[data-bridge-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, ctx));
assert.match(root.textContent, /96 cm²/);

const tryRoot = document.createElement("div");
const tryCtx = {
  skill: getSkill(5, "fraction-of"),
  item: { question: "previous practice item" },
  tryCount: 0,
  id: "fraction-bridge-check",
  key: "5:fraction-of",
  level: 0,
  indep: 0,
  tryNeedsIndependent: false,
  lang: () => "en",
  mark() {},
  say() {},
  refreshRail() {},
  showModel() {},
};
mountTry(tryCtx, tryRoot);
const generatedFractionPrompt = tryRoot.querySelector("[data-problem]").textContent;
const fractionParts = generatedFractionPrompt.match(/^What is (\d+)\/(\d+) of (\d+)\?$/);
assert.ok(
  fractionParts,
  `fraction-of practice makes a model-aware prompt: ${generatedFractionPrompt}`,
);
const [, fn, fd, fw] = fractionParts;
const fractionAnswer = (Number(fn) * Number(fw)) / Number(fd);
tryRoot.querySelector("input").value = String(fractionAnswer);
tryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const fractionLink = tryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(
  fractionLink,
  "correct independent fraction-of practice offers the paired language activity",
);
assert.equal(readBridgeV2(new URL(fractionLink.href).searchParams)?.task, "fraction-of-whole");
assert.deepEqual([...new URL(fractionLink.href).searchParams.keys()].sort(), [
  "denominator",
  "grade",
  "numerator",
  "schema",
  "task",
  "whole",
]);

const numberLineSkill = getSkill(3, "fraction-line");
const originalNumberLineNow = Date.now;
Date.now = () => 317;
const numberLineTryRoot = document.createElement("div");
const numberLineTryCtx = {
  ...tryCtx,
  skill: numberLineSkill,
  item: { question: "earlier fraction-line practice" },
  tryCount: 0,
  id: "fraction-line-bridge-check",
  key: "3:fraction-line",
};
mountTry(numberLineTryCtx, numberLineTryRoot);
Date.now = originalNumberLineNow;
const numberLinePrompt = numberLineTryRoot.querySelector("[data-problem]").textContent;
const fractionAtMark = numberLinePrompt.match(
  /cut into (\d+) equal parts\. Point P is at mark (\d+)/,
);
const markForFraction = numberLinePrompt.match(/point (\d+)\/(\d+)\? Count from 0/);
assert.ok(
  fractionAtMark || markForFraction,
  `number-line prompt is recognized: ${numberLinePrompt}`,
);
numberLineTryRoot.querySelector("input").value = fractionAtMark
  ? `${fractionAtMark[2]}/${fractionAtMark[1]}`
  : markForFraction[1];
numberLineTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const numberLineLink = numberLineTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(
  numberLineLink,
  "fraction number-line practice offers a paired Language Page explanation",
);
assert.equal(readBridgeV2(new URL(numberLineLink.href).searchParams)?.task, "fraction-number-line");

const dataSkill = getSkill(7, "probability");
const dataProblem = generateProblem(dataSkill, seededRandom(982));
assert.match(dataProblem.question, /^Find the (mean|median):/);
const originalNow = Date.now;
Date.now = () => 5;
const dataTryRoot = document.createElement("div");
const dataTryCtx = {
  ...tryCtx,
  skill: dataSkill,
  item: { question: "earlier statistics practice" },
  tryCount: 0,
  id: "data-bridge-check",
  key: "7:probability",
};
mountTry(dataTryCtx, dataTryRoot);
Date.now = originalNow;
assert.equal(dataTryRoot.querySelector("[data-problem]").textContent, dataProblem.question);
dataTryRoot.querySelector("input").value = dataProblem.displayAnswer;
dataTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const dataLink = dataTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(dataLink, "independent statistics practice offers a paired Language Page investigation");
const dataLinkParams = new URL(dataLink.href).searchParams;
assert.equal(readBridgeV2(dataLinkParams)?.task, "data-center");
assert.deepEqual([...dataLinkParams.keys()].sort(), ["grade", "schema", "task", "values"]);

const surfaceSkill = getSkill(6, "surface-area-nets");
const originalSurfaceNow = Date.now;
let surfaceTryRoot;
let surfaceQuestion = "";
for (let seed = 0; seed < 50 && !surfaceQuestion.includes("rectangular prism"); seed += 1) {
  Date.now = () => seed * 1237;
  surfaceTryRoot = document.createElement("div");
  mountTry(
    {
      ...tryCtx,
      skill: surfaceSkill,
      item: { question: "earlier surface area practice" },
      id: `surface-area-bridge-check-${seed}`,
      key: "6:surface-area-nets",
    },
    surfaceTryRoot,
  );
  surfaceQuestion = surfaceTryRoot.querySelector("[data-problem]").textContent;
}
Date.now = originalSurfaceNow;
const dims = surfaceQuestion.match(
  /rectangular prism that is (\d+) in long, (\d+) in wide and (\d+) in tall/,
);
assert.ok(dims, `prism practice prompt found: ${surfaceQuestion}`);
const [, length, width, height] = dims;
const [l, w, h] = [length, width, height].map(Number);
surfaceTryRoot.querySelector("input").value = String(2 * (l * w + l * h + w * h));
surfaceTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const surfaceLink = surfaceTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(surfaceLink, "surface-area practice links directly to its paired language investigation");
assert.equal(readBridgeV2(new URL(surfaceLink.href).searchParams)?.task, "surface-area-prism");

let pyramidTryRoot;
let pyramidQuestion = "";
for (let seed = 0; seed < 50 && !pyramidQuestion.includes("square pyramid"); seed += 1) {
  Date.now = () => seed * 1237;
  pyramidTryRoot = document.createElement("div");
  mountTry(
    {
      ...tryCtx,
      skill: surfaceSkill,
      item: { question: "earlier pyramid surface area practice" },
      id: `surface-area-pyramid-bridge-${seed}`,
      key: "6:surface-area-nets",
    },
    pyramidTryRoot,
  );
  pyramidQuestion = pyramidTryRoot.querySelector("[data-problem]").textContent;
}
Date.now = originalSurfaceNow;
const pyramidDims = pyramidQuestion.match(
  /square base with side (\d+) cm and four triangles, each with base (\d+) cm and height (\d+) cm/,
);
assert.ok(pyramidDims, `pyramid practice prompt found: ${pyramidQuestion}`);
const [, sideText, , triangleHeightText] = pyramidDims;
const pyramidSide = Number(sideText);
const pyramidTriangleHeight = Number(triangleHeightText);
pyramidTryRoot.querySelector("input").value = String(
  pyramidSide ** 2 + 2 * pyramidSide * pyramidTriangleHeight,
);
pyramidTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const pyramidLink = pyramidTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(pyramidLink, "square-pyramid practice links to the matching language investigation");
assert.equal(readBridgeV2(new URL(pyramidLink.href).searchParams)?.task, "surface-area-pyramid");

const volumeSkill = getSkill(6, "volume-fractional");
let volumeTryRoot;
let volumeQuestion = "";
for (let seed = 0; seed < 50 && !volumeQuestion.includes("rectangular prism"); seed += 1) {
  Date.now = () => seed * 1237;
  volumeTryRoot = document.createElement("div");
  mountTry(
    {
      ...tryCtx,
      skill: volumeSkill,
      item: { question: "fractional volume practice" },
      id: `fractional-volume-bridge-${seed}`,
      key: "6:volume-fractional",
    },
    volumeTryRoot,
  );
  volumeQuestion = volumeTryRoot.querySelector("[data-problem]").textContent;
}
Date.now = originalSurfaceNow;
const volumeState = (await import("../math/fluency-lab/studio/sims.js")).SIMS.volumeFractional.init(
  { item: { question: volumeQuestion } },
);
const volumeAnswer = (volumeState.a * volumeState.b * volumeState.c) / 8;
volumeTryRoot.querySelector("input").value = String(volumeAnswer);
volumeTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const volumeLink = volumeTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(volumeLink, "fractional-volume practice links to its paired Language Page investigation");
const volumeBridge = readBridgeV2(new URL(volumeLink.href).searchParams);
assert.equal(volumeBridge.task, "fractional-volume");
assert.deepEqual(
  [volumeBridge.lengthHalves, volumeBridge.widthHalves, volumeBridge.heightHalves],
  [volumeState.a, volumeState.b, volumeState.c],
);

const volumeCtx = makeCtx("language-studios");
volumeCtx.route.mathBridge = volumeBridge;
({ root } = await mount(languageStudios, volumeCtx));
assert.match(root.textContent, /Build volume from half-foot cubes/);
assert.match(root.textContent, /one eighth of a cubic foot/);
root.querySelector("#mlb-draft").value =
  "I multiplied length, width, and height because each half-foot cube is one eighth ft³, so volume uses cubic feet.";
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, volumeCtx));
assert.match(root.textContent, /Improve your explanation/);
root.querySelector("#mlb-revision").value =
  "The dimensions count half-foot cubes in each layer and height counts layers, so the product is cubic feet.";
root
  .querySelector("[data-bridge-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, volumeCtx));
assert.match(root.textContent, /new prism/);
root.querySelector("#mlb-transfer").value = String(volumeBridge.transferCubicFeet);
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, volumeCtx));
assert.match(root.textContent, /Correct\. Explain your new reasoning independently/);
root.querySelector("#mlb-transfer-explain").value =
  "I multiplied all three dimensions because each dimension counts equal half-foot lengths, so the result is cubic feet.";
root
  .querySelector("[data-bridge-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, volumeCtx));
assert.match(root.textContent, /Investigation complete/);
assert.match(root.textContent, /not an official WIDA score/);

const divisionSkill = getSkill(6, "divide-fractions");
let divisionTryRoot;
let divisionQuestion = "";
for (let seed = 0; seed < 50 && !divisionQuestion.includes(" ÷ "); seed += 1) {
  Date.now = () => seed * 1901;
  divisionTryRoot = document.createElement("div");
  mountTry(
    {
      ...tryCtx,
      skill: divisionSkill,
      item: { question: "earlier fraction-division problem" },
      id: `fraction-division-bridge-${seed}`,
      key: "6:divide-fractions",
    },
    divisionTryRoot,
  );
  divisionQuestion = divisionTryRoot.querySelector("[data-problem]").textContent;
}
Date.now = originalSurfaceNow;
const divisionParts = divisionQuestion.match(/^(\d+)\/(\d+) ÷ (\d+)\/(\d+) = \?$/u);
assert.ok(divisionParts, `fraction-division question found: ${divisionQuestion}`);
const [, da, db, dc, dd] = divisionParts.map(Number);
const divisionGcd = (a, b) => (b ? divisionGcd(b, a % b) : a);
const divisionCommon = divisionGcd(da * dd, db * dc);
const divisionAnswer = `${(da * dd) / divisionCommon}/${(db * dc) / divisionCommon}`;
divisionTryRoot.querySelector("input").value = divisionAnswer;
divisionTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const divisionLink = divisionTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(
  divisionLink,
  "fraction-division practice links to its paired Language Page investigation",
);
const divisionBridge = readBridgeV2(new URL(divisionLink.href).searchParams);
assert.equal(divisionBridge.task, "fraction-division");
assert.deepEqual(
  [
    divisionBridge.dividendNumerator,
    divisionBridge.dividendDenominator,
    divisionBridge.divisorNumerator,
    divisionBridge.divisorDenominator,
  ],
  [da, db, dc, dd],
);

const unitDivisionSkill = getSkill(5, "unit-fraction-division");
let unitDivisionTryRoot;
let unitDivisionQuestion = "";
for (
  let seed = 0;
  seed < 50 &&
  !unitDivisionQuestion.includes("servings") &&
  !unitDivisionQuestion.includes("students");
  seed += 1
) {
  Date.now = () => seed * 2713;
  unitDivisionTryRoot = document.createElement("div");
  mountTry(
    {
      ...tryCtx,
      skill: unitDivisionSkill,
      item: { question: "earlier unit-fraction division problem" },
      id: `unit-fraction-division-bridge-${seed}`,
      key: "5:unit-fraction-division",
    },
    unitDivisionTryRoot,
  );
  unitDivisionQuestion = unitDivisionTryRoot.querySelector("[data-problem]").textContent;
}
Date.now = originalSurfaceNow;
const sharingQuestion = unitDivisionQuestion.match(
  /ribbon that is 1\/(\d+) meter long is shared equally by (\d+) students/u,
);
const groupQuestion = unitDivisionQuestion.match(
  /jug holds (\d+) liters\. How many 1\/(\d+)-liter servings/u,
);
assert.ok(
  sharingQuestion || groupQuestion,
  `unit-fraction question found: ${unitDivisionQuestion}`,
);
const unitDivisionAnswer = sharingQuestion
  ? `1/${Number(sharingQuestion[1]) * Number(sharingQuestion[2])}`
  : String(Number(groupQuestion[1]) * Number(groupQuestion[2]));
unitDivisionTryRoot.querySelector("input").value = unitDivisionAnswer;
unitDivisionTryRoot
  .querySelector("[data-form]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
const unitDivisionLink = unitDivisionTryRoot.querySelector(".sd-math-language-bridge a");
assert.ok(
  unitDivisionLink,
  "unit-fraction division practice links to the same paired investigation",
);
assert.equal(readBridgeV2(new URL(unitDivisionLink.href).searchParams)?.task, "fraction-division");

function solveEquationPrompt(question) {
  let match = question.match(/^x \+ (\d+) = (-?\d+)\. Find x\.$/u);
  if (match) return Number(match[2]) - Number(match[1]);
  match = question.match(/^x − (\d+) = (-?\d+)\. Find x\.$/u);
  if (match) return Number(match[2]) + Number(match[1]);
  match = question.match(/^(\d+)x = (-?\d+)\. Find x\.$/u);
  if (match) return Number(match[2]) / Number(match[1]);
  match = question.match(/^x ÷ (\d+) = (-?\d+)\. Find x\.$/u);
  if (match) return Number(match[2]) * Number(match[1]);
  match = question.match(/^(\d+)x ([+−]) (\d+) = (-?\d+)\. Find x\.$/u);
  if (match)
    return (Number(match[4]) - Number(match[3]) * (match[2] === "−" ? -1 : 1)) / Number(match[1]);
  return null;
}

async function verifyEquationSkill(skill, grade, twoStep) {
  let equationTryRoot = null;
  let equationQuestion = "";
  const originalNow = Date.now;
  for (let seed = 1; seed < 80; seed += 1) {
    Date.now = () => seed * 2713;
    equationTryRoot = document.createElement("div");
    mountTry(
      {
        ...tryCtx,
        skill,
        item: { question: "previous equation problem" },
        id: `equation-bridge-${grade}-${seed}`,
        key: `${grade}:${skill.id}`,
      },
      equationTryRoot,
    );
    equationQuestion = equationTryRoot.querySelector("[data-problem]").textContent;
    const wantsTwoStep = /^\d+x [+−] \d+ = -?\d+\. Find x\.$/u.test(equationQuestion);
    if (wantsTwoStep === twoStep && solveEquationPrompt(equationQuestion) !== null) break;
    equationTryRoot = null;
  }
  Date.now = originalNow;
  assert.ok(
    equationTryRoot,
    `generated ${twoStep ? "two-step" : "one-step"} equation for grade ${grade}`,
  );
  equationTryRoot.querySelector("input").value = String(solveEquationPrompt(equationQuestion));
  equationTryRoot
    .querySelector("[data-form]")
    .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
  const link = equationTryRoot.querySelector(".sd-math-language-bridge a");
  assert.ok(link, `grade ${grade} equation practice links to the Language Page`);
  const parsed = readBridgeV2(new URL(link.href).searchParams);
  assert.equal(parsed?.task, "equation-balance");
  assert.equal(parsed?.grade, grade);
  if (twoStep) assert.equal(parsed?.form, "two-step");
  else assert.ok(["add", "subtract", "multiply", "divide"].includes(parsed.form));
  return parsed;
}

await verifyEquationSkill(getSkill(6, "one-step"), 6, false);
const twoStepEquation = await verifyEquationSkill(getSkill(7, "equations"), 7, true);
assert.equal(twoStepEquation.form, "two-step");

const divisionCtx = makeCtx("language-studios");
divisionCtx.route.mathBridge = fractionDivisionBridge;
({ root } = await mount(languageStudios, divisionCtx));
assert.doesNotMatch(
  root.textContent,
  /\[object Object\]/,
  "safe HTML breadcrumbs render as markup, not an object string",
);
assert.match(root.textContent, /Compare equal-sized pieces/);
assert.match(root.textContent, /Reciprocal connection/);
root.querySelector("#mlb-draft").value =
  "The dividend is 2/3 and the divisor is 1/6. Equal-sized pieces show four groups because I multiply by the reciprocal and check by multiplying the quotient back.";
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, divisionCtx));
assert.match(root.textContent, /Improve your explanation/);
root.querySelector("#mlb-revision").value =
  "The dividend has four sixths and one group uses one sixth, so four groups fit. I multiply by six and check 4 × 1/6 = 2/3.";
root
  .querySelector("[data-bridge-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, divisionCtx));
assert.match(root.textContent, /3\/3 ÷ 1\/6/);
root.querySelector("#mlb-transfer").value = "6";
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, divisionCtx));
assert.match(root.textContent, /Correct\. Explain your new reasoning independently/);
root.querySelector("#mlb-transfer-explain").value =
  "Six sixths fit into three thirds because each group uses one sixth.";
root
  .querySelector("[data-bridge-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, divisionCtx));
assert.match(root.textContent, /Investigation complete/);
assert.match(root.textContent, /not an official WIDA score/);

const equationUrl = new URL(
  createEquationBalanceExplanationUrl({ form: "add", amount: 7, result: 19, grade: 6 }),
);
const equationBridge = readBridgeV2(equationUrl.searchParams);
const equationCtx = makeCtx("language-studios");
equationCtx.route.mathBridge = equationBridge;
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /Balance both sides/);
assert.match(root.textContent, /x \+ 7/);
assert.ok(
  root.querySelector(".mlb-equation-scale svg"),
  "Language Page reuses Fluency Lab's balance-scale drawing",
);
root.querySelector("#mlb-draft").value =
  "The equation stays equal because I subtract 7 from both sides.";
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /Use an inverse operation on both sides/);
root.querySelector('[data-equation-action="one-side"]').click();
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /breaks the equality/);
root.querySelector('[data-equation-action="correct"]').click();
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /x = 12/);
root
  .querySelector("[data-bridge-draft]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /Improve your explanation/);
assert.match(root.textContent, /balance on both sides/);
root.querySelector("#mlb-revision").value =
  "I subtract 7 from both sides, so x is 12. Substitution checks the equation because 12 + 7 = 19.";
root
  .querySelector("[data-bridge-revision]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /Solve x \+ 7 = 20/);
root.querySelector("#mlb-transfer").value = "13";
root
  .querySelector("[data-bridge-transfer]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /Correct\. Explain how you solved this new equation independently/);
root.querySelector("#mlb-transfer-explain").value =
  "I subtract 7 from both sides because that is the inverse. Substituting 13 gives 20.";
root
  .querySelector("[data-bridge-transfer-explain]")
  .dispatchEvent(new win.Event("submit", { bubbles: true, cancelable: true }));
({ root } = await mount(languageStudios, equationCtx));
assert.match(root.textContent, /You used a balance model/);
assert.match(root.textContent, /Names the unknown/);

const twoStepCtx = makeCtx("language-studios");
twoStepCtx.route.mathBridge = twoStepEquation;
({ root } = await mount(languageStudios, twoStepCtx));
root.querySelector('[data-equation-action="same-wrong"]').click();
({ root } = await mount(languageStudios, twoStepCtx));
assert.match(root.textContent, /does not undo the operation/);
root.querySelector('[data-equation-action="correct"]').click();
({ root } = await mount(languageStudios, twoStepCtx));
assert.ok(
  root.querySelector(".mlb-equation-scale svg"),
  "the shared scale remains visible after an equation move",
);
assert.equal(
  root.querySelector(".mlb-equation-display span strong")?.textContent,
  `${twoStepEquation.amount}x`,
);
assert.equal(
  root.querySelectorAll(".mlb-equation-display span strong")[1]?.textContent,
  String(twoStepEquation.result - twoStepEquation.shift),
);
root.querySelector('[data-equation-action="correct"]').click();
({ root } = await mount(languageStudios, twoStepCtx));
assert.ok(root.textContent.includes(`x = ${twoStepEquation.solution}`));

console.log(
  "math-language-bridge: versioned task context, equation balance, separate evidence, supports, and transfer passed.",
);
