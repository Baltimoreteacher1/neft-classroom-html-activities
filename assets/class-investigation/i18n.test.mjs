/* Every word has an English and a Spanish sibling, and every key used exists. */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { KEYS, STRINGS, tr } from "./i18n.js";

const dir = fileURLToPath(new URL(".", import.meta.url));
const vars = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

test("every key has English and Spanish with the same placeholders", () => {
  assert.ok(KEYS.length > 150);
  for (const k of KEYS) {
    const { en, es } = STRINGS[k];
    assert.ok(en.trim() && es.trim(), k);
    assert.equal(vars(en), vars(es), `${k} placeholders differ`);
  }
});

test("Spanish is not English pasted over (outside symbols, units and cognate labels)", () => {
  const allowed = new Set(["u4_unit", "barCount", "tool_u3_name", "title"]);
  for (const k of KEYS) {
    const { en, es } = STRINGS[k];
    if (en.length > 8 && !allowed.has(k)) assert.notEqual(en, es, k);
  }
});

test("every i18n key the code uses exists (literal and computed)", () => {
  const files = readdirSync(dir).filter((f) => f.endsWith(".js") && !f.includes(".test.") && f !== "i18n.js");
  const used = new Set();
  for (const f of files) {
    const src = readFileSync(dir + f, "utf8");
    for (const m of src.matchAll(/\btr\(\s*"([A-Za-z0-9_]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/\bkey:\s*"([A-Za-z0-9_]+)"(?=[^}]*kind:)/g)) used.add(m[1]);
    for (const m of src.matchAll(/blockedReason[^"\n]*"([A-Za-z0-9_]+)"/g)) used.add(m[1]);
    for (const m of src.matchAll(/"((?:u\d|tool_u\d|hm|t)[A-Za-z0-9_]*)"/g)) if (KEYS.includes(m[1])) used.add(m[1]);
  }
  for (const id of ["u2", "u3", "u4", "u7", "u9"]) used.add(`tool_${id}_desc`);
  for (const k of ["median", "mean", "range", "iqr"]) used.add(`u2_${k}`).add(`u2_${k}_label`);
  for (const k of ["balanced", "low", "high"]) used.add(`u2_${k}`);
  for (const k of used) assert.ok(KEYS.includes(k), `missing i18n key: ${k}`);
});

test("tr substitutes placeholders and falls back to English, then to the key", () => {
  assert.equal(tr("inClass", "es", { code: "ABC-DEF" }), "Estás en la clase ABC-DEF.");
  assert.equal(tr("inClass", "fr", { code: "X" }), "You are in class X.");
  assert.equal(tr("nope", "en"), "nope");
});
