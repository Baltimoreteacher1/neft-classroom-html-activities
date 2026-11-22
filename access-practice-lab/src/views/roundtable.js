// "3-Seat Roundtable" Academic Synthesis Simulator (mounted in Argument Arena & Scenarios)
// Original inline SVG 3-seat table (Scientist, Community Member, Student) with Two-Stage Turn Lock:
// Stage 1: Listen & Paraphrase Gate ("While [Speaker A] points out ___, [Speaker B] emphasizes ___.")
// Stage 2: Your Seat at the Table (unlocks speaking/writing turn + Whisper/Build Silently or Mic).

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { announce, html, icon, raw, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:roundtable";

let paraphraseA = "";
let paraphraseB = "";
let studentClaim = "";
let unlocked = false;
let saved = false;

export function roundtableHTML(ctx) {
  const I = i18nFor(ctx);
  const canUnlock = paraphraseA.trim().length >= 3 && paraphraseB.trim().length >= 3;

  return html`<section class="panel" style="margin:1.25rem 0;border:2px solid #17324d;" aria-labelledby="rtTitle">
    <p class="eyebrow">${I.T("3-Seat Roundtable · Academic Synthesis", "Mesa redonda de 3 asientos · Síntesis académica")}</p> <!-- ES-REVIEW -->
    <h2 id="rtTitle" style="margin:0 0 .5rem;">${I.T("Listen, Paraphrase, Then Take Your Seat", "Escucha, parafrasea y toma tu asiento")}</h2> <!-- ES-REVIEW -->

    <div style="text-align:center;margin:.75rem 0;">
      <svg viewBox="0 0 360 110" width="100%" style="max-width:440px;" role="img" aria-label="3-Seat Roundtable with Scientist, Community Member, and Student">
        <ellipse cx="180" cy="70" rx="115" ry="26" fill="#eaf4f4" stroke="#17324d" stroke-width="2.5"/>
        <circle cx="75" cy="36" r="18" fill="#075568"/><text x="75" y="40" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">Scientist</text>
        <circle cx="285" cy="36" r="18" fill="#9a4a26"/><text x="285" y="40" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">Resident</text>
        <circle cx="180" cy="30" r="20" fill="${unlocked ? "#1fa6a2" : "#f2c15b"}" stroke="#17324d" stroke-width="2"/><text x="180" y="34" text-anchor="middle" fill="#17324d" font-size="10" font-weight="700">You</text>
      </svg>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-bottom:1rem;">
      <div class="card" style="background:#f7f4ec;">
        <strong>Seat 1 · Scientist:</strong> "Rain gardens filter runoff before it reaches the river."
        <br><button type="button" class="btn small" style="margin-top:.4rem;" data-rt-say="Rain gardens filter runoff before it reaches the river.">${icon("volume")} Hear Seat 1</button>
      </div>
      <div class="card" style="background:#f7f4ec;">
        <strong>Seat 2 · Community Member:</strong> "Neighborhood sidewalks need safe walking space too."
        <br><button type="button" class="btn small" style="margin-top:.4rem;" data-rt-say="Neighborhood sidewalks need safe walking space too.">${icon("volume")} Hear Seat 2</button>
      </div>
    </div>

    <div class="panel" style="background:#fff;border:1.5px solid #075568;">
      <h3 style="margin-top:0;">${I.T("Stage 1: Listen & Paraphrase Gate", "Etapa 1: Escucha y parafrasea")}</h3> <!-- ES-REVIEW -->
      <p style="line-height:2;">
        While the Scientist points out
        <input type="text" class="is-fib-input" data-rt-a value="${paraphraseA}" placeholder="e.g., water filtration" aria-label="Scientist viewpoint" />,
        the Community Member emphasizes
        <input type="text" class="is-fib-input" data-rt-b value="${paraphraseB}" placeholder="e.g., safe sidewalks" aria-label="Community Member viewpoint" />.
      </p>
      <button type="button" class="btn btn-primary small" data-rt-unlock ${!canUnlock && !unlocked ? "" : ""}>
        ${unlocked ? I.T("Seat Unlocked ✓", "Asiento desbloqueado ✓") : I.T("Unlock My Seat at the Table", "Desbloquear mi asiento")} <!-- ES-REVIEW -->
      </button>
    </div>

    ${unlocked ? html`<div class="panel" style="margin-top:1rem;background:#eaf4f4;border:1.5px solid #1fa6a2;">
      <h3 style="margin-top:0;">${I.T("Stage 2: Your Seat at the Table", "Etapa 2: Tu asiento en la mesa")}</h3> <!-- ES-REVIEW -->
      <label for="rtClaim">${I.T("State and defend your synthesis claim:", "Expresa y defiende tu afirmación:")}</label>
      <textarea id="rtClaim" class="is-fib-input" style="width:100%;min-height:74px;margin:.5rem 0;" data-rt-claim>${studentClaim}</textarea>
      <div class="is-actions">
        <button type="button" class="btn small" data-rt-say-claim>${icon("volume")} ${I.T("Hear My Claim", "Escuchar mi afirmación")}</button>
        <button type="button" class="btn btn-primary small" data-rt-save>${icon("check")} ${I.T("Save Roundtable to Passport", "Guardar en Mi Pasaporte")}</button> <!-- ES-REVIEW -->
      </div>
      ${saved ? html`<p class="is-item-fb is-ok" role="status">${I.T("Saved 3-part Roundtable exchange!", "¡Intercambio guardado en Mi Pasaporte!")}</p>` : ""}
    </div>` : ""}
  </section>`;
}

export function onRoundtableClick(e, ctx) {
  const say = e.target.closest("[data-rt-say]");
  if (say) {
    stopSpeech();
    speak(say.dataset.rtSay, { rate: 0.92 });
    return true;
  }
  if (e.target.closest("[data-rt-unlock]")) {
    if (paraphraseA.trim().length >= 3 && paraphraseB.trim().length >= 3) {
      unlocked = true;
      announce("Your seat at the table is unlocked.");
      ctx.rerender();
    } else {
      announce("Complete both paraphrase blanks first.");
    }
    return true;
  }
  if (e.target.closest("[data-rt-say-claim]")) {
    if (studentClaim.trim()) { stopSpeech(); speak(studentClaim, { rate: 0.92 }); }
    return true;
  }
  if (e.target.closest("[data-rt-save]")) {
    const list = safeJson(storage.get(KEY), []) || [];
    list.push({ a: paraphraseA, b: paraphraseB, claim: studentClaim, at: Date.now() });
    storage.set(KEY, JSON.stringify(list.slice(-20)));
    saved = true;
    announce("Roundtable saved.");
    ctx.rerender();
    return true;
  }
  return false;
}

export function onRoundtableInput(e) {
  if (e.target.matches("[data-rt-a]")) { paraphraseA = e.target.value; return true; }
  if (e.target.matches("[data-rt-b]")) { paraphraseB = e.target.value; return true; }
  if (e.target.matches("[data-rt-claim]")) { studentClaim = e.target.value; return true; }
  return false;
}
