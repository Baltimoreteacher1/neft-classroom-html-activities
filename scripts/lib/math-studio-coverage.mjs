// The Math Studio coverage audit: for every lesson, does each stage carry usable, lesson-specific content? A lesson
// passes only when every required check passes; a shell that loads is not coverage.
import { existsSync } from "node:fs";
import { join } from "node:path";
import { controls, evaluate } from "../../curriculum/learning-labs/shared/math.mjs";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const PLACEHOLDER = /\b(TODO|TBD|FIXME|XXX)\b|lorem ipsum|coming soon/; // case-sensitive: Spanish "todo" is a word
const onDisk = (url) => {
  const p = url.split(/[?#]/)[0].replace(/^\//, "");
  return existsSync(join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p));
};
function itemProblems(it) {
  const p = [];
  if (!it.prompt) p.push(`${it.id}: no prompt`);
  if (
    it.kind === "mc" &&
    !(
      Array.isArray(it.choices) &&
      it.choices.length >= 2 &&
      Number.isInteger(it.correct) &&
      it.correct < it.choices.length
    )
  )
    p.push(`${it.id}: bad choices/key`);
  if (it.kind === "num" && !Number.isFinite(it.answer)) p.push(`${it.id}: no numeric answer`);
  if (it.kind === "ea" && !(it.steps?.length >= 2 && it.errorStep < it.steps.length))
    p.push(`${it.id}: bad error step`);
  if (!["mc", "num", "ea"].includes(it.kind)) p.push(`${it.id}: unknown kind ${it.kind}`);
  if (!it.explanation) p.push(`${it.id}: no explanation for the worked example`);
  return p;
}

/** One lesson's checks: { stage: [problems] } plus warnings that do not fail. */
export function auditLesson(L, manifestLesson) {
  const fail = {
    registry: [],
    explore: [],
    understand: [],
    practice: [],
    apply: [],
    reflect: [],
    routes: [],
  };
  const warn = [];
  if (!manifestLesson) fail.registry.push("not in the curriculum manifest");
  else if (manifestLesson.unit !== L.unit)
    fail.registry.push(`unit ${L.unit} != manifest unit ${manifestLesson.unit}`);
  if (!L.objective) fail.registry.push("no learning objective");
  if (!L.lab?.lessons?.includes(L.id)) fail.explore.push("the lab does not list this lesson");
  try {
    const fields = controls(L.lab.model);
    if (fields.length !== L.lab.model.values.length)
      fail.explore.push("model values do not match its controls");
    if (!Number.isFinite(evaluate(L.lab.model, L.lab.model.values).value))
      fail.explore.push("model does not evaluate");
  } catch (e) {
    fail.explore.push(`model error: ${e.message}`);
  }
  if (!(L.explore?.investigate || L.lab?.investigate)?.length)
    fail.explore.push("no investigation prompts");
  if (L.explore && !(L.explore.title && L.explore.guide?.length === 2))
    fail.explore.push("own Explore model needs a title and two guide lines");
  if (L.explore?.kind === "stat-question" && (L.explore.cards || []).length < 4)
    fail.explore.push("statistical-question explorer needs at least 4 cards");
  const u = L.understand || {};
  if (!u.iDo?.lines?.length) fail.understand.push("no worked example");
  if (!u.keyIdea && !u.intro) fail.understand.push("no conceptual explanation");
  if (!u.vocabulary?.length) warn.push("understand: no vocabulary");
  if (!u.mistake) warn.push("understand: no common-mistake note");
  for (const level of ["regular", "challenge"]) {
    const items = L.practice?.[level] || [];
    const min = level === "regular" ? 4 : 3;
    if (items.length < min) fail.practice.push(`${level}: ${items.length} items (need ${min})`);
    for (const it of items) fail.practice.push(...itemProblems(it));
    if (!onDisk(L.practice.urls[level]))
      fail.routes.push(`${level} studio missing: ${L.practice.urls[level]}`);
  }
  const ids = [...L.practice.regular, ...L.practice.challenge].map((i) => i.id);
  if (new Set(ids).size !== ids.length) fail.practice.push("duplicate item ids");
  const a = L.apply || {};
  const tasks = [a.wordProblem, a.scenario, L.lab?.create, a.reasoning].filter(Boolean).length;
  if (tasks < 2) fail.apply.push(`${tasks} application tasks (need 2)`);
  const r = L.reflect || {};
  if (!r.checks?.length) fail.reflect.push("no independent check");
  for (const it of r.checks || []) fail.reflect.push(...itemProblems(it));
  if (r.checks?.length < 2)
    warn.push("reflect: only one independent check (no fresh transfer item)");
  if (!r.errorAnalysis) warn.push("reflect: no error-analysis item");
  if (!onDisk(L.lab.href)) fail.routes.push(`lab missing: ${L.lab.href}`);
  // Spanish fields are skipped: "TODO" is emphatic Spanish ("TODO el molde"), not a to-do.
  const text = JSON.stringify(L, (k, v) => (k.endsWith("Es") ? undefined : v));
  if (PLACEHOLDER.test(text)) fail.registry.push(`placeholder text: ${PLACEHOLDER.exec(text)[0]}`);
  const handoffs = ids.length
    ? [...L.practice.regular, ...L.practice.challenge].filter((i) => i.model).length
    : 0;
  if (!handoffs)
    warn.push("no practice item with a verified model hand-off (model -> practice still works)");
  const failures = Object.entries(fail).flatMap(([k, v]) => v.map((x) => `${k}: ${x}`));
  return {
    id: L.id,
    pass: failures.length === 0,
    failures,
    warnings: warn,
    handoffs,
    items: ids.length,
  };
}

export function coverageReport(lessons, manifest, skipped) {
  const byId = new Map(manifest.lessons.map((l) => [l.id, l]));
  const results = lessons.map((L) => auditLesson(L, byId.get(L.id)));
  const labLessons = new Map();
  for (const L of lessons) labLessons.set(L.lab.id, [...(labLessons.get(L.lab.id) || []), L.id]);
  const passed = results.filter((r) => r.pass).length;
  const lines = [
    "# Math Studio coverage",
    "",
    "Generated by `node scripts/generate-math-studio.mjs`. Do not edit by hand.",
    "",
    `**${passed} of ${results.length} in-scope lessons pass every required check.** ${skipped.length} lessons are out of scope (listed at the end).`,
    "",
    `Practice items: ${results.reduce((a, r) => a + r.items, 0)} · items with a verified model hand-off: ${results.reduce((a, r) => a + r.handoffs, 0)} · lessons with at least one: ${results.filter((r) => r.handoffs).length}`,
    "",
    "Required per lesson: registry entry in the right unit with an objective; a Learning Lab model that evaluates, with investigation prompts; a worked example and a conceptual explanation; at least 4 Regular and 3 Challenge items, each with a key and a worked explanation; both full practice studios on disk; at least 2 application tasks; at least one independent Reflect check; every linked route on disk; no placeholder text.",
    "",
    "| Lesson | Result | Items | Model hand-offs | Notes |",
    "| --- | --- | --- | --- | --- |",
    ...results.map(
      (r) =>
        `| ${r.id} | ${r.pass ? "PASS" : "FAIL"} | ${r.items} | ${r.handoffs} | ${[...r.failures, ...r.warnings.map((w) => `note: ${w}`)].join("; ") || ""} |`,
    ),
    "",
    "## Shared Learning Labs",
    "",
    ...[...labLessons].map(([lab, ids]) => `- ${lab}: ${ids.join(", ")}`),
    "",
    "## Out of scope",
    "",
    ...skipped.map((s) => `- ${s.id}: ${s.reason}`),
    "",
  ];
  return { results, passed, markdown: lines.join("\n") };
}
