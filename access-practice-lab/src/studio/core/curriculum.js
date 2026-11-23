// Curriculum adapter: turns the real BCPSS unit data (the same /api/bcpss/* the Teacher Hub reads) into the context
// and content seeds the generators use. Nothing here is invented: every vocabulary word, frame and standard comes
// from the unit record, and the activity records where it came from. The data has units and five-day activity
// cycles, not numbered lessons, so the studio names a unit (and optionally a day), never a "lesson number".

export const GRADES = Object.freeze(["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
export const SUBJECTS = Object.freeze(["ELA", "Math", "Science", "Social Studies"]);
export const SUBJECT_LABELS = Object.freeze({
  ELA: ["English Language Arts", "Artes del lenguaje"],
  Math: ["Mathematics", "Matemáticas"],
  Science: ["Science", "Ciencias"],
  "Social Studies": ["Social Studies", "Estudios sociales"],
});

const WIDA_TIER = {
  0: "level_3_4",
  1: "level_1_2",
  2: "level_1_2",
  3: "level_3_4",
  4: "level_3_4",
  5: "level_5_6",
  6: "level_5_6",
};

const json = async (response) => {
  if (!response.ok) throw new Error(`curriculum-${response.status}`);
  return response.json();
};

/** Units for one grade and subject, in unit order. */
export async function fetchUnits(grade, subject, fetchFn = fetch) {
  const q = new URLSearchParams({ grade: String(grade), subject });
  const data = await json(await fetchFn(`/api/bcpss/units?${q}`));
  return (data.units || []).slice().sort((a, b) => Number(a.unit_number) - Number(b.unit_number));
}

/** One unit with its language connections and five-day activities. */
export async function fetchUnit(unitId, fetchFn = fetch) {
  return json(await fetchFn(`/api/bcpss/units/${encodeURIComponent(unitId)}`));
}

const list = (v) => (Array.isArray(v) ? v : []);
const asObject = (v) => (v && typeof v === "object" ? v : {});

/** The editable header: grade, subject, curriculum, unit. Standards are marked as verified curriculum metadata. */
export function contextFromUnit(unit, day = "") {
  if (!unit) return null;
  return {
    grade: String(unit.grade),
    subject: unit.subject,
    curriculum: unit.curriculum_name || "",
    unitId: unit.id,
    unitTitle: unit.unit_title || "",
    unitNumber: Number(unit.unit_number) || 0,
    day,
    objective: unit.essential_question || "",
    standards: list(unit.core_standards).map((code) => ({
      code: String(code),
      origin: "curriculum",
    })),
    source: { origin: "curriculum", note: "BCPSS curriculum data on this site" },
  };
}

/**
 * Content a generator can use from a unit detail: vocabulary (with the unit's own Spanish cognate where it has
 * one), sentence frames and word bank for a WIDA level, the language exit ticket and the five day prompts.
 * @param {object} detail  response of /api/bcpss/units/:id
 * @param {{wida?: number}} opts
 */
export function seedFromDetail(detail, { wida = 0 } = {}) {
  const unit = detail?.unit;
  const conn = list(detail?.connections)[0] || {};
  const scaffolds = asObject(conn.scaffolds_json);
  const tier = asObject(scaffolds[WIDA_TIER[wida] || "level_3_4"]);
  const vocab = list(conn.tier2_tier3_vocab)
    .map((v) => ({
      term: String(v.term || "").trim(),
      def: String(v.student_friendly_def || v.kid_def || "").trim(),
      es: String(v.cognate_es || "").trim(),
      tier: Number(v.tier) || 0,
    }))
    .filter((v) => v.term && v.def);
  const exit = asObject(conn.language_exit_ticket_json);
  return {
    unit,
    vocab,
    frames: list(tier.sentence_frames).map(String),
    wordBank: list(tier.word_bank).map(String),
    exampleFrame: String(conn.unit_example_frame || ""),
    exitTicket: exit.prompt
      ? {
          prompt: String(exit.prompt),
          frame: String(exit.target_frame || ""),
          vocab: list(exit.required_vocab).map(String),
        }
      : null,
    days: list(detail?.activities).map((a) => ({
      order: Number(a.activity_order),
      label: String(a.day_label || ""),
      type: String(a.activity_type || ""),
      prompt: String(a.student_prompt || ""),
    })),
    l1Watchouts: list(conn.l1_watchouts)
      .map((w) => String(w.friction_point || ""))
      .filter(Boolean),
  };
}

/** Which formats make sense for a unit, by subject: shown as the studio's recommendation, never forced. */
export function recommendForSubject(subject) {
  return (
    {
      Math: {
        kind: "worksheet",
        why: [
          "Math lessons usually need worked problems and room to show thinking.",
          "Las lecciones de matemáticas suelen necesitar problemas resueltos y espacio para mostrar el trabajo.",
        ],
      },
      ELA: {
        kind: "interactive",
        why: [
          "Reading lessons work well as an interactive text with evidence questions.",
          "Las lecciones de lectura funcionan bien como un texto interactivo con preguntas de evidencia.",
        ],
      },
      Science: {
        kind: "interactive",
        why: [
          "Science vocabulary and diagrams work well as interactive sorting and labeling.",
          "El vocabulario de ciencias y los diagramas funcionan bien al clasificar y rotular.",
        ],
      },
      "Social Studies": {
        kind: "game",
        why: [
          "Key terms and sequences turn into a good matching game.",
          "Los términos clave y las secuencias se convierten en un buen juego de parejas.",
        ],
      },
    }[subject] || null
  );
}
