// Review API end to end: onRequest of every endpoint against the real migrations in an in-memory database.
// G-37: the exported CSV equals the database rows, and an approval cannot be created without a human actor.
import assert from "node:assert/strict";
import { test } from "node:test";
import { indexRows } from "../functions/_lib/review/blocks.js";
import { LOG_COLUMNS, logCsv, parseCsv } from "../functions/_lib/review/csv.js";
import { buildQueue } from "../functions/_lib/review/queue.js";
import { onRequest as blockOne } from "../functions/api/review/block/[id].js";
import { onRequest as bulkSample } from "../functions/api/review/bulk/sample.js";
import { onRequest as bulk } from "../functions/api/review/bulk.js";
import { onRequest as decide } from "../functions/api/review/decide.js";
import { onRequest as logCsvFn } from "../functions/api/review/log.csv.js";
import { onRequest as queue } from "../functions/api/review/queue.js";
import { onRequest as summary } from "../functions/api/review/summary.js";
import { onRequest as verify } from "../functions/api/review/verify.js";
import { call, count, human, newEnv } from "./review-test-kit.mjs";

const lessonId = (n, unit = "g6-math-u1") => `${unit}-l${String(n).padStart(2, "0")}`;
const move = (env, blockId, state, extra = {}) =>
  call(decide, env, {
    method: "POST",
    path: "/api/review/decide",
    body: { blockId, dimension: "pedagogy", state, reviewer: human(), ...extra },
  });

test("teacher gate: no key, wrong key and an unconfigured key are refused; the summary is the only open read", async () => {
  const { env } = newEnv();
  for (const [fn, path, method] of [
    [queue, "/api/review/queue", "GET"],
    [verify, "/api/review/verify", "GET"],
    [logCsvFn, "/api/review/log.csv", "GET"],
    [decide, "/api/review/decide", "POST"],
  ]) {
    assert.equal(
      (await call(fn, env, { path, method, key: "", body: method === "POST" ? {} : undefined }))
        .status,
      401,
      path,
    );
    assert.equal(
      (
        await call(fn, env, {
          path,
          method,
          key: "wrong",
          body: method === "POST" ? {} : undefined,
        })
      ).status,
      401,
      path,
    );
  }
  assert.equal((await call(queue, { DB: env.DB }, { path: "/api/review/queue" })).status, 503);
  assert.equal(
    (await call(summary, env, { key: "", path: "/api/review/summary?unit=g6-math-u1" })).status,
    200,
  );
  assert.equal((await call(queue, { TEACHER_KEY: "k" }, { key: "k" })).status, 503); // no database bound
});

test("decide: a human decision is chained, projected and visible; the client cannot supply hash, date or actor tricks", async () => {
  const { env, sqlite } = newEnv();
  const a = await move(env, lessonId(1), "in_review");
  assert.equal(a.status, 200, a.text);
  assert.equal(a.json.event.from, "draft");
  const b = await move(env, lessonId(1), "reviewed", {
    comment: "Checked frames and exit ticket.",
  });
  assert.equal(b.status, 200, b.text);
  assert.equal(count(sqlite, "review_event"), 2);
  const state = sqlite.prepare("SELECT * FROM review_state WHERE block_id = ?").get(lessonId(1));
  assert.equal(state.state, "reviewed");
  assert.equal(state.reviewed_hash, b.json.event.contentHash);
  // The recorded date is the server's, never the request's.
  const ev = sqlite.prepare("SELECT * FROM review_event ORDER BY seq DESC LIMIT 1").get();
  assert.equal(ev.reviewer_date, new Date().toISOString().slice(0, 10));
  assert.equal(JSON.parse(ev.snapshot_json).id, lessonId(1));

  // negative controls: smuggled fields, bad inputs and PII are refused and write nothing
  const before = count(sqlite, "review_event");
  const refuse = async (body, status, why) => {
    const r = await call(decide, env, { method: "POST", path: "/api/review/decide", body });
    assert.equal(r.status, status, `${why}: ${r.text}`);
  };
  const base = {
    blockId: lessonId(2),
    dimension: "pedagogy",
    state: "in_review",
    reviewer: human(),
  };
  await refuse({ ...base, contentHash: "0".repeat(64) }, 400, "client hash");
  await refuse(
    { ...base, reviewer: { ...human(), date: "2020-01-01" } },
    200,
    "client date is ignored, not stored",
  );
  await refuse({ ...base, blockId: "g6-math-u1-l99" }, 404, "unknown block");
  await refuse({ ...base, blockId: "../etc/passwd" }, 404, "path-like id");
  await refuse({ ...base, state: "reviewed", blockId: lessonId(3) }, 409, "draft -> reviewed");
  await refuse(
    { ...base, blockId: lessonId(4), comment: "Ask Maria Lopez about this one" },
    422,
    "personal name in comment",
  );
  await refuse(
    { ...base, blockId: lessonId(4), comment: "call 410-555-0134 to discuss" },
    422,
    "phone in comment",
  );
  await refuse(
    { ...base, blockId: lessonId(4), state: "needs_changes" },
    400,
    "needs_changes without comment",
  );
  await refuse(
    { ...base, blockId: lessonId(4), reviewer: { ...human(), actor: "model" } },
    403,
    "model actor",
  );
  await refuse(
    { ...base, blockId: lessonId(4), reviewer: { ...human("Claude") } },
    403,
    "model name",
  );
  await refuse(
    { ...base, blockId: lessonId(4), reviewer: { name: "Pat", role: "pedagogy" } },
    400,
    "actor missing",
  );
  assert.equal(count(sqlite, "review_event"), before + 1); // only the date-ignored call wrote
  const stored = sqlite
    .prepare("SELECT reviewer_date FROM review_event WHERE block_id = ?")
    .get(lessonId(2));
  assert.notEqual(stored.reviewer_date, "2020-01-01");
  // size cap and method guard come from handler()
  const big = await call(decide, env, {
    method: "POST",
    path: "/api/review/decide",
    body: JSON.stringify({ ...base, comment: "x".repeat(6000) }),
  });
  assert.equal(big.status, 413);
  assert.equal((await call(decide, env, { method: "GET" })).status, 405);
});

