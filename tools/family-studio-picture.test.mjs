// "Picture it" engine (assets/family-studio/picture.mjs): every recognizer reads real homework stems, draws their
// givens, never prints the answer, and returns null on near misses. A sweep over every stem in the lesson pool
// (when the stems file is present) proves nothing throws, every SVG is well formed, and prints coverage.
//
//   node --test tools/family-studio-picture.test.mjs
//   PICTURE_STEMS=/path/to/stems.tsv node --test tools/family-studio-picture.test.mjs   (lessonId \t topic \t stem)

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { pictureFor } from "../assets/family-studio/picture.mjs";

/** Text the reader sees: <text>, <title>, <desc>; the stylesheet (font sizes) is left out. */
function visible(svg) {
  const parts = [...svg.matchAll(/<(text|title|desc)\b[^>]*>([^<]*)<\/\1>/g)].map((m) => m[2]);
  return parts.join(" | ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

/** True when `n` appears in the visible text as a whole number token (so "15" does not match "150" or "1.5"). */
function shows(svg, n) {
  return hasNum(visible(svg), n);
}

function hasNum(text, n) {
  const t = text.replace(/−/g, "-");
  return new RegExp(`(?<![\\d.,/])${String(n).replace(/[.$]/g, "\\$&")}(?![\\d/]|[.,]\\d)`).test(t);
}

/** Tags balance (a tiny XML check: no stray or unclosed element). */
function wellFormed(svg) {
  const stack = [];
  for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    if (m[3]) continue;
    if (!m[1]) stack.push(m[2]);
    else if (stack.pop() !== m[2]) return false;
  }
  return stack.length === 0;
}

/**
 * The build steps: the root's drawable children must all be <g data-build="n"> groups numbered 1..n (n >= 2), with
 * only title / desc / style / defs beside them. Returns the step numbers, or a string naming the problem.
 */
function buildSteps(svg) {
  const inner = svg
    .replace(/^<svg\b[^>]*>/, "")
    .replace(/<\/svg>$/, "")
    .replace(/<(title|desc|style|defs)\b[^>]*>[\s\S]*?<\/\1>/g, "");
  if (/<!--/.test(inner)) return "build marker left in the svg";
  const steps = [];
  let depth = 0;
  let i = 0;
  for (const m of inner.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) {
    if (depth === 0 && inner.slice(i, m.index).trim())
      return `text outside the build groups: ${inner.slice(i, m.index)}`;
    if (m[1]) depth--;
    else if (!m[4]) {
      if (depth === 0) {
        const n = m[2] === "g" && m[3].match(/^ data-build="(\d+)"$/);
        if (!n) return `drawable <${m[2]}> outside the build groups`;
        steps.push(Number(n[1]));
      }
      depth++;
    } else if (depth === 0) return `drawable <${m[2]}/> outside the build groups`;
    i = m.index + m[0].length;
  }
  if (inner.slice(i).trim()) return "text outside the build groups";
  if (steps.length < 2) return `only ${steps.length} build step`;
  if (steps.some((n, k) => n !== k + 1)) return `build steps not numbered 1..n: ${steps}`;
  return steps;
}

/** Assert a stem draws `kind`, shows every given, and never shows any of the answers. */
function check(stem, kind, { gives = [], hides = [], lang = "en" } = {}) {
  const r = pictureFor(stem, { lang });
  assert.ok(r, `expected a ${kind} picture for: ${stem}`);
  assert.equal(r.kind, kind, stem);
  assert.ok(wellFormed(r.svg), `unbalanced svg: ${stem}`);
  assert.match(r.svg, /role="img"/);
  const steps = buildSteps(r.svg);
  assert.ok(Array.isArray(steps), `${steps}: ${stem}`);
  assert.match(r.svg, /<title id="[^"]+">[^<]+<\/title>/);
  assert.match(r.svg, /<desc id="[^"]+">[^<]+<\/desc>/);
  assert.ok(
    r.caption.en && r.caption.es && r.caption.en !== r.caption.es,
    `bilingual caption: ${stem}`,
  );
  for (const g of gives)
    assert.ok(shows(r.svg, g), `given ${g} missing from: ${stem}\n${visible(r.svg)}`);
  for (const h of hides)
    assert.ok(!shows(r.svg, h), `answer ${h} leaked in: ${stem}\n${visible(r.svg)}`);
  for (const h of hides)
    assert.ok(!hasNum(`${r.caption.en} ${r.caption.es}`, h), `answer ${h} in caption: ${stem}`);
  return r;
}

const notKind = (stem, kind) =>
  assert.notEqual(pictureFor(stem)?.kind, kind, `expected no ${kind} for: ${stem}`);

const none = (stem) => assert.equal(pictureFor(stem), null, `expected null for: ${stem}`);

test("power: array for squares, factor strip for higher powers; never the value", () => {
  check("What is the value of 6²?", "power", { gives: [6], hides: [36] });
  check("Find the value of 2 to the 5th power.", "power", { gives: [2], hides: [32] });
  check("Find the value of 5 squared.", "power", { gives: [5], hides: [25] });
  check("A scientist writes 10⁴ for the number of cells. How many cells is that?", "power", {
    gives: [10],
    hides: ["10,000", 10000],
  });
  const es = check("What is the value of 4³?", "power", { gives: [4], hides: [64], lang: "es" });
  assert.match(es.svg, /factores de 4/);
  none("How many factors of 8 are multiplied in 8⁵?"); // the strip would count the factors
  none("In the power 5⁴, which number is the base?");
  none("Write 2⁴ as repeated multiplication.");
  none("Which is greater: 3⁴ or 4³? Find both values.");
  none("A student says 4 to the 4th power is 16 because 4 × 4 = 16. What is the correct value?");
  notKind("Evaluate 2n² − 3 when n = 3.", "power");
});

test("order of operations: ladder of the rungs used, first rung marked; never the value", () => {
  const r = check("Evaluate 30 ÷ (11 − 6) + 2³.", "order", { gives: [30, 11, 6], hides: [14] });
  assert.match(visible(r.svg), /1st/);
  check("What is 6 + 2 × (7 − 4)²?", "order", { gives: [6, 2, 7, 4], hides: [24] });
  check("Evaluate 3 + 2² × 4.", "order", { gives: [3, 4], hides: [19] });
  check("What is 10 − 2²?", "order", { gives: [10], hides: [6] });
  none("In 6 + 3², which should you do first?"); // the "1st" mark would answer it
  none("Two students evaluate 2 × 3² and (2 × 3)². One says both equal 36.");
  none("Miguel evaluates 12 − 2 × 3 and gets 30. Margaret gets 6. Who is right?");
  none("Which number has the prime factorization 2 × 3³?");
  none("What is the value of 2 × 2 × 2 × 2 × 2?"); // one rung only: no order question
});

test("one-step equation: bar model with the variable as ?", () => {
  check("Solve: n − 3 = 7", "equation", { gives: [3, 7], hides: [10] });
  check(
    "A game costs $24. You have $15 and need m more dollars, so 15 + m = 24. What is m?",
    "equation",
    {
      gives: [15, 24],
      hides: [9],
    },
  );
  check("Solve: 5n = 35", "equation", { gives: [35], hides: [7] });
  check("Solve x ÷ 4 = 9.", "equation", { gives: [9], hides: [36] });
  check("Solve: n / 3 = 8", "equation", { gives: [8], hides: [24] });
  none("To solve 4n = 20, what is the first step?");
  none("In the equation n + 4 = 9, which part is the variable?");
  none("A student solving 15 + 3x = 36 divides by 3 first and gets 5 + x = 12, then x = 7.");
  none("Using y = 2x + 4, what value of x gives a target of y = 30?");
  none("The goal is $500 at $12 per car. Using 12n = 500, at least how many cars must be washed?");
});

test("fraction division: dividend bar, divisor group, how many fit ?", () => {
  check("What is 2 1/4 ÷ 3/4?", "fraction-division", { gives: ["2 1/4", "3/4"], hides: [3] });
  check("What is 1/2 ÷ 1/8?", "fraction-division", { gives: ["1/2", "1/8"], hides: [4] });
  check(
    "Lock 2 — The vault dial reads a fraction problem: What is (2/3) ÷ (1/6) in simplest form?",
    "fraction-division",
    {
      gives: ["2/3", "1/6"],
    },
  );
  const share = check("What is 4/5 ÷ 2?", "fraction-division", {
    gives: ["4/5"],
    hides: ["2/5"],
    lang: "es",
  });
  assert.match(share.svg, /partes iguales/);
  none(
    "Agent Park's 6 pounds of evidence powder fill 3/4 of a storage tub. How many pounds fill a WHOLE tub? (6 ÷ 3/4 asks how much is in one whole tub.)",
  );
  none("Which question is answered by 3/4 ÷ 1/8?"); // the caption would be the answer
  none("Marcus solved 5 ÷ 2/3 by writing 5 × 2/3 = 10/3. What mistake did he make?");
  notKind("What is 936 ÷ 12?", "fraction-division");
  none("What is 2/3 ÷ 5/7?"); // divisor bigger than dividend: "how many fit" misleads
});

test("percent: bar from 0% to 100% with the unknown as ?", () => {
  check("What is 75% of 40?", "percent", { gives: [40, "75%", "100%"], hides: [30] });
  check("What is 200% of 15?", "percent", { gives: [15, "200%"], hides: [30] });
  check("$42 is 60% of the original price of a jacket. What was the original price?", "percent", {
    gives: ["$42", "60%"],
    hides: [70, "$70"],
  });
  check("18 students is 30% of the class. How many students are in the whole class?", "percent", {
    gives: [18],
    hides: [60],
  });
  none("Estimate 32% of 89 by rounding to 30% of 90.");
  none("Which is greater: 15% of 200, or 30% of 90?");
  check("A phone case costs $30. It is 40% off. How much is the discount?", "percent", {
    gives: [30, 40],
    hides: [12, 18],
  });
  none("8 is 20% of the whole. What is 10% of the whole?");
});

test("coordinates: labelled points; distance drawn as a ? segment", () => {
  const d = check("Find the distance between (−4, 3) and (5, 3).", "coordinates", {
    gives: [-4, 5, 3],
    hides: [9],
  });
  assert.match(d.svg, /fp-ul/);
  check(
    "Two points are at (-3, -7) and (-3, 5). What is the distance between them?",
    "coordinates",
    { hides: [12] },
  );
  check(
    "From the hub H(4.25, 5.75), Ana walks to A(4.25, −3.25). How far does she walk?",
    "coordinates",
    { gives: [4.25], hides: [9] },
  );
  check("Reflect (−5, 2) across the y-axis. What is the new point?", "coordinates", {
    gives: [-5, 2],
  });
  none("Which quadrant is (−7, 2) in?");
  none("To plot (−2, 5), which way do you move for the −2?");
  none("Which point is farther to the right: (2, 8) or (6, 1)?");
  none("The point (5, 30) is on a graph of bags (x) and marbles (y). What does it mean?"); // off the ±10 grid
  none(
    "The vertices (1, 4) and (7, 4) share y = 4. Is the side between them horizontal or vertical?",
  );
});

test("compare / order: unplaced cards over an evenly padded number line", () => {
  const r = check("Order from least to greatest: −1.5, 2, −3, 0.5.", "compare", {
    gives: [-1.5, 2, -3, 0.5],
  });
  assert.match(r.svg, /fp-p/);
  check("Order these three values from least to greatest: 0.29, 1/4, 32%.", "compare", {
    gives: [0.29, "1/4", "32%"],
  });
  check(
    "Three wells have floors at −275 ft, −53 ft and −809 ft. Order the depths from least to greatest.",
    "compare",
    {
      gives: [-275, -53, -809],
    },
  );
  none("What is the least number that both 6 and 4 divide into evenly?");
  none("Which number has the LEAST absolute value: −1.5, 0.75, −1/4, or 2?");
  none("Sort these integers from GREATEST to LEAST.");
  none("Which is greater: 15% of 200, or 30% of 90?");
});

test("inequality: open or closed circle and ray, only when the stem does not ask about the graph", () => {
  const r = check("Is 5 a solution of x > 3?", "inequality", { gives: [3] });
  assert.match(r.svg, /fp-open/);
  const c = check("Which value is a solution of x ≤ 9?", "inequality", { gives: [9], lang: "es" });
  assert.match(c.svg, /class="fp-dot" cx/);
  assert.match(c.caption.es, /menores o iguales/);
  none("Which circle do you use to graph x > 2?");
  none("Graph x ≥ 3 on a number line. Should the circle at 3 be open or closed?");
  none("Which graph represents x < 5?");
  {
    // A bar model of the givens only: four equal parts of n, at least 20 in all. The solution n ≥ 5 is not drawn.
    const bar = pictureFor("Solve: 4n ≥ 20");
    assert.equal(bar?.kind, "inequality-bar");
    assert.doesNotMatch(bar.svg.replace(/<style>[\s\S]*?<\/style>/, ""), />\s*5\s*</);
    assert.doesNotMatch(bar.caption.en, /\b5\b/);
  }
  check(
    "Mia has $12. She wants at least $50. The inequality is 12 + s ≥ 50. What is the least whole number s?",
    "inequality-bar",
    { gives: [12, 50], hides: [38] },
  );
  none("A theme park has two rides. Ride A requires h > 48 inches. Ride B requires h ≥ 48 inches.");
});

test("dot plot: one dot per value, no summary number", () => {
  check("Six dogs weigh 40, 52, 38, 44, 60, 46 pounds. What is the median weight?", "dot-plot", {
    gives: [38, 60],
    hides: [45],
  });
  check("Find the mean of: 4, 6, 8, 10", "dot-plot", { gives: [4, 10], hides: [7] });
  check("What is the range of 3, 8, 14, 20?", "dot-plot", { gives: [3, 20], hides: [17] });
  none("Which number is an outlier in 12, 14, 13, 15, 60?"); // the plot would point at it
  none(
    "Mia's quiz scores are 8, 9, 10, 9. Leo's are 5, 7, 11, 13. Both means are 9. Who is more consistent?",
  );
  check(
    "Four numbers have a mean of 12. Three of them are 10, 14 and 11. What is the fourth number?",
    "mean-target",
    { gives: [10, 14, 11, 12], hides: [13, 48] },
  );
  none("What is the mode of 2, 3, 3, 5, 7?");
});

test("area: one labelled shape with a dashed height; the unknown is ?", () => {
  check("A trapezoid has bases of 7 m and 11 m and a height of 5 m. What is its area?", "area", {
    gives: [7, 11, 5],
    hides: [45],
  });
  check("A triangle has an area of 28 cm² and a base of 7 cm. What is its height?", "area", {
    gives: [28, 7],
    hides: [8],
  });
  check(
    "A parallelogram has a base of 9 in., a height of 5 in. and a slanted side of 6 in. What is its area?",
    "area",
    {
      gives: [9, 5, 6],
      hides: [45],
    },
  );
  check("A triangle has a base of 10 cm and a height of 6 cm. What is its area?", "area", {
    gives: [10, 6],
    hides: [30],
  });
  none(
    "Parallelogram A has a base of 7 and a height of 6. Parallelogram B has a base of 5 and a height of 9.",
  );
  check(
    "A 10 by 6 rectangle has a 4 by 3 hole. What is the area of what is left?",
    "composite-area",
    { gives: [10, 6, 4, 3], hides: [48, 60, 12] },
  );
  none("A trapezoid has bases of 4 and 6. What is b1 + b2?");
  none(
    "A regular hexagon is decomposed into 6 identical triangles, each with base 8 cm and height 7 cm.",
  );
  none(
    "Each rhombus-shaped tile has a side of 9 cm and a perpendicular height of 7 cm. How much area do 4 tiles cover?",
  );
});

test("conversion and unit price: double number line with ? at the asked amount", () => {
  check("How many inches are in 7 feet?", "conversion", { gives: [7, 12], hides: [84] });
  check("How many liters is 2,000 milliliters?", "conversion", {
    gives: ["2,000", "1,000"],
    hides: [2],
  });
  check("A dog weighs 33 pounds. Use 1 kg ≈ 2.2 lb. How many kilograms is that?", "conversion", {
    gives: [33, 2.2],
    hides: [15],
  });
  check(
    "A store sells 8 notebooks for $20. At the same unit price, what is the cost of 14 notebooks?",
    "unit-rate",
    {
      gives: [8, "$20", 14],
      hides: ["$35", 35],
    },
  );
  check("A store sells 4 notebooks for $10. What is the price of 1 notebook?", "unit-rate", {
    gives: [4, "$10"],
    hides: ["2.50", "$2.50"],
  });
  none("How many minutes are in 1 hour?"); // the "1 = 60" mark would be the answer
  // Not a unit conversion: a rate, drawn as a ratio table instead.
  assert.equal(
    pictureFor("A dose is 3 mg for every 1 kg. A child weighs 20 kg. How many mg is the dose?")
      .kind,
    "ratio-table",
  );
  check(
    "Juice A: 4 bottles for $6. Juice B: 5 bottles for $9. Which has the lower price per bottle?",
    "rate-compare",
    { gives: [4, 6, 5, 9], hides: [1.5, 1.8] },
  );
  none(
    "When converting, do you multiply or divide? Sort each conversion by the correct operation.",
  );
});

test("build steps: frame first, then givens, then the unknown, as consecutive data-build groups", () => {
  const r = pictureFor("Find the distance between (2, −1) and (2, −9).");
  assert.deepEqual(buildSteps(r.svg), [1, 2, 3]);
  const [frame, given, unknown] = [
    ...r.svg.matchAll(/<g data-build="\d">([\s\S]*?)<\/g>(?=<g data-build|<\/svg>)/g),
  ].map((m) => m[1]);
  assert.match(frame, /fp-gr/);
  assert.match(given, /\(2, −9\)/);
  assert.match(unknown, /fp-q/);
  assert.equal(
    buildSteps('<svg><title>t</title><g data-build="1"></g><rect/></svg>').startsWith("drawable"),
    true,
  );
  assert.equal(
    buildSteps('<svg><g data-build="1"></g><g data-build="3"></g></svg>').startsWith("build steps"),
    true,
  );
});

test("coordinates: the grid is cropped to the points so they fill the frame", () => {
  const r = pictureFor("Find the distance between (2, −1) and (2, −9).");
  assert.match(visible(r.svg), /x from 0 to 4 and y from −10 to 0/);
  const far = pictureFor("Plot the point (7, 8).");
  assert.match(visible(far.svg), /x from 0 to 8 and y from 0 to 9/);
  const lone = pictureFor("Plot the point (−6, −7).");
  assert.match(visible(lone.svg), /x from −7 to 0 and y from −8 to 0/);
});

test("pure and deterministic: same stem, same bytes; English and Spanish ids differ", () => {
  const a = pictureFor("Solve: 5n = 35");
  assert.deepEqual(a, pictureFor("Solve: 5n = 35"));
  const es = pictureFor("Solve: 5n = 35", { lang: "es" });
  const ida = a.svg.match(/<title id="([^"]+)"/)[1];
  const ides = es.svg.match(/<title id="([^"]+)"/)[1];
  assert.notEqual(ida, ides);
  assert.equal(pictureFor(""), null);
  assert.equal(pictureFor(null), null);
  assert.ok(!/[^\x09\x0a\x20-\x7e -￿]/.test(a.svg));
  assert.ok(!/(href|url\()/.test(a.svg), "no external references");
});

