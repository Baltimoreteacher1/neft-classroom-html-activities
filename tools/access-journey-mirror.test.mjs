// Growth Mirror (Journey Improve + Show summary + Passport evidence): engine rules and the DOM it renders.
// Pure engine first (target, graduated help, revision evidence, ownership, reasons, growth record, independence rule),
// then jsdom drives ui/mirror.js and ui/growth.js. Honesty rules: no score/level/proficiency claims, no percent signs.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import pack from "../access-practice-lab/src/content/journey/m08.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { MISSIONS } from "../access-practice-lab/src/journey/curriculum.js";
import {
  analysisOpts,
  evaluateRevision,
  featureCounts,
  growthRecord,
  helpLevels,
  independentSummary,
  ledgerEntry,
  ownershipCheck,
  pickTarget,
  reasonOptions,
  supportsFromHelps,
  withIndependent,
} from "../access-practice-lab/src/journey/engines/mirror.js";
import {
  COPY,
  FALLBACK_FRAMES,
  NOTICES,
} from "../access-practice-lab/src/journey/engines/mirror-copy.js";
import {
  evidenceTally,
  featureChips,
  growthSectionHTML,
} from "../access-practice-lab/src/journey/ui/growth.js";
import * as ui from "../access-practice-lab/src/journey/ui/mirror.js";
import { analyzeResponse } from "../access-practice-lab/src/lang/analyze.js";
import { toHtml } from "../access-practice-lab/src/util.js";
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

const band = pack.bands["3-5"];
const TASK = {
  topicTerms: ["bean", "plants"],
  sourceTerms: ["sun chart"],
  minWords: 5,
  mode: "write",
};
const FIRST = "The bean plants are small.";
const en = makeI18n("en");
const es = makeI18n("es");

const analyze = (text, klu, task = TASK) => analyzeResponse(text, analysisOpts(task, klu));
const target = (text, klu, task) => pickTarget(analyze(text, klu, task), klu, "6-8");
const strings = (v, out = []) => {
  if (typeof v === "string") out.push(v);
  else if (v && typeof v === "object") for (const x of Object.values(v)) strings(x, out);
  return out;
};

test("pickTarget: the first required missing move, in the move order of each Key Language Use", () => {
  const cases = [
    ["Argue", "Cats are good pets.", "claim"],
    ["Argue", "I think schools should start later.", "reason"],
    ["Argue", "I think schools should start later because students are tired.", "evidence"],
    ["Narrate", "I went to the park.", "orient"],
    ["Inform", "Dogs are loyal.", "details"],
    ["Explain", FIRST, "cause"],
    ["Explain", "Beans.", "phenomenon"],
  ];
  for (const [klu, text, want] of cases) {
    const t = target(text, klu);
    assert.equal(t.id, want, `${klu}: ${text}`);
    assert.equal(t.kind, "move");
    assert.ok(
      t.label && t.labelEs && t.ask && t.askEs && t.why.en && t.why.es,
      `${want} carries label, ask and why in both languages`,
    );
  }
  const t = target(FIRST, "Explain");
  assert.deepEqual(
    t.missing,
    ["cause", "chain", "support"],
    "all other missing moves are listed, only one is the target",
  );
});

test("pickTarget: when every move is present it falls back to cohesion, then precision", () => {
  const linked =
    "The bean plants are small and yellow because they receive little sun. The plants make less food because they receive little sun, so the plants grow slowly. The sun chart shows plants in Bed 1 receive seven hours, while plants in Bed 2 receive two.";
  assert.equal(target(linked, "Explain").id, "precision");
  const unlinked =
    "The bean plants are small. They are small because they get little sun. Then the plants cannot make food, so they grow slowly. The sun chart shows 7 hours. A thing is bad. Stuff is good.";
  const a = analyze(unlinked, "Explain");
  assert.equal(a.purpose.missing.length, 0, "fixture makes every required move");
  const t = pickTarget(a, "Explain", "6-8");
  assert.ok(["cohesion", "precision"].includes(t.id));
  assert.equal(t.kind, t.id);
  assert.ok(COPY.cohesion && COPY.precision);
});

