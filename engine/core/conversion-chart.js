// conversion-chart.js — integrated conversion chart modal & point-of-use reference chips
//
// Provides interactive access to measurement and unit conversion facts (Customary, Metric,
// Time, and Fraction/Decimal/Percent benchmarks) directly inside problem cards, tool drawers,
// and lesson headers without interrupting student work or affecting grading state.

import { renderMathText } from "./math-typography.js";

const STYLE_ID = "nt-conversion-chart-style";

const CSS = `
.nt-conversion-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: 700 13px/1 var(--font-ui, system-ui, sans-serif);
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  border: 1px solid #2f8f7d;
  background: #eef8f6;
  color: #0d5c4d;
  transition: all .15s ease;
  margin-left: 6px;
  user-select: none;
}
.nt-conversion-chip:hover {
  background: #d6f0ec;
  border-color: #1fa6a2;
  color: #083c32;
  transform: translateY(-1px);
}
.nt-conversion-chip:focus-visible {
  outline: 3px solid #2f8f7d;
  outline-offset: 2px;
}
.nt-conversion-chip-icon {
  font-size: 14px;
}

dialog.nt-conversion-dialog {
  width: min(880px, 94vw);
  max-width: 94vw;
  max-height: 90vh;
  padding: 0;
  border: 0;
  border-radius: 20px;
  background: #ffffff;
  color: #12355b;
  box-shadow: 0 24px 72px rgba(18, 53, 91, 0.35);
  overflow: hidden;
}
dialog.nt-conversion-dialog::backdrop {
  background: rgba(11, 37, 64, 0.55);
  backdrop-filter: blur(3px);
}
.nt-conversion-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 24px;
  background: linear-gradient(135deg, #12355b 0%, #1e4a7a 100%);
  color: #ffffff;
}
.nt-conversion-head-title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nt-conversion-head-title h2 {
  font: 800 22px/1.2 var(--font-display, "Outfit", system-ui, sans-serif);
  margin: 0;
  color: #ffffff;
}
.nt-conversion-head-title p {
  font: 400 13px/1.3 var(--font-body, system-ui, sans-serif);
  margin: 2px 0 0;
  color: #b0d2f5;
}
.nt-conversion-close {
  font: 700 14px/1 var(--font-ui, system-ui, sans-serif);
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  border-radius: 999px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all .15s ease;
}
.nt-conversion-close:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: #ffffff;
}

.nt-conversion-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 24px;
  background: #f4f8fb;
  border-bottom: 1px solid #e2ebf3;
}
.nt-conversion-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.nt-conversion-tab {
  font: 700 13px/1 var(--font-ui, system-ui, sans-serif);
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #d0deea;
  background: #ffffff;
  color: #435b75;
  cursor: pointer;
  transition: all .15s ease;
}
.nt-conversion-tab:hover {
  background: #eef5fc;
  color: #12355b;
}
.nt-conversion-tab.active {
  background: #12355b;
  border-color: #12355b;
  color: #ffffff;
}

.nt-conversion-search-wrap {
  position: relative;
  min-width: 220px;
  flex: 1 1 220px;
  max-width: 320px;
}
.nt-conversion-search {
  width: 100%;
  padding: 8px 12px 8px 34px;
  border: 1px solid #c8d8e7;
  border-radius: 8px;
  font: 400 14px/1.3 var(--font-body, system-ui, sans-serif);
  color: #12355b;
  background: #ffffff;
  box-sizing: border-box;
}
.nt-conversion-search:focus {
  outline: none;
  border-color: #2f8f7d;
  box-shadow: 0 0 0 3px rgba(47, 143, 125, 0.2);
}
.nt-conversion-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #8da1b5;
  font-size: 14px;
  pointer-events: none;
}

.nt-conversion-body {
  padding: 20px 24px 28px;
  max-height: calc(90vh - 150px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  box-sizing: border-box;
}

.nt-conversion-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.nt-conversion-sec-title {
  font: 800 16px/1.2 var(--font-display, "Outfit", system-ui, sans-serif);
  color: #12355b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  border-bottom: 2px solid #e4edf5;
}
.nt-conversion-sec-title .sec-badge {
  font: 700 11px/1 var(--font-ui, system-ui, sans-serif);
  padding: 3px 8px;
  border-radius: 999px;
  background: #eef5fc;
  color: #1e4a7a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.nt-conversion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.nt-conversion-card {
  background: #ffffff;
  border: 1px solid #d8e5f0;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 2px 6px rgba(18, 53, 91, 0.04);
  transition: all .15s ease;
}
.nt-conversion-card:hover {
  border-color: #2f8f7d;
  box-shadow: 0 4px 12px rgba(47, 143, 125, 0.12);
}
.nt-conversion-card-label {
  font: 700 12px/1 var(--font-ui, system-ui, sans-serif);
  color: #63788e;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.nt-conversion-card-eq {
  font: 800 16px/1.3 var(--font-display, "Outfit", system-ui, sans-serif);
  color: #0b2540;
}
.nt-conversion-card-detail {
  font: 500 13px/1.4 var(--font-body, system-ui, sans-serif);
  color: #4a637d;
  background: #f7fafd;
  padding: 6px 10px;
  border-radius: 6px;
  border-left: 3px solid #1fa6a2;
}

.nt-quick-converter {
  background: linear-gradient(135deg, #f0f7f6 0%, #e6f3f0 100%);
  border: 1px solid #b8e2db;
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.nt-quick-converter-title {
  font: 800 15px/1.2 var(--font-display, "Outfit", system-ui, sans-serif);
  color: #0d5c4d;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.nt-quick-converter-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.nt-quick-converter-controls input {
  width: 90px;
  padding: 8px 10px;
  border: 1px solid #9ad4ca;
  border-radius: 8px;
  font: 700 15px/1 var(--font-ui, system-ui, sans-serif);
  color: #0b2540;
  background: #ffffff;
  text-align: center;
}
.nt-quick-converter-controls select {
  padding: 8px 12px;
  border: 1px solid #9ad4ca;
  border-radius: 8px;
  font: 700 14px/1 var(--font-ui, system-ui, sans-serif);
  color: #0b2540;
  background: #ffffff;
  cursor: pointer;
}
.nt-quick-converter-result {
  font: 800 16px/1.4 var(--font-display, "Outfit", system-ui, sans-serif);
  color: #083c32;
  background: #ffffff;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px dashed #2f8f7d;
}

@media (max-width: 600px) {
  dialog.nt-conversion-dialog {
    width: 100vw;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
  .nt-conversion-body {
    max-height: calc(100vh - 140px);
    padding: 16px;
  }
  .nt-conversion-toolbar {
    padding: 10px 16px;
  }
  .nt-conversion-grid {
    grid-template-columns: 1fr;
  }
}
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

/**
 * Standard Grade 6 Conversion Reference Data
 */
export const CONVERSION_DATA = [
  {
    category: "customary",
    categoryLabel: "Customary Units",
    categoryLabelEs: "Unidades del sistema usual",
    type: "length",
    typeLabel: "Length",
    typeLabelEs: "Longitud",
    items: [
      { label: "1 Foot", eq: "1 ft = 12 in", detail: "1 foot equals 12 inches" },
      { label: "1 Yard", eq: "1 yd = 3 ft = 36 in", detail: "1 yard equals 3 feet or 36 inches" },
      { label: "1 Mile", eq: "1 mi = 5,280 ft = 1,760 yd", detail: "1 mile equals 5,280 feet" },
    ],
  },
  {
    category: "customary",
    categoryLabel: "Customary Units",
    categoryLabelEs: "Unidades del sistema usual",
    type: "weight",
    typeLabel: "Weight & Mass",
    typeLabelEs: "Peso y masa",
    items: [
      { label: "1 Pound", eq: "1 lb = 16 oz", detail: "1 pound equals 16 ounces" },
      { label: "1 Ton", eq: "1 T = 2,000 lb", detail: "1 ton equals 2,000 pounds" },
    ],
  },
  {
    category: "customary",
    categoryLabel: "Customary Units",
    categoryLabelEs: "Unidades del sistema usual",
    type: "capacity",
    typeLabel: "Capacity & Volume",
    typeLabelEs: "Capacidad y volumen",
    items: [
      { label: "1 Cup", eq: "1 c = 8 fl oz", detail: "1 cup equals 8 fluid ounces" },
      { label: "1 Pint", eq: "1 pt = 2 c = 16 fl oz", detail: "1 pint equals 2 cups" },
      { label: "1 Quart", eq: "1 qt = 2 pt = 4 c", detail: "1 quart equals 2 pints or 4 cups" },
      { label: "1 Gallon", eq: "1 gal = 4 qt = 8 pt = 16 c", detail: "1 gallon equals 4 quarts" },
    ],
  },
  {
    category: "metric",
    categoryLabel: "Metric Units",
    categoryLabelEs: "Sistema métrico",
    type: "length",
    typeLabel: "Length",
    typeLabelEs: "Longitud",
    items: [
      { label: "1 Centimeter", eq: "1 cm = 10 mm", detail: "1 centimeter equals 10 millimeters" },
      { label: "1 Meter", eq: "1 m = 100 cm = 1,000 mm", detail: "1 meter equals 100 centimeters" },
      { label: "1 Kilometer", eq: "1 km = 1,000 m", detail: "1 kilometer equals 1,000 meters" },
    ],
  },
  {
    category: "metric",
    categoryLabel: "Metric Units",
    categoryLabelEs: "Sistema métrico",
    type: "mass",
    typeLabel: "Mass & Weight",
    typeLabelEs: "Masa y peso",
    items: [
      { label: "1 Gram", eq: "1 g = 1,000 mg", detail: "1 gram equals 1,000 milligrams" },
      { label: "1 Kilogram", eq: "1 kg = 1,000 g", detail: "1 kilogram equals 1,000 grams" },
    ],
  },
  {
    category: "metric",
    categoryLabel: "Metric Units",
    categoryLabelEs: "Sistema métrico",
    type: "capacity",
    typeLabel: "Capacity",
    typeLabelEs: "Capacidad",
    items: [
      { label: "1 Liter", eq: "1 L = 1,000 mL", detail: "1 liter equals 1,000 milliliters" },
    ],
  },
  {
    category: "time",
    categoryLabel: "Time Units",
    categoryLabelEs: "Unidades de tiempo",
    type: "time",
    typeLabel: "Time",
    typeLabelEs: "Tiempo",
    items: [
      { label: "1 Minute", eq: "1 min = 60 sec", detail: "1 minute equals 60 seconds" },
      { label: "1 Hour", eq: "1 hr = 60 min", detail: "1 hour equals 60 minutes" },
      { label: "1 Day", eq: "1 day = 24 hr", detail: "1 day equals 24 hours" },
      { label: "1 Week", eq: "1 wk = 7 days", detail: "1 week equals 7 days" },
      { label: "1 Year", eq: "1 yr = 365 days = 52 wks", detail: "1 year equals 12 months" },
    ],
  },
  {
    category: "percents",
    categoryLabel: "Fractions & Percents",
    categoryLabelEs: "Fracciones y porcentajes",
    type: "benchmarks",
    typeLabel: "Equivalents",
    typeLabelEs: "Equivalencias",
    items: [
      { label: "Half", eq: "1/2 = 0.5 = 50%", detail: "Half benchmark" },
      { label: "Quarter", eq: "1/4 = 0.25 = 25%", detail: "Three quarters: 3/4 = 0.75 = 75%" },
      { label: "Fifths", eq: "1/5 = 0.2 = 20%", detail: "2/5=40%, 3/5=60%, 4/5=80%" },
      { label: "Tenths", eq: "1/10 = 0.1 = 10%", detail: "1/100 = 0.01 = 1%" },
      { label: "Eighths", eq: "1/8 = 0.125 = 12.5%", detail: "3/8 = 0.375 = 37.5%" },
    ],
  },
];

/** Quick conversion rules for live helper widget */
const CONVERTER_RULES = [
  { id: "ft_to_in", name: "Feet ➔ Inches", factor: 12, from: "ft", to: "in" },
  { id: "in_to_ft", name: "Inches ➔ Feet", factor: 1 / 12, from: "in", to: "ft" },
  { id: "yd_to_ft", name: "Yards ➔ Feet", factor: 3, from: "yd", to: "ft" },
  { id: "mi_to_ft", name: "Miles ➔ Feet", factor: 5280, from: "mi", to: "ft" },
  { id: "lb_to_oz", name: "Pounds ➔ Ounces", factor: 16, from: "lb", to: "oz" },
  { id: "gal_to_qt", name: "Gallons ➔ Quarts", factor: 4, from: "gal", to: "qt" },
  { id: "gal_to_pt", name: "Gallons ➔ Pints", factor: 8, from: "gal", to: "pt" },
  { id: "gal_to_c", name: "Gallons ➔ Cups", factor: 16, from: "gal", to: "c" },
  { id: "c_to_floz", name: "Cups ➔ Fluid Ounces", factor: 8, from: "c", to: "fl oz" },
  { id: "m_to_cm", name: "Meters ➔ Centimeters", factor: 100, from: "m", to: "cm" },
  { id: "km_to_m", name: "Kilometers ➔ Meters", factor: 1000, from: "km", to: "m" },
  { id: "kg_to_g", name: "Kilograms ➔ Grams", factor: 1000, from: "kg", to: "g" },
  { id: "l_to_ml", name: "Liters ➔ Milliliters", factor: 1000, from: "L", to: "mL" },
  { id: "hr_to_min", name: "Hours ➔ Minutes", factor: 60, from: "hr", to: "min" },
  { id: "min_to_sec", name: "Minutes ➔ Seconds", factor: 60, from: "min", to: "sec" },
];

/**
 * Check if text or config contains conversion facts / measurement conversion terms.
 */
export function hasConversionFacts(text, config = null) {
  if (config && (config.hasConversionChart || config.tools?.includes("conversion-chart"))) {
    return true;
  }
  const str = typeof text === "string" ? text.toLowerCase() : JSON.stringify(text || "").toLowerCase();
  const keywords = [
    "convert",
    "conversion",
    "conversion factor",
    "customary",
    "metric",
    "feet",
    "inches",
    "yards",
    "miles",
    "gallons",
    "quarts",
    "pints",
    "ounces",
    "pounds",
    "kilograms",
    "milligrams",
    "centimeters",
    "millimeters",
    "kilometers",
    "milliliters",
  ];
  return keywords.some((kw) => str.includes(kw));
}

let activeDialog = null;
let lastFocusEl = null;

/**
 * Open the Conversion Chart Modal Dialog
 */
export function openConversionChartModal({ category = "all", triggerEl = null } = {}) {
  ensureStyles();
  lastFocusEl = triggerEl || document.activeElement;

  if (!activeDialog) {
    activeDialog = document.createElement("dialog");
    activeDialog.className = "nt-conversion-dialog";
    activeDialog.setAttribute("aria-labelledby", "nt-conversion-title");

    activeDialog.innerHTML = `
      <div class="nt-conversion-head">
        <div class="nt-conversion-head-title">
          <span style="font-size: 24px;">📋</span>
          <div>
            <h2 id="nt-conversion-title">Conversion Reference Chart</h2>
            <p>Grade 6 Unit & Measurement Conversion Facts</p>
          </div>
        </div>
        <button type="button" class="nt-conversion-close" aria-label="Close conversion chart">Close ✕</button>
      </div>

      <div class="nt-conversion-toolbar">
        <div class="nt-conversion-tabs">
          <button type="button" class="nt-conversion-tab active" data-cat="all">All Facts</button>
          <button type="button" class="nt-conversion-tab" data-cat="customary">Customary</button>
          <button type="button" class="nt-conversion-tab" data-cat="metric">Metric</button>
          <button type="button" class="nt-conversion-tab" data-cat="time">Time</button>
          <button type="button" class="nt-conversion-tab" data-cat="percents">Fractions & Percents</button>
        </div>
        <div class="nt-conversion-search-wrap">
          <span class="nt-conversion-search-icon">🔍</span>
          <input type="search" class="nt-conversion-search" placeholder="Filter units (e.g. feet, gal, cm)..." aria-label="Filter conversion units">
        </div>
      </div>

      <div class="nt-conversion-body">
        <div class="nt-quick-converter">
          <div class="nt-quick-converter-title">
            <span>⚡</span> Unit Conversion Factor Check
          </div>
          <div class="nt-quick-converter-controls">
            <input type="number" class="nt-qc-input" value="1" min="0" step="any">
            <select class="nt-qc-select">
              ${CONVERTER_RULES.map((r) => `<option value="${r.id}">${r.name}</option>`).join("")}
            </select>
          </div>
          <div class="nt-quick-converter-result">
            Calculation step will show here
          </div>
        </div>

        <div class="nt-conversion-content"></div>
      </div>
    `;

    document.body.appendChild(activeDialog);

    // Event listeners
    const closeBtn = activeDialog.querySelector(".nt-conversion-close");
    closeBtn.addEventListener("click", closeConversionChartModal);

    activeDialog.addEventListener("click", (e) => {
      if (e.target === activeDialog) closeConversionChartModal();
    });

    activeDialog.addEventListener("close", () => {
      lastFocusEl?.focus?.();
    });

    // Tab buttons
    const tabs = activeDialog.querySelectorAll(".nt-conversion-tab");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderContent(tab.dataset.cat, activeDialog.querySelector(".nt-conversion-search").value);
      });
    });

    // Search input
    const searchInput = activeDialog.querySelector(".nt-conversion-search");
    searchInput.addEventListener("input", () => {
      const activeTab = activeDialog.querySelector(".nt-conversion-tab.active")?.dataset?.cat || "all";
      renderContent(activeTab, searchInput.value);
    });

    // Quick converter logic
    const qcInput = activeDialog.querySelector(".nt-qc-input");
    const qcSelect = activeDialog.querySelector(".nt-qc-select");
    const qcResult = activeDialog.querySelector(".nt-quick-converter-result");

    const updateQC = () => {
      const val = parseFloat(qcInput.value) || 0;
      const rule = CONVERTER_RULES.find((r) => r.id === qcSelect.value) || CONVERTER_RULES[0];
      const res = (val * rule.factor).toLocaleString(undefined, { maximumFractionDigits: 4 });
      if (rule.factor >= 1) {
        qcResult.innerHTML = `<strong>${val} ${rule.from}</strong> × ${rule.factor} = <strong>${res} ${rule.to}</strong>`;
      } else {
        const inv = Math.round(1 / rule.factor);
        qcResult.innerHTML = `<strong>${val} ${rule.from}</strong> ÷ ${inv} = <strong>${res} ${rule.to}</strong>`;
      }
    };

    qcInput.addEventListener("input", updateQC);
    qcSelect.addEventListener("change", updateQC);
    updateQC();
  }

  // Set active tab
  const tabs = activeDialog.querySelectorAll(".nt-conversion-tab");
  tabs.forEach((t) => {
    t.classList.toggle("active", t.dataset.cat === category);
  });

  renderContent(category, "");

  if (typeof activeDialog.showModal === "function") {
    activeDialog.showModal();
  } else {
    activeDialog.setAttribute("open", "");
  }
}

/**
 * Render conversion content filtered by category and search string
 */
function renderContent(category = "all", searchQuery = "") {
  if (!activeDialog) return;
  const container = activeDialog.querySelector(".nt-conversion-content");
  container.innerHTML = "";

  const query = searchQuery.trim().toLowerCase();

  const filteredGroups = CONVERSION_DATA.filter((group) => {
    if (category !== "all" && group.category !== category) return false;
    if (!query) return true;
    return (
      group.categoryLabel.toLowerCase().includes(query) ||
      group.typeLabel.toLowerCase().includes(query) ||
      group.items.some(
        (it) =>
          it.label.toLowerCase().includes(query) ||
          it.eq.toLowerCase().includes(query) ||
          it.detail.toLowerCase().includes(query)
      )
    );
  });

  if (!filteredGroups.length) {
    container.innerHTML = `<p style="text-align:center; padding: 24px; color:#5f6f80; font-weight:600;">No conversion facts found matching "${searchQuery}".</p>`;
    return;
  }

  filteredGroups.forEach((group) => {
    const sec = document.createElement("div");
    sec.className = "nt-conversion-section";

    const title = document.createElement("h3");
    title.className = "nt-conversion-sec-title";
    title.innerHTML = `<span>${group.typeLabel}</span> <span class="sec-badge">${group.categoryLabel}</span>`;
    sec.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "nt-conversion-grid";

    const items = group.items.filter((it) => {
      if (!query) return true;
      return (
        it.label.toLowerCase().includes(query) ||
        it.eq.toLowerCase().includes(query) ||
        it.detail.toLowerCase().includes(query)
      );
    });

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "nt-conversion-card";
      card.innerHTML = `
        <div class="nt-conversion-card-label">${item.label}</div>
        <div class="nt-conversion-card-eq">${renderMathText(item.eq)}</div>
        <div class="nt-conversion-card-detail">${item.detail}</div>
      `;
      grid.appendChild(card);
    });

    sec.appendChild(grid);
    container.appendChild(sec);
  });
}

/**
 * Close the Conversion Chart Modal
 */
export function closeConversionChartModal() {
  if (!activeDialog) return;
  if (typeof activeDialog.close === "function") {
    activeDialog.close();
  } else {
    activeDialog.removeAttribute("open");
  }
}

/**
 * Render a Conversion Reference Chip Button into a container element
 */
export function renderConversionChip(container, { category = "all", label = "Conversion Chart", icon = "📋" } = {}) {
  if (!container || typeof document === "undefined") return null;
  ensureStyles();

  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "nt-conversion-chip";
  chip.setAttribute("aria-label", "Open Conversion Chart Reference");
  chip.innerHTML = `<span class="nt-conversion-chip-icon">${icon}</span> <span>${label}</span>`;

  chip.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openConversionChartModal({ category, triggerEl: chip });
  });

  container.appendChild(chip);
  return chip;
}

export default {
  openConversionChartModal,
  closeConversionChartModal,
  renderConversionChip,
  hasConversionFacts,
  CONVERSION_DATA,
};
