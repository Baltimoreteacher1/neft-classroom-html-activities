// Living Language Simulation Engine: the contextual panels beside a scene: evidence inspection, dialogue with a
// character, the comparison of two pieces of evidence, a decision, and the mission journal. Each returns markup
// for the state it is given and changes nothing; clicks are handled in ui-actions.js. Evidence strength is never
// shown to the learner (judging it is the task). Every string a person reads is English and Spanish.
import { speakingNow } from "./ui-state.js";
import { canSpeak } from "../speech.js";
import { canDictate } from "../stt.js";
import { html, raw } from "../util.js";
import { glyph, portraitSVG } from "./art.js";
import { suggestions, transcriptOf } from "./characters.js";
import {
  OPEN_ACTION,
  characterOf,
  evalCond,
  evidenceOf,
  reachedAct,
  sceneOf,
  taskOf,
} from "./schema.js";

export const T = (I, pair) => I.T(pair[0], pair[1]);
export const S = (I, pair) => I.S(pair[0], pair[1]);

const KIND_NAME = {
  document: ["Document", "Documento"],
  data: ["Data", "Datos"],
  object: ["Object", "Objeto"],
  audio: ["Audio message", "Mensaje de audio"],
  testimony: ["What someone said", "Lo que dijo una persona"],
};
export const kindGlyph = (kind) =>
  glyph(kind === "testimony" ? "talk" : OPEN_ACTION[kind] || "examine");

export const panelHead = (I, title, eyebrow = "") =>
  html`<header class="sim-panel-head">
    <div>
      ${eyebrow ? html`<p class="sim-kicker">${eyebrow}</p>` : ""}
      <h2 id="simPanelH" tabindex="-1">${title}</h2>
    </div>
    <button type="button" class="btn small sim-close" data-sim-close>
      ${I.T("Close", "Cerrar")}
    </button>
  </header>`;

/** One piece of evidence as a card: kind, title, the words. */
export const evidenceCard = (I, e) =>
  html`<div class="sim-ev-card">
    <p class="sim-kicker">${raw(kindGlyph(e.kind))} ${T(I, KIND_NAME[e.kind])}</p>
    <h3>${T(I, e.title)}</h3>
    <p class="sim-ev-body">${T(I, e.body)}</p>
  </div>`;

// ── evidence inspection ──────────────────────────────────────────────────────
export function evidencePanel(I, def, state, ui) {
  const e = evidenceOf(def, ui.panel.id);
  const held = state.evidence[e.id];
  const where = held && sceneOf(def, held.scene);
  if (e.kind === "audio" && !held) {
    // A message is heard first. The words stay hidden unless the learner opens them, which is recorded as support.
    const open = Boolean(ui.listen.transcript);
    return html`${panelHead(I, T(I, e.title), T(I, KIND_NAME.audio))}
      <div class="sim-listen">
        ${
          canSpeak()
            ? html`<button type="button" class="btn btn-primary" data-sim-play="${e.id}">
                ${raw(glyph("listen"))}
                ${speakingNow(ui) ? I.T("Stop", "Detener") : ui.listen.played ? I.T("Play again", "Escuchar otra vez") : I.T("Play the message", "Escuchar el mensaje")}
              </button>`
            : html`<p class="sim-note">
                ${I.T("This browser cannot read the message aloud. Open the transcript to read it.", "Este navegador no puede leer el mensaje en voz alta. Abre la transcripción para leerlo.")}
              </p>`
        }
        <button type="button" class="btn" data-sim-transcript aria-expanded="${open}">
          ${open ? I.T("Transcript is open", "La transcripción está abierta") : I.T("Show the transcript", "Mostrar la transcripción")}
        </button>
        <p class="sim-note">
          ${
            open
              ? I.T(
                  "You opened the transcript, so this listening is recorded as done with support.",
                  "Abriste la transcripción, así que esta escucha queda registrada como hecha con apoyo.",
                )
              : I.T(
                  "Listen as many times as you like. Opening the transcript is fine, and it is recorded as support.",
                  "Escucha las veces que quieras. Puedes abrir la transcripción, y queda registrado como apoyo.",
                )
          }
        </p>
        ${open ? html`<blockquote class="sim-ev-body">${T(I, e.body)}</blockquote>` : ""}
        <button
          type="button"
          class="btn btn-primary"
          data-sim-collect="${e.id}"
          ${ui.listen.played || open ? "" : raw('aria-disabled="true"')}
        >
          ${I.T("Add to my evidence notebook", "Agregar a mi cuaderno de evidencia")}
        </button>
      </div>`;
  }
  return html`${panelHead(I, T(I, e.title), T(I, KIND_NAME[e.kind]))}
    <div class="sim-ev-card">
      <p class="sim-ev-body">${T(I, e.body)}</p>
      ${
        e.kind === "audio" && canSpeak()
          ? html`<button type="button" class="btn small" data-sim-play="${e.id}">
              ${raw(glyph("listen"))} ${I.T("Hear it", "Escucharlo")}
            </button>`
          : ""
      }
    </div>
    <p class="sim-note">
      ${raw(glyph("done"))}
      ${I.T(`In your notebook. Found at ${where?.title[0] || ""}.`, `En tu cuaderno. Lo encontraste en ${where?.title[1] || ""}.`)}
    </p>`;
}

