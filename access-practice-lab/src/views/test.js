// Practice test runner: intro → questions (navigator, flags) → section review →
// results with a full answer review. Two modes, chosen before the test starts:
//  - Guided Practice: untimed; hints, transcripts (after answering), immediate rationales and retries.
//    Its results are "Supported Practice" and count each question's FIRST checked answer.
//  - Independent Rehearsal: test-day flow; each recording plays once (an optional replay is an
//    EduWonderLab rehearsal setting), no frames or word banks, flags, section review, and a
//    practice timer that NEVER auto-submits.
// Switching mode restarts the test. Each mode keeps its own formative breakdown; they are never merged.
import { listenPlayerHTML, recorderHTML, transcriptHTML } from "../components.js";
import { loadTest } from "../content.js";
import { correctAnswerText, isAnswered, isAuto, isCorrect } from "../grade.js";
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer } from "../items.js";
import {
  BAND_POINTS,
  FORMATIVE_SMALL,
  formativeBreakdown,
  keyLanguageUse,
  LIMITS,
  languageDimension,
  METHOD,
  MIN_ITEMS,
  practiceComposite,
  SMALL_SAMPLE,
  WEIGHTS,
} from "../lang/composite.js";
import { visualsHTML } from "../media.js";
import { clear as clearTake, isRecording, stop as stopRecording, takesFor } from "../recorder.js";
import { stop as stopSpeech } from "../speech.js";
import { clearTestRecord, getStudentName, loadTestRecord, saveTestRecord } from "../store.js";
import { BASE, announce, asList, bandLabel, html, raw } from "../util.js";
import {
  applyRehearsal,
  onRehearsalClick,
  rehearsalClasses,
  rehearsalPrefs,
  rehearsalToolbarHTML,
  releaseRehearsal,
} from "./tools.js";
import { answerReviewHTML, compositeHTML, formativeHTML, ratingHTML } from "./test-report.js";
import { MODES, modeBannerHTML, modeChoiceHTML, modeOf, otherMode } from "./test-modes.js";

export { MODES, modeOf };

const IGN = raw("data-nsr-ignore");
let T = null; // { test, flat, rec }
let timerId = 0;
let renderGeneration = 0;

const rules = () => MODES[modeOf(T.rec)];
const inProgress = () => Boolean(T.rec.startedAt || Object.keys(T.rec.answers || {}).length);
function setMode(mode) {
  T.rec.conditions = mode === "independent";
  if (mode === "guided") {
    T.rec.timer = false;
    T.rec.replay = false;
  }
}
/** `/test/<id>?rehearsal=guided|independent` (from the test list) preselects a mode. */
function requestedMode() {
  const v = new URLSearchParams(globalThis.location?.search || "").get("rehearsal");
  return MODES[v] ? v : null;
}

/** Score of one machine-checked item. Guided runs count the first checked answer, never a retry. */
export function rightFor(item, rec) {
  const first = rec?.guided?.[item.id]?.first;
  if (modeOf(rec) === "guided" && typeof first === "boolean") return first;
  return isCorrect(item, rec?.answers?.[item.id] ?? seedAnswer(item));
}

/** One run's per-question outcomes, tagged for the formative breakdown. */
export function runOutcomes(flat, rec, hasTake = () => false) {
  return flat.map(({ item, section }) => {
    const scored = isAuto(item);
    return {
      domain: section.domain,
      keyUse: keyLanguageUse(item),
      dimension: scored ? languageDimension(item) : null,
      scored,
      right: scored ? rightFor(item, rec) : false,
      done: scored
        ? isAnswered(item, rec?.answers?.[item.id])
        : responseDone(item, section.domain, rec?.answers?.[item.id], rec?.oralPractice?.[item.id], hasTake(item)),
    };
  });
}

function flatten(test) {
  const flat = [];
  (test.sections || []).forEach((section, si) =>
    (section.items || []).forEach((item, ii) =>
      flat.push({ item, section, si, n: ii + 1, of: section.items.length }),
    ),
  );
  return flat;
}
const persist = () => {
  saveTestRecord(T.test.id, T.rec);
  T.savedSnapshot = JSON.stringify(loadTestRecord(T.test.id));
};

