/* ==========================================================================
   Neft Teacher — "Composite Split" manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="composite-split"
          data-w="8" data-h="6" data-notch-w="3" data-notch-h="2"
          data-unit="ft"></div>

   Unit 5 · Area of composite figures (6.GR.1). An L-shaped room is drawn on a
   grid. The student picks HOW to find its area:
     • Split vertically   → two rectangles side by side
     • Split horizontally → two rectangles stacked
     • Subtract           → whole bounding rectangle minus the missing corner
   All three are shown with their own arithmetic, and all three land on the
   same total — which is the actual lesson: decomposition is a choice, not a
   rule, and a correct choice always agrees.

   Drag the notch handles (or use the −/+) to reshape the room; every method
   recomputes live. No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-compsplit-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-cs{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-cs h4{margin:0 0 4px;font-size:1.15rem;color:#12355b}" +
      ".pki-cs-sub{margin:0 0 12px;font-size:.9rem;color:#54677c}" +
      ".pki-cs-dims{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:12px}" +
      ".pki-cs-dim{display:flex;align-items:center;gap:8px}" +
      ".pki-cs-dim label{font-size:.8rem;font-weight:800;color:#54677c;min-width:78px}" +
      ".pki-cs-btn{width:38px;height:38px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#1fa6a2;font-size:1.3rem;font-weight:800;cursor:pointer;line-height:1}" +
      ".pki-cs-btn:active{transform:scale(.9)}" +
      ".pki-cs-btn:focus-visible{outline:3px solid #1fa6a2;outline-offset:2px}" +
      ".pki-cs-val{min-width:30px;text-align:center;font-size:1.1rem;font-weight:800;color:#12355b}" +
      ".pki-cs-modes{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}" +
      ".pki-cs-mode{min-height:44px;padding:0 14px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#12355b;font-weight:800;cursor:pointer}" +
      ".pki-cs-mode.on{background:#1fa6a2;border-color:#1fa6a2;color:#fff}" +
      ".pki-cs-mode:focus-visible{outline:3px solid #12355b;outline-offset:2px}" +
      ".pki-cs-stage{overflow-x:auto;padding:6px 0}" +
      ".pki-cs-work{margin-top:12px;font-size:1rem;color:#12355b;line-height:1.6}" +
      ".pki-cs-work b{font-size:1.15rem}" +
      ".pki-cs-agree{margin-top:10px;padding:10px 12px;border-radius:10px;background:#e6f7ee;border-left:4px solid #17a05f;font-size:.95rem;line-height:1.45}";
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = css;
    document.head.appendChild(s);
  }

  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function init(el) {
    if (el.dataset.pkiManipDone) return;
    el.dataset.pkiManipDone = "1";
    injectStyle();

    var unit = el.dataset.unit || "ft";
    var st = {
      w: clamp(parseInt(el.dataset.w, 10) || 8, 3, 14),
      h: clamp(parseInt(el.dataset.h, 10) || 6, 3, 12),
      nw: clamp(parseInt(el.dataset.notchW, 10) || 3, 1, 13),
      nh: clamp(parseInt(el.dataset.notchH, 10) || 2, 1, 11),
      mode: "vertical",
    };
    /* The notch must stay strictly inside the room or the shape stops being an
       L and the three methods no longer describe it. */
    function fix() {
      st.nw = clamp(st.nw, 1, st.w - 1);
      st.nh = clamp(st.nh, 1, st.h - 1);
    }
    fix();

    var root = document.createElement("div");
    root.className = "pki-cs";
    root.innerHTML =
      "<h4>Composite Split — one room, three ways</h4>" +
      '<p class="pki-cs-sub">This L-shaped room has a corner missing. Pick a method and watch the arithmetic. All three should agree.</p>' +
      '<div class="pki-cs-dims"></div>' +
      '<div class="pki-cs-modes">' +
      '<button type="button" class="pki-cs-mode" data-m="vertical">Split ↕ vertical</button>' +
      '<button type="button" class="pki-cs-mode" data-m="horizontal">Split ↔ horizontal</button>' +
      '<button type="button" class="pki-cs-mode" data-m="subtract">Subtract the corner</button>' +
      "</div>" +
      '<div class="pki-cs-stage"></div>' +
      '<div class="pki-cs-work"></div>' +
      '<div class="pki-cs-agree"></div>';
    el.appendChild(root);

    var dimWrap = root.querySelector(".pki-cs-dims");
    [
      ["w", "Room width"],
      ["h", "Room height"],
      ["nw", "Corner width"],
      ["nh", "Corner height"],
    ].forEach(function (p) {
      var d = document.createElement("div");
      d.className = "pki-cs-dim";
      d.innerHTML =
        "<label>" +
        p[1] +
        '</label><button type="button" class="pki-cs-btn" data-d="' +
        p[0] +
        '" data-s="-1" aria-label="Decrease ' +
        p[1] +
        '">−</button><span class="pki-cs-val" data-v="' +
        p[0] +
        '"></span><button type="button" class="pki-cs-btn" data-d="' +
        p[0] +
        '" data-s="1" aria-label="Increase ' +
        p[1] +
        '">+</button>';
      dimWrap.appendChild(d);
    });

    dimWrap.addEventListener("click", function (e) {
      var b = /** @type {HTMLElement} */ (e.target).closest(".pki-cs-btn");
      if (!b) return;
      var k = /** @type {HTMLElement} */ (b).dataset.d;
      st[k] += Number(/** @type {HTMLElement} */ (b).dataset.s);
      st.w = clamp(st.w, 3, 14);
      st.h = clamp(st.h, 3, 12);
      fix();
      render();
    });

    root.querySelector(".pki-cs-modes").addEventListener("click", function (e) {
      var b = /** @type {HTMLElement} */ (e.target).closest(".pki-cs-mode");
      if (!b) return;
      st.mode = /** @type {HTMLElement} */ (b).dataset.m;
      render();
    });

    var stage = root.querySelector(".pki-cs-stage");
    var workEl = root.querySelector(".pki-cs-work");
    var agreeEl = root.querySelector(".pki-cs-agree");

    /* The L: full w×h rectangle with the TOP-RIGHT nw×nh corner removed. */
    function totalArea() {
      return st.w * st.h - st.nw * st.nh;
    }

    function render() {
      ["w", "h", "nw", "nh"].forEach(function (k) {
        root.querySelector('[data-v="' + k + '"]').textContent = st[k];
      });
      root.querySelectorAll(".pki-cs-mode").forEach(function (b) {
        b.classList.toggle("on", /** @type {HTMLElement} */ (b).dataset.m === st.mode);
      });

      var SC = 26,
        PAD = 26;
      var W = st.w * SC,
        H = st.h * SC;
      var svg =
        '<svg viewBox="0 0 ' +
        (W + PAD * 2) +
        " " +
        (H + PAD * 2) +
        '" width="' +
        Math.min(W + PAD * 2, 560) +
        '" role="img" aria-label="L-shaped room split into parts">';

      // grid
      svg += '<g stroke="#e4ebf2" stroke-width="1">';
      for (var gx = 0; gx <= st.w; gx++)
        svg +=
          '<line x1="' +
          (PAD + gx * SC) +
          '" y1="' +
          PAD +
          '" x2="' +
          (PAD + gx * SC) +
          '" y2="' +
          (PAD + H) +
          '"/>';
      for (var gy = 0; gy <= st.h; gy++)
        svg +=
          '<line x1="' +
          PAD +
          '" y1="' +
          (PAD + gy * SC) +
          '" x2="' +
          (PAD + W) +
          '" y2="' +
          (PAD + gy * SC) +
          '"/>';
      svg += "</g>";

      var parts = [];
      if (st.mode === "vertical") {
        // left full-height slab, then right shorter slab
        parts = [
          { x: 0, y: 0, w: st.w - st.nw, h: st.h, fill: "#1fa6a2", label: "A" },
          { x: st.w - st.nw, y: st.nh, w: st.nw, h: st.h - st.nh, fill: "#f0a202", label: "B" },
        ];
      } else if (st.mode === "horizontal") {
        // top narrow band, then bottom full-width band
        parts = [
          { x: 0, y: 0, w: st.w - st.nw, h: st.nh, fill: "#1fa6a2", label: "A" },
          { x: 0, y: st.nh, w: st.w, h: st.h - st.nh, fill: "#f0a202", label: "B" },
        ];
      } else {
        parts = [{ x: 0, y: 0, w: st.w, h: st.h, fill: "#1fa6a2", label: "whole" }];
      }

      parts.forEach(function (p) {
        svg +=
          '<rect x="' +
          (PAD + p.x * SC) +
          '" y="' +
          (PAD + p.y * SC) +
          '" width="' +
          p.w * SC +
          '" height="' +
          p.h * SC +
          '" fill="' +
          p.fill +
          '" fill-opacity=".55" stroke="#12355b" stroke-width="2"/>' +
          '<text x="' +
          (PAD + (p.x + p.w / 2) * SC) +
          '" y="' +
          (PAD + (p.y + p.h / 2) * SC + 5) +
          '" text-anchor="middle" font-size="15" font-weight="800" fill="#12355b">' +
          p.label +
          "</text>";
      });

      if (st.mode === "subtract") {
        // show the removed corner hatched
        svg +=
          '<rect x="' +
          (PAD + (st.w - st.nw) * SC) +
          '" y="' +
          PAD +
          '" width="' +
          st.nw * SC +
          '" height="' +
          st.nh * SC +
          '" fill="#fff" stroke="#d3455b" stroke-width="3" stroke-dasharray="6 4"/>' +
          '<text x="' +
          (PAD + (st.w - st.nw / 2) * SC) +
          '" y="' +
          (PAD + (st.nh / 2) * SC + 5) +
          '" text-anchor="middle" font-size="13" font-weight="800" fill="#d3455b">take away</text>';
      } else {
        // outline the missing corner so the L is still readable
        svg +=
          '<rect x="' +
          (PAD + (st.w - st.nw) * SC) +
          '" y="' +
          PAD +
          '" width="' +
          st.nw * SC +
          '" height="' +
          st.nh * SC +
          '" fill="#fff"/>';
      }

      // outer dimension labels
      svg +=
        '<text x="' +
        (PAD + W / 2) +
        '" y="' +
        (PAD + H + 20) +
        '" text-anchor="middle" font-size="13" font-weight="700" fill="#54677c">' +
        st.w +
        " " +
        unit +
        "</text>" +
        '<text x="12" y="' +
        (PAD + H / 2) +
        '" text-anchor="middle" font-size="13" font-weight="700" fill="#54677c" transform="rotate(-90 12 ' +
        (PAD + H / 2) +
        ')">' +
        st.h +
        " " +
        unit +
        "</text>";

      svg += "</svg>";
      stage.innerHTML = svg;

      var total = totalArea();
      var html = "";
      if (st.mode === "vertical") {
        var a = (st.w - st.nw) * st.h,
          b = st.nw * (st.h - st.nh);
        html =
          "A = " +
          (st.w - st.nw) +
          " × " +
          st.h +
          " = " +
          a +
          "<br>B = " +
          st.nw +
          " × " +
          (st.h - st.nh) +
          " = " +
          b +
          "<br>Total = " +
          a +
          " + " +
          b +
          " = <b>" +
          (a + b) +
          "</b> " +
          unit +
          "&sup2;";
      } else if (st.mode === "horizontal") {
        var c = (st.w - st.nw) * st.nh,
          d2 = st.w * (st.h - st.nh);
        html =
          "A = " +
          (st.w - st.nw) +
          " × " +
          st.nh +
          " = " +
          c +
          "<br>B = " +
          st.w +
          " × " +
          (st.h - st.nh) +
          " = " +
          d2 +
          "<br>Total = " +
          c +
          " + " +
          d2 +
          " = <b>" +
          (c + d2) +
          "</b> " +
          unit +
          "&sup2;";
      } else {
        html =
          "Whole rectangle = " +
          st.w +
          " × " +
          st.h +
          " = " +
          st.w * st.h +
          "<br>Missing corner = " +
          st.nw +
          " × " +
          st.nh +
          " = " +
          st.nw * st.nh +
          "<br>Total = " +
          st.w * st.h +
          " − " +
          st.nw * st.nh +
          " = <b>" +
          total +
          "</b> " +
          unit +
          "&sup2;";
      }
      workEl.innerHTML = html;
      agreeEl.innerHTML =
        "All three methods give <b>" +
        total +
        "</b> " +
        unit +
        "&sup2;. Switch methods and check — if a method disagreed, the split would be wrong, not the shape.";
    }

    render();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="composite-split"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="composite-split"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["composite-split"] = init;
  }
})();
