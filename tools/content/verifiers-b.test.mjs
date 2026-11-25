// Tests for the B content verifiers (cognate, frames, spanish, standards), their runner, and the two exporters.
// Run: node --test tools/content/verifiers-b.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { FALSE_FRIENDS } from "../../functions/_lib/bcpss/esol-content.js";
import { cell, HEADER, rowsFor, toCsv } from "./spanish-review-export.mjs";
import { buildCoverage, renderMarkdown } from "./standards-coverage.mjs";
import { markOf, pairsOf } from "./verifiers/b-common.mjs";
import * as cognate from "./verifiers/cognate.mjs";
import * as frames from "./verifiers/frames.mjs";
import * as spanish from "./verifiers/spanish.mjs";
import * as standards from "./verifiers/standards.mjs";
import {
  B_NAMES,
  baselinePath,
  loadContext,
  loadSubjects,
  loadVerifier,
  ratchet,
  runControls,
  sweep,
  tally,
} from "./verifiers-b.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, "verifiers-b.mjs");
const ctx = loadContext();
const codes = (mod, subject, c = ctx) => mod.verify(subject, c).map((f) => f.code);
const unit = (vocab) => ({ kind: "unit", id: "t", studio: { vocab }, lessons: [] });

test("every verifier's known-bad fixture is flagged and known-good passes (G-27)", async () => {
  for (const name of B_NAMES) {
    const mod = await loadVerifier(name);
    assert.deepEqual(runControls(mod, ctx), [], name);
    assert.ok(
      mod.fixtures.bad.mustFlag.length > 0,
      `${name} lists codes its bad fixture must flag`,
    );
  }
});

test("a verifier whose negative control stops firing is reported broken", () => {
  const dead = { ...cognate, verify: () => [] };
  const problems = runControls(dead, ctx);
  assert.ok(
    problems.some((p) => p.includes("no longer raises")),
    problems.join("; "),
  );
  const noisy = { ...spanish, verify: () => [{ code: "x", severity: "warn", message: "m" }] };
  assert.ok(runControls(noisy, ctx).some((p) => p.includes("known-good fixture raised")));
});

test("registry names the four verifiers alphabetically, one per line", async () => {
  const { VERIFIERS_B: REGISTRY } = await import("./registry.mjs");
  for (const n of B_NAMES) assert.ok(REGISTRY.includes(n), `${n} missing from registry.mjs`);
  assert.deepEqual([...REGISTRY].sort(), REGISTRY);
  const src = readFileSync(path.join(HERE, "registry.mjs"), "utf8");
  assert.equal(
    [...src.slice(src.indexOf("VERIFIERS_B")).matchAll(/^\s+"[a-z-]+",$/gm)].length,
    REGISTRY.length,
    "one entry per line",
  );
});

test("cognate classifier covers the five kinds with a 0-1 confidence", () => {
  const k = (en, es) => cognate.classifyPair(en, es);
  assert.equal(k("animal", "animal").kind, "identical");
  assert.equal(k("fraction", "fracción").kind, "pattern");
  assert.equal(k("planet", "planeta").kind, "identical");
  assert.equal(k("opaque", "opaco").kind, "lookalike");
  assert.equal(k("table", "mesa").kind, "translation_only");
  assert.equal(k("equivalent fraction", "fracción equivalente").kind, "pattern");
  assert.equal(k("big fraction", "fracción grande").kind, "partial");
  for (const [en, es] of [
    ["table", "mesa"],
    ["fraction", "fracción"],
    ["unit", "unidad"],
    ["x", "y"],
  ]) {
    const c = k(en, es).confidence;
    assert.ok(c >= 0 && c <= 1, `${en}/${es} ${c}`);
  }
  assert.ok(
    k("unit", "unidad").confidence < cognate.LOW_CONFIDENCE,
    "unsure pairs go to the review queue",
  );
});

