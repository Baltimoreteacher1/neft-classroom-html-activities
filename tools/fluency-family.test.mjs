import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { familyLaunch, familySessionLaunch } from "../math/fluency-lab/family/family-planner.js";
import { GRADES } from "../math/fluency-lab/problem-bank.js";

for (const grade of GRADES) {
  const nightly = new URL(
    familySessionLaunch({ grade: grade.grade, profile: 4, skill: grade.skills[0].id, lang: "es" }),
    "https://example.test/math/fluency-lab/family/",
  );
  assert.equal(nightly.pathname, "/math/fluency-lab/family/tonight.html");
  assert.equal(nightly.searchParams.get("grade"), String(grade.grade));
  assert.equal(nightly.searchParams.get("profile"), "4");
  assert.equal(nightly.searchParams.get("skill"), grade.skills[0].id);
  assert.equal(nightly.searchParams.get("lang"), "es");
  const url = new URL(
    familyLaunch({ grade: grade.grade, profile: 0, start: "mission" }),
    "https://example.test/math/fluency-lab/family/",
  );
  assert.equal(url.pathname, "/math/fluency-lab/");
  assert.equal(url.searchParams.get("grade"), String(grade.grade));
  assert.equal(url.searchParams.get("profile"), "0");
  assert.equal(url.searchParams.get("start"), "mission");
  assert.equal(url.searchParams.has("name"), false);
  assert.equal(url.searchParams.has("answer"), false);

  for (const skill of grade.skills) {
    const practice = new URL(
      familyLaunch({ grade: grade.grade, profile: 5, start: "practice", skill: skill.id }),
      "https://example.test/math/fluency-lab/family/",
    );
    assert.equal(practice.searchParams.get("skill"), `${grade.grade}:${skill.id}`);
    assert.equal(practice.searchParams.get("profile"), "5");
  }
}

assert.match(familyLaunch({ grade: 0, profile: 0, start: "daily" }), /grade=0/);
assert.throws(() => familyLaunch({ grade: 1, profile: 6, start: "daily" }), RangeError);
assert.throws(
  () => familyLaunch({ grade: 1, profile: 0, start: "practice", skill: "not-a-skill" }),
  RangeError,
);
assert.throws(() => familyLaunch({ grade: 1, profile: 0, view: "teacher" }), RangeError);
assert.match(familyLaunch({ grade: 3, profile: 1, start: "checkup" }), /start=checkup/);
assert.match(familyLaunch({ grade: 5, profile: 3, start: "realworld" }), /start=realworld/);
for (const view of ["games", "path"])
  assert.match(familyLaunch({ grade: 8, profile: 2, view }), new RegExp(`view=${view}`));

const page = await readFile(
  new URL("../math/fluency-lab/family/index.html", import.meta.url),
  "utf8",
);
const labPage = await readFile(new URL("../math/fluency-lab/index.html", import.meta.url), "utf8");
const client = await readFile(
  new URL("../math/fluency-lab/family/family.js", import.meta.url),
  "utf8",
);
const app = await readFile(new URL("../math/fluency-lab/app.js", import.meta.url), "utf8");
assert.match(page, /id="main"/);
assert.match(page, /id="family-profile"/);
assert.match(page, /id="print-coach"/);
for (const [, href] of page.matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)) {
  const destination = new URL(href, "https://example.test/math/fluency-lab/family/");
  assert.ok(
    destination.pathname.startsWith("/math/fluency-lab/"),
    "family link stays inside Math Fluency Lab: " + href,
  );
}
assert.match(labPage, /href="\.\/family\/"[^>]*data-i18n>Family Math Tonight/);
assert.match(client, /recommendations\(safeTutor\(\), grade\)/);
assert.match(client, /profileKey\(TUTOR_KEY, profile\)/);
assert.match(client, /setLang\(lang\)/);
assert.match(client, /familySessionLaunch\(/);
assert.match(client, /#tonight-link/);
assert.match(app, /initialParams\.get\("start"\) === "mission"/);
assert.match(app, /initialParams\.get\("start"\) === "practice"/);
assert.match(
  app,
  /requestedProfileValue === null \? Number\.NaN : Number\(requestedProfileValue\)/,
);
console.log(
  `Fluency family launch and local-evidence contracts passed (${GRADES.length} grades, ${GRADES.reduce((n, g) => n + g.skills.length, 0)} skill links).`,
);