// Planning notes are preparation, not evidence of a spoken response.
export function responseDone(item, domain, answer, oralPractice = false, hasTake = false) {
  return item.type === "constructed" && domain === "Speaking"
    ? Boolean(oralPractice || hasTake)
    : isAnswered(item, answer);
}
const done = (f) =>
  responseDone(
    f.item,
    f.section.domain,
    T.rec.answers[f.item.id],
    T.rec.oralPractice?.[f.item.id],
    takesFor(`${T.test.id}:${f.item.id}`).length > 0,
  );

/** Pause on any route departure, including browser Back and same-view test changes. */
export function unmount() {
  renderGeneration++;
  clearInterval(timerId);
  releaseRehearsal();
  if (T) T.paramApplied = false;
  if (T) T.pendingMode = null;
  if (T?.rec.phase === "running") {
    T.rec.phase = "intro";
    persist();
  }
}

/** Discard cached state after importing or clearing device progress. */
export function invalidate() {
  renderGeneration++;
  clearInterval(timerId);
  T = null;
}
const answered = () => T.flat.filter(done).length;

function grade() {
  const sections = (T.test.sections || []).map((s, si) => {
    const items = T.flat.filter((f) => f.si === si).map((f) => f.item);
    const auto = items.filter(isAuto);
    const correct = auto.filter((it) => rightFor(it, T.rec)).length;
    const open = items.filter((it) => !isAuto(it));
    const openDone = open.filter((it) =>
      responseDone(
        it,
        s.domain,
        T.rec.answers[it.id],
        T.rec.oralPractice?.[it.id],
        takesFor(`${T.test.id}:${it.id}`).length > 0,
      ),
    ).length;
    return {
      domain: s.domain,
      title: s.title || s.domain,
      correct,
      total: auto.length,
      attempted: auto.filter((it) => isAnswered(it, T.rec.answers[it.id])).length,
      open: open.length,
      openDone,
    };
  });
  const c = sections.reduce((n, s) => n + s.correct, 0);
  const t = sections.reduce((n, s) => n + s.total, 0);
  return {
    sections,
    meaningful: sections.some((s) => s.attempted > 0 || s.openDone > 0),
    correct: c,
    total: t,
    date: new Date().toISOString(),
    studentName: getStudentName(),
  };
}

function clock(sec) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function startTimer() {
  clearInterval(timerId);
  if (!T.rec.timer) return;
  timerId = setInterval(() => {
    if (!T || T.rec.phase !== "running") return clearInterval(timerId);
    T.rec.remaining = Math.max(0, (T.rec.remaining ?? T.minutes * 60) - 1);
    const el = document.getElementById("testClock");
    if (el)
      el.textContent = T.rec.remaining
        ? clock(T.rec.remaining)
        : "Time is up — keep going or submit";
    if (T.rec.remaining % 10 === 0) persist();
  }, 1000);
}

/** Plays allowed by this optional Lab practice setting. It does not configure an official accommodation. */
const maxPlays = () => (T?.rec.replay ? 2 : 1);

/** Hooks the app calls around the Listen button (main.js). Under test conditions the count lives in the saved test, so a reload cannot reset it. */
export function canListen(key) {
  return !T?.rec.conditions || (T.rec.plays?.[key] || 0) < maxPlays();
}
export function onListen(key) {
  if (!T?.rec.conditions) return;
  T.rec.plays ||= {};
  T.rec.plays[key] = (T.rec.plays[key] || 0) + 1;
  persist();
}

