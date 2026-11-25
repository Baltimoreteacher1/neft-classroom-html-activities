// Dual-mode data access layer for the BCPSS Teachers Curriculum-to-Language Hub.
//
// Primary:  Neon Serverless Postgres (+ pgvector) when env.DATABASE_URL is configured.
// Fallback: Canonical dataset (data/bcpss-curriculum-seed.mjs) + Cloudflare D1 (env.DB)
//           for bcpss_shared_plans & bcpss_unit_telemetry (with in-memory fallbacks when env.DB is absent).

import { neon } from "@neondatabase/serverless";
import * as seed from "../../../data/bcpss-curriculum-seed.mjs";
import { cosineSimilarity, embedText, toPgVectorLiteral } from "./embeddings.js";
import { buildEsolPack } from "./esol-pack.js";
import { loadLessonLinks, withLessonLinks } from "./lesson-links.js";
import { loadModuleFacts, moduleOf } from "./module-facts.js";
import {
  applyStudio,
  loadFamily,
  loadStudio,
  loadWriting,
  studioEssentialQuestions,
} from "./studio.js";

const BCPSS_UNITS = seed.BCPSS_UNITS || [];
const LANGUAGE_BLUEPRINTS = seed.LANGUAGE_BLUEPRINTS || [];
const UNIT_ACTIVITIES = seed.UNIT_ACTIVITIES || [];
const UNIT_CONNECTIONS = seed.UNIT_CONNECTIONS || [];
const FAMILY_CARDS = seed.FAMILY_CARDS || [];

const SEED_UNIT_BY_ID = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
const SEED_CONN_BY_UNIT_ID = new Map(UNIT_CONNECTIONS.map((c) => [c.unit_id, c]));
const SEED_ACT_BY_ID = new Map(UNIT_ACTIVITIES.map((a) => [a.id, a]));

const ESOL_CATALOG = { units: BCPSS_UNITS, connections: UNIT_CONNECTIONS };
const READING_BY_UNIT = new Map((seed.UNIT_READINGS || []).map((r) => [r.unit_id, r]));

export const GRADES = seed.GRADES || [];
export const SUBJECTS = seed.SUBJECTS || [];
export const TELEMETRY_EVENT_TYPES = [
  "scaffold_toggle",
  "vocab_lookup",
  "activity_copy",
  "lab_launch",
  "esol_routine",
];

const memoryPlans = new Map();
const memoryTelemetry = [];
const MAX_MEMORY_TELEMETRY = 2000;
let d1PlansSchemaReady = false;
let d1TelemetrySchemaReady = false;

const SHORT_ID_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

export function generateShortId(length = 10) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let id = "";
  for (let i = 0; i < length; i++) {
    id += SHORT_ID_ALPHABET[bytes[i] % SHORT_ID_ALPHABET.length];
  }
  return id;
}

export function jsonResponse(
  data,
  { status = 200, cache = false, cacheMaxAge = 300, backend = "neon", headers: extraHeaders } = {},
) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "X-BCPSS-Backend": backend,
    "Cache-Control": cache
      ? `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${cacheMaxAge * 2}`
      : "no-store",
  });
  if (extraHeaders) {
    for (const [k, v] of Object.entries(extraHeaders)) {
      headers.set(k, v);
    }
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function maybeParseJson(val) {
  if (typeof val !== "string") return val;
  const trimmed = val.trim();
  if (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return val;
    }
  }
  return val;
}

function normalizeBlueprint(row) {
  if (!row) return null;
  return {
    id: row.id,
    wida_klu: row.wida_klu,
    move_name: row.move_name,
    syntax_pattern: row.syntax_pattern,
    scaffolds_json: maybeParseJson(row.scaffolds_json),
  };
}

function normalizeUnit(row) {
  if (!row) return null;
  const seedUnit =
    !row.essential_question || !row.publisher_meta ? SEED_UNIT_BY_ID.get(row.id) || null : null;
  return {
    id: row.id,
    grade: String(row.grade),
    subject: row.subject,
    curriculum_name: row.curriculum_name,
    unit_number: Number(row.unit_number),
    unit_title: row.unit_title,
    unit_summary: row.unit_summary,
    essential_question: row.essential_question ?? seedUnit?.essential_question ?? null,
    core_standards: maybeParseJson(row.core_standards),
    external_content_lab_url: row.external_content_lab_url ?? null,
    external_content_lab_label: row.external_content_lab_label ?? null,
    publisher_meta: maybeParseJson(row.publisher_meta ?? seedUnit?.publisher_meta ?? null),
  };
}

