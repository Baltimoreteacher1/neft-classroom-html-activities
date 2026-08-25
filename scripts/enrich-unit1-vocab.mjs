#!/usr/bin/env node
// enrich-unit1-vocab.mjs — give Unit 1's vocabulary the same scaffolding every
// other unit has.
//
//   node scripts/enrich-unit1-vocab.mjs [--dry-run]
//
// WHY
//
// Unit 1 teaches disposition words — "persevere", "conjecture", "quantity" —
// and it shipped with a bare definition and nothing else: 0 of its 30 terms had
// a `visual`, a `cloze`, or an `examples` pair, while Units 2–8 carry a `visual`
// on essentially every term (75/75 in Unit 2, 96/96 in Unit 6). A word wall card
// for an abstract word with no worked example on it is the hardest card in the
// curriculum to learn from, and Unit 1 is the first week of school.
//
// Each entry below adds:
//   visual   — one concrete instance the student can picture, in the lesson's
//              own context (the tram, the Ferris wheel, the coin jar)
//   cloze    — a fill-in that forces recall of the word, not recognition
//   examples — an is / is-not pair with the reason, which is what separates
//              "I have seen this word" from "I can use it"
//
// Runs over the Unit 1 base lessons AND their small-group / catch-up variants,
// which hold verbatim clones of the same vocabulary, so all three stay in step.
// Idempotent: a field already present is never overwritten.

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const LESSONS = "lessons";
const UNIT_1 = /^1-\d(?:-(?:group1|group2|catchup))?$/;

