// Create · slide decks from one resource. ONE slide model (deckSlides) and two outputs:
//   deckHtml   a single offline presentation page (arrow keys / buttons, "Show answer" per question, fullscreen,
//              prints one landscape slide per page without answers). CSP default-src 'none': it fetches nothing.
//   deckPptx   an editable PowerPoint (PptxGenJS, injected): answers go in the speaker notes, never on the slide.
// The deck is built only from the resource's own words; nothing is invented. Pure apart from injected PptxGenJS.

import { answerText } from "../studio/core/check.js";

const MARK = /\[\[([^\]]*)\]\]/g;
const LETTERS = "ABCDEFGHIJ";
const WORDS_PER_SLIDE = 90;
const byText = (a, b) => String(a).localeCompare(String(b));

/** Text with [[answer]] marks shown to students: blanks become a line, identify targets plain words. */
function studentText(text, format) {
  return String(text || "").replace(MARK, (_, inner) =>
    format === "blank" ? "________" : inner.split("|")[0],
  );
}

/** Split a long passage into slides of about WORDS_PER_SLIDE words, at paragraph or sentence ends. */
export function chunkText(text, max = WORDS_PER_SLIDE) {
  const sentences = String(text || "")
    .split(/\n{2,}|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  let cur = [];
  let n = 0;
  for (const s of sentences) {
    const w = s.split(/\s+/).length;
    if (n && n + w > max) {
      out.push(cur.join(" "));
      cur = [];
      n = 0;
    }
    cur.push(s);
    n += w;
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}

/** What a student sees for one question, as plain lines (no answers). */
function questionLines(q) {
  switch (q.format) {
    case "choice":
    case "multi":
      return q.options.map((o, i) => `${LETTERS[i] || i + 1}. ${o.text}`);
    case "match":
      return [
        ...q.pairs.map((p, i) => `${i + 1}. ${p.left}`),
        "",
        ...q.pairs
          .map((p) => p.right)
          .sort(byText)
          .map((r, i) => `${LETTERS[i] || i + 1}. ${r}`),
      ];
    case "sort":
      return [
        q.categories.map((c) => c.label).join("  |  "),
        ...q.items
          .map((i) => i.text)
          .sort(byText)
          .map((t) => `• ${t}`),
      ];
    case "order":
      return q.items
        .map((i) => i.text)
        .sort(byText)
        .map((t) => `• ${t}`);
    case "blank":
    case "identify":
      return [studentText(q.text, q.format)];
    case "build":
      return [[...q.words].sort(byText).join("   ")];
    case "error":
      return q.steps.map((s, i) => `${i + 1}. ${s.text}`);
    case "fillTable":
      return [
        q.headers.join("  |  "),
        ...q.rows.map((r) => r.map((c) => (c && typeof c === "object" ? "____" : c)).join("  |  ")),
      ];
    case "numberline":
      return [`${q.min} … ${q.max}`];
    case "short":
      return q.frame ? [q.frame] : [];
    default:
      return [];
  }
}

/** The answer a teacher reveals, using the same letters the slide printed. */
function questionAnswer(q) {
  if (q.format === "choice") {
    const i = q.options.findIndex((o) => o.id === q.answer);
    return i >= 0 ? `${LETTERS[i]}. ${q.options[i].text}` : "";
  }
  if (q.format === "multi")
    return q.options
      .map((o, i) => (q.answers.includes(o.id) ? `${LETTERS[i]}. ${o.text}` : ""))
      .filter(Boolean)
      .join("; ");
  if (q.format === "short") return q.sample ? `Sample: ${q.sample}` : "";
  return answerText(q);
}

/**
 * @returns {{kind: "title"|"text"|"passage"|"vocab"|"question"|"table"|"math"|"organizer"|"image", title: string,
 *   lines: string[], answer?: string, n?: number, tiles?: boolean, sub?: string, def?: string, example?: string,
 *   es?: string, image?: {src: string, alt: string}}[]}
 */
export function deckSlides(activity, { lang = "en" } = {}) {
  const es = lang === "es";
  const blocks = activity.blocks || [];
  const qCount = blocks.filter((b) => b.type === "question").length;
  const wCount = blocks.filter((b) => b.type === "vocab").reduce((n, b) => n + b.items.length, 0);
  const sub = [
    wCount ? (es ? `${wCount} palabras` : `${wCount} words`) : "",
    qCount ? (es ? `${qCount} preguntas` : `${qCount} questions`) : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const slides = [{ kind: "title", title: activity.title || "", lines: [], sub }];
  const img = (i) => (i?.src?.startsWith("data:image/") ? { src: i.src, alt: i.alt || "" } : null);
  let n = 0;
  for (const b of blocks) {
    if (b.type === "text" && b.text) {
      const heading = b.role === "heading";
      slides.push({
        kind: "text",
        title: heading ? b.text : b.role === "directions" ? (es ? "Instrucciones" : "Directions") : "",
        lines: heading ? [] : [b.text],
      });
    } else if (b.type === "passage" && b.text) {
      const parts = chunkText(b.text);
      parts.forEach((p, i) =>
        slides.push({
          kind: "passage",
          title: `${b.title || (es ? "Lectura" : "Reading")}${parts.length > 1 ? ` (${i + 1}/${parts.length})` : ""}`,
          lines: [p],
        }),
      );
    } else if (b.type === "vocab") {
      for (const v of b.items)
        slides.push({
          kind: "vocab",
          title: v.term,
          def: v.def,
          example: v.example || "",
          es: v.es || "",
          image: img(v.image),
          lines: [v.def, v.example ? `“${v.example}”` : "", v.es ? `Español: ${v.es}` : ""].filter(Boolean),
        });
    } else if (b.type === "question") {
      n += 1;
      slides.push({
        kind: "question",
        n,
        title: `${n}. ${studentText(b.prompt, b.format)}`,
        lines: questionLines(b),
        tiles: b.format === "choice" || b.format === "multi",
        image: img(b.image),
        answer: questionAnswer(b),
      });
    } else if (b.type === "image" && img(b)) {
      slides.push({ kind: "image", title: b.caption || "", lines: [], image: img(b) });
    } else if (b.type === "table" && b.headers.length) {
      slides.push({
        kind: "table",
        title: b.caption || "",
        lines: [b.headers.join("  |  "), ...b.rows.map((r) => r.join("  |  "))],
      });
    } else if (b.type === "math" && b.text) {
      slides.push({ kind: "math", title: b.caption || "", lines: [b.text] });
    } else if (b.type === "organizer" && b.prompts.length) {
      slides.push({ kind: "organizer", title: es ? "Organizador" : "Organizer", lines: b.prompts });
    }
  }
  return slides;
}

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** One colour per slide kind (teal, navy, green, amber, rust, blue: no violet). */
const TONE = {
  title: "0F6B68",
  text: "1E3A5F",
  passage: "1E3A5F",
  vocab: "2F6B3A",
  question: "B45309",
  table: "1E3A5F",
  math: "1D4ED8",
  organizer: "9A3412",
  image: "0F6B68",
};

const CSS = `
*{box-sizing:border-box}html,body{margin:0;height:100%;background:#16212e;font-family:system-ui,-apple-system,"Segoe UI",sans-serif}
main{height:100%;display:grid;place-items:center;padding:16px 16px 72px}
.slide{--t:#1e3a5f;display:none;position:relative;width:min(100%,calc((100vh - 104px)*16/9));aspect-ratio:16/9;background:#fffdf8;color:#1b2430;border-radius:14px;padding:4.5% 6% 5%;overflow:auto;box-shadow:0 10px 34px rgba(0,0,0,.4);border-top:1.2vmin solid var(--t)}
.slide.on{display:flex;flex-direction:column;gap:2.4vmin}
.slide h1{font-size:clamp(30px,6vmin,72px);margin:0;line-height:1.1}
.slide h2{font-size:clamp(22px,4.2vmin,50px);margin:0;line-height:1.2}
.slide p,.slide li{font-size:clamp(18px,3.1vmin,36px);line-height:1.4;margin:0}
.slide ul{list-style:none;padding:0;margin:0;display:grid;gap:1.2vmin}
.kind{display:inline-flex;align-self:flex-start;align-items:center;gap:.6em;font-size:clamp(12px,1.8vmin,18px);letter-spacing:.08em;text-transform:uppercase;color:#fff;background:var(--t);font-weight:700;padding:.35em .8em;border-radius:999px}
.num{position:absolute;right:2.2%;bottom:3%;font-size:clamp(11px,1.6vmin,16px);color:#667085}
.title{justify-content:center;background:linear-gradient(135deg,#0f6b68 0%,#1e3a5f 100%);color:#fff;border-top:0}
.title .sub{font-size:clamp(16px,2.8vmin,30px);opacity:.9}
.title .brand{position:absolute;left:6%;bottom:6%;font-size:clamp(12px,1.9vmin,20px);letter-spacing:.06em;text-transform:uppercase;opacity:.85}
.title .shape{position:absolute;right:-6%;top:-14%;width:42%;aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.08)}
.title .shape.b{right:12%;top:auto;bottom:-24%;width:26%;background:rgba(255,255,255,.06)}
.tiles{display:grid;grid-template-columns:1fr 1fr;gap:1.6vmin}
.tiles li{display:flex;align-items:center;gap:1.4vmin;padding:1.6vmin 2vmin;border:2px solid #d6dbe3;border-radius:1.4vmin;background:#fff}
.tiles b{flex:none;display:grid;place-items:center;width:5.4vmin;height:5.4vmin;border-radius:50%;background:var(--t);color:#fff;font-size:clamp(14px,2.6vmin,28px)}
.word{display:grid;grid-template-columns:1fr auto;gap:3vmin;align-items:start}
.word .term{font-size:clamp(34px,8vmin,96px);font-weight:800;color:var(--t);line-height:1}
.word .def{font-size:clamp(20px,3.6vmin,40px);margin-top:2vmin}
.word .ex{margin-top:2.4vmin;padding:1.6vmin 2.2vmin;border-left:.8vmin solid var(--t);background:#eef5ef;border-radius:0 1vmin 1vmin 0;font-style:italic}
.chip{display:inline-block;margin-top:2vmin;padding:.4em .9em;border-radius:999px;background:#e8eef7;color:#1e3a5f;font-weight:600;font-size:clamp(14px,2.4vmin,26px)}
.pic{max-width:100%;max-height:52vmin;object-fit:contain;border-radius:1vmin;align-self:center}
.word .pic{max-height:34vmin;max-width:34vmin}
.passage p{font-size:clamp(20px,3.4vmin,40px);line-height:1.55}
.ans{margin-top:auto;padding:1.6vmin 2.2vmin;border-radius:1.2vmin;background:#e7f4ea;border:2px solid #2f6b3a;color:#173b20}
.bar{position:fixed;left:0;top:0;height:5px;background:#f59e0b;transition:width .2s}
nav{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;justify-content:center;align-items:center;padding:10px;color:#fff;font:15px system-ui,sans-serif}
nav button{min-width:44px;min-height:44px;border-radius:10px;border:1px solid #64748b;background:#243447;color:#fff;font:inherit;padding:0 14px;cursor:pointer}
nav button:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
@media (prefers-reduced-motion:reduce){.bar{transition:none}}
@media print{@page{size:landscape;margin:0}html,body{background:#fff;height:auto}main{display:block;padding:0}nav,.ans,.bar{display:none!important}
.slide{display:flex!important;flex-direction:column;width:100%;height:100vh;aspect-ratio:auto;box-shadow:none;border-radius:0;break-after:page;page-break-after:always}
.title{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
`;

const JS = `(function(){
var s=[].slice.call(document.querySelectorAll(".slide")),i=0,pos=document.getElementById("pos"),rev=document.getElementById("rev"),bar=document.getElementById("bar");
function show(n){i=Math.max(0,Math.min(s.length-1,n));s.forEach(function(x,k){x.classList.toggle("on",k===i)});
pos.textContent=(i+1)+" / "+s.length;bar.style.width=((i+1)/s.length*100)+"%";var a=s[i].querySelector(".ans");rev.hidden=!a;if(a)a.hidden=true;}
document.getElementById("prev").onclick=function(){show(i-1)};document.getElementById("next").onclick=function(){show(i+1)};
rev.onclick=function(){var a=s[i].querySelector(".ans");if(a)a.hidden=!a.hidden};
document.getElementById("full").onclick=function(){if(document.fullscreenElement)document.exitFullscreen();else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen()};
addEventListener("keydown",function(e){if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){e.preventDefault();show(i+1)}
else if(e.key==="ArrowLeft"||e.key==="PageUp"){e.preventDefault();show(i-1)}else if(e.key==="Home")show(0);else if(e.key==="End")show(s.length-1);
else if(e.key==="a"||e.key==="A")rev.click()});show(0);})();`;

const KIND_LABEL = {
  en: { passage: "Read", vocab: "Word", question: "Question", table: "Table", math: "Math", organizer: "Think", text: "", image: "Look" },
  es: { passage: "Leer", vocab: "Palabra", question: "Pregunta", table: "Tabla", math: "Matemáticas", organizer: "Pensar", text: "", image: "Observar" },
};

const pic = (im, cls = "pic") => (im ? `<img class="${cls}" src="${esc(im.src)}" alt="${esc(im.alt)}">` : "");

function slideHtml(sl, L, es, k, total) {
  const num = `<span class="num">${k + 1} / ${total}</span>`;
  if (sl.kind === "title")
    return `<section class="slide title" aria-roledescription="slide"><span class="shape"></span><span class="shape b"></span><h1>${esc(sl.title)}</h1>${sl.sub ? `<p class="sub">${esc(sl.sub)}</p>` : ""}<span class="brand">The Language Page</span></section>`;
  const style = ` style="--t:#${TONE[sl.kind] || "1E3A5F"}"`;
  const kind = L[sl.kind] ? `<div class="kind">${esc(L[sl.kind])}${sl.n ? ` ${sl.n}` : ""}</div>` : "";
  let body;
  if (sl.kind === "vocab")
    body = `<div class="word"><div><div class="term">${esc(sl.title)}</div><p class="def">${esc(sl.def)}</p>${sl.example ? `<p class="ex">“${esc(sl.example)}”</p>` : ""}${sl.es ? `<span class="chip">Español: ${esc(sl.es)}</span>` : ""}</div>${pic(sl.image)}</div>`;
  else {
    const head = sl.title ? `<h2>${esc(sl.kind === "question" ? sl.title.replace(/^\d+\.\s*/, "") : sl.title)}</h2>` : "";
    const lines = sl.tiles
      ? `<ul class="tiles">${sl.lines.map((l) => `<li><b>${esc(l.slice(0, 1))}</b><span>${esc(l.replace(/^[A-J]\.\s*/, ""))}</span></li>`).join("")}</ul>`
      : sl.lines.length > 1 || sl.kind === "question"
        ? `<ul>${sl.lines.map((l) => (l ? `<li>${esc(l)}</li>` : "")).join("")}</ul>`
        : sl.lines.map((l) => `<p>${esc(l)}</p>`).join("");
    body = `${head}${pic(sl.image)}${lines}`;
  }
  const ans = sl.answer ? `<p class="ans" hidden><strong>${es ? "Respuesta" : "Answer"}:</strong> ${esc(sl.answer)}</p>` : "";
  return `<section class="slide ${sl.kind}"${style} aria-roledescription="slide">${kind}${body}${ans}${num}</section>`;
}

/** One self-contained presentation page. */
export function deckHtml(activity, { lang = "en" } = {}) {
  const es = lang === "es";
  const L = KIND_LABEL[es ? "es" : "en"];
  const slides = deckSlides(activity, { lang });
  const body = slides.map((sl, k) => slideHtml(sl, L, es, k, slides.length)).join("\n");
  return `<!doctype html>
<html lang="${es ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">
<title>${esc(activity.title || "Slides")}</title>
<style>${CSS}</style>
</head>
<body>
<div class="bar" id="bar"></div>
<main>
${body}
</main>
<nav aria-label="${es ? "Diapositivas" : "Slides"}">
<button type="button" id="prev" aria-label="${es ? "Anterior" : "Previous"}">‹</button>
<span id="pos" aria-live="polite"></span>
<button type="button" id="next" aria-label="${es ? "Siguiente" : "Next"}">›</button>
<button type="button" id="rev">${es ? "Mostrar respuesta (A)" : "Show answer (A)"}</button>
<button type="button" id="full">${es ? "Pantalla completa" : "Full screen"}</button>
</nav>
<script>${JS}</script>
</body>
</html>
`;
}

/**
 * Editable PowerPoint with the same theme. @param {{PptxGenJS: Function, lang?: string}} deps
 * @returns {Promise<Uint8Array>}
 */
export async function deckPptx(activity, { PptxGenJS, lang = "en" }) {
  const es = lang === "es";
  const L = KIND_LABEL[es ? "es" : "en"];
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 x 7.5 in
  pptx.title = activity.title || "Slides";
  pptx.company = "The Language Page";
  const font = "Calibri";
  const ink = "1B2430";
  const slides = deckSlides(activity, { lang });
  slides.forEach((sl, k) => {
    const slide = pptx.addSlide();
    if (sl.kind === "title") {
      slide.background = { color: "1E3A5F" };
      slide.addShape(pptx.ShapeType.ellipse, { x: 8.6, y: -1.4, w: 6, h: 6, fill: { color: "0F6B68", transparency: 30 }, line: { type: "none" } });
      slide.addShape(pptx.ShapeType.ellipse, { x: 9.8, y: 5.2, w: 3.2, h: 3.2, fill: { color: "FFFFFF", transparency: 90 }, line: { type: "none" } });
      slide.addText(sl.title, { x: 0.8, y: 2.0, w: 9.6, h: 2.2, fontFace: font, fontSize: 44, bold: true, color: "FFFFFF", valign: "bottom", fit: "shrink" });
      if (sl.sub) slide.addText(sl.sub, { x: 0.8, y: 4.3, w: 9.6, h: 0.6, fontFace: font, fontSize: 22, color: "E6EDF5" });
      slide.addText("THE LANGUAGE PAGE", { x: 0.8, y: 6.6, w: 6, h: 0.4, fontFace: font, fontSize: 12, bold: true, color: "E6EDF5", charSpacing: 2 });
      return;
    }
    const tone = TONE[sl.kind] || "1E3A5F";
    slide.background = { color: "FFFDF8" };
    slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.33, h: 0.16, fill: { color: tone }, line: { type: "none" } });
    slide.addText(`${k + 1} / ${slides.length}`, { x: 11.6, y: 7.0, w: 1.4, h: 0.3, fontFace: font, fontSize: 11, color: "667085", align: "right" });
    let y = 0.45;
    if (L[sl.kind]) {
      slide.addText(`${L[sl.kind].toUpperCase()}${sl.n ? ` ${sl.n}` : ""}`, { x: 0.8, y, w: 2.6, h: 0.42, shape: pptx.ShapeType.roundRect, rectRadius: 0.2, fill: { color: tone }, fontFace: font, fontSize: 13, bold: true, color: "FFFFFF", align: "center" });
      y += 0.62;
    }
    if (sl.kind === "vocab") {
      const w = sl.image ? 7.6 : 11.7;
      slide.addText(sl.title, { x: 0.8, y, w, h: 1.3, fontFace: font, fontSize: 54, bold: true, color: tone, fit: "shrink" });
      slide.addText(sl.def, { x: 0.8, y: y + 1.4, w, h: 1.5, fontFace: font, fontSize: 26, color: ink, valign: "top", fit: "shrink" });
      if (sl.example)
        slide.addText(`“${sl.example}”`, { x: 0.8, y: y + 3.0, w, h: 1.3, fontFace: font, fontSize: 22, italic: true, color: ink, fill: { color: "EEF5EF" }, valign: "middle", fit: "shrink", margin: 10 });
      if (sl.es)
        slide.addText(`Español: ${sl.es}`, { x: 0.8, y: y + 4.5, w: 4.2, h: 0.55, shape: pptx.ShapeType.roundRect, rectRadius: 0.25, fill: { color: "E8EEF7" }, fontFace: font, fontSize: 18, bold: true, color: "1E3A5F", align: "center" });
      if (sl.image) slide.addImage({ data: sl.image.src, x: 8.8, y: y + 0.2, w: 3.8, h: 3.8, sizing: { type: "contain", w: 3.8, h: 3.8 }, altText: sl.image.alt });
    } else {
      if (sl.title) {
        slide.addText(sl.kind === "question" ? sl.title.replace(/^\d+\.\s*/, "") : sl.title, { x: 0.8, y, w: 11.7, h: 1.3, fontFace: font, fontSize: 28, bold: true, color: ink, valign: "top", fit: "shrink" });
        y += 1.4;
      }
      if (sl.image) {
        slide.addImage({ data: sl.image.src, x: 0.8, y, w: 4, h: 2.6, sizing: { type: "contain", w: 4, h: 2.6 }, altText: sl.image.alt });
        y += 2.8;
      }
      if (sl.tiles) {
        const cols = 2;
        const gap = 0.25;
        const tw = (11.7 - gap) / cols;
        const rows = Math.ceil(sl.lines.length / cols);
        const th = Math.min(1.15, (7.0 - y - gap * (rows - 1)) / rows);
        sl.lines.forEach((l, i) => {
          const x = 0.8 + (i % cols) * (tw + gap);
          const ty = y + Math.floor(i / cols) * (th + gap);
          slide.addShape(pptx.ShapeType.roundRect, { x, y: ty, w: tw, h: th, rectRadius: 0.12, fill: { color: "FFFFFF" }, line: { color: "D6DBE3", width: 1.5 } });
          slide.addText(l.slice(0, 1), { x: x + 0.18, y: ty + (th - 0.6) / 2, w: 0.6, h: 0.6, shape: pptx.ShapeType.ellipse, fill: { color: tone }, fontFace: font, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle" });
          slide.addText(l.replace(/^[A-J]\.\s*/, ""), { x: x + 0.95, y: ty, w: tw - 1.1, h: th, fontFace: font, fontSize: 20, color: ink, valign: "middle", fit: "shrink" });
        });
      } else {
        const lines = sl.lines.filter((l) => l !== "");
        if (lines.length)
          slide.addText(
            lines.map((t) => ({ text: t, options: { breakLine: true } })),
            { x: 0.8, y, w: 11.7, h: 7.5 - y - 0.5, fontFace: font, fontSize: sl.kind === "passage" ? 24 : lines.length > 6 ? 20 : 24, color: ink, valign: "top", fit: "shrink", paraSpaceAfter: 6 },
          );
      }
    }
    if (sl.answer) slide.addNotes(`${es ? "Respuesta" : "Answer"}: ${sl.answer}`);
  });
  const out = await pptx.write({ outputType: "uint8array" });
  return out instanceof Uint8Array ? out : new Uint8Array(out);
}
