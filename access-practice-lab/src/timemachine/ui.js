// Language Time Machine — shared page pieces and the writing comparison (docs/part2-integration-map.md, system D).
// Markup only: every value comes from collect.js / compare.js / reflect.js. Rules kept here: each change statement
// sits next to the exact quoted words it points to; the support context is printed beside each text; no score, level
// or percentage is rendered; the page says that longer is not automatically better.
import { BASE, formatDate, html, icon } from "../util.js";
import { historyFor } from "./collect.js";
import { DIMENSIONS, REASON_LABEL, STAGE_LABEL, markQuotes, supportLabel } from "./compare.js";
import { supportContext } from "./collect.js";
import { PROMPTS } from "./reflect.js";

export const TABS = Object.freeze([
  { id: "writing", label: ["Writing", "Escritura"], icon: "writing" },
  { id: "speaking", label: ["Speaking", "Expresión oral"], icon: "speaking" },
  { id: "challenge", label: ["New challenge", "Reto nuevo"], icon: "sparkle" },
  { id: "reflections", label: ["My reflections", "Mis reflexiones"], icon: "star" },
  {
    id: "evidence",
    label: ["Evidence (for my teacher)", "Evidencia (para mi maestro o maestra)"],
    icon: "print",
  },
]);

export const day = (t) =>
  t ? formatDate(String(t).slice(0, 10), { month: "short", day: "numeric", year: "numeric" }) : "";
export const tmHref = (band, tab, params = {}) => {
  const q = new URLSearchParams({ tab, ...params, grades: band });
  return `${BASE}/time-machine?${q}`;
};
export const fieldId = (...parts) => `tm-${parts.join("-").replace(/[^a-z0-9-]/gi, "_")}`;

export function headHTML(I, band, tab, counts) {
  return html`<header class="tm-head">
      <p class="eyebrow">
        ${I.T("Part of my Passport and Portfolio", "Parte de mi Pasaporte y mi Portafolio")}
      </p>
      <h1 id="tmTitle" tabindex="-1">
        ${I.T("Language Time Machine", "Máquina del tiempo del lenguaje")}
      </h1>
      <p class="tm-lead">
        ${I.T("Put an earlier piece of your work beside a later one. See what changed, in your own words.", "Pon un trabajo anterior junto a uno posterior. Mira qué cambió, con tus propias palabras.")}
      </p>
    </header>
    <nav
      class="tm-tabs no-print"
      aria-label="${I.S("Time Machine sections", "Secciones de la Máquina del tiempo")}"
    >
      ${TABS.map(
        (t) =>
          html`<a
            class="chip tm-tab${t.id === tab ? " is-on" : ""}"
            href="${tmHref(band, t.id)}"
            ${t.id === tab ? html`aria-current="page"` : ""}
            >${icon(t.icon)}
            ${I.T(...t.label)}${counts[t.id] ? html` <span class="tm-n">(${counts[t.id]})</span>` : ""}</a
          >`,
      )}
    </nav>`;
}

/** Under two comparable pieces: say so plainly and offer a first task. */
export function emptyHTML(I, band, kind, singles = []) {
  const speaking = kind === "speaking";
  return html`<section class="panel tm-empty" aria-labelledby="tmEmpty">
    <h2 id="tmEmpty">
      ${I.T("Not enough to compare yet", "Todavía no hay suficiente para comparar")}
    </h2>
    <p>
      ${
        speaking
          ? I.T(
              "You need two speaking pieces on the same task, or on the same language goal in a new context. Each one needs a kept recording or its words.",
              "Necesitas dos piezas de expresión oral de la misma tarea, o de la misma meta de lenguaje en un contexto nuevo. Cada una necesita una grabación guardada o sus palabras.",
            )
          : I.T(
              "You need two pieces of writing on the same task, or on the same language goal in a new context.",
              "Necesitas dos escritos de la misma tarea, o de la misma meta de lenguaje en un contexto nuevo.",
            )
      }
    </p>
    <p class="row-actions">
      <a class="btn btn-primary" href="${BASE}/${speaking ? "speak" : "write"}?grades=${band}"
        >${speaking ? I.T("Do a first speaking task", "Hacer una primera tarea de expresión oral") : I.T("Do a first writing task", "Hacer una primera tarea de escritura")}</a
      >
    </p>
    ${
      singles.length
        ? html`<h3>${I.T("One piece so far", "Una pieza hasta ahora")}</h3>
            <ul class="tm-list">
              ${singles.slice(-4).map(
                (x) =>
                  html`<li>
                    <span lang="en">${x.taskTitle}</span> · ${day(x.t)}
                    <a class="btn small" href="${tmHref(band, "challenge", { from: x.id })}"
                      >${I.T("Try it in a new context", "Probarlo en un contexto nuevo")}</a
                    >
                  </li>`,
              )}
            </ul>`
        : ""
    }
  </section>`;
}

