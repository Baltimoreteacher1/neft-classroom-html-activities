// ACCESS Practice Lab — app entry: router, render loop, shared event handling.
//
// Every URL the previous lab answered still resolves (see parseRoute):
//   /access-practice-lab/<Domain>[/<Level>[/<activity-id | index>]]
//   /access-practice-lab/Model-Test/6-8/<A|B>[/<id>]
//   /access-practice-lab/test/<id>
// New: /tests, /road[/<week>], /family, /passport, /play?ids=…, /tools, and
// ?grades=3-5|6-8 on any URL.
import { brandTitle } from "./brand.js";
import { micDeniedMessage, notePlay, scripts, setComponentsI18n } from "./components.js";
import { earlyCanOpen, earlyGateHTML } from "./early/gate.js";
import { isEarlyBand, normalizeBand } from "./bands.js";
import { namesGradeFocus, normalizeGradeFocus } from "./grade-focus.js";
import { announceGradeFocus } from "./grade-focus-ui.js";
import { availableBands, loadIndex } from "./content.js";
import * as rec from "./recorder.js";
import { playRecording, speak, speakSpanish, stop as stopSpeech } from "./speech.js";
import { getPrefs, setPrefs } from "./store.js";
import { setStudioI18n as setEvidenceUiI18n } from "./evidence-ui.js";
import { LANG_MODES, i18nFor } from "./i18n.js";
import { setItemsI18n } from "./items.js";
import { setStudioI18n as setStudioUiI18n } from "./studio-ui.js";
import { mountShell } from "./shell.js";
import { mountGloss } from "./glossary.js";
import { registerSaveResume } from "./sync.js";
import { readMathLanguageBridge } from "../../shared/math-language-bridge/v2.js";
import { initStartFresh } from "./reset.js";
import { $, ART, BASE, announce, bandOfId, copyText, storage, toHtml } from "./util.js";
import * as homeView from "./views/home.js";

export const BUILD = "2026.11.04.1";
// The home route is the only view in the entry module's static dependency graph. Every secondary route is a
// literal dynamic import so the browser can fetch the learner's chosen destination instead of the entire lab.
// tools/sync-access-shell.mjs versions every literal import and preloads only the static chain; its service worker
// saves the remaining modules in the background so a completed first online visit still prepares the full lab for
// offline use. Aliases intentionally share one loader/cache entry.
const VIEW_LOADERS = {
  learn: () => import("./views/learn.js"),
  reality: () => import("./views/reality.js"),
  exhibition: () => import("./views/exhibition.js"),
  journey: () => import("./views/journey.js"),
  path: () => import("./views/path.js"),
  scaffold: () => import("./views/scaffold.js"),
  move: () => import("./views/move.js"),
  stories: () => import("./views/stories.js"),
  ladder: () => import("./views/ladder.js"),
  grammar: () => import("./views/grammar.js"),
  puzzles: () => import("./views/puzzles.js"),
  library: () => import("./views/library.js"),
  room: () => import("./views/room.js"),
  activity: () => import("./views/activity.js"),
  test: () => import("./views/test.js"),
  tests: () => import("./views/tests.js"),
  road: () => import("./views/road.js"),
  family: () => import("./views/family.js"),
  passport: () => import("./views/passport.js"),
  tools: () => import("./views/tools.js"),
  missions: () => import("./views/missions.js"),
  conversation: () => import("./views/conversation.js"),
  construction: () => import("./views/construction.js"),
  evidence: () => import("./views/evidence.js"),
  growth: () => import("./views/growth.js"),
  speak: () => import("./views/speak.js"),
  voice: () => import("./views/voice.js"),
  arena: () => import("./views/arena.js"),
  mentor: () => import("./views/mentor.js"),
  sentences: () => import("./views/sentences.js"),
  wordlab: () => import("./views/wordlab.js"),
  reader: () => import("./views/reader.js"),
  scenarios: () => import("./views/scenarios.js"),
  city: () => import("./views/city.js"),
  newsroom: () => import("./views/newsroom.js"),
  write: () => import("./views/write.js"),
  detective: () => import("./views/detective.js"),
  diagnostic: () => import("./views/diagnostic.js"),
  launch: () => import("./views/launch-studio.js"),
  worlds: () => import("./views/worlds.js"),
  classroom: () => import("./views/classroom.js"),
  vocabulary: () => import("./views/vocabulary.js"),
  flashcards: () => import("./views/flashcards.js"),
  reading: () => import("./views/reading-room.js"),
  games: () => import("./views/games.js"),
  "publisher-demo": () => import("./views/publisher-demo.js"),
  assess: () => import("./views/assess.js"),
  "science-of-reading": () => import("./views/science-of-reading.js"),
  "subject-reading": () => import("./subject-reading/index.js"),
  "vocab-curriculum": () => import("./vocab-curriculum/view.js"),
  "language-studios": () => import("./views/language-studios.js"),
  "access-prep": () => import("./views/access-prep.js"),
  class: () => import("./views/class.js"),
  "class-quiz": () => import("./views/class-quiz.js"),
  "class-teacher": () => import("./views/class-roster.js"),
  early: () => import("./views/early-hub.js"),
  units: () => import("./views/units.js"),
  warmup: () => import("./views/warmup.js"),
  search: () => import("./views/search.js"),
  portfolio: () => import("./views/portfolio.js"),
  collection: () => import("./views/collection.js"),
};
const VIEW_ALIASES = {
  sor: "science-of-reading",
  "session-done": "home",
  play: "activity",
  mission: "missions",
  "launch-studio": "launch",
  "teacher-launch": "launch",
  "reading-room": "reading",
};
const viewCache = new Map([["home", homeView]]);