function introHTML() {
  const test = T.test;
  const mode = modeOf(T.rec);
  return html`<section class="panel test-intro">
    ${modeBannerHTML(T.pendingMode, T.rec)}
    <p class="eyebrow">Classroom practice · ${bandLabel(test.band)} · ${MODES[mode].label}</p>
    <h1 tabindex="-1">${test.title}</h1>
    ${test.overview ? html`<p class="lead">${test.overview}</p>` : ""}
    <ol class="section-list">
      ${(test.sections || []).map((s) => html`<li><strong>${s.title || s.domain}</strong><span>${s.items.length} question${s.items.length === 1 ? "" : "s"} · about ${s.estMinutes || 8} min</span></li>`)}
    </ol>
    <ul class="rules">
      <li>${mode === "guided" ? "Take your time. Guided Practice has no clock." : "There is no clock unless you turn on the practice timer."}</li>
      <li>
        Use <strong>Next</strong> and <strong>Back</strong>. Flag a question to come back to it. You
        review each section before you submit.
      </li>
      ${
        T.rec.conditions
          ? html`<li>Listening: press <strong>▶ Play</strong>. Each recording plays ${maxPlays() === 1 ? "one time" : "up to two times"} and cannot be paused or stopped.</li>`
          : html`<li>Listening: press <strong>▶ Listen</strong>. You may listen more than once. After you check an answer you can read what you heard.</li>`
      }
      <li>
        Speaking: record your answer or say it to a teacher or partner. Writing: type your answer.
        For Grade 3 ACCESS preparation, also practice handwriting on paper with your teacher.
      </li>
    </ul>
    ${modeChoiceHTML(T.rec, { started: inProgress(), minutes: T.minutes })}
    ${rehearsalToolbarHTML()}
    <div class="row-actions">
      <button type="button" class="btn btn-primary btn-big" data-start>
        ${inProgress() ? "Resume test" : "Start test"}
      </button>
      ${inProgress() ? html`<button type="button" class="ghost" data-restart>Start over</button>` : ""}
      <a class="ghost" href="${BASE}/tests">All tests</a>
    </div>
    <p class="disclaimer">
      Original classroom practice, not an official WIDA test or score. Actual ACCESS Online adapts
      Listening and Reading and uses those results for Speaking and Writing tier placement. This
      fixed practice set does not reproduce its difficulty, scoring, timing, or routing. Use the
      <a href="https://wbte.drcedirect.com/WIDA" target="_blank" rel="noopener"
        >official WIDA demo</a
      >
      to learn the actual testing interface.
    </p>
  </section>`;
}

function stimulus(f, ctx) {
  const { item, section } = f;
  const key = `${T.test.id}:${item.id}`;
  const listening = section.domain === "Listening";
  const script = listening
    ? [...asList(item.script), ...(item.questionAudio ? [item.questionAudio] : [])]
    : null;
  return html`${listening && script.length ? listenPlayerHTML(key, script, T.rec.conditions ? { rate: ctx.prefs.rate, test: true, maxPlays: maxPlays(), played: T.rec.plays?.[key] || 0 } : { rate: ctx.prefs.rate, test: true }) : ""}
  ${visualsHTML(item)}
  ${
    !listening && asList(item.passage).length
      ? html`<article class="passage">
          ${item.passageTitle ? html`<h3>${item.passageTitle}</h3>` : ""}${asList(item.passage).map((p) => html`<p>${p}</p>`)}
        </article>`
      : ""
  }`;
}

function inputFor(f) {
  const { item, section } = f;
  const a = T.rec.answers[item.id];
  const key = `${T.test.id}:${item.id}`;
  if (item.type === "constructed") {
    if (section.domain === "Speaking")
      return html`${recorderHTML(key, { prompt: item.prompt, recording: isRecording(key) })}<label
          class="field"
          ><span>Planning notes (optional)</span
          ><textarea rows="3" data-test-note ${IGN}>${a || ""}</textarea></label
        ><label class="timer-opt"
          ><input
            type="checkbox"
            data-test-oral
            ${T.rec.oralPractice?.[item.id] ? raw("checked") : ""}
            ${IGN}
          />
          I said my answer aloud to a teacher or partner.</label
        >
        <p class="fine">
          Planning notes do not count as a spoken answer. Recordings stay in this tab; ask your
          teacher to listen before closing or reloading it.
        </p>`;
    return html`${
        rules().wordBank && item.wordBank?.length
          ? html`<ul class="wordbank">
              ${item.wordBank.map((w) => html`<li>${w}</li>`)}
            </ul>`
          : ""
      }<label class="field"
        ><span>${item.responseLabel || "Your answer"}</span
        ><textarea rows="8" data-test-note spellcheck="false" ${IGN}>${a || ""}</textarea>
      </label>`;
  }
  return inputHTML(item, a);
}

