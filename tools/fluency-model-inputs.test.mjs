// Every interactive model in the Fluency Lab opens with THE PROBLEM'S OWN numbers and shows no answer the
// learner has not earned. Reads the givens through math/fluency-lab/problem-numbers.js for a seeded sample of
// all 88 skills (plain and story versions) and checks:
//   1. the numbers read out are exactly the numbers written in the problem;
//   2. every number a Math Tool Drawer seed loads is one of those givens (so no seed can hold a result);
//   3. each drawer tool, drawn locked, never prints the answer; the multiplication algorithm board and the
//      sharing (division) picture hold no answer; the help shown before an answer is earned is capped;
//   4. the app wiring that routes the learner's help and the drawer through those modules is still in place.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const lab = "../math/fluency-lab/";
const { ALL_SKILLS, generateProblem, seededRandom } = await import(`${lab}problem-bank.js`);
const { bareText, drawerSeed, extractProblem, givenNumbers, seedNumbers } = await import(
  `${lab}problem-numbers.js`
);
const { storyFor } = await import(`${lab}story-problems.js`);
const { stepLeaks, peekCap } = await import(`${lab}step-leak.js`);
const { createDrillToolbox } = await import(`${lab}drill-toolbox.js`);
const { renderTool } = await import(`${lab}drill-tools.js`);
const { StandardLongDivisionModel } = await import(`${lab}long-division-model.js`);
const { liveHelpHtml } = await import(`${lab}live-help.js`);
const { multiplyHtml, partialProducts, canMultiply } = await import(`${lab}vertical-multiply.js`);
const { interactivePicture } = await import(`${lab}trail-pictures.js`);

const sample = (skill, count, seed) => {
  const rng = seededRandom(seed);
  return Array.from({ length: count }, () => generateProblem(skill, rng));
};
const items = ALL_SKILLS.flatMap((skill, i) =>
  sample(skill, 18, 1000 + i * 7).map((item) => ({ skill, item })),
);
assert.equal(ALL_SKILLS.length, 88, "88 skills");

// 0. Known shapes: the numbers come out as written, story wording reads through `expr`.
const known = [
  ["44,048 + 30,332 = ?", { kind: "binary", op: "+", a: 44048, b: 30332 }],
  ["73,172 − 42,335 = ?", { kind: "binary", op: "-", a: 73172, b: 42335 }],
  ["76 × 82 = ?", { kind: "binary", op: "*", a: 76, b: 82 }],
  ["380 ÷ 4 = ?", { kind: "binary", op: "÷", a: 380, b: 4 }],
  ["-9 − (-6) = ?", { kind: "binary", op: "-", a: -9, b: -6 }],
  ["93.19 + 17.7 = ?", { kind: "binary", op: "+", a: 93.19, b: 17.7 }],
  ["6x − 11 = 91. Find x.", { kind: "equation", coeff: 6, constant: -11, rhs: 91 }],
  ["x ÷ 4 = 6. Find x.", { kind: "equation", divisor: 4, rhs: 6 }],
  ["9:1 = 54:□", { kind: "ratio", a: 9, b: 1, c: 54, d: null }],
  ["66 for 3 items. How much for 1 item?", { kind: "rate", total: 66, count: 3 }],
  ["What is 10% of 80?", { kind: "percent", pct: 10, base: 80 }],
  ["Find the LCM of 6 and 9.", { kind: "gcflcm", fn: "lcm", a: 6, b: 9 }],
  ["12 + 5 × 3 = ?", { kind: "expression" }],
  ["Volume of a rectangular prism: 11 × 12 × 5?", { kind: "product", factors: [11, 12, 5] }],
  ["If y = 3x − 5, find y when x = 6.", { kind: "substitution", coeff: 3, constant: -5, x: 6 }],
];
for (const [text, want] of known) {
  const got = extractProblem(text);
  for (const [key, value] of Object.entries(want))
    assert.deepEqual(got?.[key], value, `${text} → ${key}`);
}
const frac = extractProblem("-4/5 − (-3/6) = ?");
assert.deepEqual(
  [frac.kind, frac.op, frac.parts.map((p) => [p.n, p.d])],
  [
    "fractions",
    "-",
    [
      [-4, 5],
      [-3, 6],
    ],
  ],
);
assert.equal(
  extractProblem({
    question: "Mia has 45 stickers and gets 12 more. How many now?",
    expr: "45 + 12 = ?",
  }).b,
  12,
);
assert.equal(bareText({ question: "words 1", expr: "3 × 4 = ?" }), "3 * 4 = ?");

