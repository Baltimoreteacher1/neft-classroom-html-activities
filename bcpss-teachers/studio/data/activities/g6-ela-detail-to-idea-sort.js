// concept-builder (scale-sort): rank statements from one small detail to the whole central idea or theme (RI.6.2, RL.6.2).
const V = "g6-ela-central-idea-and-supporting-details";
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const AXIS = {
  label: "How much of the text the statement covers",
  low: "one small detail",
  high: "the whole central idea",
};
const items = (list) => list.map(([id, text]) => ({ id, text }));

const sharedSupports = (ee, dev, exp) => ({
  ee: {
    frames: ee,
    wordBank: ["detail", "covers", "whole text", "broad", "specific"],
    directions:
      "Read all four statements. Use Earlier and Later to move the smallest idea to the top.",
  },
  dev: { frames: dev, wordBank: ["covers", "broader than"] },
  exp: { frames: exp },
  br: {},
});

const justifyOptions = (okA, okB, noA, noB) => [
  { id: "j1", text: okA, ok: true },
  { id: "j2", text: okB, ok: true },
  {
    id: "j3",
    text: noA,
    ok: false,
    hint: "Length and position do not tell you how much of the text an idea covers.",
  },
  {
    id: "j4",
    text: noB,
    ok: false,
    hint: "Interest is not the test. Ask whether the other statements help explain this one.",
  },
];

// Interleave right and wrong reasons so the right ones are not always listed first.
const spread = (a) => {
  for (const t of a.tasks)
    if (t.justify && t.justify.options.length === 4) {
      const o = t.justify.options;
      t.justify.options = [o[2], o[0], o[3], o[1]];
    }
  return a;
};