const answerKey = (item) => JSON.stringify(T.rec.answers[item.id] ?? null);

/** Guided only: hints and look-back supports. Never rendered in Independent Rehearsal. */
function lookbackHTML(f) {
  if (!rules().lookback) return "";
  const { item, section } = f;
  const lookFor = asList(item.listenFor || item.readFor || item.sayFor || item.writeFor);
  const frames = rules().frames ? asList(item.frames) : [];
  const g = T.rec.guided?.[item.id];
  const transcript =
    section.domain === "Listening" && g?.tries > 0 ? transcriptHTML(item.id, item.script) : "";
  if (!item.support && !lookFor.length && !frames.length && !transcript) return "";
  return html`<details class="lookback">
      <summary>Look back: hints and supports (Guided Practice)</summary>
      ${item.support ? html`<p>${item.support}</p>` : ""}
      ${lookFor.length ? html`<p><strong>${section.domain === "Listening" ? "Listen for" : section.domain === "Reading" ? "Read for" : "Include"}:</strong></p><ul>${lookFor.map((x) => html`<li>${x}</li>`)}</ul>` : ""}
      ${frames.length ? html`<p><strong>Sentence frames:</strong></p><ul class="frames">${frames.map((x) => html`<li>${x}</li>`)}</ul>` : ""}
    </details>
    ${transcript}`;
}

/** Guided only: check an answer for an immediate rationale, then retry. */
function guidedCheckHTML(f) {
  const { item } = f;
  if (!rules().rationales || !isAuto(item)) return "";
  const g = T.rec.guided?.[item.id];
  const current = g && g.last === answerKey(item);
  const why = String(item.correct || "").replace(/^correct[.!]?\s*/i, "");
  let body = "";
  if (g && !current)
    body = html`<div class="feedback is-shown" role="status"><p>You changed your answer. Check it again.</p></div>`;
  else if (g?.ok)
    body = html`<div class="feedback is-right" role="status"><p class="fb-title">✓ Correct</p>${why ? html`<p>${why}</p>` : ""}</div>`;
  else if (g && g.tries < 2)
    body = html`<div class="feedback is-hint" role="status"><p class="fb-title">Not yet</p><p>${item.hint || "Look back at the question and try again."}</p><p>Change your answer and check again.</p></div>`;
  else if (g)
    body = html`<div class="feedback is-shown" role="status"><p class="fb-title">The answer is: ${correctAnswerText(item)}</p>${why ? html`<p>${why}</p>` : ""}</div>`;
  return html`<div class="row-actions">
      <button type="button" class="btn" data-guided-check>${g ? "Check again" : "Check my answer"}</button>
    </div>
    ${body}
    ${g ? html`<p class="fine">Supported Practice counts your first check: ${g.first ? "right" : "not yet"}.</p>` : ""}`;
}

function scratchHTML() {
  if (!rehearsalPrefs().scratch) return "";
  return html`<label class="field rh-scratch"
    ><span>Scratchpad — EduWonderLab rehearsal setting. Never scored; stays on this device.</span
    ><textarea rows="4" data-scratch ${IGN}>${T.rec.scratch || ""}</textarea></label
  >`;
}

