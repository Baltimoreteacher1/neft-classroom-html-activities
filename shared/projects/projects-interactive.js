/* ==========================================================================
   Neft Teacher — Projects Interactive Layer (shared)
   Makes the culminating projects feel alive without touching per-page logic:
     • Stepper (− / +) buttons + a drag slider on every number input
       (slider only when the input declares min AND max). Controls are
       appended AFTER the input as siblings and drive the page's own
       oninput/onchange handlers — no calc code is modified.
     • Instant ✓ feedback: result readouts pulse green when they fill in.
     • Celebration: a confetti burst + toast when project progress hits 100%
       (and a quiet nudge at the halfway mark).
   Reference AFTER the page's own scripts. Self-contained, no dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  function fire(el) {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function decimals(step) {
    var s = String(step);
    return s.indexOf(".") >= 0 ? s.split(".")[1].length : 0;
  }

  function makeBtn(label, aria) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pki-step";
    b.tabIndex = -1;
    b.setAttribute("aria-label", aria);
    b.textContent = label;
    return b;
  }

  function enhanceNumber(inp) {
    if (inp.dataset.pkiDone || inp.disabled || inp.readOnly) return;
    inp.dataset.pkiDone = "1";

    var step = parseFloat(inp.getAttribute("step")) || 1;
    var dp = decimals(step);
    var hasMin = inp.hasAttribute("min");
    var hasMax = inp.hasAttribute("max");

    var controls = document.createElement("div");
    controls.className = "pki-controls pk-no-print";

    var minus = makeBtn("−", "decrease");
    var plus = makeBtn("+", "increase");

    var slider = null;
    if (hasMin && hasMax) {
      slider = document.createElement("input");
      slider.type = "range";
      slider.className = "pki-slider";
      slider.min = inp.min;
      slider.max = inp.max;
      slider.step = inp.getAttribute("step") || step;
      slider.value = inp.value !== "" ? inp.value : inp.min;
      slider.setAttribute("aria-hidden", "true");
      slider.tabIndex = -1;
      slider.addEventListener("input", function () {
        inp.value = slider.value;
        fire(inp);
      });
      inp.addEventListener("input", function () {
        if (inp.value !== "" && !isNaN(parseFloat(inp.value))) slider.value = inp.value;
      });
    }

    function clamp(v) {
      if (hasMin) v = Math.max(v, parseFloat(inp.min));
      if (hasMax) v = Math.min(v, parseFloat(inp.max));
      return v;
    }
    function nudge(dir) {
      var v = parseFloat(inp.value);
      if (isNaN(v)) v = hasMin ? parseFloat(inp.min) : 0;
      v = clamp(parseFloat((v + dir * step).toFixed(dp)));
      inp.value = v;
      if (slider) slider.value = v;
      fire(inp);
      inp.focus({ preventScroll: true });
    }
    minus.addEventListener("click", function () {
      nudge(-1);
    });
    plus.addEventListener("click", function () {
      nudge(1);
    });

    controls.appendChild(minus);
    if (slider) controls.appendChild(slider);
    controls.appendChild(plus);
    inp.insertAdjacentElement("afterend", controls);
  }

  function enhanceInputs() {
    var inputs = document.querySelectorAll(
      'body.pk .phase input[type="number"], body.pk .pk-flow-step input[type="number"]',
    );
    inputs.forEach(enhanceNumber);
  }

  /* ---- instant ✓ feedback on result readouts ---- */
  function watchReadouts() {
    var outs = document.querySelectorAll("body.pk .readout");
    outs.forEach(function (out) {
      var obs = new MutationObserver(function () {
        var txt = (out.textContent || "").trim();
        if (txt && txt !== /** @type {HTMLElement} */ (out).dataset.pkiLast) {
          /** @type {HTMLElement} */ (out).dataset.pkiLast = txt;
          out.classList.remove("pki-pop");
          void (/** @type {HTMLElement} */ (out).offsetWidth); // restart animation
          out.classList.add("pki-pop");
        }
      });
      obs.observe(out, { childList: true, characterData: true, subtree: true });
    });
  }

  /* ---- celebration on progress milestones ---- */
  function confetti() {
    var n = 80;
    var box = document.createElement("div");
    box.className = "pki-confetti";
    var colors = ["#1763c7", "#0e9a8c", "#f4a924", "#ef6b52", "#6d4ad6", "#19a35a"];
    for (var i = 0; i < n; i++) {
      var p = document.createElement("i");
      p.style.left = Math.round((i / n) * 100) + "%";
      p.style.background = colors[i % colors.length];
      p.style.animationDelay = (i % 12) * 0.04 + "s";
      p.style.transform = "rotate(" + ((i * 37) % 360) + "deg)";
      box.appendChild(p);
    }
    document.body.appendChild(box);
    setTimeout(function () {
      box.remove();
    }, 2600);
  }

  function toast(msg) {
    var t = document.createElement("div");
    t.className = "pki-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () {
      t.classList.add("show");
    });
    setTimeout(function () {
      t.classList.remove("show");
      setTimeout(function () {
        t.remove();
      }, 400);
    }, 2600);
  }

  function watchProgress() {
    var label = document.querySelector("body.pk .progress-label, body.pk .progress-wrap");
    if (!label) return;
    var hit50 = false,
      hit100 = false;
    function pct() {
      var m = (label.textContent || "").match(/(\d+)\s*%/);
      return m ? parseInt(m[1], 10) : 0;
    }
    var obs = new MutationObserver(function () {
      var p = pct();
      if (p >= 50 && !hit50) {
        hit50 = true;
        toast("Halfway there — keep going! 💪");
      }
      if (p >= 100 && !hit100) {
        hit100 = true;
        confetti();
        toast("Project complete! Amazing work 🎉");
      }
    });
    obs.observe(label, { childList: true, characterData: true, subtree: true });
  }

  ready(function () {
    if (!document.body.classList.contains("pk")) return;
    try {
      enhanceInputs();
    } catch (_e) {}
    try {
      watchReadouts();
    } catch (_e) {}
    try {
      watchProgress();
    } catch (_e) {}
    // re-scan after the tab engine restructures the DOM into step panels
    setTimeout(function () {
      try {
        enhanceInputs();
      } catch (_e) {}
    }, 800);
  });
})();
