/* ==========================================================================
   Neft Teacher — Manipulative: MIX LAB (data-manip="mix-lab")
   A smoothie-bench for Unit 3 · Ratios (6.AT.1 / 6.AT.3). Three bench stages
   that must each be dialed in correctly to perfect the mix —
     1) BUILD THE RATIO: steppers set two quantities; match an EQUIVALENT
        ratio at a requested scale (double / triple / ×2.5). Stacked SVG
        tiles make equivalence visible; a live check reduces & compares.
     2) RATIO TABLE: fill the one missing cell (pick from 3) so the row
        stays equivalent (unit-rate / scaling).
     3) BEST BUY: two bundle deals (price ÷ quantity); pick the better
        unit rate.
   Each correct stage advances; all => MIX PERFECTED / lab closed. Self-
   mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2 — L0 is 2 stages), bilingual, no-fail.
   Usage:  <div class="pki-manip" data-manip="mix-lab"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-ml-styles";

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
      ".pki-ml{--ml-ink:#231733;--ml-berry:#d1477a;--ml-cream:#7c5cbf;--ml-green:#12a150;--ml-amber:#b56b00;--ml-card:#fff;--ml-line:rgba(35,23,51,.14);font-family:inherit;color:var(--ml-ink)}",
      ".pki-ml h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-ml .ml-sub{margin:0 0 12px;font-size:13.5px;color:#6a5d78}",
      ".pki-ml .ml-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-ml .ml-pip{flex:1;height:8px;border-radius:99px;background:#ece6f2}",
      ".pki-ml .ml-pip.done{background:linear-gradient(90deg,var(--ml-green),#0c7c3d)}",
      ".pki-ml .ml-pip.active{background:linear-gradient(90deg,var(--ml-berry),#a12f5e)}",
      ".pki-ml .ml-card{border:1px solid var(--ml-line);border-radius:16px;padding:14px;background:var(--ml-card);box-shadow:0 1px 0 rgba(35,23,51,.04)}",
      ".pki-ml .ml-stg{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ml-berry)}",
      ".pki-ml .ml-emoji{font-size:24px;vertical-align:-4px}",
      ".pki-ml .ml-prompt{margin:6px 0 10px;font-size:15px;color:var(--ml-ink);line-height:1.4}",
      ".pki-ml .ml-prompt b{color:var(--ml-berry)}",
      ".pki-ml .ml-prompt .es{display:block;color:#7a6d88;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-ml .ml-bench{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center}",
      ".pki-ml .ml-svg{flex:0 0 auto}",
      ".pki-ml .ml-steps{display:flex;flex-direction:column;gap:10px}",
      ".pki-ml .ml-step{display:flex;align-items:center;gap:8px}",
      ".pki-ml .ml-slabel{min-width:74px;font-size:13px;font-weight:800}",
      ".pki-ml .ml-berry{color:var(--ml-berry)}.pki-ml .ml-cream{color:var(--ml-cream)}",
      ".pki-ml .ml-step button{cursor:pointer;width:34px;height:34px;border:2px solid var(--ml-line);background:#faf7fd;color:var(--ml-ink);border-radius:9px;font-size:19px;font-weight:800;line-height:1}",
      ".pki-ml .ml-step button:hover{border-color:var(--ml-berry)}",
      ".pki-ml .ml-step button:focus-visible{outline:3px solid rgba(209,71,122,.45);outline-offset:2px}",
      ".pki-ml .ml-num{min-width:30px;text-align:center;font-size:22px;font-weight:900;font-variant-numeric:tabular-nums}",
      ".pki-ml .ml-tbl{border-collapse:collapse;margin:2px auto 4px;font-variant-numeric:tabular-nums}",
      ".pki-ml .ml-tbl th{background:#f3edfa;font-size:13px;padding:7px 14px;border:1px solid var(--ml-line)}",
      ".pki-ml .ml-tbl td{font-size:18px;font-weight:800;padding:8px 16px;border:1px solid var(--ml-line);text-align:center}",
      ".pki-ml .ml-tbl td.q{color:var(--ml-berry);background:#fdf1f6}",
      ".pki-ml .ml-buys{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}",
      ".pki-ml .ml-buy{cursor:pointer;flex:1 1 130px;max-width:170px;border:2px solid var(--ml-line);background:#faf7fd;border-radius:12px;padding:12px;text-align:center;transition:transform .08s,border-color .12s}",
      ".pki-ml .ml-buy:hover{transform:translateY(-2px);border-color:var(--ml-berry)}",
      ".pki-ml .ml-buy:focus-visible{outline:3px solid rgba(209,71,122,.45);outline-offset:2px}",
      ".pki-ml .ml-buy:disabled{cursor:default;opacity:.55}",
      ".pki-ml .ml-buy.pick{border-color:var(--ml-green);background:#eafaf0}",
      ".pki-ml .ml-buy .bn{font-size:14px;font-weight:800;display:block}",
      ".pki-ml .ml-buy .bp{font-size:22px;font-weight:900;margin:4px 0 0}",
      ".pki-ml .ml-buy .bq{font-size:12.5px;color:#6a5d78}",
      ".pki-ml .ml-buy .br{margin-top:6px;font-size:12.5px;font-weight:800;color:var(--ml-green);min-height:16px}",
      ".pki-ml .ml-opts{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:4px}",
      ".pki-ml .ml-opt{cursor:pointer;border:2px solid var(--ml-line);background:#faf7fd;color:var(--ml-ink);border-radius:10px;padding:10px 20px;font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-ml .ml-opt:hover{transform:translateY(-1px);border-color:var(--ml-berry)}",
      ".pki-ml .ml-opt:focus-visible{outline:3px solid rgba(209,71,122,.45);outline-offset:2px}",
      ".pki-ml .ml-opt.wrong{border-color:#e0483c;animation:mlShake .3s}",
      ".pki-ml .ml-opt:disabled{opacity:.5;cursor:default}",
      ".pki-ml .ml-cta{margin-top:12px;text-align:center}",
      ".pki-ml .ml-cta button{cursor:pointer;border:0;background:var(--ml-berry);color:#fff;font-weight:800;border-radius:10px;padding:10px 20px;font-size:15px}",
      ".pki-ml .ml-cta button:disabled{opacity:.45;cursor:default}",
      ".pki-ml .ml-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700;text-align:center}",
      ".pki-ml .ml-msg.hint{color:var(--ml-amber)}.pki-ml .ml-msg.ok{color:var(--ml-green)}",
      ".pki-ml .ml-log{display:flex;gap:8px;margin:12px 0 0}",
      ".pki-ml .ml-cell{flex:1;text-align:center;border:1px solid var(--ml-line);border-radius:10px;padding:8px 4px;font-size:11.5px;font-weight:700;color:#9a8fa8}",
      ".pki-ml .ml-cell b{display:block;font-size:15px;color:#6a5d78;margin-top:2px}",
      ".pki-ml .ml-cell.on{border-color:var(--ml-green);color:var(--ml-green)}.pki-ml .ml-cell.on b{color:var(--ml-green)}",
      ".pki-ml .ml-done{text-align:center;padding:16px 12px}",
      ".pki-ml .ml-perfect{display:inline-block;font-size:26px;font-weight:900;letter-spacing:.04em;color:var(--ml-green)}",
      ".pki-ml .ml-again{margin-top:14px;cursor:pointer;border:0;background:var(--ml-berry);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes mlShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@media (prefers-reduced-motion:reduce){.pki-ml *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-ml{--ml-ink:#eef0ff;--ml-card:#171226;--ml-line:rgba(230,225,245,.16)}.pki-ml .ml-sub{color:#a99fbd}.pki-ml .ml-pip{background:#2a2140}.pki-ml .ml-step button,.pki-ml .ml-buy,.pki-ml .ml-opt{background:#221a38;color:#eef0ff}.pki-ml .ml-tbl th{background:#221a38}.pki-ml .ml-tbl td.q{background:#2c1c2b}.pki-ml .ml-buy.pick{background:#12321f}.pki-ml .ml-cell b{color:#a99fbd}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // -------- content per level (L0 = first two stages only) ------------------
  var LEVELS = {
    0: [
      {
        kind: "build",
        emoji: "🥤",
        label: { a: "Fruit", b: "Yogurt" },
        base: { a: 3, b: 2 },
        scale: 2,
        max: 10,
        prompt: {
          en: "Recipe is <b>3 cups fruit : 2 cups yogurt</b>. Make a <b>double batch</b> that keeps 3:2. Dial in the mix.",
          es: "La receta es 3 fruta : 2 yogur. Haz un lote doble que mantenga 3:2.",
        },
        hint: "A double batch means both parts scale by the SAME number (×2).",
      },
      {
        kind: "table",
        emoji: "📊",
        head: { a: "Cups fruit", b: "Cups juice" },
        rows: [
          [1, 2],
          [2, 4],
          [4, null],
        ],
        ans: 8,
        options: [8, 6, 10],
        prompt: {
          en: "Keep the ratio table equivalent. What fills the <b>?</b> so the last row still matches 1:2?",
          es: "Mantén la tabla equivalente. ¿Qué valor completa la ?",
        },
        hint: "Each row is the same ratio — find what 4 was multiplied by, then do it to 2 as well.",
      },
    ],
    1: [
      {
        kind: "build",
        emoji: "🥤",
        label: { a: "Fruit", b: "Yogurt" },
        base: { a: 3, b: 2 },
        scale: 3,
        max: 12,
        prompt: {
          en: "Recipe is <b>3 cups fruit : 2 cups yogurt</b>. Make a <b>triple batch</b> that keeps 3:2.",
          es: "La receta es 3 fruta : 2 yogur. Haz un lote triple que mantenga 3:2.",
        },
        hint: "Triple batch = ×3 on BOTH parts, so the ratio stays 3:2.",
      },
      {
        kind: "table",
        emoji: "📊",
        head: { a: "Scoops", b: "Cups milk" },
        rows: [
          [2, 5],
          [4, 10],
          [6, null],
        ],
        ans: 15,
        options: [15, 12, 20],
        prompt: {
          en: "Keep the ratio table equivalent. What fills the <b>?</b> so the last row still matches 2:5?",
          es: "Mantén la tabla equivalente. ¿Qué completa la ? para seguir 2:5?",
        },
        hint: "6 is 2 tripled — so triple the 5 as well.",
      },
      {
        kind: "bestbuy",
        emoji: "💲",
        a: { name: "2-Berry", price: 6, qty: 2 },
        b: { name: "5-Berry", price: 10, qty: 5 },
        prompt: {
          en: "Two berry packs. Which is the <b>better buy</b> (lower cost per cup)?",
          es: "Dos paquetes de fruta. ¿Cuál conviene más (menor costo por taza)?",
        },
        hint: "Divide price ÷ cups to get the cost of ONE cup, then compare.",
      },
    ],
    2: [
      {
        kind: "build",
        emoji: "🥤",
        label: { a: "Fruit", b: "Yogurt" },
        base: { a: 6, b: 4 },
        scale: 2.5,
        max: 18,
        prompt: {
          en: "Recipe is <b>6 cups fruit : 4 cups yogurt</b> (that is 3:2). Make a <b>2½× batch</b> that keeps the ratio.",
          es: "La receta es 6 fruta : 4 yogur (o sea 3:2). Haz un lote de 2½× que mantenga la razón.",
        },
        hint: "Scale BOTH parts by 2.5: 6→15 and 4→10. Same multiplier keeps 3:2.",
      },
      {
        kind: "table",
        emoji: "📊",
        head: { a: "Cups fruit", b: "Cups water" },
        rows: [
          [4, 6],
          [6, 9],
          [10, null],
        ],
        ans: 15,
        options: [15, 14, 18],
        prompt: {
          en: "Keep the ratio table equivalent (it reduces to 2:3). What fills the <b>?</b>?",
          es: "Mantén la tabla equivalente (se reduce a 2:3). ¿Qué completa la ?",
        },
        hint: "Reduce a known row to its unit ratio (2:3), then scale up to 10.",
      },
      {
        kind: "bestbuy",
        emoji: "💲",
        a: { name: "Mango 3-pack", price: 8, qty: 3 },
        b: { name: "Mango 4-pack", price: 10, qty: 4 },
        prompt: {
          en: "Two mango packs. Which is the <b>better buy</b> (lower cost per cup)?",
          es: "Dos paquetes de mango. ¿Cuál conviene más (menor costo por taza)?",
        },
        hint: "Cost per cup = price ÷ cups. The smaller per-cup price wins.",
      },
    ],
  };

  // -------------------------------- helpers ---------------------------------
  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }
  function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a || 1;
  }
  function reduceStr(a, b) {
    if (a === 0 && b === 0) return "0:0";
    var g = gcd(a, b);
    return a / g + ":" + b / g;
  }
  function shortKind(k) {
    return k === "build" ? "Batch" : k === "table" ? "Table" : "Best buy";
  }

  // -------------------------------- init ------------------------------------
  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-ml");
    var state = { idx: 0, level: levelOf(), log: [] };
    function stages() {
      return LEVELS[state.level] || LEVELS[1];
    }

    function head() {
      var S = stages(),
        total = S.length;
      var rail = '<div class="ml-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="ml-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";
      return (
        "<h4>🧪 Mix Lab</h4>" +
        '<p class="ml-sub">Laboratorio de mezclas — dial in each ratio to perfect the smoothie.</p>' +
        rail
      );
    }
    function log() {
      var S = stages(),
        out = '<div class="ml-log">';
      for (var j = 0; j < S.length; j++)
        out +=
          '<div class="ml-cell ' +
          (state.log[j] != null ? "on" : "") +
          '">' +
          shortKind(S[j].kind) +
          "<b>" +
          (state.log[j] != null ? state.log[j] : "—") +
          "</b></div>";
      return out + "</div>";
    }
    function advance(label) {
      state.log[state.idx] = label;
      state.idx++;
      render();
    }

    // ---- stage: BUILD THE RATIO ----
    function buildSVG(f, y, ta, tb, max) {
      var th = 8,
        gp = 1.5,
        w = 46,
        base = 178;
      function col(n, x, color, target) {
        var s = "",
          i,
          yy;
        var toph = target * (th + gp);
        s +=
          '<rect x="' +
          (x - 3) +
          '" y="' +
          (base - toph).toFixed(1) +
          '" width="' +
          (w + 6) +
          '" height="' +
          toph.toFixed(1) +
          '" rx="4" fill="none" stroke="' +
          color +
          '" stroke-opacity=".35" stroke-dasharray="4 3"/>';
        for (i = 0; i < n; i++) {
          yy = base - (i + 1) * (th + gp) + gp;
          s +=
            '<rect x="' +
            x +
            '" y="' +
            yy.toFixed(1) +
            '" width="' +
            w +
            '" height="' +
            th +
            '" rx="2" fill="' +
            color +
            '"/>';
        }
        return s;
      }
      return (
        '<svg class="ml-svg" width="196" height="204" viewBox="0 0 196 204" role="img" aria-label="Fruit ' +
        f +
        " to yogurt " +
        y +
        '">' +
        col(f, 30, "#d1477a", ta) +
        col(y, 118, "#7c5cbf", tb) +
        '<text x="53" y="196" text-anchor="middle" font-size="12" font-weight="800" fill="#d1477a">Fruit ' +
        f +
        "</text>" +
        '<text x="141" y="196" text-anchor="middle" font-size="12" font-weight="800" fill="#7c5cbf">Yogurt ' +
        y +
        "</text>" +
        "</svg>"
      );
    }
    function renderBuild(st) {
      var ta = st.base.a * st.scale,
        tb = st.base.b * st.scale;
      var w = { f: 0, y: 0 };
      function paint() {
        el.querySelector("[data-svg]").innerHTML = buildSVG(w.f, w.y, ta, tb, st.max);
        el.querySelector('[data-num="f"]').textContent = w.f;
        el.querySelector('[data-num="y"]').textContent = w.y;
        var msg = el.querySelector("[data-msg]"),
          cta = el.querySelector("[data-lock]");
        if (w.f === ta && w.y === tb) {
          msg.className = "ml-msg ok";
          msg.textContent = "✓ " + ta + ":" + tb + " — same 3:2 flavor at the right batch size!";
          cta.disabled = false;
        } else {
          cta.disabled = true;
          if (w.f === 0 && w.y === 0) {
            msg.className = "ml-msg";
            msg.textContent = "Add fruit and yogurt with the + buttons.";
          } else if (reduceStr(w.f, w.y) === reduceStr(st.base.a, st.base.b)) {
            msg.className = "ml-msg hint";
            msg.textContent =
              "Right " +
              reduceStr(st.base.a, st.base.b) +
              " flavor! Now match the batch size: " +
              ta +
              ":" +
              tb +
              ".";
          } else {
            msg.className = "ml-msg hint";
            msg.textContent = "Not " + reduceStr(st.base.a, st.base.b) + " yet — " + st.hint;
          }
        }
      }
      function step(part, dir) {
        var v = w[part] + dir;
        w[part] = Math.max(0, Math.min(st.max, v));
        paint();
      }
      el.innerHTML =
        head() +
        '<div class="ml-card">' +
        stageHdr(st) +
        promptHtml(st) +
        '<div class="ml-bench"><div data-svg></div>' +
        '<div class="ml-steps">' +
        stepRow("f", "Fruit", "ml-berry") +
        stepRow("y", "Yogurt", "ml-cream") +
        "</div></div>" +
        '<div class="ml-cta"><button type="button" data-lock disabled>Lock in the mix</button></div>' +
        '<p class="ml-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        log();
      el.querySelectorAll("[data-part]").forEach(function (b) {
        b.addEventListener("click", function () {
          step(b.dataset.part, b.dataset.dir === "+" ? 1 : -1);
        });
      });
      el.querySelector("[data-lock]").addEventListener("click", function () {
        if (w.f === ta && w.y === tb) advance(ta + ":" + tb);
      });
      paint();
    }
    function stepRow(part, label, cls) {
      return (
        '<div class="ml-step"><span class="ml-slabel ' +
        cls +
        '">' +
        label +
        "</span>" +
        '<button type="button" data-part="' +
        part +
        '" data-dir="-" aria-label="less ' +
        label +
        '">−</button>' +
        '<span class="ml-num" data-num="' +
        part +
        '">0</span>' +
        '<button type="button" data-part="' +
        part +
        '" data-dir="+" aria-label="more ' +
        label +
        '">+</button></div>'
      );
    }

    // ---- stage: RATIO TABLE ----
    function renderTable(st) {
      var thead = "<tr><th>" + esc(st.head.a) + "</th><th>" + esc(st.head.b) + "</th></tr>";
      var body = "";
      st.rows.forEach(function (r) {
        body +=
          "<tr>" +
          "<td>" +
          (r[0] == null ? '<span class="q">?</span>' : r[0]) +
          "</td>" +
          "<td" +
          (r[1] == null ? ' class="q"' : "") +
          ">" +
          (r[1] == null ? "?" : r[1]) +
          "</td>" +
          "</tr>";
      });
      var opts = st.options
        .map(function (o) {
          return '<button type="button" class="ml-opt" data-v="' + o + '">' + o + "</button>";
        })
        .join("");
      el.innerHTML =
        head() +
        '<div class="ml-card">' +
        stageHdr(st) +
        promptHtml(st) +
        '<table class="ml-tbl">' +
        thead +
        body +
        "</table>" +
        '<div class="ml-opts">' +
        opts +
        "</div>" +
        '<p class="ml-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        log();
      var msg = el.querySelector("[data-msg]");
      var btns = el.querySelectorAll(".ml-opt");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (parseInt(btn.dataset.v, 10) === st.ans) {
            btns.forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "ml-msg ok";
            msg.textContent = "✓ Row stays equivalent — the ratio holds.";
            setTimeout(function () {
              advance(String(st.ans));
            }, 950);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "ml-msg hint";
            msg.textContent = "Not equivalent — " + st.hint;
          }
        });
      });
    }

    // ---- stage: BEST BUY ----
    function renderBuy(st) {
      // better = smaller unit rate; compare via cross-multiply (no float error)
      var aBetter = st.a.price * st.b.qty < st.b.price * st.a.qty;
      var winner = aBetter ? "a" : "b";
      function card(key, d) {
        return (
          '<button type="button" class="ml-buy" data-buy="' +
          key +
          '">' +
          '<span class="bn">' +
          esc(d.name) +
          "</span>" +
          '<div class="bp">$' +
          d.price +
          "</div>" +
          '<div class="bq">for ' +
          d.qty +
          " cups</div>" +
          '<div class="br" data-rate="' +
          key +
          '"></div></button>'
        );
      }
      el.innerHTML =
        head() +
        '<div class="ml-card">' +
        stageHdr(st) +
        promptHtml(st) +
        '<div class="ml-buys">' +
        card("a", st.a) +
        card("b", st.b) +
        "</div>" +
        '<p class="ml-msg" data-msg aria-live="polite"></p>' +
        "</div>" +
        log();
      var msg = el.querySelector("[data-msg]");
      var btns = el.querySelectorAll(".ml-buy");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (btn.dataset.buy === winner) {
            btns.forEach(function (b) {
              b.disabled = true;
            });
            btn.classList.add("pick");
            el.querySelector('[data-rate="a"]').textContent =
              "$" + (st.a.price / st.a.qty).toFixed(2) + "/cup";
            el.querySelector('[data-rate="b"]').textContent =
              "$" + (st.b.price / st.b.qty).toFixed(2) + "/cup";
            msg.className = "ml-msg ok";
            var d = winner === "a" ? st.a : st.b;
            msg.textContent =
              "✓ " + d.name + " wins at $" + (d.price / d.qty).toFixed(2) + " per cup.";
            setTimeout(function () {
              advance("$" + (d.price / d.qty).toFixed(2));
            }, 1100);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "ml-msg hint";
            msg.textContent = "Compare per cup — " + st.hint;
          }
        });
      });
    }

    // ---- shared bits ----
    function stageHdr(st) {
      var S = stages();
      return (
        '<div class="ml-stg"><span class="ml-emoji">' +
        st.emoji +
        "</span> " +
        esc(shortKind(st.kind)) +
        " · Stage " +
        (state.idx + 1) +
        " of " +
        S.length +
        "</div>"
      );
    }
    function promptHtml(st) {
      return (
        '<p class="ml-prompt">' +
        st.prompt.en +
        '<span class="es">' +
        esc(st.prompt.es) +
        "</span></p>"
      );
    }

    function render() {
      var S = stages(),
        total = S.length;
      if (state.idx >= total) {
        el.innerHTML =
          head() +
          '<div class="ml-card ml-done"><div class="ml-perfect">🎉 MIX PERFECTED</div>' +
          '<p style="margin:10px 0 0;font-weight:700">Every ratio checks out — the lab is closed.<span class="es" style="display:block;font-style:italic;color:#7a6d88;font-size:12.5px;margin-top:2px">¡Mezcla perfecta! Laboratorio cerrado.</span></p></div>' +
          log() +
          '<div style="text-align:center"><button type="button" class="ml-again" data-again>Run it again</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.log = [];
          state.level = levelOf();
          render();
        });
        return;
      }
      var st = S[state.idx];
      if (st.kind === "build") renderBuild(st);
      else if (st.kind === "table") renderTable(st);
      else renderBuy(st);
    }

    render();
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.log.length === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="mix-lab"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["mix-lab"] = init;
  }
})();
