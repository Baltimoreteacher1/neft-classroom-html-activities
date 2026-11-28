#!/usr/bin/env node
/**
 * Leveled writing assignments (access-practice-lab/src/lang/write-level.js, src/views/write-level-ui.js).
 * A teacher picks support level 1-6 for a Writing Studio task. These tests hold what makes that honest:
 *   - every level of every task is cut ONLY from content the task already authors (frames, banks, organizer, vocabulary)
 *   - the six levels really differ (length, writing help, word bank, Spanish help, model), and support only fades upward
 *   - the link carries a level number and nothing else about a student; a bad ?level= changes nothing
 *   - the page text never calls a level an official WIDA proficiency level or score
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import {
  glossOf,
  LEVEL_NOTE,
  LEVEL_STAGE,
  leveledLink,
  levelPlan,
  linesFor,
  parseLevel,
  starterOf,
  WRITE_LEVELS,
} from "../access-practice-lab/src/lang/write-level.js";
import { toHtml } from "../access-practice-lab/src/util.js";
import {
  levelBannerHTML,
  levelSheetHTML,
  levelSupportsHTML,
  levelsGlanceHTML,
  teacherLevelsHTML,
} from "../access-practice-lab/src/views/write-level-ui.js";

const tasks = JSON.parse(
  readFileSync(new URL("../access-practice-lab/content/studio/writing.json", import.meta.url)),
).tasks;
const I = makeI18n("en");
const text = (h) => toHtml(h);
const ctx = { band: "6-8" };

test("parseLevel accepts 1 to 6 and nothing else", () => {
  assert.equal(parseLevel("?level=3"), 3);
  assert.equal(parseLevel("?grades=6-8&level=6&focus=evidence"), 6);
  for (const bad of [
    "",
    "?level=0",
    "?level=7",
    "?level=abc",
    "?level=1.5",
    "?level=-2",
    "?level=%3Cscript%3E",
    "?level=3%203",
  ])
    assert.equal(parseLevel(bad), 0, bad);
  assert.equal(levelPlan(tasks[0], 0), null);
  assert.equal(levelPlan(tasks[0], 7), null);
});

test("the stage a level starts in follows the Writing Studio's three stages", () => {
  assert.deepEqual(
    WRITE_LEVELS.map((n) => LEVEL_STAGE[n]),
    ["guided", "guided", "supported", "supported", "independent", "independent"],
  );
});

test("every level of every task is cut only from the task's own content", () => {
  assert.equal(tasks.length, 22);
  for (const t of tasks) {
    const allWords = new Set([...t.stages.guided.bank, ...t.stages.supported.bank]);
    for (const n of WRITE_LEVELS) {
      const p = levelPlan(t, n);
      assert.ok(p, `${t.id} L${n}`);
      assert.equal(p.stage, LEVEL_STAGE[n]);
      for (const f of p.frames)
        assert.ok(t.stages.guided.frames.includes(f), `${t.id} L${n}: frame is not the task's`);
      assert.equal(p.starters.length, n === 3 ? t.stages.guided.frames.length : 0);
      for (const s of p.starters)
        assert.ok(
          (s.endsWith("…") && !s.includes("___")) || s.includes("___"),
          `${t.id} L${n} starter`,
        );
      for (const w of p.bank.words)
        assert.ok(allWords.has(w), `${t.id} L${n}: "${w}" is not in the task's banks`);
      for (const o of p.outline)
        assert.ok(
          t.organizer.some((x) => x.label === o.label && x.hint === o.hint),
          `${t.id} L${n}: outline`,
        );
      for (const c of p.criteria)
        assert.ok(t.successCriteria.includes(c), `${t.id} L${n}: criterion`);
      for (const r of p.revision)
        assert.ok(
          t.revisionPrompts.some((x) => x.prompt === r.prompt),
          `${t.id} L${n}: revision`,
        );
      if (p.bank.glosses)
        for (const w of p.bank.words) {
          const g = glossOf(t, w);
          if (g)
            assert.ok(
              t.vocab.some((v) => v.es.startsWith(`${g}:`)),
              `${t.id}: gloss for ${w} is not from the task's vocabulary`,
            );
        }
    }
  }
});

test("the six levels differ, and help only fades as the level rises", () => {
  for (const t of tasks) {
    const ps = WRITE_LEVELS.map((n) => levelPlan(t, n));
    for (let i = 1; i < ps.length; i++) {
      assert.ok(
        ps[i].expected.minWords >= ps[i - 1].expected.minWords,
        `${t.id}: length shrinks at L${i + 1}`,
      );
      assert.ok(
        ps[i].expected.maxWords >= ps[i - 1].expected.maxWords,
        `${t.id}: max shrinks at L${i + 1}`,
      );
    }
    assert.deepEqual(
      ps.map((p) => p.support),
      ["frames", "frames", "starters", "outline", "none", "none"],
    );
    assert.ok(
      ps[0].sentences <= 2 && ps[1].sentences <= 3 && ps[0].sentences < ps[1].sentences,
      t.id,
    );
    assert.ok(
      ps[0].frames.length < ps[1].frames.length || t.stages.guided.frames.length < 3,
      `${t.id}: L1 and L2 write the same number of frames`,
    );
    assert.deepEqual(
      ps.map((p) => p.homeLanguage),
      ["open", "open", "open", "on-request", "off", "off"],
    );
    assert.deepEqual(
      ps.map((p) => p.model),
      ["available", "available", "none", "none", "none", "none"],
    );
    assert.ok(
      ps[0].bank.words.length && ps[0].bank.open && ps[2].bank.words.length && !ps[2].bank.open,
      t.id,
    );
    assert.equal(ps[4].bank.words.length + ps[5].bank.words.length, 0);
    assert.ok(
      ps[0].revision.length === 0 &&
        ps[2].revision.length === 2 &&
        ps[3].revision.length === 3 &&
        ps[4].revision.length === t.revisionPrompts.length,
      t.id,
    );
    // The level's length is never above the task's own, except Reaching, which may stretch past it by 15%.
    assert.ok(
      ps[4].expected.minWords === t.expected.minWords &&
        ps[4].expected.maxWords === t.expected.maxWords,
      t.id,
    );
    assert.ok(
      ps[0].expected.minWords < t.expected.minWords &&
        ps[0].expected.maxWords > ps[0].expected.minWords,
      t.id,
    );
    for (const p of ps)
      assert.ok(
        p.changes.length === 4 && p.changes.every(([en, es]) => en && es && en !== es),
        `${t.id} L${p.level}: changes are bilingual`,
      );
  }
});

test("starters are the first words of a frame", () => {
  assert.equal(
    starterOf("I claim that mulch ___ soil erosion on a slope."),
    "I claim that mulch …",
  );
  assert.equal(starterOf("First, ___ went to ___."), "First, ___ went to …");
  assert.ok(!starterOf("Therefore, we should ___.").includes("undefined"));
});

test("the link carries a level number and a fixed focus, never a name or free text", () => {
  const u = new URL(
    leveledLink(
      "https://thelanguagepage.com",
      "/access-practice-lab",
      "6-8",
      "wrt-mulch-cer",
      2,
      "evidence",
    ),
  );
  assert.equal(u.pathname, "/access-practice-lab/write/wrt-mulch-cer");
  assert.deepEqual([...u.searchParams.keys()].sort(), ["focus", "grades", "level"]);
  assert.equal(u.searchParams.get("level"), "2");
  assert.ok(!new URL(leveledLink("https://x", "/b", "3-5", "t", 9)).searchParams.has("level"));
});

test("the page and the sheets describe a level without calling it a WIDA score", () => {
  const t = tasks.find((x) => x.id === "wrt-mulch-cer");
  const pieces = [];
  for (const n of WRITE_LEVELS) {
    const p = levelPlan(t, n);
    pieces.push(
      text(levelBannerHTML(I, p)),
      text(levelSupportsHTML(I, t, p)),
      text(levelSheetHTML(I, ctx, t, p)),
    );
  }
  pieces.push(text(teacherLevelsHTML(I, ctx, t)), text(levelsGlanceHTML(I, ctx, t)));
  const learner = [];
  for (const n of WRITE_LEVELS) {
    const p = levelPlan(t, n);
    learner.push(
      text(levelBannerHTML(I, p)),
      text(levelSupportsHTML(I, t, p)),
      text(levelSheetHTML(I, ctx, t, p)),
    );
  }
  assert.ok(
    !/Entering|Emerging|Developing|Expanding|Bridging|Reaching/.test(learner.join("\n")),
    "a learner sees a number, never a level name",
  );
  assert.ok(
    /Entering/.test(text(teacherLevelsHTML(I, ctx, t))),
    "the teacher sees the level names",
  );
  const all = pieces.join("\n");
  assert.ok(all.includes("not an official WIDA proficiency level"), "the note is shown");
  assert.ok(LEVEL_NOTE[1].toLowerCase().includes("no es un nivel oficial"));
  assert.ok(
    !/WIDA (level|score|proficiency level) \d|your WIDA level|ACCESS score/i.test(all),
    "never read as an official level",
  );
  assert.ok(!/<script|undefined|\[object/i.test(all), "no stray markup or undefined");
});

test("what each level shows on the student page", () => {
  const t = tasks.find((x) => x.id === "wrt-mulch-cer");
  const sup = (n) => text(levelSupportsHTML(I, t, levelPlan(t, n)));
  assert.match(sup(1), /Sentence frames/);
  assert.match(sup(1), /lang="es"/, "Spanish glosses beside the words");
  assert.match(sup(1), /model response/i);
  assert.match(sup(1), /Directions in Spanish/);
  assert.match(sup(3), /Sentence starters/);
  assert.ok(!/model response/i.test(sup(3)));
  assert.match(sup(4), /plan outline/i);
  assert.match(sup(5), /no frames or word bank/i);
  assert.ok(!/Sentence (frames|starters)/.test(sup(5)));
  assert.ok(!/Directions in Spanish/.test(sup(6)));
});

test("the printed sheet gives writing lines that scale with the level", () => {
  const t = tasks.find((x) => x.id === "wrt-printing-press-essay");
  const l1 = linesFor(levelPlan(t, 1));
  const l6 = linesFor(levelPlan(t, 6));
  assert.ok(l1 >= 5 && l6 <= 18 && l1 < l6);
  const sheet = text(levelSheetHTML(I, ctx, t, levelPlan(t, 1)));
  assert.equal(
    (sheet.match(/class="sheet-line"/g) || []).length,
    l1 + 2,
    "writing lines plus the name and date lines",
  );
});
