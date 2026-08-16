/* =============================================================================
 * /api/plan-notes/* — storage and auto-annotation for /curriculum/plan-notes/
 * -----------------------------------------------------------------------------
 * Routes (all teacher-gated except OPTIONS):
 *
 *   GET    health                 bindings present? AI configured?
 *   GET    vocab                  the controlled vocabulary the UI offers
 *   GET    docs                   uploaded plans, newest first
 *   POST   docs                   register/link a doc (idempotent by sha256)
 *   DELETE docs/<sha>             forget a doc and its blob
 *   PUT    blob/<sha>             upload document bytes (base64 in JSON body)
 *   GET    blob/<sha>             download document bytes
 *   GET    notes?anchorKey=…      notes for one plan
 *   POST   notes                  create (accepts a batch)
 *   PATCH  notes/<id>             edit
 *   DELETE notes/<id>             soft delete
 *   POST   annotate               plan text in, structured draft notes out
 *
 * AUTH — env.TEACHER_KEY, via ?key= or x-teacher-key, matching functions/api/
 * forge.js: 503 when the key is unset (so a missing binding reads as
 * "not configured" rather than "wrong password"), 401 when it is wrong.
 *
 * DEGRADATION — every binding is optional and each absence is survivable and
 * named. No blob store: repo-lesson annotation still works, uploads are refused
 * with a reason. No AI key: hand annotation works, the annotate route says so.
 * A tool that half-works loudly beats one that fails silently at 7:40am.
 * ========================================================================== */

import { handler } from "../../_lib/http.js";
import { validateNote } from "../../_lib/plan-notes-validate.js";
import { ACTIVITIES, LESSONS, MISCONCEPTIONS, STANDARDS } from "../../_lib/plan-vocab.js";
import { teacherAuthorized } from "../../_lib/teacher-auth.js";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
  "Cache-Control": "no-store",
};

const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
const CLAUDE_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_VERSION = "2023-06-01";
const WORKERS_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct";

const MAX_PLAN_CHARS = 24000;
// 8 MB of document, which is ~10.7 MB once base64-encoded, under the 12 MB body
// cap set on the shared handler below. A district lesson plan is a fraction of
// this; the ceiling exists to stop someone dropping a video in by accident.
const MAX_UPLOAD_MB = 8;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MAX_NOTES_PER_BATCH = 40;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });

