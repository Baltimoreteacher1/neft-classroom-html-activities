// Argument Arena (/arena): structured academic discussion practice. Read evidence cards, choose a side, build a
// claim-evidence-reasoning argument (drag a card, or tap to place it), rehearse the speaking turn with the lab's
// recorder, answer a counterargument, rate with a rubric, and print an argument card.
// Practice on this device: checks look for words and patterns and never judge meaning. Recordings stay in the tab.
import { recorderHTML, setComponentsI18n } from "../components.js";
import { FRAMES, findTopic, topicsFor } from "../content/craft-arena.js";
import { i18nFor } from "../i18n.js";
import { summarizeEnvelope } from "../lang/audio.js";
import {
  RUBRIC,
  checkArgument,
  checkCounter,
  composeArgument,
  loadCraft,
  recordCraft,
  saveCraft,
  topicState,
} from "../lang/craft.js";
import { takeSpeechSeconds } from "../lang/model-student.js";
import { isRecording, takesFor } from "../recorder.js";
import { trackDisclosures } from "../studio-ui.js";
import { ART as ARTS_BASE, announce, html, icon, raw } from "../util.js";
import {
  ART,
  cardHTML,
  craftCrumbs,
  craftHref,
  heroHTML,
  levelClick,
  levelPickerHTML,
  practiceNote,
  progressBar,
} from "./craft-ui.js";

const STEPS = [
  ["read", "Read", "Leer", "reading"],
  ["claim", "Choose", "Elegir", "flag"],
  ["build", "Build", "Construir", "construction"],
  ["speak", "Speak", "Hablar", "speaking"],
  ["counter", "Respond", "Responder", "conversation"],
  ["card", "Card", "Tarjeta", "print"],
];
const COUNTER_TYPES = [
  ["agree", "Agree and add", "Estar de acuerdo y agregar"],
  ["disagree", "Disagree and give a reason", "No estar de acuerdo y dar una razón"],
  ["clarify", "Ask a question to clarify", "Hacer una pregunta para aclarar"],
];
let current = null;
let lastCtx = null;
let dragBound = false;

const edit = (id, fn) => {
  const state = loadCraft();
  const t = topicState(state, id);
  fn(t, state);
  state.arena.topics[id] = t;
  saveCraft(state);
  return t;
};
const isDone = (topic, t) =>
  checkArgument(topic, t).ready && Boolean(t.counterOk) && Boolean(t.spoke);

/** A sentence frame at the learner's support level: full frame (A), starter (B) or nothing (C). */
function frameHTML(I, level, kind, field) {
  const f = FRAMES[kind]?.[level];
  if (!f) return "";
  return html`<div class="cs-frame no-print">
    <p lang="en">
      <strong>${level === "A" ? I.T("Frame", "Marco") : I.T("Starter", "Comienzo")}:</strong>
      ${f.en}
    </p>
    ${I.mode !== "en" ? html`<p class="fine" lang="es">${f.es}</p>` : ""}
    <button type="button" class="ghost small" data-ar-frame="${field}" data-frame-kind="${kind}">
      ${I.T("Add to my writing", "Agregar a mi texto")}
    </button>
  </div>`;
}
const field = (name, value, label, rows = 3) =>
  html`<label class="cs-field"
    ><span>${label}</span
    ><textarea
      data-ar-field="${name}"
      rows="${rows}"
      lang="en"
      spellcheck="false"
      autocomplete="off"
    >
${value}</textarea>
  </label>`;

