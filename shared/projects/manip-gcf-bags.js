/* ==========================================================================
   Neft Teacher — GCF "Build Equal Groups" manipulative (self-contained)
   Drop a container on the page and this renders a tap-to-build widget:
     <div class="pki-manip" data-manip="gcf-bags"
          data-item-a="🔖" data-label-a="stickers"
          data-item-b="🍫" data-label-b="granola bars"
          data-default-a="48" data-default-b="36"
          data-group="goodie bag"></div>
   Students tap − / + to change the number of groups and SEE whether both
   amounts split evenly; the widget calls out the largest equal grouping (GCF).
   No dependencies. Injects its own scoped styles once.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-manip-style";
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-manip{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-manip h4{margin:0 0 4px;font-size:1.15rem}" +
      ".pki-manip .pki-m-sub{margin:0 0 14px;color:var(--tp-muted,#54677c);font-size:.95rem}" +
      ".pki-m-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-bottom:14px}" +
      ".pki-m-field{flex:1 1 130px}.pki-m-field label{display:block;font-size:.8rem;font-weight:800;letter-spacing:.03em;color:var(--tp-muted,#54677c);margin-bottom:5px}" +
      ".pki-m-stepwrap{display:flex;align-items:center;gap:8px}" +
      ".pki-m-stepwrap input{width:72px;text-align:center;font-size:1.15rem;font-weight:800;padding:.45em;border:2px solid var(--tp-line,#e4ebf2);border-radius:12px}" +
      ".pki-m-btn{width:42px;height:42px;border-radius:12px;border:2px solid var(--tp-line,#e4ebf2);background:#fff;color:var(--tp-accent,#1763c7);font-size:1.5rem;font-weight:800;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}" +
      ".pki-m-btn:active{transform:scale(.9)}" +
      ".pki-m-bags{display:flex;flex-wrap:wrap;gap:10px;margin:6px 0 14px}" +
      ".pki-m-bag{border:2px dashed var(--tp-line,#cbd5e1);border-radius:14px;padding:10px;min-width:74px;text-align:center;background:#f8fafc;transition:all .18s ease}" +
      ".pki-m-bag.ok{border-style:solid;border-color:#19a35a;background:#eafaf0}" +
      ".pki-m-bag .pki-m-cap{font-size:.72rem;font-weight:800;color:var(--tp-muted,#54677c);text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}" +
      ".pki-m-bag .pki-m-emo{font-size:1.25rem;line-height:1.5;word-break:break-word}" +
      ".pki-m-bag .pki-m-count{font-size:.8rem;color:var(--tp-ink,#172033);margin-top:3px}" +
      ".pki-m-status{border-radius:12px;padding:12px 14px;font-weight:700;font-size:1rem}" +
      ".pki-m-status.good{background:#eafaf0;color:#0f7a40;border:1px solid #b6e6c8}" +
      ".pki-m-status.bad{background:#fff4ef;color:#b4470f;border:1px solid #f6c9b4}" +
      ".pki-m-status.best{background:linear-gradient(135deg,var(--tp-accent,#1763c7),var(--tp-accent2,#0e9a8c));color:#fff;border:none;box-shadow:0 8px 20px -8px rgba(12,27,42,.4)}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a;
  }
  function emoji(ch, n) {
    n = Math.max(0, n | 0);
    if (n <= 6) return new Array(n + 1).join(ch);
    return ch + " ×" + n;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var itemA = el.dataset.itemA || "🔖";
    var itemB = el.dataset.itemB || "🍫";
    var labelA = el.dataset.labelA || "stickers";
    var labelB = el.dataset.labelB || "granola bars";
    var group = el.dataset.group || "group";
    var A = parseInt(el.dataset.defaultA, 10) || 48;
    var B = parseInt(el.dataset.defaultB, 10) || 36;
    var groups = 1;
    var MAXG = 16;

    el.innerHTML =
      "<h4>🎒 Build Equal " +
      group.replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      }) +
      "s</h4>" +
      '<p class="pki-m-sub">Change your amounts and the number of ' +
      group +
      "s. When BOTH split evenly with nothing left over, the " +
      group +
      "s turn green. The most equal " +
      group +
      "s you can make is the <b>GCF</b>.</p>" +
      '<div class="pki-m-row">' +
      field("a", "Number of " + labelA, A) +
      field("b", "Number of " + labelB, B) +
      field("g", "Number of " + group + "s", groups) +
      "</div>" +
      '<div class="pki-m-bags" data-bags></div>' +
      '<div class="pki-m-status" data-status></div>';

    function field(key, label, val) {
      return (
        '<div class="pki-m-field"><label>' +
        label +
        "</label>" +
        '<div class="pki-m-stepwrap">' +
        '<button type="button" class="pki-m-btn" data-dec="' +
        key +
        '" aria-label="decrease">−</button>' +
        '<input type="text" inputmode="numeric" data-val="' +
        key +
        '" value="' +
        val +
        '">' +
        '<button type="button" class="pki-m-btn" data-inc="' +
        key +
        '" aria-label="increase">+</button>' +
        "</div></div>"
      );
    }

    var bagsBox = el.querySelector("[data-bags]");
    var statusBox = el.querySelector("[data-status]");

    function clampAll() {
      A = Math.max(1, Math.min(999, A));
      B = Math.max(1, Math.min(999, B));
      groups = Math.max(1, Math.min(MAXG, groups));
    }
    function render() {
      clampAll();
      el.querySelector('[data-val="a"]').value = A;
      el.querySelector('[data-val="b"]').value = B;
      el.querySelector('[data-val="g"]').value = groups;
      var perA = Math.floor(A / groups),
        remA = A % groups;
      var perB = Math.floor(B / groups),
        remB = B % groups;
      var even = remA === 0 && remB === 0;
      var theGCF = gcd(A, B);
      var html = "";
      for (var i = 0; i < groups; i++) {
        html +=
          '<div class="pki-m-bag' +
          (even ? " ok" : "") +
          '">' +
          '<div class="pki-m-cap">' +
          group +
          " " +
          (i + 1) +
          "</div>" +
          '<div class="pki-m-emo">' +
          emoji(itemA, perA) +
          " " +
          emoji(itemB, perB) +
          "</div>" +
          '<div class="pki-m-count">' +
          perA +
          " " +
          labelA +
          " · " +
          perB +
          " " +
          labelB +
          "</div>" +
          "</div>";
      }
      bagsBox.innerHTML = html;
      if (even && groups === theGCF) {
        statusBox.className = "pki-m-status best";
        statusBox.innerHTML =
          "🏆 " +
          groups +
          " " +
          group +
          "s is the GREATEST common factor (GCF) of " +
          A +
          " and " +
          B +
          " — the most equal " +
          group +
          "s you can make!";
      } else if (even) {
        statusBox.className = "pki-m-status good";
        statusBox.innerHTML =
          "✓ Even split! " +
          groups +
          " is a common factor of " +
          A +
          " and " +
          B +
          ". Can you make MORE equal " +
          group +
          "s? (Try up to " +
          theGCF +
          ".)";
      } else {
        statusBox.className = "pki-m-status bad";
        statusBox.innerHTML =
          "Not equal yet — " +
          groups +
          " " +
          group +
          "s leaves " +
          remA +
          " " +
          labelA +
          " and " +
          remB +
          " " +
          labelB +
          " left over. Try a number that divides both.";
      }
    }

    el.addEventListener("click", function (e) {
      var inc = e.target.getAttribute && e.target.getAttribute("data-inc");
      var dec = e.target.getAttribute && e.target.getAttribute("data-dec");
      var key = inc || dec;
      if (!key) return;
      var d = inc ? 1 : -1;
      if (key === "a") A += d;
      else if (key === "b") B += d;
      else groups += d;
      render();
    });
    el.addEventListener("input", function (e) {
      var key = e.target.getAttribute && e.target.getAttribute("data-val");
      if (!key) return;
      var v = parseInt(e.target.value, 10);
      if (isNaN(v)) return;
      if (key === "a") A = v;
      else if (key === "b") B = v;
      else groups = v;
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
    document.querySelectorAll('.pki-manip[data-manip="gcf-bags"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="gcf-bags"]').forEach(init);
    }, 900);
  });
})();
