// Lesson pack: Plan a Small Budget Project (grade 8 career and technical education). Original scenario; every price is invented.
// Every numeric answer carries a calc the validator recomputes.
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

const planB = {
  kind: "table",
  alt: "A second plan, a painted fence for the school field. Plywood sheets: 4 at 28 dollars and 50 cents each. Cans of paint: 3 at 11 dollars and 25 cents. Brushes: 6 at 2 dollars and 50 cents. Safety glasses: 5 at 4 dollars each. The budget is 200 dollars with a 10 percent contingency.",
  head: ["Item", "Quantity", "Unit cost"],
  rows: [
    ["Plywood sheet", "4", "$28.50"],
    ["Can of paint", "3", "$11.25"],
    ["Brush", "6", "$2.50"],
    ["Safety glasses", "5", "$4.00"],
  ],
};

export default {
  id: "g8-cte-plan-a-small-budget-project",
  kind: "lesson",
  title: "Plan a Small Budget Project",
  subtitle: "Estimate and total a project plan, set aside a contingency and justify a trade-off",
  grade: "8",
  band: "6-8",
  subject: "cte",
  duration: 50,
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the Career Ready Practices on applying academic skills (CRP.02), planning money (CRP.03), communicating clearly (CRP.04), critical thinking (CRP.08) and teamwork (CRP.12); not mapped to a district unit sequence. The project and all prices are invented for practice.",
  },
  standards: ["CRP.02", "CRP.03", "CRP.04", "CRP.08", "CRP.12"],
  wida: {
    eld: ["ELD-SI"],
    klus: ["Explain", "Argue"],
    domains: ["Reading", "Speaking", "Writing"],
    cluster: "6-8",
  },
  contentObjective:
    "I can estimate and total the cost of a small project, find the amount I can spend after setting aside a contingency, and choose a trade-off that keeps the plan safe and complete.",
  languageObjective:
    "I can justify a budget change to a team lead by saying 'The plan costs ___, which is over our limit by ___' and 'I propose ___ because ___'.",
  languageDemands: {
    functions: [
      "describe the cost of a plan",
      "justify a change with numbers and reasons",
      "ask a lead for a decision",
    ],
    structures: [
      "The plan costs ___, but our limit is ___, so we are ___ over.",
      "I propose ___ instead of ___, which saves ___.",
      "I chose this because it keeps ___ and still ___.",
    ],
    discourse:
      "A short workplace proposal: problem, numbers, proposed change, reasons and a request for a decision, then a written one-paragraph version.",
    barriers: [
      "'quote', 'budget', 'scope' and 'constraint' have everyday or school meanings that differ from their workplace meanings",
      "'unit cost', 'line total' and 'plan total' are close in form but name different amounts",
      "'10 percent of 240' and 'set aside' hide a two-step calculation",
      "'over', 'under' and 'within' the limit are easy to reverse",
      "trade-off language such as 'instead of', 'rather than' and 'as long as' packs a comparison into a few words",
    ],
    oralRehearse: [
      "The plan costs 220 dollars, but our limit is 216 dollars, so we are 4 dollars over.",
      "I propose buying 9 bags of soil instead of 10, which saves 4.80 dollars.",
      "I chose this because it keeps the gloves and still lets us fill every bed.",
    ],
    writeScaffold:
      "The plan costs ___, which is ___ over our limit of ___. I propose ___, which saves ___. I chose this because ___.",
  },
  vocab: {
    collection: "g8-cte-plan-a-small-budget-project",
    ids: [
      "budget",
      "estimate",
      "quote",
      "unit-cost",
      "quantity",
      "line-total",
      "contingency",
      "scope",
      "constraint",
      "trade-off",
      "deliverable",
      "personal-protective-equipment",
    ],
  },
  launch: {
    title: "Notice and Wonder: a supply quote",
    visual: quoteTable({ totals: false }),
    prompts: [
      "What do you notice about this quote?",
      "What do you wonder about the project that needs these supplies?",
      "If you were the crew's treasurer, what would you want to check first?",
    ],
    teacherNote:
      "Show only the quote, with no title. Take two noticings (for example 'there are different quantities' or 'gloves are on the list') and one wondering. Reveal that the crew will build three raised garden beds for the school garden with a budget of 240 dollars. Ask 'What would you check before you place the order?' and record answers such as 'add everything up' and 'is it safe?'. Return to these at the end of the lesson.",
  },
  teach: {
    model: [
      "Before a team buys anything, it plans. The scope names what the project includes. Our crew will build three raised garden beds, fill them with soil and plant them. A greenhouse is out of scope. The deliverable is three finished, planted beds. The constraints are the budget and the safety rules.",
      "A team first makes an estimate by rounding prices and quantities, then gets a quote from the seller. A quote lists each item, the quantity and the unit cost. The line total is the quantity times the unit cost. The 12 boards at 9.75 dollars cost 12 times 9.75, which is 117 dollars. The other line totals are 13, 48, 27 and 15 dollars. The plan total adds all the line totals: 117 + 13 + 48 + 27 + 15 is 220 dollars.",
      "The crew's budget is 240 dollars. A smart team also keeps a contingency, money set aside for surprises. Our crew keeps 10 percent, which is 24 dollars. The crew can spend 240 minus 24, which is 216 dollars. The plan is 220 dollars, so it is 4 dollars over the limit.",
      "When a plan is over, the team looks for a trade-off: it gives up one thing to keep another. A good trade-off passes three tests. Does the plan get under the limit? Is everyone still safe? Is the job still complete? Skipping the gloves fails the safety test. Buying 11 boards fails the scope test because three beds need 12 boards. Spending the contingency breaks the team's own rule. Buying 9 bags of soil instead of 10 saves 4.80 dollars, gets the total to 215.20 dollars and passes all three tests.",
      "A worker who finds a problem tells the team lead early and clearly. A strong proposal has five parts: state the problem, show the numbers, propose a specific change, give reasons, and ask for a decision. Reasons that include safety and finishing the job are stronger than reasons that only mention cost.",
      "These skills are used in many jobs. A landscaper, a builder, a restaurant manager and an event planner all estimate costs, compare quotes, watch a budget and protect safety first. Career Ready Practices name these habits: applying skills to a task, planning money, communicating clearly, thinking critically and working in a team.",
    ],
    moves: [
      "Build the quote on the board in the order a team would: item, quantity, unit cost, then the line total. Put a box around the line total formula and point to it each time.",
      "Name the three tests (limit, safety, complete) on an anchor chart and apply them out loud to each possible cut before accepting or rejecting it.",
      "Allow calculators for the arithmetic. The goal is to decide, not to multiply by hand, and require students to write the operation they are doing before they use the calculator.",
      "Say 'over the limit by ___' and 'under the limit by ___' and have students repeat the phrases with a number each time.",
      "Model a proposal aloud as a team lead and a team member, using the five-part structure, and then have students rehearse it with a partner before they write.",
    ],
  },
  guided: [
    {
      id: "g1",
      type: "numeric",
      prompt:
        "The seed packet line on the quote is 12 packets at $2.25 each. What is the line total, in dollars?",
      answer: 27,
      calc: "12*2.25",
      hint: "The unit cost is for one packet. How many packets are on the line?",
      supports: {
        ee: {
          frames: ["One packet costs ___.", "I buy ___ packets."],
          wordBank: ["quantity", "unit cost", "line total", "times"],
          visual: quoteTable({ totals: true, highlight: [[3, 1]] }),
          oral: "Say the quantity and the unit cost out loud.",
        },
        dev: {
          frames: ["The line total is ___ times ___ because ___."],
          wordBank: ["multiply", "unit cost"],
        },
        exp: { frames: ["I multiplied the ___ by the ___ because every packet costs the same."] },
        br: {},
      },
    },
    {
      id: "g2",
      type: "numeric",
      prompt:
        "The five line totals are $117.00, $13.00, $48.00, $27.00 and $15.00. What is the plan total, in dollars?",
      answer: 220,
      calc: "117+13+48+27+15",
      hint: "The plan total is the cost of every line together.",
      supports: {
        ee: {
          frames: ["The plan total is the sum of ___."],
          wordBank: ["add", "sum", "line totals", "plan total"],
          visual: quoteTable({ totals: true }),
          oral: "Point to each line total and add as you go.",
        },
        dev: {
          frames: ["I added the ___ to find the ___."],
          wordBank: ["line totals", "plan total"],
        },
        exp: { frames: ["The plan total is the sum of the line totals, which is ___."] },
        br: {},
      },
    },
    {
      id: "g3",
      type: "numeric",
      prompt:
        "The crew's budget is $240 and it sets aside a contingency of 10 percent. How many dollars can the crew spend on the plan?",
      answer: 216,
      calc: "240-240*0.1",
      hint: "Find 10 percent of the budget first. Then decide if you add it or take it away.",
      supports: {
        ee: {
          frames: ["The contingency is ___ dollars.", "I can spend ___ dollars."],
          wordBank: ["budget", "contingency", "percent", "spend"],
          visual: RESERVE_TAPE,
          oral: "Say how much is set aside. Then say how much is left.",
        },
        dev: {
          frames: ["The contingency is ___ percent of ___, so I can spend ___."],
          wordBank: ["percent of", "subtract"],
        },
        exp: {
          frames: [
            "I subtracted the contingency of ___ from the budget of ___ because it is set aside.",
          ],
        },
        br: {},
      },
    },
    {
      id: "g4",
      type: "choice",
      prompt:
        "The plan is 4 dollars over the limit. Which change fixes it without risking safety or leaving a bed unfinished?",
      choices: [
        "Skip the gloves",
        "Buy 9 bags of soil instead of 10",
        "Buy 11 boards instead of 12",
        "Spend 4 dollars of the contingency",
      ],
      answer: 1,
      hint: "Test each choice with three questions: under the limit, safe and complete.",
      supports: {
        ee: {
          frames: ["This choice is safe because ___.", "This choice leaves out ___."],
          wordBank: ["safe", "limit", "complete", "gloves"],
          visual: TRADE_OFF_TABLE,
          oral: "Say yes or no to each choice and tell why.",
        },
        dev: {
          frames: ["This choice works because it ___ and still ___."],
          wordBank: ["safety", "scope", "limit"],
        },
        exp: { frames: ["The other choices fail because ___ and ___."] },
        br: {},
      },
    },
  ],
  collaborate: {
    title: "Budget meeting: fix the fence plan",
    task: "Teams of three get the fence plan: a painted fence for the school field with a 200 dollar budget and a 10 percent contingency. The team needs 4 sheets of plywood, 3 cans of paint to cover them, 6 brushes on the list but only 4 painters at a time, and safety glasses for all 5 crew members. Roles: Estimator, Safety checker and Presenter. The Estimator finds every line total, the plan total and the amount the crew can spend. The Safety checker tests each proposed cut against the three tests (under the limit, safe, complete). The Presenter prepares a one-minute proposal to the teacher as team lead, using the five-part structure: problem, numbers, change, reasons, request for a decision.",
    visual: planB,
    roles: ["Estimator", "Safety checker", "Presenter"],
    discussionCards: [
      {
        prompt: "How far over the limit is the plan? Show the numbers you used.",
        frame: "The plan costs ___ and our limit is ___, so we are ___ over.",
      },
      {
        prompt: "Which cut did your team reject, and which test did it fail?",
        frame: "We rejected ___ because it fails the ___ test.",
      },
      {
        prompt: "What is your proposal, and what is your best reason?",
        frame: "We propose ___ because it keeps ___ and still ___.",
      },
    ],
  },
  threeWays: {
    see: {
      title: "See it: the limit and the plan",
      visualOrModel: CONSTRAINT_BARS,
      teacherNote:
        "Place the bar chart beside the quote table and the contingency bar. Ask which bar is the constraint and which is the plan. Have students say 'The plan is over the limit by ___' using the heights of the bars. Then show the trade-off table and ask what each option saves and what it costs the project.",
    },
    discuss: {
      title: "Say it: a five-part proposal",
      structure:
        "Partner 1 plays the team member and Partner 2 plays the lead. The team member says one part of the proposal at a time (problem, numbers, change, reasons, request) and the lead responds with a question that fits the part. Swap roles and use a new plan.",
      frames: [
        "We have a problem: the plan costs ___ and our limit is ___.",
        "I propose ___ instead of ___, which saves ___.",
        "Why that change and not another?",
        "I chose this because it keeps ___ and still ___. Can you approve it?",
      ],
    },
    apply: {
      title: "Use it: your own small project",
      task: "Choose a small project you could really do, such as a school sale table, a classroom garden or a poster display. List five items with a quantity and a unit cost. Find the line totals and the plan total. Pick a budget and a contingency percent, find what you can spend, and check the plan against it. If the plan is over, write a trade-off that passes the three tests. Write a short paragraph to your team lead that uses the five parts.",
      successCriteria: [
        "I show every line total and the plan total with the operation I used.",
        "I find the amount I can spend after the contingency.",
        "I choose a trade-off that is under the limit, safe and complete.",
        "My paragraph states the problem, the numbers, the change, my reasons and a request for a decision.",
      ],
    },
  },
  activities: [
    { engine: "escape-challenge", id: "g8-cte-garden-budget-escape" },
    { engine: "conversation-studio", id: "g8-cte-budget-conversation" },
  ],
  independent: {
    items: [
      {
        id: "i1",
        type: "numeric",
        prompt:
          "In the fence plan, 4 sheets of plywood cost $28.50 each. What is the line total for the plywood, in dollars?",
        answer: 114,
        calc: "4*28.5",
        explain:
          "The line total is the quantity times the unit cost: 4 times 28.50 is 114 dollars.",
      },
      {
        id: "i2",
        type: "numeric",
        prompt:
          "The fence plan has plywood 4 at $28.50, paint 3 cans at $11.25, brushes 6 at $2.50 and safety glasses 5 at $4.00. What is the plan total, in dollars?",
        answer: 182.75,
        calc: "4*28.5+3*11.25+6*2.5+5*4",
        explain: "The line totals are 114.00, 33.75, 15.00 and 20.00. Their sum is 182.75 dollars.",
      },
      {
        id: "i3",
        type: "numeric",
        prompt:
          "The fence budget is $200 and the team keeps a 10 percent contingency. How many dollars can the team spend on the plan?",
        answer: 180,
        calc: "200-200*0.1",
        explain:
          "Ten percent of 200 is 20 dollars. The team can spend 200 minus 20, which is 180 dollars.",
      },
      {
        id: "i4",
        type: "numeric",
        prompt:
          "The fence plan costs $182.75 and the team can spend $180. By how many dollars is the plan over the limit?",
        answer: 2.75,
        calc: "182.75-180",
        explain:
          "The plan is over by the difference between the plan total and the limit: 182.75 minus 180 is 2.75 dollars.",
      },
      {
        id: "i5",
        type: "choice",
        prompt:
          "The fence plan is $2.75 over. The team needs 4 plywood sheets and 3 cans of paint to finish, 4 people paint at a time, and all 5 members need safety glasses. Which change fixes the plan?",
        choices: [
          "Buy 5 brushes instead of 6",
          "Buy 4 brushes instead of 6",
          "Skip the safety glasses",
          "Buy 3 sheets of plywood instead of 4",
        ],
        answer: 1,
        explain:
          "Four brushes saves 5 dollars, so the plan is 177.75 dollars, which is under the limit, and 4 painters can still work. Five brushes only saves 2.50, so the plan would still be 25 cents over. Skipping the glasses is unsafe and 3 sheets leaves the fence unfinished.",
      },
      {
        id: "i6",
        type: "short",
        prompt:
          "Write a two-sentence proposal to the team lead for the fence plan. Name the problem with numbers and propose a change with its savings.",
        answer:
          "The plan costs 182.75 dollars, which is 2.75 over our limit of 180 dollars. I propose buying 4 brushes instead of 6, which saves 5 dollars and brings us to 177.75 dollars.",
        explain:
          "A strong proposal names the plan total, the limit and the gap, then gives one specific change with its savings and the new total.",
      },
      {
        id: "i7",
        type: "short",
        prompt:
          "A teammate says: 'The project is almost done, so let's spend the contingency.' In one or two sentences, explain why the team should not do that.",
        answer:
          "The contingency is set aside for surprises, so if the team spends it now it has nothing left if a price changes or something breaks.",
        explain:
          "The contingency protects the project from surprises; spending it early removes that protection.",
      },
    ],
  },
  formative: {
    items: [
      {
        id: "f1",
        type: "numeric",
        prompt: "A quote lists 6 brushes at $2.50 each. What is the line total, in dollars?",
        answer: 15,
        calc: "6*2.5",
        explain: "Multiply the quantity by the unit cost: 6 times 2.50 is 15 dollars.",
      },
      {
        id: "f2",
        type: "choice",
        prompt: "Which word names money set aside for surprises?",
        choices: ["Contingency", "Quote", "Scope", "Deliverable"],
        answer: 0,
        explain: "A contingency is money held back for surprises.",
      },
      {
        id: "f3",
        type: "short",
        prompt: "Explain the difference between a unit cost and a line total.",
        answer:
          "A unit cost is the price of one item. A line total is the quantity times the unit cost, so it is the cost of all the items on that line.",
        explain: "Unit cost is for one item; a line total is for the whole line.",
      },
    ],
  },
  exitTicket: {
    prompt: "Show what you can do when a plan is over budget.",
    items: [
      {
        id: "e1",
        type: "numeric",
        prompt:
          "A team has a $500 budget and keeps a 10 percent contingency. How many dollars can the team spend on the plan?",
        answer: 450,
        calc: "500-500*0.1",
        explain: "Ten percent of 500 is 50. The team can spend 500 minus 50, which is 450 dollars.",
      },
      {
        id: "e2",
        type: "choice",
        prompt: "A plan is over the limit. What should a team ask first about a possible cut?",
        choices: [
          "Does it keep everyone safe and the job complete?",
          "Which cut saves the most money?",
          "Which cut is easiest to explain?",
          "Which cut will nobody notice?",
        ],
        answer: 0,
        explain:
          "A cut that risks safety or leaves the job unfinished is not a good trade-off, whatever it saves.",
      },
      {
        id: "e3",
        type: "short",
        prompt: "Name one constraint and one trade-off from the garden project.",
        answer:
          "A constraint is the 216 dollar spending limit. A trade-off is buying 9 bags of soil instead of 10.",
        explain:
          "Any limit the project must stay within is a constraint, and any change that gives up one thing to keep another is a trade-off.",
      },
    ],
    successCriteria: [
      "I found the amount I can spend after the contingency.",
      "I tested a cut for safety and completeness before I chose it.",
      "I used the words constraint and trade-off correctly.",
    ],
  },
  answerKey: {
    notes:
      "Accept answers with or without dollar signs. For the proposal items look for the five parts (problem, numbers, change, reasons, request), not one fixed sentence. A student may propose a different valid change, for example 10 seed packets instead of 12 for the garden plan; check it against the three tests: under the limit, safe and complete. Do not accept a plan that cuts safety equipment or spends the contingency.",
    items: {
      g1: "27 dollars. 12 times 2.25 is 27.",
      g2: "220 dollars. 117 + 13 + 48 + 27 + 15 is 220.",
      g3: "216 dollars. 10 percent of 240 is 24, and 240 minus 24 is 216.",
      g4: "Buy 9 bags of soil instead of 10. It saves 4.80 dollars, brings the total to 215.20, and every bed can still be filled.",
      i1: "114 dollars. 4 times 28.50 is 114.",
      i2: "182.75 dollars. 114 + 33.75 + 15 + 20 is 182.75.",
      i3: "180 dollars. 10 percent of 200 is 20, and 200 minus 20 is 180.",
      i4: "2.75 dollars. 182.75 minus 180 is 2.75.",
      i5: "Buy 4 brushes instead of 6. It saves 5 dollars, the total is 177.75 dollars, which is under the limit, and 4 painters can still work.",
      i6: "Sample: The plan costs 182.75 dollars, which is 2.75 over our limit of 180 dollars. I propose buying 4 brushes instead of 6, which saves 5 dollars and brings us to 177.75 dollars.",
      i7: "The contingency is held back for surprises. If it is spent early, the team has nothing if a price changes or something breaks.",
      f1: "15 dollars.",
      f2: "Contingency.",
      f3: "Unit cost is the price of one item. A line total is the quantity times the unit cost.",
      e1: "450 dollars.",
      e2: "Does it keep everyone safe and the job complete?",
      e3: "Sample: A constraint is the 216 dollar spending limit. A trade-off is buying 9 bags of soil instead of 10.",
    },
  },
  extension: {
    title: "Compare two quotes",
    task: "A second seller quotes garden soil at 4.50 dollars per 40-pound bag with a flat delivery fee of 12 dollars. The first seller charges 4.80 dollars per bag with no delivery fee. Find the total cost of 10 bags from each seller (10 times 4.80 is 48 dollars; 10 times 4.50 plus 12 is 57 dollars). Decide which quote is cheaper for 10 bags. Then find the number of bags at which the second seller becomes cheaper, and write one sentence that explains how a team should choose between the two sellers.",
  },
  homeLanguage: {
    es: {
      objective:
        "Puedo estimar y sumar el costo de un proyecto pequeño, calcular cuánto puedo gastar después de apartar una reserva y justificar un cambio.",
      vocab: [
        { en: "budget", es: "presupuesto", verified: false },
        { en: "estimate", es: "estimación", verified: false },
        { en: "quote", es: "cotización", verified: false },
        { en: "unit cost", es: "costo unitario", verified: false },
        { en: "contingency", es: "reserva para imprevistos", verified: false },
        { en: "scope", es: "alcance", verified: false },
        { en: "constraint", es: "restricción", verified: false },
        { en: "trade-off", es: "compensación", verified: false },
      ],
      familyPrompt:
        "Hablen en casa de un gasto pequeño de la familia. Digan cuánto cuesta cada cosa, sumen el total y digan si cabe en el presupuesto.",
    },
  },
  printables: ["vocab-mat", "task-cards", "partner-project", "exit-ticket"],
  teacherNotes: {
    pacing:
      "Launch 5 minutes. Teaching and guided practice 15. Fence plan team task 15. Escape activity or conversation rehearsal 12. Exit ticket 3. If time is short, run the conversation rehearsal as a whole-class model and move the escape challenge to the next class.",
    misconceptions: [
      "Unit cost for line total: students report the price of one item as the total. Ask 'for how many?' and have them write the quantity next to every price.",
      "Percent of the budget: students subtract 10 dollars instead of 10 percent. Draw the budget as ten equal parts and shade one.",
      "Spend the contingency: students treat the reserve as money to use. Ask what happens if a price goes up after they spend it.",
      "Cheapest cut wins: students choose the cut that saves the most. Use the three tests (under the limit, safe, complete) before any cut is accepted.",
      "Close enough: students accept a plan that is a few cents over. Show that 180.25 is still over 180, and why a limit is a limit.",
    ],
    differentiation:
      "Entering and Emerging learners use the quote table, the frames and the word bank, point to numbers while speaking and use calculators for every multiplication. Developing learners write the operation beside each line total. Expanding and Bridging learners compare two cuts against the three tests and justify in a paragraph. The tasks, the numbers and the answers are the same in every tier.",
    languageNotes:
      "Teach 'over', 'under' and 'within' with a number line or a bar chart. Use gestures for 'set aside' (move a pile to the side) and 'trade-off' (hand over one item, take another). Say 'per' as 'for each' for unit cost. Keep a word wall with unit cost, quantity, line total and plan total next to each other.",
    careerConnection:
      "This lesson supports CRP 2 (apply academic and technical skills), CRP 3 (attend to financial well-being), CRP 4 (communicate clearly), CRP 8 (use critical thinking) and CRP 12 (work productively in teams). Invite a local tradesperson or a school facilities staff member to describe how they estimate costs, if one is available.",
    safety:
      "This lesson is about planning, not building. Before any real building, review tool and workshop safety, and treat safety equipment as a required cost, never as an extra.",
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
