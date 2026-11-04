// Journey guide: the pure data and helpers behind the mission guide (no DOM, no storage). Every text is a bilingual pair
// [English, Español]. Mission facts come from curriculum.js and wida.js; this file adds only the teaching guidance around them.
// Links built here carry no learner data: assigning a mission writes nothing about a student anywhere.
import { MOVES } from "../../lang/purpose.js";
import { BASE, TIERS } from "../../util.js";
import { BANDS, KLUS, MISSION_IDS, STEP_IDS } from "../curriculum.js";

export const DOMAINS = ["Listening", "Speaking", "Reading", "Writing"];
export const DOMAIN_NAME = {
  Listening: ["Listening", "Escuchar"],
  Speaking: ["Speaking", "Hablar"],
  Reading: ["Reading", "Leer"],
  Writing: ["Writing", "Escribir"],
};
export const KLU_NAME = {
  Narrate: ["Narrate", "Narrar"],
  Inform: ["Inform", "Informar"],
  Explain: ["Explain", "Explicar"],
  Argue: ["Argue", "Argumentar"],
};
export const ENV_NAME = {
  classroom: ["Classroom", "Salón de clases"],
  lab: ["Lab", "Laboratorio"],
  garden: ["Garden", "Huerto"],
  community: ["Community", "Comunidad"],
  museum: ["Museum", "Museo"],
  library: ["Library", "Biblioteca"],
  map: ["Map", "Mapa"],
  debate: ["Debate", "Debate"],
};
export const BAND_NAME = {
  "3-5": ["Grades 3-5", "Grados 3-5"],
  "6-8": ["Grades 6-8", "Grados 6-8"],
};
/** Support modes: A, B and C are the lab's existing Starting, Growing and Expanding. */
export const SUPPORT_NAME = Object.fromEntries(
  [
    ["A", "Starting", "Comenzando"],
    ["B", "Growing", "Creciendo"],
    ["C", "Expanding", "Ampliando"],
  ].map(([k, en, es]) => [k, [en, es]]),
);
export const SUPPORT_CHECK = Object.keys(SUPPORT_NAME).every(
  (k) => TIERS[k]?.name === SUPPORT_NAME[k][0],
);

/** The communicate/improve/show production domain follows the task kind in the mission pack. */
export const KIND_DOMAIN = { converse: "Speaking", compose: "Writing" };

/** Domain alignment per step. `kind` steps read the production domain from the loaded pack. */
export const STEP_DOMAINS = {
  discover: {
    fixed: ["Speaking", "Reading"],
    note: [
      "Talks with a partner about what the learner observed, in context.",
      "Conversa con un compañero sobre lo que observó, en contexto.",
    ],
  },
  understand: {
    fixed: ["Listening", "Reading"],
    note: ["Listening first, then Reading X-Ray.", "Primero escuchar y luego Lectura con rayos X."],
  },
  build: {
    fixed: ["Writing", "Reading"],
    note: [
      "Language at the word, sentence and discourse level.",
      "El lenguaje al nivel de la palabra, la oración y el discurso.",
    ],
  },
  communicate: {
    kind: true,
    note: [
      "Speaking when it is a conversation, Writing when it is a draft.",
      "Hablar si es una conversación, escribir si es un borrador.",
    ],
  },
  improve: {
    kind: true,
    note: [
      "Revises the communicate response on one target.",
      "Revisa la respuesta de comunicar en una sola meta.",
    ],
  },
  show: {
    kind: true,
    note: [
      "A new task on the learner's own: independent Speaking or Writing.",
      "Una tarea nueva por cuenta propia: hablar o escribir de forma independiente.",
    ],
  },
};

