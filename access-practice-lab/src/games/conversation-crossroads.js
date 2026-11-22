// Conversation Crossroads: two consequential discourse decisions per case. All state is
// serializable for the shared local save/resume controller. Choices are shuffled by its seed.
import { audioBtn, feedbackHTML, hintHTML, html, icon, judge, mixChoices, newRound, pips, settled, takeHint } from "./engine.js";

const say = (I, pair) => I.T(pair.en, pair.es);
const prompts = [
  ["Listen for the exact idea. What did the partner actually say?", "Escucha la idea exacta. ¿Qué dijo realmente tu compañero?"],
  ["Use the partner's words. Which reply moves the conversation forward?", "Usa las palabras de tu compañero. ¿Qué respuesta hace avanzar la conversación?"],
];
const caseOf = (env, id) => env.content.cases.find((c) => c.id === id);
const active = (s) => s.rounds[s.i];
const stepOf = (r) => settled(r.meaningRound) ? "reply" : "meaning";
const choiceSet = (c, r) => stepOf(r) === "meaning" ? { rows: c.meaning, order: r.meaningOrder, answer: r.meaningAnswer, rs: r.meaningRound, ask: c.ask, skill: "interpret-partner" } : { rows: c.replies, order: r.replyOrder, answer: r.replyAnswer, rs: r.replyRound, ask: c.replyAsk, skill: "respond-to-partner" };

export default {
  id: "conversation-crossroads",
  init(env) {
    const cases = [...env.content.cases];
    // Different seeds rotate the first case, while every case remains in the full route.
    const offset = env.rng.int(cases.length);
    const chosen = [...cases.slice(offset), ...cases.slice(0, offset)].slice(0, env.count(cases.length, 2));
    return { i: 0, rounds: chosen.map((c) => {
      const meaning = mixChoices(c.meaning, 0, env.rng);
      const reply = mixChoices(c.replies, 0, env.rng);
      return { id: c.id, meaningOrder: meaning.choices.map((x) => c.meaning.indexOf(x)), meaningAnswer: meaning.answer, replyOrder: reply.choices.map((x) => c.replies.indexOf(x)), replyAnswer: reply.answer, meaningRound: newRound(), replyRound: newRound() };
    }) };
  },
  done: (s) => s.i >= s.rounds.length,
  progress(s) { return { done: s.rounds.reduce((n, r) => n + Number(settled(r.meaningRound)) + Number(settled(r.replyRound)), 0), total: s.rounds.length * 2 }; },
  view(s, env) {
    const I = env.I;
    const r = active(s);
    if (!r) return html`<p role="status">${I.T("You reached the end of the conversation route.", "Llegaste al final de la ruta de conversación.")}</p>`;
    const c = caseOf(env, r.id);
    const choice = choiceSet(c, r);
    const finished = settled(r.replyRound);
    const p = this.progress(s);
    const picked = choice.rs.picks.at(-1);
    const retry = picked == null ? "" : say(I, choice.rows[choice.order[picked]].why);
    const feedback = feedbackHTML(choice.rs, { I, right: retry, retry, answer: html`<strong>${I.T("A useful move:", "Una respuesta útil:")}</strong> ${choice.rows[0].en}`, explain: say(I, choice.rows[0].why) });
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
      <section class="cc-decision" aria-labelledby="cc-prompt">
        <p class="cc-step">${stepOf(r) === "meaning" ? I.T("Move 1 · Understand", "Paso 1 · Comprender") : I.T("Move 2 · Respond", "Paso 2 · Responder")}</p>
        <h3 id="cc-prompt">${say(I, choice.ask)}</h3>
        <div class="cc-choices" role="group" aria-label="${I.T("Choose a conversation move", "Elige una respuesta de conversación")}">
          ${choice.order.map((index, shown) => html`<button type="button" class="cc-choice" data-g-choice="${shown}" ${settled(choice.rs) || choice.rs.picks.includes(shown) ? "disabled" : ""}><span class="cc-choice-num">${shown + 1}</span><span>${say(I, choice.rows[index])}</span></button>`)}
        </div>
        ${!settled(choice.rs) ? hintHTML(choice.rs, [I.T(...prompts[stepOf(r) === "meaning" ? 0 : 1])], env) : ""}
        ${feedback}
        ${stepOf(r) === "reply" && !settled(r.replyRound) ? feedbackHTML(r.meaningRound, { I, right: say(I, c.meaning[0].why) }) : ""}
        ${finished ? html`<div class="cc-outcome" role="status"><strong>${I.T("What happens next", "Qué pasa después")}</strong><p>${say(I, c.outcome)}</p><p class="fine">${I.T("Rehearse the useful reply aloud. Speaking here is practice; the game does not grade your voice.", "Ensaya en voz alta la respuesta útil. Aquí hablar es práctica; el juego no califica tu voz.")}</p></div><button type="button" class="btn btn-primary btn-big" data-g-next>${icon("arrow-right")}${s.i + 1 === s.rounds.length ? I.T("Write my own reply", "Escribir mi propia respuesta") : I.T("Continue the route", "Seguir la ruta")}</button>` : ""}
      </section>
    </section>`;
  },
  click(el, s, env) {
    const b = el.closest?.("button");
    const r = active(s);
    if (!b || !r) return false;
    if (b.hasAttribute("data-g-next")) { if (!settled(r.replyRound)) return false; s.i += 1; return true; }
    const c = caseOf(env, r.id);
    const set = choiceSet(c, r);
    if (b.hasAttribute("data-g-hint")) return takeHint(set.rs, env) >= 0;
    if (b.dataset.gChoice === undefined || settled(set.rs)) return false;
    const shown = Number(b.dataset.gChoice);
    if (!Number.isInteger(shown) || shown < 0 || shown >= set.rows.length || set.rs.picks.includes(shown)) return false;
    set.rs.picks.push(shown);
    judge(set.rs, shown === set.answer, env, { id: `${r.id}:${set.skill}`, skill: set.skill });
    return true;
  },
  plan(s, { wrong } = {}, env) {
    const r = active(s);
    if (!r) return [];
    if (settled(r.replyRound)) return [{ click: "[data-g-next]" }];
    const set = choiceSet(caseOf(env, r.id), r);
    const shown = wrong ? set.order.findIndex((index, n) => n !== set.answer && !set.rs.picks.includes(n)) : set.answer;
    return [{ click: `[data-g-choice="${shown >= 0 ? shown : set.answer}"]` }];
  },
  validate(doc) {
    const errors = [];
    for (const band of ["3-5", "6-8"]) {
      const cases = doc.bands?.[band]?.cases || [];
      if (cases.length < 3) errors.push(`${band}: need at least three cases`);
      for (const c of cases) {
        if (!c.id || !c.partner?.en || !c.partner?.es || !c.outcome?.en || !c.outcome?.es) errors.push(`${band}: incomplete case`);
        for (const key of ["meaning", "replies"]) if (c[key]?.length !== 3 || c[key].some((x) => !x.en || !x.es || !x.why?.en || !x.why?.es)) errors.push(`${band}/${c.id}: ${key} needs three bilingual explained choices`);
      }
    }
    return errors;
  },
};
