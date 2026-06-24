/* =============================================================================
 * Gradebook hub enhancer — additive curriculum-hub enhancement
 * -----------------------------------------------------------------------------
 * The teacher "Gradebook & Save Codes" card on the curriculum hub gets two
 * quick-entry buttons — "Saved Codes" and "Grades" — that open the SAME full
 * Gradebook tool as the "Open full Gradebook" button, deep-linked straight to
 * the matching section (#codes / #grades). One canonical tool, one auth gate,
 * three doorways into it.
 *
 * Purely additive: no edits to the hub's rendered markup, and the card itself
 * is `hub-teacher-only` (hidden in Student Mode). The full tool handles the
 * TEACHER_KEY gate and all live data.
 * ========================================================================== */
(function () {
  "use strict";

  var TOOL = "/teacher-tools/gradebook/";

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  // A button-styled link into a specific section of the full Gradebook tool,
  // opened in a new tab — identical behavior to "Open full Gradebook".
  function mkLink(label, hash, variant) {
    var a = el("a", "mf-btn " + variant + " gbx-link");
    a.href = TOOL + hash;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    return a;
  }

  function init() {
    var card = document.querySelector(".gradebook-feature");
    if (!card || card.querySelector(".gbx-link")) return;
    var actions = card.querySelector(".mf-actions");
    if (!actions) return;

    // Relabel the existing link so all three doorways read consistently.
    var fullLink = actions.querySelector("a");
    if (fullLink) {
      fullLink.textContent = "Open full Gradebook ↗";
      fullLink.setAttribute("target", "_blank");
      fullLink.setAttribute("rel", "noopener");
    }

    var codes = mkLink("Saved Codes ↗", "#codes", "solid");
    var grades = mkLink("Grades ↗", "#grades", "outline");
    // Order: Saved Codes, Grades, then the existing "Open full Gradebook".
    actions.insertBefore(grades, actions.firstChild);
    actions.insertBefore(codes, actions.firstChild);

    // Group the gradebook/codes card next to the AI Hub card (DOM move only).
    var aiCard = document.querySelector(
      ".ai-hub-feature:not(.class-brain-feature)",
    );
    if (aiCard && aiCard !== card && aiCard.parentNode) {
      aiCard.insertAdjacentElement("afterend", card);
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", init);
  else init();
})();
