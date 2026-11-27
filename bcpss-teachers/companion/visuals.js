// Plan & Respond — diagrams drawn from the unit's own data. Every function is pure and returns markup. Each SVG has a
// role="img" and a plain-language aria-label that states what it shows, and meaning never rests on colour alone.

import { esc } from "./util.js";

const DOMAIN_ICON = {
  Listening: "👂",
  Speaking: "🗣️",
  Reading: "📖",
  Writing: "✏️",
  Vocabulary: "🔤",
  Game: "🎮",
};
export const domainIcon = (d) => DOMAIN_ICON[d] || "⭐";

const clip = (s, n) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : String(s));

/** Counts and minutes of this unit's activities by language domain. */
export function activityStats(detail) {
  const by = new Map();
  for (const a of detail.studio?.activities || []) {
    const row = by.get(a.domain) || { domain: a.domain, count: 0, minutes: 0 };
    row.count += 1;
    row.minutes += Number(a.minutes) || 0;
    by.set(a.domain, row);
  }
  return [...by.values()].sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}

/** Horizontal bars: how many activities the unit has in each domain. */
export function activityBars(detail) {
  const rows = activityStats(detail);
  if (!rows.length) return "";
  const max = Math.max(...rows.map((r) => r.count));
  const h = 30;
  const bars = rows
    .map((r, i) => {
      const w = Math.max(8, Math.round((r.count / max) * 300));
      return `<g transform="translate(0 ${i * h})"><text x="0" y="19" class="cp-svg-t">${esc(r.domain)}</text><rect x="110" y="4" width="${w}" height="20" rx="4" class="cp-svg-bar"/><text x="${118 + w}" y="19" class="cp-svg-t cp-svg-b">${r.count} · ${r.minutes} min</text></g>`;
    })
    .join("");
  const label = `Activities in this unit by domain: ${rows.map((r) => `${r.domain} ${r.count}`).join(", ")}.`;
  return `<svg class="cp-svg" viewBox="0 0 560 ${rows.length * h + 4}" role="img" aria-label="${esc(label)}">${bars}</svg>`;
}

/** The Frayer lines: four spokes from the word out to its four quadrants. Decorative. */
export const frayerLines = () =>
  `<svg class="cp-frayer-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">${[
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ]
    .map(([x, y], i) => `<line x1="50" y1="50" x2="${x}" y2="${y}" style="--i:${i + 1}"/>`)
    .join("")}</svg>`;

