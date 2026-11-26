// nexus/player-steps.js — the student-facing step renderers. Each takes the
// player context (resource, state, language, helpers) and a host element. They
// only read the resource and write observable evidence through ctx; no step can
// edit the resource (students never see authoring controls).

import { mountLivingScene } from "../../engine/core/living-scene.js";
import { LIVING_PLAYS } from "../../engine/components/living/index.js";
import { KITS, validModel } from "./kits.mjs";
import { overlay } from "./language.mjs";
import { esc } from "./render.mjs";
import { consequences, judge, questions, story, transferQuestion } from "./resource.mjs";
import { respond } from "./response.mjs";

const UI = {
  en: {
    check: "Check",
    hint: "Hint",
    words: "Key words",
    right: "Correct.",
    notYet: "Not yet. Look at the numbers again and try once more.",
    seeModel: "See it in the model",
    listen: "Listen",
    answer: "Your answer",
    rehearsed: "I said it out loud to a partner or to myself",
    write: "Write your explanation",
    bank: "Word bank (tap to add)",
    modelNone: "The animated model is not available for these numbers.",
    whatIf: "Change a number. Everything that depends on it updates.",
    cant: "Those numbers do not make a shape or mix the model can show truthfully. Try another value.",
    fresh: "Fresh problem (no hints)",
    observed: "What we saw",
    possible: "Possible explanation",
    nextStep: "Suggested next step",
    noLog: "Nothing yet. Your answers and revisions appear here as you work.",
    print: "Print my work",
    tries: "tries",
    try: "try",
    used: "used",
    explanation: "My explanation",
  },
  es: {
    check: "Comprobar",
    hint: "Pista",
    words: "Palabras clave",
    right: "Correcto.",
    notYet: "Aún no. Mira los números otra vez e inténtalo de nuevo.",
    seeModel: "Míralo en el modelo",
    listen: "Escuchar",
    answer: "Tu respuesta",
    rehearsed: "Lo dije en voz alta a un compañero o a mí mismo",
    write: "Escribe tu explicación",
    bank: "Banco de palabras (toca para agregar)",
    modelNone: "El modelo animado no está disponible para estos números.",
    whatIf: "Cambia un número. Todo lo que depende de él se actualiza.",
    cant: "Esos números no forman una figura o mezcla que el modelo pueda mostrar con verdad. Prueba otro valor.",
    fresh: "Problema nuevo (sin pistas)",
    observed: "Lo que vimos",
    possible: "Posible explicación",
    nextStep: "Siguiente paso sugerido",
    noLog: "Nada todavía. Tus respuestas y revisiones aparecen aquí mientras trabajas.",
    print: "Imprimir mi trabajo",
    tries: "intentos",
    try: "intento",
    used: "usó",
    explanation: "Mi explicación",
  },
};

export const ui = (lang) => UI[lang] || UI.en;
const T = (p, lang) => (lang === "es" && p?.es ? p.es : p?.en || "");

function speak(text, lang) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-US" : "en-US";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  } catch {
    /* no voice on this device: the text is on screen */
  }
}
const canSpeak = () => typeof speechSynthesis !== "undefined";
const listenBtn = (text, lang) =>
  canSpeak()
    ? `<button type="button" class="nx-btn" data-say="${esc(text)}">🔊 ${ui(lang).listen}</button>`
    : "";

export function bindSpeech(host, getLang) {
  host.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (b) speak(b.dataset.say, getLang());
  });
}

export function renderStory(ctx, host) {
  const { r, lang } = ctx;
  const s = T(story(r), lang);
  host.innerHTML = `<p class="nx-kicker">${esc(T(KITS[r.kit].skill, lang))}</p><h2>${esc(T(r.title, lang))}</h2><p><b>${lang === "es" ? "Meta" : "Goal"}:</b> ${esc(T(r.objective, lang))}</p><div class="nx-card"><p>${esc(s)}</p>${listenBtn(s, lang)}</div>`;
}

export async function renderModel(ctx, host) {
  const { r, lang, storeKey } = ctx;
  host.innerHTML = `<p class="nx-note">${lang === "es" ? "Predice antes de mirar. El modelo espera tu predicción." : "Predict before you look. The model waits for your prediction."}</p><div data-model></div>`;
  const load = LIVING_PLAYS[r.kit];
  const build = load ? await load() : null;
  const play = build ? build(r.model) : null;
  const slot = host.querySelector("[data-model]");
  if (!play) {
    slot.innerHTML = `<p class="nx-fb cue">${ui(lang).modelNone}</p>`;
    return;
  }
  mountLivingScene(slot, play, { storeKey: `nexus-${storeKey}`, surface: "nexus" });
  ctx.log("model", lang === "es" ? "Abrió el modelo animado" : "Opened the animated model");
}

