// Sentence workbench: pure reducer, band-filtered connectors, JSON round-trip, tag attachment (clean vs flawed),
// authored content stays clean under every learner choice, markup smoke (live region, keyboard-only controls),
// and that a report never carries the learner's text. Pure Node: no browser.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { rng, SUP } from "../access-practice-lab/src/games/engine.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { ERROR_TAGS } from "../access-practice-lab/src/lab/tags.js";
import * as W from "../access-practice-lab/src/lab/workbench.js";
import {
  benchClick,
  benchPlan,
  benchRound,
  benchView,
} from "../access-practice-lab/src/lab/workbench-round.js";
import { actionFromEl, wbHTML } from "../access-practice-lab/src/lab/workbench-ui.js";

const root = new URL("../access-practice-lab/", import.meta.url).pathname;
const load = (id) => JSON.parse(readFileSync(`${root}content/games/${id}.json`, "utf8"));
const str = (x) => (typeof x === "string" ? x : String(x[Object.getOwnPropertySymbols(x)[0]]));
const SF = load("sentence-factory");
const CC = load("connector-climb");
const benches = [...SF.bands["3-5"].workshop, ...SF.bands["6-8"].workshop];
const env = (mode = "en", sup = "A") => ({
  I: makeI18n(mode),
  sup: SUP[sup],
  support: sup,
  band: "6-8",
  rng: rng(1),
  use() {},
  report() {},
});
const apply = (s, ...actions) => actions.reduce((x, a) => W.reduce(x, a), s);
const combineSpec = {
  id: "t",
  kind: "combine",
  a: "the team practiced every afternoon",
  b: "they lost the first game",
  rel: "contrast",
  conn: "however",
};

test("reducer: steps follow the kind and each step only takes its own actions", () => {
  assert.deepEqual(W.stepsOf("expand"), ["base", "expand", "check"]);
  assert.deepEqual(W.stepsOf("combine"), ["base", "combine", "check"]);
  assert.deepEqual(W.stepsOf("full"), ["base", "expand", "combine", "check"]);
  const dog = W.init(benches[0], { band: "3-5" });
  assert.equal(dog.step, "base");
  assert.equal(
    W.reduce(dog, { type: "toggle", slot: "where", id: "yard" }),
    dog,
    "chips are for the expand step",
  );
  let s = apply(dog, { type: "next" }, { type: "toggle", slot: "where", id: "yard" });
  assert.equal(s.step, "expand");
  assert.deepEqual(s.adds.where, ["yard"]);
  s = W.reduce(s, { type: "toggle", slot: "where", id: "fence" });
  assert.deepEqual(s.adds.where, ["fence"], "single-slot groups replace");
  s = W.reduce(s, { type: "toggle", slot: "where", id: "fence" });
  assert.deepEqual(s.adds.where, [], "tapping a chosen chip takes it out");
  s = apply(
    s,
    { type: "toggle", slot: "describe", id: "big" },
    { type: "toggle", slot: "describe", id: "old" },
  );
  assert.equal(
    W.reduce(s, { type: "toggle", slot: "describe", id: "brown" }),
    s,
    "two describing words at most",
  );
  assert.equal(W.reduce(s, { type: "toggle", slot: "nope", id: "x" }), s);
  assert.equal(W.reduce(s, { type: "frobnicate" }), s);
  assert.equal(W.reduce(s, { type: "next" }).step, "check");
  assert.equal(W.reduce(W.reduce(s, { type: "next" }), { type: "back" }).step, "expand");
  const frozen = JSON.stringify(s);
  W.reduce(s, { type: "toggle", slot: "who", id: "next-door" });
  assert.equal(JSON.stringify(s), frozen, "reduce never mutates");
  const c = apply(W.init(combineSpec, { band: "6-8" }), { type: "next" });
  assert.equal(c.step, "combine");
  assert.equal(
    W.reduce(c, { type: "next" }),
    c,
    "cannot review before a connector and punctuation are chosen",
  );
  assert.equal(W.reduce(c, { type: "conn", id: "nonsense" }), c);
  assert.equal(
    apply(c, { type: "conn", id: "however" }, { type: "joiner", id: "semicolon" }, { type: "next" })
      .step,
    "check",
  );
});

