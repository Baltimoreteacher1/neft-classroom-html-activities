// Rater's Eye: read a speaking or writing task, compare three student answers, rank them, name what makes the
// strongest one stronger (organized by the three things raters look at: the whole answer, the sentences, the
// words), then upgrade the weakest answer. Learners see what "a stronger answer" means before they write their own.
import { PREP_SKILLS } from "./registry.js";
import { html, icon, raw } from "../util.js";
import { checkBuild, checkFeatures, checkRanking, DIMENSIONS } from "./model.js";
import { blanksHTML, checkBtn, hearBtn, resultHTML } from "./ui.js";

export const skill = PREP_SKILLS["raters-eye"];

const letter = (set, id) => String.fromCharCode(65 + set.responses.findIndex((r) => r.id === id));
const responseText = (set, id) => set.responses.find((r) => r.id === id)?.text || "";
const PLACES = [
  ["Strongest", "La más fuerte"],
  ["Middle", "La del medio"],
  ["Weakest", "La más débil"],
];

function dimsHTML(I) {
  return html`<ul class="prep-dims">
    ${Object.entries(DIMENSIONS).map(([k, d]) => html`<li class="prep-dim is-${k}"><strong>${I.T(d[0], d[1])}</strong><span>${I.T(d[2], d[3])}</span></li>`)}
  </ul>`;
}

function answersHTML(I, set, { compact = false } = {}) {
  return html`<ol class="prep-answers ${compact ? "is-compact" : ""}">
    ${set.responses.map(
      (r) =>
        html`<li class="prep-answer">
          <p class="prep-answer-h">
            <strong>${I.T(`Answer ${letter(set, r.id)}`, `Respuesta ${letter(set, r.id)}`)}</strong>
            ${hearBtn(I, r.text)}
          </p>
          <p>${r.text}</p>
        </li>`,
    )}
  </ol>`;
}

const promptHTML = (I, set) =>
  html`<blockquote class="prep-prompt">
    <p>${set.prompt}</p>
    ${set.promptEs ? html`<p class="prep-es" lang="es">${set.promptEs}</p>` : ""}
  </blockquote>`;

function rankHTML(I, set, st) {
  const order = st.answers?.rank || {};
  const res = st.checked?.rank;
  const reveal = st.reveal?.rank;
  const pickFor = (i) => (reveal ? set.ranking[i] : order[i]);
  return html`${answersHTML(I, set, { compact: true })}
    <div class="prep-rank">
      ${PLACES.map(
        ([en, es], i) =>
          html`<label
            class="prep-slot ${res ? (set.ranking[i] === order[i] ? "is-right" : "is-wrong") : ""}"
          >
            <span class="prep-slot-label">${i + 1}. ${I.T(en, es)}</span>
            <select
              data-prep-blank="rank:${i}"
              ${res?.ok || reveal ? raw("disabled") : ""}
              data-nsr-ignore
            >
              <option value="">${I.T("Choose an answer…", "Elige una respuesta…")}</option>
              ${set.responses.map((r) => html`<option value="${r.id}" ${pickFor(i) === r.id ? raw("selected") : ""}>${I.T(`Answer ${letter(set, r.id)}`, `Respuesta ${letter(set, r.id)}`)}</option>`)}
            </select>
          </label>`,
      )}
    </div>
    ${res?.ok || reveal ? "" : checkBtn(I, "check-rank", [0, 1, 2].every((i) => order[i]) && new Set(Object.values(order)).size === 3, I.T("Check my ranking", "Revisar mi orden"))}
    ${rankFeedback(I, set, st)}`;
}

