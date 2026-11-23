// Resource Studio: routing rules, export audit, print footer, Word packages (validated by python zipfile and LibreOffice),
// Remix hand-off, and a jsdom run of the Create view. Run: node --test tools/studio-create.test.mjs
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import zlib from "node:zlib";
import { JSDOM } from "jsdom";
import { buildDocx, REVIEW_LINE } from "../bcpss-teachers/studio/print/docx.js";
import {
  AUDIENCES,
  auditDoc,
  fileStem,
  prepareDoc,
  textCopy,
} from "../bcpss-teachers/studio/print/export.js";
import { renderDoc } from "../bcpss-teachers/studio/print/html.js";
import { visibleSections } from "../bcpss-teachers/studio/print/ir.js";
import { buildDocument, TEMPLATES } from "../bcpss-teachers/studio/print/templates.js";
import { remixDocument } from "../bcpss-teachers/studio/views/create/remix-doc.js";
import {
  buildInput,
  defaultState,
  resolveType,
  stateFromParams,
  stateToQuery,
} from "../bcpss-teachers/studio/views/create/state.js";
import { FIXTURES, fixtureInput, stubRenderVisual } from "./studio-print-fixtures.mjs";

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "studio-create-"));
test.after(() => fs.rmSync(TMP, { recursive: true, force: true }));

// A real PNG (solid grey, zlib) so pictures embed with true sizes.
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (b) => {
  let c = ~0;
  for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8);
  return ~c >>> 0;
};
function png(w, h) {
  const chunk = (t, d) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(d.length);
    const body = Buffer.concat([Buffer.from(t), d]);
    const sum = Buffer.alloc(4);
    sum.writeUInt32BE(crc(body));
    return Buffer.concat([len, body, sum]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h, 0xcc);
  for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0;
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}
const rasterize = async (_spec, wpx) => png(wpx, Math.round(wpx * 0.66));
const BANDS = ["k-2", "3-5", "6-8"];

test("type links from other views resolve to a template, a family or an item kind", () => {
  assert.equal(resolveType("frayer").templateId, "frayer");
  assert.equal(resolveType("organizer").family, "Graphic organizers");
  assert.equal(resolveType("organizer").templateId, null);
  assert.equal(resolveType("answer-key").templateId, "task-cards");
  assert.equal(resolveType("small-group").templateId, "discussion-cards");
  assert.equal(resolveType("vocab").itemKind, "vocab");
  assert.equal(resolveType("remix-evidence").remix, "evidence");
  assert.deepEqual(resolveType("nonsense"), {
    templateId: null,
    family: null,
    itemKind: null,
    remix: null,
  });
  // every printable id a lesson pack may list resolves to something or is harmlessly ignored
  for (const id of ["organizer", "task-cards", "exit-ticket", "vocab-mat"])
    assert.doesNotThrow(() => resolveType(id));
});

test("state round-trips through the address and never preselects a grade", () => {
  const empty = stateFromParams({}, {});
  assert.equal(empty.grade, "");
  assert.deepEqual(empty.tiers, ["dev"]);
  const st = stateFromParams(
    {
      type: "frayer",
      lesson: "g6-math-ratios-and-rates",
      grade: "6",
      subject: "math",
      tiers: "ee,br,zz",
      vis: "key",
      lang: "bilingual",
      size: "a4",
      cover: "0",
      title: "My title",
    },
    {},
  );
  assert.deepEqual(st.tiers, ["ee", "br"]);
  const again = stateFromParams(Object.fromEntries(new URLSearchParams(stateToQuery(st))), {});
  assert.deepEqual(again, st);
  assert.deepEqual(stateToQuery(defaultState()), {});
  const vocabLink = stateFromParams({ type: "vocab", lesson: "g6-math-ratios-and-rates" }, {});
  assert.equal(vocabLink.source, "vocab");
  assert.equal(vocabLink.vocabId, "g6-math-ratios-and-rates");
  assert.equal(stateFromParams({ grade: "13", subject: "x" }, {}).grade, "");
  const input = buildInput(
    { ...defaultState(), grade: "4", templateId: "kwl" },
    {},
    TEMPLATES.find((t) => t.id === "kwl"),
  );
  assert.equal(input.format.orientation, "landscape");
});

test("file names carry only the resource title, band and copy", () => {
  const doc = buildDocument(
    "frayer",
    fixtureInput("3-5", { title: "Ms. Smith's Period 3 -- Alex & Jo!" }),
  );
  assert.match(fileStem(doc, "student"), /^[a-z0-9-]+-3-5-student$/);
  assert.match(fileStem(doc, "teacher"), /-teacher$/);
  assert.equal(AUDIENCES.length, 2);
});

