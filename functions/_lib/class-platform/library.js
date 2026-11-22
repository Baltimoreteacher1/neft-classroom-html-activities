/* =============================================================================
 * Cross-device teacher library (functions/api/class/library/*).
 *
 * Stores teacher-saved materials (vocab sets, support-engine configs, Book Studio editions, pathways)
 * behind the existing class teacher gate (x-teacher-key or x-class-teacher passcode). No student data.
 *
 * Routes:
 *   GET  /api/class/library/list?code=&kind=           (teacher) -> { ok, items }
 *   POST /api/class/library/save   { code, kind, itemId, title, payload, updatedAt? } (teacher)
 *   POST /api/class/library/sync   { code, kind?, items } (teacher) -> LWW merge + { ok, items }
 *   POST /api/class/library/delete { code, kind, itemId } (teacher) -> tombstone delete
 * ========================================================================== */

import { cleanText } from "../../../shared/class-platform/contract.js";
import { parseJson } from "./store.js";

export const LIBRARY_KINDS = Object.freeze([
  "vocab_set",
  "support_config",
  "book_edition",
  "pathway",
]);

const ITEM_ID = /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,79}$/;
const MAX_PAYLOAD_BYTES = 65536;
const MAX_ITEMS_PER_CLASS = 200;
const MAX_SYNC_BATCH = 50;

const validKind = (k) => LIBRARY_KINDS.includes(String(k || ""));
const validId = (id) => ITEM_ID.test(String(id || ""));

function serializePayload(payload) {
  if (payload == null || typeof payload !== "object") return null;
  const raw = JSON.stringify(payload);
  if (raw.length > MAX_PAYLOAD_BYTES) return { error: "payload-too-large" };
  return { raw };
}

function rowToItem(row) {
  return {
    kind: row.kind,
    itemId: row.item_id,
    title: row.title || "",
    payload: parseJson(row.payload_json, null),
    updatedAt: Number(row.updated_at) || 0,
  };
}

async function listItems(db, code, kind) {
  const res = kind
    ? await db
        .prepare(
          `SELECT kind, item_id, title, payload_json, updated_at
           FROM class_platform_teacher_library
           WHERE code = ? AND kind = ? AND deleted = 0
           ORDER BY updated_at DESC`,
        )
        .bind(code, kind)
        .all()
    : await db
        .prepare(
          `SELECT kind, item_id, title, payload_json, updated_at
           FROM class_platform_teacher_library
           WHERE code = ? AND deleted = 0
           ORDER BY updated_at DESC`,
        )
        .bind(code)
        .all();
  return (res.results || []).map(rowToItem);
}

async function upsertItem(db, code, { kind, itemId, title, payloadRaw, updatedAt }) {
  const existing = await db
    .prepare(
      `SELECT updated_at FROM class_platform_teacher_library WHERE code = ? AND kind = ? AND item_id = ?`,
    )
    .bind(code, kind, itemId)
    .first();
  if (existing && Number(existing.updated_at) > updatedAt) return false;
  if (!existing) {
    const countRow = await db
      .prepare(
        `SELECT COUNT(*) AS n FROM class_platform_teacher_library WHERE code = ? AND deleted = 0`,
      )
      .bind(code)
      .first();
    if (Number(countRow?.n || 0) >= MAX_ITEMS_PER_CLASS) return "library-full";
  }
  await db
    .prepare(
      `INSERT INTO class_platform_teacher_library (code, kind, item_id, title, payload_json, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, 0)
       ON CONFLICT (code, kind, item_id) DO UPDATE SET
         title = excluded.title,
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at,
         deleted = 0
       WHERE excluded.updated_at >= class_platform_teacher_library.updated_at`,
    )
    .bind(code, kind, itemId, title, payloadRaw, updatedAt)
    .run();
  return true;
}

export async function handleLibrary(ctx, action) {
  const { db, body, url, now, method, fail } = ctx;
  const rawCode = method === "GET" ? url.searchParams.get("code") : body?.code;
  const auth = await ctx.requireTeacher(ctx, rawCode);
  if (auth.error) return auth.error;
  const code = auth.cls.code;
  const key = `${method} ${action}`;

  if (key === "GET list") {
    const kind = url.searchParams.get("kind") || "";
    if (kind && !validKind(kind)) return fail("invalid-kind");
    return { ok: true, items: await listItems(db, code, kind) };
  }

  if (key === "POST save") {
    const kind = String(body?.kind || "");
    const itemId = String(body?.itemId || "");
    if (!validKind(kind)) return fail("invalid-kind");
    if (!validId(itemId)) return fail("invalid-item-id");
    const serialized = serializePayload(body?.payload);
    if (!serialized) return fail("invalid-payload");
    if (serialized.error) return fail(serialized.error, 413);
    const title = cleanText(body?.title ?? "", 120);
    const updatedAt = Math.min(
      now + 60_000,
      Math.max(1, Math.trunc(Number(body?.updatedAt) || now)),
    );
    const res = await upsertItem(db, code, {
      kind,
      itemId,
      title,
      payloadRaw: serialized.raw,
      updatedAt,
    });
    if (res === "library-full") return fail("library-full", 409);
    const row = await db
      .prepare(
        `SELECT kind, item_id, title, payload_json, updated_at
         FROM class_platform_teacher_library
         WHERE code = ? AND kind = ? AND item_id = ? AND deleted = 0`,
      )
      .bind(code, kind, itemId)
      .first();
    return { ok: true, item: row ? rowToItem(row) : null };
  }

  if (key === "POST sync") {
    const filterKind = body?.kind ? String(body.kind) : "";
    if (filterKind && !validKind(filterKind)) return fail("invalid-kind");
    const incoming = Array.isArray(body?.items) ? body.items.slice(0, MAX_SYNC_BATCH) : [];
    for (const entry of incoming) {
      const kind = String(entry?.kind || filterKind || "");
      const itemId = String(entry?.itemId || "");
      if (!validKind(kind) || !validId(itemId)) continue;
      const serialized = serializePayload(entry?.payload);
      if (!serialized || serialized.error) continue;
      const title = cleanText(entry?.title ?? "", 120);
      const updatedAt = Math.min(
        now + 60_000,
        Math.max(1, Math.trunc(Number(entry?.updatedAt) || now)),
      );
      const res = await upsertItem(db, code, {
        kind,
        itemId,
        title,
        payloadRaw: serialized.raw,
        updatedAt,
      });
      if (res === "library-full") break;
    }
    return { ok: true, items: await listItems(db, code, filterKind) };
  }

  if (key === "POST delete") {
    const kind = String(body?.kind || "");
    const itemId = String(body?.itemId || "");
    if (!validKind(kind)) return fail("invalid-kind");
    if (!validId(itemId)) return fail("invalid-item-id");
    await db
      .prepare(
        `INSERT INTO class_platform_teacher_library (code, kind, item_id, title, payload_json, updated_at, deleted)
         VALUES (?, ?, ?, '', '{}', ?, 1)
         ON CONFLICT (code, kind, item_id) DO UPDATE SET
           deleted = 1,
           updated_at = excluded.updated_at`,
      )
      .bind(code, kind, itemId, now)
      .run();
    return { ok: true, deleted: itemId };
  }

  return fail("not-found", 404);
}
