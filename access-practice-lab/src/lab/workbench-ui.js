// Sentence workbench markup. Pure functions of (state, env): the reducer lives in workbench.js, the game glue
// (judge, hints, report) in workbench-round.js. Everything is a real <button>: Tab, Arrow keys, Enter and Space all work,
// and there is no drag at all, so nothing needs a click-to-place fallback. Chip text is English (the sentence being
// built); only the directions, group names, hints and notes follow the language mode.
import { glossHTML, html, raw } from "../games/engine.js";
import { ERROR_TAGS } from "./tags.js";
import {
  JOINERS,
  JOINER_IDS,
  REL_ORDER,
  RELS,
  SLOTS,
  SLOT_INFO,
  canNext,
  clauseText,
  liveTag,
  punctRule,
  secondText,
  slotCap,
  stepsOf,
  tokensOf,
} from "./workbench.js";

const STEP_NAME = {
  base: ["Base", "Base"],
  expand: ["Expand", "Ampliar"],
  combine: ["Combine", "Unir"],
  check: ["Check", "Revisar"],
};
const modeOf = (env) => env.sup?.key || env.support || "A";

/** Which workbench action a clicked control means (null when it is none of ours). Works on a real or stand-in element. */
export function actionFromEl(b) {
  const d = b.dataset || {};
  if (b.hasAttribute("data-wb-next")) return { type: "next" };
  if (b.hasAttribute("data-wb-back")) return { type: "back" };
  if (b.hasAttribute("data-wb-check")) return { type: "check" };
  if (b.hasAttribute("data-wb-revise")) return { type: "revise" };
  if (d.wbAdd !== undefined) {
    const [slot, ...id] = d.wbAdd.split(":");
    return { type: "toggle", slot, id: id.join(":") };
  }
  if (d.wbConn !== undefined) return { type: "conn", id: d.wbConn };
  if (d.wbJoin !== undefined) return { type: "joiner", id: d.wbJoin };
  return null;
}

const stepsHTML = (state, I) =>
  html`<ol class="wb-steps" aria-label="${I.S("Workbench steps", "Pasos del taller")}">
    ${stepsOf(state.kind).map((s, i) => {
      const at = stepsOf(state.kind).indexOf(state.step);
      return html`<li
        class="wb-step${i < at ? " is-done" : ""}${i === at ? " is-now" : ""}"
        ${i === at ? raw('aria-current="step"') : ""}
      >
        <span class="wb-step-n" aria-hidden="true">${i + 1}</span>${I.T(...STEP_NAME[s])}
      </li>`;
    })}
  </ol>`;

/** The sentence as built, each added piece marked by its group (colour plus a distinct underline). */
export function sentenceHTML(state, I) {
  const tokens = tokensOf(state);
  if (!tokens.length)
    return html`<p class="wb-sentence" lang="en">
      <span class="wb-w wb-s-base">${clauseText(state)}</span>
      <span class="wb-gap" aria-label="${I.S("connector goes here", "aquí va el conector")}"
        >…</span
      >
      <span class="wb-w wb-s-second">${secondText(state)}</span>
    </p>`;
  return html`<p class="wb-sentence" lang="en">
    ${tokens.map((t) => html`<span class="wb-w wb-s-${t.slot || "base"}${t.glue ? " is-glue" : ""}">${t.t}</span>${t.glue ? "" : " "}`)}
  </p>`;
}

function chipGroup(state, env, slot, locked) {
  const I = env.I;
  const list = state.spec.chips?.[slot] || [];
  if (!list.length) return "";
  const chosen = state.adds[slot];
  const full = chosen.length >= slotCap(slot);
  const info = SLOT_INFO[slot];
  return html`<div
    class="wb-group wb-g-${slot}"
    role="group"
    aria-labelledby="wb-gl-${slot}"
    data-wb-group
  >
    <p class="wb-group-l" id="wb-gl-${slot}">
      <strong>${I.T(...info.name)}</strong> <span class="fine">${I.T(...info.ask)}</span>
    </p>
    <div class="wb-chips">
      ${list.map((c) => {
        const on = chosen.includes(c.id);
        return html`<span class="wb-chip-wrap"
          ><button
            type="button"
            class="wb-chip wb-c-${slot}${on ? " is-on" : ""}"
            lang="en"
            data-wb-add="${slot}:${c.id}"
            aria-pressed="${on ? "true" : "false"}"
            ${locked || (full && !on && slotCap(slot) > 1) ? "disabled" : ""}
          >
            ${c.text}</button
          >${glossHTML(c.es, env)}</span
        >`;
      })}
    </div>
  </div>`;
}

