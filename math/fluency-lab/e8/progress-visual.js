// Grade-specific progress visualisation (Enterprise 8). One data shape, five presentations:
//   garden (Grade 1), tower (2), constellation (3), checklist-bars (4-5), domain-bars (6-8).
// Rows carry a mastery state from mastery-evidence.js. Every graphic is decorative: the same information is always
// present as text (title, state label, counts), and colour is never the only signal.
import { getLang, t } from "../i18n.js";
import { STATE_LABELS } from "./mastery-evidence.js";
import { gradeSystem } from "./grade-system.js";
import { DOMAINS, domainForStrand } from "./tokens.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
const lang = () => (getLang() === "es" ? "es" : "en");

export const LEVELS = Object.freeze([
  "not-yet",
  "developing",
  "practicing",
  "demonstrated",
  "review-due",
]);
// How far each picture has grown for each state (review-due keeps most of its growth: it was shown before).
const GROWTH = [0, 1, 2, 4, 3];
export const stateLevel = (state) => Math.max(0, LEVELS.indexOf(state));
const label = (level, language) => STATE_LABELS[LEVELS[level]][language];

const flower = (g) => {
  const petals = Math.max(0, g - 1);
  const head =
    g >= 2
      ? `<g transform="translate(20 17)">${Array.from({ length: 4 + petals }, (_, i) => `<ellipse cx="0" cy="-7" rx="3.4" ry="6" transform="rotate(${(360 / (4 + petals)) * i})" fill="#e9835f"/>`).join("")}<circle r="4.4" fill="#f2c15b"/></g>`
      : g === 1
        ? `<path d="M20 30c0-6 4-9 9-9-1 6-4 9-9 9z" fill="#5aa05f"/>`
        : "";
  const stem =
    g >= 1
      ? `<path d="M20 44V${g >= 2 ? 22 : 30}" stroke="#3a7d44" stroke-width="3" stroke-linecap="round"/>`
      : "";
  return `<svg viewBox="0 0 40 48" width="44" height="52" aria-hidden="true" focusable="false"><ellipse cx="20" cy="45" rx="14" ry="3.2" fill="#9a6b3f" opacity=".55"/>${stem}${head}</svg>`;
};
const tower = (g) =>
  `<svg viewBox="0 0 40 60" width="40" height="60" aria-hidden="true" focusable="false">${Array.from({ length: g + 1 }, (_, i) => `<rect x="6" y="${50 - i * 10}" width="28" height="9" rx="2" fill="${["#f2c15b", "#e9835f", "#8dc7c3", "#5b7fc7", "#43804b"][i]}" stroke="#70400f" stroke-width="1.4"/>`).join("")}<path d="M4 54h32" stroke="#70400f" stroke-width="2"/></svg>`;
const constellation = (g) =>
  `<svg viewBox="0 0 80 28" width="96" height="34" aria-hidden="true" focusable="false"><path d="M8 20 28 8 50 18 72 6" fill="none" stroke="#43804b" stroke-width="1.6" opacity=".55"/>${[
    [8, 20],
    [28, 8],
    [50, 18],
    [72, 6],
  ]
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="4.6" fill="${i < g ? "#f2c15b" : "#fff"}" stroke="#2e5c35" stroke-width="1.8"/>`,
    )
    .join("")}</svg>`;

function item(row, kind, language) {
  const level = row.level;
  const g = GROWTH[level];
  const graphic =
    kind === "garden"
      ? flower(g)
      : kind === "tower"
        ? tower(g)
        : kind === "constellation"
          ? constellation(g)
          : "";
  const bar =
    kind === "checklist-bars"
      ? `<span class="e8pv-bar" aria-hidden="true">${Array.from({ length: 4 }, (_, i) => `<i class="${i < g ? "on" : ""}"></i>`).join("")}</span>`
      : "";
  return `<li class="e8pv-item" data-state="${LEVELS[level]}">${graphic}<span class="e8pv-title">${esc(row.title)}</span>${bar}<span class="e8pv-state e8pv-state--${LEVELS[level]}">${esc(label(level, language))}</span></li>`;
}

function domainBars(rows, language) {
  const groups = new Map(DOMAINS.map((domain) => [domain, []]));
  for (const row of rows) groups.get(domainForStrand(row.strand))?.push(row);
  return [...groups]
    .filter(([, list]) => list.length)
    .map(([domain, list]) => {
      const counts = LEVELS.map(
        (_, level) => list.filter((row) => row.level === level).length,
      );
      const segments = LEVELS.map((name, level) =>
        counts[level]
          ? `<i class="e8pv-seg e8pv-seg--${name}" style="flex:${counts[level]}" title="${esc(label(level, language))}: ${counts[level]}"></i>`
          : "",
      ).join("");
      const detail = LEVELS.map((_, level) =>
        counts[level]
          ? `${counts[level]} ${esc(label(level, language)).toLowerCase()}`
          : "",
      )
        .filter(Boolean)
        .join(", ");
      return `<li class="e8pv-domain e8pv-domain--${domain}"><span class="e8pv-domain-name">${esc(t(domain[0].toUpperCase() + domain.slice(1)))}</span><span class="e8pv-track" aria-hidden="true">${segments}</span><span class="e8pv-domain-count">${esc(t("{n} of {total} demonstrated", { n: counts[3], total: list.length }))}</span><span class="e8pv-sr">${detail}</span></li>`;
    })
    .join("");
}

// Keys passed to t() by name at render time; tools/fluency-i18n.test.mjs checks that each has Spanish.
export const PROGRESS_I18N_KEYS = Object.freeze(
  DOMAINS.map((d) => d[0].toUpperCase() + d.slice(1)),
);

// rows: [{ title, strand, state }]. State names come from mastery-evidence.js.
export function renderProgressVisual(
  grade,
  rows,
  { heading = t("Where my skills are growing") } = {},
) {
  const profile = gradeSystem(grade);
  if (!profile) return "";
  const language = lang();
  const kind = profile.progress;
  const normalized = rows.map((row) => ({
    ...row,
    level: stateLevel(row.state),
  }));
  const inner =
    kind === "domain-bars"
      ? domainBars(normalized, language)
      : normalized.map((row) => item(row, kind, language)).join("");
  const legend = `<p class="e8pv-legend">${LEVELS.map((_, level) => esc(label(level, language))).join(" → ")}</p>`;
  return `<section class="e8pv e8pv--${kind}" aria-label="${esc(heading)}" data-grade="${grade}"><h3 class="e8pv-heading">${esc(heading)}</h3><ul class="e8pv-list">${inner}</ul>${legend}</section>`;
}