test("helpLevels: question, then frame, then model; each level is optional and never the answer sentence for the learner's text", () => {
  const t = pickTarget(analyze(FIRST, "Explain"), "Explain", "3-5", band);
  assert.deepEqual(
    t.levels.map((l) => l.kind),
    ["question", "frame", "model"],
  );
  assert.equal(t.levels[0].text, t.ask);
  assert.match(t.levels[1].text, /___/, "a frame has blanks");
  assert.ok(
    band.frames.A.includes(t.levels[1].text) || band.frames.B.includes(t.levels[1].text),
    "the frame comes from the mission's own frames when one fits",
  );
  assert.equal(t.levels[2].text, band.improve.models.cause);
  // fallbacks
  const noModel = helpLevels(t, { support: "x" }, band.frames);
  assert.deepEqual(
    noModel.map((l) => l.kind),
    ["question", "frame"],
    "no model for the target: level 3 is skipped",
  );
  const noFrames = helpLevels(t, null, { A: [], B: [], C: [] });
  assert.equal(noFrames[1].text, FALLBACK_FRAMES.cause);
  assert.deepEqual(supportsFromHelps(["question", "model"]), { hint: true, model: true });
  assert.deepEqual(supportsFromHelps([]), {});
});

test("evaluateRevision: unchanged, trivial edits and real revisions", () => {
  const opts = { target: "cause", keyUse: "Explain", analysis: analysisOpts(TASK, "Explain") };
  const same = evaluateRevision(FIRST, FIRST, opts);
  assert.equal(same.changed, false);
  assert.equal(same.noChange.kind, "unchanged");
  assert.equal(same.noChange.message, NOTICES.unchanged);
  for (const edit of [
    "the bean plants are small",
    "  The   bean plants are small!  ",
    "THE BEAN PLANTS ARE SMALL.",
    "The bean plants are small.\n",
  ]) {
    const r = evaluateRevision(FIRST, edit, opts);
    assert.equal(r.changed, false, JSON.stringify(edit));
    assert.equal(r.noChange.kind, "trivial");
  }
  const good = evaluateRevision(
    FIRST,
    "The bean plants are small because they get only two hours of sun. The chart shows 2 hours for Bed 2.",
    opts,
  );
  assert.equal(good.changed, true);
  assert.equal(good.targetFixed, true);
  assert.ok(good.gained.some((m) => m.id === "cause"));
  assert.deepEqual(good.lost, []);
  const obs = good.observable.find((o) => o.id === "cause");
  assert.deepEqual([obs.from, obs.to], ["not found", "found"]);
  assert.match(obs.evidenceSpan, /because/i, "evidence quotes the learner's own words");
  assert.ok(good.diff.some((d) => d.op === "add") && good.added.length);
  assert.ok(
    !good.observable.some((o) => o.id === "words"),
    "word count is never offered as evidence",
  );
  assert.ok(
    good.observable.every((o) => o.what && "from" in o && "to" in o && "evidenceSpan" in o),
  );
  // a revision that does not fix the target is reported honestly, and still changed
  const miss = evaluateRevision(FIRST, "The bean plants are small and yellow today.", opts);
  assert.equal(miss.changed, true);
  assert.equal(miss.targetFixed, false);
});

test("evaluateRevision: a revision that breaks another move names it", () => {
  const before =
    "The bean plants are small because they get little sun. The chart shows 2 hours of sun.";
  const after = "The bean plants are small and the chart is on the wall.";
  const r = evaluateRevision(before, after, {
    target: "chain",
    keyUse: "Explain",
    analysis: analysisOpts(TASK, "Explain"),
  });
  assert.equal(r.changed, true);
  assert.ok(
    r.lost.some((m) => m.id === "cause"),
    "cause was in the first response and is gone",
  );
  assert.equal(r.brokeOther, true);
  const row = r.observable.find((o) => o.id === "cause");
  assert.equal(row.better, false);
  assert.deepEqual([row.from, row.to], ["found", "not found"]);
});

test("ownershipCheck: a pasted model gets a gentle prompt once, then is accepted", () => {
  const model = band.improve.models.cause;
  const pasted = ownershipCheck(FIRST, model, model);
  assert.equal(pasted.pasted, true);
  assert.equal(pasted.ok, false);
  assert.equal(pasted.accepted, false);
  assert.equal(pasted.prompt.kind, "own-words");
  assert.match(pasted.prompt.en, /own words/i);
  assert.ok(pasted.prompt.es);
  const second = ownershipCheck(FIRST, model, model, true);
  assert.equal(second.accepted, true, "the second submission is accepted: never blocked forever");
  const own = ownershipCheck(
    FIRST,
    "The bean plants are small because they get little sun.",
    model,
  );
  assert.equal(own.ok, true);
  assert.equal(own.prompt, null);
  const lost = ownershipCheck("My beans are tiny and yellow.", "Plants need water.", model);
  assert.equal(lost.ok, false);
  assert.equal(lost.prompt.kind, "keep-yours");
});

