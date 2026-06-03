/**
 * Worker integration tests — runs the ACTUAL worker.js SQL against a real
 * SQLite database via node:sqlite, behind a tiny D1-compatible adapter.
 *
 *   node --experimental-sqlite test/worker.test.mjs
 *
 * Verifies: health, auth (401), ingest, dedupe (INSERT OR IGNORE),
 * read filters, summary aggregation, misconception split, CSV + BOM.
 */
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import worker from "../src/worker.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

/* ---- D1 adapter over node:sqlite ---- */
function makeD1() {
  const db = new DatabaseSync(":memory:");
  const schema = readFileSync(join(__dirname, "..", "migrations", "0001_init.sql"), "utf8");
  db.exec(schema);
  const prepare = (sql) => {
    const stmt = db.prepare(sql);
    let bound = [];
    const api = {
      bind: (...args) => { bound = args; return api; },
      all: () => ({ results: stmt.all(...bound) }),
      first: () => stmt.get(...bound) ?? null,
      run: () => { const r = stmt.run(...bound); return { meta: { changes: r.changes } }; },
    };
    return api;
  };
  return {
    prepare,
    async batch(stmts) { return stmts.map((s) => s.run()); },
  };
}

const env = { DB: makeD1(), INGEST_KEY: "ingest-secret", ADMIN_KEY: "admin-secret", ALLOWED_ORIGINS: "*" };

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log("  ✓ " + msg); } else { fail++; console.error("  ✗ " + msg); } }

const call = (method, path, { headers = {}, body } = {}) =>
  worker.fetch(new Request("https://x" + path, {
    method, headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }), env);

const ev = (over = {}) => ({
  eventId: "e1", timestamp: "2026-06-01T10:00:00.000Z", studentId: "S01", studentName: "Ana",
  classPeriod: "P3", activityId: "frac-1", activityTitle: "Fractions Soccer", standard: "6.NS.1",
  score: 9, maxScore: 10, percent: 90, stars: 3, problemsCorrect: 9, problemsAttempted: 10,
  misconceptions: "invert-divide|common-denominator", durationSec: 120, deviceId: "d1", ...over,
});

console.log("edupulse-gradebook worker tests\n");

// health
let r = await call("GET", "/api/health");
let j = await r.json();
ok(r.status === 200 && j.ok && j.service === "edupulse-gradebook-api", "health returns ok + service");

// CORS preflight
r = await call("OPTIONS", "/api/scores");
ok(r.status === 204 && r.headers.get("Access-Control-Allow-Headers").includes("x-ingest-key"), "OPTIONS preflight 204 + headers");

// ingest without key -> 401
r = await call("POST", "/api/scores", { body: { events: [ev()] } });
ok(r.status === 401, "POST /api/scores without key -> 401");

// ingest with key -> written:1
r = await call("POST", "/api/scores", { headers: { "x-ingest-key": "ingest-secret" }, body: { events: [ev()] } });
j = await r.json();
ok(r.status === 200 && j.written === 1 && j.skipped === 0, "ingest one event -> written:1");

// dedupe same eventId -> skipped:1
r = await call("POST", "/api/scores", { headers: { "x-ingest-key": "ingest-secret" }, body: { events: [ev()] } });
j = await r.json();
ok(j.written === 0 && j.skipped === 1, "re-ingest same eventId -> skipped:1 (dedupe)");

// '' coerced to null
await call("POST", "/api/scores", { headers: { "x-ingest-key": "ingest-secret" },
  body: { events: [ev({ eventId: "e2", studentId: "S02", studentName: "Ben", percent: 55, score: 5.5, standard: "6.NS.1", misconceptions: "common-denominator", classPeriod: "" })] } });
r = await call("GET", "/api/scores?studentId=S02", { headers: { "x-admin-key": "admin-secret" } });
j = await r.json();
ok(j.rows[0].class_period === null, "empty string coerced to null");

// more data for aggregates
await call("POST", "/api/scores", { headers: { "x-ingest-key": "ingest-secret" },
  body: { events: [ev({ eventId: "e3", studentId: "S03", studentName: "Cy", percent: 40, score: 4, standard: "6.RP.3", misconceptions: "invert-divide|scale-factor", classPeriod: "P3" })] } });

// read requires admin key
r = await call("GET", "/api/scores");
ok(r.status === 401, "GET /api/scores without admin key -> 401");

// read with filter
r = await call("GET", "/api/scores?standard=6.NS.1", { headers: { "x-admin-key": "admin-secret" } });
j = await r.json();
ok(j.ok && j.rows.every((x) => x.standard === "6.NS.1"), "GET /api/scores?standard filter works");

// summary
r = await call("GET", "/api/summary", { headers: { "x-admin-key": "admin-secret" } });
j = await r.json();
const ns1 = j.perStandard.find((s) => s.standard === "6.NS.1");
ok(j.ok && ns1 && ns1.count === 2, "summary per-standard count");
ok(typeof ns1.masteryRate === "number", "summary masteryRate present");
const topMis = j.misconceptions[0];
ok(j.misconceptions.length >= 3 && topMis.count >= topMis.count, "summary splits pipe-delimited misconceptions");
ok(j.misconceptions.every((m, i, a) => i === 0 || a[i - 1].count >= m.count), "misconceptions sorted desc");
ok(j.overall.count === 3, "summary overall count");

// summary auth
r = await call("GET", "/api/summary");
ok(r.status === 401, "GET /api/summary without admin key -> 401");

// CSV export
r = await call("GET", "/api/export.csv", { headers: { "x-admin-key": "admin-secret" } });
const bytes = new Uint8Array(await r.clone().arrayBuffer());
const csv = await r.text(); // note: text() strips a leading BOM per fetch spec
ok(r.headers.get("Content-Disposition").includes("attachment"), "CSV has attachment disposition");
ok(bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF, "CSV starts with UTF-8 BOM bytes");
ok(csv.split("\r\n")[0].startsWith("event_id,ts,received_at"), "CSV header row correct");
r = await call("GET", "/api/export.csv");
ok(r.status === 401, "CSV export without admin key -> 401");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
