// Math Literacy Studio: the learner-support navigator. A teacher picks a concern in ordinary language; the studio answers with what to
// observe, which barriers to investigate, a short diagnostic task, resources that really exist for the chosen skill, scaffolds, a short
// sequence, a follow-up and the evidence that says what to teach next. It separates mathematical understanding from linguistic access.
// These are teaching observations. They are not medical, disability, psychological or language-proficiency diagnoses.
import { TYPE_LABEL } from "./roles.js";

export const NOT_A_DIAGNOSIS = "These are teaching observations to guide instruction. They are not a medical, disability, psychological or language-proficiency diagnosis, and the studio does not label students.";

const R = (type, why, variant = "", opts = {}) => ({ type, variant, why, opts });
export const CONCERNS = {
  "wp-struggle": {
    title: "Understands the mathematics but struggles with word problems",
    notice: "The student calculates correctly with bare numbers but stalls, guesses an operation or answers a different question when the same mathematics is in words.",
    barriers: ["Reading the situation: unfamiliar words or sentence structure", "Not naming what is unknown", "Guessing an operation from one word instead of from what is happening", "Unfamiliar context or culture-specific setting"],
    diagnostic: (s) => `Give the same problem two ways: as a bare expression and as a short story in plain words. If the bare version is solved and the story is not, the barrier is reading, not the mathematics. Then ask: "What is happening? What do you know? What do you need to find?" Skill: ${s.title}.`,
    resources: [R("organizer", "Take the situation apart before solving.", "anatomy"), R("word-problems", "Practice with a read, picture, plan routine and plain wording."), R("reading-passage", "Read a mathematical situation in a simplified version first.")],
    scaffolds: ["Language support: more (plain wording, a word bank, a picture)", "Independence: guided (the first step shown)", "Keep the mathematics at grade level"],
    sequence: "routine10",
    followUp: "Repeat with the standard wording and one fewer scaffold.",
    evidence: "The student can say what is happening, what is known and what is unknown before computing, with the same accuracy in the story and the bare version.",
    engine: "anatomy",
  },
  "cant-explain": {
    title: "Can calculate but cannot explain the strategy",
    notice: "Answers are right but explanations are missing, repeat the steps without a reason, or avoid the mathematical words.",
    barriers: ["No sentence frames or models of a good explanation", "Missing vocabulary for the strategy", "Does not know what counts as an explanation", "Procedure learned without the idea behind it"],
    diagnostic: (s) => `Ask the student to solve one problem and say it to a partner using "First... because...". If the student can show it with a picture or model but cannot say it, the barrier is language. If neither, the idea is not yet built. Skill: ${s.title}.`,
    resources: [R("writing-task", "Because, but and so sentences, then an explanation."), R("speaking-task", "Rehearse the explanation aloud with stems."), R("error-analysis", "Explaining someone else's mistake is easier than explaining your own.")],
    scaffolds: ["Language support: some or more (expanded frames)", "Independence: partial (frames and a word bank only)", "Accept a labelled drawing as a first explanation"],
    sequence: "smallgroup15",
    followUp: "Ask for the same explanation with one frame removed, then in the student's own words.",
    evidence: "The student gives a reason that uses a mathematical term and a number or model from the problem.",
    engine: "sentence-studio",
  },
  graphs: {
    title: "Struggles to interpret graphs",
    notice: "The student misreads scales, mixes up axes, reads the wrong bar or point, or cannot say what the graph shows.",
    barriers: ["Axis and scale vocabulary", "Reading the title and labels", "Counting by the scale instead of by ones", "Not connecting a point to its two values"],
    diagnostic: (s) => `Show one graph from this skill and ask three questions of rising demand: Which is the greatest? How many does this one show? What does the whole graph tell us? Note where the student stops. Skill: ${s.title}.`,
    resources: [R("task-cards", "Graph questions with the picture beside each one."), R("vocab-practice", "Words for axis, scale, label and title."), R("organizer", "Take the situation apart: what is happening, known, unknown.", "anatomy")],
    scaffolds: ["Visual support: more (picture reference at the top)", "Language support: more or some", "Point to each part of the graph while naming it"],
    sequence: "warmup5",
    followUp: "Give a new graph with the same structure and fewer prompts.",
    evidence: "The student reads a value by following the scale, then says what it means in the situation.",
    engine: "translator",
  },
  "vocab-confusion": {
    title: "Confuses mathematical vocabulary",
    notice: "The student mixes up terms (factor and multiple, numerator and denominator), uses an everyday meaning, or avoids the word.",
    barriers: ["Everyday meaning competes with the math meaning", "Terms learned in isolation, not in use", "Similar-sounding terms", "Cognates not yet noticed"],
    diagnostic: (s) => `Show the picture for two related terms and ask the student to match the term, then use it in a sentence. Confusion between a term and its everyday meaning points to a vocabulary barrier. Skill: ${s.title}.`,
    resources: [R("vocab-cards", "Pictures, examples and non-examples."), R("vocab-practice", "Everyday meaning compared with math meaning.", "multiple-meaning"), R("poster", "Word wall pages to keep the words in view.")],
    scaffolds: ["Language support: more (home-language connections welcome)", "Visual support: more", "Teach two or three words at a time"],
    sequence: "warmup5",
    followUp: "Use the words in a because sentence and a partner explanation.",
    evidence: "The student uses the term correctly in a new sentence and can give an example and a non-example.",
    engine: "vocab-explorer",
  },
  "oral-directions": {
    title: "Has difficulty following oral mathematical directions",
    notice: "The student does not act on spoken multi-step directions or describes a different task than the one given.",
    barriers: ["Working memory for several steps", "Listening vocabulary", "Speed and accent of the speaker", "No way to review the words"],
    diagnostic: (s) => `Give a two-step direction aloud once and ask the student to build or draw it. Give it again with a picture. Compare. Skill: ${s.title}.`,
    resources: [R("listening-task", "Listen, answer and read the transcript."), R("speaking-task", "Say directions back in your own words."), R("guided-notes", "Write the steps while listening.")],
    scaffolds: ["Break directions into one step at a time", "Show the picture while speaking", "Always offer the transcript"],
    sequence: "routine10",
    followUp: "Repeat with two steps spoken at normal pace and no picture.",
    evidence: "The student restates the directions and acts on all of them.",
    engine: "listening-lab",
  },
  "imprecise-language": {
    title: "Uses imprecise mathematical language",
    notice: "The student says 'this one' and 'the top number', or describes without naming quantities and relationships.",
    barriers: ["Precise terms not yet available", "No routine for naming quantities", "Everyday words feel safer"],
    diagnostic: (s) => `Ask the student to describe one picture from this skill so that a partner can draw it without looking. Note which words were vague. Skill: ${s.title}.`,
    resources: [R("writing-task", "Replace vague words with precise ones."), R("discussion-cards", "Compare two ways of saying it."), R("vocab-practice", "Use the terms in context.")],
    scaffolds: ["Word bank with the precise terms", "Sentence frames that name the quantities", "Revise one vague sentence at a time"],
    sequence: "smallgroup15",
    followUp: "Ask for a second, more precise version of the same sentence.",
    evidence: "The student names each quantity with its unit and uses the term from the lesson.",
    engine: "sentence-studio",
  },
  relationships: {
    title: "Struggles to identify relationships between quantities",
    notice: "The student adds or multiplies without saying how the quantities are connected, or cannot say which quantity depends on which.",
    barriers: ["Seeing each quantity as a number rather than a measure", "Additive thinking applied to multiplicative situations", "No model (table, tape, double number line) to show the connection"],
    diagnostic: (s) => `Give a situation with two quantities and ask: "If one changes, what happens to the other? How do you know?" Ask for a model. Skill: ${s.title}.`,
    resources: [R("organizer", "How are the quantities related?", "anatomy"), R("notebook", "Draw the relationship and say it."), R("error-analysis", "See what happens when the relationship is ignored.")],
    scaffolds: ["Model first (worked example)", "Language support: some", "Use the transfer lab to see the same relationship in different words"],
    sequence: "smallgroup15",
    followUp: "Change the context but keep the relationship; ask what stays the same.",
    evidence: "The student states the relationship in a full sentence and shows it in a model.",
    engine: "transfer-lab",
  },
  representations: {
    title: "Has difficulty transferring between representations",
    notice: "The student can work in one form (equation) but not match it to a picture, table, graph or story.",
    barriers: ["Each representation taught as a separate skill", "Labels and units not connected", "No language for moving between forms"],
    diagnostic: (s) => `Show one situation as a picture and give three descriptions (one correct). Ask which matches and why. Skill: ${s.title}.`,
    resources: [R("task-cards", "Match and explain across forms."), R("guided-notes", "Show one idea in several forms side by side."), R("game-sheet", "Match cards that explain why.")],
    scaffolds: ["Colour is never the only cue: label every form", "Start with two representations, then add a third", "Language support: some"],
    sequence: "smallgroup15",
    followUp: "Ask the student to create the missing representation.",
    evidence: "The student matches representations and explains which feature of each shows the same quantity.",
    engine: "translator",
  },
  prereq: {
    title: "Needs additional prerequisite practice",
    notice: "Errors trace back to an earlier skill (for example, multiplication facts in a ratio problem).",
    barriers: ["Earlier skill not secure", "Fluency gaps that use up attention", "Earlier vocabulary missing"],
    diagnostic: (s) => `Give 3 problems from the prerequisite skill. If they are accurate, return to ${s.title}; if not, practice the earlier skill first and keep the grade-level mathematics in the lesson.`,
    resources: [R("intervention-packet", "Diagnostic, prerequisite check and step-by-step practice."), R("organizer", "Checklist of skills this one builds on.", "prereqs"), R("worksheet", "Short guided practice on the earlier skill.", "guided")],
    scaffolds: ["Teach the prerequisite alongside the grade-level work, not instead of it", "Independence: guided", "Keep the language support separate from the mathematics level"],
    sequence: "intervention20",
    followUp: "Return to the grade-level skill and repeat one of its problems.",
    evidence: "Accuracy on the prerequisite problems, then on a new grade-level problem.",
    engine: null,
  },
  challenge: {
    title: "Needs more challenging mathematical reasoning",
    notice: "The student finishes quickly and correctly, and is ready to justify, generalize or find counterexamples.",
    barriers: ["Tasks end at the answer", "No audience for the reasoning", "Extension treated as more of the same"],
    diagnostic: (s) => `Ask: "Is this always true?" about a claim from this skill and require a counterexample or a proof in words. Skill: ${s.title}.`,
    resources: [R("task-cards", "Extension tasks with a reasoning prompt.", "extension"), R("discussion-cards", "Debate and always, sometimes, never."), R("collab-activity", "Investigate with a group and present.")],
    scaffolds: ["Language support: little (precise language, counterexamples)", "Mathematics level: extension", "Independence: independent"],
    sequence: "routine10",
    followUp: "Ask the student to write a claim for a classmate to test.",
    evidence: "A claim, evidence from the mathematics and a counterexample or generalization.",
    engine: "error-detective",
  },
};
export const CONCERN_IDS = Object.keys(CONCERNS);

/** The full support plan for one concern and one skill. Every resource is a recipe the studio can build for that skill. */
export function navFor(concernId, skill) {
  const c = CONCERNS[concernId];
  if (!c) return null;
  return {
    id: concernId,
    title: c.title,
    notice: c.notice,
    barriers: c.barriers,
    diagnostic: c.diagnostic(skill),
    diagnosticTask: skill.diagnostic,
    resources: c.resources.map((r) => ({ ...r, label: `${TYPE_LABEL[r.type]}${r.variant ? ` (${r.variant})` : ""}`, skillId: skill.id })),
    scaffolds: c.scaffolds,
    sequence: c.sequence,
    followUp: c.followUp,
    evidence: c.evidence,
    engine: c.engine,
    note: NOT_A_DIAGNOSIS,
  };
}
