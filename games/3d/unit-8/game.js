import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";

// ─── Data Lab: Build the Plot, Read the Measures ─────────────────────────────
// CCSS 6.SP.A & 6.SP.B — statistical variability + summarizing distributions
// (mean, median, mode, range, outliers; Level 2 adds MAD / mean absolute
// deviation as a multi-step enrichment measure of spread).
//
// Theme preserved from the original "Data Lab" build. Premium rebuild against
// engine3d/: rounded PBR blocks, emissive+bloom accents, shadows, camera
// intro, tweened juice, particle bursts, and feel.sfx on every action.

const COLORS = {
  stage: 0x132a4a,
  rail: 0x1b3c63,
  column: 0x1f4a78,
  columnActive: 0x2f8fd0,
  cursor: 0x2fd6c8,
  block: [0x2fd6c8, 0x5b9bf0, 0xf0a94a, 0x9b7ce0, 0x4fc78a, 0xe07a5d],
  target: 0xf2c15b,
  ghost: 0xf2c15b,
  padIdle: 0x1b4a76,
  padActive: 0xf2c15b,
  padOk: 0x0f9d63,
  outlier: 0xe0563d,
};

const BLOCK = 0.78; // block edge
const STEP = 1.25; // column spacing
const Z_DATA = 1.2; // z of the dot-plot columns
const Z_PADS = -2.0; // z of the answer pads

