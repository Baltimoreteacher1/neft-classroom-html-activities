// Verb Time Machine, steps 1-5. Step 2 is a real time-travel scrubber: a native range slider (so it works with a
// finger, a mouse and the arrow keys) moves a time machine along an illustrated timeline and the verb morphs live.
// The scrubber repaints in place (no full re-render) so dragging stays smooth and focus never jumps.
import * as C from "../content/language-labs.js";
import * as K from "../lang/labs-check.js";
import { announce, html, icon, raw, toHtml } from "../util.js";
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
import { ICON_OF, iconUse, sceneHTML, sceneVars } from "./verb-art.js";
import {
  ASPECT,
  MENTOR_MARKS,
  breakIt,
  clampStop,
  phaseOf,
  sentenceFor,
  visit,
} from "./verb-model.js";

export const GUIDED_TENSE = { "3-5": "past", "6-8": "past-perfect" };

const ASPECT_TEXT = {
  point: ["a finished action, before now", "una acción terminada, antes de ahora"],
  earlier: [
    "one action finished before another past action",
    "una acción terminada antes de otra acción pasada",
  ],
  stretch: [
    "an action in progress at a moment in the past",
    "una acción en progreso en un momento del pasado",
  ],
  link: [
    "an action that began in the past and reaches now",
    "una acción que empezó en el pasado y llega hasta ahora",
  ],
  habit: ["an action that repeats again and again", "una acción que se repite una y otra vez"],
  now: ["an action happening right now", "una acción que pasa ahora mismo"],
  plan: ["an action planned for later", "una acción planeada para después"],
};

export const keys = (step) =>
  step === 2
    ? [
        [
          ["1", "–", "7"],
          "Jump to a stop on the timeline",
          "Ir a una parada de la línea del tiempo",
        ],
        [[",", "."], "Go earlier or later in time", "Ir antes o después en el tiempo"],
        [["B"], "Break it on or off", "Activar o desactivar Romperlo"],
        [
          ["←", "→"],
          "Move the slider (when it has focus)",
          "Mover el deslizador (cuando tiene el foco)",
        ],
      ]
    : [];

// ── model for the explore step ───────────────────────────────────────────────
function model(env) {
  const stops = C.VERB_STOPS[env.band];
  const ex = env.ls.explore;
  const idx = ex.verb ?? 0;
  const v = C.VERB_EXPLORE[idx] || C.VERB_EXPLORE[0];
  const at = clampStop(ex.at, stops);
  const tense = stops[at];
  return { stops, v, idx, at, tense, s: sentenceFor(C.STOP_CUES[tense][0], v, tense) };
}

const tiles = (s) =>
  html`${s.helper ? html`<span class="vm-tile is-h">${s.helper}</span> ` : ""}<span
      class="vm-tile is-m"
      >${s.main}</span
    >`;

const sentenceInner = (s) => html`${s.cue} ${s.subject} ${tiles(s)} ${s.rest}.`;

