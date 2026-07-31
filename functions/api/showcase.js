/* =============================================================================
 * Student Work Showcase — Cloudflare Pages Function
 * -----------------------------------------------------------------------------
 * "Student Work Becomes the Textbook": consented, teacher-approved student
 * project work is promoted into the curriculum itself as the real-world example
 * for a standard. Next year's class learns ratios from work this year's class
 * made. Because that means one child's words can land on another child's
 * screen, the consent and moderation model below is the feature — not a wrapper
 * around it. Read this block before changing anything in this file.
 *
 * -----------------------------------------------------------------------------
 * CONSENT AND SAFETY MODEL
 * -----------------------------------------------------------------------------
 * 1. NOTHING IS EVER PUBLIC WITHOUT AN EXPLICIT TEACHER APPROVAL STEP.
 *    A student submission is written with state = 'pending' and is invisible to
 *    every unauthenticated reader. Only a TEACHER_KEY-authenticated PATCH can
 *    move an item to 'approved'. The public gallery (/curriculum/showcase/) and
 *    the opt-in runtime include (/assets/student-showcase.js) read approved
 *    items ONLY. There is no "auto-approve", no trusted-submitter path, and no
 *    query parameter that widens the public read past state = 'approved'.
 *
 * 2. DISPLAY IDENTITY IS FIRST NAME + LAST INITIAL AT MOST, AND IT FAILS CLOSED.
 *    Every row carries a consent record:
 *        { display: "anonymous" | "firstNameInitial", grantedAt, grantedBy }
 *    stored in consent_json alongside display_mode. resolveDisplay() will only
 *    return a name when BOTH display_mode and the parsed consent record say
 *    "firstNameInitial" AND a well-formed name is present. Missing, malformed,
 *    unparseable, or disagreeing consent resolves to the anonymous label
 *    ("A Grade 6 mathematician"). Never open by default. Full surnames are not
 *    accepted at ingest: the last name field is clamped to a SINGLE letter.
 *
 * 3. NO FREE-FORM STUDENT TEXT REACHES ANOTHER STUDENT'S SCREEN UNMODERATED.
 *    Captions and explanations sit in 'pending' until a teacher reads them.
 *    Text is normalized and clamped at ingest (control characters stripped,
 *    length capped, links/emails rejected outright) and is served as plain JSON
 *    strings; every consumer in this repo renders them with textContent and
 *    never with innerHTML. Sanitize on output regardless of state.
 *
 * 4. NO IMAGE OR FILE UPLOADS — AT ALL. The accepted payload is exactly:
 *      - caption (short line of text)
 *      - explanation (short paragraph)
 *      - standard (must match an id in data/curriculum-nervous-system.json)
 *      - linkPath (OPTIONAL same-origin path to an already-published page on
 *        this site; must start with a single "/", must not contain "..", must
 *        not be protocol-relative "//", absolute URLs are rejected)
 *      - data (OPTIONAL structured numbers the gallery draws as its own SVG
 *        chart — never markup, never an image)
 *    This keeps the entire feature free of file-upload and image-moderation
 *    risk. Do not add an upload route here.
 *
 * 5. A TEACHER CAN UNPUBLISH INSTANTLY.
 *    PATCH { id, state: "pending" | "removed" } or DELETE ?id=... (which soft
 *    deletes to 'removed'). Both are teacher-key gated and take effect on the
 *    next read; there is no publish cache in front of them.
 *
 * 6. RATE LIMITED SO THE QUEUE CANNOT BE FLOODED. Per-standard, global-hourly,
 *    and absolute-pending-depth caps are enforced in SQL before the insert, so
 *    one bored student cannot bury a teacher's moderation queue.
 *
 * -----------------------------------------------------------------------------
 * ROUTES
 * -----------------------------------------------------------------------------
 *   POST   /api/showcase                     (no auth) -> creates a PENDING item
 *   GET    /api/showcase?standard=6.AT.2     (no auth) -> APPROVED items only
 *   GET    /api/showcase?state=pending       (teacher key) -> moderation queue
 *   PATCH  /api/showcase                     (teacher key) -> approve / unpublish
 *   DELETE /api/showcase?id=...              (teacher key) -> soft delete
 *   OPTIONS                                  -> 204
 *
 * Auth + storage conventions mirror functions/api/misconception-heatmap.js:
 *   - env.TEACHER_KEY via ?key= or the x-teacher-key header. Not configured ->
 *     503 on teacher routes, wrong key -> 401.
 *   - D1 bound as env.DB, idempotent CREATE TABLE IF NOT EXISTS on every call.
 *   - No DB binding: public approved reads degrade to an empty list (the
 *     gallery still renders from the committed seed file), writes return 503.
 * ========================================================================== */

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-teacher-key",
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: JSON_HEADERS });
}

