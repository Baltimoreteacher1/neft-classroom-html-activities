// Language Path & Micro-Drills (daily-drill): Near-carbon-copy Duolingo interactive mechanics adapted for WIDA 2020
// ELD Standards. Features:
//   - Top Duolingo progress bar + exercise counter + unlimited practice shield
//   - Character avatar + speech bubble with Normal (🔊) and Slow Turtle (🐢) audio + dotted-underline word hints
//   - Step 0: Interactive 2-Column Tap-the-Pairs Board (tap a word card on the left, tap its meaning card on the right
//             to lock matches in green, synced with accessible <select> controls)
//   - Step 1: Listen & Tap 3D Word-Bank Tiles into the lined sentence tray (with Normal + Slow Turtle audio)
//   - Step 2: Context-Clue Passage with dotted-underline vocabulary tooltips + 3D tap-to-fill word chips
//   - Step 3: Sentence Forge with 3D academic clause tiles + WIDA 3-Dimension badges
//   - Step 4: Duolingo Lesson Complete Trophy Card, Mistake Review summary, and Family/Teacher Take-Home Guide
import { announce, html, icon, raw } from "../util.js";
import { checkBuild, checkPairs, DIMENSIONS, seededOrder } from "./model.js";
import { PREP_SKILLS } from "./registry.js";
import {
  blanksHTML,
  checkBtn,
  familyTeacherHTML,
  hearBtn,
  hearPairHTML,
  hearSlowBtn,
  resultHTML,
} from "./ui.js";

export const skill = PREP_SKILLS["daily-drill"];
export const finishesOnLastStep = true;

/** Inline SVG Duolingo-style scholar owl mascot for the speech-bubble prompt stage. */
function mascotSVG() {
  return raw(
    `<svg class="duo-mascot" viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" focusable="false"><circle cx="32" cy="32" r="30" fill="#e6f4f1" stroke="#0b7a68" stroke-width="2.5"/><ellipse cx="32" cy="36" rx="18" ry="16" fill="#0b7a68"/><circle cx="24" cy="28" r="7" fill="#ffffff"/><circle cx="40" cy="28" r="7" fill="#ffffff"/><circle cx="24" cy="28" r="3.5" fill="#142d47"/><circle cx="40" cy="28" r="3.5" fill="#142d47"/><polygon points="29,33 35,33 32,39" fill="#d97706"/><path d="M20 16 L32 10 L44 16 L32 22 Z" fill="#142d47"/></svg>`,
  );
}

function duoTopbarHTML(I, step) {
  const pct = Math.round(((step + 1) / 5) * 100);
  return html`<div class="duo-topbar" role="region" aria-label="${I.S("Lesson progress", "Progreso de la lección")}">
    <div class="duo-progress-track" aria-hidden="true">
      <div class="duo-progress-fill" style="width:${pct}%">
        <span class="duo-progress-shine"></span>
      </div>
    </div>
    <span class="duo-step-pill">
      ${icon("sparkle")} ${I.T(`Exercise ${step + 1} of 5`, `Ejercicio ${step + 1} de 5`)}
    </span>
    <span class="duo-shield-pill">
      ${icon("check")} ${I.T("Untimed · Keep trying", "Sin tiempo · Sigue intentando")}
    </span>
  </div>`;
}

function characterBubbleHTML(I, { promptEn, promptEs, audioText, words = [] }) {
  return html`<div class="duo-character-stage">
    <div class="duo-avatar-wrap">${mascotSVG()}</div>
    <div class="duo-speech-bubble">
      <p class="duo-bubble-lead">${I.T(promptEn, promptEs)}</p>
      ${
        audioText
          ? html`<div class="duo-audio-row">
              ${hearBtn(I, audioText, I.T("Normal speed", "Velocidad normal"))}
              ${hearSlowBtn(I, audioText, I.T("Slow (0.72x)", "Lento (0.72x)"))}
            </div>`
          : ""
      }
      ${
        words.length
          ? html`<div class="duo-dotted-strip" aria-label="${I.S("Tap a word for its meaning", "Toca una palabra para ver su significado")}">
              <span class="fine">${I.T("Tap a word:", "Toca una palabra:")}</span>
              ${words.map(
                (w) =>
                  html`<details class="duo-word-pop">
                    <summary class="duo-dotted-word" lang="en">${w.word}</summary>
                    <div class="duo-pop-card">
                      <p><strong lang="en">${w.word}</strong> · <span lang="es">${w.es}</span></p>
                      <p class="fine">${w.def}</p>
                    </div>
                  </details>`,
              )}
            </div>`
          : ""
      }
    </div>
  </div>`;
}

