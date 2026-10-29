/**
 * family-takehome-data.mjs: the content of one Family Take-Home Sheet, in one language, from the lesson's own files.
 *
 * Sources (nothing is authored here; every field is the lesson's own):
 *   config.json `standard`              the one standard code (scripts/lib/lesson-identity.mjs)
 *   sidecar `v3`                        hook, model, kitchenTable (the home mission), vocab frames, confused coach
 *   sidecar `basicPractice`             the six skill items (multiple choice, answers kept for the grown-up page)
 *   sidecar `stuckTips`, `corner`, `learningTonight`
 *
 * The same builder feeds the PDF, the DOCX and the web "Print this plan" sheet, so the three cannot drift.
 */
import {
  familySidecar,
  interactiveUrl,
  lessonLabel,
  lessonStandard,
  lessonTitle,
  shortLink,
  unitNumber,
} from "./lesson-identity.mjs";

export const LANGS = ["en", "es"];
export const MAX_ITEMS = 6;
export const MIN_ITEMS = 4;
const LETTERS = ["A", "B", "C", "D", "E"];

const pick = (v, lang) => (v && typeof v === "object" ? v[lang] : v);
const neutral = (s) => !/[A-Za-z]{2,}/.test(String(s));

function need(value, what, id, lang) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) throw new Error(`take-home ${id} (${lang}): missing ${what}`);
  return text;
}

/** Choice text in `lang`; a choice with no words (numbers, money) reads the same in both. */
function choiceText(item, i, lang) {
  if (lang === "en") return String(item.choices[i]);
  const es = item.choicesEs?.[i];
  if (es) return String(es);
  const en = String(item.choices[i]);
  if (neutral(en)) return en;
  throw new Error(`take-home: choice "${en}" has no Spanish`);
}

function skillItem(item, lang, id) {
  const stem = lang === "es" ? item.stemEs : item.stem;
  const explanation = lang === "es" ? item.explanationEs : item.explanation;
  return {
    kind: "choice",
    stem: need(stem, "item stem", id, lang),
    choices: item.choices.map((_, i) => ({ letter: LETTERS[i], text: choiceText(item, i, lang) })),
    answerLetter: LETTERS[item.correctIndex],
    explanation: need(explanation, "item explanation", id, lang),
  };
}

/** Units with no skill items (the "Math is ..." mindset pages) practice with the lesson's own sentence frames. */
function frameItems(v3, lang, id) {
  return v3.vocab.slice(0, MAX_ITEMS).map((entry) => ({
    kind: "frame",
    stem: need(pick(entry.frame, lang), "vocab frame", id, lang),
    term: entry.term,
    choices: [],
    answerLetter: "",
    explanation: need(pick(entry.example, lang), "vocab example", id, lang),
  }));
}

function buildItems(sidecar, lang, id, count) {
  const skills = sidecar.basicPractice ?? [];
  const items = (
    skills.length >= MIN_ITEMS
      ? skills.map((it) => skillItem(it, lang, id))
      : frameItems(sidecar.v3, lang, id)
  ).slice(0, count);
  if (items.length < MIN_ITEMS)
    throw new Error(`take-home ${id}: only ${items.length} practice items`);
  return items;
}

/** The grown-up's one "talk about it" question: the lesson's own corner question, else its first coach question. */
function talkQuestion(sidecar, lang, id) {
  const own = pick(sidecar.corner?.question, lang);
  if (own) return own;
  return need(pick(sidecar.v3.confused?.[0]?.coach, lang), "talk question", id, lang);
}

