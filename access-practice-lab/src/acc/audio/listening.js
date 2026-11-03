// Controlled listening. A recording plays at most `maxPlays` times; the count survives reloads (it is stored with the
// session), so refreshing the page can never grant extra plays. In a test simulation there is no pausing or
// scrubbing; in learning mode the learner may pause, and may read the transcript.
//   A play is consumed once audio has actually been heard (>= MIN_HEARD_MS). A failure before that point refunds it,
//   so a broken speaker or an unsupported browser never costs the learner a play.
export const MIN_HEARD_MS = 1500;
export const DEFAULT_MAX_PLAYS = 2;

export class ListeningEngine {
  /**
   * @param {object} o
   * @param {{ play: () => Promise<"ended"|"stopped"|"failed">, stop: () => void }} o.player
   * @param {number} [o.maxPlays]
   * @param {"summative"|"formative"} [o.mode]
   * @param {number} [o.used]            plays already used (restored from the session)
   * @param {(used: number) => void} [o.onUsed]  persist plays used
   * @param {(s: object) => void} [o.onChange]
   * @param {() => number} [o.now]
   */
  constructor({ player, maxPlays = DEFAULT_MAX_PLAYS, mode = "summative", used = 0, onUsed, onChange, now = () => Date.now() }) {
    this.player = player;
    this.maxPlays = maxPlays;
    this.mode = mode;
    this.used = Math.min(used, maxPlays);
    this.onUsed = onUsed;
    this.onChange = onChange;
    this.now = now;
    this.status = "idle"; // idle | playing | failed | done
    this.message = "";
  }
  get remaining() {
    return Math.max(0, this.maxPlays - this.used);
  }
  get canPause() {
    return this.mode === "formative";
  }
  get canStop() {
    return this.mode === "formative";
  }
  snapshot() {
    return { status: this.status, used: this.used, remaining: this.remaining, maxPlays: this.maxPlays, message: this.message, canPause: this.canPause };
  }
  set(status, message = "") {
    this.status = status;
    this.message = message;
    this.onChange?.(this.snapshot());
  }

  /** Start a play. Resolves to "ended" | "stopped" | "failed" | "none-left" | "busy". */
  async play() {
    if (this.status === "playing") return "busy";
    if (this.remaining <= 0) {
      this.set("done", "No plays left.");
      return "none-left";
    }
    this.set("playing", "Playing…");
    const started = this.now();
    let outcome;
    try {
      outcome = await this.player.play();
    } catch {
      outcome = "failed";
    }
    const heard = this.now() - started;
    if (outcome === "failed" && heard < MIN_HEARD_MS) {
      this.set("failed", "The recording could not play. You did not lose a play. Check your speakers or volume, then try again.");
      return "failed";
    }
    this.used += 1; // heard: it counts, whether it finished or was interrupted
    this.onUsed?.(this.used);
    this.set(this.remaining ? "idle" : "done", outcome === "ended" ? (this.remaining ? "Finished." : "That was the last play.") : this.remaining ? "Stopped." : "That was the last play.");
    return outcome === "ended" ? "ended" : "stopped";
  }
  stop() {
    if (this.status === "playing" && this.canStop) this.player.stop();
  }
  /** A page hidden or a device change mid-play ends the audio; whatever was heard still counts. */
  interrupt() {
    if (this.status === "playing") this.player.stop();
  }
}

/** Build a player from the lab's speech engine. Multi-speaker scripts use `turns` ("Speaker: text" lines). */
export function ttsPlayer(stim, { speak, speakDialogue, stop, rate = 0.9 }) {
  const turns = stim.turns?.length ? stim.turns.map((t) => `${t.speaker}: ${t.text}`) : null;
  return {
    async play() {
      const ok = turns ? await speakDialogue(turns, { rate }) : await speak([stim.script], { rate });
      return ok ? "ended" : "failed";
    },
    stop,
  };
}

/** Play a recorded file. Controls are never exposed; the engine decides what the learner can do. */
export function fileAudioPlayer(src, { doc = document, rate = 1 } = {}) {
  let audio = null;
  return {
    play() {
      return new Promise((resolve) => {
        audio = new doc.defaultView.Audio(src);
        audio.playbackRate = rate;
        audio.addEventListener("ended", () => resolve("ended"));
        audio.addEventListener("error", () => resolve("failed"));
        audio.play().catch(() => resolve("failed"));
      });
    },
    stop() {
      audio?.pause();
      if (audio) audio.dispatchEvent(new doc.defaultView.Event("ended"));
    },
  };
}
