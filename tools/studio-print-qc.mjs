// Print QC: renders each template with real fixture data in headless Chromium and checks the page as a printer would.
// CLI:  node tools/studio-print-qc.mjs [--only=id,id] [--bands=k-2,3-5] [--matrix] [--shots=id,id]
// API:  qcTemplate(templateId, input, { browser }) -> { ok, issues, pages }   (the validator calls this)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { standaloneHtml } from "../bcpss-teachers/studio/print/html.js";
import { visibleSections } from "../bcpss-teachers/studio/print/ir.js";
import {
  buildDocument,
  TEMPLATES,
  templateById,
} from "../bcpss-teachers/studio/print/templates.js";
import { FIXTURES, fixtureInput, stubRenderVisual } from "./studio-print-fixtures.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 5206;
const SHOTS = process.env.QC_SHOTS_DIR || path.join(os.tmpdir(), "studio-print-shots");
const MIME = {
  ".css": "text/css",
  ".js": "text/javascript",
  ".woff2": "font/woff2",
  ".html": "text/html",
  ".svg": "image/svg+xml",
};
const FLOOR_PT = { "k-2": 14, "3-5": 12, "6-8": 12 };

/** Real renderVisual when core/visuals.js exists, otherwise the fixtures' stand-in. */
export async function loadRenderVisual() {
  try {
    const m = await import(
      pathToFileURL(path.join(ROOT, "bcpss-teachers/studio/core/visuals.js")).href
    );
    if (typeof m.renderVisual === "function") return { renderVisual: m.renderVisual, real: true };
  } catch {
    /* module not present yet */
  }
  return { renderVisual: stubRenderVisual, real: false };
}

export function startServer(port = PORT) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split("?")[0]);
    const candidates = [path.join(ROOT, url), path.join(ROOT, "public", url)];
    const file = candidates.find(
      (f) => f.startsWith(ROOT) && fs.existsSync(f) && fs.statSync(f).isFile(),
    );
    if (!file) {
      res.writeHead(404).end("not found");
      return;
    }
    res
      .writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream" })
      .end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}

export async function launch() {
  return chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
}

