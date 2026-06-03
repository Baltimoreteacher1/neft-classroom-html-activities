/**
 * Neft results backend — Cloudflare Worker (D1).
 *
 * Collects formative activity results, surfaces them to the teacher dashboard,
 * and emits an LP-compatible per-standard debrief rollup.
 *
 * HONEST SECURITY MODEL (read this):
 *   This is FORMATIVE DIAGNOSTIC DATA, not secured grades.
 *   - The per-class WRITE key ships inside client-side activity HTML, so it is
 *     NOT a secret. It namespaces submissions and deters casual cross-class
 *     writes; it does not authenticate students. There is intentionally no
 *     student auth and no anti-cheat.
 *   - The teacher READ key (dashboard/export/purge) is the only real credential
 *     and is never shipped to students.
 *   - NO PII: results carry teacher_id + class_code + student_ref only. Any
 *     payload containing a name-like field is rejected.
 *
 * Endpoints:
 *   POST   /results   one or many results; validates; dedupes on id (UUID)
 *   GET    /results   raw rows; filter teacher_id+class_code+standard+from+to
 *   GET    /debrief   LP-compatible rollup (text by default, ?format=json)
 *   GET    /export    CSV export of a class
 *   DELETE /purge     end-of-year wipe by teacher_id (+ optional class_code)
 */

const PII_FIELDS = [
  "student",
  "student_name",
  "name",
  "first_name",
  "last_name",
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "OPTIONS") return cors(new Response(null, { status: 204 }));

    try {
      if (pathname === "/results" && method === "POST")
        return await postResults(request, env);
      if (pathname === "/results" && method === "GET")
        return await getResults(request, env, url);
      if (pathname === "/debrief" && method === "GET")
        return await getDebrief(request, env, url);
      if (pathname === "/export" && method === "GET")
        return await getExport(request, env, url);
      if (pathname === "/purge" && method === "DELETE")
        return await purge(request, env, url);
      if (pathname === "/health") return json({ ok: true });
      return json({ error: "not found" }, 404);
    } catch (err) {
      return json(
        { error: "server error", detail: String((err && err.message) || err) },
        500,
      );
    }
  },
};

/* ---------------------------------- auth ---------------------------------- */

async function requireWriteKey(request, env, teacher_id, class_code) {
  const key = request.headers.get("x-write-key") || "";
  const row = await env.DB.prepare(
    "SELECT write_key FROM classes WHERE teacher_id = ? AND class_code = ?",
  )
    .bind(teacher_id, class_code)
    .first();
  // NOTE: this key is not secret (lives in client HTML). It only scopes writes.
  return row && row.write_key === key;
}

async function requireReadKey(request, env, teacher_id) {
  const key = request.headers.get("x-read-key") || "";
  const row = await env.DB.prepare(
    "SELECT read_key FROM teachers WHERE teacher_id = ?",
  )
    .bind(teacher_id)
    .first();
  return row && row.read_key === key;
}

/* -------------------------------- POST /results --------------------------- */

async function postResults(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }
  const items = Array.isArray(body) ? body : [body];
  if (!items.length) return json({ error: "no results" }, 400);

  // All items in one POST must share teacher_id+class_code (single write-key scope).
  const t0 = items[0].teacher_id,
    c0 = items[0].class_code;
  for (const it of items) {
    if (it.teacher_id !== t0 || it.class_code !== c0)
      return json({ error: "mixed teacher_id/class_code in one request" }, 400);
  }
  if (!(await requireWriteKey(request, env, t0, c0)))
    return json({ error: "bad or missing write key" }, 401);

  const now = new Date().toISOString();
  let accepted = 0,
    deduped = 0;
  const errors = [];

  for (const it of items) {
    const v = validateResult(it);
    if (v) {
      errors.push(v);
      continue;
    }
    const res = await env.DB.prepare(
      `INSERT INTO results
         (id, teacher_id, class_code, student_ref, activity_slug, standard,
          score, total, percent, misconception_tags, attempt_timestamp, synced_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO NOTHING`,
    )
      .bind(
        it.id,
        it.teacher_id,
        it.class_code,
        String(it.student_ref),
        it.activity_slug,
        it.standard || null,
        int(it.score),
        int(it.total),
        pct(it.score, it.total),
        JSON.stringify(
          Array.isArray(it.misconception_tags) ? it.misconception_tags : [],
        ),
        it.attempt_timestamp || now,
        now,
      )
      .run();
    // D1 reports changes; 0 means the UUID already existed → idempotent no-op.
    if (res.meta && res.meta.changes > 0) accepted++;
    else deduped++;
  }

  const status = errors.length && !accepted ? 422 : 200;
  return json({ accepted, deduped, rejected: errors.length, errors }, status);
}

