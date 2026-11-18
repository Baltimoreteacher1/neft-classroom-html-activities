// Word problems page (/math/word-problems/?lesson=<id>): the 2–3 application problems a practice studio offers
// after its last step. Data: /math/word-problems/unit-<n>.json (generated from data/word-problems/ by
// scripts/generate-word-problems.mjs). One problem at a time: answer, take hints one by one, get feedback on a
// miss, and see the worked explanation once it is right. Solved problems are remembered on this device.
import { parseAnswer, sameValue } from "./word-problems-answer.mjs";

const STORE = "ewl_word_problems_v1";
const LANG = "ewl_word_problems_lang";
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));
const esc = (/** @type {any} */ s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const bi = (/** @type {string} */ en, /** @type {string | undefined} */ es) =>
  `<span class="t-en">${esc(en)}</span>${es ? `<span class="t-es" lang="es">${esc(es)}</span>` : ""}`;

function read(/** @type {string} */ key, /** @type {any} */ fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function write(/** @type {string} */ key, /** @type {any} */ value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage blocked: the page still works, it just forgets */
  }
}

const params = new URLSearchParams(location.search);
const raw = params.get("lesson") || "";
const lesson = /^\d+-\d+$/.test(raw) ? raw : "";
// Only a same-site practice page may be the way back.
const from = params.get("from") || "";
const back = /^\/math\/[a-z0-9-]+(\/[a-z0-9-]+)*\/$/.test(from)
  ? from
  : `/math/practice-studio/${lesson ? `${lesson}/` : ""}`;

const state = {
  /** @type {any[]} */ problems: [],
  i: 0,
  hints: 0,
  done: false,
  /** @type {number[]} */ solved: [],
};

function setLang(/** @type {boolean} */ es) {
  document.body.classList.toggle("show-es", es);
  document.documentElement.lang = es ? "es" : "en";
  $("wp-lang").setAttribute("aria-pressed", String(es));
  write(LANG, es ? "es" : "en");
}

function saveSolved() {
  const all = read(STORE, {});
  all[lesson] = { solved: state.solved };
  write(STORE, all);
}

function renderDots() {
  $("wp-dots").innerHTML = state.problems
    .map((_, j) => {
      const cls = [
        "wp-dot",
        state.solved.includes(j) ? "is-solved" : "",
        j === state.i && !state.done ? "is-current" : "",
      ].join(" ");
      return `<button type="button" class="${cls}" data-go="${j}" aria-label="Problem ${j + 1}${state.solved.includes(j) ? ", solved" : ""}"${j === state.i && !state.done ? ' aria-current="step"' : ""}>${j + 1}</button>`;
    })
    .join("");
}

function answerArea(/** @type {any} */ p) {
  if (p.kind === "mc")
    return `<fieldset class="wp-choices"><legend class="sr-only">Choices</legend>${p.c
      .map(
        (/** @type {string} */ c, /** @type {number} */ k) =>
          `<label class="wp-choice"><input type="radio" name="wp-choice" value="${k}"><span>${bi(c, p.cEs?.[k])}</span></label>`,
      )
      .join("")}</fieldset>`;
  return `<div class="wp-answer"><label for="wp-input">${bi("Your answer", "Tu respuesta")}</label>
    <div class="wp-answer-row"><input id="wp-input" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">${p.unit ? `<span class="wp-unit">${bi(p.unit, p.unitEs)}</span>` : ""}</div></div>`;
}

function renderProblem() {
  const p = state.problems[state.i];
  state.hints = 0;
  const solved = state.solved.includes(state.i);
  $("wp-stage").innerHTML = `<article class="wp-card" aria-labelledby="wp-q-title">
    <p class="wp-count">${bi(`Problem ${state.i + 1} of ${state.problems.length}`, `Problema ${state.i + 1} de ${state.problems.length}`)}</p>
    <h2 id="wp-q-title" tabindex="-1">${bi(p.title, p.titleEs)}</h2>
    <p class="wp-q">${bi(p.q, p.qEs)}</p>
    <form id="wp-form" novalidate>
      ${answerArea(p)}
      <div class="wp-actions">
        <button type="submit" class="wp-btn wp-btn--primary">${bi("Check", "Revisar")}</button>
        <button type="button" class="wp-btn" id="wp-hint">${bi("Hint 1 of 3", "Pista 1 de 3")}</button>
      </div>
    </form>
    <ol class="wp-hints" id="wp-hints" aria-live="polite"></ol>
    <div class="wp-feedback" id="wp-feedback" role="status" aria-live="polite"></div>
  </article>`;
  $("wp-form").addEventListener("submit", (e) => {
    e.preventDefault();
    check();
  });
  $("wp-hint").addEventListener("click", hint);
  if (solved) showSolved(true);
  renderDots();
}

function hint() {
  const p = state.problems[state.i];
  if (state.hints >= 3) return;
  const k = state.hints++;
  $("wp-hints").insertAdjacentHTML(
    "beforeend",
    `<li><strong>${bi(`Hint ${k + 1}`, `Pista ${k + 1}`)}:</strong> ${bi(p.h[k], p.hEs?.[k])}</li>`,
  );
  const btn = $("wp-hint");
  if (state.hints >= 3) btn.hidden = true;
  else btn.innerHTML = bi(`Hint ${state.hints + 1} of 3`, `Pista ${state.hints + 1} de 3`);
}

function feedback(/** @type {string} */ cls, /** @type {string} */ html) {
  const box = $("wp-feedback");
  box.className = `wp-feedback ${cls}`;
  box.innerHTML = html;
}

function check() {
  const p = state.problems[state.i];
  if (p.kind === "mc") {
    const picked = /** @type {HTMLInputElement | null} */ (
      document.querySelector('input[name="wp-choice"]:checked')
    );
    if (!picked)
      return feedback("is-nudge", bi("Choose an answer first.", "Primero elige una respuesta."));
    const k = Number(picked.value);
    if (k === p.ai) return showSolved(false);
    return miss(p.f?.[k], p.fEs?.[k]);
  }
  const raw = /** @type {HTMLInputElement} */ ($("wp-input")).value;
  const v = parseAnswer(raw);
  if (!raw.trim())
    return feedback("is-nudge", bi("Type your answer first.", "Primero escribe tu respuesta."));
  if (!Number.isFinite(v))
    return feedback(
      "is-nudge",
      bi(
        "Type a number, like 18, 2.5 or 3/4.",
        "Escribe un número, como 18, 2.5 o 3/4.",
      ),
    );
  if (sameValue(v, parseAnswer(p.a))) return showSolved(false);
  const known = (p.fw || []).find((/** @type {any} */ w) => sameValue(v, parseAnswer(w.v)));
  return miss(known?.f, known?.fEs);
}

function miss(/** @type {string | undefined} */ f, /** @type {string | undefined} */ fEs) {
  const next = state.hints < 3;
  feedback(
    "is-miss",
    `<p><strong>${bi("Not yet.", "Todavía no.")}</strong> ${f ? bi(f, fEs) : bi("Check each step of your work.", "Revisa cada paso de tu trabajo.")}</p>${
      next
        ? `<p>${bi("Take the next hint, then try again.", "Toma la siguiente pista y vuelve a intentarlo.")}</p>`
        : `<p>${bi("Use all three hints to set it up, then try again.", "Usa las tres pistas para plantearlo y vuelve a intentarlo.")}</p>`
    }`,
  );
  if (next && state.hints === 0) hint();
}

function showSolved(/** @type {boolean} */ restored) {
  const p = state.problems[state.i];
  if (!state.solved.includes(state.i)) {
    state.solved.push(state.i);
    saveSolved();
  }
  const form = /** @type {HTMLFormElement} */ ($("wp-form"));
  for (const el of form.querySelectorAll("input, button")) {
    /** @type {HTMLInputElement} */ (el).disabled = true;
  }
  if (p.kind === "num" && restored)
    /** @type {HTMLInputElement} */ ($("wp-input")).value = p.a;
  if (p.kind === "mc")
    /** @type {HTMLInputElement} */ (
      form.querySelectorAll('input[name="wp-choice"]')[p.ai]
    ).checked = true;
  const last = state.solved.length === state.problems.length;
  const nextIdx = state.problems.findIndex((_, j) => !state.solved.includes(j));
  feedback(
    "is-right",
    `<p class="wp-gotit"><span aria-hidden="true">✓</span> ${bi("I got it!", "¡Lo logré!")}</p>
     <p>${bi(p.x, p.xEs)}</p>
     <button type="button" class="wp-btn wp-btn--primary" id="wp-next">${
       last
         ? bi("See my results", "Ver mis resultados")
         : bi("Next problem", "Siguiente problema")
     }</button>`,
  );
  renderDots();
  $("wp-next").addEventListener("click", () => {
    if (last) return finish();
    state.i = nextIdx;
    renderProblem();
    $("wp-q-title").focus();
  });
  if (!restored) $("wp-next").focus();
}

function finish() {
  state.done = true;
  renderDots();
  $("wp-stage").innerHTML = `<section class="wp-card wp-done" aria-labelledby="wp-done-title" tabindex="-1">
    <p class="wp-done-mark" aria-hidden="true">★</p>
    <h2 id="wp-done-title">${bi("You solved every word problem!", "¡Resolviste todos los problemas!")}</h2>
    <p>${bi("You used today's math in real situations. That is the goal of this lesson.", "Usaste las matemáticas de hoy en situaciones reales. Esa es la meta de esta lección.")}</p>
    <div class="wp-actions">
      <a class="wp-btn wp-btn--primary" href="${esc(back)}">${bi("Back to practice", "Volver a la práctica")}</a>
      <button type="button" class="wp-btn" id="wp-again">${bi("Try them again", "Intentarlos otra vez")}</button>
    </div>
  </section>`;
  /** @type {HTMLElement} */ (document.querySelector(".wp-done")).focus();
  $("wp-again").addEventListener("click", () => {
    state.solved = [];
    state.done = false;
    state.i = 0;
    saveSolved();
    renderProblem();
  });
}

async function boot() {
  $("wp-back").setAttribute("href", back);
  $("wp-lang").addEventListener("click", () =>
    setLang(!document.body.classList.contains("show-es")),
  );
  setLang(params.get("lang") === "es" || (params.get("lang") !== "en" && read(LANG, "en") === "es"));
  $("wp-dots").addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-go]");
    if (!b) return;
    state.done = false;
    state.i = Number(/** @type {HTMLElement} */ (b).dataset.go);
    renderProblem();
  });
  const unit = lesson.split("-")[0];
  if (!/^\d+-\d+$/.test(lesson)) return fail();
  let set;
  try {
    const res = await fetch(`/math/word-problems/unit-${unit}.json?v=${document.body.dataset.v || ""}`);
    set = (await res.json())[lesson];
  } catch {
    set = null;
  }
  if (!set?.problems?.length) return fail();
  state.problems = set.problems;
  state.solved = (read(STORE, {})[lesson]?.solved || []).filter(
    (/** @type {number} */ j) => j < set.problems.length,
  );
  document.title = `Word problems · Lesson ${lesson} ${set.title} | EduWonderLab`;
  $("wp-lesson").innerHTML = bi(`Lesson ${lesson} · ${set.title}`, `Lección ${lesson} · ${set.titleEs || set.title}`);
  const first = set.problems.findIndex((/** @type {any} */ _, /** @type {number} */ j) => !state.solved.includes(j));
  if (first === -1) {
    state.i = 0;
    finish();
  } else {
    state.i = first;
    renderProblem();
  }
}

function fail() {
  $("wp-stage").innerHTML = `<p class="wp-card">${bi("These word problems could not load. Go back to practice and try again.", "Estos problemas no se pudieron cargar. Vuelve a la práctica e inténtalo otra vez.")}</p>`;
}

boot();
