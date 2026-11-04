// Conversation Reality UI (engine key "converse"): a chat with a rule-based practice partner, typed or spoken.
//   render(task, env) -> html        mount(root, env)
// All resumable state lives in env.data (`state`, `draft`, `helps`, ...). Speaking records on this device only; the learner types what they
// said, so the partner reads exactly the words the learner confirmed. No audio is sent, stored or rated.
import { micDeniedMessage } from "../../components.js";
import {
  canRecord,
  clear as clearTakes,
  isRecording,
  start as startRecording,
  stop as stopRecording,
  takesFor,
} from "../../recorder.js";
import { esc, html, icon, raw, toHtml, wordCount } from "../../util.js";
import * as E from "../engines/converse.js";

const SPEAK_MIN_WORDS = 2;
const recorderKey = (env) => `journey:${env.missionId}:${env.step}:converse`;
const keyUseOf = (task, env) => task.keyUse || env.mission?.klu || "Explain";
const safeCanRecord = () => {
  try {
    return canRecord();
  } catch {
    return false;
  }
};

/** The saved slice. Flat in env.data (the engine's own saved state); a nested `converse` object is read too. */
const nested = (env) =>
  Boolean(
    env.data?.converse && typeof env.data.converse === "object" && !("state" in (env.data || {})),
  );
const saved = (env) => (nested(env) ? env.data.converse : env.data || {});

// ── markup ────────────────────────────────────────────────────────────────────
function bubble(task, turn, drafts, I) {
  const mine = turn.who === "learner";
  const who = mine ? I.T("You", "Tú") : task.partner?.name || "Partner";
  const earlier = mine ? drafts.filter((d) => d.turn === turn.turn) : [];
  const tag =
    !mine && turn.kind === "clarify"
      ? I.T("Checking I understand", "Verifico que entiendo")
      : !mine && turn.kind === "close"
        ? I.T("Wrap-up", "Cierre")
        : "";
  return `<li class="jt-bubble ${mine ? "jt-me" : "jt-partner"}${turn.kind ? ` is-${turn.kind}` : ""}">
    ${mine ? "" : `<span class="jt-avatar" aria-hidden="true">${esc(task.partner?.glyph || "")}</span>`}
    <div class="jt-bubble-body"><span class="jt-who">${toHtml(who)}${tag ? ` <span class="jt-tag">${toHtml(tag)}</span>` : ""}</span>
      <p class="jt-say" lang="en">${esc(turn.text)}</p>
      ${earlier.length ? `<details class="jt-earlier"><summary>${toHtml(I.T("Your earlier try (kept for the Improve step)", "Tu intento anterior (se guarda para el paso Mejora)"))}</summary>${earlier.map((d) => `<p lang="en">${esc(d.text)}</p>`).join("")}</details>` : ""}
    </div></li>`;
}
const bubbleList = (task, st, I) => st.turns.map((t) => bubble(task, t, st.drafts || [], I));

function partnerCard(task, I) {
  const p = task.partner || {};
  return html`<div class="jt-partner-card">
      <span class="jt-avatar jt-avatar-lg" aria-hidden="true">${p.glyph || ""}</span>
      <div>
        <p class="jt-partner-name">
          ${p.name || ""}${p.role ? html` <span class="jt-role">· ${I.T(p.role[0], p.role[1])}</span>` : ""}
        </p>
        <p class="jt-honest">
          ${I.T("Practice partner · rule-based, runs on this device", "Compañero de práctica · basado en reglas, funciona en este dispositivo")}
        </p>
      </div>
    </div>
    <details class="jt-how">
      <summary>
        ${I.T("How does the practice partner work?", "¿Cómo funciona el compañero de práctica?")}
      </summary>
      <p>
        ${I.T("It reads the words you typed and picks its next question from a list your teachers wrote. It is not a person and it does not understand everything. It never rates you.", "Lee las palabras que escribiste y elige su próxima pregunta de una lista que escribieron tus docentes. No es una persona y no entiende todo. Nunca te califica.")}
      </p>
    </details>`;
}

