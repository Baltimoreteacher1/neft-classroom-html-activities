#!/usr/bin/env node
// Contract test for the shared-table backend (functions/api/sg-room).
//
// The invariant under test is pedagogical, not technical: NO EARLY REVEAL. If a
// group can see one another's answers before everyone has committed, the fastest
// student answers first and nobody else thinks — which is the exact failure this
// feature exists to prevent. A regression there would look like a working
// feature, so it is asserted directly.
//
// Runs the real Function against an in-memory D1 double. The double implements
// only the surface the Function uses (prepare/bind/first/all/run/batch) over
// node:sqlite, so the SQL itself is exercised rather than mocked away.

import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";

const { onRequest } = await import("../functions/api/sg-room/[[path]].js");

// --- minimal D1 double ------------------------------------------------------
function makeDb() {
  const sqlite = new DatabaseSync(":memory:");
  const wrap = (sql, args = []) => ({
    bind: (...next) => wrap(sql, next),
    first() {
      const row = sqlite.prepare(sql).get(...args);
      return row ?? null;
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
  };
}

const env = { DB: makeDb() };
let checks = 0;

async function hit(path, { method = "GET", body = null } = {}) {
  const url = `https://example.test/api/sg-room/${path}`;
  const request = new Request(url, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "content-type": "application/json" } : undefined,
  });
  const [route, query] = path.split("?");
  const response = await onRequest({
    request,
    env,
    params: { path: route.split("/") },
  });
  return { status: response.status, data: await response.json(), query };
}

// --------------------------------------------------------------- health/open
{
  checks += 1;
  const health = await hit("health");
  assert.equal(health.data.ok, true, "health responds without a room");
}
{
  checks += 1;
  const bad = await hit("open", { method: "POST", body: { lessonId: "nope" } });
  assert.equal(bad.status, 400, "a malformed lesson id is rejected");
}

const opened = await hit("open", { method: "POST", body: { lessonId: "1-6-group1" } });
checks += 1;
assert.equal(opened.data.ok, true, "room opens");
assert.match(opened.data.code, /^[A-Z2-9]{4}$/, "code uses the unambiguous alphabet");
assert.equal(opened.data.seat, 1, "the opener takes seat 1");
const code = opened.data.code;

// The code alphabet must never contain characters students confuse when reading
// a code off the board.
checks += 1;
assert.ok(!/[OIL01]/.test(code), `code ${code} must avoid O/I/L/0/1`);

// -------------------------------------------------------------------- joining
{
  checks += 1;
  const missing = await hit("join", { method: "POST", body: { code: "ZZZZ" } });
  assert.equal(missing.status, 404, "joining a nonexistent table 404s");
}
const second = await hit("join", { method: "POST", body: { code } });
checks += 1;
assert.equal(second.data.seat, 2, "second device gets seat 2");
const third = await hit("join", { method: "POST", body: { code } });
checks += 1;
assert.equal(third.data.seat, 3, "third device gets seat 3");

// ------------------------------------------------- THE NO-EARLY-REVEAL RULE
const itemKey = "consensus:1-6-group1";
await hit("commit", { method: "POST", body: { code, seat: 1, itemKey, answer: "model" } });
{
  checks += 1;
  const state = await hit(`state?code=${code}&itemKey=${itemKey}`);
  assert.equal(state.data.committed, 1);
  assert.equal(state.data.revealed, false, "one of three committed → NOT revealed");
  assert.equal(state.data.answers, null, "unrevealed state must not leak answers");
}
await hit("commit", { method: "POST", body: { code, seat: 2, itemKey, answer: "test-numbers" } });
{
  checks += 1;
  const state = await hit(`state?code=${code}&itemKey=${itemKey}`);
  assert.equal(state.data.revealed, false, "two of three committed → still NOT revealed");
  assert.equal(state.data.answers, null, "answers stay sealed until the last seat commits");
}
await hit("commit", { method: "POST", body: { code, seat: 3, itemKey, answer: "model" } });
{
  checks += 1;
  const state = await hit(`state?code=${code}&itemKey=${itemKey}`);
  assert.equal(state.data.revealed, true, "all seats committed → revealed");
  assert.equal(state.data.answers.length, 3, "every seat's answer appears at once");
  assert.deepEqual(
    state.data.answers.map((row) => row.seat),
    [1, 2, 3],
    "answers are ordered by seat",
  );
  // Seat numbers only. If a name ever reaches this table the privacy promise in
  // the studio header is a lie.
  for (const row of state.data.answers) {
    assert.deepEqual(
      Object.keys(row).sort(),
      ["answer", "seat"],
      "answers carry seat + answer only",
    );
  }
}

