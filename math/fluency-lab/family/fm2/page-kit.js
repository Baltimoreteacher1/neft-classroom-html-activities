// Shared pieces of the Family Math 2.0 pages (home, progress, session host): the URL contract, game loading, the
// learner bar, stars, and the session record that makes a multi-activity session resumable and recorded once.
// @fm2 FM-001 FM-002 FM-025 FM-026 FM-035 FM-036
import {
  PROFILE_NAMES,
  profileKey,
  profiles,
  readLocal,
  selectProfile,
  writeLocal,
} from "../../school-tools.js";
import { strandKey } from "./coach.js";
import { validateGame } from "./contract.js";
import { escapeHtml as esc, getLang, setLang, tx } from "./lang.js";
import { GAME_IDS, loadGame } from "./registry.js";

// ---- copy shared by every page ----------------------------------------------------------------------------------
const c = (en, es) => ({ en, es });
export const KIT = {
  family: c("FAMILY MATH", "MATEMÁTICAS EN FAMILIA"),
  pageTitle: c("Family Math · EduWonderLab", "Matemáticas en familia · EduWonderLab"),
  skipHome: c("Skip to family practice", "Saltar a la práctica en familia"),
  skipPlay: c("Skip to the activity", "Saltar a la actividad"),
  skipProgress: c("Skip to my progress", "Saltar a mi progreso"),
  brandAria: c(
    "EduWonderLab Math Fluency Lab home",
    "Inicio del laboratorio de matemáticas EduWonderLab",
  ),
  learner: c("Learner", "Estudiante"),
  addLearner: c("Add learner", "Agregar estudiante"),
  learnerOption: c("Learner {n} · {name}", "Estudiante {n} · {name}"),
  stars: c("{n} of 3 stars", "{n} de 3 estrellas"),
  storage: c(
    "This browser could not save progress. You can keep going, but progress will not be remembered after you close the page.",
    "Este navegador no pudo guardar el progreso. Pueden seguir, pero el progreso no se recordará al cerrar la página.",
  ),
  gradeK: c("Kindergarten", "Jardín de niños"),
  grade: c("Grade {n}", "Grado {n}"),
  roles: {
    warmup: c("Warm-up", "Calentamiento"),
    main: c("Main", "Principal"),
    stretch: c("Stretch", "Reto"),
    together: c("Together", "En equipo"),
  },
  levels: c("Level {n}", "Nivel {n}"),
  min: c("{n} min", "{n} min"),
};

export const STRAND_LABEL = {
  "counting-place-value": c("Counting and place value", "Conteo y valor posicional"),
  "addition-subtraction": c("Adding and subtracting", "Sumar y restar"),
  "multiplication-division": c("Multiplying and dividing", "Multiplicar y dividir"),
  fractions: c("Fractions", "Fracciones"),
  decimals: c("Decimals", "Decimales"),
  "ratios-percents": c("Ratios and percents", "Razones y porcentajes"),
  "patterns-algebra": c("Patterns and algebra", "Patrones y álgebra"),
  "geometry-measure": c("Shapes and measuring", "Figuras y medidas"),
  money: c("Money", "Dinero"),
  "number-line": c("Number line and integers", "Recta numérica y enteros"),
  equations: c("Equations", "Ecuaciones"),
  data: c("Data and graphs", "Datos y gráficas"),
};
export const strandOf = (gameId, skill) => strandKey(skill?.strand, skill?.id, gameId);

export const t = (copy, lang, vars) => tx(copy, lang, vars);
export const gradeName = (grade, lang) =>
  grade === 0 ? t(KIT.gradeK, lang) : t(KIT.grade, lang, { n: grade });
export const gradeShort = (grade) => (grade === 0 ? "K" : String(grade));
export const gradeRange = (low, high) =>
  low === high ? gradeShort(low) : `${gradeShort(low)}–${gradeShort(high)}`;
export const titleCase = (id) =>
  id
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");

