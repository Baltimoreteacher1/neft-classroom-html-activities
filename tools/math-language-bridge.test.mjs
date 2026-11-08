import assert from "node:assert/strict";
import {
  analyzePercentExplanation,
  analyzeRatioExplanation,
  checkPercentTransfer,
  checkRatioTransfer,
  parseRatioPair,
  percentSupportForLevel,
  ratioTransferBase,
  supportForLevel,
} from "../access-practice-lab/src/studios/math-reasoning-bridge.js";
import * as languageStudios from "../access-practice-lab/src/views/language-studios.js";
import {
  createRatioExplanationUrl,
  readMathLanguageBridge,
} from "../shared/math-language-bridge/v1.js";
import {
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

console.log(
  "math-language-bridge: versioned task context, separate evidence, supports, and transfer passed.",
);