/** What the lab records on the device at each step. Observable actions only; nothing is scored. */
export const STEP_EVIDENCE = {
  discover: [
    "Which observations the learner examined, whether a manipulation was run, and the explanation sent to the partner.",
    "Qué observaciones examinó, si probó una manipulación y la explicación que envió al compañero.",
  ],
  understand: [
    "Listening placements and tries, then the evidence the learner selected in the reading and the explanation of how it connects to the claim.",
    "Las colocaciones y los intentos en la escucha, y luego la evidencia que eligió en la lectura y su explicación de cómo se conecta con la afirmación.",
  ],
  build: [
    "Each language module accepted by the engine, then the transfer item. First try and later tries are kept apart.",
    "Cada módulo de lenguaje aceptado por el motor y luego el ítem de transferencia. El primer intento y los siguientes se guardan por separado.",
  ],
  communicate: [
    "The first response (spoken exchange or draft) with its word count, the supports opened, and which Key Language Use moves it shows.",
    "La primera respuesta (conversación o borrador) con su número de palabras, los apoyos abiertos y qué movimientos del uso clave del lenguaje muestra.",
  ],
  improve: [
    "The one target chosen, the revision beside the first response, what changed, and the reason the learner picked. Marked as a revision.",
    "La meta elegida, la revisión junto a la primera respuesta, qué cambió y la razón que eligió. Se marca como revisión.",
  ],
  show: [
    "A new task with no help open. This is the only independent attempt, and it is saved as independent.",
    "Una tarea nueva sin ayuda abierta. Es el único intento independiente y se guarda como independiente.",
  ],
};

export const SCAFFOLDS = {
  frames: [
    "Sentence frames",
    "Marcos de oraciones",
    "Starting and Growing: partly finished sentences the learner completes.",
    "Comenzando y Creciendo: oraciones a medias que el estudiante completa.",
  ],
  bank: [
    "Word bank with Spanish gloss",
    "Banco de palabras con glosa en español",
    "Starting: key words with a plain meaning and a Spanish gloss.",
    "Comenzando: palabras clave con un significado sencillo y una glosa en español.",
  ],
  replay: [
    "Audio replay",
    "Repetir el audio",
    "Any support: replay a sentence of the listening script.",
    "Cualquier nivel de apoyo: repetir una oración del guion de escucha.",
  ],
  xray: [
    "X-Ray overlays",
    "Capas de rayos X",
    "Starting and Growing: highlights signal words, or shows meaning, discourse, sentence and word layers.",
    "Comenzando y Creciendo: resalta palabras clave o muestra las capas de significado, discurso, oración y palabra.",
  ],
  hints: [
    "Graduated hints",
    "Pistas graduales",
    "A question first, then a frame, then a model sentence. Each step gives a little more.",
    "Primero una pregunta, luego un marco y luego una oración modelo. Cada paso da un poco más.",
  ],
  organizer: [
    "Graphic organizer",
    "Organizador gráfico",
    "Writing tasks: boxes for the parts the genre needs.",
    "Tareas de escritura: casillas para las partes que necesita el género.",
  ],
  partner: [
    "Partner-talk prompt",
    "Pregunta para conversar con un compañero",
    "A partner who asks for a cause or for evidence, never the answer.",
    "Un compañero que pide una causa o evidencia, nunca la respuesta.",
  ],
  evidence: [
    "Evidence from the investigation",
    "Evidencia de la investigación",
    "Conversation tasks: facts the learner may use. Hidden in independent work.",
    "Tareas de conversación: datos que el estudiante puede usar. Se ocultan en el trabajo independiente.",
  ],
};
/** Which supports a step can open. `show` opens none. */
export const STEP_SCAFFOLDS = {
  discover: ["partner", "frames", "bank", "hints"],
  understand: ["replay", "xray", "hints"],
  build: ["frames", "bank", "hints"],
  communicate: ["partner", "frames", "bank", "evidence", "organizer"],
  improve: ["hints"],
  show: [],
};

