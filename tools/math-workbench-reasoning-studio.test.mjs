import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = "curriculum/math-workbench";
const html = readFileSync(`${root}/index.html`, "utf8");
const dataSource = readFileSync(`${root}/reasoning-data.js`, "utf8");
const studioSource = readFileSync(`${root}/reasoning-studio.js`, "utf8");
const styleSource = readFileSync(`${root}/reasoning-studio.css`, "utf8");
const workerSource = readFileSync(`${root}/sw.js`, "utf8");

const context = { window: {} };
vm.runInNewContext(dataSource, context);
const data = context.window.MWReasoningData;

assert.ok(data, "reasoning data publishes one browser-safe source of truth");
assert.equal(Object.keys(data.SKILLS).length, 6, "six Grade 6 reasoning domains are available");
assert.deepEqual(
  Object.keys(data.STEMS.en),
  ["1", "2", "3", "4"],
  "English scaffolds cover four WIDA support levels",
);
assert.deepEqual(
  Object.keys(data.STEMS.es),
  ["1", "2", "3", "4"],
  "Spanish scaffolds cover four WIDA support levels",
);

const short = data.analyze({ skill: "ratio", response: "I divided.", representations: [] });
assert.equal(short.status, "reasoning-not-yet-visible", "short work receives a writing prompt");

const oneModel = data.analyze({
  skill: "ratio",
  response: "I multiplied the values because the relationship stays the same.",
  representations: ["equation"],
});
assert.equal(
  oneModel.status,
  "representation-connection-needed",
  "one representation triggers a connection prompt",
);

const connected = data.analyze({
  skill: "ratio",
  response:
    "For every 2 cups there are 3 batches, and I scaled both quantities because the relationship stays equivalent.",
  representations: ["ratio table", "words"],
});
assert.equal(connected.status, "connected-reasoning-visible", "connected reasoning is recognized");
assert.ok(connected.confidence < 1, "all inferences remain explicitly provisional");

for (const skill of Object.values(data.SKILLS)) {
  assert.equal("answer" in skill, false, "no hidden answer key is shipped in reasoning content");
  assert.equal("solution" in skill, false, "no hidden solution is shipped in reasoning content");
}

assert.match(html, /id="reasoningStudioBtn"/, "Workbench exposes the Reasoning Studio launch");
assert.doesNotMatch(html, /openGoogleStudioModal/, "undefined Google Studio handler is removed");
assert.match(html, /window\.MathWorkbenchAPI = Object\.freeze/, "semantic board API is present");
assert.match(html, /mwb:reasoning-stamp/, "representations can be stamped through a typed event");
assert.match(studioSource, /\/api\/reasoning\/review/, "bounded reasoning endpoint is canonical");
assert.doesNotMatch(studioSource, /answerShown\s*:/, "client never sends a hidden answer");
assert.match(studioSource, /No roster, name, or student ID/, "privacy boundary is visible");
assert.match(styleSource, /:focus-visible/, "keyboard focus receives a visible treatment");
assert.match(styleSource, /prefers-reduced-motion/, "reduced motion is respected");
assert.match(workerSource, /reasoning-studio\.js/, "offline cache includes studio logic");
assert.match(workerSource, /reasoning-data\.js/, "offline cache includes studio content");

console.log("Math Workbench Reasoning Studio: all assertions passed");
