import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// index.html calls into the wb-*.js extension layer from the board engine. Every
// call must resolve to something wb-core.js defines, so a missing or late module
// can never turn a board action into an exception.
const dir = "curriculum/math-workbench";
const html = readFileSync(`${dir}/index.html`, "utf8");
const core = readFileSync(`${dir}/wb-core.js`, "utf8");

const used = new Set([...html.matchAll(/\bMWB\.([A-Za-z]+)\b/g)].map((m) => m[1]));
assert.ok(used.size >= 8, `index.html uses ${used.size} MWB entry points`);
for (const name of used)
  assert.match(core, new RegExp(`MWB\\.${name}\\b`), `wb-core.js defines MWB.${name}`);

// engine regions that must route through the new modules
assert.match(html, /WBHist\.create\(/, "undo/redo uses the shared-history engine");
assert.doesNotMatch(html, /history\.push\(snapshot\(\)\)/, "no full-snapshot history left");
assert.doesNotMatch(
  html,
  /localStorage\.setItem\(LS_KEY/,
  "autosave no longer writes the whole notebook to one localStorage value",
);
assert.match(html, /WBStore\.create\(/, "saved notebook goes through wb-storage");
assert.match(html, /store\.holdUntil\(lastSession\)/, "a clean board cannot race the startup read");
assert.match(
  html,
  /store\.archiveSession\(raw\)/,
  "the previous session is archived before a clean start can replace it",
);
assert.match(html, /delete clone\.pid/, "a copied page gets its own saved record");

// the context is handed over before init(), so tools can render on the first frame
const ctxAt = html.indexOf("MWB.setContext(");
const initAt = html.lastIndexOf("init();");
assert.ok(ctxAt > 0 && ctxAt < initAt, "MWB.setContext runs before init()");

// every dropped tool type has a fallback so an object from a newer build never blanks the board
assert.match(html, /This tool needs a newer Workbench/);

console.log(`wb-engine-hooks: ${used.size} engine hooks all resolve`);
