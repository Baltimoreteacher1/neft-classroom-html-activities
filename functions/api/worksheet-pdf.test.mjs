#!/usr/bin/env node
/**
 * Contract tests for /api/worksheet-pdf — the server-side PDF render behind the
 * downloader's "One PDF" format.
 *
 * The endpoint hands untrusted input to a real browser on a metered account, so
 * the guards are the whole point and they are pinned here against a stub
 * binding. Verified against the live binding through `wrangler pages dev`
 * (which needs `remote = true` on the browser binding for the session — Quick
 * Actions have no local implementation), but that cannot run in the gate.
 *
 * What a regression here would actually cost:
 *
 *   - an arbitrary `html` or URL reaching the renderer would make this a public
 *     PDF service running on this account's Browser Run quota,
 *   - `*-answer-key.html` slipping through the allow-list would print the
 *     teacher answer keys that the middleware gates everywhere else,
 *   - a missing BROWSER binding throwing instead of answering 503 would break
 *     the downloader rather than falling back to the in-browser print view.
 */
import assert from "node:assert/strict";
import { onRequest } from "./worksheet-pdf.js";

let failures = 0;
async function test(name, fn) {
  try {
    await fn();
    console.log(`   ✓ ${name}`);
  } catch (error) {
    failures++;
    console.error(`   ✗ ${name}\n     ${error.message}`);
  }
}

const WORKSHEET_HTML = `<!DOCTYPE html><html><head><title>3.1 — Worksheet</title>
<style>:root{--navy:#1f3864}.ws-page{padding:.55in}</style></head>
<body><main><section class="ws-page">Question 1</section>
<script>boom()</script></main></body></html>`;

/** Records what the renderer was asked to do, and returns a PDF-shaped body. */
function stubBrowser() {
  const calls = [];
  return {
    calls,
    async quickAction(action, options) {
      calls.push({ action, options });
      return new TextEncoder().encode("%PDF-1.4 stub").buffer;
    },
  };
}

// The endpoint rate-limits per client IP (10/min), which one test run would
// otherwise trip on itself — so each request comes from its own address. That
// the limiter keys on the IP at all is pinned by the last test here.
let caller = 0;
function post(body, { env = { BROWSER: stubBrowser() }, fetched = {}, ip } = {}) {
  const seen = [];
  globalThis.fetch = async (url) => {
    seen.push(String(url));
    const status = fetched.status ?? 200;
    return { ok: status < 400, status, text: async () => fetched.html ?? WORKSHEET_HTML };
  };
  const request = new Request("https://eduwonderlab.com/api/worksheet-pdf", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "CF-Connecting-IP": ip || `10.0.0.${++caller % 250}`,
    },
    body: JSON.stringify(body),
  });
  return onRequest({ request, env }).then((response) => ({ response, env, seen }));
}

console.log("/api/worksheet-pdf");

const realFetch = globalThis.fetch;

