// Grade-specific progress visualisation (Enterprise 8). One data shape, five presentations:
//   garden (Grade 1), tower (2), constellation (3), checklist-bars (4-5), domain-bars (6-8).
// Every graphic is decorative; the same information is always present as text (title, state label, counts).
import { DOMAINS, domainForStrand } from "./tokens.js";
import { t } from "../i18n.js";
import { gradeSystem } from "./grade-system.js";

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char],
  );

// Five levels, shared by every presentation: 0 not yet assessed ... 4 retained or review-ready.
export const LEVELS = Object.freeze([
  "not-yet",
  "exploring",
  "developing",
  "practicing",
  "demonstrated",
]);

const LEVEL_BY_STAGE = {
  "Not checked": 0,
  "Not Yet Assessed": 0,
  Exploring: 1,
  Developing: 2,
  Practicing: 3,
  Proficient: 4,
  Demonstrated: 4,
  Retained: 4,
};
export const stageLevel = (stage) => LEVEL_BY_STAGE[stage] ?? 0;

const flower = (level) => {
  const petals = Math.max(0, level - 1);
  const head =
    level >= 2
      ? `<g transform="translate(20 17)">${Array.from({ length: 4 + petals }, (_, i) => `<ellipse cx="0" cy="-7" rx="3.4" ry="6" transform="rotate(${(360 / (4 + petals)) * i})" fill="#e9835f"/>`).join("")}<circle r="4.4" fill="#f2c15b"/></g>`
      : level === 1
        ? `<path d="M20 30c0-6 4-9 9-9-1 6-4 9-9 9z" fill="#5aa05f"/>`
        : "";
  const stem =
    level >= 1
      ? `<path d="M20 44V${level >= 2 ? 22 : 30}" stroke="#3a7d44" stroke-width="3" stroke-linecap="round"/>`
      : "";
  return `<svg viewBox="0 0 40 48" width="44" height="52" aria-hidden="true" focusable="false"><ellipse cx="20" cy="45" rx="14" ry="3.2" fill="#9a6b3f" opacity=".55"/>${stem}${head}</svg>`;
};
const tower = (level) =>
  `<svg viewBox="0 0 40 60" width="40" height="60" aria-hidden="true" focusable="false">${Array.from({ length: level + 1 }, (_, i) => `<rect x="6" y="${50 - i * 10}" width="28" height="9" rx="2" fill="${["#f2c15b", "#e9835f", "#8dc7c3", "#5b7fc7", "#43804b"][i]}" stroke="#70400f" stroke-width="1.4"/>`).join("")}<path d="M4 54h32" stroke="#70400f" stroke-width="2"/></svg>`;
const constellation = (level) =>
  `<svg viewBox="0 0 80 28" width="96" height="34" aria-hidden="true" focusable="false"><path d="M8 20 28 8 50 18 72 6" fill="none" stroke="#43804b" stroke-width="1.6" opacity=".55"/>${[
    [8, 20],
    [28, 8],
    [50, 18],
    [72, 6],
  ]
    .map(
      ([x, y], i) =>
        `<circle cx="${x}" cy="${y}" r="4.6" fill="${i < level ? "#f2c15b" : "#fff"}" stroke="#2e5c35" stroke-width="1.8"/>`,
    )
    .join("")}</svg>`;

const LEVEL_NAMES = ["Not yet", "Exploring", "Developing", "Practicing", "Demonstrated"];
const domainName = (domain) => domain[0].toUpperCase() + domain.slice(1);
// Keys passed to t() by name at render time; tools/fluency-i18n.test.mjs checks that each has Spanish.
export const PROGRESS_I18N_KEYS = Object.freeze([...LEVEL_NAMES, ...DOMAINS.map(domainName)]);
const label = (labels, level) => labels?.[level] || t(LEVEL_NAMES[level]);

function item(row, kind, labels) {
  const level = row.level;
  const graphic =
    kind === "garden"
      ? flower(level)
      : kind === "tower"
        ? tower(level)
        : kind === "constellation"
          ? constellation(level)
          : "";
  const bar =
    kind === "checklist-bars"
      ? `<span class="e8pv-bar" aria-hidden="true">${Array.from({ length: 4 }, (_, i) => `<i class="${i < level ? "on" : ""}"></i>`).join("")}</span>`
      : "";
  return `<li class="e8pv-item" data-level="${level}">${graphic}<span class="e8pv-title">${esc(row.title)}</span>${bar}<span class="e8pv-state e8pv-state--${LEVELS[level]}">${esc(label(labels, level))}</span></li>`;
}

function domainBars(rows, labels) {
  const groups = new Map(DOMAINS.map((domain) => [domain, []]));
  for (const row of rows) groups.get(domainForStrand(row.strand))?.push(row);
  return [...groups]
    .filter(([, list]) => list.length)
    .map(([domain, list]) => {
      const counts = LEVELS.map((_, level) => list.filter((row) => row.level === level).length);
      const done = counts[4];
      const segments = LEVELS.map((name, level) =>
        counts[level]
          ? `<i class="e8pv-seg e8pv-seg--${name}" style="flex:${counts[level]}" title="${esc(label(labels, level))}: ${counts[level]}"></i>`
          : "",
      ).join("");
      const detail = LEVELS.map((_, level) =>
        counts[level] ? `${counts[level]} ${esc(label(labels, level)).toLowerCase()}` : "",
      )
        .filter(Boolean)
        .join(", ");
      return `<li class="e8pv-domain e8pv-domain--${domain}"><span class="e8pv-domain-name">${esc(t(domainName(domain)))}</span><span class="e8pv-track" aria-hidden="true">${segments}</span><span class="e8pv-domain-count">${esc(t("{n} of {total} demonstrated", { n: done, total: list.length }))}</span><span class="e8pv-sr">${detail}</span></li>`;
    })
    .join("");
}

// rows: [{ title, strand, stage? , level? }]. labels: optional array of five learner-facing state names.
export function renderProgressVisual(
  grade,
  rows,
  { labels, heading = t("Where my skills are growing") } = {},
) {
  const profile = gradeSystem(grade);
  if (!profile) return "";
  const kind = profile.progress;
  const normalized = rows.map((row) => ({
    ...row,
    level: Number.isInteger(row.level) ? row.level : stageLevel(row.stage),
  }));
  const inner =
    kind === "domain-bars"
      ? domainBars(normalized, labels)
      : normalized.map((row) => item(row, kind, labels)).join("");
  const tag = `<h3 class="e8pv-heading">${esc(heading)}</h3>`;
  const legend = `<p class="e8pv-legend">${LEVELS.map((_, level) => esc(label(labels, level))).join(" → ")}</p>`;
  return `<section class="e8pv e8pv--${kind}" aria-label="${esc(heading)}" data-grade="${grade}">${tag}<ul class="e8pv-list">${inner}</ul>${legend}</section>`;
}
