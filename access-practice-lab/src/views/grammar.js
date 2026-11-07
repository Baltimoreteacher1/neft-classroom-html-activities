// Grammar check-in and numbered practice packs: /grammar (check-in, optional writing sample, route) and
// /grammar/<n> (one pack). Routing logic: src/lang/grammar.js. Content: content/grammar/packs.json.
// Untimed; a hint is the pack's rule, never the answer; nothing here is a level or a score.
import { crumbsHTML, setComponentsI18n } from "../components.js";
import { loadGrammar } from "../content.js";
import { award } from "../engagement.js";
import {
  checkinComplete,
  GRAMMAR_KEY,
  MIN_SAMPLE_WORDS,
  nextPack,
  normalizeGrammar,
  packDone,
  route,
} from "../lang/grammar.js";
import { i18nFor, makeI18n } from "../i18n.js";
import { announce, BASE, html, icon, raw, safeJson, storage, todayISO } from "../util.js";

let I = makeI18n("en");
let DATA = null;

const load = () => normalizeGrammar(safeJson(storage.get(GRAMMAR_KEY), {}));
const save = (state) => storage.set(GRAMMAR_KEY, JSON.stringify(state));
const doneMap = (state) =>
  Object.fromEntries(Object.entries(state.packs).map(([n, p]) => [n, p.done]));
const packTitle = (p) => I.TO(p.title);

function choiceSet(name, item, pick, [attr, key], { checked = false } = {}) {
  return html`<fieldset
    class="gm-question ${checked ? (pick === item.answer ? "is-right" : "is-miss") : ""}"
  >
    <legend>${I.T("Choose the correct sentence.", "Elige la oración correcta.")}</legend>
    ${item.choices.map(
      (c, ci) =>
        html`<label class="gm-choice"
          ><input
            type="radio"
            name="${name}"
            value="${ci}"
            ${raw(attr)}="${key}"
            ${pick === ci ? "checked" : ""}
          />
          <span lang="en">${c}</span></label
        >`,
    )}
  </fieldset>`;
}

function checkinHTML(state, packs) {
  let k = 0;
  return html`<section class="panel" aria-labelledby="gcTitle">
    <h2 id="gcTitle">${I.T("Grammar check-in", "Chequeo de gramática")}</h2>
    <p class="fine">
      ${I.T(
        "14 short items, two for each pack. Answer on your own; there is no clock. Your answers choose which numbered packs to practise next.",
        "14 preguntas cortas, dos para cada paquete. Responde por tu cuenta; no hay reloj. Tus respuestas eligen qué paquetes numerados practicar después.",
      )}
    </p>
    ${packs.flatMap((p) =>
      p.diagnostic.map((item, i) => {
        k += 1;
        return html`<div class="grammar-item">
          <p class="eyebrow">${I.T(`Item ${k} of 14`, `Pregunta ${k} de 14`)}</p>
          ${choiceSet(`gc-${p.n}-${i}`, item, state.answers[`${p.n}:${i}`], ["data-gc", `${p.n}:${i}`])}
        </div>`;
      }),
    )}
    <label class="field"
      ><span
        >${I.T(
          `Optional: write ${MIN_SAMPLE_WORDS} or more words about your weekend. The Error Detective checks it for patterns.`,
          `Opcional: escribe ${MIN_SAMPLE_WORDS} palabras o más sobre tu fin de semana. El Detective de errores la revisa para buscar patrones.`,
        )}</span
      ><textarea data-gc-sample rows="4" lang="en">${state.sample}</textarea>
    </label>
    <div class="gm-actions">
      <button type="button" class="btn btn-primary" data-gc-finish>
        ${I.T("See my practice packs", "Ver mis paquetes de práctica")} ${icon("arrow-right")}
      </button>
    </div>
  </section>`;
}

