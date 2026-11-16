// Language Expeditions gear (feature "feel"): one cosmetic item per land, drawn on the explorer. Gear is earned by
// PRACTICE, not by being right: finishing any stop of a land (a first-try answer, a revised one or a revealed one all
// count) earns that land's item. Gear is counted, never scored. It lives in state as `s.gear` (land indexes).
import { html, raw } from "./engine.js";

/** Item names and the svg drawn over the explorer (hero viewBox 0 0 100 150), plus a crop box for the gear strip. */
export const GEAR = {
  "3-5": [
    {
      name: { en: "a brighter lantern", es: "una linterna más brillante" },
      box: "60 74 36 36",
      svg: `<circle cx="78" cy="95" r="16" fill="#f2c15b" opacity=".45"/><rect x="71" y="86" width="14" height="18" rx="4" fill="#ffe9a0"/><circle cx="78" cy="95" r="4" fill="#fff"/><path d="M78 80v-5M90 95h5M61 95h5M87 86l4-4M69 86l-4-4" stroke="#ffe9a0" stroke-width="2" stroke-linecap="round"/>`,
    },
    {
      name: { en: "a scarf", es: "una bufanda" },
      box: "26 52 44 36",
      svg: `<path d="M33 58h34v8H33z" fill="#1fa6a2"/><path d="M36 64l-5 18 9-3 2-15z" fill="#1fa6a2"/><path d="M36 61h28" stroke="#f7f4ec" stroke-width="1.5" stroke-dasharray="3 3"/>`,
    },
    {
      name: { en: "a map case", es: "un portamapas" },
      box: "14 58 56 46",
      svg: `<path d="M66 62L26 80" stroke="#5a3f2b" stroke-width="3"/><rect x="17" y="74" width="14" height="26" rx="4" fill="#8a5f3c"/><rect x="17" y="74" width="14" height="6" rx="3" fill="#5a3f2b"/><path d="M21 86h6M21 91h6" stroke="#f2c15b" stroke-width="1.5"/>`,
    },
    {
      name: { en: "a feather pen", es: "una pluma para escribir" },
      box: "16 0 30 34",
      svg: `<path d="M40 26Q34 8 20 1Q28 14 37 28Z" fill="#f7f4ec" stroke="#17324d" stroke-width="1.5"/><path d="M38 27L24 5" stroke="#17324d" stroke-width="1"/>`,
    },
  ],
  "6-8": [
    {
      name: { en: "a better antenna", es: "una antena mejor" },
      box: "68 6 24 40",
      svg: `<rect x="79.3" y="14" width="1.6" height="24" fill="#2a3a48"/><path d="M74 22h12M75.5 28h9" stroke="#2a3a48" stroke-width="1.5"/><circle cx="80" cy="12" r="3.5" fill="#1fa6a2"/><circle cx="80" cy="12" r="7" fill="#1fa6a2" opacity=".3"/>`,
    },
    {
      name: { en: "a field notebook", es: "una libreta de campo" },
      box: "20 86 26 28",
      svg: `<rect x="25" y="90" width="15" height="19" rx="2" fill="#f2c15b" stroke="#5a2f25" stroke-width="1.5"/><path d="M28 96h9M28 100h9M28 104h6" stroke="#5a2f25" stroke-width="1.2"/>`,
    },
    {
      name: { en: "a headset", es: "unos auriculares con micrófono" },
      box: "28 10 48 40",
      svg: `<path d="M36 33Q52 12 68 33" stroke="#1fa6a2" stroke-width="4" fill="none"/><rect x="32" y="30" width="7" height="12" rx="3" fill="#f2c15b" stroke="#17324d" stroke-width="1.5"/><path d="M38 41q6 7 14 5" stroke="#1fa6a2" stroke-width="2" fill="none"/><circle cx="53" cy="46" r="2.4" fill="#f2c15b"/>`,
    },
    {
      name: { en: "a compass", es: "una brújula" },
      box: "38 66 24 24",
      svg: `<path d="M44 52L50 72L56 52" stroke="#2a3a48" stroke-width="1.2" fill="none"/><circle cx="50" cy="78" r="7" fill="#f7f4ec" stroke="#c98b3a" stroke-width="2.2"/><path d="M50 72.5l2 5.5-2 5.5-2-5.5z" fill="#c94f3b"/>`,
    },
  ],
};

const bandKey = (b) => (b === "6-8" ? "6-8" : "3-5");

/** Gear markup for the explorer svg; every item is hidden until paint shows it (cached with the scene). */
export const gearSVG = (band) =>
  GEAR[bandKey(band)].map((g, k) => `<g class="lexp-gear" data-gear="${k}">${g.svg}</g>`).join("");

/** A land's gear is earned once the learner has finished a stop there (moved on from it) or stamped the land. */
const earned = (L) => L.i >= 1 || L.stamp;

/** Adds newly earned gear to s.gear (old saves have none) and returns the land indexes just added. */
export function syncGear(s) {
  if (!Array.isArray(s.gear)) s.gear = [];
  const fresh = [];
  s.lands.forEach((L, k) => {
    if (earned(L) && !s.gear.includes(k)) {
      s.gear.push(k);
      fresh.push(k);
    }
  });
  if (fresh.length) s.gear.sort();
  return fresh;
}

/** Shows the earned items on the explorer. */
export function paintGear(sceneEl, s) {
  const have = new Set(s.gear || []);
  sceneEl
    .querySelectorAll("[data-gear]")
    .forEach((n) => n.classList.toggle("is-on", have.has(Number(n.dataset.gear))));
}

const gearIcon = (g) =>
  raw(`<svg class="lexp-feel-gicon" viewBox="${g.box}" aria-hidden="true" focusable="false">${g.svg}</svg>`);

/** "New gear: …" in the walk panel, right after the first stop of a land is finished. */
export function newGearHTML(s, env) {
  const k = s.land;
  if (s.lands[k]?.i !== 1 || !(s.gear || []).includes(k)) return "";
  const g = GEAR[bandKey(env.band)][k];
  return html`<p class="lexp-feel-newgear" role="status">
    ${gearIcon(g)}
    <span
      >${env.I.T(`New gear: ${g.name.en}. You earned it by practicing.`, `Equipo nuevo: ${g.name.es}. Lo ganaste por practicar.`)}</span
    >
  </p>`;
}

/** The gear strip for the gate and the summary: what the explorer carries now. Counted, never scored. */
export function gearStripHTML(s, env) {
  const I = env.I;
  const list = GEAR[bandKey(env.band)];
  const have = (s.gear || []).filter((k) => list[k]);
  if (!have.length) return "";
  return html`<div class="lexp-feel-gearstrip">
    <p class="lexp-feel-gearhead">${I.T("Your gear", "Tu equipo")}</p>
    <ul aria-label="${I.S("Your gear", "Tu equipo")}">
      ${have.map(
        (k) =>
          html`<li>${gearIcon(list[k])}<span>${I.T(list[k].name.en, list[k].name.es)}</span></li>`,
      )}
    </ul>
    <p class="lexp-feel-gearnote">
      ${I.T("Gear comes from practicing, not from right answers.", "El equipo viene de practicar, no de acertar.")}
    </p>
  </div>`;
}