test("false-friend list: all draft, well formed, sorted, and a superset of the runtime table", () => {
  const list = JSON.parse(readFileSync(path.join(HERE, "data/false-friends.json"), "utf8"));
  const keys = list.entries.map((e) => e.en);
  assert.deepEqual([...keys].sort(), keys, "sorted by English word");
  assert.equal(new Set(keys).size, keys.length, "no duplicates");
  for (const e of list.entries) {
    assert.equal(e.reviewState, "draft", `${e.en} must stay draft until a human reviews it`);
    for (const f of ["en", "es_false", "es_means", "en_means", "es_correct", "source"])
      assert.ok(e[f], `${e.en}.${f}`);
    assert.notEqual(e.es_false.toLowerCase(), e.es_correct.toLowerCase());
  }
  for (const word of Object.keys(FALSE_FRIENDS))
    assert.ok(keys.includes(word), `esol-content FALSE_FRIENDS "${word}" missing here`);
});

test("cognate verifier: error on a listed false friend marked as a cognate, and on the deceptive gloss", () => {
  const c = codes(
    cognate,
    unit([{ term: "exit", es: "éxito", es_note: "Cognate: sounds the same." }]),
  );
  assert.ok(c.includes("cognate_marked_false_friend") && c.includes("false_friend_as_translation"));
  const lesson = {
    kind: "unit",
    id: "t",
    studio: { vocab: [] },
    lessons: [
      { newcomer_path: [{ payload: { items: [{ term: "large", es: "largo", status: "true" }] } }] },
    ],
  };
  assert.ok(
    codes(cognate, lesson).includes("cognate_marked_false_friend"),
    "lesson newcomer status true is a cognate mark",
  );
  const term = {
    kind: "term",
    id: "term:library",
    term: {
      id: "library",
      term: "library",
      glosses: { es: { text: "librería", review_status: "machine" } },
      cognate: "true",
      notes: null,
    },
  };
  assert.ok(codes(cognate, term).includes("false_friend_as_translation"));
  assert.deepEqual(
    codes(
      cognate,
      unit([
        { term: "library", es: "biblioteca", es_note: "False friend: 'librería' is a bookstore." },
      ]),
    ).filter((x) => x !== "false_friend_unlisted"),
    [],
  );
});

test("author marks are read from status or note", () => {
  assert.equal(markOf("true", ""), "cognate");
  assert.equal(markOf(undefined, "Cognate pair: both"), "cognate");
  assert.equal(markOf(undefined, "Not a cognate. 'Rate'..."), "not_cognate");
  assert.equal(markOf("false_friend", ""), "false_friend");
  assert.equal(markOf(undefined, "Add = sumar"), "unmarked");
  assert.equal(
    pairsOf(
      unit([
        { term: "a", es: "b", es_note: "Cognate" },
        { term: "a", es: "b", es_note: "Cognate" },
      ]),
    )[0].count,
    2,
    "duplicates fold",
  );
});

test("standards: shape rules for grade, family and range", () => {
  const s = standards.shapeProblem;
  assert.equal(s("ELA", "3", "RL.3.2"), null);
  assert.equal(s("ELA", "3", "L.3.1.h"), null);
  assert.match(s("ELA", "3", "RL.4.2"), /grade/);
  assert.match(s("ELA", "7", "RF.7.1"), /RF/);
  assert.match(s("ELA", "3", "RL.3.11"), /number/);
  assert.equal(s("Math", "6", "6.RP.A.1"), null);
  assert.match(s("Math", "6", "6.NF.A.1"), /domain/);
  assert.equal(s("Science", "6", "MS-LS1-8"), null);
  assert.equal(s("Science", "2", "K-2-ETS1-3"), null);
  assert.match(s("Science", "2", "3-PS2-1"), /grade/);
  assert.match(s("Science", "2", "MS-PS1-1"), /not an elementary/);
  assert.equal(s("Social Studies", "4", "D2.Geo.4.3-5"), null);
  assert.match(s("Social Studies", "4", "D2.Geo.4.6-8"), /band/);
  assert.match(s("Social Studies", "4", "D2.Geo.13.3-5"), /indicator/);
});

