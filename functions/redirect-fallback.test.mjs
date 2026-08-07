/* Pins the _redirects 404-fallback in functions/_middleware.js.
 *
 * Cloudflare honours only the first 100 rules of `_redirects` on this project —
 * measured live: positions 90/95/100 return 301, 101/102/105/110/150/200 return
 * 404. That silently killed 231 short links. The middleware replays the full
 * rule set as a fallback, and these tests pin the two properties that make it
 * safe to do so:
 *
 *   1. it fires ONLY on a 404, so nothing that already resolves can be shadowed
 *   2. the generated map stays in sync with data/routes.json
 */
import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

import { EXACT, PREFIX } from "./_lib/redirect-map.js";
import { onRequest } from "./_middleware.js";

const routes = JSON.parse(readFileSync(new URL("../data/routes.json", import.meta.url), "utf8"));

// A `next` that answers 404 for everything except the paths it is given.
const nextServing = (servable = []) => {
  return async () => {
    const hit = servable.shift();
    return hit ?? new Response("not found", { status: 404 });
  };
};

const call = async (path, { next, method = "GET", env = { SITE_PASSWORD: "pw" } } = {}) =>
  onRequest({
    request: new Request(`https://eduwonderlab.com${path}`, { method }),
    env,
    next: next ?? nextServing(),
    data: {},
  });

test("the map covers every non-splat redirect in routes.json", () => {
  const sources = (routes.redirects || []).filter((r) => !r.source.endsWith("/*"));
  assert.ok(sources.length > 200, `expected the full alias set, saw ${sources.length}`);
  for (const r of sources) {
    assert.ok(EXACT[r.source], `missing from redirect-map: ${r.source}`);
  }
});

test("the generated map is not stale", () => {
  // --check exits non-zero when data/routes.json has moved on without a
  // regenerate. A stale map is how the /plan-notes alias 404'd in production.
  execFileSync("node", ["tools/generate-route-files.mjs", "--check"], { stdio: "pipe" });
});

test("a rule past position 100 redirects — the class of link that was dead", async () => {
  const res = await call("/unit-5-practice");
  assert.equal(res.status, 301);
  assert.equal(
    new URL(res.headers.get("location")).pathname,
    "/math/unit-5/supplemental/practice-hub/",
  );
});

test("a path that already resolves is never shadowed", async () => {
  const served = new Response("<html>real page</html>", { status: 200 });
  const res = await call("/unit-5-practice", { next: nextServing([served]) });
  assert.equal(res.status, 200, "a 200 must pass through untouched");
});

test("a 404 with no matching rule stays a 404", async () => {
  const res = await call("/no-such-thing-anywhere");
  assert.equal(res.status, 404);
});

test("trailing slash and casing both resolve", async () => {
  for (const path of ["/unit-5-practice/", "/UNIT-5-PRACTICE"]) {
    const res = await call(path);
    assert.equal(res.status, 301, `${path} should redirect`);
  }
});

test("the query string is carried across", async () => {
  const res = await call("/unit-5-practice?period=3");
  assert.equal(new URL(res.headers.get("location")).search, "?period=3");
});

test("splat rules expand :splat, and pass through when the destination has none", async () => {
  const withSplat = PREFIX.find((p) => p[3]);
  assert.ok(withSplat, "expected at least one :splat rule");
  const res = await call(`${withSplat[0]}deep/page`);
  assert.equal(res.headers.get("location"), withSplat[1].replace(":splat", "deep/page"));

  const plain = PREFIX.find((p) => !p[3]);
  const res2 = await call(`${plain[0]}anything`);
  assert.equal(new URL(res2.headers.get("location")).pathname, plain[1]);
});

test("POST is never redirected — replaying it would drop the body", async () => {
  const res = await call("/unit-5-practice", { method: "POST" });
  assert.equal(res.status, 404);
});

test("an /api/ 404 is left alone", async () => {
  const res = await call("/api/plan-notes/nope");
  assert.equal(res.status, 404);
});

test("teacher gating still wins over the fallback", async () => {
  const res = await call("/curriculum/plan-notes/");
  assert.equal(res.status, 401, "a teacher surface must 401 before any redirect logic");
});