/** The part of the machine that changes as the learner scrubs: sentence, picture caption, anatomy, Break it. */
function readoutHTML(I, env, m) {
  const anat = C.STOP_ANATOMY[m.tense];
  const brk = env.ui.vm?.brk;
  const bad = brk ? breakIt(m.tense, m.v) : null;
  const badText = bad ? `${m.s.cue} ${m.s.subject} ${bad.form} ${m.s.rest}.` : "";
  const aspect = ASPECT_TEXT[ASPECT[m.tense]];
  return html`<p class="ll-sentence vm-sentence" lang="en">${sentenceInner(m.s)}</p>
    <p class="vm-change" lang="en">
      <span class="vm-base">${m.v.base}</span><span aria-hidden="true">→</span
      ><strong>${m.s.form}</strong>
    </p>
    <p class="vm-caption">
      ${icon("clock")}
      <span
        ><strong>${I.T(...K.TENSE_NAMES[m.tense])}:</strong>
        ${I.T(`In the picture: ${aspect[0]}.`, `En la imagen: ${aspect[1]}.`)}</span
      >
    </p>
    ${
      bad
        ? html`<div class="vm-break" role="group" aria-label="${I.S("Break it", "Romperlo")}">
            <p class="eyebrow">
              ${I.T("Break it: what if we picked another form?", "Romperlo: ¿y si elegimos otra forma?")}
            </p>
            <p class="vm-broken" lang="en">
              ${m.s.cue} ${m.s.subject} <span class="vm-tile is-bad">${bad.form}</span> ${m.s.rest}.
            </p>
            <p>
              ${I.T(
                `The form “${bad.form}” shows that ${bad.says[0]}. The clue “${m.s.cue.replace(/,$/, "")}” tells us that ${bad.means[0]}. When they disagree, the reader has to guess.`,
                `La forma «${bad.form}» indica que ${bad.says[1]}. La pista «${m.s.cue.replace(/,$/, "")}» nos dice que ${bad.means[1]}. Cuando no coinciden, el lector tiene que adivinar.`,
              )}
            </p>
            <p class="fine">${I.T(`Fix: ${anat.formula[0]}.`, `Arreglo: ${anat.formula[1]}.`)}</p>
            ${speakBtn(I, badText, "Hear the mix-up", "Escuchar el error")}
          </div>`
        : ""
    }
    <div class="ll-anatomy" aria-label="${I.S("Verb anatomy", "Anatomía del verbo")}">
      <div class="ll-anatomy-grid">
        <div>
          <span class="ll-anatomy-k">${I.T("Time clue", "Pista de tiempo")}</span
          ><strong lang="en">${m.s.cue.replace(/,$/, "")}</strong>
        </div>
        <div>
          <span class="ll-anatomy-k">${I.T("Tense", "Tiempo verbal")}</span
          ><strong>${I.T(...K.TENSE_NAMES[m.tense])}</strong>
        </div>
        <div>
          <span class="ll-anatomy-k">${I.T("How it's built", "Cómo se forma")}</span
          ><strong>${I.T(...anat.formula)}</strong>
        </div>
        <div>
          <span class="ll-anatomy-k">${I.T("Verb form", "Forma verbal")}</span
          ><strong lang="en">${m.v.base} → ${m.s.form}</strong>
        </div>
      </div>
      <p class="ll-anatomy-when">${I.T(...anat.when)}</p>
    </div>`;
}

const live = (I, m) => I.S(...K.TENSE_NAMES[m.tense]);

/** Repaint the machine in place for the current stop. Safe to call on every input event. */
export function paint(env) {
  const root = document.querySelector("[data-vm]");
  if (!root) return;
  const { I } = env;
  const m = model(env);
  const scene = root.querySelector("[data-vm-scene]");
  Object.assign(scene.dataset, {
    tense: m.tense,
    phase: phaseOf(m.tense),
    aspect: ASPECT[m.tense],
  });
  scene.setAttribute("style", sceneVars(m.tense));
  for (const u of scene.querySelectorAll("use.vm-i"))
    u.setAttribute("href", `#vm-i-${ICON_OF[m.v.base] || "study"}`);
  root.querySelector("[data-vm-readout]").innerHTML = toHtml(readoutHTML(I, env, m));
  const slide = root.querySelector("[data-ll-slide]");
  slide.value = String(m.at);
  slide.setAttribute("aria-valuetext", `${live(I, m)}: ${m.s.text}`);
  for (const b of root.querySelectorAll("[data-ll-stop]")) {
    const on = Number(b.dataset.llStop) === m.at;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  }
  for (const b of document.querySelectorAll("[data-ll-verb]")) {
    const on = Number(b.dataset.llVerb) === m.idx;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-pressed", String(on));
  }
  const brk = document.querySelector("[data-ll-break]");
  brk?.setAttribute("aria-pressed", String(Boolean(env.ui.vm?.brk)));
  brk?.classList.toggle("is-on", Boolean(env.ui.vm?.brk));
  const main = document.querySelector("[data-ll-speak-main]");
  if (main) main.dataset.llSpeak = m.s.text;
  const disc = document.querySelector("[data-ll-disc-host]");
  if (disc)
    disc.innerHTML = toHtml(
      discoveryHTML(I, env.lab, 2, env.ls, env.ls.explore.visited?.length || 0),
    );
}

function goTo(env, at) {
  const m = model(env);
  const next = clampStop(at, m.stops);
  env.ls.explore.at = next;
  env.ls.explore.visited = visit(env.ls.explore.visited, next);
  env.save();
  paint(env);
  return next;
}

const speakAndSay = (env) => {
  const m = model(env);
  announce(`${live(env.I, m)}: ${m.s.text}`, { toast: false });
};