test("standards: real Grade 6 Math codes resolve to a short name, invented ones do not", () => {
  assert.equal(ctx.standardsRefs.resolve("6.RP.A.1").shortName, "Ratio Concept");
  assert.ok(ctx.standardsRefs.resolve("6.AT.1"));
  assert.equal(ctx.standardsRefs.resolve("6.RP.A.9"), null);
});

test("standards verifier: untouched standard, lesson with no listed standard, no-reference-list info", () => {
  const u = { id: "g3-ela-u9", grade: "3", subject: "ELA", core_standards: ["RL.3.2", "RI.3.1"] };
  const subject = {
    kind: "unit",
    id: u.id,
    unit: u,
    lessons: [
      { id: "l1", standards: ["RI.3.1"] },
      { id: "l2", standards: ["W.3.1"] },
    ],
  };
  const c = codes(standards, subject);
  assert.ok(
    c.includes("standard_untouched") &&
      c.includes("activity_no_listed_standard") &&
      c.includes("standard_no_reference_list"),
  );
  assert.ok(!c.includes("standard_invalid_code"));
});

test("spanish: leakage and placeholder flagged, the Spanish word 'todo' is not a placeholder", () => {
  assert.ok(
    codes(spanish, unit([{ term: "ratio", es: "the ratio of" }])).includes(
      "spanish_english_leakage",
    ),
  );
  assert.ok(codes(spanish, unit([{ term: "sum", es: "TODO" }])).includes("spanish_placeholder"));
  assert.ok(
    !codes(spanish, unit([{ term: "whole", es: "el todo" }])).includes("spanish_placeholder"),
  );
  assert.ok(
    codes(spanish, unit([{ term: "ratio", es: "razón" }])).every(
      (x) => x === "spanish_draft_translation",
    ),
  );
});

test("spanish: decimal and register inconsistency within one unit; every gloss is a draft", () => {
  const mixed = codes(
    spanish,
    unit([
      { term: "a", es: "0,5" },
      { term: "b", es: "0.5" },
      { term: "c", es: "tú ves" },
      { term: "d", es: "usted ve" },
    ]),
  );
  assert.ok(
    mixed.includes("spanish_decimal_inconsistent") && mixed.includes("spanish_register_mixed"),
  );
  const one = codes(
    spanish,
    unit([
      { term: "a", es: "0,5" },
      { term: "d", es: "1,25" },
    ]),
  );
  assert.ok(!one.includes("spanish_decimal_inconsistent"));
  assert.ok(
    codes(spanish, unit([{ term: "ratio", es: "razón" }])).includes("spanish_draft_translation"),
  );
});

test("frames: parser, vocabulary tie and band progression", () => {
  assert.deepEqual(frames.parseFrame("The [a / b] is [c].").problems, []);
  for (const bad of ["The [a is", "a] b", "[[x]]", "The [] is"])
    assert.ok(frames.parseFrame(bad).problems.length > 0, bad);
  const index = { stems: new Set(["ratio"]), pos: new Set(["noun"]) };
  assert.ok(frames.vocabFillable(frames.parseFrame("The [ratio] is [number]."), index));
  assert.ok(
    frames.vocabFillable(frames.parseFrame("The ratio is [number]."), index),
    "vocab word in fixed text",
  );
  assert.ok(!frames.vocabFillable(frames.parseFrame("This is because [reason]."), index));
  const v = {
    kind: "unit",
    id: "t",
    studio: {
      vocab: [{ term: "ratio", pos: "noun" }],
      frames: { l1_2: ["[ratio] [a] [b] [c]"], l3_4: ["[ratio] [a]"], l5_6: ["[ratio] [a]"] },
    },
    lessons: [],
  };
  assert.ok(codes(frames, v).includes("frame_band_progression"));
});

