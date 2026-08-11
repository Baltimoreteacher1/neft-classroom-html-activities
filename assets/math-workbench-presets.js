/**
 * Math Workbench Presets — 1-click pre-configured manipulative launchers.
 * Connects curriculum topics, projects, and lessons directly to ready-to-explore
 * visual math models.
 */
(function () {
  "use strict";

  if (window.EWLWorkbenchPresets) return;

  const PRESETS = [
    {
      id: "netfold-cube",
      title: "📦 3D Net Cube & Pyramid",
      description: "Interactive 3D shape net unfolder, surface area, and volume visualizer.",
      unit: "Unit 5",
      url: "/netfold-pro/?preset=cube-unfold",
      icon: "📦",
      tags: ["3d", "net", "surface-area", "volume"],
    },
    {
      id: "balance-scale",
      title: "⚖️ Equation Balance Scale",
      description: "Model 2x + 3 = 11 by balancing weights and isolating variables visually.",
      unit: "Unit 8",
      url: "/neft-math-lab-studio/?tool=balance&preset=2x3-11",
      icon: "⚖️",
      tags: ["equations", "balance", "variables"],
    },
    {
      id: "ratio-mixer",
      title: "🎨 Ratio Color Mixer 3:2",
      description:
        "Mix primary paint buckets in fixed ratios to explore equivalent ratios and scaling.",
      unit: "Unit 3",
      url: "/neft-math-lab-studio/?tool=ratio-mixer&preset=3-2",
      icon: "🎨",
      tags: ["ratios", "rates", "mixing"],
    },
    {
      id: "decimal-grid",
      title: "✖️ Decimal Product Grid (1.5 × 2.4)",
      description: "Dual-area decimal grid showing hundredths overlaps for decimal multiplication.",
      unit: "Unit 2",
      url: "/neft-math-lab-studio/?tool=decimal-product&preset=1.5x2.4",
      icon: "✖️",
      tags: ["decimals", "multiplication", "grid"],
    },
    {
      id: "box-plotter",
      title: "📊 Box Plot & Dot Plotter",
      description: "Plot 5-number summaries, median, IQR, and outliers in real-time.",
      unit: "Unit 2",
      url: "/neft-math-lab-studio/?tool=box-plot&preset=grade6-heights",
      icon: "📊",
      tags: ["statistics", "median", "box-plot"],
    },
    {
      id: "coordinate-radar",
      title: "📍 Cartesian Coordinate Defender",
      description: "Locate ordered pairs (x, y) across all 4 quadrants with distance radar.",
      unit: "Unit 7",
      url: "/neft-math-lab-studio/?tool=coordinate-grid&preset=quadrants-1-4",
      icon: "📍",
      tags: ["coordinate-plane", "quadrants", "integers"],
    },
  ];

  function getPresets() {
    return PRESETS.slice();
  }

  function getPresetsByUnit(unitName) {
    return PRESETS.filter(function (p) {
      return p.unit.toLowerCase() === (unitName || "").toLowerCase();
    });
  }

  function renderPresetBarContainer() {
    var bar = document.createElement("div");
    bar.id = "ewl-workbench-preset-bar";
    bar.className = "ewl-preset-bar";
    bar.setAttribute("aria-label", "Interactive Math Workbench Presets");

    var html =
      '<div class="ewl-preset-header">' +
      '<span class="ewl-preset-badge">⚡ 1-Click Manipulatives</span>' +
      '<h3 class="ewl-preset-title">Interactive Visual Math Presets</h3>' +
      '<span class="ewl-preset-sub">Launch pre-configured 3D nets, balance scales, and ratio models in 1 click.</span>' +
      "</div>" +
      '<div class="ewl-preset-grid">';

    PRESETS.forEach(function (p) {
      html +=
        '<a href="' +
        p.url +
        '" class="ewl-preset-card" target="_blank" rel="noopener">' +
        '<div class="ewl-preset-icon">' +
        p.icon +
        "</div>" +
        '<div class="ewl-preset-body">' +
        '<div class="ewl-preset-tag">' +
        p.unit +
        "</div>" +
        '<strong class="ewl-preset-name">' +
        p.title +
        "</strong>" +
        '<p class="ewl-preset-desc">' +
        p.description +
        "</p>" +
        "</div>" +
        '<span class="ewl-preset-btn">Launch Preset ↗</span>' +
        "</a>";
    });

    html += "</div>";
    bar.innerHTML = html;
    return bar;
  }

  function injectPresetBar() {
    if (document.getElementById("ewl-workbench-preset-bar")) return;
    var target =
      document.querySelector("#curriculum-start") ||
      document.querySelector("header") ||
      document.body.firstElementChild;
    if (target && target.parentNode) {
      var container = renderPresetBarContainer();
      target.parentNode.insertBefore(container, target.nextSibling);
    }
  }

  window.EWLWorkbenchPresets = {
    getPresets: getPresets,
    getPresetsByUnit: getPresetsByUnit,
    renderPresetBarContainer: renderPresetBarContainer,
    injectPresetBar: injectPresetBar,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectPresetBar);
  } else {
    injectPresetBar();
  }
})();
