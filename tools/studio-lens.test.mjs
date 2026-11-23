// node --test tools/studio-lens.test.mjs
// Language Lens, Scaffold Slider logic, Resource Remix, class evidence dashboard rules, evidence codes.
import assert from "node:assert/strict";
import test from "node:test";
import {
  ASSESS_CAUTION,
  groupAssessments,
  MIN_N,
  summarizeEvidence,
  validateAssessment,
} from "../bcpss-teachers/studio/core/dash.js";
import { decodeCode, encodeCode } from "../bcpss-teachers/studio/core/evidence.js";
import {
  analyzeLanguage,
  analyzeLesson,
  splitSentences,
} from "../bcpss-teachers/studio/core/lens.js";
import {
  ACADEMIC_WORDS,
  FUNCTIONS,
  SUBJECT_TERMS,
} from "../bcpss-teachers/studio/core/lens-wordlists.js";
import {
  planFromAnalysis,
  planToText,
  studentSections,
  termsFromCollection,
  unitSections,
} from "../bcpss-teachers/studio/core/lensdata.js";
import {
  buildDraft,
  buildEvidenceInvestigation,
  buildExitTicket,
  buildLanguageObjectives,
  buildVocabCards,
  confirmedCards,
  evidenceProblems,
  textPreserved,
} from "../bcpss-teachers/studio/core/remix.js";
import {
  describeTier,
  diffScaffold,
  FACETS,
  fadeSuggestion,
  recommendTiersFromClass,
  scaffoldFor,
} from "../bcpss-teachers/studio/core/scaffold.js";
import { ACTIVITIES, PACK, UNIT, VOCAB } from "./studio-lens-fixtures/pack.js";
import { TEXTS } from "./studio-lens-fixtures/texts.js";

const byId = Object.fromEntries(TEXTS.map((t) => [t.id, t]));
const run = (id) => analyzeLanguage(byId[id].text, byId[id]);
const words = (a) => [...a.vocabulary.technical, ...a.vocabulary.academic].map((v) => v.word);

test("word lists: at least 350 academic words, subject lists present, no emoji", () => {
  assert.ok(new Set(ACADEMIC_WORDS).size >= 350);
  for (const k of ["math", "science", "social-studies", "ela"])
    assert.ok(SUBJECT_TERMS[k].length >= 40, k);
  assert.ok(FUNCTIONS.length >= 14);
  for (const f of FUNCTIONS)
    for (const t of ["ee", "dev", "exp", "br"]) assert.ok(f.frames[t]?.length, `${f.id}.${t}`);
  const all = JSON.stringify([ACADEMIC_WORDS, SUBJECT_TERMS, FUNCTIONS]);
  assert.ok(!/\p{Extended_Pictographic}/u.test(all));
});

test("lens is deterministic", () => {
  for (const t of TEXTS)
    assert.equal(
      JSON.stringify(analyzeLanguage(t.text, t)),
      JSON.stringify(analyzeLanguage(t.text, t)),
      t.id,
    );
  assert.equal(JSON.stringify(analyzeLesson(PACK)), JSON.stringify(analyzeLesson(PACK)));
});

