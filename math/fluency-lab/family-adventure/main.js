/* Family Math Expedition — the controller: saved state, language, the five stops, the map and the celebration.
 * One bilingual page with no account. State stays on this device (see core.js for the migration from the first adventure). */
import { COPY, STOPS } from "./copy.js";
import {
  GRADES,
  STOP_IDS,
  activeProfile,
  fresh,
  h,
  langKit,
  load,
  readLang,
  save,
  shareLang,
} from "./core.js";
import { renderDone, renderMap, buildPrintSheet } from "./screens.js";
import { renderWelcome } from "./stop1.js";
import { renderDiscover } from "./stop2.js";
import { renderTogether } from "./stop3.js";
import { renderExplore } from "./stop4.js";
import { renderNight } from "./stop5.js";
import { pieces, speak, stop as stopSpeech, supported } from "./tts.js";
import { icon } from "./art.js";
import { btn } from "./ui.js";
import { labUrl } from "./routes.js";

const $ = (id) => document.getElementById(id);
const RENDER = [renderWelcome, renderDiscover, renderTogether, renderExplore, renderNight];

let S = load();
// Opening the page with saved progress lands on Welcome, where Resume is offered; the saved place is kept here.
let resumeTo = S.screen !== "stop" || S.stop > 0 ? { screen: S.screen, stop: S.stop } : null;
if (resumeTo) {
  S.screen = "stop";
  S.stop = 0;
}
let mode = readLang();
let listening = false;
let toastTimer;
const memory = {};
const K = langKit(() => mode);

// Deep links from other pages: ?grade=4&stop=2&lang=es
{
  const q = new URLSearchParams(location.search);
  const g = Number(q.get("grade"));
  if (GRADES.includes(g)) S.grade = g;
  const st = Number(q.get("stop"));
  if (Number.isInteger(st) && st >= 1 && st <= 5) {
    S.screen = "stop";
    S.stop = st - 1;
    resumeTo = null;
  }
  const l = q.get("lang");
  if (l === "es" || l === "en") mode = l;
}

const ctx = {
  S,
  K,
  memory,
  mode: () => mode,
  profile: activeProfile,
  isListening: () => listening,
  hasProgress: () => S.done.some(Boolean) || resumeTo !== null,
  save: () => save(S, () => ($("warn").hidden = false)),
  redraw: (focus = false) => render(focus),
  markDone(i) {
    if (!S.done[i]) {
      S.done[i] = true;
      ctx.save();
      paintRoute();
    }
  },
  go(i) {
    resumeTo = null;
    S.screen = "stop";
    S.stop = i;
    stopListening();
    ctx.save();
    render(true);
    announce(`${K.plain(COPY.stopOf(i + 1, STOPS.length))}: ${K.plain(STOPS[i].title)}`);
  },
  finish(i) {
    ctx.markDone(i);
    ctx.go(i + 1);
  },
  toMap() {
    S.screen = "free";
    stopListening();
    ctx.save();
    render(true);
  },
  toDone() {
    S.screen = "done";
    ctx.save();
    render(true);
  },
  finishExpedition() {
    ctx.markDone(4);
    ctx.toDone();
  },
  start() {
    if (!S.grade) {
      $("grade-warn").hidden = false;
      document.querySelector(".grade[tabindex='0']")?.focus();
      return;
    }
    ctx.finish(0);
  },
  resume() {
    const at = resumeTo;
    resumeTo = null;
    if (at?.screen === "free") return ctx.toMap();
    if (at?.screen === "done" || S.done.every(Boolean)) return ctx.toDone();
    const next = at?.screen === "stop" && at.stop > 0 ? at.stop : S.done.findIndex((d) => !d);
    ctx.go(Math.max(1, next));
  },
  setGrade(g, keepFocus) {
    S.grade = g;
    ctx.save();
    render(false);
    if (keepFocus) document.querySelector(`.grade[data-grade="${g}"]`)?.focus();
  },
  askRestart() {
    $("resetBar").hidden = false;
    $("resetBar").scrollIntoView({ block: "nearest" });
    $("resetBar").querySelector("[data-reset]")?.focus({ preventScroll: true });
  },
  isRestarting: () => !$("resetBar").hidden,
  toggleListen() {
    if (listening) return stopListening();
    const list = [...$("content").querySelectorAll("[data-narrate]")].flatMap((el) =>
      pieces(el, mode),
    );
    if (!list.length) return;
    listening = true;
    paintListen();
    speak(list, () => {
      listening = false;
      paintListen();
    });
  },
  printGuide(links, routine, grade) {
    const holder = $("printSheet");
    holder.replaceChildren(buildPrintSheet(ctx, links, routine, grade));
    const clear = () => {
      holder.replaceChildren();
      window.removeEventListener("afterprint", clear);
    };
    window.addEventListener("afterprint", clear);
    window.print();
  },
};