// ---- URL contract (see docs/family-math-2-pages-notes.md) ---------------------------------------------------------
const query = (values) =>
  new URLSearchParams(
    Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString();

export function playUrl({
  game,
  skill,
  level,
  rounds,
  seed,
  plan,
  grade,
  profile,
  lang,
  mode,
  resume,
} = {}) {
  return `play.html?${query({ game, skill, level, rounds, seed, plan, grade, profile, lang, mode, resume: resume ? 1 : undefined })}`;
}
export const homeUrl = ({ grade, profile, lang } = {}) => `./?${query({ grade, profile, lang })}`;
export const progressUrl = ({ grade, profile, lang } = {}) =>
  `progress.html?${query({ grade, profile, lang })}`;

export function intParam(params, name, min, max) {
  const raw = params.get(name);
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}

// ---- games ---------------------------------------------------------------------------------------------------------
// A game is "ready" only when its module loads and passes the shared contract; anything else is "coming soon".
export async function loadAvailable(ids = GAME_IDS) {
  const settled = await Promise.allSettled(ids.map((id) => loadGame(id)));
  const games = [];
  const missing = [];
  settled.forEach((result, index) => {
    const game = result.status === "fulfilled" ? result.value : null;
    const problems = game ? validateGame(game) : ["module did not load"];
    if (game && !problems.length) games.push(game);
    else {
      missing.push(ids[index]);
      if (game)
        console.warn(`Family Math: ${ids[index]} is not ready: ${problems.slice(0, 3).join("; ")}`);
    }
  });
  games.sort((a, b) => a.order - b.order);
  return { games, missing };
}

export const covers = (skill, grade) => skill.grades[0] <= grade && grade <= skill.grades[1];
export const suggestLevel = (store, gameId, skill, grade) =>
  store.skill(gameId, skill.id)?.level ?? (grade > skill.grades[0] ? 2 : 1);

export function starsHtml(count, lang) {
  const n = Math.max(0, Math.min(3, count | 0));
  return `<span class="pk-stars" role="img" aria-label="${esc(t(KIT.stars, lang, { n }))}"><span aria-hidden="true">${"★".repeat(n)}${"☆".repeat(3 - n)}</span></span>`;
}

// ---- static text and the learner bar ----------------------------------------------------------------------------
// Elements marked data-t="key" take that key's {en, es} copy; data-t-aria sets aria-label the same way.
export function applyStatic(root, copy, lang) {
  for (const el of root.querySelectorAll("[data-t]"))
    if (copy[el.dataset.t]) el.textContent = t(copy[el.dataset.t], lang);
  for (const el of root.querySelectorAll("[data-t-aria]"))
    if (copy[el.dataset.tAria]) el.setAttribute("aria-label", t(copy[el.dataset.tAria], lang));
  document.documentElement.lang = lang;
  // The browser tab title and skip link follow the language too, from the same kit copy.
  if (copy.pageTitle) document.title = t(copy.pageTitle, lang);
}

export function renderTopbar(lang) {
  applyStatic(document, KIT, lang);
  const { ids, active } = profiles();
  const select = document.querySelector("#family-profile");
  select.innerHTML = ids
    .map(
      (id) =>
        `<option value="${id}"${id === active ? " selected" : ""}>${esc(t(KIT.learnerOption, lang, { n: id + 1, name: PROFILE_NAMES[id] }))}</option>`,
    )
    .join("");
  document.querySelector("#add-learner").hidden = ids.length >= PROFILE_NAMES.length;
  const other = lang === "en" ? "es" : "en";
  const toggle = document.querySelector("#lang-toggle");
  toggle.textContent = other === "es" ? "Español" : "English";
  toggle.lang = other;
}

export const activeProfile = (params) => {
  const asked = intParam(params, "profile", 0, PROFILE_NAMES.length - 1);
  if (asked !== null) selectProfile(asked);
  return profiles().active;
};

export function addLearner() {
  const { ids } = profiles();
  const next = PROFILE_NAMES.findIndex((_, id) => !ids.includes(id));
  if (next < 0) return null;
  selectProfile(next);
  return next;
}

export function switchLanguage(lang) {
  const next = lang === "en" ? "es" : "en";
  setLang(next);
  return next;
}
export const startLanguage = (params) => {
  const asked = params.get("lang");
  if (asked === "en" || asked === "es") setLang(asked, { persist: false });
  return getLang();
};

export function keepUrl(values) {
  const url = new URL(location.href);
  for (const [k, v] of Object.entries(values)) url.searchParams.set(k, String(v));
  history.replaceState(null, "", url);
}

// Replace a container's markup but keep keyboard focus on the same control (matched by data-fk).
export function paint(container, html) {
  const key = container.contains(document.activeElement)
    ? document.activeElement.dataset?.fk
    : null;
  container.innerHTML = html;
  if (key)
    container.querySelector(`[data-fk="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
}

export function showStorageWarning(el, lang) {
  el.textContent = t(KIT.storage, lang);
  el.hidden = false;
}

// ---- session record -----------------------------------------------------------------------------------------------
// One record per learner for the session in progress or just finished. The shell's own resume record only knows the
// current activity; this one remembers finished activities, the clock and whether the session was already recorded.
export const SESSION_KEY = "ewl-fm2-session-v1";
const num = (v, min, max, fallback) =>
  Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const ID = /^[a-z][a-z0-9-]{1,40}$/;

function cleanSummary(s) {
  if (!s || !ID.test(s.gameId) || !ID.test(s.skillId)) return null;
  return {
    gameId: s.gameId,
    skillId: s.skillId,
    level: num(s.level, 1, 3, 1),
    role: ["warmup", "main", "stretch", "together"].includes(s.role) ? s.role : "main",
    rounds: num(s.rounds, 0, 12, 0),
    correct: num(s.correct, 0, 12, 0),
    hints: num(s.hints, 0, 99, 0),
    stars: num(s.stars, 0, 3, 0),
  };
}

export function readSession(profile) {
  const raw = readLocal(profileKey(SESSION_KEY, profile), null);
  if (
    !raw ||
    raw.v !== 1 ||
    typeof raw.plan !== "string" ||
    !/^[A-Za-z0-9_~-]{10,1200}$/.test(raw.plan)
  )
    return null;
  return {
    v: 1,
    plan: raw.plan,
    sid: String(raw.sid || ""),
    step: Math.round(num(raw.step, 0, 20, 0)),
    seed: num(raw.seed, 0, 4294967295, 0),
    startedAt: num(raw.startedAt, 0, 4e12, 0),
    activeMs: num(raw.activeMs, 0, 4e8, 0),
    minutes: num(raw.minutes, 0, 120, 0),
    summaries: (Array.isArray(raw.summaries) ? raw.summaries : [])
      .slice(0, 20)
      .map(cleanSummary)
      .filter(Boolean),
    finished: raw.finished === true,
    recorded: raw.recorded === true,
  };
}
export const writeSession = (profile, session) =>
  writeLocal(profileKey(SESSION_KEY, profile), session);
export const clearSession = (profile) => {
  try {
    localStorage.removeItem(profileKey(SESSION_KEY, profile));
  } catch {
    /* nothing stored */
  }
};
