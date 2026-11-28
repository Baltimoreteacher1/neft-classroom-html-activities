import { listenPlayerHTML } from "../components.js";
import { loadDomain } from "../content.js";
import { loadRecord, saveRecord } from "../store.js";
import { i18nFor } from "../i18n.js";
import { BASE, html } from "../util.js";
import roundsByBand from "../content/listen-for-clue.js";

function findById(node, id) {
  if (Array.isArray(node)) { for (const child of node) { const found = findById(child, id); if (found) return found; } }
  else if (node && typeof node === "object") { if (node.id === id && node.script) return node; for (const child of Object.values(node)) { const found = findById(child, id); if (found) return found; } }
  return null;
}
const stateId = (band) => `listen-for-clue:${band}`;
const readState = (record, band) => record.answers[stateId(band)] || { round: 0, misses: {}, answer: null, evidence: null };
function persist(band, level, record, state) { record.answers[stateId(band)] = state; saveRecord(band, "Listening", level, record); }

export async function render(ctx) {
  const band = ctx.band === "6-8" ? "6-8" : "3-5";
  const I = i18nFor(ctx);
  const rounds = roundsByBand[`g${band}`];
  const record = loadRecord(band, "Listening", ctx.prefs.tiers?.Listening || "A");
  const saved = readState(record, band);
  const roundIndex = Math.min(Math.max(0, Number(ctx.route.round) || saved.round || 0), rounds.length - 1);
  const spec = rounds[roundIndex];
  const all = await loadDomain(band, "Listening");
  const activity = findById(all, spec.id);
  if (!activity) return { title: "Listen for the Clue", html: html`<section class="panel"><h1>Listen for the Clue</h1><p>Passage unavailable. Return to Listening and try again.</p></section>` };
  const missed = saved.misses?.[spec.id] || 0;
  const answerPassed = saved.answer?.id === spec.id && saved.answer.value === spec.answer;
  const evidencePassed = saved.evidence?.id === spec.id;
  const prior = roundIndex > 0;
  const script = activity.script;
  return {
    title: I.S("Listen for the Clue", "Escucha la pista"),
    html: html`<section class="panel listening-clue" aria-labelledby="clue-title">
      <p><a href="${BASE}/Listening/${ctx.prefs.tiers?.Listening || "A"}">${I.T("← Listening", "← Escuchar")}</a> · ${I.T(`Round ${roundIndex + 1} of 3`, `Ronda ${roundIndex + 1} de 3`)}</p>
      <h1 id="clue-title" tabindex="-1">${I.T("Listen for the Clue", "Escucha la pista")}</h1>
      <p>${I.T("Listen, answer, then choose the exact words that prove your answer.", "Escucha, responde y elige las palabras exactas que prueban tu respuesta.")}</p>
      ${prior ? html`<p class="fine">${I.T("Fresh passage: start with less support. A clue appears if you need to revise.", "Pasaje nuevo: empieza con menos apoyo. Aparecerá una pista si necesitas corregir.")}</p>` : ""}
      ${listenPlayerHTML(`clue-${spec.id}`, script, { label: I.S("Play passage", "Reproducir pasaje"), i18n: I })}
      <details><summary>${I.T("Open transcript", "Abrir transcripción")}</summary><p>${script}</p></details>
      <fieldset><legend>${spec.question}</legend>${spec.options.map((option, i) => html`<button type="button" class="btn" data-clue-answer="${i}" aria-pressed="${saved.answer?.id === spec.id && saved.answer.value === i}">${option}</button> `)}</fieldset>
      <p data-clue-answer-status role="status" aria-live="polite">${answerPassed ? I.T("Answer saved. Now select the supporting words.", "Respuesta guardada. Ahora selecciona las palabras que la apoyan.") : ""}</p>
      ${missed > 0 && !answerPassed ? html`<aside class="panel"><p>${spec.cue}</p><button type="button" class="btn" data-say="${spec.focus}">${I.T("Replay the clue", "Volver a escuchar la pista")}</button></aside>` : ""}
      ${answerPassed ? html`<fieldset><legend>${I.T("Which words support your answer?", "¿Qué palabras apoyan tu respuesta?")}</legend>${spec.evidence.map((phrase, i) => html`<button type="button" class="btn" data-clue-evidence="${i}" aria-pressed="${saved.evidence?.id === spec.id && saved.evidence.value === i}">${phrase}</button> `)}</fieldset><p data-clue-evidence-status role="status" aria-live="polite">${evidencePassed ? I.T("That detail supports the answer.", "Ese detalle apoya la respuesta.") : ""}</p>${missed > 0 ? html`<details open><summary>${I.T("Optional sentence frame", "Marco de oración opcional")}</summary><label>${I.T("The answer is ___ because the passage says ___.", "La respuesta es ___ porque el pasaje dice ___.")}<textarea rows="2" data-clue-frame>${saved.frame || ""}</textarea></label></details>` : ""}` : ""}
      ${evidencePassed ? html`<a class="btn btn-primary" href="${roundIndex < 2 ? `${BASE}/listen-for-clue?round=${roundIndex + 1}` : `${BASE}/Listening/${ctx.prefs.tiers?.Listening || "A"}`}" data-clue-next>${roundIndex < 2 ? I.T("Next fresh passage", "Siguiente pasaje nuevo") : I.T("Return to Listening", "Volver a Escuchar")}</a>` : ""}
    </section>`,
  };
}

