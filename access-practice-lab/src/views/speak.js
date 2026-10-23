// Speaking Studio: authentic spoken production — plan, rehearse, record, listen back, review, re-record.
// Speaking ability is shown by speaking: every task here ends in a recording, never a multiple-choice
// answer. The lab cannot hear words, so the learner types what they said; the Language Coach works from
// that transcript, and from the loudness envelope for time speaking and pauses (all on this device).
import { crumbsHTML } from "../components.js";
import { loadMission, loadSpeakingTasks, loadStudioIndex } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import { LocalFeedbackProvider, LOCAL_FEEDBACK_MODEL_VERSION, LOCAL_FEEDBACK_PROMPT_VERSION } from "../lang/providers.js";
import { describeSpeech, summarizeEnvelope } from "../lang/audio.js";
import { appendEntry, buildProfile, loadLedger, saveLedger, suggestStage } from "../lang/ledger.js";
import { emptyReview, reviewComplete } from "../lang/rubrics.js";
import { addTake, choiceEffects, loadStudio, missionState, saveStudio, speakingState } from "../lang/studio.js";
import * as audioStore from "../audio-store.js";
import { canRecord, isRecording, takesFor } from "../recorder.js";
import { canSpeak, speak, speakDialogue, stop as stopSpeech } from "../speech.js";
import {
  feedbackHTML,
  rubricHTML,
  sourceHTML,
  stagePickerHTML,
  tableHTML,
  chartHTML,
  vocabListHTML,
  bridgesHTML,
  purposeBadgeHTML,
} from "../studio-ui.js";
import { BASE, announce, html, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let S = null;
const chosen = new Map(); // task id → stage picked before the first attempt
let kept = new Map(); // take id → object URL for recordings kept on this device
const feedbackProvider = new LocalFeedbackProvider();

const save = () => saveStudio(S.studio);
const dirLabel = {
  retell: "Retell",
  describe: "Describe",
  compare: "Compare",
  explain: "Explain",
  argue: "Argue",
  discuss: "Discuss",
};

async function findTask(id, from) {
  if (from?.startsWith("mission:")) {
    const mission = await loadMission(from.slice(8)).catch(() => null);
    const t = mission?.phases.flatMap((p) => p.tasks || []).find((x) => x.task?.id === id)?.task;
    if (t) return { task: { band: "6-8", ...t }, mission };
  }
  const t = (await loadSpeakingTasks()).tasks.find((x) => x.id === id);
  return t ? { task: t, mission: null } : null;
}
const backHref = (band) => `${BASE}/speak?grades=${band}`;
const missionHref = (m, band) => `${BASE}/missions/${m.id}?grades=${band}`;

function chooserHTML(ctx, index, entries) {
  const band = ctx.band;
  const tasks = index.speaking.filter((t) => t.band === band || !t.band);
  const recs = recommendTasks(tasks, entries, { band, n: 3 });
  const groups = Object.keys(dirLabel)
    .map((k) => [k, tasks.filter((t) => t.taskType === k)])
    .filter(([, l]) => l.length);
  const card = (t, why) =>
    html`<a class="card task-card" href="${BASE}/speak/${t.id}?grades=${band}"
      ><strong>${t.title}</strong
      ><span class="fine">${dirLabel[t.taskType]} · ${t.keyUse} · ${t.contentArea} · ${t.time}</span
      >${why ? html`<span class="fine">${why}</span>` : ""}</a
    >`;
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${band}`],
      ["Speaking Studio", null],
    ])}
    <section class="room-hero" style="--room:#8e4b10">
      <div>
        <span class="badge">Speaking Studio</span>
        <h1 tabindex="-1"><svg aria-hidden="true"><use href="${BASE}/pictures/lab-icons.svg#speaking"></use></svg> Speaking Studio</h1>
        <p class="lead">
          Plan, say it out loud, listen back, and say it better. You show your speaking by speaking.
        </p>
      </div>
    </section>
    ${
      recs.length
        ? html`<section class="panel">
            <h2>Try next</h2>
            <div class="task-grid">${recs.map((r) => card(r.task, r.why))}</div>
          </section>`
        : ""
    }
    ${groups.map(
      ([k, list]) =>
        html`<section class="panel">
          <h2>${dirLabel[k]}</h2>
          <div class="task-grid">${list.map((t) => card(t))}</div>
        </section>`,
    )}
    <p class="no-print"><a class="btn" href="${BASE}/printables/studio-speaking" target="_blank" rel="noopener">Print speaking task cards</a></p>
    <p class="disclaimer">
      Classroom speaking practice. The Language Coach reads the transcript you type and measures
      time and pauses on this device. It does not judge pronunciation, and it is not a WIDA score.
    </p>`;
}

function stimulusHTML(task) {
  const st = task.stimulus;
  if (!st || st.kind === "none") return "";
  if (st.kind === "audio")
    return html`<section class="source">
      <h3>Listen first</h3>
      <p class="fine">
        Listen as many times as you need. The words are not shown until after you speak.
      </p>
      <button type="button" class="btn" data-play-stimulus>▶ Listen</button>
      <button type="button" class="ghost" data-stop-audio>■ Stop</button>
    </section>`;
  if (st.kind === "chart") return html`<section class="source">${chartHTML(st.chart)}</section>`;
  if (st.kind === "table") return html`<section class="source">${tableHTML(st.table)}</section>`;
  if (st.kind === "text")
    return html`<section class="source">${(st.text || []).map((p) => html`<p>${p}</p>`)}</section>`;
  return "";
}

function plannerHTML(task, state) {
  return html`<section class="panel planner">
    <h3>1 · Plan what you will say</h3>
    ${task.planner.map((slot) => html`<label class="field"><span>${slot.label}</span><input type="text" data-plan="${slot.id}" value="${state.plan[slot.id] || ""}" ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`} ${IGN} /></label>`)}
    <label class="practiced"
      ><input type="checkbox" data-rehearsed ${state.rehearsed ? raw("checked") : ""} ${IGN} /> I
      said my plan quietly out loud once.</label
    >
  </section>`;
}

function supportsHTML(task) {
  if (S.stage === "independent")
    return html`<p class="fine">
      You chose to work on your own: no frames, words or model. Your plan and your voice are enough.
    </p>`;
  const g = task.stages.guided;
  return html`<section class="panel supports">
    <h3>Supports</h3>
    ${
      S.stage === "guided"
        ? html`<h4>Sentence frames</h4>
            <ul class="frames">
              ${g.frames.map((f) => html`<li>${f}</li>`)}
            </ul>`
        : ""
    }
    <h4>Word bank</h4>
    <ul class="wordbank">
      ${task.stages.supported.bank.map((w) => html`<li>${w}</li>`)}
    </ul>
    ${vocabListHTML(task.vocab)}
    ${bridgesHTML(task)}
    ${
      S.stage === "guided"
        ? html`<details data-model>
            <summary>Hear a model answer</summary>
            <p class="fine">Opening the model is saved as extra support.</p>
            <button type="button" class="btn" data-play-model>▶ Hear the model</button>
          </details>`
        : ""
    }
  </section>`;
}

function recorderBlock(task, state) {
  const key = task.id;
  const rec = isRecording(key);
  const takes = takesFor(key);
  const manual = state.takes.some((t) => t.manual);
  if (!canRecord())
    return html`<section class="panel">
      <h3>2 · Say it</h3>
      <p>
        <strong>This browser cannot record.</strong> Say your answer to a partner or your teacher
        out loud. Then press the button and type what you said.
      </p>
      ${manual ? "" : html`<button type="button" class="btn btn-primary" data-manual-take>I said it out loud</button>`}
    </section>`;
  const [lo, hi] = task.targetSeconds;
  return html`<section
    class="panel recorder ${rec ? "is-recording" : ""}"
    aria-label="Record your answer"
  >
    <h3>2 · Say it</h3>
    <p class="fine">
      Aim for ${lo}–${hi} seconds. Speak in a quiet place. Recordings stay on this device unless you
      keep one for your teacher.
    </p>
    <div class="rec-main">
      ${
        rec
          ? html`<button type="button" class="rec-btn is-stop" data-rec-stop="${key}">
                <span class="rec-dot" aria-hidden="true"></span>Stop
              </button>
              <div class="rec-live">
                <span class="rec-meter"></span><span class="rec-time">0s</span>
              </div>`
          : html`<button type="button" class="rec-btn" data-rec-start="${key}">
              <span class="rec-dot" aria-hidden="true"></span
              >${takes.length ? "Record again" : "Record my answer"}
            </button>`
      } <button type="button" class="ghost" data-say="${task.prompt}">🔊 Hear the task</button>
    </div>
    <p class="rec-error" data-rec-error="${key}" role="status"></p>
    ${manual || rec ? "" : html`<p class="fine">No microphone, or it is not working? <button type="button" class="ghost small" data-manual-take>I said it out loud (no recording)</button></p>`}
    ${
      takes.length
        ? html`<ol class="takes">
            ${takes.map((t, i) => html`<li><span>Try ${i + 1} · ${t.seconds}s</span><audio controls preload="none" aria-label="Play recording ${i + 1}" src="${t.url}"></audio>${audioStore.available() ? html`<button type="button" class="ghost small" data-keep="${t.id}">${state.takes.find((x) => x.id === t.id)?.keptAudio ? "✓ Kept for my teacher" : "Keep for my teacher"}</button>` : ""}<a class="ghost small" href="${t.url}" download="speaking-${task.id}-${i + 1}.${t.extension}">Download</a></li>`)}
          </ol>`
        : ""
    }
  </section>`;
}

/** A typed transcript that is much longer or shorter than the speaking measured is probably not a match. */
function transcriptCheck(take) {
  const words = wordCount(take.transcript);
  const seconds = take.audio?.ok ? take.audio.speechSeconds : 0;
  if (!words || !seconds) return "";
  const rate = words / seconds;
  if (rate > 4.5) return html`<p class="fine todo">You typed ${words} words for ${seconds} seconds of speaking. That is more than most people say that fast — check that you typed only what you said.</p>`;
  if (rate < 0.7 && seconds >= 8) return html`<p class="fine todo">You typed ${words} words for ${seconds} seconds of speaking. Did you leave parts out?</p>`;
  return "";
}

function analysisHTML(task, state, take) {
  if (!take) return "";
  const sum = take.audio;
  return html`<section class="panel">
    <h3>3 · Listen back, then type what you said</h3>
    <p class="fine">
      ${take.manual ? "Type what you said." : "Listen to your take. Then type what you said."} Type
      it exactly as you said it, including mistakes — the Language Coach can only look at the words
      you type, so a "cleaned-up" version would hide what to work on. It cannot hear your voice.
    </p>
    ${
      sum
        ? html`<ul class="speech-stats">
            ${describeSpeech(sum, task.targetSeconds).map((l) => html`<li class="${l.ok ? "ok" : "todo"}">${l.ok ? "✓" : "○"} ${l.text}</li>`)}
          </ul>`
        : ""
    }
    ${transcriptCheck(take)}
    <label class="field"
      ><span>What I said (exactly)</span
      ><textarea id="spk-transcript" rows="5" data-transcript ${IGN}>
