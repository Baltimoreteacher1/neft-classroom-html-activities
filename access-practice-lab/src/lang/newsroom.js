// Newsroom logic (pure, no DOM): the 5W1H organizer, draft frames, rule-based observations on a draft, the story text
// that is read aloud, and the print-ready front page. Observations count and compare the learner's own words with their
// plan. They never judge meaning and never produce a score.

export const W5 = [
  ["who", "Who?", "¿Quién?", "Who is in the story?", "¿Quién está en la historia?"],
  [
    "what",
    "What happened?",
    "¿Qué pasó?",
    "What happened? Say it in one sentence.",
    "¿Qué pasó? Dilo en una oración.",
  ],
  [
    "when",
    "When?",
    "¿Cuándo?",
    "Day or time: this morning, on Friday…",
    "Día u hora: esta mañana, el viernes…",
  ],
  [
    "where",
    "Where?",
    "¿Dónde?",
    "Place: the gym, the park, Room 12…",
    "Lugar: el gimnasio, el parque, el salón 12…",
  ],
  [
    "why",
    "Why?",
    "¿Por qué?",
    "Why did it happen? Why does it matter?",
    "¿Por qué pasó? ¿Por qué importa?",
  ],
  [
    "how",
    "How?",
    "¿Cómo?",
    "How did it happen? How will people feel or help?",
    "¿Cómo pasó? ¿Cómo se sentirá o ayudará la gente?",
  ],
];
export const W5_IDS = W5.map((w) => w[0]);

export const FORMATS = {
  article: ["Class newspaper article", "Artículo para el periódico de la clase"],
  newscast: ["Newscast or podcast script", "Guion de noticiero o pódcast"],
};
/** Draft parts per format, in reading order. */
export const PARTS = {
  article: ["lead", "details", "quote", "ending"],
  newscast: ["opener", "lead", "details", "quote", "signoff"],
};
export const PART_COPY = {
  opener: ["Opening", "Apertura", "Greet the audience and name your show."],
  lead: [
    "First sentence (the lead)",
    "Primera oración (el inicio)",
    "Tell the most important facts first: who, what, when, where.",
  ],
  details: ["Details", "Detalles", "Add why and how. Use words like first, then, because."],
  quote: ["A quote", "Una cita", "Add what a person said, in quotation marks."],
  ending: ["Ending", "Final", "Tell what happens next or how readers can help."],
  signoff: ["Sign-off", "Despedida", "Thank the audience and say goodbye."],
};
export const FRAMES = {
  opener: [
    [
      "Good morning. I am ___ and this is the ___ news.",
      "Buenos días. Soy ___ y estas son las noticias de ___.",
    ],
    [
      "Welcome to ___. Here is today’s top story.",
      "Bienvenidos a ___. Esta es la noticia principal de hoy.",
    ],
  ],
  lead: [
    ["On ___, ___ at ___ ___.", "El ___, ___ en ___ ___."],
    ["___ announced that ___.", "___ anunció que ___."],
    ["Students at ___ ___ because ___.", "Los estudiantes de ___ ___ porque ___."],
  ],
  details: [
    ["First, ___. Then, ___. Finally, ___.", "Primero, ___. Luego, ___. Por último, ___."],
    ["The ___ will ___ so that ___.", "El/la ___ va a ___ para que ___."],
    ["Many students ___ because ___.", "Muchos estudiantes ___ porque ___."],
  ],
  quote: [
    ["“___,” said ___.", "«___», dijo ___."],
    ["“___,” explained ___, who ___.", "«___», explicó ___, quien ___."],
    ["According to ___, “___.”", "Según ___, «___»."],
  ],
  ending: [
    ["Next week, ___ will ___.", "La próxima semana, ___ va a ___."],
    ["Students can help by ___.", "Los estudiantes pueden ayudar ___."],
    ["For more information, ask ___.", "Para más información, pregunta a ___."],
  ],
  signoff: [
    [
      "That is all for today. I am ___. Thank you for listening.",
      "Eso es todo por hoy. Soy ___. Gracias por escuchar.",
    ],
    [
      "Stay curious and stay kind. This was ___ reporting.",
      "Sigue con curiosidad y sé amable. Les informó ___.",
    ],
  ],
};
export const BANK = {
  said: ["said", "explained", "announced", "reported", "shared", "added"],
  link: ["first", "then", "finally", "because", "so", "next", "meanwhile", "as a result"],
  time: ["this morning", "yesterday", "on Friday", "last week", "after lunch"],
};
export const BANK_ES = {
  said: ["dijo", "explicó", "anunció", "informó", "compartió", "añadió"],
  link: [
    "primero",
    "luego",
    "por último",
    "porque",
    "entonces",
    "después",
    "mientras tanto",
    "como resultado",
  ],
  time: ["esta mañana", "ayer", "el viernes", "la semana pasada", "después del almuerzo"],
};