export async function loadView(viewName) {
  const key = VIEW_ALIASES[viewName] || viewName;
  if (viewCache.has(key)) return viewCache.get(key);
  const loader = VIEW_LOADERS[key];
  if (!loader) return homeView;
  const pending = loader();
  viewCache.set(key, pending);
  try {
    const view = await pending;
    viewCache.set(key, view);
    return view;
  } catch (error) {
    viewCache.delete(key);
    throw error;
  }
}
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];

export function parseRoute(pathname = location.pathname, search = location.search) {
  const parts = pathname
    .replace(new RegExp(`^${BASE}/?`), "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  const q = new URLSearchParams(search);
  const r = { view: "home", grades: q.get("grades") || "", ...(q.has("gradeFocus") ? { gradeFocus: q.get("gradeFocus") } : {}) };
  const [a, b, c, d] = parts;
  if (!a) {
    const mathBridge = readMathLanguageBridge(search);
    return mathBridge ? { ...r, view: "language-studios", mathBridge } : r;
  }
  if (a === "reading" || a === "reading-room")
    return { ...r, view: "reading-room", id: b || "" };
  if (a === "test") return { ...r, view: "test", testId: b || "" };
  if (a === "worlds") {
    return { ...r, view: "worlds", id: b || "", worldId: b || "", missionId: c || "", tab: q.get("tab") || "" };
  }
  if (a === "language-studios")
    return { ...r, view: a, id: b || "", mathBridge: readMathLanguageBridge(search) };
  if (a === "science-of-reading" && b === "lesson")
    return { ...r, view: a, id: "lesson", lessonId: c || "" };
  if (a === "science-of-reading" && b === "subject-reading")
    return { ...r, view: "subject-reading", id: c || "" };
  if (a === "subject-reading")
    return { ...r, view: "subject-reading", id: b || "" };
  if (a === "vocab-curriculum")
    return { ...r, view: "vocab-curriculum", id: b || "", lessonId: c || "" };
  if (a === "vocabulary" && b === "mastery")
    return { ...r, view: "vocab-curriculum", id: c || "", lessonId: d || "" };
  if (["learn", "reality", "exhibition", "tests", "family", "passport", "tools", "library", "missions", "mission", "conversation", "construction", "evidence", "growth", "speak", "write", "detective", "launch", "launch-studio", "teacher-launch", "classroom", "vocabulary", "flashcards", "stories", "ladder", "puzzles", "publisher-demo", "games", "assess", "path", "scaffold", "move", "science-of-reading", "language-studios", "sor", "early", "grammar", "reader", "access-prep"].includes(a)) {
    return { ...r, view: a, id: b || "", missionId: b || "", scenarioId: b || "", tab: q.get("tab") || "" };
  }
  if (a === "class")
    return { ...r, view: b === "quiz" ? "class-quiz" : b === "teacher" ? "class-teacher" : "class", id: b || "" };
  if (a === "arena") return { ...r, view: "arena", id: b || "" };
  if (a === "mentor") return { ...r, view: "mentor", id: b || "", sub: c || "" };
  if (a === "sentences") return { ...r, view: "sentences", id: b || "", sub: c || "" };
  if (a === "voice") return { ...r, view: "voice", id: b || "", sub: c || "", tab: q.get("tab") || "" };
  if (a === "wordlab") return { ...r, view: "wordlab", id: b || "", sub: c || "" };
  if (a === "scenarios") return { ...r, view: "scenarios", id: b || "" };
  if (a === "city") return { ...r, view: "city", id: b || "", missionId: c || "" };
  if (a === "newsroom") return { ...r, view: "newsroom", id: b || "", tab: q.get("step") || "" };
  if (a === "warmup") return { ...r, view: "warmup", id: b || "", date: q.get("date") || "" };
  if (a === "search") return { ...r, view: "search", id: b || "", q: q.get("q") || "", kind: q.get("kind") || "", all: q.get("all") || "" };
  if (a === "portfolio") return { ...r, view: "portfolio", id: b || "", mode: q.get("view") || "" };
  if (a === "collection") return { ...r, view: "collection", id: b || "" };
  if (a === "units") return { ...r, view: "units", id: b || "", sub: c || "", tab: q.get("tab") || "" };
  if (a === "journey") return { ...r, view: "journey", id: b || "", rest: parts.slice(1) };
  if (a === "diagnostic") return { ...r, view: "diagnostic", domain: b || "" };
  if (a === "road") return { ...r, view: "road", week: Number(b) || 0 };
  if (a === "play")
    return {
      ...r,
      view: "play",
      ids: (q.get("ids") || "").split(",").filter(Boolean),
      index: Number(q.get("i")) || 0,
      title: q.get("t") || "",
      sessionId: q.get("sid") || "",
    };
  if (a === "session-done") return { ...r, view: "session-done", sessionId: b || q.get("sid") || "" };
  if (!DOMAINS.includes(a)) return { ...r, notFound: true };
  if (a === "Model-Test") {
    const level = b && c ? `${b}-${c}` : "";
    return d
      ? { ...r, view: "activity", domain: a, level, id: d }
      : { ...r, view: "room", domain: a, level };
  }
  if (c) return { ...r, view: "activity", domain: a, level: b, id: c };
  return { ...r, view: "room", domain: a, level: b || "" };
}

const app = {
  route: null,
  band: "6-8",
  bands: ["6-8"],
  prefs: getPrefs(),
  view: null,
  rendering: 0,
  location: "",
};

export const ctx = {
  get route() {
    return app.route;
  },
  get band() {
    return app.band;
  },
  get bands() {
    return app.bands;
  },
  get prefs() {
    return app.prefs;
  },
  setPrefs(patch) {
    app.prefs = setPrefs(patch);
    return app.prefs;
  },
  navigate,
  rerender: () => render({ keepFocus: true }),
  setBand(band) {
    if (!app.bands.includes(band) || band === app.band) return;
    app.band = band;
    app.prefs = setPrefs({ band });
    {
      const g = band.replace("-", "–");
      announce(i18nFor(ctx).S(`Showing ${g} practice.`, `Mostrando la práctica de ${g}.`));
    }
  },
};

function resolveBand(route) {
  const asked = normalizeBand(route.grades);
  if (asked && app.bands.includes(asked)) return asked;
  if (route.view === "activity" && route.id && !/^\d+$/.test(route.id)) return bandOfId(route.id);
  if (route.domain === "Model-Test") return "6-8";
  if (app.prefs.band && app.bands.includes(app.prefs.band)) return app.prefs.band;
  return app.bands.includes("6-8") ? "6-8" : app.bands[0];
}

export function navigate(path, { replace = false } = {}) {
  const url = new URL(path, location.origin);
  if (url.pathname + url.search === location.pathname + location.search && !replace)
    return render({ keepFocus: false });
  history[replace ? "replaceState" : "pushState"]({}, "", url.pathname + url.search + url.hash);
  return render({ keepFocus: false, scroll: true });
}

function focusKey(el) {
  if (!el || el === document.body) return null;
  if (el.matches?.("[data-mode]")) return `[data-mode][value="${CSS.escape(el.value)}"]`;
  for (const attr of [
    "data-ans-sort",
    "data-ans-move",
    "data-ans-hot",
    "data-ans-cloze",
    "data-listen",
    "data-rec-start",
    "data-rec-stop",
    "data-rate",
    "data-set-band",
    "data-grade-focus",
    "data-lang",
    "data-selfcheck",
    "data-tab-key",
    "data-check",
    "data-retry",
    "data-check-writing",
    "data-save-speaking",
    "data-stop-audio",
    "data-rr-action",
    "data-rr-answer",
  ]) {
    if (el.hasAttribute?.(attr)) {
      const extra = el.dataset.cat || el.dataset.dir || el.dataset.rate || "";
      return `[${attr}="${CSS.escape(el.getAttribute(attr))}"]${extra ? `[data-${el.dataset.cat ? "cat" : el.dataset.dir ? "dir" : "rate"}="${CSS.escape(extra)}"]` : ""}`;
    }
  }
  // Any other control the studios render: key it by its first data-* attribute (and value) so keyboard
  // and screen-reader users keep their place after a re-render instead of landing on <body>.
  const dataAttr = [...(el.attributes || [])].find((a) => a.name.startsWith("data-") && !["data-nsr-ignore", "data-stage"].includes(a.name));
  if (dataAttr && el.matches?.("button, input, select, textarea, a")) {
    const value = dataAttr.value ? `[${dataAttr.name}="${CSS.escape(dataAttr.value)}"]` : `[${dataAttr.name}]`;
    if (document.querySelectorAll(value).length === 1) return value;
  }
  if (el.name && el.value != null && (el.type === "radio" || el.type === "checkbox"))
    return `input[name="${CSS.escape(el.name)}"][value="${CSS.escape(el.value)}"]`;
  if (el.id) return `#${CSS.escape(el.id)}`;
  return null;
}

async function render({ keepFocus = false, scroll = false } = {}) {
  const token = ++app.rendering;
  const route = parseRoute();
  const locationKey = location.pathname + location.search;
  const routeChanged = app.location !== locationKey;
  if (routeChanged) {
    app.view?.unmount?.();
    stopSpeech();
    rec.stop();
    app.location = locationKey;
  }
  // Restore/import/clear actions may replace preferences outside this module.
  app.prefs = getPrefs();
  document.documentElement.style.setProperty("--lab-scale", String(app.prefs.textSize || 1));
  app.route = route;
  app.band = resolveBand(route);
  // Shared builders (components, items, studio and evidence UI) read the language from here, once per render.
  const I = i18nFor(ctx);
  setComponentsI18n(I);
  setItemsI18n(I);
  setStudioUiI18n(I);
  setEvidenceUiI18n(I);
  if (route.grades && normalizeBand(route.grades) === app.band && app.prefs.band !== app.band)
    app.prefs = setPrefs({ band: app.band });
  // A shared link may name a grade focus (?gradeFocus=7, or =all); it is remembered like ?grades=.
  if (namesGradeFocus(route.gradeFocus) && normalizeGradeFocus(route.gradeFocus) !== app.prefs.gradeFocus)
    app.prefs = setPrefs({ gradeFocus: normalizeGradeFocus(route.gradeFocus) });
  const root = $("#app");
  // A lazy route can take more than one frame on a cold cache. Remove the previous screen
  // immediately so assistive technology and automation never mistake stale content for the
  // destination, and expose a small, deterministic loading state until the view is ready.
  if (routeChanged && app.rendered) {
    root.setAttribute("aria-busy", "true");
    root.innerHTML = `<div class="panel route-loading" role="status"><p>${i18nFor(ctx).S("Loading…", "Cargando…")}</p></div>`;
  }
  const fk = keepFocus ? focusKey(document.activeElement) : null;
  let out;
  let view;
  try {
    // Grades K-3 have their own home and player; rooms built for grades 3-8 say so instead of showing older
    // children's content under a K-3 label (src/early/gate.js).
    const gated = isEarlyBand(app.band) && !earlyCanOpen(route);
    view = gated ? { render: (c) => earlyGateHTML(c, i18nFor(c)) } : await loadView(isEarlyBand(app.band) && (route.view === "home" || (route.view === "family" && !route.id)) ? "early" : route.view);
    if (token !== app.rendering) return;
    if (view !== app.view) {
      stopSpeech();
      rec.stop();
    }
    app.view = view;
    out = await view.render(ctx);
  } catch (error) {
    console.error("[access-lab]", error);
    view = homeView;
    app.view = view;
    out = {
      title: "Something went wrong",
      html: `<section class="panel error-panel empty-state"><img src="${ART}/empty.svg" width="480" height="300" alt="" /><h1>We could not load this page.</h1><p>Check your internet connection, then try again.</p><p><a class="btn btn-primary" href="${BASE}/">Go to the lab home</a></p></section>`,
    };
  }
  if (token !== app.rendering) return;
  root.innerHTML = toHtml(out.html);
  root.removeAttribute("aria-busy");
  // Orientation on navigation only: the new screen settles in place (reduced motion turns this off).
  if (routeChanged && app.rendered) {
    root.classList.remove("is-entering");
    void root.offsetWidth;
    root.classList.add("is-entering");
    root.addEventListener("animationend", () => root.classList.remove("is-entering"), { once: true });
  }
  app.rendered = true;
  // Shared links carry their grade context into a fresh browser.
  for (const link of root.querySelectorAll("a[href]")) {
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !url.pathname.startsWith(`${BASE}/`) || /\.[a-z0-9]+$/i.test(url.pathname) || url.pathname.startsWith(`${BASE}/printables/`)) continue;
    if (!url.searchParams.has("grades")) url.searchParams.set("grades", app.band);
    const mode = new URLSearchParams(location.search).get("mode");
    if (mode && !url.searchParams.has("mode")) url.searchParams.set("mode", mode);
    link.href = url.pathname + url.search + url.hash;
  }
  document.title = brandTitle(out.title);
  document.body.dataset.labView = route.view;
  document.body.dataset.labBand = app.band;
  mountShell(ctx);
  view.mount?.(root, ctx);
  if (fk) {
    const target = root.querySelector(fk)
      || root.querySelector(".feedback, .saved-note")
      || root.querySelector("[data-check]")
      || root.querySelector("h1");
    if (target && !target.matches("button, input, select, textarea, a[href]")) target.tabIndex = -1;
    target?.focus({ preventScroll: true });
  } else if (!keepFocus) {
    if (scroll) window.scrollTo({ top: 0 });
    root.querySelector("h1")?.focus({ preventScroll: true });
  }
}

