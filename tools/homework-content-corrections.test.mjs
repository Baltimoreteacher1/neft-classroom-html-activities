import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import {
  selectMorePracticeProblems,
  selectTieredQuickCheckProblems,
} from "../scripts/homework-alignment.mjs";
import { ANSWER_MATCH_JS } from "../scripts/homework-answer-match.mjs";
import { tableModel } from "../scripts/lib/homework-problems.mjs";

const config = (id) =>
  JSON.parse(readFileSync(new URL(`../lessons/${id}/config.json`, import.meta.url), "utf8"));
const notes = (id) =>
  JSON.parse(
    readFileSync(new URL(`../data/family-homework-notes/${id}.json`, import.meta.url), "utf8"),
  );
const problem = (id, tier, index) => config(id).practice[tier][index];
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const number = (s) => Number(String(s).match(/-?\d+(?:\.\d+)?/)[0]);

test("rounded comparisons tell families when estimation cannot decide", () => {
  const p = problem("2-11", "onLevel", 1);
  assert.match(p.instructions, /estimate equals 10/);
  assert.match(p.instructionsEs, /estimación es 10/);
  for (const item of p.items) {
    const [a, b] = item.text.split(/\s+[+−]\s+/).map(Number);
    const result = item.text.includes("+") ? a + b : a - b;
    assert.equal(item.category, result > 10 ? "greater" : "less");
  }
  assert.match(problem("2-3", "onLevel", 0).stem, /nearest hundredth/);
  const meanCells = problem("2-3", "onLevel", 0).editableCells.filter((c) => c.col === 1);
  for (const [i, data] of [
    [5, 8, 8, 10, 14],
    [20, 25, 25, 30, 25, 35],
    [100, 110, 90, 100, 115, 95],
  ].entries())
    close(
      Number(meanCells[i].answer),
      Math.round((data.reduce((a, b) => a + b, 0) / data.length) * 100) / 100,
    );
});

test("positive fraction scaling and zero absolute deviation have correct boundaries", () => {
  const fraction = notes("1-2").watchFor[2];
  assert.match(fraction.en, /between 0 and 1/);
  assert.match(fraction.en, /more than 1/);
  close((540 * 6) / 5, 648);
  for (const id of ["2-9", "2-9-part2", "7-4"]) {
    assert.doesNotMatch(JSON.stringify(config(id)), /always positive|siempre es positiv[oa]/);
    assert.doesNotMatch(JSON.stringify(notes(id)), /always positive|siempre es positiv[oa]/);
  }
  assert.match(problem("2-9", "onLevel", 3).explanation, /average distance/);
  assert.doesNotMatch(problem("2-9", "onLevel", 3).explanation, /usually within/);
  const session = JSON.parse(
    readFileSync(new URL("../data/part-two-session2-practice.json", import.meta.url), "utf8"),
  ).lessons["2-9-part2"];
  for (const key of ["explanation", "explanationEs"]) {
    assert.doesNotMatch(session.approaching[1][key], /always positive|siempre positivas/);
    assert.match(session.approaching[1][key], /0/);
    assert.doesNotMatch(session.extending[0][key], /almost always|casi siempre/);
  }
});

test("polygon table dimensions match a regular polygon and all area answers recompute", () => {
  const p = problem("5-9", "onLevel", 0);
  for (const [i, row] of p.rows.entries()) {
    const n = number(row[1]),
      side = number(row[2]),
      h = number(row[3]);
    const exactApothem = side / (2 * Math.tan(Math.PI / n));
    if (n === 4) close(h, side / 2);
    else
      assert.ok(
        Math.abs(h - exactApothem) <= 0.05,
        `${row[0]} apothem ${h} does not round from ${exactApothem}`,
      );
    close(number(p.editableCells.find((c) => c.row === i && c.col === 4).answer), (side * h) / 2);
    close(
      number(p.editableCells.find((c) => c.row === i && c.col === 5).answer),
      (n * side * h) / 2,
    );
  }
});