// ── steps ────────────────────────────────────────────────────────────────────
function seeStep(I, band) {
  const stops = C.VERB_STOPS[band];
  const mentor = C.VERB_MENTOR[band];
  const v = { subject: "Maya", base: "walk", rest: "to school" };
  return html`<section class="panel ll-see vm-see">
    ${panelHead(I, ["Step 1 · Notice the Pattern", "Paso 1 · Observa el patrón"], ["Every action happens at a time", "Cada acción pasa en un momento"])}
    <p>
      ${I.T("English shows WHEN an action happens by changing the verb. A time word (yesterday, now, tomorrow) is your clue; the verb has to agree with it.", "El inglés muestra CUÁNDO pasa una acción cambiando el verbo. Una palabra de tiempo (yesterday, now, tomorrow) es tu pista; el verbo tiene que coincidir con ella.")}
    </p>
    <ol class="vm-ribbon" style="--n:${stops.length}">
      ${stops.map((tense) => {
        const s = sentenceFor(C.STOP_CUES[tense][0], v, tense);
        return html`<li class="vm-card" data-phase="${phaseOf(tense)}">
          <span class="vm-card-k">${I.TARGET(...C.STOP_SHORT[tense])}</span>
          <p class="vm-card-s" lang="en">${sentenceInner(s)}</p>
          <p class="fine">
            <strong>${I.T(...K.TENSE_NAMES[tense])}</strong> ·
            ${I.T(...C.STOP_ANATOMY[tense].formula)}
          </p>
          ${speakBtn(I, s.text)}
        </li>`;
      })}
    </ol>
    ${mentorHTML(I, mentor, markPhrases(mentor.passage, MENTOR_MARKS[band], "vm-mark"))}
    ${compareCardHTML(I, C.VERB_COMPARE[band])}
  </section>`;
}

function exploreStep(env) {
  const { I, ls } = env;
  const m = model(env);
  const brk = Boolean(env.ui.vm?.brk);
  const n = m.stops.length;
  return html`<section class="panel ll-explore vm" aria-labelledby="vmH">
    ${panelHead(
      I,
      [
        "Step 2 · Interactive Timeline Workbench",
        "Paso 2 · Banco interactivo de la línea del tiempo",
      ],
      ["Move the action through time", "Mueve la acción en el tiempo"],
      html`<button
        type="button"
        class="btn small ghost ll-speak-btn"
        data-ll-speak="${m.s.text}"
        data-ll-speak-main
        aria-label="${I.S("Listen to sentence", "Escuchar oración")}"
      >
        ${icon("volume")} <span>${I.T("Listen to sentence", "Escuchar oración")}</span>
      </button>`,
      "vmH",
    )}
    <div
      class="vm-actions"
      role="group"
      aria-label="${I.S("Choose an action", "Elige una acción")}"
    >
      <span class="ll-strip-label">${I.T("Choose an action:", "Elige una acción:")}</span>
      ${C.VERB_EXPLORE.map(
        (x, i) =>
          html`<button
            type="button"
            class="chip vm-act ${i === m.idx ? "is-on" : ""}"
            data-ll-verb="${i}"
            aria-pressed="${i === m.idx}"
            lang="en"
          >
            ${iconUse(x.base)}<span>${x.subject} · ${x.base}</span>
          </button>`,
      )}
    </div>
    <div class="vm-machine" data-vm>
      ${sceneHTML(I, m.v, m.tense)}
      <div class="vm-scrub" style="--n:${n}">
        <label class="vm-scrub-label" for="llSlide"
          >${icon("clock")}
          ${I.T("Drag the time machine, or use the arrow keys", "Arrastra la máquina del tiempo o usa las flechas del teclado")}</label
        >
        <input
          id="llSlide"
          class="vm-range"
          type="range"
          min="0"
          max="${n - 1}"
          step="1"
          value="${m.at}"
          data-ll-slide
          data-nsr-ignore
          aria-valuetext="${live(I, m)}: ${m.s.text}"
        />
        <div
          class="vm-stops"
          role="group"
          aria-label="${I.S("Timeline stops", "Paradas de la línea del tiempo")}"
        >
          ${m.stops.map(
            (s, i) =>
              html`<button
                type="button"
                class="chip vm-stop ${i === m.at ? "is-on" : ""}"
                data-ll-stop="${i}"
                aria-pressed="${i === m.at}"
              >
                <span class="vm-stop-n" aria-hidden="true">${i + 1}</span>${I.TARGET(...C.STOP_SHORT[s])}
              </button>`,
          )}
        </div>
      </div>
      <div class="vm-readout" data-vm-readout>${readoutHTML(I, env, m)}</div>
      <div class="row-actions vm-tools">
        <button
          type="button"
          class="btn small ghost vm-break-btn ${brk ? "is-on" : ""}"
          data-ll-break
          aria-pressed="${brk}"
        >
          ${icon("alert")} ${I.T("Break it", "Romperlo")}
        </button>
        <span class="fine"
          >${I.T("Break it shows what a wrong form would say. Nothing is scored.", "Romperlo muestra lo que diría una forma incorrecta. Nada se califica.")}</span
        >
      </div>
    </div>
    <div data-ll-disc-host>
      ${discoveryHTML(I, env.lab, 2, ls, ls.explore.visited?.length || 0)}
    </div>
  </section>`;
}

