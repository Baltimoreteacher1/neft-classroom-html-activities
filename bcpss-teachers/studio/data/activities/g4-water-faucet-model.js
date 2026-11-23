// Concept Builder (process-model): how long a tap runs and how far it is open set how much water is used (grade 4 math in a water context).
// The flow rates are sample values for practice, not measurements. Every rule is generated from the same two rates so the table cannot drift.

const FLOWS = [
  { id: "full", per: 2, say: "Wide open, the tap fills 2 gallons each minute" },
  { id: "half", per: 1, say: "Half open, the tap fills 1 gallon each minute" },
];
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

const gallonRules = FLOWS.flatMap((f) =>
  [1, 2, 3, 4, 5, 6].map((m) => ({
    when: [
      { var: "flow", op: "eq", value: f.id },
      { var: "minutes", op: "eq", value: String(m) },
    ],
    value: String(f.per * m),
    say: `${f.say}, so ${plural(m, "minute")} uses ${m} x ${f.per} = ${f.per * m} gallons.`,
    ruleId: `${f.id}-${m}`,
  })),
);
gallonRules.push({
  when: [],
  value: "0",
  say: "The tap runs for 0 minutes, so no water is used.",
  ruleId: "tap-off",
});

const gallonValues = [
  ...new Set(FLOWS.flatMap((f) => [1, 2, 3, 4, 5, 6].map((m) => f.per * m))),
].sort((a, b) => a - b);
const quartRules = gallonValues.map((v) => ({
  when: [{ out: "gallons", op: "eq", value: String(v) }],
  value: String(v * 4),
  say: `${plural(v, "gallon")} is ${v} x 4 = ${v * 4} quarts, because 1 gallon is 4 quarts.`,
  ruleId: `gal-${v}`,
}));
quartRules.push({
  when: [],
  value: "0",
  say: "No water is used, so there are 0 quarts.",
  ruleId: "no-water",
});

const tiers = (visual, bank, frame) => ({
  ee: {
    directions: "Move the slider and the tap setting. Read the gallons and quarts that change.",
    frames: frame.ee,
    wordBank: bank,
    visual,
  },
  dev: { frames: frame.dev, wordBank: bank.slice(0, 3) },
  exp: { frames: frame.exp },
  br: {},
});