// 1. Across the sample: what is read out is what is written, and the common arithmetic always reads.
const MUST_READ = new Set([
  "fact",
  "decimalOp",
  "fractionOp",
  "fractionOf",
  "gcfLcm",
  "solve",
  "percent",
  "percentChange",
  "integerOp",
  "proportion",
  "exponent",
  "powerTen",
  "unitRate",
  "rateConversion",
  "expression",
  "round",
  "fractionEquivalent",
  "fractionCompare",
  "ratio",
  "functionRule",
]);
const numbersIn = (p) => {
  const out = [];
  const walk = (value) => {
    if (typeof value === "number") out.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object")
      Object.entries(value).forEach(
        ([k, v]) =>
          !["text", "decimals", "aText", "bText"].includes(k) &&
          !(["whole", "constant", "coeff"].includes(k) && Math.abs(v) <= 1) &&
          walk(v),
      );
  };
  walk(p);
  return out;
};
let readCount = 0;
const misses = new Map();
for (const { skill, item } of items) {
  const p = extractProblem(item);
  if (!p) {
    if (MUST_READ.has(skill.generator)) misses.set(skill.id, (misses.get(skill.id) || 0) + 1);
    continue;
  }
  readCount += 1;
  const written = new Set(givenNumbers(item).flatMap((n) => [n, Math.abs(n)]));
  for (const n of numbersIn(p))
    assert.ok(
      written.has(n) || written.has(Math.abs(n)),
      `${skill.id} "${item.question}": read ${n}, which is not in the problem`,
    );
}
assert.deepEqual(
  [...misses],
  [],
  `Common arithmetic skills whose numbers could not be read: ${[...misses].join(", ")}`,
);
assert.ok(
  readCount > items.length * 0.6,
  `numbers read for ${readCount} of ${items.length} problems`,
);

// 1b. Story versions read to the same numbers as the plain problem.
let stories = 0;
for (const { item } of items) {
  const story = storyFor(item, seededRandom(stories + 3));
  if (!story) continue;
  stories += 1;
  assert.deepEqual(extractProblem(story), extractProblem(item), `story of ${item.question}`);
  assert.equal(bareText(story), bareText(item));
}
assert.ok(stories > 40, `${stories} story versions checked`);

// 2. Drawer seeds hold only the problem's givens (the clamp edges and the percent whole of 100 aside).
const toolbox = () =>
  createDrillToolbox({
    getState: () => ({ item: null, itemDone: false }),
    longDivision: StandardLongDivisionModel,
  });
let seeded = 0;
for (const { skill, item } of items) {
  const seed = drawerSeed(item);
  if (!seed.tool) continue;
  seeded += 1;
  const written = new Set(givenNumbers(item).flatMap((n) => [n, Math.abs(n)]));
  const big = [...written].some((n) => n > 15);
  for (const n of seedNumbers(seed)) {
    const ok =
      written.has(n) ||
      written.has(Math.abs(n)) ||
      (n === 15 && big) ||
      (n === 8 && [...written].some((w) => w > 8)) ||
      (n === 100 && seed.problem.kind === "percent") ||
      n === 0 ||
      n === 1;
    assert.ok(
      ok,
      `${skill.id} "${item.question}": the ${seed.tool} seed loads ${n}, which is not a given`,
    );
  }
}
assert.ok(seeded > 600, `${seeded} problems opened a seeded drawer tool`);

