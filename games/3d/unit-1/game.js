import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// ============================================================================
// Unit 1 — Smoothie Stand  ·  Ratios & Unit Rates (6.RP.A.1–3)
// Premium rebuild against engine3d/. Theme + math preserved from the original.
// ============================================================================

const COLORS = {
  base: 0x123a6b, // counter / scene navy
  blender: 0x2f6aa0,
  blenderGlass: 0xbfe2ff,
  strawberry: 0xe0556b,
  banana: 0xf2c15b,
  teal: 0x1fa6a2,
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
// Round sets per level. 6–8 rounds each.
//   Level 1 (support): hints on, smaller numbers, simple part-to-part ratios.
//   Level 2 (enrichment): larger / multi-step, scaled recipes + unit-rate work.
// ---------------------------------------------------------------------------
function makeLevel(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        { kind: "ratio", a: 1, b: 1 },
        { kind: "ratio", a: 2, b: 1 },
        { kind: "ratio", a: 1, b: 2 },
        { kind: "ratio", a: 2, b: 3 },
        { kind: "ratio", a: 3, b: 2 },
        { kind: "ratio", a: 2, b: 4 }, // equivalent to 1:2
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      { kind: "ratio", a: 4, b: 6, baseLabel: "2 : 3, doubled" },
      { kind: "ratio", a: 6, b: 4, baseLabel: "3 : 2, doubled" },
      { kind: "ratio", a: 6, b: 9, baseLabel: "2 : 3, tripled" },
      {
        kind: "rate",
        prompt: "$6 for 3 smoothies. Price per smoothie?",
        total: 6,
        count: 3,
        unit: "$",
        answer: 2,
      },
      {
        kind: "rate",
        prompt: "12 scoops make 4 servings. Scoops per serving?",
        total: 12,
        count: 4,
        unit: "",
        answer: 3,
      },
      {
        kind: "rate",
        prompt: "$10 for 5 smoothies. Price per smoothie?",
        total: 10,
        count: 5,
        unit: "$",
        answer: 2,
      },
      {
        kind: "rate",
        prompt: "$15 for 5 smoothies. Price per smoothie?",
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
      renderer, // FIX: previously used without destructuring → ReferenceError.
      input,
      hud,
      feel,
      announce,
      THREE,
      level,
      onScore,
      onFrame,
    } = ctx;

    const cfg = makeLevel(level);
    const reduced = feel.reducedMotion;

    // ---- Disposable registry (geometries/materials/textures) ----
    const disposables = [];
    const track = (obj) => {
      disposables.push(obj);
      return obj;
    };

    // ---- Materials ----------------------------------------------------------
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

    // Ground / stage — receives shadows.
    const groundGeo = track(new THREE.CircleGeometry(20, 48));
    const ground = new THREE.Mesh(
      groundGeo,
      std(0x0e2b4f, { roughness: 0.95 }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.41;
    ground.receiveShadow = true;
    group.add(ground);

    // Counter — rounded hero block, casts + receives shadow.
    const counterGeo = track(new RoundedBoxGeometry(14, 0.9, 8, 4, 0.25));
    const counter = new THREE.Mesh(
      counterGeo,
      std(COLORS.wood, { roughness: 0.7 }),
    );
    counter.position.y = -0.45;
    counter.castShadow = true;
    counter.receiveShadow = true;
    group.add(counter);

    // Back board / sign accent (emissive → blooms).
    const boardGeo = track(new RoundedBoxGeometry(8, 2.2, 0.4, 4, 0.2));
    const board = new THREE.Mesh(
      boardGeo,
      std(COLORS.teal, {
        emissive: COLORS.teal,
        emissiveIntensity: 0.5,
        roughness: 0.4,
      }),
    );
    board.position.set(0, 4.6, -3.2);
    board.castShadow = true;
    group.add(board);

    // ---- Blender (glass jar + base) -----------------------------------------
    const blenderGroup = new THREE.Group();
    group.add(blenderGroup);
    const jarRadius = 1.5;
    const jarGeo = track(
      new THREE.CylinderGeometry(jarRadius, jarRadius * 0.82, 4, 32, 1, true),
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
    jar.position.y = 2;
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

    // ---- Fruit dispensers (tap targets) -------------------------------------
    function makeDispenser(fruit, x) {
      const g = new THREE.Group();
      const binGeo = track(new RoundedBoxGeometry(1.7, 1.5, 1.7, 4, 0.3));
      const bin = new THREE.Mesh(binGeo, std(fruit.color, { roughness: 0.55 }));
      bin.position.y = 0.75;
      bin.castShadow = true;
      g.add(bin);
      const domeGeo = track(
        new THREE.SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      );
      const dome = new THREE.Mesh(
        domeGeo,
        std(fruit.color, {
          roughness: 0.3,
          emissive: fruit.color,
          emissiveIntensity: 0.35,
        }),
      );
      dome.position.y = 1.5;
      dome.castShadow = true;
      g.add(dome);
      g.position.set(x, 0, 3.2);
      g.userData.fruit = fruit.name;
      g.traverse((o) => (o.userData.fruit = fruit.name));
      group.add(g);
      return g;
    }
    const dispStraw = makeDispenser(FRUIT.strawberry, -4.6);
    const dispBanana = makeDispenser(FRUIT.banana, 4.6);

    // Shared scoop geometry.
    const scoopGeo = track(new THREE.SphereGeometry(jarRadius * 0.6, 18, 14));

    // ---- 3D problem card (canvas sprite) ------------------------------------
    function roundRect(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function makeCard(lines, accent = "#1fa6a2") {
      const cv = document.createElement("canvas");
      cv.width = 512;
      cv.height = 200;
      const c = cv.getContext("2d");
      c.fillStyle = "rgba(10,28,52,0.95)";
      roundRect(c, 6, 6, 500, 188, 26);
      c.fill();
      c.lineWidth = 6;
      c.strokeStyle = accent;
      roundRect(c, 6, 6, 500, 188, 26);
      c.stroke();
      c.textAlign = "center";
      c.textBaseline = "middle";
      const arr = Array.isArray(lines) ? lines : [lines];
      if (arr.length === 1) {
        c.fillStyle = "#ffffff";
        c.font = "bold 64px system-ui, sans-serif";
        c.fillText(arr[0], 256, 100);
      } else {
        c.fillStyle = accent === "#1fa6a2" ? "#bfe2ff" : "#ffe6a0";
        c.font = "600 32px system-ui, sans-serif";
        c.fillText(arr[0], 256, 64);
        c.fillStyle = "#ffffff";
        c.font = "bold 58px system-ui, sans-serif";
        c.fillText(arr[1], 256, 134);
      }
      const tex = track(new THREE.CanvasTexture(cv));
      tex.minFilter = THREE.LinearFilter;
      const mat = track(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      const spr = new THREE.Sprite(mat);
      spr.scale.set(5.2, 2.0, 1);
      spr.renderOrder = 10;
      return spr;
    }
    function disposeCard(spr) {
      if (!spr) return;
      group.remove(spr);
      if (spr.material.map) spr.material.map.dispose();
      spr.material.dispose();
    }

    // The problem card is rebuilt each time text changes.
    let card = null;
    function setCard(lines, accent) {
      disposeCard(card);
      card = makeCard(lines, accent);
      card.position.set(0, 5.6, -2.9);
      group.add(card);
    }

    // ---- Round state --------------------------------------------------------
    const scoops = []; // { mesh, fruit }
    let counts = { strawberry: 0, banana: 0 };
    let round = null;
    let roundIndex = 0;
    let solved = false;
    let rateGuess = 0;

    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function clearRound() {
      scoops.forEach((s) => {
        blenderGroup.remove(s.mesh);
        s.mesh.material.dispose();
      });
      scoops.length = 0;
      counts = { strawberry: 0, banana: 0 };
      rateGuess = 0;
      solved = false;
    }

    // ---- Ratio rounds -------------------------------------------------------
    function ratioText() {
      return `${counts.strawberry} : ${counts.banana}`;
    }

    function addScoop(fruit) {
      if (solved || round.kind !== "ratio") return;
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
      const targetY = 0.7 + idx * 0.6;
      mesh.position.set(0, targetY, 0);
      blenderGroup.add(mesh);
      scoops.push({ mesh, fruit });
      // Scale-pop on spawn.
      if (!reduced) {
        mesh.scale.setScalar(0.01);
        feel.tween({
          from: 0.01,
          to: 1,
          duration: 0.28,
          onUpdate: (v) => mesh.scale.setScalar(v),
        });
        feel.burst(
          { x: 0, y: targetY + 0.4, z: 0 },
          { color: FRUIT[fruit].color, count: 12, spread: 2.4 },
        );
      }
      feel.sfx("add");
      announce(
        `Added ${FRUIT[fruit].name}. Mixture is ${counts.strawberry} strawberry to ${counts.banana} banana.`,
      );
      updateRatioLive();
    }

    function restack() {
      scoops.forEach((s, i) => {
        const y = 0.7 + i * 0.6;
        if (reduced) s.mesh.position.y = y;
        else
          feel.tween({
            from: s.mesh.position.y,
            to: y,
            duration: 0.18,
            onUpdate: (v) => (s.mesh.position.y = v),
          });
      });
    }

    function removeScoop(fruit) {
      if (solved || round.kind !== "ratio" || !scoops.length) return;
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
      feel.sfx("remove");
      restack();
      announce(
        `Removed a ${FRUIT[s.fruit].name} scoop. Mixture is ${counts.strawberry} strawberry to ${counts.banana} banana.`,
      );
      updateRatioLive();
    }

    function updateRatioLive() {
      hud.setObjective(
        `Order ${round.a} : ${round.b} (strawberry : banana) — your mixture ${ratioText()}. Add scoops, then Serve.`,
      );
    }

    function ratioMatches() {
      const { strawberry: s, banana: b } = counts;
      if (s === 0 && b === 0) return false;
      return s * round.b === b * round.a;
    }

    function serveRatio() {
      if (solved) return;
      if (!ratioMatches()) {
        const [ta, tb] = simplify(round.a, round.b);
        hud.message(`Not equivalent yet. Match ${ta} : ${tb}.`, {
          tone: "warn",
          duration: 2400,
        });
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.16);
        announce(
          `That mixture is not equivalent to the order yet. Keep the same comparison.`,
        );
        return;
      }
      win();
    }

    // ---- Unit-rate rounds ---------------------------------------------------
    function rateObjective() {
      hud.setObjective(
        `${round.prompt}  Your answer: ${round.unit}${rateGuess}. Use +/− then Serve.`,
      );
    }
    function buildRate() {
      rateGuess = 0;
      setCard([round.prompt, `${round.unit}${rateGuess}`], "#4f8fd0");
      rateObjective();
      announce(
        `Unit rate round. ${round.prompt} Use up and down to change your answer, then serve to lock it in.`,
      );
      if (cfg.hints)
        hud.message("Divide the total by the number of servings.", {
          tone: "info",
          duration: 2600,
        });
    }
    function adjustRate(delta) {
      if (solved || round.kind !== "rate") return;
      rateGuess = Math.max(0, rateGuess + delta);
      setCard([round.prompt, `${round.unit}${rateGuess}`], "#4f8fd0");
      rateObjective();
      feel.sfx("select");
      announce(`Answer ${round.unit}${rateGuess}.`);
    }
    function serveRate() {
      if (solved) return;
      if (rateGuess !== round.answer) {
        hud.message(
          `${round.unit}${rateGuess} is not the unit rate. Try ${round.total} ÷ ${round.count}.`,
          { tone: "warn", duration: 2400 },
        );
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.16);
        announce(
          `That is not the unit rate. Divide ${round.total} by ${round.count}.`,
        );
        return;
      }
      win();
    }

    // ---- Win / progression --------------------------------------------------
    function win() {
      solved = true;
      const base = round.kind === "rate" ? 25 : 20;
      const pts = base + (level === 2 ? 10 : 0);
      onScore(pts, {
        round: roundIndex + 1,
        kind: round.kind,
        target: round.kind === "rate" ? round.answer : `${round.a}:${round.b}`,
      });
      feel.sfx("correct");
      if (!reduced) {
        feel.shake(0.28);
        feel.burst(
          { x: 0, y: 3.4, z: 0 },
          { color: COLORS.ok, count: 42, spread: 4.5 },
        );
        // Celebratory jar pop.
        feel.tween({
          from: 1,
          to: 1.12,
          duration: 0.18,
          onUpdate: (v) => blenderGroup.scale.setScalar(v),
          onComplete: () =>
            feel.tween({
              from: 1.12,
              to: 1,
              duration: 0.22,
              onUpdate: (v) => blenderGroup.scale.setScalar(v),
            }),
        });
      }
      if (round.kind === "rate") {
        hud.message(`Correct! ${round.unit}${round.answer} per one. +${pts}`, {
          tone: "ok",
          duration: 2400,
        });
        announce(
          `Correct! The unit rate is ${round.unit}${round.answer}. You earned ${pts} points.`,
        );
      } else {
        hud.message(`Served! ${ratioText()} matches the order. +${pts}`, {
          tone: "ok",
          duration: 2400,
        });
        announce(
          `Smoothie served. ${counts.strawberry} to ${counts.banana} is equivalent to the order. You earned ${pts} points.`,
        );
      }
      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          finish();
        }
      }, 2400);
    }

    function finish() {
      hud.setObjective("Stand closed — every customer served. Great work!");
      hud.message("All orders complete! 🎉", { tone: "ok", duration: 0 });
      setCard(["Smoothie Stand", "All complete! 🎉"], "#4aa978");
      feel.sfx("fanfare");
      if (!reduced) {
        [0, 200, 420].forEach((ms, i) =>
          later(
            () =>
              feel.burst(
                { x: (i - 1) * 3, y: 4, z: 0 },
                {
                  color: [COLORS.strawberry, COLORS.banana, COLORS.teal][i],
                  count: 50,
                  spread: 6,
                },
              ),
            ms,
          ),
        );
      }
      announce("All orders complete. Great work at the Smoothie Stand.");
    }

    function startRound() {
      clearRound();
      round = cfg.rounds[roundIndex];
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      renderControls();
      feel.sfx("pop");
      if (round.kind === "rate") {
        buildRate();
        return;
      }
      const targetTxt =
        round.baseLabel != null
          ? `${round.a} : ${round.b}  (${round.baseLabel})`
          : `${round.a} : ${round.b}`;
      setCard(["Order — strawberry : banana", targetTxt], "#1fa6a2");
      updateRatioLive();
      announce(
        `New customer. Order is ${round.a} parts strawberry to ${round.b} parts banana. ` +
          `Add scoops to match the ratio, then serve.`,
      );
      if (cfg.hints)
        hud.message(`Order: ${targetTxt}. Add scoops to match.`, {
          tone: "info",
          duration: 3000,
        });
    }

    // ---- Input --------------------------------------------------------------
    function onPress(name) {
      if (!round) return;
      if (round.kind === "rate") {
        if (name === "up" || name === "right") adjustRate(1);
        else if (name === "down" || name === "left") adjustRate(-1);
        else if (name === "action" || name === "confirm") serveRate();
        return;
      }
      if (name === "left" || name === "up") addScoop("strawberry");
      else if (name === "right" || name === "down") addScoop("banana");
      else if (name === "action") serveRatio();
      else if (name === "confirm") removeScoop();
    }

    function onTapWorld() {
      if (solved || !round) return;
      if (round.kind === "rate") {
        adjustRate(input.state.ndc.x >= 0 ? 1 : -1);
        return;
      }
      const hits = input.raycast(
        camera,
        [dispStraw, dispBanana, jar, jarBase],
        true,
      );
      if (!hits.length) return;
      const fruit = hits[0].object.userData.fruit;
      if (fruit) addScoop(fruit);
      else serveRatio();
    }

    let unbindPress = null;
    let unbindTap = null;
    let unbindFrame = null;

    // ---- On-screen controls -------------------------------------------------
    function injectControlStyles() {
      if (document.getElementById("smoothie-controls-styles")) return;
      const st = document.createElement("style");
      st.id = "smoothie-controls-styles";
      st.textContent = `
        .smoothie-controls{position:absolute;left:0;right:0;bottom:14px;display:flex;
          gap:8px;justify-content:center;flex-wrap:wrap;padding:0 12px;z-index:25;
          pointer-events:none;}
        .smoothie-btn{pointer-events:auto;font:700 1rem/1 system-ui,sans-serif;
          min-width:54px;min-height:48px;padding:10px 14px;border-radius:12px;
          border:1px solid rgba(255,255,255,.25);background:rgba(18,53,91,.92);
          color:#fff;cursor:pointer;backdrop-filter:blur(3px);
          box-shadow:0 2px 8px rgba(0,0,0,.25);transition:transform .12s,background .12s;}
        .smoothie-btn:hover{background:rgba(31,166,162,.95);}
        .smoothie-btn:active{transform:translateY(1px) scale(.97);}
        .smoothie-btn.serve{background:rgba(15,169,88,.95);}
        .smoothie-btn.minus{background:rgba(217,121,93,.92);}`;
      document.head.appendChild(st);
    }
    const controlHost = renderer.domElement.parentElement || document.body;
    const controlBar = document.createElement("div");
    controlBar.className = "smoothie-controls";
    function mkBtn(label, aria, cls, onClick) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "smoothie-btn" + (cls ? " " + cls : "");
      b.textContent = label;
      b.setAttribute("aria-label", aria);
      b.addEventListener("click", (e) => {
        e.preventDefault();
        onClick();
      });
      return b;
    }
    function renderControls() {
      controlBar.textContent = "";
      if (!round) return;
      if (round.kind === "rate") {
        controlBar.append(
          mkBtn("− 1", "Lower your answer by one", "minus", () =>
            adjustRate(-1),
          ),
          mkBtn("+ 1", "Raise your answer by one", "", () => adjustRate(1)),
          mkBtn("Serve", "Serve and check your answer", "serve", () =>
            serveRate(),
          ),
        );
      } else {
        controlBar.append(
          mkBtn("🍓 +", "Add a strawberry scoop", "", () =>
            addScoop("strawberry"),
          ),
          mkBtn("🍓 −", "Remove a strawberry scoop", "minus", () =>
            removeScoop("strawberry"),
          ),
          mkBtn("🍌 +", "Add a banana scoop", "", () => addScoop("banana")),
          mkBtn("🍌 −", "Remove a banana scoop", "minus", () =>
            removeScoop("banana"),
          ),
          mkBtn("Serve", "Serve the smoothie", "serve", () => serveRatio()),
        );
      }
    }

    return {
      start() {
        // Animated camera intro: sweep into framing.
        const finalPos = new THREE.Vector3(0, 6.5, 12);
        camera.lookAt(0, 2, 0);
        if (reduced) {
          camera.position.copy(finalPos);
          feel.syncCamera();
        } else {
          const startPos = new THREE.Vector3(7, 9, 14);
          camera.position.copy(startPos);
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.1,
            onUpdate: (v) => {
              camera.position.lerpVectors(startPos, finalPos, v);
              camera.lookAt(0, 2, 0);
            },
            onComplete: () => feel.syncCamera(),
          });
        }

        injectControlStyles();
        controlHost.appendChild(controlBar);

        startRound();

        unbindPress = input.onPress(onPress);
        unbindTap = input.onTap(onTapWorld);

        // Idle motion (gated on reduced motion).
        if (!reduced) {
          unbindFrame = onFrame((dt, t) => {
            blenderGroup.rotation.y = Math.sin(t * 0.4) * 0.06;
            board.position.y = 4.6 + Math.sin(t * 1.2) * 0.05;
            if (card) card.position.y = 5.6 + Math.sin(t * 1.4) * 0.06;
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        if (controlBar.parentNode)
          controlBar.parentNode.removeChild(controlBar);
        timers.forEach(clearTimeout);
        timers.length = 0;
        disposeCard(card);
        scoops.forEach((s) => s.mesh.material.dispose());
        scoops.length = 0;
        scene.remove(group);
        disposables.forEach((d) => d.dispose && d.dispose());
      },
    };
  },
};
