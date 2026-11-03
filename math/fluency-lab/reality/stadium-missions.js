// Soccer Stadium missions, one per grade band. A mission is data plus small pure functions over the stadium state.
// Every learner-facing string is an English key with {placeholders}; the view passes it through t().
// Choices never carry the answer in their wording; the correct position is fixed per mission and varies across them.
import { COST, capacityOf, costLine, derive, eq, frac, seatsWithinBudget } from "./stadium-math.js";

export const BANDS = ["k2", "g35", "g6", "g7", "g8"];
export const bandOf = (grade) =>
  grade <= 2 ? "k2" : grade <= 5 ? "g35" : grade === 6 ? "g6" : grade === 7 ? "g7" : "g8";

const money = (n) => `$${n.toLocaleString("en-US")}`;
const pick = (table, seed) => table[Math.abs(seed) % table.length];

export const MISSIONS = {
  k2: {
    id: "seat-builder",
    band: "k2",
    skill: "equal-groups",
    title: "Seat Builder",
    goal: "Build the stands out of equal groups of seats.",
    visual: "groups",
    controls: ["sections", "seatsPerSection"],
    labels: { sections: "Groups", seatsPerSection: "Seats in each group" },
    start: { length: 30, width: 20, sections: 2, seatsPerSection: 5, sold: 0 },
    create: {
      text: "Build stands with exactly 20 seats. Use at least 2 groups, with at least 2 seats in each group.",
      done: (s) => capacityOf(s) === 20 && s.sections >= 2 && s.seatsPerSection >= 2,
    },
    predict: (s) => ({
      prompt:
        "You have {s} groups of {p} seats, which is {total} seats. If you add 1 more group, how many seats will there be?",
      vars: { s: s.sections, p: s.seatsPerSection, total: capacityOf(s) },
      choices: [
        {
          id: "a",
          text: "{n} seats",
          vars: { n: capacityOf(s) + 1 },
          correct: false,
          tag: "add-one-seat",
        },
        {
          id: "b",
          text: "{n} seats",
          vars: { n: capacityOf(s) + s.seatsPerSection },
          correct: true,
        },
        {
          id: "c",
          text: "{n} seats",
          vars: { n: capacityOf(s) * 2 },
          correct: false,
          tag: "doubles-total",
        },
      ],
    }),
    experiment: {
      text: "Add 1 more group of seats.",
      done: (base, s) =>
        s.sections === base.sections + 1 && s.seatsPerSection === base.seatsPerSection,
    },
    observe: (base, s) => [
      { key: "Seats went from {a} to {b}.", vars: { a: capacityOf(base), b: capacityOf(s) } },
      {
        key: "{s} × {p} = {total}. Each group has {p} seats, so one more group adds {p}.",
        vars: { s: s.sections, p: s.seatsPerSection, total: capacityOf(s) },
      },
    ],
    explain: {
      prompt: "Why did the number of seats change that way?",
      choices: [
        {
          id: "a",
          text: "Adding a group always adds 1 seat.",
          correct: false,
          tag: "add-one-seat",
        },
        {
          id: "b",
          text: "Every group has the same number of seats, so one more group adds that many seats.",
          correct: true,
        },
        {
          id: "c",
          text: "The seats always double when you add a group.",
          correct: false,
          tag: "doubles-total",
        },
      ],
    },
    apply: (seed, before) => {
      const target = pick([12, 18, 24, 30], seed);
      return {
        kind: "build",
        prompt:
          "Build stands with exactly {target} seats. Use a different number of groups than before ({s}).",
        vars: { target, s: before.sections },
        setup: { sections: 1, seatsPerSection: 1 },
        done: (s) =>
          capacityOf(s) === target &&
          s.sections !== before.sections &&
          s.sections >= 2 &&
          s.seatsPerSection >= 2,
        hints: [
          {
            text: "Equal groups: the number of groups times the seats in each group is the total.",
          },
          {
            text: "Try picking a number of groups, then change the seats in each group until the total is {target}.",
            vars: { target },
          },
        ],
      };
    },
    reflect: { prompt: "How can you make the same number of seats with different groups?" },
    repair: {
      "add-one-seat":
        "Each group is a whole row of seats, so a new group adds a whole row, not one seat.",
      "doubles-total": "Only one group was added, not as many groups as you already had.",
    },
  },

  g35: {
    id: "field-fence",
    band: "g35",
    skill: "area-perimeter",
    title: "Field Planner",
    goal: "Find out how area and perimeter change when the field changes.",
    visual: "grid",
    controls: ["length", "width"],
    start: { length: 20, width: 20, sections: 4, seatsPerSection: 5, sold: 0 },
    create: {
      text: "Build a field with an area of exactly 600 m². Keep the length at 100 m or less.",
      done: (s) => s.length * s.width === 600 && s.length <= 100,
    },
    predict: (s) => ({
      prompt:
        "Your field is {l} m long and {w} m wide. You make it twice as long and keep the width. The area will be…",
      vars: { l: s.length, w: s.width },
      choices: [
        { id: "a", text: "4 times as big", correct: false, tag: "doubles-both-confusion" },
        { id: "b", text: "The same", correct: false, tag: "area-unchanged" },
        { id: "c", text: "2 times as big", correct: true },
      ],
    }),
    experiment: {
      text: "Make the field twice as long. Keep the width the same.",
      done: (base, s) => s.length === base.length * 2 && s.width === base.width,
    },
    observe: (base, s) => {
      const a = derive(base);
      const b = derive(s);
      return [
        {
          key: "Area went from {a} m² to {b} m², which is 2 times as big.",
          vars: { a: a.area, b: b.area },
        },
        {
          key: "Perimeter went from {a} m to {b} m. Did it also double? Check.",
          vars: { a: a.perimeter, b: b.perimeter },
        },
      ];
    },
    explain: {
      prompt: "Why did the area change that way?",
      choices: [
        {
          id: "a",
          text: "Area and perimeter always change by the same amount.",
          correct: false,
          tag: "area-equals-perimeter-change",
        },
        {
          id: "b",
          text: "Only the perimeter changes when one side changes.",
          correct: false,
          tag: "area-unchanged",
        },
        {
          id: "c",
          text: "Twice as long means twice as many rows of squares fit inside, so the area doubles.",
          correct: true,
        },
      ],
    },
    apply: (seed) => {
      const [l, w, k] = pick(
        [
          [12, 5, 3],
          [8, 9, 2],
          [15, 4, 4],
          [7, 10, 3],
        ],
        seed,
      );
      return {
        kind: "number",
        prompt:
          "A field is {l} m by {w} m. Make it {k} times as long and keep the width. What is the new area in m²?",
        vars: { l, w, k },
        setup: { length: l, width: w },
        answer: k * l * w,
        hints: [
          { text: "Find the area of the original field first: length × width." },
          {
            text: "Making the field {k} times as long gives {k} times as many rows of squares.",
            vars: { k },
          },
          { text: "Multiply the original area by {k}.", vars: { k } },
        ],
      };
    },
    reflect: { prompt: "What stayed the same and what changed when you doubled only the length?" },
    repair: {
      "doubles-both-confusion":
        "Only the length was doubled. Doubling both sides is a different change.",
      "area-unchanged": "More squares fit inside the longer field, so the area did change.",
      "area-equals-perimeter-change":
        "Look at the numbers: the area doubled but the perimeter did not.",
    },
  },

  g6: {
    id: "fill-the-stands",
    band: "g6",
    skill: "ratios-percent",
    title: "Fill the Stands",
    goal: "Keep the same fraction of seats sold when the stadium grows.",
    visual: "ratio",
    controls: ["sections", "sold"],
    start: { length: 40, width: 20, sections: 4, seatsPerSection: 10, sold: 15 },
    create: {
      text: "Sell tickets so that exactly 3 out of every 4 seats are sold.",
      done: (s) => eq(derive(s).occupancy, frac(3, 4)),
    },
    predict: (s) => ({
      prompt:
        "The stadium holds {cap} seats and {sold} are sold, which is 3 out of every 4. You build {cap} more seats. To keep 3 out of every 4 sold, how many seats must be sold?",
      vars: { cap: capacityOf(s), sold: s.sold },
      choices: [
        {
          id: "a",
          text: "{n} seats",
          vars: { n: s.sold + capacityOf(s) },
          correct: false,
          tag: "additive-reasoning",
        },
        {
          id: "b",
          text: "{n} seats",
          vars: { n: s.sold },
          correct: false,
          tag: "ratio-count-unchanged",
        },
        { id: "c", text: "{n} seats", vars: { n: s.sold * 2 }, correct: true },
      ],
    }),
    experiment: {
      text: "Add sections until the stands hold twice as many seats. Then change the tickets sold until 3 out of 4 seats are sold again.",
      done: (base, s) =>
        capacityOf(s) === capacityOf(base) * 2 && eq(derive(s).occupancy, frac(3, 4)),
    },
    observe: (base, s) => {
      const a = derive(base);
      const b = derive(s);
      return [
        {
          key: "Seats went from {a} to {b}. Tickets sold went from {c} to {d}.",
          vars: { a: a.capacity, b: b.capacity, c: base.sold, d: s.sold },
        },
        {
          key: "Both doubled, so the part sold is still 3 out of 4, which is {pct}.",
          vars: { pct: b.occupancyText },
        },
      ];
    },
    explain: {
      prompt: "Why do the tickets sold have to change that way?",
      choices: [
        {
          id: "a",
          text: "Doubling the seats and the tickets sold keeps the ratio 3 : 4 the same.",
          correct: true,
        },
        {
          id: "b",
          text: "Adding the same number of tickets as seats keeps the fraction the same.",
          correct: false,
          tag: "additive-reasoning",
        },
        {
          id: "c",
          text: "The fraction sold only depends on how many seats there are.",
          correct: false,
          tag: "ratio-count-unchanged",
        },
      ],
    },
    apply: (seed) => {
      const [cap, pct] = pick(
        [
          [80, 75],
          [60, 50],
          [40, 25],
          [120, 60],
        ],
        seed,
      );
      return {
        kind: "number",
        prompt: "A stadium has {cap} seats and {pct}% of them are sold. How many seats are sold?",
        vars: { cap, pct },
        setup: { sections: cap / 10, seatsPerSection: 10, sold: 0 },
        answer: (cap * pct) / 100,
        hints: [
          { text: "Percent means out of 100, so {pct}% is {pct} out of every 100.", vars: { pct } },
          { text: "Find 10% of the seats first, then use it to build {pct}%.", vars: { pct } },
          { text: "{pct}% of {cap} is {cap} × {pct} ÷ 100.", vars: { cap, pct } },
        ],
      };
    },
    reflect: { prompt: "Explain how a ratio and a percent describe the same stands." },
    repair: {
      "additive-reasoning":
        "The seats were multiplied by 2, so the tickets must be multiplied by 2 as well. Adding the same amount changes the ratio.",
      "ratio-count-unchanged":
        "More seats with the same tickets sold makes the stands emptier, so the fraction sold goes down.",
    },
  },

  g7: {
    id: "double-the-field",
    band: "g7",
    skill: "scale-area",
    title: "Double the Field",
    goal: "Find how scaling a field changes its area.",
    visual: "scale",
    controls: ["length", "width", "scale"],
    start: { length: 20, width: 20, sections: 4, seatsPerSection: 5, sold: 0 },
    create: {
      text: "Set the field to 40 m long and 30 m wide.",
      done: (s) => s.length === 40 && s.width === 30,
    },
    predict: (s) => ({
      prompt:
        "Your field is {l} m by {w} m. You double the length and double the width. The area will be…",
      vars: { l: s.length, w: s.width },
      choices: [
        { id: "a", text: "2 times as big", correct: false, tag: "linear-area" },
        { id: "b", text: "4 times as big", correct: true },
        { id: "c", text: "8 times as big", correct: false, tag: "area-volume-confusion" },
      ],
    }),
    experiment: {
      text: "Double both the length and the width.",
      done: (base, s) => s.length === base.length * 2 && s.width === base.width * 2,
    },
    observe: (base, s) => {
      const a = derive(base);
      const b = derive(s);
      return [
        {
          key: "Area went from {a} m² to {b} m², which is 4 times as big.",
          vars: { a: a.area, b: b.area },
        },
        {
          key: "Perimeter went from {a} m to {b} m, which is 2 times as big.",
          vars: { a: a.perimeter, b: b.perimeter },
        },
      ];
    },
    explain: {
      prompt: "Why is the area 4 times as big?",
      choices: [
        {
          id: "a",
          text: "Everything doubles when you double the sides.",
          correct: false,
          tag: "linear-area",
        },
        {
          id: "b",
          text: "The perimeter doubles, so the area doubles too.",
          correct: false,
          tag: "area-equals-perimeter-change",
        },
        {
          id: "c",
          text: "The length is multiplied by 2 and the width is multiplied by 2, so the area is multiplied by 2 × 2 = 4.",
          correct: true,
        },
      ],
    },
    apply: (seed) => {
      const [l, w, k] = pick(
        [
          [10, 6, 3],
          [8, 5, 2],
          [12, 4, 3],
          [9, 7, 2],
        ],
        seed,
      );
      return {
        kind: "number",
        prompt:
          "A field is {l} m by {w} m. Make both sides {k} times as long. What is the new area in m²?",
        vars: { l, w, k },
        setup: { length: l, width: w },
        answer: k * k * l * w,
        hints: [
          { text: "Find the new length and the new width first." },
          {
            text: "The new length is {nl} m and the new width is {nw} m. What is their product?",
            vars: { nl: l * k, nw: w * k },
          },
          {
            text: "The original area is {a} m². Compare it with the new area: it is {k} × {k} times as big.",
            vars: { a: l * w, k },
          },
        ],
      };
    },
    reflect: {
      prompt: "A friend says doubling the sides doubles the area. What would you show them?",
    },
    repair: {
      "linear-area":
        "Area covers two directions. Doubling the length and doubling the width multiplies the area twice.",
      "area-volume-confusion":
        "Three directions scale volume. A field has only two, length and width.",
      "area-equals-perimeter-change":
        "Look at the numbers: the perimeter doubled but the area did not.",
    },
  },

  g8: {
    id: "budget-line",
    band: "g8",
    skill: "linear-function",
    title: "The Budget Line",
    goal: "Use a linear cost function to decide how many seats the budget allows.",
    visual: "cost",
    controls: ["length", "width", "sections", "seatsPerSection"],
    start: { length: 30, width: 20, sections: 5, seatsPerSection: 20, sold: 0, budget: 30000 },
    create: {
      text: "Set the field to 40 m by 20 m. The budget is $30,000.",
      done: (s) => s.length === 40 && s.width === 20,
    },
    predict: (s) => ({
      prompt:
        "The field costs {fixed} (area × $20 per m²) and each seat costs $50. You add 10 more seats. The total cost goes up by…",
      vars: { fixed: money(costLine(s).fixed) },
      choices: [
        {
          id: "a",
          text: "{n}",
          vars: { n: money(COST.perSeat) },
          correct: false,
          tag: "unit-vs-total",
        },
        {
          id: "b",
          text: "{n}",
          vars: { n: money(costLine(s).fixed + 10 * COST.perSeat) },
          correct: false,
          tag: "fixed-cost-repeated",
        },
        { id: "c", text: "{n}", vars: { n: money(10 * COST.perSeat) }, correct: true },
      ],
    }),
    experiment: {
      text: "Build as many seats as the budget allows, without going over.",
      done: (_base, s) => capacityOf(s) === seatsWithinBudget(s),
    },
    observe: (_base, s) => {
      const line = costLine(s);
      const seats = capacityOf(s);
      return [
        {
          key: "cost = {fixed} + 50 × seats. With {n} seats the cost is {cost}.",
          vars: { fixed: money(line.fixed), n: seats, cost: money(line.at(seats)) },
        },
        {
          key: "One more seat would cost {next}, which is over the budget of {budget}.",
          vars: { next: money(line.at(seats + 1)), budget: money(s.budget) },
        },
      ];
    },
    explain: {
      prompt: "What do the numbers in cost = 16,000 + 50 × seats mean?",
      choices: [
        {
          id: "a",
          text: "50 is the cost of each extra seat (the slope) and 16,000 is where the line starts (the field).",
          correct: true,
        },
        {
          id: "b",
          text: "50 is where the line starts and 16,000 is the cost of each seat.",
          correct: false,
          tag: "slope-intercept-swap",
        },
        {
          id: "c",
          text: "The cost doubles whenever the seats double.",
          correct: false,
          tag: "proportional-assumed",
        },
      ],
    },
    apply: (seed) => {
      const [l, w, b] = pick(
        [
          [30, 20, 25000],
          [40, 25, 40000],
          [50, 20, 50000],
          [20, 20, 20000],
        ],
        seed,
      );
      return {
        kind: "number",
        prompt:
          "A field is {l} m by {w} m and the budget is {b}. The field costs $20 per m² and each seat costs $50. What is the most seats you can build?",
        vars: { l, w, b: money(b) },
        setup: { length: l, width: w, budget: b, sections: 1, seatsPerSection: 1 },
        answer: Math.floor((b - l * w * COST.fieldPerM2) / COST.perSeat),
        hints: [
          { text: "Start with the cost of the field, then see how much of the budget is left." },
          {
            text: "The money left after the field is {left}. Each seat costs $50.",
            vars: { left: money(b - l * w * COST.fieldPerM2) },
          },
          { text: "Divide the money left by 50 and keep the whole seats." },
        ],
      };
    },
    reflect: {
      prompt:
        "Describe the graph of cost against seats. What are its slope and its starting point?",
    },
    repair: {
      "unit-vs-total": "$50 is the price of one seat. Ten seats cost ten times as much.",
      "fixed-cost-repeated": "The field is bought once. Adding seats adds only the seat cost.",
      "slope-intercept-swap":
        "The slope is the change per seat. The starting point is the cost with zero seats.",
      "proportional-assumed":
        "The field cost is already there with zero seats, so doubling seats does not double the cost.",
    },
  },
};

// Every English key a learner can see from the missions, for the Spanish-coverage test.
export function missionKeys() {
  const keys = new Set();
  const state = {
    length: 40,
    width: 20,
    sections: 4,
    seatsPerSection: 5,
    sold: 12,
    budget: 30000,
    price: 10,
  };
  const add = (value) => value && keys.add(value);
  for (const mission of Object.values(MISSIONS)) {
    add(mission.title);
    add(mission.goal);
    add(mission.create.text);
    add(mission.experiment.text);
    const predict = mission.predict(state);
    add(predict.prompt);
    for (const choice of predict.choices) add(choice.text);
    for (const line of mission.observe(state, state)) add(line.key);
    add(mission.explain.prompt);
    for (const choice of mission.explain.choices) add(choice.text);
    for (let seed = 0; seed < 4; seed += 1) {
      const apply = mission.apply(seed, state);
      add(apply.prompt);
      for (const hint of apply.hints) add(hint.text);
    }
    add(mission.reflect.prompt);
    for (const text of Object.values(mission.repair)) add(text);
  }
  return [...keys];
}
