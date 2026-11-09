// Language City: one mission, step by step (/city/<building>/<mission>). The learner picks a support (on my own, a word
// bank or sentence frames), then works through the chain: read, listen, respond, ask, repair and say it. A finished run
// goes to the evidence ledger as src "city": independent when no help was used, supported otherwise.
import { crumbsHTML } from "../components.js";
import { LEARNER_LOOKS } from "./scenario-art.js";
import { BASE, announce, html, icon, raw } from "../util.js";
import { TAGS } from "../lang/scenarios.js";
import {
  ROLE_COPY,
  SUPPORTS,
  SUPPORT_COPY,
  checkBuild,
  checkChoice,
  checkSay,
  finishAttempt,
  isIndependent,
  newAttempt,
  openHelp,
  optionOrder,
  recordTry,
  runsOf,
  setSupport,
  stepDone,
} from "../lang/city.js";
import { bandFor, recordEvidence, speakBtn } from "./studio-kit.js";
import { interiorSVG } from "./city-art.js";
import { cityState, saveCity, syncUi, ui } from "./city-state.js";

const P = (I, pair) => I.T(pair.en, pair.es);
const PS = (I, pair) => I.S(pair.en, pair.es);
export const cityHref = (path, band) => `${BASE}/city${path ? `/${path}` : ""}?grades=${band}`;
const roleLabel = (I, role) => I.T(ROLE_COPY[role][0], ROLE_COPY[role][1]);

const supportPicker = (I, support, compact) =>
  html`<fieldset
    class="sk-levels city-supports ${compact ? "is-compact" : ""}"
    role="radiogroup"
    aria-label="${I.S("Support for this mission", "Apoyo para esta misión")}"
  >
    <legend>${I.T("Support for this mission", "Apoyo para esta misión")}</legend>
    ${SUPPORTS.map((s) => html`<button type="button" class="sk-level ${s === support ? "is-on" : ""}" data-ct-support="${s}" role="radio" aria-checked="${String(s === support)}">${I.T(SUPPORT_COPY[s][0], SUPPORT_COPY[s][1])}</button>`)}
    <p class="fine">
      ${compact ? I.T("A word bank or sentence frames mark this attempt as supported.", "Un banco de palabras o estructuras marca este intento como con apoyo.") : I.T(SUPPORT_COPY[support][2], SUPPORT_COPY[support][3])}
    </p>
  </fieldset>`;

const pips = (I, mission, att) =>
  html`<ol class="city-pips" aria-label="${I.S("Mission steps", "Pasos de la misión")}">
    ${mission.steps.map((s, i) => {
      const done = stepDone(att, s);
      const here = i === att.i && !att.done;
      return html`<li
        class="${done ? "is-done" : ""} ${here ? "is-here" : ""}"
        ${here ? raw('aria-current="step"') : ""}
      >
        <span class="city-pip-n" aria-hidden="true">${done ? icon("check") : i + 1}</span
        ><span>${roleLabel(I, s.role)}</span>
      </li>`;
    })}
  </ol>`;

function introHTML(ctx, I, st, building, mission) {
  const band = bandFor(ctx.band);
  const runs = runsOf(st.prog[mission.id]);
  return html`<section class="panel city-intro" aria-labelledby="ct-intro-h">
    <h2 id="ct-intro-h">${I.T("Before you start", "Antes de empezar")}</h2>
    <p><b>${I.T("Your goal:", "Tu meta:")}</b> ${P(I, mission.goal)}</p>
    <p class="fine">
      ${I.T(`${mission.steps.length} steps, in this order. No clock and no score.`, `${mission.steps.length} pasos, en este orden. Sin reloj y sin puntaje.`)}
    </p>
    <ol class="city-chain">
      ${mission.steps.map((s) => html`<li><b>${roleLabel(I, s.role)}</b> <span>${I.T(ROLE_COPY[s.role][2], ROLE_COPY[s.role][3])}</span></li>`)}
    </ol>
    ${supportPicker(I, st.support, false)}
    <div class="wl-actions">
      <button type="button" class="btn btn-primary btn-big" data-ct-start>
        ${icon("flag")}
        ${runs ? I.T("Start again", "Empezar otra vez") : I.T("Start the mission", "Empezar la misión")}
      </button>
      <a class="btn" href="${cityHref(building.id, band)}"
        >${icon("arrow-left")} ${I.T("Back to the building", "Volver al edificio")}</a
      >
    </div>
  </section>`;
}

