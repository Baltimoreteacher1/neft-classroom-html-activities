// Vocabulary Academy — units and lessons (Wordly Wise-style structure): grouping, links, the unit crossword, the unit
// test and the lesson Word List. Pure: no DOM, no network. Sweeps every real unit file on disk.
// Run: node tools/vocab-academy-units.test.mjs
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const LAB = new URL("access-practice-lab/src/vocab-academy/", ROOT);
const data = await import(new URL("data.js", LAB));
const contract = await import(new URL("contract.js", LAB));
const { buildCrossword, checkCrossword, cellsOf, clueFor, pickWords } = await import(
  new URL("unit/crossword.js", LAB)
);
const { buildUnitTest } = await import(new URL("unit/test.js", LAB));
const { scoreAssessment } = await import(new URL("assessment.js", LAB));
const ENGINE = ["les", "sons"].join(""); // the lesson-player engine folder, not the curriculum tree
const { findMeaningItem } = await import(new URL(`${ENGINE}/items.js`, LAB));
const { rngFor } = await import(new URL("rng.js", LAB));
const assign = await import(new URL("educator/assign.js", LAB));
const { EXTRA_IDS } = await import(new URL("unit/extras.js", LAB));

const CONTENT = new URL("access-practice-lab/content/vocab-academy/", ROOT);
const grades = {};
for (const g of readdirSync(CONTENT).filter((x) => /^g(K|\d+)$/.test(x))) {
  grades[g.slice(1)] = readdirSync(new URL(`${g}/`, CONTENT))
    .filter((f) => /^u\d+\.json$/.test(f))
    .sort()
    .map((f) => JSON.parse(readFileSync(new URL(`${g}/${f}`, CONTENT), "utf8")));
}
const rowsOf = (lessons) => lessons.map((u) => ({ n: u.n, id: u.id }));
const unitsOf = (g) => data.groupLessons(rowsOf(grades[g]));

test("grouping: every unit has the same number of lessons, covers every lesson once, in order", () => {
  assert.equal(data.lessonsPerUnit(12), 4);
  assert.equal(data.lessonsPerUnit(20), 4);
  assert.equal(data.lessonsPerUnit(15), 3);
  assert.equal(data.lessonsPerUnit(18), 3);
  for (const g of Object.keys(grades)) {
    const units = unitsOf(g);
    const size = data.lessonsPerUnit(grades[g].length);
    assert.equal(
      units.reduce((n, u) => n + u.lessons.length, 0),
      grades[g].length,
      `${g}: all lessons`,
    );
    units.forEach((u, i) => {
      assert.equal(u.u, i + 1);
      assert.equal(u.lessons.length, size, `${g} unit ${u.u} size`);
      assert.deepEqual(
        u.lessons.map((l) => l.n),
        Array.from({ length: size }, (_, k) => u.first + k),
      );
      assert.equal(u.last, u.first + size - 1);
    });
    for (const l of grades[g])
      assert.equal(
        data.unitOfLesson(l.n, grades[g].length),
        unitsOf(g).find((u) => u.lessons.some((x) => x.n === l.n)).u,
      );
  }
});

test("links: lesson and unit URLs, custom lessons travel as cu_<slug>", () => {
  assert.equal(data.lessonHref("5", 7), "/access-practice-lab/vocabulary-academy/grade/5/lesson/7");
  assert.equal(
    data.lessonHref("5", 7, "B"),
    "/access-practice-lab/vocabulary-academy/grade/5/lesson/7/b",
  );
  assert.equal(data.unitHref("5", 2), "/access-practice-lab/vocabulary-academy/grade/5/unit/2");
  assert.equal(
    data.unitHref("5", 2, "crossword"),
    "/access-practice-lab/vocabulary-academy/grade/5/unit/2/crossword",
  );
  assert.equal(
    data.lessonHref("5", "cu.reading-a1b2"),
    "/access-practice-lab/vocabulary-academy/grade/5/lesson/cu_reading-a1b2",
  );
  assert.equal(data.groupId("5", 2), "g5-unit2");
  assert.deepEqual(data.parseGroupId("g5-unit2"), { grade: "5", u: 2 });
  assert.equal(data.parseGroupId("g5-u02"), null);
  assert.equal(data.parseGroupId("g13-unit1"), null);
});

