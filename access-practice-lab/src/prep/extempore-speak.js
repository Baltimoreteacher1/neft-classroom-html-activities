// Extempore Speaking Lab (extempore-speak): Near-carbon-copy Extempore split-pane oral assessment & rehearsal studio
// adapted for WIDA ACCESS Speaking. Features:
//   - Extempore Room Header with Task Type, Key Language Use, and Phase Indicator
//   - Split-Screen Studio:
//       Left Pane: Instructor Audio/Visual Prompt Monitor (animated waveform bars, Normal 1.0x + Slow 0.72x audio),
//                  Exhibit A Data/Visual Stimulus Card, and Model Student Exemplar (Maya / Leo)
//       Right Pane:
//         - Step 0: Stimulus & Model Student analysis check
//         - Steps 1 & 2: Tier A (Describe) & Tier B (Explain) tactile clause-tile builder + Extempore Voice Recorder
//         - Step 3: Tier C Unscripted Oral Production Studio with One-Tap Idea Pad (insert starter frames or target
//                   words), Live Target Word & Connector Radar Pills (light up green in real time), Voice Recorder,
//                   and 3-Dimension WIDA Rubric Matrix
//         - Step 4: Side-by-side 3-Turn Speaking Portfolio comparison + Family & Teacher Conference Guide
import { recorderHTML } from "../components.js";
import { isRecording } from "../recorder.js";
import { announce, html, icon, raw } from "../util.js";
import {
  checkBuild,
  checkChoice,
  DIMENSIONS,
  extemporeChecklist,
  seededOrder,
  wordSentenceCheck,
} from "./model.js";
import { PREP_SKILLS } from "./registry.js";
import {
  blanksHTML,
  checkBtn,
  choicesHTML,
  familyTeacherHTML,
  hearBtn,
  hearPairHTML,
  resultHTML,
} from "./ui.js";

export const skill = PREP_SKILLS["extempore-speak"];
export const finishesOnLastStep = true;

/** Decorative SVG waveform monitor bar for the Extempore instructor prompt card. */
function waveformMonitorSVG() {
  const heights = [10, 22, 16, 28, 34, 18, 26, 12, 30, 24, 14, 32, 20, 15, 26, 12];
  return raw(
    `<svg class="ext-waveform-svg" viewBox="0 0 180 40" width="180" height="40" aria-hidden="true" focusable="false">${heights
      .map(
        (h, i) =>
          `<rect x="${4 + i * 11}" y="${20 - h / 2}" width="6" height="${h}" rx="3" fill="currentColor" opacity="${i % 2 === 0 ? "0.85" : "0.55"}"/>`,
      )
      .join("")}</svg>`,
  );
}

function extTopbarHTML(I, set, step) {
  const phases = [
    ["1. Stimulus & Model", "1. Estímulo y modelo"],
    ["2. Tier A · Describe", "2. Nivel A · Describir"],
    ["3. Tier B · Explain", "3. Nivel B · Explicar"],
    ["4. Tier C · Record", "4. Nivel C · Grabar"],
    ["5. Portfolio Review", "5. Portafolio oral"],
  ];
  return html`<div class="ext-topbar" role="region" aria-label="${I.S("Extempore speaking studio status", "Estado del estudio oral Extempore")}">
    <span class="ext-room-badge">
      ${icon("record")} ${I.T("Extempore Oral Studio", "Estudio Oral Extempore")}
    </span>
    <span class="ext-meta-pill">${set.area} · ${set.kind}</span>
    <span class="ext-phase-pill">
      ${I.T(phases[step][0], phases[step][1])}
    </span>
  </div>`;
}

