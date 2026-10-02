// ACCESS Practice Lab — app entry: router, render loop, shared event handling.
//
// Every URL the previous lab answered still resolves (see parseRoute):
//   /access-practice-lab/<Domain>[/<Level>[/<activity-id | index>]]
//   /access-practice-lab/Model-Test/6-8/<A|B>[/<id>]
//   /access-practice-lab/test/<id>
// New: /tests, /road[/<week>], /family, /passport, /play?ids=…, /tools, and
// ?grades=3-5|6-8 on any URL.
import { notePlay, scripts } from "./components.js";
import { availableBands, loadIndex } from "./content.js";
import * as rec from "./recorder.js";
import { stop as stopSpeech, speak } from "./speech.js";
import { getPrefs, setPrefs } from "./store.js";
import { registerSaveResume } from "./sync.js";
import { $, BASE, announce, bandOfId, copyText, toHtml } from "./util.js";
import * as activityView from "./views/activity.js";
import * as familyView from "./views/family.js";
import * as homeView from "./views/home.js";
import * as libraryView from "./views/library.js";
import * as passportView from "./views/passport.js";
import * as roadView from "./views/road.js";
import * as roomView from "./views/room.js";
import * as testView from "./views/test.js";
import * as testsView from "./views/tests.js";
import * as toolsView from "./views/tools.js";

export const BUILD = "2026.10.02";
const VIEWS = {
  home: homeView,
  library: libraryView,
  room: roomView,
  activity: activityView,
  play: activityView,
  test: testView,
  tests: testsView,
  road: roadView,
  family: familyView,
  passport: passportView,
  tools: toolsView,
};
const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];

export function parseRoute(pathname = location.pathname, search = location.search) {
  const parts = pathname
    .replace(new RegExp(`^${BASE}/?`), "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  const q = new URLSearchParams(search);
  const r = { view: "home", grades: q.get("grades") || "" };
  const [a, b, c, d] = parts;
  if (!a) return r;
  if (a === "test") return { ...r, view: "test", testId: b || "" };
  if (["tests", "family", "passport", "tools", "library"].includes(a)) return { ...r, view: a };
  if (a === "road") return { ...r, view: "road", week: Number(b) || 0 };
  if (a === "play")
    return {
      ...r,
      view: "play",
      ids: (q.get("ids") || "").split(",").filter(Boolean),
      index: Number(q.get("i")) || 0,
      title: q.get("t") || "",
    };
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
    announce(`Showing ${band.replace("-", "–")} practice.`);
  },
};

function resolveBand(route) {
  if (route.grades && app.bands.includes(route.grades)) return route.grades;
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
    "data-selfcheck",
    "data-tab-key",
    "data-check",
    "data-retry",
    "data-check-writing",
    "data-save-speaking",
    "data-stop-audio",
  ]) {
    if (el.hasAttribute?.(attr)) {
      const extra = el.dataset.cat || el.dataset.dir || el.dataset.rate || "";
      return `[${attr}="${CSS.escape(el.getAttribute(attr))}"]${extra ? `[data-${el.dataset.cat ? "cat" : el.dataset.dir ? "dir" : "rate"}="${CSS.escape(extra)}"]` : ""}`;
    }
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
  if (route.grades && route.grades === app.band && app.prefs.band !== app.band)
    app.prefs = setPrefs({ band: app.band });
  const view = VIEWS[route.view] || homeView;
  if (view !== app.view) {
    stopSpeech();
    rec.stop();
  }
  app.view = view;
  const root = $("#app");
  const fk = keepFocus ? focusKey(document.activeElement) : null;
  let out;
  try {
    out = await view.render(ctx);
  } catch (error) {
    console.error("[access-lab]", error);
    out = {
      title: "Something went wrong",
      html: `<section class="panel error-panel"><h1>We could not load this page.</h1><p>Check your internet connection, then try again.</p><p><a class="btn" href="${BASE}/">Go to the lab home</a></p></section>`,
    };
  }
  if (token !== app.rendering) return;
  root.innerHTML = toHtml(out.html);
  document.title = out.title ? `${out.title} · ACCESS Practice Lab` : "ACCESS Practice Lab";
  document.body.dataset.labView = route.view;
  document.body.dataset.labBand = app.band;
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
    announce("Audio stopped.");
    return true;
  }
  const say = t.closest("[data-say]");
  if (say) return (speak(say.dataset.say, { rate: app.prefs.rate }), true);
  const sayEs = t.closest("[data-say-es]");
  if (sayEs) return (speak(sayEs.dataset.sayEs, { lang: "es-US", rate: 0.9 }), true);
  const listen = t.closest("[data-listen]");
  if (listen) {
    const key = listen.dataset.listen;
    const startedAt = app.location;
    const player = listen.closest(".listen-player");
    player?.classList.add("is-playing");
    notePlay(key);
    const done = await speak(scripts.get(key) || [], { rate: app.prefs.rate });
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
  const band = t.closest("[data-set-band]");
  if (band) {
    ctx.setBand(band.dataset.setBand);
    const url = new URL(location.href);
    url.searchParams.delete("grades");
    navigate(url.pathname + url.search, { replace: true });
    return true;
  }
  const recStart = t.closest("[data-rec-start]");
  if (recStart) {
    const key = recStart.dataset.recStart;
    const owner = app.view;
    const startedAt = app.location;
    try {
      const recording = await rec.start(key, {
        onLevel: (lvl, secs) => {
          const m = $(".rec-meter");
          if (m) m.style.setProperty("--lvl", lvl.toFixed(2));
          const s = $(".rec-time");
          if (s) s.textContent = `${secs}s`;
        },
        onStop: () => {
          owner?.onRecorded?.(key, ctx);
          if (app.location === startedAt) render({ keepFocus: true });
        },
      });
      if (recording && app.location === startedAt) render({ keepFocus: true });
    } catch {
      if (app.location !== startedAt) return true;
      announce(
        "The microphone is blocked. Allow the microphone in your browser, or practice aloud with a partner.",
      );
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
    announce(`Text size ${Math.round(next * 100)}%`);
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

document.addEventListener("click", (e) => {
  if (interceptLink(e)) return;
  // Views run first and synchronously, so they can preventDefault (answer cards).
  if (app.view?.onClick?.(e, ctx) === true) return;
  common(e);
});
document.addEventListener("change", (e) => app.view?.onChange?.(e, ctx));
document.addEventListener("input", (e) => app.view?.onInput?.(e, ctx));
document.addEventListener("keydown", (e) => app.view?.onKey?.(e, ctx));
window.addEventListener("popstate", () => render({ scroll: true }));
window.addEventListener("pagehide", () => { app.view?.unmount?.(); stopSpeech(); rec.stop(); });

async function boot() {
  document.documentElement.style.setProperty("--lab-scale", String(app.prefs.textSize || 1));
  try {
    await loadIndex();
    app.bands = await availableBands();
  } catch {}
  registerSaveResume(() => render({ keepFocus: true }));
  const stamp = $("#labBuild");
  if (stamp) stamp.textContent = `ACCESS Practice Lab · build ${BUILD}`;
  await render({ scroll: false });
  document.documentElement.classList.add("lab-ready");
}
boot();
