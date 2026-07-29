/* Seed the Unit 3 "Learning Loop" block into the canonical lesson configs.
 *
 * WHY A SEEDER, NOT A DATA FILE
 * The curriculum's single source of truth is lessons/<id>/config.json —
 * data/curriculum-manifest.json is GENERATED from it (see its `note` field).
 * Adding a parallel data/learning-loop-*.json would create a second, competing
 * source of truth that drifts. So the loop content is written INTO the configs
 * and this script is a one-shot, idempotent seeder: re-running it replaces the
 * `loop` block verbatim and touches nothing else. After it runs, config.json is
 * the source of truth and edits belong there (or here, then re-run).
 *
 * SAFETY MODEL — WHY TWO OUTPUTS
 * lessons/<id>/config.json is PUBLIC: Cloudflare Pages serves it verbatim
 * (verified — https://eduwonderlab.com/lessons/3-1/config.json returns 200 with
 * the full file). Anything written there is world-readable, so answers, rubrics,
 * misconception diagnoses and success criteria MUST NOT go in it.
 *
 * functions/ is compiled by Pages into the Worker and is NOT served as a static
 * asset (verified — /functions/_lib/scorm.js returns 404 in production). So this
 * seeder writes ONE authored source into TWO projections:
 *
 *   loop.*  (student-safe)   -> lessons/<id>/config.json          [public]
 *   teacherOnly.*            -> functions/_lib/unit3-loop-teacher.js  [private]
 *
 * The split happens by construction, not by a filter that could be forgotten:
 * the teacher fields are never written to the public file at all.
 * scripts/validate-learning-loop.mjs enforces this as a regression gate.
 *
 * Usage:
 *   node scripts/seed-unit3-learning-loop.mjs            # write
 *   node scripts/seed-unit3-learning-loop.mjs --dry-run  # report only
 *   node scripts/seed-unit3-learning-loop.mjs --revert   # remove loop blocks
 *
 * After writing, run: npm run curriculum:rebuild
 */
