#!/usr/bin/env node
// Print check for the class packets and print kits. Renders every part (student paper x3 bands, answer key, cover sheet and the
// four kits) for a sample of units that spans every grade and subject, in a real Chromium, and measures what a printer would show:
//   OVERFLOW   text clipped by its own box (a card, a write-on line) or drawn past the page's side margins
//   MARGIN     content closer than 0.5in to a page edge (measured on the rasterised PDF: left, right, top; the bottom margin and every
//              @page margin are read from the stylesheet, because the running footer legitimately lives in the bottom margin)
//   CONTRAST   text whose contrast, after converting both colours to gray, falls under WCAG AA (4.5, or 3 for large text)
//   TINY       text under 6pt
//   PAGES      more pages than the part's limit, or the three papers of a unit disagreeing on page count
//   BREAK      any page-break construct in the HTML
// Real-content findings are compared with docs/packets/print-check-baseline.json (counts may only go down).
// Each detector first runs on a known-bad fixture it MUST flag, and a known-good fixture it MUST pass; if a control stops firing the
// tool exits 3. Exit 0 = no new findings, 1 = new findings, 3 = the tool itself is broken (no browser, no rasteriser, control failed).
// Usage: node tools/packet-print-check.mjs [--units id,id] [--out <dir>] [--json <file>] [--update-baseline]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import {
  buildPart,
  loadPacketSource,
  PACKET_UNIT_IDS,
} from "../functions/_lib/bcpss/packet-parts.js";
import { renderPacketHtml } from "../functions/_lib/bcpss/packet-render.js";
import { BANDS } from "../shared/packets/bands.js";
import { PAGE_BREAK_HTML } from "./packet-test-kit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE = path.join(ROOT, "docs/packets/print-check-baseline.json");
const DPI = 96;
const MIN_MARGIN_IN = 0.5;
const TOL_IN = 0.03;
const MIN_PT = 6;
const PAGE_LIMIT = {
  student: 2,
  key: 3,
  cover: 1,
  "kit-cards": 3,
  "kit-frames": 2,
  "kit-exit": 1,
  "kit-family": 2,
};

const args = process.argv.slice(2);
const opt = (name) => {
  const k = args.indexOf(`--${name}`);
  return k >= 0 ? args[k + 1] : null;
};
const outDir = opt("out");

// ---- DOM measurement, run inside the page ------------------------------------------------------------------
const MEASURE = `(() => {
  const PX_PER_IN = ${DPI};
  const norm = (c) => { const x = document.createElement("canvas").getContext("2d"); x.fillStyle = "#fff"; x.fillStyle = c; x.fillRect(0,0,1,1); const d = x.getImageData(0,0,1,1).data; return [d[0], d[1], d[2], d[3] / 255]; };
  const gray = ([r, g, b]) => Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  const contrast = (a, b) => { const la = lin(a), lb = lin(b); const [hi, lo] = la > lb ? [la, lb] : [lb, la]; return (hi + 0.05) / (lo + 0.05); };
  const bgOf = (el) => { for (let e = el; e; e = e.parentElement) { const c = norm(getComputedStyle(e).backgroundColor); if (c[3] >= 0.9) return c; } return [255,255,255,1]; };
  const findings = [];
  const add = (code, el, detail) => findings.push({ code, where: (typeof el.className === "string" && el.className.slice(0,40)) || el.tagName.toLowerCase(), text: (el.textContent || "").trim().slice(0,50), detail });
  const left = 0.55 * PX_PER_IN, right = innerWidth - 0.55 * PX_PER_IN;
  let minContrast = 99, minPt = 99;
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("svg")) continue; // icon drawings: their text is drawing units, not reading text
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (cs.overflow !== "visible" && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) add("OVERFLOW", el, "clipped " + (el.scrollWidth - el.clientWidth) + "x" + (el.scrollHeight - el.clientHeight) + "px");
    if (r.right > right + 1.5 || r.left < left - 1.5) add("OVERFLOW", el, "outside the page margins by " + Math.round(Math.max(r.right - right, left - r.left)) + "px");
    const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) continue;
    const pt = parseFloat(cs.fontSize) * 0.75;
    minPt = Math.min(minPt, pt);
    if (pt < ${MIN_PT}) add("TINY", el, pt.toFixed(1) + "pt");
    const fg = norm(cs.color), bg = bgOf(el);
    const c = contrast(gray(fg), gray(bg));
    const large = pt >= 18 || (pt >= 14 && Number(cs.fontWeight) >= 700);
    minContrast = Math.min(minContrast, c);
    if (c < (large ? 3 : 4.5)) add("CONTRAST", el, "gray contrast " + c.toFixed(2));
  }
  const pageMargins = [...document.querySelectorAll("style")].flatMap((s) => [...s.textContent.matchAll(/@page\\s*\\{[^{}]*?margin:([^;{}]+)/g)].map((m) => m[1].trim()));
  return { findings, minContrast, minPt, pageMargins };
})()`;

