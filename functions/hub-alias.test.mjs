/* Pins the Neft Hub short links: /hub, /neft-hub, /home and /start.
 *
 * All four were 301s to `/`. That reads correctly against this repo — index.html
 * IS the hub — and is wrong against production, where the apex root is answered
 * by a Cloudflare Worker in the eduwonderlab-home repo. All four delivered the
 * personal portal instead of the classroom front door.
 *
 * They are now per-route Pages Functions sharing _lib/serve-hub.js. These tests
 * pin the four properties that make that safe:
 *
 *   1. an alias serves the hub's CONTENT, at the alias URL, with a 200
 *   2. it degrades to the old 301 rather than surfacing a new failure
 *   3. a POST is never answered with a GET body
 *   4. the site-wide auth middleware is not involved at all
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import test from "node:test";

import { serveHub } from "./_lib/serve-hub.js";

const HUB_HTML = "<!doctype html><html><body>Neft Hub</body></html>";

// A `next` that serves the root asset and 404s everything else, recording which
// paths it was asked for so a test can assert what the function requested.
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

const call = (path, next, { method = "GET" } = {}) =>
  serveHub({ request: new Request(`https://eduwonderlab.com${path}`, { method }), next });

const ALIASES = ["/hub", "/neft-hub", "/home", "/start"];

for (const alias of ALIASES) {
  test(`${alias} serves the hub itself, not a redirect to the apex`, async () => {
    const asked = [];
    const res = await call(alias, nextServingRoot(asked));

    assert.equal(res.status, 200, `${alias} must not redirect — a 301 to / lands on the worker`);
    assert.equal(await res.text(), HUB_HTML, `${alias} must return the hub's markup`);
    assert.deepEqual(asked, ["/"], "the function must fetch the ROOT asset");
    assert.match(
      res.headers.get("Link") || "",
      /rel="canonical"/,
      "the alias and / are one document; say which is canonical",
    );
  });

  test(`${alias} has a route file wired to the shared implementation`, () => {
    // A function nobody routes to protects nobody. Pages maps functions/<name>.js
    // to /<name>, so the file must exist AND re-export the shared handler.
    const src = readFileSync(new URL(`.${alias}.js`, import.meta.url), "utf8");
    assert.match(src, /export \{ onRequest \} from "\.\/_lib\/serve-hub\.js"/);
  });
}

test("a POST is answered with the old redirect, never with the hub's body", async () => {
  const asked = [];
  const res = await call("/hub", nextServingRoot(asked), { method: "POST" });
  assert.equal(res.status, 301);
  assert.deepEqual(asked, [], "a POST must not be answered with the root asset");
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

test("the query string is not carried onto the root asset request", async () => {
  // The hub reads no query of its own; forwarding one would only create a
  // second cache key for the same document.
  const asked = [];
  await call("/hub?utm_source=x", nextServingRoot(asked));
  assert.deepEqual(asked, ["/"]);
});

test("the site-wide auth middleware is untouched by this feature", async () => {
  // This is the whole reason the aliases are per-route functions rather than a
  // branch in _middleware.js: that file is the teacher password gate, pinned by
  // content in validate:auth-contract so an auth boundary cannot move as a side
  // effect. Nothing here may reach into it.
  const middleware = readFileSync(new URL("./_middleware.js", import.meta.url), "utf8");
  assert.ok(
    !/serve-hub|HUB_ALIASES/.test(middleware),
    "hub-alias handling must stay out of the auth middleware",
  );
  const impl = readFileSync(new URL("./_lib/serve-hub.js", import.meta.url), "utf8");
  assert.ok(
    !/_middleware/.test(impl.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")),
    "the hub handler must not import or reference the auth middleware in code",
  );
});

test("the four aliases are still declared in routes.json", () => {
  // The 301s are kept as the bypass fallback. If someone deletes them believing
  // the functions made them redundant, the fallback goes with them — and the
  // registry stops listing four live short links.
  const routes = JSON.parse(readFileSync(new URL("../data/routes.json", import.meta.url), "utf8"));
  for (const source of ALIASES) {
    const rule = routes.redirects.find((r) => r.source === source);
    assert.ok(rule, `${source} must stay in the route registry`);
    assert.match(rule.note || "", /serve-hub/, `${source} must say where it is really served`);
  }
});
