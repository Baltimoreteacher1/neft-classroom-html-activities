#!/usr/bin/env node
// Idempotent Neon Serverless Postgres (+ pgvector) migration & seed runner
// for the BCPSS Curriculum-to-Language Ecosystem.
//
// Usage: DATABASE_URL=postgres://... node db/seeds/bcpss/run_all_seeds.mjs

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import {
  BCPSS_UNITS,
  FAMILY_CARDS,
  LANGUAGE_BLUEPRINTS,
  UNIT_ACTIVITIES,
  UNIT_CONNECTIONS,
} from "../../../data/bcpss-curriculum-seed.mjs";
import { embedText, toPgVectorLiteral } from "../../../functions/_lib/bcpss/embeddings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATION_PATH = path.resolve(__dirname, "../../migrations/001_bcpss_ecosystem.sql");

function splitSqlStatements(sqlText) {
  return sqlText
    .split(/;\s*(?:\r?\n|$)/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("ERROR: DATABASE_URL is not set. Export DATABASE_URL to seed Neon Postgres.");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("1/6 Running idempotent DDL migration (001_bcpss_ecosystem.sql)...");
  const ddl = await readFile(MIGRATION_PATH, "utf8");
  for (const stmt of splitSqlStatements(ddl)) {
    await sql.query(stmt);
  }

  console.log(`2/6 Upserting ${LANGUAGE_BLUEPRINTS.length} WIDA language blueprints...`);
  for (const bp of LANGUAGE_BLUEPRINTS) {
    const vecLiteral = toPgVectorLiteral(
      embedText(`${bp.wida_klu} ${bp.move_name} ${bp.syntax_pattern}`),
    );
    await sql`
      INSERT INTO language_blueprints (id, wida_klu, move_name, syntax_pattern, scaffolds_json, embedding)
      VALUES (
        ${bp.id},
        ${bp.wida_klu},
        ${bp.move_name},
        ${bp.syntax_pattern},
        ${JSON.stringify(bp.scaffolds_json)}::jsonb,
        ${vecLiteral}::vector
      )
      ON CONFLICT (id) DO UPDATE SET
        wida_klu = EXCLUDED.wida_klu,
        move_name = EXCLUDED.move_name,
        syntax_pattern = EXCLUDED.syntax_pattern,
        scaffolds_json = EXCLUDED.scaffolds_json,
        embedding = EXCLUDED.embedding
    `;
  }

  console.log(`3/6 Upserting ${BCPSS_UNITS.length} K-8 BCPSS units...`);
  for (const u of BCPSS_UNITS) {
    const vecLiteral = toPgVectorLiteral(
      embedText(
        `Grade ${u.grade} ${u.subject} ${u.curriculum_name} ${u.unit_title} ${u.unit_summary} ${u.core_standards.join(" ")}`,
      ),
    );
    await sql`
      INSERT INTO bcpss_units (
        id, grade, subject, curriculum_name, unit_number,
        unit_title, unit_summary, core_standards,
        external_content_lab_url, external_content_lab_label, embedding
      )
      VALUES (
        ${u.id},
        ${u.grade},
        ${u.subject},
        ${u.curriculum_name},
        ${u.unit_number},
        ${u.unit_title},
        ${u.unit_summary},
        ${u.core_standards},
        ${u.external_content_lab_url},
        ${u.external_content_lab_label},
        ${vecLiteral}::vector
      )
      ON CONFLICT (id) DO UPDATE SET
        grade = EXCLUDED.grade,
        subject = EXCLUDED.subject,
        curriculum_name = EXCLUDED.curriculum_name,
        unit_number = EXCLUDED.unit_number,
        unit_title = EXCLUDED.unit_title,
        unit_summary = EXCLUDED.unit_summary,
        core_standards = EXCLUDED.core_standards,
        external_content_lab_url = EXCLUDED.external_content_lab_url,
        external_content_lab_label = EXCLUDED.external_content_lab_label,
        embedding = EXCLUDED.embedding
    `;
  }

  console.log(`4/6 Upserting ${UNIT_CONNECTIONS.length} unit_connections...`);
  for (const c of UNIT_CONNECTIONS) {
    await sql`
      INSERT INTO unit_connections (
        id, unit_id, blueprint_id, unit_example_frame, cross_subject_bridge_note,
        l1_watchouts, tier2_tier3_vocab, language_exit_ticket_json
      )
      VALUES (
        ${c.id},
        ${c.unit_id},
        ${c.blueprint_id},
        ${c.unit_example_frame},
        ${c.cross_subject_bridge_note},
        ${JSON.stringify(c.l1_watchouts)}::jsonb,
        ${JSON.stringify(c.tier2_tier3_vocab)}::jsonb,
        ${JSON.stringify(c.language_exit_ticket_json)}::jsonb
      )
      ON CONFLICT (id) DO UPDATE SET
        unit_id = EXCLUDED.unit_id,
        blueprint_id = EXCLUDED.blueprint_id,
        unit_example_frame = EXCLUDED.unit_example_frame,
        cross_subject_bridge_note = EXCLUDED.cross_subject_bridge_note,
        l1_watchouts = EXCLUDED.l1_watchouts,
        tier2_tier3_vocab = EXCLUDED.tier2_tier3_vocab,
        language_exit_ticket_json = EXCLUDED.language_exit_ticket_json
    `;
  }

  console.log(`5/6 Upserting ${UNIT_ACTIVITIES.length} classroom activities...`);
  for (const a of UNIT_ACTIVITIES) {
    await sql`
      INSERT INTO unit_activities (
        id, unit_id, activity_order, activity_type, title,
        prep_time_minutes, teacher_instructions, student_prompt, target_lab_route
      )
      VALUES (
        ${a.id},
        ${a.unit_id},
        ${a.activity_order},
        ${a.activity_type},
        ${a.title},
        ${a.prep_time_minutes},
        ${a.teacher_instructions},
        ${a.student_prompt},
        ${a.target_lab_route}
      )
      ON CONFLICT (id) DO UPDATE SET
        unit_id = EXCLUDED.unit_id,
        activity_order = EXCLUDED.activity_order,
        activity_type = EXCLUDED.activity_type,
        title = EXCLUDED.title,
        prep_time_minutes = EXCLUDED.prep_time_minutes,
        teacher_instructions = EXCLUDED.teacher_instructions,
        student_prompt = EXCLUDED.student_prompt,
        target_lab_route = EXCLUDED.target_lab_route
    `;
  }

  console.log(`6/6 Upserting ${FAMILY_CARDS.length} multilingual family cards...`);
  for (const f of FAMILY_CARDS) {
    await sql`
      INSERT INTO bcpss_family_cards (unit_id, translations_json)
      VALUES (${f.unit_id}, ${JSON.stringify(f.translations_json)}::jsonb)
      ON CONFLICT (unit_id) DO UPDATE SET
        translations_json = EXCLUDED.translations_json
    `;
  }

  console.log("SUCCESS: BCPSS Curriculum-to-Language Ecosystem seeded to Neon Postgres.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
