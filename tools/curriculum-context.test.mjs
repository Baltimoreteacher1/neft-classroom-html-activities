import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { buildCurriculumContext, contextFiles } from "../scripts/generate-curriculum-context.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const example = buildCurriculumContext([
  [
    "2-1",
    {
      connect: { scenario: "A complete data question, with its final sentence." },
      projects: [
        {
          title: "Unit 8 Project — Statistics in Action",
          href: "/math/statistics/projects/",
          emoji: "📊",
        },
        { title: "Duplicate", href: "/math/statistics/projects/" },
        { title: "Unsafe", href: "javascript:alert(1)" },
        { title: "External", href: "//example.com/" },
      ],
    },
  ],
  ["9-1", {}],
]);
assert.equal(example.realWorld["2-1"], "A complete data question, with its final sentence.");
assert.deepEqual(example.projects["2-1"], [
  { text: "📊 Project — Statistics in Action", href: "/math/statistics/projects/" },
]);
assert.deepEqual(example.projects["9-1"], []);
assert.equal(example.realWorld["9-1"], undefined);

for (const [file, expected] of contextFiles()) {
  assert.equal(
    readFileSync(join(REPO_ROOT, file), "utf8"),
    expected,
    `${file} drifted from taught lesson content. Run npm run generate-curriculum-context.`,
  );
}
for (const file of ["curriculum/index.html", "curriculum/units/index.html"]) {
  const html = readFileSync(join(REPO_ROOT, file), "utf8");
  const context = html.indexOf('src="/curriculum/lesson-context.js"');
  assert.ok(
    context >= 0 && context < html.indexOf('src="/assets/curriculum-hub-search.js'),
    `${file} must load context before the browser builds its search data.`,
  );
}
const js = readFileSync(join(REPO_ROOT, "assets/curriculum-hub-search.js"), "utf8");
assert.match(js, /var LESSON_PROJECTS = window\.LESSON_PROJECTS \|\| \{\}/);
assert.doesNotMatch(
  js,
  /var UNIT_CULMINATING_PROJECT\s*=/,
  "Unit fallback comes from current unit resource links.",
);
assert.match(js, /endOfUnitRes\.concat\(unitRes\)/);
const generated = contextFiles().get("curriculum/lesson-context.js");
const projects = JSON.parse(
  generated
    .slice(generated.indexOf(" = ") + 3)
    .trim()
    .replace(/;$/, ""),
);
let links = 0;
for (const [id, resources] of Object.entries(projects)) {
  for (const resource of resources) {
    const target = join(REPO_ROOT, resource.href.split(/[?#]/)[0].replace(/^\//, ""));
    assert.ok(existsSync(target), `${id}: resource missing at ${resource.href}`);
    if (statSync(target).isDirectory())
      assert.ok(existsSync(join(target, "index.html")), `${id}: missing route index`);
    links++;
  }
}
assert.ok(links > 100, "The catalogue must actually contain and check project links.");
console.log(
  `Curriculum context: source fidelity, fallback wiring and ${links} local project links verified.`,
);
