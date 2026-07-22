/* ==========================================================================
   Neft Teacher — Manipulative: MARKET DAY (data-manip="market-day")
   A pricing-duel tycoon for Rates & Percents (6.AT.3/4). Set a DISCOUNT % on
   your product; your sale price, tax, out-the-door price and margin update
   live. Press OPEN SHOP and a day of customers each buys from whoever's
   out-the-door price is lower (you vs the Rival Kiosk) — but only sales ABOVE
   cost make money. Clear the day's RENT to keep the lease.
     Sweet spot = discount enough to beat the rival, but not so much your
     margin drops below zero. That tension IS the percent reasoning.
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail (adjust + re-open freely).
   Usage:  <div class="pki-manip" data-manip="market-day"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-md-styles";

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
      ".pki-md{--md-ink:#172033;--md-blue:#2f6bff;--md-green:#12a150;--md-red:#d33;font-family:inherit;color:var(--md-ink)}",
      ".pki-md h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-md .md-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-md .md-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-md .md-facts{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px}",
      ".pki-md .md-fact{flex:1;min-width:96px;text-align:center;background:#f7f9ff;border:1px solid #e2e8f6;border-radius:10px;padding:8px 6px;font-size:11.5px;font-weight:700;color:#5a6478}",
      ".pki-md .md-fact b{display:block;font-size:17px;color:var(--md-ink);font-variant-numeric:tabular-nums}",
      ".pki-md .md-fact.rival b{color:#a05a00}",
      ".pki-md .md-ctl{margin:4px 0 12px}",
      ".pki-md .md-ctl label{font-size:13px;font-weight:800;display:flex;justify-content:space-between}",
      ".pki-md .md-ctl label b{color:var(--md-blue);font-size:16px}",
      ".pki-md .md-row{display:flex;align-items:center;gap:8px;margin-top:6px}",
      ".pki-md .md-step{cursor:pointer;border:2px solid #d5ddec;background:#f7f9ff;color:var(--md-ink);border-radius:9px;width:40px;height:40px;font-size:20px;font-weight:800}",
      ".pki-md input[type=range]{flex:1;accent-color:var(--md-blue)}",
      ".pki-md .md-derived{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0 0}",
      ".pki-md .md-d{flex:1;min-width:120px;background:#f2f6ff;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:700;color:#34405a}",
      ".pki-md .md-d b{display:block;font-size:16px;font-variant-numeric:tabular-nums}",
      ".pki-md .md-d.win b{color:var(--md-green)}.pki-md .md-d.lose b{color:var(--md-red)}",
      ".pki-md .md-cheaper{font-size:12.5px;font-weight:800;margin-top:8px}",
      ".pki-md .md-cheaper.you{color:var(--md-green)}.pki-md .md-cheaper.rival{color:var(--md-red)}",
      ".pki-md .md-open{margin-top:12px;width:100%;cursor:pointer;border:0;background:linear-gradient(90deg,var(--md-blue),#1748c0);color:#fff;font-weight:800;border-radius:11px;padding:12px;font-size:16px}",
      ".pki-md .md-day{display:flex;gap:6px;justify-content:center;margin:12px 0 0;min-height:30px;font-size:24px}",
      ".pki-md .md-cust{opacity:0;transition:opacity .25s,transform .25s;transform:translateY(6px)}",
      ".pki-md .md-cust.show{opacity:1;transform:none}",
      ".pki-md .md-result{margin:12px 0 0;text-align:center}",
      ".pki-md .md-bar{height:16px;border-radius:99px;background:#e6ebf5;overflow:hidden;margin:8px 0}",
      ".pki-md .md-bar>span{display:block;height:100%;background:linear-gradient(90deg,var(--md-green),#0c7c3d)}",
      ".pki-md .md-verdict{font-size:20px;font-weight:900}",
      ".pki-md .md-verdict.win{color:var(--md-green)}.pki-md .md-verdict.lose{color:var(--md-red)}",
      ".pki-md .md-msg{min-height:18px;font-size:13px;font-weight:700;color:#e08a00;margin-top:6px}",
      "@media (prefers-reduced-motion:reduce){.pki-md *{transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-md{color:#eef2fb}.pki-md .md-card{background:#1b2233;border-color:rgba(255,255,255,.14)}.pki-md .md-fact,.pki-md .md-d{background:#232c40;border-color:#39435c;color:#c6cede}.pki-md .md-fact b{color:#eef2fb}.pki-md .md-step{background:#232c40;border-color:#39435c;color:#eef2fb}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Level configs. rivalOut = rival's out-the-door price (fixed).
  var CFG = {
    0: {
      base: 10,
      cost: 6,
      tax: 0,
      rivalOut: 9,
      rent: 12,
      customers: 4,
      step: 10,
      start: 0,
      supplier: 0,
    },
    1: {
      base: 20,
      cost: 12,
      tax: 6,
      rivalOut: 19.6,
      rent: 25,
      customers: 5,
      step: 5,
      start: 0,
      supplier: 0,
    },
    2: {
      base: 20,
      cost: 12,
      tax: 6,
      rivalOut: 19.6,
      rent: 12,
      customers: 5,
      step: 5,
      start: 0,
      supplier: 3,
    },
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function money(n) {
    return "$" + (Math.round(n * 100) / 100).toFixed(2);
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-md");
    var level = levelOf();
    var c = Object.assign({}, CFG[level] || CFG[1]);
    var state = { discount: c.start, cost: c.cost, opened: false, curveDone: false };

    function calc() {
      var sale = c.base * (1 - state.discount / 100);
      var out = sale * (1 + c.tax / 100);
      var margin = sale - state.cost;
      var beat = out <= c.rivalOut + 1e-9;
      return { sale: sale, out: out, margin: margin, beat: beat };
    }

    function shell() {
      var r = calc();
      var facts =
        '<div class="md-facts">' +
        '<div class="md-fact">Base price<b>' +
        money(c.base) +
        "</b></div>" +
        '<div class="md-fact">Your cost<b>' +
        money(state.cost) +
        "</b></div>" +
        (c.tax ? '<div class="md-fact">Sales tax<b>' + c.tax + "%</b></div>" : "") +
        '<div class="md-fact rival">Rival price<b>' +
        money(c.rivalOut) +
        "</b></div>" +
        '<div class="md-fact">Rent to clear<b>' +
        money(c.rent) +
        "</b></div>" +
        "</div>";
      var ctl =
        '<div class="md-ctl"><label>Your discount <b data-dlabel>' +
        state.discount +
        "%</b></label>" +
        '<div class="md-row"><button type="button" class="md-step" data-dec>−</button>' +
        '<input type="range" min="0" max="50" step="' +
        c.step +
        '" value="' +
        state.discount +
        '" data-slider aria-label="discount percent">' +
        '<button type="button" class="md-step" data-inc>+</button></div></div>';
      var derived =
        '<div class="md-derived">' +
        '<div class="md-d">Your sale price<b data-sale>' +
        money(r.sale) +
        "</b></div>" +
        (c.tax ? '<div class="md-d">Out-the-door<b data-out>' + money(r.out) + "</b></div>" : "") +
        '<div class="md-d ' +
        (r.margin >= 0 ? "win" : "lose") +
        '" data-marginbox>Margin / sale<b data-margin>' +
        money(r.margin) +
        "</b></div>" +
        "</div>" +
        '<div class="md-cheaper ' +
        (r.beat ? "you" : "rival") +
        '" data-cheaper>' +
        (r.beat ? "✓ You beat the rival's price" : "✗ Rival is cheaper — you'll lose the crowd") +
        "</div>";
      return (
        "<h4>🏪 Market Day</h4>" +
        '<p class="md-sub">Día de mercado — price to beat the rival AND stay above cost, then open the shop.</p>' +
        '<div class="md-card">' +
        facts +
        ctl +
        derived +
        '<button type="button" class="md-open" data-open>🔔 OPEN SHOP</button>' +
        '<div class="md-day" data-day></div><div class="md-result" data-result></div>' +
        '<div class="md-msg" data-msg aria-live="polite"></div></div>'
      );
    }

    function refreshDerived() {
      var r = calc();
      var q = function (s) {
        return el.querySelector(s);
      };
      if (q("[data-dlabel]")) q("[data-dlabel]").textContent = state.discount + "%";
      if (q("[data-sale]")) q("[data-sale]").textContent = money(r.sale);
      if (q("[data-out]")) q("[data-out]").textContent = money(r.out);
      if (q("[data-margin]")) q("[data-margin]").textContent = money(r.margin);
      var mb = q("[data-marginbox]");
      if (mb) {
        mb.classList.toggle("win", r.margin >= 0);
        mb.classList.toggle("lose", r.margin < 0);
      }
      var ch = q("[data-cheaper]");
      if (ch) {
        ch.className = "md-cheaper " + (r.beat ? "you" : "rival");
        ch.textContent = r.beat
          ? "✓ You beat the rival's price"
          : "✗ Rival is cheaper — you'll lose the crowd";
      }
    }

    function openShop() {
      var r = calc();
      var dayBox = el.querySelector("[data-day]");
      var resBox = el.querySelector("[data-result]");
      var msg = el.querySelector("[data-msg]");
      dayBox.innerHTML = "";
      resBox.innerHTML = "";
      msg.textContent = "";
      var sold = r.beat ? c.customers : 0;
      var profit = sold * r.margin;
      // animate customers
      for (var i = 0; i < c.customers; i++) {
        var span = document.createElement("span");
        span.className = "md-cust";
        span.textContent = r.beat ? "🧍" : "🚶";
        dayBox.appendChild(span);
      }
      var kids = dayBox.querySelectorAll(".md-cust");
      kids.forEach(function (k, i) {
        setTimeout(function () {
          k.classList.add("show");
          k.textContent = r.beat ? "🛍️" : "🚶";
        }, 160 * i);
      });
      setTimeout(
        function () {
          var win = profit >= c.rent - 1e-9;
          var pct = Math.max(0, Math.min(100, (profit / c.rent) * 100));
          resBox.innerHTML =
            "<p style='margin:0;font-weight:700'>Sold to " +
            sold +
            " of " +
            c.customers +
            " · Profit " +
            money(profit) +
            " of " +
            money(c.rent) +
            " rent</p>" +
            "<div class='md-bar'><span style='width:" +
            pct +
            "%'></span></div>" +
            "<div class='md-verdict " +
            (win ? "win" : "lose") +
            "'>" +
            (win
              ? "💰 PROFIT — lease kept!"
              : profit <= 0
                ? "🚫 No sales — rival took the crowd"
                : "📉 Short on rent — adjust and re-open") +
            "</div>";
          // curveball once, at L2, after a winning open
          if (win && c.supplier && !state.curveDone) {
            state.curveDone = true;
            state.cost += c.supplier;
            msg.textContent =
              "⚠️ Supplier shock: your cost rose to " +
              money(state.cost) +
              ". Re-price to stay above cost!";
            var mb = el.querySelector("[data-marginbox]");
            // rebuild facts cost + derived
            render();
          }
          if (!win && !r.beat) {
            msg.textContent =
              "Tip: increase your discount so your price drops at or below the rival's.";
          } else if (!win && r.margin < 0) {
            msg.textContent =
              "Tip: your margin is negative — a smaller discount keeps each sale above cost.";
          }
        },
        160 * c.customers + 250,
      );
    }

    function render() {
      el.innerHTML = shell();
      var q = function (s) {
        return el.querySelector(s);
      };
      var slider = q("[data-slider]");
      slider.addEventListener("input", function () {
        state.discount = parseInt(slider.value, 10);
        refreshDerived();
      });
      q("[data-inc]").addEventListener("click", function () {
        state.discount = Math.min(50, state.discount + c.step);
        slider.value = state.discount;
        refreshDerived();
      });
      q("[data-dec]").addEventListener("click", function () {
        state.discount = Math.max(0, state.discount - c.step);
        slider.value = state.discount;
        refreshDerived();
      });
      q("[data-open]").addEventListener("click", openShop);
    }

    render();

    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== level && !state.opened) {
        level = lv;
        c = Object.assign({}, CFG[lv] || CFG[1]);
        state = { discount: c.start, cost: c.cost, opened: false, curveDone: false };
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="market-day"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["market-day"] = init;
  }
})();
