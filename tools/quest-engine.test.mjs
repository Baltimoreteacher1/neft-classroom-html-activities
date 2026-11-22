// Language Quest engine rules, in node: the deterministic parts that decide what a learner sees. No browser.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import {
  checkCompare,
  checkSort,
  checkTimeline,
  checkWriting,
  dialogueCompose,
  dialogueEnded,
  dialogueOptions,
  dialogueProblems,
  dialogueStart,
  dialogueStep,
  isRevision,
  itemDone,
  missionProgress,
  parseDirections,
  pickEnding,
  requiredMet,
  runCityModel,
  validateMission,
  walkRoute,
  wordDiff,
} from "../access-practice-lab/src/quest/engine.js";
import { filterCatalog, recommend, suggestRung } from "../access-practice-lab/src/quest/pathway.js";
import {
  createdCounts,
  familySummary,
  familyText,
  teacherEvidence,
} from "../access-practice-lab/src/quest/summary.js";

const DIR = new URL("../access-practice-lab/content/quest/", import.meta.url);
const worlds = JSON.parse(readFileSync(new URL("worlds.json", DIR))).worlds;
const characters = JSON.parse(readFileSync(new URL("characters.json", DIR))).characters;
const missions = readdirSync(new URL("missions/", DIR)).map((f) =>
  JSON.parse(readFileSync(new URL(`missions/${f}`, DIR))),
);
const byId = Object.fromEntries(missions.map((m) => [m.id, m]));
const item = (m, id) => m.stages.flatMap((s) => s.items).find((i) => i.id === id);

test("every shipped mission passes the schema, including both grade bands and all nine worlds", () => {
  for (const m of missions)
    assert.deepEqual(
      validateMission(m, {
        worlds: worlds.map((w) => w.id),
        characters: characters.map((c) => c.id),
      }),
      [],
      m.id,
    );
  assert.ok(missions.some((m) => m.band === "3-5") && missions.some((m) => m.band === "6-8"));
  assert.deepEqual(new Set(missions.map((m) => m.world)), new Set(worlds.map((w) => w.id)));
});

test("the validator refuses a mission with no student production, a dead dialogue flag and a broken route", () => {
  const m = structuredClone(byId["mf-missing-prototype"]);
  m.stages = m.stages.map((s) => ({
    ...s,
    items: s.items.filter((i) => !["write", "speak"].includes(i.kind)),
  }));
  assert.ok(
    validateMission(m, { worlds: ["mystery-files"], characters: ["investigator"] }).some((p) =>
      /production/.test(p),
    ),
  );
  const d = structuredClone(byId["mf-missing-prototype"]);
  item(d, "ask-pell").needFlags.push("never-set");
  assert.ok(
    validateMission(d, { worlds: ["mystery-files"], characters: ["investigator"] }).some((p) =>
      /never-set/.test(p),
    ),
  );
  const r = structuredClone(byId["eg-the-lost-compass"]);
  item(r, "route").solution = ["E", "E", "E"];
  assert.ok(
    validateMission(r, { worlds: ["explorers-guild"], characters: ["storyteller"] }).some((p) =>
      /does not reach the goal/.test(p),
    ),
  );
});

test("writing checklists look for words and shape, honour self-declared checks, and never judge ideas", () => {
  const claim = item(byId["mf-missing-prototype"], "claim");
  const text =
    "I think the sticky note and the badge log show it was moved because the note says so. ".repeat(
      4,
    );
  const res = checkWriting(text, claim.checks, {
    clueTerms: { note: ["sticky note"], badge: ["badge log"] },
  });
  assert.ok(requiredMet(res));
  assert.ok(res.find((r) => r.id === "clues").found.length === 2);
  const weak = checkWriting("It was moved.", claim.checks, {
    clueTerms: { note: ["sticky note"] },
  });
  assert.ok(!requiredMet(weak));
  const forgiven = checkWriting(
    "It was moved.",
    claim.checks,
    { clueTerms: { note: ["sticky note"] } },
    ["len", "clues", "why"],
  );
  assert.ok(requiredMet(forgiven) && forgiven.find((r) => r.id === "len").selfDeclared);
  assert.ok(checkWriting('Ann said, "Hello there friend."', [{ id: "q", kind: "quote" }])[0].met);
  assert.ok(checkWriting("Did anyone see it?", [{ id: "q", kind: "question" }])[0].met);
  assert.ok(
    !checkWriting("This is a disaster.", [{ id: "a", kind: "avoid", terms: ["disaster"] }])[0].met,
  );
});

