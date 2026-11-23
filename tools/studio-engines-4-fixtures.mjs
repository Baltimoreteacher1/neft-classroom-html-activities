// Fixtures for tools/studio-engines-4.test.mjs: one inline vocab-quest activity that exercises every item kind
// (including word-parts and Spanish gating), plus loaders for the shipped activities of the three engines.
const table = (alt, head, rows) => ({ kind: "table", alt, head, rows });
const entry = (o) => ({ pos: "verb", noVisualReason: undefined, ...o });

export const questEntries = [
  entry({
    id: "contradict",
    word: "contradict",
    pron: "kon-truh-DIKT",
    def: "To say the opposite of what someone else has said.",
    visual: table(
      "A table where one speaker says the door is open and the other says it is closed.",
      ["Speaker 1", "Speaker 2"],
      [["The door is open.", "The door is closed."]],
    ),
    context: "The second witness seemed to contradict the first.",
    academicSentence: "The new data contradict the earlier claim, so the claim must be revised.",
    everyday: "If you say the game starts at noon and I say it starts at two, I contradict you.",
    es: {
      word: "contradecir",
      def: "Decir lo opuesto de lo que dijo otra persona.",
      verified: true,
    },
    morphology: {
      parts: [
        { part: "contra-", meaning: "against" },
        { part: "dict", meaning: "to say" },
      ],
    },
    practice: {
      speakWrite: "Say how two sources could contradict each other, then write a sentence.",
    },
  }),
  entry({
    id: "evidence",
    word: "evidence",
    pos: "noun",
    pron: "EV-ih-dents",
    def: "Facts or details that help show a statement is true.",
    visual: table(
      "A table pairing the statement that a park is busy with the fact that 400 people visited on Saturday.",
      ["Statement", "Fact that backs it up"],
      [["The park is busy.", "400 people visited on Saturday."]],
    ),
    context: "The footprints are evidence that someone walked here.",
    academicSentence: "Good evidence is specific and comes from a source.",
    es: {
      word: "evidencia",
      def: "Datos que ayudan a mostrar que algo es verdad.",
      verified: false,
    },
    practice: {
      speakWrite:
        "Say what evidence you would use to prove your favorite lunch is the best, then write it.",
    },
  }),
  entry({
    id: "infer",
    word: "infer",
    pron: "in-FUR",
    def: "To figure something out from clues instead of being told directly.",
    visual: table(
      "A table pairing a wet umbrella by the door with the idea that it rained.",
      ["Clue", "What I figure out"],
      [["Wet umbrella by the door", "It rained."]],
    ),
    context: "From the muddy boots, we can infer that he walked through the field.",
    academicSentence: "Readers infer a character's feelings from what the character says and does.",
    practice: {
      speakWrite: "Say one thing you can infer from a picture in the room, then write it.",
    },
  }),
  entry({
    id: "credible",
    word: "credible",
    pron: "KRED-uh-bul",
    def: "Believable because the source is honest and knows the topic.",
    visual: table(
      "A table listing a doctor writing about health as a source worth trusting and an anonymous post as a source to question.",
      ["Source", "Worth trusting?"],
      [
        ["A doctor writing about health", "Yes"],
        ["An anonymous post", "Ask more questions"],
      ],
    ),
    context: "A scientist who studied the lake is a credible source about its fish.",
    academicSentence: "A credible source names its author and explains how it knows.",
    morphology: {
      parts: [
        { part: "cred-", meaning: "believe" },
        { part: "-ible", meaning: "able to be" },
      ],
    },
    practice: {
      speakWrite: "Say who is a credible source about your school, then write a sentence.",
    },
  }),
  entry({
    id: "bias",
    word: "bias",
    pos: "noun",
    pron: "BY-us",
    def: "A leaning toward one side that keeps a writer from being fair.",
    visual: table(
      "A table showing a reporter who quotes only one side of a story.",
      ["Writer", "Who is quoted"],
      [["Reporter A", "Only one side"]],
    ),
    context: "The article showed bias when it quoted only one team's fans.",
    academicSentence: "Readers look for bias by asking whose voices are left out.",
    practice: { speakWrite: "Say how a writer could show bias, then write a sentence." },
  }),
  entry({
    id: "prediction",
    word: "prediction",
    pos: "noun",
    pron: "pree-DIK-shun",
    def: "A statement about what will happen next, based on clues.",
    visual: table(
      "A table pairing dark clouds with the statement that it will rain soon.",
      ["Clue", "What I say will happen"],
      [["Dark clouds", "It will rain soon."]],
    ),
    context: "Her prediction was that the team would win because they had practiced.",
    academicSentence: "A strong prediction uses clues from the text, not a guess.",
    morphology: {
      parts: [
        { part: "pre-", meaning: "before" },
        { part: "dict", meaning: "to say" },
        { part: "-ion", meaning: "the act of" },
      ],
    },
    practice: {
      speakWrite: "Say a prediction about tomorrow, then write a sentence with its clue.",
    },
  }),
];

const REFLECT = {
  prompt: "Which word will you use this week?",
  frames: {
    ee: ["I will use ___."],
    dev: ["I will use ___ when ___."],
    exp: ["I will use ___ when ___ because ___."],
    br: ["I will use ___ when ___ because ___."],
  },
};

