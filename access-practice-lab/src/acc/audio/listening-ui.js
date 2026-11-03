// Listening stimulus UI: play button, plays-left counter, accessible status, optional transcript (learning mode only).
import { h } from "../engine/dom.js";
import { DEFAULT_MAX_PLAYS, ListeningEngine, ttsPlayer } from "./listening.js";

/** @param {object} speech { speak, speakDialogue, stop, canSpeak } the lab's speech module */
export function makeAudioStimulusRenderer(speech) {
  return function renderAudio(stim, { doc, session, mode, announce }) {
    const tools = (session.tools ||= { highlights: {}, eliminated: {}, marks: [] });
    const plays = (tools.plays ||= {});
    const max = stim.maxPlays || DEFAULT_MAX_PLAYS;
    const engine = new ListeningEngine({
      player: ttsPlayer(stim, speech),
      maxPlays: max,
      mode,
      used: plays[stim.id] || 0,
      onUsed: (n) => {
        plays[stim.id] = n;
        session.onToolsChange?.();
      },
      onChange: (s) => paint(s),
    });
    const root = h(doc, "div", { class: "acc-listen", "data-stimulus": stim.id });
    const btn = h(doc, "button", { type: "button", class: "acc-btn primary acc-listen-play", "data-act": "listen-play" });
    const stopBtn = h(doc, "button", { type: "button", class: "acc-btn", text: "Stop", hidden: !engine.canStop, "data-act": "listen-stop" });
    const counter = h(doc, "p", { class: "acc-listen-count", "aria-live": "off" });
    const status = h(doc, "p", { class: "acc-hint", role: "status", "aria-live": "polite" });
    const bars = h(doc, "span", { class: "acc-bars", "aria-hidden": "true" }, h(doc, "i"), h(doc, "i"), h(doc, "i"), h(doc, "i"), h(doc, "i"));
    const paint = (s) => {
      const left = s.remaining;
      btn.textContent = s.status === "playing" ? "Playing…" : left === max ? `Play recording (${left} ${left === 1 ? "play" : "plays"})` : left ? `Play again (${left} ${left === 1 ? "play" : "plays"} left)` : "No plays left";
      btn.disabled = s.status === "playing" || left === 0;
      btn.setAttribute("aria-disabled", String(btn.disabled));
      counter.textContent = `Plays left: ${left} of ${s.maxPlays}`;
      status.textContent = s.message;
      root.dataset.state = s.status;
      stopBtn.disabled = s.status !== "playing";
      if (s.message && s.status !== "idle") announce?.(s.message);
    };
    btn.addEventListener("click", () => engine.play());
    stopBtn.addEventListener("click", () => engine.stop());
    root.append(h(doc, "p", { class: "acc-hint", text: mode === "summative" ? `You can listen ${max} times. You cannot pause or replay a part.` : `You can listen ${max} times. You can read the transcript to check what you heard.` }), h(doc, "div", { class: "acc-actions" }, btn, stopBtn, bars), counter, status);
    if (!speech.canSpeak()) root.prepend(h(doc, "p", { class: "acc-state is-warn", role: "alert", text: "This browser cannot play the recording. Use a recent Chrome, Edge, Safari or Firefox, or ask your teacher for the printed listening script." }));
    if (mode === "formative" && stim.transcript !== false) root.append(h(doc, "details", { class: "acc-transcript" }, h(doc, "summary", { text: "Show the transcript" }), h(doc, "p", { text: stim.script })));
    // A page that goes to the background ends the audio; the plays already heard still count.
    const onHide = () => doc.hidden && engine.interrupt();
    doc.addEventListener("visibilitychange", onHide);
    root.engine = engine;
    paint(engine.snapshot());
    return root;
  };
}
