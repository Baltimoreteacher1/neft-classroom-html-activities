// Language Choice Boards, Talk Table, the Lesson Builder week, and the Passport summaries: content truth and rules.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  BOARD_DOMAINS,
  boardStatus,
  cardFor,
  checkBoards,
  checkTalk,
  choiceSummary,
  cleanChoice,
  deckFor,
  kluFromSlug,
  LINES,
  nearWins,
  setSquareDone,
  setSquareNote,
  talkDaysThisWeek,
  talkSummary,
} from "../access-practice-lab/src/lang/boards.js";
import { normalizeSettings } from "../access-practice-lab/src/lesson-builder/assemble.js";
import { FUNCTIONS } from "../access-practice-lab/src/lesson-builder/rules.js";
import {
  assembleWeek,
  framesAround,
  QUICK_STARTS,
  quickStart,
} from "../access-practice-lab/src/lesson-builder/week.js";

const json = (p) =>
  JSON.parse(readFileSync(new URL(`../access-practice-lab/${p}`, import.meta.url), "utf8"));
const BOARDS = json("content/choice-boards.json");
const TALK = json("content/talk-table.json");
const INDEX = json("content/index.json");

test("content: every board and every card passes the shared checks", () => {
  assert.deepEqual(checkBoards(BOARDS), []);
  assert.deepEqual(checkTalk(TALK), []);
});

test("checks fire on broken content (a checker that stops firing fails here)", () => {
  const broken = structuredClone(BOARDS);
  broken.bands["3-5"].Argue.squares[0].domain = "Writing";
  delete broken.bands.K.Narrate.squares[1].read;
  broken.bands["6-8"].Inform.squares[2].frame = ["no blank", "sin espacio"];
  assert.equal(checkBoards(broken).length, 4); // the moved Listening square also keeps a listen text
  const t = structuredClone(TALK);
  t.bands["2-3"].Explain[1].q = [...t.bands["2-3"].Explain[0].q];
  t.bands.K.Argue[0].words = [];
  assert.equal(checkTalk(t).length, 2);
});

test("board layout: every line of three mixes skills (no domain twice in a line)", () => {
  for (const line of LINES) {
    const domains = line.map((i) => BOARD_DOMAINS[i]).filter((d) => d !== "Create");
    assert.equal(new Set(domains).size, domains.length, `line ${line}`);
  }
});

test("board status, near wins and stored records", () => {
  assert.deepEqual(boardStatus([0, 1]).lines, []);
  assert.equal(boardStatus([0, 1, 2]).bingo, true);
  assert.equal(boardStatus([2, 4, 6]).lines.length, 1);
  assert.equal(boardStatus([...Array(9).keys()]).full, true);
  assert.deepEqual(nearWins([0, 1]), [2]);
  assert.ok(nearWins([0, 4]).includes(8));
  let all = setSquareDone({}, "3-5", "Argue", 4, true);
  all = setSquareNote(all, "3-5", "Argue", 4, "My reason is …");
  all = setSquareDone(all, "3-5", "Argue", 99, true); // out of range: ignored
  const clean = cleanChoice(
    JSON.parse(JSON.stringify({ ...all, "9-9:Argue": { done: [1] }, "3-5:Shout": {} })),
  );
  assert.deepEqual(Object.keys(clean), ["3-5:Argue"]);
  assert.deepEqual(clean["3-5:Argue"].done, [4]);
  assert.equal(
    choiceSummary(
      JSON.stringify(
        setSquareDone(
          setSquareDone(setSquareDone(all, "3-5", "Argue", 0, true), "3-5", "Argue", 8, true),
          "3-5",
          "Inform",
          1,
          true,
        ),
      ),
      "3-5",
    ).lines,
    1,
  );
  assert.deepEqual(choiceSummary("not json", "3-5"), { squares: 0, lines: 0 });
});