export function renderTwin(ctx, host) {
  const { r, lang } = ctx;
  const kit = KITS[r.kit];
  const st =
    ctx.state.twin ||
    (ctx.state.twin = { model: { ...r.model }, env: { ...kit.envDefaults, ...r.env } });
  const fields = kit.fields;
  const draw = () => {
    const v = validModel(r.kit, st.model, st.env);
    const out = host.querySelector("[data-out]");
    if (!v) {
      out.innerHTML = `<p class="nx-fb cue" role="status">${ui(lang).cant}</p>`;
      return;
    }
    const rows = consequences({ ...r, model: st.model, env: st.env });
    out.innerHTML = `<table class="nx-table" aria-live="polite"><caption class="nx-sr">${lang === "es" ? "Resultados" : "Results"}</caption>${rows.map((x) => `<tr><th scope="row">${esc(T(x.label, lang))}</th><td>${esc(String(x.value))}</td></tr>`).join("")}</table>`;
  };
  if (!fields.length) {
    // Data-set kits explore by editing one value.
    host.innerHTML = `<p>${ui(lang).whatIf}</p>${st.model.values.map((x, i) => `<div class="nx-range"><label for="tw-${i}">${esc(T(st.model.labels?.[i] || { en: `Value ${i + 1}`, es: `Valor ${i + 1}` }, lang))}</label><input id="tw-${i}" type="range" min="0" max="${8 * (st.model.unit || 1)}" step="${st.model.unit || 1}" value="${x}" data-vi="${i}"><output for="tw-${i}">${x}</output></div>`).join("")}<div data-out></div>`;
  } else {
    host.innerHTML = `<p>${ui(lang).whatIf}</p>${fields
      .map((f) => {
        const val = f.env ? st.env[f.key] : st.model[f.key];
        return `<div class="nx-range"><label for="tw-${f.key}">${esc(T(f.label, lang))}</label><input id="tw-${f.key}" type="range" min="${f.min}" max="${f.max}" step="1" value="${val}" data-k="${f.key}" data-env="${f.env ? 1 : ""}"><output for="tw-${f.key}">${val}</output></div>`;
      })
      .join("")}<div data-out></div>`;
  }
  host.oninput = (e) => {
    const t = e.target;
    if (t.type !== "range") return;
    const n = Number(t.value);
    if (t.dataset.vi != null)
      st.model = {
        ...st.model,
        values: st.model.values.map((x, i) => (i === Number(t.dataset.vi) ? n : x)),
      };
    else if (t.dataset.env) st.env = { ...st.env, [t.dataset.k]: n };
    else st.model = { ...st.model, [t.dataset.k]: n };
    t.nextElementSibling.textContent = String(n);
    draw();
    ctx.save();
  };
  host.onchange = (e) => {
    if (e.target.type === "range")
      ctx.log("twin", `${e.target.labels?.[0]?.textContent || ""} → ${e.target.value}`);
  };
  draw();
}

function questionHtml(q, n, ctx, { hints = true } = {}) {
  const { lang, state } = ctx;
  const u = ui(lang);
  const saved = state.answers[q.id] || "";
  return `<div class="nx-q" data-q="${q.id}"><p><b>${n}.</b> ${esc(T(q.stem, lang))}</p><div class="nx-row"><label class="nx-sr" for="a-${q.id}">${u.answer}</label><input class="nx-input" id="a-${q.id}" inputmode="decimal" autocomplete="off" value="${esc(saved)}"><span>${esc(T(q.unit, lang))}</span><button type="button" class="nx-btn primary" data-check="${q.id}">${u.check}</button>${hints ? `<button type="button" class="nx-btn" data-hint="${q.id}">${u.hint}</button>` : ""}${hints && ctx.r.vocab.length ? `<button type="button" class="nx-btn" data-words="${q.id}">${u.words}</button>` : ""}</div><p class="nx-fb" role="status" data-fb="${q.id}"></p></div>`;
}