function normalizeConnection(row) {
  const seedConn = SEED_CONN_BY_UNIT_ID.get(row.unit_id) || null;
  return {
    id: row.id,
    unit_id: row.unit_id,
    blueprint_id: row.blueprint_id,
    wida_klu: row.wida_klu ?? null,
    move_name: row.move_name ?? null,
    syntax_pattern: row.syntax_pattern ?? null,
    scaffolds_json: maybeParseJson(row.scaffolds_json ?? null),
    unit_example_frame: row.unit_example_frame,
    cross_subject_bridge_note: row.cross_subject_bridge_note,
    l1_watchouts: maybeParseJson(row.l1_watchouts),
    tier2_tier3_vocab: maybeParseJson(row.tier2_tier3_vocab),
    language_exit_ticket_json: maybeParseJson(row.language_exit_ticket_json ?? null),
    mentor_sentence_unpacking: maybeParseJson(
      row.mentor_sentence_unpacking ?? seedConn?.mentor_sentence_unpacking ?? null,
    ),
    lesson_arc: maybeParseJson(row.lesson_arc ?? seedConn?.lesson_arc ?? null),
    interactive_cloze_items: maybeParseJson(
      row.interactive_cloze_items ?? seedConn?.interactive_cloze_items ?? null,
    ),
    partner_talk_protocol: maybeParseJson(
      row.partner_talk_protocol ?? seedConn?.partner_talk_protocol ?? null,
    ),
    common_language_misconception: maybeParseJson(
      row.common_language_misconception ?? seedConn?.common_language_misconception ?? null,
    ),
  };
}

function normalizeActivity(row) {
  const seedAct = SEED_ACT_BY_ID.get(row.id) || null;
  const rawDuration = row.duration_minutes ?? seedAct?.duration_minutes ?? null;
  return {
    id: row.id,
    unit_id: row.unit_id,
    activity_order: Number(row.activity_order),
    day_label: row.day_label ?? seedAct?.day_label ?? null,
    domain: row.domain ?? seedAct?.domain ?? null,
    grouping: row.grouping ?? seedAct?.grouping ?? null,
    duration_minutes: rawDuration != null ? Number(rawDuration) : null,
    activity_type: row.activity_type,
    title: row.title,
    prep_time_minutes: Number(row.prep_time_minutes),
    materials: maybeParseJson(row.materials ?? seedAct?.materials ?? null),
    teacher_instructions: row.teacher_instructions,
    worked_example: row.worked_example ?? seedAct?.worked_example ?? null,
    student_prompt: row.student_prompt,
    differentiated_targets: maybeParseJson(
      row.differentiated_targets ?? seedAct?.differentiated_targets ?? null,
    ),
    check_for_understanding:
      row.check_for_understanding ?? seedAct?.check_for_understanding ?? null,
    target_lab_route: row.target_lab_route,
  };
}

function normalizeFamilyCard(row) {
  if (!row) return null;
  // translations_json is the source of truth (en/es today). The legacy per-language columns were
  // never populated, so they are derived from it; ar/fr_ht have no reviewed text and are not emitted.
  const translations = maybeParseJson(row.translations_json ?? null) || {};
  return {
    unit_id: row.unit_id,
    en_summary: row.en_summary ?? translations.en?.summary ?? null,
    es_summary: row.es_summary ?? translations.es?.summary ?? null,
    dinner_table_prompts: maybeParseJson(row.dinner_table_prompts ?? null),
    home_vocab_bridge: maybeParseJson(row.home_vocab_bridge ?? null),
    ...row,
  };
}

function buildDerivedFamilyCard(unit, firstConn) {
  const vocab = Array.isArray(firstConn?.tier2_tier3_vocab)
    ? firstConn.tier2_tier3_vocab.slice(0, 4)
    : [];
  const klu = firstConn?.wida_klu || "Explain";
  const frame =
    firstConn?.unit_example_frame ||
    `Ask your child to explain a key idea from ${unit.unit_title} using their home language and English.`;

  return {
    unit_id: unit.id,
    en_summary: `In Grade ${unit.grade} ${unit.subject} (Unit ${unit.unit_number}: ${unit.unit_title}), students practice the "${klu}" academic language move while learning ${unit.unit_summary}`,
    es_summary: `En Grado ${unit.grade} de ${unit.subject} (Unidad ${unit.unit_number}: ${unit.unit_title}), los estudiantes practican el lenguaje académico (${klu}) mientras exploran los conceptos clave de la unidad.`,
    dinner_table_prompts: {
      en: `Ask at home: "Can you teach me one example from ${unit.unit_title}?" Helpful starter: ${frame}`,
      es: `Pregunta en casa: "¿Puedes enseñarme un ejemplo de ${unit.unit_title} en español o en inglés?"`,
      ar: `سؤال في المنزل: "هل يمكنك أن تشرح لي مثالاً واحداً من وحدة ${unit.unit_title} بلغتنا أو بالإنجليزية؟"`,
      fr_ht: `Mande lakay: "Èske ou ka montre m yon egzanp nan ${unit.unit_title} an kreyòl, an fransè, oswa an anglè?"`,
    },
    home_vocab_bridge: vocab,
  };
}

function extractFrameString(entry) {
  if (!entry) return null;
  if (typeof entry === "string") return entry;
  if (Array.isArray(entry)) {
    const first = entry[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object") {
      return first.frame || first.starter || first.text || first.prompt || null;
    }
    return null;
  }
  if (typeof entry === "object") {
    return entry.frame || entry.starter || entry.text || entry.prompt || null;
  }
  return null;
}

