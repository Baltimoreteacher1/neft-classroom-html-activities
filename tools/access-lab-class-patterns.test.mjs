// Class view: aggregate pasted Save/Resume codes into recurring patterns without ever surfacing a name.
import assert from "node:assert/strict";
import test from "node:test";
import {
  classPanelHTML,
  classPatterns,
  readCode,
  splitCodes,
} from "../access-practice-lab/src/lab/class-patterns.js";
import { emptyState, LAB_KEY } from "../access-practice-lab/src/lab/store.js";

const T = "2026-11-22T10:00:00.000Z";
const str = (x) => String(x[Object.getOwnPropertySymbols(x)[0]]);
const ev = (gameId, tag, n = 1, kind = "round") =>
  Array.from({ length: n }, (_, i) => ({
    kind,
    gameId,
    gradeBand: "6-8",
    scaffoldTier: "guided",
    languageErrorTag: tag,
    ok: !tag,
    timestamp: `2026-11-2${i % 9}T10:00:00.000Z`,
  }));
// Same encoding as store.js exportCode(): the whole backup, including the student's name.
const code = (events, extra = {}) => {
  const state = { ...emptyState(T), events };
  const json = JSON.stringify({
    v: 1,
    data: {
      [LAB_KEY]: JSON.stringify(state),
      "accessPracticeLab:v1:studentName": "Maria Lopez",
      ...extra,
    },
  });
  return `ACCESS1.${btoa(unescape(encodeURIComponent(json)))}`;
};

test("readCode: reads only the lab record and rejects junk without throwing", () => {
  const ok = readCode(code(ev("sentence-factory", "MISSING_SUBJECT", 2)));
  assert.equal(ok.state.events.length, 2);
  assert.ok(!JSON.stringify(ok).includes("Maria"));
  assert.equal(readCode("hello").error, "not-a-code");
  assert.equal(readCode("ACCESS1.@@@").error, "unreadable");
  assert.equal(readCode(null).error, "not-a-code");
  const none = readCode(`ACCESS1.${btoa(JSON.stringify({ v: 1, data: {} }))}`);
  assert.equal(none.empty, true);
});

test("classPatterns: ranks by distinct students, then count; counts unreadable and empty codes", () => {
  const a = code([
    ...ev("sentence-factory", "MISSING_SUBJECT", 1),
    ...ev("connector-climb", "CONNECTOR_MISSING", 9),
  ]);
  const b = code(ev("sentence-factory", "MISSING_SUBJECT", 1));
  const c = code(ev("grammar-jungle", "MISSING_SUBJECT", 1));
  const d = code([]);
  const r = classPatterns([a, b, c, d, "garbage", ""].join("\n"));
  assert.equal(r.students, 4);
  assert.equal(r.unreadable, 1);
  assert.equal(r.noPractice, 1);
  assert.deepEqual(
    r.top.map((t) => [t.tag, t.students, t.count]),
    [
      ["MISSING_SUBJECT", 3, 3],
      ["CONNECTOR_MISSING", 1, 9],
    ],
  );
});

test("classPatterns: band filter, coverage and the 60-code cap", () => {
  const six = code(ev("fluency-echo", null, 1, "mission"));
  const r = classPatterns(six, { band: "6-8" });
  assert.ok(r.coverage.Speaking > 0 && r.coverage.Writing === 0);
  assert.equal(classPatterns(six, { band: "3-5" }).top.length, 0);
  assert.equal(splitCodes(Array(100).fill("x").join(" ")).length, 60);
  assert.equal(classPatterns("").students, 0);
});

test("classPanelHTML: privacy copy, bilingual labels, deep link to the remediation game, no names", () => {
  const r = classPatterns(
    [
      code(ev("sentence-factory", "MISSING_SUBJECT", 2)),
      code(ev("sentence-factory", "MISSING_SUBJECT", 1)),
    ].join("\n"),
  );
  const h = str(classPanelHTML("pasted", r, { band: "6-8" }));
  assert.match(h, /Class patterns/);
  assert.match(h, /Patrones de la clase/);
  assert.match(h, /data-cp-run/);
  assert.match(h, /games\/sentence-factory\?band=6-8/);
  assert.match(h, /2 students/);
  assert.doesNotMatch(h, /Maria|Lopez/);
  assert.match(str(classPanelHTML("", null)), /textarea/);
});
