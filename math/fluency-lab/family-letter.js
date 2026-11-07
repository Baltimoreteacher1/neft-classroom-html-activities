// A printable welcome letter and a sheet of home-access cards for families, in English and Spanish. The text is
// written out in both languages here (not through t()) because a teacher prints the language the families read,
// whatever language the teacher's own screen uses. The QR code and the printed address open the lab at one grade.
import { escapeHtml, localQrMarkup } from "./school-tools.js";

const LAB_URL = "https://eduwonderlab.com/math/fluency-lab/";
export const CARDS_PER_SHEET = 8;
export const LETTER_LANGS = Object.freeze(["en", "es", "both"]);

export function labUrl(grade, lang = "en") {
  const url = new URL(LAB_URL);
  const g = Math.floor(Number(grade));
  if (g >= 0 && g <= 8) url.searchParams.set("grade", String(g));
  if (lang === "es") url.searchParams.set("lang", "es");
  return url.href;
}

const COPY = {
  en: {
    title: "Welcome to the Math Fluency Lab",
    hello: "Dear families,",
    intro:
      "Our class practices math with the Math Fluency Lab from EduWonderLab. It is free, works on a phone, tablet or computer, and needs no account, email address or password.",
    startH: "How to get started",
    start: [
      "Scan the code on this page, or type the web address below it.",
      "Choose your child's grade, then a topic and a skill.",
      "Press Start. Progress is saved on that device, so use the same device each time.",
    ],
    expectH: "What to expect",
    expect: [
      "Nothing is timed. There are no clocks, no speed goals and no rankings.",
      "Hints and worked steps help without giving the answer away.",
      "Ten to fifteen minutes a few times a week is plenty.",
      "Press Español at the top of the page for the buttons and messages in Spanish. Math problems stay in English, with a Spanish peek that shows the same question.",
    ],
    helpH: "How you can help",
    help: [
      "Ask your child to explain one answer in their own words.",
      "Praise careful thinking and effort, not speed.",
      "If your child is stuck, ask them to open a hint and try again.",
    ],
    thanks: "Thank you for your partnership.",
    scan: "Scan to open the lab",
    from: "Your child's math teacher",
  },
  es: {
    title: "Bienvenidos al Laboratorio de Fluidez Matemática",
    hello: "Estimadas familias:",
    intro:
      "Nuestra clase practica matemáticas con el Laboratorio de Fluidez Matemática de EduWonderLab. Es gratis, funciona en un teléfono, una tableta o una computadora, y no necesita cuenta, correo electrónico ni contraseña.",
    startH: "Cómo empezar",
    start: [
      "Escaneen el código de esta página, o escriban la dirección web que está debajo.",
      "Elijan el grado de su hijo o hija, luego un tema y una destreza.",
      "Presionen Comenzar. El progreso se guarda en ese dispositivo, así que usen el mismo dispositivo cada vez.",
    ],
    expectH: "Qué esperar",
    expect: [
      "Nada tiene tiempo límite. No hay relojes, ni metas de velocidad, ni clasificaciones.",
      "Las pistas y los pasos resueltos ayudan sin dar la respuesta.",
      "Diez a quince minutos algunas veces por semana es suficiente.",
      "Presionen Español en la parte de arriba de la página para ver los botones y mensajes en español. Los problemas de matemáticas siguen en inglés, con una ventana en español que muestra la misma pregunta.",
    ],
    helpH: "Cómo pueden ayudar",
    help: [
      "Pídanle a su hijo o hija que explique una respuesta con sus propias palabras.",
      "Elogien el pensamiento cuidadoso y el esfuerzo, no la rapidez.",
      "Si se atasca, pídanle que abra una pista e intente de nuevo.",
    ],
    thanks: "Gracias por su colaboración.",
    scan: "Escanee para abrir el laboratorio",
    from: "El maestro o la maestra de matemáticas de su hijo o hija",
  },
};

const list = (tag, items) => `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;

function qrBlock(grade, lang, size) {
  const href = labUrl(grade, lang);
  const qr = localQrMarkup(href, { label: COPY[lang].scan, size });
  return `${qr ? `<div class="fluency-local-qr">${qr}</div>` : ""}<p class="fl-letter-url">${escapeHtml(href)}</p>`;
}

function pageHtml(lang, { grade, teacher, room }) {
  const c = COPY[lang];
  const sign = [teacher, room].map((text) => String(text || "").trim()).filter(Boolean).join(" · ");
  return `<article class="fl-letter" lang="${lang}">
    <header><p>EduWonderLab</p><h1>${escapeHtml(c.title)}</h1></header>
    <p>${escapeHtml(c.hello)}</p><p>${escapeHtml(c.intro)}</p>
    <div class="fl-letter-cols"><section><h2>${escapeHtml(c.startH)}</h2>${list("ol", c.start)}</section>
      <section class="fl-letter-qr"><p><strong>${escapeHtml(c.scan)}</strong></p>${qrBlock(grade, lang, 150)}</section></div>
    <section><h2>${escapeHtml(c.expectH)}</h2>${list("ul", c.expect)}</section>
    <section><h2>${escapeHtml(c.helpH)}</h2>${list("ul", c.help)}</section>
    <p>${escapeHtml(c.thanks)}</p><p class="fl-letter-sign">${escapeHtml(sign || c.from)}</p></article>`;
}

// One letter page per language: "en", "es", or "both" (English page then Spanish page).
export function letterHtml(options = {}) {
  const langs = options.lang === "both" ? ["en", "es"] : [options.lang === "es" ? "es" : "en"];
  return langs.map((lang) => pageHtml(lang, options)).join("");
}

// Eight cut-out cards per sheet, each in both languages, with a line for the child's name.
export function cardSheetHtml({ grade }) {
  const card = `<div class="fl-card">
    <p class="fl-card-title">Math Fluency Lab · Laboratorio de Fluidez Matemática</p>
    <div class="fl-card-body">${qrBlock(grade, "en", 96)}<p>Free. No account needed. Open it, pick a grade, practise.<br><span lang="es">Gratis. No necesita cuenta. Ábralo, elija un grado y practique.</span></p></div>
    <p class="fl-card-name">Name · Nombre: ______________________</p></div>`;
  return `<article class="fl-card-sheet">${card.repeat(CARDS_PER_SHEET)}</article>`;
}