// ─── Statistics helpers (math must be exact) ─────────────────────────────────
function sum(d) {
  return d.reduce((a, b) => a + b, 0);
}
function mean(d) {
  return d.length ? sum(d) / d.length : 0;
}
function median(d) {
  if (!d.length) return 0;
  const s = [...d].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mode(d) {
  if (!d.length) return null;
  const counts = new Map();
  let best = null;
  let bestN = 0;
  for (const v of d) {
    const n = (counts.get(v) || 0) + 1;
    counts.set(v, n);
    if (n > bestN) {
      bestN = n;
      best = v;
    }
  }
  let ties = 0;
  for (const n of counts.values()) if (n === bestN) ties++;
  return ties === 1 && bestN > 1 ? best : null;
}
function range(d) {
  return d.length ? Math.max(...d) - Math.min(...d) : 0;
}
// Mean Absolute Deviation (6.SP.B.5c enrichment): average distance from mean.
function mad(d) {
  if (!d.length) return 0;
  const m = mean(d);
  return d.reduce((a, b) => a + Math.abs(b - m), 0) / d.length;
}
function round1(n) {
  return Math.round(n * 10) / 10;
}
function fmt(n) {
  return Number.isInteger(n) ? String(n) : String(round1(n));
}

// ─── Round definitions ───────────────────────────────────────────────────────
function makeLevel(level) {
  if (level === 1) {
    return {
      min: 1,
      max: 6,
      hints: true,
      label: "Level 1 — Support",
      rounds: [
        {
          target: [3, 4, 4, 5],
          prompt: "Make: 3, 4, 4, 5.",
          ask: "mode",
        },
        {
          target: [2, 2, 3, 4, 4, 4],
          prompt: "Make: 2, 2, 3, 4, 4, 4.",
          ask: "mode",
        },
        {
          target: [1, 3, 3, 5, 5, 5, 6],
          prompt: "Make: 1, 3, 3, 5, 5, 5, 6.",
          ask: "median",
        },
        {
          target: [2, 4, 4, 6],
          prompt: "Make: 2, 4, 4, 6.",
          ask: "median",
        },
        {
          target: [2, 3, 4, 5, 6],
          prompt: "Make: 2, 3, 4, 5, 6.",
          ask: "range",
        },
        {
          target: [1, 2, 2, 3, 3, 3, 4],
          prompt: "Make: 1, 2, 2, 3, 3, 3, 4.",
          ask: "mean",
        },
      ],
    };
  }
  return {
    min: 1,
    max: 9,
    hints: false,
    label: "Level 2 — Enrichment",
    rounds: [
      {
        target: [2, 4, 4, 6, 9],
        prompt: "Make: 2, 4, 4, 6, 9.",
        ask: "mean",
      },
      {
        target: [3, 5, 5, 6, 8, 9],
        prompt: "Make: 3, 5, 5, 6, 8, 9.",
        ask: "range",
      },
      {
        target: [2, 2, 3, 3, 3, 9],
        prompt: "Make: 2, 2, 3, 3, 3, 9.",
        ask: "outlier",
      },
      {
        target: [4, 4, 6, 6],
        prompt: "Make: 4, 4, 6, 6.",
        ask: "mad",
      },
      {
        target: [2, 4, 6, 8],
        prompt: "Make: 2, 4, 6, 8.",
        ask: "mad",
      },
      {
        target: [1, 3, 5, 7, 9],
        prompt: "Make: 1, 3, 5, 7, 9.",
        ask: "median",
      },
      {
        target: [3, 3, 5, 7, 8, 8],
        prompt: "Make: 3, 3, 5, 7, 8, 8.",
        ask: "mean",
      },
    ],
  };
}

function uniqueChoices(correct, distractors) {
  const out = [round1(correct)];
  for (const d of distractors) {
    const v = round1(d);
    if (out.length >= 3) break;
    if (v != null && !out.some((o) => round1(o) === v)) out.push(v);
  }
  let bump = 1;
  while (out.length < 3) {
    const cand = round1(correct + bump);
    if (cand >= 0 && !out.some((o) => round1(o) === cand)) out.push(cand);
    bump = bump > 0 ? -bump : -bump + 1;
  }
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQuestion(data, ask) {
  const mn = round1(mean(data));
  const md = median(data);
  const mo = mode(data);
  const rg = range(data);
  const md1 = round1(mad(data));

  if (ask === "mode") {
    return {
      q: "Mode = the number you see most. Pick it.",
      correct: mo,
      choices: uniqueChoices(mo, [md, data[0], data[data.length - 1]]),
      explain: `${fmt(mo)} shows up the most. Mode = ${fmt(mo)}.`,
    };
  }
  if (ask === "median") {
    return {
      q: "Median = the middle number. Pick it.",
      correct: md,
      choices: uniqueChoices(md, [mo, mn, data[0]]),
      explain: `Put them in order. The middle is ${fmt(md)}.`,
    };
  }
  if (ask === "mean") {
    return {
      q: "Mean = add them, then divide. Pick it.",
      correct: mn,
      choices: uniqueChoices(mn, [md, rg, mo]),
      explain: `${sum(data)} ÷ ${data.length} = ${fmt(mn)}. Mean = ${fmt(mn)}.`,
    };
  }
  if (ask === "range") {
    return {
      q: "Range = biggest − smallest. Pick it.",
      correct: rg,
      choices: uniqueChoices(rg, [md, mn, Math.max(...data)]),
      explain: `${Math.max(...data)} − ${Math.min(...data)} = ${rg}. Range = ${rg}.`,
    };
  }
  if (ask === "mad") {
    return {
      q: "MAD = how far numbers sit from the mean, on average. Pick it.",
      correct: md1,
      choices: uniqueChoices(md1, [round1(mn), rg, round1(md1 + 1)]),
      explain: `Mean = ${fmt(mn)}. Average distance from it = ${fmt(md1)}. MAD = ${fmt(md1)}.`,
    };
  }
  // outlier reasoning
  return {
    q: "One number is far from the rest. Which center fits best?",
    correct: "median",
    choices: ["mean", "median", "range"],
    labels: { mean: "Mean", median: "Median", range: "Range" },
    explain:
      "The far number pulls the mean up. Median fits best. Answer: Median.",
  };
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
    {
      term: "Mean Absolute Deviation",
      definition:
        "The average distance of each value from the mean. A bigger MAD means more spread out.",
      emoji: "📊",
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
    void renderer; // available from ctx; not directly needed here

    // ── Clarity / onboarding kit (shared overlay over the canvas) ────────────
    // Mount is the positioned container that hosts the canvas.
    const clarityMount = renderer.domElement.parentElement || document.body;
    let clarity = null;

    const cfg = makeLevel(level);
    const VALUES = [];
    for (let v = cfg.min; v <= cfg.max; v++) VALUES.push(v);
    const NCOL = VALUES.length;
    const spanX = (NCOL - 1) * STEP;
    const colX = (i) => -spanX / 2 + i * STEP;
    const reduced = feel.reducedMotion;

    // ── Scene group ──────────────────────────────────────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    // Shared geometries (rounded for premium feel) — disposed at teardown.
    const blockGeo = new RoundedBoxGeometry(BLOCK, BLOCK, BLOCK, 4, 0.12);
    const ghostGeo = new RoundedBoxGeometry(BLOCK, BLOCK, BLOCK, 3, 0.12);
    const baseGeo = new RoundedBoxGeometry(STEP * 0.84, 0.22, 1.5, 3, 0.07);
    const padGeo = new RoundedBoxGeometry(2.1, 0.45, 1.5, 4, 0.12);
    const disposables = [blockGeo, ghostGeo, baseGeo, padGeo];

    // Stage floor — receives shadows, subtly glossy.
    const stage = new THREE.Mesh(
      new RoundedBoxGeometry(spanX + STEP * 3, 0.4, 8, 4, 0.2),
      new THREE.MeshStandardMaterial({
        color: COLORS.stage,
        roughness: 0.62,
        metalness: 0.12,
      }),
    );
    stage.position.set(0, -0.22, -0.3);
    stage.receiveShadow = true;
    group.add(stage);
    disposables.push(stage.geometry);

    // Back rail (gives a horizon line, glows faintly via emissive).
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(spanX + STEP * 3, 0.5, 0.3, 3, 0.1),
      new THREE.MeshStandardMaterial({
        color: COLORS.rail,
        emissive: COLORS.cursor,
        emissiveIntensity: 0.12,
        roughness: 0.5,
        metalness: 0.2,
      }),
    );
    rail.position.set(0, 0.25, -3.6);
    rail.castShadow = true;
    group.add(rail);
    disposables.push(rail.geometry);

    // ── Number labels under each column ──────────────────────────────────────
    function makeNumberLabel(text) {
      const cv = document.createElement("canvas");
      cv.width = 128;
      cv.height = 128;
      const c = cv.getContext("2d");
      c.font = "bold 92px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      // Dark outline first → crisp, high-contrast digit even over bright floor.
      c.lineJoin = "round";
      c.lineWidth = 14;
      c.strokeStyle = "rgba(0,0,0,0.85)";
      c.strokeText(String(text), 64, 70);
      c.fillStyle = "#ffffff";
      c.fillText(String(text), 64, 70);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.renderOrder = 999;
      spr.scale.set(0.95, 0.95, 1);
      return spr;
    }

    const bases = [];
    VALUES.forEach((v, i) => {
      const base = new THREE.Mesh(
        baseGeo,
        new THREE.MeshStandardMaterial({
          color: COLORS.column,
          emissive: COLORS.columnActive,
          emissiveIntensity: 0,
          roughness: 0.55,
          metalness: 0.15,
        }),
      );
      base.position.set(colX(i), 0.04, Z_DATA);
      base.receiveShadow = true;
      base.castShadow = true;
      group.add(base);
      bases.push(base);

      const lbl = makeNumberLabel(v);
      lbl.position.set(colX(i), 0.5, Z_DATA + 1.05);
      group.add(lbl);
    });

    // ── 3D problem card (the math is ALWAYS shown in-world) ──────────────────
    function makeProblemCard() {
      const cv = document.createElement("canvas");
      cv.width = 1024;
      cv.height = 256;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({ transparent: true, depthTest: false }),
      );
      spr.userData.cv = cv;
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      spr.material.map = tex;
      spr.scale.set(6.4, 1.6, 1);
      return spr;
    }
    function drawCard(title, body) {
      const cv = problemCard.userData.cv;
      const c = cv.getContext("2d");
      c.clearRect(0, 0, cv.width, cv.height);
      c.fillStyle = "rgba(15,34,56,0.92)";
      const r = 28;
      c.beginPath();
      c.moveTo(r, 0);
      c.arcTo(cv.width, 0, cv.width, cv.height, r);
      c.arcTo(cv.width, cv.height, 0, cv.height, r);
      c.arcTo(0, cv.height, 0, 0, r);
      c.arcTo(0, 0, cv.width, 0, r);
      c.closePath();
      c.fill();
      c.strokeStyle = "rgba(242,193,91,0.85)";
      c.lineWidth = 6;
      c.stroke();
      c.textAlign = "center";
      c.fillStyle = "#f2c15b";
      c.font = "bold 60px system-ui, sans-serif";
      c.fillText(title, cv.width / 2, 80);
      c.font = "bold 52px system-ui, sans-serif";
      c.lineJoin = "round";
      c.lineWidth = 8;
      c.strokeStyle = "rgba(0,0,0,0.7)";
      c.strokeText(body, cv.width / 2, 172);
      c.fillStyle = "#ffffff";
      c.fillText(body, cv.width / 2, 172);
      problemCard.material.map.needsUpdate = true;
    }
    const problemCard = makeProblemCard();
    problemCard.position.set(0, 4.4, -1.2);
    group.add(problemCard);

    // ── Cursor (floats over active column / pad) ─────────────────────────────
    const cursorMesh = new THREE.Mesh(
      new THREE.ConeGeometry(0.34, 0.66, 24),
      new THREE.MeshStandardMaterial({
        color: COLORS.cursor,
        emissive: COLORS.cursor,
        emissiveIntensity: 0.9,
        roughness: 0.3,
        metalness: 0.3,
      }),
    );
    cursorMesh.rotation.x = Math.PI;
    cursorMesh.castShadow = true;
    group.add(cursorMesh);
    disposables.push(cursorMesh.geometry);

    const ghostMat = new THREE.MeshStandardMaterial({
      color: COLORS.ghost,
      emissive: COLORS.ghost,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.2,
    });
    disposables.push(ghostMat);

    const padGroup = new THREE.Group();
    group.add(padGroup);

    // ── State ────────────────────────────────────────────────────────────────
    let roundIndex = 0;
    let round = null;
    let targetCounts = null;
    const stacks = new Map(); // value -> [meshes]
    const ghosts = [];
    let data = [];
    let cursorCol = 0;
    let phase = "intro"; // intro | build | answer | done
    let answerIndex = 0;
    let question = null;
    let pads = [];
    let solvedRound = false;
    let streak = 0;
    let bestStreak = 0;
    let solvedCount = 0;
    let idleUnbind = null;
    const timers = [];
    const later = (fn, ms) => {
      const id = setTimeout(fn, ms);
      timers.push(id);
      return id;
    };

    function clearStacks() {
      for (const arr of stacks.values())
        for (const m of arr) {
          group.remove(m);
          m.material.dispose();
        }
      stacks.clear();
      data = [];
    }
    function clearGhosts() {
      while (ghosts.length) group.remove(ghosts.pop());
    }
    function clearPads() {
      while (padGroup.children.length) {
        const m = padGroup.children.pop();
        if (m.material) {
          if (m.material.map) m.material.map.dispose();
          m.material.dispose();
        }
      }
      pads = [];
    }

    const valueOfCol = (i) => VALUES[i];
    const colOfValue = (v) => VALUES.indexOf(v);
    const countOf = (v) => (stacks.get(v) || []).length;

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
        emissive: isOutlierVal ? COLORS.outlier : 0x000000,
        emissiveIntensity: isOutlierVal ? 0.35 : 0,
        roughness: 0.4,
        metalness: 0.18,
      });
      const m = new THREE.Mesh(blockGeo, mat);
      const i = colOfValue(v);
      const restY = 0.24 + arr.length * BLOCK + BLOCK / 2;
      m.castShadow = true;
      m.receiveShadow = true;
      m.position.set(colX(i), restY, Z_DATA);
      group.add(m);
      arr.push(m);
      stacks.set(v, arr);
      data.push(v);
      // Scale-pop spawn juice.
      if (!reduced) {
        m.scale.setScalar(0.01);
        feel.tween({
          from: 0.01,
          to: 1,
          duration: 0.26,
          onUpdate: (s) => m.scale.setScalar(s),
        });
      }
      return restY;
    }

    function removeBlock(v) {
      const arr = stacks.get(v);
      if (!arr || !arr.length) return false;
      const m = arr.pop();
      group.remove(m);
      m.material.dispose();
      const idx = data.lastIndexOf(v);
      if (idx >= 0) data.splice(idx, 1);
      feel.sfx("remove");
      return true;
    }

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
        const nums = round.prompt.replace(/^Make:\s*/, "");
        const text = `Stack blocks to make: ${nums} (${data.length} of ${need} done)`;
        hud.setObjective(text);
        if (clarity) {
          clarity.setObjective(text);
          clarity.setTarget(`Build: ${nums}`);
        }
        drawCard(`Build it: ${data.length}/${need}`, `${nums}`);
      } else if (phase === "answer") {
        const text = `${question.q} Tap a pad.`;
        hud.setObjective(text);
        if (clarity) {
          clarity.setObjective(text);
          clarity.setTarget(question.q);
        }
        drawCard(`${question.q}`, liveLine());
      }
    }

    function showGoalGhosts() {
      clearGhosts();
      for (const [v, n] of targetCounts) {
        const i = colOfValue(v);
        for (let k = 0; k < n; k++) {
          const g = new THREE.Mesh(ghostGeo, ghostMat);
          g.position.set(colX(i), 0.24 + k * BLOCK + BLOCK / 2, Z_DATA);
          g.scale.setScalar(1.04);
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
      hud.setProgress(roundIndex, cfg.rounds.length);
      moveCursor(0);
      updateObjective();
      feel.sfx("select");
      const nums = round.prompt.replace(/^Make:\s*/, "");
      const hintTxt = cfg.hints ? " The faint blocks show where they go." : "";
      announce(
        `Round ${roundIndex + 1}. Stack blocks to make ${nums}.${hintTxt} Move left and right, then drop a block.`,
      );
      if (cfg.hints)
        hud.message("Move, then drop a block.", {
          tone: "info",
          duration: 2600,
        });
    }

    function moveCursor(delta) {
      cursorCol = Math.max(0, Math.min(NCOL - 1, cursorCol + delta));
      const tx = colX(cursorCol);
      const ty = 3.4 + countOf(valueOfCol(cursorCol)) * BLOCK;
      if (!reduced && delta !== 0) {
        feel.tween({
          from: cursorMesh.position.x,
          to: tx,
          duration: 0.14,
          onUpdate: (x) => (cursorMesh.position.x = x),
        });
      } else {
        cursorMesh.position.x = tx;
      }
      cursorMesh.position.set(tx, ty, Z_DATA);
      bases.forEach((b, i) => {
        b.material.emissiveIntensity = i === cursorCol ? 0.5 : 0;
        b.material.color.setHex(
          i === cursorCol ? COLORS.columnActive : COLORS.column,
        );
      });
      if (delta !== 0) {
        feel.sfx("select");
        announce(
          `Value ${valueOfCol(cursorCol)}, ${countOf(valueOfCol(cursorCol))} blocks.`,
        );
      }
    }

    function buildMatches() {
      if (data.length !== round.target.length) return false;
      for (const [v, n] of targetCounts) if (countOf(v) !== n) return false;
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
      if (cfg.hints && countOf(v) >= goal) {
        hud.message("This number has enough. Try another.", {
          tone: "warn",
          duration: 1500,
        });
        feel.sfx("wrong");
        feel.shake(0.08);
        return;
      }
      if (!cfg.hints && data.length >= round.target.length) {
        hud.message("Enough blocks. Press ▼ to remove one.", {
          tone: "warn",
          duration: 1600,
        });
        feel.sfx("wrong");
        feel.shake(0.08);
        return;
      }
      const restY = placeBlock(v);
      feel.sfx("add");
      feel.burst(
        { x: colX(cursorCol), y: restY, z: Z_DATA },
        {
          color: COLORS.block[(countOf(v) - 1) % COLORS.block.length],
          count: 12,
          spread: 2.4,
        },
      );
      moveCursor(0); // keep cursor above the new top
      announce(`Block on ${v}. ${liveLine()}`);
      updateObjective();
      if (buildMatches()) finishBuild();
    }

    function finishBuild() {
      clearGhosts();
      onScore(level === 2 ? 15 : 10, { round: roundIndex + 1, phase: "build" });
      feel.sfx("correct");
      feel.burst(
        { x: 0, y: 1.6, z: Z_DATA },
        { color: COLORS.target, count: 26 },
      );
      hud.message("Built! Now pick the answer.", {
        tone: "ok",
        duration: 1800,
      });
      announce(`All blocks placed. ${liveLine()}.`);
      later(startAnswer, 1300);
    }

    // ── Answer phase ─────────────────────────────────────────────────────────
    function choiceLabel(c) {
      return question.labels ? question.labels[c] : fmt(c);
    }

    function makePadLabel(text) {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 128;
      const c = cv.getContext("2d");
      c.font = "bold 88px system-ui, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.lineJoin = "round";
      c.lineWidth = 14;
      c.strokeStyle = "rgba(0,0,0,0.85)";
      c.strokeText(text, 128, 72);
      c.fillStyle = "#ffffff";
      c.fillText(text, 128, 72);
      const tex = new THREE.CanvasTexture(cv);
      tex.minFilter = THREE.LinearFilter;
      const spr = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: tex,
          transparent: true,
          depthTest: false,
        }),
      );
      spr.renderOrder = 999;
      spr.scale.set(1.9, 0.95, 1);
      return spr;
    }

    function startAnswer() {
      phase = "answer";
      question = buildQuestion(data, round.ask);
      answerIndex = 0;
      buildPads();
      updateObjective();
      const choiceText = question.choices.map((c) => choiceLabel(c)).join(", ");
      announce(
        `${question.q} Move left and right, then press the button. Choices: ${choiceText}.`,
      );
      if (cfg.hints)
        hud.message("Move to a pad, then press the button.", {
          tone: "info",
          duration: 2600,
        });
    }

    function buildPads() {
      clearPads();
      const n = question.choices.length;
      const gap = 2.7;
      const startX = -((n - 1) * gap) / 2;
      question.choices.forEach((c, i) => {
        const pad = new THREE.Mesh(
          padGeo,
          new THREE.MeshStandardMaterial({
            color: COLORS.padIdle,
            emissive: COLORS.padActive,
            emissiveIntensity: 0,
            roughness: 0.45,
            metalness: 0.2,
          }),
        );
        pad.position.set(startX + i * gap, 0.45, Z_PADS);
        pad.castShadow = true;
        pad.receiveShadow = true;
        pad.userData.choice = c;
        padGroup.add(pad);
        const lbl = makePadLabel(choiceLabel(c));
        lbl.position.set(startX + i * gap, 1.4, Z_PADS);
        padGroup.add(lbl);
        pads.push(pad);
      });
      highlightPad();
    }

    function highlightPad() {
      pads.forEach((p, i) => {
        const on = i === answerIndex;
        p.material.color.setHex(on ? COLORS.padActive : COLORS.padIdle);
        p.material.emissiveIntensity = on ? 0.7 : 0;
      });
      const p = pads[answerIndex];
      if (p) {
        cursorMesh.position.set(p.position.x, 1.7, Z_PADS);
        if (!reduced) {
          feel.tween({
            from: 1,
            to: 1.12,
            duration: 0.12,
            onUpdate: (s) => p.scale.set(s, 1, s),
            onComplete: () => p.scale.set(1, 1, 1),
          });
        }
      }
    }

    function moveAnswer(delta) {
      if (phase !== "answer") return;
      answerIndex = Math.max(0, Math.min(pads.length - 1, answerIndex + delta));
      highlightPad();
      feel.sfx("select");
      announce(`Choice ${choiceLabel(question.choices[answerIndex])}.`);
    }

    function chooseAnswer() {
      if (phase !== "answer" || solvedRound) return;
      const picked = question.choices[answerIndex];
      const ok = question.labels
        ? picked === question.correct
        : round1(picked) === round1(question.correct);
      if (!ok) {
        feel.sfx("wrong");
        feel.shake(0.2);
        streak = 0;
        hud.setStreak(0);
        hud.feedback(false, "Not quite. Try again.");
        announce("Not quite. Try another pad.");
        return;
      }
      solvedRound = true;
      solvedCount += 1;
      streak += 1;
      if (streak > bestStreak) bestStreak = streak;
      hud.setStreak(streak);
      const pts = level === 2 ? 25 : 15;
      onScore(pts, { round: roundIndex + 1, phase: "answer", ask: round.ask });
      feel.sfx("correct");
      feel.shake(0.28);
      const p = pads[answerIndex];
      if (p) {
        p.material.color.setHex(COLORS.padOk);
        p.material.emissive.setHex(COLORS.padOk);
        p.material.emissiveIntensity = 0.9;
      }
      feel.burst(
        { x: p ? p.position.x : 0, y: 1.4, z: Z_PADS },
        { color: COLORS.target, count: 38, spread: 4 },
      );
      hud.feedback(true, `Correct! +${pts}`, { duration: 2200 });
      caption(question.explain);
      announce(`Correct. ${question.explain} You earned ${pts} points.`);
      later(() => caption(""), 3000);
      later(nextRound, 2400);
    }

    function nextRound() {
      if (roundIndex < cfg.rounds.length - 1) {
        roundIndex += 1;
        startRound();
      } else {
        phase = "done";
        clearPads();
        clearGhosts();
        hud.setProgress(cfg.rounds.length, cfg.rounds.length);
        hud.setObjective(
          `Done! You got ${solvedCount} of ${cfg.rounds.length}. Best streak: ${bestStreak}. Great work!`,
        );
        drawCard(
          "Done! Great work!",
          `${solvedCount}/${cfg.rounds.length} right · streak ${bestStreak}`,
        );
        hud.message("All rounds complete!", { tone: "ok", duration: 0 });
        feel.sfx("fanfare");
        for (let i = 0; i < 5; i++) {
          later(
            () =>
              feel.burst(
                {
                  x: (Math.random() - 0.5) * 6,
                  y: 2 + Math.random() * 2,
                  z: 0,
                },
                {
                  color: COLORS.block[i % COLORS.block.length],
                  count: 40,
                  spread: 5,
                },
              ),
            i * 180,
          );
        }
        announce(
          `All rounds complete. You answered ${solvedCount} correctly with a best streak of ${bestStreak}. Great data work, Statistician.`,
        );
        if (clarity) {
          clarity.setTarget(null);
          clarity.win({
            titleEn: "Data Lab complete!",
            badge: "📊",
            stats: `${solvedCount} of ${cfg.rounds.length} correct · Best streak ${bestStreak}. Score saved.`,
          });
        }
      }
    }

    // ── Pointer (tap a column or a pad) ──────────────────────────────────────
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
        hud.setLevel(cfg.label);

        // Animated camera intro: sweep from a high wide framing into the play view.
        const target = { x: 0, y: 6.4, z: 9.6 };
        const look = new THREE.Vector3(0, 1.2, 0.2);
        if (reduced) {
          camera.position.set(target.x, target.y, target.z);
          camera.lookAt(look);
          feel.syncCamera();
        } else {
          camera.position.set(-7, 11, 14);
          camera.lookAt(look);
          const from = camera.position.clone();
          feel.tween({
            from: 0,
            to: 1,
            duration: 1.5,
            onUpdate: (t) => {
              camera.position.set(
                from.x + (target.x - from.x) * t,
                from.y + (target.y - from.y) * t,
                from.z + (target.z - from.z) * t,
              );
              camera.lookAt(look);
            },
            onComplete: () => feel.syncCamera(),
          });
        }

        // Gentle idle motion on the cursor + problem card (gated on reduced).
        // Safe to run behind the start overlay.
        if (!reduced) {
          idleUnbind = onFrame((dt, t) => {
            cursorMesh.position.y += Math.sin(t * 4) * 0.0045;
            cursorMesh.rotation.y = t * 1.4;
            problemCard.position.y = 4.4 + Math.sin(t * 1.1) * 0.05;
          });
        }

        // Begin the actual round loop + input only after Start is pressed.
        // Single entry point for first play and for Play Again.
        function beginGameplay() {
          roundIndex = 0;
          unbindPress = input.onPress((name) => {
            if (phase === "answer") {
              if (name === "left") moveAnswer(-1);
              else if (name === "right") moveAnswer(1);
              else if (name === "action" || name === "confirm") chooseAnswer();
              return;
            }
            if (phase !== "build") return;
            if (name === "left") moveCursor(-1);
            else if (name === "right") moveCursor(1);
            else if (name === "up" || name === "action" || name === "confirm")
              dropAction();
            else if (name === "down") {
              if (removeBlock(valueOfCol(cursorCol))) {
                moveCursor(0);
                announce(`Removed a block from ${valueOfCol(cursorCol)}.`);
                updateObjective();
              }
            }
          });

          unbindTap = input.onTap(handleTap);

          startRound();
        }

        // Clarity / onboarding kit: start overlay, how-to-play, persistent help
        // button, mini-HUD, and win screen. Drives nothing in the 3D scene.
        clarity = initClarity({
          mount: clarityMount,
          announce,
          title: "Data Lab — Build the Plot, Read the Measures",
          objectiveEn:
            "Stack blocks to build each data set, then pick the right measure — mean, median, mode, range, or MAD.",
          objectiveEs:
            "Apila bloques para armar cada conjunto de datos y elige la medida correcta: media, mediana, moda o rango.",
          standard: "6.SP.A–B · Statistics: Center & Spread",
          controls: [
            {
              key: "← / →",
              actionEn:
                "Move the cursor between number columns (and answer pads)",
              actionEs:
                "Mueve el cursor entre columnas (y los botones de respuesta)",
            },
            {
              key: "Space / Enter / ↑",
              actionEn:
                "Drop a block on the column (and choose the answer pad)",
              actionEs: "Coloca un bloque en la columna (y elige la respuesta)",
            },
            {
              key: "↓",
              actionEn: "Remove the top block from the current column",
              actionEs: "Quita el bloque de arriba de la columna actual",
            },
            {
              key: "Tap",
              actionEn: "Tap a column to drop a block, or tap a pad to answer",
              actionEs:
                "Toca una columna para soltar un bloque o un botón para responder",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "First build the exact data set with blocks. Then read the dot plot and tap the pad with the correct measure. Finish every round to win.",
          howToWinEs:
            "Primero arma el conjunto de datos con bloques. Luego lee la gráfica y toca la medida correcta. Completa todas las rondas para ganar.",
          onStart: beginGameplay,
          onPlayAgain: () => location.reload(),
        });
      },

      dispose() {
        if (clarity) clarity.dispose();
        if (unbindPress) unbindPress();
        if (unbindTap) unbindTap();
        if (idleUnbind) idleUnbind();
        timers.forEach(clearTimeout);
        timers.length = 0;
        clearStacks();
        clearGhosts();
        clearPads();
        if (problemCard.material.map) problemCard.material.map.dispose();
        scene.remove(group);
        group.traverse((o) => {
          if (o.material) {
            if (o.material.map) o.material.map.dispose();
            o.material.dispose();
          }
        });
        disposables.forEach((g) => g.dispose && g.dispose());
      },
    };
  },
};
