import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { RUNTIME_CONFIG, normalizeLanguage, tutorLanguage, validateConfig } from "./runtime-config.js";
import { adaptClassroom, clusterStrategies, compileRuntime, findLesson, forkRuntime, modelReasoning, reviewLesson } from "./runtime-service.js";

const root = new URL("../../", import.meta.url).pathname;
const launchData = JSON.parse(readFileSync(join(root, "data/curriculum-launch-manifest.json"), "utf8"));
const workflow = JSON.parse(readFileSync(join(root, "data/curriculum-teacher-workflow.json"), "utf8"));
const supports = JSON.parse(readFileSync(join(root, "data/curriculum-supports.json"), "utf8"));
const lesson = findLesson(launchData.lessons, "6-13");

assert.deepEqual(RUNTIME_CONFIG.languages.map(({ code }) => code), ["en", "es"]);
assert.equal(validateConfig().length, 0);
assert.equal(normalizeLanguage("fr"), "en");
assert.equal(normalizeLanguage("es"), "es");
assert.equal(tutorLanguage("es"), "Spanish");
assert.equal(tutorLanguage("de"), "");

const runtime = compileRuntime({ lesson, workflow, supports, language: "fr", minutes: 45, intent: "Compare strategies" });
assert.equal(runtime.language, "en");
assert.equal(runtime.family, "numberTheory");
assert.equal(runtime.lab.name, "Factor Forge");
assert.equal(runtime.sequence.length, 5);
assert.equal(reviewLesson(runtime).length, 7);

assert.equal(adaptClassroom({ secure: 2, developing: 3, stuck: 5 }, runtime.guidance).level, "reteach");
assert.equal(modelReasoning("I used a factor tree because every leaf is prime.", runtime.guidance).status, "connected");
assert.deepEqual(clusterStrategies(["I drew a number line", "I used an equation"]).map(({ name }) => name), ["visual", "symbolic"]);

const fork = forkRuntime(runtime, "neighborhood garden");
assert.equal(fork.invariants.standard, runtime.invariants.standard);
assert.equal(fork.invariants.objective, runtime.invariants.objective);
assert.match(fork.lab.prompt, /neighborhood garden/);

console.log("classroom runtime service tests passed");
