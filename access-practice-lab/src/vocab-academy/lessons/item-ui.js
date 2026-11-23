// Vocabulary Academy lessons — one question at a time with warm feedback (practice mode), plus the plain
// question list used by assessments (no feedback until the learner finishes). Self-contained: every handler is
// attached to the container it mounts into, so it works under any router and is dropped with the container.
import { announce, esc, html, raw, toHtml } from "../../util.js";
import { speak, stop } from "../../speech.js";

/** Direction line for each item type: [English, Español]. {hw} and {part} are filled from the item. */
export const ASK = {
  cloze: ["Choose the word that fits the blank.", "Elige la palabra que completa el espacio."],
  find: [
    "Two beginnings and two endings make four sentences. Choose the one sentence that is true.",
    "Dos comienzos y dos finales forman cuatro oraciones. Elige la única oración verdadera.",
  ],
  "def-to-word": [
    "Which word matches this meaning?",
    "¿Qué palabra coincide con este significado?",
  ],
  "word-to-def": ["What does this word mean?", "¿Qué significa esta palabra?"],
  fit: ["Does “{hw}” fit the way it is used here?", "¿Encaja “{hw}” como se usa aquí?"],
  synonym: ["Which word is closest in meaning?", "¿Qué palabra se parece más en significado?"],
  antonym: ["Which word means the opposite?", "¿Qué palabra significa lo contrario?"],
  "morph-part": ["What does the word part {part} mean?", "¿Qué significa la parte {part}?"],
  "morph-base": ["What does the base {part} mean?", "¿Qué significa la base {part}?"],
  passage: ["Answer using the passage.", "Responde usando la lectura."],
  group: ["Which group does this word belong in?", "¿En qué grupo va esta palabra?"],
  sense: ["Which sentence shows this meaning?", "¿Qué oración muestra este significado?"],
  analogy: ["Which pair has the same relationship?", "¿Qué par tiene la misma relación?"],
  evidence: [
    "Which sentence from the passage helps you understand this word?",
    "¿Qué oración de la lectura te ayuda a entender esta palabra?",
  ],
  order: [
    "Put the words in order. Choose them from first to last.",
    "Pon las palabras en orden. Elígelas de la primera a la última.",
  ],
};

const fill = (text, item) => text.replace("{hw}", item.hw || "").replace("{part}", item.part || "");
export const askFor = (I, item) => {
  const [en, es] = ASK[item.type] || ASK.passage;
  return I.T(fill(en, item), fill(es, item));
};
const blankify = (s) =>
  raw(esc(s).replace("___", '<span class="val-blank" role="img" aria-label="blank"></span>'));
export const stemHTML = (item) => (item.type === "cloze" ? blankify(item.stem) : item.stem);
const isOrder = (item) => item.type === "order";
const sameOrder = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

/** True when `chosen` is right. Choice items compare an index; order items compare the picked sequence. */
export const isCorrect = (item, chosen) =>
  isOrder(item) ? Array.isArray(chosen) && sameOrder(chosen, item.answer) : chosen === item.answer;

function stemBlock(I, item, { audio }) {
  const heading =
    item.type === "word-to-def" ||
    item.type === "group" ||
    item.type === "synonym" ||
    item.type === "evidence";
  const text = stemHTML(item);
  return html`<div class="val-q-stem">
    <p class="val-q-ask">${askFor(I, item)}</p>
    ${item.type === "analogy" ? html`<p class="val-q-text val-analogy">${item.stem} <span aria-hidden="true">::</span> <span class="val-blank" aria-hidden="true"></span></p>` : heading ? html`<p class="val-q-text val-q-word">${text}</p>` : html`<p class="val-q-text">${text}</p>`}
    ${audio ? html`<button type="button" class="btn val-btn-ghost" data-val-listen>${I.T("Listen", "Escuchar")}</button>` : ""}
  </div>`;
}

const choiceHTML = (item, i, st, name) => {
  const checked = st.chosen === i;
  const mark = st.shown
    ? i === item.answer && (st.ok || st.revealed)
      ? "right"
      : checked && !st.ok
        ? "wrong"
        : ""
    : "";
  return html`<label class="val-choice ${mark ? `is-${mark}` : ""}"
    ><input
      type="radio"
      name="${name}"
      value="${i}"
      ${checked ? "checked" : ""}
      ${st.locked ? "disabled" : ""}
    />
    <span class="val-choice-text">${item.choices[i]}</span>
    ${mark === "right" ? html`<span class="val-mark" aria-hidden="true">✓</span><span class="val-sr">${" "}correct</span>` : mark === "wrong" ? html`<span class="val-mark" aria-hidden="true">✗</span><span class="val-sr">${" "}not this one</span>` : ""}</label
  >`;
};

