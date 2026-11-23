// Visual Match: connect school words to pictures. Words are spoken aloud; Spanish toggle appears because every pair is verified. Original content.
const ic = (name, alt) => ({ kind: "icon", name, alt });
const pair = (id, term, visual, why, hints, extra = {}) => ({
  id,
  term,
  visual,
  why,
  hints,
  es: { term: extra.es, verified: true },
  ...extra.rest,
});

export default {
  id: "k-esol-school-words-match",
  engine: "visual-match",
  title: "Match school words to pictures",
  grade: "K",
  band: "k-2",
  subject: "esol",
  lessonId: "k-esol-describe-school-and-people",
  standards: ["ELD-SI", "L.K.5a"],
  vocabIds: ["school", "teacher", "student", "book", "pencil", "backpack", "desk", "bus"],
  minutes: 8,
  intro: "Listen to each word. Tap the word, then tap its picture.",
  modes: ["term-visual"],
  pairs: [
    pair("school", "school", ic("school", "A building with a flag, a door and many windows."), "The picture shows the building where children go to learn.", [
      "Look for a building.",
      "Listen: it is a place where children learn.",
      "It has a door, windows and a flag.",
    ], { es: "escuela" }),
    pair("teacher", "teacher", ic("teacher", "A grown-up standing and smiling, holding a pointer."), "The picture shows the grown-up who helps children learn.", [
      "Look for a grown-up.",
      "Listen: this grown-up helps children learn.",
      "This grown-up is holding a pointer.",
    ], {
      es: "maestro",
      rest: { confusions: [{ pick: "student", tag: "adult-or-child", hint: "That word is for a child. Look for the grown-up who helps children learn." }] },
    }),
    pair("student", "student", ic("student", "A child with a backpack, smiling."), "The picture shows a child who goes to school to learn.", [
      "Look for a child.",
      "Listen: this person is learning.",
      "This child is wearing a backpack.",
    ], { es: "estudiante" }),
    pair("book", "book", ic("book", "An open book with two pages."), "The picture shows pages with words that we read.", [
      "Look for something you read.",
      "Listen: it has pages.",
      "It is open, with two pages side by side.",
    ], { es: "libro" }),
    pair("pencil", "pencil", ic("pencil", "A long thin yellow pencil."), "The picture shows a thin tool we use to write.", [
      "Look for something thin and long.",
      "Listen: we hold it to write.",
      "It has a sharp point at one end.",
    ], { es: "lápiz" }),
    pair("backpack", "backpack", ic("backpack", "A bag with two straps and a pocket."), "The picture shows a bag you wear on your back.", [
      "Look for a bag.",
      "Listen: you carry it on your back.",
      "It has two straps and a pocket.",
    ], { es: "mochila" }),
    pair("desk", "desk", ic("desk", "A school desk with a flat top and a seat."), "The picture shows a table where a student sits to write.", [
      "Look for something to sit at.",
      "Listen: a student writes on top of it.",
      "It has a flat top and a seat.",
    ], { es: "pupitre" }),
    pair("bus", "bus", ic("bus", "A long yellow vehicle with many windows."), "The picture shows a big vehicle that takes children to school.", [
      "Look for something with wheels.",
      "Listen: it carries many children.",
      "It is long, yellow and has many windows.",
    ], { es: "autobús" }),
  ],
  distractors: [
    { id: "d-chair", term: "chair", tag: "similar-object", hint: "That word is for something you sit on only. Look for the one where a student writes." },
    { id: "d-friend", term: "friend", tag: "person-confusion", hint: "That word is for someone who plays with you. Look for the grown-up who helps children learn." },
  ],
  supports: {
    ee: { frames: ["This is a ___."], wordBank: ["school", "teacher", "student", "book"], directions: "Listen to the word. Tap it. Then tap the picture that matches." },
    dev: { frames: ["This is a ___. I use it to ___."] },
    exp: { frames: ["The picture shows a ___ because ___."] },
    br: {},
  },
  reflection: {
    prompt: "Tell about one word you matched.",
    frames: {
      ee: ["I matched ___.", "This is a ___."],
      dev: ["I matched ___ because I saw ___.", "A clue was ___."],
      exp: ["I matched ___ to the picture because ___."],
      br: ["I matched ___ because the picture showed ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
