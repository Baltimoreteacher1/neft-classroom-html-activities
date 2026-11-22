// Decodable Mini-Books for Reading Path (/reading-path/decodable[/<bookId>])
// 6-page leveled decodable readers with tap-to-hear individual words, EN/ES adult tip per page,
// inline SVG illustrations, and a 2-question comprehension check that awards a My Passport stamp.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { announce, BASE, html, icon, raw, safeJson, storage } from "../util.js";

export const DECODABLE_STAMPS_KEY = "accessPracticeLab:v1:reading-path-stamps";

export const DECODABLE_BOOKS = [
  {
    id: "sam-red-hat",
    level: "Level 1 · CVC & Short Vowels",
    title: ["Sam and the Red Hat", "Sam y el sombrero rojo"], // ES-REVIEW
    pages: [
      {
        text: "Sam has a red hat.",
        tipEn: "Point to each CVC word (Sam, red, hat) and tap to hear the short vowel.",
        tipEs: "Señala cada palabra corta y tócala para escuchar la vocal corta.", // ES-REVIEW
        svg: `<circle cx="32" cy="36" r="14" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><path d="M16 26h32l-4-12H20z" fill="#f2765a" stroke="#17324d" stroke-width="2.5"/>`,
      },
      {
        text: "The hat is on a mat.",
        tipEn: "Notice the rhyming words: hat and mat.",
        tipEs: "Nota las palabras que riman: hat y mat.", // ES-REVIEW
        svg: `<rect x="10" y="42" width="44" height="10" rx="3" fill="#1fa6a2" stroke="#17324d" stroke-width="2.5"/><path d="M22 42h20l-3-12H25z" fill="#f2765a" stroke="#17324d" stroke-width="2.5"/>`,
      },
      {
        text: "A big dog ran to the mat.",
        tipEn: "Ask: Who ran to the mat?",
        tipEs: "Pregunta: ¿Quién corrió hacia el tapete?", // ES-REVIEW
        svg: `<ellipse cx="32" cy="36" rx="16" ry="12" fill="#9a4a26" opacity="0.4" stroke="#17324d" stroke-width="2.5"/><circle cx="26" cy="34" r="2.5" fill="#17324d"/><circle cx="38" cy="34" r="2.5" fill="#17324d"/>`,
      },
      {
        text: "The dog sat on the red hat!",
        tipEn: "Read with expression on the exclamation mark.",
        tipEs: "Lee con expresión en el signo de exclamación.", // ES-REVIEW
        svg: `<rect x="12" y="44" width="40" height="8" rx="3" fill="#f2765a" stroke="#17324d" stroke-width="2.5"/><circle cx="32" cy="30" r="12" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/>`,
      },
      {
        text: "Sam did not get mad. Sam got a mop.",
        tipEn: "Contrast the vowel sounds in mad and mop.",
        tipEs: "Compara los sonidos de las vocales en mad y mop.", // ES-REVIEW
        svg: `<line x1="20" y1="14" x2="40" y2="48" stroke="#17324d" stroke-width="3"/><rect x="34" y="44" width="16" height="8" rx="3" fill="#eaf4f4" stroke="#17324d" stroke-width="2"/>`,
      },
      {
        text: "Sam and the dog nap in the sun.",
        tipEn: "Celebrate finishing the story! Try the 2-question check next.",
        tipEs: "¡Celebren terminar el cuento! Prueben las 2 preguntas ahora.", // ES-REVIEW
        svg: `<circle cx="48" cy="16" r="8" fill="#f2c15b" stroke="#17324d" stroke-width="2"/><rect x="12" y="38" width="40" height="12" rx="6" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/>`,
      },
    ],
    check: [
      { q: "What color is Sam's hat?", options: ["Red", "Blue", "Green"], answer: 0 },
      { q: "Who sat on the hat?", options: ["A cat", "A dog", "A frog"], answer: 1 },
    ],
  },
  {
    id: "frog-on-ship",
    level: "Level 2 · Digraphs & Blends",
    title: ["The Frog on the Ship", "La rana en el barco"], // ES-REVIEW
    pages: [
      { text: "A green frog hops on a big ship.", tipEn: "Blend fr in frog and sh in ship.", tipEs: "Une fr en frog y sh en ship.", svg: `<polygon points="12,40 52,40 44,52 20,52" fill="#075568"/><circle cx="32" cy="30" r="10" fill="#1fa6a2" stroke="#17324d" stroke-width="2"/>` },
      { text: "The ship goes splish, splash on the waves.", tipEn: "Hear the sh sound at the end of splish and splash.", tipEs: "Escucha el sonido sh al final de splish y splash.", svg: `<path d="M10 42q11-8 22 0t22 0" fill="none" stroke="#1fa6a2" stroke-width="3"/>` },
      { text: "Frog sits on a wooden chest.", tipEn: "Point to the ch digraph in chest.", tipEs: "Señala el dígrafo ch en chest.", svg: `<rect x="16" y="26" width="32" height="22" rx="4" fill="#9a4a26" stroke="#17324d" stroke-width="2.5"/>` },
      { text: "Clap, clap! The crew sees a thin fish.", tipEn: "Notice th in thin and sh in fish.", tipEs: "Nota th en thin y sh en fish.", svg: `<ellipse cx="30" cy="32" rx="14" ry="8" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><polygon points="44,32 54,24 54,40" fill="#f2c15b" stroke="#17324d" stroke-width="2"/>` },
      { text: "The flag flaps in the fresh wind.", tipEn: "Blend fl in flag and fr in fresh.", tipEs: "Une fl en flag y fr en fresh.", svg: `<line x1="18" y1="12" x2="18" y2="52" stroke="#17324d" stroke-width="3"/><rect x="20" y="14" width="28" height="16" fill="#f2765a" stroke="#17324d" stroke-width="2"/>` },
      { text: "The ship stops at the dock. Frog jumps off!", tipEn: "Great decoding! Check your understanding below.", tipEs: "¡Buena lectura! Revisa tu comprensión abajo.", svg: `<rect x="10" y="42" width="44" height="10" fill="#9a4a26" stroke="#17324d" stroke-width="2"/>` },
    ],
    check: [
      { q: "Where does the frog hop?", options: ["On a bus", "On a ship", "On a sled"], answer: 1 },
      { q: "What does the crew see in the water?", options: ["A thin fish", "A red truck", "A big drum"], answer: 0 },
    ],
  },
  {
    id: "boat-lake-pine",
    level: "Level 3 · Silent-e & Vowel Teams",
    title: ["A Boat Ride at Lake Pine", "Un paseo en bote en el lago Pine"], // ES-REVIEW
    pages: [
      { text: "Kate and Jake ride a boat on Lake Pine.", tipEn: "Notice silent-e in Kate, Jake, ride, Lake, Pine.", tipEs: "Nota la e muda en Kate, Jake, ride, Lake y Pine.", svg: `<polygon points="12,38 52,38 44,50 20,50" fill="#17324d"/><polygon points="32,12 32,36 46,36" fill="#eaf4f4" stroke="#17324d" stroke-width="2"/>` },
      { text: "They see a green pine tree by the shore.", tipEn: "Notice the vowel team ee in see, green, tree.", tipEs: "Nota el par de vocales ee en see, green y tree.", svg: `<rect x="28" y="38" width="8" height="14" fill="#9a4a26"/><polygon points="32,10 16,38 48,38" fill="#1fa6a2" stroke="#17324d" stroke-width="2"/>` },
      { text: "A light rain falls on the blue boat.", tipEn: "Hear the long a sound in rain (ai).", tipEs: "Escucha el sonido largo de la a en rain (ai).", svg: `<path d="M18 28a10 10 0 0 1 18-6 9 9 0 0 1 12 8H18z" fill="#eaf4f4" stroke="#17324d" stroke-width="2"/>` },
      { text: "They wait under a wide oak tree.", tipEn: "Compare ai in wait and oa in oak.", tipEs: "Compara ai en wait y oa en oak.", svg: `<circle cx="32" cy="24" r="14" fill="#1fa6a2" stroke="#17324d" stroke-width="2"/>` },
      { text: "Soon the moon glows over the lake.", tipEn: "Hear oo in soon and moon.", tipEs: "Escucha oo en soon y moon.", svg: `<path d="M38 14a16 16 0 1 0 10 26 12 12 0 0 1-10-26z" fill="#f2c15b" stroke="#17324d" stroke-width="2"/>` },
      { text: "They row home safe and glad.", tipEn: "Finish with the 2-question check to earn a Passport stamp!", tipEs: "¡Termina con las 2 preguntas para ganar un sello del Pasaporte!", // ES-REVIEW
        svg: `<polygon points="16,32 32,16 48,32 48,50 16,50" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/>` },
    ],
    check: [
      { q: "Where do Kate and Jake ride their boat?", options: ["On Lake Pine", "In the snow", "On a hill"], answer: 0 },
      { q: "What glows over the lake at night?", options: ["The sun", "The moon", "A kite"], answer: 1 },
    ],
  },
];

