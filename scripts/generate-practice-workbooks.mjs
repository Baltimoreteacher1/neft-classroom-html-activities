#!/usr/bin/env node
import { spawnSync } from "node:child_process";
/** Editable, print-ready practice sheets from the authored student worksheets.
 * Usage: node scripts/generate-practice-workbooks.mjs [lesson-id ...]
 * PDF rendering is a separate LibreOffice pass; see --pdf below.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { JSDOM } from "jsdom";
import { lessonPath, listLessonDirs, REPO_ROOT } from "../tools/lib/curriculum-source.mjs";

const root = REPO_ROOT;
const NAVY = "17324D";
const INK = "20252A";
const GRAY = "5D666F";
const RULE = "AAB2BA";
const WIDTH = 10120;
const selected = process.argv.slice(2).filter((x) => !x.startsWith("--"));
const makePdf = process.argv.includes("--pdf");
const explicitLimit = process.argv.includes("--two")
  ? 2
  : process.argv.includes("--one")
    ? 1
    : null;
const ids = listLessonDirs().filter(
  (id) =>
    (!selected.length || selected.includes(id)) && existsSync(lessonPath(id, "worksheet.html")),
);

const cls = (el, name) => el?.classList?.contains(name);
const first = (el, selector) => el?.querySelector(selector);
function text(el) {
  if (!el) return "";
  const clone = el.cloneNode(true);
  for (const blank of clone.querySelectorAll(
    ".ws-fill-inline,.ws-fill-line,.ws-blank,.sp-blank,.wss-slot-w",
  )) {
    if (!blank.textContent.trim()) {
      if (
        blank.classList.contains("ws-blank") &&
        blank.previousElementSibling?.textContent.includes("___")
      )
        blank.remove();
      else blank.textContent = "____________";
    }
  }
  for (const line of clone.querySelectorAll(".ws-line,.sp-line")) line.remove();
  return clone.textContent.replace(/\s+/g, " ").trim();
}
const run = (value, options = {}) =>
  new TextRun({ text: String(value), font: "Aptos", size: 21, color: INK, ...options });
function para(value, options = {}) {
  return new Paragraph({
    spacing: { after: 100, line: 280 },
    ...options,
    children: [run(value, options.run || {})],
  });
}
function ruleParagraph() {
  return new Paragraph({
    spacing: { before: 20, after: 75, line: 220 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE } },
    children: [run(" ")],
  });
}
function heading(value, size = 23) {
  return para(value, {
    keepNext: true,
    spacing: { before: 190, after: 75 },
    run: { bold: true, size, color: NAVY },
  });
}
function grid(source) {
  const rows = [...source.querySelectorAll("tr")].map((row) =>
    [...row.children].filter((c) => /^(TH|TD)$/.test(c.tagName)),
  );
  if (!rows.length) return null;
  const columns = Math.max(...rows.map((r) => r.length));
  if (!columns) return null;
  if (rows.flat().filter((cell) => text(cell)).length < 2) return null;
  const columnWidths = Array.from({ length: columns }, (_, i) =>
    i === 0 ? Math.round(WIDTH * 0.24) : Math.floor((WIDTH * 0.76) / (columns - 1 || 1)),
  );
  columnWidths[columns - 1] += WIDTH - columnWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: WIDTH, type: WidthType.DXA },
    columnWidths,
    borders: Object.fromEntries(
      ["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((side) => [
        side,
        { style: BorderStyle.SINGLE, size: 5, color: "4F555B" },
      ]),
    ),
    rows: rows.map(
      (row, ri) =>
        new TableRow({
          cantSplit: true,
          children: Array.from({ length: columns }, (_, ci) => {
            const cell = row[ci];
            const label = text(cell);
            return new TableCell({
              width: { size: columnWidths[ci], type: WidthType.DXA },
              margins: { top: 85, bottom: 85, left: 105, right: 105 },
              shading:
                ri === 0 && rows.length > 2
                  ? { type: ShadingType.CLEAR, fill: "F0F2F3" }
                  : undefined,
              children: [
                para(label || " ", {
                  spacing: { after: 0, line: 260 },
                  run: { size: 19, bold: ri === 0 || ci === 0 },
                }),
              ],
            });
          }),
        }),
    ),
  });
}
function figure(svg) {
  try {
    const markup = svg.outerHTML
      .replace(/<title[\s\S]*?<\/title>/gi, "")
      .replace(/<desc[\s\S]*?<\/desc>/gi, "");
    const raster = new Resvg(markup, { fitTo: { mode: "width", value: 900 } }).render();
    const width = Math.min(465, raster.width / 2);
    const height = Math.min(280, (raster.height * width) / raster.width);
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 110 },
      children: [
        new ImageRun({
          data: raster.asPng(),
          type: "png",
          transformation: { width, height },
          altText: {
            title: "Math diagram",
            description: svg.getAttribute("aria-label") || "Math diagram",
            name: "Math diagram",
          },
        }),
      ],
    });
  } catch {
    return para(svg.getAttribute("aria-label") || "Diagram: see the online worksheet.", {
      run: { italic: true, color: GRAY },
    });
  }
}
function bodyBlocks(node, out) {
  for (const child of node.children) {
    if ([...child.classList].some((name) => name.startsWith("wss-") || name.startsWith("wsd-")))
      continue;
    if (cls(child, "ws-stem") || cls(child, "ws-hint") || cls(child, "ws-frame")) continue;
    if (child.tagName === "TABLE") {
      const table = grid(child);
      if (table) out.push(table);
      continue;
    }
    if (child.tagName === "SVG") {
      out.push(figure(child));
      continue;
    }
    if (cls(child, "ws-work") || cls(child, "sp-work")) {
      out.push(
        para(text(first(child, ".ws-work-label,.sp-work-label")) || "Show your work", {
          run: { bold: true, size: 18, color: GRAY },
          spacing: { before: 85, after: 0 },
        }),
      );
      out.push(ruleParagraph());
      continue;
    }
    if (cls(child, "ws-lines") || cls(child, "sp-lines")) {
      for (let i = 0; i < Math.min(3, child.children.length || 2); i++) out.push(ruleParagraph());
      continue;
    }
    if (cls(child, "ws-answer-line")) {
      out.push(para("Answer:  __________________________________________"));
      continue;
    }
    if (child.tagName === "OL" || child.tagName === "UL") {
      for (const [index, item] of [...child.children].entries()) {
        if (cls(item, "ws-gf-step")) {
          out.push(
            para(`${index + 1}.  ${text(first(item, ".ws-gf-prompt") || item)}`, {
              indent: { left: 280 },
              spacing: { after: 45, line: 260 },
            }),
          );
        } else if (cls(item, "ws-opt") || cls(item, "sp-opt")) {
          const letter = text(first(item, ".ws-bub,.sp-bub"));
          const choice =
            text(first(item, ".ws-opt-text")) || text(item).replace(new RegExp(`^${letter}`), "");
          out.push(
            para(`${letter}.  ${choice}`, {
              indent: { left: 360 },
              spacing: { after: 35, line: 245 },
            }),
          );
        } else if (
          item.children.length &&
          !["SPAN", "B", "I", "EM", "STRONG"].includes(item.children[0].tagName)
        ) {
          out.push(
            para(`${index + 1}.  ${text(item.querySelector("p") || item).slice(0, 500)}`, {
              spacing: { after: 55 },
            }),
          );
          bodyBlocks(item, out);
        } else {
          out.push(
            para(`${child.tagName === "OL" ? `${index + 1}.` : "•"}  ${text(item)}`, {
              indent: { left: 280 },
              spacing: { after: 45, line: 260 },
            }),
          );
        }
      }
      continue;
    }
    if (["P", "H2", "H3"].includes(child.tagName)) {
      const value = text(child);
      if (value) out.push(child.tagName === "P" ? para(value) : heading(value, 21));
      continue;
    }
    if (cls(child, "ws-figure-wrap")) {
      bodyBlocks(child, out);
      continue;
    }
    if (child.tagName === "DIV" || child.tagName === "SECTION") {
      if (!child.querySelector("p,table,svg,ol,ul,div")) {
        const value = text(child);
        if (value) out.push(para(value));
      } else bodyBlocks(child, out);
      continue;
    }
    if (child.tagName === "IMG") {
      const alt = child.getAttribute("alt");
      if (alt) out.push(para(alt, { run: { italic: true } }));
    }
  }
}
function modelBlock(doc, out) {
  const example = doc.querySelector(".ws-support-page .ws-block-example");
  if (!example) return;
  out.push(heading("Worked model", 22));
  const problem = first(example, ".ws-example-problem");
  if (problem) out.push(para(text(problem), { run: { bold: true } }));
  const steps = first(example, ".ws-example-steps");
  if (steps) bodyBlocks({ children: [steps] }, out);
  const answer = first(example, ".ws-example-answer");
  if (answer) out.push(para(text(answer), { run: { bold: true } }));
}
function chooseProblems(doc, limit) {
  const editions = [...doc.querySelectorAll(".ws-edition-page")];
  const core =
    editions.find((page) => /^Version B\b/.test(text(first(page, ".ws-edition")))) || editions[0];
  if (!core) return [];
  const cards = [...core.querySelectorAll(".ws-problem-card")];
  return cards.slice(0, limit);
}
function sheetLabel(id) {
  const match = /^(\d+)-(\d+)(?:-(.*))?$/.exec(id);
  if (!match) return `Unit ${id.replace("-", " · ")}`;
  const base = `Lesson ${match[1]}-${match[2]}`;
  const suffix = match[3];
  return suffix === "group1"
    ? `${base} · Group 1`
    : suffix === "group2"
      ? `${base} · Group 2`
      : suffix === "catchup"
        ? `${base} · Catch-up`
        : /^part[23]$/.test(suffix || "")
          ? `${base} · Apply Day`
          : base;
}
async function build(id, limit = explicitLimit || 3) {
  const source = lessonPath(id, "worksheet.html");
  const dom = new JSDOM(readFileSync(source, "utf8"));
  const html = dom.window.document;
  const titleEl = first(html, ".ws-title")?.cloneNode(true);
  titleEl?.querySelector(".ws-lesson-n")?.remove();
  const title = text(titleEl) || id;
  const target = text(first(html, ".ws-target")).replace(/^Learning target\s*/i, "");
  const blocks = [
    para("Name  ________________________________     Date  ____________     Period  ______", {
      spacing: { after: 250 },
      run: { size: 19 },
    }),
    para(sheetLabel(id), { spacing: { after: 45 }, run: { bold: true, size: 19 } }),
    para("Reinforce Understanding", { spacing: { after: 45 }, run: { bold: true, size: 39 } }),
    para(title, { spacing: { after: 125 }, run: { bold: true, size: 23 } }),
  ];
  if (target) blocks.push(para(target, { spacing: { after: 165 }, run: { bold: true, size: 21 } }));
  modelBlock(html, blocks);
  blocks.push(heading("Practice", 22));
  blocks.push(
    para("Complete each exercise. Show the reasoning that supports your answer.", {
      spacing: { after: 115 },
      run: { bold: true, size: 20 },
    }),
  );
  const problems = chooseProblems(html, limit);
  if (!problems.length) throw new Error(`${id}: no authored practice problems`);
  for (const [index, card] of problems.entries()) {
    const stem = text(first(card, ".ws-stem"));
    const directions = text(first(card, ".ws-directions"));
    blocks.push(
      para(`${index + 1}.  ${stem}`, {
        keepNext: true,
        spacing: { before: 145, after: 65 },
        run: { bold: true, size: 21 },
      }),
    );
    if (directions && !stem.toLowerCase().includes(directions.toLowerCase()))
      blocks.push(para(directions, { spacing: { after: 75 }, run: { size: 19, color: GRAY } }));
    bodyBlocks(first(card, ".ws-pbody") || card, blocks);
  }
  const doc = new Document({
    creator: "EduWonderLab",
    title: `${title} — Reinforce Understanding`,
    styles: { default: { document: { run: { font: "Aptos", size: 21, color: INK } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 920, bottom: 950, left: 1000, right: 1000 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 3, color: RULE } },
                spacing: { before: 80 },
                children: [
                  run(`EduWonderLab  •  Grade 6 Mathematics  •  Lesson ${id}`, {
                    size: 16,
                    color: GRAY,
                  }),
                  new TextRun({ text: "                                      ", size: 16 }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GRAY }),
                ],
              }),
            ],
          }),
        },
        children: blocks,
      },
    ],
  });
  const outputDir = lessonPath(id, "downloads");
  mkdirSync(outputDir, { recursive: true });
  const output = join(outputDir, `${id}-practice-workbook.docx`);
  writeFileSync(output, await Packer.toBuffer(doc));
  return output;
}