const toIn = (v) =>
  v.endsWith("in")
    ? parseFloat(v)
    : v.endsWith("pt")
      ? parseFloat(v) / 72
      : v.endsWith("px")
        ? parseFloat(v) / 96
        : v === "0"
          ? 0
          : NaN;

// ---- raster margins ------------------------------------------------------------------------------------------
function rasterMargins(pdfFile, tmp) {
  const stem = path.join(tmp, "pg");
  execFileSync("pdftoppm", ["-r", "50", "-gray", pdfFile, stem], { stdio: "ignore" });
  const files = fs
    .readdirSync(tmp)
    .filter((f) => f.startsWith("pg") && f.endsWith(".pgm"))
    .sort();
  let min = { left: 99, right: 99, top: 99 };
  for (const f of files) {
    const buf = fs.readFileSync(path.join(tmp, f));
    const m = /^P5\s+(\d+)\s+(\d+)\s+255\s/.exec(buf.subarray(0, 32).toString("latin1"));
    if (!m) throw new Error("unexpected raster format");
    const [w, h] = [Number(m[1]), Number(m[2])];
    const px = buf.subarray(buf.length - w * h);
    let x0 = w,
      x1 = -1,
      y0 = h;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (px[y * w + x] < 235) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
        }
    if (x1 < 0) continue;
    min = {
      left: Math.min(min.left, x0 / 50),
      right: Math.min(min.right, (w - 1 - x1) / 50),
      top: Math.min(min.top, y0 / 50),
    };
  }
  for (const f of files) fs.rmSync(path.join(tmp, f));
  return { pages: files.length, margins: min };
}

const pdfPages = (buf) => (buf.toString("latin1").match(/\/Type\s*\/Page(?![s\w])/g) || []).length;

async function inspect(page, html, label, tmp) {
  await page.setViewportSize({ width: 816, height: 1056 });
  await page.emulateMedia({ media: "print" });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => {
    document.body.style.padding = "0 0.55in";
    document.body.style.margin = "0";
  });
  const m = await page.evaluate(MEASURE);
  const pdf = await page.pdf({ format: "letter", printBackground: true, preferCSSPageSize: true });
  const file = path.join(tmp, "doc.pdf");
  fs.writeFileSync(file, pdf);
  if (outDir) fs.writeFileSync(path.join(outDir, `${label}.pdf`), pdf);
  const raster = rasterMargins(file, tmp);
  const findings = [...m.findings];
  for (const [side, v] of Object.entries(raster.margins))
    if (v < MIN_MARGIN_IN - TOL_IN)
      findings.push({ code: "MARGIN", where: side, text: "", detail: `${v.toFixed(2)}in` });
  const declared = m.pageMargins.flatMap((s) => s.split(/\s+/).map(toIn));
  if (!declared.length || declared.some((v) => !(v >= MIN_MARGIN_IN)))
    findings.push({
      code: "MARGIN",
      where: "@page",
      text: "",
      detail: `declared ${m.pageMargins.join(" | ") || "none"}`,
    });
  if (PAGE_BREAK_HTML.test(html))
    findings.push({ code: "BREAK", where: "html", text: "", detail: "page-break construct" });
  return {
    findings,
    pages: pdfPages(pdf),
    margins: raster.margins,
    minContrast: m.minContrast,
    minPt: m.minPt,
  };
}

