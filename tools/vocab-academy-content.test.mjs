// Vocabulary Academy — content validator, index builder and editorial sampler.
// Run: node --test tools/vocab-academy-content.test.mjs
// Everything here runs against a throwaway content tree, so it passes while real units are still being written.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { SHIPPED_GRADES } from "../access-practice-lab/src/vocab-academy/contract.js";
import { buildIndex, indexText } from "./build-vocab-academy-index.mjs";
import { corpusStats, validateCorpus } from "./lib/vocab-academy-run.mjs";
import { checkUnit } from "./lib/vocab-academy-schema.mjs";
import { loadCorpus, VA_DIR } from "./lib/vocab-academy-scope.mjs";
import { runSelfTests, synthGrade } from "./lib/vocab-academy-selftest.mjs";
import { drawSample, mandatoryReasons, sampleTarget } from "./vocab-academy-editorial-sample.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const ref = JSON.parse(readFileSync(join(ROOT, "docs/vocab-academy/reference-unit.json"), "utf8"));
const clone = (x) => JSON.parse(JSON.stringify(x));

/** A content tree holding the reference unit as grade 6 unit 1 with a PLAN-shaped grade.json. */
function fixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "va-content-"));
  const dir = join(root, VA_DIR, "g6");
  mkdirSync(dir, { recursive: true });
  const grade = synthGrade(
    "6",
    ref.words.map((w) => ({ hw: w.hw, pos: w.pos })),
  );
  grade.units[0].title = ref.title;
  grade.units[0].theme = ref.theme;
  writeFileSync(join(dir, "grade.json"), JSON.stringify(grade));
  writeFileSync(join(dir, "u01.json"), JSON.stringify(ref));
  return root;
}
const run = (script, args, root) =>
  spawnSync(process.execPath, [join(ROOT, "tools", script), ...args, "--root", root], {
    encoding: "utf8",
    cwd: ROOT,
  });

test("every detector self-test passes (mutations of the reference unit are all caught)", () => {
  const results = runSelfTests(ref);
  assert.ok(results.length >= 90, `expected at least 90 self-tests, got ${results.length}`);
  const bad = results.filter((r) => !r.ok);
  assert.deepEqual(
    bad.map((b) => `${b.name}: ${b.detail}`),
    [],
  );
  // the detectors are named, not generic: at least 25 distinct "detects" cases exist
  assert.ok(results.filter((r) => r.name.startsWith("detects")).length >= 25);
});

test("the untouched reference unit passes with no errors and no warnings", () => {
  const r = checkUnit(clone(ref));
  assert.deepEqual(r.issues, []);
});

test("a mutated reference unit fails, and the failure names the unit and the word", () => {
  const u = clone(ref);
  u.words[0].def = "Being cautious about danger.";
  const r = checkUnit(u);
  const hit = r.issues.find((i) => i.code === "def-headword");
  assert.ok(hit);
  assert.match(hit.loc, /g6-u01/);
  assert.match(hit.loc, /cautious/);
});

