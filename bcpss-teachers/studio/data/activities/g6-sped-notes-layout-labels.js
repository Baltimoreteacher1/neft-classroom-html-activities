// Concept Builder (label-diagram): label a notes page, then place ideas from an article into a graphic organizer. Original content.
const rect = (x, y, w, h, fill, o = {}) => ({ t: "rect", x, y, w, h, fill, stroke: "ink", sw: 3, rx: 8, ...o });
const line = (x1, y1, x2, y2) => ({ t: "line", x1, y1, x2, y2, stroke: "ink", sw: 3 });
const txt = (x, y, text, size = 16) => ({ t: "text", x, y, text, size, fill: "ink", anchor: "middle", weight: 700 });
const fr = (ee, dev, exp, br) => ({ ee, dev, exp, br });
const check = { type: "all", checks: [{ type: "equals", of: "wrong", value: "0" }, { type: "equals", of: "unplaced", value: "0" }] };

const page = {
  kind: "shapes",
  w: 480,
  h: 300,
  alt: "An empty notes page divided into three areas: a narrow column on the left, a wide area on the right, and a bar along the bottom. Light lines show where writing goes.",
  longDesc:
    "A page with a vertical line near the left that makes a narrow column, a wide area to the right of that line with ruled lines, and a horizontal line near the bottom that makes a summary bar.",
  items: [
    rect(20, 20, 440, 260, "paper", { rx: 8 }),
    line(150, 20, 150, 220),
    line(20, 220, 460, 220),
    ...[70, 100, 130, 160, 190].map((y) => line(170, y, 440, y)),
  ],
};

const organizer = {
  kind: "shapes",
  w: 480,
  h: 300,
  alt: "A graphic organizer with one wide box at the top headed Big point and three boxes below it headed How it works, Why it matters and What we can do.",
  longDesc:
    "A wide box at the top with the heading Big point, joined by lines to three equal boxes below with the headings How it works, Why it matters and What we can do.",
  items: [
    rect(90, 14, 300, 80, "sky"),
    txt(240, 40, "Big point", 18),
    line(240, 94, 240, 112),
    line(90, 112, 390, 112),
    line(90, 112, 90, 130),
    line(240, 112, 240, 130),
    line(390, 112, 390, 130),
    rect(20, 130, 140, 150, "paper"),
    rect(170, 130, 140, 150, "paper"),
    rect(320, 130, 140, 150, "paper"),
    txt(90, 156, "How it works", 15),
    txt(240, 156, "Why it matters", 15),
    txt(390, 156, "What we can do", 15),
  ],
};

