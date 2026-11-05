// The Science Investigation Lab: content contract and engine rules.
//
//   node --test tools/access-science-lab.test.mjs
//
// The engine is pure (src/lang/science-lab*.js); these tests drive it with the real case content so an edit that
// breaks a rule, leaks an answer into help, or lets learner text reach the ledger fails here.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  BANDS,
  CASES,
  STAGE_META,
  STAGES,
  TRANSFER_STAGE,
} from "../access-practice-lab/src/content/science-lab.js";
import { appendEntry, makeEntry } from "../access-practice-lab/src/lang/ledger.js";
import {
  caseFor,
  caseState,
  checkClaim,
  checkHypothesis,
  checkPlan,
  checkQuestion,
  checkReasoning,
  checkRevision,
  emptyState,
  noteHelp,
  parseState,
  progress,
  reflectionPrompts,
  SCIENCE_LAB_KEY,
  setSupport,
  stageStatus,
  toLedgerEntries,
  updateStage,
  workKind,
} from "../access-practice-lab/src/lang/science-lab.js";
import { ASKS, ask } from "../access-practice-lab/src/lang/science-lab-asks.js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
const ICE = CASES["6-8"][0];
const SOIL = CASES["3-5"][0];
const ALL_CASES = [ICE, SOIL];

// ── helpers ──────────────────────────────────────────────────────────────────

/** Every {en, es} pair anywhere under a value, with its path. */
function pairs(value, path = "") {
  const out = [];
  if (Array.isArray(value)) value.forEach((v, i) => out.push(...pairs(v, `${path}[${i}]`)));
  else if (value && typeof value === "object") {
    if (typeof value.en === "string" && typeof value.es === "string")
      out.push({ path, en: value.en, es: value.es });
    for (const [k, v] of Object.entries(value))
      if (k !== "en" && k !== "es") out.push(...pairs(v, `${path}.${k}`));
  }
  return out;
}

const SAME_IN_BOTH = new Set(["variable"]);
const SPANISH_WORDS =
  /\b(el|la|los|las|de|del|que|en|un|una|tu|tus|su|cada|ese|para|con|y|se|es|por|al|lo|me|va|voy|a)\b|[¿¡áéíóúñ]/i;

/** Learner-visible strings only (engine `match` lists and ids are not shown). */
function learnerPairs(c) {
  return pairs(c).filter((p) => !/\.match\./.test(p.path) && !/\.match$/.test(p.path));
}

