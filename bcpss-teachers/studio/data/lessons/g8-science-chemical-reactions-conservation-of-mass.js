// Lesson pack: Chemical Reactions and Conservation of Mass (grade 8 science, MS-PS1-2 and MS-PS1-5).
// Original data and examples; every numeric answer carries a calc the validator recomputes. Mass values use rounded atomic masses (H 1, C 12, O 16).
const table = (alt, head, rows, extra = {}) => ({
  kind: "table",
  alt,
  w: 480,
  h: 240,
  head,
  rows,
  ...extra,
});
const text = (x, y, t, extra = {}) => ({
  t: "text",
  x,
  y,
  text: t,
  anchor: "middle",
  fill: "ink",
  size: 16,
  ...extra,
});
const ATOM = { C: ["navy", "paper"], H: ["sky", "ink"], O: ["coral", "paper"] };
const atom = (cx, cy, el, r = 17) => [
  { t: "circle", cx, cy, r, fill: ATOM[el][0], stroke: "ink", strokeWidth: 2 },
  text(cx, cy, el, { size: 14, weight: 700, fill: ATOM[el][1] }),
];
const bond = (x1, y1, x2, y2) => ({ t: "line", x1, y1, x2, y2, stroke: "ink", strokeWidth: 3 });
/** A molecule: bonds first, then atoms on top. atoms: [[el, x, y]], bonds: [[i, j]] by atom index. */
const molecule = (atoms, bonds) => [
  ...bonds.map(([i, j]) => bond(atoms[i][1], atoms[i][2], atoms[j][1], atoms[j][2])),
  ...atoms.flatMap(([el, x, y]) => atom(x, y, el)),
];

const methane = {
  kind: "shapes",
  alt: "A particle model of methane burning. On the left: one methane molecule with 1 carbon atom and 4 hydrogen atoms, and two oxygen molecules with 2 oxygen atoms each. On the right: one carbon dioxide molecule and two water molecules. Both sides have 1 carbon atom, 4 hydrogen atoms and 4 oxygen atoms.",
  longDesc:
    "Reactants: CH4 (one carbon, four hydrogen) and two O2 molecules (four oxygen atoms in all). Products: CO2 (one carbon, two oxygen) and two H2O molecules (four hydrogen, two oxygen). Count on each side: carbon 1, hydrogen 4, oxygen 4.",
  w: 480,
  h: 300,
  items: [
    text(110, 22, "Before: reactants", { weight: 700 }),
    text(370, 22, "After: products", { weight: 700 }),
    ...molecule(
      [
        ["C", 60, 140],
        ["H", 60, 100],
        ["H", 60, 180],
        ["H", 20, 140],
        ["H", 100, 140],
      ],
      [
        [0, 1],
        [0, 2],
        [0, 3],
        [0, 4],
      ],
    ),
    ...molecule(
      [
        ["O", 150, 95],
        ["O", 186, 95],
      ],
      [[0, 1]],
    ),
    ...molecule(
      [
        ["O", 150, 185],
        ["O", 186, 185],
      ],
      [[0, 1]],
    ),
    bond(222, 140, 262, 140),
    {
      t: "poly",
      points: [
        [262, 128],
        [282, 140],
        [262, 152],
      ],
      fill: "ink",
    },
    ...molecule(
      [
        ["O", 305, 80],
        ["C", 345, 80],
        ["O", 385, 80],
      ],
      [
        [0, 1],
        [1, 2],
      ],
    ),
    ...molecule(
      [
        ["O", 320, 160],
        ["H", 296, 192],
        ["H", 344, 192],
      ],
      [
        [0, 1],
        [0, 2],
      ],
    ),
    ...molecule(
      [
        ["O", 410, 160],
        ["H", 386, 192],
        ["H", 434, 192],
      ],
      [
        [0, 1],
        [0, 2],
      ],
    ),
    text(110, 250, "1 C, 4 H, 4 O", { size: 18, weight: 700 }),
    text(370, 250, "1 C, 4 H, 4 O", { size: 18, weight: 700 }),
    text(240, 285, "Same atoms, new arrangement", { size: 15 }),
  ],
};

