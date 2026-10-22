// inequality:graph (lesson 8-5): the number-line graph draws the circle, the ray and the test marker the Rule and the numbers call for.
// Expectations are derived here, separately from the module: membership by the sign of (test - boundary) against a table of allowed
// signs, and positions from the number line's own scale; the picture is read back by parsing its SVG. Run:
//   node tools/studio-model-inequality-graph.test.mjs
import assert from "node:assert/strict";
import { evaluate } from "../curriculum/learning-labs/shared/math.mjs";
import { visual } from "../curriculum/learning-labs/shared/model.mjs";

const SYMBOLS = ["<=", "<", ">=", ">"];
const ALLOWED_SIGNS = { ">=": [0, 1], ">": [1], "<=": [-1, 0], "<": [-1] }; // sign of (value - boundary) for a solution
const SHOWN = { ">=": "≥", ">": ">", "<=": "≤", "<": "<" };
const inSolutionSet = (symbol, boundary, value) =>
  ALLOWED_SIGNS[symbol].includes(Math.sign(value - boundary));
/** x on the number line (-3 to 33 across 572 units starting at 14). */
const xOf = (n) => 14 + ((n + 3) * 572) / 36;
const near = (x, y) => Math.abs(x - y) < 0.011;

const unescape = (s) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const texts = (svg) =>
  [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)"[^>]*>([^<]*)<\/text>/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
    s: unescape(m[3]),
  }));

/** Everything the picture claims about (boundary, test, symbol); the list of mismatches (empty = true). */
function pictureProblems(svg, boundary, test, symbol) {
  const bad = [];
  const closed = symbol.includes("="),
    right = symbol.startsWith(">"),
    qualifies = inSolutionSet(symbol, boundary, test);
  const all = texts(svg),
    words = all.map((t) => t.s);
  if (!words.includes(`Graph of x ${SHOWN[symbol]} ${boundary}`))
    bad.push("the title does not state the inequality");
  // the circle on the boundary: closed (filled) or open
  const circles = [...svg.matchAll(/<circle cx="([\d.]+)" cy="150" r="10" class="([\w-]+)"\/>/g)];
  if (circles.length !== 1) bad.push(`expected one boundary circle, found ${circles.length}`);
  else {
    if (!near(Number(circles[0][1]), xOf(boundary))) bad.push("the circle is not on the boundary");
    if (circles[0][2] !== (closed ? "point" : "open-point"))
      bad.push(`the circle is ${circles[0][2]} but the rule is ${symbol}`);
  }
  if (!words.includes(closed ? "closed circle: included" : "open circle: not included"))
    bad.push("the circle is not named in words");
  if (words.includes(closed ? "open circle: not included" : "closed circle: included"))
    bad.push("the picture names the wrong kind of circle");
  // the shaded ray runs from the boundary toward the solutions and ends in an arrowhead that points the same way
  const rays = [
    ...svg.matchAll(/<line x1="([\d.]+)" y1="150" x2="([\d.]+)" y2="150" class="solution"\/>/g),
  ];
  if (rays.length !== 1) bad.push(`expected one shaded ray, found ${rays.length}`);
  else {
    const [x1, x2] = [Number(rays[0][1]), Number(rays[0][2])];
    if (!near(x1, xOf(boundary))) bad.push("the ray does not start at the boundary");
    if (right ? x2 <= x1 : x2 >= x1) bad.push(`the ray runs the wrong way for ${symbol}`);
  }
  const head = svg.match(
    /<polygon points="([\d.]+),140 [\d.]+,160 ([\d.]+),150" fill="#075f80"\/>/,
  );
  if (!head) bad.push("no arrowhead");
  else if (Number(head[2]) !== (right ? 594 : 6))
    bad.push(`the arrowhead points ${Number(head[2]) > 300 ? "right" : "left"} for ${symbol}`);
  if (words.filter((s) => s === "solutions").length !== 1)
    bad.push("the ray is not labelled 'solutions'");
  // the test marker: solid when it qualifies, hollow when not, on the test value, and said in words
  const marker = svg.match(/<polygon points="([\d.]+),118 ([\d.]+),118 ([\d.]+),138" ([^/]*)\/>/);
  if (!marker) bad.push("no test marker");
  else {
    if (!near(Number(marker[3]), xOf(test))) bad.push("the marker is not on the test value");
    if (/class="point-alt"/.test(marker[4]) !== qualifies)
      bad.push(
        `the marker is ${qualifies ? "hollow" : "solid"} but ${test} ${qualifies ? "qualifies" : "does not qualify"}`,
      );
  }
  if (!words.includes(qualifies ? "qualifies" : "does not qualify"))
    bad.push("the marker does not say whether the value qualifies");
  if (words.includes(qualifies ? "does not qualify" : "qualifies"))
    bad.push("the marker says the opposite");
  if (!words.includes(`test value: ${test}`)) bad.push("the marker does not name the test value");
  // tick labels every 5 from 0 to 30, with the boundary named in place of a tick label beside it
  const labelled = new Set(all.filter((t) => t.y === 178).map((t) => t.s));
  if (!labelled.has(String(boundary))) bad.push("the boundary is not labelled on the line");
  for (let n = 0; n <= 30; n += 5)
    if (Math.abs(n - boundary) > 1 && !labelled.has(String(n)))
      bad.push(`the tick ${n} is not labelled`);
  return bad;
}

