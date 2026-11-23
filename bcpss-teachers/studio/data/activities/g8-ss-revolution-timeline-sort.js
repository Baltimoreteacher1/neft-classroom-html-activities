// concept-builder (timeline-sort): place events on a time axis and justify the order by cause and response (D2.His.1.6-8, D2.His.14.6-8).
const V = "g8-social-studies-causes-of-the-american-revolution-sourcing";
const fr = (ee, dev, exp, br = []) => ({ ee, dev, exp, br });

// Every date below is a well-established year. No two events in one task share a year.
const EV = {
  p1: {
    id: "p1",
    label: "Treaty of Paris ends the Seven Years' War",
    detail: "Britain gains land and a large debt",
    at: 1763,
  },
  p2: {
    id: "p2",
    label: "Sugar Act",
    detail: "Changes import duties and tightens enforcement",
    at: 1764,
  },
  p3: {
    id: "p3",
    label: "Stamp Act",
    detail: "Taxes printed materials such as newspapers",
    at: 1765,
  },
  p4: {
    id: "p4",
    label: "Stamp Act repealed",
    detail: "Parliament cancels the tax after protests",
    at: 1766,
  },
  p5: {
    id: "p5",
    label: "Townshend Acts",
    detail: "New duties on imports such as glass and paper",
    at: 1767,
  },
  p6: {
    id: "p6",
    label: "Boston Massacre",
    detail: "British soldiers fire on a crowd in Boston",
    at: 1770,
  },
  p7: {
    id: "p7",
    label: "Boston Tea Party",
    detail: "Colonists dump tea into Boston Harbor",
    at: 1773,
  },
  p8: { id: "p8", label: "Coercive Acts", detail: "Parliament punishes Massachusetts", at: 1774 },
  p9: {
    id: "p9",
    label: "Battles of Lexington and Concord",
    detail: "First battles of the war",
    at: 1775,
  },
  p10: {
    id: "p10",
    label: "Declaration of Independence",
    detail: "The colonies declare independence",
    at: 1776,
  },
};
const pick = (...ids) => ids.map((id) => EV[id]);
const placed = (ids) => ({ at: Object.fromEntries(ids.map((id) => [id, EV[id].at])) });
const order = (ids) => ({ type: "order", of: "order", expected: ids });
const sup = (ee, dev, exp) => ({
  ee: {
    frames: ee,
    wordBank: ["before", "after", "response", "because", "year"],
    directions:
      "Press Place on a card, then drag it or use the arrow keys to move it along the years. Earlier years are on the left.",
  },
  dev: { frames: dev, wordBank: ["responded to", "led to"] },
  exp: { frames: exp },
  br: {},
});
const explainFor = (prompt, ee, dev, exp, br) => ({
  prompt,
  frames: fr(ee, dev, exp, br),
  mustMention: [
    {
      id: "link",
      label: "how one event led to or answered another",
      any: ["because", "cause", "led", "response", "responded", "after", "result"],
    },
  ],
});

