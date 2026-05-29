import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";

const COLORS = {
  belt: 0x1b3a5b,
  beltEdge: 0x2f6aa0,
  crate: [0x1fa6a2, 0x4f8fd0, 0xe09b4a, 0x8b6fc4, 0x4aa978, 0xd9795d],
  box: 0xf2c15b,
  cursor: 0x1fa6a2,
  ok: 0x4aa978,
  bad: 0xb64e2f,
};

// ---- Pure math (kept exact; mirrors the standards 6.NS.B.2-4) ----
function gcf(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}
function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcf(a, b);
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
// Format a decimal cleanly (no trailing float noise).
function fmt(n) {
  const r = round2(n);
  return Number.isInteger(r) ? String(r) : String(r);
}

function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        {
          kind: "gcf",
          a: 12,
          b: 8,
          prompt:
            "Pack 12 gears and 8 bolts into identical kits with none left over. How many kits?",
        },
        {
          kind: "lcm",
          a: 4,
          b: 6,
          prompt:
            "Gear trays hold 4, bolt trays hold 6. What is the smallest run length where both finish together?",
        },
        {
          kind: "decimal-sum",
          a: 3.5,
          b: 2.25,
          op: "+",
          prompt: "Two parcels weigh 3.5 kg and 2.25 kg. Total weight?",
        },
        {
          kind: "decimal-sum",
          a: 9.4,
          b: 3.7,
          op: "-",
          prompt: "A 9.4 kg bin loses a 3.7 kg parcel. Remaining weight?",
        },
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      {
        kind: "decimal-prod",
        a: 2.4,
        b: 1.5,
        op: "×",
        prompt: "Each crate is 2.4 kg. A pallet holds 1.5 crate-loads. Mass?",
      },
      {
        kind: "decimal-prod",
        a: 7.2,
        b: 0.6,
        op: "÷",
        prompt: "Split 7.2 kg of resin into 0.6 kg cartridges. How many?",
      },
      {
        kind: "distributive",
        a: 36,
        b: 8,
        prompt:
          "Factor the order 36 + 8 as factor × (sum). Use the greatest common factor.",
      },
      {
        kind: "distributive",
        a: 18,
        b: 30,
        prompt: "Factor 18 + 30 as factor × (sum) using the GCF.",
      },
      {
        kind: "lcm",
        a: 8,
        b: 12,
        prompt:
          "Press A finishes every 8 s, press B every 12 s. When do they sync?",
      },
    ],
  };
}

// Expected answer + how the player adjusts the value for a given round.
function roundSpec(r) {
  switch (r.kind) {
    case "gcf":
      return {
        answer: gcf(r.a, r.b),
        min: 1,
        max: Math.max(r.a, r.b),
        step: 1,
      };
    case "lcm":
      return { answer: lcm(r.a, r.b), min: 1, max: r.a * r.b, step: 1 };
    case "decimal-sum":
      return {
        answer: round2(r.op === "+" ? r.a + r.b : r.a - r.b),
        min: 0,
        max: round2(r.a + r.b + 5),
        step: 0.05,
      };
    case "decimal-prod":
      return {
        answer: round2(r.op === "×" ? r.a * r.b : r.a / r.b),
        min: 0,
        max: round2((r.op === "×" ? r.a * r.b : r.a / r.b) + 6),
        step: r.op === "×" ? 0.1 : 1,
      };
    case "distributive": {
      // 36 + 8 = g(36/g + 8/g); player chooses the common factor g.
      const g = gcf(r.a, r.b);
      return { answer: g, min: 1, max: Math.min(r.a, r.b), step: 1 };
    }
    default:
      return { answer: 0, min: 0, max: 1, step: 1 };
  }
}

