// Audio-first (pre-reader) mode, the rules. No DOM and no speech here: this file decides WHEN the mode is on, WHAT is
// spoken for a problem or a result, and HOW a problem is answered without typing. audio-first-view.js draws it.
//
// The mode changes how a problem is presented and answered, never what is asked or how it is graded: a tapped,
// counted or keyed answer lands in the same answer field a typed one does. Replay is the only help it adds, and a
// replay never removes a choice or says anything about the answer.
import { t } from "./i18n.js";
import { spoken, spokenEs } from "./speech.js";

export const AUDIO_DEFAULT_MAX_GRADE = 2; // Kindergarten, 1 and 2: on until the learner or a teacher turns it off
export const AUDIO_TOGGLE_MAX_GRADE = 3; // Grade 3 may switch it on; later grades do not see the control
export const AUDIO_SETTINGS = ["auto", "on", "off"];

// The saved choice is "auto" (follow the grade), "on" or "off". A save written before this mode existed has no
// field, which is "auto"; a boolean (a hand-edited or imported file) keeps its meaning; anything else is "auto".
export function cleanAudioFirst(raw) {
  if (raw === true) return "on";
  if (raw === false) return "off";
  return AUDIO_SETTINGS.includes(raw) ? raw : "auto";
}

// Every place that loads or imports learner settings passes them through here, so an old save gains the field and
// a damaged one cannot break the screen. Other settings are kept exactly as they were.
export function cleanSettings(settings) {
  const base = settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
  return { ...base, audioFirst: cleanAudioFirst(base.audioFirst) };
}

export const audioFirstOffered = (grade) =>
  Number.isInteger(Number(grade)) && Number(grade) <= AUDIO_TOGGLE_MAX_GRADE;

// `assignment.audioFirst === true` is the field a teacher's assignment link will carry (see HANDOFF.md); it turns the
// mode on for that assignment at any grade. Without it, the learner's choice wins, then the grade default.
export function audioFirstActive({ setting, grade, assignment = null } = {}) {
  if (assignment?.audioFirst === true) return true;
  const g = Number(grade);
  if (!audioFirstOffered(g)) return false;
  const choice = cleanAudioFirst(setting);
  if (choice === "on") return true;
  if (choice === "off") return false;
  return g <= AUDIO_DEFAULT_MAX_GRADE;
}

// ---- what is said -----------------------------------------------------------------------------------------------

const BLANK = "\u0001";
const MEANING = {
  en: { "<": "is less than", ">": "is greater than", "=": "is equal to" },
  es: { "<": "es menor que", ">": "es mayor que", "=": "es igual a" },
};

