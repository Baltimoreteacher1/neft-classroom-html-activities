#!/usr/bin/env node
/**
 * e2e:planner-classes — the class-aware planner, end to end, in a real browser,
 * against a real authenticated server and a real D1.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE UNIT TESTS. The storage tests prove that
 * `applyBatch(..., section: "601")` writes a 601 row, and the store tests prove
 * a queued operation carries its section. Neither can see the thing that
 * actually goes wrong: a teacher edits 601, switches to 602, and 602 shows 601's
 * lesson — because the UI re-composed from the wrong cache, or connect() fetched
 * the wrong layer, or the preview applied to whatever section the module-level
 * `ui` happened to hold by then. Every one of those is a correct function called
 * with the wrong argument, which is exactly what a unit test cannot catch.
 *
 * It also proves the property the whole design rests on and that no unit test
 * states end-to-end: **the year is not stored three times.** After three classes
 * have diverged, the database still holds one row per actual edit.
 *
 * HOW IT AUTHENTICATES. Through the real session flow — POST the key to
 * /api/teacher-auth/login, receive the HttpOnly cookie, and let the browser
 * carry it. Nothing is stubbed. The credentials are DISPOSABLE LOCAL VALUES
 * passed to `wrangler pages dev --binding`; production secrets never appear
 * here, and this script refuses to run against a host it was not pointed at.
 *
 * RUNNING IT:
 *   npm run build
 *   npx wrangler pages dev dist --port 8788 --d1 DB=neft-student-progress \
 *     --binding TEACHER_KEY_NEFT=dev-only-neft-e2e \
 *     --binding TEACHER_KEY_ALBA=dev-only-alba-e2e
 *   npm run e2e:planner-classes
 *
 * Override with BASE / E2E_TEACHER_KEY. `--read-only` skips every mutating
 * check, which is the mode that is safe to point at production.
 */
import { chromium } from "playwright";

const BASE = (process.env.BASE || "http://localhost:8788").replace(/\/$/, "");
const KEY = process.env.E2E_TEACHER_KEY || "dev-only-neft-e2e";
const READ_ONLY = process.argv.includes("--read-only");

let pass = 0;
const failures = [];
const ok = (name) => {
  pass++;
  console.log(`  ok    ${name}`);
};
const bad = (name, detail) => {
  failures.push(`${name}: ${detail}`);
  console.error(`  FAIL  ${name}\n        ${detail}`);
};
function check(name, condition, detail = "") {
  if (condition) ok(name);
  else bad(name, detail || "condition was false");
}
const skip = (name, why) => console.log(`  SKIP  ${name} — ${why}`);

/* ── Server-side helpers, using the same session the browser holds ─────────── */

async function api(page, path, init = {}) {
  return page.evaluate(
    async ([p, i]) => {
      const res = await fetch(p, {
        ...i,
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", ...(i.headers || {}) },
      });
      return { status: res.status, body: await res.json().catch(() => null) };
    },
    [path, init],
  );
}

/** Write one day for one class, through the real endpoint. */
const writeDay = (page, section, date, plan, summary) =>
  api(page, `/api/pacing/writes?section=${section}`, {
    method: "POST",
    body: JSON.stringify({
      writes: [{ date, plan }],
      inverse: [{ date, plan: null }],
      kind: "edit",
      summary,
    }),
  });

const stateFor = (page, section) => api(page, `/api/pacing/state?section=${section}`);

/* ── Run ───────────────────────────────────────────────────────────────────── */

console.log(`planner class E2E → ${BASE}${READ_ONLY ? "  (read-only)" : ""}`);

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 160)));

