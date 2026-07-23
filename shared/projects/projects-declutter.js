/* ==========================================================================
   Neft Teacher — Projects DECLUTTER layer (shared)
   For each Level-2 challenge block (.lvl2-block), collapse it by default and
   add a "⭐ Optional Challenge" toggle button right before it. The button
   carries the page's own `lvl2-only` class, so it (like the block) appears
   only at Level 2 — Level 0/1 students never see it. Nothing is moved and no
   ids change, so Save/Resume, grading, and the report are unaffected.
   Runs only when <body class="declutter-projects">. Idempotent.
   Injected by tools/inject-projects-declutter.mjs.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function decorate(block) {
    if (block.dataset.dcDone) return;
    block.dataset.dcDone = "1";
    block.classList.add("dc-collapsed");

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dc-optbtn lvl2-only"; // lvl2-only => visible only at Level 2
    btn.setAttribute("aria-expanded", "false");

    var star = document.createElement("span");
    star.className = "dc-star";
    star.setAttribute("aria-hidden", "true");
    star.textContent = "⭐";

    var label = document.createElement("span");
    label.className = "dc-optlabel";
    // Bilingual, mirrors the page's en-text/es-text convention.
    label.innerHTML =
      '<span class="en-text">Optional Challenge (Level 2) — show</span>' +
      '<span class="es-text">Reto opcional (Nivel 2) — mostrar</span>';

    var caret = document.createElement("span");
    caret.className = "dc-caret";
    caret.setAttribute("aria-hidden", "true");
    caret.textContent = "▸";

    btn.appendChild(star);
    btn.appendChild(label);
    btn.appendChild(caret);

    btn.addEventListener("click", function () {
      var open = block.classList.toggle("dc-collapsed") === false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      label.innerHTML = open
        ? '<span class="en-text">Optional Challenge (Level 2) — hide</span><span class="es-text">Reto opcional (Nivel 2) — ocultar</span>'
        : '<span class="en-text">Optional Challenge (Level 2) — show</span><span class="es-text">Reto opcional (Nivel 2) — mostrar</span>';
    });

    block.parentNode.insertBefore(btn, block);
  }

  function run() {
    if (!/\bdeclutter-projects\b/.test(document.body.className)) return;
    document.querySelectorAll(".lvl2-block").forEach(decorate);
  }

  ready(run);
  setTimeout(run, 700);
  if (typeof window !== "undefined") window.NTDeclutter = run;
})();
