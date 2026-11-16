/* =============================================================================
 * Book Studio collaboration: books written together inside ONE class (Language Page).
 * Merge rules: shared/class-platform/book-merge.js. Schema: book-collab-schema.js (migration 0015).
 * Docs: access-practice-lab/BOOK-STUDIO.md ("Writing together").
 *
 * Who may do what (checked on every route, server side):
 *   - Only a learner who joined this class (x-class-student) can share, join or edit, and only books of this class.
 *   - Owner: shares the book, sets a collaborator to viewer/editor, removes one, stops sharing.
 *   - Editor: changes items. Viewer: reads. Nobody edits a book the teacher set read-only.
 *   - Teacher (site key or class passcode): lists the class's books and participants, sets a book read-only,
 *     changes a role, removes a participant, deletes a shared copy, turns the space off for the class.
 *
 * Routes (/api/class/books/*):
 *   POST share   { code, meta }                                  student -> { bookId, bookCode, rev }
 *   POST join    { code, bookCode }                              student -> { bookId, title, role }
 *   GET  mine?code=                                              student -> { enabled, books }
 *   POST sync    { code, bookId, since, ops?, presence? }        member  -> { rev, results, items, more, presence, members }
 *   POST media   { code, bookId, mediaId, mime, data }           editor  -> { ok }
 *   GET  media?code=&bookId=&mediaId=                            member or teacher -> JPEG bytes
 *   POST member  { code, bookId, studentId, role | remove }      owner or teacher
 *   POST leave   { code, bookId }                                member (not the owner)
 *   POST unshare { code, bookId }                                owner or teacher: deletes the shared copy
 *   GET  class?code=                                             teacher -> { enabled, books with participants }
 *   POST space   { code, enabled }                               teacher
 *   POST lock    { code, bookId, locked }                        teacher (read-only for everyone)
 * ========================================================================== */

import {
  applyOps,
  COLLAB,
  cleanMeta,
  cleanOps,
  isBookCode,
  isCollabBookId,
  isItemId,
  isMediaId,
  itemBytes,
  META_ID,
} from "../../../shared/class-platform/book-merge.js";
import { normalizeCode } from "../../../shared/class-platform/contract.js";
import { createRateLimiter, json, tooManyRequests } from "../http.js";
import { deleteBookStatements } from "./book-collab-schema.js";
import {
  guardHit,
  guardOver,
  parseJson,
  randomHex,
  randomSecret,
  studentFromRequest,
  teacherRole,
} from "./store.js";

const DAY_MS = 24 * 60 * 60 * 1000;
export const BOOK_TTL_MS = COLLAB.retentionDays * DAY_MS;
const JOIN_FAIL_MAX = 20; // wrong book codes per learner per hour
const HOUR_MS = 60 * 60 * 1000;
const PARAMS = 90; // D1 allows 100 bound parameters per statement

// Keyed per learner, not per IP: a whole class shares one school address.
const perStudent = createRateLimiter({ max: 120, windowMs: 60_000 });
const mediaLimit = createRateLimiter({ max: 40, windowMs: 60_000 });

const chunks = (list, n = PARAMS) => {
  const out = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out;
};
const marks = (n) => Array.from({ length: n }, () => "?").join(", ");

function rowToItem(r) {
  return {
    id: r.item_id,
    kind: r.kind,
    page: r.page_id,
    ord: Number(r.ord),
    data: r.deleted ? null : parseJson(r.data, null),
    rev: Number(r.rev),
    by: r.by_id,
    deleted: !!r.deleted,
  };
}

async function spaceEnabled(db, code) {
  const row = await db
    .prepare(`SELECT enabled FROM class_platform_book_space WHERE code = ?`)
    .bind(code)
    .first();
  return row ? !!row.enabled : true;
}

const liveBook = (db, code, bookId, now) =>
  isCollabBookId(bookId)
    ? db
        .prepare(
          `SELECT * FROM class_platform_book WHERE book_id = ? AND code = ? AND expires_at >= ?`,
        )
        .bind(bookId, code, now)
        .first()
    : null;

