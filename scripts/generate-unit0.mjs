#!/usr/bin/env node
/*
 * generate-unit0.mjs — builds the self-contained "Unit 0" holding area for
 * Grade 6 math standards that currently have NO lesson in the curriculum.
 *
 * Why Unit 0 exists: the six standards below were flagged NO_CONTENT in
 * data/content-coverage.json (no activity tagged to them anywhere on the site).
 * Per the request, each gets a lesson, parked in a new "Unit 0" to be sorted
 * into the real unit sequence later.
 *
 * Output: math/unit-0/index.html (hub) + math/unit-0/<slug>/index.html (lessons).
 * Pages are fully self-contained (only dependency is /assets/shared.css) so they
 * never break the generated curriculum manifest / content-graph pipeline.
 *
 * Standard codes use the CURRENT repo taxonomy (CCSS-based, data/standards-
 * taxonomy.json). When the revised 2025 Maryland MCCRS codes become available,
 * these will be re-coded along with the rest of the curriculum.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "math", "unit-0");

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** @type {Array<Object>} */
const LESSONS = [
  {
    slug: "compare-rational-numbers-number-line",
    standard: "6.NS.C.7.A",
    title: "Comparing Rational Numbers on the Number Line",
    emoji: "↔️",
    objective:
      "I can interpret a statement of inequality (like −3 > −7) as a statement about the relative position of two numbers on a number line.",
    languageObjective:
      "I can explain a comparison using the words greater than, less than, left, and right.",
    vocab: [
      ["Inequality", "A statement that compares two values using > or <."],
      ["Number line", "A line where every point stands for a number, with values increasing left to right."],
      ["Rational number", "Any number that can be written as a fraction, including integers and negatives."],
    ],
    teach: [
      "On a horizontal number line, numbers get larger as you move <strong>right</strong> and smaller as you move <strong>left</strong>.",
      "So an inequality is really a statement about position. <strong>−3 &gt; −7</strong> means −3 sits to the <em>right</em> of −7 on the line.",
      "Watch the trap with negatives: −3 is greater than −7 even though 7 is bigger than 3. Picture the line, not just the digits.",
    ],
    example: {
      prompt: "Place −7 and −3 on the line and compare them.",
      work: [
        "−7 is 7 units left of 0; −3 is 3 units left of 0.",
        "−3 is to the right of −7.",
        "A number to the right is greater, so −3 &gt; −7 (and −7 &lt; −3).",
      ],
    },
    practice: [
      { type: "mc", q: "Which symbol makes it true:  −2 ___ −5 ?", choices: [">", "<", "="], answer: ">", hint: "−2 is closer to 0, so it is farther right than −5." },
      { type: "mc", q: "A number to the LEFT of another number on the line is always…", choices: ["greater", "less", "equal"], answer: "less", hint: "Values increase to the right, decrease to the left." },
      { type: "input", q: "Order from least to greatest (use commas):  −4, 0, −1", answer: "-4, -1, 0", hint: "Least is farthest left on the line.", normalize: true },
      { type: "mc", q: "True or False:  −8 > −3", choices: ["True", "False"], answer: "False", hint: "−8 is farther left than −3, so it is less." },
    ],
    exit: "Without computing, explain why −1 > −6 using the position of each number on a number line.",
  },
  {
    slug: "order-rational-numbers-in-context",
    standard: "6.NS.C.7.B",
    title: "Writing & Explaining Order in Real-World Contexts",
    emoji: "🌡️",
    objective:
      "I can write, interpret, and explain statements of order for rational numbers in real-world situations.",
    languageObjective:
      "I can explain what an inequality means in a real situation using because.",
    vocab: [
      ["Order statement", "An inequality such as −7 < −3 that tells which value is greater."],
      ["Context", "The real-world situation a number describes (money, temperature, elevation)."],
      ["Balance", "How much money is in an account; a negative balance means money is owed."],
    ],
    teach: [
      "Numbers describe real things: temperature, money, elevation, depth. The order statement has a real-world meaning.",
      "Example: a temperature of −7°C is colder than −3°C. We write <strong>−7 &lt; −3</strong>, and in words: −7 is less than −3, so −7°C is the colder day.",
      "Always tie the symbol back to the story: <em>which</em> is more money, warmer, higher, deeper?",
    ],
    example: {
      prompt: "Tuesday's low was −5°F. Wednesday's low was −12°F. Compare them.",
      work: [
        "−12 is farther left than −5, so −12 &lt; −5.",
        "In context: Wednesday (−12°F) was the colder day.",
      ],
    },
    practice: [
      { type: "mc", q: "Account A: −$20.  Account B: −$50.  Which balance is greater?", choices: ["−$20", "−$50", "they are equal"], answer: "−$20", hint: "−20 is closer to 0, so it is the greater balance." },
      { type: "mc", q: "Using those accounts, who OWES more money?", choices: ["Account A", "Account B"], answer: "Account B", hint: "Owing more = farther below zero = −50." },
      { type: "input", q: "A diver is at −30 ft and a fish is at −12 ft. Write an inequality comparing the diver to the fish (use < or >). Example form: -30 ? -12", answer: "-30 < -12", hint: "Deeper is more negative, so it is less.", normalize: true },
      { type: "mc", q: "−12 < −5 for the temperatures above. What does it MEAN?", choices: ["Wednesday was colder", "Tuesday was colder", "Both days were equal"], answer: "Wednesday was colder", hint: "The smaller temperature is the colder one." },
    ],
    exit: "A debt of $15 and a debt of $40 can be written as balances −15 and −40. Write an order statement comparing the two balances and explain what it means about who owes more.",
  },
  {
    slug: "absolute-value-vs-order",
    standard: "6.NS.C.7.D",
    title: "Absolute Value vs. Order",
    emoji: "📏",
    objective:
      "I can tell the difference between comparing absolute values (size/distance from 0) and comparing the actual order of two numbers.",
    languageObjective:
      "I can explain the difference between 'greater' and 'bigger absolute value' using an example.",
    vocab: [
      ["Absolute value", "The distance of a number from 0, written |x|. Always zero or positive."],
      ["Magnitude", "The size of a number ignoring its sign — its absolute value."],
      ["Order", "Which number is actually greater or less, signs included."],
    ],
    teach: [
      "Absolute value asks <strong>how far from 0</strong>. Order asks <strong>which is greater</strong> on the line. They are not the same for negatives.",
      "Example: −30 &lt; −5 (order: −30 is less). But |−30| = 30 and |−5| = 5, so |−30| &gt; |−5| (size: −30 is farther from 0).",
      "Real meaning: a balance of −$30 is <em>less</em> than −$5, yet it is a <em>bigger debt</em> because its absolute value is larger.",
    ],
    example: {
      prompt: "Compare −7 and −2 two ways.",
      work: [
        "Order: −7 is left of −2, so −7 &lt; −2.",
        "Absolute value: |−7| = 7 and |−2| = 2, so |−7| &gt; |−2|.",
        "So −7 is the lesser number but has the greater magnitude.",
      ],
    },
    practice: [
      { type: "input", q: "Evaluate:  |−7| =", answer: "7", hint: "Absolute value is distance from 0 — drop the sign." },
      { type: "mc", q: "Which number is GREATER:  −7 or −2 ?", choices: ["−7", "−2"], answer: "−2", hint: "Greater = farther right on the line." },
      { type: "mc", q: "Which number has the GREATER ABSOLUTE VALUE:  −7 or −2 ?", choices: ["−7", "−2"], answer: "−7", hint: "|−7| = 7, |−2| = 2." },
      { type: "mc", q: "A debt of $45 (−45) vs a debt of $20 (−20): who OWES more?", choices: ["the $45 debt", "the $20 debt"], answer: "the $45 debt", hint: "Owing more = greater absolute value, even though −45 < −20." },
      { type: "mc", q: "True or False:  If a < b then |a| < |b| is always true.", choices: ["True", "False"], answer: "False", hint: "Counterexample: −5 < 2 but |−5| = 5 > 2 = |2|." },
    ],
    exit: "Diver A is at −40 ft and Diver B is at −25 ft. Write one sentence comparing their positions (order) and one sentence comparing their depths (absolute value).",
  },
  {
    slug: "parts-of-an-expression",
    standard: "6.EE.A.2.B",
    title: "Naming the Parts of an Expression",
    emoji: "🧩",
    objective:
      "I can identify parts of an expression using the words sum, term, product, factor, quotient, and coefficient.",
    languageObjective:
      "I can describe an expression using the math words term, factor, and coefficient.",
    vocab: [
      ["Term", "A part of an expression separated by + or −. In 3x + 7, the terms are 3x and 7."],
      ["Coefficient", "The number multiplied by a variable. In 3x, the coefficient is 3."],
      ["Factor", "Numbers or expressions multiplied together. In 4(x+2), the factors are 4 and (x+2)."],
      ["Sum / Product / Quotient", "The result of adding / multiplying / dividing."],
    ],
    teach: [
      "Break an expression at every + and − sign to find its <strong>terms</strong>.",
      "Inside a term, the number multiplying the variable is the <strong>coefficient</strong>; the things being multiplied are <strong>factors</strong>.",
      "Name the whole expression by its last operation: <strong>3x + 7</strong> is a <em>sum</em>; <strong>4(x + 2)</strong> is a <em>product</em>; <strong>x ÷ 5</strong> is a <em>quotient</em>.",
    ],
    example: {
      prompt: "Describe the parts of  3x + 7.",
      work: [
        "Two terms: 3x and 7.",
        "In the term 3x: 3 is the coefficient and x is the variable; 3 and x are factors.",
        "The whole expression is a sum (its last operation is addition).",
      ],
    },
    practice: [
      { type: "input", q: "How many terms are in  5y + 2 ?", answer: "2", hint: "Count the parts separated by + or −." },
      { type: "input", q: "In  5y, what is the coefficient?", answer: "5", hint: "The number multiplied by the variable." },
      { type: "mc", q: "The expression  4(x + 2)  is best described as a…", choices: ["sum", "product", "quotient"], answer: "product", hint: "Its outer operation is multiplication of two factors." },
      { type: "input", q: "How many terms are in  8a + 3b − 6 ?", answer: "3", hint: "8a, 3b, and 6." },
      { type: "mc", q: "In  8a + 3b − 6,  the coefficient of b is…", choices: ["8", "3", "6"], answer: "3", hint: "Find the number multiplying b." },
    ],
    exit: "For the expression 7m + 4, name the two terms and state the coefficient of m.",
  },
  {
    slug: "number-of-observations",
    standard: "6.SP.B.5.A",
    title: "Summarizing Data: Number of Observations",
    emoji: "🔢",
    objective:
      "I can summarize a data set by reporting the number of observations (n).",
    languageObjective:
      "I can state how many data values were collected using the phrase there are ___ observations.",
    vocab: [
      ["Observation", "A single recorded data value (one measurement or response)."],
      ["Number of observations (n)", "How many data values are in the set."],
      ["Data set", "The whole collection of observations."],
    ],
    teach: [
      "When you summarize data, the first thing to report is <strong>how many values</strong> you have. We call this the number of observations, written <strong>n</strong>.",
      "In a list, count every value (including repeats). In a dot plot, count every dot. In a survey, it's the number of responses.",
      "Example: the scores {88, 92, 75, 90, 85} have <strong>n = 5</strong> observations.",
    ],
    example: {
      prompt: "How many observations are in  {88, 92, 75, 90, 85} ?",
      work: ["Count each value: 88, 92, 75, 90, 85.", "There are 5 values, so n = 5."],
    },
    practice: [
      { type: "input", q: "How many observations are in  {3, 7, 7, 2, 9, 4} ?", answer: "6", hint: "Count every value, including the repeated 7." },
      { type: "input", q: "A survey asked 12 households how many pets they own. What is n?", answer: "12", hint: "n is the number of responses." },
      { type: "input", q: "A dot plot shows these dots above the numbers: 2 dots on 4, 3 dots on 5, 1 dot on 7. How many observations?", answer: "6", hint: "Add up all the dots: 2 + 3 + 1." },
      { type: "mc", q: "The number of observations tells you…", choices: ["how many data values were collected", "the largest value", "the average value"], answer: "how many data values were collected", hint: "n counts the data, it does not summarize size." },
    ],
    exit: "A class recorded {6, 8, 6, 10, 9, 7, 8}. State the number of observations and explain what n means.",
  },
  {
    slug: "describe-attribute-and-units",
    standard: "6.SP.B.5.B",
    title: "Summarizing Data: Attribute & Units",
    emoji: "🏷️",
    objective:
      "I can describe a data set by naming the attribute under investigation, how it was measured, and its units.",
    languageObjective:
      "I can describe a data set using the sentence frame the attribute is ___ , measured in ___ .",
    vocab: [
      ["Attribute", "The characteristic being measured or counted (height, temperature, time)."],
      ["Units of measurement", "The standard the attribute is measured in (cm, °F, minutes, books)."],
      ["Measurement tool", "What you use to get the value (ruler, thermometer, stopwatch)."],
    ],
    teach: [
      "A full data summary explains <strong>what</strong> was measured (the attribute), <strong>how</strong> it was measured, and the <strong>units</strong>.",
      "Example: 'heights of students' — attribute: <strong>height</strong>; tool: <strong>tape measure</strong>; units: <strong>centimeters</strong>.",
      "Counts have units too: 'books read per month' is measured in <strong>books</strong>.",
    ],
    example: {
      prompt: "Describe the data set: the daily high temperature for two weeks.",
      work: [
        "Attribute: temperature.",
        "Measured with: a thermometer.",
        "Units: degrees Fahrenheit (°F).",
      ],
    },
    practice: [
      { type: "mc", q: "Data: the daily high temperatures in a city. The attribute is…", choices: ["temperature", "the city", "the day"], answer: "temperature", hint: "The attribute is the characteristic being measured." },
      { type: "mc", q: "Good units for that temperature data would be…", choices: ["degrees (°F or °C)", "inches", "students"], answer: "degrees (°F or °C)", hint: "Temperature is measured in degrees." },
      { type: "mc", q: "Data: number of books each student read this month. The units are…", choices: ["books", "minutes", "grams"], answer: "books", hint: "It is a count of books." },
      { type: "mc", q: "Best tool to measure 'length of each fish caught'?", choices: ["a ruler/measuring tape", "a thermometer", "a stopwatch"], answer: "a ruler/measuring tape", hint: "Length is measured with a ruler or tape." },
    ],
    exit: "For the data set 'lengths of fish caught', name the attribute, a tool you could use to measure it, and appropriate units.",
  },
];

