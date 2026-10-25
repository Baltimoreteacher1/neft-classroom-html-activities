// Speaking recorder. Recordings stay in this browser tab as object URLs — they
// are never uploaded or written to storage. A live level meter shows the
// student the microphone is hearing them (the commonest "it didn't work").
const takes = new Map(); // key → [{ url, seconds }]
let active = null; // { key, recorder, stream, chunks, started, raf, ctx }
let requestGeneration = 0;
export const ENVELOPE_FPS = 20;

export const canRecord = () =>
  Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
export const takesFor = (key) => takes.get(key) || [];
export const isRecording = (key) => active?.key === key;

// Counts down `seconds` one tick per second. Resolves true at zero, false if cancelled
// (stop() or a navigation bumps requestGeneration).
export function countdown(seconds, { onTick } = {}) {
  const generation = requestGeneration;
  let left = Math.max(0, Math.floor(seconds));
  return new Promise((resolve) => {
    const step = () => {
      if (generation !== requestGeneration) return resolve(false);
      onTick?.(left);
      if (left === 0) return resolve(true);
      left -= 1;
      setTimeout(step, 1000);
    };
    step();
  });
}

// `maxSeconds` (optional) ends the take automatically; onStop then gets { limited: true }.
export async function start(key, { onLevel, onStop, maxSeconds = 0 } = {}) {
  const generation = ++requestGeneration;
  await stopActive();
  if (generation !== requestGeneration) return null;
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  if (generation !== requestGeneration) {
    stream.getTracks().forEach((track) => track.stop());
    return null;
  }
  let recorder;
  try {
    recorder = new MediaRecorder(stream);
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }
  const chunks = [];
  const state = { key, recorder, stream, chunks, started: Date.now(), raf: 0, ctx: null, env: [], lastEnv: 0, limit: 0, limited: false };
  let finishStop;
  state.stopped = new Promise((resolve) => { finishStop = resolve; });
  recorder.addEventListener("dataavailable", (e) => e.data.size && chunks.push(e.data));
  recorder.addEventListener("stop", () => {
    stream.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(state.raf);
    clearTimeout(state.limit);
    state.ctx?.close().catch(() => {});
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
    const list = takes.get(key) || [];
    if (blob.size) list.push({
      id: `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      url: URL.createObjectURL(blob),
      blob,
      extension: blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm",
      seconds: Math.round((Date.now() - state.started) / 1000),
      // Loudness envelope at ENVELOPE_FPS, used for on-device pause/length analysis. Never uploaded.
      env: state.env.slice(0, ENVELOPE_FPS * 240),
      fps: ENVELOPE_FPS,
    });
    // Keep the three most recent takes so a student can compare tries.
    while (list.length > 3) URL.revokeObjectURL(list.shift().url);
    takes.set(key, list);
    if (active === state) active = null;
    try { onStop?.(list, { limited: state.limited }); }
    finally { finishStop(); }
  });
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      state.ctx = new Ctx();
      const analyser = state.ctx.createAnalyser();
      analyser.fftSize = 512;
      state.ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        const level = Math.min(1, peak / 64);
        const now = Date.now();
        if (now - state.lastEnv >= 1000 / ENVELOPE_FPS) {
          state.lastEnv = now;
          state.env.push(Math.round(level * 100) / 100);
        }
        onLevel?.(level, Math.round((now - state.started) / 1000));
        state.raf = requestAnimationFrame(tick);
      };
      tick();
    }
  } catch {}
  try {
    recorder.start();
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    cancelAnimationFrame(state.raf);
    state.ctx?.close().catch(() => {});
    finishStop();
    throw error;
  }
  active = state;
  if (maxSeconds > 0) {
    state.limit = setTimeout(() => {
      if (recorder.state === "inactive") return;
      state.limited = true;
      recorder.stop();
    }, maxSeconds * 1000);
  }
  return state;
}

function stopActive() {
  if (!active) return Promise.resolve();
  const { recorder, stopped } = active;
  if (recorder.state !== "inactive") recorder.stop();
  return stopped;
}

export function stop() {
  // Invalidate permission prompts too: getUserMedia may resolve after navigation.
  requestGeneration++;
  return stopActive();
}

export function clear(key) {
  for (const t of takes.get(key) || []) URL.revokeObjectURL(t.url);
  takes.delete(key);
}