function leftStimulusPaneHTML(I, set, { showModel = true } = {}) {
  const sc = set.scene;
  return html`<aside class="ext-left-pane" aria-label="${I.S("Prompt stimulus and audio monitor", "Estímulo y monitor de audio")}">
    <div class="ext-monitor">
      <div class="ext-monitor-head">
        <span class="ext-avatar-chip" aria-hidden="true">${icon("teacher")}</span>
        <div>
          <strong class="ext-monitor-title">${I.T("Instructor Prompt", "Consigna docente")}</strong>
          <span class="fine">${I.T("Unscripted WIDA Speaking Task", "Tarea oral WIDA")}</span>
        </div>
        ${waveformMonitorSVG()}
      </div>
      <p class="ext-prompt-script" lang="en">${sc.teacherPrompt}</p>
      <div class="ext-monitor-controls">
        ${hearPairHTML(I, sc.teacherPrompt, I.T("Play Prompt", "Escuchar consigna"))}
      </div>
    </div>

    <div class="ext-exhibit">
      <p class="prep-eyebrow">
        ${icon("grid")} ${I.T("Exhibit A · Visual & Data Card", "Anexo A · Tarjeta de datos")}
      </p>
      <h3 class="ext-exhibit-h">${I.T(sc.heading, sc.headingEs || sc.heading)}</h3>
      <ul class="prep-scene-facts">
        ${sc.facts.map(
          (f) =>
            html`<li>
              <span lang="en">${f[0]}</span>
              ${f[1] ? html`<span class="prep-es" lang="es"> · ${f[1]}</span>` : ""}
            </li>`,
        )}
      </ul>
    </div>

    ${
      showModel
        ? html`<div class="ext-exemplar-box">
            <div class="prep-answer-h">
              <strong>
                ${icon("speaking")}
                ${I.T(
                  `Model Student (${sc.modelStudent.name})`,
                  `Estudiante modelo (${sc.modelStudent.name})`,
                )}
              </strong>
              ${hearPairHTML(I, sc.modelStudent.text, I.T("Hear model", "Oír modelo"))}
            </div>
            <p lang="en">${sc.modelStudent.text}</p>
          </div>`
        : ""
    }
  </aside>`;
}

function clauseTileTrayHTML(I, { turnKey, parts, picks = {}, locked = false, seed }) {
  const blankIndices = parts
    .map((p, idx) => (typeof p === "object" ? idx : -1))
    .filter((idx) => idx >= 0);
  const allOptions = blankIndices.flatMap((bIdx) =>
    parts[bIdx].options.map((opt) => ({ bIdx, text: opt })),
  );
  const shuffled = seededOrder(allOptions, seed);

  return html`<div class="ext-clause-tray" role="region" aria-label="${I.S("Tap a phrase tile to build your spoken response", "Toca una ficha de frase para armar tu respuesta oral")}">
    <p class="fine">
      <strong>${I.T("Quick-build tiles (tap to place):", "Fichas rápidas (toca para colocar):")}</strong>
    </p>
    <div class="duo-bank-grid">
      ${shuffled.map((item) => {
        const isPicked = picks[item.bIdx] === item.text;
        return html`<button
          type="button"
          class="duo-tile3d ${isPicked ? "is-placed" : ""}"
          data-prep-act="ext-pick-clause"
          data-turn-key="${turnKey}"
          data-slot-idx="${item.bIdx}"
          data-tile-val="${item.text}"
          ${locked ? raw("disabled") : ""}
          aria-pressed="${String(isPicked)}"
        >
          <span lang="en">${item.text}</span>
        </button>`;
      })}
    </div>
  </div>`;
}

function step0HTML(I, set, st) {
  const sc = set.scene;
  const picked = st.answers?.sceneQ;
  const res = st.checked?.sceneQ;
  return html`${extTopbarHTML(I, set, 0)}
    <div class="ext-studio-split">
      ${leftStimulusPaneHTML(I, set, { showModel: true })}
      <div class="ext-right-pane">
        <p class="prep-lede">
          ${I.T(
            "Listen to the Instructor Prompt and the Model Student on the left. Then answer one question to unlock your three speaking turns.",
            "Escucha la consigna docente y al estudiante modelo a la izquierda. Luego responde una pregunta para abrir tus tres turnos orales.",
          )}
        </p>
        ${choicesHTML(I, {
          name: "sceneQ",
          label: sc.check.q,
          options: sc.check.options,
          picked,
          answer: sc.check.answer,
          checked: res ? "mark" : null,
        })}
        ${res?.ok ? "" : checkBtn(I, "check-scene", Boolean(picked))}
        ${
          res
            ? resultHTML(I, {
                ok: res.ok,
                lead: res.ok
                  ? sc.check.why
                  : I.T(
                      "Listen to the model student again: notice how specific details and a linking word work together.",
                      "Escucha otra vez al estudiante modelo: nota cómo se unen los detalles específicos y un conector.",
                    ),
              })
            : ""
        }
      </div>
    </div>`;
}

