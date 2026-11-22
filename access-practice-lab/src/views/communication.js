// Culture & Communication Explorer (/communication, /communication/<scenario>?step=1..5): students investigate how a
// message changes with audience, purpose, setting, relationship, register and medium. Five steps per scenario:
// Situation → Compare → What if…? → Your languages → Your message. Content: src/content/communication.js; checks:
// src/lang/communication-check.js. Progress stays on this device (one localStorage key, like Language Labs). The
// written check is a ledger entry (src "communication"): supported when frames, the word bank or the example were used.
// The reflection is never checked or recorded: it belongs to the student.
import { crumbsHTML, recorderHTML } from "../components.js";
import * as C from "../content/communication.js";
import { i18nFor } from "../i18n.js";
import * as K from "../lang/communication-check.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { isRecording } from "../recorder.js";
import { speak } from "../speech.js";
import { onCommunicationBoardClick, renderCommunicationBoard } from "./communication-board.js";
import { BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:communication";
const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
const load = () => safeJson(storage.get(KEY), {}) || {};
const save = (st) => storage.set(KEY, JSON.stringify(st));
const scState = (st, id) => {
  st[id] ||= {};
  const s = st[id];
  s.seen ||= [];
  s.pick ||= "";
  s.shift ||= { ans: {}, result: null };
  s.reflect ??= "";
  s.write ||= { text: "", checks: 0, ok: false, result: null, supports: false, model: false };
  return s;
};
const stepHref = (id, step, band) => `${BASE}/communication/${id}?step=${step}&grades=${band}`;
const recKey = (id) => `communication-${id}`;

function record(ctx, sc, { task, ok, kind, supported, extra = {} }) {
  const ledger = loadLedger();
  appendEntry(ledger, {
    src: "communication",
    task,
    band: bandOf(ctx.band),
    domain: "Writing",
    use: sc.theme === "audiences" || sc.theme === "perspectives" ? "Explain" : "Inform",
    stage: supported ? "supported" : "independent",
    kind,
    supports: { frames: !!supported },
    m: { ok: ok ? 1 : 0, scenario: sc.id, theme: sc.theme, ...extra },
  });
  saveLedger(ledger);
}

// ── shared pieces ────────────────────────────────────────────────────────────
const listenBtn = (I, text, label) =>
  html`<button
    type="button"
    class="btn small ghost cm-listen"
    data-say="${text}"
    aria-label="${I.S(`Listen: ${label[0]}`, `Escuchar: ${label[1]}`)}"
  >
    ${icon("volume")} ${I.T("Listen", "Escuchar")}
  </button>`;

function stepperHTML(I, sc, step, ss, band) {
  return html`<nav class="cm-steps" aria-label="${I.S("Scenario steps", "Pasos de la situación")}">
    <ol>
      ${C.STEPS.map(([en, es], i) => {
        const n = i + 1;
        const seen = ss.seen.includes(n);
        return html`<li>
          <a
            href="${stepHref(sc.id, n, band)}"
            ${n === step ? raw('aria-current="step"') : ""}
            class="${seen ? "is-seen" : ""}"
            ><span class="cm-step-n">${seen && n !== step ? "✓" : n}</span>${I.T(en, es)}</a
          >
        </li>`;
      })}
    </ol>
  </nav>`;
}

function navHTML(I, sc, step, band) {
  return html`<p class="cm-nav">
    ${step > 1 ? html`<a class="btn" href="${stepHref(sc.id, step - 1, band)}">← ${I.T(C.STEPS[step - 2][0], C.STEPS[step - 2][1])}</a>` : ""}
    ${
      step < 5
        ? html`<a class="btn btn-primary" href="${stepHref(sc.id, step + 1, band)}"
            >${I.T(`Next: ${C.STEPS[step][0]}`, `Siguiente: ${C.STEPS[step][1]}`)}
            ${icon("arrow-right")}</a
          >`
        : html`<a class="btn btn-primary" href="${BASE}/communication?grades=${band}"
            >${I.T("All scenarios", "Todas las situaciones")}</a
          >`
    }
  </p>`;
}

function cardHTML(I, sc) {
  return html`<dl class="cm-dials">
    ${C.DIALS.map((d) => {
      const value = d.id === "register" ? C.REGISTERS[sc.card.register] : sc.card[d.id];
      return html`<div class="cm-dial">
        <dt><span aria-hidden="true">${d.emoji}</span> ${I.T(...d.name)}</dt>
        <dd>${I.T(...value)}</dd>
      </div>`;
    })}
  </dl>`;
}

// ── steps ────────────────────────────────────────────────────────────────────
function situationStep(I, sc) {
  return html`<section class="panel cm-situation" aria-labelledby="cmSitH">
    <h2 id="cmSitH">${I.T("The situation", "La situación")}</h2>
    <p class="cm-situation-text">${I.T(...sc.situation)}</p>
    <div class="row-actions">
      ${listenBtn(I, sc.situation[0], ["the situation", "la situación"])}
      ${I.mode !== "en" ? html`<button type="button" class="btn small ghost" data-say-es="${sc.situation[1]}">${icon("volume")} Escuchar en español</button>` : ""}
    </div>
    <h3>${I.T("What shapes this message", "Lo que da forma a este mensaje")}</h3>
    ${cardHTML(I, sc)}
    <p class="fine">
      ${I.T("Keep these six things in mind. In the next step, you will compare messages and decide which one fits.", "Ten en cuenta estas seis cosas. En el siguiente paso compararás mensajes y decidirás cuál encaja.")}
    </p>
  </section>`;
}

function compareStep(I, sc, ss) {
  const picked = sc.versions.find((v) => v.id === ss.pick);
  const solved = picked?.best;
  return html`<section class="panel cm-compare" aria-labelledby="cmCmpH">
    <h2 id="cmCmpH">
      ${I.T("Which message fits this situation?", "¿Qué mensaje encaja en esta situación?")}
    </h2>
    <p class="fine">
      ${I.T("Every message here could fit somewhere. Choose the one that fits this audience, purpose and medium best.", "Cada mensaje de aquí podría encajar en algún lugar. Elige el que mejor encaja con esta audiencia, este propósito y este medio.")}
    </p>
    <ul class="cm-versions">
      ${sc.versions.map((v, i) => {
        const showWhy = solved || v.id === ss.pick;
        return html`<li
          class="cm-version ${v.id === ss.pick ? (v.best ? "is-fit" : "is-other") : ""}"
        >
          <p class="cm-version-label">${I.T(`Message ${"ABC"[i]}`, `Mensaje ${"ABC"[i]}`)}</p>
          <blockquote class="cm-message" lang="en">${v.text}</blockquote>
          <div class="row-actions">
            ${listenBtn(I, v.text, [`message ${"ABC"[i]}`, `mensaje ${"ABC"[i]}`])}
            ${solved ? "" : html`<button type="button" class="btn small" data-cm-pick="${v.id}" aria-pressed="${v.id === ss.pick}">${I.T("This one fits", "Este encaja")}</button>`}
          </div>
          ${
            showWhy
              ? html`<div
                  class="feedback ${v.best ? "is-right" : "is-hint"}"
                  ${v.id === ss.pick ? raw('role="status"') : ""}
                >
                  <p class="fb-title">
                    ${v.best ? "✅" : "💡"}
                    ${v.best ? I.T("Fits this situation.", "Encaja en esta situación.") : I.T("Fits a different situation.", "Encaja en otra situación.")}
                  </p>
                  <p>${I.T(...v.why)}</p>
                  ${v.when ? html`<p><b>${I.T("Where it would fit:", "Dónde sí encajaría:")}</b> ${I.T(...v.when)}</p>` : ""}
                </div>`
              : ""
          }
        </li>`;
      })}
    </ul>
    ${picked && !solved ? html`<p class="cm-try">${I.T("Read the reason, then try another message.", "Lee la razón y luego prueba otro mensaje.")}</p>` : ""}
  </section>`;
}

function shiftStep(I, sc, ss) {
  const r = ss.shift.result;
  return html`<section class="panel cm-shift" aria-labelledby="cmShiftH">
    <h2 id="cmShiftH">${I.T("What would change if…", "Qué cambiaría si…")}</h2>
    <p class="cm-shift-change">🔄 ${I.T(...sc.shift.change)}</p>
    <p class="fine">
      ${I.T("For each part of the message, decide: would it most likely change, or stay the same?", "Para cada parte del mensaje, decide: ¿lo más probable es que cambie o que se quede igual?")}
    </p>
    <ol class="cm-shift-items">
      ${sc.shift.items.map((it, i) => {
        const a = ss.shift.ans[i];
        const res = r?.complete ? r.results[i] : null;
        return html`<li class="cm-shift-item">
          <p class="cm-shift-part">${I.T(...it.part)}</p>
          <div class="cm-choice" role="group" aria-label="${I.S(it.part[0], it.part[1])}">
            <button
              type="button"
              class="chip"
              data-cm-shift="${i}"
              data-val="changes"
              aria-pressed="${a === "changes"}"
            >
              ${I.T("Changes", "Cambia")}
            </button>
            <button
              type="button"
              class="chip"
              data-cm-shift="${i}"
              data-val="stays"
              aria-pressed="${a === "stays"}"
            >
              ${I.T("Stays the same", "Se queda igual")}
            </button>
          </div>
          ${res ? html`<p class="${res.ok ? "cm-ok" : "cm-think"}">${res.ok ? "✅" : "💡"} ${it.changes ? I.T("Most likely changes.", "Lo más probable es que cambie.") : I.T("Most likely stays the same.", "Lo más probable es que se quede igual.")} ${I.T(...it.why)}</p>` : ""}
        </li>`;
      })}
    </ol>
    <button type="button" class="btn btn-primary" data-cm-check-shift>
      ${I.T("Check my thinking", "Revisar mi razonamiento")}
    </button>
    ${r && !r.complete ? html`<p class="feedback is-hint" role="status">${I.T("Choose an answer for every part first.", "Primero elige una respuesta para cada parte.")}</p>` : ""}
    ${r?.complete ? html`<p class="feedback ${r.right === r.results.length ? "is-right" : "is-hint"}" role="status">${I.T(`You matched ${r.right} of ${r.results.length}. Read each reason: a different answer can make sense if you explain it.`, `Coincidiste en ${r.right} de ${r.results.length}. Lee cada razón: otra respuesta puede tener sentido si la explicas.`)}</p>` : ""}
  </section>`;
}

function reflectStep(I, sc, ss) {
  return html`<section class="panel cm-reflect" aria-labelledby="cmRefH">
    <h2 id="cmRefH">${I.T("Your languages, your knowledge", "Tus idiomas, tu conocimiento")}</h2>
    <ul class="cm-principles">
      ${C.PRINCIPLES.map((p) => html`<li>${I.T(...p)}</li>`)}
    </ul>
    <p class="cm-reflect-prompt">💭 ${I.T(...sc.reflect)}</p>
    <label class="field"
      ><span
        >${I.T("My thinking (any language, or a mix)", "Lo que pienso (en cualquier idioma, o mezclados)")}</span
      ><textarea rows="6" data-cm-reflect data-nsr-ignore>${ss.reflect}</textarea>
    </label>
    <p class="fine">
      ${I.T("Your reflection is not checked or scored. It is saved only on this device. You can share it with a partner or your teacher if you want.", "Tu reflexión no se revisa ni se califica. Se guarda solo en este dispositivo. Puedes compartirla con un compañero o con tu maestro si quieres.")}
    </p>
  </section>`;
}

function evidenceText(I, r) {
  if (r.id === "simple" && r.count)
    return I.T(
      `${r.count} sentences, about ${r.avg} words each`,
      `${r.count} oraciones, unas ${r.avg} palabras cada una`,
    );
  if (r.id === "questions")
    return I.T(
      `${r.count} question(s); this task asks for ${r.need}`,
      `${r.count} pregunta(s); esta tarea pide ${r.need}`,
    );
  return r.found.map((w) => `“${w}”`).join(", ");
}

function resultHTML(I, res) {
  if (!res) return "";
  if (res.empty)
    return html`<p class="feedback is-hint" role="status">
      ${I.T("Write your message first, then check it.", "Primero escribe tu mensaje y luego revísalo.")}
    </p>`;
  return html`<div class="feedback ${res.ok ? "is-right" : "is-hint"}" role="status">
    <p class="fb-title">
      ${res.ok ? "✅" : "💡"}
      ${res.ok ? I.T("Your message has every feature this situation asks for.", "Tu mensaje tiene todo lo que pide esta situación.") : I.T(res.next.en, res.next.es)}
    </p>
    <ul class="cm-shows">
      ${res.results.map((r) => {
        const ev = evidenceText(I, r);
        const label = K.CHECKS[r.id].label;
        return html`<li>
          ${r.met ? "✅" : "⬜"} <b>${I.T(...label)}</b>
          ${ev ? html` · ${I.T("I noticed:", "Noté:")} ${ev}` : ""}
          ${!r.met ? html`<br /><span class="fine">${I.T(...(r.note || K.CHECKS[r.id].tip))}</span>` : ""}
        </li>`;
      })}
      <li>
        ${res.words >= res.minWords ? "✅" : "⬜"}
        ${I.T(`${res.words} words (this task: about ${res.minWords} or more)`, `${res.words} palabras (esta tarea: unas ${res.minWords} o más)`)}
      </li>
    </ul>
    <p class="fine">
      ${I.T("This check only looks for the features listed. It does not grade your English or judge how your family talks. Ask a partner how your message sounds.", "Esta revisión solo busca lo que aparece en la lista. No califica tu inglés ni juzga cómo habla tu familia. Pregúntale a un compañero cómo suena tu mensaje.")}
    </p>
  </div>`;
}

function writeStep(I, sc, ss) {
  const t = sc.task;
  const w = ss.write;
  return html`<section class="panel cm-write" aria-labelledby="cmWriteH">
      <p class="eyebrow">
        ✍️ ${I.T("Your own words, your own message", "Tus propias palabras, tu propio mensaje")}
      </p>
      <h2 id="cmWriteH">${I.T("Your message", "Tu mensaje")}</h2>
      <p class="cm-task">${I.T(...t.prompt)}</p>
      <div class="row-actions">${listenBtn(I, t.prompt[0], ["the task", "la tarea"])}</div>
      <details class="cm-supports">
        <summary data-cm-supports>
          ${I.T("Sentence frames and word bank", "Marcos de oración y banco de palabras")}
        </summary>
        <p class="fine">
          ${I.T("Press a frame or a word to add it to your message where your cursor is.", "Presiona un marco o una palabra para agregarlo a tu mensaje donde está el cursor.")}
        </p>
        <h3>${I.T("Sentence frames", "Marcos de oración")}</h3>
        <div
          class="cm-bank"
          role="group"
          aria-label="${I.S("Sentence frames", "Marcos de oración")}"
        >
          ${t.frames.map((f) => html`<button type="button" class="chip" data-cm-insert="${f}" lang="en">${f}</button>`)}
        </div>
        <h3>${I.T("Word bank", "Banco de palabras")}</h3>
        <div class="cm-bank" role="group" aria-label="${I.S("Word bank", "Banco de palabras")}">
          ${t.words.map((x) => html`<button type="button" class="chip" data-cm-insert="${x.w}"><span lang="en">${x.w}</span>${I.mode !== "en" ? html` <small lang="es">(${x.es})</small>` : ""}</button>`)}
        </div>
      </details>
      <label class="field"
        ><span>${I.T("My message (in English)", "Mi mensaje (en inglés)")}</span
        ><textarea rows="8" data-cm-write data-nsr-ignore lang="en">${w.text}</textarea>
      </label>
      <p class="fine">
        ${I.T("Planning in another language first is a smart move. The check reads English.", "Planear primero en otro idioma es una buena idea. La revisión lee inglés.")}
      </p>
      <div class="row-actions">
        <button type="button" class="btn btn-primary" data-cm-check>
          ✔️ ${I.T("Check my message", "Revisar mi mensaje")}
        </button>
        <button type="button" class="btn ghost" data-cm-say-mine>
          ${icon("volume")} ${I.T("Read my message aloud", "Leer mi mensaje en voz alta")}
        </button>
        ${w.checks >= 2 && !w.ok && !w.model ? html`<button type="button" class="btn ghost" data-cm-model>💡 ${I.T("Show me an example", "Muéstrame un ejemplo")}</button>` : ""}
      </div>
      ${resultHTML(I, w.result)}
      ${
        w.model
          ? html`<div class="cm-model">
              <p class="eyebrow">
                ${I.T("One example that fits (yours can be different)", "Un ejemplo que encaja (el tuyo puede ser diferente)")}
              </p>
              <blockquote class="cm-message" lang="en">${t.model}</blockquote>
            </div>`
          : ""
      }
    </section>
    <section class="panel cm-rehearse" aria-labelledby="cmRecH">
      <h2 id="cmRecH">🎙️ ${I.T("Optional: say it aloud", "Opcional: dilo en voz alta")}</h2>
      <p class="fine">
        ${I.T("Rehearse your message the way you would really say it. Listen back: does your voice fit this audience too?", "Ensaya tu mensaje como lo dirías de verdad. Escúchalo: ¿tu voz también encaja con esta audiencia?")}
      </p>
      ${recorderHTML(recKey(sc.id), { recording: isRecording(recKey(sc.id)), i18n: I })}
    </section>`;
}

// ── hub and render ───────────────────────────────────────────────────────────
function hubHTML(I, st, band) {
  return html`<section class="cm-hub">
    <header class="cm-hub-head">
      <p class="eyebrow">
        🌍 ${I.T("Same idea, different situations", "La misma idea, situaciones diferentes")}
      </p>
      <h1 tabindex="-1">
        ${I.T("Culture & Communication Explorer", "Explorador de cultura y comunicación")}
      </h1>
      <p class="lead">
        ${I.T("Investigate how people change a message for different listeners, places and purposes. Compare messages, imagine what would change, connect it to the languages you know, and write your own.", "Investiga cómo la gente cambia un mensaje para distintos oyentes, lugares y propósitos. Compara mensajes, imagina qué cambiaría, conéctalo con los idiomas que conoces y escribe el tuyo.")}
      </p>
    </header>
    <ul class="cm-principles">
      ${C.PRINCIPLES.map((p) => html`<li>${I.T(...p)}</li>`)}
    </ul>
    <section aria-labelledby="cmDialsH">
      <h2 id="cmDialsH">
        ${I.T("Six things that shape every message", "Seis cosas que dan forma a cada mensaje")}
      </h2>
      <ul class="cm-dial-list">
        ${C.DIALS.map((d) => html`<li><span class="cm-dial-emoji" aria-hidden="true">${d.emoji}</span><b>${I.T(...d.name)}</b><span>${I.T(...d.text)}</span></li>`)}
      </ul>
    </section>
    <section aria-labelledby="cmScH">
      <h2 id="cmScH">
        ${I.T(`Scenarios for grades ${band}`, `Situaciones para los grados ${band}`)}
      </h2>
      <ul class="cm-cards">
        ${C.scenariosFor(band).map((sc) => {
          const ss = st[sc.id];
          const seen = ss?.seen?.length || 0;
          const done = ss?.write?.ok;
          return html`<li>
            <a class="card cm-card" href="${stepHref(sc.id, 1, band)}"
              ><span class="cm-card-emoji" aria-hidden="true">${sc.emoji}</span
              ><strong>${I.T(...sc.title)}</strong
              ><span class="cm-card-theme">${I.T(...C.THEMES[sc.theme])}</span
              ><span class="cm-card-meta"
                >${done ? `✅ ${I.S("Message written", "Mensaje escrito")}` : I.T(`${seen} of 5 steps`, `${seen} de 5 pasos`)}</span
              ></a
            >
          </li>`;
        })}
      </ul>
    </section>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);
  const st = load();
  const sc = C.scenarioById(ctx.route.id || "");
  const hubCrumb = [
    I.S("Culture & Communication", "Cultura y comunicación"),
    `${BASE}/communication?grades=${band}`,
  ];
  if (!sc)
    return {
      title: I.S("Culture & Communication Explorer", "Explorador de cultura y comunicación"),
      html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [hubCrumb[0], null],
      ])}${renderCommunicationBoard(ctx)}${hubHTML(I, st, band)}`,
    };
  const step = Math.min(
    5,
    Math.max(1, Number(new URLSearchParams(location.search).get("step")) || 1),
  );
  const ss = scState(st, sc.id);
  if (!ss.seen.includes(step)) {
    ss.seen.push(step);
    save(st);
  }
  const body = [
    situationStep,
    (i, s) => compareStep(i, s, ss),
    (i, s) => shiftStep(i, s, ss),
    (i, s) => reflectStep(i, s, ss),
    (i, s) => writeStep(i, s, ss),
  ][step - 1](I, sc);
  const title = I.S(...sc.title);
  return {
    title,
    html: html`${crumbsHTML([[I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`], hubCrumb, [title, null]])}
      <article class="cm-scenario" aria-labelledby="cmTitle">
        <header class="cm-head">
          <p class="eyebrow">
            <span aria-hidden="true">${sc.emoji}</span> ${I.T(...C.THEMES[sc.theme])}
          </p>
          <h1 id="cmTitle" tabindex="-1">${title}</h1>
        </header>
        ${stepperHTML(I, sc, step, ss, band)}${body}${navHTML(I, sc, step, band)}
      </article>`,
  };
}

// ── events ───────────────────────────────────────────────────────────────────
export function onInput(e, ctx) {
  const t = e.target;
  const sc = C.scenarioById(ctx.route.id || "");
  if (!sc || !t.matches?.("[data-cm-reflect], [data-cm-write]")) return;
  const st = load();
  const ss = scState(st, sc.id);
  if (t.matches("[data-cm-reflect]")) ss.reflect = t.value.slice(0, 4000);
  else ss.write.text = t.value.slice(0, 4000);
  save(st);
}

export function onClick(e, ctx) {
  if (onCommunicationBoardClick(e, ctx)) return true;
  const t = e.target;
  const sc = C.scenarioById(ctx.route.id || "");
  if (!sc) return false;
  const I = i18nFor(ctx);
  const st = load();
  const ss = scState(st, sc.id);
  const done = (focusSel) => {
    save(st);
    ctx.rerender();
    if (focusSel)
      requestAnimationFrame(() => document.querySelector(focusSel)?.focus({ preventScroll: true }));
    return true;
  };

  const pick = t.closest("[data-cm-pick]");
  if (pick) {
    const r = K.checkPick(sc, pick.dataset.cmPick);
    if (!r) return false;
    if (!ss.picks)
      record(ctx, sc, { task: `${sc.id}-compare`, ok: r.ok, kind: "first", supported: false });
    ss.picks = (ss.picks || 0) + 1;
    ss.pick = r.id;
    announce(
      r.ok
        ? I.S(
            "This message fits the situation. Read why.",
            "Este mensaje encaja en la situación. Lee por qué.",
          )
        : I.S(
            "This message fits a different situation. Read the reason.",
            "Este mensaje encaja en otra situación. Lee la razón.",
          ),
    );
    return done(r.ok ? ".cm-version.is-fit .feedback" : `[data-cm-pick="${r.id}"]`);
  }
  const shift = t.closest("[data-cm-shift]");
  if (shift) {
    ss.shift.ans[shift.dataset.cmShift] = shift.dataset.val;
    ss.shift.result = null;
    return done(`[data-cm-shift="${shift.dataset.cmShift}"][data-val="${shift.dataset.val}"]`);
  }
  if (t.closest("[data-cm-check-shift]")) {
    ss.shift.result = K.checkShift(sc, ss.shift.ans);
    announce(
      ss.shift.result.complete
        ? I.S(
            `You matched ${ss.shift.result.right} of ${sc.shift.items.length}.`,
            `Coincidiste en ${ss.shift.result.right} de ${sc.shift.items.length}.`,
          )
        : I.S(
            "Choose an answer for every part first.",
            "Primero elige una respuesta para cada parte.",
          ),
    );
    return done();
  }
  if (t.closest("[data-cm-supports]")) {
    ss.write.supports = true;
    save(st);
    return false; // let <details> open natively
  }
  const ins = t.closest("[data-cm-insert]");
  if (ins) {
    const ta = document.querySelector("[data-cm-write]");
    if (!ta) return true;
    const add = ins.dataset.cmInsert;
    const start = ta.selectionStart ?? ta.value.length;
    const before = ta.value.slice(0, start);
    const pad = before && !/\s$/.test(before) ? " " : "";
    ta.setRangeText(`${pad}${add} `, start, ta.selectionEnd ?? start, "end");
    ta.focus();
    ss.write.text = ta.value.slice(0, 4000);
    ss.write.supports = true;
    save(st);
    announce(I.S(`Added: ${add}`, `Agregado: ${add}`));
    return true;
  }
  if (t.closest("[data-cm-say-mine]")) {
    const text = document.querySelector("[data-cm-write]")?.value || ss.write.text;
    if (text.trim()) speak(text, { rate: ctx.prefs?.rate || 0.9 });
    else announce(I.S("Write your message first.", "Primero escribe tu mensaje."));
    return true;
  }
  if (t.closest("[data-cm-model]")) {
    ss.write.model = true;
    ss.write.supports = true;
    return done(".cm-model");
  }
  if (t.closest("[data-cm-check]")) {
    const text = document.querySelector("[data-cm-write]")?.value ?? ss.write.text;
    ss.write.text = text.slice(0, 4000);
    const r = K.checkMessage(ss.write.text, sc.task);
    if (!r.empty) {
      record(ctx, sc, {
        task: `${sc.id}-message`,
        ok: r.ok,
        kind: ss.write.checks ? "revision" : "first",
        supported: ss.write.supports || ss.write.model,
        extra: { words: r.words, met: r.results.filter((x) => x.met).map((x) => x.id) },
      });
      ss.write.checks += 1;
    }
    ss.write.result = r;
    ss.write.ok = ss.write.ok || r.ok;
    announce(
      r.empty
        ? I.S("Write your message first.", "Primero escribe tu mensaje.")
        : r.ok
          ? I.S(
              "Your message has every feature this situation asks for.",
              "Tu mensaje tiene todo lo que pide esta situación.",
            )
          : I.S(r.next.en, r.next.es),
    );
    return done(".cm-write .feedback");
  }
  return false;
}
