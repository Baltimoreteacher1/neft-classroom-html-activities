// "Ask the data" (access-teacher/predictive/ask.js): every supported question pattern parsed and answered on
// the synthetic demo class. Expected students are recomputed here straight from recordsOf / comparableSteps,
// never hard-coded, so the test holds when the demo data changes.
import assert from "node:assert/strict";
import test from "node:test";
import {
  answerQuery,
  parseQuestion,
  queryFromChips,
  schoolYearOf,
  tableToCSV,
  toQuestion,
} from "../access-teacher/predictive/ask.js";
import { demoClass } from "../access-teacher/predictive/demo.js";
import { comparableSteps } from "../access-teacher/predictive/interpret.js";
import { recordsOf } from "../access-teacher/predictive/records.js";
import { ASSESSMENTS, DOMAINS } from "../access-teacher/predictive/rules.js";

const TODAY = new Date("2024-05-15T12:00:00Z");
const CLASS = demoClass();
const latest = (st) => {
  const recs = recordsOf(st);
  return recs.filter((r) => ASSESSMENTS[r.assessmentType].kind === "annual").at(-1) || recs.at(-1);
};
const score = (rec, k) => (DOMAINS.includes(k) ? rec.domains[k] : rec.composites[k]);
const lv = (st, k) => {
  const x = score(latest(st), k).level;
  return x == null ? null : Math.round(x * 10) / 10;
};
const lastRow = (st, k) =>
  comparableSteps(st)
    .at(-1)
    ?.rows.find((r) => r.key === k) || null;
const names = (list) => list.map((s) => s.name).sort();
const ask = (q) => {
  const query = parseQuestion(q);
  assert.ok(query.understood, `understood: ${q}`);
  return { query, ans: answerQuery(query, CLASS, { today: TODAY }) };
};
const got = (q) => names(ask(q).ans.rows.map((r) => r.student));
const where = (fn) => names(CLASS.filter(fn));

test("demo class has the contrasts these questions need", () => {
  assert.equal(CLASS.length, 12);
  assert.ok(CLASS.some((s) => lv(s, "Writing") < 3));
  assert.ok(CLASS.some((s) => lastRow(s, "Reading")?.beyondError));
});

test("domain and overall thresholds, in several phrasings", () => {
  const below3W = where((s) => lv(s, "Writing") != null && lv(s, "Writing") < 3);
  for (const q of [
    "below 3 in writing",
    "writing under 3.0",
    "students with writing less than 3",
    "escribir menos de 3",
  ])
    assert.deepEqual(got(q), below3W, q);
  const atLeast45 = where((s) => lv(s, "Overall") != null && lv(s, "Overall") >= 4.5);
  for (const q of [
    "at least 4.5 overall",
    "overall 4.5 or higher",
    "overall 4.5 and up",
    "overall >= 4.5",
  ])
    assert.deepEqual(got(q), atLeast45, q);
  assert.deepEqual(
    got("above 4 in reading"),
    where((s) => lv(s, "Reading") > 4),
  );
  assert.deepEqual(
    got("at most 4 in leer"),
    where((s) => lv(s, "Reading") != null && lv(s, "Reading") <= 4),
  );
  const r = ask("below 3 in writing").ans;
  assert.match(r.text, /^Students whose latest Writing level is below 3\.0$/);
  assert.match(
    r.rows[0].cells["Writing (latest level)"],
    /^\d\.\d [A-Z][a-z]+$/,
    "level shown with its label",
  );
});

test("a threshold with no domain assumes Overall and says so", () => {
  const { query, ans } = ask("below 4");
  assert.equal(query.conds[0].key, "Overall");
  assert.match(ans.text, /Overall assumed/);
});

test("growth counts only change beyond measurement error; otherwise no comparable result", () => {
  const real = (k, sign) =>
    where((s) => {
      const r = lastRow(s, k);
      return r?.beyondError === true && Math.sign(r.scaleChange) === sign;
    });
  const noComp = (k) => where((s) => lastRow(s, k)?.beyondError == null);
  assert.deepEqual(got("grew in reading"), real("Reading", 1));
  assert.deepEqual(got("dropped in listening"), real("Listening", -1));
  assert.deepEqual(got("leer creció"), real("Reading", 1));
  const { ans } = ask("grew in reading");
  assert.deepEqual(names(ans.excluded.map((x) => x.student)), noComp("Reading"));
  assert.ok(ans.excluded.every((x) => /no comparable result/.test(x.reason)));
  // The post-reset 2025-26 result is never compared with 2023-24.
  assert.ok(noComp("Reading").includes("Camila"));
  const top = ask("biggest growth in speaking").ans;
  const expected = CLASS.filter(
    (s) => lastRow(s, "Speaking")?.beyondError && lastRow(s, "Speaking").scaleChange > 0,
  )
    .sort(
      (a, b) =>
        lastRow(b, "Speaking").scaleChange - lastRow(a, "Speaking").scaleChange ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 5)
    .map((s) => s.name);
  assert.deepEqual(
    top.rows.map((r) => r.student.name),
    expected,
  );
});

