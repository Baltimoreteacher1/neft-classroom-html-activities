// Hand-verification record for tools/lib/copy-scan.mjs (2026-10-27).
//
// For each detector, a spread sample of up to 20 hits was read in context by a
// person (`node tools/report-copy-scan.mjs --rule <id> --samples 20`) and judged
// a true or false positive. The numbers are for the FINAL detector. A detector
// above ~10% false positives was tightened or dropped; the first-pass figures
// that forced that are kept in `note` so the reasoning survives. Pure data: the
// gates do not read it, people do.
export const HAND_VERIFIED = {
  "minus-negative": { sampled: 20, falsePositives: 0 },
  "minus-spaced": { sampled: 20, falsePositives: 0 },
  "multiply-x": { sampled: 20, falsePositives: 0 },
  "divide-slash-spaced": {
    sampled: 20,
    falsePositives: 0,
    note: "first pass 3/20 (point labels like $7 / 10%); now requires an equation",
  },
  "thousands-no-comma": { sampled: 20, falsePositives: 0 },
  "number-unit-space": {
    sampled: 40,
    falsePositives: 0,
    note: "first pass 2/40: a fraction's denominator (1/3 mile) and a Spanish word starting with m; both excluded",
  },
  "percent-space": {
    sampled: 20,
    falsePositives: 0,
    note: "Spanish text only; fixed by the no-break space",
  },
  "money-one-decimal": {
    sampled: 6,
    falsePositives: 0,
    note: "first pass 6/6 were scaled amounts ($2.5M, $10.5 million); now excluded, 0 hits remain",
  },
  "term-variant": { sampled: 5, falsePositives: 0 },
  "generic-feedback (engine)": {
    sampled: 12,
    falsePositives: 0,
    note: "after ignoring one-word state names such as wrong / incorrect (first pass 71 hits, 59 of them CSS state names)",
  },
  "title-case button (engine)": { sampled: 10, falsePositives: 0 },
  "multiple-exclamations": { sampled: 1, falsePositives: 0 },
  "banned-belittling": {
    note: "dropped 'clearly' and 'simply': 41 of 41 hits were ordinary adverbs. 'obviously', 'trivial' and the rest have 0 hits in the data",
  },
  "banned-blaming": {
    note: "dropped 'you should have': the one hit taught a self-check, it did not blame",
  },
  "banned-babyish": {
    note: "dropped 'boys and girls': the one hit was a class-composition ratio",
  },
  "heading-title-case": {
    note: "limited to the lesson `heading` field: menuTitle and eyebrow are the proper names of a story, 53 of 53 first-pass hits were false",
  },
  "info-trailing-zero": {
    note: "NOT GATED: about half were aligned-decimal addition, percent-to-decimal or money without a dollar sign",
  },
};
