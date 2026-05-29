const COLORS = {
  belt: 0x18466f,
  beltLine: 0x2f6aa0,
  slot: 0x123a5b,
  slotActive: 0xf2c15b,
  number: 0x1fa6a2,
  variable: 0x8b6fc4,
  operation: 0xe09b4a,
  paren: 0x4f8fd0,
  target: 0xf2c15b,
  ok: 0x0f7c4a,
  bad: 0xb64e2f,
};

const SLOT_W = 1.7;

// A token is { type, text, value } where type is one of:
//   "num" | "var" | "op" | "paren"
// "value" for "num" is the number; for "var" it is null (filled in at x);
// for "op" it is the operator string; for "paren" it is "(" or ")".
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

// Rounds. Each: { x, target, prompt, hint, mode }
// mode "build" -> player assembles tokens to reach target at the given x.
// mode "eval"  -> a fixed expression is shown; player builds the matching
//                 numeric answer by tuning a single value block (the result).
function makeRounds(level) {
  if (level === 1) {
    return {
      hints: true,
      rounds: [
        {
          mode: "build",
          x: 4,
          target: 14,
          prompt: "Build an expression equal to 14 when x = 4.",
          hint: "Try 3 × x + 2.  3·4 = 12, then 12 + 2 = 14.",
        },
        {
          mode: "eval",
          x: 5,
          expr: [numTok(2), opTok("×"), varTok(), opTok("+"), numTok(3)],
          target: 13,
          prompt: "Evaluate 2x + 3 when x = 5.",
          hint: "Multiply first: 2 × 5 = 10. Then add 3 -> 13.",
        },
        {
          mode: "build",
          x: 3,
          target: 11,
          prompt: "Build an expression equal to 11 when x = 3.",
          hint: "Try x × x + 2.  An exponent x² means x · x = 9, then + 2 = 11.",
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
        prompt: "Evaluate 3(x + 2) when x = 4 (distributive property).",
        hint: "Parentheses first: 4 + 2 = 6, then 3 × 6 = 18.",
      },
      {
        mode: "equivalent",
        x: null,
        // Target expression to match for ALL x: 2(x+3) == 2x+6
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
        hint: "x^3 means x·x·x = 8, then + 4 = 12. (Order of operations!)",
      },
    ],
  };
}

// ---- Pure math: evaluate a token list at a given x with order of operations.
// Returns { ok, value } where ok=false on malformed input.
function evaluate(tokens, x) {
  // Tokenize into numbers/operators with x substituted; handle ^ then ×÷ then +-,
  // and parentheses via recursive shunting-style parse.
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
  let prevType = null; // for catching adjacency errors

  // Pop operators of higher/equal precedence (respecting right-associativity)
  // before pushing op `o`. Used for explicit and implicit operators.
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

  // A value-like token (number, variable, or `)`) immediately before another
  // value-like token or an opening `(` means implicit multiplication, e.g.
  // 3(x+2) -> 3 × (x+2), or 2x -> 2 × x.
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

// Equivalence check: two expressions are equivalent if they evaluate equal
// across a sample of x values (and both parse cleanly everywhere sampled).
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

export default {
  id: "unit-6-expression-machine",
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

    const cfg = makeRounds(level);
    const palette = makePalette(level);

    // ---- Static machine scene ----
    const group = new THREE.Group();
    scene.add(group);

    const belt = new THREE.Mesh(
      new THREE.BoxGeometry(SLOT_W * 6.4, 0.4, 2.4),
      new THREE.MeshStandardMaterial({ color: COLORS.belt, roughness: 0.95 }),
    );
    belt.position.set(0, -0.2, 0);
    group.add(belt);

    const beltLines = new THREE.GridHelper(
      SLOT_W * 6.4,
      8,
      COLORS.beltLine,
      COLORS.beltLine,
    );
    beltLines.position.y = 0.01;
    beltLines.scale.z = 2.4 / (SLOT_W * 6.4);
    beltLines.material.opacity = 0.4;
    beltLines.material.transparent = true;
    group.add(beltLines);

    // ---- Slot row (the expression the player builds) ----
    const MAX_SLOTS = level === 2 ? 8 : 6;
    const slotGeo = new THREE.BoxGeometry(SLOT_W * 0.9, 0.12, 1.4);
    const slotMat = new THREE.MeshStandardMaterial({
      color: COLORS.slot,
      transparent: true,
      opacity: 0.5,
    });
    const slots = [];
    const slotX = (i) => (i - (MAX_SLOTS - 1) / 2) * SLOT_W;
    for (let i = 0; i < MAX_SLOTS; i++) {
      const m = new THREE.Mesh(slotGeo, slotMat.clone());
      m.position.set(slotX(i), 0.07, 0);
      group.add(m);
      slots.push(m);
    }

    // ---- Palette row (blocks to choose from) ----
    const palGeo = new THREE.BoxGeometry(SLOT_W * 0.78, 0.5, 1.0);
    const palX = (i) => (i - (palette.length - 1) / 2) * (SLOT_W * 0.82);
    const palZ = 2.4;
    const palMeshes = [];
    const labelTextures = [];

    function tokenColor(t) {
      if (t.type === "num") return COLORS.number;
      if (t.type === "var") return COLORS.variable;
      if (t.type === "op") return COLORS.operation;
      return COLORS.paren;
    }

    function makeBlockLabel(text) {
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 128;
      const c = cv.getContext("2d");
      c.fillStyle = "#ffffff";
      c.font = "bold 84px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 64, 70);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      labelTextures.push(tex);
      return tex;
    }

    function makeBlockMesh(token, w, h, d) {
      const mat = [
        new THREE.MeshStandardMaterial({
          color: tokenColor(token),
          roughness: 0.55,
        }),
        new THREE.MeshStandardMaterial({
          color: tokenColor(token),
          roughness: 0.55,
        }),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: makeBlockLabel(token.text),
          roughness: 0.4,
        }),
        new THREE.MeshStandardMaterial({
          color: tokenColor(token),
          roughness: 0.55,
        }),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: makeBlockLabel(token.text),
          roughness: 0.4,
        }),
        new THREE.MeshStandardMaterial({
          color: tokenColor(token),
          roughness: 0.55,
        }),
      ];
      return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    }

    palette.forEach((t, i) => {
      const m = makeBlockMesh(t, SLOT_W * 0.78, 0.5, 1.0);
      m.position.set(palX(i), 0.3, palZ);
      m.userData.token = t;
      group.add(m);
      palMeshes.push(m);
    });

    // ---- Selection cursor over palette ----
    let palIndex = 0;
    const palCursor = new THREE.Mesh(
      new THREE.BoxGeometry(SLOT_W * 0.9, 0.1, 1.2),
      new THREE.MeshStandardMaterial({
        color: COLORS.slotActive,
        transparent: true,
        opacity: 0.85,
      }),
    );
    palCursor.position.set(palX(0), 0.62, palZ);
    group.add(palCursor);

    // ---- Built expression state ----
    const placed = []; // array of { token, mesh }
    let roundIndex = 0;
    let round = null;
    let solved = false;
    let streak = 0; // consecutive correct
    let bestStreak = 0;
    let solvedCount = 0;
    let unbindFrame = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function clearPlaced() {
      placed.forEach((p) => {
        group.remove(p.mesh);
        disposeMesh(p.mesh);
      });
      placed.length = 0;
      slots.forEach((s) => (s.material.opacity = 0.5));
    }

    function disposeMesh(m) {
      if (m.geometry) m.geometry.dispose();
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mt) => {
        if (mt.map) mt.map.dispose();
        mt.dispose();
      });
    }

    function currentTokens() {
      return placed.map((p) => p.token);
    }

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
      return (
        s.replace(/\(\s/g, "(").replace(/\s\)/g, ")").trim() || "( empty )"
      );
    }

    function liveValue() {
      const toks = currentTokens();
      if (!toks.length) return null;
      const x = round.x == null ? 0 : round.x;
      const r = evaluate(toks, x);
      return r.ok ? r.value : null;
    }

    function updateObjective() {
      const toks = currentTokens();
      const str = exprString(toks);
      if (round.mode === "equivalent") {
        hud.setObjective(`${round.prompt}  Your build: ${str}  — then submit.`);
        return;
      }
      const v = liveValue();
      const shown = v == null ? "?" : v;
      hud.setObjective(
        `${round.prompt}  Your build: ${str} = ${shown}  | Target ${round.target} — then submit.`,
      );
    }

    // ---- Round flow ----
    function startRound() {
      clearPlaced();
      solved = false;
      round = cfg.rounds[roundIndex];

      let intro = `Round ${roundIndex + 1}. ${round.prompt}`;
      if (round.mode === "eval" && round.expr) {
        intro += ` The machine shows ${exprString(round.expr)}.`;
      }
      announce(intro);
      hud.setLevel(level === 2 ? "Level 2 — Enrichment" : "Level 1 — Support");
      // Persistent "Step X of Y" for the whole round (both levels have 3 rounds).
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      updateObjective();

      if (cfg.hints && round.hint) {
        hud.message(round.hint, { tone: "info", duration: 4200 });
      } else {
        hud.message(round.prompt, { tone: "info", duration: 2600 });
      }
    }

    function placeToken(token) {
      if (solved) return;
      if (placed.length >= MAX_SLOTS) {
        hud.message("The belt is full. Submit or remove a block.", {
          tone: "warn",
          duration: 1800,
        });
        feel.shake(0.12);
        return;
      }
      const i = placed.length;
      const mesh = makeBlockMesh(token, SLOT_W * 0.84, 0.42, 1.2);
      mesh.position.set(slotX(i), 0.32, 0);
      group.add(mesh);
      placed.push({ token, mesh });
      slots[i].material.opacity = 0.85;
      feel.burst(
        { x: slotX(i), y: 0.7, z: 0 },
        { color: tokenColor(token), count: 10 },
      );
      announce(`Placed ${spoken(token)}.`);
      updateObjective();
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

    function removeLast() {
      if (solved || !placed.length) return;
      const p = placed.pop();
      group.remove(p.mesh);
      disposeMesh(p.mesh);
      slots[placed.length].material.opacity = 0.5;
      announce(`Removed ${spoken(p.token)}.`);
      updateObjective();
    }

    function submit() {
      if (solved) return;
      const toks = currentTokens();
      if (!toks.length) {
        hud.message("Place some blocks first.", {
          tone: "warn",
          duration: 1600,
        });
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
        if (equivalent(toks, round.targetExpr)) {
          win("equivalent");
        } else {
          rejectExpr("Not equivalent yet. Distribute and combine like terms.");
        }
        return;
      }

      const x = round.x;
      const r = evaluate(toks, x);
      if (!r.ok) {
        rejectExpr("That is not a complete expression. Check your operations.");
        return;
      }
      if (r.value === round.target) {
        win("value");
      } else {
        rejectExpr(
          `That evaluates to ${r.value}, not ${round.target}. Remember order of operations.`,
        );
      }
    }

    function rejectExpr(msg) {
      streak = 0;
      if (typeof hud.setStreak === "function") hud.setStreak(0);
      if (typeof hud.feedback === "function") hud.feedback(false, msg);
      else hud.message(msg, { tone: "warn", duration: 2400 });
      feel.shake(0.18);
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
      const lean = placed.length <= (kind === "equivalent" ? 5 : 5) ? 10 : 0;
      const pts = base + levelBonus + lean;
      onScore(pts, {
        round: roundIndex + 1,
        mode: round.mode,
        blocks: placed.length,
      });
      feel.shake(0.3);
      feel.burst(
        { x: 0, y: 1.2, z: 0 },
        { color: COLORS.target, count: 40, spread: 5 },
      );
      const leanMsg = lean ? ` Efficient build +${lean}!` : "";
      const okMsg = `Machine accepted it! +${pts}${leanMsg}`;
      if (typeof hud.feedback === "function")
        hud.feedback(true, okMsg, { duration: 2400 });
      else hud.message(okMsg, { tone: "ok", duration: 2400 });
      const detail =
        round.mode === "equivalent"
          ? "The expressions are equivalent for every x."
          : `It evaluates to exactly ${round.target} when x = ${round.x}.`;
      announce(`Correct! ${detail} You earned ${pts} points.`);

      later(() => {
        if (roundIndex < cfg.rounds.length - 1) {
          roundIndex += 1;
          startRound();
        } else {
          hud.setObjective(
            `All expressions built — ${solvedCount} of ${cfg.rounds.length}, best streak ${bestStreak}. Great work, Engineer!`,
          );
          hud.message("All rounds complete!", { tone: "ok", duration: 0 });
          announce(
            `All rounds complete. You built ${solvedCount} with a best streak of ${bestStreak}. Great work, Engineer.`,
          );
        }
      }, 2600);
    }

    // ---- Cursor / input ----
    function moveCursor(d) {
      const ni = Math.max(0, Math.min(palette.length - 1, palIndex + d));
      if (ni !== palIndex) {
        palIndex = ni;
        palCursor.position.x = palX(palIndex);
        announce(`Selected ${spoken(palette[palIndex])}.`);
      }
    }

    function pickPalette() {
      placeToken(palette[palIndex]);
    }

    function pointerPick() {
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
      // Tap a placed block to remove it.
      const placedMeshes = placed.map((p) => p.mesh);
      const ph = input.raycast(camera, placedMeshes, false);
      if (ph.length) {
        const idx = placedMeshes.indexOf(ph[0].object);
        if (idx === placed.length - 1) removeLast();
        else {
          hud.message("Remove from the right end first.", {
            tone: "warn",
            duration: 1500,
          });
        }
      }
    }

    let unbindPress = null;
    let unbindTap = null;

    return {
      start() {
        camera.position.set(0, 6.2, 7.6);
        camera.lookAt(0, 0.3, 0.6);
        feel.syncCamera();

        startRound();

        // Keyboard: left/right select palette, up=submit, down=remove,
        // action(Space)=place selected, confirm(Enter)=submit.
        unbindPress = input.onPress((name) => {
          if (name === "left") moveCursor(-1);
          else if (name === "right") moveCursor(1);
          else if (name === "action") pickPalette();
          else if (name === "confirm") submit();
          else if (name === "up") submit();
          else if (name === "down") removeLast();
        });

        unbindTap = input.onTap(() => {
          if (solved) return;
          pointerPick();
        });

        if (level === 1) {
          caption(
            "Tip: build the expression left to right. Use × before + (order of operations).",
          );
          later(() => caption(""), 5000);
        }

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            const s = 1 + Math.sin(t * 4) * 0.08;
            palCursor.scale.set(1, s, 1);
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        slotGeo.dispose();
        palGeo.dispose();
        labelTextures.forEach((t) => t.dispose());
      },
    };
  },
};