function turnBuildHTML(I, set, st, turnKey, stepIdx, tierBadge) {
  const turn = set[turnKey];
  const picks = st.answers?.[turnKey] || {};
  const res = st.checked?.[turnKey];
  const reveal = st.reveal?.[turnKey];
  const done = res?.ok || reveal;
  const recKey = `prep:${set.id}:${turnKey}`;

  return html`${extTopbarHTML(I, set, stepIdx)}
    <div class="ext-studio-split">
      ${leftStimulusPaneHTML(I, set, { showModel: false })}
      <div class="ext-right-pane">
        <blockquote class="prep-prompt">
          <p class="prep-eyebrow">${icon("speaking")} ${tierBadge}</p>
          <p lang="en"><strong>${turn.prompt}</strong></p>
          ${turn.promptEs ? html`<p class="prep-es" lang="es">${turn.promptEs}</p>` : ""}
          <p>${hearPairHTML(I, turn.prompt, I.T("Hear prompt", "Escuchar consigna"))}</p>
        </blockquote>

        <h3 class="prep-sub">
          ${I.T("1. Assemble your spoken response", "1. Arma tu respuesta oral")}
        </h3>
        ${
          reveal
            ? ""
            : html`${clauseTileTrayHTML(I, {
                turnKey,
                parts: turn.parts,
                picks,
                locked: Boolean(done),
                seed: `${set.id}:${turnKey}`,
              })}
              ${blanksHTML(I, { key: turnKey, parts: turn.parts, picks, result: res })}`
        }
        ${
          done
            ? ""
            : checkBtn(
                I,
                `check-${turnKey}`,
                turn.parts.every((p, i) => typeof p === "string" || picks[i]),
                I.T("Check my response", "Revisar mi respuesta"),
              )
        }
        ${
          done
            ? html`${resultHTML(I, {
                  ok: Boolean(res?.ok),
                  lead: I.T(
                    "Response ready! Now rehearse and record it aloud in the Extempore console below.",
                    "¡Respuesta lista! Ahora ensáyala y grábala en voz alta en la consola abajo.",
                  ),
                  action: hearPairHTML(I, turn.model, I.T("Hear model", "Escuchar modelo")),
                })}
                <p class="prep-model" lang="en">${turn.model}</p>
                <div class="prep-extempore-rec">
                  <p class="fine">
                    ${icon("record")}
                    <strong>${I.T("2. Extempore Oral Rehearsal:", "2. Ensayo oral Extempore:")}</strong>
                    ${I.T(
                      "Record yourself speaking this turn aloud, then listen back and compare.",
                      "Grábate diciendo este turno en voz alta y luego escúchate y compara.",
                    )}
                  </p>
                  ${recorderHTML(recKey, { recording: isRecording(recKey) })}
                </div>`
            : res
              ? resultHTML(I, {
                  ok: false,
                  lead: I.T(
                    `${res.right} of ${res.total} parts fit Exhibit A. Check the numbers and details on the left.`,
                    `${res.right} de ${res.total} partes coinciden con el Anexo A. Revisa los datos a la izquierda.`,
                  ),
                  action:
                    (st.tries?.[turnKey] || 0) >= 2
                      ? html`<button
                          type="button"
                          class="btn small"
                          data-prep-act="reveal-${turnKey}"
                        >
                          ${I.T("Show model response", "Mostrar respuesta modelo")}
                        </button>`
                      : "",
                })
              : ""
        }
      </div>
    </div>`;
}

