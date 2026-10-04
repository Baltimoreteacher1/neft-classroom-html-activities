/** Publisher-style ACCESS packets. Student and teacher content never share answer panels. */
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  ImageRun,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { LAB_DIR, orderedActivities } from "./access-lab-content.mjs";
import { paperDirections, repeatedHotTextPassage } from "./access-packet-html.mjs";

const W = 10368; // 7.2-inch live area on US Letter.
const INK = "20333D";
const MUTED = "52636B";
const RULE = "C7D6D8";
const ACCENTS = {
  Listening: "176D68",
  Reading: "315F87",
  Speaking: "956016",
  Writing: "70518A",
  "Model-Test": "176D68",
};
const SUPPORT = { A: "Starting support", B: "Growing support", C: "Expanding support" };
const list = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const str = (value) =>
  typeof value === "object" ? String(value?.text ?? "") : String(value ?? "");
const escape = (value) =>
  str(value).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c],
  );
const run = (text, options = {}) => new TextRun({ text: str(text), ...options });
const p = (text, options = {}) =>
  new Paragraph({
    spacing: { after: 85, line: 265 },
    widowControl: true,
    children: [run(text)],
    ...options,
  });
const label = (text, accent, options = {}) =>
  p(text, {
    keepNext: true,
    spacing: { before: 115, after: 60 },
    children: [run(text, { bold: true, color: accent, size: 22 })],
    ...options,
  });
const line = (keepNext = false) =>
  p(" ", {
    spacing: { before: 0, after: 0, line: 370 },
    keepNext,
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 3, color: RULE },
      between: { style: BorderStyle.SINGLE, size: 3, color: RULE },
    },
  });
const rasterCache = new Map();