const launchTable = table(
  "A table with columns setup, mass before in grams, and mass after in grams. Open cup: 150.0 before and 148.6 after. Sealed bag: 150.0 before and 150.0 after.",
  ["Setup", "Before (g)", "After (g)"],
  [
    ["Open cup", "150.0", "148.6"],
    ["Sealed bag", "150.0", "150.0"],
  ],
  {
    highlight: [
      [0, 2],
      [1, 2],
    ],
  },
);

export default {
  id: "g8-science-chemical-reactions-conservation-of-mass",
  kind: "lesson",
  title: "Chemical Reactions and Conservation of Mass",
  subtitle:
    "Use evidence and a particle model to explain why the mass of a closed system stays the same",
  grade: "8",
  band: "6-8",
  subject: "science",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS MS-PS1-2 and MS-PS1-5; not mapped to a district unit sequence. Data, pictures and wording are original.",
  },
  standards: ["MS-PS1-2", "MS-PS1-5", "RST.6-8.7"],
  wida: {
    eld: ["ELD-SC"],
    klus: ["Explain", "Argue"],
    domains: ["Speaking", "Writing", "Reading"],
    cluster: "6-8",
  },
  contentObjective:
    "I can use data on properties and mass, and a model of atoms, to decide whether a chemical reaction happened and to explain why the total mass of a closed system does not change.",
  languageObjective:
    "I can write a claim, evidence and reasoning statement using 'because' and 'this shows that' to explain a mass measurement.",
  languageDemands: {
    functions: [
      "make a claim and support it with data",
      "explain a cause using a model",
      "describe a change over time",
    ],
    structures: [
      "The mass stayed the same (changed) because ___.",
      "The evidence is ___ before and ___ after, which shows that ___.",
      "The atoms were rearranged, so ___.",
    ],
    discourse:
      "Claim, evidence and reasoning in a two-turn partner discussion, followed by a written explanation that cites two measurements and one idea about atoms.",
    barriers: [
      "'product' means a result of multiplication or an item for sale in everyday English, and a substance made by a reaction in science",
      "'system', 'matter' and 'mass' have everyday meanings that do not match their science meanings, and 'mass' is often confused with 'weight'",
      "'react', 'reactant' and 'reaction' share a root but are different parts of speech",
      "long noun phrases such as 'the total mass of the products' pack several ideas into one subject",
    ],
    oralRehearse: [
      "The mass stayed the same because nothing could enter or leave the sealed bag.",
      "The atoms were only rearranged, so the total mass of the products equals the total mass of the reactants.",
    ],
    writeScaffold:
      "My claim is that ___. The evidence is that the mass was ___ before and ___ after. This shows that ___ because the atoms ___.",
  },
  vocab: {
    collection: "g8-science-chemical-reactions-conservation-of-mass",
    ids: [
      "chemical-reaction",
      "physical-change",
      "reactant",
      "product",
      "atom",
      "molecule",
      "conservation-of-mass",
      "closed-system",
      "precipitate",
      "evidence",
      "claim",
      "reasoning",
    ],
  },
  launch: {
    title: "Notice and Wonder: where did the mass go?",
    visual: launchTable,
    prompts: [
      "What do you notice about the two rows?",
      "What do you wonder about the 1.4 grams that seem to be missing in the first row?",
      "What do you think was different about the two setups?",
    ],
    teacherNote:
      "Show only the table first. Do not say what was mixed. Take noticings such as 'both start at 150' and 'one row loses mass and the other does not'. Then reveal that both setups had the same amounts of baking soda and vinegar. The open cup sat on a balance with nothing over it. The second setup was sealed inside a zip bag, and the bag puffed up. Write the students' explanations for the difference on the board and leave them up; the lesson returns to them in the closing share. Do not say the word 'gas' before a student does.",
  },
  teach: {
    model: [
      "A chemical reaction happens when substances interact and form new substances with different properties. Evidence includes a new gas that bubbles out of a solid and a liquid, a solid that forms when two clear liquids are mixed (a precipitate), a permanent color change, or a temperature change that was not caused by heating or cooling from outside. No single sign is proof, so scientists compare properties before and after. Melting ice and dissolving sugar are physical changes: the substances are still the same.",
      "Everything is made of atoms. In a chemical reaction the bonds in the reactants break, the atoms rearrange, and new bonds form the products. The atoms themselves are not created or destroyed. We can show this with a model. When methane burns, CH4 and two O2 molecules become CO2 and two H2O molecules. Count the atoms: 1 carbon, 4 hydrogen and 4 oxygen on each side.",
      "Because the number of each kind of atom does not change, the total mass does not change either. This is conservation of mass. In a closed system, where nothing can enter or leave, the mass before the reaction equals the mass after. For example, 16 grams of methane and 64 grams of oxygen make 44 grams of carbon dioxide and 36 grams of water: 80 grams on each side.",
      "Then why did the open cup lose mass? The cup was not a closed system. The reaction made carbon dioxide gas, and the gas escaped into the room, taking its mass with it. In the sealed bag the gas stayed inside, so the balance read the same. The reverse can happen too: heated steel wool in open air gains mass because oxygen from the air combines with the iron.",
      "A strong scientific explanation has three parts. The claim answers the question. The evidence is data, such as 150.0 grams before and 150.0 grams after. The reasoning uses a science idea, such as 'atoms are only rearranged', to explain why the evidence supports the claim. Always say whether the system was open or closed.",
    ],
    moves: [
      "Keep the particle model on the board all lesson and count atoms aloud on both sides. Have students point to each atom as they count.",
      "Insist on the question 'Was the system open or closed?' before any mass claim, and make students answer in a full sentence.",
      "Separate mass from weight and from volume: a puffed-up bag is bigger, but its mass is the same.",
      "Ask students to point to a number when they say 'evidence'. If they cannot point to a measurement, it is not yet evidence.",
      "Have students write 'because' sentences for every mass change, and read them back to a partner who listens for the science idea.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "choice",
      prompt:
        "A student tries to decide whether a chemical reaction happened. Which observation is the strongest evidence of a new substance?",
      choices: [
        "An ice cube got smaller as it melted.",
        "Sugar disappeared when it was stirred into water.",
        "Two clear liquids were mixed and a white solid that was not there before appeared.",
        "A glass of water got colder in the refrigerator.",
      ],
      answer: 2,
      hint: "Ask which observation shows something with different properties from the starting materials.",
      supports: {
        ee: {
          frames: ["A new ___ appeared.", "It was not there ___."],
          wordBank: ["new", "solid", "before", "after", "same"],
          visual: {
            kind: "flow",
            alt: "Two steps with an arrow. Step 1: two clear liquids. Step 2: a white solid appears.",
            steps: [
              { label: "Two clear liquids", icon: "flask" },
              { label: "A white solid appears", icon: "beaker" },
            ],
            w: 480,
            h: 180,
          },
          oral: "Point to the observation that shows something new. Say why it is new.",
        },
        dev: {
          frames: ["This is evidence of a chemical reaction because ___."],
          wordBank: ["evidence", "new substance", "properties"],
        },
        exp: {
          frames: [
            "The observation is strongest evidence because a ___ with different properties ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "In a sealed container, 16 g of methane burns completely with 64 g of oxygen. The products are 44 g of carbon dioxide and some water. What is the mass of the water, in grams?",
      answer: 36,
      calc: "16+64-44",
      hint: "In a closed system the total mass of the products equals the total mass of the reactants. Find the total first.",
      supports: {
        ee: {
          frames: [
            "The reactants add up to ___ grams.",
            "The carbon dioxide is ___ grams, so the water is ___ grams.",
          ],
          wordBank: ["total", "add", "subtract", "grams", "same"],
          visual: table(
            "A grid with Reactants 16 plus 64 and Products 44 plus a missing amount.",
            ["Before (g)", "After (g)"],
            [["16 + 64", "44 + ?"]],
          ),
        },
        dev: {
          frames: ["Total before is ___ g, so total after is ___ g, and the water is ___ g."],
          wordBank: ["conservation of mass", "closed system"],
        },
        exp: {
          frames: [
            "Since mass is conserved in a closed system, the water must be ___ g because ___.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "Methane burns: CH4 + 2 O2 becomes CO2 + 2 H2O. How many oxygen atoms are on the product side?",
      answer: 4,
      calc: "2+2*1",
      hint: "Count oxygen atoms in each product molecule, then multiply by the number of molecules shown in front of it.",
      supports: {
        ee: {
          frames: [
            "CO2 has ___ oxygen atoms.",
            "Each H2O has ___ oxygen atom, and there are ___ H2O.",
          ],
          wordBank: ["count", "oxygen", "molecule", "atoms"],
          visual: methane,
        },
        dev: {
          frames: ["I counted ___ oxygen atoms in CO2 and ___ in the two H2O, for a total of ___."],
          wordBank: ["atom", "product"],
        },
        exp: {
          frames: [
            "The product side has ___ oxygen atoms because ___, which matches the reactant side.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt:
        "A student mixes baking soda and vinegar in an open cup on a balance, and the balance reading drops. Which explanation is best?",
      choices: [
        "A gas formed and escaped from the open cup, carrying its mass away.",
        "Mass was destroyed when the reaction took place.",
        "The atoms in the vinegar shrank.",
        "Baking soda always weighs less once it is wet.",
      ],
      answer: 0,
      hint: "Ask whether the cup was a closed system, and what could leave an open cup.",
      supports: {
        ee: {
          frames: ["The cup was ___.", "A ___ went into the room."],
          wordBank: ["open", "closed", "gas", "escaped"],
        },
        dev: {
          frames: ["The mass went down because ___ left the ___."],
          wordBank: ["open system", "gas", "mass"],
        },
        exp: {
          frames: [
            "Mass seems to disappear because the system was ___, so ___ left with its mass.",
          ],
        },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Open or closed? Three data cards",
    task: "Partner A and Partner B receive three data cards. Card A: vinegar and baking soda in an open cup, 150.0 g before and 148.6 g after. Card B: the same amounts sealed in a zip bag that puffs up, 150.0 g before and 150.0 g after. Card C: steel wool heated in open air, 20.0 g before and 21.4 g after. Partner A finds the change in mass for each card and decides whether each setup was open or closed. Partner B draws a quick particle sketch for Card B showing the same atoms before and after. They compare, then write one claim, evidence and reasoning statement that explains all three cards using the idea that atoms are rearranged and that gases can enter or leave an open system. (Teachers who run the baking soda and vinegar demonstration should use goggles and keep the cup away from faces; the data cards work without the demonstration.)",
    roles: ["Data and system analyst", "Particle modeler"],
    discussionCards: [
      {
        prompt: "Which cards were open systems? What could have entered or left in each one?",
        frame: "Card ___ was an open system because ___ could ___.",
      },
      {
        prompt:
          "What do the atoms do in a reaction? Where are the atoms after the reaction in Card B?",
        frame: "The atoms were ___, so the total mass ___.",
      },
      {
        prompt: "Card C gained mass. How can mass go up if mass is conserved?",
        frame: "The mass went up because ___ from the ___ joined the ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the same atoms, a new arrangement",
      visualOrModel: methane,
      teacherNote:
        "Project the particle model and have students count carbon, hydrogen and oxygen atoms on each side aloud. Then add the mass numbers from the lesson (16 + 64 = 80 and 44 + 36 = 80) next to the picture. Ask: 'If the atoms are the same, what must be true about the masses?' Then ask what would happen to the balance reading if the CO2 and the water vapor were allowed to leave the container.",
    },
    discuss: {
      title: "Say it: claim, evidence, reasoning",
      structure:
        "Turn and talk with a new data card. Partner 1 gives a claim about whether the mass changed and why. Partner 2 asks 'What is your evidence?' and then 'What is your reasoning?' Swap with a second card.",
      frames: [
        "My claim is that the mass ___ because ___.",
        "What is your evidence?",
        "The evidence is ___ before and ___ after.",
        "My reasoning is that the atoms ___, and the system was ___.",
      ],
    },
    apply: {
      title: "Use it: a sealed bag and an open cup",
      task: "A student seals 50.0 g of baking soda and vinegar in a bag. After the reaction the bag is puffed up and the balance reads 50.0 g. A second student does the same reaction in an open cup that starts at 50.0 g and ends at 48.9 g. Write a claim, evidence and reasoning explanation for each result. Use the words closed system, reactant, product and conservation of mass. Then predict what the first bag would read if the student cut it open on the balance, and explain your prediction.",
      successCriteria: [
        "I state a claim for each result and say whether the system was open or closed.",
        "I cite the before and after masses as evidence.",
        "I use atoms being rearranged, not destroyed, in my reasoning.",
        "I predict the cut-open reading and explain it with the escaping gas.",
      ],
    },
  },
  activities: [
    { engine: "escape-challenge", id: "g8-chem-escape" },
    { engine: "concept-builder", id: "g8-chem-reaction-lab" },
    { engine: "argument-builder", id: "g8-chem-argument" },
    { engine: "vocab-quest", id: "g8-chem-vocab-quest" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "In a sealed container, 12 g of carbon burns with 32 g of oxygen and forms only carbon dioxide. What is the mass of the carbon dioxide, in grams?",
        answer: 44,
        calc: "12+32",
        explain: "The container is closed, so the total mass is conserved: 12 plus 32 is 44 grams.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "In a closed container, 4 g of hydrogen reacts completely with 32 g of oxygen and forms only water. What is the mass of the water, in grams?",
        answer: 36,
        calc: "4+32",
        explain: "Total mass before is 4 plus 32, which is 36 grams. The water has all of it.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt:
          "A cup holding vinegar and baking soda reads 150.0 g before the reaction and 148.6 g after, in the open air. How many grams of gas escaped?",
        answer: 1.4,
        calc: "150-148.6",
        explain:
          "The mass that left the open cup is the difference: 150.0 minus 148.6 is 1.4 grams.",
      },
      {
        id: "i4",
        type: "choice",
        prompt:
          "Which statement best explains why the total mass stays the same in a closed system during a chemical reaction?",
        choices: [
          "Reactions only change the color of matter.",
          "Atoms are rearranged into new substances, but none are created or destroyed.",
          "The products always have the same mass as the largest reactant.",
          "Energy turns into mass to make up any difference.",
        ],
        answer: 1,
        explain:
          "Because no atoms are created or destroyed, the total number of each kind of atom, and so the total mass, stays the same.",
      },
      {
        id: "i5",
        type: "numeric",
        prompt:
          "Hydrogen and oxygen react to make water: 2 H2 + O2 becomes 2 H2O. How many hydrogen atoms are on the reactant side?",
        answer: 4,
        calc: "2*2",
        explain:
          "Each H2 molecule has 2 hydrogen atoms, and there are 2 molecules: 2 times 2 is 4 atoms.",
      },
      {
        id: "i6",
        type: "choice",
        prompt:
          "Steel wool weighs 20.0 g. It is heated in open air until it glows, and it then weighs 21.4 g. Which explanation is best?",
        choices: [
          "Heat adds mass to every metal.",
          "New iron atoms were created by the flame.",
          "The balance reads higher whenever something is heated.",
          "Oxygen from the air combined with the iron, so the product has more mass than the steel wool alone.",
        ],
        answer: 3,
        explain:
          "The system was open. Oxygen atoms from the air joined the iron, so the product contains more atoms than the steel wool did.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A student says mass was destroyed when a candle burned, because the candle got lighter on the balance. Explain the mistake using the words open system and gas.",
        answer:
          "The candle burned in an open system. Its wax combined with oxygen and made carbon dioxide gas and water vapor that escaped into the air, carrying their mass away. The atoms were not destroyed.",
        explain:
          "Mass is conserved. The missing mass is in the gases that left the open system, so the candle losing mass does not show that mass was destroyed.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt:
          "In a sealed flask, 10 g of substance A and 15 g of substance B react and make only one product. What is the mass of the product, in grams?",
        answer: 25,
        calc: "10+15",
        explain:
          "Closed system: the product has the total mass of the reactants, 10 plus 15, which is 25 grams.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which of these is a physical change?",
        choices: [
          "Ice melting into water.",
          "Iron rusting.",
          "Wood burning.",
          "Baking soda reacting with vinegar.",
        ],
        answer: 0,
        explain:
          "Melting changes the state of water but the substance is still water. The other changes make new substances.",
      },
      {
        id: "f3",
        type: "short",
        prompt:
          "A student claims mass vanishes when baking soda and vinegar fizz in an open cup. Write one sentence of evidence-based correction.",
        answer:
          "The cup lost mass because carbon dioxide gas escaped from the open cup, and in a sealed bag the mass stays the same.",
        explain:
          "The mass that seems to vanish is in the gas that left. Sealing the container would show the mass is conserved.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show how you use evidence and atoms to explain a mass measurement.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "In a closed container, 2 g of hydrogen reacts with 16 g of oxygen and makes water only. What is the mass of the water, in grams?",
        answer: 18,
        calc: "2+16",
        explain: "The total mass is conserved: 2 plus 16 is 18 grams of water.",
      },
      {
        id: "e2",
        type: "numeric",
        prompt:
          "A closed system holds 80 g of reactants. After the reaction, one product has a mass of 52 g and there is one other product. What is the mass of the other product, in grams?",
        answer: 28,
        calc: "80-52",
        explain:
          "The products must total 80 grams, so the other product is 80 minus 52, which is 28 grams.",
      },
      {
        id: "e3",
        type: "short",
        prompt:
          "Name two kinds of evidence that can show a chemical reaction happened, and say why one sign alone is not always enough.",
        answer:
          "A gas forming, a solid forming, a color change or a temperature change can be evidence. One sign alone is not enough because some physical changes also show it, so you compare properties before and after.",
        explain:
          "Scientists look for new substances with different properties, so they compare data before and after.",
      },
    ],
    successCriteria: [
      "I used conservation of mass in a closed system.",
      "I named two kinds of evidence for a reaction.",
      "I explained a mass change with open or closed systems and atoms.",
    ],
  },
  answerKey: {
    notes:
      "For the short-answer items look for the key ideas: the system was open (or closed), a gas (or other matter) left or entered, atoms were rearranged not destroyed, and the evidence is a measurement. Accept any two valid signs of a reaction for e3 (new gas, new solid, color change, temperature change, light). All numeric answers assume a closed system unless the item says open.",
    items: {
      g1: "Two clear liquids mixed and a white solid appeared. A new solid with different properties is strong evidence of a new substance.",
      g2: "36 g. Reactants total 16 plus 64, which is 80 g. 80 minus 44 is 36 g of water.",
      g3: "4. CO2 has 2 oxygen atoms and each of the 2 H2O has 1 oxygen atom: 2 plus 2 is 4.",
      g4: "A gas formed and escaped from the open cup, carrying its mass away.",
      i1: "44 g. 12 plus 32 is 44.",
      i2: "36 g. 4 plus 32 is 36.",
      i3: "1.4 g. 150.0 minus 148.6 is 1.4.",
      i4: "Atoms are rearranged but none are created or destroyed.",
      i5: "4. Two H2 molecules have 2 times 2 hydrogen atoms.",
      i6: "Oxygen from the air combined with the iron, so the product has more mass.",
      i7: "The candle burned in an open system. The wax and oxygen made gases (carbon dioxide and water vapor) that escaped. Mass was not destroyed.",
      f1: "25 g. 10 plus 15 is 25.",
      f2: "Ice melting into water.",
      f3: "Carbon dioxide gas escaped from the open cup. In a sealed bag the mass stays the same.",
      e1: "18 g. 2 plus 16 is 18.",
      e2: "28 g. 80 minus 52 is 28.",
      e3: "Any two of: gas forming, solid forming, color change, temperature change. One sign alone is not enough because physical changes can show signs too.",
    },
  },
  extension: {
    title: "Design a test: catch the missing gas",
    task: "In the open cup, 1.4 grams seemed to disappear. Design an investigation that tests the claim that the missing mass is the gas that escaped. List the materials you need, the variable you will change (open or closed), the variable you will measure (mass on a balance), and the variables you will keep the same (amounts of baking soda and vinegar, same balance). Predict the readings before and after for the sealed version, and explain your prediction with the idea that atoms are rearranged. Say what result would make you doubt your claim.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo usar evidencia y un modelo de átomos para explicar por qué la masa total de un sistema cerrado no cambia en una reacción química.",
      vocab: [
        { en: "chemical reaction", es: "reacción química", verified: true },
        { en: "reactant", es: "reactivo", verified: true },
        { en: "product", es: "producto", verified: true },
        { en: "atom", es: "átomo", verified: true },
        { en: "conservation of mass", es: "conservación de la masa", verified: true },
      ],
      familyPrompt:
        "Cuando cocinen, hablen de qué cambió. Pregunten: ¿se formó una sustancia nueva, o solo cambió la forma, como el hielo que se derrite? Digan cómo lo saben.",
    },
  },
  printables: ["organizer", "task-cards", "exit-ticket", "vocab-mat"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teach and guided practice 15. Partner work or the activities 20. Exit ticket 7. Closing language share 3, returning to the students' explanations from the launch. If time is short, run the escape room in one sitting and give the argument builder as a second-day writing task.",
    misconceptions: [
      "Mass disappears when something burns or fizzes: students trust the balance reading and ignore escaping gas. Ask 'Was the system open or closed? Where could gas go?' and have them count atoms.",
      "Dissolving or melting is a chemical reaction: students see something disappear. Ask whether the substance can be recovered by evaporating or freezing, and compare properties before and after.",
      "Atoms change into other atoms or turn into energy: use the particle model and count each element on both sides.",
      "A bigger bag means more mass: a puffed-up bag has a greater volume, not a greater mass. Separate volume from mass with a balance reading.",
      "One sign proves a reaction: temperature change, bubbles or color can also accompany physical changes. Require a comparison of properties before and after.",
    ],
    differentiation:
      "Entering and Emerging learners use the frames and word banks in each item, point to atoms in the particle model while counting, and keep the same tasks and answers as every other tier. Expanding and Bridging learners write the claim, evidence and reasoning as three connected sentences. Never reduce the science; reduce only the language load.",
    languageNotes:
      "Teach 'product' with two sentences, one from shopping and one from science, and let students sort them. Distinguish 'mass' (how much matter) from 'weight' (a pull of gravity measured in other units) in one sentence, then use 'mass' consistently. Practice the 'because' sentence chorally before partner work.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
