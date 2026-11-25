// Teach It Back: the markup for teaching (type or record), feedback, "on my own" and the finished card.
// Pure functions of data. Feedback quotes only the learner's own words, shows no score, level, percent, rank,
// streak or timer, and never says an idea is true or false. The model answer is rendered only after a first try.
import { html, icon } from "../util.js";
import { conceptById, ownChoices } from "./concepts.js";
import { attemptsFor, modelVisible } from "./session.js";
import { SHORT_WORDS, compare } from "./check.js";
import { pointTitle } from "./ui.js";

const byId = (concept, id) => concept.points.find((p) => p.id === id);
const quote = (q) => html`<blockquote class="tb-quote">“${q}”</blockquote>`;

function framesHTML(I, concept, sess) {
  return html`<div class="tb-frames-box">
    <button type="button" class="btn small" data-tb-frames aria-expanded="${sess.framesOpen ? "true" : "false"}" aria-controls="tbFrames">
      ${sess.framesOpen ? I.T("Hide frames", "Ocultar estructuras") : I.T("Show frames", "Mostrar estructuras")}
    </button>
    <p class="fine">${sess.framesUsed ? I.T("Frames were opened, so this try counts as supported.", "Se abrieron las estructuras, así que este intento cuenta como con apoyo.") : I.T("Opening frames marks this try as supported. That is fine: it shows where help was used.", "Abrir las estructuras marca este intento como con apoyo. Está bien: muestra dónde se usó ayuda.")}</p>
    <div id="tbFrames" class="panel tb-frames" ${sess.framesOpen ? "" : "hidden"}>
      <p>${I.T("Start a sentence with one of these. Change the words to make it yours.", "Empieza una oración con una de estas. Cambia las palabras para hacerla tuya.")}</p>
      <ul lang="en">
        ${concept.points.map((p) => html`<li>${p.frame}</li>`)}
      </ul>
    </div>
  </div>`;
}

function recordHTML(I, sess, ui) {
  const can = ui.canRecord && !ui.micError;
  return html`<div class="tb-record panel">
    ${
      can
        ? html`<div class="tb-audio-row">
            <button type="button" class="btn small" data-tb-rec aria-pressed="${ui.recording ? "true" : "false"}">
              ${icon("record")} ${ui.recording ? I.T("Stop and keep my recording", "Parar y guardar mi grabación") : sess.audioId ? I.T("Record again", "Grabar otra vez") : I.T("Record my explanation", "Grabar mi explicación")}
            </button>
            ${sess.audioId && ui.audioUrl ? html`<audio controls preload="metadata" src="${ui.audioUrl}" aria-label="${I.S("My recording", "Mi grabación")}"></audio>` : ""}
            ${sess.audioId ? html`<button type="button" class="btn small ghost" data-tb-unrec>${I.T("Remove recording", "Quitar grabación")}</button>` : ""}
          </div>
          <p class="fine">${I.T("Your recording stays on this device for 30 days. It is never sent anywhere.", "Tu grabación se queda en este dispositivo por 30 días. Nunca se envía a ningún sitio.")}</p>`
        : html`<p class="tb-note" role="status" data-tb-norec>
              ${ui.micError ? I.T("The microphone is not available. ", "El micrófono no está disponible. ") : I.T("Recording is not available on this device or browser. ", "Grabar no está disponible en este dispositivo o navegador. ")}${I.T("You can type your explanation instead, or say it out loud and tick the key points you said below.", "Puedes escribir tu explicación, o decirla en voz alta y marcar abajo las ideas clave que dijiste.")}
            </p>
            <button type="button" class="btn small" data-tb-mode-set="type">${I.T("Type it instead", "Mejor la escribo")}</button>`
    }
  </div>`;
}

