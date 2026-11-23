// IR -> .docx. WordprocessingML written with docx-xml.js, packaged with the site's store-only zip writer. No dependencies.
// Accessible by construction: real Heading 1-3 styles, header rows marked on every data table, alt text on every picture,
// document title and language in the package properties, and the review status line in the footer of every page.
import { zipStore } from "../../../assets/lib/zip-store.js";
import { FOOTER_RID, HEADER_RID, REVIEW_LINE, packageParts } from "./docx-package.js";
import { NS, XML_HEAD, cell, emptyPara, para, picture, pngSize, row, run, table } from "./docx-xml.js";
import { visibleSections } from "./ir.js";
import { HEX, accentHex, mmToEmu, mmToTwips, pageGeometry, styleFor } from "./style.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export { DOCX_MIME };
export { REVIEW_LINE };

/** PNG rasteriser backed by core/visuals.js (browser). Returns null when that module is not available. */
export async function loadRasterizer() {
  try {
    const v = await import("../core/visuals.js");
    if (typeof v.visualToPng !== "function") return null;
    return async (spec, widthPx) =>
      new Uint8Array(await (await v.visualToPng(spec, widthPx)).arrayBuffer());
  } catch {
    return null;
  }
}

const altOf = (spec) => [spec?.alt || "Illustration", spec?.longDesc].filter(Boolean).join(" ");
const cellText = (c) => (c && typeof c === "object" ? c.t : String(c ?? ""));
const squash = (s) => String(s ?? "").replace(/_{12,}/g, "______________");

function makeCtx(doc, rasterize) {
  const g = pageGeometry(doc.format);
  const st = styleFor(doc.meta.band);
  return {
    doc,
    g,
    st,
    rasterize,
    media: {},
    pic: 0,
    nums: [],
    tw: g.twipsW - 2 * g.twipsMargin,
    acc: accentHex(doc.meta.subject),
    lineTw: mmToTwips(st.lineMm),
  };
}

const R = (c, text, o = {}) => run(text, { pt: c.st.bodyPt, color: HEX.ink, ...o });
const P = (c, text, o = {}, ro = {}) => para(R(c, text, ro), { after: 80, ...o });
const spacer = () => emptyPara({ line: 80 });
const ruleLine = (c, o = {}) =>
  para("", {
    line: c.lineTw,
    before: 0,
    after: 0,
    // `between` as well as `bottom`: Word merges consecutive paragraphs that share borders and would draw only the last line.
    borders: { bottom: { sz: 8, color: HEX.ink2, space: 0 }, between: { sz: 8, color: HEX.ink2, space: 0 } },
  });

async function picXml(c, spec, wMm) {
  let bytes = null;
  try {
    bytes = c.rasterize ? await c.rasterize(spec, Math.round((wMm / 25.4) * 220)) : null;
  } catch {
    bytes = null;
  }
  if (!bytes) return run(`[Picture: ${altOf(spec)}]`, { pt: c.st.smallPt, i: true, color: HEX.ink2 });
  const { w, h } = pngSize(bytes);
  const id = ++c.pic;
  c.media[`image${id}.png`] = bytes;
  const wEmu = mmToEmu(wMm);
  return picture(`rIdImg${id}`, id, wEmu, Math.round((wEmu * h) / w), altOf(spec));
}
const picPara = async (c, spec, wMm, align = "center") =>
  para(await picXml(c, spec, wMm), { align, after: 60 });

const bullets = (c, items, o = {}) => {
  let num = { id: 1 };
  if (o.ordered) {
    c.nums.push(c.nums.length + 3);
    num = { id: c.nums[c.nums.length - 1] };
  }
  return items
    .map((t) =>
      o.bare ? P(c, t, { indent: { left: 0 }, after: 60 }) : para(R(c, t), { num, after: 60 }),
    )
    .join("");
};

function widthsOf(parts, total) {
  const sum = parts.reduce((a, x) => a + x, 0);
  const w = parts.map((x) => Math.floor((total * x) / sum));
  w[w.length - 1] += total - w.reduce((a, x) => a + x, 0);
  return w;
}
// Marks the first row as a header row for assistive technology (docx-xml.js writes the table properties, this adds the look).
const withLook = (xml, header) =>
  xml.replace(
    "</w:tblCellMar>",
    `</w:tblCellMar><w:tblLook w:val="04A0" w:firstRow="${header ? 1 : 0}" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="1" w:noVBand="1"/>`,
  );
