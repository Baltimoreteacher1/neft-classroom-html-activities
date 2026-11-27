// Create "source" adapters for Language Page views (batch a): each new family extracts a real source item into a valid
// draft, a known word or question from the raw source survives, and the view's route resolves to a ref the family lists.
//   node --test tools/create-adapters-a.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { capabilityFor } from "../access-practice-lab/src/create/routes.js";
import { adapterFor, customizeFrom } from "../access-practice-lab/src/studio/adapters/registry.js";
import { checkResponse } from "../access-practice-lab/src/studio/core/check.js";
import { fetchJson, ROOT } from "./studio-customize-adapters-helpers.mjs";

const read = (rel) => JSON.parse(readFileSync(join(ROOT, "access-practice-lab", rel), "utf8"));
const deps = { fetchJson, now: 1, newId: () => "sa1b2c3d4e5" };
const questions = (a) => a.blocks.filter((b) => b.type === "question");
const allText = (a) => JSON.stringify(a.blocks);

async function made(family, ref) {
  const r = await customizeFrom(family, ref, deps);
  assert.deepEqual(r.validation.errors, [], `${family}/${ref}: validation errors`);
  assert.equal(r.activity.lineage.family, family);
  return r.activity;
}

/** The route resolves to this family and ref, and the family lists that ref. */
async function resolvesTo(route, search, family, ref) {
  const cap = capabilityFor(route, search);
  assert.equal(cap.disposition, "source", `${route.view}: disposition ${cap.disposition}`);
  assert.deepEqual(cap.source, { family, ref });
  const listed = await adapterFor(family).list({ fetchJson });
  assert.ok(
    listed.some((l) => l.id === ref),
    `${family}: ${ref} is not in the listing`,
  );
}

test("lab-activity: an activity keeps its key, its vocabulary Spanish, and resolves from /<Domain>/<level>/<id>", async () => {
  const a = await made("lab-activity", "g1-l-a-hear-cat");
  const [q] = questions(a);
  assert.equal(q.format, "choice");
  assert.equal(q.options.find((o) => o.id === q.answer).text, "cat");
  assert.equal(checkResponse(q, q.answer).status, "correct");
  const vocab = a.blocks.find((b) => b.type === "vocab");
  assert.ok(vocab.items.some((v) => v.term === "cat" && v.es.startsWith("gato")));
  assert.ok(
    a.blocks.some((b) => b.type === "audio" && /meow/.test(b.say)),
    "listening script carried",
  );
  await resolvesTo(
    { view: "activity", domain: "Listening", level: "A", id: "g1-l-a-hear-cat" },
    "",
    "lab-activity",
    "g1-l-a-hear-cat",
  );
  assert.equal(
    capabilityFor({ view: "play" }).disposition,
    "excluded",
    "the playlist player stays student-only",
  );
});

test("access-prep: every skill's set extracts; a notes set keeps its main-idea key; the route resolves", async () => {
  for (const skill of [
    "notes",
    "data-talk",
    "raters-eye",
    "word-meanings",
    "text-structures",
    "task-words",
    "daily-drill",
    "extempore-speak",
  ]) {
    const set = read(`content/prep/${skill}.json`)["6-8"][0];
    const a = await made("access-prep", `${skill}/${set.id}`);
    assert.ok(questions(a).length >= 3, `${skill}: ${questions(a).length} questions`);
  }
  const set = read("content/prep/notes.json")["6-8"][0];
  const a = await made("access-prep", `notes/${set.id}`);
  const main = questions(a).find((q) => q.id === "main");
  assert.equal(main.answer, set.notes.main);
  await resolvesTo(
    { view: "access-prep", id: "notes", setId: set.id },
    "",
    "access-prep",
    `notes/${set.id}`,
  );
  assert.equal(
    capabilityFor({ view: "access-prep", id: "", setId: "" }).disposition,
    "hub",
    "the prep hub is a picker",
  );
});