let settings = 0;
for (const symbol of SYMBOLS)
  for (let boundary = 1; boundary <= 24; boundary++)
    for (let test = 0; test <= 30; test++) {
      const model = { kind: "inequality", mode: "graph", values: [boundary, test] };
      const r = evaluate(model, [boundary, test], { symbol });
      settings++;
      assert.equal(r.value, test, "the readout is the test value");
      assert.equal(r.symbol, symbol);
      assert.equal(
        r.pass,
        inSolutionSet(symbol, boundary, test),
        `${symbol} ${boundary}, test ${test}: pass`,
      );
      assert.ok(
        r.equation.includes(r.pass ? "qualifies" : "does not qualify") &&
          r.equation.includes(`x ${SHOWN[symbol]} ${boundary}`),
        `equation "${r.equation}"`,
      );
      const svg = visual(model, [boundary, test], r);
      assert.deepEqual(
        pictureProblems(svg, boundary, test, symbol),
        [],
        `${symbol} ${boundary}, test ${test}: the picture disagrees`,
      );
    }
assert.equal(settings, 4 * 24 * 31);
// with no Rule chosen the model reads "x <= boundary", the studio's default for every inequality mode but "entry"
assert.equal(
  evaluate({ kind: "inequality", mode: "graph", values: [9, 14] }, [9, 14], {}).symbol,
  "<=",
);

// a corrupted value is rejected: the graph for x > 9 (open circle, right) checked against x >= 9, x < 9, another test value, another boundary
{
  const model = { kind: "inequality", mode: "graph", values: [9, 14] };
  const svg = visual(model, [9, 14], evaluate(model, [9, 14], { symbol: ">" }));
  assert.deepEqual(pictureProblems(svg, 9, 14, ">"), []);
  assert.notDeepEqual(
    pictureProblems(svg, 9, 14, ">="),
    [],
    "an open circle must not pass for a closed one",
  );
  assert.notDeepEqual(
    pictureProblems(svg, 9, 14, "<"),
    [],
    "a ray pointing right must not pass for one pointing left",
  );
  assert.notDeepEqual(pictureProblems(svg, 9, 5, ">"), [], "a marker on 14 must not pass for 5");
  assert.notDeepEqual(pictureProblems(svg, 10, 14, ">"), [], "a circle on 9 must not pass for 10");
  assert.notDeepEqual(
    pictureProblems(svg.replaceAll(">qualifies<", ">does not qualify<"), 9, 14, ">"),
    [],
    "the wrong verdict must be caught",
  );
}
assert.throws(
  () => evaluate({ kind: "inequality", mode: "graph", values: [9, 14] }, [9, 14], { symbol: "=" }),
  /rule must be/,
);
assert.throws(
  () => evaluate({ kind: "inequality", mode: "graph", values: [9, 14] }, [25, 14], {}),
  /boundary is 1 to 24/,
);
console.log(
  `studio-model-inequality-graph: ${settings} settings, graph and readout agree with the independent derivation.`,
);