import { readFileSync, writeFileSync, existsSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const DRY = args.has("--dry-run");
const REVERT = args.has("--revert");

const REVIEWED_ON = "2026-07-29";

/* Shared WIDA scaffolding ladder. Levels follow the project's own labelling
   convention (support / core / enrichment) rather than proficiency labels, and
   are phrased as what the student DOES, not what they lack. */
function widaLadder(terms, frames) {
  return {
    entering: {
      support: "Word bank + labelled picture. Student points to or matches terms before writing.",
      wordBank: terms,
    },
    developing: {
      support: "Sentence frames with the comparison words supplied; student fills quantities.",
      frames: frames.slice(0, 2),
    },
    bridging: {
      support: "Frames available but optional; student writes one full explanation sentence.",
      frames: frames.slice(2),
    },
    reaching: {
      support: "No frame. Student explains and then justifies to a partner who disagrees.",
      frames: [],
    },
  };
}

/* TWR (The Writing Revolution) because / but / so — the signature single-sentence
   expansion. The ladder fades from a supplied stem to independent explanation. */
function twr(stem, because, but, so) {
  return {
    conjunctions: [
      `${stem} because ${because}`,
      `${stem} but ${but}`,
      `${stem} so ${so}`,
    ],
    fadeLadder: [
      "Level 1 — copy the sentence stem and fill both blanks.",
      "Level 2 — sentence stem given, student supplies the whole second half.",
      "Level 3 — conjunction only (because / but / so); student writes the full sentence.",
      "Level 4 — no support; student explains in their own words.",
    ],
  };
}

const LESSONS = {
  "3-1": {
    prerequisites: [
      "Multiply and divide within 100 fluently.",
      "Read a part-and-whole picture (fraction language: parts of a group).",
      "Write a fraction from a picture or a count.",
    ],
    evidenceTask: {
      title: "Two ratios, one recipe",
      prompt:
        "Look at the drink recipe. Write ONE part-to-part ratio and ONE part-to-whole ratio. Label which is which, then explain how you know.",
      format: "Two ratios + one explanation sentence.",
      timeEstimate: "~5 min",
      accessibility:
        "Can be spoken aloud, typed, or written on the printable. Picture is labelled in words as well as colour.",
    },
    transfer: {
      prompt:
        "A paint mix uses 3 scoops of blue for every 5 scoops of white. Write the part-to-part ratio and the part-to-whole ratio for blue, and explain the difference in your own words.",
      whyNovel: "Different context (paint, not food) and the whole is not shown — the student must build it.",
    },
    retention: {
      afterDays: 4,
      prompt:
        "A class has 12 students wearing sneakers and 8 wearing boots. Write the ratio of sneakers to boots, and the ratio of sneakers to all students.",
    },
    scaffolds: {
      wida: widaLadder(
        ["ratio", "part-to-part", "part-to-whole", "compare", "for every"],
        [
          "The ratio of ___ to ___ is ___.",
          "This is a part-to-___ ratio because ___.",
          "I compared ___ with ___, so the ratio is ___.",
          "___ and ___ are being compared, which means ___.",
        ],
      ),
      twr: twr(
        "A ratio compares two amounts",
        "___",
        "___",
        "___",
      ),
      languageNote:
        "Avoid the idiom 'out of' when part-to-part is meant — it cues part-to-whole and is a known confusion for multilingual learners.",
    },
    printableAlternative: { resource: "handout", note: "Same task, no device or AI required." },
    familyConnection: {
      minutes: 5,
      prompt:
        "Cook or mix something together and ask: 'how many of these for every one of those?' Let your student say the comparison out loud. You do not need to check the maths.",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "order-reversed",
          label: "Writes the ratio in the wrong order",
          lookFor: "Answer is 5:3 when the question asked for the 3-quantity first.",
          reteachMove: "Underline the two nouns in the question in order, then write the numbers under them.",
        },
        {
          code: "part-whole-confusion",
          label: "Gives part-to-whole when part-to-part was asked (or vice versa)",
          lookFor: "Both ratios are the same, or the total appears in a part-to-part answer.",
          reteachMove: "Build it physically in Ratio Lab: separate the two piles, then push them together for the whole.",
        },
        {
          code: "additive-comparison",
          label: "Compares by subtracting instead of by ratio",
          lookFor: "'There are 2 more water than juice' instead of a multiplicative comparison.",
          reteachMove: "Ask what happens to BOTH amounts when the recipe doubles — the difference changes, the ratio does not.",
        },
        {
          code: "ratio-as-count",
          label: "Treats the ratio as a single total",
          lookFor: "One number given as the answer, e.g. '8'.",
          reteachMove: "A ratio always names TWO things. Ask 'two of what, compared to what?'",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "Both ratios correct and correctly labelled, with an explanation naming the comparison." },
        { level: "supported", descriptor: "Both ratios correct after a hint, a visual, or a partner conversation." },
        { level: "not-yet", descriptor: "Order or part/whole still mixed up after support, or no comparison language present." },
      ],
      transferSuccess:
        "Blue:white = 3:5 and blue:total = 3:8, with an explanation that distinguishes the two. Building the whole (3+5) unprompted is the key signal.",
      retentionSuccess: "12:8 (or 3:2) and 12:20 (or 3:5). Simplifying is not required.",
      reteach: {
        title: "Ratio Lab — build it before you write it",
        href: "/math/unit-3/ratio-lab/index.html",
        why: "Physical part/part vs part/whole separation targets the two dominant misconceptions directly.",
        alternate: { title: "6.AT.1 On-Ramp", href: "/math/unit-3/6-rp-a-1-onramp/index.html" },
      },
      extension: {
        title: "6.AT.1 Enrichment",
        href: "/math/unit-3/6-rp-a-1-enrichment/index.html",
        why: "For students already distinguishing part-to-part and part-to-whole without prompting.",
      },
      facilitationNote:
        "If more than a third of the class shows 'additive-comparison', teach 3-2 (ratio tables) before reteaching 3-1 — the table makes the multiplicative structure visible faster than re-explaining does.",
    },
  },

  "3-2": {
    prerequisites: [
      "Write a ratio comparing two quantities (Lesson 3-1).",
      "Multiply and divide by a one-digit number.",
      "Continue a simple number pattern.",
    ],
    evidenceTask: {
      title: "Finish the table, name the move",
      prompt:
        "Complete the missing values in the ratio table. Then write the rule you used — what did you multiply or divide by?",
      format: "Completed table + one sentence naming the operation.",
      timeEstimate: "~5 min",
      accessibility: "Table has row and column headers read by screen readers; values may be typed or spoken.",
    },
    transfer: {
      prompt:
        "A ratio table shows 4 tickets cost $10. Fill in the cost of 6 tickets and 10 tickets, and explain which move you used and why it keeps the ratio the same.",
      whyNovel: "Money context and a non-integer scale factor between the given rows (4 → 6 is ×1.5).",
    },
    retention: {
      afterDays: 4,
      prompt: "If 3 notebooks cost $6, complete a table for 6 notebooks and 9 notebooks.",
    },
    scaffolds: {
      wida: widaLadder(
        ["ratio table", "equivalent", "scale factor", "multiply", "divide", "row", "column"],
        [
          "I multiplied both numbers by ___.",
          "The scale factor is ___ because ___.",
          "Both rows stay equivalent because I ___ to both.",
          "If I ___ one side I must ___ the other side, so ___.",
        ],
      ),
      twr: twr("A ratio table stays equivalent", "___", "___", "___"),
      languageNote: "'Scale factor' is new academic vocabulary — pair it with the everyday phrase 'what I multiplied by'.",
    },
    printableAlternative: { resource: "handout", note: "Blank ratio tables to complete by hand." },
    familyConnection: {
      minutes: 5,
      prompt:
        "Double or triple a recipe together. Ask your student to say what they multiplied by, and whether it had to be the same for every ingredient.",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "additive-pattern",
          label: "Adds down the table instead of multiplying",
          lookFor: "Rows increase by a constant difference that does not preserve the ratio.",
          reteachMove: "Show two tables side by side — additive and multiplicative — and ask which recipe still tastes the same.",
        },
        {
          code: "one-column-only",
          label: "Scales one column but not the other",
          lookFor: "One value doubled, its partner unchanged.",
          reteachMove: "Cover one column and ask 'if this side grew, what must happen to the other side?'",
        },
        {
          code: "scale-factor-confusion",
          label: "Uses a different multiplier for different rows",
          lookFor: "Row 2 correct, row 3 scaled from row 2 with the original factor.",
          reteachMove: "Always scale FROM the original ratio row; mark it with a star.",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "Table complete and correct, operation named explicitly." },
        { level: "supported", descriptor: "Table correct after a prompt to check both columns." },
        { level: "not-yet", descriptor: "Additive pattern persists, or only one column is scaled." },
      ],
      transferSuccess: "6 tickets = $15 and 10 tickets = $25, with the move named (×1.5 from 4, or unit rate $2.50).",
      retentionSuccess: "6 notebooks = $12, 9 notebooks = $18.",
      reteach: {
        title: "Recipe Factory Line",
        href: "/math/unit-3/recipe-factory-line/index.html",
        why: "Scaling a whole recipe makes 'both columns or neither' concrete.",
        alternate: { title: "6.AT.3a On-Ramp", href: "/math/unit-3/6-rp-a-3-a-onramp/index.html" },
      },
      extension: {
        title: "6.AT.3a Enrichment",
        href: "/math/unit-3/6-at-a-3-a-enrichment/index.html",
        why: "Introduces non-integer scale factors for students who are already fluent.",
      },
      facilitationNote:
        "'additive-pattern' here is the same misconception as 'additive-comparison' in 3-1. If it reappears, it did not get fixed in 3-1 — reteach with the table, not with the definition.",
    },
  },

  "3-3": {
    prerequisites: [
      "Complete a ratio table (Lesson 3-2).",
      "Plot an ordered pair in the first quadrant.",
      "Read a scale on an axis.",
    ],
    evidenceTask: {
      title: "Table to graph",
      prompt:
        "Plot the values from the ratio table as points. Then describe what your points look like and where the pattern would start.",
      format: "Plotted points + one describing sentence.",
      timeEstimate: "~6 min",
      accessibility:
        "Grid coordinates are announced as text alongside the plot; students may state coordinates aloud instead of plotting.",
    },
    transfer: {
      prompt:
        "A table shows 1 hour = 4 miles walked. Plot three points from this relationship and explain why the points form a straight line through (0, 0).",
      whyNovel: "Rate context rather than a recipe, and the student must reason about the origin explicitly.",
    },
    retention: {
      afterDays: 5,
      prompt: "Plot (1, 3), (2, 6), (3, 9). What do you notice about the points?",
    },
    scaffolds: {
      wida: widaLadder(
        ["coordinate plane", "ordered pair", "origin", "x-axis", "y-axis", "proportional", "straight line"],
        [
          "The ordered pair is (___, ___).",
          "The points make a ___ because ___.",
          "The line passes through the origin, which means ___.",
          "As x increases by ___, y increases by ___, so ___.",
        ],
      ),
      twr: twr("The points form a straight line through the origin", "___", "___", "___"),
      languageNote: "'Origin' has an everyday meaning (where something came from) — name the maths meaning explicitly: the point (0, 0).",
    },
    printableAlternative: { resource: "handout", note: "Printed grid with pre-labelled axes." },
    familyConnection: {
      minutes: 5,
      prompt:
        "Look at any graph together — weather, sport, a phone battery. Ask: 'what does going right mean? what does going up mean?'",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "axes-swapped",
          label: "Plots (y, x) instead of (x, y)",
          lookFor: "Points form a line but mirrored about y = x.",
          reteachMove: "'Along the hallway, then up the stairs.' Trace the path with a finger before marking.",
        },
        {
          code: "origin-omitted",
          label: "Does not recognise the line passes through (0, 0)",
          lookFor: "Line drawn starting at the first plotted point only.",
          reteachMove: "Ask what the table says for zero — 0 cups of juice means 0 cups of drink.",
        },
        {
          code: "scale-misread",
          label: "Counts grid squares as 1 when the scale is not 1",
          lookFor: "Points consistently off by a scale multiple.",
          reteachMove: "Read the axis labels aloud together before plotting the first point.",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "All points correct; description names the linear pattern or the origin." },
        { level: "supported", descriptor: "Points correct after a prompt about axis order or scale." },
        { level: "not-yet", descriptor: "Axes swapped or scale misread after support." },
      ],
      transferSuccess:
        "Points such as (1,4), (2,8), (3,12) plotted correctly, with an explanation connecting 0 hours to 0 miles.",
      retentionSuccess: "Three points plotted correctly; notices they line up / are proportional.",
      reteach: {
        title: "Ratio Lab — graphing view",
        href: "/math/unit-3/ratio-lab/index.html",
        why: "Links the table and the plot side by side so the correspondence is visible.",
        alternate: { title: "6.AT.3a On-Ramp", href: "/math/unit-3/6-rp-a-3-a-onramp/index.html" },
      },
      extension: {
        title: "6.AT.3a Enrichment",
        href: "/math/unit-3/6-at-a-3-a-enrichment/index.html",
        why: "Compares two proportional relationships on one grid.",
      },
      facilitationNote:
        "'axes-swapped' is a plotting-convention issue, not a ratio issue — do not reteach ratios for it. Separate the two when grouping.",
    },
  },

  "3-4": {
    prerequisites: [
      "Complete and extend a ratio table (Lesson 3-2).",
      "Multiply and divide to find equal fractions.",
      "Simplify a fraction to lowest terms.",
    ],
    evidenceTask: {
      title: "Equivalent or not?",
      prompt:
        "Are 6:9 and 8:12 equivalent ratios? Show your check, then explain what you did.",
      format: "A worked check + one explanation sentence.",
      timeEstimate: "~5 min",
      accessibility: "Answer may be shown with a table, a drawing, or arithmetic — any valid check counts.",
    },
    transfer: {
      prompt:
        "A recipe uses 4 cups flour to 6 cups water. Another uses 10 cups flour to 15 cups water. Are they the same mixture? Justify your answer.",
      whyNovel: "Requires choosing a check method unprompted, and the scale factor (2.5) is not an integer.",
    },
    retention: {
      afterDays: 5,
      prompt: "Is 3:4 equivalent to 9:12? How do you know?",
    },
    scaffolds: {
      wida: widaLadder(
        ["equivalent", "simplify", "proportion", "rate", "same value", "check"],
        [
          "I divided both numbers by ___.",
          "They are equivalent because ___.",
          "They are not equivalent because ___.",
          "When I simplified, I got ___ and ___, so ___.",
        ],
      ),
      twr: twr("6:9 and 8:12 are not equivalent", "___", "___", "___"),
      languageNote: "'Equivalent' and 'equal' are not the same word here — equivalent ratios are not equal numbers.",
    },
    printableAlternative: { resource: "handout", note: "Paper-and-pencil equivalence checks." },
    familyConnection: {
      minutes: 5,
      prompt:
        "Compare two package sizes at home. Ask your student whether they are 'the same deal' and to explain how they decided.",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "cross-add",
          label: "Adds the same number to both terms",
          lookFor: "Claims 6:9 and 8:11 are equivalent (added 2 to each).",
          reteachMove: "Test it on a recipe — adding 2 cups to each ingredient changes the taste.",
        },
        {
          code: "simplify-one-side",
          label: "Simplifies only one term of the ratio",
          lookFor: "6:9 reduced to 2:9 or 6:3.",
          reteachMove: "Both terms share the divisor — circle the common factor before dividing.",
        },
        {
          code: "assumes-equivalent",
          label: "Assumes any two ratios with the same difference are equivalent",
          lookFor: "3:4 and 5:6 called equivalent (both differ by 1).",
          reteachMove: "Convert both to unit rate and compare the decimals.",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "Correct verdict with a valid check shown and named." },
        { level: "supported", descriptor: "Correct verdict after a prompt to simplify or scale." },
        { level: "not-yet", descriptor: "Additive reasoning (cross-add) persists after support." },
      ],
      transferSuccess:
        "Yes — both simplify to 2:3. Choosing a method without being told which is the signal that matters.",
      retentionSuccess: "Yes; 3:4 × 3 = 9:12, or both simplify to 3:4.",
      reteach: {
        title: "Ratio Fuel Mixer",
        href: "/math/unit-3/ratio-fuel-mixer/index.html",
        why: "Wrong mixtures fail visibly, which contradicts additive reasoning immediately.",
        alternate: { title: "6.AT.1 Review & Learn", href: "/math/unit-3/6-rp-1reviewlearn/index.html" },
      },
      extension: {
        title: "6.AT.3c Enrichment",
        href: "/math/unit-3/6-at-a-3-c-enrichment/index.html",
        why: "Extends equivalence into percent and rate comparisons.",
      },
      facilitationNote:
        "'cross-add' is the highest-value thing to catch in this unit — it survives into Grade 7 proportional reasoning if it is not addressed here.",
    },
  },

  "3-5": {
    prerequisites: [
      "Check whether two ratios are equivalent (Lesson 3-4).",
      "Divide to find a unit rate.",
      "Compare two decimals.",
    ],
    evidenceTask: {
      title: "Which is the better deal?",
      prompt:
        "Shop A sells 4 pens for $3. Shop B sells 6 pens for $4. Which is the better deal? Show how you compared them.",
      format: "A comparison with work shown + one sentence naming the method.",
      timeEstimate: "~6 min",
      accessibility: "Calculator permitted — the target skill is choosing and explaining the comparison, not the division.",
    },
    transfer: {
      prompt:
        "One car travels 120 miles on 4 gallons. Another travels 165 miles on 5 gallons. Which is more efficient, and how do you know?",
      whyNovel: "Rate context with larger numbers; 'better' must be interpreted (more miles per gallon, not fewer).",
    },
    retention: {
      afterDays: 5,
      prompt: "Which is faster: 30 miles in 2 hours, or 60 miles in 3 hours?",
    },
    scaffolds: {
      wida: widaLadder(
        ["unit rate", "per", "compare", "better deal", "more than", "less than"],
        [
          "The unit rate for ___ is ___.",
          "___ is the better deal because ___.",
          "I compared them by ___.",
          "Per one ___, shop A gives ___ and shop B gives ___, so ___.",
        ],
      ),
      twr: twr("Shop B is the better deal", "___", "___", "___"),
      languageNote:
        "'Better' is ambiguous across contexts — for price, lower per-unit is better; for speed or efficiency, higher is better. Name which one applies.",
    },
    printableAlternative: { resource: "handout", note: "Printed comparison task, calculator optional." },
    familyConnection: {
      minutes: 5,
      prompt:
        "At the shop, compare two sizes of the same product. Ask which is the better value and how they can tell.",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "compares-one-quantity",
          label: "Compares only price or only quantity",
          lookFor: "'Shop A is cheaper' with no reference to how many pens.",
          reteachMove: "Ask 'cheaper for how many?' — force both quantities into the sentence.",
        },
        {
          code: "unit-rate-inverted",
          label: "Divides in the wrong order",
          lookFor: "Pens per dollar computed when dollars per pen was intended, then compared as if lower is better.",
          reteachMove: "Write the unit label first ('$ per pen'), then divide to match the label.",
        },
        {
          code: "better-means-bigger",
          label: "Assumes the larger number is always better",
          lookFor: "Picks the higher price-per-unit as the better deal.",
          reteachMove: "Re-read the question aloud and ask what 'better' means for money.",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "Correct choice with a valid comparison shown and the method named." },
        { level: "supported", descriptor: "Correct after a prompt to find a per-one amount." },
        { level: "not-yet", descriptor: "Compares a single quantity, or inverts the rate, after support." },
      ],
      transferSuccess:
        "Second car — 33 mpg vs 30 mpg. Interpreting 'more efficient' correctly is the discriminating signal.",
      retentionSuccess: "60 miles in 3 hours (20 mph vs 15 mph).",
      reteach: {
        title: "6.AT.1 Review & Learn",
        href: "/math/unit-3/6-rp-1reviewlearn/index.html",
        why: "Rebuilds the unit-rate procedure with labels attached at every step.",
        alternate: { title: "Ratio Lab", href: "/math/unit-3/ratio-lab/index.html" },
      },
      extension: {
        title: "6.AT.3c Enrichment",
        href: "/math/unit-3/6-at-a-3-c-enrichment/index.html",
        why: "Multi-step comparisons where the unit rate must be chosen strategically.",
      },
      facilitationNote:
        "Students who invert the unit rate usually have the arithmetic right — group them by the labelling move, not with students who cannot divide.",
    },
  },

  "3-6": {
    prerequisites: [
      "Find and use a unit rate (Lesson 3-5).",
      "Solve a one-step multiplication or division equation.",
      "Complete a ratio table (Lesson 3-2).",
    ],
    evidenceTask: {
      title: "Scale it up",
      prompt:
        "A model is built at a scale of 2 cm to 5 m. The model is 14 cm long. How long is the real object? Show your reasoning.",
      format: "Worked solution + one sentence explaining the strategy.",
      timeEstimate: "~7 min",
      accessibility: "Any valid strategy — table, unit rate, or proportion — earns full credit.",
    },
    transfer: {
      prompt:
        "A map uses 3 cm for every 12 km. Two towns are 20 cm apart on the map. How far apart are they really? Explain which strategy you chose and why.",
      whyNovel: "Map context with a different scale direction; requires selecting a strategy without a prompt.",
    },
    retention: {
      afterDays: 6,
      prompt: "If 2 cm represents 5 m, what does 6 cm represent?",
    },
    scaffolds: {
      wida: widaLadder(
        ["proportion", "scale", "represents", "for every", "equivalent", "unit rate"],
        [
          "___ cm represents ___ m.",
          "I scaled up by ___ because ___.",
          "I used a ___ to solve it because ___.",
          "Since ___ corresponds to ___, then ___ corresponds to ___, so ___.",
        ],
      ),
      twr: twr("I used a ratio table to solve the scale problem", "___", "___", "___"),
      languageNote: "'Scale' has several everyday meanings (weighing, climbing, fish). Anchor the maths meaning with the model.",
    },
    printableAlternative: { resource: "handout", note: "Scale-drawing problems on paper." },
    familyConnection: {
      minutes: 5,
      prompt:
        "Look at a map or a model together. Ask your student what the scale means in their own words.",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "unit-mismatch",
          label: "Ignores the change of units",
          lookFor: "Answer given in cm when the question asks for m.",
          reteachMove: "Label every number with its unit before calculating.",
        },
        {
          code: "scale-inverted",
          label: "Scales the wrong direction",
          lookFor: "Divides when the real object should be larger than the model.",
          reteachMove: "Ask first: 'should the answer be bigger or smaller than 14?' Estimate before solving.",
        },
        {
          code: "cross-multiply-blind",
          label: "Applies cross-multiplication without setting up the proportion correctly",
          lookFor: "Correct procedure on a mis-ordered proportion, giving a plausible but wrong answer.",
          reteachMove: "Write the two labels above the two fractions and check they match before multiplying.",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "Correct answer with correct units and a named strategy." },
        { level: "supported", descriptor: "Correct after a prompt to estimate or to check units." },
        { level: "not-yet", descriptor: "Direction or units still wrong after support." },
      ],
      transferSuccess: "80 km, with the strategy named. An estimate before solving is a strong signal.",
      retentionSuccess: "15 m.",
      reteach: {
        title: "Recipe Factory Line",
        href: "/math/unit-3/recipe-factory-line/index.html",
        why: "Scaling with a fixed ratio, where getting the direction wrong is immediately visible.",
        alternate: { title: "Ratio Lab", href: "/math/unit-3/ratio-lab/index.html" },
      },
      extension: {
        title: "6.AT.3c Enrichment",
        href: "/math/unit-3/6-at-a-3-c-enrichment/index.html",
        why: "Multi-step scaling with unit conversion built in.",
      },
      facilitationNote:
        "'cross-multiply-blind' looks like success on procedural items and only shows up on transfer. Weight the transfer task heavily for this lesson.",
    },
  },

  "3-7": {
    prerequisites: [
      "Find a unit rate (Lesson 3-5).",
      "Solve a scaling problem with a proportion (Lesson 3-6).",
      "Interpret a word problem and identify the question.",
    ],
    evidenceTask: {
      title: "Rate in the real world",
      prompt:
        "A printer prints 24 pages in 3 minutes. How many pages in 10 minutes? Show your work and state the unit rate you used.",
      format: "Worked solution + the unit rate named with its units.",
      timeEstimate: "~7 min",
      accessibility: "Calculator permitted; the reasoning and the unit label are what is assessed.",
    },
    transfer: {
      prompt:
        "A tap fills 18 litres in 4 minutes. A second tap fills 30 litres in 6 minutes. Working together, roughly how long to fill a 96-litre tank? Explain your thinking.",
      whyNovel: "Two rates must be combined — no procedure taught in the unit covers this directly.",
    },
    retention: {
      afterDays: 7,
      prompt: "A car uses 8 litres of fuel every 100 km. How much for 250 km?",
    },
    scaffolds: {
      wida: widaLadder(
        ["rate", "unit rate", "per", "per minute", "how many", "altogether"],
        [
          "The unit rate is ___ per ___.",
          "In ___ minutes it will ___ because ___.",
          "I found the rate for one ___, so ___.",
          "Since the rate is ___, multiplying by ___ gives ___, which means ___.",
        ],
      ),
      twr: twr("I found the unit rate first", "___", "___", "___"),
      languageNote:
        "'Per' is the key function word for this lesson and has no direct equivalent in some home languages — teach it explicitly as 'for every one'.",
    },
    printableAlternative: { resource: "handout", note: "Word problems on paper, calculator optional." },
    familyConnection: {
      minutes: 5,
      prompt:
        "Talk about a rate you use — miles per hour, cost per week, minutes per episode. Ask your student to explain what the 'per' means.",
      optional: true,
    },
    teacherOnly: {
      misconceptions: [
        {
          code: "no-unit-rate",
          label: "Scales without finding a rate, and stalls on non-multiples",
          lookFor: "Doubles 3 minutes to 6, then cannot reach 10.",
          reteachMove: "Find the value for ONE minute first, then multiply.",
        },
        {
          code: "rate-inverted",
          label: "Computes minutes per page instead of pages per minute",
          lookFor: "Answer is 0.125 or similar and is not questioned for reasonableness.",
          reteachMove: "Write the unit label first, then divide to match it.",
        },
        {
          code: "no-reasonableness-check",
          label: "Accepts an implausible answer",
          lookFor: "Answer far larger or smaller than sensible, with no comment.",
          reteachMove: "Estimate before solving: 'about how many — closer to 10 or 100?'",
        },
      ],
      rubric: [
        { level: "independent", descriptor: "Correct answer, unit rate named with units, work shown." },
        { level: "supported", descriptor: "Correct after a prompt to find the per-one amount." },
        { level: "not-yet", descriptor: "Rate inverted or absent after support." },
      ],
      transferSuccess:
        "About 8 minutes (4.5 + 5 = 9.5 litres/min). Combining two rates at all is the signal — an approximate answer with sound reasoning counts as success.",
      retentionSuccess: "20 litres.",
      reteach: {
        title: "6.AT.1 Review & Learn",
        href: "/math/unit-3/6-rp-1reviewlearn/index.html",
        why: "Rebuilds unit-rate reasoning with the labelling step made explicit.",
        alternate: { title: "Unit 3 Study Guide", href: "/math/unit-3/study-guide/index.html" },
      },
      extension: {
        title: "6.AT.3c Enrichment",
        href: "/math/unit-3/6-at-a-3-c-enrichment/index.html",
        why: "Multi-rate and combined-rate problems for students ready to go beyond the standard.",
      },
      facilitationNote:
        "This is the unit's transfer checkpoint. A student who succeeds here but failed 3-4's transfer has likely memorised a procedure — check 3-4 before moving to Unit 4.",
    },
  },
};