// ---- controls ------------------------------------------------------------------------------------------------------
const shell = (body, css = "") =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:letter;margin:.5in .55in .6in}body{font:11pt Arial;color:#1f2937}${css}</style></head><body>${body}</body></html>`;
const CONTROLS = [
  {
    name: "overflow",
    expect: "OVERFLOW",
    html: shell(
      '<div style="width:80px;height:20px;overflow:hidden;white-space:nowrap">a long unbroken line that cannot fit the box</div>',
    ),
  },
  {
    name: "outside side margin",
    expect: "OVERFLOW",
    html: shell('<div style="position:absolute;left:0;top:50px">flush left</div>'),
  },
  {
    name: "margin (raster)",
    expect: "MARGIN",
    html: shell("<p>edge</p>", "@page{margin:.2in}"),
    rasterOnly: true,
  },
  { name: "small @page margin", expect: "MARGIN", html: shell("<p>x</p>", "@page{margin:.2in}") },
  {
    name: "low contrast",
    expect: "CONTRAST",
    html: shell('<p style="color:#c4c4c4">pale gray text</p>'),
  },
  {
    name: "gray-equal colours",
    expect: "CONTRAST",
    html: shell('<p style="color:#d94f4f;background:#4fd96b">hue only</p>'),
  },
  { name: "tiny text", expect: "TINY", html: shell('<p style="font-size:4pt">tiny</p>') },
  {
    name: "page break",
    expect: "BREAK",
    html: shell('<p>a</p><div style="page-break-before:always">b</div>'),
  },
];
const GOOD = shell("<h1>Fine</h1><p>Plain, dark, inside the margins.</p>");

// ---- run -----------------------------------------------------------------------------------------------------------
function sampleUnits() {
  const named = opt("units");
  if (named) {
    const ids = named.split(",");
    const bad = ids.filter((id) => !PACKET_UNIT_IDS.includes(id));
    if (bad.length) throw new Error(`unknown unit id(s): ${bad.join(", ")}`);
    return ids;
  }
  const first = new Map();
  for (const u of BCPSS_UNITS) {
    const key = `${u.grade}|${u.subject}`;
    if (!first.has(key) || u.unit_number < first.get(key).unit_number) first.set(key, u);
  }
  return [...first.values()].map((u) => u.id).filter((id) => PACKET_UNIT_IDS.includes(id));
}

const tally = (rows) => rows.reduce((o, f) => ((o[f.code] = (o[f.code] || 0) + 1), o), {});

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
    execFileSync("pdftoppm", ["-v"], { stdio: "ignore" });
  } catch (err) {
    console.error(
      `packet-print-check: cannot start (needs Playwright Chromium and poppler pdftoppm): ${err.message}`,
    );
    return 3;
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "packet-print-"));
  if (outDir) fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    for (const c of CONTROLS) {
      const r = await inspect(page, c.html, `control-${c.name.replace(/\W+/g, "-")}`, tmp);
      if (!r.findings.some((f) => f.code === c.expect)) {
        console.error(
          `packet-print-check: negative control "${c.name}" was NOT flagged as ${c.expect}; the gate is broken.`,
        );
        return 3;
      }
    }
    const good = await inspect(page, GOOD, "control-good", tmp);
    if (good.findings.length) {
      console.error(
        `packet-print-check: the known-good fixture was flagged: ${JSON.stringify(good.findings)}`,
      );
      return 3;
    }
    console.log(
      `controls: ${CONTROLS.length} known-bad fixtures flagged, known-good fixture clean`,
    );

    const units = sampleUnits();
    const results = [];
    for (const id of units) {
      const src = await loadPacketSource(id);
      const jobs = [
        ...BANDS.map((band) => ["student", { band }]),
        ["key", {}],
        ["cover", { counts: "1_2:8,3_4:12,5_6:5" }],
        ["kit-cards", {}],
        ["kit-frames", {}],
        ["kit-exit", {}],
        ["kit-family", {}],
      ];
      const studentPages = [];
      for (const [part, o] of jobs) {
        const { doc } = buildPart(src, part, o);
        const label = `${id}-${part}${o.band ? `-${o.band}` : ""}`;
        const r = await inspect(page, renderPacketHtml(doc), label, tmp);
        const row = { unit: id, part, band: o.band || null, ...r };
        if (r.pages > PAGE_LIMIT[part])
          row.findings.push({
            code: "PAGES",
            where: part,
            text: "",
            detail: `${r.pages} pages, limit ${PAGE_LIMIT[part]}`,
          });
        if (part === "student") studentPages.push(r.pages);
        results.push(row);
      }
      if (new Set(studentPages).size > 1)
        results.push({
          unit: id,
          part: "student",
          band: null,
          pages: 0,
          findings: [
            {
              code: "PAGES",
              where: "student",
              text: "",
              detail: `papers differ in page count: ${studentPages}`,
            },
          ],
        });
    }

    const all = results.flatMap((r) =>
      r.findings.map((f) => ({ unit: r.unit, part: r.part, band: r.band, ...f })),
    );
    const counts = tally(all);
    const pagesByPart = {};
    for (const r of results) if (r.pages) (pagesByPart[r.part] ||= []).push(r.pages);
    const summary = {
      units: units.length,
      grades: new Set(units.map((u) => BCPSS_UNITS.find((x) => x.id === u).grade)).size,
      subjects: new Set(units.map((u) => BCPSS_UNITS.find((x) => x.id === u).subject)).size,
      documents: results.filter((r) => r.pages).length,
      pages: results.reduce((n, r) => n + r.pages, 0),
      maxPagesByPart: Object.fromEntries(
        Object.entries(pagesByPart).map(([k, v]) => [k, Math.max(...v)]),
      ),
      minMarginIn: Object.fromEntries(
        ["left", "right", "top"].map((s) => [
          s,
          Number(Math.min(...results.filter((r) => r.margins).map((r) => r.margins[s])).toFixed(2)),
        ]),
      ),
      minGrayContrast: Number(
        Math.min(...results.filter((r) => r.pages).map((r) => r.minContrast)).toFixed(2),
      ),
      minFontPt: Number(Math.min(...results.filter((r) => r.pages).map((r) => r.minPt)).toFixed(1)),
      findings: counts,
    };
    console.log(JSON.stringify(summary, null, 2));
    if (opt("json"))
      fs.writeFileSync(opt("json"), JSON.stringify({ summary, findings: all }, null, 2));

    if (args.includes("--update-baseline")) {
      fs.writeFileSync(
        BASELINE,
        `${JSON.stringify({ note: "Counts of real-content print findings; they may only go down.", counts }, null, 2)}\n`,
      );
      console.log(`baseline written: ${JSON.stringify(counts)}`);
      return 0;
    }
    const base = fs.existsSync(BASELINE)
      ? JSON.parse(fs.readFileSync(BASELINE, "utf8")).counts
      : {};
    const worse = Object.keys({ ...counts, ...base }).filter(
      (k) => (counts[k] || 0) > (base[k] || 0),
    );
    for (const f of all.slice(0, 25))
      console.log(
        `  ${f.code} ${f.unit} ${f.part}${f.band ? `/${f.band}` : ""} ${f.where} "${f.text}" ${f.detail}`,
      );
    if (worse.length) {
      console.error(
        `packet-print-check: NEW findings vs baseline: ${worse.map((k) => `${k} ${counts[k] || 0} > ${base[k] || 0}`).join(", ")}`,
      );
      return 1;
    }
    console.log("packet-print-check: pass");
    return 0;
  } finally {
    await browser.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(`packet-print-check: error: ${err.stack || err}`);
    process.exit(3);
  },
);