function runnerHTML(ctx) {
  const f = T.flat[T.rec.index] || T.flat[0];
  const flagged = (T.rec.flags || []).includes(f.item.id);
  const last = T.rec.index >= T.flat.length - 1;
  const listening = f.section.domain === "Listening";
  const hasPassage = !listening && asList(f.item.passage).length > 0;
  return html`<div class="test-bar">
      <span class="test-chip mode-chip">${MODES[modeOf(T.rec)].label}</span>
      <span class="test-chip">${f.section.title || f.section.domain}</span>
      <span>Section ${f.si + 1} of ${T.test.sections.length}</span>
      ${T.rec.timer ? html`<span class="test-clock" id="testClock" role="timer">${T.rec.remaining ? clock(T.rec.remaining) : "Time is up — keep going or submit"}</span>` : ""}
      <button type="button" class="ghost small" data-exit>Save &amp; exit</button>
    </div>
    <div class="test-progress" aria-hidden="true">
      <span style="width:${Math.round(((T.rec.index + 1) / T.flat.length) * 100)}%"></span>
    </div>
    ${rehearsalToolbarHTML({ compact: true })}
    <div class="test-stage">
      <section class="test-q ${hasPassage ? "has-passage" : ""}" aria-labelledby="qTitle">
        <div class="q-head">
          <h1 id="qTitle" tabindex="-1">
            Question ${T.rec.index + 1} <span>of ${T.flat.length}</span>
          </h1>
          <button
            type="button"
            class="flag ${flagged ? "is-on" : ""}"
            data-flag
            aria-pressed="${flagged}"
          >
            ${flagged ? "★ Flagged" : "☆ Flag"}
          </button>
        </div>
        ${f.n === 1 && f.section.directions ? html`<p class="section-directions">${f.section.directions}</p>` : ""}
        ${
          hasPassage
            ? html`<div class="test-workspace has-passage">
                <div class="test-passage-col">
                  ${stimulus(f, ctx)}
                </div>
                <div class="test-response-col">
                  <p class="prompt-text">${f.item.prompt || ""}</p>
                  ${inputFor(f)} ${guidedCheckHTML(f)} ${lookbackHTML(f)}
                </div>
              </div>`
            : html`
                ${stimulus(f, ctx)}
                <p class="prompt-text">${f.item.prompt || ""}</p>
                ${inputFor(f)} ${guidedCheckHTML(f)} ${lookbackHTML(f)}
              `
        }
        ${scratchHTML()}
      </section>
      <aside class="palette" aria-label="Question navigator">
        <h2>Questions</h2>
        <div class="dots">
          ${T.flat.map((g, i) => {
            const completed = done(g);
            const fl = (T.rec.flags || []).includes(g.item.id);
            return html`<button
              type="button"
              class="dot ${i === T.rec.index ? "is-current" : ""} ${completed ? "is-done" : ""} ${fl ? "is-flag" : ""}"
              data-jump="${i}"
              aria-label="Question ${i + 1}${completed ? ", answered" : ""}${fl ? ", flagged" : ""}"
            >
              ${i + 1}
            </button>`;
          })}
        </div>
      </aside>
    </div>
    <nav class="act-nav">
      <button type="button" class="btn" data-prev ${T.rec.index === 0 ? raw("disabled") : ""}>
        ← Back
      </button>
      <span class="act-count">${answered()}/${T.flat.length} answered</span>
      ${last ? html`<button type="button" class="btn btn-primary" data-review>Review answers</button>` : html`<button type="button" class="btn btn-primary" data-next>Next →</button>`}
    </nav>`;
}

function reviewHTML() {
  const n = answered();
  const flags = T.rec.flags || [];
  const row = (f, i) => {
    const completed = done(f);
    return html`<li>
      <button type="button" class="review-row ${completed ? "is-done" : "is-blank"}" data-jump="${i}">
        <span>${i + 1}. ${f.item.title || f.item.skill || "Question"}</span
        ><span>${completed ? "Answered" : "Not answered"}${flags.includes(f.item.id) ? " · ★ Flagged" : ""}</span>
      </button>
    </li>`;
  };
  return html`<section class="panel">
    <p class="eyebrow">${MODES[modeOf(T.rec)].label}</p>
    <h1 tabindex="-1">Review each section before you submit</h1>
    <p>
      ${n} answered · ${T.flat.length - n} not answered · ${flags.length} flagged. Tap a question to
      go back.
    </p>
    ${(T.test.sections || []).map((s, si) => {
      const rows = T.flat.map((f, i) => [f, i]).filter(([f]) => f.si === si);
      const sDone = rows.filter(([f]) => done(f)).length;
      const sFlags = rows.filter(([f]) => flags.includes(f.item.id)).length;
      return html`<section class="review-section" aria-labelledby="rev-${si}">
        <h2 id="rev-${si}">${s.title || s.domain}</h2>
        <p class="fine">${sDone} of ${rows.length} answered · ${sFlags} flagged</p>
        <ol class="review-list">
          ${rows.map(([f, i]) => row(f, i))}
        </ol>
      </section>`;
    })}
    <div class="row-actions">
      <button type="button" class="btn" data-jump="${T.rec.index}">Keep working</button
      ><button type="button" class="btn btn-primary btn-big" data-submit>Submit test</button>
    </div>
  </section>`;
}

