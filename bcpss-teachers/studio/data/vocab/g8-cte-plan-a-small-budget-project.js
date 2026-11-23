// Grade 8 career and technical education: the words a project team uses to plan and justify a small budget. Original text; prices are invented.
import {
  BUDGET_BARS,
  CONSTRAINT_BARS,
  DELIVERABLE_FLOW,
  PPE_PICTURE,
  RESERVE_TAPE,
  SCOPE_TABLE,
  TRADE_OFF_TABLE,
  quoteTable,
} from "../kits/c8-garden-budget.js";

const common = { domains: ["Reading", "Speaking", "Writing"], klu: "Explain", tier: 3 };

const estimateTable = {
  kind: "table",
  alt: "A table comparing estimates with quotes. Lumber: estimate 120 dollars, quote 117 dollars. Soil: estimate 50 dollars, quote 48 dollars. Seed packets: estimate 30 dollars, quote 27 dollars.",
  head: ["Item", "Estimate before buying", "Quote from the store"],
  rows: [
    ["Lumber", "$120", "$117.00"],
    ["Soil", "$50", "$48.00"],
    ["Seed packets", "$30", "$27.00"],
  ],
};

export default {
  id: "g8-cte-plan-a-small-budget-project",
  title: "Plan a Small Budget Project: Workplace Words",
  grade: "8",
  band: "6-8",
  subject: "cte",
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the Career Ready Practices on planning money, critical thinking and teamwork; not mapped to a district unit sequence.",
  },
  standards: ["CRP.02", "CRP.03", "CRP.08", "CRP.12"],
  entries: [
    {
      id: "budget",
      word: "budget",
      pos: "noun",
      pron: "BUJ-it",
      def: "The total amount of money a project is allowed to spend.",
      visual: BUDGET_BARS,
      context: "The crew's budget is 240 dollars, and it plans to set aside 24 dollars of it.",
      nonExample: "The price of one board is not the budget. The budget covers the whole project.",
      academicSentence:
        "A team writes a budget so it can check that its plan costs no more than it can spend.",
      everyday: "Like deciding how much of your allowance you can spend before you start shopping.",
      misconception:
        "A budget is not the same as the plan's cost. The budget is the limit, and the plan's cost is what the team expects to spend.",
      related: ["constraint", "contingency", "estimate"],
      practice: {
        visualPrompt: "Which bar shows the whole budget?",
        speakWrite:
          "Tell a partner what a budget is for a project you know. Write one sentence that starts: The budget for ___ is ___.",
        retrieval:
          "Yesterday we planned money for a project. Which word names the total a project may spend?",
      },
      ...common,
    },
    {
      id: "estimate",
      word: "estimate",
      pos: "noun",
      pron: "ES-tuh-mit",
      def: "A careful guess of what something will cost, made before you buy it.",
      visual: estimateTable,
      context: "Our estimate for the lumber was 120 dollars, and the quote came in at 117 dollars.",
      nonExample: "A receipt is not an estimate. A receipt shows what was already paid.",
      academicSentence: "A team makes an estimate first and then compares it with the real quote.",
      everyday: "Like guessing the cost of a pizza order before you see the menu.",
      misconception:
        "An estimate is not a wild guess. It uses real prices and quantities, usually rounded to make the math easier.",
      morphology: {
        parts: [{ part: "estimat-", meaning: "to judge the size or value of something" }],
      },
      related: ["quote", "budget"],
      practice: {
        visualPrompt: "Which column shows the estimate?",
        speakWrite:
          "Estimate the cost of 5 notebooks at $1.80 each by rounding. Say how you did it. Write the estimate.",
        retrieval: "Which word names a careful guess made before you buy?",
      },
      ...common,
    },
    {
      id: "quote",
      word: "quote",
      pos: "noun",
      pron: "KWOHT",
      def: "A price a seller gives you for the items you want to buy.",
      visual: quoteTable({ totals: false }),
      context:
        "The hardware store gave the crew a quote for the lumber, screws, soil, seeds and gloves.",
      nonExample:
        "A quote in an essay is not a price quote. In this lesson, a quote is a price list from a seller.",
      academicSentence:
        "A quote lists the item, the quantity and the unit cost so the buyer can check the total.",
      everyday: "Like the price a mechanic tells you before fixing your bike.",
      misconception:
        "A quote is not an order. The team can compare quotes before it decides to buy.",
      related: ["unit-cost", "quantity", "estimate"],
      practice: {
        visualPrompt: "Which picture shows a quote for supplies?",
        speakWrite: "Tell a partner what three columns a quote might have. Write them in order.",
        retrieval: "What does a seller give you before you buy?",
      },
      ...common,
    },
    {
      id: "unit-cost",
      word: "unit cost",
      pos: "noun phrase",
      pron: "YOO-nit KOST",
      def: "The price of one item, such as one board or one bag.",
      visual: quoteTable({ totals: true, highlight: [[2, 2]] }),
      context: "The unit cost of a bag of soil is 4 dollars and 80 cents.",
      nonExample:
        "A line total is not a unit cost. The line total is the cost of all of the items on one line.",
      academicSentence: "To find a line total, multiply the unit cost by the quantity.",
      everyday: "Like the price on the shelf tag for one can of paint.",
      misconception: "The unit cost is for one item only. It is not the cost of the whole order.",
      morphology: { parts: [{ part: "unit", meaning: "one" }] },
      related: ["quantity", "line-total"],
      practice: {
        visualPrompt: "Which number is the unit cost of a bag of soil?",
        speakWrite: "Name the unit cost of one item you know. Write: One ___ costs ___.",
        retrieval: "What do we multiply by the quantity to get a line total?",
      },
      ...common,
    },
    {
      id: "quantity",
      word: "quantity",
      pos: "noun",
      pron: "KWON-tuh-tee",
      def: "How many of an item you need.",
      visual: quoteTable({ totals: true, highlight: [[0, 1]] }),
      context: "The quantity of boards is 12, because each bed needs 4.",
      nonExample:
        "The price is not the quantity. The quantity tells how many, not how much it costs.",
      academicSentence: "The quantity times the unit cost gives the line total.",
      everyday: "Like the number of seats you need to buy for a field trip.",
      misconception:
        "Quantity counts items. It is not a measurement such as pounds, unless the item is sold by weight.",
      related: ["unit-cost", "line-total"],
      practice: {
        visualPrompt: "Which column shows the quantity?",
        speakWrite:
          "Tell a partner how many of one item your team needs and why. Write the quantity.",
        retrieval: "Which word tells how many of an item you need?",
      },
      ...common,
    },
    {
      id: "line-total",
      word: "line total",
      pos: "noun phrase",
      pron: "LYN TOH-tul",
      def: "The cost of one line on a quote: the quantity times the unit cost.",
      visual: quoteTable({ totals: true, highlight: [[2, 3]] }),
      context: "The line total for 10 bags of soil at 4 dollars and 80 cents each is 48 dollars.",
      nonExample: "The plan total is not a line total. The plan total adds up all the line totals.",
      academicSentence: "We add all the line totals to find the plan total.",
      everyday: "Like the amount you owe for the three notebooks on your school supply list.",
      misconception: "A line total is not the unit cost. Multiply by the quantity first.",
      related: ["unit-cost", "quantity", "budget"],
      practice: {
        visualPrompt: "Which number is the line total for the soil?",
        speakWrite:
          "Say how you find a line total in a full sentence. Write the multiplication for one line.",
        retrieval: "How do you find the cost of one line on a quote?",
      },
      ...common,
    },
    {
      id: "contingency",
      word: "contingency",
      pos: "noun",
      pron: "kun-TIN-jun-see",
      def: "Money set aside for surprises, so a small mistake does not stop the project.",
      visual: RESERVE_TAPE,
      context:
        "The crew keeps a contingency of 10 percent, which is 24 dollars of its 240 dollar budget.",
      nonExample:
        "A contingency is not extra money to spend on anything. It is held back until something goes wrong.",
      academicSentence:
        "Teams set aside a contingency so a price change does not stop the project.",
      everyday: "Like keeping a few dollars in your pocket in case you lose your bus pass.",
      misconception:
        "People often spend the contingency early. It is meant for surprises, not for the plan.",
      related: ["budget", "constraint"],
      practice: {
        visualPrompt: "Which part of the bar is the contingency?",
        speakWrite:
          "Tell a partner why a team keeps a contingency. Write one sentence with because.",
        retrieval: "What is money set aside for surprises called?",
      },
      ...common,
    },
    {
      id: "scope",
      word: "scope",
      pos: "noun",
      pron: "SKOHP",
      def: "Everything a project includes, and what it does not include.",
      visual: SCOPE_TABLE,
      context:
        "The scope of the garden project is three raised beds, soil and seeds. A greenhouse is out of scope.",
      nonExample: "The budget is not the scope. The budget is money; the scope is the work.",
      academicSentence:
        "A team agrees on the scope first so everyone knows what the project will deliver.",
      everyday: "Like a list of what your family is going to clean before a party.",
      misconception:
        "Cutting the scope is not the same as saving money in a smart way. Taking out a bed changes what the team delivers.",
      related: ["deliverable", "constraint", "trade-off"],
      practice: {
        visualPrompt: "Which column lists what is in scope?",
        speakWrite:
          "Tell a partner one thing that is in scope and one thing that is out of scope for a project. Write both.",
        retrieval: "What word names everything a project includes?",
      },
      ...common,
    },
    {
      id: "constraint",
      word: "constraint",
      pos: "noun",
      pron: "kun-STRAYNT",
      def: "A limit a project must stay within, such as money, time or safety rules.",
      visual: CONSTRAINT_BARS,
      context: "The spending limit is a constraint, and the plan at 220 dollars is above it.",
      nonExample:
        "A goal is not a constraint. A goal is what you want; a constraint is a limit you must stay inside.",
      academicSentence: "Every project has constraints that shape the choices a team can make.",
      everyday: "Like a bedtime you must follow no matter how much homework you have.",
      misconception:
        "A constraint is not always a problem. It helps the team decide which choices are possible.",
      morphology: {
        parts: [
          { part: "con-", meaning: "together" },
          { part: "strain", meaning: "to hold tight" },
        ],
      },
      related: ["budget", "trade-off", "scope"],
      practice: {
        visualPrompt: "Which bar shows the constraint?",
        speakWrite:
          "Name one constraint for a project. Write: A constraint for this project is ___.",
        retrieval: "What word names a limit a project must stay within?",
      },
      ...common,
    },
    {
      id: "trade-off",
      word: "trade-off",
      pos: "noun",
      pron: "TRAYD-awf",
      def: "Giving up one thing to keep or gain another.",
      visual: TRADE_OFF_TABLE,
      context:
        "Buying one fewer bag of soil is a trade-off: the crew saves money and gives up a little extra soil.",
      nonExample:
        "Getting everything you want is not a trade-off. A trade-off means you give something up.",
      academicSentence:
        "A good trade-off lowers the cost without risking safety or leaving the job unfinished.",
      everyday:
        "Like choosing to stay up late to finish a project and then feeling tired the next morning.",
      misconception:
        "A trade-off is not a loss for no reason. The team chooses what to give up on purpose, after weighing the options.",
      related: ["constraint", "scope"],
      practice: {
        visualPrompt: "Which option is a safe trade-off?",
        speakWrite: "Tell a partner about a trade-off you made. Write: I gave up ___ to keep ___.",
        retrieval: "What do we call giving up one thing to keep or gain another?",
      },
      ...common,
    },
    {
      id: "deliverable",
      word: "deliverable",
      pos: "noun",
      pron: "dih-LIV-er-uh-bul",
      def: "The finished thing a team promises to hand over.",
      visual: DELIVERABLE_FLOW,
      context: "The deliverable for the crew is three finished and planted garden beds.",
      nonExample: "A draft plan is not the deliverable. It is a step on the way to it.",
      academicSentence: "A team checks its work against the deliverable it promised.",
      everyday: "Like the finished poster you hand in at the end of a group project.",
      misconception: "A deliverable is not a list of tasks. It is the finished result.",
      morphology: {
        parts: [
          { part: "deliver", meaning: "to hand over" },
          { part: "-able", meaning: "able to be" },
        ],
      },
      related: ["scope", "budget"],
      practice: {
        visualPrompt: "Which step in the picture is the deliverable?",
        speakWrite: "Name a deliverable for a school project. Write: The deliverable is ___.",
        retrieval: "What do we call the finished thing a team promises to hand over?",
      },
      ...common,
    },
    {
      id: "personal-protective-equipment",
      word: "personal protective equipment",
      pos: "noun phrase",
      pron: "PUR-suh-nul pruh-TEK-tiv ih-KWIP-munt",
      def: "Safety gear, such as gloves and glasses, that protects a worker's body.",
      visual: PPE_PICTURE,
      context:
        "The crew wears gloves and safety glasses, which are personal protective equipment, when it builds the beds.",
      nonExample:
        "A tool such as a hammer is not personal protective equipment. Protective equipment keeps the worker from getting hurt.",
      academicSentence:
        "A project plan counts personal protective equipment as a must-have cost, not an extra.",
      everyday: "Like a helmet when you ride a bike.",
      misconception:
        "Safety gear is not optional when money is tight. A team does not cut it to stay under budget.",
      related: ["trade-off", "constraint"],
      practice: {
        visualPrompt: "Which items in the picture are personal protective equipment?",
        speakWrite:
          "Name two pieces of safety gear and what each protects. Write one sentence with because.",
        retrieval: "What do we call the gloves and glasses a worker wears?",
      },
      ...common,
    },
  ],
  review: { status: "authored", checks: {} },
};
