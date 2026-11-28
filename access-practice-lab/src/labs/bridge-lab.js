// Connector Bridge, steps 1-5. The learner builds a bridge between two idea towers: the connector decides the
// bridge's shape (cause, contrast, addition, sequence, example, conclusion), punctuation is drawn as part of it,
// and grades 6-8 can also weigh claim against counterclaim. Explore steps are exploration; only Practice and the
// New task are ledger entries.
import * as C from "../content/language-labs.js";
import * as K from "../lang/labs-check.js";
import { announce, html, icon, raw } from "../util.js";
import { bridgeSceneHTML, miniBridge, scaleHTML } from "./bridge-art.js";
import {
  GLOSS,
  JOB_NAMES,
  JOB_ORDER,
  JOB_QUESTION,
  WEIGH,
  WEIGH_FORMS,
  fits,
  joinIdeas,
  paletteFor,
  punctuation,
  tilt,
  weigh,
  weighNote,
} from "./bridge-model.js";
import {
  compareCardHTML,
  discoveryHTML,
  feedbackHTML,
  guidedHTML,
  lampsHTML,
  markPhrases,
  mentorHTML,
  panelHead,
  speakBtn,
  transferHTML,
} from "./kit.js";

const SAME_PAIR = {
  a: "The park was crowded",
  b: "we found a quiet bench",
  words: ["so", "but", "then"],
};
export const keys = (step) =>
  step === 2
    ? [
        [
          ["1", "–", "9"],
          "Pick a connector (in the order shown)",
          "Elegir un conector (en el orden mostrado)",
        ],
        [
          ["W"],
          "Switch to Weigh the evidence (grades 6-8)",
          "Cambiar a Pesar la evidencia (grados 6-8)",
        ],
      ]
    : [];

const jobColor = (job) => `--job:var(--job-${job || "none"})`;
const markConns = (text) =>
  markPhrases(
    text,
    K.connectorsIn(text).map((c) => c.word),
  );
const palette = (band) => paletteFor(C.BRIDGE_PALETTE, band);

/** Connector buttons. `attr(w)` gives the data attribute. Grouped by relationship once a hint asks for it. */
function paletteHTML(I, words, attr, { grouped = false, selected = "", numbered = false } = {}) {
  const chip = (w, i) =>
    html`<button
      type="button"
      class="chip cb-chip"
      ${raw(attr(w))}
      aria-pressed="${w === selected}"
      style="${jobColor(K.jobOf(w))}"
      lang="en"
    >
      ${numbered ? html`<span class="cb-n" aria-hidden="true">${i + 1}</span>` : ""}${I.TARGET(w, GLOSS[w])}
    </button>`;
  if (!grouped)
    return html`<div
      class="ll-palette"
      role="group"
      aria-label="${I.S("Connectors", "Conectores")}"
    >
      ${words.map(chip)}
    </div>`;
  return html`<div class="cb-groups">
    ${JOB_ORDER.filter((j) => words.some((w) => K.jobOf(w) === j)).map(
      (j) =>
        html`<div
          class="cb-group"
          role="group"
          aria-label="${I.S(...JOB_NAMES[j])}"
          style="${jobColor(j)}"
        >
          <span class="cb-group-h">${I.T(...JOB_NAMES[j])}</span>
          <div class="ll-palette">${words.filter((w) => K.jobOf(w) === j).map(chip)}</div>
        </div>`,
    )}
  </div>`;
}

