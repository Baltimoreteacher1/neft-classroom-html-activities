// Teacher moves for the small-group fleet: ASK / LOOK FOR / IF STUCK / EXTEND.
//
// WHY THIS EXISTS
// ---------------
// The previous facilitation block was four prose bullets per lesson, and an
// audit of all 168 lessons found 756 of 840 move lines repeated across 50+
// lessons. Every support lesson carried exactly ONE lesson-specific line (the
// "watch for the common mistake" bullet) and every challenge lesson carried
// NONE — all 84 told the teacher the same four things. A teacher glancing at
// the screen mid-group was reading boilerplate.
//
// The fix is not to author 336 hand-written variants. It is to build the moves
// from instructional data the lesson ALREADY carries:
//
//   • misconceptionTags  → the taxonomy's own `label` (what to notice) and
//                          `watchFor` (which is literally a teacher move,
//                          written per-misconception). 69 of 84 base lessons
//                          carry at least one tag.
//   • practice.commonMistake → the authored error, on all 84.
//   • conceptIntro.keyIdea   → the claim the lesson is trying to establish.
//   • the model `kind`       → the representation this lesson actually draws,
//                          so "go back to the model" can name it.
//   • contentObjective       → the skill, for the question stem.
//   • standard family        → the mathematics, for the challenge prompts.
//
// So the SPECIFICITY comes from the lesson; only the sentence shape is shared.
// That is the difference between a template and filler.
//
// PATHWAY SPLIT (deliberate, not decoration)
//   Support  — one decision at a time, concrete → symbolic, diagnose the error,
//              name the representation, supply language.
//   Challenge — justify, generalise, compare strategies, find counterexamples,
//              change the constraints. Never "the same move with bigger numbers".

/** Reduce a standard code to the family the prompts key off. */
export function standardFamily(standard) {
  const s = String(standard || "");
  if (/^6\.AT\.[123]/.test(s)) return "ratio";
  if (/^6\.AT\.4/.test(s)) return "percent";
  if (/^6\.AT\.[567]/.test(s)) return "expression";
  if (/^6\.AT\.[89]|^6\.AT\.1[01]/.test(s)) return "equation";
  if (/^6\.DS\./.test(s)) return "data";
  if (/^6\.GR\./.test(s)) return "geometry";
  if (/^6\.NOS\.[678]/.test(s)) return "integer";
  if (/^6\.NOS\./.test(s)) return "number";
  return "general";
}

/** Human name for the representation a lesson actually draws. */
const MODEL_NAMES = {
  "tape-diagram": "the tape diagram",
  "ratio-table-builder": "the ratio table",
  "number-line": "the number line",
  "number-line-explorer": "the number line",
  "double-number-line": "the double number line",
  "coordinate-plane": "the coordinate plane",
  "area-morph": "the area model",
  "bar-chart": "the bar graph",
  histogram: "the histogram",
  "histogram-builder": "the histogram",
  "dot-plot": "the dot plot",
  "box-plot": "the box plot",
  "box-plot-builder": "the box plot",
  "percent-grid": "the percent grid",
  "percent-builder": "the percent grid",
  "equation-balance-lab": "the balance model",
  "step-solver": "the step-by-step solver",
  "net-folder": "the net",
  "cross-section": "the cross-section",
  "fraction-divide": "the fraction model",
  "decimal-columns": "the place-value columns",
  "decimal-product": "the place-value columns",
  "long-division-builder": "the division frame",
  "factor-tree": "the factor tree",
  "factor-tree-lab": "the factor tree",
  "unit-rate-builder": "the unit-rate table",
  "line-grapher": "the graph",
  "stat-towers": "the data towers",
  "data-chips": "the data chips",
};

/**
 * The model a teacher can point at, as a phrase.
 *
 * Read in slot order, NOT document order. `launch.visual` is frequently a
 * decorative `bar-chart` hero: scanning the serialised config picked it first
 * and told a ratios teacher to "point at the bar graph" and a surface-area
 * teacher the same, while the lesson's real models — a tape diagram and a net —
 * sat further down. The teaching model is the one the work happens on, so
 * practice comes first and the hero comes last.
 */
