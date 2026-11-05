/* The hub pages must actually receive the dimensional design tokens.
 *
 * tools/bundle-hub-styles.mjs concatenates a page's stylesheets at build time. It used to
 * inline only the FIRST leading @import, which left assets/dimension.css and
 * assets/dimension-stage.css as @import rules in the middle of the bundle. Browsers ignore
 * an @import that follows any other rule, so every var(--dm-*) on the hub was undefined and
 * dark-on-light text fell back to the inherited near-white. Source checks and the dev server
 * (which resolves imports itself) both passed. This reads what a visitor's browser receives.
 *
 * Needs `npm run build`; without dist/ it reports SKIP and exits 0 like the other dist readers. */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PAGES = ["curriculum/index.html", "curriculum/units/index.html"];

if (!existsSync(join(DIST, "curriculum/index.html"))) {
  console.log("SKIP hub-bundle-tokens: no dist/ (run npm run build)");
  process.exit(0);
}

/** The text of every local stylesheet a page links, in document order. */
function linkedSheets(page) {
  const html = readFileSync(join(DIST, page), "utf8");
  return [...html.matchAll(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="(\/assets\/[^"?]+\.css)/g)]
    .map(([, href]) => ({ href, path: join(DIST, href) }))
    .filter(({ path }) => existsSync(path))
    .map(({ href, path }) => ({ href, css: readFileSync(path, "utf8") }));
}

/** True when an @import appears after the first rule, which a browser drops. */
function hasLateImport(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const firstRule = stripped.search(/\{/);
  return firstRule !== -1 && stripped.slice(firstRule).includes("@import");
}

for (const page of PAGES) {
  const sheets = linkedSheets(page);
  assert.ok(sheets.length > 0, `${page}: no local stylesheets found in dist`);
  for (const { href, css } of sheets)
    assert.ok(!hasLateImport(css), `${page}: ${href} has an @import after its first rule (ignored by browsers)`);
  const all = sheets.map(({ css }) => css).join("\n");
  assert.match(all, /--dm-night\s*:/, `${page}: the --dm-* design tokens are not in any stylesheet the page loads`);
  assert.match(all, /--dm-art-practice\s*:/, `${page}: the page-stage artwork is not in any stylesheet the page loads`);
}

assert.ok(hasLateImport('a{color:red}@import url("/x.css");'), "detector: a late @import is caught");
assert.ok(!hasLateImport('@import url("/x.css");a{color:red}'), "detector: a leading @import is allowed");
console.log(`hub-bundle-tokens: ${PAGES.length} hub pages receive the design tokens`);
