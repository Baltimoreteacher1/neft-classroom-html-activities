/* ==========================================================================
   Projects 3D builder — "tile-extrude" (Unit 6: Game Studio Scoring Engine).
   The student sees an expression like a·(b + c) as an EXTRUDED area model: an
   a × (b + c) grid of score blocks, split by color into the a·b block and the
   a·c block. Rotating it in 3D makes the distributive property physical — the
   two colored slabs ARE a·b and a·c, and together they fill a·(b + c). Live
   readout shows a(b + c) = ab + ac and the equal totals.

   Self-registers into window.P3D. Robust: a grid of small boxes.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof window === "undefined" || !window.P3D) return;

  window.P3D.registerKind("tile-extrude", function (THREE, mount, data, P3D) {
    var isEs = P3D.lang() === "es";
    var min = 1,
      max = data.max || 8;
    var def = Array.isArray(data.default) ? data.default : [3, 4, 2];
    var a = clamp(def[0]),
      b = clamp(def[1]),
      c = clamp(def[2]);
    function clamp(v) {
      return Math.max(min, Math.min(max, v | 0 || min));
    }

    var CO = {
      a: isEs ? "a (multiplicador)" : "a (multiplier)",
      b: isEs ? "b" : "b",
      c: isEs ? "c" : "c",
      expr: isEs ? "Expresión" : "Expression",
      expand: isEs ? "Distribuida" : "Distributed",
      equal: isEs ? "Iguales" : "Both equal",
      hint: isEs
        ? "El bloque azul es a·b y el ámbar es a·c. Juntos llenan a·(b + c) — así funciona la propiedad distributiva."
        : "The blue slab is a·b and the amber slab is a·c. Together they fill a·(b + c) — that's the distributive property.",
    };

    var wrap = P3D.el("div", "p3d-wrap");
    var stageBox = P3D.el("div", "p3d-stage");
    var holder = P3D.el("div", "p3d-canvas-holder");
    var hero = P3D.el("img", "p3d-hero");
    hero.alt = isEs ? "Tu modelo de área en 3D" : "Your area model in 3D";
    stageBox.appendChild(holder);
    stageBox.appendChild(hero);

    var side = P3D.el("div", "p3d-side");
    var fields = P3D.el("div", "p3d-fields");
    fields.appendChild(
      P3D.stepper(CO.a, a, min, max, function (v) {
        a = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.b, b, min, max, function (v) {
        b = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.c, c, min, max, function (v) {
        c = v;
        rebuild();
      }),
    );
    side.appendChild(fields);

    var exprOut = P3D.el("div", "p3d-readout");
    var expandOut = P3D.el("div", "p3d-note");
    var equalOut = P3D.el("div", "p3d-note");
    side.appendChild(exprOut);
    side.appendChild(expandOut);
    side.appendChild(equalOut);
    var actions = P3D.el("div", "p3d-actions");
    side.appendChild(actions);
    side.appendChild(P3D.el("p", "p3d-hint", CO.hint));

    wrap.appendChild(stageBox);
    wrap.appendChild(side);
    mount.appendChild(wrap);

    var inited = false;
    var stage = P3D.makeStage(THREE, holder, { radius: 16, phi: 0.78 });
    var group = new THREE.Group();
    stage.scene.add(group);

    var matB = new THREE.MeshStandardMaterial({ color: 0x2f6fe0, roughness: 0.5 });
    var matC = new THREE.MeshStandardMaterial({ color: 0xffb020, roughness: 0.5 });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0x18324f });

    function clear(g) {
      while (g.children.length) {
        var ch = g.children[0];
        g.remove(ch);
        if (ch.geometry) ch.geometry.dispose();
      }
    }

    function build() {
      clear(group);
      var cols = b + c,
        rows = a;
      var tile = 0.9,
        gap = 0.12,
        pitch = tile + gap,
        depth = 0.6;
      var x0 = -(cols * pitch) / 2 + pitch / 2;
      var z0 = -(rows * pitch) / 2 + pitch / 2;
      var geo = new THREE.BoxGeometry(tile, depth, tile);
      var edgeGeo = new THREE.EdgesGeometry(geo);

      for (var r = 0; r < rows; r++) {
        for (var col = 0; col < cols; col++) {
          var isB = col < b;
          var m = new THREE.Mesh(geo, isB ? matB : matC);
          m.position.set(x0 + col * pitch, depth / 2, z0 + r * pitch);
          m.add(new THREE.LineSegments(edgeGeo, edgeMat));
          group.add(m);
        }
      }

      stage.castShadows(group);
      stage.setGroundY(0);
      stage.controls.setTarget(0, 0, 0);
      stage.controls.setRadius(Math.max(10, cols * 1.5 + 4));

      var ab = a * b,
        ac = a * c,
        tot = a * (b + c);
      exprOut.innerHTML = CO.expr + ": <b>" + a + " × (" + b + " + " + c + ") = " + tot + "</b>";
      expandOut.textContent =
        CO.expand + ": (" + a + "×" + b + ") + (" + a + "×" + c + ") = " + ab + " + " + ac;
      equalOut.textContent = CO.equal + ": " + tot + " = " + (ab + ac);
      exprOut.setAttribute("aria-live", "polite");
    }

    function rebuild() {
      if (!inited) return;
      build();
    }

    /* AR — the extruded area model at a handheld scale */
    P3D.arSupported().then(function (ok) {
      if (!ok) return;
      var arBtn = P3D.el("button", "p3d-action", P3D.t(P3D.copy.ar));
      arBtn.type = "button";
      arBtn.addEventListener("click", function () {
        P3D.startAR(THREE, function () {
          var g = new THREE.Group();
          var cols = b + c,
            s = 0.03,
            pitch = 0.035;
          var gx = -(cols * pitch) / 2,
            gz = -(a * pitch) / 2;
          var bg = new THREE.BoxGeometry(s, 0.02, s);
          for (var r = 0; r < a; r++)
            for (var col = 0; col < cols; col++) {
              var m = new THREE.Mesh(
                bg,
                new THREE.MeshStandardMaterial({
                  color: col < b ? 0x2f6fe0 : 0xffb020,
                  roughness: 0.5,
                }),
              );
              m.position.set(gx + col * pitch, 0.01, gz + r * pitch);
              g.add(m);
            }
          return g;
        });
      });
      actions.appendChild(arBtn);
    });

    function capture() {
      var url = stage.snapshot();
      if (url) hero.src = url;
    }
    window.addEventListener("beforeprint", capture);
    setTimeout(capture, 800);

    inited = true;
    build();
  });
})();
