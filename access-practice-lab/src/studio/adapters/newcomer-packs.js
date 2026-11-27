// Adapter: newcomer vocabulary packs (content/packs/). Each survival-vocabulary topic (12 topics, 12 words each) becomes
// a word table with pictures named in English and Spanish and English-to-Spanish matching; the new-arrival school pack
// becomes its routine phrases with the same matching; the speaking and listening cards become open speaking prompts
// with their sentence frames. The packs hold no English meanings, so no vocabulary definitions are written: the pairing
// that is taught is English word to Spanish word, exactly as the pack pairs them.
// Not adapted: the choice menus, the family guide, the progress tracker, the all-about-me sheets (personal writing),
// and the sentence-building and scaffold packs (frames and word banks with no task to attach them to).

import { openQuestion } from "./vocab-parts.js";
import { balancedGroups, list, noteBlocks, t, tableBlocks, text } from "./util.js";

const BASE = "/access-practice-lab/content/packs";
const URL = "/access-practice-lab/packs";
const SURVIVAL = "survival-";
const EXTENDED = ["new-arrival-school", "speaking-listening-cards"];

const urlFor = (ref) => (EXTENDED.includes(ref) ? `${URL}/${ref}` : URL);

/** Match sets of two to six pairs; no set holds the same Spanish twice (the pack has a few shared Spanish words). */
function pairSets(pairs) {
  const groups = balancedGroups(pairs, 6).map((g) => [...g]);
  for (const g of groups)
    for (let i = 0; i < g.length; i++) {
      if (!g.some((x, j) => j !== i && x.es === g[i].es)) continue;
      const other = groups.find((h) => h !== g && !h.some((x) => x.es === g[i].es));
      const k = other ? other.findIndex((x) => !g.some((y) => y.es === x.es)) : -1;
      if (k >= 0) [g[i], other[k]] = [other[k], g[i]];
    }
  return groups;
}

function matchBlocks(pairs, what) {
  const sets = pairSets(pairs);
  return sets.map((set, i) => ({
    type: "question",
    id: `m${i + 1}`,
    format: "match",
    prompt:
      sets.length > 1
        ? `Match each English ${what} to its Spanish (set ${i + 1} of ${sets.length}).`
        : `Match each English ${what} to its Spanish.`,
    pairs: set.map((p, n) => ({ id: `p${n + 1}`, left: p.en, right: p.es })),
    explanation: set.map((p) => `${p.en} = ${p.es}`).join(". "),
    skill: "vocabulary",
  }));
}

function activity({ title, description, objective, blocks, ref, spanish, template }) {
  return {
    title: title.slice(0, 120),
    description,
    kind: "interactive",
    template,
    context: {
      grade: "",
      subject: "",
      curriculum: "Newcomer packs",
      objective,
      standards: [],
      source: { origin: "teacher", note: `Copied from the newcomer pack ${ref}.` },
    },
    supports: {
      wida: 0,
      hints: false,
      frames: !spanish,
      spanish,
      readAloud: false,
      visuals: false,
      chunk: false,
    },
    options: { shuffle: true, revise: true, answerKey: true },
    blocks,
    notes: { teacher: "", misconceptions: [] },
  };
}

const NOTE_ES = t(
  "The Spanish words come from the pack (review status: automated checks only) and have not been reviewed by a native speaker.",
  "Las palabras en español provienen del paquete (estado de revisión: solo comprobaciones automáticas) y no han sido revisadas por un hablante nativo.",
);

async function survival(ref, fetchJson) {
  const pack = await fetchJson(`${BASE}/survival-vocabulary.json`);
  const topic = list(pack?.topics).find((x) => `${SURVIVAL}${x.id}` === ref);
  if (!topic) throw new Error("bad-source");
  const words = list(topic.words)
    .map((w) => ({ en: text(w.en), es: text(w.es) }))
    .filter((w) => w.en && w.es);
  const flags = new Set();
  const title = text(topic.title?.en);
  const blocks = [
    ...tableBlocks(
      "words",
      `${title} / ${text(topic.title?.es)}`,
      ["English", "Español"],
      words.map((w) => [w.en, w.es]),
      flags,
    ),
    ...matchBlocks(words, "word"),
    ...noteBlocks("pack", [
      `Copied from the survival vocabulary pack, topic "${title}". Each word has a picture card in the pack (${URL}).`,
    ]),
  ];
  return {
    activity: activity({
      title: `Survival vocabulary: ${title}`,
      description: `${words.length} words in English and Spanish`,
      objective: `Learn and match everyday English words for ${title.toLowerCase()} with their Spanish.`,
      blocks,
      ref,
      spanish: true,
      template: "match-sort",
    }),
    notes: [
      t(
        "Not carried: the picture cards, word wall, bingo and printable labels. The pack has no English meanings, so the words are paired with their Spanish rather than defined.",
        "No se conserva: las tarjetas con imágenes, el muro de palabras, el bingo ni las etiquetas para imprimir. El paquete no tiene significados en inglés, por eso las palabras se emparejan con su español en lugar de definirse.",
      ),
      NOTE_ES,
    ],
    source: topic,
    sourceTitle: title,
  };
}

