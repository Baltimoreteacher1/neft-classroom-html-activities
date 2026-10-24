// Merges data/practice-studio/pedagogy-layer.json (docs/audits/studio-v4/brief-x-pedagogy.md) into a lesson's built sections.
// Nothing is composed here: the layer's items are authored (contrast), name a generator (rookie), or list generators (capstone).
// Challenge section 4 (Detective) gains the contrast item and the Teach-the-Rookie item; Challenge section 5 (Boss) closes the unit's
// last lesson with the Which tool? capstone. A Practice contrast item joins Practice section 3, next to the "Which move?" item.

const PRACTICE_CONTRAST_SECTION = 2;
const DETECTIVE_SECTION = 3;
const BOSS_SECTION = 4;

const CAPSTONE_HINTS = {
  h: [
    "Do not solve them. Ask: what is each problem asking me to find?",
    "Match the problems you are sure about first. Then the rest are easier to see.",
  ],
  hEs: [
    "No los resuelvas. Pregunta: ¿qué me pide encontrar cada problema?",
    "Une primero los que sabes con seguridad. Los demás se ven más fácil.",
  ],
};

/** @param {any[]} sections @param {any} lessonLayer @param {"practice"|"challenge"} mode @returns {any[]} */
export function applyPedagogy(sections, lessonLayer, mode) {
  if (!lessonLayer) return sections;
  const out = sections.map((s) => ({ ...s, items: [...s.items] }));
  const add = (/** @type {number} */ at, /** @type {any} */ item) => {
    if (out[at]) out[at].items.push(item);
  };
  const contrast = lessonLayer.contrast?.[mode];
  if (contrast)
    add(mode === "practice" ? PRACTICE_CONTRAST_SECTION : DETECTIVE_SECTION, {
      ...contrast,
      k: "contrast",
    });
  if (mode === "challenge") {
    if (lessonLayer.rookie)
      add(DETECTIVE_SECTION, {
        k: "rookie",
        id: "rk-c",
        g: lessonLayer.rookie.g,
        level: lessonLayer.rookie.level,
      });
    if (lessonLayer.capstone)
      add(BOSS_SECTION, {
        k: "capstone",
        id: lessonLayer.capstone.id,
        unit: lessonLayer.capstone.unit,
        skills: lessonLayer.capstone.skills,
        ...CAPSTONE_HINTS,
      });
  }
  return out;
}

/** What the page carries for the runtime: the estimate opt-in (the contrast, rookie and capstone items ride in the sections). */
export function pedagogyData(/** @type {any} */ lessonLayer) {
  if (!lessonLayer?.estimate) return undefined;
  return { estimate: lessonLayer.estimate };
}