function getNeonClient(env) {
  if (!env?.DATABASE_URL) return null;
  return neon(env.DATABASE_URL);
}

async function ensureD1PlansTable(db) {
  if (d1PlansSchemaReady) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS bcpss_shared_plans (
        id TEXT PRIMARY KEY,
        unit_id TEXT NOT NULL,
        wida_tier TEXT NOT NULL,
        teacher_note TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    )
    .run();
  d1PlansSchemaReady = true;
}

async function ensureD1TelemetryTable(db) {
  if (d1TelemetrySchemaReady) return;
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS bcpss_unit_telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        unit_id TEXT NOT NULL,
        wida_tier TEXT NOT NULL,
        event_type TEXT NOT NULL,
        created_at TEXT NOT NULL
      )`,
    )
    .run();
  d1TelemetrySchemaReady = true;
}

// ---------------------------------------------------------------------------
// 1. listUnits(env, grade, subject)
// ---------------------------------------------------------------------------

export async function listUnits(env, grade, subject) {
  const result = await listUnitsBase(env, grade, subject);
  const studio = await studioEssentialQuestions(result.units.map((u) => u.id));
  result.units = result.units.map((u) => ({ ...u, ...(studio.get(u.id) || {}) }));
  return result;
}

async function listUnitsBase(env, grade, subject) {
  const gradeStr = String(grade);
  const sql = getNeonClient(env);

  if (sql) {
    const rows = await sql`
      SELECT
        u.id,
        u.grade,
        u.subject,
        u.curriculum_name,
        u.unit_number,
        u.unit_title,
        u.unit_summary,
        u.core_standards,
        u.external_content_lab_url,
        u.external_content_lab_label,
        bp.wida_klu AS primary_klu,
        bp.id AS blueprint_id,
        bp.move_name AS move_name,
        (
          SELECT COUNT(*)::int
          FROM unit_activities a
          WHERE a.unit_id = u.id
        ) AS activity_count
      FROM bcpss_units u
      LEFT JOIN LATERAL (
        SELECT c.blueprint_id, lb.wida_klu, lb.move_name, lb.id
        FROM unit_connections c
        JOIN language_blueprints lb ON lb.id = c.blueprint_id
        WHERE c.unit_id = u.id
        ORDER BY c.id ASC
        LIMIT 1
      ) bp ON TRUE
      WHERE u.grade::text = ${gradeStr} AND u.subject = ${subject}
      ORDER BY u.unit_number ASC
    `;

    return {
      backend: "neon",
      units: rows.map((r) => ({
        ...normalizeUnit(r),
        primary_klu: r.primary_klu || null,
        blueprint_id: r.blueprint_id || null,
        move_name: r.move_name || null,
        activity_count: Number(r.activity_count || 0),
      })),
    };
  }

  // Fallback: canonical dataset
  const bpById = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));
  const matching = BCPSS_UNITS.filter(
    (u) => String(u.grade) === gradeStr && u.subject === subject,
  ).sort((a, b) => Number(a.unit_number) - Number(b.unit_number));

  const units = matching.map((u) => {
    const firstConn = UNIT_CONNECTIONS.find((c) => c.unit_id === u.id) || null;
    const bp = firstConn ? bpById.get(firstConn.blueprint_id) || null : null;
    const activityCount = UNIT_ACTIVITIES.filter((a) => a.unit_id === u.id).length;
    return {
      ...normalizeUnit(u),
      primary_klu: bp?.wida_klu || null,
      blueprint_id: bp?.id || null,
      move_name: bp?.move_name || null,
      activity_count: activityCount,
    };
  });

  return { backend: "fallback-seed", units };
}

// ---------------------------------------------------------------------------
// 2. getFamilyCard(env, unitId)
// ---------------------------------------------------------------------------

export async function getFamilyCard(env, unitId) {
  const sql = getNeonClient(env);

  if (sql) {
    const unitRows = await sql`
      SELECT id, grade, subject, curriculum_name, unit_number, unit_title, unit_summary,
             core_standards, external_content_lab_url, external_content_lab_label
      FROM bcpss_units
      WHERE id = ${unitId}
      LIMIT 1
    `;
    if (!unitRows.length) return { backend: "neon", unit: null, family_card: null };
    const unit = normalizeUnit(unitRows[0]);

    const cardRows = await sql`
      SELECT *
      FROM bcpss_family_cards
      WHERE unit_id = ${unitId}
      LIMIT 1
    `;
    if (cardRows.length) {
      return { backend: "neon", unit, family_card: normalizeFamilyCard(cardRows[0]) };
    }

    const connRows = await sql`
      SELECT c.*, lb.wida_klu, lb.move_name, lb.syntax_pattern, lb.scaffolds_json
      FROM unit_connections c
      JOIN language_blueprints lb ON lb.id = c.blueprint_id
      WHERE c.unit_id = ${unitId}
      ORDER BY c.id ASC
      LIMIT 1
    `;
    const firstConn = connRows.length ? normalizeConnection(connRows[0]) : null;
    return { backend: "neon", unit, family_card: buildDerivedFamilyCard(unit, firstConn) };
  }

  // Fallback: canonical dataset
  const rawUnit = BCPSS_UNITS.find((u) => u.id === unitId);
  if (!rawUnit) return { backend: "fallback-seed", unit: null, family_card: null };
  const unit = normalizeUnit(rawUnit);

  const seedCard = FAMILY_CARDS.find((c) => c.unit_id === unitId);
  if (seedCard) {
    return { backend: "fallback-seed", unit, family_card: normalizeFamilyCard(seedCard) };
  }

  const bpById = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));
  const rawConn = UNIT_CONNECTIONS.find((c) => c.unit_id === unitId) || null;
  const firstConn = rawConn
    ? normalizeConnection({
        ...rawConn,
        wida_klu: bpById.get(rawConn.blueprint_id)?.wida_klu,
      })
    : null;

  return {
    backend: "fallback-seed",
    unit,
    family_card: buildDerivedFamilyCard(unit, firstConn),
  };
}

// ---------------------------------------------------------------------------
// 3. getUnitDetail(env, unitId)
// ---------------------------------------------------------------------------

async function getUnitDetailBase(env, unitId) {
  const sql = getNeonClient(env);

  if (sql) {
    const unitRows = await sql`
      SELECT id, grade, subject, curriculum_name, unit_number, unit_title, unit_summary,
             core_standards, external_content_lab_url, external_content_lab_label
      FROM bcpss_units
      WHERE id = ${unitId}
      LIMIT 1
    `;
    if (!unitRows.length) return { backend: "neon", detail: null };
    const unit = normalizeUnit(unitRows[0]);

    const connRows = await sql`
      SELECT
        c.id,
        c.unit_id,
        c.blueprint_id,
        c.unit_example_frame,
        c.cross_subject_bridge_note,
        c.l1_watchouts,
        c.tier2_tier3_vocab,
        c.language_exit_ticket_json,
        lb.wida_klu,
        lb.move_name,
        lb.syntax_pattern,
        lb.scaffolds_json
      FROM unit_connections c
      JOIN language_blueprints lb ON lb.id = c.blueprint_id
      WHERE c.unit_id = ${unitId}
      ORDER BY c.id ASC
    `;

    const actRows = await sql`
      SELECT
        id,
        unit_id,
        activity_order,
        activity_type,
        title,
        prep_time_minutes,
        teacher_instructions,
        student_prompt,
        target_lab_route
      FROM unit_activities
      WHERE unit_id = ${unitId}
      ORDER BY activity_order ASC
    `;

    const transferRows = await sql`
      SELECT
        u2.id AS unit_id,
        u2.grade,
        u2.subject,
        u2.curriculum_name,
        u2.unit_number,
        u2.unit_title,
        c2.blueprint_id,
        lb.wida_klu,
        lb.move_name,
        c2.unit_example_frame,
        c2.cross_subject_bridge_note
      FROM unit_connections c1
      JOIN unit_connections c2
        ON c2.blueprint_id = c1.blueprint_id AND c2.unit_id <> c1.unit_id
      JOIN bcpss_units u2
        ON u2.id = c2.unit_id
      JOIN language_blueprints lb
        ON lb.id = c2.blueprint_id
      WHERE c1.unit_id = ${unitId}
        AND u2.grade::text = ${unit.grade}
        AND u2.subject <> ${unit.subject}
      ORDER BY u2.subject ASC, u2.unit_number ASC
    `;

    const connections = connRows.map(normalizeConnection);
    let family_card = null;
    try {
      const cardRows = await sql`
        SELECT *
        FROM bcpss_family_cards
        WHERE unit_id = ${unitId}
        LIMIT 1
      `;
      family_card = cardRows.length
        ? normalizeFamilyCard(cardRows[0])
        : buildDerivedFamilyCard(unit, connections[0] || null);
    } catch {
      family_card = buildDerivedFamilyCard(unit, connections[0] || null);
    }

    return {
      backend: "neon",
      detail: {
        unit,
        connections,
        activities: actRows.map(normalizeActivity),
        cross_subject_transfers: transferRows.map((t) => ({
          unit_id: t.unit_id,
          grade: String(t.grade),
          subject: t.subject,
          curriculum_name: t.curriculum_name,
          unit_number: Number(t.unit_number),
          unit_title: t.unit_title,
          blueprint_id: t.blueprint_id,
          wida_klu: t.wida_klu,
          move_name: t.move_name,
          unit_example_frame: t.unit_example_frame,
          cross_subject_bridge_note: t.cross_subject_bridge_note,
        })),
        family_card,
      },
    };
  }

  // Fallback: canonical dataset
  const rawUnit = BCPSS_UNITS.find((u) => u.id === unitId);
  if (!rawUnit) return { backend: "fallback-seed", detail: null };
  const unit = normalizeUnit(rawUnit);

  const bpById = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));
  const unitById = new Map(BCPSS_UNITS.map((u) => [u.id, u]));

  const connections = UNIT_CONNECTIONS.filter((c) => c.unit_id === unitId).map((c) => {
    const bp = bpById.get(c.blueprint_id);
    return normalizeConnection({
      ...c,
      wida_klu: bp?.wida_klu,
      move_name: bp?.move_name,
      syntax_pattern: bp?.syntax_pattern,
      scaffolds_json: bp?.scaffolds_json,
    });
  });

  const activities = UNIT_ACTIVITIES.filter((a) => a.unit_id === unitId)
    .sort((a, b) => Number(a.activity_order) - Number(b.activity_order))
    .map(normalizeActivity);

  const blueprintIds = new Set(connections.map((c) => c.blueprint_id));
  const seenTransfers = new Set();
  const cross_subject_transfers = [];

  for (const c of UNIT_CONNECTIONS) {
    if (c.unit_id === unitId || !blueprintIds.has(c.blueprint_id)) continue;
    const otherUnit = unitById.get(c.unit_id);
    if (!otherUnit) continue;
    if (String(otherUnit.grade) !== unit.grade || otherUnit.subject === unit.subject) continue;
    const dedupeKey = `${otherUnit.id}:${c.blueprint_id}`;
    if (seenTransfers.has(dedupeKey)) continue;
    seenTransfers.add(dedupeKey);
    const bp = bpById.get(c.blueprint_id);
    cross_subject_transfers.push({
      unit_id: otherUnit.id,
      grade: String(otherUnit.grade),
      subject: otherUnit.subject,
      curriculum_name: otherUnit.curriculum_name,
      unit_number: Number(otherUnit.unit_number),
      unit_title: otherUnit.unit_title,
      blueprint_id: c.blueprint_id,
      wida_klu: bp?.wida_klu || null,
      move_name: bp?.move_name || null,
      unit_example_frame: c.unit_example_frame,
      cross_subject_bridge_note: c.cross_subject_bridge_note,
    });
  }

  cross_subject_transfers.sort(
    (a, b) => a.subject.localeCompare(b.subject) || a.unit_number - b.unit_number,
  );

  const seedCard = FAMILY_CARDS.find((c) => c.unit_id === unitId);
  const family_card = seedCard
    ? normalizeFamilyCard(seedCard)
    : buildDerivedFamilyCard(unit, connections[0] || null);

  return {
    backend: "fallback-seed",
    detail: {
      unit,
      connections,
      activities,
      cross_subject_transfers,
      family_card,
    },
  };
}

// Every unit detail (hub, shared plans, exports) carries the generated ESOL Power Pack and its vocabulary reading.
export async function getUnitDetail(env, unitId) {
  const result = await getUnitDetailBase(env, unitId);
  if (result.detail) {
    applyStudio(result.detail, await loadStudio(unitId));
    result.detail.studio = withLessonLinks(result.detail.studio, await loadLessonLinks(unitId));
    result.detail.module = moduleOf(await loadModuleFacts(unitId));
    result.detail.family = await loadFamily(unitId);
    result.detail.writing = await loadWriting(unitId);
    const esol_pack = buildEsolPack({
      unit: result.detail.unit,
      connection: result.detail.connections?.[0],
      catalog: ESOL_CATALOG,
      studio: result.detail.studio,
    });
    result.detail = { ...result.detail, esol_pack, reading: READING_BY_UNIT.get(unitId) || null };
  }
  return result;
}

// ---------------------------------------------------------------------------
// 4. createSharedPlan(env, { unit_id, wida_tier, teacher_note })
// ---------------------------------------------------------------------------

export async function createSharedPlan(env, { unit_id, wida_tier, teacher_note }) {
  const id = generateShortId(10);
  const created_at = new Date().toISOString();
  const sql = getNeonClient(env);

  if (sql) {
    await sql`
      INSERT INTO bcpss_shared_plans (id, unit_id, wida_tier, teacher_note, created_at)
      VALUES (${id}, ${unit_id}, ${wida_tier}, ${teacher_note}, ${created_at})
    `;
    return {
      backend: "neon",
      plan: {
        id,
        url: `/bcpss-teachers/plan/${id}`,
        unit_id,
        wida_tier,
        teacher_note,
        created_at,
      },
    };
  }

  if (env?.DB) {
    await ensureD1PlansTable(env.DB);
    await env.DB.prepare(
      `INSERT INTO bcpss_shared_plans (id, unit_id, wida_tier, teacher_note, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
      .bind(id, unit_id, wida_tier, teacher_note, created_at)
      .run();
    return {
      backend: "d1",
      plan: {
        id,
        url: `/bcpss-teachers/plan/${id}`,
        unit_id,
        wida_tier,
        teacher_note,
        created_at,
      },
    };
  }

  const record = { id, unit_id, wida_tier, teacher_note, created_at };
  memoryPlans.set(id, record);
  return {
    backend: "memory",
    plan: {
      ...record,
      url: `/bcpss-teachers/plan/${id}`,
    },
  };
}

