// Tests for content verifiers 1-3 (arithmetic, readability, vocab-tier), the driver and its ratchet.
// Run: node --test tools/content/verifiers-a.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { REGISTRY } from "./registry.mjs";
import * as arithmetic from "./verifiers/arithmetic.mjs";
import { checkText } from "./verifiers/lib/mathclaims.mjs";
import * as Q from "./verifiers/lib/rational.mjs";
import { gradeOf, syllables } from "./verifiers/lib/readability.mjs";
import { loadTarget } from "./verifiers/lib/targets.mjs";
import * as readability from "./verifiers/readability.mjs";
import * as vocab from "./verifiers/vocab-tier.mjs";
import { candidateTier, profile } from "./verifiers/vocab-tier.mjs";
import { runControls } from "./verify.mjs";

const CLI = new URL("./verify.mjs", import.meta.url).pathname;
const BASELINES = new URL("./baselines", import.meta.url).pathname;
const cli = (args, env = {}) =>
  spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
const codes = (findings) =>
  new Set(findings.filter((f) => f.severity !== "info").map((f) => f.code));

test("rational arithmetic is exact (no float drift)", () => {
  const tenth = Q.fromDecimal("0.1");
  assert.ok(Q.eq(Q.add(tenth, Q.fromDecimal("0.2")), Q.fromDecimal("0.3")));
  assert.ok(Q.eq(Q.mul(Q.make(1n, 3n), Q.make(3n)), Q.make(1n)));
  assert.equal(Q.toString(Q.div(Q.make(85n), Q.make(9n))), "85/9");
  assert.equal(Q.decimalPlaces(Q.fromDecimal("0.125")), 3);
  assert.throws(() => Q.make(1n, 0n), RangeError);
});

test("every verifier in the registry that this worker owns passes its own negative controls", async () => {
  for (const name of ["arithmetic", "readability", "vocab-tier"]) {
    const problems = await runControls(name, await REGISTRY[name]());
    assert.deepEqual(problems, [], problems.join("\n"));
  }
});

test("arithmetic: units are compared as shapes, in^2 is not in^3", () => {
  const bad = checkText("A box is 3 in by 4 in by 5 in, so 3 in × 4 in × 5 in = 60 in^2.");
  assert.ok(bad.some((r) => r.code === "ARITH_UNIT_MISMATCH"));
  const good = checkText("Since 3 in × 4 in × 5 in = 60 in^3 the box holds a lot.");
  assert.ok(good.every((r) => r.status !== "bad"));
  assert.ok(
    checkText("It is 6 cm × 6 cm = 36 cm here.").some((r) => r.code === "ARITH_UNIT_MISMATCH"),
  );
  assert.ok(
    checkText("On the map 1 cm = 4 meters in real life.").every((r) => r.status !== "bad"),
    "scale statements are not decidable",
  );
});

test("arithmetic: only fully decidable claims are flagged", () => {
  const skipOk = (text) =>
    assert.ok(
      checkText(text).every((r) => r.status !== "bad"),
      text,
    );
  skipOk("Solve 2x + 3 = 11.");
  skipOk("A friend says 5 + 3 = 9.");
  skipOk("Since 1 ÷ 3 = 0.33 the answer is close.");
  skipOk("It is not true that 4 + 4 = 9.");
  skipOk("The quotient of 85 ÷ 9 is 9.");
  assert.ok(checkText("Add 20 + 15 = 36 first.").some((r) => r.status === "bad"));
  assert.ok(checkText("Note 1/2 + 1/3 = 2/5 here.").some((r) => r.code === "ARITH_VALUE_MISMATCH"));
  assert.ok(checkText("Here 85 ÷ 9 is 9 with a remainder of 4.").every((r) => r.status !== "bad"));
  assert.ok(checkText("Here 85 ÷ 9 is 9 with a remainder of 5.").some((r) => r.status === "bad"));
});

test("arithmetic: dimension words (area/volume/perimeter) need the right unit exponent", () => {
  const run = (text) =>
    arithmetic.verify({
      id: "g6-math-x",
      grade: "6",
      subject: "Math",
      studio: { activities: [{ mission: text }] },
      lessons: [],
    });
  assert.ok(codes(run("The area of the rug is 24 cubic feet.")).has("ARITH_UNIT_MISMATCH"));
  assert.ok(codes(run("The perimeter is 20 square feet.")).has("ARITH_UNIT_MISMATCH"));
  assert.equal(codes(run("The area of the rug is 24 square feet.")).size, 0);
  assert.equal(
    codes(
      run("A unit cube is a cube used to measure volume, like a cube that is 1 inch on each side."),
    ).size,
    0,
  );
});

