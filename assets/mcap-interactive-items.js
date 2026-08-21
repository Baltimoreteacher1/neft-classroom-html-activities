/**
 * MCAP & State Assessment Interactive Items Engine
 * Programmatic SVG manipulatives & deterministic CBT item widgets.
 * Strict compliance with Global Development Rules:
 * - Programmatic inline SVG with style="background:white"
 * - Safe drag-and-drop with snap-to-target and touch support
 * - Deterministic UI state machine
 */
(function (window) {
  "use strict";

  const MCAPInteractive = {
    // 1. Interactive Coordinate Plane Plotter (6.NS.C.8, 6.G.A.3)
    renderCoordinatePlane: function (containerId, options = {}) {
      const container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!container) return null;

      const minX = options.minX ?? -6;
      const maxX = options.maxX ?? 6;
      const minY = options.minY ?? -6;
      const maxY = options.maxY ?? 6;
      const width = options.width ?? 360;
      const height = options.height ?? 360;
      const padding = 30;

      const state = {
        points: options.initialPoints ? [...options.initialPoints] : [],
        targetPoints: options.targetPoints || [],
        polygon: options.polygon || false,
        onPointChange: options.onPointChange || null,
      };

      const scaleX = (x) => padding + ((x - minX) / (maxX - minX)) * (width - 2 * padding);
      const scaleY = (y) =>
        height - padding - ((y - minY) / (maxY - minY)) * (height - 2 * padding);
      const unscaleX = (px) =>
        Math.round(minX + ((px - padding) / (width - 2 * padding)) * (maxX - minX));
      const unscaleY = (py) =>
        Math.round(minY + ((height - padding - py) / (height - 2 * padding)) * (maxY - minY));

      function draw() {
        let svg =
          '<svg width="' +
          width +
          '" height="' +
          height +
          '" viewBox="0 0 ' +
          width +
          " " +
          height +
          '" style="background:white; border:1px solid #cbd5e1; border-radius:8px; display:block; margin:0 auto; user-select:none; touch-action:none;" role="img" aria-label="Interactive Coordinate Plane">';

        for (let x = minX; x <= maxX; x++) {
          const px = scaleX(x);
          const isAxis = x === 0;
          svg +=
            '<line x1="' +
            px +
            '" y1="' +
            padding +
            '" x2="' +
            px +
            '" y2="' +
            (height - padding) +
            '" stroke="' +
            (isAxis ? "#1e293b" : "#e2e8f0") +
            '" stroke-width="' +
            (isAxis ? 2 : 1) +
            '" />';
          if (x !== 0 && x % 2 === 0) {
            svg +=
              '<text x="' +
              px +
              '" y="' +
              (scaleY(0) + 14) +
              '" font-size="10" font-family="system-ui, sans-serif" text-anchor="middle" fill="#64748b">' +
              x +
              "</text>";
          }
        }

        for (let y = minY; y <= maxY; y++) {
          const py = scaleY(y);
          const isAxis = y === 0;
          svg +=
            '<line x1="' +
            padding +
            '" y1="' +
            py +
            '" x2="' +
            (width - padding) +
            '" y2="' +
            py +
            '" stroke="' +
            (isAxis ? "#1e293b" : "#e2e8f0") +
            '" stroke-width="' +
            (isAxis ? 2 : 1) +
            '" />';
          if (y !== 0 && y % 2 === 0) {
            svg +=
              '<text x="' +
              (scaleX(0) - 8) +
              '" y="' +
              (py + 3) +
              '" font-size="10" font-family="system-ui, sans-serif" text-anchor="end" fill="#64748b">' +
              y +
              "</text>";
          }
        }

        svg +=
          '<text x="' +
          (width - padding + 15) +
          '" y="' +
          (scaleY(0) + 4) +
          '" font-size="12" font-weight="700" font-family="system-ui, sans-serif" fill="#0f172a">x</text>';
        svg +=
          '<text x="' +
          scaleX(0) +
          '" y="' +
          (padding - 10) +
          '" font-size="12" font-weight="700" font-family="system-ui, sans-serif" text-anchor="middle" fill="#0f172a">y</text>';

        svg +=
          '<text x="' +
          (scaleX(maxX) - 16) +
          '" y="' +
          (scaleY(maxY) + 20) +
          '" font-size="11" font-weight="600" fill="#94a3b8">I</text>';
        svg +=
          '<text x="' +
          (scaleX(minX) + 16) +
          '" y="' +
          (scaleY(maxY) + 20) +
          '" font-size="11" font-weight="600" fill="#94a3b8">II</text>';
        svg +=
          '<text x="' +
          (scaleX(minX) + 16) +
          '" y="' +
          (scaleY(minY) - 12) +
          '" font-size="11" font-weight="600" fill="#94a3b8">III</text>';
        svg +=
          '<text x="' +
          (scaleX(maxX) - 16) +
          '" y="' +
          (scaleY(minY) - 12) +
          '" font-size="11" font-weight="600" fill="#94a3b8">IV</text>';

        if (state.points.length > 2 && state.polygon) {
          const polyPoints = state.points.map((p) => scaleX(p.x) + "," + scaleY(p.y)).join(" ");
          svg +=
            '<polygon points="' +
            polyPoints +
            '" fill="rgba(13, 148, 136, 0.2)" stroke="#0d9488" stroke-width="2" />';
        }

        if (state.points.length > 1 && !state.polygon) {
          for (let i = 0; i < state.points.length - 1; i++) {
            svg +=
              '<line x1="' +
              scaleX(state.points[i].x) +
              '" y1="' +
              scaleY(state.points[i].y) +
              '" x2="' +
              scaleX(state.points[i + 1].x) +
              '" y2="' +
              scaleY(state.points[i + 1].y) +
              '" stroke="#0d9488" stroke-width="2" />';
          }
        }

        state.points.forEach((pt, idx) => {
          const px = scaleX(pt.x);
          const py = scaleY(pt.y);
          const label = pt.label || String.fromCharCode(65 + idx);
          svg += '<g class="mcap-plot-point" data-index="' + idx + '" style="cursor:grab;">';
          svg +=
            '<circle cx="' +
            px +
            '" cy="' +
            py +
            '" r="7" fill="#0d9488" stroke="#ffffff" stroke-width="2" />';
          svg +=
            '<text x="' +
            (px + 10) +
            '" y="' +
            (py - 8) +
            '" font-size="11" font-weight="700" font-family="system-ui, sans-serif" fill="#0f766e">' +
            label +
            " (" +
            pt.x +
            ", " +
            pt.y +
            ")</text>";
          svg += "</g>";
        });

        svg += "</svg>";

        let html = '<div class="mcap-plane-widget" style="margin-bottom:12px;">' + svg;
        html +=
          '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:13px; color:#475569;">';
        html +=
          "<span>Plotted Points: <strong>" +
          (state.points.map((p) => "(" + p.x + ", " + p.y + ")").join(", ") ||
            "None (click grid to plot)") +
          "</strong></span>";
        html +=
          '<button type="button" class="mcap-reset-btn" style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:6px; padding:4px 10px; cursor:pointer; font-weight:600; font-size:12px;">Clear Points</button>';
        html += "</div></div>";

        container.innerHTML = html;
        attachEvents();
      }

      function attachEvents() {
        const svgEl = container.querySelector("svg");
        const resetBtn = container.querySelector(".mcap-reset-btn");

        if (resetBtn) {
          resetBtn.onclick = () => {
            state.points = [];
            draw();
            if (state.onPointChange) state.onPointChange(state.points);
          };
        }

        if (!svgEl) return;

        svgEl.addEventListener("pointerdown", (e) => {
          const rect = svgEl.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const gridX = Math.max(minX, Math.min(maxX, unscaleX(clickX)));
          const gridY = Math.max(minY, Math.min(maxY, unscaleY(clickY)));

          const existingIdx = state.points.findIndex((p) => p.x === gridX && p.y === gridY);
          if (existingIdx >= 0) {
            state.points.splice(existingIdx, 1);
          } else {
            if (options.maxPoints && state.points.length >= options.maxPoints) {
              state.points.shift();
            }
            state.points.push({ x: gridX, y: gridY });
          }

          draw();
          if (state.onPointChange) state.onPointChange(state.points);
        });
      }

      draw();
      return {
        getPoints: () => [...state.points],
        setPoints: (pts) => {
          state.points = [...pts];
          draw();
        },
      };
    },

    // 2. Visual Fraction Division Modeler (6.NS.A.1)
    renderFractionModeler: function (containerId, options = {}) {
      const container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!container) return null;

      const dividend = options.dividend || { num: 3, den: 4 };
      const divisor = options.divisor || { num: 1, den: 8 };
      const width = options.width || 420;
      const height = 180;

      const state = {
        subdivisions: options.initialSubdivisions || dividend.den,
        shadedSegments: options.initialShaded || dividend.num,
      };

      function draw() {
        const barW = width - 40;
        const barH = 36;
        const startX = 20;

        let svg =
          '<svg width="' +
          width +
          '" height="' +
          height +
          '" viewBox="0 0 ' +
          width +
          " " +
          height +
          '" style="background:white; border:1px solid #cbd5e1; border-radius:8px; display:block; margin:0 auto;" role="img" aria-label="Fraction Division Model">';
        svg +=
          '<text x="' +
          startX +
          '" y="22" font-size="12" font-weight="700" font-family="system-ui" fill="#1e293b">1 Whole Unit (' +
          dividend.num +
          "/" +
          dividend.den +
          " shaded):</text>";
        svg +=
          '<rect x="' +
          startX +
          '" y="30" width="' +
          barW +
          '" height="' +
          barH +
          '" fill="#f8fafc" stroke="#64748b" stroke-width="2" rx="4" />';

        const segW = barW / state.subdivisions;
        for (let i = 0; i < state.subdivisions; i++) {
          const isShaded = i < state.shadedSegments;
          const fill = isShaded ? "#14b8a6" : "#ffffff";
          svg +=
            '<rect x="' +
            (startX + i * segW) +
            '" y="30" width="' +
            segW +
            '" height="' +
            barH +
            '" fill="' +
            fill +
            '" stroke="#0f766e" stroke-width="1.5" />';
          svg +=
            '<text x="' +
            (startX + i * segW + segW / 2) +
            '" y="53" font-size="11" font-weight="600" text-anchor="middle" fill="' +
            (isShaded ? "#ffffff" : "#94a3b8") +
            '">1/' +
            state.subdivisions +
            "</text>";
        }

        svg +=
          '<text x="' +
          startX +
          '" y="95" font-size="12" font-weight="700" font-family="system-ui" fill="#1e293b">Partitioned into groups of ' +
          divisor.num +
          "/" +
          divisor.den +
          ":</text>";
        svg +=
          '<rect x="' +
          startX +
          '" y="105" width="' +
          barW +
          '" height="' +
          barH +
          '" fill="#f8fafc" stroke="#64748b" stroke-width="2" rx="4" />';

        const divSegW = barW / divisor.den;
        for (let i = 0; i < divisor.den; i++) {
          const isInDividend = i / divisor.den < state.shadedSegments / state.subdivisions;
          const groupNum = Math.floor(i / divisor.num) + 1;
          const fill = isInDividend ? (groupNum % 2 === 0 ? "#38bdf8" : "#818cf8") : "#ffffff";
          svg +=
            '<rect x="' +
            (startX + i * divSegW) +
            '" y="105" width="' +
            divSegW +
            '" height="' +
            barH +
            '" fill="' +
            fill +
            '" stroke="#334155" stroke-width="1.5" />';
          if (isInDividend) {
            svg +=
              '<text x="' +
              (startX + i * divSegW + divSegW / 2) +
              '" y="128" font-size="10" font-weight="700" text-anchor="middle" fill="#ffffff">#' +
              groupNum +
              "</text>";
          }
        }

        const quotient = dividend.num / dividend.den / (divisor.num / divisor.den);
        svg +=
          '<text x="' +
          startX +
          '" y="165" font-size="13" font-weight="700" font-family="system-ui" fill="#0f766e">Model Shows: ' +
          dividend.num +
          "/" +
          dividend.den +
          " ÷ " +
          divisor.num +
          "/" +
          divisor.den +
          " = " +
          quotient +
          " groups</text>";
        svg += "</svg>";

        container.innerHTML = '<div class="mcap-fraction-widget">' + svg + "</div>";
      }

      draw();
      return { redraw: draw };
    },

    // 3. Inequality Number Line Ray Grapher (6.EE.B.8)
    renderInequalityGrapher: function (containerId, options = {}) {
      const container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!container) return null;

      const min = options.min ?? 80;
      const max = options.max ?? 90;
      const width = options.width ?? 400;
      const height = 90;
      const padding = 30;

      const state = {
        point: options.initialPoint ?? 85,
        circleType: options.initialCircleType ?? "closed",
        direction: options.initialDirection ?? "right",
        onChange: options.onChange ?? null,
      };

      const scale = (val) => padding + ((val - min) / (max - min)) * (width - 2 * padding);
      const unscale = (px) =>
        Math.round(min + ((px - padding) / (width - 2 * padding)) * (max - min));

      function draw() {
        const lineY = 40;
        let svg =
          '<svg width="' +
          width +
          '" height="' +
          height +
          '" viewBox="0 0 ' +
          width +
          " " +
          height +
          '" style="background:white; border:1px solid #cbd5e1; border-radius:8px; display:block; margin:0 auto; user-select:none; touch-action:none;" role="img" aria-label="Interactive Inequality Number Line">';

        svg +=
          '<line x1="' +
          (padding - 10) +
          '" y1="' +
          lineY +
          '" x2="' +
          (width - padding + 10) +
          '" y2="' +
          lineY +
          '" stroke="#334155" stroke-width="3" />';
        svg +=
          '<polygon points="' +
          (padding - 14) +
          "," +
          lineY +
          " " +
          (padding - 6) +
          "," +
          (lineY - 4) +
          " " +
          (padding - 6) +
          "," +
          (lineY + 4) +
          '" fill="#334155" />';
        svg +=
          '<polygon points="' +
          (width - padding + 14) +
          "," +
          lineY +
          " " +
          (width - padding + 6) +
          "," +
          (lineY - 4) +
          " " +
          (width - padding + 6) +
          "," +
          (lineY + 4) +
          '" fill="#334155" />';

        for (let v = min; v <= max; v++) {
          const px = scale(v);
          svg +=
            '<line x1="' +
            px +
            '" y1="' +
            (lineY - 6) +
            '" x2="' +
            px +
            '" y2="' +
            (lineY + 6) +
            '" stroke="#64748b" stroke-width="1.5" />';
          svg +=
            '<text x="' +
            px +
            '" y="' +
            (lineY + 22) +
            '" font-size="11" font-family="system-ui" text-anchor="middle" fill="#334155">' +
            v +
            "</text>";
        }

        const ptX = scale(state.point);
        if (state.direction === "right") {
          svg +=
            '<line x1="' +
            ptX +
            '" y1="' +
            lineY +
            '" x2="' +
            (width - padding + 10) +
            '" y2="' +
            lineY +
            '" stroke="#2563eb" stroke-width="6" stroke-linecap="round" />';
          svg +=
            '<polygon points="' +
            (width - padding + 14) +
            "," +
            lineY +
            " " +
            (width - padding + 4) +
            "," +
            (lineY - 6) +
            " " +
            (width - padding + 4) +
            "," +
            (lineY + 6) +
            '" fill="#2563eb" />';
        } else if (state.direction === "left") {
          svg +=
            '<line x1="' +
            ptX +
            '" y1="' +
            lineY +
            '" x2="' +
            (padding - 10) +
            '" y2="' +
            lineY +
            '" stroke="#2563eb" stroke-width="6" stroke-linecap="round" />';
          svg +=
            '<polygon points="' +
            (padding - 14) +
            "," +
            lineY +
            " " +
            (padding - 4) +
            "," +
            (lineY - 6) +
            " " +
            (padding - 4) +
            "," +
            (lineY + 6) +
            '" fill="#2563eb" />';
        }

        const fill = state.circleType === "closed" ? "#2563eb" : "#ffffff";
        svg +=
          '<circle cx="' +
          ptX +
          '" cy="' +
          lineY +
          '" r="7" fill="' +
          fill +
          '" stroke="#2563eb" stroke-width="3" style="cursor:ew-resize;" />';
        svg += "</svg>";

        let html = '<div class="mcap-inequality-widget">' + svg;
        html +=
          '<div style="display:flex; gap:10px; justify-content:center; align-items:center; margin-top:10px; font-size:13px;">';
        html +=
          '<button type="button" class="mcap-circle-toggle" style="padding:4px 10px; border-radius:6px; border:1px solid #cbd5e1; background:#f8fafc; font-weight:600; cursor:pointer;">Circle: <strong>' +
          (state.circleType === "closed" ? "● Closed (≤, ≥)" : "○ Open (<, >)") +
          "</strong></button>";
        html +=
          '<button type="button" class="mcap-dir-left" style="padding:4px 10px; border-radius:6px; border:1px solid #cbd5e1; background:' +
          (state.direction === "left" ? "#dbeafe" : "#f8fafc") +
          '; font-weight:600; cursor:pointer;">Ray ← (x < a)</button>';
        html +=
          '<button type="button" class="mcap-dir-right" style="padding:4px 10px; border-radius:6px; border:1px solid #cbd5e1; background:' +
          (state.direction === "right" ? "#dbeafe" : "#f8fafc") +
          '; font-weight:600; cursor:pointer;">Ray → (x > a)</button>';
        html += "</div></div>";

        container.innerHTML = html;
        attachEvents();
      }

      function attachEvents() {
        const svgEl = container.querySelector("svg");
        const circleToggle = container.querySelector(".mcap-circle-toggle");
        const dirLeft = container.querySelector(".mcap-dir-left");
        const dirRight = container.querySelector(".mcap-dir-right");

        if (circleToggle) {
          circleToggle.onclick = () => {
            state.circleType = state.circleType === "closed" ? "open" : "closed";
            draw();
            if (state.onChange) state.onChange(state);
          };
        }
        if (dirLeft) {
          dirLeft.onclick = () => {
            state.direction = "left";
            draw();
            if (state.onChange) state.onChange(state);
          };
        }
        if (dirRight) {
          dirRight.onclick = () => {
            state.direction = "right";
            draw();
            if (state.onChange) state.onChange(state);
          };
        }

        if (svgEl) {
          svgEl.addEventListener("pointerdown", (e) => {
            const rect = svgEl.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const val = Math.max(min, Math.min(max, unscale(clickX)));
            state.point = val;
            draw();
            if (state.onChange) state.onChange(state);
          });
        }
      }

      draw();
      return {
        getState: () => ({ ...state }),
        setState: (newState) => {
          Object.assign(state, newState);
          draw();
        },
      };
    },

    // 4. Box Plot & Dot Plot Data Workbench (6.SP.B.4, 6.SP.B.5)
    renderBoxPlot: function (containerId, options = {}) {
      const container =
        typeof containerId === "string" ? document.getElementById(containerId) : containerId;
      if (!container) return null;

      const min = options.min ?? 70;
      const max = options.max ?? 100;
      const q1 = options.q1 ?? 76;
      const median = options.median ?? 85;
      const q3 = options.q3 ?? 94;
      const width = options.width ?? 420;
      const height = 110;
      const padding = 30;

      const scale = (val) => padding + ((val - min) / (max - min)) * (width - 2 * padding);

      let svg =
        '<svg width="' +
        width +
        '" height="' +
        height +
        '" viewBox="0 0 ' +
        width +
        " " +
        height +
        '" style="background:white; border:1px solid #cbd5e1; border-radius:8px; display:block; margin:0 auto;" role="img" aria-label="Interactive Box Plot">';

      const lineY = 80;
      const boxTop = 24;
      const boxH = 34;

      svg +=
        '<line x1="' +
        padding +
        '" y1="' +
        lineY +
        '" x2="' +
        (width - padding) +
        '" y2="' +
        lineY +
        '" stroke="#334155" stroke-width="2" />';
      for (let v = min; v <= max; v += max - min > 15 ? 5 : 2) {
        const px = scale(v);
        svg +=
          '<line x1="' +
          px +
          '" y1="' +
          (lineY - 4) +
          '" x2="' +
          px +
          '" y2="' +
          (lineY + 4) +
          '" stroke="#64748b" stroke-width="1" />';
        svg +=
          '<text x="' +
          px +
          '" y="' +
          (lineY + 16) +
          '" font-size="10" font-family="system-ui" text-anchor="middle" fill="#475569">' +
          v +
          "</text>";
      }

      const q1X = scale(q1);
      const q3X = scale(q3);
      const medX = scale(median);
      const minX = scale(min);
      const maxX = scale(max);

      svg +=
        '<line x1="' +
        minX +
        '" y1="' +
        (boxTop + boxH / 2) +
        '" x2="' +
        q1X +
        '" y2="' +
        (boxTop + boxH / 2) +
        '" stroke="#0f766e" stroke-width="2" />';
      svg +=
        '<line x1="' +
        minX +
        '" y1="' +
        (boxTop + 6) +
        '" x2="' +
        minX +
        '" y2="' +
        (boxTop + boxH - 6) +
        '" stroke="#0f766e" stroke-width="2" />';

      svg +=
        '<line x1="' +
        q3X +
        '" y1="' +
        (boxTop + boxH / 2) +
        '" x2="' +
        maxX +
        '" y2="' +
        (boxTop + boxH / 2) +
        '" stroke="#0f766e" stroke-width="2" />';
      svg +=
        '<line x1="' +
        maxX +
        '" y1="' +
        (boxTop + 6) +
        '" x2="' +
        maxX +
        '" y2="' +
        (boxTop + boxH - 6) +
        '" stroke="#0f766e" stroke-width="2" />';

      svg +=
        '<rect x="' +
        q1X +
        '" y="' +
        boxTop +
        '" width="' +
        (q3X - q1X) +
        '" height="' +
        boxH +
        '" fill="#ccfbf1" stroke="#0f766e" stroke-width="2" rx="3" />';
      svg +=
        '<line x1="' +
        medX +
        '" y1="' +
        boxTop +
        '" x2="' +
        medX +
        '" y2="' +
        (boxTop + boxH) +
        '" stroke="#0f766e" stroke-width="3" />';

      svg +=
        '<text x="' +
        minX +
        '" y="' +
        (boxTop - 6) +
        '" font-size="10" font-weight="700" text-anchor="middle" fill="#0f766e">Min: ' +
        min +
        "</text>";
      svg +=
        '<text x="' +
        q1X +
        '" y="' +
        (boxTop - 6) +
        '" font-size="10" font-weight="700" text-anchor="middle" fill="#0f766e">Q1: ' +
        q1 +
        "</text>";
      svg +=
        '<text x="' +
        medX +
        '" y="' +
        (boxTop - 6) +
        '" font-size="10" font-weight="700" text-anchor="middle" fill="#0f766e">Med: ' +
        median +
        "</text>";
      svg +=
        '<text x="' +
        q3X +
        '" y="' +
        (boxTop - 6) +
        '" font-size="10" font-weight="700" text-anchor="middle" fill="#0f766e">Q3: ' +
        q3 +
        "</text>";
      svg +=
        '<text x="' +
        maxX +
        '" y="' +
        (boxTop - 6) +
        '" font-size="10" font-weight="700" text-anchor="middle" fill="#0f766e">Max: ' +
        max +
        "</text>";

      svg += "</svg>";

      container.innerHTML = '<div class="mcap-box-plot-widget">' + svg + "</div>";
    },
  };

  window.MCAPInteractive = MCAPInteractive;
})(window);
