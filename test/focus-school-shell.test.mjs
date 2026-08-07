import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("focus-school/index.html", "utf8");
const css = readFileSync("focus-school/styles.css", "utf8");
const app = readFileSync("focus-school/app.js", "utf8");
const sw = readFileSync("focus-school/sw.js", "utf8");

assert.match(html, /class="boot-shell"/);
assert.match(html, /Preparing your day/);
assert.match(html, /aria-busy="true"/);
assert.match(html, /href="styles\.css\?v=\d+"/);
assert.match(html, /src="app\.js\?v=\d+"/);
assert.match(html, /src="sports\.js\?v=\d+"/);
assert.match(html, /src="needoh-studio\.js\?v=\d+"/);
assert.match(css, /\.boot-shell/);
assert.match(css, /prefers-reduced-motion[\s\S]*boot-shimmer/);
assert.match(app, /removeAttribute\("aria-busy"\)/);
assert.match(app, /focusedFirstRunOrder/);
assert.match(css, /#connChip[\s\S]*min-height:\s*44px/);
assert.match(css, /\.cal-day[\s\S]*min-height:\s*44px/);
assert.match(sw, /focus-school-v\d+/);

// Pinning literal version numbers here only ever produced a red test on a
// legitimate bump. The invariant that actually matters is that the service
// worker precaches the SAME query-versioned URLs the page requests: a drifted
// `?v=` is silently never precached (cache.add on a URL nothing asks for), so
// installed PWAs keep serving the old bundle offline.
const referenced = [...html.matchAll(/(?:src|href)="((?!\/|https?:)[\w./-]+\?v=\d+)"/g)].map(
  (m) => m[1],
);
assert.ok(referenced.length >= 4, `expected versioned local assets in index.html, saw ${referenced.length}`);
for (const url of referenced) {
  assert.ok(sw.includes(`"${url}"`), `sw.js CORE is missing ${url} — it will never be precached`);
}

console.log("focus-school-shell: calm launch contracts passed");
