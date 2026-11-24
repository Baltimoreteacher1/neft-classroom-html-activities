// Language Studio print: renders a document model (studio-doc.js) to a complete, print-ready HTML string,
// and exposes the one entry point used by the export endpoint and tests: renderStudioPart().

import { levelFromWida, palette, TOKENS } from "./studio-doc.js";
import { buildBook } from "./studio-doc-book.js";
import { buildFamily } from "./studio-doc-family.js";
import { buildKey } from "./studio-doc-key.js";
import { buildKit } from "./studio-doc-kits.js";
import { buildPacket } from "./studio-doc-packet.js";
import { buildWriting, buildWritingKey } from "./studio-doc-writing.js";
import { iconSvg } from "./studio-icons.js";
import { printCss } from "./studio-print-css.js";

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const tn = (tone) => `tn-${tone || "neutral"}`;
const px = (n) => `${Number(n) || 0}pt`;

function runHtml(run) {
  if (typeof run === "string") return esc(run);
  if (run.icon) return `<span class="ico">${iconSvg(run.icon, { size: run.size || 14 })}</span>`;
  if (run.badge !== undefined) return `<span class="nbadge">${esc(run.badge)}</span>`;
  if (run.gap !== undefined)
    return `<span class="gap"><span>${run.gap === "…" ? "&nbsp;" : esc(run.gap)}</span></span>`;
  if (run.blank !== undefined) {
    const fill = run.fill ? `<span class="fill">${esc(run.fill)}</span>` : "&nbsp;";
    return `<span class="blank"><b>${esc(run.blank)}</b>${fill}</span>`;
  }
  let h = esc(run.t);
  if (run.fill) h = `<span class="fill">${h}</span>`;
  if (run.b) h = `<strong>${h}</strong>`;
  if (run.i) h = `<em>${h}</em>`;
  if (run.small) h = `<span class="sm">${h}</span>`;
  if (run.hl) h = `<span class="hl ${tn(run.hl)}">${h}</span>`;
  return h;
}

const runs = (list) => (list || []).map(runHtml).join("");

function cellHtml(cell, tag = "td") {
  if (cell === null || cell === undefined) return `<${tag}></${tag}>`;
  if (typeof cell === "string" || typeof cell === "number") return `<${tag}>${esc(cell)}</${tag}>`;
  const cls = [
    cell.bold ? "c-b" : "",
    cell.align === "center" ? "c-c" : "",
    cell.tone ? `c-fill ${tn(cell.tone)}` : "",
  ]
    .filter(Boolean)
    .join(" ");
  const inner = cell.blocks
    ? blocksHtml(cell.blocks)
    : runs(cell.runs || [{ t: cell.t ?? cell.text ?? "" }]);
  return `<${tag}${cls ? ` class="${cls}"` : ""}>${inner}</${tag}>`;
}