function connectorChip(c, state, env, locked, grouped) {
  const on = state.conn === c.id;
  const rel = grouped ? ` wb-rel-${c.rel}` : "";
  return html`<span class="wb-chip-wrap"
    ><button
      type="button"
      class="wb-chip wb-conn${rel}${on ? " is-on" : ""}"
      lang="en"
      data-wb-conn="${c.id}"
      aria-pressed="${on ? "true" : "false"}"
      ${locked ? "disabled" : ""}
    >
      ${c.id}</button
    >${grouped ? html`<span class="gs-gloss" lang="es">${c.es}</span>` : glossHTML(c.es, env)}</span
  >`;
}

function combineHTML(state, env, locked) {
  const I = env.I;
  const grouped = modeOf(env) === "A";
  const conns = state.spec.connectors;
  const noneOn = state.conn === "none";
  return html`<div class="wb-combine">
    <div class="wb-group wb-g-conn" role="group" aria-labelledby="wb-gl-conn" data-wb-group>
      <p class="wb-group-l" id="wb-gl-conn">
        <strong>${I.T("Connector", "Conector")}</strong>
        <span class="fine"
          >${I.T("How do the two ideas go together?", "¿Cómo se relacionan las dos ideas?")}</span
        >
      </p>
      ${
        grouped
          ? REL_ORDER.filter((rel) => conns.some((c) => c.rel === rel)).map(
              (rel) =>
                html`<div
                  class="wb-rel-group"
                  role="group"
                  aria-label="${I.S(...RELS[rel].name)}"
                  data-wb-group
                >
                  <p class="wb-rel-h">${I.T(...RELS[rel].name)}</p>
                  <div class="wb-chips">
                    ${conns.filter((c) => c.rel === rel).map((c) => connectorChip(c, state, env, locked, true))}
                  </div>
                </div>`,
            )
          : html`<div class="wb-chips">
              ${conns.map((c) => connectorChip(c, state, env, locked, false))}
            </div>`
      }
      <div class="wb-chips">
        <span class="wb-chip-wrap"
          ><button
            type="button"
            class="wb-chip wb-conn wb-none${noneOn ? " is-on" : ""}"
            data-wb-conn="none"
            aria-pressed="${noneOn ? "true" : "false"}"
            ${locked ? "disabled" : ""}
          >
            ${I.T("No connector", "Sin conector")}
          </button></span
        >
      </div>
    </div>
    <div class="wb-group wb-g-punct" role="group" aria-labelledby="wb-gl-punct" data-wb-group>
      <p class="wb-group-l" id="wb-gl-punct">
        <strong>${I.T("Punctuation between the ideas", "Puntuación entre las ideas")}</strong>
      </p>
      <div class="wb-chips">
        ${JOINER_IDS.map((j) => {
          const on = state.joiner === j;
          return html`<span class="wb-chip-wrap"
            ><button
              type="button"
              class="wb-chip wb-pun${on ? " is-on" : ""}"
              data-wb-join="${j}"
              aria-pressed="${on ? "true" : "false"}"
              ${locked ? "disabled" : ""}
            >
              ${JOINERS[j].sym ? html`<span class="wb-pun-sym" aria-hidden="true">${JOINERS[j].sym}</span> ` : ""}${I.T(...JOINERS[j].name)}
            </button></span
          >`;
        })}
      </div>
    </div>
  </div>`;
}

/** The calm syntax note: always rendered (a stable aria-live region), filled only when a pattern is found. */
export function liveHTML(state, I) {
  const tag = state.step === "base" ? null : liveTag(state);
  const t = tag && ERROR_TAGS[tag];
  return html`<div class="wb-live" data-wb-live aria-live="polite" aria-atomic="true">
    ${t ? html`<p class="wb-note" data-wb-tag="${tag}"><strong>${I.T(t.en, t.es)}.</strong> ${I.T(t.hintEn, t.hintEs)}</p>` : ""}
  </div>`;
}