/* -------------------------------------------------------------------------- */
/* Standards allowlist                                                        */
/* -------------------------------------------------------------------------- */
// Inlined from data/curriculum-nervous-system.json `nodes[].id` (generated by
// tools/build-nervous-system.mjs). Pages Functions cannot read repo JSON at
// runtime, so this list is the ingest gate: an unknown standard is rejected
// rather than stored. tools/validate-showcase.mjs checks it stays in sync.
const STANDARD_IDS = [
  "6.AT.1",
  "6.AT.2",
  "6.AT.3",
  "6.AT.3a",
  "6.AT.3c",
  "6.AT.4",
  "6.AT.5",
  "6.AT.6",
  "6.AT.6a",
  "6.AT.6b",
  "6.AT.6c",
  "6.AT.7",
  "6.AT.8",
  "6.AT.9",
  "6.AT.11",
  "6.DS.1",
  "6.DS.3",
  "6.DS.4",
  "6.DS.5",
  "6.DS.6",
  "6.DS.6a",
  "6.DS.6b",
  "6.DS.6c",
  "6.DS.6d",
  "6.GR.1",
  "6.GR.2",
  "6.GR.3",
  "6.GR.4",
  "6.NOS.1",
  "6.NOS.2",
  "6.NOS.3",
  "6.NOS.4",
  "6.NOS.5",
  "6.NOS.6",
  "6.NOS.6b",
  "6.NOS.6c",
  "6.NOS.7",
  "6.NOS.8",
  "6.NOS.8a",
  "6.NOS.8b",
  "6.NOS.8c",
  "6.NOS.9",
];
const STANDARD_SET = new Set(STANDARD_IDS);

/* -------------------------------------------------------------------------- */
/* Limits                                                                     */
/* -------------------------------------------------------------------------- */
const LIMITS = {
  caption: 140,
  explanation: 700,
  linkPath: 180,
  chartTitle: 60,
  axisLabel: 32,
  pointLabel: 24,
  points: 12,
  firstName: 20,
  // Flood control on the moderation queue.
  perStandardWindowMin: 10,
  perStandardMax: 5,
  globalWindowMin: 60,
  globalMax: 40,
  pendingDepthMax: 300,
  readLimit: 200,
};

const ANON_LABEL = "A Grade 6 mathematician";
const VALID_STATES = ["pending", "approved", "removed"];
const CHART_KINDS = ["bar", "line", "dot"];

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */
// Returns "ok" | "not-configured" | "unauthorized". Callers must return
// gateResponse() on anything but "ok" before touching the database.
function teacherGate(env, request, url) {
  if (!env.TEACHER_KEY) return "not-configured";
  const key = url.searchParams.get("key") || request.headers.get("x-teacher-key") || "";
  return key === env.TEACHER_KEY ? "ok" : "unauthorized";
}

function gateResponse(gate) {
  if (gate === "not-configured") {
    return json(
      {
        ok: false,
        error: "not-configured",
        message: "Set the TEACHER_KEY env var on the Pages project to enable moderation.",
      },
      503,
    );
  }
  return json({ ok: false, error: "unauthorized" }, 401);
}

/* -------------------------------------------------------------------------- */
/* Validation helpers                                                         */
/* -------------------------------------------------------------------------- */
// Strip control characters (including bidi overrides), collapse whitespace,
// clamp length. Everything a student types passes through this first.
function cleanText(value, max) {
  if (typeof value !== "string") return "";
  // The control-character class below is deliberate: bidi overrides and
  // zero-width joiners are exactly what a caption would smuggle through.
  const stripped = value.replace(
    /[\u0000-\u001F\u007F\u200B-\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069]/g,
    " ",
  );
  return stripped.replace(/\s+/g, " ").trim().slice(0, max);
}

// Students may not smuggle an off-site destination into free text. The only
// link this feature accepts is the validated same-origin linkPath field.
function containsLink(text) {
  return /(https?:\/\/|www\.|\bmailto:|[^\s@]+@[^\s@]+\.[a-z]{2,})/i.test(text);
}

