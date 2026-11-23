// Escape Challenge: balance a small project budget for school garden beds (grade 8 career and technical education).
// Prices are invented for practice. Code pieces come from the learner's own correct answers (see engines/escape-challenge.schema.md).

const quoteTable = (lastCol = "Line total") => ({
  kind: "table",
  alt: `A hardware store quote with columns Item, Quantity, Unit price and ${lastCol}. Lumber, 8-foot board: 12 at 9 dollars and 75 cents each. Screws, box of 100: 2 at 6 dollars and 50 cents. Garden soil, 40-pound bag: 10 at 4 dollars and 80 cents. Seed packets: 12 at 2 dollars and 25 cents. Work gloves, pair: 4 at 3 dollars and 75 cents.`,
  head: ["Item", "Quantity", "Unit price", lastCol],
  rows: [
    ["Lumber, 8-ft board", "12", "$9.75", "?"],
    ["Screws, box of 100", "2", "$6.50", "?"],
    ["Garden soil, 40-lb bag", "10", "$4.80", "?"],
    ["Seed packets", "12", "$2.25", "?"],
    ["Work gloves, pair", "4", "$3.75", "?"],
  ],
});

export default {
  id: "g8-cte-garden-budget-escape",
  engine: "escape-challenge",
  title: "Balance the Garden Budget",
  grade: "8",
  band: "6-8",
  subject: "cte",
  lessonId: "g8-cte-plan-a-small-budget-project",
  standards: ["CRP.03", "CRP.08"],
  curriculum: {
    status: "standards-aligned",
    note: "Aligned to the Career Ready Practices on planning money and using critical thinking; not mapped to a district unit sequence. The quote and every price are invented for practice.",
  },
  minutes: 25,
  intro:
    "Your build crew has a quote for three raised garden beds. Open four rooms by checking the numbers, and keep the plan safe and under the spending limit to unlock the project binder.",
  story: {
    title: "The Garden Build Crew",
    setting: "A school workroom, the afternoon before the crew places its order.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "Your crew will build three raised garden beds for the school garden. The supply order goes out in the morning, and the project binder is locked until the plan adds up. Four rooms hold the checks you need.",
      },
      {
        id: "after-quote",
        after: "quote",
        text: "Twelve boards come to a clear number. The first page of the binder opens, and a note says the other lines on the quote still need their totals.",
      },
      {
        id: "after-totals",
        after: "totals",
        text: "Every line on the quote now has a total. A sticky note in your teacher's handwriting says the crew agreed to hold some money back for surprises.",
      },
      {
        id: "after-reserve",
        after: "reserve",
        text: "You know the limit the crew can spend. When you add the quote, the plan is a little over, and the team lead is calling a quick meeting.",
      },
      {
        id: "end",
        after: "end",
        text: "The binder clicks open. The order goes out within the limit, every bed can be built, and everyone keeps their gloves. The crew starts building tomorrow.",
      },
    ],
  },
  rooms: [
    {
      id: "quote",
      title: "The Quote Desk",
      narrative:
        "A clerk slides the quote across the counter. The lumber line says 12 boards at 9 dollars and 75 cents each. The crew needs every board for the beds.",
      gate: { needs: "unit-cost-times-quantity", label: "Finding a line total from a unit price" },
      reveal: "A page of the binder falls open with the first piece of the code.",
      puzzle: {
        type: "numeric",
        prompt:
          "The lumber line is 12 boards at $9.75 each. Every board costs the same. What is the line total for the lumber, in dollars?",
        visual: quoteTable(),
        answer: "117",
        calc: "12*9.75",
        unit: "dollars",
        hints: [
          "The price is for one board. Think about what the cost of many boards means.",
          "When every item costs the same, you repeat the price once for each item.",
          "Write the multiplication with the quantity and the unit price, and check that the result is more than one board's price.",
        ],
        misconceptions: [
          {
            tag: "added-instead-of-multiplied",
            pick: "87/4",
            hint: "That number comes from adding the quantity and the price. A cost for many items repeats the price for each item.",
          },
          {
            tag: "decimal-slip",
            pick: "1170",
            hint: "Twelve boards at under ten dollars each cannot cost more than a hundred and twenty dollars. Check the decimal point in your product.",
          },
          {
            tag: "unit-price-only",
            pick: "39/4",
            hint: "That is the cost of one board. The line total is for all the boards on the quote.",
          },
        ],
        model: {
          text: "A crew buys 6 paintbrushes at $3.20 each. The cost of all the brushes is the price of one brush repeated 6 times, so multiply the quantity by the unit price: 6 times 3.20 is 19.20 dollars.",
        },
        why: "Each of the 12 boards costs 9.75 dollars, so the total repeats 9.75 twelve times, which is 12 times 9.75.",
        transfer: {
          type: "numeric",
          prompt:
            "A crew buys 8 bags of mulch at $5.25 each. Every bag costs the same. What is the line total for the mulch, in dollars?",
          answer: "42",
          calc: "8*5.25",
          unit: "dollars",
          hints: [
            "The price is for one bag. How many bags are on the order?",
            "Repeat the price once for each bag.",
            "Multiply the quantity by the unit price.",
          ],
          why: "Eight bags at 5.25 dollars each cost 8 times 5.25, or 42 dollars.",
        },
        supports: {
          ee: {
            directions:
              "A unit price is the cost of one. The line total is the cost of all of them.",
            frames: ["One board costs ___.", "I buy ___ boards.", "The total is ___ times ___."],
            wordBank: ["quantity", "unit price", "total", "times"],
            oral: "Say it: one board costs this much, and I buy this many.",
          },
          dev: {
            frames: ["The line total is ___ times ___ because ___."],
            wordBank: ["quantity", "unit price", "multiply"],
          },
          exp: { frames: ["I multiplied the ___ by the ___ because every item costs the same."] },
          br: {},
        },
      },
    },
    {
      id: "totals",
      title: "The Totals Table",
      narrative:
        "The crew's work table holds a stack of quote lines and a tray of price tags. Every tag shows a line total, but the tags have been shuffled and two tags are errors.",
      gate: { needs: "line-totals", label: "Matching each line to its total" },
      reveal: "Under the tray you find a second page with another piece of the code.",
      puzzle: {
        type: "match",
        prompt: "Match each quote line to its line total. Two tags do not belong to any line.",
        visual: quoteTable(),
        lefts: [
          { id: "l-screws", text: "2 boxes of screws at $6.50 each", calc: "2*6.5" },
          { id: "l-soil", text: "10 bags of soil at $4.80 each", calc: "10*4.8" },
          { id: "l-seeds", text: "12 seed packets at $2.25 each", calc: "12*2.25" },
          { id: "l-gloves", text: "4 pairs of gloves at $3.75 each", calc: "4*3.75" },
        ],
        rights: [
          { id: "r-13", text: "$13.00", token: "N", value: "13" },
          { id: "r-48", text: "$48.00", token: "D", value: "48" },
          { id: "r-27", text: "$27.00", token: "E", value: "27" },
          { id: "r-15", text: "$15.00", token: "G", value: "15" },
          { id: "r-85", text: "$8.50", token: "X", value: "8.5" },
          { id: "r-48u", text: "$4.80", token: "U", value: "4.8" },
        ],
        answer: { "l-screws": "r-13", "l-soil": "r-48", "l-seeds": "r-27", "l-gloves": "r-15" },
        hints: [
          "Each tag is a line total. A line total uses the quantity and the unit price together.",
          "Compute each line on its own, then look for the tag with that value.",
          "Two tags come from a slip: one is the price of one bag, and one comes from adding instead of multiplying.",
        ],
        misconceptions: [
          {
            tag: "added-screws",
            has: ["l-screws=r-85"],
            hint: "That tag is the result of adding the quantity and the price. Check what multiplying gives for two boxes.",
          },
          {
            tag: "unit-price-for-soil",
            has: ["l-soil=r-48u"],
            hint: "That tag is the price of one bag. The line is for ten bags.",
          },
        ],
        model: {
          text: "A crew buys 5 notebooks at $1.80 each and 3 folders at $2.20 each. Multiply each quantity by its own price: the notebooks come to 9 dollars and the folders to 6.60 dollars. Then match each line to its tag.",
        },
        why: "Each total is quantity times unit price: 2 times 6.50, 10 times 4.80, 12 times 2.25 and 4 times 3.75.",
        transfer: {
          type: "match",
          prompt: "Match each line to its line total. One tag does not belong to any line.",
          lefts: [
            { id: "t-markers", text: "4 markers at $1.50 each", calc: "4*1.5" },
            { id: "t-folders", text: "3 folders at $2.20 each", calc: "3*2.2" },
            { id: "t-notebooks", text: "5 notebooks at $1.80 each", calc: "5*1.8" },
          ],
          rights: [
            { id: "t-6", text: "$6.00", token: "M", value: "6" },
            { id: "t-66", text: "$6.60", token: "F", value: "6.6" },
            { id: "t-9", text: "$9.00", token: "B", value: "9" },
            { id: "t-3", text: "$3.00", token: "Z", value: "3" },
          ],
          answer: { "t-markers": "t-6", "t-folders": "t-66", "t-notebooks": "t-9" },
          hints: [
            "Each line total is the quantity times the unit price.",
            "Work out each line one at a time.",
            "One tag is smaller than every line total.",
          ],
          why: "4 times 1.50 is 6, 3 times 2.20 is 6.60, and 5 times 1.80 is 9.",
        },
        supports: {
          ee: {
            directions: "Find the line total for each line. Then choose the tag that matches.",
            frames: ["___ times ___ is ___."],
            wordBank: ["quantity", "unit price", "total", "match"],
            oral: "Say each multiplication out loud before you choose a tag.",
          },
          dev: {
            frames: ["The total for ___ is ___ because ___ times ___ is ___."],
            wordBank: ["multiply", "line total"],
          },
          exp: {
            frames: ["I matched ___ with ___ because the quantity times the unit price is ___."],
          },
          br: {},
        },
      },
    },
    {
      id: "reserve",
      title: "The Reserve Fund",
      narrative:
        "The treasurer's folder says the crew has a 240 dollar budget. A note says to set aside 10 percent as a reserve for surprises and to spend only what is left.",
      gate: { needs: "contingency-reserve", label: "Setting aside a reserve" },
      reveal: "The treasurer's stamp leaves a number on the next page of the code.",
      puzzle: {
        type: "numeric",
        prompt:
          "The crew has $240 and sets aside 10 percent as a reserve. How many dollars can the crew spend on the plan?",
        visual: {
          kind: "tape",
          alt: "A tape diagram of the 240 dollar budget in ten equal parts. Nine parts are marked spend and one part is marked reserve, 10 percent.",
          w: 480,
          h: 160,
          parts: [
            { label: "spend", units: 9, color: "teal" },
            { label: "reserve", units: 1, color: "ochre" },
          ],
          
        },
        answer: "216",
        calc: "240-240*0.1",
        unit: "dollars",
        hints: [
          "First find how much money the 10 percent is, and then decide whether to add it or take it away.",
          "The reserve is set aside, so the amount the crew can spend is less than the whole budget.",
          "Ten percent of the budget is one tenth of it. Take that amount away from the whole budget.",
        ],
        misconceptions: [
          {
            tag: "reserve-only",
            pick: "24",
            hint: "That is the size of the reserve, not the money left to spend. What is left after you set it aside?",
          },
          {
            tag: "added-reserve",
            pick: "264",
            hint: "The reserve is set aside, not added. The crew has less to spend, not more.",
          },
          {
            tag: "subtracted-ten-dollars",
            pick: "230",
            hint: "Ten percent is not ten dollars. Find one tenth of the budget first.",
          },
        ],
        model: {
          text: "A crew has $300 and keeps 10 percent as a reserve. Ten percent of 300 is 30 dollars, so they set 30 dollars aside and may spend 300 minus 30, which is 270 dollars.",
        },
        why: "Ten percent of 240 is 24 dollars. The crew sets 24 dollars aside, so it can spend 240 minus 24, which is 216 dollars.",
        transfer: {
          type: "numeric",
          prompt:
            "A crew has $180 and sets aside 15 percent as a reserve. How many dollars can the crew spend on the plan?",
          answer: "153",
          calc: "180-180*0.15",
          unit: "dollars",
          hints: [
            "Find the reserve first: fifteen percent of the budget.",
            "The reserve is set aside, so it lowers the amount the crew can spend.",
            "Take the reserve away from the whole budget.",
          ],
          why: "Fifteen percent of 180 is 27 dollars. The crew can spend 180 minus 27, or 153 dollars.",
        },
        supports: {
          ee: {
            directions:
              "A reserve is money you keep for surprises. You do not spend it on the plan.",
            frames: ["The reserve is ___ dollars.", "I can spend ___ dollars."],
            wordBank: ["budget", "reserve", "percent", "spend"],
            oral: "Say it: this much is the reserve, and this much is left.",
          },
          dev: {
            frames: ["The reserve is ___ percent of ___, which is ___, so I can spend ___."],
            wordBank: ["percent of", "subtract"],
          },
          exp: { frames: ["I subtracted the reserve of ___ from ___ because it is set aside."] },
          br: {},
        },
      },
    },
    {
      id: "review",
      title: "The Review Meeting",
      narrative:
        "The team lead taps the plan. All the lines add up to 220 dollars, but the crew's limit is 216 dollars. The gloves protect hands from splinters and nails.",
      gate: {
        needs: "tradeoff-with-safety",
        label: "Making a trade-off without cutting safety or scope",
      },
      reveal: "The lead signs the plan and hands you the last piece of the code.",
      puzzle: {
        type: "explain",
        prompt:
          "The plan is over the limit. Choose all the changes that fix it without risking safety or leaving a bed unfinished.",
        stem: "The beds need 12 boards in all, every bed needs soil, and the crew wears gloves for building. The plan costs 220 dollars and the limit is 216 dollars.",
        choices: [
          "Buy 9 bags of soil instead of 10. That saves 4.80 dollars and brings the total to 215.20, and every bed can still be filled.",
          "Skip the gloves. That saves 15 dollars and brings the total to 205, which is under the limit.",
          "Spend part of the reserve. The crew already has that money, so 220 dollars is fine.",
          "Buy 11 boards instead of 12. That saves 9.75 dollars and brings the total to 210.25.",
          "Buy 10 seed packets instead of 12. That saves 4.50 dollars and brings the total to 215.50, and the garden can still be planted.",
        ],
        answer: [0, 4],
        tokens: ["SOIL", "GLOVES", "RESERVE", "BOARDS", "SEEDS"],
        hints: [
          "A good fix has to do three things: get under the limit, keep everyone safe and keep the project whole.",
          "Test each choice against those three things. Some choices break one of them even though they lower the total.",
          "Two choices save money on supplies the crew can reduce a little without changing safety or leaving something unbuilt.",
        ],
        misconceptions: [
          {
            tag: "skips-safety-gear",
            has: [1],
            hint: "That choice lowers the total. Ask what the gloves are for, and who is at risk without them.",
          },
          {
            tag: "spends-the-reserve",
            has: [2],
            hint: "The crew set that money aside on purpose. Spending it now breaks the plan they agreed to.",
          },
          {
            tag: "short-on-boards",
            has: [3],
            hint: "Check how many boards the three beds need. If the crew buys fewer, can every bed be finished?",
          },
          {
            tag: "only-one-fix",
            pick: "0",
            hint: "That choice works. Is there another change that also keeps safety and the whole project?",
          },
          {
            tag: "only-one-fix-b",
            pick: "4",
            hint: "That choice works. Is there another change that also keeps safety and the whole project?",
          },
        ],
        model: {
          text: "A crew is 6 dollars over its limit. It could skip safety glasses, buy fewer screws than the beds need, or buy one fewer jar of paint and still finish the job. Only the paint change saves money without risking anyone or leaving the job unfinished.",
        },
        why: "Fewer soil bags and fewer seed packets both bring the plan under the limit, keep the gloves and keep every bed buildable and plantable.",
        transfer: {
          type: "explain",
          prompt:
            "A crew is over budget. Choose all the changes that fix it without risking safety or leaving the job unfinished.",
          stem: "The crew needs 8 sheets of plywood, safety glasses for every member and 4 cans of paint. The plan is 10 dollars over the limit.",
          choices: [
            "Skip the safety glasses. That saves 12 dollars.",
            "Buy 3 cans of paint instead of 4 if the crew only needs 3 to cover the plywood. That saves 11 dollars.",
            "Buy 6 sheets of plywood instead of 8 and finish what you can. That saves 24 dollars.",
            "Return an extra roll of tape the crew bought by mistake and does not need. That saves 12 dollars.",
          ],
          answer: [1, 3],
          tokens: ["GLASS", "PAINT", "WOOD", "TAPE"],
          hints: [
            "A good fix gets under the limit, keeps people safe and keeps the job whole.",
            "Check each choice against those three things.",
            "Two choices remove something the crew does not need.",
          ],
          why: "Using exactly the paint the crew needs and returning an unneeded roll both lower the cost without risking safety or leaving the job unfinished.",
        },
        supports: {
          ee: {
            directions:
              "Check every choice: is it safe, does the job get finished, is the total under the limit?",
            frames: ["This choice is safe because ___.", "This choice cuts ___."],
            wordBank: ["safe", "limit", "trade-off", "finished"],
            oral: "Say yes or no to each choice and tell why.",
          },
          dev: {
            frames: ["This fix works because it keeps ___ and gets under ___."],
            wordBank: ["safety", "scope", "limit"],
          },
          exp: { frames: ["The best fixes lower the cost by ___ without ___."] },
          br: {},
        },
      },
    },
  ],
  door: {
    title: "The Project Binder",
    prompt: "Type the code the binder's note describes.",
    order: ["quote", "totals", "reserve", "review"],
    success:
      "The binder opens. The plan is under the limit, safe and complete, and the order goes out in the morning.",
  },
  reflection: {
    prompt:
      "Why did the crew keep a reserve and keep the gloves when the plan went over budget? What would you tell a team about making trade-offs?",
    frames: {
      ee: ["The crew kept ___.", "A trade-off is ___."],
      dev: ["The crew kept the gloves because ___.", "A trade-off means ___."],
      exp: ["A good trade-off lowers the cost without ___, so the crew ___."],
      br: [
        "When a plan goes over budget, a team should weigh ___ against ___ and protect ___ before it cuts anything.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
