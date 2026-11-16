// Audio for the Math Gaming Runtime: original, procedural, Web Audio only.
//
// Three independent buses (effects, music, narration), each with its own
// volume in the settings menu. The context is created on the first user
// gesture and never before. Every cue is optional: a refused or missing
// AudioContext leaves `ready()` false and the game plays on in silence, and
// every cue that carries meaning also has a visual or text equivalent in the
// shell (captions, HUD pulses).

const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);

// Per-world ambient beds: root note, scale degrees and tempo for the generative pad.
export const AMBIENT = {
  plant: { root: 45, scale: [0, 3, 7, 10, 12, 15], bpm: 84, wave: "triangle" },
  rail: { root: 50, scale: [0, 2, 4, 7, 9, 12], bpm: 104, wave: "triangle" },
  workshop: { root: 48, scale: [0, 2, 5, 7, 9, 12], bpm: 76, wave: "sine" },
  city: { root: 52, scale: [0, 2, 4, 7, 9, 11], bpm: 96, wave: "triangle" },
  vault: { root: 43, scale: [0, 3, 5, 7, 10, 12], bpm: 72, wave: "sine" },
  news: { root: 47, scale: [0, 2, 3, 7, 9, 12], bpm: 88, wave: "triangle" },
  factory: { root: 46, scale: [0, 2, 5, 7, 10, 12], bpm: 92, wave: "square" },
  shield: { root: 44, scale: [0, 3, 5, 7, 8, 12], bpm: 80, wave: "sine" },
  kitchen: { root: 53, scale: [0, 2, 4, 5, 7, 9], bpm: 100, wave: "triangle" },
  final: { root: 41, scale: [0, 3, 5, 6, 7, 10], bpm: 90, wave: "sawtooth" },
};

export class AudioBus {
  constructor(volumes) {
    /** @type {AudioContext | null} */
    this.ctx = null;
    this.vol = { sfx: 0.8, music: 0.45, voice: 1, ...(volumes || {}) };
    this.bus = {};
    this.music = null;
    this.rate = new Map();
  }

