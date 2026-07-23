/* ==========================================================================
   Neft Teacher — Manipulative: FOLD & FILL FABRICATION (data-manip="fold-fill")
   A build-to-spec fabrication bench for Volume & Surface Area / Package Design
   (6.GR.2 volume of a rectangular prism incl. fractional edges; 6.GR.4 surface
   area via nets). A build order gives a TARGET VOLUME (and a footprint cap).
   The student sets L, W, H with +/- steppers; a live dimensioned SVG box shows
   V = L·W·H. UNFOLD opens the box into its NET — each face's area sums live to
   the SURFACE AREA readout, and material cost = SA × rate. FILL raises a gauge
   to the volume; the order PASSES when V meets spec AND the surface area has
   been measured. Payoff: SPEC MET / shipped spec sheet.
   Self-mounting + self-styling like the other manip-*.js. Level-aware
   (body.level-0/1/2), bilingual, no-fail (re-set dims and re-check freely).
   Usage:  <div class="pki-manip" data-manip="fold-fill"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-ff-styles";

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
      ".pki-ff{--ff-ink:#172033;--ff-blue:#2f6bff;--ff-green:#12a150;--ff-amber:#e08a00;--ff-red:#d33;font-family:inherit;color:var(--ff-ink)}",
      ".pki-ff h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-ff .ff-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-ff .ff-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:#fff}",
      ".pki-ff .ff-order{background:#fff8e9;border:1px dashed #e2b34d;border-radius:11px;padding:9px 12px;font-size:13px;font-weight:700;color:#8a5a00;margin:0 0 12px}",
      ".pki-ff .ff-order b{color:#5a3a00}",
      ".pki-ff .ff-order .es{display:block;font-style:italic;font-weight:600;color:#a5803a;font-size:12px;margin-top:2px}",
      ".pki-ff .ff-stage{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}",
      ".pki-ff .ff-view{flex:1;min-width:210px;text-align:center}",
      ".pki-ff .ff-view svg{max-width:100%;height:auto}",
      ".pki-ff .ff-steps{flex:1;min-width:180px}",
      ".pki-ff .ff-dim{display:flex;align-items:center;gap:8px;margin:0 0 8px}",
      ".pki-ff .ff-dim .lbl{width:74px;font-size:13px;font-weight:800}",
      ".pki-ff .ff-dim .lbl small{display:block;font-weight:600;color:#8a93a6;font-size:10.5px}",
      ".pki-ff .ff-step{cursor:pointer;border:2px solid #d5ddec;background:#f7f9ff;color:var(--ff-ink);border-radius:9px;width:38px;height:38px;font-size:20px;font-weight:800;line-height:1}",
      ".pki-ff .ff-step:disabled{opacity:.4;cursor:default}",
      ".pki-ff .ff-val{flex:1;text-align:center;font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;background:#f2f6ff;border-radius:9px;padding:6px 0}",
      ".pki-ff .ff-form{font-size:13.5px;font-weight:700;font-variant-numeric:tabular-nums;margin:2px 0;color:#34405a}",
      ".pki-ff .ff-form b{color:var(--ff-blue)}",
      ".pki-ff .ff-foot{font-size:12.5px;font-weight:800;margin:6px 0 0}",
      ".pki-ff .ff-foot.ok{color:var(--ff-green)}.pki-ff .ff-foot.over{color:var(--ff-red)}",
      ".pki-ff .ff-sa{background:#f2f6ff;border-radius:10px;padding:9px 11px;margin:12px 0 0;font-size:13px;font-weight:700;color:#34405a}",
      ".pki-ff .ff-sa b{color:var(--ff-blue);font-variant-numeric:tabular-nums}",
      ".pki-ff .ff-sa .cost{display:block;margin-top:4px;color:#8a5a00}",
      ".pki-ff .ff-btns{display:flex;gap:8px;margin:12px 0 0}",
      ".pki-ff .ff-btn{flex:1;cursor:pointer;border:0;border-radius:11px;padding:11px;font-size:14.5px;font-weight:800;color:#fff}",
      ".pki-ff .ff-btn.unfold{background:var(--ff-amber)}",
      ".pki-ff .ff-btn.fill{background:linear-gradient(90deg,var(--ff-blue),#1748c0)}",
      ".pki-ff .ff-btn:disabled{opacity:.5;cursor:default}",
      ".pki-ff .ff-gaugewrap{display:flex;align-items:flex-end;gap:10px;margin:12px 0 0}",
      ".pki-ff .ff-gauge{position:relative;width:64px;height:120px;border:2px solid #b9c4dc;border-top:0;border-radius:0 0 10px 10px;overflow:hidden;background:#eef2fb}",
      ".pki-ff .ff-liquid{position:absolute;left:0;right:0;bottom:0;height:0;background:linear-gradient(180deg,#5aa0ff,#2f6bff);transition:height .8s cubic-bezier(.4,0,.2,1)}",
      ".pki-ff .ff-mark{position:absolute;left:0;right:0;border-top:2px dashed #d33;font-size:9px;color:#d33;font-weight:800;padding-left:2px}",
      ".pki-ff .ff-glabel{flex:1;font-size:13px;font-weight:700;color:#34405a}",
      ".pki-ff .ff-glabel b{font-size:16px;color:var(--ff-ink);font-variant-numeric:tabular-nums;display:block}",
      ".pki-ff .ff-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-ff .ff-msg.hint{color:var(--ff-amber)}.pki-ff .ff-msg.ok{color:var(--ff-green)}",
      ".pki-ff .ff-payoff{margin:12px 0 0;text-align:center;padding:14px;border-radius:12px;background:linear-gradient(180deg,#e9fbf1,#d6f5e4);border:1px solid #a6e6c4}",
      ".pki-ff .ff-payoff .stamp{font-size:24px;font-weight:900;color:var(--ff-green)}",
      ".pki-ff .ff-sheet{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0 0}",
      ".pki-ff .ff-sheet div{background:#fff;border:1px solid #a6e6c4;border-radius:9px;padding:6px 8px;font-size:11px;font-weight:700;color:#3a6b52;min-width:70px}",
      ".pki-ff .ff-sheet b{display:block;font-size:15px;color:#0c7c3d;font-variant-numeric:tabular-nums}",
      ".pki-ff .ff-again{margin-top:12px;cursor:pointer;border:0;background:var(--ff-blue);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      ".pki-ff .ff-tip{font-size:12px;color:#7a8296;margin:10px 0 0;font-style:italic}",
      "@media (prefers-reduced-motion:reduce){.pki-ff *{transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-ff{color:#eef2fb}.pki-ff .ff-card{background:#1b2233;border-color:rgba(255,255,255,.14)}.pki-ff .ff-val,.pki-ff .ff-sa{background:#232c40;color:#c6cede}.pki-ff .ff-step{background:#232c40;border-color:#39435c;color:#eef2fb}.pki-ff .ff-order{background:#2a2413;border-color:#5a4a1e;color:#e6c887}.pki-ff .ff-gauge{background:#232c40;border-color:#39435c}.pki-ff .ff-payoff{background:#12321f;border-color:#1e6b41}.pki-ff .ff-sheet div{background:#12321f;border-color:#1e6b41}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  // Level configs. targetV = min volume; footCap = max L·W (0 = none);
  // net = show surface-area net + material cost; rate = $ per square unit;
  // hStep allows a fractional height at L2.
  var CFG = {
    0: {
      targetV: 24,
      footCap: 0,
      net: false,
      rate: 0,
      lMax: 6,
      wMax: 6,
      hMax: 6,
      hStep: 1,
      start: { L: 2, W: 2, H: 2 },
    },
    1: {
      targetV: 48,
      footCap: 12,
      net: true,
      rate: 0.5,
      lMax: 6,
      wMax: 6,
      hMax: 8,
      hStep: 1,
      start: { L: 3, W: 3, H: 2 },
    },
    2: {
      targetV: 21,
      footCap: 6,
      net: true,
      rate: 0.75,
      lMax: 4,
      wMax: 4,
      hMax: 6,
      hStep: 0.5,
      start: { L: 2, W: 2, H: 2 },
    },
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }

  // Whole numbers plain, halves as "n½" (fractional-edge readout at L2).
  function fmt(n) {
    n = Math.round(n * 100) / 100;
    var w = Math.floor(n),
      f = n - w;
    if (Math.abs(f - 0.5) < 1e-9) return (w || "") + "½";
    if (Math.abs(f) < 1e-9) return String(w);
    return String(n);
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-ff");
    var level = levelOf();
    var c = Object.assign({}, CFG[level] || CFG[1]);
    var state = {
      L: c.start.L,
      W: c.start.W,
      H: c.start.H,
      unfolded: false,
      saRevealed: false,
      passed: false,
    };

    function calc() {
      var V = state.L * state.W * state.H;
      var SA = 2 * (state.L * state.W + state.L * state.H + state.W * state.H);
      var foot = state.L * state.W;
      return {
        V: V,
        SA: SA,
        foot: foot,
        cost: SA * c.rate,
        meetsV: V >= c.targetV - 1e-9,
        meetsFoot: !c.footCap || foot <= c.footCap + 1e-9,
      };
    }

    // ---- Solid box (dimensioned isometric SVG) ----
    function boxSVG() {
      var L = state.L,
        W = state.W,
        H = state.H;
      var u = Math.floor(150 / Math.max(L + W * 0.5, H + W * 0.5));
      if (u > 26) u = 26;
      if (u < 8) u = 8;
      var w = L * u,
        h = H * u,
        d = W * u * 0.5;
      var pad = 18;
      var vbW = w + d + pad * 2,
        vbH = h + d + pad * 2;
      var x = pad,
        y = pad + d;
      var P = function (px, py) {
        return px + "," + py;
      };
      var front = [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)].join(" ");
      var top = [P(x, y), P(x + d, y - d), P(x + w + d, y - d), P(x + w, y)].join(" ");
      var right = [P(x + w, y), P(x + w + d, y - d), P(x + w + d, y - d + h), P(x + w, y + h)].join(
        " ",
      );
      return (
        '<svg viewBox="0 0 ' +
        vbW +
        " " +
        vbH +
        '" role="img" aria-label="box ' +
        fmt(L) +
        " by " +
        fmt(W) +
        " by " +
        fmt(H) +
        '">' +
        '<polygon points="' +
        top +
        '" fill="#cfe0ff" stroke="#2f6bff" stroke-width="1.5"/>' +
        '<polygon points="' +
        right +
        '" fill="#8fb4ff" stroke="#2f6bff" stroke-width="1.5"/>' +
        '<polygon points="' +
        front +
        '" fill="#eaf1ff" stroke="#2f6bff" stroke-width="1.5"/>' +
        '<text x="' +
        (x + w / 2) +
        '" y="' +
        (y + h + 13) +
        '" text-anchor="middle" font-size="12" font-weight="800" fill="#2f6bff">L ' +
        fmt(L) +
        "</text>" +
        '<text x="' +
        (x - 6) +
        '" y="' +
        (y + h / 2) +
        '" text-anchor="end" font-size="12" font-weight="800" fill="#2f6bff">H ' +
        fmt(H) +
        "</text>" +
        '<text x="' +
        (x + w + d / 2 + 4) +
        '" y="' +
        (y - d / 2 - 2) +
        '" text-anchor="start" font-size="12" font-weight="800" fill="#2f6bff">W ' +
        fmt(W) +
        "</text>" +
        "</svg>"
      );
    }

    // ---- Unfolded net (six labeled faces summing to SA) ----
    function netSVG() {
      var L = state.L,
        W = state.W,
        H = state.H;
      var u = Math.min(24, Math.floor(300 / (2 * (W + L))), Math.floor(200 / (2 * W + H)));
      if (u < 7) u = 7;
      var wU = W * u,
        lU = L * u,
        hU = H * u,
        pad = 6;
      var vbW = 2 * (wU + lU) + pad * 2,
        vbH = 2 * wU + hU + pad * 2;
      var bandY = pad + wU;
      var face = function (fx, fy, fw, fh, fill, area) {
        return (
          '<rect x="' +
          fx +
          '" y="' +
          fy +
          '" width="' +
          fw +
          '" height="' +
          fh +
          '" fill="' +
          fill +
          '" stroke="#e08a00" stroke-width="1.4"/>' +
          '<text x="' +
          (fx + fw / 2) +
          '" y="' +
          (fy + fh / 2 + 4) +
          '" text-anchor="middle" font-size="11" font-weight="800" fill="#8a5a00">' +
          fmt(area) +
          "</text>"
        );
      };
      var x0 = pad,
        x1 = pad + wU,
        x2 = pad + wU + lU,
        x3 = pad + 2 * wU + lU;
      return (
        '<svg viewBox="0 0 ' +
        vbW +
        " " +
        vbH +
        '" role="img" aria-label="unfolded net">' +
        face(x1, pad, lU, wU, "#ffe9c2", L * W) + // top  L×W
        face(x0, bandY, wU, hU, "#ffedcf", W * H) + // left  W×H
        face(x1, bandY, lU, hU, "#ffe0a8", L * H) + // front L×H
        face(x2, bandY, wU, hU, "#ffedcf", W * H) + // right W×H
        face(x3, bandY, lU, hU, "#ffe0a8", L * H) + // back  L×H
        face(x1, bandY + hU, lU, wU, "#ffe9c2", L * W) + // bottom L×W
        "</svg>"
      );
    }

    function shell() {
      var footTxt = c.footCap ? " and keep the footprint L·W ≤ " + c.footCap + " sq units" : "";
      var order =
        '<div class="ff-order">📋 BUILD ORDER: ship a box with volume ≥ <b>' +
        c.targetV +
        " cubic units</b>" +
        footTxt +
        "." +
        (c.net
          ? " Then <b>unfold</b> to report its surface area" +
            (c.rate ? " and material cost" : "") +
            "."
          : "") +
        '<span class="es">Construye una caja de volumen ≥ ' +
        c.targetV +
        " unidades cúbicas" +
        (c.footCap ? ", base L·W ≤ " + c.footCap : "") +
        (c.net ? "; luego desdóblala para su área de superficie." : ".") +
        "</span></div>";

      var dim = function (key, lbl, sub) {
        return (
          '<div class="ff-dim"><span class="lbl">' +
          lbl +
          "<small>" +
          sub +
          "</small></span>" +
          '<button type="button" class="ff-step" data-dec="' +
          key +
          '" aria-label="decrease ' +
          lbl +
          '">−</button>' +
          '<span class="ff-val" data-val="' +
          key +
          '">' +
          fmt(state[key]) +
          "</span>" +
          '<button type="button" class="ff-step" data-inc="' +
          key +
          '" aria-label="increase ' +
          lbl +
          '">+</button></div>'
        );
      };
      var steps =
        '<div class="ff-steps">' +
        dim("L", "Length", "L") +
        dim("W", "Width", "W") +
        dim("H", "Height", c.hStep < 1 ? "H · ½ steps" : "H") +
        '<p class="ff-form" data-vform></p>' +
        '<p class="ff-foot" data-foot></p>' +
        "</div>";

      var netBtn = c.net
        ? '<button type="button" class="ff-btn unfold" data-unfold>📐 UNFOLD</button>'
        : "";
      var sa = c.net ? '<div class="ff-sa" data-sa hidden></div>' : "";

      var gauge =
        '<div class="ff-gaugewrap"><div class="ff-gauge"><div class="ff-liquid" data-liquid></div>' +
        '<div class="ff-mark" data-mark></div></div>' +
        '<div class="ff-glabel">Fill gauge<b data-glabel>V = —</b>' +
        '<span style="font-size:11.5px;color:#8a93a6">Target ' +
        c.targetV +
        " cu units</span></div></div>";

      return (
        "<h4>📦 Fold &amp; Fill Fabrication</h4>" +
        '<p class="ff-sub">Banco de fabricación — set the dimensions to hit the volume spec, then unfold and fill to ship.</p>' +
        '<div class="ff-card">' +
        order +
        '<div class="ff-stage"><div class="ff-view" data-box>' +
        boxSVG() +
        "</div>" +
        steps +
        "</div>" +
        sa +
        '<div class="ff-btns">' +
        netBtn +
        '<button type="button" class="ff-btn fill" data-fill>💧 FILL &amp; CHECK</button></div>' +
        gauge +
        '<p class="ff-msg" data-msg aria-live="polite"></p>' +
        "<div data-payoff></div>" +
        '<p class="ff-tip">💡 V = length × width × height; surface area adds all six faces. Re-set the dimensions and re-check as many times as you like.</p>' +
        "</div>"
      );
    }

    function q(s) {
      return el.querySelector(s);
    }

    function refreshReadouts() {
      var r = calc();
      ["L", "W", "H"].forEach(function (k) {
        var v = q('[data-val="' + k + '"]');
        if (v) v.textContent = fmt(state[k]);
      });
      var vf = q("[data-vform]");
      if (vf)
        vf.innerHTML =
          "V = L × W × H = " +
          fmt(state.L) +
          " × " +
          fmt(state.W) +
          " × " +
          fmt(state.H) +
          " = <b>" +
          fmt(r.V) +
          "</b> cu units";
      var ft = q("[data-foot]");
      if (ft) {
        if (c.footCap) {
          ft.className = "ff-foot " + (r.meetsFoot ? "ok" : "over");
          ft.textContent =
            (r.meetsFoot ? "✓" : "✗") +
            " Footprint L·W = " +
            fmt(state.L) +
            "×" +
            fmt(state.W) +
            " = " +
            fmt(r.foot) +
            " (cap " +
            c.footCap +
            ")";
        } else {
          ft.textContent = "";
        }
      }
      var bx = q("[data-box]");
      if (bx) bx.innerHTML = boxSVG();
      if (state.unfolded) renderNet();
    }

    function renderNet() {
      var r = calc();
      var view = q("[data-box]");
      if (view) view.innerHTML = netSVG();
      var sa = q("[data-sa]");
      if (sa) {
        sa.hidden = false;
        sa.innerHTML =
          "Surface area = 2 · (LW + LH + WH) = 2 · (" +
          fmt(state.L * state.W) +
          " + " +
          fmt(state.L * state.H) +
          " + " +
          fmt(state.W * state.H) +
          ") = <b>" +
          fmt(r.SA) +
          "</b> sq units" +
          (c.rate
            ? '<span class="cost">Material cost = SA × $' +
              c.rate +
              " = <b>$" +
              (Math.round(r.cost * 100) / 100).toFixed(2) +
              "</b></span>"
            : "");
      }
      var ub = q("[data-unfold]");
      if (ub) ub.textContent = "🔁 REFOLD";
    }

    function foldBack() {
      var view = q("[data-box]");
      if (view) view.innerHTML = boxSVG();
      var sa = q("[data-sa]");
      if (sa) sa.hidden = true;
      var ub = q("[data-unfold]");
      if (ub) ub.textContent = "📐 UNFOLD";
    }

    function toggleUnfold() {
      state.unfolded = !state.unfolded;
      if (state.unfolded) {
        state.saRevealed = true;
        renderNet();
      } else {
        foldBack();
      }
    }

    function resetGauge(msgClear) {
      var liq = q("[data-liquid]");
      if (liq) liq.style.height = "0%";
      var gl = q("[data-glabel]");
      if (gl) gl.textContent = "V = —";
      var mk = q("[data-mark]");
      if (mk) mk.textContent = "";
      state.passed = false;
      var po = q("[data-payoff]");
      if (po) po.innerHTML = "";
      if (msgClear) {
        var m = q("[data-msg]");
        if (m) {
          m.className = "ff-msg";
          m.textContent = "";
        }
      }
    }

    function doFill() {
      var r = calc();
      var msg = q("[data-msg]");
      var liq = q("[data-liquid]");
      var gl = q("[data-glabel]");
      var mk = q("[data-mark]");
      var pct = Math.max(0, Math.min(100, (r.V / c.targetV) * 100));
      if (liq) liq.style.height = pct + "%";
      if (gl) gl.textContent = "V = " + fmt(r.V);
      // the tank tops out at the target volume, so the spec line sits at the rim
      if (mk) {
        mk.style.bottom = "100%";
        mk.textContent = "spec";
      }

      var saOk = !c.net || state.saRevealed;
      if (!r.meetsFoot) {
        msg.className = "ff-msg hint";
        msg.textContent =
          "Footprint L·W = " +
          fmt(r.foot) +
          " is over the cap of " +
          c.footCap +
          " — shrink L or W and grow the HEIGHT to reach the volume.";
        return;
      }
      if (!saOk) {
        msg.className = "ff-msg hint";
        msg.textContent = "Unfold the box first so the surface area is measured, then fill.";
        return;
      }
      if (!r.meetsV) {
        msg.className = "ff-msg hint";
        msg.textContent =
          "V = " +
          fmt(r.V) +
          " is short of " +
          c.targetV +
          ". Increase a dimension" +
          (c.hStep < 1 ? " (try a half-unit height)" : "") +
          " and re-fill.";
        return;
      }
      // PASS
      state.passed = true;
      msg.className = "ff-msg ok";
      msg.textContent =
        "✓ Volume spec met" + (c.net ? " and surface area measured" : "") + " — shipping!";
      showPayoff(r);
    }

    function showPayoff(r) {
      var po = q("[data-payoff]");
      if (!po) return;
      var cells =
        "<div>L × W × H<b>" +
        fmt(state.L) +
        "×" +
        fmt(state.W) +
        "×" +
        fmt(state.H) +
        "</b></div>" +
        "<div>Volume<b>" +
        fmt(r.V) +
        " cu</b></div>";
      if (c.net) cells += "<div>Surface area<b>" + fmt(r.SA) + " sq</b></div>";
      if (c.rate)
        cells += "<div>Material<b>$" + (Math.round(r.cost * 100) / 100).toFixed(2) + "</b></div>";
      po.innerHTML =
        '<div class="ff-payoff"><div class="stamp">✅ SPEC MET — SHIPPED</div>' +
        '<p style="margin:6px 0 0;font-size:12.5px;font-weight:700;color:#3a6b52">Spec sheet · hoja de especificaciones</p>' +
        '<div class="ff-sheet">' +
        cells +
        "</div>" +
        '<button type="button" class="ff-again" data-again>Build another order</button></div>';
      po.querySelector("[data-again]").addEventListener("click", function () {
        state.L = c.start.L;
        state.W = c.start.W;
        state.H = c.start.H;
        state.unfolded = false;
        state.saRevealed = false;
        render();
      });
    }

    function stepDim(key, dir) {
      var stepSize = key === "H" ? c.hStep : 1;
      var max = key === "L" ? c.lMax : key === "W" ? c.wMax : c.hMax;
      var next = state[key] + dir * stepSize;
      next = Math.max(stepSize, Math.min(max, Math.round(next * 100) / 100));
      state[key] = next;
      refreshReadouts();
      resetGauge(true);
    }

    function render() {
      el.innerHTML = shell();
      ["L", "W", "H"].forEach(function (k) {
        q('[data-inc="' + k + '"]').addEventListener("click", function () {
          stepDim(k, 1);
        });
        q('[data-dec="' + k + '"]').addEventListener("click", function () {
          stepDim(k, -1);
        });
      });
      var uf = q("[data-unfold]");
      if (uf) uf.addEventListener("click", toggleUnfold);
      q("[data-fill]").addEventListener("click", doFill);
      refreshReadouts();
    }

    render();

    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== level && !state.passed) {
        level = lv;
        c = Object.assign({}, CFG[lv] || CFG[1]);
        state = {
          L: c.start.L,
          W: c.start.W,
          H: c.start.H,
          unfolded: false,
          saRevealed: false,
          passed: false,
        };
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="fold-fill"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["fold-fill"] = init;
  }
})();
