#!/usr/bin/env node
/* =============================================================================
 * diagnose:student-access — is THIS client reaching Pages, or Access?
 * -----------------------------------------------------------------------------
 * Phase I proved this development client receives a Cloudflare Access sign-in
 * page for `/`. That is not a Basic Auth regression and must not drive an
 * auth rewrite. It also does not prove classroom Chromebooks see Access.
 *
 * This command makes harmless GET requests (redirect: manual, no cookies
 * written, no POST) to representative production URLs and classifies each:
 *
 *   PUBLIC / PAGES REACHED
 *   CLOUDFLARE ACCESS INTERCEPT
 *   APP AUTH INTERCEPT          (HTTP Basic — teacher surfaces)
 *   UNEXPECTED RESPONSE
 *   NETWORK FAILURE
 *
 * A 200 whose body is the Access interstitial is ACCESS, never PUBLIC.
 *
 * Exit:
 *   0  student URLs reached Pages (teacher 401 is healthy)
 *   2  Access intercepted a student URL — run this from a classroom network
 *   1  unexpected / network failure on a student URL
 *
 *   npm run diagnose:student-access
 *   npm run diagnose:student-access -- --base https://eduwonderlab.com
 * ============================================================================= */
import { fileURLToPath } from "node:url";
import { ACCESS_CLASS, classifyResponse } from "./lib/cloudflare-access.mjs";

const argv = process.argv.slice(2);
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const BASE = (arg("--base") || "https://eduwonderlab.com").replace(/\/$/, "");
const TIMEOUT_MS = 15000;

const TARGETS = [
  { path: "/", name: "homepage", audience: "student" },
  { path: "/curriculum/", name: "curriculum hub", audience: "student" },
  { path: "/lessons/1-1/", name: "lesson 1-1", audience: "student" },
  { path: "/assets/app.js", name: "shared JS", audience: "student" },
  { path: "/assets/shared.css", name: "shared CSS", audience: "student" },
  { path: "/api/settings/today", name: "today plan API", audience: "student" },
  { path: "/teacher-tools/", name: "teacher tools", audience: "teacher" },
];

async function probe(path) {
  const url = `${BASE}${path}`;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: ac.signal,
      headers: { Accept: "text/html,application/json,text/css,*/*" },
    });
    const body = await res.text();
    const headers = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return {
      path,
      status: res.status,
      class: classifyResponse({ status: res.status, headers, body }),
      bytes: body.length,
    };
  } catch (error) {
    return {
      path,
      status: 0,
      class: classifyResponse({ error }),
      bytes: 0,
      error: error.name === "AbortError" ? "timeout" : error.message,
    };
  } finally {
    clearTimeout(timer);
  }
}

export { TARGETS };

async function main() {
  console.log(`Student-access diagnostic against ${BASE} (read-only GET, no writes)\n`);
  const rows = [];
  for (const t of TARGETS) {
    const r = await probe(t.path);
    rows.push({ ...t, ...r });
    const note = r.error ? ` ${r.error}` : ` HTTP ${r.status} ${r.bytes}B`;
    console.log(`  ${r.class.padEnd(32)}  ${t.name.padEnd(18)}  ${t.path}${note}`);
  }

  const student = rows.filter((r) => r.audience === "student");
  const access = student.filter((r) => r.class === ACCESS_CLASS.ACCESS);
  const bad = student.filter(
    (r) => r.class === ACCESS_CLASS.UNEXPECTED || r.class === ACCESS_CLASS.NETWORK,
  );
  const publicOk = student.filter((r) => r.class === ACCESS_CLASS.PUBLIC);

  console.log("");
  if (access.length === student.length) {
    console.log("RESULT: CLOUDFLARE ACCESS INTERCEPT on every student URL.");
    console.log("  This client never reached Pages. That does not describe classroom devices.");
    console.log("  Run the same command from a student Chromebook / school network:");
    console.log("      npm run diagnose:student-access");
    process.exit(2);
  }
  if (access.length) {
    console.log(`RESULT: mixed — Access on ${access.map((r) => r.path).join(", ")}`);
    process.exit(2);
  }
  if (bad.length) {
    console.log(`RESULT: UNEXPECTED / NETWORK on ${bad.map((r) => r.path).join(", ")}`);
    process.exit(1);
  }
  console.log(`RESULT: ${publicOk.length}/${student.length} student URLs reached Pages.`);
  const teacher = rows.find((r) => r.audience === "teacher");
  if (teacher?.class === ACCESS_CLASS.APP_AUTH) {
    console.log("  Teacher tools returned APP AUTH INTERCEPT (HTTP Basic) — expected.");
  } else if (teacher) {
    console.log(`  Teacher tools: ${teacher.class} (HTTP ${teacher.status})`);
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