const grid = (rows, widths, o = {}) => withLook(table(rows, widths, o), o.header) + spacer();

async function cellBody(c, cellData, w, base = {}) {
  const parts = [];
  if (cellData.visual)
    parts.push(
      await picPara(c, cellData.visual, Math.min(cellData.visualMm || 28, (w / 1440) * 25.4 - 4)),
    );
  const text = cellText(cellData);
  const o = { ...base, bold: base.bold || cellData.kind === "label" };
  if (text)
    parts.push(
      para(R(c, text, { b: o.bold, color: o.color }), {
        after: 40,
        align:
          cellData.align === "center" ? "center" : cellData.align === "right" ? "right" : undefined,
      }),
    );
  return parts.join("") || emptyPara();
}

async function tableBlock(c, b, w) {
  const widths = widthsOf(b.cols, w);
  const rows = [];
  if (b.head) {
    const cells = [];
    for (let i = 0; i < b.head.length; i++) {
      const hc = b.head[i];
      const fill = b.accentHead;
      cells.push(
        cell(
          para(R(c, cellText(hc), { b: true, color: fill ? "FFFFFF" : HEX.ink }), { after: 40 }),
          { w: widths[i], shade: fill ? c.acc : HEX.tint, vAlign: "center" },
        ),
      );
    }
    rows.push(row(cells, { header: true }));
  }
  for (const r of b.rows) {
    const cells = [];
    let col = 0;
    for (const cd of r) {
      const span = Math.max(1, cd.span || 1);
      const cw = widths.slice(col, col + span).reduce((a, x) => a + x, 0);
      cells.push(
        cell(await cellBody(c, cd, cw), {
          w: cw,
          span,
          shade: cd.kind === "label" ? HEX.tint : undefined,
        }),
      );
      col += span;
    }
    const lines = Math.max(b.rowLines || 0, ...r.map((x) => x.h || 0));
    rows.push(row(cells, { height: lines ? lines * c.lineTw : 0 }));
  }
  return grid(rows, widths, {
    header: !!b.head,
    caption: b.head ? b.head.map(cellText).join(", ") : "",
  });
}

async function cardBlock(c, b, w) {
  const widths = widthsOf(Array(b.cols).fill(1), w);
  const edge = b.cut
    ? { val: "dashed", sz: 6, color: HEX.ink2, space: 0 }
    : { sz: 6, color: HEX.ink2, space: 0 };
  const borders = { top: edge, left: edge, bottom: edge, right: edge };
  const rows = [];
  for (let i = 0; i < b.items.length; i += b.cols) {
    const cells = [];
    for (let k = 0; k < b.cols; k++) {
      const it = b.items[i + k];
      let body = "";
      if (it) {
        if (it.tag || it.num !== "")
          body += para(
            R(c, [it.num, it.tag].filter((x) => x !== "" && x != null).join("  "), {
              b: true,
              pt: c.st.smallPt,
              color: HEX.ink2,
            }),
            { after: 40 },
          );
        if (it.visual)
          body += await picPara(
            c,
            it.visual,
            Math.min(it.visualMm || 30, (widths[k] / 1440) * 25.4 - 8),
          );
        if (it.drawMm)
          body += para("", {
            line: mmToTwips(it.drawMm),
            borders: {
              top: { sz: 6, color: HEX.ink2 },
              bottom: { sz: 6, color: HEX.ink2 },
              left: { sz: 6, color: HEX.ink2 },
              right: { sz: 6, color: HEX.ink2 },
            },
          });
        if (it.head)
          body += para(
            R(c, it.head, { b: true, pt: it.headSize === "l" ? c.st.headPt : c.st.bodyPt * 1.15 }),
            { align: "center", after: 60 },
          );
        if (it.body) body += P(c, it.body);
        for (const f of it.frames || []) body += P(c, squash(f), {}, { b: true });
        for (let n = 0; n < (it.lines || 0); n++) body += ruleLine(c);
        if (it.foot) body += P(c, it.foot, {}, { pt: c.st.smallPt, color: HEX.ink2 });
      }
      cells.push(
        cell(body || emptyPara(), {
          w: widths[k],
          borders,
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        }),
      );
    }
    rows.push(row(cells, { height: mmToTwips(b.hMm), rule: "atLeast" }));
  }
  return grid(rows, widths, { borders: "none" });
}