${take.transcript || ""}</textarea>
    </label>
    <div class="row-actions">
      <button
        type="button"
        class="btn btn-primary"
        data-analyze
        ${wordCount(take.transcript) < 3 ? raw("disabled") : ""}
      >
        Check my language
      </button>
    </div>
  </section>`;
}

function resultsHTML(task, state, take, prev) {
  if (!take?.analyzedAt) return "";
  const a = analyzeResponse(take.transcript, optsFor(task));
  const delta = prev?.transcript
    ? compareDrafts(prev.transcript, take.transcript, optsFor(task))
    : null;
  return html`<section class="panel">
    <h3>4 · What your speaking shows</h3>
    ${feedbackHTML(a, take.transcript, { patternHref: (id) => `${BASE}/detective/${id}?grades=${S.band}` })}
    ${
      delta
        ? html`<div class="revision-coach-card card">
            <h4>📈 Compared with your last try</h4>
            <ul>
              ${delta.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to} ${c.better ? "⭐" : ""}</li>`)}${delta.gainedMoves.map((m) => html`<li>New: ${m.toLowerCase()} ⭐</li>`)}${prev.audio && take.audio ? html`<li>Speaking time: ${prev.audio.speechSeconds}s → ${take.audio.speechSeconds}s</li>` : ""}
            </ul>
          </div>`
        : ""
    }
    <section class="panel">
      <h3>5 · Review your speaking</h3>
      ${rubricHTML(take.selfReview || emptyReview(), { modality: "speaking", prefix: `self-${take.id}` })}
      <div class="row-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-finish
          ${reviewComplete(take.selfReview) ? "" : raw("disabled")}
        >
          Save my review</button
        ><button type="button" class="btn" data-again>Record again to improve</button>
      </div>
      ${take.finished ? html`<p class="saved-note">✓ Saved. This is practice evidence, not a score.</p>` : ""}
    </section>
  </section>`;
}