const outputs = [];
for (const id of ids) {
  try {
    outputs.push(await build(id));
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
console.log(`Generated ${outputs.length}/${ids.length} editable practice workbooks.`);
if (makePdf && outputs.length) {
  const pdfDir = join(root, ".qa-logs", "practice-pdfs");
  mkdirSync(pdfDir, { recursive: true });
  function convert(files) {
    for (let i = 0; i < files.length; i += 50) {
      const chunk = files.slice(i, i + 50);
      const result = spawnSync(
        "soffice",
        [
          "-env:UserInstallation=file:///tmp/lo-eduwonderlab-practice",
          "--headless",
          "--convert-to",
          "pdf",
          "--outdir",
          pdfDir,
          ...chunk,
        ],
        { encoding: "utf8", maxBuffer: 1024 * 1024 * 2 },
      );
      if (result.status !== 0) {
        console.error(result.stderr || result.stdout);
        process.exitCode = 1;
      }
    }
    for (const docx of files) {
      const id = docx
        .split("/")
        .at(-1)
        .replace(/-practice-workbook\.docx$/, "");
      const pdf = join(pdfDir, `${id}-practice-workbook.pdf`);
      if (!existsSync(pdf)) {
        console.error(`Missing PDF: ${id}`);
        process.exitCode = 1;
        continue;
      }
      writeFileSync(lessonPath(id, "downloads", `${id}-practice-workbook.pdf`), readFileSync(pdf));
    }
  }
  function pageCount(id) {
    const pdf = lessonPath(id, "downloads", `${id}-practice-workbook.pdf`);
    const result = spawnSync("pdfinfo", [pdf], { encoding: "utf8" });
    if (result.status !== 0) throw new Error(`Could not inspect ${pdf}: ${result.stderr}`);
    return Number(/^Pages:\s+(\d+)/m.exec(result.stdout)?.[1] || 0);
  }
  convert(outputs);
  if (!explicitLimit) {
    for (const limit of [2, 1]) {
      const long = ids.filter((id) => pageCount(id) > 1);
      if (!long.length) break;
      console.log(
        `Reflowing ${long.length} long sheets with ${limit} authored exercise${limit === 1 ? "" : "s"}.`,
      );
      const revised = [];
      for (const id of long) revised.push(await build(id, limit));
      convert(revised);
    }
  }
  const remaining = ids.filter((id) => pageCount(id) !== 1);
  if (remaining.length) {
    console.error(`Practice sheets not one page: ${remaining.join(", ")}`);
    process.exitCode = 1;
  }
  console.log(`Converted ${outputs.length} practice workbooks to one-page PDFs.`);
}