// ── step 1 ───────────────────────────────────────────────────────────────────
function seeStep(env) {
  const { I, band } = env;
  const mentor = C.BRIDGE_MENTOR[band];
  const cmp = C.BRIDGE_COMPARE[band];
  const words = palette(band);
  return html`<section class="panel ll-see cb-see">
    ${panelHead(I, ["Step 1 · Notice the Pattern", "Paso 1 · Observa el patrón"], ["A connector is a bridge between two ideas", "Un conector es un puente entre dos ideas"])}
    <p>
      ${I.T("The same two ideas can mean different things depending on the bridge you build. Each connector does a job.", "Las mismas dos ideas pueden significar cosas distintas según el puente que construyas. Cada conector hace un trabajo.")}
    </p>
    <div class="cb-pair">
      <p class="cb-pair-h">
        <strong
          >${I.T("Same two ideas, three bridges", "Las mismas dos ideas, tres puentes")}</strong
        >
        <span lang="en">A: ${SAME_PAIR.a}. B: ${SAME_PAIR.b}.</span>
      </p>
      <ul class="cb-pair-list">
        ${SAME_PAIR.words.map((w) => {
          const s = joinIdeas(SAME_PAIR.a, SAME_PAIR.b, w);
          const job = K.jobOf(w);
          return html`<li style="${jobColor(job)}">
            ${miniBridge(job)}
            <div>
              <p class="cb-pair-s" lang="en">${markPhrases(s, [w])}</p>
              <p class="fine">${I.T(...JOB_NAMES[job])}: ${I.T(...K.JOB_MEANING[job])}.</p>
            </div>
            ${speakBtn(I, s)}
          </li>`;
        })}
      </ul>
    </div>
    <h3 class="cb-h3">
      ${I.T("Six jobs, six bridge shapes", "Seis funciones, seis formas de puente")}
    </h3>
    <ul class="cb-gallery">
      ${JOB_ORDER.map(
        (job) =>
          html`<li class="cb-gcard" style="${jobColor(job)}">
            ${miniBridge(job)}
            <strong>${I.T(...JOB_NAMES[job])}</strong>
            <span>${I.T(...K.JOB_MEANING[job])}</span>
            <span class="cb-gwords" lang="en"
              >${words.filter((w) => K.jobOf(w) === job).join(" · ")}</span
            >
          </li>`,
      )}
    </ul>
    ${mentorHTML(I, mentor, markConns(mentor.passage))}
    ${compareCardHTML(
      I,
      cmp,
      K.connectorsIn(cmp.after).map((c) => c.word),
    )}
  </section>`;
}

// ── step 2 ───────────────────────────────────────────────────────────────────
const tried = (env) => env.ls.explore.tried?.length || 0;
export { tried };

function weighPanel(env, w, state, { forPractice = false } = {}) {
  const { I } = env;
  const sc = WEIGH.find((s) => s.id === state.scene) || WEIGH[0];
  const res = state.form ? weigh(sc, state.first || "support", state.form) : null;
  const a = forPractice
    ? { first: "data-ll-pfirst", form: "data-ll-pform" }
    : { first: "data-ll-wfirst", form: "data-ll-wform" };
  return html`<div class="cb-weigh">
    <p class="cb-claim" lang="en"><strong>${I.T("Claim:", "Afirmación:")}</strong> ${sc.claim}</p>
    <div class="cb-ideas">
      <div class="cb-idea is-support">
        <span class="cb-tag">${I.T("Your evidence", "Tu evidencia")}</span>
        <p lang="en">${sc.support}</p>
      </div>
      <div class="cb-idea is-counter">
        <span class="cb-tag">${I.T("The other side", "El otro lado")}</span>
        <p lang="en">${sc.counter}</p>
      </div>
    </div>
    <div
      class="cb-weigh-ctl"
      role="group"
      aria-label="${I.S("Which idea comes first?", "¿Qué idea va primero?")}"
    >
      <span class="ll-strip-label">${I.T("Which idea comes first?", "¿Qué idea va primero?")}</span>
      ${[
        ["support", ["Your evidence", "Tu evidencia"]],
        ["counter", ["The other side", "El otro lado"]],
      ].map(
        ([id, label]) =>
          html`<button
            type="button"
            class="chip"
            ${raw(`${a.first}="${id}"`)}
            aria-pressed="${(state.first || "support") === id}"
          >
            ${I.T(...label)}
          </button>`,
      )}
    </div>
    <div
      class="cb-weigh-ctl"
      role="group"
      aria-label="${I.S("Choose a bridge", "Elige un puente")}"
    >
      <span class="ll-strip-label">${I.T("Choose a bridge:", "Elige un puente:")}</span>
      ${WEIGH_FORMS.map((f) => html`<button type="button" class="chip cb-chip" ${raw(`${a.form}="${f.id}"`)} aria-pressed="${state.form === f.id}" style="${jobColor("contrast")}" lang="en">${f.label}</button>`)}
    </div>
    ${scaleHTML(I, res ? tilt(res) : 0)}
    ${
      res
        ? html`<p class="ll-sentence" lang="en">${res.sentence}</p>
            <p class="${res.backsClaim ? "ll-fit" : "ll-misfit"}" role="status">
              ${icon(res.backsClaim ? "check" : "bulb")} ${I.T(...Object.values(weighNote(res)))}
            </p>
            ${speakBtn(I, res.sentence)}`
        : html`<p class="fine">
            ${I.T("Pick which idea comes first and a bridge. The scale tilts toward the idea the sentence stresses.", "Elige qué idea va primero y un puente. La balanza se inclina hacia la idea que la oración destaca.")}
          </p>`
    }
  </div>`;
}

