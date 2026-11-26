// Language City episode: Saturday at the Community Market (/city/market/community-market). An illustrated market the
// learner explores (inspectable signs and goods, a camera that moves between stalls), a conversation to hear with a
// transcript toggle, a price comparison, a shopping task inside a budget, a question rehearsed aloud (with the lab's
// recorder when the browser has one) and a short message saved on this device. The support level (A/B/C, the lab's
// own support tiers) changes what is asked, never the scene. No timer, no score, no network.
import { crumbsHTML } from "../components.js";
import { buildingOf } from "../content/city.js";
import {
  BLURB,
  DIALOGUE,
  EPISODE_ID,
  EPISODE_PLACE,
  LEVELS,
  LEVEL_INFO,
  LISTEN_Q,
  PEOPLE,
  READ_Q,
  SPOTS,
  STALLS,
  STEPS,
  DOMAIN_NAME,
  TITLE,
  spotOf,
} from "../content/city-market-episode.js";
import {
  MARKET_KEY,
  checkCart,
  cleanState,
  connectorsUsed,
  freshVisit,
  levelFor,
  money,
  setAnswer,
  stepDone,
  wordCount,
} from "../lang/city-market.js";
import { speakDialogue } from "../speech.js";
import { BASE, announce, html, icon, raw, safeJson, storage } from "../util.js";
import { marketSceneSVG } from "./city-episode-art.js";
import { STEP_BODY, basketHTML, inspectorHTML, selfCheckText } from "./city-episode-steps.js";
import { cityHref } from "./city-mission.js";
import { bandFor, recordEvidence } from "./studio-kit.js";

export { EPISODE_ID, EPISODE_PLACE };
const P = (I, pair) => I.T(pair.en, pair.es);
const PS = (I, pair) => I.S(pair.en, pair.es);
export const episodeHref = (band) => cityHref(`${EPISODE_PLACE}/${EPISODE_ID}`, band);

// ── saved state (one namespaced key; storage.get/set already catch blocked storage) ──
export const loadMarket = () => cleanState(safeJson(storage.get(MARKET_KEY), null));
const saveMarket = (st) => storage.set(MARKET_KEY, JSON.stringify(st));

/** On-screen only: what is open right now. Reset when the learner leaves the page. */
const ui = {
  stall: "all",
  spot: "",
  es: null,
  transcript: false,
  model: false,
  wrong: [],
  fb: null,
  cartFb: false,
  saveFb: false,
};
export const resetEpisodeUi = () =>
  Object.assign(ui, {
    stall: "all",
    spot: "",
    es: null,
    transcript: false,
    model: false,
    wrong: [],
    fb: null,
    cartFb: false,
    saveFb: false,
  });
/** Spanish help starts on at level A and off otherwise; the learner's own toggle wins. */
const view = (level) => ({ ...ui, es: ui.es ?? level === "A" });

// ── pieces of the page ───────────────────────────────────────────────────────
function levelPicker(I, level) {
  return html`<fieldset
    class="mk-levels"
    role="radiogroup"
    aria-label="${I.S("Support level for this visit", "Nivel de apoyo para esta visita")}"
  >
    <legend>${I.T("Support level for this visit", "Nivel de apoyo para esta visita")}</legend>
    <div class="mk-level-row">
      ${LEVELS.map(
        (l) =>
          html`<button
            type="button"
            class="mk-level ${l === level ? "is-on" : ""}"
            data-mk-level="${l}"
            role="radio"
            aria-checked="${String(l === level)}"
          >
            <strong>${l}</strong> <span>${P(I, LEVEL_INFO[l].label)}</span>
          </button>`,
      )}
    </div>
    <p class="fine">
      ${P(I, LEVEL_INFO[level].expect)}
      ${I.T("The market stays the same at every level.", "El mercado es el mismo en todos los niveles.")}
    </p>
  </fieldset>`;
}