function recorderPanel(env, data, I) {
  const key = recorderKey(env);
  const rec = isRecording(key);
  const take = takesFor(key).at(-1);
  return html`<section
    class="jt-rec ${rec ? "is-live" : ""}"
    aria-label="${I.S("Record yourself", "Grábate")}"
  >
    <p class="jt-note">
      ${I.T("Your recording stays on this device, in this tab. The practice partner does not listen to it and nothing judges your voice. It disappears when you send your reply or close the page.", "Tu grabación se queda en este dispositivo, en esta pestaña. El compañero de práctica no la escucha y nada juzga tu voz. Desaparece cuando envías tu respuesta o cierras la página.")}
    </p>
    <div class="jt-rec-row">
      ${
        rec
          ? html`<button type="button" class="btn jt-rec-btn is-stop" data-jt-rec-stop>
                ${icon("stop")} ${I.T("Stop", "Detener")}
              </button>
              <span class="jt-meter" aria-hidden="true"><i data-jt-level></i></span
              ><span class="jt-time" data-jt-time>0s</span>`
          : html`<button type="button" class="btn jt-rec-btn" data-jt-rec-start>
              ${icon("record")}
              ${take ? I.T("Record again", "Grabar otra vez") : I.T("Record my answer", "Grabar mi respuesta")}
            </button>`
      }
      <span class="jt-rec-state" role="status"
        >${rec ? I.T("Recording. The microphone is on.", "Grabando. El micrófono está encendido.") : I.T("The microphone is off.", "El micrófono está apagado.")}</span
      >
    </div>
    ${take && !rec ? html`<audio class="jt-audio" controls src="${take.url}" aria-label="${I.S("Listen to your recording", "Escucha tu grabación")}"></audio>` : ""}
    <p class="jt-rec-error" data-jt-rec-error role="status" ${data.micMessage ? "" : raw("hidden")}>
      ${data.micMessage || ""}
    </p>
  </section>`;
}

function noRecordingNote(data, I) {
  const why = data.micBlocked
    ? micDeniedMessage(I)
    : I.S("This browser cannot record.", "Este navegador no puede grabar.");
  return html`<p class="jt-note jt-no-rec">
    ${icon("info")}
    <span
      >${why}
      ${I.T("Say your answer out loud to a partner or to yourself, then type it below.", "Di tu respuesta en voz alta a un compañero o a ti mismo y luego escríbela abajo.")}</span
    >
  </p>`;
}

function supportPanels(task, env, I) {
  if (env.independent || env.support === "C") return "";
  const frames = env.pack?.frames?.[env.support] || [];
  const chips = (kind, list) =>
    list
      .map(
        (text) =>
          `<button type="button" class="jt-chip" data-jt-insert="${esc(text)}" data-jt-help-id="${kind}" lang="en">${esc(text)}</button>`,
      )
      .join("");
  const frame = frames.length
    ? `<details class="jt-help" data-jt-help="frames"><summary>${toHtml(I.T("Sentence frames", "Marcos de oraciones"))}</summary><p class="jt-chips">${chips("frames", frames)}</p></details>`
    : "";
  const bank = (task.evidenceBank || []).length
    ? `<details class="jt-help" data-jt-help="evidence"><summary>${toHtml(I.T("Evidence from the investigation", "Evidencia de la investigación"))}</summary><p class="jt-chips">${chips("evidence", task.evidenceBank)}</p></details>`
    : "";
  return raw(`${frame}${bank}`);
}

