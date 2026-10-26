// Speaking Studio: authentic spoken production — plan, rehearse, record, listen back, review, re-record.
// Speaking ability is shown by speaking: every task here ends in a recording, never a multiple-choice
// answer. The lab cannot hear words, so the learner types what they said; the Language Coach works from
// that transcript, and from the loudness envelope for time speaking and pauses (all on this device).
import { crumbsHTML } from "../components.js";
import { loadMission, loadSpeakingTasks, loadStudioIndex } from "../content.js";
import { recommendTasks } from "../lang/adapt.js";
import { analyzeResponse, compareDrafts } from "../lang/analyze.js";
import {
  LocalFeedbackProvider,
  LOCAL_FEEDBACK_MODEL_VERSION,
  LOCAL_FEEDBACK_PROMPT_VERSION,
} from "../lang/providers.js";
import { describeSpeech, summarizeEnvelope } from "../lang/audio.js";
import { appendEntry, buildProfile, loadLedger, saveLedger, suggestStage } from "../lang/ledger.js";
import { emptyReview, reviewComplete } from "../lang/rubrics.js";
import {
  addTake,
  choiceEffects,
  loadStudio,
  missionState,
  saveStudio,
  speakingState,
} from "../lang/studio.js";
import * as audioStore from "../audio-store.js";
import { canRecord, isRecording, takesFor } from "../recorder.js";
import { canSpeak, speak, speakDialogue, stop as stopSpeech } from "../speech.js";
import { waveformSVG } from "../waveform.js";
import {
  chartHTML,
  chooserHeroHTML,
  disclosure,
  feedbackHTML,
  jumpNavHTML,
  purposeBadgeHTML,
  rubricHTML,
  stageLockedHTML,
  stagePickerHTML,
  stepperHTML,
  supportsPanelHTML,
  tableHTML,
  taskCardHTML,
  trackDisclosures,
} from "../studio-ui.js";
import { ART, BASE, announce, html, icon, raw, wordCount } from "../util.js";

const IGN = raw("data-nsr-ignore");
let S = null;
const chosen = new Map(); // task id → stage picked before the first attempt
let kept = new Map(); // take id → object URL for recordings kept on this device
let timing = { prep: 0, max: 0 }; // optional preparation countdown and response limit (this tab only)
let stopScope = null;
const feedbackProvider = new LocalFeedbackProvider();

const save = () => saveStudio(S.studio);
const TYPES = {
  retell: ["Retell", "replay", "Tell what happened, in order."],
  describe: ["Describe", "search", "Say what you see in data, pictures or places."],
  compare: ["Compare", "grid", "Say how two things are alike and different."],
  explain: ["Explain", "bulb", "Say why or how something happens."],
  argue: ["Argue", "flag", "Take a position and back it up with evidence."],
  discuss: ["Discuss", "conversation", "Answer a partner in a short conversation."],
};
const dirLabel = Object.fromEntries(Object.entries(TYPES).map(([k, v]) => [k, v[0]]));

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

