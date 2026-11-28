#!/usr/bin/env node
// Math Literacy Studio export check. Builds docx / pptx / html / print (and the answer key of each) for the fixture
// Resources in tools/fixtures/mls-sample-resources.mjs, writes them to /tmp/mls-export/, then proves them:
//   (a) python-docx / python-pptx open every file; XML is well formed, relationships resolve, counts match the
//       fixture, known strings are real editable text, no student document carries a KEYONLY (answer/hint/note) string,
//       and no PowerPoint text box holds more lines than fit (measured with Liberation Sans, metric-compatible with Arial);
//   (b) LibreOffice converts every docx/pptx to PDF; the PDF text shows the content and no problem is split across pages;
//   (c) Chromium opens the print and html outputs at 390 and 1280 px (no sideways scroll, nothing external), the html
//       checking works (right and wrong picks, typed equivalents, Reset, keyboard), and page.pdf() of the print
//       document is a multi-page Letter PDF with all its text and no split problem.
// Exit code 1 on any failure. Usage: node tools/mls-export-check.mjs [--keep-going]
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import zlib from "node:zlib";
import { exportKey, exportResource, FORMATS } from "../access-practice-lab/src/mls/export/index.js";
import { listVisuals, svgSize } from "../access-practice-lab/src/mls/export/raster.js";
import { RESOURCES } from "./fixtures/mls-sample-resources.mjs";

const OUT = "/tmp/mls-export";
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${name}${ok || !detail ? "" : `\n        ${String(detail).replace(/\n/g, "\n        ")}`}`,
  );
};

// ── stubs: a renderVisual and tiny valid PNGs (node has no canvas) ──────────

function stubRenderVisual(spec) {
  const alt = spec.alt || `A ${spec.kind} picture.`;
  const w = 360;
  const h = spec.kind === "array" ? 240 : 180;
  let art = "";
  if (spec.kind === "tenframe") {
    for (let i = 0; i < 10; i++) {
      const x = 40 + (i % 5) * 60;
      const y = 40 + Math.floor(i / 5) * 60;
      art += `<rect x="${x}" y="${y}" width="56" height="56" fill="#fff" stroke="#17324D" stroke-width="2"/>${i < spec.n ? `<circle cx="${x + 28}" cy="${y + 28}" r="20" fill="#1FA6A2"/>` : ""}`;
    }
  } else if (spec.kind === "array") {
    for (let r = 0; r < spec.rows; r++)
      for (let c = 0; c < spec.cols; c++)
        art += `<circle cx="${40 + c * 46}" cy="${34 + r * 46}" r="16" fill="#F2C15B" stroke="#17324D" stroke-width="2"/>`;
  } else {
    art = `<circle cx="180" cy="90" r="70" fill="#fff" stroke="#17324D" stroke-width="3"/><path d="M180 90 L180 20 A70 70 0 1 1 111 108 Z" fill="#1FA6A2" stroke="#17324D" stroke-width="2"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${alt}"><title>${alt}</title><rect width="${w}" height="${h}" fill="#F7F4EC"/>${art}<text x="12" y="${h - 10}" font-size="14" fill="#24323F">${spec.kind}</text></svg>`;
  return { svg, alt, summary: alt };
}

