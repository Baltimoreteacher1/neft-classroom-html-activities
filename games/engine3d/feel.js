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

    /** Screen-shake. Magnitude in world units. */
    shake(magnitude = 0.4, duration = 0.3) {
      if (reduced || !camera) return;
      baseCamPos = camera.position.clone();
      shake = { t: 0, dur: duration, mag: magnitude };
    },

    /** Update the shake anchor if the camera was moved by the game. */
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