function teacherHTML(task, state) {
  const take = state.takes.at(-1);
  if (!take)
    return html`<section class="panel">
      <p>No recording has been made on this device yet.</p>
    </section>`;
  const reviews = take.teacherReview || [];
  return html`<section class="panel">
    <h2>Teacher conference review</h2>
    <p class="fine">
      Listen to the learner's take, then record practice bands. Saved on this device with the
      learner's work.
    </p>
    <p><strong>Task:</strong> ${task.title}</p>
    ${takesFor(task.id).at(-1) ? html`<audio controls src="${takesFor(task.id).at(-1).url}" aria-label="Learner recording"></audio>` : html`<p class="fine">${kept.get(take.id) ? "" : "Recording is not in memory. Open it from a kept recording in Passport."}</p>`}
    ${kept.get(take.id) ? html`<audio controls src="${kept.get(take.id)}" aria-label="Kept recording"></audio>` : ""}
    ${
      take.transcript
        ? html`<h3>What the learner typed</h3>
            <p class="portfolio-response">${take.transcript}</p>`
        : ""
    }
    <h3>Listen for</h3>
    <ul>
      ${(task.teacher?.listenFor || []).map((x) => html`<li>${x}</li>`)}
    </ul>
    ${rubricHTML(S.teacherDraft || emptyReview(), { who: "teacher", modality: "speaking", prefix: "teacher" })}
    <div class="row-actions">
      <button
        type="button"
        class="btn btn-primary"
        data-teacher-save
        ${reviewComplete(S.teacherDraft) ? "" : raw("disabled")}
      >
        Save teacher review
      </button>
    </div>
    ${
      reviews.length
        ? html`<h3>Earlier teacher reviews</h3>
            <ul>
              ${reviews.map((r) => html`<li>${r.t.slice(0, 10)} — ${["lc", "vu", "lctl"].map((k) => `${k}: ${r[k]}`).join(", ")}${r.note ? ` — ${r.note}` : ""}</li>`)}
            </ul>`
        : ""
    }
  </section>`;
}

