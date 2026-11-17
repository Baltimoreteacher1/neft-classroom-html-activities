// Experience Builder: "Preview as a student". The current draft is played through the REAL simulation runtime
// (src/sim/runtime.js) and the real character matcher (src/sim/characters.js), so what the instructor sees is exactly
// what the engine will accept from a learner: the same doors, the same locked tasks, the same endings.
// This is the builder's own plain walk-through of that runtime; "Open the full player" opens the draft in the
// simulation player itself (/simulations/x/<key>), which reads the same draft from this device.
// Rules it keeps: a preview writes nothing to a learner's record (no ledger entry, no feedback loop, no save).
import { lineFor, matchTopic, suggestions } from "../sim/characters.js";
import { act, hotspotsOf, newState, outcomeOf, progressOf, validActions } from "../sim/runtime.js";
import { OPEN_ACTION, characterOf, evidenceOf, taskOf } from "../sim/schema.js";
import { html } from "../util.js";

export const newPreview = (def) => ({ state: newState(def), open: null, note: null, last: null });

const ERR = {
  "too-short": ["Write a little more first.", "Primero escriba un poco más."],
  "cite-evidence": ["Tick at least one piece of evidence.", "Marque al menos una evidencia."],
  "reason-needed": ["Say why in a few words.", "Diga por qué en pocas palabras."],
  "not-changed": [
    "A revision has to change the first draft.",
    "Una revisión tiene que cambiar el primer borrador.",
  ],
  "choose-relation": [
    "Choose agree, conflict or unrelated.",
    "Elija de acuerdo, en conflicto o sin relación.",
  ],
  "choose-stronger": ["Choose which one is stronger.", "Elija cuál es más fuerte."],
};

/** Apply one learner action to the preview. Returns the events (or sets `note` to the runtime's refusal). */
export function previewAct(def, pv, action) {
  const res = act(def, pv.state, action);
  if (res.error) {
    pv.note = ERR[res.error] || [
      `The engine refused that: ${res.error}`,
      `El motor no aceptó eso: ${res.error}`,
    ];
    return null;
  }
  pv.state = res.state;
  pv.note = null;
  pv.last = res.events;
  return res.events;
}

/** A click on a spot: open the evidence, the person, the task, or walk through the door. */
export function previewOpen(def, pv, hotspotId) {
  const h = hotspotsOf(def, pv.state).find((x) => x.id === hotspotId);
  if (!h) return;
  const [kind, id] = Object.entries(h.opens)[0];
  if (kind === "scene") {
    previewAct(def, pv, { type: "move", scene: id });
    pv.open = null;
  } else if (kind === "evidence") {
    if (!pv.state.evidence[id])
      previewAct(def, pv, { type: OPEN_ACTION[evidenceOf(def, id).kind], evidence: id });
    pv.open = { kind, id };
  } else pv.open = { kind, id, line: null };
}

/** A typed question: matched to a topic exactly as the player does on the device. */
export function previewAsk(def, pv, characterId, question) {
  const c = characterOf(def, characterId);
  const open = suggestions(def, pv.state, characterId);
  const hit = matchTopic(c, question, { open: [...open.fresh, ...open.asked].map((t) => t.id) });
  const events = previewAct(def, pv, {
    type: "ask",
    character: characterId,
    topic: hit.topic && !hit.locked ? hit.topic : null,
  });
  if (events) pv.open = { kind: "character", id: characterId, line: lineFor(def, events[0]) };
}
export function previewTopic(def, pv, characterId, topicId, clarify = false) {
  const events = previewAct(def, pv, {
    type: clarify ? "clarify" : "ask",
    character: characterId,
    topic: topicId,
  });
  if (events) pv.open = { kind: "character", id: characterId, line: lineFor(def, events[0]) };
}