const PAGE_CSS = `
  :root{--ink:#0f172a;--muted:#475569;--bg:#f8fafc;--card:#ffffff;--accent:#0d9488;--accent2:#0ea5e9;--ok:#16a34a;--no:#dc2626;--line:#e2e8f0}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.55}
  .wrap{max-width:880px;margin:0 auto;padding:20px}
  a.back{display:inline-block;margin:8px 0 16px;color:var(--accent);text-decoration:none;font-weight:600}
  a.back:hover{text-decoration:underline}
  .hero{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-radius:18px;padding:26px 24px;box-shadow:0 10px 30px rgba(13,148,136,.25)}
  .hero .tag{display:inline-block;background:rgba(255,255,255,.22);border-radius:999px;padding:4px 12px;font-size:13px;font-weight:700;letter-spacing:.03em}
  .hero h1{margin:.4em 0 .2em;font-size:clamp(22px,4vw,30px)}
  .hero p{margin:.3em 0;font-size:15px;opacity:.96}
  .card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin:16px 0;box-shadow:0 2px 10px rgba(15,23,42,.04)}
  .card h2{margin:0 0 .6em;font-size:19px;display:flex;align-items:center;gap:8px}
  .vocab{display:grid;gap:10px}
  .vocab div{background:#f1f5f9;border-radius:10px;padding:10px 12px}
  .vocab b{color:var(--accent)}
  ol.work{margin:.4em 0;padding-left:1.3em}
  ol.work li{margin:.3em 0}
  .ex{background:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;padding:14px 16px}
  .q{border:1px solid var(--line);border-radius:12px;padding:14px 16px;margin:12px 0;background:#fff}
  .q .prompt{font-weight:600;margin-bottom:10px}
  .choices{display:grid;gap:8px}
  .choices button{text-align:left;padding:10px 12px;border:1.5px solid var(--line);border-radius:10px;background:#fff;cursor:pointer;font-size:15px;transition:.15s}
  .choices button:hover{border-color:var(--accent)}
  .choices button.sel{border-color:var(--accent);background:#f0fdfa}
  .choices button.right{border-color:var(--ok);background:#dcfce7}
  .choices button.wrong{border-color:var(--no);background:#fee2e2}
  .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
  input.ans{padding:9px 12px;border:1.5px solid var(--line);border-radius:10px;font-size:15px;min-width:160px}
  .btn{padding:9px 16px;border:none;border-radius:10px;background:var(--accent);color:#fff;font-weight:600;cursor:pointer;font-size:15px}
  .btn:hover{filter:brightness(1.05)}
  .fb{margin-top:10px;font-weight:600;font-size:14px;display:none}
  .fb.ok{color:var(--ok);display:block}
  .fb.no{color:var(--no);display:block}
  .hint{margin-top:6px;font-size:13px;color:var(--muted);display:none}
  .hint.show{display:block}
  .score{position:sticky;top:0;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-weight:700;z-index:5;box-shadow:0 2px 8px rgba(15,23,42,.06)}
  .frames{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:14px 16px}
  .frames li{margin:.3em 0}
  textarea.exit{width:100%;min-height:90px;border:1.5px solid var(--line);border-radius:10px;padding:10px;font:inherit}
  footer{color:var(--muted);font-size:13px;text-align:center;margin:24px 0}
  .reslinks{display:flex;flex-wrap:wrap;gap:10px}
  .reslinks a{display:inline-block;padding:9px 14px;border:1.5px solid var(--line);border-radius:10px;text-decoration:none;color:var(--accent);font-weight:600;background:#f0fdfa}
  .reslinks a:hover{border-color:var(--accent)}
`;

