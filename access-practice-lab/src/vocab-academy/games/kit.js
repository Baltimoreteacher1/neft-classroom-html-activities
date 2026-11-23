// Vocabulary Academy games — the shared game controller. A game supplies its mechanic as a `spec`
// (build / view / click / key / isDone); this file supplies everything every game must do the same way:
// the shell (title, How to play with chunked directions and documented keys, progress, restart),
// the aria-live status line, supports (audio, picture, Spanish gloss, word bank), focus that survives a
// re-render, roving arrow-key focus, number keys for choices, in-run resume, the finish screen, and the
// single path to onResult. No timers that punish, no links out of the game.
import { emptySupports } from "../contract.js";
import { rngFor } from "../rng.js";
import { langMode, makeI18n } from "../../i18n.js";
import { esc, html, icon, raw, toHtml } from "../../util.js";
import { normalize, seedFor } from "./data.js";
import { mcHint, mcPick } from "./questions.js";

export { esc, html, icon, raw, toHtml };

/** In-run resume: a re-render, a language switch or a route change keeps the run. Memory only, never storage. */
const RESUME = new Map();
const MOUNTED = Symbol("vaGame");
let UID = 0;

const COPY = {
  how: ["How to play", "Cómo jugar"],
  restart: ["Start over", "Empezar de nuevo"],
  again: ["Play again", "Jugar otra vez"],
  step: ["Step", "Paso"],
  of: ["of", "de"],
  back: ["Back", "Atrás"],
  next: ["Next step", "Siguiente paso"],
  keys: ["Keys", "Teclas"],
  resumed: ["You are back where you left off.", "Volviste donde te quedaste."],
  done: ["Run complete", "Ronda completa"],
  quickly: ["Got it with no misses", "Lo lograste sin errores"],
  practice: ["Worth another look", "Vale la pena repasar"],
  listen: ["Listen", "Escuchar"],
  hint: ["Hint", "Pista"],
  loading: ["Getting your words ready…", "Preparando tus palabras…"],
  empty: [
    "This game needs more words than this set has. Choose a lesson and try again.",
    "Este juego necesita más palabras. Elige una lección e inténtalo de nuevo.",
  ],
};

/** Effective supports: the teacher/profile flags plus what the grade band always provides. */
export function effectiveSupports(ctxSupports, band) {
  const s = { ...emptySupports(), ...(ctxSupports || {}) };
  const early = band === "early";
  const young = early || band === "upper-elem";
  return {
    ...s,
    picture: s.picture || young,
    audio: s.audio || s.readAloud || early,
    readAloud: s.readAloud || early,
    chunked: s.chunked || early,
    wordBank: s.wordBank || young,
    frames: s.frames || early,
    starters: s.starters || young,
  };
}

/**
 * Mount one game. spec:
 *   id, title:[en,es], howTo:[[en,es]…], keys:[[label,[en,es]]…], numberKeys (default true)
 *   load?(env) -> Promise (async data), build(env) -> state, view(state, env) -> html
 *   click(el, state, env, ev) -> true when state changed;  key?(ev, state, env);  input?(el, state, env, ev)
 *   isDone(state), progress(state) -> {done,total}, extra?(state, env) -> summary extras
 *   after?(body, state, env) -> DOM hook after each render (drawing lines, focus)
 * Returns a handle { destroy(), ready, note, env }.
 */
