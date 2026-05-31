/**
 * MCAP Boss Battle 3D — Grade 6 Reveal Math review (BCPS / MCAP prep).
 *
 * A real Three.js + engine3d game (not a 2D quiz skin):
 *   - A rendered 3D boss enemy floats in an arena (rounded body, glowing core,
 *     eyes, orbiting shards). It idles, bobs, and reacts to the battle.
 *   - The student answers MCAP review questions to ATTACK. A correct answer
 *     fires an energy strike at the boss → hit flash, bloom pulse, particle
 *     burst, camera shake, boss recoils and loses health.
 *   - A wrong answer lets the boss ATTACK BACK → the arena shakes, the screen
 *     flashes red, and the player loses a life (heart).
 *   - Multiple PHASES that scale difficulty: each phase is one Reveal unit
 *     (1→10). Clear a phase by draining the boss's health; the boss morphs to
 *     the next unit's color/name and questions get harder.
 *   - Win = defeat the final phase. Lose = run out of lives.
 *   - Full HUD: score, lives (hearts), phase progress, streak.
 *
 * Questions come from ./problems.js (one source of truth, mirrors the MCAP
 * Review Arcade bank). The choices are shuffled per render; the correct VALUE
 * is tracked so the bank's answer index stays valid.
 *
 * Engine contract: export default { id, vocab, createGame(ctx) } and the engine
 * (engine3d/game-base.js) mounts it. ctx documented in engine3d/README.md.
 */

import { makeLabel, updateLabel } from "/games/engine3d/label3d.js";
import { BANK, UNITS } from "./problems.js";

// ---- Difficulty shaping ----------------------------------------------------
// Level 1 (support): fewer phases, more lives, more hint. Level 2 (enrichment):
// all phases, fewer lives, faster boss. Each phase needs N correct hits to
// drain the boss; later phases need more hits → difficulty scales.
function buildPlan(level) {
  const support = level !== 2;
  // Phases = ordered subset of units. Level 1 fights a focused 6-phase gauntlet;
  // Level 2 faces the full 10-unit boss rush.
  const phaseUnits = support
    ? [1, 2, 3, 5, 7, 10] // core MCAP strands, gentler ramp
    : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // full curriculum boss rush
  return {
    support,
    phaseUnits,
    startLives: support ? 5 : 3,
    // Hits to clear a phase grows as you go deeper (min 3, +1 every 2 phases).
    hitsForPhase: (idx) => (support ? 3 : 3) + Math.floor(idx / 2),
    bilingual: support, // Level 1 may include EN/ES support text
  };
}

