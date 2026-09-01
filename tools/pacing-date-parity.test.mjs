#!/usr/bin/env node
/**
 * SY26-27 pacing dates have exactly one authority: the imported plan.
 *
 * `data/pacing-unit-ranges.json` is generated from
 * `docs/pacing-sources/plan-baseline.json`. The curriculum hub used to keep a
 * second, hand-typed calendar in `assets/curriculum-district-pacing.js`. Those
 * copies drifted — Unit 7 opened 2026-12-08 in the plan and 1/4/27 in the hub
 * fallback, a 27-day miss that would open the wrong unit if the ranges fetch
 * failed or ran after `NTDistrictPacing.today()`.
 *
 * This gate holds the generated hub fallback to the ranges file, forbids a
 * second authored schedule in the crosswalk, and pins the consumers so they
 * cannot silently grow another calendar.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import {
  authoredHasIndependentDates,
  datesFromRanges,
  diffPacingDates,
  PACING_DATES_MODULE,
  PACING_DATES_SCRIPT,
  usDate,
} from "./lib/pacing-dates.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const readJson = (rel) => JSON.parse(read(rel));

const RANGES_PATH = "data/pacing-unit-ranges.json";
const HUB_JS = PACING_DATES_MODULE;
const GENERATED_JS = PACING_DATES_SCRIPT.replace(/^\//, "");
const HUB_HTML = "curriculum/index.html";

function loadGeneratedDates(src) {
  const sandbox = { window: {} };
  vm.runInNewContext(src, sandbox);
  return sandbox.window.__NT_PACING_DATES || null;
}

/* ── Detectors, mutation-tested before the real files ─────────────────────── */

test("usDate prints the hub M/D/YY form without a UTC shift", () => {
  assert.equal(usDate("2026-12-08"), "12/8/26");
  assert.equal(usDate("2027-01-20"), "1/20/27");
});

test("a 27-day Unit 7 drift is a parity failure", () => {
  const expected = datesFromRanges({
    units: [
      {
        sequence: 5,
        startDate: "2026-12-08",
        endDate: "2027-01-20",
        instructionalDays: 22,
      },
    ],
  });
  const stale = {
    5: { start_date: "1/4/27", end_date: "1/21/27", instructional_days: 19 },
  };
  const diffs = diffPacingDates(expected, stale);
  assert.ok(
    diffs.some((d) => d.sequence === "5" && d.field === "start_date" && d.actual === "1/4/27"),
    `expected Unit 7 start drift, got ${JSON.stringify(diffs)}`,
  );
});

test("authoredHasIndependentDates ignores the generated payload", () => {
  const clean = `const crosswalk = [{ sequence: 1, district_title: "Pre-Unit" }];\n`;
  const dirty = `${clean}      start_date: "1/4/27",\n      end_date: "1/21/27",\n`;
  assert.equal(authoredHasIndependentDates(clean), false);
  assert.equal(authoredHasIndependentDates(dirty), true);
});

/* ── Live artifacts ───────────────────────────────────────────────────────── */

test("generated hub dates match data/pacing-unit-ranges.json exactly", () => {
  const ranges = readJson(RANGES_PATH);
  const expected = datesFromRanges(ranges);
  const src = read(GENERATED_JS);
  const actual = loadGeneratedDates(src);
  assert.ok(actual, `${GENERATED_JS} did not assign window.__NT_PACING_DATES`);
  const diffs = diffPacingDates(expected, actual);
  assert.deepEqual(
    diffs,
    [],
    `${GENERATED_JS} drifted from ${RANGES_PATH}: ${JSON.stringify(diffs)}`,
  );
});

test("the district-pacing crosswalk does not author its own start/end dates", () => {
  const src = read(HUB_JS);
  assert.equal(
    authoredHasIndependentDates(src),
    false,
    `${HUB_JS} still types start_date/end_date in the crosswalk — those must come from ${GENERATED_JS}`,
  );
});

