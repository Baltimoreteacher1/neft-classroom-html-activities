import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { chromium } from "playwright";

const root = resolve("focus-school");
const types = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  if (url.pathname === "/api/config" || url.pathname === "/api/state") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end("{}");
    return;
  }
  const relative = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const file = resolve(root, `.${relative}`);
  if (!file.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    response.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404).end();
  }
});

await new Promise((accept) => server.listen(0, "127.0.0.1", accept));
const address = server.address();
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.addInitScript(() => {
    window.__FOCUS_SCHOOL_TEST__ = {};
    localStorage.setItem(
      "focus-school:state",
      JSON.stringify({
        version: 11,
        points: 0,
        settings: { welcomeDismissed: true, sync: { enabled: false, code: "test" } },
        updatedAt: 1,
      }),
    );
  });
  await page.goto(`http://127.0.0.1:${address.port}/`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => typeof window.__FOCUS_SCHOOL_TEST__.mergePointSnapshots === "function",
  );

  const results = await page.evaluate(() => {
    const api = window.__FOCUS_SCHOOL_TEST__;
    const legacy = api.pointSnapshot({ points: 100 });
    const left = {
      points: 105,
      pointBase: 100,
      pointEvents: [{ id: "xp-a", amount: 5, ts: 1 }],
    };
    const right = {
      points: 107,
      pointBase: 100,
      pointEvents: [{ id: "xp-b", amount: 7, ts: 2 }],
    };
    const concurrent = api.mergePointSnapshots(left, right);
    const shared = api.normalize({ points: 100, settings: { sync: { enabled: false } } });
    const fullConcurrent = api.mergeStates({ ...shared, ...left }, { ...shared, ...right });
    const repeated = api.mergePointSnapshots(concurrent, right);
    const rollingUpgrade = api.mergePointSnapshots(left, { points: 103 });
    const legacyConflict = api.mergePointSnapshots({ points: 120 }, { points: 130 });

    api.setState(api.normalize({ points: 20, settings: { sync: { enabled: false } } }));
    api.addPoints(5);
    const awarded = api.getState();
    return {
      legacy,
      concurrent,
      fullConcurrent,
      repeated,
      rollingUpgrade,
      legacyConflict,
      awarded,
    };
  });

  assert.deepEqual(results.legacy, { pointBase: 100, pointEvents: [], points: 100 });
  assert.equal(results.concurrent.points, 112, "concurrent device awards must add together");
  assert.equal(results.concurrent.pointEvents.length, 2);
  assert.equal(
    results.fullConcurrent.points,
    112,
    "the production state merge must use the ledger",
  );
  assert.equal(results.repeated.points, 112, "repeated sync must not double-count events");
  assert.equal(results.repeated.pointEvents.length, 2);
  assert.equal(
    results.rollingUpgrade.points,
    108,
    "legacy and event-ledger awards must add together",
  );
  assert.equal(results.legacyConflict.points, 130, "legacy totals retain max-merge behavior");
  assert.equal(results.awarded.points, 25);
  assert.equal(results.awarded.pointBase, 20);
  assert.equal(results.awarded.pointEvents.length, 1, "new awards must create one sync event");
  assert.equal(results.awarded.pointEvents[0].amount, 5);
  console.log("Focus School point sync tests passed.");
} finally {
  await browser.close();
  await new Promise((accept) => server.close(accept));
}
