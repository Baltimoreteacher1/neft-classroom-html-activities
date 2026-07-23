/* ==========================================================================
   Neft Teacher — Manipulative: RECIPE RUSH (data-manip="recipe-rush")
   A bakery DINNER RUSH / order-service chain for Fractions (6.NOS.1, fraction
   division). Tickets stream in during the rush; each order gives a BATCH of
   batter and a serving size that is a UNIT FRACTION (1/2, 1/3, …). The student
   fills the ticket by picking how many servings the batch makes:
       whole batch ÷ unit fraction = whole × denominator = servings
   e.g. 4 cups ÷ 1/3 cup per muffin = 4 × 3 = 12 muffins.
   Each correct pick => "Order up!" + advances and adds to the orders-filled
   tally; all orders => SERVICE COMPLETE / kitchen closed payoff.

   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail (unlimited kind retries).
   Usage:  <div class="pki-manip" data-manip="recipe-rush"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-rr-styles";

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function injectCSS() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = [
      ".pki-rr{--rr-ink:#3a2417;--rr-brown:#a4571f;--rr-green:#0f8a4a;--rr-amber:#c9740a;--rr-cream:#fff7ec;font-family:inherit;color:var(--rr-ink)}",
      ".pki-rr h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-rr .rr-sub{margin:0 0 12px;font-size:13.5px;color:#8a6b52}",
      ".pki-rr .rr-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-rr .rr-pip{flex:1;height:8px;border-radius:99px;background:#efe1cf}",
      ".pki-rr .rr-pip.done{background:linear-gradient(90deg,var(--rr-green),#0b6b39)}",
      ".pki-rr .rr-pip.active{background:linear-gradient(90deg,var(--rr-amber),#a4571f)}",
      ".pki-rr .rr-card{border:1px solid rgba(164,87,31,.28);border-radius:14px;padding:14px;background:var(--rr-cream)}",
      ".pki-rr .rr-ticket{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--rr-brown)}",
      ".pki-rr .rr-emoji{font-size:26px;vertical-align:-4px}",
      ".pki-rr .rr-order{display:flex;flex-wrap:wrap;gap:10px;margin:8px 0 6px}",
      ".pki-rr .rr-chip{flex:1;min-width:110px;border:1px dashed rgba(164,87,31,.4);border-radius:10px;padding:8px 10px;background:#fffdf8}",
      ".pki-rr .rr-chip small{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#a88a6f}",
      ".pki-rr .rr-chip b{font-size:20px;font-variant-numeric:tabular-nums}",
      ".pki-rr .rr-prompt{margin:6px 0 8px;font-size:15px;font-weight:700}",
      ".pki-rr .rr-prompt .es{display:block;color:#8a6b52;font-style:italic;font-weight:500;font-size:12.5px;margin-top:2px}",
      ".pki-rr .rr-viz{display:block;width:100%;max-width:340px;height:auto;margin:2px 0 10px}",
      ".pki-rr .rr-opts{display:flex;flex-wrap:wrap;gap:8px}",
      ".pki-rr .rr-opt{cursor:pointer;border:2px solid #e0b787;background:#fff;color:var(--rr-ink);border-radius:10px;padding:10px 18px;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-rr .rr-opt:hover{transform:translateY(-1px);border-color:var(--rr-brown)}",
      ".pki-rr .rr-opt:focus-visible{outline:3px solid rgba(201,116,10,.5);outline-offset:2px}",
      ".pki-rr .rr-opt.wrong{border-color:#d64545;animation:rrShake .3s}",
      ".pki-rr .rr-opt:disabled{opacity:.5;cursor:default}",
      ".pki-rr .rr-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-rr .rr-msg.hint{color:var(--rr-amber)}.pki-rr .rr-msg.ok{color:var(--rr-green)}",
      ".pki-rr .rr-tally{display:flex;align-items:center;gap:8px;margin:12px 0 0;font-size:13px;font-weight:700;color:#8a6b52}",
      ".pki-rr .rr-tally b{font-size:18px;color:var(--rr-brown);font-variant-numeric:tabular-nums}",
      ".pki-rr .rr-form{margin:8px 0 0;font-size:12.5px;color:#8a6b52;font-weight:600}",
      ".pki-rr .rr-done{text-align:center;padding:16px 12px}",
      ".pki-rr .rr-closed{display:inline-block;font-size:26px;font-weight:900;letter-spacing:.05em;color:var(--rr-green)}",
      ".pki-rr .rr-again{margin-top:14px;cursor:pointer;border:0;background:var(--rr-brown);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes rrShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@media (prefers-reduced-motion:reduce){.pki-rr *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-rr{--rr-ink:#f3e6d6;--rr-cream:#2a1d13}",
      ".pki-rr .rr-sub,.pki-rr .rr-form,.pki-rr .rr-tally{color:#c8ac93}",
      ".pki-rr .rr-card{border-color:rgba(224,183,135,.3);background:#241811}",
      ".pki-rr .rr-chip{background:#2e2016;border-color:rgba(224,183,135,.35)}",
      ".pki-rr .rr-chip small{color:#b7987d}",
      ".pki-rr .rr-opt{background:#2e2016;border-color:#6d4a2b;color:#f3e6d6}",
      ".pki-rr .rr-pip{background:#3a2a1c}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Order: {emoji, item, batchLabel, batchVal, denom, ans, opts[]}
  // servings = batchVal ÷ (1/denom) = batchVal × denom = ans (a whole number).
  var SETS = {
    0: [
      {
        emoji: "🧁",
        item: "muffins",
        batchLabel: "3 cups",
        batchVal: 3,
        denom: 2,
        ans: 6,
        opts: [5, 6, 3],
      },
      {
        emoji: "🍪",
        item: "cookies",
        batchLabel: "4 cups",
        batchVal: 4,
        denom: 4,
        ans: 16,
        opts: [16, 8, 4],
      },
    ],
    1: [
      {
        emoji: "🧁",
        item: "muffins",
        batchLabel: "4 cups",
        batchVal: 4,
        denom: 3,
        ans: 12,
        opts: [9, 12, 7],
      },
      {
        emoji: "🍪",
        item: "cookies",
        batchLabel: "5 cups",
        batchVal: 5,
        denom: 4,
        ans: 20,
        opts: [20, 9, 15],
      },
      {
        emoji: "🥧",
        item: "tarts",
        batchLabel: "3 cups",
        batchVal: 3,
        denom: 6,
        ans: 18,
        opts: [9, 18, 12],
      },
    ],
    2: [
      {
        emoji: "🧁",
        item: "muffins",
        batchLabel: "2½ cups",
        batchVal: 2.5,
        denom: 4,
        ans: 10,
        opts: [8, 10, 6],
      },
      {
        emoji: "🥞",
        item: "pancakes",
        batchLabel: "3½ cups",
        batchVal: 3.5,
        denom: 2,
        ans: 7,
        opts: [7, 5, 6],
      },
      {
        emoji: "🥧",
        item: "tarts",
        batchLabel: "1½ cups",
        batchVal: 1.5,
        denom: 6,
        ans: 9,
        opts: [12, 9, 7],
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  // SVG measuring-cup bar: the batch, tiled into `ans` serving pieces, with
  // thicker dividers at each whole cup — a visual "whole ÷ unit fraction".
  function batchViz(o) {
    var W = 300,
      X = 12,
      Y = 14,
      H = 30;
    var n = o.ans;
    var pw = W / n;
    var pieces = "";
    for (var i = 0; i < n; i++) {
      var fill = i % 2 === 0 ? "#f6c98a" : "#e8ad63";
      pieces +=
        '<rect x="' +
        (X + i * pw).toFixed(2) +
        '" y="' +
        Y +
        '" width="' +
        pw.toFixed(2) +
        '" height="' +
        H +
        '" fill="' +
        fill +
        '" stroke="#a4571f" stroke-width="0.6"/>';
    }
    var cups = "";
    var whole = Math.ceil(o.batchVal);
    for (var c = 1; c < whole; c++) {
      if (c > o.batchVal) break;
      var cx = X + W * (c / o.batchVal);
      cups +=
        '<line x1="' +
        cx.toFixed(2) +
        '" y1="' +
        (Y - 4) +
        '" x2="' +
        cx.toFixed(2) +
        '" y2="' +
        (Y + H + 4) +
        '" stroke="#7a3f14" stroke-width="2"/>';
    }
    return (
      '<svg class="rr-viz" viewBox="0 0 324 62" role="img" aria-label="Batch of ' +
      o.batchLabel +
      " split into " +
      n +
      ' servings">' +
      '<rect x="' +
      X +
      '" y="' +
      Y +
      '" width="' +
      W +
      '" height="' +
      H +
      '" fill="#fff3df" stroke="#a4571f" stroke-width="1.4" rx="4"/>' +
      pieces +
      cups +
      '<text x="' +
      X +
      '" y="' +
      (Y + H + 18) +
      '" font-size="11" fill="#8a6b52" font-weight="700">|— ' +
      esc(o.batchLabel) +
      " of batter, scooped at 1/" +
      o.denom +
      " cup —|</text>" +
      "</svg>"
    );
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-rr");
    var state = { idx: 0, level: levelOf(), filled: 0 };
    function orders() {
      return SETS[state.level] || SETS[1];
    }

    function render() {
      var S = orders();
      var total = S.length;
      var rail = '<div class="rr-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="rr-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";

      var head =
        "<h4>🍞 Recipe Rush</h4>" +
        '<p class="rr-sub">Fill each order ticket during the dinner rush. <span class="es">Servicio de cena: completa cada orden.</span></p>' +
        rail;

      if (state.idx >= total) {
        el.innerHTML =
          head +
          '<div class="rr-card rr-done"><div class="rr-closed">🔔 SERVICE COMPLETE</div>' +
          '<p style="margin:10px 0 0;font-weight:700">Kitchen closed — every ticket filled. <span class="es">Cocina cerrada.</span></p>' +
          '<p class="rr-form" style="margin-top:8px">You served <b>' +
          state.filled +
          "</b> baked goods tonight. Reasoning: batch × denominator = servings.</p>" +
          '<button type="button" class="rr-again" data-again>Run the rush again</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.filled = 0;
          state.level = levelOf();
          render();
        });
        return;
      }

      var o = S[state.idx];
      var opts = o.opts
        .map(function (v) {
          return '<button type="button" class="rr-opt" data-v="' + v + '">' + v + "</button>";
        })
        .join("");

      el.innerHTML =
        head +
        '<div class="rr-card">' +
        '<div class="rr-ticket"><span class="rr-emoji">' +
        o.emoji +
        "</span> Ticket " +
        (state.idx + 1) +
        " of " +
        total +
        " · Order up!</div>" +
        '<div class="rr-order">' +
        '<div class="rr-chip"><small>Batch of batter</small><b>' +
        esc(o.batchLabel) +
        "</b></div>" +
        '<div class="rr-chip"><small>Serving size</small><b>1/' +
        o.denom +
        " cup / " +
        esc(o.item) +
        "</b></div>" +
        "</div>" +
        '<p class="rr-prompt">How many ' +
        esc(o.item) +
        " does this batch make?" +
        '<span class="es">¿Cuántas porciones salen del lote?</span></p>' +
        batchViz(o) +
        '<div class="rr-opts">' +
        opts +
        "</div>" +
        '<p class="rr-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        '<div class="rr-tally">🧾 Orders filled tonight: <b data-tally>' +
        state.filled +
        "</b></div>" +
        '<p class="rr-form">Think: batch ÷ (1 serving) = batch × ' +
        o.denom +
        " (the denominator).</p>";

      var msg = el.querySelector("[data-msg]");
      var btns = el.querySelectorAll(".rr-opt");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (parseInt(btn.dataset.v, 10) === o.ans) {
            state.filled += o.ans;
            btns.forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "rr-msg ok";
            msg.textContent =
              "✓ Order up! " + o.batchLabel + " × " + o.denom + " = " + o.ans + " " + o.item + ".";
            var tally = el.querySelector("[data-tally]");
            if (tally) tally.textContent = state.filled;
            setTimeout(function () {
              state.idx++;
              render();
            }, 1000);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "rr-msg hint";
            msg.textContent =
              "Not quite — the smaller each serving, the MORE servings the batch makes. Count how many 1/" +
              o.denom +
              " cups fit in " +
              o.batchLabel +
              ".";
          }
        });
      });
    }

    render();
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.filled === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="recipe-rush"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["recipe-rush"] = init;
  }
})();
