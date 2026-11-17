// Goal setting: the sheet model (sheet.js buildSheet) as a real Word file (.docx), built in the browser with no
// library: a handful of XML parts in a stored zip (assets/lib/zip-store.js, the same writer the site's other
// downloads use). Headings use real styles, tables mark their header row, links are real hyperlinks, the document
// language and title are set, so the file is editable and screen-reader friendly. Pure: returns bytes.
import { zipStore } from "../../../assets/lib/zip-store.js";

const W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
const R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const xe = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

const INK = "17304A";
const TEAL = "0F766E";
const MUTE = "55606B";

/** One text run. */
function run(text, o = {}) {
  const pr = [
    o.link ? '<w:rStyle w:val="Hyperlink"/>' : "",
    o.b ? "<w:b/>" : "",
    o.i ? "<w:i/>" : "",
    o.color ? `<w:color w:val="${o.color}"/>` : "",
    o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : "",
  ].join("");
  return `<w:r>${pr ? `<w:rPr>${pr}</w:rPr>` : ""}<w:t xml:space="preserve">${xe(text)}</w:t></w:r>`;
}

/** English first, Spanish second (italic, muted) on its own line inside one paragraph. */
function langRuns(texts, o = {}) {
  return texts
    .map((t, i) =>
      i ? `<w:r><w:br/></w:r>${run(t, { ...o, i: true, color: o.color || MUTE })}` : run(t, o),
    )
    .join("");
}

function para(inner, o = {}) {
  const pPr = [
    o.style ? `<w:pStyle w:val="${o.style}"/>` : "",
    o.keep ? "<w:keepNext/>" : "",
    o.border
      ? '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="8A949E"/></w:pBdr>'
      : "",
    `<w:spacing w:before="${o.before ?? 0}" w:after="${o.after ?? 80}"${o.line ? ` w:line="${o.line}" w:lineRule="auto"` : ""}/>`,
    o.ind ? `<w:ind w:left="${o.ind}" w:hanging="${o.hang || 0}"/>` : "",
    o.align ? `<w:jc w:val="${o.align}"/>` : "",
  ].join("");
  return `<w:p><w:pPr>${pPr}</w:pPr>${inner}</w:p>`;
}