// ── dialogue ─────────────────────────────────────────────────────────────────
export function dialoguePanel(I, def, state, ui) {
  const who = characterOf(def, ui.panel.id);
  const lines = transcriptOf(def, state, who.id).slice(-8);
  const s = suggestions(def, state, who.id);
  const mine = ui.lastQ?.character === who.id ? ui.lastQ : null;
  const ask = (t, attr, pair, cls = "") =>
    html`<li>
      <button type="button" class="sim-q ${cls}" ${raw(attr)}="${t.id}">${T(I, pair)}</button>
    </li>`;
  return html`${panelHead(I, who.name, T(I, who.role))}
    <div class="sim-who">
      ${raw(portraitSVG(who.look, lines.length ? "pleased" : "neutral"))}
      <p class="sim-style">${T(I, who.style)}</p>
    </div>
    <div class="sim-talk" role="log" aria-label="${I.S("Conversation", "Conversación")}">
      ${
        lines.length
          ? lines.map(
              (line) =>
                html`<p class="sim-line is-${line.who}">
                  <span class="visually-hidden"
                    >${line.who === "me" ? I.S("You:", "Tú:") : `${who.name}:`}</span
                  >${T(I, line.text)}
                </p>`,
            )
          : html`<p class="sim-line is-them">${T(I, who.greeting)}</p>`
      }
      ${
        mine
          ? html`<p class="sim-note" id="simAsked">
              ${I.T("You asked:", "Preguntaste:")} <q>${mine.text}</q>
              ${mine.matched ? "" : I.T(" This person could not answer that.", " Esta persona no pudo responder eso.")}
            </p>`
          : ""
      }
    </div>
    ${
      s.fresh.length
        ? html`<h3 class="sim-sub">
              ${I.T("Questions you could ask", "Preguntas que puedes hacer")}
            </h3>
            <ul class="sim-qs">
              ${s.fresh.map((t) => ask(t, "data-sim-ask", t.ask))}
            </ul>`
        : ""
    }
    ${
      s.clarify.length
        ? html`<h3 class="sim-sub">${I.T("Ask what they meant", "Pregunta qué quiso decir")}</h3>
            <ul class="sim-qs">
              ${s.clarify.map((t) => ask(t, "data-sim-clarify", t.clarify.ask, "is-clarify"))}
            </ul>`
        : ""
    }
    ${
      s.asked.length
        ? html`<details class="sim-fold">
            <summary>${I.T("Ask again", "Preguntar otra vez")}</summary>
            <ul class="sim-qs">
              ${s.asked.map((t) => ask(t, "data-sim-ask", t.ask, "is-asked"))}
            </ul>
          </details>`
        : ""
    }
    ${
      s.closed
        ? html`<p class="sim-note">
            ${I.T("This person may say more after you find more evidence.", "Esta persona puede decir más cuando encuentres más evidencia.")}
          </p>`
        : ""
    }
    <div class="sim-ownq">
      <label class="field" for="simQ"
        >${I.T("Or ask your own question", "O haz tu propia pregunta")}</label
      >
      <div class="sim-row">
        <input
          id="simQ"
          type="text"
          class="sim-input"
          data-sim-question
          maxlength="240"
          autocomplete="off"
          value="${ui.question || ""}"
        />
        ${
          canDictate()
            ? html`<button
                type="button"
                class="btn small"
                data-sim-qdict
                aria-pressed="${ui.dict?.key === "q"}"
              >
                ${ui.dict?.key === "q" ? I.T("Stop", "Detener") : I.T("Speak it", "Decirla")}
              </button>`
            : ""
        }
        <button type="button" class="btn btn-primary small" data-sim-send="${who.id}">
          ${I.T("Ask", "Preguntar")}
        </button>
      </div>
      ${
        mine?.weak && !ui.preview
          ? html`<p class="sim-note">
              <button type="button" class="btn small" data-sim-assist="${who.id}">
                ${I.T("Ask the helper to match my question", "Pedir al ayudante que relacione mi pregunta")}
              </button>
              ${I.T("This sends only your typed question to a helper on this site. It picks one of this person's answers; it never writes one.", "Esto envía solo tu pregunta escrita a un ayudante de este sitio. Elige una de las respuestas de esta persona; nunca escribe una.")}
            </p>`
          : ""
      }
    </div>`;
}

