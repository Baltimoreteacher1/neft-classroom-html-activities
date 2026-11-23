// POST /api/studio/docx at function level: call the Pages Function's onRequest with real Request objects.
//   node --test tools/studio-docx-route.test.mjs
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import JSZip from "jszip";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { LIMITS } from "../access-practice-lab/src/studio/core/schema.js";
import { onRequest, safeFilename } from "../functions/api/studio/docx.js";

let ipCounter = 0;
const post = (body, { ip = `10.0.0.${++ipCounter}`, headers = {}, method = "POST" } = {}) =>
  onRequest({
    request: new Request("https://eduwonderlab.com/api/studio/docx", {
      method,
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": ip, ...headers },
      ...(method === "GET" ? {} : { body: typeof body === "string" ? body : JSON.stringify(body) }),
    }),
    env: {},
  });

const docxText = async (res) => {
  const zip = await JSZip.loadAsync(new Uint8Array(await res.arrayBuffer()));
  return zip.file("word/document.xml").async("string");
};

describe("POST /api/studio/docx", () => {
  test("200: a valid Word file with the right headers", async () => {
    const res = await post({ activity: allFormats("worksheet"), part: "all", lang: "es" });
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("content-type"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    assert.equal(
      res.headers.get("content-disposition"),
      'attachment; filename="All-question-types-with-key.docx"',
    );
    assert.equal(res.headers.get("cache-control"), "no-store");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.match(res.headers.get("x-studio-issues"), /^\d+\/\d+$/);
    const bytes = new Uint8Array(await res.clone().arrayBuffer());
    assert.equal(String.fromCharCode(bytes[0], bytes[1]), "PK");
    assert.equal(Number(res.headers.get("content-length")), bytes.byteLength);
    const xml = await docxText(res);
    assert.ok(xml.includes("COPIA DEL MAESTRO"));
    assert.ok(xml.includes("Nombre"));
  });

  test("defaults to the student part in English, and accepts a bare activity with no class code", async () => {
    const res = await post({ activity: allFormats("worksheet") });
    assert.equal(res.status, 200);
    assert.equal(
      res.headers.get("content-disposition"),
      'attachment; filename="All-question-types.docx"',
    );
    const xml = await docxText(res);
    assert.ok(!xml.includes("TEACHER COPY"));
  });

  test("normalizes hostile input and never blocks on validation problems", async () => {
    const res = await post({
      activity: {
        title: '<script>alert(1)</script> "Quiz"',
        blocks: [
          {
            type: "question",
            format: "choice",
            prompt: "<img src=x onerror=alert(1)>",
            options: [{ text: "only one" }],
          },
          { type: "mystery", text: "dropped" },
          { type: "image", src: "javascript:alert(1)", alt: "x" },
        ],
        __proto__: { polluted: true },
        extra: "dropped",
      },
    });
    assert.equal(res.status, 200);
    assert.match(
      res.headers.get("x-studio-issues"),
      /^[1-9]\d*\//,
      "issues are reported, not blocking",
    );
    assert.equal(
      res.headers.get("content-disposition"),
      'attachment; filename="script-alert-1-script-Quiz.docx"',
    );
    const xml = await docxText(res);
    assert.ok(!/<script/i.test(xml));
    assert.ok(!xml.includes("dropped"));
    assert.ok(!xml.includes("javascript:"));
  });

  test("413 when the activity or the request is over 480KB", async () => {
    const activity = { title: "Big", blocks: [], pad: "z".repeat(LIMITS.totalBytes + 10) };
    const a = await post({ activity });
    assert.equal(a.status, 413);
    assert.equal((await a.json()).ok, false);
    // body larger than the cap is refused before it is parsed
    const b = await post(`{"activity":{"title":"${"q".repeat(LIMITS.totalBytes + 8000)}"}}`);
    assert.equal(b.status, 413);
    const c = await post("{}", { headers: { "Content-Length": String(LIMITS.totalBytes * 3) } });
    assert.equal(c.status, 413);
  });

  test("405 for GET, 204 for OPTIONS, 400 for garbage and bad fields", async () => {
    const get = await post("", { method: "GET" });
    assert.equal(get.status, 405);
    assert.match(get.headers.get("allow"), /POST/);
    const options = await post("", { method: "OPTIONS" });
    assert.equal(options.status, 204);
    const garbage = await post("this is not json {");
    assert.equal(garbage.status, 400);
    assert.equal((await garbage.json()).error, "body must be valid JSON");
    for (const body of [
      {},
      { activity: null },
      { activity: "text" },
      { activity: [] },
      [],
      "null",
      5,
    ]) {
      const res = await post(typeof body === "string" ? body : body);
      assert.equal(res.status, 400, JSON.stringify(body));
    }
    assert.equal((await post({ activity: allFormats(), part: "everything" })).status, 400);
    assert.equal((await post({ activity: allFormats(), lang: "fr" })).status, 400);
  });

  test("429 after too many requests from one address", async () => {
    const ip = "203.0.113.77";
    const statuses = [];
    for (let i = 0; i < 22; i++)
      statuses.push((await post({ activity: { title: "t", blocks: [] } }, { ip })).status);
    assert.ok(statuses.includes(429), statuses.join(","));
    assert.equal(statuses[0], 200);
    assert.equal(
      (await post({ activity: { title: "t", blocks: [] } }, { ip: "203.0.113.78" })).status,
      200,
    );
  });

  test("safeFilename is ASCII, short and never empty", () => {
    assert.equal(safeFilename("Fracciones: ¡Práctica!", "student"), "Fracciones-Practica.docx");
    assert.equal(safeFilename("", "key"), "worksheet-answer-key.docx");
    assert.equal(
      safeFilename("../../etc/passwd\r\nX-Evil: 1", "all"),
      "etc-passwd-X-Evil-1-with-key.docx",
    );
    assert.ok(safeFilename("a".repeat(500), "student").length <= 70);
    assert.match(safeFilename("日本語", "student"), /^worksheet\.docx$/);
  });
});