export function onClick(e, ctx) {
  const answer = e.target.closest("[data-clue-answer]"), evidence = e.target.closest("[data-clue-evidence]");
  if (!answer && !evidence) return false;
  const band = ctx.band === "6-8" ? "6-8" : "3-5", level = ctx.prefs.tiers?.Listening || "A";
  const record = loadRecord(band, "Listening", level), state = readState(record, band), rounds = roundsByBand[`g${band}`];
  const roundIndex = Math.min(Math.max(0, Number(ctx.route.round) || state.round || 0), rounds.length - 1), spec = rounds[roundIndex];
  if (answer) {
    const value = Number(answer.dataset.clueAnswer);
    state.answer = { id: spec.id, value };
    if (value !== spec.answer) { state.misses[spec.id] = (state.misses[spec.id] || 0) + 1; state.answer = null; state.evidence = null; persist(band, level, record, state); document.querySelector("[data-clue-answer-status]").textContent = "Not quite. Listen again for the detail that separates these choices, then revise."; const cue = document.querySelector(".clue-cue"); if (!cue) { const aside = document.createElement("aside"); aside.className = "panel clue-cue"; aside.innerHTML = `<p>${spec.cue}</p><button type="button" class="btn" data-say="${spec.focus.replaceAll('"','&quot;')}">Replay the clue</button>`; document.querySelector("[data-clue-answer-status]").after(aside); } }
    else { persist(band, level, record, state); document.querySelector("[data-clue-answer-status]").textContent = "Correct. Now select the exact words that support your answer."; location.reload(); }
  } else {
    const value = Number(evidence.dataset.clueEvidence);
    if (value === spec.evidenceAnswer) { state.evidence = { id: spec.id, value }; state.round = Math.min(roundIndex + 1, 2); persist(band, level, record, state); location.reload(); }
    else { state.misses[spec.id] = (state.misses[spec.id] || 0) + 1; persist(band, level, record, state); document.querySelector("[data-clue-evidence-status]").textContent = "That detail is related, but it does not prove the answer. Try again."; }
  }
  return true;
}
export function onInput(e, ctx) {
  if (!e.target.matches("[data-clue-frame]")) return;
  const band = ctx.band === "6-8" ? "6-8" : "3-5", level = ctx.prefs.tiers?.Listening || "A", record = loadRecord(band, "Listening", level), state = readState(record, band);
  state.frame = e.target.value; persist(band, level, record, state);
}