function orderPicker(I, item, st) {
  const picked = st.chosen || [];
  return html`<div class="val-order">
    <ol class="val-order-list" aria-label="${I.S("Your order", "Tu orden")}">
      ${picked.map((c, n) => html`<li>${item.choices[c]}</li>`)}${picked.length < item.choices.length ? html`<li class="val-order-gap" aria-hidden="true">…</li>` : ""}
    </ol>
    <div
      class="val-order-pool"
      role="group"
      aria-label="${I.S("Words to place", "Palabras para colocar")}"
    >
      ${item.choices.map((c, i) => html`<button type="button" class="btn val-chip" data-val-pick="${i}" aria-pressed="${picked.includes(i)}" ${picked.includes(i) || st.locked ? "disabled" : ""}>${c}</button>`)}
    </div>
    <button
      type="button"
      class="btn val-btn-ghost"
      data-val-undo
      ${picked.length && !st.locked ? "" : "disabled"}
    >
      ${I.T("Undo", "Deshacer")}
    </button>
  </div>`;
}

function feedbackHTML(I, item, st) {
  if (!st.shown)
    return html`<div class="val-feedback" role="status" aria-live="polite" tabindex="-1">
      ${st.hint ? html`<p class="val-hint"><strong>${I.T("Hint", "Pista")}:</strong> ${item.hint}</p>` : ""}${st.nudge ? html`<p>${st.nudge}</p>` : ""}
    </div>`;
  if (st.ok)
    return html`<div class="val-feedback is-right" role="status" aria-live="polite" tabindex="-1">
      <p>
        <span aria-hidden="true">✓</span> <strong>${I.T("Yes.", "Sí.")}</strong> ${item.explain}
      </p>
    </div>`;
  if (st.revealed)
    return html`<div class="val-feedback is-reveal" role="status" aria-live="polite" tabindex="-1">
      <p><strong>${I.T("Here is how it works.", "Así funciona.")}</strong> ${item.explain}</p>
      <p>
        ${I.T("We will bring this word back so you get another try later.", "Volveremos a esta palabra para que tengas otra oportunidad más tarde.")}
      </p>
    </div>`;
  return html`<div class="val-feedback is-wrong" role="status" aria-live="polite" tabindex="-1">
    <p>
      <span aria-hidden="true">↺</span>
      <strong>${I.T("Not yet. Try again.", "Todavía no. Inténtalo otra vez.")}</strong>
      ${st.hint ? html`<span class="val-hint">${item.hint}</span>` : ""}
    </p>
  </div>`;
}

/** The HTML of one practice question in state `st`. Never includes the answer or explanation before a check. */
export function itemHTML(I, item, st, { n, total, audio, name = "val-choice" } = {}) {
  const resolved = st.ok || st.revealed;
  return html`<section class="val-q" aria-labelledby="val-q-title" data-val-q="${item.id}">
    <h3 id="val-q-title" class="val-q-count" tabindex="-1">
      ${I.T("Question", "Pregunta")} ${n} ${I.T("of", "de")} ${total}
    </h3>
    ${stemBlock(I, item, { audio })}
    ${
      isOrder(item)
        ? orderPicker(I, item, st)
        : html`<fieldset class="val-choices" ${st.locked ? "disabled" : ""}>
            <legend class="val-sr">${askFor(I, item)}</legend>
            ${item.choices.map((_, i) => choiceHTML(item, i, st, name))}
          </fieldset>`
    }
    ${feedbackHTML(I, item, st)}
    <div class="val-q-actions">
      ${
        resolved
          ? html`<button type="button" class="btn btn-primary val-next" data-val-next>
              ${n < total ? I.T("Next question", "Siguiente pregunta") : I.T("See how it went", "Ver cómo te fue")}
            </button>`
          : html`<button type="button" class="btn btn-primary" data-val-check>
                ${I.T("Check", "Comprobar")}
              </button>
              <button
                type="button"
                class="btn val-btn-ghost"
                data-val-hint
                aria-expanded="${st.hint ? "true" : "false"}"
              >
                ${I.T("Hint", "Pista")}
              </button>
              ${st.tries >= 2 ? html`<button type="button" class="btn val-btn-ghost" data-val-reveal>${I.T("Show me how it works", "Muéstrame cómo funciona")}</button>` : ""}`
      }
    </div>
  </section>`;
}

