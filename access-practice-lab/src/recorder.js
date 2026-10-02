// Speaking recorder. Recordings stay in this browser tab as object URLs — they
// are never uploaded or written to storage. A live level meter shows the
// student the microphone is hearing them (the commonest "it didn't work").
const takes = new Map(); // key → [{ url, seconds }]
let active = null; // { key, recorder, stream, chunks, started, raf, ctx }
let requestGeneration = 0;

export const canRecord = () =>
  Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
export const takesFor = (key) => takes.get(key) || [];
export const isRecording = (key) => active?.key === key;

export async function start(key, { onLevel, onStop } = {}) {
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
  const state = { key, recorder, stream, chunks, started: Date.now(), raf: 0, ctx: null };
  let finishStop;
  state.stopped = new Promise((resolve) => { finishStop = resolve; });
  recorder.addEventListener("dataavailable", (e) => e.data.size && chunks.push(e.data));
  recorder.addEventListener("stop", () => {
    stream.getTracks().forEach((t) => t.stop());
    cancelAnimationFrame(state.raf);
    state.ctx?.close().catch(() => {});
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
    const list = takes.get(key) || [];
    if (blob.size) list.push({
      url: URL.createObjectURL(blob),
      seconds: Math.round((Date.now() - state.started) / 1000),
    });
    // Keep the three most recent takes so a student can compare tries.
    while (list.length > 3) URL.revokeObjectURL(list.shift().url);
    takes.set(key, list);
    if (active === state) active = null;
    try { onStop?.(list); }
    finally { finishStop(); }
  });
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx && onLevel) {
      state.ctx = new Ctx();
      const analyser = state.ctx.createAnalyser();
      analyser.fftSize = 512;
      state.ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let peak = 0;
        for (const v of buf) peak = Math.max(peak, Math.abs(v - 128));
        onLevel(Math.min(1, peak / 64), Math.round((Date.now() - state.started) / 1000));
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
