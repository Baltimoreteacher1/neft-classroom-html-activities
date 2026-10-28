// The guided session screens: Choose, Learn, Try, Play, Explain, Celebrate, Continue. Try and Play host the existing game shell,
// so hints, scoring and per-skill progress are the Family Math 2.0 ones. No timers or countdowns anywhere; no network.
// @fm2 FM-003 FM-004 FM-005 FM-026 FM-027 FM-030 FM-034
import * as coach from "../coach.js";
import { skillsFor } from "../inventory.js";
import { escapeHtml as esc, L, setLang, tx } from "../lang.js";
import { validateGame } from "../contract.js";
import { loadGame } from "../registry.js";
import { homeUrl, progressUrl } from "../urls.js";
import { seedFrom } from "../rng.js";
import { createStore } from "../store.js";
import {
  buildExplain,
  learnFromBank,
  createGuidedStore,
  FLOW,
  nextPlan,
  pickTonight,
} from "./guided-core.js";
import { G } from "./guided-copy.js";

// Matches PROFILE_NAMES in school-tools.js (checked by tools/fluency-family-guided.test.mjs); that module is too heavy for a first view.
const PROFILES = 6;
// One decorative spot picture per strand, from the family art kit (assets/design/family/art/spots).
const SPOTS = { "counting-place-value": "books", "addition-subtraction": "groceries", "multiplication-division": "moving-box", fractions: "pizza", decimals: "fruit-scale", "ratios-percents": "recipe", "patterns-algebra": "stairs", "geometry-measure": "garden", money: "savings-jar", "number-line": "elevator", equations: "balance", data: "rain-gauge" };
const ART = "/assets/design/family/art";
const ICONS = `${ART}/icons.svg`;
const icon = (id, extra = "") =>
  `<svg class="fm-icon ${extra}" aria-hidden="true" focusable="false"><use href="${ICONS}#fi-${id}"></use></svg>`;
const t = (copy, vars) => tx(copy, S.lang, vars);
const S = {
  lang: "en",
  games: [],
  gradeLoaded: null,
  icons: {},
  store: null,
  guided: null,
  profile: 0,
  root: null,
  stage: null,
  activity: null,
  view: "learn",
  params: null,
};

