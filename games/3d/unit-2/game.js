import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

/* ---------------------------------------------------------------------------
 * Unit 2 — Fraction Kitchen (Bakery)
 * Standard: 6.NS.A.1 — interpret and compute quotients of fractions; reason
 * about fractions as parts of a whole and as division of quantities.
 * Theme: a warm bakery where the player fills fraction orders by building
 * pies/cakes from equal slices, combining unlike-denominator slices, and
 * portioning batter into unit-fraction scoops (division of fractions).
 * ------------------------------------------------------------------------- */

const PALETTE = {
  counter: 0x6b4a2f,
  counterTop: 0xb98a5a,
  floor: 0x21304a,
  plate: 0xf3ecdc,
  scoop: 0xd9dde6,
  amber: 0xf2c15b,
  serve: 0x21c7a8,
  serveBad: 0xc8563a,
  bowl: 0x8fb24a,
  slice: [0xe0673a, 0xead24a, 0x7fb24a, 0x4f8fd0, 0x9b6bd0, 0xd95d8c],
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function simplify(n, d) {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function makeLevel(level) {
  if (level === 1) {
    // Level 1 (support): like-denominator builds + simple division portioning.
    // Smaller numbers, hints on, scaffolded.
    return {
      hints: true,
      rounds: [
        { type: "build", denom: 2, num: 1, good: "pie" },
        { type: "build", denom: 4, num: 3, good: "cake" },
        { type: "build", denom: 3, num: 2, good: "pie" },
        { type: "divide", whole: 2, unitDenom: 2 }, // 2 ÷ 1/2 = 4
        { type: "build", denom: 6, num: 4, good: "cake" },
        { type: "divide", whole: 3, unitDenom: 3 }, // 3 ÷ 1/3 = 9
      ],
    };
  }
  // Level 2 (enrichment): mixed numbers, unlike-denominator combines,
  // and harder division-of-fractions portioning. Larger / multi-step.
  return {
    hints: false,
    rounds: [
      { type: "divide", whole: 3, unitDenom: 4 }, // 3 ÷ 1/4 = 12
      { type: "build", denom: 2, num: 3, good: "pie" }, // 1 1/2 pies = 3 halves
      { type: "combine", a: { n: 1, d: 2 }, b: { n: 1, d: 4 }, good: "cake" }, // 3/4
      { type: "divide", whole: 4, unitDenom: 3 }, // 4 ÷ 1/3 = 12
      { type: "combine", a: { n: 2, d: 3 }, b: { n: 1, d: 6 }, good: "pie" }, // 5/6
      { type: "build", denom: 4, num: 7, good: "cake" }, // 1 3/4
      { type: "divide", whole: 2, unitDenom: 5 }, // 2 ÷ 1/5 = 10
    ],
  };
}

export default {
  id: "unit-2-bakery",
  totalSteps: 0,
  vocab: [
    {
      term: "Numerator",
      definition:
        "The top number of a fraction. It counts how many equal parts you have.",
      emoji: "🔢",
    },
    {
      term: "Denominator",
      definition:
        "The bottom number of a fraction. It tells how many equal parts make one whole.",
      emoji: "🥧",
    },
    {
      term: "Unit fraction",
      definition: "A fraction with 1 on top, like 1/2 or 1/4. One equal part.",
      emoji: "🍰",
    },
    {
      term: "Mixed number",
      definition: "A whole number and a fraction together, like 1 and 1/2.",
      emoji: "🧁",
    },
    {
      term: "Reciprocal",
      definition:
        "Flip a fraction over. To divide by 1/4 you multiply by 4. That is how dividing fractions works.",
      emoji: "🔁",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      renderer,
      input,
      hud,
      feel,
      announce,
      caption,
      THREE,
      level,
      onScore,
      onFrame,
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;

    // ---- Clarity / onboarding kit (shared overlay over the canvas) ----------
    // Mount element is the same positioned container that hosts the canvas.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const group = new THREE.Group();
    scene.add(group);

    // Track everything we create for a clean dispose().
    const ownedGeo = new Set();
    const ownedMat = new Set();
    const ownedTex = new Set();
    function track(mesh) {
      if (mesh.geometry) ownedGeo.add(mesh.geometry);
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      mats.forEach((m) => {
        if (m) {
          ownedMat.add(m);
          if (m.map) ownedTex.add(m.map);
        }
      });
      return mesh;
    }
    function std(opts) {
      return new THREE.MeshStandardMaterial(opts);
    }

    // ---- Stage floor (receives shadows) -------------------------------------
    const floor = track(
      new THREE.Mesh(
        new THREE.CircleGeometry(22, 48),
        std({ color: PALETTE.floor, roughness: 0.95, metalness: 0 }),
      ),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.25;
    floor.receiveShadow = true;
    group.add(floor);

    // ---- Bakery counter (rounded, PBR, casts shadow) ------------------------
    const counterGeo = new RoundedBoxGeometry(15, 1.4, 7.4, 4, 0.35);
    ownedGeo.add(counterGeo);
    const counter = track(
      new THREE.Mesh(
        counterGeo,
        std({ color: PALETTE.counter, roughness: 0.85 }),
      ),
    );
    counter.position.set(0, -0.7, 0);
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    const topGeo = new RoundedBoxGeometry(15, 0.4, 7.4, 4, 0.18);
    ownedGeo.add(topGeo);
    const counterTop = track(
      new THREE.Mesh(
        topGeo,
        std({ color: PALETTE.counterTop, roughness: 0.5, metalness: 0.05 }),
      ),
    );
    counterTop.position.set(0, 0.2, 0);
    counterTop.castShadow = true;
    counterTop.receiveShadow = true;
    group.add(counterTop);

    // Decorative glowing oven behind the counter (bloom accent).
    const ovenGeo = new RoundedBoxGeometry(4.2, 3, 1.4, 5, 0.5);
    ownedGeo.add(ovenGeo);
    const oven = track(
      new THREE.Mesh(
        ovenGeo,
        std({ color: 0x3a4660, roughness: 0.5, metalness: 0.2 }),
      ),
    );
    oven.position.set(-5.5, 1.0, -3.6);
    oven.castShadow = true;
    group.add(oven);
    const ovenGlow = track(
      new THREE.Mesh(
        new THREE.CircleGeometry(1.1, 28),
        std({
          color: 0xffb347,
          emissive: 0xff8a2a,
          emissiveIntensity: 1.6,
          roughness: 0.4,
        }),
      ),
    );
    ovenGlow.position.set(-5.5, 1.0, -2.88);
    group.add(ovenGlow);

    // Serving plate (where the order is built).
    const plate = track(
      new THREE.Mesh(
        new THREE.CylinderGeometry(2.7, 2.5, 0.2, 40),
        new THREE.MeshPhysicalMaterial({
          color: PALETTE.plate,
          roughness: 0.25,
          metalness: 0.0,
          clearcoat: 0.6,
          clearcoatRoughness: 0.3,
        }),
      ),
    );
    plate.position.set(-2.4, 0.55, 0.8);
    plate.castShadow = true;
    plate.receiveShadow = true;
    group.add(plate);

    // Serve button (emissive → glows via bloom; tap + keyboard).
    const serveGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.55, 28);
    const serveBtn = track(
      new THREE.Mesh(
        serveGeo,
        std({
          color: PALETTE.serve,
          emissive: PALETTE.serve,
          emissiveIntensity: 0.5,
          roughness: 0.3,
          metalness: 0.1,
        }),
      ),
    );
    serveBtn.position.set(5.2, 0.55, 2.4);
    serveBtn.castShadow = true;
    group.add(serveBtn);
    const serveLabel = makeLabel("SERVE", {
      THREE,
      scale: 0.95,
      color: "#06352c",
      background: null,
    });
    serveLabel.position.set(5.2, 1.25, 2.4);
    group.add(serveLabel);
    ownedTex.add(serveLabel.material.map);
    ownedMat.add(serveLabel.material);

    // ---- Round state --------------------------------------------------------
    let roundIndex = 0;
    let round = null;
    let solved = false;
    let busy = false; // gate input during transitions/intro
    const sliceMeshes = []; // built parts on plate / scooped discs
    const propMeshes = []; // round props (bowls, prompt labels)
    const sceneItems = []; // selectable tools
    let selected = 0;
    let builtNum = 0;
    let builtDenom = 1;
    let scoopCount = 0;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    // Forgiving stakes: a pool of attempts; a wrong Serve costs one. Run out and
    // the kitchen closes (lose screen). Level 1 gets more cushion than Level 2.
    const START_LIVES = level === 2 ? 4 : 6;
    let lives = START_LIVES;
    let gameOver = false;
    const timers = [];
    const unbinders = [];

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Slice wedge geometry (1/denom of a disc) ---------------------------
    function wedgeMesh(denom, color, radius, height) {
      const ang = (Math.PI * 2) / denom;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, radius, 0, ang, false);
      shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: true,
        bevelThickness: 0.04,
        bevelSize: 0.04,
        bevelSegments: 2,
      });
      geo.rotateX(-Math.PI / 2);
      ownedGeo.add(geo);
      const mat = std({ color, roughness: 0.55, metalness: 0.05 });
      ownedMat.add(mat);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      return m;
    }

    function disposeMesh(m) {
      group.remove(m);
      if (m.geometry) {
        m.geometry.dispose();
        ownedGeo.delete(m.geometry);
      }
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        if (!mat) return;
        if (mat.map) {
          mat.map.dispose();
          ownedTex.delete(mat.map);
        }
        mat.dispose();
        ownedMat.delete(mat);
      });
    }
    function clearArray(arr) {
      arr.forEach(disposeMesh);
      arr.length = 0;
    }

    // ---- World prompt label above the plate ---------------------------------
    let orderLabel = null;
    function setOrderLabel(text) {
      if (!orderLabel) {
        orderLabel = makeLabel(text, {
          THREE,
          scale: 1.35,
          fontSize: 72,
          background: "rgba(18,53,91,0.95)",
          color: "#ffe9a8",
        });
        orderLabel.position.set(0, 4.5, -1.4);
        group.add(orderLabel);
        ownedTex.add(orderLabel.material.map);
        ownedMat.add(orderLabel.material);
      } else {
        updateLabel(orderLabel, text);
      }
    }

    // Pop a mesh in with a scale tween (respects reduced motion).
    function popIn(mesh, to = 1, delay = 0) {
      if (reduced) {
        mesh.scale.setScalar(to);
        return;
      }
      mesh.scale.setScalar(0.001);
      later(() => {
        feel.tween({
          from: 0,
          to,
          duration: 0.32,
          onUpdate: (v) => mesh.scale.setScalar(Math.max(0.001, v)),
        });
      }, delay);
    }

    // ---- Round lifecycle ----------------------------------------------------
    function clearRound() {
      clearArray(sliceMeshes);
      clearArray(propMeshes);
      clearArray(sceneItems);
      builtNum = 0;
      builtDenom = 1;
      scoopCount = 0;
      selected = 0;
      solved = false;
    }

    function startRound() {
      clearRound();
      round = cfg.rounds[roundIndex];
      hud.setProgress(roundIndex, cfg.rounds.length);

      if (round.type === "build") startBuildRound();
      else if (round.type === "combine") startCombineRound();
      else if (round.type === "divide") startDivideRound();

      updateLive();
      refreshSelection();
      feel.sfx("pop");

      if (clarity) {
        let targetTxt = "";
        if (round.type === "divide")
          targetTxt = round.whole + " ÷ 1/" + round.unitDenom;
        else if (round.type === "combine")
          targetTxt = round._sum.n + "/" + round._sum.d;
        else targetTxt = round._orderTxt;
        clarity.setTarget(targetTxt);
      }
    }

    function addToolLabel(text, x, z) {
      const l = makeLabel(text, {
        THREE,
        scale: 0.85,
        fontSize: 56,
        background: "rgba(18,53,91,0.92)",
      });
      l.position.set(x, 2.15, z);
      group.add(l);
      propMeshes.push(l);
      ownedTex.add(l.material.map);
      ownedMat.add(l.material);
      return l;
    }

    // Build N/D of a good from equal 1/D slices.
    function startBuildRound() {
      builtDenom = round.denom;

      const add = wedgeMesh(round.denom, PALETTE.slice[0], 1.0, 0.3);
      add.position.set(3.0, 0.55, -1.9);
      add.userData.kind = "addSlice";
      group.add(add);
      sceneItems.push(add);
      popIn(add, 1, 60);

      const rem = wedgeMesh(round.denom, PALETTE.serveBad, 1.0, 0.3);
      rem.position.set(5.6, 0.55, -1.9);
      rem.rotation.y = Math.PI;
      rem.userData.kind = "removeSlice";
      group.add(rem);
      sceneItems.push(rem);
      popIn(rem, 1, 120);

      addToolLabel("Add 1/" + round.denom, 3.0, -1.9);
      addToolLabel("Remove", 5.6, -1.9);

      const whole = Math.floor(round.num / round.denom);
      const rem2 = round.num - whole * round.denom;
      let orderTxt = round.num + "/" + round.denom;
      if (round.num % round.denom === 0) orderTxt = String(whole);
      else if (whole >= 1) orderTxt = whole + " " + rem2 + "/" + round.denom;
      round._orderTxt = orderTxt;

      const f = simplify(round.num, round.denom);
      setOrderLabel(
        "Order: " +
          orderTxt +
          (f.d === round.denom || round.num % round.denom === 0
            ? ""
            : "  (= " + f.n + "/" + f.d + ")"),
      );
      announce(
        "Order " +
          (roundIndex + 1) +
          ". Build " +
          orderTxt +
          ". Add 1 over " +
          round.denom +
          " slices, then serve. Answer: " +
          orderTxt +
          ".",
      );
      if (cfg.hints)
        hud.message(
          "Add 1/" + round.denom + " slices. Make " + orderTxt + ".",
          {
            tone: "info",
            duration: 3000,
          },
        );
    }

    // Combine a/d + b/d' (unlike denominators) on one plate.
    function startCombineRound() {
      builtDenom = lcm(round.a.d, round.b.d);

      const sA = wedgeMesh(round.a.d, PALETTE.slice[1], 1.0, 0.3);
      sA.position.set(3.0, 0.55, -1.9);
      sA.userData.kind = "addA";
      group.add(sA);
      sceneItems.push(sA);
      popIn(sA, 1, 60);

      const sB = wedgeMesh(round.b.d, PALETTE.slice[3], 1.0, 0.3);
      sB.position.set(5.6, 0.55, -1.9);
      sB.userData.kind = "addB";
      group.add(sB);
      sceneItems.push(sB);
      popIn(sB, 1, 120);

      addToolLabel("Add 1/" + round.a.d, 3.0, -1.9);
      addToolLabel("Add 1/" + round.b.d, 5.6, -1.9);

      const sum = simplify(
        round.a.n * round.b.d + round.b.n * round.a.d,
        round.a.d * round.b.d,
      );
      round._sum = sum;
      round._targetUnits = (sum.n * builtDenom) / sum.d;
      round._orderTxt =
        round.a.n + "/" + round.a.d + " + " + round.b.n + "/" + round.b.d;
      setOrderLabel("Order: " + round._orderTxt + " = " + sum.n + "/" + sum.d);
      announce(
        "Order " +
          (roundIndex + 1) +
          ". Add both slice sizes to make " +
          sum.n +
          " over " +
          sum.d +
          ", then serve. Answer: " +
          sum.n +
          " over " +
          sum.d +
          ".",
      );
    }

    // Division portioning: how many 1/unitDenom servings fit in `whole` cups.
    function startDivideRound() {
      round._answer = round.whole * round.unitDenom; // whole ÷ (1/unitDenom)
      scoopCount = 0;

      for (let i = 0; i < round.whole; i++) {
        const bowl = track(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.95, 0.72, 0.8, 28),
            std({ color: PALETTE.bowl, roughness: 0.5, metalness: 0.05 }),
          ),
        );
        bowl.position.set(-5.2 + i * 1.9, 0.6, -2.0);
        bowl.castShadow = true;
        group.add(bowl);
        propMeshes.push(bowl);
        popIn(bowl, 1, 60 + i * 60);
        const bl = makeLabel("1 cup", {
          THREE,
          scale: 0.8,
          fontSize: 52,
          background: "rgba(18,53,91,0.92)",
        });
        bl.position.set(-5.2 + i * 1.9, 1.85, -2.0);
        group.add(bl);
        propMeshes.push(bl);
        ownedTex.add(bl.material.map);
        ownedMat.add(bl.material);
      }

      const scoop = track(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.5, 0.32, 0.45, 22),
          std({
            color: PALETTE.scoop,
            emissive: 0x223344,
            emissiveIntensity: 0.2,
            roughness: 0.35,
            metalness: 0.4,
          }),
        ),
      );
      scoop.position.set(3.4, 0.6, 1.2);
      scoop.castShadow = true;
      scoop.userData.kind = "scoop";
      group.add(scoop);
      sceneItems.push(scoop);
      popIn(scoop, 1, 60);

      const undoGeo = new RoundedBoxGeometry(0.8, 0.5, 0.8, 3, 0.12);
      ownedGeo.add(undoGeo);
      const undo = track(
        new THREE.Mesh(
          undoGeo,
          std({ color: PALETTE.serveBad, roughness: 0.55 }),
        ),
      );
      undo.position.set(5.6, 0.55, 1.2);
      undo.castShadow = true;
      undo.userData.kind = "unscoop";
      group.add(undo);
      sceneItems.push(undo);
      popIn(undo, 1, 120);

      addToolLabel("Scoop 1/" + round.unitDenom, 3.4, 1.2);
      addToolLabel("Put back", 5.6, 1.2);

      setOrderLabel(round.whole + " ÷ 1/" + round.unitDenom + " = ?");
      announce(
        "Order " +
          (roundIndex + 1) +
          ". How many 1 over " +
          round.unitDenom +
          " scoops fill " +
          round.whole +
          " cups? Scoop them all, then serve. Answer: " +
          round._answer +
          ".",
      );
    }

    // ---- Live HUD objective -------------------------------------------------
    function currentFraction() {
      if (round.type === "divide")
        return {
          text: scoopCount + (scoopCount === 1 ? " serving" : " servings"),
        };
      const f = simplify(builtNum, builtDenom);
      return {
        text:
          builtNum +
          "/" +
          builtDenom +
          (f.d !== builtDenom ? " = " + f.n + "/" + f.d : ""),
      };
    }
    function updateLive() {
      if (round.type === "divide") {
        hud.setObjective(
          round.whole +
            " ÷ 1/" +
            round.unitDenom +
            " = " +
            round._answer +
            ". Scoop " +
            round._answer +
            ", then SERVE. Scooped: " +
            scoopCount +
            ".",
        );
      } else if (round.type === "combine") {
        hud.setObjective(
          "Make " +
            round._sum.n +
            "/" +
            round._sum.d +
            ", then SERVE. Plate: " +
            currentFraction().text +
            ".",
        );
      } else {
        hud.setObjective(
          "Make " +
            round._orderTxt +
            ", then SERVE. Plate: " +
            currentFraction().text +
            ".",
        );
      }
      if (clarity)
        clarity.setObjective(
          "Round " +
            (roundIndex + 1) +
            " of " +
            cfg.rounds.length +
            ": match the order, then SERVE.",
        );
    }

    // ---- Add / remove slices ------------------------------------------------
    function addSlice(denomForSlice, colorIdx) {
      const units = builtDenom / denomForSlice;
      builtNum += units;
      const w = wedgeMesh(
        denomForSlice,
        PALETTE.slice[colorIdx % PALETTE.slice.length],
        2.25,
        0.42,
      );
      w.userData.addUnits = units;
      w.position.set(
        plate.position.x,
        plate.position.y + 0.14,
        plate.position.z,
      );
      w.rotation.y = -sliceMeshes.length * ((Math.PI * 2) / denomForSlice);
      group.add(w);
      sliceMeshes.push(w);
      popIn(w, 1, 0);
      feel.sfx("add");
      feel.burst(
        { x: plate.position.x, y: 1.6, z: plate.position.z },
        { color: PALETTE.slice[colorIdx % PALETTE.slice.length], count: 14 },
      );
      announce("Plate now holds " + currentFraction().text + ".");
      updateLive();
    }
    function removeLastSlice() {
      if (!sliceMeshes.length) {
        hud.message("The plate is already empty.", {
          tone: "warn",
          duration: 1400,
        });
        feel.sfx("wrong");
        return;
      }
      const m = sliceMeshes.pop();
      builtNum -= m.userData.addUnits || 0;
      disposeMesh(m);
      feel.sfx("remove");
      updateLive();
      announce(
        "Removed a slice. Plate now holds " + currentFraction().text + ".",
      );
    }

    // ---- Scoop / unscoop (division) ----------------------------------------
    function scoop() {
      if (scoopCount >= round._answer) {
        hud.message("There is no more batter to scoop.", {
          tone: "warn",
          duration: 1500,
        });
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.1);
        return;
      }
      scoopCount += 1;
      const disc = track(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.18, 20),
          std({
            color: PALETTE.slice[(scoopCount - 1) % PALETTE.slice.length],
            roughness: 0.5,
          }),
        ),
      );
      disc.castShadow = true;
      const col = (scoopCount - 1) % 5;
      const row = Math.floor((scoopCount - 1) / 5);
      disc.position.set(-2.4 + col * 0.55, 0.66 + row * 0.22, 1.8);
      group.add(disc);
      sliceMeshes.push(disc);
      popIn(disc, 1, 0);
      feel.sfx("add");
      feel.burst(
        { x: disc.position.x, y: 1.1, z: disc.position.z },
        { color: 0xfff0c0, count: 10 },
      );
      updateLive();
      announce("Scooped serving number " + scoopCount + ".");
    }
    function unscoop() {
      if (!scoopCount) {
        hud.message("No servings to put back.", {
          tone: "warn",
          duration: 1300,
        });
        feel.sfx("wrong");
        return;
      }
      scoopCount -= 1;
      const m = sliceMeshes.pop();
      if (m) disposeMesh(m);
      feel.sfx("remove");
      updateLive();
      announce("Put one serving back. Count is now " + scoopCount + ".");
    }

    // ---- Selection (keyboard) ----------------------------------------------
    function refreshSelection() {
      sceneItems.forEach((it, i) => {
        const on = i === selected;
        if (!reduced) it.scale.setScalar(on ? 1.18 : 1);
        if (it.material && it.material.emissive) {
          it.material.emissiveIntensity = on ? 0.6 : 0.2;
          it.material.emissive.setHex(on ? PALETTE.amber : 0x111522);
        }
      });
    }
    function moveSelection(dir) {
      if (!sceneItems.length) return;
      selected = (selected + dir + sceneItems.length) % sceneItems.length;
      refreshSelection();
      feel.sfx("select");
      announce(
        "Selected " + kindName(sceneItems[selected].userData.kind) + ".",
      );
    }
    function kindName(kind) {
      switch (kind) {
        case "addSlice":
        case "addA":
        case "addB":
          return "add a slice";
        case "removeSlice":
          return "remove a slice";
        case "scoop":
          return "scoop a serving";
        case "unscoop":
          return "put a serving back";
        default:
          return "tool";
      }
    }
    function activateKind(kind) {
      if (solved || busy) return;
      if (round.type === "build") {
        if (kind === "addSlice") addSlice(round.denom, 0);
        else if (kind === "removeSlice") removeLastSlice();
      } else if (round.type === "combine") {
        if (kind === "addA") addSlice(round.a.d, 1);
        else if (kind === "addB") addSlice(round.b.d, 3);
      } else if (round.type === "divide") {
        if (kind === "scoop") scoop();
        else if (kind === "unscoop") unscoop();
      }
    }

    // ---- Serve / check ------------------------------------------------------
    function serve() {
      if (solved || busy || gameOver) return;
      let correct = false;
      let detail = "";
      if (round.type === "build") {
        correct = builtNum === round.num;
        detail = round._orderTxt;
      } else if (round.type === "combine") {
        correct = builtNum === round._targetUnits;
        detail = round._sum.n + "/" + round._sum.d;
      } else if (round.type === "divide") {
        correct = scoopCount === round._answer;
        detail = round._answer + " servings";
      }

      if (!correct) {
        streak = 0;
        hud.setStreak(0);
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.18);
        serveBtn.material.emissive.setHex(PALETTE.serveBad);
        later(() => serveBtn.material.emissive.setHex(PALETTE.serve), 480);
        lives = Math.max(0, lives - 1);
        if (typeof hud.setLives === "function") hud.setLives(lives);
        if (lives <= 0) {
          loseGame();
          return;
        }
        const base =
          round.type === "divide"
            ? "Not yet. Keep scooping to share it out evenly."
            : "Not yet. The plate does not match the order.";
        const msg = `${base} ${lives} ${lives === 1 ? "try" : "tries"} left.`;
        hud.message(msg, { tone: "warn", duration: 2200 });
        announce(msg);
        return;
      }

      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      hud.setStreak(streak);
      const pts = 20 + (level === 2 ? 10 : 0) + (streak >= 3 ? 5 : 0);
      onScore(pts, { round: roundIndex + 1, kind: round.type, answer: detail });
      feel.sfx("correct");
      if (!reduced) feel.shake(0.28);
      feel.burst(
        { x: plate.position.x, y: 1.8, z: plate.position.z },
        { color: PALETTE.amber, count: 40, spread: 4.5 },
      );
      hud.feedback(true, "Order served! " + detail + "  +" + pts);
      announce(
        "Correct! The order was " + detail + ". You earned " + pts + " points.",
      );

      busy = true;
      later(() => {
        busy = false;
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          finish();
        }
      }, 2400);
    }

    function loseGame() {
      gameOver = true;
      busy = true;
      feel.sfx("wrong");
      const msg = `Kitchen closed! You filled ${solvedCount} of ${cfg.rounds.length} orders.`;
      hud.setObjective(msg);
      announce(`Out of tries. ${msg} Press Play Again to retry.`);
      if (clarity) {
        if (clarity.setTarget) clarity.setTarget(null);
        clarity.lose({
          titleEn: "Kitchen closed!",
          badge: "🍰",
          stats: `${msg} Tip: count the unit fractions on the plate and match the order exactly.`,
        });
      }
    }

    function finish() {
      hud.setProgress(cfg.rounds.length, cfg.rounds.length);
      hud.setObjective(
        "Bakery closed — you filled " +
          solvedCount +
          " of " +
          cfg.rounds.length +
          " orders. Best streak " +
          bestStreak +
          ". Great work!",
      );
      hud.message("All orders complete! 🎉", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        for (let i = 0; i < 5; i++)
          later(
            () =>
              feel.burst(
                { x: -3 + Math.random() * 6, y: 4, z: 0 },
                {
                  color: PALETTE.slice[i % PALETTE.slice.length],
                  count: 30,
                  spread: 5,
                },
              ),
            i * 160,
          );
      }
      announce(
        "All orders complete. You filled " +
          solvedCount +
          " orders with a best streak of " +
          bestStreak +
          ". Wonderful work at the Fraction Kitchen.",
      );

      if (clarity) {
        clarity.setTarget(null);
        clarity.win({
          titleEn: "Bakery closed!",
          badge: "🧁",
          stats:
            "You filled " +
            solvedCount +
            " of " +
            cfg.rounds.length +
            " orders. Best streak: " +
            bestStreak +
            ". Score saved.",
        });
      }
    }

    // ---- Drag-to-build: physically carry a slice/scoop onto the plate -------
    // Genuine 3D manipulation (like unit-5/unit-10): the student grabs a tool
    // from the tray and *drags* it onto the glowing drop zone over the plate to
    // commit. Tapping a tool still works as a fallback (it auto-flies in), so
    // keyboard players and quick taps are unaffected.
    //
    // A wide invisible ground plane lets us raycast the pointer to a world point
    // every frame while a piece is held. The held mesh follows the pointer; on
    // release, if it is over the plate drop zone we run the same add/scoop math.
    const dragPlane = track(
      new THREE.Mesh(
        new THREE.PlaneGeometry(60, 60),
        new THREE.MeshBasicMaterial({ visible: false }),
      ),
    );
    dragPlane.rotation.x = -Math.PI / 2;
    dragPlane.position.y = 0.62;
    group.add(dragPlane);

    // Glowing target ring on the plate that lights up while dragging a valid
    // piece — the "build-to-target" affordance.
    const dropZone = track(
      new THREE.Mesh(
        new THREE.RingGeometry(1.7, 2.9, 40),
        new THREE.MeshBasicMaterial({
          color: PALETTE.serve,
          transparent: true,
          opacity: 0.0,
          side: THREE.DoubleSide,
        }),
      ),
    );
    dropZone.rotation.x = -Math.PI / 2;
    dropZone.position.set(
      plate.position.x,
      plate.position.y + 0.18,
      plate.position.z,
    );
    group.add(dropZone);
    const DROP_RADIUS = 2.9; // world distance from plate center that counts as "on the plate"

    const drag = { active: false, item: null, home: null, pointerDown: false };

    function planePoint() {
      const hits = input.raycast(camera, [dragPlane], false);
      return hits.length ? hits[0].point : null;
    }
    function overPlate(p) {
      if (!p) return false;
      const dx = p.x - plate.position.x;
      const dz = p.z - plate.position.z;
      return Math.hypot(dx, dz) <= DROP_RADIUS;
    }

    function beginDrag(item) {
      if (solved || busy || gameOver) return;
      drag.active = true;
      drag.item = item;
      drag.home = item.position.clone();
      item.userData.dragging = true;
      if (!reduced) item.scale.setScalar(1.18);
      feel.sfx("select");
      announce(
        "Picked up " +
          kindName(item.userData.kind) +
          ". Drag it onto the plate.",
      );
    }

    function updateDrag() {
      if (!drag.active || !drag.item) return;
      const p = planePoint();
      if (p) {
        drag.item.position.set(p.x, drag.home.y + 0.5, p.z);
        const on = overPlate(p);
        dropZone.material.opacity = on ? 0.5 : 0.16;
        if (drag.item.material && drag.item.material.emissive) {
          drag.item.material.emissiveIntensity = on ? 0.7 : 0.25;
          drag.item.material.emissive.setHex(on ? PALETTE.serve : 0x111522);
        }
      }
    }

    function endDrag() {
      if (!drag.active || !drag.item) {
        dropZone.material.opacity = 0;
        return;
      }
      const item = drag.item;
      const p = planePoint();
      const dropped = overPlate(p);
      // Return the tool to its tray home regardless; the math spawns its own
      // mesh on the plate (matching the existing tap flow).
      item.position.copy(drag.home);
      item.userData.dragging = false;
      if (!reduced) item.scale.setScalar(1);
      dropZone.material.opacity = 0;
      drag.active = false;
      drag.item = null;
      drag.home = null;
      refreshSelection();
      if (dropped) {
        activateKind(item.userData.kind);
      } else {
        feel.sfx("remove");
      }
    }

    // ---- Pointer picking (tap = quick-use; press-drag = carry to plate) -----
    function pointerPick() {
      if (busy) return;
      drag.pointerDown = true;
      const hits = input.raycast(camera, [...sceneItems, serveBtn], true);
      if (!hits.length) return;
      let obj = hits[0].object;
      while (obj && !obj.userData.kind && obj !== serveBtn && obj.parent)
        obj = obj.parent;
      if (obj === serveBtn) {
        serve();
        return;
      }
      if (obj && obj.userData.kind) {
        const idx = sceneItems.indexOf(obj);
        if (idx >= 0) {
          selected = idx;
          refreshSelection();
        }
        // "Add"/"Scoop" tools are draggable onto the plate. Remove/put-back are
        // instant taps (no target to drag to).
        const k = obj.userData.kind;
        if (k === "removeSlice" || k === "unscoop") {
          activateKind(k);
        } else {
          beginDrag(obj);
        }
      }
    }

    return {
      start() {
        // Animated camera intro: glide from a wide angle into framing.
        const target = new THREE.Vector3(0, 6.5, 12);
        if (reduced) {
          camera.position.copy(target);
          camera.lookAt(0, 0.6, -0.4);
          feel.syncCamera();
        } else {
          busy = true;
          camera.position.set(-8, 11, 15);
          camera.lookAt(0, 0.6, -0.4);
          const from = camera.position.clone();
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.1,
            onUpdate: (v) => {
              camera.position.lerpVectors(from, target, v);
              camera.lookAt(0, 0.6, -0.4);
            },
            onComplete: () => {
              feel.syncCamera();
              busy = false;
            },
          });
        }

        caption("Match the gold order, then tap green SERVE.");

        // Begin the actual round loop + input binding only after the student
        // presses Start in the clarity overlay. This is the single entry point
        // both for first play and for Play Again.
        function beginGameplay() {
          roundIndex = 0;
          solvedCount = 0;
          lives = START_LIVES;
          gameOver = false;
          if (typeof hud.setLives === "function") hud.setLives(lives);
          startRound();

          unbinders.push(
            input.onPress((name) => {
              if (busy) return;
              if (name === "left") moveSelection(-1);
              else if (name === "right") moveSelection(1);
              else if (name === "up") moveSelection(-1);
              else if (name === "down") moveSelection(1);
              else if (name === "action") {
                const it = sceneItems[selected];
                if (it) activateKind(it.userData.kind);
              } else if (name === "confirm") serve();
            }),
          );
          unbinders.push(input.onTap(pointerPick));

          // Pointer-up ends a drag (commit if over the plate, else snap back).
          // input.js fires pointerup on window but exposes no callback, so we
          // attach our own tracked listener.
          const onUp = () => {
            drag.pointerDown = false;
            if (drag.active) endDrag();
          };
          window.addEventListener("pointerup", onUp);
          unbinders.push(() => window.removeEventListener("pointerup", onUp));

          // Drive the held piece every frame so it follows the pointer.
          unbinders.push(
            onFrame(() => {
              if (drag.active) updateDrag();
            }),
          );
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen. Drives nothing in the 3D scene.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Fraction Kitchen — Fill the Orders",
          objectiveEn:
            "Read each bakery order, build or scoop the exact fraction on the plate, then Serve to fill it.",
          objectiveEs:
            "Lee cada orden, arma o sirve la fracción exacta en el plato y pulsa Servir.",
          standard: "6.NS.A.1 · Dividing Fractions & Mixed Numbers",
          controls: [
            {
              key: "Drag / Click",
              actionEn:
                "Drag a slice or scoop from the tray onto the glowing plate to add it (or just tap it). Remove / Put-back are instant taps. Tap green SERVE to check",
              actionEs:
                "Arrastra una porción o cucharada del estante al plato brillante (o tócala). Toca SERVE para revisar",
            },
            {
              key: "← / → (or ↑ / ↓)",
              actionEn: "Move the highlight to the next tool",
              actionEs: "Mueve el resaltado a la siguiente herramienta",
            },
            {
              key: "Space",
              actionEn:
                "Use the highlighted tool — add or remove a slice, or scoop a serving",
              actionEs:
                "Usa la herramienta resaltada — agrega/quita una porción o sirve",
            },
            {
              key: "Enter",
              actionEn: "SERVE — check if the plate matches the order",
              actionEs: "SERVE — revisa si el plato coincide con la orden",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Make the gold order exactly — drag slices onto the plate to build the fraction, or drag scoops to portion the servings — then Serve. Fill every order to win.",
          howToWinEs:
            "Haz la orden dorada exacta y sirve. Completa todas las órdenes para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        // Idle motion: gentle serve-button pulse + slow oven-glow shimmer.
        if (!reduced) {
          unbinders.push(
            onFrame((dt, t) => {
              const s = 1 + Math.sin(t * 3) * 0.05;
              serveBtn.scale.set(s, 1, s);
              ovenGlow.material.emissiveIntensity = 1.4 + Math.sin(t * 2) * 0.4;
              serveBtn.material.emissiveIntensity =
                0.45 + Math.sin(t * 4) * 0.12;
            }),
          );
        }
      },

      dispose() {
        if (clarity) clarity.dispose();
        unbinders.forEach((u) => u && u());
        unbinders.length = 0;
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearArray(sliceMeshes);
        clearArray(propMeshes);
        clearArray(sceneItems);
        scene.remove(group);
        ownedGeo.forEach((g) => g.dispose && g.dispose());
        ownedTex.forEach((tx) => tx.dispose && tx.dispose());
        ownedMat.forEach((m) => m.dispose && m.dispose());
        ownedGeo.clear();
        ownedTex.clear();
        ownedMat.clear();
      },
    };
  },
};