function validateResult(it) {
  for (const f of PII_FIELDS)
    if (it[f] != null) return `PII field '${f}' not allowed`;
  if (!it.id || typeof it.id !== "string") return "missing id (UUID)";
  if (!it.teacher_id) return "missing teacher_id";
  if (!it.class_code) return "missing class_code";
  if (it.student_ref == null || it.student_ref === "")
    return "missing student_ref";
  if (!it.activity_slug) return "missing activity_slug";
  if (!Number.isFinite(int(it.score))) return "score must be a number";
  if (!Number.isFinite(int(it.total)) || int(it.total) <= 0)
    return "total must be > 0";
  if (int(it.score) > int(it.total)) return "score > total";
  if (it.misconception_tags != null && !Array.isArray(it.misconception_tags))
    return "misconception_tags must be an array";
  return null;
}

/* -------------------------------- GET /results ---------------------------- */

async function getResults(request, env, url) {
  const f = readFilters(url);
  if (!f.teacher_id || !f.class_code)
    return json({ error: "teacher_id and class_code required" }, 400);
  if (!(await requireReadKey(request, env, f.teacher_id)))
    return json({ error: "bad or missing read key" }, 401);
  const { sql, binds } = buildQuery(f);
  const { results } = await env.DB.prepare(sql)
    .bind(...binds)
    .all();
  return json({ count: results.length, results: results.map(rowOut) });
}

/* -------------------------------- GET /debrief ---------------------------- */

async function getDebrief(request, env, url) {
  const f = readFilters(url);
  if (!f.teacher_id || !f.class_code)
    return json({ error: "teacher_id and class_code required" }, 400);
  if (!(await requireReadKey(request, env, f.teacher_id)))
    return json({ error: "bad or missing read key" }, 401);

  const { sql, binds } = buildQuery(f);
  const { results } = await env.DB.prepare(sql)
    .bind(...binds)
    .all();

  const n = results.length;
  const avg = n
    ? Math.round(results.reduce((a, r) => a + r.percent, 0) / n)
    : 0;

  // Top misconception = most frequent tag across the filtered set.
  const tally = {};
  for (const r of results) {
    let tags = [];
    try {
      tags = JSON.parse(r.misconception_tags || "[]");
    } catch {}
    for (const t of tags) tally[t] = (tally[t] || 0) + 1;
  }
  const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
  const topMis = top ? `${top[0]} (n=${top[1]})` : "none tagged";

  // Struggling = students whose mean percent is below the threshold (default 60).
  const thr = Number(url.searchParams.get("struggle_below") || 60);
  const byRef = {};
  for (const r of results)
    (byRef[r.student_ref] = byRef[r.student_ref] || []).push(r.percent);
  const struggling = Object.entries(byRef)
    .filter(([, ps]) => ps.reduce((a, b) => a + b, 0) / ps.length < thr)
    .map(([ref]) => ref)
    .sort();

  const span = dateSpan(results);
  const notes =
    `${n} attempt${n === 1 ? "" : "s"}` +
    (f.standard ? ` on ${f.standard}` : "") +
    (span ? ` from ${span.from} to ${span.to}` : "") +
    (top
      ? `. ${top[1]}/${n} flagged "${top[0]}".`
      : ". No misconception tags present yet.");

  const debrief = {
    class_average: avg,
    top_misconception: topMis,
    struggling_students: struggling,
    struggling_count: struggling.length,
    notes,
    sample_size: n,
  };

  if (url.searchParams.get("format") === "json") return json(debrief);

  // Default: the exact paste-ready text block the LP generator consumes.
  const text =
    `Class average: ${avg}%\n` +
    `Top misconception: ${topMis}\n` +
    `Struggling students: ${struggling.length}` +
    (struggling.length ? ` (refs ${struggling.join(", ")})` : "") +
    `\n` +
    `Notes: ${notes}`;
  return cors(
    new Response(text, {
      headers: { "content-type": "text/plain; charset=utf-8" },
    }),
  );
}

