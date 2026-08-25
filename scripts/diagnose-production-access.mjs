#!/usr/bin/env node
/* =============================================================================
 * diagnose:production-access — student runtime vs teacher protection
 * -----------------------------------------------------------------------------
 * Read-only GETs against live EduWonderLab. Distinguishes:
 *
 *   PUBLIC / PAGES REACHED      student (or public API) reached Pages
 *   CLOUDFLARE ACCESS INTERCEPT Cloudflare Access login / 302
 *   APP AUTH INTERCEPT          HTTP Basic or TEACHER_KEY 401
 *   CANONICAL REDIRECT          www → apex 308 (host hop, not content)
 *   UNEXPECTED RESPONSE / NETWORK FAILURE
 *
 * Contract (AUTH_CONTRACT.md + docs/cloudflare-access.md):
 *   Student SCORM runtime must be PUBLIC on the apex host.
 *   Teacher/admin surfaces must NOT be PUBLIC.
 *   Cloudflare Access across the whole hostname breaks Canvas SCORM.
 *
 * Exit:
 *   0  student runtime reached Pages; teacher surfaces stayed protected
 *   2  Access intercepted a required student URL
 *   3  a teacher/admin surface was PUBLIC (security leak)
 *   1  unexpected / network failure
 *
 *   npm run diagnose:production-access
 * ============================================================================= */
import { fileURLToPath } from "node:url";
import { ACCESS_CLASS, probeGet } from "./lib/cloudflare-access.mjs";

const argv = process.argv.slice(2);
const arg = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const APEX = (arg("--base") || "https://eduwonderlab.com").replace(/\/$/, "");
const WWW = (arg("--www") || "https://www.eduwonderlab.com").replace(/\/$/, "");

/** Apex student runtime the live SCORM iframe actually needs. */
export const STUDENT_TARGETS = Object.freeze([
  { path: "/", name: "homepage", kind: "document" },
  // /curriculum/ is deliberately absent: it is the teacher console and answers a
  // student with a 302, which is neither the PUBLIC 200 a student target must
  // return nor the 401 a teacher target must return (AUTH_CONTRACT §2b). Its
  // behaviour is pinned by tools/auth-contract.test.mjs and tools/e2e-auth.mjs.
  { path: "/curriculum/units/", name: "student lesson picker", kind: "document" },
  { path: "/lessons/1-1/", name: "lesson 1-1", kind: "document" },
  { path: "/lessons/5-1/", name: "lesson 5-1", kind: "document" },
  { path: "/lessons/1-1/homework.html", name: "homework 1-1", kind: "document" },
  { path: "/ratio-color-mixer/", name: "ratio color mixer", kind: "document" },
  { path: "/lessons/1-1/config.json", name: "lesson 1-1 config", kind: "config" },
  { path: "/assets/app.js", name: "shared JS", kind: "asset" },
  { path: "/assets/shared.css", name: "shared CSS", kind: "asset" },
  { path: "/lessons/1-1/reveal-assets/notice-wonder.jpg", name: "lesson image", kind: "asset" },
  { path: "/api/settings/today", name: "today plan API", kind: "student-api" },
  { path: "/api/progress/health", name: "progress health API", kind: "student-api" },
]);

/** Teacher/admin: must not become anonymously usable. */
export const TEACHER_TARGETS = Object.freeze([
  { path: "/teacher-tools/", name: "teacher tools", kind: "teacher-html" },
  { path: "/curriculum/planning/", name: "pacing planner", kind: "teacher-html" },
  { path: "/curriculum/plan-notes/", name: "plan notes", kind: "teacher-html" },
  { path: "/api/pacing/current", name: "pacing API", kind: "teacher-api" },
]);

export const WWW_TARGETS = Object.freeze([
  { path: "/lessons/1-1/", name: "www lesson 1-1", kind: "www-document" },
]);

function okStudent(cls) {
  return cls === ACCESS_CLASS.PUBLIC;
}

function okTeacher(cls) {
  return cls === ACCESS_CLASS.APP_AUTH || cls === ACCESS_CLASS.ACCESS;
}

