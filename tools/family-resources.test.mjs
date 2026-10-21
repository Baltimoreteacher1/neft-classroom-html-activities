// Unit tests for the "Learn more online" resolver and renderer. The rules over the whole data
// file are tools/validate-family-resources.mjs; these pin the resolver on its own.
import assert from "node:assert/strict";
import test from "node:test";
import {
  getExternalResources,
  loadResources,
  MAX_LINKS,
  renderExternalResourcesSection,
  resourceLessonId,
  resourcesForLesson,
} from "../scripts/homework-external-resources.mjs";
import { checkResource, GENERIC_TITLE } from "./lib/family-resources.mjs";

const data = loadResources();

test("part and flagship pages resolve to their core lesson", () => {
  assert.equal(resourceLessonId("4-3-part2"), "4-3");
  assert.equal(resourceLessonId("3-2-part3"), "3-2");
  assert.equal(resourceLessonId("5-1-flagship"), "5-1");
  assert.equal(resourceLessonId("6-1-6-2-practice"), "6-1-6-2-practice");
});

test("at most two links, each verified", () => {
  for (const id of Object.keys(data.lessons)) {
    const links = resourcesForLesson(id);
    assert.ok(links.length <= MAX_LINKS, id);
    for (const l of links)
      assert.match(l.url, /^https:\/\/www\.khanacademy\.org\/.*\/v\/[^/]+$/, id);
  }
});

test("a part-two page links what its core lesson links", () => {
  assert.deepEqual(resourcesForLesson("4-3-part2"), resourcesForLesson("4-3"));
  assert.deepEqual(
    getExternalResources({ lessonId: "4-3" }, "4-3-part2"),
    resourcesForLesson("4-3"),
  );
});

test("the percent lessons link percent, not ratios", () => {
  for (const id of ["4-1", "4-2", "4-3", "4-4", "4-5"]) {
    const links = resourcesForLesson(id);
    assert.ok(links.length > 0, id);
    for (const l of links)
      assert.doesNotMatch(l.titleEn, /ratio|unit rate/i, `${id}: ${l.titleEn}`);
  }
});

test("lessons with nothing on topic link nothing, and Unit 10 is skipped", () => {
  for (const id of ["1-1", "1-5", "5-8", "5-9", "6-13", "10-1", "10-6", "no-such-lesson"])
    assert.deepEqual(resourcesForLesson(id), [], id);
});

test("an unverified resource is never offered", () => {
  const copy = JSON.parse(JSON.stringify(data));
  const rid = copy.lessons["4-3"].resources[0];
  copy.resources[rid].verification.ok = false;
  assert.equal(resourcesForLesson("4-3", copy).length, copy.lessons["4-3"].resources.length - 1);
});

test("the Spanish-mode link is the verified Spanish page, or the English page labelled as English", () => {
  const html = renderExternalResourcesSection([
    {
      source: "Khan Academy",
      titleEn: "A",
      titleEs: "B",
      url: "https://www.khanacademy.org/x/v/y",
      urlEs: "https://es.khanacademy.org/x/v/y",
    },
    {
      source: "Khan Academy",
      titleEn: "C",
      titleEs: "D",
      url: "https://www.khanacademy.org/x/v/z",
      urlEs: "",
    },
  ]);
  assert.match(html, /href="https:\/\/es\.khanacademy\.org\/x\/v\/y"[^>]*lang="es"/);
  assert.match(html, /Khan Academy en español/);
  assert.match(html, /href="https:\/\/www\.khanacademy\.org\/x\/v\/z"[^>]*lang="es"/);
  assert.match(html, /Khan Academy \(en inglés\)/);
});

test("the claim is rendered with its links or not at all", () => {
  assert.equal(renderExternalResourcesSection([]), "");
  assert.equal(renderExternalResourcesSection(undefined), "");
  const html = renderExternalResourcesSection(resourcesForLesson("3-1"));
  assert.match(html, /specific<\/strong> videos/);
  assert.equal(
    (html.match(/class="external-resource-link/g) || []).length,
    resourcesForLesson("3-1").length * 2,
  );
});

test("generic titles are recognised", () => {
  for (const t of [
    "Grade 6 math overview",
    "Resumen de matemáticas de 6° grado",
    "6th grade math",
    "All about ratios",
  ])
    assert.match(t, GENERIC_TITLE, t);
  for (const t of ["Intro to ratios", "Area of a triangle", "Statistical questions"])
    assert.doesNotMatch(t, GENERIC_TITLE, t);
});

test("every recorded resource passes the resource rules", () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const [id, r] of Object.entries(data.resources))
    assert.deepEqual(checkResource(id, r, today), [], id);
});
