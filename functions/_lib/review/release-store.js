// D1 access for release trains: create (snapshot + move pointer), list, current, one-step rollback.
import { DecisionError } from "./decide.js";
import {
  diffManifests,
  manifestDigest,
  manifestText,
  nextReleaseId,
  rollbackTarget,
} from "./release.js";

const LIST_COLUMNS =
  "seq, id, manifest_digest, changelog_json, verifiers_ran_json, created_by, created_at, status, previous_id";

export async function currentRelease(db) {
  return db
    .prepare(
      `SELECT r.* FROM release_pointer p JOIN content_release r ON r.id = p.release_id WHERE p.id = 1`,
    )
    .first();
}

export async function releaseById(db, id) {
  return db.prepare("SELECT * FROM content_release WHERE id = ?1").bind(id).first();
}

export async function listReleases(db, limit = 50) {
  return (
    await db
      .prepare(
        `SELECT ${LIST_COLUMNS} FROM content_release ORDER BY seq DESC LIMIT ${Number(limit) | 0}`,
      )
      .all()
  ).results;
}

/**
 * Cut a release from the live block rows and make it current in one transaction. The changelog is the diff
 * against whatever is current right now (so a release cut after a rollback diffs against the rolled-back one).
 */
export async function createRelease(db, { rows, verifiersRan, createdBy, now }) {
  const ids = (await db.prepare("SELECT id FROM content_release").all()).results.map((r) => r.id);
  const id = nextReleaseId(ids, now);
  const current = await currentRelease(db);
  const text = manifestText(rows);
  const changelog = diffManifests(
    current ? JSON.parse(current.manifest_json) : null,
    JSON.parse(text),
  );
  const digest = await manifestDigest(text);
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO content_release (id, manifest_json, manifest_digest, changelog_json, verifiers_ran_json, created_by, created_at, status, previous_id)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 'published', ?8)`,
        )
        .bind(
          id,
          text,
          digest,
          JSON.stringify(changelog),
          JSON.stringify(verifiersRan),
          createdBy,
          now,
          current?.id ?? null,
        ),
      db
        .prepare(
          `INSERT INTO release_pointer (id, release_id, moved_by, reason, updated_at) VALUES (1, ?1, ?2, 'create', ?3)
           ON CONFLICT (id) DO UPDATE SET release_id = excluded.release_id, moved_by = excluded.moved_by,
             reason = excluded.reason, updated_at = excluded.updated_at`,
        )
        .bind(id, createdBy, now),
    ]);
  } catch (err) {
    if (/UNIQUE constraint failed: content_release\.id/i.test(String(err?.message))) {
      throw new DecisionError(
        "release-conflict",
        "another release was cut at the same moment; try again",
        409,
      );
    }
    throw err;
  }
  return {
    id,
    previous_id: current?.id ?? null,
    manifest_digest: digest,
    changelog,
    verifiers_ran: verifiersRan,
  };
}

/**
 * Move the pointer back to the current release's previous release, in one step. The status update is guarded
 * by the same pointer check as the move, so a concurrent change makes both no-ops and the caller is told.
 */
export async function rollback(db, { movedBy, now }) {
  const current = await currentRelease(db);
  const previous = current?.previous_id ? await releaseById(db, current.previous_id) : null;
  const { from, to } = rollbackTarget(current, () => previous);
  const results = await db.batch([
    db
      .prepare(
        `UPDATE content_release SET status = 'rolled_back'
         WHERE id = ?1 AND EXISTS (SELECT 1 FROM release_pointer WHERE id = 1 AND release_id = ?1)`,
      )
      .bind(from),
    db
      .prepare(
        `UPDATE release_pointer SET release_id = ?1, moved_by = ?2, reason = 'rollback', updated_at = ?3
         WHERE id = 1 AND release_id = ?4`,
      )
      .bind(to, movedBy, now, from),
  ]);
  if (!results[1]?.meta?.changes)
    throw new DecisionError(
      "release-conflict",
      "the current release changed during rollback; try again",
      409,
    );
  return { from, to };
}
