// Living Language World (DISCOVER step): the illustrated scene, hotspots to examine, controls to change, a field
// notebook, then an explanation to the partner. DOM only: every decision comes from engines/scene.js, and all
// resumable state lives in env.data (scene state, draft, helps opened) so a reload picks up where the learner was.
import { html, icon, wordCount } from "../../util.js";
import {
  canExplain,
  canSend,
  currentOutcome,
  doneCriteria,
  evaluateExplanation,
  examine,
  init,
  ledgerEntry,
  notebook,
  recordExchange,
  recordFollowup,
  setControl,
} from "../engines/scene.js";
import { environmentArt } from "./environments.js";

const MOOD_ICON = { good: "check", warn: "alert", bad: "x", neutral: "info" };
const MOOD_WORD = {
  good: ["Going well", "Va bien"],
  warn: ["Needs attention", "Necesita atención"],
  bad: ["Struggling", "Tiene problemas"],
  neutral: ["No change yet", "Sin cambios todavía"],
};
const NEUTRAL_TEXT = [
  "Nothing has changed yet. Try a control to see what happens.",
  "Todavía no ha cambiado nada. Prueba un control para ver qué pasa.",
];
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, Number(n) || 0));
const plural = (n, one, many) => (n === 1 ? one : many);

const taskOf = (env) => env.pack.discover;
const sceneOf = (task, env) => ({ ...init(task), ...(env.data?.scene || {}) });
const helpsOf = (env) => env.data?.helps || [];

// ── render ───────────────────────────────────────────────────────────────────────────────────────
function stepsHTML(I, task, state) {
  const c = doneCriteria(task, state);
  const items = [
    [
      c.collect,
      I.T("Look closely", "Observa con atención"),
      I.T(
        `${Math.min(c.examined, task.collect)} of ${task.collect}`,
        `${Math.min(c.examined, task.collect)} de ${task.collect}`,
      ),
    ],
    [c.manipulated, I.T("Try a control", "Prueba un control"), ""],
    [c.explained, I.T("Explain", "Explica"), ""],
  ];
  return html`<ol class="sc-steps">
    ${items.map(
      ([done, label, count], i) =>
        html`<li class="sc-step${done ? " is-done" : ""}">
          <span class="sc-step-mark" aria-hidden="true">${done ? icon("check") : i + 1}</span
          ><span>${label}</span
          >${count ? html`<span class="sc-step-count">${count}</span>` : ""}${done ? html`<span class="visually-hidden">${I.T("done", "listo")}</span>` : ""}
        </li>`,
    )}
  </ol>`;
}

function hotspotsHTML(I, task, state) {
  return task.objects.map((o) => {
    const seen = state.examined.includes(o.id);
    const name = `${I.S("Examine", "Examinar")}: ${o.label}${seen ? ` (${I.S("looked at", "visto")})` : ""}`;
    return html`<button
      type="button"
      class="sc-hot${seen ? " is-seen" : ""}"
      style="left:${clamp(o.x, 7, 93)}%;top:${clamp(o.y, 9, 88)}%"
      data-sc-examine="${o.id}"
      aria-label="${name}"
    >
      <span class="sc-hot-glyph" aria-hidden="true"
        >${o.glyph}${seen ? html`<span class="sc-hot-check">${icon("check")}</span>` : ""}</span
      ><span class="sc-hot-label" lang="en">${o.label}</span>
    </button>`;
  });
}

function lookListHTML(I, task, state) {
  return html`<section class="sc-looklist" aria-labelledby="sc-looklist-h">
    <h3 id="sc-looklist-h">${I.T("Things to look at", "Cosas para observar")}</h3>
    <ul>
      ${task.objects.map((o) => {
        const seen = state.examined.includes(o.id);
        return html`<li>
          <button
            type="button"
            class="sc-chip${seen ? " is-seen" : ""}"
            data-sc-examine="${o.id}"
            aria-label="${I.S("Examine", "Examinar")}: ${o.label}${seen ? ` (${I.S("looked at", "visto")})` : ""}"
          >
            <span aria-hidden="true">${o.glyph}</span
            ><span lang="en">${o.label}</span>${seen ? icon("check") : ""}
          </button>
        </li>`;
      })}
    </ul>
  </section>`;
}