export function teachHTML(I, concept, sess, ui) {
  const record = sess.mode === "record";
  const own = sess.phase === "own";
  const planned = concept.points.filter((p) => sess.plan.includes(p.id));
  return html`<section aria-labelledby="tbStepH" class="tb-teach">
    <h2 id="tbStepH" tabindex="-1">${own ? I.T("On my own: teach it", "Por mi cuenta: enséñalo") : sess.phase === "revise" ? I.T("Teach it again", "Enséñalo otra vez") : I.T("Teach it back", "Enséñalo")}</h2>
    <p class="tb-job"><strong>${I.T("Your job", "Tu tarea")}:</strong> ${I.T(concept.audience.en, concept.audience.es)}</p>
    ${sess.phase === "revise" ? html`<p class="fine">${I.T("Your last try is below. Change anything you like.", "Tu último intento está abajo. Cambia lo que quieras.")}</p>` : ""}
    ${own ? html`<p class="fine">${I.T("No frames this time.", "Sin estructuras esta vez.")}</p>` : ""}
    ${planned.length ? html`<details class="tb-plan-note"><summary>${I.T("My plan", "Mi plan")}</summary><ul>${planned.map((p) => html`<li>${pointTitle(I, p)}</li>`)}</ul></details>` : ""}
    <fieldset class="tb-mode">
      <legend>${I.T("How will you teach it?", "¿Cómo lo vas a enseñar?")}</legend>
      <label class="tb-chip-choice"><input type="radio" name="tbMode" value="type" ${record ? "" : "checked"} /> ${I.T("Type it", "Escribirlo")}</label>
      <label class="tb-chip-choice"><input type="radio" name="tbMode" value="record" ${record ? "checked" : ""} /> ${I.T("Record it", "Grabarlo")}</label>
    </fieldset>
    ${record ? recordHTML(I, sess, ui) : ""}
    <label class="tb-label" for="tbText">${record ? I.T("Type what you said (optional)", "Escribe lo que dijiste (opcional)") : I.T("Your explanation", "Tu explicación")}</label>
    <textarea id="tbText" class="tb-text" rows="7" maxlength="4000" data-gramm="false">
${sess.draft}</textarea>
    <p class="fine">${I.T("Use your own words. You can use Spanish words too.", "Usa tus propias palabras. También puedes usar palabras en español.")}</p>
    ${
      record
        ? html`<fieldset class="tb-self">
            <legend>${I.T("Or tick the key points you said", "O marca las ideas clave que dijiste")}</legend>
            ${concept.points.map((p) => html`<label class="tb-plan-card"><input type="checkbox" name="tbSelf" value="${p.id}" ${sess.self.includes(p.id) ? "checked" : ""} /> <span>${pointTitle(I, p)}</span></label>`)}
          </fieldset>`
        : ""
    }
    ${own ? "" : framesHTML(I, concept, sess)}
    <p class="tb-msg" id="tbMsg" role="status" aria-live="polite">${ui.error || ""}</p>
    <div class="row-actions">
      ${sess.phase === "first" ? html`<button type="button" class="btn ghost" data-tb-go="plan">${icon("arrow-left")} ${I.T("Back", "Atrás")}</button>` : ""}
      <button type="button" class="btn primary" data-tb-submit>${icon("check")} ${I.T("I am done explaining", "Terminé de explicar")}</button>
    </div>
  </section>`;
}

function observationHTML(I, concept, a) {
  const s = a.strength;
  const n = a.nextStep;
  const strengthLine = !s
    ? ""
    : s.kind === "point"
      ? html`${I.T("You put this key point into your own words", "Pusiste esta idea clave en tus propias palabras")}: <em>${pointTitle(I, byId(concept, s.pointId))}</em>`
      : s.kind === "example"
        ? I.T("You added an example or a number to make the idea clear.", "Agregaste un ejemplo o un número para aclarar la idea.")
        : s.kind === "link"
          ? I.T("You connected two ideas with a reason.", "Conectaste dos ideas con una razón.")
          : html`${I.T("You used the key word", "Usaste la palabra clave")} “${s.term}”.`;
  const nextLine = !n
    ? ""
    : n.kind === "add-point"
      ? html`${I.T("You could add this key point", "Podrías agregar esta idea clave")}: <em>${pointTitle(I, byId(concept, n.pointId))}</em> <span class="fine" lang="en">(${byId(concept, n.pointId).frame})</span>`
      : I.T("You could add a small example. You might start with “For example, …”.", "Podrías agregar un ejemplo pequeño. Podrías empezar con «Por ejemplo, …».");
  return html`<div class="tb-obs-grid">
    <section class="panel tb-obs" aria-labelledby="tbStrH">
      <h3 id="tbStrH">${I.T("One strength", "Una fortaleza")}</h3>
      ${s ? html`<p>${strengthLine}</p>${quote(s.quote)}` : html`<p>${I.T("There is not enough here yet for the check to point to. Teach it again and add what you know.", "Todavía no hay suficiente para que la revisión señale algo. Enséñalo otra vez y agrega lo que sabes.")}</p>`}
    </section>
    ${
      n
        ? html`<section class="panel tb-obs" aria-labelledby="tbNextH">
            <h3 id="tbNextH">${I.T("One thing to try", "Una cosa para probar")}</h3>
            <p>${I.T("After your words", "Después de tus palabras")}:</p>
            ${quote(n.quote)}
            <p>${nextLine}</p>
          </section>`
        : html`<section class="panel tb-obs" aria-labelledby="tbNextH">
            <h3 id="tbNextH">${I.T("One thing to try", "Una cosa para probar")}</h3>
            <p>${I.T("All the key points are in your words. Next, try a different idea on your own.", "Todas las ideas clave están en tus palabras. Ahora prueba una idea distinta por tu cuenta.")}</p>
          </section>`
    }
  </div>`;
}

