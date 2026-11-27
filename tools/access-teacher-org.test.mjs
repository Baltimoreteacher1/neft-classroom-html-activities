// Unit tests for Classroom Teacher Unit Finder (access-teacher/classroom/units.js)
// and ESOL Teacher Hub organization (access-teacher/esol-hub.js + access-teacher/index.html).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  domainSlug,
  extractUnitKeyWords,
  GRADES,
  normalizeActivities,
  SUBJECTS,
  unitStudioUrl,
  unitWorkspaceUrl,
  writingLabUrl,
} from "../access-teacher/classroom/units.js";

const CLASSROOM_HTML = readFileSync(
  new URL("../access-teacher/classroom/index.html", import.meta.url),
  "utf8",
);
const HUB_HTML = readFileSync(new URL("../access-teacher/index.html", import.meta.url), "utf8");
const ESOL_JS = readFileSync(new URL("../access-teacher/esol-hub.js", import.meta.url), "utf8");

test("Classroom Unit Finder covers K-8 grades and all 4 core subjects", () => {
  assert.deepEqual(GRADES, ["K", "1", "2", "3", "4", "5", "6", "7", "8"]);
  assert.deepEqual(SUBJECTS, ["ELA", "Math", "Science", "Social Studies"]);
});

test("Classroom Unit Finder builds valid Language Studio, Writing Lab, and unit workspace URLs", () => {
  assert.equal(unitStudioUrl("g6-math-u1"), "/bcpss-teachers/language-studio/?unit=g6-math-u1");
  assert.equal(
    unitStudioUrl("g6-math-u1", 3),
    "/bcpss-teachers/language-studio/?unit=g6-math-u1&a=3",
  );
  assert.equal(unitWorkspaceUrl("g6-math-u1"), "/bcpss-teachers/?unit=g6-math-u1");
  assert.equal(writingLabUrl("g6-math-u1"), "/bcpss-teachers/writing-lab/?unit=g6-math-u1");
});

test("normalizeActivities sorts by activity_order and links each item into the unit studio", () => {
  const detail = {
    unit: { id: "g6-math-u2" },
    activities: [
      { id: "a2", activity_order: 2, title: "Second", domain: "Speaking", duration_minutes: 10 },
      { id: "a1", activity_order: 1, title: "First", domain: "Listening", duration_minutes: 8 },
    ],
  };
  const acts = normalizeActivities(detail);
  assert.equal(acts.length, 2);
  assert.equal(acts[0].title, "First");
  assert.equal(acts[0].href, "/bcpss-teachers/language-studio/?unit=g6-math-u2&a=1");
  assert.equal(acts[1].href, "/bcpss-teachers/language-studio/?unit=g6-math-u2&a=2");
  assert.equal(domainSlug("Listening"), "listening");
  assert.equal(domainSlug("Vocabulary"), "vocab");
});

test("extractUnitKeyWords deduplicates and caps vocabulary terms from unit connections", () => {
  const detail = {
    connections: [
      { tier2_tier3_vocab: ["ratio", { term: "Ratio" }, { word: "rate" }, "equivalent"] },
    ],
  };
  assert.deepEqual(extractUnitKeyWords(detail, 2), ["ratio", "rate"]);
});

test("Classroom page mounts the Grade-Subject-Unit finder above the custom lesson kit", () => {
  const finderPos = CLASSROOM_HTML.indexOf('id="unitFinder"');
  const formPos = CLASSROOM_HTML.indexOf('id="lcForm"');
  assert.ok(finderPos > 0 && formPos > finderPos, "unitFinder appears before lcForm");
  assert.match(CLASSROOM_HTML, /\/access-teacher\/classroom\/units\.js/);
});

test("Teacher Hub prominently links BCPSS Teachers at the top and mounts the ESOL WIDA/Activities hub", () => {
  assert.match(HUB_HTML, /class="th-role-pill is-bcpss" href="\/bcpss-teachers\/"/);
  assert.match(HUB_HTML, /id="thEsolHub"/);
  assert.match(HUB_HTML, /\/access-teacher\/esol-hub\.js/);
  for (const domain of ["Listening", "Reading", "Speaking", "Writing"]) {
    assert.ok(ESOL_JS.includes(`id: "${domain}"`), `ESOL hub defines WIDA domain ${domain}`);
  }
  assert.ok(
    ESOL_JS.includes('id="thWidaDomains"'),
    "ESOL hub has WIDA Materials by Domain section",
  );
  assert.ok(ESOL_JS.includes('id="thJustActivities"'), "ESOL hub has Just Activities section");
});