export default {
  id: "boss-battle-3d-mcap",
  totalSteps: 0, // dynamic; we drive hud.setProgress ourselves (phase X of Y)
  vocab: [
    {
      term: "Boss Battle",
      definition:
        "A big challenge level. Answer math questions to beat the boss!",
      emoji: "👾",
    },
    {
      term: "Phase",
      definition:
        "One stage of the fight. Each phase reviews a different Grade 6 math unit.",
      emoji: "🌀",
    },
    {
      term: "Review",
      definition:
        "Practicing skills you already learned to get ready for the MCAP test.",
      emoji: "📚",
    },
    {
      term: "Strategy",
      definition:
        "A smart plan. Read each question carefully before you choose an answer.",
      emoji: "🧠",
    },
  ],

  createGame(ctx) {
    const {
      scene,
      camera,
      THREE,
      input,
      hud,
      feel,
      announce,
      caption,
      level,
      onScore,
      onFrame,
    } = ctx;

    const plan = buildPlan(level);
    const reduced = feel.reducedMotion;

    // ----- battle state -----
    let lives = plan.startLives;
    let phaseIndex = 0; // 0-based index into plan.phaseUnits
    let bossMaxHp = 0;
    let bossHp = 0;
    let hitsThisPhase = 0;
    let streak = 0;
    let answered = false; // guard against double answers per question
    let gameOver = false;
    let currentQ = null;
    let currentChoiceOrder = []; // shuffled choice strings
    let correctValue = ""; // the correct choice string
    const timers = new Set();
    const frameUnsubs = [];

    function later(fn, ms) {
      const t = setTimeout(() => {
        timers.delete(t);
        if (!gameOver || fn.__runOnOver) fn();
      }, ms);
      timers.add(t);
      return t;
    }

    // ===================================================================
    //  ARENA + BOSS (real 3D)
    // ===================================================================
    const arena = new THREE.Group();
    scene.add(arena);

    // Stage floor — receives shadows, anchors the boss in space.
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x132a4a,
      roughness: 0.92,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(11, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.6;
    floor.receiveShadow = true;
    arena.add(floor);

    // Glowing arena ring (emissive → catches bloom).
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x0d1b30,
      emissive: 0x1fa6a2,
      emissiveIntensity: 0.9,
      roughness: 0.4,
      metalness: 0.3,
    });
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(7.4, 0.16, 16, 80),
      ringMat,
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -2.55;
    arena.add(ring);

    // Pillars around the arena for depth.
    const pillarGeo = new THREE.CylinderGeometry(0.32, 0.42, 6, 10);
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x10243f,
      roughness: 0.8,
      metalness: 0.15,
    });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = new THREE.Mesh(pillarGeo, pillarMat);
      p.position.set(Math.cos(a) * 9.2, 0.4, Math.sin(a) * 9.2);
      p.castShadow = true;
      p.receiveShadow = true;
      arena.add(p);
    }

    // ----- the BOSS -----
    const boss = new THREE.Group();
    boss.position.set(0, 1.1, 0);
    arena.add(boss);

    // Body: a rounded, faceted core (icosahedron reads as a menacing crystal).
    const bodyMat = new THREE.MeshStandardMaterial({
      color: UNITS[0].color,
      roughness: 0.32,
      metalness: 0.45,
      emissive: UNITS[0].color,
      emissiveIntensity: 0.35,
      flatShading: true,
    });
    const body = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7, 1), bodyMat);
    body.castShadow = true;
    boss.add(body);

    // Inner energy core — bright, pulses, drives bloom feedback.
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xfff2c0,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.1,
    });
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.85, 1),
      coreMat,
    );
    boss.add(core);

    // Two eyes — give it a face and a "tell" for attacks.
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x0a0f18,
      emissive: 0xff3b3b,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const eyeGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.55, 0.35, 1.45);
    eyeR.position.set(0.55, 0.35, 1.45);
    boss.add(eyeL, eyeR);

    // Orbiting shards — pure visual life; rotate every frame.
    const shards = new THREE.Group();
    boss.add(shards);
    const shardMat = new THREE.MeshStandardMaterial({
      color: UNITS[0].color,
      emissive: UNITS[0].color,
      emissiveIntensity: 0.7,
      roughness: 0.35,
      metalness: 0.5,
      flatShading: true,
    });
    for (let i = 0; i < 6; i++) {
      const s = new THREE.Mesh(new THREE.TetrahedronGeometry(0.36), shardMat);
      const a = (i / 6) * Math.PI * 2;
      s.position.set(
        Math.cos(a) * 2.7,
        Math.sin(a * 1.3) * 0.6,
        Math.sin(a) * 2.7,
      );
      s.userData.a = a;
      shards.add(s);
    }

    // Floating phase nameplate above the boss (3D sprite label).
    const nameLabel = makeLabel(UNITS[0].title, {
      scale: 0.78,
      color: "#ffffff",
      background: "rgba(11,22,40,0.86)",
    });
    nameLabel.position.set(0, 3.5, 0);
    boss.add(nameLabel);

    // Energy bolt that flies from camera toward the boss on a correct answer.
    const boltMat = new THREE.MeshStandardMaterial({
      color: 0xfff6d0,
      emissive: 0xffe48a,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const bolt = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 16),
      boltMat,
    );
    bolt.visible = false;
    scene.add(bolt);

    // Damage cracks: as HP drops we tint the body darker + crank emissive on core.
    function applyDamageVisual() {
      const frac = bossMaxHp > 0 ? bossHp / bossMaxHp : 1;
      // Body desaturates / darkens as it takes damage.
      const base = new THREE.Color(UNITS[phaseIndexUnitMeta().idx].color);
      bodyMat.color.copy(base).multiplyScalar(0.45 + 0.55 * frac);
      bodyMat.emissiveIntensity = 0.2 + 0.5 * frac;
      // Core flares brighter (unstable) as it nears defeat.
      coreMat.emissiveIntensity = 1.4 + (1 - frac) * 1.8;
      eyeMat.emissiveIntensity = 0.5 + (1 - frac) * 0.8;
    }

    function phaseIndexUnitMeta() {
      const u = plan.phaseUnits[phaseIndex];
      const idx = UNITS.findIndex((m) => m.u === u);
      return { u, idx: idx < 0 ? 0 : idx, meta: UNITS[idx < 0 ? 0 : idx] };
    }

    // Recolor boss for a new phase.
    function dressForPhase() {
      const { meta, idx } = phaseIndexUnitMeta();
      const c = new THREE.Color(meta.color);
      bodyMat.color.copy(c);
      bodyMat.emissive.copy(c);
      shardMat.color.copy(c);
      shardMat.emissive.copy(c);
      ringMat.emissive.copy(c);
      updateLabel(nameLabel, meta.title);
      applyDamageVisual();
      return { meta, idx };
    }

    // ===================================================================
    //  DOM: answer panel + battle banner + intro/result overlays
    // ===================================================================
    injectStyles();
    const mountEl = ctx.renderer.domElement.parentNode || document.body;

    const panel = document.createElement("div");
    panel.className = "bb-panel";
    panel.innerHTML = `
      <div class="bb-q-meta" data-bb="meta"></div>
      <p class="bb-q" data-bb="q" role="status" aria-live="polite"></p>
      <div class="bb-choices" data-bb="choices" role="group" aria-label="Answer choices"></div>
      <div class="bb-why" data-bb="why" hidden></div>`;
    mountEl.appendChild(panel);
    const metaEl = panel.querySelector('[data-bb="meta"]');
    const qEl = panel.querySelector('[data-bb="q"]');
    const choicesEl = panel.querySelector('[data-bb="choices"]');
    const whyEl = panel.querySelector('[data-bb="why"]');

    // Red damage vignette flash (player hit).
    const vignette = document.createElement("div");
    vignette.className = "bb-vignette";
    mountEl.appendChild(vignette);

    // Lives are rendered as hearts in the HUD via hud.setLives, but we also keep
    // a big banner for phase changes / win / lose.
    const banner = document.createElement("div");
    banner.className = "bb-banner";
    banner.hidden = true;
    mountEl.appendChild(banner);

    function showBanner(html, ms = 1700) {
      banner.innerHTML = html;
      banner.hidden = false;
      if (!reduced) banner.classList.add("bb-pop");
      if (ms > 0) {
        later(() => {
          banner.hidden = true;
          banner.classList.remove("bb-pop");
        }, ms);
      }
    }

    // ===================================================================
    //  QUESTION FLOW
    // ===================================================================
    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    // Per-phase queue of question indices (so we don't repeat within a phase).
    let phaseQueue = [];
    function refillPhaseQueue() {
      const { u } = phaseIndexUnitMeta();
      phaseQueue = shuffle(BANK[u].map((_, i) => i));
    }

    function nextQuestion() {
      if (gameOver) return;
      if (phaseQueue.length === 0) refillPhaseQueue();
      const { u, meta } = phaseIndexUnitMeta();
      const qi = phaseQueue.pop();
      currentQ = BANK[u][qi];
      correctValue = currentQ.choices[currentQ.answer];
      currentChoiceOrder = shuffle(currentQ.choices);
      answered = false;

      metaEl.textContent = `Phase ${phaseIndex + 1}/${plan.phaseUnits.length} · ${meta.theme} · ${meta.standard} · Topic: ${currentQ.topic}`;
      qEl.textContent = currentQ.q;
      whyEl.hidden = true;
      whyEl.textContent = "";

      renderChoices();
      hud.setObjective(
        `${meta.title} — answer to attack!  (Phase ${phaseIndex + 1} of ${plan.phaseUnits.length})`,
      );
      hud.setProgress(phaseIndex, plan.phaseUnits.length);
      announce(`Phase ${phaseIndex + 1}. ${currentQ.q}`);
      caption(currentQ.q);
    }

    function renderChoices() {
      choicesEl.innerHTML = "";
      currentChoiceOrder.forEach((choice, i) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "bb-choice";
        const letter = String.fromCharCode(65 + i);
        btn.innerHTML = `<span class="bb-key">${letter}</span><span class="bb-val">${escapeHtml(choice)}</span>`;
        btn.addEventListener("pointerdown", (e) => {
          e.stopPropagation(); // don't double-fire canvas tap
        });
        btn.addEventListener("click", () => choose(choice, btn));
        choicesEl.appendChild(btn);
      });
      // focus first for keyboard players
      const first = choicesEl.querySelector(".bb-choice");
      if (first) first.focus();
    }

    function choose(choice, btn) {
      if (answered || gameOver) return;
      answered = true;
      const correct = choice === correctValue;
      // lock all buttons, mark correct/incorrect
      const btns = [...choicesEl.querySelectorAll(".bb-choice")];
      btns.forEach((b) => {
        b.disabled = true;
        const val = b.querySelector(".bb-val").textContent;
        if (val === correctValue) b.classList.add("is-correct");
      });
      if (!correct && btn) btn.classList.add("is-wrong");

      if (correct) playerAttack();
      else bossAttack();
    }

    // ===================================================================
    //  COMBAT
    // ===================================================================
    function playerAttack() {
      streak += 1;
      const dmg = 1;
      const bonus = streak >= 3 ? 5 : 0; // streak bonus points
      const points = 10 + bonus;
      onScore(points); // engine updates score + streak HUD + progress/persist
      feel.sfx("correct", "Correct! Direct hit.");
      hud.setStreak(streak);

      // fire energy bolt from camera toward boss
      fireBolt(() => {
        bossHp = Math.max(0, bossHp - dmg);
        hitsThisPhase += 1;
        applyDamageVisual();
        // hit reaction: flash core, burst, shake, recoil
        flashCore(0x9bffea);
        feel.burst(boss.position.clone().add(new THREE.Vector3(0, 0.4, 1)), {
          color: 0xfff2c0,
          count: 30,
          spread: 4.5,
        });
        if (!reduced) {
          feel.shake(0.32, 0.25);
          bossRecoil();
        }
        whyEl.hidden = false;
        whyEl.textContent = `✅ ${currentQ.why}`;

        if (bossHp <= 0) {
          later(() => clearPhase(), 650);
        } else {
          hud.message(
            `Hit! ${streak >= 3 ? "🔥 Combo +" + bonus + " " : ""}+${points}`,
            { tone: "ok", duration: 900 },
          );
          later(() => nextQuestion(), 1500);
        }
      });
    }

    function bossAttack() {
      streak = 0;
      hud.setStreak(0);
      // Do NOT call onScore on a miss: the engine treats points>=0 as a
      // successful step (it would advance its internal step/streak). We own the
      // streak/lives here; a wrong answer simply earns no points.
      feel.sfx("wrong", "Not quite. The boss strikes back!");
      lives -= 1;
      hud.setLives(lives);

      // boss lunges + arena shake + red flash
      bossLunge();
      if (!reduced) {
        feel.shake(0.55, 0.45);
        vignette.classList.add("bb-flash");
        later(() => vignette.classList.remove("bb-flash"), 480);
      } else {
        vignette.classList.add("bb-flash-static");
        later(() => vignette.classList.remove("bb-flash-static"), 480);
      }
      flashCore(0xff5a5a);
      whyEl.hidden = false;
      whyEl.textContent = `❌ The answer was “${correctValue}”. ${currentQ.why}`;
      announce(`Incorrect. The boss attacks. ${lives} lives left.`);

      if (lives <= 0) {
        later(() => loseGame(), 900);
      } else {
        hud.message(`The boss hit you! ${"♥".repeat(lives)} left`, {
          tone: "warn",
          duration: 1100,
        });
        later(() => nextQuestion(), 1900);
      }
    }

    function clearPhase() {
      if (gameOver) return;
      const { meta } = phaseIndexUnitMeta();
      feel.sfx("fanfare", `${meta.title} defeated!`);
      onScore(25); // phase-clear bonus
      if (!reduced)
        feel.burst(boss.position.clone().add(new THREE.Vector3(0, 0.5, 1)), {
          color: 0xfff2c0,
          count: 60,
          spread: 7,
          life: 1.3,
        });
      showBanner(
        `<div class="bb-big">PHASE CLEAR!</div><div class="bb-small">${meta.title} defeated · +25</div>`,
        1700,
      );

      phaseIndex += 1;
      if (phaseIndex >= plan.phaseUnits.length) {
        later(() => winGame(), 1700);
        return;
      }
      // morph to next phase
      later(() => {
        const m = dressForPhase();
        startPhase();
        showBanner(
          `<div class="bb-small">PHASE ${phaseIndex + 1} of ${plan.phaseUnits.length}</div><div class="bb-big">${m.meta.title}</div><div class="bb-small">${m.meta.theme} · ${m.meta.standard}</div>`,
          1700,
        );
        later(() => nextQuestion(), 1750);
      }, 1750);
    }

    function startPhase() {
      bossMaxHp = plan.hitsForPhase(phaseIndex);
      bossHp = bossMaxHp;
      hitsThisPhase = 0;
      refillPhaseQueue();
      applyDamageVisual();
    }

    // ===================================================================
    //  ANIMATIONS / JUICE
    // ===================================================================
    function fireBolt(onHit) {
      if (reduced) {
        onHit();
        return;
      }
      bolt.visible = true;
      const start = new THREE.Vector3();
      camera.getWorldPosition(start);
      start.y -= 0.6;
      const end = boss.position.clone().add(new THREE.Vector3(0, 0.3, 1));
      bolt.position.copy(start);
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.32,
        onUpdate: (v) => {
          bolt.position.lerpVectors(start, end, v);
          bolt.scale.setScalar(0.6 + v * 0.8);
        },
        onComplete: () => {
          bolt.visible = false;
          onHit();
        },
      });
      feel.sfx("pop");
    }

    function flashCore(hex) {
      const c = new THREE.Color(hex);
      const orig = coreMat.emissive.clone();
      coreMat.emissive.copy(c);
      const baseI = coreMat.emissiveIntensity;
      coreMat.emissiveIntensity = baseI + 2.2;
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.4,
        onUpdate: (v) => {
          coreMat.emissiveIntensity = baseI + 2.2 * (1 - v);
        },
        onComplete: () => {
          coreMat.emissive.copy(orig);
          coreMat.emissiveIntensity = baseI;
        },
      });
    }

    function bossRecoil() {
      const base = boss.position.z;
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.28,
        onUpdate: (v) => {
          boss.position.z = base - Math.sin(v * Math.PI) * 0.9;
        },
        onComplete: () => {
          boss.position.z = base;
        },
      });
    }

    function bossLunge() {
      if (reduced) return;
      const base = boss.position.z;
      feel.tween({
        from: 0,
        to: 1,
        duration: 0.34,
        onUpdate: (v) => {
          boss.position.z = base + Math.sin(v * Math.PI) * 2.0;
        },
        onComplete: () => {
          boss.position.z = base;
        },
      });
    }

    // idle motion + shard orbit + boss-hp ring scaling
    let elapsed = 0;
    const unsub = onFrame((dt) => {
      elapsed += dt;
      if (!reduced) {
        boss.position.y = 1.1 + Math.sin(elapsed * 1.4) * 0.18;
        boss.rotation.y += dt * 0.25;
        core.rotation.y -= dt * 0.8;
        core.rotation.x += dt * 0.4;
        shards.rotation.y += dt * 0.6;
        shards.children.forEach((s, i) => {
          const a = s.userData.a + elapsed * 0.5;
          s.position.y = Math.sin(a * 1.3 + i) * 0.6;
          s.rotation.x += dt * 1.2;
          s.rotation.z += dt * 0.8;
        });
        ring.rotation.z += dt * 0.15;
      }
      // billboard the nameplate toward camera
      nameLabel.lookAt &&
        nameLabel.position &&
        (nameLabel.material.rotation = 0);
    });
    frameUnsubs.push(unsub);

    // Camera intro: sweep in toward the boss.
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
          feel.syncCamera(); // re-base shake to true resting position
        },
      });
    }

    // ===================================================================
    //  WIN / LOSE
    // ===================================================================
    function winGame() {
      if (gameOver) return;
      gameOver = true;
      feel.sfx("win", "You defeated the boss! MCAP Champion!");
      panel.classList.add("bb-hidden");
      if (!reduced) {
        feel.burst(new THREE.Vector3(0, 1.5, 1), {
          color: 0xf2c15b,
          count: 90,
          spread: 9,
          life: 1.6,
        });
      }
      showBanner(
        `<div class="bb-big">🏆 VICTORY!</div>
         <div class="bb-small">You cleared all ${plan.phaseUnits.length} phases.</div>
         <div class="bb-small">Final score: ${ctxScore()}</div>
         <div class="bb-small">MCAP Boss Battle Champion — Grade 6 mastered!</div>
         <button class="bb-restart" type="button">Play again</button>`,
        0,
      );
      wireRestart();
      announce(`Victory! You defeated the boss. Final score ${ctxScore()}.`);
    }

    function loseGame() {
      if (gameOver) return;
      gameOver = true;
      feel.sfx("wrong", "Out of lives. Try again, hero.");
      panel.classList.add("bb-hidden");
      const { meta } = phaseIndexUnitMeta();
      showBanner(
        `<div class="bb-big">💥 DEFEATED</div>
         <div class="bb-small">You fell on Phase ${phaseIndex + 1}: ${meta.title}.</div>
         <div class="bb-small">Score: ${ctxScore()} — review ${meta.theme} and try again!</div>
         <button class="bb-restart" type="button">Try again</button>`,
        0,
      );
      wireRestart();
      announce(`Defeated on phase ${phaseIndex + 1}. Score ${ctxScore()}.`);
    }

    function ctxScore() {
      // The engine owns the running total; mirror it from the HUD score text.
      const el = document.querySelector('[data-hud="score"]');
      if (!el) return 0;
      const m = el.textContent.match(/-?\d+/);
      return m ? m[0] : 0;
    }

    function wireRestart() {
      const btn = banner.querySelector(".bb-restart");
      if (!btn) return;
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
      btn.addEventListener("click", () => location.reload());
      btn.focus();
    }

    // ===================================================================
    //  KEYBOARD: 1-4 / A-D pick a choice, Enter confirms focused button
    // ===================================================================
    function onKey(e) {
      if (gameOver || answered) return;
      const k = e.key.toLowerCase();
      let idx = -1;
      if (k >= "1" && k <= "4") idx = Number(k) - 1;
      else if (k >= "a" && k <= "d") idx = k.charCodeAt(0) - 97;
      if (idx >= 0) {
        const btns = choicesEl.querySelectorAll(".bb-choice");
        if (btns[idx]) {
          e.preventDefault();
          btns[idx].click();
        }
      }
    }
    window.addEventListener("keydown", onKey);

    // ===================================================================
    //  START
    // ===================================================================
    return {
      start() {
        dressForPhase();
        startPhase();
        cameraIntro();
        hud.setLives(lives);
        hud.setScore(0);
        const { meta } = phaseIndexUnitMeta();
        showBanner(
          `<div class="bb-small">MCAP BOSS BATTLE</div>
           <div class="bb-big">${meta.title}</div>
           <div class="bb-small">Phase 1 of ${plan.phaseUnits.length} · ${meta.theme}</div>
           <div class="bb-tip">Answer questions to attack. Wrong answers cost a life. Keys: 1-4 or A-D.</div>`,
          2200,
        );
        later(() => nextQuestion(), 2250);
        announce(
          `MCAP Boss Battle. ${plan.phaseUnits.length} phases. You have ${lives} lives. Answer math questions to attack the boss.`,
        );
      },
      dispose() {
        gameOver = true;
        window.removeEventListener("keydown", onKey);
        frameUnsubs.forEach((u) => u && u());
        timers.forEach((t) => clearTimeout(t));
        timers.clear();
        [panel, vignette, banner].forEach((el) => {
          if (el && el.parentNode) el.parentNode.removeChild(el);
        });
      },
    };
  },
};