async function chooserHTML(ctx, index, entries) {
  const band = ctx.band;
  const tasks = index.speaking.filter((t) => t.band === band || !t.band);
  const full = new Map((await loadSpeakingTasks()).tasks.map((t) => [t.id, t]));
  const recs = recommendTasks(tasks, entries, { band, n: 3 });
  const groups = Object.keys(TYPES)
    .map((k) => [k, tasks.filter((t) => t.taskType === k)])
    .filter(([, l]) => l.length);
  const card = (t, why) =>
    taskCardHTML({
      href: `${BASE}/speak/${t.id}?grades=${band}`,
      title: t.title,
      ico: TYPES[t.taskType]?.[1] || "speaking",
      kind: dirLabel[t.taskType],
      time: t.time,
      desc: full.get(t.id)?.scenario,
      meta: [t.keyUse, t.contentArea],
      why,
    });
  const next = recs[0];
  return html`${crumbsHTML([
      ["Lab", `${BASE}/?grades=${band}`],
      ["Speaking Studio", null],
    ])}
    <div class="d-speaking">
    ${chooserHeroHTML({
      domain: "d-speaking",
      eyebrow: `Grades ${band.replace("-", "–")} · ${tasks.length} speaking tasks`,
      title: "Speaking Studio",
      lead: "Plan what you will say, say it out loud, listen back, and say it better. You show your speaking by speaking.",
      art: `${ART}/domain-speaking.svg`,
      loop: ["Plan", "Say it", "Listen back", "Check", "Review"],
      cta: next
        ? html`<a
            class="btn btn-primary btn-big btn-next"
            href="${BASE}/speak/${next.task.id}?grades=${band}"
            ><span class="btn-kicker">Try next</span
            ><span class="next-title">${next.task.title}</span>${icon("arrow-right")}</a
          >`
        : "",
    })}
    ${
      tasks.length
        ? html`${jumpNavHTML(
            groups.map(([k]) => [`spk-${k}`, dirLabel[k]]),
            "Jump to a kind of speaking task",
          )}
          ${
            recs.length
              ? html`<section class="task-group is-next" aria-labelledby="spk-next-h">
                  <header>
                    <h2 id="spk-next-h">${icon("sparkle")} Try next</h2>
                    <p class="fine">Picked from the evidence you have saved on this device.</p>
                  </header>
                  <div class="task-grid">${recs.map((r) => card(r.task, r.why))}</div>
                </section>`
              : ""
          }
          ${groups.map(
            ([k, list]) =>
              html`<section class="task-group" id="spk-${k}" aria-labelledby="spk-${k}-h">
                <header>
                  <h2 id="spk-${k}-h">${icon(TYPES[k][1])} ${dirLabel[k]}</h2>
                  <p class="fine">${TYPES[k][2]}</p>
                </header>
                <div class="task-grid">${list.map((t) => card(t))}</div>
              </section>`,
          )}`
        : html`<section class="panel empty-state">
            <img src="${ART}/empty.svg" alt="" width="480" height="300" />
            <h2>No speaking tasks for this grade band yet</h2>
            <p>Switch grade band from the menu, or open the quick Speaking practice room.</p>
            <a class="btn" href="${BASE}/Speaking/A?grades=${band}">Speaking practice room</a>
          </section>`
    }
    <p class="no-print">
      <a class="btn" href="${BASE}/printables/studio-speaking" target="_blank" rel="noopener"
        >${icon("print")} Print speaking task cards</a
      >
    </p>
    <p class="disclaimer">
      Classroom speaking practice. The Language Coach reads the transcript you type and measures
      time and pauses on this device. It does not judge pronunciation, and it is not a WIDA score.
    </p>`;
}

function stimulusHTML(task) {
  const st = task.stimulus;
  if (!st || st.kind === "none") return "";
  if (st.kind === "audio")
    return html`<section class="source listen-card">
      <h3 class="source-title">${icon("listening")} Listen first</h3>
      <div class="listen-player">
        <button type="button" class="listen-btn" data-play-stimulus>
          <span class="listen-icon" aria-hidden="true">${icon("play")}</span
          ><span class="listen-label">Listen</span>
        </button>
        <button type="button" class="ghost" data-stop-audio>${icon("stop")} Stop</button>
        <p class="listen-meta fine">
          Listen as many times as you need. The words are not shown until after you speak.
        </p>
      </div>
    </section>`;
  if (st.kind === "chart") return html`<section class="source">${chartHTML(st.chart)}</section>`;
  if (st.kind === "table") return html`<section class="source">${tableHTML(st.table)}</section>`;
  if (st.kind === "text")
    return html`<section class="source">
      <div class="source-text">${(st.text || []).map((p) => html`<p>${p}</p>`)}</div>
    </section>`;
  return "";
}

function plannerHTML(task, state) {
  return html`<section class="panel planner" id="spk-plan">
    <h3><span class="step-badge">1</span> Plan what you will say</h3>
    <div class="slot-grid">
      ${task.planner.map(
        (slot, i) =>
          html`<label class="field slot"
            ><span><b class="slot-n">${i + 1}</b>${slot.label}</span
            ><textarea
              rows="2"
              data-plan="${slot.id}"
              ${S.stage === "independent" ? "" : html`placeholder="${S.fx.hints[slot.id] || slot.hint}"`}
              ${IGN}
            >
${state.plan[slot.id] || ""}</textarea>
          </label>`,
      )}
    </div>
    <label class="practiced"
      ><input type="checkbox" data-rehearsed ${state.rehearsed ? raw("checked") : ""} ${IGN} /> I
      said my plan quietly out loud once.</label
    >
  </section>`;
}