function resultsHTML() {
  const r = T.rec.results;
  return html`<section class="panel results">
      <p class="eyebrow">Practice report${r.studentName ? ` · ${r.studentName}` : ""}</p>
      <h1 tabindex="-1">${T.test.title}</h1>
      ${modeBannerHTML(T.pendingMode, T.rec)}
      <p class="fine"><strong>${MODES[modeOf(T.rec)].label}.</strong> ${T.rec.conditions ? `Each recording played ${maxPlays() === 1 ? "once" : "up to twice"} and could not be paused.` : "Hints and retries were available, so each checked question counts your first try."}</p>
      ${r.total ? html`<p class="big-score"><strong>${r.correct}/${r.total}</strong> scored questions right</p>` : ""}
      <div class="result-grid">
        ${r.sections.map(
          (s) =>
            html`<article class="result-card">
              <h2>${s.title}</h2>
              ${
                s.total
                  ? html`<div class="bar">
                        <span style="width:${Math.round((s.correct / s.total) * 100)}%"></span>
                      </div>
                      <p>${s.correct} of ${s.total} right</p>`
                  : ""
              }
              ${s.open ? html`<p>${s.openDone} of ${s.open} ${s.domain === "Speaking" ? "spoken" : "written"} answer${s.open === 1 ? "" : "s"} done — ask your teacher to listen or read.</p>` : ""}
            </article>`,
        )}
      </div>
      ${ratingHTML(r, T.rec.ratings)}
      ${compositeHTML(practiceComposite(r.sections, T.rec.ratings), { WEIGHTS, METHOD, LIMITS, MIN_ITEMS, BAND_POINTS })}
      ${formativeHTML(T.rec.formative, formativeBreakdown, { SMALL_SAMPLE, FORMATIVE_SMALL })}
      <p class="disclaimer">
        This is practice feedback, not a WIDA ACCESS score or level. Speaking and writing are best
        judged by your teacher.
      </p>
      <div class="row-actions">
        <button type="button" class="btn" data-print>🖨️ Print report</button
        ><button type="button" class="ghost" data-restart>Take it again</button
        ><button type="button" class="ghost" data-switch-mode="${otherMode(modeOf(T.rec))}">Try ${MODES[otherMode(modeOf(T.rec))].label}</button
        ><a class="ghost" href="${BASE}/tests">All tests</a>
      </div>
    </section>
    ${answerReviewHTML(T.flat, T.rec.answers)}`;
}

export async function render(ctx) {
  const generation = ++renderGeneration;
  const id = ctx.route.testId;
  const saved = loadTestRecord(id);
  if (!T || T.test.id !== id || T.savedSnapshot !== JSON.stringify(saved)) {
    clearInterval(timerId);
    const test = await loadTest(id).catch(() => null);
    // The app discards stale HTML; do not let it replace this module's state either.
    if (generation !== renderGeneration) return { title: "", html: html`` };
    if (!test)
      return {
        title: "Test not found",
        html: html`<section class="panel">
          <h1 tabindex="-1">We could not find that test.</h1>
          <a class="btn" href="${BASE}/tests">All practice tests</a>
        </section>`,
      };
    const rec = saved;
    T = {
      test,
      savedSnapshot: JSON.stringify(saved),
      flat: flatten(test),
      minutes: (test.sections || []).reduce((n, s) => n + (Number(s.estMinutes) || 8), 0),
      rec: { phase: "intro", index: 0, answers: {}, flags: [], conditions: Boolean(test.conditionsDefault), ...rec },
    };
    if (T.rec.results) T.rec.phase = "results";
    if (T.rec.phase === "running") T.rec.phase = "intro"; // resume from the intro screen
  }
  const want = requestedMode();
  if (want && !T.paramApplied) {
    T.paramApplied = true;
    if (want !== modeOf(T.rec)) {
      if (T.rec.phase === "intro" && !inProgress()) {
        setMode(want);
        persist();
      } else T.pendingMode = want;
    }
  }
  const body =
    T.rec.phase === "running"
      ? runnerHTML(ctx)
      : T.rec.phase === "review"
        ? reviewHTML()
        : T.rec.phase === "results"
          ? resultsHTML()
          : introHTML();
  return {
    title: T.test.title,
    html: html`<div class="test-view ${rehearsalClasses()}">${body}</div>`,
  };
}
export function mount(_root, ctx) {
  applyRehearsal(ctx);
  if (T?.rec.phase === "running" && T.rec.timer) startTimer();
  else clearInterval(timerId);
}