  /** Create or resume the context. Call from a pointer or key handler only. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || /** @type {any} */ (window).webkitAudioContext;
      if (!Ctor) return;
      try {
        this.ctx = new Ctor();
      } catch {
        return;
      }
      const master = this.ctx.createDynamicsCompressor();
      master.connect(this.ctx.destination);
      for (const name of ["sfx", "music"]) {
        const g = this.ctx.createGain();
        g.gain.value = this.vol[name] * (name === "music" ? 0.5 : 0.6);
        g.connect(master);
        this.bus[name] = g;
      }
      if (this.pendingBed) this.startMusic(this.pendingBed);
    }
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
  }

  ready() {
    return !!this.ctx && this.ctx.state === "running";
  }

  setVolume(name, v) {
    this.vol[name] = v;
    const g = this.bus[name];
    if (g && this.ctx)
      g.gain.setTargetAtTime(v * (name === "music" ? 0.5 : 0.6), this.ctx.currentTime, 0.03);
  }

  /** One enveloped voice on a bus. `slide` = end frequency for a pitch glide. */
  voice(bus, freq, type, start, dur, peak, slide = 0, filter = 0) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.012, dur / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let tail = /** @type {AudioNode} */ (osc);
    if (filter) {
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = filter;
      osc.connect(f);
      tail = f;
    }
    tail.connect(gain);
    gain.connect(this.bus[bus]);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  /** A short burst of filtered noise (steam, sparks, wheels). */
  noise(dur, peak, freq, start = 0) {
    const ctx = this.ctx;
    const len = Math.max(1, (ctx.sampleRate * dur) | 0);
    if (!this.noiseBuf || this.noiseBuf.length < len) {
      this.noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0);
      let s = 22222;
      for (let i = 0; i < d.length; i++) {
        s = (s * 16807) % 2147483647;
        d[i] = (s / 2147483647) * 2 - 1;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = freq;
    const g = ctx.createGain();
    const t0 = ctx.currentTime + start;
    g.gain.setValueAtTime(peak, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f);
    f.connect(g);
    g.connect(this.bus.sfx);
    src.start(t0, 0, dur);
  }

  /** Play a named effect. Rate-limited per name so held inputs cannot stack hundreds. */
  sfx(name, amount = 1) {
    if (!this.ready()) return;
    const now = this.ctx.currentTime;
    if (now - (this.rate.get(name) || 0) < 0.045) return;
    this.rate.set(name, now);
    const v = (f, type, s, d, p, slide, filt) => this.voice("sfx", f, type, s, d, p, slide, filt);
    switch (name) {
      case "jump":
        v(300, "square", 0, 0.14, 0.07, 620, 1800);
        break;
      case "land":
        v(120, "sine", 0, 0.12, 0.14 * amount, 60);
        this.noise(0.06, 0.05 * amount, 900);
        break;
      case "dash":
        this.noise(0.18, 0.12, 2400);
        v(520, "sawtooth", 0, 0.16, 0.05, 180, 1400);
        break;
      case "step":
        this.noise(0.03, 0.03, 1500);
        break;
      case "tick":
        v(1100, "square", 0, 0.012, 0.05);
        break;
      case "open":
        v(392, "triangle", 0, 0.1, 0.09);
        v(523, "triangle", 0.06, 0.14, 0.08);
        break;
      case "power":
        v(110, "sawtooth", 0, 0.5, 0.09, 330, 900);
        v(220, "triangle", 0.1, 0.5, 0.08, 660);
        break;
      case "lock":
        v(880, "triangle", 0, 0.06, 0.08);
        v(165, "sine", 0, 0.18, 0.14);
        break;
      case "strain":
        v(62, "sawtooth", 0, 0.5, 0.11, 0, 220);
        v(66, "sawtooth", 0.02, 0.5, 0.09, 0, 220);
        break;
      case "success":
        v(NOTE(69), "triangle", 0, 0.8, 0.13);
        v(NOTE(72), "triangle", 0.09, 0.8, 0.12);
        v(NOTE(76), "triangle", 0.18, 1.0, 0.11);
        break;
      case "discover":
        for (let i = 0; i < 5; i++) v(NOTE(72 + [0, 4, 7, 11, 14][i]), "sine", i * 0.07, 0.6, 0.08);
        break;
      case "shift":
        v(880, "sine", 0, 0.7, 0.1, 110);
        v(110, "sine", 0, 0.7, 0.1, 880);
        this.noise(0.5, 0.06, 3200);
        break;
      case "rewind":
        v(660, "triangle", 0, 0.45, 0.09, 165);
        this.noise(0.4, 0.05, 1800);
        break;
      case "checkpoint":
        v(NOTE(74), "sine", 0, 0.3, 0.1);
        v(NOTE(81), "sine", 0.12, 0.5, 0.09);
        break;
      case "talk":
        v(500 + amount * 180, "triangle", 0, 0.06, 0.05, 640 + amount * 120);
        break;
      case "whistle":
        v(1180, "sine", 0, 0.35, 0.07, 1250);
        v(1480, "sine", 0, 0.35, 0.05, 1560);
        break;
      case "brake":
        this.noise(0.4, 0.08, 4200);
        break;
      case "pickup":
        v(NOTE(84), "sine", 0, 0.12, 0.09);
        v(NOTE(88), "sine", 0.06, 0.18, 0.08);
        break;
    }
  }

  /** Start (or change) the ambient bed: a slow generative arpeggio on the music bus. */
  startMusic(bed) {
    this.pendingBed = bed;
    if (!this.ctx) return;
    this.stopMusic();
    const def = AMBIENT[bed] || AMBIENT.plant;
    const beat = 60 / def.bpm;
    let step = 0;
    let seed = 7;
    const schedule = () => {
      if (!this.ready() || this.vol.music <= 0) return;
      seed = (seed * 16807) % 2147483647;
      const deg = def.scale[seed % def.scale.length];
      const oct = step % 8 === 0 ? -12 : (seed >> 4) % 3 === 0 ? 12 : 0;
      this.voice("music", NOTE(def.root + 12 + deg + oct), def.wave, 0, beat * 2.4, 0.045, 0, 1400);
      if (step % 4 === 0) this.voice("music", NOTE(def.root - 12), "sine", 0, beat * 4, 0.06);
      step++;
    };
    this.music = setInterval(schedule, beat * 1000);
  }

  stopMusic() {
    if (this.music) clearInterval(this.music);
    this.music = null;
  }

  /**
   * Optional spoken directions. The caption is always shown by the shell; speech
   * is an extra when the browser has a voice for the language.
   */
  speak(text, lang) {
    if (this.vol.voice <= 0 || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang === "es" ? "es-US" : "en-US";
      u.volume = this.vol.voice;
      u.rate = 0.95;
      speechSynthesis.speak(u);
    } catch {
      /* speech is optional */
    }
  }

  hush() {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {
      /* optional */
    }
  }
}