function exampleStep(env) {
  const { I, ls, band } = env;
  const g = C.VERB_GUIDED[band];
  const tense = GUIDED_TENSE[band];
  const v = { subject: "Maya", base: "visit", rest: "" };
  return guidedHTML(I, ls, g.steps, g.sentence, g.rule, (shown) =>
    shown >= 2
      ? html`<div class="vm-machine is-static">
          ${sceneHTML(I, v, tense)}
          <p class="vm-caption">
            ${icon("clock")}
            <span
              ><strong>${I.T(...K.TENSE_NAMES[tense])}:</strong>
              ${I.T(`In the picture: ${ASPECT_TEXT[ASPECT[tense]][0]}.`, `En la imagen: ${ASPECT_TEXT[ASPECT[tense]][1]}.`)}</span
            >
          </p>
        </div>`
      : "",
  );
}

function practiceStep(env) {
  const { I, ls, band } = env;
  const items = C.VERB_ITEMS.filter((x) => x.band === band);
  const solved = items.filter((it) => ls.practice[it.id]?.ok).length;
  const stops = C.VERB_STOPS[band];
  return html`<section class="panel ll-practice">
    ${panelHead(
      I,
      ["Step 4 · Guided Coaching Practice", "Paso 4 · Práctica con pistas"],
      ["Make the verb match the time", "Haz que el verbo coincida con el tiempo"],
      html`<span class="ll-score-pill" role="status"
        >${icon("check")}
        ${I.T(`${solved} of ${items.length} solved`, `${solved} de ${items.length} resueltas`)}</span
      >`,
    )}
    <p class="fine">
      ${I.T("Type the verb form that fits. A wrong try gives you a clue, not the answer. Stuck? Open a hint.", "Escribe la forma del verbo que encaja. Un intento equivocado te da una pista, no la respuesta. ¿Atascado? Abre una pista.")}
    </p>
    <details class="ll-ref">
      <summary>
        ${icon("bulb")}
        ${I.T("Open Verb Reference Chart (Time Clues & Forms)", "Abrir tabla de referencia de verbos (pistas y formas)")}
      </summary>
      <div class="ll-ref-grid">
        ${stops.map(
          (s) =>
            html`<div class="ll-ref-item">
              <strong>${I.T(...K.TENSE_NAMES[s])}</strong
              ><span
                >${I.T("Clue:", "Pista:")}
                <i lang="en">${C.STOP_CUES[s][0].replace(/,$/, "")}</i></span
              ><span>${I.T(...C.STOP_ANATOMY[s].formula)}</span>
            </div>`,
        )}
      </div>
    </details>
    <ol class="ll-items">
      ${items.map((it) => itemHTML(I, it, ls.practice[it.id] || {}))}
    </ol>
  </section>`;
}

function itemHTML(I, it, p) {
  const [before, after = ""] = it.text.split("___");
  const ans = p.answer || it.accept[0];
  const hints = p.hint || 0;
  return html`<li class="ll-item ${p.ok ? "is-done" : ""}">
    <div class="ll-item-head">
      <p lang="en">
        ${before}${p.ok ? html`<mark>${ans}</mark>` : html`<span class="vm-blank" aria-hidden="true">______</span><span class="visually-hidden">${I.S("blank", "espacio")}</span>`}${after}
        <span class="ll-base">(${it.base})</span>
      </p>
      ${speakBtn(I, p.ok ? it.text.replace("___", ans) : it.text.replace("___", "blank"))}
    </div>
    <div class="row-actions">
      <label
        ><span class="visually-hidden">${I.S("Verb", "Verbo")}</span>
        <input
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          data-ll-answer="${it.id}"
          value="${p.answer || ""}"
          ${p.ok ? raw("readonly") : ""}
          data-nsr-ignore
        />
      </label>
      ${p.ok ? "" : html`<button type="button" class="btn small" data-ll-check="${it.id}">${I.T("Check", "Revisar")}</button>`}
      ${p.ok || hints >= 2 ? "" : html`<button type="button" class="btn small ghost" data-ll-hint="${it.id}">${icon("bulb")} ${hints ? I.T("Another hint", "Otra pista") : I.T("I need a hint", "Necesito una pista")}</button>`}
    </div>
    ${[...Array(hints).keys()].map((i) => {
      const h = K.verbHint(it, i);
      return html`<p class="ll-hint">
        ${icon("bulb")}
        <span><strong>${I.T(`Hint ${i + 1}`, `Pista ${i + 1}`)}:</strong> ${I.T(h.en, h.es)}</span>
      </p>`;
    })}
    ${feedbackHTML(I, p.result)}
    ${p.ok ? html`<p class="vm-formula">${icon("check")} <span>${I.T(...C.STOP_ANATOMY[it.tense].formula)}</span></p>` : ""}
  </li>`;
}