function stopListening() {
  stopSpeech();
  if (listening) {
    listening = false;
    paintListen();
  }
}
function paintListen() {
  const b = document.querySelector(".listen");
  if (!b) return;
  b.setAttribute("aria-pressed", String(listening));
  b.lastChild.textContent = K.plain(listening ? COPY.stopListen : COPY.listen);
}
function announce(text) {
  $("live").textContent = "";
  setTimeout(() => ($("live").textContent = text), 40);
}
function toast(pair) {
  clearTimeout(toastTimer);
  $("toast").textContent = K.plain(pair);
  $("toast").hidden = false;
  toastTimer = setTimeout(() => ($("toast").hidden = true), 2600);
}

// ---- chrome ----------------------------------------------------------------------------------------------------
function paintChrome() {
  const brand = $("brand");
  brand.replaceChildren(icon("back", "btn-ico"), h("span", {}, K.plain(COPY.brand)));
  brand.setAttribute("aria-label", K.plain(COPY.brandBack));
  const lang = $("lang");
  lang.setAttribute("aria-label", K.plain(COPY.langLabel));
  lang.replaceChildren(
    ...[
      ["en", "English"],
      ["es", "Español"],
      ["bi", "EN + ES"],
    ].map(([m, label]) => {
      const b = h(
        "button",
        {
          type: "button",
          "aria-pressed": String(mode === m),
          data: { lang: m },
          lang: m === "es" ? "es" : null,
        },
        label,
      );
      return b;
    }),
  );
  const help = $("helpBtn");
  help.replaceChildren(icon("bulb", "btn-ico"), h("span", {}, K.plain(COPY.help)));
  paintHelp();
  const bar = $("resetBar");
  bar.replaceChildren(
    h("p", { id: "resetMsg" }, K.bi("strong", COPY.startQ), h("br"), K.bi("span", COPY.startQd)),
    h(
      "div",
      { class: "row" },
      btn(K, COPY.yesStart, { cls: "btn-primary", data: { reset: "" } }),
      btn(K, COPY.keep, { data: { resetCancel: "" } }),
    ),
  );
  $("warn").textContent = K.plain(COPY.saveFail);
  $("foot").replaceChildren(K.bi("p", COPY.foot));
  document.documentElement.lang = mode === "es" ? "es" : "en";
  document.title = `${K.plain(COPY.title)} | EduWonderLab`;
  paintRoute();
}