const optsFor = (task) => ({
  keyUse: task.keyUse,
  modality: "speaking",
  sourceText: S.sourceText,
  sourceTerms: task.sourceTerms,
  wordBank: task.stages.supported.bank,
  stage: S.stage,
  expected: {
    minWords: Math.round(task.targetSeconds[0] * 1.6),
    maxWords: Math.round(task.targetSeconds[1] * 2.2),
  },
});
const stageSupports = () => ({
  frames: S.stage === "guided",
  bank: S.stage !== "independent",
  model: Boolean(S.state.used.model),
  coach: S.takeIndex > 0,
});

export async function render(ctx) {
  const index = await loadStudioIndex();
  S = { ...(S || {}), band: ctx.band, studio: loadStudio(), ledger: loadLedger() };
  const entries = S.ledger.entries;
  const id = ctx.route.id;
  if (!id) return { title: "Speaking Studio", html: chooserHTML(ctx, index, entries) };
  const found = await findTask(id, new URLSearchParams(location.search).get("from"));
  if (!found)
    return {
      title: "Not found",
      html: html`<section class="panel">
        <h1>We could not find that task.</h1>
        <a class="btn" href="${backHref(ctx.band)}">Speaking Studio</a>
      </section>`,
    };
  const { task, mission } = found;
  S.task = task;
  S.mission = mission;
  S.fx = choiceEffects(task, mission, S.studio);
  S.state = speakingState(S.studio, task.id);
  S.profile = buildProfile(entries, { band: ctx.band });
  const hasTake = S.state.takes.length > 0;
  S.stage = S.state.stage || chosen.get(task.id) || suggestStage(S.profile, task.keyUse).stage;
  S.takeIndex = Math.max(0, S.state.takes.length - 1);
  S.sourceText = task.stimulus?.turns ? task.stimulus.turns.map((t) => t.text) : [];
  const teacherMode = new URLSearchParams(location.search).get("tab") === "review";
  for (const t of S.state.takes)
    if (t.keptAudio && !kept.has(t.id)) {
      const u = await audioStore.urlFor(t.id);
      if (u) kept.set(t.id, u);
    }
  const take = S.state.takes.at(-1);
  const prev = S.state.takes.length > 1 ? S.state.takes.at(-2) : null;
  const sug = suggestStage(S.profile, task.keyUse);
  const board = mission ? missionState(S.studio, mission.id).board : [];
  return {
    title: task.title,
    html: html`${crumbsHTML([["Lab", `${BASE}/?grades=${ctx.band}`], mission ? [mission.title, missionHref(mission, ctx.band)] : ["Speaking Studio", backHref(ctx.band)], [task.title, null]])}
      <article class="activity speak-studio" style="--room:#8e4b10">
        <header class="act-head">
          <p class="eyebrow">
            <svg aria-hidden="true"><use href="${BASE}/pictures/lab-icons.svg#speaking"></use></svg> ${dirLabel[task.taskType]} · ${task.keyUse} · ${task.contentArea}
          </p>
          <h1 tabindex="-1">${task.title}</h1>
        ${purposeBadgeHTML(S.stage)}
          <div class="directions">
            <p><strong>Situation:</strong> ${task.scenario}</p>
            <p><strong>Your task:</strong> ${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}</p>
          </div>
        </header>
        ${
          teacherMode
            ? teacherHTML(task, S.state)
            : html` ${hasTake ? html`<p class="fine stage-locked">Your help setting for this attempt is <strong>${S.stage === "guided" ? "frames and words" : S.stage === "supported" ? "word bank" : "on my own"}</strong>. <button type="button" class="ghost small" data-new-attempt>Start a new attempt</button></p>` : stagePickerHTML(S.stage, sug)}
              ${stimulusHTML(task)}
              ${
                board.length
                  ? html`<section class="panel">
                      <h3>Your evidence board</h3>
                      <ul>
                        ${board.map((b) => html`<li><strong>${b.label}:</strong> ${b.text}</li>`)}
                      </ul>
                    </section>`
                  : ""
              }
              ${supportsHTML(task)}${plannerHTML(task, S.state)}${recorderBlock(task, S.state)}
              ${
                task.taskType === "discuss"
                  ? html`<section class="panel">
                      <h3>The conversation</h3>
                      <p class="fine">
                        Your partner speaks in turns. Answer each turn in your recording.
                      </p>
                      <ol>
                        ${task.turns.map((u, i) => html`<li><button type="button" class="ghost small" data-play-turn="${i}">🔊 Hear ${u.partner}</button></li>`)}
                      </ol>
                    </section>`
                  : ""
              }
              ${analysisHTML(task, S.state, take)}${resultsHTML(task, S.state, take, prev)}
              ${S.stage === "independent" ? "" : ""}`
        }
      </article>
      ${mission ? html`<p><a class="btn" href="${missionHref(mission, ctx.band)}">← Back to the mission</a></p>` : ""}
      <p class="save-explainer">
        Plans, transcripts and reviews save on this browser. Recordings do not unless you keep one.
        <a href="${BASE}/passport?grades=${ctx.band}">Saved work and teacher options</a>
      </p>`,
  };
}

