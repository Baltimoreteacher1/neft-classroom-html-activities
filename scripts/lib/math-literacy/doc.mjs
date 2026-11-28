/**
 * doc.mjs — one block model, three outputs: the student packet, the answer key and the program guide are written once as
 * blocks and rendered to print HTML (-> PDF with headless Chrome) and to Word. Sections flow continuously: no forced page
 * breaks and tight spacing; only whole problems are kept together.
 */
import { GRADES, LIT_STRATEGY } from "./content.mjs";
import { esc, gradeLabel, ROUTINES } from "./pages.mjs";

const T = (text, o = {}) => ({ k: "p", text, ...o });
const G = (...blocks) => ({ k: "group", blocks });

function readsFor(role) {
  return {
    retell: [
      "Read 1: Retell it. What is the story about?",
      "Read 2: Circle the numbers. Underline what they count.",
      "Read 3: Say the question in your own words.",
    ],
    numbers: [
      "Read 1: What is happening?",
      "Read 2: Circle each number and underline its unit.",
      "Read 3: What is the question asking for?",
    ],
    extra: [
      "Read 1: What is happening?",
      "Read 2: Circle the numbers. Cross out any the question does not need.",
      "Read 3: What is the question asking for?",
    ],
    draw: [
      "Read 1: What is happening?",
      "Read 2: Draw it. Label each part.",
      "Read 3: What is the question asking for?",
    ],
  }[role];
}

export function studentDoc(g) {
  const b = [];
  b.push({ k: "title", text: `${gradeLabel(g)} Math Literacy & Fluency`, sub: "Student Packet" });
  b.push({ k: "namedate" });
  b.push(T(`Goal: ${g.fluencyGoal}`, { bold: true }));
  b.push({
    k: "list",
    items: [
      "Do one unit at a time. Each unit has six parts.",
      "Read every word problem three times before you solve it.",
      "Fluency pages have no clock. Aim to get them right, then get them easier.",
    ],
  });
  for (const u of g.units) {
    b.push({ k: "h1", text: `Unit ${u.index}: ${u.title}` });
    b.push(T(u.domain, { italic: true }));
    b.push({ k: "box", title: `Reading move: ${u.strategy.name}`, text: u.strategy.move });
    b.push({ k: "h2", text: "1. Word wall" });
    b.push({
      k: "table",
      head: ["Word", "En español", "What it means", "Example", "My own sentence"],
      widths: [13, 18, 24, 21, 24],
      rows: u.vocab.map((w) => [w.term, w.es, w.def, w.ex, ""]),
      tall: true,
    });
    b.push({ k: "h2", text: "2. Read it. Say it. Solve it." });
    u.wp.forEach((p, i) => {
      b.push(
        G(
          { k: "h3", text: `Problem ${i + 1}` },
          T(p.text, { big: true }),
          { k: "checks", items: readsFor(p.role) },
          T("Show your thinking:"),
          { k: "lines", n: 3 },
          T(p.frame, { italic: true }),
        ),
      );
    });
    b.push({ k: "h2", text: "3. Math talk and write" });
    b.push(
      G(
        T(u.talk.prompt, { bold: true }),
        T(u.talk.frame, { italic: true }),
        { k: "lines", n: 3 },
        { k: "checks", items: ["I said my answer out loud to a partner."] },
      ),
    );
    b.push({ k: "h2", text: "4. Fact fluency (no clock)" });
    b.push({ k: "grid", cols: 4, cells: u.fact.map((f, i) => `${i + 1}. ${f.q}`) });
    b.push(T("Checked with a partner:  ☐     My stars:  ☆ ☆ ☆"));
    b.push({ k: "h2", text: "5. Skill fluency" });
    b.push({ k: "grid", cols: 2, cells: u.skill.map((f, i) => `${i + 1}. ${f.q}`), tall: true });
    b.push({ k: "h2", text: "6. Quick check" });
    const q = u.quick;
    b.push(
      G(T(`1. ${q.vocab.q}`, { bold: true }), { k: "list", items: q.vocab.choices, plain: true }),
    );
    b.push(G(T(`2. ${q.skill.q}`, { bold: true }), { k: "lines", n: 1 }));
    b.push(
      G(T(`3. ${q.wp.text}`, { bold: true }), T(q.wp.frame, { italic: true }), {
        k: "lines",
        n: 2,
      }),
    );
    b.push(
      G(T(`4. Use the word "${q.vocab.term}" in a sentence.`, { bold: true }), {
        k: "lines",
        n: 2,
      }),
    );
    b.push(
      T(
        "How am I doing?   1 = I need help   2 = I am getting there   3 = I can do it   4 = I can teach it   Circle one:  1   2   3   4",
        { bold: true },
      ),
    );
  }
  b.push({ k: "h1", text: "My progress" });
  b.push({
    k: "table",
    head: [
      "Unit",
      "Word wall",
      "Problems",
      "Math talk",
      "Fluency",
      "Quick check",
      "How I am doing (1–4)",
    ],
    widths: [28, 10, 11, 11, 10, 11, 19],
    rows: g.units.map((u) => [`${u.index}. ${u.title}`, "☐", "☐", "☐", "☐", "☐", ""]),
    tall: true,
  });
  return b;
}