function hubHTML(ctx, I) {
  const state = loadCraft();
  const topics = topicsFor(ctx.band);
  const doneCount = topics.filter((tp) => isDone(tp, topicState(state, tp.id))).length;
  return html`${craftCrumbs(I, "arena", ctx.band)}
    <div class="cs-page cs-arena">
      ${heroHTML(I, "arena", {
        eyebrow: I.T(
          `Grades ${ctx.band.replace("-", "–")} · speaking and writing`,
          `Grados ${ctx.band.replace("-", "–")} · hablar y escribir`,
        ),
        title: I.T("Argument Arena", "Arena de argumentos"),
        lead: I.T(
          "Pick a topic, read the evidence, and build an argument you can say out loud. Practice a claim, evidence and reasoning, then answer someone who disagrees. Nothing is timed.",
          "Elige un tema, lee la evidencia y construye un argumento que puedas decir en voz alta. Practica la afirmación, la evidencia y el razonamiento, y luego responde a alguien que no está de acuerdo. Nada tiene tiempo límite.",
        ),
        art: ART.arena(
          I.S(
            "Two speakers on podiums with speech bubbles and a star between them",
            "Dos oradores en podios con globos de diálogo y una estrella entre ellos",
          ),
        ),
      })}
      ${levelPickerHTML(I, state.level, "arena")}
      <ol class="cs-steps cs-steps-intro" aria-label="${I.S("The six steps", "Los seis pasos")}">
        ${STEPS.map(([id, en, es, ico]) => html`<li>${icon(ico)} <span>${I.T(en, es)}</span></li>`)}
      </ol>
      <section class="task-group" aria-labelledby="arena-topics">
        <header>
          <h2 id="arena-topics">
            ${icon("conversation")}
            ${I.T(`${topics.length} topics to argue about`, `${topics.length} temas para argumentar`)}
          </h2>
          <p class="fine">
            ${I.T(`${doneCount} of ${topics.length} finished on this device.`, `${doneCount} de ${topics.length} terminados en este dispositivo.`)}
          </p>
        </header>
        <div class="task-grid">
          ${topics.map((tp) => {
            const t = topicState(state, tp.id);
            const step = STEPS.findIndex((s) => s[0] === t.step);
            return cardHTML({
              href: craftHref("arena", ctx.band, tp.id),
              title: I.T(tp.title.en, tp.title.es),
              ico: "conversation",
              kind: I.T("Debate topic", "Tema de debate"),
              desc: I.T(tp.question.en, tp.question.es),
              done: isDone(tp, t)
                ? I.S("Finished", "Terminado")
                : step > 0
                  ? I.S(`Step ${step + 1} of 6`, `Paso ${step + 1} de 6`)
                  : "",
            });
          })}
        </div>
      </section>
      ${practiceNote(I)}
    </div>`;
}

function stepper(I, topic, t, band) {
  const at = STEPS.findIndex((s) => s[0] === t.step);
  return html`<nav
    class="cs-stepper no-print"
    aria-label="${I.S("Argument steps", "Pasos del argumento")}"
  >
    <ol>
      ${STEPS.map(
        ([id, en, es, ico], i) =>
          html`<li>
            <button
              type="button"
              class="cs-step ${i === at ? "is-current" : i < at ? "is-past" : ""}"
              data-ar-step="${id}"
              ${i === at ? raw('aria-current="step"') : ""}
            >
              <span class="cs-step-n">${i + 1}</span>${icon(ico)} <span>${I.T(en, es)}</span>
            </button>
          </li>`,
      )}
    </ol>
  </nav>`;
}

const hearBtn = (I, text) =>
  html`<button type="button" class="ghost small no-print" data-say="${text}">
    ${icon("volume")} ${I.T("Hear it", "Escucharlo")}
  </button>`;

function readStep(I, topic) {
  return html`<section class="panel" aria-labelledby="ar-read">
    <h2 id="ar-read">${I.T("Read the evidence", "Lee la evidencia")}</h2>
    <p class="fine">
      ${I.T("These cards were written for practice. Some use sample numbers from imagined schools. Read all six. Each one helps a different side.", "Estas tarjetas se escribieron para practicar. Algunas usan números de ejemplo de escuelas imaginadas. Lee las seis. Cada una ayuda a un lado distinto.")}
    </p>
    <div class="cs-cards">
      ${topic.cards.map(
        (c) =>
          html`<article class="cs-ev">
            <p class="cs-src"><span class="tag">${icon("evidence")} ${c.source}</span></p>
            <p lang="en">${c.text}</p>
            ${hearBtn(I, c.text)}
          </article>`,
      )}
    </div>
    <p class="row-actions no-print">
      <button type="button" class="btn btn-primary" data-ar-step="claim">
        ${I.T("Choose my side", "Elegir mi lado")} ${icon("arrow-right")}
      </button>
    </p>
  </section>`;
}