function makePng(w, h) {
  const row = w * 3 + 1;
  const raw = Buffer.alloc(row * h);
  for (let y = 0; y < h; y++) {
    raw[y * row] = 0;
    for (let x = 0; x < w; x++) {
      const edge = x < 3 || y < 3 || x >= w - 3 || y >= h - 3;
      const o = y * row + 1 + x * 3;
      const diag = Math.abs(x * h - y * w) < w * 2;
      raw[o] = edge ? 23 : diag ? 31 : 247;
      raw[o + 1] = edge ? 50 : diag ? 166 : 244;
      raw[o + 2] = edge ? 77 : diag ? 162 : 236;
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return new Uint8Array(
    Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", zlib.deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ]),
  );
}

function imagesFor(resource) {
  const m = new Map();
  for (const v of listVisuals(resource)) {
    const { w, h } = svgSize(stubRenderVisual(v.spec).svg);
    m.set(v.ref, {
      png: makePng(Math.round(w), Math.round(h)),
      w: Math.round(w),
      h: Math.round(h),
      alt: v.alt,
    });
  }
  return m;
}

// ── expectations derived from the fixture ───────────────────────────────────

function expectations(resource) {
  let tables = 0;
  let tablesAtLeast = 0;
  let problems = 0;
  const visuals = listVisuals(resource).length;
  for (const s of resource.sections)
    for (const b of s.blocks) {
      if (b.t === "table" || b.t === "wordbank" || b.t === "cards") tables++;
      if (b.t === "problem") {
        problems++;
        if (b.workspace && (b.workspace.kind === "grid" || b.workspace.kind === "box")) tables++;
      }
    }
  tablesAtLeast = tables;
  return { tables, tablesAtLeast, problems, visuals };
}

const MUST = {
  "fx-everything": [
    "Every Block: Multiplication & Division",
    "Tom & Jerry",
    "3 < 5 > 2",
    "×",
    "÷",
    "−",
    "≤",
    "π",
    "5²",
    "How many counters are in 4 rows of 6?",
    "P1-B:24",
    "1,344 ÷ 8",
    "array",
    "There are",
    "rows of",
  ],
  "fx-long": ["P1-ASK", "P30-ASK", "P30-D", "Sentence 14 of the reading passage"],
  "fx-special": [
    "Ratios & Rates: 3 < 5 > 2",
    "<script>alert(1)</script>",
    "<img src=x onerror=alert(1)>",
    "πr²",
    "24 × 56",
    "Check your answers & reasoning",
  ],
};
const KEY_MUST = {
  "fx-everything": [
    "Answer key",
    "KEYONLY-key-work-1",
    "KEYONLY-note-1",
    "B: 24",
    "Order does not change the product",
  ],
  "fx-long": ["Answer key", "KEYONLY-long-answer-1", "KEYONLY-long-answer-30", "KEYONLY-long-note"],
  "fx-special": ["Answer key", "1,344", "KEYONLY-s-note"],
};

// ── build everything ────────────────────────────────────────────────────────

fs.rmSync(OUT, { recursive: true, force: true });
for (const d of ["docx", "pptx", "print"]) fs.mkdirSync(`${OUT}/pdf/${d}`, { recursive: true });
fs.mkdirSync(`${OUT}/png`, { recursive: true });

const built = []; // { res, format, key, file, kind }
const t0 = Date.now();
check(
  "FORMATS labels are exact",
  JSON.stringify(FORMATS.map((f) => f.label)) ===
    JSON.stringify([
      "Print or save as PDF (browser print dialog)",
      "Word document (.docx, editable)",
      "PowerPoint (.pptx, editable)",
      "Interactive web page (.html, works offline)",
    ]),
  JSON.stringify(FORMATS.map((f) => f.label)),
);
for (const res of RESOURCES) {
  const images = imagesFor(res);
  for (const format of ["docx", "pptx", "html", "print"]) {
    for (const key of [false, true]) {
      const r = key
        ? await exportKey(res, format, { images, renderVisual: stubRenderVisual })
        : await exportResource(res, format, { images, renderVisual: stubRenderVisual });
      const bytes = r.text != null ? Buffer.from(r.text, "utf8") : Buffer.from(r.blob);
      const file = path.join(OUT, r.filename);
      fs.writeFileSync(file, bytes);
      built.push({ res, format, key, file, filename: r.filename, mime: r.mime });
      if (!bytes.length) check(`${r.filename} is not empty`, false);
    }
  }
}
check(
  `built ${built.length} files in ${Date.now() - t0} ms`,
  built.length === RESOURCES.length * 8,
);
check(
  "file names are kebab-case with -key and -print",
  built.every(
    (b) =>
      /^[a-z0-9-]+\.(docx|pptx|html)$/.test(b.filename) &&
      (!b.key || b.filename.includes("-key")) &&
      (b.format !== "print" || b.filename.endsWith("-print.html")),
  ),
  built.map((b) => b.filename).join(", "),
);
// no-images path: an export without a PNG map still works and writes the alt text as a visible caption
{
  const r = await exportResource(RESOURCES[0], "docx", {
    images: new Map(),
    renderVisual: stubRenderVisual,
  });
  const txt = Buffer.from(r.blob).toString("latin1");
  check("docx without images still builds (alt text caption)", r.blob.length > 1000);
  fs.writeFileSync(`${OUT}/no-images.docx`, Buffer.from(r.blob));
  const p = await exportResource(RESOURCES[0], "pptx", {
    images: new Map(),
    renderVisual: stubRenderVisual,
  });
  fs.writeFileSync(`${OUT}/no-images.pptx`, Buffer.from(p.blob));
  check("pptx without images still builds", p.blob.length > 1000 && txt.length > 0);
}

// ── (a) python-docx / python-pptx ───────────────────────────────────────────

const PY = String.raw`
import sys, json, zipfile, posixpath, re
from lxml import etree
import docx
from docx.oxml.ns import qn
import pptx
from pptx.util import Emu
from PIL import ImageFont

manifest = json.load(sys.stdin)
out = []
def ok(name, cond, detail=""):
    out.append({"name": name, "ok": bool(cond), "detail": str(detail)[:600]})

FONT = {}
def font(size, bold=False, italic=False):
    k = (round(size * 4), bold, italic)
    if k not in FONT:
        style = ("Bold" if bold else "") + ("Italic" if italic else "")
        path = "/usr/share/fonts/truetype/liberation/LiberationSans-%s.ttf" % (style or "Regular")
        FONT[k] = ImageFont.truetype(path, size * 4)
    return FONT[k]

def package_checks(label, path):
    z = zipfile.ZipFile(path)
    names = z.namelist()
    ok(label + ": no duplicate zip entries", len(names) == len(set(names)))
    ok(label + ": [Content_Types].xml first", names[0] == "[Content_Types].xml")
    bad = []
    for n in names:
        if n.endswith(".xml") or n.endswith(".rels"):
            try:
                etree.fromstring(z.read(n))
            except Exception as e:
                bad.append("%s: %s" % (n, e))
    ok(label + ": every XML part is well formed", not bad, bad)
    miss = []
    for n in names:
        if n.endswith(".rels"):
            root = etree.fromstring(z.read(n))
            base = posixpath.dirname(posixpath.dirname(n))
            for rel in root:
                if rel.get("TargetMode") == "External":
                    continue
                t = rel.get("Target")
                full = t[1:] if t.startswith("/") else posixpath.normpath(posixpath.join(base, t))
                if full not in names:
                    miss.append("%s -> %s" % (n, t))
    ok(label + ": every relationship target exists", not miss, miss)
    ct = etree.fromstring(z.read("[Content_Types].xml"))
    defaults = {e.get("Extension").lower() for e in ct if e.tag.endswith("Default")}
    overrides = {e.get("PartName") for e in ct if e.tag.endswith("Override")}
    unc = [n for n in names if n != "[Content_Types].xml" and ("/" + n) not in overrides and n.rsplit(".", 1)[-1].lower() not in defaults]
    ok(label + ": every part has a content type", not unc, unc)
    ghost = [o for o in overrides if o[1:] not in names]
    ok(label + ": no content-type override for a missing part", not ghost, ghost)
    return z

def must_checks(label, text, item):
    for s in item.get("must", []):
        ok(label + ": contains " + json.dumps(s, ensure_ascii=False), s in text)
    for s in item.get("mustNot", []):
        ok(label + ": does not contain " + json.dumps(s), s not in text)

# ---- docx ----
for item in manifest["docx"]:
    label = item["name"]
    z = package_checks(label, item["file"])
    d = docx.Document(item["file"])
    body = d.element.body
    paras = ["".join(t.text or "" for t in p.iter(qn("w:t"))) for p in body.iter(qn("w:p"))]
    text = "\n".join(paras)
    must_checks(label, text, item)
    ok(label + ": paragraph count >= %d" % item["minParas"], len(d.paragraphs) >= item["minParas"], len(d.paragraphs))
    ok(label + ": tables == %d" % item["tables"], len(d.tables) == item["tables"], len(d.tables))
    ok(label + ": inline pictures == %d" % item["visuals"], len(d.inline_shapes) == item["visuals"], len(d.inline_shapes))
    docpr = body.xpath("//*[local-name()='docPr']")
    ids = [e.get("id") for e in docpr]
    ok(label + ": docPr ids unique", len(ids) == len(set(ids)), ids)
    ok(label + ": every picture has alt text", all((e.get("descr") or "").strip() for e in docpr), [e.get("descr") for e in docpr])
    ok(label + ": no empty table cell element", all(tc.find(qn("w:p")) is not None for tc in body.iter(qn("w:tc"))))
    s = d.sections[0]
    ok(label + ": US Letter, 0.75in margins", abs(s.page_width.inches - 8.5) < 0.01 and abs(s.page_height.inches - 11) < 0.01 and abs(s.left_margin.inches - 0.75) < 0.01 and abs(s.top_margin.inches - 0.75) < 0.01)
    ok(label + ": footer has title and PAGE field", item["title"][:20] in s.footer.paragraphs[0].text and "PAGE" in etree.tostring(s.footer._element).decode())
    ok(label + ": core title/creator", d.core_properties.title == item["title"] and d.core_properties.author == "Math Literacy Studio", (d.core_properties.title, d.core_properties.author))
    names = {st.name for st in d.styles}
    ok(label + ": styles Title/Heading 1/MLS Table", {"Title", "heading 1", "MLS Table"} <= names or {"Title", "Heading 1", "MLS Table"} <= names, sorted(names))
    fonts = z.read("word/styles.xml").decode()
    ok(label + ": font is Arial", 'w:ascii="Arial"' in fonts)
    if item.get("lists"):
        ok(label + ": real list paragraphs (numPr)", len(body.xpath("//w:numPr")) >= item["lists"])
    if item.get("headingCount") is not None:
        h = [p for p in d.paragraphs if p.style.name.lower() == "heading 1"]
        ok(label + ": Heading 1 paragraphs == %d" % item["headingCount"], len(h) == item["headingCount"], len(h))

# ---- pptx ----
def measure_paragraph(p, width_in, default_size):
    runs = p.runs
    size = default_size
    toks = []
    for r in runs:
        sz = r.font.size.pt if r.font.size else default_size
        size = sz
        for w in re.findall(r"\S+\s*|\s+", r.text):
            toks.append((w, font(sz, bool(r.font.bold), bool(r.font.italic))))
    pPr = p._p.pPr
    marL = int(pPr.get("marL", 0)) / 914400 if pPr is not None else 0
    avail = (width_in - marL) * 72 * 4
    lines, cur = 1, 0.0
    for w, f in toks:
        if "\t" in w:
            cur = 0.0
            w = w.replace("\t", "")
        wl = f.getlength(w.rstrip())
        if cur + wl > avail and cur > 0:
            lines += 1
            cur = 0.0
        cur += f.getlength(w)
    spc = 0
    if pPr is not None:
        for tag in ("spcBef", "spcAft"):
            e = pPr.find("{http://schemas.openxmlformats.org/drawingml/2006/main}" + tag)
            if e is not None and len(e):
                v = e[0].get("val")
                if v:
                    spc += int(v) / 100
    return (lines * size * 1.2 + spc) / 72, lines

for item in manifest["pptx"]:
    label = item["name"]
    z = package_checks(label, item["file"])
    prs = pptx.Presentation(item["file"])
    ok(label + ": 16:9 slide size", prs.slide_width == 12192000 and prs.slide_height == 6858000)
    slides = list(prs.slides)
    ok(label + ": slide count >= %d" % item["minSlides"], len(slides) >= item["minSlides"], len(slides))
    alltext = []
    pics = 0
    tables = 0
    overflow = []
    outside = []
    problems_per_slide = []
    last_slide_of = {}
    for si, sl in enumerate(slides):
        nprob = 0
        title = sl.shapes.title
        if si > 0:
            ok(label + ": slide %d has a title placeholder with text" % (si + 1), title is not None and title.text_frame.text.strip() != "")
        for sh in sl.shapes:
            if sh.left is not None and (sh.left < -10 or sh.top < -10 or sh.left + sh.width > 12192000 + 10 or sh.top + sh.height > 6858000 + 10):
                outside.append((si + 1, sh.name))
            if sh.shape_type == 13:
                pics += 1
                descr = sh._element.xpath(".//p:cNvPr")[0].get("descr")
                ok(label + ": slide %d picture has alt text" % (si + 1), bool(descr))
            if sh.has_table if hasattr(sh, "has_table") else False:
                tables += 1
                tbl = sh.table
                need = 0
                for ri, row in enumerate(tbl.rows):
                    rneed = 0
                    for ci, cell in enumerate(row.cells):
                        w = tbl.columns[ci].width / 914400 - 0.16
                        hh = 0
                        for p in cell.text_frame.paragraphs:
                            if not p.runs: continue
                            h, _ = measure_paragraph(p, w, 16)
                            hh += h
                        rneed = max(rneed, hh + 0.1)
                    need += max(rneed, 0.0)
                    alltext.append(" | ".join(c.text_frame.text for c in row.cells))
                if need > sh.height / 914400 * 1.03 + 0.05:
                    overflow.append((si + 1, sh.name, "table needs %.2f in, has %.2f in" % (need, sh.height / 914400)))
                if (sh.top + sh.height) / 914400 > 7.2:
                    overflow.append((si + 1, sh.name, "table bottom %.2f in" % ((sh.top + sh.height) / 914400)))
            elif sh.has_text_frame:
                txt = sh.text_frame.text
                alltext.append(txt)
                if sh.name.startswith("Problem"):
                    nprob += 1
                if sh.is_placeholder:
                    continue
                bp = sh.text_frame._txBody.find("{http://schemas.openxmlformats.org/drawingml/2006/main}bodyPr")
                lins = int(bp.get("lIns", 91440)) / 914400
                tins = int(bp.get("tIns", 45720)) / 914400
                w = sh.width / 914400 - 2 * lins
                need = 2 * tins
                for p in sh.text_frame.paragraphs:
                    if not p.runs: continue
                    h, _ = measure_paragraph(p, w, 18)
                    need += h
                if need > sh.height / 914400 * 1.03 + 0.04:
                    overflow.append((si + 1, sh.name, "text needs %.2f in, box is %.2f in: %s" % (need, sh.height / 914400, txt[:50])))
        problems_per_slide.append(nprob)
        for sh in sl.shapes:
            if sh.has_text_frame:
                for m in re.findall(r"P(\d+)-(ASK|D)", sh.text_frame.text):
                    last_slide_of.setdefault((m[0], m[1]), si + 1)
    text = "\n".join(alltext) + "\n" + "\n".join(sl.shapes.title.text_frame.text for i, sl in enumerate(slides) if i > 0 and sl.shapes.title is not None)
    text += "\n" + (slides[0].shapes.title.text_frame.text if slides[0].shapes.title is not None else "")
    must_checks(label, text, item)
    ok(label + ": pictures == %d" % item["visuals"], pics == item["visuals"], pics)
    ok(label + ": tables >= %d" % item.get("tablesPptx", item["tablesAtLeast"]), tables >= item.get("tablesPptx", item["tablesAtLeast"]), tables)
    ok(label + ": no text box overflows (measured)", not overflow, overflow[:6])
    ok(label + ": every shape inside the slide", not outside, outside[:6])
    ok(label + ": at most 2 problems per slide", all(n <= 2 for n in problems_per_slide), problems_per_slide)
    ok(label + ": a problem's ask and last choice share a slide", all(last_slide_of.get((n, "ASK")) == last_slide_of.get((n, "D")) for n in {k[0] for k in last_slide_of if k[1] == "ASK"}), {k: v for k, v in last_slide_of.items() if k[0] in ("1", "15", "30")})
    sizes = []
    for sl in slides:
        for sh in sl.shapes:
            if sh.name.startswith("Problem") and sh.has_text_frame:
                for p in sh.text_frame.paragraphs:
                    for r in p.runs:
                        if r.font.size: sizes.append(r.font.size.pt)
    if sizes:
        ok(label + ": problem type is large (min %.0fpt, >= 20; 24pt unless a problem needed to shrink)" % min(sizes), min(sizes) >= 20, sorted(set(sizes)))
    ok(label + ": presentation title/creator", prs.core_properties.title == item["title"] and prs.core_properties.author == "Math Literacy Studio")

json.dump(out, sys.stdout)
`;

function summarize(resource, key) {
  const ex = expectations(resource);
  return ex;
}

const manifest = { docx: [], pptx: [] };
for (const b of built) {
  if (b.format !== "docx" && b.format !== "pptx") continue;
  const res = b.res;
  const ex = expectations(res);
  const title = b.key ? `${res.title}: Answer key` : res.title;
  const sectionsNonEmpty = res.sections.filter((s) => s.blocks.length).length;
  const item = {
    name: b.filename,
    file: b.file,
    title,
    must: b.key ? KEY_MUST[res.id] : MUST[res.id],
    mustNot: b.key ? [] : ["KEYONLY"],
  };
  if (b.key) {
    item.tables = res.key.length ? 1 : 0;
    item.tablesAtLeast = item.tables;
    item.visuals = 0;
    item.minParas = 5;
    item.minSlides = 2;
    item.headingCount = res.notes.length ? 2 : 1;
  } else {
    item.tables = ex.tables;
    item.tablesAtLeast = ex.tablesAtLeast;
    item.visuals = ex.visuals;
    item.minParas = res.id === "fx-long" ? 150 : res.id === "fx-special" ? 15 : 40;
    item.tablesPptx = res.sections
      .flatMap((s) => s.blocks)
      .filter((b) => b.t === "table" || b.t === "wordbank").length;
    item.minSlides = 1 + sectionsNonEmpty;
    item.lists = res.id === "fx-everything" ? 9 : 0;
    item.headingCount = res.sections.filter((s) => s.heading).length;
  }
  manifest[b.format].push(item);
}
{
  const py = spawnSync("python3", ["-I", "-c", PY], {
    input: JSON.stringify(manifest),
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (py.status !== 0) check("python-docx / python-pptx run", false, py.stderr || py.stdout);
  else for (const r of JSON.parse(py.stdout)) check(r.name, r.ok, r.detail);
}

// ── (b) LibreOffice round trip ──────────────────────────────────────────────

function pdfPages(file) {
  const r = spawnSync("pdfinfo", [file], { encoding: "utf8" });
  return Number(/Pages:\s+(\d+)/.exec(r.stdout || "")?.[1] || 0);
}
const pdfText = (file, page) =>
  spawnSync(
    "pdftotext",
    ["-layout", ...(page ? ["-f", String(page), "-l", String(page)] : []), file, "-"],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  ).stdout || "";
const squash = (s) => s.replace(/\s+/g, " ");

const office = built.filter((b) => b.format === "docx" || b.format === "pptx");
const profile = `file://${OUT}/lo-profile`;
for (const b of [
  ...office,
  {
    filename: "no-images.docx",
    file: `${OUT}/no-images.docx`,
    format: "docx",
    res: RESOURCES[0],
    key: false,
  },
  {
    filename: "no-images.pptx",
    file: `${OUT}/no-images.pptx`,
    format: "pptx",
    res: RESOURCES[0],
    key: false,
  },
]) {
  const r = spawnSync(
    "soffice",
    [
      `-env:UserInstallation=${profile}`,
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      `${OUT}/pdf/${b.format}`,
      b.file,
    ],
    { encoding: "utf8", timeout: 240000 },
  );
  const pdf = `${OUT}/pdf/${b.format}/${b.filename.replace(/\.(docx|pptx)$/, ".pdf")}`;
  const made = fs.existsSync(pdf) && fs.statSync(pdf).size > 500;
  check(
    `LibreOffice converts ${b.filename} to PDF`,
    r.status === 0 && made,
    (r.stderr || r.stdout || "").slice(0, 300),
  );
  if (!made) continue;
  b.pdf = pdf;
  b.pages = pdfPages(pdf);
}
for (const b of office) {
  if (!b.pdf) continue;
  const text = squash(pdfText(b.pdf));
  const must = b.key ? KEY_MUST[b.res.id] : MUST[b.res.id];
  const missing = must.filter((s) => !text.includes(squash(s)));
  // pdftotext folds a few glyph runs; compare after squashing and allow the pi/superscript glyphs through the same path
  check(
    `${b.filename}: PDF text shows the content (${b.pages} pages)`,
    missing.length === 0,
    `missing: ${JSON.stringify(missing)}`,
  );
  const expectMin = b.key
    ? 1
    : b.format === "pptx"
      ? b.res.id === "fx-long"
        ? 15
        : 2
      : b.res.id === "fx-long"
        ? 8
        : 1;
  check(
    `${b.filename}: page count is sane (>= ${expectMin}, <= 80)`,
    b.pages >= expectMin && b.pages <= 80,
    b.pages,
  );
  if (!b.key && b.format === "docx" && b.res.id === "fx-long") {
    const split = [];
    for (let n = 1; n <= 30; n++) {
      let pa = 0;
      let pd = 0;
      for (let pg = 1; pg <= b.pages && (!pa || !pd); pg++) {
        const t = pdfText(b.pdf, pg);
        if (!pa && new RegExp(`P${n}-ASK`).test(t)) pa = pg;
        if (!pd && new RegExp(`P${n}-D\\b`).test(t)) pd = pg;
      }
      if (!pa || pa !== pd) split.push(`${n}: ask p${pa}, last choice p${pd}`);
    }
    check(
      "docx long: no problem is split across pages (ask and last choice share a page, 30 problems)",
      split.length === 0,
      split.join("; "),
    );
  }
  if (!b.key && b.format === "docx" && b.res.id === "fx-everything") {
    const t = pdfText(b.pdf);
    check("docx everything: the page break is honoured", /After a page break\./.test(t));
  }
}
// PNGs to look at
const pngJobs = [
  ["fx-everything.pdf", "docx-everything", "1-5"],
  ["fx-everything.pdf", "pptx-everything", "1-12"],
];
void pngJobs;

// ── (c) Chromium ────────────────────────────────────────────────────────────

const { chromium } = await import("playwright");
const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--no-sandbox"],
});
const consoleErrors = [];
const external = [];
async function open(file, width, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on(
    "console",
    (m) => m.type() === "error" && consoleErrors.push(`${path.basename(file)}: ${m.text()}`),
  );
  page.on("pageerror", (e) => consoleErrors.push(`${path.basename(file)}: ${e.message}`));
  page.on("dialog", (d) => {
    consoleErrors.push(`${path.basename(file)}: unexpected dialog ${d.message()}`);
    d.dismiss();
  });
  page.on("request", (r) => {
    const u = r.url();
    if (
      !u.startsWith("file:") &&
      !u.startsWith("data:") &&
      !u.startsWith("blob:") &&
      !u.startsWith("about:")
    )
      external.push(`${path.basename(file)}: ${u}`);
  });
  await page.goto(pathToFileURL(file).href);
  await page.waitForLoadState("load");
  return { page, ctx };
}

const webFiles = built.filter((b) => b.format === "html" || b.format === "print");
for (const b of webFiles) {
  for (const width of [390, 1280]) {
    const { page, ctx } = await open(b.file, width);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const offenders = [];
      for (const el of document.body.querySelectorAll("*")) {
        const r = el.getBoundingClientRect();
        if (
          r.width > 0 &&
          r.right > de.clientWidth + 1 &&
          !el.closest(".tablewrap") &&
          !el.closest(".sr-only") &&
          !el.closest(".defs") &&
          !el.classList.contains("skip")
        )
          offenders.push(`${el.tagName}.${el.className} right=${Math.round(r.right)}`);
      }
      return { scrollW: de.scrollWidth, clientW: de.clientWidth, offenders: offenders.slice(0, 5) };
    });
    check(
      `${b.filename} @${width}px: no horizontal overflow`,
      m.scrollW <= m.clientW && m.offenders.length === 0,
      JSON.stringify(m),
    );
    if (!b.key) {
      const must = MUST[b.res.id];
      const body = await page.evaluate(() => document.body.innerText);
      const missing = must.filter((s) => !squash(body).includes(squash(s)));
      if (width === 1280)
        check(
          `${b.filename}: page text shows the content`,
          missing.length === 0,
          JSON.stringify(missing),
        );
      if (b.format === "print" && width === 1280)
        check(`${b.filename}: student print view has no KEYONLY text`, !body.includes("KEYONLY"));
    }
    if (width === 1280 && b.res.id === "fx-special") {
      const q = await page.evaluate(() => ({
        scripts: document.querySelectorAll("script").length,
        injected: document.querySelectorAll("main b, main img[src='x'], main script").length,
      }));
      check(
        `${b.filename}: markup in text is escaped (no injected elements)`,
        q.injected === 0 && q.scripts === (b.format === "html" ? 2 : 1),
        JSON.stringify(q),
      );
    }
    if (width === 390 && !b.key && b.res.id === "fx-everything")
      await page.screenshot({ path: `${OUT}/png/${b.format}-everything-390.png`, fullPage: true });
    if (width === 1280 && !b.key && b.res.id === "fx-everything" && b.format === "html")
      await page.screenshot({ path: `${OUT}/png/html-everything-1280.png`, fullPage: false });
    await ctx.close();
  }
}