test("reasonOptions: matching reasons first, plus two others, deterministic, every option accepted", () => {
  const t = pickTarget(analyze(FIRST, "Explain"), "Explain", "3-5", band);
  const a = reasonOptions(band.improve.whys, t, "s1");
  const b = reasonOptions(band.improve.whys, t, "s1");
  assert.deepEqual(a, b, "same seed, same order");
  assert.equal(a.length, 3);
  const matching = a.filter((o) => o.matches);
  assert.deepEqual(
    matching.map((o) => o.id),
    ["why-cause"],
  );
  for (const o of a)
    assert.equal(
      Boolean(o.followUp),
      !o.matches,
      "only a non-matching reason carries a follow-up question",
    );
  assert.ok(a.find((o) => !o.matches).followUp.en.endsWith("another."));
  const generic = reasonOptions(band.improve.whys, { id: "cohesion", kind: "cohesion" }, "s");
  assert.ok(
    generic.some((o) => o.id === "why-link" && o.matches),
    "cohesion has a built-in reason",
  );
  const orders = new Set(
    ["a", "b", "c", "d", "e", "f"].map((s) =>
      reasonOptions(band.improve.whys, t, s)
        .map((o) => o.id)
        .join(),
    ),
  );
  assert.ok(orders.size > 1, "the shuffle varies with the seed");
});

const PRIOR = {
  communicate: { text: FIRST, supportsUsed: ["frame"], mode: "write", words: 5 },
  improve: {
    target: "cause",
    before: FIRST,
    after: "The bean plants are small because they get little sun. The chart shows 2 hours of sun.",
    supportsUsed: ["question"],
    why: "why-cause",
  },
};
const SHOW = {
  text: "The tomato plants are droopy. They are droopy because the soil is dry. The chart shows 3 dry days.",
  independent: true,
  words: 18,
};

test("growthRecord separates supported practice from independent work and shows counts, not scores", () => {
  const r = growthRecord("m08", "3-5", PRIOR, SHOW, {
    communicateTask: TASK,
    showTask: { ...TASK, topicTerms: ["tomato", "plants", "soil"], minWords: 8 },
  });
  assert.equal(r.missionId, "m08");
  assert.equal(r.keyUse, "Explain");
  assert.equal(r.first.supported, true);
  assert.deepEqual(r.first.supportsUsed, ["frame"]);
  assert.equal(r.revision.supported, true, "a revision after feedback is supported");
  assert.deepEqual(r.revision.supportsUsed, ["question", "feedback"]);
  assert.equal(r.revision.target.id, "cause");
  assert.equal(r.revision.targetFixed, true);
  assert.ok(r.independent.features.movesMade >= 2);
  assert.equal(r.independent.supported, false);
  assert.equal(r.separation.supportedPractice.length, 2);
  assert.equal(r.separation.independentAttempted, true);
  assert.equal(r.separation.demonstratedIndependent, r.independent.demonstrated);
  assert.ok(r.changeLines.length >= 2 && r.changeLines.every((l) => l.en && l.es));
  for (const k of [
    "words",
    "sentences",
    "linkKinds",
    "cites",
    "complex",
    "academic",
    "movesMade",
    "movesRequired",
  ])
    assert.ok(Number.isInteger(r.first.features[k]), k);
  // before the Show step there is no independent block, and the record never claims one
  const early = growthRecord(
    "m08",
    "3-5",
    { communicate: PRIOR.communicate, improve: PRIOR.improve },
    null,
    { communicateTask: TASK },
  );
  assert.equal(early.independent, null);
  assert.equal(early.separation.demonstratedIndependent, false);
  const joined = withIndependent(early, SHOW, { showTask: { ...TASK, minWords: 8 } });
  assert.ok(joined.independent && joined.first.text === FIRST);
  // a kept first response is recorded as kept
  const kept = growthRecord(
    "m08",
    "3-5",
    { communicate: PRIOR.communicate, improve: { ...PRIOR.improve, after: FIRST, kept: true } },
    null,
    {},
  );
  assert.equal(kept.revision.changed, false);
  assert.ok(kept.changeLines.some((l) => /kept my first response/i.test(l.en)));
  assert.equal(growthRecord("m08", "3-5", {}, null), null);
});

const ONE = { ...TASK, minWords: 5 };
const sum = (text, supportsUsed = [], task = ONE, klu = "Explain") =>
  independentSummary(text, { supportsUsed, minWords: task.minWords, keyUse: klu, task });

