import { fieldsFor, model, matches } from "./math.mjs";
import { analyzeEvidence } from "../../../engine/core/instructional-intelligence.js";
export const VERSION = 1;
export const keyFor = (id) => `ewl-project-studio:v${VERSION}:${id}`;
export function fresh(project) {
  return {
    version: VERSION,
    projectId: project.id,
    stage: 0,
    design: { ...project.defaults },
    choice: "",
    vision: "",
    answers: {},
    checked: {},
    supportSignals: {},
    instructionalEvidence: { version: 1, events: [] },
    evidence: ["", "", ""],
    critique: "",
    revision: "",
    claim: "",
    baseline: null,
    review: [false, false, false, false],
    supports: false,
  };
}
const short = (v, n = 6000) => (typeof v === "string" ? v.slice(0, n) : "");
export function clean(project, input) {
  if (
    !input ||
    typeof input !== "object" ||
    input.version !== VERSION ||
    input.projectId !== project.id
  )
    throw new Error(
      "This backup belongs to a different project or version. Open its project first.",
    );
  const out = fresh(project);
  out.stage =
    Number.isInteger(input.stage) && input.stage >= 0 && input.stage <= 4 ? input.stage : 0;
  for (const f of fieldsFor(project))
    if (["string", "number"].includes(typeof input.design?.[f.key]))
      out.design[f.key] = String(input.design[f.key]).slice(0, 200);
  out.choice = project.choices.includes(input.choice) ? input.choice : "";
  for (const k of ["vision", "critique", "revision", "claim"]) out[k] = short(input[k]);
  out.evidence = out.evidence.map((_, i) => short(input.evidence?.[i]));
  out.review = out.review.map((_, i) => input.review?.[i] === true);
  out.supports = input.supports === true;
  const m = model(project, out.design);
  for (const q of m.checks) {
    out.answers[q.id] = short(input.answers?.[q.id], 100);
    if (input.checked?.[q.id] === true && matches(out.answers[q.id], q.answer))
      out.checked[q.id] = true;
  }
  for (const q of m.checks) {
    const signal = input.supportSignals?.[q.id];
    if (["calculation-check", "strategy-clarification", "language-access"].includes(signal))
      out.supportSignals[q.id] = signal;
  }
  const savedEvents = input.instructionalEvidence;
  if (savedEvents?.version === 1 && Array.isArray(savedEvents.events)) {
    out.instructionalEvidence.events = savedEvents.events.slice(-40).map((event) =>
      analyzeEvidence({
        activity: typeof event?.activity === "string" && event.activity.startsWith(`project-studio:${project.id}:`)
          ? event.activity
          : `project-studio:${project.id}`,
        itemId: typeof event?.itemId === "string" ? event.itemId : null,
        correct: event?.kind === "correct",
        misconception: event?.kind === "misconception" ? event.misconception : "",
        computationalSlip: event?.kind === "computational-slip",
        independent: event?.condition !== "supported",
        languageAccess: ["learner-requested", "authored-translation"].includes(event?.languageAccess)
          ? event.languageAccess
          : "none",
        learnerSignal: ["calculation-check", "strategy-clarification", "language-access"].includes(event?.learnerSignal)
          ? event.learnerSignal
          : null,
        at: Number.isFinite(event?.at) ? event.at : undefined,
      }),
    );
  }
  if (input.baseline && typeof input.baseline === "object") {
    const design = {};
    for (const f of fieldsFor(project))
      if (["string", "number"].includes(typeof input.baseline.design?.[f.key]))
        design[f.key] = String(input.baseline.design[f.key]).slice(0, 200);
    if (!model(project, design).errors.length) out.baseline = { design };
  }
  return out;
}
export function progress(project, state) {
  const m = model(project, state.design);
  const passed = m.checks.filter(
    (q) => state.checked[q.id] === true && matches(state.answers[q.id], q.answer),
  ).length;
  const changed =
    state.baseline &&
    fieldsFor(project).some(
      (f) => String(state.design[f.key]) !== String(state.baseline.design[f.key]),
    );
  return {
    m,
    passed,
    total: m.checks.length,
    changed,
    ready:
      !m.errors.length &&
      passed === m.checks.length &&
      m.checks.length > 0 &&
      !!state.choice &&
      state.vision.trim().length > 0 &&
      state.evidence.every((s) => s.trim().length > 0) &&
      !!changed &&
      state.critique.trim().length > 0 &&
      state.revision.trim().length > 0 &&
      state.claim.trim().length > 0 &&
      state.review.every(Boolean),
  };
}