test("the hub applies generated dates before publishing NTDistrictPacing", () => {
  const src = read(HUB_JS);
  const applyAt = src.indexOf("applyGeneratedDates");
  const publishAt = src.indexOf("window.NTDistrictPacing");
  assert.ok(applyAt >= 0, `${HUB_JS} no longer applies the generated fallback dates`);
  assert.ok(
    publishAt > applyAt,
    "NTDistrictPacing is published before generated dates are applied",
  );
  assert.match(src, /window\.__NT_PACING_DATES/);
});

test("the hub page loads generated dates before the pacing module", () => {
  const html = read(HUB_HTML);
  const datesAt = html.indexOf(PACING_DATES_SCRIPT);
  const moduleAt = html.indexOf(`/${HUB_JS}`);
  assert.ok(datesAt >= 0, `${HUB_HTML} does not load ${PACING_DATES_SCRIPT}`);
  assert.ok(moduleAt > datesAt, "the pacing module loads before its generated dates");
});

test("unit order in the generated dates follows the pacing plan", () => {
  const ranges = readJson(RANGES_PATH);
  const expected = ranges.units.map((u) => u.sequence);
  const actual = Object.keys(datesFromRanges(ranges)).map(Number);
  assert.deepEqual(actual, expected);
  assert.deepEqual(
    expected,
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "district sequence length changed — confirm against docs/pacing-sources/planning-notes.md, do not reorder here",
  );
});

test("teacher-facing consumers cannot silently use a second calendar", () => {
  const planning = read("assets/curriculum-teacher-planning.js");
  assert.match(planning, /pacing-unit-ranges\.json/);
  assert.doesNotMatch(planning, /NTDistrictPacing/);

  const planner = read("curriculum/planning/planning-store.js");
  assert.match(planner, /pacing-baseline-2026-27\.json/);
  assert.doesNotMatch(planner, /curriculum-district-pacing/);

  const workflow = read("assets/curriculum-teacher-workflow.js");
  assert.match(workflow, /NTDistrictPacing/);
  assert.match(read(HUB_JS), /window\.NTDistrictPacing/);

  const drive = read("scripts/sync-curriculum-to-drive.mjs");
  assert.match(drive, /pacing-unit-ranges\.json/);
  assert.doesNotMatch(drive, /curriculum-district-pacing/);
});

test("the sequence dropdown does not type a second calendar into its labels", () => {
  const html = read(HUB_HTML);
  const select = /<select[^>]*id="district-seq-select"[\s\S]*?<\/select>/.exec(html);
  assert.ok(select, `${HUB_HTML} no longer has the district sequence dropdown`);
  const dates = select[0].match(/\d{1,2}\/\d{1,2}\/\d{2}/g) || [];
  assert.deepEqual(
    dates,
    [],
    `${HUB_HTML} hand-types dates into the sequence options (${dates.join(", ")}) — ` +
      `they must be printed from the crosswalk by syncSeqLabels(), or the label and ` +
      `getActiveDistrictSeq() drift apart on the same record`,
  );
});

test("the hub prints the dropdown labels from the dates it acts on", () => {
  const src = read(HUB_JS);
  assert.match(
    src,
    /function syncSeqLabels\(/,
    `${HUB_JS} no longer prints the sequence labels from the crosswalk`,
  );
  // It has to run after BOTH date sources land, or the label states one
  // calendar while the behaviour uses the other — the defect this pins.
  const applyAt = src.indexOf("applyGeneratedDates();");
  const syncAt = src.indexOf("syncSeqLabels", applyAt);
  assert.ok(syncAt > applyAt, "labels are printed before the generated dates are applied");
  const reconcileAt = src.indexOf("function reconcile(");
  assert.ok(
    src.indexOf("syncSeqLabels();", reconcileAt) > reconcileAt,
    "reconcile() overlays live pacing without re-printing the labels",
  );
});

test("the generated dates file names the importer as owner", () => {
  const src = read(GENERATED_JS);
  assert.match(src, /GENERATED by tools\/import-pacing-baseline\.mjs/);
  assert.match(src, /do not hand-edit/);
});