const checkRow = (I, ok, en, es) =>
  html`<li class="${ok ? "is-met" : ""}">
    ${icon(ok ? "check" : "x")} <span>${I.T(en, es)}</span
    ><span class="visually-hidden"
      >${ok ? I.T(" — done", " — listo") : I.T(" — not yet", " — todavía no")}</span
    >
  </li>`;

function turn3HTML(I, set, st) {
  const t3 = set.turn3;
  const text = st.answers?.oral || "";
  const lower = text.toLowerCase();
  const c = extemporeChecklist(set, text);
  const allMet = c.word && c.connector && c.sentence;
  const recKey = `prep:${set.id}:turn3`;

  return html`${extTopbarHTML(I, set, 3)}
    <div class="ext-studio-split">
      ${leftStimulusPaneHTML(I, set, { showModel: true })}
      <div class="ext-right-pane">
        <blockquote class="prep-prompt">
          <p class="prep-eyebrow">
            ${icon("speaking")}
            ${I.T(
              "Turn 3 · Tier C Unscripted Oral Production",
              "Turno 3 · Producción oral extendida (Nivel C)",
            )}
          </p>
          <p lang="en"><strong>${t3.prompt}</strong></p>
          ${t3.promptEs ? html`<p class="prep-es" lang="es">${t3.promptEs}</p>` : ""}
          <p>${hearPairHTML(I, t3.prompt, I.T("Hear prompt", "Escuchar consigna"))}</p>
        </blockquote>

        <div class="ext-radar-panel" id="extRadarPanel" role="region" aria-label="${I.S("Live WIDA vocabulary and connector radar", "Radar en vivo de vocabulario y conectores WIDA")}">
          <p class="ext-radar-title">
            ${icon("sparkle")}
            <strong>
              ${I.T(
                "Live WIDA Language Radar (tap any chip to insert it into your response):",
                "Radar de lenguaje WIDA en vivo (toca cualquier ficha para insertarla):",
              )}
            </strong>
          </p>
          <div class="ext-radar-group">
            <span class="fine">${I.T("Academic words:", "Palabras clave:")}</span>
            ${t3.words.map((w) => {
              const hit = wordSentenceCheck(w, lower).word;
              return html`<button
                type="button"
                class="ext-radar-chip ${hit ? "is-hit" : ""}"
                data-prep-act="ext-insert-token"
                data-token="${w}"
                data-radar-word="${w}"
              >
                ${icon(hit ? "check" : "words")} <span lang="en">${w}</span>
              </button>`;
            })}
          </div>
          <div class="ext-radar-group">
            <span class="fine">${I.T("Discourse connectors:", "Conectores:")}</span>
            ${t3.connectors.map((conn) => {
              const hit = lower.includes(conn.toLowerCase());
              return html`<button
                type="button"
                class="ext-radar-chip ${hit ? "is-hit" : ""}"
                data-prep-act="ext-insert-token"
                data-token="${conn}"
                data-radar-conn="${conn}"
              >
                ${icon(hit ? "check" : " bulb" === " bulb" ? "bulb" : "check")} <span lang="en">${conn}</span>
              </button>`;
            })}
          </div>
          ${
            t3.frames?.length
              ? html`<div class="ext-frames-box">
                  <span class="fine">${I.T("Tap a starter frame to begin:", "Toca un marco para empezar:")}</span>
                  <div class="ext-frame-btns">
                    ${t3.frames.map(
                      (f) =>
                        html`<button
                          type="button"
                          class="btn small ghost"
                          data-prep-act="ext-use-frame"
                          data-frame="${f.replace(/___/g, "").trim()}"
                        >
                          ${icon("writing")} <span lang="en">${f}</span>
                        </button>`,
                    )}
                  </div>
                </div>`
              : ""
          }
        </div>

        <div class="prep-extempore-rec">
          <h3 class="prep-sub">
            ${icon("record")}
            ${I.T(
              "Step A · Record your unscripted oral response (optional)",
              "Paso A · Graba tu respuesta oral (opcional)",
            )}
          </h3>
          <p class="fine">
            ${I.T(
              "Press Record, speak clearly using the Exhibit A facts, then stop and listen back.",
              "Pulsa Grabar, habla con claridad usando los datos del Anexo A y luego escúchate.",
            )}
          </p>
          ${recorderHTML(recKey, { recording: isRecording(recKey) })}
        </div>

        <label class="prep-write" for="prepOral">
          <strong>
            ${I.T(
              "Step B · Spoken transcript & instant 3-Dimension WIDA coach",
              "Paso B · Transcripción oral y autoevaluación WIDA en 3 dimensiones",
            )}
          </strong>
        </label>
        <textarea
          id="prepOral"
          class="prep-textarea"
          rows="4"
          data-prep-text="oral"
          data-nsr-ignore
          aria-describedby="prepCheckH"
          placeholder="${I.S(
            "Type or dictate your spoken response here (or tap a starter frame above)…",
            "Escribe o dicta tu respuesta oral aquí (o toca un marco arriba)…",
          )}"
        >
${text}</textarea>
        ${
          text.trim()
            ? html`<p>${hearPairHTML(I, text, I.T("Hear my response aloud", "Escuchar mi respuesta"))}</p>`
            : ""
        }

        <h3 id="prepCheckH" class="prep-sub">
          ${I.T("3-Dimension WIDA Speaking Self-Check", "Autoevaluación oral en 3 dimensiones WIDA")}
        </h3>
        <ul id="prepChecklist" class="prep-checklist" aria-live="polite">
          ${checkRow(
            I,
            c.word,
            `Word/Phrase Dimension: Uses a target academic word (${t3.words.join(", ")})`,
            `Dimensión Palabra/Frase: Usa una palabra académica clave (${t3.words.join(", ")})`,
          )}
          ${checkRow(
            I,
            c.connector,
            `Sentence Dimension: Connects ideas with ${t3.connectors.join(", ")}`,
            `Dimensión Oración: Conecta ideas con ${t3.connectors.join(", ")}`,
          )}
          ${checkRow(
            I,
            c.sentence,
            "Discourse Dimension: Complete academic response (7 words or more)",
            "Dimensión Discurso: Respuesta académica completa (7 palabras o más)",
          )}
        </ul>

        <details class="fb-more">
          <summary>
            ${I.T(
              "Compare with the Model Student Tier C exemplar",
              "Comparar con la respuesta modelo de Nivel C",
            )}
          </summary>
          <p class="prep-model" lang="en">${t3.model} ${hearPairHTML(I, t3.model)}</p>
        </details>

        <p>
          <button
            type="button"
            class="btn btn-primary"
            data-prep-act="finish-oral"
            ${allMet ? "" : raw("disabled")}
          >
            ${icon("check")} ${I.T("Save my Turn 3 response", "Guardar mi respuesta del Turno 3")}
          </button>
          ${
            st.checked?.turn3?.ok
              ? html`<span class="prep-set-done">
                  ${icon("check")} ${I.T("Turn 3 saved", "Turno 3 guardado")}
                </span>`
              : ""
          }
        </p>
      </div>
    </div>`;
}

