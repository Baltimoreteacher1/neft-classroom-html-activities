// Activity Studio -> editable Word (.docx), built with the `docx` package. Real headings, numbered questions,
// real tables, borders as answer lines, page breaks, header/footer with page numbers, a document language and core
// properties. Never flattened to an image or a PDF. Web-runtime only (runs in Cloudflare Pages Functions).
//
//   buildDocx(activity, { part: "student" | "key" | "all", lang: "en" | "es" | "bi" }) -> Promise<Uint8Array>
//
// The student part carries no answers, hints, explanations or notes. The key part (and the second half of `all`)
// is a separate TEACHER COPY.

import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";
import { normalizeActivity } from "../../../access-practice-lab/src/studio/core/schema.js";
import { keyLines } from "../../../access-practice-lab/src/studio/print/paper-model.js";
import {
  normLang,
  PRINT_STRINGS,
  tr,
} from "../../../access-practice-lab/src/studio/print/strings.js";
import { questionBody } from "./docx-formats.js";
import {
  allBorders,
  boxed,
  FONT,
  gap,
  INK_BORDER,
  imageParagraph,
  label,
  mathTextRuns,
  PAGE,
  PT,
  padBorders,
  para,
  TEXT_W,
  table,
  textRun,
} from "./docx-kit.js";

const PARTS = new Set(["student", "key", "all"]);
const GREY = { fill: "F5F6F7", type: "clear", color: "auto" };

function organizer(c, b) {
  const o = PRINT_STRINGS.org;
  const t = (k) =>
    c.lang === "bi" ? `${o.en[k]} / ${o.es[k]}` : o[c.lang === "es" ? "es" : "en"][k];
  const tall = c.workspace === "roomy" ? 2400 : 1700;
  const w3 = Math.floor(TEXT_W / 3);
  const [p0 = "", ...rest] = b.prompts;
  const empty = (n) => Array.from({ length: n }, () => "");
  switch (b.kind) {
    case "kwl":
      return [
        table([[t("know"), t("want"), t("learned")], empty(3)], {
          widths: [w3, w3, w3],
          header: true,
          minHeight: tall,
        }),
      ];
    case "compare":
      return [
        table([[p0 || t("topic"), t("both"), rest[0] || t("topic")], empty(3)], {
          widths: [w3, w3, w3],
          header: true,
          minHeight: tall,
        }),
      ];
    case "cause-effect": {
      const rows = (b.prompts.length ? b.prompts : ["", ""]).map((p) => [
        t("cause"),
        "→",
        p || t("effect"),
      ]);
      return [
        table(
          rows.map((r) => r.map((x) => ({ text: x, align: x === "→" ? "center" : undefined }))),
          { widths: [4400, 1280, 4400], minHeight: 900 },
        ),
      ];
    }
    case "claim-evidence": {
      const ev = rest.length ? rest : ["", "", ""];
      return [
        table(
          [
            [{ text: p0 ? `${t("claim")}: ${p0}` : t("claim"), span: 1, shade: "E9ECEE" }],
            ...ev.map((x, i) => [x || `${t("evidence")} ${i + 1}`]),
            [t("reasoning")],
          ],
          { widths: [TEXT_W], minHeight: 900 },
        ),
      ];
    }
    case "sequence": {
      const steps = b.prompts.length ? b.prompts : ["", "", "", ""];
      return steps.flatMap((p, i) => [
        table([[{ text: `${i + 1}. ${p}` }]], { widths: [TEXT_W], minHeight: 700 }),
        ...(i < steps.length - 1
          ? [para("↓", { alignment: AlignmentType.CENTER, spacing: { after: 40 } }, { bold: true })]
          : []),
      ]);
    }
    default: {
      const sats = rest.length ? rest : ["", "", "", ""];
      const rows = [[{ text: p0 || t("main"), shade: "E9ECEE", align: "center" }, ...[]]];
      const half = Math.floor(TEXT_W / 2);
      return [
        table(rows, { widths: [TEXT_W], borders: allBorders(INK_BORDER), minHeight: 600 }),
        gap(80),
        table(
          Array.from({ length: Math.ceil(sats.length / 2) }, (_, i) => [
            sats[i * 2] ?? "",
            sats[i * 2 + 1] ?? "",
          ]),
          { widths: [half, half], minHeight: 1100 },
        ),
      ];
    }
  }
}

