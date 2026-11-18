// Phone audio rules shared by every recorder and player in the lab.
// - iOS keeps a page in "call" audio while a microphone is open, which routes playback to the quiet earpiece
//   (heard as "nothing plays"). iOS 17+ exposes navigator.audioSession: recording sets "play-and-record", and any
//   playback switches back to "playback" so sound comes from the speaker.
// - Recordings use a format every browser can play back (MP4/AAC first, then WebM/Opus), and a blob is always
//   labelled with the type the recorder really produced.
// - Read-aloud (speechSynthesis) and Web Audio only start inside a real tap on iOS; the first tap unlocks both.

const session = () => (typeof navigator !== "undefined" ? navigator.audioSession : undefined);
let recording = 0;

const setSession = (type) => {
  const s = session();
  if (!s) return;
  try {
    if (s.type !== type) s.type = type;
  } catch {}
};

/** Call before getUserMedia; pair with endRecording() when the take stops (tracks stopped). */
export function beginRecording() {
  recording++;
  setSession("play-and-record");
}

export function endRecording() {
  recording = Math.max(0, recording - 1);
  if (!recording) setSession("playback");
}

/** Call before playing anything (speech, a file, a recorded take). */
export function forPlayback() {
  if (!recording) setSession("playback");
}

// Playback order matters: an MP4/AAC take plays everywhere (iPhone, Android, desktop); WebM does not play on
// older iPhones.
export const RECORD_TYPES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

/** The best type this browser can record, or "" to let the browser choose. */
export function recordingType(MR = globalThis.MediaRecorder) {
  if (!MR || typeof MR.isTypeSupported !== "function") return "";
  return (
    RECORD_TYPES.find((t) => {
      try {
        return MR.isTypeSupported(t);
      } catch {
        return false;
      }
    }) || ""
  );
}

/** The real type of a finished recording: the recorder's, else the chunks', else what was asked for. */
export const takeType = (recorder, chunks, asked = "") =>
  recorder?.mimeType || chunks?.find((c) => c?.type)?.type || asked || "audio/mp4";

export const extensionFor = (type = "") =>
  /mp4|aac|m4a/.test(type) ? "m4a" : /ogg/.test(type) ? "ogg" : /webm/.test(type) ? "webm" : "m4a";

let ctx = null;
/** A shared AudioContext for short sounds and meters, resumed on the first tap (iOS starts it suspended). */
export function audioContext() {
  const Ctx =
    typeof window !== "undefined" ? window.AudioContext || window.webkitAudioContext : null;
  if (!Ctx) return null;
  if (!ctx || ctx.state === "closed") ctx = new Ctx();
  if (ctx.state === "suspended") ctx.resume?.().catch?.(() => {});
  return ctx;
}

// The first real tap unlocks speech and Web Audio. pointerdown alone is not a user activation for speech on iOS,
// so touchend and click are listened to as well; whichever comes first does the work, once.
if (
  typeof document !== "undefined" &&
  typeof document.addEventListener === "function" &&
  typeof window !== "undefined"
) {
  let done = false;
  const unlock = () => {
    if (done) return;
    done = true;
    for (const ev of ["touchend", "click", "keydown"])
      document.removeEventListener(ev, unlock, true);
    forPlayback();
    try {
      if ("speechSynthesis" in window) {
        // A single character (not a space: iOS skips empty utterances) at zero volume.
        const u = new SpeechSynthesisUtterance(".");
        u.volume = 0;
        window.speechSynthesis.speak(u);
      }
    } catch {}
    try {
      const c = window.AudioContext || window.webkitAudioContext;
      if (c) {
        const a = audioContext();
        const buf = a.createBuffer(1, 1, 22050);
        const src = a.createBufferSource();
        src.buffer = buf;
        src.connect(a.destination);
        src.start(0);
      }
    } catch {}
  };
  for (const ev of ["touchend", "click", "keydown"])
    document.addEventListener(ev, unlock, { capture: true, passive: true });
  // Any <audio>/<video> starting to play (recorded takes, listening files) gets the speaker, not the earpiece.
  document.addEventListener("play", () => forPlayback(), true);
}