test("a sweep of zero scope files fails, never passes", () => {
  const empty = loadCorpus(mkdtempSync(join(tmpdir(), "va-empty-")));
  const res = validateCorpus(empty, {});
  assert.match(res.fatal ?? "", /ZERO scope files/);
  const root = fixtureRoot();
  try {
    const one = validateCorpus(loadCorpus(root), { onlyGrade: "7" });
    assert.match(one.fatal ?? "", /ZERO scope files for grade 7/);
    assert.match(
      validateCorpus(loadCorpus(root), { onlyGrade: "12" }).fatal ?? "",
      /not a shipped grade/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("default mode passes a scope file plus the reference unit; --complete fails it", () => {
  const root = fixtureRoot();
  try {
    const def = run("validate-vocab-academy.mjs", [], root);
    assert.equal(def.status, 0, def.stdout + def.stderr);
    assert.match(def.stdout, /PASS \(default\)/);
    const comp = run("validate-vocab-academy.mjs", ["--complete"], root);
    assert.equal(comp.status, 1);
    assert.match(comp.stdout + comp.stderr, /unit-missing|grade-exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CLI exits non-zero on a broken unit file and names the file", () => {
  const root = fixtureRoot();
  try {
    const u = clone(ref);
    u.words[2].cloze.s = "No blank here.";
    writeFileSync(join(root, VA_DIR, "g6", "u01.json"), JSON.stringify(u));
    const r = run("validate-vocab-academy.mjs", [], root);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /g6\/u01\.json/);
    assert.match(r.stdout, /cloze-blank/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CLI fails when a headword is a target in two grades, and passes once it is removed", () => {
  const root = fixtureRoot();
  try {
    const g7 = synthGrade("7");
    g7.units[0].words[0] = { hw: ref.words[0].hw, pos: ref.words[0].pos, tier: "tier2", cats: [] };
    mkdirSync(join(root, VA_DIR, "g7"));
    writeFileSync(join(root, VA_DIR, "g7", "grade.json"), JSON.stringify(g7));
    const bad = run("validate-vocab-academy.mjs", [], root);
    assert.equal(bad.status, 1);
    assert.match(bad.stdout, /scope-dup/);
    assert.match(bad.stdout, /cautious\/adj/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("index.json: complete shipped-grade shape, deterministic, no 9-12, --check detects drift", () => {
  const root = fixtureRoot();
  try {
    mkdirSync(join(root, VA_DIR, "g9"));
    writeFileSync(join(root, VA_DIR, "g9", "grade.json"), JSON.stringify(synthGrade("9")));
    const a = buildIndex(loadCorpus(root));
    const b = buildIndex(loadCorpus(root));
    assert.equal(indexText(a), indexText(b), "two builds are byte-identical");
    assert.deepEqual(
      Object.keys(a.grades).sort(),
      [...SHIPPED_GRADES].sort(),
      "exactly K-8 (JS puts integer keys first, so order is by key, not curriculum)",
    );
    assert.equal(a.grades["6"].unitCount, 1);
    assert.equal(a.grades["6"].wordCount, ref.words.length);
    assert.equal(a.grades.K.unitCount, 0);
    assert.deepEqual(a.grades.K.units, []);
    assert.deepEqual(a.totals, { grades: 1, units: 1, words: ref.words.length });
    assert.equal(a.words["va.cautious.adj"].unit, "g6-u01");
    assert.equal(a.words["va.cautious.adj"].grade, "6");
    assert.deepEqual(a.grades["6"].units[0].words[0], {
      id: "va.cautious.adj",
      hw: "cautious",
      pos: "adj",
    });
    assert.ok(a.grades["6"].units[0].file.endsWith("/g6/u01.json"));

    assert.equal(
      run("build-vocab-academy-index.mjs", ["--check"], root).status,
      1,
      "missing index is stale",
    );
    assert.equal(run("build-vocab-academy-index.mjs", [], root).status, 0);
    assert.equal(run("build-vocab-academy-index.mjs", ["--check"], root).status, 0);
    const again = run("build-vocab-academy-index.mjs", [], root);
    assert.match(again.stdout, /already current/);
    const u = clone(ref);
    u.title = "Changed Title";
    writeFileSync(join(root, VA_DIR, "g6", "u01.json"), JSON.stringify(u));
    assert.equal(
      run("build-vocab-academy-index.mjs", ["--check"], root).status,
      1,
      "edited unit makes the index stale",
    );
    const idx = JSON.parse(readFileSync(join(root, VA_DIR, "index.json"), "utf8"));
    assert.equal(idx.schema, 1);
    assert.ok(!Object.keys(idx.grades).some((g) => ["9", "10", "11", "12"].includes(g)));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a stale index is a warning by default and an error under --complete", () => {
  const root = fixtureRoot();
  try {
    const corpus = loadCorpus(root);
    const soft = validateCorpus(corpus, { root });
    assert.ok(soft.issues.some((i) => i.code === "index-stale" && i.sev === "WARN"));
    const hard = validateCorpus(corpus, { root, complete: true });
    assert.ok(hard.issues.some((i) => i.code === "index-stale" && i.sev === "ERROR"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unreadable unit JSON is an error and index build refuses it", () => {
  const root = fixtureRoot();
  try {
    writeFileSync(join(root, VA_DIR, "g6", "u02.json"), "{ not json");
    const res = validateCorpus(loadCorpus(root), {});
    assert.ok(
      res.issues.some(
        (i) => i.code === "json-parse" && i.sev === "ERROR" && /u02\.json/.test(i.file),
      ),
    );
    assert.equal(run("build-vocab-academy-index.mjs", [], root).status, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the _fixture folder is ignored by the loader", () => {
  const root = fixtureRoot();
  try {
    cpSync(join(root, VA_DIR, "g6"), join(root, VA_DIR, "_fixture"), { recursive: true });
    const c = loadCorpus(root);
    assert.equal(c.units.length, 1);
    assert.equal(c.strays.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("editorial sample: seeded, reproducible, honours the always-in rules and band targets", () => {
  assert.equal(sampleTarget("K", 12), 4);
  assert.equal(sampleTarget("2", 15), 5);
  assert.equal(sampleTarget("3", 18), 5);
  assert.equal(sampleTarget("6", 20), 5);
  assert.equal(sampleTarget("6", 3), 3, "never more than the units that exist");
  const mk = (n, over = {}) => ({
    g: "6",
    data: {
      id: `g6-u${String(n).padStart(2, "0")}`,
      n,
      strand: "thematic",
      passage: { genre: "narrative" },
      editorial: { needsReview: [] },
      words: [{ hw: "a" }, { hw: "b" }, { hw: "c" }, { hw: "d" }],
      ...over,
    },
  });
  const units = Array.from({ length: 20 }, (_, i) => mk(i + 1));
  units[6] = mk(7, { strand: "morphology" });
  units[8] = mk(9, { passage: { genre: "science" } });
  units[11] = mk(12, { editorial: { needsReview: ["etymology"] } });
  const s1 = drawSample(units, "seed-a");
  const s2 = drawSample(units, "seed-a");
  assert.deepEqual(s1, s2, "same seed, same draw");
  const ids = s1.grades["6"].full.map((f) => f.id);
  for (const must of ["g6-u01", "g6-u07", "g6-u09", "g6-u12"])
    assert.ok(ids.includes(must), `${must} is always sampled`);
  assert.equal(ids.length, 5, "fills to the band target and no further");
  assert.equal(s1.grades["6"].spot.length, 15, "every other unit gets a spot check");
  assert.ok(s1.grades["6"].spot.every((x) => x.words.length === 3));
  assert.ok(mandatoryReasons(units[0].data).includes("unit 1 of the grade"));
  const different = [1, 2, 3, 4, 5, 6].map((k) =>
    drawSample(units, `seed-${k}`)
      .grades["6"].full.map((f) => f.id)
      .join(),
  );
  assert.ok(new Set(different).size > 1, "different seeds draw differently");
});

test("corpusStats counts shipped grades only", () => {
  const root = fixtureRoot();
  try {
    const stats = corpusStats(loadCorpus(root));
    assert.equal(stats.total.units, 1);
    assert.equal(stats.total.words, ref.words.length);
    assert.equal(stats.total.passages, 1);
    assert.equal(stats.total.questions, ref.passage.qs.length);
    assert.equal(stats.per["6"].planUnits, 20);
    assert.deepEqual(Object.keys(stats.per).sort(), [...SHIPPED_GRADES].sort());
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
