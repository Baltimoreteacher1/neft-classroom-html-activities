// Regression guard: Cloudflare's Pages Functions bundler (pinned older wrangler/esbuild) cannot parse JSON import
// attributes (`import x from "./a.json" with { type: "json" }`), while Node ESM requires them. Code that
// functions/ imports (functions/ and shared/) therefore may not use them; make the data a JS module instead.
// This is what failed the Cloudflare build of 39ab247b90 and 07c72b6ab9 (shared/flags/flags.json).
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const STATIC_ATTR = /\bfrom\s+["'][^"']+["']\s*(?:with|assert)\s*\{/;
const DYNAMIC_ATTR = /\bimport\(\s*["'][^"']+["']\s*,\s*\{\s*(?:with|assert)\b/;
const SOURCE = /\.(?:m?js|cjs)$/;
const TEST_FILE = /\.test\.(?:m?js|cjs)$|[\\/](?:fixtures|negative)[\\/]/;

export function importAttributes(source) {
  return source.split("\n").flatMap((line, i) => {
    const code = line.replace(/\/\/.*$/, "");
    return STATIC_ATTR.test(code) || DYNAMIC_ATTR.test(code) ? [i + 1] : [];
  });
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (SOURCE.test(entry.name) && !TEST_FILE.test(relative(ROOT, full))) yield full;
  }
}

test("negative control: both import-attribute forms are detected, ordinary imports are not", () => {
  assert.deepEqual(importAttributes('import r from "./flags.json" with { type: "json" };'), [1]);
  assert.deepEqual(importAttributes('import r from "./flags.json" assert { type: "json" };'), [1]);
  assert.deepEqual(
    importAttributes('const m = await import("./a.json", { with: { type: "json" } });'),
    [1],
  );
  assert.deepEqual(
    importAttributes(
      'import r from "./registry.js";\n// import x from "a.json" with { type: "json" }',
    ),
    [],
  );
});

test("functions/ and shared/ use no JSON import attributes (the Pages Functions bundler rejects them)", () => {
  const offenders = [];
  let scanned = 0;
  for (const dir of ["functions", "shared"]) {
    for (const file of walk(join(ROOT, dir))) {
      scanned++;
      const lines = importAttributes(readFileSync(file, "utf8"));
      if (lines.length) offenders.push(`${relative(ROOT, file)}:${lines.join(",")}`);
    }
  }
  assert.ok(scanned > 100, `scanned only ${scanned} files; the sweep is broken`);
  assert.deepEqual(
    offenders,
    [],
    `import attributes break the Cloudflare Functions build: ${offenders.join(" ")}`,
  );
});
