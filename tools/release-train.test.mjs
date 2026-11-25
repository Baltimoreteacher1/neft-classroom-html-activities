// Release trains: create, changelog, list, current, one-step rollback and the rollback drill (G-59 style):
// create r1, create r2, roll back, and the current release is r1 with a manifest identical byte for byte.
import assert from "node:assert/strict";
import { test } from "node:test";
import { indexRows } from "../functions/_lib/review/blocks.js";
import {
  diffManifests,
  manifestText,
  nextReleaseId,
  rollbackTarget,
} from "../functions/_lib/review/release.js";
import { createRelease, currentRelease, rollback } from "../functions/_lib/review/release-store.js";
import { onRequest as releaseOne } from "../functions/api/review/releases/[id].js";
import { onRequest as current } from "../functions/api/review/releases/current.js";
import { onRequest as rollbackFn } from "../functions/api/review/releases/rollback.js";
import { onRequest as releases } from "../functions/api/review/releases.js";
import { call, count, human, newEnv } from "./review-test-kit.mjs";

const rowsOf = (hashes) => Object.entries(hashes).map(([id, hash]) => ({ id, hash }));
const H = (c) => c.repeat(64);
const NOV = Date.UTC(2026, 10, 25, 12);

test("pure: manifest is canonical, changelog diffs added/removed/changed, ids count up per month", () => {
  const a = manifestText(rowsOf({ b: H("1"), a: H("2") }));
  assert.equal(a, manifestText(rowsOf({ a: H("2"), b: H("1") }))); // order independent
  assert.equal(a, `{"a":"${H("2")}","b":"${H("1")}"}`);
  const d = diffManifests(
    { a: H("2"), b: H("1"), gone: H("3") },
    { a: H("2"), b: H("9"), fresh: H("4") },
  );
  assert.deepEqual(d, {
    added: ["fresh"],
    removed: ["gone"],
    changed: ["b"],
    counts: { added: 1, removed: 1, changed: 1, total: 3 },
  });
  assert.equal(diffManifests(null, { x: H("1") }).counts.added, 1);
  assert.equal(nextReleaseId([], NOV), "content-2026.11.1");
  assert.equal(
    nextReleaseId(["content-2026.11.1", "content-2026.11.9", "content-2026.10.40"], NOV),
    "content-2026.11.10",
  );
  assert.throws(
    () => rollbackTarget(null, () => null),
    (e) => e.code === "no-current-release",
  );
  assert.throws(
    () => rollbackTarget({ id: "r1", previous_id: null }, () => null),
    (e) => e.code === "no-previous-release",
  );
  assert.deepEqual(
    rollbackTarget({ id: "r2", previous_id: "r1" }, (id) => ({ id })),
    { from: "r2", to: "r1" },
  );
});

test("rollback drill: r1, r2, rollback => current is r1 and its manifest is byte-identical", async () => {
  const { env, sqlite } = newEnv();
  const db = env.DB;
  const r1 = await createRelease(db, {
    rows: rowsOf({ a: H("1"), b: H("2") }),
    verifiersRan: ["language-demand"],
    createdBy: "Pat Reviewer",
    now: NOV,
  });
  const manifest1 = sqlite
    .prepare("SELECT manifest_json, manifest_digest FROM content_release WHERE id = ?")
    .get(r1.id);
  const r2 = await createRelease(db, {
    rows: rowsOf({ a: H("1"), b: H("3"), c: H("4") }),
    verifiersRan: ["language-demand", "reading-level"],
    createdBy: "Pat Reviewer",
    now: NOV + 1000,
  });
  assert.equal(r1.id, "content-2026.11.1");
  assert.equal(r2.id, "content-2026.11.2");
  assert.equal(r1.previous_id, null);
  assert.equal(r2.previous_id, r1.id);
  assert.deepEqual(r2.changelog.counts, { added: 1, removed: 0, changed: 1, total: 3 });
  assert.equal((await currentRelease(db)).id, r2.id);

  const res = await call(rollbackFn, env, {
    method: "POST",
    path: "/api/review/releases/rollback",
    body: { reviewer: human() },
  });
  assert.equal(res.status, 200, res.text);
  assert.deepEqual([res.json.from, res.json.to], [r2.id, r1.id]);
  const now = await currentRelease(db);
  assert.equal(now.id, r1.id);
  assert.equal(now.manifest_json, manifest1.manifest_json); // byte for byte
  assert.equal(now.manifest_digest, manifest1.manifest_digest);
  assert.equal(
    sqlite.prepare("SELECT status FROM content_release WHERE id = ?").get(r2.id).status,
    "rolled_back",
  );
  assert.equal(
    sqlite.prepare("SELECT reason, moved_by FROM release_pointer").get().reason,
    "rollback",
  );

  // control: the endpoint for the current release agrees, and nothing earlier is left to roll back to
  const cur = await call(current, env, { path: "/api/review/releases/current" });
  assert.equal(cur.json.current.id, r1.id);
  assert.deepEqual(cur.json.current.verifiers_ran, ["language-demand"]);
  const again = await call(rollbackFn, env, {
    method: "POST",
    path: "/api/review/releases/rollback",
    body: { reviewer: human() },
  });
  assert.equal(again.status, 409);
  assert.equal(again.json.error, "no-previous-release");
  assert.equal((await currentRelease(db)).id, r1.id);

  // a release cut after a rollback diffs against the rolled-back-to release and links to it
  const r3 = await createRelease(db, {
    rows: rowsOf({ a: H("1"), b: H("2"), z: H("5") }),
    verifiersRan: [],
    createdBy: "Pat Reviewer",
    now: NOV + 2000,
  });
  assert.equal(r3.id, "content-2026.11.3");
  assert.equal(r3.previous_id, r1.id);
  assert.deepEqual(r3.changelog.added, ["z"]);
  // drift compares the live blocks with the current manifest: all live blocks are new to it, its 3 ids are gone
  const live = await indexRows();
  const drift = await call(current, env, { path: "/api/review/releases/current?drift=1" });
  assert.deepEqual(drift.json.drift, {
    added: live.length,
    removed: 3,
    changed: 0,
    total: live.length,
  });

  const one = await call(releaseOne, env, {
    path: `/api/review/releases/${r1.id}`,
    params: { id: r1.id },
  });
  assert.equal(one.json.release.manifest.a, H("1"));
  assert.equal((await call(releaseOne, env, { params: { id: "content-2026.1.1" } })).status, 404);
});

