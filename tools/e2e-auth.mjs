#!/usr/bin/env node
/**
 * e2e-auth.mjs — the teacher's actual path, in TWO real browser engines.
 *
 * WHY BOTH ENGINES, PERMANENTLY. The rewrite that broke teacher sign-in for a
 * day shipped a heuristic that branched on `Sec-Fetch-Mode`, which Safari and
 * several in-app webviews omit — so Chromium saw a login page and WebKit saw a
 * Basic Auth dialog checking a different secret. One-engine coverage cannot see
 * that class of bug at all. The contract (AUTH_CONTRACT §7) is that there is ONE
 * flow, and the only way to hold that is to run both and compare.
 *
 * WHY IT STARTS ON www. Every earlier check — curl, the API probe, even a real
 * browser E2E — began by navigating to ONE full URL and staying on that host.
 * Within a single host the flow was flawless, which is exactly what they all
 * reported, while a teacher crossing from www to the apex lost their credential
 * on every click. A single-host test cannot see a cross-host bug.
 *
 * WHY IT NEEDS A LOCAL SERVER. Production cannot be tested past the 401 without
 * Joel's real password, and a run that stops at the challenge has verified the
 * lock and not the key. So the default target is `wrangler pages dev` with a
 * THROWAWAY password this script generates: the full path — challenge, correct
 * password, authenticated page, refresh, wrong password — actually executes.
 *
 *   npm run e2e:auth                       # starts its own wrangler, self-contained
 *   npm run e2e:auth -- --base http://…    # against an already-running server
 *   npm run e2e:auth -- --production       # read-only: the anonymous half only
 *
 * A SKIP IS NOT A PASS. If an engine's browser is missing, that engine is
 * reported SKIP and the process exits non-zero unless --allow-skip.
 */
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const PRODUCTION = argv.includes("--production");
const ALLOW_SKIP = argv.includes("--allow-skip");
const PORT = Number(arg("--port", "8798"));
const PASSWORD = `e2e-${randomBytes(12).toString("hex")}`;

let base = arg("--base", null);
const results = [];
const record = (engine, name, state, detail = "") => {
  results.push({ engine, name, state, detail });
  const mark = state === "PASS" ? "  PASS" : state === "SKIP" ? "  SKIP" : "  FAIL";
  console.log(`${mark} ${name.padEnd(46)} ${detail}`);
};

/* ── server ────────────────────────────────────────────────────────────────── */

