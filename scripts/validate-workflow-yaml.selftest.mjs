#!/usr/bin/env node
/**
 * Self-test for the workflow duplicate-key scanner.
 *
 * A gate that stops firing is worse than no gate, and this one is hand-rolled
 * (no YAML dependency), so its edge cases are asserted rather than assumed.
 * The false-positive cases matter most: predeploy-verify.yml embeds a large
 * `prompt: |` block whose lines look exactly like YAML keys (`OUTPUT:`,
 * `HARD RULES (non-negotiable):`). A scanner that flags those is unusable and
 * would be disabled within a day.
 *
 * Run: npm run validate:workflow-yaml:selftest
 */
import { findDuplicateKeys } from "./validate-workflow-yaml.mjs";

let pass = 0;
let fail = 0;

function check(name, yaml, expectedKeys) {
  const got = findDuplicateKeys(yaml)
    .map((d) => d.key)
    .sort();
  const want = [...expectedKeys].sort();
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(
      `✗ ${name}\n    expected duplicates ${JSON.stringify(want)}, got ${JSON.stringify(got)}`,
    );
  }
}

/* ---------------------------------------------------- true positives */

check(
  "the real codex-verify regression: two top-level `concurrency:`",
  `
name: Codex Verify
on:
  pull_request:
concurrency:
  group: a
permissions:
  contents: read
concurrency:
  group: b
jobs:
  verify:
    runs-on: ubuntu-latest
`,
  ["concurrency"],
);

check(
  "duplicate nested key",
  `
jobs:
  build:
    runs-on: ubuntu-latest
    runs-on: macos-latest
`,
  ["runs-on"],
);

check(
  "duplicate inside one list item",
  `
steps:
  - name: a
    uses: x
    uses: y
`,
  ["uses"],
);

/* --------------------------------------------------- false positives */

check(
  "block scalar contents are text, not keys",
  `
jobs:
  a:
    steps:
      - name: Claude
        with:
          prompt: |
            HARD RULES (non-negotiable):
            OUTPUT:
            OUTPUT:
            WHAT TO INSPECT:
        run: echo done
`,
  [],
);

check(
  "folded scalar with indicator (>-) also skipped",
  `
with:
  claude_args: >-
    --max-turns 25
    foo: bar
    foo: bar
`,
  [],
);

check(
  "same key in DIFFERENT list items is legal",
  `
steps:
  - name: one
    run: a
  - name: two
    run: b
`,
  [],
);

check(
  "same key at different nesting levels is legal",
  `
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
`,
  [],
);

check(
  "colon in a value is not a key",
  `
jobs:
  a:
    container: node:22
    run: echo "time: now"
    run2: git log --format='%h: %s'
`,
  [],
);

check(
  "commented-out duplicate does not count",
  `
concurrency:
  group: a
# concurrency:
#   group: b
`,
  [],
);

check(
  "sibling jobs with identical inner keys are legal",
  `
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`,
  [],
);

console.log(`workflow-yaml self-test: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
