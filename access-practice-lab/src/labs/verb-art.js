// Verb Time Machine artwork: one flat-illustration scene whose picture changes with the stop on the timeline.
// Colors and motion live in language-labs-lab.css (token colors only; motion off under prefers-reduced-motion).
// The scene is decorative: the words that describe it are rendered next to it (see ASPECT_TEXT in verb-lab.js).
import { html, raw } from "../util.js";
import { ASPECT, POSITION, phaseOf } from "./verb-model.js";

const X = (t) => Math.round(40 + 640 * t);
const AXIS = 205;
const PCT = (x) => `${((x / 720) * 100).toFixed(2)}%`;

/** Five tiny action icons, drawn with strokes so they take their color from the page. */
export const ICON_DEFS = `<defs>
  <symbol id="vm-i-build" viewBox="0 0 32 32"><path d="M3 24h26M5 24v-9q11-11 22 0v9M10 24v-7M16 24v-10M22 24v-7"/></symbol>
  <symbol id="vm-i-write" viewBox="0 0 32 32"><rect x="4" y="8" width="24" height="17" rx="2"/><path d="M4 10l12 9 12-9"/></symbol>
  <symbol id="vm-i-study" viewBox="0 0 32 32"><circle cx="13" cy="13" r="7"/><path d="M18.5 18.5L27 27M3 28q3-3 6 0t6 0"/></symbol>
  <symbol id="vm-i-run" viewBox="0 0 32 32"><circle cx="20" cy="7" r="3"/><path d="M20 12l-5 6-5-1M15 18l3 6-4 4M15 18l7 2 4-4"/></symbol>
  <symbol id="vm-i-plant" viewBox="0 0 32 32"><path d="M16 28V15M16 18q-8 0-9-8 8 0 9 8M16 15q0-8 9-9 0 8-9 9M8 28h16"/></symbol>
</defs>`;

export const ICON_OF = {
  build: "build",
  write: "write",
  study: "study",
  run: "run",
  plant: "plant",
};
export const iconUse = (base, cls = "vm-ico") =>
  raw(
    `<svg class="${cls}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="#vm-i-${ICON_OF[base] || "study"}"/></svg>`,
  );

const badge = (x, y, base, r = 24) =>
  `<circle class="vm-badge" cx="${x}" cy="${y}" r="${r}"/><use class="vm-i" href="#vm-i-${ICON_OF[base] || "study"}" x="${x - 14}" y="${y - 14}" width="28" height="28"/>`;
const arrowHead = (x, y, dir = 1) =>
  `<path class="vm-head" d="M${x} ${y} l${-12 * dir} -6 0 12z"/>`;

/** Every stop's glyph is in the DOM; CSS shows the one for data-tense. */
function glyphs(base) {
  const g = (tense, inner) => `<g class="vm-ev vm-ev-${tense}">${inner}</g>`;
  return [
    g(
      "past",
      `<line class="vm-stem" x1="${X(0.27)}" y1="166" x2="${X(0.27)}" y2="${AXIS}"/>${badge(X(0.27), 142, base)}<circle class="vm-done" cx="${X(0.27) + 20}" cy="122" r="9"/><path class="vm-tick" d="M${X(0.27) + 15} 122l4 4 7-8"/>`,
    ),
    g(
      "past-perfect",
      `<line class="vm-stem" x1="${X(0.12)}" y1="166" x2="${X(0.12)}" y2="${AXIS}"/>${badge(X(0.12), 142, base)}<line class="vm-stem is-ref" x1="${X(0.33)}" y1="118" x2="${X(0.33)}" y2="${AXIS}"/><path class="vm-flag" d="M${X(0.33)} 118l26 9-26 9z"/><path class="vm-arrow" d="M${X(0.12) + 26} 128Q${X(0.23)} 94 ${X(0.33) - 12} 112"/>${arrowHead(X(0.33) - 8, 114)}`,
    ),
    g(
      "past-progressive",
      `<rect class="vm-bar" x="${X(0.3)}" y="134" width="${X(0.44) - X(0.3)}" height="16" rx="8"/><line class="vm-stem is-ref" x1="${X(0.37)}" y1="96" x2="${X(0.37)}" y2="${AXIS}"/>${badge(X(0.37), 142, base)}`,
    ),
    g(
      "present-perfect",
      `<rect class="vm-bar" x="${X(0.18)}" y="134" width="${X(0.5) - X(0.18)}" height="16" rx="8"/><circle class="vm-dot" cx="${X(0.18)}" cy="142" r="6"/>${badge(X(0.5) - 36, 142, base)}${arrowHead(X(0.5) + 4, 142)}`,
    ),
    g(
      "present",
      `<path class="vm-loop" d="M${X(0.5) - 38} 134a38 38 0 1 1 20 36"/>${arrowHead(X(0.5) - 17, 172, -1)}${badge(X(0.5), 142, base)}${[0.3, 0.4, 0.6, 0.7].map((t) => `<circle class="vm-dot" cx="${X(t)}" cy="${AXIS - 12}" r="6"/>`).join("")}`,
    ),
    g(
      "present-progressive",
      `<circle class="vm-pulse" cx="${X(0.5)}" cy="142" r="36"/><rect class="vm-bar" x="${X(0.44)}" y="134" width="${X(0.56) - X(0.44)}" height="16" rx="8"/>${badge(X(0.5), 142, base)}`,
    ),
    g(
      "future",
      `<line class="vm-stem is-plan" x1="${X(0.8)}" y1="166" x2="${X(0.8)}" y2="${AXIS}"/><g class="vm-plan">${badge(X(0.8), 142, base)}</g><path class="vm-arrow is-plan" d="M${X(0.5) + 14} 106Q${X(0.65)} 62 ${X(0.8) - 26} 112"/>${arrowHead(X(0.8) - 22, 114)}`,
    ),
  ].join("");
}