/* -------------------------------- GET /export ----------------------------- */

const CSV_COLS = [
  "attempt_timestamp",
  "student_ref",
  "activity_slug",
  "standard",
  "score",
  "total",
  "percent",
  "misconception_tags",
  "id",
];

async function getExport(request, env, url) {
  const f = readFilters(url);
  if (!f.teacher_id || !f.class_code)
    return json({ error: "teacher_id and class_code required" }, 400);
  if (!(await requireReadKey(request, env, f.teacher_id)))
    return json({ error: "bad or missing read key" }, 401);
  const { sql, binds } = buildQuery(f);
  const { results } = await env.DB.prepare(sql)
    .bind(...binds)
    .all();
  const lines = [CSV_COLS.join(",")];
  for (const r of results)
    lines.push(CSV_COLS.map((c) => csvCell(r[c])).join(","));
  return cors(
    new Response(lines.join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${f.class_code}-results.csv"`,
      },
    }),
  );
}

/* -------------------------------- DELETE /purge --------------------------- */

async function purge(request, env, url) {
  const teacher_id = url.searchParams.get("teacher_id");
  const class_code = url.searchParams.get("class_code");
  if (!teacher_id) return json({ error: "teacher_id required" }, 400);
  if (!(await requireReadKey(request, env, teacher_id)))
    return json({ error: "bad or missing read key" }, 401);
  if (url.searchParams.get("confirm") !== "yes")
    return json({ error: "add confirm=yes to purge (irreversible)" }, 400);
  let res;
  if (class_code) {
    res = await env.DB.prepare(
      "DELETE FROM results WHERE teacher_id=? AND class_code=?",
    )
      .bind(teacher_id, class_code)
      .run();
  } else {
    res = await env.DB.prepare("DELETE FROM results WHERE teacher_id=?")
      .bind(teacher_id)
      .run();
  }
  return json({
    purged: (res.meta && res.meta.changes) || 0,
    scope: class_code || "all classes",
  });
}

/* -------------------------------- helpers --------------------------------- */

function readFilters(url) {
  return {
    teacher_id: url.searchParams.get("teacher_id"),
    class_code: url.searchParams.get("class_code"),
    standard: url.searchParams.get("standard"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  };
}
function buildQuery(f) {
  let sql = "SELECT * FROM results WHERE teacher_id=? AND class_code=?";
  const binds = [f.teacher_id, f.class_code];
  if (f.standard) {
    sql += " AND standard=?";
    binds.push(f.standard);
  }
  if (f.from) {
    sql += " AND attempt_timestamp>=?";
    binds.push(f.from);
  }
  if (f.to) {
    sql += " AND attempt_timestamp<=?";
    binds.push(f.to);
  }
  sql += " ORDER BY attempt_timestamp ASC";
  return { sql, binds };
}
function rowOut(r) {
  return {
    ...r,
    percent: r.percent,
    misconception_tags: safeParse(r.misconception_tags),
  };
}
function safeParse(s) {
  try {
    return JSON.parse(s || "[]");
  } catch {
    return [];
  }
}
function dateSpan(rows) {
  if (!rows.length) return null;
  const ts = rows.map((r) => r.attempt_timestamp).sort();
  return { from: ts[0].slice(0, 10), to: ts[ts.length - 1].slice(0, 10) };
}
function int(v) {
  return Math.trunc(Number(v));
}
function pct(s, t) {
  return t > 0 ? Math.round((int(s) / int(t)) * 1000) / 10 : 0;
}
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function cors(resp) {
  resp.headers.set("Access-Control-Allow-Origin", "*"); // formative data; tighten to Pages origin in prod
  resp.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  resp.headers.set(
    "Access-Control-Allow-Headers",
    "content-type,x-write-key,x-read-key",
  );
  return resp;
}
function json(obj, status = 200) {
  return cors(
    new Response(JSON.stringify(obj, null, 2), {
      status,
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  );
}
