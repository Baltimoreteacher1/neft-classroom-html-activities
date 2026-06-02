// ── DOCX + PDF generation for Summer Bridge printable pages ───────────────────
// Several Summer Bridge pages ship as standalone printable HTML: the six Bridge
// studio resources (bridge-to-grade-6/resources/) and the flagship Summer Bridge
// Practice Packet (summer-bridge/practice-packet.html). Clicking "download" on a
// raw .html file just saves the markup, which is not useful for teachers/families.
// This script renders each page to BOTH an editable Word document (.docx) and a
// print-ready PDF, so every page can offer real, shareable downloads.
//
//   PDF  — faithful, via the same headless Chrome approach as generate-pdf.mjs
//          (zero extra dependencies; preserves the polished printable layout).
//   DOCX — editable, built with the already-installed `docx` package from a
//          small, dependency-free HTML parser tuned to these resource files'
//          bounded tag set (headings, paragraphs, lists, tables, inline marks).
//
// Usage:
//   node scripts/generate-bridge-downloads.mjs            # all resources
//   node scripts/generate-bridge-downloads.mjs family-practice fluency-drills
//
// Output (next to each source file):
//   bridge-to-grade-6/resources/<name>.docx
//   bridge-to-grade-6/resources/<name>.pdf

import {
  readdirSync,
  existsSync,
  mkdirSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
} from "docx";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const resDir = join(root, "bridge-to-grade-6", "resources");

const ACCENT = "255F58";
const INK = "1C252C";
const SOFT = "F0F6F4";
const LINE = "CAD3DA";

// ── Tiny HTML parser ──────────────────────────────────────────────────────────
// Builds a lightweight DOM tree from the (well-formed, generated) resource HTML.
// Handles the bounded tag set these files use; ignores head/style/script and
// any element marked no-print. Not a general-purpose parser — just enough.

const VOID_TAGS = new Set(["br", "img", "hr", "meta", "link", "input"]);
const SKIP_TAGS = new Set([
  "head",
  "style",
  "script",
  "title",
  "meta",
  "link",
  "button",
]);

function decode(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rarr;/g, "→")
    .replace(/&middot;/g, "·")
    .replace(/&times;/g, "×")
    .replace(/&deg;/g, "°")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function parseAttrs(raw) {
  const attrs = {};
  const re = /([a-zA-Z_:-]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
  let m;
  while ((m = re.exec(raw))) {
    const key = m[1].toLowerCase();
    let val = m[2] || "";
    if (val.startsWith('"') || val.startsWith("'")) val = val.slice(1, -1);
    attrs[key] = val;
  }
  return attrs;
}

function parseHTML(html) {
  // Drop comments and declarations (<!DOCTYPE ...>) up front.
  html = html.replace(/<!--[\s\S]*?-->/g, "").replace(/<![^>]*>/g, "");
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const tokenRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*?)\/?>/g;
  let last = 0;
  let m;
  let skipDepth = 0; // inside a SKIP_TAGS subtree
  let skipTag = null;

  const pushText = (text) => {
    if (skipDepth > 0) return;
    const t = decode(text);
    if (t.trim() === "" && !/\s/.test(t)) return;
    if (t.trim() === "") {
      // keep a single space for inline spacing, drop pure newlines
      if (!/[^\s]/.test(t) && /\n/.test(t)) return;
    }
    stack[stack.length - 1].children.push({ tag: "#text", text: t });
  };

  while ((m = tokenRe.exec(html))) {
    if (m.index > last) pushText(html.slice(last, m.index));
    last = tokenRe.lastIndex;
    const closing = m[0][1] === "/";
    const tag = m[1].toLowerCase();
    const selfClose = m[0].endsWith("/>") || VOID_TAGS.has(tag);

    if (skipDepth > 0) {
      if (closing && tag === skipTag) {
        skipDepth--;
        if (skipDepth === 0) skipTag = null;
      } else if (!closing && !selfClose && tag === skipTag) {
        skipDepth++;
      }
      continue;
    }

    if (closing) {
      // pop until matching tag
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const attrs = parseAttrs(m[2] || "");
    if (SKIP_TAGS.has(tag)) {
      if (!selfClose) {
        skipDepth = 1;
        skipTag = tag;
      }
      continue;
    }
    // Skip elements explicitly hidden from print.
    if ((attrs.class || "").split(/\s+/).includes("no-print")) {
      if (!selfClose) {
        skipDepth = 1;
        skipTag = tag;
      }
      continue;
    }

    const node = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!selfClose) stack.push(node);
  }
  if (last < html.length) pushText(html.slice(last));
  return root;
}