test("releases are immutable snapshots: only status may change, nothing is deleted", async () => {
  const { env, sqlite } = newEnv();
  const r = await createRelease(env.DB, {
    rows: rowsOf({ a: H("1") }),
    verifiersRan: [],
    createdBy: "Pat",
    now: NOV,
  });
  for (const col of [
    "manifest_json",
    "changelog_json",
    "verifiers_ran_json",
    "created_by",
    "manifest_digest",
  ]) {
    assert.throws(
      () => sqlite.prepare(`UPDATE content_release SET ${col} = 'x' WHERE id = ?`).run(r.id),
      /immutable/,
      col,
    );
  }
  assert.throws(
    () =>
      sqlite.prepare("UPDATE content_release SET id = 'content-2026.11.9' WHERE id = ?").run(r.id),
    /immutable/,
  );
  assert.throws(() => sqlite.prepare("DELETE FROM content_release").run(), /never deleted/);
  assert.throws(() => sqlite.prepare("UPDATE content_release SET status = 'nope'").run(), /CHECK/);
  assert.ok(
    sqlite.prepare("UPDATE content_release SET status = 'rolled_back' WHERE id = ?").run(r.id),
    "control: status may move",
  );
  assert.throws(
    () =>
      sqlite
        .prepare(
          "INSERT INTO content_release (id, manifest_json, manifest_digest, changelog_json, verifiers_ran_json, created_by, created_at) VALUES ('bad-id', '{}', ?, '{}', '[]', 'p', 1)",
        )
        .run(H("a")),
    /CHECK/,
  );
});

test("endpoints: gate, create from the live blocks, list, drift, input checks", async () => {
  const { env, sqlite } = newEnv();
  const post = (body, key) =>
    call(releases, env, { method: "POST", path: "/api/review/releases", body, key });
  assert.equal((await post({ reviewer: human(), verifiersRan: [] }, "")).status, 401);
  assert.equal((await call(current, env, { key: "" })).status, 401);
  assert.equal((await call(releases, env, { key: "" })).status, 401);
  assert.equal(
    (await post({ reviewer: { ...human(), actor: "model" }, verifiersRan: [] })).status,
    403,
  );
  assert.equal((await post({ reviewer: human(), verifiersRan: "all" })).status, 400);
  assert.equal((await post({ reviewer: human(), verifiersRan: ["Bad Name!"] })).status, 400);
  assert.equal((await post({ reviewer: human(), verifiersRan: [], manifest: {} })).status, 400); // a client cannot bring its own manifest
  assert.equal(count(sqlite, "content_release"), 0);
  assert.equal(
    (await call(current, env, { path: "/api/review/releases/current" })).json.current,
    null,
  );

  const made = await post({
    reviewer: human(),
    verifiersRan: ["reading-level", "language-demand", "reading-level"],
  });
  assert.equal(made.status, 200, made.text);
  const live = await indexRows();
  assert.equal(made.json.release.changelog.counts.total, live.length);
  assert.equal(made.json.release.changelog.counts.added, live.length);
  assert.deepEqual(made.json.release.verifiers_ran, ["language-demand", "reading-level"]);
  const stored = sqlite.prepare("SELECT manifest_json FROM content_release").get().manifest_json;
  assert.equal(stored, manifestText(live));
  const list = await call(releases, env, { path: "/api/review/releases" });
  assert.equal(list.json.releases.length, 1);
  assert.equal(list.json.releases[0].changelog.total, live.length);
  assert.ok(!("manifest_json" in list.json.releases[0]));
  const drift = await call(current, env, { path: "/api/review/releases/current?drift=1" });
  assert.deepEqual(drift.json.drift, { added: 0, removed: 0, changed: 0, total: live.length });
});

test("a second rollback with nothing earlier to return to changes nothing", async () => {
  const { env, sqlite } = newEnv();
  const db = env.DB;
  const r1 = await createRelease(db, {
    rows: rowsOf({ a: H("1") }),
    verifiersRan: [],
    createdBy: "Pat",
    now: NOV,
  });
  const r2 = await createRelease(db, {
    rows: rowsOf({ a: H("2") }),
    verifiersRan: [],
    createdBy: "Pat",
    now: NOV + 1,
  });
  await rollback(db, { movedBy: "Pat", now: NOV + 2 });
  await assert.rejects(
    rollback(db, { movedBy: "Sam", now: NOV + 3 }),
    (e) => e.code === "no-previous-release",
  );
  assert.equal(sqlite.prepare("SELECT release_id FROM release_pointer").get().release_id, r1.id);
  assert.equal(
    sqlite.prepare("SELECT status FROM content_release WHERE id = ?").get(r1.id).status,
    "published",
  );
  assert.equal(
    sqlite.prepare("SELECT status FROM content_release WHERE id = ?").get(r2.id).status,
    "rolled_back",
  );
});