function rankFeedback(I, set, st) {
  const res = st.checked?.rank;
  if (st.reveal?.rank)
    return resultHTML(I, {
      ok: false,
      lead: I.T(
        `Strongest to weakest: ${set.ranking.map((id) => letter(set, id)).join(", ")}. Next, find out why.`,
        `De la más fuerte a la más débil: ${set.ranking.map((id) => letter(set, id)).join(", ")}. Ahora descubre por qué.`,
      ),
    });
  if (!res) return "";
  if (res.ok)
    return resultHTML(I, {
      ok: true,
      lead: I.T(
        `Answer ${letter(set, set.ranking[0])} is the strongest. Next, name why.`,
        `La respuesta ${letter(set, set.ranking[0])} es la más fuerte. Ahora di por qué.`,
      ),
    });
  return resultHTML(I, {
    ok: false,
    lead: res.strongest
      ? I.T(
          "You found the strongest answer. Look again at the other two: which one gives a reason?",
          "Encontraste la respuesta más fuerte. Mira otra vez las otras dos: ¿cuál da una razón?",
        )
      : I.T(
          "Look again. The strongest answer explains more and connects its ideas.",
          "Mira otra vez. La respuesta más fuerte explica más y conecta sus ideas.",
        ),
    more: dimsHTML(I),
    moreLabel: I.T("What raters look for", "Lo que buscan los evaluadores"),
    action:
      (st.tries?.rank || 0) >= 2
        ? html`<button type="button" class="btn small" data-prep-act="reveal-rank">
            ${I.T("Show the order", "Mostrar el orden")}
          </button>`
        : "",
  });
}

function featuresHTML(I, set, st) {
  const picked = new Set(st.answers?.features || []);
  const res = st.checked?.features;
  const best = set.ranking[0];
  return html`<div class="prep-answer is-best">
      <p class="prep-answer-h">
        <strong
          >${I.T(`Answer ${letter(set, best)} (strongest)`, `Respuesta ${letter(set, best)} (la más fuerte)`)}</strong
        >
        ${hearBtn(I, responseText(set, best))}
      </p>
      <p>${responseText(set, best)}</p>
    </div>
    <fieldset class="prep-q">
      <legend>
        ${I.T("Why is it stronger? Check every true reason.", "¿Por qué es más fuerte? Marca cada razón verdadera.")}
      </legend>
      <div class="choices">
        ${set.features.map((f) => {
          const on = picked.has(f.id);
          const state = res && on ? (f.right ? "is-right" : "is-wrong") : "";
          return html`<label class="choice ${on ? "is-on" : ""} ${state}">
            <input
              type="checkbox"
              value="${f.id}"
              data-prep-box="features"
              ${on ? raw("checked") : ""}
              ${res?.ok ? raw("disabled") : ""}
              data-nsr-ignore
            />
            <span class="opt-text"
              >${f.text}${res && on ? html`<span class="prep-why">${f.right ? html`<span class="prep-dim-tag is-${f.dim}">${I.T(DIMENSIONS[f.dim][0], DIMENSIONS[f.dim][1])}</span>` : ""} ${f.why}</span>` : ""}</span
            >
          </label>`;
        })}
      </div>
    </fieldset>
    ${res?.ok ? "" : checkBtn(I, "check-features", picked.size > 0)}
    ${
      res
        ? resultHTML(I, {
            ok: res.ok,
            lead: res.ok
              ? I.T(
                  "You named what raters notice: the whole answer, the sentences and the words.",
                  "Nombraste lo que notan los evaluadores: la respuesta completa, las oraciones y las palabras.",
                )
              : [
                  res.wrong.length ? I.T(`${res.wrong.length === 1 ? "One reason you checked is" : `${res.wrong.length} reasons you checked are`} not why it is stronger. Read the note under it.`, `${res.wrong.length === 1 ? "Una razón que marcaste no explica" : `${res.wrong.length} razones que marcaste no explican`} por qué es más fuerte. Lee la nota.`) : "",
                  res.missed.length ? I.T(`${res.missed.length === 1 ? "One more true reason is" : `${res.missed.length} more true reasons are`} still unchecked.`, `${res.missed.length === 1 ? "Falta marcar una razón verdadera" : `Faltan ${res.missed.length} razones verdaderas`}.`) : "",
                ].filter(Boolean).join(" "),
          })
        : ""
    }`;
}