test("independentSummary: no help, enough words, and at least ceil(60%) of the required moves", () => {
  const three =
    "The bean plants are small. They are small because they get little sun. The chart shows 2 hours of sun.";
  const two = "The bean plants are small. They are small because they get little sun.";
  const s3 = sum(three);
  assert.equal(s3.required, 4);
  assert.equal(s3.needed, 3, "ceil(4 * 0.6) = 3");
  assert.equal(s3.made, 3);
  assert.equal(s3.independent, true);
  assert.equal(s3.status, "independently-demonstrated");
  const s2 = sum(two);
  assert.equal(s2.made, 2, "one below the boundary");
  assert.equal(s2.independent, false);
  assert.equal(s2.status, "completed-with-support");
  assert.deepEqual(s2.reasons, ["moves"]);
  // help opened: same strong text is supported practice
  const helped = sum(three, ["model"]);
  assert.equal(helped.independent, false);
  assert.deepEqual(helped.reasons, ["help-opened"]);
  // too short
  const short = sum("Beans.", [], { ...ONE, minWords: 10 });
  assert.equal(short.minWordsMet, false);
  assert.ok(short.reasons.includes("too-short"));
  // three required moves: ceil(3 * 0.6) = 2
  const argue2 = sum(
    "I think schools should start later because students are tired.",
    [],
    { topicTerms: [], sourceTerms: [], minWords: 5 },
    "Argue",
  );
  assert.equal(argue2.required, 3);
  assert.equal(argue2.needed, 2);
  assert.equal(argue2.independent, true);
  assert.equal(
    sum(
      "I think schools should start later.",
      [],
      { topicTerms: [], sourceTerms: [], minWords: 5 },
      "Argue",
    ).independent,
    false,
  );
});

test("independentSummary offers ONE supportive next step and never blocks", () => {
  const weak = sum("Beans are plants and they grow in the garden.");
  assert.equal(weak.status, "completed-with-support");
  assert.ok(
    weak.nextStep.moveId && weak.nextStep.label && weak.nextStep.ask && weak.nextStep.why.en,
  );
  assert.equal(weak.nextStep.kind, "support");
  assert.equal(weak.missingIds[0], weak.nextStep.moveId, "it names the first missing move");
  assert.equal(typeof weak.nextStep, "object");
  const strong = sum(
    "The bean plants are small. They are small because they get little sun. The chart shows 2 hours of sun.",
  );
  assert.equal(strong.nextStep.kind, "stretch");
  const empty = sum("");
  assert.equal(empty.status, "completed-with-support");
  assert.ok(empty.nextStep);
});

test("ledgerEntry: a revision is a revision, a transfer is independent only when no help was opened", () => {
  const base = {
    missionId: "m08",
    band: "3-5",
    text: PRIOR.improve.after,
    mode: "write",
    task: TASK,
  };
  const rev = ledgerEntry("revision", { ...base, helps: ["question"] });
  assert.equal(rev.kind, "revision");
  assert.equal(rev.stage, "supported");
  assert.equal(rev.src, "mission");
  assert.equal(rev.task, "m08.improve");
  assert.equal(rev.use, "Explain");
  assert.equal(rev.domain, "Writing");
  assert.deepEqual(rev.supports, { hint: true });
  assert.equal(
    ledgerEntry("revision", { ...base, helps: [] }).stage,
    "supported",
    "feedback is always a support",
  );
  assert.equal(
    ledgerEntry("revision", { ...base, helps: ["question", "frame", "model"] }).stage,
    "guided",
  );
  const tr = ledgerEntry("transfer", { ...base, task: TASK, supportsUsed: [] });
  assert.equal(tr.kind, "transfer");
  assert.equal(tr.stage, "independent");
  assert.equal(tr.task, "m08.show");
  assert.equal(ledgerEntry("transfer", { ...base, supportsUsed: ["frame"] }).stage, "supported");
  assert.ok(rev.m.words > 0 && rev.m.moves, "entries carry features, not text");
  assert.ok(!JSON.stringify(rev).includes("bean plants"), "no student text in the ledger entry");
});