// ── DOM → docx ─────────────────────────────────────────────────────────────────

// Collect inline runs from a node's children, honoring strong/em/u/a/br/span.
function inlineRuns(node, inherited = {}) {
  const runs = [];
  for (const child of node.children) {
    if (child.tag === "#text") {
      const text = child.text.replace(/\s+/g, " ");
      if (text === "") continue;
      runs.push(new TextRun({ text, ...inherited }));
    } else if (child.tag === "br") {
      runs.push(new TextRun({ text: "", break: 1 }));
    } else if (["strong", "b"].includes(child.tag)) {
      runs.push(...inlineRuns(child, { ...inherited, bold: true }));
    } else if (["em", "i"].includes(child.tag)) {
      runs.push(...inlineRuns(child, { ...inherited, italics: true }));
    } else if (child.tag === "u") {
      runs.push(...inlineRuns(child, { ...inherited, underline: {} }));
    } else if (["span", "a", "dt", "dd"].includes(child.tag)) {
      runs.push(...inlineRuns(child, inherited));
    } else {
      // any other inline-ish element: recurse for its text
      runs.push(...inlineRuns(child, inherited));
    }
  }
  return runs;
}

function textOf(node) {
  if (node.tag === "#text") return node.text;
  return node.children.map(textOf).join("");
}

const HEADING = {
  h1: HeadingLevel.TITLE,
  h2: HeadingLevel.HEADING_1,
  h3: HeadingLevel.HEADING_2,
  h4: HeadingLevel.HEADING_3,
};

function cellBorders() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: LINE };
  return { top: b, bottom: b, left: b, right: b };
}