const PRINT_CSS = `
  *{box-sizing:border-box}
  body{font-family:Georgia,'Times New Roman',serif;color:#000;max-width:760px;margin:0 auto;padding:28px 26px;line-height:1.5}
  h1{font-size:21px;margin:0 0 2px}
  .meta{font-size:13px;color:#333;margin-bottom:6px}
  .namebar{display:flex;justify-content:space-between;border-top:2px solid #000;border-bottom:2px solid #000;padding:6px 0;margin:10px 0 16px;font-size:14px}
  ol.prob{padding-left:22px}
  ol.prob li{margin:0 0 16px}
  .choice{margin:3px 0 0 6px}
  .ans-space{display:block;border-bottom:1px solid #999;height:22px;margin-top:8px}
  .key{margin-top:26px;border:2px solid #000;border-radius:8px;padding:12px 16px;page-break-before:always}
  .key h2{margin:.2em 0 .4em;font-size:16px}
  .key ol{padding-left:22px;margin:0}
  .key li{margin:.25em 0}
  .teacheronly{font-size:12px;font-weight:bold;letter-spacing:.05em;text-transform:uppercase}
  @media print{a{color:#000;text-decoration:none}}
`;

const DOC_CSS = `
  *{box-sizing:border-box}
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;background:#f8fafc;max-width:780px;margin:0 auto;padding:24px;line-height:1.55}
  a.back{display:inline-block;margin-bottom:12px;color:#0d9488;text-decoration:none;font-weight:600}
  h1{font-size:22px;margin:.2em 0}
  .tag{display:inline-block;background:#f0fdfa;color:#0d9488;border-radius:999px;padding:3px 12px;font-size:13px;font-weight:700}
  section{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:16px 18px;margin:14px 0}
  section h2{margin:0 0 .5em;font-size:17px}
  .vocab b{color:#0d9488}
  ol li,ul li{margin:.3em 0}
`;