export function mountGame(root, opts, spec) {
  root[MOUNTED]?.destroy();
  const pool = normalize(opts);
  const I = makeI18n(langMode(opts.ctx?.prefs), "en");
  const sup = effectiveSupports(opts.ctx?.supports, pool.band);
  const handle = {
    destroy,
    ready: null,
    note: "",
    env: null,
    /** A read-only copy of the run's state, for tests and the teacher preview. */
    peek: () => (state ? JSON.parse(JSON.stringify(state)) : null),
  };
  root[MOUNTED] = handle;
  let run = Number.isInteger(opts.run) ? opts.run : 0;
  let state = null;
  let finished = false;
  let summary = null;
  let resumed = false;
  let how = false;
  let howStep = 0;
  let alive = true;
  let art = null;
  const log = [];
  const used = new Set();
  const uid = `vag${++UID}`;
  const key = () => `${spec.id}|${pool.id}|${run}`;
  const T = (en, es) => toHtml(I.T(en, es));

  const env = {
    id: spec.id,
    uid,
    I,
    T: (en, es) => I.T(en, es),
    S: (en, es) => I.S(en, es),
    opts,
    ctx: opts.ctx || {},
    pool,
    band: pool.band,
    sup,
    run,
    seed: opts.seed != null ? opts.seed + run : seedFor(spec.id, pool, run),
    rng: null,
    log,
    note: (n) => {
      handle.note = n;
      env.noteText = n;
    },
    noteText: "",
    say(msg) {
      const live = root.querySelector(".vag-status");
      if (!live) return;
      live.textContent = "";
      setTimeout(() => {
        if (alive) live.textContent = msg;
      }, 30);
    },
    use: (k) => used.add(k),
    report(r) {
      // A practice word that is not one of the learner's unit words (for example a Word Study derivation) has no
      // record to credit, so it is practised but never reported.
      if (!r.wordId) {
        used.clear();
        return;
      }
      const sups = [...used];
      used.clear();
      const event = {
        wordId: r.wordId,
        dim: r.dim,
        ok: Boolean(r.ok),
        firstTry: Boolean(r.firstTry),
        sup: sups,
        type: `game:${spec.id}`,
      };
      log.push({ ...event, kind: r.kind || "" });
      try {
        opts.onResult?.(event);
      } catch (error) {
        console.error("onResult failed", error);
      }
    },
    save() {
      if (state && !finished && !spec.isDone(state)) {
        RESUME.set(key(), JSON.parse(JSON.stringify(state)));
        if (spec.persist) persist(state);
      }
    },
    rerender: () => render(),
    /** For handlers a game attaches itself (pointer drag): same save / finish / render path as a click. */
    act: (changed) => act(changed),
    finish: () => finishNow(),
    restart: () => restart(),
    /** Picture for a word: the shared art module when present, else the word's own emoji glyphs with alt text. */
    pic(word, size = "md") {
      const v = word?.visual;
      if (!v) return raw("");
      if (art) {
        try {
          const out = art(word, { size, I });
          return typeof out === "string" ? raw(out) : out;
        } catch {}
      }
      const glyphs = (v.glyphs || []).join(" ");
      return raw(
        `<span class="vag-pic vag-pic-${esc(size)}" role="img" aria-label="${esc(v.alt || "")}">${glyphs ? `<span aria-hidden="true">${esc(glyphs)}</span>` : `<span class="vag-pic-diagram" aria-hidden="true">≈</span>`}</span>`,
      );
    },
    speakBtn(text, label) {
      if (!sup.audio || !text) return raw("");
      return html`<button
        type="button"
        class="vag-listen"
        data-speak="${text}"
        aria-label="${I.S("Listen", "Escuchar")}${label ? `: ${label}` : ""}"
      >
        ${icon("volume")}<span>${I.T("Listen", "Escuchar")}</span>
      </button>`;
    },
    gloss(word) {
      return sup.glossaryEs && word?.es?.gloss
        ? html`<span class="vag-es" lang="es">${word.es.gloss}</span>`
        : "";
    },
  };
  handle.env = env;

  function startState() {
    env.run = run;
    env.seed = opts.seed != null ? opts.seed + run : seedFor(spec.id, pool, run);
    env.rng = rngFor(env.seed);
    state = spec.build(env);
  }

  /** Optional across-visit resume: the view hands in opts.persist(key, stateOrNull) / opts.restore(key). Games opt in with spec.persist. */
  function persist(value) {
    try {
      opts.persist?.(key(), value ? JSON.parse(JSON.stringify(value)) : null);
    } catch (error) {
      console.error("persist failed", error);
    }
  }

  function finishSummary() {
    const per = new Map();
    for (const e of log) {
      const row = per.get(e.wordId) || {
        wordId: e.wordId,
        hw: pool.byId.get(e.wordId)?.hw || e.wordId,
        correct: 0,
        misses: 0,
        firstTry: 0,
        sup: [],
      };
      if (e.ok) row.correct += 1;
      else row.misses += 1;
      if (e.ok && e.firstTry) row.firstTry += 1;
      for (const s of e.sup) if (!row.sup.includes(s)) row.sup.push(s);
      per.set(e.wordId, row);
    }
    const words = [...per.values()];
    return {
      gameId: spec.id,
      unitId: pool.id,
      run,
      seed: env.seed,
      judged: log.length,
      correct: log.filter((e) => e.ok).length,
      misses: log.filter((e) => !e.ok).length,
      firstTry: log.filter((e) => e.ok && e.firstTry).length,
      words,
      note: handle.note || "",
      ...(spec.extra ? spec.extra(state, env) : {}),
    };
  }

  function finishNow() {
    if (finished) return;
    finished = true;
    RESUME.delete(key());
    if (spec.persist) persist(null);
    summary = finishSummary();
    render();
    env.say(I.S("Run complete.", "Ronda completa."));
    try {
      opts.onDone?.(summary);
    } catch (error) {
      console.error("onDone failed", error);
    }
  }

  function restart() {
    RESUME.delete(key());
    if (spec.persist) persist(null);
    run += 1;
    finished = false;
    summary = null;
    resumed = false;
    log.length = 0;
    used.clear();
    startState();
    render();
    env.say(I.S("New run started.", "Nueva ronda."));
    root.querySelector("[data-autofocus]")?.focus();
  }

  // ── markup ────────────────────────────────────────────────────────────────────────────
  const shell =
    () => `<section class="vag" data-va-band="${esc(pool.band)}" data-game="${esc(spec.id)}" ${sup.chunked ? 'data-chunked="1"' : ""} aria-labelledby="${uid}-t">
    <header class="vag-head"><h2 id="${uid}-t" class="vag-title">${T(...spec.title)}</h2>
      <div class="vag-tools"><button type="button" class="btn small vag-how-btn" data-va-how aria-expanded="false" aria-controls="${uid}-how">${toHtml(icon("help"))}${T(...COPY.how)}</button>
      <button type="button" class="btn small" data-va-restart>${toHtml(icon("retry"))}${T(...COPY.restart)}</button></div></header>
    <div class="vag-how" id="${uid}-how" hidden></div>
    <p class="vag-note" data-note hidden></p>
    <div class="vag-prog" hidden><span class="vag-prog-t"></span><span class="vag-prog-bar" aria-hidden="true"><span></span></span></div>
    <div class="vag-body"></div>
    <p class="vag-status" role="status" aria-live="polite"></p></section>`;

  function howHTML() {
    const steps = spec.howTo || [];
    const keys = spec.keys || [];
    const list = sup.chunked
      ? `<p class="vag-how-step"><strong>${T(...COPY.step)} ${howStep + 1} ${T(...COPY.of)} ${steps.length}</strong></p>
         <p class="vag-how-big">${T(...(steps[howStep] || ["", ""]))}</p>
         <p class="vag-how-nav"><button type="button" class="btn small" data-va-howstep="-1" ${howStep === 0 ? "disabled" : ""}>${T(...COPY.back)}</button>
         <button type="button" class="btn small" data-va-howstep="1" ${howStep >= steps.length - 1 ? "disabled" : ""}>${T(...COPY.next)}</button></p>`
      : `<ol class="vag-how-list">${steps.map((s) => `<li>${T(...s)}</li>`).join("")}</ol>`;
    const keyList = keys.length
      ? `<h3 class="vag-how-h">${T(...COPY.keys)}</h3><ul class="vag-keys">${keys.map(([k, d]) => `<li><kbd>${esc(k)}</kbd> ${T(...d)}</li>`).join("")}</ul>`
      : "";
    return `${list}${keyList}<p class="vag-how-fine">${T("You can retry as often as you like. Using hints or listening never counts against you.", "Puedes intentar las veces que quieras. Usar pistas o escuchar nunca cuenta en tu contra.")}</p>`;
  }

  function finishHTML() {
    const s = summary;
    const good = s.words.filter((w) => w.misses === 0 && w.correct > 0);
    const more = s.words.filter((w) => w.misses > 0);
    const wordList = (rows, ic, label) =>
      rows.length
        ? `<section class="vag-fin-col"><h3>${toHtml(icon(ic))}${T(...label)}</h3><ul>${rows.map((w) => `<li><strong>${esc(w.hw)}</strong></li>`).join("")}</ul></section>`
        : "";
    const extra = spec.finishExtra ? toHtml(spec.finishExtra(state, env, s)) : "";
    return `<div class="vag-finish"><h3 class="vag-fin-h" tabindex="-1" data-autofocus>${toHtml(icon("star"))}${T(...COPY.done)}</h3>
      <p>${I.S(`You answered ${s.correct} of ${s.judged} checks right, ${s.firstTry} on the first try.`, `Acertaste ${s.correct} de ${s.judged} comprobaciones, ${s.firstTry} al primer intento.`)}</p>
      ${extra}
      <div class="vag-fin-cols">${wordList(good, "check", COPY.quickly)}${wordList(more, "retry", COPY.practice)}</div>
      <p><button type="button" class="btn btn-primary btn-big" data-va-again>${toHtml(icon("replay"))}${T(...COPY.again)}</button></p></div>`;
  }

  function render() {
    if (!alive) return;
    const body = root.querySelector(".vag-body");
    if (!body) return;
    const active = document.activeElement;
    const inBody = active && body.contains(active);
    const fk = inBody ? active.closest("[data-fk]")?.dataset.fk : "";
    if (finished) body.innerHTML = finishHTML();
    else body.innerHTML = toHtml(spec.view(state, env));
    const prog = root.querySelector(".vag-prog");
    if (prog && spec.progress && !finished) {
      const p = spec.progress(state);
      prog.hidden = !p || !p.total;
      if (p?.total) {
        prog.querySelector(".vag-prog-t").textContent = I.S(
          `${p.done} of ${p.total} done`,
          `${p.done} de ${p.total} hechos`,
        );
        prog.querySelector(".vag-prog-bar span").style.width =
          `${Math.round((100 * p.done) / p.total)}%`;
      }
    } else if (prog) prog.hidden = true;
    const noteEl = root.querySelector("[data-note]");
    if (noteEl) {
      const text = [handle.note, resumed ? I.S(...COPY.resumed) : ""].filter(Boolean).join(" ");
      noteEl.hidden = !text;
      noteEl.textContent = text;
    }
    initRove(body, fk);
    if (fk) body.querySelector(`[data-fk="${CSS.escape(fk)}"]`)?.focus({ preventScroll: true });
    else if (finished) body.querySelector("[data-autofocus]")?.focus();
    spec.after?.(body, state, env);
  }

  function initRove(body, fk) {
    for (const group of body.querySelectorAll("[data-rove]")) {
      const items = [...group.querySelectorAll("[data-rv]")];
      if (!items.length) continue;
      const cur =
        items.find((i) => fk && i.dataset.fk === fk) ||
        items.find((i) => i.hasAttribute("data-rv-cur")) ||
        items[0];
      for (const i of items) i.tabIndex = i === cur ? 0 : -1;
    }
  }

  function roveKey(ev) {
    const item = ev.target.closest?.("[data-rv]");
    const group = item?.closest("[data-rove]");
    if (!group) return false;
    const items = [...group.querySelectorAll("[data-rv]")];
    const i = items.indexOf(item);
    const cols = Number(group.dataset.cols) || 0;
    let n = i;
    if (ev.key === "ArrowRight") n = i + 1;
    else if (ev.key === "ArrowLeft") n = i - 1;
    else if (ev.key === "ArrowDown") n = cols ? i + cols : i + 1;
    else if (ev.key === "ArrowUp") n = cols ? i - cols : i - 1;
    else if (ev.key === "Home") n = 0;
    else if (ev.key === "End") n = items.length - 1;
    else return false;
    if (n < 0 || n >= items.length) return true;
    items.forEach((x) => {
      x.tabIndex = x === items[n] ? 0 : -1;
    });
    items[n].focus();
    return true;
  }

  // ── events ────────────────────────────────────────────────────────────────────────────
  function act(changed) {
    if (changed === false || changed == null) return;
    env.save();
    if (state && spec.isDone(state)) finishNow();
    else render();
  }

  async function onClick(ev) {
    if (!alive) return;
    const t = ev.target;
    if (!(t instanceof Element) || !root.contains(t)) return;
    if (t.closest("[data-va-how]")) {
      how = !how;
      const panel = root.querySelector(".vag-how");
      panel.hidden = !how;
      panel.innerHTML = how ? howHTML() : "";
      root.querySelector("[data-va-how]").setAttribute("aria-expanded", String(how));
      return;
    }
    const hs = t.closest("[data-va-howstep]");
    if (hs) {
      howStep = Math.max(
        0,
        Math.min((spec.howTo || []).length - 1, howStep + Number(hs.dataset.vaHowstep)),
      );
      root.querySelector(".vag-how").innerHTML = howHTML();
      root.querySelector("[data-va-howstep]:not([disabled])")?.focus();
      return;
    }
    if (t.closest("[data-va-restart]") || t.closest("[data-va-again]")) return restart();
    const sp = t.closest("[data-speak]");
    if (sp) {
      env.use("readAloud");
      try {
        const { speak } = await import("../../speech.js");
        speak(sp.dataset.speak, { lang: "en-US" });
      } catch {}
      return;
    }
    if (finished || !state) return;
    act(await spec.click(t, state, env, ev));
  }

  async function onKey(ev) {
    if (!alive || finished || !state) return;
    const typing =
      /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName) || ev.target.isContentEditable;
    if (ev.key === "Escape" && how) {
      root.querySelector("[data-va-how]")?.click();
      return;
    }
    if (!typing && roveKey(ev)) {
      ev.preventDefault();
      return;
    }
    if (spec.key) {
      const r = await spec.key(ev, state, env);
      if (r) {
        ev.preventDefault();
        act(r);
        return;
      }
    }
    if (
      !typing &&
      spec.numberKeys !== false &&
      /^[1-9]$/.test(ev.key) &&
      !ev.ctrlKey &&
      !ev.metaKey &&
      !ev.altKey
    ) {
      const btn = root.querySelector(
        `.vag-body [data-n="${ev.key}"]:not([disabled]):not([aria-disabled="true"])`,
      );
      if (btn) {
        ev.preventDefault();
        btn.click();
      }
    }
  }

  async function onInput(ev) {
    if (!alive || finished || !state || !spec.input) return;
    act(await spec.input(ev.target, state, env, ev));
  }
  async function onChange(ev) {
    if (!alive || finished || !state || !spec.change) return;
    act(await spec.change(ev.target, state, env, ev));
  }

  root.addEventListener("click", onClick);
  root.addEventListener("keydown", onKey);
  root.addEventListener("input", onInput);
  root.addEventListener("change", onChange);

  function destroy() {
    if (!alive) return;
    alive = false;
    root.removeEventListener("click", onClick);
    root.removeEventListener("keydown", onKey);
    root.removeEventListener("input", onInput);
    root.removeEventListener("change", onChange);
    spec.destroy?.(env);
    if (root[MOUNTED] === handle) delete root[MOUNTED];
  }

  root.innerHTML = shell();
  root.querySelector(".vag-body").innerHTML = `<p class="vag-loading">${T(...COPY.loading)}</p>`;

  handle.ready = (async () => {
    try {
      const m = await import("../art.js");
      if (typeof m.visualHTML === "function") art = m.visualHTML;
    } catch {}
    if (!alive) return;
    try {
      await spec.load?.(env);
    } catch (error) {
      console.error(`${spec.id} load failed`, error);
    }
    if (!alive) return;
    let saved = RESUME.get(key());
    if (!saved && spec.persist && !opts.fresh) {
      try {
        const kept = opts.restore?.(key());
        if (kept && (!spec.valid || spec.valid(kept, env))) saved = kept;
      } catch {}
    }
    if (saved && !opts.fresh) {
      state = saved;
      resumed = true;
      env.rng = rngFor(env.seed + 977);
    } else startState();
    if (!state || (spec.unplayable && spec.unplayable(state))) {
      root.querySelector(".vag-body").innerHTML =
        `<p class="vag-empty" role="note">${toHtml(icon("info"))} ${T(...(spec.empty || COPY.empty))}</p>`;
      return;
    }
    render();
    if (spec.after) spec.after(root.querySelector(".vag-body"), state, env);
  })();
  return handle;
}

