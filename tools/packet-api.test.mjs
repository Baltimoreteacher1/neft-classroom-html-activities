// /api/bcpss/packet driven through the real onRequest: formats, filenames, validation, and the contract that a request carries
// only a unit, a part, a band and band COUNTS (never a name, alias or initial) and writes nothing.
// Run: node --test tools/packet-api.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { onRequest } from "../functions/api/bcpss/packet.js";
import { variantCodes } from "../shared/packets/bands.js";
import { docxText, PAGE_BREAK_HTML, PAGE_BREAK_XML, readZip } from "./packet-test-kit.mjs";

let n = 0;
const get = (query, env = {}) =>
  onRequest({
    request: new Request(`https://test.local/api/bcpss/packet?${query}`, {
      headers: { "CF-Connecting-IP": `10.1.${Math.floor(n / 200)}.${n++ % 200}` },
    }),
    params: {},
    env,
  });
const U = "g6-math-u1";
const codes = variantCodes(U);

test("html: a student paper is a complete page with only its code in the footer", async () => {
  const res = await get(`unit=${U}&part=student&band=3_4&format=html`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /text\/html/);
  const html = await res.text();
  assert.match(html, /^<!DOCTYPE html>/);
  assert.ok(html.includes(`content:"${codes["3_4"]}"`));
  assert.doesNotMatch(html, PAGE_BREAK_HTML);
  assert.doesNotMatch(html, /Levels? \d|3_4|1_2|5_6/);
});

test("docx: attachment named by code, never by band", async () => {
  const res = await get(`unit=${U}&part=student&band=1_2&format=docx`);
  assert.equal(res.status, 200);
  const disp = res.headers.get("content-disposition");
  assert.equal(disp, `attachment; filename="BCPSS-${U}-paper-${codes["1_2"]}.docx"`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  assert.doesNotMatch(readZip(bytes)["word/document.xml"], PAGE_BREAK_XML);
  assert.doesNotMatch(docxText(bytes), /Levels? \d|1_2/);
});

test("pdf: uses Browser Rendering when bound, else falls back to print HTML", async () => {
  let asked = null;
  const env = {
    BROWSER: {
      quickAction: async (kind, opts) => (
        (asked = { kind, opts }), new Response(new Uint8Array([37, 80, 68, 70]))
      ),
    },
  };
  const res = await get(`unit=${U}&part=cover&counts=1_2:8,3_4:12,5_6:5&format=pdf`, env);
  assert.equal(res.headers.get("content-type"), "application/pdf");
  assert.equal(
    res.headers.get("content-disposition"),
    `attachment; filename="BCPSS-${U}-cover.pdf"`,
  );
  assert.equal(asked.kind, "pdf");
  assert.match(asked.opts.html, /Teacher cover sheet/);
  const fallback = await get(`unit=${U}&part=key&format=pdf`);
  assert.equal(fallback.headers.get("x-bcpss-pdf-fallback"), "print-html");
  assert.match(await fallback.text(), /window\.print\(\)/);
});

test("every part answers 200 for a sample unit in every format", async () => {
  for (const part of ["key", "cover", "kit-cards", "kit-frames", "kit-exit", "kit-family"]) {
    for (const format of ["html", "docx"]) {
      const res = await get(`unit=${U}&part=${part}&format=${format}&counts=3_4:25`);
      assert.equal(res.status, 200, `${part} ${format}`);
    }
  }
});

test("bad input is refused with a clear 4xx", async () => {
  const cases = [
    ["part=student&format=html", 400, /band/],
    [`unit=${U}&part=student&band=9_9`, 400, /band/],
    [`unit=${U}&part=cover`, 400, /counts|students|string/],
    [`unit=${U}&part=cover&counts=1_2:-4`, 400, /whole number/],
    [`unit=${U}&part=cover&counts=1_2:999`, 400, /over/],
    [`unit=${U}&part=nope`, 400, /part/],
    [`unit=${U}&part=key&format=exe`, 400, /format/],
    ["unit=../../etc/passwd&part=key", 400, /unit/],
    ["unit=g6-math-u99&part=key", 404, /not|authored/i],
  ];
  for (const [q, status, re] of cases) {
    const res = await get(q.startsWith("unit=") || q.includes("unit=") ? q : `unit=${U}&${q}`);
    assert.equal(res.status, status, q);
    assert.match((await res.json()).error, re, q);
  }
});

test("only GET is allowed", async () => {
  const res = await onRequest({
    request: new Request("https://test.local/api/bcpss/packet?unit=g6-math-u1", {
      method: "POST",
      body: "{}",
      headers: { "CF-Connecting-IP": "10.9.9.9" },
    }),
    params: {},
    env: {},
  });
  assert.equal(res.status, 405);
});

test("the route stores nothing and accepts no identity field", () => {
  const src = readFileSync(
    new URL("../functions/api/bcpss/packet.js", import.meta.url),
    "utf8",
  ).replace(/\/\/.*$/gm, "");
  assert.doesNotMatch(
    src,
    /env\.(DB|KV|R2)|\.prepare\(|\.put\(|localStorage|alias|initial|student_name/i,
  );
  assert.match(src, /from "\.\.\/\.\.\/_lib\/http\.js"/);
  assert.match(src, /rateLimit:/);
  assert.match(src, /maxBodyBytes:/);
});