// ── what the learner reads or hears ───────────────────────────────────────────
function stimHTML(I, building, step) {
  const s = step.stim;
  if (s.type === "doc")
    return html`<figure class="city-doc is-${s.kind}">
      <figcaption>
        ${s.head.en}${ui.es ? html`<small lang="es">${s.head.es}</small>` : ""}
      </figcaption>
      <ul>
        ${s.lines.map((l) => html`<li>${l.en}${ui.es ? html`<small lang="es">${l.es}</small>` : ""}</li>`)}
      </ul>
    </figure>`;
  return html`<div
    class="scn-bubble is-npc city-say"
    role="group"
    aria-label="${building.npc.name}"
  >
    <p class="scn-name">${building.npc.name} · ${P(I, building.npc.role)}</p>
    <div class="wl-actions">
      ${speakBtn(I, s.en)}
      <button type="button" class="btn small" data-ct-words aria-pressed="${String(ui.words)}">
        ${icon("reading")}
        ${ui.words ? I.T("Words shown", "Palabras visibles") : I.T("Show the words", "Mostrar las palabras")}
      </button>
    </div>
    ${
      ui.words
        ? html`<p class="scn-say">${s.en}</p>
            ${ui.es ? html`<p class="scn-say-es" lang="es">${s.es}</p>` : ""}`
        : html`<p class="fine">
            ${I.T("Listen first. The words stay hidden until you ask for them; that counts as help.", "Primero escucha. Las palabras siguen ocultas hasta que las pidas; eso cuenta como ayuda.")}
          </p>`
    }
  </div>`;
}

const helpBar = (I, step) => {
  const hint = step.hint || { en: TAGS[step.target][2], es: TAGS[step.target][2] };
  return html`<div class="wl-actions city-helpbar">
      <button type="button" class="btn small" data-ct-hint aria-pressed="${String(ui.hint)}">${icon("bulb")} ${I.T("Hint", "Pista")}</button>
      ${step.kind === "choose" ? html`<button type="button" class="btn small" data-ct-es aria-pressed="${String(ui.es)}">${icon("language")} ${ui.es ? I.T("Hide Spanish", "Ocultar español") : I.T("Spanish help", "Ayuda en español")}</button>` : ""}
    </div>
    ${ui.hint ? html`<p class="wl-feedback is-try city-hint" role="status">${icon("bulb")} ${P(I, hint)}</p>` : ""}`;
};

function supportBoxHTML(I, att, step) {
  if (att.support === "bank")
    return html`<div class="city-box city-bank">
      <h3>${I.T("Word bank", "Banco de palabras")}</h3>
      <ul class="city-chips">
        ${step.bank.map((w) => html`<li><b>${w.en}</b> <span lang="es">${w.es}</span></li>`)}
      </ul>
    </div>`;
  if (att.support === "frame")
    return html`<div class="city-box city-frame">
      <h3>${I.T("Sentence frame", "Estructura de oración")}</h3>
      <p class="city-frame-text">${step.frame.en}</p>
      <p class="fine" lang="es">${step.frame.es}</p>
    </div>`;
  return "";
}

// ── the three kinds of step ───────────────────────────────────────────────────
function chooseHTML(I, mission, att, step) {
  const solved = att.res[step.id];
  const order = optionOrder(mission.id, step);
  const rightId = solved?.pick || (ui.fb?.ok ? ui.fb.id : null);
  return html`<div
    class="wl-choices city-opts"
    role="group"
    aria-label="${I.S("Choose one", "Elige una")}"
  >
    ${order.map((idx, pos) => {
      const o = step.opts[idx];
      const right = solved && o.id === rightId;
      const wrong = ui.picked.includes(o.id);
      return html`<button
        type="button"
        class="wl-choice city-opt ${right ? "is-right" : ""} ${wrong ? "is-wrong" : ""}"
        data-ct-pick="${o.id}"
        aria-disabled="${String(Boolean(solved || wrong))}"
      >
        <span class="city-letter" aria-hidden="true">${String.fromCharCode(65 + pos)}</span>
        <span>${o.en}${ui.es ? html`<small lang="es">${o.es}</small>` : ""}</span>
      </button>`;
    })}
  </div>`;
}