test("a revision needs a real change in words, not length", () => {
  assert.equal(wordDiff("The cat sat.", "The cat sat."), 0);
  assert.equal(wordDiff("The cat sat.", "The big cat sat down."), 2);
  assert.ok(!isRevision("one two three four", "one two three four five six", 3));
  assert.ok(isRevision("one two three four", "one two five six", 2) === true);
});

test("the dialogue machine is deterministic, gated by flags, and routes written questions by visible words", () => {
  const def = item(byId["mf-missing-prototype"], "ask-pell").dialogue;
  assert.deepEqual(dialogueProblems(def), []);
  let st = dialogueStart(def);
  assert.ok(
    !dialogueOptions(def, st).some((o) => o.id === "q-done"),
    "the closing option is hidden until the needed questions are asked",
  );
  st = dialogueStep(def, st, "q-alarm");
  st = dialogueStep(def, st, "back");
  assert.ok(
    !dialogueOptions(def, st).some((o) => o.id === "q-alarm"),
    "a once-only question is not offered again",
  );
  assert.equal(dialogueStep(def, st, "no-such-option"), st);
  st = dialogueCompose(def, st, "Did anyone leave carrying a box?");
  assert.ok(st.flags.includes("asked-bag") && st.composed === 1);
  st = dialogueStep(def, st, "back");
  st = dialogueStep(def, st, "q-done");
  assert.ok(dialogueEnded(def, st) && st.flags.includes("ready"));
  const lost = dialogueCompose(
    def,
    dialogueStep(def, dialogueStart(def), "q-who") && dialogueStart(def),
    "Purple elephants?",
  );
  assert.equal(lost.node, "unsure");
});

test("sort, compare and timeline hint at a miss but never state the answer", () => {
  const sortItem = item(byId["mf-missing-prototype"], "sort-oi");
  const wrong = Object.fromEntries(
    sortItem.cards.map((c) => [c.id, c.cat === "obs" ? "inf" : "obs"]),
  );
  const r = checkSort(sortItem, wrong);
  assert.ok(!r.done && r.rows.every((x) => x.hint && !JSON.stringify(x).includes('"cat"')));
  const right = Object.fromEntries(sortItem.cards.map((c) => [c.id, c.cat]));
  assert.ok(checkSort(sortItem, right).done);
  const cmp = item(byId["mf-missing-prototype"], "compare");
  const ratings = Object.fromEntries(
    cmp.options.flatMap((o) =>
      cmp.evidence.map((e) => [`${o.id}.${e.id}`, cmp.matrix[o.id][e.id]]),
    ),
  );
  assert.ok(checkCompare(cmp, ratings, "e3").done);
  assert.ok(!checkCompare(cmp, ratings, "").done, "a choice is required");
  assert.ok(!checkCompare(cmp, {}, "e3").done);
  const tl = item(byId["hp-the-bell-of-port-alder"], "timeline");
  const order = [...tl.events].sort((a, b) => a.order - b.order).map((e) => e.id);
  assert.ok(checkTimeline(tl, order).done);
  assert.ok(!checkTimeline(tl, [...order].reverse()).done);
});

test("Kai walks exactly the written directions and says where it stopped", () => {
  const grid = item(byId["eg-the-lost-compass"], "route").grid;
  const text =
    "First, walk east 2 steps. Next, walk north 2 steps. Then walk east 2 steps across the bridge. After that, walk north 2 steps. Finally, walk east 1 step.";
  assert.deepEqual(parseDirections(text), ["E", "E", "N", "N", "E", "E", "N", "N", "E"]);
  assert.ok(walkRoute(grid, parseDirections(text)).reached);
  const river = walkRoute(grid, ["E", "E", "E", "E"]);
  assert.ok(!river.reached && river.failed === "blocked" && river.step === 3);
  assert.deepEqual(
    parseDirections("Go to the left, then right."),
    [],
    "relative words are not read",
  );
  assert.equal(walkRoute(grid, ["W"]).failed, "edge");
});

