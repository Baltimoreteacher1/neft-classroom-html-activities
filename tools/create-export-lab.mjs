#!/usr/bin/env node
/**
 * Create (Project Studio) · export verification lab. Builds representative resources the way the Create panel does
 * (adapter -> buildResource / packetActivity), then verifies the files a teacher gets:
 *   PDF  the printed page rendered by Chromium (the browser's "Save as PDF" path): Letter size, page count within a
 *        budget, every font embedded, real selectable text, no blank page, student copy without the key, key separate
 *   DOCX the real /api/studio/docx builder: a valid package, editable paragraphs (and tables where the source has them),
 *        Letter page setup, then opened by LibreOffice and converted to PDF (a second word processor reading it)
 * Writes the files and first-page PNGs to $SHOTS_DIR (default reports/create-export) for visual inspection.
 * Needs Chromium and poppler; LibreOffice is optional (reported as SKIP when missing). Exit 1 on any failure.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchJson } from "./studio-customize-adapters-helpers.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = process.env.SHOTS_DIR || join(ROOT, "reports/create-export");
mkdirSync(OUT, { recursive: true });
const LAB = `${ROOT}access-practice-lab/src`;
const { customizeFrom } = await import(`${LAB}/studio/adapters/registry.js`);
const B = await import(`${LAB}/create/build.js`);
const { renderWorksheetParts } = await import(`${LAB}/studio/print/worksheet.js`);
const { questionsOf } = await import(`${LAB}/studio/core/schema.js`);
const { buildDocx } = await import(`${ROOT}functions/_lib/studio/docx.js`);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("create-export-lab: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const get = async (family, ref, extra = {}) =>
  (await customizeFrom(family, ref, { fetchJson, ...extra })).activity;
const rr = (await fetchJson("/access-practice-lab/content/reading-room/lessons.json")).lessons;
const longest = [...rr].sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0].id;

const cases = [
  {
    id: "vocab-worksheet",
    build: async () =>
      B.buildResource(await get("vocab-academy", "g3-u02"), { format: "worksheet" }).activity,
  },
  {
    id: "reading-support",
    build: async () =>
      B.buildResource(await get("reading-room", longest), {
        format: "worksheet",
        adjust: { support: "more" },
      }).activity,
  },
  {
    id: "access-exit-ticket",
    build: async () =>
      B.buildResource(
        await get("access-bank", "b35-read-01").catch(() => get("access-bank", "b35-listen-01")),
        { format: "check" },
      ).activity,
  },
  {
    id: "bcpss-math-fractions",
    build: async () =>
      B.buildResource(await get("bcpss-unit", "g6-math-u3", { band: "1_2" }), {
        format: "worksheet",
      }).activity,
  },
  {
    id: "most-practice",
    build: async () =>
      B.buildResource(await get("vocab-academy", "g8-u05"), {
        format: "worksheet",
        adjust: { amount: "more", challenge: "more", support: "more" },
      }).activity,
  },
  {
    id: "packet-4-parts",
    maxPages: 16,
    build: async () =>
      B.packetActivity(
        [
          {
            title: "Vocabulary",
            activity: B.buildResource(await get("vocab-academy", "g6-u01"), { format: "vocab" })
              .activity,
          },
          {
            title: "Reading",
            activity: B.buildResource(await get("reading-room", rr[0].id), { format: "worksheet" })
              .activity,
          },
          {
            title: "Math",
            activity: B.buildResource(await get("bcpss-unit", "g6-math-u2"), {
              format: "worksheet",
            }).activity,
          },
          {
            title: "Exit ticket",
            activity: B.buildResource(await get("vocab-academy", "g6-u01"), { format: "check" })
              .activity,
          },
        ],
        { title: "Grade 6 unit packet" },
      ).activity,
  },
];

const sh = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 << 20 });
const failures = [];
const rows = [];
const fail = (c, msg) => failures.push(`${c}: ${msg}`);
const hasSoffice = (() => {
  try {
    sh("soffice", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

const browser = await chromium.launch();
const page = await browser.newPage();
for (const c of cases) {
  const activity = await c.build();
  const qs = questionsOf(activity).length;
  const row = { id: c.id, questions: qs };
  for (const part of ["student", "key"]) {
    const { html } = renderWorksheetParts(activity, { part, lang: "en" });
    await page.setContent(html, { waitUntil: "load" });
    const pdfPath = join(OUT, `${c.id}-${part}.pdf`);
    await page.pdf({
      path: pdfPath,
      format: "Letter",
      preferCSSPageSize: true,
      printBackground: true,
    });
    const info = sh("pdfinfo", [pdfPath]);
    const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1] || 0);
    const size = /Page size:\s+([\d.]+) x ([\d.]+)/.exec(info);
    if (!size || Math.round(+size[1]) !== 612 || Math.round(+size[2]) !== 792)
      fail(c.id, `${part} PDF is not US Letter (${size?.[0]})`);
    // runaway guard: 13pt type and real writing space average about two questions a page; more means broken layout
    const budget = Math.ceil(qs * 0.45) + 3;
    if (!pages || pages > budget)
      fail(c.id, `${part} PDF has ${pages} pages (budget ${budget} for ${qs} questions)`);
    const fonts = sh("pdffonts", [pdfPath]).split("\n").slice(2).filter(Boolean);
    const notEmbedded = fonts.filter(
      (l) => / no\s+(no|yes)\s+(no|yes)\s+\d+\s+\d+\s*$/.test(l) && !/ yes /.test(l.slice(40, 60)),
    );
    if (fonts.some((l) => /\bType 3\b/.test(l) === false && / no /.test(l.slice(50, 62))))
      fail(c.id, `${part} PDF has a font that is not embedded:\n${fonts.join("\n")}`);
    void notEmbedded;
    for (let p = 1; p <= pages; p++) {
      const t = sh("pdftotext", ["-f", String(p), "-l", String(p), pdfPath, "-"])
        .replace(/Page \d+ (of|\/) \d+/gi, "")
        .replace(activity.title, "")
        .replace(/TEACHER COPY|Answer key|Teacher copy|Do not hand out|—|\(|\)/gi, "")
        .replace(/\s+/g, "");
      if (t.length < 15) fail(c.id, `${part} PDF page ${p} is blank apart from the running header`);
    }
    const all = sh("pdftotext", [pdfPath, "-"]);
    if (part === "student" && /Answer key|TEACHER COPY/i.test(all))
      fail(c.id, "student PDF contains the answer key");
    if (part === "key" && !/Answer key/i.test(all)) fail(c.id, "key PDF has no answer key");
    if (part === "student") {
      sh("pdftoppm", ["-png", "-r", "60", "-f", "1", "-l", "1", pdfPath, join(OUT, `${c.id}-pdf`)]);
      row.pdfPages = pages;
    } else row.keyPages = pages;
  }
  // Word
  for (const part of ["student", "key"]) {
    const bytes = await buildDocx(activity, { part, lang: "en" });
    const docx = join(OUT, `${c.id}-${part}.docx`);
    writeFileSync(docx, Buffer.from(bytes));
    try {
      sh("unzip", ["-tq", docx]);
    } catch {
      fail(c.id, `${part} DOCX is not a valid zip package`);
      continue;
    }
    const xml = sh("unzip", ["-p", docx, "word/document.xml"]);
    const paras = (xml.match(/<w:p[ >]/g) || []).length;
    const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
    if (paras < 10 || text.length < 200)
      fail(c.id, `${part} DOCX has little editable text (${paras} paragraphs)`);
    if (!/<w:pgSz [^>]*w:w="12240"[^>]*w:h="15840"/.test(xml))
      fail(c.id, `${part} DOCX page setup is not US Letter`);
    if (/<w:drawing>[\s\S]*<pic:pic/.test(xml) && text.length < 400)
      fail(c.id, `${part} DOCX looks like pictures of text`);
    if (part === "student" && /Answer key/i.test(text))
      fail(c.id, "student DOCX contains the answer key");
    if (part === "student") {
      row.docxParagraphs = paras;
      row.docxTables = (xml.match(/<w:tbl>/g) || []).length;
      if (hasSoffice) {
        const profile = `file:///tmp/lo_create_${process.pid}`;
        try {
          // a separate folder: LibreOffice names its PDF after the DOCX, which would overwrite the Chromium PDF
          const loDir = join(OUT, "libreoffice");
          mkdirSync(loDir, { recursive: true });
          sh("soffice", [
            `-env:UserInstallation=${profile}`,
            "--headless",
            "--norestore",
            "--convert-to",
            "pdf",
            "--outdir",
            loDir,
            docx,
          ]);
          const conv = join(loDir, `${c.id}-student.pdf`);
          if (!existsSync(conv)) fail(c.id, "LibreOffice did not convert the DOCX");
          else {
            row.libreofficePages = Number(/Pages:\s+(\d+)/.exec(sh("pdfinfo", [conv]))?.[1] || 0);
            for (let p = 1; p <= row.libreofficePages; p++) {
              const t = sh("pdftotext", ["-f", String(p), "-l", String(p), conv, "-"])
                .replace(/Page \d+ (of|\/) \d+/gi, "")
                .replace(activity.title, "")
                .replace(/\s+/g, "");
              if (t.length < 15)
                fail(
                  c.id,
                  `Word file page ${p} of ${row.libreofficePages} is blank in LibreOffice`,
                );
            }
            sh("pdftoppm", [
              "-png",
              "-r",
              "60",
              "-f",
              "1",
              "-l",
              "1",
              conv,
              join(OUT, `${c.id}-docx`),
            ]);
          }
        } catch (e) {
          fail(c.id, `LibreOffice failed: ${String(e.message).slice(0, 200)}`);
        }
      }
    }
  }
  rows.push(row);
  console.log(
    `  ${c.id}: ${qs} questions, PDF ${row.pdfPages} p (+key ${row.keyPages}), DOCX ${row.docxParagraphs} paragraphs / ${row.docxTables} tables${row.libreofficePages ? `, LibreOffice ${row.libreofficePages} p` : ""}`,
  );
}
await browser.close();
writeFileSync(
  join(OUT, "export-lab.json"),
  JSON.stringify({ rows, failures, libreoffice: hasSoffice }, null, 2),
);
if (!hasSoffice) console.log("  SKIP LibreOffice round trip (soffice not installed)");
if (failures.length) {
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log(`create-export-lab: ${rows.length} resources verified as PDF and DOCX`);