function buildHTML(I, att, step) {
  const solved = att.res[step.id];
  const seq = solved?.seq || ui.seq;
  const words = seq.map((i) => step.tiles[i]).join(" ");
  return html`<p class="city-intent"><b>${I.T("Say this:", "Di esto:")}</b> ${P(I, step.intent)}</p>
    <p class="city-sentence" id="ct-sentence" aria-live="polite">
      ${words || html`<span class="fine">${I.T("Tap the words in order to build your sentence.", "Toca las palabras en orden para formar tu oración.")}</span>`}
    </p>
    <div class="city-tiles" role="group" aria-label="${I.S("Word tiles", "Fichas de palabras")}">
      ${step.tiles.map((t, i) => {
        const at = seq.indexOf(i);
        return html`<button
          type="button"
          class="city-tile ${at >= 0 ? "is-on" : ""}"
          data-ct-tile="${i}"
          aria-pressed="${String(at >= 0)}"
          aria-disabled="${String(Boolean(solved))}"
        >
          ${t}${at >= 0 ? html`<small>${I.T(`position ${at + 1}`, `posición ${at + 1}`)}</small>` : ""}
        </button>`;
      })}
    </div>
    ${solved ? "" : html`<div class="wl-actions"><button type="button" class="btn btn-primary" data-ct-check>${I.T("Check my sentence", "Revisar mi oración")}</button><button type="button" class="btn" data-ct-clear>${icon("retry")} ${I.T("Clear", "Borrar")}</button></div>`}`;
}

function sayHTML(I, att, step) {
  const solved = att.res[step.id]?.ok;
  return html`<label class="wl-q"
      ><span>${P(I, step.prompt)}</span>
      <textarea rows="3" data-ct-text ${solved ? raw("readonly") : ""}>${ui.text}</textarea>
    </label>
    ${solved ? "" : html`<div class="wl-actions"><button type="button" class="btn btn-primary" data-ct-say>${I.T("Check my words", "Revisar mis palabras")}</button></div>`}
    <p class="fine">
      ${I.T("The check looks at your words only, never your accent or speed.", "La revisión mira solo tus palabras, nunca tu acento ni tu velocidad.")}
    </p>`;
}

function feedbackHTML(I, att, step) {
  const solved = att.res[step.id];
  if (step.kind === "say") {
    const r = ui.fb;
    if (r?.empty)
      return html`<p class="fine" role="status">
        ${I.T("Type something first.", "Primero escribe algo.")}
      </p>`;
    const res = r || (solved ? { ok: solved.ok, label: TAGS[step.target], hint: "" } : null);
    if (!res) return "";
    const [en, es] = TAGS[step.target];
    return html`<div class="wl-feedback ${res.ok ? "is-right" : "is-try"}" role="status">
      <p>
        <b
          >${icon(res.ok ? "check" : "bulb")}
          ${res.ok ? I.T(`Your words show: ${en.toLowerCase()}.`, `Tus palabras muestran: ${es.toLowerCase()}.`) : I.T(`Not yet: ${en.toLowerCase()}.`, `Todavía no: ${es.toLowerCase()}.`)}</b
        >
      </p>
      ${res.ok ? "" : html`<p>${res.hint || TAGS[step.target][2]}</p>`}${res.ok ? "" : html`<p class="fine">${I.T("Change your words and check again, or go on when you are ready.", "Cambia tus palabras y revisa otra vez, o sigue cuando estés listo.")}</p>`}
    </div>`;
  }
  const fb = ui.fb;
  if (fb?.empty)
    return html`<p class="fine" role="status">
      ${I.T("Tap some words first.", "Primero toca algunas palabras.")}
    </p>`;
  if (fb)
    return html`<div class="wl-feedback ${fb.ok ? "is-right" : "is-try"}" role="status">
      <p>
        <b
          >${icon(fb.ok ? "check" : "bulb")}
          ${fb.ok ? I.T("That works.", "Eso funciona.") : I.T("Not quite.", "Todavía no.")}</b
        >
      </p>
      ${fb.why ? html`<p>${P(I, fb.why)}</p>` : ""}
    </div>`;
  if (solved && step.kind === "choose") {
    const o = step.opts.find((x) => x.id === solved.pick);
    return html`<div class="wl-feedback is-right" role="status">
      <p><b>${icon("check")} ${I.T("That works.", "Eso funciona.")}</b></p>
      ${o ? html`<p>${P(I, o.why)}</p>` : ""}
    </div>`;
  }
  return "";
}