function paintHelp() {
  const panel = $("helpPanel");
  panel.setAttribute("aria-label", K.plain(COPY.helpTitle));
  const list = h("ul", { class: "help-list" });
  STOPS.forEach((s, i) =>
    list.append(
      h(
        "li",
        {},
        btn(
          K,
          { en: `${i + 1}. ${s.name.en}`, es: `${i + 1}. ${s.name.es}` },
          {
            cls: "btn-quiet",
            onClick: () => {
              closeHelp();
              ctx.go(i);
            },
          },
        ),
      ),
    ),
  );
  const g = { grade: S.grade || undefined, profile: activeProfile(), mode };
  panel.replaceChildren(
    K.bi("h2", COPY.helpTitle, "help-title"),
    list,
    h(
      "div",
      { class: "help-links" },
      btn(K, COPY.mapTitle, {
        cls: "btn-quiet",
        ico: "grid",
        onClick: () => {
          closeHelp();
          ctx.toMap();
        },
      }),
      btn(K, COPY.helpTour, { href: `${labUrl(g)}&tour=family`, cls: "btn-quiet", ico: "link" }),
      btn(K, COPY.helpTonight, {
        href: `../family/?${new URLSearchParams({ ...(S.grade ? { grade: S.grade } : {}), lang: mode === "es" ? "es" : "en" })}`,
        cls: "btn-quiet",
        ico: "home",
      }),
    ),
    btn(K, COPY.helpClose, { onClick: closeHelp }),
  );
}
function closeHelp() {
  $("helpPanel").hidden = true;
  $("helpBtn").setAttribute("aria-expanded", "false");
  $("helpBtn").focus();
}

function paintRoute() {
  const nav = $("route");
  nav.setAttribute("aria-label", K.plain(COPY.mapTitle));
  nav.replaceChildren(
    ...STOPS.map((s, i) => {
      const here = S.screen === "stop" && S.stop === i;
      const b = h(
        "button",
        {
          type: "button",
          class: `rn${S.done[i] ? " is-done" : ""}${here ? " is-here" : ""}`,
          "aria-current": here ? "step" : null,
          data: { stop: String(i) },
        },
        h(
          "span",
          { class: "rn-n", "aria-hidden": "true" },
          S.done[i] ? icon("check", "rn-check") : String(i + 1),
        ),
        h("span", { class: "rn-name" }, K.plain(s.name)),
        h("span", { class: "sr-only" }, S.done[i] ? ` (${K.plain(COPY.done)})` : ""),
      );
      return b;
    }),
  );
  const done = S.done.filter(Boolean).length;
  nav.style.setProperty("--pct", `${(done / STOPS.length) * 100}%`);
  nav.setAttribute("data-done", String(done));
}

function render(focus) {
  stopSpeech();
  listening = false;
  const view = S.screen === "free" ? renderMap : S.screen === "done" ? renderDone : RENDER[S.stop];
  $("content").replaceChildren(view(ctx));
  paintChrome();
  document.body.dataset.screen = S.screen === "stop" ? STOP_IDS[S.stop] : S.screen;
  if (focus) {
    $("stop-title")?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
}

// ---- events ----------------------------------------------------------------------------------------------------
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const d = b.dataset;
  if (d.lang) {
    mode = d.lang;
    shareLang(mode);
    render(false);
    document.querySelector(`#lang [data-lang="${mode}"]`)?.focus();
  } else if (d.stop !== undefined && b.closest("#route")) ctx.go(Number(d.stop));
  else if (b.id === "helpBtn") {
    const open = $("helpPanel").hidden;
    $("helpPanel").hidden = !open;
    b.setAttribute("aria-expanded", String(open));
    if (open) $("helpPanel").querySelector("button, a")?.focus();
  } else if (d.resetCancel !== undefined) {
    $("resetBar").hidden = true;
  } else if (d.reset !== undefined) {
    const next = fresh();
    Object.keys(S).forEach((k) => delete S[k]);
    Object.assign(S, next);
    Object.keys(memory).forEach((k) => delete memory[k]);
    resumeTo = null;
    ctx.save();
    $("resetBar").hidden = true;
    render(true);
    toast(COPY.fresh);
  }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$("helpPanel").hidden) closeHelp();
  else if (e.key === "Escape" && !$("resetBar").hidden) $("resetBar").hidden = true;
});
window.addEventListener("pagehide", stopSpeech);

if (!supported()) document.documentElement.dataset.noSpeech = "";
render(false);