/** Start over, keeping each mode's last formative result. `mode` switches mode (a switch always restarts). */
function restart(ctx, mode = modeOf(T.rec)) {
  const current = T;
  stopRecording().then(() => {
    if (T !== current) return;
    for (const f of T.flat) clearTake(`${T.test.id}:${f.item.id}`);
    clearTestRecord(T.test.id);
    const { formative, conditions, replay } = T.rec;
    T.rec = { phase: "intro", index: 0, answers: {}, flags: [], conditions, replay };
    if (formative) T.rec.formative = formative;
    setMode(mode);
    T.pendingMode = null;
    announce(`${MODES[mode].label}. The test starts over.`);
    go(ctx, {});
  });
  return true;
}

function guidedCheck(ctx, f) {
  const { item } = f;
  if (!rules().rationales || !isAuto(item)) return;
  if (!isAnswered(item, T.rec.answers[item.id])) return announce("Choose an answer first.");
  const ok = isCorrect(item, T.rec.answers[item.id] ?? seedAnswer(item));
  T.rec.guided ||= {};
  const g = (T.rec.guided[item.id] ||= { tries: 0 });
  g.tries++;
  if (typeof g.first !== "boolean") g.first = ok;
  g.ok = ok;
  g.last = answerKey(item);
  persist();
  announce(ok ? "Correct." : g.tries < 2 ? "Not yet. Try again." : "Here is the answer.");
  ctx.rerender();
}

async function go(ctx, patch) {
  stopSpeech();
  const current = T;
  await stopRecording();
  if (T !== current) return;
  Object.assign(T.rec, patch);
  persist();
  ctx.rerender();
  window.scrollTo({ top: 0 });
  setTimeout(() => document.getElementById("qTitle")?.focus({ preventScroll: true }), 0);
}

