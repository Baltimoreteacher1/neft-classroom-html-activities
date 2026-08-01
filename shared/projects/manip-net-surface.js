// @ts-nocheck — not yet type-clean. This file is INSIDE the checkJs program
// (see tsconfig.json); the marker is the debt, and removing it is the unit of
// work. tools/typecheck-ratchet.test.mjs pins the count so it can only shrink.
/* ==========================================================================
   Neft Teacher — "Net Surface" manipulative (self-contained)
   Drop a container on the page:
     <div class="pki-manip" data-manip="net-surface"
          data-l="5" data-w="3" data-h="2" data-unit="in"></div>

   Unit 10 · Surface Area (6.GR.2). The box's net is drawn flat, to scale, in
   six labelled faces. Set L, W, H with −/+ and every face resizes live. Tap a
   face to mark it counted — the running total only adds the faces you have
   actually accounted for, so "I forgot the bottom" shows up as a number that
   is too small instead of a silent mistake.

   Why this and not cube-builder: cube-builder answers "how much fits INSIDE"
   (volume). This answers "how much material WRAPS it" (surface area) — the
   Unit 10 skill that had no model on any project page.
   No dependencies.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof document === "undefined") return;

  var STYLE_ID = "pki-netsurf-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var css =
      ".pki-ns{border:2px solid var(--tp-line,#e4ebf2);border-radius:18px;background:#fff;padding:18px;box-shadow:var(--tp-shadow-sm,0 2px 6px rgba(12,27,42,.08));margin:14px 0}" +
      ".pki-ns h4{margin:0 0 4px;font-size:1.15rem;color:#12355b}" +
      ".pki-ns-sub{margin:0 0 12px;font-size:.9rem;color:#54677c}" +
      ".pki-ns-dims{display:flex;flex-wrap:wrap;gap:14px;margin-bottom:14px}" +
      ".pki-ns-dim{display:flex;align-items:center;gap:8px}" +
      ".pki-ns-dim label{font-size:.8rem;font-weight:800;color:#54677c;min-width:52px}" +
      ".pki-ns-btn{width:38px;height:38px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#1fa6a2;font-size:1.3rem;font-weight:800;cursor:pointer;line-height:1}" +
      ".pki-ns-btn:active{transform:scale(.9)}" +
      ".pki-ns-btn:focus-visible{outline:3px solid #1fa6a2;outline-offset:2px}" +
      ".pki-ns-val{min-width:34px;text-align:center;font-size:1.15rem;font-weight:800;color:#12355b}" +
      ".pki-ns-stage{overflow-x:auto;padding:6px 0}" +
      ".pki-ns-face{cursor:pointer;transition:fill .12s}" +
      ".pki-ns-face:focus-visible{outline:3px solid #12355b}" +
      ".pki-ns-tot{margin-top:12px;font-size:1.05rem;color:#12355b;line-height:1.5}" +
      ".pki-ns-tot b{font-size:1.25rem}" +
      ".pki-ns-done{margin-top:8px;padding:10px 12px;border-radius:10px;font-size:.95rem;line-height:1.4}" +
      ".pki-ns-done.ok{background:#e6f7ee;border-left:4px solid #17a05f}" +
      ".pki-ns-done.part{background:#fff8e8;border-left:4px solid #f0a202}" +
      ".pki-ns-reset{margin-top:10px;min-height:44px;padding:0 16px;border-radius:10px;border:2px solid #e4ebf2;background:#fff;color:#12355b;font-weight:800;cursor:pointer}";
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

    var MIN = 1,
      MAX = 12;
    var unit = el.dataset.unit || "in";
    var dims = {
      l: clamp(parseInt(el.dataset.l, 10) || 5, MIN, MAX),
      w: clamp(parseInt(el.dataset.w, 10) || 3, MIN, MAX),
      h: clamp(parseInt(el.dataset.h, 10) || 2, MIN, MAX),
    };
    /* Which faces the student has tapped as "counted". */
    var counted = {};

    var root = document.createElement("div");
    root.className = "pki-ns";
    root.innerHTML =
      "<h4>Net Surface — unfold the box</h4>" +
      '<p class="pki-ns-sub">Set the dimensions, then tap each face to count it. The total only adds faces you have counted.</p>' +
      '<div class="pki-ns-dims"></div>' +
      '<div class="pki-ns-stage"></div>' +
      '<div class="pki-ns-tot"></div>' +
      '<div class="pki-ns-done"></div>' +
      '<button type="button" class="pki-ns-reset">Uncount all faces</button>';
    el.appendChild(root);

    var dimWrap = root.querySelector(".pki-ns-dims");
    var stage = root.querySelector(".pki-ns-stage");
    var totEl = root.querySelector(".pki-ns-tot");
    var doneEl = root.querySelector(".pki-ns-done");

    [
      ["l", "Length"],
      ["w", "Width"],
      ["h", "Height"],
    ].forEach(function (pair) {
      var key = pair[0];
      var d = document.createElement("div");
      d.className = "pki-ns-dim";
      d.innerHTML =
        "<label>" +
        pair[1] +
        '</label><button type="button" class="pki-ns-btn" data-d="' +
        key +
        '" data-s="-1" aria-label="Decrease ' +
        pair[1] +
        '">−</button><span class="pki-ns-val" data-v="' +
        key +
        '"></span><button type="button" class="pki-ns-btn" data-d="' +
        key +
        '" data-s="1" aria-label="Increase ' +
        pair[1] +
        '">+</button>';
      dimWrap.appendChild(d);
    });

    dimWrap.addEventListener("click", function (e) {
      var b = e.target.closest(".pki-ns-btn");
      if (!b) return;
      var k = b.dataset.d;
      dims[k] = clamp(dims[k] + Number(b.dataset.s), MIN, MAX);
      /* Changing a dimension invalidates what was counted — the faces are a
         different size now, so make the student re-count rather than leaving a
         stale total that looks right. */
      counted = {};
      render();
    });

    root.querySelector(".pki-ns-reset").addEventListener("click", function () {
      counted = {};
      render();
    });

    /* The six faces of the net, laid out in the standard cross:
         [       top(l×w)      ]
         [ left  front  right back ]   (h×w, l×h, h×w, l×h)
         [      bottom(l×w)    ]     */
    function faces() {
      var l = dims.l,
        w = dims.w,
        h = dims.h;
      return [
        { id: "top", label: "top", a: l, b: w, col: 1, row: 0 },
        { id: "left", label: "left", a: h, b: w, col: 0, row: 1 },
        { id: "front", label: "front", a: l, b: h, col: 1, row: 1 },
        { id: "right", label: "right", a: h, b: w, col: 2, row: 1 },
        { id: "back", label: "back", a: l, b: h, col: 3, row: 1 },
        { id: "bottom", label: "bottom", a: l, b: w, col: 1, row: 2 },
      ];
    }

    function render() {
      ["l", "w", "h"].forEach(function (k) {
        root.querySelector('[data-v="' + k + '"]').textContent = dims[k];
      });

      var f = faces();
      var SC = 16; // px per unit
      var PAD = 8;
      /* Column widths follow the net layout: h, l, h, l. */
      var colW = [dims.h, dims.l, dims.h, dims.l].map(function (n) {
        return n * SC;
      });
      var rowH = [dims.w * SC, dims.h * SC, dims.w * SC];
      var colX = [];
      var acc = PAD;
      for (var i = 0; i < colW.length; i++) {
        colX.push(acc);
        acc += colW[i];
      }
      var rowY = [];
      var accY = PAD;
      for (var j = 0; j < rowH.length; j++) {
        rowY.push(accY);
        accY += rowH[j];
      }
      var totalW = acc + PAD;
      var totalH = accY + PAD;

      var svg =
        '<svg viewBox="0 0 ' +
        totalW +
        " " +
        totalH +
        '" width="' +
        Math.min(totalW, 560) +
        '" role="img" aria-label="Net of the box with six faces">';
      f.forEach(function (face) {
        var x = colX[face.col];
        var y = rowY[face.row];
        var fw = face.a * SC;
        var fh = face.b * SC;
        /* Column/row sizing already encodes a and b; recompute from the grid so
           the drawing can never disagree with the arithmetic below. */
        fw = colW[face.col];
        fh = rowH[face.row];
        var on = !!counted[face.id];
        svg +=
          '<g><rect class="pki-ns-face" tabindex="0" role="button" aria-pressed="' +
          on +
          '" data-face="' +
          face.id +
          '" x="' +
          x +
          '" y="' +
          y +
          '" width="' +
          fw +
          '" height="' +
          fh +
          '" fill="' +
          (on ? "#1fa6a2" : "#eef4f9") +
          '" stroke="#12355b" stroke-width="2"></rect>' +
          '<text x="' +
          (x + fw / 2) +
          '" y="' +
          (y + fh / 2 - 2) +
          '" text-anchor="middle" font-size="11" font-weight="700" fill="' +
          (on ? "#fff" : "#12355b") +
          '" pointer-events="none">' +
          face.label +
          "</text>" +
          '<text x="' +
          (x + fw / 2) +
          '" y="' +
          (y + fh / 2 + 12) +
          '" text-anchor="middle" font-size="10" fill="' +
          (on ? "#eafff9" : "#54677c") +
          '" pointer-events="none">' +
          face.a +
          "×" +
          face.b +
          "</text></g>";
      });
      svg += "</svg>";
      stage.innerHTML = svg;

      var total = 0,
        n = 0;
      f.forEach(function (face) {
        if (counted[face.id]) {
          total += face.a * face.b;
          n++;
        }
      });
      var full = 2 * (dims.l * dims.w + dims.l * dims.h + dims.w * dims.h);

      totEl.innerHTML =
        "Counted <b>" +
        n +
        "</b> of 6 faces &nbsp;·&nbsp; running total <b>" +
        total +
        "</b> " +
        unit +
        "&sup2;";

      if (n === 6) {
        doneEl.className = "pki-ns-done ok";
        doneEl.innerHTML =
          "All six faces counted. Surface area = <b>" +
          full +
          "</b> " +
          unit +
          "&sup2; — and notice it is 2(lw + lh + wh) = 2(" +
          dims.l * dims.w +
          " + " +
          dims.l * dims.h +
          " + " +
          dims.w * dims.h +
          ").";
      } else if (n === 0) {
        doneEl.className = "pki-ns-done part";
        doneEl.textContent =
          "Tap a face to start counting. There are six — do not forget the bottom.";
      } else {
        doneEl.className = "pki-ns-done part";
        doneEl.textContent =
          "You are " + (6 - n) + " face(s) short. Which ones have you not touched yet?";
      }
    }

    stage.addEventListener("click", function (e) {
      var r = e.target.closest(".pki-ns-face");
      if (!r) return;
      var id = r.dataset.face;
      counted[id] = !counted[id];
      render();
    });
    stage.addEventListener("keydown", function (e) {
      var r = e.target.closest(".pki-ns-face");
      if (!r) return;
      if (e.key === "Enter" || e.key === " ") {
        counted[r.dataset.face] = !counted[r.dataset.face];
        render();
        e.preventDefault();
      }
    });

    render();
  }

  function ready(fn) {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }
  ready(function () {
    document.querySelectorAll('.pki-manip[data-manip="net-surface"]').forEach(init);
    setTimeout(function () {
      document.querySelectorAll('.pki-manip[data-manip="net-surface"]').forEach(init);
    }, 900);
  });

  if (typeof window !== "undefined") {
    window.NeftManips = window.NeftManips || {};
    window.NeftManips["net-surface"] = init;
  }
})();
