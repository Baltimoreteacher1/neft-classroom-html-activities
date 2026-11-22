// Register Dial & Translanguaging Bridge (src/lang/register-dial.js)
// 3-notch Register Dial (Everyday <-> Classroom <-> Academic) + Cognate Glow-Up toggle + Web Speech TTS.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { html, icon, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:registerDial";

export const REGISTER_SETS = [
  {
    id: "air",
    label: "Air & Atmosphere",
    notches: [
      { level: "Everyday", en: "Cars make bad air.", es: "Los carros hacen aire malo.", cognates: [] },
      { level: "Classroom", en: "Vehicles release exhaust into the air.", es: "Los vehículos liberan gases al aire.", cognates: [["vehicles", "vehículos"]] },
      { level: "Academic", en: "Vehicular emissions contribute to atmospheric pollution.", es: "Las emisiones vehiculares contribuyen la contaminación atmosférica.", cognates: [["emissions", "emisiones"], ["contribute", "contribuyen"], ["pollution", "contaminación"]] },
    ],
  },
  {
    id: "water",
    label: "Water & Ecosystems",
    notches: [
      { level: "Everyday", en: "Dirty water hurts fish.", es: "El agua sucia daña a los peces.", cognates: [] },
      { level: "Classroom", en: "Runoff carries pollution into local rivers.", es: "El agua de lluvia lleva contaminación a los ríos.", cognates: [["pollution", "contaminación"], ["local", "local"]] },
      { level: "Academic", en: "Agricultural runoff degrades aquatic ecosystems.", es: "La escorrentía agrícola degrada los ecosistemas acuáticos.", cognates: [["agricultural", "agrícola"], ["aquatic", "acuáticos"], ["ecosystems", "ecosistemas"]] },
    ],
  },
  {
    id: "community",
    label: "Community & Evidence",
    notches: [
      { level: "Everyday", en: "People want safe parks.", es: "La gente quiere parques seguros.", cognates: [] },
      { level: "Classroom", en: "Residents ask for safer public parks.", es: "Los residentes piden parques públicos más seguros.", cognates: [["residents", "residentes"], ["public", "públicos"]] },
      { level: "Academic", en: "Community members advocate for accessible public spaces.", es: "Los miembros de la comunidad abogan por espacios públicos accesibles.", cognates: [["community", "comunidad"], ["accessible", "accesibles"], ["public", "públicos"]] },
    ],
  },
];

let setIdx = 0;
let notchIdx = Number(safeJson(storage.get(KEY), {})?.notch ?? 1);
let cognateGlow = Boolean(safeJson(storage.get(KEY), {})?.glow ?? true);

export function registerDialHTML(ctx) {
  const I = i18nFor(ctx);
  const set = REGISTER_SETS[setIdx] || REGISTER_SETS[0];
  const cur = set.notches[notchIdx] || set.notches[1];
  return html`<section class="panel no-print" style="margin:1rem 0;border:1.5px solid #17324d;" aria-labelledby="rdTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Register Dial & Translanguaging Bridge", "Selector de registro y puente bilingüe")}</p>
        <h2 id="rdTitle" style="margin:0;font-size:1.1rem;">${I.T("Shift from Everyday to Academic Language", "Cambia del lenguaje cotidiano al académico")}</h2>
      </div>
      <div style="display:flex;gap:.4rem;flex-wrap:wrap;">
        ${REGISTER_SETS.map((s, i) => html`<button type="button" class="btn small ${i === setIdx ? "btn-primary" : ""}" data-rd-topic="${i}">${s.label}</button>`)}
        <button type="button" class="btn small" data-rd-glow aria-pressed="${cognateGlow}">${I.T("Cognate Glow-Up", "Resaltar cognados")}: ${cognateGlow ? "ON" : "OFF"}</button>
      </div>
    </div>
    <div class="is-mode-tabs" role="group" aria-label="${I.S("Register level", "Nivel de registro")}" style="margin:.75rem 0;">
      ${set.notches.map((n, i) => html`<button type="button" class="btn small ${i === notchIdx ? "btn-primary" : ""}" data-rd-notch="${i}" aria-pressed="${i === notchIdx}">${n.level}</button>`)}
    </div>
    <p style="font-size:1.15rem;font-weight:700;margin:.5rem 0;" lang="en">${cur.en}</p>
    ${I.mode !== "en" ? html`<p class="fine" lang="es">${cur.es}</p>` : ""}
    ${cognateGlow && cur.cognates.length ? html`<div style="display:flex;flex-wrap:wrap;gap:.4rem;margin:.5rem 0;">
      ${cur.cognates.map(([en, es]) => html`<button type="button" class="is-std-pill" data-rd-say="${en} — ${es}">${en} ↔ ${es}</button>`)}
    </div>` : ""}
    <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
      <button type="button" class="btn small" data-rd-say="${cur.en}">${icon("volume")} ${I.T("Hear sentence", "Escuchar oración")}</button>
      <button type="button" class="btn small" data-rd-insert="${cur.en}">${I.T("Insert into My Draft", "Insertar en mi borrador")}</button> <!-- ES-REVIEW -->
    </div>
  </section>`;
}

export function onRegisterDialClick(e, ctx) {
  const tBtn = e.target.closest("[data-rd-topic]");
  if (tBtn) {
    setIdx = Number(tBtn.dataset.rdTopic) || 0;
    ctx.rerender();
    return true;
  }
  const insBtn = e.target.closest("[data-rd-insert]");
  if (insBtn) {
    const draft = document.getElementById("wrt-draft");
    if (draft) {
      draft.value = draft.value ? `${draft.value.trim()} ${insBtn.dataset.rdInsert}` : insBtn.dataset.rdInsert;
      draft.dispatchEvent(new Event("input", { bubbles: true }));
      draft.focus();
    }
    return true;
  }
  const nBtn = e.target.closest("[data-rd-notch]");
  if (nBtn) {
    notchIdx = Number(nBtn.dataset.rdNotch) || 0;
    storage.set(KEY, JSON.stringify({ notch: notchIdx, glow: cognateGlow }));
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-rd-glow]")) {
    cognateGlow = !cognateGlow;
    storage.set(KEY, JSON.stringify({ notch: notchIdx, glow: cognateGlow }));
    ctx.rerender();
    return true;
  }
  const sayBtn = e.target.closest("[data-rd-say]");
  if (sayBtn) {
    stopSpeech();
    speak(sayBtn.dataset.rdSay, { rate: 0.92 });
    return true;
  }
  return false;
}