// ── shared building blocks for the games ─────────────────────────────────────────────────────
/** Feedback that never relies on colour: an icon shape plus a word. kind: ok | retry | hint | info */
export function fbHTML(kind, text, I) {
  const map = {
    ok: ["check", I.T("Right", "Correcto")],
    retry: ["retry", I.T("Not yet", "Todavía no")],
    hint: ["bulb", I.T("Hint", "Pista")],
    info: ["info", I.T("Note", "Nota")],
    miss: ["retry", I.T("Look again", "Mira otra vez")],
  };
  const [ic, label] = map[kind] || map.info;
  return html`<p class="vag-fb vag-fb-${kind}">
    ${icon(ic)}<span><strong>${label}.</strong> ${text}</span>
  </p>`;
}

/** The stem of a multiple-choice question: prompt, optional sentence, optional picture, optional Listen. */
export function stemHTML(q, env) {
  const word = q.visualOf ? env.pool.byId.get(q.visualOf) : null;
  return html`<div class="vag-stem">
    <p class="vag-q">${q.stem}</p>
    ${q.sentence ? html`<blockquote class="vag-sentence">${q.sentence}</blockquote>` : ""}
    ${word ? html`<div class="vag-pic-wrap">${env.pic(word, "lg")}</div>` : ""}
    ${env.speakBtn(q.say || q.sentence || q.stem, "")}
  </div>`;
}

