// Language Labs (/language-labs, /language-labs/<lab>?step=1..5): Verb Time Machine, Connector Bridge and Paragraph
// X-Ray on one five-step path (See it → Explore → Example → Practice → New task), plus the publisher-edition hub
// for Grades 3–5 (Language Explorers Studio) and Grades 6–8 (Academic Discourse & Craft Lab) that also links the
// three scaffold builders. Content: src/content/language-labs.js; checks: src/lang/labs-check.js. Every practice
// check and transfer check is a ledger entry (src "labs"): independent unless a hint was opened, first vs revision,
// so the evidence reaches My Growth like the other studios. No timers, no scores.
import { openInBookStudio } from "../book/handoff.js";
import { crumbsHTML } from "../components.js";
import * as C from "../content/language-labs.js";
import { i18nFor } from "../i18n.js";
import * as K from "../lang/labs-check.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { speak } from "../speech.js";
import { BASE, announce, html, icon, raw, safeJson, storage, wordCount } from "../util.js";

const KEY = "accessPracticeLab:v1:language-labs";
const STEPS = [
  ["See it", "Míralo"],
  ["Explore", "Explora"],
  ["Example", "Ejemplo"],
  ["Practice", "Practica"],
  ["New task", "Tarea nueva"],
];
const bandOf = (b) => (b === "3-5" ? "3-5" : "6-8");
const load = () => safeJson(storage.get(KEY), {}) || {};
const save = (st) => storage.set(KEY, JSON.stringify(st));
const labState = (st, lab, band) => {
  st[lab] ||= {};
  st[lab][band] ||= {
    seen: [],
    practice: {},
    transfer: { text: "", ok: false, checks: 0, hint: false, topic: 0 },
    explore: {},
    guided: 0,
  };
  return st[lab][band];
};
let ui = { lab: "", labels: {}, order: null, xray: true, inspect: 0, dimFilter: "all" };

function record(ctx, { lab, task, ok, kind, supported, use, extra = {} }) {
  const ledger = loadLedger();
  appendEntry(ledger, {
    src: "labs",
    task,
    band: bandOf(ctx.band),
    domain: "Writing",
    use,
    stage: supported ? "supported" : "independent",
    kind,
    supports: { hint: !!supported },
    m: { ok: ok ? 1 : 0, lab, ...extra },
  });
  saveLedger(ledger);
}

const usePill = (I, useKey) => {
  const u = C.KEY_USES[useKey];
  if (!u) return "";
  return html`<span class="ll-use is-${u.tone}">${I.T(u.en, u.es)}</span>`;
};

const dimPill = (I, dimKey) => {
  const d = C.DIMENSIONS[dimKey];
  if (!d) return "";
  return html`<span class="ll-dim">${I.T(d.en, d.es)}</span>`;
};

const speakBtn = (I, text, labelEn = "Listen", labelEs = "Escuchar") =>
  html`<button
    type="button"
    class="btn small ghost ll-speak-btn"
    data-ll-speak="${text}"
    aria-label="${I.S(labelEn, labelEs)}"
  >
    ${icon("volume")} <span>${I.T(labelEn, labelEs)}</span>
  </button>`;

// ── shared pieces ────────────────────────────────────────────────────────────
function stepperHTML(I, lab, step, ls, band) {
  const p = C.programForLab(band);
  const stage = p.stages[step - 1] || p.stages[0];
  return html`<nav class="ll-steps" aria-label="${I.S("Lab steps", "Pasos del laboratorio")}">
    <ol>
      ${STEPS.map(
        ([en, es], i) =>
          html`<li>
            <a
              href="${BASE}/language-labs/${lab}?step=${i + 1}&grades=${band}"
              ${i + 1 === step ? raw('aria-current="step"') : ""}
              class="${ls.seen.includes(i + 1) ? "is-seen" : ""}"
              ><span class="ll-step-n"
                >${ls.seen.includes(i + 1) && i + 1 !== step ? icon("check") : i + 1}</span
              >${I.T(en, es)}</a
            >
          </li>`,
      )}
    </ol>
    <p class="ll-step-goal">
      <strong>${I.T(`Step ${step} of 5 · ${STEPS[step - 1][0]}:`, `Paso ${step} de 5 · ${STEPS[step - 1][1]}:`)}</strong>
      ${I.T(...stage.do)}
    </p>
  </nav>`;
}

const nextLink = (I, lab, step, band) =>
  step < 5
    ? html`<div class="ll-next-bar">
        <p class="ll-next-meta">
          ${I.T(
            `Ready for Step ${step + 1}? Move to ${STEPS[step][0]}.`,
            `¿Listo para el Paso ${step + 1}? Pasa a ${STEPS[step][1]}.`,
          )}
        </p>
        <p class="ll-next">
          <a
            class="btn btn-primary"
            href="${BASE}/language-labs/${lab}?step=${step + 1}&grades=${band}"
            >${I.T(`Next: ${STEPS[step][0]}`, `Siguiente: ${STEPS[step][1]}`)}
            ${icon("arrow-right")}</a
          >
        </p>
      </div>`
    : "";

const feedbackHTML = (I, r) =>
  r
    ? html`<div
        class="feedback ${r.ok ? "is-right" : r.reveal ? "is-shown" : "is-hint"}"
        role="status"
      >
        <p class="fb-title">${icon(r.ok ? "check" : "bulb")} ${I.T(r.message.en, r.message.es)}</p>
      </div>`
    : "";

function compareCardHTML(I, cmp) {
  if (!cmp) return "";
  return html`<div class="ll-compare-grid">
    <div class="ll-compare-card is-before">
      <span class="ll-compare-tag">${I.T("Everyday draft (before)", "Borrador cotidiano (antes)")}</span>
      <p class="ll-compare-text" lang="en">${cmp.before}</p>
    </div>
    <div class="ll-compare-card is-after">
      <div class="ll-compare-head">
        <span class="ll-compare-tag">${I.T("Author's move (after)", "Jugada del autor (después)")}</span>
        ${speakBtn(I, cmp.after, "Listen", "Escuchar")}
      </div>
      <p class="ll-compare-text" lang="en">${cmp.after}</p>
      <p class="fine">${I.T(...cmp.why)}</p>
    </div>
  </div>`;
}

