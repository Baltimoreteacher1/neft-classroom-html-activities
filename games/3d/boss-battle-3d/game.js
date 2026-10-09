/**
 * Boss Battle 3D — Grade 6 Reveal Math review where the MATH IS THE ATTACK.
 *
 * Every round the player BUILDS a quantity and the game uses it physically:
 *   - beam rounds: the number you set is the beam's power (or crystals loaded,
 *     area filled, cubes packed). Exact = it breaks through and hits the boss;
 *     too little fizzles short; too much is reflected off the shield.
 *   - pulse rounds (fraction division): you set how many pulses to fire; each
 *     pulse visibly drains its fraction of the shield gauge.
 *   - aim rounds (integers, coordinates): the bolt flies to the point you typed
 *     on the holographic board — a wrong coordinate visibly lands left/right/
 *     above/below.
 * Misses never print the answer. Help is earned: after a miss a method hint
 * unlocks, after two a concrete next step, after three a fresh challenge.
 *
 * Calm, no-fail: there are no lives and no game over — the boss only blocks.
 * Untimed: no clock of any kind. Progress (phase, boss HP, score) is saved to
 * localStorage after every hit, so leaving and returning resumes the battle.
 *
 * Rounds come from ./generators.js (procedural, fresh numbers every time),
 * checked by ./mechanics.js. Phases follow UNITS in ./problems.js.
 */

import { updateLabel } from "/games/engine3d/label3d.js";
import { createArena } from "./scene.js";
import { initClarity } from "/games/3d/_clarity/clarity-kit.js";
import { UNITS } from "./problems.js";
import { makeRound } from "./generators.js";
import { checkBuild, makeRng, missMessage } from "./mechanics.js";
import { createBoard, boardPoint } from "./board.js";
import { createHpBar, createPanel, injectStyles } from "./ui.js";

function buildPlan(level) {
  const support = level !== 2;
  return {
    support,
    // Level 0/1 fight a focused gauntlet; Level 2 faces every unit.
    phaseUnits: support ? [1, 2, 3, 5, 7, 10] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    // Clean first-try hits deal 2, helped hits deal 1: HP = 2 × clean hits needed.
    hpForPhase: (idx) => 2 * (3 + Math.floor(idx / 2)),
  };
}

const SAVE_PREFIX = "bb3d:run:v2:L";
function loadRun(level) {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_PREFIX + level) || "null");
    return s && Number.isInteger(s.phaseIndex) ? s : null;
  } catch {
    return null;
  }
}
function saveRun(level, state) {
  try {
    localStorage.setItem(SAVE_PREFIX + level, JSON.stringify({ ...state, updated: Date.now() }));
  } catch {
    /* storage unavailable: play continues without resume */
  }
}
function clearRun(level) {
  try {
    localStorage.removeItem(SAVE_PREFIX + level);
  } catch {
    /* ignore */
  }
}