function exploreStep(env) {
  const { I, ls, band } = env;
  const ex = ls.explore;
  const mode = band === "6-8" && ex.mode === "weigh" ? "weigh" : "connect";
  const modeTabs =
    band === "6-8"
      ? html`<div
          class="cb-modes"
          role="group"
          aria-label="${I.S("Workbench mode", "Modo del banco")}"
        >
          ${[
            ["connect", ["Connect two ideas", "Unir dos ideas"]],
            ["weigh", ["Weigh the evidence", "Pesar la evidencia"]],
          ].map(
            ([id, label]) =>
              html`<button
                type="button"
                class="chip"
                data-ll-mode="${id}"
                aria-pressed="${mode === id}"
              >
                ${I.T(...label)}
              </button>`,
          )}
        </div>`
      : "";
  const head = panelHead(
    I,
    ["Step 2 · Interactive Connector Workbench", "Paso 2 · Banco interactivo de conectores"],
    mode === "weigh"
      ? ["Weigh the evidence", "Pesa la evidencia"]
      : ["Try different bridges", "Prueba distintos puentes"],
  );
  if (mode === "weigh")
    return html`<section
      class="panel ll-explore cb"
      aria-label="${I.S("Weigh the evidence", "Pesar la evidencia")}"
    >
      ${head}${modeTabs}${weighPanel(env, null, ex.w || {})}
      <div data-ll-disc-host>${discoveryHTML(I, env.lab, 2, ls, tried(env))}</div>
    </section>`;
  const c = ex.connector || "";
  const sceneIdx = ex.scene ?? 0;
  const scene = C.BRIDGE_SCENES[sceneIdx] || C.BRIDGE_SCENES[0];
  const job = K.jobOf(c);
  const ok = fits(c, scene.fitJobs);
  const text = joinIdeas(scene.a, scene.b, c);
  const p = punctuation(c);
  const words = palette(band);
  return html`<section class="panel ll-explore cb" aria-labelledby="cbH">
    ${panelHead(I, ["Step 2 · Interactive Connector Workbench", "Paso 2 · Banco interactivo de conectores"], ["Try different bridges", "Prueba distintos puentes"], speakBtn(I, text, "Listen", "Escuchar", "ll-speak-main"), "cbH")}
    ${modeTabs}
    <div
      class="ll-scene-strip"
      role="group"
      aria-label="${I.S("Idea pairs to test", "Pares de ideas para probar")}"
    >
      <span class="ll-strip-label">${I.T("Idea pair:", "Par de ideas:")}</span>
      ${C.BRIDGE_SCENES.map((sc, idx) => html`<button type="button" class="chip ${idx === sceneIdx ? "is-on" : ""}" data-ll-scene="${idx}" aria-pressed="${idx === sceneIdx}">${I.T(...sc.label)}</button>`)}
    </div>
    ${bridgeSceneHTML(I, { a: scene.a, b: scene.b, connector: c, job, gloss: GLOSS[c] })}
    <p class="ll-strip-label cb-pal-h" id="cbPalH">
      ${I.T("Choose a connector. Each one builds a different bridge:", "Elige un conector. Cada uno construye un puente distinto:")}
    </p>
    ${paletteHTML(I, words, (w) => `data-ll-connector="${w}"`, { selected: c, numbered: true })}
    ${
      c
        ? html`<p class="ll-sentence" aria-live="polite" lang="en">${text}</p>
            <p class="${ok ? "ll-fit" : "ll-misfit"}">
              ${ok ? I.T(`Makes sense: “${c}” says ${K.JOB_MEANING[job][0]}.`, `Tiene sentido: «${c}» dice que ${K.JOB_MEANING[job][1]}.`) : I.T(`Strange! “${c}” says ${K.JOB_MEANING[job][0]} — is that what happened?`, `¡Qué raro! «${c}» dice que ${K.JOB_MEANING[job][1]}. ¿Eso fue lo que pasó?`)}
            </p>
            <div class="ll-anatomy">
              <p class="fine">
                <strong
                  >${I.T("Punctuation is part of the bridge:", "La puntuación es parte del puente:")}</strong
                >
                ${I.T(p.rule.en, p.rule.es)}
              </p>
            </div>`
        : html`<p class="fine">
            ${I.T("Press a connector to build the bridge.", "Presiona un conector para construir el puente.")}
          </p>`
    }
    <div data-ll-disc-host>${discoveryHTML(I, env.lab, 2, ls, tried(env))}</div>
  </section>`;
}