function guidedHTML(I, ls, steps, sentence, rule) {
  const shown = Math.max(1, ls.guided || 1);
  const doneAll = shown >= steps.length;
  return html`<section class="panel ll-guided" aria-labelledby="llGuidedH">
    <div class="ll-panel-top">
      <div>
        <p class="eyebrow">${I.T(`Writer's Think-Aloud · Step ${Math.min(shown, steps.length)} of ${steps.length}`, `Pensamiento en voz alta · Paso ${Math.min(shown, steps.length)} de ${steps.length}`)}</p>
        <h2 id="llGuidedH">${I.T("Watch it done, one step at a time", "Míralo paso a paso")}</h2>
      </div>
      ${sentence ? speakBtn(I, sentence.replace(/___/g, "blank"), "Listen to example", "Escuchar ejemplo") : ""}
    </div>
    ${sentence ? html`<p class="ll-sentence" lang="en">${sentence}</p>` : ""}
    <ol class="ll-guided-steps">
      ${steps.slice(0, shown).map(([en, es], i) => html`<li class="${i === steps.length - 1 ? "is-final" : ""}">${I.T(en, es)}</li>`)}
    </ol>
    <div class="row-actions">
      ${shown < steps.length ? html`<button type="button" class="btn btn-primary" data-ll-guided>${I.T("Show the next step", "Mostrar el siguiente paso")} ${icon("arrow-right")}</button>` : ""}
      ${shown > 1 ? html`<button type="button" class="btn ghost small" data-ll-guided-reset>${icon("replay")} ${I.T("Replay steps", "Repetir pasos")}</button>` : ""}
    </div>
    ${
      doneAll && rule
        ? html`<div class="ll-rule-callout">
            <p>${icon("bulb")} <strong>${I.T(...rule)}</strong></p>
          </div>`
        : ""
    }
  </section>`;
}

function transferHTML(I, ls, prompt, result, extra = "", { lab, band } = {}) {
  const words = wordCount(ls.transfer.text || "");
  const topics = prompt.topics || [];
  const wordBank = prompt.wordBank || [];
  const chosenTopic = ls.transfer.topic || 0;
  return html`<section class="panel ll-transfer" aria-labelledby="llTrH">
    <div class="ll-panel-top">
      <div>
        <p class="eyebrow">
          ${icon("flag")}
          ${I.T("Your own words, on a new task", "Tus propias palabras, en una tarea nueva")}
        </p>
        <h2 id="llTrH">${I.T("New task", "Tarea nueva")}</h2>
      </div>
      ${speakBtn(I, prompt.en, "Listen to prompt", "Escuchar consigna")}
    </div>
    <p class="ll-transfer-prompt">${I.T(prompt.en, prompt.es)}</p>
    ${
      topics.length
        ? html`<div class="ll-topic-strip" role="group" aria-label="${I.S("Topic ideas", "Ideas de tema")}">
            <span class="ll-strip-label">${I.T("Pick an angle:", "Elige un enfoque:")}</span>
            ${topics.map(
              (tp, idx) =>
                html`<button
                  type="button"
                  class="chip ${chosenTopic === idx ? "is-on" : ""}"
                  data-ll-topic="${idx}"
                  aria-pressed="${chosenTopic === idx}"
                >
                  ${I.T(...tp)}
                </button>`,
            )}
          </div>`
        : ""
    }
    ${
      wordBank.length
        ? html`<div class="ll-wordbank" role="group" aria-label="${I.S("Word bank", "Banco de palabras")}">
            <span class="ll-strip-label">${I.T("Tap to insert a starter word:", "Toca para insertar una palabra:")}</span>
            ${wordBank.map(
              (w) =>
                html`<button type="button" class="chip ll-insert-chip" data-ll-insert="${w}" lang="en">
                  + ${w}
                </button>`,
            )}
          </div>`
        : ""
    }
    ${extra}
    <label class="field"
      ><span class="ll-field-bar"
        ><span>${I.T("My writing", "Mi escritura")}</span>
        <span class="fine">${I.T(`${words} words`, `${words} palabras`)}</span></span
      ><textarea
        rows="6"
        data-ll-transfer
        data-nsr-ignore
        placeholder="${I.S("Write your sentences here…", "Escribe tus oraciones aquí…")}"
      >${ls.transfer.text}</textarea>
    </label>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-ll-check-transfer>
        ${icon("check")} ${I.T("Check my writing", "Revisar mi escritura")}
      </button>
      ${ls.transfer.hint ? "" : html`<button type="button" class="btn ghost" data-ll-transfer-hint>${icon("bulb")} ${I.T("I want a hint", "Quiero una pista")}</button>`}
      <button type="button" class="btn ghost" data-ll-speak-transfer>
        ${icon("volume")} ${I.T("Listen to my writing", "Escuchar mi escritura")}
      </button>
      <button
        type="button"
        class="btn ghost"
        data-ll-to-book="${lab || ""}"
        data-band="${band || "6-8"}"
      >
        ${icon("library")} ${I.T("Turn into a Book Studio page", "Convertir en página de Book Studio")}
      </button>
    </div>
    ${result}
  </section>`;
}

// ── Verb Time Machine ────────────────────────────────────────────────────────
const plural = (subject) =>
  /^(we|they|you|i)$/i.test(subject) ||
  (/s$/.test(subject.split(" ").at(-1)) && !/^(maya|leo|ana)$/i.test(subject));
export function composeVerb(subject, base, tense) {
  const f = K.verbForms(base);
  const pl = plural(subject);
  const be = subject.toLowerCase() === "i" ? "am" : pl ? "are" : "is";
  return {
    past: f.ed,
    present: pl ? f.base : f.s,
    "present-progressive": `${be} ${f.ing}`,
    "past-progressive": `${pl ? "were" : "was"} ${f.ing}`,
    "present-perfect": `${pl ? "have" : "has"} ${f.part}`,
    "past-perfect": `had ${f.part}`,
    future: `will ${f.base}`,
  }[tense];
}

function timelineSVG(I, stops, at) {
  const w = 680;
  const xs = stops.map((_, i) => 64 + (i * (w - 128)) / Math.max(1, stops.length - 1));
  const nowIndex = stops.includes("present-progressive")
    ? stops.indexOf("present-progressive")
    : stops.indexOf("present");
  return raw(`<svg class="ll-timeline" viewBox="0 0 ${w} 132" role="img" aria-label="${I.S("Timeline from the past to the future", "Línea del tiempo del pasado al futuro")}">
    <defs>
      <linearGradient id="llTlGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#884326"/>
        <stop offset="55%" stop-color="#075568"/>
        <stop offset="100%" stop-color="#123a5c"/>
      </linearGradient>
    </defs>
    <rect x="8" y="8" width="${w - 16}" height="116" rx="16" fill="#fffcf5" stroke="#e2d9c8" stroke-width="1.5"/>
    <text x="28" y="28" font-size="11" font-weight="700" fill="#884326">${I.S("PAST (BEFORE NOW)", "PASADO (ANTES)")}</text>
    <text x="${w - 28}" y="28" text-anchor="end" font-size="11" font-weight="700" fill="#123a5c">${I.S("FUTURE (LATER)", "FUTURO (DESPUÉS)")}</text>
    <line x1="28" y1="66" x2="${w - 28}" y2="66" stroke="url(#llTlGrad)" stroke-width="5" stroke-linecap="round"/>
    <path d="M${w - 38} 56 L${w - 20} 66 L${w - 38} 76" fill="none" stroke="#123a5c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${nowIndex >= 0 ? `<rect x="${xs[nowIndex] - 28}" y="20" width="56" height="90" rx="12" fill="#fcefd3" stroke="#e2a72e" stroke-width="1.5"/><text x="${xs[nowIndex]}" y="36" text-anchor="middle" font-size="12" font-weight="700" fill="#5a3a00">${I.S("NOW", "AHORA")}</text>` : ""}
    ${stops
      .map(
        (s, i) =>
          `<g><circle cx="${xs[i]}" cy="66" r="${i === at ? 15 : 9}" fill="${i === at ? "#9a4a26" : "#075568"}" stroke="#fff" stroke-width="3"/><text x="${xs[i]}" y="104" text-anchor="middle" font-size="12" font-weight="${i === at ? "700" : "400"}" fill="#0d1c2e">${C.STOP_SHORT[s][I.mode === "es" ? 1 : 0]}</text></g>`,
      )
      .join("")}
  </svg>`);
}

function verbLab(ctx, I, step, ls, band) {
  const stops = C.VERB_STOPS[band];
  if (step === 1) {
    const mentor = C.VERB_MENTOR[band];
    const cmp = C.VERB_COMPARE[band];
    return html`<section class="panel ll-see">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 1 · Notice the Pattern", "Paso 1 · Observa el patrón")}</p>
          <h2>${I.T("Every action happens at a time", "Cada acción pasa en un momento")}</h2>
        </div>
      </div>
      <p>
        ${I.T("English shows WHEN an action happens by changing the verb. A time word (yesterday, now, tomorrow) is your clue; the verb has to agree with it.", "El inglés muestra CUÁNDO pasa una acción cambiando el verbo. Una palabra de tiempo (yesterday, now, tomorrow) es tu pista; el verbo tiene que coincidir con ella.")}
      </p>
      ${timelineSVG(I, stops, stops.indexOf("present"))}
      <ul class="ll-forms">
        ${stops.map((s) => html`<li><b>${I.T(...K.TENSE_NAMES[s])}</b>: <span lang="en">${C.STOP_CUES[s][0]} Maya <b>${composeVerb("Maya", "walk", s)}</b> to school.</span></li>`)}
      </ul>
      <div class="ll-mentor-spotlight">
        <div class="ll-mentor-head">
          <span class="ll-mentor-source">${icon("reading")} ${I.T(...mentor.source)}</span>
          ${speakBtn(I, mentor.passage, "Listen to passage", "Escuchar pasaje")}
        </div>
        <blockquote class="ll-mentor-quote" lang="en">${mentor.passage}</blockquote>
        <p class="fine">${I.T(...mentor.takeaway)}</p>
      </div>
      ${compareCardHTML(I, cmp)}
    </section>`;
  }
  if (step === 2) {
    const ex = ls.explore;
    const v = C.VERB_EXPLORE[ex.verb ?? 0];
    const at = Math.min(ex.at ?? stops.indexOf("present"), stops.length - 1);
    const tense = stops[at];
    const built = composeVerb(v.subject, v.base, tense);
    const fullSentence = `${C.STOP_CUES[tense][0]} ${v.subject.replace(/^\w/, (c) => (C.STOP_CUES[tense][0].endsWith(",") ? c : c.toUpperCase()))} ${built} ${v.rest}.`;
    const anat = C.STOP_ANATOMY[tense];
    return html`<section class="panel ll-explore">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 2 · Interactive Timeline Workbench", "Paso 2 · Banco interactivo de la línea del tiempo")}</p>
          <h2>${I.T("Move the action through time", "Mueve la acción en el tiempo")}</h2>
        </div>
        ${speakBtn(I, fullSentence, "Listen to sentence", "Escuchar oración")}
      </div>
      <label class="field"
        ><span>${I.T("Choose an action", "Elige una acción")}</span
        ><select data-ll-verb data-nsr-ignore>
          ${C.VERB_EXPLORE.map((x, i) => html`<option value="${i}" ${i === (ex.verb ?? 0) ? raw("selected") : ""}>${x.subject} · ${x.base} (${x.rest})</option>`)}
        </select></label
      >
      ${timelineSVG(I, stops, at)}
      <div class="ll-stop-pills" role="group" aria-label="${I.S("Timeline stops", "Paradas de la línea del tiempo")}">
        ${stops.map(
          (s, i) =>
            html`<button
              type="button"
              class="chip ${i === at ? "is-on" : ""}"
              data-ll-stop="${i}"
              aria-pressed="${i === at}"
            >
              ${I.T(...C.STOP_SHORT[s])}
            </button>`,
        )}
      </div>
      <label class="field"
        ><span>${I.T("Slide along the timeline", "Desliza por la línea del tiempo")}</span
        ><input
          type="range"
          min="0"
          max="${stops.length - 1}"
          value="${at}"
          data-ll-slide
          data-nsr-ignore
          aria-valuetext="${I.S(...K.TENSE_NAMES[tense])}"
      /></label>
      <p class="ll-sentence" aria-live="polite" lang="en">
        ${C.STOP_CUES[tense][0]}
        ${v.subject.replace(/^\w/, (c) => (C.STOP_CUES[tense][0].endsWith(",") ? c : c.toUpperCase()))}
        <mark>${built}</mark> ${v.rest}.
      </p>
      <p class="fine">
        ${I.T(`This is the ${K.TENSE_NAMES[tense][0]}. Watch what changes in the verb, and what stays the same.`, `Esto es el ${K.TENSE_NAMES[tense][1]}. Observa qué cambia en el verbo y qué se queda igual.`)}
      </p>
      ${
        anat
          ? html`<div class="ll-anatomy" aria-label="${I.S("Verb anatomy", "Anatomía del verbo")}">
              <div class="ll-anatomy-grid">
                <div>
                  <span class="ll-anatomy-k">${I.T("Time clue", "Pista de tiempo")}</span>
                  <strong lang="en">${C.STOP_CUES[tense][0].replace(/,$/, "")}</strong>
                </div>
                <div>
                  <span class="ll-anatomy-k">${I.T("Tense", "Tiempo verbal")}</span>
                  <strong>${I.T(...K.TENSE_NAMES[tense])}</strong>
                </div>
                <div>
                  <span class="ll-anatomy-k">${I.T("How it's built", "Cómo se forma")}</span>
                  <strong>${I.T(...anat.formula)}</strong>
                </div>
                <div>
                  <span class="ll-anatomy-k">${I.T("Verb form", "Forma verbal")}</span>
                  <strong lang="en">${v.base} → ${built}</strong>
                </div>
              </div>
              <p class="ll-anatomy-when">${I.T(...anat.when)}</p>
            </div>`
          : ""
      }
    </section>`;
  }
  if (step === 3) {
    const g = C.VERB_GUIDED[band];
    return guidedHTML(I, ls, g.steps, g.sentence, g.rule);
  }
  if (step === 4) return verbPractice(ctx, I, ls, band);
  const r = ls.transfer.result;
  return transferHTML(
    I,
    ls,
    C.VERB_TRANSFER[band],
    r
      ? html`<div class="feedback ${r.ok ? "is-right" : "is-hint"}" role="status">
          <p class="fb-title">
            ${icon(r.ok ? "check" : "bulb")}
            ${r.ok ? I.T("Your writing moves through time: before, now and later, each with a time word.", "Tu escritura se mueve en el tiempo: antes, ahora y después, cada uno con una palabra de tiempo.") : I.T(r.next.en, r.next.es)}
          </p>
          <ul class="ll-shows">
            <li>
              ${r.shows.past ? "✅" : "⬜"}
              ${I.T("something that already happened", "algo que ya pasó")}
            </li>
            <li>
              ${r.shows.future ? "✅" : "⬜"}
              ${I.T("something that will happen", "algo que pasará")}
            </li>
            <li>
              ${r.cues.length ? "✅" : "⬜"} ${I.T("time words", "palabras de tiempo")}:
              ${r.cues.join(", ")}
            </li>
          </ul>
        </div>`
      : "",
    ls.transfer.hint
      ? html`<p class="ll-frame">
          ${I.T("Frames: Last week, I ___. Now, I am ___. Next week, I will ___.", "Marcos: Last week, I ___. Now, I am ___. Next week, I will ___.")}
        </p>`
      : "",
    { lab: "verb-time-machine", band },
  );
}

function verbPractice(ctx, I, ls, band) {
  const items = C.VERB_ITEMS.filter((x) => x.band === band);
  const solved = items.filter((it) => ls.practice[it.id]?.ok).length;
  const stops = C.VERB_STOPS[band];
  return html`<section class="panel ll-practice">
    <div class="ll-panel-top">
      <div>
        <p class="eyebrow">${I.T("Step 4 · Guided Coaching Practice", "Paso 4 · Práctica con pistas")}</p>
        <h2>${I.T("Make the verb match the time", "Haz que el verbo coincida con el tiempo")}</h2>
      </div>
      <span class="ll-score-pill" role="status">
        ${icon("check")} ${I.T(`${solved} of ${items.length} solved`, `${solved} de ${items.length} resueltas`)}
      </span>
    </div>
    <p class="fine">
      ${I.T("Type the verb form that fits. A wrong try gives you a clue, not the answer.", "Escribe la forma del verbo que encaja. Un intento equivocado te da una pista, no la respuesta.")}
    </p>
    <details class="ll-ref">
      <summary>${icon("bulb")} ${I.T("Open Verb Reference Chart (Time Clues & Forms)", "Abrir tabla de referencia de verbos (pistas y formas)")}</summary>
      <div class="ll-ref-grid">
        ${stops.map(
          (s) =>
            html`<div class="ll-ref-item">
              <strong>${I.T(...K.TENSE_NAMES[s])}</strong>
              <span>${I.T("Clue:", "Pista:")} <i lang="en">${C.STOP_CUES[s][0].replace(/,$/, "")}</i></span>
              <span>${I.T(...C.STOP_ANATOMY[s].formula)}</span>
            </div>`,
        )}
      </div>
    </details>
    <ol class="ll-items">
      ${items.map((it) => {
        const p = ls.practice[it.id] || {};
        const speakText = p.ok
          ? it.text.replace("___", p.answer || it.accept[0])
          : it.text.replace("___", "blank");
        return html`<li class="ll-item ${p.ok ? "is-done" : ""}">
          <div class="ll-item-head">
            <p lang="en">${it.text.replace("___", p.ok ? `<b>${p.answer || it.accept[0]}</b>` : "______") === it.text ? it.text : raw(it.text.replace("___", p.ok ? `<mark>${p.answer || it.accept[0]}</mark>` : "______"))} <span class="ll-base">(${it.base})</span></p>
            ${speakBtn(I, speakText, "Listen", "Escuchar")}
          </div>
          <div class="row-actions">
            <label
              ><span class="visually-hidden">${I.S("Verb", "Verbo")}</span
              ><input
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                data-ll-answer="${it.id}"
                value="${p.answer || ""}"
                ${p.ok ? raw("readonly") : ""}
                data-nsr-ignore
            /></label>
            ${p.ok ? "" : html`<button type="button" class="btn small" data-ll-check="${it.id}">${I.T("Check", "Revisar")}</button>`}
          </div>
          ${feedbackHTML(I, p.result)}
        </li>`;
      })}
    </ol>
  </section>`;
}

// ── Connector Bridge ─────────────────────────────────────────────────────────
const JOB_COLORS = {
  cause: "#9a4a26",
  contrast: "#8a3a5c",
  sequence: "#075568",
  addition: "#2e4a94",
  example: "#1f4a2e",
  conclusion: "#5a3a00",
};
const JOB_NAMES = {
  cause: ["cause / result", "causa / resultado"],
  contrast: ["contrast", "contraste"],
  sequence: ["time order", "orden en el tiempo"],
  addition: ["adding on", "agregar"],
  example: ["example", "ejemplo"],
  conclusion: ["conclusion", "conclusión"],
};
function bridgeSVG(a, b, connector, I) {
  const job = connector ? K.jobOf(connector) : "";
  const col = JOB_COLORS[job] || "#7d7262";
  const jobLabel = job && JOB_NAMES[job] && I ? I.S(...JOB_NAMES[job]) : "";
  return raw(`<svg class="ll-bridge" viewBox="0 0 680 184" aria-hidden="true">
    <rect x="6" y="6" width="668" height="172" rx="16" fill="#fffcf5" stroke="#e2d9c8" stroke-width="1.5"/>
    <path d="M180 156 Q340 138 500 156 L500 176 L180 176Z" fill="#d9f0ec"/>
    <path d="M6 146 Q140 124 210 152 L210 176 L6 176Z" fill="#d0e3cd"/>
    <path d="M470 152 Q540 124 674 146 L674 176 L470 176Z" fill="#d0e3cd"/>
    <rect x="20" y="66" width="196" height="74" rx="14" fill="#e7f4f2" stroke="#075568" stroke-width="2"/>
    <rect x="464" y="66" width="196" height="74" rx="14" fill="#e9edf8" stroke="#2e4a94" stroke-width="2"/>
    <text x="118" y="96" text-anchor="middle" font-size="14" font-weight="700" fill="#075568">IDEA A</text>
    <text x="118" y="118" text-anchor="middle" font-size="11" fill="#33475c">${(a || "First thought").slice(0, 26)}${(a || "").length > 26 ? "…" : ""}</text>
    <text x="562" y="96" text-anchor="middle" font-size="14" font-weight="700" fill="#123a5c">IDEA B</text>
    <text x="562" y="118" text-anchor="middle" font-size="11" fill="#33475c">${(b || "Second thought").slice(0, 26)}${(b || "").length > 26 ? "…" : ""}</text>
    <path d="M216 108 Q340 ${connector ? 34 : 132} 464 108" fill="none" stroke="${col}" stroke-width="${connector ? 10 : 4}" stroke-dasharray="${connector ? "" : "10 8"}" stroke-linecap="round"/>
    ${
      connector
        ? `<rect x="260" y="28" width="160" height="38" rx="19" fill="${col}"/>
           <text x="340" y="52" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">${connector.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
           ${jobLabel ? `<text x="340" y="84" text-anchor="middle" font-size="11" font-weight="700" fill="${col}">${jobLabel.toUpperCase()}</text>` : ""}`
        : ""
    }
  </svg>`);
}
const joined = (a, b, c) =>
  `${a}${/^(however|as a result|for example|after that|then|also)$/.test(c) ? `; ${c},` : `, ${c}`} ${b}.`;

function bridgeLab(ctx, I, step, ls, band) {
  if (step === 1) {
    const mentor = C.BRIDGE_MENTOR[band];
    const cmp = C.BRIDGE_COMPARE[band];
    return html`<section class="panel ll-see">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 1 · Notice the Pattern", "Paso 1 · Observa el patrón")}</p>
          <h2>
            ${I.T("A connector is a bridge between two ideas", "Un conector es un puente entre dos ideas")}
          </h2>
        </div>
      </div>
      <p>
        ${I.T("The same two ideas can mean different things depending on the bridge you build. Each connector does a job.", "Las mismas dos ideas pueden significar cosas distintas según el puente que construyas. Cada conector hace un trabajo.")}
      </p>
      ${bridgeSVG("", "", "", I)}
      <ul class="ll-jobs">
        ${Object.entries(JOB_NAMES).map(([job, n]) => html`<li style="--job:${JOB_COLORS[job]}"><b>${I.T(...n)}</b>: ${I.T(K.JOB_MEANING[job][0], K.JOB_MEANING[job][1])}. <span class="fine" lang="en">${(["cause", "contrast", "sequence", "addition", "example", "conclusion"].includes(job) ? C.BRIDGE_PALETTE.filter((w) => K.jobOf(w) === job) : []).join(" · ")}</span></li>`)}
      </ul>
      <div class="ll-mentor-spotlight">
        <div class="ll-mentor-head">
          <span class="ll-mentor-source">${icon("reading")} ${I.T(...mentor.source)}</span>
          ${speakBtn(I, mentor.passage, "Listen to passage", "Escuchar pasaje")}
        </div>
        <blockquote class="ll-mentor-quote" lang="en">${mentor.passage}</blockquote>
        <p class="fine">${I.T(...mentor.takeaway)}</p>
      </div>
      ${compareCardHTML(I, cmp)}
    </section>`;
  }
  if (step === 2) {
    const c = ls.explore.connector || "";
    const sceneIdx = ls.explore.scene ?? 0;
    const scene = C.BRIDGE_SCENES[sceneIdx] || C.BRIDGE_SCENES[0];
    const { a, b, fitJobs } = scene;
    const job = K.jobOf(c);
    const fits = fitJobs.includes(job);
    const joinedText = c ? joined(a, b.toLowerCase(), c) : `${a}. ${b}.`;
    const usesSemi = /^(however|as a result|for example|after that|then|also)$/.test(c);
    return html`<section class="panel ll-explore">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 2 · Interactive Connector Workbench", "Paso 2 · Banco interactivo de conectores")}</p>
          <h2>${I.T("Try different bridges", "Prueba distintos puentes")}</h2>
        </div>
        ${speakBtn(I, joinedText, "Listen", "Escuchar")}
      </div>
      <div class="ll-scene-strip" role="group" aria-label="${I.S("Idea pairs to test", "Pares de ideas para probar")}">
        <span class="ll-strip-label">${I.T("Idea pair:", "Par de ideas:")}</span>
        ${C.BRIDGE_SCENES.map(
          (sc, idx) =>
            html`<button
              type="button"
              class="chip ${idx === sceneIdx ? "is-on" : ""}"
              data-ll-scene="${idx}"
              aria-pressed="${idx === sceneIdx}"
            >
              ${I.T(...sc.label)}
            </button>`,
        )}
      </div>
      <p lang="en"><b>A:</b> ${a}. <b>B:</b> ${b}.</p>
      ${bridgeSVG(a, b, c, I)}
      <div class="ll-palette" role="group" aria-label="${I.S("Connectors", "Conectores")}">
        ${C.BRIDGE_PALETTE.map((w) => html`<button type="button" class="chip" data-ll-connector="${w}" aria-pressed="${w === c}" style="--job:${JOB_COLORS[K.jobOf(w)]}" lang="en">${w}</button>`)}
      </div>
      ${
        c
          ? html`<p class="ll-sentence" aria-live="polite" lang="en">${joinedText}</p>
              <p class="${fits ? "ll-fit" : "ll-misfit"}">
                ${fits ? I.T(`Makes sense: “${c}” says ${K.JOB_MEANING[job][0]}.`, `Tiene sentido: «${c}» dice que ${K.JOB_MEANING[job][1]}.`) : I.T(`Strange! “${c}” says ${K.JOB_MEANING[job][0]} — is that what happened?`, `¡Qué raro! «${c}» dice que ${K.JOB_MEANING[job][1]}. ¿Eso fue lo que pasó?`)}
              </p>
              <div class="ll-anatomy">
                <p class="fine">
                  <strong>${I.T("Punctuation tip:", "Consejo de puntuación:")}</strong>
                  ${
                    usesSemi
                      ? I.T(
                          `Transition words like “${c}” between two complete sentences use a semicolon before and a comma after (; ${c},).`,
                          `Las transiciones como «${c}» entre dos oraciones completas llevan punto y coma antes y coma después (; ${c},).`,
                        )
                      : I.T(
                          `Conjunctions like “${c}” join two ideas smoothly after a comma (, ${c}).`,
                          `Los conectores como «${c}» unen dos ideas después de una coma (, ${c}).`,
                        )
                  }
                </p>
              </div>`
          : html`<p class="fine">
              ${I.T("Press a connector to build the bridge.", "Presiona un conector para construir el puente.")}
            </p>`
      }
    </section>`;
  }
  if (step === 3)
    return guidedHTML(
      I,
      ls,
      C.BRIDGE_GUIDED.steps,
      `A: ${C.BRIDGE_GUIDED.a}. B: ${C.BRIDGE_GUIDED.b}.`,
      C.BRIDGE_GUIDED.rule,
    );
  if (step === 4) {
    const items = C.BRIDGE_ITEMS.filter((x) => x.band === band);
    const solved = items.filter((it) => ls.practice[it.id]?.ok).length;
    return html`<section class="panel ll-practice">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 4 · Guided Coaching Practice", "Paso 4 · Práctica con pistas")}</p>
          <h2>${I.T("Build the right bridge", "Construye el puente correcto")}</h2>
        </div>
        <span class="ll-score-pill" role="status">
          ${icon("check")} ${I.T(`${solved} of ${items.length} solved`, `${solved} de ${items.length} resueltas`)}
        </span>
      </div>
      <details class="ll-ref">
        <summary>${icon("bulb")} ${I.T("Open Connector Job Legend", "Abrir guía de funciones de conectores")}</summary>
        <div class="ll-ref-grid">
          ${Object.entries(JOB_NAMES).map(
            ([job, n]) =>
              html`<div class="ll-ref-item" style="border-left:4px solid ${JOB_COLORS[job]}">
                <strong>${I.T(...n)}</strong>
                <span>${I.T(...K.JOB_MEANING[job])}</span>
                <span lang="en"><b>${C.BRIDGE_PALETTE.filter((w) => K.jobOf(w) === job).join(" · ")}</b></span>
              </div>`,
          )}
        </div>
      </details>
      <ol class="ll-items">
        ${items.map((it) => {
          const p = ls.practice[it.id] || {};
          const joinedDone = p.ok ? joined(it.a, it.b.toLowerCase(), p.answer) : `${it.a}. ${it.b}.`;
          return html`<li class="ll-item ${p.ok ? "is-done" : ""}">
            <div class="ll-item-head">
              <p lang="en"><b>A:</b> ${it.a}. <b>B:</b> ${it.b}.</p>
              ${speakBtn(I, joinedDone, "Listen", "Escuchar")}
            </div>
            ${p.ok ? html`<p class="ll-sentence" lang="en">${joinedDone}</p>` : html`<div class="ll-palette" role="group" aria-label="${I.S("Choose a connector", "Elige un conector")}">${C.BRIDGE_PALETTE.map((w) => html`<button type="button" class="chip" data-ll-bridge="${it.id}" data-word="${w}" style="--job:${JOB_COLORS[K.jobOf(w)]}" lang="en">${w}</button>`)}</div>`}
            ${feedbackHTML(I, p.result)}
          </li>`;
        })}
      </ol>
    </section>`;
  }
  const t = C.BRIDGE_TRANSFER[band];
  const r = ls.transfer.result;
  return transferHTML(
    I,
    ls,
    t,
    r
      ? html`<div class="feedback ${r.ok ? "is-right" : "is-hint"}" role="status">
          <p class="fb-title">
            ${icon(r.ok ? "check" : "bulb")}
            ${r.ok ? I.T(`“${r.hit.word}” builds a ${JOB_NAMES[t.job][0]} bridge between your two ideas.`, `«${r.hit.word}» construye un puente de ${JOB_NAMES[t.job][1]} entre tus dos ideas.`) : I.T(r.next.en, r.next.es)}
          </p>
        </div>`
      : "",
    ls.transfer.hint
      ? html`<p class="ll-frame">
          ${I.T(`Bridge words for this task: ${C.BRIDGE_PALETTE.filter((w) => K.jobOf(w) === t.job).join(", ")}`, `Conectores para esta tarea: ${C.BRIDGE_PALETTE.filter((w) => K.jobOf(w) === t.job).join(", ")}`)}
        </p>`
      : "",
    { lab: "connector-bridge", band },
  );
}

// ── Paragraph X-Ray ──────────────────────────────────────────────────────────
const JOB_TINT = { topic: "#e9edf8", detail: "#e7f4f2", explain: "#fbeadf", conclude: "#f8e8ef" };
function markConnectors(text) {
  const found = K.connectorsIn(text);
  let out = text.replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
  for (const f of found)
    out = out.replace(
      new RegExp(`\\b(${f.word.replace(/ /g, "\\s+")})\\b`, "i"),
      '<mark class="ll-conn">$1</mark>',
    );
  return raw(out);
}
function xrayLab(ctx, I, step, ls, band) {
  const model = C.XRAY_MODEL[band];
  if (step === 1) {
    const cmp = C.XRAY_COMPARE[band];
    return html`<section class="panel ll-see">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 1 · Notice the Pattern", "Paso 1 · Observa el patrón")}</p>
          <h2>
            ${I.T("Every sentence in a paragraph has a job", "Cada oración de un párrafo tiene una función")}
          </h2>
        </div>
      </div>
      <div class="ll-skeleton">
        ${Object.entries(K.JOBS).map(([j, n], idx) => html`<div style="background:${JOB_TINT[j]}"><span class="ll-skel-num">${idx + 1}</span><b>${I.T(n[0].split(":")[0], n[1].split(":")[0])}</b><span>${I.T(n[0].split(": ")[1], n[1].split(": ")[1])}</span></div>`)}
      </div>
      <p>
        ${I.T("Connectors (first, also, because) and pointing words (this, these, it) hold the sentences together. A reader follows them like a path.", "Los conectores (first, also, because) y las palabras que señalan (this, these, it) mantienen unidas las oraciones. El lector las sigue como un camino.")}
      </p>
      ${compareCardHTML(I, cmp)}
    </section>`;
  }
  if (step === 2) {
    const fullText = model.sentences.map((s) => s.text).join(" ");
    const idx = Math.min(ui.inspect || 0, model.sentences.length - 1);
    const activeSent = model.sentences[idx];
    return html`<section class="panel ll-explore">
      <div class="ll-panel-top">
        <div>
          <p class="eyebrow">${I.T("Step 2 · Interactive Paragraph Scanner", "Paso 2 · Escáner interactivo de párrafos")}</p>
          <h2>${I.T("X-ray a paragraph", "Rayos X a un párrafo")}: <i lang="en">${model.title}</i></h2>
        </div>
        ${speakBtn(I, fullText, "Listen to paragraph", "Escuchar párrafo")}
      </div>
      <label class="ll-toggle"
        ><input type="checkbox" data-ll-xray ${ui.xray ? raw("checked") : ""} />
        ${I.T("X-ray on", "Rayos X encendidos")}</label
      >
      <div class="ll-para ${ui.xray ? "is-xray" : ""}" lang="en">
        ${model.sentences.map((s, i) => html`<span class="ll-s ${i === idx ? "is-active-s" : ""}" style="--tint:${JOB_TINT[s.job]}" data-ll-inspect="${i}">${ui.xray ? html`<small>${I.T(K.JOBS[s.job][0].split(":")[0], K.JOBS[s.job][1].split(":")[0])}</small>` : ""}${ui.xray ? markConnectors(s.text) : s.text} </span>`)}
      </div>
      ${ui.xray ? html`<p class="fine">${I.T("Pointing words:", "Palabras que señalan:")} ${model.refs.map((r, i) => html`${i ? "; " : ""}<b lang="en">${r.word}</b> → <span lang="en">${r.to}</span>`)}</p>` : ""}
      <div class="ll-inspector" aria-label="${I.S("Sentence role inspector", "Inspector de función de la oración")}">
        <div class="ll-inspector-tabs" role="group" aria-label="${I.S("Inspect sentence", "Inspeccionar oración")}">
          <span class="ll-strip-label">${I.T("Inspect sentence:", "Inspeccionar oración:")}</span>
          ${model.sentences.map(
            (s, i) =>
              html`<button
                type="button"
                class="chip ${i === idx ? "is-on" : ""}"
                data-ll-inspect="${i}"
                aria-pressed="${i === idx}"
              >
                ${i + 1}. ${I.T(K.JOBS[s.job][0].split(":")[0], K.JOBS[s.job][1].split(":")[0])}
              </button>`,
          )}
        </div>
        <div class="ll-inspector-body" style="border-left:4px solid ${JOB_COLORS[activeSent.job === "topic" ? "addition" : activeSent.job === "detail" ? "sequence" : activeSent.job === "explain" ? "cause" : "contrast"]}">
          <p class="ll-inspector-quote" lang="en">“${activeSent.text}”</p>
          <p><strong>${I.T("Job in the paragraph:", "Función en el párrafo:")}</strong> ${I.T(activeSent.why.en, activeSent.why.es)}</p>
          <p class="fine"><strong>${I.T("Question this answers:", "Pregunta que responde:")}</strong> ${I.T(activeSent.clue.en, activeSent.clue.es)}</p>
          ${activeSent.orderClue ? html`<p class="fine"><strong>${I.T("Cohesion clue:", "Pista de cohesión:")}</strong> ${I.T(activeSent.orderClue.en, activeSent.orderClue.es)}</p>` : ""}
        </div>
      </div>
    </section>`;
  }
  if (step === 3)
    return guidedHTML(
      I,
      ls,
      model.sentences.map((s) => [
        `“${s.text}” — ${K.JOBS[s.job][0].split(":")[0]}: ${s.why.en}`,
        `«${s.text}» — ${K.JOBS[s.job][1].split(":")[0]}: ${s.why.es}`,
      ]),
      "",
      [
        "Writer's Rule: Open with your main point, support it with connected details, explain why those details matter, and close with a conclusion that echoes the big idea.",
        "Regla del escritor: Abre con tu idea principal, apóyala con detalles conectados, explica por qué importan esos detalles y cierra con una conclusión que retome la gran idea.",
      ],
    );
  if (step === 4) {
    const pr = C.XRAY_PRACTICE[band];
    const p = ls.practice.labels || {};
    const o = ls.practice.order || {};
    const order = ui.order || o.order || shuffleOrder(pr.sentences.length);
    ui.order = order;
    const labelsRight = p.result?.results?.filter((x) => x.ok).length || 0;
    return html`<section class="panel ll-practice">
        <div class="ll-panel-top">
          <div>
            <p class="eyebrow">${I.T("Step 4 · Part 1 of 2", "Paso 4 · Parte 1 de 2")}</p>
            <h2>
              ${I.T("1. Label each sentence's job", "1. Marca la función de cada oración")}:
              <i lang="en">${pr.title}</i>
            </h2>
          </div>
          <span class="ll-score-pill" role="status">
            ${icon("check")} ${I.T(`${labelsRight} of ${pr.sentences.length} labeled`, `${labelsRight} de ${pr.sentences.length} marcadas`)}
          </span>
        </div>
        <ol class="ll-items">
          ${pr.sentences.map((s, i) => {
            const r = p.result?.results?.[i];
            return html`<li class="ll-item ${r?.ok ? "is-done" : ""}">
              <div class="ll-item-head">
                <p lang="en">${s.text}</p>
                ${speakBtn(I, s.text, "Listen", "Escuchar")}
              </div>
              <label
                ><span class="visually-hidden">${I.S("Job", "Función")}</span
                ><select data-ll-label="${i}" data-nsr-ignore>
                  <option value="">${I.T("Choose…", "Elige…")}</option>
                  ${Object.entries(K.JOBS).map(([j, n]) => html`<option value="${j}" ${(ui.labels[i] ?? p.labels?.[i]) === j ? raw("selected") : ""}>${I.T(n[0].split(":")[0], n[1].split(":")[0])}</option>`)}
                </select></label
              >${r ? html`<p class="${r.ok ? "ll-fit" : "ll-misfit"}">${r.ok ? icon("check") : icon("bulb")} ${I.T(r.why.en, r.why.es)}</p>` : ""}
            </li>`;
          })}
        </ol>
        <button type="button" class="btn btn-primary" data-ll-check-labels>
          ${I.T("Check my labels", "Revisar mis marcas")}
        </button>
      </section>
      <section class="panel ll-practice">
        <div class="ll-panel-top">
          <div>
            <p class="eyebrow">${I.T("Step 4 · Part 2 of 2", "Paso 4 · Parte 2 de 2")}</p>
            <h2>${I.T("2. Put the paragraph back in order", "2. Vuelve a ordenar el párrafo")}</h2>
          </div>
          ${o.result?.ok ? speakBtn(I, pr.sentences.map((s) => s.text).join(" "), "Listen to full paragraph", "Escuchar párrafo completo") : ""}
        </div>
        <p class="fine">
          ${I.T("Use the arrow buttons to move a sentence up or down. Look for the clue words.", "Usa los botones de flecha para subir o bajar una oración. Busca las palabras pista.")}
        </p>
        <ol class="ll-order">
          ${order.map(
            (idx, pos) =>
              html`<li>
                <span lang="en">${markConnectors(pr.sentences[idx].text)}</span
                ><span class="ll-order-btns"
                  ><button
                    type="button"
                    class="btn small"
                    data-ll-move="${pos}"
                    data-dir="-1"
                    ${pos === 0 ? raw("disabled") : ""}
                    aria-label="${I.S(`Move sentence ${pos + 1} up`, `Subir la oración ${pos + 1}`)}"
                  >
                    ↑</button
                  ><button
                    type="button"
                    class="btn small"
                    data-ll-move="${pos}"
                    data-dir="1"
                    ${pos === order.length - 1 ? raw("disabled") : ""}
                    aria-label="${I.S(`Move sentence ${pos + 1} down`, `Bajar la oración ${pos + 1}`)}"
                  >
                    ↓
                  </button></span
                >
              </li>`,
          )}
        </ol>
        <button type="button" class="btn btn-primary" data-ll-check-order>
          ${I.T("Check the order", "Revisar el orden")}
        </button>
        ${o.result ? html`<div class="feedback ${o.result.ok ? "is-right" : "is-hint"}" role="status"><p class="fb-title">${icon(o.result.ok ? "check" : "bulb")} ${o.result.ok ? I.T("The paragraph reads in order: topic, details, explanation, conclusion.", "El párrafo se lee en orden: idea principal, detalles, explicación, conclusión.") : I.T(`Sentence ${o.result.at + 1} is not in its place yet. ${o.result.clue.en}`, `La oración ${o.result.at + 1} todavía no está en su lugar. ${o.result.clue.es}`)}</p></div>` : ""}
      </section>`;
  }
  const t = C.XRAY_TRANSFER[band];
  const r = ls.transfer.result;
  return transferHTML(
    I,
    ls,
    t,
    r
      ? html`<div class="feedback ${r.ok ? "is-right" : "is-hint"}" role="status">
          <p class="fb-title">
            ${icon(r.ok ? "check" : "bulb")}
            ${r.ok ? I.T("Your paragraph has a topic sentence, linked details and a conclusion.", "Tu párrafo tiene oración principal, detalles unidos y una conclusión.") : I.T(r.next.en, r.next.es)}
          </p>
          <ul class="ll-shows">
            <li>
              ${r.count >= 4 ? "✅" : "⬜"} ${I.T(`${r.count} sentences`, `${r.count} oraciones`)}
            </li>
            <li>
              ${r.topic ? "✅" : "⬜"} ${I.T("topic sentence first", "oración principal primero")}
            </li>
            <li>
              ${r.conns.length ? "✅" : "⬜"} ${I.T("connectors", "conectores")}:
              ${r.conns.map((c) => c.word).join(", ")}
            </li>
            <li>${r.conclusion ? "✅" : "⬜"} ${I.T("a conclusion", "una conclusión")}</li>
          </ul>
        </div>`
      : "",
    ls.transfer.hint
      ? html`<p class="ll-frame">
          ${I.T("Frames: ___ is/should ___. First, ___. Also, ___. This matters because ___. Overall, ___.", "Marcos: ___ is/should ___. First, ___. Also, ___. This matters because ___. Overall, ___.")}
        </p>`
      : "",
    { lab: "paragraph-xray", band },
  );
}
function shuffleOrder(n) {
  // A fixed, never-solved shuffle so the task is the same on every visit.
  const o = [...Array(n).keys()];
  return [o[2], o[0], o[4], o[1], o[3]].filter((x) => x != null).concat(o.slice(5));
}

// ── Catalogue Cover Artwork for each of the 6 Labs ───────────────────────────
function labCoverSVG(id) {
  if (id === "verb-time-machine")
    return raw(`<svg viewBox="0 0 280 96" aria-hidden="true" class="ll-cover-svg">
      <rect width="280" height="96" rx="10" fill="#f7efe2"/>
      <line x1="28" y1="52" x2="252" y2="52" stroke="#123a5c" stroke-width="4" stroke-linecap="round"/>
      <circle cx="56" cy="52" r="9" fill="#075568" stroke="#fff" stroke-width="2.5"/>
      <circle cx="140" cy="52" r="13" fill="#9a4a26" stroke="#fff" stroke-width="3"/>
      <circle cx="224" cy="52" r="9" fill="#075568" stroke="#fff" stroke-width="2.5"/>
      <rect x="114" y="14" width="52" height="22" rx="11" fill="#fcefd3" stroke="#e2a72e"/>
      <text x="140" y="29" text-anchor="middle" font-size="10" font-weight="700" fill="#5a3a00">NOW</text>
      <text x="56" y="78" text-anchor="middle" font-size="10" font-weight="700" fill="#33475c">walked</text>
      <text x="140" y="78" text-anchor="middle" font-size="10" font-weight="700" fill="#9a4a26">is walking</text>
      <text x="224" y="78" text-anchor="middle" font-size="10" font-weight="700" fill="#33475c">will walk</text>
    </svg>`);
  if (id === "connector-bridge")
    return raw(`<svg viewBox="0 0 280 96" aria-hidden="true" class="ll-cover-svg">
      <rect width="280" height="96" rx="10" fill="#eef6f4"/>
      <rect x="16" y="42" width="74" height="38" rx="8" fill="#d9f0ec" stroke="#075568" stroke-width="2"/>
      <rect x="190" y="42" width="74" height="38" rx="8" fill="#e4eafa" stroke="#2e4a94" stroke-width="2"/>
      <text x="53" y="65" text-anchor="middle" font-size="11" font-weight="700" fill="#075568">Idea A</text>
      <text x="227" y="65" text-anchor="middle" font-size="11" font-weight="700" fill="#2e4a94">Idea B</text>
      <path d="M90 58 Q140 16 190 58" fill="none" stroke="#9a4a26" stroke-width="5" stroke-linecap="round"/>
      <rect x="104" y="16" width="72" height="24" rx="12" fill="#9a4a26"/>
      <text x="140" y="32" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">because · so</text>
    </svg>`);
  if (id === "paragraph-xray")
    return raw(`<svg viewBox="0 0 280 96" aria-hidden="true" class="ll-cover-svg">
      <rect width="280" height="96" rx="10" fill="#f3f0f9"/>
      <rect x="20" y="14" width="240" height="16" rx="5" fill="#e4eafa" stroke="#2e4a94" stroke-width="1.5"/>
      <rect x="20" y="35" width="185" height="14" rx="5" fill="#d9f0ec" stroke="#075568" stroke-width="1.5"/>
      <rect x="20" y="53" width="215" height="14" rx="5" fill="#fbead9" stroke="#9a4a26" stroke-width="1.5"/>
      <rect x="20" y="71" width="240" height="14" rx="5" fill="#f7e6ed" stroke="#8a3a5c" stroke-width="1.5"/>
      <text x="28" y="25" font-size="9" font-weight="700" fill="#2e4a94">TOPIC</text>
      <text x="28" y="45" font-size="9" font-weight="700" fill="#075568">DETAIL + EVIDENCE</text>
      <text x="28" y="63" font-size="9" font-weight="700" fill="#9a4a26">EXPLAIN WHY</text>
      <text x="28" y="81" font-size="9" font-weight="700" fill="#8a3a5c">CONCLUSION</text>
    </svg>`);
  if (id === "sentence-expansion")
    return raw(`<svg viewBox="0 0 280 96" aria-hidden="true" class="ll-cover-svg">
      <rect width="280" height="96" rx="10" fill="#eef5ec"/>
      <rect x="16" y="32" width="56" height="32" rx="7" fill="#fff" stroke="#075568" stroke-width="2"/>
      <rect x="78" y="32" width="56" height="32" rx="7" fill="#fff" stroke="#2e4a94" stroke-width="2"/>
      <rect x="140" y="32" width="56" height="32" rx="7" fill="#fff" stroke="#9a4a26" stroke-width="2"/>
      <rect x="202" y="32" width="62" height="32" rx="7" fill="#fcefd3" stroke="#7a4108" stroke-width="2"/>
      <text x="44" y="52" text-anchor="middle" font-size="10" font-weight="700" fill="#075568">Who</text>
      <text x="106" y="52" text-anchor="middle" font-size="10" font-weight="700" fill="#2e4a94">Action</text>
      <text x="168" y="52" text-anchor="middle" font-size="10" font-weight="700" fill="#9a4a26">Where</text>
      <text x="233" y="52" text-anchor="middle" font-size="10" font-weight="700" fill="#7a4108">+ Why</text>
    </svg>`);
  if (id === "evidence-builder")
    return raw(`<svg viewBox="0 0 280 96" aria-hidden="true" class="ll-cover-svg">
      <rect width="280" height="96" rx="10" fill="#fdf4e3"/>
      <rect x="44" y="14" width="192" height="24" rx="7" fill="#123a5c"/>
      <text x="140" y="30" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">CLAIM</text>
      <rect x="24" y="48" width="108" height="32" rx="7" fill="#e0f3e8" stroke="#17694a" stroke-width="2"/>
      <rect x="148" y="48" width="108" height="32" rx="7" fill="#e0f3e8" stroke="#17694a" stroke-width="2"/>
      <text x="78" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#17694a">Evidence 1</text>
      <text x="202" y="68" text-anchor="middle" font-size="10" font-weight="700" fill="#17694a">Evidence 2</text>
    </svg>`);
  return raw(`<svg viewBox="0 0 280 96" aria-hidden="true" class="ll-cover-svg">
    <rect width="280" height="96" rx="10" fill="#f9ece6"/>
    <rect x="18" y="30" width="96" height="36" rx="8" fill="#fff" stroke="#b3a690" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="66" y="52" text-anchor="middle" font-size="11" fill="#53636f">“stuff / things”</text>
    <path d="M122 48 L152 48" stroke="#9a4a26" stroke-width="3" stroke-linecap="round"/>
    <path d="M146 42 L154 48 L146 54" fill="none" stroke="#9a4a26" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="162" y="28" width="102" height="40" rx="8" fill="#9a4a26"/>
    <text x="213" y="52" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">nutrients · roots</text>
  </svg>`);
}

// ── Publisher Sections on the Hub & Lab Footer ───────────────────────────────
function journeySectionHTML(I, p) {
  return html`<section class="ll-journey" aria-labelledby="llJourneyH">
    <div class="ll-section-head">
      <p class="eyebrow">${I.T("How Language Scientists Work", "Cómo trabajan los científicos del lenguaje")}</p>
      <h2 id="llJourneyH">${I.T("The five-step inquiry path", "El camino de indagación de cinco pasos")}</h2>
    </div>
    <ol class="ll-journey-steps">
      ${p.stages.map(
        (s) =>
          html`<li class="ll-stage-card">
            <span class="ll-stage-num" aria-hidden="true">${s.num}</span>
            <span class="ll-stage-ico" aria-hidden="true">${icon(s.icon)}</span>
            <strong>${I.T(...s.title)}</strong>
            <span class="ll-stage-do">${I.T(...s.do)}</span>
            <span class="ll-stage-frame" lang="en">${I.T(...s.frame)}</span>
          </li>`,
      )}
    </ol>
  </section>`;
}

function craftSectionHTML(I, p, band) {
  return html`<section class="ll-craft" aria-labelledby="llCraftH">
    <div class="ll-section-head">
      <p class="eyebrow">${I.T(`Patterns of Power · ${p.grades[0]}`, `Patrones de poder · ${p.grades[1]}`)}</p>
      <h2 id="llCraftH">${I.T("Author's craft mini-lessons", "Minilecciones del oficio del autor")}</h2>
      <p class="ll-section-lead">
        ${I.T(
          "Compare an everyday draft with a published author's move, listen to the mentor sentence, then jump straight into that lab.",
          "Compara un borrador cotidiano con la jugada de un autor, escucha la oración modelo y entra directamente en ese laboratorio.",
        )}
      </p>
    </div>
    <ul class="ll-craft-grid">
      ${p.craft.map(
        (c, idx) =>
          html`<li class="ll-craft-card">
            <div class="ll-craft-top">
              <span class="ll-craft-num">${String(idx + 1).padStart(2, "0")}</span>
              ${usePill(I, c.use)}
              ${dimPill(I, c.dimension)}
            </div>
            <h3>${I.T(...c.title)}</h3>
            <p>${I.T(...c.tip)}</p>
            <div class="ll-craft-compare">
              <p class="ll-craft-before"><span class="ll-mini-tag">${I.T("Before:", "Antes:")}</span> <span lang="en">${c.before}</span></p>
              <blockquote class="ll-craft-mentor">
                <span class="ll-mini-tag">${I.T("Mentor sentence:", "Oración modelo:")}</span>
                <span lang="en">“${c.mentor}”</span>
              </blockquote>
            </div>
            <div class="ll-craft-actions">
              ${speakBtn(I, c.mentor, "Listen", "Escuchar")}
              <a class="btn small" href="${BASE}/${c.href}${c.href.includes("?") ? "&" : "?"}grades=${band}">
                ${I.T("Open lab", "Abrir laboratorio")} ${icon("arrow-right")}
              </a>
            </div>
          </li>`,
      )}
    </ul>
  </section>`;
}

function guidesSectionHTML(I, p) {
  return html`<section class="ll-guides" aria-labelledby="llGuidesH">
    <h2 id="llGuidesH" class="visually-hidden">${I.T("Teacher and Family Guides", "Guías para docentes y familias")}</h2>
    <div class="ll-guides-grid">
      <details class="ll-guide-box" open>
        <summary>${icon("teacher")} ${I.T(...p.teacher.summary)}</summary>
        <div class="ll-guide-body">
          <ul class="ll-routine-list">
            ${p.teacher.routines.map(
              (r) =>
                html`<li>
                  <strong>${I.T(...r.title)}</strong>
                  <p>${I.T(...r.body)}</p>
                </li>`,
            )}
          </ul>
          <div class="ll-standards-box">
            <strong>${I.T("WIDA 2020 ELD & CCSS Alignment", "Alineación con WIDA 2020 ELD y CCSS")}</strong>
            <ul>
              ${p.teacher.standards.map((st) => html`<li>${I.T(...st)}</li>`)}
            </ul>
          </div>
        </div>
      </details>
      <details class="ll-guide-box" open>
        <summary>${icon("families")} ${I.T(...p.family.summary)}</summary>
        <div class="ll-guide-body">
          <p>${I.T(...p.family.lead)}</p>
          <ul class="ll-routine-list">
            ${p.family.prompts.map(
              (pr) =>
                html`<li>
                  <strong>${I.T(...pr.title)}</strong>
                  <p>${I.T(...pr.body)}</p>
                </li>`,
            )}
          </ul>
        </div>
      </details>
    </div>
  </section>`;
}

// ── hub and render ───────────────────────────────────────────────────────────
function hubHTML(ctx, I, st, band) {
  const p = C.programForLab(band);
  const ledgerEntries = loadLedger().entries || [];
  const scaffoldDone = (toolId) =>
    new Set(ledgerEntries.filter((e) => e.src === "scaffold" && e.m?.tool === toolId && e.m?.ok).map((e) => e.task)).size;
  const totalStepsSeen = C.LABS.filter((l) => l.here).reduce(
    (sum, l) => sum + (st[l.id]?.[band]?.seen?.length || 0),
    0,
  );
  const transfersDone = C.LABS.filter((l) => l.here).filter((l) => st[l.id]?.[band]?.transfer?.ok).length;
  const resumeLab =
    C.LABS.find((l) => l.here && (st[l.id]?.[band]?.seen?.length || 0) > 0 && !st[l.id]?.[band]?.transfer?.ok) ||
    C.LABS[0];
  const resumeStep = st[resumeLab.id]?.[band]?.seen?.at(-1) || 1;

  return html`<section class="ll-hub">
    <header class="ll-hero is-band-${band}">
      <div class="ll-hero-text">
        <p class="ll-hero-band">
          <span>${I.T(...p.grades)}</span>
          ${I.T(...p.name)}
        </p>
        <h1 tabindex="-1">${I.T("Language Labs", "Laboratorios de lenguaje")}</h1>
        <p class="eyebrow">${I.T(...p.eyebrow)}</p>
        <p class="lead">${I.T(...p.lead)}</p>
        <p class="ll-wida-banner">${icon("check")} ${I.T(...p.widaGoal)}</p>
        <div class="row-actions">
          <a
            class="btn btn-primary btn-big"
            href="${BASE}/language-labs/${resumeLab.id}?step=${resumeStep}&grades=${band}"
          >
            ${icon("play")}
            ${
              totalStepsSeen > 0
                ? I.T(`Continue: ${resumeLab.title[0]}`, `Continuar: ${resumeLab.title[1]}`)
                : I.T(`Start: ${resumeLab.title[0]}`, `Empezar: ${resumeLab.title[1]}`)
            }
          </a>
          <a class="btn btn-big" href="${BASE}/book-studio?grades=${band}">
            ${icon("library")} ${I.T("Open Book Studio", "Abrir Book Studio")}
          </a>
        </div>
        <p class="ll-hero-stats" role="status">
          <span>${icon("clock")} ${I.T(`${totalStepsSeen} of 15 interactive steps explored`, `${totalStepsSeen} de 15 pasos interactivos explorados`)}</span>
          <span>·</span>
          <span>${icon("medal")} ${I.T(`${transfersDone} of 3 transfer tasks completed`, `${transfersDone} de 3 tareas de transferencia completadas`)}</span>
        </p>
      </div>
      <div class="ll-hero-art" aria-hidden="true" inert>
        <div class="ll-specimen s0">${labCoverSVG("verb-time-machine")}<span>Verb Time Machine</span></div>
        <div class="ll-specimen s1">${labCoverSVG("connector-bridge")}<span>Connector Bridge</span></div>
        <div class="ll-specimen s2">${labCoverSVG("paragraph-xray")}<span>Paragraph X-Ray</span></div>
      </div>
    </header>

    <section class="ll-catalogue" aria-labelledby="llCatH">
      <div class="ll-cat-bar">
        <div class="ll-section-head">
          <p class="eyebrow">${I.T(`Six Interactive Labs · ${p.grades[0]}`, `Seis laboratorios interactivos · ${p.grades[1]}`)}</p>
          <h2 id="llCatH">${I.T("Choose a language lab", "Elige un laboratorio de lenguaje")}</h2>
        </div>
        <div class="ll-dim-filter" role="group" aria-label="${I.S("Filter by language dimension", "Filtrar por dimensión del lenguaje")}">
          ${[
            ["all", ["All 6 labs", "Los 6 laboratorios"]],
            ["word", ["Word / Phrase", "Palabra / frase"]],
            ["sentence", ["Sentence", "Oración"]],
            ["discourse", ["Discourse", "Discurso"]],
          ].map(
            ([id, label]) =>
              html`<button
                type="button"
                class="chip ${ui.dimFilter === id ? "is-on" : ""}"
                data-ll-dim-filter="${id}"
                aria-pressed="${ui.dimFilter === id}"
              >
                ${I.T(...label)}
              </button>`,
          )}
        </div>
      </div>

      <ul class="ll-cards">
        ${C.LABS.map((l) => {
          const ls = st[l.id]?.[band];
          const done = ls ? ls.seen.length : 0;
          const scCount = l.toolId ? scaffoldDone(l.toolId) : 0;
          const href = l.here
            ? `${BASE}/language-labs/${l.id}?step=1&grades=${band}`
            : `${BASE}/${l.href}?grades=${band}`;
          const hide = ui.dimFilter !== "all" && l.dimension !== ui.dimFilter;
          return html`<li ${hide ? raw("hidden") : ""}>
            <a class="card ll-card" href="${href}">
              <span class="ll-card-cover">${labCoverSVG(l.id)}</span>
              <span class="ll-card-tags">
                ${usePill(I, l.use)}
                ${dimPill(I, l.dimension)}
              </span>
              <span class="ll-card-title-row">
                ${icon(l.icon)}
                <strong>${I.T(...l.title)}</strong>
              </span>
              <span>${I.T(...l.text)}</span>
              ${l.bandNote?.[band] ? html`<span class="ll-card-bandnote">${I.T(...l.bandNote[band])}</span>` : ""}
              ${l.mentor?.[band] ? html`<span class="ll-card-mentor" lang="en">“${l.mentor[band]}”</span>` : ""}
              <span class="ll-card-meta">
                ${I.T(...l.skill)}${
                  l.here
                    ? html` · ${I.T(`${done} of 5 steps`, `${done} de 5 pasos`)}${ls?.transfer?.ok ? html` · ✅ ${I.T("Completed", "Completado")}` : ""}`
                    : html` · ${scCount ? I.T(`${scCount} completed`, `${scCount} completadas`) : I.T("Adaptive builder", "Constructor adaptativo")}`
                }
              </span>
            </a>
          </li>`;
        })}
      </ul>
    </section>

    ${journeySectionHTML(I, p)}
    ${craftSectionHTML(I, p, band)}
    ${guidesSectionHTML(I, p)}
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);
  const st = load();
  const lab = ctx.route.id || "";
  const def = C.LABS.find((l) => l.id === lab && l.here);
  if (ui.lab !== lab) ui = { lab, labels: {}, order: null, xray: true, inspect: 0, dimFilter: ui.dimFilter || "all" };
  if (!def)
    return {
      title: I.S("Language Labs", "Laboratorios de lenguaje"),
      html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language Labs", "Laboratorios de lenguaje"), null],
      ])}${hubHTML(ctx, I, st, band)}`,
    };
  const step = Math.min(
    5,
    Math.max(1, Number(new URLSearchParams(location.search).get("step")) || 1),
  );
  const ls = labState(st, lab, band);
  if (!ls.seen.includes(step)) {
    ls.seen.push(step);
    save(st);
  }
  const body =
    lab === "verb-time-machine"
      ? verbLab(ctx, I, step, ls, band)
      : lab === "connector-bridge"
        ? bridgeLab(ctx, I, step, ls, band)
        : xrayLab(ctx, I, step, ls, band);
  const title = I.S(...def.title);
  const prog = C.programForLab(band);
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language Labs", "Laboratorios de lenguaje"), `${BASE}/language-labs?grades=${band}`],
        [title, null],
      ])}
      <article class="ll-lab" aria-labelledby="llTitle">
        <header class="ll-head">
          <div class="ll-head-badges">
            <span class="ll-band-pill">${I.T(...prog.grades)} · ${I.T(...prog.name)}</span>
            ${usePill(I, def.use)}
            ${dimPill(I, def.dimension)}
          </div>
          <p class="eyebrow">${I.T(...def.skill)}</p>
          <h1 id="llTitle" tabindex="-1">${title}</h1>
          <p class="lead">${I.T(...def.text)}</p>
          ${def.bandNote?.[band] ? html`<p class="fine">${icon("check")} ${I.T(...def.bandNote[band])}</p>` : ""}
        </header>
        ${stepperHTML(I, lab, step, ls, band)}${body}${nextLink(I, lab, step, band)}
        ${step === 5 && ls.transfer.ok ? html`<p class="ll-done">${icon("medal")} ${I.T("Lab complete. Try another lab, or come back and write about a new topic.", "Laboratorio completo. Prueba otro laboratorio o vuelve a escribir sobre un tema nuevo.")} <a href="${BASE}/language-labs?grades=${band}">${I.T("All labs", "Todos los laboratorios")}</a></p>` : ""}
      </article>`,
  };
}

