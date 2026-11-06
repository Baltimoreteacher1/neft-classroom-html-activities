// Wonder Lab Interactive Math Universe Hub
// A Google-tier, interactive playground organizing all 16 conceptual math models
// into a unified gallery with active quests, grade alignment, and live direct-manipulation stages.

import { renderTool, defaults } from "./drill-tools.js";
import { renderChallengeBanner, checkAndTriggerReward, getCompletedChallenges } from "./challenge-engine.js";
import { mountFractionSlicer, mountScrubbableAreaModel } from "./explorable-manipulatives.js";
import { mountCoordinateExplorer } from "./coordinate-explorer.js";
import { mountTriangleShear } from "./triangle-shear.js";
import { mountBase10Regrouping } from "./base10-regrouping.js";
import { mountRatioScaler } from "./ratio-scaler.js";
import { mountAngleProtractor } from "./angle-protractor.js";
import { mountPrimeFactorLab } from "./prime-factor-lab.js";
import { mountProbabilitySandbox } from "./probability-sandbox.js";
import { mountNet3DFolder } from "./net-3d-folder.js";
import { mountFunctionMachine } from "./function-machine.js";
import { mountUnitRateComparator } from "./unit-rate-comparator.js";
import { mountCirclePiLab } from "./circle-pi-lab.js";
import { mountPythagorasLab } from "./pythagoras-lab.js";
import { mountBoxWhiskerPlot } from "./box-whisker-plot.js";
import { mountIntegerVectorHops } from "./integer-vector-hops.js";
import { mountAlgebraTilesLab } from "./algebra-tiles-lab.js";
import { mountDilationTransformLab } from "./dilation-transform-lab.js";
import { mountProofWithoutWords } from "./proof-without-words.js";
import { mountTrigWaveStudio } from "./trig-wave-studio.js";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