function claimStep(I, topic, t, level) {
  return html`<section class="panel" aria-labelledby="ar-claim">
    <h2 id="ar-claim">
      ${I.T("Choose a side and write your claim", "Elige un lado y escribe tu afirmación")}
    </h2>
    <p class="cs-question" lang="en">${topic.question.en}</p>
    <div class="cs-sides" role="group" aria-label="${I.S("Your side", "Tu lado")}">
      ${["y", "n"].map((s) => html`<button type="button" class="cat-chip cs-side" data-ar-side="${s}" aria-pressed="${t.side === s}">${icon(s === "y" ? "check" : "x")} <span lang="en">${topic.stance[s].en}</span>${I.mode !== "en" ? html`<small lang="es">${topic.stance[s].es}</small>` : ""}</button>`)}
    </div>
    ${
      t.side
        ? html`${frameHTML(I, level, "claim", "claim")}${field("claim", t.claim, I.S("My claim (one sentence)", "Mi afirmación (una oración)"), 2)}
            <p class="row-actions no-print">
              <button type="button" class="btn btn-primary" data-ar-step="build">
                ${I.T("Build my argument", "Construir mi argumento")} ${icon("arrow-right")}
              </button>
            </p>`
        : html`<p class="fine">
            ${I.T("Pick a side to continue. You can change it later.", "Elige un lado para continuar. Puedes cambiarlo después.")}
          </p>`
    }
  </section>`;
}

function slotHTML(I, topic, t, i, level) {
  const card = topic.cards.find((c) => c.id === t.slots[i]);
  return html`<div
    class="cs-slot ${card ? "is-filled" : ""}"
    data-ar-slot="${i}"
    aria-label="${I.S(`Evidence ${i + 1}`, `Evidencia ${i + 1}`)}"
  >
    <h3>${I.T(`Evidence ${i + 1}`, `Evidencia ${i + 1}`)}</h3>
    ${
      card
        ? html`<blockquote class="cs-quote" lang="en">
              <span class="tag">${card.source}</span> ${card.text}
            </blockquote>
            <button type="button" class="ghost small no-print" data-ar-remove="${i}">
              ${icon("x")} ${I.T("Take it out", "Quitarla")}
            </button>
            ${frameHTML(I, level, "evidence", `note${i}`)}
            ${field(`note${i}`, t.notes[i], I.S("Say it in your own words and name the source", "Dilo con tus propias palabras y nombra la fuente"), 3)}`
        : html`<p class="fine">
            ${I.T("Drag an evidence card here, or use the buttons on a card.", "Arrastra aquí una tarjeta de evidencia o usa los botones de una tarjeta.")}
          </p>`
    }
  </div>`;
}

