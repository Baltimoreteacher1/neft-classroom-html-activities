import assert from "node:assert/strict";
import test from "node:test";
import {
  ARCHITECT_KERNELS,
  BRIDGE_SAMPLES,
  SPEAKING_PROMPTS,
} from "../access-practice-lab/src/platform/data/platformData.js";
import {
  analyzeL1Transfer,
  analyzeStudentRadar,
  evaluateSentenceArchitecture,
  evaluateSpeakingResponse,
  generateDomainSprint,
  scanLessonText,
} from "../access-practice-lab/src/platform/services/intelligenceAdapter.js";
import {
  clearPlatformStorage,
  readStorage,
  SCHEMA_VERSION,
  STORAGE_KEYS,
  sanitizeAlias,
  writeStorage,
} from "../access-practice-lab/src/platform/services/storageService.js";
import {
  createStateMachine,
  STATES,
} from "../access-practice-lab/src/platform/state/stateMachine.js";

test("storageService: schemaVersion 1, safe fallback, and zero-PII sanitizeAlias", () => {
  clearPlatformStorage();
  const prefs = readStorage(STORAGE_KEYS.PREFS);
  assert.equal(prefs.schemaVersion, SCHEMA_VERSION);
  // Unset until the switch is pressed: src/platform/role.js resolves it (a choice, then the door, then Student).
  // It used to default to "teacher" for everyone, so a student's first page showed the Teacher view pressed.
  assert.equal(prefs.role, "");

  writeStorage(STORAGE_KEYS.PREFS, { ...prefs, role: "student", l1: "ar" });
  const updated = readStorage(STORAGE_KEYS.PREFS);
  assert.equal(updated.role, "student");
  assert.equal(updated.l1, "ar");

  assert.equal(sanitizeAlias("Maya Rodriguez"), "Maya R.");
  assert.equal(sanitizeAlias("student@school.org"), "Student A");
  assert.equal(sanitizeAlias("Amira"), "Amira");
});

test("stateMachine: deterministic lifecycle IDLE -> ACTIVE -> EVALUATING -> FEEDBACK -> COMPLETE", () => {
  const sm = createStateMachine("TestModule");
  assert.equal(sm.state, STATES.IDLE);
  assert.equal(sm.transition(STATES.COMPLETE), false); // blocked jump
  assert.equal(sm.transition(STATES.ACTIVE), true);
  assert.equal(sm.transition(STATES.EVALUATING), true);
  assert.equal(sm.transition(STATES.FEEDBACK), true);
  assert.equal(sm.transition(STATES.COMPLETE), true);
  sm.reset();
  assert.equal(sm.state, STATES.IDLE);
});

test("intelligenceAdapter: Content-to-Language Bridge scanner & L1 transfer", () => {
  const sci = BRIDGE_SAMPLES.find((s) => s.id === "sci-g6-ecosystems");
  const scan = scanLessonText(sci.text, "es");
  assert.ok(scan.polysemousHits.some((h) => h.word === "table"));
  assert.ok(scan.connectorHits.some((h) => h.word === "consequently"));
  assert.ok(scan.syntaxHits.length >= 1);
  assert.ok(scan.cognateHits.some((c) => c.word === "ecosystem"));
  assert.equal(scan.scaffolds.level12.frames.length, 2);

  const k2 = BRIDGE_SAMPLES.find((s) => s.id === "k2-sci-living");
  assert.ok(k2);
  const k2Scan = scanLessonText(k2.text, "es");
  assert.ok(k2Scan.connectorHits.some((h) => h.word === "because"));

  const esFindings = analyzeL1Transfer("Is raining outside.", "es");
  assert.ok(esFindings.some((f) => f.pattern.includes("Pronoun Drop")));

  const zhFindings = analyzeL1Transfer("Because it rained, so the plant grew.", "zh");
  assert.ok(zhFindings.some((f) => f.pattern.includes("Paired Conjunction")));
});

test("intelligenceAdapter: Sentence Architect & Speaking Simulator", () => {
  const kernel = ARCHITECT_KERNELS.find((k) => k.id === "explain-plant");
  const baseEval = evaluateSentenceArchitecture(kernel, {});
  assert.equal(baseEval.level, 1);

  const fullPlaced = Object.fromEntries(kernel.blocks.map((b) => [b.slot, b]));
  const fullEval = evaluateSentenceArchitecture(kernel, fullPlaced);
  assert.equal(fullEval.level, 5);
  assert.ok(fullEval.sentence.includes("photosynthesis"));

  const k2Kernel = ARCHITECT_KERNELS.find((k) => k.id === "k2-seed-grew");
  assert.ok(k2Kernel);

  const sp = SPEAKING_PROMPTS.find((p) => p.id === "speak-ecosystem");
  const indEval = evaluateSpeakingResponse(sp, sp.modelSample, []);
  assert.equal(indEval.lifelineTier, "Independent");
  assert.ok(indEval.band >= 4);

  const scafEval = evaluateSpeakingResponse(sp, sp.modelSample, ["starter", "wordbank"]);
  assert.equal(scafEval.lifelineTier, "Heavily Scaffolded");

  const k2Sp = SPEAKING_PROMPTS.find((p) => p.id === "k2-weather");
  assert.ok(k2Sp);
});

test("intelligenceAdapter: Reclassification Radar bubble detection & 4-week sprint", () => {
  const maya = analyzeStudentRadar({
    id: "stu-1",
    alias: "Maya R.",
    grade: "6",
    l1: "es",
    listening: 4.8,
    speaking: 3.9,
    reading: 4.6,
    writing: 4.1,
    threshold: 4.5,
  });
  assert.equal(maya.isBubble, true);
  assert.equal(maya.bottleneck.label, "Speaking");

  const sprint = generateDomainSprint(maya);
  assert.equal(sprint.bottleneckDomain, "Speaking");
  assert.equal(sprint.weeks.length, 4);
});

test("all 6 platform views return non-empty html from render()", async () => {
  if (typeof globalThis.location === "undefined") {
    globalThis.location = {
      origin: "https://thelanguagepage.com",
      pathname: "/access-practice-lab/",
      search: "",
      href: "https://thelanguagepage.com/access-practice-lab/",
    };
  }
  const { toHtml } = await import("../access-practice-lab/src/util.js");
  const views = await Promise.all([
    import("../access-practice-lab/src/platform/views/bridge.js"),
    import("../access-practice-lab/src/platform/views/architect.js"),
    import("../access-practice-lab/src/platform/views/simulator.js"),
    import("../access-practice-lab/src/platform/views/radar.js"),
    import("../access-practice-lab/src/platform/views/familyBridge.js"),
  ]);
  const fakeCtx = { band: "6-8", route: {}, prefs: {}, rerender: () => {} };
  for (const v of views) {
    const out = await v.render(fakeCtx);
    assert.ok(out.html, "render() must return .html property");
    const rendered = toHtml(out.html);
    assert.ok(rendered.includes('class="tlp-page"'), "rendered HTML must include .tlp-page");
  }
});