/** The list of pairs for one kind; the open one is marked. */
export function pairListHTML(I, band, tab, pairs, currentId) {
  return html`<nav
    class="tm-pairs no-print"
    aria-label="${I.S("Pairs I can compare", "Pares que puedo comparar")}"
  >
    <h2 class="tm-h">${I.T("Pairs I can compare", "Pares que puedo comparar")}</h2>
    <ul>
      ${pairs.slice(0, 12).map(
        (p) =>
          html`<li>
            <a
              class="tm-pairlink${p.id === currentId ? " is-on" : ""}"
              href="${tmHref(band, tab, { pair: p.id })}"
              ${p.id === currentId ? html`aria-current="true"` : ""}
            >
              <strong lang="en">${p.later.taskTitle}</strong>
              <span class="fine"
                >${day(p.earlier.t)} → ${day(p.later.t)} · ${I.T(...REASON_LABEL[p.reason])}</span
              >
            </a>
          </li>`,
      )}
    </ul>
  </nav>`;
}

/** The pair's heading: the task, why the two pieces can be compared, and the language goal. */
export function pairHeadHTML(I, pair) {
  const same = pair.reason === "same-task";
  return html`<header class="tm-pairhead">
    <h2 id="tmPair" tabindex="-1" lang="en">${pair.later.taskTitle}</h2>
    <p class="tm-tags">
      <span class="tm-tag">${I.T(...REASON_LABEL[pair.reason])}</span>
      ${pair.keyUse ? html`<span class="tm-tag">${I.T("Language goal:", "Meta de lenguaje:")} <span lang="en">${pair.keyUse}</span></span>` : ""}
    </p>
    <p class="fine">
      ${
        same
          ? I.T(
              "These two pieces answer the same task, so they are fair to compare.",
              "Estas dos piezas responden a la misma tarea, así que es justo compararlas.",
            )
          : I.T(
              "These two pieces have the same language goal in different contexts. Compare what the language does, not the topic.",
              "Estas dos piezas tienen la misma meta de lenguaje en contextos distintos. Compara lo que hace el lenguaje, no el tema.",
            )
      }
    </p>
  </header>`;
}

/** Response → revision → new context, as a small dated list. */
export function historyHTML(I, items, pair) {
  const steps = historyFor(items, pair);
  if (steps.length < 3 && !steps.some((s) => s.stage !== "first")) return "";
  return html`<section class="tm-history" aria-labelledby="tmHist">
    <h3 id="tmHist">${I.T("How this work moved", "Cómo avanzó este trabajo")}</h3>
    <ol class="tm-steps">
      ${steps.map(
        (s) =>
          html`<li
            class="tm-step${s.id === pair.earlier.id || s.id === pair.later.id ? " is-shown" : ""}"
          >
            <strong>${I.T(...(STAGE_LABEL[s.stage] || STAGE_LABEL.first))}</strong>
            <span class="fine">${day(s.t)} · ${I.T(...supportLabel(supportContext(s)))}</span>
            ${s.id === pair.earlier.id ? html`<span class="tm-tag">${I.T("earlier, shown below", "anterior, abajo")}</span>` : ""}
            ${s.id === pair.later.id ? html`<span class="tm-tag">${I.T("later, shown below", "posterior, abajo")}</span>` : ""}
          </li>`,
      )}
    </ol>
  </section>`;
}

const quotesFor = (changes, side) =>
  changes
    .map((c, n) => ({ id: `${side}${n}`, quote: side === "a" ? c.beforeQuote : c.afterQuote }))
    .filter((q) => q.quote);

/** A learner's text with each quoted run marked where it sits. */
export function markedTextHTML(text, changes, side) {
  return html`<p class="tm-text" lang="en">
    ${markQuotes(text, quotesFor(changes, side)).map((seg) => (seg.mark === null ? seg.text : html`<mark class="tm-mark" id="tmq-${seg.mark}" tabindex="-1">${seg.text}</mark>`))}
  </p>`;
}