function buildStep(I, topic, t, level, showChecks) {
  const used = new Set(t.slots);
  const res = showChecks ? checkArgument(topic, t) : null;
  return html`<section class="panel" aria-labelledby="ar-build">
    <h2 id="ar-build">${I.T("Build your argument", "Construye tu argumento")}</h2>
    <p class="cs-claim-echo">
      <strong>${I.T("Claim", "Afirmación")}:</strong>
      <span lang="en"
        >${t.claim || I.S("(write your claim in step 2)", "(escribe tu afirmación en el paso 2)")}</span
      >
    </p>
    <div class="cs-build">
      <div class="cs-tray" aria-label="${I.S("Evidence cards", "Tarjetas de evidencia")}">
        <h3>${I.T("Evidence cards", "Tarjetas de evidencia")}</h3>
        ${topic.cards.map((c) => {
          const inUse = used.has(c.id);
          return html`<article
            class="cs-ev cs-tray-card ${inUse ? "is-used" : ""}"
            ${inUse ? "" : raw(`draggable="true" data-ar-card="${c.id}"`)}
          >
            <p class="cs-src"><span class="tag">${c.source}</span></p>
            <p lang="en">${c.text}</p>
            ${inUse ? html`<p class="fine">${icon("check")} ${I.T("In your argument", "En tu argumento")}</p>` : html`<div class="row-actions no-print">${[0, 1].map((i) => html`<button type="button" class="ghost small" data-ar-place="${c.id}" data-slot="${i}" ${t.slots[i] ? raw("disabled") : ""}>${I.T(`Use as evidence ${i + 1}`, `Usar como evidencia ${i + 1}`)}</button>`)}</div>`}
          </article>`;
        })}
      </div>
      <div class="cs-builder">
        <h3>${I.T("Your argument", "Tu argumento")}</h3>
        ${[0, 1].map((i) => slotHTML(I, topic, t, i, level))}
        <div class="cs-slot">
          <h3>${I.T("Reasoning", "Razonamiento")}</h3>
          ${frameHTML(I, level, "reasoning", "reason")}
          ${field("reason", t.reason, I.S("Explain why the evidence supports your claim", "Explica por qué la evidencia respalda tu afirmación"), 3)}
        </div>
      </div>
    </div>
    <p class="row-actions no-print">
      <button type="button" class="btn btn-primary" data-ar-check-arg>
        ${icon("check")} ${I.T("Check my argument", "Revisar mi argumento")}
      </button>
    </p>
    <div role="status" aria-live="polite" class="cs-feedback">
      ${
        res
          ? html`<ul class="cs-checks">
                ${res.items.map((it) => html`<li class="${it.ok ? "is-ok" : "is-next"}">${icon(it.ok ? "check" : "arrow-right")} <span>${I.TO(it.say)}</span></li>`)}
              </ul>
              ${res.ready ? html`<p class="cs-win">${I.T("Your argument has a claim, two pieces of evidence and reasoning. Next, rehearse saying it.", "Tu argumento tiene afirmación, dos pruebas y razonamiento. Ahora ensaya decirlo.")} <button type="button" class="btn btn-primary no-print" data-ar-step="speak">${I.T("Rehearse", "Ensayar")} ${icon("arrow-right")}</button></p>` : ""}`
          : ""
      }
    </div>
  </section>`;
}

function speakStep(I, topic, t, ctx) {
  const key = `arena:${topic.id}`;
  const cards = t.slots.map((id) => topic.cards.find((c) => c.id === id)).filter(Boolean);
  const last = takesFor(key).at(-1);
  const secs = last ? takeSpeechSeconds(last, summarizeEnvelope) : 0;
  const cues = [
    [I.S("Claim", "Afirmación"), t.claim],
    ...cards.map((c, i) => [`${I.S("Evidence", "Evidencia")} ${i + 1} · ${c.source}`, t.notes[i]]),
    [I.S("Reasoning", "Razonamiento"), t.reason],
  ];
  const checks = [
    I.S("I said my claim clearly.", "Dije mi afirmación con claridad."),
    I.S("I used both pieces of evidence.", "Usé las dos pruebas."),
    I.S("I explained why with because.", "Expliqué por qué con because."),
    I.S("I looked up from my notes.", "Levanté la vista de mis notas."),
  ];
  return html`<section class="panel" aria-labelledby="ar-speak">
    <h2 id="ar-speak">${I.T("Rehearse your turn", "Ensaya tu turno")}</h2>
    <p class="fine">
      ${I.T("Use the cue card as notes, not a script. Record, listen back, and record again if you want. Nothing is timed.", "Usa la tarjeta como notas, no como guion. Graba, escucha y vuelve a grabar si quieres. Nada tiene tiempo límite.")}
    </p>
    <dl class="cs-cue">
      ${cues.map(
        ([k, v]) =>
          html`<dt>${k}</dt>
            <dd lang="en">${v || "…"}</dd>`,
      )}
    </dl>
    ${recorderHTML(key, { recording: isRecording(key), i18n: I })}
    ${last ? html`<p class="cs-win" role="status">${icon("record")} ${I.T(`Your latest take: about ${secs} seconds of speaking. Length is not quality. Listen for a clear claim and a because.`, `Tu último intento: unos ${secs} segundos hablando. La duración no es calidad. Escucha si hay una afirmación clara y un because.`)}</p>` : ""}
    <fieldset class="cs-self">
      <legend>${I.T("Check yourself", "Revísate")}</legend>
      ${checks.map((c, i) => html`<label class="cs-check"><input type="checkbox" data-ar-check="${i}" ${t.checks[i] ? raw("checked") : ""} /> <span>${c}</span></label>`)}
    </fieldset>
    <p class="row-actions no-print">
      <button type="button" class="btn btn-primary" data-ar-step="counter">
        ${I.T("Respond to the other side", "Responder al otro lado")} ${icon("arrow-right")}
      </button>
    </p>
  </section>`;
}

