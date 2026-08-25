#!/usr/bin/env node
import { skipExit } from "./lib/skip-exit.mjs";

/* =============================================================================
 * smoke-planning.mjs — the Pacing Planner, checked against a running site
 * -----------------------------------------------------------------------------
 * Two phases, deliberately separated by what they need:
 *
 *   PHASE A — POSTURE (no credentials, always runs)
 *     Everything that can be asserted about a deployed site without holding a
 *     teacher key: the hub actually links the planner, the competing planning
 *     entries read as what they are, the planner route is behind the gate, and
 *     the pacing API refuses an unauthenticated caller. This is the phase that
 *     would have caught the planner going missing from /curriculum/.
 *
 *   PHASE B — AUTHENTICATED ROUND TRIP (needs credentials, SKIPS loudly)
 *     Preview → apply → reload → undo → verify-clean against a real D1. It
 *     mutates planner state, so it refuses to run against production unless
 *     --allow-production is passed explicitly: a teacher's live year is not a
 *     test fixture. Point it at `wrangler pages dev` with a local D1 instead.
 *
 * A phase that cannot run says SKIPPED, never PASS. Under CI a skip is a
 * failure, matching validate:lesson-boot's posture in this repo — a check that
 * silently checks nothing is the failure mode both exist to avoid.
 *
 * Usage:
 *   node tools/smoke-planning.mjs                       # posture, production
 *   node tools/smoke-planning.mjs --base http://localhost:8788
 *   TEACHER_KEY=… node tools/smoke-planning.mjs --base http://localhost:8788
 *
 * Credentials come from the environment only — never an argument, never a file,
 * and no value is ever printed.
 * ========================================================================== */

const args = process.argv.slice(2);
const flag = (name, fallback = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? (args[i + 1] ?? true) : fallback;
};
const BASE = String(flag("--base", "https://eduwonderlab.com")).replace(/\/$/, "");
const ALLOW_PRODUCTION = args.includes("--allow-production");
const IS_PRODUCTION = /eduwonderlab\.com/.test(BASE);

const TEACHER_KEY = process.env.TEACHER_KEY || "";
/* The planner PAGE sits behind Basic Auth (functions/_lib/teacher-surface.js);
 * the pacing API is keyed separately. Phase B needs both to reach the UI, but
 * only the key to exercise the API. */
const BASIC = process.env.PLANNER_BASIC_AUTH || "";

const results = [];
const pass = (n, d = "") => results.push({ s: "PASS", n, d });
const fail = (n, d = "") => results.push({ s: "FAIL", n, d });
const skip = (n, d = "") => results.push({ s: "SKIP", n, d });

const authHeaders = () =>
  BASIC ? { authorization: `Basic ${Buffer.from(BASIC).toString("base64")}` } : {};

async function get(path, opts = {}) {
  try {
    const res = await fetch(BASE + path, { redirect: "manual", ...opts });
    return { status: res.status, text: await res.text().catch(() => ""), res };
  } catch (e) {
    return { status: 0, text: "", error: e.message };
  }
}

/* ── PHASE A — posture ─────────────────────────────────────────────────────── */