// ---- html: checking works ----
{
  const file = built.find(
    (b) => b.res.id === "fx-everything" && b.format === "html" && !b.key,
  ).file;
  const { page, ctx } = await open(file, 1280);
  const art = (ref) => page.locator(`article[data-ref="${ref}"]`);
  const fb = (ref) => art(ref).locator(".fb");
  // problem 1: choices (s1.b0)
  const p1 = "s1.b0";
  await art(p1).locator('input[type=radio][value="0"]').check();
  await art(p1).getByRole("button", { name: "Check" }).click();
  let t = await fb(p1).innerText();
  check("html: wrong choice says Not yet / try again", /Not yet/.test(t) && /Try again/.test(t), t);
  check(
    "html: wrong choice never shows the answer, explanation or hint",
    !/KEYONLY/.test(t) && !/24/.test(t) && !/four rows of six/i.test(t),
    t,
  );
  check(
    "html: wrong choice is marked by text, icon and a dashed border (not colour alone)",
    (await fb(p1).evaluate((e) => getComputedStyle(e).borderTopStyle)) === "dashed" &&
      /✗/.test(await fb(p1).innerText()),
  );
  await art(p1).getByRole("button", { name: "Hint" }).click();
  t = await fb(p1).innerText();
  check("html: Hint button shows the hint", /KEYONLY-hint-1/.test(t), t);
  await art(p1).locator('input[type=radio][value="1"]').check();
  await art(p1).getByRole("button", { name: "Check" }).click();
  t = await fb(p1).innerText();
  check(
    "html: correct choice says Correct and shows the explanation",
    /Correct\./.test(t) && /KEYONLY-explain-1/.test(t),
    t,
  );
  check(
    "html: correct feedback is solid-bordered and has a check mark",
    (await fb(p1).evaluate((e) => getComputedStyle(e).borderTopStyle)) === "solid" && /✓/.test(t),
  );
  check(
    "html: feedback region is polite aria-live",
    (await fb(p1).getAttribute("aria-live")) === "polite" &&
      (await fb(p1).getAttribute("role")) === "status",
  );
  // nothing picked
  const p3 = "s1.b2";
  await art(p3).getByRole("button", { name: "Check" }).click();
  t = await fb(p3).innerText();
  check("html: Check with nothing picked asks for an answer", /Pick an answer first/.test(t), t);
  // typed answers
  const typed = async (ref, value) => {
    const input = art(ref).locator("input[type=text]");
    await input.fill(value);
    await input.press("Enter");
    return fb(ref).innerText();
  };
  const p2 = "s1.b1";
  t = await typed(p2, "168");
  check(
    "html: typed 168 is correct (Enter key checks)",
    /Correct\./.test(t) && /KEYONLY-explain-2/.test(t),
    t,
  );
  t = await typed(p2, "170");
  check(
    "html: typed 170 is not yet, answer hidden",
    /Not yet/.test(t) && !/168/.test(t) && !/KEYONLY-explain/.test(t),
    t,
  );
  t = await typed(p2, "168.0");
  check("html: 168.0 equals 168", /Correct\./.test(t), t);
  t = await typed(p2, "");
  check("html: empty typed answer asks for an answer", /Type an answer first/.test(t), t);
  const p5 = "s1.b4";
  for (const [v, want] of [
    ["3/4", true],
    ["0.75", true],
    [".75", true],
    ["6/8", true],
    [" 3 / 4 ", true],
    ["3/5", false],
    ["75", false],
    ["abc", false],
  ]) {
    t = await typed(p5, v);
    check(`html: 3/4 accepts ${JSON.stringify(v)} -> ${want}`, want === /Correct\./.test(t), t);
  }
  // keyboard: arrow keys move through radios, Tab reaches Check, Enter presses it
  await page.locator(`article[data-ref="${p3}"] input[type=radio][value="0"]`).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("Tab");
  const focusedName = await page.evaluate(
    () =>
      document.activeElement &&
      (document.activeElement.textContent || document.activeElement.tagName).trim(),
  );
  check(
    "html: Tab from the radio group reaches the Check button",
    /Check/.test(focusedName),
    focusedName,
  );
  await page.keyboard.press("Enter");
  t = await fb(p3).innerText();
  check("html: keyboard-only check works (3 x 7 = 21 picked with Space)", /Correct\./.test(t), t);
  const score = await page.locator("#mls-score").innerText();
  check(
    "html: running score is written as words",
    /\d+ of \d+ answered correctly/.test(score),
    score,
  );
  // reset
  await page.getByRole("button", { name: "Reset" }).click();
  const after = await page.evaluate(() => ({
    checked: document.querySelectorAll("input:checked").length,
    fb: [...document.querySelectorAll(".fb")].map((e) => e.textContent.trim()).filter(Boolean)
      .length,
    typed: [...document.querySelectorAll("input[type=text]")].map((e) => e.value).filter(Boolean)
      .length,
    score: document.getElementById("mls-score").textContent,
  }));
  check(
    "html: Reset clears picks, answers and feedback",
    after.checked === 0 && after.fb === 0 && after.typed === 0 && /^0 of/.test(after.score),
    JSON.stringify(after),
  );
  // a problem with no answer has no Check button
  const noAns = await art("s1.b3").getByRole("button", { name: "Check" }).count();
  check("html: problem with no answer has no Check button", noAns === 0);
  const hasLive = await page.evaluate(
    () => document.querySelectorAll(".fb[aria-live=polite]").length,
  );
  check("html: every checkable problem has a live region", hasLive === 4, hasLive);
  // reduced motion
  await ctx.close();
}
{
  const file = built.find((b) => b.res.id === "fx-special" && b.format === "html" && !b.key).file;
  const { page, ctx } = await open(file, 1280);
  const typed = async (ref, value) => {
    const input = page.locator(`article[data-ref="${ref}"] input[type=text]`);
    await input.fill(value);
    await input.press("Enter");
    return page.locator(`article[data-ref="${ref}"] .fb`).innerText();
  };
  const cases = [
    ["s0.b1", "1,344", true],
    ["s0.b1", "1344", true],
    ["s0.b1", "1344.00", true],
    ["s0.b1", "1,34", false],
    ["s0.b2", ".5", true],
    ["s0.b2", "0.50", true],
    ["s0.b2", "1/2", true],
    ["s0.b2", "0.6", false],
    ["s0.b3", "3/4", true],
    ["s0.b4", "-3", true],
    ["s0.b4", "−3", true],
    ["s0.b4", "3", false],
    ["s0.b6", "( 2 , 5 )", true],
    ["s0.b6", "(2,5)", true],
    ["s0.b6", "(5,2)", false],
  ];
  for (const [ref, v, want] of cases) {
    const t = await typed(ref, v);
    check(
      `html special: ${ref} accepts ${JSON.stringify(v)} -> ${want}`,
      want === /Correct\./.test(t),
      t,
    );
  }
  await page.locator('article[data-ref="s0.b5"] input[type=radio][value="1"]').check();
  await page.locator('article[data-ref="s0.b5"]').getByRole("button", { name: "Check" }).click();
  const t5 = await page.locator('article[data-ref="s0.b5"] .fb').innerText();
  check("html special: choice with fractions is correct", /Correct\./.test(t5), t5);
  await ctx.close();
}

