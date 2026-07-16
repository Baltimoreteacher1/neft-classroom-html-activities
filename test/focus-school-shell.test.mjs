import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("focus-school/index.html", "utf8");
const css = readFileSync("focus-school/styles.css", "utf8");
const app = readFileSync("focus-school/app.js", "utf8");
const sw = readFileSync("focus-school/sw.js", "utf8");

assert.match(html, /class="boot-shell"/);
assert.match(html, /Preparing your day/);
assert.match(html, /aria-busy="true"/);
assert.match(css, /\.boot-shell/);
assert.match(css, /prefers-reduced-motion[\s\S]*boot-shimmer/);
assert.match(app, /removeAttribute\("aria-busy"\)/);
assert.match(app, /focusedFirstRunOrder/);
assert.match(css, /#connChip[\s\S]*min-height:\s*44px/);
assert.match(css, /\.cal-day[\s\S]*min-height:\s*44px/);
assert.match(sw, /focus-school-v54/);

console.log("focus-school-shell: calm launch contracts passed");
