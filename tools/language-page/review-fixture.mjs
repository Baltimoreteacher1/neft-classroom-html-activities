// A scripted review session against the REAL review endpoints and migrations, on an in-memory database (node:sqlite
// behind the D1 shape, tools/privacy-d1-fake.mjs). Nothing here touches seed content, a deployed database or any
// review state anywhere else: the "reviewer" is a fixture attestation that lives and dies with the in-memory DB.
// The gates use it to prove the workflow's invariants; it is not a way to review content.
import { onRequest as decide } from "../../functions/api/review/decide.js";
import { onRequest as logCsvFn } from "../../functions/api/review/log.csv.js";
import { onRequest as logJsonFn } from "../../functions/api/review/log.json.js";
import { onRequest as summary } from "../../functions/api/review/summary.js";
import { call, human, newEnv } from "../review-test-kit.mjs";

export const FIXTURE_UNIT = "g6-math-u1";
export const lessonId = (n, unit = FIXTURE_UNIT) => `${unit}-l${String(n).padStart(2, "0")}`;

/** Moves one dimension. Returns the endpoint response ({ status, json }). */
export const move = (
  env,
  blockId,
  state,
  { dimension = "pedagogy", comment, reviewer, lang } = {},
) =>
  call(decide, env, {
    method: "POST",
    path: "/api/review/decide",
    body: {
      blockId,
      dimension,
      state,
      reviewer: reviewer ?? human("Fixture Reviewer", "pedagogy"),
      ...(lang ? { lang } : {}),
      ...(comment ? { comment } : {}),
    },
  });

/** Legal moves over three lessons, written through the API. Returns { env, sqlite }. */
export async function legalSession() {
  const { env, sqlite } = newEnv();
  const steps = [
    [lessonId(1), "in_review", {}],
    [lessonId(1), "reviewed", { comment: "Fixture: frames and exit ticket read through." }],
    [lessonId(1), "in_review", {}],
    [
      lessonId(2),
      "in_review",
      { dimension: "language_qa", reviewer: human("Fixture Language", "language") },
    ],
    [
      lessonId(2),
      "needs_changes",
      {
        dimension: "language_qa",
        comment: "Fixture: one frame needs a blank.",
        reviewer: human("Fixture Language", "language"),
      },
    ],
    [
      lessonId(2),
      "in_review",
      { dimension: "language_qa", reviewer: human("Fixture Language", "language") },
    ],
    [lessonId(3), "in_review", {}],
    [lessonId(3), "retired", { comment: "Fixture: superseded." }],
  ];
  for (const [id, state, opts] of steps) {
    const res = await move(env, id, state, opts);
    if (res.status !== 200)
      throw new Error(`fixture step ${id} -> ${state} refused: ${res.status} ${res.text}`);
  }
  return { env, sqlite };
}

export const eventRows = (sqlite) =>
  sqlite.prepare("SELECT * FROM review_event ORDER BY seq").all();
export { call, logCsvFn, logJsonFn, summary };