test("lens covers at least 6 subjects and bands with expected findings", () => {
  assert.ok(new Set(TEXTS.map((t) => t.subject)).size >= 4);
  assert.ok(new Set(TEXTS.map((t) => t.grade)).size >= 6);
  // K-2 ELA: describe and sequence, no heavy structures
  let a = run("k2-ela");
  assert.ok(a.functions.some((f) => f.id === "describe"));
  assert.ok(a.functions.some((f) => f.id === "sequence"));
  assert.equal(a.languageLoad.level, "lighter");
  // K math: question words and counting
  a = run("k2-math");
  assert.ok(a.functions.some((f) => f.id === "solve" || f.id === "identify"));
  // 3-5 science: water cycle vocabulary, sequence, explain
  a = run("35-science");
  assert.ok(
    words(a).includes("water cycle") &&
      words(a).includes("condensation") &&
      words(a).includes("evaporation"),
  );
  assert.ok(a.functions.some((f) => f.id === "explain"));
  assert.ok(a.structures.subordination.count >= 1);
  // 3-5 social studies: compare, subordination (because, while)
  a = run("35-social");
  assert.ok(a.functions.some((f) => f.id === "compare"));
  assert.ok(a.functions.some((f) => f.id === "cite"));
  assert.ok(a.structures.subordination.count >= 2);
  // 6-8 math: ratio vocabulary, math phrase, polysemy of "table"
  a = run("68-math");
  assert.ok(words(a).includes("ratio table") && words(a).includes("unit rate"));
  assert.ok(a.barriers.some((b) => b.type === "math-phrase" && /for every/i.test(b.text)));
  assert.ok(a.barriers.some((b) => b.type === "polysemy" && b.text === "table"));
  assert.ok(a.structures.conditionals.count >= 1);
  // 6-8 science: predict, passive, nominalization, force/mass polysemy
  a = run("68-science");
  assert.ok(a.functions.some((f) => f.id === "predict"));
  assert.ok(a.structures.passive.count >= 1);
  assert.ok(a.structures.nominalization.count >= 1);
  assert.ok(a.barriers.some((b) => b.type === "polysemy" && b.text === "force"));
  // 6-8 ELA: cite, justify, evaluate; genre argument
  a = run("68-ela");
  assert.ok(["cite", "justify", "evaluate"].every((id) => a.functions.some((f) => f.id === id)));
  assert.equal(a.genre, "argument");
  // 6-8 social studies: analyze + checks and balances + branch polysemy
  a = run("68-social");
  assert.ok(a.functions.some((f) => f.id === "analyze"));
  assert.ok(words(a).includes("checks and balances"));
  assert.ok(a.barriers.some((b) => b.type === "polysemy" && b.text === "branch"));
});

test("lens separates language load from concept difficulty and says so", () => {
  const a = run("68-math");
  assert.ok(a.languageLoad && !("conceptDifficulty" in a));
  assert.match(a.conceptNote, /not a measure of how hard the idea is/i);
  assert.ok(a.languageLoad.drivers.length >= 3);
});

test("lens flags idioms, phrasal verbs, long sentences and pronoun chains", () => {
  const t =
    "It is a piece of cake. We have to figure out the answer. When the teacher explained that it was the reason they had been late because it rained and they thought it would stop, they said it was not unusual that it never did not matter, and nobody argued with the long explanation about the weather that day at school.";
  const a = analyzeLanguage(t, { grade: "3", subject: "ela" });
  const types = new Set(a.barriers.map((b) => b.type));
  for (const x of ["idiom", "phrasal-verb", "long-sentence", "pronoun-chain"])
    assert.ok(types.has(x), x);
});

test("sentence splitter never alters text and respects decimals and abbreviations", () => {
  const src = 'Mr. Lee paid $3.50 for 2.5 lbs. Then he left.\n1. Add 3 + 4.\n2. Say "why"!\nNo end';
  const s = splitSentences(src);
  assert.deepEqual(
    s.map((x) => x.text),
    [
      "Mr. Lee paid $3.50 for 2.5 lbs.",
      "Then he left.",
      "1. Add 3 + 4.",
      '2. Say "why"!',
      "No end",
    ],
  );
  for (const x of s) assert.equal(src.slice(x.start, x.end), x.text);
  const covered = s
    .map((x) => x.text)
    .join("")
    .replace(/\s/g, "");
  assert.equal(covered, src.replace(/\s/g, ""));
  for (const t of TEXTS) {
    const parts = splitSentences(t.text);
    assert.equal(parts.map((x) => x.text).join(" "), t.text);
  }
});

test("lesson analysis reads student-facing text only", () => {
  const sections = studentSections(PACK);
  const all = sections.map((s) => s.text).join("\n");
  assert.ok(!/TEACHER-ONLY/.test(all), "teacher notes leaked into student text");
  assert.ok(!/answer key/i.test(all));
  const a = analyzeLesson(PACK, { terms: termsFromCollection(VOCAB, PACK.vocab.ids) });
  assert.ok(words(a).includes("ratio") && words(a).includes("unit rate"));
  assert.ok(a.bySection.length >= 6);
  assert.ok(a.vocabulary.technical.some((v) => v.kind === "collection"));
  assert.ok(Array.isArray(a.declaredFunctions));
});

test("plan is editable plain text and never contains teacher-only text", () => {
  const a = analyzeLesson(PACK);
  const plan = planFromAnalysis(a, {
    title: "Fixture plan",
    contentObjective: PACK.contentObjective,
  });
  assert.ok(plan.sections.length >= 8);
  for (const s of plan.sections) for (const i of s.items) assert.equal(typeof i.text, "string");
  const text = planToText(plan);
  assert.match(text, /not how hard the concept is/i);
  assert.ok(!/TEACHER-ONLY/.test(text));
  assert.ok(plan.sections.find((s) => s.id === "objective").items[0].text.startsWith("I can "));
});