function composer(task, env, data, st, I) {
  const speak = task.mode === "speak";
  const retrying = Boolean(data.retrying);
  const crit = E.doneCriteria(task, st);
  const canRec = speak && safeCanRecord() && !data.micBlocked;
  const label = speak
    ? I.T(
        "Type what you said (you can edit it before you send)",
        "Escribe lo que dijiste (puedes corregirlo antes de enviar)",
      )
    : retrying
      ? I.T("Your new try", "Tu nuevo intento")
      : I.T("Your reply", "Tu respuesta");
  return html`<form class="jt-composer" data-jt-form novalidate>
    ${retrying ? html`<p class="jt-retry-note" role="status">${icon("retry")} ${I.T("Trying again: this replaces your last reply. Your first try is kept.", "Otro intento: reemplaza tu última respuesta. Tu primer intento se guarda.")}</p>` : ""}
    ${
      speak
        ? html`<p class="jt-step">${I.T("1. Say it out loud", "1. Dilo en voz alta")}</p>
            ${canRec ? recorderPanel(env, data, I) : noRecordingNote(data, I)}
            <p class="jt-step">${I.T("2. Type what you said", "2. Escribe lo que dijiste")}</p>
            <p class="jt-note">
              ${I.T("This lab does not turn your voice into text. You type the words, so your accent never changes what the practice partner reads.", "Este laboratorio no convierte tu voz en texto. Tú escribes las palabras, así que tu acento nunca cambia lo que lee el compañero de práctica.")}
            </p>`
        : ""
    }
    <label class="jt-label" for="jt-input">${label}</label>
    <textarea
      id="jt-input"
      class="jt-input"
      rows="4"
      lang="en"
      data-jt-input
      data-nsr-ignore
      spellcheck="false"
      autocomplete="off"
    >
${data.draft || ""}</textarea>
    <p class="jt-count" role="status">
      <span data-jt-count>${wordCount(data.draft)}</span> ${I.T("words typed", "palabras escritas")}
      ·
      ${I.T(`about ${crit.minWords} words in all, across the conversation`, `unas ${crit.minWords} palabras en total, en toda la conversación`)}
    </p>
    <div class="jt-actions">
      <button
        type="submit"
        class="btn btn-primary jt-send"
        data-jt-send
        ${wordCount(data.draft) < (speak ? SPEAK_MIN_WORDS : 1) ? raw("disabled") : ""}
      >
        ${icon("arrow-right")}
        ${retrying ? I.T("Send my new try", "Enviar mi nuevo intento") : I.T("Send", "Enviar")}
      </button>
      ${st.turns.some((t) => t.who === "learner") ? html`<button type="button" class="btn ghost" data-jt-retry>${icon("retry")} ${speak ? I.T("Try saying it again", "Intenta decirlo otra vez") : I.T("Try that reply again", "Intenta esa respuesta otra vez")}</button>` : ""}
    </div>
    ${supportPanels(task, env, I)}
  </form>`;
}

function finishPanel(task, data, st, I) {
  const crit = E.doneCriteria(task, st);
  const speak = task.mode === "speak";
  return html`<div class="jt-finish">
    ${
      crit.ok
        ? html`<p class="jt-done" role="status">
            ${icon("check")}
            ${I.T("Conversation complete. Nice work staying with the idea.", "Conversación completa. Buen trabajo manteniendo la idea.")}
          </p>`
        : html`<p class="jt-note" role="status">
            ${icon("info")}
            ${I.T(`Your conversation is finished. A few more words will complete this step (about ${crit.needWords} more). Try your last reply again with more detail.`, `Tu conversación terminó. Unas palabras más completan este paso (unas ${crit.needWords} más). Intenta de nuevo tu última respuesta con más detalle.`)}
          </p>`
    }
    <div class="jt-actions">
      <button
        type="button"
        class="btn btn-primary"
        data-jt-finish
        ${crit.ok && !data.finished ? "" : raw("disabled")}
      >
        ${icon("check")} ${I.T("Finish this step", "Terminar este paso")}
      </button>
      <button type="button" class="btn ghost" data-jt-retry>
        ${icon("retry")}
        ${speak ? I.T("Try saying it again", "Intenta decirlo otra vez") : I.T("Try that reply again", "Intenta esa respuesta otra vez")}
      </button>
    </div>
  </div>`;
}

function lower(task, env, data, st, I) {
  if (st.ended && !data.retrying) return finishPanel(task, data, st, I);
  return composer(task, env, data, st, I);
}

function turnsText(st, task, I) {
  const max = task.maxTurns || 3;
  const n = Math.min(st.turnCount + 1, max);
  if (st.ended) return I.S("The conversation is finished.", "La conversación terminó.");
  return I.S(`Reply ${n} of ${max}`, `Respuesta ${n} de ${max}`);
}