async function waitFor(url, ms = 120000) {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    try {
      await fetch(url, { redirect: "manual" });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return false;
}

async function startServer() {
  const child = spawn(
    "npx",
    [
      "wrangler",
      "pages",
      "dev",
      "dist",
      "--port",
      String(PORT),
      "--binding",
      `SITE_PASSWORD=${PASSWORD}`,
      `TEACHER_KEY=${PASSWORD}-api`,
      "--compatibility-date=2025-01-01",
    ],
    { cwd: process.cwd(), stdio: "ignore", detached: true },
  );
  child.unref();
  const up = await waitFor(`http://127.0.0.1:${PORT}/`);
  if (!up) throw new Error(`wrangler pages dev did not come up on :${PORT} (is dist/ built?)`);
  return child;
}

/* ── the flow ──────────────────────────────────────────────────────────────── */

async function runEngine(engineName, engine, target, { authenticated }) {
  console.log(`\n── ${engineName} ${authenticated ? "" : "(anonymous half only)"}`);
  let browser;
  try {
    browser = await engine.launch();
  } catch (error) {
    record(engineName, "browser available", "SKIP", error.message.split("\n")[0].slice(0, 80));
    return;
  }

  const origin = new URL(target);
  const wwwTarget = authenticated
    ? target // localhost has no www form; canonicalization is pinned by unit test
    : `https://www.${origin.host}`;

  // 1. anonymous: the site is open
  const anon = await browser.newContext();
  const page = await anon.newPage();
  for (const [label, path] of [
    ["site root is open", "/"],
    ["curriculum is open", "/curriculum/"],
    ["a lesson is open", "/lessons/1-1/"],
  ]) {
    const r = await page.goto(target + path, { waitUntil: "domcontentloaded" }).catch(() => null);
    record(engineName, label, r?.status() === 200 ? "PASS" : "FAIL", `${r?.status()}`);
  }

  // 2. www → apex, before any challenge (production only: localhost has no www)
  if (!authenticated) {
    const r = await page
      .goto(`${wwwTarget}/curriculum/planning/`, { waitUntil: "domcontentloaded" })
      .catch(() => null);
    const landedOnApex = page.url().startsWith(target);
    record(
      engineName,
      "www canonicalizes to the apex",
      landedOnApex ? "PASS" : "FAIL",
      `final=${page.url()}`,
    );
    record(
      engineName,
      "the apex then challenges for the password",
      r?.status() === 401 ? "PASS" : "FAIL",
      `${r?.status()} ${r?.headers?.()["www-authenticate"] || ""}`,
    );
  }

  // 3. the planner, anonymous → challenge
  const gated = await page
    .goto(`${target}/curriculum/planning/`, { waitUntil: "domcontentloaded" })
    .catch(() => null);
  const challenge = gated?.headers?.()["www-authenticate"] || "";
  record(
    engineName,
    "the planner challenges with Basic",
    gated?.status() === 401 && /^Basic realm="EduWonderLab"/.test(challenge) ? "PASS" : "FAIL",
    `${gated?.status()} ${challenge}`,
  );
  await anon.close();

  if (!authenticated) {
    await browser.close();
    return;
  }

  // 4. the password opens the planner, and a refresh keeps it open
  const authed = await browser.newContext({
    httpCredentials: { username: "teacher", password: PASSWORD },
  });
  const p2 = await authed.newPage();
  const open = await p2.goto(`${target}/curriculum/planning/`, { waitUntil: "domcontentloaded" });
  record(
    engineName,
    "the password opens the planner",
    open?.status() === 200 ? "PASS" : "FAIL",
    `${open?.status()} ${JSON.stringify((await p2.title()).slice(0, 34))}`,
  );
  record(
    engineName,
    "the authenticated page is not cacheable",
    open?.headers()["cache-control"] === "private, no-store" ? "PASS" : "FAIL",
    open?.headers()["cache-control"] || "(none)",
  );
  const again = await p2.reload({ waitUntil: "domcontentloaded" });
  record(
    engineName,
    "refresh — still signed in",
    again?.status() === 200 ? "PASS" : "FAIL",
    `${again?.status()}`,
  );

  const tools = await p2.goto(`${target}/teacher-tools/`, { waitUntil: "domcontentloaded" });
  record(
    engineName,
    "other teacher surfaces open too",
    tools?.status() === 200 ? "PASS" : "FAIL",
    `${tools?.status()}`,
  );

  // 5. the pacing endpoint authorizes on the header, not the page session
  const apiAnon = await p2.request.post(`${target}/api/pacing/day`, {
    data: {},
    failOnStatusCode: false,
  });
  record(
    engineName,
    "the pacing API refuses an anonymous write",
    apiAnon.status() === 401 ? "PASS" : "FAIL",
    `${apiAnon.status()}`,
  );
  await authed.close();

  // 6. a wrong password is refused
  const bad = await browser.newContext({
    httpCredentials: { username: "teacher", password: "definitely-wrong" },
  });
  const p3 = await bad.newPage();
  const refused = await p3
    .goto(`${target}/curriculum/planning/`, { waitUntil: "domcontentloaded" })
    .catch(() => null);
  record(
    engineName,
    "a wrong password is refused",
    refused?.status() === 401 ? "PASS" : "FAIL",
    `${refused?.status()}`,
  );
  await bad.close();

  await browser.close();
}

/* ── run ───────────────────────────────────────────────────────────────────── */

let server;
try {
  const { chromium, webkit } = await import("playwright");

  if (PRODUCTION) {
    base = base || "https://eduwonderlab.com";
    console.log(`e2e-auth: PRODUCTION, read-only — the anonymous half only.`);
    console.log(`          The password half cannot run here without the real secret.`);
  } else if (!base) {
    console.log(`e2e-auth: starting wrangler pages dev on :${PORT} with a throwaway password…`);
    server = await startServer();
    base = `http://127.0.0.1:${PORT}`;
  }

  for (const [name, engine] of [
    ["chromium", chromium],
    ["webkit", webkit],
  ]) {
    await runEngine(name, engine, base, { authenticated: !PRODUCTION });
  }
} finally {
  if (server) {
    try {
      process.kill(-server.pid);
    } catch {
      /* already gone */
    }
  }
}

/* ── report ────────────────────────────────────────────────────────────────── */

const pass = results.filter((r) => r.state === "PASS").length;
const fail = results.filter((r) => r.state === "FAIL");
const skip = results.filter((r) => r.state === "SKIP");

// The contract is that BOTH engines behave identically. Compare the two result
// sets by name — a check that passes in one and fails in the other is the exact
// divergence this script exists to catch, and it must be named as such.
const byEngine = (e) =>
  new Map(results.filter((r) => r.engine === e).map((r) => [r.name, r.state]));
const c = byEngine("chromium");
const w = byEngine("webkit");
const divergent = [...c.keys()].filter((k) => w.has(k) && c.get(k) !== w.get(k));

console.log(`\n${pass} passed, ${fail.length} failed, ${skip.length} skipped — ${base}`);
if (divergent.length) {
  console.error(
    `\nENGINE DIVERGENCE — Chromium and WebKit disagree on ${divergent.length} check(s):`,
  );
  for (const d of divergent) console.error(`  ✗ ${d}: chromium=${c.get(d)} webkit=${w.get(d)}`);
  console.error("  AUTH_CONTRACT §7 requires one flow, not a per-browser flow.");
} else if (c.size && w.size) {
  console.log("Chromium and WebKit agree on every check.");
}
if (skip.length && !ALLOW_SKIP) {
  console.error(`\ne2e-auth: ${skip.length} check(s) SKIPPED — a skip is not a pass.`);
}
if (fail.length || divergent.length || (skip.length && !ALLOW_SKIP)) process.exit(1);