/**
 * Step 0: Duolingo 2-Column Tap-the-Pairs Board + synced <select> slots.
 * Tapping a word on the left selects it; tapping a meaning card on the right links that pair!
 */
function pairsHTML(I, set, st) {
  const picks = st.answers?.pairs || {};
  const res = st.checked?.pairs;
  const defs = seededOrder(set.pairs, `${set.id}:pairs`);
  const activeWord = st.activeWord || set.pairs.find((p) => !picks[p.id])?.id || set.pairs[0].id;
  const matchedCount = set.pairs.filter((p) => Boolean(picks[p.id])).length;

  return html`${duoTopbarHTML(I, 0)}
    ${characterBubbleHTML(I, {
      promptEn: "Tap the matching pairs! Tap an English word on the left, then tap its meaning on the right.",
      promptEs: "¡Une los pares! Toca una palabra en inglés a la izquierda y luego toca su significado a la derecha.",
      words: set.pairs,
    })}

    <div class="duo-match-board" role="region" aria-label="${I.S("Tap the matching pairs", "Une los pares")}">
      <div class="duo-match-col">
        <p class="duo-col-label">${I.T("1. Tap a school word", "1. Toca una palabra escolar")}</p>
        ${set.pairs.map((p) => {
          const isSelected = activeWord === p.id && !res?.ok;
          const pickedDefId = picks[p.id];
          const slotOk = res ? res.slots?.[p.id] : Boolean(pickedDefId);
          return html`<div class="duo-pair-card-wrap">
            <button
              type="button"
              class="duo-tile3d duo-word-tile ${isSelected ? "is-selected" : ""} ${pickedDefId ? (res ? (slotOk ? "is-right" : "is-wrong") : "is-paired") : ""}"
              data-prep-act="duo-select-word"
              data-word-id="${p.id}"
              aria-pressed="${String(isSelected)}"
              ${res?.ok ? raw("disabled") : ""}
            >
              <span class="duo-tile-main" lang="en">${p.word}</span>
              <span class="duo-tile-sub" lang="es">${p.es}</span>
              ${pickedDefId ? html`<span class="duo-pair-tag">${icon("check")}</span>` : ""}
            </button>
            ${hearBtn(I, p.word, I.T("Hear", "Oír"))}
          </div>`;
        })}
      </div>

      <div class="duo-match-col">
        <p class="duo-col-label">
          ${I.T(
            `2. Tap the meaning for "${activeWord}"`,
            `2. Toca el significado de "${activeWord}"`,
          )}
        </p>
        ${defs.map((d) => {
          const pairedWordId = Object.keys(picks).find((k) => picks[k] === d.id);
          const pairedWord = set.pairs.find((p) => p.id === pairedWordId);
          const slotOk = pairedWordId && res ? res.slots?.[pairedWordId] : false;
          return html`<button
            type="button"
            class="duo-tile3d duo-def-tile ${pairedWordId ? (res ? (slotOk ? "is-right" : "is-wrong") : "is-paired") : ""}"
            data-prep-act="duo-pair-def"
            data-def-id="${d.id}"
            ${res?.ok ? raw("disabled") : ""}
          >
            <span class="duo-def-text">${d.def}</span>
            ${
              pairedWord
                ? html`<span class="duo-paired-pill" lang="en">
                    ${icon("check")} ${pairedWord.word}
                  </span>`
                : ""
            }
          </button>`;
        })}
      </div>
    </div>

    <p class="fine">
      ${I.T(
        `Matched ${matchedCount} of ${set.pairs.length} pairs. You can also choose or change any match below:`,
        `${matchedCount} de ${set.pairs.length} pares unidos. También puedes elegir o cambiar cualquier unión abajo:`,
      )}
    </p>

    <div class="prep-rank">
      ${set.pairs.map((p) => {
        const ok = res?.slots?.[p.id];
        return html`<label class="prep-slot ${res ? (ok ? "is-right" : "is-wrong") : ""}">
          <span class="prep-slot-label">
            ${res ? icon(ok ? "check" : "x") : ""} <strong lang="en">${p.word}</strong>
            <span class="prep-es" lang="es">(${p.es})</span>
          </span>
          <select
            data-prep-blank="pairs:${p.id}"
            ${res?.ok ? raw("disabled") : ""}
            data-nsr-ignore
          >
            <option value="">${I.T("Choose meaning…", "Elige el significado…")}</option>
            ${defs.map(
              (d) =>
                html`<option value="${d.id}" ${picks[p.id] === d.id ? raw("selected") : ""}>
                  ${d.def}
                </option>`,
            )}
          </select>
        </label>`;
      })}
    </div>

    <div class="duo-bottom-bar">
      ${
        res?.ok
          ? ""
          : checkBtn(
              I,
              "check-pairs",
              set.pairs.every((p) => picks[p.id]),
              I.T("Check my matches", "Revisar mis uniones"),
            )
      }
      ${
        res
          ? resultHTML(I, {
              ok: res.ok,
              lead: res.ok
                ? I.T(
                    "Awesome! All four school words matched. Continue to the listening builder.",
                    "¡Excelente! Las cuatro palabras escolares coinciden. Continúa al ejercicio de escucha.",
                  )
                : I.T(
                    `${res.right} of ${res.total} matched. Tap a red word on the left and pick its true meaning.`,
                    `${res.right} de ${res.total} coinciden. Toca una palabra marcada y elige su significado correcto.`,
                  ),
            })
          : ""
      }
    </div>`;
}

