// Word Lab depth views: the "Go deeper" panel on a word card, and the Word Garden review for every step of the path
// (recognize, understand, apply, transfer), including an optional mixed review. Logic is in lang/wordlab-depth.js.
// Everything is untimed. A review done with help open never grows the word, and optional mixed practice never moves the schedule.
import { dueWords, reviewWord } from "../lang/wordlab.js";
import {
  STAGE_INFO,
  WORD_STAGES,
  checkUse,
  depthOf,
  depthTask,
  mixedSet,
  practiceWord,
  starters,
  wordStage,
} from "../lang/wordlab-depth.js";
import { announce, html, icon } from "../util.js";
import { levelOf, speakBtn } from "./studio-kit.js";
import { WORDS, gloss, showEs, wlEvidence, wlSave } from "./wordlab-common.js";

const byId = (id) => WORDS.find((w) => w.id === id);

const stageChip = (I, stage) =>
  html`<span class="wl-stage-chip"
    >${I.T(STAGE_INFO[stage][0], STAGE_INFO[stage][1])}
    <small
      >${I.T(`Step ${WORD_STAGES.indexOf(stage) + 1} of 4`, `Paso ${WORD_STAGES.indexOf(stage) + 1} de 4`)}</small
    ></span
  >`;

function promptFor(I, word, q) {
  if (q.kind === "meaning")
    return I.T(`What does “${word.w}” mean?`, `¿Qué significa «${word.w}»?`);
  if (q.kind === "spanish")
    return I.T(
      `Which Spanish word matches “${word.w}”?`,
      `¿Qué palabra en español corresponde a «${word.w}»?`,
    );
  if (q.kind === "sentence")
    return I.T("Which word fits the blank?", "¿Qué palabra encaja en el espacio?");
  if (q.kind === "collocation")
    return I.T("Which word completes the phrase?", "¿Qué palabra completa la frase?");
  if (q.kind === "relation")
    return q.rel === "syn"
      ? I.T(
          `Which word means almost the same as “${word.w}”?`,
          `¿Qué palabra significa casi lo mismo que «${word.w}»?`,
        )
      : I.T(
          `Which word means the opposite of “${word.w}”?`,
          `¿Qué palabra significa lo contrario de «${word.w}»?`,
        );
  if (q.kind === "sense")
    return I.T(
      `In which sentence does “${word.w}” mean: ${q.other}?`,
      `¿En qué oración «${word.w}» significa: ${q.other}?`,
    );
  if (q.kind === "use")
    return I.T(
      `Write one sentence of your own with “${word.w}”.`,
      `Escribe una oración propia con «${word.w}».`,
    );
  return I.T(`Use “${word.w}” in a new place.`, `Usa «${word.w}» en otro lugar.`);
}

function teach(I, word, q, ok) {
  const d = depthOf(word);
  if (q.kind === "meaning" || q.kind === "spanish" || q.kind === "sentence")
    return ok
      ? ""
      : I.T(`Not this time. “${word.w}”: ${word.d}`, `Esta vez no. «${word.w}»: ${word.de}`);
  if (q.kind === "collocation")
    return ok
      ? I.T(
          `Yes: “${q.blank.replace("_____", q.answer)}”. Words travel in groups. Say the phrase aloud once.`,
          `Sí: «${q.blank.replace("_____", q.answer)}». Las palabras viajan en grupos. Di la frase en voz alta una vez.`,
        )
      : I.T(
          `The phrase is “${q.blank.replace("_____", q.answer)}”. The other words do not usually go with that phrase. Meaning: ${word.d}`,
          `La frase es «${q.blank.replace("_____", q.answer)}». Las otras palabras no suelen ir con esa frase. Significado: ${word.de}`,
        );
  if (q.kind === "relation")
    return I.T(
      `${q.rel === "syn" ? "Close in meaning, but not the same" : "Opposites"}: “${word.w}” means ${word.d}. Check which word fits your sentence before you swap them. Example: ${word.x}`,
      `${q.rel === "syn" ? "Parecidas, pero no iguales" : "Opuestas"}: «${word.w}» significa ${word.de}. Revisa cuál encaja en tu oración antes de cambiarlas. Ejemplo: ${word.xe}`,
    );
  if (q.kind === "sense")
    return ok
      ? I.T(
          `Yes. Here “${word.w}” means ${q.other}. In this lab its main meaning is: ${word.d}`,
          `Sí. Aquí «${word.w}» significa ${q.other}. En este laboratorio su significado principal es: ${word.de}`,
        )
      : I.T(
          `That sentence uses the main meaning: ${word.d} The other meaning is ${q.other}.`,
          `Esa oración usa el significado principal: ${word.de} El otro significado es ${q.other}.`,
        );
  return "";
}