// ── step 3 ───────────────────────────────────────────────────────────────────
function exampleStep(env) {
  const { I, ls } = env;
  const g = C.BRIDGE_GUIDED;
  return guidedHTML(I, ls, g.steps, `A: ${g.a}. B: ${g.b}.`, g.rule, (shown) => {
    const connector = shown >= 4 ? "so" : "";
    return html`<div class="cb-guided-art">
      ${bridgeSceneHTML(I, { a: g.a, b: g.b, connector, job: connector ? K.jobOf(connector) : "", gloss: GLOSS[connector] })}
    </div>`;
  });
}

// ── step 4 ───────────────────────────────────────────────────────────────────
function itemHTML(env, it) {
  const { I, ls, band } = env;
  const p = ls.practice[it.id] || {};
  const hints = p.hint || 0;
  const words = palette(band);
  const doneText = p.ok ? joinIdeas(it.a, it.b, p.answer) : "";
  return html`<li class="ll-item ${p.ok ? "is-done" : ""}">
    <div class="ll-item-head">
      <p lang="en"><b>A:</b> ${it.a}. <b>B:</b> ${it.b}.</p>
      ${speakBtn(I, p.ok ? doneText : `${it.a}. ${it.b}.`)}
    </div>
    ${
      p.ok
        ? html`<div class="cb-done" style="${jobColor(K.jobOf(p.answer))}">
            ${miniBridge(K.jobOf(p.answer))}
            <div>
              <p class="ll-sentence" lang="en">${doneText}</p>
              <p class="fine">${I.T(...punctuationRule(p.answer))}</p>
            </div>
          </div>`
        : html`${
            hints
              ? html`<p class="ll-hint">
                  ${icon("bulb")}
                  <span
                    ><strong>${I.T("Hint 1:", "Pista 1:")}</strong>
                    ${I.T("Ask what idea B does to idea A. The bridges are grouped by their job.", "Pregunta qué hace la idea B con la idea A. Los puentes están agrupados por su función.")}</span
                  >
                </p>`
              : ""
          }
          ${
            hints > 1
              ? html`<div class="ll-hint cb-qs">
                  ${icon("bulb")}
                  <span
                    ><strong>${I.T("Hint 2:", "Pista 2:")}</strong>
                    ${I.T("Which sentence sounds like your two ideas?", "¿Qué oración suena como tus dos ideas?")}
                    <ul>
                      ${JOB_ORDER.map((j) => html`<li>${I.T(...JOB_QUESTION[j])}</li>`)}
                    </ul></span
                  >
                </div>`
              : ""
          }
          ${paletteHTML(I, words, (w) => `data-ll-bridge="${it.id}" data-word="${w}"`, { grouped: hints > 0 })}
          ${hints < 2 ? html`<button type="button" class="btn small ghost" data-ll-bhint="${it.id}">${icon("bulb")} ${hints ? I.T("Another hint", "Otra pista") : I.T("I need a hint", "Necesito una pista")}</button>` : ""}`
    }
    ${feedbackHTML(I, p.result)}
  </li>`;
}
const punctuationRule = (w) => {
  const r = punctuation(w).rule;
  return [r.en, r.es];
};

