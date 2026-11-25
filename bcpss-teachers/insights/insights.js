// BCPSS Beta Usage dashboard (read-only, 30-day anonymous counts).
// Reads exactly the keys named in shared/bcpss-telemetry-schema.js; no alternative-key fallbacks.
import { INSIGHTS_KEYS, INTERNAL_TRAFFIC_FLAG } from "../../shared/bcpss-telemetry-schema.js";

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[ch]));
}

const EVENT_LABELS = {
  scaffold_toggle: "WIDA Scaffold Toggles",
  vocab_lookup: "Vocabulary & Cognate Lookups",
  activity_copy: "Activity / Playlist Copies",
  lab_launch: "Student Lab Launches",
  esol_routine: "ESOL Routine Opens",
  projection_mode: "Projection Mode Opens",
};

const TIER_LABELS = {
  "1_2": "WIDA Levels 1–2 (Entering / Emerging)",
  "3_4": "WIDA Levels 3–4 (Developing / Expanding)",
  "5_6": "WIDA Levels 5–6 (Bridging / Reaching)",
};

function renderBars(items, { colorClass = "", emptyText = "No interactions recorded in the last 30 days." } = {}) {
  if (!items.length) {
    return `<p style="margin:0;color:var(--ink-3)">${esc(emptyText)}</p>`;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  return `
    <div class="in-bars">
      ${items
        .map((item) => {
          const pct = Math.max(3, Math.round((item.count / max) * 100));
          return `
            <div class="in-bar-row">
              <div class="in-bar-meta">
                <strong>${esc(item.label)}</strong>
                <span class="in-bar-count">${item.count.toLocaleString()}</span>
              </div>
              <div class="in-bar-track" role="img" aria-label="${esc(item.label)}: ${item.count}">
                <div class="in-bar-fill ${colorClass}" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

const K = INSIGHTS_KEYS;
const asRows = (list, labelOf) =>
  (Array.isArray(list) ? list : []).map((r) => ({ label: labelOf(r), count: Number(r.count) }));

function renderDashboard(data) {
  const root = document.getElementById("insightsRoot");
  const windowDays = Number(data[K.window]);
  const total = Number(data[K.total]);

  const topGrades = asRows(data[K.grades], (r) => (String(r.grade) === "K" ? "Kindergarten (K)" : `Grade ${r.grade}`));
  const topUnits = asRows(data[K.units], (r) =>
    r.unit_title && r.unit_title !== r.unit_id
      ? `Gr. ${r.grade} ${r.subject} · U${r.unit_number}: ${r.unit_title}`
      : r.unit_id,
  );
  const topKlus = asRows(data[K.klus], (r) => r.wida_klu);
  const topTiers = asRows(data[K.tiers], (r) => TIER_LABELS[r.wida_tier] || r.wida_tier);
  const events = asRows(data[K.events], (r) => EVENT_LABELS[r.event_type] || r.event_type);

  const topGradeName = topGrades[0]?.label || "—";
  const topKluName = topKlus[0]?.label || "—";
  const topTierName = topTiers[0]?.label?.split(" (")[0] || "—";

  root.innerHTML = `
    <section class="in-kpi-row" aria-label="30-day summary metrics (beta)">
      <div class="in-kpi">
        <div class="in-kpi-label">${windowDays}-Day Interactions</div>
        <p class="in-kpi-value">${total.toLocaleString()}</p>
      </div>
      <div class="in-kpi">
        <div class="in-kpi-label">Most Active Grade</div>
        <p class="in-kpi-value" style="font-size:1.4rem">${esc(topGradeName)}</p>
      </div>
      <div class="in-kpi">
        <div class="in-kpi-label">Highest-Demand WIDA KLU</div>
        <p class="in-kpi-value" style="font-size:1.4rem">${esc(topKluName)}</p>
      </div>
      <div class="in-kpi">
        <div class="in-kpi-label">Most Requested Tier</div>
        <p class="in-kpi-value" style="font-size:1.4rem">${esc(topTierName)}</p>
      </div>
    </section>

    <div class="in-grid">
      <section class="in-panel">
        <h2>Top Units (${windowDays} Days)</h2>
        ${renderBars(topUnits.slice(0, 8))}
      </section>

      <section class="in-panel">
        <h2>Top Grade Levels</h2>
        ${renderBars(topGrades.slice(0, 9), { colorClass: "is-sage" })}
      </section>

      <section class="in-panel">
        <h2>Highest-Demand WIDA KLUs &amp; Tiers</h2>
        <div style="display:grid;gap:1.1rem">
          <div>
            <h3 style="margin:0 0 0.5rem;font-size:0.86rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--ink-3)">Key Language Uses</h3>
            ${renderBars(topKlus, { colorClass: "is-rose" })}
          </div>
          <div>
            <h3 style="margin:0 0 0.5rem;font-size:0.86rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--ink-3)">WIDA Proficiency Tiers</h3>
            ${renderBars(topTiers, { colorClass: "is-copper" })}
          </div>
        </div>
      </section>

      <section class="in-panel">
        <h2>Interaction Breakdown</h2>
        ${renderBars(events, { colorClass: "is-sage" })}
      </section>
    </div>
  `;
}

async function init() {
  const root = document.getElementById("insightsRoot");
  try {
    const res = await fetch("/api/bcpss/insights", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Unable to load district trends (${res.status})`);
    const data = await res.json();
    renderDashboard(data);
  } catch (err) {
    root.innerHTML = `<div class="in-status in-error" role="alert">${esc(err.message)}</div>`;
  }
}

function bindInternalToggle() {
  const box = document.getElementById("internalToggle");
  if (!box) return;
  try {
    box.checked = localStorage.getItem(INTERNAL_TRAFFIC_FLAG) === "1";
  } catch {
    box.disabled = true;
  }
  box.addEventListener("change", () => {
    try {
      if (box.checked) localStorage.setItem(INTERNAL_TRAFFIC_FLAG, "1");
      else localStorage.removeItem(INTERNAL_TRAFFIC_FLAG);
    } catch {
      box.checked = false;
    }
  });
}

bindInternalToggle();
init();