function counterStep(I, topic, t, level, showCheck) {
  const text = topic.objection[t.side];
  const res = showCheck ? checkCounter(t.counterType, t.counter) : null;
  return html`<section class="panel" aria-labelledby="ar-counter">
    <h2 id="ar-counter">
      ${I.T("Answer someone who disagrees", "Responde a alguien que no está de acuerdo")}
    </h2>
    <blockquote class="cs-quote cs-objection" lang="en">
      <span class="tag">${I.T("The other side says", "El otro lado dice")}</span> ${text || "…"}
    </blockquote>
    ${hearBtn(I, text || "")}
    <div
      class="cs-sides"
      role="group"
      aria-label="${I.S("How will you respond?", "¿Cómo vas a responder?")}"
    >
      ${COUNTER_TYPES.map(([id, en, es]) => html`<button type="button" class="cat-chip" data-ar-counter-type="${id}" aria-pressed="${t.counterType === id}">${I.T(en, es)}</button>`)}
    </div>
    ${
      t.counterType
        ? html`${frameHTML(I, level, t.counterType, "counter")}${field("counter", t.counter, I.S("My response", "Mi respuesta"), 3)}
            <p class="row-actions no-print">
              <button type="button" class="btn btn-primary" data-ar-check-counter>
                ${icon("check")} ${I.T("Check my response", "Revisar mi respuesta")}
              </button>
            </p>`
        : ""
    }
    <div role="status" aria-live="polite" class="cs-feedback">
      ${
        res
          ? html`<p class="${res.ok ? "cs-win" : "cs-next"}">
                ${icon(res.ok ? "check" : "arrow-right")} ${I.TO(res.say)}
              </p>
              ${res.ok ? html`<button type="button" class="btn btn-primary no-print" data-ar-step="card">${I.T("Make my argument card", "Hacer mi tarjeta de argumento")} ${icon("arrow-right")}</button>` : ""}`
          : ""
      }
    </div>
  </section>`;
}

function rubricHTML(I, who, values) {
  return html`<table class="cs-rubric">
    <caption>
      ${who === "self" ? I.T("My rubric (practice descriptors, not a score)", "Mi rúbrica (descriptores de práctica, no un puntaje)") : I.T("Partner rubric (a partner can tap these)", "Rúbrica del compañero (un compañero puede tocar esto)")}
    </caption>
    <tbody>
      ${RUBRIC.map(
        (r) =>
          html`<tr>
            <th scope="row">${I.TO(r.name)}</th>
            <td>
              ${[0, 1, 2].map((n) => html`<label class="cs-rate"><input type="radio" name="${who}-${r.id}" value="${n}" data-ar-rub="${who}:${r.id}" ${values[r.id] === n ? raw("checked") : ""} /> <span>${I.TO(r.d[n])}</span></label>`)}
            </td>
          </tr>`,
      )}
    </tbody>
  </table>`;
}

