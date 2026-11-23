// IR -> HTML. One renderer feeds the live preview, the browser print view and the QC PDF,
// so what a teacher edits is exactly what prints. Every string is escaped here.
import { esc } from "../core/dom.js";
import { accentCss, pageGeometry, styleFor } from "./style.js";
import { visibleSections } from "./ir.js";

const BRAND = "The Language Page";
const KIND_TITLE = { key: "Answer key - teacher copy", notes: "Teacher implementation notes" };

/** Render context: edit mode adds contenteditable; the preview supplies the block controls. Visuals come from core/visuals.js. */
export function createRenderer({ edit = false, renderVisual = null } = {}) {
  const ed = (bid, path, label = "Edit text") =>
    edit ? ` contenteditable="true" spellcheck="true" role="textbox" aria-label="${esc(label)}" data-path="${esc(`${bid}:${path}`)}"` : "";
  const visual = (spec, wMm, extra = "") => {
    if (!spec) return "";
    let svg = "";
    try {
      svg = renderVisual ? renderVisual(spec, { resolved: true }) : "";
    } catch {
      svg = "";
    }
    if (!svg) return `<div class="st-x-visual st-x-visual--failed" data-visual-failed="1" role="img" aria-label="${esc(spec.alt || "Picture")}"></div>`;
    return `<div class="st-x-visual" style="${wMm ? `width:${wMm}mm;` : ""}${extra}">${svg}</div>`;
  };

  const cellHtml = (b, c, r, ci, head) => {
    const tag = head ? "th" : "td";
    const attrs = [
      c.span > 1 ? `colspan="${c.span}"` : "",
      c.rowspan > 1 ? `rowspan="${c.rowspan}"` : "",
      `class="st-x-cell st-x-cell--${c.kind || "plain"}${c.align ? ` st-x-al-${c.align}` : ""}"`,
      c.h ? `style="height:calc(var(--x-line) * ${c.h})"` : "",
    ].filter(Boolean).join(" ");
    const path = head ? `head.${ci}.t` : `rows.${r}.${ci}.t`;
    const inner = `${c.visual ? visual(c.visual, c.visualMm || 28) : ""}${c.t || edit ? `<span class="st-x-ct"${ed(b.id, path)}>${esc(c.t)}</span>` : ""}`;
    return `<${tag} ${attrs}>${inner}</${tag}>`;
  };

  const cardHtml = (b, c, i) => {
    const frames = (c.frames || []).map((f, k) => `<div class="st-x-cframe"${ed(b.id, `items.${i}.frames.${k}`)}>${esc(f)}</div>`).join("");
    const lines = Array.from({ length: c.lines || 0 }, () => `<div class="st-x-line"></div>`).join("");
    return `<div class="st-x-card" data-i="${i}">
      ${c.num !== "" && c.num != null ? `<div class="st-x-cnum">${esc(c.num)}</div>` : ""}
      ${c.tag ? `<div class="st-x-ctag st-x-chrome-sm"${ed(b.id, `items.${i}.tag`)}>${esc(c.tag)}</div>` : ""}
      ${c.visual ? visual(c.visual, c.visualMm || 0, "max-width:100%;") : ""}
      ${c.drawMm ? `<div class="st-x-cdraw" style="height:${c.drawMm}mm"><span class="st-x-chrome-sm">${esc(c.drawLabel || "Draw it")}</span></div>` : ""}
      ${c.head ? `<div class="st-x-chead st-x-chead--${c.headSize || "m"}"${ed(b.id, `items.${i}.head`)}>${esc(c.head)}</div>` : ""}
      ${c.body ? `<div class="st-x-cbody"${ed(b.id, `items.${i}.body`)}>${esc(c.body)}</div>` : ""}
      ${frames}${lines}
      ${c.foot ? `<div class="st-x-cfoot"${ed(b.id, `items.${i}.foot`)}>${esc(c.foot)}</div>` : ""}
      </div>`;
  };

  const foldHtml = (b) => {
    const flaps = b.flaps.map((f, i) => {
      const lines = Array.from({ length: f.n }, () => `<div class="st-x-line"></div>`).join("");
      return `<div class="st-x-flap" data-i="${i}"><div class="st-x-flap-front"><span${ed(b.id, `flaps.${i}.label`, "Edit flap label")}>${esc(f.label)}</span></div><div class="st-x-flap-in">${lines}</div></div>`;
    }).join("");
    const how = { flaps: "Cut the dashed lines. Fold on the solid line. Write under each flap.", layers: "Cut out each strip. Stack them with the labels showing. Staple along the top.", accordion: "Cut the dashed outline. Fold on each solid line like a fan." }[b.kind] || "";
    return `<div class="st-x-fold st-x-fold--${b.kind}" style="height:${b.hMm}mm;--n:${b.flaps.length}">${flaps}</div><p class="st-x-chrome-sm st-x-foldhow">${esc(how)}</p>`;
  };

  const blockInner = (b) => {
    switch (b.type) {
      case "title":
        return `<h1 class="st-x-title"${ed(b.id, "text", "Edit title")}>${esc(b.text)}</h1>${b.sub ? `<p class="st-x-sub"${ed(b.id, "sub")}>${esc(b.sub)}</p>` : ""}`;
      case "h":
        return `<h${b.level} class="st-x-h"${ed(b.id, "text", "Edit heading")}>${esc(b.text)}</h${b.level}>`;
      case "p":
        return `<p class="st-x-p st-x-p--${b.tone || "plain"}"${ed(b.id, "text")}>${esc(b.text)}</p>`;
      case "list": {
        const tag = b.ordered ? "ol" : "ul";
        return `<${tag} class="st-x-list${b.bare ? " st-x-list--bare" : ""}">${b.items.map((t, i) => `<li data-i="${i}"><span${ed(b.id, `items.${i}`)}>${esc(t)}</span></li>`).join("")}</${tag}>`;
      }
      case "check":
        return `<ul class="st-x-checks">${b.items.map((t, i) => `<li data-i="${i}"><span class="st-x-box" aria-hidden="true"></span><span${ed(b.id, `items.${i}`)}>${esc(t)}</span></li>`).join("")}</ul>`;
      case "lines":
        return `${b.label ? `<p class="st-x-label"${ed(b.id, "label")}>${esc(b.label)}</p>` : ""}${Array.from({ length: b.n }, () => `<div class="st-x-line"></div>`).join("")}`;
      case "box":
        return `<div class="st-x-wbox${b.grid ? " st-x-wbox--grid" : ""}" style="height:calc(var(--x-line) * ${b.n})">${b.label ? `<span class="st-x-wlabel"${ed(b.id, "label")}>${esc(b.label)}</span>` : ""}${b.hint ? `<span class="st-x-whint"${ed(b.id, "hint")}>${esc(b.hint)}</span>` : ""}</div>`;
      case "frames":
        return `${b.label ? `<p class="st-x-label"${ed(b.id, "label")}>${esc(b.label)}</p>` : ""}${b.items.map((t, i) => `<div class="st-x-frame" data-i="${i}"><div class="st-x-ftext"${ed(b.id, `items.${i}`)}>${esc(t)}</div><div class="st-x-line"></div></div>`).join("")}`;
      case "bank":
        return `<div class="st-x-bank"><span class="st-x-bank-l"${ed(b.id, "label")}>${esc(b.label)}</span>${b.words.map((w, i) => `<span class="st-x-word" data-i="${i}"><span${ed(b.id, `words.${i}`)}>${esc(w)}</span></span>`).join("")}</div>`;
      case "visual":
        return `<figure class="st-x-fig">${visual(b.spec, b.wMm)}${b.caption ? `<figcaption${ed(b.id, "caption")}>${esc(b.caption)}</figcaption>` : ""}</figure>`;
      case "table": {
        const total = b.cols.reduce((a, c) => a + c, 0);
        const cg = b.cols.map((c) => `<col style="width:${((c / total) * 100).toFixed(2)}%">`).join("");
        const head = b.head ? `<thead><tr>${b.head.map((c, ci) => cellHtml(b, c, 0, ci, true)).join("")}</tr></thead>` : "";
        const rows = b.rows.map((r, ri) => `<tr${b.rowLines ? ` style="height:calc(var(--x-line) * ${b.rowLines})"` : ""}>${r.map((c, ci) => cellHtml(b, c, ri, ci, false)).join("")}</tr>`).join("");
        return `<table class="st-x-table${b.accentHead ? "" : " st-x-table--plainhead"}"><colgroup>${cg}</colgroup>${head}<tbody>${rows}</tbody></table>`;
      }
      case "cards":
        return `<div class="st-x-cards${b.cut ? " st-x-cards--cut" : ""}" style="--cols:${b.cols};--card-h:${b.hMm}mm">${b.items.map((c, i) => cardHtml(b, c, i)).join("")}</div>`;
      case "fold":
        return foldHtml(b);
      case "sep":
        return `<div class="st-x-sep st-x-sep--${b.kind}">${b.label ? `<span class="st-x-chrome-sm"${ed(b.id, "label")}>${esc(b.label)}</span>` : ""}</div>`;
      case "namebar":
        return `<div class="st-x-namebar">${b.fields.map((f, i) => `<span class="st-x-nf"><span class="st-x-nl"${ed(b.id, `fields.${i}`)}>${esc(f)}</span><span class="st-x-nline"></span></span>`).join("")}</div>`;
      case "trace":
        return b.words.map((w) => `<div class="st-x-trace"><span class="st-x-trw">${esc(w)}</span><span class="st-x-trw">${esc(w)}</span><span class="st-x-trw">${esc(w)}</span><div class="st-x-line"></div></div>`).join("");
      case "spacer":
        return `<div style="height:${b.mm}mm" aria-hidden="true"></div>`;
      case "row":
        return `<div class="st-x-row" style="grid-template-columns:${b.cols.map((c) => `${c.fr}fr`).join(" ")}">${b.cols.map((c) => `<div class="st-x-col">${c.blocks.map(blockHtml).join("")}</div>`).join("")}</div>`;
      default:
        return "";
    }
  };

  function blockHtml(b) {
    return `<div class="st-x-b st-x-b--${b.type}" data-type="${b.type}" data-bid="${b.id}">${blockInner(b)}</div>`;
  }

  return { blockHtml };
}