function shell(task, env, data, st) {
  const I = env.I;
  const max = task.maxTurns || 3;
  return html`<section
    class="jt jt-converse d-speaking"
    data-jt="converse"
    aria-labelledby="jt-title"
  >
    <header class="jt-head">
      <p class="jt-kicker">${icon("conversation")} ${I.T("Conversation", "Conversación")}</p>
      <h2 id="jt-title" class="jt-title" lang="en">${task.prompt}</h2>
    </header>
    ${partnerCard(task, I)}
    <ol
      class="jt-log"
      data-jt-log
        tabindex="0"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="${I.S("Conversation", "Conversación")}"
    >
      ${raw(bubbleList(task, st, I).join(""))}
    </ol>
    <p class="jt-turns" role="status">
      ${st.ended ? I.T("The conversation is finished.", "La conversación terminó.") : I.T(`Reply ${Math.min(st.turnCount + 1, max)} of ${max}`, `Respuesta ${Math.min(st.turnCount + 1, max)} de ${max}`)}
    </p>
    <div class="jt-dyn" data-jt-dyn>${lower(task, env, data, st, I)}</div>
  </section>`;
}

/** The first paint, from saved state. Pure of the DOM (recording state is read from the recorder). */
export function render(task, env) {
  const data = saved(env);
  return shell(task, env, data, data.state || E.init(task));
}

// ── behaviour ─────────────────────────────────────────────────────────────────
export function mount(root, env) {
  const task = env.task || env.pack?.[env.step === "show" ? "show" : "communicate"];
  return mountTask(root, task, env);
}

