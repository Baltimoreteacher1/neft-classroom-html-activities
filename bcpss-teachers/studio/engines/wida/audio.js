// Listening audio: the browser's speech voice reads the transcript. No audio files. Replay is unlimited.
// Captions toggle shows the transcript. Everything degrades to captions when speech is unavailable.
import { h } from "../../core/dom.js";
import { canSpeak, isMuted } from "../../core/speech.js";
import { uid } from "./ui.js";

const PITCH = { adult: 1, child: 1.35, teen: 1.15 };
const SPEEDS = [
  ["Slow", 0.75],
  ["Normal", 0.92],
  ["Quick", 1.05],
];

let voices = [];
const loadVoices = () => {
  try {
    voices = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  } catch {
    voices = [];
  }
};
if (typeof speechSynthesis !== "undefined") {
  loadVoices();
  speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

export const segmentsOf = (audio) => (audio.segments?.length ? audio.segments : [{ speaker: "", text: audio.transcript, voiceHint: audio.voiceHint }]);

function utter(seg, rate, speedFactor = 1) {
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(seg.text);
    u.lang = "en-US";
    u.rate = rate;
    u.pitch = PITCH[seg.voiceHint] || 1;
    const v = voices.find((x) => x.lang === "en-US") || voices[0];
    if (v) u.voice = v;
    const words = seg.text.split(/\s+/).length;
    const wd = setTimeout(() => finish(), Math.max(2000, (words * 520) / (rate * speedFactor)) + 1500);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(wd);
      resolve();
    };
    u.onend = finish;
    u.onerror = finish;
    speechSynthesis.speak(u);
  });
}

/** createAudioPlayer(audio, {onPlay, onCaptions, captionsOn, label}) -> { el, stop() } */
export function createAudioPlayer(audio, { onPlay, onCaptions, captionsOn = false, label = "Listen" } = {}) {
  const segs = segmentsOf(audio);
  const available = canSpeak() && !isMuted();
  let token = 0;
  let rate = SPEEDS[1][1];
  let playing = false;
  const status = h("span", { class: "st-sr-only", role: "status", "aria-live": "polite" });
  const playBtn = h("button", { type: "button", class: "st-btn st-primary st-wida-play" }, "Play audio");
  const speed = h("select", { id: uid("speed"), class: "st-wida-select", "aria-label": "Speaking speed" }, SPEEDS.map(([n, r]) => h("option", { value: r, selected: r === rate }, n)));
  const capBtn = h("button", { type: "button", class: "st-btn", "aria-pressed": String(captionsOn) }, "Captions");
  const caps = h("div", { class: "st-wida-captions", hidden: !captionsOn, lang: "en" });
  segs.forEach((s, i) => caps.append(h("p", { "data-seg": i }, s.speaker ? h("strong", {}, `${s.speaker}: `) : null, s.text)));
  const note = h(
    "p",
    { class: "st-wida-audio-note", hidden: available },
    "Audio is not available in this browser or it is muted. Use Captions to read what the speaker says.",
  );
  const mark = (i) => caps.querySelectorAll("p").forEach((p, k) => p.classList.toggle("st-wida-now", k === i));

  const stop = () => {
    token++;
    if (canSpeak()) speechSynthesis.cancel();
    playing = false;
    playBtn.textContent = "Play audio";
    playBtn.setAttribute("aria-pressed", "false");
    mark(-1);
  };
  playBtn.addEventListener("click", async () => {
    if (playing) {
      stop();
      status.textContent = "Audio stopped.";
      return;
    }
    if (!available) {
      capBtn.click();
      return;
    }
    const my = ++token;
    playing = true;
    onPlay?.();
    playBtn.textContent = "Stop audio";
    playBtn.setAttribute("aria-pressed", "true");
    status.textContent = "Playing.";
    speechSynthesis.cancel();
    for (let i = 0; i < segs.length; i++) {
      if (my !== token) return;
      mark(i);
      await utter(segs[i], rate);
    }
    if (my === token) {
      stop();
      playBtn.textContent = "Play again";
      status.textContent = "Audio finished. You can play it again.";
    }
  });
  speed.addEventListener("change", () => {
    rate = Number(speed.value);
  });
  capBtn.addEventListener("click", () => {
    const on = capBtn.getAttribute("aria-pressed") !== "true";
    capBtn.setAttribute("aria-pressed", String(on));
    caps.hidden = !on;
    onCaptions?.(on);
  });
  const el = h("div", { class: "st-wida-audio", role: "group", "aria-label": label }, h("div", { class: "st-wida-audio-bar" }, playBtn, h("label", { class: "st-wida-speedlabel" }, "Speed ", speed), capBtn), note, caps, status);
  return { el, stop };
}
