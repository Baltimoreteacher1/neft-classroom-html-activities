// Shared pieces of the family pages: sub-navigation, skill metadata, the grade switch.
import { bandSwitchHTML, crumbsHTML } from "../components.js";
import { ART, BASE, DOMAIN_META, html, icon, raw } from "../util.js";

export const SKILLS = ["Listening", "Reading", "Speaking", "Writing"];

const PAGES = [
  ["", "nav.family.home", "families"],
  ["start", "nav.family.setup", "settings"],
  ["practice", "nav.family.practice", "home"],
  ["progress", "nav.family.progress", "passport"],
  ["help", "nav.family.help", "help"],
  ["save", "nav.family.save", "save"],
];

/** Family-only sub-navigation, so a caregiver never needs the full lab menu. */
export function subnavHTML(I, active, band) {
  return html`<nav class="fam-subnav no-print" aria-label="${I.LS("nav.family.label")}">
    ${PAGES.map(
      ([id, key, ic]) =>
        html`<a href="${BASE}/family${id ? `/${id}` : ""}?grades=${band}" ${id === active ? raw('aria-current="page"') : ""}>${icon(ic)}<span>${I.L(key)}</span></a>`,
    )}
  </nav>`;
}

export const crumbs = (I, title) =>
  crumbsHTML([
    [I.S("Lab", "Laboratorio"), `${BASE}/`],
    [I.S("Families", "Familias"), title ? `${BASE}/family` : null],
    ...(title ? [[title, null]] : []),
  ]);

export const gradeSwitch = (band, bands) => bandSwitchHTML(band, bands);

export const skillArt = (domain) => `${ART}/domain-${domain.toLowerCase()}.svg`;
export const skillIcon = (domain) => icon(DOMAIN_META[domain]?.icon || "star");
export const skillName = (I, domain) => I.L(`hub.skill.name.${domain}`);

/** A long date in the reader's language (English for English and bilingual modes). */
export const longDate = (I, iso) =>
  new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString(I.spanish ? "es-US" : "en-US", { month: "long", day: "numeric", year: "numeric" });
