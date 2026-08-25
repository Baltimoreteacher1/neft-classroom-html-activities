/* Tests for the exported pacing workbook.
 *
 * The claim being tested is narrow and specific: the workbook is built from the
 * LIVE plan, and its dates are real Excel dates. Both have a failure mode that
 * looks fine on screen — an export that silently ships the August baseline after
 * a March re-pace, and a date column that sorts alphabetically.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { resolveYear } from "./engine.js";
import { cellXml, pacingWorkbook, toSerial } from "./xlsx.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const baseline = JSON.parse(readFileSync(`${ROOT}/data/pacing-baseline-2026-27.json`, "utf8"));

/* The four labels the browser injects. Kept trivial here on purpose: this file
 * tests the workbook, not the wording. */
const ctx = {
  title: (d) => d.plan.planTitle || d.plan.lessonId || d.plan.dayType,
  statusWord: (d) => (d.actual ? d.actual.status : "Not yet taught"),
  detail: (d) => (d.plan.lessonId ? { standard: "6.RP.A.1", objective: "objective" } : null),
  unitLabel: (d) => d.plan.unitKey || "",
};

const build = (overlay) => pacingWorkbook(resolveYear(baseline, overlay), baseline.units, ctx);

const sheet = (files, n) => files[`xl/worksheets/sheet${n}.xml`];

test("the workbook carries the five sheets, in reading order", () => {
  const files = build({});
  const wb = files["xl/workbook.xml"];
  const names = [...wb.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(names, [
    "Year Pacing",
    "Unit Summary",
    "Calendar Events",
    "Flex Days",
    "Adjustment Log",
  ]);
});

test("every part an .xlsx needs is present and well-formed enough to open", () => {
  const files = build({});
  for (const required of [
    "[Content_Types].xml",
    "_rels/.rels",
    "xl/workbook.xml",
    "xl/_rels/workbook.xml.rels",
    "xl/styles.xml",
  ]) {
    assert.ok(files[required], `missing part: ${required}`);
  }
  for (const [path, xml] of Object.entries(files)) {
    assert.match(xml, /^<\?xml version="1\.0"/, `${path} has no XML declaration`);
    /* Cheap balance check: a truncated part is the failure that produces a file
     * Excel refuses to open with no useful message. */
    const open = (xml.match(/<[a-zA-Z]/g) || []).length;
    const close = (xml.match(/<\/[a-zA-Z]/g) || []).length + (xml.match(/\/>/g) || []).length;
    assert.equal(open, close, `${path} has unbalanced tags`);
  }
  /* Every sheet the content types and rels declare must actually exist. */
  const declared = [...files["[Content_Types].xml"].matchAll(/sheet(\d+)\.xml/g)].map((m) => m[1]);
  for (const n of declared) assert.ok(files[`xl/worksheets/sheet${n}.xml`], `sheet${n} declared but absent`);
});

test("dates are real Excel serials, not text", () => {
  assert.equal(toSerial("1900-01-01"), 2, "the epoch is Excel's, not Unix's");
  assert.equal(toSerial("2026-08-24"), 46258, "matches the serial the district workbook uses");
  assert.match(cellXml("A2", { d: "2026-08-24" }), /<c r="A2" s="1"><v>46258<\/v><\/c>/);
  assert.doesNotMatch(cellXml("A2", { d: "2026-08-24" }), /inlineStr/);

  const rows = sheet(build({}), 1);
  const firstDate = rows.match(/<c r="A2"[^>]*>(.*?)<\/c>/)[0];
  assert.match(firstDate, /s="1"/, "the date column carries the date format");
});

test("the Year Pacing sheet has one row per school date, plus a header", () => {
  const rows = sheet(build({}), 1);
  const count = (rows.match(/<row /g) || []).length;
  assert.equal(count, baseline.days.length + 1);
});

test("the export reflects the LIVE plan, not the baseline it started from", () => {
  const overlay = {
    "2026-10-13": {
      plan: { unitKey: "U4", dayType: "Lost Day", lessonId: null, planTitle: "Day lost" },
      note: "Assembly ran long",
      updatedAt: 1,
    },
  };
  const files = build(overlay);
  const year = sheet(files, 1);
  assert.match(year, /Assembly ran long/, "the live note reached the sheet");
  assert.match(year, /Lost Day/, "the live day type reached the sheet");

  /* And the original is still there beside it — the export is the record of the
   * change, not a replacement for it. */
  const adjustments = sheet(files, 5);
  assert.match(adjustments, /<v>46308<\/v>/, "2026-10-13 appears in the adjustment log");
  const baselineOnly = sheet(build({}), 5);
  assert.doesNotMatch(baselineOnly, /<row r="2"/, "an unedited plan has an empty adjustment log");
});

test("the adjustment log names both the original and the current plan", () => {
  const files = build({
    "2026-09-09": { plan: { unitKey: "U3", dayType: "Flex", lessonId: null }, updatedAt: 1 },
  });
  const log = sheet(files, 5);
  const original = baseline.days.find((d) => d.date === "2026-09-09");
  assert.match(log, new RegExp(original.plan.dayType), "the original day type is recorded");
  assert.match(log, /Flex/, "the current day type is recorded");
});

test("no calendar closure is dropped from the Calendar Events sheet", () => {
  const events = sheet(build({}), 3);
  for (const date of ["2026-09-07", "2026-12-23", "2027-01-18", "2027-03-26", "2027-05-31"]) {
    assert.match(events, new RegExp(`<v>${toSerial(date)}</v>`), `${date} is missing from events`);
  }
});

test("text is XML-escaped, so an ampersand in a note cannot break the file", () => {
  const files = build({
    "2026-09-09": { note: 'Ratios & rates — "double" check <b>', updatedAt: 1 },
  });
  const year = sheet(files, 1);
  assert.match(year, /Ratios &amp; rates/);
  assert.match(year, /&lt;b&gt;/);
  assert.doesNotMatch(year, /<b>/);
});