test("expand: every chip lands in its slot; adjectives take the standard order and a/an follows the word", () => {
  const dog = W.init(benches[0], { band: "3-5" });
  const s = apply(
    dog,
    { type: "next" },
    ...[
      ["describe", "brown"],
      ["describe", "big"],
      ["who", "next-door"],
      ["what", "at-mailman"],
      ["where", "yard"],
      ["when", "morning"],
      ["why", "scared"],
    ].map(([slot, id]) => ({ type: "toggle", slot, id })),
  );
  assert.equal(
    W.assemble(s),
    "The big brown dog next door barked at the mailman in the yard this morning because it was scared.",
  );
  const bird = apply(
    W.init(benches[1], { band: "3-5" }),
    { type: "next" },
    { type: "toggle", slot: "describe", id: "old" },
  );
  assert.equal(W.assemble(bird), "An old bird sang.");
  assert.equal(
    W.assemble(apply(bird, { type: "toggle", slot: "describe", id: "old" })),
    "A bird sang.",
  );
});

test("connectors are filtered by grade band; punctuation rules match the connector type", () => {
  const ids = (b) => W.connectorsFor(b).map((c) => c.id);
  assert.deepEqual(ids("3-5"), ["and", "but", "so", "because", "and then", "also"]);
  for (const id of [
    "however",
    "although",
    "therefore",
    "as a result",
    "for example",
    "in addition",
    "since",
  ]) {
    assert.ok(ids("6-8").includes(id), id);
    assert.ok(!ids("3-5").includes(id), id);
  }
  assert.ok(ids("3-5").every((id) => ids("6-8").includes(id)));
  assert.deepEqual(
    W.init(combineSpec, { band: "3-5" }).spec.connectors.map((c) => c.id),
    ids("3-5"),
  );
  const join = (conn, joiner) =>
    W.assemble({ ...apply(W.init(combineSpec, { band: "6-8" }), { type: "next" }), conn, joiner });
  assert.equal(
    join("but", "comma"),
    "The team practiced every afternoon, but they lost the first game.",
  );
  assert.equal(
    join("however", "semicolon"),
    "The team practiced every afternoon; however, they lost the first game.",
  );
  assert.equal(
    join("however", "period"),
    "The team practiced every afternoon. However, they lost the first game.",
  );
  assert.equal(
    join("although", "comma"),
    "Although the team practiced every afternoon, they lost the first game.",
  );
  assert.equal(
    join("because", "none"),
    "The team practiced every afternoon because they lost the first game.",
  );
  assert.equal(
    join("none", "semicolon"),
    "The team practiced every afternoon; they lost the first game.",
  );
});

test("serialization: JSON round-trip, and a damaged save is repaired or refused", () => {
  let s = apply(
    W.init(benches[3], { band: "6-8" }),
    { type: "next" },
    { type: "toggle", slot: "describe", id: "huge" },
    { type: "toggle", slot: "where", id: "valley" },
    { type: "next" },
    { type: "conn", id: "so" },
    { type: "joiner", id: "comma" },
    { type: "next" },
    { type: "check" },
  );
  const back = W.restore(W.serialize(s));
  assert.deepEqual(back, s);
  assert.equal(JSON.stringify(JSON.parse(W.serialize(s))), W.serialize(s), "JSON-safe");
  const damaged = JSON.parse(W.serialize(s));
  damaged.adds.where = ["valley", "ghost"];
  damaged.conn = "ghost";
  damaged.step = "teleport";
  damaged.tags = ["BOGUS", null, "CONNECTOR_MISSING"];
  const fixed = W.normalize(damaged);
  assert.deepEqual(fixed.adds.where, ["valley"]);
  assert.equal(fixed.conn, null);
  assert.equal(fixed.step, "base");
  assert.deepEqual(fixed.tags, [null, "CONNECTOR_MISSING"]);
  for (const junk of [null, undefined, 5, "x", "{", [], {}, { v: 99 }, { v: 1, kind: "expand" }])
    assert.equal(W.restore(junk), null);
});

