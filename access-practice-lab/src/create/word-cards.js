// Create · printable word cards (a Frayer-style organizer): for every word on the page, the word in the centre with
// four boxes around it: what it means, an example, a box to draw it, and the word in Spanish (or a line for the
// student's own sentence). Built only from the page's own word list; the drawing box is the student's to fill.
// Two cards per US Letter page. Pure: returns one HTML document for the print path.

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** Every word with a meaning in the activity's word lists (first occurrence of each term). */
export function wordsOf(activity) {
  const seen = new Set();
  const out = [];
  for (const b of activity?.blocks || [])
    if (b.type === "vocab")
      for (const v of b.items) {
        const k = v.term.trim().toLowerCase();
        if (!k || !v.def || seen.has(k)) continue;
        seen.add(k);
        out.push(v);
      }
  return out;
}

const T = {
  en: {
    mean: "What it means",
    ex: "Example",
    draw: "Draw it",
    es: "In Spanish",
    mine: "My own sentence",
    name: "Name",
    title: "Word cards",
  },
  es: {
    mean: "Qué significa",
    ex: "Ejemplo",
    draw: "Dibújalo",
    es: "En español",
    mine: "Mi propia oración",
    name: "Nombre",
    title: "Tarjetas de palabras",
  },
};

function card(v, t, blankMeaning) {
  const pic = v.image?.src?.startsWith("data:image/")
    ? `<img src="${esc(v.image.src)}" alt="${esc(v.image.alt || "")}">`
    : "";
  return `<section class="card">
  <div class="q q1"><h3>${t.mean}</h3>${blankMeaning ? '<div class="lines"></div>' : `<p>${esc(v.def)}</p>`}</div>
  <div class="q q2"><h3>${t.ex}</h3>${v.example ? `<p class="ex">“${esc(v.example)}”</p>` : '<div class="lines"></div>'}</div>
  <div class="q q3"><h3>${t.draw}</h3>${pic}</div>
  <div class="q q4"><h3>${v.es ? t.es : t.mine}</h3>${v.es ? `<p class="es">${esc(v.es)}</p><h3 class="mine">${t.mine}</h3>` : ""}<div class="lines"></div></div>
  <div class="term"><span>${esc(v.term)}</span></div>
</section>`;
}

/**
 * @param {object} activity  @param {{lang?: string, blankMeaning?: boolean}} opts blankMeaning = students write it
 * @returns {{ html: string, count: number }}
 */
export function wordCardsHtml(activity, { lang = "en", blankMeaning = false } = {}) {
  const t = T[lang === "es" ? "es" : "en"];
  const words = wordsOf(activity);
  const cards = words.map((v) => card(v, t, blankMeaning)).join("\n");
  const html = `<!doctype html>
<html lang="${lang === "es" ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<title>${esc(activity.title)} · ${t.title}</title>
<style>
@page{size:letter;margin:0.45in}
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;color:#1b2430;-webkit-print-color-adjust:exact;print-color-adjust:exact}
header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #1e3a5f;padding-bottom:4pt;margin-bottom:8pt;font-size:11pt}
header b{font-size:13pt;color:#1e3a5f}
.card{position:relative;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:6pt;height:4.6in;margin-bottom:10pt;border:2pt solid #1e3a5f;border-radius:10pt;padding:6pt;break-inside:avoid;page-break-inside:avoid}
.card:nth-of-type(2n){break-after:page;page-break-after:always}
.q{border:1pt solid #c9d2de;border-radius:6pt;padding:8pt 10pt;overflow:hidden}
.q h3{margin:0 0 4pt;font-size:9.5pt;letter-spacing:.06em;text-transform:uppercase;color:#0f6b68}
.q p{margin:0;font-size:12.5pt;line-height:1.35}
.q2,.q4{text-align:right}.q2 h3,.q4 h3{text-align:right}
.q1,.q3{padding-right:22%}.q2,.q4{padding-left:22%}
.q1,.q2{padding-bottom:16%}.q3,.q4{padding-top:16%}
.ex{font-style:italic}
.es{font-weight:700;font-size:15pt!important;color:#1e3a5f}
.mine{margin-top:8pt!important}
.q3 img{max-width:70%;max-height:1.3in;display:block}
.lines{height:100%;min-height:0.9in;background:repeating-linear-gradient(to bottom,transparent 0,transparent 23pt,#b8c2cf 23pt,#b8c2cf 24pt)}
.term{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);min-width:42%;max-width:56%;padding:10pt 16pt;border:2.5pt solid #0f6b68;border-radius:999pt;background:#fff;text-align:center}
.term span{font-size:22pt;font-weight:800;color:#0f6b68;word-break:break-word}
.none{font-size:14pt;padding:1in;text-align:center}
</style>
</head>
<body>
<header><b>${esc(activity.title)}</b><span>${t.name}: ____________________________</span></header>
${cards || `<p class="none">${lang === "es" ? "Esta página no tiene una lista de palabras." : "This page has no word list."}</p>`}
</body>
</html>
`;
  return { html, count: words.length };
}
