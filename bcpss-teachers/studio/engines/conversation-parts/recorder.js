// Optional local recording for a learner turn. Nothing is requested until the learner presses Start; the audio stays in
// this tab (a blob URL), is never uploaded, and is deleted on request or when the widget is destroyed.
import { h } from "../../core/dom.js";

export const canRecord = () => typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/** Returns {el, destroy}. */
export function recorderWidget({ announce }) {
  let stream = null;
  let rec = null;
  let url = null;
  const body = h("div", { class: "st-cv-rec-body" });
  const root = h("div", { class: "st-cv-rec" }, body);

  const stopTracks = () => {
    stream?.getTracks().forEach((t) => t.stop());
    stream = null;
  };
  const wipe = () => {
    if (url) URL.revokeObjectURL(url);
    url = null;
  };
  const view = (...kids) => body.replaceChildren(...kids);
  const btn = (label, fn, cls = "") => h("button", { type: "button", class: `st-cv-btn ${cls}`.trim(), onclick: fn }, label);

  function idle() {
    wipe();
    if (!canRecord()) return view(h("p", { class: "st-cv-quiet" }, "Recording is not available in this browser. You can still say your answer out loud to a partner."));
    view(btn("Record my own answer", explain));
  }
  function explain() {
    view(
      h("p", {}, "Your browser will ask to use the microphone. The recording stays on this device and is never uploaded. You can replay it, then delete it."),
      h("div", { class: "st-cv-row" }, btn("Start recording", start, "st-cv-primary"), btn("Not now", idle)),
    );
    body.querySelector("button").focus();
  }
  async function start() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return view(h("p", { class: "st-cv-warn", role: "alert" }, "The microphone is not available or permission was not given. You can still say your answer out loud."), btn("Try again", explain));
    }
    const chunks = [];
    rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      stopTracks();
      url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      view(
        h("p", {}, "Recording saved on this device only."),
        h("audio", { controls: true, src: url, "aria-label": "Your recording" }),
        h("div", { class: "st-cv-row" }, btn("Delete recording", () => { idle(); announce("Recording deleted."); }), btn("Record again", () => { wipe(); explain(); })),
      );
      announce("Recording stopped. You can replay it or delete it.");
    };
    rec.start();
    view(h("p", { role: "status" }, "Recording. Say your answer, then press Stop."), btn("Stop recording", () => rec.state === "recording" && rec.stop(), "st-cv-primary"));
    body.querySelector("button").focus();
    announce("Recording started.");
  }
  idle();
  return {
    el: root,
    destroy() {
      if (rec && rec.state === "recording") {
        rec.onstop = null;
        rec.stop();
      }
      stopTracks();
      wipe();
    },
  };
}