// Same-origin path only. Rejects absolute URLs, protocol-relative "//host",
// path traversal, backslashes, and anything with a scheme-ish colon.
function cleanLinkPath(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";
  if (raw.length > LIMITS.linkPath) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("..")) return null;
  if (raw.includes("\\")) return null;
  if (raw.includes(":")) return null;
  if (!/^\/[A-Za-z0-9\-._~/]*(\?[A-Za-z0-9\-._~=&%]*)?$/.test(raw)) return null;
  return raw;
}

// Optional structured numeric data. Numbers only — the gallery draws its own
// SVG from these, so nothing here is ever interpreted as markup.
function cleanChartData(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value !== "object" || Array.isArray(value)) return null;

  const kind = CHART_KINDS.includes(value.kind) ? value.kind : "bar";
  const points = Array.isArray(value.points) ? value.points.slice(0, LIMITS.points) : [];
  const cleanPoints = [];
  for (const p of points) {
    if (!p || typeof p !== "object") continue;
    const n = Number(p.value);
    if (!Number.isFinite(n)) continue;
    const label = cleanText(p.label, LIMITS.pointLabel);
    if (!label) continue;
    // Clamp to a sane plotting range so one huge value cannot break layout.
    cleanPoints.push({ label, value: Math.max(-1e9, Math.min(1e9, Math.round(n * 1000) / 1000)) });
  }
  if (!cleanPoints.length) return "";

  return JSON.stringify({
    kind,
    title: cleanText(value.title, LIMITS.chartTitle),
    xLabel: cleanText(value.xLabel, LIMITS.axisLabel),
    yLabel: cleanText(value.yLabel, LIMITS.axisLabel),
    unit: cleanText(value.unit, 12),
    points: cleanPoints,
  });
}