function openHTML(I, def, pv) {
  const o = pv.open;
  if (!o) return "";
  if (o.kind === "evidence") {
    const e = evidenceOf(def, o.id);
    return html`<section class="xb-pv-open" data-xb-pv-open="evidence" aria-live="polite">
      <h4>${I.S(...e.title)}</h4>
      ${e.kind === "audio" ? html`<p><button type="button" class="btn small" data-xb-act="pv-listen" data-xb-arg="${JSON.stringify({ id: e.id })}">${I.T("Play the message", "Reproducir el mensaje")}</button> <span class="fine">${I.T("Transcript:", "Transcripción:")}</span></p>` : ""}
      <p class="xb-pv-body">${e.body[0]}</p>
      <p class="fine">${I.T("Added to the notebook.", "Agregado al cuaderno.")}</p>
    </section>`;
  }
  if (o.kind === "character") {
    const c = characterOf(def, o.id);
    const s = suggestions(def, pv.state, o.id);
    const q = (t, clarify) =>
      html`<li>
        <button
          type="button"
          class="btn small ghost"
          data-xb-act="pv-topic"
          data-xb-arg="${JSON.stringify({ character: c.id, topic: t.id, clarify })}"
        >
          ${I.S(...(clarify ? t.clarify.ask : t.ask))}
        </button>
      </li>`;
    return html`<section class="xb-pv-open" data-xb-pv-open="character" aria-live="polite">
      <h4>${c.name} · ${I.S(...c.role)}</h4>
      <p class="xb-pv-body" data-xb-pv-line>${I.S(...(o.line?.text || c.greeting))}</p>
      <ul class="xb-pv-questions">
        ${s.fresh.map((t) => q(t, false))}${s.clarify.map((t) => q(t, true))}
      </ul>
      <label class="field" for="xbPvAsk"
        >${I.T("Or type your own question", "O escriba su propia pregunta")}
        <input id="xbPvAsk" type="text" maxlength="240" data-xb-pv-ask="${c.id}"
      /></label>
      <button
        type="button"
        class="btn small"
        data-xb-act="pv-ask"
        data-xb-arg="${JSON.stringify({ character: c.id })}"
      >
        ${I.T("Ask", "Preguntar")}
      </button>
    </section>`;
  }
  const t = taskOf(def, o.id);
  const done = pv.state.tasks[t.id]?.done;
  const held = Object.keys(pv.state.evidence).map((id) => evidenceOf(def, id));
  const arg = JSON.stringify({ task: t.id });
  let body;
  if (done && t.type !== "compare")
    body = html`<p class="xb-badge is-ok">${I.T("Done", "Hecho")}</p>`;
  else if (t.type === "compare") {
    const pairs = validActions(def, pv.state).filter(
      (a) => a.type === "compare" && a.task === t.id,
    );
    body = pairs.length
      ? html`${pairs.slice(0, 1).map((a) => {
            const [x, y] = t.pairs[a.pair].map((id) => evidenceOf(def, id));
            return html`<p><strong>A:</strong> ${x.body[0]}</p>
              <p><strong>B:</strong> ${y.body[0]}</p>
              <input type="hidden" data-xb-pv-pair value="${a.pair}" />
              <label class="field" for="xbPvRel"
                >${I.T("A and B…", "A y B…")}
                <select id="xbPvRel" data-xb-pv-relation>
                  <option value="agree">${I.S("agree", "están de acuerdo")}</option>
                  <option value="conflict">${I.S("conflict", "están en conflicto")}</option>
                  <option value="unrelated">${I.S("are unrelated", "no tienen relación")}</option>
                </select></label
              >
              <label class="field" for="xbPvStr"
                >${I.T("Which is stronger?", "¿Cuál es más fuerte?")}
                <select id="xbPvStr" data-xb-pv-stronger>
                  <option value="${x.id}">A</option>
                  <option value="${y.id}">B</option>
                  <option value="same">${I.S("The same", "Igual")}</option>
                </select></label
              >`;
          })}
          <label class="field" for="xbPvWhy"
            >${I.T("Why?", "¿Por qué?")}<input id="xbPvWhy" type="text" data-xb-pv-reason
          /></label>
          <button type="button" class="btn small" data-xb-act="pv-compare" data-xb-arg="${arg}">
            ${I.T("Compare", "Comparar")}
          </button>`
      : html`<p class="xb-badge is-ok">${I.T("Compared", "Comparado")}</p>`;
  } else if (t.type === "decide")
    body = html`<fieldset class="xb-set">
        <legend>${I.T("Which explanation?", "¿Qué explicación?")}</legend>
        ${t.options.map((op, i) => html`<label class="xb-check" for="xbPvOpt${i}"><input id="xbPvOpt${i}" type="radio" name="xbPvOpt" value="${op.id}" data-xb-pv-option /> ${I.S(...op.label)}</label>`)}
      </fieldset>
      <fieldset class="xb-set">
        <legend>${I.T("Evidence you cite", "Evidencia que cita")}</legend>
        ${held.map((e, i) => html`<label class="xb-check" for="xbPvCite${i}"><input id="xbPvCite${i}" type="checkbox" value="${e.id}" data-xb-pv-cite /> ${I.S(...e.title)}</label>`)}
      </fieldset>
      <button type="button" class="btn small" data-xb-act="pv-decide" data-xb-arg="${arg}">
        ${I.T("Decide", "Decidir")}
      </button>`;
  else
    body = html`${(t.frames || []).length ? html`<p class="fine">${I.T("Sentence frames a learner may open:", "Marcos de oración que un estudiante puede abrir:")} ${t.frames.map((f) => I.S(...f)).join(" · ")}</p>` : ""}
      <label class="field" for="xbPvText"
        >${I.S(`Your response (at least ${t.minWords || 5} words)`, `Su respuesta (al menos ${t.minWords || 5} palabras)`)}
        <textarea id="xbPvText" rows="4" data-xb-pv-text></textarea>
      </label>
      <button type="button" class="btn small" data-xb-act="pv-submit" data-xb-arg="${arg}">
        ${I.T("Submit", "Enviar")}
      </button>
      <p class="fine">
        ${I.T("In the real player the learner can record or type here, and the feedback loop answers.", "En el reproductor real, el estudiante puede grabar o escribir aquí, y el ciclo de comentarios responde.")}
      </p>`;
  return html`<section class="xb-pv-open" data-xb-pv-open="task" aria-live="polite">
    <h4>${I.S(...t.prompt)}</h4>
    ${body}
  </section>`;
}