function choicesHTML(I, level, rev, q) {
  return html`<div class="wl-choices" role="group" aria-label="${I.S("Answers", "Respuestas")}">
    ${q.opts.map(
      (o, i) =>
        html`<button
          type="button"
          class="wl-choice ${rev.choice != null && o.ok ? "is-right" : rev.choice === i ? "is-try" : ""}"
          data-wl-ranswer="${i}"
          ${rev.choice != null ? "disabled" : ""}
        >
          ${o.text}${gloss(I, level, o.es)}
        </button>`,
    )}
  </div>`;
}

function writeHTML(I, word, q, level, rev) {
  const st = rev.text || "";
  const res = rev.checked ? checkUse(word, st) : null;
  const frames = starters(word);
  const open = level === "A" || rev.hint;
  const ctx = q.context
    ? html`<p class="wl-ex">
        ${I.T("Think about", "Piensa en")}: <b>${I.T(q.context.en, q.context.es)}</b>
      </p>`
    : "";
  const crit = (ok, en, es) =>
    html`<li class="${ok ? "is-ok" : "is-no"}">${icon(ok ? "check" : "alert")} ${I.T(en, es)}</li>`;
  return html`${ctx}
    ${
      open
        ? html`<ul class="wl-frames" aria-label="${I.S("Sentence starters", "Inicios de oración")}">
            ${frames.map((f) => html`<li>${f.en}${showEs(I, level) ? html` <span class="wl-es" lang="es">${f.es}</span>` : ""}</li>`)}
          </ul>`
        : html`<button type="button" class="btn small" data-wl-rhint>
            ${icon("bulb")} ${I.T("Show sentence starters", "Mostrar inicios de oración")}
          </button>`
    }
    <label class="wl-use"
      ><span
        >${q.kind === "transfer" ? I.T("Write one or two sentences, or say them aloud to a partner", "Escribe una o dos oraciones, o dilas en voz alta a un compañero") : I.T("Your sentence", "Tu oración")}</span
      >
      <textarea data-wl-use rows="3" ${rev.done ? "disabled" : ""}>${st}</textarea>
    </label>
    ${
      res
        ? html`<ul class="wl-crit" role="status">
            ${crit(res.has, `Uses “${word.w}”`, `Usa «${word.w}»`)}
            ${crit(res.long, "Has at least six words", "Tiene al menos seis palabras")}
            ${crit(res.punct, "Ends with . ? or !", "Termina con . ? o !")}
            ${crit(!res.copied, "Is your own sentence, not the model", "Es tu propia oración, no el modelo")}
          </ul>`
        : ""
    }
    ${
      res?.ok
        ? html`<div class="wl-feedback is-right" role="status">
            <p>
              ${I.T("Compare with the model. Does your sentence show what the word means, with a detail, a reason or an example?", "Compara con el modelo. ¿Tu oración muestra lo que significa la palabra, con un detalle, una razón o un ejemplo?")}
            </p>
            <p class="wl-ex"><b>${I.T("Model", "Modelo")}:</b> ${word.x}</p>
            ${gloss(I, level, word.xe)}
            <label class="wl-selfcheck"
              ><input type="checkbox" data-wl-selfcheck ${rev.self ? "checked" : ""} />
              ${I.T("My sentence shows the meaning.", "Mi oración muestra el significado.")}</label
            >
          </div>`
        : ""
    }
    <div class="wl-actions">
      ${res?.ok ? html`<button type="button" class="btn btn-primary" data-wl-udone ${rev.self ? "" : "disabled"}>${I.T("Save and finish", "Guardar y terminar")}</button>` : html`<button type="button" class="btn btn-primary" data-wl-ucheck>${I.T("Check my sentence", "Revisar mi oración")}</button>`}
      ${q.kind === "transfer" ? html`<button type="button" class="btn" data-wl-usaid>${icon("volume")} ${I.T("I said it aloud to a partner", "Lo dije en voz alta a un compañero")}</button>` : ""}
      <button type="button" class="btn small" data-wl-uskip>
        ${I.T("Skip and show the model", "Saltar y ver el modelo")}
      </button>
    </div>
    ${q.kind === "transfer" ? html`<p class="fine">${I.T("This page cannot hear you. If you say it aloud, you decide whether it was clear and used the word correctly.", "Esta página no puede oírte. Si lo dices en voz alta, tú decides si fue claro y usó bien la palabra.")}</p>` : ""}`;
}

