#!/usr/bin/env node
/**
 * validate-microcopy.test.mjs — prove the gate FAILS on each class of bad copy,
 * names it, and PASSES clean copy. Every case seeds a defect into a throwaway
 * tree (never the real one): a gate that stopped firing prints the same line as
 * a gate watching a clean site.
 *
 * Also unit-tests the dictionary the engine reads, because the engine and the
 * gate must agree on what "says what to try" means.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  AUTHORED_BOILERPLATE,
  isGenericFeedback,
  MISS_COACH,
  missCoach,
  preferredFor,
} from "@eduwonderlab/engine/core/copy-dictionary.js";
import { fleschKincaid } from "./lib/copy-scan.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = join(HERE, "validate-microcopy.mjs");
const made = [];
// Template literals on purpose: tools/curriculum-source-ratchet.test.mjs counts files that spell the lessons path as a quoted string, and these are throwaway fixture paths, not readers of the real tree.
const ID = "9-9";
const CONFIG_FILE = `lessons/${ID}/config.json`;

const CLEAN_ENGINE =
  'export const label = "Check answer";\nexport const miss = "Not quite. Compare each number you used with the problem.";\n';

function fixture(cfg, { engine = CLEAN_ENGINE, extra = {} } = {}) {
  const root = mkdtempSync(join(tmpdir(), "microcopy-"));
  made.push(root);
  mkdirSync(join(root, "data"), { recursive: true });
  mkdirSync(join(root, `lessons/${ID}`), { recursive: true });
  mkdirSync(join(root, "engine/components"), { recursive: true });
  writeFileSync(
    join(root, "data/curriculum-launch-manifest.json"),
    JSON.stringify({ lessons: [{ id: ID }] }),
  );
  writeFileSync(join(root, CONFIG_FILE), JSON.stringify(cfg));
  writeFileSync(join(root, "engine/components/widget.js"), engine);
  for (const [rel, body] of Object.entries(extra)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), typeof body === "string" ? body : JSON.stringify(body));
  }
  return root;
}

const item = (over) => ({
  practice: {
    onLevel: [
      {
        stem: "Find the sum of 4 and 5.",
        choices: ["9", "20", "1", "45"],
        correctIndex: 0,
        choiceFeedback: ["", "Check which operation the question asks for.", "", ""],
        hints: ["Add the two numbers."],
        ...over,
      },
    ],
  },
});

function run(root) {
  const r = spawnSync(
    process.execPath,
    [GATE, "--root", root, "--min-strings", "1", "--min-engine-files", "1"],
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

// ---- the dictionary --------------------------------------------------------

test("generic feedback is recognised, coaching is not", () => {
  for (const generic of [
    "Incorrect.",
    "Incorrect, try again.",
    "Not quite — try again.",
    "Not yet. Try again.",
    "Wrong!",
    "Oops, try again",
    "Incorrect. ✘",
    "Re-read the problem carefully and try again.",
    "Take another look and try again.",
  ]) {
    assert.ok(isGenericFeedback(generic), generic);
  }
  for (const coaching of [
    "Not quite. Check which amount comes first.",
    "Not yet — misses are data. Check one step and try again.",
    "Try adding the two parts first.",
    "You multiplied; the question asks you to divide.",
    "Check your operation. Re-read what the problem asks.",
  ]) {
    assert.ok(!isGenericFeedback(coaching), coaching);
  }
});

test("every coaching line is bilingual, says something, and is not itself generic", () => {
  for (const [kind, line] of Object.entries(MISS_COACH)) {
    for (const lang of ["en", "es"]) {
      assert.ok(line[lang], `${kind}.${lang}`);
      assert.ok(!isGenericFeedback(line[lang]), `${kind}.${lang} is generic: ${line[lang]}`);
      assert.ok(line[lang].split(/\s+/).length >= 7, `${kind}.${lang} is too short to coach`);
    }
    assert.notEqual(line.en, line.es, `${kind}: Spanish is not a copy of the English`);
  }
  assert.equal(
    missCoach("nonsense", "en"),
    MISS_COACH.choice.en,
    "an unknown kind falls back to the choice coaching",
  );
  assert.equal(missCoach("tool", "es"), MISS_COACH.tool.es);
});

test("the authored boilerplate the multiple-choice card detects is the dictionary's", () => {
  assert.ok(AUTHORED_BOILERPLATE.length >= 5);
  assert.ok(AUTHORED_BOILERPLATE.includes("Not quite — try again."));
});

test("enforced term variants map to their preferred term", () => {
  assert.equal(preferredFor("coordinate pair"), "ordered pair");
  assert.equal(preferredFor("lowest terms"), "simplest form");
  assert.equal(preferredFor("bar model"), null, "a tool's own name is reported, not enforced");
});

test("Flesch-Kincaid ranks short plain text below long technical text", () => {
  const plain = fleschKincaid("Add the two numbers. Then write the sum.");
  const hard = fleschKincaid(
    "Systematically determine whether the proportional relationship demonstrates multiplicative reasoning across representations.",
  );
  assert.ok(plain < 3, `plain=${plain}`);
  assert.ok(hard > 12, `hard=${hard}`);
});

// ---- the gate --------------------------------------------------------------

test("clean copy passes and reports reading level", () => {
  const { code, out } = run(fixture(item({})));
  assert.equal(code, 0, out);
  assert.match(out, /PASS validate-microcopy/);
  assert.match(out, /reading level:/);
});

test("generic feedback in a lesson fails and names the field", () => {
  const { code, out } = run(
    fixture(item({ choiceFeedback: ["", "Incorrect, try again.", "", ""] })),
  );
  assert.equal(code, 1, out);
  assert.match(out, /generic-feedback/);
  assert.match(out, /lessons\/9-9\/config\.json\.practice\.onLevel\[0\]\.choiceFeedback\[1\]/);
});

test("belittling, blaming and 'ESOL' copy fails", () => {
  for (const [text, rule] of [
    ["Obviously the answer is 9.", "banned-belittling"],
    ["You messed up the sign.", "banned-blaming"],
    ["This is an ESOL problem.", "banned-label-esol"],
  ]) {
    const { code, out } = run(fixture(item({ stem: text })));
    assert.equal(code, 1, out);
    assert.match(out, new RegExp(rule));
  }
});

test("two exclamation marks, an all-caps sentence and a variant term fail", () => {
  for (const [over, rule] of [
    [{ stem: "Great! Now find the sum!" }, "multiple-exclamations"],
    [{ stem: "READ THE WHOLE PROBLEM BEFORE YOU START TO SOLVE IT" }, "all-caps-paragraph"],
    [{ stem: "Plot the coordinate pair on the grid." }, "term-variant"],
  ]) {
    const { code, out } = run(fixture(item(over)));
    assert.equal(code, 1, out);
    assert.match(out, new RegExp(rule));
  }
});

test("a Title Case lesson heading fails; a sentence case one passes", () => {
  const bad = run(fixture({ learn: { heading: "What Is A Percent Of A Number" } }));
  assert.equal(bad.code, 1, bad.out);
  assert.match(bad.out, /heading-title-case/);
  const good = run(fixture({ learn: { heading: "What is a percent of a number?" } }));
  assert.equal(good.code, 0, good.out);
});

test("an engine string that only says 'not quite, try again' fails and points at the dictionary", () => {
  const { code, out } = run(
    fixture(item({}), { engine: 'el.textContent = "Not quite — try again.";\n' }),
  );
  assert.equal(code, 1, out);
  assert.match(out, /engine-generic-feedback/);
  assert.match(out, /widget\.js:1/);
  assert.match(out, /missCoach/);
});

test("a Title Case button label in the engine fails", () => {
  const { code, out } = run(
    fixture(item({}), { engine: 'checkBtn.textContent = "Check My Work";\n' }),
  );
  assert.equal(code, 1, out);
  assert.match(out, /engine-title-case-button/);
  const ok = run(fixture(item({}), { engine: 'checkBtn.textContent = "Check my work";\n' }));
  assert.equal(ok.code, 0, ok.out);
});

test("a belittling phrase in an engine string fails", () => {
  const { code, out } = run(
    fixture(item({}), { engine: 'note.textContent = "It is obviously the first one you try.";\n' }),
  );
  assert.equal(code, 1, out);
  assert.match(out, /engine-banned-belittling/);
});

test("an empty sweep fails: finding nothing verified nothing", () => {
  const root = mkdtempSync(join(tmpdir(), "microcopy-empty-"));
  made.push(root);
  mkdirSync(join(root, "data"), { recursive: true });
  writeFileSync(
    join(root, "data/curriculum-launch-manifest.json"),
    JSON.stringify({ lessons: [] }),
  );
  const r = spawnSync(process.execPath, [GATE, "--root", root], { encoding: "utf8" });
  assert.equal(r.status, 1, r.stdout + r.stderr);
  assert.match(r.stderr, /only 0 lesson strings/);
  assert.match(r.stderr, /only 0 engine files/);
});

test("a documented exception passes; a short reason, or one that no longer fires, fails", () => {
  const bad = item({ stem: "Obviously the answer is 9." });
  const entry = { file: CONFIG_FILE, path: ".practice.onLevel[0].stem", rule: "banned-belittling" };
  const reason =
    "The word is quoted from a student's wrong reasoning that the lesson asks the class to correct.";

  const ok = fixture(bad, {
    extra: { "data/microcopy-review.json": { reviewed: [{ ...entry, reason }] } },
  });
  assert.equal(run(ok).code, 0, run(ok).out);

  const short = fixture(bad, {
    extra: { "data/microcopy-review.json": { reviewed: [{ ...entry, reason: "fine" }] } },
  });
  const s = run(short);
  assert.equal(s.code, 1, s.out);
  assert.match(s.out, /40\+ characters/);

  const stale = fixture(item({}), {
    extra: { "data/microcopy-review.json": { reviewed: [{ ...entry, reason }] } },
  });
  const st = run(stale);
  assert.equal(st.code, 1, st.out);
  assert.match(st.out, /stale review entry/);
});

test("the real site passes: lesson data and engine strings are clean", () => {
  const r = spawnSync(process.execPath, [GATE], {
    encoding: "utf8",
    cwd: join(HERE, ".."),
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
  });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS validate-microcopy/);
});
