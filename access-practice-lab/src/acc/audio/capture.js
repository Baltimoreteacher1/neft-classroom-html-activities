// MediaRecorder capture with real MIME detection. The file extension and type always come from what the browser
// actually produced: a WebM blob is never labelled WAV. (WAV is offered only if an encoder is added; none is.)
export const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4;codecs=mp4a.40.2", "audio/mp4", "audio/ogg;codecs=opus", "audio/ogg"];

export function pickMimeType(MR = globalThis.MediaRecorder) {
  if (typeof MR !== "function") return null;
  if (typeof MR.isTypeSupported !== "function") return "";
  return MIME_CANDIDATES.find((m) => MR.isTypeSupported(m)) ?? "";
}

export function extensionFor(mime) {
  const base = String(mime || "").split(";")[0].toLowerCase();
  if (base === "audio/webm") return "webm";
  if (base === "audio/mp4" || base === "audio/x-m4a") return "m4a";
  if (base === "audio/ogg") return "ogg";
  if (base === "audio/wav" || base === "audio/x-wav") return "wav";
  return "bin";
}

/** One recording from an existing MediaStream. Resolves to { blob, mimeType, extension, seconds, env }. */
export class Capture {
  constructor(stream, { env = globalThis, now = () => Date.now(), analyser = null, fps = 20, maxSeconds = 0 } = {}) {
    this.stream = stream;
    this.env = env;
    this.now = now;
    this.analyser = analyser;
    this.fps = fps;
    this.maxSeconds = maxSeconds;
    this.chunks = [];
    this.envelope = [];
    this.recorder = null;
    this.started = 0;
    this.timer = 0;
    this.limited = false;
    this.done = null;
  }
  get active() {
    return this.recorder?.state === "recording";
  }
  start(onTimeLimit) {
    const MR = this.env.MediaRecorder;
    const mime = pickMimeType(MR);
    if (mime === null) throw new Error("MediaRecorder is not available");
    this.recorder = mime ? new MR(this.stream, { mimeType: mime }) : new MR(this.stream);
    this.done = new Promise((resolve, reject) => {
      this.recorder.addEventListener("dataavailable", (e) => e.data?.size && this.chunks.push(e.data));
      this.recorder.addEventListener("error", (e) => reject(e.error || new Error("recording failed")));
      this.recorder.addEventListener("stop", () => {
        clearTimeout(this.timer);
        const type = this.recorder.mimeType || mime || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        const seconds = Math.max(0, Math.round((this.now() - this.started) / 100) / 10);
        if (!blob.size) return reject(new Error("The recording was empty."));
        resolve({ blob, mimeType: blob.type || type, extension: extensionFor(blob.type || type), seconds, limited: this.limited, env: this.envelope.slice(0, this.fps * 240), fps: this.fps });
      });
    });
    this.started = this.now();
    this.recorder.start(250);
    if (this.maxSeconds > 0)
      this.timer = setTimeout(() => {
        this.limited = true;
        onTimeLimit?.();
        this.stop();
      }, this.maxSeconds * 1000);
    return this.done;
  }
  /** Record one envelope sample (0..1). The UI calls this at ~20 fps from its level loop. */
  sample(level) {
    if (this.active) this.envelope.push(Math.round(Math.min(1, Math.max(0, level)) * 100) / 100);
  }
  stop() {
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    return this.done;
  }
  abort() {
    clearTimeout(this.timer);
    if (this.recorder && this.recorder.state !== "inactive") {
      this.chunks = [];
      this.recorder.stop();
    }
  }
}
