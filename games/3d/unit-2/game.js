const COLORS = {
  counter: 0x6b4a2f,
  counterTop: 0x9c7b53,
  plate: 0xeae4d6,
  scoop: 0xeae4d6,
  target: 0xf2c15b,
  slice: [0xe0673a, 0xead24a, 0x7fb24a, 0x4f8fd0, 0x9b6bd0, 0xd95d8c],
  serve: 0x1fa6a2,
  serveBad: 0xb64e2f,
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function simplify(n, d) {
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function makeLevel(level) {
  if (level === 1) {
    // Support: build a fraction of one baked good using equal slices.
    // Like denominators only; visual pie; hints on.
    return {
      hints: true,
      rounds: [
        { type: "build", denom: 2, num: 1, good: "pie" },
        { type: "build", denom: 4, num: 3, good: "cake" },
        { type: "build", denom: 3, num: 2, good: "pie" },
        { type: "build", denom: 6, num: 4, good: "cake" },
      ],
    };
  }
  // Enrichment: division portioning + combine unlike denominators / mixed.
  return {
    hints: false,
    rounds: [
      // "How many 1/4-cup servings in 3 cups?"  -> scoop count
      { type: "divide", whole: 3, unitDenom: 4 },
      // mixed-number build: 1 1/2 pies -> 3 halves
      { type: "build", denom: 2, num: 3, good: "pie" },
      // division of fractions: how many 1/3 in 2 cups
      { type: "divide", whole: 2, unitDenom: 3 },
      // unlike-denominator combine: 1/2 + 1/4 = 3/4
      { type: "combine", a: { n: 1, d: 2 }, b: { n: 1, d: 4 }, good: "cake" },
    ],
  };
}

export default {
  id: "unit-2-bakery",
  vocab: [
    {
      term: "Numerator",
      definition:
        "The top number of a fraction. It counts how many parts you have.",
      emoji: "🔢",
    },
    {
      term: "Denominator",
      definition:
        "The bottom number of a fraction. It tells how many equal parts make one whole.",
      emoji: "🥧",
    },
    {
      term: "Equivalent fraction",
      definition: "A fraction that names the same amount, like 1/2 and 2/4.",
      emoji: "⚖️",
    },
    {
      term: "Mixed number",
      definition: "A whole number with a fraction, like 1 and 1/2.",
      emoji: "🍰",
    },
    {
      term: "Reciprocal",
      definition:
        "Flip a fraction over. The reciprocal of 1/4 is 4. We use it to divide.",
      emoji: "🔁",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      input,
      hud,
      feel,
      announce,
      caption,
      THREE,
      level,
      onScore,
    } = ctx;

    const cfg = makeLevel(level);

    const group = new THREE.Group();
    scene.add(group);

    // ---- Static bakery counter ----
    const counter = new THREE.Mesh(
      new THREE.BoxGeometry(14, 1.2, 7),
      new THREE.MeshStandardMaterial({ color: COLORS.counter, roughness: 0.9 }),
    );
    counter.position.set(0, -0.6, 0);
    group.add(counter);

    const counterTop = new THREE.Mesh(
      new THREE.BoxGeometry(14, 0.3, 7),
      new THREE.MeshStandardMaterial({
        color: COLORS.counterTop,
        roughness: 0.8,
      }),
    );
    counterTop.position.set(0, 0.15, 0);
    group.add(counterTop);

    // Serving plate (where the player builds the order)
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(2.6, 2.4, 0.18, 36),
      new THREE.MeshStandardMaterial({ color: COLORS.plate, roughness: 0.5 }),
    );
    plate.position.set(-2.5, 0.4, 0.5);
    group.add(plate);

    // Serve button (3D, tappable + keyboard)
    const serveBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.5, 24),
      new THREE.MeshStandardMaterial({
        color: COLORS.serve,
        emissive: COLORS.serve,
        emissiveIntensity: 0.25,
        roughness: 0.4,
      }),
    );
    serveBtn.position.set(4.8, 0.5, 2.2);
    group.add(serveBtn);

    // ---- Round state ----
    let roundIndex = 0;
    let round = null;
    let solved = false;
    const sliceMeshes = []; // built slices on the plate
    const previewMeshes = []; // target preview (ghost outline)
    const sceneItems = []; // selectable source items (pies/scoops)
    let selected = 0; // index into sceneItems
    let builtNum = 0; // numerator of what's on the plate (in current denom)
    let builtDenom = 1;
    let scoopCount = 0; // for divide rounds
    let streak = 0; // consecutive correct serves
    let bestStreak = 0;
    let solvedCount = 0;
    let unbindFrame = null;
    let unbindPress = null;
    let unbindTap = null;
    const timers = [];
    const disposables = [];

    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    // ---- Helpers to build slice wedges ----
    function wedgeMesh(denom, color, radius, height) {
      const ang = (Math.PI * 2) / denom;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.absarc(0, 0, radius, 0, ang, false);
      shape.lineTo(0, 0);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: height,
        bevelEnabled: false,
      });
      geo.rotateX(-Math.PI / 2);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.04,
      });
      disposables.push(geo);
      return new THREE.Mesh(geo, mat);
    }

    function clearArray(arr) {
      arr.forEach((m) => {
        group.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (m.material.map) m.material.map.dispose();
          m.material.dispose();
        }
      });
      arr.length = 0;
    }

    // ---- 2D text labels as sprites ----
    function makeLabel(text, w = 220, h = 90, font = "bold 40px") {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const c = cv.getContext("2d");
      c.fillStyle = "rgba(18,53,91,0.92)";
      roundRect(c, 4, 4, w - 8, h - 8, 16);
      c.fill();
      c.fillStyle = "#ffffff";
      c.font = font + " system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, w / 2, h / 2);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.scale.set((w / h) * 1.1, 1.1, 1);
      return spr;
    }
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }

    let orderLabel = null;
    function setOrderLabel(text) {
      if (orderLabel) {
        group.remove(orderLabel);
        orderLabel.material.map.dispose();
        orderLabel.material.dispose();
      }
      orderLabel = makeLabel(text, 300, 96, "bold 30px");
      orderLabel.position.set(0, 4.2, -1.5);
      orderLabel.scale.set(4.6, 1.5, 1);
      group.add(orderLabel);
    }

    // ---- Round lifecycle ----
    function clearRound() {
      clearArray(sliceMeshes);
      clearArray(previewMeshes);
      clearArray(sceneItems);
      builtNum = 0;
      scoopCount = 0;
      selected = 0;
      solved = false;
    }

    function startRound() {
      clearRound();
      round = cfg.rounds[roundIndex];

      // Persistent "Step X of Y" for the whole round (both levels have 4 rounds).
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);

      if (round.type === "build") {
        startBuildRound();
      } else if (round.type === "combine") {
        startCombineRound();
      } else if (round.type === "divide") {
        startDivideRound();
      }
      updateLive();
      refreshSelection();
    }

    // Build N/D of a good using equal 1/D slices.
    function startBuildRound() {
      builtDenom = round.denom;
      // Source: a tray of single 1/denom slices the player taps to add.
      // Place a row of selectable slice "stamps".
      const stamp = wedgeMesh(round.denom, COLORS.slice[0], 1.0, 0.3);
      stamp.position.set(3.2, 0.45, -1.8);
      stamp.userData.kind = "addSlice";
      group.add(stamp);
      sceneItems.push(stamp);

      const removeStamp = wedgeMesh(round.denom, COLORS.serveBad, 1.0, 0.3);
      removeStamp.position.set(5.4, 0.45, -1.8);
      removeStamp.rotation.y = Math.PI;
      removeStamp.userData.kind = "removeSlice";
      group.add(removeStamp);
      sceneItems.push(removeStamp);

      const addL = makeLabel("Add 1/" + round.denom, 240, 80, "bold 30px");
      addL.position.set(3.2, 2.0, -1.8);
      addL.scale.set(2.6, 0.9, 1);
      group.add(addL);
      previewMeshes.push(addL);
      const remL = makeLabel("Remove", 200, 80, "bold 30px");
      remL.position.set(5.4, 2.0, -1.8);
      remL.scale.set(2.2, 0.9, 1);
      group.add(remL);
      previewMeshes.push(remL);

      const f = simplify(round.num, round.denom);
      const whole = Math.floor(round.num / round.denom);
      let orderTxt = round.num + "/" + round.denom;
      if (whole >= 1 && round.num % round.denom !== 0) {
        orderTxt =
          whole + " " + (round.num - whole * round.denom) + "/" + round.denom;
      } else if (round.num % round.denom === 0) {
        orderTxt = String(whole);
      }
      round._orderTxt = orderTxt;
      setOrderLabel(
        "Order: " +
          orderTxt +
          (f.d === round.denom ? "" : " (= " + f.n + "/" + f.d + ")"),
      );
      announce(
        "Build the order: " +
          round.num +
          " " +
          (round.num === 1 ? "piece" : "pieces") +
          " of one " +
          round.good +
          " cut into " +
          round.denom +
          " equal slices. Tap Add to put a slice on the plate.",
      );
      if (cfg.hints) {
        hud.message(
          "Add 1/" + round.denom + " slices until the plate matches the order.",
          {
            tone: "info",
            duration: 2800,
          },
        );
      }
    }

    // Combine a/d + b/d' (unlike denominators) into one plate.
    function startCombineRound() {
      builtDenom = round.a.d * round.b.d; // common scratch denom
      const lcd = (round.a.d * round.b.d) / gcd(round.a.d, round.b.d);
      builtDenom = lcd;

      const sA = wedgeMesh(round.a.d, COLORS.slice[1], 1.0, 0.3);
      sA.position.set(3.0, 0.45, -1.8);
      sA.userData.kind = "addA";
      group.add(sA);
      sceneItems.push(sA);

      const sB = wedgeMesh(round.b.d, COLORS.slice[3], 1.0, 0.3);
      sB.position.set(5.6, 0.45, -1.8);
      sB.userData.kind = "addB";
      group.add(sB);
      sceneItems.push(sB);

      const la = makeLabel("Add 1/" + round.a.d, 220, 80, "bold 30px");
      la.position.set(3.0, 2.0, -1.8);
      la.scale.set(2.4, 0.9, 1);
      group.add(la);
      previewMeshes.push(la);
      const lb = makeLabel("Add 1/" + round.b.d, 220, 80, "bold 30px");
      lb.position.set(5.6, 2.0, -1.8);
      lb.scale.set(2.4, 0.9, 1);
      group.add(lb);
      previewMeshes.push(lb);

      const sum = simplify(
        round.a.n * round.b.d + round.b.n * round.a.d,
        round.a.d * round.b.d,
      );
      round._sum = sum;
      round._orderTxt =
        round.a.n + "/" + round.a.d + " + " + round.b.n + "/" + round.b.d;
      setOrderLabel(
        "Order: " +
          round.a.n +
          "/" +
          round.a.d +
          " + " +
          round.b.n +
          "/" +
          round.b.d +
          " = " +
          sum.n +
          "/" +
          sum.d,
      );
      announce(
        "Make " +
          round.a.n +
          " over " +
          round.a.d +
          " plus " +
          round.b.n +
          " over " +
          round.b.d +
          ". Add slices of each size, then serve when they equal " +
          sum.n +
          " over " +
          sum.d +
          ".",
      );
    }

    // Division portioning: how many 1/unitDenom servings in `whole` cups.
    function startDivideRound() {
      const answer = round.whole * round.unitDenom;
      round._answer = answer;
      scoopCount = 0;

      // Show `whole` bowls (cups) to portion from.
      for (let i = 0; i < round.whole; i++) {
        const bowl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.9, 0.7, 0.7, 24),
          new THREE.MeshStandardMaterial({
            color: COLORS.slice[2],
            roughness: 0.6,
          }),
        );
        bowl.position.set(-4.5 + i * 2.2, 0.55, -1.8);
        group.add(bowl);
        previewMeshes.push(bowl);
        const bl = makeLabel("1 cup", 160, 70, "bold 32px");
        bl.position.set(-4.5 + i * 2.2, 1.9, -1.8);
        bl.scale.set(1.6, 0.7, 1);
        group.add(bl);
        previewMeshes.push(bl);
      }

      // Scoop tool (selectable): tap to scoop one 1/unitDenom serving.
      const scoop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.3, 0.4, 20),
        new THREE.MeshStandardMaterial({ color: COLORS.scoop, roughness: 0.5 }),
      );
      scoop.position.set(3.6, 0.5, 1.0);
      scoop.userData.kind = "scoop";
      group.add(scoop);
      sceneItems.push(scoop);

      const undo = new THREE.Mesh(
        new THREE.BoxGeometry(0.7, 0.4, 0.7),
        new THREE.MeshStandardMaterial({
          color: COLORS.serveBad,
          roughness: 0.6,
        }),
      );
      undo.position.set(5.4, 0.45, 1.0);
      undo.userData.kind = "unscoop";
      group.add(undo);
      sceneItems.push(undo);

      const sl = makeLabel("Scoop 1/" + round.unitDenom, 260, 80, "bold 30px");
      sl.position.set(3.6, 2.0, 1.0);
      sl.scale.set(2.8, 0.9, 1);
      group.add(sl);
      previewMeshes.push(sl);

      setOrderLabel(
        "How many 1/" +
          round.unitDenom +
          "-cup servings in " +
          round.whole +
          " cups?",
      );
      announce(
        "Question: how many one-over-" +
          round.unitDenom +
          " cup servings fit in " +
          round.whole +
          " cups? Scoop one serving at a time, then serve your count.",
      );
    }

    // ---- Live HUD readout ----
    function currentFraction() {
      if (round.type === "divide") {
        return { text: scoopCount + " servings", value: scoopCount };
      }
      const f = simplify(builtNum, builtDenom);
      return {
        text:
          builtNum +
          "/" +
          builtDenom +
          (f.d !== builtDenom ? " = " + f.n + "/" + f.d : ""),
        frac: f,
      };
    }

    function updateLive() {
      if (round.type === "divide") {
        hud.setObjective(
          "Scoop 1/" +
            round.unitDenom +
            "-cup servings to fill " +
            round.whole +
            " cups, then serve. Scooped so far: " +
            scoopCount +
            ".",
        );
      } else if (round.type === "combine") {
        const cf = currentFraction();
        hud.setObjective(
          "Add slices to make " +
            round._orderTxt +
            " = " +
            round._sum.n +
            "/" +
            round._sum.d +
            ", then serve. On the plate: " +
            cf.text +
            ".",
        );
      } else {
        const cf = currentFraction();
        hud.setObjective(
          "Add 1/" +
            round.denom +
            " slices to make " +
            round._orderTxt +
            ", then serve. On the plate: " +
            cf.text +
            ".",
        );
      }
    }

    // ---- Add slices visual layout (radial around plate) ----
    function relayoutSlices() {
      const ang = (Math.PI * 2) / builtDenom;
      sliceMeshes.forEach((m, i) => {
        m.rotation.y = -i * ang;
        m.position.set(
          plate.position.x,
          plate.position.y + 0.12,
          plate.position.z,
        );
      });
    }

    function addSlice(denomForSlice, colorIdx) {
      // Convert this 1/denomForSlice into current common denom units.
      const add = builtDenom / denomForSlice;
      builtNum += add;
      const w = wedgeMesh(
        denomForSlice,
        COLORS.slice[colorIdx % COLORS.slice.length],
        2.2,
        0.4,
      );
      w.position.set(
        plate.position.x,
        plate.position.y + 0.12,
        plate.position.z,
      );
      w.rotation.y = -sliceMeshes.length * ((Math.PI * 2) / denomForSlice);
      group.add(w);
      sliceMeshes.push(w);
      feel.burst(
        { x: plate.position.x, y: 1.4, z: plate.position.z },
        { color: COLORS.slice[colorIdx % COLORS.slice.length], count: 12 },
      );
      const cf = currentFraction();
      announce("Plate now holds " + cf.text + ".");
      updateLive();
    }

    function removeSlice() {
      if (!sliceMeshes.length) {
        hud.message("The plate is already empty.", {
          tone: "warn",
          duration: 1500,
        });
        return;
      }
      const m = sliceMeshes.pop();
      // recompute builtNum from remaining slices is complex; instead store per-slice add.
      builtNum -= m.userData.addUnits || 0;
      group.remove(m);
      if (m.geometry) m.geometry.dispose();
      if (m.material) m.material.dispose();
      updateLive();
      announce(
        "Removed a slice. Plate now holds " + currentFraction().text + ".",
      );
    }

    function scoop() {
      if (scoopCount >= round._answer) {
        hud.message("There is no more batter to scoop.", {
          tone: "warn",
          duration: 1600,
        });
        feel.shake(0.1);
        return;
      }
      scoopCount += 1;
      // Visual: stack scooped servings as small discs.
      const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.4, 0.16, 18),
        new THREE.MeshStandardMaterial({
          color: COLORS.slice[(scoopCount - 1) % COLORS.slice.length],
          roughness: 0.5,
        }),
      );
      const col = (scoopCount - 1) % 5;
      const rowi = Math.floor((scoopCount - 1) / 5);
      disc.position.set(-2.5 + col * 0.55, 0.5 + rowi * 0.2, 1.6);
      group.add(disc);
      sliceMeshes.push(disc);
      feel.burst(
        { x: disc.position.x, y: 1.0, z: disc.position.z },
        { color: 0xfff0c0, count: 8 },
      );
      updateLive();
      announce("Scooped serving number " + scoopCount + ".");
    }

    function unscoop() {
      if (!scoopCount) {
        hud.message("No servings to put back.", {
          tone: "warn",
          duration: 1400,
        });
        return;
      }
      scoopCount -= 1;
      const m = sliceMeshes.pop();
      if (m) {
        group.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      }
      updateLive();
      announce("Put one serving back. Count is now " + scoopCount + ".");
    }

    // ---- Selection (keyboard) ----
    function refreshSelection() {
      sceneItems.forEach((it, i) => {
        const on = i === selected;
        it.scale.setScalar(on ? 1.18 : 1);
        if (it.material && it.material.emissive) {
          it.material.emissiveIntensity = on ? 0.4 : 0;
          it.material.emissive.setHex(on ? COLORS.target : 0x000000);
        }
      });
    }

    function moveSelection(dir) {
      if (!sceneItems.length) return;
      selected = (selected + dir + sceneItems.length) % sceneItems.length;
      refreshSelection();
      const kind = sceneItems[selected].userData.kind;
      announce("Selected " + kindName(kind) + ".");
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
      if (solved) return;
      if (round.type === "build") {
        if (kind === "addSlice") addSliceForBuild();
        else if (kind === "removeSlice") removeSlice();
      } else if (round.type === "combine") {
        if (kind === "addA") {
          addSlice(round.a.d, 1);
          markUnits(builtDenom / round.a.d);
        } else if (kind === "addB") {
          addSlice(round.b.d, 3);
          markUnits(builtDenom / round.b.d);
        }
      } else if (round.type === "divide") {
        if (kind === "scoop") scoop();
        else if (kind === "unscoop") unscoop();
      }
    }

    function addSliceForBuild() {
      addSlice(round.denom, 0);
      markUnits(builtDenom / round.denom);
    }

    // Tag the just-added slice with how many common-denom units it added,
    // so removeSlice can subtract correctly.
    function markUnits(units) {
      const m = sliceMeshes[sliceMeshes.length - 1];
      if (m) m.userData.addUnits = units;
    }

    // ---- Serve / check ----
    function serve() {
      if (solved) return;
      let correct = false;
      let detail = "";

      if (round.type === "build") {
        correct = builtNum === round.num;
        detail = round.num + "/" + round.denom;
      } else if (round.type === "combine") {
        const got = simplify(builtNum, builtDenom);
        correct = got.n === round._sum.n && got.d === round._sum.d;
        detail = round._sum.n + "/" + round._sum.d;
      } else if (round.type === "divide") {
        correct = scoopCount === round._answer;
        detail = round._answer + " servings";
      }

      if (!correct) {
        const msg =
          round.type === "divide"
            ? "Not yet. Count the 1/" +
              round.unitDenom +
              " servings in " +
              round.whole +
              " whole cups."
            : "Not quite — the plate does not match the order yet.";
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
        if (typeof hud.feedback === "function") hud.feedback(false, msg);
        else hud.message(msg, { tone: "warn", duration: 2200 });
        feel.shake(0.18);
        announce(msg);
        // pulse serve button red
        serveBtn.material.color.setHex(COLORS.serveBad);
        later(() => serveBtn.material.color.setHex(COLORS.serve), 500);
        return;
      }

      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);
      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const pts = base + levelBonus;
      onScore(pts, { round: roundIndex + 1, kind: round.type, answer: detail });
      feel.shake(0.3);
      feel.burst(
        { x: plate.position.x, y: 1.6, z: plate.position.z },
        { color: COLORS.target, count: 36, spread: 4 },
      );
      if (typeof hud.feedback === "function")
        hud.feedback(true, "Order served! " + detail + ". +" + pts);
      else
        hud.message("Order served! " + detail + ". +" + pts, {
          tone: "ok",
          duration: 2400,
        });
      announce(
        "Correct! The order was " + detail + ". You earned " + pts + " points.",
      );

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          hud.setObjective(
            "Bakery closed — you filled " +
              solvedCount +
              " of " +
              cfg.rounds.length +
              " orders, best streak " +
              bestStreak +
              ". Great work!",
          );
          hud.message("All orders complete!", { tone: "ok", duration: 0 });
          announce(
            "All orders complete. You filled " +
              solvedCount +
              " orders with a best streak of " +
              bestStreak +
              ". Wonderful work at the bakery.",
          );
        }
      }, 2600);
    }

    function pointerPick() {
      const hits = input.raycast(camera, [...sceneItems, serveBtn], true);
      if (!hits.length) return;
      let obj = hits[0].object;
      // climb to a known item
      while (obj && !obj.userData.kind && obj !== serveBtn && obj.parent) {
        obj = obj.parent;
      }
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
        activateKind(obj.userData.kind);
      }
    }

    return {
      start() {
        camera.position.set(0, 8, 11);
        camera.lookAt(0, 0, -0.5);
        feel.syncCamera();

        startRound();

        unbindPress = input.onPress((name) => {
          if (solved) return;
          if (name === "left") moveSelection(-1);
          else if (name === "right") moveSelection(1);
          else if (name === "up" || name === "down")
            moveSelection(name === "up" ? -1 : 1);
          else if (name === "action") {
            const it = sceneItems[selected];
            if (it) activateKind(it.userData.kind);
          } else if (name === "confirm") serve();
        });

        unbindTap = input.onTap(() => {
          pointerPick();
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            const s = 1 + Math.sin(t * 3) * 0.05;
            serveBtn.scale.set(s, 1, s);
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        disposables.forEach((g) => g.dispose && g.dispose());
      },
    };
  },
};
