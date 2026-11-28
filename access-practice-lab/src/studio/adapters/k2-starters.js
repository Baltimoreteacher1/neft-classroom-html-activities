// Adapter: K-2 starter sets (src/content/k2-studio, pure data modules). Each starter is already a complete
// lp-activity/1 activity written for the studio (picture-first choices, a read-aloud script, ten frames for counting,
// the playful look, Read aloud on), so customizing copies it whole: nothing is dropped and nothing is invented.
// Loaded on demand, like every adapter.

import { t } from "./util.js";

const load = async () => import("../../content/k2-studio/index.js");

export const K2_PAGE = "/access-practice-lab/activity-studio/k2";

export default {
  family: "k2-starters",
  label: t("K-2 starter sets", "Conjuntos iniciales de K a 2.º"),
  note: t(
    "Ready-made activities for kindergarten to grade 2: phonics, early math and oral language, with pictures and read-aloud. The whole activity copies.",
    "Actividades listas para kínder a 2.º grado: fonética, matemáticas iniciales y lenguaje oral, con dibujos y lectura en voz alta. Se copia la actividad completa.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "standards",
    "directions",
    "passage",
    "audio",
    "vocab",
    "prompts",
    "choices",
    "pairs",
    "answerKeys",
    "hints",
    "frames",
    "explanations",
    "rubric",
    "samples",
    "openResponses",
    "teacherNotes",
    "supports",
  ],
  fixed: [],
  async list() {
    const { K2_STARTERS, TOPICS } = await load();
    return K2_STARTERS.map((s) => ({
      id: s.id,
      title: s.activity.title,
      grade: s.grade,
      subject: s.activity.context.subject,
      domain: TOPICS[s.topic].en,
      description: s.activity.description,
      count: s.activity.blocks.filter((b) => b.type === "question").length,
    }));
  },
  async extract(ref) {
    const { findStarter } = await load();
    const s = findStarter(ref);
    if (!s) throw new Error("not-found");
    return {
      activity: structuredClone(s.activity),
      source: s,
      sourceTitle: s.activity.title,
      url: K2_PAGE,
      notes: [
        t(
          "Read aloud is on: every question has a Hear button that uses this device's voice. Turn it off in Student supports for a reading-only check.",
          "La lectura en voz alta está activada: cada pregunta tiene un botón Escuchar que usa la voz de este dispositivo. Desactívela en Apoyos para una revisión solo de lectura.",
        ),
      ],
    };
  },
};