/**
 * Interactive 3D Word-Bank Tile Tray that lets learners tap tiles to fill blanks in order,
 * or tap a filled chip to clear it.
 */
function wordBankTrayHTML(I, { bankKey, parts, picks = {}, locked = false, seed }) {
  const blankIndices = parts
    .map((p, idx) => (typeof p === "object" ? idx : -1))
    .filter((idx) => idx >= 0);
  const allOptions = blankIndices.flatMap((bIdx) =>
    parts[bIdx].options.map((opt) => ({ bIdx, text: opt })),
  );
  const shuffled = seededOrder(allOptions, seed);
  const nextOpenBlank = blankIndices.find((bIdx) => !picks[bIdx]) ?? blankIndices[0];

  return html`<div class="duo-wordbank-wrap" role="region" aria-label="${I.S("Word bank tiles", "Fichas del banco de palabras")}">
    <div class="duo-lined-tray">
      <span class="duo-tray-label">${I.T("Your selected tiles:", "Tus fichas elegidas:")}</span>
      <div class="duo-placed-row">
        ${blankIndices.map((bIdx, orderNum) => {
          const val = picks[bIdx];
          return val
            ? html`<button
                type="button"
                class="duo-tile3d is-placed"
                data-prep-act="duo-clear-slot"
                data-bank-key="${bankKey}"
                data-slot-idx="${bIdx}"
                ${locked ? raw("disabled") : ""}
                title="${I.S("Tap to remove", "Toca para quitar")}"
              >
                <span class="duo-slot-badge">${orderNum + 1}</span>
                <span lang="en">${val}</span>
                <span aria-hidden="true">×</span>
              </button>`
            : html`<span class="duo-empty-slot ${nextOpenBlank === bIdx ? "is-target" : ""}">
                ${I.T(`Blank ${orderNum + 1}`, `Espacio ${orderNum + 1}`)}
              </span>`;
        })}
      </div>
    </div>

    <div class="duo-bank-grid">
      ${shuffled.map((item) => {
        const isUsed = picks[item.bIdx] === item.text;
        return html`<button
          type="button"
          class="duo-tile3d ${isUsed ? "is-used-tile" : ""}"
          data-prep-act="duo-pick-tile"
          data-bank-key="${bankKey}"
          data-slot-idx="${item.bIdx}"
          data-tile-val="${item.text}"
          ${locked || isUsed ? raw("disabled") : ""}
        >
          <span lang="en">${item.text}</span>
        </button>`;
      })}
    </div>
  </div>`;
}

