#!/usr/bin/env node
// The lab's offline worker (access-practice-lab/sw.js) and its caching contract: what is served from where, what is
// never touched, that offline navigation lands on the shell, and that the precache list matches the shell's own
// hashed URLs. The worker is a classic script, so it is loaded in a vm sandbox with a small fake of the Cache API.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const lab = new URL("../access-practice-lab/", import.meta.url);
const swSource = readFileSync(new URL("sw.js", lab), "utf8");
const ORIGIN = "https://eduwonderlab.com";

class FakeCache {
  constructor() {
    this.map = new Map();
  }
  async put(key, response) {
    this.map.set(typeof key === "string" ? new URL(key, ORIGIN).href : key.url, response);
  }
  async match(key) {
    const hit = this.map.get(typeof key === "string" ? new URL(key, ORIGIN).href : key.url);
    return hit?.clone();
  }
}
function load({ online = true, responses = {} } = {}) {
  const stores = new Map();
  const fetched = [];
  const sandbox = {
    URL,
    Request,
    Response,
    Headers,
    Promise,
    setTimeout,
    module: { exports: {} },
    self: { location: { origin: ORIGIN } },
    caches: {
      open: async (name) =>
        stores.has(name) ? stores.get(name) : stores.set(name, new FakeCache()).get(name),
      match: async (key) => {
        for (const cache of stores.values()) {
          const hit = await cache.match(key);
          if (hit) return hit;
        }
      },
      keys: async () => [...stores.keys()],
      delete: async (name) => stores.delete(name),
    },
    fetch: async (request) => {
      const url = typeof request === "string" ? request : request.url;
      fetched.push(url);
      if (!online) throw new TypeError("offline");
      const spec = responses[new URL(url).pathname] ?? { body: "ok" };
      return new Response(spec.body, { status: spec.status ?? 200, headers: spec.headers ?? {} });
    },
  };
  vm.runInNewContext(swSource, sandbox);
  return { sw: sandbox.module.exports, stores, fetched, sandbox };
}
const req = (path, init = {}) => new Request(new URL(path, ORIGIN), init);
const nav = (path) => {
  const r = req(path);
  Object.defineProperty(r, "mode", { value: "navigate" });
  return r;
};
const kind = (sw, request) => sw.route(request, new URL(request.url), ORIGIN);

test("routing: what the worker serves, and what it never touches", () => {
  const { sw } = load();
  const S = "/access-practice-lab";
  assert.equal(kind(sw, nav(`${S}/`)), "shell");
  assert.equal(kind(sw, nav(`${S}/Speaking/B/some-activity`)), "shell");
  assert.equal(kind(sw, nav(`${S}/printables/packet.html`)), "network");
  assert.equal(kind(sw, nav("/lessons/1-1/")), "network");
  assert.equal(kind(sw, req(`${S}/src/main.js?v=abc123abc123`)), "immutable");
  assert.equal(kind(sw, req(`${S}/styles.css?v=abc123abc123`)), "immutable");
  assert.equal(kind(sw, req(`${S}/src/main.js`)), "fresh");
  assert.equal(kind(sw, req(`${S}/content/index.json`)), "fresh");
  assert.equal(kind(sw, req(`${S}/pictures/x.svg`)), "fresh");
  assert.equal(kind(sw, req("/assets/mobile-access.css")), "fresh");
  assert.equal(kind(sw, req("/assets/nt-chrome.js")), "network");
  assert.equal(
    kind(sw, req(`${S}/config.json?cb=1`)),
    "network",
    "the build stamp must never be served stale",
  );
  assert.equal(kind(sw, req(`${S}/sw.js`)), "network");
  assert.equal(kind(sw, req("/api/progress")), "network");
  assert.equal(kind(sw, req(`${S}/content/index.json`, { method: "POST" })), "network");
  assert.equal(
    kind(sw, req(`${S}/pictures/x.svg`, { headers: { range: "bytes=0-9" } })),
    "network",
  );
  assert.equal(kind(sw, req("https://example.com/access-practice-lab/src/main.js?v=1")), "network");
});

test("an HTML navigation is saved as the shell and served from it when the network is gone", async () => {
  const html = {
    body: "<!doctype html>shell",
    headers: { "content-type": "text/html; charset=utf-8" },
  };
  const first = load({ responses: { "/access-practice-lab/": html } });
  const online = await first.sw.shellResponse(nav("/access-practice-lab/"));
  assert.match(await online.text(), /shell/);
  await new Promise((r) => setImmediate(r));
  const offline = load({ online: false });
  for (const [name, cache] of first.stores)
    (await offline.caches?.open?.(name)) ?? offline.stores.set(name, cache);
  const reply = await offline.sw.shellResponse(nav("/access-practice-lab/Writing/A/some-id"));
  assert.match(await reply.text(), /shell/, "offline deep link falls back to the saved shell");
});

test("a first visit with no network fails honestly instead of inventing a page", async () => {
  const { sw } = load({ online: false });
  await assert.rejects(sw.shellResponse(nav("/access-practice-lab/")), /offline/);
});

