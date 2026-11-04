// Language World step screens (Listening, Reading, Speaking, Writing) and the "Help for this step" rail.
// Rendering only; state changes live in views/exhibition.js. Authored scenario text is tagged lang="en".
import { listenPlayerHTML, recorderHTML } from "../components.js";
import { EXHIBITION_GLOSSARY } from "../content/exhibition.js";
import { compareDrafts, evaluateWriting, isRight } from "../lang/exhibition.js";
import { isRecording, takesFor } from "../recorder.js";
import { canSpeak } from "../speech.js";
import { html, icon, raw, wordCount } from "../util.js";

/** Help each step can offer, in the order shown. `open` = shown by default at that support level. */
export const HELP = {
  listen: [
    ["map", "Picture of the places", "Imagen de los lugares", ["A", "B"]],
    ["sentences", "Replay one sentence at a time", "Repetir una oración a la vez", ["A"]],
    ["words", "Word help", "Ayuda con palabras", ["A"]],
    ["transcript", "Read the announcement instead", "Leer el anuncio", []],
  ],
  read: [
    ["diagram", "Visual example", "Ejemplo visual", ["A", "B"]],
    ["words", "Word help", "Ayuda con palabras", ["A"]],
    ["evidence-tip", "How to find evidence", "Cómo encontrar evidencia", ["A", "B"]],
    ["aloud", "Read it aloud to me", "Leérmelo en voz alta", []],
  ],
  speak: [
    ["starters", "Sentence starters", "Inicios de oración", ["A", "B"]],
    ["words", "Word bank", "Banco de palabras", ["A"]],
    ["strategy", "Planning strategy", "Estrategia para planear", ["A", "B"]],
    ["model", "Hear a model answer", "Escuchar un ejemplo", []],
  ],
  write: [
    ["organizer", "Graphic organizer", "Organizador gráfico", ["A", "B"]],
    ["starters", "Sentence starters", "Inicios de oración", ["A"]],
    ["evidence", "My evidence so far", "Mi evidencia hasta ahora", ["A", "B"]],
    ["words", "Word help", "Ayuda con palabras", ["A"]],
    ["checklist", "Revision checklist", "Lista para revisar", []],
  ],
};

export const helpOpenByDefault = (step, level) =>
  HELP[step].filter((h) => h[3].includes(level)).map((h) => h[0]);

const en = (content) => html`<span lang="en">${content}</span>`;

function wordsHTML(I, list) {
  return html`<dl class="ex-words" lang="en">
    ${list.map((w) => {
      const g = EXHIBITION_GLOSSARY[w];
      return g
        ? html`<div>
            <dt>${w}</dt>
            <dd>
              ${g[0]} <span class="ex-bridge" lang="es">${g[1]}</span
              ><span class="ex-example">${g[2]}</span>
            </dd>
          </div>`
        : "";
    })}
  </dl>`;
}

/** The help rail: one toggle per relevant support, its content directly under it. */
export function helpRailHTML(I, step, spec, open, extras = {}) {
  return html`<aside class="ex-help" aria-labelledby="exHelpTitle">
    <h2 id="exHelpTitle">${icon("bulb")} ${I.T("Help for this step", "Ayuda para este paso")}</h2>
    <p class="fine">
      ${I.T("Open only what you need. Closing help never erases your work. Help you open is noted as supported practice.", "Abre solo lo que necesites. Cerrar la ayuda nunca borra tu trabajo. La ayuda que abras se anota como práctica con apoyo.")}
    </p>
    <ul class="ex-help-list">
      ${HELP[step].map(([id, enLabel, esLabel]) => {
        const body = extras[id];
        if (body === null) return "";
        const isOpen = open.has(id);
        return html`<li class="${isOpen ? "is-open" : ""}">
          <button
            type="button"
            class="ex-help-toggle"
            data-ex-help="${id}"
            aria-expanded="${isOpen}"
            aria-controls="ex-help-${id}"
          >
            ${icon(isOpen ? "chevron-down" : "chevron-right")}<span>${I.T(enLabel, esLabel)}</span>
          </button>
          <div class="ex-help-body" id="ex-help-${id}" ${isOpen ? "" : raw("hidden")}>
            ${isOpen ? (body ?? wordsHTML(I, spec.vocab)) : ""}
          </div>
        </li>`;
      })}
    </ul>
  </aside>`;
}

