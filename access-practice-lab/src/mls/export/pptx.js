// Math Literacy Studio exports: a real PowerPoint file (.pptx), written by hand as OOXML into a stored zip.
//
// 16:9. A title slide, then one or more slides per section. Titles are real title placeholders; every other piece of
// text is a real, editable text box; tables are real graphic-frame tables; pictures are real pictures with alt text
// (`descr`). Text is measured (Arial character widths) before it is placed, so a box is never asked to hold more lines
// than fit, and long content continues on the next slide with "(continued)" in the title. Problems use large type
// (24pt, stepping down only when one problem would otherwise not fit) and at most two share a slide. Teacher notes are
// not written as speaker notes: they live only in the answer key, so a shared deck never carries them.
import { zipStore } from "../../../../assets/lib/zip-store.js";
import {
  MLS_NAME,
  blockRef,
  columnShares,
  imageEntry,
  keyResource,
  letter,
  metaLine,
  normalizeResource,
  safeRender,
  xesc,
} from "./raster.js";

const NS = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
};
const REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

const EMU = 914400;
const emu = (inches) => Math.round(inches * EMU);
const SLIDE_W = 13.333; // inches (12192000 EMU)
const SLIDE_H = 7.5; // inches (6858000 EMU)
const MX = 0.6; // side margin
const CW = SLIDE_W - 2 * MX; // content width
const CT = 1.5; // content top
const CB = 7.1; // content bottom
const NAVY = "17324D";
const INK = "1C2630";
const GREY = "33404B";
const TEAL = "1FA6A2";

// ── text measuring (Arial) ──────────────────────────────────────────────────

const NARROW = new Set("iIjl'.,:;!|`");
const SMALL = new Set("ft()[]{}-/\\\"r−–");
const MID = new Set("sckvxyzJ");
function charW(ch, bold) {
  let w;
  if (ch === " ") w = 0.278;
  else if (NARROW.has(ch)) w = 0.26;
  else if (SMALL.has(ch)) w = 0.34;
  else if (ch === "m") w = 0.83;
  else if (ch === "w") w = 0.72;
  else if (ch === "M") w = 0.84;
  else if (ch === "W") w = 0.94;
  else if (MID.has(ch)) w = 0.5;
  else if (/[a-z]/.test(ch)) w = 0.556;
  else if (/[0-9]/.test(ch)) w = 0.556;
  else if (/[A-Z]/.test(ch)) w = 0.68;
  else w = 0.62;
  return bold ? w * 1.06 : w;
}

/** Wrap one paragraph (runs) into lines of [start, end) character offsets for a text width in inches. */
function wrapLines(par, widthIn) {
  const text = par.runs.map((r) => r.t).join("");
  const bold = [];
  for (const r of par.runs) for (let i = 0; i < r.t.length; i++) bold.push(Boolean(r.b));
  const avail = Math.max(0.5, widthIn - (par.marL || 0));
  const unit = (par.sz / 72) * 1.05;
  const lines = [];
  let start = 0;
  let w = 0;
  let lastSpace = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "\t") {
      w = 0; // a hanging number ends at the tab; the text starts at the left margin of the paragraph
      continue;
    }
    const cw = charW(ch, bold[i]) * unit;
    if (ch === " ") lastSpace = i;
    if (w + cw > avail && i > start && ch !== " ") {
      if (lastSpace > start) {
        lines.push([start, lastSpace]);
        start = lastSpace + 1;
      } else {
        lines.push([start, i]);
        start = i;
      }
      lastSpace = -1;
      w = 0;
      for (let j = start; j < i; j++) w += charW(text[j], bold[j]) * unit;
    }
    w += cw;
  }
  lines.push([start, text.length]);
  return lines;
}

const LINE = 1.2; // line height factor
const paraHeight = (par, widthIn) =>
  wrapLines(par, widthIn).length * ((par.sz * LINE) / 72) + ((par.spcBef || 0) + (par.spcAft ?? 6)) / 72;
const parasHeight = (paras, widthIn) => paras.reduce((a, p) => a + paraHeight(p, widthIn), 0);

/** Cut a paragraph's runs to the character range [from, to). */
function sliceRuns(runs, from, to) {
  const out = [];
  let pos = 0;
  for (const r of runs) {
    const s = Math.max(from, pos);
    const e = Math.min(to, pos + r.t.length);
    if (e > s) out.push({ ...r, t: r.t.slice(s - pos, e - pos) });
    pos += r.t.length;
  }
  return out;
}

/** Split a paragraph after `k` lines: [first, rest]. */
function splitPara(par, widthIn, k) {
  const lines = wrapLines(par, widthIn);
  const cut = lines[k - 1][1];
  const restStart = lines[k][0];
  const total = par.runs.reduce((a, r) => a + r.t.length, 0);
  return [
    { ...par, runs: sliceRuns(par.runs, 0, cut), spcAft: 0, bullet: par.bullet },
    { ...par, runs: sliceRuns(par.runs, restStart, total), spcBef: 0, bullet: null, hang: false },
  ];
}

// ── XML pieces ──────────────────────────────────────────────────────────────

