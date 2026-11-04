/**
 * Seed data for the portfolio browser gate: real, valid saves built from the Studio's own modules
 * (fresh/model/progress), so the portfolio is tested against exactly what a student's device holds.
 * Nothing here is imported by the shipped site.
 */

import {
  buildCompletionRecord,
  completeKeyFor,
} from "../../curriculum/projects/studio/completion.mjs";
import { format, model } from "../../curriculum/projects/studio/math.mjs";
import { PROJECTS } from "../../curriculum/projects/studio/projects.mjs";
import { fresh, keyFor, progress } from "../../curriculum/projects/studio/state.mjs";

export const mission = (id) => PROJECTS.find((p) => p.id === id);

/** A student who finished: every check matched, own words in every box, a changed design, all four self-review boxes. */
export function readyState(id, tag = "Seed") {
  const project = mission(id);
  const state = fresh(project);
  const m = model(project, state.design);
  state.choice = project.choices[1];
  state.vision = `${tag}: my audience is the neighbourhood club and success means every guest is served.`;
  state.answers = Object.fromEntries(m.checks.map((q) => [q.id, format(q.answer)]));
  state.checked = Object.fromEntries(m.checks.map((q) => [q.id, true]));
  state.evidence = project.evidence.map(
    (_, i) => `${tag} evidence ${i + 1}: I checked this against my labelled model.`,
  );
  const numeric = Object.keys(state.design).find((k) => Number.isFinite(Number(state.design[k])));
  state.baseline = {
    design: { ...state.design, [numeric]: String(Number(state.design[numeric]) + 2) },
  };
  state.critique = `${tag}: what if the first number changed again?`;
  state.revision = `${tag}: my change made the cost go down but it limits how many people we serve.`;
  state.claim = `${tag}: I recommend my second design because the checked values meet the goal. It ignores weather.`;
  state.review = [true, true, true, true];
  state.stage = 4;
  return { project, state, progress: progress(project, state) };
}

/** A student who has only started. */
export function startedState(id) {
  const project = mission(id);
  const state = fresh(project);
  state.stage = 1;
  state.choice = project.choices[0];
  state.vision = "Started: I want my design to be fair for everyone.";
  return { project, state };
}

export const studioSave = (id, state) => [keyFor(id), JSON.stringify(state)];

export function completionEntry(id, tag = "Seed", now = new Date("2026-10-30T15:00:00Z")) {
  const { project, state, progress: p } = readyState(id, tag);
  const record = buildCompletionRecord(project, state, {
    passed: p.passed,
    total: p.total,
    ready: p.ready,
    now,
  });
  return [completeKeyFor(id), JSON.stringify(record), record];
}

/** A shared Save/Resume record for a classic page, in the engine's own shape. */
export function classicRecord(path, { percent = 40, answers = 3, code = "MATH-SEED" } = {}) {
  const fields = {};
  for (let i = 0; i < answers; i += 1)
    fields[`#answer-${i}`] = { t: "textarea", v: `my answer ${i}` };
  fields["#student-name-secret"] = { t: "input", v: "" };
  return [
    `nsr:rec:${code}`,
    JSON.stringify({
      schema: 1,
      saveCode: code,
      activityId: path.replaceAll("/", "-"),
      url: path,
      studentName: "SHOULD-NEVER-SHOW",
      updatedAt: "2026-10-29T12:00:00.000Z",
      progressPercent: percent,
      state: { fields },
    }),
  ];
}

/** The legacy page layer's completion map entry, in the shape projects-complete.js writes. */
export const legacyCompletionMap = (entries) => [
  "nt-project-complete:v1",
  JSON.stringify(
    Object.fromEntries(
      entries.map(([path, extra]) => [
        path,
        {
          unit: "unit-4",
          version: "a",
          title: "Pop-Up Shop Owner",
          completedAt: "2026-10-20T14:03:00.000Z",
          stars: 2,
          rubricTotal: 13,
          rubricMax: 16,
          level: 1,
          ...extra,
        },
      ]),
    ),
  ),
];
