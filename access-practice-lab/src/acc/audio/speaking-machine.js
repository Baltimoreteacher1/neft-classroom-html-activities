// Speaking workflow state machine.
//   READY -> PREPARING -> RECORDING -> PROCESSING -> REVIEWING -> CONFIRMING -> SUBMITTED
// A take can be rejected from REVIEWING when takes remain (two-take practice): REVIEWING -> PREPARING (or RECORDING).
// Rules enforced here, not in the UI: preparation time, the recording limit, single or two takes, and that
// SUBMITTED is reached only after the audio has been written to persistent storage and read back as present.
export const STATES = Object.freeze(["READY", "PREPARING", "RECORDING", "PROCESSING", "REVIEWING", "CONFIRMING", "SUBMITTED"]);
const NEXT = {
  READY: ["PREPARING", "RECORDING"],
  PREPARING: ["RECORDING", "READY"],
  RECORDING: ["PROCESSING", "READY"],
  PROCESSING: ["REVIEWING", "READY"],
  REVIEWING: ["CONFIRMING", "PREPARING", "RECORDING"],
  CONFIRMING: ["SUBMITTED", "REVIEWING"],
  SUBMITTED: [],
};
export const clampPrep = (s) => Math.min(45, Math.max(0, Math.round(Number(s) || 0)));

export class SpeakingMachine {
  /**
   * @param {object} cfg { prepSeconds, recordSeconds, takes (1|2), allowFrames }
   * @param {object} io  { capture: () => Capture-like { start(), stop() }, store: { put, has, remove }, now, setTimer, clearTimer }
   */
  constructor(cfg, io) {
    this.cfg = { prepSeconds: clampPrep(cfg.prepSeconds), recordSeconds: Math.max(10, cfg.recordSeconds | 0), takes: cfg.takes === 2 ? 2 : 1 };
    this.io = io;
    this.state = "READY";
    this.take = null; // { id, blob?, mimeType, extension, seconds, env }
    this.takesUsed = 0;
    this.error = null;
    this.listeners = new Set();
    this.prepLeft = this.cfg.prepSeconds;
    this.recLeft = this.cfg.recordSeconds;
    this.timer = null;
    this.capture = null;
    this.submitted = null;
  }
  on(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  emit() {
    for (const fn of this.listeners) fn(this.snapshot());
  }
  snapshot() {
    return { state: this.state, prepLeft: this.prepLeft, recLeft: this.recLeft, takesUsed: this.takesUsed, takesAllowed: this.cfg.takes, take: this.take, error: this.error, submitted: this.submitted };
  }
  go(next) {
    if (!NEXT[this.state].includes(next)) throw new Error(`illegal speaking transition ${this.state} -> ${next}`);
    this.state = next;
    this.emit();
  }
  get takesLeft() {
    return this.cfg.takes - this.takesUsed;
  }

  // ── preparation ───────────────────────────────────────────────────────────
  begin() {
    if (this.state !== "READY") return false;
    this.error = null;
    if (this.cfg.prepSeconds === 0) return this.record();
    return this.prepare();
  }
  prepare() {
    this.go("PREPARING");
    this.prepLeft = this.cfg.prepSeconds;
    this.timer = this.io.setTimer(() => {
      this.prepLeft -= 1;
      this.emit();
      if (this.prepLeft <= 0) {
        this.io.clearTimer(this.timer);
        this.record();
      }
    }, 1000);
    return true;
  }
  skipPrep() {
    if (this.state !== "PREPARING") return false;
    this.io.clearTimer(this.timer);
    return this.record();
  }

  // ── recording ─────────────────────────────────────────────────────────────
  record() {
    this.io.clearTimer(this.timer);
    this.go("RECORDING");
    this.recLeft = this.cfg.recordSeconds;
    this.capture = this.io.capture(this.cfg.recordSeconds);
    let result;
    try {
      result = this.capture.start();
    } catch (e) {
      return this.fail(e);
    }
    this.timer = this.io.setTimer(() => {
      this.recLeft = Math.max(0, this.recLeft - 1);
      this.emit();
    }, 1000);
    result.then((r) => this.finishRecording(r)).catch((e) => this.fail(e));
    return true;
  }
  stop() {
    if (this.state !== "RECORDING") return false;
    this.capture.stop();
    return true;
  }
  finishRecording(r) {
    if (this.state !== "RECORDING") return;
    this.io.clearTimer(this.timer);
    this.go("PROCESSING");
    this.takesUsed += 1;
    this.take = { id: `take-${this.io.now().toString(36)}-${this.takesUsed}`, ...r };
    this.go("REVIEWING");
  }
  fail(e) {
    this.io.clearTimer(this.timer);
    this.error = e?.message || "Recording failed.";
    this.capture?.abort?.();
    this.state = "READY";
    this.emit();
    return false;
  }
  /** Capture ended because the stream was lost (device unplugged, permission revoked). */
  interrupted() {
    if (!["PREPARING", "RECORDING"].includes(this.state)) return;
    this.capture?.abort?.();
    this.io.clearTimer(this.timer);
    this.error = "The microphone was interrupted. Your recording was not saved. Check your microphone and begin again.";
    this.state = "READY";
    this.emit();
  }

  // ── review, confirm, submit ───────────────────────────────────────────────
  rerecord() {
    if (this.state !== "REVIEWING" || this.takesLeft < 1) return false;
    this.take = null;
    return this.cfg.prepSeconds ? this.prepare() : this.record();
  }
  useTake() {
    if (this.state !== "REVIEWING") return false;
    this.go("CONFIRMING");
    return true;
  }
  back() {
    if (this.state !== "CONFIRMING") return false;
    this.go("REVIEWING");
    return true;
  }
  /** Writes the audio, verifies it is present, and only then declares SUBMITTED. */
  async confirm() {
    if (this.state !== "CONFIRMING") return false;
    if (this.submitted) return true; // never submit twice
    const take = this.take;
    try {
      await this.io.store.put({ id: take.id, blob: take.blob, mimeType: take.mimeType, extension: take.extension, seconds: take.seconds, env: take.env, fps: take.fps });
      if (!(await this.io.store.has(take.id))) throw new Error("The recording could not be saved on this device.");
    } catch (e) {
      this.error = e?.name === "QuotaExceededError" ? "This device is out of storage space. Free some space, then confirm again." : e?.message || "The recording could not be saved.";
      this.emit();
      return false;
    }
    this.error = null;
    this.submitted = { recordingId: take.id, mimeType: take.mimeType, seconds: take.seconds, takes: this.takesUsed };
    this.go("SUBMITTED");
    return true;
  }

  /** Persistable summary. Only a reviewed take that is already in storage can be resumed. */
  resumeState() {
    if (this.submitted) return { state: "SUBMITTED", submitted: this.submitted, takesUsed: this.takesUsed };
    return { state: "READY", takesUsed: this.takesUsed };
  }
  destroy() {
    this.io.clearTimer(this.timer);
    this.capture?.abort?.();
    this.listeners.clear();
  }
}
