/*!
 * interactive-live-sim.js — Neft Lesson Platform · Ultra-Interactive Live Simulation Engine.
 *
 * Transforms static numbers, figures, and ratios in Learn It / Try It lesson sections
 * into live draggable objects with tooltips, magnet snap feedback, and live re-derivation.
 */
(function (global) {
  "use strict";

  if (global.NTLiveSim && global.NTLiveSim.__booted) return;

  var booted = false;

  function safeCall(fn) {
    try {
      return fn();
    } catch (_e) {
      return null;
    }
  }

  function init() {
    if (booted) return;
    booted = true;

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", setupSimulations);
    } else {
      setupSimulations();
    }
  }

  function setupSimulations() {
    var targets = document.querySelectorAll(
      ".learn-it, .try-it, .interactive-widget, .math-expression, .live-sim-container",
    );
    if (!targets.length) return;

    targets.forEach(function (container) {
      enhanceContainer(container);
    });
  }

  function enhanceContainer(container) {
    if (container.dataset.simEnhanced) return;
    container.dataset.simEnhanced = "true";

    var draggables = container.querySelectorAll(".sim-drag, [data-sim-value]");
    if (!draggables.length) {
      autoDetectNumbers(container);
      draggables = container.querySelectorAll(".live-sim-draggable");
    }

    draggables.forEach(function (el) {
      makeDraggable(el, container);
    });
  }

  function autoDetectNumbers(container) {
    var nodes = container.querySelectorAll("span.math-num, .ratio-term, [data-sim-num]");
    nodes.forEach(function (node) {
      var val = parseFloat(node.textContent.trim());
      if (!isNaN(val) && !node.classList.contains("live-sim-draggable")) {
        node.classList.add("live-sim-draggable");
        node.setAttribute("tabindex", "0");
        node.setAttribute("role", "slider");
        node.setAttribute("aria-valuenow", val);
        node.dataset.simValue = val;

        // Add live drag tooltip
        var tooltip = document.createElement("span");
        tooltip.className = "live-sim-tooltip";
        tooltip.textContent = "Drag to change: " + val;
        node.appendChild(tooltip);
      }
    });
  }

  function makeDraggable(el, container) {
    var startX = 0;
    var startVal = 0;
    var minVal = parseFloat(el.dataset.min || "1");
    var maxVal = parseFloat(el.dataset.max || "100");
    var step = parseFloat(el.dataset.step || "1");
    var tooltip = el.querySelector(".live-sim-tooltip");

    function updateValue(newVal) {
      newVal = Math.max(minVal, Math.min(maxVal, newVal));
      newVal = Math.round(newVal / step) * step;

      var currentVal = parseFloat(el.dataset.simValue || el.textContent);
      if (currentVal === newVal) return;

      el.dataset.simValue = newVal;

      // Update text while keeping child tooltip element intact
      var textNode = Array.from(el.childNodes).find(function (n) {
        return n.nodeType === 3; // Text node
      });
      if (textNode) {
        textNode.nodeValue = newVal;
      } else {
        el.textContent = newVal;
        if (tooltip) el.appendChild(tooltip);
      }

      if (tooltip) tooltip.textContent = "Drag to change: " + newVal;
      el.setAttribute("aria-valuenow", newVal);

      reDeriveContainer(container, el, newVal);

      if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
        safeCall(function () {
          global.NTtelemetry.track("sim_value_dragged", {
            value: newVal,
            elementId: el.id || "live-sim-elem",
          });
        });
      }
    }

    function onPointerDown(e) {
      startX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      startVal = parseFloat(el.dataset.simValue || el.textContent) || 0;
      el.classList.add("is-dragging");

      function onPointerMove(moveEvent) {
        var currentX =
          moveEvent.clientX ||
          (moveEvent.touches && moveEvent.touches[0] ? moveEvent.touches[0].clientX : 0);
        var delta = currentX - startX;
        var valDelta = Math.round(delta / 8) * step;
        updateValue(startVal + valDelta);
      }

      function onPointerUp() {
        el.classList.remove("is-dragging");
        window.removeEventListener("mousemove", onPointerMove);
        window.removeEventListener("mouseup", onPointerUp);
        window.removeEventListener("touchmove", onPointerMove);
        window.removeEventListener("touchend", onPointerUp);
      }

      window.addEventListener("mousemove", onPointerMove);
      window.addEventListener("mouseup", onPointerUp);
      window.addEventListener("touchmove", onPointerMove, { passive: true });
      window.addEventListener("touchend", onPointerUp);
    }

    el.addEventListener("mousedown", onPointerDown);
    el.addEventListener("touchstart", onPointerDown, { passive: true });

    el.addEventListener("keydown", function (e) {
      var current = parseFloat(el.dataset.simValue || el.textContent) || 0;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        updateValue(current + step);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        updateValue(current - step);
      }
    });
  }

  function reDeriveContainer(container, changedEl, newVal) {
    var derivedOutputs = container.querySelectorAll("[data-derived-from], .live-sim-derived-value");
    derivedOutputs.forEach(function (output) {
      var formula = output.dataset.formula;
      if (formula) {
        try {
          var calculated = evalFormula(formula, container);
          output.textContent = calculated;
          pulseOutput(output);
        } catch (_e) {
          /* ignore formula error */
        }
      }
    });

    var svgModels = container.querySelectorAll("svg[data-live-svg]");
    svgModels.forEach(function (svg) {
      updateSvgModel(svg, changedEl, newVal);
    });
  }

  function evalFormula(formula, container) {
    var draggables = container.querySelectorAll(".live-sim-draggable");
    var ctx = {};
    draggables.forEach(function (d, i) {
      var name = d.dataset.varName || "x" + (i + 1);
      ctx[name] = parseFloat(d.dataset.simValue || d.textContent) || 0;
    });

    var keys = Object.keys(ctx);
    var vals = keys.map(function (k) {
      return ctx[k];
    });
    var fn = new Function(keys.join(","), "return " + formula + ";");
    var res = fn.apply(null, vals);
    return typeof res === "number" ? Math.round(res * 100) / 100 : res;
  }

  function updateSvgModel(svg, _changedEl, newVal) {
    var bar = svg.querySelector(".live-svg-bar");
    if (bar) {
      var widthPct = Math.min(100, Math.max(5, newVal * 10));
      bar.setAttribute("width", widthPct + "%");
    }
  }

  function pulseOutput(el) {
    el.classList.add("pulse-update");
    setTimeout(function () {
      el.classList.remove("pulse-update");
    }, 300);
  }

  global.NTLiveSim = {
    __booted: true,
    init: init,
    reDerive: reDeriveContainer,
  };

  init();
})(typeof window !== "undefined" ? window : this);
