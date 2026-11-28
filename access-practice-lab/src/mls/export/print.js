// Math Literacy Studio exports: the print view, and the one block -> HTML renderer the interactive page shares.
//
// `printDocument(resource, { key })` returns a complete HTML document meant for the browser's print dialog
// ("Print or save as PDF"). It is real HTML text and real tables with inline SVG pictures, sized for US Letter with
// physical units (inches) for every writing space. Nothing here claims to be a generated PDF file.
//
// `bodyHtml()` is exported for html.js: one renderer for every block means the printed sheet and the interactive page
// can never disagree about content. The only difference is the `problem` block, which becomes radios or an input
// when `interactive` is true.
import {
  MLS_NAME,
  MLS_ORIGIN,
  blockRef,
  esc,
  getRenderVisual,
  kebab,
  keyResource,
  letter,
  metaLine,
  normalizeResource,
  safeRender,
  workspaceInches,
} from "./raster.js";

// ── text ────────────────────────────────────────────────────────────────────

/** Escape, keep line breaks, and turn a run of underscores into a real writing line that never wraps oddly. */
const T = (s) =>
  esc(s)
    .replace(/_{3,}/g, '<span class="blank"></span>')
    .replace(/\n/g, "<br>");

/** Pick which choice index a problem marks correct, or -1 when the problem is not checkable by choice. */
export function resolveCorrect(b) {
  if (!Array.isArray(b.choices) || !b.choices.length) return -1;
  if (Number.isInteger(b.correct) && b.correct >= 0 && b.correct < b.choices.length) return b.correct;
  if (b.answer != null && String(b.answer).trim() !== "") {
    const i = b.choices.findIndex((c) => String(c).trim() === String(b.answer).trim());
    if (i >= 0) return i;
  }
  return -1;
}

// ── blocks ──────────────────────────────────────────────────────────────────

function visualHtml(spec, alt, ctx) {
  const out = safeRender(ctx.renderVisual, spec);
  if (!out) return `<figure class="vis missing"><p class="alt">[Picture: ${esc(alt || spec?.alt || "a picture")}]</p></figure>`;
  return `<figure class="vis">${out.svg}</figure>`;
}

function workspaceHtml(ws) {
  const inches = workspaceInches(ws);
  if (!inches) return "";
  const kind = ws.kind;
  if (kind === "lines") {
    const n = Math.round(inches / 0.3);
    return `<div class="ws ws-lines" role="presentation">${'<div class="rule"></div>'.repeat(n)}</div>`;
  }
  if (kind === "grid")
    return `<svg class="ws ws-grid" role="presentation" aria-hidden="true" focusable="false" width="100%" height="${inches}in"><rect width="100%" height="100%" fill="url(#mls-grid)" stroke="#333" stroke-width="1.5"/></svg>`;
  return `<div class="ws ws-box" role="presentation" style="height:${inches}in"></div>`;
}

function tableHtml(b) {
  const head = (b.headers || []).length
    ? `<thead><tr>${b.headers.map((h) => `<th scope="col">${T(h)}</th>`).join("")}</tr></thead>`
    : "";
  const body = (b.rows || []).map((r) => `<tr>${r.map((c) => `<td>${T(c)}</td>`).join("")}</tr>`).join("");
  const cap = b.caption ? `<caption>${T(b.caption)}</caption>` : "";
  return `<div class="tablewrap"><table>${cap}${head}<tbody>${body}</tbody></table></div>`;
}

