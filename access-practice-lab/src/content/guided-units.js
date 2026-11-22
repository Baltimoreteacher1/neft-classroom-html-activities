// Guided Units: curated 5-step sequences (Audio/Warm-up -> Mini-Lesson/Decodable -> Interactive Sheet -> Speaking/Writing Studio -> Arcade Game)
// Tracks: Newcomer Survival, CVC Blending, Explaining Cause & Effect, Evidence & Argument.

export const GUIDED_UNITS = [
  {
    id: "newcomer-survival",
    domain: "Listening",
    bands: ["3-5", "6-8"],
    title: ["Newcomer Survival", "Supervivencia para recién llegados"], // ES-REVIEW
    summary: ["Essential school, feelings, and classroom talk from warm-up to speaking.", "Vocabulario esencial de la escuela, sentimientos y conversación en clase."], // ES-REVIEW
    steps: [
      { kind: "Audio / Warm-up", path: "packs/survival-vocabulary", label: ["Survival Vocabulary Warm-up", "Calentamiento de vocabulario"] },
      { kind: "Mini-Lesson / Board", path: "communication", label: ["Visual Communication & Scenarios", "Comunicación visual y situaciones"] },
      { kind: "Interactive Sheet", path: "library", query: "q=school&sheet=1", label: ["Interactive School Sheet", "Hoja interactiva escolar"] },
      { kind: "Speaking Studio", path: "speak", label: ["Say It in Speaking Studio", "Dilo en el Estudio oral"] },
      { kind: "Arcade Game", path: "games", label: ["Play Vocabulary Arcade", "Juega en el Arcade"] },
    ],
  },
  {
    id: "cvc-blending",
    domain: "Reading",
    bands: ["3-5"],
    title: ["CVC Blending & Early Decoding", "Combinación CVC y lectura inicial"], // ES-REVIEW
    summary: ["Hear sounds, build CVC words, read a decodable mini-book, and check comprehension.", "Escucha sonidos, forma palabras CVC, lee un minilibro y responde preguntas."], // ES-REVIEW
    steps: [
      { kind: "Audio / Warm-up", path: "early/progression", label: ["Phonics Sound Buttons", "Botones de sonido fonético"] },
      { kind: "Decodable Mini-Book", path: "reading-path/decodable/sam-red-hat", label: ["Read: Sam and the Red Hat", "Lee: Sam y el sombrero rojo"] },
      { kind: "Interactive Sheet", path: "library", query: "q=garden", label: ["Interactive Reading Sheet", "Hoja interactiva de lectura"] },
      { kind: "Voice Lab", path: "voice", label: ["Read-Aloud Practice", "Práctica de lectura en voz alta"] },
      { kind: "Arcade Game", path: "reading-path", label: ["Reading Path Games", "Juegos del Camino de lectura"] },
    ],
  },
  {
    id: "cause-and-effect",
    domain: "Writing",
    bands: ["3-5", "6-8"],
    title: ["Explaining Cause & Effect", "Explicar causa y efecto"], // ES-REVIEW
    summary: ["Connect ideas with because, so, and as a result across reading and writing.", "Conecta ideas con because, so y as a result en lectura y escritura."], // ES-REVIEW
    steps: [
      { kind: "Audio / Warm-up", path: "wordlab", label: ["Word Lab: Cause & Effect Words", "Laboratorio de palabras"] },
      { kind: "Mini-Lesson", path: "scaffold/sentence-architecture", label: ["Sentence Architecture", "Arquitectura de oraciones"] },
      { kind: "Interactive Sheet", path: "library", query: "q=compare", label: ["Interactive Cause & Effect Sheet", "Hoja interactiva de causa y efecto"] },
      { kind: "Writing Studio", path: "write", label: ["Write in Writing Studio", "Escribe en el Estudio de escritura"] },
      { kind: "Arcade Game", path: "sentences", label: ["Sentence Lab Challenge", "Reto de oraciones"] },
    ],
  },
  {
    id: "evidence-and-argument",
    domain: "Speaking",
    bands: ["3-5", "6-8"],
    title: ["Evidence & Argument", "Evidencia y argumento"], // ES-REVIEW
    summary: ["Find text evidence, build a claim, and defend your viewpoint.", "Encuentra evidencia en el texto, forma una afirmación y defiende tu punto de vista."], // ES-REVIEW
    steps: [
      { kind: "Audio / Warm-up", path: "mentor", label: ["Mentor Text Explorer", "Explorador de textos modelo"] },
      { kind: "Mini-Lesson", path: "scaffold/evidence-builder", label: ["Evidence Builder", "Constructor de evidencia"] },
      { kind: "Interactive Sheet", path: "library", query: "q=evidence", label: ["Interactive Evidence Sheet", "Hoja interactiva de evidencia"] },
      { kind: "Speaking / Arena", path: "arena", label: ["Argument Arena & Roundtable", "Arena de argumentos"] },
      { kind: "Arcade Game", path: "detective", label: ["Language Error Detective", "Detective de errores"] },
    ],
  },
];

export function unitHref(step, band = "6-8") {
  const q = new URLSearchParams(step.query || "");
  q.set("grades", band);
  return `/access-practice-lab/${step.path}?${q.toString()}`;
}