test("assignments: a lesson, a section and a unit each round-trip through their path", () => {
  const section = assign.parseAssignmentPath(
    assign.assignmentPath({ grade: "4", n: 3, lesson: "c" }),
  );
  assert.equal(section.kind, "section");
  assert.deepEqual([section.grade, section.n, section.lesson], ["4", 3, "c"]);
  const lesson = assign.parseAssignmentPath(assign.assignmentPath({ grade: "4", n: 3 }));
  assert.equal(lesson.kind, "lesson");
  const unit = assign.parseAssignmentPath(
    assign.unitAssignmentPath({ grade: "4", u: 2, activity: "test" }),
  );
  assert.deepEqual([unit.kind, unit.grade, unit.u, unit.activity], ["unit", "4", 2, "test"]);
  const stops = assign.unitStops({ grade: "4", u: 2, first: 5, last: 8 });
  assert.deepEqual(
    stops.map((s) => s.activity),
    ["", "crossword", ...EXTRA_IDS, "test"],
  );
  assert.equal(new Set(stops.map((s) => s.id)).size, 3 + EXTRA_IDS.length);
  for (const s of stops) assert.ok(assign.isVocabAcademyAssignment({ path: s.path }), s.path);
  // a unit cannot be differentiated by word subset: it has no word list of its own
  assert.equal(assign.differentiate({ path: stops[0].path, title: "x" }, { variant: {} }), null);
});

test("sections are named like a Wordly Wise lesson: word list, Exercises A-F, review", () => {
  assert.deepEqual(
    contract.LESSONS.map((l) => l.code),
    ["", "A", "B", "C", "D", "E", "F", ""],
  );
  assert.equal(contract.sectionTitle("b", 6)[0], "Exercise 6A: Finding Meanings");
  assert.equal(contract.sectionTitle("g", 6)[1], "Ejercicio 6F: Usar las palabras");
  assert.equal(contract.sectionTitle("a", 6)[0], "Word List");
  assert.equal(contract.sectionTitle("h", 6)[0], "Lesson Review");
  assert.equal(contract.sectionTitle("c", "cu.x")[0], "Exercise B: Just the Right Word");
});

test("Finding Meanings: every real lesson gets true-sentence items with exactly one true choice", () => {
  let items = 0;
  for (const g of Object.keys(grades))
    for (const unit of grades[g]) {
      const rng = rngFor(unit.id);
      let built = 0;
      for (const w of unit.words) {
        const it = findMeaningItem(unit, w, rng, "B");
        if (!it) continue;
        built++;
        items++;
        const right = it.choices[it.answer];
        assert.ok(
          right.toLowerCase().startsWith(w.hw.toLowerCase()),
          `${it.id} true sentence names the word`,
        );
        assert.equal(
          new Set(it.choices.map((c) => c.toLowerCase())).size,
          it.choices.length,
          `${it.id} distinct`,
        );
        for (const [i, c] of it.choices.entries())
          if (i !== it.answer) assert.notEqual(c.toLowerCase(), right.toLowerCase());
      }
      assert.ok(
        built >= Math.ceil(unit.words.length * 0.8),
        `${unit.id}: ${built} of ${unit.words.length} words`,
      );
    }
  assert.ok(items > 1000, `built ${items}`);
});