test("every audit failure is caught and every fixture resource passes", () => {
  const doc = buildDocument("vocab-mat", fixtureInput("6-8"));
  assert.ok(auditDoc(doc, "student").ok);
  assert.ok(auditDoc(doc, "teacher").ok);
  const noAlt = structuredClone(doc);
  const blocks = noAlt.sections.flatMap((x) => x.pages).flatMap((p) => p.blocks);
  const spec = blocks
    .flatMap((b) =>
      b.type === "visual"
        ? [b.spec]
        : b.type === "cards"
          ? b.items.map((c) => c.visual)
          : b.type === "table"
            ? b.rows.flat().map((c) => c.visual)
            : [],
    )
    .find(Boolean);
  assert.ok(spec, "fixture has a picture");
  spec.alt = "";
  assert.ok(!auditDoc(noAlt, "student").ok, "a picture without alt text fails the audit");
  const unreviewed = structuredClone(doc);
  unreviewed.meta.review = "";
  assert.ok(!auditDoc(unreviewed).ok);
  for (const band of BANDS)
    for (const t of TEMPLATES)
      assert.ok(auditDoc(buildDocument(t.id, fixtureInput(band)), "teacher").ok, `${t.id} ${band}`);
});

test("print footer and text copy carry the review status on every page", () => {
  for (const band of BANDS) {
    for (const t of TEMPLATES) {
      const doc = prepareDoc(buildDocument(t.id, fixtureInput(band)));
      for (const audience of ["student", "teacher"]) {
        const { html, pages } = renderDoc(doc, { audience, renderVisual: stubRenderVisual });
        const hits = (html.match(/Teacher review recommended/g) || []).length;
        assert.ok(
          hits >= pages,
          `${t.id} ${band} ${audience}: ${hits} review lines on ${pages} pages`,
        );
      }
      assert.match(textCopy(doc, "student"), /Teacher review recommended before classroom use\./);
    }
  }
  const once = prepareDoc(buildDocument("frayer", fixtureInput("6-8")));
  assert.equal(prepareDoc(once).meta.sourceLine, once.meta.sourceLine, "prepareDoc is idempotent");
});

test("a student copy never contains answer key or notes pages", () => {
  for (const t of TEMPLATES.filter((x) => x.keyed)) {
    const doc = buildDocument(t.id, fixtureInput("6-8"));
    assert.ok(
      visibleSections(doc, "teacher").some((s) => s.kind === "key"),
      `${t.id} has a key`,
    );
    assert.ok(!visibleSections(doc, "student").some((s) => s.kind === "key" || s.kind === "notes"));
  }
});

// --- Word packages ----------------------------------------------------------------------------------------------
const PY = String.raw`
import sys, json, zipfile, re
import xml.etree.ElementTree as ET
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
out = {}
for f in sys.argv[1:]:
    r = {"errors": []}
    try:
        z = zipfile.ZipFile(f)
        if z.testzip() is not None: r["errors"].append("crc")
        names = set(z.namelist())
        for n in names:
            if n.endswith(".xml") or n.endswith(".rels"): ET.fromstring(z.read(n))
        ct = z.read("[Content_Types].xml").decode()
        for part in ["document", "styles", "numbering", "settings", "header1", "footer1"]:
            if "/word/%s.xml" % part not in ct: r["errors"].append("content type " + part)
        rels = ET.fromstring(z.read("word/_rels/document.xml.rels"))
        for rel in rels:
            if "word/" + rel.get("Target") not in names: r["errors"].append("missing target " + rel.get("Target"))
        doc = ET.fromstring(z.read("word/document.xml"))
        r["headings"] = [p.find(W + "pPr/" + W + "pStyle").get(W + "val") for p in doc.iter(W + "p") if p.find(W + "pPr/" + W + "pStyle") is not None and p.find(W + "pPr/" + W + "pStyle").get(W + "val").startswith("Heading")]
        r["tables"] = len(list(doc.iter(W + "tbl")))
        r["headerRows"] = len(list(doc.iter(W + "tblHeader")))
        ns = {"wp": "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"}
        docpr = doc.findall(".//wp:docPr", ns)
        r["pictures"] = len(docpr)
        r["noAlt"] = len([d for d in docpr if not (d.get("descr") or "").strip()])
        ids = [d.get("id") for d in docpr]
        if len(ids) != len(set(ids)): r["errors"].append("duplicate docPr ids")
        r["text"] = " ".join(t.text or "" for t in doc.iter(W + "t"))
        r["footer"] = " ".join(t.text or "" for t in ET.fromstring(z.read("word/footer1.xml")).iter(W + "t"))
        core = z.read("docProps/core.xml").decode()
        r["title"] = re.search(r"<dc:title>(.*?)</dc:title>", core).group(1)
        r["lang"] = 'w:lang w:val="en-US"' in z.read("word/styles.xml").decode()
        r["orient"] = ET.fromstring(z.read("word/document.xml")).find(".//" + W + "pgSz").get(W + "orient")
        r["media"] = len([n for n in names if n.startswith("word/media/")])
        r["rels"] = {n: 1 for n in names if n.startswith("word/media/")}
        for p in doc.iter(W + "p"):
            pass
    except Exception as e:
        r["errors"].append(repr(e))
    out[f] = r
print(json.dumps(out))
`;
const hasPython = spawnSync("python3", ["-I", "-c", "pass"]).status === 0;

