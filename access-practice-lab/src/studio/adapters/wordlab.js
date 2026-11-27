// Adapter: Word Lab word sets (src/content/wordlab-words.js, a pure data module of 755 academic words with
// meanings and examples in English and Spanish, a Spanish equivalent and a cognate tag). Words are grouped by grade
// band and subject in sets of at most twelve, in file order. A set becomes the words, matching, and a fill-in for
// each word whose example sentence contains the word as written. The ref can also be one word id (`w-...`, the open
// word on a Word Lab page): it opens the set that holds that word. Loaded on demand.

import { fitNote, labActivity } from "./lab-parts.js";
import { matchQuestions, vocabBlock } from "./vocab-parts.js";
import { list, noteBlocks, t, text } from "./util.js";

const load = async () => (await import("../../content/wordlab-words.js")).WORDS;
const SIZE = 12;
const SUBJECT = { ss: "Social Studies", sci: "Science", math: "Math", ela: "ELA" };
const COGNATE = {
  cog: "a true cognate",
  false: "a false friend",
  part: "a partial cognate",
  none: "not a cognate",
};

const groupOf = (w) => (w.b === "both" ? "all-all" : `${w.b}-${w.s}`);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Every set, deterministic: group key in first-seen order, then chunks of SIZE. */
function setsOf(words) {
  const groups = new Map();
  for (const w of words.filter((x) => text(x.w) && text(x.d))) {
    const k = groupOf(w);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(w);
  }
  return [...groups].flatMap(([k, ws]) =>
    Array.from({ length: Math.ceil(ws.length / SIZE) }, (_, n) => ({
      id: `${k}-${n + 1}`,
      key: k,
      n: n + 1,
      words: ws.slice(n * SIZE, n * SIZE + SIZE),
    })),
  );
}

function label(set) {
  const [band, subject] = [set.key.split("-").slice(0, -1).join("-"), set.key.split("-").pop()];
  return band === "all"
    ? `Word Lab words for every band, set ${set.n}`
    : `Word Lab ${SUBJECT[subject] || subject} words, grades ${band}, set ${set.n}`;
}

function cloze(w, n) {
  const re = new RegExp(`\\b${escapeRe(text(w.w))}\\b`, "i");
  const ex = text(w.x);
  const m = re.exec(ex);
  if (!m) return null;
  return {
    type: "question",
    id: `w${n}`,
    format: "blank",
    prompt: `Which word matches this meaning? "${text(w.d)}"`,
    text: `${ex.slice(0, m.index)}[[${m[0]}]]${ex.slice(m.index + m[0].length)}`,
    bank: false,
    hint: `It starts with "${text(w.w).slice(0, 1)}".`,
    explanation: `${text(w.w)}: ${text(w.d)}`.slice(0, 800),
    skill: "vocabulary",
  };
}

export default {
  family: "wordlab",
  label: t("Word Lab word sets", "Conjuntos de palabras del Laboratorio de palabras"),
  note: t(
    "Copies up to twelve Word Lab words into practice you can edit: meanings, Spanish, examples, matching and a fill-in from each word's example.",
    "Copia hasta doce palabras del Laboratorio de palabras en una práctica que puede editar: significados, español, ejemplos, emparejar y una oración para completar con el ejemplo de cada palabra.",
  ),
  editable: [
    "title",
    "description",
    "vocab",
    "prompts",
    "pairs",
    "answerKeys",
    "hints",
    "explanations",
    "teacherNotes",
  ],
  fixed: [
    {
      what: t(
        "Word families, the Frayer model, the detective and the Word Garden review",
        "Familias de palabras, el modelo Frayer, el detective y el repaso del Jardín de palabras",
      ),
      why: t(
        "These Word Lab activities are drawn by the page itself; the copy keeps the words, meanings and examples.",
        "Estas actividades las dibuja la propia página; la copia conserva las palabras, los significados y los ejemplos.",
      ),
    },
    {
      what: t("Spanish meanings", "Significados en español"),
      why: t(
        "The Spanish comes from the Word Lab file and has not been reviewed by a native speaker.",
        "El español proviene del archivo del Laboratorio de palabras y no ha sido revisado por un hablante nativo.",
      ),
    },
  ],

  async list() {
    return setsOf(await load()).map((s) => ({
      id: s.id,
      title: label(s),
      grade: s.key.startsWith("all") ? "" : s.key.split("-").slice(0, -1).join("-"),
      subject: SUBJECT[s.key.split("-").pop()] || "",
      domain: "Vocabulary",
      description: s.words.map((w) => text(w.w)).join(", "),
      count: s.words.length,
    }));
  },

  url: (ref) =>
    /^w-/.test(ref)
      ? `/access-practice-lab/wordlab/explore/${ref}`
      : "/access-practice-lab/wordlab",

  async extract(ref) {
    const sets = setsOf(await load());
    const set = /^w-/.test(ref)
      ? sets.find((s) => s.words.some((w) => w.id === ref))
      : sets.find((s) => s.id === ref);
    if (!set) throw new Error("not-found");
    const vocab = set.words.map((w) => ({
      term: text(w.w),
      def: text(w.d),
      es: text(w.e),
      example: text(w.x),
    }));
    const fitted = vocabBlock(vocab);
    const clozes = set.words.map((w, i) => cloze(w, i + 1)).filter(Boolean);
    const band = set.key.startsWith("all") ? "3-8" : set.key.split("-").slice(0, -1).join("-");
    const teacher = fitNote([
      `Copied from Word Lab: ${label(set)}.`,
      ...set.words.map(
        (w) => `${text(w.w)}: Spanish ${text(w.e) || "none"}, ${COGNATE[w.c] || "cognate status unknown"}.`,
      ),
    ]).teacher;
    return {
      activity: labActivity({
        title: label(set),
        description: vocab.map((v) => v.term).join(", "),
        grade: band,
        subject: SUBJECT[set.key.split("-").pop()] || "",
        curriculum: "Language Page Word Lab",
        objective:
          "Learn academic words: their meanings, Spanish equivalents and use in a sentence.",
        sourceNote: `Copied from Word Lab set ${set.id}.`,
        template: "match-sort",
        blocks: [
          fitted.block,
          ...noteBlocks("vocab", fitted.extra),
          ...(vocab.length >= 2 ? matchQuestions(vocab) : []),
          ...clozes,
        ],
        teacher,
        spanish: vocab.some((v) => v.es),
      }),
      notes: [
        t(
          "Not carried: word families, the Frayer model, the cognate detective, the network view and the Word Garden review schedule. The Spanish example sentences stay in Word Lab.",
          "No se conserva: las familias de palabras, el modelo Frayer, el detective de cognados, la vista de red ni el calendario de repaso del Jardín de palabras. Las oraciones de ejemplo en español permanecen en el Laboratorio.",
        ),
      ],
      source: set.words,
      url: "/access-practice-lab/wordlab",
      sourceTitle: label(set),
    };
  },
};
