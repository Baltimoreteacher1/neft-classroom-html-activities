// The student hub's quick actions link to three pages per lesson. Every lesson in
// the pacing plan must have all three, or a "Get ready" tap would 404.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const window = {};
new Function("window", readFileSync(`${REPO_ROOT}/assets/pacing-days.generated.js`, "utf8"))(
  window,
);
const plan = window.__NT_PACING_DAYS;
const bases = new Set(plan.days.filter((d) => d[3]).map((d) => d[3].replace(/-catchup$/, "")));
assert.ok(bases.size > 50, "pacing plan lists lessons");

const pages = ["readiness/index.html", "worksheet.html", "student-help/index.html"];
for (const base of bases)
  for (const page of pages)
    assert.ok(existsSync(`${REPO_ROOT}/lessons/${base}/${page}`), `lessons/${base}/${page} exists`);

const source = readFileSync(`${REPO_ROOT}/assets/curriculum-home.js`, "utf8");
for (const route of ["/readiness/", "/worksheet.html", "/student-help/"])
  assert.ok(source.includes(route), `curriculum-home.js links ${route}`);
assert.ok(source.includes("/^\\/(?!\\/)/"), "resume card only links same-site paths");
// Lesson finder: markup ships hidden (no script = no dead search box) and every
// lesson in the plan has a bilingual title for it to match.
const hub = readFileSync(`${REPO_ROOT}/curriculum/index.html`, "utf8");
assert.match(hub, /<div class="hub-find" data-hub-find hidden>/, "finder ships hidden");
assert.match(
  hub,
  /<label class="hub-find__label" for="hub-find-input"/,
  "finder input is labelled",
);
for (const base of bases) {
  const [title, titleEs] = plan.lessons[base] || [];
  assert.ok(title && titleEs, `lesson ${base} has English and Spanish titles for the finder`);
}
console.log(`curriculum-home-student: ${bases.size} lessons x ${pages.length} pages ok`);
