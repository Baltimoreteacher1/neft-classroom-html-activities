#!/usr/bin/env node
/**
 * The curriculum hub must fetch each /data manifest ONCE per page load.
 *
 * Seven feature scripts on /curriculum/ each grew their own loadJson()/getJson(),
 * so /data/curriculum-manifest.json was requested 4× and
 * /data/curriculum-launch-manifest.json 3× on a single load. That is what took
 * the page to 62 requests against the 60-request budget in
 * scripts/perf-curriculum.mjs, and it is invisible in review: every one of those
 * seven files is individually correct.
 *
 * Nothing else can catch it. Each script parses, lints and type-checks on its
 * own; the duplication only exists in the sum. So this gate reads the sum.
 *
 * Three things are asserted:
 *   1. assets/curriculum-json-cache.js really memoizes — proven by running it
 *      against a counting fake fetch, not by reading it. A cache that stopped
 *      caching would otherwise pass every other check in the repo.
 *   2. Each manifest consumer routes through window.NTJsonCache.
 *   3. curriculum/index.html loads the cache BEFORE those consumers. All the
 *      tags are `defer`, so document order IS execution order; a tag moved
 *      below its consumers would silently restore the duplicate fetches.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE_ASSET = "curriculum-json-cache.js";

/** Consumers of a shared /data manifest, in the order the hub loads them. */
const CONSUMERS = [
  "curriculum-enhancements.js",
  "curriculum-ready-next.js",
  "curriculum-audit-badges.js",
  "curriculum-teacher-workflow.js",
  "curriculum-studio-journey.js",
  "curriculum-product-upgrades.js",
];

let failures = 0;
const fail = (m) => {
  failures++;
  console.error(`   ✗ ${m}`);
};

console.log("curriculum JSON cache");

/* -- 1. the module actually memoizes -------------------------------------- */
{
  const source = readFileSync(resolve(ROOT, "assets", CACHE_ASSET), "utf8");

  let calls = 0;
  const payload = '{"lessons":[{"id":"1-1"}]}';
  const sandbox = {
    window: /** @type {Record<string, any>} */ ({}),
    fetch(_url) {
      calls++;
      return Promise.resolve({
        ok: true,
        status: 200,
        text: () => Promise.resolve(payload),
      });
    },
  };
  // The asset is a classic IIFE reading globals, so hand it its own `window`
  // and `fetch` rather than mutating this process's.
  new Function("window", "fetch", source)(sandbox.window, sandbox.fetch);

  const api = sandbox.window.NTJsonCache;
  if (!api || typeof api.json !== "function") {
    fail(`assets/${CACHE_ASSET} did not install window.NTJsonCache.json()`);
  } else {
    const url = "/data/curriculum-manifest.json";
    const [a, b, c] = await Promise.all([api.json(url), api.json(url), api.json(url)]);

    if (calls !== 1) fail(`three json() calls for one URL made ${calls} fetches, expected 1`);
    if (a.lessons[0].id !== "1-1") fail("cached JSON did not parse to the response body");

    // Each caller must get its OWN object: seven feature scripts share these
    // manifests, and one mutating a shared parse would be a silent bug in the
    // other six.
    if (a === b || b === c) fail("json() handed the same parsed object to two callers");
    a.lessons[0].id = "mutated";
    if (b.lessons[0].id !== "1-1") fail("mutating one caller's copy changed another caller's");

    // A transient failure must not be cached forever.
    let failingCalls = 0;
    const w2 = /** @type {Record<string, any>} */ ({});
    new Function("window", "fetch", source)(w2, () => {
      failingCalls++;
      return failingCalls === 1
        ? Promise.reject(new Error("network"))
        : Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(payload) });
    });
    await w2.NTJsonCache.json("/data/x.json").catch(() => {});
    const retried = await w2.NTJsonCache.json("/data/x.json").catch(() => null);
    if (!retried) fail("a failed fetch was cached — later callers can never recover");
  }
}

/* -- 2. every consumer routes through the cache ---------------------------- */
for (const name of CONSUMERS) {
  const source = readFileSync(resolve(ROOT, "assets", name), "utf8");
  if (!/window\.NTJsonCache/.test(source)) {
    fail(
      `assets/${name} reads a shared /data manifest but never consults window.NTJsonCache — ` +
        `route it through the cache so the hub fetches the file once`,
    );
  }
}

/* -- 3. the hub loads the cache before its consumers ----------------------- */
{
  const hub = readFileSync(resolve(ROOT, "curriculum/index.html"), "utf8");
  const posOf = (name) => hub.indexOf(`/assets/${name}?v=`);
  const cacheAt = posOf(CACHE_ASSET);

  if (cacheAt === -1) {
    fail(`curriculum/index.html does not load /assets/${CACHE_ASSET}`);
  } else {
    for (const name of CONSUMERS) {
      const at = posOf(name);
      if (at === -1) {
        fail(`curriculum/index.html does not load /assets/${name}`);
      } else if (at < cacheAt) {
        fail(
          `/assets/${name} is loaded BEFORE /assets/${CACHE_ASSET}. These tags are defer, so ` +
            `document order is execution order — move the cache tag above it`,
        );
      }
    }
  }
}

if (failures) {
  console.error(`\n✗ curriculum JSON cache: ${failures} failure(s)`);
  process.exit(1);
}
console.log(
  `   ✓ cache memoizes per URL, hands each caller its own parse, and does not cache failures`,
);
console.log(`   ✓ ${CONSUMERS.length} manifest consumers routed through it, loaded after it`);