function listenBuildHTML(I, set, st) {
  const lb = set.listenBuild;
  const picks = st.answers?.listen || {};
  const res = st.checked?.listen;
  const reveal = st.reveal?.listen;
  const done = res?.ok || reveal;

  return html`${duoTopbarHTML(I, 1)}
    ${characterBubbleHTML(I, {
      promptEn: "Tap what you hear! Listen at normal or slow speed, then tap the word tiles in order.",
      promptEs: "¡Toca lo que escuchas! Escucha a velocidad normal o lenta y luego toca las fichas en orden.",
      audioText: lb.sentence,
      words: set.pairs,
    })}

    <div class="prep-listen-box">
      <p class="prep-es" lang="es">
        ${icon("language")} <strong>${I.T("Meaning bridge:", "Puente en español:")}</strong> ${lb.es}
      </p>
    </div>

    ${
      reveal
        ? ""
        : html`${wordBankTrayHTML(I, {
            bankKey: "listen",
            parts: lb.parts,
            picks,
            locked: Boolean(done),
            seed: `${set.id}:listen`,
          })}
          ${blanksHTML(I, {
            key: "listen",
            parts: lb.parts,
            picks,
            result: res,
          })}`
    }

    <div class="duo-bottom-bar">
      ${
        done
          ? ""
          : checkBtn(
              I,
              "check-listen",
              lb.parts.every((p, i) => typeof p === "string" || picks[i]),
              I.T("Check my sentence", "Revisar mi oración"),
            )
      }
      ${
        done
          ? html`${resultHTML(I, {
                ok: Boolean(res?.ok),
                lead: I.T(
                  "Nicely done! You assembled the spoken academic sentence.",
                  "¡Muy bien! Armaste la oración académica hablada.",
                ),
                action: hearPairHTML(I, lb.sentence),
              })}
              <p class="prep-model" lang="en">${lb.sentence}</p>`
          : res
            ? resultHTML(I, {
                ok: false,
                lead: I.T(
                  `${res.right} of ${res.total} parts match what was spoken. Tap Slow (0.72x) and listen closely.`,
                  `${res.right} de ${res.total} partes coinciden con el audio. Toca Lento (0.72x) y escucha con atención.`,
                ),
                action:
                  (st.tries?.listen || 0) >= 2
                    ? html`<button type="button" class="btn small" data-prep-act="reveal-listen">
                        ${I.T("Show the sentence", "Mostrar la oración")}
                      </button>`
                    : "",
              })
            : ""
      }
    </div>`;
}

