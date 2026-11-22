// Conversation Crossroads: interpret a partner, try a response, then compose a new one.
// Every learner decision and draft is serializable for the Studio's local save/resume.
import { audioBtn, feedbackHTML, frameBox, hintHTML, html, icon, judge, mixChoices, newRound, pips, settled, takeHint } from "./engine.js";

const say = (I, pair) => I.T(pair.en, pair.es);
const caseOf = (env, id) => env.content.cases.find((c) => c.id === id);
const active = (s) => s.rounds[s.i];
const phaseOf = (r) => !settled(r.meaningRound) ? "meaning" : !settled(r.replyRound) ? "reply" : "compose";
const choiceSet = (c, r, phase) => phase === "meaning"
  ? { rows: c.meaning, order: r.meaningOrder, answer: r.meaningAnswer, rs: r.meaningRound, ask: c.ask, skill: "interpret-partner" }
  : { rows: c.replies, order: r.replyOrder, answer: r.replyAnswer, rs: r.replyRound, ask: c.replyAsk, skill: "respond-to-partner" };
const minWords = (env) => env.band === "6-8" ? 12 : 8;
const wordCount = (text) => String(text || "").trim().split(/\s+/).filter(Boolean).length;

function choicesHTML(c, r, phase, env) {
  const I = env.I;
  const choice = choiceSet(c, r, phase);
  const picked = choice.rs.picks.at(-1);
  const pickedRow = picked === undefined ? null : choice.rows[choice.order[picked]];
  const feedback = feedbackHTML(choice.rs, {
    I,
    right: pickedRow && say(I, pickedRow.why),
    retry: pickedRow && say(I, pickedRow.why),
    answer: html`<strong>${I.T("A useful move:", "Una respuesta útil:")}</strong> ${say(I, choice.rows[0])}`,
    explain: say(I, choice.rows[0].why),
  });
  const hint = phase === "meaning"
    ? I.T("Listen for the exact idea. What did your partner actually say?", "Escucha la idea exacta. ¿Qué dijo realmente tu compañero?")
    : I.T("Use the partner's words. Which reply moves the conversation forward?", "Usa las palabras de tu compañero. ¿Qué respuesta hace avanzar la conversación?");
  return html`<section class="cc-decision" aria-labelledby="cc-prompt">
    <p class="cc-step">${phase === "meaning" ? I.T("Move 1 · Understand", "Paso 1 · Comprender") : I.T("Move 2 · Respond", "Paso 2 · Responder")}</p>
    <h3 id="cc-prompt" tabindex="-1" data-cc-focus>${say(I, choice.ask)}</h3>
    ${phase === "reply" ? html`<p class="cc-understood">${icon("check")}${say(I, c.meaning[0].why)}</p>` : ""}
    <div class="cc-choices" role="group" aria-label="${I.T("Choose a conversation move", "Elige una respuesta de conversación")}">
      ${choice.order.map((index, shown) => html`<button type="button" class="cc-choice" data-g-choice="${shown}" ${settled(choice.rs) || choice.rs.picks.includes(shown) ? "disabled" : ""}><span class="cc-choice-num">${shown + 1}</span><span>${say(I, choice.rows[index])}</span></button>`)}
    </div>
    ${!settled(choice.rs) ? hintHTML(choice.rs, [hint], env) : ""}
    ${feedback}
    ${phase === "reply" && pickedRow?.reaction ? html`<div class="cc-reaction" role="status"><strong>${I.T("Your partner replies", "Tu compañero responde")}</strong><p>“${say(I, pickedRow.reaction)}”</p></div>` : ""}
  </section>`;
}