function shortId() {
  const alphabet = "23456789abcdefghijkmnpqrstuvwxyz";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

const isSha256 = (s) => typeof s === "string" && /^[a-f0-9]{64}$/.test(s);
const nowMs = () => Date.now();

/* ── Schema ────────────────────────────────────────────────────────────────── */

async function ensureTables(db) {
  await db.batch([
    db.prepare(
      `CREATE TABLE IF NOT EXISTS plan_doc (
         sha256 TEXT PRIMARY KEY, filename TEXT NOT NULL, mime TEXT NOT NULL,
         page_count INTEGER, lesson_id TEXT, source_label TEXT, bytes INTEGER,
         uploaded_at INTEGER NOT NULL)`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS plan_doc_lesson ON plan_doc (lesson_id)`),
    db.prepare(
      `CREATE TABLE IF NOT EXISTS plan_note (
         id TEXT PRIMARY KEY, anchor_key TEXT NOT NULL,
         anchor_ref TEXT NOT NULL DEFAULT '{}', kind TEXT NOT NULL,
         body TEXT NOT NULL DEFAULT '', body_alt TEXT NOT NULL DEFAULT '',
         misconception_tags TEXT NOT NULL DEFAULT '[]',
         standards TEXT NOT NULL DEFAULT '[]',
         activity_refs TEXT NOT NULL DEFAULT '[]',
         level INTEGER, timing_min INTEGER,
         origin TEXT NOT NULL DEFAULT 'hand',
         created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
         deleted_at INTEGER)`,
    ),
    db.prepare(`CREATE INDEX IF NOT EXISTS plan_note_anchor ON plan_note (anchor_key, deleted_at)`),
  ]);
}

const parseJsonColumn = (v, fallback) => {
  try {
    const out = JSON.parse(v);
    return out ?? fallback;
  } catch {
    return fallback;
  }
};

function rowToNote(r) {
  return {
    id: r.id,
    anchorKey: r.anchor_key,
    anchorRef: parseJsonColumn(r.anchor_ref, {}),
    kind: r.kind,
    body: r.body,
    bodyAlt: r.body_alt,
    misconceptionTags: parseJsonColumn(r.misconception_tags, []),
    standards: parseJsonColumn(r.standards, []),
    activityRefs: parseJsonColumn(r.activity_refs, []),
    level: r.level,
    timingMin: r.timing_min,
    origin: r.origin,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/* ── Auto-annotation ───────────────────────────────────────────────────────── */

/* The model is given the real vocabulary and told to choose from it. It is not
 * asked to be creative — it is asked to read a plan the way an experienced
 * teacher skims one, and to say where the trouble is using ids that already
 * exist. Everything it returns still goes through validateNote(), so an
 * invented misconception id is dropped exactly like a hand-typed typo. */
function annotationSystemPrompt(lesson) {
  const tagLines = Object.entries(MISCONCEPTIONS).map(
    ([id, m]) => `  ${id} — ${m.label}${m.watchFor ? ` (watch for: ${m.watchFor})` : ""}`,
  );
  return [
    "You are a veteran Grade 6 mathematics teacher marking up a lesson plan you are about to",
    "teach tomorrow. You have taught this course for years. You annotate the way an experienced",
    "teacher actually does: sparse, specific, and only where you have something real to say.",
    "",
    "You output ONE JSON object and nothing else. No prose, no markdown fences. It must parse",
    "with JSON.parse on the first try. Shape:",
    '  {"notes":[{"kind":…,"quote":…,"page":…,"body":…,"bodyAlt":…,"misconceptionTags":[…],',
    '             "activityRefs":[…],"level":…,"timingMin":…}]}',
    "",
    "NOTE KINDS — choose the kind that fits; do not force one:",
    '  "watch-for"  a place students predictably go wrong. REQUIRES body and >=1',
    "               misconceptionTags id from the list below. This is the most valuable kind.",
    '  "swap"       a differentiation move. REQUIRES body (what the plan says), bodyAlt (what',
    "               you do instead) and level (0 = IEP/most support, 1 = support, 2 = enrichment).",
    '  "timing"     a section whose stated or implied time is unrealistic. REQUIRES timingMin.',
    '  "resource"   a spot where one of the teacher\'s own activities fits. REQUIRES activityRefs.',
    '  "note"       anything else worth remembering. REQUIRES body.',
    "",
    "ANCHORING — every note MUST include a `quote`: 6 to 20 words copied EXACTLY, character for",
    "character, from the plan text. That is how the note pins itself to the page. If you cannot",
    "quote it exactly, omit the note. Never paraphrase a quote. Include `page` when the plan text",
    "is marked with page separators.",
    "",
    "MISCONCEPTION IDS — use ONLY these. Never invent one. A note with no fitting id should be",
    'kind "note" instead of a forced "watch-for":',
    ...tagLines,
    "",
    "RULES:",
    "1. Between 5 and 14 notes. Fewer good notes beat many obvious ones.",
    "2. Never restate what the plan already says. A note that adds nothing is worse than no note.",
    "3. Never write a note about lesson objectives, standards alignment, or materials lists.",
    "4. Level 1 means students who need support and Level 2 means enrichment. NEVER use the word",
    '   "ESOL" or any language-proficiency label in any body text.',
    "5. Write in the teacher's own voice: plain, direct, second person. No jargon, no hedging.",
    lesson
      ? `\nCONTEXT: this plan is for lesson ${lesson.id}, "${lesson.title}"${
          lesson.standard ? `, standard ${lesson.standard}` : ""
        }.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/* Only activities plausibly relevant to this lesson are offered. Handing the
 * model all 171 paths invites a confident wrong pin, and a resource note that
 * points at the wrong unit is worse than no resource note. */
function relevantActivities(lesson) {
  if (!lesson) return [];
  return ACTIVITIES.filter((a) => a.unit === lesson.unit).slice(0, 30);
}

function annotationUserPrompt(planText, lesson) {
  const acts = relevantActivities(lesson);
  const actBlock = acts.length
    ? [
        "",
        "TEACHER'S OWN ACTIVITIES available for this unit (use the exact path in activityRefs):",
        ...acts.map((a) => `  ${a.path} — ${a.title} [${a.category}]`),
      ].join("\n")
    : "";
  return `LESSON PLAN TEXT:\n\n${planText.slice(0, MAX_PLAN_CHARS)}${actBlock}`;
}

function extractJsonObject(text) {
  if (typeof text !== "string") return null;
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callClaude(env, planText, lesson) {
  const resp = await fetch(CLAUDE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": CLAUDE_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: annotationSystemPrompt(lesson),
      messages: [{ role: "user", content: annotationUserPrompt(planText, lesson) }],
    }),
  });
  if (!resp.ok) {
    // Never surface the upstream body; it can carry account detail.
    return { ok: false, status: resp.status === 429 ? 429 : 502 };
  }
  const data = await resp.json().catch(() => null);
  const text = Array.isArray(data?.content)
    ? data.content
        .filter((b) => b?.type === "text" && typeof b.text === "string")
        .map((b) => b.text)
        .join("")
    : "";
  const parsed = extractJsonObject(text);
  if (!parsed) return { ok: false, status: 502 };
  return { ok: true, parsed, source: "claude" };
}

async function callWorkersAi(env, planText, lesson) {
  try {
    const out = await env.AI.run(WORKERS_AI_MODEL, {
      max_tokens: 3000,
      messages: [
        { role: "system", content: annotationSystemPrompt(lesson) },
        { role: "user", content: annotationUserPrompt(planText, lesson) },
      ],
    });
    const parsed = extractJsonObject(out?.response ?? "");
    if (!parsed) return { ok: false, status: 502 };
    return { ok: true, parsed, source: "workers-ai" };
  } catch {
    return { ok: false, status: 502 };
  }
}

/* Turn raw model output into notes that passed the same gate a hand-typed note
 * passes. Rejections are counted and reported rather than hidden — if a run
 * yields two notes out of twelve, Joel should be able to see that it did. */
function harvestNotes(parsed, anchorKey, planText) {
  const accepted = [];
  const rejected = [];
  const raw = Array.isArray(parsed?.notes) ? parsed.notes.slice(0, MAX_NOTES_PER_BATCH) : [];
  for (const r of raw) {
    const quote = typeof r?.quote === "string" ? r.quote.trim() : "";
    // A quote that is not actually in the plan cannot anchor anything, and a
    // note that floats is a note that gets ignored. Drop it.
    if (!quote || !planText.includes(quote)) {
      rejected.push({ reason: "quote not found in plan text", kind: r?.kind ?? "?" });
      continue;
    }
    const candidate = {
      anchorKey,
      anchorRef: { page: r?.page ?? null, quote, quoteStart: planText.indexOf(quote) },
      kind: r?.kind,
      body: r?.body,
      bodyAlt: r?.bodyAlt,
      misconceptionTags: r?.misconceptionTags,
      activityRefs: r?.activityRefs,
      standards: r?.standards,
      level: r?.level,
      timingMin: r?.timingMin,
    };
    const v = validateNote(candidate);
    if (v.ok) accepted.push(v.note);
    else rejected.push({ reason: v.errors[0], kind: r?.kind ?? "?" });
  }
  return { accepted, rejected };
}

/* ── Route handlers ────────────────────────────────────────────────────────── */

async function handleAnnotate(env, payload) {
  const hasClaude = !!env.ANTHROPIC_API_KEY;
  const hasWorkersAi = !!env.AI;
  if (!hasClaude && !hasWorkersAi) {
    return json(
      {
        error: "not-configured",
        message:
          "Auto-annotation needs ANTHROPIC_API_KEY (preferred) or the Workers AI binding. " +
          "Hand annotation works without either.",
      },
      503,
    );
  }
  const planText = typeof payload?.text === "string" ? payload.text.trim() : "";
  const anchorKey = typeof payload?.anchorKey === "string" ? payload.anchorKey.trim() : "";
  if (!planText || planText.length < 200) {
    return json(
      { error: "bad-request", message: "Send at least 200 characters of plan text." },
      400,
    );
  }
  if (!anchorKey) return json({ error: "bad-request", message: "anchorKey is required." }, 400);

  const lessonId = typeof payload?.lessonId === "string" ? payload.lessonId.trim() : "";
  const lesson = LESSONS.find((l) => l.id === lessonId) || null;
  const clipped = planText.slice(0, MAX_PLAN_CHARS);

  let result = hasClaude ? await callClaude(env, clipped, lesson) : { ok: false, status: 0 };
  if (!result.ok && hasWorkersAi) result = await callWorkersAi(env, clipped, lesson);
  if (!result.ok) {
    return json(
      {
        error: "upstream",
        message:
          result.status === 429
            ? "The model is rate-limited right now. Try again in a minute."
            : "The model did not return usable JSON. Try again, or annotate by hand.",
      },
      result.status === 429 ? 429 : 502,
    );
  }

  const { accepted, rejected } = harvestNotes(result.parsed, anchorKey, clipped);
  return json({
    ok: true,
    source: result.source,
    notes: accepted,
    accepted: accepted.length,
    rejected: rejected.length,
    rejections: rejected.slice(0, 10),
    truncated: planText.length > MAX_PLAN_CHARS,
  });
}

async function handleNotesGet(db, url) {
  const anchorKey = url.searchParams.get("anchorKey") || "";
  if (!anchorKey) return json({ error: "bad-request", message: "anchorKey is required." }, 400);
  const { results } = await db
    .prepare(
      `SELECT * FROM plan_note WHERE anchor_key = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    )
    .bind(anchorKey)
    .all();
  return json({ ok: true, notes: (results || []).map(rowToNote) });
}

async function handleNotesPost(db, payload) {
  const incoming = Array.isArray(payload?.notes)
    ? payload.notes
    : payload && typeof payload === "object"
      ? [payload]
      : [];
  if (!incoming.length) return json({ error: "bad-request", message: "No notes sent." }, 400);
  if (incoming.length > MAX_NOTES_PER_BATCH) {
    return json({ error: "bad-request", message: `At most ${MAX_NOTES_PER_BATCH} notes.` }, 400);
  }

  const valid = [];
  const errors = [];
  for (const [i, raw] of incoming.entries()) {
    const v = validateNote(raw);
    if (v.ok) valid.push({ note: v.note, origin: raw?.origin === "ai" ? "ai" : "hand" });
    else errors.push({ index: i, errors: v.errors });
  }
  // All-or-nothing: a partial write would leave Joel unsure which notes landed.
  if (errors.length)
    return json({ error: "invalid", message: "Some notes were rejected.", errors }, 400);

  const at = nowMs();
  const statements = valid.map(({ note, origin }) =>
    db
      .prepare(
        `INSERT INTO plan_note (id, anchor_key, anchor_ref, kind, body, body_alt,
           misconception_tags, standards, activity_refs, level, timing_min, origin,
           created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      )
      .bind(
        shortId(),
        note.anchorKey,
        JSON.stringify(note.anchorRef),
        note.kind,
        note.body,
        note.bodyAlt,
        JSON.stringify(note.misconceptionTags),
        JSON.stringify(note.standards),
        JSON.stringify(note.activityRefs),
        note.level,
        note.timingMin,
        origin,
        at,
        at,
      ),
  );
  await db.batch(statements);
  const anchorKey = valid[0].note.anchorKey;
  const { results } = await db
    .prepare(
      `SELECT * FROM plan_note WHERE anchor_key = ? AND deleted_at IS NULL ORDER BY created_at ASC`,
    )
    .bind(anchorKey)
    .all();
  return json({ ok: true, written: valid.length, notes: (results || []).map(rowToNote) });
}

async function handleNotePatch(db, payload, id) {
  const existing = await db.prepare(`SELECT * FROM plan_note WHERE id = ?`).bind(id).first();
  if (!existing || existing.deleted_at) return json({ error: "not-found" }, 404);
  // Validate the merged note, not the patch: a patch that removes the last
  // misconception tag from a watch-for has to fail the same way a create would.
  const merged = { ...rowToNote(existing), ...(payload || {}) };
  const v = validateNote(merged);
  if (!v.ok) return json({ error: "invalid", errors: v.errors }, 400);
  const n = v.note;
  await db
    .prepare(
      `UPDATE plan_note SET anchor_ref=?, kind=?, body=?, body_alt=?, misconception_tags=?,
         standards=?, activity_refs=?, level=?, timing_min=?, updated_at=? WHERE id=?`,
    )
    .bind(
      JSON.stringify(n.anchorRef),
      n.kind,
      n.body,
      n.bodyAlt,
      JSON.stringify(n.misconceptionTags),
      JSON.stringify(n.standards),
      JSON.stringify(n.activityRefs),
      n.level,
      n.timingMin,
      nowMs(),
      id,
    )
    .run();
  const row = await db.prepare(`SELECT * FROM plan_note WHERE id = ?`).bind(id).first();
  return json({ ok: true, note: rowToNote(row) });
}

async function handleDocsPost(db, payload) {
  const sha256 = typeof payload?.sha256 === "string" ? payload.sha256.toLowerCase() : "";
  if (!isSha256(sha256)) return json({ error: "bad-request", message: "sha256 is required." }, 400);
  const lessonId = typeof payload?.lessonId === "string" ? payload.lessonId.trim() : "";
  if (lessonId && !LESSONS.some((l) => l.id === lessonId)) {
    return json({ error: "invalid", message: `Unknown lesson id: ${lessonId.slice(0, 40)}` }, 400);
  }
  const existing = await db.prepare(`SELECT * FROM plan_doc WHERE sha256 = ?`).bind(sha256).first();
  if (existing) {
    // Re-uploading the same file is a no-op except for the link, which is the
    // one field a second pass is legitimately trying to change.
    await db
      .prepare(`UPDATE plan_doc SET lesson_id = ?, source_label = ? WHERE sha256 = ?`)
      .bind(
        lessonId || existing.lesson_id,
        String(payload?.sourceLabel ?? existing.source_label ?? ""),
        sha256,
      )
      .run();
    const row = await db.prepare(`SELECT * FROM plan_doc WHERE sha256 = ?`).bind(sha256).first();
    return json({ ok: true, deduped: true, doc: row });
  }
  await db
    .prepare(
      `INSERT INTO plan_doc (sha256, filename, mime, page_count, lesson_id, source_label, bytes, uploaded_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    )
    .bind(
      sha256,
      String(payload?.filename ?? "plan").slice(0, 200),
      String(payload?.mime ?? "application/octet-stream").slice(0, 100),
      Number.isFinite(Number(payload?.pageCount)) ? Math.round(Number(payload.pageCount)) : null,
      lessonId || null,
      String(payload?.sourceLabel ?? "").slice(0, 200),
      Number.isFinite(Number(payload?.bytes)) ? Math.round(Number(payload.bytes)) : null,
      nowMs(),
    )
    .run();
  const row = await db.prepare(`SELECT * FROM plan_doc WHERE sha256 = ?`).bind(sha256).first();
  return json({ ok: true, doc: row });
}

/* Uploads arrive base64-encoded inside the JSON body rather than as raw bytes.
 * That is a deliberate trade: the shared handler in functions/_lib/http.js reads
 * and parses the body before `handle` runs, so a raw binary PUT cannot reach
 * here intact — and being on the shared handler is what buys the method
 * allow-list, the body cap, and the JSON-not-HTML error floor that
 * functions/api-contract.test.mjs requires of every new endpoint. Base64 costs
 * 33% on the wire; a lesson plan is a few hundred KB. Worth it. */
function base64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

async function handleBlobPut(env, body, sha) {
  if (!env.PLAN_DOCS) {
    return json(
      {
        error: "not-configured",
        message:
          "The PLAN_DOCS store is not bound. Repo-lesson annotation still works; " +
          "document upload needs the binding.",
      },
      503,
    );
  }
  if (!isSha256(sha)) return json({ error: "bad-request", message: "Bad sha256." }, 400);
  const b64 = typeof body?.data === "string" ? body.data : "";
  if (!b64) return json({ error: "bad-request", message: "Empty upload." }, 400);

  let bytes;
  try {
    bytes = base64ToBytes(b64);
  } catch {
    return json({ error: "bad-request", message: "Upload was not valid base64." }, 400);
  }
  if (!bytes.length) return json({ error: "bad-request", message: "Empty upload." }, 400);
  if (bytes.length > MAX_UPLOAD_BYTES) {
    return json({ error: "too-large", message: `Plans must be under ${MAX_UPLOAD_MB} MB.` }, 413);
  }

  // The client claims a hash; verify it. An unverified hash is a key collision
  // waiting to hand back the wrong document.
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  if (actual !== sha) {
    return json({ error: "hash-mismatch", message: "Upload did not match its hash." }, 400);
  }
  await env.PLAN_DOCS.put(`doc/${sha}`, bytes, {
    metadata: { contentType: String(body?.mime || "application/octet-stream").slice(0, 100) },
  });
  return json({ ok: true, sha256: sha, bytes: bytes.length });
}

async function handleBlobGet(env, sha) {
  if (!env.PLAN_DOCS) return json({ error: "not-configured" }, 503);
  if (!isSha256(sha)) return json({ error: "bad-request" }, 400);
  const { value, metadata } = await env.PLAN_DOCS.getWithMetadata(`doc/${sha}`, {
    type: "arrayBuffer",
  });
  if (!value) return json({ error: "not-found" }, 404);
  return new Response(value, {
    status: 200,
    headers: {
      "Content-Type": metadata?.contentType || "application/octet-stream",
      // Private teacher documents: never cached by an intermediary.
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

export const onRequest = handler({
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  maxBodyBytes: MAX_BODY_BYTES,
  // The annotate route calls a paid model. This is not a security control — it
  // is there so a stuck retry loop cannot burn the API budget overnight.
  rateLimit: { max: 60, windowMs: 60_000 },
  async handle({ request, env, params, body, data }) {
    const method = request.method.toUpperCase();
    const url = new URL(request.url);
    const segments = Array.isArray(params.path) ? params.path : params.path ? [params.path] : [];
    const [route, arg] = segments;

    const auth = teacherAuthorized(env, request, url, data);
    if (auth === "not-configured") {
      return json(
        {
          error: "not-configured",
          message: "Set the TEACHER_KEY env var on the Pages project to enable Plan Notes.",
        },
        503,
      );
    }
    if (auth === "unauthorized") return json({ error: "unauthorized" }, 401);

    if (route === "health") {
      return json({
        ok: true,
        db: !!env.DB,
        blobs: !!env.PLAN_DOCS,
        ai: env.ANTHROPIC_API_KEY ? "claude" : env.AI ? "workers-ai" : "none",
      });
    }

    if (route === "vocab") {
      return json({
        ok: true,
        misconceptions: MISCONCEPTIONS,
        standards: STANDARDS,
        activities: ACTIVITIES,
        lessons: LESSONS,
      });
    }

    if (route === "blob") {
      if (method === "PUT") return handleBlobPut(env, body, arg);
      if (method === "GET") return handleBlobGet(env, arg);
      return json({ error: "method-not-allowed" }, 405);
    }

    if (route === "annotate") {
      if (method !== "POST") return json({ error: "method-not-allowed" }, 405);
      return handleAnnotate(env, body);
    }

    if (!env.DB) {
      return json(
        { error: "not-configured", message: "The D1 binding (DB) is missing on this deployment." },
        503,
      );
    }
    const db = env.DB;
    await ensureTables(db);

    if (route === "docs") {
      if (method === "GET") {
        const { results } = await db
          .prepare(`SELECT * FROM plan_doc ORDER BY uploaded_at DESC LIMIT 500`)
          .all();
        return json({ ok: true, docs: results || [] });
      }
      if (method === "POST") return handleDocsPost(db, body);
      if (method === "DELETE") {
        if (!isSha256(arg)) return json({ error: "bad-request" }, 400);
        await db.prepare(`DELETE FROM plan_doc WHERE sha256 = ?`).bind(arg).run();
        if (env.PLAN_DOCS) await env.PLAN_DOCS.delete(`doc/${arg}`);
        // Notes are soft-deleted, not dropped: if the same file is uploaded
        // again the annotations are still there.
        await db
          .prepare(
            `UPDATE plan_note SET deleted_at = ? WHERE anchor_key = ? AND deleted_at IS NULL`,
          )
          .bind(nowMs(), `doc:${arg}`)
          .run();
        return json({ ok: true });
      }
      return json({ error: "method-not-allowed" }, 405);
    }

    if (route === "notes") {
      if (method === "GET") return handleNotesGet(db, url);
      if (method === "POST") return handleNotesPost(db, body);
      if (method === "PATCH") {
        if (!arg) return json({ error: "bad-request", message: "note id required" }, 400);
        return handleNotePatch(db, body, arg);
      }
      if (method === "DELETE") {
        if (!arg) return json({ error: "bad-request", message: "note id required" }, 400);
        await db
          .prepare(`UPDATE plan_note SET deleted_at = ?, updated_at = ? WHERE id = ?`)
          .bind(nowMs(), nowMs(), arg)
          .run();
        return json({ ok: true });
      }
      return json({ error: "method-not-allowed" }, 405);
    }

    return json({ error: "not-found" }, 404);
  },
});
