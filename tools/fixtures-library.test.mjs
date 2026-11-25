// Fixture library: determinism, shape, coverage and the PII validator's negative controls.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import {
  ALIAS,
  BANDS,
  buildClass,
  createRng,
  DOMAINS,
  fixtureClasses,
  fixtureCorpus,
  GRADES,
  getFixtureClass,
  getFixtureHistory,
  hashSeed,
  validateFixture,
} from "../shared/fixtures/index.js";

test("prng: FNV-1a and mulberry32 vectors are pinned", () => {
  assert.equal(hashSeed("a"), 0xe40c292c);
  const r = createRng("a");
  assert.deepEqual(
    [r.next(), r.next(), r.next()],
    [0.621685681398958, 0.30822347407229245, 0.36686075991019607],
  );
  const x = createRng("s");
  for (let i = 0; i < 1000; i++) {
    const n = x.int(3, 7);
    assert.ok(n >= 3 && n <= 7 && Number.isInteger(n));
  }
  assert.deepEqual(
    createRng("q").shuffle([1, 2, 3, 4, 5]),
    createRng("q").shuffle([1, 2, 3, 4, 5]),
  );
});

test("prng: fork does not advance the parent", () => {
  const a = createRng("p");
  const b = createRng("p");
  a.fork("child").next();
  assert.equal(a.next(), b.next());
});

test("classes: K-8 covered, sizes 1-28, aliases Star 1..N, deterministic", () => {
  const classes = fixtureClasses();
  assert.deepEqual([...new Set(classes.map((c) => c.grade))].sort(), [...GRADES].sort());
  for (const c of classes) {
    assert.ok(c.students.length >= 12 && c.students.length <= 28, c.id);
    c.students.forEach((s, i) => {
      assert.equal(s.name, `Star ${i + 1}`);
      assert.match(s.name, ALIAS);
      assert.ok(BANDS.includes(s.band));
    });
  }
  assert.equal(Math.max(...classes.map((c) => c.students.length)), 28);
  assert.deepEqual(fixtureClasses(), classes);
  assert.deepEqual(
    getFixtureClass("fx-3-split"),
    classes.find((c) => c.id === "fx-3-split"),
  );
});

test("classes: band mixes differ and match their shares", () => {
  const emerging = getFixtureClass("fx-1-emerging").students.filter(
    (s) => s.band === "emerging",
  ).length;
  const bridging = getFixtureClass("fx-5-bridging").students.filter(
    (s) => s.band === "bridging",
  ).length;
  assert.ok(emerging >= 8 && bridging >= 8);
  const split = getFixtureClass("fx-3-split").students.map((s) => s.band);
  assert.ok(split.includes("emerging") && split.includes("bridging"));
  assert.throws(() => buildClass({ id: "x", grade: "9", size: 5, mix: "balanced" }));
  assert.throws(() => buildClass({ id: "x", grade: "3", size: 29, mix: "balanced" }));
  assert.throws(() => buildClass({ id: "x", grade: "3", size: 5, mix: "nope" }));
  assert.throws(() => getFixtureClass("missing"));
});

test("history: ordered, in range, every domain used, ability tracks band", () => {
  const cls = getFixtureClass("fx-6-split");
  const history = getFixtureHistory(cls);
  assert.equal(history.length, cls.students.length * 40);
  for (let i = 1; i < history.length; i++) assert.ok(history[i - 1].ts <= history[i].ts);
  assert.ok(history[0].ts >= "2026-09-08" && history.at(-1).ts < "2027-01-01");
  assert.deepEqual([...new Set(history.map((a) => a.domain))].sort(), [...DOMAINS].sort());
  const rate = (band) => {
    const ids = new Set(cls.students.filter((s) => s.band === band).map((s) => s.id));
    const rows = history.filter((a) => ids.has(a.studentId));
    return rows.filter((a) => a.correct).length / rows.length;
  };
  assert.ok(
    rate("emerging") < rate("bridging"),
    "bridging students should do better than emerging",
  );
  assert.deepEqual(getFixtureHistory("fx-6-split"), history);
});

test("corpus validates and the pinned digest holds", () => {
  const corpus = fixtureCorpus();
  assert.deepEqual(validateFixture(corpus), { ok: true, errors: [] });
  const run = spawnSync(process.execPath, ["tools/fixtures-digest.mjs"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
});

test("validator negative controls: every known-bad fixture is rejected", () => {
  const good = () => getFixtureClass("fx-4-emerging");
  const reject = (mutate, expected) => {
    const c = good();
    mutate(c);
    const { ok, errors } = validateFixture(c);
    assert.equal(ok, false, `accepted: ${expected}`);
    assert.ok(errors.join("\n").match(expected), `${expected} not in:\n${errors.join("\n")}`);
  };
  reject((c) => {
    c.students[0].name = "Maria Lopez";
  }, /not an alias/);
  reject((c) => {
    c.students[0].name = "Star 29";
  }, /not an alias/);
  reject((c) => {
    c.students[0].name = "Star 100";
  }, /not an alias/);
  reject((c) => {
    c.students[1].name = c.students[0].name;
  }, /duplicate alias/);
  reject((c) => {
    c.students[0].email = "kid@example.com";
  }, /forbidden field/);
  reject((c) => {
    c.students[0].birthplace = "Elsewhere";
  }, /forbidden field/);
  reject((c) => {
    c.students[0].countryOfBirth = "X";
  }, /forbidden field/);
  reject((c) => {
    c.students[0].homeLanguage = "X";
  }, /forbidden field/);
  reject((c) => {
    c.students[0].iep = true;
  }, /forbidden field/);
  reject((c) => {
    c.students[0].immigration_status = "x";
  }, /forbidden field/);
  reject((c) => {
    c.students[0].firstName = "Star 1";
  }, /only "name"/);
  reject((c) => {
    c.name = "Room 12 (call 410-555-0134)";
  }, /phone|Fixture class/);
  reject((c) => {
    c.students[0].id = "https://example.org/a";
  }, /url|slug/);
  reject((c) => {
    c.students[0].band = "123-45-6789";
  }, /ssn/);
  reject((c) => {
    c.students[0].band = "x".repeat(70);
  }, /free text/);
  reject((c) => {
    c.name = "Real School Grade 3";
  }, /Fixture class/);
  const history = getFixtureHistory(good());
  history[0].nodeId = "Free Text Node!";
  assert.equal(validateFixture(history).ok, false);
  const withNote = getFixtureHistory(good());
  withNote[0].comment = "ok";
  assert.equal(validateFixture(withNote).ok, false);
});