function weighPractice(env) {
  const { I, ls } = env;
  const st = ls.practice.weigh || {};
  const state = { scene: WEIGH[0].id, first: st.first, form: st.form };
  return html`<section class="panel ll-practice cb-weigh-practice">
    ${panelHead(I, ["Step 4 · Part 2 of 2 (grades 6-8)", "Paso 4 · Parte 2 de 2 (grados 6-8)"], ["Give your evidence the weight", "Dale el peso a tu evidencia"])}
    <p class="fine">
      ${I.T("A contrast bridge puts the weight on one idea. Build a sentence where the weight is on your evidence.", "Un puente de contraste pone el peso en una idea. Construye una oración donde el peso esté en tu evidencia.")}
    </p>
    ${weighPanel(env, null, state, { forPractice: true })}
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-ll-wcheck>
        ${I.T("Check my sentence", "Revisar mi oración")}
      </button>
    </div>
    ${st.result ? html`<div class="feedback ${st.result.ok ? "is-right" : "is-hint"}" role="status"><p class="fb-title">${icon(st.result.ok ? "check" : "bulb")} ${st.result.ok ? I.T("Your evidence carries the weight, so it backs your claim.", "Tu evidencia lleva el peso, así que respalda tu afirmación.") : I.T("Not yet: the weight is on the other side. Swap the ideas or try another bridge.", "Todavía no: el peso está en el otro lado. Cambia el orden de las ideas o prueba otro puente.")}</p></div>` : ""}
  </section>`;
}

function practiceStep(env) {
  const { I, ls, band } = env;
  const items = C.BRIDGE_ITEMS.filter((x) => x.band === band);
  const solved = items.filter((it) => ls.practice[it.id]?.ok).length;
  return html`<section class="panel ll-practice">
      ${panelHead(I, ["Step 4 · Guided Coaching Practice", "Paso 4 · Práctica con pistas"], ["Build the right bridge", "Construye el puente correcto"], html`<span class="ll-score-pill" role="status">${icon("check")} ${I.T(`${solved} of ${items.length} solved`, `${solved} de ${items.length} resueltas`)}</span>`)}
      <details class="ll-ref">
        <summary>
          ${icon("bulb")}
          ${I.T("Open Connector Job Legend", "Abrir guía de funciones de conectores")}
        </summary>
        <div class="ll-ref-grid">
          ${JOB_ORDER.map(
            (job) =>
              html`<div class="ll-ref-item" style="border-left:4px solid var(--job-${job})">
                <strong>${I.T(...JOB_NAMES[job])}</strong><span>${I.T(...K.JOB_MEANING[job])}</span
                ><span lang="en"
                  ><b
                    >${palette(band)
                      .filter((w) => K.jobOf(w) === job)
                      .join(" · ")}</b
                  ></span
                >
              </div>`,
          )}
        </div>
      </details>
      <ol class="ll-items">
        ${items.map((it) => itemHTML(env, it))}
      </ol>
    </section>
    ${band === "6-8" ? weighPractice(env) : ""}`;
}