const STEMS =
  process.env.PICTURE_STEMS ||
  "/private/tmp/claude-501/-Users-joelneft/444eb38e-2b3f-4ce3-90ce-38a452359495/scratchpad/stems.tsv";

test("sweep: every stem in the pool runs, every picture is well formed", {
  skip: !existsSync(STEMS) && "stems file not present",
}, () => {
  const rows = readFileSync(STEMS, "utf8")
    .trim()
    .split("\n")
    .map((l) => l.split("\t"));
  const byKind = {};
  const byTopic = {};
  let hit = 0;
  const kinds = new Set();
  for (const [, topic, stem] of rows) {
    byTopic[topic] ??= [0, 0];
    byTopic[topic][1]++;
    for (const lang of ["en", "es"]) {
      const r = pictureFor(stem, { topic, lang });
      if (!r) continue;
      assert.ok(wellFormed(r.svg), `unbalanced svg for: ${stem}`);
      const steps = buildSteps(r.svg);
      assert.ok(Array.isArray(steps), `${steps}: ${stem}`);
      kinds.add(r.kind);
      assert.match(
        r.svg,
        /^<svg [^>]*role="img"[^>]*viewBox="0 0 360 \d+(\.\d)?"|^<svg [^>]*viewBox="0 0 360 \d+(\.\d)?"[^>]*role="img"/,
      );
      assert.match(r.svg, /<title id=[^>]+>[^<]+<\/title><desc id=[^>]+>[^<]+<\/desc>/);
      const h = Number(r.svg.match(/viewBox="0 0 360 ([\d.]+)"/)[1]);
      assert.ok(h <= 240, `picture taller than 240 (${h}): ${stem}`);
      for (const m of r.svg.matchAll(/font-size:(\d+)px/g)) assert.ok(Number(m[1]) >= 13);
      if (lang === "en") {
        hit++;
        byKind[r.kind] = (byKind[r.kind] || 0) + 1;
        byTopic[topic][0]++;
      }
    }
  }
  console.log(
    `picture coverage: ${hit} / ${rows.length} stems (${((100 * hit) / rows.length).toFixed(1)}%)`,
  );
  console.log("by kind:", JSON.stringify(byKind));
  console.log(
    "by topic:",
    Object.entries(byTopic)
      .sort((a, b) => b[1][1] - a[1][1])
      .map(([t, [h, n]]) => `${t} ${h}/${n}`)
      .join(", "),
  );
  assert.ok(hit > 300, "coverage collapsed: a recognizer stopped matching");
});