function summaryHTML(I, set, st) {
  const mine = st.answers?.oral || set.turn3.model;
  return html`${extTopbarHTML(I, set, 4)}
    <div class="duo-celebration-card" role="status">
      <div class="duo-celebration-head">
        <span class="duo-trophy-badge" aria-hidden="true">${icon("speaking")}</span>
        <div>
          <p class="fb-title">
            ${icon("check")}
            ${I.T(
              "Extempore Speaking Portfolio Complete!",
              "¡Portafolio oral Extempore completado!",
            )}
          </p>
          <p class="fb-lead">
            ${I.T(
              "You progressed from Tier A description to Tier B explanation and Tier C extended academic discourse.",
              "Avanzaste desde la descripción de Nivel A hasta la explicación de Nivel B y el discurso académico extendido de Nivel C.",
            )}
          </p>
        </div>
      </div>
    </div>

    <h3 class="prep-sub">
      ${I.T(
        "Side-by-Side 3-Turn Speaking Ladder & Exemplar Comparison",
        "Escalera oral de 3 turnos y comparación con el modelo",
      )}
    </h3>
    <ol class="prep-answers">
      <li class="prep-answer">
        <p class="prep-answer-h">
          <strong>${I.T("Turn 1 · Tier A (Describe)", "Turno 1 · Nivel A (Describir)")}</strong>
          ${hearPairHTML(I, set.turn1.model)}
        </p>
        <p lang="en">${set.turn1.model}</p>
      </li>
      <li class="prep-answer">
        <p class="prep-answer-h">
          <strong>${I.T("Turn 2 · Tier B (Explain)", "Turno 2 · Nivel B (Explicar)")}</strong>
          ${hearPairHTML(I, set.turn2.model)}
        </p>
        <p lang="en">${set.turn2.model}</p>
      </li>
      <li class="prep-answer is-best">
        <p class="prep-answer-h">
          <strong>
            ${I.T(
              "Turn 3 · Tier C (Your Extended Response)",
              "Turno 3 · Nivel C (Tu respuesta extendida)",
            )}
          </strong>
          ${hearPairHTML(I, mine)}
        </p>
        <p lang="en">${mine}</p>
      </li>
      <li class="prep-answer">
        <p class="prep-answer-h">
          <strong>
            ${I.T(
              `Model Student Tier C Benchmark (${set.scene.modelStudent.name})`,
              `Modelo de referencia Nivel C (${set.scene.modelStudent.name})`,
            )}
          </strong>
          ${hearPairHTML(I, set.turn3.model)}
        </p>
        <p lang="en">${set.turn3.model}</p>
      </li>
    </ol>

    <p class="prep-dim-row">
      ${I.T("WIDA Dimensions demonstrated:", "Dimensiones WIDA demostradas:")}
      ${["discourse", "sentence", "word"].map(
        (d) =>
          html`<span class="prep-dim-tag is-${d}">
            ${I.T(DIMENSIONS[d][0], DIMENSIONS[d][1])}
          </span>`,
      )}
    </p>

    ${familyTeacherHTML(I, set)}

    <p>
      <button type="button" class="btn" data-prep-act="restart">
        ${icon("replay")}
        ${I.T("Practice this speaking set again", "Practicar este conjunto oral otra vez")}
      </button>
    </p>`;
}