test("no string in the engine, the views or the Passport section claims a score, level or proficiency", () => {
  const record = growthRecord("m08", "3-5", PRIOR, SHOW, { communicateTask: TASK, showTask: TASK });
  const all = [
    ...strings(COPY),
    ...strings(NOTICES),
    ...strings(record),
    toHtml(ui.showSummaryHTML(en, record)),
    toHtml(ui.showSummaryHTML(es, record)),
    toHtml(ui.compareHTML(en, FIRST, PRIOR.improve.after)),
    toHtml(growthSectionHTML(en, journeyState(), ledgerOf(), "3-5")),
    toHtml(growthSectionHTML(es, journeyState(), ledgerOf(), "3-5")),
  ];
  for (const s of all) {
    assert.doesNotMatch(s, SCORE_CLAIM, s.slice(0, 80));
    assert.ok(!s.includes("%"), `percent sign in: ${s.slice(0, 80)}`);
    const claim = s
      .replace(/[^.]*\bnot a (?:score|puntaje)[^.]*\./gi, "")
      .replace(/no son un puntaje[^.]*\./gi, "");
    assert.doesNotMatch(
      claim,
      /\b(?:proficien|fluent|advanced|beginner|mastered|mastery)\w*/i,
      s.slice(0, 80),
    );
    assert.doesNotMatch(claim, /\b(?:score|level)\b/i, `score/level wording in: ${s.slice(0, 80)}`);
  }
});

// ── DOM ─────────────────────────────────────────────────────────────────────

function journeyState() {
  const steps = (stage) => ({
    communicate: { status: "done", stage: "supported", data: { result: PRIOR.communicate } },
    improve: {
      status: "done",
      stage: "supported",
      data: { result: { ...PRIOR.improve, kept: false } },
    },
    show: { status: "done", stage, data: { result: SHOW } },
  });
  return { v: 1, bands: { "3-5": { missions: { m08: { steps: steps("independent") } } } } };
}
const ledgerOf = (nIndependent = 1) => ({
  entries: [
    {
      id: "r",
      t: "2026-11-01T10:00:00Z",
      src: "mission",
      task: "m08.improve",
      band: "3-5",
      use: "Explain",
      stage: "supported",
      kind: "revision",
      supports: {},
      m: { words: 14, link: 1, cites: 1, complex: 1, academic: 0, moves: { cause: 1, support: 1 } },
    },
    ...Array.from({ length: nIndependent }, (_, i) => ({
      id: `i${i}`,
      t: `2026-11-0${i + 2}T10:00:00Z`,
      src: "mission",
      task: "m08.show",
      band: "3-5",
      use: "Explain",
      stage: "independent",
      kind: "transfer",
      supports: {},
      m: {
        words: 14 + i,
        link: 1 + (i % 2),
        cites: 1,
        complex: i,
        academic: 1,
        moves: { cause: 1, support: i % 2 },
      },
    })),
    {
      id: "o",
      t: "2026-11-01T10:00:00Z",
      src: "mission",
      task: "m08.show",
      band: "6-8",
      stage: "independent",
      kind: "transfer",
      m: { words: 9, link: 1, moves: { cause: 1 } },
    },
  ],
});

function harness(prior = PRIOR.communicate, extra = {}) {
  const dom = new JSDOM('<!doctype html><div id="root"></div>');
  globalThis.document = dom.window.document;
  const root = dom.window.document.getElementById("root");
  const calls = { help: [], ledger: [], done: [], announce: [] };
  const env = {
    I: en,
    band: "3-5",
    support: "A",
    independent: false,
    missionId: "m08",
    step: "improve",
    mission: MISSIONS.m08,
    pack: band,
    data: {},
    prior: { communicate: prior },
    help: (id) => calls.help.push(id),
    ledger: (e) => calls.ledger.push(e),
    done: (r) => calls.done.push(r),
    announce: (m) => calls.announce.push(m),
    update(patch) {
      env.data = { ...env.data, ...patch };
      paint();
    },
    ...extra,
  };
  function paint() {
    root.innerHTML = toHtml(ui.render(band, env));
    ui.mount(root, env);
  }
  paint();
  const click = (sel) =>
    root.querySelector(sel).dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
  return { dom, root, env, calls, click, paint, text: () => root.textContent };
}

test("render: first response card with ONE target and the reason it matters to the listener", () => {
  const h = harness();
  const html = h.root.innerHTML;
  assert.match(h.text(), /Your first response/);
  assert.ok(h.root.querySelector(".mr-quote").textContent.includes(FIRST));
  assert.equal(h.root.querySelectorAll(".mr-target").length, 1);
  assert.match(h.root.querySelector(".mr-target-label").textContent, /Link cause and effect/);
  assert.match(h.root.querySelector(".mr-target-why").textContent, /why it happened/);
  assert.equal(
    h.root.querySelector("#mrRevise").value,
    FIRST,
    "the revise box starts from the learner's own words",
  );
  assert.ok(!html.includes(band.improve.models.cause), "no model before help is opened");
  assert.equal(
    h.root.querySelectorAll("[data-mirror-help]").length,
    1,
    "help is graduated: one next level at a time",
  );
});

