// Language Expeditions ambient sound (feature "feel"). OFF by default; the learner turns it on with the Sound button in
// the walk panel, and the choice is remembered on this device only (localStorage, never the save state). Everything is
// synthesized with WebAudio: no audio files, no network. Grades 3-5 hear soft night crickets, grades 6-8 a gentle
// wind; gathering a collectible plays a short soft chime. Ambience plays only while exploring (it would compete with
// Listening audio inside a stop) and ducks to silence while speech is playing. stop() silences everything.
const KEY = "lexp-feel-sound";
let ac = null;
let master = null;
let bed = null; // { gain, nodes, timers }

export function soundOn() {
  try {
    return localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}
function remember(on) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* private window or blocked storage: the choice simply is not remembered */
  }
}

function context() {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ac) {
    try {
      ac = new AC();
    } catch {
      return null;
    }
    master = ac.createGain();
    master.gain.value = 0.6;
    master.connect(ac.destination);
  }
  if (ac.state === "suspended") ac.resume().catch(() => {});
  return ac;
}

function noiseBuffer(c, seconds) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * seconds), c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i += 1) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown-ish noise: soft, no hiss
    d[i] = last * 3.5;
  }
  return buf;
}

function chirp(c, out) {
  const t = c.currentTime + 0.02;
  const pulses = 2 + Math.floor(Math.random() * 3);
  const f = 4200 + Math.random() * 600;
  for (let p = 0; p < pulses; p += 1) {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.value = f;
    const s = t + p * 0.07;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(0.05, s + 0.012);
    g.gain.linearRampToValueAtTime(0, s + 0.045);
    o.connect(g).connect(out);
    o.start(s);
    o.stop(s + 0.06);
  }
}

function startBed(band) {
  const c = context();
  if (!c || bed) return;
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.gain.linearRampToValueAtTime(1, c.currentTime + 1.2);
  gain.connect(master);
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, 3);
  src.loop = true;
  const filt = c.createBiquadFilter();
  const level = c.createGain();
  const timers = [];
  const nodes = [src];
  if (band === "6-8") {
    // Wind: band-passed noise whose pitch and loudness drift slowly.
    filt.type = "bandpass";
    filt.frequency.value = 500;
    filt.Q.value = 0.8;
    level.gain.value = 0.16;
    const lfo = c.createOscillator();
    const depth = c.createGain();
    lfo.frequency.value = 0.09;
    depth.gain.value = 260;
    lfo.connect(depth).connect(filt.frequency);
    const lfo2 = c.createOscillator();
    const depth2 = c.createGain();
    lfo2.frequency.value = 0.05;
    depth2.gain.value = 0.07;
    lfo2.connect(depth2).connect(level.gain);
    lfo.start();
    lfo2.start();
    nodes.push(lfo, lfo2);
  } else {
    // Night: a very low hush plus crickets at gentle random intervals.
    filt.type = "lowpass";
    filt.frequency.value = 380;
    level.gain.value = 0.05;
    const tick = () => {
      if (!bed) return;
      chirp(c, gain);
      timers.push(setTimeout(tick, 380 + Math.random() * 1500));
    };
    timers.push(setTimeout(tick, 400));
  }
  src.connect(filt).connect(level).connect(gain);
  src.start();
  // Duck while speech plays, so the explorer's sounds never cover a voice.
  const duck = setInterval(() => {
    const talking = typeof speechSynthesis !== "undefined" && speechSynthesis.speaking;
    gain.gain.setTargetAtTime(talking ? 0 : 1, c.currentTime, 0.15);
  }, 250);
  timers.push(duck);
  bed = { gain, nodes, timers };
}

function stopBed() {
  if (!bed) return;
  const b = bed;
  bed = null;
  for (const t of b.timers) {
    clearTimeout(t);
    clearInterval(t);
  }
  try {
    b.gain.gain.cancelScheduledValues(ac.currentTime);
    b.gain.gain.setValueAtTime(b.gain.gain.value, ac.currentTime);
    b.gain.gain.linearRampToValueAtTime(0, ac.currentTime + 0.25);
    for (const n of b.nodes) n.stop(ac.currentTime + 0.3);
  } catch {
    /* already stopped */
  }
  setTimeout(() => b.gain.disconnect(), 400);
}

/** A short soft chime when a collectible is gathered (only while sound is on). */
export function chime(band) {
  if (!bed) return;
  const c = context();
  if (!c) return;
  const base = band === "6-8" ? 660 : 880;
  [1, 1.5].forEach((m, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = base * m;
    const s = c.currentTime + i * 0.08;
    g.gain.setValueAtTime(0, s);
    g.gain.linearRampToValueAtTime(0.09, s + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.6);
    o.connect(g).connect(master);
    o.start(s);
    o.stop(s + 0.65);
  });
}

/** Starts the ambience for this band if the learner has turned sound on (never autoplays otherwise). */
export function resume(band) {
  if (!soundOn()) return;
  startBed(band);
  // After a reload the browser keeps audio suspended until the learner's next key or tap.
  if (ac?.state === "suspended") {
    const wake = () => ac?.resume().catch(() => {});
    document.addEventListener("pointerdown", wake, { once: true });
    document.addEventListener("keydown", wake, { once: true });
  }
}
/** Flips the device setting from a learner's click; returns the new state. */
export function toggle(band) {
  const on = !soundOn();
  remember(on);
  if (on) startBed(band);
  else stopBed();
  return on;
}
/** Silences everything (leaving explore mode, a route change, unmount). */
export const stop = stopBed;