export function onClick(e, ctx) {
  if (!T) return;
  const t = e.target;
  const f = T.flat[T.rec.index];
  if (onRehearsalClick(e, ctx)) return true;
  const choice = T.rec.phase === "running" && f && choiceTarget(e);
  if (choice) {
    T.rec.answers[f.item.id] = reduceAnswer(f.item, T.rec.answers[f.item.id], choice);
    persist();
    ctx.rerender();
    return true;
  }
  if (T.rec.phase === "running" && f && ["sort", "order", "hotText"].includes(f.item.type)) {
    const next = reduceAnswer(f.item, T.rec.answers[f.item.id], t);
    if (next !== undefined && !t.matches("[data-ans-choice]")) {
      T.rec.answers[f.item.id] = next;
      persist();
      return ctx.rerender();
    }
  }
  if (t.closest("[data-start]")) {
    if (T.rec.timer && T.rec.remaining == null) T.rec.remaining = T.minutes * 60;
    return go(ctx, { phase: "running", startedAt: T.rec.startedAt || new Date().toISOString() });
  }
  if (t.closest("[data-restart]")) return restart(ctx);
  const switchTo = t.closest("[data-switch-mode]")?.dataset.switchMode;
  if (MODES[switchTo]) return restart(ctx, switchTo);
  if (t.closest("[data-guided-check]") && T.rec.phase === "running" && f) {
    guidedCheck(ctx, f);
    return true;
  }
  if (t.closest("[data-prev]")) return go(ctx, { index: Math.max(0, T.rec.index - 1) });
  if (t.closest("[data-next]"))
    return go(ctx, { index: Math.min(T.flat.length - 1, T.rec.index + 1) });
  const jump = t.closest("[data-jump]");
  if (jump) return go(ctx, { phase: "running", index: Number(jump.dataset.jump) || 0 });
  if (t.closest("[data-review]")) return go(ctx, { phase: "review" });
  if (t.closest("[data-flag]")) {
    const set = new Set(T.rec.flags || []);
    set.has(f.item.id) ? set.delete(f.item.id) : set.add(f.item.id);
    T.rec.flags = [...set];
    persist();
    return ctx.rerender();
  }
  if (t.closest("[data-submit]")) {
    clearInterval(timerId);
    const current = T;
    stopRecording().then(() => {
      if (T !== current) return;
      announce("Test submitted.");
      const mode = modeOf(T.rec);
      const outcomes = runOutcomes(T.flat, T.rec, (item) => takesFor(`${T.test.id}:${item.id}`).length > 0);
      // Each mode's breakdown lives in its own slot: guided work can never land in the independent one.
      const formative = { ...(T.rec.formative || {}), [mode]: { mode, date: new Date().toISOString(), outcomes, ratings: T.rec.ratings || {} } };
      go(ctx, { phase: "results", results: grade(), formative });
    });
    return true;
  }
  if (t.closest("[data-exit]")) {
    unmount();
    return ctx.navigate(`${BASE}/tests`);
  }
}

export function onChange(e, ctx) {
  if (!T) return;
  const t = e.target;
  if (t.matches("[data-timer]")) {
    T.rec.timer = t.checked;
    if (t.checked && T.rec.remaining == null) T.rec.remaining = T.minutes * 60;
    persist();
    return;
  }
  if (T.rec.phase === "results" && (t.matches("[data-rating]") || t.matches("[data-rating-by]"))) {
    const domain = t.dataset.rating || t.dataset.ratingBy;
    T.rec.ratings ||= {};
    const cur = (T.rec.ratings[domain] ||= {});
    if (t.dataset.rating) cur[t.dataset.ratingCrit] = t.value;
    else cur.by = t.value;
    const snap = T.rec.formative?.[modeOf(T.rec)];
    if (snap) snap.ratings = T.rec.ratings;
    persist();
    const id = t.id;
    return ctx.rerender().then(() => document.getElementById(id)?.focus({ preventScroll: true }));
  }
  if (T.rec.phase === "intro" && (t.matches("[data-conditions]") || t.matches("[data-replay]"))) {
    if (t.matches("[data-conditions]")) {
      if (inProgress()) return; // a mode change mid-test goes through restart()
      setMode(t.value === "test" ? "independent" : "guided");
    } else T.rec.replay = t.checked;
    persist();
    return ctx.rerender().then(() => document.querySelector(`[data-conditions][value="${T.rec.conditions ? "test" : "learning"}"], [data-replay]`)?.focus({ preventScroll: true }));
  }
  const f = T.flat[T.rec.index];
  if (T.rec.phase !== "running" || !f) return;
  if (t.matches("[data-test-oral]")) {
    T.rec.oralPractice ||= {};
    T.rec.oralPractice[f.item.id] = t.checked;
    persist();
    ctx.rerender();
    return;
  }
  const next = reduceAnswer(f.item, T.rec.answers[f.item.id], t);
  if (next !== undefined) {
    T.rec.answers[f.item.id] = next;
    persist();
    ctx.rerender();
  }
}

export function onInput(e) {
  if (T && e.target.matches("[data-scratch]")) {
    T.rec.scratch = e.target.value.slice(0, 5000);
    return persist();
  }
  if (!T || !e.target.matches("[data-test-note]")) return;
  const f = T.flat[T.rec.index];
  T.rec.answers[f.item.id] = e.target.value;
  persist();
}
