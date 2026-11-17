// Language Time Machine — the New challenge, My reflections and Evidence sections, and the door that Passport and
// Portfolio show. Markup only. Rules kept here: help in a challenge is closed until the learner opens it (and then
// the work is marked as done with help); the evidence view lists work, dates, quotes and support context and never
// a score, level or percentage; under two comparable pieces it says there is not enough to compare yet.
import { BASE, html, icon } from "../util.js";
import { supportContext } from "./collect.js";
import { DIMENSIONS, REASON_LABEL, STAGE_LABEL, supportLabel } from "./compare.js";
import { PROMPTS } from "./reflect.js";
import { day, fieldId, tmHref } from "./ui.js";

// ── New challenge ────────────────────────────────────────────────────────────
export function challengePickHTML(I, band, items) {
  const latest = new Map();
  for (const x of items) if (x.keyUse) latest.set(`${x.domain}|${x.taskId}`, x);
  const list = [...latest.values()].sort((a, b) => b.t.localeCompare(a.t)).slice(0, 8);
  return html`<section class="panel" aria-labelledby="tmChPick">
    <h2 id="tmChPick">${I.T("Try it in a new context", "Pruébalo en un contexto nuevo")}</h2>
    <p>
      ${I.T("Choose a piece of your work. You get a new task with the same language goal and a different topic, so you can see whether your language travels.", "Elige un trabajo tuyo. Recibes una tarea nueva con la misma meta de lenguaje y otro tema, para ver si tu lenguaje viaja.")}
    </p>
    ${
      list.length
        ? html`<ul class="tm-list">
            ${list.map(
              (x) =>
                html`<li>
                  <span
                    ><strong lang="en">${x.taskTitle}</strong>
                    <span class="fine"
                      >·
                      ${x.domain === "Speaking" ? I.T("Speaking", "Expresión oral") : I.T("Writing", "Escritura")}
                      · ${day(x.t)}</span
                    ></span
                  >
                  <a class="btn small" href="${tmHref(band, "challenge", { from: x.id })}"
                    >${I.T("New context for this", "Contexto nuevo para esto")}</a
                  >
                </li>`,
            )}
          </ul>`
        : html`<p>
              ${I.T("There is no saved work with a language goal yet.", "Todavía no hay trabajo guardado con una meta de lenguaje.")}
            </p>
            <p class="row-actions">
              <a class="btn btn-primary" href="${BASE}/write?grades=${band}"
                >${I.T("Do a first writing task", "Hacer una primera tarea de escritura")}</a
              >
            </p>`
    }
  </section>`;
}

export function challengeHTML(I, band, from, ch, state, { frames, canRecord }) {
  const id = fieldId("challenge");
  const speaking = ch.domain === "Speaking";
  if (state.saved)
    return html`<section class="panel" aria-labelledby="tmChDone">
      <h2 id="tmChDone" tabindex="-1">
        ${I.T("Saved. It is now your newest piece of work.", "Guardado. Ahora es tu trabajo más nuevo.")}
      </h2>
      <p>
        ${state.help ? I.T("You opened help, so it is saved as done with help.", "Abriste la ayuda, así que se guardó como hecho con ayuda.") : I.T("You did it with the help closed, so it is saved as done on your own.", "Lo hiciste con la ayuda cerrada, así que se guardó como hecho por tu cuenta.")}
      </p>
      <p class="row-actions">
        <a
          class="btn btn-primary"
          href="${tmHref(band, speaking ? "speaking" : "writing", { pair: state.saved })}"
          >${I.T("Compare it with my earlier work", "Compararlo con mi trabajo anterior")}</a
        >
      </p>
    </section>`;
  return html`<section class="panel tm-challenge" aria-labelledby="tmCh">
    <h2 id="tmCh" tabindex="-1">
      ${I.T("New challenge: same goal, new context", "Reto nuevo: la misma meta, contexto nuevo")}
    </h2>
    <dl class="tm-chdl">
      <div>
        <dt>${I.T("Before", "Antes")}</dt>
        <dd lang="en">${from.prompt || from.taskTitle}</dd>
      </div>
      <div>
        <dt>${I.T("Now", "Ahora")}</dt>
        <dd class="tm-chprompt">${I.T(...ch.prompt)}</dd>
      </div>
      <div>
        <dt>${I.T("Language goal", "Meta de lenguaje")}</dt>
        <dd lang="en">${ch.keyUse}</dd>
      </div>
    </dl>
    <label class="tm-label" for="${id}"
      >${speaking ? I.T("Say your answer, then type what you said", "Di tu respuesta y luego escribe lo que dijiste") : I.T("My response", "Mi respuesta")}</label
    >
    <textarea id="${id}" rows="6" maxlength="6000" data-tm-challenge data-gramm="false">
${state.text || ""}</textarea>
    ${
      speaking && canRecord
        ? html`<div class="tm-audio-row">
            <button
              type="button"
              class="btn small"
              data-tm-chrec
              aria-pressed="${state.recording ? "true" : "false"}"
            >
              ${icon("speaking")}
              ${state.recording ? I.T("Stop and keep my recording", "Parar y guardar mi grabación") : state.audioId ? I.T("Record again", "Grabar otra vez") : I.T("Record my answer", "Grabar mi respuesta")}
            </button>
            ${state.audioUrl ? html`<audio controls preload="metadata" src="${state.audioUrl}" aria-label="${I.S("My new recording", "Mi grabación nueva")}"></audio>` : ""}
          </div>`
        : ""
    }
    ${
      state.help
        ? html`<div class="tm-help" role="region" aria-label="${I.S("Help", "Ayuda")}">
            <p>
              <strong
                >${I.T("Help is open. This work will be saved as done with help.", "La ayuda está abierta. Este trabajo se guardará como hecho con ayuda.")}</strong
              >
            </p>
            <ul lang="en">
              ${frames.map((f) => html`<li>${f}</li>`)}
            </ul>
          </div>`
        : html`<p class="tm-helpline">
            <span class="fine"
              >${I.T("Help is closed, so this counts as your own work. If you open it, the work is saved as done with help.", "La ayuda está cerrada, así que esto cuenta como tu propio trabajo. Si la abres, el trabajo se guarda como hecho con ayuda.")}</span
            >
            <button type="button" class="btn small" data-tm-help>
              ${I.T("Open help (sentence starters)", "Abrir ayuda (inicios de oración)")}
            </button>
          </p>`
    }
    <p class="row-actions">
      <button type="button" class="btn btn-primary" data-tm-chsave>
        ${I.T("Save my response", "Guardar mi respuesta")}
      </button>
    </p>
    <p class="tm-status" role="status">
      ${state.error ? I.T("Write at least three words first.", "Primero escribe al menos tres palabras.") : ""}
    </p>
  </section>`;
}

