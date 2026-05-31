import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";

// ============================================================================
// Unit 6 — "Expression Engine"  (CCSS 6.EE.A.1–4)
// Write, evaluate, and identify equivalent expressions. The player feeds
// number / variable / operation blocks into a glowing machine to build an
// expression that hits a target value (or is equivalent for every x).
// Theme + math preserved from the original "Expression Machine"; rebuilt to
// the premium visual + interaction bar.
// ============================================================================

const COLORS = {
  bg: 0x12203a,
  stage: 0x1a2c4d,
  stageEdge: 0x33508a,
  rail: 0x243a63,
  slot: 0x1c3357,
  slotActive: 0xf2c15b,
  number: 0x1fa6a2,
  variable: 0x9b78e0,
  operation: 0xe6973f,
  paren: 0x4f8fd0,
  amber: 0xf2c15b,
  ok: 0x2bd17e,
  bad: 0xe05a3a,
  card: 0x0d1b33,
};

const SLOT_W = 1.55;

// ---- Token helpers ---------------------------------------------------------
// A token is { type, text, value }; type ∈ "num" | "var" | "op" | "paren".
function numTok(n) {
  return { type: "num", text: String(n), value: n };
}
function varTok() {
  return { type: "var", text: "x", value: null };
}
function opTok(o) {
  return { type: "op", text: o, value: o };
}
function parenTok(p) {
  return { type: "paren", text: p, value: p };
}

// Palette of blocks the player can place, by level.
function makePalette(level) {
  const base = [
    numTok(1),
    numTok(2),
    numTok(3),
    numTok(4),
    numTok(5),
    varTok(),
    opTok("+"),
    opTok("-"),
    opTok("×"),
  ];
  if (level === 2) {
    base.push(numTok(6), numTok(8), opTok("^"), parenTok("("), parenTok(")"));
  } else {
    base.push(numTok(6), numTok(10));
  }
  return base;
}