test("all dimension-bearing polygon match cards describe possible polygons", () => {
  for (const [tier, index] of [
    ["onLevel", 1],
    ["optional", 3],
  ]) {
    for (const pair of problem("5-9", tier, index).pairs) {
      const [count, side, height] = pair.term.match(/\d+(?:\.\d+)?/g).map(Number);
      close(number(pair.match), (count * side * height) / 2);
      // A whole equilateral triangle uses altitude, not its central apothem.
      const n = pair.term.startsWith("Equilateral") ? 3 : count;
      const actual = count === 1 ? (side * Math.sqrt(3)) / 2 : side / (2 * Math.tan(Math.PI / n));
      assert.ok(Math.abs(actual - height) <= 0.05, `${pair.term}: expected height near ${actual}`);
    }
  }
  const p = problem("5-9", "extending", 1);
  assert.match(p.prompt, /area 15/);
  assert.doesNotMatch(p.prompt, /same base|same height/);
  close(6 * 15 - 5 * 15, 15);
});

test("prism and whole-group problems are geometrically and contextually possible", () => {
  const p = problem("5-7", "extending", 1);
  assert.match(p.prompt, /right triangles/);
  close(6 ** 2 + 8 ** 2, 10 ** 2);
  const box = 2 * (8 * 6 + 8 * 4 + 6 * 4),
    prism = 2 * ((6 * 8) / 2) + (6 + 8 + 10) * 8;
  close(box, 208);
  close(prism, 240);
  assert.match(p.explanation, /32 in² less/);
  const rows = problem("6-11", "onLevel", 0).rows;
  assert.equal(Number(rows[0].solution), Math.floor(7 / 8 / (1 / 4)));
  assert.equal(Number(rows[1].solution), Math.floor(5 / 6 / (1 / 3)));
  assert.match(rows[0].problem, /FULL/);
  assert.match(rows[1].problem, /FULL/);
});

test("rounding of conversion factors is separate from exact definitions", () => {
  const p = problem("3-7", "optional", 3);
  assert.match(p.explanation, /exactly 1\.609344/);
  assert.match(p.stem, /rounded factor/);
  const all = JSON.stringify(config("3-7"));
  assert.doesNotMatch(all, /never ends neatly|decimal that keeps going|1 in ≈ 2\.54/);
  assert.match(problem("3-7", "optional", 0).stem, /exactly 2\.54/);
  close(2.54 * 4, 10.16);
});

test("single-answer activities have distinct mathematical classifications", () => {
  const p = problem("6-7", "approaching", 3);
  assert.equal(p.categories.length, 3);
  for (const card of p.cards) {
    const n = Number(card.text),
      factor = 10 % n === 0,
      multiple = n % 10 === 0;
    assert.equal(card.correct, factor && multiple ? 2 : factor ? 0 : 1);
  }
  const properties = problem("6-8", "optional", 4).pairs;
  assert.equal(new Set(properties.map((p) => p.match)).size, properties.length);
  assert.match(properties[0].term, /×/);
  assert.match(properties[0].match, /Multiplication/);
  assert.match(problem("6-4", "optional", 2).stem, /includes an operation/);
  const inequalities = problem("8-6", "optional", 3).pairs;
  const satisfies = (expression, value) => {
    const [left, op, right] = expression.split(" ");
    const a = left === "x" ? value : Number(left),
      b = right === "x" ? value : Number(right);
    return op === ">" ? a > b : op === "<" ? a < b : op === "≤" ? a <= b : a >= b;
  };
  for (const pair of inequalities)
    for (let value = -20; value <= 20; value++)
      assert.equal(satisfies(pair.term, value), satisfies(pair.match, value));
  for (const pair of inequalities)
    assert.equal(
      inequalities.filter((other) =>
        Array.from({ length: 41 }, (_, i) => i - 20).every(
          (x) => satisfies(pair.term, x) === satisfies(other.match, x),
        ),
      ).length,
      1,
    );
});