export function body(I, set, st, step) {
  if (step === 0) return step0HTML(I, set, st);
  if (step === 1)
    return turnBuildHTML(
      I,
      set,
      st,
      "turn1",
      1,
      I.T("Turn 1 · Tier A Foundations", "Turno 1 · Bases de Nivel A"),
    );
  if (step === 2)
    return turnBuildHTML(
      I,
      set,
      st,
      "turn2",
      2,
      I.T("Turn 2 · Tier B Bridge", "Turno 2 · Puente de Nivel B"),
    );
  if (step === 3) return turn3HTML(I, set, st);
  return summaryHTML(I, set, st);
}

export function ready(set, st, step) {
  if (step === 0) return Boolean(st.checked?.sceneQ?.ok);
  if (step === 1) return Boolean(st.checked?.turn1?.ok || st.reveal?.turn1);
  if (step === 2) return Boolean(st.checked?.turn2?.ok || st.reveal?.turn2);
  if (step === 3) {
    const c = extemporeChecklist(set, st.answers?.oral || "");
    return Boolean(st.checked?.turn3?.ok || (c.word && c.connector && c.sentence));
  }
  return true;
}

export function notReady(I, set, st, step) {
  if (step === 0)
    return I.S(
      "Answer the question about the model first.",
      "Primero responde la pregunta sobre el modelo.",
    );
  if (step === 1)
    return I.S("Complete and check Turn 1 first.", "Primero completa y revisa el Turno 1.");
  if (step === 2)
    return I.S("Complete and check Turn 2 first.", "Primero completa y revisa el Turno 2.");
  if (step === 3)
    return I.S(
      "Include a target word, a connector, and at least 7 words in Turn 3.",
      "Incluye una palabra clave, un conector y al menos 7 palabras en el Turno 3.",
    );
  return "";
}