function vocab(c, b) {
  const gloss = c.spanish && b.items.some((i) => i.es);
  const ex = b.items.some((i) => i.example);
  const pics = c.visuals;
  const head = [
    c.t("term"),
    c.t("meaning"),
    ...(ex ? [c.t("example")] : []),
    ...(gloss ? [tr("es", "spanish")] : []),
    ...(pics ? [c.t("picture")] : []),
  ];
  const cols = head.length;
  const rows = [head];
  for (const i of b.items) {
    const row = [{ text: i.term, shade: "F5F6F7" }, i.def];
    if (ex) row.push(i.example);
    if (gloss) row.push(i.es);
    if (pics)
      row.push({
        children: [
          i.image?.src
            ? imageParagraph(i.image, {
                maxWidth: 70,
                maxHeight: 70,
                placeholder: c.t("picturePlaceholder"),
              }).paragraph
            : new Paragraph({ children: [] }),
        ],
      });
    rows.push(row);
  }
  const first = 1700;
  const widths = [
    first,
    ...Array.from({ length: cols - 1 }, () => Math.floor((TEXT_W - first) / (cols - 1))),
  ];
  return [
    h2(c.t("keyWords")),
    table(rows, { widths, header: true, minHeight: pics ? 1100 : undefined }),
    gap(),
  ];
}

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepNext: true,
    spacing: { before: 240, after: 100 },
    children: [textRun(text, { bold: true, size: PT(15), color: "111111" })],
  });

function studentBlocks(c, a) {
  const out = [];
  for (const b of a.blocks) {
    switch (b.type) {
      case "text":
        if (b.role === "heading") out.push(h2(b.text));
        else if (b.role === "directions")
          out.push(
            label(c.t("directions")),
            ...b.text.split(/\n{2,}/).map((x) => boxed(x.trim(), { shading: GREY })),
          );
        else for (const x of b.text.split(/\n{2,}/)) if (x.trim()) out.push(para(x.trim()));
        break;
      case "passage":
        if (b.title) out.push(h2(b.title));
        for (const x of b.text.split(/\n{2,}/))
          if (x.trim())
            out.push(boxed(x.trim(), { spacing: { before: 40, after: 140, line: 320 } }));
        out.push(gap(100));
        break;
      case "vocab":
        out.push(...vocab(c, b));
        break;
      case "image": {
        const r = imageParagraph(b, { placeholder: c.t("picturePlaceholder") });
        out.push(r.paragraph);
        if (b.caption)
          out.push(
            para(b.caption, { alignment: AlignmentType.CENTER }, { size: PT(11), italics: true }),
          );
        break;
      }
      case "math":
        out.push(
          para(
            b.text,
            { alignment: AlignmentType.CENTER, spacing: { before: 120, after: 160 } },
            { size: PT(17) },
          ),
        );
        break;
      case "table": {
        if (b.caption) out.push(label(b.caption));
        const cols = Math.max(b.headers.length, ...b.rows.map((r) => r.length), 1);
        const w = Math.floor(TEXT_W / cols);
        out.push(
          table(
            [b.headers.length ? b.headers : Array.from({ length: cols }, () => ""), ...b.rows],
            {
              widths: Array.from({ length: cols }, () => w),
              header: b.headers.length > 0,
            },
          ),
          gap(),
        );
        break;
      }
      case "organizer":
        out.push(...organizer(c, b), gap());
        break;
      case "audio":
        out.push(boxed(`${b.label || "Listen"} — ${c.t("listen")}`));
        break;
      case "question": {
        c.n += 1;
        const withImage = b.image?.src && b.format !== "hotspot";
        const kids = [];
        kids.push(
          new Paragraph({
            numbering: { reference: "questions", level: 0, instance: c.list },
            keepNext: true,
            keepLines: true,
            spacing: { before: 200, after: 100 },
            children: mathTextRuns(b.prompt, { bold: true }),
          }),
        );
        if (withImage) {
          const r = imageParagraph(b.image, { placeholder: c.t("picturePlaceholder") });
          kids.push(r.paragraph);
        }
        if (c.frames && b.frame)
          kids.push(
            para(
              `${c.t("sentenceStarter")}: ${b.frame}`,
              { indent: { left: 360 }, keepNext: true },
              { italics: true },
            ),
          );
        out.push(...kids, ...questionBody(c, b), gap(80));
        break;
      }
      default:
        break;
    }
  }
  if (!c.n) out.push(para(c.t("noQuestions")));
  return out;
}