/* Per-lesson teaching metadata (specific, not generic — keyed by standard). */
const META = {
  "6.NS.C.7.A": {
    misconception:
      "Students compare the digits and conclude −8 > −3 because 8 > 3, instead of comparing position on the number line.",
    teachTip:
      "Keep a number line visible; have students physically point to each number before choosing > or <.",
    familyHelp:
      "Ask your child to compare two negative numbers (like −2 and −9) and explain which is greater — the one farther right on a number line wins.",
  },
  "6.NS.C.7.B": {
    misconception:
      "Students read 'a bigger debt' as 'a greater number,' so they may claim −50 > −20 because 50 > 20.",
    teachTip:
      "Always restate the inequality in the story's words: which is colder, higher, or more money?",
    familyHelp:
      "Talk about real negatives — temperatures below zero, or money owed — and ask which value is greater and what that means in the situation.",
  },
  "6.NS.C.7.D": {
    misconception:
      "Students confuse 'greater value' with 'greater absolute value,' especially for negative numbers.",
    teachTip:
      "Use money: −$30 is less than −$5 (order) but a bigger debt (absolute value). Treat them as two separate questions.",
    familyHelp:
      "Ask: which is the lower number, −7 or −2? Then ask which is farther from zero. They have different answers — that's the whole idea.",
  },
  "6.EE.A.2.B": {
    misconception:
      "Students miscount terms (treating 3x as two terms) or call the variable the coefficient.",
    teachTip:
      "Box each term at the + and − signs first, then label the coefficient inside each term.",
    familyHelp:
      "Have your child point to the terms and name the coefficient in an expression like 4x + 7.",
  },
  "6.SP.B.5.A": {
    misconception:
      "Students forget to count repeated values, or confuse n (how many) with the largest value (how big).",
    teachTip:
      "Stress that n counts every data point, including repeats — it answers 'how many,' not 'how big.'",
    familyHelp:
      "Give your child a short list of numbers and ask how many values there are — remind them to count repeats too.",
  },
  "6.SP.B.5.B": {
    misconception:
      "Students name the data set itself instead of the attribute, or leave out the units.",
    teachTip:
      "Ask three questions every time: what was measured? how was it measured? in what units?",
    familyHelp:
      "Pick any data around the house (heights, temperatures, minutes) and ask: what is being measured, how, and in what units?",
  },
};