const WP_NOTE = {
  retell: "Listen for a retell in the student's own words, not a copy of the text.",
  numbers: "Check that each number is circled and its unit is underlined.",
  extra: "One number is extra. Students should cross it out and say why it is not needed.",
  draw: "Check for a labeled picture before the answer.",
};

export function keyDoc(g) {
  const b = [];
  b.push({
    k: "title",
    text: `${gradeLabel(g)} Math Literacy & Fluency`,
    sub: "Answer Key and Teacher Notes",
  });
  b.push(T(`Goal: ${g.fluencyGoal}`, { bold: true }));
  b.push({
    k: "list",
    items: [
      "Every numeric answer in this key was computed and then re-verified by a second program.",
      "For fact and skill sets: 8 of 8 means move on; 6 or 7 means one more set next week; 5 or fewer means reteach with the unit's word wall and a worked example. Never time a fluency set.",
      "Math talk is scored by listening, not by a single right answer. See each unit's list.",
    ],
  });
  for (const u of g.units) {
    b.push({ k: "h1", text: `Unit ${u.index}: ${u.title}` });
    b.push(T(`Reading move: ${u.strategy.name}. ${u.strategy.move}`, { italic: true }));
    b.push({ k: "h2", text: "Word wall" });
    b.push(T(u.vocab.map((w) => `${w.term} = ${w.es}`).join("   ·   ")));
    b.push(
      T(
        "Student sentences: accept any sentence that uses the word correctly. Look for the word's meaning in the sentence, not just the word.",
      ),
    );
    b.push({ k: "h2", text: "Word problems" });
    b.push({
      k: "table",
      head: ["#", "Answer", "Teacher notes"],
      widths: [6, 22, 72],
      rows: u.wp.map((p, i) => [
        String(i + 1),
        `${p.a}`,
        [
          WP_NOTE[p.role],
          p.extra != null ? `Extra number: ${p.extra}.` : "",
          p.note || "",
          `Key: ${p.expr.replace(/\*/g, " × ").replace(/\//g, " ÷ ")}`,
        ]
          .filter(Boolean)
          .join(" "),
      ]),
    });
    b.push({ k: "h2", text: "Math talk" });
    b.push({
      k: "list",
      items: [
        `Uses at least one unit word: ${u.vocab.map((w) => w.term).join(", ")}.`,
        "Uses the sentence frame and fills every blank with a math idea, not a guess.",
        "Names numbers together with their units.",
        "Gives a reason with because.",
      ],
    });
    b.push({ k: "h2", text: "Fact fluency" });
    b.push({ k: "grid", cols: 4, cells: u.fact.map((f, i) => `${i + 1}. ${f.a}`) });
    b.push({ k: "h2", text: "Skill fluency" });
    b.push({ k: "grid", cols: 4, cells: u.skill.map((f, i) => `${i + 1}. ${f.a}`) });
    b.push({ k: "h2", text: "Quick check" });
    b.push(
      T(
        `1. ${u.quick.vocab.a}     2. ${u.quick.skill.a}     3. ${u.quick.wp.a}     4. Any correct sentence with "${u.quick.vocab.term}".`,
      ),
    );
  }
  return b;
}

