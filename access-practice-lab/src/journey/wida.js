// ACCESS Learning Journey — WIDA reference for each mission. References only: which framework entries the mission's
// Key Language Use and standard sit beside. Nothing here is WIDA wording, an item, a score or a level, and no code is
// invented: rows come straight from the lab's framework catalog (src/acc/wida/catalog.js).
import { WIDA_LANGUAGE_EXPECTATIONS, WIDA_SOURCE } from "../acc/wida/catalog.js";
import { GRADE_CLUSTERS, STANDARD_LABEL } from "../acc/wida/framework.js";
import { MISSIONS } from "./curriculum.js";

/** What each language dimension means in this lab's own words (plain sentences, English, for the teacher guide). */
export const dimensionNotes = Object.freeze({
  Discourse:
    "How the whole piece hangs together: the order of ideas, the links between them, and how it fits its purpose and audience.",
  Sentence:
    "How sentences are built: who does what, how ideas join inside one sentence, and which sentence shapes the task needs.",
  "Word/Phrase":
    "Which words and phrases carry the exact meaning: subject words, precise verbs, and word parts.",
});

/** Shown wherever a WIDA reference appears. [English, Spanish]. */
export const WIDA_LIMITS = Object.freeze([
  "These tasks are locally developed practice. They are not official WIDA items, they do not estimate an ACCESS score, and the Proficiency Level Descriptors are a teacher reference only.",
  "Estas tareas son práctica creada en este laboratorio. No son ítems oficiales de WIDA, no estiman una puntuación de ACCESS, y los Descriptores del nivel de dominio del idioma son solo una referencia para docentes.",
]);

const NOTE = Object.freeze([
  "This mission is the lab's own design, placed beside the framework entries below. It is not a WIDA-prescribed lesson.",
  "Esta misión es un diseño propio del laboratorio, colocada junto a las entradas del marco que se muestran abajo. No es una lección prescrita por WIDA.",
]);

const inClusters = (row, clusters) =>
  (row.gradeClusters || [row.gradeCluster]).some((c) => clusters.includes(c));

/**
 * The WIDA reference for one mission and grade band, or null when the mission or band is unknown.
 * `expectationRows` are the catalog rows for the mission's standard x Key Language Use x the band's grade clusters.
 */
export function widaFor(missionId, band) {
  const mission = MISSIONS[missionId];
  const w = mission?.wida?.[band];
  if (!w) return null;
  const clusters = GRADE_CLUSTERS[band];
  return {
    standard: w.standard,
    standardLabel: STANDARD_LABEL[w.standard] || "",
    expectationRows: WIDA_LANGUAGE_EXPECTATIONS.filter(
      (r) => r.standard === w.standard && r.keyUse === mission.klu && inClusters(r, clusters),
    ),
    keyUse: mission.klu,
    dimensions: [...w.dimensions],
    dimensionNotes: Object.fromEntries(w.dimensions.map((d) => [d, dimensionNotes[d]])),
    source: WIDA_SOURCE,
    note: NOTE,
  };
}