test("graduated help: question, then frame, then a model labelled as not the answer; each opening is a recorded help", () => {
  const h = harness();
  h.click("[data-mirror-help]");
  assert.deepEqual(h.calls.help, ["question"]);
  assert.match(h.text(), /What caused it/);
  assert.ok(!h.root.innerHTML.includes(band.improve.models.cause));
  h.click("[data-mirror-help]");
  assert.deepEqual(h.calls.help, ["question", "frame"]);
  assert.match(h.root.querySelector(".is-frame .mr-help-text").textContent, /___/);
  h.click("[data-mirror-help]");
  assert.deepEqual(h.calls.help, ["question", "frame", "model"]);
  assert.match(
    h.root.querySelector(".is-model .mr-level-title").textContent,
    /A model, not your answer/,
  );
  assert.equal(
    h.root.querySelector(".is-model .mr-help-text").textContent,
    band.improve.models.cause,
  );
  assert.equal(h.root.querySelectorAll("[data-mirror-help]").length, 0, "no more levels");
  assert.equal(
    h.root.querySelector("#mrRevise").value,
    FIRST,
    "opening help never replaces the learner's draft",
  );
});

test("independent mode renders no help", () => {
  const h = harness(PRIOR.communicate, { independent: true });
  assert.equal(h.root.querySelectorAll("[data-mirror-help], .mr-help").length, 0);
  assert.ok(!h.text().includes("What caused it"));
});

test("revise -> notices for no change and a pasted model -> compare -> reason -> done", () => {
  const h = harness();
  const box = () => h.root.querySelector("#mrRevise");
  h.click("[data-mirror-compare]");
  assert.match(
    h.root.querySelector(".mr-notice").textContent,
    /same words/,
    "unchanged text is not a revision",
  );
  assert.equal(h.root.querySelector(".mr-comparison"), null);
  box().value = "the bean plants are small";
  h.click("[data-mirror-compare]");
  assert.match(
    h.root.querySelector(".mr-notice").textContent,
    /Only spaces, capital letters or punctuation/,
  );
  box().value = band.improve.models.cause;
  h.click("[data-mirror-compare]");
  assert.match(h.root.querySelector(".mr-notice").textContent, /own words/);
  assert.equal(h.root.querySelector(".mr-comparison"), null, "first paste is not compared");
  h.click("[data-mirror-compare]");
  assert.ok(h.root.querySelector(".mr-comparison"), "a second submission is accepted");
  box().value =
    "The bean plants are small because they get little sun. The chart shows 2 hours of sun.";
  h.click("[data-mirror-compare]");
  const cmp = h.root.querySelector(".mr-compare");
  assert.equal(cmp.querySelectorAll(".mr-col").length, 2, "before and after side by side");
  assert.ok(
    cmp.querySelector(".mr-col-after ins.mr-add"),
    "added words are marked in the after column",
  );
  assert.ok(cmp.querySelector(".mr-col-before .mr-text").textContent.includes("small"));
  assert.match(
    cmp.querySelector("ins .visually-hidden").textContent,
    /added/,
    "marks are not colour-only",
  );
  assert.match(h.root.querySelector(".mr-targetresult").textContent, /in your revision now/);
  assert.match(h.root.querySelector(".mr-changes").textContent, /Link cause and effect/);
  assert.ok(h.calls.announce.length >= 1);
  // reflection: every option is accepted; a non-matching one only asks a gentle question
  const radios = [...h.root.querySelectorAll("input[name='mirror-why']")];
  assert.equal(radios.length, 3);
  const doneBtn = () => h.root.querySelector("[data-mirror-done]");
  h.click("[data-mirror-done]");
  assert.equal(h.calls.done.length, 0, "not ready before a reason is chosen");
  assert.equal(doneBtn().getAttribute("aria-disabled"), "true");
  const wrongish = radios.find((r) => r.value !== "why-cause");
  wrongish.checked = true;
  wrongish.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
  assert.match(h.root.querySelector("fieldset .mr-notice").textContent, /Does this reason match/);
  assert.equal(
    doneBtn().getAttribute("aria-disabled"),
    "false",
    "any selected reason lets the learner finish",
  );
  const right = h.root.querySelector("input[value='why-cause']");
  right.checked = true;
  right.dispatchEvent(new h.dom.window.Event("change", { bubbles: true }));
  assert.equal(h.root.querySelector("fieldset .mr-notice"), null);
  h.click("[data-mirror-help]");
  h.click("[data-mirror-done]");
  assert.equal(h.calls.done.length, 1);
  const res = h.calls.done[0];
  assert.equal(res.target, "cause");
  assert.equal(res.before, FIRST);
  assert.match(res.after, /because they get little sun/);
  assert.equal(res.why, "why-cause");
  assert.deepEqual(res.supportsUsed, ["question"]);
  assert.equal(res.targetFixed, true);
  assert.equal(res.growth.v, 1);
  assert.equal(res.growth.independent, null);
  assert.equal(h.calls.ledger.length, 1);
  assert.equal(h.calls.ledger[0].kind, "revision");
  assert.deepEqual(h.calls.ledger[0].supports, { hint: true });
  h.click("[data-mirror-done]");
  assert.equal(h.calls.done.length, 1, "a double click finishes once");
});