function stateCardHTML(I, outcome) {
  const mood = outcome.mood || "neutral";
  const text = outcome.neutral
    ? I.T(...NEUTRAL_TEXT)
    : html`<span lang="en">${outcome.state}</span>`;
  return html`<div class="sc-state" data-mood="${mood}" role="status" aria-live="polite">
    <h3 class="sc-state-h">${I.T("What the scene shows now", "Lo que muestra la escena ahora")}</h3>
    <p class="sc-state-mood">${icon(MOOD_ICON[mood])}<strong>${I.T(...MOOD_WORD[mood])}</strong></p>
    <p class="sc-state-text">${text}</p>
  </div>`;
}

function controlsHTML(I, task, state) {
  return html`<section class="sc-controls" aria-labelledby="sc-controls-h">
    <h3 id="sc-controls-h">${I.T("Change the scene", "Cambia la escena")}</h3>
    ${task.controls.map(
      (ctl) =>
        html`<fieldset class="sc-ctrl">
          <legend lang="en">${ctl.label}</legend>
          <div class="sc-opts">
            ${ctl.options.map(
              (o) =>
                html`<label class="sc-opt"
                  ><input
                    type="radio"
                    class="visually-hidden"
                    name="sc-${ctl.id}"
                    value="${o.id}"
                    data-sc-control="${ctl.id}"
                    ${state.controls[ctl.id] === o.id ? "checked" : ""}
                  /><span lang="en">${o.label}</span></label
                >`,
            )}
          </div>
        </fieldset>`,
    )}
  </section>`;
}

function notebookHTML(I, task, state) {
  const notes = notebook(task, state);
  return html`<section
    class="sc-book"
    aria-labelledby="sc-book-h"
    aria-live="polite"
    aria-relevant="additions"
  >
    <h3 id="sc-book-h">${icon("evidence")}${I.T("Field notebook", "Cuaderno de campo")}</h3>
    ${
      notes.length
        ? html`<ol class="sc-notes">
            ${notes.map(
              (n) =>
                html`<li class="sc-note">
                  <span class="sc-note-glyph" aria-hidden="true">${n.glyph}</span>
                  <div>
                    <strong lang="en">${n.label}</strong>
                    <p lang="en">${n.note}</p>
                  </div>
                </li>`,
            )}
          </ol>`
        : html`<p class="sc-empty">
            ${I.T("Tap things in the scene to look closer. What you find is saved here.", "Toca cosas en la escena para observarlas. Lo que encuentres se guarda aquí.")}
          </p>`
    }
  </section>`;
}

function lockedHTML(I, task, state) {
  const need = Math.max(0, task.collect - state.examined.length);
  const en = [];
  const es = [];
  if (need) {
    en.push(`look at ${need} more ${plural(need, "thing", "things")}`);
    es.push(`observa ${need} ${plural(need, "cosa", "cosas")} más`);
  }
  if (!state.changes.length) {
    en.push("change one control");
    es.push("cambia un control");
  }
  return html`<p class="sc-locked">
    ${icon("lock")}<span
      >${I.T(`To explain your idea, ${en.join(" and ")}.`, `Para explicar tu idea, ${es.join(" y ")}.`)}</span
    >
  </p>`;
}

/** Sentence frames (support A, B) and word help (support A). Never rendered when the learner is on their own. */
function supportsHTML(I, env) {
  if (env.independent)
    return html`<p class="sc-own">
      ${icon("star")}${I.T("On my own: no frames, word help or hints.", "Por mi cuenta: sin marcos, ayuda con palabras ni pistas.")}
    </p>`;
  const helps = helpsOf(env);
  const frames = env.pack.frames?.[env.support] || [];
  const vocab = env.support === "A" ? env.pack.vocab || [] : [];
  return html`${
    frames.length
      ? html`<details class="sc-help" ${helps.includes("frames") ? "open" : ""}>
          <summary data-sc-help="frames">${I.T("Sentence frames", "Marcos de oraciones")}</summary>
          <ul class="sc-frames">
            ${frames.map((f) => html`<li><button type="button" class="sc-frame" lang="en" data-sc-frame="${f}">${f}</button></li>`)}
          </ul>
        </details>`
      : ""
  }
  ${
    vocab.length
      ? html`<details class="sc-help" ${helps.includes("vocab") ? "open" : ""}>
          <summary data-sc-help="vocab">${I.T("Word help", "Ayuda con palabras")}</summary>
          <p class="sc-tip">
            ${I.T("Tap a word to see what it means.", "Toca una palabra para ver su significado.")}
          </p>
          <ul class="sc-vocab">
            ${vocab.map((v, i) => html`<li><button type="button" class="sc-word" lang="en" data-sc-vocab="${i}" aria-expanded="false">${v[0]}</button></li>`)}
          </ul>
          <div class="sc-gloss" data-sc-gloss aria-live="polite"></div>
        </details>`
      : ""
  }`;
}

