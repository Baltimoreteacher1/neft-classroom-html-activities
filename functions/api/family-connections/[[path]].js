import { initialState, normalizeSnapshot } from "./domain.js";

const HISTORY_LIMIT = 5;
const MAX_BODY_BYTES = 180_000;

function json(data, status = 200, cache = "no-store") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cache,
      "x-content-type-options": "nosniff",
    },
  });
}

function requestAccess(context) {
  return {
    accessConfigured: context.data?.teacherAccessConfigured === true,
    hasTeacherAccess: context.data?.teacherAuthorized === true,
  };
}

async function readBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > MAX_BODY_BYTES) {
    const error = new Error("The draft is too large.");
    error.status = 413;
    throw error;
  }
  const source = await request.text();
  if (source.length > MAX_BODY_BYTES) {
    const error = new Error("The draft is too large.");
    error.status = 413;
    throw error;
  }
  try {
    return JSON.parse(source);
  } catch {
    const error = new Error("The request body must be valid JSON.");
    error.status = 400;
    throw error;
  }
}

export function createMemoryStore() {
  let state = initialState();
  return {
    async read() {
      return structuredClone(state);
    },
    async saveDraft(snapshot, expectedRevision) {
      if (state.draft.revision !== expectedRevision) return null;
      state.draft = { ...structuredClone(snapshot), revision: expectedRevision + 1 };
      return structuredClone(state.draft);
    },
    async publish() {
      const previous = structuredClone(state.published);
      const nextRevision = Math.max(state.draft.revision, state.published.revision) + 1;
      state.published = {
        ...structuredClone(state.draft),
        revision: nextRevision,
        publishedAt: new Date().toISOString(),
      };
      state.draft = structuredClone(state.published);
      state.history.unshift(previous);
      state.history = state.history.slice(0, HISTORY_LIMIT);
      return structuredClone(state.published);
    },
  };
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS family_connections_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      draft_json TEXT NOT NULL,
      published_json TEXT NOT NULL,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS family_connections_history (
      revision INTEGER PRIMARY KEY,
      snapshot_json TEXT NOT NULL,
      published_at TEXT NOT NULL
    )`),
  ]);
  const existing = await db.prepare("SELECT id FROM family_connections_state WHERE id = 1").first();
  if (!existing) {
    const state = initialState();
    await db
      .prepare(
        "INSERT INTO family_connections_state (id, draft_json, published_json, revision, updated_at) VALUES (1, ?, ?, 0, ?)",
      )
      .bind(JSON.stringify(state.draft), JSON.stringify(state.published), new Date().toISOString())
      .run();
  }
}

function createD1Store(db) {
  return {
    async read() {
      await ensureSchema(db);
      const row = await db
        .prepare("SELECT draft_json, published_json FROM family_connections_state WHERE id = 1")
        .first();
      const historyRows = await db
        .prepare(
          "SELECT snapshot_json FROM family_connections_history ORDER BY revision DESC LIMIT ?",
        )
        .bind(HISTORY_LIMIT)
        .all();
      return {
        draft: JSON.parse(row.draft_json),
        published: JSON.parse(row.published_json),
        history: (historyRows.results ?? []).map((item) => JSON.parse(item.snapshot_json)),
      };
    },
    async saveDraft(snapshot, expectedRevision) {
      await ensureSchema(db);
      const next = { ...snapshot, revision: expectedRevision + 1 };
      const result = await db
        .prepare(
          "UPDATE family_connections_state SET draft_json = ?, revision = ?, updated_at = ? WHERE id = 1 AND revision = ?",
        )
        .bind(JSON.stringify(next), next.revision, new Date().toISOString(), expectedRevision)
        .run();
      return result.meta?.changes === 1 ? next : null;
    },
    async publish() {
      const state = await this.read();
      const nextRevision = Math.max(state.draft.revision, state.published.revision) + 1;
      const published = {
        ...state.draft,
        revision: nextRevision,
        publishedAt: new Date().toISOString(),
      };
      await db.batch([
        db
          .prepare(
            "INSERT OR REPLACE INTO family_connections_history (revision, snapshot_json, published_at) VALUES (?, ?, ?)",
          )
          .bind(
            state.published.revision,
            JSON.stringify(state.published),
            state.published.publishedAt ?? new Date(0).toISOString(),
          ),
        db
          .prepare(
            "UPDATE family_connections_state SET draft_json = ?, published_json = ?, revision = ?, updated_at = ? WHERE id = 1",
          )
          .bind(
            JSON.stringify(published),
            JSON.stringify(published),
            nextRevision,
            published.publishedAt,
          ),
        db.prepare(
          `DELETE FROM family_connections_history WHERE revision NOT IN (
            SELECT revision FROM family_connections_history ORDER BY revision DESC LIMIT ${HISTORY_LIMIT}
          )`,
        ),
      ]);
      return published;
    },
  };
}

export async function handleFamilyConnectionsRequest(context, suppliedStore, accessOverride) {
  const { request, env, params } = context;
  const path = Array.isArray(params?.path) ? params.path[0] : params?.path || "";
  const method = request.method.toUpperCase();
  const access = accessOverride ?? requestAccess(context);
  const store = suppliedStore ?? (env.DB ? createD1Store(env.DB) : null);

  if (!store) return json({ ok: false, error: "publishing-unavailable" }, 503);
  if (path === "published" && method === "GET") {
    const state = await store.read();
    return json(
      { ok: true, published: state.published },
      200,
      "public, max-age=60, must-revalidate",
    );
  }
  if (!["draft", "history", "publish"].includes(path)) {
    return json({ ok: false, error: "not-found" }, 404);
  }
  if (!access.accessConfigured) return json({ ok: false, error: "access-not-configured" }, 503);
  if (!access.hasTeacherAccess) return json({ ok: false, error: "unauthorized" }, 401);

  if (path === "draft" && method === "GET") {
    const state = await store.read();
    return json({ ok: true, draft: state.draft });
  }
  if (path === "history" && method === "GET") {
    const state = await store.read();
    return json({ ok: true, history: state.history });
  }
  if (path === "draft" && method === "PUT") {
    try {
      const candidate = normalizeSnapshot(await readBody(request));
      const saved = await store.saveDraft(candidate, candidate.revision);
      if (!saved) return json({ ok: false, error: "revision-conflict" }, 409);
      return json({ ok: true, draft: saved });
    } catch (error) {
      return json({ ok: false, error: error.message }, error.status || 400);
    }
  }
  if (path === "publish" && method === "POST") {
    return json({ ok: true, published: await store.publish() });
  }
  return json({ ok: false, error: "method-not-allowed" }, 405);
}

export async function onRequest(context) {
  return handleFamilyConnectionsRequest(context);
}
