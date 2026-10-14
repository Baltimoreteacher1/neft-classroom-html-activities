// The graphic novels' "Teacher" button (it opens the answer key) must not appear because of a URL alone.
//
// It used to be removed unless the address contained ?teacher=1, so appending those eleven characters
// handed any student the Teaching Guide. The engine's own rule is stated in engine/core/teacher-mode.js:
// "No URL backdoor INTO teacher mode — entry requires the password." The novels now follow it: the
// button stays only for ?teacher=1 AND a device that unlocked Teacher Mode (localStorage nt-teacher-mode).
// Storage that cannot be read fails closed. This runs the REAL injected script from a real page.

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";

const ROOT = process.cwd();
const NOVELS = join(ROOT, "graphic-novels");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const BLOCK =
  /<!-- nt-gn-teacher-gate:begin[^>]*-->\s*<script>([\s\S]*?)<\/script>\s*<!-- nt-gn-teacher-gate:end -->/;
const pages = walk(NOVELS).filter((f) => /id="teacherBtn"/.test(readFileSync(f, "utf8")));
assert.ok(
  pages.length >= 40,
  `expected the graphic-novel pages with a teacher button, found ${pages.length}`,
);

const scripts = new Set();
for (const file of pages) {
  const m = readFileSync(file, "utf8").match(BLOCK);
  assert.ok(m, `${file}: no teacher gate block`);
  scripts.add(m[1]);
}
assert.equal(scripts.size, 1, "every novel carries the same gate script");
const [gate] = scripts;

/** Run the gate in a page with the given address and storage; report whether the button survived. */
function survives({ search, unlocked, storage = "ok" }) {
  const dom = new JSDOM(`<body><button id="teacherBtn">Teacher</button></body>`, {
    url: `https://eduwonderlab.com/graphic-novels/x.html${search}`,
    runScripts: "outside-only",
  });
  const { window } = dom;
  if (storage === "blocked") {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
  } else if (unlocked) {
    window.localStorage.setItem("nt-teacher-mode", "1");
  }
  window.eval(gate);
  return !!window.document.getElementById("teacherBtn");
}

assert.equal(survives({ search: "", unlocked: false }), false, "plain student visit: no button");
assert.equal(
  survives({ search: "?teacher=1", unlocked: false }),
  false,
  "URL alone must not reveal it",
);
assert.equal(
  survives({ search: "", unlocked: true }),
  false,
  "an unlocked device still needs the teacher link",
);
assert.equal(survives({ search: "?teacher=0", unlocked: true }), false, "?teacher=0 stays student");
assert.equal(
  survives({ search: "?teacher=1", unlocked: true }),
  true,
  "unlocked teacher on the teacher link keeps it",
);
assert.equal(
  survives({ search: "?teacher=1", storage: "blocked" }),
  false,
  "unreadable storage fails closed",
);

console.log(
  `graphic-novel-teacher-gate: ${pages.length} pages share one gate; URL alone no longer reveals the answer key`,
);