function lockStage() {
  if (S.state.takes.length || S.state.stage) return;
  S.state.stage = S.stage;
  S.state.used = { frames: S.stage === "guided", bank: S.stage !== "independent" };
}

export async function onRecorded(key, ctx) {
  if (!S?.task || key !== S.task.id) return;
  const t = takesFor(key).at(-1);
  if (!t || S.state.takes.some((x) => x.id === t.id)) return;
  lockStage();
  const audio = t.env?.length ? summarizeEnvelope(t.env, t.fps) : null;
  addTake(S.state, { id: t.id, seconds: t.seconds, audio, extra: {} });
  S.state.rehearsed = S.state.rehearsed || false;
  save();
  announce("Recording saved on this device. Listen back, then type what you said.");
  void ctx;
}

export function onInput(e) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-plan]")) {
    S.state.plan[t.dataset.plan] = t.value;
    save();
  } else if (t.matches("[data-transcript]")) {
    const take = S.state.takes.at(-1);
    if (take) {
      take.transcript = t.value;
      save();
      const b = document.querySelector("[data-analyze]");
      if (b) b.disabled = wordCount(t.value) < 3;
    }
  } else if (t.matches("[data-rubric-note]")) {
    const take = S.state.takes.at(-1);
    if (new URLSearchParams(location.search).get("tab") === "review")
      (S.teacherDraft ||= emptyReview()).note = t.value;
    else if (take) {
      take.selfReview = { ...(take.selfReview || emptyReview()), note: t.value };
      save();
    }
  }
}

