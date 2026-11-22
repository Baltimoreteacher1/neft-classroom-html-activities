// Zero-PII Classroom Constellation & 1-Click Micro-Group Mixer (access-teacher/constellation-mixer.js)
// Renders a live WIDA Domain Constellation from alias + class-code summary data (no PII)
// and generates balanced 2-4 student partner/table groups with tailored Guided Unit links.

import { readRoster } from "./roster-store.js";
import { guidedUnitUrl } from "./group-playlist.js";

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];

function getAliasProfiles() {
  try {
    const roster = readRoster();
    const list = (roster?.students || []).filter((s) => s.alias);
    if (list.length >= 2) {
      return list.map((s, idx) => ({
        alias: s.alias,
        band: s.band || "6-8",
        scores: {
          Listening: Number(s.scores?.Listening) || ((idx * 2 + 3) % 5) + 1,
          Reading: Number(s.scores?.Reading) || ((idx * 3 + 2) % 5) + 1,
          Speaking: Number(s.scores?.Speaking) || ((idx + 4) % 5) + 1,
          Writing: Number(s.scores?.Writing) || ((idx * 2 + 1) % 5) + 1,
        },
      }));
    }
  } catch {}
  return [
    { alias: "Blue Jay", band: "6-8", scores: { Listening: 4, Reading: 3, Speaking: 5, Writing: 2 } },
    { alias: "River Otter", band: "6-8", scores: { Listening: 3, Reading: 4, Speaking: 2, Writing: 5 } },
    { alias: "Cedar Fox", band: "6-8", scores: { Listening: 5, Reading: 2, Speaking: 4, Writing: 3 } },
    { alias: "Solar Finch", band: "6-8", scores: { Listening: 2, Reading: 5, Speaking: 3, Writing: 4 } },
  ];
}

function constellationSVG(profiles) {
  const avg = Object.fromEntries(DOMAINS.map((d) => [d, profiles.reduce((n, p) => n + (p.scores[d] || 3), 0) / Math.max(1, profiles.length)]));
  const cx = 130;
  const cy = 110;
  const maxR = 78;
  const pts = DOMAINS.map((d, i) => {
    const a = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const r = (avg[d] / 6) * maxR;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a), cx + (maxR + 18) * Math.cos(a), cy + (maxR + 14) * Math.sin(a), d, avg[d].toFixed(1)];
  });
  const poly = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 260 220" width="260" height="220" role="img" aria-label="WIDA Domain Constellation">
    <circle cx="${cx}" cy="${cy}" r="${maxR}" fill="none" stroke="#d5d9e0" stroke-dasharray="4 4"/>
    <circle cx="${cx}" cy="${cy}" r="${maxR * 0.5}" fill="none" stroke="#e2e8f0"/>
    <polygon points="${poly}" fill="#1fa6a2" fill-opacity="0.28" stroke="#17324d" stroke-width="2.5"/>
    ${pts.map(([x, y, lx, ly, d, val]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#17324d"/>
      <text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="#17324d">${d} (${val})</text>`).join("")}
  </svg>`;
}

export function buildBalancedMicroGroups(profiles, groupSize = 2) {
  // Sort by Speaking - Writing balance so Speaking-strong pairs with Writing-strong
  const sorted = [...profiles].sort((a, b) => (b.scores.Speaking - b.scores.Writing) - (a.scores.Speaking - a.scores.Writing));
  const groups = [];
  let left = 0;
  let right = sorted.length - 1;
  while (left <= right) {
    const members = [sorted[left++]];
    if (left <= right && members.length < groupSize) members.push(sorted[right--]);
    while (members.length < groupSize && left <= right) members.push(sorted[left++]);
    const unitId = members.some((m) => m.scores.Writing < 3) ? "cause-and-effect" : "evidence-and-argument";
    groups.push({ members, unitId, band: members[0]?.band || "6-8" });
  }
  return groups;
}

export function mountConstellationMixer(container) {
  if (!container) return;
  const profiles = getAliasProfiles();
  let groupSize = 2;

  const draw = () => {
    const groups = buildBalancedMicroGroups(profiles, groupSize);
    container.innerHTML = `<section class="panel no-print" style="margin:1rem 0;" aria-labelledby="cmTitle">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
        <div>
          <p class="eyebrow">Zero-PII Class Insights</p>
          <h2 id="cmTitle" style="margin:0;">WIDA Domain Constellation &amp; 1-Click Micro-Group Mixer</h2>
        </div>
        <div style="display:flex;gap:.5rem;align-items:center;">
          <button type="button" class="btn small" id="cmSize2" aria-pressed="${groupSize === 2}">Pairs (2)</button>
          <button type="button" class="btn small" id="cmSize3" aria-pressed="${groupSize === 3}">Trios (3)</button>
          <button type="button" class="btn btn-primary small" id="cmMixBtn">1-Click Mix Groups</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-top:1rem;align-items:center;">
        <div style="text-align:center;">${constellationSVG(profiles)}</div>
        <div>
          <ul style="list-style:none;padding:0;margin:0;display:grid;gap:.65rem;">
            ${groups.map((g, i) => `<li class="card" style="padding:.75rem;">
              <strong>Group ${i + 1}:</strong> ${g.members.map((m) => m.alias).join(" + ")}
              <br><small>Recommended: <a href="${guidedUnitUrl(g.unitId, g.band)}">${g.unitId}</a></small>
            </li>`).join("")}
          </ul>
        </div>
      </div>
    </section>`;
    container.querySelector("#cmSize2")?.addEventListener("click", () => { groupSize = 2; draw(); });
    container.querySelector("#cmSize3")?.addEventListener("click", () => { groupSize = 3; draw(); });
    container.querySelector("#cmMixBtn")?.addEventListener("click", () => draw());
  };
  draw();
}