test("gaps: missing domain, no result this year, not verified", () => {
  assert.deepEqual(
    got("missing speaking"),
    where((s) => {
      const x = score(latest(s), "Speaking");
      return x.level == null && x.scale == null;
    }),
  );
  assert.deepEqual(got("sin hablar"), got("missing speaking"));
  const year = schoolYearOf(TODAY);
  assert.equal(year, "2023-24");
  assert.deepEqual(
    got("no result this year"),
    where((s) => !recordsOf(s).some((r) => r.academicYear === year)),
  );
  assert.deepEqual(
    got("not verified"),
    where((s) => recordsOf(s).some((r) => !r.sourceVerified)),
  );
  assert.deepEqual(got("unverified"), got("not verified"));
});

test("relative profile: lowest and strongest domain", () => {
  const ext = (s, pick) => {
    const ls = DOMAINS.map((d) => latest(s).domains[d].level).filter((x) => x != null);
    return ls.length >= 2 && Math.min(...ls) !== Math.max(...ls) ? pick(...ls) : null;
  };
  const lowW = where(
    (s) =>
      latest(s).domains.Writing.level != null &&
      latest(s).domains.Writing.level === ext(s, Math.min),
  );
  assert.deepEqual(got("writing is their lowest"), lowW);
  assert.deepEqual(got("weakest in writing"), lowW);
  assert.deepEqual(
    got("strongest in reading"),
    where((s) => latest(s).domains.Reading.level === ext(s, Math.max)),
  );
});

test("grade filter, sorting and top-N", () => {
  assert.deepEqual(
    got("grade 6"),
    where((s) => String(latest(s).grade) === "6"),
  );
  assert.deepEqual(got("6th grade"), got("grade 6"));
  const low5 = CLASS.filter((s) => lv(s, "Writing") != null)
    .sort((a, b) => lv(a, "Writing") - lv(b, "Writing") || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((s) => s.name);
  assert.deepEqual(
    ask("lowest 5 in writing").ans.rows.map((r) => r.student.name),
    low5,
  );
  const top3 = CLASS.filter((s) => lv(s, "Overall") != null)
    .sort((a, b) => lv(b, "Overall") - lv(a, "Overall") || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map((s) => s.name);
  assert.deepEqual(
    ask("top 3 overall").ans.rows.map((r) => r.student.name),
    top3,
  );
});

test("combinations with and, a shared domain list, and counts", () => {
  const g6w3 = where(
    (s) => String(latest(s).grade) === "6" && lv(s, "Writing") != null && lv(s, "Writing") < 3,
  );
  const r = ask("grade 6 and below 3 in writing");
  assert.deepEqual(names(r.ans.rows.map((x) => x.student)), g6w3);
  assert.match(r.ans.text, /^Grade 6 students whose latest Writing level is below 3\.0$/);
  const both = where(
    (s) =>
      lv(s, "Reading") < 4 &&
      lv(s, "Writing") < 4 &&
      lv(s, "Reading") != null &&
      lv(s, "Writing") != null,
  );
  const c = ask("how many below 4 in reading and writing");
  assert.equal(c.query.count, true);
  assert.equal(c.ans.n, both.length);
  assert.equal(ask("¿cuántos leer al menos 4?").ans.n, where((s) => lv(s, "Reading") >= 4).length);
});

test("unknown phrasing is not guessed; the chip builder answers instead", () => {
  const q = parseQuestion("students who like pizza");
  assert.equal(q.understood, false);
  assert.deepEqual(q.unknown, ["students who like pizza"]);
  const hint = parseQuestion("kids struggling with writing around 3").hints;
  assert.equal(hint.key, "Writing");
  assert.equal(hint.value, 3);
  const chips = queryFromChips({ key: "Writing", op: "lt", value: "3", grade: "6" });
  assert.deepEqual(
    names(answerQuery(chips, CLASS, { today: TODAY }).rows.map((r) => r.student)),
    got("grade 6 and below 3 in writing"),
  );
});

test("recent questions are rebuilt from the parse, so they round-trip and carry no free text", () => {
  for (const q of [
    "grade 6 and below 3 in writing",
    "biggest growth in speaking",
    "writing is their lowest",
    "how many at least 4.5 overall",
    "missing speaking Amara",
  ]) {
    const p = parseQuestion(q);
    const canon = toQuestion(p);
    assert.ok(!/amara/i.test(canon));
    const strip = (cs) => cs.map(({ assumed, ...c }) => c);
    assert.deepEqual(strip(parseQuestion(canon).conds), strip(p.conds), canon);
    assert.deepEqual(parseQuestion(canon).sort, p.sort, canon);
  }
});

test("CSV export quotes per RFC 4180 and neutralises spreadsheet formulas", () => {
  assert.equal(
    tableToCSV([
      ["a", 'b "c"'],
      ["=1+1", "x,y"],
    ]),
    'a,"b ""c"""\r\n\'=1+1,"x,y"',
  );
});
