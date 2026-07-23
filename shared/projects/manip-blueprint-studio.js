/* ==========================================================================
   Neft Teacher — Manipulative: BLUEPRINT STUDIO (data-manip="blueprint-studio")
   Unit 5 · Area (Dream Room Designer) · 6.GR.1 — area of parallelogram,
   triangle, trapezoid, and composite figures. You are the drafter at a
   blueprint studio: each ROOM is drawn to scale with its dimensions marked.
   Compute the floor area to fit the client spec, pick the value that PASSES
   inspection, and it logs to the running floor plan. Pass every room =>
   BLUEPRINT APPROVED with the total square footage.
     L0: rectangle + triangle (small whole numbers), 2 rooms
     L1: adds trapezoid, 3 rooms
     L2: composite (decompose + sum) + slant-vs-height distractors, 3 rooms
   Self-mounting + self-styling + level-aware + bilingual + no-fail, like the
   other manip-*.js.  Usage: <div class="pki-manip" data-manip="blueprint-studio"></div>
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var STYLE_ID = "pki-bp-styles";

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
      ".pki-bp{--bp-ink:#0b1020;--bp-blue:#2f6bff;--bp-green:#12a150;--bp-line:#bfe0ff;font-family:inherit;color:var(--bp-ink)}",
      ".pki-bp h4{margin:0 0 4px;font-size:18px;font-weight:800}",
      ".pki-bp .bp-sub{margin:0 0 12px;font-size:13.5px;color:#5a6478}",
      ".pki-bp .bp-rail{display:flex;gap:8px;margin:0 0 14px}",
      ".pki-bp .bp-pip{flex:1;height:8px;border-radius:99px;background:#e6ebf5}",
      ".pki-bp .bp-pip.done{background:linear-gradient(90deg,var(--bp-green),#0c7c3d)}",
      ".pki-bp .bp-pip.active{background:linear-gradient(90deg,var(--bp-blue),#1748c0)}",
      ".pki-bp .bp-card{border:1px solid rgba(23,32,51,.12);border-radius:14px;padding:14px;background:linear-gradient(180deg,#0e2647,#0a1a33);color:#e6f0ff}",
      ".pki-bp .bp-stg{font-size:12px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#8fd3ff}",
      ".pki-bp .bp-emoji{font-size:24px;vertical-align:-4px}",
      ".pki-bp .bp-canvas{display:flex;justify-content:center;margin:10px 0 4px}",
      ".pki-bp .bp-svg{width:100%;max-width:300px;height:auto;background:#0a1c38;border:1px solid #1e3f6b;border-radius:10px}",
      ".pki-bp .bp-svg .edge{stroke:var(--bp-line);stroke-width:2.2;fill:rgba(80,150,230,.14)}",
      ".pki-bp .bp-svg .edge2{stroke:#8fd3ff;stroke-width:2.2;fill:rgba(120,190,120,.16)}",
      ".pki-bp .bp-svg .hgt{stroke:#ffd166;stroke-width:2;stroke-dasharray:5 4}",
      ".pki-bp .bp-svg .slant{stroke:#ff9aa2;stroke-width:2}",
      ".pki-bp .bp-svg .decomp{stroke:#ffd166;stroke-width:1.6;stroke-dasharray:4 4}",
      ".pki-bp .bp-svg .grid{stroke:#123a63;stroke-width:1}",
      ".pki-bp .bp-svg text{fill:#eaf3ff;font-size:13px;font-weight:700;font-family:inherit}",
      ".pki-bp .bp-svg text.dim{fill:#bfe0ff}.pki-bp .bp-svg text.hl{fill:#ffd166}.pki-bp .bp-svg text.sl{fill:#ff9aa2}",
      ".pki-bp .bp-prompt{margin:6px 0 10px;font-size:15px;color:#f2f7ff}",
      ".pki-bp .bp-prompt .es{display:block;color:#a7c6ee;font-style:italic;font-size:12.5px;margin-top:2px}",
      ".pki-bp .bp-opts{display:flex;flex-wrap:wrap;gap:8px}",
      ".pki-bp .bp-opt{cursor:pointer;border:2px solid #2f4d78;background:#122b4d;color:#eaf3ff;border-radius:10px;padding:10px 18px;font-size:17px;font-weight:800;font-variant-numeric:tabular-nums;transition:transform .08s,border-color .12s}",
      ".pki-bp .bp-opt:hover{transform:translateY(-1px);border-color:var(--bp-blue)}",
      ".pki-bp .bp-opt:focus-visible{outline:3px solid rgba(47,107,255,.5);outline-offset:2px}",
      ".pki-bp .bp-opt.wrong{border-color:#ff5a5a;animation:bpShake .3s}",
      ".pki-bp .bp-opt:disabled{opacity:.5;cursor:default}",
      ".pki-bp .bp-msg{min-height:20px;margin:10px 0 0;font-size:13.5px;font-weight:700}",
      ".pki-bp .bp-msg.hint{color:#ffcf6b}.pki-bp .bp-msg.ok{color:#7ff0b0}",
      ".pki-bp .bp-sub-formula{margin:8px 0 0;font-size:14.5px;font-weight:800;color:#7ff0b0;font-variant-numeric:tabular-nums}",
      ".pki-bp .bp-plan{display:flex;gap:8px;margin:12px 0 0;align-items:stretch}",
      ".pki-bp .bp-cell{flex:1;text-align:center;border:1px solid #d5ddec;border-radius:10px;padding:8px 4px;font-size:11.5px;font-weight:700;color:#9aa4ba}",
      ".pki-bp .bp-cell b{display:block;font-size:16px;color:#c7d0e2}",
      ".pki-bp .bp-cell.on{border-color:var(--bp-green);color:var(--bp-green)}.pki-bp .bp-cell.on b{color:var(--bp-green)}",
      ".pki-bp .bp-total{min-width:82px;flex:0 0 auto;border-color:var(--bp-blue);color:var(--bp-blue)}.pki-bp .bp-total b{color:var(--bp-blue)}",
      ".pki-bp .bp-done{text-align:center;padding:16px 12px}",
      ".pki-bp .bp-stamp{display:inline-block;font-size:26px;font-weight:900;letter-spacing:.05em;color:#7ff0b0;border:3px solid #7ff0b0;border-radius:12px;padding:8px 16px;transform:rotate(-4deg)}",
      ".pki-bp .bp-again{margin-top:14px;cursor:pointer;border:0;background:var(--bp-blue);color:#fff;font-weight:800;border-radius:10px;padding:9px 16px;font-size:14px}",
      "@keyframes bpShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}",
      "@media (prefers-reduced-motion:reduce){.pki-bp *{animation:none!important;transition:none!important}}",
      "@media (prefers-color-scheme:dark){.pki-bp{--bp-ink:#e8edf7}.pki-bp .bp-sub{color:#9aa4ba}.pki-bp .bp-cell{border-color:#33406a}}",
    ].join("\n");
    document.head.appendChild(s);
  }

  /* ---- SVG blueprint drawings; dims carry the marked measurements -------- */
  function gridBg() {
    var g = "";
    for (var x = 20; x < 300; x += 20)
      g += '<line class="grid" x1="' + x + '" y1="0" x2="' + x + '" y2="185"/>';
    for (var y = 20; y < 185; y += 20)
      g += '<line class="grid" x1="0" y1="' + y + '" x2="300" y2="' + y + '"/>';
    return g;
  }
  function T(x, y, txt, cls) {
    return (
      '<text x="' +
      x +
      '" y="' +
      y +
      '" text-anchor="middle" class="' +
      (cls || "") +
      '">' +
      txt +
      "</text>"
    );
  }
  function svg(inner) {
    return (
      '<svg class="bp-svg" viewBox="0 0 300 185" role="img" aria-label="blueprint drawing">' +
      gridBg() +
      inner +
      "</svg>"
    );
  }

  function drawShape(st) {
    var d = st.dims;
    if (st.shape === "rect")
      return svg(
        '<rect class="edge" x="70" y="35" width="160" height="105"/>' +
          T(150, 160, d.b + " ft", "dim") +
          T(52, 92, d.h + " ft", "dim"),
      );
    if (st.shape === "parallelogram")
      return svg(
        '<polygon class="edge" points="95,35 245,35 205,140 55,140"/>' +
          '<line class="hgt" x1="205" y1="35" x2="205" y2="140"/>' +
          '<path class="hgt" fill="none" d="M193 140v-12h12"/>' +
          T(150, 160, d.b + " ft (base)", "dim") +
          T(232, 92, d.h + " ft", "hl") +
          T(238, 108, "height", "hl") +
          T(232, 30, d.s + " ft slant", "sl"),
      );
    if (st.shape === "triangle")
      return svg(
        '<polygon class="edge" points="150,30 240,140 60,140"/>' +
          '<line class="hgt" x1="150" y1="30" x2="150" y2="140"/>' +
          '<path class="hgt" fill="none" d="M138 140v-12h12"/>' +
          T(150, 160, d.b + " ft (base)", "dim") +
          T(120, 92, d.h + " ft", "hl") +
          T(120, 108, "height", "hl") +
          (d.s
            ? '<line class="slant" x1="150" y1="30" x2="240" y2="140"/>' +
              T(215, 78, d.s + " ft slant", "sl")
            : ""),
      );
    if (st.shape === "trapezoid")
      return svg(
        '<polygon class="edge" points="95,35 205,35 245,140 55,140"/>' +
          '<line class="hgt" x1="205" y1="35" x2="205" y2="140"/>' +
          '<path class="hgt" fill="none" d="M193 140v-12h12"/>' +
          T(150, 28, d.b1 + " ft (base 1)", "dim") +
          T(150, 160, d.b2 + " ft (base 2)", "dim") +
          T(232, 96, d.h + " ft", "hl") +
          T(238, 112, "height", "hl"),
      );
    // composite: house = rectangle body + triangle roof, decomposition dashed
    return svg(
      '<rect class="edge" x="80" y="80" width="140" height="70"/>' +
        '<polygon class="edge2" points="150,28 220,80 80,80"/>' +
        '<line class="decomp" x1="80" y1="80" x2="220" y2="80"/>' +
        '<line class="hgt" x1="150" y1="28" x2="150" y2="80"/>' +
        T(150, 170, d.w + " ft", "dim") +
        T(60, 118, d.rh + " ft", "dim") +
        T(186, 54, d.th + " ft", "hl") +
        T(150, 68, "roof", "hl") +
        T(150, 120, "room", "dim"),
    );
  }

  /* ---- stages per level: math is verified in the header comment ---------- */
  function P(en, es) {
    return { en: en, es: es };
  }
  var SETS = {
    0: [
      {
        room: "Playroom",
        emoji: "🟦",
        shape: "rect",
        dims: { b: 8, h: 5 },
        ans: 40,
        opts: [40, 26, 13],
        sub: "A = b × h = 8 × 5 = 40 sq ft",
        hint: "For a rectangle, MULTIPLY base × height — don't add them.",
        prompt: P(
          "The client wants a rectangular playroom. It is drawn 8 ft by 5 ft. Find the floor area in square feet.",
          "El cliente quiere una sala rectangular. Mide 8 pies por 5 pies. Halla el área del piso en pies cuadrados.",
        ),
      },
      {
        room: "Reading Nook",
        emoji: "🔺",
        shape: "triangle",
        dims: { b: 6, h: 4 },
        ans: 12,
        opts: [12, 24, 10],
        sub: "A = ½ × b × h = ½ × 6 × 4 = 12 sq ft",
        hint: "A triangle is HALF of a rectangle — did you multiply by ½?",
        prompt: P(
          "A triangular reading nook has base 6 ft and height 4 ft. Find its floor area.",
          "Un rincón de lectura triangular tiene base de 6 pies y altura de 4 pies. Halla su área.",
        ),
      },
    ],
    1: [
      {
        room: "Sunroom",
        emoji: "▱",
        shape: "parallelogram",
        dims: { b: 9, h: 6, s: 7 },
        ans: 54,
        opts: [54, 63, 27],
        sub: "A = b × h = 9 × 6 = 54 sq ft",
        hint: "Use the PERPENDICULAR height (6), not the slanted side (7). And don't halve it.",
        prompt: P(
          "A parallelogram sunroom has base 9 ft, height 6 ft, slant side 7 ft. Find its area.",
          "Un solárium en forma de paralelogramo tiene base 9 pies, altura 6 pies, lado inclinado 7 pies. Halla el área.",
        ),
      },
      {
        room: "Corner Studio",
        emoji: "🔺",
        shape: "triangle",
        dims: { b: 10, h: 7, s: 8 },
        ans: 35,
        opts: [35, 70, 40],
        sub: "A = ½ × b × h = ½ × 10 × 7 = 35 sq ft",
        hint: "Halve it (× ½) and use the perpendicular height 7 — not the slant 8.",
        prompt: P(
          "A triangular studio has base 10 ft, perpendicular height 7 ft, slant side 8 ft. Find its area.",
          "Un estudio triangular tiene base 10 pies, altura perpendicular 7 pies, lado inclinado 8 pies. Halla el área.",
        ),
      },
      {
        room: "Bay-Window Den",
        emoji: "⬡",
        shape: "trapezoid",
        dims: { b1: 6, b2: 14, h: 4 },
        ans: 40,
        opts: [40, 80, 28],
        sub: "A = ½ × (b₁ + b₂) × h = ½ × (6 + 14) × 4 = 40 sq ft",
        hint: "ADD both parallel bases (6 + 14) first, then take half, then × height.",
        prompt: P(
          "A trapezoid den has parallel bases 6 ft and 14 ft, and height 4 ft. Find its area.",
          "Una sala trapezoidal tiene bases paralelas de 6 pies y 14 pies, y altura de 4 pies. Halla el área.",
        ),
      },
    ],
    2: [
      {
        room: "Loft",
        emoji: "▱",
        shape: "parallelogram",
        dims: { b: 12, h: 8, s: 10 },
        ans: 96,
        opts: [96, 120, 48],
        sub: "A = b × h = 12 × 8 = 96 sq ft",
        hint: "Multiply base × PERPENDICULAR height (8). The slant 10 is a decoy; don't halve.",
        prompt: P(
          "A parallelogram loft has base 12 ft, height 8 ft, slant side 10 ft. Find its area.",
          "Un desván en forma de paralelogramo tiene base 12 pies, altura 8 pies, lado inclinado 10 pies. Halla el área.",
        ),
      },
      {
        room: "Attic Corner",
        emoji: "🔺",
        shape: "triangle",
        dims: { b: 9, h: 6, s: 8 },
        ans: 27,
        opts: [27, 54, 36],
        sub: "A = ½ × b × h = ½ × 9 × 6 = 27 sq ft",
        hint: "Use the perpendicular height 6 (not the slant 8), and remember the ½.",
        prompt: P(
          "A triangular attic corner has base 9 ft, height 6 ft, slant side 8 ft. Find its area.",
          "Un rincón triangular del ático tiene base 9 pies, altura 6 pies, lado inclinado 8 pies. Halla el área.",
        ),
      },
      {
        room: "Great Room",
        emoji: "🏠",
        shape: "composite",
        dims: { w: 10, rh: 6, th: 4 },
        ans: 80,
        opts: [80, 100, 60],
        sub: "Rectangle 10 × 6 = 60, triangle ½ × 10 × 4 = 20 → 60 + 20 = 80 sq ft",
        hint: "Split it: rectangle (10 × 6) PLUS triangle roof (½ × 10 × 4). Did you halve the roof, then ADD both?",
        prompt: P(
          "A composite great room = a 10 ft × 6 ft rectangle with a triangular roof (base 10 ft, height 4 ft) on top. Decompose it and find the TOTAL area.",
          "Una gran sala compuesta = un rectángulo de 10 × 6 pies con un techo triangular (base 10 pies, altura 4 pies) encima. Descomponla y halla el área TOTAL.",
        ),
      },
    ],
  };

  function levelOf() {
    var m = String(document.body.className || "").match(/level-(\d)/);
    return m ? Math.max(0, Math.min(2, parseInt(m[1], 10))) : 1;
  }
  function shuffle(a) {
    var r = a.slice();
    for (var i = r.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = r[i];
      r[i] = r[j];
      r[j] = t;
    }
    return r;
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectCSS();
    el.classList.add("pki-bp");
    var state = { idx: 0, level: levelOf(), vals: [] };
    function rooms() {
      return SETS[state.level] || SETS[1];
    }

    function planStrip(R, total) {
      var strip = '<div class="bp-plan">';
      var sum = 0;
      for (var j = 0; j < total; j++) {
        var v = state.vals[j];
        if (v != null) sum += v;
        strip +=
          '<div class="bp-cell ' +
          (v != null ? "on" : "") +
          '">' +
          R[j].room +
          "<b>" +
          (v != null ? v : "—") +
          "</b></div>";
      }
      strip += '<div class="bp-cell bp-total">Floor plan<b>' + sum + " ft²</b></div></div>";
      return strip;
    }

    function render() {
      var R = rooms();
      var total = R.length;
      var rail = '<div class="bp-rail">';
      for (var i = 0; i < total; i++)
        rail +=
          '<div class="bp-pip ' +
          (i < state.idx ? "done" : i === state.idx ? "active" : "") +
          '"></div>';
      rail += "</div>";

      var head =
        "<h4>📐 Blueprint Studio</h4>" +
        '<p class="bp-sub">Estudio de planos — compute each room’s area to pass inspection and log it to the floor plan.</p>' +
        rail;

      if (state.idx >= total) {
        var totalArea = state.vals.reduce(function (a, b) {
          return a + b;
        }, 0);
        el.innerHTML =
          head +
          '<div class="bp-card bp-done"><div class="bp-stamp">✓ BLUEPRINT APPROVED</div>' +
          '<p style="margin:12px 0 0;color:#eaf3ff;font-weight:700">Every room passed inspection. Total floor area: <b>' +
          totalArea +
          " square feet</b>. Plano aprobado — ¡listo para construir!</p></div>" +
          planStrip(R, total) +
          '<div style="text-align:center"><button type="button" class="bp-again" data-again>Draft it again</button></div>';
        el.querySelector("[data-again]").addEventListener("click", function () {
          state.idx = 0;
          state.vals = [];
          state.level = levelOf();
          render();
        });
        return;
      }

      var st = R[state.idx];
      var opts = shuffle(st.opts)
        .map(function (o) {
          return '<button type="button" class="bp-opt" data-v="' + o + '">' + o + " ft²</button>";
        })
        .join("");
      el.innerHTML =
        head +
        '<div class="bp-card">' +
        '<div class="bp-stg"><span class="bp-emoji">' +
        st.emoji +
        "</span> " +
        st.room +
        " · Room " +
        (state.idx + 1) +
        " of " +
        total +
        "</div>" +
        '<div class="bp-canvas">' +
        drawShape(st) +
        "</div>" +
        '<p class="bp-prompt">' +
        st.prompt.en +
        '<span class="es">' +
        st.prompt.es +
        "</span></p>" +
        '<div class="bp-opts">' +
        opts +
        "</div>" +
        '<p class="bp-msg" data-msg aria-live="polite"></p>' +
        '<p class="bp-sub-formula" data-formula hidden></p>' +
        "</div>" +
        planStrip(R, total);

      var msg = el.querySelector("[data-msg]");
      var formula = el.querySelector("[data-formula]");
      var btns = el.querySelectorAll(".bp-opt");
      btns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (btn.disabled) return;
          if (parseInt(btn.dataset.v, 10) === st.ans) {
            state.vals[state.idx] = st.ans;
            btns.forEach(function (b) {
              b.disabled = true;
            });
            msg.className = "bp-msg ok";
            msg.textContent = "✓ " + st.room + " passes inspection — " + st.ans + " sq ft logged.";
            formula.hidden = false;
            formula.textContent = st.sub;
            setTimeout(function () {
              state.idx++;
              render();
            }, 1400);
          } else {
            btn.classList.add("wrong");
            setTimeout(function () {
              btn.classList.remove("wrong");
            }, 350);
            msg.className = "bp-msg hint";
            msg.textContent = "Not to spec — " + st.hint;
          }
        });
      });
    }

    render();
    var obs = new MutationObserver(function () {
      var lv = levelOf();
      if (lv !== state.level && state.idx === 0 && state.vals.length === 0) {
        state.level = lv;
        render();
      }
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  function scan() {
    document.querySelectorAll('.pki-manip[data-manip="blueprint-studio"]').forEach(init);
  }
  ready(scan);
  setTimeout(scan, 900);
  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["blueprint-studio"] = init;
  }
})();