const T1 = ["p1", "p2", "p3", "p4", "p5"];
const T2 = ["p6", "p7", "p8", "p9", "p10"];
const T3 = ["p1", "p2", "p3", "p5", "p6", "p7", "p8", "p9"];

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
  id: "g8-ss-revolution-timeline-sort",
  engine: "concept-builder",
  kind: "timeline-sort",
  title: "Place the events: from the end of the war to independence",
  grade: "8",
  band: "6-8",
  subject: "social-studies",
  lessonId: "g8-social-studies-causes-of-the-american-revolution-sourcing",
  standards: ["D2.His.1.6-8", "D2.His.14.6-8"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to D2.His.1.6-8 and D2.His.14.6-8; not mapped to a district unit sequence. Dates are well-established years; descriptions are original.",
  },
  vocabIds: [
    `${V}:cause`,
    `${V}:effect`,
    `${V}:trigger`,
    `${V}:repeal`,
    `${V}:boycott`,
    `${V}:context`,
  ],
  minutes: 22,
  intro:
    "Events in history connect. Place each event on the timeline in the order it happened, then explain how one event led to or answered another. The true years appear after you are correct.",
  model: {
    span: [1760, 1780],
    axisStep: 1,
    unit: "year",
    events: pick("p3", "p1", "p5", "p2", "p4"),
  },
  tasks: [
    {
      id: "t1-money",
      prompt:
        "Place these five events about Britain's attempts to raise money from the colonies, from earliest to latest.",
      goal: "All five events in the order they happened",
      target: placed(T1),
      check: order(T1),
      hints: [
        "One of these events is a treaty and the rest are laws. Ask which kind of event could explain why Parliament wanted money.",
        "Some labels tell what a law taxed. Look for clues that one law came before another.",
        "A law can only be cancelled after it exists. Place the pair that must stay in that order first.",
      ],
      misconceptions: [
        {
          match: "repeal-before-law",
          when: { type: "relation", left: "at[p4]", op: "lt", right: "at[p3]" },
          hint: "The cancellation of a law is placed before the law itself. A law has to exist before Parliament can cancel it.",
          model: "Repeal means to cancel a law, so the repeal always comes after the law.",
        },
        {
          match: "treaty-late",
          when: { type: "relation", left: "at[p1]", op: "gt", right: "at[p2]" },
          hint: "Think about why Parliament looked for new money. Was the debt a result of the laws or a reason for them?",
        },
      ],
      model:
        "The Treaty of Paris ended the war and left Britain with debt, so it comes first. The Sugar Act followed, then the Stamp Act. After colonial protests, the Stamp Act was repealed. The Townshend Acts then tried a different set of duties.",
      right:
        "That order shows Parliament trying one measure after another, with a repeal in between.",
      supports: sup(
        ["First came ___. After that came ___."],
        ["___ came before ___ because ___."],
        ["The sequence shows that ___ led to ___, and then ___."],
      ),
      justify: {
        prompt: "Which clues show that the Treaty of Paris came before the new taxes?",
        options: [
          {
            id: "j1",
            text: "The new taxes were passed to deal with debt left by the war the treaty ended.",
            ok: true,
          },
          { id: "j2", text: "A cause comes before the measures that respond to it.", ok: true },
          {
            id: "j3",
            text: "Treaties are always older than laws.",
            ok: false,
            hint: "That is a general rule that is not true. Use what this particular treaty left behind.",
          },
          {
            id: "j4",
            text: "Its label is the longest.",
            ok: false,
            hint: "The length of a label says nothing about when something happened.",
          },
        ],
        model:
          "The war's debt is why Parliament sought money, so the treaty that ended the war comes before the taxes.",
      },
      explain: explainFor(
        "What changed on your timeline, and how did one event lead to the next?",
        ["The war ended in ___. Then ___.", "The law came before the ___."],
        ["The Treaty of Paris came first because ___, and then Parliament ___."],
        ["Because the war left ___, Parliament passed ___, which led colonists to ___."],
        [
          "The sequence reveals a pattern of ___ followed by ___, so the repeal makes sense only after ___.",
        ],
      ),
    },
    {
      id: "t2-protest-war",
      setup: { events: pick("p9", "p6", "p10", "p8", "p7") },
      prompt:
        "Place these five events from the period of protest and conflict, from earliest to latest.",
      goal: "All five events in the order they happened",
      target: placed(T2),
      check: order(T2),
      hints: [
        "Look for the event that mentions soldiers firing on a crowd. Ask whether it belongs near the beginning or the end of this group.",
        "One event is a punishment by Parliament. Ask what had to happen first to give Parliament a reason to punish.",
        "The labels with the word battles and the word declaration describe the end of this group. Decide which comes first.",
      ],
      misconceptions: [
        {
          match: "response-before-cause",
          when: { type: "relation", left: "at[p8]", op: "lt", right: "at[p7]" },
          hint: "A punishment cannot come before the act it punishes. Ask which event gave Parliament a reason to respond.",
          model:
            "The Coercive Acts were a response to the Boston Tea Party, so they come after it.",
        },
        {
          match: "declaration-before-war",
          when: { type: "relation", left: "at[p10]", op: "lt", right: "at[p9]" },
          hint: "Think about what the first battles meant for what the colonies did next.",
        },
      ],
      model:
        "The Boston Massacre came first. The Boston Tea Party followed. Parliament responded with the Coercive Acts. The battles at Lexington and Concord began the fighting, and the Declaration of Independence came after.",
      right: "That order shows protest, response and then open conflict.",
      supports: sup(
        ["Parliament answered ___ with ___."],
        ["The Coercive Acts came after ___ because ___."],
        ["Having been punished, ___ responded by ___."],
      ),
      justify: {
        prompt: "Which clues show that the Coercive Acts came after the Boston Tea Party?",
        options: [
          {
            id: "j1",
            text: "The Coercive Acts punished Massachusetts for the destruction of the tea.",
            ok: true,
          },
          { id: "j2", text: "A response cannot come before the event it responds to.", ok: true },
          {
            id: "j3",
            text: "Both labels have the word Act in them.",
            ok: false,
            hint: "Only one of the labels contains that word, and words in a label do not tell you the order.",
          },
          {
            id: "j4",
            text: "Tea is older than any law.",
            ok: false,
            hint: "That does not explain the order of these two events.",
          },
        ],
        model:
          "The Coercive Acts were a punishment for the Tea Party, so the Tea Party had to come first.",
      },
      explain: explainFor(
        "What changed on your timeline, and which event was a response to another?",
        ["The Tea Party came before ___.", "Parliament answered with ___."],
        ["The Coercive Acts were a response to ___, so they came ___."],
        ["Because colonists ___, Parliament ___, which pushed the colonies toward ___."],
        [
          "Each step in the sequence functions as both an effect of the last and a cause of the next, which explains ___.",
        ],
      ),
    },
    {
      id: "t3-road",
      setup: { events: pick("p7", "p3", "p9", "p1", "p6", "p5", "p8", "p2") },
      prompt:
        "Place all eight events on one timeline, from the end of the Seven Years' War to the first battles.",
      goal: "All eight events in the order they happened",
      target: placed(T3),
      check: order(T3),
      hints: [
        "Sort the cards into three groups first: the war's end, laws about money, and protest and conflict. Place the groups in order, then each card within its group.",
        "Within the laws about money, look for what each one taxed and how colonists responded before the next one.",
        "The group about protest and conflict ends with the first fighting. Check that every punishment comes after the act it punishes.",
      ],
      misconceptions: [
        {
          match: "massacre-too-early",
          when: { type: "relation", left: "at[p6]", op: "lt", right: "at[p3]" },
          hint: "Compare the Boston Massacre with the first tax laws. Which kind of event was a consequence of the tension those laws created?",
        },
        {
          match: "tea-after-coercive",
          when: { type: "relation", left: "at[p8]", op: "lt", right: "at[p7]" },
          hint: "A punishment cannot come before the act it punishes.",
        },
      ],
      model:
        "The war's end comes first. The Sugar Act, the Stamp Act and the Townshend Acts follow as Parliament tried to raise money. Tension grew into the Boston Massacre, then the Tea Party. Parliament answered with the Coercive Acts, and the first battles came next.",
      right: "That order shows underlying causes building into a trigger.",
      supports: sup(
        ["Money laws came ___ the protests."],
        ["The underlying causes were ___ and the trigger was ___."],
        ["Over time, ___ built tension that ___ finally set off."],
      ),
      explain: explainFor(
        "What changed on your timeline, and which events were underlying causes and which was the trigger?",
        ["The laws about money came ___.", "The first battles came after ___."],
        ["The underlying cause was ___. The trigger was ___ because ___."],
        ["Because Parliament ___ over many years, tension built until ___."],
        [
          "The timeline separates durable underlying causes from the proximate trigger, which accounts for why ___.",
        ],
      ),
    },
  ],
  reflection: {
    prompt: "How does placing events in order help you explain why something happened?",
    frames: {
      ee: ["The order shows ___.", "First ___. Then ___."],
      dev: [
        "Putting events in order shows that ___ led to ___.",
        "I used the order to explain ___.",
      ],
      exp: ["The sequence helps explain causes because ___ came before and ___ came after."],
      br: ["Sequencing exposes causal relationships, such as how ___ made ___ more likely."],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};

export default spread(DATA);