function pipsHTML(I, st, level) {
  return html`<ol
    class="city-pips mk-pips"
    aria-label="${I.S("Visit steps", "Pasos de la visita")}"
  >
    ${STEPS.map((s, i) => {
      const done = stepDone(st, s.id, level);
      const here = i === st.step && !st.done;
      const open = i <= st.reached;
      const label = html`<span class="city-pip-n" aria-hidden="true"
          >${done ? icon("check") : i + 1}</span
        ><span>${P(I, s.title)} <small>${P(I, DOMAIN_NAME[s.domain])}</small></span>`;
      return html`<li class="${done ? "is-done" : ""} ${here ? "is-here" : ""}">
        ${open ? html`<button type="button" class="mk-pip" data-mk-go="${i}" ${here ? raw('aria-current="step"') : ""}>${label}<span class="visually-hidden">${done ? I.S(" (done)", " (hecho)") : ""}</span></button>` : html`<span class="mk-pip is-locked">${label}</span>`}
      </li>`;
    })}
  </ol>`;
}

function stageHTML(I, st) {
  const stall = STALLS.find((s) => s.id === ui.stall) || STALLS[0];
  const label = I.S(
    "The Community Market on a Saturday morning: a chalk sign with the hours, Mr. Delgado's produce stall, Mr. Haddad's bakery stall and Ms. Okafor's farm stand, each with a price board, and Maya with her basket and recipe card.",
    "El Mercado Comunitario un sábado por la mañana: un letrero de tiza con el horario, el puesto de verduras del señor Delgado, el puesto de panadería del señor Haddad y el puesto de la granja de la señora Okafor, cada uno con una pizarra de precios, y Maya con su canasta y su tarjeta de receta.",
  );
  return html`<section class="mk-scene" aria-labelledby="mk-scene-h">
    <h2 id="mk-scene-h" class="visually-hidden">${I.T("The market", "El mercado")}</h2>
    <div class="mk-camera" role="group" aria-label="${I.S("Move the view", "Mover la vista")}">
      ${STALLS.map((s) => html`<button type="button" class="mk-cam ${s.id === stall.id ? "is-on" : ""}" data-mk-stall="${s.id}" aria-pressed="${String(s.id === stall.id)}">${P(I, s.name)}</button>`)}
    </div>
    <div class="mk-stage" data-stall="${stall.id}" style="--fx:${stall.focus / 100}">
      <div class="mk-pan">
        ${raw(marketSceneSVG(label))}
        ${SPOTS.map((s) => {
          const seen = st.seen.includes(s.id);
          return html`<button
            type="button"
            class="mk-spot ${seen ? "is-seen" : ""} ${ui.spot === s.id ? "is-open" : ""}"
            data-mk-spot="${s.id}"
            data-stall-of="${s.stall}"
            style="left:${s.at[0]}%;top:${s.at[1]}%"
            aria-label="${PS(I, { en: `Look at: ${s.label.en}${seen ? " (seen)" : ""}`, es: `Mirar: ${s.label.es}${seen ? " (visto)" : ""}` })}"
          >
            <span class="mk-spot-dot" aria-hidden="true">${seen ? icon("check") : ""}</span>
            <span class="mk-spot-label" aria-hidden="true">${P(I, s.label)}</span>
          </button>`;
        })}
      </div>
    </div>
    <p class="fine mk-stage-note">
      ${I.T("Choose a stall to move closer. On a small screen, the spots appear when you are at a stall.", "Elige un puesto para acercarte. En una pantalla pequeña, los puntos aparecen cuando estás en un puesto.")}
    </p>
  </section>`;
}

function stepPanel(I, st, level) {
  const step = STEPS[st.step];
  const v = view(level);
  const done = stepDone(st, step.id, level);
  const last = st.step === STEPS.length - 1;
  return html`<section class="panel mk-step" aria-labelledby="mk-step-h">
    <p class="eyebrow">
      ${I.T(`Step ${st.step + 1} of ${STEPS.length}`, `Paso ${st.step + 1} de ${STEPS.length}`)} ·
      ${P(I, DOMAIN_NAME[step.domain])}
    </p>
    <h2 id="mk-step-h" tabindex="-1">${P(I, step.title)}</h2>
    <div class="wl-actions mk-helpbar">
      <button type="button" class="btn small" data-mk-es aria-pressed="${String(v.es)}">
        ${icon("language")}
        ${v.es ? I.T("Hide Spanish help", "Ocultar la ayuda en español") : I.T("Spanish help", "Ayuda en español")}
      </button>
    </div>
    ${STEP_BODY[step.id](I, st, v, level)}
    ${done ? html`<div class="wl-actions mk-next"><button type="button" class="btn btn-primary" data-mk-next>${last ? I.T("Finish the visit", "Terminar la visita") : I.T("Next step", "Siguiente paso")} ${icon("arrow-right")}</button></div>` : ""}
  </section>`;
}

