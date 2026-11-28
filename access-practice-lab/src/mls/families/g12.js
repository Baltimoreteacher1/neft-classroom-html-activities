// Math Literacy Studio: problem families for grades 1-2 (docs/math-literacy/architecture.md).
// Every generator is seeded (uses only the rng it is given), ends with kit.finalize, and is re-solved independently by
// tools/mls-verify/g12.mjs from `spec` alone. `opts.level` (1-3) is mathematical complexity inside the grade; `opts.ctx` a kit context id.
//
// Params honoured (everything else is ignored):
//   count     max (largest number shown, default 20)
//   numrel    max (largest number reached, default 100)
//   addsub    max (largest number in any problem), op "mix"|"add"|"sub", regroup (every problem needs a carry or a borrow),
//             story (word problems over all 13 structures), steps (2 = two-step stories only)
//   tensones  max (largest number, default 99)
//   compare   max (largest number, default 100), order (also order three numbers least to greatest)
//   equality  max (largest number, default 20)
//   length    mode "units" (grade 1: compare lengths, count units on a ruler) | "estimate" (grade 2: read a ruler, estimate, differences)
//   clock     step (30 = hour and half hour, 5 = to five minutes)
//   shapes    none
//   maketen   none
//   expanded  max (largest number, default 999)
//   groups    max (largest factor), array (true = arrays with the array visual and division facts)
//   money     none
//   bargraph  picture (true = picture graph, false = bar graph)
//   partition none
import { MINUS, TIMES, DIVIDE, NAMES, twoNames, thing, count, num, finalize } from "../kit.js";

export const FAMILIES = {};

// ---------------------------------------------------------------------------------------------------- shared helpers
const T = (plain, standard, rich) => ({ plain, standard, rich });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const uniq = (arr) => [...new Set(arr)];

/** Number distractors: candidates {v, m} in priority order, then close guesses; only whole numbers in [lo, hi], never the answer. */
function numDists(ans, cands, { fmt = (v) => String(v), lo = 0, hi = 9999, want = 4 } = {}) {
  const seen = new Set([ans]);
  const out = [];
  const add = (v, m) => {
    if (!Number.isFinite(v) || !Number.isInteger(v) || v < lo || v > hi || seen.has(v)) return;
    seen.add(v);
    out.push({ text: fmt(v), misconception: m });
  };
  for (const c of cands) add(c.v, c.m);
  for (const [d, m] of [[1, "off-by-one"], [-1, "off-by-one"], [2, "counted-two-too-far"], [-2, "counted-two-too-few"], [3, "close-guess"], [-3, "close-guess"], [10, "tens-slip"], [-10, "tens-slip"]]) {
    if (out.length >= want) break;
    add(ans + d, m);
  }
  return out.slice(0, want);
}
/** Text distractors: candidates {text, m}; unique, never the answer. */
function textDists(ansText, cands, want = 4) {
  const seen = new Set([String(ansText).trim().toLowerCase()]);
  const out = [];
  for (const c of cands) {
    const k = String(c.text).trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ text: c.text, misconception: c.m });
    if (out.length >= want) break;
  }
  return out;
}
const tw = (t) => `${t} ${t === 1 ? "ten" : "tens"}`;
const hw = (h) => `${h} ${h === 1 ? "hundred" : "hundreds"}`;
const ow = (o) => `${o} ${o === 1 ? "one" : "ones"}`;
const bad = (cond, msg) => (cond ? msg : null);

// ------------------------------------------------------------------------------------------------------------- count
FAMILIES.count = {
  title: "Count and tell how many",
  grades: [1],
  defaults: { max: 20 },
  gen(rng, params, { level = 1, ctx = "store" } = {}) {
    const max = params.max;
    const lim = level === 1 ? Math.min(10, max) : level === 2 ? Math.min(15, max) : max;
    const modes = level === 1 ? ["show", "show", "seq"] : level === 2 ? ["show", "frames", "seq", "seq"] : ["frames", "seq", "seq", "show"];
    const mode = rng.pick(modes);
    if (mode === "show") {
      const n = rng.int(level === 1 ? 3 : 5, lim);
      const useFrame = n <= 10 && rng.chance(0.5);
      const visual = useFrame
        ? { kind: "tenframe", alt: "A ten frame with some dots. Count the dots.", n, frames: 1 }
        : { kind: "counters", alt: "Counters in rows. Count the counters.", n, perRow: level === 1 ? 5 : 10, shape: "circle" };
      const w = useFrame ? "dots" : "counters";
      return finalize({
        family: "count",
        spec: { mode: "show", n, picture: useFrame ? "tenframe" : "counters" },
        stem: T(`Look at the ${w}.`, `Look at the ${w} in the picture.`, `Examine the ${w} shown in the picture.`),
        ask: T(`How many ${w}?`, `How many ${w} are there?`, `Count carefully. How many ${w} are there?`),
        expr: null,
        answer: { value: String(n), text: String(n), kind: "int" },
        work: [`Touch each one once as you count.`, `The last number you say is ${n}.`],
        visual,
        distractors: numDists(n, [{ v: n - 1, m: "skipped-one-while-counting" }, { v: n + 1, m: "counted-one-twice" }, { v: Math.max(1, n - 3), m: "stopped-counting-early" }], { lo: 1, hi: max }),
        hints: { conceptual: "Each object is counted exactly one time.", procedural: "Touch each one as you say a number. Move across one row at a time." },
        level,
      });
    }
    if (mode === "frames") {
      const n = rng.int(level === 2 ? 11 : 11, Math.max(11, lim));
      const full = 1;
      const extra = n - 10;
      return finalize({
        family: "count",
        spec: { mode: "frames", full, extra },
        stem: T("Look at the ten frames.", "Look at the ten frames. They show dots.", "The ten frames in the picture show dots."),
        ask: T("How many dots?", "How many dots are there?", "How many dots are there in total?"),
        expr: null,
        answer: { value: String(n), text: String(n), kind: "int" },
        work: [`One frame is full. A full frame has 10 dots.`, `The other frame has ${extra} dots.`, `10 + ${extra} = ${n}`],
        visual: { kind: "tenframe", alt: "Two ten frames. The first frame is full. The second frame has some dots.", n, frames: 2 },
        distractors: numDists(n, [{ v: 10, m: "counted-only-the-full-frame" }, { v: extra, m: "counted-only-the-second-frame" }, { v: n - 1, m: "skipped-one-while-counting" }, { v: n + 1, m: "counted-one-twice" }], { lo: 1, hi: max }),
        hints: { conceptual: "A full ten frame is a group of ten.", procedural: "Start from 10 for the full frame. Then count on the dots in the other frame." },
        level,
      });
    }
    // seq: counting on, back, or by 2s / 5s / 10s
    let step = 1;
    let dir = 1;
    if (level === 2) {
      const r = rng.pick(["on", "back", "two"]);
      if (r === "back") dir = -1;
      if (r === "two") step = 2;
    } else if (level === 3) {
      const r = rng.pick(["back", "two", "five", "ten"]);
      if (r === "back") dir = -1;
      if (r === "two") step = 2;
      if (r === "five") step = 5;
      if (r === "ten") step = 10;
    }
    if (step * 3 > max) step = Math.max(1, Math.min(step, 2));
    const len = 4;
    let from;
    if (dir > 0) from = step === 1 ? rng.int(max > 12 && level > 1 ? 2 : 1, Math.max(1, lim - 3)) : step * rng.int(1, Math.max(1, Math.floor((max - step * 3) / step)));
    else from = rng.int(Math.min(max, 5 + 3), lim);
    if (dir < 0 && from - 3 < 0) from = 4;
    const blank = rng.int(1, len - 1);
    const vals = Array.from({ length: len }, (_, i) => from + dir * step * i);
    const shown = vals.map((v, i) => (i === blank ? "__" : String(v))).join(", ");
    const ans = vals[blank];
    const lead = dir < 0 ? "Count back" : step > 1 ? `Count by ${step}s` : "Count on";
    const prev = vals[blank - 1];
    return finalize({
      family: "count",
      spec: { mode: "seq", from, step, dir, len, blank },
      stem: T(`${lead}: ${shown}.`, `${lead}: ${shown}.`, `${lead} to finish the pattern: ${shown}.`),
      ask: T("What number is missing?", "What number goes in the blank?", "Which number is missing from the counting pattern?"),
      expr: null,
      answer: { value: String(ans), text: String(ans), kind: "int" },
      work: [`Each number is ${step} ${dir > 0 ? "more" : "less"} than the number before it.`, dir > 0 ? `${prev} + ${step} = ${ans}` : `${prev} ${MINUS} ${step} = ${ans}`],
      visual: null,
      distractors: numDists(ans, [{ v: prev, m: "repeated-the-number-before" }, { v: ans + dir * step, m: "skipped-ahead" }, { v: step > 1 ? ans + dir : ans - dir, m: step > 1 ? "counted-by-ones-instead" : "went-the-wrong-direction" }], { lo: 0, hi: max }),
      hints: { conceptual: "Counting patterns change by the same amount each time.", procedural: `Say the numbers in order. Find how much each number changes by, then use it on the number before the blank.` },
      level,
    });
  },
  check(p, params) {
    const max = params.max ?? 20;
    const s = p.spec;
    if (s.mode === "show" && s.n > max) return `n ${s.n} above max ${max}`;
    if (s.mode === "frames" && s.full * 10 + s.extra > max) return `frames total above max ${max}`;
    if (s.mode === "seq") {
      const last = s.from + s.dir * s.step * (s.len - 1);
      if (Math.max(s.from, last) > max || Math.min(s.from, last) < 0) return `sequence leaves 0..${max}`;
    }
    return null;
  },
};

// ------------------------------------------------------------------------------------------------------------ numrel
FAMILIES.numrel = {
  title: "Number relationships: one more, ten more",
  grades: [1],
  defaults: { max: 100 },
  gen(rng, params, { level = 1, ctx = "store" } = {}) {
    const max = params.max;
    const D = { "+1": 1, "-1": -1, "+10": 10, "-10": -10 };
    let steps;
    let n;
    if (level === 3) {
      const first = rng.pick(["+10", "-10"]);
      const second = rng.pick(["+1", "-1"]);
      steps = rng.chance(0.5) ? [first, second] : [second, first];
      n = rng.int(12, max - 11);
    } else {
      steps = [rng.pick(["+1", "-1", "+10", "-10"])];
      const d = D[steps[0]];
      const hi = level === 1 ? Math.min(max, 50) : max;
      n = d > 0 ? rng.int(1, hi - d) : rng.int(-d + 1, hi);
    }
    const ans = n + sum(steps.map((s) => D[s]));
    const words = (s) => ({ "+1": "1 more than", "-1": "1 less than", "+10": "10 more than", "-10": "10 less than" })[s];
    const pv = ans > 0 || n > 0 ? { tens: Math.floor(n / 10) % 10, ones: n % 10, hundreds: Math.floor(n / 100) } : null;
    const visual = level === 1 ? { kind: "placevalue", alt: `Place value blocks that show a number to start from.`, hundreds: pv.hundreds, tens: pv.tens, ones: pv.ones } : null;
    let stem;
    let ask;
    let expr;
    if (steps.length === 1) {
      const w = words(steps[0]);
      stem = visual ? T("The blocks show a number.", "The blocks show a number. Think about the number.", "The blocks represent a number.") : "";
      const tail = visual ? "that number" : num(n);
      ask = T(`What is ${w} ${tail}?`, `What is ${w} ${tail}?`, `Find the number that is ${w} ${tail}.`);
      if (visual) {
        // keep numerals identical when the number comes from the picture: state it in words only through the picture
        stem = T(`The blocks show ${num(n)}.`, `The blocks show the number ${num(n)}.`, `The blocks represent the number ${num(n)}.`);
        ask = T(`What is ${w} ${num(n)}?`, `What is ${w} ${num(n)}?`, `Find the number that is ${w} ${num(n)}.`);
      }
      expr = `${n} ${D[steps[0]] > 0 ? "+" : MINUS} ${Math.abs(D[steps[0]])}`;
    } else {
      const [s1, s2] = steps;
      stem = T(`Start at ${num(n)}.`, `Start at ${num(n)} on the number path.`, `Begin at ${num(n)}.`);
      const act = (s) => `go ${Math.abs(D[s])} ${D[s] > 0 ? "more" : "less"}`;
      ask = T(`Then ${act(s1)}. Then ${act(s2)}. What number do you reach?`, `First ${act(s1)}, and then ${act(s2)}. What number do you reach?`, `First ${act(s1)}, then ${act(s2)}. Which number do you reach at the end?`);
      expr = `${n} ${D[s1] > 0 ? "+" : MINUS} ${Math.abs(D[s1])} ${D[s2] > 0 ? "+" : MINUS} ${Math.abs(D[s2])}`;
    }
    const work = [];
    let cur = n;
    for (const s of steps) {
      const d = D[s];
      const nx = cur + d;
      if (Math.abs(d) === 10) work.push(`${d > 0 ? "10 more" : "10 less"} changes the tens digit. ${cur} ${d > 0 ? "+" : MINUS} 10 = ${nx}`);
      else work.push(`${d > 0 ? "1 more" : "1 less"} changes the ones digit. ${cur} ${d > 0 ? "+" : MINUS} 1 = ${nx}`);
      cur = nx;
    }
    const last = D[steps[steps.length - 1]];
    const cands = [];
    if (steps.length === 1) {
      const d = last;
      if (Math.abs(d) === 10) cands.push({ v: n + (d > 0 ? 1 : -1), m: "changed-the-ones-digit" }, { v: n - d, m: "went-the-wrong-direction" }, { v: n + d * 2, m: "moved-ten-twice" });
      else cands.push({ v: n + 10 * Math.sign(d), m: "changed-the-tens-digit" }, { v: n - d, m: "went-the-wrong-direction" }, { v: n + d * 2, m: "moved-two-steps" });
    } else {
      const [s1, s2] = steps.map((s) => D[s]);
      cands.push({ v: n + s1, m: "stopped-after-the-first-step" }, { v: n + s2, m: "skipped-the-first-step" }, { v: n - s1 + s2, m: "went-the-wrong-direction" }, { v: n + s1 - s2, m: "went-the-wrong-direction" });
    }
    return finalize({
      family: "numrel",
      spec: { n, steps },
      stem,
      ask,
      expr,
      answer: { value: String(ans), text: String(ans), kind: "int" },
      work,
      visual,
      distractors: numDists(ans, cands, { lo: 0, hi: max }),
      hints: { conceptual: "Ten more changes the tens place. One more changes the ones place.", procedural: "Look at the digits. Decide which digit changes, then say the new number." },
      level,
    });
  },
  check(p, params) {
    const max = params.max ?? 100;
    const s = p.spec;
    const D = { "+1": 1, "-1": -1, "+10": 10, "-10": -10 };
    let cur = s.n;
    for (const st of s.steps) {
      cur += D[st];
      if (cur < 0 || cur > max) return `value ${cur} outside 0..${max}`;
    }
    return s.n > max ? "start above max" : null;
  },
};

// ---------------------------------------------------------------------------------------------------------- tensones
FAMILIES.tensones = {
  title: "Tens and ones",
  grades: [1],
  defaults: { max: 99 },
  gen(rng, params, { level = 1 } = {}) {
    const max = params.max;
    const hi = level === 1 ? Math.min(max, 50) : max;
    const modes = level === 1 ? ["blocks", "build", "tens-of"] : level === 2 ? ["blocks", "build", "tens-of", "ones-of"] : ["regroup", "build", "blocks", "regroup"];
    const mode = rng.pick(modes);
    const mkN = () => rng.int(11, hi);
    if (mode === "blocks" || mode === "build") {
      const n = mkN();
      const tens = Math.floor(n / 10);
      const ones = n % 10;
      const visual = mode === "blocks" ? { kind: "placevalue", alt: "Place value blocks: rods of ten and single cubes.", tens, ones } : null;
      const stem = mode === "blocks" ? T("The picture shows tens and ones.", "The picture shows rods of ten and single cubes.", "The picture shows ten-rods and unit cubes.") : T(`A number has ${tw(tens)} and ${ow(ones)}.`, `A number has ${tw(tens)} and ${ow(ones)}.`, `A number is made of ${tw(tens)} and ${ow(ones)}.`);
      const swapped = ones * 10 + tens;
      return finalize({
        family: "tensones",
        spec: { mode: "total", tens, ones },
        stem,
        ask: T("What is the number?", "What number is it?", "What number does this represent?"),
        expr: null,
        answer: { value: String(n), text: String(n), kind: "int" },
        work: [`${tw(tens)} is ${tens * 10}.`, `${tens * 10} + ${ones} = ${n}`],
        visual,
        distractors: numDists(n, [{ v: swapped, m: "swapped-tens-and-ones" }, { v: tens + ones, m: "added-the-digits" }, { v: tens * 10, m: "forgot-the-ones" }, { v: ones * 10 + tens + 0 === n ? n + 11 : n + 10, m: "counted-an-extra-ten" }], { lo: 1, hi: 200 }),
        hints: { conceptual: "A ten is a group of ten ones. Tens go first, then ones.", procedural: "Count the tens by tens, then count on the ones." },
        level,
      });
    }
    if (mode === "tens-of" || mode === "ones-of") {
      const n = mkN();
      const ask1 = mode === "tens-of" ? "tens" : "ones";
      const ans = mode === "tens-of" ? Math.floor(n / 10) : n % 10;
      return finalize({
        family: "tensones",
        spec: { mode, n },
        stem: "",
        ask: T(`How many ${ask1} are in ${n}?`, `How many ${ask1} are in the number ${n}?`, `How many ${ask1} does the number ${n} have?`),
        expr: null,
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: [mode === "tens-of" ? `The tens digit of ${n} is ${ans}, so there are ${tw(ans)}.` : `The ones digit of ${n} is ${ans}, so there are ${ow(ans)}.`],
        visual: level === 1 ? { kind: "placevalue", alt: `Blocks that show ${n}: rods of ten and single cubes.`, tens: Math.floor(n / 10), ones: n % 10 } : null,
        distractors: numDists(ans, [{ v: mode === "tens-of" ? n % 10 : Math.floor(n / 10), m: "mixed-up-tens-and-ones" }, { v: n, m: "said-the-whole-number" }, { v: Math.floor(n / 10) + (n % 10), m: "added-the-digits" }, { v: mode === "tens-of" ? Math.floor(n / 10) * 10 : n - (n % 10), m: "said-the-value-not-the-count" }], { lo: 0, hi: 200 }),
        hints: { conceptual: "In a two-digit number the left digit counts tens and the right digit counts ones.", procedural: "Look at each digit. Say which place it is in." },
        level,
      });
    }
    // regroup: n is T tens and ? ones (more ones than 9)
    const n = rng.int(21, hi);
    const maxTens = Math.floor(n / 10);
    const tens = rng.int(Math.max(1, maxTens - 3), maxTens - 1);
    const ones = n - tens * 10;
    return finalize({
      family: "tensones",
      spec: { mode: "regroup", n, tens },
      stem: "",
      ask: T(`${n} is ${tw(tens)} and how many ones?`, `${n} is ${tw(tens)} and how many ones?`, `Show ${n} as ${tw(tens)} and some ones. How many ones?`),
      expr: null,
      answer: { value: String(ones), text: String(ones), kind: "int" },
      work: [`${tw(tens)} is ${tens * 10}.`, `${n} ${MINUS} ${tens * 10} = ${ones}`, `So there are ${ones} ones left over.`],
      visual: null,
      distractors: numDists(ones, [{ v: n % 10, m: "used-the-ones-digit-only" }, { v: Math.floor(n / 10) - tens, m: "compared-tens-digits" }, { v: n - tens, m: "subtracted-tens-count" }, { v: ones - 10, m: "regrouped-the-wrong-way" }], { lo: 0, hi: 99 }),
      hints: { conceptual: "You can break a ten into ten ones. The number stays the same.", procedural: "Find how many ones the tens use up, then see what is left." },
      level,
    });
  },
  check(p, params) {
    const max = params.max ?? 99;
    const s = p.spec;
    const n = s.mode === "total" ? s.tens * 10 + s.ones : s.n;
    return bad(n > max, `number ${n} above max ${max}`);
  },
};

