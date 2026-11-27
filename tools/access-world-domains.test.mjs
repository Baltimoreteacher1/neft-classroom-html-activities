#!/usr/bin/env node
// access-practice-lab/src/adventures/worlds/domains.js is derived from the worlds: each world's WIDA domains are the
// union of its missions' `domains`, in mission order. lab/meta.js reads the table so the seven world files stay off the
// app's entry chain (they were ~110 KB of every page load, home included). This recomputes the table and fails on drift,
// and checks meta.js and the entry chain never import the worlds again.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WORLD_DOMAINS } from "../access-practice-lab/src/adventures/worlds/domains.js";
import { WORLDS } from "../access-practice-lab/src/adventures/worlds/index.js";
import { DOMAINS, gameMeta } from "../access-practice-lab/src/lab/meta.js";

const derived = Object.fromEntries(
  WORLDS.map((w) => [
    w.id,
    [...new Set(w.missions.flatMap((m) => m.domains || []))].filter((d) => DOMAINS.includes(d)),
  ]),
);
assert.deepEqual(
  { ...WORLD_DOMAINS },
  derived,
  `worlds/domains.js is stale; replace its table with:\n${JSON.stringify(derived, null, 2)}`,
);

for (const w of WORLDS) {
  const m = gameMeta(`world:${w.id}`);
  assert.equal(m.skill, "Integrated");
  assert.deepEqual(m.domains, derived[w.id].length ? derived[w.id] : [...DOMAINS]);
  assert.equal(m.primaryDomain, derived[w.id][0] || "Reading");
}
assert.equal(gameMeta("world:no-such-world"), null);
assert.equal(
  gameMeta("world:evidence-city").primaryDomain,
  "Reading",
  "Language Worlds still resolve first",
);

const meta = readFileSync(
  new URL("../access-practice-lab/src/lab/meta.js", import.meta.url),
  "utf8",
);
assert.ok(!/adventures\/worlds\/index\.js/.test(meta), "lab/meta.js imports the worlds again");
const shell = readFileSync(new URL("../access-practice-lab/index.html", import.meta.url), "utf8");
assert.ok(
  !/rel="modulepreload"[^>]*adventures\/worlds\/(?!domains\.js)/.test(shell),
  "the shell preloads Adventure World files: something on the entry chain imports them",
);
console.log(`access-world-domains: ${WORLDS.length} worlds match, worlds off the entry chain`);
