// Vocabulary for "Central Idea and Supporting Details" (grade 6 ELA). Original definitions and examples; every picture is a visual-kit spec.
const rect = (x, y, w, h, fill = "paper", stroke = "navy", sw = 2.5) => ({
  t: "rect",
  x,
  y,
  w,
  h,
  rx: 10,
  fill,
  stroke,
  sw,
});
const txt = (x, y, text, o = {}) => ({
  t: "text",
  x,
  y,
  text,
  size: 15,
  fill: "ink",
  weight: 700,
  anchor: "middle",
  ...o,
});
const box = (x, y, w, h, text, fill = "paper", o = {}) => [
  rect(x, y, w, h, fill, o.stroke || "navy"),
  txt(x + w / 2, y + h / 2, text, { size: o.size || 15 }),
];
const line = (x1, y1, x2, y2, stroke = "ink", sw = 2.5, dash) => ({
  t: "line",
  x1,
  y1,
  x2,
  y2,
  stroke,
  strokeWidth: sw,
  ...(dash ? { dash } : {}),
});
const head = (x, y, dir, fill = "ink") => ({
  t: "poly",
  fill,
  points:
    dir === "up"
      ? [
          [x, y],
          [x - 7, y + 12],
          [x + 7, y + 12],
        ]
      : dir === "down"
        ? [
            [x, y],
            [x - 7, y - 12],
            [x + 7, y - 12],
          ]
        : [
            [x, y],
            [x - 12, y - 7],
            [x - 12, y + 7],
          ],
});
const shapes = (alt, items, extra = {}) => ({
  kind: "shapes",
  alt,
  w: 480,
  h: 260,
  items: items.flat(Infinity),
  ...extra,
});

/** An idea box over three detail boxes joined by upward arrows. `hot` is the index of an emphasised detail (or -1). */
const pyramid = (
  alt,
  topText,
  details,
  { hot = -1, topFill = "teal-soft", topLabel = "Central idea" } = {},
) =>
  shapes(
    alt,
    [
      box(40, 26, 400, 56, topText, topFill, { size: 14 }),
      txt(48, 12, topLabel, { size: 12, anchor: "start", fill: "navy" }),
      ...details.map((d, i) => {
        const x = 20 + i * 154;
        const cx = x + 66;
        return [
          box(x, 150, 132, 86, d, i === hot ? "copper-soft" : "paper", { size: 13 }),
          line(cx, 150, 240 + (cx - 240) * 0.35, 84, "ink", 2.5),
          head(240 + (cx - 240) * 0.35, 82, "up"),
        ];
      }),
    ],
    { h: 260 },
  );

const entry = (e) => ({ tier: 2, domains: ["Reading", "Speaking"], klu: "Explain", ...e });

