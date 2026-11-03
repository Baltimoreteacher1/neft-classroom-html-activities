// Speaking response UI: microphone check, preparation timer, recording with a live waveform, playback review,
// confirmation, and saved-on-device submission. All behaviour lives in SpeakingMachine and MicPreflight; this file
// only draws their state. Nothing records until the learner presses a button, and nothing is "submitted" until the
// audio is written to persistent storage and read back.
import { h, fmtClock } from "../engine/dom.js";
import { waveformSVG } from "../../waveform.js";
import { Capture } from "./capture.js";
import { MicPreflight, PREFLIGHT_MESSAGES } from "./mic-preflight.js";
import { SpeakingMachine } from "./speaking-machine.js";

const BARS = 32;

/** @param {{ getStorage: () => Promise<object>, env?: object }} deps */
export function makeSpeakingRenderer({ getStorage, env = globalThis }) {
  return function renderSpeaking(item, ctx) {
    const { doc } = ctx;
    const cfg = item.speaking;
    const root = h(doc, "div", { class: "acc-speak", "data-state": "READY" });
    const status = h(doc, "p", { class: "acc-hint", role: "status", "aria-live": "polite" });
    const micPanel = h(doc, "div", { class: "acc-mic" });
    const stage = h(doc, "div", { class: "acc-speak-stage" });
    root.append(micPanel, stage, status);
    const say = (m) => {
      status.textContent = m;
      ctx.announce?.(m);
    };

    let machine = null;
    let loop = 0;
    let url = null;
    const ring = new Array(BARS).fill(0);
    const meter = h(doc, "meter", { class: "acc-meter", min: "0", max: "1", value: "0", "aria-label": "Microphone level" });
    const micMsg = h(doc, "p", { class: "acc-mic-msg", role: "status", "aria-live": "polite", text: PREFLIGHT_MESSAGES.idle });
    const micBtn = h(doc, "button", { type: "button", class: "acc-btn", "data-act": "mic-check", text: "Check my microphone" });
    const preflight = new MicPreflight({
      env,
      onState: (state, msg) => {
        micMsg.textContent = msg;
        micPanel.dataset.state = state;
        micBtn.textContent = state === "ready" ? "Check again" : state === "idle" ? "Check my microphone" : ["requesting", "calibrating"].includes(state) ? "Checking…" : "Try again";
        micBtn.disabled = ["requesting", "calibrating"].includes(state);
        if (state === "interrupted") machine?.interrupted();
        drawStage();
      },
      onLevel: (lv) => (meter.value = lv),
    });
    micBtn.addEventListener("click", () => preflight.request());
    micPanel.append(h(doc, "h3", { text: "Microphone" }), micMsg, meter, micBtn);

    // Waveform: a fixed set of bars driven by the real analyser level (never simulated).
    const live = h(doc, "div", { class: "acc-live-wave", "aria-hidden": "true" }, ...Array.from({ length: BARS }, () => h(doc, "i")));
    const paintLive = () => live.childNodes.forEach((n, i) => (n.style.height = `${Math.max(4, Math.round(ring[i] * 100))}%`));

    const stopLoop = () => {
      clearInterval(loop);
      loop = 0;
    };
    const startLoop = () => {
      stopLoop();
      loop = setInterval(() => {
        const lv = preflight.level();
        machine?.capture?.sample?.(lv);
        ring.push(lv);
        ring.shift();
        paintLive();
      }, 50);
    };

    const ensureMachine = () => {
      machine?.destroy();
      machine = new SpeakingMachine(cfg, {
        now: () => Date.now(),
        setTimer: (fn, ms) => setInterval(fn, ms),
        clearTimer: (id) => clearInterval(id),
        capture: (maxSeconds) => new Capture(preflight.takeStream(), { env, maxSeconds, analyser: preflight.analyser }),
        store: {
          put: async (rec) => (await getStorage()).recordings.put({ ...rec, itemId: item.id, sessionId: ctx.session?.id || null }),
          has: async (id) => (await getStorage()).recordings.has(id),
        },
      });
      let last = "READY";
      machine.on((snap) => {
        if (snap.state !== last) {
          if (snap.state === "RECORDING") {
            beep(env);
            say("Recording has started. Start speaking now.");
            startLoop();
          } else if (last === "RECORDING") stopLoop();
          if (snap.state === "REVIEWING") say(`Recording finished: ${snap.take.seconds} seconds. Listen, then choose.`);
          last = snap.state;
        }
        root.dataset.state = snap.state;
        drawStage();
      });
      return machine;
    };

    const clock = (s) => fmtClock(s);
    function drawStage() {
      if (url && machine?.state !== "REVIEWING" && machine?.state !== "CONFIRMING") {
        URL.revokeObjectURL(url);
        url = null;
      }
      const snap = machine?.snapshot() || { state: "READY", takesUsed: 0, takesAllowed: cfg.takes === 2 ? 2 : 1 };
      const error = snap.error ? h(doc, "p", { class: "acc-state is-error", role: "alert", text: snap.error }) : null;
      const kids = [];
      const goBtn = (label, act, fn, primary = true, disabled = false) => {
        const b = h(doc, "button", { type: "button", class: `acc-btn${primary ? " primary" : ""}`, "data-act": act, text: label, disabled });
        b.addEventListener("click", fn);
        return b;
      };
      switch (snap.state) {
        case "READY":
          kids.push(h(doc, "p", { text: `You will have ${cfg.prepSeconds} seconds to plan, then up to ${cfg.recordSeconds} seconds to speak.${cfg.takes === 2 ? " You may record two times and keep the one you prefer." : " You can record one time."}` }), goBtn(cfg.prepSeconds ? "Start planning" : "Start recording", "speak-begin", () => (ensureMachine(), machine.begin()), true, !preflight.ready));
          if (!preflight.ready) kids.push(h(doc, "p", { class: "acc-hint", text: "Check your microphone first." }));
          break;
        case "PREPARING":
          kids.push(h(doc, "p", { class: "acc-countdown", role: "timer", "aria-live": "off", text: `Planning time: ${clock(snap.prepLeft)}` }), h(doc, "p", { class: "acc-hint", text: "Think about what you will say. Recording starts by itself when planning time ends." }), goBtn("Start recording now", "speak-skip", () => machine.skipPrep(), false));
          break;
        case "RECORDING":
          kids.push(h(doc, "p", { class: "acc-recording", role: "status" }, h(doc, "span", { class: "acc-rec-dot", "aria-hidden": "true" }), ` Recording · ${clock(snap.recLeft)} left`), live, goBtn("Stop recording", "speak-stop", () => machine.stop()));
          break;
        case "PROCESSING":
          kids.push(h(doc, "p", { text: "Getting your recording ready…" }));
          break;
        case "REVIEWING":
        case "CONFIRMING": {
          if (!url) url = URL.createObjectURL(snap.take.blob);
          kids.push(h(doc, "p", { class: "acc-hint", text: `Your recording · ${snap.take.seconds} seconds` }), h(doc, "audio", { controls: true, src: url, "aria-label": "Play your recording" }), h(doc, "div", { class: "acc-wave", "aria-hidden": "true" }));
          kids[kids.length - 1].innerHTML = waveformSVG(snap.take.env);
          if (snap.state === "REVIEWING") {
            const row = h(doc, "div", { class: "acc-actions" });
            if (machine.takesLeft > 0) row.append(goBtn(`Record again (${machine.takesLeft} left)`, "speak-again", () => machine.rerecord(), false));
            row.append(goBtn("Use this recording", "speak-use", () => machine.useTake()));
            kids.push(row);
          } else {
            kids.push(h(doc, "div", { class: "acc-state is-warn", role: "group", "aria-label": "Confirm submission" }, h(doc, "p", { text: "Submit this recording? You cannot change it after you submit." }), h(doc, "div", { class: "acc-actions" }, goBtn("Yes, submit", "speak-confirm", async () => (await machine.confirm()) && finishSubmitted()), goBtn("Go back", "speak-back", () => machine.back(), false))));
          }
          break;
        }
        default:
          break;
      }
      stage.replaceChildren(...(error ? [error] : []), ...kids);
    }

    async function finishSubmitted() {
      const sub = machine.submitted;
      ctx.onChange({ submitted: true, recordingId: sub.recordingId, mimeType: sub.mimeType, seconds: sub.seconds, takes: sub.takes });
      say("Your recording was saved on this device for your teacher.");
      preflight.release();
      await drawSubmitted(sub.recordingId, sub.seconds);
    }
    async function drawSubmitted(id, seconds) {
      stage.replaceChildren(h(doc, "p", { class: "acc-state is-success", role: "status", text: `Saved on this device for your teacher · ${seconds} seconds. The lab does not score speaking.` }));
      micPanel.hidden = true;
      try {
        const rec = await (await getStorage()).recordings.get(id);
        if (rec?.blob) {
          url = URL.createObjectURL(rec.blob);
          stage.append(h(doc, "audio", { controls: true, src: url, "aria-label": "Play your saved recording" }));
        } else stage.append(h(doc, "p", { class: "acc-hint", text: "The audio is not on this device any more, but your teacher review status is kept." }));
      } catch {
        stage.append(h(doc, "p", { class: "acc-hint", text: "Playback is not available right now." }));
      }
    }

    if (ctx.response?.submitted) drawSubmitted(ctx.response.recordingId, ctx.response.seconds);
    else drawStage();
    if (ctx.readOnly && !ctx.response?.submitted) root.append(h(doc, "p", { class: "acc-hint", text: "Recording is paused while you read the feedback." }));
    return {
      el: root,
      get: () => (machine?.submitted ? { submitted: true, recordingId: machine.submitted.recordingId } : ctx.response || undefined),
      focus: () => (preflight.ready ? stage.querySelector("button") : micBtn)?.focus(),
      destroy() {
        stopLoop();
        machine?.destroy();
        preflight.destroy();
        if (url) URL.revokeObjectURL(url);
      },
    };
  };
}

/** A short cue so the transition from planning to recording is not visual-only. Failure-safe; the banner is the primary cue. */
export function beep(env = globalThis) {
  try {
    const Ctx = env.AudioContext || env.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.value = 0.05;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => ctx.close();
  } catch {}
}