test("hash invalidation through the API: a stored approval for other content reads in_review", async () => {
  const { env, sqlite } = newEnv();
  await move(env, lessonId(5), "in_review");
  const b = await move(env, lessonId(5), "reviewed");
  let detail = await call(blockOne, env, { params: { id: lessonId(5) } });
  assert.equal(detail.json.states.pedagogy, "reviewed");
  assert.equal(detail.json.lastReviewed.content_hash, b.json.event.contentHash);
  assert.equal(detail.json.lastReviewed.snapshot.id, lessonId(5));
  // Content changed since the review: simulate by pointing the stored approval at another hash.
  sqlite
    .prepare("UPDATE review_state SET reviewed_hash = ? WHERE block_id = ?")
    .run("e".repeat(64), lessonId(5));
  detail = await call(blockOne, env, { params: { id: lessonId(5) } });
  assert.equal(detail.json.states.pedagogy, "in_review");
  assert.equal(detail.json.badge, "in_review");
  const q = await call(queue, env, {
    path: "/api/review/queue?unit=g6-math-u1&dimension=pedagogy&state=in_review",
  });
  assert.deepEqual(
    q.json.items.map((i) => i.id),
    [lessonId(5)],
  );
  assert.equal((await call(blockOne, env, { params: { id: "nope" } })).status, 404);
});

test("queue: filters, age and verifier counts", async () => {
  const { env } = newEnv();
  await move(env, lessonId(1), "in_review");
  await move(env, lessonId(2), "in_review");
  const all = await call(queue, env, { path: "/api/review/queue?grade=6&subject=math&limit=200" });
  assert.equal(all.status, 200);
  assert.ok(all.json.total > 50);
  assert.ok(all.json.items.every((i) => i.grade === "6" && i.subject === "math"));
  const inReview = await call(queue, env, {
    path: "/api/review/queue?grade=6&subject=math&state=in_review",
  });
  assert.deepEqual(inReview.json.items.map((i) => i.id).sort(), [lessonId(1), lessonId(2)]);
  assert.equal(inReview.json.items[0].age_days, 0);
  const none = await call(queue, env, {
    path: "/api/review/queue?unit=g6-math-u1&state=in_review&olderThanDays=3",
  });
  assert.equal(none.json.total, 0); // touched today, so not older than 3 days
  const never = await call(queue, env, {
    path: "/api/review/queue?unit=g6-math-u1&state=draft&olderThanDays=3",
  });
  assert.ok(never.json.total > 0); // never touched counts as old
  assert.equal((await call(queue, env, { path: "/api/review/queue?state=bogus" })).status, 400);
  assert.equal((await call(queue, env, { path: "/api/review/queue?unit=nope" })).status, 400);
  assert.equal(
    (await call(queue, env, { path: "/api/review/queue?olderThanDays=-1" })).status,
    400,
  );
  // verifier counts come from published per-block counts
  const rows = await indexRows({ unit: "g6-math-u1" });
  const counts = { "language-demand": { [rows[1].id]: 3, [rows[2].id]: 1 } };
  const filters = {
    grade: "",
    subject: "",
    unit: "",
    dimension: "",
    state: "",
    olderThanDays: null,
    verifier: "language-demand",
    limit: 50,
    offset: 0,
  };
  const out = buildQueue({
    rows,
    stateByBlock: new Map(),
    activity: new Map(),
    now: Date.now(),
    filters,
    verifierCounts: counts,
  });
  assert.deepEqual(
    out.items.map((i) => [i.id, i.verifierFailureTotal]),
    [
      [rows[1].id, 3],
      [rows[2].id, 1],
    ],
  );
});