/** mount for a task passed explicitly (the shell may host either the communicate or the show task). */
export function mountTask(root, task, env) {
  const I = env.I;
  const opts = () => ({ keyUse: keyUseOf(task, env), independent: Boolean(env.independent) });
  let data = { ...saved(env) };
  const key = recorderKey(env);
  let shown = [];
  let draftTimer = 0;

  const save = (patch) => {
    data = { ...data, ...patch };
    env.update?.(nested(env) ? { converse: patch } : patch, { silent: true });
  };
  const st = () => data.state || E.init(task);
  const help = (id) => {
    if (env.independent || (data.helps || []).includes(id)) return;
    save({ helps: [...(data.helps || []), id] });
    env.help?.(id);
  };

  function paintLog() {
    const log = root.querySelector("[data-jt-log]");
    if (!log) return;
    const next = bubbleList(task, st(), I);
    const prefix = shown.length <= next.length && shown.every((h, i) => h === next[i]);
    if (prefix) log.insertAdjacentHTML("beforeend", next.slice(shown.length).join(""));
    else log.innerHTML = next.join("");
    shown = next;
    log.scrollTop = log.scrollHeight;
  }
  function paint(focus) {
    const dyn = root.querySelector("[data-jt-dyn]");
    if (dyn) dyn.innerHTML = toHtml(lower(task, env, data, st(), I));
    const turns = root.querySelector(".jt-turns");
    if (turns) turns.textContent = turnsText(st(), task, I);
    paintLog();
    if (focus) root.querySelector(focus)?.focus();
  }

  const syncSend = () => {
    const btn = root.querySelector("[data-jt-send]");
    const n = wordCount(data.draft);
    const count = root.querySelector("[data-jt-count]");
    if (count) count.textContent = String(n);
    if (btn) btn.disabled = n < (task.mode === "speak" ? SPEAK_MIN_WORDS : 1);
  };
  const setDraft = (text) => {
    data = { ...data, draft: text };
    syncSend();
  };

  function send() {
    const text = String(data.draft || "").trim();
    if (!text) return;
    const r = data.retrying ? E.retry(task, st(), text, opts()) : E.reply(task, st(), text, opts());
    clearTakes(key);
    save({ state: r.state, draft: "", retrying: false, micMessage: "" });
    paint(r.state.ended ? "[data-jt-finish]" : "#jt-input");
  }
  function retry() {
    const last = E.learnerTurns(st()).at(-1);
    clearTakes(key);
    save({ retrying: true, draft: last?.text || "" });
    paint("#jt-input");
    env.announce?.(
      I.S(
        "Trying again. Your last reply is in the box.",
        "Otro intento. Tu última respuesta está en el cuadro.",
      ),
    );
  }
  function finish() {
    const s = st();
    const crit = E.doneCriteria(task, s);
    if (!crit.ok || data.finished) return;
    const analysis = E.analyze(task, s, opts());
    env.ledger?.(
      E.ledgerEntry({
        task,
        state: s,
        missionId: env.missionId,
        step: env.step,
        band: env.band,
        keyUse: keyUseOf(task, env),
        independent: env.independent,
        supports: data.helps || [],
        analysis,
      }),
    );
    save({ finished: true });
    env.done?.({
      text: E.finalText(s),
      mode: task.mode,
      supportsUsed: [...(data.helps || [])],
      words: crit.words,
      turns: s.turnCount,
      matchedLine: s.matched,
      covered: s.covered,
      drafts: s.drafts || [],
    });
  }

  async function startRec() {
    const btn = root.querySelector("[data-jt-rec-start]");
    if (btn) btn.disabled = true;
    try {
      const live = await startRecording(key, {
        onLevel: (level, secs) => {
          const bar = root.querySelector("[data-jt-level]");
          if (bar) bar.style.setProperty("--lvl", level.toFixed(2));
          const t = root.querySelector("[data-jt-time]");
          if (t) t.textContent = `${secs}s`;
        },
        onStop: () => {
          paint("#jt-input");
          env.announce?.(
            I.S(
              "Recording saved on this device. Now type what you said.",
              "Grabación guardada en este dispositivo. Ahora escribe lo que dijiste.",
            ),
          );
        },
      });
      if (live) {
        paint("[data-jt-rec-stop]");
        env.announce?.(
          I.S(
            "Recording. Press Stop when you are done.",
            "Grabando. Pulsa Detener cuando termines.",
          ),
        );
      } else if (btn) btn.disabled = false;
    } catch {
      const message = micDeniedMessage(I);
      save({ micBlocked: true, micMessage: message });
      paint("#jt-input");
      env.announce?.(message);
    }
  }

  const insertAtCaret = (text) => {
    const box = root.querySelector("#jt-input");
    if (!box) return;
    const a = box.selectionStart ?? box.value.length;
    const b = box.selectionEnd ?? a;
    const pad = box.value && !/\s$/.test(box.value.slice(0, a)) ? " " : "";
    box.value = `${box.value.slice(0, a)}${pad}${text}${box.value.slice(b)}`;
    const at = a + pad.length + text.length;
    box.setSelectionRange(at, at);
    box.focus();
    setDraft(box.value);
    save({ draft: box.value });
  };

  root.addEventListener("click", (e) => {
    const t = e.target.closest?.("button");
    if (!t || !root.contains(t)) return;
    if (t.hasAttribute("data-jt-retry")) return retry();
    if (t.hasAttribute("data-jt-finish")) return finish();
    if (t.hasAttribute("data-jt-rec-start")) return void startRec();
    if (t.hasAttribute("data-jt-rec-stop")) return void stopRecording();
    if (t.hasAttribute("data-jt-insert")) {
      help(t.dataset.jtHelpId);
      insertAtCaret(t.dataset.jtInsert);
    }
  });
  root.addEventListener("submit", (e) => {
    if (!e.target.closest?.("[data-jt-form]")) return;
    e.preventDefault();
    send();
  });
  root.addEventListener("input", (e) => {
    if (!e.target.matches?.("[data-jt-input]")) return;
    setDraft(e.target.value);
    clearTimeout(draftTimer);
    draftTimer = setTimeout(() => save({ draft: data.draft }), 600);
  });
  root.addEventListener(
    "blur",
    (e) => e.target.matches?.("[data-jt-input]") && save({ draft: data.draft }),
    true,
  );
  root.addEventListener("keydown", (e) => {
    if (e.target.matches?.("[data-jt-input]") && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      send();
    }
  });
  root.addEventListener(
    "toggle",
    (e) => e.target.open && e.target.dataset?.jtHelp && help(e.target.dataset.jtHelp),
    true,
  );

  shown = bubbleList(task, st(), I);
  return () => {
    stopRecording();
    clearTakes(key);
  };
}
