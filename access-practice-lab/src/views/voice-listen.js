// The listening source card shared by the Voice Lab retells and the Speaking Studio recordings.
// What a learner gets: a purpose before the audio ("listen for ..."), replay of the whole recording or of one part,
// a slower speed, an on-demand transcript that says plainly that reading is not the same skill as listening, and a
// short comprehension check (main idea, detail, sequence, inference) with a scaffolded retry. The audio is the
// browser's own read-aloud (speechSynthesis) of exactly the words in the transcript; nothing here is scored by the
// lab and nothing is recorded or uploaded.
import { canSpeak, speak, stop } from "../speech.js";
import { announce, html, icon, raw, toHtml } from "../util.js";

const SLOW = 0.72;
const NORMAL = 0.9;
const PERSONAS = ["teacher", "student", "narrator"];
const QUESTION_KINDS = {
  "main-idea": ["Main idea", "Idea principal"],
  detail: ["Detail", "Detalle"],
  sequence: ["Order", "Orden"],
  inference: ["Think about it", "Piensa un poco más"],
};

const plays = new Map(); // key → number of listens this tab
const answers = new Map(); // `${key}:${i}` → { tried: [option index…], done, correct }
const openTranscripts = new Set(); // keys whose transcript the learner opened
let slow = false;
let token = 0;

/** One entry per spoken turn: { speaker, text, persona }. Accepts authored `parts`, `turns` strings or `turns` objects. */
export function listenParts(source) {
  const raw = source?.parts || source?.turns || [];
  const personaOf = new Map();
  return raw
    .map((p) =>
      typeof p === "string"
        ? { speaker: "", text: p }
        : { speaker: p.speaker || "", text: p.text || p.say || "" },
    )
    .filter((p) => p.text.trim())
    .map((p) => {
      if (!personaOf.has(p.speaker))
        personaOf.set(p.speaker, PERSONAS[personaOf.size % PERSONAS.length]);
      return { ...p, persona: personaOf.get(p.speaker) };
    });
}

/**
 * Where a learner stands on one check question after picking an option. Pure, so it can be tested.
 * A wrong first pick gets a hint and a replay prompt; a second wrong pick shows the answer and the reason.
 */
export function checkOutcome(q, prior, pick) {
  const tried = [...(prior?.tried || [])];
  if (prior?.done || tried.includes(pick))
    return { ...(prior || { tried, done: false, correct: false }), tried };
  tried.push(pick);
  if (pick === q.answer) return { tried, done: true, correct: true };
  return { tried, done: tried.length >= 2, correct: false };
}

/** "key:a:b" → [key, a, b]; the key itself may contain colons (studio:<task id>). */
const unpack = (v) => {
  const a = String(v).split(":");
  const tail = a.splice(-2);
  return [a.join(":"), ...tail];
};

const stateOf = (key, i) =>
  answers.get(`${key}:${i}`) || { tried: [], done: false, correct: false };

function questionHTML(I, key, q, i, parts) {
  const st = stateOf(key, i);
  const kind = QUESTION_KINDS[q.kind];
  const part = Number.isInteger(q.part) && parts[q.part] ? q.part : null;
  const qid = `lc-q-${key}-${i}`;
  let feedback = "";
  if (st.correct)
    feedback = html`<p class="lc-fb is-right" role="status">
      ${icon("check")} <b>${I.T("Yes.", "Sí.")}</b> <span lang="en">${q.why}</span>
    </p>`;
  else if (st.done)
    feedback = html`<p class="lc-fb is-reveal" role="status">
      <b>${I.T("The answer is", "La respuesta es")}</b>
      <span lang="en">${q.options[q.answer]}.</span> <span lang="en">${q.why}</span>
    </p>`;
  else if (st.tried.length)
    feedback = html`<p class="lc-fb is-retry" role="status">
      <b>${I.T("Not quite.", "Todavía no.")}</b> <span lang="en">${q.hint}</span>
      ${I.T("Listen again, then choose a different answer.", "Escucha otra vez y elige otra respuesta.")}
      ${part === null ? "" : html`<button type="button" class="ghost small" data-lc-play="${key}:${part}:${part}">${icon("play")} ${I.T(`Replay part ${part + 1}`, `Repetir la parte ${part + 1}`)}</button>`}
    </p>`;
  return html`<div class="lc-q" data-lc-q="${i}" data-lc-key="${key}">
    <p class="lc-qtext" id="${qid}">
      ${kind ? html`<span class="lc-kind">${I.T(...kind)}</span>` : ""}
      <span lang="en">${q.q}</span>
    </p>
    <div class="lc-opts" role="group" aria-labelledby="${qid}">
      ${q.options.map((opt, j) => {
        const wrong = st.tried.includes(j) && j !== q.answer;
        const right = st.done && j === q.answer;
        return html`<button
          type="button"
          class="lc-opt${wrong ? " is-wrong" : ""}${right ? " is-right" : ""}"
          data-lc-pick="${key}:${i}:${j}"
          lang="en"
          ${st.done || wrong ? raw('aria-disabled="true"') : ""}
        >
          ${opt}${wrong ? html` <span class="sr-only">${I.T("(not this one)", "(no es esta)")}</span>` : ""}${right ? html` <span class="sr-only">${I.T("(correct answer)", "(respuesta correcta)")}</span>` : ""}
        </button>`;
      })}
    </div>
    <div class="lc-fb-wrap">${feedback}</div>
  </div>`;
}