test("bulk: 10 or fewer need no sample; more than 10 need the server's sample, read individually", async () => {
  const { env, sqlite } = newEnv();
  const ids = (await indexRows({ grade: "6", subject: "math" }))
    .filter((r) => r.kind === "lesson")
    .slice(0, 12)
    .map((r) => r.id);
  assert.equal(ids.length, 12);
  const items = ids.map((blockId) => ({ blockId, dimension: "pedagogy" }));
  const post = (path, body) =>
    call(path === "sample" ? bulkSample : bulk, env, {
      method: "POST",
      path: `/api/review/bulk${path === "sample" ? "/sample" : ""}`,
      body,
    });

  // moving to in_review is not an approval: no sample
  const start = await post("bulk", { items, state: "in_review", reviewer: human() });
  assert.equal(start.status, 200, start.text);
  assert.equal(start.json.count, 12);
  assert.equal(count(sqlite, "review_event"), 12);

  // approving 12 without a sample is refused (negative control)
  const noSample = await post("bulk", { items, state: "reviewed", reviewer: human() });
  assert.equal(noSample.status, 422);
  assert.equal(noSample.json.error, "sample-required");

  const s = await post("sample", { items, reviewer: human() });
  assert.equal(s.status, 200, s.text);
  assert.equal(s.json.required, true);
  assert.equal(s.json.sample.length, 3);
  assert.equal(new Set(s.json.sample.map((i) => i.blockId)).size, 3);
  const echoed = s.json.sample.map((i) => `${i.blockId}|${i.dimension}|${i.lang || ""}`);

  // token present but the sample was not reviewed individually yet
  const unread = await post("bulk", {
    items,
    state: "reviewed",
    reviewer: human(),
    sample: { token: s.json.token, reviewed: echoed },
  });
  assert.equal(unread.json.error, "sample-unreviewed");
  assert.equal(unread.status, 409);

  // wrong echo, tampered token, other set, other reviewer
  const wrongEcho = await post("bulk", {
    items,
    state: "reviewed",
    reviewer: human(),
    sample: { token: s.json.token, reviewed: echoed.slice(1) },
  });
  assert.equal(wrongEcho.json.error, "sample-mismatch");
  const tampered = await post("bulk", {
    items,
    state: "reviewed",
    reviewer: human(),
    sample: { token: `${s.json.token.slice(0, -3)}AAA`, reviewed: echoed },
  });
  assert.equal(tampered.json.error, "sample-invalid");
  const otherSet = await post("bulk", {
    items: items.slice(0, 11),
    state: "reviewed",
    reviewer: human(),
    sample: { token: s.json.token, reviewed: echoed },
  });
  assert.equal(otherSet.json.error, "sample-invalid");
  const otherPerson = await post("bulk", {
    items,
    state: "reviewed",
    reviewer: human("Sam Other"),
    sample: { token: s.json.token, reviewed: echoed },
  });
  assert.equal(otherPerson.json.error, "sample-invalid");

  // a sampled item sent back for changes blocks the bulk approval
  const flagged = s.json.sample[0].blockId;
  await move(env, flagged, "needs_changes", { comment: "The example is confusing." });
  const afterFlag = await post("bulk", {
    items,
    state: "reviewed",
    reviewer: human(),
    sample: { token: s.json.token, reviewed: echoed },
  });
  assert.equal(afterFlag.json.error, "sample-flagged");

  // review the sample individually (the flagged one goes back through review first), then the bulk goes through
  await move(env, flagged, "in_review");
  for (const i of s.json.sample) assert.equal((await move(env, i.blockId, "reviewed")).status, 200);
  const done = await post("bulk", {
    items,
    state: "reviewed",
    reviewer: human(),
    sample: { token: s.json.token, reviewed: echoed },
  });
  assert.equal(done.status, 200, done.text);
  assert.equal(done.json.count, 9);
  assert.equal(done.json.skipped, 3);
  assert.equal(done.json.sampled, true);
  const reviewed = sqlite
    .prepare("SELECT COUNT(*) n FROM review_state WHERE state = 'reviewed'")
    .get().n;
  assert.equal(reviewed, 12);
  const bulkRows = sqlite
    .prepare("SELECT bulk_id FROM review_event WHERE kind = 'bulk' AND to_state = 'reviewed'")
    .all();
  assert.equal(new Set(bulkRows.map((r) => r.bulk_id)).size, 1);

  // 10 items need no sample; 11 do; an unknown block makes the whole request fail and write nothing
  const ten = ids.slice(0, 10).map((blockId) => ({ blockId, dimension: "language_qa" }));
  assert.equal((await post("sample", { items: ten, reviewer: human() })).json.required, false);
  assert.equal(
    (await post("bulk", { items: ten, state: "in_review", reviewer: human() })).status,
    200,
  );
  assert.equal(
    (await post("bulk", { items: ten, state: "reviewed", reviewer: human() })).status,
    200,
  );
  const rowsBefore = count(sqlite, "review_event");
  const bad = await post("bulk", {
    items: [...ten.slice(0, 2), { blockId: "g6-math-u1-l99", dimension: "pedagogy" }],
    state: "in_review",
    reviewer: human(),
  });
  assert.equal(bad.status, 404);
  assert.equal(count(sqlite, "review_event"), rowsBefore);
  assert.equal(
    (await post("bulk", { items: [...items, ...items], state: "in_review", reviewer: human() }))
      .status,
    400,
  );
  assert.equal(
    (await post("bulk", { items, state: "in_review", reviewer: { ...human(), actor: "model" } }))
      .status,
    403,
  );
});