function summaryHTML(ctx, I, st, level) {
  const band = bandFor(ctx.band);
  const cart = checkCart(st.cart);
  return html`<section class="panel city-summary mk-summary" aria-labelledby="mk-sum-h">
    <h2 id="mk-sum-h" tabindex="-1">
      ${icon("check")} ${I.T("Market visit finished", "Visita al mercado terminada")}
    </h2>
    <p>
      ${I.T(`You practiced all four domains at support level ${level}. This is practice on this device: nothing here is a score, a level or a test result.`, `Practicaste los cuatro dominios con el nivel de apoyo ${level}. Es práctica en este dispositivo: nada aquí es un puntaje, un nivel ni un resultado de examen.`)}
    </p>
    <ul class="mk-recap">
      <li>
        <b>${P(I, DOMAIN_NAME.Reading)}</b>:
        ${I.T(`${st.seen.length} things inspected, a price comparison and a basket that cost ${money(cart.total)}.`, `${st.seen.length} cosas revisadas, una comparación de precios y una canasta de ${money(cart.total)}.`)}
      </li>
      <li>
        <b>${P(I, DOMAIN_NAME.Listening)}</b>:
        ${I.T("the conversation between Maya and the vendors.", "la conversación entre Maya y los vendedores.")}
      </li>
      <li>
        <b>${P(I, DOMAIN_NAME.Speaking)}</b>:
        ${I.T("a question for a vendor, said aloud.", "una pregunta para una vendedora, dicha en voz alta.")}
      </li>
      <li>
        <b>${P(I, DOMAIN_NAME.Writing)}</b>:
        ${I.T(`a message of ${wordCount(st.message)} words${connectorsUsed(st.message).length ? `, connected with ${connectorsUsed(st.message).join(", ")}` : ""}.`, `un mensaje de ${wordCount(st.message)} palabras${connectorsUsed(st.message).length ? `, conectado con ${connectorsUsed(st.message).join(", ")}` : ""}.`)}
      </li>
    </ul>
    ${level !== "C" ? html`<p>${I.T("Ready for more? Visit again at the next support level: the market stays the same, and the language asks a little more.", "¿Listo para más? Visita otra vez con el siguiente nivel de apoyo: el mercado es el mismo y el lenguaje pide un poco más.")}</p>` : ""}
    <div class="wl-actions">
      <button type="button" class="btn btn-primary" data-mk-replay>
        ${icon("retry")} ${I.T("Visit again", "Visitar otra vez")}
      </button>
      <a class="btn" href="${cityHref(EPISODE_PLACE, band)}"
        >${I.T("Back to the Corner Market", "Volver al Mercado de la Esquina")}</a
      >
      <a class="btn" href="${cityHref("", band)}">${I.T("City map", "Mapa de la ciudad")}</a>
    </div>
  </section>`;
}

/** The whole episode page. */
export function episodePage(ctx, I) {
  const band = bandFor(ctx.band);
  const st = loadMarket();
  const level = levelFor(st, ctx.prefs);
  const building = buildingOf(EPISODE_PLACE);
  return html`${crumbsHTML(
      [
        [I.S("Lab", "Laboratorio"), `${BASE}/?grades=${band}`],
        [I.S("Language City", "Ciudad del lenguaje"), cityHref("", band)],
        [PS(I, building.name), cityHref(building.id, band)],
        [PS(I, TITLE), null],
      ],
      { i18n: I },
    )}
    <article class="mk-episode">
      <header class="act-head">
        <p class="eyebrow">
          ${I.T("Language City · an episode on the Corner Market's block", "Ciudad del lenguaje · un episodio en la cuadra del Mercado de la Esquina")}
        </p>
        <h1 tabindex="-1">${P(I, TITLE)}</h1>
        <p class="lead">${P(I, BLURB)}</p>
      </header>
      ${levelPicker(I, level)} ${pipsHTML(I, st, level)} ${stageHTML(I, st)}
      <div class="mk-inspector" aria-live="polite">${inspectorHTML(I, view(level), level)}</div>
      <div class="mk-layout">
        ${st.done ? summaryHTML(ctx, I, st, level) : stepPanel(I, st, level)}
        ${basketHTML(I, st, level)}
      </div>
      <p class="disclaimer">
        ${I.T("Practice on this device. Supports are a classroom choice, not a proficiency level. Nothing here is an official WIDA or ACCESS item, score or level.", "Práctica en este dispositivo. Los apoyos son una decisión de la clase, no un nivel de dominio. Nada aquí es una pregunta, un puntaje ni un nivel oficial de WIDA o ACCESS.")}
      </p>
    </article>`;
}

