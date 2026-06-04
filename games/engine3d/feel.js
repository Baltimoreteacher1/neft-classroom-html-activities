import * as THREE from "three";
import { prefersReducedMotion } from "./a11y.js";

/**
 * Juice kit. ctx2 = { scene, camera, renderer, onFrame, announce? }
 * Respects prefers-reduced-motion: bursts/shake reduce or no-op.
 */
export function createFeel(ctx2 = {}) {
  const { scene, camera, renderer, onFrame, announce } = ctx2;
  const reduced = prefersReducedMotion();

  const tweens = new Set();
  const bursts = new Set();
  let shake = { t: 0, dur: 0, mag: 0 };
  let baseCamPos = camera ? camera.position.clone() : null;

  const audioCache = new Map();
  let audioEnabled = true;

  // ---- Procedural WebAudio SFX (no asset files) ----------------------------
  let actx = null;
  function ac() {
    if (actx) return actx;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      actx = AC ? new AC() : null;
    } catch {
      actx = null;
    }
    return actx;
  }
  // Named voices: simple oscillator envelopes that read as game feedback.
  const VOICES = {
    pop: { type: "triangle", f0: 520, f1: 720, dur: 0.12, gain: 0.18 },
    add: { type: "sine", f0: 440, f1: 660, dur: 0.1, gain: 0.16 },
    remove: { type: "sine", f0: 380, f1: 240, dur: 0.12, gain: 0.16 },
    correct: { type: "triangle", f0: 660, f1: 990, dur: 0.22, gain: 0.22 },
    win: { type: "triangle", f0: 523, f1: 1046, dur: 0.4, gain: 0.24 },
    wrong: { type: "sawtooth", f0: 220, f1: 130, dur: 0.26, gain: 0.16 },
    select: { type: "square", f0: 300, f1: 300, dur: 0.05, gain: 0.1 },
  };
  function playVoice(name) {
    if (!audioEnabled) return;
    const ctxA = ac();
    if (!ctxA) return;
    if (ctxA.state === "suspended") ctxA.resume().catch(() => {});
    const v = VOICES[name] || VOICES.pop;
    const t = ctxA.currentTime;
    const osc = ctxA.createOscillator();
    const g = ctxA.createGain();
    osc.type = v.type;
    osc.frequency.setValueAtTime(v.f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, v.f1), t + v.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v.gain, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + v.dur);
    osc.connect(g).connect(ctxA.destination);
    osc.start(t);
    osc.stop(t + v.dur + 0.02);
  }
  // A short ascending arpeggio for level/round completion.
  function playFanfare() {
    if (!audioEnabled) return;
    [0, 90, 180, 300].forEach((ms, i) =>
      setTimeout(() => playVoice(i === 3 ? "win" : "correct"), ms),
    );
  }

  if (onFrame) onFrame(update);

  function update(dt) {
    // tweens
    for (const tw of tweens) {
      tw.elapsed += dt;
      const p = Math.min(1, tw.elapsed / tw.dur);
      const e = ease(p);
      tw.onUpdate(tw.from + (tw.to - tw.from) * e, e);
      if (p >= 1) {
        tweens.delete(tw);
        if (tw.onComplete) tw.onComplete();
      }
    }
    // particle bursts
    for (const b of bursts) {
      b.age += dt;
      const positions = b.points.geometry.attributes.position;
      for (let i = 0; i < b.count; i++) {
        b.vel[i * 3 + 1] -= 4.5 * dt;
        positions.array[i * 3] += b.vel[i * 3] * dt;
        positions.array[i * 3 + 1] += b.vel[i * 3 + 1] * dt;
        positions.array[i * 3 + 2] += b.vel[i * 3 + 2] * dt;
      }
      positions.needsUpdate = true;
      b.points.material.opacity = Math.max(0, 1 - b.age / b.life);
      if (b.age >= b.life) {
        if (scene) scene.remove(b.points);
        b.points.geometry.dispose();
        b.points.material.dispose();
        bursts.delete(b);
      }
    }
    // screen shake
    if (shake.t < shake.dur && camera && baseCamPos) {
      shake.t += dt;
      const k = (1 - shake.t / shake.dur) * shake.mag;
      camera.position.set(
        baseCamPos.x + (Math.random() - 0.5) * k,
        baseCamPos.y + (Math.random() - 0.5) * k,
        baseCamPos.z,
      );
      if (shake.t >= shake.dur) camera.position.copy(baseCamPos);
    }
  }

  function ease(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  return {
    reducedMotion: reduced,

    /** Animate a numeric value. Returns a promise-like via onComplete. */
    tween({ from = 0, to = 1, duration = 0.4, onUpdate, onComplete }) {
      if (reduced || duration <= 0) {
        if (onUpdate) onUpdate(to, 1);
        if (onComplete) onComplete();
        return;
      }
      tweens.add({
        from,
        to,
        dur: duration,
        elapsed: 0,
        onUpdate: onUpdate || (() => {}),
        onComplete,
      });
    },

    /** Particle burst at a world position. */
    burst(position, opts = {}) {
      if (reduced || !scene) return;
      const {
        count = 24,
        color = 0xf2c15b,
        spread = 3.2,
        size = 0.14,
        life = 0.9,
      } = opts;
      const geo = new THREE.BufferGeometry();
      const arr = new Float32Array(count * 3);
      const vel = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        arr[i * 3] = position.x;
        arr[i * 3 + 1] = position.y;
        arr[i * 3 + 2] = position.z;
        vel[i * 3] = (Math.random() - 0.5) * spread;
        vel[i * 3 + 1] = Math.random() * spread;
        vel[i * 3 + 2] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
      const mat = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity: 1,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      bursts.add({ points, vel, count, age: 0, life });
    },

    /**
     * Screen-shake. Magnitude in world units. Does NOT re-anchor the base
     * camera position: shake offsets are applied relative to a stable
     * baseCamPos captured at construction. Overlapping shakes (or a shake
     * fired while a previous one is still settling) therefore never compound
     * or drift the camera from its real resting position. If the game moves
     * the camera deliberately, call syncCamera() to re-base.
     */
    shake(magnitude = 0.4, duration = 0.3) {
      if (reduced || !camera) return;
      if (!baseCamPos) baseCamPos = camera.position.clone();
      shake = { t: 0, dur: duration, mag: magnitude };
    },

    /**
     * Explicitly re-base the shake anchor to the camera's current position.
     * Call after the game intentionally repositions the camera so the next
     * shake settles to the new resting point instead of the old one.
     */
    syncCamera() {
      if (camera) baseCamPos = camera.position.clone();
    },

    /** Register an SFX url under a key. Graceful no-op if audio unavailable. */
    registerSound(key, url) {
      try {
        const a = new Audio(url);
        a.preload = "auto";
        audioCache.set(key, a);
      } catch {
        /* audio unavailable */
      }
    },

    /** Play a registered SFX. Optional caption text routes to announcer. */
    sound(key, caption) {
      if (caption && announce) announce(caption);
      if (!audioEnabled) return;
      const a = audioCache.get(key);
      if (!a) return;
      try {
        a.currentTime = 0;
        const p = a.play();
        if (p && p.catch) p.catch(() => {});
      } catch {
        /* autoplay blocked / unavailable */
      }
    },

    /**
     * Procedural sound effect — no asset files needed.
     * names: pop | add | remove | correct | win | wrong | select | fanfare
     * Optional caption routes to the screen-reader announcer.
     */
    sfx(name, caption) {
      if (caption && announce) announce(caption);
      if (name === "fanfare") playFanfare();
      else playVoice(name);
    },

    setAudioEnabled(on) {
      audioEnabled = !!on;
    },

    dispose() {
      tweens.clear();
      for (const b of bursts) {
        if (scene) scene.remove(b.points);
        b.points.geometry.dispose();
        b.points.material.dispose();
      }
      bursts.clear();
      audioCache.clear();
    },
  };
}