test("G-37: the exported CSV equals the database rows, and no approval exists without a human actor", async () => {
  const { env, sqlite } = newEnv();
  await move(env, lessonId(1), "in_review");
  await move(env, lessonId(1), "reviewed", {
    comment: '=SUM(A1) "quoted", with comma\nand a newline',
  });
  await move(env, lessonId(2), "in_review", { reviewer: human("Dana O'Neil", "language") });
  await move(env, lessonId(2), "needs_changes", {
    comment: "'=starts with an apostrophe and equals",
  });
  const res = await call(logCsvFn, env, { path: "/api/review/log.csv" });
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/csv/);
  const rows = sqlite.prepare("SELECT * FROM review_event ORDER BY seq").all();
  const parsed = parseCsv(res.text);
  assert.equal(parsed.length, rows.length);
  assert.deepEqual(LOG_COLUMNS, Object.keys(parsed[0]));
  for (const [i, row] of rows.entries()) {
    for (const c of LOG_COLUMNS) {
      const want =
        c === "created_at"
          ? new Date(row.created_at).toISOString()
          : row[c] === null
            ? ""
            : String(row[c]);
      assert.equal(parsed[i][c], want, `row ${i} column ${c}`);
    }
  }
  assert.ok(res.text.startsWith(`${LOG_COLUMNS.join(",")}\n`));
  assert.ok(!res.text.includes("snapshot")); // snapshots stay out of the export
  assert.ok(res.text.includes("'=SUM(A1)")); // formula guard on the wire
  assert.ok(logCsv(rows).endsWith("\n") && !logCsv(rows).endsWith("\n\n")); // tight: one final newline, no blank lines
  // control: a CSV that is missing a row does not equal the table
  assert.notEqual(parseCsv(logCsv(rows.slice(1))).length, rows.length);
  // paging
  const page = await call(logCsvFn, env, { path: "/api/review/log.csv?limit=2" });
  assert.equal(parseCsv(page.text).length, 2);
  assert.equal(page.headers.get("x-next-after-seq"), String(rows[1].seq));

  // approvals need a human actor: the database itself refuses anything else
  const insert = (actor, to = "reviewed") =>
    sqlite
      .prepare(
        `INSERT INTO review_event (id, block_id, kind, dimension, lang, from_state, to_state, reviewer_name, reviewer_role, reviewer_date, actor,
         content_hash, snapshot_json, comment, created_at, prior_digest, digest)
       VALUES (?, 'g6-math-u1-l03', 'decide', 'pedagogy', '', 'in_review', ?, 'Pat', 'pedagogy', '2026-11-25', ?, ?, '{}', '', 1, ?, ?)`,
      )
      .run(
        crypto.randomUUID(),
        to,
        actor,
        "a".repeat(64),
        crypto.randomUUID(),
        crypto.randomUUID(),
      );
  for (const actor of ["model", "bot", "ai", "", "Human"])
    assert.throws(() => insert(actor), /CHECK constraint failed/, actor);
  assert.ok(insert("human"), "control: a human row inserts");
  // append-only: update and delete are refused
  assert.throws(
    () => sqlite.prepare("UPDATE review_event SET to_state = 'draft'").run(),
    /append-only/,
  );
  assert.throws(() => sqlite.prepare("DELETE FROM review_event").run(), /append-only/);
});

