// Microphone practice for the demonstration. The recording lives in this page's memory only: it is played back
// to the family and thrown away. It is never uploaded, never saved, and never turned into a score or a student record.
export const canRecord = () =>
  typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder === "function";

export function createRecorder(onChange) {
  let stream = null;
  let media = null;
  let chunks = [];
  let url = "";
  let state = canRecord() ? "idle" : "unsupported"; // idle | asking | recording | recorded | denied | unsupported | error
  const set = (next) => {
    state = next;
    onChange(state, url);
  };
  const release = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };
  const discard = () => {
    if (url) URL.revokeObjectURL(url);
    url = "";
    chunks = [];
  };
  return {
    get state() {
      return state;
    },
    get url() {
      return url;
    },
    async start() {
      if (!canRecord() || state === "recording" || state === "asking") return;
      discard();
      set("asking");
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (error) {
        set(error?.name === "NotAllowedError" || error?.name === "SecurityError" ? "denied" : "error");
        return;
      }
      try {
        media = new MediaRecorder(stream);
        media.ondataavailable = (e) => e.data?.size && chunks.push(e.data);
        media.onstop = () => {
          url = URL.createObjectURL(new Blob(chunks, { type: media.mimeType || "audio/webm" }));
          release();
          set("recorded");
        };
        media.start();
        set("recording");
      } catch {
        release();
        set("error");
      }
    },
    stop() {
      if (state === "recording" && media?.state === "recording") media.stop();
    },
    reset() {
      discard();
      release();
      set(canRecord() ? "idle" : "unsupported");
    },
    dispose() {
      if (media?.state === "recording") media.onstop = null;
      try {
        if (media?.state === "recording") media.stop();
      } catch {}
      discard();
      release();
    },
  };
}
