/* ==========================================================================
   Neft Teacher — "Expression Machine" manipulative (self-contained)
   Builds & evaluates a two-term linear expression a·x + b with tiles.
   Drop a container on the page:
     <div class="pki-manip" data-manip="expr-machine"
          data-coef-name="coins per level" data-var-name="levels"
          data-const-name="bonus"
          data-default-a="3" data-default-x="4" data-default-b="2"
          data-result-name="score"></div>
   Students tap − / + to change the coefficient a, the variable x, and the
   constant b. The widget SHOWS a groups of x tiles plus b single tiles and
   the worked evaluation "a·x + b = (a×x) + b = RESULT". Updates live.
   No dependencies. Injects its own scoped styles once. (6.AT.B)
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-expr-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-manip{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-manip h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-manip .pki-e-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-e-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-bottom:14px}" +
      ".pki-e-field{flex:1 1 130px}.pki-e-field label{display:block;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:5px}" +
      ".pki-e-stepwrap{display:flex;align-items:center;gap:8px}" +
      ".pki-e-stepwrap input{width:72px;text-align:center;font-size:1.15rem;font-weight:800;padding:.45em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px}" +
      ".pki-e-btn{width:42px;height:42px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-e-btn:active{transform:scale(.9)}" +
      ".pki-e-stage{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:6px 0 14px;padding:12px;background:#f8fafc;border:1px solid var(--tp-line,#e4ebf2);border-radius:14px;min-height:48px}" +
      ".pki-e-grp{display:flex;flex-direction:column;align-items:center;gap:5px}" +
      ".pki-e-grp .pki-e-cap{font-size:.66rem;font-weight:800;color:var(--tp-muted,#54677c);text-transform:uppercase;letter-spacing:.04em}" +
      ".pki-e-box{display:flex;flex-wrap:wrap;gap:4px;max-width:132px;padding:6px;border:2px solid var(--tp-accent,#1763c7);border-radius:12px;background:#eef4ff;justify-content:center}" +
      ".pki-e-tile{width:20px;height:20px;border-radius:5px;background:var(--tp-accent,#1763c7);box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}" +
      ".pki-e-const{display:flex;flex-direction:column;align-items:center;gap:5px}" +
      ".pki-e-cbox{display:flex;flex-wrap:wrap;gap:4px;max-width:120px;padding:6px;border:2px solid var(--tp-accent2,#0e9a8c);border-radius:12px;background:#e8faf6;justify-content:center}" +
      ".pki-e-ctile{width:20px;height:20px;border-radius:5px;background:var(--tp-accent2,#0e9a8c);box-shadow:inset 0 -2px 0 rgba(0,0,0,.18)}" +
      ".pki-e-op{font-size:1.6rem;font-weight:800;color:var(--tp-muted,#54677c);padding:0 2px}" +
      ".pki-e-eval{border-radius:12px;padding:12px 14px;font-size:1.02rem;font-weight:700;line-height:1.7;background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;border:none;box-shadow:0 8px 20px -8px rgba(12,27,42,.4)}" +
      ".pki-e-eval code{background:rgba(255,255,255,.18);border-radius:6px;padding:1px 7px;font-weight:800;font-size:1.05em}" +
      ".pki-e-eval .pki-e-res{font-size:1.25em}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function tiles(n, cls) {
    n = Math.max(0, n | 0);
    var html = "";
    for (var i = 0; i < n; i++) html += '<span class="' + cls + '"></span>';
    return html;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var coefName = el.dataset.coefName || "coefficient a";
    var varName = el.dataset.varName || "variable x";
    var constName = el.dataset.constName || "constant b";
    var resultName = el.dataset.resultName || "result";
    var a = parseInt(el.dataset.defaultA, 10);
    var x = parseInt(el.dataset.defaultX, 10);
    var b = parseInt(el.dataset.defaultB, 10);
    if (isNaN(a)) a = 3;
    if (isNaN(x)) x = 4;
    if (isNaN(b)) b = 2;
    var MAXA = 8,
      MAXX = 10,
      MAXB = 12;

    el.innerHTML =
      "<h4>🧮 Expression Machine — build a·x + b</h4>" +
      '<p class="pki-e-sub">Tap − / + to set <b>a</b> (' +
      coefName +
      "), <b>x</b> (" +
      varName +
      "), and <b>b</b> (" +
      constName +
      "). Watch <b>a</b> groups of <b>x</b> tiles plus <b>b</b> single tiles — then read the worked-out " +
      resultName +
      ".</p>" +
      '<div class="pki-e-row">' +
      field("a", "a · " + coefName, a) +
      field("x", "x · " + varName, x) +
      field("b", "b · " + constName, b) +
      "</div>" +
      '<div class="pki-e-stage" data-stage></div>' +
      '<div class="pki-e-eval" data-eval></div>';

    function field(key, label, val) {
      return (
        '<div class="pki-e-field"><label>' +
        label +
        "</label>" +
        '<div class="pki-e-stepwrap">' +
        '<button type="button" class="pki-e-btn" data-dec="' +
        key +
        '" aria-label="decrease ' +
        key +
        '">−</button>' +
        '<input type="text" inputmode="numeric" data-val="' +
        key +
        '" value="' +
        val +
        '" aria-label="' +
        key +
        '">' +
        '<button type="button" class="pki-e-btn" data-inc="' +
        key +
        '" aria-label="increase ' +
        key +
        '">+</button>' +
        "</div></div>"
      );
    }

    var stageBox = el.querySelector("[data-stage]");
    var evalBox = el.querySelector("[data-eval]");

    function clampAll() {
      a = Math.max(0, Math.min(MAXA, a));
      x = Math.max(0, Math.min(MAXX, x));
      b = Math.max(0, Math.min(MAXB, b));
    }

    function render() {
      clampAll();
      el.querySelector('[data-val="a"]').value = a;
      el.querySelector('[data-val="x"]').value = x;
      el.querySelector('[data-val="b"]').value = b;

      var html = "";
      if (a === 0) {
        html += '<span class="pki-e-op">0</span>';
      }
      for (var i = 0; i < a; i++) {
        if (i > 0) html += '<span class="pki-e-op">+</span>';
        html +=
          '<div class="pki-e-grp">' +
          '<span class="pki-e-cap">group ' +
          (i + 1) +
          "</span>" +
          '<div class="pki-e-box">' +
          tiles(x, "pki-e-tile") +
          "</div></div>";
      }
      html += '<span class="pki-e-op">+</span>';
      html +=
        '<div class="pki-e-const">' +
        '<span class="pki-e-cap">+ b (' +
        constName +
        ")</span>" +
        '<div class="pki-e-cbox">' +
        (b === 0
          ? '<span style="color:#94a3b8;font-size:.8rem">0</span>'
          : tiles(b, "pki-e-ctile")) +
        "</div></div>";
      stageBox.innerHTML = html;

      var product = a * x;
      var result = product + b;
      evalBox.innerHTML =
        "a·x + b = <code>" +
        a +
        "·" +
        x +
        " + " +
        b +
        "</code> = (" +
        a +
        "×" +
        x +
        ") + " +
        b +
        " = " +
        product +
        " + " +
        b +
        ' = <span class="pki-e-res">' +
        result +
        "</span><br>" +
        a +
        " " +
        coefName +
        " × " +
        x +
        " " +
        varName +
        " + " +
        b +
        " " +
        constName +
        " → " +
        resultName +
        " = <b>" +
        result +
        "</b>";
    }

    el.addEventListener("click", function (e) {
      var inc = e.target.getAttribute && e.target.getAttribute("data-inc");
      var dec = e.target.getAttribute && e.target.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "a") a += d;
      else if (key === "x") x += d;
      else b += d;
      render();
    });
    el.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      if (key === "a") a = v;
      else if (key === "x") x = v;
      else b = v;
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
    document.querySelectorAll('.pki-manip[data-manip="expr-machine"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="expr-machine"]').forEach(init);
    }, 900);
  });
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["expr-machine"] = init;
  }
})();