const RENDER = {
  band: (
    x,
  ) => `<div class="band ${tn(x.domain)}"><div class="num">${esc(x.number)}</div><div class="ic">${iconSvg(palette(x.domain).icon, { size: 22 })}</div>
  <div class="tt"><div class="dom">${esc(x.domain)}</div><div class="ti head">${esc(x.title)}</div></div>
  <div class="meta"><span class="pill">${esc(x.minutes)} min</span><span class="pill">${esc(x.grouping)}</span></div></div>`,

  hero: (x) => {
    const head = `<div class="top">${heroGeo()}<div class="kick">${esc(x.kicker)}</div><div class="tit head">${esc(x.title)}</div><div class="sub">${esc(x.subtitle)}</div></div>`;
    if (x.compact) return `<div class="hero compact ${tn(x.tone)}">${head}</div>`;
    const chips = (x.chips || []).map((c) => `<span class="cchip">${esc(c)}</span>`).join("");
    const nd = x.nameDate
      ? `<div class="nd"><div>Name</div><div style="flex:.6">Date</div></div>`
      : "";
    return `<div class="hero ${tn(x.tone)}">${head}<div class="bot"><div class="chipsrow">${chips}</div>${nd}</div><div class="brand">The Language Page</div><div class="stripe"></div></div>`;
  },

  heading: (x) => {
    const ic = x.icon ? `<span class="hi">${iconSvg(x.icon, { size: 17 })}</span>` : "";
    return `<h${x.level + 0 || 2} class="h${x.level} ${x.tone ? `tone ${tn(x.tone)}` : ""}">${ic}${esc(x.text)}</h${x.level + 0 || 2}>`;
  },

  paragraph: (x) => {
    const cls = [
      "p",
      x.size ? `p-${x.size}` : "",
      x.align === "center" ? "p-c" : "",
      x.mission ? "mission" : "",
    ]
      .filter(Boolean)
      .join(" ");
    return `<p class="${cls}">${runs(x.runs)}</p>`;
  },

  callout: (x) => {
    const lab = x.label
      ? `<div class="lab">${x.icon ? iconSvg(x.icon, { size: 15 }) : ""}${esc(x.label)}</div>`
      : "";
    return `<div class="callout ${tn(x.tone)}${x.plain ? " plain" : ""}${x.strip ? " strip" : ""}">${lab}${blocksHtml(x.blocks)}</div>`;
  },

  lines: (x) => {
    const fills = x.fill || [];
    const n = Math.max(x.n || 0, fills.length);
    const rows = Array.from(
      { length: n },
      (_, k) => `<div class="ln${fills[k] ? " fill" : ""}">${esc(fills[k] || "")}</div>`,
    ).join("");
    return `<div class="lines">${x.label ? `<div class="lab">${esc(x.label)}</div>` : ""}${rows}</div>`;
  },

  table: (x) => {
    const w = x.widths
      ? `<colgroup>${x.widths.map((p) => `<col style="width:${p}%">`).join("")}</colgroup>`
      : "";
    const head = x.headers
      ? `<thead><tr>${x.headers.map((h) => cellHtml(h, "th")).join("")}</tr></thead>`
      : "";
    const body = x.rows.map((r) => `<tr>${r.map((c) => cellHtml(c)).join("")}</tr>`).join("");
    return `<table class="tbl ${tn(x.tone)}${x.zebra ? " zebra" : ""}${x.compact ? " compact" : ""}${x.sheet ? " sheet" : ""}">${w}${head}<tbody>${body}</tbody></table>`;
  },

  cardGrid: (x) => {
    const rowH = x.rowH ? `${x.rowH}in` : "2.4in";
    const rows = Math.ceil(x.cards.length / x.cols);
    const cards = x.cards
      .map(
        (c) =>
          `<div class="cd ${tn(c.tone)}${c.empty ? " empty" : ""}${c.center ? " ctr" : ""}${c.vc ? " vc" : ""}">${blocksHtml(c.blocks)}</div>`,
      )
      .join("");
    return `<div class="grid ${x.cut ? "cut" : "soft"}${x.bar === "left" ? " leftbar" : ""}" style="grid-template-columns:repeat(${x.cols},1fr);grid-template-rows:repeat(${rows},${rowH})">${cards}</div>`;
  },

  chips: (x) => {
    const items = x.items.map((it) => {
      const o = typeof it === "string" ? { text: it } : it;
      return `<span class="chip ${tn(o.tone || x.tone || "neutral")}${o.sol ? " sol" : ""}">${esc(o.text)}</span>`;
    });
    const lab = x.label
      ? `<div class="lab">${x.cut ? iconSvg("scissors", { size: 13 }) : ""}${esc(x.label)}</div>`
      : "";
    return `<div class="chips${x.cut ? " cut" : ""} ${tn(x.tone || "neutral")}">${lab}${items.join("")}</div>`;
  },

  checklist: (x) => {
    const lis = x.items.map((it, k) => {
      const inner = typeof it === "string" ? esc(it) : runs(it);
      const on = x.mark === k ? " on" : "";
      const mark =
        x.style === "bubble"
          ? `<span class="bd${on}">${x.letters === false ? "" : String.fromCharCode(65 + k)}</span>`
          : `<span class="bx${on}"></span>`;
      const note = x.notes?.[k] ? `<span class="why">${esc(x.notes[k])}</span>` : "";
      return `<li>${mark}<span>${inner}${note}</span></li>`;
    });
    return `<ul class="chk ${tn(x.tone || "neutral")}">${lis.join("")}</ul>`;
  },

  columns: (x) => {
    const widths = x.widths || x.cols.map(() => 100 / x.cols.length);
    const cols = x.cols
      .map((c, k) => `<div style="width:${widths[k]}%">${blocksHtml(c)}</div>`)
      .join("");
    return `<div class="cols${x.rule ? " rule" : ""}${x.mid ? " mid" : ""}">${cols}</div>`;
  },

  matchColumns: (x) => {
    const n = Math.max(x.left.length, x.right.length);
    const rows = [];
    for (let k = 0; k < n; k++) {
      const l = x.left[k];
      const r = x.right[k];
      const ans = x.answers ? String.fromCharCode(65 + x.answers[k]) : "";
      rows.push(`<tr>
      <td>${l ? `<div class="it"><span class="nb">${k + 1}</span><span>${esc(l)}</span></div>` : ""}</td>
      <td class="dot">${l ? (ans ? `<span class="ans">${ans}</span>` : "<i></i>") : ""}</td><td></td>
      <td class="dot">${r ? "<i></i>" : ""}</td>
      <td>${r ? `<div class="it"><span class="nb lt">${String.fromCharCode(65 + k)}</span><span>${esc(r)}</span></div>` : ""}</td></tr>`);
    }
    return `<table class="match tn-neutral"><colgroup><col style="width:39%"><col style="width:5%"><col style="width:12%"><col style="width:5%"><col style="width:39%"></colgroup>
    <thead><tr><td class="hd">${esc(x.leftLabel)}</td><td></td><td></td><td></td><td class="hd">${esc(x.rightLabel)}</td></tr></thead><tbody>${rows.join("")}</tbody></table>`;
  },

  boxRow: (x) => {
    const boxes = Array.from(
      { length: x.n },
      (_, k) => `<div class="bxs">${esc(x.values?.[k] ?? "")}</div>`,
    ).join("");
    return `<div class="boxrow${x.size === "sm" ? " sm" : ""}">${x.label ? `<span class="lab">${esc(x.label)}</span>` : ""}${boxes}</div>`;
  },

  spacer: (x) => `<div style="height:${px(x.h)}"></div>`,
  footerNote: (x) => `<p class="fnote">${esc(x.text)}</p>`,
  rule: (x) =>
    x.icon === "scissors"
      ? `<div class="cutline">${iconSvg("scissors", { size: 15 })}${x.label ? esc(x.label) : "Cut here"}</div>`
      : `<hr class="rule${x.dashed ? " dash" : ""}">`,
};