export default {
  id: "unit-4-factory-line",
  vocab: [
    {
      term: "Greatest common factor",
      definition:
        "The biggest number that divides two numbers with nothing left over.",
      emoji: "🧩",
    },
    {
      term: "Least common multiple",
      definition: "The smallest number that two numbers both divide into.",
      emoji: "🔁",
    },
    {
      term: "Distributive property",
      definition: "Pulling out a shared factor: 36 + 8 becomes 4 × (9 + 2).",
      emoji: "📦",
    },
    {
      term: "Quotient",
      definition: "The answer you get when you divide one number by another.",
      emoji: "➗",
    },
    {
      term: "Decimal",
      definition: "A number with a dot that shows parts smaller than one.",
      emoji: "🔢",
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

    // ---- Scene: a low-poly conveyor belt ----
    const group = new THREE.Group();
    scene.add(group);

    const beltMat = new THREE.MeshStandardMaterial({
      color: COLORS.belt,
      roughness: 0.9,
    });
    const belt = new THREE.Mesh(new THREE.BoxGeometry(14, 0.5, 3.4), beltMat);
    belt.position.y = -0.25;
    group.add(belt);

    const edgeMat = new THREE.MeshStandardMaterial({
      color: COLORS.beltEdge,
      roughness: 0.7,
    });
    [-1.8, 1.8].forEach((z) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 0.2), edgeMat);
      rail.position.set(0, 0.05, z);
      group.add(rail);
    });

    // Slow-rolling rollers (visual juice only).
    const rollers = [];
    const rollerGeo = new THREE.CylinderGeometry(0.22, 0.22, 3.2, 10);
    const rollerMat = new THREE.MeshStandardMaterial({
      color: COLORS.beltEdge,
      roughness: 0.5,
      metalness: 0.2,
    });
    for (let i = 0; i < 7; i++) {
      const r = new THREE.Mesh(rollerGeo, rollerMat);
      r.rotation.x = Math.PI / 2;
      r.position.set(-6 + i * 2, -0.1, 0);
      group.add(r);
      rollers.push(r);
    }

    // Light to read the crates.
    const key = new THREE.PointLight(0xffffff, 0.5, 60);
    key.position.set(4, 8, 6);
    group.add(key);

    // ---- Live HUD label floating over the belt ----
    const liveLabel = makeLabel("", { scale: 1.1 });
    liveLabel.position.set(0, 3.2, 0);
    group.add(liveLabel);

    const cratesGeo = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const disposables = [cratesGeo, rollerGeo];
    const crateGroup = new THREE.Group();
    group.add(crateGroup);

    // ---- Round state ----
    let roundIndex = 0;
    let round = null;
    let spec = null;
    let value = 1; // player's current chosen value
    let solved = false;
    let unbindFrame = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function disposeMesh(m) {
      m.traverse((o) => {
        if (o.geometry && o.geometry !== cratesGeo && o.geometry !== rollerGeo)
          o.geometry.dispose();
        if (o.material) {
          if (o.material.map) o.material.map.dispose();
          o.material.dispose();
        }
      });
    }

    function clearCrates() {
      while (crateGroup.children.length) {
        const m = crateGroup.children.pop();
        disposeMesh(m);
      }
    }

    // Build a row of crates grouped into `groups` bundles (visual grouping).
    function layoutCrates(total, groups, colorIdx) {
      clearCrates();
      if (total <= 0) return;
      groups = Math.max(1, groups);
      const perGroup = total / groups;
      const color = COLORS.crate[colorIdx % COLORS.crate.length];
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.05,
      });
      const gap = 0.95; // between groups
      const cw = 0.8; // crate spacing
      // Total width to center the whole run.
      const groupWidth = (g) => g * cw;
      let totalWidth = 0;
      for (let g = 0; g < groups; g++) totalWidth += groupWidth(perGroup) + gap;
      totalWidth -= gap;
      let x = -totalWidth / 2;
      for (let g = 0; g < groups; g++) {
        const n = Math.round(perGroup);
        // crate stack for this group
        for (let k = 0; k < n; k++) {
          const c = new THREE.Mesh(cratesGeo, mat);
          c.position.set(x + k * cw + cw / 2, 0.35, 0);
          crateGroup.add(c);
        }
        x += groupWidth(perGroup) + gap;
      }
    }

    function startRound() {
      solved = true; // block input until set up
      clearCrates();
      round = cfg.rounds[roundIndex];
      spec = roundSpec(round);
      value = spec.min;
      solved = false;

      hud.setLevel(level === 2 ? "Level 2" : "Level 1");
      announce(`Round ${roundIndex + 1}. ${round.prompt}`);
      caption(round.prompt);
      hud.setObjective(round.prompt);

      if (cfg.hints)
        hud.message(hintFor(round), { tone: "info", duration: 3200 });

      refresh();
    }

    function hintFor(r) {
      switch (r.kind) {
        case "gcf":
          return "Find the largest number that divides BOTH amounts evenly.";
        case "lcm":
          return "Count up the multiples of each until they first match.";
        case "decimal-sum":
          return (
            "Line up the decimal points, then " +
            (r.op === "+" ? "add." : "subtract.")
          );
        default:
          return "Use the up/down arrows to set your answer, then confirm.";
      }
    }

    // Describe the equation the player is currently building.
    function liveText() {
      switch (round.kind) {
        case "gcf":
          return `GCF(${round.a}, ${round.b}) = ${value}`;
        case "lcm":
          return `LCM(${round.a}, ${round.b}) = ${value}`;
        case "decimal-sum":
        case "decimal-prod":
          return `${fmt(round.a)} ${round.op} ${fmt(round.b)} = ${fmt(value)}`;
        case "distributive": {
          const g = value;
          if (g > 0 && round.a % g === 0 && round.b % g === 0) {
            return `${round.a} + ${round.b} = ${g}(${round.a / g} + ${round.b / g})`;
          }
          return `${round.a} + ${round.b} = ${g}( ? + ? )`;
        }
        default:
          return "";
      }
    }

    function refresh() {
      updateLabel(liveLabel, liveText());
      hud.setObjective(`${round.prompt}  —  current: ${currentReadout()}`);

      // Visual grouping for GCF/LCM/distributive rounds.
      if (round.kind === "gcf") {
        // Split `a` items into `value` equal groups when value divides evenly.
        const divides = value > 0 && round.a % value === 0;
        layoutCrates(round.a, divides ? round.a / value : round.a, 0);
      } else if (round.kind === "lcm") {
        layoutCrates(
          Math.min(value, 24),
          Math.max(1, Math.round(value / round.a) || 1),
          1,
        );
      } else if (round.kind === "distributive") {
        const g = value;
        if (g > 0 && round.a % g === 0 && round.b % g === 0) {
          layoutCrates(round.a + round.b, g, 2);
        } else {
          clearCrates();
        }
      } else {
        clearCrates();
      }
    }

    function currentReadout() {
      if (round.kind === "decimal-sum" || round.kind === "decimal-prod")
        return fmt(value);
      return String(value);
    }

    function adjust(dir) {
      if (solved) return;
      const next = round2(value + dir * spec.step);
      value = Math.max(spec.min, Math.min(spec.max, next));
      refresh();
      announce(`Set to ${currentReadout()}.`);
    }

    function isCorrect() {
      if (round.kind === "distributive") {
        // Must equal the GCF so the inner sum is fully factored.
        return (
          value === spec.answer &&
          round.a % value === 0 &&
          round.b % value === 0
        );
      }
      return round2(value) === round2(spec.answer);
    }

    function confirm() {
      if (solved) return;
      if (!isCorrect()) {
        const tip =
          round.kind === "distributive" &&
          round.a % value === 0 &&
          round.b % value === 0
            ? "That factor works, but it is not the GREATEST common factor — pull out more."
            : "Not quite — adjust and try again.";
        hud.message(tip, { tone: "warn", duration: 2200 });
        feel.shake(0.16);
        announce(tip);
        return;
      }
      win();
    }

    function win() {
      solved = true;
      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const pts = base + levelBonus;
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        answer: spec.answer,
      });

      feel.shake(0.3);
      feel.burst(
        { x: 0, y: 1.2, z: 0 },
        { color: COLORS.ok, count: 36, spread: 4 },
      );
      const msg = `Correct! ${liveText()}  +${pts}`;
      hud.message(msg, { tone: "ok", duration: 2400 });
      announce(`Correct. ${liveText()}. You earned ${pts} points.`);

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          clearCrates();
          updateLabel(liveLabel, "Shift complete!");
          hud.setObjective("Factory shift complete! Great work, Operator.");
          hud.message("All orders packaged!", { tone: "ok", duration: 0 });
          announce("All orders packaged. Great work, Operator.");
        }
      }, 2600);
    }

    let unbindPress = null;
    let unbindTap = null;

    return {
      start() {
        camera.position.set(0, 6, 9);
        camera.lookAt(0, 0.5, 0);
        feel.syncCamera();

        startRound();

        unbindPress = input.onPress((name) => {
          if (name === "up" || name === "right") adjust(1);
          else if (name === "down" || name === "left") adjust(-1);
          else if (name === "action" || name === "confirm") confirm();
        });

        // Touch: tap upper half raises the value, lower half lowers it;
        // a tap on the floating answer confirms.
        unbindTap = input.onTap(() => {
          if (solved) return;
          const hits = input.raycast(camera, [liveLabel], false);
          if (hits.length) {
            confirm();
            return;
          }
          // ndc.y > 0 is the upper half of the canvas (raise), below lowers.
          const ndcY = input.state.ndc ? input.state.ndc.y : 0;
          adjust(ndcY >= 0 ? 1 : -1);
        });

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            for (const r of rollers) r.rotation.y = t * 1.5;
            liveLabel.position.y = 3.2 + Math.sin(t * 2) * 0.08;
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearCrates();
        disposables.forEach((g) => g.dispose());
      },
    };
  },
};
