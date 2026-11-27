// Classroom teachers' lesson kit (access-teacher/classroom/): authored frames for any lesson, by language use and support
// level, plus teaching moves, word cards and a student practice link. Every combination is complete, every frame leaves the student something to write, the teacher's topic and
// words go in, and nothing a teacher types can break the card.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  BANDS,
  buildCard,
  cardText,
  cleanWords,
  FRAMES,
  GRADES,
  gradeInfo,
  LEVELS,
  MAX_WORDS,
  MOVES,
  SKILL_FOR_USE,
  studentLink,
  TALK,
  USES,
  WORDS,
} from "../access-teacher/classroom/frames.js";

test("every language use has three frames per band and level, each with a blank, plus connectors and partner talk", () => {
  for (const u of USES) {
    assert.ok(
      u.name[0] && u.name[1] && u.task[0] && u.task[1],
      `${u.id} is named in English and Spanish`,
    );
    assert.ok(TALK[u.id]?.ask && TALK[u.id]?.answer.includes("___"), `${u.id} partner talk`);
    for (const b of BANDS)
      for (const l of LEVELS) {
        const frames = FRAMES[u.id][b.id][l.id];
        assert.equal(frames.length, 3, `${u.id}/${b.id}/${l.id}`);
        for (const f of frames)
          assert.match(f, /___/, `"${f}" leaves the student something to write`);
        assert.equal(WORDS[u.id][l.id].length, 3, `${u.id}/${l.id} connectors`);
      }
  }
});

test("the topic fills in, capitalized at the start of a frame; no placeholder survives", () => {
  const card = buildCard({ use: "inform", band: "38", topic: "  the   water cycle " });
  assert.equal(card.topic, "the water cycle");
  assert.equal(card.task[0], "Tell facts about the water cycle.");
  const all = card.levels.flatMap((l) => l.frames).join(" ");
  assert.ok(all.includes("the water cycle"));
  assert.match(card.levels[2].frames[0], /^The water cycle/);
  for (const u of USES)
    for (const b of BANDS) {
      const c = buildCard({ use: u.id, band: b.id });
      const text = cardText(c);
      assert.doesNotMatch(text, /\{topic\}/, `${u.id}/${b.id}: no placeholder without a topic`);
    }
});

test("levels: all three by default, in order; a chosen subset keeps the order; unknown use or band gives no card", () => {
  assert.deepEqual(
    buildCard({}).levels.map((l) => l.id),
    ["more", "some", "own"],
  );
  assert.deepEqual(
    buildCard({ levels: ["own", "more"] }).levels.map((l) => l.id),
    ["more", "own"],
  );
  assert.equal(buildCard({ use: "persuade" }), null);
  assert.equal(buildCard({ band: "9-12" }), null);
});

test("key words: trimmed, de-duplicated without regard to case, capped", () => {
  assert.deepEqual(cleanWords(" evaporation, Evaporation ;condensation\n\n rain  cloud "), [
    "evaporation",
    "condensation",
    "rain cloud",
  ]);
  const many = Array.from({ length: 20 }, (_, i) => `w${i}`).join(",");
  assert.equal(cleanWords(many).length, MAX_WORDS);
});

test("plain text lists every level's frames and the partner talk", () => {
  const text = cardText(
    buildCard({ use: "argue", topic: "school uniforms", words: "rule, choice" }),
  );
  assert.match(text, /^Argue: school uniforms/);
  assert.match(text, /Key words: rule, choice/);
  for (const l of LEVELS) assert.ok(text.includes(l.name[0]));
  assert.match(text, /Partner talk — A: /);
});

test("the page escapes what a teacher types and offers the card from the Hub", () => {
  const page = readFileSync(
    new URL("../access-teacher/classroom/card.js", import.meta.url),
    "utf8",
  );
  assert.match(page, /const esc = /);
  for (const field of ["card.topic", "w)", "f)"]) assert.ok(page.includes(field), field);
  assert.doesNotMatch(page, /innerHTML = [^`]*state\.topic/);
  const hub = readFileSync(new URL("../access-teacher/index.html", import.meta.url), "utf8");
  assert.match(
    hub,
    /data-lib-id="card"><a class="th-lib-card" href="\/access-teacher\/classroom\/"/,
  );
});

test("teaching moves: three for every use plus three for any lesson, each one sentence", () => {
  assert.equal(MOVES.any.length, 3);
  for (const u of USES) {
    assert.equal(MOVES[u.id].length, 3, u.id);
    assert.ok(SKILL_FOR_USE[u.id], `${u.id} names a practice skill`);
  }
  for (const m of Object.values(MOVES).flat()) assert.ok(m.length < 120 && /[.]$/.test(m), m);
});

test("grades map to the frames band and the Student Hub; the practice link opens the matching skill", () => {
  assert.deepEqual(GRADES, ["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
  assert.equal(gradeInfo("2").band, "k2");
  assert.equal(gradeInfo("3").band, "38");
  assert.equal(gradeInfo("4").content, "3-5", "grades 4-5 practice in the 3-5 content band");
  assert.equal(gradeInfo("nonsense").grade, "6");
  assert.equal(
    studentLink("7", "argue"),
    "/access-practice-lab/students?pick=6-8&grades=6-8&skill=Writing",
  );
  assert.equal(
    studentLink("5", "inform"),
    "/access-practice-lab/students?pick=4-5&grades=3-5&skill=Reading",
  );
  assert.equal(studentLink("K", "narrate"), "/access-practice-lab/early?grades=K");
  assert.equal(studentLink("3", "explain"), "/access-practice-lab/early?grades=2-3");
});

test("the Classroom Teacher door opens this page, not the full Teacher Hub", () => {
  const home = readFileSync(
    new URL("../access-practice-lab/src/views/home-audience.js", import.meta.url),
    "utf8",
  );
  assert.match(home, /href: \(\) => "\/access-teacher\/classroom\/"/);
  const page = readFileSync(
    new URL("../access-teacher/classroom/index.html", import.meta.url),
    "utf8",
  );
  assert.equal((page.match(/<h1\b/g) || []).length, 1);
  for (const id of ["kitMoves", "kitFrames", "kitWords", "kitPractice"])
    assert.ok(page.includes(`id="${id}"`), id);
});
