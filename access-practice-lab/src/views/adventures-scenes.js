// Adventure Worlds scene screens (one scene per screen): story, read, listen, clues, choice, order, respond,
// checkpoint (ADVENTURE-SCHEMA.md). Pure markup builders; state and events live in src/views/adventures.js.
// Every control is a button, link, textarea or disclosure: no drag-only interaction anywhere.
import { ADV_ART } from "../adventures/art.js";
import * as K from "../adventures/checks.js";
import { ART } from "../book/art.js";
import { esc, html, icon, raw } from "../util.js";

const ART_BY_KEY = new Map([...ART, ...ADV_ART].map((a) => [a.key, a]));
const srcCache = new Map();
/** A data: URL for an art key from the adventure library or the Book Studio library ("" when unknown). */
export function artSrc(key) {
  if (srcCache.has(key)) return srcCache.get(key);
  const a = ART_BY_KEY.get(key);
  const src = a ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(a.svg)}` : "";
  srcCache.set(key, src);
  return src;
}
const isBg = (key) => /^bg-|^adv-(tide-pool|volcano)$/.test(key);

/** An illustrated stage: the first background fills it; people and objects stand in front, left to right. */
export function stageHTML(keys = [], { size = "", label = "" } = {}) {
  const list = keys.filter((k) => artSrc(k));
  if (!list.length) return "";
  const bg = list.find(isBg);
  const fronts = list.filter((k) => k !== bg).slice(0, 3);
  return html`<figure
    class="adv-stage ${size}"
    ${label ? raw(`role="img" aria-label="${esc(label)}"`) : raw('aria-hidden="true"')}
  >
    ${bg ? html`<img class="adv-stage-bg" src="${artSrc(bg)}" alt="" />` : ""}
    <div class="adv-stage-front">
      ${fronts.map((k) => html`<img class="${k.startsWith("char-") ? "adv-char" : "adv-obj"}" src="${artSrc(k)}" alt="" />`)}
    </div>
  </figure>`;
}

const fb = (I, ok, title, extra = "") =>
  html`<div class="feedback ${ok ? "is-right" : "is-hint"}" role="status">
    <p class="fb-title">${icon(ok ? "check" : "bulb")} ${title}</p>
    ${extra}
  </div>`;

const listenButton = (I, idx) =>
  html`<button type="button" class="btn adv-listen" data-adv-speak="${idx}">
    ${icon("volume")} ${I.T("Read it to me", "Léemelo")}
  </button>`;

// ── input scenes ─────────────────────────────────────────────────────────────
function story(I, s, i, a, world) {
  const who = s.speaker || "";
  return html`<section class="adv-scene adv-story" aria-labelledby="advSceneH">
    ${stageHTML(s.art || [world.theme.bg], { size: "is-wide" })}
    <div class="adv-bubble">
      <h2 id="advSceneH" class="adv-speaker">${who || I.T("The story", "La historia")}</h2>
      <p class="adv-story-text" lang="en">${s.text.en}</p>
      ${a.es ? html`<p class="adv-es" lang="es">${s.text.es}</p>` : ""}
      <div class="row-actions">
        ${s.listen ? listenButton(I, i) : ""}
        ${a.es ? "" : html`<button type="button" class="btn ghost" data-adv-es="${i}">${icon("language")} ${I.T("Help in Spanish", "Ayuda en español")}</button>`}
      </div>
    </div>
  </section>`;
}

/** The passage with glossary words as buttons (tap or Enter shows the meaning below). */
function passageHTML(s) {
  const words = (s.glossary || []).map((g) => g.word).sort((x, y) => y.length - x.length);
  const text = s.text.en;
  if (!words.length) return esc(text);
  const pattern = new RegExp(
    `\\b(${words.map((w) => w.replace(/(es|ed|ing|e|s)$/i, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[a-z]*`,
    "gi",
  );
  const used = new Set();
  return text.replace(/[^]+/, (t) => {
    let out = "";
    let last = 0;
    for (const m of t.matchAll(pattern)) {
      const g = s.glossary.find((x) =>
        m[0].toLowerCase().startsWith(x.word.toLowerCase().replace(/(es|ed|ing|e|s)$/i, "")),
      );
      out += esc(t.slice(last, m.index));
      if (g && !used.has(g.word)) {
        used.add(g.word);
        out += `<button type="button" class="adv-gloss" data-adv-gloss="${esc(g.word)}">${esc(m[0])}</button>`;
      } else out += esc(m[0]);
      last = m.index + m[0].length;
    }
    return out + esc(t.slice(last));
  });
}
function read(I, s, i, a) {
  const g = (s.glossary || []).find((x) => x.word === a.gloss);
  return html`<section class="adv-scene adv-read" aria-labelledby="advSceneH">
    <article class="adv-paper">
      ${s.art?.length ? html`<img class="adv-paper-art" src="${artSrc(s.art[0])}" alt="" />` : ""}
      <p class="eyebrow">${icon("reading")} ${I.T("Read closely", "Lee con atención")}</p>
      <h2 id="advSceneH" lang="en">${s.title.en}</h2>
      <p class="adv-passage" lang="en">${raw(passageHTML(s))}</p>
      ${s.glossary?.length ? html`<p class="fine">${I.T("Tap an underlined word to see what it means.", "Toca una palabra subrayada para ver qué significa.")}</p>` : ""}
      <div class="adv-gloss-card" aria-live="polite">
        ${g ? html`<p><b lang="en">${g.word}</b>: <span lang="en">${g.en}</span><br /><span class="adv-es" lang="es">${g.es}</span></p>` : ""}
      </div>
      <div class="row-actions">${listenButton(I, i)}</div>
      ${a.aloud ? html`<p class="fine">${I.T("Read-aloud is a help, so this mission is marked “with help”.", "Escuchar la lectura es una ayuda, así que esta misión queda marcada “con ayuda”.")}</p>` : ""}
    </article>
  </section>`;
}

function listen(I, s, i, a) {
  return html`<section class="adv-scene adv-listen-scene" aria-labelledby="advSceneH">
    <div class="adv-listen-card">
      <p class="eyebrow">${icon("listening")} ${I.T("Listen", "Escucha")}</p>
      <h2 id="advSceneH">${I.T(s.transcriptLabel.en, s.transcriptLabel.es)}</h2>
      <div class="row-actions">
        <button type="button" class="btn btn-primary btn-big" data-adv-play="${i}">
          ${icon("play")}
          ${a.plays ? I.T("Play again", "Escuchar otra vez") : I.T("Play", "Escuchar")}
        </button>
        <button type="button" class="btn" data-adv-stop>
          ${icon("stop")} ${I.T("Stop", "Parar")}
        </button>
      </div>
      <p class="fine">
        ${a.plays ? I.T(`Played ${a.plays} ${a.plays === 1 ? "time" : "times"}. Listen as often as you like.`, `Escuchado ${a.plays} ${a.plays === 1 ? "vez" : "veces"}. Escucha cuantas veces quieras.`) : I.T("Listen first. You can play it as many times as you need.", "Escucha primero. Puedes repetirlo las veces que necesites.")}
      </p>
      <details class="adv-transcript" ${a.transcript ? raw("open") : ""}>
        <summary data-adv-transcript="${i}">
          ${I.T("Show the words (help)", "Mostrar las palabras (ayuda)")}
        </summary>
        <p lang="en">${s.script.en}</p>
      </details>
    </div>
  </section>`;
}

function checkpoint(I, s) {
  return html`<section class="adv-scene adv-checkpoint" aria-labelledby="advSceneH">
    <div class="adv-check-card">
      <span class="adv-check-icon" aria-hidden="true">💾</span>
      <h2 id="advSceneH">
        ${I.T("Checkpoint: progress saved", "Punto de control: progreso guardado")}
      </h2>
      <p>${I.T(s.text.en, s.text.es)}</p>
    </div>
  </section>`;
}

// ── thinking scenes ──────────────────────────────────────────────────────────
function clues(I, s, i, a) {
  const picked = a.picked || [];
  const aside = a.aside || [];
  const st = K.boardStatus(s, picked);
  const last = s.clues.find((c) => c.id === a.last);
  return html`<section class="adv-scene adv-clues" aria-labelledby="advSceneH">
    <h2 id="advSceneH">${I.T(s.prompt.en, s.prompt.es)}</h2>
    <div class="adv-clue-grid">
      <ul class="adv-clue-list" aria-label="${I.S("Clues to examine", "Pistas para examinar")}">
        ${s.clues.map((c) => {
          const kept = picked.includes(c.id);
          const out = aside.includes(c.id);
          return html`<li class="adv-clue ${kept ? "is-kept" : out ? "is-aside" : ""}">
            <p lang="en">${c.text.en}</p>
            ${
              kept
                ? html`<p class="adv-clue-state">
                    ${icon("check")} ${I.T("On the board", "En el tablero")}
                  </p>`
                : out
                  ? html`<p class="adv-clue-state">
                      ${icon("x")} ${I.T("Set aside", "Descartada")}: ${I.T(c.why.en, c.why.es)}
                    </p>`
                  : html`<button
                      type="button"
                      class="btn small"
                      data-adv-clue="${c.id}"
                      ${st.done ? raw("disabled") : ""}
                    >
                      ${icon("pin")} ${I.T("Add to my board", "Agregar a mi tablero")}
                    </button>`
            }
          </li>`;
        })}
      </ul>
      <aside class="adv-board" aria-labelledby="advBoardH">
        <h3 id="advBoardH">
          ${icon("evidence")} ${I.T("My evidence board", "Mi tablero de evidencia")}
        </h3>
        <p class="adv-board-count">
          ${I.T(`${st.kept} of ${st.need} clues`, `${st.kept} de ${st.need} pistas`)}
        </p>
        <div class="bar" aria-hidden="true">
          <i style="width:${Math.round((100 * st.kept) / st.need)}%"></i>
        </div>
        <ol class="adv-board-list">
          ${s.clues
            .filter((c) => picked.includes(c.id))
            .map(
              (c) =>
                html`<li>
                  <span lang="en">${c.text.en}</span
                  >${st.done ? "" : html`<button type="button" class="btn small ghost" data-adv-unclue="${c.id}" aria-label="${I.S(`Take off the board: ${c.text.en}`, `Quitar del tablero: ${c.text.en}`)}">${icon("close")}</button>`}
                </li>`,
            )}
        </ol>
    ${
      last && !st.done
        ? fb(
            I,
            last.relevant,
            last.relevant
              ? I.T("Good evidence.", "Buena evidencia.")
              : I.T("Not this one.", "Esta no."),
            html`<p>${I.T(last.why.en, last.why.es)}</p>`,
          )
        : ""
    }
      </aside>
    </div>
    ${st.done ? fb(I, true, I.T("Your board is ready. Press Next.", "Tu tablero está listo. Presiona Siguiente.")) : ""}
  </section>`;
}

function choice(I, s, i, a) {
  const wrong = a.wrong || [];
  return html`<section class="adv-scene adv-choice" aria-labelledby="advSceneH">
    <h2 id="advSceneH">${I.T(s.prompt.en, s.prompt.es)}</h2>
    <div class="adv-options" role="group" aria-labelledby="advSceneH">
      ${s.options.map((o, k) => {
        const isWrong = wrong.includes(k);
        const isPicked = a.ok && a.chosen === k;
        const isReveal = !a.ok && a.reveal === k;
        return html`<button
          type="button"
          class="adv-option ${isWrong ? "is-wrong" : ""} ${isPicked ? "is-right" : ""} ${isReveal ? "is-reveal" : ""}"
          data-adv-option="${k}"
          aria-pressed="${isPicked || isWrong}"
          ${a.ok || isWrong ? raw("disabled") : ""}
        >
          <span class="adv-option-letter" aria-hidden="true">${String.fromCharCode(65 + k)}</span>
          <span lang="en">${o.text.en}</span>
        </button>`;
      })}
    </div>
    ${a.feedback ? fb(I, !!a.ok, I.T(a.feedback.en, a.feedback.es), a.reveal != null && !a.ok ? html`<p>${I.T("The highlighted answer is the one the evidence supports. Read it, then choose it.", "La respuesta resaltada es la que apoya la evidencia. Léela y elígela.")}</p>` : "") : ""}
  </section>`;
}

function order(I, s, i, a) {
  const seq = a.order || K.shuffledOrder(s.items.length, `${i}:${s.items[0].en}`);
  const r = a.result;
  return html`<section class="adv-scene adv-order" aria-labelledby="advSceneH">
    <h2 id="advSceneH">${I.T(s.prompt.en, s.prompt.es)}</h2>
    <p class="fine">
      ${I.T("Use the arrow buttons to move a card up or down.", "Usa los botones de flecha para subir o bajar una tarjeta.")}
    </p>
    <ol class="adv-order-list">
      ${seq.map(
        (idx, pos) =>
          html`<li class="${a.ok ? "is-done" : ""}">
            <span class="adv-order-n" aria-hidden="true">${pos + 1}</span>
            <span class="adv-order-text" lang="en">${s.items[idx].en}</span>
            ${
              a.ok
                ? ""
                : html`<span class="adv-order-btns">
                    <button
                      type="button"
                      class="btn small"
                      data-adv-move="${pos}"
                      data-dir="-1"
                      ${pos === 0 ? raw("disabled") : ""}
                      aria-label="${I.S(`Move card ${pos + 1} up`, `Subir la tarjeta ${pos + 1}`)}"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="btn small"
                      data-adv-move="${pos}"
                      data-dir="1"
                      ${pos === seq.length - 1 ? raw("disabled") : ""}
                      aria-label="${I.S(`Move card ${pos + 1} down`, `Bajar la tarjeta ${pos + 1}`)}"
                    >
                      ↓
                    </button>
                  </span>`
            }
          </li>`,
      )}
    </ol>
    ${a.ok ? "" : html`<button type="button" class="btn btn-primary" data-adv-check-order>${icon("check")} ${I.T("Check the order", "Revisar el orden")}</button>`}
    ${
      r
        ? fb(
            I,
            r.ok,
            I.T(r.message.en, r.message.es),
            r.model
              ? html`<ol class="adv-model-order" lang="en">
                  ${r.model.map((m) => html`<li>${m}</li>`)}
                </ol>`
              : "",
          )
        : ""
    }
  </section>`;
}

// ── production ───────────────────────────────────────────────────────────────
function respond(I, s, i, a, entry) {
  const helpOpen = entry.mode === "help" || a.help;
  const r = a.result;
  const say = s.mode === "say";
  return html`<section class="adv-scene adv-respond" aria-labelledby="advSceneH">
    <p class="eyebrow">
      ${icon(say ? "speaking" : "writing")}
      ${say ? I.T("Your turn to speak", "Te toca hablar") : I.T("Your turn to write", "Te toca escribir")}
    </p>
    <h2 id="advSceneH">${I.T(s.prompt.en, s.prompt.es)}</h2>
    ${
      helpOpen
        ? html`<div class="adv-supports">
            <div>
              <h3>${I.T("Sentence frames", "Marcos de oración")}</h3>
              <ul lang="en">
                ${s.frames.map((f) => html`<li>${f.en}</li>`)}
              </ul>
            </div>
            <div>
              <h3>${I.T("Word bank", "Banco de palabras")}</h3>
              <p class="adv-bank" lang="en">
                ${s.wordBank.map((w) => html`<span class="chip">${w}</span>`)}
              </p>
            </div>
          </div>`
        : html`<p>
            <button type="button" class="btn ghost" data-adv-help="${i}">
              ${icon("bulb")}
              ${I.T("I want frames and a word bank", "Quiero marcos y un banco de palabras")}
            </button>
          </p>`
    }
    ${
      say
        ? html`<div class="row-actions">
            <button
              type="button"
              class="btn ${a.listening ? "" : "btn-primary"}"
              data-adv-dictate="${i}"
            >
              ${icon(a.listening ? "stop" : "record")}
              ${a.listening ? I.T("Stop", "Parar") : I.T("Speak", "Hablar")}
            </button>
            <span class="fine"
              >${I.T("Say it out loud. Your words appear in the box, and you can fix them.", "Dilo en voz alta. Tus palabras aparecen en el cuadro y puedes corregirlas.")}</span
            >
          </div>`
        : ""
    }
    <label class="field adv-field">
      <span
        >${say ? I.T("What I said (you can type or fix it)", "Lo que dije (puedes escribir o corregir)") : I.T("My writing", "Mi escritura")}</span
      >
      <textarea rows="${say ? 5 : 8}" lang="en" data-adv-text="${i}" data-nsr-ignore>
${a.text || ""}</textarea>
    </label>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-adv-check-respond="${i}">
        ${icon("check")} ${I.T("Check my work", "Revisar mi trabajo")}
      </button>
      <span class="fine"
        >${I.T(`Words: ${K.countWords(a.text || "")}`, `Palabras: ${K.countWords(a.text || "")}`)}</span
      >
    </div>
    ${
      r
        ? fb(
            I,
            r.ok,
            r.ok
              ? I.T(
                  "Your answer does everything this mission asks.",
                  "Tu respuesta hace todo lo que pide la misión.",
                )
              : I.T(r.next.en, r.next.es),
            html`<ul class="adv-checklist">
              ${r.items.map((it) => html`<li class="${it.ok ? "is-met" : ""}">${it.ok ? "✅" : "⬜"} ${I.T(it.label.en, it.label.es)}</li>`)}
            </ul>`,
          )
        : ""
    }
    ${
      (a.checks || 0) >= 2 && !r?.ok
        ? html`<details class="adv-model" ${a.modelOpen ? raw("open") : ""}>
            <summary data-adv-model="${i}">
              ${I.T("See a model answer", "Ver una respuesta modelo")}
            </summary>
            <p lang="en">${s.model.en}</p>
            <p class="fine">
              ${I.T("Use it to check your own ideas. Write your answer in your own words.", "Úsala para revisar tus ideas. Escribe tu respuesta con tus propias palabras.")}
            </p>
          </details>`
        : ""
    }
  </section>`;
}

export function sceneHTML(I, s, i, a, entry, world) {
  if (s.kind === "story") return story(I, s, i, a, world);
  if (s.kind === "read") return read(I, s, i, a);
  if (s.kind === "listen") return listen(I, s, i, a);
  if (s.kind === "clues") return clues(I, s, i, a);
  if (s.kind === "choice") return choice(I, s, i, a);
  if (s.kind === "order") return order(I, s, i, a);
  if (s.kind === "respond") return respond(I, s, i, a, entry);
  return checkpoint(I, s);
}