function supportsHTML(task) {
  if (S.stage === "independent")
    return html`<p class="own-note">
      ${icon("user")}<span
        >You chose to work on your own: no frames, words or model. Your plan and your voice are
        enough.</span
      >
    </p>`;
  return supportsPanelHTML(task, S.stage, {
    modelBody: {
      summary: "Hear a model answer",
      body: html`<button type="button" class="btn" data-play-model>
        ${icon("volume")} Hear the model
      </button>`,
    },
  });
}

function timingHTML(task) {
  const [, hi] = task.targetSeconds;
  const opt = (v, label, cur) =>
    html`<option value="${v}" ${cur === v ? raw("selected") : ""}>${label}</option>`;
  return disclosure(
    "spk-timing",
    html`${icon("clock")} Optional timing`,
    html`<p class="fine">
        Off by default. Use these to practice speaking on a clock; nothing changes in your results.
      </p>
      <div class="timing-grid">
        <label class="field"
          ><span>Get ready first</span
          ><select data-timing="prep" ${IGN}>
            ${opt(0, "No countdown", timing.prep)}${opt(5, "5 seconds", timing.prep)}${opt(10, "10 seconds", timing.prep)}${opt(30, "30 seconds", timing.prep)}
          </select></label
        >
        <label class="field"
          ><span>Stop automatically</span
          ><select data-timing="max" ${IGN}>
            ${opt(0, "No limit", timing.max)}${opt(hi, `After ${hi} seconds`, timing.max)}
          </select></label
        >
      </div>`,
  );
}

function takeRowHTML(t, i, task, state) {
  const isKept = state.takes.find((x) => x.id === t.id)?.keptAudio;
  return html`<li>
    <div class="take-head">
      <strong>Try ${i + 1}</strong><span class="fine">${t.seconds}s</span>
    </div>
    ${raw(waveformSVG(t.env))}
    <audio controls preload="none" aria-label="Play recording ${i + 1}" src="${t.url}"></audio>
    <div class="take-actions">
      ${audioStore.available() ? html`<button type="button" class="ghost small" data-keep="${t.id}">${isKept ? html`${icon("check")} Kept for my teacher` : "Keep for my teacher"}</button>` : ""}<a
        class="ghost small"
        href="${t.url}"
        download="speaking-${task.id}-${i + 1}.${t.extension}"
        >${icon("download")} Download</a
      >
    </div>
  </li>`;
}

function compareHTML(takes) {
  const cell = (label, t, n) =>
    html`<figure class="compare-cell">
      <figcaption>${label} · ${t.seconds}s</figcaption>
      ${raw(waveformSVG(t.env))}<audio
        controls
        preload="none"
        aria-label="Play ${label.toLowerCase()}"
        src="${t.url}"
      ></audio
      ><span class="fine">Try ${n}</span>
    </figure>`;
  return html`<section class="compare" aria-label="Compare your tries">
    <h4>Compare your tries</h4>
    <p class="fine">
      Listen to both. Notice what changed, such as a reason added or a clearer ending. Length alone
      does not make an answer better.
    </p>
    <div class="compare-grid">
      ${cell("Oldest saved try", takes[0], 1)}${cell("Latest try", takes.at(-1), takes.length)}
    </div>
  </section>`;
}