export default {
  id: "g6-ela-central-idea-and-supporting-details",
  title: "Central idea and supporting details: reading informational text closely",
  grade: "6",
  band: "6-8",
  subject: "ela",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.6.2, RI.6.1 and RL.6.2; not mapped to a district unit sequence. Words, examples and pictures are original.",
  },
  standards: ["RI.6.1", "RI.6.2", "RL.6.2"],
  entries: [
    entry({
      id: "topic",
      word: "topic",
      pos: "noun",
      pron: "TOP-ik",
      def: "The subject a text is about, usually named in a word or a short phrase.",
      visual: shapes(
        "Two boxes. The first, labelled Topic, holds the short phrase street trees. The second, labelled Central idea, holds a full sentence about what the author says about street trees.",
        [
          box(20, 30, 180, 80, "street trees", "sky"),
          txt(110, 20, "Topic: a few words", { size: 12, fill: "navy" }),
          box(
            240,
            30,
            220,
            130,
            "Street trees cool a city\nblock in several\npractical ways.",
            "teal-soft",
            { size: 14 },
          ),
          txt(350, 20, "Central idea: a full sentence", { size: 12, fill: "navy" }),
          line(200, 70, 236, 70, "ink", 2.5, "5 4"),
          txt(110, 135, "what the text is about", { size: 12, weight: 400 }),
          txt(350, 190, "says what the author thinks you should understand about the topic", {
            size: 11,
            weight: 400,
          }),
        ],
        { h: 230 },
      ),
      context:
        "The topic of the passage is street trees, but the central idea is a sentence about what street trees do.",
      nonExample:
        "Trees are important is not a topic. It is a statement with a point of view, so it is closer to a central idea.",
      academicSentence:
        "The topic names the subject, while the central idea tells what the author wants readers to understand about it.",
      es: { word: "tema", def: "El asunto del que trata un texto.", verified: false },
      misconception:
        "Students give the topic when asked for the central idea, so the answer is a phrase with no claim in it.",
      related: ["central-idea", "summary"],
      practice: {
        visualPrompt:
          "Which box shows the topic, and which shows a central idea? How can you tell?",
        speakWrite:
          "Name the topic of the last text we read in three words or fewer. Then write one sentence about what the author says about it.",
        retrieval:
          "Which word names the subject of a text, and which names the point the author makes about it?",
      },
    }),
    entry({
      id: "central-idea",
      word: "central idea",
      pos: "noun",
      pron: "SEN-trul eye-DEE-uh",
      def: "The most important point an author makes about a topic, stated or implied across the whole text.",
      visual: pyramid(
        "A wide box at the top labelled Central idea holds the sentence street trees cool city blocks in several practical ways. Three smaller detail boxes below, about shade, water vapor and rainwater, each have an arrow pointing up to it.",
        "Street trees cool city blocks in several practical ways.",
        ["Leaves block\nsunlight", "Leaves release\nwater vapor", "Roots and leaves\nsoak up rain"],
      ),
      context:
        "Every paragraph in the passage adds a reason, so the central idea covers the whole passage, not one paragraph.",
      nonExample:
        "Young trees need regular watering is true in the passage, but it covers one paragraph only, so it is a detail.",
      academicSentence:
        "A central idea must be broad enough to cover the whole text and specific enough to say something about the topic.",
      everyday: "Like the main point of a speech you could still repeat a week later.",
      es: {
        word: "idea central",
        def: "El punto más importante que presenta el autor sobre un tema.",
        verified: false,
      },
      morphology: { parts: [{ part: "central", meaning: "at the center, most important" }] },
      misconception:
        "Students pick the first sentence or the most interesting fact instead of the idea that every paragraph supports.",
      related: ["supporting-detail", "convey", "topic"],
      practice: {
        visualPrompt:
          "Look at the arrows. What do all three detail boxes have in common that the top box says?",
        speakWrite:
          "Say the central idea of a text you read this week, then name one detail that supports it.",
        retrieval: "Which words name the most important point an author makes across a whole text?",
      },
    }),
    entry({
      id: "supporting-detail",
      word: "supporting detail",
      pos: "noun",
      pron: "suh-POR-ting DEE-tayl",
      def: "A fact, example or reason in a text that helps explain or prove the central idea.",
      visual: pyramid(
        "The same diagram with one detail box highlighted: leaves release water vapor, which cools the air. An arrow from it points up to the central idea box about street trees cooling a city block.",
        "Street trees cool city blocks in several practical ways.",
        ["Leaves block\nsunlight", "Leaves release\nwater vapor", "Roots and leaves\nsoak up rain"],
        { hot: 1 },
      ),
      context:
        "The sentence about leaves releasing water vapor is a supporting detail because it explains one way trees cool the air.",
      nonExample:
        "The passage is about trees is not a supporting detail. It names the topic and proves nothing.",
      academicSentence: "Each supporting detail explains or proves one part of the central idea.",
      es: {
        word: "detalle de apoyo",
        def: "Un dato, ejemplo o razón que ayuda a explicar la idea central.",
        verified: false,
      },
      misconception:
        "Students treat any true sentence as a supporting detail, even when it does not connect to the central idea.",
      related: ["central-idea", "evidence"],
      practice: {
        visualPrompt:
          "Point to the highlighted detail. Say which part of the central idea it supports.",
        speakWrite:
          "Choose one detail from a text and say, with the word because, how it supports the central idea.",
        retrieval: "What do we call a fact, example or reason that helps prove the central idea?",
      },
    }),
    entry({
      id: "evidence",
      word: "evidence",
      pos: "noun",
      pron: "EV-ih-dents",
      def: "Exact information from a text that you use to show that your answer is right.",
      visual: shapes(
        "A three-step flow from left to right. A claim box says the author thinks trees are worth the cost. An evidence box says the text says cities plant on hot blocks first because they gain the most. A reasoning box says this shows the benefit is larger than the cost.",
        [
          box(10, 70, 140, 110, "Claim:\nthe author thinks\ntrees are worth\nthe cost", "sky", {
            size: 13,
          }),
          box(
            170,
            70,
            140,
            110,
            "Evidence:\ncities plant on hot\nblocks first because\nthey gain the most",
            "copper-soft",
            { size: 13 },
          ),
          box(
            330,
            70,
            140,
            110,
            "Reasoning:\nthis shows the\nbenefit is larger\nthan the cost",
            "teal-soft",
            { size: 13 },
          ),
          line(150, 125, 166, 125),
          head(168, 125, "right"),
          line(310, 125, 326, 125),
          head(328, 125, "right"),
        ],
        { h: 250 },
      ),
      context:
        "To prove the central idea, quote or point to the sentence in the passage and then explain what it shows.",
      nonExample:
        "I just know it is true is not evidence. Evidence has to come from the text itself.",
      academicSentence:
        "Strong evidence comes directly from the text and clearly connects to the claim it supports.",
      everyday: "Like showing the receipt to prove you paid.",
      es: {
        word: "evidencia",
        def: "Información exacta de un texto que muestra que tu respuesta es correcta.",
        verified: false,
      },
      related: ["supporting-detail", "infer"],
      practice: {
        visualPrompt: "Which box is the evidence? What does the reasoning box add to it?",
        speakWrite:
          "Make a claim about a text, then give one piece of evidence and a sentence that connects them.",
        retrieval: "Where must evidence come from?",
      },
    }),
    entry({
      id: "summary",
      word: "summary",
      pos: "noun",
      pron: "SUM-uh-ree",
      def: "A short retelling of the central idea and the most important details, in your own words.",
      visual: shapes(
        "A funnel-like diagram. A long text at the top is represented by many small lines. An arrow points down to a short summary made of three parts: the central idea, two key details and no opinions.",
        [
          ...[0, 1, 2, 3, 4, 5].map((i) => line(60, 20 + i * 12, 420, 20 + i * 12, "line", 4)),
          line(240, 96, 240, 124),
          head(240, 128, "down"),
          txt(340, 112, "shrink it", { size: 12, weight: 400 }),
          box(
            70,
            136,
            340,
            84,
            "1. the central idea\n2. two or three key details\n3. no opinions, in your own words",
            "teal-soft",
            { size: 14 },
          ),
        ],
        { h: 240 },
      ),
      context:
        "A good summary of the passage names the central idea and two key details, then stops.",
      nonExample:
        "Retelling every sentence in order is not a summary. It is a copy that is just as long as the original.",
      academicSentence:
        "A summary includes the central idea and key details but leaves out the reader's opinion.",
      es: {
        word: "resumen",
        def: "Un relato corto de la idea central y los detalles más importantes.",
        verified: false,
      },
      morphology: { parts: [{ part: "sum-", meaning: "Latin summa, the total or highest point" }] },
      misconception:
        "Students believe a longer summary is a better summary, so they copy details without choosing among them.",
      related: ["paraphrase", "objective", "central-idea"],
      practice: {
        visualPrompt:
          "What three parts belong in the short box? What was left out of the long text?",
        speakWrite:
          "Summarize a paragraph in two sentences. Check that neither sentence shares an opinion.",
        retrieval: "Which word names a short retelling of the central idea and key details?",
      },
    }),
    entry({
      id: "paraphrase",
      word: "paraphrase",
      pos: "verb",
      pron: "PAIR-uh-frayz",
      def: "To say the meaning of a sentence again in new words without changing the idea.",
      visual: {
        kind: "table",
        alt: "A two-column table. The Original column holds the sentence trees release water vapor, which cools the air. The Paraphrase column holds the sentence leaves put moisture into the air, and that makes the air cooler.",
        w: 480,
        h: 170,
        head: ["Original", "Paraphrase"],
        rows: [
          [
            "Trees release water vapor, which cools the air.",
            "Leaves put moisture into the air, and that makes the air cooler.",
          ],
        ],
        highlight: [[0, 1]],
      },
      context:
        "When a partner reads a sentence, you paraphrase it to show you understood the idea.",
      nonExample:
        "Changing one word is not a paraphrase. Trees release water vapor, which chills the air still copies almost every word.",
      academicSentence:
        "To paraphrase accurately, keep the meaning of the original and change the wording.",
      es: {
        word: "parafrasear",
        def: "Decir con otras palabras el significado de una oración.",
        verified: false,
      },
      morphology: {
        parts: [
          { part: "para-", meaning: "beside" },
          { part: "phrase", meaning: "a group of words" },
        ],
      },
      related: ["summary", "objective"],
      practice: {
        visualPrompt:
          "Compare the two sentences. Which words changed and which idea stayed the same?",
        speakWrite:
          "Paraphrase one sentence from the passage out loud, then write it with at least two changed words.",
        retrieval: "What is it called when you say an idea again in your own words?",
      },
    }),
    entry({
      id: "objective",
      word: "objective",
      pos: "adjective",
      pron: "ub-JEK-tiv",
      def: "Based on facts in the text, not on personal feelings or opinions.",
      visual: {
        kind: "venn",
        alt: "A two-circle Venn diagram. One circle, labelled What the text says, lists the cooling facts. The other, labelled What I think, lists opinions. The overlap is empty to show that an objective summary keeps the two apart.",
        w: 480,
        h: 280,
        sets: [
          { label: "What the text says", items: ["facts", "author's idea"] },
          { label: "What I think", items: ["feelings", "my view"] },
        ],
        overlap: [],
      },
      context:
        "An objective summary of the passage says that trees cool a block and leaves out whether you like trees.",
      nonExample:
        "Trees are the best part of any city is not objective, because it shares a feeling that the text does not prove.",
      academicSentence:
        "An objective summary reports the author's ideas, so it does not add the reader's judgments.",
      es: {
        word: "objetivo",
        def: "Basado en hechos y no en opiniones personales.",
        verified: false,
      },
      misconception:
        "Students think a summary must sound interesting, so they add words like amazing or boring.",
      related: ["opinion", "summary"],
      practice: {
        visualPrompt: "Which circle belongs in a summary? What goes in the other circle?",
        speakWrite: "Rewrite one sentence from your summary so that it has no opinion words.",
        retrieval: "Which word describes writing that sticks to facts from the text?",
      },
    }),
    entry({
      id: "opinion",
      word: "opinion",
      pos: "noun",
      pron: "uh-PIN-yun",
      def: "A personal belief or feeling that cannot be proven true or false by facts alone.",
      visual: {
        kind: "table",
        alt: "A table sorting statements. Fact from the text: leaves release water vapor. Opinion: trees are the prettiest thing on a street.",
        w: 480,
        h: 170,
        head: ["Fact from the text", "Opinion"],
        rows: [["Leaves release water vapor.", "Trees are the prettiest thing on a street."]],
        highlight: [[0, 1]],
      },
      context:
        "In a summary, your opinion about trees stays out, but you may share it in a separate response.",
      nonExample:
        "Leaves release water vapor is not an opinion. The passage states it as a fact and it can be checked.",
      academicSentence:
        "An opinion tells what someone believes, while a fact can be checked in the text.",
      es: { word: "opinión", def: "Una creencia o sentimiento personal.", verified: false },
      related: ["objective", "evidence"],
      practice: {
        visualPrompt: "Which statement could you check in the text? Which one is a feeling?",
        speakWrite:
          "Say one fact and one opinion about our school, then write them in two labelled sentences.",
        retrieval: "What do we call a belief that facts alone cannot prove?",
      },
    }),
    entry({
      id: "infer",
      word: "infer",
      pron: "in-FUR",
      pos: "verb",
      def: "To figure out something the text does not say directly by combining clues with what you already know.",
      visual: shapes(
        "An equation-style diagram. A box for the text clue, the passage says dark pavement holds heat for hours, plus a box for what I know, heat stays in dark things, leads to a box for the inference, a city with lots of pavement stays warm after sunset.",
        [
          box(10, 60, 130, 100, "Text clue:\ndark pavement\nholds heat for\nhours", "copper-soft", {
            size: 12,
          }),
          txt(157, 110, "+", { size: 30 }),
          box(175, 60, 130, 100, "What I know:\ndark things in\nthe sun get hot", "sky", {
            size: 12,
          }),
          line(308, 110, 330, 110),
          head(334, 110, "right"),
          box(
            340,
            50,
            130,
            120,
            "Inference:\na paved city stays\nwarm after the\nsun goes down",
            "teal-soft",
            { size: 12 },
          ),
        ],
        { h: 230 },
      ),
      context:
        "The passage never says that cities stay warm at night, but you can infer it from the clue about hours of heat.",
      nonExample:
        "Copying a sentence from the text is not an inference, because the text already says it directly.",
      academicSentence:
        "To make an inference, combine a clue from the text with what you already know and check that the text supports it.",
      es: {
        word: "inferir",
        def: "Deducir algo que el texto no dice directamente.",
        verified: false,
      },
      misconception: "Students think an inference is a guess, so they skip the text clue.",
      related: ["evidence", "convey"],
      practice: {
        visualPrompt:
          "Which two boxes combine to make the inference? Which one must come from the text?",
        speakWrite:
          "Say an inference about a character or a topic, and name the clue that led you to it.",
        retrieval: "Which word means figuring out an idea the text does not state directly?",
      },
    }),
    entry({
      id: "convey",
      word: "convey",
      pos: "verb",
      pron: "kun-VAY",
      def: "To communicate an idea to a reader, in this lesson through the details an author chooses.",
      visual: shapes(
        "Three details about trees, shade, vapor and rain, each connected by an arrow labelled shows to one idea box that says trees cool and protect a city. A speech-like arrow points from the idea to the reader.",
        [
          box(10, 30, 130, 50, "shade", "copper-soft", { size: 14 }),
          box(10, 100, 130, 50, "water vapor", "copper-soft", { size: 14 }),
          box(10, 170, 130, 50, "rainwater", "copper-soft", { size: 14 }),
          ...[55, 125, 195].map((y) => [line(142, y, 218, 125), head(220, 125, "right")]),
          txt(178, 90, "shows", { size: 12, weight: 400 }),
          box(222, 85, 130, 80, "Trees help\ncool a city", "teal-soft", { size: 14 }),
          line(354, 125, 392, 125),
          head(396, 125, "right"),
          box(398, 95, 76, 60, "reader", "paper", { size: 14 }),
        ],
        { h: 240 },
      ),
      context:
        "The author conveys the central idea through three details about shade, vapor and rainwater.",
      nonExample:
        "Saying the author is smart does not tell how an idea is conveyed. The answer has to name details from the text.",
      academicSentence:
        "Authors convey a central idea by choosing details that all point toward the same point.",
      es: { word: "transmitir", def: "Comunicar una idea al lector.", verified: false },
      related: ["central-idea", "supporting-detail"],
      practice: {
        visualPrompt: "Trace the arrows. How do the details help the reader understand the idea?",
        speakWrite:
          "Explain how one text conveys its central idea by naming two details and what they show.",
        retrieval: "Which word names how an author gets an idea across to the reader?",
      },
    }),
    entry({
      id: "theme",
      word: "theme",
      pos: "noun",
      pron: "theem",
      def: "A message about life that a story shows through what characters say, do and learn.",
      visual: shapes(
        "A ladder diagram. At the bottom, an event: a character covers her seedlings every night. In the middle, a lesson: she does not give up after a setback. At the top, the theme: persistence can turn a loss into growth.",
        [
          box(110, 190, 260, 46, "Event: Mara covers her seedlings", "paper", { size: 13 }),
          line(240, 190, 240, 160),
          head(240, 154, "up"),
          box(110, 106, 260, 46, "Pattern: she tries again after a loss", "copper-soft", { size: 13 }),
          line(240, 106, 240, 76),
          head(240, 70, "up"),
          box(70, 14, 340, 54, "Theme: persistence can turn a loss into growth", "teal-soft", {
            size: 14,
          }),
        ],
        { h: 250 },
      ),
      context:
        "The theme of a story is the idea behind the plot, so you state it as a full sentence about life.",
      nonExample:
        "Gardening is a topic. The theme is the message the story gives about what gardening taught the character.",
      academicSentence:
        "A theme is supported by events and choices in the story, not just stated by the reader.",
      es: {
        word: "tema (de un cuento)",
        def: "Un mensaje sobre la vida que muestra un cuento.",
        verified: false,
      },
      misconception:
        "Students name a single word such as courage and stop, instead of writing the message as a sentence.",
      related: ["central-idea", "topic"],
      practice: {
        visualPrompt: "Climb the ladder from the event to the theme. What changes at each step?",
        speakWrite: "Name a story you know and state its theme in one full sentence.",
        retrieval: "What do we call the message about life that a story shows?",
      },
    }),
  ],
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