test("tags: a flawed construction carries its tag, a clean one carries null, the first-try tag survives a fix", () => {
  const at = (conn, joiner) =>
    apply(
      W.init(combineSpec, { band: "6-8" }),
      { type: "next" },
      { type: "conn", id: conn },
      { type: "joiner", id: joiner },
      { type: "next" },
      { type: "check" },
    );
  const splice = at("none", "comma");
  assert.equal(W.evaluate(splice).ok, false);
  assert.equal(W.liveTag(splice), "CONNECTOR_MISSING");
  assert.equal(W.reportedTag(splice), "CONNECTOR_MISSING");
  const clean = at("however", "semicolon");
  assert.equal(
    W.evaluate(clean).ok,
    true,
    "the analyzer must not call a correct '; however, they' a comma splice",
  );
  assert.equal(W.liveTag(clean), null);
  assert.equal(W.reportedTag(clean), null);
  const wrongRel = at("because", "none");
  assert.equal(W.liveTag(wrongRel), null);
  assert.equal(W.evaluate(wrongRel).reasons[0].code, "REL");
  assert.equal(
    W.reportedTag(wrongRel),
    "CONNECTOR_MISSING",
    "an incorrect connector counts, as in Connector Climb",
  );
  assert.equal(W.evaluate(at("but", "none")).reasons[0].code, "PUNCT");
  assert.equal(W.evaluate(at("none", "period")).reasons[0].code, "NO_CONN");
  const revised = apply(
    splice,
    { type: "revise" },
    { type: "conn", id: "however" },
    { type: "joiner", id: "semicolon" },
    { type: "next" },
    { type: "check" },
  );
  assert.equal(revised.last.ok, true);
  assert.deepEqual(revised.tags, ["CONNECTOR_MISSING", null]);
  assert.equal(W.reportedTag(revised), "CONNECTOR_MISSING");
  const few = apply(
    W.init(benches[0], { band: "3-5" }),
    { type: "next" },
    { type: "next" },
    { type: "check" },
  );
  assert.equal(few.last.reasons[0].code, "FEW");
  assert.equal(W.reportedTag(few), null);
  for (const tag of Object.keys(ERROR_TAGS)) assert.ok(ERROR_TAGS[tag].hintEn, tag);
});

test("authored content: specs validate, and every legal learner build of an expansion is clean", () => {
  for (const spec of benches) assert.deepEqual(W.validateSpec(spec, spec.id), [], spec.id);
  assert.ok(
    W.validateSpec({ kind: "expand", id: "x", base: { noun: "dog", verb: "ran" }, chips: {} })
      .length,
  );
  assert.ok(W.validateSpec({ ...combineSpec, conn: "ghost" }).length);
  for (const spec of benches) {
    const state = W.init(spec, { band: "6-8" });
    const groups = W.SLOTS.map((slot) => [
      slot,
      [[], ...(spec.chips[slot] || []).map((c) => [c.id])],
    ]);
    // describe takes up to two: add the pairs
    const dsc = spec.chips.describe || [];
    const pairs = [[], ...dsc.map((c) => [c.id])];
    for (let i = 0; i < dsc.length; i++)
      for (let j = i + 1; j < dsc.length; j++) pairs.push([dsc[i].id, dsc[j].id]);
    let n = 0;
    const walk = (k, adds) => {
      if (k === groups.length) {
        n += 1;
        const s = { ...state, step: "expand", adds };
        assert.equal(W.liveTag(s), null, `${spec.id}: ${W.assemble(s)}`);
        return;
      }
      const [slot, opts] = groups[k];
      for (const o of slot === "describe" ? pairs : opts) walk(k + 1, { ...adds, [slot]: o });
    };
    walk(0, { describe: [], who: [], what: [], where: [], when: [], why: [] });
    assert.ok(n > 100, spec.id);
  }
});

