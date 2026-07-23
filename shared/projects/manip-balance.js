/* ==========================================================================
   Neft Teacher — "Equation Balance" manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="balance" data-theme="lock"></div>
     <div class="pki-manip" data-manip="balance" data-theme="fundraiser"></div>
   An SVG balance scale for one-variable equations (6.AT.C.8). Students use
   − / + steppers to set p and q and pick the equation form
   (x + p = q, x − p = q, p·x = q, x ÷ p = q). The scale tips while x is
   unknown; "Solve it" applies the INVERSE operation to BOTH sides step by
   step, reveals x, and the scale animates to balanced. Answers stay whole
   and friendly. Theme labels (lock code vs fundraiser goal) come from data-*.
   No dependencies. No math renderer — equations are plain text/Unicode.
   Injects its own scoped styles once.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-balance-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-manip{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-manip h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-b-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-b-forms{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}" +
      ".pki-b-form{padding:.45em .8em;border-radius:999px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-ink,#172033);font-weight:800;font-size:.92rem;cursor:pointer;line-height:1}" +
      ".pki-b-form[aria-pressed='true']{background:var(--tp-accent,#1763c7);border-color:var(--tp-accent,#1763c7);color:#fff}" +
      ".pki-b-form:active{transform:scale(.96)}" +
      ".pki-b-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-bottom:12px}" +
      ".pki-b-field{flex:1 1 130px}.pki-b-field label{display:block;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:5px}" +
      ".pki-b-stepwrap{display:flex;align-items:center;gap:8px}" +
      ".pki-b-stepwrap input{width:72px;text-align:center;font-size:1.15rem;font-weight:800;padding:.45em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px}" +
      ".pki-b-btn{width:42px;height:42px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-b-btn:active{transform:scale(.9)}" +
      ".pki-b-eq{text-align:center;font-size:1.5rem;font-weight:800;color:var(--tp-ink,#172033);margin:6px 0 4px;letter-spacing:.02em}" +
      ".pki-b-eq .pki-b-x{color:var(--tp-accent,#1763c7)}" +
      ".pki-b-stage{display:block;width:100%;max-width:420px;margin:4px auto 12px;height:auto}" +
      ".pki-b-beam{transition:transform .85s cubic-bezier(.22,1,.36,1)}" +
      ".pki-b-solve{display:block;width:100%;padding:.7em;border-radius:12px;border:none;background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;font-weight:800;font-size:1rem;cursor:pointer;box-shadow:0 8px 20px -8px rgba(12,27,42,.4)}" +
      ".pki-b-solve:active{transform:scale(.98)}" +
      ".pki-b-steps{margin-top:12px;border-radius:12px;padding:0;overflow:hidden;max-height:0;transition:max-height .4s ease}" +
      ".pki-b-steps.open{max-height:520px}" +
      ".pki-b-steps .pki-b-inner{background:#eafaf0;border:1px solid #b6e6c8;border-radius:12px;padding:13px 15px}" +
      ".pki-b-steps ol{margin:6px 0 0;padding-left:20px;display:grid;gap:7px}" +
      ".pki-b-steps li{font-size:.96rem;color:var(--tp-ink,#172033);line-height:1.45}" +
      ".pki-b-steps code{font-weight:800;background:#fff;border:1px solid #b6e6c8;border-radius:6px;padding:1px 6px;font-family:inherit}" +
      ".pki-b-answer{font-weight:800;font-size:1.05rem;color:#0f7a40;margin:0 0 4px}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  var THEMES = {
    lock: {
      emoji: "🔒",
      title: "Equation Balance — crack the lock",
      sub: "Set the numbers, choose the clue type, then press Solve it. The scale tips while x (the lock combination) is unknown, and balances when you undo the operation on both sides.",
      xName: "the lock combination",
    },
    fundraiser: {
      emoji: "💰",
      title: "Equation Balance — hit the goal",
      sub: "Set the numbers, choose the equation type, then press Solve it. The scale tips while x (the amount still needed) is unknown, and balances when you undo the operation on both sides.",
      xName: "the amount still needed",
    },
  };

  // Equation forms. p,q are whole; every solution x stays whole & positive.
  var FORMS = [
    {
      id: "add",
      label: "x + p = q",
      sym: "+",
      x: function (p, q) {
        return q - p;
      },
      left: function (x, p) {
        return x + p;
      },
      leftExpr: function (p, xt) {
        return xt + " + " + p;
      },
      inverse: function (p) {
        return "subtract " + p + " from both sides";
      },
      work: function (p, q) {
        return "x = " + q + " − " + p;
      },
    },
    {
      id: "sub",
      label: "x − p = q",
      sym: "−",
      x: function (p, q) {
        return q + p;
      },
      left: function (x, p) {
        return x - p;
      },
      leftExpr: function (p, xt) {
        return xt + " − " + p;
      },
      inverse: function (p) {
        return "add " + p + " to both sides";
      },
      work: function (p, q) {
        return "x = " + q + " + " + p;
      },
    },
    {
      id: "mul",
      label: "p · x = q",
      sym: "·",
      x: function (p, q) {
        return q / p;
      },
      left: function (x, p) {
        return p * x;
      },
      leftExpr: function (p, xt) {
        return p + " · " + xt;
      },
      inverse: function (p) {
        return "divide both sides by " + p;
      },
      work: function (p, q) {
        return "x = " + q + " ÷ " + p;
      },
    },
    {
      id: "div",
      label: "x ÷ p = q",
      sym: "÷",
      x: function (p, q) {
        return q * p;
      },
      left: function (x, p) {
        return x / p;
      },
      leftExpr: function (p, xt) {
        return xt + " ÷ " + p;
      },
      inverse: function (p) {
        return "multiply both sides by " + p;
      },
      work: function (p, q) {
        return "x = " + q + " × " + p;
      },
    },
  ];
  function formById(id) {
    for (var i = 0; i < FORMS.length; i++) if (FORMS[i].id === id) return FORMS[i];
    return FORMS[0];
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Parse an authored one-variable equation (e.g. "n + 8 = 20", "5x = 35",
  // "y ÷ 4 = 3") into the widget's starting state: form + p + q + variable
  // letter. Tolerant of Unicode operators (− ÷ × ·) and implicit "px" for
  // multiplication. Returns null when the string doesn't match a supported
  // form, so the caller keeps the generic default.
  function parseEquation(src) {
    if (!src) return null;
    var s = String(src)
      .trim()
      .replace(/[−–—]/g, "-") // minus / en / em dash → hyphen
      .replace(/[×·*]/g, "M") // × · * → M (multiply marker)
      .replace(/[÷/]/g, "D"); // ÷ / → D (divide marker)
    var sides = s.split("=");
    if (sides.length !== 2) return null;
    var lhs = sides[0].trim();
    var q = parseInt(sides[1].trim(), 10);
    if (!isFinite(q)) return null;
    var m;
    if ((m = lhs.match(/^([A-Za-z])\s*([+-])\s*(\d+)$/))) {
      return { varName: m[1], formId: m[2] === "+" ? "add" : "sub", P: +m[3], Q: q };
    }
    if ((m = lhs.match(/^(\d+)\s*M?\s*([A-Za-z])$/))) {
      // p·x = q (also matches implicit "5x")
      return { varName: m[2], formId: "mul", P: +m[1], Q: q };
    }
    if ((m = lhs.match(/^([A-Za-z])\s*M\s*(\d+)$/))) {
      return { varName: m[1], formId: "mul", P: +m[2], Q: q };
    }
    if ((m = lhs.match(/^([A-Za-z])\s*D\s*(\d+)$/))) {
      return { varName: m[1], formId: "div", P: +m[2], Q: q };
    }
    return null;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var theme = THEMES[el.dataset.theme] || THEMES.lock;
    // Optional authored starting equation (data-equation) + variable letter.
    // Falls back to the generic explorer default (x + 5 = 12) when absent.
    var seed = parseEquation(el.dataset.equation);
    var VAR = el.dataset.var || (seed && seed.varName) || "x";
    var P = seed ? seed.P : 5,
      Q = seed ? seed.Q : 12,
      formId = seed ? seed.formId : "add",
      solved = false;
    var P_MIN = 1,
      P_MAX = 20,
      Q_MIN = 1,
      Q_MAX = 200;

    el.innerHTML =
      "<h4>" +
      theme.emoji +
      " " +
      esc(theme.title) +
      "</h4>" +
      '<p class="pki-b-sub">' +
      esc(theme.sub.replace(/\bx\b/g, VAR)) +
      "</p>" +
      '<div class="pki-b-forms" data-forms>' +
      FORMS.map(function (f) {
        return (
          '<button type="button" class="pki-b-form" data-form="' +
          f.id +
          '" aria-pressed="false">' +
          esc(f.label.replace(/\bx\b/g, VAR)) +
          "</button>"
        );
      }).join("") +
      "</div>" +
      '<div class="pki-b-row">' +
      field("p", "p") +
      field("q", "q") +
      "</div>" +
      '<div class="pki-b-eq" data-eq></div>' +
      stageSvg() +
      '<button type="button" class="pki-b-solve" data-solve>⚖️ Solve it — undo on both sides</button>' +
      '<div class="pki-b-steps" data-steps><div class="pki-b-inner" data-steps-inner></div></div>';

    function field(key, label) {
      return (
        '<div class="pki-b-field"><label>' +
        label +
        "</label>" +
        '<div class="pki-b-stepwrap">' +
        '<button type="button" class="pki-b-btn" data-dec="' +
        key +
        '" aria-label="decrease ' +
        label +
        '">−</button>' +
        '<input type="text" inputmode="numeric" data-val="' +
        key +
        '">' +
        '<button type="button" class="pki-b-btn" data-inc="' +
        key +
        '" aria-label="increase ' +
        label +
        '">+</button>' +
        "</div></div>"
      );
    }

    function stageSvg() {
      // viewBox 0 0 360 220. Pivot at (180,72). Beam half-length 120.
      return (
        '<svg class="pki-b-stage" viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Balance scale for the equation">' +
        // static base
        '<rect x="120" y="196" width="120" height="9" rx="4" fill="#cbd5e1"/>' +
        '<polygon points="180,80 150,196 210,196" fill="#94a3b8"/>' +
        '<rect x="176" y="68" width="8" height="120" fill="#b6c2d1"/>' +
        // rotating beam group
        '<g class="pki-b-beam" data-beam style="transform-origin:180px 72px">' +
        '<rect x="58" y="68" width="244" height="8" rx="4" fill="var(--tp-accent,#1763c7)"/>' +
        // left pan
        '<line x1="60" y1="72" x2="60" y2="118" stroke="#94a3b8" stroke-width="2"/>' +
        '<path d="M30 118 H90 L80 140 H40 Z" fill="#eef4ff" stroke="var(--tp-accent,#1763c7)" stroke-width="2"/>' +
        '<text data-panl x="60" y="133" text-anchor="middle" font-size="14" font-weight="800" fill="var(--tp-ink,#172033)"></text>' +
        // right pan
        '<line x1="300" y1="72" x2="300" y2="118" stroke="#94a3b8" stroke-width="2"/>' +
        '<path d="M270 118 H330 L320 140 H280 Z" fill="#eafaf0" stroke="#19a35a" stroke-width="2"/>' +
        '<text data-panr x="300" y="133" text-anchor="middle" font-size="14" font-weight="800" fill="var(--tp-ink,#172033)"></text>' +
        "</g>" +
        '<circle cx="180" cy="72" r="7" fill="#475569"/>' +
        "</svg>"
      );
    }

    var formsBox = el.querySelector("[data-forms]");
    var eqBox = el.querySelector("[data-eq]");
    var beam = el.querySelector("[data-beam]");
    var panL = el.querySelector("[data-panl]");
    var panR = el.querySelector("[data-panr]");
    var solveBtn = el.querySelector("[data-solve]");
    var stepsBox = el.querySelector("[data-steps]");
    var stepsInner = el.querySelector("[data-steps-inner]");

    function clampAll() {
      P = Math.max(P_MIN, Math.min(P_MAX, P));
      Q = Math.max(Q_MIN, Math.min(Q_MAX, Q));
      // Keep x whole & positive per form.
      if (formId === "add" && Q <= P) Q = P + 1; // x = q − p ≥ 1
      if (formId === "mul") {
        var k = Math.max(1, Math.round(Q / P));
        Q = Math.min(Q_MAX, P * k); // q a multiple of p so x is whole
      }
    }

    function tiltDeg(x) {
      var f = formById(formId);
      var leftW = f.left(x, P);
      var rightW = Q;
      var frac = (leftW - rightW) / (Math.abs(leftW) + Math.abs(rightW) + 1);
      // left heavier -> left pan down (positive screen y on left) -> negative rotate
      var deg = -16 * Math.max(-1, Math.min(1, frac * 3));
      return deg;
    }

    function render() {
      clampAll();
      el.querySelector('[data-val="p"]').value = P;
      el.querySelector('[data-val="q"]').value = Q;
      var f = formById(formId);
      var btns = formsBox.querySelectorAll(".pki-b-form");
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute(
          "aria-pressed",
          btns[i].getAttribute("data-form") === formId ? "true" : "false",
        );
      }
      var xVal = f.x(P, Q);
      // equation line: p,q are integers (safe); highlight the variable.
      eqBox.innerHTML =
        f.leftExpr(P, VAR).replace(VAR, '<span class="pki-b-x">' + esc(VAR) + "</span>") +
        " = " +
        Q;
      // pan labels
      panL.textContent = solved ? f.leftExpr(P, String(xVal)) : f.leftExpr(P, VAR);
      panR.textContent = String(Q);
      // tilt: pre-solve uses x=0 placeholder; solved uses true x (balanced)
      beam.style.transform = "rotate(" + (solved ? 0 : tiltDeg(0)).toFixed(2) + "deg)";
      // steps
      if (solved) {
        stepsInner.innerHTML =
          '<p class="pki-b-answer">✓ ' +
          esc(VAR) +
          " = " +
          xVal +
          "  —  that's " +
          esc(theme.xName) +
          ".</p>" +
          "<ol>" +
          "<li>Start: <code>" +
          esc(f.leftExpr(P, VAR)) +
          " = " +
          Q +
          "</code></li>" +
          "<li>Undo it: <code>" +
          esc(f.inverse(P)) +
          "</code>.</li>" +
          "<li>Both sides: <code>" +
          esc(f.work(P, Q).replace("x", VAR)) +
          " = " +
          xVal +
          "</code></li>" +
          "<li>Check: <code>" +
          esc(f.leftExpr(P, String(xVal))) +
          " = " +
          Q +
          "</code> ✓</li>" +
          "</ol>";
        stepsBox.classList.add("open");
        solveBtn.textContent = "↻ Reset & try new numbers";
      } else {
        stepsBox.classList.remove("open");
        stepsInner.innerHTML = "";
        solveBtn.textContent = "⚖️ Solve it — undo on both sides";
      }
    }

    formsBox.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-form]");
      if (!b) return;
      formId = b.getAttribute("data-form");
      solved = false;
      render();
    });

    el.addEventListener("click", function (e) {
      var inc = e.target.getAttribute && e.target.getAttribute("data-inc");
      var dec = e.target.getAttribute && e.target.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "p") P += d;
      // In p·x=q, step q by p so it lands on the next clean multiple of p.
      else Q += formId === "mul" ? d * P : d;
      solved = false;
      render();
    });

    el.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      if (key === "p") P = v;
      else Q = v;
      solved = false;
      render();
    });

    solveBtn.addEventListener("click", function () {
      solved = !solved;
      render();
    });

    render();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="balance"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="balance"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["balance"] = init;
  }
})();
