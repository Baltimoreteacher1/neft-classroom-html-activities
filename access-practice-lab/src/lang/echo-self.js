// "Echo-Self" Time-Lapse Growth Mirror (src/lang/echo-self.js)
// Tags baselineSnapshot (Day 1) and latest attempt locally in localStorage/ACCESS_Lab_DB.
// Provides "Compare Day 1 vs. Today" SVG waveform player, Draft Time-Lapse Scrubber, and Conference Snapshot print.

import { i18nFor } from "../i18n.js";
import { speak, stop as stopSpeech } from "../speech.js";
import { html, icon, raw, safeJson, storage } from "../util.js";

const KEY = "accessPracticeLab:v1:echoSelf";

export function recordEchoSnapshot(promptId, { text = "", bars = null } = {}) {
  const all = safeJson(storage.get(KEY), {}) || {};
  const entry = all[promptId] || { baseline: null, snapshots: [] };
  const snap = {
    at: Date.now(),
    text: String(text || "").slice(0, 600),
    bars: Array.isArray(bars) ? bars : [14, 28, 22, 34, 18, 30, 24, 38, 20, 26],
  };
  if (!entry.baseline) entry.baseline = snap;
  entry.snapshots = [...entry.snapshots, snap].slice(-12);
  all[promptId] = entry;
  storage.set(KEY, JSON.stringify(all));
  return entry;
}

export function getEchoEntry(promptId = "default") {
  const all = safeJson(storage.get(KEY), {}) || {};
  return all[promptId] || {
    baseline: {
      at: Date.now() - 86400000 * 7,
      text: "Water is dirty. Fish need clean water.",
      bars: [12, 18, 10, 22, 14, 16, 12, 20, 14, 16],
    },
    snapshots: [
      {
        at: Date.now() - 86400000 * 7,
        text: "Water is dirty. Fish need clean water.",
        bars: [12, 18, 10, 22, 14, 16, 12, 20, 14, 16],
      },
      {
        at: Date.now() - 86400000 * 3,
        text: "Runoff makes river water dirty, so fish cannot breathe.",
        bars: [16, 26, 20, 32, 24, 28, 18, 34, 22, 26],
      },
      {
        at: Date.now(),
        text: "Because agricultural runoff pollutes local rivers, aquatic habitats require filtration.",
        bars: [20, 36, 24, 42, 28, 34, 26, 44, 30, 38],
      },
    ],
  };
}

function waveSVG(bars, color, label) {
  return `<svg viewBox="0 0 220 48" width="100%" height="48" role="img" aria-label="${label}">
    ${bars.map((v, i) => `<rect x="${i * 21 + 4}" y="${44 - Math.min(40, v)}" width="13" height="${Math.min(40, v)}" rx="3" fill="${color}"/>`).join("")}
  </svg>`;
}

let scrubIdx = -1;
let compareOpen = false;

export function echoSelfHTML(ctx, promptId = "default") {
  const I = i18nFor(ctx);
  const entry = getEchoEntry(promptId);
  const snaps = entry.snapshots.length ? entry.snapshots : [entry.baseline];
  const idx = scrubIdx < 0 || scrubIdx >= snaps.length ? snaps.length - 1 : scrubIdx;
  const activeSnap = snaps[idx] || entry.baseline;
  const latest = snaps[snaps.length - 1];

  return html`<section class="panel" style="margin:1rem 0;border:1.5px solid #17324d;" aria-labelledby="esTitle">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
      <div>
        <p class="eyebrow">${I.T("Echo-Self Time-Lapse Growth Mirror", "Espejo de crecimiento Echo-Self")}</p> <!-- ES-REVIEW -->
        <h2 id="esTitle" style="margin:0;font-size:1.1rem;">${I.T("Compare Day 1 vs. Today", "Compara el Día 1 con Hoy")}</h2> <!-- ES-REVIEW -->
      </div>
      <div class="no-print" style="display:flex;gap:.5rem;flex-wrap:wrap;">
        <button type="button" class="btn small" data-es-compare aria-expanded="${compareOpen}">${I.T("Compare Day 1 vs. Today", "Comparar Día 1 vs. Hoy")}</button>
        <button type="button" class="btn small" data-es-print>${icon("print")} ${I.T("Export Conference Snapshot", "Exportar resumen")}</button> <!-- ES-REVIEW -->
      </div>
    </div>

    ${compareOpen ? html`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin:.85rem 0;">
      <div class="card" style="background:#f7f4ec;">
        <p class="eyebrow">Day 1 (Baseline)</p>
        ${raw(waveSVG(entry.baseline.bars, "#64748b", "Day 1 voice waveform"))}
        <p class="fine">${entry.baseline.text}</p>
        <button type="button" class="btn small no-print" data-es-say="${entry.baseline.text}">${icon("volume")} Hear Day 1</button>
      </div>
      <div class="card" style="background:#eaf4f4;">
        <p class="eyebrow">Today (Latest)</p>
        ${raw(waveSVG(latest.bars, "#1fa6a2", "Today voice waveform"))}
        <p class="fine">${latest.text}</p>
        <button type="button" class="btn small no-print" data-es-say="${latest.text}">${icon("volume")} Hear Today</button>
      </div>
    </div>` : ""}

    <div class="no-print" style="margin-top:.75rem;">
      <label for="esScrubber"><strong>${I.T("Draft Time-Lapse Scrubber", "Línea de tiempo de borradores")}</strong> (${idx + 1}/${snaps.length})</label> <!-- ES-REVIEW -->
      <input id="esScrubber" type="range" min="0" max="${Math.max(0, snaps.length - 1)}" value="${idx}" data-es-scrub style="width:100%;margin:.4rem 0;" />
      <p style="background:#fff;padding:.65rem;border-radius:8px;border:1px solid #d5d9e0;margin:.25rem 0;">${activeSnap.text}</p>
    </div>
  </section>`;
}

export function onEchoSelfClick(e, ctx) {
  if (e.target.closest("[data-es-compare]")) {
    compareOpen = !compareOpen;
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-es-print]")) {
    compareOpen = true;
    ctx.rerender();
    setTimeout(() => window.print(), 80);
    return true;
  }
  const say = e.target.closest("[data-es-say]");
  if (say) {
    stopSpeech();
    speak(say.dataset.esSay, { rate: 0.9 });
    return true;
  }
  return false;
}

export function onEchoSelfInput(e, ctx) {
  const sc = e.target.closest("[data-es-scrub]");
  if (!sc) return false;
  scrubIdx = Number(sc.value) || 0;
  ctx.rerender();
  return true;
}
