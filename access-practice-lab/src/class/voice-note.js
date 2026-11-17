// The teacher's "record a voice note back" control, shared by the recordings list and the scoring queue
// (roster-panel.js, review-queue.js). The note answers one shared recording through POST /api/class/audio/note.
import { beginRecording, endRecording, recordingType, takeType } from "../audio-session.js";
import { el, errorText, toBase64 } from "./dom.js";

/** Player for one class recording; the bytes load on first play with the teacher's own headers. */
export function recordingPlayer(api, item) {
  const audio = el("audio", {
    controls: true,
    preload: "none",
    "aria-label": item.label || "audio",
  });
  audio.addEventListener(
    "play",
    async () => {
      if (audio.src) return;
      const blob = await api.audioBlob(item.audioId || item.itemId);
      if (blob) {
        audio.src = URL.createObjectURL(blob);
        audio.play().catch(() => {});
      }
    },
    { once: true },
  );
  return audio;
}

/** [button, status] that record a note and send it as the answer to `parentId`. */
export function voiceNoteButton({ S, api, parentId, onSent }) {
  let recorder = null;
  let chunks = [];
  const status = el("span", { class: "fine", role: "status" });
  const label = () => S("Record a voice note", "Grabar una nota de voz");
  const btn = el("button", { type: "button", class: "btn small" }, label());
  btn.addEventListener("click", async () => {
    if (recorder) {
      recorder.stop();
      return;
    }
    try {
      beginRecording();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch((error) => {
        endRecording();
        throw error;
      });
      const asked = recordingType();
      recorder = asked ? new MediaRecorder(stream, { mimeType: asked }) : new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        endRecording();
        const blob = new Blob(chunks, { type: takeType(recorder, chunks, asked) });
        recorder = null;
        btn.textContent = label();
        const sent = await api.audioNote({
          parentId,
          label: S("Note from your teacher", "Nota de tu maestro o maestra"),
          mime: blob.type,
          data: await toBase64(blob),
        });
        status.textContent = sent.ok ? S("Sent.", "Enviada.") : errorText(S, sent.error);
        if (sent.ok) onSent?.();
      };
      recorder.start();
      btn.textContent = S("Stop and send", "Detener y enviar");
    } catch {
      status.textContent = S(
        "The microphone is not available.",
        "El micrófono no está disponible.",
      );
    }
  });
  return [btn, status];
}
