// Grade 1 concept-builder (process-model): a bean plant, how much light it gets and whether it gets water.
// All outcomes come from the rules in the model; nothing here is scored or timed. The cause-and-effect sentences are the evidence.
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });
const tiers = (ee, dev, exp) => ({
  ee: { frames: ee.frames, wordBank: ee.wordBank, directions: ee.directions },
  dev: { frames: dev.frames, wordBank: dev.wordBank },
  exp: { frames: exp },
  br: {},
});

export default {
  id: "g1-science-plant-light-model",
  engine: "concept-builder",
  kind: "process-model",
  title: "Light, water and a bean plant",
  grade: "1",
  band: "k-2",
  subject: "science",
  lessonId: "g1-science-plants-need-light",
  standards: ["K-LS1-1", "2-LS2-1"],
  curriculum: {
    status: "standards-aligned",
    note: "Original model of a bean plant. Aligned to K-LS1-1 and 2-LS2-1; not mapped to a district unit sequence.",
  },
  vocabIds: ["sunlight", "water", "leaf", "grow", "need", "observe"],
  minutes: 12,
  intro:
    "This is a model of a bean plant. Change how much light the plant gets and whether it gets water. Watch what happens to the plant and read why. Press Check when your plant matches the goal.",
  model: {
    title: "A bean plant in a pot",
    variables: [
      {
        id: "light",
        label: "Light",
        type: "slider",
        min: "0",
        max: "2",
        step: "1",
        start: "1",
        valueLabels: ["no light", "a little light", "lots of light"],
      },
      {
        id: "water",
        label: "Water",
        type: "toggle",
        options: [
          { id: "none", label: "no water" },
          { id: "enough", label: "enough water" },
        ],
        start: "enough",
      },
    ],
    outputs: [
      {
        id: "health",
        label: "How the plant looks",
        min: "0",
        max: "3",
        rules: [
          {
            when: [{ var: "water", op: "eq", value: "none" }],
            value: "0",
            say: "With no water the plant droops and dries out, even when it has bright light.",
            ruleId: "no-water",
          },
          {
            when: [{ var: "light", op: "eq", value: "0" }],
            value: "1",
            say: "With no light the leaves turn pale and the stem grows long and weak. The plant cannot make its own food.",
            ruleId: "no-light",
          },
          {
            when: [{ var: "light", op: "eq", value: "1" }],
            value: "2",
            say: "With a little light the plant stays alive and grows slowly. Its leaves are light green.",
            ruleId: "dim-light",
          },
          {
            when: [],
            value: "3",
            say: "With lots of light and enough water the plant grows strong with dark green leaves.",
            ruleId: "enough",
          },
        ],
      },
    ],
    stages: [
      { id: "alive", label: "The plant is alive", detail: "It has a stem and leaves.", when: [] },
      {
        id: "green",
        label: "The leaves are green",
        detail: "The plant is making some food.",
        when: [{ out: "health", op: "ge", value: "2" }],
      },
      {
        id: "strong",
        label: "The plant is strong",
        detail: "Dark green leaves and a sturdy stem.",
        when: [{ out: "health", op: "ge", value: "3" }],
      },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt: "Set the light and the water so the bean plant grows strong with dark green leaves.",
      goal: "The plant is strong",
      target: { vars: { light: "2", water: "enough" }, log: [] },
      check: { type: "equals", of: "out.health", value: "3" },
      hints: [
        "Read the sentence under the plant. It tells what the plant needs.",
        "Look at the light setting. Which setting gives the strongest plant?",
        "Check the water setting too. A strong plant needs both things.",
      ],
      misconceptions: [
        {
          match: "no-water",
          when: { type: "equals", of: "why.health", value: "no-water" },
          hint: "The plant looks dry. Light is not enough by itself. What else does a plant need?",
          model:
            "A plant needs both light and water. With no water it dries out, even in bright light.",
        },
        {
          match: "little-light",
          when: { type: "equals", of: "why.health", value: "dim-light" },
          hint: "The plant is alive but it is not strong yet. What could you change to give its leaves more to catch?",
        },
      ],
      model:
        "Choose lots of light and enough water. The plant makes plenty of food in its leaves and grows strong with dark green leaves.",
      right: "Right. The plant has the light and water it needs.",
      supports: tiers(
        {
          frames: ["The plant has ___ light.", "The plant has ___ water."],
          wordBank: ["lots of light", "enough water", "strong"],
          directions: "Try different settings. Read what happens.",
        },
        {
          frames: ["The plant is strong because it gets ___ and ___."],
          wordBank: ["light", "water", "strong"],
        },
        ["The plant grows strong when it gets ___ and ___ because ___."],
      ),
      explain: {
        prompt: "What did your plant need to grow strong? How do you know?",
        frames: fr(
          ["The plant needs ___.", "The plant needs ___."],
          ["The plant needs ___ and ___ to grow strong.", "I know because the plant ___."],
          ["I know the plant needs ___ and ___ because when I gave it ___, it ___."],
          ["The model shows that the plant is strong only when ___ and ___, so ___."],
        ),
        mustMention: [
          { id: "light", label: "light", any: ["light", "sun"] },
          { id: "water", label: "water", any: ["water"] },
        ],
        criteria: [
          { id: "c1", label: "I named what the plant needs." },
          { id: "c2", label: "I said how I know from the model." },
        ],
      },
    },
    {
      id: "t2",
      prompt: "Give the plant enough water but no light. Watch what happens to the plant.",
      goal: "The plant has water but no light",
      target: { vars: { light: "0", water: "enough" }, log: [] },
      check: { type: "equals", of: "why.health", value: "no-light" },
      hints: [
        "Move the light setting to the end where the light is gone.",
        "Keep the water setting on enough water.",
        "Read the sentence under the plant and look at the color of the leaves.",
      ],
      misconceptions: [
        {
          match: "still-light",
          when: { type: "equals", of: "why.health", value: "dim-light" },
          hint: "The plant still has a little light. Move the light all the way down.",
        },
        {
          match: "bright-light",
          when: { type: "equals", of: "why.health", value: "enough" },
          hint: "That plant has lots of light. We want to see what happens when the light is gone.",
        },
      ],
      model:
        "Set the light to no light and keep enough water. The leaves turn pale and the stem grows long and weak, because without light the plant cannot make its own food.",
      supports: tiers(
        {
          frames: ["No light. The plant is ___.", "The leaves are ___."],
          wordBank: ["pale", "weak", "no light"],
          directions: "Turn the light all the way down. Keep the water on.",
        },
        {
          frames: ["Without light the plant is ___ and ___."],
          wordBank: ["pale", "weak", "no light"],
        },
        ["Without light the leaves turn ___ because the plant cannot ___."],
      ),
      explain: {
        prompt: "The plant had water. Why did it still look pale and weak?",
        frames: fr(
          ["It had water but no ___.", "It looks ___."],
          ["The plant had water but no ___, so it looks ___."],
          ["Even though the plant had water, it looks ___ because without light it cannot ___."],
          ["Water is not enough: without light the plant cannot make ___, so ___."],
        ),
        mustMention: [{ id: "light", label: "light", any: ["light", "sun", "food"] }],
      },
    },
    {
      id: "t3",
      prompt: "Give the plant lots of light but no water. Watch what happens to the plant.",
      goal: "The plant has light but no water",
      target: { vars: { light: "2", water: "none" }, log: [] },
      check: { type: "equals", of: "why.health", value: "no-water" },
      hints: [
        "Switch the water setting to the end where the water is gone.",
        "Keep the light bright.",
        "Read the sentence under the plant and see how the leaves look.",
      ],
      misconceptions: [
        {
          match: "has-water",
          when: { type: "equals", of: "vars.water", value: "enough" },
          hint: "The plant still has water. Switch the water off to see what happens.",
        },
      ],
      model:
        "Set the water to no water and keep lots of light. The plant droops and dries out, because a plant needs water as well as light.",
      supports: tiers(
        {
          frames: ["No water. The plant is ___.", "The leaves are ___."],
          wordBank: ["droops", "dry", "no water"],
          directions: "Turn the water off. Keep the light bright.",
        },
        { frames: ["With light but no water, the plant ___."], wordBank: ["droops", "dries out"] },
        ["Even with lots of light, the plant ___ because it has no ___."],
      ),
      explain: {
        prompt: "The plant had lots of light. Why did it droop?",
        frames: fr(
          ["It had light but no ___.", "It droops."],
          ["The plant had light but no ___, so it ___."],
          ["Even with lots of light, the plant droops because it needs ___ too."],
          ["Light alone is not enough: a plant also needs ___ because ___."],
        ),
        mustMention: [{ id: "water", label: "water", any: ["water"] }],
      },
    },
    {
      id: "t4",
      prompt:
        "This plant has been in the dark. Help it get better: set the light and water so it can grow strong again.",
      goal: "The plant is strong again",
      start: { vars: { light: "0", water: "enough" }, log: [] },
      target: { vars: { light: "2", water: "enough" }, log: [] },
      check: { type: "equals", of: "out.health", value: "3" },
      hints: [
        "The plant is pale because of one setting. Which setting made it pale?",
        "Change that setting and watch the sentence under the plant.",
        "Keep the water on. Only one setting needs to change.",
      ],
      misconceptions: [
        {
          match: "water-off",
          when: { type: "equals", of: "vars.water", value: "none" },
          hint: "The plant already had enough water. Turning it off makes the plant dry. Keep the water on.",
        },
        {
          match: "still-dim",
          when: { type: "equals", of: "why.health", value: "dim-light" },
          hint: "A little light helps, but the plant is not strong yet. Give it more.",
        },
      ],
      model:
        "Move the light to lots of light and keep enough water. The plant gets the light it needs to make food, and its leaves turn green again.",
      supports: tiers(
        {
          frames: ["The plant needs more ___.", "Now the plant is ___."],
          wordBank: ["light", "water", "better", "strong"],
          directions: "Move one setting. Keep the other the same.",
        },
        { frames: ["I changed the ___. Now the plant is ___."], wordBank: ["light", "better"] },
        ["I changed only the ___ and the plant got better, so ___ was what the plant needed."],
      ),
      explain: {
        prompt: "What did you change to help the plant? Why did that help?",
        frames: fr(
          ["I changed the ___.", "The plant got ___."],
          ["I changed the ___. This helped because the plant needs ___."],
          ["I changed only the ___ and the plant got better because it needs ___ to make food."],
          [
            "By changing one setting and keeping the other the same, I showed that the plant needs ___ because ___.",
          ],
        ),
        mustMention: [{ id: "light", label: "light", any: ["light", "sun"] }],
      },
    },
  ],
  reflection: {
    prompt: "What did the model show you about what a plant needs?",
    frames: {
      ee: ["A plant needs ___.", "A plant needs ___ and ___."],
      dev: ["A plant needs ___ and ___.", "Without ___ the plant ___."],
      exp: ["The model showed me that a plant needs ___ and ___ because ___."],
      br: ["From the model, I learned that a plant needs ___ and ___, and I know because ___."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