/** A suggested week. Flexible: a teacher may split, repeat or skip a step. */
export const DAYS = [
  {
    n: 1,
    steps: ["discover", "understand"],
    what: [
      "Discover, then begin comprehension (listening).",
      "Descubre y luego empieza la comprensión (escuchar).",
    ],
  },
  {
    n: 2,
    steps: ["understand", "build"],
    what: [
      "Continue comprehension (reading), then build language.",
      "Continúa la comprensión (leer) y luego construye el lenguaje.",
    ],
  },
  {
    n: 3,
    steps: ["communicate"],
    what: [
      "Communicate: say it or write it for a real audience.",
      "Comunica: dilo o escríbelo para un público real.",
    ],
  },
  {
    n: 4,
    steps: ["improve"],
    what: [
      "Improve: revise one target using feedback.",
      "Mejora: revisa una meta usando los comentarios.",
    ],
  },
  {
    n: 5,
    steps: ["show"],
    what: ["Show independently, then reflect.", "Muestra por tu cuenta y luego reflexiona."],
  },
];

export const EVIDENCE_KINDS = [
  [
    "Auto-scored by answer key",
    "Corregido con clave de respuestas",
    "Objective items only.",
    "Solo ítems objetivos.",
  ],
  [
    "Rule-based observation",
    "Observación basada en reglas",
    "Counts words, linking words and numbers from the task. It never judges meaning.",
    "Cuenta palabras, conectores y números de la tarea. Nunca juzga el significado.",
  ],
  [
    "Teacher-reviewed",
    "Revisado por el docente",
    "A person rated the response against a rubric in the Teacher Hub.",
    "Una persona valoró la respuesta con una rúbrica en el Centro docente.",
  ],
  [
    "Not scored by the lab",
    "Sin calificar por el laboratorio",
    "Speaking and writing without a teacher review.",
    "Hablar y escribir sin revisión del docente.",
  ],
];

export const DOES_NOT = [
  [
    "There is no roster. A link names a mission and a step, never a student.",
    "No hay lista de estudiantes. Un enlace nombra una misión y un paso, nunca a un estudiante.",
  ],
  [
    "There is no cloud class management. Nothing is assigned, tracked or delivered for you.",
    "No hay gestión de clase en la nube. Nada se asigna, rastrea ni entrega por ti.",
  ],
  [
    "Nothing leaves this device. Student work stays on the device where the student did it.",
    "Nada sale de este dispositivo. El trabajo del estudiante se queda en el dispositivo donde lo hizo.",
  ],
  [
    "It is not an official WIDA report, and it does not estimate an ACCESS score.",
    "No es un informe oficial de WIDA y no estima una puntuación de ACCESS.",
  ],
];