export function onChange(e, ctx) {
  if (!S?.task) return;
  const t = e.target;
  if (t.matches("[data-stage]")) {
    chosen.set(S.task.id, t.value);
    S.stage = t.value;
    ctx.rerender();
    return;
  }
  if (t.matches("[data-rehearsed]")) {
    S.state.rehearsed = t.checked;
    save();
    return;
  }
  if (t.matches("[data-rubric]")) {
    if (new URLSearchParams(location.search).get("tab") === "review")
      (S.teacherDraft ||= emptyReview())[t.dataset.rubric] = t.value;
    else {
      const take = S.state.takes.at(-1);
      if (take) {
        take.selfReview = { ...(take.selfReview || emptyReview()), [t.dataset.rubric]: t.value };
        save();
      }
    }
    ctx.rerender();
  }
}

function analyze(ctx) {
  const take = S.state.takes.at(-1);
  if (take.analyzedText === take.transcript && take.analyzedAt) {
    announce("Your transcript has not changed since the last check.");
    return;
  }
  lockStage();
  S.state.attemptId ||= `a${Date.now().toString(36)}`;
  const first = !S.ledger.entries.some(
    (x) => x.task === S.task.id && x.src === "speaking" && x.kind === "first" && x.attempt === S.state.attemptId,
  );
  const result = feedbackProvider.evaluateSpeaking(take.transcript, null, optsFor(S.task));
  const a = result.analysis;
  take.analyzedText = take.transcript;
  take.analyzedAt = new Date().toISOString(); // the analysis is recomputed from the transcript, never stored
  const supports = { ...stageSupports(), coach: !first, noRecording: Boolean(take.manual) };
  const m = {
    ...a.ledger,
    spk: take.audio?.ok
      ? {
          speech: take.audio.speechSeconds,
          run: take.audio.longestRun,
          pauses30: take.audio.pausesPer30,
        }
      : undefined,
  };
  const entry = appendEntry(S.ledger, {
    src: "speaking",
    task: S.task.id,
    band: S.band,
    domain: "Speaking",
    use: S.task.keyUse,
    stage: S.stage,
    kind: first ? "first" : "revision",
    attempt: S.state.attemptId,
    supports,
    m,
    feedbackSource: result.feedbackSource,
    modelVersion: LOCAL_FEEDBACK_MODEL_VERSION,
    promptVersion: LOCAL_FEEDBACK_PROMPT_VERSION,
    confidence: 0.6,
  });
  take.ledgerId = entry.id;
  if (S.mission) missionState(S.studio, S.mission.id).tasks[S.task.id] = { done: true, t: take.analyzedAt };
  saveLedger(S.ledger);
  save();
  announce("Language Coach finished. Read your next moves.");
  ctx.rerender();
}