/** The scene for a stop. `data-tense` and the --px/--sx/--sy/--hand variables are what paint() updates in place. */
export function sceneHTML(I, v, tense) {
  const tags = [
    ["past-perfect", 0.12, I.S("first", "primero")],
    ["past-perfect", 0.33, "storm started"],
    ["past-progressive", 0.37, "8:00"],
    ["present-perfect", 0.18, "Sept."],
  ];
  return html`<div
    class="vm-scene-wrap"
    data-vm-scene
    data-tense="${tense}"
    data-phase="${phaseOf(tense)}"
    data-aspect="${ASPECT[tense]}"
    style="${sceneVars(tense)}"
  >
    <div class="vm-scene">
      <div class="vm-sky vm-sky-past"></div>
      <div class="vm-sky vm-sky-now"></div>
      <div class="vm-sky vm-sky-future"></div>
      <div class="vm-art">
        <svg class="vm-svg" viewBox="0 0 720 250" aria-hidden="true" focusable="false">
          ${raw(ICON_DEFS)}
          <circle class="vm-sun" cx="0" cy="0" r="20" />
          <path class="vm-hill is-far" d="M0 190Q120 130 250 175T500 160T720 180V250H0z" />
          <path class="vm-hill" d="M0 210Q150 160 300 200T720 195V250H0z" />
          <rect class="vm-ground" x="0" y="${AXIS}" width="720" height="45" />
          <line class="vm-now-line" x1="${X(0.5)}" y1="34" x2="${X(0.5)}" y2="${AXIS}" />
          <line class="vm-axis" x1="28" y1="${AXIS}" x2="692" y2="${AXIS}" />
          <path class="vm-head is-axis" d="M696 ${AXIS}l-14 -7 0 14z" />
          ${raw([0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9].map((t) => `<line class="vm-axis-tick" x1="${X(t)}" y1="${AXIS - 5}" x2="${X(t)}" y2="${AXIS + 5}"/>`).join(""))}
          ${raw(glyphs(v.base))}
          <g class="vm-pod">
            <g class="vm-pod-in">
              <circle class="vm-pod-body" cx="0" cy="${AXIS + 2}" r="19" />
              <circle class="vm-pod-face" cx="0" cy="${AXIS + 2}" r="14" />
              <g class="vm-hand-h"><line x1="0" y1="${AXIS + 2}" x2="0" y2="${AXIS - 6}" /></g>
              <line class="vm-hand-m" x1="0" y1="${AXIS + 2}" x2="7" y2="${AXIS + 2}" />
            </g>
          </g>
        </svg>
        <span class="vm-lab vm-lab-past">${I.T("PAST", "PASADO")}</span>
        <span class="vm-lab vm-lab-now">${I.T("NOW", "AHORA")}</span>
        <span class="vm-lab vm-lab-future">${I.T("FUTURE", "FUTURO")}</span>
        ${tags.map(([for_, t, text]) => html`<span class="vm-tag" data-for="${for_}" style="left:${PCT(X(t))}" lang="en">${text}</span>`)}
      </div>
    </div>
  </div>`;
}

export function sceneVars(tense) {
  const p = POSITION[tense];
  const sx = Math.round(40 + 640 * p.at);
  const sy = Math.round(78 - Math.sin(Math.PI * p.at) * 34);
  return `--px:${X(p.at)}px;--sx:${sx}px;--sy:${sy}px;--hand:${p.hour * 30}deg`;
}
