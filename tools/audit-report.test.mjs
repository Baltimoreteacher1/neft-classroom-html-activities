// AUDIT_REPORT.md is built from data/audit/studio-audit/<lesson>.json: every lesson in Units 2-9 is covered, every file is
// well formed (a class, a root cause, a replacement spec for anything not ALIGNED), and the report on disk is current.
//   node tools/audit-report.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { load, problems, report } from "../scripts/audit/build-audit-report.mjs";
import { listLessonDirs, REPO_ROOT } from "./lib/curriculum-source.mjs";

const rows = load();
const want = listLessonDirs({ filter: /^\d+-\d+$/ }).filter((id) => {
  const u = Number(id.split("-")[0]);
  return u >= 2 && u <= 9;
});
const have = new Set(rows.map((r) => r.lesson));
for (const id of want) assert.ok(have.has(id), `${id} has an audit file`);
assert.equal(problems(rows).length, 0, problems(rows).join("; "));
assert.ok(
  readFileSync(join(REPO_ROOT, "AUDIT_REPORT.md"), "utf8") === report(rows),
  "AUDIT_REPORT.md is stale; run: node scripts/audit/build-audit-report.mjs",
);
console.log(
  `audit-report: ${rows.length} lessons audited, ${rows.reduce((n, r) => n + r.widgets.length, 0)} widgets, report current.`,
);