// Plain words for a speech engine: symbols become words, a blank becomes "blank", and pictographs are dropped.
export function speakable(text, lang = "en") {
  const es = lang === "es";
  let out = String(text ?? "")
    .replace(/\p{Extended_Pictographic}️?/gu, " ")
    .replace(/_{2,}|[□▢☐]/g, ` ${BLANK} `);
  out = es ? spokenEs(out) : spoken(out);
  if (!es) {
    out = out
      .replace(/(\d+)\s*\/\s*(\d+)/g, "$1 over $2")
      .replaceAll("+", " plus ")
      .replaceAll("≤", " is less than or equal to ")
      .replaceAll("≥", " is greater than or equal to ")
      .replaceAll("<", " is less than ")
      .replaceAll(">", " is greater than ");
  } else {
    out = out
      .replaceAll("≤", " es menor o igual que ")
      .replaceAll("≥", " es mayor o igual que ")
      .replaceAll("<", " es menor que ")
      .replaceAll(">", " es mayor que ");
  }
  return out
    .replaceAll(BLANK, es ? "espacio en blanco" : "blank")
    .replace(/\s+([,.?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

const isSymbolSet = (choices) =>
  choices.length > 0 && choices.every((c) => /^[<=>]$/.test(String(c)));

// What one answer choice sounds like. A symbol says what it means; a word and a number say themselves.
export function choiceSpeech(choice, lang = "en", { choicesEs = null, index = 0 } = {}) {
  const label = String(choice ?? "");
  if (/^[<=>]$/.test(label)) return MEANING[lang === "es" ? "es" : "en"][label];
  const shown = lang === "es" && choicesEs ? (choicesEs[index] ?? label) : label;
  return speakable(shown, lang);
}

// The lines spoken when a problem appears, in order: the question, each choice, and (the first time) one short
// instruction. Every line is a replayable unit the guide can highlight, and carries the language it is said in: a
// Spanish request still reads an English stem or word in English when no Spanish wording exists, rather than putting
// English through a Spanish voice. Nothing here depends on the answer.
const wordy = (text) => /[A-Za-z]{3,}/.test(String(text));
export function problemScript(item, { lang = "en", plan = null, questionEs = null, choicesEs = null, withInstruction = true } = {}) {
  if (!item) return [];
  const es = lang === "es";
  const stemEs = es && questionEs;
  const stemText = stemEs ? questionEs : item.question;
  const stemLang = es && !stemEs && wordy(item.question) ? "en" : lang;
  const lines = [{ kind: "stem", lang: stemLang, text: speakable(stemText, stemLang) }];
  const choices = Array.isArray(item.choices) ? item.choices : [];
  if (isSymbolSet(choices) && !/\?/.test(String(stemText))) {
    lines.push({ kind: "stem", lang, text: es ? "¿Qué símbolo va en el espacio en blanco?" : "Which symbol goes in the blank?" });
  }
  choices.forEach((choice, index) => {
    const label = String(choice ?? "");
    const mapped = es && choicesEs && choicesEs[index] !== undefined && choicesEs[index] !== label;
    const choiceLang = es && !mapped && !/^[<=>]$/.test(label) && wordy(label) ? "en" : lang;
    lines.push({ kind: "choice", index, lang: choiceLang, text: choiceSpeech(choice, choiceLang, { choicesEs, index }) });
  });
  const how = withInstruction && plan ? instructionFor(plan, lang) : "";
  if (how) lines.push({ kind: "instruction", lang, text: how });
  return lines.filter((line) => line.text);
}

// One short sentence saying how to answer. It says nothing about the problem.
export function instructionFor(plan, lang = "en") {
  const key = {
    choices: "Tap your answer.",
    tenFrame: "Tap the boxes to count. Then press the check button.",
    baseTen: "Tap plus to build the number. Then press the check button.",
    keypad: "Tap the numbers. Then press the check button.",
    response: "Build your answer. Then press the check button.",
    typed: "Type your answer. Then press the check button.",
  }[plan?.kind];
  if (!key) return "";
  const text = lang === "es" ? SPANISH_INSTRUCTIONS[key] : key;
  return text;
}
// These mirror the t() keys used by the view so a spoken instruction in the other language needs no page switch.
const SPANISH_INSTRUCTIONS = {
  "Tap your answer.": "Toca tu respuesta.",
  "Tap the boxes to count. Then press the check button.":
    "Toca las casillas para contar. Luego presiona el botón de revisar.",
  "Tap plus to build the number. Then press the check button.":
    "Toca más para formar el número. Luego presiona el botón de revisar.",
  "Tap the numbers. Then press the check button.":
    "Toca los números. Luego presiona el botón de revisar.",
  "Build your answer. Then press the check button.":
    "Forma tu respuesta. Luego presiona el botón de revisar.",
  "Type your answer. Then press the check button.":
    "Escribe tu respuesta. Luego presiona el botón de revisar.",
};

// A result, spoken. A miss never says the answer; a result that already shows the answer (the learner has had
// their tries) says it. `answer` is passed only when the screen shows it.
export function feedbackSpeech(phase, { lang = "en", answer = "" } = {}) {
  const es = lang === "es";
  const says = {
    correct: es ? "¡Sí! Es correcto." : "Yes! That is right.",
    assisted: es ? "¡Sí! Lo lograste." : "Yes! You got it.",
    retry: es
      ? "Todavía no. Escucha otra vez y vuelve a intentar."
      : "Not yet. Listen again and try again.",
    revealed: es ? "Miremos juntos." : "Let us look together.",
    revised: es ? "¡Buen arreglo!" : "Nice fix!",
    empty: es ? "Primero toca o forma una respuesta." : "First tap or build an answer.",
  }[phase];
  if (!says) return "";
  const shown =
    phase === "revealed" && answer
      ? ` ${es ? "La respuesta es" : "The answer is"} ${speakable(answer, lang)}.`
      : "";
  return `${says}${shown}`;
}

export const BUDDY_MOOD = {
  correct: "cheer",
  assisted: "cheer",
  revised: "cheer",
  retry: "think",
  revealed: "think",
  empty: "think",
};

// ---- how a problem is answered ------------------------------------------------------------------------------------

// Answers up to 20 are counted on ten-frames, up to 999 built from base-ten blocks, other numbers keyed on a big pad.
// Both counting widgets always offer room for the largest size, so the size of the control never hints the answer.
export const COUNT_MAX = 20;
export const BLOCKS_MAX = 999;

const wholeNumber = (text) => /^\d+$/.test(String(text));

// { kind: "response" | "choices" | "tenFrame" | "baseTen" | "keypad" | "typed", ... }
export function answerPlan(item) {
  if (!item) return { kind: "typed" };
  if (item.response) return { kind: "response" };
  if (Array.isArray(item.choices) && item.choices.length) return { kind: "choices" };
  const answers = (item.answers || []).map(String);
  if (!answers.length) return { kind: "typed" };
  if (item.kind === "number" && answers.every(wholeNumber)) {
    const top = Math.max(...answers.map(Number));
    if (top <= COUNT_MAX) return { kind: "tenFrame", frames: 2 };
    if (top <= BLOCKS_MAX) return { kind: "baseTen", places: ["hundreds", "tens", "ones"] };
  }
  const keys = new Set("0123456789");
  for (const answer of answers) {
    if (/[^\d:./\-−]/.test(answer)) return { kind: "typed" };
    for (const ch of answer) keys.add(ch === "−" ? "-" : ch);
  }
  // Every key a typed answer could need, whatever the right one is, so the pad never gives the shape away.
  if (item.kind === "fraction") keys.add("/");
  return { kind: "keypad", extras: [":", ".", "/", "-"].filter((ch) => keys.has(ch)) };
}

// A baseTen build reads "h,t,o"; the answer field wants the number itself.
export function blocksToNumber(value) {
  const parts = String(value || "")
    .split(",")
    .map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) return "";
  return String(parts[0] * 100 + parts[1] * 10 + parts[2]);
}

// ---- pictures on answer choices ---------------------------------------------------------------------------------

const SHAPES = new Set([
  "circle",
  "square",
  "triangle",
  "rectangle",
  "hexagon",
  "pentagon",
  "rhombus",
  "trapezoid",
]);
const EMOJI = {
  apples: "🍎",
  bananas: "🍌",
  oranges: "🍊",
  pears: "🍐",
  cats: "🐱",
  dogs: "🐶",
  birds: "🐦",
  fish: "🐟",
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
};

// What to draw on a choice tile, or null for text only. A picture only restates the choice (a shape draws itself, a
// number shows that many counters); it never marks one choice as better than another.
export function choicePicture(choice, item = null) {
  const label = String(choice ?? "").trim();
  const key = label.toLowerCase();
  if (SHAPES.has(key)) return { type: "shape", name: key };
  if (key === "even" || key === "odd" || key === "neither") return { type: "pairs", name: key };
  if (EMOJI[key]) return { type: "emoji", glyph: EMOJI[key] };
  const choices = Array.isArray(item?.choices) ? item.choices.map(String) : [];
  if (
    /^\d+$/.test(label) &&
    Number(label) <= COUNT_MAX &&
    choices.length &&
    choices.every((c) => /^\d+$/.test(c) && Number(c) <= COUNT_MAX)
  ) {
    return { type: "dots", count: Number(label) };
  }
  return null;
}

// Plain-language name of a picture, for the tile's accessible name.
export function pictureName(picture, label) {
  if (!picture) return label;
  if (picture.type === "dots") return t("{n} counters", { n: picture.count });
  return label;
}