// ---------------------------------------------------------------------------
// 5. getSharedPlan(env, id)
// ---------------------------------------------------------------------------

export async function getSharedPlan(env, id) {
  const sql = getNeonClient(env);
  let row = null;
  let backend = "memory";

  if (sql) {
    backend = "neon";
    const rows = await sql`
      SELECT id, unit_id, wida_tier, teacher_note, created_at
      FROM bcpss_shared_plans
      WHERE id = ${id}
      LIMIT 1
    `;
    row = rows[0] || null;
  } else if (env?.DB) {
    backend = "d1";
    await ensureD1PlansTable(env.DB);
    row = await env.DB.prepare(
      `SELECT id, unit_id, wida_tier, teacher_note, created_at
       FROM bcpss_shared_plans
       WHERE id = ?
       LIMIT 1`,
    )
      .bind(id)
      .first();
  } else {
    backend = "memory";
    row = memoryPlans.get(id) || null;
  }

  if (!row) {
    return { backend, result: null };
  }

  const { detail } = await getUnitDetail(env, row.unit_id);
  const plan = {
    id: row.id,
    url: `/bcpss-teachers/plan/${row.id}`,
    unit_id: row.unit_id,
    wida_tier: row.wida_tier,
    teacher_note: row.teacher_note,
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  };

  return {
    backend,
    result: {
      plan,
      ...(detail || {
        unit: null,
        connections: [],
        activities: [],
        cross_subject_transfers: [],
        family_card: null,
      }),
    },
  };
}