function clozeHTML(I, set, st) {
  const cz = set.cloze;
  const picks = st.answers?.cloze || {};
  const res = st.checked?.cloze;

  return html`${duoTopbarHTML(I, 2)}
    ${characterBubbleHTML(I, {
      promptEn: "Fill in the missing academic words! Tap a word tile or select from the passage blanks.",
      promptEs: "¡Completa las palabras académicas que faltan! Toca una ficha o elige en los espacios del texto.",
      words: set.pairs,
    })}

    <h3 class="prep-sub">${I.T(cz.title, cz.titleEs || cz.title)}</h3>
    ${
      cz.hints?.length
        ? html`<div class="prep-hint-strip" role="region" aria-label="${I.S("Word hints", "Pistas de palabras")}">
            ${cz.hints.map(
              (h) =>
                html`<div class="prep-hint-pill">
                  <strong lang="en">${h.word}</strong>
                  <span class="prep-es" lang="es">(${h.es})</span>: ${h.tip}
                </div>`,
            )}
          </div>`
        : ""
    }

    ${wordBankTrayHTML(I, {
      bankKey: "cloze",
      parts: cz.parts,
      picks,
      locked: Boolean(res?.ok),
      seed: `${set.id}:cloze`,
    })}

    <div class="prep-passage">
      ${blanksHTML(I, { key: "cloze", parts: cz.parts, picks, result: res })}
    </div>

    <div class="duo-bottom-bar">
      ${
        res?.ok
          ? ""
          : checkBtn(
              I,
              "check-cloze",
              cz.parts.every((p, i) => typeof p === "string" || picks[i]),
              I.T("Check my passage", "Revisar mi texto"),
            )
      }
      ${
        res
          ? resultHTML(I, {
              ok: res.ok,
              lead: res.ok
                ? I.T(
                    "Great reading! Every word fits the meaning and structure of the passage.",
                    "¡Gran lectura! Cada palabra encaja con el significado y la estructura del texto.",
                  )
                : I.T(
                    `${res.right} of ${res.total} blanks are right. Check how the sentences connect around each blank.`,
                    `${res.right} de ${res.total} espacios están bien. Revisa cómo se conectan las oraciones alrededor de cada espacio.`,
                  ),
            })
          : ""
      }
    </div>`;
}

function forgeHTML(I, set, st) {
  const fg = set.forge;
  const picks = st.answers?.forge || {};
  const res = st.checked?.forge;
  const reveal = st.reveal?.forge;
  const done = res?.ok || reveal;

  return html`${duoTopbarHTML(I, 3)}
    ${characterBubbleHTML(I, {
      promptEn: fg.goal,
      promptEs: fg.goalEs || fg.goal,
      audioText: fg.starter,
      words: set.pairs,
    })}

    <div class="prep-answer is-weak">
      <p class="prep-answer-h">
        <strong>${I.T("Starter sentence (everyday)", "Oración inicial (cotidiana)")}</strong>
        ${hearBtn(I, fg.starter)}
      </p>
      <p lang="en">${fg.starter}</p>
    </div>

    <h3 class="prep-sub">
      ${I.T("Tap the strongest academic clauses to forge the upgraded sentence", "Toca las cláusulas académicas más sólidas para forjar la oración mejorada")}
    </h3>

    ${
      reveal
        ? ""
        : html`${wordBankTrayHTML(I, {
            bankKey: "forge",
            parts: fg.parts,
            picks,
            locked: Boolean(done),
            seed: `${set.id}:forge`,
          })}
          ${blanksHTML(I, { key: "forge", parts: fg.parts, picks, result: res })}`
    }

    <div class="duo-bottom-bar">
      ${
        done
          ? ""
          : checkBtn(
              I,
              "check-forge",
              fg.parts.every((p, i) => typeof p === "string" || picks[i]),
              I.T("Check my upgrade", "Revisar mi mejora"),
            )
      }
      ${
        done
          ? html`${resultHTML(I, {
                ok: Boolean(res?.ok),
                lead: I.T(
                  "Here is the upgraded academic sentence.",
                  "Esta es la oración académica mejorada.",
                ),
                action: hearPairHTML(I, fg.model),
              })}
              <p class="prep-model" lang="en">${fg.model}</p>
              <p class="prep-dim-row">
                ${I.T("Dimensions strengthened:", "Dimensiones fortalecidas:")}
                ${(fg.dims || ["discourse", "sentence", "word"]).map(
                  (d) =>
                    html`<span class="prep-dim-tag is-${d}">
                      ${I.T(DIMENSIONS[d][0], DIMENSIONS[d][1])}
                    </span>`,
                )}
              </p>`
          : res
            ? resultHTML(I, {
                ok: false,
                lead: I.T(
                  `${res.right} of ${res.total} parts use the strongest academic phrasing. Pick the more precise words and connector.`,
                  `${res.right} de ${res.total} partes usan la expresión académica más sólida. Elige las palabras y el conector más precisos.`,
                ),
                action:
                  (st.tries?.forge || 0) >= 2
                    ? html`<button type="button" class="btn small" data-prep-act="reveal-forge">
                        ${I.T("Show the upgrade", "Mostrar la mejora")}
                      </button>`
                    : "",
              })
            : ""
      }
    </div>`;
}