export default {
  id: "boss-battle-3d-mcap",
  totalSteps: 0,
  vocab: [
    {
      term: "Boss Battle",
      definition:
        "A big challenge. You build the attack with math — the numbers you choose are what the cannon fires.",
      emoji: "👾",
    },
    {
      term: "Phase",
      definition: "One stage of the fight. Each phase uses a different Grade 6 math unit.",
      emoji: "🌀",
    },
    {
      term: "Coordinate",
      definition:
        "A number that tells a position, like (3, −2) on a grid. You aim with coordinates.",
      emoji: "🎯",
    },
    {
      term: "Strategy",
      definition: "A smart plan. Read the challenge, decide the operation, then build your number.",
      emoji: "🧠",
    },
  ],

  createGame(ctx) {
    const { scene, camera, THREE, hud, feel, announce, caption, level, onScore, onFrame } = ctx;
    const plan = buildPlan(level);
    const reduced = feel.reducedMotion;
    const rng = makeRng((Date.now() ^ Math.floor(Math.random() * 1e9)) >>> 0);

    let phaseIndex = 0;
    let bossMaxHp = 0;
    let bossHp = 0;
    let totalScore = 0;
    let turn = 0;
    let round = null;
    let misses = 0;
    let busy = false;
    let gameOver = false;
    let started = false;
    let clarity = null;
    const timers = new Set();
    const frameUnsubs = [];

    function later(fn, ms) {
      const t = setTimeout(() => {
        timers.delete(t);
        if (!gameOver) fn();
      }, ms);
      timers.add(t);
    }

    const { ring, ringMat, boss, body, bodyMat, core, coreMat, eyeMat, shards, shardMat, shield, shieldMat, nameLabel, bolt, boltMat } = createArena(THREE, scene, UNITS);

    const board = createBoard(THREE, scene);

    function unitMeta() {
      const u = plan.phaseUnits[phaseIndex];
      return UNITS.find((m) => m.u === u) || UNITS[0];
    }
    function applyDamageVisual() {
      const frac = bossMaxHp > 0 ? bossHp / bossMaxHp : 1;
      bodyMat.color.set(unitMeta().color).multiplyScalar(0.45 + 0.55 * frac);
      bodyMat.emissiveIntensity = 0.2 + 0.5 * frac;
      coreMat.emissiveIntensity = 1.4 + (1 - frac) * 1.8;
      hp.render(
        `Phase ${phaseIndex + 1}/${plan.phaseUnits.length} · ${unitMeta().title}`,
        bossHp,
        bossMaxHp,
      );
    }
    function dressForPhase() {
      const c = new THREE.Color(unitMeta().color);
      bodyMat.emissive.copy(c);
      shardMat.color.copy(c);
      shardMat.emissive.copy(c);
      ringMat.emissive.copy(c);
      updateLabel(nameLabel, unitMeta().title);
      // The label canvas changes size with the name; drop the GPU copy so the
      // texture is re-uploaded at the new size instead of keeping the old name.
      nameLabel.material.map.dispose();
      nameLabel.material.map.needsUpdate = true;
      applyDamageVisual();
    }

    // ================================================================ DOM
    injectStyles();
    const mountEl = ctx.renderer.domElement.parentNode || document.body;
    const panel = createPanel(mountEl, {
      onFire: fire,
      onHint: () => revealHint(),
      onSwap: () => nextRound(true),
      onToggleEs: () => panel.setEs(!panel.showEs),
      onRestart: () => {
        clearRun(level);
        location.reload();
      },
    });
    panel.setEs(plan.support);
    const hp = createHpBar(mountEl);
    const vignette = document.createElement("div");
    vignette.className = "bb-vignette";
    mountEl.appendChild(vignette);
    const banner = document.createElement("div");
    banner.className = "bb-banner";
    banner.hidden = true;
    mountEl.appendChild(banner);
    function showBanner(html, ms = 1700) {
      banner.innerHTML = html;
      banner.hidden = false;
      if (!reduced) banner.classList.add("bb-pop");
      if (ms > 0)
        later(() => {
          banner.hidden = true;
          banner.classList.remove("bb-pop");
        }, ms);
    }

    // ================================================================ FLOW
    function persist() {
      saveRun(level, { phaseIndex, bossHp, bossMaxHp, totalScore, turn });
    }

    function nextRound() {
      // A swap ("New challenge") calls this too: same skill (turn unchanged), fresh numbers.
      if (gameOver) return;
      round = makeRound(plan.phaseUnits[phaseIndex], rng, turn);
      misses = 0;
      busy = false;
      const meta = unitMeta();
      panel.render(
        round,
        `Phase ${phaseIndex + 1}/${plan.phaseUnits.length} · ${meta.theme} · ${round.skill}`,
      );
      if (round.mechanic === "aim")
        board.show(round.fields.length > 1 ? "grid" : "line", round.shadow);
      else board.hide();
      shield.visible = round.mechanic !== "aim";
      hud.setObjective(`${meta.title} — build the attack!`);
      hud.setProgress(phaseIndex, plan.phaseUnits.length);
      if (clarity)
        clarity.setObjective(
          `Phase ${phaseIndex + 1}/${plan.phaseUnits.length} — build the exact attack to hit ${meta.title}.`,
        );
      if (clarity && clarity.setTarget) clarity.setTarget(`${meta.theme} · ${meta.standard}`);
      announce(`Phase ${phaseIndex + 1}. ${round.en}`);
      caption(round.en);
    }

    function revealHint() {
      if (!round) return;
      const tier = misses >= 2 ? 2 : 1;
      for (let t = 1; t <= tier; t++) panel.addHint(t, round.hints[t - 1]);
      announce(round.hints[tier - 1].en);
    }

    function fire() {
      if (!started || busy || gameOver || !round) return;
      const values = panel.values();
      const result = checkBuild(round, values);
      if (result.dirs.includes("blank")) {
        panel.feedback(missMessage(round, result), "miss");
        return;
      }
      busy = true;
      panel.lock(true);
      const done = () => (result.ok ? hit() : miss(result));
      if (round.mechanic === "aim") shootAt(values, result.ok, done);
      else if (round.mechanic === "pulses") firePulses(values[0], done);
      else fireBeam(result.ok ? "ok" : result.dirs[0], done);
    }

    function hit() {
      const clean = misses === 0;
      const dmg = clean ? 2 : 1;
      const points = clean ? 10 : 5;
      totalScore += points;
      onScore(points, { skillTag: round.skill });
      hud.setScore(totalScore);
      feel.sfx("correct", "Direct hit!");
      bossHp = Math.max(0, bossHp - dmg);
      applyDamageVisual();
      flashCore(0x9bffea);
      feel.burst(boss.position.clone().add(new THREE.Vector3(0, 0.4, 1)), {
        color: 0xfff2c0,
        count: 30,
        spread: 4.5,
      });
      if (!reduced) {
        feel.shake(0.3, 0.25);
        bossRecoil();
      }
      panel.feedback(
        clean
          ? {
              en: `Exact build — the attack breaks through! −${dmg} HP`,
              es: `¡Construcción exacta — el ataque atraviesa! −${dmg} PV`,
            }
          : {
              en: `You fixed it — the attack lands! −${dmg} HP`,
              es: `¡Lo corregiste — el ataque acierta! −${dmg} PV`,
            },
        "ok",
      );
      persist();
      turn += 1;
      if (bossHp <= 0) later(clearPhase, 900);
      else later(() => nextRound(), 1500);
    }

    function miss(result) {
      misses += 1;
      const msg = missMessage(round, result);
      feel.sfx("wrong", msg.en);
      bossTelegraph();
      if (!reduced) {
        vignette.classList.remove("bb-flash");
        void vignette.offsetWidth;
        vignette.classList.add("bb-flash");
      }
      const extra =
        misses === 1
          ? { en: " A hint is ready if you want it.", es: " Hay una pista lista si la quieres." }
          : misses === 2
            ? {
                en: " Hint 2 is ready: the next step.",
                es: " La pista 2 está lista: el siguiente paso.",
              }
            : {
                en: " You can also try a new challenge.",
                es: " También puedes probar un reto nuevo.",
              };
      panel.feedback({ en: msg.en + extra.en, es: msg.es + extra.es }, "miss");
      panel.allowHint(true);
      if (misses >= 3) panel.allowSwap(true);
      announce(msg.en);
      busy = false;
      panel.lock(false);
    }

    function clearPhase() {
      const meta = unitMeta();
      feel.sfx("fanfare", `${meta.title} defeated!`);
      totalScore += 25;
      onScore(25, { skillTag: "phase-clear" });
      hud.setScore(totalScore);
      showBanner(
        `<div class="bb-big">PHASE CLEAR!</div><div class="bb-small">${meta.title} defeated · +25</div><div class="bb-small">¡Fase superada!</div>`,
        1700,
      );
      phaseIndex += 1;
      if (phaseIndex >= plan.phaseUnits.length) {
        later(winGame, 1700);
        return;
      }
      startPhase();
      persist();
      later(() => {
        dressForPhase();
        const m = unitMeta();
        showBanner(
          `<div class="bb-small">PHASE ${phaseIndex + 1} of ${plan.phaseUnits.length}</div><div class="bb-big">${m.title}</div><div class="bb-small">${m.theme} · ${m.standard}</div>`,
          1600,
        );
        later(() => nextRound(), 1650);
      }, 1750);
    }

    function startPhase() {
      bossMaxHp = plan.hpForPhase(phaseIndex);
      bossHp = bossMaxHp;
    }

    // ================================================================ SHOTS
    function launch(from, to, duration, onDone, arcDrop = 0) {
      if (reduced) {
        onDone();
        return;
      }
      bolt.visible = true;
      boltMat.opacity = 1;
      bolt.position.copy(from);
      feel.tween({
        from: 0,
        to: 1,
        duration,
        onUpdate: (v) => {
          bolt.position.lerpVectors(from, to, v);
          bolt.position.y -= arcDrop * v * v;
          bolt.scale.setScalar(0.6 + v * 0.6);
        },
        onComplete: () => {
          bolt.visible = false;
          onDone();
        },
      });
      feel.sfx("pop");
    }
    function muzzle() {
      const p = new THREE.Vector3();
      camera.getWorldPosition(p);
      p.y -= 0.8;
      return p;
    }
    const bossFront = () => boss.position.clone().add(new THREE.Vector3(0, 0.3, 1));

    /** outcome "ok" | "low" | "high" — low fizzles short, high is reflected. */
    function fireBeam(outcome, done) {
      const start = muzzle();
      if (outcome === "ok") return launch(start, bossFront(), 0.34, done);
      if (outcome === "low") {
        const mid = start.clone().lerp(bossFront(), 0.5);
        return launch(
          start,
          mid,
          0.3,
          () => {
            feel.burst(mid, { color: 0x8899aa, count: 10, spread: 1.2 });
            done();
          },
          1.2,
        );
      }
      const shieldPt = boss.position.clone().add(new THREE.Vector3(0, 0.3, 2.35));
      launch(start, shieldPt, 0.28, () => {
        flashShield();
        launch(shieldPt, start.clone().add(new THREE.Vector3(3.5, 2, 0)), 0.3, done);
      });
    }

    function firePulses(count, done) {
      const pulse = round.visual.pulse;
      let left = round.visual.shield;
      const total = left;
      const n = Math.max(0, Math.min(40, Math.round(count)));
      let i = 0;
      const step = () => {
        if (i >= n || gameOver) {
          panel.setGauge(left / total);
          done();
          return;
        }
        i += 1;
        const start = muzzle();
        const shieldPt = boss.position.clone().add(new THREE.Vector3((i % 3) - 1, 0.3, 2.35));
        const after = () => {
          if (left > 1e-9) {
            left = Math.max(0, left - pulse);
            panel.setGauge(left / total);
            flashShield();
          } else feel.burst(shieldPt, { color: 0xc77dff, count: 6, spread: 1 });
          if (reduced) step();
          else later(step, 60);
        };
        if (reduced) after();
        else launch(start, shieldPt, 0.16, after);
      };
      step();
    }

    function shootAt(values, ok, done) {
      const x = values[0];
      const y = round.fields.length > 1 ? values[1] : 0;
      const target = boardPoint(THREE, x, y);
      launch(muzzle(), target, 0.36, () => {
        board.markAt(target);
        feel.burst(target, {
          color: ok ? 0xfff2c0 : 0x8899aa,
          count: ok ? 20 : 8,
          spread: ok ? 2 : 0.8,
        });
        if (ok) launch(target, bossFront(), 0.22, done);
        else done();
      });
    }

    // ================================================================ JUICE
    function flashCore(hex) {
      const orig = coreMat.emissive.clone();
      const base = coreMat.emissiveIntensity;
      coreMat.emissive.set(hex);
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.4,
        onUpdate: (v) => {
          coreMat.emissiveIntensity = base + 2.2 * (1 - v);
        },
        onComplete: () => {
          coreMat.emissive.copy(orig);
          coreMat.emissiveIntensity = base;
        },
      });
    }
    function flashShield() {
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.3,
        onUpdate: (v) => {
          shieldMat.opacity = 0.16 + 0.4 * (1 - v);
        },
        onComplete: () => {
          shieldMat.opacity = 0.16;
        },
      });
    }
    function bossRecoil() {
      const base = boss.position.z;
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.28,
        onUpdate: (v) => (boss.position.z = base - Math.sin(v * Math.PI) * 0.9),
        onComplete: () => (boss.position.z = base),
      });
    }
    function bossTelegraph() {
      if (reduced) return;
      const base = eyeMat.emissiveIntensity;
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.3,
        onUpdate: (v) => {
          eyeMat.emissiveIntensity = base + Math.sin(v * Math.PI) * 2.4;
        },
        onComplete: () => (eyeMat.emissiveIntensity = base),
      });
    }

    let elapsed = 0;
    frameUnsubs.push(
      onFrame((dt) => {
        elapsed += dt;
        if (reduced) return;
        boss.position.y = 1.1 + Math.sin(elapsed * 1.4) * 0.18;
        body.rotation.y += dt * 0.25;
        core.rotation.y -= dt * 0.8;
        shards.rotation.y += dt * 0.6;
        for (const s of shards.children) {
          s.rotation.x += dt * 1.2;
          s.rotation.z += dt * 0.8;
        }
        ring.rotation.z += dt * 0.15;
      }),
    );

    function cameraIntro() {
      if (reduced) {
        feel.syncCamera();
        return;
      }
      const target = camera.position.clone();
      const startPos = target.clone().multiplyScalar(1.9);
      startPos.y += 4;
      camera.position.copy(startPos);
      feel.tween({
        from: 0,
        to: 1,
        duration: 1.0,
        onUpdate: (v) => {
          camera.position.lerpVectors(startPos, target, v);
          camera.lookAt(0, 0.6, 0);
        },
        onComplete: () => {
          camera.position.copy(target);
          camera.lookAt(0, 0.6, 0);
          feel.syncCamera();
        },
      });
    }

    function winGame() {
      gameOver = true;
      clearRun(level);
      feel.sfx("win", "You defeated the boss!");
      panel.hide();
      hp.el.classList.add("bb-hidden");
      board.hide();
      const stats = `Final score: ${totalScore} · All ${plan.phaseUnits.length} phases cleared · ¡Todas las fases superadas!`;
      clarity.win({
        badge: "🏆",
        titleEn: "Boss defeated — you built every attack!",
        stats,
        onPlayAgain: () => location.reload(),
      });
      announce(`Victory! Final score ${totalScore}.`);
    }

    function beginPlay() {
      if (started) return;
      started = true;
      const meta = unitMeta();
      const resumed = phaseIndex > 0 || bossHp < bossMaxHp || totalScore > 0;
      showBanner(
        resumed
          ? `<div class="bb-small">WELCOME BACK · BIENVENIDO DE NUEVO</div><div class="bb-big">${meta.title}</div><div class="bb-small">Resuming phase ${phaseIndex + 1} of ${plan.phaseUnits.length} · Continúas en la fase ${phaseIndex + 1}</div>`
          : `<div class="bb-small">BOSS BATTLE</div><div class="bb-big">${meta.title}</div><div class="bb-small">Phase 1 of ${plan.phaseUnits.length} · ${meta.theme}</div><div class="bb-tip">No timer. Build the exact number — the cannon fires what you build.<br>Sin reloj. Construye el número exacto — el cañón dispara lo que construyes.</div>`,
        1900,
      );
      later(() => {
        panel.show();
        nextRound();
      }, 1950);
    }

    if (new URLSearchParams(location.search).get("debug") === "1") {
      window.__bossDebug = Object.freeze({
        get round() {
          return round && JSON.parse(JSON.stringify(round));
        },
        get state() {
          return {
            phaseIndex,
            bossHp,
            bossMaxHp,
            totalScore,
            misses,
            busy,
            started,
            gameOver,
            phases: plan.phaseUnits.length,
          };
        },
      });
    }

    return {
      start() {
        startPhase();
        const saved = loadRun(level);
        if (saved && saved.phaseIndex < plan.phaseUnits.length) {
          phaseIndex = saved.phaseIndex;
          bossMaxHp = plan.hpForPhase(phaseIndex);
          bossHp = Math.max(1, Math.min(bossMaxHp, saved.bossHp | 0));
          totalScore = saved.totalScore | 0;
          turn = saved.turn | 0;
        }
        dressForPhase();
        cameraIntro();
        hud.setScore(totalScore);
        clarity = initClarity({
          mount: mountEl,
          announce,
          title: "Boss Battle — Build the Attack",
          objectiveEn:
            "Build each attack with math: the number you set is what the cannon fires. Exact builds break the boss's shield. Clear every phase to win.",
          objectiveEs:
            "Construye cada ataque con matemáticas: el número que pones es lo que dispara el cañón. Las construcciones exactas rompen el escudo del jefe. Supera todas las fases para ganar.",
          standard: `${plan.phaseUnits.length} phases · Grade 6 units (6.AT, 6.NOS, 6.GR, 6.DS)`,
          controls: [
            {
              key: "Type or use − / +",
              actionEn: "Set your number (whole numbers, decimals like 2.5, or fractions like 3/4)",
              actionEs: "Pon tu número (enteros, decimales como 2.5 o fracciones como 3/4)",
            },
            {
              key: "Fire / Enter",
              actionEn: "Fire the attack you built",
              actionEs: "Dispara el ataque que construiste",
            },
            {
              key: "Hint",
              actionEn: "After a miss, open a hint (a second hint after two misses)",
              actionEs: "Después de fallar, abre una pista (otra después de dos fallos)",
            },
            {
              key: "?",
              actionEn: "Open this help panel any time (Esc closes it)",
              actionEs: "Abre esta ayuda cuando quieras (Esc la cierra)",
            },
          ],
          howToWinEn:
            "There is no timer and no game over. If your number is too small the beam fizzles; too big and the shield reflects it; on the grid you see where your bolt landed. Fix your build and fire again. First-try builds deal double damage. Your battle is saved — come back any day.",
          howToWinEs:
            "No hay reloj ni fin del juego. Si tu número es muy pequeño, el rayo se apaga; si es muy grande, el escudo lo refleja; en la cuadrícula ves dónde cayó tu rayo. Corrige y dispara otra vez. Acertar al primer intento hace el doble de daño. Tu batalla se guarda — vuelve cualquier día.",
          startLabelEn: "Start battle",
          onStart: beginPlay,
          onPlayAgain: () => location.reload(),
        });
        clarity.setObjective(
          `Phase ${phaseIndex + 1}/${plan.phaseUnits.length} — build the exact attack to hit ${unitMeta().title}.`,
        );
        announce(`Boss Battle. ${plan.phaseUnits.length} phases. Press Start battle to begin.`);
      },
      dispose() {
        gameOver = true;
        for (const u of frameUnsubs) if (u) u();
        for (const t of timers) clearTimeout(t);
        timers.clear();
        if (clarity) clarity.dispose();
        panel.dispose();
        for (const el of [vignette, banner, hp.el]) el.remove();
        if (window.__bossDebug) delete window.__bossDebug;
      },
    };
  },
};
