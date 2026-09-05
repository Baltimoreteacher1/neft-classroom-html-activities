// curriculum-source-ratchet.test.mjs — direct readers of lessons/ may only shrink.
//
// Phase 2b of the productization plan: tools/lib/curriculum-source.mjs is the
// one seam through which tools and scripts reach curriculum content, because
// multi-tenancy needs the source swappable in ONE place. Every file that still
// hardcodes a lessons/ path is standing debt; this ratchet pins the count so a
// NEW direct reader fails the suite, and a migration lowers the pin in the
// same commit — the typecheck-ratchet idiom applied to curriculum access.
//
// The detector is a FIXED file-level pattern. Its absolute number matters less
// than its monotonic direction; do not "improve" the pattern and the pin in
// the same commit, because that hides real movement in the noise.
import { execFileSync } from "node:child_process";
import process from "node:process";

// Files allowed to know the lessons/ path: the seam itself, and this ratchet.
const ALLOWED = new Set([
  "tools/lib/curriculum-source.mjs",
  "tools/curriculum-source-ratchet.test.mjs",
]);

// The pin. Lower it in the same commit as a migration; never raise it without
// Joel's sign-off recorded in data/product-decisions.json.
const PIN = 216;

const PATTERN = String.raw`["'](\.\./)*lessons/|["']lessons["']`;

// ---- self-test: the detector must catch and must not over-catch ----
const MUST_CATCH = [
  'const dirs = readdirSync("lessons");',
  'const cfg = readFileSync("lessons/2-6/config.json");',
  'join(ROOT, "lessons", id, "config.json")',
  'const p = "../lessons/2-6/learn.html";',
];
const MUST_ALLOW = [
  'import { listLessonDirs } from "./lib/curriculum-source.mjs";',
  "// the lessons directory is owned by curriculum-source",
  'const label = "lesson catalogue";',
];
const re = new RegExp(PATTERN);
for (const line of MUST_CATCH) {
  if (!re.test(line)) {
    console.error(`SELF-TEST FAIL — detector missed: ${line}`);
    process.exit(1);
  }
}
for (const line of MUST_ALLOW) {
  if (re.test(line)) {
    console.error(`SELF-TEST FAIL — detector over-caught: ${line}`);
    process.exit(1);
  }
}

// ---- the count ----
let out = "";
try {
  out = execFileSync(
    "rg",
    ["-l", PATTERN, "tools", "scripts", "--glob", "*.mjs", "--glob", "*.js"],
    { encoding: "utf8" },
  );
} catch (e) {
  if (e.status !== 1) throw e; // 1 = zero matches, the dream state
}
const files = out
  .trim()
  .split("\n")
  .filter(Boolean)
  .filter((f) => !ALLOWED.has(f));

if (files.length > PIN) {
  console.error(
    `FAIL curriculum-source ratchet — ${files.length} direct lessons/ readers, pin is ${PIN}.`,
  );
  console.error(
    "A new file is reading lessons/ directly. Use tools/lib/curriculum-source.mjs " +
      "(listLessonDirs / lessonPath / loadLessonConfig) instead.",
  );
  process.exit(1);
}
if (files.length < PIN) {
  console.error(
    `curriculum-source ratchet — count dropped to ${files.length} (pin ${PIN}). ` +
      "Lower PIN to match in this commit so the gain cannot silently regress.",
  );
  process.exit(1);
}
console.log(
  `curriculum-source ratchet holds — ${files.length} direct lessons/ reader(s) (pin ${PIN}; self-tests 7/7). Target: 0.`,
);
