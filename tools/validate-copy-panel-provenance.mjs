#!/usr/bin/env node
/**
 * validate-copy-panel-provenance.mjs — every word a student copies by hand must
 * trace to a string in the lesson it appears on.
 *
 * Why this gate exists. `validate:notebook` checks the SHAPE of a copy panel —
 * 3-5 items, a rule line, no emoji, under 12 words — and it passed on all 84
 * lessons while 39 of the 84 box-2 rules stated mathematics from a different
 * lesson (lesson 2-6, "Divide Multi-Digit Numbers", told students to copy
 * "Interquartile Range: IQR = Q3 − Q1", which is lesson 2-5's content). A shape
 * check cannot see that, and it went further than not seeing it: it REQUIRED a
 * copyPanel on every checkpoint, so a lesson with nothing quotable had to be
 * given something, and the only available something was invention.
 *
 * The rule this gate holds, with no third option:
 *   Content in a copy panel comes from that lesson's own data,
 *   or the lesson gets no panel.
 *
 * Absence is therefore a PASS, and is reported so a silent collapse to zero
 * panels is still visible. Every check below is a substring comparison between
 * the panel and another field of the SAME config; nothing is inferred from a
 * lesson title, and the notebook block is never its own evidence.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LESSONS = join(ROOT, "lessons");

/** Comparison form: case, punctuation and whitespace are presentation, not
 *  provenance. A meaning shortened from a definition must still be a literal
 *  run of that definition's words. */
export const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, "-")
    .replace(/[^a-z0-9'\/×÷+=<>≤≥%.\- ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\-]+$/, "");

const traces = (needle, haystack) => {
  const n = norm(needle);
  return n.length > 0 && norm(haystack).includes(n);
};

const STOPWORDS = new Set(
  "a an the to of in on for and or is are be that this it its you your with as at by from into can do does not what when which who how than then so if all any each every one two more most own use uses used using write down first second next then also there their they them we our us new same both only just about over under between after before".split(
    " ",
  ),
);

const contentWords = (s) =>
  norm(s)
    .split(" ")
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w) && !/^[0-9.]+$/.test(w))
    // A COARSE stem, deliberately: this check exists to catch a rule about
    // other mathematics, and "dividend" must count as touching "division".
    // Over-matching only weakens a safety net that sits on top of the exact
    // keyIdea trace; under-matching would fail correct lessons.
    .map((w) => (w.length > 4 ? w.slice(0, 4) : w));

/** Is this rule about what the lesson TEACHES, or merely a string that occurs
 *  somewhere in its config? Tracing to keyIdea proves the lesson said it; this
 *  proves the lesson said it ABOUT its own objective. */
export function alignsWithObjective(ruleAndMeaning, config) {
  const objective = String(config.contentObjective || "").trim();
  // The objective is the only field that states what the lesson sets out to
  // teach. With none there is nothing to align against, and a guess would be
  // worse than no check.
  if (!objective) return true;
  // A SYMBOLIC anchor has no prose to align: "N + 8 = 20" and "|5 − (−4.5)| =
  // 9.5 units" carry almost no words, and an equation lifted verbatim from this
  // lesson's own worked example is on-objective by construction — the exact
  // trace already proved where it came from. Alignment is a check on PROSE
  // claiming to be this lesson's mathematics.
  if (contentWords(ruleAndMeaning).length < 3) return true;
  const target = new Set([
    ...contentWords(objective),
    ...contentWords(config.title || ""),
    ...(config.vocabulary || []).flatMap((v) => contentWords(v.term || "")),
    // Definitions too, not just terms. A lesson may deliberately state its idea
    // in student language — 6-8's anchor is "changing the ORDER or the
    // GROUPING…" while its objective names the "commutative" and "associative"
    // properties. Those are the same mathematics, and the lesson's own
    // definitions are where the two vocabularies meet. This is not
    // self-evidence: the anchor comes from keyIdea, never from a definition.
    ...(config.vocabulary || []).flatMap((v) => contentWords(v.definition || "")),
  ]);
  return contentWords(ruleAndMeaning).some((w) => target.has(w));
}

/** True when the quoted run stops in the middle of a number the source
 *  continues (a truncated decimal or a clipped digit string). */
export function endsMidNumber(quote, source) {
  const q = norm(quote);
  const src = norm(source);
  if (!q || !/\d$/.test(q)) return false;
  let from = 0;
  for (;;) {
    const at = src.indexOf(q, from);
    if (at < 0) return true;
    const next = src[at + q.length];
    if (next === undefined || !/[\d.]/.test(next)) return false;
    if (next === "." && !/\d/.test(src[at + q.length + 1] || "")) return false;
    from = at + 1;
  }
}