/** The answer buttons of a multiple-choice question (keyboard: Tab, Enter/Space, or number keys 1-4). */
export function choicesHTML(q, st, env) {
  const rows = q.choices.map((text, i) => {
    if (st.hidden.includes(i)) return "";
    const wrong = st.wrong.includes(i);
    const right = st.done && i === q.answer;
    const state = right ? "ok" : wrong ? "no" : "";
    const mark = right ? icon("check") : wrong ? icon("x") : "";
    const sr = right
      ? env.I.S("Correct choice. ", "Opción correcta. ")
      : wrong
        ? env.I.S("Not this one. ", "Esta no. ")
        : "";
    return html`<button
      type="button"
      class="vag-choice"
      data-pick="${i}"
      data-n="${i + 1}"
      data-fk="pick-${i}"
      data-state="${state}"
      aria-disabled="${wrong || st.done ? "true" : "false"}"
    >
      <span class="vag-n" aria-hidden="true">${i + 1}</span
      ><span class="vag-ct"><span class="vag-sr">${sr}</span>${text}</span>${mark}
    </button>`;
  });
  return html`<div
    class="vag-choices"
    role="group"
    aria-label="${env.I.S("Answer choices", "Opciones de respuesta")}"
  >
    ${rows}
  </div>`;
}

