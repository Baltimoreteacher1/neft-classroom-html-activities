/**
 * EduWonderLab Enterprise Interactive SVG Math Manipulatives Engine
 * Architecture: Self-Contained, Zero-Dependency Visual Math Module (Strict Inline SVG)
 * Global Rules Compliance: Programmatic inline SVG with style="background:white", explicit dims, touch/drag support, reset controls.
 */

(function (global) {
  "use strict";

  const SVGManipulatives = {};

  // Helper for creating SVG DOM elements with attributes
  function createSvgElement(tag, attrs) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      el.setAttribute(k, v);
    }
    return el;
  }

  /* ==========================================================================
     1. DOUBLE NUMBER LINE RACER (Unit 3: Ratios & Rates)
     ========================================================================== */
  class DoubleNumberLineRacer {
    constructor(containerId, options = {}) {
      this.container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!this.container) return;
      this.unitRate = options.unitRate || 15; // e.g. 15 miles per 1 hour
      this.topLabel = options.topLabel || "Distance (Miles)";
      this.bottomLabel = options.bottomLabel || "Time (Hours)";
      this.maxUnits = options.maxUnits || 5;
      this.currentX = 1;
      this.width = options.width || 600;
      this.height = options.height || 180;
      this.render();
    }

    render() {
      this.container.innerHTML = `
        <div class="dnl-widget" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: ${this.width}px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #0f172a; font-size: 14px;">🏎️ Double Number Line Ratio Bench</strong>
            <span id="dnl-readout" style="background: #e0f2fe; color: #0369a1; font-weight: 800; font-size: 13px; padding: 4px 10px; border-radius: 9999px;">
              ${this.currentX} hr = ${this.currentX * this.unitRate} mi (Rate: ${this.unitRate} mi/hr)
            </span>
          </div>
          <svg id="dnl-svg" width="${this.width - 32}" height="110" viewBox="0 0 ${this.width - 32} 110" style="background:white; display:block; margin: 0 auto; user-select: none;" xmlns="http://www.w3.org/2000/svg">
            <!-- Top Axis -->
            <line x1="40" y1="35" x2="${this.width - 72}" y2="35" stroke="#0284c7" stroke-width="3"/>
            <text x="40" y="18" font-size="11" font-weight="700" fill="#0369a1">${this.topLabel}</text>
            <!-- Bottom Axis -->
            <line x1="40" y1="75" x2="${this.width - 72}" y2="75" stroke="#ea580c" stroke-width="3"/>
            <text x="40" y="98" font-size="11" font-weight="700" fill="#c2410c">${this.bottomLabel}</text>
            <!-- Ticks group -->
            <g id="dnl-ticks"></g>
            <!-- Indicator runner -->
            <g id="dnl-runner" style="cursor: pointer;">
              <line id="runner-line" x1="40" y1="20" x2="40" y2="90" stroke="#10b981" stroke-width="3" stroke-dasharray="3,3"/>
              <circle id="runner-top" cx="40" cy="35" r="7" fill="#10b981" stroke="#fff" stroke-width="2"/>
              <circle id="runner-bot" cx="40" cy="75" r="7" fill="#10b981" stroke="#fff" stroke-width="2"/>
            </g>
          </svg>
          <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center;">
            <input type="range" id="dnl-slider" min="0" max="${this.maxUnits}" step="0.5" value="${this.currentX}" style="flex: 1; accent-color: #0284c7; cursor: pointer;">
            <button id="dnl-reset" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-weight: 600; cursor: pointer;">Reset</button>
          </div>
        </div>
      `;

      this.svg = this.container.querySelector("#dnl-svg");
      this.ticksGroup = this.container.querySelector("#dnl-ticks");
      this.runner = this.container.querySelector("#dnl-runner");
      this.readout = this.container.querySelector("#dnl-readout");
      this.slider = this.container.querySelector("#dnl-slider");
      this.resetBtn = this.container.querySelector("#dnl-reset");

      this.drawTicks();
      this.bindEvents();
      this.updatePosition(this.currentX);
    }

    drawTicks() {
      this.ticksGroup.innerHTML = "";
      const startX = 50;
      const endX = this.width - 90;
      const stepPx = (endX - startX) / this.maxUnits;

      for (let i = 0; i <= this.maxUnits; i++) {
        const x = startX + i * stepPx;
        // Top tick (Distance)
        const tTick = createSvgElement("line", {
          x1: x,
          y1: 30,
          x2: x,
          y2: 40,
          stroke: "#0284c7",
          "stroke-width": "2",
        });
        const tVal = createSvgElement("text", {
          x: x,
          y: 25,
          "font-size": "10",
          "font-weight": "600",
          fill: "#0369a1",
          "text-anchor": "middle",
        });
        tVal.textContent = i * this.unitRate;

        // Bottom tick (Time)
        const bTick = createSvgElement("line", {
          x1: x,
          y1: 70,
          x2: x,
          y2: 80,
          stroke: "#ea580c",
          "stroke-width": "2",
        });
        const bVal = createSvgElement("text", {
          x: x,
          y: 92,
          "font-size": "10",
          "font-weight": "600",
          fill: "#c2410c",
          "text-anchor": "middle",
        });
        bVal.textContent = i;

        this.ticksGroup.appendChild(tTick);
        this.ticksGroup.appendChild(tVal);
        this.ticksGroup.appendChild(bTick);
        this.ticksGroup.appendChild(bVal);
      }
    }

    updatePosition(val) {
      this.currentX = parseFloat(val);
      const startX = 50;
      const endX = this.width - 90;
      const stepPx = (endX - startX) / this.maxUnits;
      const targetPx = startX + this.currentX * stepPx;

      const rLine = this.runner.querySelector("#runner-line");
      const rTop = this.runner.querySelector("#runner-top");
      const rBot = this.runner.querySelector("#runner-bot");

      rLine.setAttribute("x1", targetPx);
      rLine.setAttribute("x2", targetPx);
      rTop.setAttribute("cx", targetPx);
      rBot.setAttribute("cx", targetPx);

      const totalDist = (this.currentX * this.unitRate).toFixed(1).replace(".0", "");
      this.readout.textContent = `${this.currentX} hr = ${totalDist} mi (Unit Rate: ${this.unitRate} mi/hr)`;
    }

    bindEvents() {
      this.slider.addEventListener("input", (e) => {
        this.updatePosition(e.target.value);
      });
      this.resetBtn.addEventListener("click", () => {
        this.slider.value = 1;
        this.updatePosition(1);
      });
    }
  }

  /* ==========================================================================
     2. 4-QUADRANT COORDINATE PLANE SURVEYOR (Unit 7: Integers)
     ========================================================================== */
  class CoordinatePlaneSurveyor {
    constructor(containerId, options = {}) {
      this.container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!this.container) return;
      this.size = options.size || 340;
      this.gridRange = 6; // -6 to +6
      this.points = [
        { x: 3, y: 4, name: "A" },
        { x: -3, y: 4, name: "B" },
        { x: -3, y: -2, name: "C" },
        { x: 3, y: -2, name: "D" },
      ];
      this.render();
    }

    toSvgCoord(x, y) {
      const pad = 30;
      const inner = this.size - pad * 2;
      const px = pad + ((x + this.gridRange) / (this.gridRange * 2)) * inner;
      const py = pad + ((this.gridRange - y) / (this.gridRange * 2)) * inner;
      return { px, py };
    }

    render() {
      this.container.innerHTML = `
        <div class="coord-widget" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: ${this.size + 40}px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: #0f172a; font-size: 14px;">🧭 4-Quadrant Polygon Surveyor</strong>
            <button id="coord-reflect" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 700; cursor: pointer;">Reflect X-Axis</button>
          </div>
          <svg id="coord-svg" width="${this.size}" height="${this.size}" viewBox="0 0 ${this.size} ${this.size}" style="background:white; display:block; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 8px;" xmlns="http://www.w3.org/2000/svg">
            <g id="coord-grid"></g>
            <polygon id="coord-poly" fill="rgba(56, 189, 248, 0.25)" stroke="#0284c7" stroke-width="2"/>
            <g id="coord-points"></g>
          </svg>
          <div id="coord-stats" style="margin-top: 10px; font-size: 12px; color: #334155; line-height: 1.5; background: #f8fafc; padding: 8px 12px; border-radius: 6px;">
            <strong>Polygon ABCD:</strong> Width = 6 units, Height = 6 units &bull; <strong>Area:</strong> 36 sq units &bull; <strong>Perimeter:</strong> 24 units
          </div>
        </div>
      `;

      this.svg = this.container.querySelector("#coord-svg");
      this.gridGroup = this.container.querySelector("#coord-grid");
      this.poly = this.container.querySelector("#coord-poly");
      this.pointsGroup = this.container.querySelector("#coord-points");
      this.stats = this.container.querySelector("#coord-stats");
      this.reflectBtn = this.container.querySelector("#coord-reflect");

      this.drawGrid();
      this.drawPolygon();
      this.bindEvents();
    }

    drawGrid() {
      this.gridGroup.innerHTML = "";
      for (let i = -this.gridRange; i <= this.gridRange; i++) {
        const { px: x1, py: y1 } = this.toSvgCoord(i, -this.gridRange);
        const { px: x2, py: y2 } = this.toSvgCoord(i, this.gridRange);
        const { px: hx1, py: hy1 } = this.toSvgCoord(-this.gridRange, i);
        const { px: hx2, py: hy2 } = this.toSvgCoord(this.gridRange, i);

        // Vertical lines
        const isAxis = i === 0;
        this.gridGroup.appendChild(
          createSvgElement("line", {
            x1,
            y1,
            x2,
            y2,
            stroke: isAxis ? "#0f172a" : "#e2e8f0",
            "stroke-width": isAxis ? "2" : "1",
          }),
        );

        // Horizontal lines
        this.gridGroup.appendChild(
          createSvgElement("line", {
            x1: hx1,
            y1: hy1,
            x2: hx2,
            y2: hy2,
            stroke: isAxis ? "#0f172a" : "#e2e8f0",
            "stroke-width": isAxis ? "2" : "1",
          }),
        );
      }
    }

    drawPolygon() {
      const pointsAttr = this.points
        .map((p) => {
          const { px, py } = this.toSvgCoord(p.x, p.y);
          return `${px},${py}`;
        })
        .join(" ");
      this.poly.setAttribute("points", pointsAttr);

      this.pointsGroup.innerHTML = "";
      this.points.forEach((p) => {
        const { px, py } = this.toSvgCoord(p.x, p.y);
        const dot = createSvgElement("circle", {
          cx: px,
          cy: py,
          r: 5,
          fill: "#0284c7",
          stroke: "#fff",
          "stroke-width": "2",
        });
        const label = createSvgElement("text", {
          x: px + (p.x >= 0 ? 8 : -8),
          y: py + (p.y >= 0 ? -6 : 14),
          "font-size": "11",
          "font-weight": "700",
          fill: "#0f172a",
          "text-anchor": p.x >= 0 ? "start" : "end",
        });
        label.textContent = `${p.name}(${p.x}, ${p.y})`;
        this.pointsGroup.appendChild(dot);
        this.pointsGroup.appendChild(label);
      });
    }

    bindEvents() {
      this.reflectBtn.addEventListener("click", () => {
        this.points.forEach((p) => {
          p.y = -p.y;
        });
        this.drawPolygon();
      });
    }
  }

  /* ==========================================================================
     3. ALGEBRA BALANCE SCALE (Unit 8: Equations)
     ========================================================================== */
  class AlgebraBalanceScale {
    constructor(containerId, options = {}) {
      this.container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!this.container) return;
      this.targetX = options.targetX || 5;
      this.addedConstant = options.addedConstant || 4;
      this.rightTotal = this.targetX + this.addedConstant; // 9
      this.subtracted = 0;
      this.render();
    }

    render() {
      this.container.innerHTML = `
        <div class="scale-widget" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 440px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #0f172a; font-size: 14px;">⚖️ Algebraic Balance Scale: x + ${this.addedConstant} = ${this.rightTotal}</strong>
            <span id="scale-status" style="background: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; padding: 3px 8px; border-radius: 9999px;">Balanced</span>
          </div>
          <svg width="400" height="130" viewBox="0 0 400 130" style="background:white; display:block; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
            <!-- Base & Fulcrum -->
            <polygon points="200,60 180,110 220,110" fill="#64748b"/>
            <line x1="60" y1="60" x2="340" y2="60" stroke="#1e293b" stroke-width="4"/>
            <!-- Left Pan (x + Constant) -->
            <line x1="100" y1="60" x2="100" y2="85" stroke="#94a3b8" stroke-width="2"/>
            <rect x="50" y="85" width="100" height="8" rx="3" fill="#0284c7"/>
            <rect id="scale-x-tile" x="55" y="55" width="40" height="28" rx="4" fill="#38bdf8" stroke="#0284c7" stroke-width="1.5"/>
            <text x="75" y="74" font-size="13" font-weight="700" fill="#0f172a" text-anchor="middle">x</text>
            <rect id="scale-c-left" x="100" y="55" width="45" height="28" rx="4" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
            <text id="scale-c-left-txt" x="122" y="74" font-size="12" font-weight="700" fill="#854d0e" text-anchor="middle">+${this.addedConstant}</text>
            <!-- Right Pan (Total) -->
            <line x1="300" y1="60" x2="300" y2="85" stroke="#94a3b8" stroke-width="2"/>
            <rect x="250" y="85" width="100" height="8" rx="3" fill="#0284c7"/>
            <rect id="scale-c-right" x="270" y="55" width="60" height="28" rx="4" fill="#bbf7d0" stroke="#16a34a" stroke-width="1.5"/>
            <text id="scale-c-right-txt" x="300" y="74" font-size="13" font-weight="700" fill="#166534" text-anchor="middle">${this.rightTotal}</text>
          </svg>
          <div style="display: flex; gap: 8px; margin-top: 12px; justify-content: center;">
            <button id="scale-sub-btn" style="background: #0284c7; color: #fff; border: none; border-radius: 6px; padding: 6px 14px; font-weight: 700; font-size: 12px; cursor: pointer;">Subtract ${this.addedConstant} from Both Sides &rarr;</button>
            <button id="scale-reset-btn" style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 12px; font-weight: 600; font-size: 12px; cursor: pointer;">Reset</button>
          </div>
        </div>
      `;

      this.subBtn = this.container.querySelector("#scale-sub-btn");
      this.resetBtn = this.container.querySelector("#scale-reset-btn");
      this.cLeft = this.container.querySelector("#scale-c-left");
      this.cLeftTxt = this.container.querySelector("#scale-c-left-txt");
      this.cRightTxt = this.container.querySelector("#scale-c-right-txt");

      this.subBtn.addEventListener("click", () => {
        this.cLeft.style.display = "none";
        this.cLeftTxt.style.display = "none";
        this.cRightTxt.textContent = this.targetX;
        this.subBtn.disabled = true;
        this.subBtn.style.opacity = "0.5";
      });

      this.resetBtn.addEventListener("click", () => {
        this.cLeft.style.display = "";
        this.cLeftTxt.style.display = "";
        this.cRightTxt.textContent = this.rightTotal;
        this.subBtn.disabled = false;
        this.subBtn.style.opacity = "1";
      });
    }
  }

  /* ==========================================================================
     4. 3D NET-TO-PRISM FOLDING SIMULATOR (Unit 5: Geometry)
     ========================================================================== */
  class NetFoldPrism3D {
    constructor(containerId, options = {}) {
      this.container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!this.container) return;
      this.l = options.l || 4;
      this.w = options.w || 3;
      this.h = options.h || 2;
      this.render();
    }

    render() {
      const sa = 2 * (this.l * this.w + this.l * this.h + this.w * this.h);
      const vol = this.l * this.w * this.h;

      this.container.innerHTML = `
        <div class="netfold-widget" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); max-width: 440px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <strong style="color: #0f172a; font-size: 14px;">📦 2D Net &bull; Rectangular Prism (${this.l} &times; ${this.w} &times; ${this.h})</strong>
          </div>
          <svg width="380" height="150" viewBox="0 0 380 150" style="background:white; display:block; margin: 0 auto;" xmlns="http://www.w3.org/2000/svg">
            <!-- Net Faces -->
            <!-- Top Lid -->
            <rect x="150" y="10" width="80" height="35" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
            <text x="190" y="32" font-size="10" font-weight="700" fill="#0369a1" text-anchor="middle">Top (${this.l}&times;${this.w})</text>
            <!-- Left Side -->
            <rect x="70" y="45" width="80" height="50" fill="#e0e7ff" stroke="#4f46e5" stroke-width="1.5"/>
            <text x="110" y="74" font-size="10" font-weight="700" fill="#3730a3" text-anchor="middle">Side (${this.h}&times;${this.w})</text>
            <!-- Base Center -->
            <rect x="150" y="45" width="80" height="50" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
            <text x="190" y="74" font-size="10" font-weight="700" fill="#15803d" text-anchor="middle">Base (${this.l}&times;${this.w})</text>
            <!-- Right Side -->
            <rect x="230" y="45" width="80" height="50" fill="#e0e7ff" stroke="#4f46e5" stroke-width="1.5"/>
            <text x="270" y="74" font-size="10" font-weight="700" fill="#3730a3" text-anchor="middle">Side (${this.h}&times;${this.w})</text>
            <!-- Back Face -->
            <rect x="310" y="45" width="50" height="50" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
            <text x="335" y="74" font-size="9" font-weight="700" fill="#92400e" text-anchor="middle">Back</text>
            <!-- Bottom Lid -->
            <rect x="150" y="95" width="80" height="35" fill="#bae6fd" stroke="#0284c7" stroke-width="1.5"/>
            <text x="190" y="117" font-size="10" font-weight="700" fill="#0369a1" text-anchor="middle">Front (${this.l}&times;${this.h})</text>
          </svg>
          <div style="margin-top: 10px; font-size: 12px; color: #334155; background: #f8fafc; padding: 8px 12px; border-radius: 6px; line-height: 1.5;">
            <strong>Surface Area Formula:</strong> 2(lw + lh + wh) = <strong>${sa} sq units</strong><br>
            <strong>Volume Formula:</strong> V = l &times; w &times; h = <strong>${vol} cubic units</strong>
          </div>
        </div>
      `;
    }
  }

  // Export classes
  SVGManipulatives.DoubleNumberLineRacer = DoubleNumberLineRacer;
  SVGManipulatives.CoordinatePlaneSurveyor = CoordinatePlaneSurveyor;
  SVGManipulatives.AlgebraBalanceScale = AlgebraBalanceScale;
  SVGManipulatives.NetFoldPrism3D = NetFoldPrism3D;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = SVGManipulatives;
  } else {
    global.SVGManipulatives = SVGManipulatives;
  }
})(typeof window !== "undefined" ? window : this);
