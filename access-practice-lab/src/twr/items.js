// TWR: one practice question at a time. renderItem() draws the question, check() grades it and returns the
// verdict. Controls are native radios, checkboxes and selects (keyboard and screen-reader ready), and every wrong
// answer is named: nothing marks the unpicked right answer until the learner has tried twice (the "reveal").
import { html, icon, raw } from "../util.js";
import { seededOrder } from "../prep/model.js";
import { blanksHTML, checkBtn, choicesHTML, hearPairHTML, resultHTML } from "../prep/ui.js";
import { buildText, checkBoxes, checkBuild, checkOrder } from "./model.js";

const IGN = raw("data-nsr-ignore");
export const itemKey = (n) => `i${n}`;

/** What the Hear button reads: the sentence being worked on, else the instruction. */
export const sayText = (it) => it.say || it.text || it.prompt;

function pickHTML(I, it, k, st, res) {
  const picked = new Set(st.answers[k] || []);
  const locked = res?.ok;
  return html`<fieldset class="prep-q">
    <legend>${it.prompt}</legend>
    <div class="choices twr-picks">
      ${it.options.map((o, i) => {
        const on = picked.has(o.id);
        const wrong = res && !res.ok && res.wrong?.some((w) => w.id === o.id);
        const state = res
          ? on
            ? o.right
              ? "is-right"
              : "is-wrong"
            : res.reveal && o.right
              ? "is-answer"
              : ""
          : "";
        return html`<label class="choice ${on ? "is-on" : ""} ${state} ${wrong ? "is-wrong" : ""}">
          <input
            type="checkbox"
            value="${o.id}"
            data-prep-box="${k}"
            ${on ? raw("checked") : ""}
            ${locked ? raw("disabled") : ""}
            ${IGN}
          />
          <span class="choice-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span
          ><span class="opt-text">${o.text}</span>
        </label>`;
      })}
    </div>
  </fieldset>`;
}

function orderHTML(I, it, k, st, seed, res) {
  const picks = st.answers[k] || {};
  const lines = seededOrder(
    it.lines.map((text, i) => ({ text, i })),
    seed,
  );
  return html`<fieldset class="prep-q twr-order">
    <legend>${it.prompt}</legend>
    <ul class="twr-order-list">
      ${lines.map(({ text, i }) => {
        const ok = res?.slots?.[i];
        return html`<li class="twr-order-row ${res ? (ok ? "is-right" : "is-wrong") : ""}">
          <label>
            <span class="twr-order-pos"
              ><select
                data-prep-blank="${k}:${i}"
                aria-label="${I.S("Place in the order", "Lugar en el orden")}"
                ${res?.ok ? raw("disabled") : ""}
                ${IGN}
              >
                <option value="">${I.T("Place…", "Lugar…")}</option>
                ${it.lines.map((_, n) => html`<option value="${n + 1}" ${String(picks[i]) === String(n + 1) ? raw("selected") : ""}>${n + 1}</option>`)}
              </select></span
            >
            <span class="twr-order-text">${text}</span>
          </label>
        </li>`;
      })}
    </ul>
  </fieldset>`;
}

const ready = (it, st, k) => {
  const a = st.answers[k];
  if (it.kind === "choice") return Boolean(a);
  if (it.kind === "pick") return Array.isArray(a) && a.length > 0;
  if (it.kind === "blanks") return it.parts.every((p, i) => typeof p === "string" || a?.[i]);
  return it.lines.every((_, i) => a?.[i]);
};