function keyBlocks(c, a) {
  const out = [];
  out.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      border: padBorders(INK_BORDER),
      indent: { left: 140, right: 140 },
      spacing: { before: 80, after: 200 },
      children: [
        ...(c.after ? [new PageBreak()] : []),
        textRun(`${c.t("teacherCopy")} — ${c.t("answerKey")}`, {
          bold: true,
          size: PT(16),
          color: "000000",
        }),
      ],
    }),
    para(`${a.title}  ·  ${c.t("notForStudents")}`, {}, { size: PT(11) }),
  );
  const ctx = a.context;
  if (ctx.objective) out.push(para(`${c.t("objective")}: ${ctx.objective}`));
  if (ctx.standards.length)
    out.push(
      para(
        `${c.t("standards")}: ${ctx.standards.map((s) => s.code + (s.origin === "teacher" ? ` (${tr(c.lang === "es" ? "es" : "en", "teacherChosen")})` : "")).join("; ")}`,
      ),
    );
  const notes = [
    a.notes.teacher,
    ...a.blocks.filter((b) => b.type === "note").map((b) => b.text),
  ].filter(Boolean);
  if (notes.length) out.push(h2(c.t("teacherNotes")), ...notes.map((n) => para(n)));
  if (a.notes.misconceptions.length)
    out.push(
      h2(c.t("misconceptions")),
      ...a.notes.misconceptions.map((m) => para(m, { bullet: { level: 0 } })),
    );
  for (const b of a.blocks.filter((x) => x.type === "audio" && x.say))
    out.push(h2(`${c.t("readAloudScript")}${b.label ? `: ${b.label}` : ""}`), para(b.say));
  for (const q of a.blocks.filter((x) => x.type === "question")) {
    out.push(
      new Paragraph({
        numbering: { reference: "questions", level: 0, instance: c.list + 1 },
        keepNext: true,
        keepLines: true,
        spacing: { before: 200, after: 80 },
        children: mathTextRuns(q.prompt, { bold: true }),
      }),
    );
    const lines = keyLines(a, q);
    if (lines.length) {
      out.push(label(q.format === "short" ? c.t("sample") : c.t("answer")));
      for (const l of lines) out.push(para(l, { indent: { left: 360 }, spacing: { after: 40 } }));
    }
    if (q.format === "short" && q.rubric.length) {
      out.push(label(c.t("look")));
      for (const r of q.rubric)
        out.push(para(r, { indent: { left: 360 }, spacing: { after: 40 } }));
    }
    if (q.explanation) out.push(para(`${c.t("why")}: ${q.explanation}`, { indent: { left: 360 } }));
    if (q.misconception)
      out.push(para(`${c.t("misconception")}: ${q.misconception}`, { indent: { left: 360 } }));
    const help = [q.hint, c.frames && q.frame ? `${tr("en", "frame")}: ${q.frame}` : ""].filter(
      Boolean,
    );
    if (help.length)
      out.push(para(`${c.t("scaffold")}: ${help.join(" / ")}`, { indent: { left: 360 } }));
  }
  return out;
}

function headerFooter(title) {
  const run = (children) => new TextRun({ children, font: FONT, size: PT(11), color: "333333" });
  return {
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
            border: { bottom: { style: "single", size: 6, color: "888888", space: 2 } },
            children: [textRun(title, { size: PT(11), color: "333333" })],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              textRun("Page ", { size: PT(11) }),
              run([PageNumber.CURRENT]),
              textRun(" / ", { size: PT(11) }),
              run([PageNumber.TOTAL_PAGES]),
            ],
          }),
        ],
      }),
    },
  };
}

function makeContext(a, lang) {
  return {
    activity: a,
    lang,
    workspace: a.options.workspace,
    frames: a.supports.frames,
    spanish: a.supports.spanish,
    visuals: a.supports.visuals,
    t: (path) => tr(lang, path),
    n: 0,
    list: 1,
    after: false,
  };
}

/** @returns {Promise<Uint8Array>} */
export async function buildDocx(input, opts = {}) {
  const a = normalizeActivity(input);
  const part = PARTS.has(opts.part) ? opts.part : opts.part === "teacher" ? "key" : "student";
  const lang = normLang(opts.lang);
  const c = makeContext(a, lang);
  const body = [];
  if (part !== "key") {
    body.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        spacing: { after: 80 },
        children: [textRun(a.title, { bold: true, size: PT(24) })],
      }),
      new Paragraph({
        spacing: { before: 120, after: 200 },
        children: [
          textRun(`${c.t("name")}: ${"_".repeat(30)}      ${c.t("date")}: ${"_".repeat(16)}`, {
            bold: true,
          }),
        ],
      }),
    );
    if (a.context.objective)
      body.push(boxed(`${c.t("goal")}: ${a.context.objective}`, { shading: GREY }));
    body.push(...studentBlocks(c, a));
  }
  if (part !== "student") {
    c.after = part === "all";
    body.push(...keyBlocks(c, a));
  }
  const doc = new Document({
    creator: "The Language Page",
    lastModifiedBy: "The Language Page",
    title: a.title,
    subject: [a.context.subject, a.context.grade ? `Grade ${a.context.grade}` : ""]
      .filter(Boolean)
      .join(" · "),
    description: a.description || "Worksheet made with Activity Studio",
    keywords: "worksheet, Activity Studio",
    styles: {
      default: {
        document: {
          run: { font: FONT, size: PT(12), language: { value: lang === "es" ? "es-US" : "en-US" } },
          paragraph: { spacing: { line: 276 } },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "questions",
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 540, hanging: 540 } },
                run: { bold: true, font: FONT, size: PT(12) },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE.width, height: PAGE.height },
            margin: {
              top: PAGE.margin,
              bottom: PAGE.margin,
              left: PAGE.margin,
              right: PAGE.margin,
            },
          },
        },
        ...headerFooter(a.title),
        children: body,
      },
    ],
  });
  return new Uint8Array(await Packer.toArrayBuffer(doc));
}
