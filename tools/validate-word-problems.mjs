// Gate for data/word-problems/unit-<n>.json: every curriculum practice lesson (the 67 generated studios
// plus the five hand-built Unit 4 studios) has 2–3 authored, bilingual, interactive word problems.
//   node tools/validate-word-problems.mjs [--units 2,9]
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildRegistry } from "../scripts/lib/math-studio-registry.mjs";
import { evalCalc, parseAnswer, validateWordProblems } from "../scripts/lib/word-problems-data.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const DIR = join(REPO_ROOT, "data/word-problems");

/** Every lesson id -> its problem set, read from the per-unit files. */
export function loadWordProblems() {
  const byLesson = /** @type {Record<string, any>} */ ({});
  for (const f of readdirSync(DIR)
    .filter((n) => /^unit-\d+\.json$/.test(n))
    .sort()) {
    const data = JSON.parse(readFileSync(join(DIR, f), "utf8"));
    for (const [id, set] of Object.entries(data)) {
      if (byLesson[id]) throw new Error(`${id} appears in more than one word-problem file`);
      if (`unit-${id.split("-")[0]}.json` !== f) throw new Error(`${id} is filed in ${f}`);
      byLesson[id] = set;
    }
  }
  return byLesson;
}

function selfTest() {
  const ok = (/** @type {boolean} */ c, /** @type {string} */ m) => {
    if (!c) throw new Error(`self-test: ${m}`);
  };
  ok(
    parseAnswer("$1,200") === 1200 && parseAnswer("1 1/2") === 1.5 && parseAnswer("−3") === -3,
    "parse",
  );
  ok(Number.isNaN(parseAnswer("about 4")), "parse rejects words");
  ok(evalCalc("15 × 6 + 40") === 130 && Number.isNaN(evalCalc("alert(1)")), "calc");
  const good = {
    title: "Pencil pouches",
    titleEs: "Bolsas de lápices",
    kind: "num",
    q: "Each pouch holds 4 pencils and there are 6 extra pencils. How many pencils are in 3 pouches plus the extras?",
    qEs: "Cada bolsa tiene 4 lápices y hay 6 lápices extra. ¿Cuántos lápices hay en 3 bolsas más los extra?",
    a: "18",
    calc: "4 * 3 + 6",
    fw: [
      {
        v: "12",
        f: "12 counts only the pouches. Add the extras.",
        fEs: "12 cuenta solo las bolsas. Suma los extra.",
      },
      {
        v: "30",
        f: "30 adds before multiplying. Multiply first.",
        fEs: "30 suma antes de multiplicar. Multiplica primero.",
      },
    ],
    h: [
      "Which number repeats for each pouch?",
      "Multiply that by the pouches.",
      "Then add the extra pencils once.",
    ],
    hEs: [
      "¿Qué número se repite en cada bolsa?",
      "Multiplícalo por las bolsas.",
      "Luego suma una vez los lápices extra.",
    ],
    x: "4 × 3 = 12 pencils in the pouches, plus 6 extra makes 18 pencils.",
    xEs: "4 × 3 = 12 lápices en las bolsas, más 6 extra son 18 lápices.",
  };
  const v = (/** @type {any} */ p, /** @type {number} */ n) => ({ ...p, q: `${p.q} (${n})` });
  const build = {
    ...good,
    kind: "build",
    q: "Build the expression for the pencils in n pouches of 4 pencils plus 6 extra pencils.",
    tiles: ["4n", "6n", "+", "6", "4"],
    a: [
      ["4n", "+", "6"],
      ["6", "+", "4n"],
    ],
    fw: [
      {
        v: "6n + 4",
        f: "This puts the extras in every pouch.",
        fEs: "Esto pone los extra en cada bolsa.",
      },
    ],
  };
  const table = {
    ...good,
    kind: "table",
    q: "Fill in the pencils for each number of pouches when each pouch holds 4 pencils.",
    hd: ["Pouches", "Pencils"],
    hdEs: ["Bolsas", "Lápices"],
    rows: [
      ["1", "4"],
      ["2", { a: "8", calc: "4 * 2" }],
      ["3", { a: "12", calc: "4 * 3" }],
    ],
  };
  delete build.calc;
  delete table.calc;
  delete table.fw;
  const set = () => ({
    problems: [v(good, 1), v(good, 2), v(good, 3), v(good, 4), v(good, 5), build, table],
    scenario: {
      title: "Art room",
      titleEs: "Salón de arte",
      setup: "The art room packs pencil pouches of 4 pencils each and keeps 6 extra pencils.",
      setupEs: "El salón de arte llena bolsas de 4 lápices y guarda 6 lápices extra.",
      parts: [v(good, 6), v(good, 7), v(good, 8)],
    },
    steps: [v(good, 9), v(good, 10), v(good, 11)],
  });
  const issues = (/** @type {any} */ x) => validateWordProblems({ x }, ["x"]);
  ok(issues(set()).length === 0, `clean set passes ${issues(set()).join("; ")}`);
  const bad = (/** @type {(s: any) => void} */ f, /** @type {string} */ m) => {
    const s = set();
    f(s);
    ok(issues(s).length > 0, m);
  };
  bad((s) => (s.problems[0].calc = "4 * 3"), "wrong calc fails");
  bad((s) => s.problems.pop(), "six problems fail");
  bad((s) => (s.problems[5] = v(good, 12)), "no build task fails");
  bad((s) => (s.problems[5].a = [["4n", "+", "7"]]), "a build answer not made of the tiles fails");
  bad((s) => (s.problems[5].tiles = ["4n", "+", "6"]), "a build with no spare tile fails");
  bad((s) => (s.problems[6].rows[1][1].calc = "4 * 3"), "a wrong table cell fails");
  bad((s) => s.scenario.parts.pop(), "a two-part scenario fails");
  bad((s) => s.steps.pop(), "two in-step checks fail");
  bad((s) => (s.steps[0] = s.problems[0]), "a repeated question fails");
  bad((s) => (s.problems[0].q += " Use the table shown below."), "picture words fail");
  ok(validateWordProblems({}, ["x"]).length > 0, "missing lesson fails");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  selfTest();
  const arg = process.argv.indexOf("--units");
  const units = arg > 0 ? new Set(process.argv[arg + 1].split(",")) : null;
  const ids = buildRegistry()
    .lessons.map((/** @type {any} */ l) => l.id)
    .filter((/** @type {string} */ id) => !units || units.has(id.split("-")[0]));
  const all = loadWordProblems();
  const byLesson = Object.fromEntries(
    Object.entries(all).filter(([id]) => !units || units.has(id.split("-")[0])),
  );
  const problems = validateWordProblems(byLesson, ids);
  if (ids.length < (units ? 1 : 72)) problems.push(`only ${ids.length} lessons found`);
  if (problems.length) {
    console.error(problems.map((p) => `  ✗ ${p}`).join("\n"));
    console.error(`validate:word-problems FAIL (${problems.length})`);
    process.exit(1);
  }
  const n = Object.values(byLesson).reduce((a, s) => a + s.problems.length, 0);
  console.log(`validate:word-problems PASS — ${ids.length} lessons, ${n} problems`);
}