function cardStep(I, topic, t, band) {
  const cards = t.slots.map((id) => topic.cards.find((c) => c.id === id)).filter(Boolean);
  return html`<section class="panel" aria-labelledby="ar-card">
    <h2 id="ar-card">${I.T("Rate it and print your card", "Califícalo e imprime tu tarjeta")}</h2>
    <div class="no-print">${rubricHTML(I, "self", t.self)}${rubricHTML(I, "peer", t.peer)}</div>
    <article class="arena-card" aria-label="${I.S("Argument card", "Tarjeta de argumento")}">
      <h3>
        ${I.T("Argument card", "Tarjeta de argumento")}: <span lang="en">${topic.title.en}</span>
      </h3>
      <p lang="en"><em>${topic.question.en}</em></p>
      <p><strong>${I.T("Claim", "Afirmación")}</strong><br /><span lang="en">${t.claim}</span></p>
      ${cards.map((c, i) => html`<p><strong>${I.T("Evidence", "Evidencia")} ${i + 1}</strong> <span class="tag">${c.source}</span><br /><span lang="en">${t.notes[i]}</span><br /><small lang="en">“${c.text}”</small></p>`)}
      <p>
        <strong>${I.T("Reasoning", "Razonamiento")}</strong><br /><span lang="en">${t.reason}</span>
      </p>
      <p>
        <strong>${I.T("If someone disagrees", "Si alguien no está de acuerdo")}</strong><br /><span
          lang="en"
          >${t.counter || ""}</span
        >
      </p>
      <p class="cs-print-only">
        <strong
          >${I.T("Partner: two stars and a wish", "Compañero: dos estrellas y un deseo")}</strong
        >
      </p>
      <div class="cs-lines cs-print-only" aria-hidden="true"><i></i><i></i><i></i></div>
    </article>
    <p class="row-actions no-print">
      <button type="button" class="btn btn-primary" data-print>
        ${icon("print")} ${I.T("Print my card", "Imprimir mi tarjeta")}
      </button>
      <a class="btn" href="${craftHref("arena", band)}" data-ar-back
        >${I.T("Pick another topic", "Elegir otro tema")}</a
      >
    </p>
  </section>`;
}

