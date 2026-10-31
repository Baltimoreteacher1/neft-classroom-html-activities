// A student's browser is refused any path the teacher-surface gate matches (a name containing "teacher" or
// "dashboard"). A STATIC import of such a file stops the importing module, so the lab never starts: on 2026-10-31
// app.js imported dashboard-4.js and teacher-4.js and production showed an empty lab to every anonymous student.
// This fails when a statically imported module of the lab has a refused name. Load such a file with a guarded
// dynamic import() instead, as app.js and i18n-es-lab4.js now do.
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, posix, relative } from "node:path";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";

const root = new URL("../", import.meta.url).pathname;
const lab = join(root, "math/fluency-lab");
const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.js$/.test(name) && !/\.test\./.test(name)) files.push(full);
  }
})(lab);

const STATIC =
  /^\s*(?:import|export)\s[^"'`\n]*?from\s+["'](\.{1,2}\/[^"']+)["']|^\s*import\s+["'](\.{1,2}\/[^"']+)["']/gm;
const bad = [];
let checked = 0;
for (const file of files) {
  // A refused file is only reached through a guarded dynamic import, so what it imports cannot stop the lab.
  if (isTeacherSurface(`/${relative(root, file).split("\\").join("/")}`)) continue;
  const text = readFileSync(file, "utf8");
  for (const m of text.matchAll(STATIC)) {
    const spec = m[1] || m[2];
    const url = posix.normalize(
      posix.join("/", relative(root, file).split("\\").join("/"), "..", spec),
    );
    checked += 1;
    if (isTeacherSurface(url)) bad.push(`${relative(root, file)} statically imports ${url}`);
  }
}
const html = readFileSync(join(lab, "index.html"), "utf8");
for (const m of html.matchAll(/<script[^>]+src="\.\/([^"?]+)"/g)) {
  checked += 1;
  if (isTeacherSurface(`/math/fluency-lab/${m[1]}`))
    bad.push(`index.html loads ${m[1]} with a script tag`);
}
// A CSS @import of a refused name is dropped silently (the sheet answers 401), which strips the styling of every
// rule inside it: on 2026-10-31 journey-4.css imported dashboard-nav.css and the streak, badges and doors went unstyled.
const sheets = [];
(function walkCss(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walkCss(full);
    else if (/\.css$/.test(name)) sheets.push(full);
  }
})(lab);
for (const sheet of sheets) {
  const sheetUrl = `/${relative(root, sheet).split("\\").join("/")}`;
  if (isTeacherSurface(sheetUrl)) continue;
  for (const m of readFileSync(sheet, "utf8").matchAll(
    /@import\s+(?:url\()?["']?(\.{1,2}\/[^"')\s;]+)/g,
  )) {
    checked += 1;
    const url = posix.normalize(posix.join(sheetUrl, "..", m[1]));
    if (isTeacherSurface(url)) bad.push(`${relative(root, sheet)} @imports ${url}`);
  }
}
assert.ok(checked > 200, `the scan looked at ${checked} imports, expected hundreds`);
assert.deepEqual(
  bad,
  [],
  `a student is refused these files, so the lab would not start:\n${bad.join("\n")}`,
);

// The detector itself: the shapes that shipped are caught.
assert.ok(
  isTeacherSurface("/math/fluency-lab/dashboard-4.js") &&
    isTeacherSurface("/math/fluency-lab/teacher-4.js"),
  "the gate still refuses those names",
);
console.log(
  `fluency-gated-imports: ${checked} static imports across ${files.length} lab files, none a refused name`,
);