// ── compare ──────────────────────────────────────────────────────────────────
export function comparePanel(I, def, state, ui) {
  const task = taskOf(def, ui.panel.id);
  const result = state.tasks[task.id];
  const ready = task.pairs
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.every((e) => state.evidence[e]));
  const pick = ui.cmp[task.id] || {};
  const index = ready.some((x) => x.i === pick.pair) ? pick.pair : ready[0]?.i;
  const pair = task.pairs[index];
  const head = panelHead(I, T(I, task.prompt), I.T("Compare evidence", "Comparar evidencia"));
  if (!pair)
    return html`${head}
      <p class="sim-note">
        ${I.T("You need both pieces of evidence first.", "Primero necesitas las dos evidencias.")}
      </p>`;
  const [a, b] = pair.map((id) => evidenceOf(def, id));
  if (result?.resolved)
    return html`${head}
      <div class="sim-pair">${evidenceCard(I, a)}${evidenceCard(I, b)}</div>
      <p class="feedback is-right" role="status">
        ${I.T("You settled this. Your reason:", "Aclaraste esto. Tu razón:")}
        <q>${result.reason}</q>
      </p>`;
  const radio = (name, value, label, on) =>
    html`<label class="sim-choice"
      ><input type="radio" name="${name}" value="${value}" ${on ? raw("checked") : ""} />
      <span>${label}</span></label
    >`;
  const last = result?.pairs?.[index];
  return html`${head}
    ${
      ready.length > 1
        ? html`<fieldset class="sim-set">
            <legend>${I.T("Which two?", "¿Cuáles dos?")}</legend>
            ${ready.map(({ p, i }) => radio("sim-pair", i, html`${T(I, evidenceOf(def, p[0]).title)} · ${T(I, evidenceOf(def, p[1]).title)}`, i === index))}
          </fieldset>`
        : ""
    }
    <div class="sim-pair">${evidenceCard(I, a)}${evidenceCard(I, b)}</div>
    <fieldset class="sim-set">
      <legend>
        ${I.T("What do these two say about each other?", "¿Qué dicen estas dos, una de la otra?")}
      </legend>
      ${radio("sim-rel", "agree", I.T("They agree.", "Coinciden."), pick.relation === "agree")}
      ${radio("sim-rel", "conflict", I.T("They conflict: both cannot be true.", "Se contradicen: las dos no pueden ser ciertas."), pick.relation === "conflict")}
      ${radio("sim-rel", "unrelated", I.T("They are about different things.", "Hablan de cosas distintas."), pick.relation === "unrelated")}
    </fieldset>
    <fieldset class="sim-set">
      <legend>${I.T("Which is stronger evidence?", "¿Cuál es evidencia más fuerte?")}</legend>
      ${radio("sim-strong", a.id, T(I, a.title), pick.stronger === a.id)}
      ${radio("sim-strong", b.id, T(I, b.title), pick.stronger === b.id)}
      ${radio("sim-strong", "same", I.T("About the same.", "Más o menos igual."), pick.stronger === "same")}
    </fieldset>
    <label class="field" for="simReason"
      >${I.T("Why? Give a short reason.", "¿Por qué? Da una razón corta.")}</label
    >
    <input
      id="simReason"
      type="text"
      class="sim-input"
      data-sim-reason="${task.id}"
      maxlength="300"
      value="${ui.drafts[`reason:${task.id}`] || ""}"
    />
    ${
      last && !last.right
        ? html`<p class="feedback is-hint" role="status">
            ${I.T("Not settled yet. Read both again. Can both be true at the same time? Which one was measured or recorded when it happened, and which one is what someone remembers or guesses?", "Todavía no está aclarado. Lee las dos otra vez. ¿Pueden ser ciertas las dos al mismo tiempo? ¿Cuál se midió o registró cuando pasó, y cuál es lo que alguien recuerda o supone?")}
          </p>`
        : ""
    }
    ${noteOf(I, ui)}
    <button
      type="button"
      class="btn btn-primary"
      data-sim-compare="${task.id}"
      data-pair="${index}"
    >
      ${I.T("Record my comparison", "Registrar mi comparación")}
    </button>`;
}