export default {
  id: "g6-sped-notes-layout-labels",
  engine: "concept-builder",
  kind: "label-diagram",
  title: "Set up your notes and organizer",
  grade: "6",
  band: "6-8",
  subject: "sped",
  lessonId: "g6-sped-note-taking-and-summarizing",
  standards: ["RI.6.2", "UDL.3.2", "UDL.6.3"],
  vocabIds: ["notes", "graphic-organizer", "main-idea", "key-detail"],
  minutes: 14,
  intro:
    "Notes work best when the page has a plan. Label each part of a notes page, then put ideas from an article about bees into a graphic organizer. Tap a label, then tap a spot, or drag it. You can change your mind.",
  model: {
    visual: page,
    labels: [
      { id: "cues", text: "Questions and key words" },
      { id: "notes", text: "Notes in short phrases and my own words" },
      { id: "sum", text: "Summary in one or two sentences" },
      { id: "dis", text: "A copied paragraph", distractor: true },
    ],
    hotspots: [
      { id: "hc", x: 85, y: 120, answer: "cues", name: "the narrow column on the left" },
      { id: "hn", x: 305, y: 120, answer: "notes", name: "the wide ruled area on the right" },
      { id: "hs", x: 240, y: 252, answer: "sum", name: "the bar along the bottom" },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt: "Label the three parts of a notes page. The narrow column is for the small things you want to find again.",
      goal: "Every part has a name",
      target: { placed: { hc: "cues", hn: "notes", hs: "sum" } },
      check,
      hints: [
        "Think about the size of each area. Which one is the biggest and holds the most writing?",
        "The bottom bar is the last thing you write, after you have read everything.",
        "The narrow column is where you put short words or questions that help you find notes later.",
      ],
      misconceptions: [
        { match: "copy-in-notes", when: { type: "equals", of: "placed.hn", value: "dis" }, hint: "Copying a whole paragraph does not help you learn it. Which label says short phrases in your own words?" },
        { match: "summary-in-column", when: { type: "equals", of: "placed.hc", value: "sum" }, hint: "The summary needs space to write a full sentence. Which area is wide enough?" },
      ],
      model: "The wide area is for notes in short phrases and your own words. The narrow column holds questions and key words. The bar at the bottom is for a short summary of the page.",
      right: "Yes. Each part of the page has one job.",
      supports: {
        ee: { frames: ["The wide area is for ___.", "The bottom bar is for a ___."], wordBank: ["notes", "summary", "key words", "questions"], directions: "Tap a label. Then tap a spot on the page." },
        dev: { frames: ["The ___ goes in the ___ because ___."], wordBank: ["notes", "summary", "cue"] },
        exp: { frames: ["The page is organized so that ___ goes in ___ because ___."] },
        br: {},
      },
      explain: {
        prompt: "Why is it helpful to set up a page this way before you read?",
        frames: fr(["It helps me ___.", "I know where ___ goes."], ["Setting up the page helps me ___ because ___."], ["Setting up the page helps me find ___ later because each part has ___."], ["A planned page supports ___ because it separates ___ from ___."]),
        mustMention: [{ id: "plan", label: "each part has a job", any: ["find", "organized", "organize", "job", "where", "later"] }],
      },
    },
    {
      id: "t2",
      prompt: "An article says: bees carry pollen from flower to flower, which helps plants make fruit and seeds. Put each idea in the right box of the organizer.",
      goal: "Every box holds the right idea",
      setup: {
        visual: organizer,
        labels: [
          { id: "big", text: "Bees help plants make fruit and seeds" },
          { id: "how", text: "Pollen sticks to a bee and rubs off on the next flower" },
          { id: "why", text: "Apples, blueberries and almonds depend on pollination" },
          { id: "do", text: "Planting flowers and avoiding strong chemicals helps bees" },
          { id: "dis", text: "Bees make honey in a hive", distractor: true },
        ],
        hotspots: [
          { id: "hb", x: 240, y: 68, answer: "big", name: "the wide box at the top" },
          { id: "h1", x: 90, y: 220, answer: "how", name: "the left box in the lower row" },
          { id: "h2", x: 240, y: 220, answer: "why", name: "the middle box in the lower row" },
          { id: "h3", x: 390, y: 220, answer: "do", name: "the right box in the lower row" },
        ],
      },
      target: { placed: { hb: "big", h1: "how", h2: "why", h3: "do" } },
      check,
      hints: [
        "The big point is the sentence that the whole article is about. The other boxes hold details that support it.",
        "Read the heading above each lower box. Match the idea to the heading.",
        "One card is true but not about the big point. Look for the card that does not answer any heading.",
      ],
      misconceptions: [
        { match: "detail-as-big-point", when: { type: "any", checks: [{ type: "equals", of: "placed.hb", value: "how" }, { type: "equals", of: "placed.hb", value: "why" }, { type: "equals", of: "placed.hb", value: "do" }] }, hint: "That card is a detail. Which card tells what the whole article is about?" },
        { match: "extra-detail", when: { type: "any", checks: [{ type: "equals", of: "placed.h1", value: "dis" }, { type: "equals", of: "placed.h2", value: "dis" }, { type: "equals", of: "placed.h3", value: "dis" }, { type: "equals", of: "placed.hb", value: "dis" }] }, hint: "That fact may be true, but does it answer one of the headings or the big point?" },
      ],
      model: "The big point is that bees help plants make fruit and seeds. How it works: pollen sticks to a bee and rubs off on the next flower. Why it matters: foods such as apples and almonds depend on it. What we can do: plant flowers and avoid strong chemicals. The honey fact is true but is not needed for this big point.",
      right: "Yes. The organizer shows the big point and the details that support it.",
      supports: {
        ee: { frames: ["The big point is ___.", "This card goes under ___."], wordBank: ["big point", "how it works", "why it matters", "what we can do"], directions: "Read each card aloud. Match it to a heading." },
        dev: { frames: ["I put ___ under ___ because ___."], wordBank: ["big point", "detail", "heading"] },
        exp: { frames: ["The card about ___ goes under ___ because it answers ___."] },
        br: {},
      },
      explain: {
        prompt: "Which card did you leave out, and why?",
        frames: fr(["I left out ___.", "It is not about ___."], ["I left out ___ because it does not ___."], ["I left out the card about ___ because it is true but does not answer ___."], ["I omitted ___ since, although accurate, it does not support ___."]),
        mustMention: [{ id: "extra", label: "the extra detail", any: ["honey", "hive", "extra", "not needed", "does not", "doesn't"] }],
      },
    },
  ],
  reflection: {
    prompt: "How could a plan for your page help you the next time you read?",
    frames: {
      ee: ["A plan helps me ___.", "I will use ___."],
      dev: ["A plan helps me because ___.", "Next time I will ___."],
      exp: ["A plan helps me ___ because ___; next time I will start by ___."],
      br: ["Planning the page supports ___ because ___; I will begin with ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