function problemHtml(b, ref, ctx) {
  const id = ref.replace(/\./g, "-");
  const parts = [];
  parts.push(`<h3 class="sr-only">Problem ${esc(b.n)}</h3>`);
  if (b.stem) parts.push(`<p class="stem">${T(b.stem)}</p>`);
  if (b.ask) parts.push(`<p class="ask">${T(b.ask)}</p>`);
  if (b.expr) parts.push(`<p class="expr">${T(b.expr)}</p>`);
  if (b.visual) parts.push(visualHtml(b.visual, b.visual.alt, ctx));
  const correct = resolveCorrect(b);
  const hasAnswer = !Array.isArray(b.choices) && b.answer != null && String(b.answer).trim() !== "";
  const interactive = ctx.interactive && (correct >= 0 || hasAnswer || (b.choices?.length && correct >= 0));
  const short = (b.choices || []).every((c) => String(c).length <= 18);
  if (b.choices?.length) {
    if (interactive && correct >= 0) {
      parts.push(
        `<fieldset class="choices${short ? " short" : ""}"><legend class="sr-only">Choose one answer for problem ${esc(b.n)}</legend>${b.choices
          .map(
            (c, i) =>
              `<label class="choice"><input type="radio" name="q-${id}" value="${i}"><span class="mark" aria-hidden="true">${letter(i)}</span><span class="ctext">${T(c)}</span></label>`,
          )
          .join("")}</fieldset>`,
      );
    } else {
      parts.push(
        `<ul class="choices${short ? " short" : ""}">${b.choices
          .map((c, i) => `<li class="choice"><span class="mark">${letter(i)}.</span><span class="ctext">${T(c)}</span></li>`)
          .join("")}</ul>`,
      );
    }
  }
  if (b.frames?.length) parts.push(`<div class="frames">${b.frames.map((f) => `<p class="frame">${T(f)}</p>`).join("")}</div>`);
  if (interactive) {
    if (!(correct >= 0))
      parts.push(
        `<div class="answerbox"><label for="a-${id}">Your answer</label><input id="a-${id}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-ref="${ref}"></div>`,
      );
    ctx.data[ref] =
      correct >= 0
        ? { kind: "choice", correct, explain: b.explain || "", hint: b.hint || "" }
        : { kind: "input", answer: String(b.answer), explain: b.explain || "", hint: b.hint || "" };
    parts.push(
      `<div class="actions"><button type="button" class="btn primary" data-act="check">Check</button>${
        b.hint ? '<button type="button" class="btn" data-act="hint">Hint</button>' : ""
      }</div><div class="fb" role="status" aria-live="polite"></div>`,
    );
  } else if (!ctx.interactive) {
    parts.push(workspaceHtml(b.workspace));
  } else if (b.workspace && b.workspace.kind !== "none") {
    parts.push(
      `<div class="answerbox"><label for="w-${id}">Show your work (optional)</label><textarea id="w-${id}" rows="${Math.max(2, Math.min(8, Math.round(workspaceInches(b.workspace) / 0.3)))}"></textarea></div>`,
    );
  }
  return `<article class="problem" id="p-${id}" data-ref="${ref}"><div class="num" aria-hidden="true">${esc(b.n)}</div><div class="pbody">${parts.join("")}</div></article>`;
}