test("unit sections and terms read the real API shape", () => {
  const sections = unitSections({ ...UNIT });
  assert.ok(sections.length >= 4);
  const a = analyzeLanguage(sections.map((s) => s.text).join("\n"), {
    grade: "6",
    subject: "math",
  });
  assert.ok(a.stats.words > 40);
});

test("scaffold: tiers come from each domain and the target never changes", () => {
  const item = PACK.guided[0];
  const a = scaffoldFor(item, { Listening: "ee", Speaking: "ee", Reading: "ee", Writing: "ee" });
  const b = scaffoldFor(item, { Listening: "ee", Speaking: "ee", Reading: "ee", Writing: "exp" });
  assert.equal(a.target.prompt, b.target.prompt);
  assert.equal(a.byId.frames.tier, "ee");
  assert.equal(b.byId.frames.tier, "exp");
  assert.equal(b.byId.directions.tier, "ee");
  const d = diffScaffold(a, b);
  assert.ok(d.changed.some((c) => c.id === "frames"));
  assert.ok(d.changed.some((c) => c.id === "independence"));
  assert.ok(d.same.includes("The learning target"));
  assert.ok(d.same.some((s) => s.startsWith("Instructions")));
  assert.ok(!d.changed.some((c) => c.id === "directions"));
  assert.equal(diffScaffold(a, a).changed.length, 0);
  assert.equal(a.facets.length, FACETS.length);
  assert.match(describeTier("br").summary, /Bridging/);
  assert.equal(describeTier("nope"), null);
});

test("scaffold: independent per-domain choices drive the right facets", () => {
  const item = PACK.guided[1];
  const s = scaffoldFor(item, { Listening: "br", Speaking: "ee", Reading: "dev", Writing: "dev" });
  assert.equal(s.byId.oral.tier, "ee");
  assert.equal(s.byId.directions.tier, "br");
  assert.equal(s.byId.vocab.tier, "dev");
  assert.equal(s.byId.oral.content.count, 1);
});

test("scaffold: class recommendation uses counts only and always leaves the teacher in charge", () => {
  const r = recommendTiersFromClass({
    proficiency: { ee: 3, dev: 9, exp: 6, br: 1 },
    proficiencyMode: "count",
    domainTiers: { Listening: "mixed", Speaking: "ee", Reading: "mixed", Writing: "mixed" },
  });
  assert.equal(r.primary, "dev");
  assert.equal(r.perDomain.Speaking, "ee");
  assert.equal(r.perDomain.Writing, "dev");
  assert.deepEqual(r.alsoPrepare, ["exp"]);
  assert.match(r.rationale, /starting point/);
  const none = recommendTiersFromClass({ proficiency: { ee: 0, dev: 0, exp: 0, br: 0 } });
  assert.equal(none.primary, "dev");
  assert.match(none.rationale, /no support-level counts/i);
});

const att = (tier, items, extra = {}) => ({
  v: 1,
  aid: "a1",
  eng: "concept-builder",
  tier,
  items,
  ...extra,
});
const ok1 = (id) => ({ id, tries: 1, hints: 0, ok: true, tags: [] });

test("fade suggestion needs 3 independent attempts and only suggests", () => {
  const indep = att("ee", [ok1("1"), ok1("2"), ok1("3"), ok1("4")]);
  assert.equal(fadeSuggestion([indep, indep]).action, "keep");
  const f = fadeSuggestion([indep, indep, indep]);
  assert.equal(f.action, "lighten");
  assert.equal(f.to, "dev");
  assert.equal(f.teacherDecides, true);
  assert.equal(
    fadeSuggestion([att("br", [ok1("1")]), att("br", []), att("br", [])]).action,
    "keep",
  );
  const hinted = att("ee", [
    { id: "1", tries: 2, hints: 1, ok: true, tags: [] },
    ok1("2"),
    ok1("3"),
  ]);
  assert.equal(fadeSuggestion([hinted, hinted, hinted]).action, "keep");
});

