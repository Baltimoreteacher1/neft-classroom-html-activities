// Create · the Lesson kit: everything Create can make from one resource, in one folder, opened from a start page
// that suggests a lesson flow (warm up with the words, teach with the slides, practise, play, check). Each file is
// included only when the page has what it needs (a printable format for the print copy, 8 words for bingo, …), and
// the start page lists only what is in the folder. Pure apart from the injected renderers, so Node tests build kits.

import { deckHtml } from "./deck.js";
import { bingoHtml, cardSortHtml, exitSlipsHtml, whoHasHtml } from "./print-games.js";
import { wordCardsHtml, wordsOf } from "./word-cards.js";

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const T = {
  en: {
    title: "Lesson kit",
    lead: "Everything made from this page, in one folder. Open a file to use or print it. Nothing here needs the internet.",
    flow: "A suggested flow",
    stages: {
      warm: ["Warm up", "Show the word slides. Press F for partner-talk frames."],
      teach: [
        "Teach",
        "Present the slides. Press V on a choice question to count hands, then A to show the answer.",
      ],
      practice: ["Practise", "Students work on the page on a device, or on the printed copy."],
      play: ["Play", "Use a word game with the whole class or a small group."],
      check: ["Check", "Hand out exit slips at the end; the answer key is for you."],
    },
    files: {
      slides: [
        "Slides to present",
        "Arrow keys move; A shows an answer; T team points; P picks a student; V votes; F talk frames.",
      ],
      student: ["Student page", "Works offline in any browser; checks answers as students go."],
      print: ["Printable copy", "US Letter; print or save as PDF."],
      key: ["Answer key", "Teacher copy only."],
      exit: ["Exit slips", "Cut apart; no answers on them."],
      cards: ["Word cards", "Meaning, example, a box to draw it."],
      bingo: ["Word bingo", "A different card per student and your caller's list."],
      whoHas: ["I have… Who has?", "One card per student; the chain loops back to the start."],
      sort: ["Card sort", "A matching sheet, cut-apart cards and the key."],
    },
    teacherOnly: "Teacher only",
  },
  es: {
    title: "Kit de la lección",
    lead: "Todo lo que se hizo con esta página, en una carpeta. Abra un archivo para usarlo o imprimirlo. Nada aquí necesita internet.",
    flow: "Una secuencia sugerida",
    stages: {
      warm: [
        "Calentamiento",
        "Muestre las diapositivas de palabras. Pulse F para marcos de conversación en parejas.",
      ],
      teach: [
        "Enseñar",
        "Presente las diapositivas. Pulse V en una pregunta de opción para contar manos y luego A para la respuesta.",
      ],
      practice: [
        "Practicar",
        "Los estudiantes trabajan en la página en un dispositivo o en la copia impresa.",
      ],
      play: ["Jugar", "Use un juego de palabras con toda la clase o un grupo pequeño."],
      check: ["Comprobar", "Reparta los boletos de salida al final; la clave es para usted."],
    },
    files: {
      slides: [
        "Diapositivas",
        "Flechas para avanzar; A muestra la respuesta; T puntos; P elige; V votos; F marcos para hablar.",
      ],
      student: ["Página del estudiante", "Funciona sin conexión; revisa las respuestas."],
      print: ["Copia imprimible", "Tamaño carta; imprima o guarde como PDF."],
      key: ["Clave de respuestas", "Solo para el docente."],
      exit: ["Boletos de salida", "Para recortar; sin respuestas."],
      cards: ["Tarjetas de palabras", "Significado, ejemplo, un espacio para dibujar."],
      bingo: ["Bingo de palabras", "Una tarjeta distinta por estudiante y su lista para leer."],
      whoHas: [
        "Yo tengo… ¿Quién tiene?",
        "Una tarjeta por estudiante; la cadena vuelve al inicio.",
      ],
      sort: ["Clasificar tarjetas", "Hoja para unir, tarjetas para recortar y la clave."],
    },
    teacherOnly: "Solo docente",
  },
};

/** Which stage each file belongs to, and the file names (numbered so a folder lists in lesson order). */
const PLAN = [
  { id: "slides", stage: "teach", name: "01-slides.html" },
  { id: "student", stage: "practice", name: "02-student-page.html" },
  { id: "print", stage: "practice", name: "03-printable.html" },
  { id: "key", stage: "practice", name: "04-answer-key.html", teacher: true },
  { id: "cards", stage: "warm", name: "05-word-cards.html" },
  { id: "bingo", stage: "play", name: "06-word-bingo.html" },
  { id: "whoHas", stage: "play", name: "07-i-have-who-has.html" },
  { id: "sort", stage: "play", name: "08-card-sort.html" },
  { id: "exit", stage: "check", name: "09-exit-slips.html" },
];

