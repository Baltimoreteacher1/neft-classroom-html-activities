// argument-builder (CER): explain what happened to the mass in an open cup and a sealed bag using lab notebook data and a reference card (MS-PS1-2, MS-PS1-5, RST.6-8.7).
// All sources are written for this activity; the lab data are invented for practice.
export default {
  id: "g8-chem-argument",
  engine: "argument-builder",
  title: "Argue It: Where Did the Mass Go?",
  grade: "8",
  band: "6-8",
  subject: "science",
  lessonId: "g8-science-chemical-reactions-conservation-of-mass",
  standards: ["MS-PS1-2", "MS-PS1-5", "RST.6-8.1", "RST.6-8.7"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to NGSS MS-PS1-2 and MS-PS1-5; not mapped to a district unit sequence. This activity is original practice.",
  },
  vocabIds: [
    "chemical-reaction",
    "conservation-of-mass",
    "closed-system",
    "evidence",
    "claim",
    "reasoning",
  ],
  minutes: 25,
  intro:
    "Two lab groups ran the same reaction in different containers and got different readings. Read their notebooks and a reference card, then build a claim, evidence and reasoning explanation.",
  format: "cer",
  question:
    "When baking soda and vinegar react, was mass destroyed in the open cup? Use the data from both groups to explain what happened to the mass.",
  sources: [
    {
      id: "s1",
      title: "Group A lab notebook: open cup",
      byline: "Written for this activity",
      text: "Group A put the same amounts of baking soda and vinegar into a cup and placed the cup on a balance, with nothing covering it. Before mixing, the cup and its contents read 150.0 g. The mixture fizzed for about a minute and gave off bubbles of gas. After the fizzing stopped, the cup and its contents read 148.6 g. The cup was a blue plastic cup that holds 250 mL.",
    },
    {
      id: "s2",
      title: "Group B lab notebook: sealed bag",
      byline: "Written for this activity",
      text: "Group B put the same amounts of baking soda and vinegar into a zip bag, sealed it so nothing could get in or out, and placed the bag on a balance. Before the substances touched, the bag read 150.0 g. When they mixed, the bag fizzed and puffed up until it was nearly twice as large. After the fizzing stopped, the bag read 150.0 g. The bag had a blue stripe along the top.",
      visual: {
        kind: "table",
        alt: "A table with columns setup, before in grams and after in grams. The open cup reads 150.0 before and 148.6 after. The sealed bag reads 150.0 before and 150.0 after.",
        head: ["Setup", "Before (g)", "After (g)"],
        rows: [
          ["Open cup", "150.0", "148.6"],
          ["Sealed bag", "150.0", "150.0"],
        ],
      },
    },
    {
      id: "s3",
      title: "Science reference card",
      byline: "Written for this activity",
      text: "In a chemical reaction, the bonds between atoms in the reactants break and the atoms form new bonds to make the products. The atoms are rearranged. No atoms are created and no atoms are destroyed. A gas is matter, so it has mass. A balance measures only the matter that is on it. If a gas leaves the container, the balance no longer measures that gas.",
    },
  ],
  claims: [
    {
      id: "c1",
      text: "Mass was not destroyed in the open cup. The gas made by the reaction escaped and carried the missing mass out of the cup.",
      strong: true,
      why: "This claim answers the question and both the lab notebooks and the reference card can support it.",
    },
    {
      id: "c2",
      text: "The total mass is conserved, because the sealed bag kept all of its matter and read the same before and after the reaction.",
      strong: true,
      why: "This claim answers the question by pointing to the closed system, and the sources can support it with data and a science idea.",
    },
    {
      id: "c3",
      text: "Mass was destroyed in the open cup because the balance reading went down.",
      strong: false,
      why: "This claim answers the question, but the sources contradict it. The sealed bag did not lose mass, and the card says atoms are not destroyed.",
    },
    {
      id: "c4",
      text: "The sealed bag is better science equipment than the cup because bags are cheaper.",
      strong: false,
      why: "This claim is about cost, not about what happened to the mass. The sources cannot support it.",
    },
  ],
  evidence: [
    {
      id: "e1",
      sourceId: "s1",
      text: "Group A's open cup read 150.0 g before and 148.6 g after, a loss of 1.4 g, and the mixture gave off bubbles of gas.",
      supports: "c1",
      quality: "strong",
      feedback: "Strong: it gives measured data and links the loss to the gas that was produced.",
    },
    {
      id: "e2",
      sourceId: "s3",
      text: "The reference card says a gas is matter with mass, so a gas that leaves an open container takes its mass with it.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: it gives the science idea that explains how a reading can drop without mass being destroyed.",
    },
    {
      id: "e3",
      sourceId: "s2",
      text: "Group B's sealed bag read 150.0 g before and 150.0 g after, even though it puffed up.",
      supports: "c2",
      quality: "strong",
      feedback:
        "Strong: it is measured data from a closed system that directly shows the mass stayed the same.",
    },
    {
      id: "e4",
      sourceId: "s3",
      text: "The reference card says the atoms in a reaction are only rearranged, and none are created or destroyed.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: it gives the science idea that explains why the total mass is conserved.",
    },
    {
      id: "e5",
      sourceId: "s1",
      text: "The open cup fizzed a lot, so it must have lost the most mass.",
      supports: "c1",
      quality: "weak",
      feedback:
        "Weak: how much something fizzed is an impression, not a measurement. The data and the card are stronger.",
    },
    {
      id: "e6",
      sourceId: "s2",
      text: "The bag looked bigger after the reaction, so it was full of something.",
      supports: "c2",
      quality: "weak",
      feedback:
        "Weak: the size of the bag shows that gas formed, but it does not show what happened to the mass.",
    },
    {
      id: "e7",
      sourceId: "s1",
      text: "Group A's cup was a blue plastic cup that holds 250 mL.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Irrelevant: the color and size of the cup have nothing to do with what happened to the mass.",
    },
    {
      id: "e8",
      sourceId: "s2",
      text: "Group B's bag had a blue stripe along the top.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Irrelevant: a stripe on the bag does not tell you anything about the mass before or after.",
    },
  ],
  counterclaims: {
    c1: "Some students say the missing 1.4 g shows that mass was destroyed in the reaction.",
    c2: "Some students say the puffed-up bag must have a greater mass because it is bigger.",
  },
  counter: {
    requiredTiers: ["exp", "br"],
    optionalTiers: ["dev"],
    frames: {
      acknowledge: {
        ee: ["Some students think ___."],
        dev: ["Some students think ___ because ___."],
        exp: ["It is true that ___, and some students conclude that ___."],
        br: ["The opposing view seems reasonable at first because ___."],
      },
      rebut: {
        ee: ["But the ___ shows ___."],
        dev: ["But that is not enough because ___."],
        exp: ["However, in a closed system ___, so ___."],
        br: ["That view overlooks that ___, which means ___."],
      },
    },
  },
  reasoningFrames: {
    ee: ["This shows ___ because ___."],
    dev: ["This supports my claim because ___."],
    exp: ["This evidence supports my claim because atoms ___, and in this case ___."],
    br: [],
  },
  linkWords: ["so", "which is why"],
  hints: {
    claim: [
      "Read the question again. A good claim answers whether mass was destroyed and says what happened to it.",
      "Some choices are about cost or only repeat a reading. Decide which choices could be tested with the data from both groups.",
      "Before you choose, check whether the sealed bag and the reference card agree with the claim.",
    ],
    evidence: [
      "Look for cards that give measurements or a science idea from the card, not feelings or facts about the equipment.",
      "Choose cards from more than one source, and make sure each card connects directly to your claim.",
      "A card can be true and still not help. Ask whether it helps decide what happened to the mass.",
    ],
    reasoning: [
      "Say why the evidence matters. What science idea connects the data to your claim: a gas leaving, or atoms being rearranged?",
      "Use a connecting word such as because or so, and use an idea word from your claim, like mass, gas, or atoms.",
      "Finish by linking the number or the idea to the claim you chose.",
    ],
  },
  model: {
    question: "Does a block of dry ice lose mass when it turns into gas on an open tray?",
    claim: "The block lost mass because the gas it turned into drifted away from the open tray.",
    strong: {
      text: "The tray and block read 200.0 g at the start and 190.0 g ten minutes later, and the carbon dioxide gas that formed spread into the air, so the matter that left the tray accounts for the lost mass.",
      why: "It gives measured data and says where the missing matter went.",
    },
    weak: {
      text: "The block looked smaller and it seemed to disappear.",
      why: "It is an impression and gives no measurement or explanation.",
    },
    tip: "Check that your evidence is a measurement or a science idea and that it says where the matter is.",
  },
  revision: {
    checks: [
      {
        id: "claim-clear",
        label: "My claim answers whether mass was destroyed and says what happened to it.",
      },
      { id: "evidence-source", label: "My evidence cards are strong and about the question." },
      { id: "evidence-variety", label: "My evidence comes from more than one source." },
      {
        id: "reasoning-why",
        label: "My reasoning uses a science idea to explain why the evidence supports the claim.",
      },
      { id: "uses-numbers", label: "I cite a measured mass in my evidence." },
      { id: "counterclaim", label: "I answered the opposing view.", tiers: ["exp", "br"] },
    ],
  },
  supports: {
    ee: {
      directions:
        "Choose the claim that answers the question. Choose cards with measurements or the science idea. Then say why the evidence proves the claim.",
      frames: ["I chose ___ because ___."],
      wordBank: ["mass", "gas", "atoms", "open", "sealed", "before", "after", "grams"],
    },
    dev: {
      frames: ["The evidence shows ___, which means ___."],
      wordBank: ["conservation of mass", "closed system", "rearranged"],
    },
    exp: { frames: ["Because ___, the mass ___."] },
    br: {},
  },
  reflection: {
    prompt:
      "Which piece of evidence was strongest and why? What other data would make your explanation even stronger?",
    frames: {
      ee: ["The strongest evidence was ___.", "I want to measure ___."],
      dev: ["The strongest evidence was ___ because ___.", "More data I would want is ___."],
      exp: [
        "The strongest evidence was ___ because it ___; to make the explanation stronger I would collect ___ to show ___.",
      ],
      br: [
        "The ___ evidence was strongest because it tested ___ directly; I would strengthen the argument by measuring ___ so that ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