async function phaseA() {
  const hub = await get("/curriculum/");
  if (hub.status !== 200) {
    fail("hub reachable", `HTTP ${hub.status} ${hub.error || ""}`);
    return;
  }
  pass("hub reachable", `${Math.round(hub.text.length / 1024)} KB`);

  /* The navigation contract. These are the exact strings /curriculum/ must
   * carry for a teacher to find the planner; each one went missing or went
   * ambiguous at some point, which is why each is named here rather than
   * checked as a single blob. */
  const nav = [
    ["primary planner link", /href="\/curriculum\/planning\/"/],
    ["primary planner heading", /id="cns-planning-feature-title"[^>]*>\s*Pacing Planner\s*</],
    ["reference scope entry", /Original Scope (?:&amp;|&) Sequence/],
    ["class board display entry", /Class Board Display/],
  ];
  for (const [name, re] of nav) {
    if (re.test(hub.text)) pass(`hub nav — ${name}`);
    else fail(`hub nav — ${name}`, "not present in the deployed /curriculum/ HTML");
  }

  /* The lift is what makes the card VISIBLE: the card lives inside a drawer
   * that is collapsed by default, so markup presence alone proved nothing —
   * that is precisely how it read as missing while every HTML check passed.
   * Assert the script that lifts it is still shipped and still wired. */
  const lifter = await get("/assets/curriculum-teacher-planning.js");
  if (lifter.status !== 200) fail("planner lift script served", `HTTP ${lifter.status}`);
  else if (!/cns-lifted/.test(lifter.text))
    fail(
      "planner lift script served",
      "shipped, but no longer lifts the planner out of the drawer",
    );
  else pass("planner lift script served", "card is lifted above the collapsed tools drawer");

  /* The teacher gate. A 200 here would mean the planner is public. */
  const planner = await get("/curriculum/planning/");
  if (planner.status === 401) pass("planner route gated", "401 — teacher gate active");
  else if (planner.status === 200 && !IS_PRODUCTION)
    pass("planner route reachable", "200 — local dev, gate not applied");
  else fail("planner route gated", `HTTP ${planner.status} (expected 401)`);

  /* The API must refuse an unauthenticated caller. `not-configured` is a valid
   * answer on a deployment with no key set; 200 with data is never valid. */
  const api = await get("/api/pacing/state");
  const servedHtml = /text\/html/i.test(api.res?.headers.get("content-type") || "");
  if (api.status === 401 || api.status === 503)
    pass("pacing API refuses anonymous", `HTTP ${api.status}`);
  else if (api.status === 200 && servedHtml && !IS_PRODUCTION)
    // `npm run preview` is a static server with no Functions runtime, so its
    // SPA fallback answers /api/* with index.html and a 200. Reading that as a
    // successful anonymous API read failed this check on every local run and
    // taught everyone to ignore it. Only `wrangler pages dev` (or production)
    // can actually answer for the gate.
    skip(
      "pacing API refuses anonymous",
      "no Functions runtime here — the static preview answered /api/pacing/state with the SPA " +
        "fallback page. Point --base at `wrangler pages dev` to verify the gate for real",
    );
  else
    fail("pacing API refuses anonymous", `HTTP ${api.status} — an unauthenticated read succeeded`);
}

/* ── PHASE B — authenticated round trip ────────────────────────────────────── */

