// Science Investigation Lab: the hands-on parts of notice, question and hypothesis.
// notice: hotspots on the scene open a neutral observation the learner can keep as an "I notice" or "I wonder" chip.
// question: tap a variable card, tap a slot; the question skeleton lights up as the slots fill.
// hypothesis: order the conditions as a prediction (buttons move them; the order is saved in the stage).
// Saved shapes (inside the existing stage records): notice.look, notice.chips [{h, k}], question.pick,
// question.slots {change, measure}, hypothesis.order [valueId].
import { esc, html, icon, raw } from "../util.js";
import {
  focusValues,
  hotspotsOf,
  measureIconSVG,
  phenomenonSceneHTML,
  varIconSVG,
} from "./science-lab-scene.js";

const pickBoth = (I, o) => (o ? I.S(o.en, o.es) : "");
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

/** Markup that differs by language (it holds inner spans), honouring the en / es / bilingual mode. */
function byLang(I, en, es) {
  if (I.bilingual)
    return raw(`<span class="bi-pair">${en}<span class="bi-es" lang="es">${es}</span></span>`);
  if (I.spanish) return raw(`<span lang="es">${es}</span>`);
  return raw(en);
}

// ── notice ───────────────────────────────────────────────────────────────────
export const chipText = (I, caseDef, chip) => {
  const h = hotspotsOf(caseDef).find((x) => x.id === chip.h);
  return h ? pickBoth(I, chip.k === "w" ? h.wonder : h.notice) : "";
};

function lookHTML(I, caseDef, look, chips) {
  const h = hotspotsOf(caseDef).find((x) => x.id === look);
  if (!h)
    return html`<p class="slx-obs is-empty" data-slx-obs>
      ${icon("search")}
      ${I.T("Tap a number on the picture to look closely.", "Toca un número en el dibujo para mirar de cerca.")}
    </p>`;
  const has = (k) => chips.some((c) => c.h === h.id && c.k === k);
  const add = (k, en, es) =>
    has(k)
      ? html`<p class="slx-added">
          ${icon("check")}
          ${I.T(en.replace("Add to", "Added to"), es.replace("Agregar a", "Agregado a"))}
        </p>`
      : html`<button type="button" class="btn small" data-slx-chip="${k}:${h.id}">
          ${icon("save")} ${I.T(en, es)}
        </button>`;
  return html`<div class="slx-obs" data-slx-obs>
    <p class="ex-kicker">${I.TO(h.label)}</p>
    <p class="slx-obs-n">
      <strong>${I.T("You can see:", "Puedes ver:")}</strong> ${I.TO(h.notice)}
    </p>
    <p class="slx-obs-w">
      <strong>${I.T("You might wonder:", "Te podrías preguntar:")}</strong> ${I.TO(h.wonder)}
    </p>
    <div class="row-actions">
      ${add("n", "Add to I notice", "Agregar a Noto que")}
      ${add("w", "Add to I wonder", "Agregar a Me pregunto")}
    </div>
  </div>`;
}

export function chipsHTML(I, caseDef, chips, k) {
  const mine = chips.filter((c) => c.k === k);
  if (!mine.length) return "";
  return html`<ul
    class="slx-chips"
    aria-label="${k === "w" ? I.S("Your I wonder notes", "Tus notas de Me pregunto") : I.S("Your I notice notes", "Tus notas de Noto que")}"
  >
    ${mine.map(
      (c) =>
        html`<li class="slx-chip is-${k}">
          <span>${chipText(I, caseDef, c)}</span>
          <button
            type="button"
            class="slx-chip-x"
            data-slx-unchip="${k}:${c.h}"
            aria-label="${I.S(`Remove: ${chipText(I, caseDef, c)}`, `Quitar: ${chipText(I, caseDef, c)}`)}"
          >
            ${icon("x")}
          </button>
        </li>`,
    )}
  </ul>`;
}

export function noticeSceneHTML(I, t, rec) {
  const chips = rec.chips || [];
  return html`<section class="panel sl-scene-panel" aria-labelledby="slSceneTitle">
    <h2 id="slSceneTitle">${I.T("Look closely at what happened", "Mira de cerca lo que pasó")}</h2>
    ${phenomenonSceneHTML(I, t.caseDef, { hotspots: true, look: rec.look || "" })}
    <div class="slx-obs-wrap" aria-live="polite">${lookHTML(I, t.caseDef, rec.look, chips)}</div>
  </section>`;
}

// ── question ─────────────────────────────────────────────────────────────────
function cardName(I, caseDef, id) {
  if (id === "measure") return pickBoth(I, caseDef.measure.short);
  const v = caseDef.variables.find((x) => x.id === id);
  return v ? I.S(v.label.en, v.label.es) : "";
}

