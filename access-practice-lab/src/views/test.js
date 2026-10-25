// Practice test runner: intro → questions (navigator, flags) → review →
// results with a full answer review. Untimed by default; a student can opt into
// a practice timer that NEVER auto-submits (the previous runner submitted the
// test at 0:00 with whatever was answered).
import { listenPlayerHTML, recorderHTML, transcriptHTML } from "../components.js";
import { loadTest } from "../content.js";
import { correctAnswerText, isAnswered, isAuto, isCorrect } from "../grade.js";
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer } from "../items.js";
import {
  BAND_POINTS,
  LIMITS,
  METHOD,
  MIN_ITEMS,
  WEIGHTS,
  practiceComposite,
} from "../lang/composite.js";
import { CRITERIA, PRACTICE_BANDS } from "../lang/rubrics.js";
import { visualsHTML } from "../media.js";
import { clear as clearTake, isRecording, stop as stopRecording, takesFor } from "../recorder.js";
import { stop as stopSpeech } from "../speech.js";
import { clearTestRecord, getStudentName, loadTestRecord, saveTestRecord } from "../store.js";
import { BASE, announce, asList, bandLabel, html, raw } from "../util.js";

const IGN = raw("data-nsr-ignore");
let T = null; // { test, flat, rec }
let timerId = 0;
let renderGeneration = 0;

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
    const correct = auto.filter((it) =>
      isCorrect(it, T.rec.answers[it.id] ?? seedAnswer(it)),
    ).length;
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

