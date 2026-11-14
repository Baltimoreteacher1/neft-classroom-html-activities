import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GRADES } from "../problem-bank.js";
import { topicsFor } from "../skill-path.js";
import { parsePath, skillPath, viewPath } from "./routes.js";

let skills = 0;
for (const { grade } of GRADES) {
  for (const skill of topicsFor(grade).flatMap((topic) => topic.skills)) {
    for (const stage of ["see", "try", "practice"]) {
      const path = skillPath(grade, skill.id, stage);
      const parsed = parsePath(new URL(path, "https://eduwonderlab.com").pathname);
      assert.deepEqual(parsed, { view: "skill", grade, skillId: skill.id });
      assert.equal(new URL(path, "https://eduwonderlab.com").searchParams.get("stage"), stage === "see" ? null : stage);
    }
    skills++;
  }
}
for (const view of ["home", "library", "progress"]) {
  assert.equal(parsePath(new URL(viewPath(view, 3), "https://eduwonderlab.com").pathname).view, view);
}
assert.equal(skillPath(3, "mul-6-9"), "/math/fluency-lab/grade-3/multiplication-6-9/");
assert.match(readFileSync("_redirects", "utf8"), /\/math\/fluency-lab\/\* \/math\/fluency-lab\/index\.html 200/);
console.log(`fluency shell routes: ${skills} skills, 3 stages, 3 primary paths, and deep-link rewrite passed`);