function stepHTML(ctx, I, st, building, mission, att) {
  const step = mission.steps[att.i];
  syncUi(mission.id, step.id);
  const done = stepDone(att, step);
  const solved = step.kind === "say" ? Boolean(att.res[step.id]?.ok) : done;
  const last = att.i === mission.steps.length - 1;
  const heading =
    step.kind === "build"
      ? P(I, step.intent)
      : step.kind === "say"
        ? P(I, step.prompt)
        : P(I, step.ask);
  return html`${pips(I, mission, att)} ${supportPicker(I, att.support, true)}
    <section class="panel city-step" aria-labelledby="ct-step-h">
      <p class="eyebrow">
        ${I.T(`Step ${att.i + 1} of ${mission.steps.length}`, `Paso ${att.i + 1} de ${mission.steps.length}`)}
        · ${roleLabel(I, step.role)}
      </p>
      <h2 id="ct-step-h" tabindex="-1">${heading}</h2>
      ${step.kind === "choose" ? stimHTML(I, building, step) : ""}
      ${solved ? "" : html`${helpBar(I, step)}${supportBoxHTML(I, att, step)}`}
      ${step.kind === "choose" ? chooseHTML(I, mission, att, step) : step.kind === "build" ? buildHTML(I, att, step) : sayHTML(I, att, step)}
      <div aria-live="polite">${feedbackHTML(I, att, step)}</div>
      ${done ? html`<div class="wl-actions"><button type="button" class="btn btn-primary" data-ct-next>${last ? I.T("Finish the mission", "Terminar la misión") : I.T("Next step", "Siguiente paso")} ${icon("arrow-right")}</button></div>` : ""}
    </section>`;
}

function summaryHTML(ctx, I, st, building, mission, att, next) {
  const band = bandFor(ctx.band);
  const independent = isIndependent(att);
  return html`<section class="panel city-summary" aria-labelledby="ct-sum-h">
    <h2 id="ct-sum-h" tabindex="-1">
      ${icon("check")} ${I.T("Mission finished", "Misión terminada")}
    </h2>
    <p class="city-badge ${independent ? "is-independent" : "is-supported"}">
      ${independent ? I.T("Finished on my own", "Terminada por mi cuenta") : I.T("Finished with support", "Terminada con apoyo")}
    </p>
    <p>
      ${independent ? I.T("This run is saved on this device as independent practice. Nothing here is a score or a level.", "Esta vuelta se guarda en este dispositivo como práctica independiente. Nada aquí es un puntaje ni un nivel.") : I.T("You used help, so this run is saved as supported practice. When you are ready, play again on your own.", "Usaste ayuda, así que esta vuelta se guarda como práctica con apoyo. Cuando estés listo, juégala otra vez por tu cuenta.")}
    </p>
    <ol class="city-recap">
      ${mission.steps.map((s) => html`<li><b>${roleLabel(I, s.role)}</b>: ${att.first[s.id] ? I.T("right on the first try", "bien al primer intento") : I.T("needed another try", "necesitó otro intento")}</li>`)}
    </ol>
    <div class="wl-actions">
      <button type="button" class="btn btn-primary" data-ct-replay>
        ${icon("retry")} ${I.T("Play again", "Jugar otra vez")}
      </button>
      ${next ? html`<a class="btn" href="${cityHref(`${next.place}/${next.id}`, band)}">${I.T("Next mission", "Siguiente misión")} ${icon("arrow-right")}</a>` : ""}
      <a class="btn" href="${cityHref(building.id, band)}"
        >${I.T("Back to the building", "Volver al edificio")}</a
      >
      <a class="btn" href="${cityHref("", band)}">${I.T("City map", "Mapa de la ciudad")}</a>
    </div>
  </section>`;
}

/** The mission page. `next` is the next mission to suggest (or null). */
export function missionPage(ctx, I, building, mission, next) {
  const band = bandFor(ctx.band);
  const st = cityState();
  const att = st.att && st.att.m === mission.id && st.att.p === mission.place ? st.att : null;
  const learner = LEARNER_LOOKS[st.look] || LEARNER_LOOKS[0];
  const step = att && !att.done ? mission.steps[att.i] : null;
  const art = interiorSVG(building, {
    npc: building.npc,
    learner,
    mood: step?.mood || "happy",
    label: PS(I, {
      en: `${building.name.en}: ${building.npc.name} the ${building.npc.role.en}`,
      es: `${building.name.es}: ${building.npc.name}, ${building.npc.role.es}`,
    }),
  });
  const body = !att
    ? introHTML(ctx, I, st, building, mission)
    : att.done
      ? summaryHTML(ctx, I, st, building, mission, att, next)
      : stepHTML(ctx, I, st, building, mission, att);
  return html`${crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language City", "Ciudad del lenguaje"), cityHref("", band)],
        [PS(I, building.name), cityHref(building.id, band)],
        [PS(I, mission.title), null],
      ],
      { i18n: I },
    )}
    <article class="city-mission">
      <header class="act-head">
        <h1 tabindex="-1">${P(I, mission.title)}</h1>
        <p class="lead">
          <b>${PS(I, building.name)}</b> · ${building.npc.name}, ${P(I, building.npc.role)}
        </p>
      </header>
      <div class="city-stage">${raw(art)}</div>
      ${body}
    </article>`;
}