function blockHtml(b, si, bi, ctx) {
  const ref = blockRef(si, bi);
  switch (b.t) {
    case "p":
      if (b.style === "quote") return `<blockquote>${T(b.text)}</blockquote>`;
      return `<p class="${esc(b.style || "plain")}">${T(b.text)}</p>`;
    case "list": {
      const tag = b.ordered ? "ol" : "ul";
      return `<${tag} class="items">${(b.items || []).map((i) => `<li>${T(i)}</li>`).join("")}</${tag}>`;
    }
    case "table":
      return tableHtml(b);
    case "visual":
      return visualHtml(b.spec, b.alt, ctx);
    case "problem":
      return problemHtml(b, ref, ctx);
    case "frames":
      return `<div class="frames"><p class="lbl">Sentence frames</p>${(b.items || []).map((f) => `<p class="frame">${T(f)}</p>`).join("")}</div>`;
    case "wordbank":
      return `<div class="wordbank"><p class="lbl">Word bank</p><ul>${(b.words || []).map((w) => `<li>${T(w)}</li>`).join("")}</ul></div>`;
    case "cards": {
      const cols = b.cols === 3 ? 3 : 2;
      return `<div class="cards" style="--cols:${cols}">${(b.items || [])
        .map(
          (c, ci) =>
            `<div class="card">${c.visual ? visualHtml(c.visual, c.visual.alt, ctx) : ""}<p class="front">${T(c.front)}</p>${
              c.back ? `<p class="back">${T(c.back)}</p>` : ""
            }</div>`,
        )
        .join("")}</div>`;
    }
    case "lines":
      return `<div class="linesblock">${b.prompt ? `<p class="prompt">${T(b.prompt)}</p>` : ""}${'<div class="rule"></div>'.repeat(
        Math.max(1, Math.min(30, +b.n || 3)),
      )}</div>`;
    case "check":
      return `<ul class="checks">${(b.items || []).map((i) => `<li><span class="box" aria-hidden="true"></span><span>${T(i)}</span></li>`).join("")}</ul>`;
    case "pagebreak":
      return '<div class="pagebreak" role="presentation"></div>';
    default:
      return "";
  }
}

/**
 * The document body for any Resource: title block and every section. Returns { html, data } where `data` holds the
 * answer data for checkable problems (only filled when `interactive` is true).
 */
export function bodyHtml(resource, { interactive = false, renderVisual = null } = {}) {
  const r = normalizeResource(resource);
  const ctx = { interactive, renderVisual, data: {} };
  const meta = metaLine(r);
  const head = `<header class="doc-head"><h1 id="doc-title">${T(r.title)}</h1>${
    r.subtitle ? `<p class="sub">${T(r.subtitle)}</p>` : ""
  }${meta ? `<p class="meta">${esc(meta)}</p>` : ""}</header>`;
  const sections = r.sections
    .map(
      (s, si) =>
        `<section class="sec">${s.heading ? `<h2>${T(s.heading)}</h2>` : ""}${s.blocks.map((b, bi) => blockHtml(b, si, bi, ctx)).join("")}</section>`,
    )
    .join("");
  return { html: head + sections, data: ctx.data };
}

// ── shared stylesheet (print and interactive page) ──────────────────────────

