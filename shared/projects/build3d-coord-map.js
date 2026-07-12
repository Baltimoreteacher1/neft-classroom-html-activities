/* ==========================================================================
   Projects 3D builder — "coord-map" (Unit 7: Theme Park Map Designer).
   The student plots two attractions on a coordinate plane laid flat as the park
   map, moves them with steppers, and reads their coordinates, the distance
   between them (grid units), and the reflection of attraction A across an axis —
   the exact coordinate-plane skills the project asks for (plot, distance,
   reflect). A ghost marker shows the reflected image.

   Self-registers into window.P3D. Robust: GridHelper, line axes, cylinders.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof window === "undefined" || !window.P3D) return;

  window.P3D.registerKind("coord-map", function (THREE, mount, data, P3D) {
    var isEs = P3D.lang() === "es";
    var R = data.range || 10; // grid spans -R..R
    var A = (data.a || [3, 4]).slice();
    var B = (data.b || [3, -2]).slice();
    var axis = "x"; // reflect A across this axis

    var CO = {
      ax: "A · x",
      ay: "A · y",
      bx: "B · x",
      by: "B · y",
      coords: isEs ? "Atracciones" : "Attractions",
      dist: isEs ? "Distancia" : "Distance",
      refl: isEs ? "Reflejo de A" : "Reflection of A",
      across: isEs ? "Reflejar A sobre eje" : "Reflect A across",
      units: isEs ? "unidades" : "units",
      diag: isEs ? "(cuenta por la cuadrícula)" : "(count along the grid)",
      hint: isEs
        ? "Mueve A (rojo) y B (azul). El marcador hueco es el reflejo de A. Mismos x o y → distancia directa."
        : "Move A (red) and B (blue). The hollow marker is A's reflection. Same x or same y → straight distance.",
    };

    var wrap = P3D.el("div", "p3d-wrap");
    var stageBox = P3D.el("div", "p3d-stage");
    var holder = P3D.el("div", "p3d-canvas-holder");
    var hero = P3D.el("img", "p3d-hero");
    hero.alt = isEs ? "Tu mapa en 3D" : "Your map in 3D";
    stageBox.appendChild(holder);
    stageBox.appendChild(hero);

    var side = P3D.el("div", "p3d-side");
    var fields = P3D.el("div", "p3d-fields");
    fields.appendChild(
      P3D.stepper(CO.ax, A[0], -R, R, function (v) {
        A[0] = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.ay, A[1], -R, R, function (v) {
        A[1] = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.bx, B[0], -R, R, function (v) {
        B[0] = v;
        rebuild();
      }),
    );
    fields.appendChild(
      P3D.stepper(CO.by, B[1], -R, R, function (v) {
        B[1] = v;
        rebuild();
      }),
    );
    side.appendChild(fields);

    var coordOut = P3D.el("div", "p3d-readout");
    var distOut = P3D.el("div", "p3d-note");
    var reflOut = P3D.el("div", "p3d-note");
    side.appendChild(coordOut);
    side.appendChild(distOut);
    side.appendChild(reflOut);

    var actions = P3D.el("div", "p3d-actions");
    var reflBtn = P3D.el("button", "p3d-action ghost", CO.across + ": x");
    reflBtn.type = "button";
    reflBtn.addEventListener("click", function () {
      axis = axis === "x" ? "y" : "x";
      reflBtn.textContent = CO.across + ": " + axis;
      rebuild();
    });
    actions.appendChild(reflBtn);
    side.appendChild(actions);
    side.appendChild(P3D.el("p", "p3d-hint", CO.hint));

    wrap.appendChild(stageBox);
    wrap.appendChild(side);
    mount.appendChild(wrap);

    var inited = false;
    var stage = P3D.makeStage(THREE, holder, { radius: R * 2.4, phi: 0.72 });
    var group = new THREE.Group();
    stage.scene.add(group);

    // coordinate (x,y) → world (x, 0, -y): +y points away from the camera
    function toWorld(x, y) {
      return new THREE.Vector3(x, 0, -y);
    }

    function clear(g) {
      while (g.children.length) {
        var c = g.children[0];
        g.remove(c);
        if (c.geometry) c.geometry.dispose();
      }
    }

    function marker(x, y, color, hollow) {
      var g = new THREE.Group();
      var p = toWorld(x, y);
      var h = 2.0;
      var mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.4,
        transparent: hollow,
        opacity: hollow ? 0.4 : 1,
      });
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, h, 16), mat);
      pole.position.set(p.x, h / 2, p.z);
      g.add(pole);
      var head = new THREE.Mesh(
        hollow
          ? new THREE.TorusGeometry(0.42, 0.13, 10, 20)
          : new THREE.SphereGeometry(0.42, 20, 16),
        mat,
      );
      head.position.set(p.x, h + 0.3, p.z);
      if (hollow) head.rotation.x = Math.PI / 2;
      g.add(head);
      // drop dot on the grid
      var dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.28, 20),
        new THREE.MeshBasicMaterial({ color: color }),
      );
      dot.rotation.x = -Math.PI / 2;
      dot.position.set(p.x, 0.02, p.z);
      g.add(dot);
      return g;
    }

    function line(a, b, color) {
      var geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      return new THREE.Line(geo, new THREE.LineBasicMaterial({ color: color }));
    }

    function build() {
      clear(group);

      // grid
      var grid = new THREE.GridHelper(R * 2, R * 2, 0x9fb3cc, 0xd6e0ee);
      group.add(grid);
      // axes: x (world X) red-ish, y (world -Z) green-ish
      group.add(line(new THREE.Vector3(-R, 0.01, 0), new THREE.Vector3(R, 0.01, 0), 0xe0555f));
      group.add(line(new THREE.Vector3(0, 0.01, -R), new THREE.Vector3(0, 0.01, R), 0x2ecc71));

      // markers
      group.add(marker(A[0], A[1], 0xe0555f, false));
      group.add(marker(B[0], B[1], 0x2f6fe0, false));
      // reflection of A
      var rA = axis === "x" ? [A[0], -A[1]] : [-A[0], A[1]];
      group.add(marker(rA[0], rA[1], 0xe0555f, true));
      // connector A—B along the grid (dashed feel via straight line)
      group.add(line(toWorld(A[0], A[1]).setY(0.03), toWorld(B[0], B[1]).setY(0.03), 0x18324f));

      stage.controls.setTarget(0, 0, 0);
      stage.controls.setRadius(R * 2.4);

      // readouts
      coordOut.innerHTML =
        CO.coords + ": <b>A(" + A[0] + ", " + A[1] + ")</b> · <b>B(" + B[0] + ", " + B[1] + ")</b>";
      var dx = Math.abs(A[0] - B[0]),
        dy = Math.abs(A[1] - B[1]);
      var d;
      if (A[0] === B[0]) d = dy + " " + CO.units;
      else if (A[1] === B[1]) d = dx + " " + CO.units;
      else d = dx + " + " + dy + " = " + (dx + dy) + " " + CO.units + " " + CO.diag;
      distOut.textContent = CO.dist + ": " + d;
      reflOut.textContent = CO.refl + " (" + axis + "): (" + rA[0] + ", " + rA[1] + ")";
      coordOut.setAttribute("aria-live", "polite");
    }

    function rebuild() {
      if (!inited) return;
      build();
    }

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
