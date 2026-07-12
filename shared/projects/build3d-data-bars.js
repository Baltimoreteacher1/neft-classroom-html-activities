/* ==========================================================================
   Projects 3D builder — "data-bars" (Statistics: Class Data Detective).
   The student types their own dataset and watches it rise as 3D bars on a grid.
   A translucent MEAN plane cuts across every bar; the MEDIAN bar(s) glow; the
   readout shows Mean, Median, and Range. Seeing the mean as a physical "balance
   height" and the median as the middle bar makes center vs. spread concrete.

   Self-registers into window.P3D. Robust: boxes + one plane only.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof window === "undefined" || !window.P3D) return;

  window.P3D.registerKind("data-bars", function (THREE, mount, data, P3D) {
    var isEs = P3D.lang() === "es";
    var MAXBARS = data.maxBars || 12;
    var MAXVAL = data.maxVal || 10;
    var CO = {
      label: isEs
        ? "Tu conjunto de datos (números separados por comas)"
        : "Your dataset (comma-separated numbers)",
      mean: isEs ? "Media" : "Mean",
      median: isEs ? "Mediana" : "Median",
      range: isEs ? "Rango" : "Range",
      meanPlane: isEs ? "= plano de la media" : "= mean plane",
      hint: isEs
        ? "Escribe hasta 12 números (0–10). El plano azul es la media; las barras verdes son la mediana."
        : "Type up to 12 numbers (0–10). The blue plane is the mean; the green bar(s) are the median.",
    };

    var wrap = P3D.el("div", "p3d-wrap");
    var stageBox = P3D.el("div", "p3d-stage");
    var holder = P3D.el("div", "p3d-canvas-holder");
    var hero = P3D.el("img", "p3d-hero");
    hero.alt = isEs ? "Tus datos en 3D" : "Your data in 3D";
    stageBox.appendChild(holder);
    stageBox.appendChild(hero);

    var side = P3D.el("div", "p3d-side");
    var field = P3D.el("div", "p3d-field");
    field.appendChild(P3D.el("label", null, CO.label));
    var input = P3D.el("input");
    input.type = "text";
    input.value = data.default || "4, 7, 7, 9, 5, 8, 6";
    input.setAttribute("aria-label", CO.label);
    input.style.cssText =
      "width:100%;font-size:1rem;font-weight:700;padding:.5em;border:2px solid var(--tp-line,#e4ebf2);border-radius:10px";
    field.appendChild(input);
    side.appendChild(field);

    var meanOut = P3D.el("div", "p3d-readout");
    var medOut = P3D.el("div", "p3d-note");
    var rangeOut = P3D.el("div", "p3d-note");
    side.appendChild(meanOut);
    side.appendChild(medOut);
    side.appendChild(rangeOut);

    var actions = P3D.el("div", "p3d-actions");
    side.appendChild(actions);
    side.appendChild(P3D.el("p", "p3d-hint", CO.hint));

    wrap.appendChild(stageBox);
    wrap.appendChild(side);
    mount.appendChild(wrap);

    /* ---- three.js stage ------------------------------------------------- */
    var stage = P3D.makeStage(THREE, holder, { radius: 18, phi: 0.86 });
    var group = new THREE.Group();
    stage.scene.add(group);

    function parseData() {
      var nums = (input.value.match(/-?\d+(\.\d+)?/g) || [])
        .map(Number)
        .filter(function (n) {
          return isFinite(n);
        })
        .map(function (n) {
          return Math.max(0, Math.min(MAXVAL, n));
        })
        .slice(0, MAXBARS);
      return nums.length ? nums : [0];
    }
    function stats(a) {
      var s = a.slice().sort(function (x, y) {
        return x - y;
      });
      var sum = a.reduce(function (p, c) {
        return p + c;
      }, 0);
      var mean = sum / a.length;
      var mid = Math.floor(s.length / 2);
      var median = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
      return { mean: mean, median: median, range: s[s.length - 1] - s[0], sorted: s };
    }
    function round(n) {
      return Math.round(n * 100) / 100;
    }

    function clear(g) {
      while (g.children.length) {
        var c = g.children[0];
        g.remove(c);
        if (c.geometry) c.geometry.dispose();
      }
    }

    function build() {
      clear(group);
      var vals = parseData();
      var st = stats(vals);
      var n = vals.length;
      var barW = 0.7,
        gap = 0.45,
        pitch = barW + gap;
      var totalW = n * pitch;
      var x0 = -totalW / 2 + pitch / 2;

      // grid floor
      var grid = new THREE.GridHelper(
        Math.max(totalW + 2, 8),
        Math.max(n + 2, 8),
        0xc3d2e6,
        0xdce6f2,
      );
      grid.position.y = 0;
      group.add(grid);

      // bars — median bars glow green; the rest share one clean blue that
      // lightens with height (a single hue avoids muddy grey mid-tones)
      vals.forEach(function (v, i) {
        var h = Math.max(v, 0.001);
        var isMedian =
          v === st.median ||
          (n % 2 === 0 && (v === st.sorted[n / 2 - 1] || v === st.sorted[n / 2]));
        var col = isMedian ? 0x2ecc71 : mix(0x1f4fb0, 0x6fa8ff, v / MAXVAL);
        var mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.05 });
        var box = new THREE.Mesh(new THREE.BoxGeometry(barW, h, barW), mat);
        box.position.set(x0 + i * pitch, h / 2, 0);
        box.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(box.geometry),
            new THREE.LineBasicMaterial({ color: 0x18324f }),
          ),
        );
        group.add(box);
      });

      // mean plane (translucent)
      if (st.mean > 0.01) {
        var planeMat = new THREE.MeshStandardMaterial({
          color: 0x2f6fe0,
          transparent: true,
          opacity: 0.32,
          side: THREE.DoubleSide,
        });
        var plane = new THREE.Mesh(new THREE.PlaneGeometry(totalW + 1, 1.4), planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.set(0, st.mean, 0);
        group.add(plane);
      }

      // centre + frame
      group.position.set(0, -MAXVAL / 2, 0);
      stage.castShadows(group);
      stage.setGroundY(-MAXVAL / 2);
      stage.controls.setTarget(0, 0, 0);
      stage.controls.setRadius(Math.max(12, totalW * 1.4 + 6));

      meanOut.innerHTML =
        CO.mean +
        ": <b>" +
        round(st.mean) +
        "</b> <span style='font-weight:600;opacity:.85'>" +
        CO.meanPlane +
        "</span>";
      medOut.textContent = CO.median + ": " + round(st.median);
      rangeOut.textContent = CO.range + ": " + round(st.range);
      meanOut.setAttribute("aria-live", "polite");
    }

    function mix(a, b, t) {
      t = Math.max(0, Math.min(1, t));
      var ar = (a >> 16) & 255,
        ag = (a >> 8) & 255,
        ab = a & 255;
      var br = (b >> 16) & 255,
        bg = (b >> 8) & 255,
        bb = b & 255;
      return (
        (((ar + (br - ar) * t) | 0) << 16) |
        (((ag + (bg - ag) * t) | 0) << 8) |
        ((ab + (bb - ab) * t) | 0)
      );
    }

    input.addEventListener("input", build);

    /* AR */
    P3D.arSupported().then(function (ok) {
      if (!ok) return;
      var arBtn = P3D.el("button", "p3d-action", P3D.t(P3D.copy.ar));
      arBtn.type = "button";
      arBtn.addEventListener("click", function () {
        P3D.startAR(THREE, function () {
          var g = new THREE.Group();
          var vals = parseData();
          var pitch = 0.09;
          vals.forEach(function (v, i) {
            var h = Math.max(v, 0.001) * 0.03;
            var box = new THREE.Mesh(
              new THREE.BoxGeometry(0.06, h, 0.06),
              new THREE.MeshStandardMaterial({ color: 0x2f6fe0, roughness: 0.5 }),
            );
            box.position.set((i - vals.length / 2) * pitch, h / 2, 0);
            g.add(box);
          });
          return g;
        });
      });
      actions.appendChild(arBtn);
    });

    /* print capture */
    function capture() {
      var url = stage.snapshot();
      if (url) hero.src = url;
    }
    window.addEventListener("beforeprint", capture);
    setTimeout(capture, 800);

    build();
  });
})();