export function guideDoc(built) {
  const b = [];
  b.push({ k: "title", text: "Math Literacy & Fluency, K–8", sub: "Program Guide" });
  b.push(
    T(
      "A complete program for building math reading, math talk, fact fluency and skill fluency in every grade, K–8. Six units per grade. Every unit has the same six parts, so students always know what to do.",
    ),
  );
  b.push({ k: "h1", text: "A realistic weekly rhythm" });
  b.push(
    T("Each unit takes about two weeks at 15 to 25 minutes a day. Adjust to the time you have."),
  );
  b.push({
    k: "table",
    head: ["Day", "Do this", "Minutes"],
    widths: [14, 70, 16],
    rows: [
      ["1", "Word wall: say, see, use, show. Notice and wonder the first word problem.", "20"],
      ["2", "Read it. Say it. Solve it: problems 1 and 2 with Three Reads.", "20"],
      ["3", "Problem 3 and math talk and write with a partner.", "20"],
      ["4", "Fact fluency and skill fluency rounds. Check, then say one strategy.", "15"],
      ["5", "Quick check and the 1 to 4 goal.", "15"],
    ],
  });
  b.push({ k: "h1", text: "The six parts of every unit" });
  b.push({
    k: "list",
    items: [
      "Word wall: five words with a student-friendly meaning, an example and the Spanish word.",
      "Read it. Say it. Solve it.: three word problems with the Three Reads routine and one reading move per unit.",
      "Math talk and write: a prompt with a sentence frame.",
      "Fact fluency: eight facts, untimed.",
      "Skill fluency: eight grade-level skills, untimed.",
      "Quick check and goal: a vocabulary item, a skill item and a word problem, then a 1 to 4 rating.",
    ],
  });
  b.push({ k: "h1", text: "Scope and sequence" });
  b.push({
    k: "table",
    head: ["Grade", "Unit 1", "Unit 2", "Unit 3", "Unit 4", "Unit 5", "Unit 6"],
    widths: [13, 14.5, 14.5, 14.5, 14.5, 14.5, 14.5],
    rows: built.map((g) => [gradeLabel(g), ...g.units.map((u) => u.title)]),
  });
  b.push({ k: "h1", text: "Fluency goal by grade" });
  b.push({
    k: "table",
    head: ["Grade", "Goal"],
    widths: [20, 80],
    rows: GRADES.map((g) => [gradeLabel(g), g.fluencyGoal]),
  });
  b.push({ k: "h1", text: "The six routines" });
  for (const r of ROUTINES) {
    b.push(
      G(
        { k: "h3", text: `${r.name} (${r.when})` },
        { k: "list", items: r.steps, ordered: true },
        T(`Frames: ${r.frames.join("   ·   ")}`, { italic: true }),
      ),
    );
  }
  b.push({ k: "h1", text: "One reading move for each unit" });
  b.push({
    k: "table",
    head: ["Unit", "Move", "What students do"],
    widths: [12, 24, 64],
    rows: LIT_STRATEGY.map((s, i) => [`Unit ${i + 1}`, s.name, s.move]),
  });
  b.push({ k: "h1", text: "Supporting every learner" });
  b.push({
    k: "list",
    items: [
      "Multilingual learners: use the Spanish word help, reuse the sentence frames and let students rehearse with a partner before writing.",
      "Students who need more: use the New set button on the practice page for fresh fluency items, and have students write their own word problem for the unit.",
      "Students who need less: do problems 1 and 2 and one fluency set, then move to the quick check.",
      "No materials are needed. Everything is paper and pencil.",
    ],
  });
  b.push({ k: "h1", text: "Frequently asked questions" });
  b.push({
    k: "list",
    items: [
      "Is it timed? No. Fluency here comes from accuracy and strategies. There is no clock anywhere.",
      "Does it match my curriculum? It follows widely used K–8 mathematics domains. Use the scope and sequence to place each unit next to what you are teaching.",
      "Where is my students' work saved? On the device they use. Nothing is sent to a server.",
      "Can I edit the Word files? Yes. They are standard Word documents.",
    ],
  });
  b.push(
    T("Please do not share or resell these files. Thank you for respecting the work behind them.", {
      italic: true,
    }),
  );
  return b;
}