const PLACEHOLDER =
  /lorem|ipsum|\bTODO\b|\bTBD\b|placeholder|\bXXX\b|undefined|\bNaN\b|\[object|\{\{|\bnull\b/i;

// Runs inside the page. Returns plain issue objects.
function measure({ floors, band }) {
  const issues = [];
  const add = (check, msg) => issues.push({ check, msg });
  const exempt =
    ".st-x-chrome,.st-x-chrome-sm,.st-x-ctag,.st-x-cnum,.st-x-wlabel,.st-x-whint,.st-x-p--quiet,figcaption,.st-x-tier,.st-x-brand";
  const text = (el) => (el.textContent || "").replace(/\s+/g, " ").trim();
  for (const pg of document.querySelectorAll(".st-x-page")) {
    const n = pg.dataset.page;
    const pr = pg.getBoundingClientRect();
    const body = pg.querySelector(".st-x-body");
    const br = body.getBoundingClientRect();
    if (body.scrollHeight > body.clientHeight + 1)
      add(
        "overflow",
        `page ${n}: body content runs ${Math.round(body.scrollHeight - body.clientHeight)}px past the page`,
      );
    for (const b of body.querySelectorAll(":scope > .st-x-b")) {
      const r = b.getBoundingClientRect();
      if (r.bottom > br.bottom + 1.5)
        add(
          "overflow",
          `page ${n}: ${b.dataset.type} block ends ${Math.round(r.bottom - br.bottom)}px below the body box`,
        );
      if (r.right > pr.right - 0.5 || r.left < pr.left - 0.5)
        add("overflow", `page ${n}: ${b.dataset.type} block sticks out of the page sides`);
    }
    for (const el of pg.querySelectorAll(".st-x-card,.st-x-flap-in,.st-x-wbox,.st-x-flap-front")) {
      if (el.scrollHeight > el.clientHeight + 1.5 || el.scrollWidth > el.clientWidth + 1.5)
        add(
          "clipped",
          `page ${n}: ${el.className.split(" ")[0]} clips its content ("${text(el).slice(0, 40)}")`,
        );
    }
    const isTeacher = pg.dataset.kind === "key" || pg.dataset.kind === "notes";
    const floor = isTeacher ? 12 : floors[band];
    const walker = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    const small = new Map();
    while (node) {
      const el = node.parentElement;
      if (node.nodeValue.trim() && !el.closest("svg")) {
        const pt = parseFloat(getComputedStyle(el).fontSize) * 0.75;
        const min = el.closest(exempt) ? 8.4 : floor;
        if (pt < min - 0.05)
          small.set(
            `${el.className}|${pt.toFixed(1)}`,
            `${pt.toFixed(1)}pt (< ${min}) in .${String(el.className).split(" ")[0]} "${node.nodeValue.trim().slice(0, 30)}"`,
          );
      }
      node = walker.nextNode();
    }
    for (const m of small.values()) add("font-size", `page ${n}: ${m}`);
    for (const b of body.querySelectorAll(".st-x-b")) {
      const t = b.dataset.type;
      const hasVisual = b.querySelector("svg,img");
      if (["p", "h", "title", "list", "check", "bank", "frames"].includes(t) && !text(b))
        add("empty", `page ${n}: empty ${t} block`);
      if (t === "visual" && (!hasVisual || b.querySelector("[data-visual-failed]")))
        add("image", `page ${n}: visual block has no picture`);
      if (t === "cards")
        for (const c of b.querySelectorAll(".st-x-card"))
          if (!text(c) && !c.querySelector("svg,img,.st-x-line,.st-x-cdraw"))
            add("empty", `page ${n}: empty card`);
      if (
        t === "table" &&
        ![...b.querySelectorAll("td,th")].some((c) => text(c) || c.querySelector("svg"))
      )
        add("empty", `page ${n}: table with no content`);
    }
  }
  for (const img of document.images)
    if (!img.complete || img.naturalWidth === 0)
      add("image", `image failed to load: ${img.src.slice(0, 60)}`);
  for (const f of document.querySelectorAll("[data-visual-failed]"))
    add("image", "a visual failed to render");
  for (const s of document.querySelectorAll(".st-x-visual svg")) {
    const r = s.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) add("image", "a visual rendered with no size");
  }
  return issues;
}

const norm = (s) => String(s).replace(/\s+/g, " ").trim().toLowerCase();

function keyStrings(doc) {
  const out = [];
  for (const s of doc.sections.filter((x) => x.kind === "key"))
    for (const pg of s.pages)
      for (const b of pg.blocks)
        if (b.type === "table")
          for (const row of b.rows)
            for (const c of row.slice(1)) if (norm(c.t).length >= 14) out.push(norm(c.t));
  return out;
}

async function renderPage(browser, doc, audience, renderVisual) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1200 } });
  const page = await ctx.newPage();
  const html = standaloneHtml(doc, {
    audience,
    renderVisual,
    base: `http://127.0.0.1:${PORT}/`,
    cssHrefs: ["/access-practice-lab/ds.css", "/bcpss-teachers/studio/print/print.css"],
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  return { page, ctx };
}

/**
 * QC one template with the given buildDocument input. Returns { ok, issues, pages }.
 * `opts.browser` reuses a browser; otherwise one is launched and closed. `opts.shots` saves page PNGs.
 */
export async function qcTemplate(templateId, input, opts = {}) {
  const own = !opts.browser;
  const browser = opts.browser || (await launch());
  const server = opts.server || (await startServer());
  const issues = [];
  let pages = 0;
  try {
    const { renderVisual } = opts.renderVisual
      ? { renderVisual: opts.renderVisual }
      : await loadRenderVisual();
    const tpl = templateById(templateId);
    const doc = buildDocument(templateId, input);
    const band = doc.meta.band;
    const teacherPages = visibleSections(doc, "teacher").reduce((a, s) => a + s.pages.length, 0);
    const studentPages = visibleSections(doc, "student").reduce((a, s) => a + s.pages.length, 0);
    pages = teacherPages;
    if (teacherPages < 1 || teacherPages > 30)
      issues.push({ check: "pages", msg: `page count ${teacherPages} is not sane` });
    if (tpl.keyed && !doc.sections.some((s) => s.kind === "key"))
      issues.push({ check: "key", msg: "keyed template produced no answer key" });
    const kinds = doc.sections.map((s) => s.kind);
    if (kinds.includes("key") && kinds.indexOf("key") < kinds.indexOf("student"))
      issues.push({ check: "key", msg: "answer key comes before the student pages" });

    // Teacher copy: every page, PDF page count, geometry checks.
    const t = await renderPage(browser, doc, "teacher", renderVisual);
    for (const i of await t.page.evaluate(measure, { floors: FLOOR_PT, band })) issues.push(i);
    const text = await t.page.evaluate(() => document.body.innerText);
    if (PLACEHOLDER.test(text))
      issues.push({
        check: "placeholder",
        msg: `placeholder text found: ${text.match(PLACEHOLDER)[0]}`,
      });
    const pdf = await t.page.pdf({ preferCSSPageSize: true, printBackground: true });
    const tmp = path.join(os.tmpdir(), `qc-${process.pid}-${templateId}.pdf`);
    fs.writeFileSync(tmp, pdf);
    try {
      const info = execFileSync("pdfinfo", [tmp], { encoding: "utf8" });
      const n = Number(info.match(/Pages:\s+(\d+)/)?.[1]);
      if (n !== teacherPages)
        issues.push({
          check: "pdf-pages",
          msg: `PDF has ${n} pages but the resource has ${teacherPages}`,
        });
    } catch {
      const n = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
      if (n !== teacherPages)
        issues.push({
          check: "pdf-pages",
          msg: `PDF has ${n} pages but the resource has ${teacherPages}`,
        });
    } finally {
      fs.rmSync(tmp, { force: true });
    }
    if (opts.shots) {
      fs.mkdirSync(SHOTS, { recursive: true });
      const els = await t.page.$$(".st-x-page");
      for (let i = 0; i < els.length; i++)
        await els[i].screenshot({
          path: path.join(SHOTS, `${templateId}-${band}-${opts.tag || "base"}-${i + 1}.png`),
        });
    }
    await t.ctx.close();

    // Student copy: no key/notes pages, and no key strings leaked into student pages.
    const s = await renderPage(browser, doc, "student", renderVisual);
    const studentKinds = await s.page.$$eval(".st-x-page", (els) => els.map((e) => e.dataset.kind));
    if (studentKinds.length !== studentPages)
      issues.push({ check: "key", msg: "student copy page count differs from the model" });
    if (studentKinds.some((k) => k === "key" || k === "notes"))
      issues.push({ check: "key", msg: "student copy contains key or notes pages" });
    const stext = norm(await s.page.evaluate(() => document.body.innerText));
    for (const k of keyStrings(doc))
      if (stext.includes(k))
        issues.push({
          check: "key",
          msg: `answer text leaked into the student copy: "${k.slice(0, 50)}"`,
        });
    await s.ctx.close();
  } finally {
    if (own) {
      await browser.close();
      server.close();
    }
  }
  return { ok: issues.length === 0, issues, pages };
}

function parseArgs(argv) {
  const get = (k) =>
    argv
      .find((a) => a.startsWith(`--${k}=`))
      ?.split("=")[1]
      ?.split(",");
  return {
    only: get("only"),
    bands: get("bands") || ["k-2", "3-5", "6-8"],
    shots: get("shots"),
    matrix: argv.includes("--matrix"),
  };
}

const FORMATS = [
  { size: "letter", orientation: "portrait" },
  { size: "letter", orientation: "landscape" },
  { size: "a4", orientation: "portrait" },
];

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const { real } = await loadRenderVisual();
  console.log(
    `visuals: ${real ? "core/visuals.js" : "fixture stand-in (core/visuals.js not present)"}`,
  );
  const server = await startServer();
  const browser = await launch();
  let failures = 0;
  let runs = 0;
  try {
    for (const tpl of TEMPLATES) {
      if (args.only && !args.only.includes(tpl.id)) continue;
      for (const band of args.bands) {
        if (!tpl.bands.includes(band)) continue;
        const variants = args.matrix
          ? FORMATS.flatMap((format) => [
              {
                tag: `${format.size}-${format.orientation}`,
                input: fixtureInput(band, { format }),
              },
              {
                tag: `${format.size}-${format.orientation}-multi`,
                input: fixtureInput(band, {
                  format,
                  tiers: ["ee", "br"],
                  visual: "none",
                  lang: "bilingual",
                }),
              },
            ])
          : FORMATS.slice(0, 2).map((format) => ({
              tag: `${format.size}-${format.orientation}`,
              input: fixtureInput(band, { format }),
            }));
        for (const v of variants) {
          runs++;
          const shots = args.shots?.includes(tpl.id) || args.shots?.includes("all");
          let r;
          try {
            r = await qcTemplate(tpl.id, v.input, { browser, server, shots, tag: v.tag });
          } catch (err) {
            r = { ok: false, issues: [{ check: "build", msg: err.message }] };
          }
          if (!r.ok) {
            failures++;
            console.log(`FAIL ${tpl.id} [${band}] ${v.tag}`);
            const seen = new Set();
            for (const i of r.issues) {
              const line = `   ${i.check}: ${i.msg}`;
              if (!seen.has(line) && seen.size < 6) console.log(line);
              seen.add(line);
            }
          }
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  console.log(`${runs} runs, ${failures} failing`);
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((f) => process.exit(f ? 1 : 0));
}
