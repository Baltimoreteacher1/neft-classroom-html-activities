// Known-bad and known-good fixtures (the negative controls) for verifiers 1-3. Each bad fixture is built to trip exactly one
// detector; if a detector stops firing, tools/content/verify.mjs exits 3 before it sweeps any real content.
import { BANDS } from "./texts.mjs";

const math = (strings, extra = {}) => ({
  id: "g6-math-fixture",
  grade: "6",
  subject: "Math",
  studio: { activities: strings.map((mission) => ({ mission })), ...extra },
  lessons: [],
});
const choice = (q, options, answer) => ({
  activities: [
    {
      mission: "Pick the best answer.",
      payload: { items: [{ q, options, answer, why: "Check it." }] },
    },
  ],
});
const withStudio = (studio) => ({
  id: "g6-math-fixture",
  grade: "6",
  subject: "Math",
  studio,
  lessons: [],
});

const ARITH_BAD = [
  {
    name: "wrong sum",
    target: math(["First I add 20 + 15 = 36 to find the total."]),
    expect: ["ARITH_VALUE_MISMATCH"],
  },
  {
    name: "area written in cubic units",
    target: math(["A box is 3 in by 4 in by 5 in, so 3 in × 4 in × 5 in = 60 in^2."]),
    expect: ["ARITH_UNIT_MISMATCH"],
  },
  {
    name: "volume in square inches",
    target: math(["The volume of the box is 60 square inches."]),
    expect: ["ARITH_UNIT_MISMATCH"],
  },
  {
    name: "wrong percent of",
    target: math(["Since 25 percent of 80 is 30, the sale price drops."]),
    expect: ["ARITH_VALUE_MISMATCH"],
  },
  {
    name: "wrong percent phrase",
    target: math(["We know that 8 out of 20 is 45 percent."]),
    expect: ["ARITH_PERCENT_WRONG"],
  },
  {
    name: "wrong ratio simplification",
    target: math(["Notice that 6 to 9 in simplest form is 4 to 6."]),
    expect: ["ARITH_SIMPLIFY_WRONG"],
  },
  {
    name: "false equivalent ratios",
    target: math(["The ratios 2 to 3 and 4 to 5 are equivalent ratios."]),
    expect: ["ARITH_RATIO_EQUIV_FALSE"],
  },
  {
    name: "wrong unit rate",
    target: math(["A car drives 240 miles in 4 hours, so it goes 50 miles per hour."]),
    expect: ["ARITH_RATE_WRONG"],
  },
  {
    name: "false comparison",
    target: math(["Remember that 3/8 is greater than 1/2 in this case."]),
    expect: ["ARITH_COMPARISON_FALSE"],
  },
  {
    name: "wrong key on an expression question",
    target: withStudio(choice("What is 6 × 7?", ["42", "36", "48"], 1)),
    expect: ["ARITH_KEY_MISMATCH"],
  },
  {
    name: "distractor that is also correct",
    target: withStudio(choice("What is 6 × 4?", ["24", "4 × 6", "12 × 2"], 0)),
    expect: ["ARITH_DUPLICATE_CORRECT"],
  },
  {
    name: "cloze filled with a wrong number",
    target: withStudio({
      activities: [
        {
          kind: "cloze",
          mission: "Fill the gaps.",
          payload: { text: "Add the parts: 9 + 6 = {1}.", answers: ["16"], bank: ["16", "15"] },
        },
      ],
    }),
    expect: ["ARITH_VALUE_MISMATCH"],
  },
  {
    name: "word sort puts a non-equivalent ratio in the equivalent group",
    target: withStudio({
      activities: [
        {
          mission: "Sort the ratios.",
          payload: {
            categories: [{ name: "Equivalent to 2 to 3" }, { name: "Not equivalent" }],
            items: [
              { text: "4 to 6", cat: 0 },
              { text: "5 to 6", cat: 0 },
            ],
          },
        },
      ],
    }),
    expect: ["ARITH_SORT_WRONG"],
  },
  {
    name: "match pairs a rate with the wrong unit rate",
    target: withStudio({
      activities: [
        {
          mission: "Match each rate.",
          payload: { pairs: [{ l: "12 dollars for 3 pounds", r: "5 dollars per pound" }] },
        },
      ],
    }),
    expect: ["ARITH_RATE_WRONG"],
  },
];