const runXml = (r, sz) => {
  const font = r.font || "Arial";
  return `<a:r><a:rPr lang="en-US" sz="${Math.round((r.sz || sz) * 100)}"${r.b ? ' b="1"' : ""}${r.i ? ' i="1"' : ""} dirty="0"><a:solidFill><a:srgbClr val="${r.color || INK}"/></a:solidFill><a:latin typeface="${font}"/><a:cs typeface="${font}"/>${r.font ? `<a:sym typeface="${font}"/>` : ""}</a:rPr><a:t>${xesc(r.t)}</a:t></a:r>`;
};

function paraXml(par) {
  const marL = par.marL ? emu(par.marL) : 0;
  const indent = par.hang === false ? 0 : par.indent ? emu(par.indent) : 0;
  let bu = "<a:buNone/>";
  if (par.bullet === "dot") bu = '<a:buFont typeface="Arial"/><a:buChar char="&#8226;"/>';
  else if (par.bullet && par.bullet.num) bu = `<a:buFont typeface="+mj-lt"/><a:buAutoNum type="arabicPeriod" startAt="${par.bullet.num}"/>`;
  const algn = par.algn ? ` algn="${par.algn}"` : "";
  const pPr = `<a:pPr marL="${marL}" indent="${indent}"${algn}><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="${Math.round((par.spcBef || 0) * 100)}"/></a:spcBef><a:spcAft><a:spcPts val="${Math.round((par.spcAft ?? 6) * 100)}"/></a:spcAft>${bu}</a:pPr>`;
  return `<a:p>${pPr}${par.runs.map((r) => runXml(r, par.sz)).join("")}<a:endParaRPr lang="en-US" sz="${par.sz * 100}" dirty="0"/></a:p>`;
}

const solid = (c) => `<a:solidFill><a:srgbClr val="${c}"/></a:solidFill>`;
const lnXml = (c, w = 19050, dash) => `<a:ln w="${w}">${solid(c)}${dash ? `<a:prstDash val="${dash}"/>` : ""}</a:ln>`;

// ── the slide being built ───────────────────────────────────────────────────

