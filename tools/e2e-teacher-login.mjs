#!/usr/bin/env node
/**
 * e2e-teacher-login.mjs — the test that defines "teacher login works".
 *
 * WHY IT EXISTS, and why the tests before it were not enough. Teacher sign-in
 * was reported broken by the person using it while every check said PASS: curl
 * against the endpoint, an API probe of all four credential slots, and even a
 * real-browser run that filled the real form and reached the planner. All of
 * them started by navigating to ONE full URL and stayed on that host, because
 * that is what a script naturally does. The teacher did not: they began on
 * www.eduwonderlab.com and ended up on eduwonderlab.com, and the session cookie
 * is host-only, so the sign-in they had just completed did not travel.
 *
 * So this walks the boundary a script never crosses by accident:
 *
 *   1. start at the WWW hostname, the way a teacher who typed it does
 *   2. let the site canonicalize before anything is typed
 *   3. fill the real field and press the real button
 *   4. watch the actual network request the FORM makes
 *   5. follow the redirect and read the cookie from the BROWSER's jar
 *   6. load the planner, refresh, and stay signed in
 *   7. log out and confirm the protected page sends you back to sign-in
 *
 * CREDENTIALS. Never on the command line — argv is visible in `ps` and lands in
 * shell history. Read from the environment, used, and never printed: this file
 * reports slot LABELS and resulting identities only.
 *
 *   E2E_TEACHER_KEY_NEFT / _NEFT_ALT / _ALBA / _ALBA_ALT
 *
 * The hostname half needs NO credential and always runs, so the regression that
 * actually bit is gated even where secrets are not available. Slots without an
 * env var are reported SKIPPED — never PASS.
 *
 *   node tools/e2e-teacher-login.mjs [--base https://eduwonderlab.com]
 */
import { chromium } from "playwright";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const BASE = arg("--base", "https://eduwonderlab.com").replace(/\/$/, "");
const WWW = BASE.replace("https://", "https://www.");
const CANONICAL_HOST = new URL(BASE).hostname;

const SLOTS = [
  ["Neft primary", "E2E_TEACHER_KEY_NEFT", "Neft"],
  ["Neft alternate", "E2E_TEACHER_KEY_NEFT_ALT", "Neft"],
  ["Alba primary", "E2E_TEACHER_KEY_ALBA", "Alba"],
  ["Alba alternate", "E2E_TEACHER_KEY_ALBA_ALT", "Alba"],
];

const results = [];
const pass = (n, d = "") => results.push({ s: "PASS", n, d });
const fail = (n, d = "") => results.push({ s: "FAIL", n, d });
const skip = (n, d = "") => results.push({ s: "SKIP", n, d });

const browser = await chromium.launch();

/* ── 1. The hostname boundary, with no credential ──────────────────────────── */

{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const res = await page.goto(`${WWW}/teacher-login/?next=%2Fcurriculum%2Fplanning%2F`, {
    waitUntil: "domcontentloaded",
  });
  const landed = new URL(page.url());
  if (landed.hostname === CANONICAL_HOST) {
    pass("www canonicalizes BEFORE the form is shown", `→ ${landed.hostname}`);
  } else {
    fail(
      "www canonicalizes BEFORE the form is shown",
      `still on ${landed.hostname} — a session minted here will not be readable on ${CANONICAL_HOST}`,
    );
  }
  if (landed.searchParams.get("next") === "/curriculum/planning/") {
    pass("the ?next= destination survives canonicalization");
  } else {
    fail("the ?next= destination survives canonicalization", `got ${landed.search}`);
  }
  if (res && res.status() < 400) pass("the canonical login page renders", `status ${res.status()}`);
  else fail("the canonical login page renders", `status ${res?.status()}`);
  await ctx.close();
}

/* ── 2. Each credential slot, through the real UI, starting from www ───────── */

