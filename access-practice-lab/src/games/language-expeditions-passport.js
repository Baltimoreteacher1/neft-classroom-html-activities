// Language Expeditions "My expedition passport" (feature "teacher"): one page per land with its stamp and the
// learner's own language from that land (what they wrote at Writing stops, the words they typed or dictated at
// Speaking stops, and a Play button for a recording made in this tab). Recordings are never saved, so after the
// tab is closed the passport says plainly that none is available. Printable: one land per page, no controls
// (see the "teacher" block at the end of games-m.css). Everything stays on this device.
import { takesFor } from "../recorder.js";
import { playRecording } from "../speech.js";
import { html, icon } from "./engine.js";
import { DOMAINS, complete, recKey } from "./language-expeditions-view.js";

const say = (I, o) => (o ? I.T(o.en, o.es) : "");
const takesOf = (s, r) => (typeof window === "undefined" ? [] : takesFor(recKey(s, r)));

/** The button that opens the passport, placed on the gate and the journey summary. */
export const passportButton = (I) =>
  html`<button type="button" class="btn" data-lexp-pp>
    ${icon("reading")}${I.T("My expedition passport", "Mi pasaporte de expedición")}
  </button>`;

/** Center-rotation finish: once the assigned land is stamped the learner may end here (feature "teacher"). */
export const assignedFinish = (s, I) =>
  Number.isInteger(s.assigned) && s.lands[s.assigned]?.stamp && !s.lands.every((L) => L.stamp)
    ? html`<button type="button" class="btn" data-lexp-summary>
        ${icon("flag")}${I.T("Finish my center here", "Terminar mi estación aquí")}
      </button>`
    : "";

function ownWords(s, k, L, land, env, actOf) {
  const I = env.I;
  const rows = L.acts
    .map((r, i) => ({ r, a: actOf(env, s, k, i) }))
    .filter(({ r }) => r.type === "speak" || r.type === "write");
  if (!rows.length) {
    const done = L.acts
      .map((r, i) => ({ r, a: actOf(env, s, k, i) }))
      .filter(({ r }) => complete(r));
    return done.length
      ? html`<p class="lexp-pp-l">${I.T("Stops you finished", "Paradas que terminaste")}</p>
          <ul class="lexp-pp-stops">
            ${done.map(({ a }) => html`<li>${say(I, a.title)}</li>`)}
          </ul>`
      : html`<p class="fine">
          ${I.T("No stops finished in this land yet.", "Todavía no terminaste paradas en esta tierra.")}
        </p>`;
  }
  return html`<ul class="lexp-pp-words">
    ${rows.map(({ r, a }, n) => {
      const takes = r.type === "speak" ? takesOf(s, r) : [];
      const text = String(r.text || "").trim();
      const tried = r.type === "speak" ? r.said : r.wn > 0;
      return html`<li>
        <p class="lexp-pp-l">${say(I, a.title)}</p>
        <p class="lexp-pp-task fine">${say(I, a.prompt)}</p>
        ${
          text && tried
            ? html`<blockquote class="lexp-pp-text" lang="en">${text}</blockquote>`
            : html`<p class="fine">
                ${
                  !tried
                    ? I.T("Not done yet.", "Todavía no.")
                    : r.type === "speak"
                      ? I.T(
                          "You said this one out loud. No words were typed.",
                          "Lo dijiste en voz alta. No se escribieron palabras.",
                        )
                      : I.T("No writing saved.", "No hay escritura guardada.")
                }
              </p>`
        }
        ${
          r.type !== "speak"
            ? ""
            : takes.length
              ? html`<button
                  type="button"
                  class="btn small lexp-pp-ctl"
                  data-lexp-pp-play="${k}-${L.acts.indexOf(r)}"
                >
                  ${icon("play")}${I.T("Play my recording", "Escuchar mi grabación")}<span
                    class="visually-hidden"
                  >
                    ${n + 1}</span
                  >
                </button>`
              : html`<p class="fine lexp-pp-norec">
                  ${I.T("No recording to play. Recordings stay only in this tab while it is open, and they are never saved.", "No hay grabación para escuchar. Las grabaciones solo se quedan en esta pestaña mientras está abierta y nunca se guardan.")}
                </p>`
        }
      </li>`;
    })}
  </ul>`;
}

export function passportHTML(s, band, env, actOf) {
  const I = env.I;
  return html`<div class="lexp-panel lexp-passport">
    <p class="lexp-tag lexp-pp-ctl">${icon("reading")}${I.T("Passport", "Pasaporte")}</p>
    <h2 class="lexp-head" tabindex="-1">
      ${I.T("My expedition passport", "Mi pasaporte de expedición")}
    </h2>
    <p class="lexp-guide">${say(I, band.adventure)}</p>
    <p class="fine">
      ${I.T("This passport stays on this device. Nothing is uploaded. It is a record of practice, not a score.", "Este pasaporte se queda en este dispositivo. No se sube nada. Es un registro de práctica, no una calificación.")}
    </p>
    <div class="gs-actions lexp-pp-ctl">
      <button type="button" class="btn btn-primary" data-print>
        ${icon("print")}${I.T("Print my passport", "Imprimir mi pasaporte")}
      </button>
      <button type="button" class="btn" data-lexp-pp-back>
        ${icon("arrow-left")}${I.T("Back to the expedition", "Volver a la expedición")}
      </button>
    </div>
    ${band.lands.map((land, k) => {
      const L = s.lands[k];
      const done = L.acts.filter(complete).length;
      return html`<section
        class="lexp-pp-land lexp-dom-${land.domain}${L.stamp ? " is-stamped" : ""}"
        aria-labelledby="lexp-pp-${k}"
      >
        <h3 id="lexp-pp-${k}">
          ${icon(DOMAINS[land.domain].icon)}${I.T(...DOMAINS[land.domain].name)}:
          ${say(I, land.name)}
        </h3>
        <p class="lexp-pp-stamp">
          ${L.stamp ? html`${icon("medal")}<strong>${I.T("Stamped", "Con sello")}</strong>` : I.T("No stamp yet", "Sin sello todavía")}
          <span
            >·
            ${I.T(`${done} of ${L.acts.length} ${L.acts.length === 1 ? "stop" : "stops"}`, `${done} de ${L.acts.length} ${L.acts.length === 1 ? "parada" : "paradas"}`)}</span
          >
        </p>
        ${ownWords(s, k, L, land, env, actOf)}
      </section>`;
    })}
    <p class="lexp-not-score">
      ${I.T("Stamps are not a score.", "Los sellos no son una calificación.")}
    </p>
  </div>`;
}

/** Passport clicks. Returns true/false when handled, undefined when the button is not a passport control. */
export function passportClick(b, s) {
  if (b.hasAttribute("data-lexp-pp")) {
    if (s.at === "passport") return false;
    s.ppBack = s.at;
    s.at = "passport";
    return true;
  }
  if (s.at !== "passport") return undefined;
  if (b.hasAttribute("data-lexp-pp-back")) {
    s.at = ["gate", "summary", "map"].includes(s.ppBack) ? s.ppBack : "map";
    return true;
  }
  if (b.dataset.lexpPpPlay !== undefined) {
    const [k, i] = String(b.dataset.lexpPpPlay).split("-").map(Number);
    const r = s.lands[k]?.acts?.[i];
    if (r) playRecording(takesOf(s, r).map((t) => t.url));
    return false;
  }
  return undefined;
}

