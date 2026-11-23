// Resource Remix: turn text a teacher is allowed to use into an editable draft.
// Rules: the teacher's words are kept exactly as typed (quotes, numbers and math notation are never altered),
// definitions are filled only from studio vocabulary collections and always need teacher confirmation, and nothing is invented.
import { analyzeLanguage, splitSentences } from "./lens.js";
import { FUNCTIONS } from "./lens-wordlists.js";
import { suggestObjectives } from "./lensdata.js";
import { read, write } from "./store.js";
import { TIERS } from "../data/taxonomy.js";

export const REMIX_NOTICE =
  "You are responsible for having the right to use any text, problem or objective you paste. Nothing you paste is uploaded: it is read in this browser and stays on this device.";

export const REMIX_TARGETS = [
  {
    id: "vocab-cards",
    label: "Illustrated vocabulary cards",
    input: "text",
    help: "Pick the important words in a text. Definitions and pictures fill in only from the studio's own vocabulary collections; you confirm every one.",
  },
  {
    id: "evidence",
    label: "Text to evidence investigation",
    input: "text",
    help: "Each sentence becomes a piece of evidence. You mark which ones support which claim.",
  },
  {
    id: "exit-ticket",
    label: "Objective to exit ticket skeleton",
    input: "objective",
    help: "Turn an objective into a task prompt, success criteria and response frames. You write the question.",
  },
  {
    id: "discussion",
    label: "Concept explanation to academic discussion",
    input: "text",
    help: "A partner talk built on your text with roles, listen-fors and frames at every support level.",
  },
  {
    id: "language-objective",
    label: "Lesson objective to language objective ideas",
    input: "objective",
    help: "Language objectives from the language your objective already asks for.",
  },
];

const TIER_SHORT = Object.fromEntries(TIERS.map((t) => [t.id, t.short]));
const MAX_TEXT = 20000;

export const clean = (s) => String(s ?? "").slice(0, MAX_TEXT);

/** The sentence of `text` that contains `word` (exact text), or "". */
function contextFor(sentences, word) {
  const re = new RegExp(
    `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+")}`,
    "i",
  );
  return sentences.find((s) => re.test(s.text))?.text || "";
}

/** Find a studio vocabulary entry for a word across collections. Returns { entry, collectionId } or null. */
export function findEntry(collections, word) {
  const w = String(word).trim().toLowerCase();
  for (const c of collections || []) {
    const entry = (c.entries || []).find((e) => e.word?.toLowerCase() === w || e.id === w);
    if (entry) return { entry, collectionId: c.id };
  }
  return null;
}

export function buildVocabCards(
  text,
  { grade = "", subject = "", collections = [], extraTerms = [], limit = 12 } = {},
) {
  const source = clean(text);
  const sentences = splitSentences(source);
  const a = analyzeLanguage(source, { grade, subject, terms: extraTerms });
  const words = [
    ...extraTerms.map((t) => String(t).trim()).filter(Boolean),
    ...[...a.vocabulary.technical, ...a.vocabulary.academic].map((v) => v.word),
  ];
  const seen = new Set();
  const cards = [];
  for (const word of words) {
    const key = word.toLowerCase();
    if (seen.has(key) || cards.length >= limit) continue;
    seen.add(key);
    const hit = findEntry(collections, word);
    cards.push({
      id: `card-${cards.length + 1}`,
      word,
      def: hit?.entry.def || "",
      defFrom: hit ? hit.collectionId : "",
      visual: hit?.entry.visual || null,
      noVisualReason: hit?.entry.noVisualReason || "",
      es: hit?.entry.es
        ? { word: hit.entry.es.word, verified: hit.entry.es.verified === true }
        : null,
      contextSentence: contextFor(sentences, word),
      confirmed: false,
    });
  }
  return { type: "vocab-cards", source, cards };
}

export const confirmedCards = (draft) => draft.cards.filter((c) => c.confirmed && c.def.trim());

export function buildEvidenceInvestigation(text, { question = "", claims = [] } = {}) {
  const source = clean(text);
  return {
    type: "evidence",
    source,
    question,
    claims: claims.map((c, i) => ({ id: `c${i + 1}`, text: String(c) })),
    evidence: splitSentences(source).map((s, i) => ({
      id: `e${i + 1}`,
      text: s.text,
      start: s.start,
      end: s.end,
      use: false,
      supports: null,
    })),
  };
}