test("dashboard: nothing renders below 3 attempts, and every statement carries its n", () => {
  const hinted = att("ee", [
    { id: "vocab-1", tries: 2, hints: 2, ok: true, tags: ["adds-instead"] },
    { id: "reason-1", tries: 3, hints: 1, ok: false, tags: ["adds-instead"] },
  ]);
  const two = summarizeEvidence([hinted, hinted]);
  assert.equal(two.n, 2);
  assert.equal(two.statements.length, 0);
  assert.equal(two.moves.length, 0);
  assert.equal(two.tags[0].enough, false);
  const three = summarizeEvidence([hinted, hinted, hinted]);
  assert.ok(three.statements.some((s) => s.id === "hints"));
  for (const s of three.statements) {
    assert.ok(s.n >= MIN_N, s.id);
    assert.ok(typeof s.of === "number");
  }
  assert.ok(three.statements.find((s) => s.id === "hints").text.includes("3 of 3"));
  assert.ok(three.statements.some((s) => s.id === "tag-adds-instead"));
});

test("dashboard: evidence and reasoning missed more than vocabulary", () => {
  const a = att("dev", [
    { id: "vocab-a", tries: 1, hints: 0, ok: true, tags: [] },
    { id: "evidence-1", tries: 3, hints: 0, ok: false, tags: [] },
    { id: "reason-1", tries: 3, hints: 0, ok: false, tags: [] },
  ]);
  const s = summarizeEvidence([a, a, a, a]);
  const st = s.statements.find((x) => x.id === "evr-over-vocab");
  assert.ok(st);
  assert.match(st.text, /8 of 8 missed in 4 attempts/);
  assert.match(st.text, /0 of 4 missed in 4 attempts/);
  assert.ok(s.moves.some((m) => m.id === "small-group" && m.action.hash.startsWith("#/create")));
  // only two attempts contain vocabulary items: no comparison statement
  const mixed = [a, a, att("dev", [{ id: "evidence-1", tries: 3, hints: 0, ok: false, tags: [] }])];
  assert.ok(!summarizeEvidence(mixed).statements.some((x) => x.id.includes("over")));
  // a resolver from activity data wins over id guesses
  const r = summarizeEvidence([a, a, a], {
    resolveKind: (_a, i) => (i.id === "vocab-a" ? "evidence" : "vocabulary"),
  });
  assert.ok(r.statements.some((x) => x.id === "vocab-over-evr" || x.id === "evr-over-vocab"));
});

test("dashboard: per-domain breakdown shows n and hides rates below 3", () => {
  const w = (aid, ok) =>
    att("dev", [{ id: "q1", tries: 1, hints: 0, ok, tags: [] }], { aid, eng: "wida-studio" });
  const s = summarizeEvidence([
    w("wida-listening-x", true),
    w("wida-listening-x", true),
    w("wida-listening-x", false),
    w("wida-reading-y", true),
  ]);
  const l = s.domains.find((d) => d.domain === "Listening");
  const r = s.domains.find((d) => d.domain === "Reading");
  assert.equal(l.n, 3);
  assert.equal(l.enough, true);
  assert.equal(r.n, 1);
  assert.equal(r.enough, false);
});

test("evidence code encode/decode round trip keeps data and drops anything identifying", () => {
  const original = att(
    "exp",
    [{ id: "q1", tries: 2, hints: 1, ok: true, tags: ["a", "b"], name: "SHOULD NOT SURVIVE" }],
    {
      lesson: "fixture-g6-ratio-tables",
      t: "2026-11-23T10:00:00.000Z",
      reflection: "I used a table — it helped. ¿Por qué?",
      studentName: "Nope",
    },
  );
  const code = encodeCode(original);
  assert.match(code, /^LPE1\.[A-Za-z0-9_-]+$/);
  const back = decodeCode(code);
  assert.equal(back.aid, "a1");
  assert.equal(back.tier, "exp");
  assert.equal(back.reflection, original.reflection);
  assert.deepEqual(back.items[0], { id: "q1", tries: 2, hints: 1, ok: true, tags: ["a", "b"] });
  assert.ok(
    !JSON.stringify(back).includes("SHOULD NOT SURVIVE") && !JSON.stringify(back).includes("Nope"),
  );
  assert.throws(() => decodeCode("not a code"), /not an evidence code/);
  assert.throws(() => decodeCode("LPE1.e30"), /damaged/);
});