/** answer-key list HTML from a lesson's practice + exit ticket. */
function keyList(L) {
  const items = L.practice
    .map((p, i) => `<li><b>${i + 1}.</b> ${esc(p.answer)}</li>`)
    .join("\n      ");
  return `<ol>\n      ${items}\n      <li><b>Exit ticket:</b> answers will vary — look for correct reasoning about ${esc(L.standard)} (see the worked example and teaching tip).</li>\n    </ol>`;
}

function printPage(L) {
  const probs = L.practice
    .map((p) => {
      if (p.type === "mc") {
        const ch = p.choices
          .map((c, j) => `<div class="choice">${"ABCD"[j]}. ${esc(c)}</div>`)
          .join("");
        return `<li>${esc(p.q)}${ch}</li>`;
      }
      return `<li>${esc(p.q)}<span class="ans-space"></span></li>`;
    })
    .join("\n      ");
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(L.title)} — Worksheet (${esc(L.standard)})</title>
<style>${PRINT_CSS}</style></head>
<body>
  <h1>${esc(L.title)}</h1>
  <div class="meta">Grade 6 Math · Unit 0 · Standard ${esc(L.standard)}</div>
  <div class="namebar"><span>Name: ______________________________</span><span>Date: ____________</span></div>
  <p><strong>Goal:</strong> ${esc(L.objective)}</p>
  <ol class="prob">
      ${probs}
      <li><strong>Exit ticket.</strong> ${esc(L.exit)}<span class="ans-space"></span><span class="ans-space"></span></li>
  </ol>
  <div class="key">
    <div class="teacheronly">Teacher answer key — remove before copying</div>
    <h2>Answer key</h2>
    ${keyList(L)}
  </div>