function raster(svg) {
  const rendered = new Resvg(svg, {
    fitTo: { mode: "width", value: 1440 },
    font: { defaultFontFamily: "Arial", loadSystemFonts: true },
  }).render();
  return { data: rendered.asPng(), width: rendered.width, height: rendered.height };
}
async function picture(source) {
  const path = resolve(LAB_DIR, source);
  if (!path.startsWith(resolve(LAB_DIR) + sep)) throw new Error(`Picture outside lab: ${source}`);
  if (!rasterCache.has(path)) rasterCache.set(path, readFile(path, "utf8").then(raster));
  return rasterCache.get(path);
}
function imageParagraph(image, alt, { maxWidth = 520, maxHeight = 235, keepNext = false } = {}) {
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  return new Paragraph({
    spacing: { before: 70, after: 90 },
    keepNext,
    alignment: AlignmentType.CENTER,
    children: [
      new ImageRun({
        type: "png",
        data: image.data,
        transformation: {
          width: Math.round(image.width * scale),
          height: Math.round(image.height * scale),
        },
        altText: {
          title: alt || "Activity illustration",
          description: alt || "Activity illustration",
          name: "Practice visual",
        },
      }),
    ],
  });
}
function drawingBox(keepNext) {
  const border = { style: BorderStyle.SINGLE, size: 5, color: RULE };
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W],
    borders: { top: border, bottom: border, left: border, right: border },
    rows: [
      new TableRow({
        cantSplit: true,
        height: { value: 1800, rule: "atLeast" },
        children: [
          new TableCell({
            width: { size: W, type: WidthType.DXA },
            children: [p("", { keepNext })],
          }),
        ],
      }),
    ],
  });
}
function chartSvg(chart, accent) {
  const data = chart.data || [];
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  const left = 230,
    top = 83,
    plot = 650,
    row = 43;
  const height = top + data.length * row + 57;
  const pictograph = chart.kind === "pictograph";
  const per = Number(chart.per) > 0 ? Number(chart.per) : 1;
  const icon = chart.icon || "●";
  const symbolName = icon === "🙂" ? "smile" : icon === "⭐" || icon === "★" ? "star" : icon;
  const symbol = (x, y) =>
    icon === "🙂"
      ? `<circle cx="${x}" cy="${y}" r="10" fill="#fff4cf" stroke="#${accent}" stroke-width="1.5"/><circle cx="${x - 3}" cy="${y - 2}" r="1"/><circle cx="${x + 3}" cy="${y - 2}" r="1"/><path d="M ${x - 4} ${y + 2} Q ${x} ${y + 7} ${x + 4} ${y + 2}" fill="none" stroke="#${accent}" stroke-width="1.5"/>`
      : icon === "⭐" || icon === "★"
        ? `<polygon points="${Array.from({ length: 10 }, (_, i) => {
            const theta = ((i * 36 - 90) * Math.PI) / 180;
            const radius = i % 2 ? 4.5 : 11;
            return `${x + Math.cos(theta) * radius},${y + Math.sin(theta) * radius}`;
          }).join(" ")}" fill="#${accent}"/>`
        : `<text x="${x}" y="${y + 8}" text-anchor="middle" font-size="25">${escape(icon)}</text>`;
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const value = (max * i) / 4,
      x = left + (plot * i) / 4;
    return `<line x1="${x}" y1="${top - 10}" x2="${x}" y2="${height - 38}" stroke="#d8e2e5"/><text x="${x}" y="${height - 14}" text-anchor="middle" font-size="22">${Number(value.toFixed(1))}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}"><rect width="1000" height="${height}" fill="white"/><g font-family="Arial" fill="#20333d"><text x="20" y="30" font-size="23" font-weight="700">${escape(chart.title || "Chart")}</text><text x="20" y="57" font-size="22">${escape(chart.unit || "value")}${pictograph ? ` · Each ${escape(symbolName)} = ${per}` : ""}</text>${pictograph ? "" : ticks}${data
    .map((d, i) => {
      const y = top + i * row;
      const glyphs = pictograph
        ? Array.from({ length: Math.max(0, Math.round(Number(d.value) / per)) }, (_, n) =>
            symbol(left + 10 + n * Math.min(30, plot / (max / per)), y + 13),
          ).join("")
        : `<rect x="${left}" y="${y}" width="${(Math.max(0, Number(d.value)) / max) * plot}" height="26" rx="3" fill="#${accent}"/>`;
      return `<text x="${left - 14}" y="${y + 19}" text-anchor="end" font-size="24">${escape(d.label)}</text>${glyphs}<text x="950" y="${y + 19}" text-anchor="end" font-size="24" font-weight="700">${escape(d.value)}</text>`;
    })
    .join("")}</g></svg>`;
}
function table(headers, rows, accent) {
  const widths = headers.map(
    (_, i) => Math.floor(W / headers.length) + (i === headers.length - 1 ? W % headers.length : 0),
  );
  const makeRow = (values, head = false, index = 0) =>
    new TableRow({
      tableHeader: head,
      cantSplit: true,
      children: widths.map(
        (width, i) =>
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            shading: {
              type: ShadingType.CLEAR,
              fill: head ? accent : index % 2 ? "F1F6F6" : "FFFFFF",
            },
            margins: { top: 85, bottom: 85, left: 110, right: 110 },
            children: [
              p(values[i] ?? "", {
                spacing: { after: 0, line: 250 },
                children: [
                  run(values[i] ?? "", { bold: head, color: head ? "FFFFFF" : INK, size: 22 }),
                ],
              }),
            ],
          }),
      ),
    });
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: widths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: RULE },
      insideVertical: { style: BorderStyle.SINGLE, size: 3, color: RULE },
    },
    rows: [makeRow(headers, true), ...rows.map((r, i) => makeRow(r, false, i))],
  });
}
function answer(a) {
  const option = (id) => (a.options || []).find((o) => o.id === id)?.text || id;
  const item = (id) => (a.items || []).find((o) => o.id === id)?.text || id;
  if (a.type === "multipleChoice") return option(a.answer);
  if (a.type === "multiSelect") return list(a.answers).map(option).join("; ");
  if (a.type === "hotText")
    return list(a.answers)
      .map((id) => (a.sentences || []).find((s) => s.id === id)?.text || id)
      .join(" / ");
  if (a.type === "order")
    return list(a.answer)
      .map((id, i) => `${i + 1}. ${item(id)}`)
      .join(" → ");
  if (a.type === "sort")
    return list(a.items)
      .map((i) => `${i.text} → ${i.answer}`)
      .join("; ");
  if (a.type === "cloze")
    return list(a.segments)
      .filter((s) => s.blank)
      .map((s) => s.blank.answer)
      .join("; ");
  return "";
}
async function choices(a, accent) {
  const out = [];
  if (a.options)
    for (const [i, option] of a.options.entries()) {
      out.push(
        p(`${String.fromCharCode(65 + i)}.  ${option.text}`, {
          indent: { left: 170 },
          keepNext: Boolean(option.picture),
          children: [
            run(`${String.fromCharCode(65 + i)}.  `),
            ...(option.visual
              ? [run(`${option.visual}  `, { font: "Segoe UI Emoji", size: 28 })]
              : []),
            run(option.text),
          ],
        }),
      );
      if (option.picture)
        out.push(
          imageParagraph(await picture(option.picture.src), option.picture.alt, {
            maxWidth: 245,
            maxHeight: 110,
          }),
        );
    }
  if (a.type === "order") for (const item of a.items || []) out.push(p(`_____  ${item.text}`));
  if (a.type === "sort")
    out.push(
      table(
        ["Item", `Group: ${(a.categories || []).join(" / ")}`],
        (a.items || []).map((i) => [i.text, ""]),
        accent,
      ),
    );
  if (a.segments)
    out.push(
      p(
        a.segments
          .map((s) => (s.blank ? `________ (${(s.blank.options || []).join(" / ")})` : s.text))
          .join(""),
      ),
    );
  if (a.sentences) for (const [i, s] of a.sentences.entries()) out.push(p(`${i + 1}.  ${s.text}`));
  return out;
}