/** term (lower-cased) → fields to fill in. */
const ENRICHMENT = {
  // ── 1-1 Math is Mine ────────────────────────────────────────────────────
  "doer of math": {
    visual: "Splitting a bill 4 ways at dinner — that is a doer of math.",
    cloze: "Anyone who uses mathematical thinking is a ___ ___ ___.",
    examples: [
      {
        text: "Working out you need to leave at 7:40 to catch the 7:55 bus",
        isExample: true,
        why: "You used numbers and reasoning to make a decision.",
      },
      {
        text: "Only people who finish a worksheet first",
        isExample: false,
        why: "Speed is not what makes someone a doer of math.",
      },
    ],
  },
  "math story": {
    visual: "“In 3rd grade I hated fractions; this year I can explain them.”",
    cloze: "Your history with mathematics — what you have done and felt — is your ___ ___.",
    examples: [
      {
        text: "“Math felt scary until I learned to draw the problem.”",
        isExample: true,
        why: "It describes how your thinking changed over time.",
      },
      {
        text: "“I got an 85 on the last test.”",
        isExample: false,
        why: "One score is a moment, not the story of your thinking.",
      },
    ],
  },
  strength: {
    visual: "“I am good at mental math with money” — a strength you can teach.",
    cloze: "Something you already do well and can share with others is a ___.",
    examples: [
      {
        text: "Explaining your steps so a partner can follow them",
        isExample: true,
        why: "It is something you do well that helps the group.",
      },
      {
        text: "Something you are still learning to do",
        isExample: false,
        why: "That is a goal, not yet a strength.",
      },
    ],
  },
  decompose: {
    visual: "78.5 = 70 + 8.5, and also 157 ÷ 2 — both rebuild the same number.",
    cloze: "To break a number into parts that rebuild it exactly is to ___ it.",
    examples: [
      {
        text: "105.76 = 100 + 5.76",
        isExample: true,
        why: "The parts add back to exactly the original number.",
      },
      {
        text: "105.76 = 100 + 5",
        isExample: false,
        why: "The parts do not rebuild the number — 0.76 went missing.",
      },
    ],
  },
  estimate: {
    visual: "20 cars × about 4 riders ≈ 80 people on the Ferris wheel.",
    cloze: "A reasoned answer that is close enough to be useful is an ___.",
    examples: [
      {
        text: "“About 80 riders” when the true count is 78",
        isExample: true,
        why: "Close enough to plan with, and it took no counting.",
      },
      {
        text: "Any number you say without thinking",
        isExample: false,
        why: "An estimate is reasoned, not random.",
      },
    ],
  },

  // ── 1-2 Math is Exploring and Thinking ──────────────────────────────────
  quantity: {
    visual: "540 meters — the number 540 AND what it measures.",
    cloze: "A number with a meaning attached, like 540 meters, is a ___.",
    examples: [
      { text: "12 tram rides", isExample: true, why: "A number together with what it counts." },
      {
        text: "Just the number 12",
        isExample: false,
        why: "Without a unit or a meaning it is only a number.",
      },
    ],
  },
  relationship: {
    visual: "1 hour → 48 km, 2 hours → 96 km: as one grows, so does the other.",
    cloze: "How two quantities connect or change together is a ___.",
    examples: [
      {
        text: "Hours studied and quiz score",
        isExample: true,
        why: "One quantity responds when the other changes.",
      },
      {
        text: "A student's height and their house number",
        isExample: false,
        why: "Neither one moves because of the other.",
      },
    ],
  },
  strategy: {
    visual: "“I will draw a tape diagram first, then divide” — chosen before computing.",
    cloze: "The plan you choose before you start computing is your ___.",
    examples: [
      {
        text: "Deciding to use compatible numbers to estimate first",
        isExample: true,
        why: "It is a plan chosen before doing the arithmetic.",
      },
      {
        text: "The answer you got",
        isExample: false,
        why: "The answer is the result, not the plan that produced it.",
      },
    ],
  },
  reasonable: {
    visual: "5/6 of 540 must be under 540, so 450 is reasonable and 650 is not.",
    cloze: "An answer that makes sense in the story of the problem is ___.",
    examples: [
      {
        text: "41.7 cars rounded up to 42 cars",
        isExample: true,
        why: "You cannot wash part of a car, so the whole number fits the story.",
      },
      {
        text: "A discount that makes the sweater cost more",
        isExample: false,
        why: "It contradicts the situation, so it cannot be right.",
      },
    ],
  },
  persevere: {
    visual: "Stuck on the tram problem → try a tape diagram instead → keep going.",
    cloze: "To keep working and change your plan when you get stuck is to ___.",
    examples: [
      {
        text: "Noticing your strategy stalled and trying a different one",
        isExample: true,
        why: "You kept going and adjusted instead of stopping.",
      },
      {
        text: "Erasing everything and deciding the problem is impossible",
        isExample: false,
        why: "Giving up is the opposite of persevering.",
      },
    ],
  },

  // ── 1-3 Math is In My World ─────────────────────────────────────────────
  representation: {
    visual: "The same 12 shown three ways: a tape diagram, a table, and 3 × 4.",
    cloze: "A drawing, table, or equation that shows the math in a situation is a ___.",
    examples: [
      {
        text: "A table pairing rides with minutes",
        isExample: true,
        why: "It shows the mathematics of the situation in an organized form.",
      },
      {
        text: "A drawing of the tram because it looks nice",
        isExample: false,
        why: "A picture that carries no quantities shows no mathematics.",
      },
    ],
  },
  "tape diagram": {
    visual: "One bar of 4,000 passengers cut into equal groups of 80.",
    cloze: "A rectangle cut into equal parts that shows how a total breaks apart is a ___ ___.",
    examples: [
      {
        text: "A bar split into 5 equal parts to share $53.50",
        isExample: true,
        why: "The bar is the total and the parts are equal shares.",
      },
      {
        text: "A bar with parts of different sizes and no labels",
        isExample: false,
        why: "Without equal, labelled parts it does not model the total.",
      },
    ],
  },
  tool: {
    visual: "A table, a number line, or a tape diagram — whichever shows the relationship.",
    cloze: "Anything you choose to help you see relationships and solve is a ___.",
    examples: [
      {
        text: "Choosing a table because you need to see every step",
        isExample: true,
        why: "You picked it on purpose to reveal the mathematics.",
      },
      {
        text: "A calculator used before you know what to compute",
        isExample: false,
        why: "A tool helps you think; it cannot decide what the problem asks.",
      },
    ],
  },
  "ordered pair": {
    visual: "(4, 60): 4 hours costs $60 — the hours always come first.",
    cloze: "Two numbers that go together and can be plotted as a point are an ___ ___.",
    examples: [
      {
        text: "(2, 90) for 2 tickets at $45",
        isExample: true,
        why: "Two matched values, in order.",
      },
      {
        text: "(90, 2) for 2 tickets at $45",
        isExample: false,
        why: "The order is reversed, so the point lands somewhere else.",
      },
    ],
  },
  "round trip": {
    visual: "5 miles out plus 5 miles back = 10 miles in all.",
    cloze: "A journey out to a place and all the way back is a ___ ___.",
    examples: [
      {
        text: "The tram car going up the mountain and back down",
        isExample: true,
        why: "It ends where it started, so both legs count.",
      },
      {
        text: "Riding the tram to the top and staying there",
        isExample: false,
        why: "Only half the journey has happened.",
      },
    ],
  },

  // ── 1-4 Math is Explaining and Sharing ──────────────────────────────────
  argument: {
    visual: "“Two jumbo boxes hold more, because 400 × 2 = 800 > 720.”",
    cloze: "A chain of reasons used to defend your thinking is an ___.",
    examples: [
      {
        text: "A claim followed by the computation that supports it",
        isExample: true,
        why: "The reasons are attached to the claim.",
      },
      {
        text: "“Because I said so.”",
        isExample: false,
        why: "A claim with no reasons behind it convinces nobody.",
      },
    ],
  },
  conjecture: {
    visual: "“A bigger box ALWAYS holds more cereal” — believed, not yet proven.",
    cloze: "A statement you believe is true but have not yet proven is a ___.",
    examples: [
      {
        text: "“I think the two jumbo boxes hold more cereal.”",
        isExample: true,
        why: "It is a checkable claim that still needs an argument.",
      },
      {
        text: "“Volume is measured in cubic units.”",
        isExample: false,
        why: "That is a definition already established, not a claim to test.",
      },
    ],
  },
  counterexample: {
    visual: "One jumbo box sold half full of air breaks “bigger always holds more”.",
    cloze: "A single case that shows a statement is not always true is a ___.",
    examples: [
      {
        text: "A larger box holding less cereal than a smaller one",
        isExample: true,
        why: "One case is enough to make the ALWAYS claim false.",
      },
      {
        text: "Another box that fits the claim",
        isExample: false,
        why: "Agreeing examples never disprove a statement.",
      },
    ],
  },
  volume: {
    visual: "8 in × 3 in × 10 in = 240 cubic inches of cereal space.",
    cloze: "The amount of space a solid figure takes up, in cubic units, is its ___.",
    examples: [
      {
        text: "How much soil fills a 4 ft × 2 ft × 1 ft planter",
        isExample: true,
        why: "It measures the space inside, in cubic units.",
      },
      {
        text: "How much wrapping paper covers the box",
        isExample: false,
        why: "That is surface area — the outside, not the inside.",
      },
    ],
  },
  "cubic unit": {
    visual: "One cube, 1 unit on every edge — the block volume is counted in.",
    cloze: "A cube with edges 1 unit long, used to measure volume, is a ___ ___.",
    examples: [
      { text: "1 cubic foot of soil", isExample: true, why: "A cube 1 foot on each edge." },
      {
        text: "1 square foot of floor",
        isExample: false,
        why: "A square unit covers flat space; it has no depth.",
      },
    ],
  },

  // ── 1-5 Math is Finding Patterns ────────────────────────────────────────
  pattern: {
    visual: "1, 3, 7, 15, 31 — each tower's steps follow a predictable jump.",
    cloze: "Something that repeats or changes in a predictable way is a ___.",
    examples: [
      { text: "18, 20, 22, 24 …", isExample: true, why: "The change is the same every step." },
      {
        text: "18, 25, 19, 44 …",
        isExample: false,
        why: "Nothing lets you predict the next number.",
      },
    ],
  },
  "pattern rule": {
    visual: "2, 4, 6, 8 … the rule is “+ 2 every time”.",
    cloze: "The instruction for getting from one term to the next is the ___ ___.",
    examples: [
      {
        text: "“Double the steps and add 1”",
        isExample: true,
        why: "It tells you how to reach the next term from this one.",
      },
      {
        text: "“The numbers get bigger”",
        isExample: false,
        why: "True, but it does not tell you the next value.",
      },
    ],
  },
  generalization: {
    visual: "1 → 3, 2 → 5, 3 → 7 … so n → 2n + 1, for ANY n.",
    cloze: "A statement true for a whole pattern, not just the cases you tried, is a ___.",
    examples: [
      {
        text: "“Any tower of n discs takes 2ⁿ − 1 steps.”",
        isExample: true,
        why: "It covers every case, including ones you never played.",
      },
      {
        text: "“A three-disc tower takes 7 steps.”",
        isExample: false,
        why: "That is one case, not a rule for all of them.",
      },
    ],
  },
  "table of values": {
    visual: "discs 1, 2, 3 beside steps 1, 3, 7 — one row per step.",
    cloze: "A table listing each step of a pattern in order is a ___ ___ ___.",
    examples: [
      {
        text: "Hours in one column and kilometers in the other",
        isExample: true,
        why: "Each row pairs the two quantities at the same step.",
      },
      {
        text: "A list of answers with no labels",
        isExample: false,
        why: "Without the paired quantities you cannot check the pattern.",
      },
    ],
  },
  reasonableness: {
    visual: "5/6 of 540 should land BELOW 540, so 650 fails the check.",
    cloze: "Whether an answer makes sense, checked as you work, is its ___.",
    examples: [
      {
        text: "Noticing 650 cannot be 5/6 of 540 and going back",
        isExample: true,
        why: "You checked the answer against the situation and adjusted.",
      },
      {
        text: "Accepting the answer because the arithmetic looked neat",
        isExample: false,
        why: "Neat arithmetic can still answer the wrong question.",
      },
    ],
  },

  // ── 1-6 Math is Ours ────────────────────────────────────────────────────
  "make sense of a problem": {
    visual: "KNOW: 16 wheels, 6 times as many. DON'T KNOW: how many bikes.",
    cloze: "To work out what a problem asks — what you know and don't — is to ___ ___ ___ ___ ___.",
    examples: [
      {
        text: "Listing what you know and what is missing before computing",
        isExample: true,
        why: "You understood the problem before solving it.",
      },
      {
        text: "Grabbing the two numbers and multiplying",
        isExample: false,
        why: "Computing before understanding is how the wrong operation gets chosen.",
      },
    ],
  },
  critique: {
    visual: "“That step assumes the boxes are full — how do we know?”",
    cloze: "To examine an idea and say what is or is not convincing is to ___ it.",
    examples: [
      {
        text: "“Your reasoning works until step 3, and here is why.”",
        isExample: true,
        why: "It examines the idea and gives a reason.",
      },
      {
        text: "“That's wrong.”",
        isExample: false,
        why: "No reason is given, so nobody learns anything from it.",
      },
    ],
  },
  "community agreement": {
    visual: "“We take turns sharing, and we critique ideas, not people.”",
    cloze: "A rule the whole class agrees to so everyone can learn is a ___ ___.",
    examples: [
      {
        text: "“Ask for help quietly so others can keep thinking.”",
        isExample: true,
        why: "The whole class agreed to it and it protects everyone's learning.",
      },
      {
        text: "“Whoever finishes first answers.”",
        isExample: false,
        why: "It silences the rest of the community instead of including it.",
      },
    ],
  },
};