export default {
  id: "g4-water-faucet-model",
  engine: "concept-builder",
  kind: "process-model",
  title: "How much water does the tap use?",
  grade: "4",
  band: "3-5",
  subject: "interdisciplinary",
  lessonId: "g4-interdisciplinary-water-in-our-community",
  standards: ["4.MD.A.2"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to Common Core grade 4 measurement (liquid volume) and used in an interdisciplinary water unit; not mapped to a district unit sequence. The flow rates are sample values.",
  },
  vocabIds: ["gallon", "quart", "conserve"],
  minutes: 12,
  intro:
    "A school sink can run wide open or half open. Change how many minutes the tap runs and how far it is open, and watch how many gallons and quarts of water are used.",
  model: {
    title: "A school sink",
    variables: [
      {
        id: "minutes",
        label: "Minutes the tap runs",
        type: "slider",
        min: "0",
        max: "6",
        step: "1",
        start: "2",
        unit: "minutes",
      },
      {
        id: "flow",
        label: "How far the tap is open",
        type: "toggle",
        options: [
          { id: "full", label: "Wide open (2 gallons each minute)" },
          { id: "half", label: "Half open (1 gallon each minute)" },
        ],
        start: "full",
      },
    ],
    outputs: [
      {
        id: "gallons",
        label: "Water used",
        unit: "gallons",
        min: "0",
        max: "12",
        rules: gallonRules,
      },
      {
        id: "quarts",
        label: "The same water in quarts",
        unit: "quarts",
        min: "0",
        max: "48",
        rules: quartRules,
      },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt: "Set the model so the tap uses exactly 6 gallons of water.",
      goal: "Gallons used equals 6",
      target: { vars: { minutes: "3", flow: "full" }, log: [] },
      check: { type: "equals", of: "out.gallons", value: "6" },
      answerText: "6 gallons",
      hints: [
        "Think about how many gallons come out in one minute at each tap setting.",
        "Try a setting, read the gallons, and decide whether you need more minutes or fewer.",
        "There is more than one way to reach the goal: another tap setting also works with a different number of minutes.",
      ],
      misconceptions: [
        {
          match: "too-much",
          when: { type: "equals", of: "out.gallons", value: "8" },
          hint: "That uses more water than the goal. Count by the gallons each minute and stop when you reach the goal.",
        },
        {
          match: "stopped-early",
          when: { type: "equals", of: "out.gallons", value: "4" },
          hint: "That is less than the goal. Think about how many more minutes the tap needs to run.",
        },
      ],
      model:
        "At 2 gallons each minute, count by 2s: 2, 4, 6. The tap reaches the goal after 3 minutes. Half open, the tap fills 1 gallon each minute, so it would need 6 minutes.",
      right: "That tap setting and time use exactly the goal.",
      supports: tiers(null, ["minutes", "gallons", "each minute", "wide open", "half open"], {
        ee: ["The tap runs ___ minutes.", "It uses ___ gallons."],
        dev: ["At ___ gallons each minute, ___ minutes uses ___ gallons."],
        exp: ["I multiplied ___ gallons each minute by ___ minutes to get ___ gallons."],
      }),
      explain: {
        prompt: "What did you change, and what happened to the number of gallons? Why?",
        frames: {
          ee: ["I changed ___.", "The gallons went ___."],
          dev: ["When I changed ___, the gallons went ___ because ___."],
          exp: ["Each minute the tap adds ___ gallons, so ___ minutes uses ___ gallons."],
          br: [
            "Because the amount of water is the rate times the time, doubling the minutes doubles the gallons, as long as ___.",
          ],
        },
        mustMention: [
          {
            id: "rate",
            label: "gallons each minute or minutes",
            any: ["each minute", "per minute", "minute", "times", "multipl"],
          },
        ],
        criteria: [
          { id: "c1", label: "I said what I changed." },
          { id: "c2", label: "I said what happened to the gallons." },
          { id: "c3", label: "I gave a reason that uses minutes and gallons each minute." },
        ],
      },
    },
    {
      id: "t2",
      prompt:
        "A class needs the tap to run for at least 4 minutes so everyone can wash their hands in turns, but wants to use no more than 5 gallons. Set the model to meet both goals.",
      goal: "At least 4 minutes and no more than 5 gallons",
      target: { vars: { minutes: "4", flow: "half" }, log: [] },
      check: {
        type: "all",
        checks: [
          { type: "relation", left: "vars.minutes", op: "ge", right: { value: "4" } },
          { type: "relation", left: "out.gallons", op: "le", right: { value: "5" } },
        ],
      },
      answerText: "half open",
      hints: [
        "You have two goals. Check each one on its own, and then check both together.",
        "Running the tap for more minutes uses more water. What else can you change to use less water each minute?",
        "Try the tap setting that lets less water out each minute.",
      ],
      misconceptions: [
        {
          match: "met-time-only",
          when: {
            type: "all",
            checks: [
              { type: "relation", left: "vars.minutes", op: "ge", right: { value: "4" } },
              { type: "relation", left: "out.gallons", op: "gt", right: { value: "5" } },
            ],
          },
          hint: "The tap runs long enough, but it uses too much water. Look at the gallons each minute for your tap setting.",
        },
        {
          match: "met-water-only",
          when: {
            type: "all",
            checks: [
              { type: "relation", left: "vars.minutes", op: "lt", right: { value: "4" } },
              { type: "relation", left: "out.gallons", op: "le", right: { value: "5" } },
            ],
          },
          hint: "That uses little water, but the tap does not run long enough for everyone. Check the minutes.",
        },
      ],
      model:
        "Wide open, 4 minutes uses 8 gallons, which is too much. Half open uses 1 gallon each minute, so 4 minutes uses 4 gallons, which is at least 4 minutes and no more than 5 gallons.",
      right: "Both goals are met.",
      supports: tiers(null, ["at least", "no more than", "minutes", "gallons", "half open"], {
        ee: ["I need ___ minutes.", "I can use ___ gallons."],
        dev: ["To meet both goals I set the tap ___ and ran it ___ minutes."],
        exp: ["Half open, ___ minutes uses ___ gallons, so both goals are met because ___."],
      }),
      explain: {
        prompt:
          "Why did wide open not work for this class? Use minutes and gallons in your answer.",
        frames: {
          ee: ["Wide open uses too ___.", "Half open uses ___ gallons."],
          dev: [
            "Wide open did not work because ___ minutes uses ___ gallons, which is more than ___.",
          ],
          exp: [
            "Wide open adds ___ gallons each minute, so ___ minutes would use ___ gallons, which breaks the goal of ___.",
          ],
          br: [
            "Since the class needs at least four minutes, the only way to stay at or under five gallons is to lower the rate to ___ gallon each minute.",
          ],
        },
        mustMention: [
          {
            id: "compare",
            label: "comparing the two settings",
            any: ["wide", "half", "more", "less", "too much"],
          },
        ],
        criteria: [
          { id: "c1", label: "I compared wide open with half open." },
          { id: "c2", label: "I used numbers of minutes and gallons." },
        ],
      },
    },
    {
      id: "t3",
      prompt:
        "A class wants to measure the water in quarts. Set the model so the tap uses exactly 20 quarts.",
      goal: "Quarts used equals 20",
      target: { vars: { minutes: "5", flow: "half" }, log: [] },
      check: { type: "equals", of: "out.quarts", value: "20" },
      answerText: "20 quarts",
      hints: [
        "Remember how many quarts make 1 gallon. Then think how many gallons make the amount you want.",
        "Divide the number of quarts you want by the number of quarts in 1 gallon to find the gallons.",
        "Once you know the gallons, choose a setting and a number of minutes that use that many gallons.",
      ],
      misconceptions: [
        {
          match: "four-gallons",
          when: { type: "equals", of: "out.quarts", value: "16" },
          hint: "Check the quarts the model shows. How many gallons would make the amount you want?",
        },
        {
          match: "too-many-quarts",
          when: { type: "equals", of: "out.quarts", value: "24" },
          hint: "That is more quarts than the goal. Work backward from the quarts you want to the gallons.",
        },
      ],
      model:
        "Since 1 gallon is 4 quarts, the number of gallons is the quarts divided by 4. For 12 quarts that is 3 gallons. Then choose a tap setting and a time that use that many gallons.",
      right: "The tap uses exactly the goal amount.",
      supports: tiers(null, ["quarts", "gallons", "divide", "multiply", "each minute"], {
        ee: ["1 gallon is ___ quarts.", "I need ___ gallons."],
        dev: ["I divided ___ quarts by ___ to find ___ gallons."],
        exp: ["Because 1 gallon is 4 quarts, ___ quarts is ___ gallons, so I set the tap to ___."],
      }),
      justify: {
        prompt:
          "Which statements explain why the number of quarts is bigger than the number of gallons for the same water?",
        options: [
          {
            id: "j1",
            text: "A quart is a smaller unit than a gallon, so it takes more quarts to hold the same water.",
            ok: true,
          },
          {
            id: "j2",
            text: "Quarts are heavier than gallons.",
            ok: false,
            hint: "Quarts and gallons measure how much space the liquid fills, not how heavy it is.",
          },
          { id: "j3", text: "One gallon is the same amount of water as 4 quarts.", ok: true },
          {
            id: "j4",
            text: "The tap runs faster when you count in quarts.",
            ok: false,
            hint: "The tap runs at the same speed no matter which unit you use to measure.",
          },
        ],
        min: 2,
        model:
          "A gallon is made of 4 quarts. Because a quart is smaller, the same water measures more quarts than gallons.",
      },
      explain: {
        prompt: "How did you find the number of gallons that makes 20 quarts? Explain your steps.",
        frames: {
          ee: ["1 gallon is ___ quarts.", "I found ___ gallons."],
          dev: ["I divided ___ by ___ to get ___ gallons, then I set the tap to ___."],
          exp: [
            "Since 1 gallon is 4 quarts, I divided the quarts by 4, and then I chose a setting and a time that use ___ gallons.",
          ],
          br: [
            "Working backward from the quarts, I divided by 4 to get ___ gallons, and I checked it by multiplying ___ by 4.",
          ],
        },
        mustMention: [{ id: "divide", label: "dividing by 4", any: ["divid", "4", "four"] }],
        criteria: [
          { id: "c1", label: "I said how many quarts are in a gallon." },
          { id: "c2", label: "I said how I used it to find the gallons." },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "How could a family or a school use the model to decide how to conserve water? Tell what you would change and why.",
    frames: {
      ee: ["We could ___.", "That would use ___ water."],
      dev: ["We could ___, so the tap would use ___ gallons instead of ___."],
      exp: ["If we ___, then ___, so we could conserve ___ gallons."],
      br: [
        "By reducing ___ from ___ to ___, a school could conserve ___ gallons, which supports ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
