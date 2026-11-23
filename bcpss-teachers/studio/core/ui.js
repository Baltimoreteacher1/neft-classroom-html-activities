// Small shared pieces for studio views: icons, chips, result cards, empty states. Markup only; no data access.
import { GRADE_LABEL, SUBJECT_PROFILE } from "../data/taxonomy.js";
import { KIND_LABELS, hrefFor } from "./catalog.js";
import { h } from "./dom.js";

const PATHS = {
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/>',
  play: '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="m10.5 9 4 3-4 3V9Z"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9-4.3-4.1 5.9-.8L12 3.5Z"/>',
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  print: '<path d="M7 9V4h10v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M7 14h10v6H7z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  up: '<path d="m6 14 6-6 6 6"/>',
  down: '<path d="m6 10 6 6 6-6"/>',
  trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  screen: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/>',
};
export function icon(name, size = 20) {
  const span = h("span", { class: "st-icon", "aria-hidden": "true" });
  span.innerHTML = `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false">${PATHS[name] || ""}</svg>`;
  return span;
}

export const gradeLabel = (g) => GRADE_LABEL[String(g)] || (g ? `Grade ${g}` : "");

export function subjectChip(id) {
  const p = SUBJECT_PROFILE[id];
  return p ? h("span", { class: "st-chip st-chip-subject", "data-subject": id }, p.short) : null;
}

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function emptyState({ title, body, actions = [] }) {
  return h(
    "div",
    { class: "st-empty" },
    h("h3", {}, title),
    body ? h("p", {}, body) : null,
    actions.length ? h("p", { class: "st-row" }, actions) : null,
  );
}

/** A manifest entry as a card. `favorite` is a prebuilt star button (see core/actions.js). */
export function resultCard(item, { favorite, onOpen, level = 3 } = {}) {
  const isActivity = item.kind === "activity";
  const link = h(
    "a",
    { class: "st-card-link", href: hrefFor(item.kind, item.id), target: isActivity ? "_blank" : null, rel: isActivity ? "noopener" : null },
    item.title,
  );
  if (onOpen) link.addEventListener("click", () => onOpen(item));
  const meta = [
    h("span", { class: "st-chip" }, KIND_LABELS[item.kind] || item.kind),
    subjectChip(item.subject),
    item.grade || item.band ? h("span", { class: "st-chip st-chip-plain" }, item.grade ? gradeLabel(item.grade) : `Grades ${item.band}`) : null,
    item.duration ? h("span", { class: "st-chip st-chip-plain" }, `${item.duration} min`) : null,
  ];
  const std = (item.standards || []).slice(0, 3);
  return h(
    "article",
    { class: "st-card st-result" },
    h(`h${level}`, { class: "st-card-title" }, link),
    h("p", { class: "st-meta" }, meta),
    item.lo ? h("p", { class: "st-lo" }, item.lo) : null,
    std.length ? h("p", { class: "st-standards" }, std.map((s) => h("code", {}, s))) : null,
    favorite || null,
  );
}
