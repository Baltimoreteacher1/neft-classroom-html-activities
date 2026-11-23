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

  // Verify Grade 6 Math has no external eduwonderlab.com links + g6-math-u2 Ratios & Rates
  const g6Math = BCPSS_UNITS.filter((u) => u.grade === "6" && u.subject === "Math");
  const g6MathWithUrl = g6Math.filter((u) => u.external_content_lab_url?.includes("eduwonderlab.com"));
  check(g6MathWithUrl.length === 0, `Grade 6 Math units with eduwonderlab.com URLs: ${g6MathWithUrl.length}/6 (expected 0)`);
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
  let invalidPublisherMeta = 0;
  let invalidBlueprintRefs = 0;
  let invalidVocabEntries = 0;
  let invalidL1Watchouts = 0;
  let invalidExitTickets = 0;
  let invalidMentorSentences = 0;
  let invalidLessonArcs = 0;
  let invalidClozeItems = 0;
  let invalidPartnerTalks = 0;
  let invalidMisconceptions = 0;

  const validGradeBands = new Set(["K–2", "3–5", "6–8"]);
  const validColorTokens = new Set(["connector", "concept", "evidence", "precision"]);

  for (const u of BCPSS_UNITS) {
    if (typeof u.essential_question !== "string" || !u.essential_question.trim()) {
      missingEssentialQuestions++;
    }
    const pm = u.publisher_meta;
    if (
      typeof pm?.publisher_imprint !== "string" ||
      !pm.publisher_imprint.trim() ||
      !validGradeBands.has(pm?.grade_band) ||
      typeof pm?.signature_protocol !== "string" ||
      !pm.signature_protocol.trim()
    ) {
      invalidPublisherMeta++;
    }
  }

  for (const c of UNIT_CONNECTIONS) {
    connByUnit.set(c.unit_id, (connByUnit.get(c.unit_id) || 0) + 1);
    if (!bpIds.has(c.blueprint_id)) invalidBlueprintRefs++;

    const vocab = Array.isArray(c.tier2_tier3_vocab) ? c.tier2_tier3_vocab : [];
    const vocabTermSet = new Set(vocab.map((v) => v?.term));
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
    if (watchouts.length < 1) invalidL1Watchouts++;
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

    const ms = c.mentor_sentence_unpacking;
    const chunks = Array.isArray(ms?.chunks) ? ms.chunks : [];
    const validChunks =
      chunks.length >= 3 &&
      chunks.every(
        (ch) =>
          typeof ch?.text === "string" &&
          ch.text.trim().length > 0 &&
          typeof ch?.role === "string" &&
          ch.role.trim().length > 0 &&
          validColorTokens.has(ch?.color_token) &&
          typeof ch?.student_question === "string" &&
          ch.student_question.trim().length > 0,
      );
    const reconstructed = chunks.map((ch) => ch.text).join(" ");
    if (
      typeof ms?.mentor_sentence !== "string" ||
      !ms.mentor_sentence.trim() ||
      /\[[^\]]+\]/.test(ms.mentor_sentence) ||
      !validChunks ||
      reconstructed !== ms.mentor_sentence
    ) {
      invalidMentorSentences++;
    }

    const arc = Array.isArray(c.lesson_arc) ? c.lesson_arc : [];
    const validArc =
      arc.length === 4 &&
      arc.every(
        (p) =>
          typeof p?.phase === "string" &&
          p.phase.trim().length > 0 &&
          typeof p?.minutes === "number" &&
          p.minutes > 0 &&
          typeof p?.focus === "string" &&
          p.focus.trim().length > 0 &&
          typeof p?.teacher_move === "string" &&
          p.teacher_move.trim().length > 0 &&
          typeof p?.student_move === "string" &&
          p.student_move.trim().length > 0,
      );
    if (!validArc) {
      invalidLessonArcs++;
    }

    const cloze = Array.isArray(c.interactive_cloze_items) ? c.interactive_cloze_items : [];
    const validCloze =
      cloze.length >= 3 &&
      cloze.every(
        (item) =>
          typeof item?.sentence_with_blank === "string" &&
          item.sentence_with_blank.includes("_____") &&
          typeof item?.answer === "string" &&
          vocabTermSet.has(item.answer) &&
          typeof item?.hint === "string" &&
          item.hint.trim().length > 0 &&
          Array.isArray(item?.distractor_pool) &&
          item.distractor_pool.length >= 2 &&
          !item.distractor_pool.includes(item.answer),
      );
    if (!validCloze) {
      invalidClozeItems++;
    }

    const pt = c.partner_talk_protocol;
    const validMoves =
      Array.isArray(pt?.talk_moves) &&
      pt.talk_moves.length === 4 &&
      pt.talk_moves.every(
        (m) =>
          typeof m?.label === "string" &&
          m.label.trim().length > 0 &&
          typeof m?.stem === "string" &&
          m.stem.trim().length > 0,
      );
    if (
      typeof pt?.protocol_name !== "string" ||
      !pt.protocol_name.trim() ||
      typeof pt?.role_a_title !== "string" ||
      !pt.role_a_title.trim() ||
      typeof pt?.role_a_prompt !== "string" ||
      !pt.role_a_prompt.trim() ||
      typeof pt?.role_b_title !== "string" ||
      !pt.role_b_title.trim() ||
      typeof pt?.role_b_prompt !== "string" ||
      !pt.role_b_prompt.trim() ||
      !validMoves
    ) {
      invalidPartnerTalks++;
    }

    const cm = c.common_language_misconception;
    if (
      typeof cm?.misconception_pattern !== "string" ||
      !cm.misconception_pattern.trim() ||
      typeof cm?.teacher_redirect !== "string" ||
      !cm.teacher_redirect.trim()
    ) {
      invalidMisconceptions++;
    }
  }
  const unitsMissingConn = BCPSS_UNITS.filter((u) => !connByUnit.has(u.id)).length;
  check(
    missingEssentialQuestions === 0,
    `Units missing essential_question: ${missingEssentialQuestions} (expected 0)`,
  );
  check(
    invalidPublisherMeta === 0,
    `Units with invalid publisher_meta: ${invalidPublisherMeta} (expected 0)`,
  );
  check(unitsMissingConn === 0, `Units missing connections: ${unitsMissingConn} (expected 0)`);
  check(invalidBlueprintRefs === 0, `Invalid blueprint_id references: ${invalidBlueprintRefs} (expected 0)`);
  check(
    invalidVocabEntries === 0,
    `Invalid tier2_tier3_vocab entries (term/tier/student_friendly_def): ${invalidVocabEntries} (expected 0)`,
  );
  check(
    invalidL1Watchouts === 0,
    `Invalid l1_watchouts entries (Spanish-English >= 1): ${invalidL1Watchouts} (expected 0)`,
  );
  check(
    invalidExitTickets === 0,
    `Invalid language_exit_ticket_json records (prompt/look_fors>=3/quick_rubric): ${invalidExitTickets} (expected 0)`,
  );
  check(
    invalidMentorSentences === 0,
    `Invalid mentor_sentence_unpacking records (chunks>=3, clean reconstruction): ${invalidMentorSentences} (expected 0)`,
  );
  check(
    invalidLessonArcs === 0,
    `Invalid lesson_arc records (4 phases): ${invalidLessonArcs} (expected 0)`,
  );
  check(
    invalidClozeItems === 0,
    `Invalid interactive_cloze_items records (>=3 items with exact vocab answers): ${invalidClozeItems} (expected 0)`,
  );
  check(
    invalidPartnerTalks === 0,
    `Invalid partner_talk_protocol records (roles + 4 talk_moves): ${invalidPartnerTalks} (expected 0)`,
  );
  check(
    invalidMisconceptions === 0,
    `Invalid common_language_misconception records: ${invalidMisconceptions} (expected 0)`,
  );

  // 4. Activities === 810 (162 × 5: 180 ELA, 270 Math, 180 Science, 180 Social Studies)
  check(UNIT_ACTIVITIES.length === 810, `UNIT_ACTIVITIES count is ${UNIT_ACTIVITIES.length} (expected 810)`);
  const unitSubjectById = new Map(BCPSS_UNITS.map((u) => [u.id, u.subject]));
  const actsBySubject = Object.fromEntries(SUBJECTS.map((s) => [s, 0]));
  const actsByUnit = new Map();
  let invalidActivityFields = 0;
  for (const a of UNIT_ACTIVITIES) {
    actsByUnit.set(a.unit_id, (actsByUnit.get(a.unit_id) || 0) + 1);
    const subj = unitSubjectById.get(a.unit_id);
    if (subj) actsBySubject[subj] = (actsBySubject[subj] || 0) + 1;
    const dt = a.differentiated_targets;
    const validDiffTargets =
      typeof dt?.level_1_2 === "string" &&
      dt.level_1_2.trim().length > 0 &&
      typeof dt?.level_3_4 === "string" &&
      dt.level_3_4.trim().length > 0 &&
      typeof dt?.level_5_6 === "string" &&
      dt.level_5_6.trim().length > 0;
    if (
      typeof a.day_label !== "string" ||
      !a.day_label.trim() ||
      typeof a.domain !== "string" ||
      !a.domain.trim() ||
      typeof a.grouping !== "string" ||
      !a.grouping.trim() ||
      typeof a.worked_example !== "string" ||
      !a.worked_example.trim() ||
      !validDiffTargets ||
      typeof a.check_for_understanding !== "string" ||
      !a.check_for_understanding.trim()
    ) {
      invalidActivityFields++;
    }
  }
  check(actsBySubject.ELA === 180, `ELA activities: ${actsBySubject.ELA} (expected 180)`);
  check(actsBySubject.Math === 270, `Math activities: ${actsBySubject.Math} (expected 270)`);
  check(actsBySubject.Science === 180, `Science activities: ${actsBySubject.Science} (expected 180)`);
  check(
    actsBySubject["Social Studies"] === 180,
    `Social Studies activities: ${actsBySubject["Social Studies"]} (expected 180)`,
  );
  const unitsUnder5Acts = BCPSS_UNITS.filter((u) => (actsByUnit.get(u.id) || 0) < 5).length;
  check(unitsUnder5Acts === 0, `Units with < 5 activities: ${unitsUnder5Acts} (expected 0)`);
  check(
    invalidActivityFields === 0,
    `Activities missing day_label/domain/grouping/worked_example/differentiated_targets/check_for_understanding: ${invalidActivityFields} (expected 0)`,
  );

  // 5. Family cards === 162 with Spanish & English (en, es)
  check(FAMILY_CARDS.length === 162, `FAMILY_CARDS count is ${FAMILY_CARDS.length} (expected 162)`);
  let incompleteCards = 0;
  for (const f of FAMILY_CARDS) {
    const t = f.translations_json || {};
    for (const lang of ["en", "es"]) {
      if (!t[lang]?.title || !t[lang]?.summary || !t[lang]?.dinner_question || !Array.isArray(t[lang]?.key_words)) {
        incompleteCards++;
        break;
      }
    }
  }
  check(incompleteCards === 0, `Incomplete EN/ES family cards: ${incompleteCards} (expected 0)`);

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
  check(a.n === 810, `Neon unit_activities: ${a.n} (expected 810)`);
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
