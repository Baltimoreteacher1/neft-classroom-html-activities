/* Neft Teacher — shared Game FX kit (additive, deploy-safe).
 *
 * Pairs with game-fx.css. Adds universal, gameplay-neutral polish to any
 * interactive game/activity it is injected into:
 *   - Success spark burst when a "correct" element appears (auto-detected by a
 *     conservative MutationObserver on the dominant convention: an element
 *     gaining a success class such as `right`/`correct`).
 *   - Pointer parallax on `[data-parallax]` containers (and the common
 *     `.ghero .deco` hero decoration).
 *   - A small programmatic API: window.GameFX.celebrate(el) / burst(x,y) /
 *     pop(el) for games that want to call it directly.
 *
 * Hard rules: never throws into the host game (everything is guarded), never
 * touches gameplay/scoring, and all motion is disabled under
 * prefers-reduced-motion. Idempotent: loads at most once per page. */
(function () {
  "use strict";
  if (window.GameFX) return;

  var reduce = !!(
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  var COLORS = ["#1aa179", "#f0a400", "#3b7dd8", "#e0542f", "#9b5de5"];
  var SUCCESS_CLASS =
    /(^|\s)(right|correct|is-correct|is-right|ok|success|won|gfx-correct)(\s|$)/i;
  var INTERACTIVE =
    /(^|\s)(opt|option|choice|answer|tile|card|btn|cell|key)(\s|$)/i;

  function burst(cx, cy) {
    if (reduce) return;
    for (var i = 0; i < 12; i++) {
      var s = document.createElement("div");
      s.className = "gfx-spark";
      s.style.left = cx + "px";
      s.style.top = cy + "px";
      s.style.background = COLORS[i % COLORS.length];
      document.body.appendChild(s);
      var ang = (Math.PI * 2 * i) / 12;
      var dist = 34 + Math.random() * 34;
      var tx = Math.cos(ang) * dist;
      var ty = Math.sin(ang) * dist;
      try {
        var anim = s.animate(
          [
            { transform: "translate(-50%,-50%) scale(1)", opacity: 1 },
            {
              transform:
                "translate(calc(-50% + " +
                tx +
                "px), calc(-50% + " +
                ty +
                "px)) scale(0)",
              opacity: 0,
            },
          ],
          { duration: 620, easing: "cubic-bezier(.3,.7,.4,1)" },
        );
        anim.onfinish = (function (node) {
          return function () {
            if (node.parentNode) node.parentNode.removeChild(node);
          };
        })(s);
      } catch (e) {
        // WAAPI unsupported — remove immediately, no visual but no error.
        if (s.parentNode) s.parentNode.removeChild(s);
      }
    }
  }

  function celebrate(el) {
    if (reduce || !el || !el.getBoundingClientRect) return;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    burst(r.left + r.width / 2, r.top + r.height / 2);
  }

  function pop(el) {
    if (reduce || !el || !el.classList) return;
    el.classList.remove("gfx-pop");
    void el.offsetWidth;
    el.classList.add("gfx-pop");
  }

  window.GameFX = {
    celebrate: celebrate,
    burst: burst,
    pop: pop,
    reduce: reduce,
  };

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    if (reduce || !document.body) return;

    // Auto success-burst: watch for an element gaining a success class.
    // Conservative — only fires for small interactive elements, once each.
    try {
      if (window.MutationObserver) {
        var fired = typeof WeakSet === "function" ? new WeakSet() : null;
        var obs = new MutationObserver(function (muts) {
          for (var i = 0; i < muts.length; i++) {
            var t = muts[i].target;
            if (
              !t ||
              t.nodeType !== 1 ||
              typeof t.className !== "string" ||
              !SUCCESS_CLASS.test(t.className)
            )
              continue;
            var isInteractive =
              t.tagName === "BUTTON" ||
              t.getAttribute("role") === "button" ||
              INTERACTIVE.test(t.className);
            if (!isInteractive) continue;
            if (fired) {
              if (fired.has(t)) continue;
              fired.add(t);
            }
            celebrate(t);
          }
        });
        obs.observe(document.body, {
          subtree: true,
          attributes: true,
          attributeFilter: ["class"],
        });
      }
    } catch (e) {
      /* observer unsupported — skip auto-burst */
    }

    // Pointer parallax for opt-in containers and common hero decorations.
    try {
      var heroes = document.querySelectorAll("[data-parallax], .ghero");
      Array.prototype.forEach.call(heroes, function (h) {
        var layer =
          h.querySelector("[data-parallax-layer]") || h.querySelector(".deco");
        if (!layer) return;
        h.addEventListener("pointermove", function (e) {
          var r = h.getBoundingClientRect();
          if (!r.width) return;
          var dx = (e.clientX - r.left) / r.width - 0.5;
          var dy = (e.clientY - r.top) / r.height - 0.5;
          layer.style.transform =
            "translate(" + dx * 16 + "px," + dy * 16 + "px)";
        });
        h.addEventListener("pointerleave", function () {
          layer.style.transform = "";
        });
      });
    } catch (e) {
      /* parallax wiring failed — non-fatal */
    }
  });
})();