// ── events ───────────────────────────────────────────────────────────────────
function setStall(root, id) {
  const stall = STALLS.find((s) => s.id === id);
  if (!stall) return;
  ui.stall = id;
  const stage = root?.querySelector?.(".mk-stage");
  if (!stage) return;
  stage.dataset.stall = id;
  stage.style.setProperty("--fx", String(stall.focus / 100));
  for (const b of root.querySelectorAll("[data-mk-stall]")) {
    b.classList.toggle("is-on", b.dataset.mkStall === id);
    b.setAttribute("aria-pressed", String(b.dataset.mkStall === id));
    // On a phone the camera row scrolls sideways; keep the chosen stall's button in view.
    const row = b.parentElement;
    if (b.dataset.mkStall === id && row && row.scrollWidth > row.clientWidth)
      row.scrollLeft += b.getBoundingClientRect().left - row.getBoundingClientRect().left - 8;
  }
}

function inspect(st, I, id) {
  const spot = spotOf(id);
  if (!spot) return;
  ui.spot = id;
  if (!st.seen.includes(id)) st.seen.push(id);
  announce(
    I.S(
      `Added to your word basket: ${spot.word.en}.`,
      `Agregada a tu canasta de palabras: ${spot.word.en}.`,
    ),
  );
}

/** Click handler for the episode page. Returns true when the click was one of ours. */
export function onEpisodeClick(e, ctx, I) {
  const t = e.target;
  const st = loadMarket();
  const level = levelFor(st, ctx.prefs);
  const commit = () => (saveMarket(st), ctx.rerender(), true);
  const lv = t.closest("[data-mk-level]");
  if (lv) {
    st.level = lv.dataset.mkLevel;
    ui.fb = null;
    ui.wrong = [];
    announce(I.S(`Support level ${st.level}.`, `Nivel de apoyo ${st.level}.`));
    return commit();
  }
  const cam = t.closest("[data-mk-stall]");
  if (cam) {
    setStall(document, cam.dataset.mkStall);
    announce(PS(I, STALLS.find((s) => s.id === ui.stall).name));
    return true;
  }
  const spot = t.closest("[data-mk-spot]") || t.closest("[data-mk-open]");
  if (spot) {
    const id = spot.dataset.mkSpot || spot.dataset.mkOpen;
    if (spot.dataset.mkOpen) setStall(document, spotOf(id)?.stall || "all");
    inspect(st, I, id);
    return commit();
  }
  const go = t.closest("[data-mk-go]");
  if (go) {
    st.step = Math.min(st.reached, Number(go.dataset.mkGo));
    st.done = false;
    Object.assign(ui, { fb: null, cartFb: false, saveFb: false, model: false });
    return commit();
  }
  if (t.closest("[data-mk-es]")) {
    ui.es = !view(level).es;
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-mk-transcript]")) {
    ui.transcript = !ui.transcript;
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-mk-model]")) {
    ui.model = !ui.model;
    return (ctx.rerender(), true);
  }
  if (t.closest("[data-mk-play]")) {
    playDialogue(ctx);
    return true;
  }
  const pick = t.closest("[data-mk-pick]");
  if (pick) {
    const [step, id] = pick.dataset.mkPick.split(":");
    const q = (step === "listen" ? LISTEN_Q : READ_Q)[level];
    if (stepDone(st, step, level) || ui.wrong.includes(pick.dataset.mkPick)) return true;
    const ok = id === q.answer;
    setAnswer(st, step, level, id, ok);
    if (!ok) ui.wrong.push(pick.dataset.mkPick);
    ui.fb = { step, pick: id };
    announce(
      ok
        ? I.S("That works.", "Eso funciona.")
        : I.S("Not yet. Try another answer.", "Todavía no. Prueba otra respuesta."),
    );
    return commit();
  }
  const item = t.closest("[data-mk-item]");
  if (item) {
    const id = item.dataset.mkItem;
    st.cart = st.cart.includes(id) ? st.cart.filter((x) => x !== id) : [...st.cart, id];
    ui.cartFb = false;
    return commit();
  }
  if (t.closest("[data-mk-checkcart]")) {
    ui.cartFb = true;
    const r = checkCart(st.cart);
    announce(
      r.ok
        ? I.S(
            "Your basket makes the recipe inside the budget.",
            "Tu canasta alcanza para la receta dentro del presupuesto.",
          )
        : I.S(
            "Not yet. Read the note under your basket.",
            "Todavía no. Lee la nota debajo de tu canasta.",
          ),
    );
    return commit();
  }
  if (t.closest("[data-mk-said]")) {
    st.said = !st.said;
    return commit();
  }
  if (t.closest("[data-mk-save]")) {
    const box = document.querySelector("[data-mk-text]");
    if (box) st.message = box.value.slice(0, 2000);
    st.saved = st.message.trim().length > 0;
    ui.saveFb = true;
    announce(
      st.saved
        ? I.S("Message saved on this device.", "Mensaje guardado en este dispositivo.")
        : I.S("Write a few words first.", "Primero escribe algunas palabras."),
    );
    return commit();
  }
  if (t.closest("[data-mk-next]") && stepDone(st, STEPS[st.step].id, level)) {
    Object.assign(ui, { fb: null, wrong: [], cartFb: false, saveFb: false, model: false });
    if (st.step < STEPS.length - 1) {
      st.step += 1;
      st.reached = Math.max(st.reached, st.step);
    } else {
      st.done = true;
      st.runs += 1;
      const indep = level === "C" && !view(level).es && !ui.transcript && !ui.model;
      if (indep) st.indep = (st.indep || 0) + 1;
      else st.supp = (st.supp || 0) + 1;
      recordEvidence({
        src: "city",
        task: `episode:${EPISODE_ID}`,
        band: bandFor(ctx.band),
        domain: "Writing",
        use: "Inform",
        level: indep ? "C" : level,
        opened: indep ? {} : { frames: true },
        kind: st.runs > 1 ? "retry" : "first",
        m: { spots: st.seen.length, words: wordCount(st.message), steps: STEPS.length },
      });
    }
    saveMarket(st);
    ctx.rerender();
    focusHeading(st.done ? "#mk-sum-h" : "#mk-step-h");
    return true;
  }
  if (t.closest("[data-mk-replay]")) {
    resetEpisodeUi();
    saveMarket(freshVisit(st));
    ctx.rerender();
    focusHeading("#mk-step-h");
    return true;
  }
  return false;
}
const focusHeading = (sel) =>
  setTimeout(() => document.querySelector(sel)?.focus({ preventScroll: false }), 60);