function upgradeHTML(I, set, st) {
  const up = set.upgrade;
  const res = st.checked?.upgrade;
  const reveal = st.reveal?.upgrade;
  const done = res?.ok || reveal;
  return html`<div class="prep-answer is-weak">
      <p class="prep-answer-h">
        <strong
          >${I.T(`Answer ${letter(set, up.from)} (weakest)`, `Respuesta ${letter(set, up.from)} (la más débil)`)}</strong
        >
      </p>
      <p>${responseText(set, up.from)}</p>
    </div>
    <p>
      ${I.T("Make it stronger. Choose the word or connector that makes each part clearer.", "Hazla más fuerte. Elige la palabra o el conector que hace más clara cada parte.")}
    </p>
    ${reveal ? "" : blanksHTML(I, { key: "upgrade", parts: up.parts, picks: st.answers?.upgrade, result: res })}
    ${
      done
        ? ""
        : checkBtn(
            I,
            "check-upgrade",
            up.parts.every((p, i) => typeof p === "string" || st.answers?.upgrade?.[i]),
          )
    }
    ${
      done
        ? html`${resultHTML(I, { ok: Boolean(res?.ok), lead: I.T("Here is the upgraded answer.", "Esta es la respuesta mejorada."), action: hearBtn(I, up.model) })}
            <p class="prep-model">${up.model}</p>
            <p class="prep-dim-row">
              ${I.T("This upgrade worked on:", "Esta mejora trabajó en:")}
              ${[...new Set(up.dims)].map((d) => html`<span class="prep-dim-tag is-${d}">${I.T(DIMENSIONS[d][0], DIMENSIONS[d][1])}</span>`)}
            </p>
            <p>
              <button type="button" class="btn btn-primary" data-prep-act="finish">
                ${icon("check")} ${I.T("Finish this set", "Terminar este conjunto")}
              </button>
              ${st.done ? html`<span class="prep-set-done">${icon("check")} ${I.T("Saved on this device", "Guardado en este dispositivo")}</span>` : ""}
            </p>`
        : res
          ? resultHTML(I, {
              ok: false,
              lead: I.T(
                `${res.right} of ${res.total} choices make it stronger. Pick the more exact word or the connector that shows how ideas link.`,
                `${res.right} de ${res.total} opciones la hacen más fuerte. Elige la palabra más exacta o el conector que muestra cómo se unen las ideas.`,
              ),
              action:
                (st.tries?.upgrade || 0) >= 2
                  ? html`<button type="button" class="btn small" data-prep-act="reveal-upgrade">
                      ${I.T("Show the upgrade", "Mostrar la mejora")}
                    </button>`
                  : "",
            })
          : ""
    }`;
}

export function body(I, set, st, step) {
  if (step === 0)
    return html`<p class="prep-lede">
        ${set.mode === "Speaking" ? I.T("This is a speaking task. Three students answered it out loud.", "Esta es una tarea para hablar. Tres estudiantes la respondieron en voz alta.") : I.T("This is a writing task. Three students wrote answers.", "Esta es una tarea para escribir. Tres estudiantes escribieron respuestas.")}
      </p>
      ${promptHTML(I, set)}
      <p>${hearBtn(I, set.prompt, I.T("Hear the task", "Escuchar la tarea"))}</p>
      <h3 class="prep-sub">${I.T("What raters look for", "Lo que buscan los evaluadores")}</h3>
      ${dimsHTML(I)}`;
  if (step === 1) return html`${promptHTML(I, set)}${answersHTML(I, set)}`;
  if (step === 2) return rankHTML(I, set, st);
  if (step === 3) return featuresHTML(I, set, st);
  return upgradeHTML(I, set, st);
}

export function ready(set, st, step) {
  if (step === 2) return Boolean(st.checked?.rank?.ok || st.reveal?.rank);
  if (step === 3) return Boolean(st.checked?.features?.ok);
  return true;
}

export function notReady(I, set, st, step) {
  if (step === 2) return I.S("Check your ranking first.", "Primero revisa tu orden.");
  if (step === 3)
    return I.S("Check every true reason first.", "Primero marca cada razón verdadera.");
  return "";
}

export function act(name, el, set, st) {
  st.checked ||= {};
  const bump = (k) => {
    st.tries = { ...(st.tries || {}), [k]: (st.tries?.[k] || 0) + 1 };
  };
  if (name === "check-rank") {
    bump("rank");
    const order = st.answers?.rank || {};
    st.checked.rank = checkRanking(set, [order[0], order[1], order[2]]);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-rank") {
    st.reveal = { ...(st.reveal || {}), rank: true };
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-features") {
    st.checked.features = checkFeatures(set, st.answers?.features || []);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-upgrade") {
    bump("upgrade");
    st.checked.upgrade = checkBuild(set.upgrade.parts, st.answers?.upgrade || {});
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-upgrade") {
    st.reveal = { ...(st.reveal || {}), upgrade: true };
    return { focus: ".prep-step .feedback" };
  }
  if (name === "finish") return { finish: true, focus: "[data-prep-act=finish]" };
  return false;
}