const MODEL_SLOTS = [
  ["practice", "diagram"],
  ["connect", "diagram"],
  ["explore", "diagram"],
  ["launch", "visual"],
];

/* Which models genuinely belong to which mathematics. A data display is the
   right thing to point at in a statistics lesson and the wrong thing in a
   volume lesson — 5-10 (Volume of Rectangular Prisms) carries a decorative
   bar-chart in BOTH connect and launch, so slot order alone still handed a
   geometry teacher "the bar graph". A model that does not fit the family is
   skipped in favour of one that does; if nothing fits, the generic phrase is
   better than a confidently wrong one. */
const FAMILY_MODELS = {
  ratio: [
    "tape-diagram",
    "ratio-table-builder",
    "double-number-line",
    "unit-rate-builder",
    "number-line",
  ],
  percent: ["percent-grid", "percent-builder", "tape-diagram", "number-line"],
  expression: ["area-morph", "step-solver", "tape-diagram"],
  equation: ["equation-balance-lab", "step-solver", "tape-diagram", "number-line"],
  data: [
    "histogram",
    "histogram-builder",
    "box-plot",
    "box-plot-builder",
    "dot-plot",
    "bar-chart",
    "stat-towers",
    "data-chips",
    "line-grapher",
  ],
  geometry: ["net-folder", "cross-section", "area-morph", "coordinate-plane"],
  integer: ["number-line", "number-line-explorer", "coordinate-plane"],
  number: [
    "decimal-columns",
    "decimal-product",
    "long-division-builder",
    "fraction-divide",
    "factor-tree",
    "factor-tree-lab",
    "number-line",
  ],
};

export function modelName(config, family) {
  const kinds = [];
  for (const [section, key] of MODEL_SLOTS) {
    const kind = config?.[section]?.[key]?.kind;
    if (kind) kinds.push(kind);
  }
  for (const [, kind] of String(JSON.stringify(config || {})).matchAll(/"kind":\s*"([a-z-]+)"/g)) {
    kinds.push(kind);
  }
  const allowed = family && FAMILY_MODELS[family] ? new Set(FAMILY_MODELS[family]) : null;
  if (allowed) {
    for (const kind of kinds) {
      if (allowed.has(kind) && MODEL_NAMES[kind]) return MODEL_NAMES[kind];
    }
    return "the model";
  }
  for (const kind of kinds) {
    if (MODEL_NAMES[kind]) return MODEL_NAMES[kind];
  }
  return "the model";
}

