// conversation-studio: propose a change to a project budget to a team lead (grade 8 career and technical education).
const turn = (id, prompt, moveId, options) => ({ id, speaker: "you", prompt, moveId, options });

export default {
  id: "g8-cte-budget-conversation",
  engine: "conversation-studio",
  title: "Talk It Through: Propose a Budget Change",
  grade: "8",
  band: "6-8",
  subject: "cte",
  lessonId: "g8-cte-plan-a-small-budget-project",
  standards: ["CRP.04", "CRP.12"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the Career Ready Practices on clear communication and teamwork; not mapped to a district unit sequence. The project and prices are invented for practice.",
  },
  vocabIds: ["budget", "contingency", "trade-off", "constraint", "estimate", "scope"].map(
    (id) => `g8-cte-plan-a-small-budget-project:${id}`,
  ),
  minutes: 18,
  intro:
    "A project plan is over its limit, and you have to tell the team lead. Choose the moves that make a clear, respectful proposal, put them in order, and rehearse what you would say.",
  topic: {
    title: "The plan is over the limit",
    context:
      "Your crew is planning three raised garden beds. The plan costs 220 dollars, but the crew agreed to spend no more than 216 dollars: a 240 dollar budget minus a 24 dollar reserve. Gloves protect the crew's hands, and every bed needs soil. You are meeting with the team lead to propose a change.",
    claim:
      "Buying 9 bags of soil instead of 10 keeps the plan under the limit without risking safety or leaving a bed unfinished.",
    visual: {
      kind: "table",
      alt: "A cost table. Lumber 117 dollars, screws 13 dollars, soil 48 dollars, seed packets 27 dollars, gloves 15 dollars. Plan total 220 dollars. Spending limit 216 dollars.",
      head: ["Line", "Cost"],
      rows: [
        ["Lumber", "$117.00"],
        ["Screws", "$13.00"],
        ["Soil (10 bags)", "$48.00"],
        ["Seed packets", "$27.00"],
        ["Gloves", "$15.00"],
        ["Plan total", "$220.00"],
        ["Spending limit", "$216.00"],
      ],
    },
  },
  roles: [
    {
      id: "crew-member",
      label: "Crew member",
      job: "Explains the problem, shows the numbers and proposes a change.",
    },
    {
      id: "team-lead",
      label: "Team lead",
      job: "Asks questions, listens and decides whether to approve the change.",
    },
  ],
  moves: [
    {
      id: "state-problem",
      label: "State the problem",
      function: "Tell the lead plainly what is wrong before you explain it.",
      frames: {
        ee: ["The plan costs too much."],
        dev: ["We have a problem: the plan costs more than ___."],
        exp: ["I need to tell you that the plan is over ___ by ___."],
        br: [
          "I want to flag that the current plan exceeds our spending limit, and I have a proposal.",
        ],
      },
      wordBank: {
        ee: ["plan", "limit", "over"],
        dev: ["spending limit", "exceeds"],
        exp: [],
        br: [],
      },
      example: "We have a problem: the plan costs more than our spending limit.",
      listenFor: "The problem named in the first sentence.",
    },
    {
      id: "give-numbers",
      label: "Show the numbers",
      function: "Give the exact amounts so the lead can check them.",
      frames: {
        ee: ["The plan is ___. The limit is ___."],
        dev: ["The plan costs ___ and the limit is ___, so we are ___ over."],
        exp: [
          "The plan totals ___ against a limit of ___, which is ___ minus a reserve of ___, so we are over by ___.",
        ],
        br: ["Our total is ___ against a limit of ___ after the reserve, a gap of ___."],
      },
      wordBank: { ee: ["total", "limit", "dollars"], dev: ["reserve", "over by"], exp: [], br: [] },
      example: "The plan costs 220 dollars and the limit is 216 dollars, so we are 4 dollars over.",
      listenFor: "At least two numbers and the difference.",
    },
    {
      id: "propose-change",
      label: "Propose a specific change",
      function: "Say exactly what you would change and what it saves.",
      frames: {
        ee: ["I suggest we buy ___ instead of ___."],
        dev: ["I suggest we buy ___ instead of ___. That saves ___."],
        exp: ["I propose buying ___ instead of ___, which saves ___ and brings the total to ___."],
        br: ["I propose reducing ___ from ___ to ___, saving ___ and bringing the total to ___."],
      },
      wordBank: {
        ee: ["suggest", "instead of", "saves"],
        dev: ["propose", "total"],
        exp: [],
        br: [],
      },
      example:
        "I suggest we buy 9 bags of soil instead of 10. That saves 4.80 dollars and brings the total to 215.20.",
      listenFor: "A change that names the item, the new amount and the savings.",
    },
    {
      id: "give-reason",
      label: "Give your reasons",
      function: "Say why this change is better than the other changes.",
      frames: {
        ee: ["I chose this because ___."],
        dev: ["I chose this because ___ and I kept ___."],
        exp: [
          "I chose this because it keeps ___ and still lets us ___, and I kept ___ because ___.",
        ],
        br: [
          "I weighed the options: this change keeps ___ and ___, whereas cutting ___ would ___.",
        ],
      },
      wordBank: {
        ee: ["because", "safe"],
        dev: ["keep", "protect", "finish"],
        exp: ["whereas", "weighed"],
        br: [],
      },
      example:
        "One fewer bag still fills the beds and keeps us under the limit. We keep the gloves because they protect our hands.",
      listenFor: "A reason about safety or about finishing the job, not only about cost.",
    },
    {
      id: "ask-approval",
      label: "Ask for a decision",
      function: "Ask the lead directly for approval or feedback so the team can move on.",
      frames: {
        ee: ["Can you say yes or no?"],
        dev: ["Can you approve ___ so I can ___?"],
        exp: ["Would you approve the change to ___ so I can update ___?"],
        br: [
          "Do you approve this change, or would you like me to consider another option before the order goes out?",
        ],
      },
      wordBank: { ee: ["approve", "yes", "no"], dev: ["update the order"], exp: [], br: [] },
      example: "Can you approve the change to 9 bags of soil so I can update the order?",
      listenFor: "A direct request for a decision and what happens next.",
    },
    {
      id: "vague-excuse",
      label: "Say it is probably fine",
      function: "Brush off the problem without checking the numbers.",
      frames: {
        ee: ["It is probably fine."],
        dev: ["It is probably fine because ___."],
        exp: ["I expect it will work out."],
        br: ["I assume the total will sort itself out."],
      },
      example: "It is probably fine; the numbers are close.",
      notFit:
        "A lead needs facts. Brushing off a problem without the numbers does not help the team decide.",
    },
    {
      id: "blame-store",
      label: "Blame the store",
      function: "Complain about prices instead of proposing a fix.",
      frames: {
        ee: ["The store charges too much."],
        dev: ["The store charges too much for ___."],
        exp: ["The prices at the store are unfair."],
        br: ["The vendor's pricing is the real problem here."],
      },
      example: "The store charges too much for everything.",
      notFit:
        "The prices are given, so complaining about them does not move the team forward. Propose something the crew can control.",
    },
  ],
  purposes: [
    {
      id: "propose-change",
      label: "Propose a budget change",
      description:
        "Explain a problem with the plan, show the numbers, propose a change, justify it and ask for a decision.",
      moveIds: [
        "state-problem",
        "give-numbers",
        "propose-change",
        "give-reason",
        "ask-approval",
        "vague-excuse",
        "blame-store",
      ],
      plan: {
        prompt:
          "Choose the moves that make a strong proposal to a team lead, then put them in the order you would use them.",
        expected: [
          "state-problem",
          "give-numbers",
          "propose-change",
          "give-reason",
          "ask-approval",
        ],
        hints: [
          "A lead wants to hear the problem first, then the proof, then your idea, then your thinking.",
          "Two of the moves give the lead nothing to act on: one dodges the problem and one complains about something the crew cannot change.",
          "The last move hands the conversation back so the team can decide and move on.",
        ],
        model:
          "Name the problem first, back it up with the numbers, propose one specific change, explain why that change beats the others, and finish by asking for a decision.",
        why: [
          "The lead needs the problem before the details.",
          "The numbers show the problem is real and how big it is.",
          "A specific change gives the lead something to react to.",
          "Reasons show you weighed other options, including safety and the job itself.",
          "A direct question lets the team decide and move on.",
        ],
      },
      rehearsal: {
        intro: "Your partner is the team lead, in a short meeting before the order goes out.",
        turns: [
          {
            id: "p1",
            speaker: "partner",
            say: "Thanks for meeting with me. Where are we on the garden budget?",
          },
          turn("y1", "Tell the lead about the problem in one sentence.", "state-problem", [
            {
              id: "a",
              text: "We have a problem: the plan costs more than our spending limit.",
              fit: "strong",
              note: "States the problem plainly and names what is wrong.",
            },
            {
              id: "b",
              text: "The budget is a little off.",
              fit: "partial",
              note: "That signals a problem but does not say what is wrong, so the lead has to ask.",
            },
            {
              id: "c",
              text: "Everything is fine; the plan is ready.",
              fit: "off",
              note: "That is not true. The plan is over the limit, so the lead is being told the wrong thing.",
            },
          ]),
          { id: "p2", speaker: "partner", say: "How much over are we? Show me the numbers." },
          turn("y2", "Show the lead the numbers.", "give-numbers", [
            {
              id: "a",
              text: "The plan costs 220 dollars and our limit is 216 dollars, so we are 4 dollars over.",
              fit: "strong",
              note: "Gives the total, the limit and the gap so the lead can check them.",
            },
            {
              id: "b",
              text: "We are over by some money.",
              fit: "partial",
              note: "That is true but gives no numbers, so the lead cannot judge how big the problem is.",
            },
            {
              id: "c",
              text: "Prices are too high at the store.",
              fit: "off",
              note: "That blames the store and gives no numbers. The lead asked how much over you are.",
            },
          ]),
          { id: "p3", speaker: "partner", say: "What do you suggest?" },
          turn("y3", "Propose one specific change.", "propose-change", [
            {
              id: "a",
              text: "I suggest we buy 9 bags of soil instead of 10. That saves 4.80 dollars and brings the total to 215.20.",
              fit: "strong",
              note: "Names the item, the new amount and what it saves, with the new total.",
            },
            {
              id: "b",
              text: "We could cut something.",
              fit: "partial",
              note: "That is an idea, but it does not say what to cut or what it saves.",
            },
            {
              id: "c",
              text: "I suggest we skip the gloves; they cost 15 dollars.",
              fit: "off",
              note: "That lowers the total, but it gives up safety equipment. Look for a change that does not put anyone at risk.",
            },
          ]),
          { id: "p4", speaker: "partner", say: "Why that change and not another one?" },
          turn("y4", "Give your reasons.", "give-reason", [
            {
              id: "a",
              text: "One fewer bag still fills the beds and keeps us under the limit. We keep the gloves because they protect our hands.",
              fit: "strong",
              note: "Gives a reason about the job and about safety, not only cost.",
            },
            {
              id: "b",
              text: "It was the cheapest thing to cut.",
              fit: "partial",
              note: "Cost is part of it, but the lead also wants to know the change keeps the job whole and everyone safe.",
            },
            {
              id: "c",
              text: "It was the first line I saw.",
              fit: "off",
              note: "That is not a reason. The lead wants to know why this change is better than the others.",
            },
          ]),
          { id: "p5", speaker: "partner", say: "That makes sense. Do you need anything from me?" },
          turn("y5", "Ask for a decision.", "ask-approval", [
            {
              id: "a",
              text: "Can you approve the change to 9 bags of soil so I can update the order?",
              fit: "strong",
              note: "Asks directly for a decision and says what happens next.",
            },
            {
              id: "b",
              text: "Let me know.",
              fit: "partial",
              note: "That leaves it open. Ask for a decision and say what you will do once you have it.",
            },
            {
              id: "c",
              text: "I already changed the order.",
              fit: "off",
              note: "That skips the lead's decision. A team lead needs to approve changes before they are made.",
            },
          ]),
        ],
      },
    },
  ],
  successCriteria: [
    { id: "s1", label: "I named the problem in my first sentence." },
    { id: "s2", label: "I gave at least two exact numbers." },
    { id: "s3", label: "I proposed a specific change and said what it saves." },
    { id: "s4", label: "I gave a reason that includes safety or finishing the job." },
    { id: "s5", label: "I asked for a decision and said what I would do next." },
  ],
  rubric: {
    criteria: [
      {
        id: "clarity",
        label: "Clear problem and proposal",
        levels: [
          { score: 1, descriptor: "Talks around the problem; the lead cannot tell what is wrong." },
          { score: 2, descriptor: "Names the problem but the proposal is vague." },
          { score: 3, descriptor: "Names the problem and proposes a specific change." },
          {
            score: 4,
            descriptor:
              "Names the problem, proposes a specific change and states what it saves and what the new total is.",
          },
        ],
      },
      {
        id: "evidence",
        label: "Uses numbers",
        levels: [
          { score: 1, descriptor: "Uses no numbers." },
          { score: 2, descriptor: "Uses one number without saying what it means." },
          { score: 3, descriptor: "Uses the total, the limit and the gap correctly." },
          {
            score: 4,
            descriptor: "Uses accurate numbers throughout and shows how the new total was found.",
          },
        ],
      },
      {
        id: "reasoning",
        label: "Justifies the decision",
        levels: [
          { score: 1, descriptor: "Gives no reason." },
          { score: 2, descriptor: "Gives a reason about cost only." },
          { score: 3, descriptor: "Gives a reason that includes safety or finishing the job." },
          {
            score: 4,
            descriptor:
              "Compares the change with at least one other option and explains why it is better.",
          },
        ],
      },
      {
        id: "professional",
        label: "Professional communication",
        levels: [
          { score: 1, descriptor: "Blames others or brushes off the problem." },
          { score: 2, descriptor: "Stays polite but does not ask for a decision." },
          { score: 3, descriptor: "Is respectful and asks for a decision." },
          {
            score: 4,
            descriptor: "Is respectful, asks for a decision and says what will happen next.",
          },
        ],
      },
    ],
  },
  reflection: {
    prompt:
      "Which move made your proposal easiest for the team lead to say yes to? What would you do differently next time?",
    frames: {
      ee: ["The move that helped was ___.", "Next time I will ___."],
      dev: ["The move that helped most was ___ because ___.", "Next time I would add ___."],
      exp: ["Showing the ___ made my proposal stronger because ___; next time I would ___."],
      br: [
        "The move that most strengthened my proposal was ___ because ___; to improve I would ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