function routeHTML(state, packs) {
  const plan = route(packs, { answers: state.answers, sample: state.sample, done: doneMap(state) });
  const next = nextPack(plan);
  return html`<section class="panel" aria-labelledby="grTitle">
    <h2 id="grTitle">${I.T("My practice packs", "Mis paquetes de práctica")}</h2>
    ${
      plan.length
        ? html`<ol class="grammar-route">
              ${plan.map((r) => {
                const p = packs.find((x) => x.n === r.n);
                return html`<li>
                  <a href="${BASE}/grammar/${r.n}"
                    ><strong>${I.T(`Pack ${r.n}`, `Paquete ${r.n}`)}:</strong> ${packTitle(p)}</a
                  >
                  ${r.done ? html` <span class="done-badge">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}
                  <span class="fine">
                    ${r.misses ? I.T(`${r.misses} check-in item${r.misses === 1 ? "" : "s"} to practise`, `${r.misses} pregunta${r.misses === 1 ? "" : "s"} del chequeo para practicar`) : ""}
                    ${r.hits.length ? html`${r.misses ? " · " : ""}${I.T("seen in your writing:", "visto en tu escritura:")} <q lang="en">${r.hits[0].text}</q>` : ""}
                  </span>
                </li>`;
              })}
            </ol>
            ${next ? html`<a class="btn btn-primary" href="${BASE}/grammar/${next.n}">${I.T(`Start Pack ${next.n}`, `Empezar el paquete ${next.n}`)} ${icon("arrow-right")}</a>` : html`<p>${I.T("Every pack in your plan is done. Try the Writing Studio to use these patterns in your own writing.", "Terminaste todos los paquetes de tu plan. Prueba el Estudio de escritura para usar estos patrones en tu propia escritura.")}</p>`}`
        : html`<p>
            ${I.T("No pack needed from this check-in. Keep writing in the Writing Studio, and take the check-in again any time.", "Este chequeo no indica ningún paquete. Sigue escribiendo en el Estudio de escritura y repite el chequeo cuando quieras.")}
          </p>`
    }
    <div class="gm-actions">
      <a class="btn" href="${BASE}/write">${I.T("Writing Studio", "Estudio de escritura")}</a>
      <button type="button" class="btn" data-gc-restart>
        ${I.T("Take the check-in again", "Repetir el chequeo")}
      </button>
    </div>
  </section>`;
}

function allPacksHTML(packs, state) {
  return html`<section class="panel" aria-labelledby="gaTitle">
    <h2 id="gaTitle">${I.T("All packs", "Todos los paquetes")}</h2>
    <ol class="grammar-route">
      ${packs.map((p) => html`<li><a href="${BASE}/grammar/${p.n}">${I.T(`Pack ${p.n}`, `Paquete ${p.n}`)}: ${packTitle(p)}</a>${state.packs[p.n]?.done ? html` <span class="done-badge">${icon("check")} ${I.T("Done", "Hecho")}</span>` : ""}</li>`)}
    </ol>
  </section>`;
}

function packHTML(pack, state) {
  const saved = state.packs[pack.n] || { picks: {}, done: false };
  return html`<section class="panel" aria-labelledby="gpTitle">
    <p class="eyebrow">${I.T(`Pack ${pack.n} of 7`, `Paquete ${pack.n} de 7`)}</p>
    <h2 id="gpTitle">${packTitle(pack)}</h2>
    <p class="grammar-rule">${icon("bulb")} ${I.TO(pack.rule)}</p>
    ${pack.practice.map((item, i) => {
      const pick = saved.picks[i];
      const answered = Number.isInteger(pick);
      return html`<div class="grammar-item">
        ${choiceSet(`gp-${i}`, item, pick, ["data-gp", String(i)], { checked: answered })}
        ${
          answered
            ? pick === item.answer
              ? html`<p class="gm-why is-right" role="status">
                  ${icon("check")} <b>${I.T("Right.", "Correcto.")}</b> ${I.TO(item.why)}
                </p>`
              : html`<p class="gm-why is-miss" role="status">
                  ${icon("bulb")}
                  ${I.T("Not yet. Read the rule again and choose another sentence.", "Todavía no. Vuelve a leer la regla y elige otra oración.")}
                </p>`
            : ""
        }
      </div>`;
    })}
    ${saved.done ? html`<p class="feedback is-right" role="status">${icon("check")} ${I.T("Pack done. Every sentence is right.", "Paquete terminado. Todas las oraciones están bien.")}</p>` : ""}
    <div class="gm-actions">
      <a class="btn" href="${BASE}/grammar">${I.T("Back to my packs", "Volver a mis paquetes")}</a>
      <a class="btn" href="${BASE}/detective">${I.T("Error Detective", "Detective de errores")}</a>
    </div>
  </section>`;
}

export async function render(ctx) {
  I = i18nFor(ctx);
  setComponentsI18n(I);
  DATA = await loadGrammar();
  const packs = DATA.packs;
  const state = load();
  const pack = packs.find((p) => String(p.n) === String(ctx.route?.id || ""));
  const title = I.S("Grammar packs", "Paquetes de gramática");
  return {
    title: pack
      ? I.S(`Pack ${pack.n}: ${pack.title.en}`, `Paquete ${pack.n}: ${pack.title.es}`)
      : title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [title, pack ? `${BASE}/grammar` : null],
        ...(pack ? [[I.S(`Pack ${pack.n}`, `Paquete ${pack.n}`), null]] : []),
      ])}
      <div class="gm-studio d-writing grammar-studio">
        <header class="gm-hero">
          <div>
            <p class="gm-kicker">
              ${icon("detective")} ${I.T("Writing practice", "Práctica de escritura")}
            </p>
            <h1 tabindex="-1">
              ${I.T("Grammar check-in and packs", "Chequeo y paquetes de gramática")}
            </h1>
            <p class="lead">
              ${I.T(
                "A short check-in finds which of seven grammar packs to practise: articles, plurals, possessives, pronouns, prepositions, negation and questions.",
                "Un chequeo corto encuentra cuáles de los siete paquetes de gramática practicar: artículos, plurales, posesivos, pronombres, preposiciones, negación y preguntas.",
              )}
            </p>
            <p class="fine">
              ${I.T("This is practice on this device. It is not a level, a score or a test result.", "Es práctica en este dispositivo. No es un nivel, una calificación ni el resultado de una prueba.")}
            </p>
          </div>
        </header>
        ${pack ? packHTML(pack, state) : html`${state.finished ? routeHTML(state, packs) : checkinHTML(state, packs)}${allPacksHTML(packs, state)}`}
      </div>`,
  };
}