test("after three unchanged tries the learner may keep their response and go on", () => {
  const h = harness();
  for (let i = 0; i < 3; i++) h.click("[data-mirror-compare]");
  assert.ok(h.root.querySelector("[data-mirror-keep]"));
  h.click("[data-mirror-keep]");
  h.click("[data-mirror-done]");
  assert.equal(h.calls.done.length, 1);
  assert.equal(h.calls.done[0].kept, true);
  assert.equal(h.calls.ledger.length, 0, "no revision entry for work that was not revised");
});

test("no first response yet: a plain note, no crash", () => {
  const h = harness({ text: "" });
  assert.match(h.text(), /Finish the Communicate step first/);
  const s = harness({ text: "" }, { I: es });
  assert.match(s.text(), /Termina primero/);
});

test("Spanish chrome, English task content", () => {
  const h = harness(PRIOR.communicate, { I: es });
  assert.match(h.text(), /Tu primera respuesta/);
  assert.match(h.root.querySelector(".mr-target-label").textContent, /Une causa y efecto/);
  assert.equal(h.root.querySelector(".mr-quote").getAttribute("lang"), "en");
});

test("showSummaryHTML: Before -> After -> On my own, supported and independent labelled apart", () => {
  const good = growthRecord("m08", "3-5", PRIOR, SHOW, {
    communicateTask: TASK,
    showTask: { ...TASK, minWords: 8, topicTerms: ["tomato", "plants", "soil"] },
  });
  const out = toHtml(ui.showSummaryHTML(en, good));
  assert.match(out, /Before: my first response/);
  assert.match(out, /After: my revision/);
  assert.match(out, /On my own: a new task/);
  assert.equal(
    (out.match(/Supported practice/g) || []).length,
    2,
    "first response and revision are supported practice",
  );
  assert.match(out, good.independent.demonstrated ? /Shown on my own/ : /Completed with support/);
  assert.match(out, /Why it matters/);
  assert.match(out, /Link cause and effect/);
  const weak = growthRecord(
    "m08",
    "3-5",
    PRIOR,
    { text: "Plants grow." },
    { communicateTask: TASK, showTask: { ...TASK, minWords: 10 } },
  );
  const w = toHtml(ui.showSummaryHTML(en, weak));
  assert.match(w, /Completed with support/);
  assert.ok(!/Shown on my own/.test(w));
  assert.match(w, /supportive next step/i);
  assert.match(w, /The task asks for at least 10 words/);
  const pending = toHtml(
    ui.showSummaryHTML(
      en,
      growthRecord(
        "m08",
        "3-5",
        { communicate: PRIOR.communicate, improve: PRIOR.improve },
        null,
        {},
      ),
    ),
  );
  assert.match(pending, /Your new try on your own will show up here/);
  assert.equal(toHtml(ui.showSummaryHTML(en, null)), "");
});

