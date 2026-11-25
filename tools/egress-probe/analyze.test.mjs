// Pure analysis half of the egress probe: known-bad requests MUST be flagged, clean ones must not.
import assert from "node:assert/strict";
import { test } from "node:test";
import { analyzeRequest, canaryForms, makeCanary, originOf } from "./analyze.mjs";

const APP = "http://127.0.0.1:4173";
const canary = makeCanary("writing");
const cfg = { allowedOrigins: [APP], canaries: [canary] };
const kinds = (req, config = cfg) =>
  analyzeRequest(req, config).map((f) => `${f.kind}${f.where ? `:${f.where}` : ""}`);

test("makeCanary is deterministic and URL-safe", () => {
  assert.deepEqual(makeCanary("writing"), canary);
  assert.notEqual(makeCanary("recording").value, canary.value);
  assert.match(canary.value, /^zzcanary-writing-[0-9a-f]{8}$/);
});

test("clean same-origin requests pass", () => {
  assert.deepEqual(kinds({ url: `${APP}/api/ping` }), []);
  assert.deepEqual(kinds({ url: `${APP}/save`, method: "POST", postData: '{"x":1}' }), []);
  assert.deepEqual(kinds({ url: "data:text/plain,hello" }), []);
  assert.deepEqual(kinds({ url: "blob:http://127.0.0.1:4173/abc" }), []);
});

test("cross-origin requests are flagged even without a canary", () => {
  assert.deepEqual(kinds({ url: "http://127.0.0.1:9/ping" }), ["cross-origin"]);
  assert.deepEqual(kinds({ url: "https://fonts.example/f.css" }), ["cross-origin"]);
  assert.deepEqual(kinds({ url: "http://127.0.0.1:4173.evil.test/" }), ["cross-origin"]);
  assert.deepEqual(kinds({ url: "ws://127.0.0.1:9/s", method: "WS" }), ["cross-origin"]);
  assert.equal(originOf("ws://h:1/x"), "http://h:1");
});

test("canary is found in url, body and headers, in common encodings", () => {
  const v = canary.value;
  const same = (extra) => ({ url: `${APP}/x`, method: "POST", ...extra });
  assert.deepEqual(kinds(same({ url: `${APP}/x?q=${v}` })), ["canary:url"]);
  assert.deepEqual(kinds(same({ url: `${APP}/x?q=${v.toUpperCase()}` })), ["canary:url"]);
  assert.deepEqual(kinds(same({ postData: `note=${v}` })), ["canary:body"]);
  assert.deepEqual(kinds(same({ postData: Buffer.from(`{"t":"${v}"}`) })), ["canary:body"]);
  assert.deepEqual(kinds(same({ headers: { "x-note": v } })), ["canary:header"]);
  assert.deepEqual(kinds(same({ postData: `t=${encodeURIComponent(`${v} and more`)}` })), [
    "canary:body",
  ]);
  for (const prefix of ["", "a", "ab"]) {
    const encoded = Buffer.from(`${prefix}${v}tail`).toString("base64");
    assert.deepEqual(
      kinds(same({ postData: encoded })),
      ["canary:body"],
      `base64 alignment "${prefix}"`,
    );
    const url = Buffer.from(`${prefix}${v}`).toString("base64url");
    assert.deepEqual(
      kinds(same({ url: `${APP}/p/${url}` })),
      ["canary:url"],
      `base64url alignment "${prefix}"`,
    );
  }
});

test("cross-origin canary yields both findings", () => {
  assert.deepEqual(kinds({ url: "http://127.0.0.1:9/c", method: "POST", postData: canary.value }), [
    "cross-origin",
    "canary:body",
  ]);
});

test("allowCanaryTo exempts only the named same-origin path, never another origin", () => {
  const allow = { ...cfg, allowCanaryTo: [{ origin: APP, pathPrefix: "/api/portfolio" }] };
  assert.deepEqual(
    kinds({ url: `${APP}/api/portfolio/save`, method: "POST", postData: canary.value }, allow),
    [],
  );
  assert.deepEqual(
    kinds({ url: `${APP}/api/other`, method: "POST", postData: canary.value }, allow),
    ["canary:body"],
  );
  assert.deepEqual(
    kinds(
      { url: "http://127.0.0.1:9/api/portfolio/save", method: "POST", postData: canary.value },
      allow,
    ),
    ["cross-origin", "canary:body"],
  );
});

test("unrelated text containing no canary is not flagged; forms are non-trivial", () => {
  assert.deepEqual(
    kinds({ url: `${APP}/x`, method: "POST", postData: "zzcanary-other-00000000" }),
    [],
  );
  const forms = canaryForms(canary.value);
  assert.ok(forms.text.length === 3 && forms.base64.length >= 4);
});
