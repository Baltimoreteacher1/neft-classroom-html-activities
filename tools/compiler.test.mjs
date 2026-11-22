// The Experience Compiler (access-practice-lab/src/compiler/): an instructor's text becomes an editable, valid,
// PLAYABLE simulation. Fixture: the original ecosystem passage (sample-ecosystem.js), Grades 6-8, Science, Explain,
// Speaking + Writing. Everything here runs the real modules: the engine's validateMission and runtime included.
import assert from "node:assert/strict";
import test from "node:test";

import {
  compileExperience,
  ID_RE,
  missionIdFor,
  newExperienceId,
  studentCopy,
} from "../access-practice-lab/src/compiler/compile.js";
import {
  chooseType,
  designConflict,
  designExperience,
  sceneCountFor,
} from "../access-practice-lab/src/compiler/design.js";
import {
  blankInput,
  loadPassages,
  readUpload,
} from "../access-practice-lab/src/compiler/editor-inputs.js";
import { applyOp, OP_TYPES } from "../access-practice-lab/src/compiler/editor-ops.js";
import {
  newPreview,
  previewAct,
  previewAsk,
  previewOpen,
} from "../access-practice-lab/src/compiler/editor-preview.js";
import {
  checkUpload,
  cleanSource,
  extractSource,
  MAX_UPLOAD_BYTES,
  overlap,
} from "../access-practice-lab/src/compiler/extract.js";
import { playScript, reachOutcomes } from "../access-practice-lab/src/compiler/play.js";
import {
  SAMPLE_SETTINGS,
  SAMPLE_TEXT,
  SAMPLE_TITLE,
  sampleInput,
} from "../access-practice-lab/src/compiler/sample-ecosystem.js";
import {
  ASSIGN_ID_RE,
  ASSIGN_PATH_RE,
  assignmentFor,
  DRAFTS_KEY,
  exportDraft,
  importDraft,
  loadDrafts,
  saveDraft,
} from "../access-practice-lab/src/compiler/store.js";
import {
  conditionText,
  MAX_DEF_BYTES,
  standardsFor,
  traceText,
  validateExperience,
} from "../access-practice-lab/src/compiler/validate.js";
import { tokenize } from "../access-practice-lab/src/lang/text.js";
import { ART_IDS, LOOKS } from "../access-practice-lab/src/sim/art.js";
import {
  act,
  newState,
  outcomeOf,
  restore,
  validActions,
} from "../access-practice-lab/src/sim/runtime.js";
import { SCHEMA, validateMission } from "../access-practice-lab/src/sim/schema.js";

const ASSETS = { art: [...ART_IDS], looks: Object.keys(LOOKS) };
const compiled = () => compileExperience(sampleInput(), ASSETS);
const X = extractSource(SAMPLE_TEXT, { title: SAMPLE_TITLE });

test("teacher's evidence rule changes the authored world outcome gate", () => {
  const base = sampleInput();
  const two = compileExperience(
    { ...base, settings: { ...base.settings, worldRule: "compare-two" } },
    ASSETS,
  );
  const one = compileExperience(
    { ...base, settings: { ...base.settings, worldRule: "cite-one" } },
    ASSETS,
  );
  assert.equal(two.ok, true);
  assert.equal(one.ok, true);
  const gate = (result) =>
    result.def.outcomes.find((o) => o.id === "out-backed")?.when.all[1].support[1];
  assert.equal(gate(two), 2);
  assert.equal(gate(one), 1);
});

test("the sample is an original passage of the required size", () => {
  const words = tokenize(SAMPLE_TEXT).length;
  assert.ok(words >= 250 && words <= 350, `${words} words`);
});

// ── extract ──────────────────────────────────────────────────────────────────
test("extract: sentences, concepts, vocabulary, facts with indexes, relations, entities, numbers, objectives", () => {
  assert.equal(X.ok, true);
  assert.equal(X.sentences.length, 25);
  assert.deepEqual(
    X.sentences.map((s) => s.i),
    [...Array(25).keys()],
  );
  const terms = X.concepts.map((c) => c.term);
  for (const t of [
    "algae",
    "oxygen",
    "pond",
    "minnows",
    "herons",
    "nutrients",
    "ecosystem",
    "runoff",
  ])
    assert.ok(terms.includes(t), `concept ${t}`);
  assert.ok(!terms.includes("eat"), "common verbs are not concepts");
  assert.deepEqual(
    X.vocabulary.map((v) => v.term),
    ["ecosystem", "producers", "zooplankton", "food web", "runoff"],
  );
  for (const v of X.vocabulary)
    assert.equal(
      X.sentences[v.from[0]].text,
      v.meaning,
      "a meaning is the defining source sentence",
    );
  // every fact names the sentence it is
  assert.ok(X.facts.length >= 20);
  for (const f of X.facts) assert.equal(X.sentences[f.i].text, f.text);
  assert.deepEqual(X.facts.find((f) => f.i === 16).numbers, ["8", "3"]);
  const causes = X.relations.filter((r) => r.type === "cause");
  const at = (i) => causes.find((c) => c.i === i);
  assert.equal(at(11).marker, "because");
  assert.match(at(11).cause, /algae had more nutrients/);
  assert.match(at(11).effect, /grew much faster/);
  assert.equal(at(13).marker, "so");
  assert.match(at(13).effect, /water plants below it died/);
  assert.equal(at(18).marker, "as a result");
  assert.equal(at(18).causeFrom, 17, "'As a result' points back at the sentence before it");
  assert.match(at(22).cause, /water lost its oxygen/);
  const rival = X.relations.find((r) => r.type === "rival");
  assert.equal(rival.i, 19);
  assert.equal(rival.rebuttal, 20, "the belief is followed by the sentence that answers it");
  assert.ok(X.relations.some((r) => r.type === "evidence" && r.i === 16));
  assert.deepEqual(
    X.entities.map((e) => e.name),
    ["Willow Pond", "Willow Middle School", "Ms. Okafor"],
  );
  assert.deepEqual(X.speakers, [
    { name: "Ms. Okafor", role: "science teacher", sentences: [21, 22] },
  ]);
  assert.ok(X.numbers.some((n) => n.value === "70" && n.unit === "percent" && n.i === 12));
  assert.deepEqual(
    X.objectives.map((o) => o.keyUse),
    ["Explain", "Argue", "Inform"],
  );
});