// 3. Drawn locked, no drawer tool prints the answer; the seeded tool names the problem's own numbers.
const text = (html) =>
  html
    .replace(/<g class="nl-tick"[\s\S]*?<\/g>/g, " ")
    .replace(/<div class="fw-row[\s\S]*?<\/div><\/div>/g, " ")
    .replace(/<div class="mg-row[\s\S]*?<\/div>/g, " ")
    .replace(
      /<button[^>]*data-(?:ld-preset|split-preset|tape-preset|dnl-preset)[^>]*>[\s\S]*?<\/button>/g,
      " ",
    )
    .replace(/<button[^>]*>\s*[+−×÷]?\s*\d[\d.,]*(?:\s*(?:x|Left|\(.\)))?\s*<\/button>/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&");
const SEEDED_TOOL = {
  vertical: "vertical",
  tenFrame: "tenframe",
  grid: "multigrid",
  splitTarget: "splitter",
  division: "longdivision",
  pizza: "pizza",
  denominators: "fractions",
  balance: "balance",
  integers: "integers",
  rateLine: "doublenumberline",
  tape: "tape",
};
let drawn = 0;
for (const { skill, item } of items) {
  const box = toolbox();
  const seed = drawerSeed(item);
  box.applySeed(seed);
  for (const [key, tool] of Object.entries(SEEDED_TOOL)) {
    if (seed[key] == null) continue;
    const html = renderTool(tool, box.s, {
      locked: true,
      longDivisionHtml: (dividend, divisor, hide) =>
        StandardLongDivisionModel.renderHtml(dividend, divisor, {
          isSolver: false,
          hideAnswer: hide,
        }),
    });
    drawn += 1;
    assert.ok(html.length > 80, `${skill.id} "${item.question}": the ${tool} tool drew nothing`);
    // One-digit answers collide with counts the tool shows from the givens ("0 negative"), so only longer answers are text-checked.
    if (
      /\d/.test(String(item.answers[0])) &&
      String(item.displayAnswer ?? item.answers[0]).replace(/[-.,]/g, "").length >= 2
    )
      assert.ok(
        !stepLeaks(text(html), item),
        `${skill.id} "${item.question}": the locked ${tool} tool states the answer`,
      );
  }
}
assert.ok(drawn > 800, `${drawn} seeded tools drawn`);
const seededTool = (question) => {
  const box = toolbox();
  const seed = drawerSeed({ question });
  box.applySeed(seed);
  return { box, seed };
};
assert.deepEqual(
  seededTool("236 + 728 = ?").box.s.vertical,
  { op: "+", terms: ["236", "728"] },
  "addition opens as stacked columns",
);
assert.equal(
  (
    renderTool("vertical", seededTool("236 + 728 = ?").box.s, { locked: true }).match(
      /vc-result/g,
    ) || []
  ).length,
  4, // three columns plus the leading box (2 + 7 + a carry could reach ten)
  "the drawer draws the column board for the problem",
);
assert.deepEqual(
  seededTool("93.19 − 17.7 = ?").box.s.vertical,
  { op: "-", terms: ["93.19", "17.7"] },
  "decimal subtraction opens as stacked columns",
);
assert.notEqual(
  seededTool("44,048 + 30,332 = ?").seed.tool,
  "numberline",
  "no number-line jumps for addition",
);
assert.deepEqual(seededTool("7 × 6 = ?").box.s.mult, { row: 6, col: 7 });
assert.deepEqual(seededTool("84 ÷ 7 = ?").box.s.div, { dividend: 84, divisor: 7 });
assert.deepEqual(seededTool("6x − 11 = 91. Find x.").box.s.balance, {
  lx: 6,
  lc: -11,
  rv: 91,
  rvText: "",
});
assert.deepEqual(seededTool("3/8 + 2/8 = ?").box.s.pizza, { slices: 8, eaten: [0, 1, 2] });
assert.equal(seededTool("-9 − (-6) = ?").box.s.ints.neg, 9);
assert.equal(seededTool("66 for 3 items. How much for 1 item?").box.s.dnl.a, 66);
// "Try my own numbers" is unlocked: the learner's own numbers may show their own results.
const free = renderTool("multigrid", seededTool("7 × 6 = ?").box.s, { locked: false });
assert.match(free, /= 42/);
assert.doesNotMatch(renderTool("multigrid", seededTool("7 × 6 = ?").box.s, { locked: true }), /42/);

// 3b. Multiplication board: loaded with the two numbers, holds no digit of the product.
for (const [a, b] of [
  [76, 82],
  [762, 8],
  [648, 85],
  [9, 50],
  [1234, 56],
]) {
  assert.ok(canMultiply(a, b));
  const html = multiplyHtml(a, b);
  const flat = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  assert.equal(
    partialProducts(a, b).reduce((sum, row) => sum + row.value, 0),
    a * b,
  );
  assert.ok(flat.includes(String(a)) && flat.includes(`×${b}`), "both numbers are on the board");
  assert.ok(!flat.includes(String(a * b)), `${a} × ${b}: the board holds the product`);
  assert.ok(
    !partialProducts(a, b).some((row) => row.value > 9 && flat.includes(String(row.value))),
    `${a} × ${b}: a partial product is on the board`,
  );
}

// 3b2. Stacked columns (add and subtract): the boards hold only the givens, the checks are right / try again,
// and a board raises vc-complete with the typed result only when the learner typed every digit.
const { JSDOM } = await import("jsdom");
const { columnSpec, expectations, verticalHtml, clean } = await import(`${lab}vertical-columns.js`);
let boards = 0;
for (const { skill, item } of items) {
  const p = extractProblem(item);
  if (p?.kind !== "binary" || !["+", "-"].includes(p.op)) continue;
  const spec = columnSpec(p.op, [p.aText, p.bText]);
  if (!spec) continue;
  boards += 1;
  const e = expectations(spec);
  const digits = e.result.filter((_, c) => !e.blankLead[c]).join("");
  const exact = (() => {
    const [x, y] = spec.terms.map((v) => v.split("."));
    const dec = Math.max(...[x, y].map((q) => (q[1] || "").length));
    const big = (q) => BigInt(q[0] + (q[1] || "").padEnd(dec, "0"));
    return String(spec.op === "+" ? big(x) + big(y) : big(x) - big(y));
  })();
  assert.equal(
    String((e.lead ? e.lead : "") + digits).replace(/^0+(?=\d)/, ""),
    exact.replace(/^0+(?=\d)/, ""),
    `${skill.id} "${item.question}": column arithmetic`,
  );
  const html = verticalHtml(spec);
  assert.ok(
    !/value=|placeholder=/.test(html.replace(/aria-label="[^"]*"/g, "")),
    "boards ship with empty boxes",
  );
  const flat = html.replace(/<[^>]*>/g, "").replace(/\s+/g, "");
  if (exact.length >= 3 && !spec.terms.some((v) => clean(v).replace(".", "").includes(exact)))
    assert.ok(!flat.includes(exact), `${skill.id} "${item.question}": the board prints the answer`);
}
assert.ok(boards > 150, `${boards} column boards checked`);
{
  const dom = new JSDOM(
    `<!doctype html><body>${verticalHtml(columnSpec("+", ["47", "38"]))}</body>`,
  );
  const { document: doc } = dom.window;
  globalThis.document = doc;
  const vc = await import(`${lab}vertical-columns.js?dom`);
  const root = doc.querySelector(".vc");
  const done = [];
  root.addEventListener("vc-complete", (event) => done.push(event.detail));
  const box = (kind, c) => root.querySelector(`.vc-${kind}[data-vc-col="${c}"]`);
  const type = (el, v) => {
    el.value = v;
    vc.checkVerticalCell(el);
  };
  assert.ok(!root.outerHTML.includes("85"), "47 + 38: 85 is nowhere on the page");
  type(box("result", 1), "4"); // wrong ones digit (should be 5): a nudge, no digit
  assert.ok(!box("result", 1).readOnly && !root.querySelector(".ok"));
  assert.ok(!root.outerHTML.includes('value="5"'));
  type(box("result", 1), "5");
  assert.ok(box("result", 1).classList.contains("ok"));
  type(box("carry", 0), "1");
  assert.ok(
    box("carry", 0).classList.contains("ok"),
    "the regrouped ten is the learner's to write",
  );
  type(box("result", 0), "8");
  assert.equal(done.length, 1);
  assert.deepEqual(done[0], { value: "85", opened: false });
}
{
  const dom = new JSDOM(
    `<!doctype html><body>${verticalHtml(columnSpec("-", ["503", "168"]))}</body>`,
  );
  globalThis.document = dom.window.document;
  const vc = await import(`${lab}vertical-columns.js?dom`);
  const root = dom.window.document.querySelector(".vc");
  const done = [];
  root.addEventListener("vc-complete", (event) => done.push(event.detail));
  const box = (kind, c) => root.querySelector(`.vc-${kind}[data-vc-col="${c}"]`);
  const type = (el, v) => {
    el.value = v;
    vc.checkVerticalCell(el);
  };
  // 503 - 168: ones 3 < 8 regroup (13), tens 0 < 6 regroup (9 after lending, 10 with the +10), hundreds 5 - 1 = 4
  type(box("regroup", 2), "13");
  type(box("regroup", 1), "9");
  type(box("regroup", 0), "4");
  assert.ok(
    ["regroup"].every(() => [2, 1, 0].every((c) => box("regroup", c).classList.contains("ok"))),
    "regrouping boxes check",
  );
  type(box("result", 2), "9"); // wrong (should be 5)
  type(box("result", 2), "9"); // second miss opens it
  assert.ok(
    box("result", 2).classList.contains("shown") && box("result", 2).value === "5",
    "two misses open a box",
  );
  type(box("result", 1), "3");
  type(box("result", 0), "3");
  assert.equal(done.length, 1);
  assert.equal(
    done[0].opened,
    true,
    "an opened digit means the result is not copied for the learner",
  );
  assert.equal(done[0].value, "335");
}
delete globalThis.document;

// 3c. Long division: hidden while the problem is live (no remainder label, tooltip or R chip with a number).
const live = StandardLongDivisionModel.renderHtml(437, 12, { isSolver: true, hideAnswer: true });
assert.doesNotMatch(live, /Remainder: \d|title="[^"]*=|R \d/);
assert.match(
  StandardLongDivisionModel.renderHtml(437, 12, { isSolver: true }),
  /Remainder: 5|R 5/,
  "finished problems still show the worked solution",
);

// 3d. Sharing picture: the rows start empty, so the size of each row is the learner's to find.
const share = interactivePicture({
  type: "array",
  a: 7,
  b: 12,
  split: 7,
  share: 84,
  caption: "84 shared equally into 7 rows",
});
assert.match(share, /data-deal/);
assert.doesNotMatch(share, /rows of 12|tp-dot/);
const gen = ALL_SKILLS.find((skill) => skill.id === "division");
for (const item of sample(gen, 40, 9)) {
  if (item.model?.type === "array")
    assert.ok(item.model.share, "a division array is a sharing picture");
}

// 3e. Help shown before the answer is earned: capped steps, never the worked answer.
for (const { skill, item } of items) {
  const html = liveHelpHtml(item, item.hint || "");
  const visible = text(html);
  // One-digit answers collide with step numbers ("Step 1 of 2"), so the text check covers longer answers.
  if (
    /\d/.test(String(item.answers[0])) &&
    String(item.displayAnswer ?? item.answers[0]).replace(/[-.,]/g, "").length >= 2
  )
    assert.ok(
      !stepLeaks(visible, item),
      `${skill.id} "${item.question}": live help states the answer`,
    );
  assert.ok(
    (html.match(/tr-step-num/g) || []).length <= Math.max(1, peekCap(item)),
    "no more steps than the cap",
  );
  assert.ok(!/Final Answer|Solution:|➔/.test(html), "no solution panel before the answer");
  if (peekCap(item) === 0) assert.ok(!html.includes("step-player"), "no steps when none is safe");
}

// 4. The app routes through these modules.
const app = readFileSync(new URL("../math/fluency-lab/app.js", import.meta.url), "utf8");
assert.match(
  app,
  /function renderStudentFriendlyExplanation\(item, copy\) \{\s*if \(!item\)[^\n]*\n[^\n]*\n\s*if \(answerStillHidden\(item, state\.itemDone\)\) return liveHelpHtml/,
  "unfinished problems get live help, not the worked explanation",
);
assert.match(
  app,
  /InteractiveDrillToolbox\.onProblem\(state\.item\)/,
  "a new problem loads into the drawer",
);
const solver = app.slice(
  app.indexOf("const InteractiveSolver = {"),
  app.indexOf("let widaSpeechRecognition") > 0
    ? app.indexOf("let widaSpeechRecognition")
    : app.length,
);
assert.ok(
  solver.includes("bareText(item)"),
  "the solver reads the bare expression (story problems)",
);
assert.doesNotMatch(
  solver,
  /placeholder="\$\{/,
  "no solver box prints a computed value as its placeholder",
);

console.log(
  "fluency model inputs: each model opens with the problem's own numbers and holds back the answer",
);
