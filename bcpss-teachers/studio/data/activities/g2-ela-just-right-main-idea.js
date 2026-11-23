// Concept Builder (scale-sort, grade 2 ELA): order sentences from one small detail up to a sentence that is too big, and find the one that is just right.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

const LABEL = { "t1-ew": "earthworm", "t2-rain": "rain", "t3-helmet": "helmet" };

const AXIS = {
  label: "How much of the paragraph the sentence covers",
  low: "only one detail",
  high: "more than the paragraph",
};

const supports = (kind) => ({
  ee: {
    frames: [
      "This sentence is a detail.",
      "This sentence is the main idea.",
      "This sentence is too big.",
    ],
    wordBank: ["detail", "main idea", "covers", "too big", "whole paragraph"],
    directions:
      "Use the Earlier and Later buttons to move each sentence. Small things go at the top.",
    oral: `Read the ${kind} paragraph out loud. Then read each sentence and ask: how much does it cover?`,
  },
  dev: {
    frames: ["___ covers only one detail.", "___ covers the whole paragraph."],
    wordBank: ["covers", "whole paragraph", "detail"],
  },
  exp: { frames: ["I put ___ in the middle because it covers every detail but nothing more."] },
  br: {},
});

const explain = () => ({
  prompt: "Which sentence is the main idea of the paragraph, and why does it sit where it does?",
  frames: fr(
    ["The main idea is ___.", "It covers the whole paragraph."],
    ["The main idea is ___ because it covers ___ and ___."],
    [
      "I put ___ just before the biggest sentence because it covers every detail in the paragraph and goes no further.",
    ],
    [
      "The main idea is the sentence that every detail supports, and it stays inside what the paragraph says.",
    ],
  ),
  mustMention: [
    {
      id: "covers",
      label: "what the main idea covers",
      any: ["whole", "all", "every", "covers", "details", "paragraph"],
    },
  ],
  criteria: [
    { id: "c1", label: "I named the main idea." },
    { id: "c2", label: "I said why it covers the whole paragraph." },
  ],
});

const task = ({ id, passage, items, order, hints, model, miss, justify }) => ({
  id,
  prompt: `Read the paragraph. ${passage} Order the four sentences from the smallest to the biggest.`,
  goal: "Smallest at the top, biggest at the bottom",
  setup: { axis: AXIS, items },
  target: { order },
  check: { type: "order", of: "order", expected: order },
  hints,
  misconceptions: miss,
  model,
  right:
    "Yes. The sentence just before the biggest one covers the whole paragraph and nothing more.",
  supports: supports(LABEL[id]),
  ...(justify ? { justify } : {}),
  explain: explain(),
});