// ---------------------------------------------------------------------------
// 6. matchBlueprintVector(env, text)
// ---------------------------------------------------------------------------

export async function matchBlueprintVector(env, text) {
  const vec = embedText(text);
  const sql = getNeonClient(env);

  if (sql) {
    const literal = toPgVectorLiteral(vec);
    const rows = await sql`
      SELECT
        id,
        wida_klu,
        move_name,
        syntax_pattern,
        scaffolds_json,
        1 - (embedding <=> ${literal}::vector) AS similarity
      FROM language_blueprints
      ORDER BY embedding <=> ${literal}::vector ASC
      LIMIT 1
    `;
    if (rows.length) {
      const top = rows[0];
      return {
        backend: "neon",
        blueprints: [normalizeBlueprint(top)],
        matched_blueprint: {
          ...normalizeBlueprint(top),
          similarity: Number(Number(top.similarity || 0).toFixed(4)),
        },
      };
    }
  }

  // Fallback: cosine similarity over canonical blueprints
  const blueprints = LANGUAGE_BLUEPRINTS.map(normalizeBlueprint);
  let best = null;
  let bestScore = -Infinity;

  for (const bp of blueprints) {
    const bpText = `${bp.wida_klu} ${bp.move_name} ${bp.syntax_pattern} ${JSON.stringify(
      bp.scaffolds_json || {},
    )}`;
    const score = cosineSimilarity(vec, embedText(bpText));
    if (score > bestScore) {
      bestScore = score;
      best = bp;
    }
  }

  return {
    backend: "fallback-seed",
    blueprints,
    matched_blueprint: best ? { ...best, similarity: Number(bestScore.toFixed(4)) } : null,
  };
}

