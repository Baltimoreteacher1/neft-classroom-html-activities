#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { learningLabResources } from "../scripts/generate-curriculum-launch-manifest.mjs";

const read = (path) => JSON.parse(readFileSync(new URL("../" + path, import.meta.url), "utf8"));
const catalog = read("data/curriculum-manifest.json");
const launch = read("data/curriculum-launch-manifest.json");
const registry = read("data/learning-labs.json");
const mapped = learningLabResources(registry, catalog.lessons);
assert.equal(mapped.size, catalog.lessons.length, "every current core lesson has an authored lab");
const expectedReadiness = catalog.lessons.filter((lesson) => lesson.resources.readiness?.exists);
assert.equal(expectedReadiness.length, 64);
assert.equal(launch.lessons.filter((lesson) => lesson.resources.readiness).length, 64);
for (const lesson of launch.lessons) {
  const canonical = catalog.lessons.find((item) => item.id === lesson.id);
  assert.equal(lesson.resources.learningLab, mapped.get(lesson.id));
  assert.equal(lesson.resources.readiness, canonical.resources.readiness?.path);
}

const sample = registry.labs[0];
const known = sample.lessons.map((id) => ({ id }));
const rejectedPaths = [
  "https://example.com/lab/",
  "//example.com/lab/",
  "/teacher-tools/",
  "/curriculum/learning-labs/../teacher/",
  `/curriculum/learning-labs/${sample.id}/?redirect=https://example.com`,
  `/curriculum/learning-labs/${sample.id}/#teacher`,
  `/curriculum/learning-labs/${sample.id}/%2e%2e/`,
  `/curriculum/learning-labs/${sample.id}\\index.html`,
];
for (const href of rejectedPaths) {
  assert.throws(() => learningLabResources({ labs: [{ ...sample, href }] }, known), /Unsafe/);
}
assert.throws(() => learningLabResources({ labs: [{ ...sample, id: "../teacher" }] }, known), /ID/);
assert.throws(() => learningLabResources({ labs: [sample, sample] }, known), /Duplicate.*ID/);
assert.throws(
  () =>
    learningLabResources(
      { labs: [{ ...sample, lessons: [sample.lessons[0], sample.lessons[0]] }] },
      known,
    ),
  /Duplicate.*assignment/,
);
assert.throws(
  () => learningLabResources({ labs: [{ ...sample, lessons: ["99-99"] }] }, known),
  /Unknown/,
);
assert.throws(
  () => learningLabResources({ labs: [{ ...sample, lessons: [] }] }, known),
  /no lessons/,
);
assert.throws(
  () =>
    learningLabResources(
      {
        labs: [
          {
            ...sample,
            id: "nonexistent-contract-fixture",
            href: "/curriculum/learning-labs/nonexistent-contract-fixture/",
          },
        ],
      },
      known,
    ),
  /Missing/,
);
console.log(
  "✓ launch resources: all 84 lab mappings, 64 available readiness pages, strict paths, existence, and assignment validation",
);
