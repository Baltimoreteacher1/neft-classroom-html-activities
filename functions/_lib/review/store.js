// D1 access for the review log and its projection. Every write is one batch (one transaction): the event
// row and the review_state upsert land together or not at all.
import { eventDigest, GENESIS_DIGEST } from "../../../shared/content-schema/review-chain.js";

/** The chain head moved between this writer's read and its insert (prior_digest is UNIQUE). */
export class ChainConflict extends Error {}

const EVENT_COLUMNS =
  "seq, id, block_id, kind, dimension, lang, from_state, to_state, reviewer_name, reviewer_role, reviewer_date, actor, content_hash, comment, bulk_id, created_at, prior_digest, digest";

export const isMissingTable = (err) =>
  /no such table: (review|content_release|release_pointer)/i.test(String(err?.message));

export async function chainHead(db) {
  const row = await db.prepare("SELECT digest FROM review_event ORDER BY seq DESC LIMIT 1").first();
  return row?.digest ?? GENESIS_DIGEST;
}

/** Stored review_state rows for one block, a unit's blocks (id prefix), or everything. */
export async function stateRows(db, { blockId = null, unitId = null } = {}) {
  if (blockId)
    return (await db.prepare("SELECT * FROM review_state WHERE block_id = ?1").bind(blockId).all())
      .results;
  if (unitId) {
    return (
      await db
        .prepare("SELECT * FROM review_state WHERE block_id = ?1 OR block_id LIKE ?2")
        .bind(`${unitId}:studio`, `${unitId}-l%`)
        .all()
    ).results;
  }
  return (await db.prepare("SELECT * FROM review_state").all()).results;
}

export function groupByBlock(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.block_id)) map.set(r.block_id, []);
    map.get(r.block_id).push(r);
  }
  return map;
}

/** Last review activity per block: { blockId -> ms timestamp }. Drives the queue's age column. */
export async function lastActivity(db) {
  const { results } = await db
    .prepare("SELECT block_id, MAX(updated_at) AS at FROM review_state GROUP BY block_id")
    .all();
  return new Map(results.map((r) => [r.block_id, Number(r.at)]));
}

/**
 * Append events to the log (and project them into review_state) atomically. `events` come from decide();
 * each is chained to the one before it. Throws ChainConflict when another writer appended first.
 */
export async function appendEvents(db, events, { now, bulkId = null, kind = "decide" }) {
  let prior = await chainHead(db);
  const statements = [];
  const rows = [];
  for (const e of events) {
    const id = crypto.randomUUID();
    const row = {
      id,
      blockId: e.blockId,
      kind,
      dimension: e.dimension,
      lang: e.lang,
      fromState: e.fromState,
      toState: e.toState,
      reviewer: e.reviewer,
      contentHash: e.contentHash,
      comment: e.comment,
      bulkId,
      createdAt: now,
      priorDigest: prior,
    };
    row.digest = await eventDigest(row);
    prior = row.digest;
    rows.push(row);
    statements.push(
      db
        .prepare(
          `INSERT INTO review_event (id, block_id, kind, dimension, lang, from_state, to_state, reviewer_name, reviewer_role,
             reviewer_date, actor, content_hash, snapshot_json, comment, bulk_id, created_at, prior_digest, digest)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`,
        )
        .bind(
          id,
          e.blockId,
          kind,
          e.dimension,
          e.lang,
          e.fromState,
          e.toState,
          e.reviewer.name,
          e.reviewer.role,
          e.reviewer.date,
          e.reviewer.actor,
          e.contentHash,
          JSON.stringify(e.snapshot),
          e.comment,
          bulkId,
          now,
          row.priorDigest,
          row.digest,
        ),
      db
        .prepare(
          `INSERT INTO review_state (block_id, dimension, lang, state, reviewed_hash, reviewer_name, reviewer_role,
             reviewer_date, event_seq, updated_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, (SELECT seq FROM review_event WHERE id = ?9), ?10)
           ON CONFLICT (block_id, dimension, lang) DO UPDATE SET state = excluded.state,
             reviewed_hash = excluded.reviewed_hash, reviewer_name = excluded.reviewer_name,
             reviewer_role = excluded.reviewer_role, reviewer_date = excluded.reviewer_date,
             event_seq = excluded.event_seq, updated_at = excluded.updated_at`,
        )
        .bind(
          e.blockId,
          e.dimension,
          e.lang,
          e.toState,
          e.toState === "reviewed" ? e.contentHash : null,
          e.reviewer.name,
          e.reviewer.role,
          e.reviewer.date,
          id,
          now,
        ),
    );
  }
  try {
    await db.batch(statements);
  } catch (err) {
    if (/UNIQUE constraint failed: review_event\.(prior_digest|digest)/i.test(String(err?.message)))
      throw new ChainConflict();
    throw err;
  }
  return rows;
}

/** Log rows (no snapshots) in ascending seq, for export and chain verification. */
export async function listEvents(db, { afterSeq = 0, limit = 5000, blockId = null } = {}) {
  const where = ["seq > ?1"];
  const binds = [afterSeq];
  if (blockId) {
    where.push("block_id = ?2");
    binds.push(blockId);
  }
  const sql = `SELECT ${EVENT_COLUMNS} FROM review_event WHERE ${where.join(" AND ")} ORDER BY seq ASC LIMIT ${Number(limit) | 0}`;
  return (
    await db
      .prepare(sql)
      .bind(...binds)
      .all()
  ).results;
}

/** Newest first, for the block detail history. */
export async function recentEvents(db, blockId, limit = 50) {
  return (
    await db
      .prepare(
        `SELECT ${EVENT_COLUMNS} FROM review_event WHERE block_id = ?1 ORDER BY seq DESC LIMIT ${Number(limit) | 0}`,
      )
      .bind(blockId)
      .all()
  ).results;
}

/** The newest approval of this block with the content it approved, for the side-by-side diff. */
export async function lastReviewed(db, blockId) {
  const row = await db
    .prepare(
      `SELECT ${EVENT_COLUMNS}, snapshot_json FROM review_event WHERE block_id = ?1 AND to_state = 'reviewed'
       ORDER BY seq DESC LIMIT 1`,
    )
    .bind(blockId)
    .first();
  if (!row) return null;
  const { snapshot_json: snapshot, ...meta } = row;
  return { ...meta, snapshot: JSON.parse(snapshot) };
}

/** The newest individual (non-bulk) decision on one target by one reviewer for exactly this content hash. */
export async function individualDecision(
  db,
  { blockId, dimension, lang, reviewerName, contentHash, since },
) {
  return db
    .prepare(
      `SELECT to_state, created_at FROM review_event
       WHERE kind = 'decide' AND block_id = ?1 AND dimension = ?2 AND lang = ?3 AND reviewer_name = ?4
         AND content_hash = ?5 AND created_at >= ?6
       ORDER BY seq DESC LIMIT 1`,
    )
    .bind(blockId, dimension, lang || "", reviewerName, contentHash, since)
    .first();
}