/** The sheets for one audience. Returns { html, pages }. */
export function renderDoc(doc, { audience = "student", edit = false, renderVisual = null } = {}) {
  const r = createRenderer({ edit, renderVisual });
  const g = pageGeometry(doc.format);
  const st = styleFor(doc.meta.band);
  const secs = visibleSections(doc, audience);
  const total = secs.reduce((a, s) => a + s.pages.length, 0);
  const source = doc.meta.sourceLine || "";
  const vars = `--x-accent:${accentCss(doc.meta.subject)};--x-body:${st.bodyPt}pt;--x-head:${st.headPt}pt;--x-small:${st.smallPt}pt;--x-line:${st.lineMm}mm;--x-pw:${g.wMm}mm;--x-ph:${g.hMm}mm;--x-m:${g.marginMm}mm`;
  const pages = secs.flatMap((s) =>
    s.pages.map((pg) => {
      const label = KIND_TITLE[s.kind] || "";
      return `<section class="st-x-page" data-kind="${s.kind}" data-page="${pg.number}" data-pid="${pg.id}" aria-label="Page ${pg.number} of ${total}">
<header class="st-x-chrome st-x-head"><span class="st-x-brand">${BRAND}</span><span class="st-x-headr">${esc(label || doc.meta.shortTitle || doc.title)}${pg.tag ? ` <span class="st-x-tier">${esc(pg.tag)}</span>` : ""}</span></header>
<div class="st-x-body">${pg.blocks.map(r.blockHtml).join("")}</div>
<footer class="st-x-chrome st-x-foot"><span class="st-x-src">${esc(source)}</span><span class="st-x-pn">Page ${pg.number} of ${total}</span></footer></section>`;
    }),
  );
  const html = `<div class="st-x-doc" data-band="${esc(doc.meta.band)}" data-orient="${g.orientation}" style="${vars}">${pages.join("\n")}</div>`;
  return { html, pages: total, geometry: g };
}

/** @page rule for the current geometry. Injected beside the sheets, never hard-coded in CSS. */
export const pageRule = (format) => `@page{size:${pageGeometry(format).cssSize};margin:0}`;

/** A complete HTML file: used by the QC PDF render and any "open in a new tab" use. */
export function standaloneHtml(doc, opts = {}) {
  const { html } = renderDoc(doc, opts);
  const css = opts.css || "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">${opts.base ? `<base href="${esc(opts.base)}">` : ""}<title>${esc(doc.title)}</title><meta name="viewport" content="width=device-width,initial-scale=1">${(opts.cssHrefs || []).map((h) => `<link rel="stylesheet" href="${esc(h)}">`).join("")}<style>${css}${pageRule(doc.format)}</style></head><body class="st-x-standalone">${html}</body></html>`;
}