function okWww(cls) {
  return cls === ACCESS_CLASS.CANONICAL || cls === ACCESS_CLASS.PUBLIC;
}

async function main() {
  console.log(`Production-access diagnostic (read-only GET, no writes)`);
  console.log(`  apex ${APEX}`);
  console.log(`  www  ${WWW}\n`);

  const studentRows = [];
  for (const t of STUDENT_TARGETS) {
    const r = await probeGet(`${APEX}${t.path}`);
    studentRows.push({ ...t, ...r, audience: "student" });
    const note = r.error ? ` ${r.error}` : ` HTTP ${r.status} ${r.bytes}B`;
    console.log(`  ${r.class.padEnd(32)}  student  ${t.name.padEnd(22)}  ${t.path}${note}`);
  }

  console.log("");
  const teacherRows = [];
  for (const t of TEACHER_TARGETS) {
    const r = await probeGet(`${APEX}${t.path}`);
    teacherRows.push({ ...t, ...r, audience: "teacher" });
    const note = r.error ? ` ${r.error}` : ` HTTP ${r.status} ${r.bytes}B`;
    console.log(`  ${r.class.padEnd(32)}  teacher  ${t.name.padEnd(22)}  ${t.path}${note}`);
  }

  console.log("");
  const wwwRows = [];
  for (const t of WWW_TARGETS) {
    const r = await probeGet(`${WWW}${t.path}`);
    wwwRows.push({ ...t, ...r, audience: "www" });
    const note = r.error ? ` ${r.error}` : ` HTTP ${r.status} ${r.bytes}B`;
    console.log(`  ${r.class.padEnd(32)}  www      ${t.name.padEnd(22)}  ${t.path}${note}`);
  }

  const studentAccess = studentRows.filter((r) => r.class === ACCESS_CLASS.ACCESS);
  const studentBad = studentRows.filter(
    (r) => r.class === ACCESS_CLASS.UNEXPECTED || r.class === ACCESS_CLASS.NETWORK,
  );
  const studentOk = studentRows.filter((r) => okStudent(r.class));
  const teacherPublic = teacherRows.filter((r) => r.class === ACCESS_CLASS.PUBLIC);
  const teacherBad = teacherRows.filter(
    (r) => r.class === ACCESS_CLASS.UNEXPECTED || r.class === ACCESS_CLASS.NETWORK,
  );
  const wwwAccess = wwwRows.filter((r) => r.class === ACCESS_CLASS.ACCESS);

  console.log("");
  if (teacherPublic.length) {
    console.log(`RESULT: TEACHER SURFACE PUBLIC — ${teacherPublic.map((r) => r.path).join(", ")}`);
    console.log("  A Cloudflare Access change must not open teacher/admin routes.");
    process.exit(3);
  }
  if (studentAccess.length || wwwAccess.length) {
    const paths = [...studentAccess, ...wwwAccess].map((r) => r.path);
    console.log(`RESULT: CLOUDFLARE ACCESS INTERCEPT on student runtime: ${paths.join(", ")}`);
    console.log("  Canvas SCORM iframes this origin. Access here blocks the assignment.");
    console.log("  See docs/cloudflare-access.md — do not put Access on the whole hostname.");
    process.exit(2);
  }
  if (studentBad.length || teacherBad.length) {
    const paths = [...studentBad, ...teacherBad].map((r) => r.path);
    console.log(`RESULT: UNEXPECTED / NETWORK on ${paths.join(", ")}`);
    process.exit(1);
  }
  if (studentOk.length !== studentRows.length) {
    console.log("RESULT: student runtime did not fully reach Pages.");
    process.exit(1);
  }
  if (!wwwRows.every((r) => okWww(r.class))) {
    console.log("RESULT: www host behavior is not a canonical redirect or public lesson.");
    process.exit(1);
  }
  if (!teacherRows.every((r) => okTeacher(r.class))) {
    console.log("RESULT: a teacher surface was not APP AUTH or Access.");
    process.exit(1);
  }

  console.log(
    `RESULT: ${studentOk.length}/${studentRows.length} student URLs reached Pages; teacher surfaces stayed protected.`,
  );
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await main();
