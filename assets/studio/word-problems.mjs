// Word problems page (/math/word-problems/?lesson=<id>): the application problems a practice studio offers
// after its last step, then one real-world scenario whose linked questions use the same lesson skill.
// Data: /math/word-problems/unit-<n>.json (generated from data/word-problems/ by
// scripts/generate-studio-word-problems.mjs). Cards come from word-problems-card.mjs. Solved problems are
// remembered on this device.
import { bi, esc, mountProblem } from "./word-problems-card.mjs";

const STORE = "ewl_word_problems_v2";
const LANG = "ewl_word_problems_lang";
const $ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (document.getElementById(id));

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
  /** @type {{ p: any, scenario: boolean, n: number }[]} */ steps: [],
  /** @type {any} */ scenario: null,
  i: 0,
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
  $("wp-dots").innerHTML = state.steps
    .map((s, j) => {
      const solved = state.solved.includes(j);
      const current = j === state.i && !state.done;
      const label = s.scenario ? `S${s.n}` : String(s.n);
      const name = s.scenario ? `Scenario part ${s.n}` : `Problem ${s.n}`;
      return `${s.scenario && s.n === 1 ? '<span class="wp-dots-sep" aria-hidden="true"></span>' : ""}<button type="button" class="wp-dot${s.scenario ? " is-scenario" : ""}${solved ? " is-solved" : ""}${current ? " is-current" : ""}" data-go="${j}" aria-label="${name}${solved ? ", solved" : ""}"${current ? ' aria-current="step"' : ""}>${label}</button>`;
    })
    .join("");
}

function nextUnsolved() {
  for (let k = 1; k <= state.steps.length; k++) {
    const j = (state.i + k) % state.steps.length;
    if (!state.solved.includes(j)) return j;
  }
  return -1;
}

function renderStep() {
  const s = state.steps[state.i];
  const nProblems = state.steps.filter((x) => !x.scenario).length;
  const sc = state.scenario;
  const label = s.scenario
    ? { en: `Scenario · part ${s.n} of ${sc.parts.length}`, es: `Situación · parte ${s.n} de ${sc.parts.length}` }
    : { en: `Problem ${s.n} of ${nProblems}`, es: `Problema ${s.n} de ${nProblems}` };
  const remaining = () => state.steps.filter((_, j) => !state.solved.includes(j)).length;
  const card = mountProblem($("wp-stage"), s.p, {
    id: `wp-${state.i}`,
    label: label.en,
    labelEs: label.es,
    setup: s.scenario ? `${sc.title}: ${sc.setup}` : undefined,
    setupEs: s.scenario ? `${sc.titleEs}: ${sc.setupEs}` : undefined,
    solved: state.solved.includes(state.i),
    onSolved: () => {
      if (!state.solved.includes(state.i)) state.solved.push(state.i);
      saveSolved();
      renderDots();
    },
    next: {
      get en() {
        return remaining() ? "Next problem" : "See my results";
      },
      get es() {
        return remaining() ? "Siguiente problema" : "Ver mis resultados";
      },
      go: () => {
        const j = nextUnsolved();
        if (j === -1) return finish();
        state.i = j;
        renderStep().focus();
      },
    },
  });
  renderDots();
  return card;
}

function finish() {
  state.done = true;
  renderDots();
  $("wp-stage").innerHTML = `<section class="wp-card wp-done" aria-labelledby="wp-done-title" tabindex="-1">
    <p class="wp-done-mark" aria-hidden="true">★</p>
    <h2 id="wp-done-title">${bi("You solved every word problem and the scenario!", "¡Resolviste todos los problemas y la situación!")}</h2>
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
    renderStep();
  });
}

function fail() {
  $("wp-stage").innerHTML = `<p class="wp-card">${bi("These word problems could not load. Go back to practice and try again.", "Estos problemas no se pudieron cargar. Vuelve a la práctica e inténtalo otra vez.")}</p>`;
}

async function boot() {
  $("wp-back").setAttribute("href", back);
  $("wp-lang").addEventListener("click", () => setLang(!document.body.classList.contains("show-es")));
  setLang(params.get("lang") === "es" || (params.get("lang") !== "en" && read(LANG, "en") === "es"));
  $("wp-dots").addEventListener("click", (e) => {
    const b = /** @type {HTMLElement} */ (e.target).closest("[data-go]");
    if (!b) return;
    state.done = false;
    state.i = Number(/** @type {HTMLElement} */ (b).dataset.go);
    renderStep();
  });
  if (!lesson) return fail();
  let set;
  try {
    const res = await fetch(`/math/word-problems/unit-${lesson.split("-")[0]}.json?v=${document.body.dataset.v || ""}`);
    set = (await res.json())[lesson];
  } catch {
    set = null;
  }
  if (!set?.problems?.length) return fail();
  state.scenario = set.scenario || null;
  state.steps = [
    ...set.problems.map((/** @type {any} */ p, /** @type {number} */ k) => ({ p, scenario: false, n: k + 1 })),
    ...(set.scenario?.parts || []).map((/** @type {any} */ p, /** @type {number} */ k) => ({ p, scenario: true, n: k + 1 })),
  ];
  state.solved = (read(STORE, {})[lesson]?.solved || []).filter(
    (/** @type {number} */ j) => j < state.steps.length,
  );
  document.title = `Word problems · Lesson ${lesson} ${set.title} | EduWonderLab`;
  $("wp-lesson").innerHTML = bi(`Lesson ${lesson} · ${set.title}`, `Lección ${lesson} · ${set.title}`);
  const first = state.steps.findIndex((_, j) => !state.solved.includes(j));
  if (first === -1) {
    state.i = 0;
    finish();
  } else {
    state.i = first;
    renderStep();
  }
}

boot();