test("extract: markup is stripped, nothing is executed, uploads are type- and size-checked", async () => {
  const dirty = `<h1>Pond</h1><script>window.hacked = 1</script><style>p{color:red}</style><p onclick="x()">Algae &amp; plants need <b>light</b>.</p><!-- note --><iframe src="x"></iframe>`;
  const clean = cleanSource(dirty, "html");
  assert.equal(clean, "Pond\n\nAlgae & plants need light .".replace(" .", " .").trim());
  assert.doesNotMatch(clean, /hacked|color|onclick|iframe|<|>/);
  assert.doesNotMatch(cleanSource("<script>alert(1)", "html"), /alert/);
  assert.equal(
    cleanSource("# Title\n\n**Bold** and [a link](http://x.test) and `code`.", "md"),
    "Title.\n\nBold and a link and code.",
  );
  assert.doesNotMatch(cleanSource("a\u0000b\u0007c"), /[\u0000\u0007]/);
  assert.deepEqual(checkUpload({ name: "notes.txt", size: 10 }), { ok: true, kind: "text" });
  assert.equal(checkUpload({ name: "page.HTML", size: 10 }).kind, "html");
  assert.equal(
    checkUpload({ name: "unit.docx", size: 10 }).kind,
    "docx",
    "Word .docx is read (docx.js)",
  );
  assert.equal(checkUpload({ name: "unit.pdf", size: 10 }).error, "unsupported-document");
  assert.equal(checkUpload({ name: "old.doc", size: 10 }).error, "unsupported-document");
  assert.equal(checkUpload({ name: "run.exe", size: 10 }).error, "unsupported-type");
  assert.equal(checkUpload({ name: "big.txt", size: MAX_UPLOAD_BYTES + 1 }).error, "too-large");
  assert.equal(checkUpload({ name: "empty.md", size: 0 }).error, "empty-file");
  const file = (name, text) => ({ name, size: text.length, text: async () => text });
  const read = await readUpload(
    file("pond_notes.html", `<p>${SAMPLE_TEXT.slice(0, 200)}</p><script>bad()</script>`),
  );
  assert.equal(read.ok, true);
  assert.equal(read.source.title, "pond notes");
  assert.doesNotMatch(read.source.text, /bad\(\)|<p>/);
  assert.equal((await readUpload(file("unit.docx", "PK"))).ok, false);
});

test("extract: a text that is too short or has too few facts is refused with a reason", () => {
  assert.equal(extractSource("Ponds are nice. I like them.").error, "too-short");
  const out = compileExperience({ source: { text: "Ponds are nice." }, settings: SAMPLE_SETTINGS });
  assert.equal(out.ok, false);
  assert.equal(out.def, null);
  assert.equal(out.report.errors[0].code, "too-short");
  assert.equal(out.report.errors[0].text.length, 2);
});

test("existing Language Page passages can be the source (activity bank reader)", async () => {
  const data = {
    levels: {
      A: {
        activities: [
          {
            id: "r1",
            title: "T",
            passageTitle: "Saving Water",
            passage: ["Students can save water.", "They turn off the faucet."],
          },
          { id: "r2", title: "No passage" },
        ],
      },
    },
  };
  const list = await loadPassages("6-8", { loadDomain: async () => data });
  assert.deepEqual(list, [
    {
      id: "r1",
      title: "Saving Water",
      words: 9,
      text: "Students can save water. They turn off the faucet.",
    },
  ]);
});

