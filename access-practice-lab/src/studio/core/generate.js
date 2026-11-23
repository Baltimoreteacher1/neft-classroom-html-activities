// Create My Activity: turn what the teacher supplied (a unit's vocabulary, pasted words, questions, a passage, math
// problems) into a complete first version. Deterministic: the same input always builds the same activity, so a
// rebuild never reshuffles a teacher's work, and every answer is computed or copied, never guessed.
//
// Templates are recipes over a shared content model; they never ship placeholder text. When the input cannot make a
// good activity, `buildActivity` says so in `needs` instead of padding it with filler.

import { sentencesOf } from "./parse.js";
import { TEMPLATES, normalizeActivity } from "./schema.js";

const STOP = new Set(
  "about after again also because before being between could during every first from have into just like many more most much other over some such than that their them then there these they this those through under very want were what when where which while with would your".split(
    " ",
  ),
);
const FRAMES = {
  explain: "I know ___ because ___.",
  evidence: "The text says ___. This shows ___.",
  compare: "___ and ___ are alike because ___. They are different because ___.",
  math: "First I ___. Then I ___. So the answer is ___.",
};

/** Small stable hash -> int, for deterministic option positions. */
function hash(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}
const rotate = (arr, by) => arr.map((_, i) => arr[(i + by) % arr.length]);
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const cleanStep = (s) =>
  cap(
    s
      .replace(
        /^\s*(?:step\s*\d+\s*[:.-]\s*|(?:first|next|then|after that|finally|last|second|third)\s*,?\s*)/i,
        "",
      )
      .trim(),
  );
const frameFor = (parsed, seed, fallback) => seed?.frames?.[0] || fallback;

/** WIDA level -> supports. Teachers see plain-language switches; the level only sets starting defaults. */
export function supportsForWida(level = 0, base = {}) {
  const low = level >= 1 && level <= 2;
  const mid = level >= 3 && level <= 4;
  return {
    wida: level,
    hints: true,
    frames: low || mid,
    readAloud: low,
    chunk: low,
    visuals: low,
    spanish: false,
    ...base,
  };
}

function vocabBlock(vocab) {
  return {
    type: "vocab",
    items: vocab
      .slice(0, 24)
      .map((v) => ({ term: v.term, def: v.def, es: v.es || "", example: v.example || "" })),
  };
}

/** Match questions of at most six pairs each. */
function matchQuestions(vocab) {
  const out = [];
  for (let i = 0; i < vocab.length; i += 6) {
    const chunk = vocab.slice(i, i + 6);
    if (chunk.length < 2) continue;
    out.push({
      type: "question",
      format: "match",
      prompt:
        vocab.length > 6
          ? `Match each word to its meaning (set ${out.length + 1}).`
          : "Match each word to its meaning.",
      pairs: chunk.map((v) => ({ left: v.term, right: v.def })),
      hint: "Read each meaning slowly. Start with the one you know best.",
      explanation: chunk.map((v) => `${v.term}: ${v.def}`).join(" "),
      skill: "vocabulary",
    });
  }
  return out;
}

function defChoice(vocab, i) {
  const v = vocab[i];
  const others = vocab.filter(
    (_, j) => j !== i && vocab[j].def.toLowerCase() !== v.def.toLowerCase(),
  );
  const wrong = rotate(others, hash(v.term) % Math.max(others.length, 1)).slice(0, 3);
  const defs = [v.def, ...wrong.map((o) => o.def)];
  const options = rotate(defs, defs.length - (i % defs.length)).map((text, n) => ({
    id: `o${n + 1}`,
    text,
  }));
  return {
    type: "question",
    format: "choice",
    prompt: `What does "${v.term}" mean?`,
    options,
    answer: options.find((o) => o.text === v.def).id,
    hint: `Think about how "${v.term}" is used in your lesson.`,
    explanation: `"${v.term}" means ${v.def}.`,
    misconception: wrong.length ? `Students may confuse "${v.term}" with "${wrong[0].term}".` : "",
    skill: "vocabulary",
  };
}

