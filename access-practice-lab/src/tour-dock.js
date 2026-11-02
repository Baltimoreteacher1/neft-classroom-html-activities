// Family Expedition guide panel. Families start the tour at /access-family-tour/ and open a stop in the lab with
// ?tour=<stop>. This panel then stays with them while they browse: the stop's steps, every other stop to jump to,
// and a way back to the tour. It loads only when that parameter (or the tab's saved stop) is present, so ordinary
// visits never fetch it. The stop table is shared with the tour page: /access-family-tour/stops.js.

import { ICONS } from "./util.js";

const FLAG = "ewl-tour-dock";
const OPEN = "ewl-tour-dock-open";
const WIDE = "(min-width: 1100px)";
const checkIcon = `<svg class="ico" aria-hidden="true" focusable="false" width="14" height="14"><use href="${ICONS}#check"></use></svg>`;

const COPY = {
  kicker: ["Family Expedition", "Expedición familiar"],
  heading: ["Your guide", "Su guía"],
  allStops: ["All stops", "Todas las paradas"],
  back: ["Back to the tour", "Volver al recorrido"],
  next: ["I know this one. Next stop", "Ya lo conozco. Siguiente parada"],
  finish: ["I know this one. Finish", "Ya lo conozco. Terminar"],
  show: ["Show guide", "Mostrar guía"],
  hide: ["Hide guide", "Ocultar guía"],
  close: ["Close guide", "Cerrar guía"],
  tip: ["Good to know", "Es bueno saber"],
  done: ["done", "hecha"],
};

const CSS = `
.tour-dock{position:fixed;z-index:35;display:flex;flex-direction:column;background:#fff;color:var(--ink,#163247);
  border:1px solid var(--line,#c2d2df);border-top:4px solid var(--td-accent,#234cda);font-size:.95rem;line-height:1.45}
.tour-dock .es{display:block;color:var(--ink-2,#496477);font-size:.92em}
.tour-dock h2,.tour-dock p,.tour-dock ol{margin:0}
.td-head{display:flex;align-items:center;gap:.4rem;padding:.55rem .75rem;border-bottom:1px solid var(--line,#c2d2df)}
.td-kick{flex:1;min-width:0;font-weight:700;font-size:.85rem;color:var(--td-accent,#234cda)}
.td-kick small{display:block;font-weight:600;color:var(--ink-2,#496477)}
.td-body{overflow:auto;padding:.75rem;display:grid;gap:.75rem}
.td-body h2{font-size:1.15rem;line-height:1.25}
.td-steps{padding-left:1.2rem;display:grid;gap:.35rem}
.td-tip{background:var(--td-tint,#e9efff);border-radius:.6rem;padding:.55rem .7rem}
.td-stops{list-style:none;padding:0;display:grid;gap:.3rem}
.td-stops button{width:100%;text-align:left;min-height:2.5rem;padding:.35rem .6rem;border:1.5px solid var(--line,#c2d2df);
  border-radius:.6rem;background:#fff;color:inherit;font:inherit;font-weight:600;cursor:pointer;display:flex;gap:.5rem;align-items:center}
.td-stops button[aria-current="step"]{border-color:var(--td-accent,#234cda);background:var(--td-tint,#e9efff)}
.td-stops .td-n{flex:none;width:1.5rem;height:1.5rem;border-radius:50%;display:grid;place-items:center;font-size:.8rem;
  background:var(--line,#c2d2df);color:var(--ink,#163247)}
.td-stops .is-done .td-n{background:var(--td-accent,#234cda);color:#fff}
.td-actions{display:grid;gap:.4rem;padding:.6rem .75rem;border-top:1px solid var(--line,#c2d2df)}
.td-btn,.td-icon{font:inherit;font-weight:700;border-radius:999px;border:2px solid var(--ink,#163247);background:#fff;color:var(--ink,#163247);
  min-height:2.75rem;padding:.3rem .9rem;cursor:pointer;text-align:center;text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
.td-btn.primary{background:var(--ink,#163247);color:#fff}
.td-icon{min-width:2.75rem;padding:.3rem .6rem;gap:.35rem}
.td-toggle-label{display:none}
.tour-dock :focus-visible{outline:3px solid #1a56db;outline-offset:2px}
.tour-dock[data-open="false"] .td-body{display:none}
.tour-dock[data-open="false"] .td-actions .td-btn.primary{display:none}
@media (min-width:1100px){
  .tour-dock{top:var(--td-top,4.5rem);right:0;bottom:0;width:21rem;border-width:4px 0 0 1px;box-shadow:-4px 0 16px rgb(0 0 0/6%)}
  .tour-dock[data-open="false"]{bottom:auto}
  .td-body{flex:1}
  body.has-tour-dock .lab-main{padding-right:calc(21rem + clamp(1rem,3vw,2rem))}
  body.has-tour-dock .lab-footer{padding-right:calc(21rem + var(--gutter,2rem))}
  body.has-tour-dock .lang-banner{padding-right:21rem}
}
@media (max-width:1099.98px){
  .tour-dock{left:0;right:0;bottom:0;max-height:72vh;border-radius:1rem 1rem 0 0;box-shadow:0 -6px 20px rgb(0 0 0/14%)}
  .td-actions{grid-template-columns:1fr 1fr}
  .td-toggle-label{display:inline;font-size:.85rem}
  .tour-dock[data-open="false"] .td-actions{grid-template-columns:1fr}
}
body:has(.test-view.is-running) .tour-dock{display:none}
@media print{.tour-dock{display:none}}
`;