test("ratchet: only counts above baseline are new; floors guard the sweep", () => {
  const r = ratchet({ "a|u1": 2, "b|u1": 1 }, { "a|u1": 2, "b|u1": 3, "c|u2": 1 });
  assert.deepEqual(r.added, []);
  assert.equal(r.improved.length, 2);
  assert.deepEqual(ratchet({ "a|u1": 3 }, { "a|u1": 2 }).added, [{ key: "a|u1", now: 3, was: 2 }]);
  assert.deepEqual(ratchet({ "n|u1": 1 }, {}).added.length, 1);
});

test("real sweep: 162 units and 974 terms load, controls hold, nothing new vs baselines", async () => {
  const subjects = await loadSubjects();
  assert.equal(subjects.filter((s) => s.kind === "unit").length, 162);
  assert.ok(subjects.filter((s) => s.kind === "term").length > 900);
  for (const name of B_NAMES) {
    const mod = await loadVerifier(name);
    const { findings, examined } = sweep(mod, subjects, ctx);
    const base = JSON.parse(readFileSync(baselinePath(name), "utf8"));
    assert.ok(
      examined >= base.floors.subjects,
      `${name} examined ${examined} < floor ${base.floors.subjects}`,
    );
    assert.deepEqual(ratchet(tally(findings).gated, base.gated).added, [], name);
    for (const f of findings) {
      assert.ok(
        ["error", "warn", "info"].includes(f.severity) && f.code && f.path && f.message,
        `${name} finding shape`,
      );
    }
  }
});

function cli(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

test("CLI exits 0 clean, 1 on a new finding, 3 when the baseline is missing", () => {
  assert.equal(cli(["--only", "standards"]).status, 0);
  const dir = mkdtempSync(path.join(tmpdir(), "vb-baseline-"));
  try {
    const env = { VERIFIERS_B_BASELINE_DIR: dir };
    assert.equal(cli(["--only", "standards"], env).status, 3, "missing baseline is a broken gate");
    const base = JSON.parse(readFileSync(baselinePath("standards"), "utf8"));
    const key = Object.keys(base.gated)[0];
    delete base.gated[key];
    writeFileSync(path.join(dir, "standards.json"), JSON.stringify(base));
    assert.equal(
      cli(["--only", "standards"], env).status,
      1,
      "a finding absent from the baseline is new",
    );
    copyFileSync(baselinePath("standards"), path.join(dir, "standards.json"));
    assert.equal(cli(["--only", "standards"], env).status, 0);
    base.floors.subjects = 100000;
    writeFileSync(path.join(dir, "standards.json"), JSON.stringify(base));
    assert.equal(
      cli(["--only", "standards"], env).status,
      3,
      "a sweep below its floor is a broken gate",
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("reviewer export: CSV header, draft status, formula guard, never marks a gloss reviewed", async () => {
  assert.equal(cell("=SUM(A1)"), "'=SUM(A1)");
  assert.equal(cell('say "hi", ok'), '"say ""hi"", ok"');
  const subjects = await loadSubjects();
  const u = subjects.find((s) => s.id === "g6-math-u2");
  const csv = toCsv(rowsFor(u));
  assert.equal(csv.split("\n")[0], HEADER.join(","));
  assert.ok(csv.includes("draft translation"));
  assert.ok(!rowsFor(u).some((r) => r[7] === "reviewed"));
  const t = {
    kind: "term",
    id: "term:x",
    term: {
      id: "x",
      term: "ratio",
      glosses: { es: { text: "razón", review_status: "human" } },
      cognate: "true",
      notes: null,
    },
  };
  assert.equal(rowsFor(t)[0][7], "reviewed");
});

test("standards coverage report: code and short name only, no standard text", async () => {
  const subjects = await loadSubjects();
  const md = renderMarkdown(buildCoverage(subjects, ctx.standardsRefs));
  assert.match(md, /\| 6\.RP\.A\.1 \| Ratio Concept \|/);
  assert.match(md, /no reference list/);
  const ccss = JSON.parse(
    readFileSync(path.join(HERE, "../../data/ccss-standards.json"), "utf8"),
  ).standards;
  for (const e of Object.values(ccss))
    if (e.fullText)
      assert.ok(!md.includes(e.fullText.slice(0, 40)), "standard text must not appear");
});
