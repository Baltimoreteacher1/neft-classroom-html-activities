const COLORS = {
  floor: 0x14304f,
  axis: 0x2f6aa0,
  column: 0x1b4a76,
  columnActive: 0x2f7fb8,
  cursor: 0x1fa6a2,
  block: [0x1fa6a2, 0x4f8fd0, 0xe09b4a, 0x8b6fc4, 0x4aa978, 0xd9795d],
  target: 0xf2c15b,
  padOk: 0x0f7c4a,
  padIdle: 0x1b4a76,
  outlier: 0xd9795d,
};

const BLOCK = 0.8;
const STEP = 1.2;

// ---- Statistics helpers (math must be exact) ----
function mean(data) {
  if (!data.length) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}
function median(data) {
  if (!data.length) return 0;
  const s = [...data].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mode(data) {
  if (!data.length) return null;
  const counts = new Map();
  let best = null;
  let bestN = 0;
  for (const v of data) {
    const n = (counts.get(v) || 0) + 1;
    counts.set(v, n);
    if (n > bestN) {
      bestN = n;
      best = v;
    }
  }
  // Only a clear single mode counts.
  let ties = 0;
  for (const n of counts.values()) if (n === bestN) ties++;
  return ties === 1 ? best : null;
}
function range(data) {
  if (!data.length) return 0;
  return Math.max(...data) - Math.min(...data);
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(round1(n));
}

// ---- Round definitions ----
function makeLevel(level) {
  if (level === 1) {
    return {
      min: 1,
      max: 6,
      hints: true,
      rounds: [
        {
          type: "build",
          target: [3, 4, 4, 5, 6],
          prompt: "Drop blocks to match this data set: 3, 4, 4, 5, 6.",
          ask: "mode",
        },
        {
          type: "build",
          target: [2, 2, 3, 4, 4, 4],
          prompt: "Build the plot: 2, 2, 3, 4, 4, 4.",
          ask: "mode",
        },
        {
          type: "build",
          target: [1, 3, 3, 5, 5, 5, 6],
          prompt: "Build the plot: 1, 3, 3, 5, 5, 5, 6.",
          ask: "median",
        },
      ],
    };
  }
  return {
    min: 1,
    max: 9,
    hints: false,
    rounds: [
      {
        type: "build",
        target: [2, 4, 4, 6, 9],
        prompt: "Build the data set: 2, 4, 4, 6, 9.",
        ask: "mean",
      },
      {
        type: "build",
        target: [3, 5, 5, 6, 8, 9],
        prompt: "Build the data set: 3, 5, 5, 6, 8, 9.",
        ask: "range",
      },
      {
        type: "build",
        target: [2, 2, 3, 3, 3, 9],
        prompt: "Build it, then reason about the outlier: 2, 2, 3, 3, 3, 9.",
        ask: "outlier",
      },
    ],
  };
}

// Build a multiple-choice question for the current data set.
function buildQuestion(data, ask) {
  const mn = round1(mean(data));
  const md = median(data);
  const mo = mode(data);
  const rg = range(data);

  if (ask === "mode") {
    const choices = uniqueChoices(mo, [md, data[0], data[data.length - 1]]);
    return {
      q: "What is the MODE (most frequent value)?",
      correct: mo,
      choices,
      explain: `The value ${fmt(mo)} appears most often, so the mode is ${fmt(mo)}.`,
    };
  }
  if (ask === "median") {
    const choices = uniqueChoices(md, [mo, mn, data[0]]);
    return {
      q: "What is the MEDIAN (middle of the ordered set)?",
      correct: md,
      choices,
      explain: `Order the values and take the middle: the median is ${fmt(md)}.`,
    };
  }
  if (ask === "mean") {
    const choices = uniqueChoices(mn, [md, rg, mo]);
    return {
      q: "What is the MEAN (sum ÷ count)?",
      correct: mn,
      choices,
      explain: `Sum = ${data.reduce((a, b) => a + b, 0)}, count = ${data.length}, so mean = ${fmt(mn)}.`,
    };
  }
  if (ask === "range") {
    const choices = uniqueChoices(rg, [md, mn, Math.max(...data)]);
    return {
      q: "What is the RANGE (max − min)?",
      correct: rg,
      choices,
      explain: `Max ${Math.max(...data)} − min ${Math.min(...data)} = ${rg}.`,
    };
  }
  // outlier reasoning: which measure of center best describes the data?
  return {
    q: "One value is an outlier. Which center best describes the data?",
    correct: "median",
    choices: ["mean", "median", "range"],
    labels: { mean: "Mean", median: "Median", range: "Range" },
    explain:
      "The outlier pulls the mean upward, so the median best describes the typical value.",
  };
}

function uniqueChoices(correct, distractors) {
  const out = [correct];
  for (const d of distractors) {
    const v = round1(d);
    if (out.length >= 3) break;
    if (!out.some((o) => round1(o) === v) && v != null) out.push(v);
  }
  let bump = 1;
  while (out.length < 3) {
    const cand = round1(correct + bump);
    if (!out.some((o) => round1(o) === cand)) out.push(cand);
    bump = bump > 0 ? -bump : -bump + 1;
  }
  // Shuffle deterministically-ish.
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default {
  id: "unit-8-data-lab",
  vocab: [
    {
      term: "Mean",
      definition:
        "The average. Add all the values, then divide by how many there are.",
      emoji: "⚖️",
    },
    {
      term: "Median",
      definition:
        "The middle value when the numbers are put in order from least to greatest.",
      emoji: "📍",
    },
    {
      term: "Mode",
      definition: "The value that shows up most often in the data.",
      emoji: "🔁",
    },
    {
      term: "Range",
      definition:
        "How spread out the data is. Subtract the smallest value from the largest.",
      emoji: "↔️",
    },
    {
      term: "Outlier",
      definition:
        "A value that is much higher or lower than the rest of the data.",
      emoji: "🚩",
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
    const VALUES = [];
    for (let v = cfg.min; v <= cfg.max; v++) VALUES.push(v);
    const NCOL = VALUES.length;
    const spanX = (NCOL - 1) * STEP;

    const colX = (i) => -spanX / 2 + i * STEP;

    // ---- Scene ----
    const group = new THREE.Group();
    scene.add(group);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(spanX + STEP * 2, 0.3, 6),
      new THREE.MeshStandardMaterial({ color: COLORS.floor, roughness: 0.95 }),
    );
    floor.position.set(0, -0.15, 0);
    group.add(floor);

    const blockGeo = new THREE.BoxGeometry(BLOCK, BLOCK, BLOCK);
    const baseGeo = new THREE.BoxGeometry(STEP * 0.86, 0.18, 1.4);
    const disposables = [blockGeo, baseGeo];

    // Column bases + number labels.
    const bases = [];
    function makeNumberLabel(text, big) {
      const cv = document.createElement("canvas");
      cv.width = 96;
      cv.height = 96;
      const c = cv.getContext("2d");
      c.fillStyle = "#ffffff";
      c.font = `bold ${big ? 64 : 52}px system-ui, sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(String(text), 48, 52);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: tex, transparent: true }),
      );
      spr.scale.set(0.9, 0.9, 1);
      return spr;
    }

    VALUES.forEach((v, i) => {
      const base = new THREE.Mesh(
        baseGeo,
        new THREE.MeshStandardMaterial({
          color: COLORS.column,
          roughness: 0.8,
        }),
      );
      base.position.set(colX(i), 0.02, 1.4);
      group.add(base);
      bases.push(base);
      const lbl = makeNumberLabel(v);
      lbl.position.set(colX(i), 0.5, 2.4);
      group.add(lbl);
    });

    // Cursor (hovers over the active column).
    const cursorMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.6, 4),
      new THREE.MeshStandardMaterial({
        color: COLORS.cursor,
        emissive: COLORS.cursor,
        emissiveIntensity: 0.4,
      }),
    );
    cursorMesh.rotation.x = Math.PI;
    group.add(cursorMesh);

    // Target ghost markers (Level shows the goal counts as outlines).
    const ghostMat = new THREE.MeshStandardMaterial({
      color: COLORS.target,
      transparent: true,
      opacity: 0.22,
    });

    // ---- Answer pads (used in answer phase) ----
    const padGroup = new THREE.Group();
    group.add(padGroup);

    // ---- State ----
    let roundIndex = 0;
    let round = null;
    let targetCounts = null; // Map value->count for build
    const stacks = new Map(); // value -> array of meshes
    const ghosts = [];
    let data = []; // current placed data values
    let cursorCol = 0;
    let phase = "build"; // 'build' | 'answer' | 'done'
    let answerIndex = 0;
    let question = null;
    let pads = [];
    let solvedRound = false;
    let streak = 0; // consecutive correct answers
    let bestStreak = 0;
    let solvedCount = 0;
    let unbindFrame = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function clearStacks() {
      for (const arr of stacks.values()) {
        for (const m of arr) {
          group.remove(m);
          m.material.dispose();
        }
      }
      stacks.clear();
      data = [];
    }
    function clearGhosts() {
      while (ghosts.length) {
        const m = ghosts.pop();
        group.remove(m);
      }
    }
    function clearPads() {
      while (padGroup.children.length) {
        const m = padGroup.children.pop();
        if (m.geometry) m.geometry.dispose();
        if (m.material) {
          if (m.material.map) m.material.map.dispose();
          m.material.dispose();
        }
      }
      pads = [];
    }

    function valueOfCol(i) {
      return VALUES[i];
    }
    function colOfValue(v) {
      return VALUES.indexOf(v);
    }

    function countOf(v) {
      return (stacks.get(v) || []).length;
    }

    function placeBlock(v) {
      const arr = stacks.get(v) || [];
      const isOutlierVal =
        round.ask === "outlier" &&
        targetCounts.get(v) === 1 &&
        v === Math.max(...round.target);
      const mat = new THREE.MeshStandardMaterial({
        color: isOutlierVal
          ? COLORS.outlier
          : COLORS.block[arr.length % COLORS.block.length],
        roughness: 0.55,
      });
      const m = new THREE.Mesh(blockGeo, mat);
      const i = colOfValue(v);
      m.position.set(colX(i), 0.2 + arr.length * BLOCK + BLOCK / 2, 1.4);
      group.add(m);
      arr.push(m);
      stacks.set(v, arr);
      data.push(v);
    }

    function removeBlock(v) {
      const arr = stacks.get(v);
      if (!arr || !arr.length) return false;
      const m = arr.pop();
      group.remove(m);
      m.material.dispose();
      const idx = data.lastIndexOf(v);
      if (idx >= 0) data.splice(idx, 1);
      return true;
    }

    // ---- Live measures in HUD ----
    function liveLine() {
      if (!data.length) return "Mean — · Median — · Mode — · Range —";
      const mo = mode(data);
      return (
        `Mean ${fmt(round1(mean(data)))} · Median ${fmt(median(data))} · ` +
        `Mode ${mo == null ? "none" : fmt(mo)} · Range ${fmt(range(data))}`
      );
    }

    function updateObjective() {
      if (phase === "build") {
        const need = round.target.length;
        hud.setObjective(
          `${round.prompt} Drop blocks to match — ${data.length}/${need} placed. ${liveLine()}`,
        );
      } else if (phase === "answer") {
        hud.setObjective(`${question.q}  Pick a pad. (${liveLine()})`);
      }
    }

    function showGoalGhosts() {
      clearGhosts();
      for (const [v, n] of targetCounts) {
        const i = colOfValue(v);
        for (let k = 0; k < n; k++) {
          const g = new THREE.Mesh(blockGeo, ghostMat);
          g.position.set(colX(i), 0.2 + k * BLOCK + BLOCK / 2, 1.4);
          g.scale.set(1.04, 1.04, 1.04);
          group.add(g);
          ghosts.push(g);
        }
      }
    }

    function startRound() {
      clearStacks();
      clearGhosts();
      clearPads();
      solvedRound = false;
      round = cfg.rounds[roundIndex];
      phase = "build";
      cursorCol = 0;
      targetCounts = new Map();
      for (const v of round.target)
        targetCounts.set(v, (targetCounts.get(v) || 0) + 1);
      if (cfg.hints) showGoalGhosts();
      // Persistent "Step X of Y" for the whole round (both levels have 3 rounds).
      if (typeof hud.setProgress === "function")
        hud.setProgress(roundIndex, cfg.rounds.length);
      moveCursor(0);
      updateObjective();
      const hintTxt = cfg.hints ? " The faint blocks show the goal." : "";
      announce(
        `Round ${roundIndex + 1}. ${round.prompt}${hintTxt} Move with left and right, drop a block with the action button.`,
      );
      if (cfg.hints)
        hud.message("Move left/right, then drop a block to match.", {
          tone: "info",
          duration: 2600,
        });
    }

    function moveCursor(delta) {
      cursorCol = Math.max(0, Math.min(NCOL - 1, cursorCol + delta));
      cursorMesh.position.set(colX(cursorCol), 3.4, 1.4);
      bases.forEach((b, i) =>
        b.material.color.setHex(
          i === cursorCol ? COLORS.columnActive : COLORS.column,
        ),
      );
      if (delta !== 0)
        announce(
          `Value ${valueOfCol(cursorCol)}, ${countOf(valueOfCol(cursorCol))} blocks.`,
        );
    }

    function buildMatches() {
      if (data.length !== round.target.length) return false;
      for (const [v, n] of targetCounts) if (countOf(v) !== n) return false;
      // No extras on other columns.
      for (const [v, arr] of stacks)
        if (arr.length && !targetCounts.has(v)) return false;
      return true;
    }

    function dropAction() {
      if (phase === "answer") {
        chooseAnswer();
        return;
      }
      if (phase !== "build" || solvedRound) return;
      const v = valueOfCol(cursorCol);
      const goal = targetCounts.get(v) || 0;
      // With hints, never let a column exceed its goal (keeps the build solvable).
      if (cfg.hints && countOf(v) >= goal) {
        hud.message("That column already has enough. Try another value.", {
          tone: "warn",
          duration: 1500,
        });
        feel.shake(0.08);
        return;
      }
      // Without hints, cap total blocks at the data-set size.
      if (!cfg.hints && data.length >= round.target.length) {
        hud.message("You have placed enough blocks. Use ▼ to remove one.", {
          tone: "warn",
          duration: 1600,
        });
        feel.shake(0.08);
        return;
      }
      placeBlock(v);
      feel.burst(
        { x: colX(cursorCol), y: 0.4 + countOf(v) * BLOCK, z: 1.4 },
        {
          color: COLORS.block[(countOf(v) - 1) % COLORS.block.length],
          count: 10,
        },
      );
      announce(`Dropped a block on ${v}. ${liveLine()}`);
      updateObjective();
      if (buildMatches()) finishBuild();
    }

    function finishBuild() {
      clearGhosts();
      onScore(level === 2 ? 15 : 10, {
        round: roundIndex + 1,
        phase: "build",
      });
      feel.burst({ x: 0, y: 1.5, z: 1.4 }, { color: COLORS.target, count: 24 });
      hud.message("Plot built! Now answer the question.", {
        tone: "ok",
        duration: 1800,
      });
      announce(`Plot complete. ${liveLine()}.`);
      later(startAnswer, 1400);
    }

    // ---- Answer phase ----
    function startAnswer() {
      phase = "answer";
      question = buildQuestion(data, round.ask);
      answerIndex = 0;
      buildPads();
      updateObjective();
      const choiceText = question.choices
        .map((c, i) => `${i + 1}: ${choiceLabel(c)}`)
        .join(", ");
      announce(
        `${question.q} Use left and right to pick, action to confirm. Choices: ${choiceText}.`,
      );
      if (cfg.hints)
        hud.message("Use ◀ ▶ to choose, then press the action button.", {
          tone: "info",
          duration: 2600,
        });
    }

    function choiceLabel(c) {
      if (question.labels) return question.labels[c];
      return fmt(c);
    }

    function makePadLabel(text) {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 128;
      const c = cv.getContext("2d");
      c.fillStyle = "#ffffff";
      c.font = "bold 72px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(text, 128, 70);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.scale.set(1.4, 0.7, 1);
      return spr;
    }

    function buildPads() {
      clearPads();
      const n = question.choices.length;
      const gap = 2.6;
      const startX = -((n - 1) * gap) / 2;
      question.choices.forEach((c, i) => {
        const pad = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.4, 1.4),
          new THREE.MeshStandardMaterial({
            color: COLORS.padIdle,
            roughness: 0.6,
          }),
        );
        pad.position.set(startX + i * gap, 0.4, -1.6);
        pad.userData.choice = c;
        padGroup.add(pad);
        const lbl = makePadLabel(choiceLabel(c));
        lbl.position.set(startX + i * gap, 1.4, -1.6);
        padGroup.add(lbl);
        pads.push(pad);
      });
      highlightPad();
    }

    function highlightPad() {
      pads.forEach((p, i) =>
        p.material.color.setHex(
          i === answerIndex ? COLORS.padOk : COLORS.padIdle,
        ),
      );
      const p = pads[answerIndex];
      if (p) cursorMesh.position.set(p.position.x, 1.6, -1.6);
    }

    function moveAnswer(delta) {
      if (phase !== "answer") return;
      answerIndex = Math.max(0, Math.min(pads.length - 1, answerIndex + delta));
      highlightPad();
      announce(`Choice ${choiceLabel(question.choices[answerIndex])}.`);
    }

    function chooseAnswer() {
      if (phase !== "answer" || solvedRound) return;
      const picked = question.choices[answerIndex];
      const ok =
        question.labels != null
          ? picked === question.correct
          : round1(picked) === round1(question.correct);
      if (!ok) {
        feel.shake(0.2);
        streak = 0;
        if (typeof hud.setStreak === "function") hud.setStreak(0);
        const msg = "Not quite — check the measure again.";
        if (typeof hud.feedback === "function") hud.feedback(false, msg);
        else hud.message(msg, { tone: "warn", duration: 1800 });
        announce("Not quite. Try another choice.");
        return;
      }
      solvedRound = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      if (typeof hud.setStreak === "function") hud.setStreak(streak);
      const pts = level === 2 ? 25 : 15;
      onScore(pts, { round: roundIndex + 1, phase: "answer", ask: round.ask });
      feel.shake(0.3);
      feel.burst(
        { x: 0, y: 1.4, z: -1.6 },
        { color: COLORS.target, count: 36, spread: 4 },
      );
      if (typeof hud.feedback === "function")
        hud.feedback(true, `Correct! +${pts}`, { duration: 2200 });
      else hud.message(`Correct! +${pts}`, { tone: "ok", duration: 2200 });
      caption(question.explain);
      announce(`Correct. ${question.explain} You earned ${pts} points.`);
      later(() => caption(""), 3000);
      later(nextRound, 2600);
    }

    function nextRound() {
      if (roundIndex < cfg.rounds.length - 1) {
        roundIndex += 1;
        startRound();
      } else {
        phase = "done";
        clearPads();
        hud.setObjective(
          `Lab complete — ${solvedCount} of ${cfg.rounds.length} questions correct, best streak ${bestStreak}. Great data work, Statistician!`,
        );
        hud.message("All rounds complete!", { tone: "ok", duration: 0 });
        announce(
          `All rounds complete. You answered ${solvedCount} correctly with a best streak of ${bestStreak}. Great data work, Statistician.`,
        );
      }
    }

    // ---- Pointer support: tap a column (build) or a pad (answer) ----
    function handleTap() {
      if (phase === "build") {
        const hits = input.raycast(camera, bases, false);
        if (hits.length) {
          const i = bases.indexOf(hits[0].object);
          if (i >= 0) {
            cursorCol = i;
            moveCursor(0);
            dropAction();
          }
        }
      } else if (phase === "answer") {
        const hits = input.raycast(camera, pads, false);
        if (hits.length) {
          const i = pads.indexOf(hits[0].object);
          if (i >= 0) {
            answerIndex = i;
            highlightPad();
            chooseAnswer();
          }
        }
      }
    }

    let unbindPress = null;
    let unbindTap = null;

    return {
      start() {
        camera.position.set(0, 6.5, 9.5);
        camera.lookAt(0, 1, 0.2);
        feel.syncCamera();
        hud.setLevel(
          level === 2 ? "Level 2 — Enrichment" : "Level 1 — Support",
        );

        startRound();

        unbindPress = input.onPress((name) => {
          if (name === "left")
            phase === "answer" ? moveAnswer(-1) : moveCursor(-1);
          else if (name === "right")
            phase === "answer" ? moveAnswer(1) : moveCursor(1);
          else if (name === "up") {
            if (phase === "build") dropAction();
          } else if (name === "down") {
            if (phase === "build") {
              if (removeBlock(valueOfCol(cursorCol))) {
                announce(`Removed a block from ${valueOfCol(cursorCol)}.`);
              }
              updateObjective();
            }
          } else if (name === "action") dropAction();
          else if (name === "confirm") {
            if (phase === "build") dropAction();
            else if (phase === "answer") chooseAnswer();
          }
        });

        unbindTap = input.onTap(handleTap);

        if (!feel.reducedMotion) {
          unbindFrame = ctx.onFrame((dt, t) => {
            cursorMesh.position.y += Math.sin(t * 4) * 0.004;
            cursorMesh.rotation.y = t * 1.5;
          });
        }
      },

      dispose() {
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (unbindFrame) unbindFrame();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearStacks();
        clearGhosts();
        clearPads();
        disposables.forEach((g) => g.dispose());
      },
    };
  },
};