function composeHTML(c, r, s, env) {
  const I = env.I;
  const lastPick = r.replyRound.picks.at(-1);
  const lastReply = lastPick === undefined ? null : c.replies[r.replyOrder[lastPick]];
  const frame = env.band === "6-8"
    ? "I hear your point that ___. The evidence suggests ___. Could we ___?"
    : "I hear your idea about ___. Could we ___ because ___?";
  const checks = env.band === "6-8"
    ? [["I name a specific part of my partner's idea.", "Nombro una parte concreta de la idea de mi compañero."], ["I explain a reason or ask a question that tests the evidence.", "Explico una razón o hago una pregunta que examina la evidencia."]]
    : [["I respond to what my partner said.", "Respondo a lo que dijo mi compañero."], ["I give a reason or ask a useful question.", "Doy una razón o hago una pregunta útil."]];
  const message = r.composeFeedback === "length"
    ? I.T(`Write at least ${minWords(env)} words so your reply has a clear idea.`, `Escribe al menos ${minWords(env)} palabras para expresar una idea clara.`)
    : r.composeFeedback === "checks"
      ? I.T("Read your reply and check both moves before comparing it with the model.", "Lee tu respuesta y marca los dos pasos antes de compararla con el modelo.")
      : "";
  return html`<section class="cc-compose" aria-labelledby="cc-compose-heading">
    <p class="cc-step">${I.T("Move 3 · Make it yours", "Paso 3 · Hazlo tuyo")}</p>
    <h3 id="cc-compose-heading" tabindex="-1" data-cc-focus>${I.T("Write a reply in your own words", "Escribe una respuesta con tus palabras")}</h3>
    <p>${I.T("Use a detail from your partner's idea. Ask a useful question or give a reason. You can rehearse it aloud first.", "Usa un detalle de la idea de tu compañero. Haz una pregunta útil o da una razón. Puedes ensayarla en voz alta primero.")}</p>
    ${lastReply ? html`<div class="cc-reaction"><strong>${I.T("Your partner replied to your choice", "Tu compañero respondió a tu elección")}</strong><p>“${say(I, lastReply.reaction)}”</p></div>` : ""}
    ${env.sup.frames !== "none" ? frameBox(frame, env) : r.frame ? html`<p class="gs-frame"><span class="gs-frame-l">${I.T("Optional frame", "Estructura opcional")}</span>${frame}</p>` : html`<button type="button" class="btn small" data-g-frame>${icon("help")}${I.T("Show an optional frame", "Mostrar una estructura opcional")}</button>`}
    <label class="cc-draft-label" for="cc-draft-${r.id}">${I.T("My reply", "Mi respuesta")}</label>
    <textarea id="cc-draft-${r.id}" class="cc-draft" data-cc-draft rows="4" maxlength="400" spellcheck="true">${r.draft}</textarea>
    <p class="fine">${I.T(`Aim for at least ${minWords(env)} words. Your writing saves on this device; the game does not grade it.`, `Escribe al menos ${minWords(env)} palabras. Tu texto se guarda en este dispositivo; el juego no lo califica.`)}</p>
    <div class="cc-selfcheck" role="group" aria-label="${I.T("Check your reply", "Revisa tu respuesta")}">
      <p><strong>${I.T("Check your moves", "Revisa tus pasos")}</strong></p>
      ${checks.map((check, i) => html`<button type="button" class="cc-check" data-g-check="${i}" aria-pressed="${r.checks.includes(i)}">${icon(r.checks.includes(i) ? "check" : "help")}${I.T(...check)}</button>`)}
    </div>
    ${message ? html`<p class="cc-compose-feedback" role="status">${message}</p>` : ""}
    ${r.submitted ? html`<div class="cc-outcome"><strong>${I.T("Compare with a model", "Compara con un modelo")}</strong><p>${say(I, c.replies[0])}</p><p>${say(I, c.outcome)}</p><p class="fine">${I.T("There can be other good replies. Compare the idea, the reason, and the tone with your own response.", "Puede haber otras buenas respuestas. Compara la idea, la razón y el tono con tu respuesta.")}</p></div><div class="gs-actions"><button type="button" class="btn" data-g-revise>${I.T("Revise my reply", "Revisar mi respuesta")}</button><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Finish the route", "Terminar la ruta") : I.T("Continue the route", "Seguir la ruta")}</button></div>` : html`<button type="button" class="btn btn-primary btn-big" data-g-submit>${I.T("Save and compare", "Guardar y comparar")}</button>`}
  </section>`;
}

export default {
  id: "conversation-crossroads",
  init(env) {
    const cases = [...env.content.cases];
    // Rotate through the bank so a replay begins in a different context without losing determinism.
    const offset = env.rng.int(cases.length);
    const chosen = [...cases.slice(offset), ...cases.slice(0, offset)].slice(0, env.count(cases.length, 3));
    return { i: 0, rounds: chosen.map((c) => {
      const meaning = mixChoices(c.meaning, 0, env.rng);
      const reply = mixChoices(c.replies, 0, env.rng);
      return { id: c.id, meaningOrder: meaning.choices.map((x) => c.meaning.indexOf(x)), meaningAnswer: meaning.answer, replyOrder: reply.choices.map((x) => c.replies.indexOf(x)), replyAnswer: reply.answer, meaningRound: newRound(), replyRound: newRound(), draft: "", checks: [], submitted: false, composeFeedback: "", frame: false };
    }) };
  },
  done: (s) => s.i >= s.rounds.length,
  progress(s) { return { done: s.rounds.reduce((n, r) => n + Number(settled(r.meaningRound)) + Number(settled(r.replyRound)) + Number(r.submitted), 0), total: s.rounds.length * 3 }; },
  view(s, env) {
    const I = env.I;
    const r = active(s);
    if (!r) return html`<p role="status">${I.T("You reached the end of the conversation route.", "Llegaste al final de la ruta de conversación.")}</p>`;
    const c = caseOf(env, r.id);
    const phase = phaseOf(r);
    const p = this.progress(s);
    return html`<section class="cc" data-mechanic="dialogue-branches">
      ${pips(p.done, p.total, I.S(`${p.done} of ${p.total} conversation moves finished`, `${p.done} de ${p.total} movimientos de conversación terminados`), I.S)}
      <div class="cc-map" role="img" aria-label="${I.S(`Conversation route: case ${s.i + 1} of ${s.rounds.length}`, `Ruta de conversación: caso ${s.i + 1} de ${s.rounds.length}`)}">
        ${s.rounds.map((row, n) => html`<span class="cc-stop ${n < s.i ? "is-done" : n === s.i ? "is-current" : ""}"><span aria-hidden="true">${n < s.i ? "✓" : n + 1}</span><small>${say(I, caseOf(env, row.id).place)}</small></span>`)}
      </div>
      <article class="cc-scene">
        <p class="cc-eyebrow">${icon("speaking")}${I.T(`Stop ${s.i + 1}: ${c.place.en}`, `Parada ${s.i + 1}: ${c.place.es}`)}</p>
        <h2>${I.T("A partner speaks", "Habla un compañero")}</h2>
        <div class="cc-bubble"><p lang="en">“${c.partner.en}”</p>${env.sup.gloss !== "off" ? html`<details class="cc-translation" ${env.sup.gloss === "show" ? "open" : ""}><summary>${I.T("Spanish support", "Apoyo en español")}</summary><p lang="es">${c.partner.es}</p></details>` : ""}</div>
        ${audioBtn(c.partner.en, I, I.S("Listen to the partner", "Escuchar al compañero"))}
      </article>
      ${phase === "compose" ? composeHTML(c, r, s, env) : choicesHTML(c, r, phase, env)}
    </section>`;
  },
  click(el, s, env) {
    const b = el.closest?.("button");
    const r = active(s);
    if (!b || !r) return false;
    if (b.hasAttribute("data-g-next")) { if (!r.submitted) return false; s.i += 1; return true; }
    if (b.hasAttribute("data-g-frame")) { r.frame = true; env.use("frame"); return true; }
    if (b.hasAttribute("data-g-revise")) { r.submitted = false; return true; }
    if (b.dataset.gCheck !== undefined) {
      const n = Number(b.dataset.gCheck);
      if (![0, 1].includes(n)) return false;
      r.checks = r.checks.includes(n) ? r.checks.filter((x) => x !== n) : [...r.checks, n].sort();
      r.composeFeedback = "";
      return true;
    }
    if (b.hasAttribute("data-g-submit")) {
      r.composeFeedback = wordCount(r.draft) < minWords(env) ? "length" : r.checks.length < 2 ? "checks" : "";
      if (!r.composeFeedback) r.submitted = true;
      return true;
    }
    const c = caseOf(env, r.id);
    const phase = phaseOf(r);
    if (phase === "compose") return false;
    const set = choiceSet(c, r, phase);
    if (b.hasAttribute("data-g-hint")) return takeHint(set.rs, env) >= 0;
    if (b.dataset.gChoice === undefined || settled(set.rs)) return false;
    const shown = Number(b.dataset.gChoice);
    if (!Number.isInteger(shown) || shown < 0 || shown >= set.rows.length || set.rs.picks.includes(shown)) return false;
    set.rs.picks.push(shown);
    judge(set.rs, shown === set.answer, env, { id: `${r.id}:${set.skill}`, skill: set.skill });
    return true;
  },
  input(el, s) {
    const r = active(s);
    if (!r || !el.matches?.("[data-cc-draft]")) return false;
    r.draft = String(el.value || "").slice(0, 400);
    r.composeFeedback = "";
    return "save"; // persist without re-rendering the textarea or dropping the cursor
  },
  plan(s, { wrong } = {}, env) {
    const r = active(s);
    if (!r) return [];
    if (r.submitted) return [{ click: "[data-g-next]" }];
    const c = caseOf(env, r.id);
    const phase = phaseOf(r);
    if (phase === "compose") {
      const actions = [];
      if (wordCount(r.draft) < minWords(env)) actions.push({ fill: ["[data-cc-draft]", c.replies[0].en] });
      for (const n of [0, 1]) if (!r.checks.includes(n)) actions.push({ click: `[data-g-check="${n}"]` });
      actions.push({ click: "[data-g-submit]" });
      return actions;
    }
    const set = choiceSet(c, r, phase);
    const shown = wrong ? set.order.findIndex((index, n) => n !== set.answer && !set.rs.picks.includes(n)) : set.answer;
    return [{ click: `[data-g-choice="${shown >= 0 ? shown : set.answer}"]` }];
  },
  validate(doc) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const cases = doc.bands?.[band]?.cases || [];
      if (cases.length < 6) errors.push(`${band}: need at least six cases for replay variety`);
      if (new Set(cases.map((c) => c.id)).size !== cases.length) errors.push(`${band}: duplicate case ids`);
      for (const c of cases) {
        if (!c.id || !c.partner?.en || !c.partner?.es || !c.outcome?.en || !c.outcome?.es) errors.push(`${band}: incomplete case`);
        for (const key of ["meaning", "replies"]) if (c[key]?.length !== 3 || c[key].some((x) => !x.en || !x.es || !x.why?.en || !x.why?.es || (key === "replies" && (!x.reaction?.en || !x.reaction?.es)))) errors.push(`${band}/${c.id}: ${key} needs three bilingual explained choices and reply reactions`);
      }
    }
    return errors;
  },
};
