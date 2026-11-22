// Visual Communication & Bilingual Word Mats (mounted in /communication and /communication/board)
// AAC-inspired inline SVG symbol board + Type-and-Speak Strip + Printable Bilingual Desk Word Mats.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { announce, html, icon, raw } from "../util.js";

const CATEGORIES = [
  {
    id: "needs",
    label: ["Classroom Needs", "Necesidades del salón"], // ES-REVIEW
    items: [
      { en: "I need help, please.", es: "Necesito ayuda, por favor.", svg: `<circle cx="32" cy="32" r="18" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><text x="32" y="38" text-anchor="middle" font-size="22" font-weight="700" fill="#17324d">?</text>` },
      { en: "Please repeat that.", es: "Por favor, repita eso.", svg: `<path d="M20 32a12 12 0 1 1 4 9" fill="none" stroke="#1fa6a2" stroke-width="3"/><polygon points="16,38 24,38 20,46" fill="#17324d"/>` },
      { en: "May I go to the restroom?", es: "¿Puedo ir al baño?", svg: `<rect x="20" y="14" width="24" height="36" rx="4" fill="#f7f4ec" stroke="#17324d" stroke-width="2.5"/><circle cx="39" cy="32" r="2.5" fill="#17324d"/>` },
      { en: "I need a pencil.", es: "Necesito un lápiz.", svg: `<path d="M18 46l4-12L42 14l8 8-20 20z" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/>` },
    ],
  },
  {
    id: "feelings",
    label: ["Feelings", "Sentimientos"], // ES-REVIEW
    items: [
      { en: "I feel ready.", es: "Me siento listo.", svg: `<circle cx="32" cy="32" r="18" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/><circle cx="26" cy="28" r="2.5" fill="#17324d"/><circle cx="38" cy="28" r="2.5" fill="#17324d"/><path d="M24 37q8 6 16 0" fill="none" stroke="#17324d" stroke-width="2.5"/>` },
      { en: "I feel confused.", es: "Me siento confundido.", svg: `<circle cx="32" cy="32" r="18" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><circle cx="26" cy="28" r="2.5" fill="#17324d"/><circle cx="38" cy="28" r="2.5" fill="#17324d"/><path d="M24 40q4-4 8 0t8 0" fill="none" stroke="#17324d" stroke-width="2.5"/>` },
      { en: "I feel proud.", es: "Me siento orgulloso.", svg: `<polygon points="32,12 37,24 50,25 40,34 43,47 32,40 21,47 24,34 14,25 27,24" fill="#f2c15b" stroke="#17324d" stroke-width="2.5"/>` },
      { en: "I need a quiet minute.", es: "Necesito un minuto tranquilo.", svg: `<circle cx="32" cy="32" r="18" fill="#eaf4f4" stroke="#075568" stroke-width="2.5"/><path d="M24 36h16" stroke="#17324d" stroke-width="2.5" stroke-linecap="round"/>` },
    ],
  },
  {
    id: "talk",
    label: ["Academic Talk Moves", "Movimientos académicos"], // ES-REVIEW
    items: [
      { en: "I agree with ___ because", es: "Estoy de acuerdo con ___ porque", svg: `<path d="M16 34l10 10 22-22" fill="none" stroke="#1fa6a2" stroke-width="4" stroke-linecap="round"/>` },
      { en: "I respectfully disagree because", es: "Respetuosamente no estoy de acuerdo porque", svg: `<rect x="14" y="18" width="36" height="28" rx="8" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><path d="M24 32h16" stroke="#17324d" stroke-width="2.5"/>` },
      { en: "Can you show your evidence?", es: "¿Puedes mostrar tu evidencia?", svg: `<circle cx="28" cy="28" r="12" fill="none" stroke="#17324d" stroke-width="2.5"/><line x1="37" y1="37" x2="48" y2="48" stroke="#17324d" stroke-width="3.5" stroke-linecap="round"/>` },
      { en: "To build on that idea,", es: "Para ampliar esa idea,", svg: `<rect x="16" y="36" width="32" height="12" rx="3" fill="#1fa6a2" stroke="#17324d" stroke-width="2"/><rect x="22" y="20" width="20" height="12" rx="3" fill="#f2c15b" stroke="#17324d" stroke-width="2"/>` },
    ],
  },
  {
    id: "stem",
    label: ["Science & Math", "Ciencias y matemáticas"], // ES-REVIEW
    items: [
      { en: "The data shows that", es: "Los datos muestran que", svg: `<rect x="16" y="34" width="8" height="14" fill="#075568"/><rect x="28" y="24" width="8" height="24" fill="#1fa6a2"/><rect x="40" y="16" width="8" height="32" fill="#f2c15b"/>` },
      { en: "First, I observed", es: "Primero, observé", svg: `<ellipse cx="32" cy="32" rx="18" ry="11" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/><circle cx="32" cy="32" r="5" fill="#17324d"/>` },
      { en: "As a result,", es: "Como resultado,", svg: `<path d="M14 32h32M38 22l10 10-10 10" fill="none" stroke="#17324d" stroke-width="3" stroke-linecap="round"/>` },
      { en: "Both strategies are equal.", es: "Ambas estrategias son iguales.", svg: `<path d="M18 26h28M18 38h28" stroke="#17324d" stroke-width="3.5" stroke-linecap="round"/>` },
    ],
  },
];