const isWrite = (k) => k === "use" || k === "transfer";

/** The review or mixed-review card for the word in `ui.rev`, or "" when none is open. */
export function reviewSection(ctx, I, st, ui) {
  const rev = ui.rev;
  const word = rev && byId(rev.id);
  if (!word) return ui.mix?.done ? mixSummary(I, ui.mix) : "";
  const q = rev.task;
  const level = levelOf(st);
  const answered = rev.choice != null || rev.done;
  const ok = rev.choice != null && q.opts?.[rev.choice]?.ok;
  const more = ui.mix ? ui.mix.i < ui.mix.ids.length - 1 : dueWords(st).length > 1;
  const msg = answered && !isWrite(q.kind) ? teach(I, word, q, ok) : "";
  return html`<section class="panel wl-task" aria-labelledby="wl-rev-h">
    <p class="wl-meta">
      ${stageChip(I, q.stage)}${ui.mix ? html` <span class="wl-mixed">${I.T(`Mixed review · word ${ui.mix.i + 1} of ${ui.mix.ids.length}`, `Repaso mixto · palabra ${ui.mix.i + 1} de ${ui.mix.ids.length}`)}</span>` : ""}
    </p>
    <h2 id="wl-rev-h">${promptFor(I, word, q)}</h2>
    ${q.kind === "sentence" ? html`<p class="wl-ex">${q.prompt}</p>` : q.kind === "collocation" ? html`<p class="wl-ex"><b>${q.blank}</b></p>` : html`<p class="wl-bigword"><b>${word.w}</b> ${speakBtn(I, word.w)}</p>`}
    ${
      isWrite(q.kind)
        ? writeHTML(I, word, q, level, rev)
        : html`${rev.hint ? html`<p class="wl-hint">${icon("bulb")} ${I.T(`It starts with “${word.w[0]}”. Spanish help: `, `Empieza con «${word.w[0]}». Ayuda en español: `)}<span lang="es">${word.e}</span></p>` : rev.choice == null ? html`<button type="button" class="btn small" data-wl-rhint>${icon("bulb")} ${I.T("Help me remember", "Ayúdame a recordar")}</button>` : ""}${choicesHTML(I, level, rev, q)}`
    }
    ${
      answered
        ? html`${!isWrite(q.kind) ? html`<div class="wl-feedback ${ok ? "is-right" : "is-try"}" role="status">${icon(ok ? "check" : "alert")} ${ok ? (rev.hint ? I.T("Right. With help, the word is watered but it does not move forward yet.", "Correcto. Con ayuda, la palabra se riega pero todavía no avanza.") : I.T("Right, on your own. Your word moves forward.", "Correcto, por tu cuenta. Tu palabra avanza.")) : ""} ${msg}</div>` : html`<div class="wl-feedback is-right" role="status">${rev.done === "skip" ? I.T("Here is the model sentence. Try again on another day.", "Aquí está la oración modelo. Inténtalo otro día.") : I.T("Saved. Your word moves forward.", "Guardado. Tu palabra avanza.")}${rev.done === "skip" ? html`<p class="wl-ex">${word.x}</p>` : ""}</div>`}
            <div class="wl-actions">
              <button type="button" class="btn btn-primary" data-wl-rnext>
                ${more || (!ok && !isWrite(q.kind) && !ui.mix) ? I.T("Next", "Siguiente") : ui.mix ? I.T("See my review", "Ver mi repaso") : I.T("Back to my garden", "Volver a mi jardín")}
                ${icon("arrow-right")}
              </button>
            </div>`
        : ""
    }
  </section>`;
}

function mixSummary(I, mix) {
  return html`<section class="panel wl-task" aria-labelledby="wl-mix-h">
    <h2 id="wl-mix-h">${I.T("Mixed review finished", "Repaso mixto terminado")}</h2>
    <p>
      ${I.T("These results are only for practice. Words with a check moved forward; look again at the others.", "Estos resultados son solo de práctica. Las palabras con una marca avanzaron; mira de nuevo las demás.")}
    </p>
    <ul class="wl-mixlist">
      ${mix.res.map((r) => {
        const w = byId(r.id);
        return html`<li class="${r.ok ? "is-ok" : "is-no"}">
          ${icon(r.ok ? "check" : "alert")} <b>${w.w}</b>
          <span>${r.ok ? I.T("moved forward", "avanzó") : w.d}</span>
        </li>`;
      })}
    </ul>
    <div class="wl-actions">
      <button type="button" class="btn btn-primary" data-wl-mixend>
        ${I.T("Back to my garden", "Volver a mi jardín")}
      </button>
    </div>
  </section>`;
}