// Rounds. Level 1 = scaffolded with hints + smaller numbers (6–8 rounds).
// Level 2 = enrichment: parentheses, exponents, equivalence, bigger numbers.
function makeRounds(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        {
          mode: "eval",
          x: 5,
          expr: [numTok(2), opTok("×"), varTok(), opTok("+"), numTok(3)],
          target: 13,
          prompt: "Evaluate 2x + 3 when x = 5.",
          hint: "Multiply first: 2 × 5 = 10. Then add 3 → 13.",
        },
        {
          mode: "build",
          x: 4,
          target: 14,
          prompt: "Build an expression equal to 14 when x = 4.",
          hint: "Try 3 × x + 2.  3·4 = 12, then 12 + 2 = 14.",
        },
        {
          mode: "eval",
          x: 6,
          expr: [varTok(), opTok("+"), varTok()],
          target: 12,
          prompt: "Evaluate x + x when x = 6.",
          hint: "x + x is the same as 2x. 6 + 6 = 12.",
        },
        {
          mode: "build",
          x: 3,
          target: 10,
          prompt: "Build an expression equal to 10 when x = 3.",
          hint: "Try 3 × x + 1.  3·3 = 9, then + 1 = 10.",
        },
        {
          mode: "eval",
          x: 4,
          expr: [numTok(5), opTok("×"), varTok(), opTok("-"), numTok(2)],
          target: 18,
          prompt: "Evaluate 5x − 2 when x = 4.",
          hint: "Multiply first: 5 × 4 = 20. Then subtract 2 → 18.",
        },
        {
          mode: "build",
          x: 5,
          target: 16,
          prompt: "Build an expression equal to 16 when x = 5.",
          hint: "Try 3 × x + 1.  3·5 = 15, then + 1 = 16.",
        },
        {
          mode: "eval",
          x: 2,
          expr: [numTok(4), opTok("×"), varTok(), opTok("+"), numTok(4)],
          target: 12,
          prompt: "Evaluate 4x + 4 when x = 2.",
          hint: "Multiply first: 4 × 2 = 8. Then add 4 → 12.",
        },
      ],
    };
  }
  return {
    hints: false,
    rounds: [
      {
        mode: "eval",
        x: 4,
        expr: [
          numTok(3),
          parenTok("("),
          varTok(),
          opTok("+"),
          numTok(2),
          parenTok(")"),
        ],
        target: 18,
        prompt: "Evaluate 3(x + 2) when x = 4.",
        hint: "Parentheses first: 4 + 2 = 6, then 3 × 6 = 18.",
      },
      {
        mode: "equivalent",
        x: null,
        targetExpr: [
          numTok(2),
          parenTok("("),
          varTok(),
          opTok("+"),
          numTok(3),
          parenTok(")"),
        ],
        prompt: "Build an expression equivalent to 2(x + 3) for every x.",
        hint: "Distribute: 2·x + 2·3 = 2x + 6.",
      },
      {
        mode: "build",
        x: 2,
        target: 12,
        prompt: "Build an expression equal to 12 when x = 2 using an exponent.",
        hint: "x^3 means x·x·x = 8, then + 4 = 12 (order of operations).",
      },
      {
        mode: "eval",
        x: 3,
        expr: [varTok(), opTok("^"), numTok(2), opTok("+"), numTok(5)],
        target: 14,
        prompt: "Evaluate x² + 5 when x = 3.",
        hint: "Exponent first: 3² = 9, then + 5 = 14.",
      },
      {
        mode: "equivalent",
        x: null,
        targetExpr: [
          numTok(4),
          parenTok("("),
          varTok(),
          opTok("-"),
          numTok(1),
          parenTok(")"),
        ],
        prompt: "Build an expression equivalent to 4(x − 1) for every x.",
        hint: "Distribute: 4·x − 4·1 = 4x − 4.",
      },
      {
        mode: "eval",
        x: 5,
        expr: [
          numTok(2),
          parenTok("("),
          varTok(),
          opTok("+"),
          numTok(1),
          parenTok(")"),
          opTok("+"),
          varTok(),
        ],
        target: 17,
        prompt: "Evaluate 2(x + 1) + x when x = 5.",
        hint: "Parentheses: 5 + 1 = 6, then 2 × 6 = 12, then + 5 = 17.",
      },
      {
        mode: "build",
        x: 3,
        target: 20,
        prompt: "Build an expression equal to 20 when x = 3 (multi-step).",
        hint: "Try 6 × x + 2.  6·3 = 18, then + 2 = 20.",
      },
    ],
  };
}

// ---- Pure math: evaluate a token list at a given x (order of operations) ----
function evaluate(tokens, x) {
  const rpn = toRPN(tokens, x);
  if (!rpn) return { ok: false, value: NaN };
  const st = [];
  for (const t of rpn) {
    if (typeof t === "number") {
      st.push(t);
    } else {
      const b = st.pop();
      const a = st.pop();
      if (a === undefined || b === undefined) return { ok: false, value: NaN };
      if (t === "+") st.push(a + b);
      else if (t === "-") st.push(a - b);
      else if (t === "×") st.push(a * b);
      else if (t === "^") st.push(Math.pow(a, b));
      else return { ok: false, value: NaN };
    }
  }
  if (st.length !== 1 || !Number.isFinite(st[0]))
    return { ok: false, value: NaN };
  return { ok: true, value: st[0] };
}

const PREC = { "+": 1, "-": 1, "×": 2, "^": 3 };
const RIGHT = { "^": true };

