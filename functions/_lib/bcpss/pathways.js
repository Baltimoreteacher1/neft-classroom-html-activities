// BCPSS "Year Pathways": grade-level and content-level views of the K–8 curriculum-to-language hub.
//
// Everything here is derived from the canonical seed (data/bcpss-curriculum-seed.mjs), which is the
// single source of truth for units, WIDA blueprints and unit connections. The functions are pure and
// deterministic (same input, same output), so the endpoint can be edge-cached and there is no
// database migration. Nothing is invented: a "shared move" exists only where two or more content
// areas in one grade really use the same WIDA blueprint.

import * as seed from "../../../data/bcpss-curriculum-seed.mjs";

export const PATHWAYS_VERSION = 1;
export const KLU_ORDER = ["Narrate", "Inform", "Explain", "Argue"];

const GRADES = seed.GRADES || [];
const SUBJECTS = seed.SUBJECTS || [];
const UNITS = seed.BCPSS_UNITS || [];
const BLUEPRINTS = seed.LANGUAGE_BLUEPRINTS || [];
const CONNECTIONS = seed.UNIT_CONNECTIONS || [];

const BLUEPRINT_BY_ID = new Map(BLUEPRINTS.map((b) => [b.id, b]));
const CONNECTION_BY_UNIT = new Map(CONNECTIONS.map((c) => [c.unit_id, c]));

export const gradeLabel = (grade) => (String(grade) === "K" ? "Kindergarten" : `Grade ${grade}`);

/** Returns the canonical grade token ("K", "1"…"8") or null. Never trusts the caller's casing. */
export function normalizeGrade(input) {
  const token = String(input ?? "")
    .trim()
    .toUpperCase();
  return GRADES.includes(token) ? token : null;
}

const subjectOrder = (subject) => SUBJECTS.indexOf(subject);

const byUnitOrder = (a, b) =>
  subjectOrder(a.subject) - subjectOrder(b.subject) || a.unit_number - b.unit_number;

export function unitRoute(unit, tab = "connections") {
  const params = new URLSearchParams({
    grade: unit.grade,
    subject: unit.subject,
    unitId: unit.id,
    tab,
  });
  return `/bcpss-teachers?${params}`;
}

function toUnitRow(unit) {
  const conn = CONNECTION_BY_UNIT.get(unit.id);
  const blueprint = BLUEPRINT_BY_ID.get(conn?.blueprint_id);
  const terms = (conn?.tier2_tier3_vocab || []).map((v) => ({
    term: v.term,
    tier: v.tier === 3 ? 3 : 2,
    def: v.student_friendly_def || v.kid_def || "",
    es: v.cognate_es || null,
  }));
  return {
    id: unit.id,
    grade: unit.grade,
    subject: unit.subject,
    unit_number: unit.unit_number,
    title: unit.unit_title,
    summary: unit.unit_summary,
    essential_question: unit.essential_question,
    standards: unit.core_standards || [],
    curriculum: unit.curriculum_name,
    blueprint_id: blueprint?.id || null,
    move_name: blueprint?.move_name || "",
    klu: blueprint?.wida_klu || "",
    frame: conn?.unit_example_frame || "",
    terms,
    route: unitRoute(unit),
  };
}

const unitsForGrade = (grade) =>
  UNITS.filter((u) => u.grade === grade)
    .sort(byUnitOrder)
    .map(toUnitRow);

const count = (rows, key) =>
  rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});

const kluMix = (rows) =>
  Object.fromEntries(KLU_ORDER.map((k) => [k, rows.filter((r) => r.klu === k).length]));

const entryOf = (row) => ({
  unit_id: row.id,
  subject: row.subject,
  unit_number: row.unit_number,
  title: row.title,
  frame: row.frame,
  route: row.route,
});

function scaffoldAnchor(blueprint) {
  const mid = blueprint?.scaffolds_json?.level_3_4 || {};
  return {
    frame: mid.sentence_frames?.[0] || "",
    word_bank: mid.word_bank || [],
    teacher_move: mid.teacher_move || "",
  };
}

/** One co-planning alliance: a WIDA move that two or more content areas share in this grade. */
function sharedMove(blueprintId, rows) {
  const blueprint = BLUEPRINT_BY_ID.get(blueprintId);
  const subjects = [...new Set(rows.map((r) => r.subject))].sort(
    (a, b) => subjectOrder(a) - subjectOrder(b),
  );
  const anchor = scaffoldAnchor(blueprint);
  return {
    blueprint_id: blueprintId,
    move_name: blueprint?.move_name || "",
    klu: blueprint?.wida_klu || "",
    syntax_pattern: blueprint?.syntax_pattern || "",
    subjects,
    units: rows.map((r) => ({
      ...entryOf(r),
      tier3: r.terms.filter((t) => t.tier === 3).map((t) => t.term),
    })),
    anchor,
    plan: {
      teach_once: `Teach "${blueprint?.move_name}" once with the shared frame, then let ${subjects.join(", ")} teachers reuse the same anchor chart.`,
      reinforce: rows.map(
        (r) =>
          `${r.subject} Unit ${r.unit_number} (${r.title}): students apply it with "${r.frame}"`,
      ),
    },
  };
}