/** Stage line for a garden plot: where the word is on the four-step path. */
export const plotStep = (I, rec) => {
  const s = wordStage(rec);
  return s.done
    ? I.T("All four steps shown", "Los cuatro pasos mostrados")
    : I.T(`Next step: ${STAGE_INFO[s.stage][0]}`, `Siguiente paso: ${STAGE_INFO[s.stage][1]}`);
};

function finish(ctx, I, st, ui, ok, independent, kind) {
  const rev = ui.rev;
  if (ui.mix) {
    practiceWord(st, rev.id, { ok, independent, kind });
    ui.mix.res.push({ id: rev.id, ok: ok && independent });
  } else {
    reviewWord(st, rev.id, { ok, independent, kind });
    st.revs = (st.revs || 0) + 1;
    if (st.revs % 5 === 0)
      wlEvidence(
        st,
        ctx,
        `garden-${st.revs / 5}`,
        { reviews: 5, planted: Object.keys(st.garden).length },
        rev.hint ? { hint: true } : {},
        "Inform",
      );
  }
  wlSave(st);
}

/** Clicks for the review card and the mixed review. Returns true when it handled the click. */
export function reviewClick(e, ctx, I, st, ui) {
  const t = e.target;
  const open = (id) => ({ id, task: depthTask(byId(id), WORDS, st.garden[id]),
    hint: false,
    choice: null,
    text: "",
    checked: false,
    self: false,
    done: false,
  });
  if (t.closest("[data-wl-rstart]"))
    return ((ui.mix = null), (ui.rev = open(dueWords(st)[0])), ctx.rerender(), true);
  if (t.closest("[data-wl-mixstart]")) {
    const ids = mixedSet(st);
    if (!ids.length) return true;
    ui.mix = { ids, i: 0, res: [], done: false };
    ui.rev = open(ids[0]);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-mixend]"))
    return ((ui.mix = null), (ui.rev = null), ctx.rerender(), true);
  const rev = ui.rev;
  if (!rev) return false;
  if (t.closest("[data-wl-rhint]")) return ((rev.hint = true), ctx.rerender(), true);
  const word = byId(rev.id);
  const q = rev.task;
  const ans = t.closest("[data-wl-ranswer]");
  if (ans && rev.choice == null) {
    const i = Number(ans.dataset.wlRanswer);
    rev.choice = i;
    finish(ctx, I, st, ui, q.opts[i].ok, q.opts[i].ok && !rev.hint, q.kind);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-ucheck]")) {
    rev.checked = true;
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-udone]") && checkUse(word, rev.text).ok && rev.self && !rev.done) {
    rev.done = true;
    st.garden[word.id].my = { ...(st.garden[word.id].my || {}), [q.kind]: rev.text };
    finish(ctx, I, st, ui, true, !rev.hint, q.kind);
    announce(I.S("Saved. Your word moves forward.", "Guardado. Tu palabra avanza."));
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-usaid]") && !rev.done) {
    rev.done = true;
    finish(ctx, I, st, ui, true, !rev.hint, q.kind);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-uskip]") && !rev.done) {
    rev.done = "skip";
    finish(ctx, I, st, ui, false, false, q.kind);
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-wl-rnext]")) {
    if (ui.mix) {
      ui.mix.i += 1;
      if (ui.mix.i >= ui.mix.ids.length) ui.mix.done = true;
      ui.rev = ui.mix.done ? null : open(ui.mix.ids[ui.mix.i]);
    } else {
      const next = dueWords(st).filter((id) => id !== rev.id)[0];
      ui.rev = next ? open(next) : null;
    }
    return (ctx.rerender(), true);
  }
  return false;
}

/** Keeps what the learner types and the self-check box without redrawing (so focus and the caret stay put). */
export function reviewInput(e, ui) {
  if (!ui.rev) return;
  if (e.target.matches?.("[data-wl-use]")) {
    ui.rev.text = e.target.value;
    ui.rev.checked = false;
    ui.rev.self = false;
  }
}
export function reviewChange(e, ctx, ui) {
  if (ui.rev && e.target.matches?.("[data-wl-selfcheck]")) {
    ui.rev.self = e.target.checked;
    ctx.rerender();
  }
}