/** The label block of one side: when, which stage, how it was done, the task, a teacher note. */
export function itemMetaHTML(I, x, side) {
  return html`<figcaption class="tm-cap">
    <strong>${side === "a" ? I.T("Earlier", "Anterior") : I.T("Later", "Posterior")}</strong> ·
    ${day(x.t)} · ${I.T(...(STAGE_LABEL[x.stage] || STAGE_LABEL.first))}
    <span class="tm-support${x.independent ? " is-own" : ""}"
      >${I.T("How I did it:", "Cómo lo hice:")} ${I.T(...supportLabel(supportContext(x)))}</span
    >
    ${x.prompt ? html`<span class="tm-prompt"><span class="fine">${I.T("Task:", "Tarea:")}</span> <span lang="en">${x.prompt}</span></span>` : ""}
  </figcaption>`;
}
export const teacherNoteHTML = (I, x) =>
  x.teacherNote
    ? html`<p class="tm-note">
        <strong>${I.T("My teacher wrote:", "Mi maestro o maestra escribió:")}</strong>
        <span lang="en">${x.teacherNote}</span>
      </p>`
    : "";

export function sideHTML(I, x, side, changes) {
  return html`<figure class="tm-side tm-side-${side}">
    ${itemMetaHTML(I, x, side)}${markedTextHTML(x.text, changes, side)}${teacherNoteHTML(I, x)}
  </figure>`;
}

/** The change statements. Each one shows its quote and a button that moves to the same words in the text above. */
export function changesHTML(I, cmp) {
  const quoteBtn = (id, quote, en, es) =>
    quote
      ? html`<span class="tm-quote">
          <span class="fine">${I.T(en, es)}</span>
          <q lang="en">${quote}</q>
          <button type="button" class="btn small tm-show" data-tm-show="tmq-${id}">
            ${I.T("Show it in my text", "Mostrarlo en mi texto")}
          </button>
        </span>`
      : "";
  return html`<section class="tm-changes" aria-labelledby="tmChanges">
    <h3 id="tmChanges">${I.T("What changed", "Qué cambió")}</h3>
    <p class="tm-caution">${icon("info")} ${I.T(...cmp.caution)}</p>
    ${cmp.notes.map((n) => html`<p class="tm-caution">${icon("info")} ${I.T(...n)}</p>`)}
    ${
      cmp.changes.length
        ? html`<ul class="tm-changelist">
            ${cmp.changes.map(
              (c, n) =>
                html`<li class="tm-change">
                  <span class="tm-tag">${I.T(...DIMENSIONS[c.dimension])}</span>
                  <p>${I.T(...c.text)}</p>
                  ${quoteBtn(`a${n}`, c.beforeQuote, "Earlier:", "Antes:")}${quoteBtn(`b${n}`, c.afterQuote, "Later:", "Después:")}
                </li>`,
            )}
          </ul>`
        : html`<p role="status">
            ${
              cmp.comparable
                ? I.T(
                    "The checker found no change it can point to with a quote. It only knows a few patterns. Read both pieces and decide for yourself.",
                    "El revisor no encontró ningún cambio que pueda señalar con una cita. Solo conoce algunos patrones. Lee las dos piezas y decide por tu cuenta.",
                  )
                : I.T(
                    "One of these pieces has no words saved, so there is nothing to quote. Listen to both and decide for yourself.",
                    "Una de estas piezas no tiene palabras guardadas, así que no hay nada que citar. Escucha las dos y decide por tu cuenta.",
                  )
            }
          </p>`
    }
    ${
      cmp.kept.length
        ? html`<h4>${I.T("What stayed", "Lo que se mantuvo")}</h4>
            <ul class="tm-changelist">
              ${cmp.kept.map((c) => html`<li class="tm-change"><p>${I.T(...c.text)}</p></li>`)}
            </ul>`
        : ""
    }
    <p class="fine">
      ${I.T("These notes come from simple rules that read your words. They are not a grade, a level or a test result.", "Estas notas vienen de reglas sencillas que leen tus palabras. No son una calificación, un nivel ni un resultado de prueba.")}
    </p>
  </section>`;
}