test("arithmetic: not applicable outside math and science", () => {
  const f = arithmetic.verify({
    id: "g3-ela-u1",
    grade: "3",
    subject: "ELA",
    studio: { activities: [{ mission: "Add 2 + 2 = 5." }] },
    lessons: [],
  });
  assert.deepEqual(codes(f), new Set());
});

test("arithmetic: planted errors in real unit content are caught (recall check)", async () => {
  let planted = 0;
  for (const id of ["g1-math-u1", "g2-math-u2", "g3-math-u2", "g5-math-u3", "g6-math-u5"]) {
    const target = await loadTarget(id);
    assert.equal(codes(arithmetic.verify(target)).size, 0, `${id} should be clean before planting`);
    const clone = structuredClone(target);
    const hit = (obj) => {
      for (const [k, v] of Object.entries(obj)) {
        if (
          typeof v === "string" &&
          /\d\s*[+×÷-]\s*\d+\s*=\s*\d+(?![\d/.,])/.test(v) &&
          !/\b(says?|not|estimat\w*|round\w*|about)\b/i.test(v)
        ) {
          obj[k] = v.replace(/(=\s*)(\d+)(?![\d/.,])/, (_, eq, n) => `${eq}${Number(n) + 1}`);
          return true;
        }
        if (v && typeof v === "object" && !["wrong", "nonexample", "options"].includes(k) && hit(v))
          return true;
      }
      return false;
    };
    if (hit(clone.studio)) {
      planted += 1;
      assert.ok(
        codes(arithmetic.verify(clone)).size > 0,
        `${id}: planted equation error was not flagged`,
      );
    }
  }
  assert.ok(planted >= 3, "the recall check must actually plant errors");
});

test("readability: syllable heuristic and Flesch-Kincaid sanity", () => {
  assert.equal(syllables("cat"), 1);
  assert.equal(syllables("water"), 2);
  assert.equal(syllables("table"), 2);
  assert.ok(syllables("photosynthesis") >= 4);
  const easy = gradeOf(["The cat sat on the mat today.", "The dog ran to the cat and sat."]);
  const hard = gradeOf([
    "Photosynthesis transforms atmospheric carbon dioxide into carbohydrates efficiently.",
  ]);
  assert.ok(easy < 3 && hard > 12, `easy=${easy} hard=${hard}`);
  assert.equal(gradeOf(["too short"]), null, "strings under 4 words are labels, not prose");
});

test("readability: ceilings file is marked proposed and covers every grade", () => {
  const c = readability.CEILINGS;
  assert.match(c.status, /proposed, pending Joel approval/);
  for (const g of ["K", "1", "2", "3", "4", "5", "6", "7", "8"])
    assert.ok(typeof c.unitCeilingByGrade[g] === "number", g);
  const f = readability.verify({
    id: "g99-x",
    grade: "99",
    subject: "ELA",
    studio: {},
    lessons: [],
  });
  assert.equal(f[0].code, "READ_NO_CEILING");
});

test("vocab-tier: candidates only, never mutates content", async () => {
  const target = await loadTarget("g6-math-u2");
  const before = JSON.stringify(target);
  const findings = vocab.verify(target);
  assert.equal(JSON.stringify(target), before, "verify() must not change a tier");
  assert.ok(findings.some((f) => f.code === "VOCAB_TIER_CANDIDATE"));
  assert.ok(profile("quotient").subjects <= 1, "quotient is math-only in this corpus");
  assert.equal(candidateTier(profile("see"), 0), 1);
  assert.equal(
    candidateTier(profile("number line"), 0),
    null,
    "a phrase of everyday words is not scored",
  );
});

