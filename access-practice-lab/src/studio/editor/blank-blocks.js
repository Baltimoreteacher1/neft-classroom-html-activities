// Starting points for "Add a question / Add something": a minimal valid skeleton per format, labels in plain
// language. The most common formats are offered first; the rest sit under "More types" so the menu stays short.

import { uid } from "../core/schema.js";

export const FORMAT_LABEL = {
  choice: ["Multiple choice", "Opción múltiple"],
  multi: ["Select all that apply", "Seleccione todas las que apliquen"],
  match: ["Matching", "Emparejar"],
  sort: ["Sorting", "Clasificar"],
  order: ["Put in order", "Poner en orden"],
  blank: ["Fill in the blank", "Completar el espacio"],
  number: ["Number answer", "Respuesta numérica"],
  short: ["Written response", "Respuesta escrita"],
  identify: ["Click the words", "Hacer clic en las palabras"],
  hotspot: ["Click the picture", "Hacer clic en la imagen"],
  numberline: ["Number line", "Recta numérica"],
  build: ["Build a sentence", "Armar una oración"],
  error: ["Find the mistake", "Encontrar el error"],
  fillTable: ["Fill in a table", "Completar una tabla"],
  plot: ["Plot points", "Marcar puntos"],
};
export const COMMON_FORMATS = ["choice", "match", "blank", "number", "short", "order"];
export const MORE_FORMATS = [
  "multi",
  "sort",
  "identify",
  "build",
  "error",
  "fillTable",
  "numberline",
  "plot",
  "hotspot",
];

export const BLOCK_LABEL = {
  text: ["Directions or text", "Instrucciones o texto"],
  passage: ["Reading passage", "Texto de lectura"],
  vocab: ["Vocabulary words", "Palabras de vocabulario"],
  image: ["Picture", "Imagen"],
  math: ["Math expression", "Expresión matemática"],
  table: ["Table", "Tabla"],
  organizer: ["Graphic organizer", "Organizador gráfico"],
  note: ["Note for me (students never see this)", "Nota para mí (los estudiantes no la ven)"],
  audio: ["Read-aloud prompt", "Indicación para leer en voz alta"],
};
export const OTHER_BLOCKS = [
  "text",
  "passage",
  "vocab",
  "image",
  "table",
  "organizer",
  "audio",
  "note",
];

const two = (p) => [
  { id: uid(p), text: "" },
  { id: uid(p), text: "" },
];

const SKELETON = {
  choice: () => {
    const options = [...two("o"), { id: uid("o"), text: "" }];
    return { options, answer: options[0].id };
  },
  multi: () => ({ options: [...two("o"), { id: uid("o"), text: "" }], answers: [] }),
  match: () => ({
    pairs: [
      { id: uid("p"), left: "", right: "" },
      { id: uid("p"), left: "", right: "" },
    ],
  }),
  sort: () => {
    const categories = [
      { id: uid("c"), label: "" },
      { id: uid("c"), label: "" },
    ];
    return {
      categories,
      items: [
        { id: uid("i"), text: "", category: categories[0].id },
        { id: uid("i"), text: "", category: categories[1].id },
      ],
    };
  },
  order: () => ({ items: two("i") }),
  blank: () => ({ text: "" }),
  number: () => ({ answer: "", accept: [], tolerance: 0, unit: "", expr: "" }),
  short: () => ({ kind: "write", sample: "", rubric: [], minWords: 0 }),
  identify: () => ({ text: "" }),
  hotspot: () => ({ image: null, regions: [], answer: "" }),
  numberline: () => ({ min: 0, max: 10, step: 1, answer: "", tolerance: 0 }),
  build: () => ({ words: [], accept: [] }),
  error: () => {
    const steps = [
      { id: uid("e"), text: "" },
      { id: uid("e"), text: "" },
    ];
    const fixOptions = two("f");
    return { steps, errorStep: steps[0].id, fixOptions, fixAnswer: fixOptions[0].id };
  },
  fillTable: () => ({ headers: ["", ""], rows: [["", { answer: "" }]] }),
  plot: () => ({ min: -5, max: 5, points: [{ x: 0, y: 0 }] }),
};

export const newQuestion = (format) => ({
  id: uid("q"),
  type: "question",
  format,
  prompt: "",
  hint: "",
  explanation: "",
  ...SKELETON[format](),
});

const BLOCK_SKELETON = {
  text: () => ({ text: "", role: "body" }),
  passage: () => ({ title: "", text: "" }),
  vocab: () => ({ items: [{ id: uid("v"), term: "", def: "", es: "", example: "" }] }),
  image: () => ({ src: "", alt: "", caption: "" }),
  math: () => ({ text: "", caption: "" }),
  table: () => ({ headers: ["", ""], rows: [["", ""]], caption: "" }),
  organizer: () => ({ kind: "web", prompts: [""] }),
  note: () => ({ text: "" }),
  audio: () => ({ say: "", label: "" }),
};
export const newBlock = (type) => ({ id: uid("b"), type, ...BLOCK_SKELETON[type]() });
