// Fluency Lab 4.0 problem types: every skill x level x supported type x many seeds.
// Each item is re-derived from item.meta by an independent exact evaluator (tools/lib/pt-*.mjs), then audited:
// the key and every listed equivalent are accepted, every wrong answer and distractor is refused, choices are
// unique, early steps never state the answer, a seed gives one item, models match what they claim to show,
// and every stem has Spanish. Run: node tools/fluency-problem-types.test.mjs
// Env: FL4_SEEDS (default 200), FL4_SKILLS=comma list of ids or grade:id, FL4_TYPES=comma list.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { availableParallelism } from "node:os";
import { GRAPHIC_KINDS } from "../math/fluency-lab/graphics/registry.js";
import { q as qOf, runChecks, sameQ } from "./lib/pt-checks.mjs";
import { representedBy } from "./lib/pt-models.mjs";

Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: () => null, setItem() {}, removeItem() {} },
});
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const lab = "../math/fluency-lab/";
const { ALL_SKILLS, seededRandom, validateAnswer } = await import(`${lab}problem-bank.js`);
const { generateVariant, variantsFor, TYPES, lastError } = await import(`${lab}problem-types-4.js`);
const { stepLeaks } = await import(`${lab}step-leak.js`);
const { checkEquivalent } = await import(`${lab}problem-types/equivalence.js`);

