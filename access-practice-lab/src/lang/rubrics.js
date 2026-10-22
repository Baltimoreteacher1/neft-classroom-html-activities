// Practice rubrics for speaking and writing. They are modeled on the three criteria long used in WIDA's
// Speaking and Writing scoring rubrics (Linguistic Complexity, Vocabulary Usage, Language Control) and on the
// WIDA ELD language dimensions (Discourse, Sentence, Word/Phrase). WIDA revises its rubrics (the Writing rubric
// changed for 2025-26), so these descriptors are this lab's own plain-language practice anchors, NOT WIDA's
// rubrics. They produce no WIDA score or proficiency level. Teachers who score for reporting must use WIDA's
// current rubrics and training. Practice bands are named early / building / strong so they are never mistaken
// for WIDA's six proficiency levels.
export const PRACTICE_BANDS = [
  { id: "early", label: "Early", short: "Getting started" },
  { id: "building", label: "Building", short: "Connecting ideas" },
  { id: "strong", label: "Strong", short: "Developed and precise" },
];

export const CRITERIA = [
  {
    id: "lc",
    name: "Linguistic Complexity",
    dimension: "Discourse",
    question: { speaking: "How well did I organize, connect and develop my ideas?", writing: "How well did I organize, connect and develop my ideas?" },
    student: {
      early: "I used words, phrases or short sentences. My ideas are mostly separate.",
      building: "I connected some ideas with words like and, but, because, then. I gave a few details.",
      strong: "My ideas are in a clear order. I used a variety of sentences and linking words, and I developed my ideas with details or evidence.",
    },
    teacher: {
      lookFor: ["Order and focus across the whole response", "Range of sentence types (simple, compound, complex)", "Linking devices that do different jobs (cause, contrast, sequence)", "Development: detail, example or evidence for each main idea"],
    },
  },
  {
    id: "vu",
    name: "Vocabulary Usage",
    dimension: "Word/Phrase",
    question: { speaking: "How precisely did I choose words for this topic?", writing: "How precisely did I choose words for this topic?" },
    student: {
      early: "I used everyday words and some words from the task.",
      building: "I used some subject words and tried more exact words than everyday ones.",
      strong: "I used precise subject words and phrases, including words from the source, and I chose them to fit my meaning.",
    },
    teacher: {
      lookFor: ["Subject-area (Tier 3) and general academic (Tier 2) words used accurately", "Precision: specific words rather than thing/stuff/good/bad", "Word forms (noun/verb/adjective) and word parts", "Phrases and collocations that sound natural for the topic"],
    },
  },
  {
    id: "lctl",
    name: "Language Control",
    dimension: "Sentence",
    question: { speaking: "How clear was my English for a listener?", writing: "How clear was my writing for a reader?" },
    student: {
      early: "A listener or reader can get my main idea, but errors sometimes make it hard to follow.",
      building: "Most of what I wrote or said is clear. Some patterns still slip (for example verb endings or small words).",
      strong: "My language is clear almost everywhere. Errors are few and do not get in the way of my meaning.",
    },
    teacher: {
      lookFor: ["Whether errors interfere with meaning or only with polish", "Patterns that repeat (verb forms, plurals, articles, prepositions)", "Sentence boundaries and punctuation (writing) or fluency and self-repair (speaking)", "Control when the sentence is more complex, not only when it is simple"],
    },
  },
];

export const DISCLAIMER =
  "Practice bands help you see your next step. They are not WIDA proficiency levels or ACCESS scores. Official ACCESS Speaking and Writing are scored by trained raters using WIDA's current rubrics.";

export function emptyReview() {
  return { lc: "", vu: "", lctl: "", note: "" };
}
export const reviewComplete = (r) => CRITERIA.every((c) => r?.[c.id]);
