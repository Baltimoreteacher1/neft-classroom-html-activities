// Shared Language Game Studio engine: support modes, round bookkeeping, the standard
// miss -> hint -> revise -> reveal loop, feedback, hints, audio, glosses and drag-and-drop.
// Every game module builds on these so scaffolds, feedback and evidence mean the same thing everywhere.
//
// A game module exports (src/games/<module>.js, default export):
//   init(env)                         -> serializable state (use env.rng for any shuffle: seeded, resumable)
//   view(state, env)                  -> HTML for the stage (pure function of state: reload resumes it)
//   click(el, state, env)             -> true when state changed (engine saves and re-renders)
//   input?(el, state, env)            -> true when state changed       (text fields)
//   key?(e, state, env)               -> true when state changed       (keyboard play)
//   mount?(root, state, env)          -> after each render: attach pointer drag, focus, canvas; may return cleanup
//   done(state)                       -> true when every round is finished
//   progress(state)                   -> { done, total }
//   plan(state, { wrong })            -> [{click:sel} | {fill:[sel,text]} | {drag:[fromSel,toSel]} | {key:"ArrowRight"}]
//                                        (the QA hook: one correct (or deliberately wrong) step; only reachable with ?qa=1)
//   validate?(content)                -> string[] of content problems (run by tools/validate-access-game-studio.mjs)
import { esc, html, icon, raw } from "../util.js";

export const SUP = {
  A: { key: "A", name: ["Starting", "Comenzando"], audio: "auto", gloss: "show", frames: "full", bank: true, hints: 3, visuals: true, blurb: ["Pictures, audio, Spanish help and sentence frames are on.", "Imágenes, audio, ayuda en español y estructuras de oración están activadas."] },
  B: { key: "B", name: ["Growing", "Creciendo"], audio: "tap", gloss: "tap", frames: "starter", bank: true, hints: 2, visuals: true, blurb: ["Audio and Spanish help are one tap away. Frames only give you the first words.", "El audio y la ayuda en español están a un toque. Las estructuras solo dan las primeras palabras."] },
  C: { key: "C", name: ["Expanding", "Ampliando"], audio: "tap", gloss: "off", frames: "none", bank: false, hints: 1, visuals: false, blurb: ["You work on your own. Help is there if you open it, and it is saved as help.", "Trabajas por tu cuenta. La ayuda está disponible si la abres y se registra como ayuda."] },
};
export const supOf = (key) => SUP[key] || SUP.A;

