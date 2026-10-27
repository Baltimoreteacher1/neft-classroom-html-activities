// The activity host: /math/fluency-lab/family/play.html
//   single activity: ?game=<id>&grade=<0-8>&skill=<id>&level=<1-3>&rounds=<n>&seed=<int>&lang=<en|es>&profile=<0-5>&mode=<solo|together>&resume=1
//   planned session: ?plan=<encodePlan code>&grade=&profile=&lang=&mode=  (+ &resume=1 to continue after a reload)
// Reads only navigation choices from the URL; learner work and progress stay in this device's storage.
// @fm2 FM-003 FM-004 FM-005 FM-026 FM-031 FM-034 FM-035
import { PROFILE_NAMES, selectProfile } from "../../school-tools.js";
import * as coach from "./coach.js";
import { escapeHtml, getLang, setLang } from "./lang.js";
import { loadAvailable } from "./page-kit.js";
import { loadGame } from "./registry.js";
import { decodePlan } from "./session.js";
import { runSession } from "./session-runner.js";
import { startActivity } from "./shell.js";
import { createStore } from "./store.js";

const main = document.querySelector("#fm2-main");
const params = new URLSearchParams(location.search);
const intParam = (name, min, max, fallback) => {
  const raw = params.get(name);
  if (raw === null || !/^-?\d+$/.test(raw)) return fallback;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
};

function problem(title, text, home = "./") {
  main.innerHTML = `<section class="fm2-card fm2-empty" role="alert" data-testid="play-error"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p><a class="fm2-btn fm2-btn-primary" href="${home}" data-testid="play-error-home">Back to family math · Volver</a></section>`;
}

const storageWarning = () => {
  const box = document.querySelector("#fm2-storage-warning");
  box.hidden = false;
  box.textContent =
    "This browser could not save progress. You can keep playing, but progress will not be remembered. / Este navegador no pudo guardar el progreso.";
};

async function bootSession(code, { profile, store, resume }) {
  const ids = [
    ...new Set(
      code
        .split("~")
        .map((piece) => piece.split("_"))
        .filter((f) => f.length === 5)
        .map((f) => f[0]),
    ),
  ];
  const { games, missing } = await loadAvailable(ids);
  const plan = decodePlan(code, games);
  if (!plan) {
    return missing.length
      ? problem(
          "A game in this session is not ready yet",
          "Pick a different session from the family math page. / Elige otra sesión en la página de matemáticas en familia.",
        )
      : problem(
          "This session link is not valid",
          "Start a new session from the family math page. / Empieza una sesión nueva desde la página de matemáticas en familia.",
        );
  }
  await runSession({
    root: main,
    plan,
    planCode: code,
    games,
    store,
    coach,
    profile,
    resume,
    seed: intParam("seed", 0, 4294967295, null),
    onPageLanguage: applyPageLanguage,
    onExit: () => {
      location.href = "./";
    },
  });
}

// Title, skip link and document language follow the learner's language, including after an in-page switch.
export function applyPageLanguage() {
  const es = getLang() === "es";
  document.title = es ? "Jugar · Matemáticas en familia · EduWonderLab" : "Play · Family Math · EduWonderLab";
  document.documentElement.lang = getLang();
  for (const el of document.querySelectorAll("[data-t=skipPlay]")) el.textContent = es ? "Saltar a la actividad" : "Skip to the activity";
}

async function boot() {
  const lang = params.get("lang");
  if (lang === "en" || lang === "es") setLang(lang);
  applyPageLanguage();
  const profile = intParam("profile", 0, PROFILE_NAMES.length - 1, 0);
  const grade = intParam("grade", 0, 8, 1);
  const level = intParam("level", 1, 3, 1);
  const rounds = intParam("rounds", 1, 12, 5);
  if (profile === null || grade === null || level === null || rounds === null)
    return problem(
      "This link is not complete",
      "Choose a grade and activity from the family math page. / Elige un grado y una actividad en la página de matemáticas en familia.",
    );
  selectProfile(profile);
  const store = createStore({ profile, onUnavailable: storageWarning });
  const resume = params.get("resume") === "1";
  const saved = resume ? store.state.resume : null;
  const planCode = params.get("plan") ?? (saved?.plan || null);
  if (planCode !== null) return bootSession(planCode, { profile, store, resume });

  let game;
  try {
    game = await loadGame(params.get("game") || saved?.gameId || "");
  } catch {
    return problem(
      "We could not find that game",
      "Pick one of the ten games from the family math page. / Elige uno de los diez juegos.",
    );
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = game.cssHref;
  document.head.append(link);
  const skillId =
    saved?.skillId ||
    params.get("skill") ||
    game.skills.find((s) => s.grades[0] <= grade && grade <= s.grades[1])?.id;
  if (!game.skills.some((s) => s.id === skillId))
    return problem(
      "We could not find that skill",
      "Choose a skill from the family math page. / Elige una destreza en la página de matemáticas en familia.",
    );
  startActivity({
    root: main,
    game,
    store,
    coach,
    grade: saved?.grade ?? grade,
    skillId,
    level: saved?.level ?? level,
    rounds: saved?.rounds ?? rounds,
    seed: saved?.seed ?? intParam("seed", 0, 4294967295, undefined),
    index: saved?.index ?? 0,
    results: saved?.results || [],
    mode: params.get("mode") === "together" ? "together" : saved?.mode || "solo",
    onExit: () => {
      location.href = "./";
    },
  });
}

boot().catch((error) => {
  console.error(error);
  problem(
    "Something went wrong",
    "Reload the page, or go back and choose the activity again. / Recarga la página o vuelve a elegir la actividad.",
  );
});
