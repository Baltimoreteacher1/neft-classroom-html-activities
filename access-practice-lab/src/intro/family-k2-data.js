// Practice Together, grades K–2: the one in-page routine for tonight ("Let’s Talk About a Picture") and the K–2
// handout copy. Pure data, no DOM; the family walkthrough (family.js) reads the grade picks and scripts/lib/intro-family-k2-handout.mjs prints the
// handout. The activity (title, route, grade) comes from tour-bands.js BAND_TOUR, so it is named and linked once.
//
// Checked in a browser on 2026-11-11 against /Speaking/A/gk-s-a-garden-see, /Speaking/A/g1-s-a-garden-name and
// /Speaking/A/g23-s-a-garden-see in English and Español: the buttons “Hear it again” / «Escuchar otra vez»,
// “Hear <name> answer first” / «Escucha primero la respuesta de <name>», the speaker button beside “I see ___.”,
// “Record my answer” (optional) and “I said my answer” / «Dije mi respuesta». The model answers are the activities’
// own `modelStudent.text` (tools/access-intro-family.test.mjs re-reads content/ to keep them equal).
//
// Spanish is machine-written and addresses adults as "ustedes" (docs/family-homework-v3/es-style-guide.md).
import { tourActivity } from "./tour-bands.js";

/** The early picks the routine serves (GRADE_PICKS ids); anything else uses Kindergarten. */
export const EARLY_PICKS = ["K", "1", "2-3"];

/** The model student each activity plays first: the name on its button and what the child hears. */
export const EARLY_MODELS = {
  K: { first: "Lina", label: "Lina, age 5", text: "A flower!" },
  1: { first: "Mateo", label: "Mateo, age 6", text: "I see the sun." },
  "2-3": { first: "Leo", label: "Leo, age 8", text: "I see a girl with a watering can." },
};

/** The early pick for this render: a teacher's ?grades= link, then the grade remembered on this device, else K. */
export function earlyPickFrom(grades, remembered) {
  const g = String(grades || "")
    .trim()
    .toUpperCase();
  if (EARLY_PICKS.includes(g)) return g;
  return EARLY_PICKS.includes(remembered) ? remembered : "K";
}

/** The routine for one early pick: the activity, its three steps, the example and the grown-up's role. */
export function earlyRoutine(pick) {
  const p = EARLY_PICKS.includes(pick) ? pick : "K";
  const model = EARLY_MODELS[p];
  return {
    id: "early",
    pick: p,
    activity: tourActivity(p, "speaking"),
    model,
    steps: [
      {
        head: { en: "Listen first", es: "Escuchen primero" },
        body: {
          en: `Press “Hear it again” to hear the directions. Then press “Hear ${model.label} answer first.”`,
          es: `Toquen «Escuchar otra vez» para oír las instrucciones. Luego toquen el botón para escuchar primero la respuesta de ${model.first}.`,
        },
      },
      {
        head: { en: "Talk about the picture", es: "Hablen de la imagen" },
        body: {
          en: "Your child says one thing they see. The speaker button next to “I see ___.” reads the sentence starter. Pointing or one word is fine.",
          es: "Su hijo o hija dice una cosa que ve. El botón del altavoz junto a «I see ___.» lee el inicio de oración. Está bien señalar o decir una sola palabra.",
        },
      },
      {
        head: { en: "Finish together", es: "Terminen juntos" },
        body: {
          en: "Press “I said my answer.” Recording is never needed.",
          es: "Toquen «Dije mi respuesta». Nunca es necesario grabar.",
        },
      },
    ],
  };
}

/** The K–2 handout files (scripts/generate-intro-guide.mjs --only=family writes them). */
export const FAMILY_HANDOUT_K2 = {
  en: {
    pdf: "/access-practice-lab/guides/family-handout-k2.pdf",
    docx: "/access-practice-lab/guides/family-handout-k2.docx",
  },
  es: {
    pdf: "/access-practice-lab/guides/family-handout-k2-es.pdf",
    docx: "/access-practice-lab/guides/family-handout-k2-es.docx",
  },
};

/** The K–2 handout's own lines. Facts come from FAMILY.help; the steps are the routine's, without a model name. */
export const HANDOUT_K2_COPY = {
  title: {
    en: "Practice Together: grades K–2",
    es: "Practicar juntos: grados K a 2",
  },
  grade: {
    en: "Choose “Grades K–2,” the exact grade, then “Start practicing together.”",
    es: "Elijan «Grados K a 2», el grado exacto y «Empezar a practicar juntos».",
  },
  what: {
    en: "Short English practice for younger children, with a guide for each step. Practice together for 5 to 10 minutes.",
    es: "Práctica corta de inglés para los más pequeños, con una guía en cada paso. Practiquen juntos de 5 a 10 minutos.",
  },
  howHeading: { en: "How it works", es: "Cómo funciona" },
  how: [
    {
      id: "audio",
      icon: "volume",
      head: { en: "Audio first", es: "Primero el audio" },
      body: {
        en: "Directions are read aloud, so no reading is needed.",
        es: "Las instrucciones se oyen; no hace falta leer.",
      },
    },
    {
      id: "pictures",
      icon: "listening",
      head: { en: "Picture answers", es: "Respuestas con imágenes" },
      body: {
        en: "Many answers are pictures to tap.",
        es: "Muchas respuestas son imágenes para tocar.",
      },
    },
    {
      id: "you",
      icon: "families",
      head: { en: "Your role", es: "Su papel" },
      body: {
        en: "Sit beside your child and repeat their words in a full sentence.",
        es: "Siéntense a su lado y repitan sus palabras en una oración completa.",
      },
    },
  ],
  tonightHeading: { en: "Tonight: talk about a picture", es: "Esta noche: hablen de una imagen" },
  tonight: [
    {
      head: { en: "Listen first", es: "Escuchen primero" },
      body: {
        en: "Press “Hear it again,” then hear the model student.",
        es: "Toquen «Escuchar otra vez» y oigan al modelo.",
      },
    },
    {
      head: { en: "Talk", es: "Hablen" },
      body: {
        en: "Your child says one thing they see: “I see ___.”",
        es: "Su hijo o hija dice una cosa que ve: «I see ___.»",
      },
    },
    {
      head: { en: "Finish", es: "Terminen" },
      body: {
        en: "Press “I said my answer.” Say one thing they did well.",
        es: "Toquen «Dije mi respuesta». Digan algo que hizo bien.",
      },
    },
  ],
};