export function onChange(event, ctx) {
  if (!DATA) return;
  const t = event.target;
  const state = load();
  if (t.matches?.("[data-gc]")) {
    state.answers[t.dataset.gc] = Number(t.value);
    save(state);
    return;
  }
  if (t.matches?.("[data-gp]")) {
    const pack = DATA.packs.find((p) => String(p.n) === String(ctx.route?.id || ""));
    if (!pack) return;
    const saved = state.packs[pack.n] || { picks: {}, done: false };
    saved.picks[t.dataset.gp] = Number(t.value);
    const wasDone = saved.done;
    saved.done = packDone(pack, saved.picks);
    state.packs[pack.n] = saved;
    save(state);
    if (saved.done && !wasDone) award(ctx, `grammar:pack:${pack.n}`, 5, "Grammar pack");
    ctx.rerender();
  }
}

export function onInput(event) {
  if (!event.target.matches?.("[data-gc-sample]")) return;
  const state = load();
  state.sample = event.target.value.slice(0, 2000);
  save(state);
}

export function onClick(event, ctx) {
  const b = event.target.closest?.("button");
  if (!b || !DATA) return false;
  const state = load();
  if (b.hasAttribute("data-gc-finish")) {
    const sample = document.querySelector("[data-gc-sample]")?.value ?? state.sample;
    if (!checkinComplete(DATA.packs, state.answers)) {
      announce(I.S("Answer all 14 items first.", "Primero responde las 14 preguntas."));
      return true;
    }
    save({ ...state, sample: sample.slice(0, 2000), finished: true, date: todayISO() });
  } else if (b.hasAttribute("data-gc-restart")) {
    save({ ...state, answers: {}, sample: "", finished: false });
  } else return false;
  ctx.rerender();
  return true;
}