class Slide {
  constructor(title, titleSz) {
    this.title = title;
    this.titleSz = titleSz;
    this.shapes = [];
    this.images = []; // { rid, name, bytes }
    this.y = CT;
    this.problems = 0;
    this.nextId = 3;
  }
  id() {
    return this.nextId++;
  }
  /** A text box with paragraphs. opts: x, y, w, h, fill, line, dash, geom, anchor, inset */
  text(paras, { x = MX, y, w = CW, h, fill, line, lineW, dash, geom = "rect", anchor = "t", inset = [0.1, 0.05], name = "Text" }) {
    const id = this.id();
    const bodyPr = `<a:bodyPr wrap="square" lIns="${emu(inset[0])}" tIns="${emu(inset[1])}" rIns="${emu(inset[0])}" bIns="${emu(inset[1])}" rtlCol="0" anchor="${anchor}"><a:noAutofit/></a:bodyPr>`;
    this.shapes.push(
      `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name} ${id}"/><p:cNvSpPr${geom === "rect" && !fill && !line ? ' txBox="1"' : ""}/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="${geom}"><a:avLst/></a:prstGeom>${fill ? solid(fill) : "<a:noFill/>"}${line ? lnXml(line, lineW || 19050, dash) : ""}</p:spPr><p:txBody>${bodyPr}<a:lstStyle/>${paras.map(paraXml).join("")}</p:txBody></p:sp>`,
    );
  }
  picture(entry, alt, { x, y, w, h }) {
    const n = this.images.length + 1;
    const rid = `rIdImg${n}`;
    this.images.push({ rid, bytes: entry.png });
    const id = this.id();
    this.shapes.push(
      `<p:pic><p:nvPicPr><p:cNvPr id="${id}" name="Picture ${id}" descr="${xesc(alt)}"/><p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr><p:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill><p:spPr><a:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(w)}" cy="${emu(h)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>`,
    );
  }
  /** A real table. rows: [{ cells:[text], head?:bool, fill?, h }], widths in inches. */
  table(rows, widths, { x = MX, y, sz = 16, border = "222222", bw = 12700 }) {
    const id = this.id();
    const total = widths.reduce((a, b) => a + b, 0);
    const height = rows.reduce((a, r) => a + r.h, 0);
    const ln = (tag) => `<a:${tag} w="${bw}" cap="flat" cmpd="sng" algn="ctr">${solid(border)}<a:prstDash val="solid"/></a:${tag}>`;
    const trs = rows
      .map(
        (row) =>
          `<a:tr h="${emu(row.h)}">${row.cells
            .map((t, ci) => {
              const ps = String(t ?? "")
                .split("\n")
                .map((line) =>
                  paraXml({ runs: [{ t: line, b: row.head, color: INK }], sz: row.sz || sz, spcAft: 0, algn: (typeof row.algn === "string" ? row.algn : row.algn?.[ci]) || "l" }),
                )
                .join("");
              const fill = row.fill ? solid(row.fill) : row.head ? solid("E4EAEE") : "<a:noFill/>";
              return `<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>${ps}</a:txBody><a:tcPr marL="${emu(0.08)}" marR="${emu(0.08)}" marT="${emu(0.05)}" marB="${emu(0.05)}" anchor="${row.anchor || "t"}">${ln("lnL")}${ln("lnR")}${ln("lnT")}${ln("lnB")}${fill}</a:tcPr></a:tc>`;
            })
            .join("")}</a:tr>`,
      )
      .join("");
    this.shapes.push(
      `<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="${id}" name="Table ${id}"/><p:cNvGraphicFramePr><a:graphicFrameLocks noGrp="1"/></p:cNvGraphicFramePr><p:nvPr/></p:nvGraphicFramePr><p:xfrm><a:off x="${emu(x)}" y="${emu(y)}"/><a:ext cx="${emu(total)}" cy="${emu(height)}"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table"><a:tbl><a:tblPr firstRow="1"/><a:tblGrid>${widths.map((w) => `<a:gridCol w="${emu(w)}"/>`).join("")}</a:tblGrid>${trs}</a:tbl></a:graphicData></a:graphic></p:graphicFrame>`,
    );
  }
  xml(layoutRid) {
    const t = this.titleSz ? ` sz="${this.titleSz * 100}"` : "";
    const title = `<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"${t} dirty="0"/><a:t>${xesc(this.title)}</a:t></a:r></a:p></p:txBody></p:sp>`;
    return `${XML}<p:sld xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${title}${this.shapes.join("")}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
  }
}

/** Title size that keeps a title inside its box: 30pt on one line, else 26pt or 22pt on two, else clipped. */
function fitTitle(title) {
  for (const sz of [30, 26, 22]) {
    const lines = wrapLines({ runs: [{ t: title, b: true }], sz, marL: 0 }, CW - 0.2).length;
    if (lines <= (sz === 30 ? 1 : 2)) return { title, sz };
  }
  return { title: `${title.slice(0, 80).trimEnd()}…`, sz: 22 };
}

// ── the flow ────────────────────────────────────────────────────────────────

const P = (runs, o = {}) => ({ runs: [].concat(runs), sz: 24, spcAft: 8, ...o });

class Deck {
  constructor(resource, { images, renderVisual }) {
    this.r = resource;
    this.images = images;
    this.renderVisual = renderVisual;
    this.slides = [];
    this.cur = null;
    this.secTitle = "";
    this.secCount = 0;
  }

  begin(title) {
    this.secTitle = title;
    this.secCount = 0;
    this.fresh();
  }
  fresh() {
    const t = this.secCount === 0 ? this.secTitle : `${this.secTitle} (continued)`;
    this.secCount++;
    const f = fitTitle(t);
    this.cur = new Slide(f.title, f.sz);
    this.slides.push(this.cur);
  }
  empty() {
    return this.cur.y <= CT + 0.001;
  }
  room() {
    return CB - this.cur.y;
  }

  /** Place paragraphs, continuing onto further slides. decor: { fill, line, dash } for a boxed group. */
  paras(paras, { x = MX, w = CW, decor = {}, inset = [0.1, 0.05] } = {}) {
    let list = paras.slice();
    while (list.length) {
      const innerW = w - 2 * inset[0];
      const take = [];
      let h = 2 * inset[1];
      let room = this.room();
      while (list.length) {
        const ph = paraHeight(list[0], innerW);
        if (h + ph <= room + 0.001) {
          take.push(list.shift());
          h += ph;
          continue;
        }
        // does not fit whole: split it by lines when at least two lines fit (or the slide is empty and it can never fit)
        const par = list[0];
        const lineH = (par.sz * LINE) / 72;
        const k = Math.floor((room - h - (par.spcBef || 0) / 72) / lineH);
        const lines = wrapLines(par, innerW).length;
        if (k >= 2 && k < lines) {
          const [a, b] = splitPara(par, innerW, k);
          take.push(a);
          h += paraHeight(a, innerW);
          list[0] = b;
        }
        break;
      }
      if (!take.length) {
        if (this.empty()) {
          // one line taller than a whole slide can not happen with these sizes; place it anyway rather than loop
          take.push(list.shift());
          h = Math.min(room, paraHeight(take[0], innerW) + 2 * inset[1]);
        } else {
          this.fresh();
          continue;
        }
      }
      this.cur.text(take, { x, y: this.cur.y, w, h, inset, ...decor });
      this.cur.y += h + 0.1;
      if (list.length) this.fresh();
    }
  }

  alt(spec, given) {
    return given || spec?.alt || safeRender(this.renderVisual, spec)?.alt || "Picture";
  }

  /** A picture (or "[Picture: alt]" caption) of at most maxW x maxH; moves to a fresh slide if it would not fit. */
  picture(ref, spec, givenAlt, { maxW = 8, maxH = 4.4, minH = 1.6, x } = {}) {
    const alt = this.alt(spec, givenAlt);
    const e = imageEntry(this.images, ref);
    if (!e) {
      this.paras([P({ t: `[Picture: ${alt}]`, i: true, color: GREY }, { sz: 20 })]);
      return;
    }
    if (this.room() < minH && !this.empty()) this.fresh();
    const availH = Math.min(maxH, this.room());
    let w = maxW;
    let h = (w * e.h) / e.w;
    if (h > availH) {
      h = availH;
      w = (h * e.w) / e.h;
    }
    this.cur.picture(e, alt, { x: x ?? MX + (CW - w) / 2, y: this.cur.y, w, h });
    this.cur.y += h + 0.15;
  }

  table(b) {
    const headers = b.headers || [];
    const rows = b.rows || [];
    const n = Math.max(headers.length, ...rows.map((r) => r.length), 1);
    const sz = n >= 5 ? 14 : 16;
    const shares = columnShares(headers, rows);
    const widths = shares.map((s) => s * CW);
    const cellH = (cells, bold) =>
      Math.max(
        ...Array.from({ length: n }, (_, c) =>
          String(cells[c] ?? "")
            .split("\n")
            .reduce((a, line) => a + wrapLines({ runs: [{ t: line, b: bold }], sz, marL: 0 }, widths[c] - 0.16 - 0.02).length, 0),
        ),
        1,
      ) *
        ((sz * LINE) / 72) +
      0.12;
    const head = headers.length ? { cells: headers, head: true, h: cellH(headers, true), sz } : null;
    const body = rows.map((r) => ({ cells: Array.from({ length: n }, (_, c) => r[c] ?? ""), h: cellH(r, false), sz }));
    const firstNeed = (b.caption ? 0.5 : 0) + (head ? head.h : 0) + (body[0] ? body[0].h : 0);
    if (firstNeed > this.room() && !this.empty()) this.fresh();
    if (b.caption) this.paras([P({ t: b.caption, b: true, color: NAVY }, { sz: 20 })]);
    let i = 0;
    while (i < body.length || (i === 0 && !body.length)) {
      let room = this.room();
      const chunk = [];
      let h = head ? head.h : 0;
      while (i < body.length && h + body[i].h <= room + 0.001) {
        chunk.push(body[i]);
        h += body[i].h;
        i++;
      }
      if (!chunk.length && i < body.length) {
        if (this.empty()) {
          chunk.push(body[i++]); // a single row taller than the slide: place it and let it run
          h += chunk[0].h;
        } else {
          this.fresh();
          continue;
        }
      }
      this.cur.table([...(head ? [head] : []), ...chunk], widths, { y: this.cur.y, sz });
      this.cur.y += h + 0.2;
      if (i < body.length) this.fresh();
      else break;
    }
  }

  // -- problems --

  problemParts(b, sz) {
    const NUMW = 0.6;
    const head = [];
    const first = b.stem ? b.stem : b.ask || "";
    head.push(
      P([{ t: `${b.n}.\t`, b: true, color: NAVY }, { t: first, b: !b.stem }], { sz, marL: NUMW, indent: -NUMW, spcAft: 6 }),
    );
    if (b.stem && b.ask) head.push(P({ t: b.ask, b: true }, { sz, marL: NUMW, spcAft: 6 }));
    if (b.expr) head.push(P({ t: b.expr, b: true }, { sz: Math.min(sz + 8, 36), algn: "ctr", spcBef: 4, spcAft: 8 }));
    const tail = [];
    (b.choices || []).forEach((c, i) =>
      tail.push(P([{ t: `${letter(i)}.\t`, b: true }, { t: c }], { sz, marL: NUMW + 0.55, indent: -0.55, spcAft: 4 })),
    );
    (b.frames || []).forEach((f) => tail.push(P({ t: f, i: true }, { sz, marL: NUMW, spcAft: 8 })));
    return { head, tail, W: CW - 0.2 };
  }

  /** Try to place one whole problem on the current slide at the given type sizes. Returns true when it fit. */
  tryProblem(b, ref, sizes, minPic) {
    const hasPic = Boolean(b.visual);
    const e = hasPic ? imageEntry(this.images, `${ref}.v`) : null;
    for (const sz of sizes) {
      const { head, tail, W } = this.problemParts(b, sz);
      const hH = parasHeight(head, W) + 0.1;
      const tH = parasHeight(tail, W) + (tail.length ? 0.1 : 0);
      const alt = hasPic ? this.alt(b.visual, b.visual.alt) : "";
      const capH = hasPic && !e ? parasHeight([P({ t: `[Picture: ${alt}]`, i: true }, { sz: 20 })], W) + 0.1 : 0;
      const room = this.room();
      let picH = 0;
      if (e) {
        picH = Math.min(3.0, room - hH - tH - 0.15);
        if (picH < minPic) continue;
      }
      if (hH + tH + capH + (e ? picH + 0.15 : 0) > room + 0.001) continue;
      const c = this.cur;
      c.text(head, { y: c.y, h: hH, name: "Problem" });
      c.y += hH;
      if (hasPic && !e) {
        c.text([P({ t: `[Picture: ${alt}]`, i: true, color: GREY }, { sz: 20 })], { y: c.y, h: capH, name: "Picture description" });
        c.y += capH;
      }
      if (e) {
        const w = Math.min(8, (picH * e.w) / e.h);
        const h = (w * e.h) / e.w;
        c.picture(e, this.alt(b.visual, b.visual.alt), { x: MX + 0.6, y: c.y, w, h });
        c.y += h + 0.15;
      }
      if (tail.length) {
        c.text(tail, { y: c.y, h: tH, name: "Choices" });
        c.y += tH;
      }
      c.y += 0.15;
      c.problems++;
      return true;
    }
    return false;
  }

  /**
   * One problem. Large type (24pt) is kept whenever possible: a second problem shares a slide only if it fits at 24pt,
   * otherwise it moves to its own slide, where the type may step down (never below 20pt) to keep the problem whole.
   */
  problem(b, ref) {
    if (this.cur.problems >= 2 || (this.room() < 1.6 && !this.empty())) this.fresh();
    if (!this.empty() && this.tryProblem(b, ref, [24], 1.8)) return;
    if (!this.empty()) this.fresh();
    if (this.tryProblem(b, ref, [24, 22, 20], 1.0)) return;
    // too big even alone: flow its parts across slides
    const { head, tail } = this.problemParts(b, 20);
    this.paras(head);
    if (b.visual) this.picture(`${ref}.v`, b.visual, b.visual.alt, { maxH: 3 });
    if (tail.length) this.paras(tail);
    this.cur.problems++;
  }

  // -- other blocks --

  list(b) {
    const items = b.items || [];
    const sz = items.join(" ").length > 600 ? 20 : 24;
    this.paras(
      items.map((t, i) => P({ t }, { sz, marL: 0.5, indent: -0.4, bullet: b.ordered ? { num: i + 1 } : "dot", spcAft: 8 })),
    );
  }

  frames(b) {
    this.paras([
      P({ t: "Sentence frames", b: true, color: GREY }, { sz: 18, spcAft: 4 }),
      ...(b.items || []).map((t) => P({ t, i: true }, { sz: 24, marL: 0.3, spcAft: 10 })),
    ]);
  }

  checks(b) {
    this.paras(
      (b.items || []).map((t) =>
        P([{ t: "☐\t", font: "Segoe UI Symbol", sz: 26 }, { t }], { sz: 24, marL: 0.55, indent: -0.55, spcAft: 8 }),
      ),
    );
  }

  wordbank(b) {
    const words = b.words || [];
    if (!words.length) return;
    const cols = Math.ceil(words.length / Math.ceil(words.length / 5));
    const w = CW / cols;
    const sz = 22;
    const rows = [];
    for (let i = 0; i < words.length; i += cols) {
      const slice = Array.from({ length: cols }, (_, c) => words[i + c] ?? "");
      const lines = Math.max(...slice.map((t) => wrapLines({ runs: [{ t, b: true }], sz, marL: 0 }, w - 0.18).length));
      rows.push({ cells: slice, h: lines * ((sz * LINE) / 72) + 0.2, anchor: "ctr", algn: "ctr", sz });
      rows[rows.length - 1].head = false;
    }
    const total = rows.reduce((a, r) => a + r.h, 0) + 0.45;
    if (total > this.room() && !this.empty()) this.fresh();
    this.paras([P({ t: "Word bank", b: true, color: GREY }, { sz: 18, spcAft: 2 })]);
    this.cur.table(rows, Array(cols).fill(w), { y: this.cur.y, sz, border: "333333", bw: 19050 });
    this.cur.y += rows.reduce((a, r) => a + r.h, 0) + 0.2;
  }

  cards(b, ref) {
    const items = b.items || [];
    if (!items.length) return;
    const hasVisual = items.some((c) => c.visual);
    const cols = hasVisual ? 1 : b.cols === 3 ? 3 : 2;
    const rowsPer = hasVisual ? 1 : 2;
    const per = cols * rowsPer;
    if (!this.empty()) this.fresh();
    for (let i = 0; i < items.length; i += per) {
      if (i > 0) this.fresh();
      const gap = 0.25;
      const cw = hasVisual ? 8 : (CW - (cols - 1) * gap) / cols;
      const ch = hasVisual ? CB - CT : (CB - CT - gap) / rowsPer;
      items.slice(i, i + per).forEach((it, k) => {
        const col = hasVisual ? 0 : k % cols;
        const row = hasVisual ? 0 : Math.floor(k / cols);
        const x = hasVisual ? MX + (CW - cw) / 2 : MX + col * (cw + gap);
        const y = CT + row * (ch + gap);
        let textTop = y;
        let textH = ch;
        if (hasVisual && it.visual) {
          const e = imageEntry(this.images, `${ref}.c${i + k}`);
          if (e) {
            let h = Math.min(3.0, ch - 1.6);
            let w = (h * e.w) / e.h;
            if (w > cw - 0.4) {
              w = cw - 0.4;
              h = (w * e.h) / e.w;
            }
            this.cur.picture(e, this.alt(it.visual, it.visual.alt), { x: x + (cw - w) / 2, y: y + 0.15, w, h });
            textTop = y + h + 0.3;
            textH = ch - (h + 0.3);
          }
        }
        for (const fsz of cols === 3 ? [24, 20] : [32, 28, 24]) {
          const paras = [P({ t: it.front, b: true }, { sz: fsz, algn: "ctr", spcAft: 10 })];
          if (it.back) paras.push(P({ t: it.back, i: true, color: GREY }, { sz: Math.max(18, fsz - 8), algn: "ctr", spcAft: 4 }));
          if (parasHeight(paras, cw - 0.5) <= textH - 0.2 || fsz === 20 || fsz === 24) {
            this.cur.text(paras, { x, y: textTop, w: cw, h: textH, anchor: "ctr", line: "333333", dash: "dash", geom: "roundRect", inset: [0.25, 0.1], name: "Card" });
            break;
          }
        }
      });
      this.cur.y = CB;
    }
  }

  run() {
    const r = this.r;
    // title slide
    const meta = metaLine(r);
    const ts = { title: r.title, sub: [r.subtitle, meta].filter(Boolean).join("\n"), titleSlide: true };
    this.titleSlide = ts;
    r.sections.forEach((s, si) => {
      this.begin(s.heading || r.title);
      s.blocks.forEach((b, bi) => {
        const ref = blockRef(si, bi);
        switch (b.t) {
          case "p": {
            const long = String(b.text || "").length;
            const sz = long > 900 ? 20 : long > 500 ? 22 : 24;
            const t = String(b.text ?? "");
            const paras = t.split("\n").map((line) => {
              if (b.style === "note") return P({ t: line, i: true, color: GREY }, { sz: Math.min(sz, 20) });
              if (b.style === "quote") return P({ t: line, i: true }, { sz, marL: 0.4 });
              return P({ t: line }, { sz });
            });
            if (b.style === "directions")
              return this.paras(paras, { decor: { fill: "F1F5F7", line: NAVY, lineW: 25400 }, inset: [0.2, 0.12] });
            if (b.style === "teacher")
              return this.paras(paras, { decor: { fill: "FFF6DA", line: "6B4E00", dash: "dash", lineW: 19050 }, inset: [0.2, 0.12] });
            return this.paras(paras);
          }
          case "list":
            return this.list(b);
          case "table":
            return this.table(b);
          case "visual":
            return this.picture(ref, b.spec, b.alt);
          case "problem":
            return this.problem(b, ref);
          case "frames":
            return this.frames(b);
          case "wordbank":
            return this.wordbank(b);
          case "cards":
            return this.cards(b, ref);
          case "lines":
            if (b.prompt) this.paras([P({ t: b.prompt, b: true })]);
            return;
          case "check":
            return this.checks(b);
          case "pagebreak":
            if (!this.empty()) this.fresh();
            return;
          default:
        }
      });
    });
    // a section that produced nothing leaves an empty slide: drop those (never the only one)
    this.slides = this.slides.filter((s, i, a) => s.shapes.length || a.length === 1);
    return this.slides;
  }
}

// ── package parts ───────────────────────────────────────────────────────────

const masterTitleXfrm = `<a:xfrm><a:off x="${emu(MX)}" y="${emu(0.4)}"/><a:ext cx="${emu(CW)}" cy="${emu(0.95)}"/></a:xfrm>`;

function ph(id, name, type, idx, xfrm, body, extra = "") {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${name}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="${type}"${idx != null ? ` idx="${idx}"` : ""}/></p:nvPr></p:nvSpPr><p:spPr>${xfrm}${extra}</p:spPr><p:txBody>${body}</p:txBody></p:sp>`;
}
const grp = `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>`;

function masterXml() {
  const lvl = (n, marL, sz) =>
    `<a:lvl${n}pPr marL="${marL}" indent="0" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:lnSpc><a:spcPct val="100000"/></a:lnSpc><a:spcBef><a:spcPts val="600"/></a:spcBef><a:buNone/><a:defRPr sz="${sz}" kern="1200">${solid(INK)}<a:latin typeface="Arial"/><a:ea typeface="+mn-ea"/><a:cs typeface="Arial"/></a:defRPr></a:lvl${n}pPr>`;
  return `${XML}<p:sldMaster xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"><p:cSld><p:bg><p:bgPr>${solid("FFFFFF")}<a:effectLst/></p:bgPr></p:bg><p:spTree>${grp}<p:sp><p:nvSpPr><p:cNvPr id="7" name="Accent bar"/><p:cNvSpPr/><p:nvPr userDrawn="1"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="12192000" cy="${emu(0.14)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${solid(TEAL)}<a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr rtlCol="0" anchor="ctr"/><a:lstStyle/><a:p><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>${ph(2, "Title Placeholder 1", "title", null, masterTitleXfrm, `<a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0" anchor="ctr"><a:noAutofit/></a:bodyPr><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master title style</a:t></a:r></a:p>`, '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>')}${ph(3, "Text Placeholder 2", "body", 1, `<a:xfrm><a:off x="${emu(MX)}" y="${emu(CT)}"/><a:ext cx="${emu(CW)}" cy="${emu(CB - CT)}"/></a:xfrm>`, `<a:bodyPr vert="horz" lIns="91440" tIns="45720" rIns="91440" bIns="45720" rtlCol="0"><a:normAutofit/></a:bodyPr><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>`, '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>')}</p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/><p:sldLayoutId id="2147483650" r:id="rId2"/><p:sldLayoutId id="2147483651" r:id="rId3"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle><a:lvl1pPr algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:lnSpc><a:spcPct val="90000"/></a:lnSpc><a:spcBef><a:spcPct val="0"/></a:spcBef><a:buNone/><a:defRPr sz="3000" b="1" kern="1200">${solid(NAVY)}<a:latin typeface="Arial"/><a:ea typeface="+mj-ea"/><a:cs typeface="Arial"/></a:defRPr></a:lvl1pPr></p:titleStyle><p:bodyStyle>${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => lvl(n, (n - 1) * 457200, 2400)).join("")}</p:bodyStyle><p:otherStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr>${[1, 2, 3].map((n) => lvl(n, (n - 1) * 457200, 1800)).join("")}</p:otherStyle></p:txStyles></p:sldMaster>`;
}

function layoutXml(kind) {
  const common = `xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"`;
  if (kind === "title") {
    const t = ph(2, "Title 1", "ctrTitle", null, `<a:xfrm><a:off x="${emu(1)}" y="${emu(2.2)}"/><a:ext cx="${emu(SLIDE_W - 2)}" cy="${emu(1.7)}"/></a:xfrm>`, `<a:bodyPr anchor="b"><a:noAutofit/></a:bodyPr><a:lstStyle><a:lvl1pPr algn="l"><a:defRPr sz="4400" b="1"/></a:lvl1pPr></a:lstStyle><a:p><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master title style</a:t></a:r></a:p>`);
    const s = ph(3, "Subtitle 2", "subTitle", 1, `<a:xfrm><a:off x="${emu(1)}" y="${emu(4.1)}"/><a:ext cx="${emu(SLIDE_W - 2)}" cy="${emu(1.6)}"/></a:xfrm>`, `<a:bodyPr><a:noAutofit/></a:bodyPr><a:lstStyle><a:lvl1pPr marL="0" indent="0" algn="l"><a:buNone/><a:defRPr sz="2400"/></a:lvl1pPr></a:lstStyle><a:p><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master subtitle style</a:t></a:r></a:p>`);
    return `${XML}<p:sldLayout ${common} type="title" preserve="1"><p:cSld name="Title Slide"><p:spTree>${grp}${t}${s}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
  }
  const title = ph(2, "Title 1", "title", null, "", `<a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master title style</a:t></a:r></a:p>`);
  if (kind === "content") {
    const body = ph(3, "Content Placeholder 2", "body", 1, "", `<a:bodyPr/><a:lstStyle/><a:p><a:pPr lvl="0"/><a:r><a:rPr lang="en-US"/><a:t>Click to edit Master text styles</a:t></a:r></a:p>`);
    return `${XML}<p:sldLayout ${common} type="obj" preserve="1"><p:cSld name="Title and Content"><p:spTree>${grp}${title}${body}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
  }
  return `${XML}<p:sldLayout ${common} type="titleOnly" preserve="1"><p:cSld name="Title Only"><p:spTree>${grp}${title}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;
}

function themeXml() {
  const clr = (n, v) => `<a:${n}><a:srgbClr val="${v}"/></a:${n}>`;
  const fills = `<a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>`;
  const lns = [6350, 12700, 19050].map((w) => `<a:ln w="${w}" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/><a:miter lim="800000"/></a:ln>`).join("");
  return `${XML}<a:theme xmlns:a="${NS.a}" name="Math Literacy Studio"><a:themeElements><a:clrScheme name="Math Literacy Studio">${clr("dk1", INK)}${clr("lt1", "FFFFFF")}${clr("dk2", NAVY)}${clr("lt2", "F7F4EC")}${clr("accent1", NAVY)}${clr("accent2", TEAL)}${clr("accent3", "F2C15B")}${clr("accent4", "E8765A")}${clr("accent5", "2F6FB0")}${clr("accent6", "6B7B88")}${clr("hlink", "0B5CAD")}${clr("folHlink", "6B7B88")}</a:clrScheme><a:fontScheme name="Math Literacy Studio"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Office">${fills}<a:lnStyleLst>${lns}</a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;
}

const relsXml = (items) =>
  `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items.map(([id, type, target]) => `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`).join("")}</Relationships>`;

/** The .pptx bytes for a Resource. `images`: Map(blockRef -> { png, w, h }). */
export function pptxBytes(resource, { images = new Map(), renderVisual = null, key = false } = {}) {
  const r = key ? keyResource(resource) : normalizeResource(resource);
  const deck = new Deck(r, { images, renderVisual });
  const slides = deck.run();
  const lang = r.lang === "es" ? "es-US" : "en-US";
  const lineH = (sz) => (sz * LINE) / 72;
  let titleSz = 26;
  for (const sz of [44, 36, 30, 26]) {
    const n = wrapLines({ runs: [{ t: r.title, b: true }], sz, marL: 0 }, SLIDE_W - 2 - 0.2).length;
    if (n * lineH(sz) * 0.9 <= 1.6) {
      titleSz = sz;
      break;
    }
  }

  // title slide
  const subParas = deck.titleSlide.sub
    ? deck.titleSlide.sub
        .split("\n")
        .map((line) => `<a:p><a:r><a:rPr lang="${lang}" dirty="0"/><a:t>${xesc(line)}</a:t></a:r></a:p>`)
        .join("")
    : '<a:p><a:endParaRPr lang="en-US"/></a:p>';
  const titleXml = `${XML}<p:sld xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"><p:cSld><p:spTree>${grp}<p:sp><p:nvSpPr><p:cNvPr id="2" name="Title 1"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="ctrTitle"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="${lang}"${titleSz !== 44 ? ` sz="${titleSz * 100}"` : ""} dirty="0"/><a:t>${xesc(r.title)}</a:t></a:r></a:p></p:txBody></p:sp><p:sp><p:nvSpPr><p:cNvPr id="3" name="Subtitle 2"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr><p:ph type="subTitle" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>${subParas}</p:txBody></p:sp></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

  const parts = {};
  const ctOver = [];
  const presRels = [["rId1", `${REL}/slideMaster`, "slideMasters/slideMaster1.xml"]];
  const sldIds = [];
  const all = [{ xml: titleXml, layout: 1, images: [] }, ...slides.map((s) => ({ xml: s.xml("rIdLay"), layout: 3, images: s.images }))];
  all.forEach((s, i) => {
    const n = i + 1;
    parts[`ppt/slides/slide${n}.xml`] = s.xml;
    parts[`ppt/slides/_rels/slide${n}.xml.rels`] = relsXml([
      ["rIdLay", `${REL}/slideLayout`, `../slideLayouts/slideLayout${s.layout}.xml`],
      ...s.images.map((im, k) => [im.rid, `${REL}/image`, `../media/s${n}i${k + 1}.png`]),
    ]);
    s.images.forEach((im, k) => {
      parts[`ppt/media/s${n}i${k + 1}.png`] = im.bytes;
    });
    presRels.push([`rIdS${n}`, `${REL}/slide`, `slides/slide${n}.xml`]);
    sldIds.push(`<p:sldId id="${255 + n}" r:id="rIdS${n}"/>`);
    ctOver.push(`<Override PartName="/ppt/slides/slide${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`);
  });
  presRels.push(
    ["rIdTheme", `${REL}/theme`, "theme/theme1.xml"],
    ["rIdPres", `${REL}/presProps`, "presProps.xml"],
    ["rIdView", `${REL}/viewProps`, "viewProps.xml"],
    ["rIdTbl", `${REL}/tableStyles`, "tableStyles.xml"],
  );
  const created = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const deftxt = `<p:defaultTextStyle><a:defPPr><a:defRPr lang="en-US"/></a:defPPr>${[1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((n) => `<a:lvl${n}pPr marL="${(n - 1) * 457200}" algn="l" defTabSz="914400" rtl="0" eaLnBrk="1" latinLnBrk="0" hangingPunct="1"><a:defRPr sz="1800" kern="1200">${solid(INK)}<a:latin typeface="Arial"/><a:ea typeface="+mn-ea"/><a:cs typeface="Arial"/></a:defRPr></a:lvl${n}pPr>`)
    .join("")}</p:defaultTextStyle>`;

  const files = {};
  files["[Content_Types].xml"] = `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>${[1, 2, 3].map((n) => `<Override PartName="/ppt/slideLayouts/slideLayout${n}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>`).join("")}${ctOver.join("")}<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/ppt/presProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presProps+xml"/><Override PartName="/ppt/viewProps.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.viewProps+xml"/><Override PartName="/ppt/tableStyles.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.tableStyles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`;
  files["_rels/.rels"] = relsXml([
    ["rId1", `${REL}/officeDocument`, "ppt/presentation.xml"],
    ["rId2", "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties", "docProps/core.xml"],
  ]);
  files["docProps/core.xml"] = `${XML}<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xesc(r.title)}</dc:title><dc:subject>${xesc(r.subtitle || "")}</dc:subject><dc:creator>${MLS_NAME}</dc:creator><dc:language>${lang}</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">${created}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${created}</dcterms:modified></cp:coreProperties>`;
  files["ppt/presentation.xml"] = `${XML}<p:presentation xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}" saveSubsetFonts="1"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${sldIds.join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/>${deftxt}</p:presentation>`;
  files["ppt/_rels/presentation.xml.rels"] = relsXml(presRels);
  files["ppt/slideMasters/slideMaster1.xml"] = masterXml();
  files["ppt/slideMasters/_rels/slideMaster1.xml.rels"] = relsXml([
    ["rId1", `${REL}/slideLayout`, "../slideLayouts/slideLayout1.xml"],
    ["rId2", `${REL}/slideLayout`, "../slideLayouts/slideLayout2.xml"],
    ["rId3", `${REL}/slideLayout`, "../slideLayouts/slideLayout3.xml"],
    ["rId4", `${REL}/theme`, "../theme/theme1.xml"],
  ]);
  ["title", "content", "titleOnly"].forEach((k, i) => {
    files[`ppt/slideLayouts/slideLayout${i + 1}.xml`] = layoutXml(k);
    files[`ppt/slideLayouts/_rels/slideLayout${i + 1}.xml.rels`] = relsXml([["rId1", `${REL}/slideMaster`, "../slideMasters/slideMaster1.xml"]]);
  });
  files["ppt/theme/theme1.xml"] = themeXml();
  files["ppt/presProps.xml"] = `${XML}<p:presentationPr xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"/>`;
  files["ppt/viewProps.xml"] = `${XML}<p:viewPr xmlns:a="${NS.a}" xmlns:r="${NS.r}" xmlns:p="${NS.p}"><p:normalViewPr><p:restoredLeft sz="15620"/><p:restoredTop sz="94660"/></p:normalViewPr><p:slideViewPr><p:cSldViewPr><p:cViewPr varScale="1"><p:scale><a:sx n="100" d="100"/><a:sy n="100" d="100"/></p:scale><p:origin x="0" y="0"/></p:cViewPr><p:guideLst/></p:cSldViewPr></p:slideViewPr><p:notesTextViewPr><p:cViewPr><p:scale><a:sx n="1" d="1"/><a:sy n="1" d="1"/></p:scale><p:origin x="0" y="0"/></p:cViewPr></p:notesTextViewPr><p:gridSpacing cx="76200" cy="76200"/></p:viewPr>`;
  files["ppt/tableStyles.xml"] = `${XML}<a:tblStyleLst xmlns:a="${NS.a}" def="{5C22544A-7EE6-4342-B048-85BDC9FD1C3A}"/>`;
  return zipStore({ ...files, ...parts });
}

export const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