// ── events ───────────────────────────────────────────────────────────────────
export function onInput(e, ctx) {
  const t = e.target;
  const lab = ctx.route.id;
  if (!lab) return;
  const band = bandOf(ctx.band);
  const st = load();
  const ls = labState(st, lab, band);
  if (t.matches("[data-ll-slide]")) {
    ls.explore.at = Number(t.value);
    save(st);
    ctx.rerender();
  } else if (t.matches("[data-ll-transfer]")) {
    ls.transfer.text = t.value.slice(0, 4000);
    save(st);
  } else if (t.matches("[data-ll-answer]")) {
    (ls.practice[t.dataset.llAnswer] ||= {}).answer = t.value;
    save(st);
  }
}

export function onChange(e, ctx) {
  const t = e.target;
  const lab = ctx.route.id;
  if (!lab) return;
  const st = load();
  const ls = labState(st, lab, bandOf(ctx.band));
  if (t.matches("[data-ll-verb]")) {
    ls.explore.verb = Number(t.value);
    save(st);
    ctx.rerender();
  } else if (t.matches("[data-ll-label]")) ui.labels[Number(t.dataset.llLabel)] = t.value;
  else if (t.matches("[data-ll-xray]")) {
    ui.xray = t.checked;
    ctx.rerender();
  }
}