function cell(inner, width, o = {}) {
  const shade = o.shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shade}"/>` : "";
  return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${shade}<w:tcMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/></w:tcMar></w:tcPr>${inner || para("")}</w:tc>`;
}

function table(rows, widths, o = {}) {
  const border = o.noBorder ? "none" : "single";
  const b = (n) => `<w:${n} w:val="${border}" w:sz="4" w:space="0" w:color="B6BEC6"/>`;
  const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const body = rows
    .map(
      (cells, r) =>
        `<w:tr><w:trPr><w:cantSplit/>${o.header && r === 0 ? "<w:tblHeader/>" : ""}${o.height ? `<w:trHeight w:val="${o.height}" w:hRule="atLeast"/>` : ""}</w:trPr>${cells.join("")}</w:tr>`,
    )
    .join("");
  return `<w:tbl><w:tblPr><w:tblW w:w="${widths.reduce((a, c) => a + c, 0)}" w:type="dxa"/><w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(b).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${body}</w:tbl>`;
}

/** Build the .docx bytes for a sheet. */
/** Build the .docx bytes for one sheet, or for several (a whole class) with a page break between them. */
export function sheetDocx(input) {
  const sheets = Array.isArray(input) ? input : [input];
  const s = sheets[0];
  const rels = [];
  const link = (href, inner) => {
    const id = `rId${rels.length + 10}`;
    rels.push(
      `<Relationship Id="${id}" Type="${R}/hyperlink" Target="${xe(href)}" TargetMode="External"/>`,
    );
    return `<w:hyperlink r:id="${id}" w:history="1">${inner}</w:hyperlink>`;
  };
  const body = [];
  sheets.forEach((s, sheetNo) => {
  if (sheetNo) body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
  const L = s.labels;
  const h2 = (texts) =>
    para(langRuns(texts, { b: true, color: TEAL, sz: 26 }), {
      style: "Heading2",
      keep: true,
      before: 200,
      after: 80,
    });
  const h3 = (texts) =>
    para(langRuns(texts, { b: true, color: INK, sz: 22 }), { keep: true, before: 100, after: 40 });

  body.push(
    para(langRuns(s.title, { b: true, color: INK, sz: 40 }), { style: "Title", after: 40 }),
  );
  body.push(para(langRuns(s.timeframe, { color: MUTE, sz: 22 }), { after: 120 }));

  // About: two label/value pairs per row.
  const pairs = [];
  for (let i = 0; i < s.info.length; i += 2) {
    const a = s.info[i];
    const c = s.info[i + 1];
    pairs.push([
      cell(para(langRuns(a.label, { b: true, sz: 20, color: MUTE })), 1700, { shade: "F2EFE8" }),
      cell(para(run(a.value || " ", { sz: 22 })), 3100),
      cell(para(c ? langRuns(c.label, { b: true, sz: 20, color: MUTE }) : ""), 1700, {
        shade: c ? "F2EFE8" : undefined,
      }),
      cell(para(c ? run(c.value || " ", { sz: 22 }) : ""), 3100),
    ]);
  }
  body.push(table(pairs, [1700, 3100, 1700, 3100], { height: 380 }));

  for (const g of s.goals) {
    body.push(h2([...g.domain.map((d, i) => (i === 0 ? `${g.n} · ${d}` : d))]));
    if (s.showStudent) {
      body.push(h3(L.myGoal));
      body.push(para(langRuns(g.student, { b: true, sz: 26, color: INK }), { after: 40 }));
      body.push(
        para(
          `${run(`${L.measure.join(" / ")}: `, { sz: 20, color: MUTE })}${run(g.measureStudent.join(" / "), { b: true, sz: 22 })}`,
          { after: 80 },
        ),
      );
    }
    if (s.showTeacher) {
      body.push(h3(L.goal));
      body.push(
        para(
          `${langRuns(g.teacher, { sz: 22 })}${run(" ")}${run(g.measureTeacher.join(" / "), { b: true, sz: 22 })}`,
          { after: 80 },
        ),
      );
    }
    body.push(h3(L.steps));
    if (g.steps.length) {
      for (const st of g.steps) {
        const text = langRuns(st.text, { sz: 22, link: Boolean(st.href) });
        body.push(
          para(`${run("☐ ", { sz: 24 })}${st.href ? link(st.href, text) : text}`, {
            ind: 360,
            hang: 360,
            after: 40,
          }),
        );
      }
    } else {
      body.push(para("", { border: true, after: 200 }), para("", { border: true, after: 120 }));
    }
    if (g.goalLink && !g.steps.some((st) => st.href === g.goalLink))
      body.push(
        para(link(g.goalLink, langRuns(L.practice, { sz: 20, link: true })), { after: 60 }),
      );
    body.push(h3(L.evidence));
    if (g.evidence.length)
      for (const e of g.evidence)
        body.push(
          para(`${run("• ")}${langRuns(e, { sz: 22 })}`, { ind: 360, hang: 240, after: 30 }),
        );
    else body.push(para("", { border: true, after: 160 }));
  }

  const bulletCell = (items, w) =>
    cell(
      items.length
        ? items
            .map((t) =>
              para(`${run("• ")}${langRuns(t, { sz: 21 })}`, { ind: 300, hang: 240, after: 30 }),
            )
            .join("")
        : para("", { border: true, after: 160 }),
      w,
    );
  body.push(
    table(
      [
        [
          cell(para(langRuns(L.teacherSup, { b: true, color: INK, sz: 22 })), 4900, {
            shade: "EAF3F1",
          }),
          cell(para(langRuns(L.familySup, { b: true, color: INK, sz: 22 })), 4900, {
            shade: "EAF3F1",
          }),
        ],
        [bulletCell(s.teacherSupports, 4900), bulletCell(s.familySupports, 4900)],
      ],
      [4900, 4900],
      { header: true },
    ),
  );

  if (s.checkins.length) {
    body.push(h2(L.checkins));
    const head = [
      ["#", 500],
      [L.date, 2200],
      [L.rating, 3300],
      [L.note, 3800],
    ].map(([t, w]) =>
      cell(
        para(
          Array.isArray(t)
            ? langRuns(t, { b: true, sz: 20, color: INK })
            : run(t, { b: true, sz: 20 }),
        ),
        w,
        { shade: "EAF3F1" },
      ),
    );
    const rows = [
      head,
      ...s.checkins.map((c) => [
        cell(para(run(String(c.n), { b: true })), 500),
        cell(para(run(c.date, { sz: 21 })), 2200),
        cell(
          para(run(s.scale.map((x) => x.mark).join("   "), { sz: 26 }), { align: "center" }),
          3300,
        ),
        cell("", 3800),
      ]),
    ];
    body.push(table(rows, [500, 2200, 3300, 3800], { header: true, height: 460 }));
    body.push(
      para(
        s.scale
          .map(
            (x, i) =>
              `${i ? run("    ") : ""}${run(`${x.mark} `, { sz: 22 })}${langRuns(x.label, { sz: 18, color: MUTE })}`,
          )
          .join(""),
        { before: 60, after: 80 },
      ),
    );
  }
  if (s.reflections.length) {
    body.push(h2(L.reflect));
    for (const r of s.reflections)
      body.push(
        para(langRuns(r, { sz: 21, color: INK }), { after: 20 }),
        para("", { border: true, after: 140 }),
      );
  }
  if (s.celebrations.length) {
    body.push(h2(L.celebrate));
    for (const c of s.celebrations)
      body.push(
        para(`${run("☐ ", { sz: 24 })}${langRuns(c, { sz: 22 })}`, {
          ind: 360,
          hang: 360,
          after: 30,
        }),
      );
  }
  body.push(h2(L.sign));
  body.push(
    table(
      [
        [L.signStudent, L.signTeacher, L.signFamily].map((l) =>
          cell(
            `${para("", { after: 360 })}${para(`${langRuns(l, { sz: 18, color: MUTE })}${run(" · ", { sz: 18 })}${langRuns(L.date, { sz: 18, color: MUTE })}`)}`,
            3300,
          ),
        ),
      ],
      [3300, 3300, 3300],
      { noBorder: true },
    ),
  );
  body.push(
    para(
      `${langRuns(L.privacy, { sz: 16, color: MUTE })}${run(" · ", { sz: 16 })}${link("https://thelanguagepage.com/", run("thelanguagepage.com", { sz: 16, link: true }))}`,
      { before: 160, after: 0 },
    ),
  );

  });
  const lang = s.lang === "es" ? "es-US" : "en-US";
  const title = s.title.join(" / ");
  const document = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body.join("")}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="900" w:right="1000" w:bottom="900" w:left="1000" w:header="500" w:footer="500" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri" w:eastAsia="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="${lang}"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/></w:rPr></w:style><w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/><w:rPr><w:color w:val="0B5CAD"/><w:u w:val="single"/></w:rPr></w:style></w:styles>`;
  const files = {
    "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`,
    "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`,
    "word/_rels/document.xml.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/>${rels.join("")}</Relationships>`,
    "word/document.xml": document,
    "word/styles.xml": styles,
    "docProps/core.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xe(title)}</dc:title><dc:creator>The Language Page</dc:creator><dc:language>${lang}</dc:language></cp:coreProperties>`,
  };
  return zipStore(files);
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