for (const [label, envVar, expected] of SLOTS) {
  const key = process.env[envVar];
  if (!key) {
    skip(`${label} signs in through the form`, `set ${envVar} to exercise this slot`);
    continue;
  }
  const ctx = await browser.newContext(); // fresh: no cookies, storage or SW
  const page = await ctx.newPage();
  let loginHost = "";
  let loginStatus = 0;
  page.on("response", (r) => {
    if (/\/api\/teacher-auth\/login$/.test(r.url())) {
      loginHost = new URL(r.url()).hostname;
      loginStatus = r.status();
    }
  });

  // The teacher's path: type the www hostname, land on the sign-in form.
  await page.goto(`${WWW}/teacher-login/?next=%2Fcurriculum%2Fplanning%2F`, {
    waitUntil: "networkidle",
  });
  await page.fill("#key", key);
  await page.click("button[type=submit]");
  await page.waitForURL(/curriculum\/planning/, { timeout: 25_000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500); // the planner boots before /session is meaningful

  const cookie = (await ctx.cookies()).find((c) => c.name === "nt_teacher");
  const who = await page
    .evaluate(
      async () =>
        (await (await fetch("/api/teacher-auth/session", { credentials: "same-origin" })).json())
          .teacher,
    )
    .catch(() => null);

  // Session persistence: a brand-new navigation, not a reload.
  const second = await ctx.newPage();
  await second.goto(`${BASE}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
  const stillIn = !/teacher-login/.test(second.url());

  // Logout, then the protected page must send us back to sign-in.
  await second.evaluate(() =>
    fetch("/api/teacher-auth/logout", { method: "POST", credentials: "same-origin" }),
  );
  await second.waitForTimeout(500);
  const third = await ctx.newPage();
  await third.goto(`${BASE}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
  const backToLogin = /teacher-login/.test(third.url());

  const cookieOk = !!cookie && cookie.httpOnly && cookie.secure && cookie.sameSite === "Lax";
  const onCanonical = cookie?.domain?.replace(/^\./, "") === CANONICAL_HOST;
  const ok =
    loginStatus === 200 &&
    loginHost === CANONICAL_HOST &&
    who === expected &&
    cookieOk &&
    onCanonical &&
    stillIn &&
    backToLogin;

  (ok ? pass : fail)(
    `${label} signs in through the form`,
    `POST→${loginHost || "?"} ${loginStatus} · identity=${who ?? "none"} · cookie=${
      cookieOk ? "HttpOnly+Secure+Lax" : "bad/missing"
    } on ${cookie?.domain ?? "-"} · persists=${stillIn} · logoutRedirects=${backToLogin}`,
  );
  await ctx.close();
}

/* ── 3. A wrong credential must not sign anybody in ────────────────────────── */

{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/teacher-login/`, { waitUntil: "networkidle" });
  await page.fill("#key", "not-an-approved-credential-value");
  await page.click("button[type=submit]");
  await page.waitForTimeout(3000);
  const message = (await page.textContent("#msg").catch(() => "")) || "";
  const cookie = (await ctx.cookies()).find((c) => c.name === "nt_teacher");
  if (!cookie && /not recognized/i.test(message)) {
    pass("an unapproved credential is refused and sets no session");
  } else {
    fail("an unapproved credential is refused and sets no session", `cookie=${!!cookie}`);
  }
  await ctx.close();
}

await browser.close();

/* ── Report ────────────────────────────────────────────────────────────────── */

for (const r of results) {
  console.log(`  ${r.s} ${r.n}${r.d ? `\n       ${r.d}` : ""}`);
}
const failed = results.filter((r) => r.s === "FAIL").length;
const skipped = results.filter((r) => r.s === "SKIP").length;
console.log(
  `\n${results.filter((r) => r.s === "PASS").length} passed, ${failed} failed, ${skipped} skipped — ${BASE}`,
);
if (skipped) {
  console.log(
    `teacher-login E2E: ${skipped} slot(s) SKIPPED — this run did NOT verify them. ` +
      `A skip is not a pass.`,
  );
}
process.exit(failed ? 1 : 0);
