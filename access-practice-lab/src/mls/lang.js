// Math Literacy Studio: language support. WIDA-informed, never a measurement: a teacher picks a support band for a
// resource; the studio never assigns a band to a student and never states a proficiency level for a person.
// The mathematics is identical in every band (the same Problem spec and numbers); only the words around it change.

/** The three support bands (Levels 1-2, 3-4, 5-6), described by what the page gives the learner. */
export const BANDS = {
  "1-2": {
    id: "1-2",
    short: "More language support",
    label: { en: "Beginning language support (Levels 1-2)", es: "Apoyo de lenguaje inicial (niveles 1-2)" },
    text: "plain",
    gives: ["Short, concrete sentences", "A picture beside each idea", "A word bank with every word needed", "Sentence kernels to complete", "Matching and sequencing before writing", "Oral rehearsal with a partner first", "Home-language support welcome"],
    frames: "kernel",
    wordBank: "full",
    oral: true,
  },
  "3-4": {
    id: "3-4",
    short: "Some language support",
    label: { en: "Developing language support (Levels 3-4)", es: "Apoyo de lenguaje en desarrollo (niveles 3-4)" },
    text: "standard",
    gives: ["Expanded sentence frames", "Transition words (first, then, because, so, but)", "Guided comparisons", "Partial representations to finish", "Partner discussion before writing"],
    frames: "expanded",
    wordBank: "terms",
    oral: true,
  },
  "5-6": {
    id: "5-6",
    short: "Little language support",
    label: { en: "Expanding to advanced language support (Levels 5-6)", es: "Apoyo de lenguaje en expansión y avanzado (niveles 5-6)" },
    text: "rich",
    gives: ["Extended explanations in the student's own words", "Precise academic language", "Counterexamples and critique of reasoning", "Independent revision with a checklist"],
    frames: "starter",
    wordBank: "none",
    oral: false,
  },
};
export const BAND_IDS = Object.keys(BANDS);
/** A language level 1-6 (or a band id) to a band id. */
export const bandOf = (v) => (typeof v === "string" && BANDS[v] ? v : Number(v) <= 2 ? "1-2" : Number(v) <= 4 ? "3-4" : "5-6");
/** Which of a Problem's three texts a band uses. */
export const textLevelOf = (band) => BANDS[bandOf(band)].text;

/** Support presets. They set dials; every dial can then be changed on its own (math and language are independent). */
export const PRESETS = {
  more: { id: "more", label: "More support", math: 2, band: "1-2", visuals: "more", writing: "frames", independence: "guided", count: 6, note: "Simpler wording, pictures, a word bank and a first step. The mathematics stays at grade level." },
  standard: { id: "standard", label: "Standard", math: 2, band: "3-4", visuals: "standard", writing: "frames", independence: "partial", count: 8, note: "Grade-level wording with sentence frames." },
  extension: { id: "extension", label: "Extension", math: 3, band: "5-6", visuals: "standard", writing: "starter", independence: "independent", count: 8, note: "Larger numbers or one more step, precise language and reasoning prompts." },
};
export const INDEPENDENCE = [
  { id: "model", label: "Model", text: "The teacher or page shows a complete worked example, then the student tries one." },
  { id: "guided", label: "Guided participation", text: "The first step is shown and a hint is ready; the student finishes." },
  { id: "partial", label: "Partial support", text: "Sentence frames and a word bank only." },
  { id: "independent", label: "Independent application", text: "No scaffolds on the page." },
  { id: "transfer", label: "Transfer to a new context", text: "A new setting, no scaffolds." },
];

/**
 * Sentence frames by Key Language Use and band. `{A}` and `{B}` are blanks the student fills; `{term}` is replaced with a skill term.
 * Frames never contain the mathematics of a particular problem, so they cannot give an answer away.
 */
export const FRAMES = {
  Explain: {
    "1-2": ["I see ___.", "___ is more than ___.", "I did ___ first.", "The answer is ___."],
    "3-4": ["I know ___ because ___.", "First I ___. Then I ___.", "___ and ___ are alike because ___.", "I used ___ to show ___."],
    "5-6": ["I can show that ___ because ___.", "This works because ___, so ___.", "Instead of ___, I ___ since ___."],
  },
  Inform: {
    "1-2": ["This is a ___.", "A {term} is ___.", "I can use ___ to ___."],
    "3-4": ["A {term} is ___. For example, ___.", "The ___ tells us ___.", "You can find ___ by ___."],
    "5-6": ["The {term} is ___; it is different from ___ because ___.", "In this situation, ___ represents ___."],
  },
  Argue: {
    "1-2": ["I think ___.", "I agree because ___.", "I do not agree because ___."],
    "3-4": ["I agree with ___ because ___.", "I disagree because ___. A better way is ___.", "My evidence is ___."],
    "5-6": ["I claim that ___. The evidence is ___, which shows ___.", "A counterexample is ___, so the claim is ___.", "I disagree with ___ because ___; instead, ___."],
  },
  Narrate: {
    "1-2": ["First ___. Then ___.", "At the start there were ___.", "Now there are ___."],
    "3-4": ["At first ___. After that ___. In the end ___.", "The problem asks ___. I started by ___."],
    "5-6": ["The situation begins with ___. As ___ changes, ___. This means ___."],
  },
};
/** Frames for a skill: its Key Language Uses first, filled with its vocabulary. */
export function framesFor(skill, band, n = 4) {
  const b = bandOf(band);
  const terms = (skill.vocab || []).map((v) => v.term);
  const uses = skill.keyLanguageUses?.length ? skill.keyLanguageUses : ["Explain"];
  const out = [];
  for (const u of uses) for (const f of FRAMES[u]?.[b] || []) out.push(f.replace("{term}", terms[out.length % Math.max(1, terms.length)] || "term"));
  return out.slice(0, n);
}

