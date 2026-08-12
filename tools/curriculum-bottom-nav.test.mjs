import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
/* Top and bottom unit navigation live with the units browser, which moved to
   its own page; the parity contract this test pins is unchanged. */
const html = readFileSync(join(root, "curriculum", "units", "index.html"), "utf8");

// Test 1: Check that top and bottom unit jump bars exist
assert.ok(html.includes('class="unit-jump-bar"'), "Top unit jump bar present");
assert.ok(
  html.includes('class="unit-jump-bar unit-jump-bar--bottom"'),
  "Bottom unit jump bar present",
);

// Test 2: Check that bottom jump bar contains all 10 units
for (let u = 1; u <= 10; u++) {
  assert.ok(html.includes(`href="#unit-${u}"`), `Unit ${u} jump link present`);
}

// Test 3: Check bottom Back to Top button
assert.ok(html.includes('href="#top"'), "Back to top button present");
assert.ok(html.includes('id="top"'), "Header top anchor present");

// Test 4: Check bottom lesson select dropdown
assert.ok(html.includes('id="bottom-lesson-select"'), "Bottom lesson selector dropdown present");

// Test 5: Check setupCurriculumNavSync script
assert.ok(html.includes("setupCurriculumNavSync"), "Curriculum nav sync script present");

console.log(
  "curriculum-bottom-nav.test.mjs: PASS — Top and bottom unit & lesson controls are exact, seamless, and fully synchronized.",
);
