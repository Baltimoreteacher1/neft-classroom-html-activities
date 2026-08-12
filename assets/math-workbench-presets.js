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
      id: "unit1-decimal-grid",
      title: "✖️ Decimal Operations & Multi-Digit Division",
      description: "Explore multi-digit whole number division and decimal budgeting (1.5 × 2.4) with hundredths area models.",
      unit: "Unit 1",
      url: "/neft-math-lab-studio/?tool=decimal-product&preset=1.5x2.4",
      icon: "✖️",
      tags: ["decimals", "division", "multiplication", "unit1"],
    },
    {
      id: "unit1-gcf-lcm",
      title: "🏷️ GCF & LCM Goodie Bag Builder",
      description: "Split supplies evenly into goodie bags using Venn factor trees and common multiples.",
      unit: "Unit 1",
      url: "/neft-math-lab-studio/?tool=gcf-lcm&preset=goodie-bags",
      icon: "🏷️",
      tags: ["gcf", "lcm", "factors", "unit1"],
    },
    {
      id: "unit3-ratio-mixer",
      title: "🎨 Ratio Color Mixer 3:2",
      description: "Mix primary paint buckets in fixed ratios to explore equivalent ratio tables and scaling.",
      unit: "Unit 3",
      url: "/neft-math-lab-studio/?tool=ratio-mixer&preset=3-2",
      icon: "🎨",
      tags: ["ratios", "rates", "mixing", "unit3"],
    },
    {
      id: "unit3-unit-rate",
      title: "⚡ Fleet Unit Rate Speedometer",
      description: "Calculate miles per hour and unit costs with interactive double number lines and unit conversions.",
      unit: "Unit 3",
      url: "/neft-math-lab-studio/?tool=unit-rate&preset=transit-fleet",
      icon: "⚡",
      tags: ["unit-rate", "conversions", "unit3"],
    },
    {
      id: "unit4-percent-grid",
      title: "💯 10x10 Percent Grid & Tri-Way Model",
      description: "Shade 100-grid squares to relate fractions, decimals, and percentages with benchmark discounts.",
      unit: "Unit 4",
      url: "/neft-math-lab-studio/?tool=percent-grid&preset=popup-shop",
      icon: "💯",
      tags: ["percents", "discounts", "grid", "unit4"],
    },
    {
      id: "unit6-distributive-alchemy",
      title: "🧪 Distributive Property Alchemy Array",
      description: "Expand 3(2x + 4) with visual algebra tiles, fraction division bars, and exponent engines.",
      unit: "Unit 6",
      url: "/neft-math-lab-studio/?tool=expressions&preset=distributive-3x",
      icon: "🧪",
      tags: ["expressions", "distributive", "exponents", "unit6"],
    },
    {
      id: "unit7-coordinate-radar",
      title: "📍 Cartesian Coordinate Submarine Defender",
      description: "Plot ordered pairs (x, y) across all 4 quadrants with distance radar and thermal elevation lines.",
      unit: "Unit 7",
      url: "/neft-math-lab-studio/?tool=coordinate-grid&preset=quadrants-1-4",
      icon: "📍",
      tags: ["coordinate-plane", "quadrants", "integers", "unit7"],
    },
    {
      id: "unit8-balance-scale",
      title: "⚖️ Equation Balance Scale & Inequality Line",
      description: "Model 2x + 3 = 11 by balancing weights and graph open number line inequality safety limits.",
      unit: "Unit 8",
      url: "/neft-math-lab-studio/?tool=balance&preset=2x3-11",
      icon: "⚖️",
      tags: ["equations", "inequalities", "balance", "unit8"],
    },
    {
      id: "unit9-function-machine",
      title: "📈 Two-Variable Function Engine (y = kx)",
      description: "Analyze independent (x) vs dependent (y) variable growth with real-time data tables and linear graphs.",
      unit: "Unit 9",
      url: "/neft-math-lab-studio/?tool=two-variables&preset=streaming-growth",
      icon: "📈",
      tags: ["two-variables", "graphing", "tables", "unit9"],
    },
    {
      id: "unit5-netfold-cube",
      title: "📦 3D Net Unfolder & Volume Studio",
      description: "Unfold 3D prisms and pyramids into 2D nets to compute surface area and volume V = l·w·h.",
      unit: "Unit 5",
      url: "/netfold-pro/?preset=cube-unfold",
      icon: "📦",
      tags: ["3d", "net", "surface-area", "volume", "unit5"],
    },
    {
      id: "unit2-box-plotter",
      title: "📊 Box Plot, Histogram & MAD Balance Beam",
      description: "Compute 5-number summaries, median, IQR, mean, and MAD with interactive dot plots and histograms.",
      unit: "Unit 2",
      url: "/neft-math-lab-studio/?tool=box-plot&preset=grade6-heights",
      icon: "📊",
      tags: ["statistics", "median", "box-plot", "mad", "unit2"],
    },
    {
      id: "unit10-tessellation-studio",
      title: "🎨 Boundless Tessellation & Portfolio Studio",
      description: "Create geometric tessellation art, solve logic mechanics, and curate your EOY Math Growth Portfolio.",
      unit: "Unit 10",
      url: "/neft-math-lab-studio/?tool=tessellation&preset=portfolio-showcase",
      icon: "🎨",
      tags: ["tessellation", "portfolio", "reflection", "unit10"],
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
