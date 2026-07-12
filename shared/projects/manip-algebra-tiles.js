/* ==========================================================================
   Neft Teacher — "Algebra Tiles" manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="algebra-tiles"
          data-var="x" data-x-default="3" data-x-min="0" data-x-max="10"></div>
   Build an expression from x-tiles (each worth the variable) and 1-tiles (each
   worth 1). −/+ add or remove tiles; a slider sets the value of x. Live readout
   of the expression (e.g. "3x + 5") and its value for the chosen x, so students
   connect the concrete tiles to writing and evaluating an expression.
   Optional data-var (variable letter). No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-algtiles-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-at{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-at h4{margin:0 0 12px;font-size:1.15rem;color:#12355b}" +
      ".pki-at-row{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap}" +
      ".pki-at-row label{font-size:.85rem;font-weight:800;color:#54677c;min-width:70px}" +
      ".pki-at-btn{width:38px;height:38px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#1fa6a2;font-size:1.3rem;font-weight:800;cursor:pointer;line-height:1}" +
      ".pki-at-btn:active{transform:scale(.9)}" +
      ".pki-at-btn:focus-visible{outline:3px solid #1fa6a2;outline-offset:2px}" +
      ".pki-at-mat{display:flex;flex-wrap:wrap;gap:8px;min-height:56px;padding:12px;background:#f6faff;border:2px dashed #cfe0f0;border-radius:12px;margin:10px 0}" +
      ".pki-at-x{display:flex;align-items:center;justify-content:center;width:64px;height:44px;background:#1fa6a2;color:#fff;border-radius:8px;font-weight:800;font-size:1.1rem}" +
      ".pki-at-one{display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#f2c15b;color:#12355b;border-radius:8px;font-weight:800}" +
      ".pki-at-eq{font-size:1.25rem;color:#12355b;margin-top:8px}" +
      ".pki-at-eq b{color:#1fa6a2;font-size:1.4rem}" +
      ".pki-at-slider{display:flex;align-items:center;gap:10px}" +
      ".pki-at-slider input{flex:1}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var VAR = (el.dataset.var || "x").slice(0, 2);
    var XMIN = num(el.dataset.xMin, 0),
      XMAX = num(el.dataset.xMax, 10);
    var x = clamp(num(el.dataset.xDefault, 3));
    var xTiles = 3,
      ones = 5;
    var MAXT = 8;

    function num(v, d) {
      var n = parseInt(v, 10);
      return isNaN(n) ? d : n;
    }
    function clamp(v) {
      return Math.max(XMIN, Math.min(XMAX, v));
    }

    el.innerHTML =
      "<h4>🟩 Algebra Tiles — Build an expression</h4>" +
      '<div class="pki-at-row"><label>' +
      VAR +
      "-tiles</label>" +
      '<button class="pki-at-btn" data-x-dec aria-label="Fewer x tiles">−</button>' +
      '<span data-x-count style="font-weight:800;min-width:22px;text-align:center"></span>' +
      '<button class="pki-at-btn" data-x-inc aria-label="More x tiles">+</button>' +
      '<label style="margin-left:12px">1-tiles</label>' +
      '<button class="pki-at-btn" data-one-dec aria-label="Fewer 1 tiles">−</button>' +
      '<span data-one-count style="font-weight:800;min-width:22px;text-align:center"></span>' +
      '<button class="pki-at-btn" data-one-inc aria-label="More 1 tiles">+</button></div>' +
      '<div class="pki-at-mat" data-mat aria-live="polite"></div>' +
      '<div class="pki-at-row pki-at-slider"><label>' +
      VAR +
      " =</label>" +
      '<input type="range" data-x-range min="' +
      XMIN +
      '" max="' +
      XMAX +
      '" value="' +
      x +
      '" aria-label="Value of ' +
      VAR +
      '" />' +
      '<b data-x-val style="min-width:24px;text-align:center">' +
      x +
      "</b></div>" +
      '<div class="pki-at-eq" data-eq></div>';

    function exprStr() {
      var parts = [];
      if (xTiles > 0) parts.push((xTiles === 1 ? "" : xTiles) + VAR);
      if (ones > 0) parts.push(String(ones));
      return parts.length ? parts.join(" + ") : "0";
    }

    function refresh() {
      el.querySelector("[data-x-count]").textContent = xTiles;
      el.querySelector("[data-one-count]").textContent = ones;
      el.querySelector("[data-x-val]").textContent = x;
      var mat = el.querySelector("[data-mat]");
      mat.innerHTML = "";
      for (var i = 0; i < xTiles; i++) {
        var t = document.createElement("div");
        t.className = "pki-at-x";
        t.textContent = VAR;
        mat.appendChild(t);
      }
      for (var j = 0; j < ones; j++) {
        var o = document.createElement("div");
        o.className = "pki-at-one";
        o.textContent = "1";
        mat.appendChild(o);
      }
      var value = xTiles * x + ones;
      el.querySelector("[data-eq]").innerHTML =
        "Expression: <b>" +
        exprStr() +
        "</b><br>When " +
        VAR +
        " = " +
        x +
        ":&nbsp; " +
        exprStr() +
        " = " +
        (xTiles ? xTiles + "×" + x + (ones ? " + " + ones : "") : ones) +
        " = <b>" +
        value +
        "</b>";
    }

    el.querySelector("[data-x-dec]").addEventListener("click", function () {
      xTiles = Math.max(0, xTiles - 1);
      refresh();
    });
    el.querySelector("[data-x-inc]").addEventListener("click", function () {
      xTiles = Math.min(MAXT, xTiles + 1);
      refresh();
    });
    el.querySelector("[data-one-dec]").addEventListener("click", function () {
      ones = Math.max(0, ones - 1);
      refresh();
    });
    el.querySelector("[data-one-inc]").addEventListener("click", function () {
      ones = Math.min(MAXT + 4, ones + 1);
      refresh();
    });
    el.querySelector("[data-x-range]").addEventListener("input", function (e) {
      x = clamp(parseInt(e.target.value, 10) || 0);
      refresh();
    });

    refresh();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="algebra-tiles"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="algebra-tiles"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["algebra-tiles"] = init;
  }
})();
