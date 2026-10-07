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
      description:
        "Explore multi-digit whole number division and decimal budgeting (1.5 × 2.4) with hundredths area models.",
      unit: "Unit 1",
      url: "/curriculum/division-foundry/",
      icon: "✖️",
      tags: ["decimals", "division", "multiplication", "unit1"],
    },
    {
      id: "unit1-gcf-lcm",
      title: "🏷️ GCF & LCM Goodie Bag Builder",
      description:
        "Split supplies evenly into goodie bags using Venn factor trees and common multiples.",
      unit: "Unit 1",
      url: "/math/games/u1-factor-frenzy/",
      icon: "🏷️",
      tags: ["gcf", "lcm", "factors", "unit1"],
    },
    {
      id: "unit3-ratio-mixer",
      title: "🎨 Ratio Color Mixer 3:2",
      description:
        "Mix primary paint buckets in fixed ratios to explore equivalent ratio tables and scaling.",
      unit: "Unit 3",
      url: "/ratio-color-mixer/",
      icon: "🎨",
      tags: ["ratios", "rates", "mixing", "unit3"],
    },
    {
      id: "unit3-unit-rate",
      title: "⚡ Fleet Unit Rate Speedometer",
      description:
        "Calculate miles per hour and unit costs with interactive double number lines and unit conversions.",
      unit: "Unit 3",
      url: "/double-line-racer/",
      icon: "⚡",
      tags: ["unit-rate", "conversions", "unit3"],
    },
    {
      id: "unit4-percent-grid",
      title: "💯 10x10 Percent Grid & Tri-Way Model",
      description:
        "Shade 100-grid squares to relate fractions, decimals, and percentages with benchmark discounts.",
      unit: "Unit 4",
      url: "/curriculum/arcade/",
      icon: "💯",
      tags: ["percents", "discounts", "grid", "unit4"],
    },
    {
      id: "unit6-distributive-alchemy",
      title: "🧪 Distributive Property Alchemy Array",
      description:
        "Expand 3(2x + 4) with visual algebra tiles, fraction division bars, and exponent engines.",
      unit: "Unit 6",
      url: "/lessons/6-1/",
      icon: "🧪",
      tags: ["expressions", "distributive", "exponents", "unit6"],
    },
    {
      id: "unit7-coordinate-radar",
      title: "📍 Cartesian Coordinate Submarine Defender",
      description:
        "Plot ordered pairs (x, y) across all 4 quadrants with distance radar and thermal elevation lines.",
      unit: "Unit 7",
      url: "/starfield-coordinate-defender/",
      icon: "📍",
      tags: ["coordinate-plane", "quadrants", "integers", "unit7"],
    },
    {
      id: "unit8-balance-scale",
      title: "⚖️ Equation Balance Scale & Inequality Line",
      description:
        "Model 2x + 3 = 11 by balancing weights and graph open number line inequality safety limits.",
      unit: "Unit 8",
      url: "/mad-balance-sandbox/",
      icon: "⚖️",
      tags: ["equations", "inequalities", "balance", "unit8"],
    },
    {
      id: "unit9-function-machine",
      title: "📈 Two-Variable Function Engine (y = kx)",
      description:
        "Analyze independent (x) vs dependent (y) variable growth with real-time data tables and linear graphs.",
      unit: "Unit 9",
      url: "/lessons/9-1/",
      icon: "📈",
      tags: ["two-variables", "graphing", "tables", "unit9"],
    },
    {
      id: "unit5-netfold-cube",
      title: "📦 3D Net Unfolder & Volume Studio",
      description:
        "Unfold 3D prisms and pyramids into 2D nets to compute surface area and volume V = l·w·h.",
      unit: "Unit 5",
      url: "/netfold-pro/?preset=cube-unfold",
      icon: "📦",
      tags: ["3d", "net", "surface-area", "volume", "unit5"],
    },
    {
      id: "unit2-box-plotter",
      title: "📊 Box Plot, Histogram & MAD Balance Beam",
      description:
        "Compute 5-number summaries, median, IQR, mean, and MAD with interactive dot plots and histograms.",
      unit: "Unit 2",
      url: "/math/statistics/data-studio/",
      icon: "📊",
      tags: ["statistics", "median", "box-plot", "mad", "unit2"],
    },
    {
      id: "unit10-tessellation-studio",
      title: "🎨 Boundless Tessellation & Portfolio Studio",
      description:
        "Create geometric tessellation art, solve logic mechanics, and curate your EOY Math Growth Portfolio.",
      unit: "Unit 10",
      url: "/netfold-pro/",
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
    // role AND aria-label, not aria-label alone. An aria-label on a plain <div>
    // names nothing: without a role the element is not a landmark, so axe counts
    // this bar and everything inside it as content sitting outside any landmark
    // ("region"). The label was already written for a landmark that did not
    // exist yet.
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Interactive Math Workbench Presets");

    var html =
      '<div class="ewl-preset-header">' +
      '<span class="ewl-preset-badge">⚡ 1-Click Manipulatives</span>' +
      '<h2 class="ewl-preset-title">Interactive Visual Math Presets</h2>' +
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
      var collection = document.getElementById("hub-manipulatives");
      if (collection) collection.appendChild(container);
      else target.parentNode.insertBefore(container, target.nextSibling);
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