export function previewHTML(I, def, pv, playHref) {
  const scene = def.scenes.find((s) => s.id === pv.state.scene);
  const progress = progressOf(def, pv.state);
  const outcome = outcomeOf(def, pv.state);
  const actNow = def.acts[Math.min(progress.act, def.acts.length - 1)];
  return html`<section class="panel xb-pv" data-xb-preview>
    <p class="fine">
      ${I.T("This is what a learner meets, run by the same engine. Nothing you do here is saved to anyone's record.", "Esto es lo que encuentra un estudiante, con el mismo motor. Nada de lo que haga aquí se guarda en el registro de nadie.")}
    </p>
    <div class="row-actions">
      <button type="button" class="btn small ghost" data-xb-act="pv-reset">
        ${I.T("Start the preview again", "Empezar la vista previa otra vez")}
      </button>
      <a class="btn small" href="${playHref}" target="_blank" rel="noopener"
        >${I.T("Open the full player", "Abrir el reproductor completo")}</a
      >
    </div>
    <p class="xb-pv-act" data-xb-pv-progress>
      ${I.S(`Part ${Math.min(progress.act + 1, def.acts.length)} of ${def.acts.length}: ${actNow.title[0]}`, `Parte ${Math.min(progress.act + 1, def.acts.length)} de ${def.acts.length}: ${actNow.title[1]}`)}
      ·
      ${I.S(`${progress.evidence.found} of ${progress.evidence.total} pieces of evidence`, `${progress.evidence.found} de ${progress.evidence.total} evidencias`)}
    </p>
    <h3 data-xb-pv-scene>${I.S(...scene.title)}</h3>
    <p>${I.S(...scene.description)}</p>
    <ul class="xb-pv-spots">
      ${hotspotsOf(def, pv.state).map((h) => html`<li><button type="button" class="btn small" data-xb-act="pv-open" data-xb-arg="${JSON.stringify({ id: h.id })}">${I.S(...h.label)}</button></li>`)}
    </ul>
    ${pv.note ? html`<p class="xb-status is-bad" role="status" data-xb-pv-note>${I.S(...pv.note)}</p>` : ""}
    ${openHTML(I, def, pv)}
    ${
      outcome
        ? html`<section class="xb-pv-outcome" data-xb-pv-outcome="${outcome.id}" role="status">
            <h4>${I.S(...outcome.title)}</h4>
            <p>${I.S(...outcome.text)}</p>
          </section>`
        : ""
    }
  </section>`;
}