test("versioned files are served from the saved copy without asking the network again", async () => {
  const { sw, fetched } = load({
    responses: { "/access-practice-lab/src/a.js": { body: "export {}" } },
  });
  const request = () => req("/access-practice-lab/src/a.js?v=0123456789ab");
  assert.equal(await (await sw.immutableResponse(request())).text(), "export {}");
  await new Promise((r) => setImmediate(r));
  const before = fetched.length;
  assert.equal(await (await sw.immutableResponse(request())).text(), "export {}");
  assert.equal(fetched.length, before, "second request must not reach the network");
});

test("fresh files prefer the network and fall back to the saved copy on failure or a server error", async () => {
  const url = "/access-practice-lab/content/index.json";
  const a = load({ responses: { [url]: { body: "v1" } } });
  assert.equal(await (await a.sw.freshResponse(req(url))).text(), "v1");
  await new Promise((r) => setImmediate(r));
  a.sandbox.fetch = async () => new Response("boom", { status: 503 });
  assert.equal(
    await (await a.sw.freshResponse(req(url))).text(),
    "v1",
    "a 503 must not replace a good copy",
  );
  a.sandbox.fetch = async () => {
    throw new TypeError("offline");
  };
  assert.equal(await (await a.sw.freshResponse(req(url))).text(), "v1");
});

test("old caches go, but the previous build stays for tabs opened before a deploy", async () => {
  const { sw, stores, sandbox } = load();
  for (const n of ["ewl-access-old1", "ewl-access-old2", "ewl-access-old3", "unrelated-cache"])
    await sandbox.caches.open(n);
  await sw.dropOldCaches();
  const names = [...stores.keys()];
  assert.ok(names.includes("unrelated-cache"), "caches that are not the lab's are never deleted");
  assert.ok(names.includes("ewl-access-old3"), "the newest previous build is kept");
  assert.ok(!names.includes("ewl-access-old1") && !names.includes("ewl-access-old2"));
});

const parseList = (text) => JSON.parse(text.replace(/,\s*\]/, "]"));

test("the precache list is exactly the shell's hashed stylesheets and modules, plus the content", () => {
  const index = readFileSync(new URL("index.html", lab), "utf8");
  const core = parseList(swSource.match(/const PRECACHE_CORE = (\[[\s\S]*?\]);/)[1]);
  const more = parseList(swSource.match(/const PRECACHE_MORE = (\[[\s\S]*?\]);/)[1]);
  const sheets = [
    ...index.matchAll(/href="(\/access-practice-lab\/[\w.-]+\.css\?v=[0-9a-f]{12})"/g),
  ].map((m) => m[1]);
  const map = JSON.parse(index.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  assert.deepEqual([...core].sort(), [...sheets, ...Object.values(map)].sort());
  assert.ok(more.includes("/access-practice-lab/content/index.json"));
  assert.ok(more.every((u) => /\.(json|svg)$/.test(u)));
  assert.match(swSource, /const BUILD_HASH = "[0-9a-f]{12}"/);
  assert.match(index, /<link rel="manifest" href="\/access-practice-lab\/manifest\.json"/);
});

test("the manifest is installable: scope, start URL, and real icon files", async () => {
  const { existsSync } = await import("node:fs");
  const m = JSON.parse(readFileSync(new URL("manifest.json", lab), "utf8"));
  assert.equal(m.scope, "/access-practice-lab/");
  assert.ok(m.start_url.startsWith(m.scope));
  assert.ok(
    m.icons.some((i) => i.sizes === "192x192") && m.icons.some((i) => i.sizes === "512x512"),
  );
  for (const icon of m.icons)
    assert.ok(existsSync(new URL(icon.src.replace("/access-practice-lab/", ""), lab)), icon.src);
});

test("the Pages Function marks only hashed .js/.css as immutable", async () => {
  const { onRequest } = await import("../functions/access-practice-lab/[[path]].js");
  const env = {
    ASSETS: {
      fetch: async () =>
        new Response("x", { headers: { "cache-control": "public, max-age=0, must-revalidate" } }),
    },
  };
  const call = async (path) =>
    (await onRequest({ request: new Request(`${ORIGIN}${path}`), env })).headers.get(
      "cache-control",
    );
  assert.match(await call("/access-practice-lab/src/main.js?v=0123456789ab"), /immutable/);
  assert.match(await call("/access-practice-lab/styles.css?v=0123456789ab"), /max-age=31536000/);
  assert.equal(
    await call("/access-practice-lab/src/main.js"),
    "public, max-age=0, must-revalidate",
  );
  assert.equal(
    await call("/access-practice-lab/content/index.json?v=1"),
    "public, max-age=0, must-revalidate",
  );
  assert.equal(
    await call("/access-practice-lab/Speaking/A/x"),
    "no-store",
    "the shell is never cached",
  );
  const missing = { ASSETS: { fetch: async () => new Response("no", { status: 404 }) } };
  const res = await onRequest({
    request: new Request(`${ORIGIN}/access-practice-lab/src/gone.js?v=1`),
    env: missing,
  });
  assert.notEqual(
    res.headers.get("cache-control"),
    "public, max-age=31536000, immutable",
    "a 404 is never cached for a year",
  );
});