/** A ring of stations with group tokens for one round of the rotation. */
export function rotationSvg(plan, round = 0) {
  const n = plan.stations.length;
  const cx = 190;
  const cy = 140;
  const r = 100;
  const at = (i) => {
    const a = (-90 + (360 / n) * i) * (Math.PI / 180);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" class="cp-svg-ring"/>`;
  const stations = plan.stations
    .map((s, i) => {
      const [x, y] = at(i);
      return `<g><rect x="${x - 46}" y="${y - 16}" width="92" height="32" rx="8" class="cp-svg-node"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="cp-svg-t cp-svg-b">${esc(s.domain)}</text></g>`;
    })
    .join("");
  const tokens = plan.rounds[round].cells
    .map((station, g) => {
      const [x, y] = at(station);
      return `<g><circle cx="${x + 38}" cy="${y - 22}" r="13" class="cp-svg-token"/><text x="${x + 38}" y="${y - 17}" text-anchor="middle" class="cp-svg-t cp-svg-tok">${plan.groups[g]}</text></g>`;
    })
    .join("");
  const arrow = `<path d="M ${cx + 16} ${cy - 8} A 22 22 0 1 1 ${cx - 6} ${cy - 20}" fill="none" class="cp-svg-arrow" marker-end="url(#cp-arr)"/><text x="${cx}" y="${cy + 46}" text-anchor="middle" class="cp-svg-t">Round ${round + 1}</text>`;
  const label = `Round ${round + 1} of ${n}. ${plan.rounds[round].cells.map((st, g) => `Group ${plan.groups[g]} is at the ${plan.stations[st].domain} station`).join(". ")}.`;
  return `<svg class="cp-svg cp-svg--ring" viewBox="0 0 380 290" role="img" aria-label="${esc(label)}"><defs><marker id="cp-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="cp-svg-arrowhead"/></marker></defs>${ring}${arrow}${stations}${tokens}</svg>`;
}

/** Two overlapping circles: each unit's own key words, and the words the two units share. */
export function vennData(a, b) {
  const lower = (v) => v.term.toLowerCase();
  const bSet = new Set(b.studio.vocab.map(lower));
  const aSet = new Set(a.studio.vocab.map(lower));
  return {
    left: a.studio.vocab.filter((v) => !bSet.has(lower(v))).map((v) => v.term),
    right: b.studio.vocab.filter((v) => !aSet.has(lower(v))).map((v) => v.term),
    both: a.studio.vocab.filter((v) => bSet.has(lower(v))).map((v) => v.term),
  };
}

/** Split a long term over two lines at the space nearest its middle. Short terms stay on one line. */
function wrapTerm(term, max = 13) {
  const t = String(term);
  if (t.length <= max || !t.includes(" ")) return [clip(t, max + 2)];
  const mid = t.length / 2;
  let best = -1;
  for (let k = 0; k < t.length; k++) if (t[k] === " " && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k;
  return [clip(t.slice(0, best), max + 2), clip(t.slice(best + 1), max + 2)];
}

/** Words stacked and centred on x, starting at y. At most four terms so they stay inside their region. */
function wordColumn(words, x, y0, cls = "") {
  let y = y0;
  return words
    .slice(0, 4)
    .map((w) => {
      const lines = wrapTerm(w);
      const out = lines
        .map((ln, k) => `<text x="${x}" y="${y + k * 15}" text-anchor="middle" class="cp-svg-t ${cls}">${esc(ln)}</text>`)
        .join("");
      y += lines.length * 15 + 9;
      return out;
    })
    .join("");
}

export function vennSvg(a, b, connection = "") {
  const d = vennData(a, b);
  const mid = d.both.length
    ? wordColumn(d.both, 280, 108, "cp-svg-b")
    : `<text x="280" y="122" text-anchor="middle" class="cp-svg-t">${esc(clip(connection || "your idea", 12))}</text><text x="280" y="140" text-anchor="middle" class="cp-svg-t cp-svg-m">the link</text>`;
  const label = `Venn diagram. ${a.unit.unit_title} has ${d.left.length} words of its own. ${b.unit.unit_title} has ${d.right.length}. ${d.both.length ? `They share ${d.both.join(", ")}.` : "They share no vocabulary words, so the connection is an idea to build."}`;
  return `<svg class="cp-svg cp-svg--venn" viewBox="0 0 560 250" role="img" aria-label="${esc(label)}"><circle cx="210" cy="125" r="104" class="cp-svg-venn cp-svg-venn--a"/><circle cx="350" cy="125" r="104" class="cp-svg-venn cp-svg-venn--b"/>
    <text x="172" y="20" text-anchor="middle" class="cp-svg-t cp-svg-b">${esc(a.unit.subject)}</text><text x="388" y="20" text-anchor="middle" class="cp-svg-t cp-svg-b">${esc(b.unit.subject)}</text>
    ${wordColumn(d.left, 172, 92)}${wordColumn(d.right, 388, 92)}${mid}</svg>
    <p class="cp-muted cp-venn-cap"><b>${esc(a.unit.subject)}:</b> ${esc(a.unit.unit_title)} · <b>${esc(b.unit.subject)}:</b> ${esc(b.unit.unit_title)}${d.both.length ? "" : `<br>These units share no vocabulary words. Build the connection with a sentence.`}</p>`;
}

/** One small square per sentence: where you are, and which sentence holds the evidence. */
export function sentenceStrip(total, now, evidenceAt) {
  const dots = Array.from({ length: total }, (_, i) => {
    const cls = `cp-dot${i === now ? " cp-dot--now" : ""}${i === evidenceAt ? " cp-dot--ev" : ""}`;
    return `<span class="${cls}">${i + 1}</span>`;
  }).join("");
  const note = [
    now >= 0 ? `Reading sentence ${now + 1} of ${total}.` : `${total} sentences.`,
    evidenceAt >= 0 ? `The evidence is in sentence ${evidenceAt + 1}.` : "",
  ].join(" ");
  return `<div class="cp-strip" role="img" aria-label="${esc(note)}">${dots}</div>`;
}

/** Because -> event -> so, as three boxes joined by arrows. Unknown parts show a question mark. */
export function chainFlow({ because, event, so }) {
  const node = (label, text) =>
    `<div class="cp-chain-node"><small>${label}</small><b>${text ? esc(text) : "?"}</b></div>`;
  return `<div class="cp-chain" role="group" aria-label="Cause and effect chain">${node("Why", because)}<span class="cp-chain-arrow" aria-hidden="true">→</span>${node("What happened", event)}<span class="cp-chain-arrow" aria-hidden="true">→</span>${node("Result", so)}</div>`;
}