// ---------------------------------------------------------------------------
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function injectStyles() {
  if (document.getElementById("bb3d-styles")) return;
  const s = document.createElement("style");
  s.id = "bb3d-styles";
  s.textContent = `
  .bb-panel{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);
    width:min(680px,calc(100% - 24px));z-index:30;
    background:rgba(11,22,40,.9);backdrop-filter:blur(4px);
    -webkit-backdrop-filter:blur(4px);
    border:1px solid rgba(255,255,255,.16);border-top:4px solid var(--amber,#f2c15b);
    border-radius:var(--radius-md,14px);padding:12px 14px 14px;
    box-shadow:0 10px 34px rgba(0,0,0,.45);color:#fff;
    font-family:var(--font-body,system-ui,sans-serif);}
  .bb-panel.bb-hidden{display:none;}
  .bb-q-meta{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
    color:var(--amber,#f2c15b);margin-bottom:6px;line-height:1.3;}
  .bb-q{margin:0 0 10px;font-size:clamp(15px,2.2vw,19px);font-weight:600;line-height:1.32;}
  .bb-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
  @media (max-width:520px){.bb-choices{grid-template-columns:1fr;}}
  .bb-choice{display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;
    padding:10px 12px;border-radius:12px;border:2px solid rgba(255,255,255,.18);
    background:rgba(31,166,162,.16);color:#fff;font-size:15px;font-weight:600;
    transition:transform .12s ease,border-color .12s ease,background .12s ease;}
  .bb-choice:hover:not(:disabled){border-color:var(--teal,#1fa6a2);transform:translateY(-2px);
    background:rgba(31,166,162,.3);}
  .bb-choice:focus-visible{outline:3px solid var(--amber,#f2c15b);outline-offset:2px;}
  .bb-choice:disabled{cursor:default;opacity:.95;}
  .bb-choice.is-correct{background:var(--success,#0f7c4a);border-color:#36d98a;}
  .bb-choice.is-wrong{background:var(--error,#b64e2f);border-color:#ff7a55;}
  .bb-key{flex:0 0 auto;width:26px;height:26px;border-radius:7px;display:flex;
    align-items:center;justify-content:center;background:rgba(0,0,0,.35);
    font-weight:800;font-size:14px;color:var(--amber,#f2c15b);}
  .bb-val{flex:1 1 auto;}
  .bb-why{margin-top:10px;font-size:13.5px;line-height:1.4;color:#dfe9f4;
    background:rgba(255,255,255,.07);border-radius:10px;padding:8px 10px;}
  .bb-vignette{position:absolute;inset:0;z-index:25;pointer-events:none;opacity:0;
    box-shadow:inset 0 0 140px 40px rgba(214,40,40,.0);}
  .bb-vignette.bb-flash{animation:bbflash .48s ease;}
  .bb-vignette.bb-flash-static{opacity:1;box-shadow:inset 0 0 140px 40px rgba(214,40,40,.5);}
  @keyframes bbflash{0%{opacity:0;box-shadow:inset 0 0 0 0 rgba(214,40,40,0);}
    25%{opacity:1;box-shadow:inset 0 0 160px 60px rgba(214,40,40,.65);}
    100%{opacity:0;box-shadow:inset 0 0 0 0 rgba(214,40,40,0);}}
  .bb-banner{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);
    z-index:40;text-align:center;color:#fff;pointer-events:auto;
    background:rgba(11,22,40,.92);border:1px solid rgba(255,255,255,.18);
    border-radius:18px;padding:22px 30px;box-shadow:0 18px 50px rgba(0,0,0,.5);
    font-family:var(--font-display,system-ui,sans-serif);max-width:90%;}
  .bb-banner.bb-pop{animation:bbpop .4s ease;}
  @keyframes bbpop{0%{transform:translate(-50%,-50%) scale(.7);opacity:0;}
    100%{transform:translate(-50%,-50%) scale(1);opacity:1;}}
  .bb-big{font-size:clamp(26px,5vw,40px);font-weight:800;margin:4px 0;
    color:var(--amber,#f2c15b);text-shadow:0 2px 8px rgba(0,0,0,.5);}
  .bb-small{font-size:15px;opacity:.92;margin:3px 0;font-family:var(--font-body,system-ui,sans-serif);}
  .bb-tip{font-size:13px;opacity:.78;margin-top:8px;font-family:var(--font-body,system-ui,sans-serif);}
  .bb-restart{margin-top:14px;cursor:pointer;border:none;border-radius:12px;
    padding:11px 22px;font-size:16px;font-weight:800;background:var(--teal,#1fa6a2);
    color:#fff;font-family:var(--font-display,system-ui,sans-serif);}
  .bb-restart:hover{filter:brightness(1.08);}
  .bb-restart:focus-visible{outline:3px solid var(--amber,#f2c15b);outline-offset:2px;}
  @media (prefers-reduced-motion: reduce){
    .bb-choice{transition:none;}.bb-banner.bb-pop{animation:none;}
    .bb-vignette.bb-flash{animation:none;}}
  /* keep the answer panel from colliding with on-screen touch dpad */
  @media (max-width:560px){.bb-panel{bottom:8px;width:calc(100% - 12px);padding:10px;}}
  `;
  document.head.appendChild(s);
}
