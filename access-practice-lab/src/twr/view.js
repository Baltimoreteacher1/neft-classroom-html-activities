// TWR set player: /twr/<strategy>/<setId>. Four steps (Learn, Practice, Write, Finish); the practice step shows one
// question at a time. This file owns routing into a set, the saved state (model.js) and the events; items.js draws
// and grades the questions. Untimed: nothing here is a score against anyone, stars only record how it went for you.
import { BAND_INFO } from "../bands.js";
import { loadTwr } from "../content.js";
import { award } from "../engagement.js";
import { i18nFor } from "../i18n.js";
import { frameHTML, familyTeacherHTML, hearBtn, hearPairHTML } from "../prep/ui.js";
import { stop as stopSpeech } from "../speech.js";
import { announce, BASE, html, icon, raw, toHtml } from "../util.js";
import { checkItem, itemKey, renderItem } from "./items.js";
import {
  isDone,
  loadState,
  resetState,
  saveState,
  setProblems,
  starsFor,
  wordList,
  writeChecklist,
  writeComplete,
} from "./model.js";
import { STRATEGIES, TWR_STEPS } from "./registry.js";

export const twrHref = (slug, id, band) =>
  `${BASE}/twr${slug ? `/${slug}` : ""}${id ? `/${id}` : ""}?grades=${BAND_INFO[band]?.picker || band}`;

let cur = null; // { strat, set, sets, st, band, I }

export async function setsFor(slug, band) {
  const data = await loadTwr(band, slug);
  return (data.sets || []).filter((s) => !setProblems(s).length);
}

const skillOf = (strat) => ({
  slug: strat.slug,
  title: strat.title[0],
  titleEs: strat.title[1],
  icon: strat.icon,
  domain: "Writing",
});
const early = (band) => band === "K" || band === "1";