// ── My reflections ───────────────────────────────────────────────────────────
export function reflectionsHTML(I, band, list, pairsById, urls = {}) {
  if (!list.length)
    return html`<section class="panel" aria-labelledby="tmRefl">
      <h2 id="tmRefl">${I.T("My reflections", "Mis reflexiones")}</h2>
      <p>
        ${I.T("Open a pair in Writing or Speaking and answer the four questions under it. Your answers appear here.", "Abre un par en Escritura o Expresión oral y responde las cuatro preguntas de abajo. Tus respuestas aparecen aquí.")}
      </p>
    </section>`;
  return html`<section class="panel" aria-labelledby="tmRefl">
    <h2 id="tmRefl">${I.T("My reflections", "Mis reflexiones")}</h2>
    ${list.map((r) => {
      const p = pairsById.get(r.pairId);
      return html`<article class="tm-refl">
        <h3>
          ${p ? html`<a href="${tmHref(band, p.kind, { pair: p.id })}"><span lang="en">${p.later.taskTitle}</span></a>` : I.T("A pair that is no longer on this device", "Un par que ya no está en este dispositivo")}
          <span class="fine">· ${day(r.t)}</span>
        </h3>
        <dl class="tm-refldl">
          ${PROMPTS.filter((q) => r.answers[q.id] || r.audio[q.id]).map(
            (q) =>
              html`<div>
                <dt>${I.T(...q.q)}</dt>
                <dd>
                  ${r.answers[q.id] || ""}
                  ${r.audio[q.id] ? (urls[r.audio[q.id]] ? html`<audio controls preload="metadata" src="${urls[r.audio[q.id]]}" aria-label="${I.S(`My recorded answer: ${q.q[0]}`, `Mi respuesta grabada: ${q.q[1]}`)}"></audio>` : html`<span class="fine">${I.T("(recorded answer no longer kept)", "(respuesta grabada que ya no está guardada)")}</span>`) : ""}
                </dd>
              </div>`,
          )}
        </dl>
      </article>`;
    })}
  </section>`;
}

// ── Evidence (for my teacher) ────────────────────────────────────────────────
const support = (I, x) => I.T(...supportLabel(supportContext(x)));

