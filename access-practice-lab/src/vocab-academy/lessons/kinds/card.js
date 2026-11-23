// Lesson A: one word at a time. Word card, "say it" (oral first for K-2), then a quick meaning check.
import { html } from "../../../util.js";
import { mountItems } from "../item-ui.js";
import { cardHTML, isEarly, say, sayButton, speakSpanish } from "../ui.js";

export function htmlOf(S, step) {
  const { I } = S;
  const word = S.word(step.wordId);
  const d = S.stepData(step.id);
  const early = isEarly(S.unit);
  return html`<div class="val-card-step">
    ${cardHTML(S, word)}
    <section class="val-say" aria-labelledby="val-say-h">
      <h3 id="val-say-h">${early ? I.T("Say it with me", "Dilo conmigo") : I.T("Say it", "Dilo")}</h3>
      <p class="val-say-pron" lang="en">${word.pron || word.hw}</p>
      <div class="val-actions">
        ${sayButton(I, word.hw, I.T("Hear the word", "Escucha la palabra"))}
        ${sayButton(I, word.ex, I.T("Hear a sentence", "Escucha una oración"))}
        ${sayButton(I, word.def, I.T("Hear the meaning", "Escucha el significado"))}
        ${word.es?.gloss && (S.sup.glossaryEs || I.mode !== "en") ? html`<button type="button" class="btn val-btn-ghost" data-val-say-es="${word.es.gloss}"><span aria-hidden="true">🔊</span> ${I.T("Hear it in Spanish", "Escúchala en español")}</button>` : ""}
      </div>
      <p>${early
        ? I.T("Say the word three times. Then say the sentence out loud.", "Di la palabra tres veces. Luego di la oración en voz alta.")
        : I.T("Say the word out loud, then try it in a sentence of your own. Your voice is optional; thinking it counts too.", "Di la palabra en voz alta y luego pruébala en una oración tuya. Usar la voz es opcional; pensarla también cuenta.")}</p>
      <button type="button" class="btn val-toggle" data-val-said aria-pressed="${d.said ? "true" : "false"}">${d.said ? "✓ " : ""}${I.T("I said it", "Ya la dije")}</button>
    </section>
    <section class="val-check" aria-labelledby="val-check-h">
      <h3 id="val-check-h">${I.T("Quick meaning check", "Comprobación rápida del significado")}</h3>
      <div data-val-runner></div>
    </section>
  </div>`;
}

export function mount(S, step, el) {
  const word = S.word(step.wordId);
  S.markSeen(word);
  const d = S.stepData(step.id);
  S.on(el, "click", (e) => {
    const said = e.target.closest("[data-val-said]");
    if (said) {
      d.said = !d.said;
      said.setAttribute("aria-pressed", String(d.said));
      said.textContent = `${d.said ? "✓ " : ""}${S.I.S("I said it", "Ya la dije")}`;
      S.save();
    }
    const es = e.target.closest("[data-val-say-es]");
    if (es) speakSpanish(es.dataset.valSayEs).then((r) => r === "no-voice" && S.announce(S.I.S("This device has no Spanish voice. Read the Spanish on the screen.", "Este dispositivo no tiene una voz en español. Lee el español en la pantalla.")));
  });
  const saved = d.results || {};
  const run = mountItems(el.querySelector("[data-val-runner]"), {
    items: [step.check],
    I: S.I,
    audio: S.sup.audio || isEarly(S.unit),
    saved,
    onResult: (item, r) => S.evidence({ wordId: item.wordId, dim: "rec", ok: r.ok, type: "lesson-a" }),
    onResolved: (item, r) => {
      d.results = { ...(d.results || {}), [item.id]: { ok: r.ok, tries: r.tries, revealed: Boolean(r.revealed) } };
      S.markDone(step.id);
    },
  });
  S.cleanups.push(() => run.destroy());
}
export { say };