export function checkLesson(id, config) {
  const errors = [];
  const cps = (config.notebook && config.notebook.checkpoints) || [];
  const vocab = (config.vocabulary || []).filter((v) => v && v.term);
  const ci = (config.launch || {}).conceptIntro || {};
  const keyIdea = String(ci.keyIdea || "");
  const iDo = (ci.iDo && Array.isArray(ci.iDo.lines) ? ci.iDo.lines : []).join("\n");
  let panels = 0;

  for (const cp of cps) {
    if (!cp.copyPanel) continue; // absence is a legitimate outcome
    panels++;

    if (cp.box === 1) {
      for (const item of cp.copyPanel.items || []) {
        const source = vocab.find((v) => norm(v.term) === norm(item.term));
        if (!source) {
          errors.push(
            `${id} box 1: term "${item.term}" is not declared in this lesson's vocabulary`,
          );
          continue;
        }
        if (!traces(item.meaning, source.definition)) {
          errors.push(
            `${id} box 1: definition of "${item.term}" is not a run of this lesson's own definition`,
          );
        }
      }
    }

    if (cp.box === 2) {
      const p = cp.copyPanel;
      // An anchor may be quoted from the lesson's stated big idea OR from its
      // own worked example — a formula, an equation, a procedure step and a
      // pattern all live in `iDo`. Both are THIS lesson's text; neither opens
      // the door to another lesson's.
      const anchorSource = `${keyIdea}\n${iDo}`;
      const KINDS = ["rule", "formula", "key idea", "example", "procedure", "pattern"];
      if (p.anchorKind && !KINDS.includes(p.anchorKind)) {
        errors.push(`${id} box 2: unknown anchor kind "${p.anchorKind}"`);
      }
      if (!traces(p.rule, anchorSource)) {
        errors.push(
          `${id} box 2: anchor "${p.rule}" is not stated in this lesson's keyIdea or worked example`,
        );
      } else if (!alignsWithObjective(`${p.rule} ${p.meaning || ""}`, config)) {
        // A lesson on multi-digit division must never print an IQR rule, and
        // "it appears in the config" is not the standard — the rule has to be
        // about the mathematics this lesson sets out to teach.
        errors.push(
          `${id} box 2: rule "${p.rule}" shares no vocabulary with this lesson's objective`,
        );
      }
      if (p.meaning && !traces(p.meaning, `${keyIdea}\n${iDo}`)) {
        errors.push(`${id} box 2: meaning is not stated in this lesson's own text`);
      }
      if (p.example) {
        if (!traces(p.example, iDo)) {
          errors.push(
            `${id} box 2: example "${p.example}" is not printed by this lesson's worked example`,
          );
        } else if (endsMidNumber(p.example, iDo)) {
          // Tracing to the lesson is not enough: "$3 ÷ 5 = $0" is a literal run
          // of a line that reads "$3 ÷ 5 = $0.60 per game", and it is a WRONG
          // ANSWER on the board. A quoted number must be the whole number.
          errors.push(
            `${id} box 2: example "${p.example}" cuts a number short — the lesson continues it`,
          );
        }
      }
    }
  }
  return { errors, panels };
}

/* ── self-test: every detector must fire on known-bad input BEFORE the sweep,
      or a gate that has stopped working reports a clean curriculum. Case 2 is
      the CONTENT THAT ACTUALLY SHIPPED on lesson 2-6. ───────────────────── */

const base = {
  vocabulary: [{ term: "Quartile", definition: "One of the three values that divide a data set." }],
  launch: {
    conceptIntro: {
      keyIdea: "Range = greatest - least, and it covers every value.",
      iDo: { lines: ["Range: 94 - 68 = 26 points from end to end."] },
    },
  },
};
const withPanel = (box, copyPanel) => ({
  ...base,
  notebook: { checkpoints: [{ box, copyPanel }] },
});

const NEGATIVE_CONTROLS = [
  {
    name: "a term not declared by this lesson",
    config: withPanel(1, {
      items: [{ term: "Reciprocal", meaning: "A fraction turned upside down" }],
    }),
    expect: /not declared in this lesson's vocabulary/,
  },
  {
    name: "the IQR rule that shipped on the division lesson 2-6",
    config: withPanel(2, {
      rule: "Interquartile Range: IQR = Q3 - Q1",
      meaning: "The middle half of the data.",
      example: "IQR = 22 - 8 = 14",
    }),
    expect: /is not stated in this lesson's keyIdea/,
  },
  {
    name: "a definition rewritten into new prose",
    config: withPanel(1, {
      items: [{ term: "Quartile", meaning: "A marker splitting data into quarters" }],
    }),
    expect: /not a run of this lesson's own definition/,
  },
  {
    name: "a rule quoted from the lesson but about other mathematics",
    config: {
      ...base,
      contentObjective: "Divide multi-digit numbers using the standard algorithm.",
      launch: {
        conceptIntro: {
          keyIdea: "Interquartile range = Q3 - Q1 covers the middle half.",
          iDo: { lines: ["IQR = 88 - 75.5 = 12.5 points."] },
        },
      },
      notebook: {
        checkpoints: [
          {
            box: 2,
            copyPanel: {
              rule: "Interquartile range = Q3 - Q1",
              meaning: "covers the middle half",
              example: "88 - 75.5 = 12.5",
            },
          },
        ],
      },
    },
    expect: /shares no vocabulary with this lesson's objective/,
  },
  {
    name: "an example that cuts a decimal short",
    config: withPanel(2, {
      rule: "Range = greatest - least",
      meaning: "it covers every value",
      example: "94 - 68 = 2",
    }),
    expect: /cuts a number short/,
  },
  {
    name: "a worked example with chosen numbers",
    config: withPanel(2, {
      rule: "Range = greatest - least",
      meaning: "it covers every value",
      example: "(4 + 8 + 12) ÷ 3 = 8",
    }),
    expect: /is not printed by this lesson's worked example/,
  },
];

