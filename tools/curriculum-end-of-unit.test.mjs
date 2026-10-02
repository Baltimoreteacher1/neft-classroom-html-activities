import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const manifest = JSON.parse(read("data/curriculum-launch-manifest.json"));
const pacing = JSON.parse(read("data/pacing-unit-ranges.json"));
const html = new JSDOM(read("curriculum/units/index.html"));
// Every student-safe authored end-of-unit link must survive into the picker.
for (const unit of html.window.document.querySelectorAll("details.unit")) {
  const number = Number(unit.id.replace("unit-", ""));
  const routes = new Set(
    [...manifest.unitResources, ...manifest.endOfUnit]
      .filter((r) => r.unit === number)
      .map((r) => r.resources.lesson),
  );
  for (const label of unit.querySelectorAll(".unit-res-label")) {
    if (!/end of unit/i.test(label.textContent)) continue;
    for (const a of label.parentElement.querySelectorAll("a.res[href]")) {
      if (
        a.classList.contains("hub-teacher-only") ||
        /teacher|answer.?key|\.pdf|docx/i.test(a.href + a.textContent)
      )
        continue;
      assert.ok(
        routes.has(a.getAttribute("href")),
        `Unit ${number}: missing ${a.textContent.trim()}`,
      );
    }
  }
}
for (const resource of manifest.unitResources) {
  const path = resource.resources.lesson.split(/[?#]/)[0];
  assert.ok(
    existsSync(new URL(`..${path}${path.endsWith("/") ? "index.html" : ""}`, import.meta.url)),
  );
}
const dom = new JSDOM(
  '<select id="district-seq-select"></select><select id="district-lesson-select"></select>',
  {
    url: "https://eduwonderlab.com/curriculum/",
    runScripts: "outside-only",
  },
);
const { window } = dom;
window.NTJsonCache = {
  json: async (url) => (url.includes("pacing-unit-ranges") ? pacing : manifest),
};
window.eval(read("assets/curriculum-district-pacing.js"));
await new Promise((r) => setTimeout(r, 30));
const select = window.document.getElementById("district-seq-select");
const lessons = window.document.getElementById("district-lesson-select");
let opened;
window.open = (url) => {
  opened = url;
};
for (const unit of pacing.units) {
  select.replaceChildren(new window.Option(unit.districtLabel, String(unit.sequence)));
  select.value = String(unit.sequence);
  window.onDistrictSeqChange(select.value);
  const resources = [...lessons.querySelectorAll('option[value^="unit_resource_"]')];
  if (unit.key === "PRE") {
    assert.ok(lessons.querySelector('option[value="project"]'));
    window.onDistrictLessonChange("project");
    assert.equal(opened, "/math/pre-unit/projects/");
    continue;
  }
  if (unit.curriculumUnit == null) {
    assert.equal(resources.length, 0);
    continue;
  }
  const expected = [
    ...manifest.unitResources,
    ...manifest.unitAssessments,
    ...manifest.endOfUnit,
  ].filter((r) => r.unit === unit.curriculumUnit);
  assert.ok(expected.length > 0);
  assert.deepEqual(
    resources.map((o) => o.value),
    expected.map((r) => `unit_resource_${r.id}`),
  );
  for (const resource of expected) {
    window.onDistrictLessonChange(`unit_resource_${resource.id}`);
    assert.equal(opened, resource.resources.lesson);
  }
  opened = null;
  window.onDistrictLessonChange("unit_resource_missing");
  assert.equal(opened, null);
}
html.window.close();
window.close();
console.log("End-of-unit source coverage, district dropdowns, and launch routes passed.");