async function phaseB() {
  if (!TEACHER_KEY) {
    skip(
      "authenticated planner round trip",
      "set TEACHER_KEY to any accepted teacher key and point --base at `wrangler pages dev`. " +
        "PLANNER_BASIC_AUTH is no longer needed for this phase: it talks to /api/pacing with " +
        "x-teacher-key, and since the unified sign-in landed a teacher session also opens the " +
        "page gate, so SITE_PASSWORD is not required to verify the planner",
    );
    return;
  }
  if (IS_PRODUCTION && !ALLOW_PRODUCTION) {
    skip(
      "authenticated planner round trip",
      "refusing to mutate the live year — point --base at `wrangler pages dev`, or pass --allow-production",
    );
    return;
  }

  const key = {
    "x-teacher-key": TEACHER_KEY,
    "content-type": "application/json",
    ...authHeaders(),
  };

  const state = await get("/api/pacing/state", { headers: key });
  if (state.status !== 200) {
    fail("authenticated state read", `HTTP ${state.status}`);
    return;
  }
  let overlayBefore;
  try {
    overlayBefore = JSON.parse(state.text).overlay || {};
  } catch {
    fail("authenticated state read", "response was not JSON");
    return;
  }
  pass("authenticated state read", `${Object.keys(overlayBefore).length} overlaid day(s)`);

  /* Pick a day the plan does not already override, so the test can restore the
   * exact starting state by deleting rather than guessing a previous value. */
  const { readFileSync } = await import("node:fs");
  const baseline = JSON.parse(
    readFileSync(new URL("../data/pacing-baseline-2026-27.json", import.meta.url)),
  );
  const candidate = baseline.days.find(
    (d) => d.schoolStatus === "school" && d.plan.lessonId && !overlayBefore[d.date],
  );
  if (!candidate) {
    skip(
      "authenticated planner round trip",
      "no un-overlaid instructional day available to test on",
    );
    return;
  }
  const testDate = candidate.date;

  /* Preview must not write. Read the state back and prove it is unchanged. */
  const afterPreviewRead = await get("/api/pacing/state", { headers: key });
  const overlayAfterPreview = JSON.parse(afterPreviewRead.text).overlay || {};
  if (JSON.stringify(overlayAfterPreview) === JSON.stringify(overlayBefore))
    pass("preview writes nothing", "state identical after previewing");
  else fail("preview writes nothing", "the overlay changed without an apply");

  /* Apply a single-day note write — the smallest mutation that proves the
   * write path, without rippling a real teacher's year. */
  const applied = await get("/api/pacing/writes", {
    method: "POST",
    headers: key,
    body: JSON.stringify({
      writes: [{ date: testDate, note: "e2e-smoke", updatedAt: Date.now() }],
      /* The INVERSE is what makes the write undoable, and the planner client
       * (curriculum/planning/planning-store.js) always sends one. This test did
       * not, so `undo` correctly refused with 409 "recorded without a reversal"
       * — and because the authenticated phase had never actually run for want
       * of credentials, that read as a planner defect the first time it did.
       * Send what the real client sends, or this exercises a shape nothing in
       * production ever produces. */
      inverse: [{ date: testDate, note: candidate.note ?? null, updatedAt: Date.now() }],
      kind: "edit",
      summary: "e2e smoke note",
    }),
  });
  if (applied.status !== 200) {
    fail("apply persists", `HTTP ${applied.status} ${applied.text.slice(0, 120)}`);
    return;
  }
  pass("apply persists", `wrote ${testDate}`);

  const reread = await get("/api/pacing/state", { headers: key });
  const persisted = (JSON.parse(reread.text).overlay || {})[testDate];
  if (persisted?.note === "e2e-smoke") pass("change survives reload", "re-read from D1");
  else fail("change survives reload", "the write did not come back");

  /* Undo, then prove the day is exactly as it started. */
  const undone = await get("/api/pacing/undo", { method: "POST", headers: key, body: "{}" });
  if (undone.status !== 200) fail("undo accepted", `HTTP ${undone.status}`);
  else pass("undo accepted");

  /* Compare the day's MEANING, not the row's presence.
   *
   * Undoing the first change to a day leaves an overlay row whose fields are
   * all null — that is what the planner client's own inverse produces (see
   * `note: prior.note ?? null` in planning.js), and an all-null row and an
   * absent row render identically. A byte-for-byte comparison can therefore
   * never pass for a day being touched for the first time, which would leave
   * this check permanently red and duly ignored. */
  const finalRead = await get("/api/pacing/state", { headers: key });
  const overlayAfter = JSON.parse(finalRead.text).overlay || {};
  const meaning = (o) => {
    const d = o[testDate] || {};
    return JSON.stringify({
      plan: d.plan ?? null,
      actual: d.actual ?? null,
      note: d.note ?? null,
      locked: Boolean(d.locked),
    });
  };
  const otherDaysUnchanged =
    JSON.stringify(
      Object.keys(overlayAfter)
        .filter((d) => d !== testDate)
        .sort(),
    ) ===
    JSON.stringify(
      Object.keys(overlayBefore)
        .filter((d) => d !== testDate)
        .sort(),
    );
  if (meaning(overlayAfter) === meaning(overlayBefore) && otherDaysUnchanged)
    pass("no residual test mutation", `${testDate} is back to its starting state`);
  else
    fail(
      "no residual test mutation",
      `${testDate} did not return to its starting state — clean it up by hand`,
    );
}

/* ── Report ────────────────────────────────────────────────────────────────── */

await phaseA();
await phaseB();

const width = Math.max(...results.map((r) => r.n.length));
for (const r of results) console.log(`  ${r.s.padEnd(4)} ${r.n.padEnd(width)}  ${r.d}`);

const failed = results.filter((r) => r.s === "FAIL");
const skipped = results.filter((r) => r.s === "SKIP");
console.log(
  `\n${results.filter((r) => r.s === "PASS").length} passed, ${failed.length} failed, ${skipped.length} skipped — ${BASE}`,
);

if (failed.length) {
  console.error("\nsmoke-planning: FAIL");
  process.exit(1);
}
if (skipped.length) {
  /* Never let a skip read as green. Locally it is a warning; in CI, where the
   * credentials are supposed to exist, it is a failure. */
  console.error(
    `\nsmoke-planning: ${skipped.length} check(s) SKIPPED — this run did NOT verify the authenticated planner.`,
  );
  // Exit 3 = SKIP (tools/lib/skip-exit.mjs): not a pass, not a push-blocker.
  // Reporting it as 0 is what let a run that verified nothing print green.
  process.exit(skipExit(`${skipped.length} planner check(s) could not run`));
}
console.log("\nsmoke-planning: PASS");
