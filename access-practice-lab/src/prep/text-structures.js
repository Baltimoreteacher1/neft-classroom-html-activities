// Text Structures: three short texts on one topic, each organized a different way (description, sequence, compare,
// cause and effect, problem and solution). Name the structure, see the signal words that gave it away, then fill
// the organizer that fits. ACCESS Reading asks for exactly this kind of reading for organization.
import { esc, html, icon, raw } from "../util.js";
import { seededOrder, STRUCTURES } from "./model.js";
import { PREP_SKILLS } from "./registry.js";
import { checkBtn, hearBtn, resultHTML } from "./ui.js";

export const skill = PREP_SKILLS["text-structures"];
export const finishesOnLastStep = true;

const IDS = Object.keys(STRUCTURES);
const name = (I, id) => I.T(STRUCTURES[id].en, STRUCTURES[id].es);

function structureTableHTML(I) {
  return html`<ul class="prep-structs">
    ${IDS.map(
      (id) =>
        html`<li class="prep-struct">
          <strong>${name(I, id)}</strong>
          <span>${I.T("Signal words:", "Palabras señal:")} <em>${STRUCTURES[id].signals}</em></span>
          <span
            >${I.T("Organizer:", "Organizador:")}
            ${I.T(STRUCTURES[id].org[0], STRUCTURES[id].org[1])}</span
          >
        </li>`,
    )}
  </ul>`;
}

function markSignals(text, signals) {
  let out = esc(text);
  for (const w of [...signals].sort((a, b) => b.length - a.length))
    out = out.replace(
      new RegExp(`(^|[^\\w>])(${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})(?![\\w<])`),
      "$1<mark>$2</mark>",
    );
  return raw(out);
}

function organizerHTML(I, set, p, i, st) {
  const picks = st.answers?.[`org${i}`] || {};
  const res = st.checked?.[`org${i}`];
  return html`<div class="prep-organizer is-${p.structure}">
    <h3 class="prep-sub">${I.T(STRUCTURES[p.structure].org[0], STRUCTURES[p.structure].org[1])}</h3>
    ${p.organizer.parts.map((part, j) => {
      const ok = res?.slots?.[j];
      return html`<label class="prep-slot ${res ? (ok ? "is-right" : "is-wrong") : ""}">
        <span class="prep-slot-label">${res ? icon(ok ? "check" : "x") : ""} ${part.label}</span>
        <select data-prep-blank="org${i}:${j}" ${res?.ok ? raw("disabled") : ""} data-nsr-ignore>
          <option value="">${I.T("Choose…", "Elige…")}</option>
          ${seededOrder(part.options, `${set.id}:${i}:${j}`).map((o) => html`<option value="${o}" ${picks[j] === o ? raw("selected") : ""}>${o}</option>`)}
        </select>
      </label>`;
    })}
    ${
      res?.ok
        ? ""
        : checkBtn(
            I,
            `check-org-${i}`,
            p.organizer.parts.every((_, j) => picks[j]),
            I.T("Check my organizer", "Revisar mi organizador"),
          )
    }
    ${
      res
        ? resultHTML(I, {
            ok: res.ok,
            lead: res.ok
              ? I.T("Your organizer matches the text.", "Tu organizador coincide con el texto.")
              : I.T(
                  `${res.right} of ${res.total} are right. Find each one in the text.`,
                  `${res.right} de ${res.total} están bien. Busca cada una en el texto.`,
                ),
          })
        : ""
    }
  </div>`;
}