/** Everything one sheet (and its grown-up page) prints, in `lang`, with 4-6 practice items. Throws on a missing field: no silent fallback. */
export function buildTakeHome(id, lang, { items = MAX_ITEMS } = {}) {
  if (!LANGS.includes(lang)) throw new Error(`take-home: lang must be en or es, got ${lang}`);
  const sidecar = familySidecar(id);
  const v3 = sidecar.v3;
  const hasModel = v3.model && v3.model.kind !== "none";
  return {
    id,
    lang,
    unit: unitNumber(id),
    label: lessonLabel(id, lang),
    title: lessonTitle(id, lang),
    standard: lessonStandard(id),
    standardPlain: need(pick(v3.standardPlain, lang), "standardPlain", id, lang),
    hook: {
      style: v3.hook.style,
      text: need(pick(v3.hook, lang), "hook", id, lang),
      guess: need(pick(v3.hook.guess, lang), "hook guess", id, lang),
    },
    model: hasModel
      ? {
          raw: v3.model,
          alt: need(pick(v3.model.alt, lang), "model alt", id, lang),
          name: need(pick(v3.classModel?.name, lang), "classModel name", id, lang),
        }
      : null,
    items: buildItems(sidecar, lang, id, items),
    talk: talkQuestion(sidecar, lang, id),
    mission: need(pick(v3.kitchenTable, lang), "home mission", id, lang),
    stuck: (sidecar.stuckTips?.say ?? [])
      .slice(0, 3)
      .map((s) => need(pick(s, lang), "stuck prompt", id, lang)),
    avoid: (sidecar.stuckTips?.dontSay ?? [])
      .slice(0, 3)
      .map((s) => need(pick(s, lang), "avoid prompt", id, lang)),
    learning: need(pick(sidecar.learningTonight, lang), "learningTonight", id, lang),
    url: interactiveUrl(id),
    link: shortLink(id),
  };
}

export const SHEET_UI = {
  en: {
    wordmark: "Family Math Studio",
    name: "Name",
    date: "Date",
    hookHead: "Tonight's spark",
    modelHead: "Our class model",
    tryHead: "Try it",
    tryNote: "Work it out on paper. Write one answer on each line.",
    frameNote: "Finish each sentence in your own words.",
    answer: "My answer",
    thinking: "My words",
    talkHead: "Talk about it",
    missionHead: "Home mission",
    stuckHead: "If we get stuck, ask",
    stuckNote: "Questions help more than answers.",
    printPlan: "Print this plan",
    feelHead: "How did it feel? (optional)",
    feel: ["Tricky", "Getting there", "Got it"],
    qrHead: "Do it on a screen",
    qrNote: "Scan or type the link. Same lesson, with hints.",
    footer: "Family Math Studio · eduwonderlab.com",
    unit: "Unit",
    page: "Page",
    of: "of",
    guideHead: "For grown-ups",
    guideTitle: "Answers and talk notes",
    learnHead: "What your student is learning",
    answersHead: "Answers",
    answersNote: "Ask your student to explain before you look.",
    avoidHead: "Try not to say",
    stuckGuide: "When they are stuck, ask",
    explainShort: "Why",
  },
  es: {
    wordmark: "Family Math Studio",
    name: "Nombre",
    date: "Fecha",
    hookHead: "La chispa de hoy",
    modelHead: "Nuestro modelo de clase",
    tryHead: "Inténtalo",
    tryNote: "Resuélvelo en papel. Escribe una respuesta en cada línea.",
    frameNote: "Completa cada oración con tus propias palabras.",
    answer: "Mi respuesta",
    thinking: "Mis palabras",
    talkHead: "Conversen",
    missionHead: "Misión en casa",
    stuckHead: "Si se atoran, pregunten",
    stuckNote: "Las preguntas ayudan más que las respuestas.",
    printPlan: "Imprimir este plan",
    feelHead: "¿Cómo te sentiste? (opcional)",
    feel: ["Difícil", "Voy mejorando", "Lo entendí"],
    qrHead: "Hazlo en pantalla",
    qrNote: "Escanea o escribe el enlace. La misma lección, con pistas.",
    footer: "Family Math Studio · eduwonderlab.com",
    unit: "Unidad",
    page: "Página",
    of: "de",
    guideHead: "Para adultos",
    guideTitle: "Respuestas y notas para conversar",
    learnHead: "Lo que aprende tu estudiante",
    answersHead: "Respuestas",
    answersNote: "Pidan a su estudiante que explique antes de mirar.",
    avoidHead: "Eviten decir",
    stuckGuide: "Cuando se atoren, pregunten",
    explainShort: "Por qué",
  },
};
