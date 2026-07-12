/* ==========================================================================
   Projects 3D builder — "net-box" (Unit 10: Package Design Challenge).
   The student sets Length / Width / Height and watches a package NET fold up
   into a 3D box. Live readouts: Volume (L·W·H) and Surface Area (2(lw+lh+wh)).
   A "fold" slider morphs between the flat unfolded net and the closed box, so
   the six faces they will draw on paper map 1:1 to the solid.

   Self-registers into window.P3D. Loaded lazily by projects-3d.js when the
   card scrolls into view. THREE is the vendored module; P3D is the core API.
   ========================================================================== */
(function () {
  "use strict";
  if (typeof window === "undefined" || !window.P3D) return;

  var UNIT_WORD = { in: "in", ft: "ft", cm: "cm", u: "u" };

  window.P3D.registerKind("net-box", function (THREE, mount, data, P3D) {
    var unit = UNIT_WORD[data.unit] || "u";
    var min = data.min || 1,
      max = data.max || 12;
    var def = Array.isArray(data.default) ? data.default : [6, 4, 3];
    var L = clamp(def[0]),
      W = clamp(def[1]),
      H = clamp(def[2]);
    function clamp(v) {
      return Math.max(min, Math.min(max, v | 0 || min));
    }

    var isEs = P3D.lang() === "es";
    var CO = {
      len: isEs ? "Largo" : "Length",
      wid: isEs ? "Ancho" : "Width",
      hei: isEs ? "Alto" : "Height",
      fold: isEs ? "Plegar la plantilla → caja" : "Fold the net → box",
      vol: isEs ? "Volumen" : "Volume",
      sa: isEs ? "Área de superficie" : "Surface area",
      cubic: isEs ? "unidades cúbicas" : "cubic " + unit,
      square: isEs ? "unidades cuadradas" : "square " + unit,
      faces: isEs
        ? "Las 6 caras de la plantilla son las 6 caras de la caja."
        : "The 6 faces of the net are the 6 faces of the box.",
    };

    var inited = false;

    /* ---- DOM scaffold --------------------------------------------------- */
    var wrap = P3D.el("div", "p3d-wrap");
    var stageBox = P3D.el("div", "p3d-stage");
    var holder = P3D.el("div", "p3d-canvas-holder");
    var hero = P3D.el("img", "p3d-hero");
    hero.alt = isEs ? "Tu diseño de caja en 3D" : "Your 3D box design";
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
      P3D.stepper(CO.hei, H, min, max, function (v) {
        H = v;
        rebuild();
      }),
    );
    side.appendChild(fields);

    /* fold slider */
    var foldWrap = P3D.el("div", "p3d-field");
    var foldLab = P3D.el("label", null, CO.fold);
    var fold = P3D.el("input");
    fold.type = "range";
    fold.min = "0";
    fold.max = "1";
    fold.step = "0.01";
    fold.value = "1";
    fold.style.width = "100%";
    fold.setAttribute("aria-label", CO.fold);
    foldWrap.appendChild(foldLab);
    foldWrap.appendChild(fold);
    side.appendChild(foldWrap);

    var volOut = P3D.el("div", "p3d-readout");
    var saOut = P3D.el("div", "p3d-note");
    side.appendChild(volOut);
    side.appendChild(saOut);
    side.appendChild(P3D.el("p", "p3d-note", CO.faces));

    var actions = P3D.el("div", "p3d-actions");
    var resetBtn = P3D.el("button", "p3d-action ghost", P3D.t(P3D.copy.reset));
    resetBtn.type = "button";
    actions.appendChild(resetBtn);
    side.appendChild(actions);
    side.appendChild(P3D.el("p", "p3d-hint", P3D.t(P3D.copy.hint)));

    wrap.appendChild(stageBox);
    wrap.appendChild(side);
    mount.appendChild(wrap);

    /* ---- three.js stage ------------------------------------------------- */
    var stage = P3D.makeStage(THREE, holder, { radius: 22, target: { x: 0, y: 0, z: 0 } });
    var group = new THREE.Group();
    stage.scene.add(group);

    var FACE_COLORS = [0x4f8cff, 0x35c4b0, 0xffb020, 0xff6f91, 0x8b6cff, 0x39c06a];
    var mats = FACE_COLORS.map(function (c) {
      return new THREE.MeshStandardMaterial({
        color: c,
        roughness: 0.55,
        metalness: 0.05,
        side: THREE.DoubleSide,
      });
    });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0x172033 });

    /* Net = a bottom face with four walls hinged on its edges, plus a lid
       hinged on the top edge of the back wall. Every wall lives in a pivot with
       an IDENTICAL local frame: the hinge runs along local +X, the panel lies
       flat pointing local −Z (outward) when open and rotates up about local X
       to stand. Only each pivot's world position + yaw differ, so one fold
       angle drives them all. fold ∈ [0,1]: 0 = flat open net, 1 = closed box. */
    var walls = []; // wall pivot Groups
    var lidPivot = null;

    function faceMesh(w, h, matIdx) {
      var g = new THREE.PlaneGeometry(w, h);
      var m = new THREE.Mesh(g, mats[matIdx]);
      m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g), edgeMat));
      return m;
    }

    /* Hinge at `pos`, oriented by `yaw` (about Y). Panel is `width` along the
       hinge × `height` outward, laid flat toward local −Z so a positive rotation
       about local X raises it upright. Returns the pivot Group. */
    function makeWall(width, height, pos, yaw, matIdx, parent) {
      var pivot = new THREE.Group();
      pivot.rotation.order = "YXZ"; // yaw first, then fold about the local X axis
      pivot.position.copy(pos);
      pivot.rotation.y = yaw;
      var panel = faceMesh(width, height, matIdx);
      panel.rotation.x = -Math.PI / 2; // lay the plane's height into local −Z
      panel.position.z = -height / 2; // extend outward from the hinge line
      pivot.add(panel);
      (parent || group).add(pivot);
      return pivot;
    }

    function build() {
      while (group.children.length) group.remove(group.children[0]);
      walls = [];
      var l = L,
        w = W,
        h = H;

      // Bottom face on the XZ plane, centred at the origin.
      var base = faceMesh(l, w, 0);
      base.rotation.x = -Math.PI / 2;
      group.add(base);

      // Four walls in identical local frames (see makeWall).
      walls.push(makeWall(l, h, new THREE.Vector3(0, 0, -w / 2), 0, 4)); // front (−Z)
      var back = makeWall(l, h, new THREE.Vector3(0, 0, w / 2), Math.PI, 3); // back (+Z)
      walls.push(back);
      walls.push(makeWall(w, h, new THREE.Vector3(l / 2, 0, 0), -Math.PI / 2, 1)); // right (+X)
      walls.push(makeWall(w, h, new THREE.Vector3(-l / 2, 0, 0), Math.PI / 2, 2)); // left (−X)

      // Lid hinges on the back wall's TOP edge — parent it to the back pivot so
      // it rides up with the wall, then folds over the opening. The wall's top
      // edge is at local (0,0,−h); the lid extends a further `w` outward.
      lidPivot = makeWall(l, w, new THREE.Vector3(0, 0, -h), 0, 5, back);

      applyFold(parseFloat(fold.value));
    }

    function applyFold(tf) {
      var ang = (Math.PI / 2) * tf; // 0 flat → 90° upright
      walls.forEach(function (p) {
        p.rotation.x = ang;
      });
      if (lidPivot) lidPivot.rotation.x = ang; // folds over, relative to the back wall
      group.position.y = -H / 2; // centre the box vertically about the origin
    }

    function rebuild() {
      // Steppers call onChange during construction (to set initial ± state),
      // which fires before the three.js stage/group exist — guard until ready.
      if (!inited) return;
      build();
      updateMath();
      frameCamera();
    }

    function frameCamera() {
      var span = Math.max(L, W, H);
      stage.controls.setTarget(0, 0, 0);
      stage.controls.setRadius(Math.max(9, span * 2.2));
    }

    function updateMath() {
      var v = L * W * H;
      var sa = 2 * (L * W + L * H + W * H);
      volOut.innerHTML =
        CO.vol + ": <b>" + L + " × " + W + " × " + H + " = " + v + "</b> " + CO.cubic;
      saOut.textContent =
        CO.sa + ": 2(" + L * W + " + " + L * H + " + " + W * H + ") = " + sa + " " + CO.square;
      // live region
      volOut.setAttribute("aria-live", "polite");
    }

    fold.addEventListener("input", function () {
      applyFold(parseFloat(fold.value));
    });
    resetBtn.addEventListener("click", function () {
      L = clamp(def[0]);
      W = clamp(def[1]);
      H = clamp(def[2]);
      fold.value = "1";
      // reflect in steppers: rebuild fields
      fields.querySelectorAll("input").forEach(function (inp, i) {
        inp.value = String([L, W, H][i]);
      });
      rebuild();
    });

    /* ---- AR button (feature-detected) ---------------------------------- */
    P3D.arSupported().then(function (ok) {
      if (!ok) return;
      var arBtn = P3D.el("button", "p3d-action", P3D.t(P3D.copy.ar));
      arBtn.type = "button";
      arBtn.addEventListener("click", function () {
        P3D.startAR(THREE, function () {
          // real-scale metres: 1 unit(in) = 0.0254 m; ft=0.3048; cm=0.01; u=0.05
          var scale = { in: 0.0254, ft: 0.3048, cm: 0.01, u: 0.05 }[data.unit] || 0.05;
          var g = new THREE.Group();
          var box = new THREE.Mesh(
            new THREE.BoxGeometry(L * scale, H * scale, W * scale),
            new THREE.MeshStandardMaterial({ color: 0x4f8cff, roughness: 0.5 }),
          );
          var edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(box.geometry),
            new THREE.LineBasicMaterial({ color: 0x172033 }),
          );
          box.add(edges);
          g.add(box);
          return g;
        });
      });
      actions.appendChild(arBtn);
    });

    /* ---- print: swap live canvas for a captured hero ------------------- */
    function capture() {
      var url = stage.snapshot();
      if (url) hero.src = url;
    }
    window.addEventListener("beforeprint", capture);
    // also capture once shortly after first render for the showcase
    setTimeout(capture, 800);

    /* ---- go ------------------------------------------------------------- */
    inited = true;
    rebuild();
  });
})();