// ── shared interactions ───────────────────────────────────────────────────────
async function common(e) {
  const t = e.target;
  if (t.closest("[data-stop-audio]")) {
    stopSpeech();
    document.querySelectorAll(".listen-player.is-playing").forEach((el) => el.classList.remove("is-playing"));
    announce(i18nFor(ctx).S("Audio stopped.", "Audio detenido."));
    return true;
  }
  const say = t.closest("[data-say]");
  if (say) return (speak(say.dataset.say, { rate: app.prefs.rate, voiceURI: app.prefs.readingVoice }), true);
  const sayEs = t.closest("[data-say-es]");
  if (sayEs) {
    speakSpanish(sayEs.dataset.sayEs, { rate: 0.9 }).then((r) => {
      if (r === "no-voice")
        announce(i18nFor(ctx).S("This device has no Spanish voice. Read the Spanish on the screen.", "Este dispositivo no tiene una voz en español. Lee el español en la pantalla."));
    });
    return true;
  }
  const listen = t.closest("[data-listen]");
  if (listen) {
    const key = listen.dataset.listen;
    if (app.view?.canListen && !app.view.canListen(key)) return true;
    const startedAt = app.location;
    const player = listen.closest(".listen-player");
    player?.classList.add("is-playing");
    notePlay(key);
    app.view?.onListen?.(key);
    const recorded = app.view?.recordingFor?.(key);
    let done = recorded ? await playRecording(recorded, { rate: app.prefs.rate }) : "failed";
    if (done === "failed") done = await speak(scripts.get(key) || [], { rate: app.prefs.rate });
    player?.classList.remove("is-playing");
    if (done && app.location === startedAt) render({ keepFocus: true });
    return true;
  }
  const rate = t.closest("[data-rate]");
  if (rate) {
    ctx.setPrefs({ rate: Number(rate.dataset.rate) });
    render({ keepFocus: true });
    return true;
  }
  const langBtn = t.closest("[data-lang-mode]");
  if (langBtn) {
    const mode = LANG_MODES.includes(langBtn.dataset.langMode) ? langBtn.dataset.langMode : "en";
    ctx.setPrefs({ lang: mode, langChosen: true });
    announce({ en: "Language: English.", es: "Idioma: español.", bi: "Language: English and Español. Idioma: inglés y español." }[mode]);
    const fromPage = Boolean(langBtn.closest("#app"));
    await render({ keepFocus: true });
    // From the header, keep focus on the same control. From the page, a view may already have moved focus
    // (the setup wizard moves it to the next question); otherwise return to the control that was used.
    const stillLost = !document.activeElement || document.activeElement === document.body;
    if (!fromPage) document.querySelector(`.lab-tools [data-lang-mode="${mode}"]`)?.focus({ preventScroll: true });
    else if (stillLost) document.querySelector(`#app [data-lang-mode="${mode}"]`)?.focus({ preventScroll: true });
    return true;
  }
  if (t.closest("[data-lang-keep]")) {
    ctx.setPrefs({ langChosen: true });
    document.getElementById("labLangBanner")?.remove();
    return true;
  }
  const gradeFocus = t.closest("[data-grade-focus]");
  if (gradeFocus) {
    const next = normalizeGradeFocus(gradeFocus.dataset.gradeFocus);
    ctx.setPrefs({ gradeFocus: next });
    const url = new URL(location.href);
    if (url.searchParams.has("gradeFocus")) {
      url.searchParams.set("gradeFocus", next || "all");
      history.replaceState({}, "", url.pathname + url.search + url.hash);
    }
    announce(announceGradeFocus(i18nFor(ctx), next));
    ctx.rerender();
    return true;
  }
  const band = t.closest("[data-set-band]");
  if (band) {
    ctx.setBand(band.dataset.setBand);
    const url = new URL(location.href);
    url.searchParams.set("grades", app.band);
    navigate(url.pathname + url.search, { replace: true });
    return true;
  }
  const recStart = t.closest("[data-rec-start]");
  if (recStart) {
    const key = recStart.dataset.recStart;
    const owner = app.view;
    const startedAt = app.location;
    const prep = Number(recStart.dataset.recPrep) || 0;
    const maxSeconds = Number(recStart.dataset.recMax) || 0;
    recStart.disabled = true;
    try {
      if (prep > 0) {
        const countdownEl = () => document.querySelector(`[data-rec-countdown="${CSS.escape(key)}"]`);
        const ready = await rec.countdown(prep, {
          onTick: (n) => {
            const el = countdownEl();
            if (el) el.textContent = n > 0 ? i18nFor(ctx).S(`Recording starts in ${n}…`, `La grabación empieza en ${n}…`) : "";
            if (n > 0) announce(String(n));
          },
        });
        if (!ready || app.location !== startedAt) {
          recStart.disabled = false;
          return true;
        }
      }
      const recording = await rec.start(key, {
        maxSeconds,
        onLevel: (lvl, secs) => {
          const m = $(".rec-meter");
          if (m) m.style.setProperty("--lvl", lvl.toFixed(2));
          const s = $(".rec-time");
          if (s) s.textContent = maxSeconds ? `${secs}s of ${maxSeconds}s` : `${secs}s`;
        },
        onStop: async (_takes, { limited }) => {
          owner?.onRecorded?.(key, ctx);
          if (app.location !== startedAt) return;
          if (limited) announce(i18nFor(ctx).S("Time is up. Your recording was saved.", "Se acabó el tiempo. Se guardó tu grabación."));
          await render({ keepFocus: true });
          // Move to the next thing the learner does: type or review what they said.
          document.querySelector("[data-transcript], [data-rec-start]")?.focus({ preventScroll: false });
        },
      });
      if (recording && app.location === startedAt) {
        await render({ keepFocus: true });
        document.querySelector("[data-rec-stop]")?.focus();
        announce(i18nFor(ctx).S("Recording. Press Stop when you are done.", "Grabando. Pulsa Detener cuando termines."));
      } else {
        recStart.disabled = false;
      }
    } catch {
      recStart.disabled = false;
      if (app.location !== startedAt) return true;
      const message = micDeniedMessage(i18nFor(ctx));
      const status = document.querySelector(`[data-rec-error="${CSS.escape(key)}"]`);
      if (status) { status.textContent = message; status.hidden = false; }
      announce(message);
      document.querySelector(`[data-rec-start="${CSS.escape(key)}"]`)?.focus({ preventScroll: true });
    }
    return true;
  }
  if (t.closest("[data-rec-stop]")) return (rec.stop(), true);
  const copy = t.closest("[data-copy]");
  if (copy) return (copyText(new URL(copy.dataset.copy, location.origin).href), true);
  if (t.closest("[data-print]")) return (window.print(), true);
  const size = t.closest("[data-text-size]");
  if (size) {
    const next = Math.min(
      1.4,
      Math.max(0.9, (app.prefs.textSize || 1) + Number(size.dataset.textSize)),
    );
    ctx.setPrefs({ textSize: next });
    document.documentElement.style.setProperty("--lab-scale", String(next));
    announce(i18nFor(ctx).S(`Text size ${Math.round(next * 100)}%`, `Tamaño del texto ${Math.round(next * 100)}%`));
    return true;
  }
  return false;
}

