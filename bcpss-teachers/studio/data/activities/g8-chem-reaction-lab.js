// concept-builder / process-model: change the container, the reaction and the reactants, and watch the balance reading, the new substances and the atom count (MS-PS1-2, MS-PS1-5).
// The rules are original classroom-level cause-and-effect statements. Balance changes are whole grams of invented practice data because process-model prints values as integers or fractions.
const rule = (ruleId, value, say, when = []) => ({ ruleId, value, say, when });

const sup = (ee, dev, exp) => ({
  ee: { directions: ee.d, frames: ee.f, wordBank: ee.w },
  dev: { frames: dev.f, wordBank: dev.w || [] },
  exp: { frames: exp },
  br: {},
});

const explainFrames = (ee, dev, exp, br) => ({ ee, dev, exp, br });

export default {
  id: "g8-chem-reaction-lab",
  engine: "concept-builder",
  kind: "process-model",
  title: "Reaction Lab: Open Cups, Sealed Bags",
  grade: "8",
  band: "6-8",
  subject: "science",
  lessonId: "g8-science-chemical-reactions-conservation-of-mass",
  standards: ["MS-PS1-2", "MS-PS1-5"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS MS-PS1-2 and MS-PS1-5; not mapped to a district unit sequence. This activity is original practice.",
  },
  vocabIds: [
    "chemical-reaction",
    "reactant",
    "product",
    "atom",
    "conservation-of-mass",
    "closed-system",
    "evidence",
  ],
  minutes: 18,
  intro:
    "Use the model to change the container, the reaction and the reactants. Watch what happens to the balance reading and to the atoms, then explain what changed and why.",
  model: {
    title: "Set up the reaction",
    variables: [
      {
        id: "container",
        label: "Container",
        type: "toggle",
        options: [
          { id: "open", label: "Open cup" },
          { id: "sealed", label: "Sealed bag" },
        ],
        start: "open",
      },
      {
        id: "action",
        label: "Reaction",
        type: "toggle",
        options: [
          { id: "none", label: "Not started" },
          { id: "go", label: "Let it happen" },
        ],
        start: "none",
      },
      {
        id: "reactants",
        label: "Reactants",
        type: "toggle",
        options: [
          { id: "soda", label: "Baking soda and vinegar" },
          { id: "wool", label: "Steel wool heated in air" },
        ],
        start: "soda",
      },
    ],
    outputs: [
      {
        id: "balance",
        label: "Change in balance reading",
        unit: "g",
        min: "-3",
        max: "3",
        rules: [
          rule("idle", "0", "Nothing has reacted yet, so the balance reading has not changed.", [
            { var: "action", op: "eq", value: "none" },
          ]),
          rule(
            "gas-escapes",
            "-2",
            "The reaction makes a gas that escapes from the open cup and carries its mass away, so the reading drops.",
            [
              { var: "container", op: "eq", value: "open" },
              { var: "reactants", op: "eq", value: "soda" },
            ],
          ),
          rule(
            "oxygen-joins",
            "3",
            "Oxygen from the air joins the iron in the open air, so the steel wool and its product gain mass.",
            [
              { var: "container", op: "eq", value: "open" },
              { var: "reactants", op: "eq", value: "wool" },
            ],
          ),
          rule(
            "sealed-same",
            "0",
            "The container is sealed, so no matter can enter or leave and the reading does not change.",
          ),
        ],
      },
      {
        id: "newsub",
        label: "New substance formed (1 means yes)",
        min: "0",
        max: "1",
        rules: [
          rule(
            "none-yet",
            "0",
            "No reaction has happened, so the substances are still the ones you started with.",
            [{ var: "action", op: "eq", value: "none" }],
          ),
          rule(
            "new-substance",
            "1",
            "The atoms rearranged into new substances with different properties, so this was a chemical reaction.",
          ),
        ],
      },
      {
        id: "atoms",
        label: "Atoms created or destroyed",
        min: "-5",
        max: "5",
        rules: [
          rule("no-reaction", "0", "Nothing has reacted, so the atoms are exactly as they were.", [
            { var: "action", op: "eq", value: "none" },
          ]),
          rule(
            "rearranged",
            "0",
            "Atoms are only rearranged in a chemical reaction. None are created and none are destroyed.",
          ),
        ],
      },
    ],
    stages: [
      {
        id: "before",
        label: "Before the reaction",
        when: [{ var: "action", op: "eq", value: "none" }],
      },
      {
        id: "after",
        label: "After the reaction",
        when: [{ var: "action", op: "eq", value: "go" }],
      },
    ],
  },
  tasks: [
    {
      id: "t1",
      prompt:
        "Baking soda and vinegar react in a cup on a balance. Set the model so the balance reading goes down.",
      goal: "A setting where the reaction happens and the balance reading drops",
      target: { vars: { container: "open", action: "go", reactants: "soda" }, log: [] },
      check: { type: "equals", of: "out.balance", value: "-2" },
      answerText: "Open cup, reaction on",
      hints: [
        "Think about what the reaction makes, and whether that product can get out of the container.",
        "The reading only drops when something that has mass leaves the container. Which container lets that happen?",
        "Make sure the reaction has actually started, and then check which container you have chosen.",
      ],
      misconceptions: [
        {
          match: "sealed-cannot-lose-mass",
          when: { type: "equals", of: "vars.container", value: "sealed" },
          hint: "In a sealed bag nothing can leave. Would the balance reading go down?",
        },
        {
          match: "reaction-not-started",
          when: { type: "equals", of: "vars.action", value: "none" },
          hint: "Nothing has reacted yet, so nothing has changed. Start the reaction and watch the reading.",
        },
      ],
      model:
        "A different test: a sealed jar of reactants stays at the same mass, and the same reactants in an open dish lose mass as a gas escapes. The container decides whether the balance reading can change.",
      right:
        "Yes. In an open cup the gas escaped and carried its mass away, so the reading went down.",
      supports: sup(
        {
          d: "Choose the container that lets a gas escape. Then start the reaction and read the change in the balance.",
          f: [
            "The container is ___.",
            "The gas goes into the ___.",
            "The balance reading goes ___.",
          ],
          w: ["open", "sealed", "gas", "escapes", "down", "mass"],
        },
        {
          f: [
            "The reading drops because the ___ escapes from the ___ cup.",
            "The mass of the gas is ___ the cup.",
          ],
          w: ["open system", "gas"],
        },
        ["The balance reading goes down because the system is ___ and ___ leaves with its ___."],
      ),
      explain: {
        prompt:
          "What changed in the model readings when you made the reading drop, and why did it change that way?",
        frames: explainFrames(
          ["The reading went ___.", "The gas went into the ___."],
          ["The reading dropped because ___ left the ___.", "The atoms were ___."],
          ["When the reaction happened in the ___, the reading changed by ___ because ___."],
          [
            "The decrease in the balance reading is explained by ___, while the atoms themselves were ___.",
          ],
        ),
        mustMention: [
          {
            id: "gas",
            label: "the gas that escaped",
            any: ["gas", "carbon dioxide", "escape", "left"],
          },
          { id: "open", label: "the open container", any: ["open", "cup", "not closed"] },
        ],
        criteria: [
          { id: "c1", label: "I said what changed on the balance." },
          { id: "c2", label: "I named what left the container." },
          { id: "c3", label: "I said why it could leave." },
        ],
      },
    },
    {
      id: "t2",
      prompt:
        "The same reaction happens with baking soda and vinegar, but this time the balance reading must stay the same. Set up the model so the reaction happens and the reading does not change.",
      goal: "A setting where the reaction happens and the balance reading stays the same",
      target: { vars: { container: "sealed", action: "go", reactants: "soda" }, log: [] },
      check: {
        type: "all",
        checks: [
          { type: "equals", of: "vars.action", value: "go" },
          { type: "equals", of: "out.balance", value: "0" },
        ],
      },
      answerText: "Sealed bag, reaction on",
      hints: [
        "The reading stays the same when no matter can leave or enter. Look at the container choices.",
        "Make sure the reaction really happens. A reading that stays the same because nothing happened is not what this task asks for.",
        "Check the output that says whether a new substance formed. It must say yes.",
      ],
      misconceptions: [
        {
          match: "reaction-skipped",
          when: { type: "equals", of: "vars.action", value: "none" },
          hint: "The reading stayed the same because nothing reacted. Start the reaction and see what the balance does.",
        },
        {
          match: "open-container",
          when: { type: "equals", of: "vars.container", value: "open" },
          hint: "In an open container the product gas can leave. Check what the balance reads after the reaction.",
        },
      ],
      model:
        "A sealed jar holds a fizzing reaction at 80.0 g before and 80.0 g after. The gas stays inside the jar, so no matter leaves and the total mass is conserved.",
      right:
        "Yes. The reaction happened inside a sealed bag, so no matter left and the reading did not change.",
      supports: sup(
        {
          d: "Start the reaction. Choose the container that keeps all the gas inside. Check that a new substance formed.",
          f: ["The container is ___.", "The reaction ___ place.", "The reading stays ___."],
          w: ["sealed", "reaction", "takes place", "same", "inside"],
        },
        {
          f: [
            "The mass stays the same because the ___ is closed.",
            "A new substance ___ even though the reading did not change.",
          ],
          w: ["closed system", "conservation of mass"],
        },
        [
          "The reading does not change because ___, even though the atoms are ___ into new substances.",
        ],
      ),
      justify: {
        prompt: "Which reasons explain why the reading stayed the same? Choose all that apply.",
        options: [
          {
            id: "j1",
            text: "The bag is sealed, so no gas can leave and the system keeps all of its matter.",
            ok: true,
          },
          {
            id: "j2",
            text: "The atoms were rearranged into new substances, not created or destroyed.",
            ok: true,
          },
          {
            id: "j3",
            text: "The reading stayed the same because no reaction happened.",
            ok: false,
            hint: "Check the output for new substances. A reaction did happen in your setup.",
          },
          {
            id: "j4",
            text: "Gas has no mass, so a gas cannot change the balance reading.",
            ok: false,
            hint: "Gas is matter and has mass. The open cup lost mass when gas escaped.",
          },
        ],
        min: 2,
        model:
          "In a closed system nothing enters or leaves, and a reaction only rearranges atoms, so the total mass stays the same.",
      },
      explain: {
        prompt:
          "How can a reaction happen and the balance reading still not change? Use the words closed system and atoms.",
        frames: explainFrames(
          ["The bag was ___.", "The atoms were ___."],
          ["The reading did not change because the ___ was closed and the atoms were ___."],
          ["Although a reaction happened, the mass stayed the same since ___ and ___."],
          [
            "Conservation of mass holds in a closed system because ___, so the reading is unchanged even though ___.",
          ],
        ),
        mustMention: [
          {
            id: "closed",
            label: "the sealed or closed system",
            any: ["closed", "sealed", "bag", "nothing left", "nothing could"],
          },
          {
            id: "atoms",
            label: "atoms rearranged",
            any: ["atom", "rearrang", "same matter", "conserv"],
          },
        ],
      },
    },
    {
      id: "t3",
      prompt:
        "Steel wool is heated in the open air. Set the model so that the balance reading goes up after the reaction.",
      goal: "A setting where the reaction happens and the balance reading rises",
      target: { vars: { container: "open", action: "go", reactants: "wool" }, log: [] },
      check: { type: "equals", of: "out.balance", value: "3" },
      answerText: "Open air, steel wool, reaction on",
      hints: [
        "A reading goes up when something with mass joins the material. Think about what is in the air.",
        "Pick the reactants that take something in from the air, and make sure the system is open so that the air can reach them.",
        "Check three settings: the container, the reaction and the reactants. Only one combination makes the reading rise.",
      ],
      misconceptions: [
        {
          match: "baking-soda-chosen",
          when: { type: "equals", of: "vars.reactants", value: "soda" },
          hint: "Baking soda and vinegar make a gas that leaves an open cup. Which reactants take something in instead?",
        },
        {
          match: "sealed-cannot-gain",
          when: { type: "equals", of: "vars.container", value: "sealed" },
          hint: "In a sealed container nothing can come in from the air. Would the reading go up?",
        },
      ],
      model:
        "A different test: an iron nail left in open air for weeks has a slightly greater mass at the end, because oxygen from the air combined with the iron to make rust.",
      right:
        "Yes. In open air, oxygen joined the iron, so the product has more mass than the steel wool alone.",
      supports: sup(
        {
          d: "Choose the reactants that take something from the air. Keep the container open. Start the reaction.",
          f: ["The air has ___.", "The ___ joins the iron.", "The reading goes ___."],
          w: ["oxygen", "air", "joins", "up", "open"],
        },
        {
          f: ["The reading rises because ___ from the ___ joined the ___."],
          w: ["oxygen", "iron"],
        },
        [
          "The mass increased because the system was ___ and ___ from the air became part of the ___.",
        ],
      ),
      explain: {
        prompt:
          "Compare this result with the baking soda in the open cup. Why did one reading go down and the other go up, even though atoms are never created or destroyed?",
        frames: explainFrames(
          ["In the cup, a ___ left.", "With the steel wool, ___ came in."],
          [
            "The reading went down for the cup because ___ left, but up for the steel wool because ___ joined.",
          ],
          [
            "Although both were open, the cup lost ___ while the steel wool gained ___, so the readings moved in opposite directions.",
          ],
          [
            "Both results are consistent with conservation of mass: in each case ___ crossed the boundary of the open system.",
          ],
        ),
        mustMention: [
          {
            id: "oxygen",
            label: "oxygen or air joining",
            any: ["oxygen", "air", "joined", "joins", "came in"],
          },
          {
            id: "gas",
            label: "gas leaving the cup",
            any: ["gas", "left", "escape", "carbon dioxide"],
          },
        ],
      },
    },
    {
      id: "t4",
      prompt:
        "Set the model so that the balance reading changes, while the output for atoms created or destroyed still reads zero.",
      goal: "A reaction in which the reading changes but atoms are not created or destroyed",
      target: { vars: { container: "open", action: "go", reactants: "soda" }, log: [] },
      check: {
        type: "all",
        checks: [
          { type: "not", check: { type: "equals", of: "out.balance", value: "0" } },
          { type: "equals", of: "out.atoms", value: "0" },
        ],
      },
      answerText: "Open container, reaction on",
      hints: [
        "The reading only changes when matter crosses the boundary of the container. Which container allows that?",
        "The reaction has to happen for the reading to change at all.",
        "Both reactants work, so choose the container and the reaction setting first.",
      ],
      misconceptions: [
        {
          match: "sealed-container",
          when: { type: "equals", of: "vars.container", value: "sealed" },
          hint: "In a sealed container the balance reading cannot change. Which container lets matter in or out?",
        },
        {
          match: "reaction-not-started",
          when: { type: "equals", of: "vars.action", value: "none" },
          hint: "No reaction has happened, so nothing changes. Start the reaction first.",
        },
      ],
      model:
        "A different example: an open pan of boiling water loses mass as vapor leaves, yet no atoms of water were destroyed. The reading changes because matter crosses the boundary of an open system.",
      right:
        "Yes. The reading changed because matter crossed the boundary of the open container, and the atoms were still only rearranged.",
      supports: sup(
        {
          d: "Choose a container that lets matter in or out. Start the reaction. Then read the output for atoms.",
          f: ["The container is ___.", "The reading ___.", "The atoms are ___ or destroyed: ___."],
          w: ["open", "changes", "atoms", "created", "zero"],
        },
        {
          f: ["The reading changed because matter ___ the container, but the atoms ___."],
          w: ["crossed", "rearranged", "open system"],
        },
        ["The reading changes in an open system because ___, but the number of atoms is ___."],
      ),
      explain: {
        prompt:
          "Why can the balance reading change even though atoms are never created or destroyed in a reaction?",
        frames: explainFrames(
          ["The container was ___.", "The atoms were ___."],
          [
            "The reading changed because ___ left or joined the open container, and the atoms were only ___.",
          ],
          [
            "The reading is not the same as the number of atoms: it changes whenever ___, even though ___.",
          ],
          [
            "A balance measures only what is inside the container, so ___ explains the change without contradicting conservation of mass.",
          ],
        ),
        mustMention: [
          {
            id: "boundary",
            label: "matter leaving or joining the open system",
            any: ["left", "leave", "escape", "joined", "came in", "open"],
          },
          {
            id: "atoms",
            label: "atoms not created or destroyed",
            any: ["atom", "rearrang", "not destroyed", "conserv", "same number"],
          },
        ],
      },
    },
  ],
  reflection: {
    prompt:
      "How would you decide whether the mass of a reaction should stay the same? What would you check about the container first?",
    frames: {
      ee: ["I check if the container is ___.", "If it is sealed, the mass stays ___."],
      dev: [
        "First I check whether the container is ___, because ___.",
        "If it is open, I look for ___ leaving or joining.",
      ],
      exp: ["Before predicting the mass I check whether ___, because ___ can ___ an open system."],
      br: [
        "To predict a balance reading I ask whether the system is closed and then ___; in either case the atoms are ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
