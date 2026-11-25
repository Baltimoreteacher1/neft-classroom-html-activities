#!/usr/bin/env node
/** synthetic-check against a LOCAL fake server only. Includes negative controls (each broken server must fail). */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { main, parseArgs, runChecks } from "./synthetic-check.mjs";

function serve(overrides = {}) {
  const good = {
    "/api/health": () => ({
      status: 200,
      headers: { "Cache-Control": "no-store" },
      body: { ok: true, build: { commit: "abcdef123456" }, d1: "ok" },
    }),
    "/api/bcpss/units": () => ({ status: 200, body: { units: [{ id: "g6-math-u1" }] } }),
    "/api/bcpss/units/g6-math-u1": () => ({ status: 200, body: { unit: { id: "g6-math-u1" } } }),
  };
  const routes = { ...good, ...overrides };
  const server = createServer((req, res) => {
    const handler = routes[new URL(req.url, "http://x").pathname];
    if (!handler) return void res.writeHead(404).end("{}");
    const r = handler();
    if (r.hang) return; // never answer
    res.writeHead(r.status, { "Content-Type": "application/json", ...(r.headers || {}) });
    res.end(typeof r.body === "string" ? r.body : JSON.stringify(r.body));
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => server.closeAllConnections() || server.close(),
      }),
    ),
  );
}

const quiet = { out: () => {}, err: () => {} };
const run = async (overrides, args = []) => {
  const s = await serve(overrides);
  try {
    return await main([s.url, "--timeout-ms=400", ...args], quiet);
  } finally {
    s.close();
  }
};

let passed = 0;
const check = async (name, fn) => {
  await fn();
  passed++;
  console.log(`   ✓ ${name}`);
};
console.log("tools/synthetic-check.mjs");

await check("healthy local server: exit 0", async () => assert.equal(await run({}), 0));

await check("negative controls: each broken dependency exits 1", async () => {
  const broken = {
    "health ok=false": {
      "/api/health": () => ({
        status: 200,
        headers: { "Cache-Control": "no-store" },
        body: { ok: false, build: { commit: "a" } },
      }),
    },
    "health 503": { "/api/health": () => ({ status: 503, body: { ok: false } }) },
    "health cacheable": {
      "/api/health": () => ({
        status: 200,
        headers: { "Cache-Control": "public, max-age=60" },
        body: { ok: true, build: { commit: "a" } },
      }),
    },
    "health not json": {
      "/api/health": () => ({
        status: 200,
        headers: { "Cache-Control": "no-store" },
        body: "<html>",
      }),
    },
    "units empty": { "/api/bcpss/units": () => ({ status: 200, body: { units: [] } }) },
    "unit 404": { "/api/bcpss/units/g6-math-u1": () => ({ status: 404, body: {} }) },
    "unit mismatch": {
      "/api/bcpss/units/g6-math-u1": () => ({ status: 200, body: { unit: { id: "other" } } }),
    },
    "health hangs (timeout)": { "/api/health": () => ({ hang: true }) },
  };
  for (const [label, overrides] of Object.entries(broken)) {
    assert.equal(await run(overrides), 1, `${label} must fail`);
  }
});

await check("runChecks reports each check with timing and a timeout detail", async () => {
  const s = await serve({ "/api/bcpss/units": () => ({ hang: true }) });
  try {
    const results = await runChecks(s.url, { timeoutMs: 300 });
    assert.deepEqual(
      results.map((r) => r.name),
      ["health", "units list", "unit detail"],
    );
    assert.match(results[1].detail, /timed out/);
    assert.equal(results[2].ok, false, "unit detail cannot pass without a unit id");
  } finally {
    s.close();
  }
});

await check("exit 3 for usage errors and production targets", async () => {
  assert.equal(await main([], quiet), 3);
  assert.equal(await main(["not a url"], quiet), 3);
  assert.equal(await main(["https://eduwonderlab.com"], quiet), 3, "production refused");
  assert.equal(await main(["https://www.thelanguagepage.com/"], quiet), 3);
  assert.equal(
    await main(["http://127.0.0.1:1", "--timeout-ms=5"], quiet),
    3,
    "timeout below the floor",
  );
  assert.deepEqual(parseArgs(["http://x", "--allow-production", "--timeout-ms=900"]), {
    baseUrl: "http://x",
    timeoutMs: 900,
    allowProduction: true,
  });
});

await check(
  "unreachable server: exit 1 (a down target is a failed check, not a usage error)",
  async () => {
    assert.equal(await main(["http://127.0.0.1:1", "--timeout-ms=300"], quiet), 1);
  },
);

console.log(`\n✓ synthetic-check: ${passed} checks`);