function bodyHTML(state, env, locked) {
  const I = env.I;
  if (state.step === "base")
    return html`<p class="wb-dir">
      ${state.kind === "combine" ? I.T("Here are two complete ideas. Join them into one sentence.", "Aquí hay dos ideas completas. Únelas en una sola oración.") : I.T("This is the base sentence. Build on it, one detail at a time.", "Esta es la oración base. Constrúyela, un detalle a la vez.")}
    </p>`;
  if (state.step === "expand")
    return html`<p class="wb-dir">
        ${I.T("Tap a chip to add it. Tap it again to take it out. Each one goes in the right place.", "Toca una ficha para añadirla. Tócala otra vez para quitarla. Cada una va en su lugar.")}
      </p>
      ${SLOTS.map((s) => chipGroup(state, env, s, locked))}`;
  if (state.step === "combine")
    return html`<p class="wb-dir">
        ${I.T("Choose a connector and the punctuation between the two ideas.", "Elige un conector y la puntuación entre las dos ideas.")}
      </p>
      ${combineHTML(state, env, locked)}`;
  return html`<p class="wb-dir">
    ${locked ? I.T("Your finished sentence.", "Tu oración terminada.") : I.T("Read your sentence aloud. Does it say what you mean? Then check it.", "Lee tu oración en voz alta. ¿Dice lo que quieres decir? Luego revísala.")}
  </p>`;
}

/** The whole workbench for one state. `locked` disables every control (the round is finished). */
export function wbHTML(state, env, { locked = false } = {}) {
  const I = env.I;
  const nextLabel =
    state.step === "base"
      ? I.T("Start building", "Empezar a construir")
      : I.T("Review my sentence", "Revisar mi oración");
  return html`<section
    class="wb wb-${state.kind}"
    data-wb
    data-wb-step="${state.step}"
    data-wb-kind="${state.kind}"
  >
    ${stepsHTML(state, I)}
    <div class="wb-sentence-box">
      <p class="wb-sentence-l">${I.T("Your sentence", "Tu oración")}</p>
      ${sentenceHTML(state, I)}
    </div>
    ${bodyHTML(state, env, locked)} ${liveHTML(state, I)}
    ${
      locked
        ? ""
        : html`<div class="gs-actions wb-nav">
            ${state.step !== "base" ? html`<button type="button" class="btn" data-wb-back>${I.T("Back", "Atrás")}</button>` : ""}
            ${state.step === "check" ? html`<button type="button" class="btn btn-primary" data-wb-check>${I.T("Check my sentence", "Revisar mi oración")}</button>` : html`<button type="button" class="btn btn-primary" data-wb-next ${canNext(state) ? "" : "disabled"}>${nextLabel}</button>`}
          </div>`
    }
  </section>`;
}

/** Hint ladder for the open round: driven by the reasons of the last check, generic before the first. */
export function wbHints(state, I) {
  const r = state.last?.reasons?.[0];
  const spec = state.spec;
  const slot = (s) => I.T(...SLOT_INFO[s].name);
  if (!r)
    return state.kind === "combine"
      ? [
          I.T(...RELS[spec.rel].hint),
          I.T(
            "Say both ideas aloud with each connector between them. Which one keeps the meaning true?",
            "Di las dos ideas en voz alta con cada conector en medio. ¿Cuál mantiene el significado verdadero?",
          ),
          I.T(
            "Then choose the punctuation that goes with that connector.",
            "Luego elige la puntuación que va con ese conector.",
          ),
        ]
      : [
          I.T(
            "Add details that answer questions: who, what, where, when, why, or what it is like.",
            "Añade detalles que contesten preguntas: quién, qué, dónde, cuándo, por qué o cómo es.",
          ),
          I.T(
            "Each chip you tap goes into the sentence in the right place.",
            "Cada ficha que tocas entra en la oración en su lugar.",
          ),
          I.T(
            "Read the sentence aloud. Does it sound complete?",
            "Lee la oración en voz alta. ¿Suena completa?",
          ),
        ];
  const c = spec.connectors?.find((x) => x.id === state.conn);
  switch (r.code) {
    case "FEW":
      return [
        I.T(
          "Tell more. Add a detail about who, what, where, when or why, or a describing word.",
          "Cuenta más. Añade un detalle sobre quién, qué, dónde, cuándo o por qué, o una palabra descriptiva.",
        ),
        I.T(
          `Add at least ${r.need} details. You have ${r.have}.`,
          `Añade al menos ${r.need} detalles. Tienes ${r.have}.`,
        ),
        r.missing[0]
          ? html`${I.T("Open this group:", "Abre este grupo:")} ${slot(r.missing[0])}`
          : I.T("Try a different chip.", "Prueba con otra ficha."),
      ];
    case "NO_CONN":
      return [
        I.T(
          "These are two complete ideas. A connector shows how they go together.",
          "Estas son dos ideas completas. Un conector muestra cómo se relacionan.",
        ),
        I.T(...RELS[spec.rel].hint),
        I.T(
          `These ideas show ${RELS[spec.rel].name[0].toLowerCase()}.`,
          `Estas ideas muestran ${RELS[spec.rel].name[1].toLowerCase()}.`,
        ),
      ];
    case "REL":
      return [
        I.T(...RELS[spec.rel].hint),
        I.T(
          "Say both ideas aloud with your connector in the middle. Does the meaning change?",
          "Di las dos ideas en voz alta con tu conector en medio. ¿Cambia el significado?",
        ),
        I.T(
          `Look for a connector that shows ${RELS[spec.rel].name[0].toLowerCase()}.`,
          `Busca un conector que muestre ${RELS[spec.rel].name[1].toLowerCase()}.`,
        ),
      ];
    case "PUNCT":
      return [
        I.T(...punctRule(r.type, r.id)),
        I.T(
          "Look at the mark between the two ideas, and at the connector.",
          "Mira el signo entre las dos ideas y el conector.",
        ),
        I.T(`Try the ${JOINERS[r.want].name[0]}.`, `Prueba con el ${JOINERS[r.want].name[1]}.`),
      ];
    default: {
      const t = ERROR_TAGS[r.tag];
      return [
        t
          ? I.T(t.hintEn, t.hintEs)
          : I.T(
              "Read the sentence aloud and listen for what sounds off.",
              "Lee la oración en voz alta y escucha qué suena raro.",
            ),
        I.T(
          "Read the sentence aloud. Does it sound complete?",
          "Lee la oración en voz alta. ¿Suena completa?",
        ),
        c
          ? I.T(...punctRule(c.type, c.id))
          : I.T("Change one piece and read it again.", "Cambia una pieza y léela otra vez."),
      ];
    }
  }
}

