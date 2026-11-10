// A slim "back to where you were" bar for activities opened from the introduction pages (tour, exploration, quick
// guide, featured lesson, family page, Site Guide). Links to an activity carry ?intro=<id>; the lab remembers that
// for this tab only (sessionStorage), shows one bar on activity pages, and removes it as soon as the learner is back
// on an introduction page. Browser Back always works too; this is the visible path. It never opens a new tab.
import { langMode, makeI18n } from "../i18n.js";
import { BASE, esc } from "../util.js";
import { ACTIVITIES, ACTIVITY_BY_ID, RECOMMENDED_NEXT, RECOMMENDED_NEXT_FAMILY } from "./data.js";

const KEY = "accessPracticeLab:intro-return";
const INTRO_VIEWS = new Set(["start", "practice-together", "site-guide"]);

/** Where each `intro` id returns to, and what the button says. */
export const RETURNS = {
  tour: {
    to: "/start/tour",
    en: "Back to the Teacher Tour",
    es: "Volver al recorrido para docentes",
  },
  explore: {
    to: "/start/explore",
    en: "Back to Try It. Adapt It. Use It.",
    es: "Volver a Probar, adaptar y usar",
  },
  guide: { to: "/start/guide", en: "Back to the Quick Guide", es: "Volver a la guía rápida" },
  lesson: {
    to: "/start/lesson",
    en: "Back to the Featured Lesson",
    es: "Volver a la lección destacada",
  },
  present: {
    to: "/start/present",
    en: "Back to the presenter view",
    es: "Volver a la vista de presentación",
  },
  together: {
    to: "/practice-together",
    en: "Back to Practice Together",
    es: "Volver a Practicar juntos",
  },
  siteguide: { to: "/site-guide", en: "Back to Guide", es: "Volver a la guía" },
};

/** Adds ?intro=<from> to a lab route or path so the activity can offer a way back. */
export const withReturn = (href, from) => {
  if (!RETURNS[from]) return href;
  const [path, hash = ""] = href.split("#");
  return `${path}${path.includes("?") ? "&" : "?"}intro=${from}${hash ? `#${hash}` : ""}`;
};

const read = () => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return v && RETURNS[v.from] ? v : null;
  } catch {
    return null;
  }
};
const write = (v) => {
  try {
    if (v) sessionStorage.setItem(KEY, JSON.stringify(v));
    else sessionStorage.removeItem(KEY);
  } catch {}
};

/** The curated activity whose route is the current page, or null (path and any query the route names must match). */
export function curatedHere(loc = location) {
  const path = loc.pathname.replace(BASE, "");
  const params = new URLSearchParams(loc.search);
  return (
    ACTIVITIES.find((a) => {
      const [p, q = ""] = a.route.split("?");
      return p === path && [...new URLSearchParams(q)].every(([k, v]) => params.get(k) === v);
    }) || null
  );
}

/**
 * At the very end of a curated activity opened from an introduction page: Try Again, Return, and ONE recommended next
 * activity. It is passive page content (nothing pops up, nothing blocks unfinished work) and touches no saved state.
 */
function mountNextSteps(ctx, state, I) {
  document.getElementById("introNext")?.remove();
  const here = state && !state.closed ? curatedHere() : null;
  const root = document.getElementById("app");
  if (!here || !root) return;
  const family = state.from === "together";
  const nextId = (family ? RECOMMENDED_NEXT_FAMILY : RECOMMENDED_NEXT)[here.id] || RECOMMENDED_NEXT[here.id];
  const next = ACTIVITY_BY_ID[nextId];
  const r = RETURNS[state.from];
  const returnLabel = { together: I.S("Return to Practice Together", "Volver a Practicar juntos"), siteguide: I.S("Return to Guide", "Volver a la guía") }[state.from] || "Return to My Guide";
  const hrefTry = `${BASE}${here.route}`;
  const hrefNext = withReturn(`${BASE}${next.route}`, state.from);
  const sec = document.createElement("section");
  sec.id = "introNext";
  sec.className = "in-next no-print";
  sec.setAttribute("aria-labelledby", "introNextTitle");
  sec.innerHTML = `<h2 id="introNextTitle">${esc(I.S("When you finish", "Cuando terminen"))}</h2><p class="in-next-row"><a class="btn" href="${hrefTry}">${esc(I.S("Try Again", "Intentar de nuevo"))}</a><a class="btn" href="${BASE}${r.to}">${esc(returnLabel)}</a><a class="btn btn-primary" href="${hrefNext}">${esc(I.S("Next: ", "Siguiente: "))}<span lang="en">${esc(next.name)}</span></a></p>`;
  root.append(sec);
}

/** Call after every render. Stores a new hint, clears it on introduction pages, and shows or hides the bar. */
export function mountReturnBar(ctx) {
  const hint = new URLSearchParams(location.search).get("intro");
  if (hint && RETURNS[hint]) write({ from: hint, closed: false });
  if (INTRO_VIEWS.has(ctx.route?.view)) write(null);
  const state = read();
  mountNextSteps(ctx, state, makeI18n(langMode(ctx.prefs), "en"));
  let bar = document.getElementById("introReturn");
  if (!state || state.closed) {
    bar?.remove();
    document.body.classList.remove("has-intro-return");
    return;
  }
  const I = makeI18n(langMode(ctx.prefs), "en");
  const r = RETURNS[state.from];
  if (!bar) {
    bar = document.createElement("aside");
    bar.id = "introReturn";
    bar.className = "intro-return no-print";
    document.body.append(bar);
    bar.addEventListener("click", (e) => {
      if (!e.target.closest("[data-intro-return-close]")) return;
      write({ ...read(), closed: true });
      bar.remove();
      document.body.classList.remove("has-intro-return");
    });
  }
  bar.setAttribute("aria-label", I.S("Return to the introduction", "Volver a la introducción"));
  const label = I.S(r.en, r.es);
  bar.innerHTML = `<a class="btn btn-primary" href="${BASE}${r.to}"><span aria-hidden="true">←</span> ${esc(label)}</a><button type="button" class="btn ghost" data-intro-return-close>${esc(I.S("Hide", "Ocultar"))}</button>`;
  document.body.classList.add("has-intro-return");
}