function interceptLink(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
    return false;
  const a = e.target.closest("a[href]");
  if (!a || a.target || a.hasAttribute("download")) return false;
  const url = new URL(a.href, location.href);
  if (url.hash && url.pathname === location.pathname && url.search === location.search) {
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) {
      e.preventDefault();
      const disclosure = target.closest("details:not([open])");
      if (disclosure) disclosure.open = true;
      target.focus();
      target.scrollIntoView({ block: "start" });
      return true;
    }
  }
  if (
    url.origin !== location.origin ||
    !url.pathname.startsWith(`${BASE}/`) ||
    /\.[a-z0-9]+$/i.test(url.pathname) ||
    url.pathname.startsWith(`${BASE}/printables/`)
  )
    return false;
  e.preventDefault();
  navigate(url.pathname + url.search + url.hash);
  return true;
}

document.addEventListener("click", async (e) => {
  if (interceptLink(e)) return;
  // Views run first and synchronously, so they can preventDefault (answer cards).
  if (app.view?.onClick?.(e, ctx) === true) return;
  if (app.view?.onMissionEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  if (app.view?.onConversationEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  if (app.view?.onConstructionEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  if (app.view?.onEvidenceEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  common(e);
});
document.addEventListener("change", (e) => {
  if (app.view?.onMissionEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  if (app.view?.onConversationEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  if (app.view?.onConstructionEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  if (app.view?.onEvidenceEvent?.(e.target, ctx) === true) { render({ keepFocus: true }); return; }
  app.view?.onChange?.(e, ctx);
});
document.addEventListener("input", (e) => app.view?.onInput?.(e, ctx));
document.addEventListener("keydown", (e) => app.view?.onKey?.(e, ctx));
window.addEventListener("popstate", () => render({ scroll: true }));
window.addEventListener("pagehide", () => { app.view?.unmount?.(); stopSpeech(); rec.stop(); });

function watchNetwork() {
  const note = $("#labNet");
  const show = (offline) => {
    if (!note) return;
    // The shell ships the English sentence; a family reading Spanish gets Spanish (or both) when it appears.
    if (offline)
      note.textContent = i18nFor(ctx).S(
        "You are offline. Practice and saved work keep working. Sharing and the official WIDA demo need a connection.",
        "No hay conexión. La práctica y el trabajo guardado siguen funcionando. Compartir y la demostración oficial de WIDA necesitan conexión.",
      );
    note.hidden = !offline;
  };
  window.addEventListener("online", () => show(false));
  window.addEventListener("offline", () => show(true));
  show(navigator.onLine === false);
}

/** Offline copy of the lab (sw.js). Driven browsers skip it unless the URL says ?sw=1, so tests never see a stale cache. */
function registerOffline() {
  if (!("serviceWorker" in navigator)) return;
  if (navigator.webdriver && !/[?&]sw=1\b/.test(location.search)) return;
  const register = async () => {
    try {
      await navigator.serviceWorker.register(`${BASE}/sw.js`, { scope: `${BASE}/` });
      await navigator.serviceWorker.ready;
      let sent = false;
      const warm = () => {
        if (sent || !navigator.serviceWorker.controller) return;
        sent = true;
        navigator.serviceWorker.controller.postMessage({ type: "prepare-offline" });
      };
      const schedule = () =>
        "requestIdleCallback" in window
          ? window.requestIdleCallback(warm, { timeout: 5000 })
          : window.setTimeout(warm, 1200);
      schedule();
      navigator.serviceWorker.addEventListener("controllerchange", schedule, { once: true });
    } catch {
      // The online app remains fully usable when service workers are blocked.
    }
  };
  if (document.readyState === "complete") register();
  else window.addEventListener("load", register, { once: true });
}

async function boot() {
  initStartFresh();
  document.documentElement.style.setProperty("--lab-scale", String(app.prefs.textSize || 1));
  try {
    await loadIndex();
    app.bands = await availableBands();
  } catch {}
  mountGloss();
  // A learner who joined a class on this device keeps syncing from any page; everyone else loads nothing.
  if (storage.get("accessPracticeLabClass:v1:link")) import("./class/link.js").then((m) => m.bootClassSync()).catch(() => {});
  registerSaveResume(() => render({ keepFocus: true }));
  const stamp = $("#labBuild");
  if (stamp) stamp.textContent = stamp.dataset.build = `ACCESS Practice Lab · build ${BUILD}`;
  await render({ scroll: false });
  document.documentElement.classList.add("lab-ready");
  watchNetwork();
  registerOffline();
  mountTourGuide();
}

/** The Family Expedition guide panel loads only for families who opened a lab page from the tour. */
function mountTourGuide() {
  let saved = null;
  try {
    saved = sessionStorage.getItem("ewl-tour-dock");
  } catch {}
  if (!new URLSearchParams(location.search).has("tour") && saved === null) return;
  import("./tour-dock.js").then((m) => m.mountTourDock()).catch(() => {});
}
boot();
