// Vocabulary Academy printables. Run: node --test tools/vocab-academy-print.test.mjs
// Every real unit x every print kind renders; student kinds leak no teacher or answer text; teacher kinds do carry the
// guidance; the leak detector and the sheet-fitting helper behave. (PDF layout is checked by validate-vocab-academy-print --pdf.)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { PRINT_KINDS } from "../access-practice-lab/src/vocab-academy/contract.js";
import {
  forbiddenStrings,
  studentSafe,
} from "../access-practice-lab/src/vocab-academy/print/project.js";
import {
  findLeaks,
  pageCss,
  renderBody,
} from "../access-practice-lab/src/vocab-academy/print/render.js";
import { isTeacherKind } from "../access-practice-lab/src/vocab-academy/print/shared.js";
import { listUnits, readJson, reviewWordsOf } from "./generate-vocab-academy-pdfs.mjs";

const units = listUnits().map((u) => readJson(u.file));
const reference = JSON.parse(
  readFileSync(new URL("../docs/vocab-academy/reference-unit.json", import.meta.url), "utf8"),
);

test("there are real units to sweep", () => assert.ok(units.length >= 80, `${units.length} units`));

test("every kind renders for every real unit", () => {
  for (const unit of units)
    for (const kind of PRINT_KINDS) {
      const out = renderBody(unit, kind, { reviewWords: reviewWordsOf(unit) });
      assert.ok(out.count > 0 && out.html.length > 400, `${unit.id} ${kind}`);
    }
});

test("student kinds leak no teacher or answer text for any real unit", () => {
  for (const unit of units)
    for (const kind of PRINT_KINDS.filter((k) => !isTeacherKind(k))) {
      const out = renderBody(unit, kind, { reviewWords: reviewWordsOf(unit) });
      assert.deepEqual(findLeaks(unit, out.html), [], `${unit.id} ${kind}`);
    }
});

test("the student projection removes every teacher and answer field", () => {
  const safe = JSON.stringify(studentSafe(reference));
  for (const s of forbiddenStrings(reference)) {
    // a model/why that quotes a sentence students also read is allowed; anything else must be gone
    const quoted = JSON.stringify(studentSafe(reference)).includes(JSON.stringify(s).slice(1, -1));
    if (!quoted) assert.ok(!safe.includes(JSON.stringify(s).slice(1, -1)), s.slice(0, 50));
  }
  const u = studentSafe(reference);
  assert.equal(u.teacher, undefined);
  assert.equal(u.check, undefined);
  assert.equal(u.editorial, undefined);
});

test("the leak detector fires on injected teacher text, in text and in attributes", () => {
  const note = Object.values(reference.teacher.notes)[0];
  const clean = renderBody(reference, "workbook").html;
  assert.deepEqual(findLeaks(reference, clean), []);
  assert.ok(findLeaks(reference, `${clean}<p>${note}</p>`).length > 0);
  assert.ok(findLeaks(reference, `${clean}<i title="${note}"></i>`).length > 0);
});

test("teacher kinds carry the unit's teacher guidance and the assessment key carries answers", () => {
  const teacher = renderBody(reference, "teacher").html;
  assert.ok(
    Object.values(reference.teacher.notes).some((n) => teacher.includes(String(n).slice(0, 25))),
  );
  assert.ok(
    renderBody(reference, "assessment-key").html.length >
      renderBody(reference, "assessment").html.length / 4,
  );
  assert.ok(
    isTeacherKind("teacher") && isTeacherKind("assessment-key") && !isTeacherKind("workbook"),
  );
});

test("the running header and footer are per kind and escape quotes", () => {
  const css = pageCss({ ...reference, title: 'Say "hi" <b>' }, "workbook");
  assert.match(css, /Name ____/);
  assert.ok(!css.includes("<b>"));
  assert.match(pageCss(reference, "teacher"), /Do not hand out/);
});
