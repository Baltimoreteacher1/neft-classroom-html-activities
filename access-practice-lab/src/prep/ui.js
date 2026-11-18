// Access Prep skill builders: the shared page frame and controls. Every control is a native radio, select,
// checkbox or textarea (keyboard and screen-reader ready with no extra wiring), and feedback uses the activity
// page's compact pattern: one verdict, one action, one lead line, the rest folded under "More help".
import { crumbsHTML } from "../components.js";
import { BASE, html, icon, raw } from "../util.js";

const IGN = raw("data-nsr-ignore");

export const prepHref = (slug, id, band) =>
  `${BASE}/access-prep/${slug}${id ? `/${id}` : ""}?grades=${band}`;

/** Page frame: crumbs, title block, step rail, the current step, and the step buttons. */
export function frameHTML(
  I,
  { skill, set, band, steps, step, body, canNext, nextLabel, crumbs, allHref, cls = "", hideNext = false },
) {
  const last = step === steps.length - 1;
  const all = allHref || prepHref(skill.slug, "", band);
  return html`${crumbsHTML(
      crumbs || [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Access Prep", "Preparación ACCESS"), `${BASE}/access-prep?grades=${band}`],
        [I.S(skill.title, skill.titleEs), all],
        [set.title, null],
      ],
    )}
    <article
      class="prep-skill d-${skill.domain.toLowerCase()} ${cls}"
      data-prep-slug="${skill.slug}"
      data-prep-set="${set.id}"
    >
      <header class="prep-skill-head">
        <div class="prep-head-top">
          <p class="prep-eyebrow">${icon(skill.icon)} ${I.T(skill.title, skill.titleEs)}</p>
          <p class="prep-step-counter" aria-hidden="true">
            ${I.T(`Step ${step + 1} of ${steps.length}`, `Paso ${step + 1} de ${steps.length}`)}
          </p>
        </div>
        <h1 tabindex="-1">${I.T(set.title, set.titleEs || set.title)}</h1>
        <p class="prep-chips">
          ${set.area ? html`<span class="cat-chip is-area">${set.area}</span>` : ""}
          ${set.kind ? html`<span class="cat-chip">${I.T(set.kind, KIND_ES[set.kind] || set.kind)}</span>` : ""}
          ${set.mode ? html`<span class="cat-chip">${I.T(set.mode, set.mode === "Speaking" ? "Hablar" : "Escribir")}</span>` : ""}
          <span class="cat-chip"
            >${icon("clock")}
            ${I.T(`About ${set.minutes || 6} min`, `Unos ${set.minutes || 6} min`)}</span
          >
        </p>
        <div class="prep-progress-track" aria-hidden="true">
          <span class="prep-progress-fill" style="width:${Math.round(((step + 1) / Math.max(1, steps.length)) * 100)}%"></span>
        </div>
        <ol class="prep-rail" aria-label="${I.S("Steps", "Pasos")}">
          ${steps.map(
            (s, i) =>
              html`<li
                class="${i < step ? "is-done" : ""} ${i === step ? "is-now" : ""}"
                ${i === step ? raw('aria-current="step"') : ""}
              >
                <span class="prep-rail-n" aria-hidden="true"
                  >${i < step ? icon("check") : i + 1}</span
                >
                <span>${I.T(s[0], s[1])}</span>
              </li>`,
          )}
        </ol>
      </header>
      <section class="prep-step panel" aria-labelledby="prepStepH">
        <h2 id="prepStepH" class="prep-step-h">
          <span class="prep-step-badge" aria-hidden="true">${step + 1}</span>
          <span class="visually-hidden"
            >${I.T(`Step ${step + 1} of ${steps.length}:`, `Paso ${step + 1} de ${steps.length}:`)}</span
          >
          <span>${I.T(steps[step][0], steps[step][1])}</span>
        </h2>
        ${body}
      </section>
      <nav class="prep-steps-nav" aria-label="${I.S("Move between steps", "Moverse entre pasos")}">
        ${step > 0 ? html`<button type="button" class="btn" data-prep-act="back">${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>` : html`<a class="btn" href="${all}">${I.T("All sets", "Todos los conjuntos")}</a>`}
        ${
          last
            ? html`<a class="btn btn-primary" href="${all}"
                >${I.T("Choose another set", "Elegir otro conjunto")} ${icon("arrow-right")}</a
              >`
            : hideNext
              ? ""
              : html`<button
                type="button"
                class="btn btn-primary"
                data-prep-act="next"
                ${canNext ? "" : raw('aria-disabled="true"')}
              >
                ${nextLabel || I.T("Next step", "Siguiente paso")} ${icon("arrow-right")}
              </button>`
        }
      </nav>
    </article>`;
}

const KIND_ES = { Narrate: "Narrar", Inform: "Informar", Explain: "Explicar", Argue: "Argumentar" };

/** One question as radio cards. After a check the picked card turns green or red and the right one is marked. */
export function choicesHTML(I, { name, label, options, picked, answer, checked }) {
  return html`<fieldset class="prep-q">
    <legend>${label}</legend>
    <div class="choices" role="radiogroup">
      ${options.map((o, i) => {
        const on = picked === o.id;
        const state = checked
          ? on
            ? o.id === answer
              ? "is-right"
              : "is-wrong"
            : o.id === answer && picked !== answer && checked === "reveal"
              ? "is-answer"
              : ""
          : "";
        return html`<label class="choice ${on ? "is-on" : ""} ${state}">
          <input
            type="radio"
            name="${name}"
            value="${o.id}"
            data-prep-pick="${name}"
            ${on ? raw("checked") : ""}
            ${checked && picked === answer ? raw("disabled") : ""}
            ${IGN}
          />
          <span class="choice-letter" aria-hidden="true">${String.fromCharCode(65 + i)}</span
          ><span class="opt-text">${o.text}</span>
        </label>`;
      })}
    </div>
  </fieldset>`;
}

/** A sentence with dropdown blanks. `checked` marks each blank right or wrong after Check. */
export function blanksHTML(I, { key, parts, picks = {}, result }) {
  let n = 0;
  return html`<p class="prep-blanks">
    ${parts.map((p, i) => {
      if (typeof p === "string") return p;
      n += 1;
      const ok = result?.slots?.[i];
      return html`<span class="prep-blank ${result ? (ok ? "is-right" : "is-wrong") : ""}">
        <select
          data-prep-blank="${key}:${i}"
          aria-label="${I.S(`Blank ${n}`, `Espacio ${n}`)}"
          ${result?.ok ? raw("disabled") : ""}
          ${IGN}
        >
          <option value="">${I.T("Choose…", "Elige…")}</option>
          ${p.options.map((o) => html`<option value="${o}" ${picks[i] === o ? raw("selected") : ""}>${o}</option>`)}
        </select>
      </span>`;
    })}
  </p>`;
}

/** Compact result: verdict + one action on one row, a lead line, optional folded extra help. */
export function resultHTML(I, { ok, lead, more = "", moreLabel, action = "" }) {
  return html`<div class="feedback ${ok ? "is-right" : "is-hint"}" role="status" tabindex="-1">
    <div class="fb-head">
      <p class="fb-title">
        ${icon(ok ? "check" : "retry")}
        ${ok ? I.T("Correct!", "¡Correcto!") : I.T("Not quite", "Todavía no")}
      </p>
      ${action}
    </div>
    ${lead ? html`<p class="fb-lead">${lead}</p>` : ""}
    ${
      more
        ? html`<details class="fb-more">
            <summary>${moreLabel || I.T("More help", "Más ayuda")}</summary>
            ${more}
          </details>`
        : ""
    }
  </div>`;
}

export const checkBtn = (I, act, ready, label) =>
  html`<button
    type="button"
    class="btn btn-primary"
    data-prep-act="${act}"
    ${ready ? "" : raw("disabled")}
  >
    ${label || I.T("Check my answer", "Revisar mi respuesta")}
  </button>`;

export const hearBtn = (I, text, label) =>
  html`<button type="button" class="btn small" data-say="${text}">
    ${icon("volume")} ${label || I.T("Hear it", "Escuchar")}
  </button>`;

export const hearSlowBtn = (I, text, label) =>
  html`<button type="button" class="btn small ghost" data-say="${text}" data-say-rate="0.72">
    ${icon("play")} ${label || I.T("Hear it slow", "Escuchar lento")}
  </button>`;

export const hearPairHTML = (I, text, label) =>
  html`<span class="prep-audio-pair">
    ${hearBtn(I, text, label)} ${hearSlowBtn(I, text)}
  </span>`;

export function familyTeacherHTML(I, set) {
  if (!set.familyTalk && !set.teacherTip) return "";
  return html`<aside class="prep-adults" aria-label="${I.S("For families and teachers", "Para familias y docentes")}">
    ${
      set.familyTalk
        ? html`<div class="prep-adult-card is-family">
            <p class="prep-adult-h">${icon("families")} <strong>${I.T("For families · Talk at home", "Para familias · Hablar en casa")}</strong></p>
            <p>${set.familyTalk.en}</p>
            <p class="prep-es" lang="es">${set.familyTalk.es}</p>
          </div>`
        : ""
    }
    ${
      set.teacherTip
        ? html`<div class="prep-adult-card is-teacher">
            <p class="prep-adult-h">${icon("teacher")} <strong>${I.T("For teachers · Classroom routine", "Para docentes · Rutina de aula")}</strong></p>
            <p>${I.T(set.teacherTip.en, set.teacherTip.es)}</p>
          </div>`
        : ""
    }
  </aside>`;
}