test("authored content: every Connector Climb 6-8 row is solvable by every connector of its relationship, and every other choice is a miss", () => {
  const src = CC.bands["6-8"];
  const conns = src.connectors
    .filter((c) => c.id !== "first")
    .map((c) => ({ id: c.id, type: c.punct, rel: c.rel, es: c.es }));
  for (const row of src.rounds) {
    const rel = conns.find((c) => c.id === row.conn).rel;
    const base = apply(
      W.init(
        { id: row.id, kind: "combine", a: row.a, b: row.b, rel, conn: row.conn, connectors: conns },
        { band: "6-8" },
      ),
      { type: "next" },
    );
    for (const c of conns)
      for (const joiner of W.JOINER_IDS) {
        const s = apply(
          base,
          { type: "conn", id: c.id },
          { type: "joiner", id: joiner },
          { type: "next" },
          { type: "check" },
        );
        const want = c.rel === rel && W.ACCEPT[c.type].includes(joiner);
        assert.equal(s.last.ok, want, `${row.id} ${c.id}/${joiner}: ${W.assemble(s)}`);
      }
    assert.equal(
      W.validateSpec(
        { id: row.id, kind: "combine", a: row.a, b: row.b, rel, conn: row.conn, connectors: conns },
        row.id,
      ).length,
      0,
    );
  }
});

