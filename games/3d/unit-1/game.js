import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ============================================================================
// Unit 1 — SMOOTHIE RUSH  ·  Ratios & Unit Rates (6.RP.A.1–3)
// REAL-TIME ORDER-FILLING ACTION GAME on the engine3d/ runtime.
//
// Customers ride a conveyor belt toward the stand. Each customer carries an
// order card: either a part-to-part RATIO recipe ("2 red : 3 yellow") or a
// UNIT-RATE question ("$6 for 3 — price each?"). The player builds the answer
// in REAL TIME against a per-order countdown bar:
//   • RATIO orders  — tap 🍓 / 🍌 (← / →, d-pad) to load red & yellow scoops
//     into the blender until the cup matches the recipe ratio, then SERVE.
//   • RATE  orders  — tap ← / → to dial the price/answer up & down, then SERVE.
// Serve before the bar empties → points + combo + a juicy pop. A wrong serve or
// a timeout costs a life and resets the combo. Clear the whole shift → win.
// The belt always moves, the pace ramps up, and the math IS the gameplay: the
// player must actually compute the equivalent ratio / unit rate to serve right.
//
// Math (recipes + unit-rate answers) is reused verbatim from the original
// Smoothie Stand so the curriculum stays exact. Equivalent ratios are checked
// by simplifying; unit rate = total ÷ count (verified in comments below).
// ============================================================================

const COLORS = {
  base: 0x123a6b,
  belt: 0x14233f,
  beltEmissive: 0x1d3a66,
  rail: 0x2f6aa0,
  blender: 0x2f6aa0,
  blenderGlass: 0xbfe2ff,
  strawberry: 0xe0556b,
  banana: 0xf2c15b,
  teal: 0x1fa6a2,
  amber: 0xf2c15b,
  spark: 0xffd56b,
  ok: 0x4aa978,
  bad: 0xb64e2f,
  wood: 0x6b4a2f,
};

const FRUIT = {
  strawberry: { name: "strawberry", color: COLORS.strawberry, emoji: "🍓" },
  banana: { name: "banana", color: COLORS.banana, emoji: "🍌" },
};

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function simplify(a, b) {
  const g = gcd(a, b);
  return [a / g, b / g];
}

// ---------------------------------------------------------------------------
// Order sets per level (reused verbatim from the original).
//   Level 1 (support): hints on, smaller numbers, simple part-to-part ratios.
//   Level 2 (enrichment): larger / multi-step ratios + unit-rate questions.
// Each entry becomes one customer order on the belt.
// ---------------------------------------------------------------------------
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      orders: [
        { kind: "ratio", a: 1, b: 1 },
        { kind: "ratio", a: 2, b: 1 },
        { kind: "ratio", a: 1, b: 2 },
        { kind: "ratio", a: 2, b: 3 },
        { kind: "ratio", a: 3, b: 2 },
      ],
    };
  }
  return {
    hints: false,
    orders: [
      { kind: "ratio", a: 4, b: 6, baseLabel: "2 : 3, doubled" },
      { kind: "ratio", a: 6, b: 4, baseLabel: "3 : 2, doubled" },
      { kind: "ratio", a: 6, b: 9, baseLabel: "2 : 3, tripled" },
      // $6 ÷ 3 = $2 each.
      {
        kind: "rate",
        prompt: "$6 for 3 smoothies. Price each?",
        total: 6,
        count: 3,
        unit: "$",
        answer: 2,
      },
      // 12 scoops ÷ 4 servings = 3 scoops each.
      {
        kind: "rate",
        prompt: "12 scoops make 4 servings. Scoops per serving?",
        total: 12,
        count: 4,
        unit: "",
        answer: 3,
      },
      // $10 ÷ 5 = $2 each.
      {
        kind: "rate",
        prompt: "$10 for 5 smoothies. Price each?",
        total: 10,
        count: 5,
        unit: "$",
        answer: 2,
      },
      // $15 ÷ 5 = $3 each.
      {
        kind: "rate",
        prompt: "$15 for 5 smoothies. Price each?",
        total: 15,
        count: 5,
        unit: "$",
        answer: 3,
      },
    ],
  };
}