const termBlank = (v) => ({
  type: "question",
  format: "blank",
  prompt: `Which word matches this meaning? "${v.def}"`,
  text: `[[${v.term}]]`,
  hint: `It starts with "${v.term[0]}".`,
  explanation: `"${v.term}" means ${v.def}.`,
  skill: "vocabulary",
});

/** Questions that come from a reading passage. All items are built from the text itself. */
function passageQuestions(passage, vocab, seed) {
  const out = [];
  const sentences = sentencesOf(passage);
  const terms = vocab
    .map((v) => v.term)
    .filter((t) =>
      new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(passage),
    );
  if (terms.length) {
    const marked = passage.replace(
      new RegExp(
        `\\b(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
        "gi",
      ),
      "[[$1]]",
    );
    out.push({
      type: "question",
      format: "identify",
      prompt: "Click each vocabulary word you find in the text.",
      text: marked,
      hint: "Look back at the word list.",
      explanation: `The vocabulary words in this text are: ${terms.join(", ")}.`,
      skill: "vocabulary in context",
    });
  }
  const cloze = sentences
    .map((s) => ({
      s,
      word: s
        .split(/\s+/)
        .map((w) => w.replace(/[^\p{L}'-]/gu, ""))
        .filter((w) => w.length >= 5 && !STOP.has(w.toLowerCase()))
        .sort((a, b) => b.length - a.length)[0],
    }))
    .filter((c) => c.word && !/^[A-Z]/.test(c.word) && c.s.split(" ").length <= 22)
    .slice(0, 3);
  for (const c of cloze) {
    const text = c.s.replace(new RegExp(`\\b${c.word}\\b`), `[[${c.word}]]`);
    out.push({
      type: "question",
      format: "blank",
      prompt: "Read the text again. Fill in the missing word.",
      text,
      bank: true,
      hint: "Go back to the text and find this sentence.",
      explanation: `The text says: "${c.s}"`,
      skill: "reading closely",
    });
  }
  if (sentences.length >= 4) {
    out.push({
      type: "question",
      format: "order",
      prompt: "Put these sentences from the text in the order they happen.",
      items: sentences.slice(0, 4).map((s) => ({ text: s })),
      hint: "Look for words like first, then, and later.",
      explanation: "The sentences are in the same order as the text.",
      skill: "sequence",
    });
  }
  out.push({
    type: "question",
    format: "short",
    kind: "explain",
    prompt: "What is this text mostly about? Use details from the text.",
    frame: frameFor(null, seed, FRAMES.evidence),
    sample: "",
    rubric: ["States the main idea", "Uses at least one detail from the text"],
    minWords: 6,
    skill: "main idea and evidence",
  });
  return out;
}

const sortQuestion = (cats) => ({
  type: "question",
  format: "sort",
  prompt: "Sort each item into the right group.",
  categories: cats.slice(0, 4).map((c) => ({ label: c.label })),
  items: cats
    .slice(0, 4)
    .flatMap((c, ci) => c.items.slice(0, 6).map((text) => ({ text, category: `c${ci + 1}` }))),
  hint: "Say what each group has in common.",
  explanation: cats.map((c) => `${c.label}: ${c.items.join(", ")}`).join(". "),
  skill: "classifying",
});
const orderQuestion = (steps) => ({
  type: "question",
  format: "order",
  prompt: "Put the steps in the correct order.",
  items: steps.slice(0, 10).map((text) => ({ text: cleanStep(text) })),
  hint: "What has to happen first?",
  explanation: "The steps are listed in the order they happen.",
  skill: "sequence",
});

const explainQuestion = (prompt, frame, rubric = []) => ({
  type: "question",
  format: "short",
  kind: "explain",
  prompt,
  frame,
  sample: "",
  rubric,
  minWords: 5,
  skill: "explain thinking",
});

/** Everything a teacher gave us, as a flat list of question blocks, in a teaching order. */
export function questionPool(parsed, seed, { wantNumber = true } = {}) {
  const vocab = parsed.vocab.length ? parsed.vocab : seed?.vocab || [];
  const pool = [...parsed.questions];
  if (wantNumber) pool.push(...parsed.problems);
  if (parsed.categories.length) pool.push(sortQuestion(parsed.categories));
  if (parsed.sequence.length >= 3) pool.push(orderQuestion(parsed.sequence));
  if (parsed.passage) pool.push(...passageQuestions(parsed.passage, vocab, seed));
  if (vocab.length >= 2) {
    pool.push(...matchQuestions(vocab));
    vocab.slice(0, 8).forEach((_, i) => pool.push(defChoice(vocab, i)));
    vocab.slice(0, 4).forEach((v) => pool.push(termBlank(v)));
  }
  return pool;
}

const KIND_LABEL = {
  interactive: "Activity",
  worksheet: "Worksheet",
  game: "Game",
  check: "Quick Check",
};

/** Pick the format and template that best fits the content. Always overridable by the teacher. */
export function recommend(parsed, seed, subject = "") {
  const hasPassage = Boolean(parsed.passage);
  const hasVocab =
    parsed.vocab.length >= 3 || (!parsed.problems.length && seed?.vocab?.length >= 3);
  let kind = "interactive";
  let template = "explore-practice";
  let why = [
    "A mix of practice works well for this content.",
    "Una mezcla de práctica funciona bien con este contenido.",
  ];
  if (hasPassage)
    ({ template, why } = {
      template: "interactive-reading",
      why: [
        "A reading passage works best as interactive reading with evidence questions.",
        "Un texto de lectura funciona mejor como lectura interactiva con preguntas de evidencia.",
      ],
    });
  else if (parsed.problems.length >= 3)
    ({ kind, template, why } = {
      kind: "worksheet",
      template: "guided",
      why: [
        "Math problems need room to show thinking: a worksheet fits.",
        "Los problemas de matemáticas necesitan espacio para mostrar el trabajo: una hoja de trabajo encaja.",
      ],
    });
  else if (parsed.sequence.length >= 3 || parsed.categories.length >= 2)
    ({ template, why } = {
      template: "match-sort",
      why: [
        "Steps and groups turn into ordering and sorting.",
        "Los pasos y los grupos se convierten en ordenar y clasificar.",
      ],
    });
  else if (hasVocab)
    ({ template, why } = {
      template: "match-sort",
      why: [
        "Vocabulary works well as matching and sorting.",
        "El vocabulario funciona bien como emparejar y clasificar.",
      ],
    });
  else if (parsed.questions.length && parsed.questions.length <= 6)
    ({ kind, template, why } = {
      kind: "check",
      template: "skill-check",
      why: ["A few questions make a quick check.", "Pocas preguntas forman una revisión rápida."],
    });
  else if (subject === "Math")
    ({ kind, template } = { kind: "worksheet", template: "independent" });
  return { kind, template, why };
}

/** How many questions each kind targets by default (teacher can change). */
export const DEFAULT_COUNT = { interactive: 8, worksheet: 8, game: 10, check: 4 };

/**
 * @param {object} args { kind, template, parsed, seed, context, supports, title, count, mathQuestions }
 * @returns {{ activity: object, needs: string[] }} `needs` lists plain-language reasons content is thin.
 */
export function buildActivity({
  kind = "interactive",
  template,
  parsed,
  seed = null,
  context = {},
  supports = {},
  title = "",
  count,
  mathQuestions = [],
}) {
  const tpl = TEMPLATES[kind].some((t) => t.id === template) ? template : TEMPLATES[kind][0].id;
  const vocab = parsed.vocab.length ? parsed.vocab : seed?.vocab || [];
  const want = count || DEFAULT_COUNT[kind];
  const needs = [];
  const blocks = [];
  const sup = supportsForWida(supports.wida || 0, supports);
  const mathFirst = kind === "worksheet" && mathQuestions.length;
  let pool = questionPool(parsed, seed, { wantNumber: true });
  if (mathQuestions.length)
    pool = mathFirst ? [...mathQuestions, ...pool] : [...pool, ...mathQuestions];
  if (tpl === "organizer" || tpl === "reading-writing")
    pool = pool.filter(
      (q) => q.format === "short" || q.format === "blank" || tpl === "reading-writing",
    );

  if (tpl === "organizer") {
    blocks.push({
      type: "text",
      role: "directions",
      text: "Use the organizer to show what you know. Write words or short sentences.",
    });
    blocks.push({
      type: "organizer",
      kind: parsed.categories.length ? "compare" : vocab.length ? "web" : "kwl",
      prompts: parsed.categories.length
        ? parsed.categories.slice(0, 2).map((c) => c.label)
        : vocab.slice(0, 6).map((v) => v.term),
    });
    pool.unshift(
      explainQuestion(
        "What did you learn? Use words from the organizer.",
        frameFor(parsed, seed, FRAMES.explain),
        ["Uses organizer words", "Gives a reason"],
      ),
    );
  } else if (parsed.passage) {
    blocks.push({
      type: "passage",
      title: title || context.unitTitle || "Read",
      text: parsed.passage,
    });
  }
  if (vocab.length && kind !== "check" && tpl !== "organizer")
    blocks.push(vocabBlock(vocab.slice(0, 12)));
  if (seed?.exitTicket && kind === "check")
    pool.push(
      explainQuestion(
        seed.exitTicket.prompt,
        seed.exitTicket.frame || frameFor(parsed, seed, FRAMES.explain),
        ["Uses the target frame", `Uses key words: ${seed.exitTicket.vocab.join(", ")}`],
      ),
    );
  if (tpl === "build-explain" || tpl === "explain-revise")
    pool.push(
      explainQuestion(
        context.objective || "Explain what you learned.",
        frameFor(parsed, seed, FRAMES.explain),
      ),
    );
  if (mathQuestions.length && kind === "worksheet")
    pool.push(
      explainQuestion("Explain how you solved one problem.", FRAMES.math, [
        "Names the steps",
        "Uses math words",
      ]),
    );

  const questions = [];
  const seen = new Set();
  for (const q of pool) {
    const k = `${q.format}|${q.prompt}|${q.text || ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    questions.push(q);
  }
  const chosen = questions.length > want ? spread(questions, want) : questions;
  if (kind === "check" && chosen.length < 3)
    needs.push(
      "A quick check works best with at least three questions. Add a few words, questions or problems.",
    );
  if (kind === "game" && chosen.length < 3)
    needs.push(
      "A game needs at least three questions. Add vocabulary with meanings, or questions with answers.",
    );
  if (!chosen.length)
    needs.push(
      "Add your lesson words, questions or a short text, or choose a lesson, and we will build the activity.",
    );
  if (chosen.some((q) => q.needsAnswer))
    needs.push("Mark the correct answer for each question you typed (put * before it).");
  if (chosen.some((q) => q.format === "short" && !q.sample))
    needs.push(
      "Add a sample answer to the written-response question so students know what good looks like.",
    );

  blocks.unshift({ type: "text", role: "directions", text: directionsFor(kind, tpl) });
  for (const q of chosen) {
    const { needsAnswer, ...rest } = q;
    blocks.push(rest);
  }
  const autoTitle =
    title ||
    [
      context.unitTitle || (vocab[0] ? `${cap(vocab[0].term)} and more` : "My"),
      KIND_LABEL[kind],
    ].join(" ");
  const activity = normalizeActivity({
    title: autoTitle,
    kind,
    template: tpl,
    context,
    supports: sup,
    look: { style: kind === "game" ? "adventure" : kind === "worksheet" ? "classic" : "calm" },
    blocks,
    notes: { teacher: "", misconceptions: seed?.l1Watchouts?.slice(0, 3) || [] },
  });
  return { activity, needs };
}

/** Evenly spread a pick of `n` items, keeping first and last so the set still has a start and an ending. */
function spread(list, n) {
  if (n >= list.length) return list;
  const out = [];
  for (let i = 0; i < n; i++)
    out.push(list[Math.round((i * (list.length - 1)) / Math.max(n - 1, 1))]);
  return [...new Set(out)];
}

const DIRECTIONS = {
  interactive:
    "Read each task. Try it, then check your answer. If it is not right yet, use the hint and try again.",
  worksheet: "Read each problem. Show your thinking in the space. Write your answer on the line.",
  game: "Answer the questions to move forward. You can try again if you miss one.",
  check: "Answer each question. After you check, fix any answer you want to change.",
};
const directionsFor = (kind) => DIRECTIONS[kind];