</body></html>
`;
}

function teacherPage(L) {
  const m = META[L.standard] || {};
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(L.title)} — Teacher Notes (${esc(L.standard)})</title>
<link rel="stylesheet" href="/assets/shared.css" />
<style>${DOC_CSS}</style></head>
<body>
  <a class="back" href="./">← Back to lesson</a>
  <span class="tag">${esc(L.standard)} · Teacher notes</span>
  <h1>${L.emoji} ${esc(L.title)}</h1>
  <section><h2>Objectives</h2>
    <p><strong>Content:</strong> ${esc(L.objective)}</p>
    <p><strong>Language:</strong> ${esc(L.languageObjective)}</p>
  </section>
  <section><h2>⚠️ Common misconception</h2><p>${esc(m.misconception || "")}</p></section>
  <section><h2>💡 Teaching tip</h2><p>${esc(m.teachTip || "")}</p></section>
  <section class="vocab"><h2>Vocabulary</h2>
    <ul>${L.vocab.map(([t, d]) => `<li><b>${esc(t)}:</b> ${esc(d)}</li>`).join("")}</ul>
  </section>
  <section><h2>Answer key</h2>${keyList(L)}</section>
  <section><h2>Print</h2><p><a href="./print.html">Open the printable worksheet + key →</a></p></section>
</body></html>
`;
}

function familyPage(L) {
  const m = META[L.standard] || {};
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(L.title)} — Family Page (${esc(L.standard)})</title>
<link rel="stylesheet" href="/assets/shared.css" />
<style>${DOC_CSS}</style></head>
<body>
  <a class="back" href="./">← Back to lesson</a>
  <span class="tag">${esc(L.standard)} · For families</span>
  <h1>${L.emoji} ${esc(L.title)}</h1>
  <section><h2>What we're learning</h2><p>${esc(L.objective)}</p></section>
  <section><h2>🏠 Try this at home</h2><p>${esc(m.familyHelp || "")}</p></section>
  <section class="vocab"><h2>Words to know</h2>
    <ul>${L.vocab.map(([t, d]) => `<li><b>${esc(t)}:</b> ${esc(d)}</li>`).join("")}</ul>
  </section>