// ── seeded randomness (a reload must show the same game) ───────────────────────────────────
export function rng(seed = 1) {
  let t = (Math.floor(seed) || 1) >>> 0;
  const next = () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
  next.int = (n) => Math.floor(next() * n);
  next.pick = (list) => list[next.int(list.length)];
  return next;
}
export function shuffle(list, random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = random.int(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
/** Shuffle choices but keep the correct one off position 0 only when a stable order is wanted. */
export function mixChoices(choices, answerIndex, random) {
  const order = shuffle(choices.map((_, i) => i), random);
  return { choices: order.map((i) => choices[i]), answer: order.indexOf(answerIndex) };
}

// ── round bookkeeping: the standard loop ──────────────────────────────────────────────────
export const newRound = () => ({ tries: 0, h: 0, status: "open", revised: false, picks: [] });
/**
 * One check. `ok` decides it. First miss -> "retry" (hint, then try again); second miss -> "revealed"
 * (the explanation and the answer are shown, and the round counts as not-first-try); right -> "right".
 * Returns the round with its new status; the game decides what to show.
 */
export function judge(rs, ok, env, { id, skill, extra } = {}) {
  rs.tries += 1;
  if (ok) {
    rs.status = "right";
    rs.revised = rs.tries > 1;
  } else {
    rs.status = rs.tries >= 2 ? "revealed" : "retry";
  }
  if (rs.status !== "retry")
    env.report({ id, skill, ok: Boolean(ok), first: ok && rs.tries === 1 && rs.h === 0, hints: rs.h, revised: rs.revised, ...extra });
  return rs;
}
export const settled = (rs) => rs.status === "right" || rs.status === "revealed";
/** Open the next hint (never more than the support mode allows). Returns the hint index shown or -1. */
export function takeHint(rs, env) {
  const max = env.sup.hints;
  if (rs.h >= max) return -1;
  rs.h += 1;
  env.use("hint");
  return rs.h - 1;
}

// ── shared markup ─────────────────────────────────────────────────────────────────────────
export const audioBtn = (text, I, label) =>
  html`<button type="button" class="gs-audio" data-say="${text}" aria-label="${label || I.S("Listen", "Escuchar")}: ${text}">${icon("listening")}<span class="gs-audio-t">${I.T("Listen", "Escuchar")}</span></button>`;

/** A word with optional audio and Spanish gloss that follow the support mode. */
export function glossHTML(es, env) {
  if (!es || env.sup.gloss === "off") return "";
  if (env.sup.gloss === "show") return html`<span class="gs-gloss" lang="es">${es}</span>`;
  return html`<details class="gs-gloss-tap"><summary>${env.I.T("Español", "Español")}</summary><span lang="es">${es}</span></details>`;
}

export function feedbackHTML(rs, { right, retry, explain, answer, hint, I }) {
  if (!rs || rs.status === "open") return "";
  const tone = rs.status === "right" ? "right" : rs.status === "retry" ? "retry" : "reveal";
  const head = { right: I.T("That works.", "Eso funciona."), retry: I.T("Not yet. Look again and revise.", "Todavía no. Mira de nuevo y revisa."), reveal: I.T("Here is how it works.", "Así funciona.") }[tone];
  return html`<div class="gs-feedback is-${tone}" role="status" aria-live="polite">
    <p class="gs-fb-head">${icon(tone === "right" ? "check" : tone === "retry" ? "help" : "sparkle")}<strong>${head}</strong></p>
    ${tone === "right" && right ? html`<p>${right}</p>` : ""}
    ${tone === "retry" && retry ? html`<p>${retry}</p>` : ""}
    ${tone === "reveal" ? html`${answer ? html`<p class="gs-fb-answer">${answer}</p>` : ""}${explain ? html`<p>${explain}</p>` : ""}` : ""}
    ${tone === "right" && explain ? html`<p class="fine">${explain}</p>` : ""}
    ${hint ? html`<p class="gs-hint">${icon("sparkle")}${hint}</p>` : ""}
  </div>`;
}

/** The hint button + ladder for a round: shows the hints taken so far and the next-hint button. */
export function hintHTML(rs, hints, env, { disabled = false } = {}) {
  const I = env.I;
  const max = Math.min(env.sup.hints, hints.length);
  const shown = hints.slice(0, rs.h);
  return html`<div class="gs-hints">
    ${shown.map((h, i) => html`<p class="gs-hint" id="gs-hint-${i}">${icon("sparkle")}<span class="gs-hint-n">${I.S("Hint", "Pista")} ${i + 1}</span> ${h}</p>`)}
    ${rs.h < max && !disabled && !settled(rs) ? html`<button type="button" class="btn small" data-g-hint>${icon("sparkle")}${rs.h ? I.T("Another hint", "Otra pista") : I.T("I need a hint", "Necesito una pista")}</button>` : ""}
  </div>`;
}

export const pips = (done, total, label, S = (en) => en) => {
  const items = Array.from({ length: total }, (_, i) => {
    const status = i < done ? S("Completed", "Completado") : i === done ? S("Current", "Actual") : "";
    const state = i < done ? "is-done" : i === done ? "is-now" : "";
    return html`<li class="${state}"><span class="visually-hidden">${status}</span></li>`;
  });
  return html`<ol class="gs-pips" aria-label="${label}">${items}</ol>`;
};

export const frameBox = (text, env, { label } = {}) => {
  if (!text || env.sup.frames === "none") return "";
  const shown = env.sup.frames === "starter" ? String(text).split(/\s+/).slice(0, 3).join(" ") + " …" : text;
  return html`<p class="gs-frame"><span class="gs-frame-l">${label || env.I.T("Sentence frame", "Estructura de oración")}</span> ${shown}</p>`;
};

/** A choice button group. `sel` marks one, `locked` disables the group. */
export function choiceList(choices, { name, sel = -1, locked = false, right = -1, picked = [] }) {
  return html`<div class="gs-choices" role="group">
    ${choices.map((c, i) => html`<button type="button" class="gs-choice${i === sel ? " is-sel" : ""}${locked && i === right ? " is-right" : ""}${picked.includes(i) && i !== right ? " is-miss" : ""}" data-g-${name}="${i}" ${locked ? "disabled" : ""} aria-pressed="${i === sel}">${c}</button>`)}
  </div>`;
}

// ── drag and drop (pointer drag + tap-to-place, both keyboard-reachable) ───────────────────
// Items carry [data-drag="<id>"], targets [data-drop="<id>"]. Tapping an item selects it (aria-pressed);
// tapping a target places it. Dragging with a pointer does the same. Calls onDrop(itemId, targetId).
export function dnd(root, { onDrop, itemSel = "[data-drag]", zoneSel = "[data-drop]", I }) {
  let held = null;
  let ghost = null;
  let moved = false;
  const clear = () => {
    root.querySelectorAll(`${itemSel}[aria-pressed="true"]`).forEach((n) => n.setAttribute("aria-pressed", "false"));
    root.querySelectorAll(".is-hot").forEach((n) => n.classList.remove("is-hot"));
    ghost?.remove();
    ghost = null;
    held = null;
    moved = false;
  };
  const zoneAt = (x, y) => document.elementsFromPoint(x, y).map((n) => n.closest?.(zoneSel) || n.closest?.("[data-drop-in]")?.querySelector(zoneSel)).find((n) => n && root.contains(n));
  const down = (e) => {
    const item = e.target.closest(itemSel);
    if (!item || !root.contains(item) || item.disabled || e.button > 0) return;
    held = { item, id: item.dataset.drag, x: e.clientX, y: e.clientY, pointer: e.pointerId };
  };
  const move = (e) => {
    if (!held || e.pointerId !== held.pointer) return;
    if (!moved && Math.hypot(e.clientX - held.x, e.clientY - held.y) < 6) return;
    if (!moved) {
      moved = true;
      ghost = held.item.cloneNode(true);
      ghost.classList.add("gs-ghost");
      ghost.removeAttribute("id");
      ghost.style.width = `${held.item.offsetWidth}px`;
      document.body.append(ghost);
      held.item.classList.add("is-lifted");
    }
    ghost.style.transform = `translate(${e.clientX - held.item.offsetWidth / 2}px, ${e.clientY - 20}px)`;
    root.querySelectorAll(".is-hot").forEach((n) => n.classList.remove("is-hot"));
    zoneAt(e.clientX, e.clientY)?.classList.add("is-hot");
    e.preventDefault();
  };
  const up = (e) => {
    if (!held || e.pointerId !== held.pointer) return;
    const { id, item } = held;
    if (moved) {
      const zone = zoneAt(e.clientX, e.clientY);
      item.classList.remove("is-lifted");
      suppress = true;
      setTimeout(() => { suppress = false; }, 0);
      clear();
      if (zone) onDrop(id, zone.dataset.drop);
      return;
    }
    clear();
  };
  let suppress = false;
  const click = (e) => {
    if (suppress) return;
    const item = e.target.closest(itemSel);
    const zone = e.target.closest(zoneSel) || e.target.closest("[data-drop-in]")?.querySelector(zoneSel);
    const picked = root.querySelector(`${itemSel}[aria-pressed="true"]`);
    if (item && root.contains(item) && !item.disabled) {
      const was = item.getAttribute("aria-pressed") === "true";
      root.querySelectorAll(`${itemSel}[aria-pressed="true"]`).forEach((n) => n.setAttribute("aria-pressed", "false"));
      item.setAttribute("aria-pressed", String(!was));
      const live = document.getElementById("labLive");
      if (live && I && !was) live.textContent = I.S("Picked up. Choose where it goes.", "Seleccionado. Elige dónde va.");
      return;
    }
    if (zone && root.contains(zone) && picked) {
      const id = picked.dataset.drag;
      picked.setAttribute("aria-pressed", "false");
      onDrop(id, zone.dataset.drop);
    }
  };
  root.addEventListener("pointerdown", down);
  window.addEventListener("pointermove", move, { passive: false });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", clear);
  root.addEventListener("click", click, true);
  root.querySelectorAll(itemSel).forEach((n) => { n.style.touchAction = "none"; });
  return () => {
    clear();
    root.removeEventListener("pointerdown", down);
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", clear);
    root.removeEventListener("click", click, true);
  };
}

/** Compare typed/typed-like text with an accepted list, ignoring case, spacing and end punctuation. */
export const sameText = (a, b) => norm(a) === norm(b);
export const norm = (t) => String(t ?? "").toLowerCase().replace(/[“”"']/g, "").replace(/[.,!?;:]+(\s|$)/g, "$1").replace(/\s+/g, " ").trim();

export const countWords = (t) => String(t || "").trim().split(/\s+/).filter(Boolean).length;
export { esc, html, icon, raw };