test("markup: a stable aria-live region on every step, calm tag hint in the chrome language, keyboard-only controls", () => {
  const e = env("en");
  const s0 = W.init(combineSpec, { band: "6-8" });
  const flawed = apply(
    s0,
    { type: "next" },
    { type: "conn", id: "none" },
    { type: "joiner", id: "comma" },
  );
  for (const state of [
    s0,
    apply(s0, { type: "next" }),
    flawed,
    W.init(benches[0], { band: "3-5" }),
  ]) {
    const html = str(wbHTML(state, e));
    assert.match(html, /aria-live="polite"/);
    assert.match(html, /data-wb-live/);
    assert.doesNotMatch(html, /draggable|data-drag|tabindex="[1-9]/);
    assert.ok(!/<(div|span|li|p)[^>]*\sonclick=/.test(html));
    for (const m of html.matchAll(/data-wb-(add|conn|join|next|back|check)\b/g))
      assert.ok(m, "controls are data-wb-* hooks");
    assert.equal(
      [...html.matchAll(/<button\b[^>]*data-wb-(add|conn|join)/g)].length,
      [...html.matchAll(/data-wb-(add|conn|join)=/g)].length,
      "every chip is a <button>",
    );
  }
  assert.match(str(wbHTML(flawed, e)), /data-wb-tag="CONNECTOR_MISSING"/);
  assert.match(str(wbHTML(flawed, e)), /Two complete ideas need a connector/);
  assert.match(
    str(wbHTML(apply(s0, { type: "next" }), e)),
    /data-wb-live aria-live="polite" aria-atomic="true">\s*<\/div>/,
    "no note when the sentence is clean",
  );
  assert.match(str(wbHTML(flawed, e)), /aria-current="step"/);
  assert.match(str(wbHTML(flawed, e)), /aria-pressed="true"/);
  const es = str(wbHTML(flawed, env("es")));
  assert.match(es, /Dos ideas completas necesitan un conector/);
  assert.match(es, /It rained, so we stayed inside/, "the English example stays English");
  assert.match(es, /lang="es"/);
  const bi = str(wbHTML(flawed, env("bi")));
  assert.match(bi, /Two complete ideas/);
  assert.match(bi, /Dos ideas completas/);
  assert.match(str(wbHTML(W.init(benches[0], { band: "3-5" }), e)), /data-wb-next/);
  assert.match(str(wbHTML(W.init(combineSpec, { band: "6-8" }), env("en", "C"))), /Start building/);
  assert.doesNotMatch(
    str(wbHTML(apply(s0, { type: "next" }), env("en", "C"))),
    /wb-rel-h/,
    "Independent mode shows connectors flat, not grouped by relationship",
  );
  assert.match(str(wbHTML(apply(s0, { type: "next" }), env("en", "A"))), /wb-rel-h/);
  const el = (attr, value) => ({
    dataset:
      value === undefined
        ? {}
        : { [attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: value },
    hasAttribute: (n) => n === attr,
  });
  assert.deepEqual(actionFromEl(el("data-wb-add", "where:yard")), {
    type: "toggle",
    slot: "where",
    id: "yard",
  });
  assert.deepEqual(actionFromEl(el("data-wb-conn", "and then")), { type: "conn", id: "and then" });
  assert.deepEqual(actionFromEl(el("data-wb-check")), { type: "check" });
  assert.equal(actionFromEl(el("data-g-next")), null);
});

test("round glue: the check decides ok, the miss -> hint -> revise -> reveal loop holds, and the report is tag-only", () => {
  const reports = [];
  const e = { ...env("en"), report: (r) => reports.push(r), use() {} };
  const button = (attr, value) => ({
    dataset:
      value === undefined
        ? {}
        : { [attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: value },
    hasAttribute: (n) => n === attr,
    closest: () => null,
  });
  const press = (r, sel) => {
    const m = sel.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
    return benchClick(button(m[1], m[2]), r, e);
  };
  const play = (r, wrong) => {
    for (const a of benchPlan(r, { wrong })) assert.equal(press(r, a.click), true, a.click);
  };
  // wrong, wrong -> revealed
  const spec = { ...combineSpec, id: "glue-1" };
  const r = benchRound(spec.id, spec, "6-8");
  play(r, true);
  assert.equal(r.rs.status, "retry");
  assert.equal(r.wb.step, "combine", "a miss goes back to revise");
  assert.equal(reports.length, 0, "a retry is not reported");
  assert.equal(press(r, "[data-g-hint]"), true);
  play(r, true);
  assert.equal(r.rs.status, "revealed");
  assert.equal(reports.length, 1);
  assert.equal(reports[0].ok, false);
  assert.equal(reports[0].languageErrorTag, "CONNECTOR_MISSING");
  assert.equal(reports[0].hints, 1);
  // clean first try
  const r2 = benchRound("glue-2", spec, "6-8");
  play(r2, false);
  assert.equal(r2.rs.status, "right");
  assert.deepEqual(benchPlan(r2), [{ click: "[data-g-next]" }]);
  assert.equal(reports[1].first, true);
  assert.equal(reports[1].languageErrorTag, null);
  // flawed first, fixed on revise: the first-try tag is what is logged
  const r4 = benchRound("glue-4", spec, "6-8");
  for (const [a, v] of [
    ["data-wb-next"],
    ["data-wb-conn", "none"],
    ["data-wb-join", "comma"],
    ["data-wb-next"],
    ["data-wb-check"],
  ])
    benchClick(button(a, v), r4, e);
  assert.equal(r4.rs.status, "retry");
  play(r4, false);
  assert.equal(r4.rs.status, "right");
  assert.equal(reports[2].revised, true);
  assert.equal(reports[2].languageErrorTag, "CONNECTOR_MISSING");
  // an expansion with too few chips misses; with enough it is right
  const bench = benchRound("glue-5", benches[0], "3-5");
  play(bench, true);
  assert.equal(bench.rs.status, "retry");
  play(bench, false);
  assert.equal(bench.rs.status, "right");
  // no learner text anywhere in any report
  const texts = [
    W.assemble(r.wb),
    W.assemble(r4.wb),
    W.assemble(bench.wb),
    ...benches.flatMap((b) =>
      Object.values(b.chips)
        .flat()
        .map((c) => c.text),
    ),
  ];
  const blob = JSON.stringify(reports);
  for (const t of texts) assert.ok(!blob.includes(t), `report leaks: ${t}`);
  for (const rep of reports)
    assert.deepEqual(Object.keys(rep).sort(), [
      "first",
      "hints",
      "id",
      "kind",
      "languageErrorTag",
      "ok",
      "revised",
      "skill",
    ]);
  // a finished round is locked and shows the model after a reveal
  assert.equal(press(r, "[data-wb-back]"), false);
  assert.match(str(benchView(r, e)), /One sentence that works/);
  assert.match(str(benchView(r, e)), /aria-live="polite"/);
});

test("every workbench plan from every authored spec and band reaches a finished round, and its state survives JSON", () => {
  for (const spec of benches)
    for (const band of ["3-5", "6-8"])
      for (const wrongFirst of [false, true]) {
        const e = { ...env("en"), report() {} };
        const r = benchRound(spec.id, spec, band);
        let guard = 0;
        while (r.rs.status !== "right" && r.rs.status !== "revealed" && guard++ < 8) {
          for (const a of benchPlan(r, { wrong: wrongFirst && guard < 3 })) {
            const m = a.click.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
            const node = {
              dataset: {
                [m[1].replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())]:
                  m[2] ?? "",
              },
              hasAttribute: (n) => n === m[1],
              closest: () => null,
            };
            assert.equal(benchClick(node, r, e), true, `${spec.id}: ${a.click}`);
          }
          assert.deepEqual(W.restore(JSON.stringify(r.wb)), r.wb);
        }
        assert.ok(["right", "revealed"].includes(r.rs.status), spec.id);
      }
});

// ── the games that report a tag ────────────────────────────────────────────────────────────────
const gameRun = async (id, band) => {
  const def = (await import("../access-practice-lab/src/games/registry.js")).GAME[id];
  const mod = (await import(`../access-practice-lab/src/games/${def.module}.js`)).default;
  const reports = [];
  const content = load(id);
  const e = {
    content: content.bands[band],
    contentAll: content,
    band,
    support: "A",
    sup: SUP.A,
    I: makeI18n("en"),
    def,
    rng: rng(5),
    count: (full) => full,
    report: (r) => reports.push(r),
    use() {},
  };
  return { mod, e, reports, state: mod.init(e) };
};
const click = (mod, state, e, sel) => {
  const m = sel.match(/\[([^=\]]+)(?:="([^"]*)")?\]/);
  const node = {
    dataset: {
      [m[1].replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase())]: m[2] ?? "",
    },
    hasAttribute: (n) => n === m[1],
    closest: () => node,
  };
  return mod.click(node, state, e);
};
test("Sentence Factory: choice stations report the item's error tag on a miss and null on a clean first try; benches close the line", async () => {
  const { mod, e, reports, state } = await gameRun("sentence-factory", "3-5");
  assert.equal(state.rounds.length, 12 + 2);
  assert.equal(state.rounds.at(-1).kind, "workbench");
  assert.ok(
    state.rounds.slice(0, 12).every((r) => r.kind !== "workbench" && Array.isArray(r.tags)),
  );
  const sva = state.rounds.findIndex((r) => r.id === "sentence-factory-35-5");
  state.i = sva;
  const row = state.rounds[sva];
  assert.equal(row.tag, "SUBJECT_VERB_AGREEMENT");
  click(mod, state, e, `[data-g-choice="${(row.answer + 1) % 3}"]`);
  click(mod, state, e, "[data-g-check]");
  click(mod, state, e, `[data-g-choice="${(row.answer + 1) % 3}"]`);
  click(mod, state, e, "[data-g-check]");
  assert.equal(reports.at(-1).languageErrorTag, "SUBJECT_VERB_AGREEMENT");
  const clean = state.rounds.findIndex((r) => r.id === "sentence-factory-35-1");
  state.i = clean;
  click(mod, state, e, `[data-g-choice="${state.rounds[clean].answer}"]`);
  click(mod, state, e, "[data-g-check]");
  assert.equal(reports.at(-1).languageErrorTag, null);
  assert.equal(reports.at(-1).first, true);
  const view = str(mod.view({ ...state, i: state.rounds.length - 1 }, e));
  assert.match(view, /data-wb/);
  assert.match(view, /aria-live="polite"/);
  assert.equal(
    JSON.stringify(JSON.parse(JSON.stringify(state))),
    JSON.stringify(state),
    "saved state is JSON-safe and resumable",
  );
  const quick = await gameRun("sentence-factory", "6-8");
  quick.e.count = (full, q) => q;
  assert.equal(quick.mod.init(quick.e).rounds.filter((r) => r.kind === "workbench").length, 1);
});

test("Connector Climb: 6-8 later rounds are clause-combining benches; a wrong connector reports CONNECTOR_MISSING", async () => {
  const six = await gameRun("connector-climb", "6-8");
  assert.deepEqual(
    six.state.rounds.map((r) => (r.kind === "workbench" ? "wb" : r.kind[0])),
    ["j", "j", "o", "j", "j", "o", "wb", "wb", "o"],
  );
  const three = await gameRun("connector-climb", "3-5");
  assert.ok(three.state.rounds.every((r) => r.kind !== "workbench"));
  click(six.mod, six.state, six.e, `[data-g-conn="${(six.state.rounds[0].ans + 1) % 3}"]`);
  click(six.mod, six.state, six.e, "[data-g-check]");
  click(six.mod, six.state, six.e, `[data-g-conn="${(six.state.rounds[0].ans + 1) % 3}"]`);
  click(six.mod, six.state, six.e, "[data-g-check]");
  assert.equal(six.reports.at(-1).languageErrorTag, "CONNECTOR_MISSING");
  assert.equal(six.reports.at(-1).ok, false);
  const right = await gameRun("connector-climb", "6-8");
  click(right.mod, right.state, right.e, `[data-g-conn="${right.state.rounds[0].ans}"]`);
  click(right.mod, right.state, right.e, "[data-g-check]");
  assert.equal(right.reports.at(-1).languageErrorTag, null);
  right.state.i = 6;
  assert.match(str(right.mod.view(right.state, right.e)), /data-wb-step="base"/);
});

test("Grammar Jungle: agreement, tense and splice vines report their tag only when the learner missed", async () => {
  const gj = await gameRun("grammar-jungle", "6-8");
  const find = (id) => gj.state.rounds.findIndex((r) => r.id === id);
  const miss = (id) => {
    gj.state.i = find(id);
    const r = gj.state.rounds[gj.state.i];
    const wrongTile = r.tiles.findIndex((t) => t !== r.fix);
    click(gj.mod, gj.state, gj.e, `[data-gj-tok="${r.bad}"]`);
    click(gj.mod, gj.state, gj.e, `[data-gj-tile="${wrongTile}"]`);
    click(
      gj.mod,
      gj.state,
      gj.e,
      `[data-gj-tile="${r.tiles.findIndex((t, k) => t !== r.fix && k !== wrongTile)}"]`,
    );
    return r;
  };
  miss("gj68-team");
  assert.equal(gj.reports.at(-1).languageErrorTag, "SUBJECT_VERB_AGREEMENT");
  miss("gj68-sunset");
  assert.equal(gj.reports.at(-1).languageErrorTag, "VERB_TENSE_SHIFT");
  miss("gj68-rain");
  assert.equal(gj.reports.at(-1).languageErrorTag, "CONNECTOR_MISSING");
  gj.state.i = find("gj68-storm");
  const r = gj.state.rounds[gj.state.i];
  click(gj.mod, gj.state, gj.e, `[data-gj-tok="${r.bad}"]`);
  click(gj.mod, gj.state, gj.e, `[data-gj-tile="${r.tiles.indexOf(r.fix)}"]`);
  assert.equal(gj.reports.at(-1).languageErrorTag, null, "a rule with no tag reports null");
  const clean = gj.state.rounds[find("gj68-leaves")];
  gj.state.i = find("gj68-leaves");
  click(gj.mod, gj.state, gj.e, `[data-gj-tok="${clean.bad}"]`);
  click(gj.mod, gj.state, gj.e, `[data-gj-tile="${clean.tiles.indexOf(clean.fix)}"]`);
  assert.equal(gj.reports.at(-1).languageErrorTag, null, "fixed on the first try: nothing to tag");
});