export default {
  id: "g2-ela-just-right-main-idea",
  engine: "concept-builder",
  kind: "scale-sort",
  title: "Too small, just right or too big?",
  grade: "2",
  band: "k-2",
  subject: "ela",
  lessonId: "g2-ela-main-idea-informational-text",
  standards: ["RI.2.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to RI.2.2; not mapped to a district unit sequence. Paragraphs and sentences are original.",
  },
  vocabIds: ["main-idea", "detail", "paragraph", "mostly", "support"],
  minutes: 15,
  intro:
    "A main idea is not too small and not too big. It covers every detail in a paragraph and nothing more. You will put sentences in order from small to big and find the one that is just right.",
  model: {
    axis: AXIS,
    items: [
      { id: "ew-main", text: "Earthworms help soil and plants." },
      { id: "ew-big", text: "Animals live in many places." },
      { id: "ew-detail", text: "Their tunnels let air and water reach plant roots." },
      { id: "ew-two", text: "Earthworms dig tunnels and eat dead leaves." },
    ],
  },
  tasks: [
    task({
      id: "t1-ew",
      passage:
        "Earthworms live in soil. They dig long tunnels as they move. The tunnels let air and water reach plant roots. Worms also eat bits of dead leaves, and what they leave behind helps plants grow.",
      items: [
        { id: "ew-main", text: "Earthworms help soil and plants." },
        { id: "ew-big", text: "Animals live in many places." },
        { id: "ew-detail", text: "Their tunnels let air and water reach plant roots." },
        { id: "ew-two", text: "Earthworms dig tunnels and eat dead leaves." },
      ],
      order: ["ew-detail", "ew-two", "ew-main", "ew-big"],
      hints: [
        "Ask of each sentence: how many sentences in the paragraph does it cover?",
        "Find the sentence that covers just one fact. It goes at the top.",
        "Find the sentence that talks about more than worms do in this paragraph. It goes at the bottom.",
      ],
      model:
        "The tunnels sentence covers one fact, so it is first. Digging tunnels and eating leaves covers two facts, so it is second. 'Earthworms help soil and plants' covers all the facts, so it is third. 'Animals live in many places' goes far past the paragraph, so it is last.",
      miss: [
        {
          match: "main-idea-first",
          when: { type: "equals", of: "first", value: "ew-main" },
          hint: "Does that sentence cover only one detail, or does it cover the whole paragraph?",
          model: "A sentence that covers the whole paragraph is bigger than a single detail.",
        },
        {
          match: "main-idea-last",
          when: { type: "equals", of: "last", value: "ew-main" },
          hint: "Is there a sentence that says more than this paragraph does?",
          model: "A sentence that talks about all animals goes past what this paragraph says.",
        },
      ],
      justify: {
        prompt: "Which reasons show that 'Earthworms help soil and plants' is the best main idea?",
        options: [
          { id: "j1", text: "It covers both the tunnels and the dead leaves.", ok: true },
          { id: "j2", text: "Every detail in the paragraph explains it.", ok: true },
          {
            id: "j3",
            text: "It is the shortest sentence.",
            ok: false,
            hint: "How short a sentence is does not make it the main idea. Ask whether the details explain it.",
          },
          {
            id: "j4",
            text: "It is the first sentence I read.",
            ok: false,
            hint: "A main idea can be anywhere. Check what it covers instead of where it sits.",
          },
        ],
        model:
          "The tunnels and the dead leaves both show that earthworms help soil and plants, and each detail in the paragraph explains it.",
      },
    }),
    task({
      id: "t2-rain",
      passage:
        "Rain falls from clouds. Plants take in rain water through their roots. Rain fills ponds and rivers, where animals drink. People collect rain in barrels to water gardens.",
      items: [
        { id: "rn-big", text: "Water is found all over Earth." },
        { id: "rn-detail", text: "People collect rain in barrels." },
        { id: "rn-main", text: "Rain gives water to living things." },
        { id: "rn-two", text: "Plants and animals use rain water." },
      ],
      order: ["rn-detail", "rn-two", "rn-main", "rn-big"],
      hints: [
        "Ask of each sentence: does it cover one fact, two facts or every fact?",
        "One sentence is only about people. Is that small or big?",
        "A sentence that does not mention rain at all goes past the paragraph.",
      ],
      model:
        "People and barrels is one detail, so it is first. Plants and animals covers two groups, so it is second. 'Rain gives water to living things' covers plants, animals and people, so it is third. A sentence about all the water on Earth is bigger than the paragraph, so it is last.",
      miss: [
        {
          match: "main-idea-first",
          when: { type: "equals", of: "first", value: "rn-main" },
          hint: "Does that sentence cover only one detail, or all of them?",
          model:
            "A sentence about plants, animals and people is bigger than a sentence about people alone.",
        },
        {
          match: "main-idea-last",
          when: { type: "equals", of: "last", value: "rn-main" },
          hint: "Is there a sentence that talks about more than rain?",
          model: "A sentence about water all over Earth is bigger than a paragraph about rain.",
        },
      ],
    }),
    task({
      id: "t3-helmet",
      passage:
        "A bike helmet protects your head. A hard shell spreads a bump over the whole helmet. Soft foam inside helps slow a hit. A strap holds the helmet in place.",
      items: [
        { id: "hm-main", text: "A helmet has parts that work together to protect your head." },
        { id: "hm-detail", text: "A strap holds the helmet in place." },
        { id: "hm-big", text: "Safety gear keeps people safe." },
        { id: "hm-two", text: "A helmet has a hard shell and soft foam." },
      ],
      order: ["hm-detail", "hm-two", "hm-main", "hm-big"],
      hints: [
        "Ask of each sentence: how many parts of the helmet does it name?",
        "One sentence names just one part. It goes first.",
        "One sentence is about all kinds of safety gear, not just helmets. Where does it go?",
      ],
      model:
        "The strap sentence names one part, so it is first. The shell and foam sentence names two parts, so it is second. 'A helmet has parts that work together to protect your head' covers the shell, the foam and the strap, so it is third. 'Safety gear keeps people safe' talks about much more than helmets, so it is last.",
      miss: [
        {
          match: "main-idea-first",
          when: { type: "equals", of: "first", value: "hm-main" },
          hint: "Does that sentence name one part, or all of the parts?",
          model: "A sentence that covers every part is bigger than a sentence about one part.",
        },
        {
          match: "main-idea-last",
          when: { type: "equals", of: "last", value: "hm-main" },
          hint: "Is there a sentence about more than helmets?",
          model: "A sentence about all safety gear goes past this paragraph about a helmet.",
        },
      ],
      justify: {
        prompt:
          "Which reasons show that the helmet sentence about parts working together is just right?",
        options: [
          { id: "j1", text: "It names the shell, the foam and the strap together.", ok: true },
          { id: "j2", text: "It says what the whole paragraph is mostly about.", ok: true },
          {
            id: "j3",
            text: "It has more words than the other sentences.",
            ok: false,
            hint: "Length alone does not make a main idea. Ask whether every detail supports it.",
          },
          {
            id: "j4",
            text: "It talks about people and gear everywhere.",
            ok: false,
            hint: "That is too big for this paragraph. Check what the paragraph is mostly about.",
          },
        ],
        model:
          "The sentence covers the shell, the foam and the strap, and it says what the paragraph is mostly about, which is how a helmet protects your head.",
      },
    }),
  ],
  reflection: {
    prompt: "How can you tell if a sentence is too small, just right or too big for a main idea?",
    frames: fr(
      ["A detail is small.", "The main idea covers the whole paragraph."],
      [
        "A sentence that covers one fact is too small.",
        "A sentence that covers more than the paragraph is too big.",
      ],
      [
        "I check how much of the paragraph a sentence covers. The main idea covers all the details and nothing more.",
      ],
      [
        "I test a main idea by asking whether every detail supports it and whether it stays inside what the paragraph says.",
      ],
    ),
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