const memberOf = (db, bookId, studentId) =>
  db
    .prepare(`SELECT * FROM class_platform_book_member WHERE book_id = ? AND student_id = ?`)
    .bind(bookId, studentId)
    .first();

const canEdit = (book, mem) => !book.locked && (mem?.role === "owner" || mem?.role === "editor");

async function membersOf(db, bookId) {
  const res = await db
    .prepare(
      `SELECT m.student_id, m.role, m.edits, m.last_seen_at, m.page_id, m.selected_id, m.editing, s.alias
       FROM class_platform_book_member m JOIN class_platform_book b ON b.book_id = m.book_id
       JOIN class_platform_student s ON s.code = b.code AND s.student_id = m.student_id
       WHERE m.book_id = ? AND m.role != 'removed' ORDER BY m.joined_at`,
    )
    .bind(bookId)
    .all();
  return (res.results || []).map((m) => ({
    studentId: m.student_id,
    alias: m.alias,
    role: m.role,
    edits: Number(m.edits),
    lastSeen: Number(m.last_seen_at),
    pageId: m.page_id,
    selected: m.selected_id,
    editing: !!m.editing,
  }));
}

/** Everything applyOps needs about the items these ops touch. */
async function loadState(db, bookId, ops) {
  const ids = new Set([META_ID]);
  const deletedPages = [];
  for (const op of ops) {
    ids.add(op.id);
    if (op.page) ids.add(op.page);
    if (op.type === "deletePage") deletedPages.push(op.id);
  }
  const items = new Map();
  for (const part of chunks([...ids])) {
    const res = await db
      .prepare(
        `SELECT * FROM class_platform_book_item WHERE book_id = ? AND item_id IN (${marks(part.length)})`,
      )
      .bind(bookId, ...part)
      .all();
    for (const r of res.results || []) items.set(r.item_id, rowToItem(r));
  }
  for (const part of chunks(deletedPages)) {
    const res = await db
      .prepare(
        `SELECT * FROM class_platform_book_item WHERE book_id = ? AND kind = 'el' AND deleted = 0 AND page_id IN (${marks(part.length)})`,
      )
      .bind(bookId, ...part)
      .all();
    for (const r of res.results || []) items.set(r.item_id, rowToItem(r));
  }
  const counts = await db
    .prepare(
      `SELECT COUNT(*) AS n, COALESCE(SUM(size), 0) AS bytes FROM class_platform_book_item WHERE book_id = ? AND kind = 'page' AND deleted = 0`,
    )
    .bind(bookId)
    .first();
  const total = await db
    .prepare(
      `SELECT COALESCE(SUM(size), 0) AS bytes FROM class_platform_book_item WHERE book_id = ?`,
    )
    .bind(bookId)
    .first();
  const pageIds = [...new Set(ops.filter((o) => o.page).map((o) => o.page))];
  for (const it of items.values()) if (it.kind === "el" && it.page) pageIds.push(it.page);
  const elCount = new Map();
  for (const part of chunks([...new Set(pageIds)])) {
    const res = await db
      .prepare(
        `SELECT page_id, COUNT(*) AS n FROM class_platform_book_item WHERE book_id = ? AND kind = 'el' AND deleted = 0 AND page_id IN (${marks(part.length)}) GROUP BY page_id`,
      )
      .bind(bookId, ...part)
      .all();
    for (const r of res.results || []) elCount.set(r.page_id, Number(r.n));
  }
  return { items, pageCount: Number(counts?.n) || 0, elCount, bytes: Number(total?.bytes) || 0 };
}

const itemStatement = (db, bookId, it, guard) =>
  db
    .prepare(
      `INSERT INTO class_platform_book_item (book_id, item_id, kind, page_id, ord, data, size, rev, by_id, deleted)
       SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM class_platform_book WHERE book_id = ? AND rev = ? AND write_token = ?)
       ON CONFLICT(book_id, item_id) DO UPDATE SET kind = excluded.kind, page_id = excluded.page_id, ord = excluded.ord,
         data = excluded.data, size = excluded.size, rev = excluded.rev, by_id = excluded.by_id, deleted = excluded.deleted`,
    )
    .bind(
      bookId,
      it.id,
      it.kind,
      it.page || "",
      Number(it.ord) || 0,
      it.deleted ? "" : JSON.stringify(it.data),
      it.deleted ? 0 : itemBytes(it.data),
      it.rev,
      it.by,
      it.deleted ? 1 : 0,
      ...guard,
    );