// ── design ───────────────────────────────────────────────────────────────────
test("design: format from material and settings, scene count from time, a real conflict from the source's own facts", () => {
  assert.equal(
    chooseType(X, { ...SAMPLE_SETTINGS, type: "auto" }),
    "investigation",
    "cause-rich science + Explain",
  );
  assert.equal(chooseType(X, { subject: "Science", keyUse: "Argue" }), "debate");
  assert.equal(chooseType(X, { keyUse: "Narrate" }), "story");
  assert.equal(chooseType(X, { type: "mystery" }), "mystery", "the instructor's choice wins");
  assert.deepEqual([15, 20, 30, 45, 60, 90].map(sceneCountFor), [2, 2, 3, 3, 4, 4]);
  const c = designConflict(X);
  assert.equal(c.strategy, "stated");
  assert.equal(c.sourceText, "They disappeared because the water lost its oxygen.");
  assert.equal(c.misreadText, "Some neighbors blamed the herons for eating too many minnows.");
  assert.deepEqual(c.misreadFrom, [19]);
  assert.ok(c.contradictedBy.includes(20), "the heron count contradicts the misreading");
  const plan = designExperience(X, SAMPLE_SETTINGS);
  assert.equal(plan.sceneCount, 3);
  assert.deepEqual(plan.evidence.map((e) => e.kind).sort(), [
    "audio",
    "data",
    "data",
    "document",
    "object",
    "testimony",
  ]);
  for (const e of plan.evidence)
    assert.ok(
      e.from.length && e.from.every((i) => X.sentences[i]),
      `${e.id} names source sentences`,
    );
  assert.equal(plan.characters.length, 2);
  assert.equal(
    plan.characters[0].name,
    "Ms. Okafor",
    "a person the source quotes becomes a character",
  );
  assert.equal(plan.characters[0].fromSource, true);
  assert.deepEqual(plan.invented, [{ what: "character-name", value: "Sam Rivera" }]);
  // no source sentence is used twice across evidence and character knowledge (the rival idea is shared on purpose)
  const used = [
    ...plan.evidence.filter((e) => e.kind !== "testimony").flatMap((e) => e.from),
    ...plan.characters.flatMap((ch) => ch.topics.flatMap((t) => [...t.from, ...t.clarifyFrom])),
  ];
  assert.equal(new Set(used).size, used.length);
});