function foldBlock(c, b, w) {
  const widths = widthsOf(
    b.flaps.map(() => 1),
    w,
  );
  const edge = { val: "dashed", sz: 8, color: HEX.ink2, space: 0 };
  const borders = { top: edge, left: edge, bottom: edge, right: edge };
  const head = row(
    b.flaps.map((f, i) =>
      cell(para(R(c, f.label, { b: true }), { align: "center" }), {
        w: widths[i],
        borders,
        shade: HEX.tint,
        vAlign: "center",
      }),
    ),
    { header: true, height: 700 },
  );
  const body = row(
    b.flaps.map((f, i) =>
      cell(Array.from({ length: f.n }, () => ruleLine(c)).join(""), { w: widths[i], borders }),
    ),
    { height: mmToTwips(b.hMm) },
  );
  const how =
    {
      flaps: "Cut the dashed lines. Fold on the solid line. Write under each flap.",
      layers: "Cut out each strip. Stack them with the labels showing. Staple along the top.",
      accordion: "Cut the dashed outline. Fold on each solid line like a fan.",
    }[b.kind] || "";
  return (
    grid([head, body], widths, {
      header: true,
      caption: `Foldable: ${b.flaps.map((f) => f.label).join(", ")}`,
    }) + P(c, how, {}, { pt: c.st.smallPt, color: HEX.ink2 })
  );
}

async function blockXml(c, b, w) {
  switch (b.type) {
    case "title":
      return (
        para(R(c, b.text, { pt: c.st.headPt, b: true, color: c.acc }), {
          style: "Heading1",
          after: 60,
          borders: { bottom: { sz: 18, color: c.acc, space: 4 } },
        }) + (b.sub ? P(c, b.sub, { style: "Subtitle", after: 120 }, { color: HEX.ink2 }) : "")
      );
    case "h":
      return para(
        R(c, b.text, {
          pt: c.st.bodyPt * (b.level <= 2 ? 1.2 : 1.08),
          b: true,
          color: b.level <= 2 ? c.acc : HEX.ink,
        }),
        { style: `Heading${Math.min(3, Math.max(1, b.level))}`, before: 120, after: 60 },
      );
    case "p": {
      const tone = b.tone;
      if (tone === "direction")
        return para(R(c, b.text, { b: true }), {
          shade: HEX.tint,
          borders: { left: { sz: 24, color: c.acc, space: 6 } },
          indent: { left: 120 },
          after: 100,
        });
      if (tone === "label")
        return P(c, b.text, { keepNext: true, after: 40 }, { b: true, color: c.acc });
      if (tone === "lead") return P(c, b.text, { after: 100 }, { pt: c.st.bodyPt * 1.2 });
      if (tone === "quiet")
        return P(c, b.text, {}, { pt: Math.max(9, c.st.smallPt), color: HEX.ink2 });
      return P(c, b.text);
    }
    case "list":
      return bullets(c, b.items, b);
    case "check":
      return b.items
        .map((t) =>
          para(
            `${run("☐", { pt: c.st.bodyPt * 1.1, font: false, color: HEX.ink2 })}${R(c, `  ${t}`)}`,
            { indent: { left: 400, hanging: 400 }, after: 80 },
          ),
        )
        .join("");
    case "lines":
      return (
        (b.label ? P(c, b.label, { keepNext: true, after: 20 }, { b: true, color: c.acc }) : "") +
        Array.from({ length: b.n }, () => ruleLine(c)).join("")
      );
    case "box": {
      const inner =
        (b.label ? P(c, b.label, { after: 20 }, { b: true, pt: c.st.smallPt }) : "") +
        (b.hint ? P(c, b.hint, {}, { pt: c.st.smallPt, color: HEX.ink2 }) : "");
      return grid(
        [
          row([cell(inner || emptyPara(), { w, shade: b.grid ? "F7F5F1" : undefined })], {
            height: b.n * c.lineTw,
          }),
        ],
        [w],
      );
    }
    case "frames":
      return (
        (b.label ? P(c, b.label, { keepNext: true, after: 20 }, { b: true, color: c.acc }) : "") +
        b.items
          .map((t) => P(c, squash(t), { keepNext: true, after: 20 }, { b: true }) + ruleLine(c))
          .join("")
      );
    case "bank":
      return grid(
        [
          row([
            cell(
              para(
                R(c, `${b.label}:  `, { b: true, color: c.acc }) + R(c, b.words.join("   •   ")),
                { after: 40 },
              ),
              { w, shade: HEX.tint },
            ),
          ]),
        ],
        [w],
      );
    case "visual":
      return (
        (await picPara(c, b.spec, Math.min(b.wMm, (w / 1440) * 25.4))) +
        (b.caption
          ? P(c, b.caption, { align: "center" }, { i: true, pt: c.st.smallPt, color: HEX.ink2 })
          : "")
      );
    case "table":
      return tableBlock(c, b, w);
    case "cards":
      return cardBlock(c, b, w);
    case "fold":
      return foldBlock(c, b, w);
    case "sep":
      return para(b.label ? R(c, b.label, { pt: c.st.smallPt, color: HEX.ink2 }) : "", {
        align: "center",
        before: 60,
        after: 120,
        borders: {
          bottom: { val: b.kind === "cut" ? "dashed" : "single", sz: 8, color: HEX.ink2, space: 2 },
        },
      });
    case "namebar": {
      const n = b.fields.length;
      const tabs = b.fields.map((_, i) => ({
        pos: Math.round((w * (i + 1)) / n) - (i + 1 < n ? 360 : 0),
        leader: "underscore",
      }));
      const runs = b.fields
        .map((f, i) => `${R(c, `${i ? "  " : ""}${f}: `, { b: true })}<w:r><w:tab/></w:r>`)
        .join("");
      return para(runs, { tabs, before: 40, after: 160 });
    }
    case "trace":
      return b.words
        .map(
          (word) =>
            para(run(`${word}   ${word}   ${word}`, { pt: c.st.headPt * 1.2, color: "B7BEC9" }), {
              after: 0,
            }) + ruleLine(c),
        )
        .join("");
    case "spacer":
      return emptyPara({ line: Math.max(20, mmToTwips(b.mm)) });
    case "row": {
      const widths = widthsOf(
        b.cols.map((x) => x.fr),
        w,
      );
      const cells = [];
      for (let i = 0; i < b.cols.length; i++)
        cells.push(
          cell(await blocksXml(c, b.cols[i].blocks, widths[i] - 240), {
            w: widths[i],
            margins: { left: 120, right: 120 },
          }),
        );
      return grid([row(cells)], widths, { borders: "none" });
    }
    default:
      return "";
  }
}