function playDialogue(ctx) {
  const lines = DIALOGUE.map((l) => `${PEOPLE[l.who].name}: ${l.en}`);
  const mark = (i) => {
    for (const li of document.querySelectorAll("[data-mk-line]"))
      li.classList.toggle("is-speaking", Number(li.dataset.mkLine) === i);
  };
  speakDialogue(lines, { rate: ctx.prefs?.rate || 0.9, onLineChange: (i) => mark(i) }).finally(() =>
    mark(-1),
  );
}

/** Typing in the message box is saved on this device as the learner writes (never sent). */
export function onEpisodeInput(e, I, ctx) {
  const box = e.target.closest?.("[data-mk-text]");
  if (!box) return false;
  const st = loadMarket();
  const text = box.value.slice(0, 2000);
  // A change event also fires on blur; only a real edit makes a saved message "not saved yet".
  if (text === st.message) return true;
  st.message = text;
  st.saved = false;
  saveMarket(st);
  const note = document.querySelector("[data-mk-selfcheck]");
  if (note)
    note.textContent = selfCheckText(
      I,
      levelFor(st, ctx.prefs),
      wordCount(st.message),
      connectorsUsed(st.message),
    );
  return true;
}

const wired = new WeakSet();
/** Keyboard focus on a spot that sits outside the current camera view moves the camera to that spot's stall. */
export function mountEpisode(root) {
  if (!root || wired.has(root)) return;
  wired.add(root);
  root.addEventListener("focusin", (e) => {
    const spot = e.target.closest?.("[data-mk-spot]");
    if (!spot) return;
    const narrow = window.matchMedia?.("(max-width: 640px)").matches;
    if (ui.stall === "all" && !narrow) return;
    if (spot.dataset.stallOf !== ui.stall) setStall(root, spot.dataset.stallOf);
  });
}