function resultFor(I, it, res) {
  if (res.ok) return resultHTML(I, { ok: true, lead: I.T(it.why, it.whyEs || it.why) });
  const teach = I.T(it.why, it.whyEs || it.why);
  const answer =
    it.kind === "blanks"
      ? html`<p class="twr-answer">
          ${I.T("The sentence:", "La oración:")} <strong>${buildText(it.parts)}</strong>
        </p>`
      : it.kind === "order"
        ? html`<ol class="twr-answer">
            ${it.lines.map((l) => html`<li>${l}</li>`)}
          </ol>`
        : "";
  const lead =
    it.kind === "pick" || it.kind === "order"
      ? I.T(
          `${res.right ?? 0} of ${res.total ?? it.options?.length ?? it.lines.length} are right so far. Look again.`,
          `${res.right ?? 0} de ${res.total ?? it.options?.length ?? it.lines.length} están bien. Mira otra vez.`,
        )
      : I.T(
          "Not yet. Look at the clue words and try again.",
          "Todavía no. Mira las palabras clave e inténtalo otra vez.",
        );
  return resultHTML(I, {
    ok: false,
    lead: res.reveal ? I.T("Here is how it works.", "Así funciona.") : lead,
    more: res.reveal
      ? html`${answer}
          <p>${teach}</p>`
      : "",
    moreLabel: I.T("Show me", "Muéstrame"),
  });
}

/** One question: the instruction, the text it is about, the controls, the check button and the verdict. */
export function renderItem(I, set, n, st, early) {
  const it = set.items[n];
  const k = itemKey(n);
  const res = st.checked?.[k];
  const done = res?.ok;
  const mode = res ? (res.reveal ? "reveal" : true) : false;
  const hearChoices =
    early && it.kind === "choice"
      ? html`<p>
          ${hearPairHTML(I, it.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o.text}`).join(". "), I.T("Hear the choices", "Escuchar las opciones"))}
        </p>`
      : "";
  let control;
  if (it.kind === "choice")
    control = choicesHTML(I, {
      name: k,
      label: it.prompt,
      options: it.options,
      picked: st.answers[k],
      answer: it.answer,
      checked: mode,
    });
  else if (it.kind === "blanks")
    control = html`<p class="prep-q-label">${it.prompt}</p>
      ${blanksHTML(I, { key: k, parts: it.parts, picks: st.answers[k] || {}, result: res })}`;
  else if (it.kind === "pick") control = pickHTML(I, it, k, st, res);
  else control = orderHTML(I, it, k, st, `${set.id}:${n}`, res);
  return html`<div class="twr-item" data-twr-kind="${it.kind}">
    ${
      it.text
        ? html`<blockquote class="twr-text">
            <p lang="en">${it.text}</p>
            ${hearPairHTML(I, sayText(it))}
          </blockquote>`
        : it.kind === "choice" || it.kind === "blanks"
          ? html`<p class="twr-hear">${hearPairHTML(I, it.say || it.prompt)}</p>`
          : ""
    }
    ${hearChoices} ${control}
    ${
      done
        ? ""
        : checkBtn(
            I,
            "check-item",
            ready(it, st, k),
            I.T("Check my answer", "Revisar mi respuesta"),
          )
    }
    ${res ? resultFor(I, it, res) : ""}
    ${
      done
        ? html`<p class="twr-next">
            <button type="button" class="btn btn-primary" data-prep-act="item-next">
              ${n === set.items.length - 1 ? I.T("On to writing", "A escribir") : I.T("Next question", "Siguiente pregunta")}
              ${icon("arrow-right")}
            </button>
          </p>`
        : ""
    }
  </div>`;
}

/** Grade one question. Returns the verdict to store; a second miss turns on the reveal. */
export function checkItem(it, st, k) {
  const a = st.answers[k];
  let res;
  if (it.kind === "choice") res = { ok: a === it.answer };
  else if (it.kind === "blanks") res = checkBuild(it.parts, a || {});
  else if (it.kind === "pick") {
    const r = checkBoxes(it.options, a || []);
    const total = it.options.filter((o) => o.right).length;
    res = { ok: r.ok, right: total - r.missed.length, total, wrong: r.wrong };
  } else res = checkOrder(it, a || {});
  st.tries ||= {};
  if (!res.ok) {
    st.tries[k] = (st.tries[k] || 0) + 1;
    res.reveal = st.tries[k] >= 2;
  }
  return res;
}

