import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import vm from "node:vm";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const root = new URL("../", import.meta.url);
execFileSync(process.execPath, ["tools/fluency-guide/build.mjs", "--check"], { cwd: root });
const getData = (html) =>
  JSON.parse(html.split("<script>window.FluencyData = ")[1].split(";</script>")[0]);
const teacherHTML = read("curriculum/fluency/teacher/index.html");
const studentHTML = read("curriculum/fluency/index.html");
const teacher = getData(teacherHTML);
const student = getData(studentHTML);
const lessons = teacher.units.flatMap((u) => u.lessons);
const publicLessons = student.units.flatMap((u) => u.lessons);
const source = JSON.parse(read("tools/fluency-guide/src/data/practice.json"));
assert.equal(lessons.length, 54);
assert.equal(publicLessons.length, 54);
assert.equal(teacher.studentPath, "../");
assert.equal(teacher.pdfPath, "printables/");
for (const l of lessons) {
  assert.deepEqual(l.practice, source[l.id], `stale practice bank: ${l.id}`);
  assert.equal(l.practice.length, 4);
  assert.deepEqual(
    l.practice.map((p) => p.skill),
    [1, 2, 3, 4],
  );
  assert.ok(l.reteach && l.errors && l.diagnostic);
  const s = publicLessons.find((x) => x.id === l.id);
  assert.ok(s, `public lesson missing: ${l.id}`);
  for (const key of ["reteach", "errors", "diagnostic", "reteach_source"]) {
    assert.equal(Object.hasOwn(s, key), false, `teacher data exposed: ${l.id}.${key}`);
  }
  assert.deepEqual(s.practice, l.practice);
}
assert.match(lessons.find((l) => l.id === "2-6").title, /Divide Multi-Digit/);
assert.equal(lessons.find((l) => l.id === "2-6").standard.code, "6.NS.B.2");
assert.equal(isTeacherSurface("/curriculum/fluency/"), false);
assert.equal(isTeacherSurface("/curriculum/fluency/teacher/"), true);
assert.equal(
  isTeacherSurface("/curriculum/fluency/teacher/printables/unit-2-teacher-keys.pdf"),
  true,
);
const context = { window: {} };
vm.runInNewContext(read("assets/curriculum-fluency.js"), context);
const manifest = JSON.parse(read("data/fluency-resources.json"));
const launch = JSON.parse(read("data/curriculum-launch-manifest.json"));
assert.equal(Object.keys(manifest.resources).length, 54);
for (const l of lessons) {
  assert.ok(
    launch.lessons.some((x) => x.id === l.id),
    `no site ID for ${l.id}`,
  );
  const resource = context.window.NT_FLUENCY.resourcesFor(l.id);
  assert.equal(resource.teacher, manifest.resources[l.id].teacher);
  assert.match(resource.teacher, /\/fluency\/teacher\/#view=studio/);
  assert.match(resource.student, /\/fluency\/#view=studio/);
  assert.equal(new URLSearchParams(resource.teacher.split("#")[1]).get("lesson"), l.id);
  assert.equal(new URLSearchParams(resource.student.split("#")[1]).get("lesson"), l.id);
}
for (const id of ["1-1", "10-1", "__proto__", "bad"])
  assert.equal(context.window.NT_FLUENCY.resourcesFor(id), null);
for (const name of ["app.js", "studio.js"]) {
  assert.ok(teacherHTML.includes(read(`tools/fluency-guide/src/${name}`)), `${name} not rebuilt`);
}
assert.ok(studentHTML.includes(read("tools/fluency-guide/src/studio.js")));
const catalog = JSON.parse(read("data/catalog.json"));
assert.equal(catalog.entries.find((e) => e.path === "/curriculum/fluency/").audience, "student");
assert.equal(
  catalog.entries.find((e) => e.path === "/curriculum/fluency/teacher/").audience,
  "teacher",
);
const hub = read("curriculum/index.html");
assert.match(hub, /id="fluency-feature-title"/);
assert.ok(
  hub.indexOf('src="/assets/curriculum-fluency.js"') <
    hub.indexOf('src="/assets/curriculum-teacher-workflow.js'),
);
assert.match(
  read("assets/curriculum-teacher-workflow.js"),
  /NT_FLUENCY\.resourcesFor\(lesson.id\)/,
);
for (const u of teacher.units)
  for (const suffix of ["worksheets", "teacher-keys"]) {
    assert.ok(
      existsSync(
        new URL(
          `../curriculum/fluency/teacher/printables/unit-${u.number}-${suffix}.pdf`,
          import.meta.url,
        ),
      ),
    );
  }
console.log(
  "Fluency readiness: 54 lesson mappings, 216 tasks, public/teacher isolation, source freshness, printables, and navigation contracts passed.",
);
