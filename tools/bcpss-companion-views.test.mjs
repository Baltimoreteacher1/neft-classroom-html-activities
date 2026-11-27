// BCPSS Plan & Respond view modules (text, word cards, labs, practice, transform, projects, stations, warm-up),
// exercised over EVERY unit the seed backend serves. Pure builders are checked directly; every view's render() is run for
// every unit at every support level and must return markup with no unresolved "undefined" or "[object" text.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCatalog, GROUPS, PURPOSES } from "../bcpss-teachers/companion/companion-data.js";
import { conceptCard, conceptDoc } from "../bcpss-teachers/companion/concept-cards.js";
import { buildDayPlan, dayPlanDoc } from "../bcpss-teachers/companion/day-plan.js";
import { cluesFor } from "../bcpss-teachers/companion/guess-game.js";
import {
  causeOptions,
  cerCheck,
  joinSentence,
  labDoc,
  labsFor,
  mentorChunks,
  ratioModel,
} from "../bcpss-teachers/companion/labs.js";
import { buildPracticePack, practiceDoc } from "../bcpss-teachers/companion/practice.js";
import { buildProject, projectDoc } from "../bcpss-teachers/companion/projects.js";
import { buildStations, stationsDoc, warmupDoc } from "../bcpss-teachers/companion/reserve.js";
import {
  evidenceIndex,
  readingDoc,
  readingSource,
  stopPrompt,
} from "../bcpss-teachers/companion/text-companion.js";
import { transformDoc, transformText } from "../bcpss-teachers/companion/transform.js";
import { paragraphs, sentences, shuffle } from "../bcpss-teachers/companion/util.js";
import { NEW_VIEWS } from "../bcpss-teachers/companion/views-registry.js";
import {
  activityBars,
  activityStats,
  chainFlow,
  rotationSvg,
  sentenceStrip,
  vennData,
  vennSvg,
} from "../bcpss-teachers/companion/visuals.js";
import { GRADES, getUnitDetail, listUnits, SUBJECTS } from "../functions/_lib/bcpss/db.js";

const all = [];
for (const g of GRADES)
  for (const s of SUBJECTS)
    for (const u of (await listUnits({}, g, s)).units)
      all.push((await getUnitDetail({}, u.id)).detail);
