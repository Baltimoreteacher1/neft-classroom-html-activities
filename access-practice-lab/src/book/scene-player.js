// Book Studio 2.0 · the scene player: turns a page's scene actions into Web Animations on the real page elements.
// Deterministic (compileScene is pure; seek(t) always shows the same frame), lightweight (no video, no library), and
// respectful: reduced motion jumps to the final pose, sound and speech start only after the person presses Play and
// can be muted, nothing flashes. It is loaded only when a page has animation or the editor opens the timeline.
import { plainText } from "./model.js";
import { artSrc, exprFace } from "./render.js";
import { characterArt, compileScene, initiallyHidden, sceneDuration } from "./story.js";

let audioCtx = null;
/** Tiny synthesized sound effects (no assets, no downloads). Quiet by design. */
export function playSound(kind, volume = 0.08) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = audioCtx;
    const now = ctx.currentTime;
    const tone = (freq, start, len, type = "sine", glideTo = 0) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, now + start);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, now + start + len);
      g.gain.setValueAtTime(0.0001, now + start);
      g.gain.exponentialRampToValueAtTime(volume, now + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
      o.connect(g).connect(ctx.destination);
      o.start(now + start);
      o.stop(now + start + len + 0.05);
    };
    if (kind === "door") {
      tone(90, 0, 0.18, "triangle");
      tone(70, 0.12, 0.2, "triangle");
    } else if (kind === "chime") {
      tone(880, 0, 0.35);
      tone(1320, 0.12, 0.4);
    } else if (kind === "creak") tone(180, 0, 0.7, "sawtooth", 120);
    else if (kind === "whoosh") tone(300, 0, 0.4, "sine", 1200);
    else if (kind === "footsteps")
      for (let i = 0; i < 4; i++) tone(110, i * 0.22, 0.08, "triangle");
    return true;
  } catch {
    return false;
  }
}

const ease = "ease-in-out";

/**
 * Create a player over a rendered page. `root` is the `.bk-page` element (read or edit mode).
 * opts: { reduced(): boolean, muted(): boolean, voices(): boolean, characters, onTime(ms), onEnd() }
 */
export function createScenePlayer(root, page, opts = {}) {
  const compiled = compileScene(page.scene, page.elements);
  const duration = Math.max(compiled.duration, 1);
  const cam = root.querySelector(".bk-cam") || root;
  const anims = [];
  let t = 0;
  let playing = false;
  let raf = 0;
  let startedAt = 0;
  let fired = new Set();
  const hidden = initiallyHidden(page.scene);
  const node = (id) => root.querySelector(`[data-el="${id}"]`);

  for (const id of hidden) {
    const n = node(id);
    if (n) n.style.opacity = "0";
  }
  const spec = (n, keyframes, delay, dur) => {
    const a = n.animate(keyframes, { delay, duration: dur, fill: "both", easing: ease });
    a.pause();
    a.currentTime = 0;
    anims.push(a);
  };
  for (const tr of compiled.tracks) {
    const n = node(tr.target);
    if (n) spec(n, tr.keyframes, tr.delay, tr.duration);
  }
  for (const s of compiled.speaks) {
    const n = s.bubbleId && node(s.bubbleId);
    if (n)
      spec(
        n,
        [
          { offset: 0, opacity: 0 },
          { offset: 1, opacity: 1 },
        ],
        s.t,
        200,
      );
  }
  // Camera: each action eases from the previous framing to its own.
  let prev = { zoom: 1, x: 50, y: 50 };
  for (const c of compiled.camera) {
    const to = { zoom: c.zoom ?? prev.zoom, x: c.x, y: c.y };
    const a = cam.animate(
      [
        { transformOrigin: `${prev.x}% ${prev.y}%`, transform: `scale(${prev.zoom})` },
        { transformOrigin: `${to.x}% ${to.y}%`, transform: `scale(${to.zoom})` },
      ],
      { delay: c.t, duration: Math.max(1, c.dur), fill: "both", easing: ease },
    );
    a.pause();
    a.currentTime = 0;
    anims.push(a);
    prev = to;
  }

  function exprAt(ms) {
    const last = new Map();
    for (const e of compiled.expressions) if (e.t <= ms) last.set(e.target, e.expression);
    for (const [target, expr] of last) {
      const n = node(target);
      if (!n) continue;
      n.querySelector(".bk-expr")?.remove();
      if (expr && expr !== "neutral") n.insertAdjacentHTML("beforeend", exprFace(expr));
      const ch = (opts.characters || []).find((c) => c.id === n.dataset.char);
      const img = n.querySelector("img.bk-art");
      if (ch?.poses?.[expr] && img) img.src = artSrc(characterArt(ch, expr));
    }
  }

  function seek(ms) {
    t = Math.max(0, Math.min(duration, ms));
    for (const a of anims) a.currentTime = t;
    exprAt(t);
    opts.onTime?.(t);
  }

  function fire(from, to) {
    for (const s of compiled.sounds)
      if (s.t >= from && s.t < to && !fired.has(`s${s.t}${s.sound}`)) {
        fired.add(`s${s.t}${s.sound}`);
        if (!opts.muted?.()) playSound(s.sound);
      }
    for (const sp of compiled.speaks)
      if (sp.t >= from && sp.t < to && !fired.has(`p${sp.t}${sp.bubbleId}`)) {
        fired.add(`p${sp.t}${sp.bubbleId}`);
        const b = sp.bubbleId && page.elements.find((e) => e.id === sp.bubbleId);
        const ch = (opts.characters || []).find(
          (c) => c.id === (b?.speaker || node(sp.target)?.dataset.char),
        );
        if (b && opts.voices?.() && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(plainText(b.html));
          u.rate = ch?.voice?.rate || 1;
          u.pitch = ch?.voice?.pitch || 1;
          speechSynthesis.speak(u);
        }
      }
  }

  function tick(now) {
    if (!playing) return;
    const prevT = t;
    const next = Math.min(duration, now - startedAt);
    for (const a of anims) a.currentTime = next;
    t = next;
    fire(prevT, next + 1);
    exprAt(t);
    opts.onTime?.(t);
    if (next >= duration) {
      playing = false;
      opts.onEnd?.();
      return;
    }
    raf = requestAnimationFrame(tick);
  }

  return {
    duration: sceneDuration(page.scene),
    get time() {
      return t;
    },
    get playing() {
      return playing;
    },
    play() {
      if (opts.reduced?.()) {
        seek(duration);
        opts.onEnd?.();
        return;
      }
      if (t >= duration) seek(0);
      fired = new Set();
      playing = true;
      startedAt = performance.now() - t;
      raf = requestAnimationFrame(tick);
    },
    pause() {
      playing = false;
      cancelAnimationFrame(raf);
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    },
    seek,
    reset() {
      this.pause();
      seek(0);
    },
    finalPose() {
      seek(duration);
    },
    destroy() {
      playing = false;
      cancelAnimationFrame(raf);
      for (const a of anims) a.cancel();
      for (const id of hidden) {
        const n = node(id);
        if (n) n.style.opacity = "";
      }
    },
  };
}