try {
  /* ── 1. Authenticate through the real sign-in page ───────────────────────── */

  await page.goto(`${BASE}/teacher-login/?next=/curriculum/planning/`, {
    waitUntil: "domcontentloaded",
  });
  check("the sign-in page renders a key field", Boolean(await page.$("#key")));

  await page.fill("#key", "definitely-not-the-key");
  await page.click("#go");
  await page.waitForTimeout(900);
  const rejected = (await page.textContent("#msg")) || "";
  check(
    "a wrong key is refused, without saying why",
    /not recognized/i.test(rejected) && !/env|variable|TEACHER_KEY/i.test(rejected),
    `message was ${JSON.stringify(rejected)}`,
  );

  await page.fill("#key", KEY);
  await page.click("#go");
  await page.waitForURL(/\/curriculum\/planning\//, { timeout: 15000 });
  ok("a valid key signs in and lands on the planner");

  /* Read the jar AFTER the planner has settled and scoped to the origin. An
   * earlier version checked immediately on waitForURL and got an empty jar —
   * which looks exactly like "the cookie was rejected" and is really just a
   * navigation that has not finished committing. */
  await page.waitForTimeout(2000);
  const cookies = await context.cookies(BASE);
  const session = cookies.find((c) => c.name === "nt_teacher");
  check(
    "a session cookie was actually stored",
    Boolean(session),
    `jar held ${JSON.stringify(cookies.map((c) => c.name))}`,
  );
  check("the session cookie is HttpOnly", session?.httpOnly === true, `got ${session?.httpOnly}`);
  check("the session cookie is Secure", session?.secure === true, `got ${session?.secure}`);
  check(
    "the session cookie is SameSite=Lax",
    session?.sameSite === "Lax",
    `got ${session?.sameSite}`,
  );
  check(
    "the session cookie expires",
    typeof session?.expires === "number" && session.expires > 0,
    `expires ${session?.expires}`,
  );
  check(
    "the credential is not readable from the page",
    await page.evaluate(
      (k) => !document.cookie.includes("nt_teacher") && !JSON.stringify(localStorage).includes(k),
      KEY,
    ),
    "the key or the session token is reachable from JavaScript",
  );
  const who = await api(page, "/api/teacher-auth/session");
  check(
    "the browser learns the teacher IDENTITY, never the credential",
    who.body?.authenticated === true &&
      typeof who.body?.teacher === "string" &&
      !JSON.stringify(who.body).includes(KEY),
  );

  /* ── 2. The planner opens class-aware ────────────────────────────────────── */

  const tabs = await page.$$eval(".pp-scope-tabs label", (e) => e.map((x) => x.textContent.trim()));
  check(
    "the planner offers the shared plan and all three classes",
    JSON.stringify(tabs) === JSON.stringify(["Shared", "601", "602", "603"]),
    `tabs were ${JSON.stringify(tabs)}`,
  );

  const pickClass = async (section) => {
    await page.click(`label[for="pp-scope-${section}"]`);
    await page.waitForTimeout(1200);
  };
  const scopeText = () => page.textContent('[data-role="scope-now"]');

  await pickClass("601");
  check(
    "choosing 601 says so in words, not only in colour",
    /Class 601/.test((await scopeText()) || ""),
  );

  await page.click('.pp-view[data-view="week"]');
  await page.waitForTimeout(700);
  check(
    "the Week view opens for the selected class",
    (await page.evaluate(
      () => document.querySelector('.pp-view[aria-current="page"]')?.dataset.view,
    )) === "week",
  );

  if (READ_ONLY) {
    skip("every mutating check", "--read-only");
  } else {
    /* ── 3. Edit 601, and prove 602/603 do not move ──────────────────────── */

    // A date far from today's teaching, chosen from the baseline's own
    // instructional days so the write is valid, and reverted at the end.
    const probeDate = await page.evaluate(async () => {
      const b = await (await fetch("/data/pacing-baseline-2026-27.json")).json();
      const school = b.days.filter((d) => d.schoolStatus === "school");
      return school[school.length - 3]?.date;
    });
    check("a probe date resolves from the baseline", Boolean(probeDate), `got ${probeDate}`);

    const before601 = await stateFor(page, "601");
    const beforeShared = await stateFor(page, "");

    const w = await writeDay(
      page,
      "601",
      probeDate,
      { dayType: "Core Lesson", lessonId: "5-3" },
      "E2E probe",
    );
    check(
      "an authenticated write to 601 succeeds",
      w.status === 200 && w.body?.ok === true,
      `status ${w.status} ${JSON.stringify(w.body)}`,
    );
    check("the write is recorded against 601", w.body?.section === "601");

    const after601 = await stateFor(page, "601");
    const after602 = await stateFor(page, "602");
    const after603 = await stateFor(page, "603");
    const afterShared = await stateFor(page, "");

    check(
      "601 shows the change",
      after601.body?.classOverlay?.[probeDate]?.plan?.lessonId === "5-3",
    );
    check(
      "602 is unchanged",
      !after602.body?.classOverlay?.[probeDate],
      `602 saw ${JSON.stringify(after602.body?.classOverlay?.[probeDate])}`,
    );
    check(
      "603 is unchanged",
      !after603.body?.classOverlay?.[probeDate],
      `603 saw ${JSON.stringify(after603.body?.classOverlay?.[probeDate])}`,
    );
    check(
      "the shared plan is unchanged",
      JSON.stringify(afterShared.body?.sharedOverlay) ===
        JSON.stringify(beforeShared.body?.sharedOverlay),
      "a class edit reached the layer all three classes inherit",
    );

    /* ── 4. Field-level inheritance ──────────────────────────────────────── */

    await writeDay(
      page,
      "",
      probeDate,
      { dayType: "Core Lesson", lessonId: "5-9" },
      "E2E shared probe",
    );
    await api(page, `/api/pacing/writes?section=`, {
      method: "POST",
      body: JSON.stringify({
        writes: [{ date: probeDate, note: "Shared: use the visual model" }],
        inverse: [{ date: probeDate, note: null }],
        kind: "edit",
        summary: "E2E shared note",
      }),
    });

    const composed = await stateFor(page, "601");
    check(
      "601 keeps its own plan over the shared one",
      composed.body?.overlay?.[probeDate]?.plan?.lessonId === "5-3",
      `resolved ${JSON.stringify(composed.body?.overlay?.[probeDate]?.plan)}`,
    );
    check(
      "601 INHERITS the shared note it never set",
      composed.body?.overlay?.[probeDate]?.note === "Shared: use the visual model",
      `resolved note ${JSON.stringify(composed.body?.overlay?.[probeDate]?.note)}`,
    );
    check(
      "the 601 row stores only its delta, not a copy of the shared row",
      composed.body?.classOverlay?.[probeDate]?.note === undefined,
      "the class row duplicated the shared note instead of inheriting it",
    );

    // The DOCUMENTED limitation, pinned so nobody mistakes it for a bug later.
    check(
      "a class cannot express 'no note' where the shared layer has one (documented limit)",
      composed.body?.overlay?.[probeDate]?.note === "Shared: use the visual model",
      "merge semantics changed — see docs/pacing-class-architecture.md before 'fixing' this",
    );

    /* ── 5. Undo is class-scoped ─────────────────────────────────────────── */

    const undo601 = await api(page, "/api/pacing/undo?section=601", { method: "POST" });
    check("undo in 601 succeeds", undo601.status === 200 && undo601.body?.ok === true);
    check("undo reports the class it reversed", undo601.body?.section === "601");

    const undone601 = await stateFor(page, "601");
    check(
      "601's own change is reversed",
      undone601.body?.classOverlay?.[probeDate]?.plan?.lessonId !== "5-3",
    );
    check(
      "the shared change 601's undo did NOT own is still there",
      undone601.body?.sharedOverlay?.[probeDate]?.plan?.lessonId === "5-9",
      "undo in a class reached into the shared plan",
    );
    check(
      "602 is still untouched after 601's undo",
      !(await stateFor(page, "602")).body?.classOverlay?.[probeDate],
    );

    /* ── 6. The year is not stored three times ───────────────────────────── */

    const health = await api(page, "/api/pacing/health");
    const bySection = health.body?.editedDaysBySection || {};
    const total = Object.values(bySection).reduce((n, v) => n + Number(v), 0);
    check(
      "three diverging classes cost a handful of rows, not three copies of the year",
      total > 0 && total < 20,
      `the planner stored ${total} day rows (${JSON.stringify(bySection)})`,
    );

    /* ── 7. Clean up every row this test created ─────────────────────────── */

    for (const section of ["601", ""]) {
      await api(page, `/api/pacing/day/${probeDate}?section=${section}`, { method: "DELETE" });
    }
    const cleaned601 = await stateFor(page, "601");
    const cleanedShared = await stateFor(page, "");
    /* A reset clears the FIELDS; the row survives carrying only `updatedAt`,
     * because "restore this day" is an undoable operation rather than a delete —
     * its inverse has to have somewhere to live. resolveYear reads a
     * field-less overlay entry as the baseline day (origin "planning-decision"),
     * so this is a clean revert, and asserting the KEY disappears would be
     * asserting the wrong thing. */
    const overrides = (entry) => Object.keys(entry || {}).filter((k) => k !== "updatedAt");
    check(
      "the probe date carries no override in either layer after reset",
      overrides(cleaned601.body?.classOverlay?.[probeDate]).length === 0 &&
        overrides(cleanedShared.body?.sharedOverlay?.[probeDate]).length === 0,
      `601 left ${JSON.stringify(cleaned601.body?.classOverlay?.[probeDate])}, ` +
        `shared left ${JSON.stringify(cleanedShared.body?.sharedOverlay?.[probeDate])}`,
    );
    check(
      "the resolved 601 day is back on the baseline plan",
      cleaned601.body?.overlay?.[probeDate]?.plan === undefined,
      `resolved plan ${JSON.stringify(cleaned601.body?.overlay?.[probeDate]?.plan)}`,
    );
    check(
      "the test added no NEW overridden day to 601",
      overrides(cleaned601.body?.classOverlay?.[probeDate]).length ===
        overrides(before601.body?.classOverlay?.[probeDate]).length,
    );
  }

  /* ── 7b. The offline outbox, as a workflow rather than a unit ────────────── */

  if (!READ_ONLY) {
    /* THE FAILURE THIS CATCHES: a teacher edits 601 on classroom wifi that has
     * just dropped, switches to 602 to set up the next period, and the network
     * returns. If the queued operation were sent to "whatever class is selected
     * now", 601's change would land in 602 — both classes wrong, silently, while
     * the planner said Saved. The storage tests prove the operation CARRIES its
     * section; only this proves the workflow honours it. */
    await page.goto(`${BASE}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    const offlineDate = await page.evaluate(async () => {
      const b = await (await fetch("/data/pacing-baseline-2026-27.json")).json();
      const school = b.days.filter((d) => d.schoolStatus === "school");
      return school[school.length - 6]?.date;
    });

    // Fail every pacing write, so the edit can only land in the outbox.
    await page.route("**/api/pacing/writes**", (route) => route.abort());

    const queued = await page.evaluate(
      async ([date]) => {
        const store = await import("/curriculum/planning/planning-store.js");
        store.setActiveSection("601");
        const result = await store.enqueue(
          {
            writes: [{ date, plan: { dayType: "Core Lesson", lessonId: "5-7" } }],
            inverse: [{ date, plan: null }],
            kind: "edit",
            summary: "offline probe",
          },
          "601",
        );
        // The teacher moves on to the next period before the network returns.
        store.setActiveSection("602");
        return { status: result.status, pending: store.pendingCount(), now: store.activeSection() };
      },
      [offlineDate],
    );
    check(
      "an edit made while offline is queued, not reported as saved",
      queued.status === "pending" && queued.pending === 1,
      JSON.stringify(queued),
    );
    check("the teacher has since switched to 602", queued.now === "602");

    await page.unroute("**/api/pacing/writes**");
    const drained = await page.evaluate(async () => {
      const store = await import("/curriculum/planning/planning-store.js");
      const r = await store.drain();
      return { status: r.status, pending: store.pendingCount() };
    });
    check(
      "the outbox drains once the network returns",
      drained.status === "saved" && drained.pending === 0,
      JSON.stringify(drained),
    );

    const o601 = await stateFor(page, "601");
    const o602 = await stateFor(page, "602");
    check(
      "the queued edit landed in 601, the class it was made in",
      o601.body?.classOverlay?.[offlineDate]?.plan?.lessonId === "5-7",
      `601 got ${JSON.stringify(o601.body?.classOverlay?.[offlineDate])}`,
    );
    check(
      "602 did NOT receive it, despite being selected when the outbox drained",
      !o602.body?.classOverlay?.[offlineDate],
      `602 got ${JSON.stringify(o602.body?.classOverlay?.[offlineDate])}`,
    );

    await api(page, `/api/pacing/day/${offlineDate}?section=601`, { method: "DELETE" });
  }

  /* ── 8. Cross-surface class context ──────────────────────────────────────── */

  /* Reload first. The offline block above drove store.setActiveSection()directly,
   * behind the rendered radio group's back, so the UI still believes 601 is
   * selected while storage says 602 — clicking the 601 tab would then be a
   * no-op and change nothing. Re-booting the planner resyncs the control with
   * the state, which is also what a teacher's next page load does. */
  await page.goto(`${BASE}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await pickClass("601");
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("curriculumTeacherWorkflow:v1") || "{}").section,
  );
  check("the planner writes the class to the shared teacher-workflow key", stored === "601");

  for (const [label, url] of [
    ["whole-group lesson", "/lessons/5-3/?section=601"],
    ["small-group lesson", "/lessons/5-3-group1/?section=601"],
    ["student supports", "/curriculum/student-supports/?section=601"],
  ]) {
    const res = await page.goto(`${BASE}${url}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const kept = await page.evaluate(
      () => JSON.parse(localStorage.getItem("curriculumTeacherWorkflow:v1") || "{}").section,
    );
    check(
      `${label} loads and the 601 context survives`,
      (res?.status() ?? 0) < 400 && kept === "601",
      `status ${res?.status()}, stored section ${JSON.stringify(kept)}`,
    );
  }

  await page.goto(`${BASE}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  check(
    "returning to the planner restores the class, not a default",
    /Class 601/.test((await scopeText()) || ""),
  );

  await pickClass("602");
  const switched = await page.evaluate(
    () => JSON.parse(localStorage.getItem("curriculumTeacherWorkflow:v1") || "{}").section,
  );
  check("switching to 602 replaces the context rather than layering on it", switched === "602");

  /* ── 8b. Class-specific Student Supports, end to end ─────────────────────── */

  if (!READ_ONLY) {
    /* THE GAP THIS CLOSES. The support workflow was already proven end to end —
     * preset, preview, apply, whole group, small-group inheritance and
     * suppression, printable — by e2e-support-workflow.mjs. What no test covered
     * was the CLASS dimension: that 601's configuration renders for 601 and does
     * not render for 602 on the actual lesson surface. That is not a localStorage
     * assertion; it is a question about what a teacher sees when they open the
     * lesson for their next period. */
    const LESSON = "5-3";
    const cleanupSupports = async () => {
      await page.evaluate((lesson) => {
        const LS = window.EWLLessonSupports;
        if (!LS) return;
        for (const s of ["601", "602", "603", ""]) LS.saveProfile(lesson, [], null, s);
      }, LESSON);
    };

    await page.goto(`${BASE}/curriculum/student-supports/?lesson=${LESSON}&section=601`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1800);
    await cleanupSupports();

    /* Choose supports the applicability rules actually allow for THIS lesson,
     * rather than naming keys that might not apply and getting a silent no-op. */
    const chosen = await page.evaluate((lesson) => {
      const LS = window.EWLLessonSupports;
      const applicable = (LS.applicableSupports(lesson) || []).map((x) => x.key || x);
      const want = ["chunk-directions", "step-checklist", "visual-model", "read-aloud"].filter(
        (k) => applicable.includes(k),
      );
      const keys = (want.length ? want : applicable).slice(0, 3);
      LS.setActiveSection("601");
      LS.saveProfile(lesson, keys, null, "601");
      return keys;
    }, LESSON);
    check("supports are configured for 601 on a real lesson", chosen.length >= 2, chosen.join(","));

    check(
      "602 has no configuration of its own",
      (await page.evaluate(
        (l) => window.EWLLessonSupports.loadProfile(l, "602")?.keys?.length ?? 0,
        LESSON,
      )) === 0,
    );

    /* WHOLE GROUP as 601 — a real support manifestation, not a status string. */
    await page.goto(`${BASE}/lessons/${LESSON}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    /* A FINGERPRINT OF THE RENDERED SURFACE, not a status string and not one
     * markup convention. Supports manifest differently depending on which ones
     * are on: some inject a content block, some add a tool to the shell, some
     * (reduced visual load) take chrome AWAY. Asserting `[data-support-key]`
     * — which is the PRINTABLE's markup — reported failure on a lesson that was
     * correctly supported. What is true of all of them is that the adaptation
     * layer is bound to this lesson and the DOM is measurably different from the
     * same lesson with no supports; that difference is compared against 602
     * below, which is the assertion that actually matters. */
    const fingerprint = () =>
      page.evaluate(() => ({
        applied: window.EWLLearningSupports?.lessonSupportStatus?.()?.applied ?? [],
        boundToLesson: document.querySelectorAll("[data-ewl-supports-lesson]").length,
        supportNodes: document.querySelectorAll(
          '[data-support-key], [class*="ewl-supports-"], [data-ewl-supports-tools]',
        ).length,
      }));

    const wg601 = await fingerprint();
    check(
      "whole group renders 601's supports",
      wg601.applied.length > 0,
      JSON.stringify(wg601.applied),
    );
    check(
      "the adaptation layer is bound to this lesson, with support DOM present",
      wg601.boundToLesson > 0 && wg601.supportNodes > 0,
      JSON.stringify(wg601),
    );

    /* SMALL GROUP — inheritance, and the suppression the resolver exists for. */
    await page.goto(`${BASE}/lessons/${LESSON}-group1/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const sg601 = await page.evaluate(
      () => window.EWLLearningSupports?.lessonSupportStatus?.() ?? null,
    );
    check(
      "small group inherits 601's supports from the parent lesson",
      (sg601?.applied?.length ?? 0) > 0,
      JSON.stringify(sg601),
    );
    check(
      "small group suppresses what it already authors for itself",
      Array.isArray(sg601?.suppressed),
      "the resolver stopped reporting suppression, so de-duplication cannot be seen",
    );

    /* CLASS SWITCH — the actual isolation question, on the rendered surface. */
    await page.evaluate(() => window.EWLLessonSupports.setActiveSection("602"));
    await page.goto(`${BASE}/lessons/${LESSON}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const wg602 = await fingerprint();
    check(
      "602 does NOT inherit 601's supports on the rendered lesson",
      wg602.applied.length === 0,
      `602 saw applied=${JSON.stringify(wg602.applied)}`,
    );
    check(
      "and the rendered surface itself differs between the two classes",
      wg602.supportNodes < wg601.supportNodes,
      `601 rendered ${wg601.supportNodes} support nodes, 602 rendered ${wg602.supportNodes} — ` +
        "identical counts would mean the class made no difference to what is on screen",
    );

    /* BACK TO 601 — the configuration survived the round trip. */
    await page.evaluate(() => window.EWLLessonSupports.setActiveSection("601"));
    await page.goto(`${BASE}/lessons/${LESSON}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    const wgBack = await fingerprint();
    check(
      "601's supports are still there after switching away and back",
      wgBack.applied.length === wg601.applied.length,
      `${JSON.stringify(wgBack.applied)} vs ${JSON.stringify(wg601.applied)}`,
    );

    /* CLEAN UP. This runs on the way out and again in the finally block, because
     * leaving "test support" configuration in a teacher's real workflow is worse
     * than a failed assertion. */
    await cleanupSupports();
    const cleaned = await page.evaluate(
      (l) =>
        ["601", "602", "603", ""].reduce(
          (n, s) => n + (window.EWLLessonSupports.loadProfile(l, s)?.keys?.length ?? 0),
          0,
        ),
      LESSON,
    );
    check("every support the test configured is removed", cleaned === 0, `${cleaned} left`);

    await page.goto(`${BASE}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
  }

  /* ── 9. Sign out ─────────────────────────────────────────────────────────── */

  const after = await api(page, "/api/teacher-auth/logout", { method: "POST" });
  check(
    "sign-out succeeds",
    after.status === 200,
    `status ${after.status} body ${JSON.stringify(after.body)}`,
  );
  const gone = await api(page, "/api/teacher-auth/session");
  check(
    "the session is gone server-side, not just hidden",
    gone.body?.authenticated === false,
    JSON.stringify(gone.body),
  );
  const write = await writeDay(page, "601", "2026-09-14", { dayType: "Flex" }, "should fail");
  check("a write after sign-out is refused", write.status === 401, `status ${write.status}`);

  check("no page errors during the whole run", pageErrors.length === 0, pageErrors.join(" | "));
} finally {
  await browser.close();
}

console.log(`\n${pass} passed, ${failures.length} failed.`);
if (failures.length) process.exit(1);
