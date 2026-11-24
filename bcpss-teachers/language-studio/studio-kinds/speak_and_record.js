// speak_and_record — say it, record it, listen back, check yourself. The recording never leaves the device:
// it lives in memory (a blob URL) for this page only and is dropped on re-record or when the page closes.
// With no microphone, no MediaRecorder or permission denied, the activity becomes a text-only self-check.
import { h } from "./_kit.js";
import { listenControls, slBtn, startKind } from "./_audio.js";

const canRecord = () =>
  Boolean(navigator.mediaDevices?.getUserMedia) && typeof window.MediaRecorder === "function";

const NO_MIC = {
  denied:
    "The microphone is off or blocked, so recording is not available. Say your answer out loud to a partner, then check yourself below.",
  unsupported:
    "This device cannot record. Say your answer out loud to a partner, then check yourself below.",
};

export default function mount(root, ctx) {
  const kit = startKind(root, ctx, "speak_and_record");
  const { prompt, frame, model, checklist } = ctx.payload;
  let state = canRecord() ? "idle" : "unsupported"; // idle | recording | ready | denied | unsupported
  let recorder = null;
  let stream = null;
  let url = null;
  let parts = [];
  const checked = new Set();

  const fb = kit.feedback("Say your answer out loud. Record it if you want to hear yourself.");
  const panel = h("div", { class: "sl-recorder" });
  const finish = slBtn("Finish", { primary: true, key: "finish", disabled: true });
  const finishNote = h("p", { class: "sl-note", id: "slFinishNote" });
  finish.setAttribute("aria-describedby", "slFinishNote");

  const stopTracks = () => {
    for (const t of stream?.getTracks?.() || []) t.stop();
    stream = null;
  };
  const dropRecording = () => {
    if (url) URL.revokeObjectURL?.(url);
    url = null;
    parts = [];
  };
  kit.onCleanup(() => {
    try {
      if (recorder?.state === "recording") recorder.stop();
    } catch {}
    stopTracks();
    dropRecording();
  });

  async function start() {
    dropRecording();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recorder = new MediaRecorder(stream);
    } catch {
      stopTracks();
      state = "denied";
      fb.set(
        "We could not use your microphone. You can still practice: say your answer out loud, then use the checklist.",
        "hint",
      );
      return render();
    }
    recorder.ondataavailable = (e) => e.data?.size && parts.push(e.data);
    recorder.onstop = () => {
      stopTracks();
      url = URL.createObjectURL(new Blob(parts, { type: recorder.mimeType || "audio/webm" }));
      state = "ready";
      fb.set("Recorded. Press Play back to listen to yourself.", "ok");
      render();
      panel.querySelector('[data-key="play"]')?.focus({ preventScroll: true });
    };
    recorder.start();
    state = "recording";
    fb.set("Recording. Speak now, then press Stop when you are finished.", "hint");
    render();
    panel.querySelector('[data-key="stop"]')?.focus({ preventScroll: true });
  }

  function again() {
    dropRecording();
    state = "idle";
    fb.set("");
    render();
    panel.querySelector('[data-key="record"]')?.focus({ preventScroll: true });
  }

  function render() {
    const nodes = [];
    if (state === "idle") {
      nodes.push(
        slBtn("Record", { primary: true, key: "record", label: "Start recording", onclick: start }),
      );
    } else if (state === "recording") {
      nodes.push(
        h("p", { class: "sl-recording", text: "Recording. Press Stop when you are finished." }),
        slBtn("Stop", {
          primary: true,
          key: "stop",
          label: "Stop recording",
          onclick: () => recorder.stop(),
        }),
      );
    } else if (state === "ready") {
      const audio = h("audio", { src: url, preload: "auto", "aria-label": "Your recording" });
      const play = () =>
        Promise.resolve(audio.play?.()).catch(() =>
          fb.set("We could not play it. Try Record again.", "hint"),
        );
      nodes.push(
        audio,
        slBtn("Play back", {
          primary: true,
          key: "play",
          label: "Play back your recording",
          onclick: play,
        }),
        slBtn("Record again", {
          key: "again",
          label: "Record again and replace this recording",
          onclick: again,
        }),
        h("p", {
          class: "sl-note",
          text: "Your recording stays on this device. It goes away when you record again or close this page.",
        }),
      );
    } else {
      nodes.push(h("p", { class: "sl-note sl-note--warn", role: "note", text: NO_MIC[state] }));
    }
    panel.replaceChildren(...nodes);
    const open = state === "ready" || state === "denied" || state === "unsupported";
    finish.disabled = !open;
    finishNote.textContent = open
      ? ""
      : "Finish opens after you record, or if recording is not available.";
  }

  const caption = h("p", { class: "sl-caption", id: "slModel", text: model });
  const modelBox = h(
    "div",
    { class: "sl-model", hidden: true },
    caption,
    listenControls(model, caption, { label: "model answer" }).el,
  );
  const modelBtn = slBtn("Show a model answer", {
    ghost: true,
    key: "model",
    onclick: () => {
      modelBox.hidden = !modelBox.hidden;
      modelBtn.setAttribute("aria-expanded", String(!modelBox.hidden));
      modelBtn.lastChild.textContent = modelBox.hidden
        ? "Show a model answer"
        : "Hide the model answer";
    },
  });
  modelBtn.setAttribute("aria-expanded", "false");
  modelBtn.setAttribute("aria-controls", "slModel");

  const list = h(
    "fieldset",
    { class: "sl-checklist" },
    h("legend", { text: "Check what you did" }),
    ...checklist.map((item, i) => {
      const box = h("input", { type: "checkbox", id: `slCheck${i}` });
      box.addEventListener("change", () => {
        if (box.checked) checked.add(i);
        else checked.delete(i);
        fb.set(box.checked ? "Good. You noticed that." : "", "ok");
      });
      return h("label", { class: "sl-check", for: `slCheck${i}` }, box, h("span", { text: item }));
    }),
    h("p", { class: "sl-note", text: "It is fine to leave one empty. You can record again." }),
  );

  finish.addEventListener("click", () => {
    const did =
      state === "ready"
        ? "You said it, listened back, and checked"
        : "You said it out loud and checked";
    kit.finish(0, checklist.length, `${did} ${checked.size} of ${checklist.length} things.`);
  });

  root.append(
    h(
      "div",
      { class: "sl-stage" },
      h("h3", { class: "sl-prompt", tabindex: "-1", "data-focus": "", text: prompt }),
      frame
        ? h(
            "p",
            { class: "sl-frame" },
            h("span", { class: "sl-frame__label", text: "Sentence frame: " }),
            frame,
          )
        : null,
      h("div", { class: "sg-actions" }, modelBtn),
      modelBox,
      panel,
      fb.el,
      list,
      h("div", { class: "sg-actions" }, finish),
      finishNote,
    ),
  );
  render();
  root.querySelector("[data-focus]")?.focus({ preventScroll: true });
  return () => kit.destroy();
}
