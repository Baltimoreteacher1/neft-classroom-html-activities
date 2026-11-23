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

  // 3. Connections === 162, every unit has >= 1 connection + schema-valid vocab, l1_watchouts, exit ticket
  check(UNIT_CONNECTIONS.length === 162, `UNIT_CONNECTIONS count is ${UNIT_CONNECTIONS.length} (expected 162)`);
  const bpIds = new Set(LANGUAGE_BLUEPRINTS.map((b) => b.id));
  const connByUnit = new Map();
  let missingEssentialQuestions = 0;
  let invalidBlueprintRefs = 0;
  let invalidVocabEntries = 0;
  let invalidL1Watchouts = 0;
  let invalidExitTickets = 0;

  for (const u of BCPSS_UNITS) {
    if (typeof u.essential_question !== "string" || !u.essential_question.trim()) {
      missingEssentialQuestions++;
    }
  }

  for (const c of UNIT_CONNECTIONS) {
    connByUnit.set(c.unit_id, (connByUnit.get(c.unit_id) || 0) + 1);
    if (!bpIds.has(c.blueprint_id)) invalidBlueprintRefs++;

    const vocab = Array.isArray(c.tier2_tier3_vocab) ? c.tier2_tier3_vocab : [];
    if (vocab.length === 0) invalidVocabEntries++;
    for (const v of vocab) {
      if (
        typeof v?.term !== "string" ||
        !v.term.trim() ||
        (v.tier !== 2 && v.tier !== 3) ||
        typeof v?.student_friendly_def !== "string" ||
        !v.student_friendly_def.trim()
      ) {
        invalidVocabEntries++;
      }
    }

    const watchouts = Array.isArray(c.l1_watchouts) ? c.l1_watchouts : [];
    if (watchouts.length < 3) invalidL1Watchouts++;
    for (const w of watchouts) {
      if (
        typeof w?.l1_group !== "string" ||
        !w.l1_group.trim() ||
        typeof w?.friction_point !== "string" ||
        !w.friction_point.trim() ||
        typeof w?.quick_fix !== "string" ||
        !w.quick_fix.trim()
      ) {
        invalidL1Watchouts++;
      }
    }

    const et = c.language_exit_ticket_json;
    const validLookFors =
      Array.isArray(et?.look_fors) &&
      et.look_fors.length >= 3 &&
      et.look_fors.every((item) => typeof item === "string" && item.trim().length > 0);
    const r = et?.quick_rubric;
    const validRubric =
      typeof r?.emerging === "string" &&
      r.emerging.trim().length > 0 &&
      typeof r?.developing === "string" &&
      r.developing.trim().length > 0 &&
      typeof r?.proficient === "string" &&
      r.proficient.trim().length > 0;
    if (
      typeof et?.prompt !== "string" ||
      !et.prompt.trim() ||
      typeof et?.target_frame !== "string" ||
      !et.target_frame.trim() ||
      !validLookFors ||
      !validRubric
    ) {
      invalidExitTickets++;
    }
  }
  const unitsMissingConn = BCPSS_UNITS.filter((u) => !connByUnit.has(u.id)).length;
  check(
    missingEssentialQuestions === 0,
    `Units missing essential_question: ${missingEssentialQuestions} (expected 0)`,
  );
  check(unitsMissingConn === 0, `Units missing connections: ${unitsMissingConn} (expected 0)`);
  check(invalidBlueprintRefs === 0, `Invalid blueprint_id references: ${invalidBlueprintRefs} (expected 0)`);
  check(
    invalidVocabEntries === 0,
    `Invalid tier2_tier3_vocab entries (term/tier/student_friendly_def): ${invalidVocabEntries} (expected 0)`,
  );
  check(
    invalidL1Watchouts === 0,
    `Invalid l1_watchouts entries (l1_group/friction_point/quick_fix): ${invalidL1Watchouts} (expected 0)`,
  );
  check(
    invalidExitTickets === 0,
    `Invalid language_exit_ticket_json records (prompt/look_fors>=3/quick_rubric): ${invalidExitTickets} (expected 0)`,
  );

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

  // 7. Verify g6-math-u2 and every Grade 6 Math unit has >= 1 cross-subject transfer in Grade 6
  const g6MathUnits = BCPSS_UNITS.filter((u) => u.grade === "6" && u.subject === "Math");
  for (const mathUnit of g6MathUnits) {
    const mathConns = UNIT_CONNECTIONS.filter((c) => c.unit_id === mathUnit.id);
    const bpSet = new Set(mathConns.map((c) => c.blueprint_id));
    const transfers = UNIT_CONNECTIONS.filter((c) => {
      if (c.unit_id === mathUnit.id || !bpSet.has(c.blueprint_id)) return false;
      const other = unitById.get(c.unit_id);
      return other && other.grade === "6" && other.subject !== "Math";
    });
    check(
      transfers.length >= 1,
      `${mathUnit.id} (${mathUnit.unit_title}) has ${transfers.length} Grade 6 cross-subject transfer(s) (expected >= 1)`,
    );
  }
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