const listenText = (item) =>
  [
    askFor({ T: (en) => en }, item),
    item.type === "cloze" ? item.stem.replace("___", "blank") : item.stem,
    ...(isOrder(item) ? [] : item.choices),
  ].map(String);

/**
 * Mount a one-at-a-time practice runner. Options:
 *   items, I, audio, saved {itemId:{ok,tries}} (resolved items are skipped on resume), startAt,
 *   onResult(item, {ok, tries, hinted, chosen}) once per item on its FIRST check (the evidence),
 *   onResolved(item, result) when an item is finished (right, or revealed), onDone(summary).
 * Returns { destroy }.
 */
export function mountItems(
  el,
  { items, I, audio = false, saved = {}, startAt = 0, onResult, onResolved, onDone, summaryExtra },
) {
  const state = {};
  const results = { ...saved };
  const order = items;
  let idx = Math.max(0, Math.min(startAt, order.length));
  while (idx < order.length && results[order[idx].id]) idx++;
  const get = (item) =>
    (state[item.id] ||= {
      chosen: null,
      shown: false,
      ok: false,
      tries: 0,
      hint: false,
      revealed: false,
      locked: false,
      first: null,
      nudge: "",
    });
  let finished = false;

  const summary = () => {
    const rs = order.map((it) => ({ item: it, r: results[it.id] })).filter((x) => x.r);
    const firstTry = rs.filter((x) => x.r.ok && x.r.tries <= 1).length;
    const revisit = [
      ...new Set(
        rs
          .filter((x) => !x.r.ok || x.r.tries > 1)
          .map((x) => x.item.wordId)
          .filter(Boolean),
      ),
    ];
    return { count: rs.length, firstTry, revisit, ids: rs.map((x) => x.item.id) };
  };
  const paint = (focus = "heading") => {
    if (idx >= order.length && order.length === 1) {
      const item = order[0];
      const r = results[item.id];
      const st = { ...get(item), chosen: item.answer, shown: true, ok: !r.revealed, revealed: Boolean(r.revealed), locked: true, hint: false };
      el.innerHTML = toHtml(itemHTML(I, item, st, { n: 1, total: 1, audio, name: "val-c-0" }));
      if (!finished) {
        finished = true;
        onDone?.(summary());
      }
      return;
    }
    if (idx >= order.length) {
      const s = summary();
      el.innerHTML = toHtml(
        html`<section class="val-q val-q-done" aria-labelledby="val-q-title">
          <h3 id="val-q-title" tabindex="-1">
            ${I.T("Nice work. Here is how it went.", "Buen trabajo. Así te fue.")}
          </h3>
          <p>
            ${I.T(`You answered ${s.firstTry} of ${s.count} on the first try. A first try is practice, not a grade: the words you missed come back for another turn.`, `Respondiste ${s.firstTry} de ${s.count} al primer intento. El primer intento es práctica, no una calificación: las palabras que fallaste volverán para otro turno.`)}
          </p>
          ${summaryExtra ? summaryExtra(s) : ""}
        </section>`,
      );
      el.querySelector("#val-q-title")?.focus({ preventScroll: true });
      if (!finished) {
        finished = true;
        onDone?.(s);
      }
      return;
    }
    const item = order[idx];
    el.innerHTML = toHtml(
      itemHTML(I, item, get(item), {
        n: idx + 1,
        total: order.length,
        audio,
        name: `val-c-${idx}`,
      }),
    );
    if (focus === "heading") el.querySelector("#val-q-title")?.focus({ preventScroll: true });
    else if (focus === "feedback")
      el.querySelector(".val-feedback")?.focus({ preventScroll: true });
  };
  const current = () => order[idx];
  const refresh = (focus) => paint(focus);

  const check = () => {
    const item = current();
    const st = get(item);
    if (st.locked) return;
    const empty = isOrder(item)
      ? !st.chosen || st.chosen.length < item.choices.length
      : st.chosen == null;
    if (empty) {
      st.nudge = isOrder(item)
        ? I.S("Place every word first.", "Coloca todas las palabras primero.")
        : I.S("Choose an answer first.", "Elige una respuesta primero.");
      refresh("feedback");
      announce(st.nudge, { toast: false });
      return;
    }
    st.nudge = "";
    st.tries += 1;
    const ok = isCorrect(item, st.chosen);
    if (st.first === null) {
      st.first = ok;
      onResult?.(item, { ok, tries: 1, hinted: st.hint, chosen: st.chosen });
    }
    st.shown = true;
    st.ok = ok;
    if (ok) {
      st.locked = true;
      results[item.id] = { ok: true, tries: st.tries, first: st.first };
      onResolved?.(item, results[item.id]);
      if (order.length === 1 && !finished) {
        finished = true;
        onDone?.(summary());
      }
    } else if (isOrder(item)) st.chosen = [];
    announce(
      ok ? I.S("Yes.", "Sí.") : I.S("Not yet. Try again.", "Todavía no. Inténtalo otra vez."),
      { toast: false },
    );
    refresh("feedback");
  };

  const click = (e) => {
    const t = e.target.closest?.("button");
    if (!t || !el.contains(t)) return;
    const item = current();
    if (!item) return;
    const st = get(item);
    if (t.matches("[data-val-check]")) check();
    else if (t.matches("[data-val-hint]")) {
      st.hint = !st.hint;
      st.shown = st.shown && !st.ok ? st.shown : false;
      refresh("none");
      el.querySelector("[data-val-hint]")?.focus();
    } else if (t.matches("[data-val-reveal]")) {
      st.revealed = true;
      st.locked = true;
      st.shown = true;
      results[item.id] = { ok: false, tries: st.tries, first: st.first, revealed: true };
      onResolved?.(item, results[item.id]);
      if (order.length === 1 && !finished) {
        finished = true;
        onDone?.(summary());
      }
      refresh("feedback");
    } else if (t.matches("[data-val-next]")) {
      idx += 1;
      while (idx < order.length && results[order[idx].id]) idx += 1;
      refresh("heading");
    } else if (t.matches("[data-val-pick]")) {
      st.chosen = [...(st.chosen || []), Number(t.dataset.valPick)];
      st.shown = false;
      refresh("none");
      (
        el.querySelector("[data-val-pick]:not([disabled])") || el.querySelector("[data-val-check]")
      )?.focus();
    } else if (t.matches("[data-val-undo]")) {
      st.chosen = (st.chosen || []).slice(0, -1);
      refresh("none");
      el.querySelector("[data-val-undo]")?.focus();
    } else if (t.matches("[data-val-listen]")) {
      stop();
      speak(listenText(item), { rate: 0.85 });
    }
  };
  const change = (e) => {
    const r = e.target;
    if (!r.matches?.('input[type="radio"]') || !el.contains(r)) return;
    const st = get(current());
    st.chosen = Number(r.value);
    st.shown = false;
    st.nudge = "";
    // Keep the feedback area honest: choosing a new answer clears an old "not yet".
    const fb = el.querySelector(".val-feedback");
    if (fb && !st.ok) fb.innerHTML = "";
    el.querySelectorAll(".val-choice").forEach((l) => l.classList.remove("is-wrong"));
    el.querySelectorAll(".val-mark,.val-sr").forEach((n) => n.remove());
  };
  el.addEventListener("click", click);
  el.addEventListener("change", change);
  paint();
  return {
    destroy() {
      el.removeEventListener("click", click);
      el.removeEventListener("change", change);
      stop();
    },
    index: () => idx,
  };
}

