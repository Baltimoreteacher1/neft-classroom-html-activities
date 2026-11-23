// Visual Match (grade 2 ELA): connect the words of main idea and informational text to pictures, definitions and example sentences.
// Pictures come from the vocabulary collection so each diagram has one source.
import vocab from "../vocab/g2-ela-main-idea-informational-text.js";

const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const V = (id) => vocab.entries.find((e) => e.id === id).visual;

const pairs = [
  {
    id: "topic",
    term: "topic",
    forms: ["topics"],
    visual: V("topic"),
    definition: "The one thing a whole text is about, named in a word or two.",
    example: "The topic of the text is honey bees.",
    why: "The topic is only the name of what the whole text is about, such as bees.",
    hints: [
      "Think about the shortest answer to the question: what is this text about?",
      "This word is a name, not a whole sentence.",
      "It is one or two words, like the name on the cover of a book about one animal.",
    ],
    confusions: [
      {
        pick: "main-idea",
        tag: "topic-vs-main-idea",
        hint: "That one is a whole idea in a sentence. This card is only one or two words that name the subject.",
        model: "The topic names the subject. The main idea says something about it.",
      },
    ],
    transfer: {
      prompt: "Which one is a topic?",
      options: [
        { id: "a", text: "Earthworms" },
        { id: "b", text: "Earthworms help soil and plants." },
      ],
      answer: "a",
      explain: "Earthworms is one word that names the subject. The other choice is a whole idea.",
    },
  },
  {
    id: "main-idea",
    term: "main idea",
    visual: V("main-idea"),
    definition: "The most important thing the author wants you to know about the topic.",
    example: "The main idea tells what the whole text is mostly about.",
    why: "The main idea is the big idea that every small piece of the text explains.",
    hints: [
      "Look for the biggest box in the picture. The small boxes hold it up.",
      "This is the idea that covers every paragraph, not just one.",
      "It is a whole sentence-sized idea, and all the small facts explain it.",
    ],
    confusions: [
      {
        pick: "detail",
        tag: "detail-for-big-idea",
        hint: "That one is a small piece. This card shows the big idea that all the little pieces hold up.",
        model: "A detail is small. The main idea is what all the details add up to.",
      },
      {
        pick: "topic",
        tag: "topic-vs-main-idea",
        hint: "That one only names the subject. This card shows what the text says about the subject.",
      },
    ],
  },
  {
    id: "detail",
    term: "detail",
    forms: ["details"],
    visual: V("detail"),
    definition: "A small fact that tells more about the big idea.",
    example: "Each detail gives one more fact about the main idea.",
    why: "A detail is one small fact that helps explain the big idea.",
    hints: [
      "Look at the small box with an arrow pointing up to a bigger one.",
      "This is a small piece, not the big idea.",
      "It is one fact that helps hold up the biggest idea.",
    ],
    confusions: [
      {
        pick: "main-idea",
        tag: "big-idea-for-small-piece",
        hint: "That one is the big idea. This card shows one small piece that holds it up.",
        model: "The main idea is big. A detail is one small fact that explains it.",
      },
    ],
    transfer: {
      prompt: "Which one is a detail?",
      options: [
        { id: "a", text: "Some bees clean the hive." },
        { id: "b", text: "Bees have jobs." },
      ],
      answer: "a",
      explain:
        "Cleaning the hive is one small fact. Bees have jobs is the bigger idea it supports.",
    },
  },
  {
    id: "paragraph",
    term: "paragraph",
    forms: ["paragraphs"],
    visual: V("paragraph"),
    definition: "A group of sentences that tells about one part of a text.",
    example: "Each paragraph in the text has its own focus.",
    why: "A group of sentences about one part of a text is a paragraph.",
    hints: [
      "Look at the highlighted block of lines on the page.",
      "It has several sentences that go together.",
      "It is a whole block of print, not one short name above it.",
    ],
    confusions: [
      {
        pick: "heading",
        tag: "heading-vs-block",
        hint: "That one is a short name above a part. This card shows the whole group of sentences.",
      },
    ],
  },
  {
    id: "heading",
    term: "heading",
    visual: V("heading"),
    definition: "A short name above one part of a text that tells what the part is about.",
    example: "The heading above the paragraph says A Bee Home.",
    why: "A short name above one part of a text that says what the part is about is a heading.",
    hints: [
      "Look at the bold words at the top of the page.",
      "It sits above the lines of print, like a label on a drawer.",
      "It is short and tells what the part below is about.",
    ],
    confusions: [
      {
        pick: "paragraph",
        tag: "block-vs-heading",
        hint: "That one is the group of sentences. This card shows the short name above them.",
      },
      {
        pick: "caption",
        tag: "caption-vs-heading",
        hint: "That one belongs under a picture. This card shows the name above a part of the text.",
      },
    ],
  },
  {
    id: "caption",
    term: "caption",
    visual: V("caption"),
    definition: "A line of words under a picture that tells about it.",
    example: "The caption under the photo says A bee drinks nectar.",
    why: "A line of words under a picture that explains it is a caption.",
    hints: [
      "Look for the line of words that goes with the picture.",
      "It sits under the picture, not above a part of the text.",
      "It tells you what the picture shows.",
    ],
    confusions: [
      {
        pick: "heading",
        tag: "heading-vs-caption",
        hint: "That one goes above a part of the text. This card shows words under a picture.",
      },
    ],
  },
  {
    id: "fact",
    term: "fact",
    forms: ["facts"],
    visual: V("fact"),
    definition: "Something that is true and that you can check.",
    example: "That a bee has six legs is a fact because you can count them.",
    why: "A fact is true and can be checked, like counting the legs on a bee.",
    hints: [
      "Look at the sentence with the check mark.",
      "You could count or look to see if it is true.",
      "It is not what someone thinks. It is something you can prove.",
    ],
    confusions: [
      {
        pick: "detail",
        tag: "detail-vs-fact",
        hint: "That one is a small piece of a text. This card is about whether something is true.",
        model: "A detail can be a fact, but this card is about being true and checkable.",
      },
    ],
  },
  {
    id: "summarize",
    term: "summarize",
    forms: ["summarizing", "summarized", "summarizes"],
    visual: V("summarize"),
    definition: "To tell the big ideas of a text in just a few words.",
    example: "Summarize the text in two short sentences.",
    why: "To tell the big ideas of a long text in a few words is to summarize.",
    hints: [
      "Look at the long bar and the short bar.",
      "This is an action: you make something long into something short.",
      "You keep only the big ideas and leave out most of the small facts.",
    ],
    confusions: [
      {
        pick: "main-idea",
        tag: "idea-vs-action",
        hint: "That one is a single big idea. This card is the action of shrinking a whole text to a few words.",
      },
    ],
  },
];