const SEEDS = Number(process.env.FL4_SEEDS || 200);
const only = process.env.FL4_SKILLS ? process.env.FL4_SKILLS.split(",") : null;
const onlyTypes = process.env.FL4_TYPES ? process.env.FL4_TYPES.split(",") : null;
const SHARD = process.env.FL4_SHARD ? process.env.FL4_SHARD.split("/").map(Number) : null;
const skills = ALL_SKILLS.filter(
  (s) => !only || only.includes(s.id) || only.includes(`${s.grade}:${s.id}`),
).filter((s, _i, all) => !SHARD || all.indexOf(s) % SHARD[1] === SHARD[0]);
const ENGLISH = /\b(the|and|of|is|what|find|how|many|which|with|for|does|have|round|volume)\b/i;
const digits = (t) => (String(t).replaceAll(",", "").match(/\d+/g) || []).sort().join(",");
const wordy = (t) => /[A-Za-z]{3,}/.test(String(t || "").replace(/\b[xy]\b/g, ""));
const BAD = /undefined|NaN|Infinity|\[object/;

// ---------- equivalence pins: what a typed response may look like ----------
function pins() {
  const num = (value, equiv = {}) => ({
    kind: "number",
    answers: [value],
    equiv: { form: "number", value, ...equiv },
  });
  const ok = (item, ...typed) =>
    typed.forEach((t) =>
      assert.ok(validateAnswer(t, item), `should accept "${t}" for ${item.equiv.value}`),
    );
  const no = (item, ...typed) =>
    typed.forEach((t) =>
      assert.ok(!validateAnswer(t, item), `should refuse "${t}" for ${item.equiv.value}`),
    );
  const half = num("1/2", { accept: ["int", "decimal", "fraction", "mixed"] });
  ok(half, "1/2", "2/4", "3/6", "0.5", ".5", "0.50", "x = 1/2", " 1 / 2 ");
  no(half, "1/3", "0.6", "1/2/3", "1/0", "abc", "", "1 1/2", "-1/2");
  const lowest = num("1/2", { simplest: true, accept: ["int", "decimal", "fraction", "mixed"] });
  ok(lowest, "1/2", "0.5");
  no(lowest, "2/4", "3/6");
  assert.equal(
    checkEquivalent("2/4", lowest).reason,
    "not-simplified",
    "feedback names the problem",
  );
  const improper = num("5/4", { simplest: true, accept: ["int", "decimal", "fraction", "mixed"] });
  ok(improper, "5/4", "1 1/4", "1.25", "x = 1 1/4");
  no(improper, "10/8", "1 2/8", "1 5/4", "1 1/2");
  assert.equal(checkEquivalent("1 5/4", improper).reason, "mixed-improper");
  const dec = num("1/2", { accept: ["int", "decimal"] });
  ok(dec, "0.5", ".5", "0.50", "00.5", "0.500");
  no(dec, "1/2", "0.05", "5", "0.5.5");
  const whole = num("1650", { accept: ["int", "decimal"], units: ["cm", "centimeters"] });
  ok(
    whole,
    "1650",
    "1,650",
    "1650.0",
    "1650.00",
    "x = 1650",
    "1650 cm",
    "1650 centimeters",
    "01650",
  );
  no(whole, "1,6500", "1,65", "165", "1650 kg", "16500");
  ok(num("-3", { accept: ["int", "decimal"] }), "-3", "−3", "x = -3", "-3.0");
  no(num("-3", { accept: ["int", "decimal"] }), "3", "- 3x");
  ok(num("-1/2"), "-1/2", "-0.5", "−2/4");
  const pct = num("25", { form: "percent", accept: ["int", "decimal"] });
  ok(pct, "25", "25%", "25 %", "25.0%", "x = 25");
  no(pct, "0.25", "250%", "2.5%");
  const ratio = { kind: "text", answers: ["3:4"], equiv: { form: "ratio", pair: ["3", "4"] } };
  ok(ratio, "3:4", "3 to 4", "3 : 4", "6:8", "3 TO 4");
  no(ratio, "4:3", "3/4", "3:5", "3:0", "3");
  const lowestRatio = { ...ratio, equiv: { ...ratio.equiv, simplest: true } };
  ok(lowestRatio, "3:4");
  no(lowestRatio, "6:8");
  assert.equal(checkEquivalent("6:8", lowestRatio).reason, "not-simplified");
  const point = { kind: "text", answers: ["(8,7)"], equiv: { form: "point", pair: ["8", "7"] } };
  ok(point, "(8,7)", "(8, 7)", "8,7", "( 8 , 7 )");
  no(point, "(7,8)", "(8,-7)", "(8,7", "8 7");
  const clock = { kind: "text", answers: ["2:00"], equiv: { form: "clock", minutes: 120 } };
  ok(clock, "2:00", "2:00 pm", "14:00", "02:00");
  no(clock, "2:30", "12:00", "2:60", "2");
  // legacy items keep working, and gain the usual typed extras
  const legacy = { kind: "number", answers: ["5"], unit: "cm" };
  assert.ok(
    validateAnswer("5", legacy) &&
      validateAnswer("x = 5", legacy) &&
      validateAnswer("5 cm", legacy) &&
      validateAnswer("5.0", legacy),
  );
  assert.ok(
    !validateAnswer("5 kg", legacy) && !validateAnswer("6", legacy) && !validateAnswer("", legacy),
  );
  assert.ok(
    validateAnswer("2/4", { kind: "fraction", answers: ["1/2"] }) &&
      !validateAnswer("1/2/3", { kind: "fraction", answers: ["1/2"] }),
  );
  assert.ok(
    validateAnswer("1 5/12", { kind: "fraction", answers: ["17/12"] }) &&
      !validateAnswer("1 1/4", { kind: "fraction", answers: ["11/4"] }),
  );
  assert.ok(
    validateAnswer("2 − 3 = □", { kind: "choice", answers: ["2 − 3 = □"] }),
    "a minus sign in a choice key matches itself",
  );
  assert.ok(
    validateAnswer("<", { kind: "choice", answers: ["<"] }) &&
      !validateAnswer(">", { kind: "choice", answers: ["<"] }),
  );
}
pins();

const failures = new Map();
const fail = (tag, error) => {
  const key = `${tag.type}|${String(error.message).replace(/\d+/g, "#").slice(0, 90)}`;
  if (!failures.has(key))
    failures.set(key, {
      count: 0,
      first: `${tag.skill} L${tag.level} ${tag.type} seed ${tag.seed}: ${error.message}`,
    });
  failures.get(key).count += 1;
};

function rationalKey(item) {
  const form = item.meta.form;
  if (!["int", "decimal", "fraction", "mixed", "percent"].includes(form)) return;
  const text = item.answers[0];
  const m = text.match(/^(-?)(\d+) (\d+)\/(\d+)$/);
  const got = m ? qOf(`${m[1]}${Number(m[2]) * Number(m[4]) + Number(m[3])}/${m[4]}`) : qOf(text);
  assert.ok(
    sameQ(got, qOf(item.meta.answer)),
    `answer text ${text} is not meta.answer ${item.meta.answer}`,
  );
}

function audit(item, tag, rng2) {
  assert.ok(item && typeof item.question === "string" && item.question.length > 3, "question text");
  assert.equal(item.level, tag.level, "level field");
  assert.equal(item.type, tag.type, "type field");
  assert.ok(["number", "fraction", "text", "choice"].includes(item.kind), `kind ${item.kind}`);
  assert.ok(
    Array.isArray(item.steps) &&
      item.steps.length >= 2 &&
      item.steps.every((s) => typeof s === "string" && s),
    "steps",
  );
  assert.ok(
    typeof item.hint === "string" &&
      item.hint &&
      typeof item.explanation === "string" &&
      item.explanation,
    "hint and explanation",
  );
  const all = [
    item.question,
    item.questionEs,
    ...item.steps,
    item.hint,
    item.explanation,
    ...(item.choices || []),
    ...(item.choicesEs || []),
  ]
    .filter(Boolean)
    .join(" | ");
  assert.ok(!BAD.test(all), `a text field holds a bad token: ${all.match(BAD)?.[0]}`);
  assert.ok(!/^[-−]0(\.0+)?$/.test(item.answers[0]), "negative zero");
  const meta = item.meta;
  assert.ok(
    meta && meta.skill === tag.skill && meta.level === tag.level && meta.type === tag.type,
    "meta identity",
  );
  assert.ok(typeof meta.form === "string" && meta.check, "meta.form and meta.check");

  // Spanish
  if (wordy(item.question)) {
    assert.ok(item.questionEs, `no Spanish for: ${item.question}`);
    assert.equal(
      digits(item.questionEs),
      digits(item.question),
      `numbers changed in Spanish: ${item.questionEs}`,
    );
    assert.ok(!ENGLISH.test(item.questionEs), `English left in: ${item.questionEs}`);
    assert.ok(!/[,.;:]{2}|\s[,.;:?]/.test(item.questionEs), `punctuation slip: ${item.questionEs}`);
    assert.ok(
      !/\b1 (horas|minutos|pies|yardas|metros|gramos)\b/.test(item.questionEs),
      `singular needed: ${item.questionEs}`,
    );
  }
  if (item.choices) {
    const needEs = item.choices.some(wordy);
    if (needEs) {
      assert.ok(
        Array.isArray(item.choicesEs) && item.choicesEs.length === item.choices.length,
        "choicesEs matches choices",
      );
      item.choices.forEach((c, i) => {
        assert.equal(
          digits(item.choicesEs[i]),
          digits(c),
          `numbers changed in Spanish choice: ${item.choicesEs[i]}`,
        );
        assert.ok(!ENGLISH.test(item.choicesEs[i]), `English left in choice: ${item.choicesEs[i]}`);
      });
    }
  }

  // the answer, recomputed
  runChecks(item);
  rationalKey(item);

  // equivalence and refusal
  assert.ok(validateAnswer(item.answers[0], item), "the key is accepted");
  assert.ok(!validateAnswer("definitely not an answer", item), "nonsense is refused");
  if (item.kind === "choice") {
    assert.ok(Array.isArray(item.choices) && item.choices.length >= 3, "three or more choices");
    const lower = item.choices.map((c) => String(c).toLowerCase());
    assert.equal(new Set(lower).size, lower.length, "choices are unique");
    assert.equal(
      item.choices.filter((c) => c === item.answers[0]).length,
      1,
      "the key appears once",
    );
    const distractors = meta.distractors || [];
    assert.equal(distractors.length, item.choices.length - 1, "every distractor is documented");
    assert.deepEqual(
      [...distractors.map((d) => d.text)].sort(),
      item.choices.filter((c) => c !== item.answers[0]).sort(),
      "documented distractors are the choices",
    );
    for (const d of distractors) {
      assert.ok(d.why && d.why.length > 3, "distractor names its misconception");
      assert.ok(!validateAnswer(d.text, item), `distractor "${d.text}" is accepted`);
      try {
        assert.ok(!sameQ(qOf(d.text), qOf(item.answers[0])), `distractor ${d.text} equals the key`);
      } catch (e) {
        if (/equals the key/.test(e.message)) throw e;
      }
    }
  } else {
    assert.ok(item.equiv, "typed items carry an equivalence descriptor");
    for (const ok of meta.equivalents || [])
      assert.ok(validateAnswer(ok, item), `equivalent "${ok}" is refused`);
    for (const no of meta.refused || [])
      assert.ok(!validateAnswer(no, item), `non-simplest "${no}" is accepted`);
    assert.ok((meta.wrong || []).length >= 1, "wrong answers are listed");
    for (const w of meta.wrong) {
      assert.ok(
        w.why && w.text !== item.answers[0],
        "a wrong answer names its slip and differs from the key",
      );
      assert.ok(!validateAnswer(w.text, item), `wrong answer "${w.text}" (${w.why}) is accepted`);
    }
  }

  // steps never give the answer away early
  for (let i = 0; i < item.steps.length - 1; i += 1)
    assert.ok(!stepLeaks(item.steps[i], item), `step ${i + 1} states the answer: ${item.steps[i]}`);

  // model
  if (item.model) {
    assert.ok(GRAPHIC_KINDS.includes(item.model.graphic), `unknown graphic ${item.model.graphic}`);
    assert.equal(
      representedBy(item.model),
      meta.shows,
      `the picture shows something other than meta.shows (${meta.shows})`,
    );
    if (meta.points) {
      // a lettered-points question: the key letter sits where the maths puts it, on the picture itself
      for (const p of meta.points) {
        const drawn = item.model.config.points.find((m) => m.label === p.label);
        assert.ok(
          drawn && sameQ(qOf(`${drawn.value.n}/${drawn.value.d}`), qOf(String(p.value))),
          `point ${p.label} is drawn where meta says`,
        );
      }
      assert.equal(
        String(meta.points.find((p) => p.label === item.answers[0]).value),
        meta.shows,
        "the key letter marks the shown value",
      );
    }
  }
  // determinism
  assert.deepEqual(
    generateVariant(tag.skillObject, rng2(), { level: tag.level, type: tag.type }),
    item,
    "same seed, same item",
  );
}

// The documented coverage table is the rendered registry (run with --write-coverage to refresh it).
async function coverageCheck() {
  const { renderCoverage } = await import(`${lab}problem-types/coverage.js`);
  const { readFileSync, writeFileSync } = await import("node:fs");
  const file = new URL(`${lab}problem-types/README.md`, import.meta.url);
  const rendered = `# Fluency Lab 4.0 problem types: coverage\n\nGenerated by \`node tools/fluency-problem-types.test.mjs --write-coverage\`. Do not edit by hand.\n\n${renderCoverage()}`;
  if (process.argv.includes("--write-coverage")) writeFileSync(file, rendered);
  else
    try {
      assert.equal(
        readFileSync(file, "utf8"),
        rendered,
        "problem-types/README.md is out of date: run with --write-coverage",
      );
    } catch (error) {
      fail({ skill: "coverage", level: 0, type: "readme", seed: 0 }, error);
    }
}

// Many skills: run the sweep in parallel shards of this same file (each prints its own summary).
if (!SHARD && !process.env.FL4_INLINE && skills.length >= 12) {
  await coverageCheck();
  if (failures.size) {
    for (const { first } of failures.values()) console.error(`  ${first}`);
    process.exit(1);
  }
  const n = Math.max(2, Math.min(8, availableParallelism() - 1));
  const runs = Array.from(
    { length: n },
    (_, i) =>
      new Promise((resolve) => {
        const child = spawn(process.execPath, [new URL(import.meta.url).pathname], {
          env: { ...process.env, FL4_SHARD: `${i}/${n}` },
        });
        let out = "";
        child.stdout.on("data", (d) => (out += d));
        child.stderr.on("data", (d) => (out += d));
        child.on("close", (code) => resolve({ code, out }));
      }),
  );
  const results = await Promise.all(runs);
  let bad = 0;
  for (const r of results) {
    if (r.code !== 0) bad += 1;
    process.stdout.write(r.out.replace(/^fluency-problem-types: ok\n/m, ""));
  }
  if (bad) {
    console.error(`fluency-problem-types: ${bad} of ${n} shards failed`);
    process.exit(1);
  }
  console.log(`fluency-problem-types: ok (${skills.length} skills, ${n} shards, ${SEEDS} seeds)`);
  process.exit(0);
}

let items = 0;
const started = Date.now();
const questionsBy = new Map();
const coverage = [];
for (const skill of skills) {
  const key = `${skill.grade}:${skill.id}`;
  const types = variantsFor(skill).filter((t) => !onlyTypes || onlyTypes.includes(t));
  const all = variantsFor(skill);
  try {
    assert.ok(
      all.includes("compute") && all.includes("error-analysis"),
      "compute and error-analysis for every skill",
    );
    assert.ok(all.length >= 4, `at least four types per skill, found ${all.join(",")}`);
    assert.ok(
      all.every((t) => TYPES.includes(t)),
      "known type ids",
    );
    const covered = new Set();
    for (const t of all)
      for (let l = 1; l <= 5; l += 1) if (variantsFor(skill, l).includes(t)) covered.add(l);
    assert.equal(covered.size, 5, "the types together cover all five levels");
    for (let l = 1; l <= 5; l += 1)
      assert.ok(variantsFor(skill, l).includes("compute"), `compute supports level ${l}`);
  } catch (error) {
    fail({ skill: key, level: 0, type: "coverage", seed: 0 }, error);
  }
  coverage.push([key, all]);
  for (const type of types) {
    for (let level = 1; level <= 5; level += 1) {
      if (!variantsFor(skill, level).includes(type)) continue;
      const seen = new Set();
      for (let seed = 1; seed <= SEEDS; seed += 1) {
        const mk = () => seededRandom(seed * 7919 + level * 131 + type.length);
        const tag = { skill: key, level, type, seed, skillObject: skill };
        let item = null;
        try {
          item = generateVariant(skill, mk(), { level, type });
          assert.ok(item, `no item (${lastError.message})`);
          items += 1;
          seen.add(item.question);
          audit(item, tag, mk);
        } catch (error) {
          fail(tag, error);
        }
      }
      try {
        assert.ok(
          seen.size >= Math.min(6, SEEDS / 4),
          `only ${seen.size} different questions in ${SEEDS} seeds`,
        );
        // no repeat inside a run when the caller passes what it has shown
        const run = [];
        const rng = seededRandom(99 + level);
        for (let i = 0; i < 6; i += 1) {
          const next = generateVariant(skill, rng, { level, type, avoid: run });
          if (!next) break;
          assert.ok(!run.includes(next.question), "a repeated question inside a run");
          run.push(next.question);
        }
        assert.ok(
          run.length >= Math.min(4, seen.size - 1),
          `a run of ${run.length} different questions`,
        );
      } catch (error) {
        fail({ skill: key, level, type, seed: 0 }, error);
      }
      questionsBy.set(`${key}|${type}|${level}`, seen.size);
    }
  }
}
// the selection API: no type named -> some supported type; unknown skill -> null
const sample = skills.find((s) => variantsFor(s).length) || skills[0];
assert.ok(generateVariant(sample, seededRandom(1), { level: 3 }), "default type works");
assert.equal(generateVariant("99:nope", seededRandom(1), { level: 3 }), null);
assert.equal(variantsFor("99:nope").length, 0);

if (!SHARD && !only) await coverageCheck();

const seconds = ((Date.now() - started) / 1000).toFixed(1);
console.log(`${items} items over ${skills.length} skills in ${seconds}s`);
if (failures.size) {
  for (const { count, first } of failures.values()) console.error(`  x${count} ${first}`);
  console.error(`${failures.size} kinds of failure`);
  process.exit(1);
}
console.log("fluency-problem-types: ok");