function transcriptHTML(I, key, parts, audio) {
  return html`<details
    class="lc-transcript"
    data-lc-transcript="${key}"
    ${audio ? "" : raw("open")}
  >
    <summary>
      ${audio ? I.T("Transcript (if you cannot hear the audio)", "Transcripción (si no puedes oír el audio)") : I.T("Read the words (audio is not available)", "Lee las palabras (el audio no está disponible)")}
    </summary>
    <p class="fine lc-note">
      ${
        audio
          ? I.T(
              "Reading is a different skill from listening. Try the audio first. If you read, play the audio again while you follow the words.",
              "Leer es una destreza distinta de escuchar. Prueba primero el audio. Si lees, vuelve a reproducir el audio mientras sigues las palabras.",
            )
          : I.T(
              "This browser cannot play read-aloud, so you can read what was said. Ask your teacher or a partner to read it aloud if you can.",
              "Este navegador no puede leer en voz alta, así que puedes leer lo que se dijo. Pide a tu docente o a un compañero que lo lea en voz alta si puedes.",
            )
      }
    </p>
    <ol class="lc-parts" lang="en">
      ${parts.map(
        (p, i) =>
          html`<li data-lc-part="${i}">
            ${p.speaker ? html`<b class="lc-speaker">${p.speaker}:</b> ` : ""}${p.text}
            ${audio ? html`<button type="button" class="ghost small" data-lc-play="${key}:${i}:${i}" aria-label="${I.S(`Replay part ${i + 1}`, `Repetir la parte ${i + 1}`)}">${icon("play")} ${i + 1}</button>` : ""}
          </li>`,
      )}
    </ol>
  </details>`;
}

/**
 * The card. `source` is a retell task or a speaking-studio stimulus: `{ parts | turns, listenFor?, check? }`.
 * `genre` is a short label of what is being heard ("Announcement", "Interview", ...), shown as a chip.
 */
