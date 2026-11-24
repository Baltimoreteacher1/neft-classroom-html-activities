import { SPEAKING } from "../data.js";
import { canDictate, startDictation, DICTATION_NOTE } from "../../stt.js";
import { speak, stopSpeaking, recordAnswer, awardXP, countSession, shuffle, byLevel, norm, escapeHtml, levelName } from "../core.js";

export const meta = {
  id: "speaking",
  title: "Speak & Shadow",
  skill: "Speaking",
  level: "Starter–Stretch",
  blurb: "Eight high-value phrases to shadow. Use the microphone for a word-match check, or self-assess quietly.",
  icon: "speaking",
  accent: "#ff6b4a",
  time: "5 min"
};

const LEVEL_OPTIONS = ["All", "A1", "A2", "B1"];

export function mount(root) {
  let level = "All";
  let queue = [];
  let index = 0;
  let result = null;
  let error = null;
  let listening = false;
  let xp = 0;
  let completed = 0;

  const mic = canDictate();
  let session = null;
  let micMode = "";

  const levelBar = () => `<div class="speed-row" role="group" aria-label="Choose level">Level
    ${LEVEL_OPTIONS.map((l) => `<button type="button" data-action="level" data-level="${l}" aria-pressed="${l === level}">${l === "All" ? "All" : levelName(l)}</button>`).join("")}
  </div>`;

  function pick() {
    queue = shuffle(byLevel(SPEAKING, level)).slice(0, 4);
    index = 0;
    result = null;
    error = null;
    xp = 0;
    completed = 0;
  }

  function summary() {
    xp += awardXP(8);
    countSession();
    root.innerHTML = `<div class="act"><div class="result">
      <div class="score">${completed}<small> / ${queue.length}</small></div>
      <h3>Voices need reps, not perfection.</h3>
      <p>Try one phrase again tomorrow — spaced speaking is what turns recognition into reflex. Say it to a mirror, a friend or your phone.</p>
      <p class="small muted" style="margin-top:10px">+${xp} XP</p>
      <div class="act-actions">
        <button class="btn btn-primary" data-action="again">New phrases</button>
        <a class="btn" href="#activities">Choose another activity</a>
      </div>
    </div></div>`;
  }

  function render() {
    if (index >= queue.length) return summary();
    const item = queue[index];
    const chips = result?.words
      ? `<div class="word-chips">${result.words.map((w) => `<span class="${w.hit ? "hit" : "miss"}">${escapeHtml(w.w)}</span>`).join("")}</div>`
      : "";

    root.innerHTML = `<div class="act">
      <div class="act-head">
        <div class="progress-dots" aria-hidden="true">${queue.map((_, i) => `<i class="${i < index ? "done" : i === index ? "now" : ""}"></i>`).join("")}</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">${levelBar()}<span class="count">${index + 1} / ${queue.length}</span></div>
      </div>
      <div class="phrase-card">
        <p class="small" style="opacity:.75;margin-bottom:8px">${levelName(item.lvl)} · ${escapeHtml(item.meaning)}</p>
        <div class="target">${escapeHtml(item.phrase)}</div>
        <div class="ipa">${escapeHtml(item.ipa)}</div>
        <div class="tip">💡 ${escapeHtml(item.tip)}</div>
        <div class="mic-row">
          <button type="button" class="audio-btn on-dark" data-action="model"><span aria-hidden="true">🔊</span> Hear the model</button>
          <button type="button" class="audio-btn on-dark" data-action="slow"><span aria-hidden="true">🐢</span> Slow version</button>
        </div>
      </div>

      <div class="act-actions" style="margin-top:18px">
        ${mic
          ? listening
            ? `<button class="btn btn-primary mic-btn recording" data-action="stop-mic"><span aria-hidden="true">🎤</span> Listening… tap when you are done</button>`
            : `<button class="btn btn-primary mic-btn" data-action="mic"><span aria-hidden="true">🎤</span> Record my attempt</button>`
          : `<span class="pill">Microphone check unavailable in this browser</span>`}
        <button class="btn" data-action="next">Skip / next phrase →</button>
      </div>

      ${mic && micMode ? `<p class="small muted" style="margin-top:10px">${escapeHtml(DICTATION_NOTE[micMode][0])}</p>` : ""}
      ${error ? `<div class="feedback wrong" style="margin-top:16px"><strong>Microphone not available.</strong>${escapeHtml(error)}</div>` : ""}

      ${result ? `<div class="feedback" style="margin-top:16px">
        <strong>${result.words ? `${result.pct >= 80 ? "Clear match" : result.pct >= 50 ? "Close" : "Partly heard"} — ${result.words.filter((w) => w.hit).length} of ${result.words.length} words` : "Self-rated — noted"}</strong>
        ${result.words ? `You said: “${escapeHtml(result.transcript)}”` : escapeHtml(result.transcript)}
        ${chips}
        <span class="rule">Aim for the stressed words, not every sound. Repeat the model twice, then try again.</span>
      </div>` : ""}

      <div class="q-card" style="margin-top:18px">
        <p class="small muted" style="margin-bottom:8px"><strong>No microphone, or prefer to work quietly?</strong> Listen to the model, say it three times, then rate your own attempt honestly.</p>
        <div class="act-actions">
          <button class="btn btn-sm" data-action="self" data-self="low">Needs more practice</button>
          <button class="btn btn-sm" data-action="self" data-self="ok">Close enough</button>
          <button class="btn btn-sm btn-primary" data-action="self" data-self="great">Nailed it</button>
        </div>
      </div>
    </div>`;
  }

  function computeScore(item, transcript) {
    const spoken = norm(transcript);
    const words = item.phrase.replace(/[,.?!]/g, "").split(/\s+/).filter(Boolean);
    const chips = words.map((w) => {
      const key = norm(w);
      const hit = key.length <= 2 ? new RegExp(`(^|\\s)${key}(\\s|$)`).test(spoken) : spoken.includes(key);
      return { w, hit };
    });
    const hits = chips.filter((c) => c.hit).length;
    const pct = Math.round((hits / Math.max(1, chips.length)) * 100);
    return { transcript, words: chips, pct };
  }

  function finishAttempt(pct, transcript, words = null) {
    const item = queue[index];
    result = { pct, transcript, words };
    completed += 1;
    const xpGain = pct >= 80 ? 10 : pct >= 50 ? 6 : 3;
    xp += awardXP(xpGain);
    recordAnswer("speaking", item.id, pct >= 60);
    listening = false;
    render();
  }

  async function startMic() {
    if (!mic) return;
    error = null;
    result = null;
    listening = true;
    render();
    try {
      session = await startDictation({
        lang: "en-US",
        onError: (code) => {
          session = null;
          listening = false;
          error = code === "not-allowed" || code === "service-not-allowed"
            ? "Your browser blocked the microphone. Allow access in the address bar, or use the self-rating buttons below."
            : "We could not hear anything. Find a quieter moment and try once more — or use the self-rating buttons.";
          render();
        }
      });
      if (!session) {
        listening = false;
        error = error || "Recording could not start in this browser. Use the self-rating buttons instead.";
      } else {
        micMode = session.mode === "local" ? "local" : "standard";
      }
    } catch {
      session = null;
      listening = false;
      error = "Recording could not start in this browser. Use the self-rating buttons instead.";
    }
    if (!listening || !session) render();
  }

  async function stopMic() {
    const item = queue[index];
    const active = session;
    session = null;
    const transcript = active ? (await active.stop()).trim() : "";
    if (!transcript) {
      listening = false;
      error = "Nothing was recorded. Try again, a little closer to the microphone.";
      render();
      return;
    }
    const scored = computeScore(item, transcript);
    finishAttempt(scored.pct, transcript, scored.words);
  }

  function onClick(e) {
    const target = e.target.closest("[data-action]");
    if (!target) return;
    const action = target.dataset.action;
    const item = queue[index];
    if (action === "level") {
      level = target.dataset.level;
      pick();
      render();
    } else if (action === "model") {
      speak(item.phrase, { rate: 0.95 });
    } else if (action === "slow") {
      speak(item.phrase, { rate: 0.68 });
    } else if (action === "mic") {
      void startMic();
    } else if (action === "stop-mic") {
      void stopMic();
    } else if (action === "self") {
      const map = { low: { pct: 35, text: "self-assessed: needs practice" }, ok: { pct: 65, text: "self-assessed: close enough" }, great: { pct: 90, text: "self-assessed: strong attempt" } };
      const s = map[target.dataset.self] || map.ok;
      finishAttempt(s.pct, s.text);
    } else if (action === "next") {
      index += 1;
      result = null;
      error = null;
      render();
    } else if (action === "again") {
      pick();
      render();
    }
  }

  root.addEventListener("click", onClick);
  pick();
  render();

  return {
    destroy() {
      root.removeEventListener("click", onClick);
      stopSpeaking();
      void session?.stop();
    }
  };
}