test("the city model is plain arithmetic over the table on screen", () => {
  const m = item(byId["sc-city-needs-a-plan"], "plan").model;
  assert.deepEqual(runCityModel(m, ["trees", "roofs"]).metrics, { temp: 90, energy: 90 });
  assert.ok(runCityModel(m, ["trees", "roofs"]).withinBudget);
  assert.ok(!runCityModel(m, ["roads", "ac"]).withinBudget);
  assert.equal(
    runCityModel(m, ["trees", "park"]).metrics.temp,
    89,
    "the trees and park interaction applies once",
  );
  assert.equal(
    runCityModel(m, ["roads"]).metrics.temp,
    96.5,
    "a project that adds heat raises the temperature",
  );
});

test("endings respond to the learner's choices and revisions, not to which side they took", () => {
  const m = byId["mf-missing-prototype"];
  const run = (choice, revised) => ({
    items: { compare: { choice }, ...(revised ? { "revise-claim": { versions: [{}, {}] } } : {}) },
  });
  assert.equal(pickEnding(m, run("e3", true)).id, "moved-revised");
  assert.equal(pickEnding(m, run("e3", false)).id, "moved");
  assert.equal(pickEnding(m, run("e1", true)).id, "window");
  const d = byId["dc-the-great-debate"];
  const e1 = pickEnding(d, {
    items: {
      side: { picked: ["garden"], flags: ["side-garden"] },
      respond: { versions: [{}, {}] },
    },
  });
  const e2 = pickEnding(d, {
    items: { side: { picked: ["court"], flags: ["side-court"] }, respond: { versions: [{}, {}] } },
  });
  assert.equal(e1.id, e2.id, "the debate ending does not depend on the side chosen");
  const city = byId["sc-city-needs-a-plan"];
  const cool = pickEnding(city, {
    items: {
      plan: {
        result: { metrics: runCityModel(item(city, "plan").model, ["trees", "roofs"]).metrics },
      },
    },
  });
  const hot = pickEnding(city, {
    items: {
      plan: { result: { metrics: runCityModel(item(city, "plan").model, ["roads"]).metrics } },
    },
  });
  assert.deepEqual([cool.id, hot.id], ["cooler", "hotter"]);
});

test("completion needs real work: nothing is done until its own rule is met", () => {
  const m = byId["mf-missing-prototype"];
  assert.ok(!missionProgress(m, { items: {} }).complete);
  assert.ok(!itemDone(item(m, "inspect"), { marks: { window: "yes" } }));
  assert.ok(
    itemDone(item(m, "inspect"), {
      marks: Object.fromEntries(["a", "b", "c", "d", "e"].map((k) => [k, "yes"])),
    }),
  );
  assert.ok(!itemDone(item(m, "claim"), { draft: "lots of text but never finished" }));
  assert.ok(
    !itemDone(item(m, "present"), { typed: "words ".repeat(50) }),
    "typed text alone does not finish a speaking item",
  );
});

test("the support ladder fades only after two strong tries, holds after help, and respects the teacher", () => {
  const strong = { rung: "frame", help: false, hints: 0, requiredMet: true, revised: true };
  assert.equal(suggestRung([]).rung, "frame");
  assert.equal(suggestRung([strong]).rung, "frame", "one strong try is not enough");
  assert.equal(suggestRung([strong, strong]).rung, "partial");
  assert.equal(
    suggestRung([strong, { ...strong, help: true }]).rung,
    "frame",
    "help holds the rung",
  );
  assert.equal(
    suggestRung([
      { ...strong, help: true },
      { ...strong, help: true },
    ]).rung,
    "model",
    "help twice in a row adds support",
  );
  assert.equal(suggestRung([strong, strong], { fade: false }).rung, "frame");
  assert.equal(suggestRung([strong, strong], { pin: "cue" }).rung, "cue");
});

