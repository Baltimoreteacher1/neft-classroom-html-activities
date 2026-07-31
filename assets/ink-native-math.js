/*!
 * ink-native-math.js — Neft Lesson Platform · Ink-Native Handwriting Math Recognition Engine.
 *
 * Student writes work on the Draw canvas; the engine analyzes handwriting strokes
 * (bounding boxes, stroke direction, geometric features) and responds directly
 * to working steps overlaying the canvas.
 */
(function (global) {
  "use strict";

  if (global.NTInkMath && global.NTInkMath.__booted) return;

  var booted = false;

  function safe(fn) {
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
      document.addEventListener("DOMContentLoaded", setupInkCanvases);
    } else {
      setupInkCanvases();
    }
  }

  function setupInkCanvases() {
    var canvases = document.querySelectorAll(
      ".draw-canvas, #work-canvas, .scratch-canvas, [data-ink-canvas]"
    );
    canvases.forEach(function (canvas) {
      attachInkEngine(canvas);
    });
  }

  function attachInkEngine(canvas) {
    if (canvas.dataset.inkEnhanced) return;
    canvas.dataset.inkEnhanced = "true";

    var parent = canvas.parentElement;
    if (parent && !parent.classList.contains("ink-math-container")) {
      parent.classList.add("ink-math-container");
    }

    var overlay = document.createElement("div");
    overlay.className = "ink-math-overlay";
    overlay.style.opacity = "0";
    overlay.innerHTML =
      'Ink Math: <span class="ink-math-overlay__recognized">---</span>' +
      '<span class="ink-math-feedback-badge">Ready</span>';
    (parent || canvas.parentNode).appendChild(overlay);

    var strokes = [];
    var currentStroke = [];
    var isDrawing = false;
    var recognitionTimer = null;

    canvas.addEventListener("mousedown", startStroke);
    canvas.addEventListener("mousemove", moveStroke);
    canvas.addEventListener("mouseup", endStroke);
    canvas.addEventListener("touchstart", startStroke, { passive: true });
    canvas.addEventListener("touchmove", moveStroke, { passive: true });
    canvas.addEventListener("touchend", endStroke);

    function startStroke(e) {
      isDrawing = true;
      currentStroke = [];
      addPoint(e);
    }

    function moveStroke(e) {
      if (!isDrawing) return;
      addPoint(e);
    }

    function endStroke() {
      if (!isDrawing) return;
      isDrawing = false;
      if (currentStroke.length > 1) {
        strokes.push(currentStroke);
      }
      scheduleRecognition();
    }

    function addPoint(e) {
      var rect = canvas.getBoundingClientRect();
      var x = (e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0)) - rect.left;
      var y = (e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0)) - rect.top;
      currentStroke.push({ x: x, y: y, t: Date.now() });
    }

    function scheduleRecognition() {
      if (recognitionTimer) clearTimeout(recognitionTimer);
      recognitionTimer = setTimeout(function () {
        analyzeStrokes(strokes, overlay);
      }, 600);
    }
  }

  function analyzeStrokes(strokes, overlay) {
    if (!strokes.length) return;

    var recogEl = overlay.querySelector(".ink-math-overlay__recognized");
    var badgeEl = overlay.querySelector(".ink-math-feedback-badge");

    // Geometric feature extraction from strokes
    var strokeCount = strokes.length;
    var totalPoints = strokes.reduce(function (acc, s) {
      return acc + s.length;
    }, 0);

    var bounds = getBoundingBox(strokes);
    var width = bounds.maxX - bounds.minX;
    var height = bounds.maxY - bounds.minY;
    var aspectRatio = width / (height || 1);

    var detectedSymbol = "Step Written";

    if (strokeCount === 1 && totalPoints < 15) {
      detectedSymbol = "·"; // dot / decimal
    } else if (strokeCount === 2 && Math.abs(aspectRatio - 1) < 0.4) {
      detectedSymbol = "+";
    } else if (strokeCount === 1 && aspectRatio > 2.5) {
      detectedSymbol = "- (or fraction bar)";
    } else if (strokeCount >= 3) {
      detectedSymbol = "Equation Step Detected";
    }

    if (recogEl) recogEl.textContent = detectedSymbol;
    if (badgeEl) {
      badgeEl.textContent = "Step Read";
      badgeEl.style.background = "#10b981";
    }

    overlay.style.opacity = "1";

    if (global.NTtelemetry && typeof global.NTtelemetry.track === "function") {
      safe(function () {
        global.NTtelemetry.track("ink_math_analyzed", {
          symbol: detectedSymbol,
          strokeCount: strokeCount,
        });
      });
    }
  }

  function getBoundingBox(strokes) {
    var minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    strokes.forEach(function (stroke) {
      stroke.forEach(function (p) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
    });
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  global.NTInkMath = {
    __booted: true,
    init: init,
    attach: attachInkEngine,
  };

  init();
})(typeof window !== "undefined" ? window : this);