export function listenCardHTML(
  I,
  source,
  { key, rate = NORMAL, genre = "", headingLevel = 2 } = {},
) {
  const parts = listenParts(source);
  const audio = canSpeak();
  const n = plays.get(key) || 0;
  const H = `h${headingLevel}`;
  const listenFor = (source.listenFor || []).filter(Boolean);
  const checks = source.check || [];
  const currentRate = slow ? SLOW : rate > 0.8 ? rate : NORMAL;
  return html`<section class="source listen-card lc" data-lc="${key}">
    <${raw(H)} class="source-title">${icon("listening")} ${I.T("Listen first", "Escucha primero")}${genre ? html` <span class="lc-genre">${genre}</span>` : ""}</${raw(H)}>
    ${
      listenFor.length
        ? html`<p class="lc-purpose">
            <b>${I.T("Listen for:", "Escucha para encontrar:")}</b>
            <span lang="en">${listenFor.join(" · ")}</span>
          </p>`
        : ""
    }
    ${
      audio
        ? html`<div class="listen-player lc-player">
              <button
                type="button"
                class="listen-btn"
                data-lc-play="${key}:0:${parts.length - 1}"
                data-retell-play
                data-play-stimulus
                aria-describedby="lc-status-${key}"
              >
                <span class="listen-icon" aria-hidden="true">${icon("play")}</span
                ><span class="listen-label" data-lc-label
                  >${n ? I.T("Listen again", "Escuchar otra vez") : I.T("Listen", "Escuchar")}</span
                >
              </button>
              <button type="button" class="ghost" data-stop-audio data-lc-stop>
                ${icon("stop")} ${I.T("Stop", "Detener")}
              </button>
              <div
                class="speed"
                role="group"
                aria-label="${I.S("Audio speed", "Velocidad del audio")}"
              >
                <button type="button" class="speed-btn" data-lc-speed="slow" aria-pressed="${slow}">
                  ${I.T("Slower", "Más lento")}
                </button>
                <button
                  type="button"
                  class="speed-btn"
                  data-lc-speed="normal"
                  aria-pressed="${!slow}"
                >
                  ${I.T("Normal", "Normal")}
                </button>
              </div>
            </div>
            <p class="fine lc-status" id="lc-status-${key}" data-lc-status role="status">
              ${n ? I.T(`Played ${n} time${n === 1 ? "" : "s"}. Listen as many times as you need.`, `Reproducido ${n} ${n === 1 ? "vez" : "veces"}. Escucha todas las veces que necesites.`) : I.T("Press Listen. You can replay it, slow it down, or replay one part.", "Presiona Escuchar. Puedes repetirlo, hacerlo más lento o repetir una parte.")}
            </p>
            ${
              parts.length > 1
                ? html`<div
                    class="lc-partbar"
                    role="group"
                    aria-label="${I.S("Replay one part", "Repetir una parte")}"
                  >
                    ${parts.map(
                      (p, i) =>
                        html`<button
                          type="button"
                          class="ghost small"
                          data-lc-part-btn="${i}"
                          data-lc-play="${key}:${i}:${i}"
                        >
                          ${icon("play")}
                          ${p.speaker ? html`<span lang="en">${p.speaker}</span>` : I.T(`Part ${i + 1}`, `Parte ${i + 1}`)}
                        </button>`,
                    )}
                  </div>`
                : ""
            }`
        : html`<div class="listen-player is-unavailable" role="note">
            <p>
              <strong
                >${I.T("Read-aloud is not available in this browser.", "La lectura en voz alta no está disponible en este navegador.")}</strong
              >
              ${I.T("The words are below.", "Las palabras están abajo.")}
            </p>
          </div>`
    }
    ${transcriptHTML(I, key, parts, audio)}
    ${
      checks.length
        ? html`<div class="lc-check">
            <h3 class="lc-check-title">${I.T("Did you catch it?", "¿Lo entendiste?")}</h3>
            <p class="fine">
              ${I.T("Answer before you plan. A wrong answer shows you where to listen again.", "Responde antes de planear. Una respuesta incorrecta te muestra dónde escuchar otra vez.")}
            </p>
            ${checks.map((q, i) => questionHTML(I, key, q, i, parts))}
          </div>`
        : ""
    }
    <span class="sr-only" data-lc-rate="${currentRate}"></span>
  </section>`;
}

function mark(root, index, I) {
  for (const el of root.querySelectorAll("[data-lc-part]"))
    el.classList.toggle("is-playing", Number(el.dataset.lcPart) === index);
  for (const el of root.querySelectorAll("[data-lc-part-btn]"))
    el.classList.toggle("is-playing", Number(el.dataset.lcPartBtn) === index);
  root.querySelector(".lc-player")?.classList.toggle("is-playing", index >= 0);
  void I;
}

async function playRange(root, parts, key, from, to, rate, I) {
  const mine = ++token;
  plays.set(key, (plays.get(key) || 0) + 1);
  const status = root.querySelector("[data-lc-status]");
  const label = root.querySelector("[data-lc-label]");
  if (label) label.textContent = I.S("Listen again", "Escuchar otra vez");
  for (let i = from; i <= to && parts[i]; i++) {
    if (token !== mine) return;
    mark(root, i, I);
    if (status)
      status.textContent = I.S(
        parts.length > 1 ? `Playing part ${i + 1} of ${parts.length}.` : "Playing.",
        parts.length > 1 ? `Reproduciendo la parte ${i + 1} de ${parts.length}.` : "Reproduciendo.",
      );
    const ok = await speak(parts[i].text, { rate, persona: parts[i].persona });
    if (token !== mine || !ok) {
      if (token === mine) mark(root, -1, I);
      return;
    }
    await new Promise((r) => setTimeout(r, 260));
  }
  if (token !== mine) return;
  mark(root, -1, I);
  const n = plays.get(key);
  if (status)
    status.textContent = I.S(
      `Played ${n} time${n === 1 ? "" : "s"}. Listen as many times as you need.`,
      `Reproducido ${n} ${n === 1 ? "vez" : "veces"}. Escucha todas las veces que necesites.`,
    );
}