let pageIdx = 0;
let answers = {};
let checked = false;

export function loadDecodableStamps() {
  return safeJson(storage.get(DECODABLE_STAMPS_KEY), {}) || {};
}

export function renderDecodables(ctx) {
  const I = i18nFor(ctx);
  const bookId = ctx.route.sub;
  const book = DECODABLE_BOOKS.find((b) => b.id === bookId);
  const stamps = loadDecodableStamps();
  const baseHref = `${BASE}/reading-path/decodable`;

  if (!book) {
    return {
      title: I.S("Decodable Mini-Books", "Minilibros decodificables"),
      html: html`<article class="in-page rp-page" aria-labelledby="decTitle">
        <p><a href="${BASE}/reading-path?grades=${ctx.band}">← ${I.T("Reading Path", "Camino de lectura")}</a></p>
        <h1 id="decTitle" tabindex="-1">${I.T("Decodable Mini-Books", "Minilibros decodificables")}</h1>
        <p>${I.T("Tap any word to hear it. Finish the 2-question check at the end to earn a My Passport stamp.", "Toca cualquier palabra para escucharla. Completa las 2 preguntas al final para ganar un sello de Mi Pasaporte.")}</p> <!-- ES-REVIEW -->
        <ul style="display:grid;gap:.85rem;list-style:none;padding:0;">
          ${DECODABLE_BOOKS.map((b) => html`<li class="panel">
            <p class="eyebrow">${b.level} ${stamps[b.id] ? "· ★ Stamp earned" : ""}</p>
            <h2 style="margin:.2rem 0;"><a href="${baseHref}/${b.id}?grades=${ctx.band}">${I.T(...b.title)}</a></h2>
          </li>`)}
        </ul>
      </article>`,
    };
  }

  const p = book.pages[pageIdx] || book.pages[0];
  const isEnd = pageIdx >= book.pages.length;
  const words = p.text.split(/\s+/);
  const allCorrect = book.check.every((c, idx) => answers[idx] === c.answer);

  return {
    title: I.S(...book.title),
    html: html`<article class="in-page rp-page" aria-labelledby="decBookTitle">
      <p><a href="${baseHref}?grades=${ctx.band}">← ${I.T("All Decodable Mini-Books", "Todos los minilibros")}</a></p>
      <p class="eyebrow">${book.level}</p>
      <h1 id="decBookTitle" tabindex="-1">${I.T(...book.title)}</h1>

      ${!isEnd ? html`<section class="panel" style="margin-top:1rem;">
        <p class="fine">${I.T(`Page ${pageIdx + 1} of ${book.pages.length}`, `Página ${pageIdx + 1} de ${book.pages.length}`)}</p>
        <div style="text-align:center;margin:.75rem 0;">
          <svg viewBox="0 0 64 64" width="110" height="110" aria-hidden="true">${raw(p.svg)}</svg>
        </div>
        <p style="font-size:1.5rem;line-height:1.8;text-align:center;" lang="en">
          ${words.map((w) => html`<button type="button" class="is-hl-token" style="font-size:1.45rem;border:1px solid #d5d9e0;margin:.15rem;" data-dec-word="${w.replace(/[.,!?]/g, "")}">${w}</button> `)}
        </p>
        <div style="display:flex;justify-content:center;gap:.5rem;margin:1rem 0;">
          <button type="button" class="btn small" data-dec-read-page="${p.text}">${icon("volume")} ${I.T("Read page aloud", "Leer página en voz alta")}</button>
        </div>
        <details style="margin-top:.75rem;">
          <summary>${I.T("Adult Reading Tip (EN/ES)", "Consejo para adultos (EN/ES)")}</summary> <!-- ES-REVIEW -->
          <p class="fine" style="margin:.5rem 0 0;">${I.T(p.tipEn, p.tipEs)}</p>
        </details>
        <div class="is-actions" style="justify-content:space-between;">
          <button type="button" class="btn small" data-dec-prev ${pageIdx === 0 ? raw("disabled") : ""}>← ${I.T("Previous", "Anterior")}</button>
          <button type="button" class="btn btn-primary small" data-dec-next>${pageIdx + 1 < book.pages.length ? I.T("Next page", "Siguiente página") : I.T("Comprehension Check", "Preguntas de comprensión")} →</button>
        </div>
      </section>` : html`<section class="panel" style="margin-top:1rem;">
        <h2>${I.T("2-Question Comprehension Check", "Preguntas de comprensión")}</h2> <!-- ES-REVIEW -->
        ${book.check.map((c, qIdx) => html`<fieldset style="margin-bottom:1rem;border:1px solid #d5d9e0;border-radius:10px;padding:.75rem;">
          <legend><strong>${qIdx + 1}. ${c.q}</strong></legend>
          ${c.options.map((opt, oIdx) => html`<label style="display:flex;align-items:center;gap:.5rem;min-height:44px;cursor:pointer;">
            <input type="radio" name="dec-q-${qIdx}" value="${oIdx}" data-dec-q="${qIdx}" ${answers[qIdx] === oIdx ? raw("checked") : ""} />
            <span>${opt}</span>
          </label>`)}
        </fieldset>`)}
        ${checked ? html`<div class="feedback ${allCorrect ? "is-right" : "is-hint"}" role="status">
          <p>${allCorrect ? I.T("Awesome! You earned a My Passport stamp for this book!", "¡Excelente! ¡Ganaste un sello de Mi Pasaporte por este libro!") : I.T("Almost! Check your answers and try again.", "¡Casi! Revisa tus respuestas e inténtalo otra vez.")}</p>
        </div>` : ""}
        <div class="is-actions">
          <button type="button" class="btn small" data-dec-prev>← ${I.T("Back to book", "Volver al libro")}</button>
          <button type="button" class="btn btn-primary small" data-dec-check="${book.id}">${I.T("Check & Earn Stamp", "Revisar y ganar sello")}</button>
        </div>
      </section>`}
    </article>`,
  };
}