export const UNIVERSE_MODELS = [
  // 1. Number Sense & Operations
  {
    key: "pvMat",
    title: "Place-Value Disks & Regrouping Mat",
    category: "numbers",
    categoryLabel: "🔢 Number Sense",
    grades: "Grades 2–5",
    standard: "2.NBT.B.7 / 4.NBT.B.4",
    desc: "Interactive hundreds, tens, and ones disks with live regrouping, bundling, and unbundling animations.",
    icon: "🧮",
  },
  {
    key: "slicer",
    title: "Dynamic Fraction Slicer",
    category: "numbers",
    categoryLabel: "🔢 Number Sense",
    grades: "Grades 3–5",
    standard: "4.NF.A.1",
    desc: "Direct partition slicing from 1× to 6× proving visual equivalence of common and decimal fractions.",
    icon: "✂️",
  },
  {
    key: "primeLab",
    title: "Prime Factor Tree & GCF/LCM Venn",
    category: "numbers",
    categoryLabel: "🔢 Number Sense",
    grades: "Grades 4–7",
    standard: "6.NS.B.4",
    desc: "Branching factor trees decomposing numbers down to prime leaves with synchronized Venn diagram.",
    icon: "🌳",
  },
  {
    key: "ratioScale",
    title: "Proportional Tape Diagram & Multi-Tier Table",
    category: "numbers",
    categoryLabel: "🔢 Number Sense",
    grades: "Grades 6–7",
    standard: "6.RP.A.3",
    desc: "Proportional bar model with dynamic scaling multiplier and unit rate comparison.",
    icon: "📊",
  },
  {
    key: "intVector",
    title: "Directed Integer Vector Line",
    category: "numbers",
    categoryLabel: "🔢 Number Sense",
    grades: "Grades 6–7",
    standard: "7.NS.A.1",
    desc: "Directed vector arrows explaining directional reversal when adding or subtracting negative integers.",
    icon: "🔵🔴",
  },

  // 2. Geometry & Spatial Reasoning
  {
    key: "triShear",
    title: "Dynamic Triangle Shear Studio",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 6–8",
    standard: "6.G.A.1",
    desc: "Continuous apex horizontal shear proving invariant area A = ½bh as the triangle skews into an obtuse form.",
    icon: "📐",
  },
  {
    key: "angle",
    title: "Dynamic Angle Studio & 360° Protractor",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 4–8",
    standard: "4.MD.C.6 / 7.G.B.5",
    desc: "Circular 360° protractor with ray dragging, automatic classification, and complementary/supplementary solvers.",
    icon: "📐",
  },
  {
    key: "net3d",
    title: "Net-to-3D Solid Folder",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 6–8",
    standard: "6.G.A.4",
    desc: "Continuous folding slider transforming 2D nets into 3D isometric polyhedra, proving Surface Area formulas.",
    icon: "📦",
  },
  {
    key: "circlePi",
    title: "Circle Investigator & π Discovery Lab",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 7–8",
    standard: "7.G.B.4",
    desc: "Wheel perimeter unroller (C = πd) and Archimedes wedge slicer proving Area = πr² via parallelogram rearrangement.",
    icon: "⚪",
  },
  {
    key: "pythagoras",
    title: "Pythagorean Theorem & Distance Studio",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 8+",
    standard: "8.G.B.7",
    desc: "Right triangle with physical square areas on legs and hypotenuse, proving a² + b² = c² with triple detection.",
    icon: "📐",
  },
  {
    key: "dilation",
    title: "Dynamic Dilation & Quadratic Area Explorer",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 7–8",
    standard: "8.G.A.3",
    desc: "Dilation from origin showing lengths scale linearly by k while surface area scales quadratically by k².",
    icon: "🔍",
  },
  {
    key: "proofWords",
    title: "Proofs Without Words: Dissection Engine",
    category: "geometry",
    categoryLabel: "📐 Geometry & Spatial",
    grades: "Grades 6–8",
    standard: "6.G.A.1",
    desc: "Animated geometric dissections continuously morphing parallelograms and trapezoids into rectangles.",
    icon: "✨",
  },

  // 3. Algebra & Functions
  {
    key: "algebraTiles",
    title: "Interactive Algebra Tiles & Equation Mat",
    category: "algebra",
    categoryLabel: "⚙️ Algebra & Functions",
    grades: "Grades 6–8",
    standard: "8.EE.C.7",
    desc: "Physical balance mat with zero-pair annihilation and inverse operation tools solving linear equations.",
    icon: "🧱",
  },
  {
    key: "funcMach",
    title: "Linear Function Machine & In-Out Table",
    category: "algebra",
    categoryLabel: "⚙️ Algebra & Functions",
    grades: "Grades 6–8",
    standard: "8.F.A.1",
    desc: "Algebraic gearbox mapping input x through rule y = mx + b with synchronized table and rate of change readouts.",
    icon: "⚙️",
  },
  {
    key: "coord",
    title: "4-Quadrant Cartesian Plane Explorer",
    category: "algebra",
    categoryLabel: "⚙️ Algebra & Functions",
    grades: "Grades 5–8",
    standard: "6.NS.C.8 / 8.EE.B.5",
    desc: "Interactive draggable coordinate points A and B calculating slope, rise/run, and Euclidean distance.",
    icon: "📍",
  },
  {
    key: "trigWave",
    title: "Unit Circle & Sine Wave Harmonograph",
    category: "algebra",
    categoryLabel: "⚙️ Algebra & Functions",
    grades: "Grades 7–8+",
    standard: "HSF.TF.A.2",
    desc: "Phasor on unit circle unfolding continuously into sinusoidal wave graphs with live coordinate laser tracing.",
    icon: "🌊",
  },

  // 4. Statistics & Probability
  {
    key: "probSpinner",
    title: "Probability Spinner & Law of Large Numbers",
    category: "stats",
    categoryLabel: "📊 Statistics & Probability",
    grades: "Grades 7–8",
    standard: "7.SP.C.6",
    desc: "Dynamic sector spinner and high-speed Monte Carlo runner demonstrating empirical-to-theoretical convergence.",
    icon: "🎲",
  },
  {
    key: "boxPlot",
    title: "Box-and-Whisker Plot & 5-Number Summary",
    category: "stats",
    categoryLabel: "📊 Statistics & Probability",
    grades: "Grades 6–8",
    standard: "6.SP.B.5",
    desc: "Statistical distribution visualizer computing Min, Q1, Median, Q3, Max, IQR, and 1.5×IQR outlier fences.",
    icon: "📊",
  },
  {
    key: "rateComp",
    title: "Unit Rate & 'Best Buy' Comparator",
    category: "stats",
    categoryLabel: "📊 Statistics & Probability",
    grades: "Grades 6–7",
    standard: "6.RP.A.2",
    desc: "Side-by-side unit rate comparison normalizing multi-unit packages to 1 unit to demonstrate proportional savings.",
    icon: "🏷️",
  },
];

