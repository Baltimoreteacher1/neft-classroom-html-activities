// Teacher Studio shell: header, context chips, projector mode, router and the `shell` object every view receives.
import { announce } from "./core/dom.js";
import { createCatalog } from "./core/catalog.js";
import * as classes from "./core/classes.js";
import * as library from "./core/library.js";
import * as prefs from "./core/prefs.js";
import { createRouter, parseHash } from "./core/router.js";
import { GRADE_LABEL, SUBJECT_PROFILE } from "./data/taxonomy.js";

const html = document.documentElement;
const root = document.getElementById("st-main");
const projectorBtn = document.getElementById("st-projector");
const contextEl = document.getElementById("st-context");

const projector = {
  get: () => html.hasAttribute("data-projector"),
  set(on) {
    html.toggleAttribute("data-projector", Boolean(on));
    html.style.setProperty("--lab-scale", on ? "1.25" : String(prefs.getPrefs().scale));
    projectorBtn.setAttribute("aria-pressed", String(Boolean(on)));
    prefs.setPrefs({ projector: Boolean(on) });
    return Boolean(on);
  },
  toggle() {
    return projector.set(!projector.get());
  },
};

function paintContext() {
  const p = prefs.getPrefs();
  contextEl.replaceChildren();
  const add = (text) => {
    const chip = document.createElement("span");
    chip.className = "st-chip st-chip-context";
    chip.textContent = text;
    contextEl.append(chip);
  };
  if (p.grade) add(GRADE_LABEL[p.grade]);
  if (p.subject) add(SUBJECT_PROFILE[p.subject].short);
  if (p.grade || p.subject) {
    const change = document.createElement("a");
    change.className = "st-change";
    change.href = "#/find?change=1";
    change.textContent = "Change";
    change.setAttribute("aria-label", "Change grade and subject");
    contextEl.append(change);
  }
}

function paintNav() {
  const { view, key } = parseHash(location.hash);
  for (const a of document.querySelectorAll("[data-nav]")) {
    const here = a.dataset.nav === view || a.dataset.nav === key;
    if (here) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

const catalog = createCatalog();
let router;

const shell = {
  nav: (hash) => {
    location.hash = hash;
  },
  /** Update the address without navigating or re-rendering (for filters inside a view). */
  replaceHash: (hash) => history.replaceState(null, "", `${location.pathname}${location.search}${hash}`),
  prefs,
  catalog,
  classes,
  library,
  announce,
  setTitle: (t) => router.setTitle(t),
  openActivity(activityId, { tier, mode, lessonId } = {}) {
    const url = library.playUrl(activityId, { tier, lessonId, projector: mode === "projector" });
    window.open(url, "_blank", "noopener");
  },
  projector,
};

router = createRouter({ root, announce, shell });

projectorBtn.addEventListener("click", () => {
  const on = projector.toggle();
  announce(on ? "Projector view on." : "Projector view off.");
});
prefs.onPrefs(paintContext);
window.addEventListener("hashchange", paintNav);

const p = prefs.getPrefs();
html.style.setProperty("--lab-scale", String(p.scale));
projector.set(p.projector || new URLSearchParams(location.search).get("projector") === "1");
paintContext();
paintNav();
router.start();
