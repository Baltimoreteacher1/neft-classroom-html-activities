// BCPSS District Trends Insights Dashboard (read-only, 30-day anonymous aggregates)

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

function normalizeRows(raw, labelFn) {
  if (Array.isArray(raw)) {
    return raw
      .map((r) => ({
        label: labelFn(r),
        count: Number(r.count ?? r.total ?? r.events ?? 0),
      }))
      .filter((r) => r.label);
  }
  if (raw && typeof raw === "object") {
    return Object.entries(raw).map(([k, v]) => ({
      label: labelFn({ key: k }),
      count: Number(v ?? 0),
    }));
  }
  return [];
}

function renderDashboard(data) {
  const root = document.getElementById("insightsRoot");
  const windowDays = Number(data.window_days ?? 30);
  const total = Number(data.total_interactions ?? data.total_events ?? data.totals?.events ?? 0);

  const topGrades = normalizeRows(data.top_grades || data.grades || [], (r) => {
    const g = r.grade ?? r.key;
    return String(g) === "K" ? "Kindergarten (K)" : `Grade ${g}`;
  });
  const topUnits = normalizeRows(data.top_units || data.units || [], (r) =>
    r.unit_title
      ? `Gr. ${r.grade} ${r.subject} · U${r.unit_number}: ${r.unit_title}`
      : r.unit_id || r.key,
  );
  const topKlus = normalizeRows(data.top_klus || data.wida_klus || data.klus || [], (r) => r.wida_klu || r.klu || r.key);
  const topTiers = normalizeRows(data.wida_tiers || data.top_tiers || data.tiers || [], (r) => {
    const k = r.wida_tier || r.tier || r.key;
    return TIER_LABELS[k] || k;
  });
  const events = normalizeRows(data.events_by_type || data.event_breakdown || data.events || [], (r) => {
    const k = r.event_type || r.type || r.key;
    return EVENT_LABELS[k] || k;
  });

  const topGradeName = topGrades[0]?.label || "—";
  const topKluName = topKlus[0]?.label || "—";
  const topTierName = topTiers[0]?.label?.split(" (")[0] || "—";

  root.innerHTML = `
    <section class="in-kpi-row" aria-label="30-day summary metrics">
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

init();