</body></html>
`;
}

function lessonPage(L) {
  const practiceHtml = L.practice
    .map((p, i) => {
      if (p.type === "mc") {
        const btns = p.choices
          .map(
            (c) =>
              `<button type="button" data-c="${esc(c)}">${esc(c)}</button>`,
          )
          .join("");
        return `<div class="q" data-type="mc" data-i="${i}" data-answer="${esc(p.answer)}">
        <div class="prompt">${i + 1}. ${esc(p.q)}</div>
        <div class="choices">${btns}</div>
        <div class="hint">💡 ${esc(p.hint)}</div>
        <div class="fb"></div></div>`;
      }
      return `<div class="q" data-type="input" data-i="${i}" data-answer="${esc(p.answer)}" data-normalize="${p.normalize ? "1" : "0"}">
      <div class="prompt">${i + 1}. ${esc(p.q)}</div>
      <div class="row"><input class="ans" type="text" autocomplete="off" placeholder="Your answer" />
      <button type="button" class="btn check">Check</button></div>
      <div class="hint">💡 ${esc(p.hint)}</div>
      <div class="fb"></div></div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="${esc(L.objective)}" />
<title>${esc(L.title)} · Unit 0 · Grade 6 Math</title>
<link rel="stylesheet" href="/assets/shared.css" />
<style>${PAGE_CSS}</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/math/unit-0/">← Unit 0 hub</a>
  <div class="hero">
    <span class="tag">${esc(L.standard)} · Unit 0</span>
    <h1>${L.emoji} ${esc(L.title)}</h1>
    <p><strong>Learning goal:</strong> ${esc(L.objective)}</p>
    <p><strong>Language goal:</strong> ${esc(L.languageObjective)}</p>
  </div>

  <div class="card">
    <h2>📚 Vocabulary</h2>
    <div class="vocab">
      ${L.vocab.map(([t, d]) => `<div><b>${esc(t)}:</b> ${esc(d)}</div>`).join("\n      ")}
    </div>
  </div>

  <div class="card">
    <h2>💡 Learn it</h2>
    ${L.teach.map((t) => `<p>${t}</p>`).join("\n    ")}
    <div class="ex">
      <strong>Worked example.</strong> ${esc(L.example.prompt)}
      <ol class="work">${L.example.work.map((w) => `<li>${w}</li>`).join("")}</ol>
    </div>
  </div>

  <div class="card">
    <h2>✏️ Practice</h2>
    <div class="score" id="score">Score: 0 / ${L.practice.length}</div>
    ${practiceHtml}
  </div>

  <div class="card">
    <h2>🗣️ Sentence frames (ESOL support)</h2>
    <div class="frames"><ul>
      <li>I know ___ because ___.</li>
      <li>First, I ___. Then, I ___.</li>
      <li>The answer is ___, so ___.</li>
    </ul></div>
  </div>

  <div class="card">
    <h2>🎟️ Exit ticket</h2>
    <p>${esc(L.exit)}</p>
    <textarea class="exit" id="exit" placeholder="Type your answer..."></textarea>
  </div>

  <div class="card">
    <h2>🧰 Lesson resources</h2>
    <div class="reslinks">
      <a href="./print.html">🖨️ Printable worksheet + key</a>
      <a href="./teacher.html">👩‍🏫 Teacher notes</a>
      <a href="./family.html">👪 Family page</a>
    </div>
  </div>

  <footer>Grade 6 Math · Unit 0 (holding area) · Standard ${esc(L.standard)}</footer>
</div>