await test("renders the selected worksheets and returns a downloadable PDF", async () => {
  const { response, env, seen } = await post({
    title: "Unit 3 — Practice Worksheets",
    sheets: [
      { path: "/lessons/3-1/worksheet.html", title: "3.1 — Worksheet" },
      { path: "/lessons/3-1-group1/practice.html", title: "3.1 G1 — Practice" },
    ],
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "application/pdf");
  assert.equal(
    response.headers.get("Content-Disposition"),
    'attachment; filename="Unit-3-Practice-Worksheets.pdf"',
    "the browser must save it, not display it",
  );
  assert.equal(seen.length, 2, "fetched both worksheets from its own origin");
  assert.ok(
    seen.every((u) => u.startsWith("https://eduwonderlab.com/lessons/")),
    `fetched something off-origin: ${seen}`,
  );

  const [call] = env.BROWSER.calls;
  assert.equal(call.action, "pdf");
  assert.match(call.options.html, /id="wsx-1"/);
  assert.match(call.options.html, /id="wsx-2"/);
  assert.doesNotMatch(call.options.html, /boom\(\)/, "the page's own scripts never run");
  assert.doesNotMatch(
    call.options.html,
    /window\.print\(\)\s*;/,
    "a server render must not open a print dialog nobody can dismiss",
  );
  assert.match(call.options.html, /<base href="https:\/\/eduwonderlab\.com\/"/);
});

await test("refuses anything that is not a student worksheet path", async () => {
  const refused = [
    "/lessons/3-1/worksheet-answer-key.html", // teacher surface
    "/lessons/3-1/mstar-worksheet-answer-key.html",
    "/lessons/3-1/notes.html",
    "/lessons/../../etc/passwd",
    "https://evil.example/page.html",
    "//evil.example/page.html",
    "/lessons/3-1/worksheet.html?x=1",
    "",
  ];
  for (const path of refused) {
    const { response, env } = await post({ sheets: [{ path }] });
    assert.equal(response.status, 400, `accepted ${path || "(empty)"}`);
    assert.equal(env.BROWSER.calls.length, 0, `rendered ${path || "(empty)"}`);
  }
});

await test("ignores caller-supplied html and urls entirely", async () => {
  // The shape an abuser would try: this must be treated as a missing `sheets`.
  const { response, env } = await post({
    html: "<h1>render me</h1>",
    url: "https://evil.example/",
  });
  assert.equal(response.status, 400);
  assert.equal(env.BROWSER.calls.length, 0);
});

await test("caps how much one request can ask the renderer to do", async () => {
  const sheets = Array.from({ length: 151 }, () => ({ path: "/lessons/3-1/worksheet.html" }));
  const { response, env } = await post({ sheets });
  assert.equal(response.status, 400);
  assert.equal(env.BROWSER.calls.length, 0);
});

await test("a deployment with no BROWSER binding answers 503, it does not throw", async () => {
  const { response } = await post(
    { sheets: [{ path: "/lessons/3-1/worksheet.html" }] },
    { env: {} },
  );
  assert.equal(response.status, 503, "the downloader keys its print-view fallback off this");
  const data = await response.json();
  assert.equal(data.ok, false);
  assert.match(data.error, /not configured/i);
});

await test("a worksheet that will not load fails as JSON, not an HTML 500", async () => {
  const { response } = await post(
    { sheets: [{ path: "/lessons/3-1/worksheet.html" }] },
    { fetched: { status: 404 } },
  );
  assert.equal(response.status, 500);
  assert.equal(response.headers.get("Content-Type"), "application/json");
  const data = await response.json();
  assert.equal(data.ok, false);
  assert.doesNotMatch(data.error, /lessons/, "internal detail stays in the log");
});

await test("one caller cannot spend the whole account's render quota", async () => {
  const sheets = [{ path: "/lessons/3-1/worksheet.html" }];
  const statuses = [];
  for (let i = 0; i < 13; i++) {
    const { response } = await post({ sheets }, { ip: "203.0.113.9" });
    statuses.push(response.status);
  }
  assert.ok(statuses.includes(429), `never rate limited: ${statuses.join(",")}`);
  assert.equal(statuses[0], 200, "the first request still works");
});

await test("only POST is allowed", async () => {
  const request = new Request("https://eduwonderlab.com/api/worksheet-pdf", { method: "GET" });
  const response = await onRequest({ request, env: { BROWSER: stubBrowser() } });
  assert.equal(response.status, 405);
});

await test("the download name cannot be steered out of the filename", async () => {
  const { response } = await post({
    title: '../../etc/passwd"; filename="evil.exe',
    sheets: [{ path: "/lessons/3-1/worksheet.html" }],
  });
  const disposition = response.headers.get("Content-Disposition");
  assert.doesNotMatch(disposition, /\.\.|\//, `path separators survived: ${disposition}`);
  assert.equal(
    (disposition.match(/filename=/g) || []).length,
    1,
    `header injection: ${disposition}`,
  );
});

globalThis.fetch = realFetch;

if (failures) {
  console.error(`\nFAIL: ${failures} test${failures === 1 ? "" : "s"}`);
  process.exit(1);
}