/* ------------------------- print HTML ------------------------- */
const PRINT_CSS = `
@font-face{font-family:"Atkinson Hyperlegible";font-weight:400;src:url(__F400__) format("woff2")}
@font-face{font-family:"Atkinson Hyperlegible";font-weight:700;src:url(__F700__) format("woff2")}
@page{size:Letter;margin:.6in}
*{box-sizing:border-box}
body{font:11pt/1.35 "Atkinson Hyperlegible",Arial,sans-serif;color:#24323F;margin:0}
h1{font-size:17pt;color:#17324D;margin:14pt 0 3pt;border-bottom:3px solid #1FA6A2;padding-bottom:2pt}
h2{font-size:13pt;color:#17324D;margin:9pt 0 3pt}
h3{font-size:11.5pt;color:#17324D;margin:6pt 0 2pt}
p{margin:2pt 0}
.title{margin:0 0 4pt}.title h1{font-size:23pt;border:0;margin:0}.title .sub{font-size:13pt;color:#0F6F6C;font-weight:700}
.nd{display:flex;gap:18pt;margin:6pt 0}.nd span{flex:1;border-bottom:1.5px solid #24323F;padding-bottom:1pt}
.box{background:#FFF3D8;border:1px solid #e8cf8e;border-radius:5pt;padding:4pt 7pt;margin:4pt 0}
table{border-collapse:collapse;width:100%;margin:3pt 0}
th{background:#17324D;color:#fff;font-size:9.5pt;text-align:left;padding:3pt 5pt;border:1px solid #17324D}
td{border:1px solid #9aa6b0;padding:3pt 5pt;vertical-align:top;font-size:10pt}
td.es{color:#0F6F6C;font-weight:700}
table.tall td{height:30pt}
.grid{display:grid;gap:3pt 10pt;margin:3pt 0}
.grid div{border:1px solid #cfc8b6;border-radius:4pt;padding:3pt 6pt}
.grid.tall div{padding:6pt}
.ln{border-bottom:1px solid #8a98a5;height:17pt}
.chk{margin:1pt 0}
ul,ol{margin:2pt 0 2pt 16pt;padding:0}
li{margin:1pt 0}
.big{font-size:12pt}
.grp{break-inside:avoid}
.i{font-style:italic}.b{font-weight:700}
`;