export function renderUniverseHub(state = {}) {
  const {
    activeCategory = "all", // "all", "numbers", "geometry", "algebra", "stats"
    activeModelKey = "algebraTiles",
    modelState = defaults(),
  } = state;

  const completed = getCompletedChallenges();
  const filteredModels = activeCategory === "all"
    ? UNIVERSE_MODELS
    : UNIVERSE_MODELS.filter((m) => m.category === activeCategory);

  const activeModel = UNIVERSE_MODELS.find((m) => m.key === activeModelKey) || UNIVERSE_MODELS[0];
  const challengeBanner = renderChallengeBanner(activeModelKey, modelState[activeModelKey] || {});

  const modelHtml = renderTool(activeModelKey, modelState, { locked: false });

  return `
    <div class="universe-hub-container" data-universe-root="true" data-cat="${activeCategory}" data-model="${activeModelKey}">
      <div class="universe-header">
        <div class="universe-brand">
          <span class="universe-logo-icon">🌌</span>
          <div>
            <h2 class="universe-title">EduWonderLab Math Universe</h2>
            <p class="universe-subtitle">Award-Winning Direct-Manipulation Models &amp; Conceptual Playgrounds</p>
          </div>
        </div>
        <div class="universe-metrics">
          <span class="universe-metric-pill">🏆 ${completed.size} / 8 Quests Solved</span>
          <span class="universe-metric-pill" style="background:#eff6ff; color:#1e40af">⚡ 16 Interactive Manipulatives</span>
        </div>
      </div>

      <!-- Category Filter Pills -->
      <div class="universe-category-nav" role="tablist">
        <button type="button" class="univ-cat-pill ${activeCategory === "all" ? "active" : ""}" data-cat="all">🌟 All Models (16)</button>
        <button type="button" class="univ-cat-pill ${activeCategory === "numbers" ? "active" : ""}" data-cat="numbers">🔢 Number Sense</button>
        <button type="button" class="univ-cat-pill ${activeCategory === "geometry" ? "active" : ""}" data-cat="geometry">📐 Geometry &amp; Spatial</button>
        <button type="button" class="univ-cat-pill ${activeCategory === "algebra" ? "active" : ""}" data-cat="algebra">⚙️ Algebra &amp; Functions</button>
        <button type="button" class="univ-cat-pill ${activeCategory === "stats" ? "active" : ""}" data-cat="stats">📊 Stats &amp; Probability</button>
      </div>

      <!-- Main Stage Grid: Interactive Studio on Left, Model Gallery on Right -->
      <div class="universe-stage-grid">
        <!-- Active Model Playground -->
        <div class="universe-main-stage">
          <div class="universe-active-meta">
            <div class="universe-active-title-row">
              <span class="universe-active-icon">${activeModel.icon}</span>
              <div>
                <h3 class="universe-active-name">${esc(activeModel.title)}</h3>
                <div class="universe-active-tags">
                  <span class="univ-tag-pill" style="background:#ecfdf5; color:#065f46">${esc(activeModel.grades)}</span>
                  <span class="univ-tag-pill" style="background:#eff6ff; color:#1e40af">${esc(activeModel.standard)}</span>
                </div>
              </div>
            </div>
            <p class="universe-active-desc">${esc(activeModel.desc)}</p>
          </div>

          ${challengeBanner}

          <div class="universe-tool-mount" id="universe-tool-mount">
            ${modelHtml}
          </div>
        </div>

        <!-- Scrollable Model Gallery Drawer -->
        <div class="universe-gallery-sidebar">
          <div class="univ-gallery-header">
            <strong>Model Catalog</strong>
            <span>${filteredModels.length} tools</span>
          </div>
          <div class="univ-cards-list">
            ${filteredModels.map((m) => {
              const isCurrent = m.key === activeModelKey;
              return `
                <div class="univ-model-card ${isCurrent ? "is-selected" : ""}" data-model-card="${m.key}">
                  <div class="univ-card-top">
                    <span class="univ-card-icon">${m.icon}</span>
                    <span class="univ-card-grades">${esc(m.grades)}</span>
                  </div>
                  <h4 class="univ-card-title">${esc(m.title)}</h4>
                  <p class="univ-card-desc">${esc(m.desc)}</p>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function mountUniverseHub(container, state = {}) {
  if (!container) return;
  const root = container.querySelector('[data-universe-root="true"]');
  if (!root) return;

  const currentCat = root.dataset.cat || "all";
  const currentModel = root.dataset.model || "algebraTiles";
  const modelState = state.modelState || defaults();

  // Mount the active tool in the stage
  const mountStageTool = (key, stageEl) => {
    if (key === "slicer") mountFractionSlicer(stageEl);
    if (key === "coord") mountCoordinateExplorer(stageEl);
    if (key === "triShear") mountTriangleShear(stageEl);
    if (key === "pvMat") mountBase10Regrouping(stageEl);
    if (key === "ratioScale") mountRatioScaler(stageEl);
    if (key === "angle") mountAngleProtractor(stageEl);
    if (key === "primeLab") mountPrimeFactorLab(stageEl);
    if (key === "probSpinner") mountProbabilitySandbox(stageEl);
    if (key === "net3d") mountNet3DFolder(stageEl);
    if (key === "funcMach") mountFunctionMachine(stageEl);
    if (key === "rateComp") mountUnitRateComparator(stageEl);
    if (key === "circlePi") mountCirclePiLab(stageEl);
    if (key === "pythagoras") mountPythagorasLab(stageEl);
    if (key === "boxPlot") mountBoxWhiskerPlot(stageEl);
    if (key === "intVector") mountIntegerVectorHops(stageEl);
    if (key === "algebraTiles") mountAlgebraTilesLab(stageEl);
    if (key === "dilation") mountDilationTransformLab(stageEl);
    if (key === "proofWords") mountProofWithoutWords(stageEl);
    if (key === "trigWave") mountTrigWaveStudio(stageEl);

    // Watch for challenge completion
    stageEl.addEventListener("input", () => {
      checkAndTriggerReward(root, key, modelState[key] || {});
    });
  };

  const stageMount = root.querySelector("#universe-tool-mount");
  if (stageMount) {
    mountStageTool(currentModel, stageMount);
  }

  // Category filter tabs
  root.querySelectorAll("[data-cat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cat = btn.dataset.cat;
      root.outerHTML = renderUniverseHub({ activeCategory: cat, activeModelKey: currentModel, modelState });
      mountUniverseHub(container, { modelState });
    });
  });

  // Model selection cards
  root.querySelectorAll("[data-model-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const key = card.dataset.modelCard;
      root.outerHTML = renderUniverseHub({ activeCategory: currentCat, activeModelKey: key, modelState });
      mountUniverseHub(container, { modelState });
    });
  });
}

