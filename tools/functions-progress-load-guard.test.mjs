/**
 * functions-progress-load-guard.test.mjs — behavior test for the /api/progress
 * `load` anti-enumeration guard (functions/api/progress/[[path]].js).
 *
 * Drives the real onRequest() with an in-memory D1 mock to prove:
 *   1. A valid save code resolves under normal use — a legit resume returns the
 *      record and never counts as a miss, so a normal class never fills a bucket.
 *   2. Repeated misses from one IP trip a 429 once past LOAD_MAX_MISSES, capping
 *      a single IP to LOAD_MAX_MISSES guesses per window.
 *   3. Below the cap, a miss is a plain 404, and one IP's flood never affects a
 *      different IP (per-IP isolation).
 *
 * Lives under tools/ (not deployed) and runs via `npm test` (tools/run-tests.mjs).
 */

import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const modUrl = pathToFileURL(resolve(here, "../functions/api/progress/[[path]].js")).href;
const { onRequest } = await import(modUrl);

/* --- Minimal in-memory D1 mock: routes by SQL substring. ------------------ */
function makeDB() {
  const progress = new Map(); // save_code -> row
  const miss = new Map(); // `${ip}|${bucket}` -> hits
  function prepare(sql) {
    let args = [];
    const api = {
      bind(...a) {
        args = a;
        return api;
      },
      async first() {
        if (sql.includes("FROM student_progress WHERE save_code")) {
          return progress.get(args[0]) || null;
        }
        if (sql.includes("FROM load_miss WHERE ip")) {
          const [ip, bucket] = args;
          const h = miss.get(`${ip}|${bucket}`);
          return h == null ? null : { hits: h };
        }
        return null;
      },
      async run() {
        if (sql.includes("INSERT INTO load_miss")) {
          const [ip, bucket] = args;
          const k = `${ip}|${bucket}`;
          miss.set(k, (miss.get(k) || 0) + 1);
        } else if (sql.includes("DELETE FROM load_miss WHERE bucket <")) {
          const cutoff = args[0];
          for (const k of [...miss.keys()]) {
            if (Number(k.split("|")[1]) < cutoff) miss.delete(k);
          }
        }
        return { meta: { changes: 0 } };
      },
      async all() {
        return { results: [] };
      },
    };
    return api;
  }
  return { __progress: progress, __miss: miss, prepare };
}

function loadReq(code, ip) {
  return new Request(`https://x/api/progress/load?code=${encodeURIComponent(code)}`, {
    method: "GET",
    headers: ip ? { "CF-Connecting-IP": ip } : {},
  });
}
const call = (db, code, ip) =>
  onRequest({ request: loadReq(code, ip), env: { DB: db }, params: { path: ["load"] } });

/* 1. A valid code resolves under normal use; valid loads never count as misses,
 *    so repeated legit resumes never approach the cap. */
{
  const db = makeDB();
  db.__progress.set("ABC123-XY99", {
    save_code: "ABC123-XY99",
    activity_id: "a",
    state_json: "{}",
    student_name: "Real Student",
    created_at: "t",
    updated_at: "t",
  });
  const ip = "10.0.0.1";
  // A class resuming many times — all valid loads, none counted as misses.
  for (let i = 0; i < 200; i++) {
    const r = await call(db, "ABC123-XY99", ip);
    assert.equal(r.status, 200, "valid resume never throttled by volume alone");
  }
  assert.equal(db.__miss.size, 0, "valid loads never write to the miss table");
  const body = await (await call(db, "ABC123-XY99", ip)).json();
  assert.equal(body.record.studentName, "Real Student", "returns the record for a valid code");
}

/* 2. A flood of misses from one IP trips 429 once past the cap. */
{
  const db = makeDB();
  const ip = "10.0.0.2";
  let saw429 = false;
  let first429At = -1;
  for (let i = 0; i < 80; i++) {
    const res = await call(db, `MISS${i}-AAAA`, ip);
    if (res.status === 429) {
      saw429 = true;
      if (first429At < 0) first429At = i;
    }
  }
  assert.ok(saw429, "miss-flood eventually returns 429");
  assert.ok(first429At >= 50, `429 only after the cap (LOAD_MAX_MISSES); first at ${first429At}`);
  const blocked = await call(db, "STILL-BAD1", ip);
  assert.equal(blocked.status, 429, "stays blocked within the window");
  assert.equal((await blocked.json()).error, "rate-limited");
  assert.ok(blocked.headers.get("Retry-After"), "429 carries Retry-After");
}

/* 3. A single miss below the cap is a plain 404, and a different IP is
 *    unaffected by another IP's flood (per-IP isolation). */
{
  const db = makeDB();
  const res = await call(db, "NOPE12-AAAA", "10.0.0.3");
  assert.equal(res.status, 404, "one miss under the cap is a 404");
  assert.equal((await res.json()).error, "not-found");

  // Flood IP A past the cap; IP B must still get normal 404s, not 429.
  for (let i = 0; i < 80; i++) await call(db, `FLOOD${i}-AAAA`, "10.0.0.4");
  const other = await call(db, "NOPE34-AAAA", "10.0.0.5");
  assert.equal(other.status, 404, "a different IP is not affected by another IP's flood");
}

console.log("progress-load-guard: all assertions passed");