// The flagship variant teaches the same standard and objective as 3-1.
LESSONS["3-1-flagship"] = LESSONS["3-1"];

const META = { version: 1, status: "draft", pilot: "unit-3-learning-loop", reviewedOn: REVIEWED_ON, reviewedBy: "" };

/* Student-safe projection: everything EXCEPT teacherOnly. Built by omission so a
   newly added teacher field can never leak by default. */
function studentProjection(id) {
  const body = LESSONS[id];
  if (!body) return null;
  const { teacherOnly: _omit, ...safe } = body;
  return { ...META, ...safe };
}

const TEACHER_BANNER = `/* GENERATED by scripts/seed-unit3-learning-loop.mjs — do not hand-edit.
 *
 * PRIVATE teacher-only companion to the Unit 3 Learning Loop. This file holds
 * misconception diagnoses, rubrics, reteach/extension routing and SUCCESS
 * CRITERIA (which contain answers). It lives under functions/ because Cloudflare
 * Pages compiles functions/ into the Worker and never serves it as a static
 * asset — unlike lessons/<id>/config.json, which is public.
 *
 * Never import this from client-side code, and never echo it into an HTML
 * response that is not behind the TEACHER_KEY gate.
 */\n`;

function writeTeacherModule() {
  const out = {};
  for (const [id, body] of Object.entries(LESSONS)) {
    if (body.teacherOnly) out[id] = { ...META, ...body.teacherOnly };
  }
  const file = join(ROOT, "functions", "_lib", "unit3-loop-teacher.js");
  const next = `${TEACHER_BANNER}export const UNIT3_LOOP_TEACHER = ${JSON.stringify(out, null, 2)};\n\nexport default UNIT3_LOOP_TEACHER;\n`;
  const prev = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (next === prev) return false;
  if (!DRY) writeFileSync(file, next);
  console.log(`${DRY ? "would write" : "✓ wrote"} functions/_lib/unit3-loop-teacher.js (${Object.keys(out).length} lessons, private)`);
  return true;
}