/** Short, kind note for a missed check (no answer in it). */
export function wbRetry(state, I) {
  const code = state.last?.reasons?.[0]?.code;
  return (
    {
      FEW: I.T(
        "Add a little more detail, then check again.",
        "Añade un poco más de detalle y revisa otra vez.",
      ),
      NO_CONN: I.T(
        "These two ideas still need a connector.",
        "Estas dos ideas todavía necesitan un conector.",
      ),
      REL: I.T(
        "That connector does not match how the two ideas relate. Try another.",
        "Ese conector no coincide con cómo se relacionan las ideas. Prueba con otro.",
      ),
      PUNCT: I.T(
        "Check the punctuation around the connector.",
        "Revisa la puntuación alrededor del conector.",
      ),
      SYNTAX: I.T(
        "Check the pattern in the note, then revise.",
        "Revisa el patrón de la nota y corrige.",
      ),
    }[code] || I.T("Look again and revise.", "Mira de nuevo y revisa.")
  );
}

/** Why a joined sentence works (shown after the round settles). */
export function wbWhy(state, I) {
  const c = state.spec.connectors?.find((x) => x.id === (state.conn || state.spec.conn));
  if (state.kind === "expand")
    return I.T(
      "Every detail answers a question about the sentence, and the sentence still says one clear idea.",
      "Cada detalle contesta una pregunta sobre la oración, y la oración sigue diciendo una idea clara.",
    );
  return c ? I.T(...punctRule(c.type, c.id)) : "";
}

/**
 * After each render: Arrow keys / Home / End move between chips in a group, and the calm note is re-announced when
 * it changed (the stage is re-rendered on every action, which replaces the live region's node).
 */
let spoken = "";
export function mountWorkbench(root) {
  if (!root?.addEventListener) return null;
  const onKey = (e) => {
    const t = e.target?.closest?.(".wb-chip");
    if (!t || !["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key))
      return;
    const items = [...t.closest("[data-wb-group]").querySelectorAll(".wb-chip:not(:disabled)")];
    const at = items.indexOf(t);
    const to =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? items.length - 1
          : (at + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + items.length) %
            items.length;
    items[to]?.focus();
    e.preventDefault();
  };
  root.addEventListener("keydown", onKey);
  const live = root.querySelector("[data-wb-live]");
  const text = live?.textContent.trim() || "";
  if (live && text && text !== spoken) {
    live.textContent = "";
    requestAnimationFrame(() => {
      if (live.isConnected) live.textContent = text;
    });
  }
  spoken = text;
  return () => root.removeEventListener("keydown", onKey);
}