function choiceHTML(I, step, spec, q, task, n) {
  const picked = task.answers?.[q.id];
  const right = isRight(spec, q.id, picked);
  const chosen = q.options?.find((o) => o.id === picked);
  return html`<fieldset class="ex-q ${right ? "is-right" : picked ? "is-try" : ""}">
    <legend><span class="ex-q-n">${n}</span> ${en(q.prompt)}</legend>
    <div class="ex-options">
      ${q.options.map(
        (o) =>
          html`<button
            type="button"
            class="ex-option ${picked === o.id ? (o.ok ? "is-right" : "is-miss") : ""}"
            data-ex-answer="${step}:${q.id}:${o.id}"
            aria-pressed="${picked === o.id}"
            ${right && picked !== o.id ? raw("disabled") : ""}
          >
            <span class="ex-option-mark" aria-hidden="true">${o.id.toUpperCase()}</span
            ><span lang="en">${o.text}</span>
          </button>`,
      )}
    </div>
    <p class="ex-feedback" role="status">
      ${picked ? (right ? html`${icon("check")} <strong>${I.T("Yes.", "Sí.")}</strong> ${I.T("That matches what you heard or read.", "Coincide con lo que escuchaste o leíste.")}` : html`${icon("retry")} <strong>${I.T("Not yet.", "Todavía no.")}</strong> ${en(chosen?.why || "")} ${I.T("Try another answer.", "Prueba otra respuesta.")}`) : ""}
    </p>
  </fieldset>`;
}

// ── Listening ────────────────────────────────────────────────────────────────
export function listenHTML(I, ctx, scenario, band, open) {
  const spec = scenario.tasks.listen;
  const task = band.tasks.listen;
  const key = `ex-listen-${scenario.band}`;
  const main = html`<section class="ex-stage ex-sound" aria-labelledby="exTaskTitle">
      <div class="ex-sound-head">
        <p class="ex-kicker">${I.T("The announcement", "El anuncio")}</p>
        <p>
          ${I.T("Listen to the whole announcement first. Then answer. You can listen as many times as you need.", "Escucha primero todo el anuncio. Luego responde. Puedes escucharlo las veces que necesites.")}
        </p>
      </div>
      ${listenPlayerHTML(key, spec.script, { rate: ctx.prefs.rate || 0.9, i18n: I })}
    </section>
    <section class="ex-questions" aria-label="${I.S("Questions", "Preguntas")}">
      ${spec.questions.map((q, i) => choiceHTML(I, "listen", spec, q, task, i + 1))}
    </section>`;
  const rail = helpRailHTML(I, "listen", spec, open, {
    map: html`<p class="fine">${I.T("Places you may hear about. Listen for the one the speaker means.", "Lugares que puedes oír. Escucha cuál menciona el hablante.")}</p>
      <ul class="ex-map" lang="en">${spec.map.map((place) => html`<li>${place}</li>`)}</ul>`,
    sentences: canSpeak()
      ? html`<ol class="ex-lines">
          ${spec.script.map((_, i) => html`<li><button type="button" class="ghost small" data-say="${spec.script[i]}">${icon("play")} ${I.T(`Sentence ${i + 1}`, `Oración ${i + 1}`)}</button></li>`)}
        </ol>`
      : null,
    transcript: html`<div class="ex-transcript" lang="en">
      ${spec.script.map((s) => html`<p>${s}</p>`)}
    </div>`,
  });
  return { main, rail };
}