// Build the consent record. Fails closed: any doubt returns anonymous.
function buildConsent(body) {
  const requested =
    body && body.displayMode === "firstNameInitial" ? "firstNameInitial" : "anonymous";
  const firstName = cleanText(body && body.firstName, LIMITS.firstName).replace(
    /[^A-Za-z'\- ]/g,
    "",
  );
  const initialRaw = cleanText(body && body.lastInitial, 4).replace(/[^A-Za-z]/g, "");
  const lastInitial = initialRaw.slice(0, 1).toUpperCase();
  const grantedBy = cleanText(body && body.consentGrantedBy, 60);

  // Only a clean single-token first name plus a single letter earns a name.
  const nameOk = /^[A-Za-z][A-Za-z'\-]{0,19}$/.test(firstName) && /^[A-Z]$/.test(lastInitial);
  if (requested !== "firstNameInitial" || !nameOk) {
    return {
      displayMode: "anonymous",
      displayName: "",
      consent: {
        display: "anonymous",
        grantedAt: new Date().toISOString(),
        grantedBy: grantedBy || "student-submission",
      },
    };
  }
  return {
    displayMode: "firstNameInitial",
    displayName: `${firstName} ${lastInitial}.`,
    consent: {
      display: "firstNameInitial",
      grantedAt: new Date().toISOString(),
      grantedBy: grantedBy || "student-submission",
    },
  };
}

// The single place a stored row turns into a public display name. Both the
// column AND the parsed consent record must agree, or it is anonymous.
function resolveDisplay(row) {
  let consent = null;
  try {
    consent = JSON.parse(row.consent_json || "null");
  } catch (_e) {
    consent = null;
  }
  const consentSaysName =
    !!consent && typeof consent === "object" && consent.display === "firstNameInitial";
  const modeSaysName = row.display_mode === "firstNameInitial";
  const name = typeof row.display_name === "string" ? row.display_name : "";
  if (consentSaysName && modeSaysName && /^[A-Za-z][A-Za-z'\-]{0,19} [A-Z]\.$/.test(name)) {
    return { displayName: name, displayMode: "firstNameInitial" };
  }
  return { displayName: ANON_LABEL, displayMode: "anonymous" };
}

function normalizeState(value) {
  const s = typeof value === "string" ? value.trim().toLowerCase() : "";
  return VALID_STATES.includes(s) ? s : "approved";
}

function rowToItem(row) {
  const resolved = resolveDisplay(row);
  let data = null;
  try {
    data = row.data_json ? JSON.parse(row.data_json) : null;
  } catch (_e) {
    data = null;
  }
  return {
    id: row.id,
    standard: row.standard,
    caption: row.caption || "",
    explanation: row.explanation || "",
    linkPath: row.link_path || "",
    data,
    displayMode: resolved.displayMode,
    displayName: resolved.displayName,
    state: row.state,
    createdAt: row.created_at || "",
    approvedAt: row.approved_at || "",
    source: "student-submission",
  };
}

/* -------------------------------------------------------------------------- */
/* Storage                                                                    */
/* -------------------------------------------------------------------------- */
async function ensureSchema(db) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS showcase_items (
        id           TEXT PRIMARY KEY,
        standard     TEXT NOT NULL,
        caption      TEXT NOT NULL,
        explanation  TEXT,
        link_path    TEXT,
        data_json    TEXT,
        display_mode TEXT NOT NULL DEFAULT 'anonymous',
        display_name TEXT,
        consent_json TEXT,
        state        TEXT NOT NULL DEFAULT 'pending',
        created_at   TEXT NOT NULL,
        approved_at  TEXT
      )`,
    )
    .run();
  await db
    .prepare(
      `CREATE INDEX IF NOT EXISTS idx_showcase_state_standard
         ON showcase_items (state, standard, created_at)`,
    )
    .run();
}

/* -------------------------------------------------------------------------- */
/* GET — public approved reads; pending/removed reads are teacher-gated        */
/* -------------------------------------------------------------------------- */
async function handleGet(request, env, url) {
  const requestedState = normalizeState(url.searchParams.get("state") || "approved");

  // Anything other than the public 'approved' view is a moderation view and is
  // gated here, before any database access.
  if (requestedState !== "approved") {
    const gate = teacherGate(env, request, url);
    if (gate !== "ok") return gateResponse(gate);
    if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);
  }

  // Public approved reads degrade to empty so the gallery and the runtime
  // include still work from the committed seed file with no database.
  if (!env.DB) {
    return json({ ok: true, state: requestedState, count: 0, items: [], storage: "unavailable" });
  }

  const standardParam = (url.searchParams.get("standard") || "").trim();
  const standard = STANDARD_SET.has(standardParam) ? standardParam : "";
  if (standardParam && !standard) {
    return json({ ok: false, error: "unknown-standard" }, 400);
  }

  await ensureSchema(env.DB);

  const sql = `SELECT id, standard, caption, explanation, link_path, data_json,
                      display_mode, display_name, consent_json, state, created_at, approved_at
                 FROM showcase_items
                WHERE state = ?${standard ? " AND standard = ?" : ""}
                ORDER BY COALESCE(approved_at, created_at) DESC
                LIMIT ${LIMITS.readLimit}`;
  const stmt = standard
    ? env.DB.prepare(sql).bind(requestedState, standard)
    : env.DB.prepare(sql).bind(requestedState);
  const res = await stmt.all();
  const items = (res.results || []).map(rowToItem);

  return json({ ok: true, state: requestedState, standard, count: items.length, items });
}

/* -------------------------------------------------------------------------- */
/* POST — student submission. No auth, but everything lands as PENDING.        */
/* -------------------------------------------------------------------------- */
async function handlePost(request, env) {
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

  let body = null;
  try {
    body = await request.json();
  } catch (_e) {
    return json({ ok: false, error: "bad-json" }, 400);
  }
  if (!body || typeof body !== "object") return json({ ok: false, error: "bad-json" }, 400);

  const standard = typeof body.standard === "string" ? body.standard.trim() : "";
  if (!STANDARD_SET.has(standard)) return json({ ok: false, error: "unknown-standard" }, 400);

  const caption = cleanText(body.caption, LIMITS.caption);
  if (caption.length < 4) return json({ ok: false, error: "caption-too-short" }, 400);

  const explanation = cleanText(body.explanation, LIMITS.explanation);
  if (containsLink(caption) || containsLink(explanation)) {
    return json(
      {
        ok: false,
        error: "no-links",
        message: "Links and email addresses are not allowed in the text.",
      },
      400,
    );
  }

  const linkPath = cleanLinkPath(body.linkPath);
  if (linkPath === null) {
    return json(
      {
        ok: false,
        error: "bad-link-path",
        message: "Links must be a path on this site starting with /.",
      },
      400,
    );
  }

  const dataJson = cleanChartData(body.data);
  if (dataJson === null) return json({ ok: false, error: "bad-data" }, 400);

  const { displayMode, displayName, consent } = buildConsent(body);

  await ensureSchema(env.DB);

  // ---- flood control on the moderation queue -----------------------------
  const perStandardSince = new Date(Date.now() - LIMITS.perStandardWindowMin * 60000).toISOString();
  const globalSince = new Date(Date.now() - LIMITS.globalWindowMin * 60000).toISOString();
  const counts = await env.DB.prepare(
    `SELECT
       SUM(CASE WHEN standard = ? AND created_at >= ? THEN 1 ELSE 0 END) AS per_standard,
       SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END)                  AS recent_all,
       SUM(CASE WHEN state = 'pending' THEN 1 ELSE 0 END)                AS pending_depth
     FROM showcase_items`,
  )
    .bind(standard, perStandardSince, globalSince)
    .first();

  const perStandard = Number(counts && counts.per_standard) || 0;
  const recentAll = Number(counts && counts.recent_all) || 0;
  const pendingDepth = Number(counts && counts.pending_depth) || 0;
  if (
    perStandard >= LIMITS.perStandardMax ||
    recentAll >= LIMITS.globalMax ||
    pendingDepth >= LIMITS.pendingDepthMax
  ) {
    return json(
      {
        ok: false,
        error: "rate-limited",
        message: "The submission queue is full right now. Try again a little later.",
      },
      429,
    );
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO showcase_items
       (id, standard, caption, explanation, link_path, data_json,
        display_mode, display_name, consent_json, state, created_at, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, NULL)`,
  )
    .bind(
      id,
      standard,
      caption,
      explanation,
      linkPath,
      dataJson,
      displayMode,
      displayName,
      JSON.stringify(consent),
      now,
    )
    .run();

  return json(
    {
      ok: true,
      id,
      state: "pending",
      displayMode,
      message: "Sent to your teacher. A teacher reads this before anyone else sees it.",
    },
    201,
  );
}

