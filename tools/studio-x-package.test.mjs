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

describe("buildPackage: end to end", () => {
  test("builds, re-opens and validates; the manifest matches the files", async () => {
    const r = await build();
    assert.ok(r.zip instanceof Uint8Array);
    const zip = await open(r.zip);
    const names = Object.keys(zip.files)
      .filter((n) => !zip.files[n].dir)
      .sort();
    assert.deepEqual(names, [
      "index.html",
      "package.json",
      "student/all-print.html",
      "student/interactive-print.html",
      "student/interactive.html",
      "student/worksheet-print.html",
      "student/worksheet.docx",
      "teacher/all-keys-print.html",
      "teacher/key-print.html",
      "teacher/key.docx",
      "teacher/notes-print.html",
    ]);
    const manifest = JSON.parse(await text(zip, "package.json"));
    assert.equal(manifest.schema, "lp-package/1");
    assert.equal(manifest.generatedAt, DATE);
    assert.deepEqual(
      manifest.parts.map((p) => [p.id, p.role, p.audience]),
      [
        ["interactive", "interactive", "student"],
        ["worksheet", "worksheet", "student"],
        ["key", "key", "teacher"],
        ["notes", "notes", "teacher"],
      ],
    );
    assert.deepEqual(
      manifest.parts[0].files.map((f) => f.format),
      ["html", "print"],
    );
    for (const f of manifest.files)
      assert.equal(f.bytes, (await zip.file(f.path).async("uint8array")).length, f.path);
    assert.deepEqual(
      manifest.files.map((f) => f.path).sort(),
      names.filter((n) => n !== "package.json"),
    );
    assert.ok(!JSON.stringify(manifest).match(/[0-9a-f]{32}/), "no hashes in the manifest");
    assert.deepEqual(manifest.objectives, [
      "Use fractions to solve problems.",
      "Objective for Fractions Practice",
      "Objective for Ratio Check",
    ]);
    assert.deepEqual(
      manifest.terms.map((t) => t.term),
      ["denominator", "numerator", "product"],
    );
    assert.equal(manifest.terms[1].es, "numerador");

    const v = await validatePackage(r.zip);
    assert.deepEqual(v.errors, []);
    assert.equal(v.ok, true);
    assert.equal(v.offline, true);
    assert.deepEqual(v.offenders, []);
    assert.deepEqual(v.missing, []);
    assert.equal(r.offline, true);
    assert.deepEqual(v.files.sort(), names);
  });

  test("the player pages are the real standalone export and the Word files are carried through", async () => {
    const r = await build();
    const zip = await open(r.zip);
    const page = await text(zip, "student/interactive.html");
    assert.match(page, /^<!doctype html>/);
    assert.match(page, /Content-Security-Policy/);
    assert.match(page, /StudioPlayer\.mountPlayer/);
    assert.deepEqual(
      [...(await zip.file("student/worksheet.docx").async("uint8array"))],
      [...(await docx("student"))],
    );
    const printed = await text(zip, "student/worksheet-print.html");
    assert.match(printed, /Name/);
    assert.doesNotMatch(printed, /TEACHER COPY/);
  });

  test("deterministic: same input, same bytes, whatever the clock says; the date is only what was passed in", async () => {
    mock.method(Date, "now", () => 1);
    const a = await build();
    mock.method(Date, "now", () => 4_000_000_000_000);
    const b = await build();
    mock.restoreAll();
    assert.deepEqual([...a.zip], [...b.zip]);
    const c = await build(selection(), await deps({ generatedAt: "2027-01-02" }));
    assert.notDeepEqual([...a.zip], [...c.zip]);
    assert.equal(c.manifest.generatedAt, "2027-01-02");
    assert.match(await text(await open(c.zip), "index.html"), /2027-01-02/);
  });

  test("the launcher: relative links, no script, no handlers, strict CSP, teacher files in their own section", async () => {
    const r = await build(selection({ title: `Pack <b>"x"</b> & more` }));
    const zip = await open(r.zip);
    const html = await text(zip, "index.html");
    assert.match(
      html,
      /<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'/,
    );
    assert.doesNotMatch(html, /<script|\son\w+\s*=|https?:\/\/|javascript:/i);
    assert.ok(!html.includes("<b>"));
    assert.ok(html.includes("&lt;b&gt;"));
    const dom = new JSDOM(html);
    const hrefs = [...dom.window.document.querySelectorAll("a[href]")].map((a) =>
      a.getAttribute("href"),
    );
    assert.ok(hrefs.length >= 9);
    for (const h of hrefs) {
      assert.doesNotMatch(h, /^(?:[a-z]+:|\/)/i);
      assert.ok(zip.file(decodeURIComponent(h)), `${h} resolves`);
    }
    const teacher = dom.window.document.querySelector(".teacher");
    const inTeacher = [...teacher.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    assert.ok(inTeacher.length && inTeacher.every((h) => h.startsWith("teacher/")));
    const outside = hrefs.filter((h) => !inTeacher.includes(h));
    assert.ok(outside.length && outside.every((h) => h.startsWith("student/")));
    assert.match(html, /no internet/);
  });
});

describe("answers never reach student files", () => {
  const studentPrint = [
    "student/interactive-print.html",
    "student/worksheet-print.html",
    "student/all-print.html",
  ];
  const everything = Object.values(SECRETS);

  test("no student print file contains any answer, explanation, rubric, note or source note", async () => {
    const zip = await open((await build()).zip);
    for (const path of studentPrint) {
      const html = await text(zip, path);
      for (const secret of everything) assert.ok(!html.includes(secret), `${path} leaks ${secret}`);
    }
    // the same checks must have teeth: the key file does carry them
    const key = await text(zip, "teacher/key-print.html");
    for (const secret of [
      SECRETS.number,
      SECRETS.blank,
      SECRETS.sample,
      SECRETS.rubric,
      SECRETS.why,
      SECRETS.notesField,
      SECRETS.note,
      SECRETS.misc,
    ])
      assert.ok(key.includes(secret), `key has ${secret}`);
    const keys = await text(zip, "teacher/all-keys-print.html");
    assert.ok(keys.includes(SECRETS.number));
  });

  test("the interactive page carries no teacher notes; it is flagged as embedding answers", async () => {
    const r = await build();
    const zip = await open(r.zip);
    const page = await text(zip, "student/interactive.html");
    for (const s of [SECRETS.note, SECRETS.notesField, SECRETS.misc, SECRETS.source])
      assert.ok(!page.includes(s), s);
    const file = r.manifest.parts[0].files.find((f) => f.format === "html");
    assert.equal(file.answersEmbedded, true);
    assert.equal(
      r.manifest.parts[0].files.find((f) => f.format === "print").answersEmbedded,
      false,
    );
    assert.ok(
      r.review.some(
        (x) => /answers are inside the page file/.test(x.en) && /respuestas est/.test(x.es),
      ),
    );
    assert.match(await text(zip, "index.html"), /Self-checking page/);
  });

  test("nothing at all outside teacher/ contains a teacher-only note", async () => {
    const zip = await open((await build()).zip);
    for (const n of Object.keys(zip.files).filter(
      (x) => !x.startsWith("teacher/") && !zip.files[x].dir && !/\.docx$/.test(x),
    )) {
      const s = await text(zip, n);
      for (const secret of [SECRETS.note, SECRETS.notesField, SECRETS.misc, SECRETS.source])
        assert.ok(!s.includes(secret), `${n}: ${secret}`);
    }
  });

  test("an answer typed into a student-visible field stops the build; nothing is packaged", async () => {
    const leaky = activity("Leaky");
    leaky.blocks[2] = { ...leaky.blocks[2], prompt: `Compute 6 × 1232. (${SECRETS.why})` };
    await failsWith(
      () =>
        build(
          selection({
            parts: [{ id: "w", role: "worksheet", activity: leaky, format: "print" }],
            combined: {},
          }),
        ),
      "answer-leak",
    );
    const notes = activity("Leaky notes");
    notes.blocks[1] = {
      id: "t2",
      type: "text",
      role: "body",
      text: `Remember ${SECRETS.notesField}`,
    };
    await failsWith(
      () =>
        build(
          selection({
            parts: [{ id: "w", role: "worksheet", activity: notes, format: "print" }],
            combined: {},
          }),
        ),
      "answer-leak",
    );
  });

  test("validatePackage catches a teacher copy that ended up in student/ or a note in a student page", async () => {
    const r = await build();
    const key = await text(await open(r.zip), "teacher/key-print.html");
    const bad = await tamper(r.zip, "student/worksheet-print.html", () => key);
    const v = await validatePackage(bad);
    assert.equal(v.ok, false);
    assert.ok(
      v.errors.some(
        (e) =>
          e.code === "teacher-content-in-student-file" && e.path === "student/worksheet-print.html",
      ),
    );
    const noted = await tamper(r.zip, "student/interactive.html", (h) =>
      h.replace(
        "</body>",
        '<script type="application/json">{"notes":{"teacher":"x"}}</script></body>',
      ),
    );
    assert.ok(
      (await validatePackage(noted)).errors.some(
        (e) => e.code === "teacher-content-in-student-file",
      ),
    );
    const wrongFolder = await tamper(r.zip, "teacher/notes-print.html", () => null);
    assert.ok(
      (await validatePackage(wrongFolder)).errors.some((e) => e.code === "part-file-missing"),
    );
  });
});

describe("offline claim", () => {
  const withEdit = async (path, edit) =>
    validatePackage(await tamper((await build()).zip, path, edit));

  test("external references are found and named; offline is false", async () => {
    const cases = [
      ['<img src="https://evil.example/x.png">', "https://evil.example/x.png", "attribute:src"],
      [
        '<link rel="stylesheet" href="https://cdn.example/a.css">',
        "https://cdn.example/a.css",
        "attribute:href",
      ],
      ['<script src="//cdn.example/a.js"></script>', "//cdn.example/a.js", "attribute:src"],
      [
        "<style>@import url(https://fonts.example/f.css);</style>",
        "https://fonts.example/f.css",
        "css-url",
      ],
      [
        '<style>.a{background:url("http://x.example/b.png")}</style>',
        "http://x.example/b.png",
        "css-url",
      ],
      [
        '<div style="background:url(https://x.example/c.png)"></div>',
        "https://x.example/c.png",
        "css-url",
      ],
      [
        '<script>var u="https://api.example/track";</script>',
        "https://api.example/track",
        "script-url",
      ],
      ['<script>fetch("/api/x")</script>', "fetch(", "network-api"],
      [
        '<meta http-equiv="refresh" content="0;url=https://x.example/">',
        "https://x.example/",
        "meta-refresh",
      ],
      ['<iframe src="http://x.example/f"></iframe>', "http://x.example/f", "attribute:src"],
      ['<a href="javascript:alert(1)">x</a>', "javascript:alert(1)", "javascript-url"],
    ];
    for (const [snippet, url, kind] of cases) {
      const v = await withEdit("student/worksheet-print.html", (h) =>
        h.replace("</body>", `${snippet}</body>`),
      );
      assert.equal(v.offline, false, snippet);
      assert.ok(
        v.offenders.some(
          (o) => o.url === url && o.kind === kind && o.file === "student/worksheet-print.html",
        ),
        `${snippet} -> ${JSON.stringify(v.offenders)}`,
      );
    }
  });

  test("things that are not requests do not count: data: URIs, #fragments, namespaces, JSON data text, visible URLs", async () => {
    const v = await withEdit("student/worksheet-print.html", (h) =>
      h.replace(
        "</body>",
        '<img src="data:image/png;base64,AAAA"><a href="#top">x</a><svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(#p)"/></svg><script type="application/json">{"t":"see https://example.com"}</script><p>Visit https://example.org</p></body>',
      ),
    );
    assert.equal(v.offline, true, JSON.stringify(v.offenders));
    assert.deepEqual(v.missing, []);
  });

  test("a local file that is not in the package is reported, and offline is false", async () => {
    for (const [snippet, reason] of [
      ['<img src="images/a.png">', "not-in-package"],
      ['<img src="../../outside.png">', "outside-package"],
      ['<img src="/uploads/a.png">', "root-relative"],
      ['<link rel="stylesheet" href="a.css">', "not-in-package"],
    ]) {
      const v = await withEdit("student/worksheet-print.html", (h) =>
        h.replace("</body>", `${snippet}</body>`),
      );
      assert.equal(v.offline, false, snippet);
      assert.ok(
        v.missing.some((m) => m.reason === reason),
        `${snippet}: ${JSON.stringify(v.missing)}`,
      );
    }
    const present = await withEdit("student/worksheet-print.html", (h) =>
      h.replace("</body>", '<a href="../student/interactive.html">x</a></body>'),
    );
    assert.deepEqual(present.missing, []);
  });

  test("a broken launcher link and a missing file are reported", async () => {
    const r = await build();
    const v = await validatePackage(await tamper(r.zip, "student/worksheet.docx", () => null));
    assert.equal(v.offline, false);
    assert.ok(v.missing.some((m) => m.file === "index.html" && m.ref === "student/worksheet.docx"));
    assert.ok(v.errors.some((e) => e.code === "part-file-missing"));
    const gone = await validatePackage(await tamper(r.zip, "index.html", () => null));
    assert.ok(gone.errors.some((e) => e.code === "no-launcher"));
    assert.equal(gone.offline, false);
  });

  test("the builder does not claim offline when it is not: the launcher drops the claim and the review says why", async () => {
    const leaky = await deps({ js: `${PLAYER_JS}\n;fetch("https://stats.example/x");` });
    const r = await build(selection(), leaky);
    assert.equal(r.offline, false);
    assert.ok(
      r.validation.offenders.some((o) => o.kind === "network-api" || o.kind === "script-url"),
    );
    const html = await text(await open(r.zip), "index.html");
    assert.doesNotMatch(html, /with no internet/);
    assert.match(html, /may need an internet connection/);
    assert.ok(
      r.review.some((x) => /may need internet/.test(x.en) && /puede necesitar internet/.test(x.es)),
    );
    assert.equal((await validatePackage(r.zip)).offline, false);
  });

  test("same-site pictures are left out of the package, and the teacher is told", async () => {
    const pic = activity("With picture");
    pic.blocks.splice(1, 0, { id: "i1", type: "image", src: "/uploads/cat.png", alt: "A cat" });
    const r = await build(
      selection({
        parts: [{ id: "w", role: "worksheet", activity: pic, formats: ["print", "html"] }],
        combined: {},
      }),
      await deps({ docx: {} }),
    );
    assert.equal(r.offline, true);
    assert.ok(r.review.some((x) => /1 picture\(s\)/.test(x.en) && /1 imagen/.test(x.es)));
    assert.doesNotMatch(
      await text(await open(r.zip), "student/w-print.html"),
      /\/uploads\/cat\.png/,
    );
  });

  test("scanner details: resolveRef, srcset, quoted and unquoted attributes", () => {
    assert.equal(resolveRef("student/a.html", "../teacher/k.html?x=1#y"), "teacher/k.html");
    assert.equal(resolveRef("student/a.html", "../../x"), null);
    assert.equal(resolveRef("a.html", "s/b%20c.html"), "s/b c.html");
    const have = new Set(["a.png"]);
    const s = scanHtml(
      "i.html",
      "<img srcset=\"a.png 1x, https://x.example/b.png 2x\"><img src=a.png><img src = 'https://q.example/z'>",
      (p) => have.has(p),
    );
    assert.deepEqual(s.offenders.map((o) => o.url).sort(), [
      "https://q.example/z",
      "https://x.example/b.png",
    ]);
    assert.deepEqual(s.missing, []);
  });
});