function pointsHTML(I, concept, attempt, a) {
  const self = !attempt.text.trim();
  return html`<section class="panel" aria-labelledby="tbPtsH">
    <h3 id="tbPtsH">${I.T("Key points", "Ideas clave")}</h3>
    <ul class="tb-points">
      ${concept.points.map((p, i) => {
        const hit = a?.points.find((x) => x.id === p.id);
        const found = self ? attempt.self.includes(p.id) : hit?.found;
        const claimed = attempt.claimed.includes(p.id);
        return html`<li class="tb-point">
          <p><strong>${i + 1}.</strong> ${pointTitle(I, p)}</p>
          <p class="tb-status">${found ? html`${icon("check")} ${self ? I.T("You ticked this", "Marcaste esto") : I.T("Found in your words", "Encontrada en tus palabras")}` : I.T("Not found yet", "Aún no se encuentra")}</p>
          ${found && !self && hit.quote ? quote(hit.quote) : ""}
          ${found ? "" : html`<label class="tb-claim"><input type="checkbox" data-tb-claim="${p.id}" ${claimed ? "checked" : ""} /> ${self ? I.T("I said this out loud", "Lo dije en voz alta") : I.T("I said this in other words", "Lo dije con otras palabras")}</label>`}
        </li>`;
      })}
    </ul>
  </section>`;
}

function changedHTML(I, concept, c) {
  return html`<section class="panel tb-changed" aria-labelledby="tbChangedH">
    <h3 id="tbChangedH">${I.T("What changed in this try", "Qué cambió en este intento")}</h3>
    ${
      c.same
        ? html`<p>${I.T("This try is the same as the last one.", "Este intento es igual al anterior.")}</p>`
        : html`<ul>
            <li>${I.T("Words added", "Palabras agregadas")}: <strong>${c.addedCount}</strong>${c.addedPhrases.length ? html`: ${c.addedPhrases.map((ph) => html`<q>${ph}</q> `)}` : ""}</li>
            <li>${I.T("Words taken out", "Palabras quitadas")}: <strong>${c.removedCount}</strong></li>
            <li>
              ${I.T("Key points now found in your words", "Ideas clave que ahora aparecen en tus palabras")}:
              ${c.newPoints.length ? html`<ul>${c.newPoints.map((n) => html`<li>${pointTitle(I, byId(concept, n.id))}${quote(n.quote)}</li>`)}</ul>` : html`<strong>${I.T("no new ones", "ninguna nueva")}</strong>`}
            </li>
            ${c.lostPoints.length ? html`<li>${I.T("No longer found", "Ya no se encuentran")}: ${c.lostPoints.map((id) => pointTitle(I, byId(concept, id)))}</li>` : ""}
          </ul>`
    }
    <p class="fine">${I.T("A longer try is not a better try. What matters is that your ideas are clear.", "Un intento más largo no es un intento mejor. Lo importante es que tus ideas sean claras.")}</p>
  </section>`;
}