test("talk deck: interleaved kinds, same card all day, talked cards skipped, week count", () => {
  const all = deckFor(TALK, "3-5");
  assert.equal(all.length, 32);
  assert.deepEqual(
    all.slice(0, 4).map((c) => c.klu),
    ["Narrate", "Inform", "Explain", "Argue"],
  );
  assert.ok(deckFor(TALK, "6-8", "Argue").every((c) => c.klu === "Argue"));
  const a = cardFor(all, {}, "2026-11-17");
  assert.equal(cardFor(all, {}, "2026-11-17").id, a.id);
  assert.notEqual(cardFor(all, { [a.id]: "2026-11-17" }, "2026-11-17").id, a.id);
  assert.notEqual(cardFor(all, {}, "2026-11-17", 1).id, a.id);
  const talked = { x1a: "2026-11-17", x2b: "2026-11-15", x3c: "2026-11-01" };
  assert.equal(talkDaysThisWeek(talked, "2026-11-17"), 2);
  assert.deepEqual(
    talkSummary(JSON.stringify({ talked: { ...talked, "BAD ID": "2026-11-17" } }), "2026-11-17"),
    { cards: 3, week: 2 },
  );
  assert.equal(kluFromSlug("ARGUE"), "Argue");
  assert.equal(kluFromSlug("../x"), "");
});

const rowsFor = (band) =>
  Object.entries(INDEX.bands[band].domains)
    .filter(([d]) => ["Listening", "Reading", "Speaking", "Writing"].includes(d))
    .flatMap(([domain, d]) =>
      Object.entries(d.levels).flatMap(([level, l]) =>
        l.activities.map(([id, title, type, skill, minutes]) => ({
          id,
          title,
          type,
          skill,
          minutes,
          domain,
          level,
          band,
        })),
      ),
    );

test("quick starts are complete, valid settings", () => {
  for (const q of QUICK_STARTS) {
    const s = quickStart(q.id, "6-8");
    assert.deepEqual(s, normalizeSettings({ ...q.settings, band: "6-8" }), q.id);
    assert.deepEqual(s.domains, q.settings.domains, `${q.id} keeps its domains`);
    assert.equal(s.fn, q.settings.fn);
  }
  assert.equal(quickStart("nope", "6-8"), null);
});

test("week: five days, domains in turn, no repeated new activity, Friday revisits Monday, home talk matches the use", () => {
  for (const band of ["3-5", "6-8"]) {
    const rows = rowsFor(band);
    const settings = {
      band,
      domains: ["Reading", "Speaking", "Writing"],
      fn: "argue",
      support: "B",
      minutes: 30,
      topic: "",
    };
    const week = assembleWeek(settings, rows, TALK);
    assert.equal(week.days.length, 5);
    assert.equal(week.klu, FUNCTIONS.argue.klu);
    assert.deepEqual(
      week.days.slice(0, 4).map((d) => d.focus),
      ["Reading", "Speaking", "Writing", "Reading"],
    );
    const ids = week.days.slice(0, 4).map((d) => d.activityId);
    assert.ok(ids.every(Boolean), `${band}: every school day has a real activity`);
    assert.equal(new Set(ids).size, 4);
    for (const [i, id] of ids.entries())
      assert.equal(rows.find((r) => r.id === id).domain, week.days[i].focus);
    assert.equal(week.days[4].activityId, week.days[0].activityId);
    assert.ok(week.days.every((d) => d.talk?.klu === "Argue"));
    assert.equal(new Set(week.days.map((d) => d.talk.id)).size, 5);
  }
  const noTalk = assembleWeek({ band: "6-8" }, [], null);
  assert.ok(noTalk.days.every((d) => d.talk === null && d.activityId === null));
});

test("student page frames: one step easier and one step harder, none past the ends", () => {
  assert.equal(framesAround({ fn: "explain", support: "A" }).easier, null);
  assert.equal(framesAround({ fn: "explain", support: "C" }).harder, null);
  const b = framesAround({ fn: "explain", support: "B" });
  assert.deepEqual(
    [b.easier, b.mine, b.harder],
    [FUNCTIONS.explain.frames.A, FUNCTIONS.explain.frames.B, FUNCTIONS.explain.frames.C],
  );
});
