// Every Language Page stylesheet closes every block. A lost "}" (a merge that drops a rule's last lines) makes the
// browser swallow every rule after it, silently: on 2026-11-17 two lost braces in activity.css disabled the
// activity page's newest styles in production while every other gate stayed green.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);

test("every access-practice-lab stylesheet has balanced braces", () => {
  const bad = [];
  const sheets = readdirSync(LAB).filter((f) => f.endsWith(".css"));
  for (const f of sheets) {
    const css = readFileSync(new URL(f, LAB), "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');
    let depth = 0;
    for (const ch of css) {
      if (ch === "{") depth++;
      else if (ch === "}" && --depth < 0) break;
    }
    if (depth !== 0) bad.push(`${f}: depth ${depth}`);
  }
  assert.ok(sheets.length > 20, `checked ${sheets.length} sheets`);
  assert.deepEqual(bad, []);
});