// ── events ───────────────────────────────────────────────────────────────────
function finish(ctx, st, mission, att) {
  const prior = runsOf(st.prog[mission.id]);
  const { stats } = finishAttempt(st.prog, att, mission);
  att.done = true;
  recordEvidence({
    src: "city",
    task: `${mission.place}/${mission.id}`,
    band: bandFor(ctx.band),
    domain: "Speaking",
    use: mission.use,
    level: "C",
    opened: { ...att.opened },
    kind: prior === 0 ? "first" : "retry",
    m: {
      steps: stats.steps,
      firstTry: stats.firstTry,
      retries: stats.retries,
      helps: stats.helps,
      targets: stats.targets,
    },
  });
}

/** Click handler for the mission page. Returns true when the click was one of ours. */
export function onMissionClick(e, ctx, mission, I, next) {
  const t = e.target;
  const st = cityState();
  const att = st.att && st.att.m === mission.id && st.att.p === mission.place ? st.att : null;
  const rerender = () => (saveCity(st), ctx.rerender(), true);
  const sup = t.closest("[data-ct-support]");
  if (sup) {
    st.support = sup.dataset.ctSupport;
    if (att && !att.done) setSupport(att, st.support);
    return rerender();
  }
  if (t.closest("[data-ct-start]")) {
    st.att = newAttempt(mission, st.support);
    announce(I.S("Mission started.", "Misión iniciada."));
    return rerender();
  }
  if (t.closest("[data-ct-replay]")) {
    st.att = null;
    return rerender();
  }
  if (!att || att.done) return false;
  const step = mission.steps[att.i];
  if (t.closest("[data-ct-hint]")) {
    ui.hint = !ui.hint;
    if (ui.hint) openHelp(att, "hint");
    return rerender();
  }
  if (t.closest("[data-ct-words]")) {
    ui.words = true;
    openHelp(att, "hint");
    return rerender();
  }
  if (t.closest("[data-ct-es]")) {
    ui.es = !ui.es;
    if (ui.es) openHelp(att, "l1");
    return rerender();
  }
  if (stepDone(att, step) && t.closest("[data-ct-next]")) {
    if (att.i < mission.steps.length - 1) att.i += 1;
    else finish(ctx, st, mission, att);
    return rerender();
  }
  // A solved step is closed. The "say it" step stays open until its words show the target; the learner may go on after any check.
  if (stepDone(att, step) && !(step.kind === "say" && !att.res[step.id].ok)) return false;
  const pick = t.closest("[data-ct-pick]");
  if (pick && step.kind === "choose") {
    const id = pick.dataset.ctPick;
    if (ui.picked.includes(id)) return true;
    const r = checkChoice(step, id);
    recordTry(att, step, r.ok, { pick: id });
    if (!r.ok) ui.picked.push(id);
    ui.fb = { ...r, id };
    announce(r.ok ? I.S("That works.", "Eso funciona.") : I.S("Not quite.", "Todavía no."));
    return rerender();
  }
  const tile = t.closest("[data-ct-tile]");
  if (tile && step.kind === "build") {
    const i = Number(tile.dataset.ctTile);
    ui.seq = ui.seq.includes(i) ? ui.seq.filter((x) => x !== i) : [...ui.seq, i];
    ui.fb = null;
    return rerender();
  }
  if (t.closest("[data-ct-clear]")) {
    ui.seq = [];
    ui.fb = null;
    return rerender();
  }
  if (t.closest("[data-ct-check]") && step.kind === "build") {
    const r = checkBuild(
      step,
      ui.seq.map((i) => step.tiles[i]),
    );
    if (!r.empty) recordTry(att, step, r.ok, { seq: [...ui.seq] });
    ui.fb = r;
    if (!r.empty)
      announce(r.ok ? I.S("That works.", "Eso funciona.") : I.S("Not quite.", "Todavía no."));
    return rerender();
  }
  if (t.closest("[data-ct-say]") && step.kind === "say") {
    const r = checkSay(step, ui.text);
    if (!r.empty) recordTry(att, step, r.ok);
    ui.fb = r;
    return rerender();
  }
  return false;
}

/** Typing in the "say it" box is kept on screen only; it is never saved. */
export function onMissionInput(e) {
  const box = e.target.closest?.("[data-ct-text]");
  if (!box) return false;
  ui.text = box.value;
  return true;
}