const words = (s) =>
  String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
const sentenceList = (s) =>
  String(s || "")
    .split(/(?<=[.?!”"])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);
const sig = (s) =>
  words(s)
    .map((w) => w.toLowerCase().replace(/[^a-záéíóúñü0-9]/g, ""))
    .filter((w) => w.length >= 4);

export const planCount = (plan) => W5_IDS.filter((k) => words(plan?.[k]).length >= 1).length;
export const partsOf = (fmt) => PARTS[fmt] || PARTS.article;
/** The whole story as one text in reading order. */
export const storyText = (draft, fmt) =>
  partsOf(fmt)
    .map((p) => String(draft?.[p] || "").trim())
    .filter(Boolean)
    .join(" ");
export const storyWords = (draft, fmt) => words(storyText(draft, fmt)).length;

const SAID = /\b(said|says|explained|announced|reported|shared|added|told|according to)\b/i;
const LINKS = /\b(first|then|finally|because|so|next|meanwhile|as a result|after|before|since)\b/gi;

/**
 * Observations about a draft. Each is { id, ok, en, es }: facts about the learner's own text and plan, worded as
 * "you did X" or "you could add X", never as a grade.
 */
export function observe(draft, plan, fmt) {
  const text = storyText(draft, fmt);
  const out = [];
  if (!text) return out;
  const lead = sig(draft?.lead);
  const filled = ["who", "what", "when", "where"].filter((k) => words(plan?.[k]).length);
  const shown = filled.filter((k) => sig(plan[k]).some((w) => lead.includes(w)));
  if (filled.length)
    out.push({
      id: "lead",
      ok: shown.length >= Math.min(3, filled.length),
      en: `Your first sentence uses details from ${shown.length} of ${filled.length} plan boxes (who, what, when, where).`,
      es: `Tu primera oración usa detalles de ${shown.length} de ${filled.length} cuadros del plan (quién, qué, cuándo, dónde).`,
    });
  const hasQuote = /[“"«].+[”"»]/.test(draft?.quote || "") && SAID.test(draft?.quote || "");
  if (partsOf(fmt).includes("quote"))
    out.push({
      id: "quote",
      ok: hasQuote,
      en: hasQuote
        ? "You added a quote with quotation marks and a said-word."
        : "Add a quote: put what a person said inside quotation marks and say who said it.",
      es: hasQuote
        ? "Agregaste una cita con comillas y una palabra como «dijo»."
        : "Agrega una cita: pon lo que dijo una persona entre comillas y di quién lo dijo.",
    });
  const links = new Set((text.match(LINKS) || []).map((x) => x.toLowerCase()));
  out.push({
    id: "links",
    ok: links.size >= 2,
    en:
      links.size >= 2
        ? `You used ${links.size} linking words (${[...links].join(", ")}).`
        : "Try two linking words such as first, then, because or finally.",
    es:
      links.size >= 2
        ? `Usaste ${links.size} palabras de enlace.`
        : "Prueba dos palabras de enlace como primero, luego, porque o por último.",
  });
  const open = partsOf(fmt).reduce((n, p) => n + sentenceList(draft?.[p]).filter((x) => !/[.?!”"»]$/.test(x)).length, 0);
  out.push({
    id: "ends",
    ok: open === 0,
    en: open
      ? `${open} ${open === 1 ? "sentence needs" : "sentences need"} an ending mark (. ? !).`
      : "Every sentence ends with a mark.",
    es: open
      ? `${open} ${open === 1 ? "oración necesita" : "oraciones necesitan"} un signo final (. ? !).`
      : "Cada oración termina con un signo.",
  });
  const blanks = (text.match(/_{3,}/g) || []).length;
  if (blanks)
    out.push({
      id: "blanks",
      ok: false,
      en: `${blanks} blank ${blanks === 1 ? "space is" : "spaces are"} still in your story. Fill ${blanks === 1 ? "it" : "them"} in.`,
      es: `Todavía ${blanks === 1 ? "queda 1 espacio" : `quedan ${blanks} espacios`} en blanco en tu historia. Complétalos.`,
    });
  return out;
}

export function headlineCheck(head) {
  const w = words(head);
  if (!w.length) return { ok: false, en: "Write a headline.", es: "Escribe un titular." };
  const cap = /^[A-ZÁÉÍÓÚÑ¿¡“"]/.test(head.trim());
  if (w.length < 3)
    return {
      ok: false,
      en: "A headline usually has at least three words.",
      es: "Un titular suele tener al menos tres palabras.",
    };
  if (w.length > 12)
    return {
      ok: false,
      en: `Your headline has ${w.length} words. Headlines are short: try ten or fewer.`,
      es: `Tu titular tiene ${w.length} palabras. Los titulares son cortos: prueba con diez o menos.`,
    };
  if (!cap)
    return {
      ok: false,
      en: "Start your headline with a capital letter.",
      es: "Empieza tu titular con mayúscula.",
    };
  return {
    ok: true,
    en: `A clear headline of ${w.length} words.`,
    es: `Un titular claro de ${w.length} palabras.`,
  };
}

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
const para = (draft, fmt) =>
  partsOf(fmt)
    .map((p) => String(draft?.[p] || "").trim())
    .filter(Boolean)
    .map((t) => `<p>${esc(t)}</p>`)
    .join("");

/** Print styles for the sheet. One source: the page embeds it and the downloaded file embeds it. */
export const SHEET_CSS = `.nr-sheet{box-sizing:border-box;max-width:8.5in;margin:0 auto;padding:.5in;background:#fff;color:#111a3b;font:400 11.5pt/1.5 "Atkinson Hyperlegible",system-ui,sans-serif}
.nr-sheet *{box-sizing:border-box}.nr-mast{border-top:4px solid #111a3b;border-bottom:2px solid #111a3b;text-align:center;padding:.12in 0}
.nr-paper{margin:0;font:700 28pt/1.1 Fraunces,Georgia,serif;letter-spacing:-.01em}.nr-dateline{margin:.04in 0 0;font-size:9.5pt;letter-spacing:.06em;text-transform:uppercase}
.nr-headline{margin:.22in 0 .06in;font:700 30pt/1.1 Fraunces,Georgia,serif;text-wrap:balance}.nr-by{margin:0 0 .16in;font-size:10.5pt;font-style:italic}
.nr-fig{float:left;width:3.1in;margin:0 .2in .12in 0}.nr-fig svg{display:block;width:100%;height:auto;border:1px solid #bdb4a6}.nr-fig figcaption{font-size:9pt;margin-top:.04in}
.nr-body{column-count:2;column-gap:.25in}.nr-body p{margin:0 0 .1in;break-inside:avoid-column;text-align:left}.nr-body p:first-child::first-letter{font:700 30pt/1 Fraunces,Georgia,serif;float:left;padding-right:.05in}
.nr-foot{clear:both;margin-top:.2in;padding-top:.06in;border-top:1px solid #bdb4a6;font-size:8.5pt;text-align:center}
@media (max-width:40rem){.nr-sheet{padding:.2in;overflow-wrap:anywhere}.nr-body{column-count:1}.nr-fig{float:none;width:100%;margin:0 0 .12in}.nr-headline{font-size:22pt}.nr-paper{font-size:20pt}}`;

/** The front page markup. `pic` is [en, es, svgInner] from PICS or null. */
export function frontPageHTML({ story, prompt, pic, kindLabel, date, footer }) {
  const fmt = story.fmt || "article";
  const head = story.head || prompt?.title || "";
  const by = story.by ? `By ${esc(story.by)}` : "";
  return `<article class="nr-sheet" aria-label="${esc(head)}"><header class="nr-mast"><p class="nr-paper">${esc(story.paper || "Our Class News")}</p><p class="nr-dateline">${esc(date)} · ${esc(kindLabel)}</p></header>
<h2 class="nr-headline">${esc(head)}</h2>${by ? `<p class="nr-by">${by}</p>` : ""}
${pic ? `<figure class="nr-fig"><svg viewBox="0 0 240 160" role="img" aria-label="${esc(pic[0])}">${pic[2]}</svg><figcaption>${esc(story.cap || pic[0])}</figcaption></figure>` : ""}
<div class="nr-body">${para(story.draft, fmt)}</div><p class="nr-foot">${esc(footer)}</p></article>`;
}

/** A complete HTML document for the "Download my page" button. */
export const sheetDocument = (inner, title, lang = "en") =>
  `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>body{margin:0;background:#f4efe8}${SHEET_CSS}@media print{body{background:#fff}.nr-sheet{padding:0}@page{size:letter;margin:.5in}}</style></head><body>${inner}</body></html>`;
