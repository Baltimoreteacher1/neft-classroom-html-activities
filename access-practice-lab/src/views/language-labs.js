// Language Labs (/language-labs, /language-labs/<lab>?step=1..5): Verb Time Machine, Connector Bridge and Paragraph
// X-Ray on one five-step path (See it → Explore → Example → Practice → New task), plus the hub that also links the
// three labs that already existed under other names. Content: src/content/language-labs.js; checks:
// src/lang/labs-check.js. Every practice check and transfer check is a ledger entry (src "labs"): independent unless a
// hint was opened, first vs revision, so the evidence reaches My Growth like the other studios. No timers, no scores.
import { crumbsHTML } from "../components.js";
import * as C from "../content/language-labs.js";
import { i18nFor } from "../i18n.js";
import * as K from "../lang/labs-check.js";
import { appendEntry, loadLedger, saveLedger } from "../lang/ledger.js";
import { BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";

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
    transfer: { text: "", ok: false, checks: 0, hint: false },
    explore: {},
    guided: 0,
  };
  return st[lab][band];
};
let ui = { lab: "", labels: {}, order: null, xray: true };

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

// ── shared pieces ────────────────────────────────────────────────────────────
function stepperHTML(I, lab, step, ls, band) {
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
  </nav>`;
}
const nextLink = (I, lab, step, band) =>
  step < 5
    ? html`<p class="ll-next">
        <a
          class="btn btn-primary"
          href="${BASE}/language-labs/${lab}?step=${step + 1}&grades=${band}"
          >${I.T(`Next: ${STEPS[step][0]}`, `Siguiente: ${STEPS[step][1]}`)}
          ${icon("arrow-right")}</a
        >
      </p>`
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

function guidedHTML(I, ls, steps, sentence) {
  const shown = Math.max(1, ls.guided || 1);
  return html`<section class="panel ll-guided" aria-labelledby="llGuidedH">
    <h2 id="llGuidedH">${I.T("Watch it done, one step at a time", "Míralo paso a paso")}</h2>
    ${sentence ? html`<p class="ll-sentence">${sentence}</p>` : ""}
    <ol class="ll-guided-steps">
      ${steps.slice(0, shown).map(([en, es], i) => html`<li class="${i === steps.length - 1 ? "is-final" : ""}">${I.T(en, es)}</li>`)}
    </ol>
    ${shown < steps.length ? html`<button type="button" class="btn" data-ll-guided>${I.T("Show the next step", "Mostrar el siguiente paso")} ${icon("arrow-right")}</button>` : ""}
  </section>`;
}

function transferHTML(I, ls, prompt, result, extra = "") {
  return html`<section class="panel ll-transfer" aria-labelledby="llTrH">
    <p class="eyebrow">
      ${icon("flag")}
      ${I.T("Your own words, on a new task", "Tus propias palabras, en una tarea nueva")}
    </p>
    <h2 id="llTrH">${I.T("New task", "Tarea nueva")}</h2>
    <p>${I.T(prompt.en, prompt.es)}</p>
    ${extra}
    <label class="field"
      ><span>${I.T("My writing", "Mi escritura")}</span
      ><textarea rows="6" data-ll-transfer data-nsr-ignore>${ls.transfer.text}</textarea>
    </label>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-ll-check-transfer>
        ${icon("check")} ${I.T("Check my writing", "Revisar mi escritura")}
      </button>
      ${ls.transfer.hint ? "" : html`<button type="button" class="btn ghost" data-ll-transfer-hint>${icon("bulb")} ${I.T("I want a hint", "Quiero una pista")}</button>`}
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
  const w = 640;
  const xs = stops.map((_, i) => 60 + (i * (w - 120)) / Math.max(1, stops.length - 1));
  const nowIndex = stops.includes("present-progressive") ? stops.indexOf("present-progressive") : stops.indexOf("present");
  return raw(`<svg class="ll-timeline" viewBox="0 0 ${w} 120" role="img" aria-label="${I.S("Timeline from the past to the future", "Línea del tiempo del pasado al futuro")}">
    <line x1="20" y1="60" x2="${w - 20}" y2="60" stroke="#1b2a5c" stroke-width="4" stroke-linecap="round"/>
    <path d="M${w - 30} 50 L${w - 12} 60 L${w - 30} 70" fill="none" stroke="#1b2a5c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${nowIndex >= 0 ? `<rect x="${xs[nowIndex] - 26}" y="18" width="52" height="84" rx="12" fill="#fff3c4"/><text x="${xs[nowIndex]}" y="34" text-anchor="middle" font-size="14" font-weight="700" fill="#5a3a00">${I.S("NOW", "AHORA")}</text>` : ""}
    ${stops
      .map(
        (s, i) =>
          `<g><circle cx="${xs[i]}" cy="60" r="${i === at ? 14 : 8}" fill="${i === at ? "#e86a50" : "#075568"}" stroke="#fff" stroke-width="3"/><text x="${xs[i]}" y="98" text-anchor="middle" font-size="12" fill="#1b1f3b">${C.STOP_SHORT[s][I.mode === "es" ? 1 : 0]}</text></g>`,
      )
      .join("")}
  </svg>`);
}

function verbLab(ctx, I, step, ls, band) {
  const stops = C.VERB_STOPS[band];
  if (step === 1)
    return html`<section class="panel ll-see">
      <h2>${I.T("Every action happens at a time", "Cada acción pasa en un momento")}</h2>
      <p>
        ${I.T("English shows WHEN an action happens by changing the verb. A time word (yesterday, now, tomorrow) is your clue; the verb has to agree with it.", "El inglés muestra CUÁNDO pasa una acción cambiando el verbo. Una palabra de tiempo (yesterday, now, tomorrow) es tu pista; el verbo tiene que coincidir con ella.")}
      </p>
      ${timelineSVG(I, stops, stops.indexOf("present"))}
      <ul class="ll-forms">
        ${stops.map((s) => html`<li><b>${I.T(...K.TENSE_NAMES[s])}</b>: ${C.STOP_CUES[s][0]} Maya ${composeVerb("Maya", "walk", s)} ${I.T("to school.", "to school.")}</li>`)}
      </ul>
    </section>`;
  if (step === 2) {
    const ex = ls.explore;
    const v = C.VERB_EXPLORE[ex.verb ?? 0];
    const at = Math.min(ex.at ?? stops.indexOf("present"), stops.length - 1);
    const tense = stops[at];
    return html`<section class="panel ll-explore">
      <h2>${I.T("Move the action through time", "Mueve la acción en el tiempo")}</h2>
      <label class="field"
        ><span>${I.T("Choose an action", "Elige una acción")}</span
        ><select data-ll-verb data-nsr-ignore>
          ${C.VERB_EXPLORE.map((x, i) => html`<option value="${i}" ${i === (ex.verb ?? 0) ? raw("selected") : ""}>${x.subject} · ${x.base}</option>`)}
        </select></label
      >
      ${timelineSVG(I, stops, at)}
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
      <p class="ll-sentence" aria-live="polite">
        ${C.STOP_CUES[tense][0]}
        ${v.subject.replace(/^\w/, (c) => (C.STOP_CUES[tense][0].endsWith(",") ? c : c.toUpperCase()))}
        <mark>${composeVerb(v.subject, v.base, tense)}</mark> ${v.rest}.
      </p>
      <p class="fine">
        ${I.T(`This is the ${K.TENSE_NAMES[tense][0]}. Watch what changes in the verb, and what stays the same.`, `Esto es el ${K.TENSE_NAMES[tense][1]}. Observa qué cambia en el verbo y qué se queda igual.`)}
      </p>
    </section>`;
  }
  if (step === 3) {
    const g = C.VERB_GUIDED[band];
    return guidedHTML(I, ls, g.steps, g.sentence);
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
  );
}

function verbPractice(ctx, I, ls, band) {
  const items = C.VERB_ITEMS.filter((x) => x.band === band);
  return html`<section class="panel ll-practice">
    <h2>${I.T("Make the verb match the time", "Haz que el verbo coincida con el tiempo")}</h2>
    <p class="fine">
      ${I.T("Type the verb form that fits. A wrong try gives you a clue, not the answer.", "Escribe la forma del verbo que encaja. Un intento equivocado te da una pista, no la respuesta.")}
    </p>
    <ol class="ll-items">
      ${items.map((it) => {
        const p = ls.practice[it.id] || {};
        return html`<li class="ll-item ${p.ok ? "is-done" : ""}">
          <p>${it.text.replace("___", "______")} <span class="ll-base">(${it.base})</span></p>
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
function bridgeSVG(a, b, connector) {
  const job = connector ? K.jobOf(connector) : "";
  const col = JOB_COLORS[job] || "#8b90a6";
  return raw(`<svg class="ll-bridge" viewBox="0 0 640 170" aria-hidden="true">
    <path d="M0 150 Q160 120 200 150 L200 170 L0 170Z" fill="#7fb48a"/><path d="M440 150 Q480 120 640 150 L640 170 L440 170Z" fill="#7fb48a"/>
    <rect x="10" y="70" width="190" height="70" rx="14" fill="#e7f4f2" stroke="#075568" stroke-width="2"/>
    <rect x="440" y="70" width="190" height="70" rx="14" fill="#e9edf8" stroke="#2e4a94" stroke-width="2"/>
    <text x="105" y="100" text-anchor="middle" font-size="15" font-weight="700" fill="#0b3d4a">A</text><text x="535" y="100" text-anchor="middle" font-size="15" font-weight="700" fill="#1b2a5c">B</text>
    <path d="M200 112 Q320 ${connector ? 40 : 130} 440 112" fill="none" stroke="${col}" stroke-width="${connector ? 10 : 4}" stroke-dasharray="${connector ? "" : "10 8"}" stroke-linecap="round"/>
    ${connector ? `<rect x="250" y="38" width="140" height="34" rx="17" fill="${col}"/><text x="320" y="60" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">${connector.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>` : ""}
  </svg>`);
}
const joined = (a, b, c) =>
  `${a}${/^(however|as a result|for example|after that|then|also)$/.test(c) ? `; ${c},` : `, ${c}`} ${b}.`;

function bridgeLab(ctx, I, step, ls, band) {
  if (step === 1)
    return html`<section class="panel ll-see">
      <h2>
        ${I.T("A connector is a bridge between two ideas", "Un conector es un puente entre dos ideas")}
      </h2>
      <p>
        ${I.T("The same two ideas can mean different things depending on the bridge you build. Each connector does a job.", "Las mismas dos ideas pueden significar cosas distintas según el puente que construyas. Cada conector hace un trabajo.")}
      </p>
      ${bridgeSVG("", "", "")}
      <ul class="ll-jobs">
        ${Object.entries(JOB_NAMES).map(([job, n]) => html`<li style="--job:${JOB_COLORS[job]}"><b>${I.T(...n)}</b>: ${I.T(K.JOB_MEANING[job][0], K.JOB_MEANING[job][1])}. <span class="fine">${(["cause", "contrast", "sequence", "addition", "example", "conclusion"].includes(job) ? C.BRIDGE_PALETTE.filter((w) => K.jobOf(w) === job) : []).join(" · ")}</span></li>`)}
      </ul>
    </section>`;
  if (step === 2) {
    const c = ls.explore.connector || "";
    const { a, b } = C.BRIDGE_EXPLORE;
    const job = K.jobOf(c);
    const fits = ["cause", "sequence"].includes(job);
    return html`<section class="panel ll-explore">
      <h2>${I.T("Try different bridges", "Prueba distintos puentes")}</h2>
      <p><b>A:</b> ${a}. <b>B:</b> ${b}.</p>
      ${bridgeSVG(a, b, c)}
      <div class="ll-palette" role="group" aria-label="${I.S("Connectors", "Conectores")}">
        ${C.BRIDGE_PALETTE.map((w) => html`<button type="button" class="chip" data-ll-connector="${w}" aria-pressed="${w === c}" style="--job:${JOB_COLORS[K.jobOf(w)]}">${w}</button>`)}
      </div>
      ${
        c
          ? html`<p class="ll-sentence" aria-live="polite">${joined(a, b.toLowerCase(), c)}</p>
              <p class="${fits ? "ll-fit" : "ll-misfit"}">
                ${fits ? I.T(`Makes sense: “${c}” says ${K.JOB_MEANING[job][0]}.`, `Tiene sentido: «${c}» dice que ${K.JOB_MEANING[job][1]}.`) : I.T(`Strange! “${c}” says ${K.JOB_MEANING[job][0]} — is that what happened?`, `¡Qué raro! «${c}» dice que ${K.JOB_MEANING[job][1]}. ¿Eso fue lo que pasó?`)}
              </p>`
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
    );
  if (step === 4) {
    const items = C.BRIDGE_ITEMS.filter((x) => x.band === band);
    return html`<section class="panel ll-practice">
      <h2>${I.T("Build the right bridge", "Construye el puente correcto")}</h2>
      <ol class="ll-items">
        ${items.map((it) => {
          const p = ls.practice[it.id] || {};
          return html`<li class="ll-item ${p.ok ? "is-done" : ""}">
            <p><b>A:</b> ${it.a}. <b>B:</b> ${it.b}.</p>
            ${p.ok ? html`<p class="ll-sentence">${joined(it.a, it.b.toLowerCase(), p.answer)}</p>` : html`<div class="ll-palette" role="group" aria-label="${I.S("Choose a connector", "Elige un conector")}">${C.BRIDGE_PALETTE.map((w) => html`<button type="button" class="chip" data-ll-bridge="${it.id}" data-word="${w}">${w}</button>`)}</div>`}
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
  if (step === 1)
    return html`<section class="panel ll-see">
      <h2>
        ${I.T("Every sentence in a paragraph has a job", "Cada oración de un párrafo tiene una función")}
      </h2>
      <div class="ll-skeleton">
        ${Object.entries(K.JOBS).map(([j, n]) => html`<div style="background:${JOB_TINT[j]}"><b>${I.T(n[0].split(":")[0], n[1].split(":")[0])}</b><span>${I.T(n[0].split(": ")[1], n[1].split(": ")[1])}</span></div>`)}
      </div>
      <p>
        ${I.T("Connectors (first, also, because) and pointing words (this, these, it) hold the sentences together. A reader follows them like a path.", "Los conectores (first, also, because) y las palabras que señalan (this, these, it) mantienen unidas las oraciones. El lector las sigue como un camino.")}
      </p>
    </section>`;
  if (step === 2)
    return html`<section class="panel ll-explore">
      <h2>${I.T("X-ray a paragraph", "Rayos X a un párrafo")}: <i>${model.title}</i></h2>
      <label class="ll-toggle"
        ><input type="checkbox" data-ll-xray ${ui.xray ? raw("checked") : ""} />
        ${I.T("X-ray on", "Rayos X encendidos")}</label
      >
      <div class="ll-para ${ui.xray ? "is-xray" : ""}">
        ${model.sentences.map((s) => html`<span class="ll-s" style="--tint:${JOB_TINT[s.job]}">${ui.xray ? html`<small>${I.T(K.JOBS[s.job][0].split(":")[0], K.JOBS[s.job][1].split(":")[0])}</small>` : ""}${ui.xray ? markConnectors(s.text) : s.text} </span>`)}
      </div>
      ${ui.xray ? html`<p class="fine">${I.T("Pointing words:", "Palabras que señalan:")} ${model.refs.map((r, i) => html`${i ? "; " : ""}<b>${r.word}</b> → ${r.to}`)}</p>` : ""}
    </section>`;
  if (step === 3)
    return guidedHTML(
      I,
      ls,
      model.sentences.map((s) => [
        `“${s.text}” — ${K.JOBS[s.job][0].split(":")[0]}: ${s.why.en}`,
        `«${s.text}» — ${K.JOBS[s.job][1].split(":")[0]}: ${s.why.es}`,
      ]),
      "",
    );
  if (step === 4) {
    const pr = C.XRAY_PRACTICE[band];
    const p = ls.practice.labels || {};
    const o = ls.practice.order || {};
    const order = ui.order || o.order || shuffleOrder(pr.sentences.length);
    ui.order = order;
    return html`<section class="panel ll-practice">
        <h2>
          ${I.T("1. Label each sentence's job", "1. Marca la función de cada oración")}:
          <i>${pr.title}</i>
        </h2>
        <ol class="ll-items">
          ${pr.sentences.map((s, i) => {
            const r = p.result?.results?.[i];
            return html`<li class="ll-item ${r?.ok ? "is-done" : ""}">
              <p>${s.text}</p>
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
        <h2>${I.T("2. Put the paragraph back in order", "2. Vuelve a ordenar el párrafo")}</h2>
        <p class="fine">
          ${I.T("Use the arrow buttons to move a sentence up or down. Look for the clue words.", "Usa los botones de flecha para subir o bajar una oración. Busca las palabras pista.")}
        </p>
        <ol class="ll-order">
          ${order.map(
            (idx, pos) =>
              html`<li>
                <span>${markConnectors(pr.sentences[idx].text)}</span
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
  );
}
function shuffleOrder(n) {
  // A fixed, never-solved shuffle so the task is the same on every visit.
  const o = [...Array(n).keys()];
  return [o[2], o[0], o[4], o[1], o[3]].filter((x) => x != null).concat(o.slice(5));
}

// ── hub and render ───────────────────────────────────────────────────────────
function hubHTML(ctx, I, st, band) {
  return html`<section class="ll-hub">
    <header class="ll-hub-head">
      <p class="eyebrow">
        ${I.T("See how English works, then use it", "Mira cómo funciona el inglés y luego úsalo")}
      </p>
      <h1 tabindex="-1">${I.T("Language Labs", "Laboratorios de lenguaje")}</h1>
      <p class="lead">
        ${I.T("Six hands-on labs. Each one shows an idea, lets you play with it, walks through an example, gives practice with specific feedback, and ends with a new task in your own words.", "Seis laboratorios prácticos. Cada uno muestra una idea, te deja jugar con ella, te guía con un ejemplo, te da práctica con comentarios específicos y termina con una tarea nueva en tus propias palabras.")}
      </p>
    </header>
    <ul class="ll-cards">
      ${C.LABS.map((l) => {
        const ls = st[l.id]?.[band];
        const done = ls ? ls.seen.length : 0;
        const href = l.here
          ? `${BASE}/language-labs/${l.id}?step=1&grades=${band}`
          : `${BASE}/${l.href}?grades=${band}`;
        return html`<li>
          <a class="card ll-card" href="${href}"
            >${icon(l.icon)}<strong>${I.T(...l.title)}</strong><span>${I.T(...l.text)}</span
            ><span class="ll-card-meta"
              >${I.T(...l.skill)}${l.here ? html` · ${I.T(`${done} of 5 steps`, `${done} de 5 pasos`)}` : ""}</span
            ></a
          >
        </li>`;
      })}
    </ul>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);
  const st = load();
  const lab = ctx.route.id || "";
  const def = C.LABS.find((l) => l.id === lab && l.here);
  if (ui.lab !== lab) ui = { lab, labels: {}, order: null, xray: true };
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
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language Labs", "Laboratorios de lenguaje"), `${BASE}/language-labs?grades=${band}`],
        [title, null],
      ])}
      <article class="ll-lab" aria-labelledby="llTitle">
        <header class="ll-head">
          <p class="eyebrow">${I.T(...def.skill)}</p>
          <h1 id="llTitle" tabindex="-1">${title}</h1>
          <p class="lead">${I.T(...def.text)}</p>
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
  const lab = ctx.route.id;
  if (!lab) return false;
  const I = i18nFor(ctx);
  const band = bandOf(ctx.band);
  const st = load();
  const ls = labState(st, lab, band);
  const done = () => (save(st), ctx.rerender(), true);
  if (t.closest("[data-ll-guided]")) {
    ls.guided = (ls.guided || 1) + 1;
    return done();
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