export default {
  id: "g2-ela-main-idea-word-match",
  engine: "visual-match",
  title: "Match the words for main idea and details",
  grade: "2",
  band: "k-2",
  subject: "ela",
  lessonId: "g2-ela-main-idea-informational-text",
  standards: ["RI.2.2"],
  vocabIds: [
    "g2-ela-main-idea-informational-text:topic",
    "g2-ela-main-idea-informational-text:main-idea",
    "g2-ela-main-idea-informational-text:detail",
    "g2-ela-main-idea-informational-text:paragraph",
    "g2-ela-main-idea-informational-text:heading",
    "g2-ela-main-idea-informational-text:caption",
    "g2-ela-main-idea-informational-text:fact",
    "g2-ela-main-idea-informational-text:summarize",
  ],
  minutes: 12,
  intro:
    "Match each word to its picture, its meaning and its sentence. These are the words we use to talk about what a text says.",
  modes: ["term-visual", "term-definition", "term-example"],
  pairs,
  distractors: [
    {
      id: "d-opinion",
      term: "opinion",
      tag: "fact-vs-opinion",
      hint: "That word names what someone thinks. Check the card: can it be proved?",
    },
    {
      id: "d-title",
      term: "title",
      tag: "title-vs-heading",
      hint: "That word names the whole book or text. Check the card: is it for the whole text or one part?",
    },
  ],
  supports: {
    ee: {
      frames: ["___ is a picture of a ___.", "This word means ___."],
      oral: "Say the word. Look at the picture. Does it match?",
      directions: "Tap a word, then tap the card it belongs to.",
    },
    dev: {
      frames: ["I matched ___ because ___.", "The picture shows ___."],
      wordBank: ["big idea", "small piece", "group of sentences"],
    },
    exp: { frames: ["___ matches this card because it means ___."] },
    br: {},
  },
  reflection: {
    prompt: "Tell a partner how a main idea is different from a detail.",
    frames: fr(
      ["The main idea is big.", "A detail is small."],
      ["The main idea is ___.", "A detail is ___."],
      [
        "A main idea is different from a detail because the main idea covers ___ and a detail covers ___.",
      ],
      ["The main idea is the big idea that all of the details support."],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