test("grammar-packs: every item keeps its key and its Spanish why-line; /grammar/<n> resolves", async () => {
  const pack = read("content/grammar/packs.json").packs[0];
  const a = await made("grammar-packs", "1");
  const qs = questions(a);
  assert.equal(qs.length, pack.diagnostic.length + pack.practice.length);
  const first = pack.practice[0];
  const q = qs[pack.diagnostic.length];
  assert.equal(q.options.find((o) => o.id === q.answer).text, first.choices[first.answer]);
  assert.ok(q.explanation.includes(first.why.es), "Spanish why-line carried");
  await resolvesTo({ view: "grammar", id: "1" }, "", "grammar-packs", "1");
  assert.equal(capabilityFor({ view: "grammar", id: "" }).disposition, "hub");
});

test("claim-check: the wrong line, the card kinds and the correct statement are the case's own", async () => {
  const { caseById } = await import("../access-practice-lab/src/claimcheck/engine.js");
  const c = caseById("m35-perimeter");
  const a = await made("claim-check", c.id);
  const find = questions(a).find((q) => q.id === "find");
  assert.equal(find.answer, `l${c.flawed + 1}`);
  const fix = questions(a).find((q) => q.id === "fix");
  assert.equal(fix.options.find((o) => o.id === fix.answer).text, c.fix.find((f) => f.correct).en);
  await resolvesTo({ view: "claim-check", id: c.id }, "", "claim-check", c.id);
});

test("argument-arena: each evidence card sorts to its own side; /arena/<id> resolves", async () => {
  const { TOPICS } = await import("../access-practice-lab/src/content/craft-arena.js");
  const tp = TOPICS[0];
  const a = await made("argument-arena", tp.id);
  const sort = questions(a).find((q) => q.format === "sort");
  const label = (id) => sort.categories.find((c) => c.id === id).label;
  tp.cards.forEach((card, i) =>
    assert.equal(label(sort.items[i].category), tp.stance[card.side].en),
  );
  await resolvesTo({ view: "arena", id: tp.id }, "", "argument-arena", tp.id);
});

test("choice-boards: nine open tasks with their frames; resolves only when the address names a band", async () => {
  const board = read("content/choice-boards.json").bands["6-8"].Argue;
  const a = await made("choice-boards", "6-8-argue");
  const qs = questions(a);
  assert.equal(qs.length, board.squares.length);
  assert.ok(
    qs.every((q) => q.format === "short"),
    "no invented keys",
  );
  assert.equal(qs[0].frame, board.squares[0].frame[0]);
  await resolvesTo(
    { view: "choice-boards", id: "argue", grades: "6-8" },
    "",
    "choice-boards",
    "6-8-argue",
  );
  assert.equal(
    capabilityFor({ view: "choice-boards", id: "argue", grades: "" }).disposition,
    "hub",
  );
});

test("language-city: steps keep their keys; build steps order the accepted sentence; episodes are not sources", async () => {
  const { missionOf } = await import("../access-practice-lab/src/content/city.js");
  const m = missionOf("cafe", "order-lunch");
  const a = await made("language-city", "cafe/order-lunch");
  const menu = questions(a)[0];
  const step = m.steps[0];
  assert.equal(
    menu.options.find((o) => o.id === menu.answer).text,
    step.opts.find((o) => o.id === step.answer).en,
  );
  const build = questions(a).find((q) => q.format === "order");
  const ok = m.steps.find((s) => s.kind === "build").ok[0];
  assert.deepEqual(
    build.items.map((i) => i.text),
    ok,
  );
  await resolvesTo(
    { view: "city", id: "cafe", missionId: "order-lunch" },
    "",
    "language-city",
    "cafe/order-lunch",
  );
  assert.equal(
    capabilityFor({ view: "city", id: "market", missionId: "community-market" }).disposition,
    "hub",
  );
});

test("communication: the best message is the key and the shift parts sort as authored", async () => {
  const { scenarioById } = await import("../access-practice-lab/src/content/communication.js");
  const sc = scenarioById("teacher-or-friend-35");
  const a = await made("communication", sc.id);
  const cmp = questions(a).find((q) => q.id === "compare");
  assert.equal(
    cmp.options.find((o) => o.id === cmp.answer).text,
    sc.versions.find((v) => v.best).text,
  );
  const sort = questions(a).find((q) => q.format === "sort");
  assert.equal(sort.items.length, sc.shift.items.length);
  await resolvesTo({ view: "communication", id: sc.id }, "", "communication", sc.id);
});