/** Misconception tag ids actually used by a lesson's practice, most-used first. */
export function lessonTags(config, taxonomy) {
  const counts = new Map();
  for (const tier of ["approaching", "onLevel", "extending", "optional"]) {
    for (const item of config?.practice?.[tier] || []) {
      for (const tag of item?.misconceptionTags || []) {
        if (tag && taxonomy?.[tag]) counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
}

const trimDot = (s) => String(s || "").replace(/\s*\.\s*$/, "");
const lower1 = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/**
 * The authored `commonMistake` is written for a teacher READING a lesson, and
 * runs to a paragraph — 2-1's is 805 characters. A teacher mid-group with four
 * students waiting will not read that, so only its first sentence becomes a
 * LOOK FOR. The full text is still on the lesson page where there is time for
 * it; this field is the glance version.
 */
function commonMistakeText(config) {
  const m = config?.practice?.commonMistake;
  if (!m) return null;
  const raw = typeof m === "string" ? m : m.text || m.mistake || "";
  let text = String(raw).trim();
  if (!text) return null;
  // Authored mistakes usually open "A common mistake in <lesson> is …", which
  // made the LOOK FOR frame read "Students a common mistake in …". Strip the
  // preamble so what is left is the error itself.
  text = text
    .replace(/^a common mistake\b(?:\s+in\s+[^.]{0,80}?)?\s+is\s+(?:that\s+)?/i, "")
    .trim();
  if (!text) return null;
  // First sentence, but never cut mid-decimal ("-0.75") or mid-abbreviation.
  const match = /^(.*?[a-z0-9)\]"'’”])\.(?:\s|$)/i.exec(text);
  let first = match ? match[1] : text;
  if (first.length > 150) first = `${first.slice(0, 147).replace(/[\s,;:—-]+$/, "")}…`;
  return trimDot(first);
}

/* ------------------------------------------------------------------ ASK ---- */
/* One question, in the teacher's own voice, about THIS lesson's mathematics.
   Keyed by standard family so a ratio lesson never gets a geometry question,
   and split by pathway so support asks about the relationship in front of them
   while challenge asks whether it generalises. */

const ASK_SUPPORT = {
  ratio: (m) => `Point at ${m} — what does ONE part stand for here?`,
  percent: (m) => `On ${m}, which piece is the whole, and which piece are we naming?`,
  expression: () => `Which part of this expression happens first, and how do you know?`,
  equation: (m) => `What is being done to the variable right now? Show me on ${m}.`,
  data: (m) => `What is one dot or bar on ${m} — one person, or one measurement?`,
  geometry: (m) => `Show me on ${m} which lengths you are using, and what they build.`,
  integer: (m) => `Between which two integers does this value belong? Show me on ${m}.`,
  number: (m) => `What does each place stand for on ${m}?`,
  general: (m) => `Show me on ${m} where your numbers came from.`,
};

const ASK_CHALLENGE = {
  ratio: () => `If both quantities double, what happens to the ratio — and why?`,
  percent: () => `Would this method still work if the percent were over 100? Convince me.`,
  expression: () => `Is there a different expression with the same value? Show why they match.`,
  equation: () => `Would your solving order still work if the operations were swapped? Why?`,
  data: () =>
    `Change one value to make the mean move but the median stay put. What did you change?`,
  geometry: () => `If one dimension doubles, does the answer double? Always, sometimes, or never?`,
  integer: () => `Is that true for negative numbers too, or only positive ones? Show a case.`,
  number: () => `Does this strategy still hold for numbers smaller than 1? Test it.`,
  general: () => `Would this strategy always work? How do you know?`,
};

/*
 * Per-misconception questions. The family tables above can only be as specific
 * as the standard — 84 challenge lessons collapsed to 9 distinct questions,
 * which means a whole unit repeats itself. A lesson's PRIMARY misconception is
 * the sharpest thing known about it, so where one exists the question is aimed
 * at that error instead: support asks the decision the error skips, challenge
 * asks why the error fails in general.
 *
 * 27 tags are primary somewhere in the fleet; the rest are here because they
 * are primary-eligible and a silent fallback to a vaguer question is worse than
 * a line of authoring. `m` is the lesson's own model, so lessons sharing a tag
 * still differ where the question can point at something.
 */
const ASK_BY_TAG = {
  "op-added-instead-of-multiplied": {
    support: (m) =>
      `On ${m}, is this one group repeated, or two amounts joined? Which operation matches?`,
    challenge: () =>
      `When does repeated addition stop being a practical method — and what replaces it?`,
  },
  "op-multiplied-instead-of-added": {
    support: (m) => `Show me on ${m} — are we combining two amounts, or scaling one of them?`,
    challenge: () =>
      `Write a problem where the answer is the SUM, and one where it is the PRODUCT. What changed?`,
  },
  "op-multiplied-instead-of-divided": {
    support: () =>
      `Should the answer be bigger or smaller than what you started with? Say why first.`,
    challenge: () => `When does dividing make a number BIGGER? Give a case and explain it.`,
  },
  "op-divided-instead-of-multiplied": {
    support: () => `Are we splitting a total into groups, or building a total from groups?`,
    challenge: () => `Rewrite this as the opposite operation and show the two must agree.`,
  },
  "op-reversed-division": {
    support: () => `Which number is being shared out, and which says how many shares?`,
    challenge: () => `Is division ever order-independent? Show a case or prove it never is.`,
  },
  "op-reversed-subtraction": {
    support: () => `Which amount started bigger? Say the subtraction out loud before writing it.`,
    challenge: () => `When does reversing a subtraction give the same size answer? What changes?`,
  },
  "ratio-scaled-additively": {
    support: (m) => `On ${m}, how many TIMES bigger did the first amount get?`,
    challenge: () =>
      `Why does adding to both parts break a ratio when adding to both sides keeps an equation true?`,
  },
  "ratio-inverted": {
    support: () => `Which quantity does the question name FIRST? Label both before you write.`,
    challenge: () => `When would the flipped ratio be the correct answer? Write that question.`,
  },
  "ratio-as-difference": {
    support: () => `Say it as “for every ___ there are ___”. What are the two numbers?`,
    challenge: () => `Two jars give the same difference but different ratios. Build them.`,
  },
  "rate-not-per-one": {
    support: () => `What does ONE of them cost? Finish: “for one ___, there is ___.”`,
    challenge: () => `When is the total more useful than the unit rate? Give a real case.`,
  },
  "percent-scale-off-by-100": {
    support: (m) => `Is your answer near half, or near a tenth? Check it against ${m} first.`,
    challenge: () => `Why does a percent need a whole before it means anything? Show two wholes.`,
  },
  "percent-used-as-whole-number": {
    support: () => `What does the percent sign actually mean here — how many out of 100?`,
    challenge: () => `Is 20% always smaller than 30? Find a case that settles it.`,
  },
  "decimal-place-value": {
    support: (m) =>
      `Estimate to the nearest whole first — then check where the point lands on ${m}.`,
    challenge: () =>
      `Why does multiplying by a number under 1 shrink the answer? Explain with place value.`,
  },
  "fraction-added-denominators": {
    support: (m) => `Can thirds and fifths become eighths? Show me on ${m}.`,
    challenge: () => `Why do denominators have to match to add, but not to multiply?`,
  },
  "fraction-no-reciprocal": {
    support: () =>
      `How many halves fit in one whole? Does dividing here make it bigger or smaller?`,
    challenge: () =>
      `Why does dividing by a fraction below 1 grow the answer? Justify it, do not just state it.`,
  },
  "fraction-straight-across-division": {
    support: () => `Test your method on a case you already know, like 1 ÷ ½. Does it hold?`,
    challenge: () => `Your shortcut sometimes works. Find exactly when — and say why it does.`,
  },
  "order-of-operations-left-to-right": {
    support: () => `Which operation has to happen first here, and how do you know?`,
    challenge: () => `Write an expression where left-to-right gives the same answer. Why does it?`,
  },
  "exponent-as-multiplication": {
    support: () => `Write every factor out. How many are there, and what are you multiplying?`,
    challenge: () => `When is a base times its exponent equal to the power? Find every case.`,
  },
  "algebra-distributive-partial": {
    support: (m) => `Does the outside number touch BOTH terms? Trace it on ${m}.`,
    challenge: () =>
      `Show the distributive property with an area model, then say why it must hold.`,
  },
  "equation-not-inverse-operation": {
    support: (m) => `What is being done to the variable? Show the undo on ${m}.`,
    challenge: () => `Why must the same move happen on both sides? What breaks if it does not?`,
  },
  "equation-answered-with-given-number": {
    support: () => `Which number is the unknown, and which one was handed to you?`,
    challenge: () => `Substitute your answer back in. What does a true statement prove?`,
  },
  "inequality-direction-flipped": {
    support: (m) => `Test one number from your answer on ${m}. Does it actually work?`,
    challenge: () => `Which operation forces the symbol to turn, and why does it?`,
  },
  "inequality-boundary-inclusion": {
    support: () => `Is the boundary number itself allowed? Read the words again.`,
    challenge: () => `Write a real rule where the boundary counts, and one where it cannot.`,
  },
  "inequality-graph-direction": {
    support: (m) => `Pick a number on your shaded side of ${m}. Does it make the statement true?`,
    challenge: () => `Describe the same solution set two other ways. Are they truly identical?`,
  },
  "coord-xy-swapped": {
    support: (m) => `Trace the across move first, then the up move, on ${m}.`,
    challenge: () => `When do (a, b) and (b, a) land on the same point? Where are all such points?`,
  },
  "sign-dropped": {
    support: (m) => `Which side of zero does this answer sit on? Point to it on ${m}.`,
    challenge: () =>
      `When is a negative number greater than another negative? Order three and justify.`,
  },
  "measure-area-perimeter-swap": {
    support: () =>
      `Are we covering the inside, or walking around the edge? What unit does that need?`,
    challenge: () =>
      `Draw two shapes with equal perimeter and different area. What does that show?`,
  },
  "geom-triangle-area-no-half": {
    support: (m) =>
      `Draw the rectangle around the triangle on ${m}. How much of it is the triangle?`,
    challenge: () => `Why is the half there for EVERY triangle, not just right ones?`,
  },
  "geom-surface-area-as-volume": {
    support: () => `Are we wrapping the outside or filling the inside? Which unit says so?`,
    challenge: () => `Can two solids share a surface area but not a volume? Build them.`,
  },
  "geom-volume-added-dimensions": {
    support: (m) =>
      `How many cubes fit along each edge on ${m}? What do you do with those three numbers?`,
    challenge: () => `If every edge doubles, what happens to the volume? Predict, then check.`,
  },
  "stat-center-vs-spread": {
    support: () => `Does the question want a typical value, or how spread out the data is?`,
    challenge: () =>
      `Two sets share a mean but not a spread. Build them and say what each measure hides.`,
  },
  "stat-mean-vs-median": {
    support: () => `Which word did the question use? What does that word tell you to DO?`,
    challenge: () => `When do the mean and median agree? What has to be true of the data?`,
  },
  "stat-mean-skewed-by-outlier": {
    support: () => `Is there a value far from the rest? Which measure does it drag?`,
    challenge: () => `Which measure would you report to argue each side — and is that honest?`,
  },
  "stat-summed-instead-of-averaged": {
    support: () =>
      `Could your answer be one real value from this list? An average has to land inside.`,
    challenge: () => `Why must a mean sit between the smallest and largest value? Prove it.`,
  },
  "stat-range-for-iqr": {
    support: () => `Which two numbers does the IQR use? Point at them.`,
    challenge: () => `Can the range and IQR ever be equal? What would the data look like?`,
  },
  "stat-frequency-vs-value": {
    support: (m) => `On ${m}, does the height count HOW MANY, or say WHICH value?`,
    challenge: () => `Redraw this data so the tallest bar moves. What did you have to change?`,
  },
  "stat-histogram-bin-misread": {
    support: (m) => `Point at this interval's two endpoints on ${m}. Which values belong inside?`,
    challenge: () =>
      `Rebin the same data and make the shape look different. Is either picture lying?`,
  },
};

export function buildAsk({ group, family, model, tags, taxonomy }) {
  const tag = tags?.length ? tags[0] : null;
  const byTag = tag && taxonomy?.[tag] ? ASK_BY_TAG[tag] : null;
  if (byTag) return (group === 1 ? byTag.support : byTag.challenge)(model);
  const table = group === 1 ? ASK_SUPPORT : ASK_CHALLENGE;
  return (table[family] || table.general)(model);
}

/* -------------------------------------------------------------- LOOK FOR ---- */
/* Support names the error the lesson's own distractors diagnose, so the teacher
   watches for a specific wrong move rather than "confusion". Challenge names
   the reasoning that shows a student has gone past the example. */

export function buildLookFor({ group, config, tags, taxonomy }) {
  if (group === 1) {
    const label = tags.length ? taxonomy[tags[0]]?.label : null;
    // Most taxonomy labels are past-tense verb phrases ("Flipped the ratio"),
    // which read correctly after "Students". Three are NOUN phrases naming the
    // shape of the wrong answer instead — "Right digits, wrong magnitude",
    // "Right boundary, symbol reversed", "Graph shaded toward the wrong side" —
    // and splicing those after "Students" produced six teacher-facing lines
    // with no verb in them ("Students right digits, wrong magnitude"). Quoting
    // the label fits every shape, which is the same reason the challenge branch
    // below already quotes it.
    if (label) {
      return `Watch for the “${trimDot(label)}” error — that is the one this lesson's check diagnoses.`;
    }
    const mistake = commonMistakeText(config);
    // "Students …" only works in front of a verb phrase, which a taxonomy label
    // is and free prose is not. Prose gets a frame that fits any shape.
    if (mistake) return `Watch for: ${lower1(mistake)}.`;
    return `Which step a student stops at — name the stopping point out loud.`;
  }
  // Taxonomy labels are past-tense verb phrases ("Flipped the ratio"), so they
  // cannot be spliced after "why". Naming the error in quotes keeps it readable
  // and keeps the teacher's eye on the word that matters.
  const label = tags.length ? taxonomy[tags[0]]?.label : null;
  if (label) {
    return `A student who can explain why the “${trimDot(label)}” error fails in every case, not just this one.`;
  }
  return `A student generalising past the numbers in the example — “this works whenever…”.`;
}

/* -------------------------------------------------------------- IF STUCK ---- */
/* The taxonomy's `watchFor` is already a teacher move, written per
   misconception ("Have them label both quantities with units before writing the
   ratio."), so support reuses it verbatim rather than paraphrasing it worse.
   Challenge never gets a re-teach — it gets a smaller case or a constraint. */

const IF_STUCK_CHALLENGE = {
  ratio: (m) => `Shrink it: give them a 1-to-something case on ${m}, then ask what changed.`,
  percent: () => `Ask for 10% first, then build the target percent from it.`,
  expression: () => `Ask them to substitute one number into both expressions and compare.`,
  equation: () => `Ask them to check a wrong answer by substitution and say what it proves.`,
  data: (m) => `Hand them a second data set on ${m} and ask which claim survives both.`,
  geometry: (m) => `Ask them to label ${m} first, then say which measurement the question wants.`,
  integer: (m) => `Put both values on ${m} and ask which is further from zero.`,
  number: () => `Ask them to test the claim on a friendlier number first, then return.`,
  general: (m) => `Ask for a second representation on ${m} before any more explaining.`,
};

/* Challenge IF STUCK, per misconception: a smaller case or a constraint that
   makes the error visible, never a re-teach of the method. */
const IF_STUCK_BY_TAG = {
  "coord-xy-swapped": (m) =>
    `Ask them to plot both (a, b) and (b, a) on ${m} and describe the line between them.`,
  "ratio-scaled-additively": (m) =>
    `Give them a 1-to-something row on ${m} and ask what one step of scaling does.`,
  "ratio-inverted": () =>
    `Ask them to write the question that WOULD make the flipped ratio correct.`,
  "ratio-as-difference": () =>
    `Give two pairs with the same difference and ask whether the ratios match.`,
  "geom-volume-added-dimensions": (m) =>
    `Ask how many unit cubes fit along each edge of ${m}, then what to do with the three numbers.`,
  "geom-surface-area-as-volume": () =>
    `Ask them to say the unit out loud before computing — square or cubic?`,
  "geom-triangle-area-no-half": (m) =>
    `Ask them to draw the enclosing rectangle on ${m} and name the fraction.`,
  "measure-area-perimeter-swap": () =>
    `Ask for two shapes with equal perimeter and different area.`,
  "stat-center-vs-spread": () =>
    `Give two sets with the same mean and ask which measure tells them apart.`,
  "stat-mean-vs-median": () => `Ask what has to be true of the data for the two measures to agree.`,
  "stat-mean-skewed-by-outlier": () =>
    `Ask them to move one value and report which measure shifted.`,
  "stat-histogram-bin-misread": (m) =>
    `Ask them to rebin the same data on ${m} and say whether the story changed.`,
  "stat-range-for-iqr": () =>
    `Ask for a data set where range and IQR are as far apart as possible.`,
  "decimal-place-value": () =>
    `Ask them to estimate first, then say which digit their answer disagrees with.`,
  "op-added-instead-of-multiplied": () =>
    `Ask them to write the repeated-addition version and count the terms.`,
  "op-multiplied-instead-of-divided": () =>
    `Ask whether the answer should grow or shrink, and why.`,
  "op-reversed-division": () =>
    `Ask them to state which quantity is being shared before computing.`,
  "equation-not-inverse-operation": () =>
    `Ask them to substitute their answer back and say what a false statement proves.`,
  "inequality-direction-flipped": (m) => `Ask them to test one value from each side on ${m}.`,
  "algebra-distributive-partial": (m) =>
    `Ask them to check the expansion against ${m} term by term.`,
  "fraction-no-reciprocal": () =>
    `Ask them to test the method on 1 ÷ ½, where they already know the answer.`,
  "order-of-operations-left-to-right": () =>
    `Ask them to write the same expression with parentheses that force their order.`,
};

export function buildIfStuck({ group, family, model, tags, taxonomy }) {
  if (group === 1) {
    const watch = tags.length ? taxonomy[tags[0]]?.watchFor : null;
    if (watch) return trimDot(watch) + ".";
    // Model-shaped first move rather than "rebuild the first step", which tells
    // a teacher to do something without saying what.
    if (/number line/.test(model)) {
      return `Locate the two whole numbers it falls between first, then split that interval into equal parts.`;
    }
    if (/table/.test(model)) {
      return `Cover every row but the first, and rebuild the next row from it one step at a time.`;
    }
    return `Work the first step together on ${model}, then hand the second one back to them.`;
  }
  /* Prefer the lesson's OWN error over its standard family. 7-5 is a coordinate
     lesson inside the integer family, so the family move ("which is further
     from zero?") answered a question its students were not asking. A challenge
     group still gets a smaller case rather than a re-teach — the tag only
     decides WHICH smaller case. */
  const tag = tags.length ? tags[0] : null;
  if (tag && IF_STUCK_BY_TAG[tag]) return IF_STUCK_BY_TAG[tag](model);
  return (IF_STUCK_CHALLENGE[family] || IF_STUCK_CHALLENGE.general)(model);
}

/* ---------------------------------------------------------------- EXTEND ---- */
/* Challenge only, and only where there is something real to push on. Support
   groups get no EXTEND: a 20-minute re-teach that ends in an extension is a
   re-teach that did not finish. */

const EXTEND = {
  ratio: () => `Ask them to write a ratio that is NOT equivalent, and justify why it fails.`,
  percent: () => `Ask which is larger: 20% of 50, or 50% of 20 — and why that happens.`,
  expression: () =>
    `Ask them to write an expression a classmate would simplify wrongly, and say why.`,
  equation: () => `Ask them to build an equation with no solution, then one true for every value.`,
  data: () => `Ask which measure they would report to argue each side, and what that reveals.`,
  geometry: () => `Ask for two different shapes with the same answer — what stayed constant?`,
  integer: () => `Ask when a negative answer is larger than a positive one, and why.`,
  number: () => `Ask them to state the rule as always / sometimes / never, and defend it.`,
  general: () => `Ask them to find a case where the strategy breaks, and explain the boundary.`,
};

export function buildExtend({ group, family }) {
  if (group !== 2) return null;
  return (EXTEND[family] || EXTEND.general)();
}

/**
 * The full teacher-moves block for one small-group lesson.
 * `taxonomy` is engine/core/misconceptions.js MISCONCEPTIONS.
 */
export function buildTeacherMoves({ base, group, taxonomy }) {
  const family = standardFamily(base?.standard);
  const model = modelName(base, family);
  const tags = lessonTags(base, taxonomy);
  const moves = {
    ask: buildAsk({ group, family, model, tags, taxonomy }),
    lookFor: buildLookFor({ group, config: base, tags, taxonomy }),
    ifStuck: buildIfStuck({ group, family, model, tags, taxonomy }),
  };
  const extend = buildExtend({ group, family });
  if (extend) moves.extend = extend;
  return moves;
}
