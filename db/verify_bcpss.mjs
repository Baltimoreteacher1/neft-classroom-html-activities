#!/usr/bin/env node
// Verification gate for the BCPSS Curriculum-to-Language Ecosystem.
// Usage:
//   node db/verify_bcpss.mjs --local   (verifies canonical local seed modules)
//   DATABASE_URL=... node db/verify_bcpss.mjs (verifies both local + live Neon counts)

import { neon } from "@neondatabase/serverless";
import {
  BCPSS_UNITS,
  FAMILY_CARDS,
  GRADES,
  LANGUAGE_BLUEPRINTS,
  SUBJECTS,
  UNIT_ACTIVITIES,
  UNIT_CONNECTIONS,
} from "../data/bcpss-curriculum-seed.mjs";

const failures = [];

function check(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

function verifyLocal() {
  console.log("=== BCPSS Ecosystem Local Canonical Verification ===");

  // 1. Blueprints >= 12 and all 4 KLUs covered
  check(
    LANGUAGE_BLUEPRINTS.length >= 12,
    `LANGUAGE_BLUEPRINTS count is ${LANGUAGE_BLUEPRINTS.length} (expected >= 12)`,
  );
  const kluCounts = new Map();
  for (const bp of LANGUAGE_BLUEPRINTS) {
    kluCounts.set(bp.wida_klu, (kluCounts.get(bp.wida_klu) || 0) + 1);
    for (const tier of ["level_1_2", "level_3_4", "level_5_6"]) {
      const s = bp.scaffolds_json?.[tier];
      if (!s || !Array.isArray(s.sentence_frames) || s.sentence_frames.length < 3) {
        failures.push(`Blueprint ${bp.id} missing 3 sentence_frames in ${tier}`);
      }
      if (!s || !Array.isArray(s.word_bank) || s.word_bank.length < 6) {
        failures.push(`Blueprint ${bp.id} missing 6+ word_bank terms in ${tier}`);
      }
    }
  }
  for (const klu of ["Argue", "Explain", "Inform", "Narrate"]) {
    check(kluCounts.get(klu) === 3, `KLU "${klu}" has ${kluCounts.get(klu) || 0} blueprints (expected 3)`);
  }

  // 2. Units === 162 (36 ELA, 54 Math, 36 Science, 36 Social Studies)
  check(BCPSS_UNITS.length === 162, `BCPSS_UNITS count is ${BCPSS_UNITS.length} (expected 162)`);
  const bySubject = Object.fromEntries(SUBJECTS.map((s) => [s, 0]));
  const unitIdSet = new Set();
  for (const u of BCPSS_UNITS) {
    bySubject[u.subject] = (bySubject[u.subject] || 0) + 1;
    unitIdSet.add(u.id);
  }
  check(unitIdSet.size === 162, `Unique unit IDs: ${unitIdSet.size} (expected 162)`);
  check(bySubject.ELA === 36, `ELA units: ${bySubject.ELA} (expected 36)`);
  check(bySubject.Math === 54, `Math units: ${bySubject.Math} (expected 54)`);
  check(bySubject.Science === 36, `Science units: ${bySubject.Science} (expected 36)`);
  check(bySubject["Social Studies"] === 36, `Social Studies units: ${bySubject["Social Studies"]} (expected 36)`);

  // Verify Grade 6 Math gold-standard EduWonderLab URLs + g6-math-u2 Ratios & Rates
  const g6Math = BCPSS_UNITS.filter((u) => u.grade === "6" && u.subject === "Math");
  const g6MathWithUrl = g6Math.filter((u) => u.external_content_lab_url?.startsWith("https://eduwonderlab.com"));
  check(g6MathWithUrl.length === 6, `Grade 6 Math units with eduwonderlab.com URLs: ${g6MathWithUrl.length}/6`);
  const g6MathU2 = BCPSS_UNITS.find((u) => u.id === "g6-math-u2");
  check(
    g6MathU2 && /ratio/i.test(g6MathU2.unit_title),
    `g6-math-u2 is "${g6MathU2?.unit_title}" (expected Ratios & Rates)`,
  );

  // 3. Connections === 162, every unit has >= 1 connection + language_exit_ticket_json
  check(UNIT_CONNECTIONS.length === 162, `UNIT_CONNECTIONS count is ${UNIT_CONNECTIONS.length} (expected 162)`);
  const bpIds = new Set(LANGUAGE_BLUEPRINTS.map((b) => b.id));
  const connByUnit = new Map();
  let missingExitTickets = 0;
  let invalidBlueprintRefs = 0;
  for (const c of UNIT_CONNECTIONS) {
    connByUnit.set(c.unit_id, (connByUnit.get(c.unit_id) || 0) + 1);
    if (!bpIds.has(c.blueprint_id)) invalidBlueprintRefs++;
    if (!c.language_exit_ticket_json?.prompt || !c.language_exit_ticket_json?.target_frame) {
      missingExitTickets++;
    }
  }
  const unitsMissingConn = BCPSS_UNITS.filter((u) => !connByUnit.has(u.id)).length;
  check(unitsMissingConn === 0, `Units missing connections: ${unitsMissingConn} (expected 0)`);
  check(invalidBlueprintRefs === 0, `Invalid blueprint_id references: ${invalidBlueprintRefs} (expected 0)`);
  check(missingExitTickets === 0, `Connections missing language_exit_ticket_json: ${missingExitTickets} (expected 0)`);

  // 4. Activities === 486 (zero units with < 3 activities)
  check(UNIT_ACTIVITIES.length === 486, `UNIT_ACTIVITIES count is ${UNIT_ACTIVITIES.length} (expected 486)`);
  const actsByUnit = new Map();
  for (const a of UNIT_ACTIVITIES) {
    actsByUnit.set(a.unit_id, (actsByUnit.get(a.unit_id) || 0) + 1);
  }
  const unitsUnder3Acts = BCPSS_UNITS.filter((u) => (actsByUnit.get(u.id) || 0) < 3).length;
  check(unitsUnder3Acts === 0, `Units with < 3 activities: ${unitsUnder3Acts} (expected 0)`);

  // 5. Family cards === 162 with all 4 languages (en, es, ar, fr)
  check(FAMILY_CARDS.length === 162, `FAMILY_CARDS count is ${FAMILY_CARDS.length} (expected 162)`);
  let incompleteCards = 0;
  for (const f of FAMILY_CARDS) {
    const t = f.translations_json || {};
    for (const lang of ["en", "es", "ar", "fr"]) {
      if (!t[lang]?.title || !t[lang]?.summary || !t[lang]?.dinner_question || !Array.isArray(t[lang]?.key_words)) {
        incompleteCards++;
        break;
      }
    }
  }
  check(incompleteCards === 0, `Incomplete EN/ES/AR/FR family cards: ${incompleteCards} (expected 0)`);

  // 6. Cross-subject blueprint sharing across EVERY grade K-8
  const unitById = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
  const gradeTransferSummary = [];
  for (const grade of GRADES) {
    const bpSubjects = new Map();
    for (const c of UNIT_CONNECTIONS) {
      const u = unitById.get(c.unit_id);
      if (u?.grade !== grade) continue;
      if (!bpSubjects.has(c.blueprint_id)) bpSubjects.set(c.blueprint_id, new Set());
      bpSubjects.get(c.blueprint_id).add(u.subject);
    }
    const sharedBps = [...bpSubjects.entries()].filter(([, subs]) => subs.size >= 2);
    gradeTransferSummary.push(`G${grade}:${sharedBps.length}`);
    check(
      sharedBps.length >= 2,
      `Grade ${grade} has ${sharedBps.length} cross-subject shared blueprints (${sharedBps.map(([id, s]) => `${id}[${[...s].join("+")}]`).join(", ")})`,
    );
  }
  console.log(`Cross-subject shared blueprints per grade: ${gradeTransferSummary.join(" | ")}`);
}

async function verifyNeon() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return;

  console.log("\n=== BCPSS Ecosystem Live Neon Postgres Verification ===");
  const sql = neon(databaseUrl);
  const [bp] = await sql`SELECT COUNT(*)::int AS n FROM language_blueprints`;
  const [u] = await sql`SELECT COUNT(*)::int AS n FROM bcpss_units`;
  const [c] = await sql`SELECT COUNT(*)::int AS n FROM unit_connections`;
  const [a] = await sql`SELECT COUNT(*)::int AS n FROM unit_activities`;
  const [f] = await sql`SELECT COUNT(*)::int AS n FROM bcpss_family_cards`;

  check(bp.n >= 12, `Neon language_blueprints: ${bp.n} (expected >= 12)`);
  check(u.n === 162, `Neon bcpss_units: ${u.n} (expected 162)`);
  check(c.n === 162, `Neon unit_connections: ${c.n} (expected 162)`);
  check(a.n === 486, `Neon unit_activities: ${a.n} (expected 486)`);
  check(f.n === 162, `Neon bcpss_family_cards: ${f.n} (expected 162)`);
}

async function main() {
  const localOnly = process.argv.includes("--local");
  verifyLocal();
  if (!localOnly && process.env.DATABASE_URL) {
    await verifyNeon();
  }
  if (failures.length > 0) {
    console.error(`\nVERIFICATION FAILED (${failures.length} error(s)).`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED.");
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