/* The one image pinned anywhere in Unit 1 pointed `reasonableness` at
   estimate.svg — a different word's picture. It now has its own tile, so the
   override is cleared and the resolver finds the right one. */
const CLEAR_IMAGE = new Set(["reasonableness"]);

const lessons = readdirSync(LESSONS)
  .filter((name) => UNIT_1.test(name))
  .sort();

let fields = 0;
let files = 0;
const seen = new Set();

for (const lesson of lessons) {
  const file = join(LESSONS, lesson, "config.json");
  let config;
  try {
    config = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    continue;
  }
  let changed = 0;
  for (const entry of config.vocabulary || []) {
    const key = String(entry.term || "").toLowerCase();
    const add = ENRICHMENT[key];
    if (!add) continue;
    seen.add(key);
    for (const [field, value] of Object.entries(add)) {
      if (entry[field]) continue;
      entry[field] = value;
      changed++;
    }
    if (CLEAR_IMAGE.has(key) && entry.image) {
      delete entry.image;
      changed++;
    }
  }
  if (!changed) continue;
  fields += changed;
  files++;
  if (!DRY) writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
}

const unused = Object.keys(ENRICHMENT).filter((term) => !seen.has(term));
if (unused.length) {
  console.error(`terms authored here but not found in any Unit 1 lesson: ${unused.join(", ")}`);
  process.exit(1);
}
console.log(
  `${DRY ? "[dry-run] " : ""}unit 1 vocabulary: ${fields} field(s) added across ${files} config(s)`,
);