/** Feedback line for a multiple-choice question: correct (with why), a miss (no answer given), or the hint. */
export function mcFeedback(q, st, env) {
  const I = env.I;
  if (st.done) return fbHTML("ok", q.why, I);
  const parts = [];
  if (st.wrong.length)
    parts.push(
      fbHTML(
        "retry",
        I.T(
          "Try another choice. You can retry as often as you like.",
          "Prueba otra opción. Puedes intentar las veces que quieras.",
        ),
        I,
      ),
    );
  if (st.hints >= 1)
    parts.push(
      fbHTML(
        "hint",
        q.hint +
          (st.hidden.length
            ? ` ${I.S("Some choices were taken away.", "Se quitaron algunas opciones.")}`
            : ""),
        I,
      ),
    );
  return html`${parts}`;
}
export const hintButton = (st, env) =>
  st.done || st.hints >= 3
    ? ""
    : html`<button type="button" class="btn small vag-hint" data-hint data-fk="hint">
        ${icon("bulb")}${env.I.T("Hint", "Pista")}
      </button>`;

/** Handle a pick or hint on a multiple-choice question; judge through env.report. Returns true when something changed. */
export function mcAct(el, q, st, env, { kind = "" } = {}) {
  const pick = el.closest("[data-pick]");
  if (pick) {
    if (pick.getAttribute("aria-disabled") === "true") return false;
    const r = mcPick(st, q, Number(pick.dataset.pick));
    if (!r.changed) return false;
    env.report({ wordId: q.wordId, dim: q.dim, ok: r.ok, firstTry: r.first, kind });
    env.say(
      r.ok
        ? env.I.S("Right.", "Correcto.")
        : env.I.S("Not yet. Try another choice.", "Todavía no. Prueba otra opción."),
    );
    return true;
  }
  if (el.closest("[data-hint]")) {
    if (!mcHint(st, q)) return false;
    env.use("model");
    env.say(env.I.S("Hint shown.", "Pista mostrada."));
    return true;
  }
  return false;
}

export const wordOf = (env, id) => env.pool.byId.get(id);
export const plural = (n, one, many) => (n === 1 ? one : many);
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
