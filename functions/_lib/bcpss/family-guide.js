// Family Bridge extras for one BCPSS unit: what a family can DO with the unit, beyond reading the card.
// Derived from the canonical seed (data/bcpss-curriculum-seed.mjs): the unit's own sentence starter,
// its Spanish-cognate words and the four student practice labs. Pure and deterministic.

import * as seed from "../../../data/bcpss-curriculum-seed.mjs";

const UNITS = seed.BCPSS_UNITS || [];
const CONNECTIONS = seed.UNIT_CONNECTIONS || [];

const UNIT_BY_ID = new Map(UNITS.map((u) => [u.id, u]));
const CONNECTION_BY_UNIT = new Map(CONNECTIONS.map((c) => [c.unit_id, c]));

/** The four open student practice labs every BCPSS unit points to (see unit activities' target_lab_route). */
export const FAMILY_LABS = [
  { key: "words", route: "/access-practice-lab/wordlab" },
  { key: "speak", route: "/access-practice-lab/speak" },
  { key: "sentences", route: "/access-practice-lab/sentences" },
  { key: "prep", route: "/access-practice-lab/access-prep" },
];

const brief = (u) => ({ id: u.id, unit_number: u.unit_number, title: u.unit_title });

function neighbours(unit) {
  const siblings = UNITS.filter((u) => u.grade === unit.grade && u.subject === unit.subject).sort(
    (a, b) => a.unit_number - b.unit_number,
  );
  const i = siblings.findIndex((u) => u.id === unit.id);
  return {
    prev: i > 0 ? brief(siblings[i - 1]) : null,
    next: i >= 0 && i < siblings.length - 1 ? brief(siblings[i + 1]) : null,
    total: siblings.length,
  };
}

export function buildFamilyGuide(unitId) {
  const unit = UNIT_BY_ID.get(String(unitId));
  if (!unit) return null;
  const conn = CONNECTION_BY_UNIT.get(unit.id);
  return {
    unit: {
      id: unit.id,
      grade: unit.grade,
      subject: unit.subject,
      unit_number: unit.unit_number,
      title: unit.unit_title,
      curriculum: unit.curriculum_name,
    },
    // The unit's own sentence starter, with [slots] for the child to fill in.
    starter: conn?.unit_example_frame || "",
    words: (conn?.tier2_tier3_vocab || []).map((v) => ({
      term: v.term,
      def: v.student_friendly_def || v.kid_def || "",
      es: v.cognate_es || null,
    })),
    labs: FAMILY_LABS.map((lab) => ({
      key: lab.key,
      url: `${lab.route}?bcpssUnit=${encodeURIComponent(unit.id)}`,
    })),
    neighbours: neighbours(unit),
  };
}