// ------------------------------------------------------------------------------------------------------------ addsub
// One relationship a + b = c drives every story. The structure says which of the three is unknown and how the story is told,
// so the same cue word ("more", "left", "in all", "fewer") appears with both operations across seeds.
const STRUCT = {
  "addto-result": { unk: "c", labels: ["Start", "Added", "End"], happening: "Some are added to a start amount.", relationship: "start + added = end", reasonable: "The end amount must be greater than the start amount, because some were added." },
  "addto-change": { unk: "b", labels: ["Start", "Added", "End"], happening: "Some are added to a start amount, and the end amount is known.", relationship: "start + added = end", reasonable: "The amount added must be less than the end amount." },
  "addto-start": { unk: "a", labels: ["Start", "Added", "End"], happening: "Some are added to an unknown start amount.", relationship: "start + added = end", reasonable: "The start amount must be less than the end amount, because some were added." },
  "takefrom-result": { unk: "a", labels: ["Left", "Taken away", "Start"], happening: "Some are taken away from a start amount.", relationship: "left + taken away = start", reasonable: "The amount left must be less than the start amount, because some were taken away." },
  "takefrom-change": { unk: "b", labels: ["Left", "Taken away", "Start"], happening: "Some are taken away, and the amount left is known.", relationship: "left + taken away = start", reasonable: "The amount taken away must be less than the start amount." },
  "takefrom-start": { unk: "c", labels: ["Left", "Taken away", "Start"], happening: "Some are taken away from an unknown start amount.", relationship: "left + taken away = start", reasonable: "The start amount must be greater than the amount left, because some were taken away." },
  "together-total": { unk: "c", labels: ["Part", "Part", "Total"], happening: "Two groups are put together.", relationship: "part + part = total", reasonable: "The total must be greater than either part." },
  "together-part": { unk: "b", labels: ["Part", "Part", "Total"], happening: "A group is made of two parts, and one part is known.", relationship: "part + part = total", reasonable: "The missing part must be less than the total." },
  "compare-diff": { unk: "b", labels: ["Smaller amount", "Difference", "Larger amount"], happening: "Two amounts are compared.", relationship: "smaller + difference = larger", reasonable: "The difference must be less than the larger amount." },
  "compare-more-big": { unk: "c", labels: ["Smaller amount", "How many more", "Larger amount"], happening: "One person has some more than another, and we want the larger amount.", relationship: "smaller + how many more = larger", reasonable: "The larger amount must be greater than the amount we were given." },
  "compare-more-small": { unk: "a", labels: ["Smaller amount", "How many more", "Larger amount"], happening: "One person has some more than another, and we want the smaller amount.", relationship: "smaller + how many more = larger", reasonable: "The smaller amount must be less than the amount we were given." },
  "compare-fewer-big": { unk: "c", labels: ["Smaller amount", "How many fewer", "Larger amount"], happening: "One person has some fewer than another, and we want the larger amount.", relationship: "smaller + how many fewer = larger", reasonable: "The larger amount must be greater than the amount we were given, even though the story says fewer." },
  "compare-fewer-small": { unk: "a", labels: ["Smaller amount", "How many fewer", "Larger amount"], happening: "One person has some fewer than another, and we want the smaller amount.", relationship: "smaller + how many fewer = larger", reasonable: "The smaller amount must be less than the amount we were given." },
};
const STRUCT_LEVELS = {
  1: ["addto-result", "takefrom-result", "together-total", "together-part"],
  2: ["addto-result", "takefrom-result", "together-total", "together-part", "addto-change", "takefrom-change", "compare-diff", "compare-more-big"],
  3: Object.keys(STRUCT),
};
const CUE_WRONG = {
  "addto-start": "more-means-add",
  "addto-change": "more-means-add",
  "takefrom-change": "left-means-subtract-the-wrong-way",
  "takefrom-start": "gave-away-means-subtract",
  "together-part": "in-all-means-add",
  "compare-diff": "more-means-add",
  "compare-more-small": "more-means-add",
  "compare-fewer-big": "fewer-means-subtract",
  "compare-fewer-small": "fewer-means-subtract-the-wrong-number",
  "takefrom-result": "added-instead-of-subtracted",
  "addto-result": "subtracted-instead-of-added",
  "together-total": "subtracted-instead-of-added",
  "compare-more-big": "subtracted-because-of-the-word-more",
};

function storyText(struct, v, N1, N2, t, endw, flavor) {
  const m = t.many;
  const u = (x) => count(x, t);
  const n = num;
  const { a, b, c } = v;
  switch (struct) {
    case "addto-result":
      return {
        stem: T(`${N1} has ${u(a)}. ${N2} gives ${N1} ${n(b)} more.`, `${N1} has ${u(a)}. Then ${N2} gives ${N1} ${n(b)} more.`, `${N1} starts with ${u(a)}. ${N2} then gives ${N1} ${n(b)} more ${m}.`),
        ask: T(`How many ${m} does ${N1} have ${endw}?`, `How many ${m} does ${N1} have ${endw}?`, `How many ${m} does ${N1} have ${endw}?`),
      };
    case "addto-change":
      return {
        stem: T(`${N1} has ${u(a)}. ${N2} gives ${N1} some more. Now ${N1} has ${n(c)}.`, `${N1} has ${u(a)}. After ${N2} gives ${N1} some more, ${N1} has ${n(c)} ${m}.`, `${N1} began with ${u(a)}. ${N2} gave ${N1} some more ${m}, and ${N1} then had ${n(c)} ${m}.`),
        ask: T(`How many did ${N2} give ${N1}?`, `How many ${m} did ${N2} give ${N1}?`, `How many ${m} did ${N2} give ${N1}?`),
      };
    case "addto-start":
      return {
        stem: T(`${N1} has some ${m}. ${N2} gives ${N1} ${n(b)} more. Now ${N1} has ${n(c)}.`, `${N1} had some ${m}. Then ${N2} gave ${N1} ${n(b)} more, and now ${N1} has ${n(c)}.`, `${N1} had an unknown number of ${m}. After receiving ${n(b)} more from ${N2}, ${N1} had ${n(c)} ${m}.`),
        ask: T(`How many did ${N1} have at first?`, `How many ${m} did ${N1} have to start?`, `How many ${m} did ${N1} have before ${N2} gave ${N1} any?`),
      };
    case "takefrom-result":
      return {
        stem: T(`${N1} has ${u(c)}. ${N1} gives ${n(b)} to ${N2}.`, `${N1} has ${u(c)}. ${N1} gives ${n(b)} of them to ${N2}.`, `${N1} starts with ${u(c)} and gives ${n(b)} of them to ${N2}.`),
        ask: T(`How many ${m} does ${N1} have ${endw}?`, `How many ${m} does ${N1} have ${endw}?`, `How many ${m} does ${N1} have ${endw}?`),
      };
    case "takefrom-change":
      return {
        stem: T(`${N1} has ${u(c)}. ${N1} gives some to ${N2}. Now ${N1} has ${n(a)} left.`, `${N1} had ${u(c)}. After giving some to ${N2}, ${N1} has ${n(a)} left.`, `${N1} began with ${u(c)}. ${N1} gave some ${m} to ${N2} and kept ${n(a)}.`),
        ask: T(`How many did ${N1} give to ${N2}?`, `How many ${m} did ${N1} give to ${N2}?`, `How many ${m} did ${N1} give to ${N2}?`),
      };
    case "takefrom-start":
      return {
        stem: T(`${N1} has some ${m}. ${N1} gives ${n(b)} to ${N2}. Now ${N1} has ${n(a)} left.`, `${N1} had some ${m}. ${N1} gave ${n(b)} to ${N2} and has ${n(a)} left.`, `${N1} had an unknown number of ${m}. After giving ${n(b)} to ${N2}, ${N1} was left with ${n(a)}.`),
        ask: T(`How many did ${N1} have at first?`, `How many ${m} did ${N1} have to start?`, `How many ${m} did ${N1} have before giving any away?`),
      };
    case "together-total":
      return {
        stem: T(`${N1} has ${u(a)}. ${N2} has ${u(b)}.`, `${N1} has ${u(a)} and ${N2} has ${u(b)}.`, `${N1} has ${u(a)}, and ${N2} has ${u(b)}.`),
        ask: T(`How many ${m} do they have in all?`, `How many ${m} do they have together?`, `What is the total number of ${m} that ${N1} and ${N2} have?`),
      };
    case "together-part":
      return {
        stem: T(`${N1} and ${N2} have ${u(c)} in all. ${N1} has ${n(a)} of them.`, `${N1} and ${N2} have ${u(c)} altogether. ${N1} has ${n(a)} of them.`, `Together, ${N1} and ${N2} have ${u(c)}. ${N1} has ${n(a)} of the ${m}.`),
        ask: T(`How many does ${N2} have?`, `How many ${m} does ${N2} have?`, `How many ${m} does ${N2} have?`),
      };
    case "compare-diff":
      return {
        stem: T(`${N1} has ${u(c)}. ${N2} has ${u(a)}.`, `${N1} has ${u(c)} and ${N2} has ${u(a)}.`, `${N1} has ${u(c)}, and ${N2} has ${u(a)}.`),
        ask:
          flavor === "more"
            ? T(`How many more does ${N1} have than ${N2}?`, `How many more ${m} does ${N1} have than ${N2}?`, `By how many ${m} does ${N1}'s amount exceed ${N2}'s amount?`)
            : T(`How many fewer does ${N2} have than ${N1}?`, `How many fewer ${m} does ${N2} have than ${N1}?`, `By how many ${m} is ${N2}'s amount less than ${N1}'s amount?`),
      };
    case "compare-more-big":
      return {
        stem: T(`${N2} has ${u(a)}. ${N1} has ${n(b)} more than ${N2}.`, `${N2} has ${u(a)}. ${N1} has ${n(b)} more ${m} than ${N2}.`, `${N2} has ${u(a)}. ${N1} has ${n(b)} more ${m} than ${N2} has.`),
        ask: T(`How many does ${N1} have?`, `How many ${m} does ${N1} have?`, `How many ${m} does ${N1} have?`),
      };
    case "compare-more-small":
      return {
        stem: T(`${N1} has ${u(c)}. ${N1} has ${n(b)} more than ${N2}.`, `${N1} has ${u(c)}. That is ${n(b)} more ${m} than ${N2} has.`, `${N1} has ${u(c)}, which is ${n(b)} more than ${N2} has.`),
        ask: T(`How many does ${N2} have?`, `How many ${m} does ${N2} have?`, `How many ${m} does ${N2} have?`),
      };
    case "compare-fewer-big":
      return {
        stem: T(`${N1} has ${u(a)}. ${N1} has ${n(b)} fewer than ${N2}.`, `${N1} has ${u(a)}. That is ${n(b)} fewer ${m} than ${N2} has.`, `${N1} has ${u(a)}, which is ${n(b)} fewer than ${N2} has.`),
        ask: T(`How many does ${N2} have?`, `How many ${m} does ${N2} have?`, `How many ${m} does ${N2} have?`),
      };
    case "compare-fewer-small":
      return {
        stem: T(`${N2} has ${u(c)}. ${N1} has ${n(b)} fewer than ${N2}.`, `${N2} has ${u(c)}. ${N1} has ${n(b)} fewer ${m} than ${N2}.`, `${N2} has ${u(c)}, and ${N1} has ${n(b)} fewer ${m} than ${N2} has.`),
        ask: T(`How many does ${N1} have?`, `How many ${m} does ${N1} have?`, `How many ${m} does ${N1} have?`),
      };
  }
  throw new Error(`unknown structure ${struct}`);
}

function storyWork(struct, v) {
  const { a, b, c } = v;
  switch (struct) {
    case "addto-result": return [`Start: ${a}. Added: ${b}.`, `${a} + ${b} = ${c}`];
    case "addto-change": return [`${a} + __ = ${c}`, `Find the missing part: ${c} ${MINUS} ${a} = ${b}`];
    case "addto-start": return [`__ + ${b} = ${c}`, `Undo the adding: ${c} ${MINUS} ${b} = ${a}`];
    case "takefrom-result": return [`Start: ${c}. Taken away: ${b}.`, `${c} ${MINUS} ${b} = ${a}`];
    case "takefrom-change": return [`${c} ${MINUS} __ = ${a}`, `Find what was taken away: ${c} ${MINUS} ${a} = ${b}`];
    case "takefrom-start": return [`__ ${MINUS} ${b} = ${a}`, `Undo the taking away: ${a} + ${b} = ${c}`];
    case "together-total": return [`The two parts are ${a} and ${b}.`, `${a} + ${b} = ${c}`];
    case "together-part": return [`${a} + __ = ${c}`, `Find the other part: ${c} ${MINUS} ${a} = ${b}`];
    case "compare-diff": return [`Compare the larger amount ${c} with the smaller amount ${a}.`, `${c} ${MINUS} ${a} = ${b}`];
    case "compare-more-big": return [`The larger amount is the smaller amount plus ${b}.`, `${a} + ${b} = ${c}`];
    case "compare-more-small": return [`The smaller amount is ${b} less than the larger amount.`, `${c} ${MINUS} ${b} = ${a}`];
    case "compare-fewer-big": return [`The person with fewer has the smaller amount, so the other amount is ${b} greater.`, `${a} + ${b} = ${c}`];
    case "compare-fewer-small": return [`The smaller amount is ${b} fewer than the larger amount.`, `${c} ${MINUS} ${b} = ${a}`];
  }
  return [];
}

const calcTriple = (s) => {
  if (s.op === "+") return s.unknown === "result" ? [s.a, s.b, s.a + s.b] : s.unknown === "b" ? [s.a, s.c - s.a, s.c] : [s.c - s.b, s.b, s.c];
  return s.unknown === "result" ? [s.a, s.b, s.a - s.b] : s.unknown === "b" ? [s.a, s.a - s.c, s.c] : [s.c + s.b, s.b, s.c];
};
const addLevelLim = (max, level) => Math.min(max, Math.max(10, Math.round(max * [0.5, 0.8, 1][level - 1])));

function genCalc(rng, P, level, ctx) {
  const lim = addLevelLim(P.max, level);
  const ops = P.op === "add" ? ["+"] : P.op === "sub" ? ["-"] : ["+", "-"];
  const op = rng.pick(ops);
  const unknown = rng.pick(level === 1 ? ["result"] : level === 2 ? ["result", "result", "b"] : ["result", "b", "a"]);
  const big = P.max > 20;
  let a, b;
  for (let i = 0; i < 400; i++) {
    if (op === "+") {
      a = big ? rng.int(12, Math.max(13, lim - 8)) : rng.int(2, Math.max(3, lim - 2));
      b = big ? rng.int(6, Math.max(6, lim - a)) : rng.int(2, Math.max(2, lim - a));
      if (a + b > lim) continue;
      if (P.regroup && (a % 10) + (b % 10) < 10) continue;
    } else {
      a = big ? rng.int(24, lim) : rng.int(4, lim);
      b = big ? rng.int(6, a - 4) : rng.int(2, a - 1);
      if (P.regroup && a % 10 >= b % 10) continue;
    }
    break;
  }
  const c = op === "+" ? a + b : a - b;
  const sym = op === "+" ? "+" : MINUS;
  const eq = unknown === "result" ? null : unknown === "b" ? `${a} ${sym} __ = ${c}` : `__ ${sym} ${b} = ${c}`;
  const expr = unknown === "result" ? `${a} ${sym} ${b}` : eq;
  const spec = { kind: "calc", op, unknown };
  if (unknown !== "a") spec.a = a;
  if (unknown !== "b") spec.b = b;
  if (unknown !== "result") spec.c = c;
  if (unknown === "a") delete spec.a;
  if (unknown === "b") delete spec.b;
  const x = unknown === "result" ? c : unknown === "b" ? b : a;
  const ask = unknown === "result" ? T(`What is ${expr}?`, `What is ${expr}?`, `Find the value of ${expr}.`) : T(`What number goes in the blank? ${eq}`, `Find the missing number: ${eq}`, `Find the number that makes this equation true: ${eq}`);
  // work: place-value steps for two-digit work, otherwise one fact plus a check
  const a1 = a % 10, a10 = a - a1, b1 = b % 10, b10 = b - b1;
  const work = [];
  if (unknown === "a" || unknown === "b") {
    if (op === "+") work.push(`${eq}`, unknown === "b" ? `Find the missing part: ${c} ${MINUS} ${a} = ${b}` : `Find the missing part: ${c} ${MINUS} ${b} = ${a}`);
    else work.push(`${eq}`, unknown === "b" ? `Think: ${a} ${MINUS} ${c} = ${b}` : `Undo the taking away: ${c} + ${b} = ${a}`);
    work.push(`Check: put ${x} in the blank and read it again.`);
  } else if (big && a >= 10) {
    if (op === "+") {
      const o = a1 + b1;
      work.push(`Ones: ${a1} + ${b1} = ${o}`, b10 > 0 ? `Tens: ${a10} + ${b10} = ${a10 + b10}` : `Keep the tens: ${a10}`, `${a10 + b10} + ${o} = ${c}`);
    } else {
      const borrow = a1 < b1;
      const A = borrow ? a10 - 10 : a10;
      const o = borrow ? a1 + 10 - b1 : a1 - b1;
      if (borrow) work.push(`Not enough ones, so regroup 1 ten as 10 ones.`);
      work.push(borrow ? `Ones: ${a1 + 10} ${MINUS} ${b1} = ${o}` : `Ones: ${a1} ${MINUS} ${b1} = ${o}`, b10 > 0 ? `Tens: ${A} ${MINUS} ${b10} = ${A - b10}` : `Tens left: ${A}`, `${A - b10} + ${o} = ${c}`);
    }
  } else {
    work.push(`${a} ${sym} ${b} = ${c}`, op === "+" ? `Check: ${c} ${MINUS} ${b} = ${a}` : `Check: ${c} + ${b} = ${a}`);
  }
  // distractors: real slips for the operation and the unknown
  const cands = [];
  if (unknown === "result") {
    if (op === "+") {
      cands.push({ v: Math.abs(a - b), m: "subtracted-instead-of-added" });
      if ((a1 + b1) >= 10 && big) cands.push({ v: c - 10, m: "forgot-to-regroup-the-ten" });
      cands.push({ v: c + 10, m: "added-an-extra-ten" });
    } else {
      cands.push({ v: a + b, m: "added-instead-of-subtracted" });
      if (a1 < b1 && big) {
        cands.push({ v: (a10 / 10 - b10 / 10) * 10 + (b1 - a1), m: "subtracted-the-smaller-digit-from-the-larger" });
        cands.push({ v: c + 10, m: "forgot-to-take-one-ten-after-regrouping" });
      }
      if (a1 >= b1 || !big) cands.push({ v: c + 10, m: "tens-slip" });
    }
  } else if (unknown === "b") {
    cands.push({ v: a + c, m: "added-the-two-numbers" }, { v: c, m: "copied-the-number-after-the-equal-sign" }, { v: a, m: "copied-a-number-from-the-equation" });
  } else {
    cands.push({ v: b + c, m: op === "+" ? "added-the-two-numbers" : "subtracted-instead-of-added" }, { v: c, m: "copied-the-number-after-the-equal-sign" }, { v: b, m: "copied-a-number-from-the-equation" });
  }
  cands.push({ v: x + 1, m: "counting-slip" }, { v: x - 1, m: "counting-slip" });
  let visual = null;
  if (level === 1 && P.max <= 20) {
    if (unknown === "result" && op === "+") visual = { kind: "bond", alt: `Number bond. The two parts are ${a} and ${b}. The whole is missing.`, whole: c, a, b, hide: "whole" };
    else if (unknown === "result") visual = { kind: "bond", alt: `Number bond. The whole is ${a} and one part is ${b}. The other part is missing.`, whole: a, a: b, b: c, hide: "b" };
  }
  return finalize({
    family: "addsub",
    spec,
    stem: "",
    ask,
    expr,
    answer: { value: String(x), text: String(x), kind: "int" },
    work,
    visual,
    distractors: numDists(x, cands, { lo: 0, hi: P.max * 2 }),
    hints: op === "+"
      ? { conceptual: "Adding puts amounts together. Think of two parts and a whole.", procedural: "Start with the bigger number and count on, or break a number into tens and ones." }
      : { conceptual: "Subtracting takes away or finds the missing part. Think of a whole and two parts.", procedural: "Count back, or think about what number joins the small number to make the big one." },
    level,
  });
}

function genStory(rng, P, level, ctx) {
  const t = thing(rng, ctx);
  const [N1, N2] = twoNames(rng);
  const lim = addLevelLim(P.max, level);
  let pool = STRUCT_LEVELS[level].filter((s) => (P.op === "add" ? STRUCT[s].unk === "c" : P.op === "sub" ? STRUCT[s].unk !== "c" : true));
  if (!pool.length) pool = Object.keys(STRUCT).filter((s) => (P.op === "add" ? STRUCT[s].unk === "c" : STRUCT[s].unk !== "c"));
  const struct = rng.pick(pool);
  const st = STRUCT[struct];
  const c = rng.int(Math.max(6, Math.floor(lim * 0.5)), lim);
  const a = rng.int(2, c - 2);
  const b = c - a;
  const full = { a, b, c };
  const eq = { a, b, c };
  eq[st.unk] = null;
  const x = full[st.unk];
  const flavor = rng.chance(0.5) ? "more" : "fewer";
  const endw = struct === "takefrom-result" ? rng.pick(["left", "now"]) : rng.pick(["now", "in all", "after that"]);
  const { stem, ask } = storyText(struct, full, N1, N2, t, endw, flavor);
  const known = ["a", "b", "c"].filter((k) => k !== st.unk).map((k) => ({ label: st.labels[["a", "b", "c"].indexOf(k)], value: full[k] }));
  const unkLabel = st.labels[["a", "b", "c"].indexOf(st.unk)].toLowerCase();
  const ks = known.map((k) => k.value);
  const cands = [];
  if (st.unk === "c") cands.push({ v: Math.abs(ks[0] - ks[1]), m: CUE_WRONG[struct] });
  else cands.push({ v: ks[0] + ks[1], m: CUE_WRONG[struct] });
  cands.push({ v: ks[0], m: "copied-a-number-from-the-story" }, { v: ks[1], m: "copied-a-number-from-the-story" }, { v: x + 1, m: "counting-slip" }, { v: x - 1, m: "counting-slip" });
  const visual = level === 1 && P.max <= 20 && struct.startsWith("together")
    ? struct === "together-total"
      ? { kind: "bond", alt: `Number bond. The two parts are ${a} and ${b}. The whole is missing.`, whole: c, a, b, hide: "whole" }
      : { kind: "bond", alt: `Number bond. The whole is ${c} and one part is ${a}. The other part is missing.`, whole: c, a, b, hide: "b" }
    : null;
  return finalize({
    family: "addsub",
    spec: { kind: "story", structure: struct, eq },
    stem,
    ask,
    expr: null,
    answer: { value: String(x), text: String(x), kind: "int" },
    work: storyWork(struct, full),
    visual,
    distractors: numDists(x, cands, { lo: 0, hi: P.max * 2 }),
    hints: {
      conceptual: "Picture what is happening. Ask yourself: is the whole, a part, or the change the number I do not know?",
      procedural: "Draw a bar or a number bond. Write the numbers you know and a box for the one you do not. Then decide how the numbers fit together.",
    },
    structure: {
      happening: st.happening,
      known,
      unknown: unkLabel,
      relationship: st.relationship,
      model: struct.startsWith("together") || struct.startsWith("compare") ? "bar model with two parts and a total" : "bar model for start, change and end",
      reasonable: st.reasonable,
    },
    level,
  });
}