function main() {
  let written = 0;
  let skipped = 0;

  for (const id of Object.keys(LESSONS)) {
    const file = join(ROOT, "lessons", id, "config.json");
    if (!existsSync(file)) {
      console.warn(`… skip ${id} (no config.json)`);
      skipped += 1;
      continue;
    }
    const raw = readFileSync(file, "utf8");
    const cfg = JSON.parse(raw);

    if (REVERT) {
      if (!cfg.loop) {
        skipped += 1;
        continue;
      }
      delete cfg.loop;
    } else {
      cfg.loop = studentProjection(id);
    }

    const next = JSON.stringify(cfg, null, 2) + "\n";
    if (next === raw) {
      skipped += 1;
      continue;
    }
    if (!DRY) writeFileSync(file, next);
    written += 1;
    console.log(`${DRY ? "would write" : "✓ wrote"} lessons/${id}/config.json (student-safe)`);
  }

  if (REVERT) {
    const file = join(ROOT, "functions", "_lib", "unit3-loop-teacher.js");
    if (existsSync(file) && !DRY) rmSync(file);
  } else {
    writeTeacherModule();
  }

  const verb = REVERT ? "reverted" : "seeded";
  console.log(`\n${DRY ? "[dry-run] " : ""}${verb} ${written} lesson config(s), ${skipped} unchanged.`);
  if (!DRY && written) console.log("Next: npm run curriculum:rebuild");
}

main();