/**
 * Build the kit's files.
 * @param {object} built the resource as built in Create (format, adjustments, supports applied)
 * @param {object} base  the page's own content (word games read its full word list)
 * @param {{lang?: string, printable?: boolean, studentHtml: Function, printHtml: Function}} deps
 * @returns {Promise<{files: {name: string, id: string, data: string}[], startHtml: string}>}
 */
export async function lessonKit(
  built,
  base,
  { lang = "en", printable = false, studentHtml, printHtml },
) {
  if (typeof studentHtml !== "function" || typeof printHtml !== "function")
    throw new Error("kit-deps");
  const t = T[lang === "es" ? "es" : "en"];
  const words = wordsOf(base).length;
  const hasQ = (built.blocks || []).some((b) => b.type === "question");
  const make = {
    slides: () => deckHtml(built, { lang }),
    student: () => studentHtml(built, { lang }),
    print: printable ? async () => (await printHtml(built, { lang, part: "student" })).html : null,
    key:
      printable && hasQ ? async () => (await printHtml(built, { lang, part: "key" })).html : null,
    cards: words ? () => wordCardsHtml(base, { lang }).html : null,
    bingo: words >= 8 ? () => bingoHtml(base, { lang }).html : null,
    whoHas: words >= 4 ? () => whoHasHtml(base, { lang }).html : null,
    sort: words >= 4 ? () => cardSortHtml(base, { lang }).html : null,
    exit: hasQ ? () => exitSlipsHtml(built, { lang }).html : null,
  };
  const files = [];
  for (const p of PLAN) if (make[p.id]) files.push({ ...p, data: await make[p.id]() });
  return { files, startHtml: kitStartHtml(built.title, files, t, lang) };
}

function kitStartHtml(title, files, t, lang) {
  const stages = Object.keys(t.stages)
    .map((stage) => {
      const here = files.filter((f) => f.stage === stage);
      if (!here.length) return "";
      const [name, how] = t.stages[stage];
      const links = here
        .map((f) => {
          const [label, note] = t.files[f.id];
          return `<li><a href="${f.name}">${esc(label)}</a>${f.teacher ? ` <span class="tag">${t.teacherOnly}</span>` : ""}<small>${esc(note)}</small></li>`;
        })
        .join("");
      return `<section class="st st-${stage}"><h2><span class="dot"></span>${esc(name)}</h2><p>${esc(how)}</p><ul>${links}</ul></section>`;
    })
    .join("");
  return `<!doctype html>
<html lang="${lang === "es" ? "es" : "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
<title>${esc(title)} · ${t.title}</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f6f4ee;color:#1b2430;font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:860px;margin:0 auto;padding:28px 16px 48px}
.hero{background:linear-gradient(135deg,#0f6b68,#1e3a5f);color:#fff;border-radius:18px;padding:24px 26px;margin-bottom:22px}
.hero small{letter-spacing:.08em;text-transform:uppercase;opacity:.85}.hero h1{margin:4px 0 8px;font-size:clamp(24px,4vw,34px);line-height:1.15}.hero p{margin:0;opacity:.95}
h2.flow{font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:#475467;margin:0 0 10px}
.st{--c:#1e3a5f;background:#fff;border:1px solid #d8dde5;border-left:6px solid var(--c);border-radius:14px;padding:14px 18px;margin-bottom:12px}
.st h2{margin:0;font-size:19px;display:flex;align-items:center;gap:8px;color:var(--c)}.dot{width:12px;height:12px;border-radius:50%;background:var(--c)}
.st p{margin:4px 0 8px;color:#344054}.st ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.st li{display:grid;gap:0}.st a{font-weight:700;color:var(--c);font-size:17px}.st a:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}
.st small{color:#475467}.tag{display:inline-block;margin-left:6px;padding:0 8px;border-radius:999px;background:#fde9d4;color:#9a3412;font-size:12px;font-weight:700}
.st-warm{--c:#2f6b3a}.st-teach{--c:#0f6b68}.st-practice{--c:#1e3a5f}.st-play{--c:#b45309}.st-check{--c:#9a3412}
</style>
</head>
<body>
<main>
<header class="hero"><small>${t.title}</small><h1>${esc(title)}</h1><p>${t.lead}</p></header>
<h2 class="flow">${t.flow}</h2>
${stages}
</main>
</body>
</html>
`;
}