/** One teaching move per Key Language Use move, for when the move is missing from a response. Original text. */
export const MOVE_GUIDE = {
  orient: [
    "Sets the scene",
    "Presenta el escenario",
    "Ask three quick questions together (when, where, who), then have the learner open with one sentence that answers all three.",
    "Hagan juntos tres preguntas rápidas (cuándo, dónde, quién) y pide que abra con una oración que responda las tres.",
  ],
  sequence: [
    "Orders events",
    "Ordena los sucesos",
    "Put three event cards on the board out of order, rebuild them aloud with first, next and finally, then ask the learner to retell their own story the same way.",
    "Pon tres tarjetas de sucesos desordenadas en la pizarra, ordénenlas en voz alta con primero, luego y finalmente, y pide que cuente su historia igual.",
  ],
  events: [
    "Tells what happened",
    "Cuenta qué pasó",
    "Pick one sentence with a vague verb and swap it together for a precise past-tense action verb; then ask for two more.",
    "Elige una oración con un verbo vago y cámbienlo juntos por un verbo de acción preciso en pasado; luego pide dos más.",
  ],
  response: [
    "Shows how it ended",
    "Muestra cómo terminó",
    "Ask what changed from the start to the end, and model one closing sentence that names a feeling or a lesson.",
    "Pregunta qué cambió del principio al final y modela una oración de cierre que nombre un sentimiento o una lección.",
  ],
  topic: [
    "Names the topic",
    "Nombra el tema",
    "Model one sentence that says what the topic is and what kind of thing it is, then ask the learner to write theirs.",
    "Modela una oración que diga cuál es el tema y qué tipo de cosa es, y pide que escriba la suya.",
  ],
  details: [
    "Gives specific details",
    "Da detalles específicos",
    "Show a vague sentence and a precise one side by side; ask the learner to add one number, name or measurement.",
    "Muestra una oración vaga y una precisa lado a lado; pide que agregue un número, un nombre o una medida.",
  ],
  organize: [
    "Groups ideas",
    "Agrupa ideas",
    "Sort the learner's details into two piles on paper and name each pile; then add one signal word that joins them, such as also or in contrast.",
    "Clasifica los detalles del estudiante en dos montones y ponles nombre; luego agrega una palabra que los una, como además o en cambio.",
  ],
  close: [
    "Wraps up",
    "Cierra",
    "Ask what the reader should remember in one sentence, and offer the opener So the main point is.",
    "Pregunta qué debe recordar el lector en una oración y ofrece el inicio Entonces la idea principal es.",
  ],
  phenomenon: [
    "Says what is explained",
    "Dice qué se explica",
    "Ask what exactly is being explained, and have the learner say it as one sentence before adding reasons.",
    "Pregunta qué se está explicando exactamente y pide que lo diga en una oración antes de dar razones.",
  ],
  cause: [
    "Links cause and effect",
    "Une causa y efecto",
    "Model a cause-effect pair with the class using because and so, then have partners make one pair about the topic.",
    "Modela con la clase un par de causa y efecto con porque y así que, y luego pide a las parejas que hagan uno sobre el tema.",
  ],
  chain: [
    "Connects the steps",
    "Conecta los pasos",
    "Draw two arrows on the board, one effect leading to the next, and ask the learner to say each link with then or as a result.",
    "Dibuja dos flechas en la pizarra, un efecto que lleva al siguiente, y pide que diga cada eslabón con luego o como resultado.",
  ],
  support: [
    "Backs it with data",
    "Lo respalda con datos",
    "Ask which fact or number shows the explanation is true; point to the source and have the learner say according to.",
    "Pregunta qué dato o número muestra que la explicación es cierta; señala la fuente y pide que diga según.",
  ],
  claim: [
    "States a claim",
    "Presenta una afirmación",
    "Offer two sentences, one claim and one fact, and ask which one someone could disagree with; then have the learner restate their position.",
    "Ofrece dos oraciones, una afirmación y un dato, y pregunta con cuál alguien podría no estar de acuerdo; luego pide que replantee su postura.",
  ],
  reason: [
    "Gives a reason",
    "Da una razón",
    "Say I think this because and pause; let the learner finish it aloud before writing it down.",
    "Di Pienso esto porque y haz una pausa; deja que el estudiante lo termine en voz alta antes de escribirlo.",
  ],
  evidence: [
    "Uses evidence",
    "Usa evidencia",
    "Go back to the source together and underline one sentence that proves the reason; then practice introducing it with the text shows.",
    "Vuelvan juntos a la fuente y subrayen una oración que pruebe la razón; luego practiquen presentarla con el texto muestra.",
  ],
  counter: [
    "Considers another view",
    "Considera otra postura",
    "Role-play someone who disagrees; ask the learner to answer with although or however.",
    "Representen a alguien que no está de acuerdo; pide que responda con aunque o sin embargo.",
  ],
  restate: [
    "Returns to the claim",
    "Vuelve a la afirmación",
    "Show the first sentence and the last one together and ask how the ending can remind the reader of the position.",
    "Muestra juntas la primera y la última oración y pregunta cómo puede el final recordarle al lector la postura.",
  ],
};
export const MOVE_IDS = Object.values(MOVES)
  .flat()
  .map((m) => m.id);