// ---------------------------------------------------------------------------
// 7. FERPA-safe Anonymous Telemetry: recordTelemetry & getInsights
// ---------------------------------------------------------------------------

export async function recordTelemetry(env, { unit_id, wida_tier, event_type }) {
  if (!TELEMETRY_EVENT_TYPES.includes(event_type)) {
    const err = new Error(
      `Invalid event_type "${event_type}". Expected one of: ${TELEMETRY_EVENT_TYPES.join(", ")}.`,
    );
    err.status = 400;
    throw err;
  }

  const created_at = new Date().toISOString();
  const sql = getNeonClient(env);

  if (sql) {
    await sql`
      INSERT INTO bcpss_unit_telemetry (unit_id, wida_tier, event_type, created_at)
      VALUES (${unit_id}, ${wida_tier}, ${event_type}, ${created_at})
    `;
    return { backend: "neon", recorded: true };
  }

  if (env?.DB) {
    await ensureD1TelemetryTable(env.DB);
    await env.DB.prepare(
      `INSERT INTO bcpss_unit_telemetry (unit_id, wida_tier, event_type, created_at)
       VALUES (?, ?, ?, ?)`,
    )
      .bind(unit_id, wida_tier, event_type, created_at)
      .run();
    return { backend: "d1", recorded: true };
  }

  memoryTelemetry.push({ unit_id, wida_tier, event_type, created_at });
  if (memoryTelemetry.length > MAX_MEMORY_TELEMETRY) {
    memoryTelemetry.splice(0, memoryTelemetry.length - MAX_MEMORY_TELEMETRY);
  }
  return { backend: "memory", recorded: true };
}