/** Wire check/hint/words for a set of questions; `onJudge` sees each attempt. */
function bindQuestions(ctx, host, list, onJudge = () => {}) {
  const { lang } = ctx;
  const u = ui(lang);
  const fb = (id, html, okClass) => {
    const el = host.querySelector(`[data-fb="${id}"]`);
    el.innerHTML = html;
    el.className = `nx-fb${okClass ? "" : " cue"}`;
  };
  host.onclick = (e) => {
    const c = e.target.closest("[data-check]");
    const h = e.target.closest("[data-hint]");
    const w = e.target.closest("[data-words]");
    const go = e.target.closest("[data-goto]");
    if (go) return ctx.goto(go.dataset.goto);
    if (c) {
      const q = list.find((x) => x.id === c.dataset.check);
      const text = host.querySelector(`#a-${q.id}`).value;
      ctx.state.answers[q.id] = text;
      const j = judge(q, text);
      ctx.attempt(q.id, j, text);
      if (j.correct) fb(q.id, `✓ ${u.right}`, true);
      else {
        const why = j.miscon ? T(j.miscon.why, lang) : u.notYet;
        const jump =
          j.miscon?.support === "model" && ctx.has("model")
            ? ` <button type="button" class="nx-btn" data-goto="model">${u.seeModel}</button>`
            : "";
        fb(q.id, esc(why) + jump, false);
      }
      onJudge(q, j);
    }
    if (h) {
      const q = list.find((x) => x.id === h.dataset.hint);
      ctx.support(q.id, "hint");
      fb(q.id, esc(T(q.hint, lang)), false);
    }
    if (w) {
      ctx.support(w.dataset.words, "words");
      fb(
        w.dataset.words,
        ctx.r.vocab
          .map((v) => `<b>${esc(T(v.term, lang))}</b>: ${esc(T(v.def, lang))}`)
          .join("<br>"),
        true,
      );
    }
  };
}

export function renderCheck(ctx, host) {
  const qs = questions(ctx.r);
  host.innerHTML = qs.map((q, i) => questionHtml(q, i + 1, ctx)).join("");
  bindQuestions(ctx, host, qs);
}

export function renderTransfer(ctx, host) {
  const seed = ctx.state.freshSeed || "transfer";
  const t = { ...transferQuestion(ctx.r, seed), id: seed === "transfer" ? "t1" : `f-${seed}` };
  const fresh = seed !== "transfer";
  host.innerHTML = `<p>${fresh ? ui(ctx.lang).fresh : ctx.lang === "es" ? "Una situación que no has visto. Usa la misma idea." : "A situation you have not seen. Use the same idea."}</p>${questionHtml(t, 1, ctx, { hints: !fresh })}`;
  bindQuestions(ctx, host, [t], (q, j) => {
    if (fresh) {
      const e = ctx.state.evidence[q.id];
      if (e?.correct && e.tries === 1) ctx.state.freshIndependent = true;
    } else {
      ctx.state.transferDone = ctx.state.transferDone || j.correct;
      const e = ctx.state.evidence.t1;
      ctx.state.transferIndependent = !!(e?.correct && e.tries === 1 && !e.supports.length);
    }
    ctx.save();
  });
}

function framesHtml(ov, lang) {
  if (!ov) return "";
  const frames = [...ov.kernels, ...(ov.bbs || [])]
    .map((f) => `<p class="nx-frame">${esc(T(f, lang))}</p>`)
    .join("");
  const bank = ov.bank.length
    ? `<p class="nx-note">${ui(lang).bank}</p><div class="nx-row">${ov.bank.map((b) => `<button type="button" class="nx-chip" data-word="${esc(T(b, lang))}">${esc(T(b, lang))}</button>`).join("")}</div>`
    : "";
  return frames + bank;
}

export function renderSpeak(ctx, host) {
  const { r, lang } = ctx;
  const ov = overlay(r);
  const prompt = T(ov?.speak, lang);
  host.innerHTML = `<p><b>${esc(prompt)}</b></p>${listenBtn(prompt, lang)}${framesHtml(ov, lang)}<p><label><input type="checkbox" data-rehearsed ${ctx.state.rehearsed ? "checked" : ""}> ${ui(lang).rehearsed}</label></p>`;
  host.onchange = (e) => {
    if (e.target.matches("[data-rehearsed]")) {
      ctx.state.rehearsed = e.target.checked;
      if (e.target.checked)
        ctx.log(
          "speak",
          lang === "es"
            ? "Ensayó la explicación en voz alta"
            : "Rehearsed the explanation out loud",
        );
      ctx.save();
    }
  };
}