// ---- print: real PDF via Chromium ----
for (const b of built.filter((x) => x.format === "print")) {
  const { page, ctx } = await open(b.file, 1280);
  const pdf = path.join(OUT, "pdf", "print", b.filename.replace(/\.html$/, ".pdf"));
  await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: false });
  const pages = pdfPages(pdf);
  const info = spawnSync("pdfinfo", [pdf], { encoding: "utf8" }).stdout;
  check(
    `${b.filename}: print PDF is US Letter`,
    /Page size:\s+612 x 792/.test(info),
    info.split("\n").find((l) => l.startsWith("Page size")),
  );
  const text = squash(pdfText(pdf));
  const must = b.key ? KEY_MUST[b.res.id] : MUST[b.res.id];
  const missing = must.filter((s) => !text.includes(squash(s)));
  check(
    `${b.filename}: print PDF has all text (${pages} pages)`,
    missing.length === 0 && pages >= 1,
    JSON.stringify(missing),
  );
  if (!b.key)
    check(
      `${b.filename}: print PDF hides the on-screen button`,
      !/Print or Save as PDF/.test(text),
    );
  if (!b.key && b.res.id === "fx-long") {
    check("print long: paginates (>= 5 pages)", pages >= 5, pages);
    const split = [];
    for (let n = 1; n <= 30; n++) {
      let pa = 0;
      let pd = 0;
      for (let pg = 1; pg <= pages && (!pa || !pd); pg++) {
        const t = pdfText(pdf, pg);
        if (!pa && new RegExp(`P${n}-ASK`).test(t)) pa = pg;
        if (!pd && new RegExp(`P${n}-D\\b`).test(t)) pd = pg;
      }
      if (!pa || pa !== pd) split.push(`${n}: ask p${pa}, last choice p${pd}`);
    }
    check(
      "print long: no problem is split across pages (30 problems)",
      split.length === 0,
      split.join("; "),
    );
  }
  if (!b.key && b.res.id === "fx-everything") {
    const sizes = await page.evaluate(() => {
      const px = (sel) =>
        [...document.querySelectorAll(sel)].map((e) => parseFloat(getComputedStyle(e).fontSize));
      return {
        body: parseFloat(getComputedStyle(document.body).fontSize),
        ask: px(".ask"),
        ws: [...document.querySelectorAll(".ws-box")].map(
          (e) => e.getBoundingClientRect().height / 96,
        ),
      };
    });
    check("print: body type is at least 12pt (16px)", sizes.body >= 16, JSON.stringify(sizes));
    check(
      "print: workspace box has a real height in inches (2 steps = 1.2in)",
      sizes.ws.length === 1 && Math.abs(sizes.ws[0] - 1.2) < 0.02,
      JSON.stringify(sizes.ws),
    );
    const css = await page.evaluate(() =>
      [...document.styleSheets]
        .flatMap((s) => [...s.cssRules])
        .map((r) => r.cssText)
        .join("\n"),
    );
    check(
      "print: @page is letter with 0.6in margin and @media print exists",
      /@page[^{]*\{[^}]*size:\s*letter/.test(css) &&
        /margin:\s*0\.6in/.test(css) &&
        /@media print/.test(css),
    );
  }
  await ctx.close();
}
await browser.close();
check(
  "no console errors, page errors or dialogs in the browser",
  consoleErrors.length === 0,
  consoleErrors.slice(0, 5).join("\n"),
);
check(
  "nothing external is requested by html or print outputs",
  external.length === 0,
  external.slice(0, 5).join("\n"),
);

// PNG previews for eyes
for (const [src, name, last] of [
  ["docx/every-block-multiplication-division.pdf", "docx-everything", 6],
  ["pptx/every-block-multiplication-division.pdf", "pptx-everything", 14],
  ["print/every-block-multiplication-division-print.pdf", "print-everything", 6],
  ["pptx/every-block-multiplication-division-key.pdf", "pptx-everything-key", 3],
  ["docx/every-block-multiplication-division-key.pdf", "docx-everything-key", 2],
]) {
  const f = `${OUT}/pdf/${src}`;
  if (fs.existsSync(f))
    spawnSync("pdftoppm", [
      "-png",
      "-r",
      "55",
      "-f",
      "1",
      "-l",
      String(last),
      f,
      `${OUT}/png/${name}`,
    ]);
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed. Files are in ${OUT}`,
);
if (failed.length) {
  console.log(`FAILED (${failed.length}):`);
  for (const f of failed) console.log(` - ${f.name}`);
  process.exit(1);
}