/** Conversation stems by band for Math Talk Studio. */
export const TALK_STEMS = {
  "1-2": { explain: ["I see ___.", "I counted ___."], respond: ["I agree.", "I do not agree.", "Tell me more."], question: ["How did you ___?", "What is ___?"] },
  "3-4": { explain: ["First I ___ because ___.", "I solved it by ___."], respond: ["I agree because ___.", "I did it a different way: ___.", "Can you say that again?"], question: ["Why did you ___?", "How do you know ___?"] },
  "5-6": { explain: ["My strategy was to ___ since ___.", "I can justify this by ___."], respond: ["I would challenge that because ___.", "Your reasoning works when ___, but not when ___."], question: ["What would happen if ___?", "How could you show that ___ always ___?"] },
};

/** Words a learner may need beyond the skill's own terms, by band (function and academic words). */
const FUNCTION_WORDS = { "1-2": ["is", "are", "more", "fewer", "same", "different", "and", "I see"], "3-4": ["because", "so", "but", "first", "then", "next", "different", "same", "compare"], "5-6": ["therefore", "however", "since", "justify", "represent", "compare", "evidence", "relationship", "equivalent to"] };
export function wordBank(skill, band) {
  const b = BANDS[bandOf(band)];
  if (b.wordBank === "none") return [];
  const terms = (skill.vocab || []).map((v) => v.term);
  return b.wordBank === "full" ? [...terms, ...FUNCTION_WORDS[bandOf(band)]] : [...terms, ...FUNCTION_WORDS[bandOf(band)].slice(0, 4)];
}

/** The scaffold-fading path (Model, Guided, Partial, Independent, Transfer) as steps a teacher can run in order. */
export function fadingPath(skill) {
  const t = skill.vocab?.[0]?.term || "the key idea";
  return [
    { id: "model", step: "Model", teacher: `Think aloud through a complete example. Name each quantity and ${t}.`, student: "Listen, point and repeat key phrases." },
    { id: "guided", step: "Guided participation", teacher: "Do the first step together; students finish with a partner.", student: "Complete the frame with a partner, then share." },
    { id: "partial", step: "Partial support", teacher: "Give a word bank and one frame only.", student: "Solve and explain with the word bank." },
    { id: "independent", step: "Independent application", teacher: "Remove the frames. Offer them only on request.", student: "Solve and explain without support." },
    { id: "transfer", step: "Transfer", teacher: "Change the context and the wording; keep the relationship.", student: "Recognise the same structure in a new situation and explain." },
  ];
}

/**
 * Sentence Studio: the Because / But / So operations. These check shape and vocabulary only (does the sentence use the connective,
 * a target term, and enough words?). They never judge grammar or the mathematics: the teacher reviews the student's words.
 */
export const CONNECTIVES = { because: /\bbecause\b/i, but: /\bbut\b/i, so: /\bso\b/i };
export function checkSentence(text, { kind = "because", targets = [], minWords = 6 } = {}) {
  const t = String(text || "").trim();
  const words = t ? t.split(/\s+/).length : 0;
  const notes = [];
  if (!words) return { ok: false, notes: ["Write a sentence first."] };
  if (kind in CONNECTIVES && !CONNECTIVES[kind].test(t)) notes.push(`Use the word "${kind}" in your sentence.`);
  if (words < minWords) notes.push(`Add more detail: aim for at least ${minWords} words.`);
  const used = targets.filter((x) => t.toLowerCase().includes(String(x).toLowerCase().split(" ")[0]));
  if (targets.length && !used.length) notes.push(`Try to use one of these words: ${targets.join(", ")}.`);
  if (!/[.!?]$/.test(t)) notes.push("End your sentence with a period.");
  return { ok: !notes.length, notes, used };
}
/** The studio's three expansions of a base sentence, with scaffolding that fades by band. */
export function sentenceSteps(skill, band) {
  const s = skill.sentence || {};
  const b = bandOf(band);
  const stem = (kind) => (b === "1-2" ? { because: "___ because ___.", but: "___, but ___.", so: "___, so ___." }[kind] : b === "3-4" ? { because: `${s.base?.replace(/\.$/, "")} because ___.`, but: "It looks like ___, but ___.", so: "___, so ___." }[kind] : "");
  return [
    { kind: "because", prompt: "Say why. Use the word because.", frame: stem("because"), model: s.because },
    { kind: "but", prompt: "Show a difference or a surprise. Use the word but.", frame: stem("but"), model: s.but },
    { kind: "so", prompt: "Say what follows. Use the word so.", frame: stem("so"), model: s.so },
  ].map((x) => ({ ...x, targets: s.targets || [] }));
}

/** Plain-language labels for the four Key Language Uses. */
export const KLU = { Narrate: "Tell what happens", Inform: "Describe and define", Explain: "Explain how and why", Argue: "Defend a claim with evidence" };

/** The disclosure shown wherever Spanish family text appears. */
export const SPANISH_NOTE = "Spanish text is a draft written to the studio's style rules. A native speaker has not reviewed it yet.";