function bubbleHTML(partner, text, cls = "") {
  return html`<div class="sc-bubble ${cls}">
    <span class="sc-bubble-glyph" aria-hidden="true">${partner.glyph}</span>
    <div>
      <p class="sc-bubble-name">${partner.name}</p>
      <p class="sc-bubble-text" lang="en">${text}</p>
    </div>
  </div>`;
}

function replyHTML(I, task, env, state) {
  const { partner } = task;
  const ex = state.exchange;
  const open = ex.reply.tag !== "ack";
  const hint =
    ex.hint && !env.independent
      ? html`<details class="sc-help" ${helpsOf(env).includes("hint") ? "open" : ""}>
          <summary data-sc-help="hint">${I.T("Hint", "Pista")}</summary>
          <p lang="en">
            <span lang="${I.spanish ? "es" : "en"}"
              >${I.T("A stronger answer adds:", "Una respuesta más fuerte agrega:")}</span
            >
            ${ex.hint.text}
          </p>
        </details>`
      : "";
  const second = state.followup
    ? html`<div class="sc-wrote">
        <p class="sc-wrote-h">${I.T("You added", "Añadiste")}</p>
        <p lang="en">${state.followup.text}</p>
      </div>`
    : open
      ? html`<div class="sc-second">
          <label for="sc-draft2"
            >${I.T("Answer once more (optional)", "Responde una vez más (opcional)")}</label
          ><textarea
            id="sc-draft2"
            class="sc-text"
            rows="3"
            lang="en"
            autocomplete="off"
            data-sc-draft2
          >
${env.data?.draft2 || ""}</textarea
          ><button type="button" class="btn btn-secondary" data-sc-send2>
            ${I.T("Send answer", "Enviar respuesta")}
          </button>
        </div>`
      : "";
  return html`<div class="sc-wrote">
      <p class="sc-wrote-h">${I.T("You wrote", "Escribiste")}</p>
      <p lang="en">${ex.text}</p>
    </div>
    <div class="sc-reply" data-sc-reply tabindex="-1" data-tag="${ex.reply.tag}">
      ${bubbleHTML(partner, ex.reply.text)}${hint}
    </div>
    ${second}
    <p class="sc-finished" role="status">
      ${icon("check")}${I.T("Your explanation was sent and answered. Continue to the next step whenever you are ready.", "Enviaste tu explicación y recibiste respuesta. Pasa al siguiente paso cuando quieras.")}
    </p>`;
}

function talkHTML(I, task, env, state) {
  const { partner, respond } = task;
  const draft = env.data?.draft || "";
  const words = wordCount(draft);
  return html`<div class="sc-talk">
    ${bubbleHTML(partner, partner.opening, "is-opening")}
    <label class="sc-talk-prompt" for="sc-draft" lang="en">${respond.prompt}</label
    >${supportsHTML(I, env)}
    ${
      state.exchange
        ? replyHTML(I, task, env, state)
        : html`<textarea
              id="sc-draft"
              class="sc-text"
              rows="4"
              lang="en"
              autocomplete="off"
              autocapitalize="sentences"
              data-sc-draft
              aria-describedby="sc-words"
            >
${draft}</textarea>
            <p class="sc-words" id="sc-words" data-sc-words data-min="${respond.minWords}">
              ${wordsLine(I, words, respond.minWords)}
            </p>
            <button
              type="button"
              class="btn btn-primary"
              data-sc-send
              ${canSend(draft) ? "" : "disabled"}
            >
              ${icon("arrow-right")}${I.T(`Send to ${partner.name}`, `Enviar a ${partner.name}`)}
            </button>`
    }
  </div>`;
}

/** Plain text (never markup) so the live counter can be updated with textContent. */
const wordsLine = (I, n, min) =>
  I.S(
    `${n} ${plural(n, "word", "words")} so far. Aim for about ${min}.`,
    `${n} ${plural(n, "palabra", "palabras")} hasta ahora. Intenta escribir unas ${min}.`,
  );

