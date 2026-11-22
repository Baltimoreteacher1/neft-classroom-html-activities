// Teacher-authored and previously compiled experiences must be unaffected by generator / validator upgrades.
// tools/fixtures/lp-sim-saved-experience.v1.json is a compiled experience and a half-played save, frozen BEFORE the
// template and quality-rule upgrades. Nothing here migrates it: it must validate, restore, play and publish as saved.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { compileExperience, studentCopy } from "../access-practice-lab/src/compiler/compile.js";
import { reachOutcomes } from "../access-practice-lab/src/compiler/play.js";
import {
  SAMPLE_SETTINGS,
  SAMPLE_TEXT,
  SAMPLE_TITLE,
} from "../access-practice-lab/src/compiler/sample-ecosystem.js";
import {
  DRAFTS_KEY,
  getDraft,
  loadDrafts,
  saveDraft,
} from "../access-practice-lab/src/compiler/store.js";
import {
  MAX_EVIDENCE_WORDS,
  validateExperience,
} from "../access-practice-lab/src/compiler/validate.js";
import { act, restore, validActions } from "../access-practice-lab/src/sim/runtime.js";
import { validateMission } from "../access-practice-lab/src/sim/schema.js";

const fixture = JSON.parse(
  readFileSync(new URL("./fixtures/lp-sim-saved-experience.v1.json", import.meta.url), "utf8"),
);
const clone = (x) => JSON.parse(JSON.stringify(x));
const codes = (r) => [...r.errors, ...r.warnings].map((f) => f.code);

test("an experience saved before the upgrades still validates with no errors and no new warnings", () => {
  const report = validateExperience(fixture.def);
  assert.equal(report.ok, true, JSON.stringify(report.errors));
  assert.deepEqual(codes(report), []);
});

test("its text is untouched: the saved definition keeps its authored wording (no silent migration)", () => {
  const decide = fixture.def.tasks.find((t) => t.type === "decide");
  assert.ok(
    decide.options.every((o) => o.reply[0] === "Noted. Now make sure your evidence supports it."),
  );
  const draftStore = {};
  const io = { read: () => draftStore[DRAFTS_KEY], write: (k, v) => ((draftStore[k] = v), true) };
  assert.ok(saveDraft(fixture.key, { def: fixture.def }, io));
  assert.deepEqual(getDraft(fixture.key, io.read).def, fixture.def);
  assert.deepEqual(Object.keys(loadDrafts(io.read)), [fixture.key]);
});

test("a half-played save restores byte-for-byte and play continues to an ending", () => {
  const saved = clone(fixture.savedMidway);
  assert.deepEqual(restore(fixture.def, saved), saved);
  const reach = reachOutcomes(fixture.def);
  assert.equal(reach.completable, true, JSON.stringify(reach.runs.map((r) => r.stuck)));
  assert.ok(
    Object.values(reach.outcomes).some((o) => o.reachable),
    "a scripted learner reaches an ending",
  );
  // The restored save is a valid state to act from: the runtime accepts a next action without error.
  const next = validActions(fixture.def, restore(fixture.def, saved))[0];
  assert.equal(act(fixture.def, restore(fixture.def, saved), next).error, undefined);
});

test("the student copy a class server stores still passes the server's own validateMission", () => {
  const copy = studentCopy(fixture.def, {});
  assert.equal(validateMission(copy).ok, true);
  assert.equal(copy.compiled, undefined);
});

test("new compiles inherit the upgraded wording; the frozen fixture does not", () => {
  const fresh = compileExperience({
    source: { title: SAMPLE_TITLE, text: SAMPLE_TEXT },
    settings: SAMPLE_SETTINGS,
    id: "xfixture001",
  });
  assert.equal(fresh.ok, true);
  const decide = fresh.def.tasks.find((t) => t.type === "decide");
  for (const o of decide.options) {
    assert.match(o.reply[0], /which evidence points toward it/);
    assert.match(o.reply[1], /qué evidencia apunta/);
  }
  assert.deepEqual(codes(fresh.report), []);
  assert.notDeepEqual(fresh.def.tasks, fixture.def.tasks);
});

test("answer-key contradictions and duplicate choices are errors with a clear message", () => {
  const def = clone(fixture.def);
  const ev = def.evidence.find((e) => (e.supports || []).length);
  ev.contradicts = [...ev.supports];
  const decide = def.tasks.find((t) => t.type === "decide");
  decide.options[1].label = [...decide.options[0].label];
  const report = validateExperience(def);
  assert.equal(report.ok, false);
  const found = report.errors.map((e) => e.code);
  assert.ok(
    found.includes("contradictory-key") && found.includes("duplicate-option"),
    found.join(),
  );
  assert.ok(
    report.errors.every((e) => e.text[0] && e.text[1]),
    "every finding is bilingual",
  );
});

test("language-load and missing-feedback findings are warnings the instructor can overrule", () => {
  const def = clone(fixture.def);
  const ev = def.evidence[0];
  ev.body[0] =
    Array(MAX_EVIDENCE_WORDS + 5)
      .fill("water")
      .join(" ") + ".";
  const decide = def.tasks.find((t) => t.type === "decide");
  delete decide.options[0].reply;
  def.characters[0].topics[0].answer = ["Yes.", "Sí."];
  def.characters[0].topics[1].ask = [...def.characters[0].topics[0].ask];
  const found = validateExperience(def, { reach: false }).warnings.map((w) => w.code);
  for (const code of ["dense-evidence", "no-reply", "thin-answer", "same-question"])
    assert.ok(found.includes(code), `${code} missing from ${found.join()}`);
});
