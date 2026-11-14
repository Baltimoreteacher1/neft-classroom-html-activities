import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "./[[path]].js";

const request = (path, method = "GET") =>
  new Request(`https://eduwonderlab.com${path}`, { method });

test("history routes serve the Fluency Lab app entry", async () => {
  for (const path of [
    "/math/fluency-lab/today",
    "/math/fluency-lab/skills/",
    "/math/fluency-lab/progress",
    "/math/fluency-lab/grade-k/",
    "/math/fluency-lab/grade-8/ratio-and-proportion/",
  ]) {
    let fetched = null;
    let continued = false;
    const result = await onRequest({
      request: request(path),
      env: {
        ASSETS: {
          fetch: async (assetRequest) => {
            fetched = new URL(assetRequest.url).pathname;
            return new Response("Fluency Lab shell", { status: 200 });
          },
        },
      },
      next: async () => {
        continued = true;
        return new Response("not found", { status: 404 });
      },
    });
    assert.equal(result.status, 200, path);
    assert.equal(fetched, "/math/fluency-lab/");
    assert.equal(continued, false);
  }
});

test("existing app files and unsupported grades pass through", async () => {
  for (const path of [
    "/math/fluency-lab/lab.html",
    "/math/fluency-lab/adults.html",
    "/math/fluency-lab/grade-9/",
  ]) {
    let continued = false;
    const result = await onRequest({
      request: request(path),
      env: { ASSETS: { fetch: async () => assert.fail("should not fetch the shell") } },
      next: async () => {
        continued = true;
        return new Response("static file or 404", { status: 404 });
      },
    });
    assert.equal(result.status, 404, path);
    assert.equal(continued, true);
  }
});

test("non-GET/HEAD methods pass through without rewriting", async () => {
  let continued = false;
  const result = await onRequest({
    request: request("/math/fluency-lab/today", "POST"),
    env: { ASSETS: { fetch: async () => assert.fail("POST should not be replayed") } },
    next: async () => {
      continued = true;
      return new Response("method rejected", { status: 405 });
    },
  });
  assert.equal(result.status, 405);
  assert.equal(continued, true);
});