function renderBlock(x) {
  switch (x.k) {
    case "title":
      return `<div class="title"><h1>${esc(x.text)}</h1><div class="sub">${esc(x.sub)}</div></div>`;
    case "namedate":
      return `<div class="nd"><span>Name:</span><span>Date:</span><span>Class:</span></div>`;
    case "h1":
      return `<h1>${esc(x.text)}</h1>`;
    case "h2":
      return `<h2>${esc(x.text)}</h2>`;
    case "h3":
      return `<h3>${esc(x.text)}</h3>`;
    case "p":
      return `<p class="${x.italic ? "i " : ""}${x.bold ? "b " : ""}${x.big ? "big" : ""}">${esc(x.text)}</p>`;
    case "box":
      return `<div class="box"><span class="b">${esc(x.title)}.</span> ${esc(x.text)}</div>`;
    case "list":
      return x.plain
        ? x.items.map((i) => `<p style="margin-left:12pt">${esc(i)}</p>`).join("")
        : `<${x.ordered ? "ol" : "ul"}>${x.items.map((i) => `<li>${esc(i)}</li>`).join("")}</${x.ordered ? "ol" : "ul"}>`;
    case "checks":
      return x.items.map((i) => `<p class="chk">☐ ${esc(i)}</p>`).join("");
    case "lines":
      return Array.from({ length: x.n }, () => `<div class="ln"></div>`).join("");
    case "grid":
      return `<div class="grid ${x.tall ? "tall" : ""}" style="grid-template-columns:repeat(${x.cols},1fr)">${x.cells.map((c) => `<div>${esc(c)}</div>`).join("")}</div>`;
    case "table":
      return `<table class="${x.tall ? "tall" : ""}"><thead><tr>${x.head.map((h, i) => `<th style="width:${x.widths?.[i] ?? ""}%">${esc(h)}</th>`).join("")}</tr></thead><tbody>${x.rows.map((r) => `<tr>${r.map((c, i) => `<td${x.head[i] === "En español" ? ' class="es"' : ""}>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    case "group":
      return `<div class="grp">${x.blocks.map(renderBlock).join("")}</div>`;
    default:
      throw new Error(`doc: unknown block ${x.k}`);
  }
}

export function toHtml(blocks, title, fontDir) {
  const css = PRINT_CSS.replace(
    "__F400__",
    `file://${fontDir}/atkinson-hyperlegible-0aa3443e.woff2`,
  ).replace("__F700__", `file://${fontDir}/atkinson-hyperlegible-ef295152.woff2`);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${css}</style></head><body>${blocks.map(renderBlock).join("\n")}</body></html>`;
}

/* ------------------------- Word ------------------------- */
export async function toDocx(blocks, title) {
  const d = await import("docx");
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    ShadingType,
    HeadingLevel,
    Footer,
    PageNumber,
    AlignmentType,
  } = d;
  const FONT = "Arial";
  const NAVY = "17324D";
  const run = (text, o = {}) =>
    new TextRun({
      text,
      font: FONT,
      size: o.size ?? 22,
      bold: o.bold,
      italics: o.italic,
      color: o.color,
    });
  const border = { style: BorderStyle.SINGLE, size: 4, color: "9AA6B0" };
  const borders = { top: border, bottom: border, left: border, right: border };
  const out = [];
  const para = (children, o = {}) =>
    new Paragraph({
      children,
      spacing: { before: o.before ?? 20, after: o.after ?? 40 },
      keepNext: o.keepNext,
      indent: o.indent,
      heading: o.heading,
      border: o.border,
    });

  function push(x, keep) {
    switch (x.k) {
      case "title":
        out.push(
          para([run(x.text, { size: 44, bold: true, color: NAVY })], { after: 0 }),
          para([run(x.sub, { size: 26, bold: true, color: "0F6F6C" })], { after: 80 }),
        );
        break;
      case "namedate":
        out.push(
          para(
            [run("Name: ______________________    Date: ______________    Class: ______________")],
            { before: 80, after: 80 },
          ),
        );
        break;
      case "h1":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            keepNext: true,
            spacing: { before: 240, after: 60 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "1FA6A2", space: 1 } },
            children: [run(x.text, { size: 34, bold: true, color: NAVY })],
          }),
        );
        break;
      case "h2":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            keepNext: true,
            spacing: { before: 140, after: 40 },
            children: [run(x.text, { size: 26, bold: true, color: NAVY })],
          }),
        );
        break;
      case "h3":
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            keepNext: true,
            spacing: { before: 100, after: 30 },
            children: [run(x.text, { size: 23, bold: true, color: NAVY })],
          }),
        );
        break;
      case "p":
        out.push(
          para([run(x.text, { bold: x.bold, italic: x.italic, size: x.big ? 24 : 22 })], {
            keepNext: keep,
          }),
        );
        break;
      case "box":
        out.push(
          new Paragraph({
            spacing: { before: 60, after: 60 },
            shading: { type: ShadingType.CLEAR, fill: "FFF3D8", color: "auto" },
            children: [run(`${x.title}. `, { bold: true }), run(x.text)],
          }),
        );
        break;
      case "list":
        x.items.forEach((i, n) =>
          out.push(
            para([run(x.plain ? i : `${x.ordered ? `${n + 1}.` : "•"} ${i}`)], {
              indent: { left: x.plain ? 360 : 300 },
              keepNext: keep,
            }),
          ),
        );
        break;
      case "checks":
        x.items.forEach((i) => out.push(para([run(`☐ ${i}`)], { keepNext: keep })));
        break;
      case "lines": {
        const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
        const line = { style: BorderStyle.SINGLE, size: 6, color: "8A98A5" };
        out.push(
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: [9360],
            rows: Array.from(
              { length: x.n },
              () =>
                new TableRow({
                  cantSplit: true,
                  height: { value: 400, rule: "atLeast" },
                  children: [
                    new TableCell({
                      width: { size: 9360, type: WidthType.DXA },
                      borders: { top: none, left: none, right: none, bottom: line },
                      children: [para([run(" ")], { before: 0, after: 0 })],
                    }),
                  ],
                }),
            ),
          }),
        );
        break;
      }
      case "grid": {
        const rows = [];
        for (let i = 0; i < x.cells.length; i += x.cols) {
          const slice = x.cells.slice(i, i + x.cols);
          while (slice.length < x.cols) slice.push("");
          rows.push(
            new TableRow({
              cantSplit: true,
              children: slice.map(
                (c) =>
                  new TableCell({
                    borders,
                    width: { size: Math.floor(9360 / x.cols), type: WidthType.DXA },
                    margins: {
                      top: x.tall ? 100 : 50,
                      bottom: x.tall ? 100 : 50,
                      left: 100,
                      right: 100,
                    },
                    children: [para([run(c)], { before: 0, after: 0 })],
                  }),
              ),
            }),
          );
        }
        out.push(
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: Array(x.cols).fill(Math.floor(9360 / x.cols)),
            rows,
          }),
          para([run(" ")], { before: 0, after: 20 }),
        );
        break;
      }
      case "table": {
        const widths = (x.widths || x.head.map(() => 100 / x.head.length)).map((w) =>
          Math.round((w / 100) * 9360),
        );
        const sum = widths.reduce((a, b) => a + b, 0);
        widths[widths.length - 1] += 9360 - sum;
        const head = new TableRow({
          tableHeader: true,
          children: x.head.map(
            (h, i) =>
              new TableCell({
                borders,
                width: { size: widths[i], type: WidthType.DXA },
                shading: { type: ShadingType.CLEAR, fill: NAVY, color: "auto" },
                margins: { top: 50, bottom: 50, left: 90, right: 90 },
                children: [
                  para([run(h, { bold: true, color: "FFFFFF", size: 19 })], {
                    before: 0,
                    after: 0,
                  }),
                ],
              }),
          ),
        });
        const body = x.rows.map(
          (r) =>
            new TableRow({
              cantSplit: true,
              children: r.map(
                (c, i) =>
                  new TableCell({
                    borders,
                    width: { size: widths[i], type: WidthType.DXA },
                    margins: {
                      top: x.tall ? 110 : 50,
                      bottom: x.tall ? 110 : 50,
                      left: 90,
                      right: 90,
                    },
                    children: [
                      para(
                        [
                          run(c, {
                            size: 20,
                            bold: x.head[i] === "En español",
                            color: x.head[i] === "En español" ? "0F6F6C" : undefined,
                          }),
                        ],
                        { before: 0, after: 0 },
                      ),
                    ],
                  }),
              ),
            }),
        );
        out.push(
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            columnWidths: widths,
            rows: [head, ...body],
          }),
          para([run(" ")], { before: 0, after: 20 }),
        );
        break;
      }
      case "group":
        x.blocks.forEach((bl, i) => push(bl, i < x.blocks.length - 1));
        break;
      default:
        throw new Error(`doc: unknown block ${x.k}`);
    }
  }
  blocks.forEach((x) => push(x, false));
  const doc = new Document({
    creator: "Mr. Neft",
    title,
    styles: { default: { document: { run: { font: FONT, size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 864, right: 1440, bottom: 864, left: 1440 },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  run(`${title} · page `, { size: 16, color: "5a6773" }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT,
                    size: 16,
                    color: "5a6773",
                  }),
                ],
              }),
            ],
          }),
        },
        children: out,
      },
    ],
  });
  return Packer.toBuffer(doc);
}