const byId = new Map(all.map((d) => [d.unit.id, d]));
const LEVELS = ["1_2", "3_4", "5_6"];
const clean = (html, where) => {
  assert.equal(typeof html, "string", where);
  assert.ok(html.length > 40, `${where}: empty markup`);
  assert.doesNotMatch(html, /undefined|\[object|NaN|null</, where);
};

test("registry: unique ids, known groups, every view renders for every unit at every level", () => {
  const groups = new Set(GROUPS.map((g) => g.id));
  const ids = new Set();
  for (const v of NEW_VIEWS) {
    assert.ok(!ids.has(v.id), `duplicate view ${v.id}`);
    ids.add(v.id);
    assert.ok(groups.has(v.group), `${v.id}: unknown group ${v.group}`);
    assert.equal(typeof v.render, "function");
    assert.equal(typeof v.act, "function");
    assert.ok(v.label && v.hint);
  }
  assert.equal(NEW_VIEWS.length, 10);
  for (const detail of all)
    for (const level of LEVELS)
      for (const v of NEW_VIEWS) {
        const st = { level, vs: {}, unitId: detail.unit.id, ctx: { detail } };
        clean(v.render(st, detail), `${detail.unit.id} ${level} ${v.id}`);
      }
});

test("catalog: every new view has a local item, every view target exists", () => {
  const views = new Set([...NEW_VIEWS.map((v) => v.id), "map", "build", "check", "reteach"]);
  for (const detail of all) {
    for (const item of buildCatalog(detail, "3_4").filter((i) => i.type === "local"))
      assert.ok(views.has(item.view), `${detail.unit.id}: ${item.id} -> unknown view ${item.view}`);
    const ids = buildCatalog(detail, "3_4").map((i) => i.id);
    for (const need of [
      "local-text",
      "local-labs",
      "local-words",
      "local-practice",
      "local-stations",
      "local-transform",
      "local-projects",
    ])
      assert.ok(ids.includes(need), `${detail.unit.id}: missing ${need}`);
  }
  assert.ok(PURPOSES.length >= 9);
});

test("util: sentences keep abbreviations, shuffle is deterministic and never the identity", () => {
  assert.deepEqual(sentences("Dr. Lee lives in the U.S. now. She likes it."), [
    "Dr. Lee lives in the U.S. now.",
    "She likes it.",
  ]);
  assert.equal(paragraphs("One. Two.\n\nThree.").length, 2);
  assert.deepEqual(shuffle([1, 2, 3, 4], "a"), shuffle([1, 2, 3, 4], "a"));
  for (const seed of ["a", "b", "c", "d", "e"])
    assert.notDeepEqual(shuffle([1, 2, 3], seed), [1, 2, 3]);
});

test("text: every unit has a passage at every level, evidence is found in the text for all but a few questions", () => {
  let found = 0;
  let total = 0;
  for (const detail of all)
    for (const level of LEVELS) {
      const src = readingSource(detail, level);
      assert.ok(src?.text && src.title, `${detail.unit.id} ${level}`);
      const sents = sentences(src.text);
      assert.ok(sents.length >= 3, `${detail.unit.id} ${level}: ${sents.length} sentences`);
      for (const q of detail.reading.questions) {
        total++;
        if (evidenceIndex(sents, q.evidence?.[level]) >= 0) found++;
        assert.ok(q.options[q.answer], `${detail.unit.id}: answer index out of range`);
      }
      assert.match(stopPrompt(sents[0], detail.studio.vocab), /^Stop and think/);
      clean(readingDoc(detail, level), `${detail.unit.id} ${level} reading doc`);
    }
  assert.ok(found / total > 0.99, `evidence located for ${found}/${total}`);
});

test("word cards: every term has meaning, example, not-example and a Spanish word", () => {
  for (const detail of all) {
    for (const v of detail.studio.vocab) {
      const c = conceptCard(detail, v.term);
      assert.ok(c.def && c.example && c.nonexample && c.es, `${detail.unit.id} ${v.term}`);
    }
    clean(conceptDoc(detail, false), `${detail.unit.id} filled`);
    clean(conceptDoc(detail, true), `${detail.unit.id} blank`);
  }
});

test("labs: the subject lab and the model-sentence builder work from authored data", () => {
  const m = ratioModel(2, 3, 4, "red", "blue");
  assert.deepEqual(m.rows[3], { times: 4, a: 8, b: 12 });
  assert.deepEqual(m.simplest, [2, 3]);
  assert.deepEqual(ratioModel(4, 6, 2).simplest, [2, 3]);
  for (const detail of all) {
    const labs = labsFor(detail);
    assert.ok(labs.length >= 1 && labs.length <= 2, detail.unit.id);
    assert.ok(mentorChunks(detail).length >= 2, `${detail.unit.id}: fewer than 2 mentor chunks`);
    const joined = mentorChunks(detail)
      .map((c) => c.text)
      .join(" ");
    assert.ok(joined.replace(/\s+/g, " ").length > 10);
    for (const [i, item] of detail.writing.bbs.entries()) {
      for (const c of ["because", "but", "so"]) {
        const s = joinSentence(item, c);
        assert.ok(s.includes(item[c]) && /[.!?]$/.test(s), `${detail.unit.id} ${c}: ${s}`);
      }
      const o = causeOptions(detail, i);
      for (const key of ["because", "so"]) {
        assert.ok(o[key].answer >= 0, `${detail.unit.id} ${key}: answer missing`);
        assert.equal(new Set(o[key].options).size, o[key].options.length);
      }
    }
    const res = cerCheck(
      { change: "light", measure: "light", same: "water", claim: detail.studio.vocab[0].term },
      detail,
    );
    assert.ok(res.notes.length >= 1 && res.used.includes(detail.studio.vocab[0].term));
    clean(labDoc(detail, { lab: "cer", cer: {}, r: {} }, "3_4"), `${detail.unit.id} cer doc`);
    clean(
      labDoc(detail, { lab: "ratio", r: { a: 2, b: 3, k: 2, la: "A", lb: "B" } }, "3_4"),
      `${detail.unit.id} ratio doc`,
    );
  }
});

test("practice: four domains from the unit's own content, no scores or levels", () => {
  for (const detail of all)
    for (const level of LEVELS) {
      const p = buildPracticePack(detail, level);
      assert.ok(p.listening.text && p.listening.keyWords.length >= 1, detail.unit.id);
      assert.ok(p.speaking.frames.length >= 1 && p.speaking.asks.length >= 1);
      assert.ok(p.reading.text && p.reading.questions.length >= 3);
      assert.ok(p.writing.prompt && p.writing.model);
      for (const teacher of [false, true]) {
        const html = practiceDoc(detail, level, teacher);
        clean(html, `${detail.unit.id} ${level} ${teacher}`);
        assert.doesNotMatch(html, /proficiency level|WIDA level|ACCESS item/i, detail.unit.id);
        assert.match(html, /Not an ACCESS test/);
      }
    }
});

test("transform: finds unit words, blanks each once, reports load, and never invents text", () => {
  for (const detail of all) {
    const src = readingSource(detail, "3_4").text;
    const r = transformText(src, detail);
    assert.ok(!r.empty && r.sentences.length >= 3);
    assert.ok(r.found.length >= 1, `${detail.unit.id}: no unit words found in its own passage`);
    assert.equal(r.cloze.bank.length, new Set(r.cloze.bank.map((w) => w.toLowerCase())).size);
    assert.ok(r.load.words > 20 && r.load.average > 0);
    assert.equal(r.sentences.join(" ").replace(/\s+/g, " "), src.replace(/\s+/g, " "));
    clean(transformDoc(detail, r, { chunk: true, words: true, cloze: true }), detail.unit.id);
  }
  const d = byId.get("g6-math-u2");
  assert.equal(transformText("", d).empty, true);
  assert.equal(transformText("My name is Ana. The ratio is 2 to 3.", d).privacy, true);
  assert.equal(transformText("The ratio is 2 to 3.", d).privacy, false);
});

test("projects: a pairing is labelled authored only when the unit authors the link", () => {
  let authored = 0;
  let teacher = 0;
  for (const a of all) {
    const links = a.cross_subject_transfers || [];
    for (const link of links) {
      const b = byId.get(link.unit_id);
      assert.ok(b, `${a.unit.id}: transfer to unknown ${link.unit_id}`);
      const plan = buildProject(a, b, link, "3_4");
      assert.equal(plan.provenance, "authored");
      assert.equal(plan.note, link.cross_subject_bridge_note);
      authored++;
    }
    const other = all.find(
      (b) => b.unit.grade === a.unit.grade && b.unit.subject !== a.unit.subject,
    );
    const plan = buildProject(a, other, null, "5_6");
    assert.equal(plan.provenance, "teacher");
    assert.match(plan.note, /no authored link/);
    assert.equal(plan.strands.length, 2);
    assert.equal(plan.days.length, 5);
    assert.ok(plan.strands.every((s) => s.words.length >= 3 && s.question && s.frame));
    clean(projectDoc(plan, a.unit, true), a.unit.id);
    clean(projectDoc(plan, a.unit, false), a.unit.id);
    teacher++;
  }
  assert.ok(authored > 100 && teacher === 162, `${authored}/${teacher}`);
});

test("stations: every group visits every station once; warm-up has five questions with a key", () => {
  for (const detail of all) {
    for (const n of [3, 4]) {
      const plan = buildStations(detail, "3_4", { n, minutes: 12 });
      assert.equal(plan.stations.length, n);
      assert.equal(plan.groups.length, n);
      for (let g = 0; g < n; g++)
        assert.deepEqual(
          plan.rounds.map((r) => r.cells[g]).sort(),
          Array.from({ length: n }, (_, i) => i),
          `${detail.unit.id}: group ${g} misses a station`,
        );
      for (let r = 0; r < n; r++)
        assert.equal(new Set(plan.rounds[r].cells).size, n, "two groups at one station");
      assert.ok(
        plan.stations.every((s) => s.title && s.mission),
        detail.unit.id,
      );
      clean(stationsDoc(detail.unit, plan), detail.unit.id);
    }
    clean(warmupDoc(detail), detail.unit.id);
  }
});

test("visuals: every diagram draws from the unit's data, is labelled, and stays inside its box", () => {
  for (const detail of all) {
    const stats = activityStats(detail);
    assert.equal(
      stats.reduce((n, r) => n + r.count, 0),
      detail.studio.activities.length,
      detail.unit.id,
    );
    const bars = activityBars(detail);
    assert.match(bars, /role="img" aria-label="Activities in this unit by domain/);
    const plan = buildStations(detail, "3_4", { n: 4 });
    for (let r = 0; r < 4; r++) {
      const svg = rotationSvg(plan, r);
      assert.match(svg, /role="img"/);
      for (const g of plan.groups)
        assert.ok(svg.includes(`Group ${g} is at the`), `${detail.unit.id} round ${r}`);
    }
    const strip = sentenceStrip(6, 2, 4);
    assert.match(strip, /sentence 3 of 6/);
    assert.match(strip, /sentence 5/);
  }
  for (const a of all) {
    const other = all.find(
      (b) => b.unit.grade === a.unit.grade && b.unit.subject !== a.unit.subject,
    );
    const d = vennData(a, other);
    assert.equal(d.left.length + d.both.length, a.studio.vocab.length, a.unit.id);
    assert.equal(d.right.length + d.both.length, other.studio.vocab.length, a.unit.id);
    const svg = vennSvg(a, other, "Explain");
    assert.match(svg, /role="img" aria-label="Venn diagram/);
    // every word drawn inside the 560-wide box: x is within the viewBox and no text is cut mid-word
    for (const m of svg.matchAll(/<text x="(\d+)"/g))
      assert.ok(Number(m[1]) > 60 && Number(m[1]) < 500);
  }
  assert.match(chainFlow({ because: "", event: "E", so: "" }), /<b>\?<\/b>/);
  assert.match(chainFlow({ because: "B", event: "E", so: "S" }), /<b>B<\/b>/);
});

test("guess my word: every word has clues and no clue before the last gives the word away", () => {
  const fold = (x) => x.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  for (const detail of all)
    for (const v of detail.studio.vocab) {
      const clues = cluesFor(v);
      assert.ok(clues.length >= 3, `${detail.unit.id} ${v.term}: ${clues.length} clues`);
      assert.equal(clues.at(-1).label, "First letter");
      for (const c of clues.slice(0, -1))
        assert.ok(!fold(c.text).includes(fold(v.term)), `${detail.unit.id} ${v.term}: "${c.text}"`);
    }
});

test("today's lesson: steps add up to the class length and open real views", () => {
  const views = new Set([...NEW_VIEWS.map((v) => v.id), "map", "build", "check", "reteach"]);
  for (const detail of all)
    for (const minutes of [45, 60]) {
      const plan = buildDayPlan(detail, "3_4", minutes);
      assert.equal(plan.minutes, minutes, `${detail.unit.id} ${minutes}`);
      for (const s of plan.steps) {
        assert.ok(s.title && s.text && s.minutes > 0, `${detail.unit.id} ${s.id}`);
        if (s.view) assert.ok(views.has(s.view), `${detail.unit.id}: unknown view ${s.view}`);
      }
      clean(dayPlanDoc(plan), detail.unit.id);
    }
});