test("recommendations carry their reasons and never rank by a score of ability", () => {
  const prog = {
    "mf-missing-prototype": { runs: [{ rung: "independent", help: false, at: "2026-11-01" }] },
  };
  const recs = recommend({ missions, band: "6-8", prog, teacher: { objectives: ["Argue"] } });
  assert.ok(recs.length === 3 && recs.every((r) => r.reasons.length >= 1));
  assert.ok(recs.every((r) => r.mission.band === "6-8"));
  assert.ok(
    !recs.some((r) => r.mission.id === "mf-missing-prototype"),
    "a mission finished on my own is not suggested",
  );
  assert.ok(recs.some((r) => r.reasons.some((x) => /teacher/i.test(x.en))));
  const text = JSON.stringify(recs.map((r) => r.reasons));
  assert.ok(!/(level|score|proficien|WIDA)/i.test(text));
});

test("the teacher catalog filters by band, skill, function, world and words", () => {
  assert.equal(
    filterCatalog(missions, { band: "3-5" }).length,
    missions.filter((m) => m.band === "3-5").length,
  );
  assert.ok(
    filterCatalog(missions, { domain: "Listening" }).every((m) => m.domains.includes("Listening")),
  );
  assert.ok(filterCatalog(missions, { fn: "Argue" }).length >= 2);
  assert.deepEqual(
    filterCatalog(missions, { q: "prototype" }).map((m) => m.id),
    ["mf-missing-prototype"],
  );
  assert.deepEqual(filterCatalog(missions, { world: "word-forge" }).length, 2);
});

test("family summaries are bilingual, include none of the learner's words by default, and never name a level", () => {
  const m = byId["mf-missing-prototype"];
  const run = {
    rung: "frame",
    items: {
      claim: {
        versions: [
          { text: "My private sentence about the note." },
          { text: "My private sentence about the note and more." },
        ],
      },
      "revise-claim": { versions: [{ text: "a" }, { text: "b" }] },
    },
  };
  const sum = familySummary(m, run);
  assert.ok(sum.practiced.en && sum.practiced.es && sum.talk.es && sum.vocab.every((v) => v.es));
  const en = familyText(sum, "en");
  const es = familyText(sum, "es");
  assert.ok(!en.includes("private sentence") && !es.includes("private sentence"));
  assert.ok(
    familyText(
      familySummary(m, run, { includeSentence: "My private sentence about the note." }),
      "en",
    ).includes("private sentence"),
    "included only when chosen",
  );
  assert.ok(!/(level|WIDA|score)/i.test(en));
  assert.deepEqual(createdCounts(m, run), { writes: 1, speaks: 0, revisions: 1 });
});

test("teacher evidence gives the response, revision history, supports and a next step", () => {
  const m = byId["mf-missing-prototype"];
  const run = {
    rung: "cue",
    helpUsed: true,
    hints: 2,
    items: {
      claim: {
        versions: [
          { text: "first", met: ["len"] },
          { text: "second", met: ["len", "why"] },
        ],
      },
      present: { typed: "typed rehearsal text" },
    },
  };
  const ev = teacherEvidence(m, run);
  assert.equal(ev.work.find((w) => w.id === "claim").versions.length, 2);
  assert.ok(
    ev.work.find((w) => w.id === "present").typedRehearsal,
    "typed practice is labelled typed rehearsal",
  );
  assert.ok(ev.help && ev.hints === 2 && ev.nextStep.en && ev.nextStep.es);
});

test("a check item must teach: a 'why', distinct options and specific feedback on every wrong option", async () => {
  const { readFileSync } = await import("node:fs");
  const { validateMission } = await import("../access-practice-lab/src/quest/engine.js");
  const dir = "access-practice-lab/content/quest/";
  const mission = JSON.parse(readFileSync(`${dir}missions/wf-word-forge-35.json`, "utf8"));
  const world = JSON.parse(readFileSync(`${dir}worlds.json`, "utf8")).worlds.map((w) => w.id);
  const chars = JSON.parse(readFileSync(`${dir}characters.json`, "utf8")).characters.map(
    (c) => c.id,
  );
  const ctx = { worlds: world, characters: chars };
  assert.deepEqual(validateMission(mission, ctx), []);
  const bad = structuredClone(mission);
  const item = bad.stages.flatMap((s) => s.items).find((i) => i.kind === "check");
  delete item.why;
  item.options[1].label = item.options[0].label;
  item.options.find((o) => o.id !== item.answer).fb = "Look again.";
  const problems = validateMission(bad, ctx).join("\n");
  assert.match(problems, /needs a "why"/);
  assert.match(problems, /different from each other/);
  assert.match(problems, /must say what to look at/);
});