/** What is still missing before an evidence investigation can be sent on. */
export function evidenceProblems(draft) {
  const out = [];
  const used = draft.evidence.filter((e) => e.use);
  if (!draft.claims.some((c) => c.text.trim())) out.push("Add at least one claim.");
  if (!used.length) out.push("Mark at least one sentence as evidence.");
  if (used.some((e) => !e.supports)) out.push("Choose which claim each marked sentence supports.");
  return out;
}

const CRITERIA = {
  compare: [
    "I name both things I am comparing.",
    "I tell one way they are alike and one way they are different.",
    "I use a word from the lesson.",
  ],
  explain: [
    "I say what happens or what the answer is.",
    "I say why, using because or so.",
    "I use a word from the lesson.",
  ],
  justify: [
    "I state my answer or claim clearly.",
    "I give a reason that supports it.",
    "I use evidence, a number or an example.",
  ],
  describe: [
    "I name what I am describing.",
    "I give at least two details.",
    "I use a word from the lesson.",
  ],
  solve: [
    "My answer is correct and complete.",
    "I show the steps I used.",
    "I say what my answer means.",
  ],
  sequence: [
    "I put the steps or events in order.",
    "I use sequence words such as first, next, finally.",
    "I do not skip a step.",
  ],
  summarize: [
    "I say the main idea in one sentence.",
    "I add two key details.",
    "I use my own words.",
  ],
  define: [
    "I say what the word means in my own words.",
    "I give an example.",
    "I use the word in a sentence.",
  ],
};
const fnFor = (text) => {
  const a = analyzeLanguage(text, {});
  return (
    FUNCTIONS.find((f) => f.id === a.functions[0]?.id) || FUNCTIONS.find((f) => f.id === "explain")
  );
};
const stripCan = (s) =>
  String(s)
    .replace(/^\s*(?:i can|students will be able to|swbat)\s+/i, "")
    .trim();

export function buildExitTicket(objective) {
  const source = clean(objective).trim();
  const body = stripCan(source).replace(/\.\s*$/, "");
  const fn = fnFor(source);
  return {
    type: "exit-ticket",
    source,
    objective: source,
    prompt: body ? `${body.charAt(0).toUpperCase()}${body.slice(1)}.` : "",
    criteria: [...(CRITERIA[fn.id] || CRITERIA.explain)],
    frames: Object.fromEntries(Object.keys(TIER_SHORT).map((t) => [t, fn.frames[t][0]])),
    functionLabel: fn.label,
    itemText: "",
  };
}

const STARTERS = {
  ee: ["I agree because ____.", "Can you show me?"],
  dev: ["I agree with ____ because ____.", "Can you say more about ____?"],
  exp: ["I see it differently because ____.", "What evidence supports ____?"],
  br: ["Building on what you said, ____.", "How does that connect to ____?"],
};

export function buildDiscussion(text, { grade = "", subject = "" } = {}) {
  const source = clean(text);
  const a = analyzeLanguage(source, { grade, subject });
  const fn =
    FUNCTIONS.find((f) => f.id === a.functions[0]?.id) || FUNCTIONS.find((f) => f.id === "explain");
  const terms = [...a.vocabulary.technical, ...a.vocabulary.academic].map((v) => v.word);
  const t1 = terms[0] || "the main idea";
  const questions = {
    explain: `Explain how or why ${t1} works the way it does, using the text.`,
    compare:
      terms.length > 1
        ? `Compare ${terms[0]} and ${terms[1]}, using the text.`
        : "Compare two ideas in the text.",
    justify: "Do you agree with the main idea? Give a reason and evidence from the text.",
    describe: `Describe ${t1}, using details from the text.`,
    cite: "Which words in the text best support the main idea? Read them aloud and say why.",
  };
  return {
    type: "discussion",
    source,
    question: questions[fn.id] || questions.explain,
    functionLabel: fn.label,
    structure: fn.discourse,
    roles: [
      "Speaker: answers the question with a reason.",
      "Listener: asks one question using a starter, then the partners switch.",
    ],
    listenFor: terms.slice(0, 5),
    frames: Object.fromEntries(
      Object.keys(TIER_SHORT).map((t) => [t, [...fn.frames[t], ...STARTERS[t]]]),
    ),
  };
}