export function evidenceHTML(I, band, ev, reflections) {
  if (!ev.enough)
    return html`<section class="panel tm-evidence" aria-labelledby="tmEv">
      <h2 id="tmEv">${I.T("Evidence for my teacher", "Evidencia para mi maestro o maestra")}</h2>
      <p>
        ${I.T("There is not enough to compare yet. This page needs two pieces of work on the same task, or on the same language goal in a new context.", "Todavía no hay suficiente para comparar. Esta página necesita dos trabajos de la misma tarea, o de la misma meta de lenguaje en un contexto nuevo.")}
      </p>
      <p class="row-actions no-print">
        <a class="btn btn-primary" href="${BASE}/write?grades=${band}"
          >${I.T("Do a first writing task", "Hacer una primera tarea de escritura")}</a
        >
      </p>
    </section>`;
  const byPair = new Map(reflections.map((r) => [r.pairId, r]));
  return html`<article class="tm-evidence" aria-labelledby="tmEv">
    <section class="panel">
      <h2 id="tmEv">${I.T("Evidence for my teacher", "Evidencia para mi maestro o maestra")}</h2>
      <p class="tm-who">
        ${I.T("Name:", "Nombre:")} ____________________ · ${day(new Date().toISOString())}
      </p>
      <p class="fine">
        ${I.T("Everything here is read from work saved on this device (or from an imported Passport backup). It lists the learner's own words, dates and how each piece was done. It is practice evidence: not a score, a level or a test result, and how much was written or said is not counted.", "Todo lo que hay aquí se lee del trabajo guardado en este dispositivo (o de una copia importada del Pasaporte). Muestra las palabras del estudiante, las fechas y cómo se hizo cada pieza. Es evidencia de práctica: no es una puntuación, un nivel ni un resultado de prueba, y no se cuenta cuánto se escribió o se dijo.")}
      </p>
      <p class="row-actions no-print">
        <button type="button" class="btn btn-primary" data-print>
          ${icon("print")} ${I.T("Print or save as PDF", "Imprimir o guardar como PDF")}
        </button>
      </p>
    </section>
    <section class="panel" aria-labelledby="tmEvPairs">
      <h3 id="tmEvPairs">
        ${I.T("Comparable evidence and response changes", "Evidencia comparable y cambios en las respuestas")}
      </h3>
      ${ev.pairs.slice(0, 8).map((p) => {
        const c = ev.comparisons[p.id];
        const r = byPair.get(p.id);
        return html`<article class="tm-evpair">
          <h4>
            <span lang="en">${p.later.taskTitle}</span>
            <span class="tm-tag"
              >${p.kind === "speaking" ? I.T("Speaking", "Expresión oral") : I.T("Writing", "Escritura")}</span
            >
            <span class="tm-tag">${I.T(...REASON_LABEL[p.reason])}</span>
          </h4>
          ${[
            [p.earlier, I.T("Earlier", "Anterior")],
            [p.later, I.T("Later", "Posterior")],
          ].map(
            ([x, label]) =>
              html`<div class="tm-evitem">
                <p class="tm-cap">
                  <strong>${label}</strong> · ${day(x.t)} ·
                  ${I.T(...(STAGE_LABEL[x.stage] || STAGE_LABEL.first))} ·
                  ${support(I, x)}${x.kind === "speaking" ? html` · ${x.source === "transcript" && !x.verified ? I.T("speech-recognition text, not confirmed", "texto de reconocimiento de voz, sin confirmar") : I.T("words typed or confirmed by the learner", "palabras escritas o confirmadas por el estudiante")}` : ""}
                </p>
                <p class="tm-text" lang="en">
                  ${x.text || I.T("(no words saved for this recording)", "(no hay palabras guardadas para esta grabación)")}
                </p>
                ${x.teacherNote ? html`<p class="tm-note"><strong>${I.T("Teacher note:", "Nota del maestro o maestra:")}</strong> <span lang="en">${x.teacherNote}</span></p>` : ""}
              </div>`,
          )}
          ${
            c?.changes.length
              ? html`<ul class="tm-changelist">
                  ${c.changes.map(
                    (ch) =>
                      html`<li class="tm-change">
                        <span class="tm-tag">${I.T(...DIMENSIONS[ch.dimension])}</span>
                        ${I.T(...ch.text)}
                        ${ch.beforeQuote ? html`<span class="tm-quote"><span class="fine">${I.T("Earlier:", "Antes:")}</span> <q lang="en">${ch.beforeQuote}</q></span>` : ""}
                        ${ch.afterQuote ? html`<span class="tm-quote"><span class="fine">${I.T("Later:", "Después:")}</span> <q lang="en">${ch.afterQuote}</q></span>` : ""}
                      </li>`,
                  )}
                </ul>`
              : html`<p class="fine">
                  ${I.T("The rule-based comparison found no change it could quote. Please read both pieces.", "La comparación con reglas no encontró ningún cambio que pudiera citar. Por favor lean las dos piezas.")}
                </p>`
          }
          ${
            r
              ? html`<dl class="tm-refldl">
                  ${PROMPTS.filter((q) => r.answers[q.id] || r.audio[q.id]).map(
                    (q) =>
                      html`<div>
                        <dt>${I.T(...q.q)}</dt>
                        <dd>
                          ${r.answers[q.id] || I.T("(recorded answer on the learner's device)", "(respuesta grabada en el dispositivo del estudiante)")}
                        </dd>
                      </div>`,
                  )}
                </dl>`
              : ""
          }
        </article>`;
      })}
    </section>
    <section class="panel" aria-labelledby="tmEvSupport">
      <h3 id="tmEvSupport">${I.T("Support history", "Historial de apoyos")}</h3>
      <ul class="tm-list is-plain">
        ${ev.supportHistory.map(({ item: x }) => html`<li>${day(x.t)} · <span lang="en">${x.taskTitle}</span> · ${I.T(...(STAGE_LABEL[x.stage] || STAGE_LABEL.first))} · <strong>${support(I, x)}</strong></li>`)}
      </ul>
    </section>
    <section class="panel" aria-labelledby="tmEvRev">
      <h3 id="tmEvRev">${I.T("Revision activity", "Actividad de revisión")}</h3>
      ${
        ev.revisions.length
          ? html`<ul class="tm-list is-plain">
              ${ev.revisions.map((x) => html`<li>${day(x.t)} · <span lang="en">${x.taskTitle}</span> · ${I.T("revised after feedback (counted as supported)", "revisado después de los comentarios (cuenta como con apoyo)")}</li>`)}
            </ul>`
          : html`<p>
              ${I.T("No revision is among the compared pieces.", "No hay ninguna revisión entre las piezas comparadas.")}
            </p>`
      }
    </section>
    <section class="panel" aria-labelledby="tmEvTransfer">
      <h3 id="tmEvTransfer">
        ${I.T("Independent transfer (a new context)", "Transferencia independiente (un contexto nuevo)")}
      </h3>
      ${
        ev.transfers.length
          ? html`<ul class="tm-list is-plain">
              ${ev.transfers.map((x) => html`<li>${day(x.t)} · <span lang="en">${x.prompt || x.taskTitle}</span> · <strong>${x.independent ? I.T("on their own", "por su cuenta") : support(I, x)}</strong></li>`)}
            </ul>`
          : html`<p>
              ${I.T("No work in a new context yet.", "Todavía no hay trabajo en un contexto nuevo.")}
            </p>`
      }
    </section>
    <section class="panel" aria-labelledby="tmEvNext">
      <h3 id="tmEvNext">${I.T("Suggested next instruction", "Siguiente instrucción sugerida")}</h3>
      ${
        ev.suggestions.length
          ? html`<ul class="tm-changelist">
              ${ev.suggestions.map(
                (s) =>
                  html`<li class="tm-change">
                    <p><strong>${I.T(...s.text)}</strong></p>
                    <p class="tm-because">
                      <span class="fine">${I.T("Because:", "Porque:")}</span> ${I.T(...s.because)}
                    </p>
                  </li>`,
              )}
            </ul>`
          : html`<p>
              ${I.T("No suggestion: the rules found nothing to point to.", "Sin sugerencia: las reglas no encontraron nada que señalar.")}
            </p>`
      }
      <p class="fine">
        ${I.T("Suggestions come from simple rules over the pieces listed above. A teacher decides.", "Las sugerencias vienen de reglas sencillas sobre las piezas de arriba. Un maestro o una maestra decide.")}
      </p>
    </section>
  </article>`;
}