function heroGeo() {
  const d = TOKENS.domains;
  return `<svg class="geo" viewBox="0 0 612 497" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <circle cx="560" cy="60" r="150" fill="#fff" fill-opacity=".1"/><circle cx="500" cy="470" r="120" fill="${d.Writing.mid}" fill-opacity=".9"/>
  <rect x="380" y="300" width="170" height="170" rx="26" fill="${d.Speaking.mid}" fill-opacity=".92" transform="rotate(14 465 385)"/>
  <circle cx="400" cy="420" r="58" fill="${d.Vocabulary.mid}" fill-opacity=".95"/><path d="M612 190 A130 130 0 0 0 482 320 L612 320 Z" fill="${d.Listening.mid}" fill-opacity=".95"/>
  <rect x="60" y="440" width="120" height="120" rx="60" fill="#fff" fill-opacity=".13"/><circle cx="90" cy="330" r="14" fill="#fff" fill-opacity=".35"/><circle cx="130" cy="330" r="14" fill="#fff" fill-opacity=".22"/></svg>`;
}

function blockHtml(block) {
  const fn = RENDER[block.type];
  if (!fn) throw new Error(`studio-print: unknown block type "${block.type}"`);
  return fn(block);
}

function blocksHtml(blocks) {
  return (blocks || []).map(blockHtml).join("\n");
}

export function renderDocumentHtml(doc) {
  const secs = doc.sections
    .map((s) => {
      const cls = [
        "sec",
        s.layout === "landscape" ? "land" : "",
        s.bleed ? "bleed" : "",
        s.tone ? tn(s.tone) : "",
      ]
        .filter(Boolean)
        .join(" ");
      return `<section class="${cls}">\n${blocksHtml(s.blocks)}\n</section>`;
    })
    .join("\n");
  const body = [doc.early ? "early" : "", doc.dense ? "dense" : "", doc.bodyClass || ""]
    .filter(Boolean)
    .join(" ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.title)} — ${esc(doc.partLabel || "The Language Page")}</title>
<style>${printCss(doc.unitTitle)}</style>
</head>
<body class="${body}">
${secs}
</body>
</html>`;
}

export const PRINT_PARTS = [
  "packet",
  "book",
  "key",
  "cards",
  "bingo",
  "wall",
  "poster",
  "strips",
  "talk",
  "family",
  "writing",
  "writing-key",
];
const KITS = new Set(["cards", "bingo", "wall", "poster", "strips", "talk"]);

// part: packet | book | key | cards | bingo | wall | poster | strips | talk | family | writing | writing-key | activity-<n>
export function buildStudioDocument(
  detail,
  { part = "packet", level = "l3_4", answerKey = false } = {},
) {
  const opts = { level: levelFromWida(level), part, answerKey };
  if (part === "family") return buildFamily(detail, opts);
  if (part === "writing") return buildWriting(detail, opts);
  if (part === "writing-key") return buildWritingKey(detail, opts);
  if (!detail?.studio) throw new Error("studio content not authored for this unit");
  if (part === "packet") return buildPacket(detail, opts);
  if (part === "book") return buildBook(detail, opts);
  if (part === "key") return buildKey(detail, opts);
  if (/^activity-\d+$/.test(part))
    return buildBook(detail, { ...opts, only: Number(part.slice(9)) });
  if (KITS.has(part)) return buildKit(detail, opts);
  throw new Error(`unknown part "${part}"`);
}

export function isKnownPart(part) {
  return PRINT_PARTS.includes(part) || /^activity-\d+$/.test(part);
}

export function renderStudioPart(detail, options = {}) {
  return renderDocumentHtml(buildStudioDocument(detail, options));
}

// "BCPSS-G6-Math-U1-WIDA-3-4.pdf" -> "BCPSS-G6-Math-U1-book-WIDA-3-4.pdf" (packet keeps the classic name).
export function partFilename(baseName, part = "packet") {
  if (part === "packet") return baseName;
  return baseName.replace("-WIDA-", `-${String(part).replace(/[^a-z0-9-]/gi, "")}-WIDA-`);
}