function passageHTML(I, set, i, st) {
  const p = set.passages[i];
  const picked = st.answers?.[`p${i}`];
  const res = st.checked?.[`p${i}`];
  const solved = res?.ok;
  return html`<article class="prep-passage">
      <h3 class="prep-passage-h">${p.title} ${hearBtn(I, p.text)}</h3>
      <p>${solved ? markSignals(p.text, p.signals) : p.text}</p>
    </article>
    <fieldset class="prep-q">
      <legend>${I.T("How is this text organized?", "¿Cómo está organizado este texto?")}</legend>
      <div class="choices" role="radiogroup">
        ${IDS.map((id, k) => {
          const on = picked === id;
          const state = res && on ? (res.ok ? "is-right" : "is-wrong") : "";
          return html`<label class="choice ${on ? "is-on" : ""} ${state}">
            <input
              type="radio"
              name="p${i}"
              value="${id}"
              data-prep-pick="p${i}"
              ${on ? raw("checked") : ""}
              ${solved ? raw("disabled") : ""}
              data-nsr-ignore
            />
            <span class="choice-letter" aria-hidden="true">${String.fromCharCode(65 + k)}</span
            ><span class="opt-text">${name(I, id)}</span>
          </label>`;
        })}
      </div>
    </fieldset>
    ${solved ? "" : checkBtn(I, `check-p-${i}`, Boolean(picked))}
    ${
      res
        ? resultHTML(I, {
            ok: res.ok,
            lead: res.ok
              ? I.T(
                  `The signal words ${p.signals.join(", ")} show ${STRUCTURES[p.structure].en.toLowerCase()}. They are marked in the text.`,
                  `Las palabras señal ${p.signals.join(", ")} muestran ${STRUCTURES[p.structure].es.toLowerCase()}. Están marcadas en el texto.`,
                )
              : I.T(
                  "Find the signal words in the text. Which structure do they belong to?",
                  "Busca las palabras señal en el texto. ¿A qué estructura pertenecen?",
                ),
            more: res.ok ? "" : structureTableHTML(I),
            moreLabel: I.T("Signal words for each structure", "Palabras señal de cada estructura"),
          })
        : ""
    }
    ${solved ? organizerHTML(I, set, p, i, st) : ""}`;
}

export function body(I, set, st, step) {
  if (step === 0)
    return html`<p class="prep-lede">
        ${I.T("Writers organize information in five common ways. Signal words help you tell which one.", "Los escritores organizan la información de cinco formas comunes. Las palabras señal te ayudan a saber cuál es.")}
      </p>
      ${structureTableHTML(I)}`;
  if (step <= 3) return passageHTML(I, set, step - 1, st);
  return html`<div class="feedback is-right" role="status">
      <p class="fb-title">${icon("check")} ${I.T("Set complete", "Conjunto completo")}</p>
      <p class="fb-lead">
        ${I.T("You named three structures and filled three organizers.", "Nombraste tres estructuras y completaste tres organizadores.")}
      </p>
    </div>
    <ul class="prep-review">
      ${set.passages.map((p) => html`<li><strong>${p.title}</strong>: ${name(I, p.structure)} · <em>${p.signals.join(", ")}</em></li>`)}
    </ul>
    <p class="fine">
      ${I.T("Next time you read, look for signal words first. They tell you how to take notes.", "La próxima vez que leas, busca primero las palabras señal. Te dicen cómo tomar notas.")}
    </p>
    <p>
      <button type="button" class="btn" data-prep-act="restart">
        ${icon("replay")} ${I.T("Do this set again", "Hacer este conjunto otra vez")}
      </button>
    </p>`;
}

export function ready(set, st, step) {
  if (step >= 1 && step <= 3)
    return Boolean(st.checked?.[`p${step - 1}`]?.ok && st.checked?.[`org${step - 1}`]?.ok);
  return true;
}

export function notReady(I, set, st, step) {
  if (step >= 1 && step <= 3)
    return st.checked?.[`p${step - 1}`]?.ok
      ? I.S("Check your organizer first.", "Primero revisa tu organizador.")
      : I.S("Name the structure first.", "Primero nombra la estructura.");
  return "";
}

export function act(name, el, set, st) {
  st.checked ||= {};
  let m = /^check-p-(\d)$/.exec(name);
  if (m) {
    const i = Number(m[1]);
    st.checked[`p${i}`] = { ok: st.answers?.[`p${i}`] === set.passages[i].structure };
    return { focus: ".prep-step .feedback" };
  }
  m = /^check-org-(\d)$/.exec(name);
  if (m) {
    const i = Number(m[1]);
    const parts = set.passages[i].organizer.parts;
    const picks = st.answers?.[`org${i}`] || {};
    const slots = Object.fromEntries(parts.map((x, j) => [j, picks[j] === x.answer]));
    const right = Object.values(slots).filter(Boolean).length;
    st.checked[`org${i}`] = { ok: right === parts.length, right, total: parts.length, slots };
    return { focus: ".prep-organizer .feedback" };
  }
  return false;
}