export async function packetDocx({ band, domain, level, L, teacher = false }) {
  const acts = orderedActivities(L),
    accent = ACCENTS[domain] || ACCENTS.Listening;
  const support = SUPPORT[level] || L.displayLabel || level;
  const audience = teacher ? "TEACHER EDITION" : "STUDENT PRACTICE";
  const children = [
    p(`EDUWONDERLAB  /  ${audience}`, {
      spacing: { after: 85 },
      children: [
        run(`EDUWONDERLAB  /  ${audience}`, {
          bold: true,
          color: accent,
          size: 20,
          characterSpacing: 22,
        }),
      ],
    }),
    p(`${domain} practice`, {
      heading: HeadingLevel.TITLE,
      spacing: { after: 60 },
      children: [run(`${domain} practice`, { bold: true, size: 46, color: INK })],
    }),
    p(
      `Grades ${band.replace("-", "–")}  |  ${support}  |  ${acts.length} ${acts.length === 1 ? "activity" : "activities"}`,
      {
        spacing: { after: 100 },
        children: [
          run(
            `Grades ${band.replace("-", "–")}  |  ${support}  |  ${acts.length} ${acts.length === 1 ? "activity" : "activities"}`,
            { color: MUTED, size: 22 },
          ),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 14, color: accent, space: 8 } },
      },
    ),
    p(
      teacher
        ? "Teaching copy: scripts, answer guidance, and model commentary are included. Keep this edition with the teacher."
        : "Work at your own pace. Your teacher will choose the activities. On paper, circle choices, number steps, and underline evidence instead of clicking. For speaking tasks, say your response aloud.",
      { spacing: { before: 80, after: 95 } },
    ),
  ];
  if (!teacher)
    children.push(
      p("Name or initials: ______________________________    Date: ______________", {
        spacing: { after: 100 },
      }),
    );
  for (const [index, a] of acts.entries()) {
    const listening = domain === "Listening" || a.listening;
    children.push(
      p(`${String(index + 1).padStart(2, "0")}  ${a.title}`, {
        heading: HeadingLevel.HEADING_1,
        keepNext: true,
        spacing: { before: 220, after: 65 },
        border: { top: { style: BorderStyle.SINGLE, size: 5, color: RULE, space: 9 } },
        children: [
          run(`${String(index + 1).padStart(2, "0")}  ${a.title}`, {
            bold: true,
            color: accent,
            size: 28,
          }),
        ],
      }),
    );
    if (a.skill || a.time)
      children.push(
        p([a.skill, a.time].filter(Boolean).join("  |  "), {
          keepNext: true,
          spacing: { after: 65 },
          children: [
            run([a.skill, a.time].filter(Boolean).join("  |  "), { color: MUTED, size: 20 }),
          ],
        }),
      );
    if (a.directions) children.push(p(paperDirections(a, domain), { keepNext: true }));
    for (const img of list(a.picture))
      children.push(
        imageParagraph(await picture(img.src), img.alt, {
          keepNext: !teacher && a.type === "constructed" && !a.passage,
        }),
      );
    for (const chart of list(a.chart))
      children.push(
        imageParagraph(
          raster(chartSvg(chart, accent)),
          `${chart.title || "Chart"}. ${chart.data.map((d) => `${d.label}: ${d.value} ${chart.unit || ""}`).join("; ")}`,
          { maxWidth: 650, maxHeight: 290 },
        ),
      );
    if (a.table) {
      if (a.table.caption) children.push(label(a.table.caption, accent));
      children.push(
        table(a.table.headers, a.table.rows, accent),
        p("", { spacing: { after: 35 } }),
      );
    }
    if (listening) {
      if (teacher && a.script) {
        children.push(label("READ ALOUD · Teacher script", accent));
        for (const segment of list(a.script))
          children.push(p(segment, { shading: { type: ShadingType.CLEAR, fill: "EDF5F4" } }));
      } else if (!teacher) children.push(label("Listen to your teacher. Then answer.", accent));
    }
    const duplicatePassage = repeatedHotTextPassage(a);
    if (!listening && list(a.passage).length && !duplicatePassage) {
      if (a.passageTitle) children.push(label(a.passageTitle, accent));
      for (const para of list(a.passage))
        children.push(
          p(str(para), { spacing: { after: 90, line: 275 }, indent: { left: 100, right: 100 } }),
        );
    }
    if (duplicatePassage && a.passageTitle) children.push(label(a.passageTitle, accent));
    if (a.prompt)
      children.push(
        p(paperDirections({ ...a, directions: a.prompt }, domain), {
          keepNext: true,
          children: [run(paperDirections({ ...a, directions: a.prompt }, domain), { bold: true })],
          spacing: { before: 85, after: 100 },
        }),
      );
    children.push(...(await choices(a, accent)));
    for (const [sectionIndex, section] of (a.sheet || []).entries()) {
      children.push(label(section.heading, accent));
      if (
        !teacher &&
        section.items?.length > 1 &&
        section.items.every((item) => /\[draw here\]/i.test(str(item)))
      ) {
        const widths = section.items.map(
          (_, i) =>
            Math.floor(W / section.items.length) +
            (i === section.items.length - 1 ? W % section.items.length : 0),
        );
        const border = { style: BorderStyle.SINGLE, size: 5, color: RULE };
        children.push(
          new Table({
            width: { size: W, type: WidthType.DXA },
            columnWidths: widths,
            borders: {
              top: border,
              bottom: border,
              left: border,
              right: border,
              insideVertical: border,
            },
            rows: [
              new TableRow({
                cantSplit: true,
                height: { value: 1800, rule: "atLeast" },
                children: section.items.map(
                  (item, i) =>
                    new TableCell({
                      width: { size: widths[i], type: WidthType.DXA },
                      margins: { top: 90, left: 90, right: 90 },
                      children: [
                        p(str(item).replace(/\[draw here\]/gi, ""), {
                          children: [
                            run(str(item).replace(/\[draw here\]/gi, ""), {
                              size: 22,
                              color: MUTED,
                            }),
                          ],
                        }),
                      ],
                    }),
                ),
              }),
            ],
          }),
        );
        children.push(p("", { keepNext: true, spacing: { after: 40 } }));
        continue;
      }
      for (const [i, item] of (section.items || []).entries()) {
        const draw = /\[draw here\]/i.test(str(item));
        const more = i < section.items.length - 1 || sectionIndex < a.sheet.length - 1;
        children.push(
          p(`${i + 1}. ${str(item).replace(/\[draw here\]/gi, "Sketch in the box below.")}`, {
            keepNext: !teacher,
          }),
        );
        if (!teacher) {
          if (draw) children.push(drawingBox(more));
          else if (!/[☐□]|\(circle\)/i.test(str(item))) {
            if (/_{3}/.test(str(item))) children.push(line(more));
            else children.push(line(true), line(more));
          }
        }
      }
    }
    if (a.type === "constructed" && !teacher) {
      const speaking = domain === "Speaking";
      children.push(
        label(
          speaking ? "Plan briefly · Then say your answer aloud" : "Write your response",
          accent,
        ),
      );
      const n = speaking ? 3 : level === "A" ? 4 : level === "B" ? 6 : 8;
      for (let k = 0; k < n; k++) children.push(line(true));
      children.push(
        p(
          speaking
            ? "Review: Did I answer the question and add a useful detail? Say it again if needed."
            : "Review: Did I answer each part? Underline one detail that helps explain my idea.",
          {
            spacing: { before: 90, after: 90 },
            children: [
              run(
                speaking
                  ? "Review: Did I answer the question and add a useful detail? Say it again if needed."
                  : "Review: Did I answer each part? Underline one detail that helps explain my idea.",
                { color: MUTED, size: 22 },
              ),
            ],
          },
        ),
      );
    }
    if (teacher) {
      const key = answer(a);
      if (key)
        children.push(
          label("ANSWER GUIDANCE", "956016"),
          p(key, {
            shading: { type: ShadingType.CLEAR, fill: "FFF5DF" },
            border: { left: { style: BorderStyle.SINGLE, size: 12, color: "C79A43", space: 6 } },
          }),
        );
      if (a.successCriteria?.length) {
        children.push(label("LOOK FOR", accent));
        for (const criterion of a.successCriteria)
          children.push(p(criterion, { numbering: { reference: "criteria", level: 0 } }));
      }
      for (const [k, model] of Object.entries(a.models || {})) {
        children.push(
          label(`MODEL · ${SUPPORT[k] || k}`, accent),
          p(model, { keepNext: Boolean(a.modelNotes?.[k]) }),
        );
        if (a.modelNotes?.[k])
          children.push(
            p(a.modelNotes[k], {
              children: [run(a.modelNotes[k], { italics: true, color: MUTED, size: 22 })],
            }),
          );
      }
      const notes = a.teacherNotes || a.teacher || {};
      for (const [key, heading] of [
        ["prompt", "Ask"],
        ["noTech", "Offline option"],
        ["challenge", "Extend"],
      ])
        if (notes[key]) children.push(p(`${heading}: ${notes[key]}`));
    }
  }
  return new Document({
    creator: "EduWonderLab",
    title: `${domain} practice · Grades ${band} · ${support}${teacher ? " · Teacher edition" : ""}`,
    description:
      "Original classroom language practice. Not an official WIDA test or proficiency score.",
    styles: {
      default: {
        document: {
          run: { font: "Aptos", size: band === "3-5" && !teacher ? 24 : 22, color: INK },
          paragraph: { spacing: { after: 85, line: 265 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "criteria",
          levels: [
            {
              level: 0,
              format: "bullet",
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 240, hanging: 160 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 880, bottom: 860, left: 936, right: 936, header: 400, footer: 400 },
          },
        },
        headers: {
          default: new Header({
            children: [
              p(
                `EDUWONDERLAB  /  ${domain.toUpperCase()}  /  GRADES ${band}  /  ${teacher ? "TEACHER" : "PRACTICE"}`,
                {
                  spacing: { after: 0 },
                  children: [
                    run(
                      `EDUWONDERLAB  /  ${domain.toUpperCase()}  /  GRADES ${band}  /  ${teacher ? "TEACHER" : "PRACTICE"}`,
                      { size: 18, bold: true, color: MUTED },
                    ),
                  ],
                },
              ),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                border: { top: { style: BorderStyle.SINGLE, size: 3, color: RULE, space: 5 } },
                children: [
                  run("Classroom practice · Not an official WIDA test", { size: 18, color: MUTED }),
                  run("     |     ", { size: 18 }),
                  new TextRun({
                    children: ["Page ", PageNumber.CURRENT, " of ", PageNumber.TOTAL_PAGES],
                    size: 18,
                    color: MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}