/** Two-step stories (grade 2): running totals, or a comparison followed by a total. */
function genStory2(rng, P, level, ctx) {
  const t = thing(rng, ctx);
  const [N1, N2] = twoNames(rng);
  const lim = addLevelLim(P.max, level);
  const m = t.many;
  const u = (x) => count(x, t);
  const kinds = level === 1 ? ["chain", "chain", "cmptotal"] : level === 2 ? ["chain", "cmptotal", "chain"] : ["chain", "cmptotal", "chainback", "chainback"];
  const kind = rng.pick(kinds);
  const sg = (op) => (op === "+" ? "+" : MINUS);
  if (kind === "cmptotal") {
    const dir = rng.pick(["more", "fewer"]);
    let a, d, other, total;
    for (let i = 0; i < 300; i++) {
      a = rng.int(10, Math.max(11, Math.floor(lim / 2)));
      d = rng.int(3, Math.max(3, Math.min(a - 2, 30)));
      other = dir === "more" ? a + d : a - d;
      total = a + other;
      if (other >= 1 && total <= lim) break;
    }
    const x = total;
    const work = [dir === "more" ? `${N2} has ${a} + ${d} = ${other}` : `${N2} has ${a} ${MINUS} ${d} = ${other}`, `Together: ${a} + ${other} = ${total}`];
    return finalize({
      family: "addsub",
      spec: { kind: "cmptotal", a, d, dir },
      stem: T(`${N1} has ${u(a)}. ${N2} has ${num(d)} ${dir} than ${N1}.`, `${N1} has ${u(a)}. ${N2} has ${num(d)} ${dir} ${m} than ${N1}.`, `${N1} has ${u(a)}, and ${N2} has ${num(d)} ${dir} ${m} than ${N1}.`),
      ask: T(`How many do they have together?`, `How many ${m} do ${N1} and ${N2} have together?`, `What is the total number of ${m} that ${N1} and ${N2} have?`),
      expr: null,
      answer: { value: String(x), text: String(x), kind: "int" },
      work,
      visual: null,
      distractors: numDists(x, [{ v: other, m: "found-only-the-second-amount" }, { v: dir === "more" ? a + a - d : a + a + d, m: "used-the-wrong-direction-for-more-or-fewer" }, { v: a + d, m: "added-the-two-numbers-in-the-story" }, { v: a + other + d, m: "added-the-difference-again" }], { lo: 0, hi: P.max * 2 }),
      hints: { conceptual: "There are two questions hiding in this story. First find how many one person has, then put the two amounts together.", procedural: "Work out the second amount first. Then add the two amounts." },
      structure: { happening: "Two people are compared, then their amounts are put together.", known: [{ label: "First amount", value: a }, { label: `How many ${dir}`, value: d }], unknown: "the total of both amounts", relationship: `second amount = first amount ${dir === "more" ? "+" : "−"} difference, then total = first + second`, model: "two bar models, one for the comparison and one for the total", reasonable: "The total must be more than either amount alone." },
      level,
    });
  }
  const back = kind === "chainback";
  let ops, start, n1, n2, end;
  for (let i = 0; i < 400; i++) {
    ops = rng.pick([["+", "-"], ["+", "+"], ["-", "-"], ["-", "+"]]);
    start = rng.int(10, Math.max(11, lim - 5));
    n1 = rng.int(4, Math.max(4, Math.floor(lim / 2.2)));
    n2 = rng.int(4, Math.max(4, Math.floor(lim / 2.2)));
    const mid = ops[0] === "+" ? start + n1 : start - n1;
    end = ops[1] === "+" ? mid + n2 : mid - n2;
    if (mid >= 1 && mid <= lim && end >= 1 && end <= lim && n1 !== n2) break;
  }
  const mid = ops[0] === "+" ? start + n1 : start - n1;
  end = ops[1] === "+" ? mid + n2 : mid - n2;
  const line = (i, op, n) =>
    op === "+"
      ? i === 0 ? T(`${N2} gives ${N1} ${num(n)} more.`, `${N2} gives ${N1} ${num(n)} more.`, `${N2} gives ${N1} ${num(n)} more ${m}.`) : T(`Then ${N1} gets ${num(n)} more.`, `Then ${N1} gets ${num(n)} more.`, `Later, ${N1} gets ${num(n)} more ${m}.`)
      : i === 0 ? T(`${N1} gives ${num(n)} to a friend.`, `${N1} gives ${num(n)} ${m} to a friend.`, `${N1} gives ${num(n)} ${m} to a friend.`) : T(`Then ${N1} gives ${num(n)} away.`, `Then ${N1} gives ${num(n)} ${m} away.`, `After that, ${N1} gives away ${num(n)} ${m}.`);
  const l1 = line(0, ops[0], n1);
  const l2 = line(1, ops[1], n2);
  const join = (...parts) => T(parts.map((p) => p.plain).join(" "), parts.map((p) => p.standard).join(" "), parts.map((p) => p.rich).join(" "));
  if (!back) {
    const work = [`Step 1: ${start} ${sg(ops[0])} ${n1} = ${mid}`, `Step 2: ${mid} ${sg(ops[1])} ${n2} = ${end}`];
    const cands = [{ v: mid, m: "stopped-after-the-first-step" }];
    for (const [o1, o2] of [["+", "+"], ["+", "-"], ["-", "+"], ["-", "-"]]) {
      if (o1 === ops[0] && o2 === ops[1]) continue;
      const v = (o1 === "+" ? start + n1 : start - n1) + (o2 === "+" ? n2 : -n2);
      cands.push({ v, m: "used-the-wrong-operation-in-one-step" });
    }
    return finalize({
      family: "addsub",
      spec: { kind: "chain", unknown: "end", start, ops: [{ op: ops[0], n: n1 }, { op: ops[1], n: n2 }] },
      stem: join(T(`${N1} has ${u(start)}.`, `${N1} has ${u(start)}.`, `${N1} starts with ${u(start)}.`), l1, l2),
      ask: T(`How many ${m} does ${N1} have now?`, `How many ${m} does ${N1} have now?`, `How many ${m} does ${N1} have at the end?`),
      expr: null,
      answer: { value: String(end), text: String(end), kind: "int" },
      work,
      visual: null,
      distractors: numDists(end, cands, { lo: 0, hi: P.max * 2 }),
      hints: { conceptual: "This story has two steps. The answer to the first step is the starting number for the second step.", procedural: "Do the steps in order. Write what you have after the first step before you start the second." },
      structure: { happening: "A start amount changes in two steps.", known: [{ label: "Start", value: start }, { label: "First change", value: n1 }, { label: "Second change", value: n2 }], unknown: "the end amount", relationship: "end = start, then the first change, then the second change", model: "two bar models, one for each step", reasonable: "Check whether the end amount is more or less than the start, using the two changes." },
      level,
    });
  }
  // start unknown: undo the steps in reverse order
  const undo1 = ops[1] === "+" ? end - n2 : end + n2;
  const work = [`Undo step 2: ${end} ${ops[1] === "+" ? MINUS : "+"} ${n2} = ${undo1}`, `Undo step 1: ${undo1} ${ops[0] === "+" ? MINUS : "+"} ${n1} = ${start}`];
  const cands = [{ v: undo1, m: "undid-only-one-step" }];
  for (const [o1, o2] of [["+", "+"], ["+", "-"], ["-", "+"], ["-", "-"]]) {
    const v = (o2 === "+" ? end + n2 : end - n2) + (o1 === "+" ? n1 : -n1);
    cands.push({ v, m: "did-the-steps-forward-instead-of-undoing-them" });
  }
  return finalize({
    family: "addsub",
    spec: { kind: "chain", unknown: "start", end, ops: [{ op: ops[0], n: n1 }, { op: ops[1], n: n2 }] },
    stem: join(T(`${N1} has some ${m}.`, `${N1} has some ${m}.`, `${N1} has an unknown number of ${m}.`), l1, l2, T(`Now ${N1} has ${num(end)}.`, `Now ${N1} has ${num(end)}.`, `Now ${N1} has ${num(end)} ${m}.`)),
    ask: T(`How many did ${N1} have at first?`, `How many ${m} did ${N1} have to start?`, `How many ${m} did ${N1} have before the first change?`),
    expr: null,
    answer: { value: String(start), text: String(start), kind: "int" },
    work,
    visual: null,
    distractors: numDists(start, cands, { lo: 0, hi: P.max * 2 }),
    hints: { conceptual: "Work backward. Each step can be undone with the opposite operation.", procedural: "Start from the number at the end. Undo the last step first, then undo the step before it." },
    structure: { happening: "An unknown start amount changes in two steps.", known: [{ label: "First change", value: n1 }, { label: "Second change", value: n2 }, { label: "End", value: end }], unknown: "the start amount", relationship: "start, then the first change, then the second change, gives the end", model: "two bar models, worked backward", reasonable: "Check by doing the two changes forward from your answer." },
    level,
  });
}

FAMILIES.addsub = {
  title: "Add and subtract (calculations and stories)",
  grades: [1, 2],
  defaults: { max: 20, op: "mix", regroup: false, story: false, steps: 1 },
  gen(rng, params, { level = 1, ctx = "store" } = {}) {
    if (params.story) return params.steps === 2 ? genStory2(rng, params, level, ctx) : genStory(rng, params, level, ctx);
    return genCalc(rng, params, level, ctx);
  },
  check(p, params) {
    const P = { max: 20, op: "mix", regroup: false, story: false, steps: 1, ...params };
    const s = p.spec;
    const nums = [];
    if (s.kind === "calc") {
      const [a, b, c] = calcTriple(s);
      nums.push(a, b, c);
      if (c < 0 || a < 0 || b < 0) return "negative number";
      if (P.op === "add" && s.op !== "+") return "subtraction in an addition skill";
      if (P.op === "sub" && s.op !== "-") return "addition in a subtraction skill";
      if (P.story) return "calculation in a story skill";
      if (P.regroup) {
        if (s.op === "+" && (a % 10) + (b % 10) < 10) return "regroup:true but no carry";
        if (s.op === "-" && a % 10 >= b % 10) return "regroup:true but no borrow";
      }
    } else if (s.kind === "story") {
      if (!P.story) return "story in a calculation skill";
      if (P.steps === 2) return "one-step story in a two-step skill";
      const e = s.eq;
      const st = STRUCT[s.structure];
      const full = { ...e, [st.unk]: Number(p.answer.value) };
      nums.push(full.a, full.b, full.c);
      if (full.a + full.b !== full.c) return "story equation does not balance";
      if (P.op === "add" && st.unk !== "c") return "subtraction story in an addition skill";
      if (P.op === "sub" && st.unk === "c") return "addition story in a subtraction skill";
    } else if (s.kind === "chain" || s.kind === "cmptotal") {
      if (!P.story || P.steps !== 2) return "two-step story outside a two-step skill";
      if (s.kind === "cmptotal") nums.push(s.a, s.d, Number(p.answer.value));
      else {
        let cur = s.unknown === "start" ? Number(p.answer.value) : s.start;
        nums.push(cur);
        for (const o of s.ops) {
          cur += o.op === "+" ? o.n : -o.n;
          nums.push(cur, o.n);
        }
      }
    }
    if (nums.some((v) => v > P.max || v < 0)) return `a number is outside 0..${P.max}`;
    return null;
  },
};

