/* =============================================================================
 * Gradebook inline embed — additive curriculum-hub enhancement
 * -----------------------------------------------------------------------------
 * Surfaces the live Gradebook (Grades + Saved assignment codes, with the
 * Add student / Add class / grade-entry forms) RIGHT on the teacher area of the
 * curriculum hub, instead of only as a click-through to /teacher-tools/gradebook/.
 *
 * Implementation: a same-origin <iframe> of the existing tool (?embed=1 hides its
 * page chrome). This keeps a SINGLE source of truth — no gradebook logic is
 * duplicated here. It is purely additive (no edits to the hub's rendered markup)
 * and inherits the teacher gate two ways: the host card is `hub-teacher-only`
 * (hidden in Student Mode) and the embedded tool still requires the TEACHER_KEY.
 *
 * Same-origin framing is permitted by _headers (CSP frame-ancestors 'self').
 * ========================================================================== */
(function () {
  "use strict";

  var STYLE = [
    ".gbx-wrap{margin-top:14px}",
    ".gbx-frame{width:100%;height:80vh;min-height:560px;border:1px solid rgba(15,23,42,.18);",
    "border-radius:14px;background:#0f1623;display:block}",
    ".gbx-toggle{cursor:pointer}",
  ].join("");

  function injectStyle() {
    if (document.getElementById("gbx-style")) return;
    var s = document.createElement("style");
    s.id = "gbx-style";
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function init() {
    var card = document.querySelector(".gradebook-feature");
    if (!card || card.querySelector(".gbx-toggle")) return;
    var actions = card.querySelector(".mf-actions");
    if (!actions) return;

    injectStyle();

    // Place the gradebook/codes card right next to the AI Hub card, grouping
    // the "smart tools" together. Additive DOM move only (no markup edits).
    var aiCard = document.querySelector(".ai-hub-feature:not(.class-brain-feature)");
    if (aiCard && aiCard !== card && aiCard.parentNode) {
      aiCard.insertAdjacentElement("afterend", card);
    }

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mf-btn gbx-toggle";
    btn.setAttribute("aria-expanded", "false");
    btn.textContent = "Open here ▾";
    actions.appendChild(btn);

    var wrap = document.createElement("div");
    wrap.className = "gbx-wrap";
    wrap.hidden = true;
    card.appendChild(wrap);

    var loaded = false;
    btn.addEventListener("click", function () {
      var open = wrap.hidden; // about to open
      wrap.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Hide ▴" : "Open here ▾";
      if (open && !loaded) {
        loaded = true;
        var f = document.createElement("iframe");
        f.className = "gbx-frame";
        f.title = "Gradebook — Grades & Saved Assignment Codes";
        f.loading = "lazy";
        f.src = "/teacher-tools/gradebook/?embed=1";
        wrap.appendChild(f);
      }
      if (open) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