async function newArrival(fetchJson) {
  const pack = await fetchJson(`${BASE}/new-arrival-school.json`);
  const phrases = list(pack?.phrases)
    .map((p) => ({ en: text(p.en), es: text(p.es), routine: text(p.routine) }))
    .filter((p) => p.en && p.es);
  if (!phrases.length) throw new Error("bad-source");
  const flags = new Set();
  const title = text(pack.title?.en);
  const welcome = [text(pack.welcome?.en), text(pack.welcome?.es)].filter(Boolean).join("\n\n");
  const blocks = [
    ...(welcome ? [{ type: "text", id: "welcome", role: "body", text: welcome }] : []),
    ...tableBlocks(
      "phrases",
      `${title} / ${text(pack.title?.es)}`,
      ["Routine", "English", "Español"],
      phrases.map((p) => [p.routine, p.en, p.es]),
      flags,
    ),
    ...matchBlocks(phrases, "phrase"),
    ...noteBlocks("pack", [
      `Copied from the newcomer pack "${title}". Map labels in the pack: ${list(pack.mapLabels).join(", ")}.`,
    ]),
  ];
  return {
    activity: activity({
      title,
      description: `${phrases.length} school-routine phrases in English and Spanish`,
      objective: "Use everyday school-routine phrases in English.",
      blocks,
      ref: pack.id,
      spanish: true,
      template: "match-sort",
    }),
    notes: [
      t(
        "Not carried: the read-aloud buttons and the school map.",
        "No se conserva: los botones para escuchar ni el mapa de la escuela.",
      ),
      NOTE_ES,
      ...(flags.has("table-as-text")
        ? [
            t(
              "The phrase table was too large for a table block and is shown as text lines.",
              "La tabla de frases era demasiado grande para un bloque de tabla y aparece como líneas de texto.",
            ),
          ]
        : []),
    ],
    source: pack,
    sourceTitle: title,
  };
}

async function speakingCards(fetchJson) {
  const pack = await fetchJson(`${BASE}/speaking-listening-cards.json`);
  const cards = list(pack?.cards).filter((c) => text(c.prompt));
  if (!cards.length) throw new Error("bad-source");
  const title = text(pack.title?.en);
  const blocks = [
    ...cards.map((c, i) =>
      openQuestion({
        id: `card${i + 1}`,
        prompt: `${text(c.klu)} (grades ${text(c.band)}): ${text(c.prompt)}`,
        kind: "explain",
        frame: text(c.sentenceFrame),
      }),
    ),
    ...noteBlocks("pack", [
      `Copied from the newcomer pack "${title}": ${cards.length} cards, three for each Key Language Use and grade band. Speaking is never auto-graded.`,
    ]),
  ];
  return {
    activity: activity({
      title,
      description: `${cards.length} speaking prompts with sentence frames`,
      objective: "Speak about a topic using a sentence frame for each Key Language Use.",
      blocks,
      ref: pack.id,
      spanish: false,
      template: "build-explain",
    }),
    notes: [
      t(
        "Not carried: the grade-band filter and the printable cards. Every card is copied; delete the ones you do not need.",
        "No se conserva: el filtro por grado ni las tarjetas para imprimir. Se copian todas las tarjetas; borre las que no necesite.",
      ),
    ],
    source: pack,
    sourceTitle: title,
  };
}

export default {
  family: "newcomer-packs",
  label: t("Newcomer vocabulary packs", "Paquetes de vocabulario para recién llegados"),
  note: t(
    "Copies a survival-vocabulary topic or a newcomer pack: English and Spanish words or phrases with matching, or speaking prompts with frames.",
    "Copia un tema de vocabulario esencial o un paquete para recién llegados: palabras o frases en inglés y español con emparejar, o consignas para hablar con marcos.",
  ),
  editable: [
    "title",
    "description",
    "objective",
    "directions",
    "table",
    "prompts",
    "pairs",
    "answerKeys",
    "explanations",
    "frames",
    "openResponses",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Picture cards and printable labels",
        "Tarjetas con imágenes y etiquetas para imprimir",
      ),
      why: t(
        "The pack's pictures and print layouts are drawn by the packs page; a copy keeps the words, the pairs and the prompts.",
        "La página de paquetes dibuja las imágenes y los diseños para imprimir; una copia conserva las palabras, los pares y las consignas.",
      ),
    },
  ],

  async list({ fetchJson }) {
    const pack = await fetchJson(`${BASE}/survival-vocabulary.json`);
    const topics = list(pack?.topics).map((x) => ({
      id: `${SURVIVAL}${x.id}`,
      title: `Survival vocabulary: ${text(x.title?.en)}`,
      grade: "",
      subject: "",
      domain: "Vocabulary",
      description: text(x.title?.es),
      count: list(x.words).length,
    }));
    const extended = [];
    for (const id of EXTENDED) {
      const p = await fetchJson(`${BASE}/${id}.json`);
      extended.push({
        id,
        title: text(p?.title?.en),
        grade: "",
        subject: "",
        domain: id === "speaking-listening-cards" ? "Speaking" : "Vocabulary",
        description: text(p?.title?.es),
        count: list(p?.phrases || p?.cards).length,
      });
    }
    return [...topics, ...extended];
  },

  url: urlFor,

  async extract(ref, { fetchJson }) {
    let made;
    if (ref.startsWith(SURVIVAL)) made = await survival(ref, fetchJson);
    else if (ref === "new-arrival-school") made = await newArrival(fetchJson);
    else if (ref === "speaking-listening-cards") made = await speakingCards(fetchJson);
    else throw new Error("bad-ref");
    return { ...made, url: urlFor(ref) };
  },
};