export const BASE_CSS = `
:root{--navy:#17324d;--teal:#1fa6a2;--ink:#1c2630;--soft:#eef3f5;--amber:#f2c15b;--rule:#2b3640}
*{box-sizing:border-box}
html{font-size:100%;-webkit-text-size-adjust:100%}
body{margin:0;font-family:Arial,"Liberation Sans",Helvetica,sans-serif;color:var(--ink);background:#fff;line-height:1.45;overflow-wrap:anywhere}
.sheet{max-width:8in;margin:0 auto;padding:1rem}
h1{font-size:1.75rem;line-height:1.2;margin:0 0 .25rem;color:var(--navy)}
h2{font-size:1.3rem;line-height:1.25;margin:1.6rem 0 .7rem;padding-bottom:.2rem;border-bottom:2px solid var(--navy);color:var(--navy);break-after:avoid}
h3{font-size:1.05rem}
.sub{font-size:1.1rem;margin:.1rem 0 .2rem}
.meta{margin:.1rem 0 .8rem;color:#33404b;font-size:.95rem}
p{margin:.5rem 0}
.directions{border:2px solid var(--navy);border-radius:6px;padding:.6rem .8rem;background:#f1f5f7}
.note{font-style:italic;color:#33404b}
.teacher{border:2px dashed #6b4e00;border-radius:6px;padding:.5rem .8rem;background:#fff6da}
blockquote{margin:.7rem 0;padding:.3rem 1rem;border-left:4px solid var(--navy);font-style:italic}
ul.items,ol.items{margin:.5rem 0;padding-left:1.6rem}
ul.items li,ol.items li{margin:.25rem 0}
.tablewrap{max-width:100%;overflow-x:auto;margin:.6rem 0}
table{border-collapse:collapse;width:100%}
th,td{border:1.5px solid #222;padding:.35rem .55rem;text-align:left;vertical-align:top}
th{background:#e4eaee}
caption{caption-side:top;text-align:left;font-weight:bold;padding:.2rem 0}
tr{break-inside:avoid}
thead{display:table-header-group}
.problem{display:grid;grid-template-columns:2.2rem minmax(0,1fr);gap:.7rem;margin:1.1rem 0;break-inside:avoid;page-break-inside:avoid}
.num{width:2rem;height:2rem;border:2px solid var(--navy);border-radius:50%;display:grid;place-items:center;font-weight:bold;color:var(--navy)}
.pbody>*:first-child{margin-top:0}
.stem,.ask{margin:.2rem 0}
.ask{font-weight:bold}
.expr{font-size:1.5rem;text-align:center;margin:.6rem 0;font-weight:bold}
figure.vis{margin:.6rem 0;text-align:center}
figure.vis svg{display:block;margin:0 auto;width:100%;max-width:5in;height:auto;max-height:3.2in}
figure.vis .alt{font-style:italic;color:#33404b}
.choices{border:0;padding:0;margin:.5rem 0;list-style:none;display:flex;flex-direction:column;gap:.3rem}
.choices.short{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.3rem 1.5rem}
.choice{display:flex;gap:.5rem;align-items:flex-start}
.mark{font-weight:bold;min-width:1.5rem;display:inline-block}
.frames{margin:.6rem 0 .6rem .8rem;padding:.3rem .8rem;border-left:4px solid var(--navy)}
.frame{margin:.4rem 0;line-height:2.1}
.blank{display:inline-block;min-width:1.1in;border-bottom:1.5px solid #000;height:1em;vertical-align:baseline}
.lbl{font-size:.85rem;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;margin:0 0 .3rem;color:#2b3640}
.wordbank{border:2px solid #222;border-radius:6px;padding:.5rem .8rem;margin:.7rem 0;break-inside:avoid}
.wordbank ul{list-style:none;display:flex;flex-wrap:wrap;gap:.35rem .8rem;margin:0;padding:0}
.wordbank li{padding:.15rem .6rem;border:1.5px solid #555;border-radius:4px;font-weight:bold}
.cards{display:grid;gap:.7rem;margin:.7rem 0;grid-template-columns:repeat(var(--cols,2),minmax(0,1fr))}
.card{border:2px dashed #333;border-radius:8px;padding:.8rem;min-height:1.6in;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;break-inside:avoid}
.card .front{font-size:1.25rem;font-weight:bold;margin:0}
.card .back{margin:.5rem 0 0;padding-top:.4rem;border-top:1px solid #777;width:100%}
.card figure.vis svg{max-width:2.4in;max-height:1.4in}
.linesblock{margin:.7rem 0;break-inside:avoid}
.linesblock .prompt{font-weight:bold;margin-bottom:.2rem}
.rule{height:.34in;border-bottom:1.5px solid #333}
.ws{display:block;margin-top:.6rem;break-inside:avoid}
.ws-lines .rule{height:.3in}
.ws-box{border:2px solid #333;border-radius:4px}
.checks{list-style:none;padding:0;margin:.5rem 0}
.checks li{display:flex;gap:.6rem;margin:.45rem 0;align-items:flex-start}
.checks .box{flex:none;width:.22in;height:.22in;border:2px solid #000;border-radius:3px;margin-top:.15rem}
.pagebreak{break-after:page;height:0}
.sr-only{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0;padding:0}
.defs{position:absolute;width:0;height:0;overflow:hidden}
@media (max-width:34rem){.cards{grid-template-columns:1fr}.choices.short{grid-template-columns:1fr}.problem{grid-template-columns:1.8rem minmax(0,1fr);gap:.5rem}}
`;