/**
 * Apply ops with optimistic concurrency on the book's rev: the first statement of the batch claims rev+1 only if the
 * rev is still the one this request read; every item write is conditioned on that claim (the batch is one
 * transaction), so two simultaneous syncs can never interleave or reuse a revision. A lost race is retried.
 */
async function writeOps(db, bookId, studentId, ops, now) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const book = await db
      .prepare(`SELECT rev FROM class_platform_book WHERE book_id = ?`)
      .bind(bookId)
      .first();
    if (!book) return { error: "book-gone" };
    const base = Number(book.rev);
    const rev = base + 1;
    const state = await loadState(db, bookId, ops);
    const { results, writes } = applyOps(state, ops, { rev, by: studentId });
    if (!writes.size) return { results, rev: base };
    let bytes = state.bytes;
    for (const it of writes.values()) {
      const old = state.items.get(it.id);
      bytes +=
        (it.deleted ? 0 : itemBytes(it.data)) - (old && !old.deleted ? itemBytes(old.data) : 0);
    }
    if (bytes > COLLAB.maxBookBytes) return { error: "book-too-large" };
    const token = randomHex(8);
    const guard = [bookId, rev, token];
    const meta = writes.get(META_ID);
    const changed = results.filter((r) => r.status !== "rejected").length;
    const res = await db.batch([
      db
        .prepare(
          `UPDATE class_platform_book SET rev = ?, write_token = ?, updated_at = ?, expires_at = ?, title = COALESCE(?, title)
           WHERE book_id = ? AND rev = ?`,
        )
        .bind(rev, token, now, now + BOOK_TTL_MS, meta ? meta.data.title : null, bookId, base),
      ...[...writes.values()].map((it) => itemStatement(db, bookId, it, guard)),
      db
        .prepare(
          `UPDATE class_platform_book_member SET edits = edits + ? WHERE book_id = ? AND student_id = ?
           AND EXISTS (SELECT 1 FROM class_platform_book WHERE book_id = ? AND rev = ? AND write_token = ?)`,
        )
        .bind(changed, bookId, studentId, ...guard),
    ]);
    if (Number(res[0]?.meta?.changes) !== 1) continue;
    await foldTombstones(db, bookId, rev);
    return { results, rev };
  }
  return { error: "busy" };
}

/** Too many deletion markers: drop them and raise the floor, so a device that slept past it reloads the book. */
async function foldTombstones(db, bookId, rev) {
  const row = await db
    .prepare(`SELECT COUNT(*) AS n FROM class_platform_book_item WHERE book_id = ? AND deleted = 1`)
    .bind(bookId)
    .first();
  if (Number(row?.n) <= COLLAB.maxTombstones) return;
  await db.batch([
    db
      .prepare(
        `DELETE FROM class_platform_book_item WHERE book_id = ? AND deleted = 1 AND rev <= ?`,
      )
      .bind(bookId, rev),
    db.prepare(`UPDATE class_platform_book SET floor_rev = ? WHERE book_id = ?`).bind(rev, bookId),
  ]);
}

/** Items changed after `since`, a page at a time; a page never splits one revision. */
async function changesSince(db, bookId, since) {
  const res = await db
    .prepare(
      `SELECT * FROM class_platform_book_item WHERE book_id = ? AND rev > ? ORDER BY rev, item_id LIMIT ?`,
    )
    .bind(bookId, since, COLLAB.changesPage)
    .all();
  let rows = res.results || [];
  if (rows.length < COLLAB.changesPage) return { items: rows.map(rowToItem), more: false };
  const last = Number(rows[rows.length - 1].rev);
  const tail = await db
    .prepare(
      `SELECT * FROM class_platform_book_item WHERE book_id = ? AND rev = ? ORDER BY item_id`,
    )
    .bind(bookId, last)
    .all();
  rows = [...rows.filter((r) => Number(r.rev) < last), ...(tail.results || [])];
  return { items: rows.map(rowToItem), more: true, next: last };
}