export function onKey(e, ctx) {
  if (e.key === "Enter" && e.target.matches?.("[data-ll-answer]")) {
    e.preventDefault();
    document.querySelector(`[data-ll-check="${e.target.dataset.llAnswer}"]`)?.click();
  }
}

export function onClick(e, ctx) {
  const t = e.target;
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);

  const speakEl = t.closest("[data-ll-speak]");
  if (speakEl) {
    speak(speakEl.dataset.llSpeak, { lang: "en-US" });
    return true;
  }

  const dimBtn = t.closest("[data-ll-dim-filter]");
  if (dimBtn) {
    ui.dimFilter = dimBtn.dataset.llDimFilter || "all";
    ctx.rerender();
    return true;
  }

  const lab = ctx.route.id;
  if (!lab) return false;
  const st = load();
  const ls = labState(st, lab, band);
  const done = () => (save(st), ctx.rerender(), true);

  if (t.closest("[data-ll-guided]")) {
    ls.guided = (ls.guided || 1) + 1;
    return done();
  }
  if (t.closest("[data-ll-guided-reset]")) {
    ls.guided = 1;
    return done();
  }
  const stopBtn = t.closest("[data-ll-stop]");
  if (stopBtn) {
    ls.explore.at = Number(stopBtn.dataset.llStop);
    return done();
  }
  const sceneBtn = t.closest("[data-ll-scene]");
  if (sceneBtn) {
    ls.explore.scene = Number(sceneBtn.dataset.llScene);
    return done();
  }
  const inspectBtn = t.closest("[data-ll-inspect]");
  if (inspectBtn) {
    ui.inspect = Number(inspectBtn.dataset.llInspect);
    ctx.rerender();
    return true;
  }
  const topicBtn = t.closest("[data-ll-topic]");
  if (topicBtn) {
    ls.transfer.topic = Number(topicBtn.dataset.llTopic);
    return done();
  }
  const insertBtn = t.closest("[data-ll-insert]");
  if (insertBtn) {
    const word = insertBtn.dataset.llInsert;
    const area = document.querySelector("[data-ll-transfer]");
    const cur = (area?.value ?? ls.transfer.text ?? "").trim();
    const next = cur ? `${cur} ${word} ` : `${word} `;
    ls.transfer.text = next.slice(0, 4000);
    save(st);
    ctx.rerender().then(() => {
      const box = document.querySelector("[data-ll-transfer]");
      if (box) {
        box.focus();
        box.setSelectionRange(box.value.length, box.value.length);
      }
    });
    return true;
  }
  if (t.closest("[data-ll-speak-transfer]")) {
    const text = document.querySelector("[data-ll-transfer]")?.value || ls.transfer.text || "";
    if (!text.trim()) {
      announce(I.S("Write a sentence first, then press Listen.", "Escribe una oración primero y luego presiona Escuchar."));
      return true;
    }
    speak(text, { lang: "en-US" });
    return true;
  }
  const toBook = t.closest("[data-ll-to-book]");
  if (toBook) {
    const text = (document.querySelector("[data-ll-transfer]")?.value || ls.transfer.text || "").trim();
    if (!text) {
      announce(I.S("Write your response first so we can put it on your book page.", "Escribe primero tu respuesta para ponerla en la página de tu libro."));
      return true;
    }
    const def = C.LABS.find((l) => l.id === lab) || C.LABS[0];
    const tpl =
      lab === "verb-time-machine"
        ? "personal-narrative"
        : lab === "connector-bridge"
          ? "cause-effect"
          : band === "6-8"
            ? "evidence-argument"
            : "informational-report";
    openInBookStudio(
      {
        source: { kind: "writing", id: lab, label: def.title[0] },
        title: `${def.title[0]} · ${band === "3-5" ? "Grades 3–5" : "Grades 6–8"}`,
        templateId: tpl,
        band,
        pages: [{ heading: def.title[0], text }],
      },
      (url) => ctx.navigate(url),
    );
    return true;
  }

  const conn = t.closest("[data-ll-connector]");
  if (conn) {
    ls.explore.connector = conn.dataset.llConnector;
    return done();
  }
  const check = t.closest("[data-ll-check]");
  if (check) {
    const it = C.VERB_ITEMS.find((x) => x.id === check.dataset.llCheck);
    const p = (ls.practice[it.id] ||= {});
    const answer = document.querySelector(`[data-ll-answer="${it.id}"]`)?.value || p.answer || "";
    p.answer = answer;
    const r = K.checkVerb(it, answer, p.tries || 0);
    if (r.got !== "empty") {
      record(ctx, {
        lab,
        task: it.id,
        ok: r.ok,
        kind: p.tries ? "revision" : "first",
        supported: (p.tries || 0) >= 1,
        use: "Narrate",
        extra: { tense: it.tense, got: r.got },
      });
      p.tries = (p.tries || 0) + 1;
    }
    p.result = r;
    if (r.ok || r.reveal) p.ok = r.ok;
    announce(I.S(r.message.en, r.message.es));
    return done();
  }
  const bridge = t.closest("[data-ll-bridge]");
  if (bridge) {
    const it = C.BRIDGE_ITEMS.find((x) => x.id === bridge.dataset.llBridge);
    const p = (ls.practice[it.id] ||= {});
    const r = K.checkBridge(it, bridge.dataset.word, p.tries || 0);
    record(ctx, {
      lab,
      task: it.id,
      ok: r.ok,
      kind: p.tries ? "revision" : "first",
      supported: (p.tries || 0) >= 1,
      use: "Explain",
      extra: { job: r.job },
    });
    p.tries = (p.tries || 0) + 1;
    p.result = r;
    if (r.ok) {
      p.ok = true;
      p.answer = bridge.dataset.word;
    }
    announce(I.S(r.message.en, r.message.es));
    return done();
  }
  if (t.closest("[data-ll-check-labels]")) {
    const pr = C.XRAY_PRACTICE[band];
    const prev = ls.practice.labels || {};
    const labels = pr.sentences.map((_, i) => ui.labels[i] ?? prev.labels?.[i] ?? "");
    const r = K.checkLabels(pr, labels);
    record(ctx, {
      lab,
      task: `xray-labels-${band}`,
      ok: r.ok,
      kind: prev.result ? "revision" : "first",
      supported: false,
      use: "Explain",
      extra: { right: r.results.filter((x) => x.ok).length },
    });
    ls.practice.labels = { labels, result: r };
    announce(
      r.ok
        ? I.S("Every label is right.", "Todas las marcas están bien.")
        : I.S(
            `${r.results.filter((x) => x.ok).length} of ${r.results.length} labels are right. Read the notes under the others.`,
            `${r.results.filter((x) => x.ok).length} de ${r.results.length} marcas están bien. Lee las notas debajo de las otras.`,
          ),
    );
    return done();
  }
  const move = t.closest("[data-ll-move]");
  if (move) {
    const pos = Number(move.dataset.llMove);
    const to = pos + Number(move.dataset.dir);
    const order = [...ui.order];
    [order[pos], order[to]] = [order[to], order[pos]];
    ui.order = order;
    ls.practice.order = { order, result: null };
    save(st);
    ctx.rerender();
    requestAnimationFrame(
      () =>
        document.querySelector(`[data-ll-move="${to}"][data-dir="${move.dataset.dir}"]`)?.focus() ||
        document.querySelector(`[data-ll-move="${to}"]`)?.focus(),
    );
    return true;
  }
  if (t.closest("[data-ll-check-order]")) {
    const pr = C.XRAY_PRACTICE[band];
    const r = K.checkOrder(pr, ui.order);
    record(ctx, {
      lab,
      task: `xray-order-${band}`,
      ok: r.ok,
      kind: ls.practice.order?.result ? "revision" : "first",
      supported: false,
      use: "Explain",
    });
    ls.practice.order = { order: ui.order, result: r };
    return done();
  }
  if (t.closest("[data-ll-transfer-hint]")) {
    ls.transfer.hint = true;
    return done();
  }
  if (t.closest("[data-ll-check-transfer]")) {
    const text = document.querySelector("[data-ll-transfer]")?.value || ls.transfer.text;
    ls.transfer.text = text;
    const r =
      lab === "verb-time-machine"
        ? K.checkTimeline(text)
        : lab === "connector-bridge"
          ? K.checkJoin(text, C.BRIDGE_TRANSFER[band].job)
          : K.checkParagraph(text, C.XRAY_TRANSFER[band].topicWords);
    record(ctx, {
      lab,
      task: `${lab}-transfer-${band}`,
      ok: r.ok,
      kind: ls.transfer.checks ? "revision" : "first",
      supported: ls.transfer.hint,
      use: lab === "paragraph-xray" ? "Argue" : "Explain",
      extra: { transfer: 1 },
    });
    ls.transfer.checks = (ls.transfer.checks || 0) + 1;
    ls.transfer.result = r;
    ls.transfer.ok = ls.transfer.ok || r.ok;
    return done();
  }
  return false;
}