/** The whole DISCOVER step as markup. `task` is env.pack.discover. */
export function render(task, env) {
  const { I } = env;
  const state = sceneOf(task, env);
  const outcome = currentOutcome(task, state);
  const environment = env.pack.environment || env.mission?.environment || "garden";
  const pulse = env.data?.lastAction === "control" ? "1" : "0";
  return html`<section
    class="sc"
    data-band="${env.band}"
    data-environment="${environment}"
    data-support="${env.independent ? "own" : env.support}"
  >
    <div class="sc-head">
      <p class="sc-prompt" lang="en">${task.prompt}</p>
      ${stepsHTML(I, task, state)}
    </div>
    <div class="sc-layout">
      <div class="sc-world">
        <div class="sc-stage" data-mood="${outcome.mood || "neutral"}" data-pulse="${pulse}">
          ${environmentArt(environment, outcome.mood || "neutral", env.band)}${hotspotsHTML(I, task, state)}
        </div>
        ${stateCardHTML(I, outcome)}
      </div>
      <div class="sc-side">
        ${lookListHTML(I, task, state)}${controlsHTML(I, task, state)}${notebookHTML(I, task, state)}
      </div>
    </div>
    <section class="sc-explain" aria-labelledby="sc-explain-h">
      <h3 id="sc-explain-h">
        ${icon("conversation")}${I.T("Explain your idea", "Explica tu idea")}
      </h3>
      ${canExplain(task, state) || state.exchange ? talkHTML(I, task, env, state) : lockedHTML(I, task, state)}
    </section>
  </section>`;
}

// ── mount ────────────────────────────────────────────────────────────────────────────────────────
/** Move focus to a rebuilt element after the shell re-renders. Never blocks: a missing target is ignored. */
const focusLater = (root, selector) => setTimeout(() => root.querySelector(selector)?.focus(), 0);
const draftOf = (root, sel) => root.querySelector(sel)?.value;

function insertAtCaret(field, text) {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const lead = start > 0 && !/\s$/.test(field.value.slice(0, start)) ? " " : "";
  field.value = `${field.value.slice(0, start)}${lead}${text}${field.value.slice(end)}`;
  const at = start + lead.length + text.length;
  field.setSelectionRange(at, at);
  field.focus();
  field.dispatchEvent(new field.ownerDocument.defaultView.Event("input", { bubbles: true }));
}

function showGloss(root, env, button) {
  const entry = env.pack.vocab?.[Number(button.dataset.scVocab)];
  const box = root.querySelector("[data-sc-gloss]");
  if (!entry || !box) return;
  const open = button.getAttribute("aria-expanded") !== "true";
  for (const b of root.querySelectorAll("[data-sc-vocab]"))
    b.setAttribute("aria-expanded", "false");
  button.setAttribute("aria-expanded", String(open));
  box.replaceChildren();
  if (!open) return;
  const en = root.ownerDocument.createElement("p");
  en.lang = "en";
  en.textContent = `${entry[0]}: ${entry[1]}`;
  const es = root.ownerDocument.createElement("p");
  es.lang = "es";
  es.textContent = entry[2];
  box.append(en, es);
}

function send(root, env, second) {
  const task = taskOf(env);
  const state = sceneOf(task, env);
  const text = (draftOf(root, second ? "[data-sc-draft2]" : "[data-sc-draft]") || "").trim();
  if (!canSend(text) || (!second && state.exchange)) return;
  const helps = helpsOf(env);
  const entry = (kind, scene) =>
    ledgerEntry({
      task,
      text,
      missionId: env.missionId,
      band: env.band,
      keyUse: env.mission?.klu || "Explain",
      help: helps,
      kind,
      state: scene,
    });
  if (second) {
    const scene = recordFollowup(state, text);
    env.update({ scene, draft2: "", lastAction: "followup" });
    env.ledger(entry("revision", scene));
    env.announce?.(env.I.S("Your answer was added.", "Se agregó tu respuesta."));
    focusLater(root, "[data-sc-reply]");
    return;
  }
  const evaluation = evaluateExplanation(task, text, state, { independent: env.independent });
  const scene = recordExchange(state, text, evaluation);
  env.update({ scene, draft: text, lastAction: "send" });
  env.ledger(entry("first", scene));
  env.done({
    text,
    mode: "write",
    variables: evaluation.variablesNamed,
    supportsUsed: helps,
    words: evaluation.words,
  });
  env.announce?.(`${evaluation.reply.speaker}: ${evaluation.reply.text}`);
  focusLater(root, "[data-sc-reply]");
}