/** Live update for the 3-dimension WIDA speaking checklist AND the radar chips as the student types. */
export function onText(key, set, st) {
  if (key !== "oral") return;
  const text = st.answers?.oral || "";
  const lower = text.toLowerCase();
  const c = extemporeChecklist(set, text);
  const es = document.documentElement.lang === "es";
  const list = document.getElementById("prepChecklist");
  if (list) {
    [c.word, c.connector, c.sentence].forEach((ok, i) => {
      const li = list.children[i];
      if (!li) return;
      li.classList.toggle("is-met", ok);
      const use = li.querySelector("use");
      use?.setAttribute(
        "href",
        use.getAttribute("href").replace(/#(check|x)$/, `#${ok ? "check" : "x"}`),
      );
      const sr = li.querySelector(".visually-hidden");
      if (sr)
        sr.textContent = ok ? (es ? " — listo" : " — done") : es ? " — todavía no" : " — not yet";
    });
  }
  for (const el of document.querySelectorAll("[data-radar-word]")) {
    const w = el.dataset.radarWord;
    el.classList.toggle("is-hit", wordSentenceCheck(w, lower).word);
  }
  for (const el of document.querySelectorAll("[data-radar-conn]")) {
    const conn = el.dataset.radarConn;
    el.classList.toggle("is-hit", lower.includes(conn.toLowerCase()));
  }
  const btn = document.querySelector("[data-prep-act=finish-oral]");
  if (btn) btn.disabled = !(c.word && c.connector && c.sentence);
}

export function act(name, el, set, st, I) {
  st.checked ||= {};
  st.tries ||= {};
  st.answers ||= {};

  if (name === "ext-pick-clause") {
    const turnKey = el.dataset.turnKey;
    const slotIdx = el.dataset.slotIdx;
    const val = el.dataset.tileVal;
    if (turnKey && slotIdx !== undefined && val) {
      st.answers[turnKey] = { ...(st.answers[turnKey] || {}), [slotIdx]: val };
      delete st.checked[turnKey];
    }
    return { focus: `[data-prep-blank="${turnKey}:${slotIdx}"]` };
  }
  if (name === "ext-insert-token") {
    const token = el.dataset.token;
    if (token) {
      const curText = String(st.answers.oral || "").trim();
      st.answers.oral = curText ? `${curText} ${token} ` : `${token} `;
      if (I) announce(I.S(`Added ${token}.`, `Se agregó ${token}.`));
    }
    return { focus: "#prepOral" };
  }
  if (name === "ext-use-frame") {
    const frame = el.dataset.frame;
    if (frame) {
      st.answers.oral = `${frame} `;
      if (I) announce(I.S("Starter frame added.", "Marco inicial agregado."));
    }
    return { focus: "#prepOral" };
  }

  if (name === "check-scene") {
    st.checked.sceneQ = checkChoice(set.scene.check, st.answers?.sceneQ);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-turn1") {
    st.tries.turn1 = (st.tries.turn1 || 0) + 1;
    st.checked.turn1 = checkBuild(set.turn1.parts, st.answers?.turn1);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-turn1") {
    st.reveal = { ...(st.reveal || {}), turn1: true };
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-turn2") {
    st.tries.turn2 = (st.tries.turn2 || 0) + 1;
    st.checked.turn2 = checkBuild(set.turn2.parts, st.answers?.turn2);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-turn2") {
    st.reveal = { ...(st.reveal || {}), turn2: true };
    return { focus: ".prep-step .feedback" };
  }
  if (name === "finish-oral") {
    const c = extemporeChecklist(set, st.answers?.oral || "");
    if (c.word && c.connector && c.sentence) {
      st.checked.turn3 = { ok: true };
      return { finish: true, focus: "[data-prep-act=next]" };
    }
    return false;
  }
  return false;
}