// ── step 5 ───────────────────────────────────────────────────────────────────
function transferStep(env) {
  const { I, ls, band } = env;
  const t = C.BRIDGE_TRANSFER[band];
  const r = ls.transfer.result;
  const bridgeWords = palette(band)
    .filter((w) => K.jobOf(w) === t.job)
    .join(", ");
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
          ${
            r.hit
              ? html`<div class="cb-done" style="${jobColor(r.hit.job)}">
                  ${miniBridge(r.hit.job)}
                  <p class="fine">${I.T(...punctuationRule(r.hit.word))}</p>
                </div>`
              : ""
          }
          ${lampsHTML([
            [
              Boolean(r.found.length),
              I.T("a connector joins your ideas", "un conector une tus ideas"),
            ],
            [
              Boolean(r.hit),
              I.T(
                `the bridge is a ${JOB_NAMES[t.job][0]} bridge`,
                `el puente es de ${JOB_NAMES[t.job][1]}`,
              ),
            ],
          ])}
        </div>`
      : "",
    ls.transfer.hint
      ? html`<p class="ll-frame">
          ${I.T(`Bridge words for this task: ${bridgeWords}`, `Conectores para esta tarea: ${bridgeWords}`)}
        </p>`
      : "",
    { lab: "connector-bridge", band },
  );
}

export function render(env) {
  const { step } = env;
  if (step === 1) return seeStep(env);
  if (step === 2) return exploreStep(env);
  if (step === 3) return exampleStep(env);
  if (step === 4) return practiceStep(env);
  return transferStep(env);
}

// ── events ───────────────────────────────────────────────────────────────────
const sayFit = (env, c) => {
  const scene = C.BRIDGE_SCENES[env.ls.explore.scene ?? 0] || C.BRIDGE_SCENES[0];
  const job = K.jobOf(c);
  const ok = fits(c, scene.fitJobs);
  const m = K.JOB_MEANING[job];
  announce(
    ok
      ? env.I.S(`Makes sense: ${c} says ${m[0]}.`, `Tiene sentido: ${c} dice que ${m[1]}.`)
      : env.I.S(`Strange: ${c} says ${m[0]}.`, `Qué raro: ${c} dice que ${m[1]}.`),
    { toast: false },
  );
};

export function click(t, env) {
  const { ls, I, band } = env;
  const attr = (sel, key) => t.closest(sel)?.dataset[key];
  const conn = t.closest("[data-ll-connector]");
  if (conn) {
    const c = conn.dataset.llConnector;
    ls.explore.connector = c;
    ls.explore.tried = [...new Set([...(ls.explore.tried || []), c])];
    sayFit(env, c);
    return env.done();
  }
  const scene = attr("[data-ll-scene]", "llScene");
  if (scene !== undefined) {
    ls.explore.scene = Number(scene);
    return env.done();
  }
  const mode = attr("[data-ll-mode]", "llMode");
  if (mode) {
    ls.explore.mode = mode;
    return env.done();
  }
  const wf = (ls.explore.w ||= {});
  for (const [sel, key, prop, target] of [
    ["[data-ll-wfirst]", "llWfirst", "first", wf],
    ["[data-ll-wform]", "llWform", "form", wf],
    ["[data-ll-pfirst]", "llPfirst", "first", (ls.practice.weigh ||= {})],
    ["[data-ll-pform]", "llPform", "form", (ls.practice.weigh ||= {})],
  ]) {
    const v = attr(sel, key);
    if (v) {
      target[prop] = v;
      if (target === ls.practice.weigh) target.result = null;
      return env.done();
    }
  }
  if (t.closest("[data-ll-wcheck]")) {
    const st = (ls.practice.weigh ||= {});
    const res = st.form ? weigh(WEIGH[0], st.first || "support", st.form) : null;
    if (!res) {
      announce(I.S("Pick a bridge first.", "Primero elige un puente."), { toast: false });
      return true;
    }
    env.record({
      task: `bridge-weigh-${band}`,
      ok: res.backsClaim,
      kind: st.result ? "revision" : "first",
      supported: false,
      use: "Argue",
      extra: { job: "contrast" },
    });
    st.result = { ok: res.backsClaim };
    announce(I.S(...Object.values(weighNote(res))), { toast: false });
    return env.done();
  }
  const bh = attr("[data-ll-bhint]", "llBhint");
  if (bh) {
    const p = (ls.practice[bh] ||= {});
    p.hint = Math.min(2, (p.hint || 0) + 1);
    return env.done();
  }
  const bridge = t.closest("[data-ll-bridge]");
  if (bridge) {
    const it = C.BRIDGE_ITEMS.find((x) => x.id === bridge.dataset.llBridge);
    const p = (ls.practice[it.id] ||= {});
    const r = K.checkBridge(it, bridge.dataset.word, p.tries || 0);
    env.record({
      task: it.id,
      ok: r.ok,
      kind: p.tries ? "revision" : "first",
      supported: (p.tries || 0) >= 1 || (p.hint || 0) > 0,
      use: "Explain",
      extra: { job: r.job },
    });
    p.tries = (p.tries || 0) + 1;
    p.result = r;
    if (r.ok) {
      p.ok = true;
      p.answer = bridge.dataset.word;
    }
    announce(I.S(r.message.en, r.message.es), { toast: false });
    return env.done();
  }
  return false;
}

export function key(e, env) {
  if (env.step !== 2) return false;
  const k = e.key.toLowerCase();
  if (k === "w" && env.band === "6-8") {
    const ex = env.ls.explore;
    ex.mode = ex.mode === "weigh" ? "connect" : "weigh";
    e.preventDefault();
    return env.done();
  }
  if (/^[1-9]$/.test(k) && !(env.band === "6-8" && env.ls.explore.mode === "weigh")) {
    const w = palette(env.band)[Number(k) - 1];
    if (!w) return false;
    e.preventDefault();
    document.querySelector(`[data-ll-connector="${w}"]`)?.click();
    return true;
  }
  return false;
}