export function feedbackHTML(I, concept, sess, attempt, analysis) {
  const mine = attemptsFor(sess, concept.id);
  const first = mine.find((x) => x.phase === "first" && x.text.trim());
  const change = attempt.phase === "revise" && first && attempt.text.trim() ? compare(concept, first.text, attempt.text) : null;
  const self = !attempt.text.trim();
  return html`<section aria-labelledby="tbStepH" class="tb-feedback">
    <h2 id="tbStepH" tabindex="-1">${I.T("Your feedback", "Tus comentarios")}</h2>
    <p class="lead" role="status">
      ${attempt.supported ? I.T("This try was supported.", "Este intento tuvo apoyo.") : I.T("This try was independent: no frames.", "Este intento fue independiente: sin estructuras.")}
      ${self ? I.T("You checked it yourself.", "Lo revisaste tú mismo.") : ""}
    </p>
    ${self ? "" : html`<div class="panel"><h3>${I.T("What you said", "Lo que dijiste")}</h3><p class="tb-mine">${attempt.text}</p></div>`}
    ${analysis?.short && !self ? html`<p class="tb-note">${I.T(`Your explanation is short (under ${SHORT_WORDS} words), so there is little for the check to look at. You can add more of your ideas when you teach again.`, `Tu explicación es corta (menos de ${SHORT_WORDS} palabras), así que la revisión tiene poco que mirar. Puedes agregar más ideas cuando lo enseñes otra vez.`)}</p>` : ""}
    ${self ? "" : observationHTML(I, concept, analysis)}
    ${pointsHTML(I, concept, attempt, analysis)}
    ${change ? changedHTML(I, concept, change) : ""}
    ${modelVisible(sess, concept.id) ? html`<details class="panel tb-model"><summary><h3>${I.T("See a model explanation", "Ver una explicación modelo")}</h3></summary><p lang="en">${concept.modelAnswer.en}</p><p class="fine">${I.T("This is one way to say it, not the only right way. Say it your way.", "Esta es una manera de decirlo, no la única. Dilo a tu manera.")}</p></details>` : ""}
    <details class="panel">
      <summary><h3>${I.T("What this check can and cannot do", "Lo que esta revisión puede y no puede hacer")}</h3></summary>
      <ul>
        <li>${I.T("It looks for key words for each point, in English or Spanish. It can miss a good idea said in other words, so you can tick “I said this.”", "Busca palabras clave de cada idea, en inglés o español. Puede no ver una buena idea dicha con otras palabras, por eso puedes marcar «Lo dije».")}</li>
        <li>${I.T("It does not decide whether your ideas are true. It does not judge your accent, how fast you talk, spelling, or grammar.", "No decide si tus ideas son ciertas. No juzga tu acento, qué tan rápido hablas, la ortografía ni la gramática.")}</li>
        <li>${I.T("Nothing you write or record leaves this device. No AI is used.", "Nada de lo que escribes o grabas sale de este dispositivo. No se usa IA.")}</li>
      </ul>
    </details>
    <div class="row-actions">
      ${attempt.phase === "own" ? html`<button type="button" class="btn primary" data-tb-finish>${I.T("Finish", "Terminar")} ${icon("arrow-right")}</button>` : html`<button type="button" class="btn primary" data-tb-revise>${icon("retry")} ${I.T("Teach it again", "Enseñarlo otra vez")}</button>
        <button type="button" class="btn" data-tb-go="own">${I.T("On my own: a different idea", "Por mi cuenta: una idea distinta")} ${icon("arrow-right")}</button>`}
    </div>
  </section>`;
}

export function ownHTML(I, concept) {
  const choices = ownChoices(concept);
  return html`<section aria-labelledby="tbStepH" class="tb-own">
    <h2 id="tbStepH" tabindex="-1">${I.T("On my own", "Por mi cuenta")}</h2>
    <p class="lead">${I.T("Now explain a different idea from the same subject. There are no sentence frames this time. It is the same thinking with fewer supports.", "Ahora explica una idea distinta de la misma materia. Esta vez no hay estructuras de oración. Es el mismo pensamiento con menos apoyos.")}</p>
    <ul class="tb-cards">
      ${choices.map((c) => html`<li><button type="button" class="tb-card" data-tb-own="${c.id}"><span class="tb-card-title">${I.T(c.title.en, c.title.es)}</span></button></li>`)}
    </ul>
    <div class="row-actions"><button type="button" class="btn ghost" data-tb-finish>${I.T("Finish without this step", "Terminar sin este paso")}</button></div>
  </section>`;
}