// S.games holds the light index (titles, icons, skills); a game module is loaded only for the step that plays or teaches with it.
const modules = new Map();
async function realGame(id) {
  if (!modules.has(id)) {
    modules.set(
      id,
      loadGame(id).then((game) => {
        const problems = validateGame(game);
        if (problems.length) throw new Error(`${id} is not ready: ${problems[0]}`);
        return game;
      }),
    );
  }
  return modules.get(id);
}
const loads = new Map();
const fetchJson = (path) => {
  if (!loads.has(path)) loads.set(path, fetch(new URL(path, import.meta.url)).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${path}: ${r.status}`)))));
  return loads.get(path);
};
// Grade-sized index of the games and skills that cover it; the learn bank is one small file per game; icons are fetched only by
// the screens that draw them. None of these loads a game module.
async function loadIndex(grade) {
  if (S.gradeLoaded === grade) return;
  S.games = await fetchJson(`./skill-index/g${grade}.json`);
  S.gradeLoaded = grade;
}
const loadBank = (gameId) => fetchJson(`./learn-bank/${gameId}.json`);
async function loadIcons() {
  if (!Object.keys(S.icons).length) S.icons = await fetchJson("./game-icons.json");
}
const iconOf = (id) => S.icons[id] || "";
const gameOf = (id) => S.games.find((game) => game.id === id);
const skillOf = (slot) => gameOf(slot.gameId)?.skills.find((skill) => skill.id === slot.skillId);
const gradeLabel = (grade) => (grade === 0 ? t(G.gradeK) : t(G.grade, { g: grade }));
const seedNow = () => Math.floor(Math.random() * 4294967295);

function announce(text) {
  const live = document.querySelector("#gs-live");
  if (live) live.textContent = text;
}

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = S.lang === "es" ? "es-US" : "en-US";
    window.speechSynthesis.speak(utterance);
  } catch {
    /* read-aloud is a convenience; the text is always on screen */
  }
}
const canSpeak = () =>
  typeof window !== "undefined" &&
  "speechSynthesis" in window &&
  typeof SpeechSynthesisUtterance === "function";
const readButton = (text) =>
  canSpeak()
    ? `<button type="button" class="fm-btn fm-btn--quiet gs-read" data-read="${esc(text)}">${icon("speaker")}<span>${esc(t(G.readAloud))}</span></button>`
    : "";

// ---- chrome: static page text, stepper, language ---------------------------------------------------------------------
function applyChrome() {
  document.documentElement.lang = S.lang;
  document.title = t(G.pageTitle);
  for (const el of document.querySelectorAll("[data-gt]")) el.textContent = t(G[el.dataset.gt]);
  for (const el of document.querySelectorAll("[data-gt-aria]"))
    el.setAttribute("aria-label", t(G[el.dataset.gtAria]));
  for (const input of document.querySelectorAll("input[name=gs-lang]"))
    input.checked = input.value === S.lang;
}

function stepper(step) {
  const index = Math.max(0, FLOW.indexOf(step));
  const name = t(G.steps[step]);
  const dots = FLOW.map((id, i) => {
    const state = i < index ? "done" : i === index ? "current" : "todo";
    return `<li class="fm-dot" data-state="${state}"${state === "current" ? ' aria-current="step"' : ""}><span class="fm-sr">${esc(t(G.steps[id]))}${state === "done" ? ` (${esc(t(G.done))})` : ""}</span></li>`;
  }).join("");
  document.querySelector("#gs-steps").innerHTML =
    `<p class="gs-steps__count" data-testid="step-count">${esc(t(G.stepOf, { n: index + 1, total: FLOW.length, name }))}</p><ol class="fm-dots" aria-label="${esc(t(G.stepsLabel))}">${dots}</ol>`;
}

function show(step, html, { focus = true } = {}) {
  S.view = step;
  window.speechSynthesis?.cancel?.();
  stepper(step);
  S.stage.classList.remove("fm2-page", "gs-hosting");
  S.stage.classList.add("gs-ds");
  S.stage.innerHTML = html;
  S.stage.dataset.step = step;
  const heading = S.stage.querySelector("h1");
  if (heading && focus) {
    heading.setAttribute("tabindex", "-1");
    heading.focus({ preventScroll: false });
  }
  announce(t(G.stepOf, { n: FLOW.indexOf(step) + 1, total: FLOW.length, name: t(G.steps[step]) }));
}

const actions = (...items) => `<div class="fm-cluster gs-actions">${items.join("")}</div>`;
const btn = (act, label, cls = "", extra = "") =>
  `<button type="button" class="fm-btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;
const stopBtn = () => btn("stop", `<span>${esc(t(G.stop))}</span>`, "fm-btn--quiet");
const minutesSeg = () =>
  `<fieldset class="fm-field gs-minutes"><legend class="fm-label">${esc(t(G.length))}</legend><div class="fm-seg" role="group">${[5, 10].map((m) => `<label class="fm-seg__opt"><input type="radio" name="gs-minutes" value="${m}" ${S.guided.state.minutes === m ? "checked" : ""}><span>${esc(t(m === 5 ? G.fiveMin : G.tenMin))}</span></label>`).join("")}</div></fieldset>`;

// ---- Choose ---------------------------------------------------------------------------------------------------------
function chooseGrade() {
  const grades = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    .map(
      (g) =>
        `<button type="button" class="fm-btn gs-grade" data-grade="${g}" aria-label="${esc(gradeLabel(g))}"><b>${g === 0 ? "K" : g}</b></button>`,
    )
    .join("");
  show(
    "choose",
    `<section class="fm-card fm-stack" data-testid="choose-grade"><h1 class="fm-card__title">${esc(t(G.chooseTitle))}</h1><p>${esc(t(G.chooseLead))}</p>${minutesSeg()}<div class="gs-grades" role="group" aria-label="${esc(t(G.chooseTitle))}">${grades}</div></section>`,
  );
}

async function chooseSkill(grade) {
  await Promise.all([loadIndex(grade), loadIcons()]);
  const entries = skillsFor(S.games, grade);
  const card = (entry, label) => {
    const game = gameOf(entry.gameId);
    return `<li><button type="button" class="fm-btn gs-skill" data-skill="${entry.gameId}:${entry.skillId}"><span class="gs-skill__icon" aria-hidden="true">${iconOf(game.id)}</span><span class="gs-skill__text"><strong>${esc(L(entry.title, S.lang))}</strong><small>${esc(label || L(game.title, S.lang))}</small></span></button></li>`;
  };
  const plan = pickTonight({
    grade,
    games: S.games,
    state: S.store.state,
    minutes: S.guided.state.minutes,
  });
  const top = [plan?.target, plan?.play]
    .filter(Boolean)
    .map((slot) => entries.find((e) => e.gameId === slot.gameId && e.skillId === slot.skillId))
    .filter(Boolean);
  const rest = entries.filter((e) => !top.includes(e));
  show(
    "choose",
    `<section class="fm-card fm-stack" data-testid="choose-skill"><h1 class="fm-card__title">${esc(t(G.pickSkill))}</h1><p>${esc(gradeLabel(grade))}</p>${minutesSeg()}<h2 class="fm-label">${esc(t(G.recommended))}</h2><ul class="gs-skills">${top.map((e) => card(e)).join("")}</ul><details class="fm-disclosure"><summary>${esc(t(G.pickSkill))} (${rest.length})</summary><ul class="gs-skills">${rest.map((e) => card(e)).join("")}</ul></details>${actions(btn("grade", `<span>${esc(t(G.chooseTitle))}</span>`, "fm-btn--quiet"))}</section>`,
  );
}

async function beginPlan(grade, pinned = null) {
  await loadIndex(grade);
  const plan = pickTonight({
    grade,
    games: S.games,
    state: S.store.state,
    minutes: S.guided.state.minutes,
    pinned,
    seed: seedNow(),
  });
  if (!plan) return fail();
  S.store.clearResume();
  S.guided.begin(plan);
  await renderStep();
}

// ---- Learn ----------------------------------------------------------------------------------------------------------
async function renderLearn(a) {
  const game = gameOf(a.target.gameId);
  const skill = skillOf(a.target);
  const learn = learnFromBank({ card: (await loadBank(a.target.gameId))[a.target.skillId], gameId: a.target.gameId, skill, grade: a.grade });
  const idea = L(learn.idea, S.lang);
  const example = L(learn.example, S.lang);
  show(
    "learn",
    `<section class="fm-card fm-stack" data-testid="learn-card"><p class="fm-learn__step">${icon("hint", "fm-icon--sm")}<span>${esc(t(G.tonightWord))} · ${esc(t(a.minutes === 5 ? G.fiveMin : G.tenMin))}</span></p>
      <h1 class="fm-card__title" data-testid="learn-title">${esc(L(skill.title, S.lang))}</h1>
      <img class="gs-spot" src="${ART}/spots/${SPOTS[learn.strand] || "books"}.svg" alt="" width="240" height="180">
      <p class="gs-game"><span class="fm-chip">${esc(L(game.title, S.lang))}</span></p>
      <h2 class="fm-label">${esc(t(G.ideaLabel))}</h2><p class="fm-learn__say" data-testid="learn-idea">${esc(idea)}</p>
      <h2 class="fm-label">${esc(t(G.exampleLabel))}</h2><div class="fm-callout"><div class="fm-callout__body"><p data-testid="learn-example">${esc(example)}</p></div></div>
      ${readButton(`${idea} ${example}`)}
      <div class="fm-callout fm-callout--grownup" data-testid="parent-coach">${icon("grownup", "fm-callout__icon")}<p class="fm-callout__label">${esc(t(G.parentLabel))}</p><div class="fm-callout__body"><p>${esc(t(G.parentNoMath))}</p><p><b>${esc(t(G.sayLabel))}:</b> ${esc(L(learn.say, S.lang))}</p><p><b>${esc(t(G.avoidLabel))}:</b> ${esc(L(learn.avoid, S.lang))}</p><p><b>${esc(t(G.askLabel))}:</b> ${esc(L(learn.ask, S.lang))}</p></div></div>
      ${actions(btn("try", `<span>${esc(t(G.startTry))}</span>${icon("arrow-next")}`, "fm-btn--primary fm-btn--lg", 'data-testid="start-try"'), btn("skill", `<span>${esc(t(G.changeSkill))}</span>`, "fm-btn--quiet"), stopBtn())}
      <p class="gs-note">${esc(t(G.saved))}</p></section>`,
  );
}

// ---- Try and Play: the existing shell ---------------------------------------------------------------------------------
async function hostGame(a, which) {
  const slot = which === "try" ? a.target : a.play;
  const [game, { startActivity }, tools] = await Promise.all([realGame(slot.gameId), import("../shell.js"), import("../../../school-tools.js")]);
  tools.selectProfile(S.profile);
  const stepNo = which === "try" ? 0 : 1;
  const planId = `guided-${a.id}`;
  const saved = S.store.state.resume;
  const inside =
    saved &&
    saved.plan === planId &&
    saved.step === stepNo &&
    saved.gameId === slot.gameId &&
    saved.skillId === slot.skillId;
  if (!document.querySelector(`link[data-fm2-game="${game.id}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = game.cssHref;
    link.dataset.fm2Game = game.id;
    document.head.append(link);
  }
  S.view = which;
  stepper(which);
  S.stage.classList.add("fm2-page", "gs-hosting");
  S.stage.classList.remove("gs-ds");
  S.stage.dataset.step = which;
  announce(
    t(G.stepOf, { n: FLOW.indexOf(which) + 1, total: FLOW.length, name: t(G.steps[which]) }),
  );
  S.activity = startActivity({
    root: S.stage,
    game,
    store: S.store,
    coach,
    grade: a.grade,
    skillId: slot.skillId,
    level: inside ? saved.level : slot.level,
    rounds: inside ? saved.rounds : a.rounds[which],
    seed: inside ? saved.seed : seedFrom(a.seed, stepNo, game.id, slot.skillId),
    index: inside ? saved.index : 0,
    results: inside ? saved.results : [],
    mode: "solo",
    lang: S.lang,
    plan: planId,
    step: stepNo,
    showSummary: false,
    onLanguage: (next) => {
      S.lang = next;
      applyChrome();
      stepper(which);
    },
    onFinish: (done) => {
      S.activity?.destroy?.();
      S.activity = null;
      S.store.clearResume();
      const result = { correct: done.correct, rounds: done.rounds, hints: done.hints };
      S.guided.update(
        which === "try" ? { tryRes: result, step: "play" } : { playRes: result, step: "explain" },
      );
      renderStep();
    },
    onExit: () => {
      location.href = homeUrl({ grade: a.grade, profile: S.profile, lang: S.lang });
    },
  });
}

async function renderPlayIntro(a) {
  await loadIcons();
  const game = gameOf(a.play.gameId);
  const skill = skillOf(a.play);
  show(
    "play",
    `<section class="fm-card fm-stack" data-testid="play-intro"><h1 class="fm-card__title">${esc(t(G.playTitle))}</h1><p>${esc(t(G.playLead))}</p>
      <p class="gs-game"><span class="gs-skill__icon" aria-hidden="true">${iconOf(game.id)}</span><span><strong>${esc(L(game.title, S.lang))}</strong><br>${esc(L(skill.title, S.lang))}</span></p>
      <p>${esc(L(game.tagline, S.lang))}</p>
      ${actions(btn("play", `<span>${esc(t(G.playGo))}</span>${icon("play-fill")}`, "fm-btn--primary fm-btn--lg", 'data-testid="start-play"'), stopBtn())}</section>`,
  );
}

// ---- Explain ----------------------------------------------------------------------------------------------------------
async function renderExplain(a) {
  const game = gameOf(a.target.gameId);
  const skill = skillOf(a.target);
  const learn = learnFromBank({ card: (await loadBank(a.target.gameId))[a.target.skillId], gameId: a.target.gameId, skill, grade: a.grade });
  const ex = buildExplain({ game, skill, grade: a.grade, seed: a.seed, idea: learn.idea });
  const options = ex.options
    .map(
      (id, i) =>
        `<label class="fm-choice"><input type="radio" name="gs-helped" value="${id}" ${a.explain === id ? "checked" : ""}><span class="fm-choice__mark" aria-hidden="true">${i + 1}</span><span><span>${esc(t(G.helped[id]))}</span>${id === "idea" ? `<small class="gs-detail">${esc(L(ex.idea, S.lang))}</small>` : ""}</span></label>`,
    )
    .join("");
  show(
    "explain",
    `<section class="fm-card fm-stack" data-testid="explain-card"><h1 class="fm-card__title">${esc(t(G.explainTitle))}</h1><p>${esc(t(G.explainLead))}</p>
      <div class="fm-callout fm-callout--grownup">${icon("chat", "fm-callout__icon")}<p class="fm-callout__label">${esc(t(G.askLabel))}</p><div class="fm-callout__body"><p>${esc(L(ex.ask, S.lang))}</p></div></div>
      ${readButton(L(ex.ask, S.lang))}
      <fieldset class="fm-field"><legend class="fm-label">${esc(t(G.helpedLabel))}</legend><div class="fm-choices" data-testid="helped-options">${options}</div><p class="gs-note" id="gs-pick" role="status"></p></fieldset>
      ${actions(btn("explained", `<span>${esc(t(G.explainNext))}</span>${icon("arrow-next")}`, "fm-btn--primary fm-btn--lg", 'data-testid="explain-done"'), stopBtn())}</section>`,
  );
}

// ---- Celebrate and Continue ---------------------------------------------------------------------------------------------
function finishSession(a) {
  const next = nextPlan({ active: a, games: S.games, state: S.store.state });
  if (a.recorded) return;
  const line = S.guided.finish(next);
  if (!line) return;
  const total = (a.tryRes?.rounds ?? 0) + (a.playRes?.rounds ?? 0);
  const correct = (a.tryRes?.correct ?? 0) + (a.playRes?.correct ?? 0);
  const wall = Math.max(1, Math.round((Date.now() - (a.startedAt || Date.now())) / 60000));
  S.store.recordSession({
    grade: a.grade,
    minutes: Math.min(wall, a.minutes * 1.5),
    correct,
    total,
    games: [...new Set([a.target.gameId, a.play.gameId])],
    mode: "solo",
  });
}

function renderCelebrate(a) {
  finishSession(a);
  const skill = skillOf(a.target);
  const play = gameOf(a.play.gameId);
  const rows = [
    t(G.didLearn, { skill: L(skill.title, S.lang) }),
    t(G.didTry, { correct: a.tryRes?.correct ?? 0, total: a.tryRes?.rounds ?? 0 }),
    t(G.didPlay, { game: L(play.title, S.lang) }),
    t(G.didExplain),
  ];
  show(
    "celebrate",
    `<section class="fm-celebrate" data-testid="celebrate"><div class="fm-confetti" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="fm-celebrate__badge" aria-hidden="true"><svg class="fm-icon fm-icon--lg" aria-hidden="true" focusable="false"><use href="${ART}/celebration.svg#fc-badge"></use></svg></div>
      <h1 class="fm-hero__title">${esc(t(G.celebrateTitle))}</h1><p>${esc(t(G.celebrateLead))}</p>
      <ul class="gs-done">${rows.map((r) => `<li>${icon("check", "fm-icon--sm")}<span>${esc(r)}</span></li>`).join("")}</ul>
      <p class="gs-note">${esc(t(G.calmNote))}</p>
      ${actions(btn("continue", `<span>${esc(t(G.toContinue))}</span>${icon("arrow-next")}`, "fm-btn--primary fm-btn--lg", 'data-testid="to-continue"'))}</section>`,
  );
}

async function renderContinue(a) {
  await loadIcons();
  finishSession(a);
  const next = S.guided.state.next || nextPlan({ active: a, games: S.games, state: S.store.state });
  const skill = skillOf(next);
  const game = gameOf(next.gameId);
  const why =
    { again: G.continueAgain, keep: G.continueKeep, next: G.continueNext }[next.kind] ||
    G.continueKeep;
  show(
    "continue",
    `<section class="fm-card fm-stack" data-testid="continue-card" data-kind="${esc(next.kind)}"><h1 class="fm-card__title">${esc(t(G.continueTitle))}</h1><p data-testid="continue-why">${esc(t(why))}</p>
      <p class="gs-game"><span class="gs-skill__icon" aria-hidden="true">${iconOf(game.id)}</span><span><strong>${esc(L(skill.title, S.lang))}</strong><br>${esc(L(game.title, S.lang))}</span></p>
      ${actions(btn("again", `<span>${esc(t(G.continueGo))}</span>${icon("arrow-next")}`, "fm-btn--primary fm-btn--lg", 'data-testid="start-next"'), `<a class="fm-btn" href="${progressUrl({ grade: a.grade, profile: S.profile, lang: S.lang })}" data-testid="see-progress">${esc(t(G.seeProgress))}</a>`, `<a class="fm-btn fm-btn--quiet" href="${homeUrl({ grade: a.grade, profile: S.profile, lang: S.lang })}" data-testid="not-tonight">${esc(t(G.continueLater))}</a>`)}
      <p class="gs-note">${esc(t(G.savedNext))}</p></section>`,
  );
}

// ---- routing ------------------------------------------------------------------------------------------------------------
function fail() {
  S.stage.innerHTML = `<section class="fm-card fm-stack" role="alert" data-testid="session-error"><h1 class="fm-card__title">${esc(t(G.errorTitle))}</h1><p>${esc(t(G.errorText))}</p><a class="fm-btn fm-btn--primary" href="./">${esc(t(G.home))}</a></section>`;
}

async function routeStep() {
  const a = S.guided.state.active;
  if (!a) return chooseGrade();
  await loadIndex(a.grade);
  S.activity?.destroy?.();
  S.activity = null;
  if (a.step === "learn") return renderLearn(a);
  if (a.step === "try") return hostGame(a, "try");
  if (a.step === "play") return a.playStarted ? hostGame(a, "play") : renderPlayIntro(a);
  if (a.step === "explain") return renderExplain(a);
  if (a.step === "celebrate") return renderCelebrate(a);
  if (a.step === "continue") return renderContinue(a);
  return chooseGrade();
}

async function renderStep() {
  try {
    await routeStep();
  } catch (error) {
    console.error(error);
    fail();
  }
}

function onClick(event) {
  const button = event.target.closest("[data-act],[data-grade],[data-skill],[data-read]");
  if (!button) return;
  const a = S.guided.state.active;
  if (button.dataset.read) return speak(button.dataset.read);
  if (button.dataset.grade !== undefined) return beginPlan(Number(button.dataset.grade));
  if (button.dataset.skill) {
    const [gameId, skillId] = button.dataset.skill.split(":");
    const grade = a?.grade ?? S.guided.state.grade ?? 1;
    return beginPlan(grade, { gameId, skillId, level: 1 });
  }
  const act = button.dataset.act;
  if (act === "try") {
    S.guided.update({ step: "try" });
    renderStep();
  } else if (act === "skill") chooseSkill(a.grade);
  else if (act === "grade") chooseGrade();
  else if (act === "play") {
    S.guided.update({ step: "play", playStarted: true });
    renderStep();
  } else if (act === "explained") {
    const picked = S.stage.querySelector("input[name=gs-helped]:checked");
    if (!picked) {
      S.stage.querySelector("#gs-pick").textContent = t(G.pickOne);
      S.stage.querySelector("input[name=gs-helped]").focus();
      return;
    }
    S.guided.update({ explain: picked.value, step: "celebrate" });
    renderStep();
  } else if (act === "continue") {
    S.guided.update({ step: "continue" });
    renderStep();
  } else if (act === "again") {
    const next = S.guided.state.next;
    S.guided.clearActive();
    beginPlan(
      a?.grade ?? S.guided.state.grade ?? 1,
      next ? { gameId: next.gameId, skillId: next.skillId, level: next.level } : null,
    );
  } else if (act === "stop") {
    location.href = homeUrl({
      grade: a?.grade ?? S.guided.state.grade ?? 1,
      profile: S.profile,
      lang: S.lang,
    });
  }
}

function onChange(event) {
  const input = event.target;
  if (input.name === "gs-lang") {
    S.lang = input.value;
    setLang(S.lang);
    applyChrome();
    if (S.view === "try" || S.view === "play") return;
    if (S.view === "choose")
      return S.guided.state.active ? chooseSkill(S.guided.state.active.grade) : chooseGrade();
    return renderStep();
  }
  if (input.name === "gs-minutes") {
    S.guided.state.minutes = Number(input.value);
    S.guided.save();
  }
}

export async function runGuided({ stage, params, lang }) {
  S.stage = stage;
  S.root = document;
  S.lang = lang;
  S.params = params;
  const asked = Number(params.get("profile"));
  S.profile = Number.isInteger(asked) && asked >= 0 && asked < PROFILES ? asked : 0;
  const warn = () => {
    const box = document.querySelector("#gs-storage");
    box.hidden = false;
    box.textContent = t(G.noStorage);
  };
  S.store = createStore({ profile: S.profile, onUnavailable: warn });
  S.guided = createGuidedStore({ profile: S.profile, onUnavailable: warn });
  applyChrome();
  document.addEventListener("click", (event) =>
    S.stage.contains(event.target) ? onClick(event) : null,
  );
  document.addEventListener("change", onChange);
  stage.innerHTML = `<p class="gs-loading" role="status">${esc(t(G.loading))}</p>`;
  const wanted = params.get("minutes");
  if (wanted === "5" || wanted === "10") S.guided.state.minutes = Number(wanted);
  const grade = Number(params.get("grade"));
  const hasGrade =
    params.get("grade") !== null && Number.isInteger(grade) && grade >= 0 && grade <= 8;
  const [pinGame, pinSkill] = String(params.get("skill") || "").split(":");
  const pinned = pinGame && pinSkill ? { gameId: pinGame, skillId: pinSkill, level: 1 } : null;
  const active = S.guided.state.active;
  const wantsNew = params.get("new") === "1";
  if (active && !(wantsNew && active.recorded)) return renderStep();
  if (hasGrade) return beginPlan(grade, pinned || S.guided.state.next);
  const known = S.guided.state.grade;
  if (known !== null && wantsNew) return beginPlan(known, S.guided.state.next);
  return chooseGrade();
}