/** Plays allowed per recording under test conditions: once, or twice with the replay accommodation. */
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
  const inProgress = Boolean(T.rec.startedAt || Object.keys(T.rec.answers || {}).length);
  return html`<section class="panel test-intro">
    <p class="eyebrow">Classroom practice · ${bandLabel(test.band)}</p>
    <h1 tabindex="-1">${test.title}</h1>
    ${test.overview ? html`<p class="lead">${test.overview}</p>` : ""}
    <ol class="section-list">
      ${(test.sections || []).map((s) => html`<li><strong>${s.title || s.domain}</strong><span>${s.items.length} question${s.items.length === 1 ? "" : "s"} · about ${s.estMinutes || 8} min</span></li>`)}
    </ol>
    <ul class="rules">
      <li>Take your time. There is no clock unless you turn one on.</li>
      <li>
        Use <strong>Next</strong> and <strong>Back</strong>. Flag a question to come back to it.
      </li>
      ${
        T.rec.conditions
          ? html`<li>Listening: press <strong>▶ Play</strong>. Each recording plays ${maxPlays() === 1 ? "one time" : "up to two times"} and cannot be paused or stopped.</li>`
          : html`<li>Listening: press <strong>▶ Listen</strong>. You may listen more than once.</li>`
      }
      <li>
        Speaking: record your answer or say it to a teacher or partner. Writing: type your answer.
        For Grade 3 ACCESS preparation, also practice handwriting on paper with your teacher.
      </li>
    </ul>
    <fieldset class="test-mode">
      <legend>How do you want to practice?</legend>
      <label class="rate-opt"
        ><input type="radio" name="test-mode" value="learning" data-conditions ${T.rec.conditions ? "" : raw("checked")} ${IGN} />
        <span><strong>Learning mode</strong> — listen as often as you like.</span></label
      >
      <label class="rate-opt"
        ><input type="radio" name="test-mode" value="test" data-conditions ${T.rec.conditions ? raw("checked") : ""} ${IGN} />
        <span><strong>Test conditions</strong> — each recording plays once and cannot be paused, like a real testing session.</span></label
      >
      ${
        T.rec.conditions
          ? html`<label class="timer-opt"
              ><input type="checkbox" data-replay ${T.rec.replay ? raw("checked") : ""} ${IGN} /> My plan allows one replay
              of each recording. <span class="fine">On the real test, replay is an accommodation that your school sets up in advance. Check the current WIDA accommodations manual or ask your teacher.</span></label
            >`
          : ""
      }
    </fieldset>
    <label class="timer-opt"
      ><input type="checkbox" data-timer ${T.rec.timer ? raw("checked") : ""} ${IGN} /> Practice
      with a timer (about ${T.minutes} minutes). It will never end your test.</label
    >
    <div class="row-actions">
      <button type="button" class="btn btn-primary btn-big" data-start>
        ${inProgress ? "Resume test" : "Start test"}
      </button>
      ${inProgress ? html`<button type="button" class="ghost" data-restart>Start over</button>` : ""}
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
        item.wordBank?.length
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

function runnerHTML(ctx) {
  const f = T.flat[T.rec.index] || T.flat[0];
  const flagged = (T.rec.flags || []).includes(f.item.id);
  const last = T.rec.index >= T.flat.length - 1;
  const listening = f.section.domain === "Listening";
  const hasPassage = !listening && asList(f.item.passage).length > 0;
  return html`<div class="test-bar">
      <span class="test-chip">${f.section.title || f.section.domain}</span>
      <span>Section ${f.si + 1} of ${T.test.sections.length}</span>
      ${T.rec.timer ? html`<span class="test-clock" id="testClock" role="timer">${T.rec.remaining ? clock(T.rec.remaining) : "Time is up — keep going or submit"}</span>` : ""}
      <button type="button" class="ghost small" data-exit>Save &amp; exit</button>
    </div>
    <div class="test-progress" aria-hidden="true">
      <span style="width:${Math.round(((T.rec.index + 1) / T.flat.length) * 100)}%"></span>
    </div>
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
                  ${inputFor(f)}
                </div>
              </div>`
            : html`
                ${stimulus(f, ctx)}
                <p class="prompt-text">${f.item.prompt || ""}</p>
                ${inputFor(f)}
              `
        }
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
  return html`<section class="panel">
    <h1 tabindex="-1">Review your answers</h1>
    <p>
      ${n} answered · ${T.flat.length - n} not answered · ${(T.rec.flags || []).length} flagged. Tap
      a question to go back.
    </p>
    <ol class="review-list">
      ${T.flat.map((f, i) => {
        const completed = done(f);
        return html`<li>
          <button
            type="button"
            class="review-row ${completed ? "is-done" : "is-blank"}"
            data-jump="${i}"
          >
            <span
              >${i + 1}. ${f.section.domain} — ${f.item.title || f.item.skill || "Question"}</span
            ><span
              >${completed ? "Answered" : "Not answered"}${(T.rec.flags || []).includes(f.item.id) ? " · ★" : ""}</span
            >
          </button>
        </li>`;
      })}
    </ol>
    <div class="row-actions">
      <button type="button" class="btn" data-jump="${T.rec.index}">Keep working</button
      ><button type="button" class="btn btn-primary btn-big" data-submit>Submit test</button>
    </div>
  </section>`;
}

const ratingId = (domain, crit, band) => `rate-${domain}-${crit}-${band}`;

/** Speaking and Writing cannot be machine-scored, so the composite waits for a practice-rubric rating. */
function ratingHTML(r) {
  const rated = r.sections.filter(
    (s) => (s.domain === "Speaking" || s.domain === "Writing") && s.openDone > 0,
  );
  if (!rated.length) return "";
  return html`<section class="rate-panel" aria-labelledby="rateTitle">
    <h2 id="rateTitle">Rate your speaking and writing</h2>
    <p class="fine">
      Use the practice rubric to rate each response. A teacher rating is a different kind of
      evidence than a self-rating, so say who rated. Ratings are saved on this device.
    </p>
    ${rated.map((s) => {
      const cur = T.rec.ratings?.[s.domain] || {};
      return html`<fieldset class="rate-domain">
        <legend>${s.domain}</legend>
        ${CRITERIA.map(
          (c) =>
            html`<fieldset class="rate-crit">
              <legend>${c.name} <span class="fine">· ${c.dimension}</span></legend>
              ${PRACTICE_BANDS.map(
                (b) =>
                  html`<label class="rate-opt">
                    <input
                      type="radio"
                      id="${ratingId(s.domain, c.id, b.id)}"
                      name="rate-${s.domain}-${c.id}"
                      value="${b.id}"
                      data-rating="${s.domain}"
                      data-rating-crit="${c.id}"
                      ${cur[c.id] === b.id ? raw("checked") : ""}
                      ${IGN}
                    />
                    <span><strong>${b.label}</strong> — ${c.student[b.id]}</span>
                  </label>`,
              )}
            </fieldset>`,
        )}
        <fieldset class="rate-crit">
          <legend>Who rated this?</legend>
          ${["me", "teacher"].map(
            (who) =>
              html`<label class="rate-opt">
                <input
                  type="radio"
                  id="rate-${s.domain}-by-${who}"
                  name="rate-${s.domain}-by"
                  value="${who}"
                  data-rating-by="${s.domain}"
                  ${(cur.by || "me") === who ? raw("checked") : ""}
                  ${IGN}
                />
                <span>${who === "me" ? "I rated my own work" : "My teacher rated it"}</span>
              </label>`,
          )}
        </fieldset>
      </fieldset>`;
    })}
  </section>`;
}

/** The Practice Composite: weighted, never filled in, never a WIDA score or level. See lang/composite.js. */
function compositeHTML(r) {
  const c = practiceComposite(r.sections, T.rec.ratings);
  const points = (m) => (m.status === "ok" ? `${Math.round(m.value)}` : "—");
  const card = (label, sub, v) =>
    html`<article class="comp-card">
      <h3>${label} <span class="fine">${sub}</span></h3>
      ${
        v
          ? html`<p class="comp-num">
                <strong>${v.value}</strong> <span>/ 100 practice points</span>
              </p>
              ${v.small ? html`<p class="fine">Small sample: fewer than 12 questions in a skill. Treat this as a rough picture.</p>` : ""}`
          : html`<p class="fine">Not shown yet.</p>`
      }
    </article>`;
  return html`<section class="composite" aria-labelledby="compTitle">
    <h2 id="compTitle">Practice composite</h2>
    <div class="comp-grid">
      ${card("Practice comprehension", "Listening + Reading", c.comprehension)}
      ${card("Practice overall", "all four skills", c.overall)}
    </div>
    ${c.withheld ? html`<p class="fine">${c.withheld}</p>` : ""}
    ${c.overall ? html`<p class="fine">Speaking and Writing ${c.overall.raters.length > 1 ? "were rated by both you and your teacher" : c.overall.raters[0] === "teacher" ? "were rated by your teacher" : "are your own ratings"}.</p>` : ""}
    <table class="comp-table">
      <caption>
        How each skill counts
      </caption>
      <thead>
        <tr>
          <th scope="col">Skill</th>
          <th scope="col">Weight</th>
          <th scope="col">Practice points</th>
          <th scope="col">Based on</th>
        </tr>
      </thead>
      <tbody>
        ${c.measures.map(
          (m) =>
            html`<tr>
              <th scope="row">${m.domain}</th>
              <td>${Math.round(WEIGHTS[m.domain] * 100)}%</td>
              <td>${points(m)}</td>
              <td>${m.why}</td>
            </tr>`,
        )}
      </tbody>
    </table>
    <details class="comp-method">
      <summary>How this is calculated, and what it is not</summary>
      <p>${METHOD}</p>
      <p>${LIMITS}</p>
      <p class="fine">
        A skill needs at least ${MIN_ITEMS} answered questions to count. Rubric points: early
        ${BAND_POINTS.early}, building ${BAND_POINTS.building}, strong ${BAND_POINTS.strong}.
      </p>
    </details>
  </section>`;
}

function resultsHTML() {
  const r = T.rec.results;
  return html`<section class="panel results">
      <p class="eyebrow">Practice report${r.studentName ? ` · ${r.studentName}` : ""}</p>
      <h1 tabindex="-1">${T.test.title}</h1>
      ${T.rec.conditions ? html`<p class="fine">Taken under test conditions: each recording played ${maxPlays() === 1 ? "once" : "up to twice"} and could not be paused.</p>` : ""}
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
      ${ratingHTML(r)} ${compositeHTML(r)}
      <p class="disclaimer">
        This is practice feedback, not a WIDA ACCESS score or level. Speaking and writing are best
        judged by your teacher.
      </p>
      <div class="row-actions">
        <button type="button" class="btn" data-print>🖨️ Print report</button
        ><button type="button" class="ghost" data-restart>Take it again</button
        ><a class="ghost" href="${BASE}/tests">All tests</a>
      </div>
    </section>
    <section class="panel">
      <h2>Answer review</h2>
      <ol class="answer-review">
        ${T.flat.map((f) => {
          const a = T.rec.answers[f.item.id] ?? seedAnswer(f.item);
          const auto = isAuto(f.item);
          const ok = auto && isCorrect(f.item, a);
          return html`<li class="${auto ? (ok ? "is-right" : "is-wrong") : "is-open"}">
            <p class="ar-q"><strong>${f.section.domain}:</strong> ${f.item.prompt}</p>
            ${auto ? html`<p>${ok ? "✓ Correct" : html`✗ Correct answer: <strong>${correctAnswerText(f.item)}</strong>`}</p>` : html`<p>Your teacher will review this answer.</p>`}
            ${!ok && f.item.hint ? html`<p class="fine">${f.item.hint}</p>` : ""}
            ${f.section.domain === "Listening" && f.item.script ? transcriptHTML(f.item.id, f.item.script) : ""}
          </li>`;
        })}
      </ol>
    </section>`;
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
  const body =
    T.rec.phase === "running"
      ? runnerHTML(ctx)
      : T.rec.phase === "review"
        ? reviewHTML()
        : T.rec.phase === "results"
          ? resultsHTML()
          : introHTML();
  return { title: T.test.title, html: html`<div class="test-view">${body}</div>` };
}
export function mount() {
  if (T?.rec.phase === "running" && T.rec.timer) startTimer();
  else clearInterval(timerId);
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
  if (t.closest("[data-restart]")) {
    const current = T;
    stopRecording().then(() => {
      if (T !== current) return;
      for (const f of T.flat) clearTake(`${T.test.id}:${f.item.id}`);
      clearTestRecord(T.test.id);
      T.rec = { phase: "intro", index: 0, answers: {}, flags: [] };
      go(ctx, {});
    });
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
      go(ctx, { phase: "results", results: grade() });
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
    persist();
    const id = t.id;
    return ctx.rerender().then(() => document.getElementById(id)?.focus({ preventScroll: true }));
  }
  if (T.rec.phase === "intro" && (t.matches("[data-conditions]") || t.matches("[data-replay]"))) {
    if (t.matches("[data-conditions]")) T.rec.conditions = t.value === "test";
    else T.rec.replay = t.checked;
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
  if (!T || !e.target.matches("[data-test-note]")) return;
  const f = T.flat[T.rec.index];
  T.rec.answers[f.item.id] = e.target.value;
  persist();
}