// ── assessment list (no feedback) ───────────────────────────────────────────────────────────────────────────

/** All questions of a form on one page; the answer key and explanations are never in this markup. */
export function assessListHTML(I, items, answers, { passage, audio } = {}) {
  return html`<ol class="val-assess-list">
    ${items.map(
      (item, n) =>
        html`<li class="val-assess-item" data-val-aitem="${item.id}">
          <fieldset class="val-choices">
            <legend>
              <span class="val-q-count"
                >${I.T("Question", "Pregunta")} ${n + 1} ${I.T("of", "de")} ${items.length}</span
              >
              <span class="val-q-ask">${askFor(I, item)}</span>
              <span class="val-q-text ${item.type === "word-to-def" ? "val-q-word" : ""}"
                >${stemHTML(item)}</span
              >
            </legend>
            ${item.type === "passage" && passage ? html`<p class="val-note">${I.T("The passage is above the questions.", "La lectura está arriba de las preguntas.")}</p>` : ""}
            ${item.choices.map((c, i) => html`<label class="val-choice"><input type="radio" name="val-a-${n}" value="${i}" data-val-aid="${item.id}" ${answers[item.id] === i ? "checked" : ""} /><span class="val-choice-text">${c}</span></label>`)}
          </fieldset>
          ${audio ? html`<button type="button" class="btn val-btn-ghost" data-val-listen-item="${item.id}">${I.T("Listen", "Escuchar")}</button>` : ""}
        </li>`,
    )}
  </ol>`;
}

export { listenText };
