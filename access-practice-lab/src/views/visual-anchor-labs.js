// Dignity-First Visual Anchor Labs for Grades 4-8 Newcomers (mounted in /packs/survival-vocabulary)
// 4 editorial-grade inline SVG schematic labs: School & Transit Navigator, Science Lab Blueprint,
// Teen Newsroom & Media Desk, Music & Sports Morpheme Mixer.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { html, icon, raw } from "../util.js";

const LABS = [
  {
    id: "transit",
    title: ["1. School & Transit Navigator", "1. Navegador escolar y de transporte"], // ES-REVIEW
    svg: `<rect x="10" y="16" width="240" height="88" rx="10" fill="#eaf4f4" stroke="#17324d" stroke-width="2"/>
      <rect x="24" y="28" width="60" height="28" rx="4" fill="#17324d"/><text x="54" y="46" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">BUS 42</text>
      <path d="M96 42h128" stroke="#1fa6a2" stroke-width="3" stroke-dasharray="6 4"/>
      <circle cx="145" cy="42" r="7" fill="#f2c15b" stroke="#17324d" stroke-width="2"/><text x="145" y="68" text-anchor="middle" fill="#17324d" font-size="10" font-weight="700">Room 204</text>
      <circle cx="220" cy="42" r="7" fill="#f2765a" stroke="#17324d" stroke-width="2"/><text x="220" y="68" text-anchor="middle" fill="#17324d" font-size="10" font-weight="700">Media Center</text>`,
    terms: [
      { en: "Schedule", es: "Horario" },
      { en: "Transfer Stop", es: "Parada de transbordo" },
      { en: "Hallway Locker", es: "Casillero del pasillo" },
    ],
  },
  {
    id: "science",
    title: ["2. Science Lab & Equipment Blueprint", "2. Plano de laboratorio de ciencias"], // ES-REVIEW
    svg: `<rect x="10" y="16" width="240" height="88" rx="10" fill="#f7f4ec" stroke="#17324d" stroke-width="2"/>
      <path d="M44 28h28v16l10 26H34l10-26z" fill="#eaf4f4" stroke="#075568" stroke-width="2.5"/>
      <rect x="115" y="28" width="32" height="42" rx="4" fill="#1fa6a2" opacity="0.3" stroke="#17324d" stroke-width="2"/>
      <text x="58" y="88" text-anchor="middle" fill="#17324d" font-size="10" font-weight="700">Flask</text>
      <text x="131" y="88" text-anchor="middle" fill="#17324d" font-size="10" font-weight="700">Beaker</text>
      <text x="200" y="52" text-anchor="middle" fill="#9a4a26" font-size="11" font-weight="700">Safety Goggles</text>`,
    terms: [
      { en: "Graduated Cylinder", es: "Probeta graduada" },
      { en: "Hypothesis", es: "Hipótesis" },
      { en: "Cause & Effect", es: "Causa y efecto" },
    ],
  },
  {
    id: "newsroom",
    title: ["3. Teen Newsroom & Media Desk", "3. Redacción juvenil y medios"], // ES-REVIEW
    svg: `<rect x="10" y="16" width="240" height="88" rx="10" fill="#fff" stroke="#17324d" stroke-width="2"/>
      <rect x="22" y="26" width="216" height="20" rx="3" fill="#17324d"/><text x="130" y="40" text-anchor="middle" fill="#f2c15b" font-size="11" font-weight="700">HEADLINE: WHO · WHAT · WHY</text>
      <rect x="22" y="54" width="100" height="38" rx="4" fill="#eaf4f4" stroke="#1fa6a2" stroke-width="1.5"/>
      <rect x="132" y="54" width="106" height="38" rx="4" fill="#f7f4ec" stroke="#17324d" stroke-width="1.5"/>`,
    terms: [
      { en: "Primary Source", es: "Fuente primaria" },
      { en: "Headline", es: "Titular" },
      { en: "Fact vs. Opinion", es: "Hecho vs. opinión" },
    ],
  },
  {
    id: "morpheme",
    title: ["4. Music & Sports Morpheme Mixer", "4. Mezclador de morfemas: música y deportes"], // ES-REVIEW
    svg: `<rect x="10" y="16" width="240" height="88" rx="10" fill="#eaf4f4" stroke="#17324d" stroke-width="2"/>
      <rect x="22" y="38" width="58" height="30" rx="6" fill="#17324d"/><text x="51" y="57" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">re-</text>
      <rect x="92" y="38" width="68" height="30" rx="6" fill="#1fa6a2"/><text x="126" y="57" text-anchor="middle" fill="#fff" font-size="11" font-weight="700">play</text>
      <rect x="172" y="38" width="62" height="30" rx="6" fill="#f2c15b"/><text x="203" y="57" text-anchor="middle" fill="#17324d" font-size="11" font-weight="700">-able</text>`,
    terms: [
      { en: "Replay", es: "Repetir / volver a jugar" },
      { en: "Teamwork", es: "Trabajo en equipo" },
      { en: "Rhythm", es: "Ritmo" },
    ],
  },
];

let activeLab = "transit";

export function visualAnchorLabsHTML(ctx) {
  const I = i18nFor(ctx);
  const lab = LABS.find((l) => l.id === activeLab) || LABS[0];
  return html`<section class="panel" style="margin:1.25rem 0;border:1.5px solid #17324d;" aria-labelledby="valTitle">
    <p class="eyebrow">${I.T("Grades 4–8 Newcomer Visual Anchor Labs", "Laboratorios visuales para recién llegados (4–8)")}</p> <!-- ES-REVIEW -->
    <h2 id="valTitle" style="margin:0 0 .75rem;">${I.T("Real-World Academic Schematics", "Esquemas académicos del mundo real")}</h2> <!-- ES-REVIEW -->
    <div class="is-mode-tabs" role="tablist" aria-label="${I.S("Visual Anchor Labs", "Laboratorios visuales")}" style="margin-bottom:1rem;">
      ${LABS.map((l) => html`<button type="button" role="tab" class="btn small ${l.id === activeLab ? "btn-primary" : ""}" aria-selected="${l.id === activeLab}" data-val-tab="${l.id}">${I.T(...l.title)}</button>`)}
    </div>
    <div style="text-align:center;margin:.75rem 0;">
      <svg viewBox="0 0 260 120" width="100%" style="max-width:460px;" role="img" aria-label="${I.S(...lab.title)}">${raw(lab.svg)}</svg>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:.6rem;justify-content:center;">
      ${lab.terms.map((t) => html`<button type="button" class="btn small" data-val-say="${t.en}">${icon("volume")} <strong>${t.en}</strong>${I.mode !== "en" ? ` · ${t.es}` : ""}</button>`)}
    </div>
  </section>`;
}

export function onVisualAnchorClick(e, ctx) {
  const tab = e.target.closest("[data-val-tab]");
  if (tab) {
    activeLab = tab.dataset.valTab;
    ctx.rerender();
    return true;
  }
  const say = e.target.closest("[data-val-say]");
  if (say) {
    stopSpeech();
    speak(say.dataset.valSay, { rate: 0.9 });
    return true;
  }
  return false;
}
