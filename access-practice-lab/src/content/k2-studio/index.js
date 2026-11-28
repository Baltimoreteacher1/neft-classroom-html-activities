// K-2 starter sets for the Activity Studio: ready-made, picture-first, read-aloud activities for kindergarten, grade 1
// and grade 2, in three topics (phonics and early literacy, early math, oral language for English learners). Each
// starter is a complete lp-activity/1 activity; a teacher copies one into a draft (adapters/k2-starters.js) from the
// K-2 starter page (/activity-studio/k2) and changes anything. The originals here are never edited by the studio.

import { GRADE_1 } from "./grade-1.js";
import { GRADE_2 } from "./grade-2.js";
import { GRADE_K } from "./grade-k.js";

export { TOPICS } from "./parts.js";

export const K2_GRADES = Object.freeze(["K", "1", "2"]);

/** Every starter, kindergarten first; within a grade, phonics, then math, then oral language. */
export const K2_STARTERS = Object.freeze([...GRADE_K, ...GRADE_1, ...GRADE_2]);

export const findStarter = (id) => K2_STARTERS.find((s) => s.id === id) || null;

/** What children DO in a starter, as the chips on its card. */
export const DOES = Object.freeze({
  hear: { en: "Tap to hear", es: "Tocar para escuchar", art: "🔊" },
  sort: { en: "Picture sort", es: "Clasificar dibujos", art: "🗂️" },
  match: { en: "Match", es: "Emparejar", art: "🔗" },
  choose: { en: "Pick the picture", es: "Elegir el dibujo", art: "👆" },
  order: { en: "Put in order", es: "Poner en orden", art: "🔢" },
  count: { en: "Count with ten frames", es: "Contar con marcos de diez", art: "🔟" },
  fill: { en: "Finish the word", es: "Completar la palabra", art: "✏️" },
  talk: { en: "Talk with a partner", es: "Hablar con un compañero", art: "💬" },
});
