// One minimal valid example (model + task) per concept-builder kind. They back the schema document, the unit tests and the
// browser harness. Every example passes validateConceptActivity.
const tiers = (frames) => ({ ee: { frames: [frames[0]] }, dev: { frames: [frames[1] || frames[0]] }, exp: { frames: [frames[2] || frames[1] || frames[0]] }, br: {} });
const fr = (a, b, c, d) => ({ ee: [a], dev: [b], exp: [c], br: d ? [d] : [] });

const task = (over) => ({
  id: "t1",
  hints: ["Look at what you start with.", "Compare your picture with the goal."],
  model: "Look at the finished picture and compare it with yours.",
  supports: tiers(["It changed from ___ to ___.", "It changed from ___ to ___ because ___."]),
  explain: { prompt: "What changed, and why?", frames: fr("It changed from ___ to ___.", "It changed from ___ to ___ because ___.", "When I ___, the ___ changed, so ___.", "") },
  ...over,
});

const wrap = (kind, model, t, grade = "6", band = "6-8") => ({
  id: `example-${kind}`,
  engine: "concept-builder",
  kind,
  title: `Example ${kind}`,
  grade,
  band,
  subject: "math",
  standards: ["6.RP.A.3"],
  minutes: 5,
  intro: `A minimal ${kind} activity.`,
  model,
  tasks: [t],
  reflection: { prompt: "What helped you most?", frames: fr("It helped to ___.", "It helped to ___ because ___.", "What helped most was ___ because ___.", "") },
  review: { status: "authored", checks: {} },
  version: "1.0.0",
  updated: "2026-11-23",
  source: "Original - The Language Page",
});

const visual = { kind: "shapes", alt: "A circle and a square drawn side by side", w: 480, h: 320, items: [{ t: "circle", cx: 120, cy: 160, r: 60 }, { t: "rect", x: 280, y: 100, w: 120, h: 120 }] };