/** Route: /twr/<strategy>/<setId>. Returns the page for one set. */
export async function render(ctx, slug, setId, band) {
  const I = i18nFor(ctx);
  const strat = STRATEGIES[slug];
  const sets = await setsFor(slug, band);
  const set = sets.find((s) => s.id === setId);
  if (!set) return null;
  if (cur?.set.id !== set.id) cur = { strat, set, sets, band, st: loadState(set.id) };
  cur.sets = sets;
  cur.I = I;
  const { st } = cur;
  const step = Math.min(st.step || 0, TWR_STEPS.length - 1);
  const crumbs = [
    [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${BAND_INFO[band]?.picker || band}`],
    ["TWR", twrHref("", "", band)],
    [I.S(strat.title[0], strat.title[1]), twrHref(slug, "", band)],
    [I.S(set.title, set.titleEs), null],
  ];
  return {
    title: `${I.S(set.title, set.titleEs)} · TWR`,
    html: frameHTML(I, {
      skill: skillOf(strat),
      set,
      band,
      steps: TWR_STEPS,
      step,
      body: body(I, set, st, step, band),
      canNext: ready(set, st, step),
      crumbs,
      allHref: twrHref(slug, "", band),
      cls: "twr-skill",
      hideNext: step === 1,
    }),
  };
}

function learnHTML(I, set) {
  const L = set.learn;
  return html`<p class="twr-rule">${icon("bulb")} ${I.T(L.rule, L.ruleEs)}</p>
    <figure class="twr-model">
      <figcaption>${I.T("Model", "Modelo")}</figcaption>
      <p lang="en">${L.model}</p>
      ${hearPairHTML(I, L.model)}
    </figure>
    <p class="twr-notice">
      ${icon("sparkle")} <strong>${I.T("Notice:", "Fíjate:")}</strong> ${L.notice}
    </p>`;
}

function practiceHTML(I, set, st, band) {
  const n = Math.min(st.i || 0, set.items.length - 1);
  return html`<p class="twr-progress" role="status">
      <span class="visually-hidden"
        >${I.T(`Question ${n + 1} of ${set.items.length}`, `Pregunta ${n + 1} de ${set.items.length}`)}</span
      >
      ${set.items.map((_, i) => html`<span class="twr-dot ${i < n || st.checked?.[itemKey(i)]?.ok ? "is-done" : ""} ${i === n ? "is-now" : ""}" aria-hidden="true"></span>`)}
      <span class="twr-progress-text" aria-hidden="true">${n + 1} / ${set.items.length}</span>
    </p>
    ${renderItem(I, set, n, st, early(band))}`;
}

const nSay = (st) => (st.answers?.say || []).length;

function checklistHTML(I, w, text) {
  return html`<ul
    class="twr-checks"
    data-twr-live
    aria-label="${I.S("My writing checklist", "Mi lista de revisión")}"
  >
    ${writeChecklist(w, text).map((c) => html`<li class="${c.ok ? "is-met" : ""}">${c.ok ? icon("check") : html`<span class="twr-box" aria-hidden="true"></span>`} ${I.T(c.rule.label[0], c.rule.label[1])}</li>`)}
  </ul>`;
}

function writeHTML(I, set, st, band) {
  const w = set.write;
  const head = html`${
      w.text
        ? html`<blockquote class="twr-text">
            <p lang="en">${w.text}</p>
            ${hearPairHTML(I, w.text)}
          </blockquote>`
        : ""
    }
    <p class="twr-write-prompt">${I.T(w.prompt, w.promptEs)} ${hearBtn(I, w.prompt)}</p>`;
  if (w.say) {
    const ticked = new Set(st.answers?.say || []);
    return html`${head}
      <div class="twr-say">
        <p class="twr-say-model">
          ${hearBtn(I, w.model, I.T("Hear a model", "Escuchar un modelo"))}
        </p>
        <fieldset class="prep-q">
          <legend>
            ${I.T("Say it to a partner. Then check what you did:", "Díselo a un compañero. Luego marca lo que hiciste:")}
          </legend>
          ${w.checks.map(
            (c, i) =>
              html`<label class="choice ${ticked.has(String(i)) ? "is-on" : ""}">
                <input
                  type="checkbox"
                  value="${i}"
                  data-prep-box="say"
                  ${ticked.has(String(i)) ? raw("checked") : ""}
                  data-nsr-ignore
                />
                <span class="opt-text">${I.T(c.label[0], c.label[1])}</span>
              </label>`,
          )}
        </fieldset>
        ${nSay(st) === w.checks.length ? html`<p class="twr-model-line">${icon("check")} <span lang="en">${w.model}</span></p>` : ""}
      </div>`;
  }
  const text = st.answers?.write || "";
  return html`${head}
    <label class="visually-hidden" for="twrWrite">${I.T("Your writing", "Tu escritura")}</label>
    <textarea
      id="twrWrite"
      class="prep-textarea twr-textarea"
      rows="${band === "6-8" ? 7 : 5}"
      data-prep-text="write"
      lang="en"
      placeholder="${I.S("Write here…", "Escribe aquí…")}"
    >
${text}</textarea>
    <p class="twr-write-tools">
      ${w.frame ? html`<button type="button" class="btn small" data-prep-act="frame">${I.T("Use the starter", "Usar el comienzo")}</button>` : ""}
      ${hearBtn(I, text || w.prompt, I.T("Hear my writing", "Escuchar lo que escribí"))}
    </p>
    ${checklistHTML(I, w, text)}
    ${
      st.modelSeen
        ? html`<div class="feedback is-right twr-model-box" role="status">
            <p class="fb-title">
              ${icon("sparkle")} ${I.T("A model to compare with", "Un modelo para comparar")}
            </p>
            <p lang="en">${w.model}</p>
            ${hearPairHTML(I, w.model)}
            <p class="fine">
              ${I.T("Yours can be different. Is anything on the checklist missing from yours?", "El tuyo puede ser diferente. ¿Falta algo de la lista en el tuyo?")}
            </p>
          </div>`
        : html`<p>
            <button
              type="button"
              class="btn"
              data-prep-act="model"
              ${wordList(text).length >= 3 ? "" : raw("disabled")}
            >
              ${I.T("Show a model", "Mostrar un modelo")}
            </button>
          </p>`
    }`;
}

function finishHTML(I, set, st, band, strat) {
  const stars = starsFor(st);
  const idx = cur.sets.findIndex((s) => s.id === set.id);
  const next = cur.sets[idx + 1];
  return html`<div class="twr-finish" role="status">
      <p class="twr-stars" aria-label="${I.S(`${stars} of 3 stars`, `${stars} de 3 estrellas`)}">
        ${[1, 2, 3].map((n) => html`<span class="twr-star ${n <= stars ? "is-on" : ""}">${icon("star")}</span>`)}
      </p>
      <h3 class="twr-finish-h">${I.T("You finished!", "¡Terminaste!")}</h3>
      <p>${I.T(set.learn.rule, set.learn.ruleEs)}</p>
      ${
        st.answers?.write
          ? html`<blockquote class="twr-text">
              <p lang="en">${st.answers.write}</p>
              ${hearBtn(I, st.answers.write, I.T("Hear my writing", "Escuchar lo que escribí"))}
            </blockquote>`
          : ""
      }
      <p class="twr-finish-actions">
        ${next ? html`<a class="btn btn-primary" href="${twrHref(strat.slug, next.id, band)}">${I.T("Next set:", "Siguiente conjunto:")} ${I.T(next.title, next.titleEs)} ${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${twrHref("", "", band)}">${I.T("Back to TWR", "Volver a TWR")} ${icon("arrow-right")}</a>`}
        <button type="button" class="btn" data-prep-act="restart">
          ${icon("replay")} ${I.T("Do this set again", "Hacer este conjunto otra vez")}
        </button>
      </p>
    </div>
    ${familyTeacherHTML(I, set)}`;
}

function body(I, set, st, step, band) {
  if (step === 0) return learnHTML(I, set);
  if (step === 1) return practiceHTML(I, set, st, band);
  if (step === 2) return writeHTML(I, set, st, band);
  return finishHTML(I, set, st, band, cur.strat);
}

function ready(set, st, step) {
  if (step === 1) return (st.i || 0) >= set.items.length;
  if (step === 2) {
    const w = set.write;
    if (w.say) return nSay(st) === w.checks.length;
    return (
      wordList(st.answers?.write).length >= 3 &&
      (writeComplete(w, st.answers.write) || Boolean(st.modelSeen))
    );
  }
  return true;
}

const save = () => saveState(cur.set.id, cur.st);

/** After a re-render, put focus on the new result or the step heading. */
function settle(ctx, focus) {
  return Promise.resolve(ctx.rerender()).then(() => {
    const el = (focus && document.querySelector(focus)) || document.getElementById("prepStepH");
    if (!el) return;
    if (!el.matches("button, input, select, textarea, a[href]")) el.tabIndex = -1;
    el.focus({ preventScroll: true });
    const box = el.getBoundingClientRect();
    if (box.top < 80 || box.bottom > innerHeight)
      el.scrollIntoView?.({
        block: "nearest",
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
  });
}

function advance(ctx) {
  const { st, set } = cur;
  st.step = Math.min((st.step || 0) + 1, TWR_STEPS.length - 1);
  if (st.step === TWR_STEPS.length - 1 && !st.done) {
    st.done = true;
    award(ctx, `twr:${set.id}`, 4, `TWR ${set.title}`);
  }
  save();
  return settle(ctx, null);
}

export function onClick(e, ctx) {
  if (!cur) return false;
  const btn = e.target.closest("[data-prep-act]");
  if (!btn) return false;
  const I = i18nFor(ctx);
  const { set, st } = cur;
  const act = btn.dataset.prepAct;
  const step = st.step || 0;
  if (act === "next") {
    if (!ready(set, st, step)) {
      announce(I.S("Finish this step first.", "Termina este paso primero."), { toast: true });
      return true;
    }
    stopSpeech();
    advance(ctx);
    return true;
  }
  if (act === "back") {
    stopSpeech();
    st.step = Math.max(0, step - 1);
    save();
    settle(ctx, null);
    return true;
  }
  if (act === "restart") {
    resetState(set.id);
    cur.st = loadState(set.id);
    settle(ctx, null);
    return true;
  }
  if (act === "check-item") {
    const n = st.i || 0;
    const k = itemKey(n);
    st.checked ||= {};
    st.checked[k] = checkItem(set.items[n], st, k);
    save();
    settle(ctx, ".prep-step .feedback");
    return true;
  }
  if (act === "item-next") {
    stopSpeech();
    st.i = (st.i || 0) + 1;
    save();
    if (st.i >= set.items.length) advance(ctx);
    else settle(ctx, ".twr-progress");
    return true;
  }
  if (act === "frame") {
    st.answers.write = `${set.write.frame.replace(/_+\s*$/, "").trimEnd()} `;
    save();
    ctx.rerender();
    document.getElementById("twrWrite")?.focus();
    return true;
  }
  if (act === "model") {
    st.modelSeen = true;
    save();
    settle(ctx, ".twr-model-box");
    return true;
  }
  return false;
}

export function onChange(e, ctx) {
  if (!cur) return;
  const t = e.target;
  const { st } = cur;
  st.answers ||= {};
  if (t.matches("[data-prep-pick]")) {
    st.answers[t.dataset.prepPick] = t.value;
    delete st.checked?.[t.dataset.prepPick];
  } else if (t.matches("[data-prep-blank]")) {
    const [k, i] = t.dataset.prepBlank.split(":");
    st.answers[k] = { ...(st.answers[k] || {}), [i]: t.value };
    delete st.checked?.[k];
  } else if (t.matches("[data-prep-box]")) {
    const k = t.dataset.prepBox;
    const now = new Set(st.answers[k] || []);
    if (t.checked) now.add(t.value);
    else now.delete(t.value);
    st.answers[k] = [...now];
    delete st.checked?.[k];
  } else return;
  save();
  ctx.rerender({ keepFocus: true });
}

/** Typing never re-renders (that would move the caret): only the live checklist and the model button refresh. */
export function onInput(e) {
  if (!cur) return;
  const t = e.target;
  if (!t.matches?.("[data-prep-text]")) return;
  cur.st.answers ||= {};
  cur.st.answers.write = t.value.slice(0, 1500);
  save();
  const live = document.querySelector("[data-twr-live]");
  if (live) live.outerHTML = toHtml(checklistHTML(cur.I, cur.set.write, t.value));
  const model = document.querySelector('[data-prep-act="model"]');
  if (model) model.disabled = wordList(t.value).length < 3;
  const next = document.querySelector('.prep-steps-nav [data-prep-act="next"]');
  if (next) next.setAttribute("aria-disabled", String(!ready(cur.set, cur.st, 2)));
}

export function unmount() {
  stopSpeech();
  cur = null;
}