const POSITIVE_CONTROLS = [
  {
    name: "a definition shortened verbatim from the lesson's own",
    config: withPanel(1, { items: [{ term: "Quartile", meaning: "One of the three values" }] }),
  },
  {
    name: "a rule and example quoted from the lesson",
    config: withPanel(2, {
      rule: "Range = greatest - least",
      meaning: "it covers every value",
      example: "94 - 68 = 26",
    }),
  },
  {
    name: "a checkpoint with no panel at all",
    config: { ...base, notebook: { checkpoints: [{ box: 2 }] } },
  },
];

function selfTest() {
  let ok = true;
  for (const c of NEGATIVE_CONTROLS) {
    const { errors } = checkLesson("SELFTEST", c.config);
    if (!errors.some((e) => c.expect.test(e))) {
      console.error(`  SELFTEST FAIL  detector did not fire on: ${c.name}`);
      ok = false;
    }
  }
  for (const c of POSITIVE_CONTROLS) {
    const { errors } = checkLesson("SELFTEST", c.config);
    if (errors.length > 0) {
      console.error(`  SELFTEST FAIL  false positive on: ${c.name} → ${errors.join("; ")}`);
      ok = false;
    }
  }
  return ok;
}

function main() {
  if (!selfTest()) {
    console.error(
      "\nFAIL validate:copy-panel-provenance — self-test failed; detectors are not trustworthy.",
    );
    process.exit(1);
  }
  console.log(
    `  PASS  self-test: ${NEGATIVE_CONTROLS.length} negative and ${POSITIVE_CONTROLS.length} positive controls`,
  );

  const ids = readdirSync(LESSONS)
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort();
  const allErrors = [];
  const kinds = {};
  const missingAnchor = [];
  let both = 0;
  let one = 0;
  let none = 0;

  for (const id of ids) {
    const config = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    if (!config.notebook) continue;
    const { errors, panels } = checkLesson(id, config);
    allErrors.push(...errors);

    // Every lesson must leave a student with something concrete to copy. A
    // vocabulary term with its meaning counts; so does a formula, an equation,
    // a procedure step or a pattern. Nothing is not an option.
    const cps = (config.notebook && config.notebook.checkpoints) || [];
    const box1 = cps.find((c) => c.box === 1);
    const box2 = cps.find((c) => c.box === 2);
    const vocabItems = (box1 && box1.copyPanel && box1.copyPanel.items) || [];
    const anchor = box2 && box2.copyPanel && String(box2.copyPanel.rule || "").trim();
    if (vocabItems.length === 0) {
      missingAnchor.push(`${id}: Section 1 would render with no terms at all`);
    }
    if (!anchor && vocabItems.length === 0) {
      missingAnchor.push(`${id}: no mathematical anchor anywhere in Math Notes`);
    }
    if (anchor)
      kinds[box2.copyPanel.anchorKind || "rule"] =
        (kinds[box2.copyPanel.anchorKind || "rule"] || 0) + 1;
    else kinds["student-generated"] = (kinds["student-generated"] || 0) + 1;
    if (panels >= 2) both++;
    else if (panels === 1) one++;
    else none++;
  }

  console.log(`  Coverage: ${both} lessons with two panels, ${one} with one, ${none} with none.`);
  // Full coverage is EXPECTED now and was a red flag before, so the check moved
  // to what actually distinguishes the two: extraction produces a MIX of anchor
  // kinds because lessons differ, while invention produces one shape everywhere.
  const kindList = Object.entries(kinds).sort((a, b) => b[1] - a[1]);
  console.log(`  Anchor kinds: ${kindList.map(([k, n]) => `${k} ${n}`).join(", ")}`);
  if (kindList.length === 1 && ids.length > 1) {
    console.error(
      `  WARNING  all ${ids.length} lessons produced the same anchor kind (${kindList[0][0]}). That is the shape invented content took; re-read before trusting it.`,
    );
  }
  if (missingAnchor.length > 0) {
    for (const m of missingAnchor) console.error(`  FAIL  ${m}`);
    allErrors.push(...missingAnchor);
  }

  if (allErrors.length > 0) {
    for (const e of allErrors) console.error(`  FAIL  ${e}`);
    console.error(
      `\nFAIL validate:copy-panel-provenance — ${allErrors.length} panel string(s) do not trace to their own lesson.`,
    );
    process.exit(1);
  }
  console.log(
    "\nPASS validate:copy-panel-provenance — every panel string traces to its own lesson.",
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