const DATA = {
  id: "g6-ela-detail-to-idea-sort",
  engine: "concept-builder",
  kind: "scale-sort",
  title: "From detail to central idea: rank the statements",
  grade: "6",
  band: "6-8",
  subject: "ela",
  lessonId: "g6-ela-central-idea-and-supporting-details",
  standards: ["RI.6.2", "RL.6.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.6.2 and RL.6.2; not mapped to a district unit sequence. Texts and statements are original.",
  },
  vocabIds: [`${V}:central-idea`, `${V}:supporting-detail`, `${V}:theme`, `${V}:summary`],
  minutes: 18,
  intro:
    "Every text has statements of different sizes. Small details sit under bigger ideas, and the biggest idea covers them all. Rank each set from the smallest detail to the full central idea or theme, then explain how you decided.",
  model: {
    axis: AXIS,
    items: items([
      ["b3", "Many fruit and vegetable crops depend on pollen being moved between flowers."],
      ["b1", "A bee's fuzzy body picks up pollen while it drinks nectar."],
      ["b4", "Bees play an essential role in growing the food people eat."],
      ["b2", "Pollen that rubs off on the next flower lets that flower make seeds."],
    ]),
  },
  tasks: [
    {
      id: "t1-bees",
      prompt:
        "Text: A bee's fuzzy body picks up pollen while it drinks nectar. At the next flower some pollen rubs off, and that flower can make seeds. Many fruit and vegetable crops depend on this. Without bees, harvests of these crops would shrink. Rank the four statements from the smallest detail to the central idea.",
      goal: "The smallest detail first, the central idea last",
      target: { order: ["b1", "b2", "b3", "b4"] },
      check: { type: "order", of: "order", expected: ["b1", "b2", "b3", "b4"] },
      hints: [
        "Pick the statement that describes only one body part doing one thing. Where does it belong on the scale?",
        "For each statement ask: if I removed it, would the other statements still make sense? The biggest idea is the one the others help prove.",
        "A statement about one flower is smaller than a statement about crops. A statement about food people eat is larger than both.",
      ],
      misconceptions: [
        {
          match: "important-detail",
          when: { type: "equals", of: "last", value: "b3" },
          hint: "That statement is true and important, but it is only about crops. Ask whether it also covers what bees do and why it matters for people.",
          model:
            "A central idea must be broad enough to hold the other statements. The crop statement does not hold the whole text.",
        },
        {
          match: "reversed",
          when: { type: "equals", of: "first", value: "b4" },
          hint: "The scale starts with one small detail at the top. Check whether you started with the biggest idea instead.",
        },
      ],
      model:
        "Fuzzy body and pollen is one small action, so it is first. The pollen that rubs off leads to seeds, which is a larger step. Crops that depend on pollen is larger still. Bees playing an essential role in growing food covers all three, so it is the central idea.",
      right: "That order moves from one small action to the idea that all the details support.",
      supports: sharedSupports(
        ["The smallest detail is about ___. The biggest idea is about ___."],
        ["___ is broader than ___ because it covers ___."],
        ["I ranked ___ last because every other statement helps ___."],
      ),
      justify: {
        prompt: "Which reasons show that the last statement is the central idea?",
        options: justifyOptions(
          "The other three statements all help explain or prove it.",
          "It covers pollen, seeds and crops, not just one of them.",
          "It is the shortest of the four statements.",
          "It is the most interesting statement to read.",
        ),
        model:
          "A central idea is the one the other statements support and the one that covers the whole text.",
      },
      explain: {
        prompt:
          "What changed in your ranking, and how did you decide which statement was the central idea?",
        frames: fr(
          ["The central idea is ___.", "It covers ___."],
          ["I put ___ last because it covers ___, while ___ only covers ___."],
          [
            "I ranked ___ as the central idea since the other statements ___, so none of them could cover all of the text.",
          ],
          ["The central idea had to subsume the other statements; ___ does that because ___."],
        ),
        mustMention: [
          {
            id: "covers",
            label: "how much of the text it covers",
            any: ["whole", "all", "cover", "broad", "every", "entire", "support"],
          },
        ],
      },
    },
    {
      id: "t2-cans",
      setup: {
        items: items([
          [
            "a3",
            "Making new cans from used cans takes far less energy than making them from raw ore.",
          ],
          ["a1", "Used cans are melted."],
          ["a4", "Recycling cans saves energy and protects land from mining."],
          ["a2", "Used cans are melted and rolled into sheets for new cans."],
        ]),
      },
      prompt:
        "Text: Used cans are collected and melted. The melted metal is rolled into sheets that become new cans. Making a can from recycled metal takes far less energy than making one from raw ore, and recycling also means less ore has to be mined. Rank the four statements from smallest detail to central idea.",
      goal: "One step first, the central idea last",
      target: { order: ["a1", "a2", "a3", "a4"] },
      check: { type: "order", of: "order", expected: ["a1", "a2", "a3", "a4"] },
      hints: [
        "Find the statement that names only a single step in the process. Put it where the smallest details go.",
        "Two statements describe the process and two describe results. Which pair is wider in scope?",
        "The central idea names more than one benefit. Look for the statement that includes the others' outcomes.",
      ],
      misconceptions: [
        {
          match: "benefit-too-narrow",
          when: { type: "equals", of: "last", value: "a3" },
          hint: "That statement compares energy only. Does it also cover the other benefit the text names?",
        },
        {
          match: "process-last",
          when: { type: "equals", of: "last", value: "a2" },
          hint: "That statement tells how cans are made. Ask whether the text is only about the steps or about why they matter.",
        },
      ],
      model:
        "Melting is a single step, so it is first. Melting and rolling into sheets is the whole process, which is wider. The energy comparison is about a result of the process. Saving energy and protecting land names two results, so it covers the most.",
      right: "That order grows from one step to the point of the whole text.",
      supports: sharedSupports(
        ["The first statement is about one ___. The last statement is about ___ and ___."],
        ["The last statement is broader because it includes ___ and ___."],
        ["Whereas ___ names a single step, ___ names the overall result."],
      ),
      justify: {
        prompt: "Which reasons show that the last statement is broader than the one before it?",
        options: justifyOptions(
          "It names two results of recycling, while the one before it names only one.",
          "The earlier statements help explain why recycling is worth doing.",
          "It comes last in the list I was given.",
          "It uses the longest words.",
        ),
        model:
          "The last statement includes more of the text, because it names both the energy saving and the reduced mining.",
      },
      explain: {
        prompt:
          "What changed in your ranking, and why does the last statement cover more than the others?",
        frames: fr(
          ["The last statement names ___ and ___.", "The first statement is only about ___."],
          ["I moved ___ up because it covers only ___, while ___ covers ___ and ___."],
          [
            "The final statement is broader since it combines ___ with ___, whereas the first describes only ___.",
          ],
          [
            "I distinguished process from consequence: the consequence statements generalize over the steps, so the broadest one ranks last.",
          ],
        ),
        mustMention: [
          {
            id: "covers",
            label: "how much of the text it covers",
            any: ["whole", "all", "cover", "broad", "both", "two", "include"],
          },
        ],
      },
    },
    {
      id: "t3-theme",
      setup: {
        items: items([
          ["t3", "Mara does not give up on her grandfather's garden after a setback."],
          ["t1", "Mara covers the new seedlings with an old blanket every night."],
          ["t4", "Persistence can turn a loss into growth."],
          [
            "t2",
            "After a late frost kills the first sprouts, Mara plants again and protects the new ones.",
          ],
        ]),
      },
      prompt:
        "Story: Mara's grandfather leaves her a packet of seeds. She plants them in spring, but a late frost kills the first sprouts. Mara plants the rest of the seeds and covers the new seedlings with an old blanket every night. By summer the garden is full. Rank the four statements from smallest detail to theme.",
      goal: "The smallest detail first, the theme last",
      target: { order: ["t1", "t2", "t3", "t4"] },
      check: { type: "order", of: "order", expected: ["t1", "t2", "t3", "t4"] },
      hints: [
        "Start with the statement that describes one action at one moment in the story.",
        "A theme is a message about life, so it would still make sense for a different character in a different story.",
        "Compare the statements that name Mara. Which one describes a choice and which one describes a single action?",
      ],
      misconceptions: [
        {
          match: "plot-as-theme",
          when: { type: "equals", of: "last", value: "t2" },
          hint: "That statement retells what happens in the plot. A theme is a message that could apply beyond this story.",
        },
        {
          match: "character-trait-as-theme",
          when: { type: "equals", of: "last", value: "t3" },
          hint: "That statement is about Mara. Ask whether the idea is stated so that it would also fit other people.",
        },
      ],
      model:
        "Covering seedlings is a single action. Planting again after the frost is a series of events. Not giving up describes Mara's character across the story. A message that persistence can turn a loss into growth applies to anyone, so it is the theme.",
      right: "That order moves from an action to events to a trait to a message about life.",
      supports: sharedSupports(
        ["The theme is a message about ___. It is not only about ___."],
        ["The theme is bigger than the plot because it applies to ___."],
        ["Rather than retelling events, the theme states that ___."],
      ),
      justify: {
        prompt: "Which reasons show the last statement is the theme and not just part of the plot?",
        options: justifyOptions(
          "It is a message that would also fit other people, not only Mara.",
          "It explains what the events in the story add up to.",
          "It mentions the garden, the most important object in the story.",
          "It is the only statement that does not name a character.",
        ),
        model:
          "A theme is a message about life that the plot supports, so it should hold beyond one character.",
      },
      explain: {
        prompt: "What changed in your ranking, and how is a theme different from a plot detail?",
        frames: fr(
          ["The theme is a message about ___.", "A plot detail tells ___."],
          [
            "I ranked ___ last because it is a message about ___, while ___ only tells what happens.",
          ],
          ["Unlike the plot statements, the theme applies to ___, so it ranks above them."],
          [
            "A theme generalizes beyond the narrative; the statement that does so, ___, is the only one that could fit another story.",
          ],
        ),
        mustMention: [
          {
            id: "message",
            label: "that a theme is a message beyond one character",
            any: ["message", "lesson", "life", "anyone", "everyone", "people", "general"],
          },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "What question could you ask yourself to tell a small detail from a central idea or theme?",
    frames: {
      ee: ["I can ask: does it cover ___?", "A detail is ___."],
      dev: [
        "I can ask whether the statement covers ___ or only ___.",
        "A theme is different because ___.",
      ],
      exp: ["To separate them, I test whether the other statements ___ the one I picked."],
      br: [
        "I treat the candidate as an idea only if every other statement can be read as support for it, which means ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