// One real stem per round-2 kind: the givens are drawn and the answer never is.
test("round-2 kinds draw the givens and never the answer", () => {
  const cases = [
    ["A shelf holds 9 cans. A pantry has 4 shelves just like it. How many cans are in the pantry?", "equal-groups", [9], [36]],
    ["Four tickets cost $10.00 altogether. All the tickets cost the same. What does one ticket cost?", "equal-groups", ["10.00"], [2.5, "2.50"]],
    ["A car travels 180 miles using 6 gallons of gas. What is the unit rate in miles per gallon?", "rate-table", [180, 6], [30]],
    ["The unit rate is $3 per pound. How much do 7 pounds cost?", "rate-table", [3, 7], [21]],
    ["Two boxes: Box A is 10 × 5 × 4 inches. Box B is 8 × 6 × 5 inches. Which has more volume and by how much?", "box-compare", [10, 5, 4, 8, 6], [200, 240, 40]],
    ["The target total is 60 and you already have 45. How much more do you need?", "part-whole", [60, 45], [15]],
    ["A plant is 10 cm tall and grows 2 cm each week. How tall is it after 4 weeks?", "growth", [10], [18]],
    ["A table shows x = 1, 2, 3 and y = 7, 9, 11. What is y when x = 4?", "xy-table", [7, 9, 11], [13]],
    ["A rectangle is 9 units long and 4 units wide. What is its perimeter?", "rectangle", [9, 4], [26, 36]],
    ["You have $20. You buy items costing $6.75 and $4.50. How much money is left?", "change-chain", [20, 6.75, "4.50"], [8.75]],
    ["Q1 = 12 and Q3 = 30. What is the IQR?", "iqr", [12, 30], [18]],
    ["Set M is 7, 9, 11, 13 with mean 10. What is its MAD?", "mad", [7, 9, 11, 13], [2]],
    ["The mean of a data set is 15. One value is 11. What is the absolute deviation of that value from the mean?", "deviation", [15, 11], [4]],
    ["A row of a ratio table is 12:8. Divide both numbers by 4. What is the new row?", "ratio-scale", [12, 8], [3, 2]],
    ["A team has 6 girls and 4 boys. What is the ratio of girls to ALL the players?", "ratio-parts", [6, 4], [10]],
    ["A cat weighs 11 pounds. The dose is 6 mg for every 1 kg. (1 kg ≈ 2.2 lbs) How much medicine does the cat need?", "dose", [11, 2.2, 6], [5, 30]],
    ["12 out of 20 students bring lunch from home. What percent bring lunch?", "percent-of", [12, 20], [60]],
    ["A 9 by 4 rectangle has a 3 by 2 rectangle cut out. What area is left?", "composite-area", [9, 4, 3, 2], [30, 36]],
    ["A regular pentagon splits into 5 triangles. Each triangle has a base of 6 and a height of 5. What is the area of the pentagon?", "polygon-triangles", [6, 5], [15, 75]],
    ["The faces of a box have areas 6, 8 and 12, and each area appears twice. What is the surface area?", "face-sum", [6, 8, 12], [52]],
    ["What is the LCM of 6 and 8?", "multiples", [6, 8], [24]],
    ["A teacher has 24 pencils and 36 erasers. She makes identical kits with nothing left over. What is the greatest number of kits?", "common-factor", [24, 36], [12]],
  ];
  for (const [stem, kind, gives, hides] of cases) check(stem, kind, { gives, hides });
});