// ---------------------------------------------------------------------------------------------------------- compare
/** k distinct numbers in [lo, hi]. unit = 10 (two-digit) or 100 (three-digit); level controls how alike the numbers look. */
function distinctNums(rng, level, lo, hi, k, unit) {
  for (let tries = 0; tries < 400; tries++) {
    let nums;
    const leadLo = Math.floor(lo / unit);
    const leadHi = Math.floor(hi / unit);
    const withLead = (lead) => {
      const base = lead * unit;
      return clamp(base + rng.int(0, unit - 1), lo, hi);
    };
    if (level === 1) {
      const leads = rng.sample(Array.from({ length: leadHi - leadLo + 1 }, (_, i) => leadLo + i), k);
      nums = leads.map(withLead);
    } else if (level === 2) {
      const shared = rng.int(leadLo, leadHi);
      const others = rng.sample(Array.from({ length: leadHi - leadLo + 1 }, (_, i) => leadLo + i).filter((x) => x !== shared), Math.max(0, k - 2));
      nums = [withLead(shared), withLead(shared), ...others.map(withLead)];
    } else {
      const base = rng.int(lo + 12, Math.max(lo + 13, hi - 12));
      nums = Array.from({ length: k }, () => clamp(base + rng.int(-14, 14), lo, hi));
    }
    if (new Set(nums).size === k) return rng.shuffle(nums);
  }
  return Array.from({ length: k }, (_, i) => lo + i * 7);
}
const partsOf = (n, unit) => (unit === 100 ? [Math.floor(n / 100) * 100, Math.floor((n % 100) / 10) * 10, n % 10] : [Math.floor(n / 10) * 10, n % 10]);
const tensOnes = (t, o) => `${t} ${t === 1 ? "ten" : "tens"} ${o} ${o === 1 ? "one" : "ones"}`;
const permutations = (a) => (a.length <= 1 ? [a] : a.flatMap((x, i) => permutations([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));

FAMILIES.compare = {
  title: "Compare and order numbers",
  grades: [1, 2],
  defaults: { max: 100, order: false },
  gen(rng, params, { level = 1 } = {}) {
    const max = params.max;
    const unit = max >= 200 ? 100 : 10;
    const lo = unit;
    const hi = Math.min(max, unit === 10 ? 99 : 999);
    const modes = params.order ? (level === 1 ? ["symbol", "which", "order"] : ["symbol", "order", "order", "which"]) : level === 1 ? ["symbol", "which"] : ["symbol", "which", "symbol"];
    const mode = rng.pick(modes);
    if (mode === "symbol") {
      const [x, y] = distinctNums(rng, level, lo, hi, 2, unit);
      const useForm = level >= 2 && rng.chance(0.45);
      const eqCase = useForm && rng.chance(0.4);
      let L = x;
      let R = eqCase ? x : y;
      let Ltext = String(x);
      let Rtext = String(R);
      let Lparts = [x];
      let Rparts = [R];
      if (useForm) {
        const pts = partsOf(x, unit);
        Lparts = pts.filter((v) => v > 0);
        if (unit === 10) Ltext = tensOnes(pts[0] / 10, pts[1]);
        else Ltext = Lparts.join(" + ");
        if (eqCase && (unit === 10 ? pts[0] / 10 === pts[1] : false)) {
          // avoid a swapped-digits statement that is also true
          return FAMILIES.compare.gen(rng, params, { level });
        }
      }
      const vL = Lparts.reduce((a, b) => a + b, 0);
      const vR = Rparts.reduce((a, b) => a + b, 0);
      const sym = vL > vR ? ">" : vL < vR ? "<" : "=";
      const stmt = (l, s, r) => `${l} ${s} ${r}`;
      const answerText = stmt(Ltext, sym, Rtext);
      const swappedL = useForm && eqCase && unit === 10 ? (() => { const pts = partsOf(x, 10); return tensOnes(pts[1], pts[0] / 10); })() : null;
      const others = [">", "<", "="].filter((s) => s !== sym);
      const cands = [
        { text: stmt(Ltext, others[0], Rtext), m: sym === "=" ? "ignored-the-ones-or-compared-one-digit-only" : sym === ">" ? "mixed-up-the-symbol-direction" : "mixed-up-the-symbol-direction" },
        { text: stmt(Ltext, others[1], Rtext), m: sym === "=" ? "compared-one-digit-only" : "said-they-are-equal" },
      ];
      if (swappedL) cands.push({ text: stmt(swappedL, "=", Rtext), m: "swapped-the-tens-and-ones" });
      else cands.push({ text: stmt(Rtext, sym === "=" ? "<" : sym, Ltext), m: "swapped-the-numbers-around-the-symbol" });
      cands.push({ text: stmt(Rtext, sym === ">" ? ">" : "<", Ltext) + (sym === "=" ? "" : ""), m: "swapped-the-numbers-around-the-symbol" });
      // the last candidate must still be false: only keep false statements
      const valOf = (t) => {
        const [lhs, op, rhs] = t.split(/ (>|<|=) /);
        const ev = (s) => (/ones?$/.test(s) ? (() => { const m = /(\d+) tens? (\d+) ones?/.exec(s); return Number(m[1]) * 10 + Number(m[2]); })() : s.split(" + ").reduce((a, b) => a + Number(b), 0));
        const l = ev(lhs);
        const r = ev(rhs);
        return op === ">" ? l > r : op === "<" ? l < r : l === r;
      };
      const falseOnly = cands.filter((c) => !valOf(c.text));
      for (const [l, s, r] of [[Rtext, ">", Ltext], [Rtext, "<", Ltext], [Rtext, "=", Ltext]]) {
        const t = stmt(l, s, r);
        if (!valOf(t)) falseOnly.push({ text: t, m: "swapped-the-numbers-around-the-symbol" });
      }
      const distractors = textDists(answerText, falseOnly, 3);
      return finalize({
        family: "compare",
        spec: { mode: "symbol", left: { parts: Lparts }, right: { parts: Rparts } },
        stem: T(`Compare ${Ltext} and ${Rtext}.`, `Compare ${Ltext} and ${Rtext}.`, `Compare the numbers ${Ltext} and ${Rtext}.`),
        ask: T("Which statement is true?", "Which statement is true?", "Which comparison is correct?"),
        expr: null,
        answer: { value: sym, text: answerText, kind: "text" },
        work: unit === 10
          ? [`Compare the tens first: ${tw(Math.floor(vL / 10))} and ${tw(Math.floor(vR / 10))}.`, vL === vR ? "The tens and the ones are the same, so the numbers are equal." : Math.floor(vL / 10) === Math.floor(vR / 10) ? "The tens are the same, so compare the ones." : "The tens are different, so the number with more tens is greater."]
          : [`Compare the hundreds first: ${Math.floor(vL / 100)} and ${Math.floor(vR / 100)}.`, vL === vR ? "All three places match, so the numbers are equal." : "If the hundreds match, compare the tens, then the ones. The first place that is different decides."],
        visual: null,
        distractors,
        hints: { conceptual: "Greater numbers have more. Look at the place with the biggest value first.", procedural: "Compare the digits from the left. Stop at the first place where they are different." },
        level,
      });
    }
    if (mode === "which") {
      const nums = distinctNums(rng, level, lo, hi, 4, unit);
      const dir = rng.pick(["greatest", "least"]);
      const sorted = nums.slice().sort((p, q) => p - q);
      const ans = dir === "greatest" ? sorted[3] : sorted[0];
      const list = nums.join(", ");
      const opposite = dir === "greatest" ? sorted[0] : sorted[3];
      const cands = [{ v: opposite, m: dir === "greatest" ? "picked-the-least-instead" : "picked-the-greatest-instead" }];
      const bigOnes = nums.slice().sort((p, q) => (p % 10) - (q % 10));
      const byOnes = dir === "greatest" ? bigOnes[bigOnes.length - 1] : bigOnes[0];
      cands.push({ v: byOnes, m: "compared-the-last-digit-only" });
      for (const v of nums) cands.push({ v, m: "did-not-compare-every-number" });
      return finalize({
        family: "compare",
        spec: { mode: "which", nums, dir },
        stem: T(`Here are four numbers: ${list}.`, `Look at these four numbers: ${list}.`, `Consider the numbers ${list}.`),
        ask: T(`Which number is the ${dir}?`, `Which number is the ${dir}?`, `Which of the numbers is the ${dir}?`),
        expr: null,
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: [`Compare the ${unit === 10 ? "tens" : "hundreds"} digits first.`, `Order from least to greatest: ${sorted.join(", ")}.`, `The ${dir} number is ${ans}.`],
        visual: null,
        distractors: numDists(ans, cands, { lo: 0, hi: 1000, want: 3 }).filter((d) => nums.includes(Number(d.text))).slice(0, 3),
        hints: { conceptual: "A number with more tens (or hundreds) is greater, even if its last digit is small.", procedural: "Find the biggest place value. Compare those digits across all four numbers." },
        level,
      });
    }
    // order three numbers
    const nums = distinctNums(rng, level, lo, hi, 3, unit);
    const sorted = nums.slice().sort((p, q) => p - q);
    const fmt = (a) => a.join(", ");
    const correct = fmt(sorted);
    const cands = [];
    cands.push({ text: fmt(sorted.slice().reverse()), m: "ordered-greatest-to-least" });
    const byOnes = nums.slice().sort((p, q) => (p % 10) - (q % 10) || p - q);
    cands.push({ text: fmt(byOnes), m: "ordered-by-the-last-digit" });
    cands.push({ text: fmt([sorted[1], sorted[0], sorted[2]]), m: "swapped-two-numbers" });
    cands.push({ text: fmt([sorted[0], sorted[2], sorted[1]]), m: "swapped-two-numbers" });
    cands.push({ text: fmt(nums), m: "left-the-numbers-in-the-order-given" });
    return finalize({
      family: "compare",
      spec: { mode: "order", nums },
      stem: T(`Here are three numbers: ${fmt(nums)}.`, `Look at these three numbers: ${fmt(nums)}.`, `Consider the numbers ${fmt(nums)}.`),
      ask: T("Put them in order from least to greatest.", "Put the numbers in order from least to greatest.", "Order the numbers from least to greatest."),
      expr: null,
      answer: { value: sorted.join(","), text: correct, kind: "set" },
      work: [`Compare the ${unit === 10 ? "tens" : "hundreds"} digits first, then the next place if they match.`, `Least to greatest: ${correct}.`],
      visual: null,
      distractors: textDists(correct, cands, 4),
      hints: { conceptual: "Least means the smallest number comes first.", procedural: "Find the smallest number first. Then find the smallest of the numbers left." },
      level,
    });
  },
  check(p, params) {
    const P = { max: 100, order: false, ...params };
    const s = p.spec;
    const all = s.mode === "symbol" ? [s.left.parts.reduce((a, b) => a + b, 0), s.right.parts.reduce((a, b) => a + b, 0)] : s.nums;
    if (all.some((v) => v > P.max)) return `a number is above max ${P.max}`;
    if (s.mode === "order" && !P.order) return "ordering problem when order:false";
    return null;
  },
};

// --------------------------------------------------------------------------------------------------------- equality
const evalSide = (side) => {
  // side = [n] or [n, op, n]
  if (side.length === 1) return side[0];
  return side[1] === "+" ? side[0] + side[2] : side[0] - side[2];
};
const sideText = (side) => (side.length === 1 ? String(side[0]) : `${side[0]} ${side[1] === "+" ? "+" : MINUS} ${side[2]}`);
function makeSide(rng, V, lim, kind) {
  if (kind === "single") return [V];
  if (kind === "add" && V >= 2) {
    const a = rng.int(1, V - 1);
    return [a, "+", V - a];
  }
  if (kind === "sub" && lim - V >= 1) {
    const y = rng.int(1, lim - V);
    return [V + y, "-", y];
  }
  return [V];
}
/** A true equation {L, R, text} whose two sides have the same value; both sides are different expressions. */
function trueEquation(rng, level, lim) {
  for (let i = 0; i < 300; i++) {
    let kinds;
    if (level === 1) kinds = [["add", "single"], ["single", "add"]];
    else if (level === 2) kinds = [["add", "add"], ["add", "single"], ["single", "add"], ["sub", "single"]];
    else kinds = [["add", "add"], ["sub", "sub"], ["add", "sub"], ["sub", "add"]];
    const [k1, k2] = rng.pick(kinds);
    const V = rng.int(level === 1 ? 4 : 5, lim);
    const L = makeSide(rng, V, lim, k1);
    const R = makeSide(rng, V, lim, k2);
    if (sideText(L) === sideText(R)) continue;
    if (L.length === 1 && R.length === 1) continue;
    if (L.some((x) => typeof x === "number" && x > lim) || R.some((x) => typeof x === "number" && x > lim)) continue;
    return { L, R, text: `${sideText(L)} = ${sideText(R)}` };
  }
  throw new Error("equality: could not build a true equation");
}
function falseVariants(rng, eq, lim) {
  const out = [];
  const bump = (side, d) => {
    const s = side.slice();
    const idx = s.length === 1 ? 0 : s[0] >= s[2] ? 0 : 2;
    s[idx] += d;
    return s;
  };
  const ok = (L, R) => evalSide(L) !== evalSide(R) && [...L, ...R].every((x) => typeof x !== "number" || (x >= 0 && x <= lim));
  for (const d of [1, -1, 2]) {
    const R2 = bump(eq.R, d);
    if (ok(eq.L, R2)) out.push({ text: `${sideText(eq.L)} = ${sideText(R2)}`, m: Math.abs(d) === 1 ? "off-by-one-on-one-side" : "counted-two-too-many" });
  }
  const flip = (side) => (side.length === 3 ? [side[0], side[1] === "+" ? "-" : "+", side[2]] : side);
  const Lf = flip(eq.L);
  const Rf = flip(eq.R);
  if (eq.L.length === 3 && ok(Lf, eq.R) && Lf[0] - Lf[2] >= 0) out.push({ text: `${sideText(Lf)} = ${sideText(eq.R)}`, m: "mixed-up-plus-and-minus" });
  if (eq.R.length === 3 && ok(eq.L, Rf) && Rf[0] - Rf[2] >= 0) out.push({ text: `${sideText(eq.L)} = ${sideText(Rf)}`, m: "mixed-up-plus-and-minus" });
  // the equal sign read as "the answer comes next": a side set equal to the sum of every number on both sides
  const all = [...eq.L, ...eq.R].filter((x) => typeof x === "number");
  const total = all.reduce((a, b) => a + b, 0);
  const lastLeft = eq.L.slice();
  if (eq.L.length === 3 && total <= lim) out.push({ text: `${sideText(eq.L)} = ${total}`, m: "added-every-number-and-called-it-the-answer" });
  return rng.shuffle(out);
}
/** Blank one number of a true equation; the blanked side must stay solvable. */
function blankEquation(rng, eq) {
  const slots = [];
  eq.L.forEach((x, i) => typeof x === "number" && slots.push(["L", i]));
  eq.R.forEach((x, i) => typeof x === "number" && slots.push(["R", i]));
  const [side, i] = rng.pick(slots);
  const L = eq.L.slice();
  const R = eq.R.slice();
  const target = side === "L" ? L : R;
  const ans = target[i];
  target[i] = "__";
  const txt = (s) => s.map((x) => (x === "+" ? "+" : x === "-" ? MINUS : String(x))).join(" ");
  return { text: `${txt(L)} = ${txt(R)}`, answer: ans, L, R };
}

FAMILIES.equality = {
  title: "What the equal sign means",
  grades: [1],
  defaults: { max: 20 },
  gen(rng, params, { level = 1 } = {}) {
    const max = params.max;
    const lim = level === 1 ? Math.min(10, max) : level === 2 ? Math.min(16, max) : max;
    const mode = rng.pick(level === 1 ? ["missing", "missing", "which"] : ["missing", "which", "missing"]);
    if (mode === "which") {
      const want = rng.pick(["true", "false"]);
      let eqs;
      let answerEq;
      let dists;
      if (want === "true") {
        const eq = trueEquation(rng, level, lim);
        const fs = falseVariants(rng, eq, lim);
        if (fs.length < 3) return FAMILIES.equality.gen(rng, params, { level });
        eqs = [eq.text, ...fs.slice(0, 3).map((f) => f.text)];
        answerEq = eq.text;
        dists = fs.slice(0, 3).map((f) => ({ text: f.text, m: f.m }));
      } else {
        const base = trueEquation(rng, level, lim);
        const fs = falseVariants(rng, base, lim);
        if (!fs.length) return FAMILIES.equality.gen(rng, params, { level });
        const tru = [base];
        const seen = new Set([base.text]);
        for (let i = 0; i < 40 && tru.length < 3; i++) {
          const e = trueEquation(rng, level, lim);
          if (!seen.has(e.text)) {
            seen.add(e.text);
            tru.push(e);
          }
        }
        if (tru.length < 3) return FAMILIES.equality.gen(rng, params, { level });
        const f = fs[0];
        eqs = [f.text, ...tru.map((e) => e.text)];
        answerEq = f.text;
        dists = tru.map((e) => ({ text: e.text, m: "thought-a-true-equation-was-false" }));
      }
      return finalize({
        family: "equality",
        spec: { mode: "which", want, eqs: rng.shuffle(eqs) },
        stem: "",
        ask: want === "true" ? T("Which equation is true?", "Which equation is true?", "Select the equation that is true.") : T("Which equation is false?", "Which equation is not true?", "Select the equation that is not true."),
        expr: null,
        answer: { value: answerEq, text: answerEq, kind: "choice" },
        work: [`Find the value of each side of the equal sign.`, `The equal sign means both sides have the same value.`, (() => { const [lhs, rhs] = answerEq.split(" = "); return want === "true" ? `Only one equation has two sides with the same value: ${lhs} and ${rhs} both have the same value.` : `Only one equation has sides with different values: ${lhs} and ${rhs} do not have the same value.`; })()],
        visual: null,
        distractors: textDists(answerEq, dists, 3),
        hints: { conceptual: "The equal sign means the same as. Both sides must name the same amount.", procedural: "Work out the value of the left side and the value of the right side. Then compare them." },
        level,
      });
    }
    // missing number
    const eq = trueEquation(rng, level, lim);
    const bl = blankEquation(rng, eq);
    const x = bl.answer;
    const nums = [...bl.L, ...bl.R].filter((v) => typeof v === "number");
    const sideVal = (s) => (s.includes("__") ? null : evalSide(s));
    const known = sideVal(bl.L) ?? sideVal(bl.R);
    const cands = [
      { v: known, m: "wrote-the-total-in-the-blank" },
      { v: nums.reduce((a, b) => a + b, 0), m: "added-every-number" },
      { v: nums[0], m: "copied-a-number-from-the-equation" },
      { v: Math.abs(nums[0] - (nums[1] ?? 0)), m: "subtracted-the-wrong-numbers" },
    ];
    return finalize({
      family: "equality",
      spec: { mode: "missing", left: bl.L.map(String), right: bl.R.map(String) },
      stem: T(`Equation: ${bl.text}`, `Look at this equation: ${bl.text}`, `Consider the equation ${bl.text}.`),
      ask: T("What number goes in the blank?", "Find the missing number.", "Find the number that makes the equation true."),
      expr: bl.text,
      answer: { value: String(x), text: String(x), kind: "int" },
      work: (() => {
        const w = [`Find the value of the side with no blank: ${known}.`, `The side with the blank must also have the value ${known}.`];
        const bs = bl.L.includes("__") ? bl.L : bl.R;
        if (bs.length === 3) {
          const other = bs[0] === "__" ? bs[2] : bs[0];
          if (bs[1] === "+") w.push(`${known} ${MINUS} ${other} = ${x}`);
          else if (bs[0] === "__") w.push(`${known} + ${other} = ${x}`);
          else w.push(`${other} ${MINUS} ${known} = ${x}`);
        } else w.push(`The blank is the whole side, so the missing number is ${x}.`);
        return w;
      })(),
      visual: null,
      distractors: numDists(x, cands, { lo: 0, hi: 40 }),
      hints: { conceptual: "The equal sign means both sides have the same value, like a balanced scale.", procedural: "Work out the side that has no blank. Then find what the other side needs to be the same." },
      level,
    });
  },
  check(p, params) {
    const max = params.max ?? 20;
    const s = p.spec;
    const list = s.mode === "which" ? s.eqs.join(" ") : [...s.left, ...s.right].join(" ") + " " + p.answer.value;
    for (const m of list.matchAll(/\d+/g)) if (Number(m[0]) > max) return `number ${m[0]} above max ${max}`;
    return null;
  },
};

// ------------------------------------------------------------------------------------------------------------ length
const LEN_THINGS = ["pencil", "crayon", "ribbon", "feather", "stick", "key", "leaf", "marker", "shoelace", "straw", "toothbrush", "string"];
const UNIT_THINGS = [{ one: "paper clip", many: "paper clips" }, { one: "cube", many: "cubes" }, { one: "block", many: "blocks" }, { one: "button", many: "buttons" }];
const BENCH = {
  cm: [{ n: "paper clip", v: 3, e: 3 }, { n: "key", v: 6, e: 6 }, { n: "crayon", v: 9, e: 10 }, { n: "spoon", v: 15, e: 15 }, { n: "new pencil", v: 19, e: 20 }, { n: "notebook", v: 28, e: 30 }, { n: "classroom door", v: 200, e: 200 }],
  in: [{ n: "paper clip", v: 1, e: 1 }, { n: "crayon", v: 4, e: 4 }, { n: "new pencil", v: 7, e: 7 }, { n: "sheet of notebook paper (the long side)", v: 11, e: 11 }, { n: "school ruler", v: 12, e: 12 }, { n: "classroom door", v: 80, e: 80 }],
};
const uw = (n, u) => `${n} ${u}`;

FAMILIES.length = {
  title: "Measure length",
  grades: [1, 2],
  defaults: { mode: "units" },
  gen(rng, params, { level = 1 } = {}) {
    const [N] = twoNames(rng);
    if (params.mode !== "estimate") {
      // grade 1: lengths in units
      const mode = rng.pick(level === 1 ? ["count", "compare", "count"] : level === 2 ? ["count", "compare", "diff"] : ["count", "diff", "compare"]);
      if (mode === "count") {
        const obj = rng.pick(LEN_THINGS);
        const rulerLen = level === 1 ? 10 : 12;
        const from = level === 3 ? rng.int(1, 4) : 0;
        const to = rng.int(from + 2, rulerLen - (level === 1 ? 1 : 0));
        const len = to - from;
        return finalize({
          family: "length",
          spec: { mode: "count", from, to, unit: "cm" },
          stem: T(`${N} puts a ${obj} next to a ruler. Each space is 1 cm.`, `${N} lines up a ${obj} with a ruler. Each space on the ruler is 1 cm.`, `${N} places a ${obj} against a ruler. Each space on the ruler measures 1 cm.`),
          ask: T(`How many cm long is the ${obj}?`, `How long is the ${obj}?`, `What is the length of the ${obj} in centimeters?`),
          expr: null,
          answer: { value: String(len), text: uw(len, "cm"), kind: "int", unit: "cm" },
          work: from === 0 ? [`The ${obj} starts at 0 and ends at ${to}.`, `Count the spaces, not the marks. There are ${len} spaces.`] : [`The ${obj} starts at ${from} and ends at ${to}.`, `Count the spaces from ${from} to ${to}.`, `${to} ${MINUS} ${from} = ${len}`],
          visual: { kind: "ruler", alt: `A ruler in centimeters with a ${obj} lined up against it.`, unit: "cm", length: rulerLen, objectFrom: from, objectTo: to },
          distractors: numDists(len, [{ v: to, m: from === 0 ? "counted-the-marks-instead-of-the-spaces" : "read-only-the-end-mark" }, { v: to + 1, m: "counted-the-marks-instead-of-the-spaces" }, { v: len - 1, m: "skipped-a-space" }, { v: from + to, m: "added-the-two-marks" }], { lo: 1, hi: 40, fmt: (v) => uw(v, "cm") }),
          hints: { conceptual: "Length is how far it is from one end to the other end. Count the spaces between marks.", procedural: "Find where the object starts and where it ends. Count how many spaces are in between." },
          level,
        });
      }
      if (mode === "compare") {
        const unit = rng.pick(UNIT_THINGS);
        const objs = rng.sample(LEN_THINGS, 4);
        const lens = rng.sample(Array.from({ length: level === 1 ? 9 : 14 }, (_, i) => i + 2), 4);
        const items = objs.map((name, i) => ({ name, len: lens[i] }));
        const which = rng.pick(["longest", "shortest"]);
        const sorted = items.slice().sort((p, q) => p.len - q.len);
        const target = which === "longest" ? sorted[3] : sorted[0];
        const sentences = (lv) => items.map((it) => (lv === "plain" ? `The ${it.name} is ${it.len} ${unit.many}.` : lv === "standard" ? `The ${it.name} is ${it.len} ${unit.many} long.` : `The ${it.name} measures ${it.len} ${unit.many} in length.`)).join(" ");
        const other = which === "longest" ? sorted[0] : sorted[3];
        const cands = [{ text: other.name, m: which === "longest" ? "picked-the-shortest-instead" : "picked-the-longest-instead" }];
        for (const it of items) if (it !== target && it !== other) cands.push({ text: it.name, m: it === items[0] ? "picked-the-first-one-listed" : "compared-the-numbers-wrongly" });
        for (const it of items) cands.push({ text: it.name, m: "compared-the-numbers-wrongly" });
        return finalize({
          family: "length",
          spec: { mode: "compare", items, which },
          stem: T(`${N} measures four things with ${unit.many}. ${sentences("plain")}`, `${N} measures four things in ${unit.many}. ${sentences("standard")}`, `${N} measures four objects using ${unit.many} as the unit. ${sentences("rich")}`),
          ask: T(`Which is the ${which}?`, `Which thing is the ${which}?`, `Which object is the ${which}?`),
          expr: null,
          answer: { value: target.name, text: target.name, kind: "text" },
          work: [`Compare the numbers. The ${which} has the ${which === "longest" ? "greatest" : "least"} number of ${unit.many}.`, `Order from shortest to longest: ${sorted.map((it) => `${it.name} (${it.len})`).join(", ")}.`],
          visual: null,
          distractors: textDists(target.name, cands, 3),
          hints: { conceptual: "All four things were measured with the same unit, so the numbers can be compared.", procedural: "Look at the four numbers. Find the biggest or smallest number, then find the name that goes with it." },
          level,
        });
      }
      // diff
      const unit = rng.pick(UNIT_THINGS);
      const [o1, o2] = rng.sample(LEN_THINGS, 2);
      const hiLen = level === 3 ? 20 : 14;
      const short = rng.int(3, hiLen - 3);
      const long = rng.int(short + 1, Math.min(hiLen, short + 8));
      const d = long - short;
      return finalize({
        family: "length",
        spec: { mode: "diff", long, short, unit: unit.many },
        stem: T(`The ${o1} is ${long} ${unit.many} long. The ${o2} is ${short} ${unit.many} long.`, `${N} measures two things. The ${o1} is ${long} ${unit.many} long and the ${o2} is ${short} ${unit.many} long.`, `${N} measures two objects with ${unit.many}. The ${o1} is ${long} ${unit.many} long, and the ${o2} is ${short} ${unit.many} long.`),
        ask: T(`How many ${unit.many} longer is the ${o1}?`, `How many ${unit.many} longer is the ${o1} than the ${o2}?`, `By how many ${unit.many} is the ${o1} longer than the ${o2}?`),
        expr: `${long} ${MINUS} ${short}`,
        answer: { value: String(d), text: uw(d, d === 1 ? unit.one : unit.many), kind: "int", unit: unit.many },
        work: [`Find how much longer: subtract the shorter length from the longer length.`, `${long} ${MINUS} ${short} = ${d}`],
        visual: null,
        distractors: numDists(d, [{ v: long + short, m: "added-the-two-lengths" }, { v: long, m: "gave-the-longer-length" }, { v: short, m: "gave-the-shorter-length" }], { lo: 1, hi: 40, fmt: (v) => uw(v, v === 1 ? unit.one : unit.many) }),
        hints: { conceptual: "How much longer means how much more. Find the difference between the two lengths.", procedural: "Line up the two lengths in your mind. Count on from the shorter one to the longer one." },
        level,
      });
    }
    // grade 2: read, estimate, diff, story
    const unit = rng.pick(level === 1 ? ["cm", "in"] : ["cm", "in", "cm"]);
    const mode = rng.pick(level === 1 ? ["read", "estimate", "read"] : level === 2 ? ["read", "estimate", "diff", "read"] : ["diff", "story", "read", "estimate"]);
    const word = unit === "cm" ? "cm" : "in";
    if (mode === "read") {
      const obj = rng.pick(LEN_THINGS);
      const rulerLen = unit === "cm" ? 15 : 12;
      const from = level === 1 ? 0 : rng.int(0, 4);
      const to = rng.int(from + 3, rulerLen);
      const len = to - from;
      return finalize({
        family: "length",
        spec: { mode: "read", from, to, unit },
        stem: T(`${N} measures a ${obj} with a ruler in ${unit === "cm" ? "centimeters" : "inches"}.`, `${N} measures a ${obj} with a ruler marked in ${unit === "cm" ? "centimeters" : "inches"}.`, `${N} uses a ruler marked in ${unit === "cm" ? "centimeters" : "inches"} to measure a ${obj}.`),
        ask: T(`How long is the ${obj}?`, `How long is the ${obj}? Use the ruler.`, `What is the length of the ${obj} to the nearest whole ${unit === "cm" ? "centimeter" : "inch"}?`),
        expr: null,
        answer: { value: String(len), text: uw(len, word), kind: "int", unit: word },
        work: from === 0 ? [`The ${obj} starts at 0 and ends at ${to}.`, `Its length is ${len} ${word}.`] : [`The ${obj} starts at ${from}, not at 0.`, `${to} ${MINUS} ${from} = ${len}`],
        visual: { kind: "ruler", alt: `A ruler in ${unit === "cm" ? "centimeters" : "inches"} with a ${obj} lined up against it.`, unit, length: rulerLen, objectFrom: from, objectTo: to },
        distractors: numDists(len, [{ v: to, m: from === 0 ? "read-the-wrong-mark" : "read-only-the-end-mark" }, { v: from + to, m: "added-the-two-marks" }, { v: len + 1, m: "counted-the-marks-instead-of-the-spaces" }, { v: len - 1, m: "skipped-a-space" }], { lo: 1, hi: 40, fmt: (v) => uw(v, word) }),
        hints: { conceptual: "A ruler measures from where the object starts to where it ends. If it does not start at 0, the end mark is not the length.", procedural: "Find the start mark and the end mark. Count the units between them." },
        level,
      });
    }
    if (mode === "estimate") {
      const b = rng.pick(BENCH[unit]);
      const e = b.e;
      const others = [e * 4, e * 10, e >= 8 ? Math.max(1, Math.round(e / 4)) : e * 25];
      const options = uniq([e, ...others]).filter((v) => v > 0);
      const cands = options.filter((v) => v !== e).map((v) => ({ v, m: v > e ? "chose-a-length-that-is-too-long" : "chose-a-length-that-is-too-short" }));
      return finalize({
        family: "length",
        spec: { mode: "estimate", object: b.n, unit, actual: b.v, options },
        stem: T(`${N} wants to estimate the length of a ${b.n}.`, `${N} wants to estimate the length of a ${b.n} in ${unit === "cm" ? "centimeters" : "inches"}.`, `${N} needs a reasonable estimate for the length of a ${b.n}, in ${unit === "cm" ? "centimeters" : "inches"}.`),
        ask: T(`Which is the best estimate?`, `Which length is the best estimate?`, `Which measurement is the most reasonable estimate?`),
        expr: null,
        answer: { value: String(e), text: uw(e, word), kind: "int", unit: word },
        work: [`Think of something you know well that is about the same size as a ${b.n}.`, `The best estimate is the one that is closest to the real length, which is about ${b.v} ${word}.`],
        visual: null,
        distractors: numDists(e, cands, { lo: 1, hi: 5000, fmt: (v) => uw(v, word), want: 3 }),
        hints: { conceptual: "An estimate is a sensible guess. Compare with something whose length you know.", procedural: "Picture the object next to your finger, a pencil, or a ruler. Ask: is it shorter, about the same, or longer?" },
        level,
      });
    }
    if (mode === "diff") {
      const mat = rng.pick(["ribbon", "rope", "string", "board"]);
      const [c1, c2] = rng.sample(["red", "blue", "green", "yellow", "white"], 2);
      const o1 = `${c1} ${mat}`;
      const o2 = `${c2} ${mat}`;
      const hiLen = level === 3 ? 60 : 30;
      const short = rng.int(5, hiLen - 8);
      const long = rng.int(short + 2, Math.min(hiLen, short + 20));
      const d = long - short;
      return finalize({
        family: "length",
        spec: { mode: "diff", long, short, unit: word },
        stem: T(`The ${o1} is ${long} ${word} long. The ${o2} is ${short} ${word} long.`, `The ${o1} is ${long} ${word} long. The ${o2} is ${short} ${word} long.`, `${N} measures the ${o1} and the ${o2}. The ${o1} is ${long} ${word} long, and the ${o2} is ${short} ${word} long.`),
        ask: T(`How much longer is the ${o1}?`, `How much longer is the ${o1} than the ${o2}?`, `What is the difference between the two lengths?`),
        expr: `${long} ${MINUS} ${short}`,
        answer: { value: String(d), text: uw(d, word), kind: "int", unit: word },
        work: [`Find the difference by subtracting the shorter length from the longer length.`, `${long} ${MINUS} ${short} = ${d}`],
        visual: null,
        distractors: numDists(d, [{ v: long + short, m: "added-the-two-lengths" }, { v: long, m: "gave-the-longer-length" }, { v: short, m: "gave-the-shorter-length" }], { lo: 1, hi: 200, fmt: (v) => uw(v, word) }),
        hints: { conceptual: "The difference tells how much longer one is than the other.", procedural: "Subtract the shorter length from the longer length, or count on from the shorter to the longer." },
        level,
      });
    }
    // story: add or take away lengths
    const op = rng.pick(["+", "-"]);
    const a = rng.int(12, 45);
    const d = rng.int(5, op === "+" ? 40 : a - 4);
    const x = op === "+" ? a + d : a - d;
    const obj = rng.pick(["ribbon", "string", "rope"]);
    return finalize({
      family: "length",
      spec: { mode: "story", a, d, op },
      stem: op === "+"
        ? T(`${N} has a ${obj} that is ${a} ${word} long. ${N} ties on another piece that is ${d} ${word} long.`, `${N} has a ${obj} that is ${a} ${word} long. ${N} ties on another piece that is ${d} ${word} long.`, `${N} has a ${obj} that is ${a} ${word} long, and ${N} joins another piece that is ${d} ${word} long to it.`)
        : T(`${N} has a ${obj} that is ${a} ${word} long. ${N} cuts off ${d} ${word}.`, `${N} has a ${obj} that is ${a} ${word} long. ${N} cuts off a piece that is ${d} ${word} long.`, `${N} has a ${obj} that is ${a} ${word} long. ${N} cuts off a piece that measures ${d} ${word}.`),
      ask: T(`How long is the ${obj} now?`, `How long is the ${obj} now?`, `What is the length of the ${obj} now?`),
      expr: `${a} ${op === "+" ? "+" : MINUS} ${d}`,
      answer: { value: String(x), text: uw(x, word), kind: "int", unit: word },
      work: [`${a} ${op === "+" ? "+" : MINUS} ${d} = ${x}`],
      visual: null,
      distractors: numDists(x, [{ v: op === "+" ? a - d : a + d, m: "used-the-wrong-operation" }, { v: a, m: "gave-the-first-length-only" }, { v: d, m: "gave-the-second-length-only" }], { lo: 1, hi: 200, fmt: (v) => uw(v, word) }),
      hints: { conceptual: "Joining pieces makes the length longer. Cutting a piece off makes it shorter.", procedural: "Decide if the length grows or shrinks. Then add or subtract the two lengths." },
      level,
    });
  },
  check(p, params) {
    const mode = params.mode ?? "units";
    const s = p.spec;
    if (mode === "units" && ["read", "estimate", "story"].includes(s.mode)) return `grade 2 mode ${s.mode} in a units skill`;
    if (mode === "estimate" && ["count", "compare"].includes(s.mode)) return `grade 1 mode ${s.mode} in an estimate skill`;
    return null;
  },
};

// ------------------------------------------------------------------------------------------------------------- clock
const pad2 = (m) => String(m).padStart(2, "0");
const clockText = (h, m) => `${h}:${pad2(m)}`;
const wrapHour = (h) => ((((h - 1) % 12) + 12) % 12) + 1;
function shiftTime(h, m, delta) {
  const total = (((h % 12) * 60 + m + delta) % 720 + 720) % 720;
  const hh = Math.floor(total / 60) % 12;
  return { h: hh === 0 ? 12 : hh, m: total % 60 };
}
function clockAlt(h, m) {
  const next = wrapHour(h + 1);
  const hourHand = m === 0 ? `The short hand points to ${h}.` : m < 30 ? `The short hand is just past ${h}.` : m === 30 ? `The short hand is halfway between ${h} and ${next}.` : `The short hand is almost at ${next}.`;
  return `An analog clock. ${hourHand} The long hand points to ${m === 0 ? 12 : m / 5}.`;
}

FAMILIES.clock = {
  title: "Tell time",
  grades: [1, 2],
  defaults: { step: 30 },
  gen(rng, params, { level = 1 } = {}) {
    const step = params.step;
    const [N] = twoNames(rng);
    const mins = step === 30 ? [0, 30] : level === 1 ? [0, 15, 30, 45] : Array.from({ length: 12 }, (_, i) => i * 5);
    const mode = rng.pick(step === 30 ? (level === 1 ? ["read", "read", "read"] : level === 2 ? ["read", "shift", "read"] : ["shift", "shift", "read"]) : level === 1 ? ["read", "read"] : level === 2 ? ["read", "shift", "read"] : ["shift", "elapsed", "shift", "read"]);
    const h = rng.int(1, 12);
    const m = rng.pick(mins);
    if (mode === "read") {
      const ans = clockText(h, m);
      const cands = [];
      const mh = m === 0 ? 12 : m / 5;
      cands.push({ text: clockText(mh, h * 5 % 60), m: "swapped-the-hour-hand-and-the-minute-hand" });
      cands.push({ text: clockText(wrapHour(h + 1), m), m: "read-the-hour-hand-as-the-next-hour" });
      cands.push({ text: clockText(h, mh), m: "read-the-minute-hand-number-as-minutes" });
      cands.push({ text: clockText(h, m === 0 ? 30 : 0), m: m === 0 ? "said-half-past-for-an-hour" : "ignored-the-minute-hand" });
      if (step === 5 && m >= 5) cands.push({ text: clockText(h, m - 5), m: "miscounted-by-fives" });
      cands.push({ text: clockText(h, (m + 5) % 60), m: "miscounted-by-fives" });
      return finalize({
        family: "clock",
        spec: { mode: "read", h, m },
        stem: T("Look at the clock.", "Look at the clock in the picture.", "Examine the analog clock in the picture."),
        ask: T("What time is it?", "What time does the clock show?", "What time does the analog clock show? Write it as digital time."),
        expr: null,
        answer: { value: ans, text: ans, kind: "text" },
        work: [m === 0 ? `The short hand points to ${h}, so the hour is ${h}.` : `The short hand is ${m < 30 ? "just past" : m === 30 ? "halfway past" : "almost at the next number after"} ${h}, so the hour is ${h}.`, m === 0 ? "The long hand points to 12, so there are 0 minutes." : `The long hand points to ${m / 5}. Count by 5s to find the minutes: ${m}.`],
        visual: { kind: "clock", alt: clockAlt(h, m), h, m, numerals: true },
        distractors: textDists(ans, cands, 4),
        hints: { conceptual: "The short hand tells the hour. The long hand tells the minutes.", procedural: "Read the hour from the short hand first. Then count the minutes by 5s from the 12 with the long hand." },
        level,
      });
    }
    if (mode === "elapsed") {
      const m1 = rng.pick([0, 5, 10, 15, 20, 25, 30]);
      const dd = rng.pick([10, 15, 20, 25, 30, 35, 40, 45].filter((x) => m1 + x < 60));
      const m2 = m1 + dd;
      return finalize({
        family: "clock",
        spec: { mode: "elapsed", h, m1, m2 },
        stem: T(`${N} starts at ${clockText(h, m1)}. ${N} stops at ${clockText(h, m2)}.`, `${N} starts a book at ${clockText(h, m1)} and stops reading at ${clockText(h, m2)}.`, `${N} begins reading at ${clockText(h, m1)} and stops at ${clockText(h, m2)}.`),
        ask: T("How many minutes pass?", "How many minutes did the reading take?", "How many minutes have passed between the two times?"),
        expr: null,
        answer: { value: String(dd), text: `${dd} minutes`, kind: "int", unit: "minutes" },
        work: [`Both times are in the same hour, so compare the minutes.`, `${m2} ${MINUS} ${m1} = ${dd}`],
        visual: null,
        distractors: numDists(dd, [{ v: m1 + m2, m: "added-the-two-times" }, { v: m2, m: "gave-only-the-end-minutes" }, { v: 60 - dd, m: "counted-the-minutes-left-in-the-hour" }], { lo: 1, hi: 120, fmt: (v) => `${v} minutes` }),
        hints: { conceptual: "Elapsed time is how much time goes by from the start to the end.", procedural: "The hour stays the same. Count on by 5s from the start minutes to the end minutes." },
        level,
      });
    }
    // shift
    const deltas = step === 30 ? (level === 2 ? [30, 60] : [30, 60, -30, -60]) : level === 2 ? [15, 30, 60] : [10, 15, 20, 25, 30, 45, 60, -15, -30, -60];
    const delta = rng.pick(deltas);
    const to = shiftTime(h, m, delta);
    const ans = clockText(to.h, to.m);
    const span = Math.abs(delta) === 60 ? "1 hour" : `${Math.abs(delta)} minutes`;
    const before = delta < 0;
    const cands = [];
    const opp = shiftTime(h, m, -delta);
    cands.push({ text: clockText(opp.h, opp.m), m: "went-the-wrong-direction" });
    cands.push({ text: clockText(wrapHour(h + (before ? -1 : 1)), m), m: "changed-the-hour-instead-of-the-minutes" });
    cands.push({ text: clockText(h, (((m + delta) % 60) + 60) % 60), m: "forgot-to-move-the-hour-hand" });
    const o1 = shiftTime(h, m, delta + (delta > 0 ? 5 : -5));
    cands.push({ text: clockText(o1.h, o1.m), m: "counted-five-minutes-too-many" });
    const o2 = shiftTime(h, m, delta + (delta > 0 ? -5 : 5));
    cands.push({ text: clockText(o2.h, o2.m), m: "counted-five-minutes-too-few" });
    return finalize({
      family: "clock",
      spec: { mode: "shift", h, m, delta },
      stem: T(`The clock shows when ${N} starts.`, `The clock shows the time ${N} starts a game.`, `The clock shows the time at which ${N} starts a game.`),
      ask: before ? T(`What time was it ${span} before?`, `What time was it ${span} before the start?`, `What time was it ${span} before ${N} started?`) : T(`What time is it ${span} later?`, `What time is it ${span} after the start?`, `What time is it ${span} after ${N} starts?`),
      expr: null,
      answer: { value: ans, text: ans, kind: "text" },
      work: [`Read the clock first: ${clockText(h, m)}.`, before ? `Go back ${span}.` : `Count on ${span}.`, Math.abs(delta) === 60 ? `1 hour changes the hour by 1 and the minutes stay the same.` : `Count by 5s or 15s to move the minutes. If you pass 12, the hour changes.`],
      visual: { kind: "clock", alt: clockAlt(h, m), h, m, numerals: true },
      distractors: textDists(ans, cands, 4),
      hints: { conceptual: "An hour is 60 minutes and a half hour is 30 minutes. When the minutes pass 60, the hour moves on.", procedural: "Read the time on the clock. Then count on (or back) in steps of 5 or 15 minutes." },
      level,
    });
  },
  check(p, params) {
    const step = params.step ?? 30;
    const s = p.spec;
    const ms = s.mode === "elapsed" ? [s.m1, s.m2] : [s.m];
    if (step === 30 && ms.some((x) => x % 30 !== 0)) return "minutes not on the hour or half hour";
    if (step === 5 && ms.some((x) => x % 5 !== 0)) return "minutes not a multiple of 5";
    if (step === 30 && s.mode === "elapsed") return "elapsed time in an hour/half-hour skill";
    if (s.mode === "shift" && step === 30 && Math.abs(s.delta) % 30 !== 0) return "shift not a multiple of 30";
    return null;
  },
};

// ------------------------------------------------------------------------------------------------------------ shapes
// straight = number of straight sides; curved = number of curved sides; corners follow from the shape.
const SHAPE_DATA = {
  triangle: { straight: 3, corners: 3, curved: 0 },
  square: { straight: 4, corners: 4, curved: 0, equal: true },
  rectangle: { straight: 4, corners: 4, curved: 0, equal: false },
  pentagon: { straight: 5, corners: 5, curved: 0 },
  hexagon: { straight: 6, corners: 6, curved: 0 },
  circle: { straight: 0, corners: 0, curved: 1 },
  "half-circle": { straight: 1, corners: 2, curved: 1 },
  "quarter-circle": { straight: 2, corners: 3, curved: 1 },
};
const SHAPE_NAMES = Object.keys(SHAPE_DATA);
const SHAPE_CLUE = {
  triangle: "I have 3 straight sides and 3 corners.",
  square: "I have 4 straight sides that are all the same length. I have 4 corners.",
  rectangle: "I have 4 straight sides and 4 corners. Two sides are long and two sides are short.",
  pentagon: "I have 5 straight sides and 5 corners.",
  hexagon: "I have 6 straight sides and 6 corners.",
  circle: "I have no corners and no straight sides. I am round.",
  "half-circle": "I have 1 straight side and 1 curved side.",
  "quarter-circle": "I have 2 straight sides and 1 curved side.",
};
const SHAPE_CLUE_RICH = {
  triangle: "I have exactly 3 straight sides and exactly 3 corners.",
  square: "I have exactly 4 straight sides, all of equal length, and exactly 4 corners.",
  rectangle: "I have exactly 4 straight sides and exactly 4 corners. My opposite sides are the same length, but my neighboring sides are not.",
  pentagon: "I have exactly 5 straight sides and exactly 5 corners.",
  hexagon: "I have exactly 6 straight sides and exactly 6 corners.",
  circle: "I have no corners and no straight sides. My edge is one smooth curve.",
  "half-circle": "I have exactly 1 straight side and exactly 1 curved side.",
  "quarter-circle": "I have exactly 2 straight sides and exactly 1 curved side.",
};
const COMPOSE = [
  { pieces: [{ shape: "half-circle", n: 2 }], result: "circle", say: "2 half-circles" },
  { pieces: [{ shape: "quarter-circle", n: 4 }], result: "circle", say: "4 quarter-circles" },
  { pieces: [{ shape: "quarter-circle", n: 2 }], result: "half-circle", say: "2 quarter-circles" },
  { pieces: [{ shape: "square", n: 2 }], result: "rectangle", say: "2 squares of the same size" },
];
const CUTS = [
  { shape: "square", cut: "diagonal", result: "triangle", say: "A square is cut along a line from one corner to the opposite corner. That makes 2 pieces." },
  { shape: "circle", cut: "half", result: "half-circle", say: "A circle is cut into 2 equal pieces." },
  { shape: "half-circle", cut: "half", result: "quarter-circle", say: "A half-circle is cut into 2 equal pieces." },
  { shape: "circle", cut: "quarters", result: "quarter-circle", say: "A circle is cut into 4 equal pieces." },
];
const shapePrio = (m) => (m === "confused-square-and-rectangle" ? 0 : m.startsWith("named") ? 1 : m === "mixed-up-the-curved-shapes" ? 2 : m === "miscounted-the-sides" ? 3 : 4);
const byPrio = (a, b) => shapePrio(a.m) - shapePrio(b.m);
function shapeTag(answer, other) {
  if ((answer === "square" && other === "rectangle") || (answer === "rectangle" && other === "square")) return "confused-square-and-rectangle";
  const curved = (x) => SHAPE_DATA[x].curved > 0;
  if (curved(answer) && curved(other)) return "mixed-up-the-curved-shapes";
  if (Math.abs(SHAPE_DATA[answer].straight - SHAPE_DATA[other].straight) === 1) return "miscounted-the-sides";
  return "chose-a-shape-with-a-different-number-of-sides";
}

FAMILIES.shapes = {
  title: "Shapes and their parts",
  grades: [1],
  defaults: {},
  gen(rng, params, { level = 1, ctx = "store" } = {}) {
    const [N] = twoNames(rng);
    const mode = rng.pick(level === 1 ? ["count", "attr", "count"] : level === 2 ? ["attr", "compose", "count", "cut"] : ["attr", "compose", "cut", "attr", "cut"]);
    if (mode === "count") {
      const shape = rng.pick(level === 1 ? ["triangle", "square", "rectangle", "circle"] : ["triangle", "square", "rectangle", "pentagon", "hexagon", "circle"]);
      const asked = rng.pick(["straight sides", "corners"]);
      const d = SHAPE_DATA[shape];
      const ans = asked === "corners" ? d.corners : d.straight;
      const cands = [{ v: ans + 1, m: "counted-one-extra" }, { v: Math.max(0, ans - 1), m: "skipped-one-while-counting" }];
      if (shape === "circle") cands.unshift({ v: 1, m: asked === "corners" ? "counted-the-curve-as-a-corner" : "counted-the-curve-as-a-side" });
      if (asked === "corners") cands.push({ v: d.straight + 1, m: "mixed-up-sides-and-corners" });
      return finalize({
        family: "shapes",
        spec: { mode: "count", shape, asked },
        stem: T("Look at the shape.", "Look at the shape in the picture.", "Examine the shape in the picture."),
        ask: T(`How many ${asked} does it have?`, `How many ${asked} does the shape have?`, `How many ${asked} does this shape have?`),
        expr: null,
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: shape === "circle" ? [`A circle has one curved edge. It has no straight sides and no corners.`] : [`Touch each ${asked === "corners" ? "corner" : "side"} once as you count.`, `The ${shape} has ${ans} ${asked}.`],
        visual: { kind: "shape", alt: `A ${shape}.`, name: shape },
        distractors: numDists(ans, cands, { lo: 0, hi: 12 }),
        hints: { conceptual: asked === "corners" ? "A corner is where two sides meet." : "A straight side is a flat edge. A curved edge is not a straight side.", procedural: "Touch each one as you count so you do not skip or count twice." },
        level,
      });
    }
    if (mode === "attr") {
      const shape = rng.pick(level === 1 ? ["triangle", "square", "rectangle", "circle"] : SHAPE_NAMES);
      const d = SHAPE_DATA[shape];
      const spec = { mode: "attr", straight: d.straight, curved: d.curved };
      if (d.straight === 4) spec.equal = d.equal;
      // a square is also a rectangle, so "rectangle" is never offered as a wrong answer for a square
      const cands = SHAPE_NAMES.filter((x) => x !== shape && !(shape === "square" && x === "rectangle")).map((x) => ({ text: x, m: shapeTag(shape, x) }));
      const pri = cands.sort(byPrio);
      return finalize({
        family: "shapes",
        spec,
        stem: T(SHAPE_CLUE[shape], SHAPE_CLUE[shape], SHAPE_CLUE_RICH[shape]),
        ask: T("What shape am I?", "What shape am I?", "Which shape is being described?"),
        expr: null,
        answer: { value: shape, text: shape, kind: "text" },
        work: [`Use the clues: count the sides and the corners, and check whether any side is curved.`, `The shape that fits every clue is the ${shape}.`],
        visual: null,
        distractors: textDists(shape, pri.filter((c) => (level === 1 ? ["triangle", "square", "rectangle", "circle", "pentagon"].includes(c.text) : true)), 3),
        hints: { conceptual: "Defining parts are things every shape of that kind has, such as how many sides.", procedural: "Match each clue to a shape. Cross out shapes that do not fit." },
        level,
      });
    }
    if (mode === "compose") {
      const c = rng.pick(COMPOSE);
      const cands = SHAPE_NAMES.filter((x) => x !== c.result).map((x) => ({ text: x, m: x === c.pieces[0].shape ? "named-a-piece-instead-of-the-new-shape" : shapeTag(c.result, x) }));
      cands.sort(byPrio);
      const touching = c.pieces[0].shape === "square" ? " side by side so that they touch along a whole side" : "";
      return finalize({
        family: "shapes",
        spec: { mode: "compose", pieces: c.pieces },
        stem: T(`${N} puts ${c.say} together${touching}.`, `${N} puts ${c.say} together${touching}.`, `${N} joins ${c.say}${touching}.`),
        ask: T("What new shape does that make?", `What new shape does ${N} make?`, "Which shape is formed?"),
        expr: null,
        answer: { value: c.result, text: c.result, kind: "text" },
        work: [`Picture the pieces joined together with no gaps.`, `${c.say} make a ${c.result}.`],
        visual: null,
        distractors: textDists(c.result, cands, 3),
        hints: { conceptual: "You can join shapes to make a new shape, and the new shape has its own name.", procedural: "Picture the pieces touching. Count the sides and corners of the new shape, or use paper pieces to try it." },
        level,
      });
    }
    const c = rng.pick(CUTS);
    const cands = SHAPE_NAMES.filter((x) => x !== c.result).map((x) => ({ text: x, m: x === c.shape ? "named-the-whole-instead-of-the-piece" : shapeTag(c.result, x) }));
    cands.sort(byPrio);
    return finalize({
      family: "shapes",
      spec: { mode: "cut", shape: c.shape, cut: c.cut },
      stem: c.say,
      ask: T("What shape is each piece?", "What shape is each piece?", "Which shape is each piece?"),
      expr: null,
      answer: { value: c.result, text: c.result, kind: "text" },
      work: [`Picture the ${c.shape} with the cut. Look at one piece.`, `Each piece is a ${c.result}.`],
      visual: { kind: "shape", alt: `A ${c.shape}.`, name: c.shape },
      distractors: textDists(c.result, cands, 3),
      hints: { conceptual: "Cutting a shape into equal pieces makes smaller shapes.", procedural: "Picture one piece by itself. Count its straight sides and its corners." },
      level,
    });
  },
};

// ----------------------------------------------------------------------------------------------------------- maketen
FAMILIES.maketen = {
  title: "Strategies: make ten and doubles",
  grades: [1],
  defaults: {},
  gen(rng, params, { level = 1 } = {}) {
    const [N] = twoNames(rng);
    const modes = level === 1 ? ["partner", "double", "partner", "sum"] : level === 2 ? ["sum", "near", "rest", "sum", "double"] : ["three", "near", "sum", "rest", "three"];
    const mode = rng.pick(modes);
    if (mode === "partner") {
      const a = rng.int(1, 9);
      const k = 10 - a;
      return finalize({
        family: "maketen",
        spec: { mode: "partner", a },
        stem: "",
        ask: T(`What number joins ${a} to make 10?`, `What number do you add to ${a} to make 10?`, `Which number must be added to ${a} to make 10?`),
        expr: `${a} + __ = 10`,
        answer: { value: String(k), text: String(k), kind: "int" },
        work: [`Count up from ${a} to 10.`, `${a} + ${k} = 10`],
        visual: { kind: "bond", alt: `Number bond. The whole is 10 and one part is ${a}. The other part is missing.`, whole: 10, a, b: k, hide: "b" },
        distractors: numDists(k, [{ v: a, m: "gave-the-same-number" }, { v: 10, m: "gave-the-total" }, { v: 10 + a, m: "added-to-ten-instead" }, { v: k + 1, m: "counted-from-the-wrong-number" }], { lo: 0, hi: 30 }),
        hints: { conceptual: "Pairs of numbers that make 10 are the building blocks of many strategies.", procedural: `Picture a ten frame with ${a} dots filled. Count the empty spaces.` },
        level,
      });
    }
    if (mode === "double" || mode === "near") {
      const n = rng.int(3, level === 1 ? 8 : 9);
      const a = n;
      const b = mode === "double" ? n : n + 1;
      const pair = rng.chance(0.5) ? [a, b] : [b, a];
      const total = a + b;
      const cands = mode === "double"
        ? [{ v: a * b, m: "multiplied-instead-of-added" }, { v: total + 1, m: "added-one-extra" }, { v: total - 1, m: "counted-one-too-few" }, { v: a, m: "gave-the-number-added-to-itself-once" }]
        : [{ v: total - 1, m: "forgot-the-extra-one" }, { v: total + 1, m: "added-the-extra-one-twice" }, { v: a * a + a + 1 + 0 === total ? total + 2 : (a + 1) * 2, m: "used-the-bigger-double" }, { v: a * b, m: "multiplied-instead-of-added" }];
      return finalize({
        family: "maketen",
        spec: { mode: "sum", strategy: mode, a: pair[0], b: pair[1] },
        stem: mode === "double" ? "" : T(`${N} knows ${a} + ${a}. Now ${N} solves ${pair[0]} + ${pair[1]}.`, `${N} knows the double ${a} + ${a}. ${N} wants to use it for ${pair[0]} + ${pair[1]}.`, `${N} knows the doubles fact ${a} + ${a} and wants to use it to solve ${pair[0]} + ${pair[1]}.`),
        ask: T(`What is ${pair[0]} + ${pair[1]}?`, `What is ${pair[0]} + ${pair[1]}?`, `Find the value of ${pair[0]} + ${pair[1]}.`),
        expr: `${pair[0]} + ${pair[1]}`,
        answer: { value: String(total), text: String(total), kind: "int" },
        work: mode === "double" ? [`Both numbers are the same, so this is a double.`, `${a} + ${a} = ${total}`] : [`${a} + ${a} = ${2 * a}. That is a double.`, `${b} is 1 more than ${a}, so add 1 more to the double.`, `${2 * a} + 1 = ${total}`],
        visual: null,
        distractors: numDists(total, cands, { lo: 1, hi: 100 }),
        hints: mode === "double"
          ? { conceptual: "A double adds the same number twice.", procedural: "Use a fact you know, like finger doubles or two matching ten frames." }
          : { conceptual: "Near doubles are one more or one less than a double you know.", procedural: "Find the double that is close. Then adjust by 1." },
        level,
      });
    }
    if (mode === "three") {
      const x = rng.int(1, 9);
      const y = 10 - x;
      const r = rng.int(2, 9);
      const nums = rng.shuffle([x, y, r]);
      const total = 10 + r;
      return finalize({
        family: "maketen",
        spec: { mode: "three", nums },
        stem: T(`${N} adds three numbers: ${nums.join(", ")}.`, `${N} adds three numbers: ${nums.join(", ")}. ${N} looks for two that make a ten.`, `${N} adds the three numbers ${nums.join(", ")} and looks for two that make a ten first.`),
        ask: T(`What is the total?`, `What is the total of the three numbers?`, `What is the sum of the three numbers?`),
        expr: nums.join(" + "),
        answer: { value: String(total), text: String(total), kind: "int" },
        work: [`Look for two numbers that make 10: ${x} + ${y} = 10`, `Add the third number: 10 + ${r} = ${total}`],
        visual: null,
        distractors: numDists(total, [{ v: total - 1, m: "counted-one-too-few" }, { v: total + 1, m: "counted-one-too-many" }, { v: 10, m: "stopped-at-ten" }, { v: x * y + r, m: "multiplied-two-numbers" }], { lo: 1, hi: 100 }),
        hints: { conceptual: "You can add in any order. Look for numbers that make 10 first.", procedural: "Find a pair that makes ten. Add them, then add the number that is left." },
        level,
      });
    }
    if (mode === "rest") {
      const a = rng.int(6, 9);
      const k = 10 - a;
      const b = rng.int(k + 1, 9);
      return finalize({
        family: "maketen",
        spec: { mode: "rest", a, b },
        stem: T(`To add ${a} + ${b}, ${N} makes a ten first. ${N} breaks ${b} into ${k} and another number.`, `To add ${a} + ${b}, ${N} makes a ten first. ${N} breaks ${b} into ${k} and another number.`, `To solve ${a} + ${b}, ${N} first makes a ten. ${N} decomposes ${b} into ${k} and another number.`),
        ask: T("What is the other number?", "What is the other number?", "What is the other number in the decomposition?"),
        expr: `${b} = ${k} + __`,
        answer: { value: String(b - k), text: String(b - k), kind: "int" },
        work: [`${a} + ${k} = 10, so ${k} is used to make the ten.`, `${b} ${MINUS} ${k} = ${b - k}`, `So ${b} = ${k} + ${b - k}.`],
        visual: null,
        distractors: numDists(b - k, [{ v: b, m: "gave-the-whole-number" }, { v: k, m: "repeated-the-number-given" }, { v: 10 - b, m: "found-the-partner-of-the-wrong-number" }, { v: a + b - 10 + 1, m: "off-by-one" }], { lo: 0, hi: 20 }),
        hints: { conceptual: "To make a ten, take just enough from the second number. What is left over still needs to be added.", procedural: "Subtract the part you used from the whole second number." },
        level,
      });
    }
    // sum by making a ten
    const a = rng.int(level === 1 ? 8 : 6, 9);
    const k = 10 - a;
    const b = rng.int(k + 1, level === 1 ? 6 : 9);
    const pair = rng.chance(0.7) ? [a, b] : [b, a];
    const total = a + b;
    return finalize({
      family: "maketen",
      spec: { mode: "sum", strategy: "maketen", a: pair[0], b: pair[1] },
      stem: T(`${N} adds ${pair[0]} + ${pair[1]} by making a ten.`, `${N} adds ${pair[0]} + ${pair[1]} by making a ten first.`, `${N} solves ${pair[0]} + ${pair[1]} using the make-a-ten strategy.`),
      ask: T(`What is ${pair[0]} + ${pair[1]}?`, `What is ${pair[0]} + ${pair[1]}?`, `Find the value of ${pair[0]} + ${pair[1]}.`),
      expr: `${pair[0]} + ${pair[1]}`,
      answer: { value: String(total), text: String(total), kind: "int" },
      work: [`Make a ten with the bigger number: ${a} needs ${k} more to make 10.`, `Take ${k} from ${b}: ${b} ${MINUS} ${k} = ${b - k}`, `${a} + ${k} = 10`, `10 + ${b - k} = ${total}`],
      visual: null,
      distractors: numDists(total, [{ v: 10 + b, m: "forgot-to-take-from-the-second-number" }, { v: 10, m: "stopped-at-ten" }, { v: total + 1, m: "counted-one-too-many" }, { v: total - 1, m: "counted-one-too-few" }], { lo: 1, hi: 100 }),
      hints: { conceptual: "Making a ten first turns a hard fact into an easy one: ten and some ones.", procedural: "Give the bigger number just enough from the other number to reach 10. Then add what is left." },
      level,
    });
  },
  check(p) {
    const s = p.spec;
    const total = s.mode === "partner" ? 10 : s.mode === "rest" ? s.a + s.b : s.mode === "three" ? s.nums.reduce((x, y) => x + y, 0) : s.a + s.b;
    return bad(total > 20, `sum ${total} above 20`);
  },
};

// ---------------------------------------------------------------------------------------------------------- expanded
const ONES_W = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS_W = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function numberWords(n) {
  const h = Math.floor(n / 100);
  const r = n % 100;
  const parts = [];
  if (h) parts.push(`${ONES_W[h]} hundred`);
  if (r) parts.push(r < 20 ? ONES_W[r] : TENS_W[Math.floor(r / 10)] + (r % 10 ? `-${ONES_W[r % 10]}` : ""));
  return parts.join(" ");
}
const termsOf = (list) => list.filter((v) => v > 0).join(" + ");

FAMILIES.expanded = {
  title: "Place value and expanded form",
  grades: [2],
  defaults: { max: 999 },
  gen(rng, params, { level = 1 } = {}) {
    const max = params.max;
    const hi = Math.min(max, level === 1 ? 599 : 999);
    const lo = 100;
    const modes = level === 1 ? ["blocks", "digit", "fromexp", "expanded"] : level === 2 ? ["digit", "expanded", "fromexp", "words2num", "num2words"] : ["tens-in", "expanded", "words2num", "num2words", "digit"];
    const mode = rng.pick(modes);
    const pick = (zeroOk, distinct) => {
      for (let i = 0; i < 400; i++) {
        const n = rng.int(lo, hi);
        const h = Math.floor(n / 100);
        const t = Math.floor((n % 100) / 10);
        const o = n % 10;
        if (!zeroOk && (t === 0 || o === 0)) continue;
        if (distinct && (h === t || t === o || h === o)) continue;
        return n;
      }
      return 357;
    };
    const dg = (n) => [Math.floor(n / 100), Math.floor((n % 100) / 10), n % 10];
    if (mode === "blocks") {
      const n = pick(false, true);
      const [h, t, o] = dg(n);
      return finalize({
        family: "expanded",
        spec: { mode: "blocks", h, t, o },
        stem: T("The picture shows hundreds, tens and ones.", "The picture shows hundreds flats, tens rods and ones cubes.", "The picture shows hundred-flats, ten-rods and unit cubes."),
        ask: T("What number is it?", "What number do the blocks show?", "What number do the blocks represent?"),
        expr: null,
        answer: { value: String(n), text: String(n), kind: "int" },
        work: [`${hw(h)} is ${h * 100}.`, `${tw(t)} is ${t * 10}.`, `${ow(o)} is ${o}.`, `${h * 100} + ${t * 10} = ${h * 100 + t * 10}`, `${h * 100 + t * 10} + ${o} = ${n}`],
        visual: { kind: "placevalue", alt: "Place value blocks: flats of one hundred, rods of ten and single cubes.", hundreds: h, tens: t, ones: o },
        distractors: numDists(n, [{ v: h + t + o, m: "added-the-digit-counts" }, { v: h * 100 + o * 10 + t, m: "swapped-the-tens-and-ones" }, { v: t * 100 + h * 10 + o, m: "put-the-digits-in-the-wrong-places" }, { v: Number(`${h}${t}`), m: "left-out-the-ones" }], { lo: 1, hi: 1000 }),
        hints: { conceptual: "A flat is 100, a rod is 10 and a cube is 1. The blocks are grouped by value.", procedural: "Count the flats by hundreds, the rods by tens and the cubes by ones. Then put the amounts together." },
        level,
      });
    }
    if (mode === "digit") {
      const n = pick(false, true);
      const [h, t, o] = dg(n);
      const place = rng.pick(["hundreds", "tens", "ones"]);
      const digit = place === "hundreds" ? h : place === "tens" ? t : o;
      const ans = place === "hundreds" ? h * 100 : place === "tens" ? t * 10 : o;
      const cands = [{ v: digit, m: "said-the-digit-not-its-value" }];
      if (place !== "hundreds") cands.push({ v: digit * 100, m: "used-the-hundreds-value" });
      if (place !== "tens") cands.push({ v: digit * 10, m: "used-the-tens-value" });
      cands.push({ v: n, m: "said-the-whole-number" });
      return finalize({
        family: "expanded",
        spec: { mode: "digit", n, place },
        stem: T(`Look at the number ${n}.`, `Look at the number ${n}.`, `Consider the number ${n}.`),
        ask: T(`What is the value of the digit in the ${place} place?`, `What is the value of the digit in the ${place} place?`, `What is the value of the digit that is in the ${place} place?`),
        expr: null,
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: [`The digit in the ${place} place is ${digit}.`, place === "hundreds" ? `${hw(digit)} = ${digit * 100}` : place === "tens" ? `${tw(digit)} = ${digit * 10}` : `${ow(digit)} = ${digit}`],
        visual: null,
        distractors: numDists(ans, cands, { lo: 0, hi: 1000 }),
        hints: { conceptual: "The value of a digit depends on its place, not just on the digit.", procedural: "Find the digit in that place. Say how many hundreds, tens or ones it stands for." },
        level,
      });
    }
    if (mode === "expanded") {
      const n = pick(level > 1, true);
      const [h, t, o] = dg(n);
      const correct = termsOf([h * 100, t * 10, o]);
      const cands = [
        { text: termsOf([h, t, o]), m: "wrote-the-digits-without-their-place-values" },
        { text: termsOf([h * 100, o * 10, t]), m: "swapped-the-tens-and-ones-values" },
        { text: termsOf([h * 10, t * 10, o]), m: "gave-the-hundreds-digit-the-tens-value" },
        { text: termsOf([h * 100, t * 100, o]), m: "gave-the-tens-digit-the-hundreds-value" },
        { text: termsOf([h * 100, t * 10, o * 10]), m: "gave-the-ones-digit-the-tens-value" },
        { text: termsOf([h * 100, t, o]), m: "gave-the-tens-digit-the-ones-value" },
        { text: termsOf([h, t * 10, o]), m: "gave-the-hundreds-digit-the-ones-value" },
      ];
      return finalize({
        family: "expanded",
        spec: { mode: "expanded", n },
        stem: T(`Look at the number ${n}.`, `Look at the number ${n}.`, `Consider the number ${n}.`),
        ask: T("Which is the expanded form?", "Which is the expanded form of the number?", "Which expression shows the expanded form of the number?"),
        expr: null,
        answer: { value: correct, text: correct, kind: "text" },
        work: [`Split ${n} by place value.`, h ? `${hw(h)} is ${h * 100}.` : "", t ? `${tw(t)} is ${t * 10}.` : "No tens.", o ? `${ow(o)} is ${o}.` : "No ones.", `Expanded form: ${correct}`].filter(Boolean),
        visual: null,
        distractors: textDists(correct, cands, 4),
        hints: { conceptual: "Expanded form shows the value of each digit, added together.", procedural: "Write the value of the hundreds digit, then the tens digit, then the ones digit, with plus signs between them." },
        level,
      });
    }
    if (mode === "fromexp") {
      const n = pick(level > 1, true);
      const [h, t, o] = dg(n);
      const parts = [h * 100, t * 10, o].filter((v) => v > 0);
      const shuffled = rng.shuffle(parts);
      const expr = shuffled.join(" + ");
      return finalize({
        family: "expanded",
        spec: { mode: "fromexp", parts: shuffled },
        stem: "",
        ask: T(`What number is ${expr}?`, `What number is ${expr}?`, `Which number is equal to ${expr}?`),
        expr,
        answer: { value: String(n), text: String(n), kind: "int" },
        work: [`Put the hundreds first, then the tens, then the ones.`, ...(h && t ? [`${h * 100} + ${t * 10} = ${h * 100 + t * 10}`] : []), `So the number is ${n}.`],
        visual: null,
        distractors: numDists(n, [{ v: h + t + o, m: "added-the-digits" }, { v: h * 100 + o * 10 + t, m: "swapped-the-tens-and-ones" }, { v: Number(`${h}${t === 0 ? "" : t}${o}`) === n ? n + 10 : Number(`${h}${t === 0 ? "" : t}${o}`), m: "dropped-a-zero-place" }, { v: o * 100 + t * 10 + h, m: "reversed-the-digits" }], { lo: 1, hi: 1000 }),
        hints: { conceptual: "Each number in the sum tells how much that place is worth.", procedural: "Match each part to hundreds, tens or ones. Write each digit in its own place." },
        level,
      });
    }
    if (mode === "words2num") {
      const n = pick(level > 1, false);
      const [h, t, o] = dg(n);
      const w = numberWords(n);
      return finalize({
        family: "expanded",
        spec: { mode: "words2num", words: w },
        stem: "",
        ask: T(`Which number is ${w}?`, `Which number is ${w}?`, `Which numeral shows the number ${w}?`),
        expr: null,
        answer: { value: String(n), text: String(n), kind: "int" },
        work: [`${ONES_W[h]} hundred is ${h * 100}.`, `The rest of the words say ${n - h * 100}.`, `${h * 100} + ${n - h * 100} = ${n}`],
        visual: null,
        distractors: numDists(n, [{ v: h * 100 + o * 10 + t, m: "swapped-the-tens-and-ones" }, { v: Number(`${h}00${String(n % 100).padStart(2, "0")}`), m: "wrote-each-word-as-its-own-number" }, { v: h * 10 + t * 1, m: "left-out-a-place" }, { v: h * 100 + t * 10 + (o + 1) % 10, m: "misread-a-number-word" }], { lo: 1, hi: 100000 }),
        hints: { conceptual: "Number words name hundreds, then tens, then ones.", procedural: "Write the digit for the hundreds, then the tens, then the ones. Use 0 for a place that is not named." },
        level,
      });
    }
    if (mode === "num2words") {
      const n = pick(level > 1, false);
      const [h, t, o] = dg(n);
      const correct = numberWords(n);
      const cands = [
        { text: numberWords(h * 100 + o * 10 + t), m: "swapped-the-tens-and-ones" },
        { text: numberWords(n + 10 <= 999 ? n + 10 : n - 10), m: "said-the-wrong-tens-word" },
        { text: numberWords(h * 100 + o), m: "left-out-the-tens" },
        { text: numberWords(h * 100 + t * 10), m: "left-out-the-ones" },
        { text: numberWords(t * 100 + h * 10 + o), m: "put-the-digits-in-the-wrong-places" },
        { text: numberWords(n + 100 <= 999 ? n + 100 : n - 100), m: "said-the-wrong-hundreds-word" },
      ];
      return finalize({
        family: "expanded",
        spec: { mode: "num2words", n },
        stem: "",
        ask: T(`How do you say ${n} in words?`, `Which shows ${n} in words?`, `Which phrase correctly names the number ${n}?`),
        expr: null,
        answer: { value: correct, text: correct, kind: "text" },
        work: [`${hw(h)} is ${ONES_W[h]} hundred.`, n % 100 ? `The last two digits say ${numberWords(n % 100)}.` : "There are no tens or ones.", `Put the words together: ${correct}.`],
        visual: null,
        distractors: textDists(correct, cands, 4),
        hints: { conceptual: "Say the hundreds first, then the tens and ones together.", procedural: "Read the digits from the left. Hundreds, then the two-digit part." },
        level,
      });
    }
    // tens-in
    const n = rng.int(11, Math.min(99, Math.floor(hi / 10))) * 10;
    return finalize({
      family: "expanded",
      spec: { mode: "tens-in", n },
      stem: "",
      ask: T(`How many tens are in ${n}?`, `How many tens make ${n}?`, `How many groups of ten are in ${n}?`),
      expr: null,
      answer: { value: String(n / 10), text: String(n / 10), kind: "int" },
      work: [`Count by 10s up to ${n}.`, `${tw(n / 10)} make ${n}, because ${n / 10} groups of 10 is ${n}.`],
      visual: null,
      distractors: numDists(n / 10, [{ v: Math.floor(n / 100), m: "counted-only-the-hundreds" }, { v: n % 100 === 0 ? 10 : (n % 100) / 10, m: "counted-only-the-tens-digit" }, { v: n, m: "said-the-number-itself" }, { v: n / 100 + (n % 100) / 10, m: "added-the-digits" }], { lo: 0, hi: 1000 }),
      hints: { conceptual: "10 tens is the same as 100. Every hundred is made of ten tens.", procedural: "Think about hundreds and tens separately: how many tens are in each hundred, and how many tens are left?" },
      level,
    });
  },
  check(p, params) {
    const max = params.max ?? 999;
    const s = p.spec;
    const n = s.mode === "blocks" ? s.h * 100 + s.t * 10 + s.o : s.mode === "fromexp" ? s.parts.reduce((a, b) => a + b, 0) : s.mode === "words2num" ? Number(p.answer.value) : s.n;
    return bad(n > max, `number ${n} above max ${max}`);
  },
};

// ------------------------------------------------------------------------------------------------------------- groups
const CONTAINERS = [{ one: "box", many: "boxes" }, { one: "bag", many: "bags" }, { one: "basket", many: "baskets" }, { one: "tray", many: "trays" }, { one: "jar", many: "jars" }];

FAMILIES.groups = {
  title: "Equal groups, repeated addition and arrays",
  grades: [2, 3],
  defaults: { max: 5, array: false },
  gen(rng, params, { level = 1, ctx = "store" } = {}) {
    const max = params.max;
    const fmax = [Math.max(2, Math.ceil(max * 0.5)), Math.max(3, Math.ceil(max * 0.8)), max][level - 1];
    const f = () => rng.int(2, Math.max(2, Math.min(fmax, max)));
    const t = thing(rng, ctx);
    const [N] = twoNames(rng);
    const cont = rng.pick(CONTAINERS);
    const m = t.many;
    const u = (x) => count(x, t);
    const arr = params.array;
    const modes = arr ? (level === 1 ? ["array-total", "groups", "array-total"] : level === 2 ? ["array-total", "array-div", "groups", "repadd", "skip"] : ["array-div", "groups-extra", "array-total", "array-div"]) : level === 1 ? ["groups", "repadd", "skip"] : level === 2 ? ["groups", "repadd", "skip", "groups"] : ["groups-extra", "groups", "repadd", "skip"];
    const mode = rng.pick(modes);
    if (mode === "groups") {
      const g = f();
      const p = f();
      const total = g * p;
      const visual = arr
        ? { kind: "array", alt: `An array of ${g} rows of ${p} counters.`, rows: g, cols: p, label: true }
        : { kind: "counters", alt: `${g} rows of ${p} counters. Each row is one ${cont.one}.`, n: total, perRow: p, shape: "circle" };
      return finalize({
        family: "groups",
        spec: { mode: "groups", groups: g, per: p },
        stem: T(`${N} has ${g} ${cont.many}. Each ${cont.one} has ${u(p)}.`, `${N} has ${g} ${cont.many} with ${u(p)} in each ${cont.one}.`, `${N} has ${g} ${cont.many}, and each ${cont.one} holds ${u(p)}.`),
        ask: T(`How many ${m} in all?`, `How many ${m} does ${N} have in all?`, `What is the total number of ${m}?`),
        expr: arr ? `${g} ${TIMES} ${p}` : null,
        answer: { value: String(total), text: String(total), kind: "int" },
        work: [`There are ${g} equal groups of ${p}.`, ...repAddLines(p, g), `${g} groups of ${p} is ${total}.`],
        visual,
        distractors: numDists(total, [{ v: g + p, m: "added-the-number-of-groups-and-the-size" }, { v: total + p, m: "counted-one-group-too-many" }, { v: total - p, m: "counted-one-group-too-few" }, { v: total + g, m: "added-an-extra-group-of-the-wrong-size" }], { lo: 1, hi: 200 }),
        hints: { conceptual: "Equal groups mean every group has the same number. Find how many altogether.", procedural: "Add the size of one group again and again, once for each group, or skip count." },
        level,
      });
    }
    if (mode === "array-total") {
      const r = f();
      const c = f();
      const total = r * c;
      return finalize({
        family: "groups",
        spec: { mode: "array-total", rows: r, cols: c },
        stem: T(`${N} makes an array of ${m}. It has ${r} rows. Each row has ${c}.`, `${N} makes an array of ${m} with ${r} rows and ${c} columns.`, `An array of ${m} has ${r} rows and ${c} columns.`),
        ask: T(`How many ${m} in all?`, `How many ${m} are in the array?`, `What is the total number of ${m} in the array?`),
        expr: `${r} ${TIMES} ${c}`,
        answer: { value: String(total), text: String(total), kind: "int" },
        work: [`Each of the ${r} rows has ${c}.`, ...repAddLines(c, r), `${r} rows of ${c} is ${total}.`],
        visual: { kind: "array", alt: `An array with ${r} rows and ${c} columns of ${m}.`, rows: r, cols: c, label: true },
        distractors: numDists(total, [{ v: r + c, m: "added-the-rows-and-the-columns" }, { v: total + c, m: "counted-one-row-too-many" }, { v: total - c, m: "counted-one-row-too-few" }, { v: total + r, m: "counted-one-column-too-many" }], { lo: 1, hi: 200 }),
        hints: { conceptual: "An array puts equal groups in rows and columns. Each row is one group.", procedural: "Count how many are in one row. Then count by that number for each row." },
        level,
      });
    }
    if (mode === "array-div") {
      const r = f();
      const c = f();
      const total = r * c;
      return finalize({
        family: "groups",
        spec: { mode: "array-div", total, rows: r },
        stem: T(`${N} puts ${u(total)} in ${r} equal rows.`, `${N} arranges ${u(total)} in ${r} equal rows.`, `${N} arranges ${u(total)} into ${r} rows with the same number in each row.`),
        ask: T("How many are in each row?", `How many ${m} are in each row?`, `How many ${m} are in each row?`),
        expr: `${total} ${DIVIDE} ${r}`,
        answer: { value: String(c), text: String(c), kind: "int" },
        work: [`${total} ${m} are shared equally into ${r} rows.`, `Think: ${r} ${TIMES} __ = ${total}.`, `${r} ${TIMES} ${c} = ${total}, so there are ${c} in each row.`],
        visual: null,
        distractors: numDists(c, [{ v: total - r, m: "subtracted-instead-of-sharing-equally" }, { v: total + r, m: "added-instead-of-sharing-equally" }, { v: r, m: "gave-the-number-of-rows" }, { v: c + 1, m: "off-by-one" }], { lo: 1, hi: 200 }),
        hints: { conceptual: "Equal rows share the total the same way. Each row gets the same number.", procedural: "Ask: how many times can I put the same number in each of the rows to reach the total? Try skip counting." },
        level,
      });
    }
    if (mode === "repadd") {
      const a = f();
      const times = rng.int(3, Math.max(3, Math.min(max, Math.max(fmax + 1, 3))));
      const total = a * times;
      const expr = Array.from({ length: times }, () => a).join(" + ");
      return finalize({
        family: "groups",
        spec: { mode: "repadd", addend: a, times },
        stem: "",
        ask: T(`What is ${expr}?`, `What is ${expr}?`, `Find the value of ${expr}.`),
        expr,
        answer: { value: String(total), text: String(total), kind: "int" },
        work: [`Add one ${a} at a time.`, ...repAddLines(a, times), `${times} groups of ${a} is ${total}.`],
        visual: null,
        distractors: numDists(total, [{ v: a + times, m: "added-the-number-and-the-count" }, { v: total - a, m: "added-one-time-too-few" }, { v: total + a, m: "added-one-time-too-many" }, { v: a * (times - 1) + 1, m: "stopped-adding-early" }], { lo: 1, hi: 200 }),
        hints: { conceptual: "Adding the same number again and again is the same as equal groups.", procedural: "Add the first two numbers. Then add the next number to your answer, one at a time." },
        level,
      });
    }
    if (mode === "skip") {
      const by = f();
      const len = rng.int(4, Math.max(4, Math.min(max, 6)));
      const blank = rng.int(3, len);
      const vals = Array.from({ length: len }, (_, i) => by * (i + 1));
      const shown = vals.map((v, i) => (i + 1 === blank ? "__" : String(v))).join(", ");
      const ans = vals[blank - 1];
      return finalize({
        family: "groups",
        spec: { mode: "skip", by, len, blank },
        stem: "",
        ask: T(`Count by ${by}s: ${shown}. What number is missing?`, `Count by ${by}s: ${shown}. What number goes in the blank?`, `Skip count by ${by}s: ${shown}. Which number is missing?`),
        expr: null,
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: [`Each number is ${by} more than the number before it.`, `${vals[blank - 2]} + ${by} = ${ans}`],
        visual: null,
        distractors: numDists(ans, [{ v: vals[blank - 2], m: "repeated-the-number-before" }, { v: ans + by, m: "skipped-ahead" }, { v: vals[blank - 2] + 1, m: "counted-by-ones-instead" }, { v: by + blank, m: "added-instead-of-skip-counting" }], { lo: 1, hi: 200 }),
        hints: { conceptual: "Skip counting adds the same number each time.", procedural: "Find how much the numbers jump by. Add that jump to the number before the blank." },
        level,
      });
    }
    // groups-extra: equal groups plus or minus a few
    const g = f();
    const p = f();
    const prod = g * p;
    const op = rng.pick(["+", "-"]);
    const e = rng.int(1, Math.max(1, Math.min(op === "+" ? max : prod - 1, max)));
    const total = op === "+" ? prod + e : prod - e;
    return finalize({
      family: "groups",
      spec: { mode: "groups-extra", groups: g, per: p, extra: e, op },
      stem: op === "+"
        ? T(`${N} has ${g} ${cont.many}. Each ${cont.one} has ${u(p)}. Then ${N} gets ${e} more.`, `${N} has ${g} ${cont.many} with ${u(p)} in each ${cont.one}. Then ${N} gets ${e} more.`, `${N} has ${g} ${cont.many}, and each ${cont.one} holds ${u(p)}. Later, ${N} gets ${e} more.`)
        : T(`${N} has ${g} ${cont.many}. Each ${cont.one} has ${u(p)}. Then ${N} gives ${e} away.`, `${N} has ${g} ${cont.many} with ${u(p)} in each ${cont.one}. Then ${N} gives away ${e}.`, `${N} has ${g} ${cont.many}, and each ${cont.one} holds ${u(p)}. Later, ${N} gives away ${e}.`),
      ask: T(`How many ${m} does ${N} have now?`, `How many ${m} does ${N} have now?`, `How many ${m} does ${N} have now?`),
      expr: null,
      answer: { value: String(total), text: String(total), kind: "int" },
      work: [`Find the number in the equal groups first: ${g} groups of ${p} is ${prod}.`, `${prod} ${op === "+" ? "+" : MINUS} ${e} = ${total}`],
      visual: null,
      distractors: numDists(total, [{ v: prod, m: "forgot-the-extra-step" }, { v: op === "+" ? prod - e : prod + e, m: "used-the-wrong-operation" }, { v: g + p + (op === "+" ? e : -e), m: "added-instead-of-making-equal-groups" }, { v: total + (op === "+" ? p : -p), m: "counted-one-group-too-many" }], { lo: 1, hi: 300 }),
      hints: { conceptual: "This story has two parts: equal groups first, then a change.", procedural: "Find how many there are in the equal groups. Then add or take away the change." },
      level,
    });
  },
  check(p, params) {
    const P = { max: 5, array: false, ...params };
    const s = p.spec;
    const fs = s.mode === "groups" ? [s.groups, s.per] : s.mode === "array-total" ? [s.rows, s.cols] : s.mode === "array-div" ? [s.rows, s.total / s.rows] : s.mode === "repadd" ? [s.addend, s.times] : s.mode === "skip" ? [s.by, s.len] : [s.groups, s.per, s.extra];
    if (fs.some((v) => v > P.max)) return `a factor is above max ${P.max}`;
    if (!P.array && (s.mode === "array-total" || s.mode === "array-div")) return "array problem when array:false";
    if (P.array && s.mode === "groups" && p.visual?.kind !== "array") return "array:true but not drawn as an array";
    return null;
  },
};
function repAddLines(a, times) {
  const lines = [];
  let run = a;
  for (let i = 1; i < times; i++) {
    lines.push(`${run} + ${a} = ${run + a}`);
    run += a;
  }
  return lines;
}

// ------------------------------------------------------------------------------------------------------------- money
const COINS = [
  { key: "b", one: "dollar bill", many: "dollar bills", v: 100 },
  { key: "q", one: "quarter", many: "quarters", v: 25 },
  { key: "d", one: "dime", many: "dimes", v: 10 },
  { key: "n", one: "nickel", many: "nickels", v: 5 },
  { key: "p", one: "penny", many: "pennies", v: 1 },
];
/** Money text and canonical value: under a dollar the answer is a whole number of cents ("85¢"), from a dollar up it is dollars ("$1.35"). */
function moneyFmt(cents) {
  if (cents < 100) return { text: `${cents}¢`, value: String(cents), kind: "int" };
  const v = (cents / 100).toFixed(2);
  return { text: `$${v}`, value: v, kind: "dec" };
}
const coinList = (c) => {
  const parts = COINS.filter((k) => c[k.key] > 0).map((k) => `${c[k.key]} ${c[k.key] === 1 ? k.one : k.many}`);
  if (parts.length <= 1) return parts.join("");
  return parts.length === 2 ? parts.join(" and ") : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
};
const coinChoice = (c) => COINS.filter((k) => c[k.key] > 0).map((k) => `${c[k.key]} ${c[k.key] === 1 ? k.one : k.many}`).join(", ");
const coinTotal = (c) => COINS.reduce((a, k) => a + (c[k.key] || 0) * k.v, 0);

FAMILIES.money = {
  title: "Count money",
  grades: [2],
  defaults: {},
  gen(rng, params, { level = 1, ctx = "store" } = {}) {
    const [N] = twoNames(rng);
    const t = thing(rng, ctx);
    const modes = level === 1 ? ["count", "count", "count"] : level === 2 ? ["count", "make", "need", "count"] : ["count", "change", "make", "need", "count"];
    const mode = rng.pick(modes);
    if (mode === "count") {
      const c = { b: 0, q: 0, d: 0, n: 0, p: 0 };
      if (level === 1) {
        const pair = rng.pick([["d", "p"], ["n", "p"], ["d", "n"]]);
        c[pair[0]] = rng.int(1, 4);
        c[pair[1]] = rng.int(1, 4);
      } else if (level === 2) {
        for (let i = 0; i < 400; i++) {
          c.q = rng.int(0, 3);
          c.d = rng.int(0, 3);
          c.n = rng.int(0, 2);
          c.p = rng.int(0, 4);
          const kinds = ["q", "d", "n", "p"].filter((k) => c[k] > 0).length;
          if (kinds >= 3 && coinTotal(c) < 100) break;
        }
      } else {
        c.b = rng.int(1, 2);
        c.q = rng.int(0, 3);
        c.d = rng.int(0, 3);
        c.n = rng.int(0, 2);
        c.p = rng.int(0, 4);
        if (c.q + c.d + c.n + c.p === 0) c.q = 2;
      }
      const total = coinTotal(c);
      const list = coinList(c);
      const f = moneyFmt(total);
      const order = COINS.filter((k) => c[k.key] > 0);
      const work = [];
      let run = 0;
      order.forEach((k, i) => {
        const sub = c[k.key] * k.v;
        work.push(c[k.key] === 1 ? `1 ${k.one} is ${k.v}¢.` : `${c[k.key]} ${k.many}: ${c[k.key]} ${TIMES} ${k.v} = ${sub}¢`);
        if (i > 0) work.push(`${run} + ${sub} = ${run + sub}`);
        run += sub;
      });
      work.push(total >= 100 ? `${total}¢ is the same as ${f.text}.` : `The total is ${total}¢.`);
      const cands = [];
      cands.push({ cents: Object.keys(c).reduce((a, k) => a + c[k], 0), m: "counted-each-coin-as-one-cent" });
      const asDimes = { ...c };
      if (c.n) cands.push({ cents: total + c.n * 5, m: "counted-a-nickel-as-a-dime" });
      if (c.d) cands.push({ cents: total - c.d * 5, m: "counted-a-dime-as-a-nickel" });
      if (c.q) cands.push({ cents: total - c.q * 5, m: "counted-a-quarter-as-twenty" });
      if (c.p) cands.push({ cents: total - c.p + 0 === total ? total + 1 : total - c.p, m: "left-out-the-pennies" });
      cands.push({ cents: total + 10, m: "added-an-extra-ten" }, { cents: total + 5, m: "counted-five-too-many" }, { cents: total - 5, m: "counted-five-too-few" });
      const dists = [];
      const seen = new Set([f.text]);
      for (const cd of cands) {
        if (cd.cents <= 0) continue;
        const tx = moneyFmt(cd.cents).text;
        if (seen.has(tx)) continue;
        seen.add(tx);
        dists.push({ text: tx, misconception: cd.m });
        if (dists.length === 4) break;
      }
      const visual = level === 1
        ? { kind: "table", alt: "A table that lists each kind of coin, what it is worth, and how many there are.", headers: ["Coin", "Worth", "How many"], rows: order.map((k) => [k.one, `${k.v}¢`, String(c[k.key])]), caption: "Coins" }
        : null;
      return finalize({
        family: "money",
        spec: { mode: "count", coins: c },
        stem: T(`${N} has ${list}.`, `${N} has ${list} in a jar.`, `${N} counts ${list}.`),
        ask: T("How much money is that?", `How much money does ${N} have?`, "What is the total value of the money?"),
        expr: null,
        answer: { value: f.value, text: f.text, kind: f.kind },
        work,
        visual,
        distractors: dists,
        hints: { conceptual: "Each coin is worth a different amount. A dime is not worth the same as a penny.", procedural: "Start with the coin that is worth the most. Count on by that coin, then the next coin." },
        level,
      });
    }
    if (mode === "need") {
      const have = rng.int(3, 15) * 5;
      const cost = have + rng.int(2, 12) * 5;
      const d = cost - have;
      const f = moneyFmt(d);
      const item = rng.pick(["toy", "book", "kite", "game", "puzzle"]);
      const dists = [];
      const seen = new Set([f.text]);
      for (const [cents, m] of [[have + cost, "added-the-two-amounts"], [cost, "gave-the-cost"], [d + 10, "counted-ten-too-many"], [d - 5, "counted-five-too-few"], [d + 5, "counted-five-too-many"]]) {
        if (cents <= 0) continue;
        const tx = moneyFmt(cents).text;
        if (seen.has(tx)) continue;
        seen.add(tx);
        dists.push({ text: tx, misconception: m });
        if (dists.length === 4) break;
      }
      return finalize({
        family: "money",
        spec: { mode: "need", cost, have },
        stem: T(`A ${item} costs ${moneyFmt(cost).text}. ${N} has ${moneyFmt(have).text}.`, `A ${item} costs ${moneyFmt(cost).text}. ${N} has ${moneyFmt(have).text}.`, `A ${item} costs ${moneyFmt(cost).text}, and ${N} has ${moneyFmt(have).text}.`),
        ask: T(`How much more does ${N} need?`, `How much more money does ${N} need?`, `How much more money does ${N} need to buy the ${item}?`),
        expr: null,
        answer: { value: f.value, text: f.text, kind: f.kind },
        work: [`Find the difference: ${cost} ${MINUS} ${have} = ${d}`, `${N} needs ${d}¢ more.`],
        visual: null,
        distractors: dists,
        hints: { conceptual: "How much more means the difference between the price and the money you have.", procedural: "Count up from the money you have to the price. Use nickels or dimes to jump." },
        level,
      });
    }
    if (mode === "change") {
      const paidBills = rng.pick([1, 2]);
      const paid = paidBills * 100;
      const cost = paid - rng.int(1, 19) * 5 - (rng.chance(0.4) ? rng.int(1, 4) : 0);
      const costC = Math.max(5, cost);
      const ch = paid - costC;
      const f = moneyFmt(ch);
      const dists = [];
      const seen = new Set([f.text]);
      for (const [cents, m] of [[paid + costC, "added-the-price-and-the-money-paid"], [costC, "gave-the-price"], [ch + 10, "counted-ten-too-many"], [ch - 10, "counted-ten-too-few"], [ch + 5, "counted-five-too-many"]]) {
        if (cents <= 0) continue;
        const tx = moneyFmt(cents).text;
        if (seen.has(tx)) continue;
        seen.add(tx);
        dists.push({ text: tx, misconception: m });
        if (dists.length === 4) break;
      }
      const priceText = moneyFmt(costC).text;
      const paidText = paidBills === 1 ? "1 dollar bill" : "2 dollar bills";
      return finalize({
        family: "money",
        spec: { mode: "change", cost: costC, paid },
        stem: T(`A ${t.one} costs ${priceText}. ${N} pays with ${paidText}.`, `A ${t.one} costs ${priceText}. ${N} pays with ${paidText}.`, `A ${t.one} costs ${priceText}, and ${N} pays with ${paidText}.`),
        ask: T(`How much change does ${N} get?`, `How much change does ${N} get back?`, `How much change should ${N} receive?`),
        expr: null,
        answer: { value: f.value, text: f.text, kind: f.kind },
        work: [`${N} pays ${paid}¢.`, `The change is what is left after paying the price: ${paid} ${MINUS} ${costC} = ${ch}`, ch >= 100 ? `${ch}¢ is ${f.text}.` : `The change is ${ch}¢.`],
        visual: null,
        distractors: dists,
        hints: { conceptual: "Change is the money you get back when you pay more than the price.", procedural: "Count up from the price to the amount paid. Use pennies, then nickels and dimes, then a dollar." },
        level,
      });
    }
    // make: choose the coins that make an amount
    const mk = { b: 0, q: rng.int(0, 2), d: rng.int(0, 3), n: rng.int(0, 2), p: rng.int(0, 4) };
    for (let i = 0; i < 400; i++) {
      mk.q = rng.int(0, 2);
      mk.d = rng.int(0, 3);
      mk.n = rng.int(0, 2);
      mk.p = rng.int(0, 4);
      const kinds = ["q", "d", "n", "p"].filter((k) => mk[k] > 0).length;
      if (kinds >= 2 && coinTotal(mk) >= 15 && coinTotal(mk) < (level === 2 ? 60 : 100)) break;
    }
    const target = coinTotal(mk);
    const variants = [];
    const push = (c, m) => {
      if (coinTotal(c) !== target && coinTotal(c) > 0) variants.push({ c, m });
    };
    if (mk.n > 0) push({ ...mk, n: mk.n - 1, d: mk.d + 1 }, "counted-a-nickel-as-a-dime");
    if (mk.d > 0) push({ ...mk, d: mk.d - 1, n: mk.n + 1 }, "counted-a-dime-as-a-nickel");
    if (mk.q > 0) push({ ...mk, q: mk.q - 1, d: mk.d + 2 }, "counted-a-quarter-as-two-dimes");
    if (mk.p > 0) push({ ...mk, p: mk.p - 1 }, "left-out-a-penny");
    push({ ...mk, p: mk.p + 1 }, "added-an-extra-penny");
    push({ ...mk, n: mk.n + 1 }, "added-an-extra-nickel");
    push({ ...mk, d: mk.d + 1 }, "added-an-extra-dime");
    const correctText = coinChoice(mk);
    const texts = new Set([correctText]);
    const options = [{ ...mk }];
    const dists = [];
    for (const v of variants) {
      const tx = coinChoice(v.c);
      if (texts.has(tx)) continue;
      texts.add(tx);
      options.push({ ...v.c });
      dists.push({ text: tx, misconception: v.m });
      if (dists.length === 3) break;
    }
    return finalize({
      family: "money",
      spec: { mode: "make", target, options: rng.shuffle(options) },
      stem: T(`${N} needs exactly ${moneyFmt(target).text}.`, `${N} needs exactly ${moneyFmt(target).text} to buy a snack.`, `${N} needs exactly ${moneyFmt(target).text} to buy a snack.`),
      ask: T("Which coins make that amount?", "Which set of coins makes that amount?", "Which set of coins has a total value equal to that amount?"),
      expr: null,
      answer: { value: correctText, text: correctText, kind: "text" },
      work: [`Find the value of each set of coins. Count on from the coin worth the most.`, `Only one set is worth ${target}¢: ${correctText}.`],
      visual: null,
      distractors: dists,
      hints: { conceptual: "A quarter is worth 25 cents, a dime is worth 10 cents, and a nickel is worth 5 cents.", procedural: "Find the total for each set of coins. Look for the set that matches the amount." },
      level,
    });
  },
};

// ----------------------------------------------------------------------------------------------------------- bargraph
const vt = (n) => `${n} ${n === 1 ? "vote" : "votes"}`;
const GRAPH_TOPICS = [
  { title: "Favorite fruit", what: "favorite fruit", cats: ["apples", "bananas", "grapes", "pears", "oranges"] },
  { title: "Favorite pet", what: "favorite pet", cats: ["dogs", "cats", "fish", "birds", "rabbits"] },
  { title: "Favorite color", what: "favorite color", cats: ["red", "blue", "green", "yellow", "orange"] },
  { title: "Favorite sport", what: "favorite sport", cats: ["soccer", "swimming", "baseball", "tag", "basketball"] },
  { title: "Favorite snack", what: "favorite snack", cats: ["popcorn", "crackers", "cheese", "carrots", "raisins"] },
  { title: "Favorite season", what: "favorite season", cats: ["summer", "winter", "spring", "fall"] },
];

FAMILIES.bargraph = {
  title: "Picture graphs and bar graphs",
  grades: [2],
  defaults: { picture: true },
  gen(rng, params, { level = 1 } = {}) {
    const topic = rng.pick(GRAPH_TOPICS);
    const k = level <= 2 ? 4 : Math.min(5, topic.cats.length);
    const vmax = level === 1 ? 7 : level === 2 ? 9 : 12;
    const cats = rng.sample(topic.cats, k);
    const values = rng.sample(Array.from({ length: vmax }, (_, i) => i + 1), k);
    const pic = !!params.picture;
    const label = pic ? "picture graph" : "bar graph";
    const data = cats.map((c, i) => `${c} ${values[i]}`).join(", ");
    const visual = { kind: "bar", alt: `A ${label} of the class votes for ${topic.what}: ${data}.`, title: topic.title, cats: cats.map(cap), values, scale: 1, orient: "v", picture: pic, unit: "votes", axisLabel: "Votes" };
    const stem = T(`The class voted on a ${topic.what}. The graph shows the votes.`, `The class voted on a ${topic.what}. The ${label} shows the votes.`, `Students voted on a ${topic.what}, and the ${label} displays the results.`);
    const modes = level === 1 ? ["howmany", "most", "howmany", "least"] : level === 2 ? ["howmany", "diff", "total", "most", "diff"] : ["diff", "pair", "diff2", "least", "total"];
    const mode = rng.pick(modes);
    const idx = rng.shuffle(cats.map((_, i) => i));
    const sorted = cats.map((c, i) => ({ c, v: values[i] })).sort((a, b) => a.v - b.v);
    const total = sum(values);
    const base = { family: "bargraph", stem, expr: null, visual, level };
    const readDists = (i, ans) => {
      const out = [];
      for (let j = 0; j < k; j++) if (j !== i) out.push({ v: values[j], m: "read-the-wrong-category" });
      return [{ v: ans + 1, m: "miscounted-the-pictures-or-bar" }, { v: ans - 1, m: "miscounted-the-pictures-or-bar" }, ...out];
    };
    if (mode === "howmany") {
      const i = idx[0];
      const ans = values[i];
      return finalize({
        ...base,
        spec: { mode: "howmany", cats, values, cat: cats[i] },
        ask: T(`How many votes did ${cats[i]} get?`, `How many votes did ${cats[i]} get?`, `How many students voted for ${cats[i]}?`),
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: [`Find ${cats[i]} on the graph.`, `Count the ${pic ? "pictures" : "units of the bar"} for ${cats[i]}: there are ${ans}.`],
        distractors: numDists(ans, [{ v: ans + 1, m: "miscounted-the-pictures-or-bar" }, { v: ans - 1, m: "miscounted-the-pictures-or-bar" }, ...readDists(i, ans).slice(2)], { lo: 0, hi: 30 }),
        hints: { conceptual: "Each picture or each unit on the bar stands for one vote.", procedural: "Find the right category. Count one at a time, or read the number at the top of the bar." },
      });
    }
    if (mode === "most" || mode === "least") {
      const target = mode === "most" ? sorted[k - 1] : sorted[0];
      const opposite = mode === "most" ? sorted[0] : sorted[k - 1];
      const cands = [{ text: opposite.c, m: mode === "most" ? "picked-the-least-instead-of-the-most" : "picked-the-most-instead-of-the-least" }];
      for (const x of sorted) if (x !== target && x !== opposite) cands.push({ text: x.c, m: "compared-the-wrong-categories" });
      return finalize({
        ...base,
        spec: { mode, cats, values },
        ask: mode === "most" ? T("Which got the most votes?", "Which choice got the most votes?", "Which category received the greatest number of votes?") : T("Which got the fewest votes?", "Which choice got the fewest votes?", "Which category received the least number of votes?"),
        answer: { value: target.c, text: target.c, kind: "text" },
        work: [`Compare the ${pic ? "rows of pictures" : "bars"}.`, `${target.c} has ${vt(target.v)}. That is the ${mode === "most" ? "most" : "fewest"}.`],
        distractors: textDists(target.c, cands, 3),
        hints: { conceptual: mode === "most" ? "The most votes means the longest bar or the longest row of pictures." : "The fewest votes means the shortest bar or the shortest row of pictures.", procedural: "Look at every category. Compare how long each one is." },
      });
    }
    if (mode === "diff") {
      const [x, y] = [{ c: cats[idx[0]], v: values[idx[0]] }, { c: cats[idx[1]], v: values[idx[1]] }];
      const big = x.v > y.v ? x : y;
      const small = x.v > y.v ? y : x;
      const d = big.v - small.v;
      const moreQ = rng.chance(0.5);
      return finalize({
        ...base,
        spec: { mode: "diff", cats, values, a: big.c, b: small.c },
        ask: moreQ ? T(`How many more votes did ${big.c} get than ${small.c}?`, `How many more votes did ${big.c} get than ${small.c}?`, `By how many votes did ${big.c} beat ${small.c}?`) : T(`How many fewer votes did ${small.c} get than ${big.c}?`, `How many fewer votes did ${small.c} get than ${big.c}?`, `By how many votes did ${small.c} fall short of ${big.c}?`),
        answer: { value: String(d), text: String(d), kind: "int" },
        work: [`${big.c} has ${vt(big.v)} and ${small.c} has ${vt(small.v)}.`, `${big.v} ${MINUS} ${small.v} = ${d}`],
        distractors: numDists(d, [{ v: big.v + small.v, m: "added-instead-of-comparing" }, { v: big.v, m: "gave-the-bigger-number" }, { v: small.v, m: "gave-the-smaller-number" }], { lo: 0, hi: 40 }),
        hints: { conceptual: "How many more asks for the difference between two numbers.", procedural: "Read both numbers from the graph. Subtract the smaller from the larger, or count how many extra there are." },
      });
    }
    if (mode === "total") {
      return finalize({
        ...base,
        spec: { mode: "total", cats, values },
        ask: T("How many votes were there in all?", "How many votes were there in all?", "How many votes were cast altogether?"),
        answer: { value: String(total), text: String(total), kind: "int" },
        work: [`Read the number for each category: ${values.join(", ")}.`, ...repAddSteps(values), `The total is ${total}.`],
        distractors: numDists(total, [{ v: total - Math.min(...values), m: "left-out-a-category" }, { v: Math.max(...values), m: "gave-the-biggest-category-only" }, { v: total + 1, m: "miscounted-the-pictures-or-bar" }, { v: total - 1, m: "miscounted-the-pictures-or-bar" }], { lo: 0, hi: 80 }),
        hints: { conceptual: "In all means all the categories put together.", procedural: "Read each number from the graph. Add them one at a time." },
      });
    }
    if (mode === "pair") {
      const [a, b] = [idx[0], idx[1]];
      const ans = values[a] + values[b];
      return finalize({
        ...base,
        spec: { mode: "pair", cats, values, a: cats[a], b: cats[b] },
        ask: T(`How many votes did ${cats[a]} and ${cats[b]} get together?`, `How many votes did ${cats[a]} and ${cats[b]} get together?`, `What is the total number of votes for ${cats[a]} and ${cats[b]}?`),
        answer: { value: String(ans), text: String(ans), kind: "int" },
        work: [`${cats[a]} has ${vt(values[a])} and ${cats[b]} has ${vt(values[b])}.`, `${values[a]} + ${values[b]} = ${ans}`],
        distractors: numDists(ans, [{ v: Math.abs(values[a] - values[b]), m: "subtracted-instead-of-added" }, { v: total, m: "added-every-category" }, { v: Math.max(values[a], values[b]), m: "gave-the-bigger-number" }], { lo: 0, hi: 80 }),
        hints: { conceptual: "Together means the votes for the two categories are put together.", procedural: "Read the two numbers you need. Ignore the other categories. Then add." },
      });
    }
    // diff2: two categories together compared with the other two
    const four = rng.sample(cats.map((_, i) => i), 4);
    const left = values[four[0]] + values[four[1]];
    const right = values[four[2]] + values[four[3]];
    if (left === right) return FAMILIES.bargraph.gen(rng, params, { level });
    const [gl, gr, big, small] = left > right ? [[four[0], four[1]], [four[2], four[3]], left, right] : [[four[2], four[3]], [four[0], four[1]], right, left];
    const d = big - small;
    return finalize({
      ...base,
      spec: { mode: "diff2", cats, values, bigPair: [cats[gl[0]], cats[gl[1]]], smallPair: [cats[gr[0]], cats[gr[1]]] },
      ask: T(`Did ${cats[gl[0]]} and ${cats[gl[1]]} together get more votes than ${cats[gr[0]]} and ${cats[gr[1]]} together? How many more?`, `How many more votes did ${cats[gl[0]]} and ${cats[gl[1]]} get together than ${cats[gr[0]]} and ${cats[gr[1]]} together?`, `By how many votes do ${cats[gl[0]]} and ${cats[gl[1]]} together exceed ${cats[gr[0]]} and ${cats[gr[1]]} together?`),
      answer: { value: String(d), text: String(d), kind: "int" },
      work: [`${cats[gl[0]]} and ${cats[gl[1]]}: ${values[gl[0]]} + ${values[gl[1]]} = ${big}`, `${cats[gr[0]]} and ${cats[gr[1]]}: ${values[gr[0]]} + ${values[gr[1]]} = ${small}`, `${big} ${MINUS} ${small} = ${d}`],
      distractors: numDists(d, [{ v: big + small, m: "added-the-two-totals" }, { v: big, m: "gave-the-bigger-total" }, { v: small, m: "gave-the-smaller-total" }], { lo: 0, hi: 80 }),
      hints: { conceptual: "There are two steps: put each pair together first, then compare the two totals.", procedural: "Add the first pair. Add the second pair. Then subtract the smaller total from the larger." },
    });
  },
  check(p, params) {
    const pic = params.picture ?? true;
    if (p.visual?.kind !== "bar") return "no bar visual";
    return bad(!!p.visual.picture !== !!pic, `picture:${pic} but the graph is drawn with picture:${p.visual.picture}`);
  },
};
function repAddSteps(values) {
  const out = [];
  let run = values[0];
  for (let i = 1; i < values.length; i++) {
    out.push(`${run} + ${values[i]} = ${run + values[i]}`);
    run += values[i];
  }
  return out;
}

// ------------------------------------------------------------------------------------------------------------ partition
const SHARE = { 2: { one: "half", many: "halves" }, 3: { one: "third", many: "thirds" }, 4: { one: "fourth", many: "fourths" } };
const WHOLES = { circle: ["pizza", "pie", "cookie"], rect: ["sandwich", "granola bar", "tray of brownies"] };
const shapeWord = (sh) => (sh === "circle" ? "circle" : "rectangle");

FAMILIES.partition = {
  title: "Partition shapes into equal shares",
  grades: [2],
  defaults: {},
  gen(rng, params, { level = 1 } = {}) {
    const [N] = twoNames(rng);
    const shape = rng.pick(["circle", "rect"]);
    const noun = rng.pick(WHOLES[shape]);
    const parts = level === 1 ? rng.pick([2, 4, 2, 4, 3]) : rng.pick([2, 3, 4]);
    const modes = level === 1 ? ["count", "name", "count"] : level === 2 ? ["name", "count", "whole-as", "whichcut"] : ["left", "whichcut", "whole-as", "left", "name"];
    const mode = rng.pick(modes);
    const nameOf = (n) => `one ${SHARE[n].one}`;
    if (mode === "count") {
      const shaded = rng.int(1, parts - 1);
      return finalize({
        family: "partition",
        spec: { mode: "count", shape, parts, shaded },
        stem: T(`Look at the ${shapeWord(shape)}. It is cut into equal shares.`, `Look at the ${shapeWord(shape)} in the picture. It is cut into equal shares.`, `The ${shapeWord(shape)} in the picture is partitioned into equal shares.`),
        ask: T("How many equal shares are there?", "How many equal shares does the shape have?", "Into how many equal shares is the shape partitioned?"),
        expr: null,
        answer: { value: String(parts), text: String(parts), kind: "int" },
        work: [`Count every share, shaded and not shaded.`, `There are ${parts} equal shares.`],
        visual: { kind: "fracshape", alt: `A ${shapeWord(shape)} cut into equal shares. Some shares are shaded.`, shape, parts, shaded },
        distractors: numDists(parts, [{ v: shaded, m: "counted-only-the-shaded-shares" }, { v: parts - shaded, m: "counted-only-the-shares-not-shaded" }, { v: parts - 1, m: "counted-the-cuts-not-the-shares" }, { v: parts + 1, m: "counted-one-share-twice" }], { lo: 1, hi: 8 }),
        hints: { conceptual: "A share is one of the equal pieces. The shaded and unshaded pieces are all shares of the whole.", procedural: "Touch each piece once. Count the shaded pieces and the unshaded pieces together." },
        level,
      });
    }
    if (mode === "name") {
      const pool = ["one half", "one third", "one fourth", "one whole"];
      const correct = nameOf(parts);
      const tagFor = (x) => (x === "one whole" ? "called-a-share-the-whole" : parts === 4 && x === "one half" ? "named-by-the-number-of-cuts" : parts === 3 && x === "one half" ? "named-by-the-number-of-cuts" : "mixed-up-the-share-names");
      const cands = pool.filter((x) => x !== correct).map((x) => ({ text: x, m: tagFor(x) }));
      cands.sort((a, b) => (a.m === "named-by-the-number-of-cuts" ? -1 : 0) - (b.m === "named-by-the-number-of-cuts" ? -1 : 0));
      return finalize({
        family: "partition",
        spec: { mode: "name", parts },
        stem: T(`${N} cuts a ${noun} into ${parts} equal shares.`, `${N} cuts a ${noun} into ${parts} equal shares.`, `${N} partitions a ${noun} into ${parts} equal shares.`),
        ask: T("What is one share called?", "What is the name for one of the shares?", "What is the name for one of the equal shares?"),
        expr: null,
        answer: { value: correct, text: correct, kind: "text" },
        work: [`The ${noun} is cut into ${parts} equal shares.`, `When a whole is cut into ${parts} equal shares, each share is called ${correct}.`],
        visual: { kind: "fracshape", alt: `A ${shapeWord(shape)} cut into ${parts} equal shares. One share is shaded.`, shape, parts, shaded: 1 },
        distractors: textDists(correct, cands, 3),
        hints: { conceptual: "Shares are named by how many equal shares make the whole.", procedural: "Count how many equal shares there are. Then use the share name for that number: 2 shares, 3 shares, 4 shares." },
        level,
      });
    }
    if (mode === "whole-as") {
      const w = SHARE[parts];
      return finalize({
        family: "partition",
        spec: { mode: "whole-as", parts },
        stem: T(`A ${noun} is cut into ${w.many}.`, `A ${noun} is cut into ${w.many}.`, `A ${noun} is partitioned into ${w.many}.`),
        ask: T(`How many ${w.many} make the whole ${noun}?`, `How many ${w.many} make the whole ${noun}?`, `How many ${w.many} are needed to make the whole ${noun}?`),
        expr: null,
        answer: { value: String(parts), text: String(parts), kind: "int" },
        work: [`${cap(w.many)} are equal shares of the whole.`, `It takes ${parts} ${w.many} to make the whole ${noun}.`],
        visual: { kind: "fracshape", alt: `A ${shapeWord(shape)} cut into ${w.many}.`, shape, parts, shaded: parts },
        distractors: numDists(parts, [{ v: parts - 1, m: "counted-the-cuts-not-the-shares" }, { v: parts + 1, m: "counted-one-share-twice" }, { v: 2, m: "said-two-for-every-whole" }, { v: 1, m: "said-one-for-the-whole" }], { lo: 1, hi: 8 }),
        hints: { conceptual: "The name of the share tells how many make a whole: halves go with 2, thirds with 3, fourths with 4.", procedural: "Think about the word. Then picture the whole shape cut that way." },
        level,
      });
    }
    if (mode === "left") {
      const eaten = rng.int(1, parts - 1);
      const left = parts - eaten;
      return finalize({
        family: "partition",
        spec: { mode: "left", parts, eaten },
        stem: T(`${N} cuts a ${noun} into ${parts} equal shares. ${N} eats ${eaten} of them.`, `${N} cuts a ${noun} into ${parts} equal shares and eats ${eaten} of them.`, `${N} partitions a ${noun} into ${parts} equal shares and eats ${eaten} of the shares.`),
        ask: T("How many shares are left?", `How many ${SHARE[parts].many} are left?`, `How many ${SHARE[parts].many} remain?`),
        expr: null,
        answer: { value: String(left), text: String(left), kind: "int" },
        work: [`The whole has ${parts} shares.`, `${parts} ${MINUS} ${eaten} = ${left}`],
        visual: { kind: "fracshape", alt: `A ${shapeWord(shape)} cut into ${parts} equal shares. ${eaten} shares are shaded to show the ones that were eaten.`, shape, parts, shaded: eaten },
        distractors: numDists(left, [{ v: parts, m: "gave-the-total-number-of-shares" }, { v: eaten, m: "gave-the-number-eaten" }, { v: parts + eaten, m: "added-instead-of-subtracting" }, { v: left + 1, m: "off-by-one" }], { lo: 0, hi: 10 }),
        hints: { conceptual: "The whole is all of the shares. Taking some away leaves the rest.", procedural: "Start with the total number of shares and take away the ones that were eaten." },
        level,
      });
    }
    // whichcut: choose the cut that makes equal shares
    const target = parts;
    const w = SHARE[target].many;
    const opts = [
      { desc: `Cut it into ${target} parts that are the same size.`, parts: target, equal: true },
      { desc: `Cut it into ${target} parts, but one part is much bigger.`, parts: target, equal: false },
      { desc: `Cut it into ${target + 1} parts that are the same size.`, parts: target + 1, equal: true },
      { desc: target > 2 ? `Cut it into ${target - 1} parts that are the same size.` : `Cut it into ${target + 2} parts that are the same size.`, parts: target > 2 ? target - 1 : target + 2, equal: true },
    ];
    const tags = ["", "called-unequal-parts-shares", "used-the-wrong-number-of-parts", "used-the-wrong-number-of-parts"];
    return finalize({
      family: "partition",
      spec: { mode: "whichcut", target, options: rng.shuffle(opts) },
      stem: T(`${N} wants to cut a ${noun} into ${w}.`, `${N} wants to cut a ${noun} into ${w}.`, `${N} wants to partition a ${noun} into ${w}.`),
      ask: T("Which cut works?", "Which cut makes the shares?", "Which cut correctly partitions the whole?"),
      expr: null,
      answer: { value: opts[0].desc, text: opts[0].desc, kind: "text" },
      work: [`${cap(w)} are equal shares, so the parts must be the same size.`, `${cap(w)} also means the right number of parts: ${target}.`, `The cut that works is: ${opts[0].desc}`],
      visual: null,
      distractors: opts.slice(1).map((o, i) => ({ text: o.desc, misconception: tags[i + 1] })),
      hints: { conceptual: "Halves, thirds and fourths are equal shares, so every part must be the same size.", procedural: "Check two things for each cut: is the number of parts right, and are all the parts the same size?" },
      level,
    });
  },
};