/** New challenge + share with my teacher, under a pair. */
export function pairActionsHTML(I, band, pair, { inClass, share }) {
  const status = {
    sending: I.T("Sending…", "Enviando…"),
    sent: I.T(
      "Sent to your teacher's review list.",
      "Enviado a la lista de revisión de tu maestro o maestra.",
    ),
    "no-class": I.T(
      "Join a class first (ask your teacher for the class code). Nothing was sent.",
      "Primero únete a una clase (pide el código a tu maestro o maestra). No se envió nada.",
    ),
    failed: I.T(
      "It could not be sent. Check the connection and try again. Nothing was sent.",
      "No se pudo enviar. Revisa la conexión e inténtalo de nuevo. No se envió nada.",
    ),
  }[share?.state];
  return html`<section class="tm-actions no-print" aria-labelledby="tmNext">
    <h3 id="tmNext">${I.T("What next?", "¿Qué sigue?")}</h3>
    <div class="row-actions">
      <a class="btn btn-primary" href="${tmHref(band, "challenge", { from: pair.later.id })}"
        >${icon("sparkle")} ${I.T("Try it in a new context", "Probarlo en un contexto nuevo")}</a
      >
      <button
        type="button"
        class="btn"
        data-tm-share="${pair.id}"
        ${share?.state === "sending" ? html`disabled` : ""}
      >
        ${icon("mail")}
        ${I.T("Share this comparison with my teacher", "Compartir esta comparación con mi maestro o maestra")}
      </button>
    </div>
    <p class="fine">
      ${
        inClass
          ? I.T(
              "Sharing sends both texts, the dates, how you did each one, the change notes and your reflection to your teacher. Your name is not in it. Nothing is sent until you press the button.",
              "Compartir envía los dos textos, las fechas, cómo hiciste cada uno, las notas de cambio y tu reflexión a tu maestro o maestra. Tu nombre no va incluido. No se envía nada hasta que presionas el botón.",
            )
          : I.T(
              "Nothing leaves this device. To share, join your class first. You can also print the Evidence section.",
              "Nada sale de este dispositivo. Para compartir, primero únete a tu clase. También puedes imprimir la sección de Evidencia.",
            )
      }
    </p>
    ${status ? html`<p class="tm-status" role="status">${status}</p>` : share?.sharedAt ? html`<p class="fine">${I.T(`Shared on ${day(share.sharedAt)}.`, `Compartido el ${day(share.sharedAt)}.`)}</p>` : ""}
  </section>`;
}

/** The four reflection prompts for one pair: write, or record an answer. */
export function reflectionFormHTML(I, pair, r, { canRecord, recording, urls = {} }) {
  return html`<section class="tm-reflect" aria-labelledby="tmReflect">
    <h3 id="tmReflect">${icon("star")} ${I.T("My reflection", "Mi reflexión")}</h3>
    <p class="fine no-print">
      ${I.T("Answer in writing or record your answer. Any language is fine. It is saved on this device as you type.", "Responde por escrito o graba tu respuesta. Cualquier idioma está bien. Se guarda en este dispositivo mientras escribes.")}
    </p>
    ${PROMPTS.map((p) => {
      const id = fieldId("r", p.id);
      const on = recording === p.id;
      return html`<div class="tm-prompt-row">
        <label class="tm-label" for="${id}">${I.T(...p.q)}</label>
        <span class="fine" id="${id}-hint">${I.T(...p.hint)}</span>
        <textarea
          id="${id}"
          rows="2"
          maxlength="600"
          data-tm-reflect="${p.id}"
          data-tm-pair="${pair.id}"
          aria-describedby="${id}-hint"
          data-gramm="false"
        >
${r.answers?.[p.id] || ""}</textarea>
        ${
          r.audio?.[p.id]
            ? html`<div class="tm-audio-row">
                ${urls[r.audio[p.id]] ? html`<audio controls preload="metadata" src="${urls[r.audio[p.id]]}" aria-label="${I.S(`My recorded answer: ${p.q[0]}`, `Mi respuesta grabada: ${p.q[1]}`)}"></audio>` : html`<span class="fine">${I.T("The recorded answer is no longer kept (recordings are kept for 30 days).", "La respuesta grabada ya no está guardada (las grabaciones se guardan 30 días).")}</span>`}
                <button
                  type="button"
                  class="btn small no-print"
                  data-tm-unrec="${p.id}"
                  data-tm-pair="${pair.id}"
                >
                  ${I.T("Remove recording", "Quitar grabación")}
                </button>
              </div>`
            : canRecord
              ? html`<button
                  type="button"
                  class="btn small no-print"
                  data-tm-rec="${p.id}"
                  data-tm-pair="${pair.id}"
                  aria-pressed="${on ? "true" : "false"}"
                >
                  ${icon("speaking")}
                  ${on ? I.T("Stop and keep my answer", "Parar y guardar mi respuesta") : I.T("Record my answer", "Grabar mi respuesta")}
                </button>`
              : ""
        }
      </div>`;
    })}
    <p class="tm-status" role="status" data-tm-saved></p>
  </section>`;
}

/** The writing comparison for one pair. */
export function writingPairHTML(I, band, model, pair, cmp, extra) {
  return html`<article class="panel tm-pair" aria-labelledby="tmPair">
    ${pairHeadHTML(I, pair)}${historyHTML(I, model.items, pair)}
    <div class="tm-sides">
      ${sideHTML(I, pair.earlier, "a", cmp.changes)}${sideHTML(I, pair.later, "b", cmp.changes)}
    </div>
    ${changesHTML(I, cmp)}${reflectionFormHTML(I, pair, extra.reflection, extra)}${pairActionsHTML(I, band, pair, extra)}
  </article>`;
}
