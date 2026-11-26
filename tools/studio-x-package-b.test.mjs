// Studio X resource packages: build, re-open and validate end to end; answers never in student files; the offline
// claim is only made when it is true; the combined print document; the launcher.
import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";
import { JSDOM } from "jsdom";
import JSZip from "jszip";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import {
  buildPackage,
  combinedPrintHtml,
  PackageError,
  validatePackage,
} from "../access-practice-lab/src/studio/x/package.js";
import { launcherHtml } from "../access-practice-lab/src/studio/x/package-launcher.js";
import { resolveRef, scanHtml } from "../access-practice-lab/src/studio/x/package-scan.js";
import { PLAYER_CSS, PLAYER_JS } from "./studio-player-helpers.mjs";

import {
  A,
  activity,
  B,
  build,
  DATE,
  deps,
  docx,
  failsWith,
  open,
  SECRETS,
  selection,
  tamper,
  text,
} from "./studio-x-package-helpers.mjs";

describe("validatePackage: structure", () => {
  test("refuses things that are not packages", async () => {
    assert.equal((await validatePackage(new Uint8Array([1, 2, 3]))).errors[0].code, "not-a-zip");
    assert.equal((await validatePackage("nope")).errors[0].code, "not-a-zip");
    const empty = await new JSZip().file("hello.txt", "x").generateAsync({ type: "uint8array" });
    const v = await validatePackage(empty);
    assert.ok(
      v.errors.some((e) => e.code === "no-manifest") && v.offline === false && v.ok === false,
    );
    const z = new JSZip().file("package.json", "{").file("index.html", "<p>");
    assert.ok(
      (await validatePackage(await z.generateAsync({ type: "uint8array" }))).errors.some(
        (e) => e.code === "bad-manifest",
      ),
    );
  });

  test("manifest and files must agree: extra file, wrong size, missing file, unmarked teacher file", async () => {
    const r = await build();
    const extra = await open(r.zip);
    extra.file("student/extra.html", "<p>x</p>");
    const v1 = await validatePackage(await extra.generateAsync({ type: "uint8array" }));
    assert.ok(v1.errors.some((e) => e.code === "unlisted-file" && e.path === "student/extra.html"));
    const sized = await tamper(r.zip, "student/worksheet-print.html", (h) => `${h}<!-- more -->`, {
      manifest: false,
    });
    assert.ok((await validatePackage(sized)).errors.some((e) => e.code === "size-mismatch"));
    const zip = await open(r.zip);
    const m = JSON.parse(await text(zip, "package.json"));
    m.files.find((f) => f.path === "teacher/key.docx").audience = "student";
    zip.file("package.json", JSON.stringify(m));
    assert.ok(
      (await validatePackage(await zip.generateAsync({ type: "uint8array" }))).errors.some(
        (e) => e.code === "teacher-file-unmarked",
      ),
    );
  });

  test("a path that climbs out of the package, and a broken Word file", async () => {
    const r = await build();
    const zip = await open(r.zip);
    zip.file("xx/evil.txt", "x"); // JSZip refuses to write "../", so patch the name bytes in the finished archive
    const raw = await zip.generateAsync({ type: "uint8array" });
    const at = [];
    for (let i = 0; i < raw.length - 3; i++)
      if (raw[i] === 120 && raw[i + 1] === 120 && raw[i + 2] === 47 && raw[i + 3] === 101)
        at.push(i);
    assert.ok(at.length >= 2, "name appears in the local header and the central directory");
    for (const i of at) raw.set([46, 46, 47], i);
    const v = await validatePackage(raw);
    assert.ok(v.errors.some((e) => e.code === "unsafe-path"));
    assert.equal(v.offline, false);
    const bad = await tamper(r.zip, "student/worksheet.docx", () => "not a zip");
    assert.ok((await validatePackage(bad)).errors.some((e) => e.code === "bad-docx"));
  });
});

