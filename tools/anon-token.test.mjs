// The anonymous rate-limit token (shared/anon-token/anon-token.js) and the BCPSS write calls that send it.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ANON_TOKEN_RE } from "../functions/_lib/security/schema.js";

const ROOT = join(fileURLToPath(import.meta.url), "../..");
const MODULE = pathToFileURL(join(ROOT, "shared/anon-token/anon-token.js")).href;
let load = 0;
// A fresh module instance per test: the module keeps a memory token.
const fresh = () => import(`${MODULE}?n=${++load}`);

function withStorage(impl, fn) {
  const prev = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { value: impl, configurable: true });
  return Promise.resolve(fn()).finally(() => {
    if (prev) Object.defineProperty(globalThis, "localStorage", prev);
    else delete globalThis.localStorage;
  });
}

const memoryStorage = () => {
  const map = new Map();
  return {
    map,
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
};

test("token is 16 random bytes as hex, created once, stored under ewl_anon_token", async () => {
  const storage = memoryStorage();
  await withStorage(storage, async () => {
    const { anonToken, ANON_TOKEN_KEY } = await fresh();
    assert.equal(ANON_TOKEN_KEY, "ewl_anon_token");
    const token = anonToken();
    assert.match(token, /^[a-f0-9]{32}$/);
    assert.match(token, ANON_TOKEN_RE, "the server accepts it");
    assert.equal(anonToken(), token);
    assert.equal(storage.map.get("ewl_anon_token"), token);
    const again = await fresh();
    assert.equal(again.anonToken(), token, "a later page load reads the stored token");
  });
});

test("two browsers get different tokens", async () => {
  const seen = new Set();
  for (let i = 0; i < 20; i++)
    await withStorage(memoryStorage(), async () => seen.add((await fresh()).anonToken()));
  assert.equal(seen.size, 20);
});

test("blocked storage falls back to one in-memory token", async () => {
  const blocked = {
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  };
  await withStorage(blocked, async () => {
    const { anonToken } = await fresh();
    const token = anonToken();
    assert.match(token, ANON_TOKEN_RE);
    assert.equal(anonToken(), token);
  });
});

test("a malformed stored value is replaced, never sent", async () => {
  const storage = memoryStorage();
  storage.map.set("ewl_anon_token", "Maria Lopez");
  await withStorage(storage, async () => {
    const token = (await fresh()).anonToken();
    assert.match(token, /^[a-f0-9]{32}$/);
    assert.equal(storage.map.get("ewl_anon_token"), token);
  });
});

test("anonTokenHeaders names the header the server reads", async () => {
  await withStorage(memoryStorage(), async () => {
    const { anonTokenHeaders } = await fresh();
    const headers = anonTokenHeaders();
    assert.deepEqual(Object.keys(headers), ["X-Anon-Token"]);
    assert.match(headers["X-Anon-Token"], ANON_TOKEN_RE);
  });
});

// A POST made through the review views' api() wrapper is not a fetch: the wrapper (views/review/api.js) is the
// request, and a separate test asserts it sends the token on every call.
const isDirectPost = (line) => /method:\s*["']POST["']/.test(line) && !/\bapi\(/.test(line);

/** Every direct `method: "POST"` option in source whose headers do not carry anonTokenHeaders() within 3 lines. */
export function postsWithoutToken(source) {
  const lines = source.split("\n");
  const missing = [];
  lines.forEach((line, i) => {
    if (!isDirectPost(line)) return;
    if (!lines.slice(i, i + 4).some((l) => l.includes("anonTokenHeaders()"))) missing.push(i + 1);
  });
  return missing;
}

function sources(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sources(p);
    return /\.m?js$/.test(e.name) ? [p] : [];
  });
}

test("negative control: a POST without the token is flagged, one with it passes", () => {
  const bad =
    'fetch(u, {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n});';
  const good = 'fetch(u, {\n  method: "POST",\n  headers: { ...anonTokenHeaders() },\n});';
  assert.deepEqual(postsWithoutToken(bad), [2]);
  assert.deepEqual(postsWithoutToken(good), []);
});

test("every BCPSS front-end POST (telemetry, plans, deconstruct, export) sends the token", () => {
  const files = sources(join(ROOT, "bcpss-teachers"));
  assert.ok(files.length > 10);
  let posts = 0;
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    posts += text.split("\n").filter(isDirectPost).length;
    assert.deepEqual(postsWithoutToken(text), [], `${file} has a POST without X-Anon-Token`);
  }
  assert.equal(posts, 4, "telemetry, plans, deconstruct and export are the BCPSS write calls");
});

test("the review views' api() wrapper sends the token on every request, so their POSTs carry it", () => {
  const wrapper = readFileSync(join(ROOT, "bcpss-teachers/studio/views/review/api.js"), "utf8");
  assert.match(wrapper, /import \{ anonTokenHeaders \}/);
  const fetchCall = wrapper.slice(wrapper.indexOf("await fetch(path, {"));
  assert.ok(
    fetchCall.slice(0, 400).includes("...anonTokenHeaders()"),
    "api() fetch must spread anonTokenHeaders()",
  );
  const wrapped = readFileSync(join(ROOT, "bcpss-teachers/studio/views/review/detail.js"), "utf8");
  assert.ok(/\bapi\(.*method:\s*["']POST["']/.test(wrapped), "detail.js posts through api()");
});