export function buildLanguageObjectives(objective) {
  const source = clean(objective).trim();
  const a = analyzeLanguage(source, {});
  const fn =
    FUNCTIONS.find((f) => f.id === a.functions[0]?.id) || FUNCTIONS.find((f) => f.id === "explain");
  const suggestions = suggestObjectives(
    a.functions.length ? a : { ...a, functions: [{ id: fn.id }] },
    { contentObjective: source },
  );
  return {
    type: "language-objective",
    source,
    klu: fn.klu,
    suggestions,
    note: "Closest WIDA Key Language Use, approximate. Edit the wording to fit your class.",
  };
}

export function buildDraft(target, text, opts = {}) {
  switch (target) {
    case "vocab-cards":
      return buildVocabCards(text, opts);
    case "evidence":
      return buildEvidenceInvestigation(text, opts);
    case "exit-ticket":
      return buildExitTicket(text);
    case "discussion":
      return buildDiscussion(text, opts);
    case "language-objective":
      return buildLanguageObjectives(text);
    default:
      throw new Error(`Unknown remix target "${target}".`);
  }
}

/** True when the draft still carries the teacher's text exactly (used by tests and before sending on). */
export function textPreserved(source, draft) {
  if (draft.source !== source && draft.source !== clean(source)) return false;
  if (draft.type === "evidence")
    return draft.evidence.every((e) => source.slice(e.start, e.end) === e.text);
  if (draft.type === "vocab-cards")
    return draft.cards.every((c) => !c.contextSentence || source.includes(c.contextSentence));
  return true;
}

/** Plain-text copy of a draft. */
export function draftToText(d) {
  const L = [];
  if (d.type === "vocab-cards") {
    for (const c of d.cards) {
      L.push(
        `${c.word}${c.confirmed ? "" : " (definition not confirmed)"}`,
        `  Meaning: ${c.def || "(to be written)"}`,
      );
      if (c.contextSentence) L.push(`  In the text: ${c.contextSentence}`);
      L.push("");
    }
  } else if (d.type === "evidence") {
    L.push(
      `Question: ${d.question || "(none yet)"}`,
      "Claims:",
      ...d.claims.map((c) => `  ${c.id}: ${c.text}`),
      "Evidence:",
    );
    for (const e of d.evidence.filter((x) => x.use))
      L.push(`  "${e.text}" supports ${e.supports || "(choose a claim)"}`);
  } else if (d.type === "exit-ticket") {
    L.push(
      `Objective: ${d.objective}`,
      `Task: ${d.prompt}`,
      d.itemText ? `Question: ${d.itemText}` : "",
      "Success criteria:",
      ...d.criteria.map((c) => `  - ${c}`),
      "Frames:",
    );
    for (const [t, f] of Object.entries(d.frames)) L.push(`  ${TIER_SHORT[t]}: ${f}`);
  } else if (d.type === "discussion") {
    L.push(
      `Question: ${d.question}`,
      `Structure: ${d.structure}`,
      "Roles:",
      ...d.roles.map((r) => `  - ${r}`),
      `Listen for: ${d.listenFor.join(", ")}`,
      "Frames:",
    );
    for (const [t, f] of Object.entries(d.frames)) L.push(`  ${TIER_SHORT[t]}: ${f.join(" | ")}`);
    L.push("", "Text:", d.source);
  } else if (d.type === "language-objective") {
    L.push(...d.suggestions.map((s) => `- ${s}`), `Closest WIDA Key Language Use: ${d.klu}`);
  }
  return L.join("\n").trim();
}

const HANDOFF = "remix.draft";
/** Stores a draft for the Resource Studio and returns the hash that opens it. */
export function sendToCreate(draft) {
  write(HANDOFF, { at: new Date().toISOString(), draft });
  return `#/create?type=remix-${draft.type}&draft=remix`;
}
export const readHandoff = () => read(HANDOFF, null);
