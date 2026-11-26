// nexus/player.js — the student mission player (/curriculum/nexus/play/). It
// opens a mission from a share link (#m=…) or a flagship id (?id=…&goal=…),
// orchestrates its steps, keeps progress and evidence on this device only
// (save/resume), and never shows an authoring control. Nothing is sent
// anywhere: there is no account and no upload.

import { fromLibrary, decode, hashOf } from "./resource.mjs";
import { sequence, STEP_LABEL } from "./orchestrate.mjs";
import { record, useSupport } from "./response.mjs";
import { esc } from "./render.mjs";
import * as S from "./player-steps.js";

const STORE = "nt-nexus:v1:";
const RENDER = {
  story: S.renderStory,
  model: S.renderModel,
  twin: S.renderTwin,
  check: S.renderCheck,
  speak: S.renderSpeak,
  write: S.renderWrite,
  respond: S.renderRespond,
  transfer: S.renderTransfer,
  replay: S.renderReplay,
};

function loadResource() {
  const hash = new URLSearchParams(location.hash.slice(1));
  const q = new URLSearchParams(location.search);
  if (hash.get("m")) return decode(hash.get("m"));
  const r = fromLibrary(q.get("id") || "", q.get("goal") || "understand");
  if (r && ["off", "light", "full"].includes(q.get("support") || "")) r.support = q.get("support");
  return r;
}

function readState(key) {
  try {
    const s = JSON.parse(localStorage.getItem(key) || "null");
    if (s && typeof s === "object" && s.v === 1) return s;
  } catch {
    /* storage blocked or corrupt: start fresh */
  }
  return { v: 1, step: 0, answers: {}, evidence: {}, log: [], why: "", done: [] };
}

function boot() {
  const app = document.getElementById("nx-app");
  const r = loadResource();
  const q = new URLSearchParams(location.search);
  let lang =
    q.get("lang") === "es" || (!q.get("lang") && document.documentElement.lang === "es")
      ? "es"
      : "en";
  if (!r) {
    app.innerHTML = `<div class="nx-card"><h1>Mission not found</h1><p>This link is incomplete or was changed. Ask your teacher for the link again.</p><p lang="es">Este enlace está incompleto o cambió. Pide el enlace otra vez a tu maestro.</p></div>`;
    return;
  }
  const storeKey = hashOf(r);
  const key = STORE + storeKey;
  const state = readState(key);
  if (!Array.isArray(state.done)) state.done = [];
  const steps = sequence(r);
  state.step = Math.min(Math.max(0, state.step | 0), steps.length - 1);
  let persistWarned = false;

  const ctx = {
    r,
    state,
    storeKey,
    get lang() {
      return lang;
    },
    has: (id) => steps.includes(id),
    save() {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        if (!persistWarned) {
          persistWarned = true;
          const n = document.getElementById("nx-persist");
          if (n) n.hidden = false;
        }
      }
    },
    log(kind, text, miss = false) {
      state.log = [...state.log, { kind, text: String(text).slice(0, 200), miss }].slice(-80);
      ctx.save();
    },
    attempt(qid, j, text) {
      state.evidence = record(state.evidence, qid, {
        correct: j.correct,
        miscon: j.miscon ? j.miscon.why.en : null,
        text,
      });
      const label = qid.startsWith("f-")
        ? lang === "es"
          ? "Problema nuevo"
          : "Fresh problem"
        : qid.toUpperCase();
      ctx.log(
        "answer",
        `${label}: “${String(text).slice(0, 30)}” — ${j.correct ? (lang === "es" ? "correcto" : "correct") : lang === "es" ? "aún no" : "not yet"}`,
        !j.correct,
      );
    },
    support(qid, kind) {
      state.evidence = useSupport(state.evidence, qid, kind);
      ctx.log(
        "support",
        `${qid.toUpperCase()}: ${lang === "es" ? "abrió" : "opened"} ${kind === "hint" ? (lang === "es" ? "una pista" : "a hint") : lang === "es" ? "las palabras clave" : "the key words"}`,
      );
    },
    goto(id, force = false) {
      const i = steps.indexOf(id);
      if (i >= 0 && (force || i !== state.step)) show(i);
    },
  };

  function shell() {
    document.documentElement.lang = lang;
    const preview = q.get("preview") === "1";
    app.innerHTML = `${preview ? `<p class="nx-banner" role="note">${lang === "es" ? "Vista previa del maestro: esto es exactamente lo que ve un estudiante." : "Teacher preview: this is exactly what a student sees."}</p>` : ""}
      <div class="nx-top nx-noprint"><span class="nx-brand">${lang === "es" ? "Misión" : "Mission"}</span>
        <div class="nx-seg" role="group" aria-label="Language / Idioma"><button type="button" data-lang="en" aria-pressed="${lang === "en"}">English</button><button type="button" data-lang="es" aria-pressed="${lang === "es"}">Español</button></div></div>
      <h1>${esc(lang === "es" && r.title.es ? r.title.es : r.title.en)}</h1>
      <nav aria-label="${lang === "es" ? "Pasos de la misión" : "Mission steps"}"><ol class="nx-steps">${steps.map((s, i) => `<li><button type="button" class="nx-stepbtn" data-step="${i}">${i + 1}. ${esc(STEP_LABEL[s][lang])}</button></li>`).join("")}</ol></nav>
      <p class="nx-banner" id="nx-persist" hidden>${lang === "es" ? "Este dispositivo no permite guardar. Tu trabajo se borra al cerrar la página." : "This device does not allow saving. Your work clears when you close the page."}</p>
      <section class="nx-card" id="nx-step" tabindex="-1" aria-live="off"></section>
      <div class="nx-nav nx-noprint"><button type="button" class="nx-btn" data-move="-1">← ${lang === "es" ? "Atrás" : "Back"}</button><button type="button" class="nx-btn primary" data-move="1">${lang === "es" ? "Siguiente" : "Next"} →</button></div>`;
  }

  async function show(i, focus = true) {
    state.step = i;
    if (!state.done.includes(steps[i])) state.done = [...state.done, steps[i]];
    ctx.save();
    app.querySelectorAll("[data-step]").forEach((b, n) => {
      b.toggleAttribute("aria-current", n === i);
      if (n === i) b.setAttribute("aria-current", "step");
      b.classList.toggle("done", state.done.includes(steps[n]) && n !== i);
    });
    const host = app.querySelector("#nx-step");
    host.onclick = null;
    host.oninput = null;
    host.onchange = null;
    host.innerHTML = "";
    const inner = document.createElement("div");
    host.appendChild(inner);
    await RENDER[steps[i]](ctx, inner);
    app.querySelector('[data-move="-1"]').disabled = i === 0;
    app.querySelector('[data-move="1"]').disabled = i === steps.length - 1;
    if (focus) host.focus({ preventScroll: false });
  }

  shell();
  S.bindSpeech(app, () => lang);
  app.addEventListener("click", (e) => {
    const s = e.target.closest("[data-step]");
    const m = e.target.closest("[data-move]");
    const l = e.target.closest("[data-lang]");
    if (s) show(Number(s.dataset.step));
    if (m) show(Math.min(steps.length - 1, Math.max(0, state.step + Number(m.dataset.move))));
    if (l && l.dataset.lang !== lang) {
      lang = l.dataset.lang;
      shell();
      show(state.step, false);
    }
  });
  show(state.step, false);
}

boot();
