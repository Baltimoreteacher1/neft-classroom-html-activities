// argument-builder (source format): argue which cause mattered more using a summary and two imagined perspectives (D2.His.14.6-8, D2.His.6.6-8, RH.6-8.1, W.8.1).
const V = "g8-social-studies-causes-of-the-american-revolution-sourcing";

export default {
  id: "g8-ss-revolution-causes-argument",
  engine: "argument-builder",
  title: "Build the argument: taxes or a voice in Parliament?",
  grade: "8",
  band: "6-8",
  subject: "social-studies",
  lessonId: "g8-social-studies-causes-of-the-american-revolution-sourcing",
  standards: ["D2.His.14.6-8", "D2.His.6.6-8", "RH.6-8.1", "W.8.1"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to D2.His.14.6-8, D2.His.6.6-8, RH.6-8.1 and W.8.1; not mapped to a district unit sequence. The two perspective sources are imagined for practice and are not real historical documents.",
  },
  vocabIds: [
    `${V}:cause`,
    `${V}:underlying-cause`,
    `${V}:representation`,
    `${V}:tax`,
    `${V}:perspective`,
    `${V}:corroborate`,
  ],
  minutes: 30,
  intro:
    "A summary and two imagined voices from the 1760s describe disputes between Britain and the colonies. Make a claim about which cause mattered more, support it with source evidence, explain your reasoning and answer an opposing view.",
  format: "source",
  question:
    "Between 1763 and 1775, which mattered more in pushing the colonies toward revolution: the new taxes themselves, or the colonists' lack of a voice in the Parliament that passed them?",
  sources: [
    {
      id: "s1",
      title: "Summary of events, 1763 to 1774",
      byline: "Written for this activity: a summary of well-established events.",
      text: "After the Seven Years' War ended in 1763, Britain had a large debt and kept troops in North America. Parliament then passed new measures to raise money from the colonies: the Sugar Act in 1764, the Stamp Act in 1765 and the Townshend duties in 1767. Colonial assemblies had long managed local taxes, but the colonies elected no members of Parliament. Colonists protested and boycotted British goods, and in 1766 they won the repeal of the Stamp Act. In 1774, after the Boston Tea Party, Parliament passed the Coercive Acts.",
    },
    {
      id: "s2",
      title: "An imagined merchant's letter, 1765",
      byline:
        "Written for this activity: an imagined letter modeled on common colonial concerns, not a real document.",
      text: "To my partner in London: The new stamp tax makes every contract, newspaper and bill of sale cost more, and my profits are already thin. What troubles me even more is how it was passed. Parliament voted this tax without asking our assembly, and no one in this colony elected a single member of that body. If London can decide what we pay without our consent, what part of our earnings is truly our own? I have agreed with the other merchants of this town to order no more goods until the tax is withdrawn.",
    },
    {
      id: "s3",
      title: "An imagined pamphlet by a supporter of Parliament",
      byline:
        "Written for this activity: an imagined pamphlet that shows the argument of a supporter of Parliament, not a real document.",
      text: "The colonies were defended at great cost during the late war, and the nation that protected them now asks for a modest share of that cost. Colonists say they have no vote in Parliament, but Parliament speaks for every British subject, wherever he lives, just as it does for large towns that elect no member of their own. The sums are small and the cause is just. Those who refuse to pay choose disorder over duty. This pamphlet was printed in London.",
    },
  ],
  claims: [
    {
      id: "c1",
      text: "The lack of a voice in Parliament mattered more, because colonists objected to who made the decision as much as to what they had to pay.",
      strong: true,
      why: "This claim answers the question, can be argued against, and all three sources address who had the right to make the decision.",
    },
    {
      id: "c2",
      text: "The new taxes mattered more, because each measure raised costs for colonists and set off protests and boycotts.",
      strong: true,
      why: "This claim answers the question with a different cause, and the sources describe the cost of the taxes and the protests that followed.",
    },
    {
      id: "c3",
      text: "The colonists simply disliked Britain and wanted to be free from the beginning.",
      strong: false,
      why: "This claim is too broad and the sources do not support it. They describe specific disputes, and one writer in the letter still addresses a partner in London.",
    },
    {
      id: "c4",
      text: "Parliament passed the Stamp Act in 1765.",
      strong: false,
      why: "This is a fact, not an argument. It does not say which cause mattered more, so there is nothing to argue for or against.",
    },
  ],
  minEvidence: 2,
  maxEvidence: 4,
  evidence: [
    {
      id: "e1",
      sourceId: "s2",
      text: "The merchant objects that Parliament voted the tax without asking his colony's assembly and that no one in the colony elected a member of it.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: a specific complaint from a person affected, focused on who made the decision.",
    },
    {
      id: "e2",
      sourceId: "s1",
      text: "Colonial assemblies had long managed local taxes, but the colonies elected no members of Parliament.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: a factual condition that explains why the lack of a voice was a real problem.",
    },
    {
      id: "e3",
      sourceId: "s3",
      text: "The pamphlet answers colonists who say they have no vote by claiming that Parliament speaks for every British subject, wherever he lives.",
      supports: "c1",
      quality: "strong",
      feedback:
        "Strong: even a supporter of Parliament felt the need to answer the representation complaint, which shows it was a central issue.",
    },
    {
      id: "e4",
      sourceId: "s1",
      text: "Parliament passed the Sugar Act in 1764, the Stamp Act in 1765 and the Townshend duties in 1767, and colonists protested and boycotted British goods.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: it links a series of new taxes to specific protests and boycotts.",
    },
    {
      id: "e5",
      sourceId: "s2",
      text: "The merchant says the stamp tax makes every contract, newspaper and bill of sale cost more while his profits are already thin.",
      supports: "c2",
      quality: "strong",
      feedback: "Strong: a specific account of how the tax raised costs for one colonist.",
    },
    {
      id: "e6",
      sourceId: "s1",
      text: "In 1766 the colonists won the repeal of the Stamp Act.",
      supports: "c1",
      quality: "weak",
      feedback:
        "Weak: it shows that protest worked, but it does not show that the lack of a voice mattered more than the tax.",
    },
    {
      id: "e7",
      sourceId: "s1",
      text: "Britain had a large debt after the Seven Years' War.",
      supports: "c2",
      quality: "weak",
      feedback:
        "Weak: it explains why taxes were passed, not how much the taxes themselves pushed colonists toward revolution.",
    },
    {
      id: "e8",
      sourceId: "s3",
      text: "The pamphlet was printed in London.",
      supports: null,
      quality: "irrelevant",
      feedback:
        "Irrelevant: where the pamphlet was printed is true, but it does not help answer which cause mattered more.",
    },
  ],
  counterclaims: {
    c1: "Some people argue that representation was mostly a slogan, and that colonists were really protesting how much they had to pay.",
    c2: "Others argue that the taxes were modest, and that what colonists really refused was Parliament's authority to decide for them.",
  },
  counter: {
    requiredTiers: ["exp", "br"],
    optionalTiers: ["dev"],
    frames: {
      acknowledge: {
        ee: ["Some people think ___."],
        dev: ["Some people argue that ___, and that view has a reason."],
        exp: ["It is true that some people argue that ___."],
        br: [],
      },
      rebut: {
        ee: ["But the sources show ___."],
        dev: ["However, the sources show that ___, so ___."],
        exp: ["Even so, the sources suggest that ___, which means ___."],
        br: [],
      },
    },
  },
  reasoningFrames: {
    ee: ["This source shows ___ because ___."],
    dev: ["This evidence supports my claim because the writer ___."],
    exp: ["This evidence shows that ___, which supports my claim because ___."],
    br: ["Because the source reveals ___, it demonstrates that ___, so ___."],
  },
  linkWords: ["reveals", "indicates"],
  hints: {
    claim: [
      "A strong claim answers the question by choosing one cause over the other and could be argued against.",
      "Check which choices only report an event, and which are too broad for what these three sources actually describe.",
      "Pick the claim that you could back up with specific statements from at least two different sources.",
    ],
    evidence: [
      "Look for statements you could point to in a source, such as a named law, a count of years or a complaint from someone affected.",
      "Make sure each card supports the cause you chose and not the competing cause.",
      "Use cards from more than one source, and leave out any that are true but not about the question.",
    ],
    reasoning: [
      "Explain why the card helps your claim, not just what the source says.",
      "Join the card and the claim with a word such as because, so or this shows.",
      "Name the cause you chose and one idea from the source in the same sentence.",
    ],
  },
  model: {
    question: "Which did more to reduce traffic near a school: a new bus route or a new bike lane?",
    claim: "A new bus route did more to reduce traffic near the school.",
    strong: {
      text: "A city count shows that after the route began, forty fewer cars lined up at drop-off each morning, which shows the route moved more families away from cars.",
      why: "It gives a specific, checkable result and explains how it connects to the claim.",
    },
    weak: {
      text: "Buses are big and everybody likes them.",
      why: "It states a general opinion and gives no result that a reader could check.",
    },
    tip: "In a source argument, name who made the source and what they could know before you rely on it.",
  },
  revision: {
    checks: [
      { id: "claim-clear", label: "My claim picks one cause and could be argued against." },
      {
        id: "evidence-source",
        label: "My strong evidence comes from the sources and supports my claim.",
      },
      {
        id: "evidence-variety",
        label: "My strong evidence comes from at least two different sources.",
      },
      { id: "reasoning-why", label: "I explained how each piece of evidence supports my claim." },
      {
        id: "counterclaim",
        label: "I acknowledged another viewpoint and answered it with evidence.",
        tiers: ["dev", "exp", "br"],
      },
      { id: "perspective", label: "I noted whose perspective each source shows." },
    ],
  },
  supports: {
    ee: {
      directions:
        "Read each source and listen to it. Remember that two of the sources are imagined voices. Choose one claim and then the cards that match.",
      wordBank: ["claim", "source", "tax", "Parliament", "because"],
      frames: ["I think ___ mattered more because ___."],
      oral: "Say which cause you chose to a partner before you pick cards.",
    },
    dev: {
      directions:
        "Choose cards from at least two sources. Explain each one and say whose perspective it shows.",
      wordBank: ["perspective", "representation", "evidence", "another viewpoint"],
    },
    exp: {
      directions:
        "Weigh the sources against each other. Note where a source reflects the maker's interests.",
    },
    br: {},
  },
  reflection: {
    prompt: "How did the maker's perspective change how you used each source?",
    frames: {
      ee: ["The merchant wanted ___.", "The pamphlet wanted ___."],
      dev: [
        "I used the letter carefully because the writer ___.",
        "The pamphlet shows the view of ___.",
      ],
      exp: [
        "Because the maker of ___ was ___, I treated its claim as ___ unless another source confirmed it.",
      ],
      br: [
        "I corroborated claims across sources with opposing perspectives, and weighted ___ because ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