function recorderBlock(task, state) {
  const key = task.id;
  const rec = isRecording(key);
  const takes = takesFor(key);
  const manual = state.takes.some((t) => t.manual);
  const [lo, hi] = task.targetSeconds;
  if (!canRecord())
    return html`<section class="panel recorder is-unavailable" id="spk-say">
      <h3><span class="step-badge">2</span> Say it</h3>
      <p class="rec-state is-off">
        ${icon("alert")}<span
          ><strong>This browser cannot record.</strong> Say your answer to a partner or your teacher
          out loud. Then press the button and type what you said.</span
        >
      </p>
      <div class="rec-main">
        ${manual ? "" : html`<button type="button" class="btn btn-primary" data-manual-take>${icon("check")} I said it out loud</button>`}
        <button type="button" class="ghost" data-say="${task.prompt}">
          ${icon("volume")} Hear the task
        </button>
      </div>
    </section>`;
  return html`<section
    class="panel recorder studio-rec ${rec ? "is-recording" : ""}"
    id="spk-say"
    aria-label="Record your answer"
  >
    <h3><span class="step-badge">2</span> Say it</h3>
    <p class="fine">
      Aim for ${lo}–${hi} seconds. Speak in a quiet place. Recordings stay on this device unless you
      keep one for your teacher.
    </p>
    <p class="rec-state ${rec ? "is-live" : ""}" role="status">
      ${rec ? html`<span class="rec-pulse" aria-hidden="true"></span><span><strong>Recording.</strong> The microphone is on. Press Stop when you are done.</span>` : html`${icon("record")}<span>${takes.length ? `${takes.length} ${takes.length === 1 ? "try" : "tries"} saved on this device. The microphone is off.` : "Ready. The microphone is off until you press Record."}</span>`}
    </p>
    <div class="rec-main">
      ${
        rec
          ? html`<button type="button" class="rec-btn is-stop" data-rec-stop="${key}">
                <span class="rec-dot" aria-hidden="true"></span>Stop
              </button>
              <div class="rec-live" aria-live="off">
                <span class="rec-meter" style="--lvl:0.00"></span>
                <span class="rec-time">0s</span>
                <canvas class="rec-scope" width="360" height="56" aria-hidden="true"></canvas>
              </div>`
          : html`<button
              type="button"
              class="rec-btn"
              data-rec-start="${key}"
              data-rec-prep="${timing.prep}"
              data-rec-max="${timing.max}"
            >
              <span class="rec-dot" aria-hidden="true"></span
              >${takes.length ? "Record again" : "Record my answer"}
            </button>`
      }
      <button type="button" class="ghost" data-say="${task.prompt}">
        ${icon("volume")} Hear the task
      </button>
    </div>
    <p class="rec-quiet" role="status" hidden></p>
    <p class="rec-countdown" data-rec-countdown="${key}" role="status"></p>
    <p class="rec-error" data-rec-error="${key}" role="status"></p>
    ${rec ? "" : timingHTML(task)}
    ${manual || rec ? "" : html`<p class="fine rec-fallback">No microphone, or it is not working? <button type="button" class="ghost small" data-manual-take>I said it out loud (no recording)</button></p>`}
    ${
      takes.length
        ? html`<ol class="takes">
            ${takes.map((t, i) => takeRowHTML(t, i, task, state))}
          </ol>`
        : ""
    }
    ${takes.length > 1 ? compareHTML(takes) : ""}
  </section>`;
}

/** A typed transcript that is much longer or shorter than the speaking measured is probably not a match. */
function transcriptCheck(take) {
  const words = wordCount(take.transcript);
  const seconds = take.audio?.ok ? take.audio.speechSeconds : 0;
  if (!words || !seconds) return "";
  const rate = words / seconds;
  if (rate > 4.5)
    return html`<p class="note-todo">
      ${icon("alert")}<span
        >You typed ${words} words for ${seconds} seconds of speaking. That is more than most people
        say that fast — check that you typed only what you said.</span
      >
    </p>`;
  if (rate < 0.7 && seconds >= 8)
    return html`<p class="note-todo">
      ${icon("alert")}<span
        >You typed ${words} words for ${seconds} seconds of speaking. Did you leave parts out?</span
      >
    </p>`;
  return "";
}