function reviewHTML(I, set, st) {
  const retried = Object.entries(st.tries || {})
    .filter(([, count]) => count > 1)
    .map(([k]) => k);
  return html`${duoTopbarHTML(I, 4)}
    <div class="duo-celebration-card" role="status">
      <div class="duo-celebration-head">
        <span class="duo-trophy-badge" aria-hidden="true">${icon("medal")}</span>
        <div>
          <p class="fb-title">
            ${icon("check")} ${I.T("Lesson Complete! · 5 of 5 Steps Finished", "¡Lección completada! · 5 de 5 pasos terminados")}
          </p>
          <p class="fb-lead">
            ${I.T(
              "You matched academic vocabulary, assembled a spoken sentence, solved context clues, and forged a high-precision school sentence.",
              "Uniste vocabulario académico, armaste una oración hablada, resolviste pistas de contexto y forjaste una oración escolar precisa.",
            )}
          </p>
        </div>
      </div>
      <div class="duo-stat-chips">
        <span class="cat-chip">${icon("check")} ${I.T("4 Academic Words Mastered", "4 palabras académicas dominadas")}</span>
        <span class="cat-chip">${icon("sparkle")} ${I.T(`Key Language Use: ${set.kind}`, `Uso clave del lenguaje: ${set.kind}`)}</span>
        <span class="cat-chip">${icon("reading")} ${set.area}</span>
      </div>
    </div>

    <h3 class="prep-sub">
      ${I.T("Key academic language from this set", "Lenguaje académico clave de este conjunto")}
    </h3>
    <ul class="prep-review">
      ${set.pairs.map(
        (p) =>
          html`<li>
            <strong lang="en">${p.word}</strong>
            <span class="prep-es" lang="es">(${p.es})</span>: ${p.def}
            ${hearPairHTML(I, p.word)}
          </li>`,
      )}
    </ul>
    <div class="prep-answer is-best">
      <p class="prep-answer-h">
        <strong>${I.T("Model academic sentence", "Oración académica modelo")}</strong>
        ${hearPairHTML(I, set.forge.model)}
      </p>
      <p class="prep-model" lang="en">${set.forge.model}</p>
    </div>
    ${
      retried.length
        ? html`<p class="fine">
            ${icon("retry")}
            ${I.T(
              "You persisted through tricky steps and got every part right. Come back tomorrow to keep these words strong.",
              "Perseveraste en los pasos difíciles y lograste cada parte. Vuelve mañana para mantener fuertes estas palabras.",
            )}
          </p>`
        : ""
    }
    ${familyTeacherHTML(I, set)}
    <p>
      <button type="button" class="btn" data-prep-act="restart">
        ${icon("replay")} ${I.T("Practice this set again", "Practicar este conjunto otra vez")}
      </button>
    </p>`;
}

export function body(I, set, st, step) {
  if (step === 0) return pairsHTML(I, set, st);
  if (step === 1) return listenBuildHTML(I, set, st);
  if (step === 2) return clozeHTML(I, set, st);
  if (step === 3) return forgeHTML(I, set, st);
  return reviewHTML(I, set, st);
}

export function ready(set, st, step) {
  if (step === 0) return Boolean(st.checked?.pairs?.ok);
  if (step === 1) return Boolean(st.checked?.listen?.ok || st.reveal?.listen);
  if (step === 2) return Boolean(st.checked?.cloze?.ok);
  if (step === 3) return Boolean(st.checked?.forge?.ok || st.reveal?.forge);
  return true;
}