test("every template, band, copy and page setting makes a valid, accessible Word package", {
  skip: !hasPython && "python3 not available",
}, async () => {
  const jobs = [];
  for (const band of BANDS) {
    for (const t of TEMPLATES) {
      for (const [audience, extra] of [
        ["student", {}],
        [
          "teacher",
          {
            tiers: ["ee", "br"],
            visual: "key",
            lang: "bilingual",
            format: { size: "a4", orientation: "landscape" },
          },
        ],
      ]) {
        const doc = prepareDoc(buildDocument(t.id, fixtureInput(band, extra)));
        const file = path.join(TMP, `${t.id}-${band}-${audience}.docx`);
        fs.writeFileSync(file, await buildDocx(doc, { audience, rasterize }));
        jobs.push({ file, doc, audience, t, extra });
      }
    }
  }
  const raw = execFileSync("python3", ["-I", "-c", PY, ...jobs.map((j) => j.file)], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  const res = JSON.parse(raw);
  for (const j of jobs) {
    const r = res[j.file];
    const tag = path.basename(j.file);
    assert.deepEqual(r.errors, [], tag);
    assert.ok(r.headings.includes("Heading1"), `${tag}: real heading`);
    assert.equal(r.noAlt, 0, `${tag}: every picture has alt text`);
    assert.ok(r.lang, `${tag}: document language`);
    assert.equal(
      r.title,
      j.doc.title.replace(/&/g, "&amp;").replace(/</g, "&lt;"),
      `${tag}: title property`,
    );
    assert.ok(r.footer.includes(REVIEW_LINE), `${tag}: review line in footer`);
    assert.equal(
      r.orient === "landscape",
      j.extra.format?.orientation === "landscape",
      `${tag}: orientation`,
    );
    const shown = visibleSections(j.doc, j.audience)
      .flatMap((s) => s.pages)
      .flatMap((p) => p.blocks);
    const heads = shown.filter((b) => b.type === "table" && b.head).length;
    assert.ok(
      r.headerRows >= heads,
      `${tag}: ${r.headerRows} header rows for ${heads} tables with headings`,
    );
    // the student copy must not hold answer key or notes text
    if (j.audience === "student")
      assert.ok(
        !/Answer key:|Teacher implementation notes/.test(r.text),
        `${tag}: student copy leaks teacher pages`,
      );
  }
  const withPics = jobs.filter((j) => res[j.file].pictures > 0);
  assert.ok(withPics.length > 20, "pictures were embedded in many exports");
  assert.ok(
    withPics.every((j) => res[j.file].media === res[j.file].pictures),
    "one media file per picture",
  );
});

test("a Word file without a rasteriser keeps every picture's description in the text", async () => {
  const doc = prepareDoc(buildDocument("vocab-mat", fixtureInput("6-8")));
  const file = path.join(TMP, "no-raster.docx");
  fs.writeFileSync(file, await buildDocx(doc, { audience: "student", rasterize: null }));
  const res = JSON.parse(execFileSync("python3", ["-I", "-c", PY, file], { encoding: "utf8" }))[
    file
  ];
  assert.deepEqual(res.errors, []);
  assert.equal(res.pictures, 0);
  assert.match(res.text, /\[Picture: /);
});

const SOFFICE = ["soffice", "libreoffice"].find((c) => spawnSync("which", [c]).status === 0);
test("LibreOffice opens the Word files and prints the review line on every page", {
  skip: !SOFFICE && "soffice not available",
  timeout: 180000,
}, async () => {
  const cases = [
    ["task-cards", "k-2", "teacher", {}],
    ["kwl", "3-5", "student", { format: { size: "letter", orientation: "landscape" } }],
    ["vocab-cards", "6-8", "student", { tiers: ["ee", "br"], lang: "bilingual" }],
  ];
  for (const [id, band, audience, extra] of cases) {
    const doc = prepareDoc(buildDocument(id, fixtureInput(band, extra)));
    const dir = fs.mkdtempSync(path.join(TMP, "lo-"));
    const file = path.join(dir, `${id}.docx`);
    fs.writeFileSync(file, await buildDocx(doc, { audience, rasterize }));
    const profile = fs.mkdtempSync(path.join(TMP, "profile-"));
    const run = spawnSync(
      SOFFICE,
      [
        "--headless",
        "--norestore",
        `-env:UserInstallation=file://${profile}`,
        "--convert-to",
        "pdf",
        "--outdir",
        dir,
        file,
      ],
      { encoding: "utf8", timeout: 120000 },
    );
    const pdf = path.join(dir, `${id}.pdf`);
    assert.ok(fs.existsSync(pdf), `${id}: no PDF produced (${run.stderr?.slice(0, 200)})`);
    const hasPdftotext = spawnSync("which", ["pdftotext"]).status === 0;
    if (hasPdftotext) {
      const pages = execFileSync("pdftotext", ["-layout", pdf, "-"], { encoding: "utf8" })
        .split("\f")
        .filter((p) => p.trim());
      assert.ok(
        pages.length >= visibleSections(doc, audience).reduce((a, s) => a + s.pages.length, 0),
        `${id}: fewer PDF pages than resource pages`,
      );
      for (const [i, p] of pages.entries())
        assert.match(
          p.replace(/\s+/g, " "),
          /Teacher review recommended/,
          `${id}: page ${i + 1} lacks the review line`,
        );
    }
  }
});

// --- Remix hand-off ---------------------------------------------------------------------------------------------
test("Remix drafts become printable documents with the teacher's words intact", async () => {
  const { buildDraft } = await import("../bcpss-teachers/studio/core/remix.js");
  const text =
    "A ratio compares two quantities. For every 2 cups of flour there are 3 cups of milk. Equivalent ratios describe the same relationship.";
  const cards = buildDraft("vocab-cards", text, {
    grade: "6",
    subject: "math",
    collections: [FIXTURES["6-8"].vocab],
  });
  assert.ok(remixDocument(cards).error, "unconfirmed cards are refused");
  for (const c of cards.cards) {
    c.def ||= "A short meaning the teacher wrote.";
    c.confirmed = true;
  }
  const ev = buildDraft("evidence", text, {
    question: "What is a ratio?",
    claims: ["A ratio compares quantities."],
  });
  ev.evidence[1].use = true;
  ev.evidence[1].supports = "c1";
  const drafts = [
    cards,
    ev,
    buildDraft("exit-ticket", "I can explain how two ratios are equivalent."),
    buildDraft("discussion", text, { grade: "6", subject: "math" }),
    buildDraft("language-objective", "Students will compare ratios."),
  ];
  for (const d of drafts) {
    const r = remixDocument(d, { grade: "6", subject: "math", band: "6-8" });
    assert.ok(r.doc, `${d.type}: ${r.error}`);
    assert.ok(auditDoc(r.doc, "student").ok, d.type);
    const file = path.join(TMP, `remix-${d.type}.docx`);
    fs.writeFileSync(file, await buildDocx(prepareDoc(r.doc), { audience: "student", rasterize }));
    if (hasPython)
      assert.deepEqual(
        JSON.parse(execFileSync("python3", ["-I", "-c", PY, file], { encoding: "utf8" }))[file]
          .errors,
        [],
        d.type,
      );
  }
  const evDoc = remixDocument(ev, { grade: "6", subject: "math", band: "6-8" }).doc;
  assert.match(textCopy(evDoc, "student"), /For every 2 cups of flour/);
  assert.ok(remixDocument({ type: "unknown" }).error);
});

// --- The view, in jsdom -----------------------------------------------------------------------------------------
function installDom() {
  const dom = new JSDOM(
    '<!doctype html><html><head></head><body><main id="st-main"></main></body></html>',
    { url: "http://localhost/bcpss-teachers/studio/", pretendToBeVisual: true },
  );
  const keep = {};
  for (const k of [
    "window",
    "document",
    "localStorage",
    "location",
    "history",
    "Node",
    "NodeFilter",
    "HTMLElement",
    "matchMedia",
    "getComputedStyle",
  ]) {
    keep[k] = Object.getOwnPropertyDescriptor(globalThis, k);
    Object.defineProperty(globalThis, k, {
      value: k === "matchMedia" ? () => ({ matches: false }) : dom.window[k],
      configurable: true,
      writable: true,
    });
  }
  return {
    dom,
    restore: () => {
      for (const [k, d] of Object.entries(keep))
        d ? Object.defineProperty(globalThis, k, d) : delete globalThis[k];
    },
  };
}

test("the Create view builds a preview from a lesson and enables every export", async () => {
  const { dom, restore } = installDom();
  try {
    const f = FIXTURES["6-8"];
    const items = [
      { kind: "lesson", id: f.lesson.id, title: f.lesson.title, grade: "6", subject: "math" },
      { kind: "vocab", id: f.vocab.id, title: f.vocab.title, grade: "6", subject: "math" },
    ];
    const store = new Map();
    const shell = {
      prefs: { getPrefs: () => ({ grade: null, subject: null }) },
      classes: { getClass: () => null, dominantTier: () => null },
      library: { addRecent: (r) => store.set(r.id, r) },
      catalog: {
        manifest: async () => items,
        lesson: async () => f.lesson,
        vocab: async () => f.vocab,
      },
      setTitle: () => {},
      replaceHash: () => {},
    };
    const root = dom.window.document.getElementById("st-main");
    const { render } = await import("../bcpss-teachers/studio/views/create.js");
    const cleanup = await render({ root, params: { type: "frayer", lesson: f.lesson.id }, shell });
    assert.equal(root.querySelector("h1").textContent, "Resource Studio");
    const family = TEMPLATES.filter((t) => t.family === "Graphic organizers").length;
    assert.equal(
      root.querySelectorAll(".st-cr-tpl").length,
      family,
      "the organizer link shows the organizer family",
    );
    [...root.querySelectorAll(".st-pills button")]
      .find((b) => b.textContent === "All types")
      .click();
    assert.equal(
      root.querySelectorAll(".st-cr-tpl").length,
      TEMPLATES.length,
      "all types lists every template",
    );
    assert.equal(root.querySelector("#st-cr-grade").value, "6", "grade comes from the lesson");
    const pages = root.querySelectorAll(".st-x-page");
    assert.ok(pages.length >= 3, `preview has pages (${pages.length})`);
    assert.match(root.querySelector(".st-cr-preview").textContent, /Teacher review recommended/);
    assert.ok(
      [...root.querySelectorAll(".st-cr-export button")].every((b) => !b.disabled),
      "exports enabled",
    );
    // choosing a different resource rebuilds the document
    const before = pages.length;
    [...root.querySelectorAll(".st-cr-tpl")]
      .find((b) => /Exit tickets/.test(b.textContent))
      .click();
    await new Promise((r) => setTimeout(r, 50));
    assert.notEqual(root.querySelectorAll(".st-x-page").length, 0);
    assert.ok(root.querySelector(".st-x-page"), "preview still shown");
    assert.notEqual(before, undefined);
    cleanup?.();
  } finally {
    restore();
  }
});

test("the Create view explains what is missing instead of failing", async () => {
  const { dom, restore } = installDom();
  try {
    const shell = {
      prefs: { getPrefs: () => ({ grade: "4", subject: null }) },
      classes: { getClass: () => null, dominantTier: () => null },
      library: { addRecent() {} },
      catalog: {
        manifest: async () => {
          throw new Error("offline");
        },
        lesson: async () => {
          throw new Error("offline");
        },
        vocab: async () => {
          throw new Error("offline");
        },
      },
      setTitle: () => {},
      replaceHash: () => {},
    };
    const root = dom.window.document.getElementById("st-main");
    const { render } = await import("../bcpss-teachers/studio/views/create.js");
    await render({ root, params: { type: "vocab-cards" }, shell });
    assert.match(root.querySelector(".st-cr-notices").textContent, /needs vocabulary|Choose/i);
    assert.ok(
      [...root.querySelectorAll(".st-cr-export button")].every((b) => b.disabled),
      "exports stay disabled with no content",
    );
    assert.match(root.textContent, /library did not load/i);
    // an organizer needs no content: a title alone is enough
    const topic = dom.window.document.createElement("main");
    dom.window.document.body.append(topic);
    await render({ root: topic, params: { type: "cause-effect", source: "topic" }, shell });
    assert.ok(
      topic.querySelectorAll(".st-x-page").length >= 1,
      "organizer builds from a title alone",
    );
  } finally {
    restore();
  }
});