function toRPN(tokens, x) {
  const out = [];
  const ops = [];
  let prevType = null;

  const popFor = (o) => {
    while (
      ops.length &&
      ops[ops.length - 1] !== "(" &&
      (PREC[ops[ops.length - 1]] > PREC[o] ||
        (PREC[ops[ops.length - 1]] === PREC[o] && !RIGHT[o]))
    ) {
      out.push(ops.pop());
    }
  };

  const valueLikePrev = () =>
    prevType === "num" || prevType === "var" || prevType === "rparen";
  const implicitMul = () => {
    popFor("×");
    ops.push("×");
  };

  for (const tk of tokens) {
    if (tk.type === "num") {
      if (valueLikePrev()) implicitMul();
      out.push(tk.value);
      prevType = "num";
    } else if (tk.type === "var") {
      if (valueLikePrev()) implicitMul();
      out.push(x);
      prevType = "var";
    } else if (tk.type === "op") {
      if (prevType === null || prevType === "op" || prevType === "lparen")
        return null;
      popFor(tk.value);
      ops.push(tk.value);
      prevType = "op";
    } else if (tk.type === "paren") {
      if (tk.value === "(") {
        if (valueLikePrev()) implicitMul();
        ops.push("(");
        prevType = "lparen";
      } else {
        if (prevType === null || prevType === "op" || prevType === "lparen")
          return null;
        while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
        if (!ops.length) return null;
        ops.pop();
        prevType = "rparen";
      }
    }
  }
  if (prevType === "op" || prevType === "lparen") return null;
  while (ops.length) {
    const o = ops.pop();
    if (o === "(") return null;
    out.push(o);
  }
  return out;
}

// Two expressions are equivalent if they evaluate equal across sampled x.
function equivalent(a, b) {
  const samples = [-3, -1, 0, 2, 5, 7];
  for (const x of samples) {
    const ra = evaluate(a, x);
    const rb = evaluate(b, x);
    if (!ra.ok || !rb.ok) return false;
    if (Math.abs(ra.value - rb.value) > 1e-9) return false;
  }
  return true;
}

// Pretty-print a token list as a math string.
function exprString(tokens) {
  let s = "";
  tokens.forEach((t, i) => {
    const prev = tokens[i - 1];
    const spaceBefore =
      i > 0 &&
      t.type !== "paren" &&
      (prev.type !== "paren" || prev.value === ")");
    if (spaceBefore && !(t.type === "paren" && t.value === ")")) s += " ";
    s += t.text;
  });
  return s.replace(/\(\s/g, "(").replace(/\s\)/g, ")").trim() || "( empty )";
}

function spoken(token) {
  if (token.type === "var") return "variable x";
  if (token.type === "num") return `number ${token.text}`;
  if (token.type === "paren")
    return token.value === "(" ? "open parenthesis" : "close parenthesis";
  const names = {
    "+": "plus",
    "-": "minus",
    "×": "times",
    "^": "to the power of",
  };
  return names[token.value] || token.text;
}

function tokenColor(t) {
  if (t.type === "num") return COLORS.number;
  if (t.type === "var") return COLORS.variable;
  if (t.type === "op") return COLORS.operation;
  return COLORS.paren;
}

