// Grade 6 math escape challenge: ratios and unit rates. Original story and numbers.
// Code pieces are derived from the learner's own correct answers (see engines/escape-challenge.schema.md).
export default {
  id: "gold-escape-challenge",
  engine: "escape-challenge",
  title: "Light the Harbor Lamp",
  grade: "6",
  band: "6-8",
  subject: "math",
  standards: ["6.RP.A.1", "6.RP.A.2", "6.RP.A.3b"],
  minutes: 25,
  intro:
    "Light the harbor lamp by opening four rooms. Each room is a ratio or rate puzzle, and your own answers build the door code.",
  curriculum: {
    status: "standards-aligned",
    note: "Original practice on unit rates, equivalent ratios and unit pricing. Not tied to a publisher lesson.",
  },
  story: {
    title: "The Lantern Keeper's Apprentice",
    setting: "A harbor lighthouse, one hour before the evening ferry.",
    beats: [
      {
        id: "start",
        after: "start",
        text: "You are the lighthouse keeper's apprentice. The great lamp has gone dark, and the evening ferry leaves in one hour. The keeper left a locked lamp room door and a note: four rooms hold the pieces of the code.",
      },
      {
        id: "after-supply",
        after: "supply",
        text: "Sharing the cost equally was the right idea. Tucked in the crate you find a second note: the signal glass needs the right mix of paint.",
      },
      {
        id: "after-signal",
        after: "signal",
        text: "The blue and white swirl into exactly the shade the signal glass needs. A rope-stained map points down the hall to the rope loft.",
      },
      {
        id: "after-rope",
        after: "rope",
        text: "You choose the coil that costs least for every meter and carry it toward the stairs. Below you, oil barrels clunk against stone.",
      },
      {
        id: "after-oil",
        after: "oil",
        text: "The right lamp is fueled and humming. Only the brass plate on the lamp room door stands between you and the light.",
      },
      {
        id: "end",
        after: "end",
        text: "Golden light fills the lamp room and sweeps across the water. Far out, the ferry's horn answers. The harbor is safe tonight.",
      },
    ],
  },
  rooms: [
    {
      id: "supply",
      title: "The Supply Room",
      narrative:
        "Crates of lamp wicks line the wall. A tag on the nearest crate says 12 wicks for 9 dollars. The keeper always asks what one wick costs before ordering.",
      gate: { needs: "unit-rate-division", label: "Finding a unit rate by dividing" },
      reveal:
        "Behind the crate you find a brass tag stamped with the first piece of the door code.",
      puzzle: {
        type: "numeric",
        prompt:
          "A crate holds 12 wicks and costs 9 dollars. Every wick costs the same. What is the cost of one wick, in dollars?",
        visual: {
          kind: "table",
          alt: "Ratio table. 12 wicks cost 9 dollars. The cost of 1 wick is not known yet.",
          head: ["Wicks", "Cost in dollars"],
          rows: [
            ["12", "9"],
            ["1", "?"],
          ],
        },
        answer: "3/4",
        calc: "9/12",
        unit: "dollars per wick",
        hints: [
          "Think about sharing: if every wick costs the same, how would you split the cost of the crate?",
          "Per wick means for 1 wick. To get the cost for 1, divide the cost by the number of wicks.",
          "Write the division as a fraction with the cost on top and the number of wicks on the bottom, then write it in lowest terms.",
        ],
        misconceptions: [
          {
            tag: "inverted-rate",
            pick: "4/3",
            hint: "Your number tells how many wicks one dollar would buy. The question asks for dollars for one wick. Which amount belongs on the bottom when you want 'per wick'?",
          },
          {
            tag: "subtracted-instead-of-divided",
            pick: "3",
            hint: "You found how much bigger 12 is than 9. A rate compares two amounts by dividing, not by subtracting.",
          },
          {
            tag: "multiplied-instead-of-divided",
            pick: "108",
            hint: "Multiplying gives a number bigger than the whole crate cost. One wick should cost less than the crate does.",
          },
        ],
        model: {
          text: "A box holds 10 markers and costs 8 dollars. Every marker costs the same. To find the cost of one marker, divide the cost by the number of markers: 8 divided by 10 is 8/10, which is 4/5 of a dollar.",
          visual: {
            kind: "table",
            alt: "Ratio table. 10 markers cost 8 dollars. 1 marker costs 4/5 of a dollar.",
            head: ["Markers", "Cost in dollars"],
            rows: [
              ["10", "8"],
              ["1", "4/5"],
            ],
          },
        },
        why: "Splitting 9 dollars equally among 12 wicks gives 9/12, which is 3/4 of a dollar for one wick.",
        transfer: {
          type: "numeric",
          prompt:
            "A bag holds 6 hooks and costs 10 dollars. Every hook costs the same. What does one hook cost, in dollars? A mixed number is fine.",
          answer: "5/3",
          calc: "10/6",
          unit: "dollars per hook",
          hints: [
            "Sharing equally again: what do you do with the cost and the number of hooks?",
            "Divide the cost by the number of hooks to get the cost of one hook.",
            "The fraction may be greater than 1. You can write it as a mixed number.",
          ],
          why: "10 dollars shared equally among 6 hooks is 10/6 of a dollar, which is the same as 1 and 2/3.",
        },
        supports: {
          ee: {
            directions: "A unit rate tells the amount for 1. Here you want the cost for 1 wick.",
            frames: ["One wick costs ___ dollars.", "The unit rate is ___ dollars per wick."],
            wordBank: ["unit rate", "per", "each", "divide"],
            oral: "Say it: one wick costs how many dollars?",
          },
          dev: {
            frames: ["The unit rate is ___ dollars per wick."],
            wordBank: ["per", "divide", "each"],
          },
          exp: { frames: ["The unit rate is ___ because I divided ___ by ___."] },
          br: {},
        },
      },
    },
    {
      id: "signal",
      title: "The Signal Workshop",
      narrative:
        "Jars of blue and white paint sit beside a card: the signal glass needs 3 scoops of blue for every 2 scoops of white. Two other apprentices, Maya and Theo, each mixed a batch.",
      gate: { needs: "equivalent-ratios", label: "Explaining equivalent ratios" },
      reveal:
        "Inside the lid of the paint jar is a second brass tag with another piece of the code.",
      puzzle: {
        type: "explain",
        prompt:
          "Maya mixed 6 blue to 4 white. Theo mixed 5 blue to 4 white. Which statement explains which mix matches the 3 to 2 recipe, and why?",
        visual: {
          kind: "table",
          alt: "Table of three paint mixes. Recipe: 3 blue, 2 white. Maya: 6 blue, 4 white. Theo: 5 blue, 4 white.",
          head: ["Mix", "Blue", "White"],
          rows: [
            ["Recipe", "3", "2"],
            ["Maya", "6", "4"],
            ["Theo", "5", "4"],
          ],
        },
        choices: [
          "Both mixes match, because 6 and 5 are each a little more than 3, and 4 is more than 2.",
          "Only Maya's mix matches. Both amounts in 3 to 2 were multiplied by 2 to make 6 to 4, but 5 to 4 came from adding 2 to each amount, and adding does not keep the comparison the same.",
          "Only Theo's mix matches, because adding 2 to both amounts keeps the difference the same, and a ratio keeps the difference.",
          "Neither mix matches, because a ratio must be written with the smallest possible numbers, and 6 to 4 is not.",
        ],
        answer: 1,
        tokens: ["BELL", "TIDE", "SAIL", "KEEL"],
        hints: [
          "Picture one batch of the recipe: 3 scoops of blue and 2 scoops of white. Now picture making more than one batch.",
          "Making two batches means doubling both amounts. Does adding the same number to both amounts do the same job?",
          "Look for the statement that talks about changing both amounts the same way by multiplying, and says what adding does.",
        ],
        misconceptions: [
          {
            tag: "close-is-equal",
            pick: 0,
            hint: "Being close is not the same as being equal. A mix keeps its color only when the two amounts keep the same comparison.",
          },
          {
            tag: "additive-reasoning",
            pick: 2,
            hint: "Adding the same number to both amounts keeps the difference the same, but a ratio is about how many times as much, not how much more. What happens to the color if you make two batches?",
          },
          {
            tag: "simplest-form-required",
            pick: 3,
            hint: "A ratio does not have to use the smallest numbers to be equivalent. Two ratios can look different and still describe the same mix.",
          },
        ],
        model: {
          text: "A drink recipe uses 2 cups of juice for every 5 cups of water. Cara makes 4 juice to 10 water. Dan makes 4 juice to 7 water. Cara doubled both amounts, so her drink tastes the same. Dan added 2 to the juice and 2 to the water, which changes how strong the juice tastes. Only Cara's drink matches the recipe.",
        },
        why: "6 to 4 is the recipe doubled, so it keeps the same comparison. 5 to 4 came from adding, which changes the comparison.",
        transfer: {
          type: "explain",
          prompt:
            "A trail mix uses 2 cups of nuts for every 3 cups of raisins. Which statement explains why 6 nuts to 9 raisins matches, but 5 nuts to 6 raisins does not?",
          choices: [
            "6 to 9 is the recipe multiplied by 3 on both amounts, but 5 to 6 added 3 to each amount, so the comparison changes.",
            "5 to 6 is closer to the recipe, so it matches better than 6 to 9.",
            "Both match, because each pair has 3 more raisins than nuts.",
          ],
          answer: 0,
          tokens: ["A", "B", "C"],
          hints: [
            "Picture one bag of the recipe. What happens if you make more than one bag?",
            "Multiplying both amounts by the same number makes more bags. What does adding do?",
            "Look for the statement that compares multiplying both amounts with adding to both amounts.",
          ],
          why: "Tripling both amounts keeps the same comparison. Adding the same number to both amounts changes it.",
        },
        supports: {
          ee: {
            directions:
              "Read each statement. Look for the one that tells how both amounts changed.",
            frames: ["Both amounts were ___ by the same number.", "Adding is not the same as ___."],
            wordBank: ["multiply", "add", "equivalent", "ratio"],
            oral: "Say it first: a ratio compares two amounts.",
          },
          dev: {
            frames: ["Both amounts were ___ by ___."],
            wordBank: ["multiply", "add", "equivalent"],
          },
          exp: { frames: ["The mix matches because ___."] },
          br: {},
        },
      },
    },
    {
      id: "rope",
      title: "The Rope Loft",
      narrative:
        "Four coils of rope hang from hooks. Each tag shows a length and a price. The keeper wants to start with the rope that costs the least for each meter.",
      gate: { needs: "compare-unit-prices", label: "Comparing unit prices" },
      reveal:
        "A fourth hook holds an envelope. Inside is a brass tag with another piece of the code.",
      puzzle: {
        type: "order",
        prompt:
          "Put the coils in order from the lowest price for one meter to the highest price for one meter.",
        endLabels: { start: "lowest price for 1 meter", end: "highest price for 1 meter" },
        items: [
          { id: "a", text: "4 meters for 9 dollars", token: "K", value: "9/4" },
          { id: "b", text: "6 meters for 15 dollars", token: "E", value: "15/6" },
          { id: "c", text: "5 meters for 14 dollars", token: "L", value: "14/5" },
          { id: "d", text: "10 meters for 30 dollars", token: "P", value: "30/10" },
        ],
        answer: ["a", "b", "c", "d"],
        hints: [
          "The tags show different lengths, so the prices cannot be compared directly yet. What could you find for every coil?",
          "Find the price for 1 meter of each coil by dividing the price by the number of meters.",
          "Write each price for 1 meter as a decimal, compare the four decimals, and start with the smallest.",
        ],
        misconceptions: [
          {
            tag: "highest-first",
            pick: "d,c,b,a",
            hint: "You ordered from the highest price per meter to the lowest. Check the direction in the question.",
          },
          {
            tag: "ordered-by-total-price",
            has: ["c>b"],
            hint: "That order follows the total price on each tag. The keeper wants the price for 1 meter, so the number of meters matters.",
          },
          {
            tag: "ordered-by-length",
            has: ["b>a"],
            hint: "Your order puts a longer coil before a shorter one. A longer coil can still cost more for each meter. Find the price for 1 meter.",
          },
        ],
        model: {
          text: "Three ribbons: 2 meters for 5 dollars, 4 meters for 6 dollars, 5 meters for 9 dollars. Price for 1 meter: 5 divided by 2 is 2.50 dollars, 6 divided by 4 is 1.50 dollars, 9 divided by 5 is 1.80 dollars. From lowest to highest: the 4 meter ribbon, the 5 meter ribbon, then the 2 meter ribbon.",
        },
        why: "The prices for 1 meter are 2.25, 2.50, 2.80 and 3.00 dollars. Dividing each price by its length makes the coils comparable.",
        transfer: {
          type: "order",
          prompt:
            "Put these bags of nails in order from the lowest price for one pound to the highest price for one pound.",
          endLabels: { start: "lowest price for 1 pound", end: "highest price for 1 pound" },
          items: [
            { id: "x", text: "2 pounds for 3 dollars", token: "A", value: "3/2" },
            { id: "y", text: "5 pounds for 10 dollars", token: "B", value: "10/5" },
            { id: "z", text: "4 pounds for 7 dollars", token: "C", value: "7/4" },
            { id: "w", text: "6 pounds for 13 dollars", token: "D", value: "13/6" },
          ],
          answer: ["x", "z", "y", "w"],
          hints: [
            "The bags hold different weights. What can you find for each bag so they can be compared?",
            "Divide each price by the number of pounds to get the price for 1 pound.",
            "Compare the four prices for 1 pound as decimals and start with the smallest.",
          ],
          why: "The prices for 1 pound are 1.50, 1.75, 2.00 and about 2.17 dollars.",
        },
        supports: {
          ee: {
            directions: "Find the price for 1 meter of each coil. Then put the smallest first.",
            frames: [
              "I divide the ___ by the ___ to find the price for 1.",
              "___ is less than ___.",
            ],
            wordBank: ["price for 1 meter", "divide", "compare", "least"],
            oral: "Say it: which coil costs the least for one meter?",
          },
          dev: {
            frames: ["The price for 1 meter is ___."],
            wordBank: ["divide", "compare", "least"],
          },
          exp: { frames: ["I compared the prices for 1 meter by ___."] },
          br: {},
        },
      },
    },
    {
      id: "oil",
      title: "The Oil Cellar",
      narrative:
        "Four lamps stand in the cellar. A gauge beside each one shows how much oil it burned over several hours. The cellar keeper writes every lamp's oil use for 1 hour on a card.",
      gate: { needs: "unit-rate-meaning", label: "Matching a rate to a unit rate" },
      reveal:
        "Under the last lamp a brass tag is wedged between two stones. It holds the final piece of the code.",
      puzzle: {
        type: "match",
        prompt:
          "Match each lamp's gauge to the amount of oil that lamp burns in 1 hour. Two choices do not match any lamp.",
        lefts: [
          { id: "l1", text: "18 liters in 6 hours", calc: "18/6" },
          { id: "l2", text: "10 liters in 4 hours", calc: "10/4" },
          { id: "l3", text: "9 liters in 12 hours", calc: "9/12" },
          { id: "l4", text: "15 liters in 2 hours", calc: "15/2" },
        ],
        rights: [
          { id: "r5", text: "12 liters each hour", token: "F" },
          { id: "r3", text: "3/4 liter each hour", token: "M", value: "3/4" },
          { id: "r1", text: "3 liters each hour", token: "L", value: "3" },
          { id: "r6", text: "3/4 hour for each liter", token: "G" },
          { id: "r4", text: "7 1/2 liters each hour", token: "P", value: "15/2" },
          { id: "r2", text: "2 1/2 liters each hour", token: "A", value: "5/2" },
        ],
        answer: { l1: "r1", l2: "r2", l3: "r3", l4: "r4" },
        hints: [
          "A rate for each hour tells how much happens in 1 hour. Look at the units in each choice as well as the numbers.",
          "For each gauge, divide the liters by the number of hours.",
          "Do each division on its own, then find the choice that names that amount with the unit 'each hour'.",
        ],
        misconceptions: [
          {
            tag: "subtracted-instead-of-divided",
            has: ["l1=r5"],
            hint: "That choice is the liters minus the hours. A rate for each hour comes from dividing the liters by the hours.",
          },
          {
            tag: "swapped-rate-units",
            has: ["l3=r6"],
            hint: "Check the unit in your choice. Hours for each liter and liters each hour are different rates. Which amount is being compared with 1 hour?",
          },
        ],
        model: {
          text: "A pump moves 20 gallons in 5 hours. Gallons each hour: 20 divided by 5 is 4. A second pump moves 5 gallons in 4 hours. Gallons each hour: 5 divided by 4 is 5/4, which is 1 and 1/4. Each answer names the amount and the unit, gallons each hour.",
        },
        why: "Dividing each gauge's liters by its hours gives 3, 2 1/2, 3/4 and 7 1/2 liters each hour.",
        transfer: {
          type: "match",
          prompt:
            "Match each cyclist's trip to the distance that cyclist rides in 1 hour. One choice does not match any cyclist.",
          lefts: [
            { id: "t1", text: "12 kilometers in 3 hours", calc: "12/3" },
            { id: "t2", text: "9 kilometers in 2 hours", calc: "9/2" },
            { id: "t3", text: "5 kilometers in 4 hours", calc: "5/4" },
          ],
          rights: [
            { id: "u3", text: "1 1/4 kilometers each hour", token: "Z", value: "5/4" },
            { id: "u4", text: "9 kilometers each hour", token: "Y" },
            { id: "u1", text: "4 kilometers each hour", token: "X", value: "4" },
            { id: "u2", text: "4 1/2 kilometers each hour", token: "W", value: "9/2" },
          ],
          answer: { t1: "u1", t2: "u2", t3: "u3" },
          hints: [
            "Each hour means for 1 hour. What do you do with the distance and the number of hours?",
            "Divide each distance by its number of hours.",
            "Do each division on its own and match the amount with the unit 'kilometers each hour'.",
          ],
          why: "Dividing each distance by its hours gives 4, 4 1/2 and 1 1/4 kilometers each hour.",
        },
        supports: {
          ee: {
            directions: "Each gauge shows liters and hours. Find the liters for 1 hour.",
            frames: ["___ liters in ___ hours is ___ liters each hour."],
            wordBank: ["liters", "hours", "each hour", "divide"],
            oral: "Say it: how many liters in one hour?",
          },
          dev: {
            frames: ["___ liters in ___ hours is ___ each hour."],
            wordBank: ["each hour", "divide"],
          },
          exp: { frames: ["The unit rate is ___ liters each hour because ___."] },
          br: {},
        },
      },
    },
  ],
  door: {
    title: "The Lamp Room Door",
    prompt:
      "A brass plate shows a keypad and the keeper's note. Type the code made from your four pieces.",
    order: ["oil", "supply", "rope", "signal"],
    success: "The lock turns with a deep click, and warm light spills into the hallway.",
  },
  reflection: {
    prompt: "Which room made you think the hardest? What idea helped you open it?",
    frames: {
      ee: ["The hardest room was ___.", "The idea that helped was ___."],
      dev: ["The hardest room was ___ because ___.", "I used the idea of ___."],
      exp: ["The room that made me think hardest was ___ because ___. What helped was ___."],
      br: [
        "The hardest room was ___ because ___, and I solved it by ___. A rate or ratio like this appears when ___.",
      ],
    },
  },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
};