function buildTable(node) {
  const rows = [];
  // flatten thead/tbody to find <tr>
  const trs = [];
  const collectTr = (n) => {
    for (const c of n.children) {
      if (c.tag === "tr") trs.push(c);
      else if (["thead", "tbody", "tfoot"].includes(c.tag)) collectTr(c);
    }
  };
  collectTr(node);
  for (const tr of trs) {
    const cells = [];
    for (const cell of tr.children) {
      if (cell.tag !== "td" && cell.tag !== "th") continue;
      const isHead = cell.tag === "th";
      const runs = inlineRuns(cell, isHead ? { bold: true } : {});
      cells.push(
        new TableCell({
          borders: cellBorders(),
          shading: isHead ? { fill: SOFT } : undefined,
          margins: { top: 60, bottom: 60, left: 90, right: 90 },
          children: [
            new Paragraph({
              children: runs.length ? runs : [new TextRun(" ")],
            }),
          ],
        }),
      );
    }
    if (cells.length) rows.push(new TableRow({ children: cells }));
  }
  if (!rows.length) return null;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

// Walk block-level nodes, producing docx Paragraph/Table elements.
function blockElements(node, ctx = {}) {
  const out = [];
  for (const child of node.children) {
    if (child.tag === "#text") {
      const t = child.text.replace(/\s+/g, " ");
      if (t.trim()) out.push(new Paragraph({ children: [new TextRun(t)] }));
      continue;
    }
    switch (child.tag) {
      case "h1":
      case "h2":
      case "h3":
      case "h4": {
        out.push(
          new Paragraph({
            heading: HEADING[child.tag],
            spacing: { before: 200, after: 80 },
            children: inlineRuns(child),
          }),
        );
        break;
      }
      case "p": {
        const runs = inlineRuns(child);
        out.push(
          new Paragraph({
            spacing: { after: 120 },
            children: runs.length ? runs : [new TextRun("")],
          }),
        );
        break;
      }
      case "ul":
      case "ol": {
        const ordered = child.tag === "ol";
        let i = 1;
        for (const li of child.children) {
          if (li.tag !== "li") continue;
          // nested block content inside <li>: take inline runs, then recurse blocks
          const runs = inlineRuns(li);
          out.push(
            new Paragraph({
              bullet: ordered ? undefined : { level: 0 },
              numbering: undefined,
              indent: { left: 480, hanging: 240 },
              spacing: { after: 60 },
              children: ordered
                ? [new TextRun({ text: `${i}. `, bold: true }), ...runs]
                : runs,
            }),
          );
          i++;
          // recurse for nested lists/tables inside the li
          for (const sub of li.children) {
            if (["ul", "ol", "table"].includes(sub.tag)) {
              out.push(...blockElements({ children: [sub] }));
            }
          }
        }
        break;
      }
      case "table": {
        const tbl = buildTable(child);
        if (tbl) {
          out.push(tbl);
          out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        }
        break;
      }
      case "dl": {
        for (const d of child.children) {
          if (d.tag === "dt") {
            out.push(
              new Paragraph({
                spacing: { before: 80, after: 20 },
                children: inlineRuns(d, { bold: true }),
              }),
            );
          } else if (d.tag === "dd") {
            out.push(
              new Paragraph({
                indent: { left: 360 },
                spacing: { after: 60 },
                children: inlineRuns(d),
              }),
            );
          }
        }
        break;
      }
      case "div": {
        const cls = (child.attrs.class || "").split(/\s+/);
        if (cls.includes("choice")) {
          // choice card: bold lead + description
          out.push(
            new Paragraph({
              spacing: { after: 100 },
              border: {
                top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
                left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
                right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
              },
              children: inlineRuns(child),
            }),
          );
        } else {
          out.push(...blockElements(child, ctx));
        }
        break;
      }
      case "br":
        break;
      default:
        // header/main/section/article/tbody/etc: descend
        out.push(...blockElements(child, ctx));
    }
  }
  return out;
}

async function buildDocx(htmlPath, outPath) {
  const html = readFileSync(htmlPath, "utf8");
  const tree = parseHTML(html);
  const children = blockElements(tree);
  if (!children.length) children.push(new Paragraph({ children: [] }));

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 22, color: INK },
        },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          run: { font: "Arial", size: 40, bold: true, color: ACCENT },
          paragraph: { spacing: { after: 160 } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          run: { font: "Arial", size: 30, bold: true, color: ACCENT },
          paragraph: { spacing: { before: 220, after: 80 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          run: { font: "Arial", size: 26, bold: true, color: "744816" },
          paragraph: { spacing: { before: 160, after: 60 } },
        },
        {
          id: "Heading3",
          name: "Heading 3",
          run: { font: "Arial", size: 23, bold: true, color: INK },
          paragraph: { spacing: { before: 120, after: 40 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  writeFileSync(outPath, buffer);
  return buffer.length;
}

// ── PDF (headless Chrome) ───────────────────────────────────────────────────────
function findChrome() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    fromEnv,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for (const c of candidates) if (existsSync(c)) return c;
  const pwCache = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  if (existsSync(pwCache)) {
    for (const d of readdirSync(pwCache)) {
      const mac = join(pwCache, d, "chrome-mac/Chromium.app/Contents/MacOS/Chromium");
      if (existsSync(mac)) return mac;
      const lin = join(pwCache, d, "chrome-linux/chrome");
      if (existsSync(lin)) return lin;
    }
  }
  return null;
}

function fileSize(p) {
  try {
    return existsSync(p) ? readFileSync(p).length : 0;
  } catch {
    return 0;
  }
}

async function renderPdf(chrome, htmlPath, outPath) {
  const profile = join(
    tmpdir(),
    `neft-bridge-pdf-${process.pid}-${Math.random().toString(36).slice(2)}`,
  );
  try {
    rmSync(outPath, { force: true });
  } catch {}
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--disable-background-networking",
      "--run-all-compositor-stages-before-draw",
      "--virtual-time-budget=6000",
      "--no-pdf-header-footer",
      `--user-data-dir=${profile}`,
      `--print-to-pdf=${outPath}`,
      `file://${htmlPath}`,
    ],
    { stdio: "ignore", detached: true },
  );
  const killTree = () => {
    try {
      process.kill(-child.pid, "SIGKILL");
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {}
    }
  };
  const deadline = Date.now() + 20000;
  let lastSize = -1;
  while (Date.now() < deadline) {
    await sleep(400);
    const size = fileSize(outPath);
    if (size > 0 && size === lastSize) break;
    lastSize = size;
    if (child.exitCode != null || child.signalCode != null) {
      await sleep(200);
      break;
    }
  }
  killTree();
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
  return fileSize(outPath) > 0;
}

// ── targets ───────────────────────────────────────────────────────────────────
// Every standalone printable HTML page that should also be offered as Word + PDF.
// `name` is the slug used in CLI filtering and the output filenames; siblings are
// written next to the source HTML.
function collectTargets() {
  const targets = [];
  if (existsSync(resDir)) {
    for (const f of readdirSync(resDir).filter((f) => f.endsWith(".html"))) {
      targets.push({ dir: resDir, name: basename(f, ".html") });
    }
  }
  // Summer Bridge flagship packet (single printable workbook).
  const sbDir = join(root, "summer-bridge");
  if (existsSync(join(sbDir, "practice-packet.html"))) {
    targets.push({ dir: sbDir, name: "practice-packet" });
  }
  return targets;
}

async function main() {
  const filter = process.argv.slice(2).map((s) => s.replace(/\.html$/, ""));
  const targets = collectTargets().filter(
    (t) => !filter.length || filter.includes(t.name),
  );

  if (!targets.length) {
    console.error("No matching HTML targets found.");
    process.exit(1);
  }

  const chrome = findChrome();
  if (!chrome) {
    console.warn(
      "generate-bridge-downloads: no Chrome/Chromium found. Set CHROME_PATH to enable PDF export. DOCX will still be generated.",
    );
  }

  let docxOk = 0;
  let pdfOk = 0;
  for (const { dir, name } of targets) {
    const label = `${basename(dir)}/${name}`;
    const htmlPath = join(dir, `${name}.html`);
    const docxPath = join(dir, `${name}.docx`);
    const pdfPath = join(dir, `${name}.pdf`);
    try {
      const size = await buildDocx(htmlPath, docxPath);
      if (size > 0) docxOk++;
      console.log(`  docx  ${label}.docx  (${(size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.warn(`  docx FAILED ${label}: ${e.message}`);
    }
    if (chrome) {
      try {
        const wrote = await renderPdf(chrome, htmlPath, pdfPath);
        if (wrote) {
          pdfOk++;
          console.log(
            `  pdf   ${label}.pdf   (${(fileSize(pdfPath) / 1024).toFixed(1)} KB)`,
          );
        } else {
          console.warn(`  pdf FAILED ${label}: no output`);
        }
      } catch (e) {
        console.warn(`  pdf FAILED ${label}: ${e.message}`);
      }
    }
  }
  console.log(
    `\nBridge downloads: ${docxOk}/${targets.length} DOCX, ${pdfOk}/${targets.length} PDF.`,
  );
}

main();
