#!/usr/bin/env node
// Contract test for /api/progress/next-move — the recommendation policy.
//
// The assertions that matter here are the REFUSALS. A recommendation engine that
// invents a lane from two data points, or renders a confident default when it has
// no evidence at all, is worse than an empty panel: a teacher will act on it and
// will have no way to know they should not have.

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

const { onRequest } = await import("../functions/api/progress/[[path]].js");

function makeDb() {
  const sqlite = new DatabaseSync(":memory:");
  const wrap = (sql, args = []) => ({
    bind: (...next) => wrap(sql, next),
    first() {
      return sqlite.prepare(sql).get(...args) ?? null;
    },
    all() {
      return { results: sqlite.prepare(sql).all(...args) };
    },
    run() {
      const info = sqlite.prepare(sql).run(...args);
      return { meta: { changes: Number(info.changes) } };
    },
  });
  return {
    prepare: (sql) => wrap(sql),
    async batch(statements) {
      return statements.map((statement) => statement.run());
    },
    _raw: sqlite,
  };
}

const db = makeDb();
const env = { DB: db };
let checks = 0;

async function nextMove(query) {
  const request = new Request(`https://example.test/api/progress/next-move?${query}`);
  const response = await onRequest({ request, env, params: { path: ["next-move"] } });
  return { status: response.status, data: await response.json() };
}

// Seed via the telemetry schema the route itself ensures.
async function seed(rows) {
  await nextMove("section=__warmup"); // forces ensureTelemetrySchema
  for (const row of rows) {
    db._raw
      .prepare(
        `INSERT INTO lesson_telemetry (lesson_slug, section, event_type, payload_json, created_at)
         VALUES (?, ?, 'small_group_evidence', ?, ?)`,
      )
      .run(row.slug, row.section, JSON.stringify(row.payload), row.at);
  }
}

const now = new Date().toISOString();

// ------------------------------------------------------------------ refusals
{
  checks += 1;
  const missing = await nextMove("");
  assert.equal(missing.status, 400, "a section is required — there is no class-wide default");
}
{
  checks += 1;
  const empty = await nextMove("section=6Z");
  assert.equal(empty.data.evidence, false, "no evidence → evidence:false");
  assert.equal(empty.data.devicesReporting, 0);
  assert.ok(!empty.data.recommendedLane, "no evidence must NOT yield a lane");
  assert.match(
    empty.data.note,
    /Nothing here is a recommendation/i,
    "it says plainly that it is not advising",
  );
}
{
  checks += 1;
  const response = await onRequest({
    request: new Request("https://example.test/api/progress/next-move?section=6A"),
    env: {},
    params: { path: ["next-move"] },
  });
  const data = await response.json();
  assert.equal(data.evidence, false, "no D1 binding → no recommendation, no error page");
}

// ------------------------------------------------------- thin evidence is named
await seed([
  {
    slug: "1-6-group1",
    section: "6T",
    at: now,
    payload: {
      kind: "complete",
      reported: 1,
      checkBand: "approaching",
      misconceptions: { "decimal-place-value": 2 },
      reachedTabs: ["sg-tab-vocab", "sg-tab-learn"],
    },
  },
]);
{
  checks += 1;
  const thin = await nextMove("section=6T");
  assert.equal(thin.data.devicesReporting, 1);
  assert.equal(thin.data.confidence, "very-thin", "one device is very thin, and says so");
  assert.match(thin.data.note, /anecdote, not a pattern/i);
}

// ------------------------------------------------- a real signal yields a lane
const many = [];
for (let i = 0; i < 9; i++) {
  many.push({
    slug: "2-3-group1",
    section: "6A",
    at: now,
    payload: {
      kind: "complete",
      reported: 1,
      checkBand: i < 6 ? "approaching" : "meeting",
      misconceptions: i < 5 ? { "fraction-added-denominators": 2 } : { "decimal-place-value": 1 },
      reachedTabs: ["sg-tab-vocab", "sg-tab-learn", "sg-tab-practice"],
    },
  });
}
await seed(many);
{
  checks += 1;
  const move = await nextMove("section=6A");
  assert.equal(move.data.evidence, true);
  assert.equal(move.data.devicesReporting, 9);
  assert.equal(move.data.confidence, "good");
  assert.equal(move.data.lastLesson, "2-3", "the base lesson is derived, not the variant slug");
  assert.equal(
    move.data.recommendedLane,
    "group1",
    "a 6/9 approaching majority pulls the support lane",
  );
  assert.equal(
    move.data.watchFor.length,
    2,
    "exactly two things to watch — a list of ten is not a plan",
  );
  assert.equal(move.data.watchFor[0].id, "fraction-added-denominators");
  assert.equal(move.data.watchFor[0].count, 10, "counts sum across the window");
  assert.equal(move.data.pacing, null, "everyone reached practice → no pacing warning");
}

// ------------------------------------------------------------ pacing signal
const shallow = [];
for (let i = 0; i < 8; i++) {
  shallow.push({
    slug: "3-1-group2",
    section: "6P",
    at: now,
    payload: {
      kind: "complete",
      reported: 1,
      checkBand: "exceeding",
      reachedTabs: ["sg-tab-vocab"],
    },
  });
}
await seed(shallow);
{
  checks += 1;
  const move = await nextMove("section=6P");
  assert.equal(
    move.data.recommendedLane,
    "group2",
    "an exceeding majority pulls the challenge lane",
  );
  assert.match(
    move.data.pacing,
    /cut a section before adding one/i,
    "nobody reached practice → pacing warning",
  );
}

// -------------------------------------------------- no names, ever, in output
{
  checks += 1;
  await seed([
    {
      slug: "4-1-group1",
      section: "6N",
      at: now,
      payload: {
        kind: "complete",
        reported: 1,
        checkBand: "meeting",
        studentName: "Should Not Appear",
      },
    },
  ]);
  const move = await nextMove("section=6N");
  assert.ok(
    !JSON.stringify(move.data).includes("Should Not Appear"),
    "the response must never echo a payload field back — only derived aggregates",
  );
}

console.log(`small-group next-move policy: ${checks} checks passed.`);