function cleanPresence(raw) {
  const p = raw && typeof raw === "object" ? raw : {};
  return {
    pageId: isItemId(p.pageId) ? p.pageId : "",
    selected: isItemId(p.selected) ? p.selected : "",
    editing: p.editing === true ? 1 : 0,
  };
}

function decodeJpeg(data) {
  if (typeof data !== "string" || data.length > Math.ceil(COLLAB.maxPictureBytes * 1.4))
    return { error: "picture-too-large" };
  let bin;
  try {
    bin = atob(data);
  } catch {
    return { error: "invalid-picture" };
  }
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  if (bytes.length > COLLAB.maxPictureBytes) return { error: "picture-too-large" };
  if (bytes.length < 100 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff)
    return { error: "invalid-picture" };
  return { bytes };
}

async function newBookCode(db, code) {
  for (let i = 0; i < 8; i++) {
    const candidate = randomSecret(6);
    const hit = await db
      .prepare(`SELECT 1 AS x FROM class_platform_book WHERE code = ? AND book_code = ?`)
      .bind(code, candidate)
      .first();
    if (!hit) return candidate;
  }
  return null;
}

async function classBooks(db, code, now) {
  const books =
    (
      await db
        .prepare(
          `SELECT b.book_id, b.book_code, b.title, b.owner_id, b.locked, b.updated_at, b.expires_at, s.alias AS owner_alias
           FROM class_platform_book b JOIN class_platform_student s ON s.code = b.code AND s.student_id = b.owner_id
           WHERE b.code = ? AND b.expires_at >= ? ORDER BY b.updated_at DESC`,
        )
        .bind(code, now)
        .all()
    ).results || [];
  const out = [];
  for (const b of books) {
    const pages = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM class_platform_book_item WHERE book_id = ? AND kind = 'page' AND deleted = 0`,
      )
      .bind(b.book_id)
      .first();
    out.push({
      bookId: b.book_id,
      bookCode: b.book_code,
      title: b.title,
      ownerId: b.owner_id,
      ownerAlias: b.owner_alias,
      locked: !!b.locked,
      pages: Number(pages?.n) || 0,
      updatedAt: Number(b.updated_at),
      expiresAt: Number(b.expires_at),
      members: (await membersOf(db, b.book_id)).map(({ selected, editing, pageId, ...m }) => ({
        ...m,
        here: now - m.lastSeen <= COLLAB.presenceMs,
      })),
    });
  }
  return out;
}

export async function handleBooks(ctx, action) {
  const { db, body, url, now, method, fail, request, env } = ctx;
  const q = url.searchParams;
  const found = await ctx.requireClass(db, method === "GET" ? q.get("code") : body?.code, now);
  if (found.error) return found.error;
  const { cls } = found;
  if (cls.app !== "language") return fail("invalid-app");
  const teacher = await teacherRole(request, env, cls);
  const student = teacher ? null : await studentFromRequest(request, db, cls);
  if (!teacher && !student) return fail("unauthorized", 401);
  if (student && perStudent(`${cls.code}:${student.student_id}`, now)) return tooManyRequests(10);
  const key = `${method} ${action}`;
  const enabled = await spaceEnabled(db, cls.code);
  const bookIdIn = method === "GET" ? q.get("bookId") : body?.bookId;

  // ── teacher-only ──
  if (key === "GET class") {
    if (!teacher) return fail("unauthorized", 401);
    return { ok: true, enabled, books: await classBooks(db, cls.code, now) };
  }
  if (key === "POST space") {
    if (!teacher) return fail("unauthorized", 401);
    if (typeof body?.enabled !== "boolean") return fail("invalid-enabled");
    await db
      .prepare(
        `INSERT INTO class_platform_book_space (code, enabled, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(code) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`,
      )
      .bind(cls.code, body.enabled ? 1 : 0, now)
      .run();
    return { ok: true, enabled: body.enabled };
  }
  if (key === "POST lock") {
    if (!teacher) return fail("unauthorized", 401);
    if (typeof body?.locked !== "boolean") return fail("invalid-locked");
    const book = await liveBook(db, cls.code, bookIdIn, now);
    if (!book) return fail("book-gone", 404);
    await db
      .prepare(`UPDATE class_platform_book SET locked = ? WHERE book_id = ?`)
      .bind(body.locked ? 1 : 0, book.book_id)
      .run();
    return { ok: true, locked: body.locked };
  }

  // ── learners: only while the class space is on ──
  if (key === "GET mine") {
    if (!student) return fail("students-only", 403);
    if (!enabled) return { ok: true, enabled: false, books: [] };
    const res = await db
      .prepare(
        `SELECT b.book_id, b.book_code, b.title, b.locked, b.updated_at, m.role, s.alias AS owner_alias
         FROM class_platform_book_member m JOIN class_platform_book b ON b.book_id = m.book_id
         JOIN class_platform_student s ON s.code = b.code AND s.student_id = b.owner_id
         WHERE m.student_id = ? AND m.role != 'removed' AND b.code = ? AND b.expires_at >= ?
         ORDER BY b.updated_at DESC`,
      )
      .bind(student.student_id, cls.code, now)
      .all();
    return {
      ok: true,
      enabled: true,
      books: (res.results || []).map((b) => ({
        bookId: b.book_id,
        bookCode: b.book_code,
        title: b.title,
        role: b.locked && b.role !== "removed" ? "viewer" : b.role,
        owner: b.role === "owner",
        ownerAlias: b.owner_alias,
        locked: !!b.locked,
        updatedAt: Number(b.updated_at),
      })),
    };
  }
  if (student && !enabled && key !== "GET media") return fail("collab-off", 403);

  if (key === "POST share") {
    if (!student) return fail("students-only", 403);
    const owned = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM class_platform_book WHERE code = ? AND owner_id = ? AND expires_at >= ?`,
      )
      .bind(cls.code, student.student_id, now)
      .first();
    if (Number(owned?.n) >= COLLAB.maxBooksPerOwner) return fail("too-many-books", 409);
    const bookCode = await newBookCode(db, cls.code);
    if (!bookCode) return fail("code-collision", 503);
    const bookId = `k${randomHex(6)}`;
    const meta = cleanMeta(body?.meta);
    await db.batch([
      db
        .prepare(
          `INSERT INTO class_platform_book (book_id, code, book_code, owner_id, title, rev, created_at, updated_at, expires_at)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        )
        .bind(
          bookId,
          cls.code,
          bookCode,
          student.student_id,
          meta.title,
          now,
          now,
          now + BOOK_TTL_MS,
        ),
      db
        .prepare(
          `INSERT INTO class_platform_book_member (book_id, student_id, role, joined_at, last_seen_at) VALUES (?, ?, 'owner', ?, ?)`,
        )
        .bind(bookId, student.student_id, now, now),
      db
        .prepare(
          `INSERT INTO class_platform_book_item (book_id, item_id, kind, page_id, ord, data, size, rev, by_id, deleted)
           VALUES (?, ?, 'meta', '', 0, ?, ?, 1, ?, 0)`,
        )
        .bind(bookId, META_ID, JSON.stringify(meta), itemBytes(meta), student.student_id),
    ]);
    return { ok: true, bookId, bookCode, rev: 1, role: "owner", title: meta.title };
  }

  if (key === "POST join") {
    if (!student) return fail("students-only", 403);
    const bucket = `bookjoin:${cls.code}:${student.student_id}`;
    if (await guardOver(db, bucket, JOIN_FAIL_MAX)) return tooManyRequests(600);
    const bookCode = normalizeCode(body?.bookCode);
    const book = isBookCode(bookCode)
      ? await db
          .prepare(
            `SELECT * FROM class_platform_book WHERE code = ? AND book_code = ? AND expires_at >= ?`,
          )
          .bind(cls.code, bookCode, now)
          .first()
      : null;
    if (!book) {
      await guardHit(db, bucket, now, HOUR_MS);
      return fail("book-not-found", 404);
    }
    const existing = await memberOf(db, book.book_id, student.student_id);
    if (existing?.role === "removed") return fail("removed", 403);
    if (!existing) {
      const n = await db
        .prepare(
          `SELECT COUNT(*) AS n FROM class_platform_book_member WHERE book_id = ? AND role != 'removed'`,
        )
        .bind(book.book_id)
        .first();
      if (Number(n?.n) >= COLLAB.maxMembers) return fail("book-full", 409);
      await db
        .prepare(
          `INSERT INTO class_platform_book_member (book_id, student_id, role, joined_at, last_seen_at) VALUES (?, ?, 'editor', ?, ?)`,
        )
        .bind(book.book_id, student.student_id, now, now)
        .run();
    }
    return {
      ok: true,
      bookId: book.book_id,
      bookCode: book.book_code,
      title: book.title,
      role: existing?.role || "editor",
    };
  }

  // Every remaining route names one live book of this class.
  const book = await liveBook(db, cls.code, bookIdIn, now);
  if (!book) return fail("book-gone", 404);
  const mem = student ? await memberOf(db, book.book_id, student.student_id) : null;
  if (student && (!mem || mem.role === "removed")) return fail("not-member", 403);
  const isOwner = mem?.role === "owner";

  if (key === "POST sync") {
    if (!student) return fail("students-only", 403);
    const since = Number.isInteger(body?.since) && body.since >= 0 ? body.since : 0;
    let results = [];
    let opsRev = 0;
    if (Array.isArray(body?.ops) && body.ops.length) {
      const cleaned = cleanOps(body.ops);
      if (!cleaned.ok) return fail(cleaned.error, cleaned.error === "item-too-large" ? 413 : 400);
      if (!canEdit(book, mem)) {
        // Read-only: nothing is written; each rejected item comes back so the device returns to the shared copy.
        const state = await loadState(db, book.book_id, cleaned.ops);
        results = cleaned.ops.map((op, i) => {
          const item = state.items.get(op.id);
          return {
            i,
            id: op.id,
            status: "rejected",
            reason: "read-only",
            ...(item ? { item } : {}),
          };
        });
      } else {
        const out = await writeOps(db, book.book_id, student.student_id, cleaned.ops, now);
        if (out.error === "book-gone") return fail("book-gone", 404);
        if (out.error === "book-too-large") return fail("book-too-large", 413);
        if (out.error) return fail(out.error, 409);
        results = out.results;
        opsRev = out.rev;
      }
    }
    const p = cleanPresence(body?.presence);
    const stmts = [
      db
        .prepare(
          `UPDATE class_platform_book_member SET last_seen_at = ?, page_id = ?, selected_id = ?, editing = ? WHERE book_id = ? AND student_id = ?`,
        )
        .bind(now, p.pageId, p.selected, p.editing, book.book_id, student.student_id),
    ];
    // Opening a book keeps it: the 30-day clock restarts at most once a day.
    if (Number(book.expires_at) - now < BOOK_TTL_MS - DAY_MS)
      stmts.push(
        db
          .prepare(`UPDATE class_platform_book SET expires_at = ? WHERE book_id = ?`)
          .bind(now + BOOK_TTL_MS, book.book_id),
      );
    await db.batch(stmts);
    const fresh = await db
      .prepare(`SELECT rev, floor_rev, locked FROM class_platform_book WHERE book_id = ?`)
      .bind(book.book_id)
      .first();
    const floor = Number(fresh.floor_rev);
    const resync = since > 0 && since < floor;
    const changes = await changesSince(db, book.book_id, resync ? 0 : since);
    const members = await membersOf(db, book.book_id);
    const media = await db
      .prepare(`SELECT media_id FROM class_platform_book_media WHERE book_id = ?`)
      .bind(book.book_id)
      .all();
    const role = fresh.locked ? "viewer" : mem.role === "owner" ? "owner" : mem.role;
    return {
      ok: true,
      bookId: book.book_id,
      bookCode: book.book_code,
      rev: Number(fresh.rev),
      opsRev,
      resync,
      results,
      items: changes.items,
      more: changes.more,
      next: changes.more ? changes.next : Number(fresh.rev),
      role,
      owner: mem.role === "owner",
      locked: !!fresh.locked,
      me: student.student_id,
      media: (media.results || []).map((m) => m.media_id),
      members: members.map(({ selected, editing, pageId, ...m }) => m),
      presence: members
        .filter((m) => m.studentId !== student.student_id && now - m.lastSeen <= COLLAB.presenceMs)
        .map((m) => ({
          studentId: m.studentId,
          alias: m.alias,
          role: m.role,
          pageId: m.pageId,
          selected: m.selected,
          editing: m.editing,
        })),
    };
  }

  if (key === "POST media") {
    if (!student) return fail("students-only", 403);
    if (!canEdit(book, mem)) return fail("read-only", 403);
    if (mediaLimit(`${cls.code}:${student.student_id}`, now)) return tooManyRequests(20);
    if (!isMediaId(body?.mediaId)) return fail("invalid-media");
    if (body?.mime !== "image/jpeg") return fail("invalid-picture");
    const pic = decodeJpeg(body?.data);
    if (pic.error) return fail(pic.error, pic.error === "picture-too-large" ? 413 : 400);
    const have = await db
      .prepare(
        `SELECT COUNT(*) AS n, SUM(CASE WHEN media_id = ? THEN 1 ELSE 0 END) AS same FROM class_platform_book_media WHERE book_id = ?`,
      )
      .bind(body.mediaId, book.book_id)
      .first();
    if (Number(have?.same)) return { ok: true, mediaId: body.mediaId, existing: true };
    if (Number(have?.n) >= COLLAB.maxPictures) return fail("too-many-pictures", 409);
    await db
      .prepare(
        `INSERT OR IGNORE INTO class_platform_book_media (book_id, media_id, mime, bytes, size, by_id, created_at) VALUES (?, ?, 'image/jpeg', ?, ?, ?, ?)`,
      )
      .bind(book.book_id, body.mediaId, pic.bytes, pic.bytes.length, student.student_id, now)
      .run();
    return { ok: true, mediaId: body.mediaId };
  }

  if (key === "GET media") {
    const mediaId = q.get("mediaId");
    if (!isMediaId(mediaId)) return fail("invalid-media");
    const row = await db
      .prepare(
        `SELECT mime, bytes FROM class_platform_book_media WHERE book_id = ? AND media_id = ?`,
      )
      .bind(book.book_id, mediaId)
      .first();
    if (!row) return fail("not-found", 404);
    const bytes =
      row.bytes instanceof ArrayBuffer ? new Uint8Array(row.bytes) : new Uint8Array(row.bytes);
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (key === "POST member") {
    if (!teacher && !isOwner) return fail("owner-only", 403);
    const target = body?.studentId;
    if (typeof target !== "string" || target === book.owner_id) return fail("invalid-student");
    const row = await memberOf(db, book.book_id, target);
    if (!row || row.role === "removed") return fail("not-found", 404);
    if (body?.remove === true) {
      await db
        .prepare(
          `UPDATE class_platform_book_member SET role = 'removed', editing = 0, selected_id = '' WHERE book_id = ? AND student_id = ?`,
        )
        .bind(book.book_id, target)
        .run();
      return { ok: true, removed: true };
    }
    if (body?.role !== "editor" && body?.role !== "viewer") return fail("invalid-role");
    await db
      .prepare(
        `UPDATE class_platform_book_member SET role = ? WHERE book_id = ? AND student_id = ?`,
      )
      .bind(body.role, book.book_id, target)
      .run();
    return { ok: true, role: body.role };
  }

  if (key === "POST leave") {
    if (!student) return fail("students-only", 403);
    if (isOwner) return fail("owner-cannot-leave", 409);
    await db
      .prepare(`DELETE FROM class_platform_book_member WHERE book_id = ? AND student_id = ?`)
      .bind(book.book_id, student.student_id)
      .run();
    return { ok: true };
  }

  if (key === "POST unshare") {
    if (!teacher && !isOwner) return fail("owner-only", 403);
    await db.batch(deleteBookStatements(db, book.book_id));
    return { ok: true, deleted: book.book_id };
  }

  return fail("not-found", 404);
}
