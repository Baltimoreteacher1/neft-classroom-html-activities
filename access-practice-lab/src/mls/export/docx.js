// Math Literacy Studio exports: a real Word document (.docx), written by hand as OOXML into a stored zip
// (assets/lib/zip-store.js, the writer the rest of the lab uses). No library. The file has real styles (Title,
// Heading 1/2, a table style), real lists (numbering.xml), real tables, picture alt text (wp:docPr descr), a footer with
// the title and a PAGE field, and document properties, so it is editable and screen-reader friendly.
//
// Blocks follow docs/math-literacy/architecture.md. Answers, explanations and hints on a `problem` block are never
// written here; they live only in the separate key document.
import { zipStore } from "../../../../assets/lib/zip-store.js";
import {
  MLS_NAME,
  columnShares,
  imageEntry,
  blockRef,
  keyResource,
  letter,
  metaLine,
  normalizeResource,
  safeRender,
  workspaceInches,
  xesc,
} from "./raster.js";

const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
};
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const NAVY = "17324D";
const GREY = "33404B";
const BODY_W = 10080; // US Letter, 0.75in margins: 8.5in - 1.5in = 7in = 10080 twips
const EMU = 914400;
const IND = 540; // problem body indent

// ── runs, paragraphs, tables ────────────────────────────────────────────────

/** One or more runs; "\n" becomes a line break. Options: b, i, color, sz (half-points), font, u. */
function runs(text, o = {}) {
  const pr = [
    o.font ? `<w:rFonts w:ascii="${o.font}" w:hAnsi="${o.font}" w:eastAsia="${o.font}" w:cs="${o.font}"/>` : "",
    o.b ? "<w:b/><w:bCs/>" : "",
    o.i ? "<w:i/><w:iCs/>" : "",
    o.color ? `<w:color w:val="${o.color}"/>` : "",
    o.sz ? `<w:sz w:val="${o.sz}"/><w:szCs w:val="${o.sz}"/>` : "",
    o.u ? '<w:u w:val="single"/>' : "",
  ].join("");
  const rPr = pr ? `<w:rPr>${pr}</w:rPr>` : "";
  return String(text ?? "")
    .split("\n")
    .map((line, i) => `${i ? `<w:r>${rPr}<w:br/></w:r>` : ""}<w:r>${rPr}<w:t xml:space="preserve">${xesc(line)}</w:t></w:r>`)
    .join("");
}
const tab = (o = {}) => `<w:r>${o.b ? "<w:rPr><w:b/></w:rPr>" : ""}<w:tab/></w:r>`;