export const questInline = {
  id: "fx-quest-inline",
  engine: "vocab-quest",
  title: "Fixture quest",
  grade: "8",
  band: "6-8",
  subject: "ela",
  standards: ["L.8.6"],
  minutes: 15,
  intro: "Learn, use, retrieve and apply six words.",
  entries: questEntries,
  stages: [
    {
      id: "see",
      kind: "see",
      title: "See",
      intro: "Meet each word.",
      entryIds: ["contradict", "evidence", "infer", "credible", "bias", "prediction"],
    },
    {
      id: "use",
      kind: "use-in-context",
      title: "Use",
      intro: "Use the words in sentences.",
      entryIds: ["contradict", "evidence", "infer", "credible", "bias", "prediction"],
      items: [
        {
          kind: "sentence-choice",
          entryId: "credible",
          prompt: "Which sentence uses credible correctly?",
          choices: [
            "A credible report names who wrote it and how they know.",
            "A credible report is any post that many people have shared.",
            "A credible report is one that is easy and quick to read.",
          ],
          answer: 0,
          hints: [
            "Think about why you would trust a source, not how popular it is.",
            "Ask who wrote it and whether they know the topic.",
            "Check each sentence for a reason to believe the source.",
          ],
          misconceptions: [
            {
              pick: 1,
              tag: "credible-means-popular",
              hint: "Many shares do not make a source believable. Credible is about honesty and knowledge, not popularity.",
            },
          ],
          why: "Credible sources can be trusted because of who wrote them and how they know.",
        },
      ],
    },
    {
      id: "retrieve",
      kind: "retrieve",
      title: "Retrieve",
      intro: "Build and type the words.",
      entryIds: ["contradict", "credible", "prediction"],
      kinds: ["word-parts", "type-word"],
    },
    {
      id: "apply",
      kind: "apply",
      title: "Apply",
      intro: "Say and write.",
      entryIds: ["evidence", "infer", "bias"],
    },
    { id: "revisit", kind: "revisit", title: "Revisit", intro: "Come back to words." },
  ],
  reflection: REFLECT,
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - test fixture",
};

export const ACTIVITY_IDS = {
  conversation: ["g6-vars-conversation", "g4-esol-explain-how-things-work-conversation"],
  quest: ["g4-esol-water-words-quest"],
  argument: ["g8-ela-early-gym-argument"],
};

export const loadActivity = async (id) =>
  (await import(`../bcpss-teachers/studio/data/activities/${id}.js`)).default;
export const loadCollection = async (id) =>
  (await import(`../bcpss-teachers/studio/data/vocab/${id}.js`)).default;

// ---------------------------------------------------------------------------------------------------------------
// jsdom harness for the engine click-through tests (no browser needed). Call setupDom() once per test file.
import { JSDOM } from "jsdom";
import { keys, remove } from "../bcpss-teachers/studio/core/store.js";

export function setupDom() {
  const dom = new JSDOM("<!doctype html><body></body>", {
    url: "http://localhost/bcpss-teachers/studio/play/",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  for (const k of [
    "window",
    "document",
    "location",
    "localStorage",
    "navigator",
    "HTMLElement",
    "Node",
    "Event",
  ]) {
    try {
      globalThis[k] = w[k];
    } catch {
      Object.defineProperty(globalThis, k, { value: w[k], configurable: true });
    }
  }
  globalThis.matchMedia = () => ({ matches: false });
  return dom;
}
export const freshRoot = ({ keepStore = false } = {}) => {
  document.body.replaceChildren();
  if (!keepStore) {
    localStorage.clear();
    for (const k of keys()) remove(k); // the store keeps an in-memory copy; clear it too
  }
  const root = document.createElement("div");
  document.body.append(root);
  return root;
};
export const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
export const buttons = (root) =>
  [...root.querySelectorAll("button")].filter((b) => !b.hidden && !b.closest("[hidden]"));
/** First visible button whose text or aria-label starts with `text`. */
export const button = (root, text) => {
  const b = buttons(root).find(
    (x) =>
      x.textContent.trim().startsWith(text) ||
      (x.getAttribute("aria-label") || "").startsWith(text),
  );
  if (!b)
    throw new Error(
      `no button "${text}" in: ${buttons(root)
        .map((x) => x.textContent.trim().slice(0, 24))
        .join(" | ")}`,
    );
  return b;
};
export const press = (root, text) => {
  const b = button(root, text);
  if (b.disabled) throw new Error(`button "${text}" is disabled`);
  b.click();
  return b;
};
/** Choose the radio whose label text equals `text` (exact, trimmed, ignoring the tag after it). */
export const choose = (root, text) => {
  const labels = [...root.querySelectorAll("label.st-e4-opt")];
  const l = labels.find(
    (x) =>
      x.querySelector(".st-e4-opttext").firstChild?.textContent.trim() === text ||
      x.querySelector(".st-e4-opttext").textContent.trim().startsWith(text),
  );
  if (!l)
    throw new Error(
      `no choice "${text.slice(0, 40)}" in: ${labels.map((x) => x.textContent.trim().slice(0, 30)).join(" | ")}`,
    );
  l.querySelector("input").click();
};
export const chooseIndex = (root, i) =>
  [...root.querySelectorAll("label.st-e4-opt input")][i].click();
export const type = (el, value) => {
  el.value = value;
  el.dispatchEvent(new Event("input", { bubbles: true }));
};
export const feedbackText = (root) =>
  root.querySelector(".st-feedback:not([hidden])")?.textContent || "";