export function questionBuilderHTML(I, t, rec) {
  const cd = t.caseDef;
  const pick = rec.pick || "";
  const slots = rec.slots || {};
  const card = (id, art, sub) =>
    html`<button type="button" class="slx-card" data-slx-pick="${id}" aria-pressed="${pick === id}">
      ${art}<strong>${cardName(I, cd, id)}</strong><span class="fine">${sub}</span>
    </button>`;
  const slot = (id, en, es) => {
    const now = slots[id];
    return html`<button
      type="button"
      class="slx-slot ${now ? "is-full" : ""}"
      data-slx-slot="${id}"
      aria-label="${I.S(en, es)}: ${now ? cardName(I, cd, now) : I.S("empty", "vacío")}"
    >
      <span class="slx-slot-k">${I.T(en, es)}</span>
      <span class="slx-slot-v"
        >${now ? cardName(I, cd, now) : I.T("Tap a card, then tap here", "Toca una tarjeta y luego aquí")}</span
      >
    </button>`;
  };
  const blank = (id, lang) => {
    const now = slots[id];
    const word = !now
      ? "___"
      : lc(now === "measure" ? cd.measure.short[lang] : (cd.variables.find((v) => v.id === now)?.label[lang] ?? ""));
    return `<span class="slx-blank${now ? " is-filled" : ""}">${esc(word)}</span>`;
  };
  const sentence = byLang(
    I,
    `How does ${blank("change", "en")} change ${blank("measure", "en")}?`,
    `¿Cómo cambia ${blank("measure", "es")} cuando cambia ${blank("change", "es")}?`,
  );
  const values = (v) => v.values.map((x) => I.S(x.label.en, x.label.es)).join(" · ");
  return html`<section class="panel sl-scene-panel" aria-labelledby="slBuildQTitle">
    <h2 id="slBuildQTitle">
      ${I.T("Build a question you can test", "Arma una pregunta que puedas comprobar")}
    </h2>
    <p class="slx-steps">
      ${I.T("Tap a card. Then tap the box where it goes.", "Toca una tarjeta. Luego toca la caja donde va.")}
    </p>
    <div class="slx-cards">
      ${cd.variables.map((v) => card(v.id, varIconSVG(cd, v.id), values(v)))}
      ${card("measure", measureIconSVG(cd), I.TO(cd.measure.unit))}
    </div>
    <div class="slx-slots">
      ${slot("change", "What we change", "Lo que cambiamos")}
      ${slot("measure", "What we measure", "Lo que medimos")}
    </div>
    <p class="slx-skel">${sentence}</p>
  </section>`;
}

// ── hypothesis ───────────────────────────────────────────────────────────────
export function predictionOrder(caseDef, rec) {
  const ids = focusValues(caseDef).map((v) => v.id);
  const saved = (rec?.order || []).filter((id) => ids.includes(id));
  return saved.length === ids.length ? saved : ids;
}

export function orderListHTML(I, caseDef, order, { controls = false, cls = "" } = {}) {
  const vals = focusValues(caseDef);
  const focus = caseDef.focus || caseDef.variables[0].id;
  return html`<ol class="slx-order ${cls}">
    ${order.map((id, i) => {
      const v = vals.find((x) => x.id === id);
      const name = I.S(v.label.en, v.label.es);
      const move = (dir, en, es, ico, off) =>
        html`<button
          type="button"
          class="slx-move"
          data-slx-move="${id}:${dir}"
          aria-label="${I.S(`${en}: ${name}`, `${es}: ${name}`)}"
          ${off ? raw("disabled") : ""}
        >
          ${icon(ico)}
        </button>`;
      return html`<li class="slx-order-item">
        <span class="slx-rank" aria-hidden="true">${i + 1}</span>
        ${varIconSVG(caseDef, focus, id)}
        <strong>${I.TO(v.label)}</strong>
        ${
          controls
            ? html`<span class="slx-moves"
                >${move("up", "Move up", "Subir", "arrow-left", i === 0)}${move("down", "Move down", "Bajar", "arrow-right", i === order.length - 1)}</span
              >`
            : ""
        }
      </li>`;
    })}
  </ol>`;
}

export function predictHTML(I, t, rec) {
  const cd = t.caseDef;
  const unit = cd.dataset.unit;
  return html`<section class="panel sl-scene-panel" aria-labelledby="slOrderTitle">
    <h2 id="slOrderTitle">
      ${I.T("Put them in order: what do you predict?", "Ordénalos: ¿qué predices?")}
    </h2>
    <p class="slx-steps">
      ${I.T(`Number 1 is the one you think will have the most ${unit.en}. Use the arrows to move them.`, `El número 1 es el que crees que tendrá más ${unit.es}. Usa las flechas para moverlos.`)}
    </p>
    ${orderListHTML(I, cd, predictionOrder(cd, rec), { controls: true })}
    <p class="fine">
      ${rec?.order ? I.T("Your order is saved.", "Tu orden está guardado.") : I.T("Move any card to save your order.", "Mueve cualquier tarjeta para guardar tu orden.")}
    </p>
  </section>`;
}