/** A paragraph. pPr children are emitted in schema order. */
function p(inner = "", o = {}) {
  const pPr = [
    o.style ? `<w:pStyle w:val="${o.style}"/>` : "",
    o.keep ? "<w:keepNext/>" : "",
    o.keepLines ? "<w:keepLines/>" : "",
    o.num ? `<w:numPr><w:ilvl w:val="0"/><w:numId w:val="${o.num}"/></w:numPr>` : "",
    o.bdr ? `<w:pBdr>${o.bdr}</w:pBdr>` : "",
    o.shd ? `<w:shd w:val="clear" w:color="auto" w:fill="${o.shd}"/>` : "",
    o.tabs ? `<w:tabs>${o.tabs}</w:tabs>` : "",
    o.spacing ? `<w:spacing ${o.spacing}/>` : "",
    o.ind ? `<w:ind ${o.ind}/>` : "",
    o.jc ? `<w:jc w:val="${o.jc}"/>` : "",
  ].join("");
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${inner}</w:p>`;
}

/** Table. rows: [{ cells:[{ xml, shade?, vAlign? }], height?, header? }]. Every cell holds at least one paragraph. */
function tbl({ widths, rows, indent = 0, border = "single", sz = 6, color = "222222", header = false, style = "MLSTable", fill }) {
  const bd = (n) => `<w:${n} w:val="${border}" w:sz="${sz}" w:space="0" w:color="${color}"/>`;
  const total = widths.reduce((a, b) => a + b, 0);
  const grid = widths.map((w) => `<w:gridCol w:w="${w}"/>`).join("");
  const trs = rows
    .map((row, ri) => {
      const isHead = header && ri === 0;
      const trPr = `<w:trPr><w:cantSplit/>${row.height ? `<w:trHeight w:val="${row.height}" w:hRule="atLeast"/>` : ""}${isHead ? "<w:tblHeader/>" : ""}</w:trPr>`;
      const tcs = row.cells
        .map((c, ci) => {
          const shade = c.shade || (isHead ? "E4EAEE" : fill);
          const inner = c.xml && c.xml.includes("<w:p") ? c.xml : `${c.xml || ""}${p("")}`;
          return `<w:tc><w:tcPr><w:tcW w:w="${widths[ci]}" w:type="dxa"/>${shade ? `<w:shd w:val="clear" w:color="auto" w:fill="${shade}"/>` : ""}${c.vAlign ? `<w:vAlign w:val="${c.vAlign}"/>` : ""}</w:tcPr>${inner}</w:tc>`;
        })
        .join("");
      return `<w:tr>${trPr}${tcs}</w:tr>`;
    })
    .join("");
  return `<w:tbl><w:tblPr><w:tblStyle w:val="${style}"/><w:tblW w:w="${total}" w:type="dxa"/>${indent ? `<w:tblInd w:w="${indent}" w:type="dxa"/>` : ""}<w:tblBorders>${["top", "left", "bottom", "right", "insideH", "insideV"].map(bd).join("")}</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0" w:firstRow="${header ? 1 : 0}" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/></w:tblPr><w:tblGrid>${grid}</w:tblGrid>${trs}</w:tbl>`;
}

const bottomRule = () => '<w:bottom w:val="single" w:sz="6" w:space="0" w:color="333333"/>';
/** Left indent plus a right indent that alternates by 10 twips: neighbouring ruled lines then never share all their
 * paragraph properties, which is what makes Word and LibreOffice merge bordered paragraphs into one block. */
const ruleInd = (left, i) => `w:left="${left}" w:right="${i % 2 ? 10 : 0}"`;

/** n ruled lines at 0.3in (bottom-border paragraphs). */
const ruledLines = (n, { ind = 0, height = 432, keepLast = false } = {}) =>
  Array.from({ length: n }, (_, i) =>
    p("", {
      keep: i < n - 1 || keepLast,
      bdr: bottomRule(),
      spacing: `w:before="0" w:after="0" w:line="${height}" w:lineRule="exact"`,
      ind: ruleInd(ind, i),
    }),
  );

// ── the builder ─────────────────────────────────────────────────────────────

class Builder {
  constructor(resource, { images, renderVisual }) {
    this.r = resource;
    this.images = images;
    this.renderVisual = renderVisual;
    this.media = []; // { name, bytes, rid }
    this.numbers = []; // extra ordered-list num ids
    this.docPrId = 0;
    this.body = [];
  }

  nextNum() {
    const id = 2 + this.numbers.length;
    this.numbers.push(id);
    return id;
  }

  altFor(spec, given) {
    return given || spec?.alt || safeRender(this.renderVisual, spec)?.alt || "Picture";
  }