const store = {
  get(k) {
    try {
      return sessionStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem(k, v);
    } catch {}
  },
  drop(k) {
    try {
      sessionStorage.removeItem(k);
    } catch {}
  },
};

/** The stop to show: ?tour=<n> on arrival, else the one this tab already has. -1 means "no guide". */
function currentStop(total) {
  const asked = new URLSearchParams(location.search).get("tour");
  const raw = asked ?? store.get(FLAG);
  const n = raw === null || raw === "" ? Number.NaN : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n >= total) return -1;
  store.set(FLAG, String(n));
  return n;
}

export async function mountTourDock() {
  const tour = await import("/access-family-tour/stops.js");
  const { STOPS, TOTAL, TOUR_PATH, esc, loadState, saveState, stopUrl, tr, trText } = tour;
  let n = currentStop(TOTAL);
  if (n < 0 || document.querySelector(".tour-dock")) return;

  const grades = new URLSearchParams(location.search).get("grades");
  const saved = loadState() || {
    lang: "",
    band: grades === "6-8" ? "6-8" : "3-5",
    stop: n,
    done: [],
    view: "stop",
  };
  const labLang = (() => {
    try {
      return JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs") || "{}").lang;
    } catch {
      return "";
    }
  })();
  const lang = saved.lang || labLang || "en";
  const T = (pair) => tr(lang, pair);
  const S = (pair) => trText(lang, pair);

  const style = document.createElement("style");
  style.textContent = CSS;
  document.head.append(style);

  const dock = document.createElement("aside");
  dock.className = "tour-dock no-print";
  document.body.append(dock);
  document.body.classList.add("has-tour-dock");

  const isOpen = () => {
    const v = store.get(OPEN);
    return v === null ? matchMedia("(min-width: 700px)").matches : v === "1";
  };

  const go = (i, patch = {}) => {
    saveState({ ...saved, ...patch, stop: i, view: patch.view || "stop" });
    location.href = i < 0 ? TOUR_PATH : stopUrl(i, saved.band);
  };

  function render() {
    const s = STOPS[n];
    const open = isOpen();
    dock.dataset.open = String(open);
    dock.style.setProperty("--td-accent", s.color);
    dock.style.setProperty("--td-tint", s.tint);
    dock.setAttribute("aria-label", S(COPY.kicker));
    const last = n === TOTAL - 1;
    dock.innerHTML = `<div class="td-head">
  <div class="td-kick">${T(COPY.kicker)}<small>${esc(S([`Stop ${n + 1} of ${TOTAL}`, `Parada ${n + 1} de ${TOTAL}`]))}: ${esc(S(s.name))}</small></div>
  <button type="button" class="td-icon" data-td="toggle" aria-expanded="${open}" aria-label="${esc(S(open ? COPY.hide : COPY.show))}"><span aria-hidden="true">${open ? "▾" : "▴"}</span><span class="td-toggle-label">${esc(S(open ? COPY.hide : COPY.show))}</span></button>
  <button type="button" class="td-icon" data-td="close" aria-label="${esc(S(COPY.close))}">×</button>
</div>
<div class="td-body">
  <h2>${T(s.title)}</h2>
  <p>${T(s.what)}</p>
  <ol class="td-steps">${s.steps.map((step) => `<li>${T(step)}</li>`).join("")}</ol>
  <p class="td-tip"><strong>${T(COPY.tip)}</strong><br>${T(s.tip)}</p>
  <h2>${T(COPY.allStops)}</h2>
  <ol class="td-stops">${STOPS.map(
    (st, i) =>
      `<li><button type="button" data-td-stop="${i}" class="${saved.done.includes(i) ? "is-done" : ""}" ${i === n ? 'aria-current="step"' : ""}><span class="td-n" aria-hidden="true">${saved.done.includes(i) ? checkIcon : i + 1}</span><span>${T(st.name)}${saved.done.includes(i) ? `<span class="visually-hidden"> (${esc(S(COPY.done))})</span>` : ""}</span></button></li>`,
  ).join("")}</ol>
</div>
<div class="td-actions">
  <a class="td-btn" href="${TOUR_PATH}" data-td="back">${T(COPY.back)}</a>
  <button type="button" class="td-btn primary" data-td="next">${T(last ? COPY.finish : COPY.next)}</button>
</div>`;
    place();
  }

  // Keep the page clear of the panel: below the sticky header on wide screens, above the bottom sheet otherwise.
  function place() {
    const wide = matchMedia(WIDE).matches;
    const header = document.querySelector(".lab-top");
    dock.style.setProperty("--td-top", `${header ? header.getBoundingClientRect().bottom : 72}px`);
    document.body.style.paddingBottom = wide ? "" : `${dock.offsetHeight}px`;
  }

  dock.addEventListener("click", (e) => {
    const el = e.target.closest("[data-td],[data-td-stop]");
    if (!el) return;
    if (el.dataset.tdStop !== undefined) {
      go(Number(el.dataset.tdStop));
      return;
    }
    const act = el.dataset.td;
    if (act === "toggle") {
      store.set(OPEN, isOpen() ? "0" : "1");
      render();
      dock.querySelector('[data-td="toggle"]')?.focus();
    } else if (act === "close") {
      store.drop(FLAG);
      store.drop(OPEN);
      dock.remove();
      style.remove();
      document.body.classList.remove("has-tour-dock");
      document.body.style.paddingBottom = "";
    } else if (act === "back") {
      saveState({ ...saved, stop: n, view: "stop" });
    } else if (act === "next") {
      const done = [...new Set([...saved.done, n])];
      if (n === TOTAL - 1) go(-1, { done, view: "end" });
      else go(n + 1, { done });
    }
  });

  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, { passive: true });
  render();
}