const PHASE = { first: ["first try", "primer intento"], revise: ["second try after feedback", "segundo intento después de los comentarios"], own: ["on my own", "por mi cuenta"] };
const HOW = { type: ["typed", "escrito"], record: ["recorded", "grabado"] };

function triesHTML(I, list) {
  return list.length
    ? html`<ul>
        ${list.map((a) => html`<li>${I.T(conceptById(a.conceptId).title.en, conceptById(a.conceptId).title.es)}: ${I.T(...PHASE[a.phase])}, ${a.text.trim() ? I.T(...HOW[a.mode]) : I.T("self-check", "autorrevisión")}</li>`)}
      </ul>`
    : html`<p>${I.T("None this time.", "Ninguno esta vez.")}</p>`;
}

export function doneHTML(I, sess, suggestions, share = { inClass: false, status: "" }) {
  const all = sess.attempts;
  const ids = [...new Set(all.map((a) => a.conceptId))];
  const first = all.find((a) => a.phase === "first" && a.text.trim());
  const revised = all.findLast((a) => a.phase === "revise" && a.text.trim());
  const base = conceptById(sess.id);
  const change = first && revised ? compare(base, first.text, revised.text) : null;
  return html`<section aria-labelledby="tbStepH" class="tb-done">
    <h2 id="tbStepH" tabindex="-1">${I.T("You taught it back", "Lo enseñaste")}</h2>
    <div class="panel"><h3>${I.T("What you explained", "Lo que explicaste")}</h3>
      <ul>${ids.map((id) => html`<li>${I.T(conceptById(id).title.en, conceptById(id).title.es)}</li>`)}</ul></div>
    <div class="tb-obs-grid">
      <section class="panel"><h3>${I.T("Independent tries (no frames)", "Intentos independientes (sin estructuras)")}</h3>${triesHTML(I, all.filter((a) => !a.supported))}</section>
      <section class="panel"><h3>${I.T("Supported tries (frames or revising after feedback)", "Intentos con apoyo (estructuras o revisar después de los comentarios)")}</h3>${triesHTML(I, all.filter((a) => a.supported))}</section>
    </div>
    <div class="panel"><h3>${I.T("What you added after feedback", "Lo que agregaste después de los comentarios")}</h3>
      ${change ? html`<p>${I.T("Words added", "Palabras agregadas")}: <strong>${change.addedCount}</strong>. ${change.newPoints.length ? I.T(`Key points now in your words: ${change.newPoints.length}.`, `Ideas clave que ahora aparecen en tus palabras: ${change.newPoints.length}.`) : I.T("No new key points were found.", "No se encontraron ideas clave nuevas.")}</p>` : html`<p>${I.T("You did not teach it a second time. You can do that whenever you like.", "No lo enseñaste una segunda vez. Puedes hacerlo cuando quieras.")}</p>`}</div>
    <div class="panel"><h3>${I.T("What to try next", "Qué probar después")}</h3>
      <ul class="tb-cards">${suggestions.map((c) => html`<li><button type="button" class="tb-card" data-tb-pick="${c.id}"><span class="tb-card-title">${I.T(c.title.en, c.title.es)}</span></button></li>`)}</ul></div>
    <div class="row-actions">
      <button type="button" class="btn" data-tb-copy>${icon("copy")} ${I.T("Copy my words", "Copiar mis palabras")}</button>
      <button type="button" class="btn ghost" data-tb-print>${icon("print")} ${I.T("Print my words", "Imprimir mis palabras")}</button>
      ${share.inClass ? html`<button type="button" class="btn" data-tb-share>${icon("mail")} ${I.T("Share with my teacher", "Compartir con mi docente")}</button>` : ""}
      <button type="button" class="btn ghost" data-tb-newtopic>${I.T("Choose another idea", "Elegir otra idea")}</button>
    </div>
    ${share.inClass ? html`<p class="fine" role="status">${share.status === "sent" ? I.T("Sent to your teacher. Nothing else was sent.", "Enviado a tu docente. No se envió nada más.") : share.status === "failed" ? I.T("Could not send it. Your words are still saved here.", "No se pudo enviar. Tus palabras siguen guardadas aquí.") : I.T("Sharing sends only the words you typed, and only when you press the button.", "Compartir envía solo las palabras que escribiste, y solo cuando presionas el botón.")}</p>` : ""}
  </section>`;
}