// ── The door (Passport and Portfolio) ────────────────────────────────────────
/** A clearly visible way in from Passport and Portfolio: how many pairs can be compared, and the newest reflection. */
export function doorHTML(I, band, { pairs = 0, reflections = [] } = {}) {
  const last = reflections[0];
  const said = last && PROMPTS.map((p) => last.answers[p.id]).find(Boolean);
  return html`<section class="pass-card tm-door" aria-labelledby="tmDoor">
    <h2 id="tmDoor">
      ${icon("growth")} ${I.T("Language Time Machine", "Máquina del tiempo del lenguaje")}
    </h2>
    <p data-tm-door-count="${pairs}">
      ${
        pairs
          ? I.T(
              `${pairs} ${pairs === 1 ? "pair" : "pairs"} of earlier and later work can be compared.`,
              `Se ${pairs === 1 ? "puede comparar 1 par" : `pueden comparar ${pairs} pares`} de trabajo anterior y posterior.`,
            )
          : I.T(
              "Not enough to compare yet. Two pieces on the same task, or the same language goal, open it.",
              "Todavía no hay suficiente para comparar. Dos piezas de la misma tarea, o de la misma meta de lenguaje, la abren.",
            )
      }
    </p>
    ${said ? html`<p class="fine"><strong>${I.T("My latest reflection:", "Mi última reflexión:")}</strong> ${said}</p>` : ""}
    <a class="btn small" href="${BASE}/time-machine?grades=${band}"
      >${I.T("Open the Time Machine", "Abrir la Máquina del tiempo")}${icon("arrow-right")}</a
    >
  </section>`;
}