test("vocab-tier: word frequency table is repo-local and well formed", () => {
  const f = vocab.FREQUENCY;
  assert.equal(f.units, 162);
  assert.deepEqual(f.subjects, ["ela", "math", "science", "social-studies"]);
  assert.match(f.limits, /candidate tiers are for human review/i);
  const sample = Object.entries(f.words).slice(0, 200);
  assert.ok(
    sample.every(
      ([w, [df, subj]]) => /^[a-zà-ÿ'’-]+$/.test(w) && df >= 2 && subj >= 1 && subj <= 4,
    ),
  );
});

test("word-frequency builder is deterministic and offline", () => {
  const run = () =>
    spawnSync(
      process.execPath,
      [new URL("./build-word-frequency.mjs", import.meta.url).pathname, "--stdout"],
      { encoding: "utf8" },
    );
  const a = run();
  const b = run();
  assert.equal(a.status, 0, a.stderr);
  assert.equal(a.stdout, b.stdout);
  assert.equal(JSON.parse(a.stdout).units, 162);
});

test("CLI: passes against the committed baselines (exit 0)", () => {
  const r = cli([]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  for (const n of ["arithmetic", "readability", "vocab-tier"])
    assert.match(r.stdout, new RegExp(`${n}: PASS`));
});

test("CLI: --json reports findings with unit ids", () => {
  const r = cli(["--verifier=readability", "--unit=gk-ss-u3", "--json"]);
  assert.equal(r.status, 0, r.stderr);
  const rep = JSON.parse(r.stdout).readability;
  assert.ok(rep.findings.every((f) => f.unit === "gk-ss-u3"));
  assert.ok(rep.findings.some((f) => f.code === "READ_UNIT_OVER_CEILING"));
});

test("CLI: bad arguments and unknown names are exit 3", () => {
  assert.equal(cli(["--verifier=nope"]).status, 3);
  assert.equal(cli(["--unit=g99-nope-u1"]).status, 3);
  assert.equal(cli(["--wat"]).status, 3);
});

test("CLI: a detector that stops firing trips the negative control (exit 3)", () => {
  for (const code of [
    "ARITH_UNIT_MISMATCH",
    "ARITH_KEY_MISMATCH",
    "READ_BAND_DECREASING",
    "VOCAB_TIER_INCONSISTENT",
  ]) {
    const r = cli([], { CONTENT_VERIFY_FAULT_DROP: code });
    assert.equal(r.status, 3, `${code}: ${r.stdout}${r.stderr}`);
    assert.match(r.stderr, /negative control/);
  }
});

function scratchBaselines() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "content-baselines-"));
  for (const f of fs.readdirSync(BASELINES))
    fs.copyFileSync(path.join(BASELINES, f), path.join(dir, f));
  return dir;
}

test("CLI ratchet: a new finding versus the baseline is exit 1, a missing baseline is exit 3", () => {
  const dir = scratchBaselines();
  try {
    const file = path.join(dir, "vocab-tier.json");
    const base = JSON.parse(fs.readFileSync(file, "utf8"));
    const unit = Object.keys(base.units)[0];
    delete base.units[unit];
    fs.writeFileSync(file, JSON.stringify(base));
    const r = cli(["--verifier=vocab-tier"], { CONTENT_VERIFY_BASELINE_DIR: dir });
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, new RegExp(`NEW ${unit} VOCAB_TIER_DISAGREE`));
    fs.rmSync(file);
    assert.equal(cli(["--verifier=vocab-tier"], { CONTENT_VERIFY_BASELINE_DIR: dir }).status, 3);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI ratchet: counts below the baseline pass, and the coverage floor catches a detector that sees nothing", () => {
  const dir = scratchBaselines();
  try {
    const file = path.join(dir, "arithmetic.json");
    const base = JSON.parse(fs.readFileSync(file, "utf8"));
    base.units = { "g6-math-u2": { ARITH_VALUE_MISMATCH: 3 } };
    fs.writeFileSync(file, JSON.stringify(base));
    const ok = cli(["--verifier=arithmetic"], { CONTENT_VERIFY_BASELINE_DIR: dir });
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /below baseline/);
    base.floors.ARITH_CHECKED = 10 ** 9;
    fs.writeFileSync(file, JSON.stringify(base));
    const low = cli(["--verifier=arithmetic"], { CONTENT_VERIFY_BASELINE_DIR: dir });
    assert.equal(low.status, 1, low.stdout);
    assert.match(low.stdout, /COVERAGE ARITH_CHECKED/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: --update-baseline writes a missing baseline and refuses to raise an existing one", () => {
  const dir = scratchBaselines();
  try {
    fs.rmSync(path.join(dir, "readability.json"));
    const made = cli(["--verifier=readability", "--update-baseline"], {
      CONTENT_VERIFY_BASELINE_DIR: dir,
    });
    assert.equal(made.status, 0, made.stdout + made.stderr);
    assert.ok(fs.existsSync(path.join(dir, "readability.json")));
    const file = path.join(dir, "readability.json");
    const base = JSON.parse(fs.readFileSync(file, "utf8"));
    const unit = Object.keys(base.units)[0];
    base.units[unit] = {};
    fs.writeFileSync(file, JSON.stringify(base));
    const refused = cli(["--verifier=readability", "--update-baseline"], {
      CONTENT_VERIFY_BASELINE_DIR: dir,
    });
    assert.equal(refused.status, 1, refused.stdout + refused.stderr);
    assert.match(refused.stderr, /refusing to raise/);
    assert.deepEqual(
      JSON.parse(fs.readFileSync(file, "utf8")).units[unit],
      {},
      "baseline must be unchanged",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
