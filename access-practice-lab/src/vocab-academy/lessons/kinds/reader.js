// Lesson C reader: readable measure, read-aloud paragraph by paragraph with highlight, tappable target words that open
// a mini word card, and a listen-first layout for K-2 (passage.listenOnly).
import { html } from "../../../util.js";
import { speak, stop } from "../../../speech.js";
import { miniCardHTML, passageHTML, sayButton } from "../ui.js";

export function htmlOf(S) {
  const { I, unit } = S;
  const p = unit.passage;
  const listenFirst = Boolean(p.listenOnly);
  const body = html`<div class="val-passage ${listenFirst ? "is-large" : ""}" data-val-passage>${passageHTML(unit)}</div>`;
  return html`<div class="val-reader">
    <header class="val-reader-head"><h3 lang="en">${p.title}</h3><p class="val-genre">${p.genre}</p></header>
    <div class="val-actions val-readbar" role="group" aria-label="${I.S("Read aloud", "Lectura en voz alta")}">
      <button type="button" class="btn btn-primary" data-val-read-all><span aria-hidden="true">🔊</span> ${I.T("Listen to the passage", "Escuchar la lectura")}</button>
      <button type="button" class="btn" data-val-read-stop>${I.T("Stop", "Detener")}</button>
    </div>
    <p class="val-note">${listenFirst
      ? I.T("Listen first. The words are underneath if you want them.", "Escucha primero. Las palabras están abajo si las quieres.")
      : I.T("Words from this lesson are buttons. Tap one to see its card. You can listen to one paragraph at a time.", "Las palabras de esta lección son botones. Toca una para ver su tarjeta. Puedes escuchar un párrafo a la vez.")}</p>
    ${listenFirst ? html`<details class="val-passage-ref"><summary>${I.T("Show the words (optional)", "Mostrar las palabras (opcional)")}</summary>${body}</details>` : body}
    <div data-val-mini-host aria-live="polite"></div>
    <div class="val-actions">${p.paras.map((_, i) => html`<button type="button" class="btn val-btn-ghost" data-val-read-para="${i}">${I.T("Listen to paragraph", "Escuchar el párrafo")} ${i + 1}</button>`)}</div>
    <p><button type="button" class="btn btn-primary val-done-btn" data-val-read-done aria-pressed="${S.isDone("c-read") ? "true" : "false"}">${S.isDone("c-read") ? "✓ " : ""}${I.T("I finished reading", "Terminé de leer")}</button></p>
  </div>`;
}

export function mount(S, step, el) {
  const paras = S.unit.passage.paras;
  const lit = (i) => {
    el.querySelectorAll("[data-val-para]").forEach((p) => p.classList.toggle("is-reading", Number(p.dataset.valPara) === i));
  };
  const host = el.querySelector("[data-val-mini-host]");
  let opener = null;
  const closeMini = () => {
    host.innerHTML = "";
    opener?.focus();
  };
  S.on(el, "click", (e) => {
    const t = e.target;
    if (t.closest("[data-val-read-all]")) {
      stop();
      speak(paras, { rate: 0.85, onSegment: (i) => lit(i) }).then(() => lit(-1));
    } else if (t.closest("[data-val-read-para]")) {
      const i = Number(t.closest("[data-val-read-para]").dataset.valReadPara);
      stop();
      lit(i);
      speak(paras[i], { rate: 0.85 }).then(() => lit(-1));
    } else if (t.closest("[data-val-read-stop]")) {
      stop();
      lit(-1);
    } else if (t.closest("[data-val-word]")) {
      opener = t.closest("[data-val-word]");
      const word = S.word(opener.dataset.valWord);
      if (!word) return;
      host.innerHTML = String(miniCardHTML(S.I, word).toString?.() ?? "");
      host.firstElementChild?.querySelector("#val-mini-title")?.focus({ preventScroll: true });
      const d = S.stepData(step.id);
      d.looked = [...new Set([...(d.looked || []), word.id])];
      S.save();
    } else if (t.closest("[data-val-mini-close]")) closeMini();
    else if (t.closest("[data-val-read-done]")) {
      const btn = t.closest("[data-val-read-done]");
      S.markDone(step.id);
      btn.setAttribute("aria-pressed", "true");
      btn.textContent = `✓ ${S.I.S("I finished reading", "Terminé de leer")}`;
      S.announce(S.I.S("Saved. You can go on to the questions.", "Guardado. Puedes pasar a las preguntas."));
    }
  });
  S.on(el, "keydown", (e) => {
    if (e.key === "Escape" && host.firstElementChild) {
      e.stopPropagation();
      closeMini();
    }
  });
  S.cleanups.push(() => stop());
}
export { sayButton };