export async function onDecodablesClick(e, ctx) {
  const t = e.target;
  const wordBtn = t.closest("[data-dec-word]");
  if (wordBtn) {
    stopSpeech();
    await speak(wordBtn.dataset.decWord, { rate: 0.9 });
    return true;
  }
  const readBtn = t.closest("[data-dec-read-page]");
  if (readBtn) {
    stopSpeech();
    await speak(readBtn.dataset.decReadPage, { rate: 0.9 });
    return true;
  }
  if (t.closest("[data-dec-prev]")) {
    pageIdx = Math.max(0, pageIdx - 1);
    checked = false;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-dec-next]")) {
    pageIdx += 1;
    checked = false;
    ctx.rerender();
    return true;
  }
  const qInput = t.closest("[data-dec-q]");
  if (qInput) {
    answers[Number(qInput.dataset.decQ)] = Number(qInput.value);
    return false;
  }
  const chkBtn = t.closest("[data-dec-check]");
  if (chkBtn) {
    checked = true;
    const book = DECODABLE_BOOKS.find((b) => b.id === chkBtn.dataset.decCheck);
    if (book && book.check.every((c, idx) => answers[idx] === c.answer)) {
      const stamps = loadDecodableStamps();
      stamps[book.id] = { earnedAt: Date.now(), title: book.title[0] };
      storage.set(DECODABLE_STAMPS_KEY, JSON.stringify(stamps));
      announce("My Passport stamp earned!");
    }
    ctx.rerender();
    return true;
  }
  return false;
}