export const noteOf = (I, ui) =>
  ui.note ? html`<p class="feedback is-hint" role="alert">${T(I, ui.note)}</p>` : "";

// ── decide ───────────────────────────────────────────────────────────────────
export function decidePanel(I, def, state, ui) {
  const task = taskOf(def, ui.panel.id);
  const result = state.tasks[task.id];
  const head = panelHead(I, I.T("Make a decision", "Toma una decisión"), "");
  const held = Object.keys(state.evidence).map((id) => evidenceOf(def, id));
  if (result?.done) {
    const option = task.options.find((o) => o.id === result.choice);
    return html`${head}
      <p class="sim-prompt">${T(I, task.prompt)}</p>
      <p class="sim-decided">
        <strong>${I.T("You decided:", "Decidiste:")}</strong> ${T(I, option.label)}
      </p>
      <h3 class="sim-sub">${I.T("Evidence you cited", "Evidencia que citaste")}</h3>
      <ul class="sim-list">
        ${result.cited.map((id) => html`<li>${T(I, evidenceOf(def, id).title)}</li>`)}
      </ul>
      ${option.reply ? html`<p class="sim-line is-them">${T(I, option.reply)}</p>` : ""}`;
  }
  const draft = ui.cite[task.id] || { option: "", cited: [] };
  const final = task.options.some((o) => o.explanation);
  return html`${head}
    <p class="sim-prompt">${T(I, task.prompt)}</p>
    <fieldset class="sim-set">
      <legend>${I.T("Choose one", "Elige una")}</legend>
      ${task.options.map(
        (o) =>
          html`<label class="sim-choice"
            ><input
              type="radio"
              name="sim-opt"
              value="${o.id}"
              ${draft.option === o.id ? raw("checked") : ""}
            />
            <span>${T(I, o.label)}</span></label
          >`,
      )}
    </fieldset>
    <fieldset class="sim-set">
      <legend>
        ${I.T("Evidence you stand on (mark at least one)", "Evidencia en la que te apoyas (marca al menos una)")}
      </legend>
      ${held.map(
        (e) =>
          html`<label class="sim-choice"
            ><input
              type="checkbox"
              data-sim-cite="${e.id}"
              ${draft.cited.includes(e.id) ? raw("checked") : ""}
            />
            <span>${T(I, e.title)}</span></label
          >`,
      )}
    </fieldset>
    ${noteOf(I, ui)}
    ${
      ui.confirm === task.id
        ? html`<div
            class="sim-confirm"
            role="group"
            aria-label="${I.S("Confirm your decision", "Confirma tu decisión")}"
          >
            <p>
              ${I.T("This decision is made once, and the city will act on it. Are you ready?", "Esta decisión se toma una sola vez, y la ciudad va a actuar según ella. ¿Ya?")}
            </p>
            <button
              type="button"
              class="btn btn-primary"
              data-sim-decide="${task.id}"
              data-sure="1"
            >
              ${I.T("Yes, this is my decision", "Sí, esta es mi decisión")}
            </button>
            <button type="button" class="btn" data-sim-unsure>
              ${I.T("Let me look again", "Quiero mirar otra vez")}
            </button>
          </div>`
        : html`<button
            type="button"
            class="btn btn-primary"
            data-sim-decide="${task.id}"
            ${final ? "" : raw('data-sure="1"')}
          >
            ${I.T("Decide", "Decidir")}
          </button>`
    }`;
}

// ── journal ──────────────────────────────────────────────────────────────────
/** Things still worth doing, worked out from the state: conflicts not yet compared, clarifications not yet asked. */
export function openQuestions(def, state) {
  const out = [];
  for (const t of def.tasks) {
    if (t.type !== "compare" || state.tasks[t.id]?.resolved || !evalCond(t.requires, state, def))
      continue;
    const pair = t.pairs.find((p) => p.every((e) => state.evidence[e]));
    if (!pair) continue;
    const [a, b] = pair.map((id) => evidenceOf(def, id).title);
    const place = sceneOf(def, t.scene).title;
    out.push([
      `Two pieces of evidence may not fit together: "${a[0]}" and "${b[0]}". Compare them at ${place[0]}.`,
      `Dos evidencias tal vez no encajan: "${a[1]}" y "${b[1]}". Compáralas en ${place[1]}.`,
    ]);
  }
  for (const c of def.characters) {
    const s = suggestions(def, state, c.id);
    if (s.clarify.length)
      out.push([
        `${c.name} said something you could ask about again: what exactly did they mean?`,
        `${c.name} dijo algo sobre lo que puedes volver a preguntar: ¿qué quiso decir exactamente?`,
      ]);
    else if (state.talk[c.id]?.asked.length && s.fresh.length)
      out.push([`${c.name} has more to say now.`, `${c.name} ahora tiene más que decir.`]);
  }
  return out;
}