let activeCat = "needs";
let stripText = "";
let showMats = false;

export function renderCommunicationBoard(ctx) {
  const I = i18nFor(ctx);
  const cat = CATEGORIES.find((c) => c.id === activeCat) || CATEGORIES[0];

  return html`<section class="panel" style="margin-bottom:1.5rem;" aria-labelledby="cbTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Visual Symbol & Sentence Board", "Tablero visual de símbolos y oraciones")}</p> <!-- ES-REVIEW -->
        <h2 id="cbTitle" style="margin:0;">${I.T("Tap a Symbol to Speak or Build a Phrase", "Toca un símbolo para hablar o formar una frase")}</h2> <!-- ES-REVIEW -->
      </div>
      <div class="no-print" style="display:flex;gap:.5rem;">
        <button type="button" class="btn small" data-cb-mats aria-expanded="${showMats}">${I.T("Bilingual Desk Word Mats", "Manteles de palabras bilingües")}</button> <!-- ES-REVIEW -->
        <button type="button" class="btn small" data-cb-print>${icon("print")} ${I.T("Print Mats", "Imprimir manteles")}</button>
      </div>
    </div>

    <div class="is-mode-tabs no-print" role="tablist" aria-label="${I.S("Symbol categories", "Categorías de símbolos")}" style="margin:1rem 0;">
      ${CATEGORIES.map((c) => html`<button type="button" role="tab" class="btn small ${c.id === activeCat ? "btn-primary" : ""}" aria-selected="${c.id === activeCat}" data-cb-cat="${c.id}">${I.T(...c.label)}</button>`)}
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:.75rem;">
      ${cat.items.map((it) => html`<button type="button" class="card" style="text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:.4rem;min-height:110px;" data-cb-say="${it.en}">
        <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">${raw(it.svg)}</svg>
        <strong style="color:#17324d;">${it.en}</strong>
        ${I.mode !== "en" ? html`<span class="fine" style="color:#075568;">${it.es}</span>` : ""}
      </button>`)}
    </div>

    <div class="panel no-print" style="margin-top:1rem;background:var(--bg,#f7f4ec);">
      <label for="cbStrip"><strong>${I.T("Type-and-Speak Strip", "Tira para escribir y hablar")}</strong></label> <!-- ES-REVIEW -->
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.5rem;">
        <input id="cbStrip" type="text" class="is-fib-input" style="flex:1;min-width:220px;" value="${stripText}" placeholder="${I.S("Tap symbols above or type here…", "Toca símbolos arriba o escribe aquí…")}" />
        <button type="button" class="btn btn-primary small" data-cb-play-strip>${icon("volume")} ${I.T("Play Aloud", "Reproducir")}</button>
        <button type="button" class="btn small" data-cb-clear-strip>${I.T("Clear", "Limpiar")}</button>
      </div>
    </div>

    ${showMats ? html`<div class="panel" style="margin-top:1rem;border:2px solid #075568;">
      <h3>${I.T("Printable Bilingual Desk Word Mat", "Mantel bilingüe imprimible para el pupitre")}</h3> <!-- ES-REVIEW -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;">
        <div class="card"><strong>SVO Sentence Frames</strong><br>Subject + Verb + Object<br><em>I noticed ___ because ___.</em><br><em>Noté ___ porque ___.</em></div>
        <div class="card"><strong>Transition Words / Conectores</strong><br>First (Primero) · However (Sin embargo) · Because (Porque) · As a result (Como resultado)</div>
        <div class="card"><strong>Spanish Cognates / Cognados</strong><br>evidence → evidencia · compare → comparar · explain → explicar · observe → observar</div>
      </div>
    </div>` : ""}
  </section>`;
}

export function onCommunicationBoardClick(e, ctx) {
  const t = e.target;
  const catBtn = t.closest("[data-cb-cat]");
  if (catBtn) {
    activeCat = catBtn.dataset.cbCat;
    ctx.rerender();
    return true;
  }
  const sayBtn = t.closest("[data-cb-say]");
  if (sayBtn) {
    const phrase = sayBtn.dataset.cbSay;
    stripText = stripText ? `${stripText} ${phrase}` : phrase;
    stopSpeech();
    speak(phrase, { rate: 0.92 });
    const inp = document.getElementById("cbStrip");
    if (inp) inp.value = stripText;
    return true;
  }
  if (t.closest("[data-cb-play-strip]")) {
    const val = document.getElementById("cbStrip")?.value || stripText;
    if (val.trim()) {
      stopSpeech();
      speak(val.trim(), { rate: 0.92 });
    }
    return true;
  }
  if (t.closest("[data-cb-clear-strip]")) {
    stripText = "";
    const inp = document.getElementById("cbStrip");
    if (inp) inp.value = "";
    announce("Cleared.");
    return true;
  }
  if (t.closest("[data-cb-mats]")) {
    showMats = !showMats;
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-cb-print]")) {
    showMats = true;
    ctx.rerender();
    setTimeout(() => window.print(), 80);
    return true;
  }
  return false;
}