export function renderWrite(ctx, host) {
  const { r, lang } = ctx;
  const ov = overlay(r);
  host.innerHTML = `${framesHtml(ov, lang)}<div class="nx-field"><label for="why">${ui(lang).write}</label><textarea class="nx-input" id="why">${esc(ctx.state.why || "")}</textarea></div>`;
  const ta = host.querySelector("#why");
  let timer;
  ta.oninput = () => {
    ctx.state.why = ta.value.slice(0, 2000);
    clearTimeout(timer);
    timer = setTimeout(() => {
      ctx.log(
        "write",
        `${lang === "es" ? "Revisó la explicación" : "Revised the explanation"} (${ta.value.trim().split(/\s+/).filter(Boolean).length} ${lang === "es" ? "palabras" : "words"})`,
      );
      ctx.save();
    }, 1200);
  };
  host.onclick = (e) => {
    const b = e.target.closest("[data-word]");
    if (!b) return;
    ta.value = `${ta.value.replace(/\s*$/, "")}${ta.value ? " " : ""}${b.dataset.word}`;
    ta.dispatchEvent(new Event("input"));
    ta.focus();
  };
}

export function renderRespond(ctx, host) {
  const { lang } = ctx;
  const u = ui(lang);
  const qs = questions(ctx.r);
  const res = respond(ctx.state.evidence, qs, ctx.state);
  const action = {
    model: ctx.has("model")
      ? `<button type="button" class="nx-btn primary" data-goto="model">${u.seeModel}</button>`
      : "",
    vocab: `<button type="button" class="nx-btn primary" data-goto="check">${lang === "es" ? "Volver a las preguntas" : "Back to the questions"}</button>`,
    prerequisite: ctx.has("model")
      ? `<button type="button" class="nx-btn primary" data-goto="model">${u.seeModel}</button>`
      : `<button type="button" class="nx-btn primary" data-goto="story">${lang === "es" ? "Volver a la situación" : "Back to the situation"}</button>`,
    continue: `<button type="button" class="nx-btn primary" data-goto="check">${lang === "es" ? "Volver a las preguntas" : "Back to the questions"}</button>`,
    fresh: `<button type="button" class="nx-btn primary" data-fresh>${u.fresh}</button>`,
    transfer: `<button type="button" class="nx-btn primary" data-goto="transfer">${lang === "es" ? "Ir al problema nuevo" : "Go to the new problem"}</button>`,
    explain: ctx.has("write")
      ? `<button type="button" class="nx-btn primary" data-goto="write">${u.write}</button>`
      : "",
  }[res.next.kind];
  const vocabList =
    res.next.kind === "vocab"
      ? `<ul>${ctx.r.vocab.map((v) => `<li><b>${esc(T(v.term, lang))}</b>: ${esc(T(v.def, lang))}</li>`).join("")}</ul>`
      : "";
  host.innerHTML = `<div class="nx-card"><p class="nx-kicker">${u.nextStep}</p><h3>${esc(T(res.next.title, lang))}</h3><p>${esc(T(res.next.why, lang))}</p>${vocabList}<div class="nx-row">${action || ""}</div></div>${res.possible.length ? `<h3>${u.possible}</h3><ul>${res.possible.map((p) => `<li>${esc(T(p.text, lang))}</li>`).join("")}</ul>` : ""}<details class="nx-more"><summary>${u.observed}</summary><ul>${res.observed.map((o) => `<li>${esc(o)}</li>`).join("") || `<li>${u.noLog}</li>`}</ul><p class="nx-note">${esc(res.caution)}</p></details>`;
  host.onclick = (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) ctx.goto(g.dataset.goto);
    if (e.target.closest("[data-fresh]")) {
      ctx.state.freshSeed = `s${Date.now() % 100000}`;
      ctx.log(
        "respond",
        lang === "es"
          ? "Pidió un problema nuevo sin pistas"
          : "Asked for a fresh problem with no hints",
      );
      ctx.goto(ctx.has("transfer") ? "transfer" : "check", true);
    }
  };
}

export function renderReplay(ctx, host) {
  const { lang } = ctx;
  const u = ui(lang);
  const log = ctx.state.log;
  host.innerHTML = `${log.length ? `<ol class="nx-log">${log.map((x) => `<li class="${x.miss ? "miss" : ""}">${esc(x.text)}</li>`).join("")}</ol>` : `<p>${u.noLog}</p>`}${ctx.state.why ? `<h3>${u.explanation}</h3><p>${esc(ctx.state.why)}</p>` : ""}<p class="nx-noprint"><button type="button" class="nx-btn" data-print>${u.print}</button></p>`;
  host.onclick = (e) => {
    if (e.target.closest("[data-print]")) print();
  };
}
