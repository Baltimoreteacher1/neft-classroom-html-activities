import assert from "node:assert/strict";
import {
  analyzeRatioExplanation,
  checkRatioTransfer,
  parseRatioPair,
  ratioTransferBase,
  supportForLevel,
} from "../access-practice-lab/src/studios/math-reasoning-bridge.js";
import * as languageStudios from "../access-practice-lab/src/views/language-studios.js";
import {
  createRatioExplanationUrl,
  readMathLanguageBridge,
} from "../shared/math-language-bridge/v1.js";
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

console.log(
  "math-language-bridge: versioned task context, separate evidence, supports, and transfer passed.",
);