export function stopListening(root, I) {
  token++;
  stop();
  if (root) mark(root, -1, I);
}

/**
 * Click handling for the card. `source` supplies parts and check questions; `onTranscript(key)` runs the first time the
 * learner opens the transcript (so a host view can record it as a support). Returns true when the click was handled.
 */
export function listenClick(e, ctx, I, source, { key, onTranscript } = {}) {
  const t = e.target;
  const root = t.closest?.("[data-lc]");
  const parts = listenParts(source);
  const rate = () => (slow ? SLOW : ctx?.prefs?.rate > 0.8 ? ctx.prefs.rate : NORMAL);
  const stopBtn = t.closest?.("[data-lc-stop]");
  if (stopBtn) {
    stopListening(root, I);
    return false; // let the host's generic stop-audio handling run too
  }
  const play = t.closest?.("[data-lc-play]");
  if (play && root) {
    const [k, from, to] = unpack(play.dataset.lcPlay);
    if (k !== key) return false;
    if (!canSpeak()) {
      announce(
        I.S(
          "Read-aloud is not available. Read the transcript instead.",
          "La lectura en voz alta no está disponible. Lee la transcripción.",
        ),
      );
      return true;
    }
    playRange(root, parts, key, Number(from), Number(to), rate(), I);
    return true;
  }
  const speed = t.closest?.("[data-lc-speed]");
  if (speed && root) {
    slow = speed.dataset.lcSpeed === "slow";
    for (const b of root.querySelectorAll("[data-lc-speed]"))
      b.setAttribute("aria-pressed", String(b === speed));
    announce(
      slow
        ? I.S("Slower speed.", "Velocidad más lenta.")
        : I.S("Normal speed.", "Velocidad normal."),
      { toast: false },
    );
    return true;
  }
  const summary = t.closest?.("[data-lc-transcript] > summary");
  if (summary) {
    const details = summary.parentElement;
    queueMicrotask(() => {
      if (details.open && !openTranscripts.has(key)) {
        openTranscripts.add(key);
        onTranscript?.(key);
      }
    });
    return false;
  }
  const pick = t.closest?.("[data-lc-pick]");
  if (pick && root) {
    const [k, qi, oj] = unpack(pick.dataset.lcPick);
    if (k !== key || pick.getAttribute("aria-disabled") === "true") return k === key;
    const i = Number(qi);
    const q = (source.check || [])[i];
    if (!q) return false;
    answers.set(`${key}:${i}`, checkOutcome(q, answers.get(`${key}:${i}`), Number(oj)));
    const box = pick.closest("[data-lc-q]");
    box.outerHTML = toHtml(questionHTML(I, key, q, i, parts));
    const fresh = root.querySelector(`[data-lc-q="${i}"]`);
    const st = stateOf(key, i);
    announce(
      st.correct
        ? I.S("Correct.", "Correcto.")
        : st.done
          ? I.S("Here is the answer.", "Aquí está la respuesta.")
          : I.S("Not quite. Listen again.", "Todavía no. Escucha otra vez."),
      { toast: false },
    );
    (
      fresh?.querySelector(".lc-fb button") ||
      fresh?.querySelector(".lc-opt:not([aria-disabled])") ||
      fresh
    )?.focus?.();
    return true;
  }
  return false;
}

/** For tests and the host view: how many questions the learner has finished, and how many were right first time. */
export function checkSummary(key, source) {
  const list = source?.check || [];
  const states = list.map((_, i) => stateOf(key, i));
  return {
    total: list.length,
    done: states.filter((s) => s.done).length,
    firstTry: states.filter((s) => s.correct && s.tried.length === 1).length,
  };
}

export const transcriptOpened = (key) => openTranscripts.has(key);

/** Test hook: forget this tab's listening state. */
export function resetListening() {
  plays.clear();
  answers.clear();
  openTranscripts.clear();
  slow = false;
  token++;
}