export function journalPanel(I, def, state, ui) {
  const reached = reachedAct(def, state);
  const held = Object.entries(state.evidence);
  const met = def.characters.filter((c) => state.talk[c.id]?.asked.length);
  const open = openQuestions(def, state);
  return html`${panelHead(I, I.T("Mission journal", "Diario de la misión"), "")}
    <h3 class="sim-sub">${I.T("Goals", "Metas")}</h3>
    <ul class="sim-list">
      <li><strong>${I.T("Language:", "Lenguaje:")}</strong> ${T(I, def.objectives.language)}</li>
      <li><strong>${I.T("Content:", "Contenido:")}</strong> ${T(I, def.objectives.content)}</li>
    </ul>
    <h3 class="sim-sub">${I.T("Acts", "Actos")}</h3>
    <ol class="sim-list sim-journal-acts">
      ${def.acts.map(
        (a, i) =>
          html`<li class="${i < reached ? "is-done" : i === reached ? "is-now" : ""}">
            <strong>${T(I, a.title)}</strong>
            ${i < reached ? html`<span class="sim-tag">${I.T("done", "hecho")}</span>` : i === reached ? html`<span class="sim-tag is-now">${I.T("now", "ahora")}</span>` : ""}
            <span class="sim-journal-goal">${T(I, a.goal)}</span>
          </li>`,
      )}
    </ol>
    <h3 class="sim-sub">
      ${I.T(`Evidence notebook (${held.length})`, `Cuaderno de evidencia (${held.length})`)}
    </h3>
    ${
      held.length
        ? html`<ul class="sim-list sim-notebook">
            ${held.map(([id, e]) => {
              const item = evidenceOf(def, id);
              return html`<li>
                <button type="button" class="sim-q" data-sim-open-ev="${id}">
                  ${raw(kindGlyph(item.kind))} ${T(I, item.title)}
                </button>
                <span class="sim-journal-goal"
                  >${T(I, sceneOf(def, e.scene).title)} ·
                  ${T(I, def.acts[Math.min(e.act, def.acts.length - 1)].title)}</span
                >
              </li>`;
            })}
          </ul>`
        : html`<p class="sim-note">
            ${I.T("Nothing yet. Look around and open what you find.", "Todavía nada. Mira alrededor y abre lo que encuentres.")}
          </p>`
    }
    <h3 class="sim-sub">
      ${I.T(`People you questioned (${met.length})`, `Personas a las que preguntaste (${met.length})`)}
    </h3>
    ${
      met.length
        ? html`<ul class="sim-list sim-people">
            ${met.map(
              (c) =>
                html`<li>
                  ${raw(portraitSVG(c.look, "neutral", 44))}
                  <span
                    ><strong>${c.name}</strong>, ${T(I, c.role)}. ${T(I, c.style)}
                    ${c.wants ? html`<span class="sim-journal-goal">${I.T("Wants:", "Quiere:")} ${T(I, c.wants)}</span>` : ""}</span
                  >
                </li>`,
            )}
          </ul>`
        : html`<p class="sim-note">${I.T("Nobody yet.", "Nadie todavía.")}</p>`
    }
    <h3 class="sim-sub">${I.T("Open questions", "Preguntas abiertas")}</h3>
    ${
      open.length
        ? html`<ul class="sim-list">
            ${open.map((q) => html`<li>${T(I, q)}</li>`)}
          </ul>`
        : html`<p class="sim-note">
            ${I.T("No open questions right now.", "No hay preguntas abiertas por ahora.")}
          </p>`
    }
    ${
      def.supports?.glossary === false
        ? ""
        : ui.wordsClosed
        ? html`<p class="sim-note">
            ${I.T("Word meanings are closed while you do the task on your own.", "Los significados están cerrados mientras haces la tarea sin ayuda.")}
          </p>`
        : html`<details class="sim-fold" data-sim-words ${ui.words ? raw("open") : ""}>
            <summary>${I.T("Words for this mission", "Palabras de esta misión")}</summary>
            <dl class="sim-words">
              ${(def.vocabulary || []).map(
                (v) =>
                  html`<div>
                    <dt lang="en">${v.term}</dt>
                    <dd>${T(I, v.meaning)}</dd>
                  </div>`,
              )}
            </dl>
          </details>`
    }`;
}