test("chain verification endpoint: intact log passes, an out-of-band edit is reported", async () => {
  const { env, sqlite } = newEnv();
  for (let i = 1; i <= 3; i++) await move(env, lessonId(i), "in_review");
  const ok = await call(verify, env, { path: "/api/review/verify" });
  assert.equal(ok.json.ok, true);
  assert.equal(ok.json.events, 3);
  // Someone with direct database access drops the triggers and rewrites history.
  sqlite.exec("DROP TRIGGER review_event_no_update");
  sqlite.prepare("UPDATE review_event SET reviewer_name = 'Forged Person' WHERE seq = 2").run();
  const bad = await call(verify, env, { path: "/api/review/verify" });
  assert.equal(bad.json.ok, false);
  assert.match(bad.json.errors[0], /digest mismatch/);
});

test("projection equals a replay of the log, and concurrent chain heads cannot both append", async () => {
  const { env, sqlite } = newEnv();
  await move(env, lessonId(1), "in_review");
  await move(env, lessonId(1), "reviewed");
  await move(env, lessonId(1), "in_review");
  await move(env, lessonId(2), "in_review");
  const replay = new Map();
  for (const e of sqlite.prepare("SELECT * FROM review_event ORDER BY seq").all())
    replay.set(`${e.block_id}|${e.dimension}|${e.lang}`, e.to_state);
  const proj = sqlite.prepare("SELECT * FROM review_state").all();
  assert.equal(proj.length, replay.size);
  for (const p of proj) assert.equal(p.state, replay.get(`${p.block_id}|${p.dimension}|${p.lang}`));
  // two inserts on the same chain head: the second is refused by UNIQUE(prior_digest)
  const head = sqlite
    .prepare("SELECT digest FROM review_event ORDER BY seq DESC LIMIT 1")
    .get().digest;
  const add = (id, digest) =>
    sqlite
      .prepare(
        `INSERT INTO review_event (id, block_id, kind, dimension, lang, from_state, to_state, reviewer_name, reviewer_role, reviewer_date, actor,
         content_hash, snapshot_json, comment, created_at, prior_digest, digest)
       VALUES (?, 'g6-math-u1-l09', 'decide', 'pedagogy', '', 'draft', 'in_review', 'Pat', 'pedagogy', '2026-11-25', 'human', ?, '{}', '', 1, ?, ?)`,
      )
      .run(id, "a".repeat(64), head, digest);
  add("race-a", "d1".padEnd(64, "0"));
  assert.throws(() => add("race-b", "d2".padEnd(64, "0")), /UNIQUE/);
});

test("summary: badges per unit and for every unit, cached, aggregate only", async () => {
  const { env } = newEnv();
  await move(env, lessonId(1), "in_review");
  const one = await call(summary, env, { key: "", path: "/api/review/summary?unit=g6-math-u1" });
  assert.equal(one.json.state, "in_review");
  assert.equal(one.json.counts.in_review, 1);
  assert.equal(one.headers.get("cache-control"), "public, max-age=60");
  assert.ok(one.json.blocks.some((b) => b.id === "g6-math-u1:studio" && b.badge === "draft"));
  assert.ok(!one.text.includes("Pat Reviewer")); // no reviewer names
  const every = await call(summary, env, { key: "", path: "/api/review/summary" });
  assert.equal(Object.keys(every.json.units).length, 162);
  assert.equal(every.json.units["g6-math-u1"], "in_review");
  assert.equal(every.json.units["g6-math-u2"], "draft");
  assert.equal(
    (await call(summary, env, { key: "", path: "/api/review/summary?unit=zz" })).status,
    400,
  );
});