function groupSharedMoves(rows) {
  const byBlueprint = new Map();
  for (const row of rows) {
    if (!row.blueprint_id) continue;
    if (!byBlueprint.has(row.blueprint_id)) byBlueprint.set(row.blueprint_id, []);
    byBlueprint.get(row.blueprint_id).push(row);
  }
  return [...byBlueprint.entries()]
    .filter(([, group]) => new Set(group.map((r) => r.subject)).size > 1)
    .map(([id, group]) => sharedMove(id, group))
    .sort((a, b) => b.subjects.length - a.subjects.length || b.units.length - a.units.length);
}

const wordWallOf = (rows) =>
  rows.flatMap((r) =>
    r.terms.map((t) => ({
      ...t,
      unit_id: r.id,
      subject: r.subject,
      unit_number: r.unit_number,
      unit_title: r.title,
    })),
  );

/** Four-chunk mentor-sentence puzzles: the chunks and their roles come straight from each unit's Language Dive. */
function sentencePuzzles(rows) {
  return rows.flatMap((row) => {
    const dive = CONNECTION_BY_UNIT.get(row.id)?.mentor_sentence_unpacking;
    const chunks = (dive?.chunks || []).map((c) => ({
      text: c.text,
      role: c.role,
      token: c.color_token,
      question: c.student_question,
    }));
    if (chunks.length < 2) return [];
    return [
      {
        unit_id: row.id,
        subject: row.subject,
        unit_number: row.unit_number,
        title: row.title,
        sentence: dive.mentor_sentence,
        chunks,
      },
    ];
  });
}

export function buildPathwayIndex() {
  return {
    version: PATHWAYS_VERSION,
    grades: GRADES.map((grade) => {
      const rows = unitsForGrade(grade);
      return {
        grade,
        label: gradeLabel(grade),
        band: UNITS.find((u) => u.grade === grade)?.publisher_meta?.grade_band || "",
        units: rows.length,
        subjects: count(rows, "subject"),
        klu: kluMix(rows),
      };
    }),
    subjects: SUBJECTS,
    klu_order: KLU_ORDER,
  };
}

export function buildGradePathway(gradeInput) {
  const grade = normalizeGrade(gradeInput);
  if (!grade) return null;
  const rows = unitsForGrade(grade);
  const wall = wordWallOf(rows);
  const moveIds = new Set(rows.map((r) => r.blueprint_id).filter(Boolean));
  return {
    version: PATHWAYS_VERSION,
    grade,
    label: gradeLabel(grade),
    band: UNITS.find((u) => u.grade === grade)?.publisher_meta?.grade_band || "",
    stats: {
      units: rows.length,
      terms: wall.length,
      tier3: wall.filter((t) => t.tier === 3).length,
      cognates: wall.filter((t) => t.es).length,
      moves_in_play: moveIds.size,
      moves_total: BLUEPRINTS.length,
    },
    klu: kluMix(rows),
    lanes: SUBJECTS.map((subject) => ({
      subject,
      curriculum: rows.find((r) => r.subject === subject)?.curriculum || "",
      units: rows.filter((r) => r.subject === subject),
    })),
    shared_moves: groupSharedMoves(rows),
    word_wall: wall,
    puzzles: sentencePuzzles(rows),
  };
}

/** Vertical articulation: how each move and each content area grows from K to 8. */
export function buildMoveAtlas() {
  const rowsByGrade = new Map(GRADES.map((g) => [g, unitsForGrade(g)]));
  const allRows = GRADES.flatMap((g) => rowsByGrade.get(g));

  const moves = BLUEPRINTS.map((bp) => {
    const rows = allRows.filter((r) => r.blueprint_id === bp.id);
    return {
      blueprint_id: bp.id,
      move_name: bp.move_name,
      klu: bp.wida_klu,
      syntax_pattern: bp.syntax_pattern,
      unit_count: rows.length,
      journey: GRADES.filter((g) => rows.some((r) => r.grade === g)).map((g) => ({
        grade: g,
        label: gradeLabel(g),
        entries: rows.filter((r) => r.grade === g).map(entryOf),
      })),
    };
  }).sort(
    (a, b) => KLU_ORDER.indexOf(a.klu) - KLU_ORDER.indexOf(b.klu) || b.unit_count - a.unit_count,
  );

  const spiral = SUBJECTS.map((subject) => ({
    subject,
    grades: GRADES.map((grade) => {
      const rows = rowsByGrade.get(grade).filter((r) => r.subject === subject);
      const wall = wordWallOf(rows);
      return {
        grade,
        label: gradeLabel(grade),
        units: rows.length,
        klu: kluMix(rows),
        terms: wall.length,
        tier3: wall.filter((t) => t.tier === 3).length,
        cognate_pct: wall.length
          ? Math.round((wall.filter((t) => t.es).length / wall.length) * 100)
          : 0,
        signature: rows[0] ? entryOf(rows[0]) : null,
      };
    }),
  }));

  return { version: PATHWAYS_VERSION, klu_order: KLU_ORDER, grades: GRADES, moves, spiral };
}