/* -------------------------------------------------------------------------- */
/* PATCH — approve / unpublish. Teacher key required.                          */
/* -------------------------------------------------------------------------- */
async function handlePatch(request, env, url) {
  const gate = teacherGate(env, request, url);
  if (gate !== "ok") return gateResponse(gate);
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

  let body = null;
  try {
    body = await request.json();
  } catch (_e) {
    body = null;
  }
  const id = cleanText((body && body.id) || url.searchParams.get("id"), 64);
  const nextState = typeof (body && body.state) === "string" ? body.state.trim().toLowerCase() : "";
  if (!id) return json({ ok: false, error: "missing-id" }, 400);
  if (!VALID_STATES.includes(nextState)) return json({ ok: false, error: "bad-state" }, 400);

  await ensureSchema(env.DB);
  const approvedAt = nextState === "approved" ? new Date().toISOString() : null;
  const res = await env.DB.prepare(
    `UPDATE showcase_items
        SET state = ?, approved_at = ?
      WHERE id = ?`,
  )
    .bind(nextState, approvedAt, id)
    .run();

  const changed = (res.meta && res.meta.changes) || 0;
  if (!changed) return json({ ok: false, error: "not-found" }, 404);
  return json({ ok: true, id, state: nextState, approvedAt });
}

/* -------------------------------------------------------------------------- */
/* DELETE — instant unpublish (soft delete). Teacher key required.             */
/* -------------------------------------------------------------------------- */
async function handleDelete(request, env, url) {
  const gate = teacherGate(env, request, url);
  if (gate !== "ok") return gateResponse(gate);
  if (!env.DB) return json({ ok: false, error: "backend-not-configured" }, 503);

  const id = cleanText(url.searchParams.get("id"), 64);
  if (!id) return json({ ok: false, error: "missing-id" }, 400);

  await ensureSchema(env.DB);
  const res = await env.DB.prepare(
    `UPDATE showcase_items
        SET state = 'removed', approved_at = NULL
      WHERE id = ?`,
  )
    .bind(id)
    .run();

  const changed = (res.meta && res.meta.changes) || 0;
  if (!changed) return json({ ok: false, error: "not-found" }, 404);
  return json({ ok: true, id, state: "removed" });
}

/* -------------------------------------------------------------------------- */
/* Router                                                                     */
/* -------------------------------------------------------------------------- */
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();
  const url = new URL(request.url);

  if (method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

  try {
    if (method === "GET") return await handleGet(request, env, url);
    if (method === "POST") return await handlePost(request, env);
    if (method === "PATCH") return await handlePatch(request, env, url);
    if (method === "DELETE") return await handleDelete(request, env, url);
    return json({ ok: false, error: "method-not-allowed" }, 405);
  } catch (err) {
    return json({ ok: false, error: "server-error", message: String(err) }, 500);
  }
}
