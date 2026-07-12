/* ==========================================================================
   Projects 3D builder — "floor-plan" (Unit 5: Dream Room Designer).
   The student sizes a bedroom (Length × Width) plus a triangular reading nook
   (base × height) and sees it as a real 3D room with low walls, a bed, and a
   rug. Live readouts: rectangle area (L·W), triangle area (½·b·h), and total
   square units — the exact composite-area computation the project asks for.
   "Walk your room" places it in AR at real scale.

   Self-registers into window.P3D. Robust: slabs, thin wall boxes, one triangle.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof window === "undefined" || !window.P3D) return;

  window.P3D.registerKind("floor-plan", function (THREE, mount, data, P3D) {
    var isEs = P3D.lang() === "es";
    var unit = data.unit || "ft";
    var min = data.min || 4,
      max = data.max || 20;
    var def = Array.isArray(data.default) ? data.default : [12, 10];
    var nook = Array.isArray(data.nook) ? data.nook : [6, 4];
    var L = clamp(def[0], min, max),
      W = clamp(def[1], min, max);
    var NB = clamp(nook[0], 2, max),
      NH = clamp(nook[1], 2, max);
    function clamp(v, a, b) {
      return Math.max(a, Math.min(b, v | 0 || a));
    }

    var CO = {
      len: isEs ? "Largo" : "Length",
      wid: isEs ? "Ancho" : "Width",
      nb: isEs ? "Base del rincón" : "Nook base",
      nh: isEs ? "Altura del rincón" : "Nook height",
      rect: isEs ? "Área del cuarto" : "Room area",
      tri: isEs ? "Área del rincón" : "Nook area",
      total: isEs ? "Área total" : "Total area",
      sq: isEs ? "unidades²" : "sq " + unit,
      hint: isEs
        ? "El piso azul es tu cuarto (largo × ancho); el triángulo verde es el rincón de lectura (½ · base · altura)."
        : "The blue floor is your room (length × width); the green triangle is the reading nook (½ · base · height).",
    };

    var wrap = P3D.el("div", "p3d-wrap");
    var stageBox = P3D.el("div", "p3d-stage");
    var holder = P3D.el("div", "p3d-canvas-holder");
    var hero = P3D.el("img", "p3d-hero");
    hero.alt = isEs ? "Tu cuarto en 3D" : "Your room in 3D";
    stageBox.appendChild(holder);
    stageBox.appendChild(hero);

    var side = P3D.el("div", "p3d-side");
    var fields = P3D.el("div", "p3d-fields");
    fields.appendChild(
      P3D.stepper(CO.len, L, min, max, function (v) {
        L = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.wid, W, min, max, function (v) {
        W = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.nb, NB, 2, max, function (v) {
        NB = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.nh, NH, 2, max, function (v) {
        NH = v;
        rebuild();
      }),
    );
    side.appendChild(fields);

    var rectOut = P3D.el("div", "p3d-readout");
    var triOut = P3D.el("div", "p3d-note");
    var totOut = P3D.el("div", "p3d-note");
    side.appendChild(rectOut);
    side.appendChild(triOut);
    side.appendChild(totOut);
    var actions = P3D.el("div", "p3d-actions");
    side.appendChild(actions);
    side.appendChild(P3D.el("p", "p3d-hint", CO.hint));

    wrap.appendChild(stageBox);
    wrap.appendChild(side);
    mount.appendChild(wrap);

    var inited = false;
    var stage = P3D.makeStage(THREE, holder, { radius: 26, phi: 0.78 });
    var group = new THREE.Group();
    stage.scene.add(group);

    function clear(g) {
      while (g.children.length) {
        var c = g.children[0];
        g.remove(c);
        if (c.geometry) c.geometry.dispose();
      }
    }
    function edged(mesh, color) {
      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          new THREE.LineBasicMaterial({ color: color || 0x18324f }),
        ),
      );
      return mesh;
    }

    function build() {
      clear(group);
      var wallH = 2.2,
        wallT = 0.3;

      // Floor slab (room)
      var floor = edged(
        new THREE.Mesh(
          new THREE.BoxGeometry(L, 0.2, W),
          new THREE.MeshStandardMaterial({ color: 0x9cc0f0, roughness: 0.85 }),
        ),
      );
      floor.position.set(0, 0.1, 0);
      group.add(floor);

      // Four low walls
      var wallMat = new THREE.MeshStandardMaterial({ color: 0xeaf1fb, roughness: 0.9 });
      function wall(w, d, x, z) {
        var m = edged(new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat), 0xb9cbe4);
        m.position.set(x, wallH / 2, z);
        group.add(m);
      }
      wall(L, wallT, 0, -W / 2); // back
      wall(L, wallT, 0, W / 2); // front
      wall(wallT, W, -L / 2, 0); // left
      wall(wallT, W, L / 2, 0); // right

      // Triangular reading nook (flat green triangle) tucked in a corner
      var shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(NB, 0);
      shape.lineTo(0, NH);
      shape.lineTo(0, 0);
      var tri = edged(
        new THREE.Mesh(
          new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false }),
          new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.7 }),
        ),
        0x14713f,
      );
      tri.rotation.x = -Math.PI / 2;
      tri.position.set(-L / 2 + 0.16, 0.24, -W / 2 + 0.16 + Math.min(NH, W - 0.4));
      group.add(tri);

      // A bed (delight) sized to the room, capped so it always fits
      var bedL = Math.min(6, L - 1.5),
        bedW = Math.min(4, W - 1.5);
      if (bedL > 1 && bedW > 1) {
        var bed = edged(
          new THREE.Mesh(
            new THREE.BoxGeometry(bedL, 1, bedW),
            new THREE.MeshStandardMaterial({ color: 0xffb0c4, roughness: 0.7 }),
          ),
          0xcc6f88,
        );
        bed.position.set(L / 2 - bedL / 2 - 0.5, 0.6, W / 2 - bedW / 2 - 0.5);
        group.add(bed);
      }

      group.position.set(0, -1, 0);
      stage.castShadows(group);
      stage.setGroundY(-1);
      stage.controls.setTarget(0, 0, 0);
      stage.controls.setRadius(Math.max(16, Math.max(L, W) * 1.9));

      var rect = L * W,
        triA = 0.5 * NB * NH;
      rectOut.innerHTML = CO.rect + ": <b>" + L + " × " + W + " = " + rect + "</b> " + CO.sq;
      triOut.textContent = CO.tri + ": ½ × " + NB + " × " + NH + " = " + triA + " " + CO.sq;
      totOut.textContent =
        CO.total + ": " + rect + " + " + triA + " = " + (rect + triA) + " " + CO.sq;
      rectOut.setAttribute("aria-live", "polite");
    }

    function rebuild() {
      if (!inited) return;
      build();
    }

    /* AR — real-scale room outline */
    P3D.arSupported().then(function (ok) {
      if (!ok) return;
      var arBtn = P3D.el(
        "button",
        "p3d-action",
        isEs ? "📱 Recorre tu cuarto (RA)" : "📱 Walk your room (AR)",
      );
      arBtn.type = "button";
      arBtn.addEventListener("click", function () {
        P3D.startAR(THREE, function () {
          var s = { ft: 0.3048, m: 1, cm: 0.01, u: 0.3 }[unit] || 0.3;
          var g = new THREE.Group();
          var floor = new THREE.Mesh(
            new THREE.BoxGeometry(L * s, 0.02, W * s),
            new THREE.MeshStandardMaterial({ color: 0x9cc0f0 }),
          );
          g.add(floor);
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
