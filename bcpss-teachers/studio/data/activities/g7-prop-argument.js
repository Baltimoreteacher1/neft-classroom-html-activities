// argument-builder: decide which kayak shop's cost is proportional and defend it with evidence from price lists and a graph (7.RP.A.2, MP.3).
// All sources are written for this activity; the prices are invented.
export default {
  id: "g7-prop-argument",
  engine: "argument-builder",
  title: "Argue It: Which Kayak Shop Is Proportional?",
  grade: "7",
  band: "6-8",
  subject: "math",
  lessonId: "g7-math-proportional-relationships-graphs",
  standards: ["7.RP.A.2", "7.RP.A.2a", "7.RP.A.2d", "MP.3"],
  curriculum: {
    status: "district-referenced",
    unitId: "g7-math-u1",
    program: "Reveal Math",
    note: "7.RP.A.2 is one of the standards listed for this BCPSS seed unit. This activity is original practice and is not a publisher lesson.",
  },
  vocabIds: [
    "proportional-relationship",
    "constant-of-proportionality",
    "origin",
    "non-proportional",
    "justify",
    "verify",
  ],
  minutes: 22,
  intro:
    "Two kayak shops post their prices in different ways. Read the price lists and the graph, choose a claim, pick the strongest evidence, and explain why it proves your claim.",
  format: "cer",
  labels: { claim: "Claim", evidence: "Evidence", reasoning: "Reasoning", counter: "Other view" },
  question:
    "Which kayak shop's cost is proportional to the hours rented, and how do the price lists and the graph show it?",
  sources: [
    {
      id: "s1",
      title: "Harbor Kayaks price list",
      byline: "Written for this activity",
      text: "Harbor Kayaks rents kayaks by the hour. The price list posted at the dock says: 1 hour costs 8 dollars, 2 hours cost 16 dollars, 3 hours cost 24 dollars and 4 hours cost 32 dollars. The shop does not charge a booking fee, a deposit or an equipment fee. Life jackets and paddles are included in the price. The shop opens at 8 a.m., and its dock is on the east side of the harbor.",
      visual: {
        kind: "table",
        alt: "A price list with columns hours and dollars. The rows read 1 and 8, 2 and 16, 3 and 24, 4 and 32.",
        head: ["Hours (x)", "Dollars (y)"],
        rows: [
          ["1", "8"],
          ["2", "16"],
          ["3", "24"],
          ["4", "32"],
        ],
      },
    },
    {
      id: "s2",
      title: "Bayview Boats price list",
      byline: "Written for this activity",
      text: "Bayview Boats rents kayaks too. Every renter pays a 5 dollar booking fee, and then 6 dollars for each hour on the water. The posted examples are: 1 hour costs 11 dollars, 2 hours cost 17 dollars, 3 hours cost 23 dollars and 4 hours cost 29 dollars. The shop is open from 9 a.m. to 6 p.m. and gives out a free map of the bay with every rental.",
    },
    {
      id: "s3",
      title: "Math club graph of both shops",
      byline: "Written for this activity",
      text: "The math club graphed both price lists on one coordinate plane. Hours are on the horizontal axis and dollars are on the vertical axis. Each shop's prices lie on a straight line.",
      visual: {
        kind: "coord",
        alt: "A coordinate plane with hours along the bottom and dollars up the side. The Harbor line starts at the corner and rises 8 dollars for each hour. The Bayview line crosses the vertical axis at 5 dollars and rises 6 dollars for each hour.",
        longDesc:
          "Harbor passes through (0, 0), (1, 8) and (2, 16). Bayview passes through (0, 5), (1, 11) and (2, 17). Both lines are straight, but only the Harbor line passes through the origin.",
        xmax: 5,
        ymax: 40,
        xLabel: "Hours (x)",
        yLabel: "Dollars (y)",
        lines: [
          { m: 8, b: 0, label: "Harbor" },
          { m: 6, b: 5, label: "Bayview" },
        ],
      },
    },
  ],
  claims: [
    {
      id: "c1",
      text: "Harbor Kayaks charges a cost that is proportional to the hours rented.",
      strong: true,
      why: "This claim answers the question, it can be argued, and the price list and the graph can both support it.",
    },
    {
      id: "c2",
      text: "Bayview Boats charges a cost that is not proportional to the hours rented.",
      strong: true,
      why: "This claim answers the question and can be supported with the price list and the graph.",
    },
    {
      id: "c3",
      text: "Harbor Kayaks is the better shop because its dock is easier to reach.",
      strong: false,
      why: "This claim is about a dock, not about whether the cost is proportional to the hours. The sources cannot support it.",
    },
    {
      id: "c4",
      text: "Both shops are proportional because both charge more money for more hours.",
      strong: false,
      why: "This claim is too broad. Many relationships go up together, and the sources show that only one of the shops passes the tests for proportionality.",
    },
  ],
  evidence: [
    {
      id: "e1",
      sourceId: "s1",
      text: "Harbor's price list shows 8 dollars for 1 hour, 16 dollars for 2 hours and 24 dollars for 3 hours, so cost divided by hours is 8 every time.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: specific numbers from the price list that show the ratio is the same in every row.",
    },
    {
      id: "e2",
      sourceId: "s3",
      text: "On the math club's graph, Harbor's line is straight and passes through the origin, so 0 hours cost 0 dollars.",
      supports: "c1",
      quality: "strong",
      feedback: "Strong: it names both features a proportional graph needs.",
    },
    {
      id: "e3",
      sourceId: "s2",
      text: "Bayview charges 11 dollars for 1 hour but 17 dollars for 2 hours, so cost divided by hours is 11 and then 8.5, which is not the same.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: it compares the ratio in two rows and shows it changes.",
    },
    {
      id: "e4",
      sourceId: "s3",
      text: "On the math club's graph, Bayview's line crosses the vertical axis at 5 dollars instead of passing through the origin.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: it names the graph feature that rules out a proportional relationship.",
    },
    {
      id: "e5",
      sourceId: "s1",
      text: "Harbor Kayaks has a simple price list that is easy to read.",
      supports: "c1",
      quality: "weak",
      feedback:
        "Weak: an easy-to-read list is an opinion. It does not show that the ratio stays the same.",
    },
    {
      id: "e6",
      sourceId: "s2",
      text: "Bayview Boats' price list looks more complicated than Harbor's.",
      supports: "c2",
      quality: "weak",
      feedback:
        "Weak: how a list looks does not tell you whether the cost is proportional to the hours.",
    },
    {
      id: "e7",
      sourceId: "s2",
      text: "Bayview Boats is open from 9 a.m. to 6 p.m. and gives out a free map of the bay.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Irrelevant: opening hours and maps are true, but they have nothing to do with how cost and hours are related.",
    },
    {
      id: "e8",
      sourceId: "s1",
      text: "Harbor Kayaks' dock is on the east side of the harbor and the shop opens at 8 a.m.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Irrelevant: where the dock is does not show whether cost is proportional to hours.",
    },
  ],
  counterclaims: {
    c1: "Some students say Harbor's cost is not proportional because the total cost keeps getting bigger as the hours go up.",
    c2: "Some students say Bayview's cost is proportional because its price goes up by the same 6 dollars every hour.",
  },
  counter: {
    requiredTiers: ["exp", "br"],
    optionalTiers: ["dev"],
    frames: {
      acknowledge: {
        ee: ["Some students think ___."],
        dev: ["Some students think ___ because ___."],
        exp: ["It is true that ___, and some students conclude that ___."],
        br: ["The opposing view has some merit because ___."],
      },
      rebut: {
        ee: ["But the ___ shows ___."],
        dev: ["But that is not enough because ___."],
        exp: ["However, a proportional relationship also needs ___, so ___."],
        br: ["That view overlooks that ___, which means ___."],
      },
    },
  },
  reasoningFrames: {
    ee: ["This shows ___ because ___."],
    dev: ["This supports my claim because ___."],
    exp: [
      "This evidence supports my claim because proportional relationships need ___, and here ___.",
    ],
    br: [],
  },
  linkWords: ["so", "which is why"],
  hints: {
    claim: [
      "Read the question again. A good claim names a shop and says whether its cost is proportional.",
      "Some choices are not about cost and hours at all. Decide which choices could be tested with numbers.",
      "Before you choose, ask whether the price lists and the graph have enough information to support the claim.",
    ],
    evidence: [
      "Look for cards that give numbers or graph features, not feelings or facts about the shop.",
      "Each strong card comes from a source and ties directly to your claim. Make sure your cards come from more than one source.",
      "A card can be true and still not help. Ask whether it helps decide if the cost is proportional to the hours.",
    ],
    reasoning: [
      "Say why the evidence matters. What does proportional need: a constant ratio, a graph through the origin, or both?",
      "Use a connecting word such as because or so, and use an idea word from your claim, like proportional or origin.",
      "Finish the sentence by linking the number or the graph feature to the claim you chose.",
    ],
  },
  model: {
    question: "Is the cost of a monthly bus pass proportional to the number of weeks it is used?",
    claim: "The cost of Pass A is proportional to the number of weeks it is used.",
    strong: {
      text: "Pass A costs 12 dollars for 1 week, 24 dollars for 2 weeks and 36 dollars for 3 weeks, so cost divided by weeks is 12 every time and the graph goes through (0, 0).",
      why: "It gives numbers from three rows, shows the ratio is constant, and names the graph feature.",
    },
    weak: {
      text: "Pass A looks cheaper than Pass B at the front of the line.",
      why: "It is an opinion about how the prices look and does not test the ratio or the graph.",
    },
    tip: "Check that every piece of evidence is about the question and gives numbers or a graph feature you can test.",
  },
  revision: {
    checks: [
      {
        id: "claim-clear",
        label: "My claim names a shop and says whether its cost is proportional.",
      },
      { id: "evidence-source", label: "My evidence cards are strong and about the question." },
      { id: "evidence-variety", label: "My evidence comes from more than one source." },
      {
        id: "reasoning-why",
        label: "My reasoning explains why each piece of evidence proves the claim.",
      },
      {
        id: "uses-numbers",
        label: "My reasoning uses a number from a price list or a feature of the graph.",
      },
      { id: "counterclaim", label: "I answered the opposing view.", tiers: ["exp", "br"] },
    ],
  },
  supports: {
    ee: {
      directions:
        "Choose the claim that answers the question. Choose cards with numbers or graph features. Then say why the evidence proves the claim.",
      frames: ["I chose ___ because ___."],
      wordBank: ["proportional", "origin", "ratio", "price list", "graph", "hours", "dollars"],
    },
    dev: {
      frames: ["The evidence shows ___, which means ___."],
      wordBank: ["constant", "evidence", "reason"],
    },
    exp: { frames: ["Because ___, the relationship is ___."] },
    br: {},
  },
  reflection: {
    prompt:
      "Which piece of evidence was strongest and why? How would your argument change if the sources had only the price lists and no graph?",
    frames: {
      ee: ["The strongest evidence was ___.", "It showed ___."],
      dev: ["The strongest evidence was ___ because ___.", "Without the graph I would use ___."],
      exp: [
        "The strongest evidence was ___ because it ___; without the graph I would rely on ___ to show ___.",
      ],
      br: [
        "The ___ evidence was strongest because it tested ___ directly; if there were no graph, I would verify proportionality by ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