<script>
(function(){
  var KEY = "unit0:${L.slug}";
  var total = ${L.practice.length};
  var solved = {};
  try { solved = JSON.parse(localStorage.getItem(KEY+":solved")||"{}"); } catch(e){ solved = {}; }
  var scoreEl = document.getElementById("score");
  function render(){
    var n = Object.keys(solved).filter(function(k){return solved[k];}).length;
    scoreEl.textContent = "Score: " + n + " / " + total;
  }
  function save(){ try{ localStorage.setItem(KEY+":solved", JSON.stringify(solved)); }catch(e){} }
  function norm(s){ return String(s).toLowerCase().replace(/\\s+/g,"").replace(/[，]/g,",").replace(/–|—|−/g,"-"); }
  function mark(q, ok){
    var i = q.getAttribute("data-i");
    var fb = q.querySelector(".fb");
    var hint = q.querySelector(".hint");
    if(ok){ fb.className="fb ok"; fb.textContent="✓ Correct!"; solved[i]=true; }
    else { fb.className="fb no"; fb.textContent="Not yet — check the hint and try again."; hint.classList.add("show"); }
    save(); render();
  }
  document.querySelectorAll('.q[data-type="mc"]').forEach(function(q){
    var ans = q.getAttribute("data-answer");
    q.querySelectorAll(".choices button").forEach(function(b){
      b.addEventListener("click", function(){
        q.querySelectorAll(".choices button").forEach(function(x){x.classList.remove("sel","right","wrong");});
        var ok = b.getAttribute("data-c") === ans;
        b.classList.add(ok?"right":"wrong","sel");
        mark(q, ok);
      });
    });
  });
  document.querySelectorAll('.q[data-type="input"]').forEach(function(q){
    var ans = q.getAttribute("data-answer");
    var doNorm = q.getAttribute("data-normalize")==="1";
    var inp = q.querySelector("input.ans");
    function check(){
      var v = inp.value.trim();
      if(!v) return;
      var ok = doNorm ? norm(v)===norm(ans) : norm(v)===norm(ans);
      inp.style.borderColor = ok ? "var(--ok)" : "var(--no)";
      mark(q, ok);
    }
    q.querySelector(".check").addEventListener("click", check);
    inp.addEventListener("keydown", function(e){ if(e.key==="Enter") check(); });
  });
  var exit = document.getElementById("exit");
  try { exit.value = localStorage.getItem(KEY+":exit")||""; } catch(e){}
  exit.addEventListener("input", function(){ try{ localStorage.setItem(KEY+":exit", exit.value); }catch(e){} });
  render();
})();
</script>
</body>
</html>
`;
}

function hubPage() {
  const cards = LESSONS.map(
    (L) => `    <a class="lcard" href="/math/unit-0/${L.slug}/">
      <span class="le">${L.emoji}</span>
      <span class="lt">${esc(L.title)}</span>
      <span class="ls">${esc(L.standard)}</span>
      <span class="lo">${esc(L.objective)}</span>
    </a>`,
  ).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="description" content="Unit 0 — Grade 6 math lessons for standards that previously had no lesson. A holding area to be sorted into the unit sequence later." />
<title>Unit 0 · Grade 6 Math</title>
<link rel="stylesheet" href="/assets/shared.css" />
<style>
  :root{--ink:#0f172a;--muted:#475569;--bg:#f8fafc;--accent:#0d9488;--accent2:#0ea5e9;--line:#e2e8f0}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg)}
  .wrap{max-width:920px;margin:0 auto;padding:24px}
  a.back{display:inline-block;margin-bottom:14px;color:var(--accent);text-decoration:none;font-weight:600}
  .hero{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;border-radius:20px;padding:30px 26px;box-shadow:0 12px 34px rgba(13,148,136,.25)}
  .hero h1{margin:.1em 0 .25em;font-size:clamp(24px,5vw,34px)}
  .hero p{margin:.3em 0;opacity:.96;max-width:60ch}
  .note{background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:12px 16px;margin:16px 0;color:#92400e;font-size:14px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-top:18px}
  a.lcard{display:flex;flex-direction:column;gap:6px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;text-decoration:none;color:var(--ink);box-shadow:0 2px 10px rgba(15,23,42,.04);transition:.15s}
  a.lcard:hover{transform:translateY(-2px);border-color:var(--accent);box-shadow:0 8px 22px rgba(13,148,136,.16)}
  .le{font-size:26px}
  .lt{font-weight:700;font-size:16px}
  .ls{display:inline-block;width:fit-content;background:#f0fdfa;color:var(--accent);border-radius:999px;padding:2px 10px;font-size:12px;font-weight:700}
  .lo{color:var(--muted);font-size:13px}
  footer{color:var(--muted);font-size:13px;text-align:center;margin:26px 0}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/math/">← Math hub</a>
  <div class="hero">
    <h1>🧭 Unit 0 — Standards Catch-Up</h1>
    <p>Lessons for Grade 6 math standards that previously had no lesson anywhere on the site. This is a holding area — these lessons will be sorted into the regular unit sequence later.</p>
  </div>
  <div class="note">⚠️ Standard codes shown use the current taxonomy. They will be re-coded when the revised 2025 Maryland MCCRS Grade 6 standards are finalized in the curriculum.</div>
  <div class="grid">
${cards}
  </div>
  <footer>Grade 6 Math · Unit 0 · ${LESSONS.length} lessons</footer>
</div>
</body>
</html>
`;
}

// --- write everything ---
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), hubPage());
let count = 0;
for (const L of LESSONS) {
  const dir = join(outDir, L.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), lessonPage(L));
  writeFileSync(join(dir, "print.html"), printPage(L));
  writeFileSync(join(dir, "teacher.html"), teacherPage(L));
  writeFileSync(join(dir, "family.html"), familyPage(L));
  count++;
}
console.log(`Unit 0: wrote hub + ${count} lessons to math/unit-0/`);
for (const L of LESSONS) console.log(`  ${L.standard}  →  /math/unit-0/${L.slug}/`);
