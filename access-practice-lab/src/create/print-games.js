// Create · printable class games and checks from the page's own content:
//   bingoHtml     vocabulary bingo: a different card for every student plus the caller's list (the teacher reads the
//                 MEANING, students find the WORD), seeded so the same page always prints the same set.
//   whoHasHtml    "I have … Who has …?" loop cards: one per word, the chain returns to the first card.
//   exitSlipsHtml four (or, for long items, two) copies of a short exit slip per page from the resource's first questions (no answers).
// Built only from the page's own words and questions; nothing is invented. Pure: returns HTML strings for print.

import { deckSlides } from "./deck.js";
import { wordsOf } from "./word-cards.js";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

/** Deterministic PRNG (mulberry32) seeded from a string, so a reprint matches the first print. */
export function seeded(text) {
  let h = 2166136261;
  for (const ch of String(text)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Grid side for a word count: 5x5 from 24 words, 4x4 from 16, 3x3 (free centre) from 8; 0 = too few. */
export function bingoSize(n) {
  return n >= 24 ? 5 : n >= 16 ? 4 : n >= 8 ? 3 : 0;
}

const T = {
  en: {
    bingo: "Word bingo",
    free: "FREE",
    caller: "Caller's list",
    callTip: "Read the meaning aloud. Students find and mark the word. Tick each one you read.",
    name: "Name",
    who: "I have … Who has?",
    have: "I have",
    whoHas: "Who has the word that means",
    start: "Start here",
    order: "Answer chain (teacher)",
    orderTip:
      "Hand out every card. The student with Start here reads first; the chain ends back at the start.",
    exit: "Exit slip",
    few: (n, need) => `This page has ${n} words with meanings. This game needs at least ${need}.`,
    noQ: "This resource has no questions for an exit slip.",
    sort: "Card sort",
    match: "Match each word to its meaning",
    matchTip: "Write the letter of the meaning next to each word.",
    cut: "Cut apart. Sort the cards into sets: a word, its meaning and an example.",
    word: "Word",
    meaning: "Meaning",
    example: "Example",
    key: "Answer key (teacher)",
  },
  es: {
    bingo: "Bingo de palabras",
    free: "LIBRE",
    caller: "Lista para leer",
    callTip:
      "Lea el significado en voz alta. Los estudiantes buscan y marcan la palabra. Marque cada una que lea.",
    name: "Nombre",
    who: "Yo tengo … ¿Quién tiene?",
    have: "Yo tengo",
    whoHas: "¿Quién tiene la palabra que significa",
    start: "Empiece aquí",
    order: "Cadena de respuestas (docente)",
    orderTip:
      "Reparta todas las tarjetas. Lee primero quien tiene Empiece aquí; la cadena termina en el inicio.",
    exit: "Boleto de salida",
    few: (n, need) =>
      `Esta página tiene ${n} palabras con significado. Este juego necesita al menos ${need}.`,
    noQ: "Este recurso no tiene preguntas para un boleto de salida.",
    sort: "Clasificar tarjetas",
    match: "Une cada palabra con su significado",
    matchTip: "Escribe la letra del significado junto a cada palabra.",
    cut: "Recorta. Agrupa las tarjetas en juegos: una palabra, su significado y un ejemplo.",
    word: "Palabra",
    meaning: "Significado",
    example: "Ejemplo",
    key: "Clave de respuestas (docente)",
  },
};
const tr = (lang) => T[lang === "es" ? "es" : "en"];

function page(title, lang, css, body) {
  return `<!doctype html>
<html lang="${lang === "es" ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:">
<title>${esc(title)}</title>
<style>
@page{size:letter;margin:0.45in}
*{box-sizing:border-box}
body{margin:0;font-family:"Segoe UI",system-ui,-apple-system,sans-serif;color:#1b2430;-webkit-print-color-adjust:exact;print-color-adjust:exact}
h1{font-size:16pt;color:#1e3a5f;margin:0 0 4pt}
.none{font-size:14pt;padding:1in;text-align:center}
.brk{break-after:page;page-break-after:always}
${css}
</style>
</head>
<body>
${body}
</body>
</html>
`;
}

/**
 * @param {object} activity @param {{lang?: string, count?: number}} opts count = cards (one per student)
 * @returns {{html: string, cards: number, size: number}}
 */
export function bingoHtml(activity, { lang = "en", count = 30 } = {}) {
  const t = tr(lang);
  const words = wordsOf(activity);
  const size = bingoSize(words.length);
  const title = `${activity.title} · ${t.bingo}`;
  if (!size)
    return {
      html: page(title, lang, "", `<p class="none">${esc(t.few(words.length, 8))}</p>`),
      cards: 0,
      size: 0,
    };
  const n = Math.max(1, Math.min(60, Math.round(count) || 30));
  const rand = seeded(`${activity.id || activity.title}|bingo`);
  const free = size % 2 === 1 && size < 5 ? Math.floor((size * size) / 2) : size === 5 ? 12 : -1;
  const cells = size * size - (free >= 0 ? 1 : 0);
  const cards = [];
  for (let c = 0; c < n; c += 1) {
    const pick = shuffle(words, rand).slice(0, cells);
    const grid = [];
    for (let k = 0, w = 0; k < size * size; k += 1)
      grid.push(k === free ? `<td class="free">${t.free}</td>` : `<td>${esc(pick[w++].term)}</td>`);
    const rows = Array.from(
      { length: size },
      (_, r) => `<tr>${grid.slice(r * size, r * size + size).join("")}</tr>`,
    ).join("");
    cards.push(
      `<section class="card${c % 2 ? " brk" : ""}"><header><b>${esc(activity.title)}</b><span>${t.name}: ____________________</span></header><h2>${t.bingo.toUpperCase()}</h2><table class="g${size}">${rows}</table></section>`,
    );
  }
  const caller = [...words]
    .sort((a, b) => a.term.localeCompare(b.term))
    .map((v) => `<li><span class="box"></span><b>${esc(v.term)}</b> — ${esc(v.def)}</li>`)
    .join("");
  const css = `.card{height:4.85in;display:flex;flex-direction:column;gap:6pt;border:2pt solid #1e3a5f;border-radius:10pt;padding:10pt 14pt;margin-bottom:10pt;break-inside:avoid}
.card header{display:flex;justify-content:space-between;font-size:10.5pt}.card header b{color:#1e3a5f}
.card h2{margin:0;text-align:center;letter-spacing:.3em;color:#0f6b68;font-size:18pt}
table{flex:1;width:100%;border-collapse:collapse;table-layout:fixed}
td{border:1.5pt solid #1e3a5f;text-align:center;vertical-align:middle;font-weight:700;padding:3pt;word-break:break-word;line-height:1.15}
.g5 td{font-size:11pt}.g4 td{font-size:13pt}.g3 td{font-size:16pt}
td.free{background:#fef3c7;color:#b45309;letter-spacing:.08em}
.caller{break-before:page;page-break-before:always}.caller p{font-size:11pt;color:#475467;margin:0 0 8pt}
.caller ol{columns:2;column-gap:18pt;padding-left:0;list-style:none;margin:0;font-size:11pt}
.caller li{break-inside:avoid;margin:0 0 6pt;display:flex;gap:6pt}.box{flex:none;width:11pt;height:11pt;border:1.2pt solid #1e3a5f;border-radius:2pt;margin-top:2pt}`;
  const body = `${cards.join("\n")}<section class="caller"><h1>${t.caller} · ${esc(activity.title)}</h1><p>${t.callTip}</p><ol>${caller}</ol></section>`;
  return { html: page(title, lang, css, body), cards: n, size };
}

/** @returns {{html: string, count: number}} one card per word, chained in a seeded order back to the start. */
export function whoHasHtml(activity, { lang = "en" } = {}) {
  const t = tr(lang);
  const words = wordsOf(activity);
  const title = `${activity.title} · ${t.who}`;
  if (words.length < 4)
    return {
      html: page(title, lang, "", `<p class="none">${esc(t.few(words.length, 4))}</p>`),
      count: 0,
    };
  const order = shuffle(words, seeded(`${activity.id || activity.title}|whohas`));
  const cards = order
    .map((v, i) => {
      const next = order[(i + 1) % order.length];
      return `<section class="wh">${i === 0 ? `<span class="start">★ ${t.start}</span>` : ""}<p class="have">${t.have}: <b>${esc(v.term)}</b></p><p class="who">${t.whoHas}: “${esc(next.def)}”?</p></section>`;
    })
    .join("");
  const key = order.map((v) => `<li>${esc(v.term)}</li>`).join("");
  const css = `.grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
.wh{position:relative;height:2.45in;border:1.2pt dashed #8a96a8;padding:14pt 16pt;display:flex;flex-direction:column;justify-content:center;gap:10pt;break-inside:avoid}
.have{margin:0;font-size:13pt}.have b{display:block;font-size:22pt;color:#0f6b68;margin-top:2pt}
.who{margin:0;font-size:12pt;border-top:1.5pt solid #1e3a5f;padding-top:8pt}
.start{position:absolute;right:10pt;top:8pt;font-size:10pt;font-weight:700;color:#b45309}
.key{break-before:page;page-break-before:always}.key p{font-size:11pt;color:#475467}.key ol{columns:2;font-size:12pt}`;
  return {
    html: page(
      title,
      lang,
      css,
      `<div class="grid">${cards}</div><section class="key"><h1>${t.order} · ${esc(activity.title)}</h1><p>${t.orderTip}</p><ol>${key}</ol></section>`,
    ),
    count: order.length,
  };
}

/** @returns {{html: string, questions: number, perPage: 2|4}} identical slips (four, or two for long items), each with up to `take` questions. */
export function exitSlipsHtml(activity, { lang = "en", take = 2 } = {}) {
  const t = tr(lang);
  let qs = deckSlides(activity, { lang })
    .filter((s) => s.kind === "question")
    .slice(0, take);
  // a slip must fit: long items (matching sets, many choices) print one question, two slips to a page
  const size = (list) => list.reduce((n, q) => n + 2 + Math.ceil(q.lines.filter(Boolean).length / 2), 0);
  if (qs.length > 1 && size(qs) > 14) qs = qs.slice(0, 1);
  const per = size(qs) <= 7 ? 4 : 2;
  const title = `${activity.title} · ${t.exit}`;
  if (!qs.length)
    return { html: page(title, lang, "", `<p class="none">${esc(t.noQ)}</p>`), questions: 0 };
  const slip = `<section class="slip"><header><b>${t.exit} · ${esc(activity.title)}</b><span>${t.name}: ________________</span></header>${qs
    .map(
      (q, i) =>
        `<div class="q"><p class="p">${i + 1}. ${esc(q.title.replace(/^\d+\.\s*/, ""))}</p>${
          q.lines.filter(Boolean).length
            ? `<ul>${q.lines
                .filter(Boolean)
                .map((l) => `<li>${esc(l)}</li>`)
                .join("")}</ul>`
            : ""
        }${q.tiles ? "" : '<div class="ln"></div>'}</div>`,
    )
    .join("")}</section>`;
  const css = `.sheet{display:grid;grid-template-rows:repeat(${per},minmax(0,1fr));height:10in;gap:0}
.slip{border-bottom:1.2pt dashed #8a96a8;padding:8pt 4pt;overflow:hidden;display:flex;flex-direction:column;gap:5pt}
.slip header{display:flex;justify-content:space-between;font-size:10pt}.slip header b{color:#1e3a5f}
.q .p{margin:0;font-size:11pt;font-weight:600}.q ul{margin:2pt 0 0;padding-left:14pt;font-size:10pt;columns:2}
.ln{height:28pt;background:repeating-linear-gradient(to bottom,transparent 0,transparent 13pt,#b8c2cf 13pt,#b8c2cf 14pt)}`;
  return {
    html: page(title, lang, css, `<div class="sheet">${slip.repeat(per)}</div>`),
    questions: qs.length,
    perPage: per,
  };
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** The example with its own word (and endings such as -ly, -s) blanked, so sorting means reading, not spotting. */
export function blankOut(example, term) {
  const t = String(term || "").trim();
  if (!t) return example;
  const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\p{L}]*`, "giu");
  return String(example).replace(re, "_____");
}

/**
 * Card sort: page 1 a matching sheet (words numbered, meanings lettered in a seeded order), then cut-apart cards
 * (word, meaning, example when the page has one) with a coloured band per card type, then the teacher's key.
 * Up to 26 words (one letter each). @returns {{html: string, count: number}}
 */
export function cardSortHtml(activity, { lang = "en" } = {}) {
  const t = tr(lang);
  const words = wordsOf(activity).slice(0, 26);
  const title = `${activity.title} · ${t.sort}`;
  if (words.length < 4)
    return { html: page(title, lang, "", `<p class="none">${esc(t.few(words.length, 4))}</p>`), count: 0 };
  const rand = seeded(`${activity.id || activity.title}|sort`);
  const meanings = shuffle(words, rand);
  const letterOf = new Map(meanings.map((v, i) => [v, LETTERS[i]]));
  const left = words.map((v, i) => `<li><span class="blank"></span><b>${i + 1}. ${esc(v.term)}</b></li>`).join("");
  const right = meanings.map((v, i) => `<li><b>${LETTERS[i]}.</b> ${esc(v.def)}</li>`).join("");
  const card = (kind, label, text) =>
    `<div class="sc ${kind}"><span class="band">${label}</span><p>${esc(text)}</p></div>`;
  const cards = shuffle(
    words.flatMap((v) => [
      card("w", t.word, v.term),
      card("m", t.meaning, v.def),
      ...(v.example ? [card("e", t.example, blankOut(v.example, v.term))] : []),
    ]),
    rand,
  ).join("");
  const key = words.map((v, i) => `<li>${i + 1}. ${esc(v.term)} — <b>${letterOf.get(v)}</b></li>`).join("");
  const css = `header.n{display:flex;justify-content:space-between;font-size:10.5pt;margin-bottom:6pt}header.n b{color:#1e3a5f}
.tip{margin:0 0 10pt;color:#475467;font-size:11pt}
.match{display:grid;grid-template-columns:1fr 1.6fr;gap:18pt}
.match ol{list-style:none;padding:0;margin:0;display:grid;gap:9pt;font-size:12pt;align-content:start}
.match .terms li{display:flex;gap:8pt;align-items:baseline}
.blank{display:inline-block;width:26pt;border-bottom:1.2pt solid #1b2430}
.cardpage{break-before:page;page-break-before:always}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.sc{height:1.55in;border:1pt dashed #8a96a8;padding:0;display:flex;flex-direction:column;break-inside:avoid;overflow:hidden}
.sc .band{display:block;padding:3pt 8pt;font-size:8.5pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#fff}
.sc p{margin:auto 0;padding:6pt 10pt;text-align:center;font-size:11pt;line-height:1.3}
.sc.w .band{background:#0f6b68}.sc.w p{font-size:17pt;font-weight:800;color:#0f6b68}
.sc.m .band{background:#1e3a5f}.sc.e .band{background:#b45309}.sc.e p{font-style:italic}
.key{break-before:page;page-break-before:always}.key ol{list-style:none;padding:0;columns:2;font-size:12pt}`;
  const body = `<header class="n"><b>${esc(activity.title)}</b><span>${t.name}: ____________________</span></header>
<h1>${t.match}</h1><p class="tip">${t.matchTip}</p>
<div class="match"><ol class="terms">${left}</ol><ol>${right}</ol></div>
<section class="cardpage"><p class="tip">✂ ${t.cut}</p><div class="cards">${cards}</div></section>
<section class="key"><h1>${t.key} · ${esc(activity.title)}</h1><p class="tip">${t.cut}</p><ol>${key}</ol></section>`;
  return { html: page(title, lang, css, body), count: words.length };
}