function analysisHTML(task, state, take) {
  if (!take) return "";
  const sum = take.audio;
  return html`<section class="panel transcript-panel" id="spk-type">
    <h3><span class="step-badge">3</span> Listen back, then type what you said</h3>
    <p class="fine">
      ${take.manual ? "Type what you said." : "Listen to your take. Then type what you said."} Type
      it exactly as you said it, including mistakes — the Language Coach can only look at the words
      you type, so a "cleaned-up" version would hide what to work on. It cannot hear your voice.
    </p>
    ${
      sum
        ? html`<ul class="speech-stats">
            ${describeSpeech(sum, task.targetSeconds).map((l) => html`<li class="${l.ok ? "ok" : "todo"}">${icon(l.ok ? "check" : "info")}<span>${l.text}</span></li>`)}
          </ul>`
        : ""
    }
    ${transcriptCheck(take)}
    <label class="field paper"
      ><span class="paper-head"
        >What I said (exactly)
        <span class="fine" data-tcount>${wordCount(take.transcript)} words</span></span
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
        ${icon("sparkle")} Check my language
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
  return html`<section class="panel" id="spk-coach">
      <h3><span class="step-badge">4</span> What your speaking shows</h3>
      ${feedbackHTML(a, take.transcript, { patternHref: (id) => `${BASE}/detective/${id}?grades=${S.band}` })}
      ${
        delta
          ? html`<div class="revision-coach-card card">
              <h4>${icon("growth")} Compared with your last try</h4>
              <ul>
                ${delta.changes.map((c) => html`<li>${c.label}: ${c.from} → ${c.to} ${c.better ? icon("star") : ""}</li>`)}${delta.gainedMoves.map((m) => html`<li>New: ${m.toLowerCase()} ${icon("star")}</li>`)}${prev.audio && take.audio ? html`<li>Speaking time: ${prev.audio.speechSeconds}s → ${take.audio.speechSeconds}s</li>` : ""}
              </ul>
            </div>`
          : ""
      }
    </section>
    <section class="panel" id="spk-review">
      <h3><span class="step-badge">5</span> Review your speaking</h3>
      ${rubricHTML(take.selfReview || emptyReview(), { modality: "speaking", prefix: `self-${take.id}` })}
      <div class="row-actions">
        <button
          type="button"
          class="btn btn-primary"
          data-finish
          ${reviewComplete(take.selfReview) ? "" : raw("disabled")}
        >
          Save my review
        </button>
        <button type="button" class="btn" data-again>
          ${icon("retry")} Record again to improve
        </button>
      </div>
      ${take.finished ? html`<p class="saved-note">${icon("check")} Saved. This is practice evidence, not a score.</p>` : ""}
    </section>`;
}

function teacherHTML(task, state) {
  const take = state.takes.at(-1);
  if (!take)
    return html`<section class="panel">
      <p>No recording has been made on this device yet.</p>
    </section>`;
  const reviews = take.teacherReview || [];
  return html`<section class="panel teacher-review">
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

function stepsFor(state) {
  const take = state.takes.at(-1);
  return [
    { label: "Plan", done: Boolean(state.rehearsed || Object.values(state.plan).some(Boolean)) },
    { label: "Say it", done: state.takes.length > 0 },
    { label: "Type it", done: wordCount(take?.transcript) >= 3 },
    { label: "Coach", done: Boolean(take?.analyzedAt) },
    { label: "Review", done: Boolean(take?.finished) },
  ];
}

export async function render(ctx) {
  const index = await loadStudioIndex();
  S = { ...(S || {}), band: ctx.band, studio: loadStudio(), ledger: loadLedger() };
  const entries = S.ledger.entries;
  const id = ctx.route.id;
  if (!id) return { title: "Speaking Studio", html: await chooserHTML(ctx, index, entries) };
  const found = await findTask(id, new URLSearchParams(location.search).get("from"));
  if (!found)
    return {
      title: "Not found",
      html: html`<section class="panel empty-state">
        <img src="${ART}/empty.svg" alt="" width="480" height="300" />
        <h1 tabindex="-1">We could not find that task.</h1>
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
      <article class="activity studio-view speak-studio d-speaking">
        <header class="act-head">
          <div class="act-bar">
            <p class="act-context">
              ${icon("speaking")} Speaking Studio · ${dirLabel[task.taskType]} · ${task.keyUse}
            </p>
            <p class="act-step">${icon("clock")} ${task.time} · ${task.contentArea}</p>
          </div>
          <h1 tabindex="-1">${task.title}</h1>
          ${purposeBadgeHTML(S.stage)}
          <div class="task-brief">
            <div>
              <span class="brief-label">${icon("info")} Situation</span>
              <p>${task.scenario}</p>
            </div>
            <div class="brief-task">
              <span class="brief-label">${icon("flag")} Your task</span>
              <p>
                ${task.prompt}${S.fx.promptAdd.map((x) => html` <span class="path-add">${x}</span>`)}
              </p>
              <button type="button" class="ghost small" data-say="${task.prompt}">
                ${icon("volume")} Hear the task
              </button>
            </div>
          </div>
        </header>
        ${
          teacherMode
            ? teacherHTML(task, S.state)
            : html`${stepperHTML(stepsFor(S.state), { label: "Speaking steps" })}
                ${hasTake ? stageLockedHTML(S.stage) : stagePickerHTML(S.stage, sug)}
                <div class="studio-cols">
                  <div class="studio-col">
                    ${stimulusHTML(task)}
                    ${
                      board.length
                        ? html`<section class="panel board">
                            <h3>${icon("pin")} Your evidence board</h3>
                            <ul class="board-list">
                              ${board.map((b) => html`<li><strong>${b.label}:</strong> ${b.text}</li>`)}
                            </ul>
                          </section>`
                        : ""
                    }
                    ${plannerHTML(task, S.state)}
                  </div>
                  <div class="studio-col">
                    ${recorderBlock(task, S.state)} ${supportsHTML(task)}
                    ${
                      task.taskType === "discuss"
                        ? html`<section class="panel conversation">
                            <h3>${icon("conversation")} The conversation</h3>
                            <p class="fine">
                              Your partner speaks in turns. Answer each turn in your recording.
                            </p>
                            <ol class="turns">
                              ${task.turns.map((u, i) => html`<li><button type="button" class="ghost small" data-play-turn="${i}">${icon("volume")} Hear ${u.partner}</button></li>`)}
                            </ol>
                          </section>`
                        : ""
                    }
                  </div>
                </div>
                ${analysisHTML(task, S.state, take)}${resultsHTML(task, S.state, take, prev)}`
        }
      </article>
      ${mission ? html`<p><a class="btn" href="${missionHref(mission, ctx.band)}">${icon("arrow-left")} Back to the mission</a></p>` : ""}
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
      const c = document.querySelector("[data-tcount]");
      if (c) c.textContent = `${wordCount(t.value)} words`;
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
  if (t.matches("[data-timing]")) {
    timing = { ...timing, [t.dataset.timing]: Number(t.value) || 0 };
    const b = document.querySelector("[data-rec-start]");
    if (b) {
      b.dataset.recPrep = String(timing.prep);
      b.dataset.recMax = String(timing.max);
    }
    return;
  }
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
    (x) =>
      x.task === S.task.id &&
      x.src === "speaking" &&
      x.kind === "first" &&
      x.attempt === S.state.attemptId,
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
  if (S.mission)
    missionState(S.studio, S.mission.id).tasks[S.task.id] = { done: true, t: take.analyzedAt };
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
    addTake(S.state, {
      id: `m${Date.now().toString(36)}`,
      seconds: 0,
      audio: null,
      extra: { manual: true },
    });
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

/**
 * Draws the real microphone level as a rolling bar history while a take is recording. The recorder reports
 * the level into the meter's --lvl custom property; this only plots those readings, it never invents any.
 * If nothing louder than room noise arrives for three seconds it says so, in words.
 */
function wireScope(root) {
  const meter = root.querySelector(".rec-meter");
  const canvas = root.querySelector(".rec-scope");
  const quiet = root.querySelector(".rec-quiet");
  if (!meter || !canvas) return null;
  const g = canvas.getContext("2d");
  const color = getComputedStyle(canvas).color;
  const bars = Math.floor(canvas.width / 6);
  const hist = [];
  const start = performance.now();
  let last = 0;
  let peak = 0;
  const draw = () => {
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = color;
    const mid = canvas.height / 2;
    hist.forEach((v, i) => {
      const h = Math.max(2, v * canvas.height);
      g.fillRect((bars - hist.length + i) * 6, mid - h / 2, 4, h);
    });
  };
  const obs = new MutationObserver(() => {
    const now = performance.now();
    const lvl = Number.parseFloat(meter.style.getPropertyValue("--lvl")) || 0;
    peak = Math.max(peak, lvl);
    if (now - last >= 50) {
      last = now;
      hist.push(lvl);
      if (hist.length > bars) hist.shift();
      draw();
    }
    if (quiet && now - start > 3000) {
      const silent = peak < 0.05;
      quiet.hidden = !silent;
      if (silent)
        quiet.textContent =
          "We cannot hear you yet. Check that your microphone is on, and speak closer to it.";
    }
  });
  obs.observe(meter, { attributes: true, attributeFilter: ["style"] });
  draw();
  return () => obs.disconnect();
}

export function mount(root) {
  trackDisclosures(root);
  for (const d of root.querySelectorAll("details[data-model]"))
    d.addEventListener("toggle", () => {
      if (d.open && S?.state) {
        S.state.used.model = true;
        save();
      }
    });
  stopScope?.();
  stopScope = wireScope(root);
}
export function unmount() {
  stopScope?.();
  stopScope = null;
  stopSpeech();
}