// ── Reading ──────────────────────────────────────────────────────────────────
export function readHTML(I, ctx, scenario, band, open) {
  const spec = scenario.tasks.read;
  const task = band.tasks.read;
  const evidence = new Set(
    spec.questions
      .filter((q) => q.kind === "evidence")
      .map((q) => Number(task.answers?.[q.id]))
      .filter((n) => !Number.isNaN(n)),
  );
  const card = html`<article class="ex-page" lang="en" aria-labelledby="exCardTitle">
    <p class="ex-page-kicker">${scenario.setting}</p>
    <h2 id="exCardTitle">${spec.cardTitle}</h2>
    <p class="ex-page-text">
      ${spec.sentences.map((s, i) => html`<span class="ex-sent ${evidence.has(i) ? "is-evidence" : ""}" id="ex-s${i}"><sup>${i + 1}</sup>${s}</span> `)}
    </p>
  </article>`;
  const questions = spec.questions.map((q, i) => {
    if (q.kind !== "evidence") return choiceHTML(I, "read", spec, q, task, i + 1);
    const picked = task.answers?.[q.id];
    const right = isRight(spec, q.id, picked);
    return html`<fieldset
      class="ex-q ${right ? "is-right" : picked != null && picked !== "" ? "is-try" : ""}"
    >
      <legend><span class="ex-q-n">${i + 1}</span> ${en(q.prompt)}</legend>
      <div class="ex-sent-picks">
        ${spec.sentences.map(
          (s, n) =>
            html`<button
              type="button"
              class="ex-sent-pick ${String(picked) === String(n) ? (right ? "is-right" : "is-miss") : ""}"
              data-ex-answer="read:${q.id}:${n}"
              aria-pressed="${String(picked) === String(n)}"
              ${right && String(picked) !== String(n) ? raw("disabled") : ""}
            >
              <span class="ex-q-n">${n + 1}</span><span lang="en">${s}</span>
            </button>`,
        )}
      </div>
      <p class="ex-feedback" role="status">
        ${picked != null && picked !== "" ? (right ? html`${icon("check")} <strong>${I.T("Yes.", "Sí.")}</strong> ${I.T("That sentence is now marked as evidence in the card.", "Esa oración ahora está marcada como evidencia en la tarjeta.")}` : html`${icon("retry")} <strong>${I.T("Not yet.", "Todavía no.")}</strong> ${en(q.why)}`) : ""}
      </p>
    </fieldset>`;
  });
  const main = html`${card}
    <section class="ex-questions" aria-label="${I.S("Questions", "Preguntas")}">
      ${questions}
    </section>`;
  const rail = helpRailHTML(I, "read", spec, open, {
    diagram: html`<ol class="ex-layers" lang="en">
      ${spec.diagram.map((d) => html`<li>${d}</li>`)}
    </ol>`,
    "evidence-tip": html`<p>
      ${I.T("Evidence is a sentence that proves an answer. Look for results you can see or measure: colors, numbers, times, changes.", "La evidencia es una oración que prueba una respuesta. Busca resultados que puedes ver o medir: colores, números, tiempos, cambios.")}
    </p>`,
    aloud: canSpeak()
      ? html`<button type="button" class="btn small" data-say="${spec.sentences.join(" ")}">
          ${icon("volume")} ${I.T("Read the card aloud", "Leer la tarjeta en voz alta")}
        </button>`
      : null,
  });
  return { main, rail };
}

// ── Speaking ─────────────────────────────────────────────────────────────────
export function speakHTML(I, ctx, scenario, band, open) {
  const spec = scenario.tasks.speak;
  const task = band.tasks.speak;
  const key = `ex-speak-${scenario.band}`;
  const tried = task.said || takesFor(key).length > 0;
  const checks = task.checks || {};
  const main = html`<section class="ex-stage ex-voice" aria-labelledby="exTaskTitle">
      <p class="ex-kicker">${I.T("Your task", "Tu tarea")}</p>
      <p class="ex-voice-prompt" lang="en">${spec.prompt}</p>
    </section>
    <section class="ex-plan" aria-labelledby="exPlanTitle">
      <h2 id="exPlanTitle">
        ${I.T("1 · Plan (notes, not a script)", "1 · Planea (notas, no un guion)")}
      </h2>
      <div class="ex-plan-grid">
        ${spec.plan.map(([id, label]) => html`<label class="field"><span lang="en">${label}</span><input type="text" maxlength="140" data-ex-plan="${id}" value="${task.plan?.[id] || ""}" autocomplete="off" /></label>`)}
      </div>
    </section>
    <section class="ex-say" aria-labelledby="exSayTitle">
      <h2 id="exSayTitle">${I.T("2 · Say it", "2 · Dilo")}</h2>
      <p class="fine">
        ${I.T("Recording is optional and stays in this tab. The lab does not judge pronunciation, accent or fluency.", "Grabar es opcional y queda en esta pestaña. El laboratorio no juzga la pronunciación, el acento ni la fluidez.")}
      </p>
      ${recorderHTML(key, { prompt: spec.prompt, recording: isRecording(key), i18n: I })}
      <button
        type="button"
        class="btn ${task.said ? "" : "btn-secondary"}"
        data-ex-said
        aria-pressed="${Boolean(task.said)}"
      >
        ${icon(task.said ? "check" : "speaking")}
        ${task.said ? I.T("You said it aloud", "Lo dijiste en voz alta") : I.T("I said it aloud (without recording)", "Lo dije en voz alta (sin grabar)")}
      </button>
    </section>
    <section class="ex-self" aria-labelledby="exSelfTitle">
      <h2 id="exSelfTitle">${I.T("3 · Check yourself", "3 · Revisa tu respuesta")}</h2>
      <ul class="ex-checks">
        ${spec.checks.map(
          ([id, label]) =>
            html`<li>
              <label
                ><input type="checkbox" data-ex-check="${id}" ${checks[id] ? raw("checked") : ""} />
                <span lang="en">${label}</span></label
              >
            </li>`,
        )}
      </ul>
      ${
        tried
          ? html`<div class="ex-revise">
              <h3>${I.T("4 · Say it better", "4 · Dilo mejor")}</h3>
              <p class="fine">
                ${I.T("Choose one improvement, then say or record it again.", "Elige una mejora y luego dilo o grábalo otra vez.")}
              </p>
              <div
                class="sort-cats"
                role="group"
                aria-label="${I.S("Choose one improvement", "Elige una mejora")}"
              >
                ${spec.improvements.map((label, i) => html`<button type="button" class="cat-chip" data-ex-improve="${i}" aria-pressed="${task.improve === i}"><span lang="en">${label}</span></button>`)}
              </div>
              ${task.improve != null ? html`<p class="ex-feedback" role="status">${I.T("Your goal for the next try:", "Tu meta para el próximo intento:")} <strong lang="en">${spec.improvements[task.improve]}</strong></p>` : ""}
            </div>`
          : ""
      }
    </section>`;
  const rail = helpRailHTML(I, "speak", spec, open, {
    starters: html`<ul class="ex-frames" lang="en">
      ${(spec.frames[band.support] || spec.frames.A).map((f) => html`<li>${f}</li>`)}
    </ul>`,
    strategy: html`<p>
      ${I.T("Point to each part of the plan as you speak. Pause between parts. Say your evidence last so the listener remembers it.", "Señala cada parte del plan mientras hablas. Haz una pausa entre partes. Di tu evidencia al final para que quien escucha la recuerde.")}
    </p>`,
    model: tried
      ? html`<p class="ex-model" lang="en">${spec.model}</p>
          ${canSpeak() ? html`<button type="button" class="btn small" data-say="${spec.model}">${icon("volume")} ${I.T("Hear it", "Escucharlo")}</button>` : ""}`
      : html`<p class="fine">
          ${I.T("The model opens after your first try, so your first answer is your own.", "El ejemplo se abre después de tu primer intento, para que tu primera respuesta sea tuya.")}
        </p>`,
  });
  return { main, rail };
}