function topicHTML(ctx, I, topic) {
  const state = loadCraft();
  const t = topicState(state, topic.id);
  const level = state.level;
  const body = {
    read: () => readStep(I, topic),
    claim: () => claimStep(I, topic, t, level),
    build: () => buildStep(I, topic, t, level, t.checked),
    speak: () => speakStep(I, topic, t, ctx),
    counter: () => counterStep(I, topic, t, level, t.counterChecked),
    card: () => cardStep(I, topic, t),
  }[t.step]();
  return html`${craftCrumbs(I, "arena", ctx.band, I.S(topic.title.en, topic.title.es))}
    <article class="cs-page cs-arena activity d-speaking">
      <header class="act-head">
        <p class="act-context">
          ${icon("conversation")} ${I.T("Argument Arena", "Arena de argumentos")}
        </p>
        <h1 tabindex="-1">${I.T(topic.title.en, topic.title.es)}</h1>
        <p class="lead" lang="en">${topic.question.en}</p>
        ${I.mode !== "en" ? html`<p class="fine" lang="es">${topic.question.es}</p>` : ""}
      </header>
      ${levelPickerHTML(I, level, "arena")} ${stepper(I, topic, t, ctx.band)} ${body}
      ${practiceNote(I)}
    </article>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  lastCtx = ctx;
  const id = ctx.route.id || "";
  const topic = id ? findTopic(id) : null;
  current = topic ? { id } : null;
  if (!id) return { title: I.S("Argument Arena", "Arena de argumentos"), html: hubHTML(ctx, I) };
  if (!topic || topic.band !== ctx.band)
    return {
      title: I.S("Not found", "No se encontró"),
      html: html`${craftCrumbs(I, "arena", ctx.band, I.S("Not found", "No se encontró"))}
        <section class="panel empty-state">
          <img src="${ARTS_BASE}/empty.svg" alt="" width="480" height="300" />
          <h1 tabindex="-1">
            ${I.T("We could not find that topic for this grade band.", "No encontramos ese tema para esta banda de grados.")}
          </h1>
          <a class="btn" href="${craftHref("arena", ctx.band)}"
            >${I.T("Argument Arena", "Arena de argumentos")}</a
          >
        </section>`,
    };
  return { title: I.S(topic.title.en, topic.title.es), html: topicHTML(ctx, I, topic) };
}

function place(id, cardId, slot) {
  edit(id, (t) => {
    const other = t.slots.indexOf(cardId);
    if (other >= 0) t.slots[other] = null;
    if (t.slots[slot] !== cardId) t.notes[slot] = "";
    t.slots[slot] = cardId;
    t.checked = false;
  });
}

function logArgument(ctx, topic, t, level) {
  const text = composeArgument(topic, t);
  if (!text || text === t.lastText) return;
  const res = checkArgument(topic, t);
  recordCraft(
    {
      src: "arena",
      task: `${topic.id}/argument`,
      band: ctx.band,
      domain: "Writing",
      use: "Argue",
      level,
      kind: t.lastText ? "revision" : "first",
      m: {
        tool: "arena",
        stepId: "build",
        ok: res.ready ? 1 : 0,
        flags: res.items.filter((i) => !i.ok).length,
      },
    },
    {
      text,
      analyzeOpts: {
        keyUse: "Argue",
        modality: "writing",
        stage: level === "C" ? "independent" : "supported",
        sourceText: topic.cards.map((c) => c.text),
      },
    },
  );
  edit(topic.id, (x) => {
    x.lastText = text;
  });
}

export function onClick(e, ctx) {
  if (levelClick(e, ctx)) return true;
  if (!current) return false;
  const I = i18nFor(ctx);
  const id = current.id;
  const topic = findTopic(id);
  const hit = (sel) => e.target.closest?.(sel);
  let b;
  if ((b = hit("[data-ar-step]"))) {
    edit(id, (t) => {
      t.step = b.dataset.arStep;
    });
    ctx.rerender()?.then?.(() => {
      const h = document.querySelector(".cs-page h2[id^=ar-]");
      h?.setAttribute("tabindex", "-1");
      h?.focus();
    });
    return true;
  }
  if ((b = hit("[data-ar-side]"))) {
    edit(id, (t) => {
      if (t.side !== b.dataset.arSide)
        Object.assign(t, {
          side: b.dataset.arSide,
          slots: [null, null],
          notes: ["", ""],
          checked: false,
          counterOk: false,
          counterChecked: false,
        });
    });
    ctx.rerender();
    return true;
  }
  if ((b = hit("[data-ar-frame]"))) {
    const level = loadCraft().level;
    const text = FRAMES[b.dataset.frameKind]?.[level]?.en || "";
    edit(id, (t) => {
      const name = b.dataset.arFrame;
      const key = name.startsWith("note") ? Number(name.slice(4)) : name;
      if (typeof key === "number")
        t.notes[key] = `${t.notes[key] ? `${t.notes[key]} ` : ""}${text}`;
      else t[key] = `${t[key] ? `${t[key]} ` : ""}${text}`;
    });
    ctx.rerender();
    return true;
  }
  if ((b = hit("[data-ar-place]"))) {
    place(id, b.dataset.arPlace, Number(b.dataset.slot));
    announce(I.S("Card added to your argument.", "Tarjeta agregada a tu argumento."));
    ctx.rerender();
    return true;
  }
  if ((b = hit("[data-ar-remove]"))) {
    edit(id, (t) => {
      t.slots[Number(b.dataset.arRemove)] = null;
      t.notes[Number(b.dataset.arRemove)] = "";
      t.checked = false;
    });
    ctx.rerender();
    return true;
  }
  if (hit("[data-ar-check-arg]")) {
    const level = loadCraft().level;
    const t = edit(id, (x) => {
      x.checked = true;
    });
    logArgument(ctx, topic, t, level);
    ctx.rerender();
    return true;
  }
  if ((b = hit("[data-ar-counter-type]"))) {
    edit(id, (t) => {
      t.counterType = b.dataset.arCounterType;
      t.counterChecked = false;
    });
    ctx.rerender();
    return true;
  }
  if (hit("[data-ar-check-counter]")) {
    const level = loadCraft().level;
    const t = edit(id, (x) => {
      x.counterChecked = true;
      x.counterOk = checkCounter(x.counterType, x.counter).ok;
    });
    if (t.counter && t.counter !== t.lastCounter)
      recordCraft(
        {
          src: "arena",
          task: `${id}/counter`,
          band: ctx.band,
          domain: "Writing",
          use: "Argue",
          level,
          kind: t.lastCounter ? "revision" : "first",
          m: { tool: "arena", stepId: "counter", ok: t.counterOk ? 1 : 0 },
        },
        {
          text: t.counter,
          analyzeOpts: {
            keyUse: "Argue",
            modality: "writing",
            stage: level === "C" ? "independent" : "supported",
          },
        },
      );
    edit(id, (x) => {
      x.lastCounter = x.counter;
    });
    ctx.rerender();
    return true;
  }
  return false;
}

export function onInput(e) {
  const f = e.target?.dataset?.arField;
  if (!f || !current) return;
  edit(current.id, (t) => {
    if (f.startsWith("note")) t.notes[Number(f.slice(4))] = e.target.value;
    else t[f] = e.target.value;
  });
}

export function onChange(e) {
  if (!current) return;
  const el = e.target;
  if (el.dataset?.arCheck != null)
    edit(current.id, (t) => (t.checks[Number(el.dataset.arCheck)] = el.checked));
  if (el.dataset?.arRub) {
    const [who, dim] = el.dataset.arRub.split(":");
    edit(current.id, (t) => {
      t[who] = { ...t[who], [dim]: Number(el.value) };
    });
  }
}

/** A finished recording marks the rehearsal done and writes one evidence entry (first take, then retries). */
export function onRecorded(key, ctx = lastCtx) {
  if (!current || key !== `arena:${current.id}` || !ctx) return;
  const takes = takesFor(key);
  const level = loadCraft().level;
  const prior = topicState(loadCraft(), current.id);
  recordCraft({
    src: "arena",
    task: `${current.id}/speak`,
    band: ctx.band,
    domain: "Speaking",
    use: "Argue",
    level,
    kind: prior.spoke ? "retry" : "first",
    m: { tool: "arena", stepId: "speak", ok: 1, seconds: takes.at(-1)?.seconds || 0 },
  });
  edit(current.id, (t) => {
    t.spoke = true;
  });
}

function bindDrag() {
  if (dragBound || typeof document === "undefined") return;
  dragBound = true;
  document.addEventListener("dragstart", (e) => {
    const c = e.target.closest?.("[data-ar-card]");
    if (c && current) {
      e.dataTransfer?.setData("text/plain", c.dataset.arCard);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    }
  });
  document.addEventListener("dragover", (e) => {
    if (current && e.target.closest?.("[data-ar-slot]")) e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    const s = e.target.closest?.("[data-ar-slot]");
    if (!s || !current) return;
    e.preventDefault();
    const cardId = e.dataTransfer?.getData("text/plain");
    if (!cardId || !findTopic(current.id)?.cards.some((c) => c.id === cardId)) return;
    place(current.id, cardId, Number(s.dataset.arSlot));
    lastCtx?.rerender();
  });
}

export function mount(root) {
  trackDisclosures(root);
  bindDrag();
}
export function unmount() {
  current = null;
}