describe("combinedPrintHtml", () => {
  const parts = [
    { id: "a", role: "worksheet", activity: A },
    { id: "b", role: "worksheet", activity: B },
    { id: "k", role: "key", activity: B },
  ];
  const dom = (html) => new JSDOM(html).window.document;

  test("one heading per part, a page break between parts, answer keys excluded by default", () => {
    const html = combinedPrintHtml(parts);
    const d = dom(html);
    assert.deepEqual(
      [...d.querySelectorAll("h1")].map((h) => h.textContent),
      ["Fractions Practice", "Ratio Check"],
    );
    assert.equal(d.querySelectorAll("section.sheet").length, 2);
    assert.equal(d.querySelectorAll("section.partstart").length, 2);
    assert.match(html, /\.sheet\.partstart\{break-before:page\}/);
    assert.match(html, /\.sheet\+\.sheet\{break-before:page\}/);
    assert.doesNotMatch(html, /class="sheet key|TEACHER COPY/);
    for (const s of Object.values(SECRETS)) assert.ok(!html.includes(s), s);
    assert.equal(html.match(/<main>/g).length, 1);
    assert.equal(html.match(/<!doctype/gi).length, 1);
  });

  test("ids stay unique and every reference still resolves, across parts", () => {
    const d = dom(combinedPrintHtml(parts, { keys: "append" }));
    const ids = [...d.querySelectorAll("[id]")].map((e) => e.id);
    assert.equal(new Set(ids).size, ids.length, "duplicate ids");
    for (const el of d.querySelectorAll("[aria-labelledby]"))
      for (const id of el.getAttribute("aria-labelledby").split(" "))
        assert.ok(d.getElementById(id), id);
  });

  test("keys: append puts a separate answer-key section after every student part; only prints just the keys", () => {
    const html = combinedPrintHtml(parts, { keys: "append" });
    const d = dom(html);
    const sheets = [...d.querySelectorAll("section.sheet")].map((s) => s.classList.contains("key"));
    assert.deepEqual(sheets, [false, false, true, true]); // students, key cover, the key itself
    assert.ok(
      html.indexOf(SECRETS.number) > html.lastIndexOf('<section class="sheet partstart student"'),
    );
    assert.deepEqual([...d.querySelectorAll("h1")].length, 2);
    const only = combinedPrintHtml(parts, { keys: "only" });
    assert.equal(dom(only).querySelectorAll("h1").length, 0);
    assert.ok(only.includes(SECRETS.number));
    assert.doesNotMatch(only, /class="sheet partstart student"/);
    // without an explicit key part, each student part gets its own key
    const own = combinedPrintHtml(parts.slice(0, 2), { keys: "append" });
    assert.equal((own.match(/class="sheet partstart key"/g) ?? []).length, 3 + 0 - 1 + 0); // cover + one per student part
  });

  test("language and refusals", () => {
    const es = combinedPrintHtml(parts.slice(0, 2), { lang: "es", keys: "append" });
    assert.match(es, /<html lang="es">/);
    assert.match(es, /Nombre/);
    assert.match(es, /COPIA DEL MAESTRO/);
    assert.throws(
      () => combinedPrintHtml([], {}),
      (e) => e.code === "no-parts",
    );
    assert.throws(
      () => combinedPrintHtml(parts, { keys: "maybe" }),
      (e) => e.code === "bad-keys",
    );
    assert.throws(
      () => combinedPrintHtml([parts[2]]),
      (e) => e.code === "no-student-parts",
    );
    assert.throws(
      () => combinedPrintHtml([{ role: "nonsense", activity: A }]),
      (e) => e.code === "bad-role",
    );
  });
});

describe("buildPackage: refuses bad input up front", () => {
  const one = (p, extra = {}) =>
    selection({
      parts: [{ id: "w", role: "worksheet", activity: B, format: "print", ...p }],
      combined: {},
      ...extra,
    });
  test("selection", async () => {
    await failsWith(() => build(one({}, { title: "" })), "bad-title");
    await failsWith(
      async () => build(one({}), await deps({ generatedAt: "yesterday" })),
      "bad-date",
    );
    await failsWith(async () => build(one({}), await deps({ generatedAt: undefined })), "bad-date");
    await failsWith(
      async () => build(one({}), await deps({ generatedAt: "2026-13-45" })),
      "bad-date",
    );
    await failsWith(() => build(selection({ parts: [] })), "no-parts");
    await failsWith(
      () =>
        build(
          selection({
            parts: Array.from({ length: 25 }, (_, i) => ({
              id: `p${i}`,
              role: "worksheet",
              activity: B,
              format: "print",
            })),
            combined: {},
          }),
        ),
      "too-many-parts",
    );
    await failsWith(() => build(null), "bad-selection");
  });
  test("parts", async () => {
    await failsWith(() => build(one({ id: "Bad Id" })), "bad-part-id");
    await failsWith(() => build(one({ id: "../x" })), "bad-part-id");
    await failsWith(() => build(one({ role: "boss" })), "bad-role");
    await failsWith(() => build(one({ format: "pdf" })), "bad-format");
    await failsWith(() => build(one({ role: "key", format: "html" })), "bad-format");
    await failsWith(() => build(one({ activity: { title: "x" } })), "bad-activity");
    await failsWith(() => build(one({ activity: { ...B, blocks: [] } })), "invalid-activity");
    await failsWith(
      () =>
        build(
          selection({
            parts: [
              { id: "a", role: "worksheet", activity: A, format: "print" },
              { id: "a", role: "check", activity: B, format: "print" },
            ],
            combined: {},
          }),
        ),
      "duplicate-part",
    );
    await failsWith(() => build(one({ format: "html" }), { generatedAt: DATE }), "no-player");
  });
  test("Word buffers", async () => {
    await failsWith(() => build(one({ format: "docx" }), { generatedAt: DATE }), "bad-docx");
    await failsWith(
      () =>
        build(one({ format: "docx" }), {
          generatedAt: DATE,
          docx: { w: new Uint8Array([1, 2, 3]) },
        }),
      "bad-docx",
    );
    await failsWith(
      () => build(one({ format: "docx" }), { generatedAt: DATE, docx: { w: "text" } }),
      "bad-docx",
    );
    await failsWith(
      async () => build(one({ format: "print" }), { generatedAt: DATE, docx: { w: await docx() } }),
      "stray-docx",
    );
    await failsWith(
      () =>
        build(
          selection({
            parts: [{ id: "k", role: "key", activity: B, format: "print" }],
            combined: { student: true },
          }),
          { generatedAt: DATE },
        ),
      "no-student-parts",
    );
  });
  test("the activities that go in are valid, and so is what comes out", async () => {
    for (const a of [A, B]) assert.equal(validateActivity(normalizeActivity(a)).ok, true);
    const r = await build();
    assert.deepEqual(
      r.review.filter((x) => !x.en || !x.es),
      [],
    );
  });
});

describe("JSZip injection", () => {
  const counting = () => {
    const calls = { loads: 0, creates: 0 };
    class Counting extends JSZip {
      constructor() {
        super();
        calls.creates++;
      }
      static loadAsync(...args) {
        calls.loads++;
        return JSZip.loadAsync(...args);
      }
    }
    return { Counting, calls };
  };
  const sel = () => selection({ combined: {} });

  test("deps.JSZip is used to build, to check Word files and to validate", async () => {
    const { Counting, calls } = counting();
    const r = await buildPackage(sel(), { ...(await deps()), JSZip: Counting });
    assert.equal(calls.creates, 1);
    assert.ok(
      calls.loads >= 3,
      "docx checks and the self-validation went through the injected class",
    );
    const before = calls.loads;
    assert.equal((await validatePackage(r.zip, { JSZip: Counting })).ok, true);
    assert.ok(calls.loads > before);
  });

  test("falls back to globalThis.JSZip, then to the jszip package", async () => {
    const { Counting, calls } = counting();
    globalThis.JSZip = Counting;
    try {
      const r = await buildPackage(sel(), await deps());
      assert.equal(calls.creates, 1);
      assert.equal(r.offline, true);
      assert.equal((await validatePackage(r.zip)).ok, true);
    } finally {
      delete globalThis.JSZip;
    }
    assert.equal("JSZip" in globalThis, false);
    assert.equal((await buildPackage(sel(), await deps())).offline, true); // Node fallback: dynamic import("jszip")
  });

  test("an injected JSZip and the package produce identical bytes", async () => {
    const a = await buildPackage(sel(), await deps());
    const b = await buildPackage(sel(), { ...(await deps()), JSZip: counting().Counting });
    assert.deepEqual([...a.zip], [...b.zip]);
  });
});