/** Printable packets the generator writes: `<Domain>-<Level>` for 6-8 and `g3-5-<Domain>-<Level>` for 3-5 (tools/generate-access-printables.mjs). */
export const PACKET_LEVELS = ["A", "B", "C"];
export const printableBase = (band, domain, level) =>
  band === "6-8" ? `${domain}-${level}` : `g3-5-${domain}-${level}`;
export const printableHref = (band, domain, level) =>
  `${BASE}/printables/${printableBase(band, domain, level)}`;
export const teacherPacketHref = (band, domain, level) =>
  `/access-teacher/packets/${printableBase(band, domain, level)}`;

/** Direct student link to one step. `assigned=1` changes no progress; it only lets the runner show "your teacher chose this". */
export const stepPath = (band, mission, step) =>
  `${BASE}/journey/${mission}/${step}?grades=${band}&assigned=1`;
export const familyPath = (band, mission) => `${BASE}/family?mission=${mission}&grades=${band}`;

// ── filters ───────────────────────────────────────────────────────────────────
const pick = (v, allowed, fallback = "") => (allowed.includes(v) ? v : fallback);

/** Filters from a URL query string (or URLSearchParams). Unknown values fall back to "everything". */
export function parseFilters(search = "", defaultBand = "6-8") {
  const q = search instanceof URLSearchParams ? search : new URLSearchParams(search);
  return {
    band: pick(q.get("band") || q.get("grades"), BANDS, pick(defaultBand, BANDS, "6-8")),
    klu: pick(q.get("klu"), KLUS),
    domain: pick(q.get("domain"), DOMAINS),
    mission: pick(q.get("mission"), MISSION_IDS),
  };
}

/** Filters from an options object ({ band, klu, domain, mission }); unknown values fall back to "everything". */
export const normalizeFilters = (o = {}) =>
  parseFilters(new URLSearchParams(["band", "klu", "domain", "mission"].filter((k) => o[k]).map((k) => [k, o[k]])), o.band);

/** Query string for the filters (band always, the others only when set). */
export function filterQuery(f) {
  const q = new URLSearchParams();
  q.set("band", f.band);
  for (const k of ["klu", "domain", "mission"]) if (f[k]) q.set(k, f[k]);
  return q.toString();
}

/** `modes[mission][band] = { communicate, show }` holding "converse" | "compose", read from loaded packs. */
export function modesOfPack(pack) {
  return Object.fromEntries(
    BANDS.map((b) => [
      b,
      {
        communicate: pack?.bands?.[b]?.communicate?.kind || "",
        show: pack?.bands?.[b]?.show?.kind || "",
      },
    ]),
  );
}

/** Every pack's task kinds, loaded on demand (about 50 KB per pack). */
export async function loadModes(loadMission) {
  const out = {};
  await Promise.all(MISSION_IDS.map(async (id) => (out[id] = modesOfPack(await loadMission(id)))));
  return out;
}

/** The production domain a step uses for a mission and band, or "" while the pack has not been read. */
export const productionDomain = (modes, mission, band, step) =>
  KIND_DOMAIN[modes?.[mission]?.[band]?.[step === "improve" ? "communicate" : step]] || "";

/** Domains one step aligns with. */
export function stepDomains(step, modes, mission, band) {
  const d = STEP_DOMAINS[step];
  if (!d.kind) return d.fixed;
  const own = productionDomain(modes, mission, band, step);
  return own ? [own] : [];
}

/** Does a mission match the filters? Listening and Reading are in every mission (step 2); Speaking vs Writing follows step 4 and 6. */
export function matchesFilters(f, id, mission, modes) {
  if (f.mission && f.mission !== id) return false;
  if (f.klu && mission.klu !== f.klu) return false;
  if ((f.domain === "Speaking" || f.domain === "Writing") && modes?.[id]) {
    const m = modes[id][f.band];
    return [m?.communicate, m?.show].some((k) => KIND_DOMAIN[k] === f.domain);
  }
  return true;
}

export const ALL_STEPS = STEP_IDS;