test("crossword: every real unit makes a valid, solvable puzzle that never prints its answers", () => {
  let n = 0;
  for (const g of Object.keys(grades)) {
    for (const unit of unitsOf(g)) {
      const lessons = unit.lessons.map((l) => grades[g].find((x) => x.n === l.n));
      const words = lessons.map((l) => l.words);
      const gid = data.groupId(g, unit.u);
      const max = g === "K" || g === "1" || g === "2" ? 10 : 14;
      const puzzle = buildCrossword(pickWords(words, 20, rngFor(`${gid}:crossword`)), {
        seed: gid,
        max,
      });
      n++;
      assert.ok(puzzle.placed >= 8, `${gid} placed ${puzzle.placed}`);
      assert.ok(
        puzzle.rows <= 16 && puzzle.cols <= 16,
        `${gid} grid ${puzzle.rows}x${puzzle.cols}`,
      );
      // every entry reads its letters off the grid; clues carry no answer; numbering is shared by across/down
      for (const e of puzzle.entries) {
        const read = cellsOf(e)
          .map(([r, c]) => puzzle.cells[r][c]?.ch)
          .join("");
        assert.equal(read, e.answer, `${gid} ${e.num}${e.dir}`);
        assert.ok(e.clue.length > 8, `${gid} ${e.hw} has a clue`);
        assert.ok(
          !new RegExp(`\\b${e.hw}`, "i").test(e.clue),
          `${gid}: clue for ${e.hw} prints the answer`,
        );
        assert.equal(puzzle.cells[e.row][e.col].num, e.num);
      }
      // two entries only share a cell when they cross; no two words run together in a line
      const owner = new Map();
      for (const e of puzzle.entries)
        for (const [r, c] of cellsOf(e)) owner.set(`${r},${c},${e.dir}`, e.answer);
      for (const row of puzzle.cells.keys())
        for (const c of puzzle.cells[row].keys()) {
          const cell = puzzle.cells[row][c];
          if (!cell) continue;
          assert.ok(
            owner.has(`${row},${c},across`) || owner.has(`${row},${c},down`),
            `${gid} stray letter at ${row},${c}`,
          );
        }
      // solving: the right letters finish it; one wrong letter is named; nothing is done while a box is empty
      const fill = {};
      puzzle.cells.forEach((rw, r) =>
        rw.forEach((cell, c) => cell && (fill[`${r},${c}`] = cell.ch)),
      );
      assert.equal(checkCrossword(puzzle, fill).done, true);
      const k = Object.keys(fill)[0];
      assert.deepEqual(checkCrossword(puzzle, { ...fill, [k]: "#" }).wrong, [k]);
      assert.equal(checkCrossword(puzzle, { ...fill, [k]: "" }).done, false);
      // deterministic
      const again = buildCrossword(pickWords(words, 20, rngFor(`${gid}:crossword`)), {
        seed: gid,
        max,
      });
      assert.deepEqual(
        again.entries.map((e) => e.answer),
        puzzle.entries.map((e) => e.answer),
      );
    }
  }
  assert.ok(n >= 40, `${n} units swept`);
});

test("crossword clues: a meaning that contains the word falls back to a blanked sentence", () => {
  const w = {
    hw: "bark",
    def: "The bark of a tree is its outer covering.",
    ex: "The dog's bark was loud.",
    id: "x",
    cloze: { s: "The ___ peeled off the tree." },
  };
  assert.equal(clueFor(w), "The ___ peeled off the tree.");
  assert.equal(clueFor({ hw: "calm", def: "Quiet and still." }), "Quiet and still.");
});

test("unit test: every real unit gets one question per sampled word from EVERY lesson, scored by word", () => {
  let tests = 0;
  for (const g of Object.keys(grades))
    for (const unit of unitsOf(g)) {
      const lessons = unit.lessons.map((l) => grades[g].find((x) => x.n === l.n));
      const merged = data.mergeLessons(g, unit, lessons);
      const t = buildUnitTest(merged, lessons, { seed: `${merged.id}#0`, perLesson: 5 });
      tests++;
      assert.equal(t.warnings.length, 0, `${merged.id}: ${t.warnings.join("; ")}`);
      assert.ok(t.items.length >= 15, `${merged.id}: ${t.items.length} items`);
      for (const l of lessons)
        assert.ok(
          t.items.some((i) => i.lessonId === l.id),
          `${merged.id} covers ${l.id}`,
        );
      assert.equal(new Set(t.items.map((i) => i.id)).size, t.items.length, "item ids unique");
      for (const i of t.items) {
        assert.ok(Number.isInteger(i.answer) && i.answer >= 0 && i.answer < i.choices.length);
        assert.ok(!("explain" in i) || typeof i.explain === "string");
      }
      const right = Object.fromEntries(t.items.map((i) => [i.id, i.answer]));
      const res = scoreAssessment(t.items, right);
      assert.equal(res.score, t.items.length);
      assert.ok(Object.values(res.perWord).every((w) => w.ok));
      // a different seed changes the questions
      const other = buildUnitTest(merged, lessons, { seed: `${merged.id}#1`, perLesson: 5 });
      assert.notDeepEqual(
        other.items.map((i) => i.id),
        t.items.map((i) => i.id),
      );
    }
  assert.ok(tests >= 40);
});

test("merged unit: every word of every lesson, joined relations, no passage invented", () => {
  const lessons = grades["5"].slice(4, 8);
  const m = data.mergeLessons("5", { u: 2 }, lessons);
  assert.equal(m.id, "g5-unit2");
  assert.equal(
    m.words.length,
    lessons.reduce((n, l) => n + l.words.length, 0),
  );
  assert.equal(new Set(m.words.map((w) => w.id)).size, m.words.length);
  assert.ok(m.relations.groups.length >= lessons[0].relations.groups.length);
  assert.equal(m.group, true);
});