export function notReady(I, set, st, step) {
  if (step === 0)
    return I.S("Match all four words first.", "Primero une las cuatro palabras.");
  if (step === 1)
    return I.S("Check the spoken sentence first.", "Primero revisa la oración hablada.");
  if (step === 2)
    return I.S("Complete and check the passage first.", "Primero completa y revisa el texto.");
  if (step === 3)
    return I.S("Check your upgraded sentence first.", "Primero revisa tu oración mejorada.");
  return "";
}

export function act(name, el, set, st, I) {
  st.checked ||= {};
  st.tries ||= {};
  st.answers ||= {};

  // Duolingo Tap-the-Pairs interactive handlers
  if (name === "duo-select-word") {
    const wordId = el.dataset.wordId;
    if (wordId) {
      st.activeWord = wordId;
      delete st.checked.pairs;
    }
    return { focus: `[data-word-id="${wordId}"]` };
  }
  if (name === "duo-pair-def") {
    const defId = el.dataset.defId;
    const activeWord =
      st.activeWord || set.pairs.find((p) => !st.answers.pairs?.[p.id])?.id || set.pairs[0].id;
    if (activeWord && defId) {
      st.answers.pairs = { ...(st.answers.pairs || {}), [activeWord]: defId };
      delete st.checked.pairs;
      const nextUnmatched = set.pairs.find((p) => !st.answers.pairs[p.id]);
      if (nextUnmatched) st.activeWord = nextUnmatched.id;
      else if (set.pairs.every((p) => st.answers.pairs[p.id])) {
        st.tries.pairs = (st.tries.pairs || 0) + 1;
        st.checked.pairs = checkPairs(set.pairs, st.answers.pairs);
      }
    }
    return { focus: st.checked.pairs ? ".prep-step .feedback" : `[data-def-id="${defId}"]` };
  }

  // Duolingo 3D Word-Bank Tile handlers
  if (name === "duo-pick-tile") {
    const bankKey = el.dataset.bankKey;
    const slotIdx = el.dataset.slotIdx;
    const val = el.dataset.tileVal;
    if (bankKey && slotIdx !== undefined && val) {
      st.answers[bankKey] = { ...(st.answers[bankKey] || {}), [slotIdx]: val };
      delete st.checked[bankKey];
      if (I) announce(I.S(`Placed ${val}.`, `Ficha colocada: ${val}.`));
    }
    return { focus: `[data-prep-blank="${bankKey}:${slotIdx}"]` };
  }
  if (name === "duo-clear-slot") {
    const bankKey = el.dataset.bankKey;
    const slotIdx = el.dataset.slotIdx;
    if (bankKey && slotIdx !== undefined && st.answers[bankKey]) {
      const next = { ...st.answers[bankKey] };
      delete next[slotIdx];
      st.answers[bankKey] = next;
      delete st.checked[bankKey];
    }
    return { focus: `[data-prep-blank="${bankKey}:${slotIdx}"]` };
  }

  if (name === "check-pairs") {
    st.tries.pairs = (st.tries.pairs || 0) + 1;
    st.checked.pairs = checkPairs(set.pairs, st.answers?.pairs);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-listen") {
    st.tries.listen = (st.tries.listen || 0) + 1;
    st.checked.listen = checkBuild(set.listenBuild.parts, st.answers?.listen);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-listen") {
    st.reveal = { ...(st.reveal || {}), listen: true };
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-cloze") {
    st.tries.cloze = (st.tries.cloze || 0) + 1;
    st.checked.cloze = checkBuild(set.cloze.parts, st.answers?.cloze);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "check-forge") {
    st.tries.forge = (st.tries.forge || 0) + 1;
    st.checked.forge = checkBuild(set.forge.parts, st.answers?.forge);
    return { focus: ".prep-step .feedback" };
  }
  if (name === "reveal-forge") {
    st.reveal = { ...(st.reveal || {}), forge: true };
    return { focus: ".prep-step .feedback" };
  }
  return false;
}