test("temperature, quadrant ordering, and minimum price respect boundary cases", () => {
  const temp = problem("7-3", "optional", 3);
  assert.match(temp.instructions, /Celsius/);
  for (const item of temp.items) {
    assert.match(item.text, /°C/);
    assert.equal(item.category, number(item.text) < 0 ? "below" : "above");
  }
  const order = problem("7-8", "approaching", 4);
  assert.match(order.label, /greater x-coordinate first/);
  const point = (s) => s.match(/-?\d+/g).map(Number);
  const quadrant = ([x, y]) => (x > 0 ? (y > 0 ? 1 : 4) : y > 0 ? 2 : 3);
  const expected = [...order.items].sort(
    (a, b) => quadrant(point(a)) - quadrant(point(b)) || point(b)[0] - point(a)[0],
  );
  assert.deepEqual(order.correctOrder, expected);
  const price = problem("9-4", "onLevel", 4);
  const cents = Math.ceil((500 * 100) / 35);
  assert.equal(price.choices[price.correctIndex], `$${(cents / 100).toFixed(2)}`);
  assert.ok(35 * cents >= 50000);
  assert.ok(35 * (cents - 1) < 50000);
  assert.doesNotMatch(
    JSON.stringify(config("9-4")),
    /must charge at least \$14\.30|cobrar al menos \$14\.30/,
  );
});

test("learning directions preserve order and define integers and like terms accurately", () => {
  assert.match(notes("6-2").watchFor[0].en, /original order/);
  assert.match(notes("7-2").bigIdea.en, /two integers with a nonzero denominator/);
  assert.doesNotMatch(JSON.stringify(notes("7-2")), /whole numbers/);
  assert.match(notes("6-15").bigIdea.en, /exponent/);
  const trees = problem("6-13", "extending", 1);
  assert.match(trees.prompt, /24, 36, or 60/);
  assert.doesNotMatch(trees.prompt, /any two-digit/);
});

test("selected homework problems do not depend on missing book pictures or positional questions", () => {
  for (const id of ["1-1", "1-2", "1-3", "4-3", "5-9", "9-2", "10-6"]) {
    const c = config(id);
    c.familyNotes = { ...notes(id), ...c.familyNotes };
    const { warmup, challenge } = selectTieredQuickCheckProblems(c.practice, c);
    const core = [...warmup, ...challenge];
    const selected = [...core, ...selectMorePracticeProblems(c.practice, c, core)];
    for (const p of selected)
      assert.doesNotMatch(
        [p.stem, p.prompt, p.instructions, p.label].filter(Boolean).join(" "),
        /picture in your book|previous question|found earlier|Ask a classmate about/i,
      );
  }
  assert.match(problem("1-3", "approaching", 5).stem, /80 passengers/);
  assert.match(problem("9-2", "onLevel", 1).stem, /1,200 feet each minute/);
});

test("all selected core-lesson table headers and text cells have Spanish equivalents", () => {
  const dictionary = JSON.parse(
    readFileSync(new URL("../data/homework-table-spanish.json", import.meta.url), "utf8"),
  );
  const manifest = JSON.parse(
    readFileSync(new URL("../data/curriculum-manifest.json", import.meta.url), "utf8"),
  );
  let tables = 0;
  for (const { id } of manifest.lessons) {
    const c = config(id);
    c.familyNotes = { ...notes(id), ...c.familyNotes };
    const { warmup, challenge } = selectTieredQuickCheckProblems(c.practice, c);
    const core = [...warmup, ...challenge];
    const check = (text) => {
      if (typeof text === "string" && /[A-Za-z]{2}/.test(text))
        assert.ok(dictionary[text]?.trim(), `${id}: Spanish table translation missing for ${text}`);
    };
    for (const p of [...core, ...selectMorePracticeProblems(c.practice, c, core)])
      if (p.type === "fill-table") {
        tables++;
        for (const header of p.headers || p.columns || []) check(header);
        for (const row of p.rows || [])
          for (const [key, value] of Object.entries(row))
            if (key !== "answer" && key !== "editable") check(value);
        for (const row of tableModel(p).rows)
          for (const cell of row) if (cell.isEditable) check(cell.correctValue);
      }
  }
  assert.ok(
    tables >= 100,
    "Coverage should include the entire 84-lesson manifest, not sampled tables",
  );
  for (const [en, es] of Object.entries(dictionary))
    assert.deepEqual(
      es.match(/\d+(?:\.\d+)?/g) || [],
      en.match(/\d+(?:\.\d+)?/g) || [],
      `Numerals changed in translation: ${en}`,
    );
});

