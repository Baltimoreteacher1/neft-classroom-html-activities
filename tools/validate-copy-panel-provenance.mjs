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
      if (!traces(p.rule, keyIdea)) {
        errors.push(`${id} box 2: rule "${p.rule}" is not stated in this lesson's keyIdea`);
      }
      if (p.meaning && !traces(p.meaning, keyIdea)) {
        errors.push(`${id} box 2: meaning is not stated in this lesson's keyIdea`);
      }
      if (p.example && !traces(p.example, iDo)) {
        errors.push(
          `${id} box 2: example "${p.example}" is not printed by this lesson's worked example`,
        );
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
  let both = 0;
  let one = 0;
  let none = 0;

  for (const id of ids) {
    const config = JSON.parse(readFileSync(join(LESSONS, id, "config.json"), "utf8"));
    if (!config.notebook) continue;
    const { errors, panels } = checkLesson(id, config);
    allErrors.push(...errors);
    if (panels >= 2) both++;
    else if (panels === 1) one++;
    else none++;
  }

  console.log(`  Coverage: ${both} lessons with two panels, ${one} with one, ${none} with none.`);
  if (both === ids.length) {
    console.error(
      "  WARNING  every lesson carries both panels. Full coverage is the shape the invented content took; re-read before trusting it.",
    );
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
