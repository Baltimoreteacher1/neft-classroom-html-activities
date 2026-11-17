// Spelling Expedition: the mountain map. Pure SVG string from the round results, so a reload draws the same climb.
// Camp 0 is base camp; camp n is the summit. A right word plants a solid flag; a word the guide showed plants an
// outlined flag (shape, not colour, tells them apart). The climber slides up from the last camp when a word lands.
import { raw } from "../util.js";

const TOP = 24;
const FOOT = 214;
function campXY(k, n) {
  const y = 206 - (k / n) * 172;
  const hw = ((y - TOP) / (FOOT - TOP)) * 148;
  const side = k === n ? 0 : k % 2 ? 0.48 : -0.48;
  return [Math.round(160 + side * hw), Math.round(y)];
}

const flag = (x, y, solid) =>
  `<g transform="translate(${x} ${y})"><line x1="0" y1="2" x2="0" y2="-17" stroke="#17324d" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M1 -17 L14 -12.5 L1 -8 Z" fill="${solid ? "#f2c15b" : "#ffffff"}" stroke="#17324d" stroke-width="1.8" stroke-linejoin="round"${solid ? "" : ' stroke-dasharray="3 2"'}/>` +
  `<ellipse cx="0" cy="2.5" rx="6" ry="2.2" fill="#17324d" opacity=".35"/></g>`;

const climber = (fx, fy, arrived) =>
  `<g class="se-climber-in${arrived ? " is-arrived" : ""}" style="--fx:${fx}px;--fy:${fy}px">` +
  `<circle r="12" fill="#f2765a" stroke="#17324d" stroke-width="2.4"/>` +
  `<circle cx="1" cy="-5" r="3.2" fill="#fff"/>` +
  `<path d="M1 -1.5 L0 5 M0 5 L-4 9 M0 5 L4 9 M-4 1 L5 0" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>` +
  `<rect x="-6" y="-2.5" width="4" height="6" rx="1.2" fill="#17324d"/></g>`;

/**
 * results: one entry per round, "right" | "revealed" | null (not climbed yet).
 * arrived: the current round just settled, so animate the climber up from the camp below.
 */
export function mountainSVG(results, arrived, I) {
  const n = results.length;
  const reached = results.filter(Boolean).length;
  const pts = Array.from({ length: n + 1 }, (_, k) => campXY(k, n));
  const trail = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const camps = pts
    .map(([x, y], k) => {
      if (k === 0)
        return `<rect x="${x - 9}" y="${y - 4}" width="18" height="9" rx="2" fill="#f6e9cc" stroke="#17324d" stroke-width="1.8"/>`;
      const r = results[k - 1];
      if (r) return flag(x, y, r === "right");
      const next = k === reached + 1;
      return `<circle class="${next ? "se-next-camp" : ""}" cx="${x}" cy="${y}" r="${next ? 6 : 4.5}" fill="#fff" stroke="#17324d" stroke-width="${next ? 2.6 : 1.8}"/>`;
    })
    .join("");
  const [cx, cy] = pts[reached];
  const [px, py] = pts[Math.max(0, reached - 1)];
  const summit = reached === n;
  const label = I.S(
    `Mountain map: ${reached} of ${n} camps climbed.`,
    `Mapa de la montaña: ${reached} de ${n} campamentos escalados.`,
  );
  return raw(`<svg class="se-mountain-svg" viewBox="0 0 320 230" role="img" aria-label="${label}">
    <defs><linearGradient id="se-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d7eef4"/><stop offset="1" stop-color="#fbf4e2"/></linearGradient></defs>
    <rect width="320" height="230" rx="16" fill="url(#se-sky)"/>
    <circle cx="268" cy="44" r="16" fill="#f2c15b" opacity=".9"/>
    <path d="M-4 214 L70 104 L128 176 L196 92 L324 214 Z" fill="#a9d3cf"/>
    <path d="M12 214 L160 ${TOP} L308 214 Z" fill="#2f6f6b" stroke="#17324d" stroke-width="2.6" stroke-linejoin="round"/>
    <path d="M160 ${TOP} L134 60 L146 55 L154 64 L163 54 L173 62 L186 60 Z" fill="#ffffff" stroke="#17324d" stroke-width="1.6" stroke-linejoin="round"/>
    <rect x="0" y="210" width="320" height="20" fill="#7fb87a"/>
    <polyline points="${trail}" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-dasharray="1 7" stroke-linecap="round"/>
    ${camps}
    ${summit ? `<g transform="translate(160 ${TOP - 2})"><path d="M0 -14 L3.5 -5.5 L12 -5.5 L5 0 L7.5 9 L0 3.5 L-7.5 9 L-5 0 L-12 -5.5 L-3.5 -5.5 Z" fill="#f2c15b" stroke="#17324d" stroke-width="1.6" stroke-linejoin="round"/></g>` : ""}
    <g class="se-climber" transform="translate(${cx - 15} ${cy - 10})">${climber(px - cx, py - cy, arrived && reached > 0)}</g>
  </svg>`);
}