test("growthSectionHTML: Before/After cards, a tally that keeps the two kinds apart, and the 3-point rule", () => {
  const state = journeyState();
  const under = toHtml(growthSectionHTML(en, state, ledgerOf(1), "3-5"));
  assert.match(under, /Evidence so far/);
  assert.match(under, /Not enough evidence yet/);
  assert.match(under, /1 of 3 independent attempts/);
  assert.ok(
    !/stayed about the same|showed up (?:more|less) often/.test(under),
    "no trend language under three independent attempts",
  );
  assert.match(under, /mr-gcard/);
  assert.match(under, /Link cause and effect/);
  assert.match(under, /Supported practice/);
  assert.match(under, /\bmission shown on my own/, "a count of one is singular");
  assert.doesNotMatch(under, /\bmissions shown on my own/);
  assert.match(under, /\bsupported attempt \(/);
  assert.match(under, /\bindependent demonstration \(/);
  const t = evidenceTally(state, ledgerOf(1), "3-5");
  assert.deepEqual(
    [t.supportedAttempts, t.independentDemonstrations, t.missionsShownOnOwn],
    [1, 1, 1],
  );
  const enough = toHtml(growthSectionHTML(en, state, ledgerOf(3), "3-5"));
  assert.ok(!/Not enough evidence yet/.test(enough));
  assert.match(enough, /enough attempts on your own/);
  assert.match(enough, /stayed about the same|showed up (?:more|less) often/);
  assert.ok(featureChips(ledgerOf(3), "3-5").every((c) => c.of > 0 && c.seen <= c.of));
  assert.equal(featureChips(ledgerOf(3), "6-8").length > 0, true, "chips are per band");
  // other band's entries never count
  assert.equal(evidenceTally(state, ledgerOf(1), "3-5").independentDemonstrations, 1);
  // empty state
  const none = toHtml(growthSectionHTML(es, { v: 1, bands: {} }, { entries: [] }, "3-5"));
  assert.match(none, /aparecen aquí/);
  assert.match(none, /Todavía no hay suficiente evidencia/);
  assert.ok(!/mr-gcard/.test(none));
});

test("growth cards keep unique ids and mark changes without colour alone", () => {
  const state = journeyState();
  state.bands["3-5"].missions.m09 = JSON.parse(JSON.stringify(state.bands["3-5"].missions.m08));
  const out = toHtml(growthSectionHTML(en, state, ledgerOf(1), "3-5"));
  const ids = [...out.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, "no duplicate ids across cards");
  assert.ok(/<ins class="mr-add">/.test(out) && /<del class="mr-del">/.test(out));
});

test("featureCounts reads the ledger features", () => {
  const f = featureCounts(
    analyze("The bean plants are small. They are small because they get little sun.", "Explain"),
  );
  assert.equal(f.movesRequired, 4);
  assert.equal(f.movesMade, 2);
  assert.deepEqual(Object.keys(f.moves), ["phenomenon", "cause", "chain", "support"]);
});

test("growthSectionHTML accepts the overview's object form and shows one mission", () => {
  const out = toHtml(
    growthSectionHTML({
      I: en,
      band: "3-5",
      missionId: "m08",
      ledger: ledgerOf(1),
      state: journeyState(),
    }),
  );
  assert.match(out, /mr-gcard" open/);
  assert.ok(!/Evidence so far/.test(out), "the overview card is the mission's own cards only");
  assert.equal(
    toHtml(
      growthSectionHTML({
        I: en,
        band: "3-5",
        missionId: "m01",
        ledger: ledgerOf(1),
        state: journeyState(),
      }),
    ),
    "",
  );
});

test("a stored record keeps the task options, so a later recount of the Show attempt matches the live one", () => {
  const live = growthRecord(
    "m08",
    "3-5",
    { communicate: PRIOR.communicate, improve: PRIOR.improve },
    null,
    { communicateTask: TASK, showTask: { ...TASK, minWords: 30 } },
  );
  assert.equal(live.tasks.show.minWords, 30);
  const joined = withIndependent(JSON.parse(JSON.stringify(live)), {
    text: "The bean plants are small. They are small because they get little sun. The chart shows 2 hours of sun.",
  });
  assert.equal(joined.independent.summary.minWords, 30);
  assert.equal(joined.independent.demonstrated, false, "below the task's own word minimum");
  assert.ok(joined.independent.summary.reasons.includes("too-short"));
});

test("the Passport section loads the Journey on demand and stays empty for a learner with no Journey work", async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const { journeyEvidenceHTML } = await import(
    "../access-practice-lab/src/views/passport-living.js"
  );
  assert.equal(await journeyEvidenceHTML(en, "3-5", ledgerOf(1)), "");
  const { KEY } = await import("../access-practice-lab/src/journey/state.js");
  store.set(KEY, JSON.stringify(journeyState()));
  const out = toHtml(await journeyEvidenceHTML(en, "3-5", ledgerOf(1)));
  assert.match(out, /My Journey evidence/);
  assert.match(out, /id="journeyEvidence"/);
  assert.match(out, /Before and after/);
  assert.match(toHtml(await journeyEvidenceHTML(es, "3-5", ledgerOf(1))), /Evidencia de mi viaje/);
  assert.equal(
    await journeyEvidenceHTML(en, "6-8", ledgerOf(1)),
    "",
    "another band has no Journey work",
  );
  delete globalThis.localStorage;
});