test("exhibition: the evidence key is the exhibition's sentence; the band comes from the address", async () => {
  const { EXHIBITIONS } = await import("../access-practice-lab/src/content/exhibition.js");
  const ex = EXHIBITIONS["6-8"];
  const a = await made("exhibition", "6-8");
  const ev = ex.tasks.read.questions.find((q) => q.kind === "evidence");
  const q = questions(a).find((x) => x.prompt === ev.prompt);
  assert.equal(q.answer, `s${ev.answer + 1}`);
  await resolvesTo({ view: "exhibition", id: "read", grades: "6-8" }, "", "exhibition", "6-8");
  await resolvesTo({ view: "exhibition", id: "", grades: "4-5" }, "", "exhibition", "3-5");
  assert.equal(capabilityFor({ view: "exhibition", id: "", grades: "" }).disposition, "hub");
});

test("adventures: relevant clues are the multi key, order items keep authored order; the route resolves", async () => {
  const { worldById } = await import("../access-practice-lab/src/adventures/worlds/index.js");
  const scenes = worldById("mystery-museum").missions[0].bands["6-8"];
  const a = await made("adventures", "mystery-museum/the-empty-case/6-8");
  const clues = scenes.find((s) => s.kind === "clues");
  const multi = questions(a).find((q) => q.format === "multi");
  assert.equal(multi.answers.length, clues.clues.filter((c) => c.relevant).length);
  assert.ok(allText(a).includes("Harbor Star Compass"));
  await resolvesTo(
    { view: "adventures", worldId: "mystery-museum", missionId: "the-empty-case", grades: "6-8" },
    "",
    "adventures",
    "mystery-museum/the-empty-case/6-8",
  );
});

test("error-detective, conversation, construction, dialogue studio, sentence architect: content survives, routes resolve", async () => {
  const patterns = read("content/detective/patterns.json").patterns;
  const det = await made("error-detective", "sv-agree-3sg");
  assert.ok(questions(det)[0].prompt.includes(patterns["sv-agree-3sg"].practice[0].broken));
  assert.equal(questions(det)[0].sample, patterns["sv-agree-3sg"].practice[0].fixed[0]);
  await resolvesTo(
    { view: "detective", id: "sv-agree-3sg" },
    "",
    "error-detective",
    "sv-agree-3sg",
  );

  const conv = await made("conversation-sim", "ecosystem-debate");
  assert.ok(
    questions(conv)[0]
      .options.find((o) => o.id === questions(conv)[0].answer)
      .text.includes("indirect"),
  );
  await resolvesTo(
    { view: "conversation", scenarioId: "" },
    "",
    "conversation-sim",
    "ecosystem-debate",
  );

  const lab = await made("construction-lab", "lab");
  assert.ok(allText(lab).includes("Glaciers melt."));
  await resolvesTo({ view: "construction" }, "", "construction-lab", "lab");

  const studio = await made("dialogue-studio", "studio");
  assert.ok(
    studio.blocks
      .find((b) => b.type === "vocab")
      .items.some((v) => v.term === "observe" && v.es === "observar"),
  );
  await resolvesTo({ view: "dialogue-studio" }, "", "dialogue-studio", "studio");

  const arch = await made("sentence-architect", "studio");
  assert.ok(allText(arch).includes("The seed grew."));
  await resolvesTo({ view: "architect" }, "", "sentence-architect", "studio");
});

test("the batch-a views that are not sources say why", () => {
  for (const v of [
    "collection",
    "growth",
    "explore",
    "guided-units",
    "early",
    "flashcards",
    "bridge",
    "evidence",
  ])
    assert.equal(capabilityFor({ view: v }).disposition, "hub", v);
  assert.equal(capabilityFor({ view: "demand" }).disposition, "workspace");
  for (const v of ["diagnostic", "games", "goals"]) {
    const cap = capabilityFor({ view: v });
    assert.equal(cap.disposition, "excluded", v);
    assert.equal(cap.tray, false, v);
  }
});
