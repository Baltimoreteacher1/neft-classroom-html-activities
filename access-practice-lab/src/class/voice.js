// Voice notes on the learner's device (Language Page #23). A learner chooses to send a practice recording to the
// teacher; the teacher answers with a short voice note that the learner hears here, on their own device.
import { toBase64 } from "./dom.js";
import { api } from "./link.js";

/** Send one kept take (see audio-store.js) to the teacher. Returns the server's reply. */
export async function sendTake(link, { blob, type, label }) {
  return api.audioShare(link, { label: String(label || "").slice(0, 60), mime: type || blob.type, data: await toBase64(blob) });
}

/** The learner's own recordings and the teacher's notes, newest first; [] when the call fails. */
export async function loadVoiceNotes(link) {
  const res = await api.audioList(link);
  return res.ok ? [...(res.items || [])].sort((a, b) => b.createdAt - a.createdAt) : [];
}
