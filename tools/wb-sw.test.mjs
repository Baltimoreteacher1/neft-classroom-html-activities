import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Every script/stylesheet the Workbench page loads from its own folder must be
// in the service worker's precache, or the first offline visit loads a page
// whose tools are missing.
const dir = "curriculum/math-workbench";
const html = readFileSync(`${dir}/index.html`, "utf8");
const sw = readFileSync(`${dir}/sw.js`, "utf8");
const own = [
  ...html.matchAll(/(?:src|href)="\/curriculum\/math-workbench\/([a-z0-9-]+\.(?:js|css))"/g),
].map((m) => m[1]);
assert.ok(own.length >= 15, `found ${own.length} Workbench files in index.html`);
for (const f of own)
  assert.match(sw, new RegExp(`"\\./${f.replace(".", "\\.")}"`), `${f} is precached`);

// the wb-*.js files load in dependency order: registry first, panel host before its sections
const order = own.filter((f) => f.startsWith("wb-") && f.endsWith(".js"));
const at = (f) => order.indexOf(f);
assert.equal(order[0], "wb-core.js", "the registry loads first");
assert.ok(
  at("wb-math.js") < at("wb-tools-grids.js"),
  "math helpers before the tools that use them",
);
for (const f of ["wb-draw.js", "wb-export.js", "wb-saves.js"])
  assert.ok(at("wb-edit.js") < at(f), `wb-edit.js (the panel host) loads before ${f}`);

// the cache name was bumped so existing visitors pick up the new file list
assert.match(sw, /const CACHE = "mwb-v[3-9]"/);
console.log("wb-sw: precache covers every Workbench file");