// ------------------------------------------------------- commits are final
{
  checks += 1;
  await hit("commit", { method: "POST", body: { code, seat: 1, itemKey, answer: "CHANGED" } });
  const state = await hit(`state?code=${code}&itemKey=${itemKey}`);
  const seatOne = state.data.answers.find((row) => row.seat === 1);
  assert.equal(seatOne.answer, "model", "a seat cannot revise after the reveal");
}

// --------------------------------------------- a lone seat is never a reveal
{
  checks += 1;
  const solo = await hit("open", { method: "POST", body: { lessonId: "2-1-group2" } });
  const soloKey = "consensus:2-1-group2";
  await hit("commit", {
    method: "POST",
    body: { code: solo.data.code, seat: 1, itemKey: soloKey, answer: "model" },
  });
  const state = await hit(`state?code=${solo.data.code}&itemKey=${soloKey}`);
  assert.equal(
    state.data.revealed,
    false,
    "one seat, one commit → nothing to reveal (showing a student their own answer is not a reveal)",
  );
}

// ------------------------------------------------------------------ validation
{
  checks += 1;
  const badSeat = await hit("commit", {
    method: "POST",
    body: { code, seat: 99, itemKey, answer: "x" },
  });
  assert.equal(badSeat.status, 400, "seat numbers are bounded");
}
{
  checks += 1;
  const empty = await hit("commit", {
    method: "POST",
    body: { code, seat: 1, itemKey, answer: "   " },
  });
  assert.equal(empty.status, 400, "a blank answer is not a commit");
}
{
  // A phantom seat must not be able to force the reveal: committing as seat 4 at
  // a three-seat table would push the count past the seat count while real
  // students were still thinking.
  checks += 1;
  const phantom = await hit("commit", {
    method: "POST",
    body: { code, seat: 5, itemKey, answer: "ghost" },
  });
  assert.equal(phantom.status, 409, "a seat that never joined cannot commit");
}
{
  checks += 1;
  const long = "9".repeat(500);
  const wide = await hit("open", { method: "POST", body: { lessonId: "3-3-catchup" } });
  const wideKey = "consensus:3-3-catchup";
  await hit("commit", {
    method: "POST",
    body: { code: wide.data.code, seat: 1, itemKey: wideKey, answer: long },
  });
  await hit("join", { method: "POST", body: { code: wide.data.code } });
  await hit("commit", {
    method: "POST",
    body: { code: wide.data.code, seat: 2, itemKey: wideKey, answer: "8" },
  });
  const state = await hit(`state?code=${wide.data.code}&itemKey=${wideKey}`);
  const row = state.data.answers?.find((entry) => entry.seat === 1);
  assert.ok(row.answer.length <= 60, "answers are capped — this is not a prose field");
}

// ---------------------------------------------------------- degradation path
{
  checks += 1;
  const response = await onRequest({
    request: new Request("https://example.test/api/sg-room/open", { method: "POST" }),
    env: {},
    params: { path: ["open"] },
  });
  assert.equal(response.status, 503, "no D1 binding → 503 so the studio stays solo");
}

console.log(`small-group room backend: ${checks} checks passed.`);