function onClick(root, env, event) {
  const target = event.target.closest?.("button, summary");
  if (!target || !root.contains(target)) return;
  const task = taskOf(env);
  if (target.dataset.scExamine) {
    const id = target.dataset.scExamine;
    const state = sceneOf(task, env);
    const next = examine(state, id, task);
    const object = task.objects.find((o) => o.id === id);
    if (next !== state)
      env.update({
        scene: next,
        draft: draftOf(root, "[data-sc-draft]") ?? env.data?.draft,
        lastAction: "examine",
      });
    // Most notes open with their own label ("Shadow map: since..."); say it once, not "Shadow map. Shadow map: since...".
    if (object)
      env.announce?.(
        object.note.toLowerCase().startsWith(object.label.toLowerCase()) ? object.note : `${object.label}. ${object.note}`,
      );
    focusLater(
      root,
      `.${target.classList.contains("sc-chip") ? "sc-chip" : "sc-hot"}[data-sc-examine="${id}"]`,
    );
  } else if (target.dataset.scSend !== undefined) send(root, env, false);
  else if (target.dataset.scSend2 !== undefined) send(root, env, true);
  else if (target.dataset.scFrame) {
    const field = root.querySelector("[data-sc-draft]");
    if (field) insertAtCaret(field, target.dataset.scFrame);
  } else if (target.dataset.scVocab) showGloss(root, env, target);
  else if (target.dataset.scHelp && !target.parentElement.open) {
    const id = target.dataset.scHelp;
    env.help(id);
    env.update({
      helps: [...new Set([...helpsOf(env), id])],
      draft: draftOf(root, "[data-sc-draft]") ?? env.data?.draft,
    });
    focusLater(root, `[data-sc-help="${id}"]`);
  }
}

function onChange(root, env, event) {
  const input = event.target;
  if (!input.matches?.("[data-sc-control]")) return;
  const task = taskOf(env);
  const state = sceneOf(task, env);
  const next = setControl(state, input.dataset.scControl, input.value, task);
  if (next === state) return;
  env.update({
    scene: next,
    draft: draftOf(root, "[data-sc-draft]") ?? env.data?.draft,
    lastAction: "control",
  });
  env.announce?.(currentOutcome(task, next).state);
  focusLater(root, `[data-sc-control="${input.dataset.scControl}"]:checked`);
}

function onInput(root, event) {
  if (!event.target.matches?.("[data-sc-draft]")) return;
  const n = wordCount(event.target.value);
  const words = root.querySelector("[data-sc-words]");
  const sendButton = root.querySelector("[data-sc-send]");
  if (words) words.textContent = wordsLine(root.__scEnv.I, n, Number(words.dataset.min));
  if (sendButton) sendButton.disabled = !canSend(event.target.value);
}

/** Attach behaviour once per root. Handlers read root.__scEnv so a re-mount with a fresh env never goes stale. */
export function mount(root, env) {
  root.__scEnv = env;
  if (root.__scBound) return;
  root.__scBound = true;
  let idle = 0;
  const persistDraft = () => {
    const field = root.querySelector("[data-sc-draft]");
    const e = root.__scEnv;
    if (field && field.value !== (e.data?.draft || "")) e.update({ draft: field.value });
  };
  root.addEventListener("click", (ev) => onClick(root, root.__scEnv, ev));
  root.addEventListener("change", (ev) => onChange(root, root.__scEnv, ev));
  root.addEventListener("input", (ev) => onInput(root, ev));
  // Save the draft when the learner leaves the box. Rebuilding the page at mousedown would swallow the click on
  // Send (Safari does not focus buttons), so wait a beat and cancel on any new pointer or key action.
  root.addEventListener("focusout", (ev) => {
    if (ev.target.matches?.("[data-sc-draft]")) idle = setTimeout(persistDraft, 700);
  });
  for (const name of ["pointerdown", "keydown"])
    root.addEventListener(name, () => clearTimeout(idle), true);
  root.ownerDocument.defaultView?.addEventListener("pagehide", persistDraft);
}

