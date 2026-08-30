/* Pins the Neft Hub short links in functions/_middleware.js.
 *
 * /hub, /neft-hub, /home and /start were 301s to `/`. That reads correctly
 * against this repo — index.html IS the hub — and is wrong against production,
 * where the apex root is answered by a Cloudflare Worker in the
 * eduwonderlab-home repo. All four delivered the personal portal instead of the
 * classroom front door.
 *
 * The middleware now answers them with the root asset. These tests pin the
 * three properties that make that safe:
 *
 *   1. an alias serves the hub's CONTENT, at the alias URL, with a 200
 *   2. nothing else changes — non-alias paths take exactly the path they did
 *   3. it degrades to the old 301 rather than surfacing a new failure
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { onRequest } from "./_middleware.js";

const HUB_HTML = "<!doctype html><html><body>Neft Hub</body></html>";

// A `next` that serves the root asset and 404s everything else, recording the
// paths it was asked for so a test can assert what the middleware requested.
const nextServingRoot = (asked, { status = 200 } = {}) => {
  return async (req) => {
    const path = req ? new URL(req.url).pathname : "(no-arg)";
    asked.push(path);
    if (path === "/") {
      return new Response(HUB_HTML, {
        status,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    return new Response("not found", { status: 404 });
  };
};

const call = (path, next, { method = "GET", env = {} } = {}) =>
  onRequest({
    request: new Request(`https://eduwonderlab.com${path}`, { method }),
    env,
    next,
    data: {},
  });

const ALIASES = ["/hub", "/hub/", "/neft-hub", "/neft-hub/", "/home", "/home/", "/start", "/start/"];

for (const alias of ALIASES) {
  test(`${alias} serves the hub itself, not a redirect to the apex`, async () => {
    const asked = [];
    const res = await call(alias, nextServingRoot(asked));

    assert.equal(res.status, 200, `${alias} must not redirect — a 301 to / lands on the worker`);
    assert.equal(await res.text(), HUB_HTML, `${alias} must return the hub's markup`);
    assert.deepEqual(asked, ["/"], "the middleware must fetch the ROOT asset");
    assert.match(
      res.headers.get("Link") || "",
      /rel="canonical"/,
      "the alias and / are one document; say which is canonical",
    );
  });
}

test("aliases are matched case-insensitively, like every other short link", async () => {
  // redirectFor() lowercases as a last resort because typed URLs are often
  // mis-cased. A student typing /Hub deserves the same answer.
  const res = await call("/HUB", nextServingRoot([]));
  assert.equal(res.status, 200);
});

test("a POST is left entirely alone", async () => {
  // Serving a GET body in answer to a POST would silently discard the request.
  const asked = [];
  const res = await call("/hub", nextServingRoot(asked), { method: "POST" });
  assert.notEqual(res.status, 200);
  assert.ok(!asked.includes("/"), "a POST must not be answered with the root asset");
});

test("degrades to the old 301 when the root asset does not come back 200", async () => {
  // Safety valve: a short link on the wrong page is a papercut, one that 500s
  // in front of a class is not.
  const res = await call("/hub", nextServingRoot([], { status: 503 }));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("Location"), "https://eduwonderlab.com/");
});

test("degrades to the old 301 when fetching the root asset throws", async () => {
  const res = await call("/hub", async () => {
    throw new Error("asset pipeline unavailable");
  });
  assert.equal(res.status, 301);
});

test("a non-alias path is untouched", async () => {
  // The blast radius of this middleware is the whole site, so prove the new
  // branch cannot capture anything it was not aimed at.
  const asked = [];
  const res = await call("/curriculum/", nextServingRoot(asked));
  assert.equal(res.status, 404, "an unrelated path keeps whatever next() gave it");
  assert.ok(!asked.includes("/"), "an unrelated path must never be served the root asset");
});

test("a path merely starting with an alias is not captured", async () => {
  // /homework must not be swallowed by /home.
  const asked = [];
  await call("/homework/", nextServingRoot(asked));
  assert.ok(!asked.includes("/"), "/homework must not be treated as /home");
});

test("the four aliases are still declared in routes.json", async () => {
  // The 301s are kept as a bypass fallback. If someone deletes them believing
  // the middleware made them redundant, the fallback goes with them — and the
  // registry stops listing four live short links.
  const routes = JSON.parse(readFileSync(new URL("../data/routes.json", import.meta.url), "utf8"));
  for (const source of ["/hub", "/neft-hub", "/home", "/start"]) {
    const rule = routes.redirects.find((r) => r.source === source);
    assert.ok(rule, `${source} must stay in the route registry`);
    assert.match(rule.note || "", /_middleware/, `${source} must say where it is really served`);
  }
});
