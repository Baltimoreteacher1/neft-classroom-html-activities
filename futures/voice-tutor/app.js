/* Socratic Voice Tutor — guides with questions, never gives the answer.
 * PRIVACY: SpeechRecognition + SpeechSynthesis run on-device. Nothing is recorded,
 * stored, or transmitted; transcripts live only in memory for the session. */
(function () {
  "use strict";
  const PROBLEMS = window.TUTOR_PROBLEMS;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const hasTTS = "speechSynthesis" in window;
  let current = PROBLEMS[0],
    stageIdx = 0,
    recog = null,
    listening = false;

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s).replace(
      /[&<>]/g,
      (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
    );

  // ---- keyword matching (rule-based, on-device) ----
  function matches(transcript, stage) {
    const t = " " + transcript.toLowerCase() + " ";
    const groupHit = (group) =>
      group.some((kw) => t.includes(kw.toLowerCase()));
    return stage.match === "all"
      ? stage.keywords.every(groupHit)
      : stage.keywords.some(groupHit);
  }

  // ---- speech ----
  function speak(text) {
    if (!hasTTS) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.92;
    u.lang = "en-US";
    synth.speak(u);
  }
  function startListening() {
    if (!SR) return;
    recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 3;
    listening = true;
    updateMic();
    recog.onresult = (e) => {
      const alts = [...e.results[0]].map((r) => r.transcript).join(" ");
      handleResponse(alts);
    };
    recog.onerror = () => {
      listening = false;
      updateMic();
    };
    recog.onend = () => {
      listening = false;
      updateMic();
    };
    recog.start();
  }
  function stopListening() {
    if (recog) recog.stop();
    listening = false;
    updateMic();
  }
  function updateMic() {
    const mic = $("#mic");
    if (!mic) return;
    mic.classList.toggle("listening", listening);
    mic.textContent = listening ? "■" : "🎤";
    mic.setAttribute(
      "aria-label",
      listening ? "Stop listening" : "Speak your answer",
    );
  }

  // ---- response handling ----
  function handleResponse(transcript) {
    $("#transcript").innerHTML = `You said: <b>${esc(transcript)}</b>`;
    const stage = current.stages[stageIdx];
    if (matches(transcript, stage)) {
      speak(stage.encourage);
      showTutor(stage.encourage, false);
      stageIdx++;
      setTimeout(
        () => (stageIdx < current.stages.length ? renderStage() : finish()),
        1200,
      );
    } else {
      speak(stage.hint);
      showTutor(stage.hint, true);
    }
  }
  function showTutor(text, isHint) {
    const box = $("#tutor");
    box.className = "tutor" + (isHint ? " hint" : "");
    box.textContent = text;
  }

  // ---- rendering ----
  function renderStage() {
    const stage = current.stages[stageIdx];
    $("#ladder").innerHTML = current.stages
      .map(
        (_, i) =>
          `<span class="rung ${i < stageIdx ? "done" : i === stageIdx ? "active" : ""}"></span>`,
      )
      .join("");
    showTutor(stage.prompt, false);
    speak(stage.prompt);
    $("#transcript").innerHTML = "";
  }
  function finish() {
    $("#ladder").innerHTML = current.stages
      .map(() => `<span class="rung done"></span>`)
      .join("");
    $("#tutor").outerHTML =
      `<div class="done-banner" id="tutor">🎉 You reasoned all the way through it — without me ever giving the answer. That's real math thinking!</div>`;
    $("#controls").innerHTML =
      `<button class="btn" id="restart">Try another problem</button>`;
    $("#restart").addEventListener("click", () => location.reload());
  }

  function renderProblem(p) {
    current = p;
    stageIdx = 0;
    $("#picker")
      .querySelectorAll("button")
      .forEach((b) => b.setAttribute("aria-pressed", b.dataset.id === p.id));
    $("#tag").textContent = p.tag;
    $("#qtext").textContent = p.text;
    renderStage();
  }

  function init() {
    $("#picker").innerHTML = PROBLEMS.map(
      (p) =>
        `<button data-id="${p.id}" aria-pressed="${p === current}">${esc(p.title)}</button>`,
    ).join("");
    $("#picker")
      .querySelectorAll("button")
      .forEach((b) =>
        b.addEventListener("click", () =>
          renderProblem(PROBLEMS.find((p) => p.id === b.dataset.id)),
        ),
      );

    // mic vs typed fallback
    if (SR) {
      $("#mic").addEventListener("click", () =>
        listening ? stopListening() : startListening(),
      );
    } else {
      $("#mic").style.display = "none";
      $("#voice-note").textContent =
        "Voice input isn't supported in this browser — type your thinking below (works everywhere).";
    }
    $("#typed-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = $("#typed-input").value.trim();
      if (v) {
        handleResponse(v);
        $("#typed-input").value = "";
      }
    });
    $("#repeat").addEventListener("click", () =>
      speak(current.stages[stageIdx].prompt),
    );
    if (!hasTTS) $("#repeat").style.display = "none";
    renderProblem(PROBLEMS[0]);
  }
  document.addEventListener("DOMContentLoaded", init);
})();
