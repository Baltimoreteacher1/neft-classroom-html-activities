import assert from "node:assert/strict";
import {
  analyzeDataExplanation,
  analyzeFractionExplanation,
  analyzePercentExplanation,
  analyzeRatioExplanation,
  checkDataTransfer,
  checkFractionTransfer,
  checkPercentTransfer,
  checkRatioTransfer,
  dataSupportForLevel,
  fractionSupportForLevel,
  parseRatioPair,
  percentSupportForLevel,
  ratioTransferBase,
  supportForLevel,
} from "../access-practice-lab/src/studios/math-reasoning-bridge.js";
import * as languageStudios from "../access-practice-lab/src/views/language-studios.js";
import { generateProblem, getSkill, seededRandom } from "../math/fluency-lab/problem-bank.js";
import { mountTry } from "../math/fluency-lab/studio/panel-try.js";
import {
  createRatioExplanationUrl,
  readMathLanguageBridge,
} from "../shared/math-language-bridge/v1.js";
import {
  createDataExplanationUrl,
  createFractionExplanationUrl,
  createPercentExplanationUrl,
  readMathLanguageBridge as readBridgeV2,
} from "../shared/math-language-bridge/v2.js";
import { makeCtx, mount, win } from "./lib/access-studios-dom.mjs";

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

console.log(
  "math-language-bridge: versioned task context, separate evidence, supports, and transfer passed.",
);