test("generated homework matcher accepts equivalent numeric and comparison forms without crediting wrong relations", () => {
  const matcher = runInNewContext(ANSWER_MATCH_JS + "\nNTAnswerMatch;");
  for (const [typed, key] of [
    ["2.5", "5/2 = 2 1/2"],
    ["2 1/2", "5/2 = 2 1/2"],
    ["10/4", "5/2 = 2 1/2"],
    ["x >= 9", "x ≥ 9"],
    ["9 ≤ x", "x ≥ 9"],
    ["9 <= x", "x ≥ 9"],
    ["4.5 > x", "x < 9/2"],
    ["b <= 13", "b ≤ 13 books"],
  ])
    assert.equal(matcher.isRight(typed, key), true, `${typed} should match ${key}`);
  for (const [typed, key] of [
    ["2.6", "5/2 = 2 1/2"],
    ["2.5 = 3", "5/2 = 2 1/2"],
    ["2.5", "5/2 = 3"],
    ["9", "x ≥ 9"],
    ["x > 9", "x ≥ 9"],
    ["9 ≥ x", "x ≥ 9"],
    ["x >= 8", "x ≥ 9"],
    ["y ≥ 9", "x ≥ 9"],
    ["", "x ≥ 9"],
    ["true", "x ≥ 9"],
  ])
    assert.equal(matcher.isRight(typed, key), false, `${typed} must not match ${key}`);
  const dictionary = JSON.parse(
    readFileSync(new URL("../data/homework-table-spanish.json", import.meta.url), "utf8"),
  );
  for (const [typed, key] of [
    ["círculo", "circle"],
    ["triangulo", "triangle"],
    ["cuadrado", "square"],
    ["si", "Yes"],
  ])
    assert.equal(matcher.isRight(typed, dictionary[key]), true);
});

test("all selected multiple-choice text and matching directions have Spanish equivalents", () => {
  const dictionary = JSON.parse(
    readFileSync(new URL("../data/homework-choices-spanish.json", import.meta.url), "utf8"),
  );
  const manifest = JSON.parse(
    readFileSync(new URL("../data/curriculum-manifest.json", import.meta.url), "utf8"),
  );
  let choices = 0,
    matching = 0;
  for (const { id } of manifest.lessons) {
    const c = config(id);
    c.familyNotes = { ...notes(id), ...c.familyNotes };
    const { warmup, challenge } = selectTieredQuickCheckProblems(c.practice, c),
      core = [...warmup, ...challenge];
    for (const p of [...core, ...selectMorePracticeProblems(c.practice, c, core)]) {
      if (p.type === "multiple-choice")
        for (const [index, text] of p.choices.entries())
          if (/[A-Za-z]{2}/.test(text)) {
            choices++;
            assert.ok(
              p.choicesEs?.[index] || dictionary[text],
              `${id} choice missing Spanish: ${text}`,
            );
          }
      if (p.type === "matching-game") {
        matching++;
        assert.ok(
          p.labelEs || p.instructionsEs || p.stemEs,
          `${id} matching directions missing Spanish`,
        );
      }
    }
  }
  assert.ok(choices > 800);
  assert.ok(matching > 10);
  for (const [en, es] of Object.entries(dictionary))
    assert.deepEqual(
      es.match(/\d+(?:\.\d+)?/g) || [],
      en.match(/\d+(?:\.\d+)?/g) || [],
      `Numerals changed in choice translation: ${en}`,
    );
});