export default {
  id: "unit-6-expression-engine",
  vocab: [
    {
      term: "Expression",
      definition:
        "A math phrase with numbers, variables, and operations — but no equals sign.",
      emoji: "🧮",
    },
    {
      term: "Variable",
      definition: "A letter like x that stands for a number we can change.",
      emoji: "🔤",
    },
    {
      term: "Coefficient",
      definition: "The number multiplied by a variable, like the 3 in 3x.",
      emoji: "✖️",
    },
    {
      term: "Term",
      definition: "A single part of an expression, separated by + or − signs.",
      emoji: "🧩",
    },
    {
      term: "Evaluate",
      definition:
        "To find the value of an expression by putting in a number for the variable.",
      emoji: "🎯",
    },
    {
      term: "Equivalent",
      definition:
        "Two expressions that always give the same value for every x.",
      emoji: "⚖️",
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

    const cfg = makeRounds(level);
    const palette = makePalette(level);
    const reduced = feel.reducedMotion;

    const group = new THREE.Group();
    scene.add(group);

    // Resources to dispose on teardown.
    const ownedGeo = [];
    const ownedMat = [];
    const ownedTex = [];
    const sprites = [];
    const track = (g, m) => {
      if (g) ownedGeo.push(g);
      if (m) (Array.isArray(m) ? m : [m]).forEach((x) => ownedMat.push(x));
    };

    // ---- Stage / ground (receives shadows) ---------------------------------
    const stageGeo = new RoundedBoxGeometry(SLOT_W * 8.6, 0.6, 6.2, 4, 0.25);
    const stageMat = new THREE.MeshStandardMaterial({
      color: COLORS.stage,
      roughness: 0.78,
      metalness: 0.12,
    });
    const stage = new THREE.Mesh(stageGeo, stageMat);
    stage.position.set(0, -0.5, 0.6);
    stage.receiveShadow = true;
    group.add(stage);
    track(stageGeo, stageMat);

    // Glowing edge strip for theme cohesion.
    const edgeGeo = new RoundedBoxGeometry(SLOT_W * 8.7, 0.12, 6.3, 3, 0.06);
    const edgeMat = new THREE.MeshStandardMaterial({
      color: COLORS.stageEdge,
      emissive: COLORS.stageEdge,
      emissiveIntensity: 0.5,
      roughness: 0.4,
      metalness: 0.3,
    });
    const edge = new THREE.Mesh(edgeGeo, edgeMat);
    edge.position.set(0, -0.74, 0.6);
    group.add(edge);
    track(edgeGeo, edgeMat);

    // ---- The Engine back-wall (where the problem card sits) -----------------
    const wallGeo = new RoundedBoxGeometry(SLOT_W * 8.2, 3.4, 0.5, 4, 0.22);
    const wallMat = new THREE.MeshStandardMaterial({
      color: COLORS.card,
      roughness: 0.85,
      metalness: 0.2,
    });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 1.5, -2.6);
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);
    track(wallGeo, wallMat);

    // Two emissive "intake" pylons that pulse on activity.
    const pylons = [];
    for (const sx of [-1, 1]) {
      const pg = new RoundedBoxGeometry(0.5, 2.4, 0.5, 4, 0.12);
      const pm = new THREE.MeshStandardMaterial({
        color: COLORS.rail,
        emissive: COLORS.number,
        emissiveIntensity: 0.35,
        roughness: 0.5,
        metalness: 0.4,
      });
      const py = new THREE.Mesh(pg, pm);
      py.position.set(sx * SLOT_W * 4.1, 0.5, -1.4);
      py.castShadow = true;
      group.add(py);
      pylons.push(py);
      track(pg, pm);
    }

    // ---- Problem card (3D, always shows the math) ---------------------------
    const problemSprite = makeLabel("", {
      THREE,
      scale: 1.0,
      fontSize: 72,
      background: "rgba(13,27,51,0.92)",
      color: "#ffffff",
    });
    problemSprite.position.set(0, 2.1, -2.3);
    group.add(problemSprite);
    sprites.push(problemSprite);

    const liveSprite = makeLabel("", {
      THREE,
      scale: 0.72,
      fontSize: 60,
      background: "rgba(31,166,162,0.22)",
      color: "#cdeff0",
    });
    liveSprite.position.set(0, 1.15, -2.3);
    group.add(liveSprite);
    sprites.push(liveSprite);

    // ---- Slot row (the expression being built) ------------------------------
    const MAX_SLOTS = level === 2 ? 8 : 6;
    const slotGeo = new RoundedBoxGeometry(SLOT_W * 0.92, 0.16, 1.5, 3, 0.07);
    const slots = [];
    const slotX = (i) => (i - (MAX_SLOTS - 1) / 2) * SLOT_W;
    for (let i = 0; i < MAX_SLOTS; i++) {
      const m = new THREE.MeshStandardMaterial({
        color: COLORS.slot,
        emissive: COLORS.slot,
        emissiveIntensity: 0.15,
        roughness: 0.6,
        metalness: 0.2,
        transparent: true,
        opacity: 0.65,
      });
      const mesh = new THREE.Mesh(slotGeo, m);
      mesh.position.set(slotX(i), 0.05, 0.2);
      mesh.receiveShadow = true;
      group.add(mesh);
      slots.push(mesh);
      ownedMat.push(m);
    }
    ownedGeo.push(slotGeo);

    // ---- Palette row (blocks to choose) -------------------------------------
    const blockGeo = new RoundedBoxGeometry(SLOT_W * 0.82, 0.62, 1.05, 4, 0.14);
    ownedGeo.push(blockGeo);
    const palX = (i) => (i - (palette.length - 1) / 2) * (SLOT_W * 0.86);
    const palZ = 2.7;
    const palMeshes = [];

    function makeFaceTexture(text) {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 256;
      const c = cv.getContext("2d");
      c.fillStyle = "rgba(255,255,255,0.0)";
      c.fillRect(0, 0, 256, 256);
      c.fillStyle = "#ffffff";
      c.font = "bold 168px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 128, 140);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      if ("colorSpace" in tex) tex.colorSpace = THREE.SRGBColorSpace;
      ownedTex.push(tex);
      return tex;
    }

    function makeBlockMaterials(token, emissiveBoost = 0.0) {
      const col = tokenColor(token);
      const side = () =>
        new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.28 + emissiveBoost,
          roughness: 0.42,
          metalness: 0.35,
        });
      const faceTex = makeFaceTexture(token.text);
      const face = () =>
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          emissive: col,
          emissiveIntensity: 0.12 + emissiveBoost,
          map: faceTex,
          roughness: 0.35,
          metalness: 0.1,
        });
      // BoxGeometry face order: +x,-x,+y,-y,+z,-z. Label on top (+y) and front (+z).
      const mats = [side(), side(), face(), side(), face(), side()];
      mats.forEach((m) => ownedMat.push(m));
      return mats;
    }

    palette.forEach((t, i) => {
      const mesh = new THREE.Mesh(blockGeo, makeBlockMaterials(t));
      mesh.position.set(palX(i), 0.45, palZ);
      mesh.castShadow = true;
      mesh.userData.token = t;
      mesh.userData.baseY = 0.45;
      group.add(mesh);
      palMeshes.push(mesh);
    });

    // ---- Selection cursor over palette --------------------------------------
    let palIndex = 0;
    const cursorGeo = new RoundedBoxGeometry(SLOT_W * 0.9, 0.12, 1.25, 3, 0.06);
    const cursorMat = new THREE.MeshStandardMaterial({
      color: COLORS.slotActive,
      emissive: COLORS.slotActive,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.92,
    });
    const palCursor = new THREE.Mesh(cursorGeo, cursorMat);
    palCursor.position.set(palX(0), 0.86, palZ);
    group.add(palCursor);
    track(cursorGeo, cursorMat);

    // ---- State --------------------------------------------------------------
    const placed = []; // { token, mesh }
    let roundIndex = 0;
    let round = null;
    let solved = false;
    let started = false;
    let finished = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    const timers = [];
    const unbinders = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function disposeBlockMesh(m) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mt) => {
        if (mt.map) mt.map.dispose();
        mt.dispose();
      });
    }

    function clearPlaced() {
      placed.forEach((p) => {
        group.remove(p.mesh);
        disposeBlockMesh(p.mesh);
      });
      placed.length = 0;
      slots.forEach((s) => {
        s.material.opacity = 0.65;
        s.material.emissiveIntensity = 0.15;
      });
    }

    function currentTokens() {
      return placed.map((p) => p.token);
    }

    function liveValue() {
      const toks = currentTokens();
      if (!toks.length) return null;
      const x = round.x == null ? 0 : round.x;
      const r = evaluate(toks, x);
      return r.ok ? r.value : null;
    }

    function refreshLive() {
      const toks = currentTokens();
      const str = exprString(toks);
      if (round.mode === "equivalent") {
        updateLabel(liveSprite, `Build: ${str}`);
      } else {
        const v = liveValue();
        updateLabel(liveSprite, `${str} = ${v == null ? "?" : v}`);
      }
    }

    function updateObjective() {
      const str = exprString(currentTokens());
      if (round.mode === "equivalent") {
        hud.setObjective(`${round.prompt}  Your build: ${str} — then submit.`);
      } else {
        const v = liveValue();
        hud.setObjective(
          `${round.prompt}  Build: ${str} = ${v == null ? "?" : v} | Target ${round.target} — then submit.`,
        );
      }
      refreshLive();
    }

    // Camera intro: tween from a high wide shot into the play framing.
    function cameraIntro() {
      const target = { x: 0, y: 6.0, z: 7.8 };
      const look = new THREE.Vector3(0, 0.6, 0.2);
      if (reduced) {
        camera.position.set(target.x, target.y, target.z);
        camera.lookAt(look);
        feel.syncCamera();
        return;
      }
      camera.position.set(0, 9.5, 12.5);
      camera.lookAt(look);
      const start = camera.position.clone();
      feel.tween({
        from: 0,
        to: 1,
        duration: 1.4,
        onUpdate: (v) => {
          camera.position.lerpVectors(
            start,
            new THREE.Vector3(target.x, target.y, target.z),
            v,
          );
          camera.lookAt(look);
        },
        onComplete: () => feel.syncCamera(),
      });
    }

    // ---- Round flow ---------------------------------------------------------
    function startRound() {
      clearPlaced();
      solved = false;
      round = cfg.rounds[roundIndex];

      hud.setLevel(level === 2 ? "Level 2 — Enrichment" : "Level 1 — Support");
      hud.setProgress(roundIndex, cfg.rounds.length);

      let cardText = round.prompt;
      if (round.mode === "eval" && round.expr) {
        cardText = `${exprString(round.expr)}   (x = ${round.x})`;
      } else if (round.mode === "equivalent") {
        cardText = `≡  ${exprString(round.targetExpr)}`;
      } else if (round.mode === "build") {
        cardText = `Target = ${round.target}   (x = ${round.x})`;
      }
      updateLabel(problemSprite, cardText);

      updateObjective();
      feel.sfx("select");

      let intro = `Round ${roundIndex + 1} of ${cfg.rounds.length}. ${round.prompt}`;
      if (round.mode === "eval" && round.expr) {
        intro += ` The engine shows ${exprString(round.expr)}.`;
      }
      announce(intro);

      if (cfg.hints && round.hint) {
        hud.message(round.hint, { tone: "info", duration: 4400 });
      } else {
        hud.message(round.prompt, { tone: "info", duration: 2600 });
      }

      // Scale-pop the problem card.
      if (!reduced) {
        problemSprite.scale.multiplyScalar(0.6);
        const baseX = problemSprite.scale.x;
        const baseY = problemSprite.scale.y;
        feel.tween({
          from: 0.6,
          to: 1,
          duration: 0.45,
          onUpdate: (v) =>
            problemSprite.scale.set((baseX / 0.6) * v, (baseY / 0.6) * v, 1),
        });
      }
    }

    function placeToken(token) {
      if (solved || finished) return;
      if (placed.length >= MAX_SLOTS) {
        hud.message("The engine is full. Submit or remove a block.", {
          tone: "warn",
          duration: 1800,
        });
        feel.sfx("wrong");
        if (!reduced) feel.shake(0.12);
        return;
      }
      const i = placed.length;
      const mesh = new THREE.Mesh(blockGeo, makeBlockMaterials(token, 0.15));
      mesh.castShadow = true;
      mesh.position.set(slotX(i), 0.36, 0.2);
      group.add(mesh);
      placed.push({ token, mesh });

      slots[i].material.opacity = 0.92;
      slots[i].material.emissiveIntensity = 0.5;

      feel.sfx("add");
      feel.burst(
        { x: slotX(i), y: 0.8, z: 0.2 },
        { color: tokenColor(token), count: 12, spread: 2.4 },
      );

      // Drop-in scale pop.
      if (!reduced) {
        mesh.scale.set(0.2, 0.2, 0.2);
        feel.tween({
          from: 0.2,
          to: 1,
          duration: 0.28,
          onUpdate: (v) => mesh.scale.set(v, v, v),
        });
      }

      announce(`Placed ${spoken(token)}.`);
      updateObjective();
    }

    function removeLast() {
      if (solved || finished || !placed.length) return;
      const p = placed.pop();
      group.remove(p.mesh);
      disposeBlockMesh(p.mesh);
      slots[placed.length].material.opacity = 0.65;
      slots[placed.length].material.emissiveIntensity = 0.15;
      feel.sfx("remove");
      announce(`Removed ${spoken(p.token)}.`);
      updateObjective();
    }

    function submit() {
      if (solved || finished) return;
      const toks = currentTokens();
      if (!toks.length) {
        hud.message("Place some blocks first.", {
          tone: "warn",
          duration: 1600,
        });
        feel.sfx("wrong");
        return;
      }

      if (round.mode === "equivalent") {
        const r0 = evaluate(toks, 0);
        if (!r0.ok) {
          rejectExpr(
            "That is not a complete expression. Check operations and parentheses.",
          );
          return;
        }
        if (equivalent(toks, round.targetExpr)) win("equivalent");
        else
          rejectExpr("Not equivalent yet. Distribute and combine like terms.");
        return;
      }

      const r = evaluate(toks, round.x);
      if (!r.ok) {
        rejectExpr("That is not a complete expression. Check your operations.");
        return;
      }
      if (r.value === round.target) win("value");
      else
        rejectExpr(
          `That evaluates to ${r.value}, not ${round.target}. Remember order of operations.`,
        );
    }

    function rejectExpr(msg) {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      else hud.message(msg, { tone: "warn", duration: 2400 });
      feel.sfx("wrong");
      if (!reduced) feel.shake(0.16);
      announce(msg);
    }

    function win(kind) {
      solved = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);

      const base = 20;
      const levelBonus = level === 2 ? 10 : 0;
      const lean = placed.length <= 5 ? 10 : 0;
      const pts = base + levelBonus + lean;
      onScore(pts, {
        round: roundIndex + 1,
        mode: round.mode,
        blocks: placed.length,
      });

      feel.sfx("correct");
      if (!reduced) feel.shake(0.26);
      feel.burst(
        { x: 0, y: 1.4, z: 0.2 },
        { color: COLORS.amber, count: 44, spread: 5 },
      );

      // Light the placed blocks + pylons.
      placed.forEach((p) => {
        const mats = Array.isArray(p.mesh.material)
          ? p.mesh.material
          : [p.mesh.material];
        mats.forEach((m) => {
          m.emissive = new THREE.Color(COLORS.ok);
          m.emissiveIntensity = 0.7;
        });
      });
      pylons.forEach((py) => {
        py.material.emissive = new THREE.Color(COLORS.ok);
        py.material.emissiveIntensity = 0.9;
      });

      const leanMsg = lean ? ` Efficient build +${lean}!` : "";
      const okMsg = `Engine accepted it! +${pts}${leanMsg}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2400 });
      else hud.message(okMsg, { tone: "ok", duration: 2400 });

      const detail =
        kind === "equivalent"
          ? "The expressions are equivalent for every x."
          : `It evaluates to exactly ${round.target} when x = ${round.x}.`;
      announce(`Correct! ${detail} You earned ${pts} points.`);

      later(() => {
        // Reset pylon glow.
        pylons.forEach((py) => {
          py.material.emissive = new THREE.Color(COLORS.number);
          py.material.emissiveIntensity = 0.35;
        });
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          finish();
        }
      }, 2600);
    }

    function finish() {
      finished = true;
      hud.setProgress(cfg.rounds.length, cfg.rounds.length);
      hud.setObjective(
        `All expressions built — ${solvedCount} of ${cfg.rounds.length} correct, best streak ${bestStreak}. Great work, Engineer!`,
      );
      hud.message("All rounds complete! 🎉", { tone: "ok", duration: 0 });
      updateLabel(problemSprite, "ENGINE COMPLETE");
      updateLabel(
        liveSprite,
        `${solvedCount} / ${cfg.rounds.length} • streak ${bestStreak}`,
      );
      feel.sfx("fanfare");
      announce(
        `All rounds complete. You built ${solvedCount} of ${cfg.rounds.length} with a best streak of ${bestStreak}. Great work, Engineer.`,
      );
      // Confetti cascade.
      if (!reduced) {
        [0, 220, 440, 680].forEach((ms) =>
          later(
            () =>
              feel.burst(
                { x: (Math.random() - 0.5) * 5, y: 2.4, z: 0.2 },
                { color: COLORS.amber, count: 30, spread: 5.5 },
              ),
            ms,
          ),
        );
      }
    }

    // ---- Input --------------------------------------------------------------
    function moveCursor(d) {
      const ni = Math.max(0, Math.min(palette.length - 1, palIndex + d));
      if (ni !== palIndex) {
        palIndex = ni;
        palCursor.position.x = palX(palIndex);
        feel.sfx("select");
        announce(`Selected ${spoken(palette[palIndex])}.`);
      }
    }

    function pointerPick() {
      if (solved || finished) return;
      const hits = input.raycast(camera, palMeshes, false);
      if (hits.length) {
        const idx = palMeshes.indexOf(hits[0].object);
        if (idx >= 0) {
          palIndex = idx;
          palCursor.position.x = palX(palIndex);
          placeToken(palette[palIndex]);
        }
        return;
      }
      const placedMeshes = placed.map((p) => p.mesh);
      const ph = input.raycast(camera, placedMeshes, false);
      if (ph.length) {
        const idx = placedMeshes.indexOf(ph[0].object);
        if (idx === placed.length - 1) removeLast();
        else
          hud.message("Remove from the right end first.", {
            tone: "warn",
            duration: 1500,
          });
      }
    }

    return {
      start() {
        started = true;
        cameraIntro();
        startRound();

        // Keyboard: ←/→ select, Space place, Enter/↑ submit, ↓ remove.
        unbinders.push(
          input.onPress((name) => {
            if (name === "left") moveCursor(-1);
            else if (name === "right") moveCursor(1);
            else if (name === "action") placeToken(palette[palIndex]);
            else if (name === "confirm" || name === "up") submit();
            else if (name === "down") removeLast();
          }),
        );
        unbinders.push(input.onTap(() => pointerPick()));

        caption(
          "Build the expression with ←/→ and Space (or tap blocks). Submit with Enter. Use × before + (order of operations).",
        );
        later(() => caption(""), 6000);

        // Idle motion: cursor breathe, palette block bob, pylon shimmer.
        if (!reduced) {
          unbinders.push(
            onFrame((dt, t) => {
              const s = 1 + Math.sin(t * 3.4) * 0.1;
              palCursor.scale.set(1, s, 1);
              const sel = palMeshes[palIndex];
              palMeshes.forEach((m, i) => {
                const lift = i === palIndex ? 0.16 : 0;
                m.position.y =
                  m.userData.baseY + lift + Math.sin(t * 2 + i) * 0.02;
              });
              if (sel) sel.rotation.y = Math.sin(t * 2) * 0.12;
              const pulse = 0.3 + Math.sin(t * 2.2) * 0.12;
              if (!solved && !finished)
                pylons.forEach((py) => (py.material.emissiveIntensity = pulse));
            }),
          );
        }
      },

      dispose() {
        unbinders.forEach((u) => {
          try {
            u && u();
          } catch {
            /* noop */
          }
        });
        unbinders.length = 0;
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearPlaced();
        scene.remove(group);
        ownedGeo.forEach((g) => g.dispose());
        ownedMat.forEach((m) => m.dispose());
        ownedTex.forEach((t) => t.dispose());
        sprites.forEach((sp) => {
          if (sp.material.map) sp.material.map.dispose();
          sp.material.dispose();
        });
      },
    };
  },
};