function transferStep(env) {
  const { I, ls, band } = env;
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
          ${lampsHTML([
            [r.shows.past, I.T("something that already happened", "algo que ya pasó")],
            [r.shows.future, I.T("something that will happen", "algo que pasará")],
            [
              r.cues.length > 0,
              html`${I.T("time words", "palabras de tiempo")}${r.cues.length ? html`: <span lang="en">${r.cues.join(", ")}</span>` : ""}`,
            ],
          ])}
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

export function render(env) {
  const { step, I } = env;
  if (step === 1) return seeStep(I, env.band);
  if (step === 2) return exploreStep(env);
  if (step === 3) return exampleStep(env);
  if (step === 4) return practiceStep(env);
  return transferStep(env);
}

/** Number of things the learner tried on the explore step (for the discovery unlock). */
export const tried = (env) => env.ls.explore.visited?.length || 0;

// ── events ───────────────────────────────────────────────────────────────────
export function click(t, env) {
  const { ls, I } = env;
  const stop = t.closest("[data-ll-stop]");
  if (stop) {
    goTo(env, Number(stop.dataset.llStop));
    speakAndSay(env);
    return true;
  }
  const verb = t.closest("[data-ll-verb]");
  if (verb) {
    ls.explore.verb = Number(verb.dataset.llVerb);
    env.save();
    paint(env);
    speakAndSay(env);
    return true;
  }
  if (t.closest("[data-ll-break]")) {
    const vm = (env.ui.vm ||= {});
    vm.brk = !vm.brk;
    paint(env);
    announce(
      vm.brk
        ? I.S("Break it is on. Read the mix-up.", "Romperlo está activado. Lee el error.")
        : I.S("Break it is off.", "Romperlo está desactivado."),
      { toast: false },
    );
    return true;
  }
  const hint = t.closest("[data-ll-hint]");
  if (hint) {
    const p = (ls.practice[hint.dataset.llHint] ||= {});
    p.hint = Math.min(2, (p.hint || 0) + 1);
    announce(I.S("Hint opened below the sentence.", "Pista abierta debajo de la oración."), {
      toast: false,
    });
    return env.done();
  }
  const check = t.closest("[data-ll-check]");
  if (check) {
    const it = C.VERB_ITEMS.find((x) => x.id === check.dataset.llCheck);
    const p = (ls.practice[it.id] ||= {});
    const answer = document.querySelector(`[data-ll-answer="${it.id}"]`)?.value || p.answer || "";
    p.answer = answer;
    const r = K.checkVerb(it, answer, p.tries || 0);
    if (r.got !== "empty") {
      env.record({
        task: it.id,
        ok: r.ok,
        kind: p.tries ? "revision" : "first",
        supported: (p.tries || 0) >= 1 || (p.hint || 0) > 0,
        use: "Narrate",
        extra: { tense: it.tense, got: r.got },
      });
      p.tries = (p.tries || 0) + 1;
    }
    p.result = r;
    if (r.ok || r.reveal) p.ok = r.ok;
    announce(I.S(r.message.en, r.message.es), { toast: false });
    return env.done();
  }
  return false;
}

export function input(t, env) {
  if (!t.matches("[data-ll-slide]")) return false;
  goTo(env, Number(t.value));
  return true;
}

export function change(t, env) {
  if (!t.matches("[data-ll-slide]")) return false;
  speakAndSay(env);
  return true;
}

export function key(e, env) {
  if (env.step !== 2) return false;
  const m = model(env);
  const k = e.key.toLowerCase();
  if (/^[1-9]$/.test(k) && Number(k) <= m.stops.length) goTo(env, Number(k) - 1);
  else if (k === "," || k === ".") goTo(env, m.at + (k === "." ? 1 : -1));
  else if (k === "b") document.querySelector("[data-ll-break]")?.click();
  else return false;
  if (k !== "b") speakAndSay(env);
  e.preventDefault();
  return true;
}