  /** An inline picture paragraph, or an italic "[Picture: alt]" caption when there is no PNG for it. */
  picture(ref, spec, givenAlt, { maxW = 4.4, maxH = 2.8, jc = "center", ind = 0, keep = false } = {}) {
    const alt = this.altFor(spec, givenAlt);
    const e = imageEntry(this.images, ref);
    if (!e) return p(runs(`[Picture: ${alt}]`, { i: true, color: GREY }), { keep, jc, ind: ind ? `w:left="${ind}"` : "", spacing: 'w:before="60" w:after="120"' });
    let wIn = maxW;
    let hIn = (wIn * e.h) / e.w;
    if (hIn > maxH) {
      hIn = maxH;
      wIn = (hIn * e.w) / e.h;
    }
    const cx = Math.round(wIn * EMU);
    const cy = Math.round(hIn * EMU);
    const n = this.media.length + 1;
    const rid = `rIdImg${n}`;
    this.media.push({ name: `image${n}.png`, bytes: e.png, rid });
    const id = ++this.docPrId;
    const a = xesc(alt);
    const drawing = `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:docPr id="${id}" name="Picture ${id}" descr="${a}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="${NS.pic}"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="image${n}.png" descr="${a}"/><pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
    return p(drawing, { keep, jc, ind: ind ? `w:left="${ind}"` : "", spacing: 'w:before="60" w:after="120"' });
  }

  add(xml) {
    this.body.push(...[].concat(xml));
  }

  // -- blocks --

  paragraph(b) {
    const text = b.text;
    switch (b.style) {
      case "directions":
        return p(runs(text), { style: "Directions" });
      case "note":
        return p(runs(text), { style: "Note" });
      case "quote":
        return p(runs(text), { style: "Quote" });
      case "teacher":
        return p(runs(text), { style: "TeacherNote" });
      default:
        return p(runs(text));
    }
  }

  list(b) {
    const num = b.ordered ? this.nextNum() : 1;
    return (b.items || []).map((it) => p(runs(it), { style: "ListParagraph", num }));
  }

  table(b) {
    const headers = b.headers || [];
    const rows = b.rows || [];
    const n = Math.max(headers.length, ...rows.map((r) => r.length), 1);
    const shares = columnShares(headers, rows);
    let widths = shares.map((s) => Math.floor(s * BODY_W));
    widths[n - 1] += BODY_W - widths.reduce((a, c) => a + c, 0);
    const mk = (cells, head) => ({
      cells: Array.from({ length: n }, (_, c) => ({ xml: p(runs(cells[c] ?? "", head ? { b: true } : {}), { spacing: 'w:before="0" w:after="0"' }) })),
    });
    const all = [...(headers.length ? [mk(headers, true)] : []), ...rows.map((r) => mk(r, false))];
    const out = [];
    if (b.caption) out.push(p(runs(b.caption), { style: "Caption", keep: true }));
    out.push(tbl({ widths, rows: all, header: headers.length > 0 }), p("", { spacing: 'w:before="0" w:after="80"' }));
    return out;
  }

  problem(b, ref) {
    const pieces = [];
    const head = (inner) => (keep) =>
      p(inner, {
        keep,
        keepLines: true,
        tabs: `<w:tab w:val="left" w:pos="${IND}"/>`,
        ind: `w:left="${IND}" w:hanging="${IND}"`,
        spacing: 'w:before="160" w:after="60"',
      });
    const numRun = `${runs(`${b.n}.`, { b: true, color: NAVY })}${tab()}`;
    const body = (inner, extra = {}) => (keep) => p(inner, { keep, ind: `w:left="${IND}"`, ...extra });
    if (b.stem) {
      pieces.push(head(numRun + runs(b.stem)));
      if (b.ask) pieces.push(body(runs(b.ask, { b: true }), { spacing: 'w:before="0" w:after="60"' }));
    } else {
      pieces.push(head(numRun + runs(b.ask || "", { b: true })));
    }
    if (b.expr)
      pieces.push((keep) =>
        p(runs(b.expr, { b: true, sz: 30 }), { keep, jc: "center", ind: `w:left="${IND}"`, spacing: 'w:before="80" w:after="120"' }),
      );
    if (b.visual) pieces.push((keep) => this.picture(`${ref}.v`, b.visual, b.visual.alt, { keep, ind: IND, jc: "left", maxW: 4.2, maxH: 2.6 }));
    (b.choices || []).forEach((c, i) =>
      pieces.push((keep) =>
        p(`${runs(`${letter(i)}.`, { b: true })}${tab()}${runs(c)}`, {
          keep,
          keepLines: true,
          tabs: `<w:tab w:val="left" w:pos="${IND + 500}"/>`,
          ind: `w:left="${IND + 500}" w:hanging="500"`,
          spacing: 'w:before="0" w:after="50"',
        }),
      ),
    );
    (b.frames || []).forEach((f) =>
      pieces.push((keep) =>
        p(runs(f), {
          style: "Frame",
          keep,
          ind: `w:left="${IND + 140}"`,
        }),
      ),
    );
    const inches = workspaceInches(b.workspace);
    if (inches) {
      const kind = b.workspace.kind;
      if (kind === "lines") {
        const n = Math.round(inches / 0.3);
        for (let i = 0; i < n; i++)
          pieces.push((keep) =>
            p("", {
              keep,
              bdr: bottomRule(),
              spacing: 'w:before="0" w:after="0" w:line="432" w:lineRule="exact"',
              ind: ruleInd(IND, i),
            }),
          );
      } else if (kind === "grid") {
        const cell = 360;
        const cols = Math.floor((BODY_W - IND) / cell);
        const rowsN = Math.max(2, Math.round((inches * 1440) / cell));
        const widths = Array(cols).fill(cell);
        pieces.push(() =>
          tbl({
            widths,
            indent: IND,
            border: "single",
            sz: 4,
            color: "8C99A3",
            style: "MLSTable",
            rows: Array.from({ length: rowsN }, () => ({
              height: cell,
              cells: widths.map(() => ({ xml: p("", { spacing: 'w:before="0" w:after="0" w:line="40" w:lineRule="exact"' }) })),
            })),
          }),
        );
      } else {
        pieces.push(() =>
          tbl({
            widths: [BODY_W - IND],
            indent: IND,
            border: "single",
            sz: 12,
            color: "333333",
            rows: [{ height: Math.round(inches * 1440), cells: [{ xml: p("") }] }],
          }),
        );
      }
    }
    const out = pieces.map((f, i) => f(i < pieces.length - 1));
    // a table can not be the last thing before the next block's heading: a small spacer paragraph also separates problems
    out.push(p("", { spacing: 'w:before="0" w:after="120"' }));
    return out;
  }

  frames(b) {
    return [
      p(runs("Sentence frames", { b: true, sz: 18, color: GREY }), { style: "Label", keep: true }),
      ...(b.items || []).map((f, i, a) => p(runs(f), { style: "Frame", keep: i < a.length - 1 })),
    ];
  }

  wordbank(b) {
    const words = b.words || [];
    if (!words.length) return [];
    const cols = Math.ceil(words.length / Math.ceil(words.length / 5));
    const w = Math.floor(BODY_W / cols);
    const widths = Array(cols).fill(w);
    widths[cols - 1] += BODY_W - w * cols;
    const rows = [];
    for (let i = 0; i < words.length; i += cols) {
      const slice = words.slice(i, i + cols);
      rows.push({
        cells: Array.from({ length: cols }, (_, c) => ({
          xml: p(slice[c] != null ? runs(slice[c], { b: true }) : "", { jc: "center", spacing: 'w:before="40" w:after="40"' }),
          vAlign: "center",
        })),
      });
    }
    return [
      p(runs("Word bank", { b: true, sz: 18, color: GREY }), { style: "Label", keep: true }),
      tbl({ widths, rows, sz: 12, color: "333333" }),
      p("", { spacing: 'w:before="0" w:after="100"' }),
    ];
  }

  cards(b, ref) {
    const cols = b.cols === 3 ? 3 : 2;
    const items = b.items || [];
    const w = Math.floor(BODY_W / cols);
    const widths = Array(cols).fill(w);
    widths[cols - 1] += BODY_W - w * cols;
    const rows = [];
    for (let i = 0; i < items.length; i += cols) {
      rows.push({
        height: 2880,
        cells: Array.from({ length: cols }, (_, c) => {
          const it = items[i + c];
          if (!it) return { xml: p(""), vAlign: "center" };
          const parts = [];
          if (it.visual) parts.push(this.picture(`${ref}.c${i + c}`, it.visual, it.visual.alt, { maxW: Math.min(2.6, 6.6 / cols), maxH: 1.4, keep: true }));
          parts.push(p(runs(it.front, { b: true, sz: 28 }), { jc: "center", keep: Boolean(it.back), spacing: 'w:before="60" w:after="60"' }));
          if (it.back) parts.push(p(runs(it.back, { i: true, color: GREY }), { jc: "center", spacing: 'w:before="40" w:after="60"', bdr: '<w:top w:val="single" w:sz="4" w:space="4" w:color="777777"/>' }));
          return { xml: parts.join(""), vAlign: "center" };
        }),
      });
    }
    return [tbl({ widths, rows, border: "dashed", sz: 8, color: "333333" }), p("", { spacing: 'w:before="0" w:after="100"' })];
  }

  linesBlock(b) {
    const n = Math.max(1, Math.min(30, +b.n || 3));
    return [
      ...(b.prompt ? [p(runs(b.prompt, { b: true }), { keep: true, spacing: 'w:before="120" w:after="40"' })] : []),
      ...ruledLines(n),
      p("", { spacing: 'w:before="0" w:after="80"' }),
    ];
  }

  checks(b) {
    return (b.items || []).map((it) =>
      p(`${runs("☐", { font: "Segoe UI Symbol", sz: 26 })}${tab()}${runs(it)}`, {
        tabs: '<w:tab w:val="left" w:pos="540"/>',
        ind: 'w:left="540" w:hanging="540"',
        spacing: 'w:before="40" w:after="60"',
      }),
    );
  }

  build() {
    const r = this.r;
    this.add(p(runs(r.title), { style: "Title" }));
    if (r.subtitle) this.add(p(runs(r.subtitle), { style: "Subtitle" }));
    const meta = metaLine(r);
    if (meta) this.add(p(runs(meta), { style: "Note", spacing: 'w:before="0" w:after="160"' }));
    r.sections.forEach((s, si) => {
      if (s.heading) this.add(p(runs(s.heading), { style: "Heading1" }));
      s.blocks.forEach((b, bi) => {
        const ref = blockRef(si, bi);
        switch (b.t) {
          case "p":
            return this.add(this.paragraph(b));
          case "list":
            return this.add(this.list(b));
          case "table":
            return this.add(this.table(b));
          case "visual":
            return this.add(this.picture(ref, b.spec, b.alt, { maxW: 5.2, maxH: 3.0 }));
          case "problem":
            return this.add(this.problem(b, ref));
          case "frames":
            return this.add(this.frames(b));
          case "wordbank":
            return this.add(this.wordbank(b));
          case "cards":
            return this.add(this.cards(b, ref));
          case "lines":
            return this.add(this.linesBlock(b));
          case "check":
            return this.add(this.checks(b));
          case "pagebreak":
            return this.add(p('<w:r><w:br w:type="page"/></w:r>', { spacing: 'w:before="0" w:after="0"' }));
          default:
        }
      });
    });
    if (this.body.length && this.body[this.body.length - 1].startsWith("<w:tbl>")) this.add(p(""));
    return this.body.join("");
  }
}

// ── package parts ───────────────────────────────────────────────────────────

function stylesXml(lang) {
  const font = '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Arial" w:cs="Arial"/>';
  const pst = (id, name, { based = "Normal", next, ppr = "", rpr = "", q = true, ui } = {}) =>
    `<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="${name}"/><w:basedOn w:val="${based}"/>${next ? `<w:next w:val="${next}"/>` : ""}${ui ? `<w:uiPriority w:val="${ui}"/>` : ""}${q ? "<w:qFormat/>" : ""}${ppr ? `<w:pPr>${ppr}</w:pPr>` : ""}${rpr ? `<w:rPr>${rpr}</w:rPr>` : ""}</w:style>`;
  const box = (color, val = "single", sz = 12) =>
    ["top", "left", "bottom", "right"].map((s) => `<w:${s} w:val="${val}" w:sz="${sz}" w:space="6" w:color="${color}"/>`).join("");
  return `${XML}<w:styles xmlns:w="${NS.w}">
<w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="${lang}" w:eastAsia="${lang}" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="numbering" w:default="1" w:styleId="NoList"><w:name w:val="No List"/><w:uiPriority w:val="99"/><w:semiHidden/><w:unhideWhenUsed/></w:style>
${pst("Title", "Title", { next: "Normal", ui: 10, ppr: '<w:keepNext/><w:spacing w:before="0" w:after="60"/>', rpr: `<w:b/><w:bCs/><w:color w:val="${NAVY}"/><w:sz w:val="56"/><w:szCs w:val="56"/>` })}
${pst("Subtitle", "Subtitle", { next: "Normal", ui: 11, ppr: '<w:spacing w:before="0" w:after="60"/>', rpr: `<w:color w:val="${GREY}"/><w:sz w:val="28"/><w:szCs w:val="28"/>` })}
${pst("Heading1", "heading 1", { next: "Normal", ui: 9, ppr: `<w:keepNext/><w:keepLines/><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="2" w:color="${NAVY}"/></w:pBdr><w:spacing w:before="320" w:after="140"/><w:outlineLvl w:val="0"/>`, rpr: `<w:b/><w:bCs/><w:color w:val="${NAVY}"/><w:sz w:val="32"/><w:szCs w:val="32"/>` })}
${pst("Heading2", "heading 2", { next: "Normal", ui: 9, ppr: '<w:keepNext/><w:keepLines/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/>', rpr: `<w:b/><w:bCs/><w:color w:val="${NAVY}"/><w:sz w:val="26"/><w:szCs w:val="26"/>` })}
${pst("Directions", "Directions", { ppr: `<w:pBdr>${box(NAVY)}</w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="F1F5F7"/><w:spacing w:before="120" w:after="200"/><w:ind w:left="120" w:right="120"/>` })}
${pst("Note", "Note", { rpr: `<w:i/><w:iCs/><w:color w:val="${GREY}"/>` })}
${pst("Quote", "Quote", { ui: 29, ppr: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="10" w:color="${NAVY}"/></w:pBdr><w:spacing w:before="120" w:after="160"/><w:ind w:left="480"/>`, rpr: "<w:i/><w:iCs/>" })}
${pst("TeacherNote", "Teacher Note", { ppr: `<w:pBdr>${box("6B4E00", "dashed", 12)}</w:pBdr><w:shd w:val="clear" w:color="auto" w:fill="FFF6DA"/><w:spacing w:before="120" w:after="200"/><w:ind w:left="120" w:right="120"/>` })}
${pst("Caption", "caption", { ui: 35, ppr: '<w:keepNext/><w:spacing w:before="120" w:after="60"/>', rpr: "<w:b/><w:bCs/>" })}
${pst("Label", "Label", { ppr: '<w:keepNext/><w:spacing w:before="120" w:after="40"/>', rpr: `<w:b/><w:bCs/><w:caps/><w:color w:val="${GREY}"/><w:sz w:val="18"/><w:szCs w:val="18"/>` })}
${pst("Frame", "Sentence Frame", { ppr: `<w:pBdr><w:left w:val="single" w:sz="24" w:space="8" w:color="${NAVY}"/></w:pBdr><w:spacing w:before="40" w:after="80" w:line="480" w:lineRule="auto"/><w:ind w:left="480"/>` })}
${pst("ListParagraph", "List Paragraph", { ui: 34, ppr: '<w:spacing w:before="0" w:after="60"/><w:ind w:left="720"/><w:contextualSpacing/>' })}
${pst("Header", "header", { q: false, ui: 99, ppr: '<w:tabs><w:tab w:val="clear" w:pos="4680"/><w:tab w:val="right" w:pos="10080"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>', rpr: `<w:color w:val="${GREY}"/><w:sz w:val="18"/><w:szCs w:val="18"/>` })}
${pst("Footer", "footer", { q: false, ui: 99, ppr: '<w:tabs><w:tab w:val="clear" w:pos="4680"/><w:tab w:val="right" w:pos="10080"/></w:tabs><w:spacing w:after="0" w:line="240" w:lineRule="auto"/>', rpr: `<w:color w:val="${GREY}"/><w:sz w:val="18"/><w:szCs w:val="18"/>` })}
<w:style w:type="table" w:styleId="MLSTable"><w:name w:val="MLS Table"/><w:basedOn w:val="TableNormal"/><w:uiPriority w:val="59"/><w:qFormat/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="6" w:space="0" w:color="222222"/><w:left w:val="single" w:sz="6" w:space="0" w:color="222222"/><w:bottom w:val="single" w:sz="6" w:space="0" w:color="222222"/><w:right w:val="single" w:sz="6" w:space="0" w:color="222222"/><w:insideH w:val="single" w:sz="6" w:space="0" w:color="222222"/><w:insideV w:val="single" w:sz="6" w:space="0" w:color="222222"/></w:tblBorders><w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;
}

function numberingXml(extraNums) {
  const lvl = (fmt, text, font) =>
    `<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="${fmt}"/><w:lvlText w:val="${text}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>${font ? `<w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}" w:hint="default"/></w:rPr>` : ""}</w:lvl>`;
  return `${XML}<w:numbering xmlns:w="${NS.w}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>${lvl("bullet", "•", "Arial")}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="singleLevel"/>${lvl("decimal", "%1.")}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>${extraNums
    .map((id) => `<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`)
    .join("")}</w:numbering>`;
}

const clip = (s, n) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** The .docx bytes for a Resource. `images`: Map(blockRef -> { png, w, h }) (see raster.js collectImages). */
export function docxBytes(resource, { images = new Map(), renderVisual = null, key = false } = {}) {
  const r = key ? keyResource(resource) : normalizeResource(resource);
  const b = new Builder(r, { images, renderVisual });
  const bodyXml = b.build();
  const lang = r.lang === "es" ? "es-US" : "en-US";
  const doc = `${XML}<w:document xmlns:w="${NS.w}" xmlns:r="${NS.r}" xmlns:wp="${NS.wp}" xmlns:a="${NS.a}" xmlns:pic="${NS.pic}"><w:body>${bodyXml}<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr1"/><w:footerReference w:type="default" r:id="rIdFtr1"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="500" w:footer="500" w:gutter="0"/><w:cols w:space="720"/></w:sectPr></w:body></w:document>`;
  const header = `${XML}<w:hdr xmlns:w="${NS.w}" xmlns:r="${NS.r}">${p(runs(MLS_NAME), { style: "Header" })}</w:hdr>`;
  const footer = `${XML}<w:ftr xmlns:w="${NS.w}" xmlns:r="${NS.r}"><w:p><w:pPr><w:pStyle w:val="Footer"/></w:pPr>${runs(clip(r.title, 70))}${tab()}${runs("Page ")}<w:fldSimple w:instr=" PAGE "><w:r><w:t>1</w:t></w:r></w:fldSimple>${runs(" of ")}<w:fldSimple w:instr=" NUMPAGES "><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>`;
  const created = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const core = `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xesc(r.title)}</dc:title><dc:subject>${xesc(r.subtitle || "")}</dc:subject><dc:creator>${MLS_NAME}</dc:creator><dc:language>${lang}</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`;
  const settings = `${XML}<w:settings xmlns:w="${NS.w}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:characterSpacingControl w:val="doNotCompress"/><w:compat><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;
  const ct = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  const rels = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`;
  const docRels = `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdSty" Type="${REL}/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="${REL}/numbering" Target="numbering.xml"/><Relationship Id="rIdSet" Type="${REL}/settings" Target="settings.xml"/><Relationship Id="rIdHdr1" Type="${REL}/header" Target="header1.xml"/><Relationship Id="rIdFtr1" Type="${REL}/footer" Target="footer1.xml"/>${b.media
    .map((m) => `<Relationship Id="${m.rid}" Type="${REL}/image" Target="media/${m.name}"/>`)
    .join("")}</Relationships>`;
  const files = {
    "[Content_Types].xml": ct,
    "_rels/.rels": rels,
    "word/document.xml": doc,
    "word/_rels/document.xml.rels": docRels,
    "word/styles.xml": stylesXml(lang),
    "word/numbering.xml": numberingXml(b.numbers),
    "word/settings.xml": settings,
    "word/header1.xml": header,
    "word/footer1.xml": footer,
    "docProps/core.xml": core,
  };
  for (const m of b.media) files[`word/media/${m.name}`] = m.bytes;
  return zipStore(files);
}

export const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
