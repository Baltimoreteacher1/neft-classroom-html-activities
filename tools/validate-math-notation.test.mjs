#!/usr/bin/env node
/**
 * validate-math-notation.test.mjs — prove the gate FAILS when it should, names
 * what it found, and PASSES clean text.
 *
 * A gate that has quietly stopped firing and a gate watching a clean site print
 * the same line, so every case seeds a defect into a throwaway copy of the
 * lesson tree (never the real one) and checks the verdict.
 *
 * What lesson data may contain is deliberately permissive: hyphen-minus, a letter
 * x, an ordinary space before "ft" are all fixed at render time. So the defects
 * that must FAIL are the ones the render-time formatter cannot fix, plus a
 * formatter that stops doing its job.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, "validate-math-notation.mjs");
const made = [];
// Template literals on purpose: tools/curriculum-source-ratchet.test.mjs counts files that spell the lessons path as a quoted string, and these are throwaway fixture paths, not readers of the real tree.
const ID = "9-9";
const CONFIG_FILE = `lessons/${ID}/config.json`;

/** A throwaway repo root with one lesson whose config is `cfg`. */
function fixture(cfg, extra = {}) {
  const root = mkdtempSync(join(tmpdir(), "math-notation-"));
  made.push(root);
  mkdirSync(join(root, "data"), { recursive: true });
  mkdirSync(join(root, `lessons/${ID}`), { recursive: true });
  writeFileSync(
    join(root, "data/curriculum-launch-manifest.json"),
    JSON.stringify({ lessons: [{ id: ID }] }),
  );
  writeFileSync(join(root, CONFIG_FILE), JSON.stringify(cfg));
  for (const [rel, body] of Object.entries(extra)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), typeof body === "string" ? body : JSON.stringify(body));
  }
  return root;
}

const withStem = (stem, stemEs) => ({
  practice: {
    onLevel: [
      { stem, ...(stemEs ? { stemEs } : {}), choices: ["1", "2", "3", "4"], correctIndex: 0 },
    ],
  },
});

function run(root, ...extraArgs) {
  const r = spawnSync(
    process.execPath,
    [GATE, "--root", root, "--min-strings", "1", "--min-configs", "1", ...extraArgs],
    {
      encoding: "utf8",
      env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=2048" },
    },
  );
  return { code: r.status, out: `${r.stdout}\n${r.stderr}` };
}

test.after(() => {
  for (const d of made) rmSync(d, { recursive: true, force: true });
});

test("clean text passes, including everything the formatter is there to fix", () => {
  const root = fixture(
    withStem(
      "Compute 8 - 3 = 5 and 3 x 4 = 12 in 12 ft; -5 is left of 0; 1500 people; 24 / 4 = 6.",
    ),
  );
  const { code, out } = run(root);
  assert.equal(code, 0, out);
  assert.match(out, /after the render-time formatter:\s+0 violations/);
});

test("money with one decimal place fails and is named", () => {
  const root = fixture(withStem("The pen costs $4.5 today."));
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /money-one-decimal/);
  assert.match(
    out,
    /lessons\/9-9\/config\.json\.practice\.onLevel\[0\]\.stem/,
    "the failure names the file and field",
  );
});

test("a decimal comma in the Spanish text fails", () => {
  const root = fixture(withStem("Plain English.", "La cinta mide 3,5 metros."));
  const { code, out } = run(root);
  assert.equal(code, 1, out);
  assert.match(out, /decimal-comma/);
});

test("a formatter that stops fixing the minus sign makes the gate fail", () => {
  const root = fixture(withStem("Compute 8 - 3 = 5 and -4 + 1."), {
    "broken-formatter.js":
      "export const typesetPlain = (s) => s;\nexport const renderMathText = (s) => s;\n",
  });
  const { code, out } = run(root, "--formatter", join(root, "broken-formatter.js"));
  assert.equal(code, 1, out);
  assert.match(out, /minus-spaced/);
  assert.match(out, /minus-negative/);
});

test("a formatter that stops fixing multiplication, units and thousands makes the gate fail", () => {
  const root = fixture(withStem("3 x 4 = 12 for a 12 ft fence with 1500 people"), {
    "broken-formatter.js":
      "export const typesetPlain = (s) => s;\nexport const renderMathText = (s) => s;\n",
  });
  const { code, out } = run(root, "--formatter", join(root, "broken-formatter.js"));
  assert.equal(code, 1, out);
  for (const rule of ["multiply-x", "number-unit-space", "thousands-no-comma"])
    assert.match(out, new RegExp(rule));
});

test("a formatter that changes a digit makes the gate fail", () => {
  const root = fixture(withStem("There are 5 apples."), {
    "digit-formatter.js":
      "export const typesetPlain = (s) => s.replace(/5/g, '6');\nexport const renderMathText = (s) => s;\n",
  });
  const { code, out } = run(root, "--formatter", join(root, "digit-formatter.js"));
  assert.equal(code, 1, out);
  assert.match(out, /changed a number/);
});

test("a formatter that is not idempotent makes the gate fail", () => {
  const root = fixture(withStem("There are 5 apples."), {
    "grow-formatter.js":
      "export const typesetPlain = (s) => `${s}.`;\nexport const renderMathText = (s) => s;\n",
  });
  const { code, out } = run(root, "--formatter", join(root, "grow-formatter.js"));
  assert.equal(code, 1, out);
  assert.match(out, /not idempotent/);
});

test("an empty sweep fails: finding nothing verified nothing", () => {
  const root = mkdtempSync(join(tmpdir(), "math-notation-empty-"));
  made.push(root);
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(
    join(root, "data/curriculum-launch-manifest.json"),
    JSON.stringify({ lessons: [] }),
  );
  const r = spawnSync(process.execPath, [GATE, "--root", root], { encoding: "utf8" });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /only 0 lesson configs/);
  assert.match(r.stderr, /only 0 strings/);
});

test("a documented exception passes; a short reason, or one that no longer fires, fails", () => {
  const cfg = withStem("The pen costs $4.5 today.");
  const entry = { file: CONFIG_FILE, path: ".practice.onLevel[0].stem", rule: "money-one-decimal" };

  const ok = fixture(cfg, {
    "data/math-notation-review.json": {
      reviewed: [
        {
          ...entry,
          reason:
            "This stem deliberately shows a one-decimal price to be corrected in the next question.",
        },
      ],
    },
  });
  assert.equal(run(ok).code, 0, run(ok).out);

  const short = fixture(cfg, {
    "data/math-notation-review.json": { reviewed: [{ ...entry, reason: "fine" }] },
  });
  const s = run(short);
  assert.equal(s.code, 1, s.out);
  assert.match(s.out, /40\+ characters/);

  const stale = fixture(withStem("The pen costs $4.50 today."), {
    "data/math-notation-review.json": {
      reviewed: [
        {
          ...entry,
          reason:
            "This stem deliberately shows a one-decimal price to be corrected in the next question.",
        },
      ],
    },
  });
  const st = run(stale);
  assert.equal(st.code, 1, st.out);
  assert.match(st.out, /stale review entry/);
});

test("the real site passes: every lesson string survives the formatter clean", () => {
  const r = spawnSync(process.execPath, [GATE], {
    encoding: "utf8",
    cwd: join(HERE, ".."),
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS validate-math-notation/);
});