async function blocksXml(c, list, w) {
  let out = "";
  for (const b of list) out += await blockXml(c, b, w);
  return out;
}

/**
 * doc: IR document (print/ir.js). opts: { audience: "student"|"teacher", rasterize(spec, widthPx) -> Uint8Array PNG }.
 * Returns a Uint8Array holding the .docx. Without a rasteriser, pictures become their alt text in the page.
 */
export async function buildDocx(doc, { audience = "student", rasterize } = {}) {
  const c = makeCtx(doc, rasterize === undefined ? await loadRasterizer() : rasterize);
  const sections = visibleSections(doc, audience);
  let body = "";
  let first = true;
  for (const s of sections) {
    for (const pg of s.pages) {
      if (!first) body += emptyPara({ pageBreakBefore: true, line: 20 });
      first = false;
      if (pg.tag)
        body += para(R(c, pg.tag, { b: true, pt: c.st.smallPt, color: HEX.ink2 }), {
          align: "right",
          after: 20,
        });
      body += await blocksXml(c, pg.blocks, c.tw);
    }
  }
  const g = c.g;
  const sect = `<w:sectPr><w:headerReference w:type="default" r:id="${HEADER_RID}"/><w:footerReference w:type="default" r:id="${FOOTER_RID}"/><w:pgSz w:w="${g.twipsW}" w:h="${g.twipsH}"${g.orientation === "landscape" ? ' w:orient="landscape"' : ""}/><w:pgMar w:top="1134" w:right="${g.twipsMargin}" w:bottom="1134" w:left="${g.twipsMargin}" w:header="510" w:footer="510" w:gutter="0"/></w:sectPr>`;
  const document = `${XML_HEAD}<w:document xmlns:w="${NS.w}" xmlns:r="${NS.r}" xmlns:wp="${NS.wp}" xmlns:a="${NS.a}" xmlns:pic="${NS.pic}"><w:body>${body}${sect}</w:body></w:document>`;
  return zipStore(packageParts(c, document));
}