const ARITH_GOOD = [
  {
    name: "true statements in every claim shape",
    target: math([
      "First I add 20 + 15 = 35.",
      "A box is 3 in by 4 in by 5 in, so 3 in × 4 in × 5 in = 60 in^3.",
      "The volume of the box is 60 cubic inches.",
      "Since 25 percent of 80 is 20, the price drops.",
      "We know that 8 out of 20 is 40 percent.",
      "Notice that 6 to 9 in simplest form is 2 to 3.",
      "The ratios 2 to 3 and 4 to 6 are equivalent ratios.",
      "A car drives 240 miles in 4 hours, so it goes 60 miles per hour.",
      "Remember that 3/8 is less than 1/2 in this case.",
    ]),
  },
  {
    name: "wrong work on purpose is exempt",
    target: withStudio({
      activities: [
        {
          mission: "Check the work.",
          payload: {
            items: [
              {
                wrong: "Dee rides 20 miles in 4 hours, so her speed is 80 miles per hour.",
                options: [
                  "5 miles per hour because 20 ÷ 4 = 5",
                  "24 miles per hour because 20 + 4 = 24",
                ],
                answer: 0,
                why: "Divide the miles by the hours: 20 ÷ 4 = 5.",
              },
            ],
          },
        },
        { mission: "A friend says 5 + 3 = 9. What do you say to your friend?" },
      ],
    }),
  },
  {
    name: "algebra, estimates, rounding and conversions are skipped not flagged",
    target: math([
      "Solve 2x + 3 = 11 for x.",
      "My estimate of 38 + 52 is about 40 + 50 = 90.",
      "Since 1 ÷ 3 = 0.33, the answer is a little less than one half.",
      "On the map 1 cm = 4 meters in real life.",
    ]),
  },
  {
    name: "multiple choice with a unique correct key",
    target: withStudio(choice("What is 6 × 7?", ["42", "36", "48"], 0)),
  },
];

const prose = (n, make) => Array.from({ length: n }, (_, i) => make(i));
const LONG = (i) =>
  `Scientists examine ${i} remarkable ecosystems, interpreting extraordinarily complicated environmental relationships throughout comprehensive investigations.`;
const SIMPLE = (i) => `I see ${i} red dogs. They run to the park and sit.`;
const bandsFixture = (grade, unitStrings, byBand) => ({
  id: "g3-ela-fixture",
  grade,
  subject: "ELA",
  studio: {
    activities: unitStrings.map((mission) => ({ mission })),
    frames: Object.fromEntries(BANDS.map((b) => [b, byBand[b]])),
  },
  lessons: [],
});
// Distinct strings (the verifiers count a repeated string once), identical prose.
const flat = (s) => prose(8, (i) => `${s} (${i})`);

const READ_BAD = [
  {
    name: "unit text far above the grade ceiling",
    target: bandsFixture("2", prose(12, LONG), {
      l1_2: flat("I can see it."),
      l3_4: flat("I can see it now."),
      l5_6: flat("I can see it clearly now."),
    }),
    expect: ["READ_UNIT_OVER_CEILING"],
  },
  {
    name: "band scaffold above its ceiling",
    target: bandsFixture("2", prose(12, SIMPLE), {
      l1_2: flat("I can see it."),
      l3_4: flat("I can see it now."),
      l5_6: prose(8, LONG),
    }),
    expect: ["READ_BAND_OVER_CEILING"],
  },
  {
    name: "difficulty drops between bands",
    target: bandsFixture("2", prose(12, SIMPLE), {
      l1_2: prose(8, (i) => `Scientists examine ${i} remarkable ecosystems carefully.`),
      l3_4: flat("I can see it."),
      l5_6: flat("I can see it now."),
    }),
    expect: ["READ_BAND_DECREASING"],
  },
];
const READ_GOOD = [
  {
    name: "simple text with rising band difficulty",
    target: bandsFixture("3", prose(12, SIMPLE), {
      l1_2: flat("I can see it."),
      l3_4: flat("I can see the red dog at the park."),
      l5_6: flat("When I look at the park, I can describe the red dogs that are running."),
    }),
  },
];

const vocab = (v, lessonVocab = []) => ({
  id: "g3-ela-fixture",
  grade: "3",
  subject: "ELA",
  studio: { vocab: v, activities: [{ mission: "Use the words in a sentence." }] },
  lessons: lessonVocab.length ? [{ vocab: lessonVocab }] : [],
});
const VOCAB_BAD = [
  {
    name: "an everyday word authored as Tier 3",
    target: vocab([{ term: "see", tier: 3 }]),
    expect: ["VOCAB_TIER_DISAGREE"],
  },
  {
    name: "a word used in four subjects authored as Tier 3",
    target: vocab([{ term: "event", tier: 3 }]),
    expect: ["VOCAB_TIER_DISAGREE"],
  },
  {
    name: "studio and lesson disagree on a tier",
    target: vocab([{ term: "ratio", tier: 3 }], [{ term: "ratio", tier: 2 }]),
    expect: ["VOCAB_TIER_INCONSISTENT"],
  },
];
const VOCAB_GOOD = [
  {
    name: "domain-specific terms authored as Tier 3",
    target: vocab([
      { term: "quotient", tier: 3 },
      { term: "photosynthesis", tier: 3 },
    ]),
  },
];

export const FIXTURES = {
  arithmetic: { bad: ARITH_BAD, good: ARITH_GOOD },
  readability: { bad: READ_BAD, good: READ_GOOD },
  "vocab-tier": { bad: VOCAB_BAD, good: VOCAB_GOOD },
};
