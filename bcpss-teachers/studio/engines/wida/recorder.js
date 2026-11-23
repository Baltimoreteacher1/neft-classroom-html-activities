// Optional local recording for Speaking tasks. Only after an explicit button press and a plain explanation.
// Audio lives in this browser tab (a blob URL) and is never uploaded. Nothing is transcribed, scored or analysed.
import { h } from "../../core/dom.js";

export const canRecord = () => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export function createRecorder({ onChange } = {}) {
  let stream = null;
  let rec = null;
  let url = null;
  let chunks = [];
  const out = h("div", { class: "st-wida-rec-out" });
  const status = h("p", { class: "st-wida-rec-status", role: "status", "aria-live": "polite" }, "");
  const start = h("button", { type: "button", class: "st-btn" }, "Record my answer");
  const stopBtn = h("button", { type: "button", class: "st-btn st-primary", hidden: true }, "Stop recording");
  const del = h("button", { type: "button", class: "st-btn", hidden: true }, "Delete recording");
  const explain = h(
    "p",
    { class: "st-wida-rec-explain" },
    "Recording is optional. When you press Record, your browser will ask to use the microphone. The recording stays in this tab on this device. It is not sent anywhere, not scored and not turned into text. It disappears when you close the page.",
  );
  const clear = () => {
    if (url) URL.revokeObjectURL(url);
    url = null;
    out.replaceChildren();
    del.hidden = true;
    onChange?.(false);
  };
  const release = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };
  start.addEventListener("click", async () => {
    clear();
    if (!canRecord()) {
      status.textContent = "Recording is not available in this browser. You can still say your answer aloud to a partner.";
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      status.textContent = "The microphone was not allowed, so nothing was recorded. You can still say your answer aloud to a partner.";
      return;
    }
    chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      release();
      if (!chunks.length) {
        status.textContent = "Nothing was recorded. Try again.";
        return;
      }
      url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      out.replaceChildren(h("audio", { controls: "", src: url, "aria-label": "My recording" }));
      del.hidden = false;
      status.textContent = "Recorded. Press play to listen to yourself.";
      onChange?.(true);
    };
    rec.start();
    start.hidden = true;
    stopBtn.hidden = false;
    status.textContent = "Recording. Say your answer, then press Stop recording.";
  });
  stopBtn.addEventListener("click", () => {
    if (rec?.state === "recording") rec.stop();
    stopBtn.hidden = true;
    start.hidden = false;
  });
  del.addEventListener("click", () => {
    clear();
    status.textContent = "Recording deleted.";
  });
  const el = h("section", { class: "st-wida-recorder", "aria-label": "Optional recording" }, h("h4", {}, "Record and listen (optional)"), explain, h("div", { class: "st-row" }, start, stopBtn, del), status, out);
  return {
    el,
    destroy() {
      if (rec?.state === "recording") rec.stop();
      release();
      if (url) URL.revokeObjectURL(url);
    },
  };
}