export function onClick(e, ctx) {
  if (!S?.task) return false;
  const t = e.target;
  if (t.closest("[data-manual-take]")) {
    lockStage();
    addTake(S.state, { id: `m${Date.now().toString(36)}`, seconds: 0, audio: null, extra: { manual: true } });
    save();
    announce("Now type what you said.");
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-analyze]")) {
    analyze(ctx);
    return true;
  }
  if (t.closest("[data-play-stimulus]")) {
    const turns = S.task.stimulus.turns.map((u) => `${u.speaker}: ${u.text}`);
    canSpeak()
      ? speakDialogue(turns, { rate: ctx.prefs.rate })
      : announce("Read-aloud is not available. Ask your teacher to read it.");
    return true;
  }
  if (t.closest("[data-play-model]")) {
    S.state.used.model = true;
    save();
    speak(S.task.stages.guided.model, { rate: ctx.prefs.rate });
    return true;
  }
  const turn = t.closest("[data-play-turn]");
  if (turn) {
    speak(S.task.turns[Number(turn.dataset.playTurn)].say, { rate: ctx.prefs.rate });
    return true;
  }
  const keep = t.closest("[data-keep]");
  if (keep) {
    const take = takesFor(S.task.id).find((x) => x.id === keep.dataset.keep);
    audioStore.keep(take, S.task.id).then((ok) => {
      const meta = S.state.takes.find((x) => x.id === take.id);
      if (ok && meta) {
        meta.keptAudio = true;
        save();
        announce("Kept on this device for your teacher. You can delete it in Passport.");
      } else announce("This browser could not keep the recording. Use Download instead.");
      ctx.rerender();
    });
    return true;
  }
  if (t.closest("[data-finish]")) {
    const take = S.state.takes.at(-1);
    take.finished = true;
    save();
    announce("Review saved.");
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-again]")) {
    document.querySelector("[data-rec-start]")?.scrollIntoView({ block: "center" });
    document.querySelector("[data-rec-start]")?.focus();
    return true;
  }
  if (t.closest("[data-new-attempt]")) {
    S.state.stage = "";
    S.state.attemptId = "";
    S.state.takes = [];
    S.state.plan = {};
    S.state.used = {};
    S.state.rehearsed = false;
    save();
    ctx.rerender();
    return true;
  }
  if (t.closest("[data-teacher-save]")) {
    const take = S.state.takes.at(-1);
    (take.teacherReview ||= []).push({ t: new Date().toISOString(), ...S.teacherDraft });
    S.teacherDraft = null;
    save();
    announce("Teacher review saved.");
    ctx.rerender();
    return true;
  }
  return false;
}

export function mount(root) {
  for (const d of root.querySelectorAll("details[data-model]"))
    d.addEventListener("toggle", () => {
      if (d.open && S?.state) {
        S.state.used.model = true;
        save();
      }
    });
}
export function unmount() {
  stopSpeech();
}