function aggregateEvents(events, backend) {
  const unitById = new Map(BCPSS_UNITS.map((u) => [u.id, u]));
  const bpById = new Map(LANGUAGE_BLUEPRINTS.map((bp) => [bp.id, bp]));
  const kluByUnit = new Map();
  for (const c of UNIT_CONNECTIONS) {
    if (!kluByUnit.has(c.unit_id)) {
      const bp = bpById.get(c.blueprint_id);
      if (bp?.wida_klu) kluByUnit.set(c.unit_id, bp.wida_klu);
    }
  }

  const gradeCounts = new Map();
  const unitCounts = new Map();
  const tierCounts = new Map();
  const kluCounts = new Map();
  const eventCounts = new Map();

  for (const ev of events) {
    const u = unitById.get(ev.unit_id);
    if (u) {
      const g = String(u.grade);
      gradeCounts.set(g, (gradeCounts.get(g) || 0) + 1);
    }
    unitCounts.set(ev.unit_id, (unitCounts.get(ev.unit_id) || 0) + 1);
    tierCounts.set(ev.wida_tier, (tierCounts.get(ev.wida_tier) || 0) + 1);
    const klu = kluByUnit.get(ev.unit_id);
    if (klu) {
      kluCounts.set(klu, (kluCounts.get(klu) || 0) + 1);
    }
    eventCounts.set(ev.event_type, (eventCounts.get(ev.event_type) || 0) + 1);
  }

  const top_grades = [...gradeCounts.entries()]
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => b.count - a.count);

  const top_units = [...unitCounts.entries()]
    .map(([unit_id, count]) => {
      const u = unitById.get(unit_id);
      return {
        unit_id,
        grade: u ? String(u.grade) : null,
        subject: u?.subject ?? null,
        unit_number: u ? Number(u.unit_number) : null,
        unit_title: u?.unit_title ?? unit_id,
        count,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const top_wida_tiers = [...tierCounts.entries()]
    .map(([wida_tier, count]) => ({ wida_tier, count }))
    .sort((a, b) => b.count - a.count);

  const top_klu_demand = [...kluCounts.entries()]
    .map(([wida_klu, count]) => ({ wida_klu, count }))
    .sort((a, b) => b.count - a.count);

  const event_breakdown = [...eventCounts.entries()]
    .map(([event_type, count]) => ({ event_type, count }))
    .sort((a, b) => b.count - a.count);

  return {
    window_days: 30,
    total_events: events.length,
    top_grades,
    top_units,
    top_wida_tiers,
    top_klu_demand,
    event_breakdown,
    backend,
  };
}

export async function getInsights(env) {
  const cutoffIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sql = getNeonClient(env);

  if (sql) {
    const [totals, grades, units, tiers, klus, breakdown] = await Promise.all([
      sql`
        SELECT COUNT(*)::int AS total_events
        FROM bcpss_unit_telemetry
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `,
      sql`
        SELECT u.grade::text AS grade, COUNT(*)::int AS count
        FROM bcpss_unit_telemetry t
        JOIN bcpss_units u ON u.id = t.unit_id
        WHERE t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY u.grade
        ORDER BY count DESC
      `,
      sql`
        SELECT
          t.unit_id,
          u.grade::text AS grade,
          u.subject,
          u.unit_number,
          u.unit_title,
          COUNT(*)::int AS count
        FROM bcpss_unit_telemetry t
        LEFT JOIN bcpss_units u ON u.id = t.unit_id
        WHERE t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY t.unit_id, u.grade, u.subject, u.unit_number, u.unit_title
        ORDER BY count DESC
        LIMIT 10
      `,
      sql`
        SELECT wida_tier, COUNT(*)::int AS count
        FROM bcpss_unit_telemetry
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY wida_tier
        ORDER BY count DESC
      `,
      sql`
        SELECT bp.wida_klu, COUNT(*)::int AS count
        FROM bcpss_unit_telemetry t
        JOIN LATERAL (
          SELECT lb.wida_klu
          FROM unit_connections c
          JOIN language_blueprints lb ON lb.id = c.blueprint_id
          WHERE c.unit_id = t.unit_id
          ORDER BY c.id ASC
          LIMIT 1
        ) bp ON TRUE
        WHERE t.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY bp.wida_klu
        ORDER BY count DESC
      `,
      sql`
        SELECT event_type, COUNT(*)::int AS count
        FROM bcpss_unit_telemetry
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY event_type
        ORDER BY count DESC
      `,
    ]);

    return {
      window_days: 30,
      total_events: Number(totals[0]?.total_events || 0),
      top_grades: grades.map((r) => ({ grade: r.grade, count: Number(r.count) })),
      top_units: units.map((r) => ({
        unit_id: r.unit_id,
        grade: r.grade || null,
        subject: r.subject || null,
        unit_number: r.unit_number != null ? Number(r.unit_number) : null,
        unit_title: r.unit_title || r.unit_id,
        count: Number(r.count),
      })),
      top_wida_tiers: tiers.map((r) => ({ wida_tier: r.wida_tier, count: Number(r.count) })),
      top_klu_demand: klus.map((r) => ({ wida_klu: r.wida_klu, count: Number(r.count) })),
      event_breakdown: breakdown.map((r) => ({ event_type: r.event_type, count: Number(r.count) })),
      backend: "neon",
    };
  }

  if (env?.DB) {
    await ensureD1TelemetryTable(env.DB);
    const res = await env.DB.prepare(
      `SELECT unit_id, wida_tier, event_type, created_at
       FROM bcpss_unit_telemetry
       WHERE created_at >= ?`,
    )
      .bind(cutoffIso)
      .all();
    return aggregateEvents(res?.results || [], "d1");
  }

  const recent = memoryTelemetry.filter((e) => e.created_at >= cutoffIso);
  return aggregateEvents(recent, "memory");
}

// ---------------------------------------------------------------------------
// 8. Public Cross-Domain Bridge: getPublicBridge(env, grade, subject, unitNumber)
// ---------------------------------------------------------------------------

export async function getPublicBridge(env, grade, subject, unitNumber) {
  const gradeStr = String(grade);
  const unitNum = Number(unitNumber);
  const sql = getNeonClient(env);

  let unit = null;
  let firstConn = null;
  let backend = "fallback-seed";

  if (sql) {
    backend = "neon";
    const unitRows = await sql`
      SELECT id, grade, subject, curriculum_name, unit_number, unit_title, unit_summary,
             core_standards, external_content_lab_url, external_content_lab_label
      FROM bcpss_units
      WHERE grade::text = ${gradeStr} AND subject = ${subject} AND unit_number = ${unitNum}
      LIMIT 1
    `;
    if (!unitRows.length) return { backend, bridge: null };
    unit = normalizeUnit(unitRows[0]);

    const connRows = await sql`
      SELECT
        c.id,
        c.unit_id,
        c.blueprint_id,
        c.unit_example_frame,
        c.cross_subject_bridge_note,
        c.l1_watchouts,
        c.tier2_tier3_vocab,
        c.language_exit_ticket_json,
        lb.wida_klu,
        lb.move_name,
        lb.syntax_pattern,
        lb.scaffolds_json
      FROM unit_connections c
      JOIN language_blueprints lb ON lb.id = c.blueprint_id
      WHERE c.unit_id = ${unit.id}
      ORDER BY c.id ASC
      LIMIT 1
    `;
    firstConn = connRows.length ? normalizeConnection(connRows[0]) : null;
  } else {
    const rawUnit = BCPSS_UNITS.find(
      (u) =>
        String(u.grade) === gradeStr && u.subject === subject && Number(u.unit_number) === unitNum,
    );
    if (!rawUnit) return { backend, bridge: null };
    unit = normalizeUnit(rawUnit);

    const rawConn = UNIT_CONNECTIONS.find((c) => c.unit_id === unit.id) || null;
    if (rawConn) {
      const bp = LANGUAGE_BLUEPRINTS.find((b) => b.id === rawConn.blueprint_id);
      firstConn = normalizeConnection({
        ...rawConn,
        wida_klu: bp?.wida_klu,
        move_name: bp?.move_name,
        syntax_pattern: bp?.syntax_pattern,
        scaffolds_json: bp?.scaffolds_json,
      });
    }
  }

  const scaffolds = firstConn?.scaffolds_json || {};
  const level_1_2 =
    extractFrameString(scaffolds.level_1_2) ||
    firstConn?.unit_example_frame ||
    `In ${unit.unit_title}, ___ because ___.`;
  const level_3_4 =
    extractFrameString(scaffolds.level_3_4) ||
    firstConn?.unit_example_frame ||
    `Based on ${unit.unit_title}, we can see that ___ leads to ___.`;
  const level_5_6 =
    extractFrameString(scaffolds.level_5_6) ||
    firstConn?.unit_example_frame ||
    `Evaluating the relationship in ${unit.unit_title} demonstrates that ___; consequently, ___.`;

  const deep_link = `https://thelanguagepage.com/bcpss-teachers?grade=${encodeURIComponent(
    unit.grade,
  )}&subject=${encodeURIComponent(unit.subject)}&unit=${encodeURIComponent(unit.id)}`;

  return {
    backend,
    bridge: {
      unit,
      wida_klu: firstConn?.wida_klu || null,
      move_name: firstConn?.move_name || null,
      syntax_pattern: firstConn?.syntax_pattern || null,
      sentence_frames: {
        level_1_2,
        level_3_4,
        level_5_6,
      },
      top_frames: [
        { tier: "level_1_2", label: "WIDA Level 1–2", frame: level_1_2 },
        { tier: "level_3_4", label: "WIDA Level 3–4", frame: level_3_4 },
        { tier: "level_5_6", label: "WIDA Level 5–6", frame: level_5_6 },
      ],
      deep_link,
    },
  };
}