// ── Writing ──────────────────────────────────────────────────────────────────
export function writeHTML(I, ctx, scenario, band, open, attempt, sources) {
  const spec = scenario.tasks.write;
  const independent = attempt.kind === "independent";
  const prompt = attempt.prompt === "transfer" ? spec.transfer : spec.prompt;
  const drafts = attempt.drafts || [];
  const last = drafts.at(-1);
  const result = last ? evaluateWriting(last.text, spec, sources.sentences) : null;
  const previous = drafts.length > 1 ? evaluateWriting(drafts.at(-2).text, spec, sources.sentences) : null;
  const change = previous && result ? compareDrafts(previous, result) : null;
  const label = (id) => spec.feedback.find((r) => r.id === id)?.label || id;
  const text = attempt.text || "";
  const download = `data:text/plain;charset=utf-8,${encodeURIComponent(`${scenario.title}\n\n${prompt}\n\n${text}\n`)}`;
  const main = html`<section class="ex-stage ex-manuscript" aria-labelledby="exTaskTitle">
      <p class="ex-kicker">
        ${independent ? I.T("New attempt · on your own", "Nuevo intento · por tu cuenta") : I.T("Your task", "Tu tarea")}
      </p>
      <p class="ex-manuscript-prompt" lang="en">${prompt}</p>
    </section>
    <section class="ex-draft" aria-labelledby="exDraftTitle">
      <div class="ex-draft-head">
        <h2 id="exDraftTitle">
          ${drafts.length ? I.T(`Draft ${drafts.length + (text !== last?.text ? 1 : 0)}`, `Borrador ${drafts.length + (text !== last?.text ? 1 : 0)}`) : I.T("Your draft", "Tu borrador")}
        </h2>
        <span class="fine" data-ex-count aria-live="off"
          >${I.T(`${wordCount(text)} words`, `${wordCount(text)} palabras`)}</span
        >
      </div>
      <label class="visually-hidden" for="exDraft"
        >${I.T("Write your response", "Escribe tu respuesta")}</label
      >
      <textarea id="exDraft" class="ex-paper" lang="en" rows="9" spellcheck="true" data-ex-draft>
${text}</textarea>
      <p class="fine ex-saved" role="status" data-ex-saved>
        ${I.T("Saved on this device as you type.", "Se guarda en este dispositivo mientras escribes.")}
      </p>
      <div class="row-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-ex-feedback
          ${text.trim() ? "" : raw("disabled")}
        >
          ${icon("check")}
          ${drafts.length ? I.T("Check my revision", "Revisar mi revisión") : I.T("Get feedback", "Recibir comentarios")}
        </button>
        ${text.trim() ? html`<a class="btn" href="${download}" download="language-world-writing.txt">${icon("download")} ${I.T("Download my writing", "Descargar mi escritura")}</a>` : ""}
      </div>
    </section>
    ${
      result
        ? html`<section class="ex-notes" aria-labelledby="exNotesTitle">
            <h2 id="exNotesTitle" tabindex="-1">
              ${I.T("Feedback on your latest draft", "Comentarios sobre tu último borrador")}
            </h2>
            <p class="fine">
              ${I.T("These notes come from simple rules about your own sentences. They are not a score, and they cannot judge whether your ideas are right.", "Estas notas vienen de reglas simples sobre tus propias oraciones. No son una calificación y no pueden juzgar si tus ideas son correctas.")}
            </p>
            ${change && (change.added.length || change.lost.length) ? html`<p class="ex-change" role="status">${icon("growth")} ${change.added.length ? I.T(`Since your last draft you added: ${change.added.map(label).join(", ")}.`, `Desde tu último borrador agregaste: ${change.added.map(label).join(", ")}.`) : ""} ${change.lost.length ? I.T(`Check again: ${change.lost.map(label).join(", ")}.`, `Revisa otra vez: ${change.lost.map(label).join(", ")}.`) : ""}</p>` : ""}
            <div class="ex-notes-grid">
              <div>
                <h3>${I.T("What your writing shows", "Lo que muestra tu escritura")}</h3>
                ${
                  result.shows.length
                    ? html`<ul class="ex-shows">
                        ${result.shows.map((s) => html`<li><strong>${s.label}</strong><q lang="en">${s.quote}</q></li>`)}
                      </ul>`
                    : html`<p class="fine">
                        ${I.T("Keep going: add a claim or a reason.", "Sigue: agrega una afirmación o una razón.")}
                      </p>`
                }
              </div>
              <div class="ex-next">
                <h3>${I.T("One next move", "Un siguiente paso")}</h3>
                ${result.next ? html`<p lang="en">${result.next.next}</p>` : html`<p>${I.T("Every move in this task shows in your writing. Read it once more for clarity, or start a new attempt on your own.", "Todos los pasos de esta tarea aparecen en tu escritura. Léela otra vez para que sea clara, o empieza un nuevo intento por tu cuenta.")}</p>`}
                <p class="fine">
                  ${I.T(`${result.sentences} sentences · ${result.words} words`, `${result.sentences} oraciones · ${result.words} palabras`)}
                </p>
              </div>
            </div>
            ${
              drafts.length > 1
                ? html`<details class="ex-history">
                    <summary>
                      ${I.T(`See your first draft (${drafts.length} drafts saved)`, `Ver tu primer borrador (${drafts.length} borradores guardados)`)}
                    </summary>
                    <p class="ex-paper-quote" lang="en">${drafts[0].text}</p>
                  </details>`
                : ""
            }
            ${!independent && result && !result.next ? html`<p><button type="button" class="btn btn-primary" data-ex-new-attempt>${icon("arrow-right")} ${I.T("Start a new attempt on your own", "Empezar un nuevo intento por tu cuenta")}</button></p>` : ""}
          </section>`
        : ""
    }`;
  const evidence = sources.picked.length
    ? html`<ul class="ex-evidence" lang="en">
        ${sources.picked.map((s) => html`<li>${s}</li>`)}
      </ul>`
    : html`<p class="fine">
        ${I.T("Evidence you select in the Reading step appears here.", "La evidencia que selecciones en el paso de lectura aparece aquí.")}
      </p>`;
  const rail = helpRailHTML(I, "write", spec, open, {
    organizer: html`<div class="ex-organizer">
      ${spec.organizer.map(([id, lab]) => html`<label class="field"><span lang="en">${lab}</span><textarea rows="2" data-ex-org="${id}" lang="en">${attempt.organizer?.[id] || ""}</textarea></label>`)}
    </div>`,
    starters: spec.frames[band.support]?.length
      ? html`<ul class="ex-frames" lang="en">
          ${spec.frames[band.support].map((f) => html`<li>${f}</li>`)}
        </ul>`
      : html`<ul class="ex-frames" lang="en">
          ${spec.frames.B.map((f) => html`<li>${f}</li>`)}
        </ul>`,
    evidence,
    checklist: html`<ul class="ex-checks" lang="en">
      ${spec.revision.map((r) => html`<li>${r}</li>`)}
    </ul>`,
  });
  return { main, rail };
}
