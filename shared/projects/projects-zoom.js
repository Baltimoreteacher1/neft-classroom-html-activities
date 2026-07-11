/* ==========================================================================
   Projects ZOOM — makes the static .visual-svg diagrams on the culminating
   project pages larger inline AND tap/click to open fullscreen. Companion to
   projects-zoom.css. Additive, idempotent, keyboard-accessible, print-safe.

   - Tags each .visual-svg with `.nz-zoomable` and wraps it in a
     <figure class="nz-fig"> carrying a "Tap to enlarge" hint.
   - Keeps the original <svg id> intact (page scripts that toggle EN/ES
     tspans via getElementById keep working).
   - Opens a fullscreen lightbox with a live clone of the current SVG state,
     so the enlarged view matches the on-page language toggle.
   ========================================================================== */
(function () {
  "use strict";
  if (window.__nzProjectsZoom) return;
  window.__nzProjectsZoom = true;

  var HINT = "🔍 Tap to enlarge";
  var overlay = null;
  var lastFocus = null;

  function label(svg) {
    var t = svg.querySelector("text, .en-text");
    var txt = t ? t.textContent.trim() : "";
    return txt || "Project diagram";
  }

  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener("keydown", onKey, true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  function open(svg) {
    if (overlay) close();
    lastFocus = document.activeElement;

    overlay = document.createElement("div");
    overlay.className = "nz-lightbox";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", label(svg));

    var clone = svg.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.remove("nz-zoomable");
    clone.removeAttribute("tabindex");
    clone.removeAttribute("role");
    clone.style.cursor = "default";

    var close_ = document.createElement("button");
    close_.type = "button";
    close_.className = "nz-close";
    close_.setAttribute("aria-label", "Close enlarged view");
    close_.innerHTML = "&times;";
    close_.addEventListener("click", close);

    var cap = document.createElement("p");
    cap.className = "nz-caption";
    cap.textContent = "Tap anywhere or press Esc to close";

    overlay.appendChild(clone);
    overlay.appendChild(cap);
    overlay.appendChild(close_);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) close();
    });

    document.body.appendChild(overlay);
    document.addEventListener("keydown", onKey, true);
    close_.focus();
  }

  function enhance(svg) {
    if (svg.classList.contains("nz-zoomable")) return;
    svg.classList.add("nz-zoomable");
    svg.setAttribute("role", "button");
    svg.setAttribute("tabindex", "0");
    svg.setAttribute("aria-label", "Enlarge diagram: " + label(svg));

    // Wrap in a figure so the hint pill can sit over the diagram without
    // disturbing the original <svg id> or its layout.
    var parent = svg.parentNode;
    if (!parent) return;
    var fig = document.createElement("figure");
    fig.className = "nz-fig";
    parent.insertBefore(fig, svg);
    fig.appendChild(svg);

    var hint = document.createElement("figcaption");
    hint.className = "nz-hint";
    hint.textContent = HINT;
    fig.appendChild(hint);

    svg.addEventListener("click", function () {
      open(svg);
    });
    svg.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open(svg);
      }
    });
  }

  function run() {
    var svgs = document.querySelectorAll("svg.visual-svg");
    for (var i = 0; i < svgs.length; i++) enhance(svgs[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