export default {
  id: "unit-1-smoothie-stand",
  vocab: [
    {
      term: "Ratio",
      definition:
        "A way to compare two amounts, like 2 strawberries to 3 bananas.",
      emoji: "⚖️",
    },
    {
      term: "Part-to-part",
      definition:
        "A ratio that compares one part to another part, like fruit to fruit.",
      emoji: "🍓",
    },
    {
      term: "Equivalent ratio",
      definition:
        "A ratio that shows the same comparison, like 2 : 3 and 4 : 6.",
      emoji: "🟰",
    },
    {
      term: "Unit rate",
      definition:
        "How much you get for just one, like the price for one smoothie.",
      emoji: "1️⃣",
    },
    {
      term: "Scale",
      definition:
        "To grow or shrink amounts by the same number to keep a ratio.",
      emoji: "📈",
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
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;

    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    // ---- Disposable registry (geometries/materials/textures) ----------------
    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };
    const std = (color, o = {}) =>
      track(
        new THREE.MeshStandardMaterial({
          color,
          roughness: o.roughness ?? 0.55,
          metalness: o.metalness ?? 0.05,
          emissive: o.emissive ?? 0x000000,
          emissiveIntensity: o.emissiveIntensity ?? 0,
        }),
      );

    // ---- Root group ---------------------------------------------------------
    const group = new THREE.Group();
    scene.add(group);

    // ---- World layout -------------------------------------------------------
    // The belt runs along +x→−x (customers ride in from the right and exit
    // left). The blender sits at the SERVE position (x≈SERVE_X). Customers
    // animate continuously so the scene always feels alive.
    const BELT_LEN = 30;
    const BELT_Y = 0.0;
    const SPAWN_X = 9; // customer appears here (right of the serve window)
    const SERVE_X = 0; // blender / serve window
    const EXIT_X = -14; // customer leaves the belt here

    // Ground / stage.
    const groundGeo = track(new THREE.CircleGeometry(22, 48));
    const ground = new THREE.Mesh(
      groundGeo,
      std(0x0e2b4f, { roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.42;
    ground.receiveShadow = true;
    group.add(ground);

    // Conveyor belt — long emissive slab with scrolling tread dashes.
    const beltGeo = track(new RoundedBoxGeometry(BELT_LEN, 0.5, 3.2, 3, 0.18));
    const beltMat = std(COLORS.belt, {
      roughness: 0.88,
      emissive: COLORS.beltEmissive,
      emissiveIntensity: 0.16,
    });
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.set(0, BELT_Y - 0.3, 1.6);
    belt.receiveShadow = true;
    group.add(belt);

    // Scrolling tread dashes across the belt (the speed cue).
    const dashMat = std(0xdff1ff, {
      roughness: 0.4,
      emissive: 0xdff1ff,
      emissiveIntensity: 0.55,
    });
    const dashGeo = track(new THREE.BoxGeometry(0.5, 0.05, 2.6));
    const DASH_SPAN = BELT_LEN;
    const DASH_STEP = 2.0;
    const dashes = [];
    for (let x = BELT_LEN / 2; x > -BELT_LEN / 2; x -= DASH_STEP) {
      const d = new THREE.Mesh(dashGeo, dashMat);
      d.position.set(x, BELT_Y - 0.04, 1.6);
      group.add(d);
      dashes.push(d);
    }

    // Back board / stand sign (emissive accent).
    const boardGeo = track(new RoundedBoxGeometry(7, 2.0, 0.4, 4, 0.2));
    const board = new THREE.Mesh(
      boardGeo,
      std(COLORS.teal, {
        emissive: COLORS.teal,
        emissiveIntensity: 0.5,
        roughness: 0.4,
      }),
    );
    board.position.set(0, 4.4, -3.4);
    board.castShadow = true;
    group.add(board);

    // ---- Blender (glass jar + base) at the serve window ---------------------
    const blenderGroup = new THREE.Group();
    blenderGroup.position.set(SERVE_X, 0, -0.4);
    group.add(blenderGroup);
    const jarRadius = 1.25;
    const jarGeo = track(
      new THREE.CylinderGeometry(jarRadius, jarRadius * 0.82, 3.4, 32, 1, true),
    );
    const jarMat = track(
      new THREE.MeshPhysicalMaterial({
        color: COLORS.blenderGlass,
        transparent: true,
        opacity: 0.26,
        roughness: 0.05,
        metalness: 0,
        transmission: 0.6,
        thickness: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
        side: THREE.DoubleSide,
      }),
    );
    const jar = new THREE.Mesh(jarGeo, jarMat);
    jar.position.y = 1.7;
    blenderGroup.add(jar);

    const jarBaseGeo = track(
      new THREE.CylinderGeometry(jarRadius * 0.95, jarRadius * 1.05, 0.6, 32),
    );
    const jarBase = new THREE.Mesh(
      jarBaseGeo,
      std(COLORS.blender, { roughness: 0.35, metalness: 0.4 }),
    );
    jarBase.position.y = 0.3;
    jarBase.castShadow = true;
    blenderGroup.add(jarBase);

    // ---- Fruit dispensers (tap targets, flank the blender) ------------------
    const dispensers = {};
    function makeDispenser(fruit, x) {
      const g = new THREE.Group();
      const binGeo = track(new RoundedBoxGeometry(1.5, 1.3, 1.5, 4, 0.3));
      const bin = new THREE.Mesh(binGeo, std(fruit.color, { roughness: 0.55 }));
      bin.position.y = 0.65;
      bin.castShadow = true;
      g.add(bin);
      const domeGeo = track(
        new THREE.SphereGeometry(0.9, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      );
      const dome = new THREE.Mesh(
        domeGeo,
        std(fruit.color, {
          roughness: 0.3,
          emissive: fruit.color,
          emissiveIntensity: 0.35,
        }),
      );
      dome.position.y = 1.3;
      dome.castShadow = true;
      g.add(dome);
      g.position.set(x, 0, -2.2);
      g.userData.fruit = fruit.name;
      g.traverse((o) => (o.userData.fruit = fruit.name));
      group.add(g);
      return g;
    }
    dispensers.strawberry = makeDispenser(FRUIT.strawberry, -3.6);
    dispensers.banana = makeDispenser(FRUIT.banana, 3.6);

    // Shared scoop geometry (small, stacks inside the jar).
    const scoopGeo = track(new THREE.SphereGeometry(jarRadius * 0.55, 16, 12));

    // ---- Customer pool ------------------------------------------------------
    // One customer at a time rides the belt with the current order card. Reused
    // each order: body, head, and a floating 3D label showing the order text.
    function buildCustomer() {
      const c = new THREE.Group();
      const bodyGeo = track(new RoundedBoxGeometry(1.1, 1.3, 1.0, 4, 0.28));
      const bodyMat = std(COLORS.amber, {
        roughness: 0.5,
        emissive: COLORS.amber,
        emissiveIntensity: 0.12,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.9;
      body.castShadow = true;
      c.add(body);
      const headGeo = track(new THREE.SphereGeometry(0.42, 18, 14));
      const head = new THREE.Mesh(headGeo, std(0xf2d6b3, { roughness: 0.6 }));
      head.position.y = 1.85;
      head.castShadow = true;
      c.add(head);
      c.userData.body = body;
      c.userData.head = head;
      c.userData.bodyMat = bodyMat;
      return c;
    }
    const customer = buildCustomer();
    customer.position.set(SPAWN_X, BELT_Y, 1.6);
    customer.visible = false;
    group.add(customer);

    // Order card floating above the customer (canvas-backed label sprite).
    // NOTE: label3d renders a single line only, and `border` must be a CSS
    // color string (not a hex number), so we pass strings here.
    const orderLabel = makeLabel("", {
      fontSize: 60,
      scale: 1.0,
      color: "#ffffff",
      background: "rgba(11,28,52,0.94)",
      border: "rgba(242,193,91,0.95)",
      THREE,
    });
    orderLabel.position.set(0, 3.2, 0);
    customer.add(orderLabel);

    // Live "what's in the cup" label floating over the blender.
    const cupLabel = makeLabel("0 : 0", {
      fontSize: 60,
      scale: 0.9,
      color: "#dff1ff",
      background: "rgba(11,28,52,0.88)",
      border: "rgba(31,166,162,0.95)",
      THREE,
    });
    cupLabel.position.set(SERVE_X, 4.0, -0.4);
    cupLabel.visible = false;
    group.add(cupLabel);

    // ---- Per-order countdown bar (a 3D plane that shrinks) ------------------
    const barBgGeo = track(new THREE.PlaneGeometry(6.2, 0.42));
    const barBg = new THREE.Mesh(
      barBgGeo,
      track(
        new THREE.MeshBasicMaterial({
          color: 0x0b1c34,
          transparent: true,
          opacity: 0.85,
          depthTest: false,
        }),
      ),
    );
    barBg.position.set(SERVE_X, 4.9, -0.4);
    barBg.renderOrder = 9;
    group.add(barBg);
    const barFillGeo = track(new THREE.PlaneGeometry(6.0, 0.3));
    const barFillMat = track(
      new THREE.MeshBasicMaterial({
        color: COLORS.ok,
        transparent: true,
        depthTest: false,
      }),
    );
    const barFill = new THREE.Mesh(barFillGeo, barFillMat);
    barFill.position.set(SERVE_X, 4.9, -0.39);
    barFill.renderOrder = 10;
    group.add(barFill);
    barBg.visible = false;
    barFill.visible = false;

    // Hide the clarity kit's duplicate HUD pills (we use the engine HUD).
    if (!document.getElementById("u1-hud-fix")) {
      const hf = document.createElement("style");
      hf.id = "u1-hud-fix";
      hf.textContent = ".ck-chip{display:none !important;}";
      document.head.appendChild(hf);
    }

    // ---- Game state ---------------------------------------------------------
    const scoops = []; // { mesh, fruit }
    let counts = { strawberry: 0, banana: 0 };
    let order = null;
    let orderIndex = 0;
    let rateGuess = 0;
    const total = cfg.orders.length;

    const START_LIVES = level === 2 ? 3 : 4;
    let lives = START_LIVES;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let running = false;
    let gameOver = false;

    // Real-time order timing. The belt carries the customer in; once they reach
    // the serve window the countdown begins. Pace ramps as the shift goes on.
    const BELT_SPEED = level === 2 ? 5.0 : 4.2; // world units / sec
    function orderTime(i) {
      // Generous early, tighter later. Level 2 is faster overall.
      const base = level === 2 ? 12 : 15;
      const ramp = Math.min(i * 0.9, 6); // up to 6s faster by the end
      return Math.max(level === 2 ? 6 : 8, base - ramp);
    }
    let phase = "idle"; // idle | arriving | active | resolving | leaving
    let timeLeft = 0;
    let timeMax = 1;

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;

    // ---- Order text helpers -------------------------------------------------
    function orderCardText(o) {
      if (o.kind === "rate") return o.prompt;
      const [ba, bb] = simplify(o.a, o.b);
      // The card shows the RECIPE rule + the yellow target, never the red answer.
      // label3d renders one line, so keep it to a single line.
      return `${ba}🍓 : ${bb}🍌  ·  serve ${o.b}🍌`;
    }
    function cupText() {
      if (!order) return "";
      if (order.kind === "rate") return `${order.unit}${rateGuess}`;
      return `${counts.strawberry} 🍓 : ${counts.banana} 🍌`;
    }
    function setTask() {
      if (!order) return;
      if (order.kind === "rate") {
        const text = `Order: ${order.prompt}  Dial ◀ ▶ to the price, then SERVE before the timer runs out.`;
        hud.setObjective(text);
        if (clarity) clarity.setObjective(text);
      } else {
        const [ba, bb] = simplify(order.a, order.b);
        const text = `Recipe ${ba} red : ${bb} yellow. Load ${order.b} yellow with the matching red, then SERVE before the timer runs out.`;
        hud.setObjective(text);
        if (clarity) clarity.setObjective(text);
      }
    }

    function clearCup() {
      scoops.forEach((s) => {
        blenderGroup.remove(s.mesh);
        s.mesh.material.dispose();
      });
      scoops.length = 0;
      counts = { strawberry: 0, banana: 0 };
      rateGuess = 0;
    }

    function updateCupLabel() {
      updateLabel(cupLabel, cupText());
    }

    // ---- Build actions (real-time) ------------------------------------------
    function addScoop(fruit) {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (order.kind !== "ratio") return;
      counts[fruit] += 1;
      const mesh = new THREE.Mesh(
        scoopGeo,
        std(FRUIT[fruit].color, {
          roughness: 0.4,
          emissive: FRUIT[fruit].color,
          emissiveIntensity: 0.25,
        }),
      );
      mesh.castShadow = true;
      const idx = scoops.length;
      const targetY = 0.7 + idx * 0.42;
      mesh.position.set(0, targetY, 0);
      blenderGroup.add(mesh);
      scoops.push({ mesh, fruit });
      if (!reduced) {
        mesh.scale.setScalar(0.01);
        feel.tween({
          from: 0.01,
          to: 1,
          duration: 0.22,
          onUpdate: (v) => mesh.scale.setScalar(v),
        });
        feel.burst(
          { x: SERVE_X, y: targetY + 0.4 - 0.4, z: -0.4 },
          { color: FRUIT[fruit].color, count: 8, spread: 1.8 },
        );
      }
      feel.sfx("add");
      updateCupLabel();
    }

    function removeScoop(fruit) {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (order.kind !== "ratio" || !scoops.length) return;
      let idx = -1;
      if (fruit) {
        for (let i = scoops.length - 1; i >= 0; i--)
          if (scoops[i].fruit === fruit) {
            idx = i;
            break;
          }
      } else idx = scoops.length - 1;
      if (idx < 0) return;
      const [s] = scoops.splice(idx, 1);
      counts[s.fruit] -= 1;
      blenderGroup.remove(s.mesh);
      s.mesh.material.dispose();
      // Restack remaining scoops.
      scoops.forEach((sc, i) => {
        sc.mesh.position.y = 0.7 + i * 0.42;
      });
      feel.sfx("remove");
      updateCupLabel();
    }

    function adjustRate(delta) {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (order.kind !== "rate") return;
      rateGuess = Math.max(0, rateGuess + delta);
      feel.sfx("select");
      updateCupLabel();
    }

    // ---- Correctness (the math) ---------------------------------------------
    function ratioMatches() {
      // The order fixes the yellow count; the student must work out the red
      // count from the recipe ratio. We require the exact scaled batch — no
      // giveaway from accepting any equivalent ratio — but we VERIFY it is a
      // true equivalent ratio of the recipe (cross-multiply check below).
      if (counts.banana !== order.b) return false;
      if (counts.strawberry !== order.a) return false;
      // Sanity: counts.strawberry : counts.banana ≡ recipe a : b.
      return counts.strawberry * order.b === order.a * counts.banana;
    }
    function rateMatches() {
      // Unit rate = total ÷ count. Reused answer is pre-verified; we recompute
      // here so the check is provably "answer === total ÷ count".
      return rateGuess === order.total / order.count;
    }
    function isCorrect() {
      return order.kind === "rate" ? rateMatches() : ratioMatches();
    }

    // ---- Serve --------------------------------------------------------------
    function serve() {
      if (!running || gameOver || phase !== "active" || !order) return;
      if (isCorrect()) onCorrect();
      else onWrong(false);
    }

    function onCorrect() {
      phase = "resolving";
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      // Points: base + level bonus + speed bonus (time left) + combo bonus.
      const speedBonus = Math.round((timeLeft / timeMax) * 15);
      const comboBonus = Math.min(streak - 1, 5) * 5;
      const base = order.kind === "rate" ? 25 : 20;
      const pts = base + (level === 2 ? 10 : 0) + speedBonus + comboBonus;
      onScore(pts, {
        order: orderIndex + 1,
        kind: order.kind,
        target: order.kind === "rate" ? order.answer : `${order.a}:${order.b}`,
      });

      feel.sfx("correct");
      if (!reduced) {
        feel.shake(0.22);
        feel.burst(
          { x: SERVE_X, y: 3.2, z: -0.4 },
          { color: COLORS.ok, count: 36, spread: 4.6 },
        );
        // Celebratory jar pop.
        feel.tween({
          from: 1,
          to: 1.14,
          duration: 0.16,
          onUpdate: (v) => blenderGroup.scale.setScalar(v),
          onComplete: () =>
            feel.tween({
              from: 1.14,
              to: 1,
              duration: 0.2,
              onUpdate: (v) => blenderGroup.scale.setScalar(v),
            }),
        });
      }
      if (typeof hud.feedback === "function")
        hud.feedback(
          true,
          `Served! +${pts}${streak > 1 ? ` · 🔥${streak}` : ""}`,
        );
      announce(`Correct! You served the order. ${pts} points.`);

      // Happy customer color, then send them on their way and bring the next.
      customer.userData.bodyMat.color.set(COLORS.ok);
      customer.userData.bodyMat.emissive.set(COLORS.ok);
      later(nextOrder, 650);
    }

    function onWrong(timedOut) {
      phase = "resolving";
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      lives = Math.max(0, lives - 1);
      if (typeof hud.setLives === "function") hud.setLives(lives);

      feel.sfx("wrong");
      if (!reduced) {
        feel.shake(0.26);
        feel.burst(
          { x: SERVE_X, y: 2.4, z: -0.4 },
          { color: COLORS.bad, count: 22, spread: 3.4 },
        );
      }
      customer.userData.bodyMat.color.set(COLORS.bad);
      customer.userData.bodyMat.emissive.set(COLORS.bad);

      let hint;
      if (order.kind === "rate") {
        hint = `Find ${order.total} ÷ ${order.count}.`;
      } else {
        const [ta, tb] = simplify(order.a, order.b);
        hint = `Use the recipe ${ta} : ${tb} to find the red for ${order.b} yellow.`;
      }
      const livesMsg =
        lives > 0 ? ` ${lives} ${lives === 1 ? "life" : "lives"} left.` : "";
      const head = timedOut ? "Too slow!" : "Not a match.";
      if (typeof hud.feedback === "function")
        hud.feedback(false, `${head} ${hint}${livesMsg}`);
      announce(`${head} ${hint}${livesMsg}`);
      caption(hint);

      if (lives <= 0) {
        later(loseGame, 700);
        return;
      }
      later(nextOrder, 850);
    }

    // ---- Order flow ---------------------------------------------------------
    function startOrder(i) {
      order = cfg.orders[i];
      clearCup();
      rateGuess = 0;
      if (typeof hud.setProgress === "function") hud.setProgress(i, total);

      // Reset and reveal the customer at the spawn end; belt carries them in.
      customer.position.set(SPAWN_X, BELT_Y, 1.6);
      customer.visible = true;
      customer.userData.bodyMat.color.set(COLORS.amber);
      customer.userData.bodyMat.emissive.set(COLORS.amber);
      updateLabel(orderLabel, orderCardText(order));

      cupLabel.visible = true;
      updateCupLabel();
      barBg.visible = false;
      barFill.visible = false;

      timeMax = orderTime(i);
      timeLeft = timeMax;
      phase = "arriving";

      setTask();
      if (clarity) {
        if (order.kind === "rate") clarity.setTarget(order.prompt);
        else {
          const [ba, bb] = simplify(order.a, order.b);
          clarity.setTarget(
            `recipe ${ba} red : ${bb} yellow · serve ${order.b} yellow`,
          );
        }
      }
      if (cfg.hints) {
        if (order.kind === "rate")
          hud.message(`Try ${order.total} ÷ ${order.count}.`, {
            tone: "info",
            duration: 2600,
          });
        else {
          const [ba, bb] = simplify(order.a, order.b);
          hud.message(
            `Recipe ${ba} : ${bb}. Build ${order.b} yellow + matching red.`,
            {
              tone: "info",
              duration: 3200,
            },
          );
        }
      }
      announce(
        order.kind === "rate"
          ? `New customer. ${order.prompt} Dial your answer, then serve before the timer runs out.`
          : `New customer. Recipe ${simplify(order.a, order.b).join(" to ")}. Build ${order.b} yellow with the matching red, then serve before the timer runs out.`,
      );
    }

    function nextOrder() {
      // Send the current customer off the belt, then either advance or win.
      phase = "leaving";
      if (orderIndex < total - 1) {
        orderIndex += 1;
        // Brief leave animation handled in frame(); start the next when they exit.
        later(() => startOrder(orderIndex), 350);
      } else {
        later(winGame, 350);
      }
    }

    // ---- Win / lose ---------------------------------------------------------
    function loseGame() {
      if (gameOver) return;
      gameOver = true;
      running = false;
      phase = "idle";
      cupLabel.visible = false;
      barBg.visible = false;
      barFill.visible = false;
      const msg = `Out of lives! You served ${solvedCount} of ${total} orders.`;
      hud.setObjective(msg);
      announce(`Shift over. ${msg}`);
      if (clarity) {
        if (clarity.setTarget) clarity.setTarget(null);
        clarity.lose({
          titleEn: "Out of lives!",
          badge: "🥤",
          stats: `${msg} Tip: simplify the recipe ratio first, then scale it up to the order.`,
        });
      }
    }

    function winGame() {
      if (gameOver) return;
      gameOver = true;
      running = false;
      phase = "idle";
      cupLabel.visible = false;
      barBg.visible = false;
      barFill.visible = false;
      customer.visible = false;
      hud.setObjective(`Shift complete! You served all ${total} orders. 🥤`);
      hud.message("🎉 Shift complete!", { tone: "ok", duration: 0 });
      feel.sfx("fanfare");
      if (!reduced) {
        [0, 200, 420].forEach((ms, i) =>
          later(
            () =>
              feel.burst(
                { x: (i - 1) * 3, y: 4, z: -0.4 },
                {
                  color: [COLORS.strawberry, COLORS.banana, COLORS.teal][i],
                  count: 50,
                  spread: 6,
                },
              ),
            ms,
          ),
        );
        feel.shake(0.3);
      }
      announce(
        `Shift complete! You served all ${total} orders with a best combo of ${bestStreak}.`,
      );
      if (clarity) {
        if (clarity.setTarget) clarity.setTarget(null);
        clarity.win({
          titleEn: "Shift complete!",
          badge: "🥤",
          stats: `You served all ${total} orders. Best combo: ${bestStreak}. Score saved.`,
        });
      }
    }

    // ---- Reset for a fresh run (first play + Play Again) --------------------
    function resetRun() {
      orderIndex = 0;
      lives = START_LIVES;
      streak = 0;
      bestStreak = 0;
      solvedCount = 0;
      gameOver = false;
      clearCup();
      if (typeof hud.setLives === "function") hud.setLives(lives);
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
      running = true;
      startOrder(0);
    }

    // ---- Input --------------------------------------------------------------
    function handlePress(name) {
      if (!running || gameOver) return;
      if (!order) return;
      if (order.kind === "rate") {
        if (name === "right" || name === "up") adjustRate(1);
        else if (name === "left" || name === "down") adjustRate(-1);
        else if (name === "action" || name === "confirm") serve();
        return;
      }
      // ratio order
      if (name === "left") addScoop("strawberry");
      else if (name === "right") addScoop("banana");
      else if (name === "up") addScoop("strawberry");
      else if (name === "down") addScoop("banana");
      else if (name === "action") serve();
      else if (name === "confirm") removeScoop();
    }

    function handleTap() {
      if (!running || gameOver || !order || phase !== "active") return;
      // First, try hitting a 3D object (fruit bin or the blender = serve).
      const hits = input.raycast(
        camera,
        [dispensers.strawberry, dispensers.banana, jar, jarBase],
        true,
      );
      if (hits.length) {
        const fruit = hits[0].object.userData.fruit;
        if (fruit) {
          if (order.kind === "ratio") addScoop(fruit);
          else adjustRate(fruit === "banana" ? 1 : -1);
        } else {
          serve(); // tapped the blender
        }
        return;
      }
      // Fallback: left half / right half of the screen.
      const nx = input.state.ndc.x;
      if (order.kind === "rate") {
        adjustRate(nx >= 0 ? 1 : -1);
      } else {
        if (nx < 0) addScoop("strawberry");
        else addScoop("banana");
      }
    }

    // ---- Per-frame real-time loop ------------------------------------------
    function frame(dt, t) {
      const d = Math.min(dt, 0.05); // clamp tab-switch hiccups

      // Belt tread always scrolls (sense of life), faster while playing.
      const beltScroll = (running && !gameOver ? BELT_SPEED : 1.2) * d;
      for (const dh of dashes) {
        dh.position.x -= beltScroll;
        if (dh.position.x < -DASH_SPAN / 2) dh.position.x += DASH_SPAN;
      }

      // Idle/ambient motion.
      if (!reduced) {
        blenderGroup.rotation.y = Math.sin(t * 0.5) * 0.05;
        board.position.y = 4.4 + Math.sin(t * 1.2) * 0.05;
      }

      if (running && !gameOver && customer.visible) {
        const cu = customer;
        if (phase === "arriving") {
          // Carry the customer in until they reach the serve window. Move at a
          // steady belt pace (not a slowing lerp) so play begins promptly.
          cu.position.x = Math.max(
            SERVE_X,
            cu.position.x - BELT_SPEED * 1.6 * d,
          );
          if (Math.abs(cu.position.x - SERVE_X) < 0.2) {
            cu.position.x = SERVE_X;
            phase = "active";
            barBg.visible = true;
            barFill.visible = true;
          }
        } else if (phase === "active") {
          // Countdown.
          timeLeft = Math.max(0, timeLeft - d);
          const frac = timeLeft / timeMax;
          barFill.scale.x = Math.max(0.001, frac);
          // Plane is centered; shrink toward the left edge.
          barFill.position.x = SERVE_X - (6.0 * (1 - frac)) / 2;
          // Color shifts green→amber→red as time runs low.
          const c = barFillMat.color;
          if (frac > 0.5) c.set(COLORS.ok);
          else if (frac > 0.25) c.set(COLORS.amber);
          else c.set(COLORS.bad);
          // Customer bobs impatiently as time drains.
          if (!reduced)
            cu.userData.body.position.y =
              0.9 + Math.sin(t * 6) * 0.04 * (1 - frac + 0.3);
          if (timeLeft <= 0) onWrong(true);
        } else if (phase === "leaving") {
          // Slide the served/failed customer off to the left.
          cu.position.x -= BELT_SPEED * 1.6 * d;
          if (cu.position.x <= EXIT_X) cu.visible = false;
        }
        // Keep labels facing-friendly bob.
        if (!reduced && phase !== "leaving")
          orderLabel.position.y = 3.2 + Math.sin(t * 1.6) * 0.06;
      }

      // Cup label follows the live build; only needs refresh on change (done in
      // the action handlers), but keep its bob alive here.
      if (!reduced && cupLabel.visible)
        cupLabel.position.y = 4.0 + Math.sin(t * 1.4) * 0.05;
    }

    return {
      start() {
        // Frame the camera looking down the belt at the serve window.
        const finalPos = new THREE.Vector3(0, 6.2, 11.5);
        camera.lookAt(0, 2, -0.4);
        if (reduced) {
          camera.position.copy(finalPos);
          feel.syncCamera();
        } else {
          const startPos = new THREE.Vector3(6, 8.5, 13);
          camera.position.copy(startPos);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.0,
            onUpdate: (v) => {
              camera.position.lerpVectors(startPos, finalPos, v);
              camera.lookAt(0, 2, -0.4);
            },
            onComplete: () => feel.syncCamera(),
          });
        }

        function beginGameplay() {
          resetRun();
          unbindPress = input.onPress(handlePress);
          unbindTap = input.onTap(handleTap);
        }

        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Smoothie Rush — Fill the Order Before Time Runs Out",
          objectiveEn:
            "Customers ride the belt to your stand carrying an order. Build it in real time — load 🍓/🍌 scoops to match the recipe ratio, or dial the price for a unit-rate order — then SERVE before the countdown bar empties. Fast serves build a combo.",
          objectiveEs:
            "Los clientes llegan en la banda con una orden. Construye la respuesta en tiempo real: agrega bolas 🍓/🍌 para igualar la razón, o ajusta el precio en órdenes de tasa, y SIRVE antes de que se acabe el tiempo. Servir rápido sube tu racha.",
          standard: "6.RP.A.1–3 · Ratios & Unit Rates",
          controls: [
            {
              key: "← / →  (A / D)",
              actionEn:
                "Ratio order: add a 🍓 red (left) or 🍌 yellow (right) scoop. Price order: dial your number down / up.",
              actionEs:
                "Razón: agrega bola roja 🍓 (izq.) o amarilla 🍌 (der.). Precio: baja / sube tu número.",
            },
            {
              key: "Tap fruit / cup",
              actionEn:
                "Tap a 🍓/🍌 bin to add that scoop; tap the blender to SERVE. (Or tap the left/right half of the screen.)",
              actionEs:
                "Toca una fruta 🍓/🍌 para agregar; toca la licuadora para SERVIR. (O toca la mitad izq./der.)",
            },
            {
              key: "Space / ● action",
              actionEn: "SERVE — fill the order before the timer empties",
              actionEs: "SIRVE — entrega antes de que se acabe el tiempo",
            },
            {
              key: "Enter / ✓",
              actionEn:
                "Ratio order: remove the last scoop. Price order: also serves.",
              actionEs: "Razón: quita la última bola. Precio: también sirve.",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "Each customer's order shows the recipe ratio (or a price question). Work out the answer and SERVE before the bar empties. A wrong serve or a timeout costs a life. Serve every order to clear the shift and win.",
          howToWinEs:
            "Cada orden muestra una razón (o una pregunta de precio). Calcula la respuesta y SIRVE antes de que la barra se vacíe. Un error o un tiempo agotado cuesta una vida. Sirve todas las órdenes para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });

        unbindFrame = ctx.onFrame(frame);
      },

      dispose() {
        running = false;
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        // Dispose dynamic scoop materials + the canvas-backed labels.
        scoops.forEach((s) => s.mesh.material.dispose());
        scoops.length = 0;
        [orderLabel, cupLabel].forEach((spr) => {
          if (!spr) return;
          if (spr.parent) spr.parent.remove(spr);
          if (spr.material && spr.material.map) spr.material.map.dispose();
          if (spr.material) spr.material.dispose();
        });
        disposables.forEach((dd) => dd.dispose && dd.dispose());
        scene.remove(group);
      },
    };
  },
};