export const EXAMPLES = {
  "ratio-table": wrap(
    "ratio-table",
    { context: "Punch is made from concentrate and water.", columns: ["Concentrate (cups)", "Water (cups)"], start: [["2", "3"]] },
    task({
      prompt: "Make a row for 10 cups of concentrate.",
      check: { type: "equals", of: "byFirst[10]", value: "15" },
      target: { rows: [{ a: "2", b: "3" }, { a: "10", b: "15", via: { from: 0, k: "5" } }], sel: 1 },
      misconceptions: [{ match: "additive", when: { type: "equals", of: "proportional", value: "false" }, hint: "Check whether each new row keeps the same comparison as the first row." }],
    }),
  ),
  "number-line": wrap(
    "number-line",
    { min: "0", max: "2", step: "1/4", labelEvery: "1/2", points: [{ id: "A", label: "A" }] },
    task({ prompt: "Move point A to three fourths.", check: { type: "within", of: "points[A]", value: "3/4", tolerance: "0" }, target: { points: { A: "3/4" }, jumps: {} } }),
    "4",
    "3-5",
  ),
  "graph-line": wrap(
    "graph-line",
    { xmax: 6, ymax: 12, xLabel: "Hours worked", yLabel: "Dollars earned", points: [{ id: "P", label: "P", at: [0, 0] }, { id: "Q", label: "Q", at: [1, 1] }] },
    task({ prompt: "Build the line for 3 dollars each hour.", check: { type: "equals", of: "slope", value: "3" }, target: { pts: { P: ["0", "0"], Q: ["1", "3"] } } }),
  ),
  "fraction-bar": wrap(
    "fraction-bar",
    { bars: [{ id: "A", label: "Bar A", lockParts: 4, shade: 2 }, { id: "B", label: "Bar B", nMin: 1, nMax: 12 }] },
    task({ prompt: "Shade Bar B so it shows the same amount as Bar A.", check: { type: "equals", of: "equivalent", value: "true" }, target: { bars: { A: { n: 4, k: 2 }, B: { n: 8, k: 4 } } } }),
    "4",
    "3-5",
  ),
  "area-model": wrap(
    "area-model",
    { mode: "partial", w: "23", h: "14" },
    task({ prompt: "Break 23 x 14 into tens and ones.", check: { type: "set", of: "areas", expected: ["200", "80", "30", "12"], mode: "equal" }, target: { cutX: "20", cutY: "10" } }),
    "5",
    "3-5",
  ),
  "label-diagram": wrap(
    "label-diagram",
    {
      visual,
      labels: [{ id: "circle", text: "circle" }, { id: "square", text: "square" }, { id: "triangle", text: "triangle", distractor: true }],
      hotspots: [{ id: "h1", x: 120, y: 160, answer: "circle", name: "left shape" }, { id: "h2", x: 340, y: 160, answer: "square", name: "right shape" }],
    },
    task({ prompt: "Label the two shapes.", check: { type: "all", checks: [{ type: "equals", of: "wrong", value: "0" }, { type: "equals", of: "unplaced", value: "0" }] }, target: { placed: { h1: "circle", h2: "square" } } }),
    "2",
    "k-2",
  ),
  "map-hotspots": wrap(
    "map-hotspots",
    {
      visual: { kind: "map", alt: "A schematic map with a north region and a south region", w: 480, h: 320, regions: [{ id: "north", label: "North", rect: [0, 0, 480, 160] }, { id: "south", label: "South", rect: [0, 160, 480, 160] }] },
      regions: [{ id: "north", label: "North", rect: [20, 20, 200, 120] }, { id: "south", label: "South", rect: [20, 180, 200, 120] }],
    },
    task({ prompt: "Choose the region that is farther from the sea.", check: { type: "set", of: "selected", expected: ["north"], mode: "equal" }, target: { selected: ["north"] } }),
    "5",
    "3-5",
  ),
  "process-model": wrap(
    "process-model",
    {
      variables: [{ id: "light", label: "Light", type: "slider", min: "0", max: "2", step: "1", start: "1", valueLabels: ["none", "some", "a lot"] }],
      outputs: [
        {
          id: "height",
          label: "Height",
          unit: "cm",
          min: "0",
          max: "10",
          rules: [
            { when: [{ var: "light", op: "eq", value: "0" }], value: "1", say: "With no light the plant cannot make food, so it stays tiny.", ruleId: "dark" },
            { when: [{ var: "light", op: "eq", value: "1" }], value: "5", say: "With some light the plant makes some food and grows slowly.", ruleId: "dim" },
            { when: [], value: "9", say: "With a lot of light the plant makes plenty of food and grows tall.", ruleId: "bright" },
          ],
        },
      ],
    },
    task({ prompt: "Set the light so the plant grows to at least 9 cm.", check: { type: "relation", left: "out.height", op: "ge", right: { value: "9" } }, target: { vars: { light: "2" }, log: [] } }),
    "3",
    "3-5",
  ),
  "timeline-sort": wrap(
    "timeline-sort",
    {
      span: [1870, 1970],
      axisStep: 5,
      events: [
        { id: "phone", label: "Telephone patented", at: 1876 },
        { id: "flight", label: "First powered airplane flight", at: 1903 },
        { id: "moon", label: "First moon landing", at: 1969 },
      ],
    },
    task({ prompt: "Put the three events in order on the line.", check: { type: "order", of: "order", expected: ["phone", "flight", "moon"] }, target: { at: { phone: 1875, flight: 1905, moon: 1970 } } }),
    "7",
  ),
  "scale-sort": wrap(
    "scale-sort",
    { axis: { label: "How strong the feeling is", low: "mild", high: "extreme" }, items: [{ id: "furious", text: "furious" }, { id: "annoyed", text: "annoyed" }, { id: "upset", text: "upset" }] },
    task({ prompt: "Order the words from the mildest feeling to the strongest.", check: { type: "order", of: "order", expected: ["annoyed", "upset", "furious"] }, target: { order: ["annoyed", "upset", "furious"] } }),
    "5",
    "3-5",
  ),
};