const fold = (s) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const words = (t) => fold(t).match(/[a-z0-9']+/g) || [];
/** Every run of four consecutive words (the technique from access-living-studio.test.mjs). */
const runs = (t) => {
  const w = words(t);
  return new Set(w.slice(0, -3).map((_, i) => w.slice(i, i + 4).join(" ")));
};

/** Private model answers. They live only in this test and must never appear in learner-facing content. */
const MODEL = {
  "6-8": {
    claims: [
      "Wool cloth kept the ice frozen the longest.",
      "Three layers of wool kept the ice frozen longer than one layer of wool.",
      "More layers of cover keep the ice frozen longer because the layers slow the heat.",
      "Foil melted the fastest and wool lasted the longest.",
      "La tela de lana mantuvo el hielo congelado por más tiempo.",
      "Tres capas de lana mantuvieron el hielo congelado más tiempo que una capa.",
    ],
    winners: ["wool", "lana"],
  },
  "3-5": {
    claims: [
      "Garden soil helped the bean seeds sprout the fastest.",
      "The garden soil with four spoons of water sprouted in the fewest days.",
      "Clay soil with more water was the slowest to sprout.",
      "La tierra de jardín hizo que las semillas brotaran más rápido.",
      "La tierra de jardín con cuatro cucharadas de agua brotó en menos días.",
    ],
    winners: ["garden soil", "tierra de jardin"],
  },
};

const leaks = (text, band) => {
  const bad = new Set(MODEL[band].claims.flatMap((c) => [...runs(c)]));
  return [...runs(text)].filter((r) => bad.has(r));
};

/** Text that must never state an answer: help, vocabulary, phenomenon, stage tasks, transfer prompts. */
function guidedText(c) {
  const out = [];
  for (const items of Object.values(c.help)) for (const h of items) out.push(h.text.en, h.text.es);
  for (const v of c.vocab) out.push(v.term.en, v.term.es, v.meaning.en, v.meaning.es);
  out.push(c.phenomenon.en, c.phenomenon.es, c.question.en, c.question.es);
  for (const m of Object.values(STAGE_META)) out.push(m.task.en, m.task.es, m.title.en, m.title.es);
  return out;
}

/** Transfer text describes a different dataset, so it is held to the answer rules but not to this case's data values. */
const transferText = (c) => [
  c.transfer.phenomenon.en,
  c.transfer.phenomenon.es,
  c.transfer.prompt.en,
  c.transfer.prompt.es,
];

const walkNumbers = (v, path = "") =>
  v && typeof v === "object"
    ? Object.entries(v).flatMap(([k, x]) => walkNumbers(x, `${path}.${k}`))
    : typeof v === "number"
      ? [path]
      : [];

/** Spans the learner could have written: strings passed to a check. */
function assertNotes(result, fields, label) {
  assert.equal(typeof result.ok, "boolean", `${label}: ok is boolean`);
  assert.ok(Array.isArray(result.notes), `${label}: notes array`);
  assert.equal(result.ok, result.notes.length === 0, `${label}: ok matches notes`);
  const any = fields.some((f) => typeof f === "string" && f.trim());
  for (const n of result.notes) {
    assert.deepEqual(Object.keys(n).sort(), ["ask", "id", "quote"], `${label}: note keys`);
    assert.equal(typeof n.id, "string");
    assert.ok(n.ask.length > 10 && n.ask.endsWith("?"), `${label}: ask is a question: ${n.ask}`);
    assert.ok(
      fields.some((f) => typeof f === "string" && f.includes(n.quote)),
      `${label}: quote "${n.quote}" is from the input`,
    );
    if (any && n.id !== "no-change")
      assert.ok(n.quote === "" || n.quote.trim() !== "", `${label}: quote has content`);
    assert.ok(!SCORE_CLAIM.test(n.ask), `${label}: ask makes no score claim`);
    assert.ok(
      !/\b(score|level|percent|percentage|grade|rating)\b|%|out of \d/i.test(n.ask),
      `${label}: ask has no score word`,
    );
  }
  assert.deepEqual(walkNumbers(result), [], `${label}: no number-valued field (no score)`);
  assert.ok(!Object.keys(result).some((k) => /score|level|percent|rating|prediction/i.test(k)));
}

const q = (t, c = ICE, lang = "en") => checkQuestion(t, c, lang);
const ids = (r) => r.notes.map((n) => n.id);

// ── content ──────────────────────────────────────────────────────────────────

test("two bands, twelve stages in the contract order, model-free stage metadata", () => {
  assert.deepEqual(BANDS.sort(), ["3-5", "6-8"]);
  assert.deepEqual(STAGES, [
    "notice",
    "question",
    "hypothesis",
    "plan",
    "collect",
    "represent",
    "claim",
    "evidence",
    "reasoning",
    "revise",
    "present",
    "reflect",
  ]);
  assert.equal(TRANSFER_STAGE, "transfer");
  assert.deepEqual(Object.keys(STAGE_META), STAGES);
  for (const s of STAGES) {
    const m = STAGE_META[s];
    assert.deepEqual(
      Object.keys(m).sort(),
      ["domain", "klu", "task", "title"],
      `${s} keys: no model or key field`,
    );
    assert.equal(m.domain, s === "present" ? "Speaking" : "Writing", `${s} domain`);
    assert.ok(["Narrate", "Inform", "Explain", "Argue"].includes(m.klu), `${s} Key Language Use`);
  }
  assert.equal(SCIENCE_LAB_KEY, "accessPracticeLab:v1:science-lab");
});

test("both cases are complete in English and Spanish, with honest sample data", () => {
  assert.equal(CASES["6-8"].length, 1);
  assert.equal(CASES["3-5"].length, 1);
  assert.deepEqual([ICE.id, SOIL.id], ["ice-cover", "soil-sprout"]);
  for (const c of ALL_CASES) {
    assert.ok(CASES[c.band].includes(c));
    assert.ok(c.vocab.length >= 4, `${c.id} vocab`);
    assert.ok(c.variables.length === 2, `${c.id} has two variables`);
    assert.ok(
      c.variables.some((v) => v.id === c.focus),
      `${c.id} focus names a variable`,
    );
    for (const p of learnerPairs(c)) {
      assert.ok(p.en.trim() && p.es.trim(), `${c.id}${p.path}: empty string`);
      if (!SAME_IN_BOTH.has(p.en.toLowerCase()) && /[a-z]{3}/i.test(p.en))
        assert.notEqual(p.en, p.es, `${c.id}${p.path}: Spanish equals English`);
      if (p.en.split(/\s+/).length >= 5 && !p.en.includes("___"))
        assert.match(p.es, SPANISH_WORDS, `${c.id}${p.path}: Spanish reads as Spanish`);
    }
    for (const v of c.variables) {
      assert.ok(v.match.en.length && v.match.es.length, `${c.id}/${v.id} match words`);
      for (const val of v.values)
        assert.ok(val.match.en.length && val.match.es.length, `${c.id}/${val.id} match words`);
    }
    assert.match(c.dataset.note.en, /classroom sample data/i);
    assert.match(c.dataset.note.es, /datos de muestra/i);
    assert.match(c.dataset.note.en, /not from a real experiment/i);
    assert.ok(
      c.transfer.prompt.en.length > 40 && c.transfer.prompt.es.length > 40,
      `${c.id} transfer prompt`,
    );
  }
  assert.equal(ICE.question.en, "Which cover keeps ice frozen longest?");
  assert.equal(SOIL.question.en, "Which soil helps bean seeds sprout fastest?");
});

test("datasets are fair-test shaped: every combination run, one noisy repeat, values reference the variables", () => {
  for (const c of [...ALL_CASES, ICE.transfer, SOIL.transfer]) {
    const rows = c.dataset.rows;
    assert.equal(new Set(rows.map((r) => r.id)).size, rows.length, `${c.id} row ids unique`);
    for (const r of rows) {
      assert.ok(
        Number.isFinite(r.measures[c.measure.id]) && r.measures[c.measure.id] > 0,
        `${c.id}/${r.id} measure`,
      );
      for (const v of c.variables)
        assert.ok(
          v.values.some((x) => x.id === r.conditions[v.id]),
          `${c.id}/${r.id} ${v.id} is a declared value`,
        );
    }
    const combos = new Set(rows.map((r) => JSON.stringify(r.conditions)));
    const need = c.variables.reduce((n, v) => n * v.values.length, 1);
    assert.equal(combos.size, need, `${c.id} runs every combination`);
  }
  for (const c of ALL_CASES) {
    assert.ok(
      c.variables[0].values.length >= 3 && c.variables[1].values.length >= 2,
      `${c.id} 3 x 2 conditions`,
    );
    const byCondition = new Map();
    for (const r of c.dataset.rows) {
      const k = JSON.stringify(r.conditions);
      byCondition.set(k, [...(byCondition.get(k) || []), r.measures[c.measure.id]]);
    }
    const repeats = [...byCondition.values()].filter((v) => v.length > 1);
    assert.ok(repeats.length >= 1, `${c.id} has a repeated condition`);
    assert.ok(
      repeats.every((v) => new Set(v).size === v.length),
      `${c.id} repeats are not identical (noisy)`,
    );
  }
});

test("three help items per stage per case, bilingual, one kind each, unique ids", () => {
  for (const c of ALL_CASES) {
    assert.deepEqual(Object.keys(c.help), STAGES);
    const seen = new Set();
    for (const stage of STAGES) {
      assert.equal(c.help[stage].length, 3, `${c.id}/${stage} has three help items`);
      for (const h of c.help[stage]) {
        assert.ok(["frame", "word", "prompt"].includes(h.kind), `${h.id} kind`);
        assert.ok(
          h.text.en.trim() && h.text.es.trim() && h.text.en !== h.text.es,
          `${h.id} bilingual`,
        );
        assert.ok(!seen.has(h.id), `${h.id} unique`);
        seen.add(h.id);
        assert.ok(h.id.startsWith(`${stage}-`));
      }
    }
  }
});

test("help and guided text never state an answer, a winning condition, or a data value", () => {
  assert.ok(
    leaks("Wool cloth kept the ice frozen the longest.", "6-8").length,
    "detector catches a leak",
  );
  assert.ok(
    leaks("La tierra de jardín hizo que las semillas brotaran más rápido.", "3-5").length,
    "detector catches a Spanish leak",
  );
  for (const c of ALL_CASES) {
    for (const text of guidedText(c)) {
      assert.deepEqual(leaks(text, c.band), [], `${c.id}: repeats a model answer: ${text}`);
      for (const w of MODEL[c.band].winners)
        assert.ok(
          !new RegExp(`\\b${w}\\b`).test(fold(text)),
          `${c.id}: names the winning condition "${w}" in: ${text}`,
        );
      for (const r of c.dataset.rows) {
        const n = String(r.measures[c.measure.id]);
        if (n.length >= 2)
          assert.ok(
            !new RegExp(`\\b${n}\\b`).test(text),
            `${c.id}: states data value ${n} in: ${text}`,
          );
      }
    }
    for (const text of transferText(c)) {
      assert.deepEqual(
        leaks(text, c.band),
        [],
        `${c.id}: transfer text repeats a model answer: ${text}`,
      );
      for (const w of MODEL[c.band].winners)
        assert.ok(!new RegExp(`\\b${w}\\b`).test(fold(text)), `${c.id}: transfer names "${w}"`);
    }
    for (const items of Object.values(c.help))
      for (const h of items)
        if (h.kind === "frame") assert.match(h.text.en, /___/, `${h.id} frame has a blank to fill`);
  }
});

test("no content, ask or reflection text makes a score, level or proficiency claim", () => {
  assert.ok(
    !SCORE_CLAIM.test(JSON.stringify(CASES)),
    `content: ${JSON.stringify(CASES).match(SCORE_CLAIM)?.[0]}`,
  );
  const prompts = reflectionPrompts({
    helpUsed: ["claim:claim-1"],
    stages: { revise: { a: 1 }, transfer: { a: 1 } },
  });
  for (const text of [
    ...Object.values(ASKS).flatMap((a) => [a.en, a.es]),
    ...prompts.flatMap((p) => [p.text.en, p.text.es]),
  ]) {
    assert.ok(!SCORE_CLAIM.test(text), `claim in: ${text}`);
    assert.ok(
      !/\b(score|level|percent|percentage|nivel|puntaje|porcentaje)\b|%/i.test(text),
      `score word in: ${text}`,
    );
  }
});

test("every ask is a question in both languages and every token is filled", () => {
  const vars = { measure: "m", focus: "f", variable: "v", number: "9", n: 2, a: "a", b: "b" };
  for (const id of Object.keys(ASKS)) {
    const en = ask(id, "en", vars);
    const es = ask(id, "es", vars);
    assert.ok(en.endsWith("?") && !/[{}]/.test(en), `en ${id}`);
    assert.ok(es.includes("¿") && es.endsWith("?") && !/[{}]/.test(es), `es ${id}`);
    assert.notEqual(en, es);
  }
  assert.equal(ask("nope", "en"), "");
});

// ── state ────────────────────────────────────────────────────────────────────

test("parseState survives null, strings, arrays, garbage and older shapes", () => {
  const garbageCase = {
    v: 1,
    bands: {
      "6-8": { cases: { "ice-cover": { support: "Z", stages: [], helpUsed: "x" }, "bad id!": {} } },
    },
  };
  const cyc = { v: 1, bands: { "6-8": { cases: { "ice-cover": { stages: { claim: {} } } } } } };
  cyc.bands["6-8"].cases["ice-cover"].stages.claim.self = cyc;
  const inputs = [
    null,
    undefined,
    "",
    "not json",
    "[]",
    "42",
    "true",
    "null",
    [],
    [1, 2],
    7,
    true,
    {},
    { v: 0 },
    { v: 2, bands: {} },
    { v: 1 },
    { v: 1, bands: [] },
    { v: 1, bands: "x" },
    { v: 1, bands: { "6-8": { support: "A", tasks: { listen: {} } } } },
    { v: 1, bands: { "6-8": { cases: [] }, "9-12": { cases: {} }, "3-5": null } },
    garbageCase,
    '{"v":1,"bands":{"__proto__":{"polluted":1},"6-8":{"cases":{"__proto__":{"polluted":1},"ice-cover":{"stages":{"claim":{"__proto__":{"polluted":1},"text":"ok"}}}}}}}',
    cyc,
  ];
  for (const raw of inputs) {
    let s;
    assert.doesNotThrow(
      () => {
        s = parseState(raw);
      },
      `parseState(${String(raw).slice(0, 30)})`,
    );
    assert.equal(s.v, 1);
    assert.equal(typeof s.bands, "object");
    for (const b of Object.keys(s.bands)) assert.ok(BANDS.includes(b));
  }
  assert.equal({}.polluted, undefined, "no prototype pollution");
  assert.deepEqual(parseState("not json"), emptyState());
  assert.deepEqual(parseState({ v: 2, bands: {} }), emptyState());
  const fixed = parseState(garbageCase);
  assert.equal(fixed.bands["6-8"].cases["ice-cover"].support, "A");
  assert.deepEqual(fixed.bands["6-8"].cases["ice-cover"].helpUsed, []);
  assert.deepEqual(Object.keys(fixed.bands["6-8"].cases), ["ice-cover"]);
});

test("state updates merge, never mutate, round-trip through JSON, and bound what they keep", () => {
  const s0 = emptyState();
  let s = updateStage(s0, "6-8", "ice-cover", "question", { text: "Which cover is best?" });
  s = updateStage(s, "6-8", "ice-cover", "question", { checked: true });
  assert.deepEqual(s0, emptyState(), "input state not mutated");
  assert.deepEqual(caseState(s, "6-8", "ice-cover").stages.question, {
    text: "Which cover is best?",
    checked: true,
  });
  s = setSupport(s, "6-8", "ice-cover", "C");
  s = setSupport(s, "6-8", "ice-cover", "Z");
  s = noteHelp(s, "6-8", "ice-cover", "claim", "claim-1");
  s = noteHelp(s, "6-8", "ice-cover", "claim", "claim-1");
  const cs = caseState(s, "6-8", "ice-cover");
  assert.equal(cs.support, "C");
  assert.deepEqual(cs.helpUsed, ["claim:claim-1"]);
  assert.equal(cs.stages.question.text, "Which cover is best?", "support and help keep the work");
  assert.deepEqual(parseState(JSON.stringify(s)), s, "round trip");
  assert.deepEqual(parseState(s), s, "object round trip");
  // invalid targets leave the state alone
  for (const bad of [
    updateStage(s, "9-12", "ice-cover", "claim", { a: 1 }),
    updateStage(s, "6-8", "../x", "claim", { a: 1 }),
    updateStage(s, "6-8", "ice-cover", "nope", { a: 1 }),
    updateStage(s, "6-8", "ice-cover", "claim", "text"),
    noteHelp(s, "6-8", "ice-cover", "claim", "bad id!"),
    setSupport(s, "6-8", "ice-cover", "D"),
  ])
    assert.deepEqual(bad, s);
  const big = updateStage(emptyState(), "3-5", "soil-sprout", "claim", {
    text: "x".repeat(100000),
    __proto__: { bad: 1 },
  });
  assert.ok(caseState(big, "3-5", "soil-sprout").stages.claim.text.length <= 6000);
  assert.ok(Array.isArray(caseState(null, "6-8", "ice-cover").helpUsed));
});

test("status and progress follow saved work", () => {
  let s = emptyState();
  assert.equal(progress(caseState(s, "6-8", "ice-cover")).next, "notice");
  s = updateStage(s, "6-8", "ice-cover", "notice", { text: "x" });
  assert.equal(stageStatus(caseState(s, "6-8", "ice-cover"), "notice"), "started");
  s = updateStage(s, "6-8", "ice-cover", "notice", { done: true });
  const p = progress(caseState(s, "6-8", "ice-cover"));
  assert.deepEqual([p.done, p.next, p.steps.length, p.transfer], [1, "question", 12, "new"]);
  for (const st of STAGES) s = updateStage(s, "6-8", "ice-cover", st, { done: true });
  assert.deepEqual(
    [
      progress(caseState(s, "6-8", "ice-cover")).done,
      progress(caseState(s, "6-8", "ice-cover")).next,
    ],
    [12, null],
  );
});

test("supported vs independent: any help is supported; a help-free transfer is independent", () => {
  let s = emptyState();
  const get = () => caseState(s, "6-8", "ice-cover");
  assert.equal(workKind(get(), "claim"), "supported", "support A is supported");
  s = setSupport(s, "6-8", "ice-cover", "B");
  assert.equal(workKind(get(), "claim"), "supported", "support B is supported");
  s = setSupport(s, "6-8", "ice-cover", "C");
  assert.equal(workKind(get(), "claim"), "independent", "on my own, no help");
  for (const c of ALL_CASES) {
    let t = setSupport(emptyState(), c.band, c.id, "C");
    for (const stage of STAGES) {
      assert.equal(workKind(caseState(t, c.band, c.id), stage), "independent");
      t = noteHelp(t, c.band, c.id, stage, c.help[stage][0].id);
      assert.equal(
        workKind(caseState(t, c.band, c.id), stage),
        "supported",
        `${c.id}/${stage}: opening help marks it supported`,
      );
    }
  }
  s = noteHelp(s, "6-8", "ice-cover", "claim", "claim-2");
  assert.equal(workKind(get(), "claim"), "supported");
  assert.equal(
    workKind(get(), "evidence"),
    "independent",
    "help on one stage does not taint another",
  );
  s = setSupport(s, "6-8", "ice-cover", "A");
  assert.equal(
    workKind(get(), TRANSFER_STAGE),
    "independent",
    "transfer with all help closed is independent, even after guided work",
  );
  s = noteHelp(s, "6-8", "ice-cover", TRANSFER_STAGE, "claim-1");
  assert.equal(
    workKind(get(), TRANSFER_STAGE),
    "supported",
    "any help on transfer makes it supported",
  );
  assert.equal(workKind(null, "claim"), "supported");
  assert.equal(caseFor(ICE, TRANSFER_STAGE), ICE.transfer);
  assert.equal(caseFor(ICE, "claim"), ICE);
});

// ── the checks ───────────────────────────────────────────────────────────────

const GOOD = {
  question: [
    [ICE, "Which cover keeps ice frozen the longest?"],
    [ICE, "How does the number of layers change how many minutes the ice takes to melt?"],
    [ICE, "Does a thicker cover keep the ice frozen longer?"],
    [SOIL, "Which soil makes bean seeds sprout in the fewest days?"],
    [SOIL, "How does the amount of water change how many days a seed takes to sprout?"],
    [ICE.transfer, "Which cup keeps the cocoa warm for more minutes?"],
  ],
  hypothesis: [
    [
      ICE,
      "If I add more layers of paper towel, then the ice will melt more slowly because the layers slow warm air.",
    ],
    [ICE, "I predict thicker covers make the ice last longer because they trap more air."],
    [
      SOIL,
      "If I give the seeds more water, then they will sprout sooner because seeds need water.",
    ],
  ],
  claim: [
    [ICE, "Wool kept the ice frozen longer than foil and paper towel."],
    [ICE, "Three layers of wool cloth kept ice frozen longest."],
    [SOIL, "Garden soil helped bean seeds sprout in the fewest days compared with sand and clay."],
    [SOIL, "Garden soil helped seeds sprout faster than sand."],
    [ICE.transfer, "Foam cups kept the cocoa warm longer than paper cups."],
  ],
};

test("checkQuestion tells a testable question from yes/no, opinion and non-questions", () => {
  for (const [c, text] of GOOD.question) {
    const r = q(text, c);
    assert.deepEqual(ids(r), [], `${text}`);
    assert.ok(r.ok);
    assertNotes(r, [text], text);
  }
  const bad = [
    ["Does wool keep ice frozen?", "yes-no"],
    ["Is ice cold?", "yes-no"],
    ["Which cover is the prettiest?", "opinion"],
    ["What is your favorite cover?", "opinion"],
    ["Wool is the best cover.", "not-question"],
    ["Which cover is best?", "no-measure"],
    ["How long does it take to melt?", "no-variable"],
    ["Why is the sky blue?", "no-variable"],
  ];
  for (const [text, id] of bad) {
    const r = q(text);
    assert.ok(!r.ok && ids(r).includes(id), `${text} -> ${id}, got ${ids(r)}`);
    assertNotes(r, [text], text);
  }
  const es = q(
    "¿Cómo cambia el número de capas el tiempo que tarda en derretirse el hielo?",
    ICE,
    "es",
  );
  assert.ok(es.ok, `Spanish question: ${ids(es)}`);
  const esBad = q("¿Es la lana buena?", ICE, "es");
  assert.ok(!esBad.ok && /¿/.test(esBad.notes[0].ask), "Spanish note asks in Spanish");
  assertNotes(esBad, ["¿Es la lana buena?"], "es");
});

test("checkHypothesis wants an if/then or because structure, a variable and a direction", () => {
  for (const [c, text] of GOOD.hypothesis) {
    const r = checkHypothesis(text, c);
    assert.deepEqual(ids(r), [], text);
    assertNotes(r, [text], text);
  }
  const bad = [
    ["I think it will be cool.", ["no-structure", "no-variable", "no-direction"]],
    ["If I use wool, then something happens.", ["no-direction"]],
    ["Ice melts because it is warm.", ["no-variable"]],
  ];
  for (const [text, want] of bad) {
    const r = checkHypothesis(text, ICE);
    for (const id of want) assert.ok(ids(r).includes(id), `${text} -> ${id}, got ${ids(r)}`);
    assertNotes(r, [text], text);
  }
  const es = checkHypothesis(
    "Si uso más capas de lana, entonces el hielo dura más tiempo porque la lana atrapa el calor.",
    ICE,
    "es",
  );
  assert.ok(es.ok, `Spanish hypothesis: ${ids(es)}`);
  assert.match(checkHypothesis("Creo que será bonito.", ICE, "es").notes[0].ask, /¿/);
});

test("checkPlan: exactly one changed variable, others held, a measure, repeated trials", () => {
  const good = {
    changed: ["cover"],
    held: ["layers"],
    measure: "I will time how many minutes until the cube is fully melted",
    trials: "3",
    steps: "Use the same tray each time.",
  };
  assert.deepEqual(checkPlan(good, ICE), { ok: true, notes: [] });
  assert.ok(checkPlan({ ...good, trials: 3 }, ICE).ok);
  assert.ok(checkPlan({ ...good, trials: "three" }, ICE).ok);
  assert.ok(
    checkPlan(
      {
        changed: ["soil"],
        held: ["water"],
        measure: "Count the days until a green shoot shows",
        trials: "2",
      },
      SOIL,
    ).ok,
  );
  assert.ok(
    checkPlan(
      {
        changed: ["cover"],
        held: ["layers"],
        measure: "Cuento los minutos hasta que se derrite",
        trials: "tres",
      },
      ICE,
      "es",
    ).ok,
  );
  const cases = [
    [{ ...good, changed: [], held: [] }, "change-none"],
    [{ ...good, changed: ["cover", "layers"], held: [] }, "change-many"],
    [{ ...good, held: [] }, "hold-missing"],
    [{ ...good, held: ["cover", "layers"] }, "hold-changed"],
    [{ ...good, measure: "" }, "measure-missing"],
    [{ ...good, measure: "see what happens" }, "measure-vague"],
    [{ ...good, trials: "1" }, "trials-few"],
    [{ ...good, trials: "" }, "trials-few"],
  ];
  for (const [plan, id] of cases) {
    const r = checkPlan(plan, ICE);
    assert.ok(!r.ok && ids(r).includes(id), `${id}: got ${ids(r)}`);
    assertNotes(r, [plan.measure, plan.steps, String(plan.trials ?? "")], id);
  }
  const names = checkPlan({ ...good, held: [] }, ICE);
  assert.match(
    names.notes.find((n) => n.id === "hold-missing").ask,
    /Thickness/,
    "names the part that is off",
  );
  assert.match(checkPlan({ ...good, held: [] }, ICE, "es").notes[0].ask, /¿/);
  for (const junk of [
    null,
    undefined,
    "plan",
    5,
    [],
    { changed: "cover" },
    { changed: ["zzz"], held: [1, null] },
    { changed: Array(500).fill("cover") },
  ]) {
    let r;
    assert.doesNotThrow(() => {
      r = checkPlan(junk, ICE);
    });
    assert.equal(r.ok, false);
    assertNotes(r, [""], "junk plan");
  }
});

test("checkClaim wants a claim that answers the question and names what was compared", () => {
  for (const [c, text] of GOOD.claim) {
    const r = checkClaim(text, c);
    assert.deepEqual(ids(r), [], text);
    assertNotes(r, [text], text);
  }
  const bad = [
    ["Covers are good.", ["no-condition", "no-outcome"]],
    ["I like wool.", ["no-compare", "no-outcome"]],
    ["Three layers lasted longer.", ["off-question"]],
    ["Wool is the best cover.", ["no-outcome"]],
    ["Wool and foil.", ["no-outcome"]],
  ];
  for (const [text, want] of bad) {
    const r = checkClaim(text, ICE);
    for (const id of want) assert.ok(ids(r).includes(id), `${text} -> ${id}, got ${ids(r)}`);
    assertNotes(r, [text], text);
  }
  const wrong = checkClaim("Foil kept the ice frozen the longest.", ICE);
  assert.deepEqual(ids(wrong), ["data-check"]);
  assert.ok(
    !/foil|wool|lana|aluminio/i.test(wrong.notes[0].ask),
    "the data check does not name the better condition",
  );
  assert.deepEqual(ids(checkClaim("Clay helped seeds sprout fastest.", SOIL)), ["data-check"]);
  assert.ok(
    checkClaim("Foil melted the fastest.", ICE).ok,
    "a true claim about the worst condition is not flagged",
  );
  assert.ok(
    checkClaim("Foil did not keep the ice frozen the longest.", ICE).ok,
    "negation is not flagged",
  );
  const es = checkClaim(
    "La tierra de jardín hizo que las semillas broten más rápido que la arena.",
    SOIL,
    "es",
  );
  assert.ok(es.ok, `Spanish claim: ${ids(es)}`);
  assert.match(checkClaim("Me gusta.", SOIL, "es").notes[0].ask, /¿/);
});

const R_GOOD = {
  claim: "Wool kept the ice frozen longer than foil.",
  evidenceIds: ["r5", "r1"],
  text: "Wool cloth with 1 layer lasted 71 minutes, but foil with 1 layer lasted only 34 minutes, so wool keeps ice frozen longer.",
};

test("checkReasoning: claim, chosen rows, a linking sentence tied to the data, numbers from the table", () => {
  const good = checkReasoning(R_GOOD, ICE);
  assert.deepEqual(ids(good), []);
  assertNotes(good, [R_GOOD.text, R_GOOD.claim], "good");
  assert.ok(
    checkReasoning(
      {
        ...R_GOOD,
        text: "Wool cloth lasted 118 minutes and foil lasted 41 minutes, which is 77 minutes longer, so wool is better at keeping ice frozen.",
        evidenceIds: ["r6", "r2", "r1"],
      },
      ICE,
    ).ok,
    "differences between rows are allowed",
  );
  assert.ok(
    checkReasoning(
      {
        ...R_GOOD,
        text: "The two wool trials with 3 layers were 118 and 126 minutes, a mean of 122, so wool keeps ice frozen longer than foil.",
        evidenceIds: ["r6", "r8", "r1"],
      },
      ICE,
    ).ok,
    "means of repeated trials are allowed",
  );
  const cases = [
    [{ ...R_GOOD, claim: "" }, "no-claim"],
    [{ ...R_GOOD, evidenceIds: [] }, "no-evidence"],
    [{ ...R_GOOD, evidenceIds: ["zz", "r99"] }, "no-evidence"],
    [{ ...R_GOOD, evidenceIds: ["r3"] }, "evidence-unrelated"],
    [{ ...R_GOOD, evidenceIds: ["r5"] }, "evidence-one-side"],
    [{ ...R_GOOD, text: "Wool lasted 71 minutes. Foil lasted 34 minutes." }, "no-link"],
    [{ ...R_GOOD, text: "It was good, so it is true." }, "link-not-tied"],
    [{ ...R_GOOD, text: "Wool lasted 90 minutes because it is warm." }, "number-not-in-data"],
    [
      { ...R_GOOD, text: "Wool lasted longer, so wool keeps ice frozen longer than foil." },
      "no-number",
    ],
    [{ ...R_GOOD, text: "" }, "empty"],
  ];
  for (const [input, id] of cases) {
    const r = checkReasoning(input, ICE);
    assert.ok(!r.ok && ids(r).includes(id), `${id}: got ${ids(r)}`);
    assertNotes(r, [input.text, input.claim], id);
  }
  const stray = checkReasoning(
    { ...R_GOOD, text: "Wool lasted 90 minutes because it is warm." },
    ICE,
  );
  assert.equal(stray.notes.find((n) => n.id === "number-not-in-data").quote, "90");
  assert.ok(
    checkReasoning(
      {
        ...R_GOOD,
        text: "I did 2 trials and wool lasted 71 minutes, so wool keeps ice frozen longer.",
      },
      ICE,
    ).ok,
    "a count of trials is not a data claim",
  );
  assert.ok(
    !checkReasoning(
      {
        ...R_GOOD,
        text: "Wool with 12 layers lasted 71 minutes, so wool keeps ice frozen longer.",
      },
      ICE,
    ).ok,
    "a 12-layer condition was never tested",
  );
  const es = checkReasoning(
    {
      claim: "La lana mantuvo el hielo congelado más tiempo que el aluminio.",
      evidenceIds: ["r5", "r1"],
      text: "La lana duró 71 minutos y el aluminio duró 34 minutos, por eso la lana mantiene el hielo congelado más tiempo.",
    },
    ICE,
    "es",
  );
  assert.deepEqual(ids(es), [], "Spanish reasoning");
  assert.match(checkReasoning({ ...R_GOOD, text: "" }, ICE, "es").notes[0].ask, /¿/);
  const soil = checkReasoning(
    {
      claim: "Garden soil sprouted faster than sand.",
      evidenceIds: ["r4", "r2"],
      text: "Garden soil with 4 spoons took 5 days but sand with 4 spoons took 8 days, so garden soil helps seeds sprout faster.",
    },
    SOIL,
  );
  assert.deepEqual(ids(soil), [], "grade 3-5 reasoning");
});

test("checkRevision compares the real before and after and reports what changed", () => {
  const fixed = checkRevision(
    "Covers are good.",
    "Wool kept the ice frozen longer than foil.",
    ICE,
  );
  assert.ok(fixed.ok && fixed.addressed);
  assert.deepEqual(fixed.fixed.sort(), ["no-condition", "no-outcome"]);
  assert.deepEqual([fixed.remaining, fixed.broke], [[], []]);
  assert.ok(fixed.changed.some((c) => c.op === "add") && fixed.changed.some((c) => c.op === "del"));
  assertNotes(fixed, ["Covers are good.", "Wool kept the ice frozen longer than foil."], "fixed");

  const same = checkRevision("Covers are good.", "Covers are good.", ICE);
  assert.ok(!same.ok && ids(same).includes("no-change") && same.changed.length === 0);
  assertNotes(same, ["Covers are good."], "same");

  const partial = checkRevision("Covers are good.", "Wool is the best cover.", ICE);
  assert.ok(!partial.ok && !partial.addressed && partial.remaining.includes("no-outcome"));

  const broke = checkRevision(
    "Wool kept the ice frozen longer than foil.",
    "Wool is the best.",
    ICE,
  );
  assert.ok(!broke.ok && broke.broke.length > 0, `broke: ${broke.broke}`);
  assertNotes(broke, ["Wool is the best."], "broke");

  const question = checkRevision(
    { stage: "question", text: "Is wool good?" },
    { stage: "question", text: "How many minutes does ice last under each cover?" },
    ICE,
  );
  assert.ok(question.ok, ids(question).join());
  const reasoning = checkRevision(
    { stage: "reasoning", ...R_GOOD, text: "Wool lasted 71 minutes." },
    { stage: "reasoning", ...R_GOOD },
    ICE,
  );
  assert.ok(reasoning.ok && reasoning.fixed.includes("no-link"));
  const evidenceOnly = checkRevision(
    { stage: "reasoning", ...R_GOOD, evidenceIds: ["r5"] },
    { stage: "reasoning", ...R_GOOD },
    ICE,
  );
  assert.ok(evidenceOnly.ok, "adding the missing row counts as a change");
  assert.match(checkRevision("a", "a", ICE, "es").notes[0].ask, /¿/);
  for (const junk of [
    [null, null],
    [undefined, 5],
    [{}, []],
    ["", ""],
  ]) {
    let r;
    assert.doesNotThrow(() => {
      r = checkRevision(junk[0], junk[1], ICE);
    });
    assert.equal(r.ok, false);
  }
});

test("every check survives empty, whitespace, very long, emoji and non-English input", () => {
  const long = "Which cover keeps ice frozen longest? ".repeat(6000);
  const odd = [
    "",
    "   \n\t ",
    long,
    "🙂🙂🙂",
    "😀 wool 😀 layers?",
    "你好，冰为什么融化？",
    "مرحبا كيف حالك",
    "x".repeat(60000),
    "¿¿¿???!!!",
    "a. b. c. d.",
    "\u0000​",
    "İİİ ß ñ É ǅ",
  ];
  const runs4 = (f) => f();
  for (const text of odd) {
    for (const c of [ICE, SOIL]) {
      const results = [
        [checkQuestion(text, c), [text]],
        [checkHypothesis(text, c), [text]],
        [checkClaim(text, c), [text]],
        [checkReasoning({ claim: text, evidenceIds: [c.dataset.rows[0].id], text }, c), [text]],
        [
          checkPlan(
            {
              changed: [c.variables[0].id],
              held: [c.variables[1].id],
              measure: text,
              trials: text,
              steps: text,
            },
            c,
          ),
          [text],
        ],
        [checkRevision(text, text, c), [text]],
        [checkQuestion(text, c, "es"), [text]],
      ];
      for (const [r, fields] of results) {
        runs4(() => assertNotes(r, fields, `odd input ${JSON.stringify(text.slice(0, 12))}`));
        assert.equal(r.ok, r.notes.length === 0 || r.ok);
      }
    }
    if (!text.trim()) {
      assert.deepEqual(ids(checkQuestion(text, ICE)), ["empty"]);
      assert.equal(checkQuestion(text, ICE).notes[0].quote, "");
    } else {
      for (const n of checkQuestion(text, ICE).notes)
        assert.ok(n.quote.trim().length > 0, "a non-blank input gets a non-blank quote");
    }
  }
  // missing or broken case definitions never throw
  for (const bad of [
    null,
    undefined,
    {},
    { variables: "x", dataset: 5 },
    { variables: [null, {}], dataset: { rows: [null, 1] } },
  ]) {
    assert.doesNotThrow(() => {
      checkQuestion("Which cover keeps ice frozen longest?", bad);
      checkHypothesis("If I change it, then it will melt faster.", bad);
      checkClaim("Wool lasted longer than foil.", bad);
      checkReasoning(R_GOOD, bad);
      checkPlan({ changed: ["a"], held: [], measure: "x", trials: 2 }, bad);
      checkRevision("a", "b", bad);
    });
  }
  for (const nonString of [null, undefined, 42, {}, [], true]) {
    assert.equal(checkQuestion(nonString, ICE).notes[0].id, "empty");
    assert.equal(checkClaim(nonString, ICE).notes[0].id, "empty");
    assert.equal(checkHypothesis(nonString, ICE).notes[0].id, "empty");
  }
});

test("checks are deterministic: the same input twice gives the same output", () => {
  const plan = { changed: ["cover"], held: [], measure: "see", trials: "1", steps: "wrap it" };
  const runAll = () => [
    GOOD.question.map(([c, t]) => checkQuestion(t, c)),
    GOOD.hypothesis.map(([c, t]) => checkHypothesis(t, c, "es")),
    GOOD.claim.map(([c, t]) => checkClaim(t, c)),
    checkPlan(plan, ICE),
    checkReasoning({ ...R_GOOD, text: "Wool lasted 90 minutes." }, ICE, "es"),
    checkRevision("Covers are good.", "Wool is the best cover.", ICE),
    reflectionPrompts({ helpUsed: ["a:b"], stages: { revise: { x: 1 } } }),
    toLedgerEntries(
      "claim",
      { ok: true, notes: [] },
      { band: "6-8", caseId: "ice-cover", text: R_GOOD.claim, caseState: {} },
    ),
  ];
  assert.deepEqual(runAll(), runAll());
  const before = JSON.stringify(ICE);
  runAll();
  assert.equal(JSON.stringify(ICE), before, "checks never mutate the case");
});

test("reflection prompts follow what the learner did and say nothing about right or wrong", () => {
  const base = reflectionPrompts(caseState(emptyState(), "6-8", "ice-cover"));
  assert.deepEqual(
    base.map((p) => p.id),
    ["hard", "next"],
  );
  const rich = reflectionPrompts({
    helpUsed: ["claim:claim-1"],
    stages: { revise: { text: "x" }, transfer: { text: "y" } },
  });
  assert.deepEqual(
    rich.map((p) => p.id),
    ["hard", "help", "revise", "transfer", "next"],
  );
  for (const p of rich) {
    assert.ok(p.text.en.endsWith("?") && p.text.es.includes("¿") && p.text.es.endsWith("?"));
    assert.ok(!/\d/.test(p.text.en + p.text.es));
  }
  assert.doesNotThrow(() => reflectionPrompts(null));
  assert.doesNotThrow(() => reflectionPrompts({ stages: "x", helpUsed: 5 }));
});

// ── ledger ───────────────────────────────────────────────────────────────────

test("ledger entries are partial, numeric, carry no learner text, and pass makeEntry", () => {
  const text =
    "Wool cloth with 1 layer lasted 71 minutes, but foil lasted only 34 minutes, so wool keeps the ice frozen longer than foil.";
  const mk = (
    stage,
    over = {},
    cs = caseState(setSupport(emptyState(), "6-8", "ice-cover", "C"), "6-8", "ice-cover"),
  ) =>
    toLedgerEntries(
      stage,
      { ok: true, notes: [] },
      { band: "6-8", caseId: "ice-cover", text, caseState: cs, attempt: "a1", ...over },
    );

  const [first] = mk("reasoning");
  assert.equal(first.src, "science-lab");
  assert.deepEqual(
    [first.kind, first.stage, first.domain, first.use],
    ["first", "independent", "Writing", "Explain"],
  );
  assert.equal(first.task, "ice-cover/reasoning");
  assert.equal(first.band, "6-8");
  assert.equal(first.attempt, "a1");
  assert.ok(
    first.m.words > 10 && Number.isFinite(first.m.link) && first.m.ok === 1 && first.m.flags === 0,
  );
  const nums = (o) =>
    Object.values(o).every((v) =>
      v && typeof v === "object" ? nums(v) : typeof v === "number" || typeof v === "string",
    );
  assert.ok(nums(first.m), "m holds numbers (and ids) only");
  assert.ok(Object.values(first.m).every((v) => v !== null));

  const [rev] = mk("revise");
  assert.deepEqual([rev.kind, rev.domain, rev.use], ["revision", "Writing", "Argue"]);
  const [speak] = mk("present");
  assert.deepEqual([speak.domain, speak.use, speak.kind], ["Speaking", "Explain", "first"]);
  const [guided] = mk("claim", {}, caseState(emptyState(), "6-8", "ice-cover"));
  assert.equal(guided.stage, "guided", "support A with no help opened");
  const helped = noteHelp(
    setSupport(emptyState(), "6-8", "ice-cover", "C"),
    "6-8",
    "ice-cover",
    "claim",
    "claim-1",
  );
  const [supported] = mk("claim", {}, caseState(helped, "6-8", "ice-cover"));
  assert.deepEqual([supported.stage, supported.supports.hint], ["supported", true]);
  const [transfer] = mk(TRANSFER_STAGE, {}, caseState(emptyState(), "6-8", "ice-cover"));
  assert.deepEqual(
    [transfer.kind, transfer.stage, transfer.use, transfer.domain],
    ["transfer", "independent", "Argue", "Writing"],
  );
  const [transferHelped] = mk(
    TRANSFER_STAGE,
    {},
    caseState(
      noteHelp(emptyState(), "6-8", "ice-cover", TRANSFER_STAGE, "claim-1"),
      "6-8",
      "ice-cover",
    ),
  );
  assert.equal(transferHelped.stage, "supported");
  const [flagged] = toLedgerEntries(
    "claim",
    { ok: false, notes: [{}, {}] },
    { band: "3-5", caseId: "soil-sprout", text: "Soil is good.", caseState: {} },
  );
  assert.deepEqual([flagged.m.ok, flagged.m.flags, flagged.band], [0, 2, "3-5"]);

  for (const stage of STAGES) {
    for (const e of mk(stage)) {
      const json = JSON.stringify(e);
      assert.ok(!json.includes(text) && !json.includes("Wool cloth"), `${stage}: no learner text`);
      for (const r of runs(text))
        assert.ok(!fold(json).includes(r), `${stage}: ledger entry repeats learner words "${r}"`);
      assert.ok(STAGE_META[stage].domain === e.domain && STAGE_META[stage].klu === e.use);
    }
  }
  const made = makeEntry(first);
  assert.equal(made.src, "science-lab");
  assert.equal(made.stage, "independent");
  assert.equal(makeEntry({ ...supported }).stage, "supported");
  assert.equal(
    makeEntry({ ...first, supports: { hint: true } }).stage,
    "supported",
    "makeEntry never lets help count as independent",
  );
  const ledger = { v: 1, entries: [] };
  for (const e of mk("claim")) appendEntry(ledger, e);
  assert.equal(ledger.entries.length, 1);

  assert.deepEqual(mk("claim", { text: "   " }), []);
  assert.deepEqual(mk("nope"), []);
  assert.deepEqual(toLedgerEntries("claim", null, undefined), []);
  assert.doesNotThrow(() =>
    toLedgerEntries("claim", undefined, { text: "Wool is good.", band: "x", caseId: "y" }),
  );
});

// ── source hygiene ───────────────────────────────────────────────────────────

const FORBIDDEN =
  /\b(setTimeout|setInterval|requestAnimationFrame|Date\.now|new Date|performance\.now|fetch|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|document\.\w|window\.\w)/;

test("source files use no timers, clock, network or storage, and stay within size limits", () => {
  const files = [
    ...readdirSync(join(LAB, "src/content"))
      .filter((f) => f.startsWith("science-lab"))
      .map((f) => join("src/content", f)),
    ...readdirSync(join(LAB, "src/lang"))
      .filter((f) => f.startsWith("science-lab"))
      .map((f) => join("src/lang", f)),
  ];
  assert.ok(files.length >= 6, files.join());
  for (const f of files) {
    const src = readFileSync(join(LAB, f), "utf8");
    assert.ok(!FORBIDDEN.test(src), `${f} uses a forbidden API: ${src.match(FORBIDDEN)?.[0]}`);
    assert.ok(!/Math\.random/.test(src), `${f} is deterministic`);
    assert.ok(!/teacher|dashboard/i.test(f), `${f}: filename avoids gated words`);
    assert.ok(src.split("\n").length <= 750, `${f} is over the 750 line cap`);
  }
  for (const f of ["src/content/science-lab.js", "src/lang/science-lab.js"])
    assert.ok(files.includes(f), `${f} exists`);
});