const PRINT_CSS = `
@page{size:letter;margin:0.6in}
@page{@bottom-right{content:counter(page);font:10pt Arial,sans-serif}}
.bar{position:sticky;top:0;z-index:2;display:flex;flex-wrap:wrap;gap:.6rem 1rem;align-items:center;padding:.6rem 1rem;background:var(--navy);color:#fff}
.bar button{min-height:44px;padding:.4rem 1rem;font:bold 1rem Arial,sans-serif;border:2px solid #fff;border-radius:6px;background:#fff;color:var(--navy);cursor:pointer}
.bar button:focus-visible{outline:3px solid var(--amber);outline-offset:2px}
.bar span{font-size:.95rem}
@media print{
  html{font-size:12.5pt}
  .no-print,.bar{display:none!important}
  .sheet{max-width:none;padding:0}
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h2{margin-top:1.2rem}
}
`;

// ── documents ───────────────────────────────────────────────────────────────

/**
 * A complete HTML document for the browser's print dialog. `key: true` prints the teacher answer key instead.
 * `preview: true` omits the print bar and its script: the builder shows the document in a sandboxed frame that (rightly) runs no script.
 */
export function printDocument(resource, { key = false, renderVisual = null, preview = false } = {}) {
  const r = key ? keyResource(resource) : normalizeResource(resource);
  const { html } = bodyHtml(r, { interactive: false, renderVisual });
  const title = `${r.title}`;
  return `<!doctype html>
<html lang="${esc(r.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="${MLS_NAME}">
<title>${esc(title)}</title>
<style>${BASE_CSS}${PRINT_CSS}</style>
</head>
<body class="${key ? "is-key" : "is-student"}">
<svg class="defs" aria-hidden="true" focusable="false"><defs><pattern id="mls-grid" width="0.25in" height="0.25in" patternUnits="userSpaceOnUse"><line x1="0" y1="0" x2="0" y2="0.25in" stroke="#9aa5ad" stroke-width="1"/><line x1="0" y1="0" x2="0.25in" y2="0" stroke="#9aa5ad" stroke-width="1"/></pattern></defs></svg>
${preview ? "" : `<div class="bar no-print"><button type="button" id="mls-print">Print or Save as PDF</button><span>In the print window, choose &ldquo;Save as PDF&rdquo; as the destination to keep a file.</span></div>`}
<main class="sheet" aria-labelledby="doc-title">
${html}
</main>
${preview ? "" : `<script>document.getElementById("mls-print").addEventListener("click",function(){window.print()});</script>`}
</body>
</html>
`;
}

/**
 * Browser only: build the print document, load it in a hidden iframe and open the print dialog. Resolves when the
 * dialog has been requested (never claims a file was made). Falls back to a new window if the iframe cannot print.
 */
export async function openPrintView(resource, { key = false, renderVisual } = {}) {
  if (typeof document === "undefined") throw new Error("openPrintView needs a browser");
  const render = renderVisual || (await getRenderVisual());
  const doc = printDocument(resource, { key, renderVisual: render });
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:8.5in;height:11in;border:0;visibility:hidden";
  document.body.append(frame);
  const done = () => setTimeout(() => frame.remove(), 500);
  await new Promise((resolve) => {
    frame.onload = resolve;
    frame.srcdoc = doc;
  });
  try {
    await frame.contentDocument?.fonts?.ready;
    frame.contentWindow.focus();
    frame.contentWindow.addEventListener("afterprint", done);
    frame.contentWindow.print();
    setTimeout(done, 120000);
  } catch {
    frame.remove();
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(doc);
      w.document.close();
      w.focus();
      w.addEventListener("load", () => w.print());
    }
  }
}

/** The file name a saved copy of the print document would have. */
export const printFilename = (resource, key = false) => `${kebab(resource.title)}${key ? "-key" : ""}-print.html`;

export { MLS_ORIGIN };