test("assessment entries validate, group by year, and compute nothing", () => {
  const good = validateAssessment(
    {
      type: "ACCESS",
      year: 2026,
      domain: "Reading",
      valueKind: "level",
      value: "3.4",
      source: "Class summary from the district report",
    },
    { nowYear: 2026 },
  );
  assert.ok(good.ok, JSON.stringify(good.errors));
  assert.ok(
    !validateAssessment(
      {
        type: "ACCESS",
        year: 2026,
        domain: "Reading",
        valueKind: "level",
        value: "7.5",
        source: "x",
      },
      { nowYear: 2026 },
    ).ok,
  );
  assert.ok(
    !validateAssessment(
      {
        type: "MODEL",
        year: 1999,
        domain: "Reading",
        valueKind: "scale",
        value: "300",
        source: "x",
      },
      { nowYear: 2026 },
    ).ok,
  );
  assert.ok(
    !validateAssessment(
      {
        type: "MODEL",
        year: 2026,
        domain: "Reading",
        valueKind: "scale",
        value: "Maria",
        source: "x",
      },
      { nowYear: 2026 },
    ).ok,
  );
  assert.ok(
    !validateAssessment(
      {
        type: "MODEL",
        year: 2026,
        domain: "Reading",
        valueKind: "scale",
        value: "300",
        source: "",
      },
      { nowYear: 2026 },
    ).ok,
  );
  const groups = groupAssessments([
    good.entry,
    { ...good.entry, year: 2025, domain: "Writing" },
    { ...good.entry, domain: "Listening" },
  ]);
  assert.deepEqual(
    groups.map((g) => g.year),
    [2026, 2025],
  );
  assert.deepEqual(
    groups[0].rows.map((r) => r.domain),
    ["Listening", "Reading"],
  );
  assert.ok(!("delta" in groups[0]) && !("trend" in groups[0]));
  assert.match(ASSESS_CAUTION, /not directly comparable/);
});

test("remix keeps the teacher's text exactly, including quotes and math notation", () => {
  const src =
    'The author wrote "6 ÷ (1/2) = 12" on the board. Then 3.5 × 2 = 7.0! Is x² + 3x - 4 = 0 true?';
  const draft = buildEvidenceInvestigation(src, {
    question: "What did the author write?",
    claims: ["She wrote a division fact."],
  });
  assert.ok(textPreserved(src, draft));
  assert.equal(draft.evidence.map((e) => e.text).join(" "), src);
  assert.ok(draft.evidence[0].text.includes('"6 ÷ (1/2) = 12"'));
  assert.ok(evidenceProblems(draft).length >= 1);
  draft.evidence[0].use = true;
  assert.match(evidenceProblems(draft).join(" "), /which claim/);
  draft.evidence[0].supports = "c1";
  assert.equal(evidenceProblems(draft).length, 0);
  for (const t of ["vocab-cards", "discussion"]) {
    const d = buildDraft(t, src, { grade: "6", subject: "math", collections: [] });
    assert.ok(textPreserved(src, d), t);
    assert.equal(d.source, src);
  }
});

test("remix vocabulary cards fill only from studio collections and need confirmation", () => {
  const d = buildVocabCards(byId["68-math"].text, {
    grade: "6",
    subject: "math",
    collections: [VOCAB],
    extraTerms: ["quantities"],
  });
  const ratioCard = d.cards.find((c) => c.word === "unit rate");
  assert.ok(ratioCard);
  assert.equal(ratioCard.def, "A rate with 1 as the second quantity.");
  assert.equal(ratioCard.defFrom, VOCAB.id);
  assert.equal(ratioCard.confirmed, false);
  const unknown = d.cards.find((c) => c.word === "quantities");
  assert.equal(unknown.def, "");
  assert.equal(unknown.defFrom, "");
  assert.equal(confirmedCards(d).length, 0);
  ratioCard.confirmed = true;
  unknown.confirmed = true;
  assert.deepEqual(
    confirmedCards(d).map((c) => c.word),
    ["unit rate"],
  );
  assert.ok(
    d.cards.every((c) => !c.contextSentence || byId["68-math"].text.includes(c.contextSentence)),
  );
});

test("remix exit ticket and language objective come from the objective's own words", () => {
  const e = buildExitTicket("I can compare ratios using tables.");
  assert.equal(e.prompt, "Compare ratios using tables.");
  assert.equal(e.functionLabel, "Compare and contrast");
  assert.ok(e.criteria.length >= 3);
  assert.equal(e.itemText, "");
  const l = buildLanguageObjectives("I can compare ratios using tables.");
  assert.ok(l.suggestions[0].startsWith("I can compare ratios using tables"));
  assert.equal(l.klu, "Inform");
});

test("fixture activities and lesson pack are consistent", () => {
  for (const a of PACK.activities) assert.ok(ACTIVITIES[a.id]);
  assert.ok(!/\p{Extended_Pictographic}/u.test(JSON.stringify(PACK)));
});
