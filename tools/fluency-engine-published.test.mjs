// The Fluency Lab is a plain copied static page, and engine/ is never copied to the site. Any
// ../../engine/... import in its modules must be published by a Rollup entry in vite.config.js
// at that same path, or the whole app fails to load in production (a 404 on the import).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";

const lab = new URL("../math/fluency-lab/", import.meta.url);
const config = readFileSync(new URL("../vite.config.js", import.meta.url), "utf8");
const imports = new Set();
for (const file of readdirSync(lab).filter((name) => name.endsWith(".js"))) {
  const source = readFileSync(new URL(file, lab), "utf8");
  for (const match of source.matchAll(/from\s+["']\.\.\/\.\.\/(engine\/[^"']+)["']/g))
    imports.add(match[1]);
}
assert.ok(imports.size > 0, "expected the Fluency Lab to import at least one engine module");
for (const path of imports) {
  assert.ok(
    config.includes(`"${path}"`),
    `vite.config.js must publish ${path} (engine/ is not copied to the site)`,
  );
}
console.log(`Fluency Lab engine imports published: ${[...imports].join(", ")}`);