test("design: a text with no stated rival idea still gets a marked misreading the source contradicts", () => {
  const text = SAMPLE_TEXT.replace(/At first, some neighbors[^]*?oxygen\."\n\n/, "");
  const x = extractSource(text);
  assert.equal(
    x.relations.some((r) => r.type === "rival"),
    false,
  );
  const c = designConflict(x);
  assert.equal(c.strategy, "reversed");
  assert.equal(c.misreadPair.length, 2);
  const out = compileExperience(
    { source: { title: "Pond", text }, settings: SAMPLE_SETTINGS },
    ASSETS,
  );
  assert.equal(out.ok, true, JSON.stringify(out.report.errors));
  assert.ok(out.def.compiled.notes.includes("built-misreading"));
  assert.equal(out.def.explanations.find((e) => e.check).id, "ex-misread");
  assert.ok(reachOutcomes(out.def).completable);
});

// ── generate + validate ──────────────────────────────────────────────────────
test("the compiled sample passes the engine's validateMission and the compiler's checks", () => {
  const { ok, def, report, key } = compiled();
  assert.match(key, ID_RE);
  assert.match(key, /^x[a-z0-9]{8,12}$/);
  assert.equal(def.id, missionIdFor(key));
  assert.equal(def.schema, SCHEMA);
  assert.deepEqual(validateMission(def), { ok: true, errors: [], warnings: [] });
  assert.equal(ok, true);
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
  assert.deepEqual(report.stats.standards, [
    "ELD-SC.6-8.Explain.Interpretive",
    "ELD-SC.6-8.Explain.Expressive",
  ]);
  assert.equal(def.band, "6-8");
  assert.equal(def.subject, "Science");
  assert.deepEqual(def.keyUses, ["Explain"]);
  assert.equal(def.source.text, cleanSource(SAMPLE_TEXT), "the source is kept");
  assert.equal(def.objectives.language[0], SAMPLE_SETTINGS.languageObjective);
  assert.ok(JSON.stringify(def).length < MAX_DEF_BYTES);
});

test("the sample meets the required shape: 3 scenes, 2 characters, 4+ artifacts, listen + read, speak, write, revise, transfer", () => {
  const { def, report } = compiled();
  assert.equal(def.scenes.length, 3);
  assert.equal(def.characters.length, 2);
  const artifacts = def.evidence.filter((e) => e.kind !== "testimony");
  assert.ok(artifacts.length >= 4, `${artifacts.length} artifacts`);
  assert.ok(
    artifacts.some((e) => e.kind === "audio"),
    "a listening component",
  );
  assert.ok(
    artifacts.some((e) => e.kind === "document") && artifacts.some((e) => e.kind === "data"),
    "reading components",
  );
  assert.ok(
    artifacts.some((e) => e.kind === "object"),
    "an object to examine",
  );
  assert.deepEqual(report.stats.tasks, {
    compare: 1,
    decide: 1,
    speak: 1,
    write: 1,
    revise: 1,
    transfer: 1,
  });
  const task = (type) => def.tasks.find((t) => t.type === type);
  assert.equal(task("speak").domain, "Speaking");
  assert.equal(task("write").domain, "Writing");
  assert.equal(task("revise").of, task("write").id);
  assert.ok(
    task("speak").frames.length >= 2 && task("speak").frames.every((f) => f.length === 2),
    "configurable supports: frames in both languages",
  );
  assert.deepEqual(def.supports, SAMPLE_SETTINGS.supports);
  assert.equal(def.vocabulary.length, 5);
  for (const c of def.characters) {
    assert.ok(c.topics.length >= 2);
    assert.ok(
      c.topics.some((t) => t.clarify),
      `${c.name} answers a clarification question`,
    );
    for (const t of c.topics)
      assert.ok(t.keywords.length >= 1 && t.ask[0].endsWith("?") && t.ask[1].endsWith("?"));
  }
  assert.equal(def.explanations.length, 2);
  assert.ok(
    def.evidence.some((e) => (e.contradicts || []).includes("ex-misread")),
    "the misreading is contradicted by evidence",
  );
  assert.ok(
    def.evidence.some((e) => (e.supports || []).includes("ex-misread")),
    "and something seems to support it (a real conflict)",
  );
  assert.equal(def.outcomes.length, 4);
  assert.equal(def.outcomes.at(-1).when, undefined);
  // English and Spanish everywhere the compiler authored text
  const authored = [
    def.title,
    def.summary,
    ...def.scenes.flatMap((s) => [s.title, s.description, ...s.hotspots.map((h) => h.label)]),
    ...def.tasks.map((t) => t.prompt),
    ...def.outcomes.flatMap((o) => [o.title, o.text]),
    ...def.acts.flatMap((a) => [a.title, a.goal]),
    ...def.characters.flatMap((c) => [
      c.greeting,
      c.fallback,
      c.style,
      ...c.topics.map((t) => t.ask),
    ]),
  ];
  for (const [en, es] of authored) assert.notEqual(en, es, `Spanish differs from English: ${en}`);
  assert.doesNotMatch(
    JSON.stringify(authored),
    /\b(score|points|level \d|timer|streak|puntaje|cronómetro)\b/i,
  );
});

test("every generated evidence body, answer and meaning is traceable to the source; an injected false fact is flagged", () => {
  const { def, report } = compiled();
  const sents = X.sentences.map((s) => s.text);
  const keys = Object.keys(report.trace);
  assert.ok(keys.length >= 6 + 6 + 5, `${keys.length} traced texts`);
  for (const [k, t] of Object.entries(report.trace))
    assert.equal(t.ok, true, `${k} is from the source`);
  for (const e of def.evidence) {
    assert.ok(e.from?.length, `${e.id} stores its sentence indexes`);
    assert.equal(
      e.body[0],
      e.from.map((i) => sents[i]).join(" "),
      `${e.id} is the source's own sentences`,
    );
    assert.equal(e.body[1], e.body[0], "source-derived text stays in the source language");
  }
  for (const c of def.characters)
    for (const t of c.topics) assert.equal(t.answer[0], t.from.map((i) => sents[i]).join(" "));
  assert.equal(overlap("The algae grew faster.", [sents[11]]) >= 0.6, true);

  const bad = structuredClone(def);
  bad.evidence[0].body = ["Herons ate 500 minnows every single day in June.", "x"];
  bad.characters[1].topics[0].answer[0] += " The mayor closed the pond forever.";
  const flagged = validateExperience(bad, ASSETS);
  const hits = flagged.warnings.filter((w) => w.code === "not-from-source");
  assert.equal(hits.length, 2);
  assert.match(hits[0].text[0], /not from your text — "Herons ate 500 minnows/);
  assert.match(hits[0].text[1], /no viene de tu texto/);
  assert.match(hits[1].text[0], /The mayor closed the pond forever/);
  assert.equal(
    traceText(
      "It dropped from 8 milligrams per liter in May to 3 milligrams per liter in August.",
      sents,
    ).ok,
    true,
  );
  assert.equal(
    traceText(
      "It dropped from 8 milligrams per liter in May to 9 milligrams per liter in August.",
      sents,
    ).ok,
    false,
    "one changed number is an inaccurate fact, even when every other word matches",
  );
  assert.equal(
    traceText(
      "It dropped from 8 milligrams per liter in May to 9 milligrams per liter in August.",
      sents,
      [16],
    ).ok,
    false,
  );
  assert.equal(traceText("The pond is on the moon.", sents).ok, false);
});

test("scene connectivity: every scene is reachable from the start and leads back", () => {
  const { def } = compiled();
  const doors = Object.fromEntries(
    def.scenes.map((s) => [
      s.id,
      s.hotspots.filter((h) => h.opens.scene).map((h) => h.opens.scene),
    ]),
  );
  assert.deepEqual(doors, { s1: ["s2"], s2: ["s1", "s3"], s3: ["s2"] });
  const seen = new Set([def.start]);
  for (const id of seen) for (const next of doors[id]) seen.add(next);
  assert.equal(seen.size, def.scenes.length);
  for (const c of def.characters)
    assert.ok(
      def.scenes.find((s) => s.id === c.scene).hotspots.some((h) => h.opens.character === c.id),
    );
  for (const t of def.tasks)
    assert.ok(def.scenes.find((s) => s.id === t.scene).hotspots.some((h) => h.opens.task === t.id));
});

test("scripted play through the real runtime reaches three different endings; save and resume keep the place", () => {
  const { def, report } = compiled();
  const backed = playScript(def, { option: "o-source", cite: "all" });
  const thin = playScript(def, { option: "o-source", cite: "one" });
  const misread = playScript(def, { option: "o-misread", cite: "all" });
  assert.deepEqual(
    [backed, thin, misread].map((r) => r.complete),
    [true, true, true],
  );
  assert.deepEqual(
    [backed.outcome, thin.outcome, misread.outcome],
    ["out-backed", "out-thin", "out-misread"],
  );
  assert.equal(outcomeOf(def, backed.state).title[0], "The case holds together");
  // the endings depend on evidence collected and cited
  assert.equal(backed.state.tasks["t-decide"].cited.length >= 2, true);
  assert.equal(thin.state.tasks["t-decide"].cited.length, 1);
  assert.equal(
    Object.keys(backed.state.evidence).length,
    def.evidence.length,
    "every piece of evidence can be collected",
  );
  assert.ok(backed.state.evidence["ev-claim"], "testimony is given by a character");
  for (const t of ["t-speak", "t-write"])
    assert.equal(backed.state.tasks[t].supported, false, "no help opened: independent");
  assert.equal(
    backed.state.tasks["t-revise"].supported,
    true,
    "a revision after feedback is always supported",
  );
  assert.equal(backed.state.tasks["t-transfer"].supported, false);
  const r = reachOutcomes(def);
  assert.equal(r.completable, true);
  assert.deepEqual(
    Object.entries(r.outcomes).map(([id, o]) => [id, o.reachable]),
    [
      ["out-backed", true],
      ["out-thin", true],
      ["out-misread", true],
      ["out-open", false],
    ],
  );
  assert.deepEqual(
    report.branches.map((b) => [b.id, b.reachable, b.fallback]),
    [
      ["out-backed", true, false],
      ["out-thin", true, false],
      ["out-misread", true, false],
      ["out-open", false, true],
    ],
  );
  assert.match(
    report.branches[0].when[0],
    /chose "They disappeared because the water lost its oxygen\." AND cited 2 or more pieces of evidence that support/,
  );
  assert.match(report.branches[0].when[1], /eligió .* Y citó 2 o más evidencias/);
  assert.deepEqual(conditionText(def, { not: { talked: "c-expert" } }), [
    "NOT (talked with Ms. Okafor)",
    "NO (habló con Ms. Okafor)",
  ]);

  // save / resume: a state survives JSON and continues where it stopped
  let state = newState(def);
  for (const a of backed.steps.slice(0, 9)) state = act(def, state, a).state;
  const resumed = restore(def, JSON.parse(JSON.stringify(state)));
  assert.deepEqual(resumed, state);
  assert.deepEqual(validActions(def, resumed), validActions(def, state));
  let cont = resumed;
  for (const a of backed.steps.slice(9)) cont = act(def, cont, a).state;
  assert.equal(cont.complete, true);
  assert.equal(cont.outcome, "out-backed");
});

test("a locked task and a too-short answer are refused by the runtime (the preview shows the same engine)", () => {
  const { def } = compiled();
  const pv = newPreview(def);
  assert.equal(
    act(def, pv.state, { type: "submit", task: "t-speak", text: "word ".repeat(30) }).error,
    "not-here",
  );
  previewOpen(def, pv, "h-ev-object");
  assert.deepEqual(pv.open, { kind: "evidence", id: "ev-object" });
  assert.ok(pv.state.evidence["ev-object"]);
  previewAsk(def, pv, "c-witness", "What did people think about the herons?");
  assert.equal(
    pv.open.line.text[0],
    "At first, some neighbors blamed the herons for eating too many minnows.",
  );
  assert.ok(pv.state.evidence["ev-claim"]);
  previewAsk(def, pv, "c-witness", "What is your favorite pizza?");
  assert.equal(
    pv.open.line.kind,
    "fallback",
    "an off-topic question gets the in-role fallback, never invented text",
  );
  assert.equal(previewAct(def, pv, { type: "move", scene: "s3" }), null);
  assert.ok(pv.note, "the refusal is shown");
});

// ── editor operations ────────────────────────────────────────────────────────
const edit = (def, op) => {
  const res = applyOp(def, op);
  return { ...res, report: validateExperience(res.def, ASSETS) };
};

test("editor: reorder, edit a character, change a question, add evidence — the definition stays valid and playable", () => {
  const { def } = compiled();
  const moved = edit(def, { type: "scene.move", id: "s3", dir: -1 });
  assert.deepEqual(
    moved.def.scenes.map((s) => s.id),
    ["s1", "s3", "s2"],
  );
  assert.equal(moved.report.ok, true);
  assert.deepEqual(
    def.scenes.map((s) => s.id),
    ["s1", "s2", "s3"],
    "the original is untouched (undo keeps it)",
  );
  assert.equal(edit(def, { type: "scene.move", id: "s3", dir: 1 }).error, "cannot-move");

  const renamed = edit(def, {
    type: "character.set",
    id: "c-witness",
    field: "name",
    value: "Rosa Delgado",
  });
  assert.equal(renamed.def.characters.find((c) => c.id === "c-witness").name, "Rosa Delgado");
  assert.equal(renamed.report.ok, true);
  const greet = edit(def, {
    type: "character.set",
    id: "c-witness",
    field: "greeting",
    lang: "es",
    value: "Buenas. Soy Rosa.",
  });
  assert.deepEqual(
    greet.def.characters.find((c) => c.id === "c-witness").greeting.map((g) => g.slice(0, 6)),
    ["Hello.", "Buenas"],
  );

  const asked = edit(def, {
    type: "topic.set",
    character: "c-witness",
    id: "t-idea",
    field: "ask",
    lang: "en",
    value: "Who did the neighbors blame?",
  });
  assert.equal(
    asked.def.characters.find((c) => c.id === "c-witness").topics.find((t) => t.id === "t-idea")
      .ask[0],
    "Who did the neighbors blame?",
  );
  assert.equal(asked.report.ok, true);

  // an edited answer is re-checked against the whole text
  const line = "Tiny animals called zooplankton eat the algae.";
  const fromText = edit(def, {
    type: "topic.set",
    character: "c-expert",
    id: "t-how",
    field: "answer",
    lang: "both",
    value: line,
  });
  assert.equal(fromText.report.trace["answer:c-expert:t-how"].ok, true);
  assert.equal(fromText.report.ok, true);
  const invented = edit(def, {
    type: "topic.set",
    character: "c-expert",
    id: "t-how",
    field: "answer",
    lang: "en",
    value: "The factory dumped purple paint in the river.",
  });
  assert.equal(invented.report.trace["answer:c-expert:t-how"].ok, false);
  assert.ok(
    invented.report.warnings.some(
      (w) => w.code === "not-from-source" && w.where === "answer:c-expert:t-how",
    ),
  );

  const added = edit(def, { type: "evidence.add", kind: "document" });
  const fresh = added.def.evidence.at(-1);
  assert.equal(fresh.id, "ev-new1");
  assert.ok(
    added.def.scenes[0].hotspots.some((h) => h.opens.evidence === "ev-new1"),
    "new evidence gets a labelled spot",
  );
  assert.equal(validateMission(added.def).ok, true);
  assert.ok(
    added.report.warnings.some(
      (w) => w.code === "not-from-source" && w.where === "evidence:ev-new1",
    ),
    "the placeholder body is flagged until it holds source text",
  );
  const filled = edit(added.def, {
    type: "evidence.set",
    id: "ev-new1",
    field: "body",
    lang: "both",
    value: "Fertilizer contains nutrients that help plants grow.",
  });
  const linked = edit(filled.def, {
    type: "evidence.set",
    id: "ev-new1",
    field: "link",
    value: "supports:ex-source",
  });
  assert.deepEqual(linked.def.evidence.at(-1).supports, ["ex-source"]);
  assert.equal(linked.report.ok, true);
  assert.equal(
    linked.report.warnings.some(
      (w) => w.where === "evidence:ev-new1" && w.code === "not-from-source",
    ),
    false,
  );
  assert.equal(edit(def, { type: "nope" }).error, "unknown-operation");
  assert.ok(OP_TYPES.length >= 18);
});

test("editor: removing a scene keeps the experience valid and playable (its contents and doors move)", () => {
  const { def } = compiled();
  const out = edit(def, { type: "scene.remove", id: "s2" });
  assert.deepEqual(
    out.def.scenes.map((s) => s.id),
    ["s1", "s3"],
  );
  assert.equal(validateMission(out.def).ok, true);
  assert.equal(out.report.ok, true, JSON.stringify(out.report.errors));
  assert.equal(out.def.characters.find((c) => c.id === "c-expert").scene, "s1");
  assert.ok(out.def.scenes[0].hotspots.some((h) => h.opens.task === "t-decide"));
  assert.ok(reachOutcomes(out.def).outcomes["out-backed"].reachable);
  const first = edit(def, { type: "scene.remove", id: "s1" });
  assert.equal(first.def.start, "s2");
  assert.equal(first.report.ok, true, JSON.stringify(first.report.errors));
  const one = applyOp(applyOp(def, { type: "scene.remove", id: "s2" }).def, {
    type: "scene.remove",
    id: "s3",
  }).def;
  assert.equal(applyOp(one, { type: "scene.remove", id: "s1" }).error, "last-scene");
  const grown = edit(def, { type: "scene.add" });
  assert.equal(grown.def.scenes.length, 4);
  assert.equal(grown.report.ok, true, JSON.stringify(grown.report.errors));
});

test("editor: an edit that breaks the experience is reported precisely", () => {
  const { def } = compiled();
  // removing the evidence that contradicts the misreading, and the message that also does
  let d = applyOp(def, { type: "evidence.remove", id: "ev-check" }).def;
  d = applyOp(d, { type: "evidence.remove", id: "ev-audio" }).def;
  const r1 = validateExperience(d, ASSETS);
  assert.equal(validateMission(d).ok, true, "removal leaves no dangling reference");
  assert.equal(r1.ok, false);
  assert.ok(r1.errors.some((e) => e.code === "misreading-unchecked"));
  assert.ok(
    r1.warnings.some((w) => w.code === "no-task" || w.code === "branch-not-reached") ||
      r1.errors.length >= 1,
  );

  const thin = edit(def, { type: "task.set", id: "t-write", field: "minWords", value: 2 });
  assert.deepEqual(
    thin.report.errors.map((e) => [e.code, e.where]),
    [["thin-task", "task:t-write"]],
  );
  const noLabel = edit(def, {
    type: "hotspot.set",
    scene: "s1",
    id: "h-ev-object",
    field: "label",
    lang: "en",
    value: "",
  });
  assert.ok(
    noLabel.report.errors.some(
      (e) => e.code === "no-label" && e.where === "hotspot:s1:h-ev-object",
    ),
  );
  const art = edit(def, { type: "scene.set", id: "s1", field: "art", value: "volcano" });
  assert.deepEqual(
    art.report.errors.map((e) => e.code),
    ["missing-art"],
  );
  const look = edit(def, { type: "character.set", id: "c-expert", field: "look", value: "pirate" });
  assert.deepEqual(
    look.report.errors.map((e) => e.code),
    ["missing-art"],
  );
  const obj = edit(def, { type: "meta.set", field: "language", lang: "en", value: "Talk." });
  assert.deepEqual(
    obj.report.errors.map((e) => e.code),
    ["missing-objective"],
  );
  const graded = edit(def, {
    type: "task.set",
    id: "t-speak",
    field: "prompt",
    lang: "en",
    value: "Explain what happened to earn points and beat the timer today.",
  });
  assert.ok(graded.report.errors.some((e) => e.code === "score-language"));

  // a door removed: the last scene cannot be reached, and the engine says which
  const cut = edit(def, { type: "hotspot.remove", scene: "s2", id: "h-next1" });
  assert.equal(cut.report.ok, false);
  assert.ok(cut.report.errors.some((e) => /scene s3: cannot be reached/.test(e.text[0])));
  // a transcript-less recording and an unknown Key Language Use
  const mute = structuredClone(def);
  mute.evidence.find((e) => e.kind === "audio").transcript = false;
  assert.ok(validateExperience(mute, ASSETS).errors.some((e) => e.code === "no-transcript"));
  const use = edit(def, { type: "feedback.set", field: "keyUse", value: "Persuade" });
  assert.ok(use.report.errors.some((e) => e.code === "unknown-key-use"));
  const narr = edit(def, { type: "feedback.set", field: "keyUse", value: "Narrate" });
  assert.ok(
    narr.report.warnings.some((w) => w.code === "no-standard"),
    "Science + Narrate is not in the lab's WIDA catalog",
  );
  assert.deepEqual(standardsFor({ subject: "Science", band: "6-8", keyUse: "Narrate" }), []);
  // a branch that can never fire
  const dead = structuredClone(def);
  dead.outcomes[0].when = {
    all: [{ chose: ["t-decide", "o-source"] }, { support: ["t-decide", 40] }],
  };
  const rd = validateExperience(dead, ASSETS);
  assert.ok(rd.errors.some((e) => e.code === "broken-branch"));
  // every path to one ending
  const flat = structuredClone(def);
  flat.outcomes = [flat.outcomes[1], flat.outcomes.at(-1)];
  flat.outcomes[0].when = { evidence: 0 };
  assert.ok(validateExperience(flat, ASSETS).errors.some((e) => e.code === "one-ending"));
});

test("editor: supports and feedback configuration", () => {
  const { def } = compiled();
  const off = edit(def, { type: "supports.set", key: "frames", value: false });
  assert.equal(off.def.supports.frames, false);
  assert.equal(off.def.tasks.find((t) => t.type === "speak").frames, undefined);
  const on = edit(off.def, { type: "supports.set", key: "frames", value: true });
  assert.equal(on.def.tasks.find((t) => t.type === "speak").frames.length, 3);
  const words = edit(def, { type: "feedback.set", field: "write", value: 50 });
  assert.deepEqual(
    words.def.tasks.filter((t) => ["write", "revise"].includes(t.type)).map((t) => t.minWords),
    [50, 50],
  );
  const argue = edit(def, { type: "feedback.set", field: "keyUse", value: "Argue" });
  assert.deepEqual(argue.def.keyUses, ["Argue"]);
  assert.ok(argue.def.tasks.every((t) => t.keyUse === "Argue"));
  assert.equal(argue.report.ok, true);
  const opt = edit(def, {
    type: "option.set",
    task: "t-decide",
    id: "o-misread",
    lang: "en",
    value: "The herons ate the minnows.",
  });
  assert.equal(
    opt.def.explanations.find((x) => x.id === "ex-misread").label[0],
    "The herons ate the minnows.",
  );
});

// ── drafts, export / import, assignment, student copy ────────────────────────
test("drafts autosave under accessPracticeLab:v1:experiences in the shape the player reads", () => {
  const { def, key } = compiled();
  const mem = new Map();
  const io = { read: (k) => mem.get(k) ?? null, write: (k, v) => (mem.set(k, v), true) };
  assert.equal(DRAFTS_KEY, "accessPracticeLab:v1:experiences");
  assert.equal(saveDraft(key, { def }, { ...io, now: 1000 }), true);
  const stored = JSON.parse(mem.get(DRAFTS_KEY));
  assert.deepEqual(Object.keys(stored), [key]);
  assert.deepEqual(Object.keys(stored[key]).sort(), ["def", "updatedAt"]);
  assert.equal(loadDrafts(io.read)[key].def.id, def.id);
  mem.set(DRAFTS_KEY, JSON.stringify({ ...stored, "../evil": { def: {} }, xbad: "nope" }));
  assert.deepEqual(
    Object.keys(loadDrafts(io.read)),
    [key],
    "entries that are not drafts are ignored",
  );
});

test("export and import round trip; a file that is not an experience is refused", () => {
  const { def, key } = compiled();
  const text = exportDraft(key, { def, input: sampleInput() });
  const back = importDraft(text);
  assert.equal(back.ok, true);
  assert.notEqual(back.key, key, "an import is a new draft");
  assert.equal(back.entry.def.id, missionIdFor(back.key));
  assert.deepEqual({ ...back.entry.def, id: def.id }, def);
  assert.equal(back.report.ok, true);
  assert.equal(back.entry.input.source.title, SAMPLE_TITLE);
  assert.equal(importDraft("not json").ok, false);
  assert.equal(importDraft(JSON.stringify({ hello: 1 })).error, "not-an-experience");
  assert.equal(
    importDraft(JSON.stringify({ kind: "lp-experience/1", def: { schema: "lp-sim/1" } })).error,
    "invalid",
  );
  assert.equal(importDraft("x".repeat(300 * 1024)).error, "too-large");
});

test("assignment id and path satisfy the class contract; the student copy holds no source or compiler notes", () => {
  for (let i = 0; i < 50; i++) {
    const id = newExperienceId();
    assert.match(id, /^x[a-z0-9]{8,12}$/);
    const a = assignmentFor(id, "Investigation: Willow Pond");
    assert.match(a.id, ASSIGN_ID_RE);
    assert.match(a.id, /^[a-z0-9][a-z0-9:_-]{0,39}$/);
    assert.match(a.path, ASSIGN_PATH_RE);
    assert.match(a.path, /^\/[\w\-./?=&%]{0,200}$/);
    assert.equal(a.path, `/access-practice-lab/simulations/x/${id}`);
  }
  const { def } = compiled();
  const copy = studentCopy(def);
  assert.equal(copy.source, undefined);
  assert.equal(copy.compiled, undefined);
  assert.deepEqual(
    copy.supports,
    def.supports,
    "the supports the instructor chose travel with the experience",
  );
  assert.equal(validateMission(copy).ok, true);
  assert.equal(studentCopy(def, { showSource: true }).source.text, def.source.text);
  assert.ok(reachOutcomes(copy).completable, "what learners download is playable");
});

test("settings shape the experience: time, grade band, supports, type; every experience type compiles and plays", () => {
  const base = sampleInput();
  const short = compileExperience({ ...base, settings: { ...base.settings, minutes: 20 } }, ASSETS);
  assert.equal(short.def.scenes.length, 2);
  assert.equal(short.ok, true, JSON.stringify(short.report.errors));
  const long = compileExperience({ ...base, settings: { ...base.settings, minutes: 90 } }, ASSETS);
  assert.equal(long.def.scenes.length, 4);
  assert.equal(long.ok, true, JSON.stringify(long.report.errors));
  const young = compileExperience({ ...base, settings: { ...base.settings, band: "3-5" } }, ASSETS);
  assert.ok(young.def.tasks.find((t) => t.type === "write").minWords < base.settings.minutes);
  assert.equal(young.def.tasks.find((t) => t.type === "write").minWords, 20);
  const bare = compileExperience(
    { ...base, settings: { ...base.settings, supports: { glossary: false, frames: false } } },
    ASSETS,
  );
  assert.equal(bare.def.vocabulary.length, 0);
  assert.equal(bare.def.tasks.find((t) => t.type === "speak").frames.length, 0);
  for (const type of [
    "investigation",
    "interview",
    "mystery",
    "simulation",
    "debate",
    "story",
    "explanation",
    "media",
  ]) {
    const out = compileExperience({ ...base, settings: { ...base.settings, type } }, ASSETS);
    assert.equal(out.ok, true, `${type}: ${JSON.stringify(out.report.errors)}`);
    assert.equal(out.def.compiled.type, type);
    assert.ok(reachOutcomes(out.def).completable, `${type} is playable`);
  }
  // deterministic: the same input gives the same experience (only the id differs)
  const a = compileExperience({ ...base, id: "xsame000001" }).def;
  const b = compileExperience({ ...base, id: "xsame000001" }).def;
  assert.deepEqual(a, b);
  assert.deepEqual(blankInput().settings.supports, SAMPLE_SETTINGS.supports);
});
