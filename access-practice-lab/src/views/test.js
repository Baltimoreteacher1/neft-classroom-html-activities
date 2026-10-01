// Practice test runner: intro → questions (navigator, flags) → review →
// results with a full answer review. Untimed by default; a student can opt into
// a practice timer that NEVER auto-submits (the previous runner submitted the
// test at 0:00 with whatever was answered).
import { listenPlayerHTML, recorderHTML, transcriptHTML } from "../components.js";
import { loadTest } from "../content.js";
import { band as bandOf, correctAnswerText, isAnswered, isAuto, isCorrect } from "../grade.js";
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer } from "../items.js";
import { visualsHTML } from "../media.js";
import { isRecording, takesFor } from "../recorder.js";
import { clearTestRecord, getStudentName, loadTestRecord, saveTestRecord } from "../store.js";
import { BASE, announce, asList, bandLabel, html, raw } from "../util.js";

const IGN = raw("data-nsr-ignore");
let T = null; // { test, flat, rec }
let timerId = 0;

function flatten(test) {
  const flat = [];
  (test.sections || []).forEach((section, si) =>
    (section.items || []).forEach((item, ii) =>
      flat.push({ item, section, si, n: ii + 1, of: section.items.length }),
    ),
  );
  return flat;
}
const persist = () => saveTestRecord(T.test.id, T.rec);
const answered = () =>
  T.flat.filter(
    (f) =>
      isAnswered(f.item, T.rec.answers[f.item.id]) ||
      (f.item.type === "constructed" && takesFor(`${T.test.id}:${f.item.id}`).length),
  ).length;

function grade() {
  const sections = (T.test.sections || []).map((s, si) => {
    const items = T.flat.filter((f) => f.si === si).map((f) => f.item);
    const auto = items.filter(isAuto);
    const correct = auto.filter((it) =>
      isCorrect(it, T.rec.answers[it.id] ?? seedAnswer(it)),
    ).length;
    const open = items.filter((it) => !isAuto(it));
    const openDone = open.filter(
      (it) => isAnswered(it, T.rec.answers[it.id]) || takesFor(`${T.test.id}:${it.id}`).length,
    ).length;
    return {
      domain: s.domain,
      title: s.title || s.domain,
      correct,
      total: auto.length,
      open: open.length,
      openDone,
    };
  });
  const c = sections.reduce((n, s) => n + s.correct, 0);
  const t = sections.reduce((n, s) => n + s.total, 0);
  return {
    sections,
    correct: c,
    total: t,
    pct: t ? Math.round((c / t) * 100) : null,
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

function introHTML() {
  const test = T.test;
  const inProgress = Object.keys(T.rec.answers || {}).length > 0;
  return html`<section class="panel test-intro">
    <p class="eyebrow">
      Practice test · ${bandLabel(test.band)}${test.tier ? ` · ${test.tier}` : ""}
    </p>
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
      <li>Listening: press <strong>▶ Listen</strong>. You may listen more than once.</li>
      <li>
        Speaking: press <strong>Record</strong> and say your answer. Writing: type your answer.
      </li>
    </ul>
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
      Original classroom practice inspired by WIDA ACCESS — not an official WIDA test or score.
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
  return html`${listening && script.length ? listenPlayerHTML(key, script, { rate: ctx.prefs.rate, test: true }) : ""}
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
          ><textarea rows="3" data-test-note ${IGN}>${a || ""}</textarea>
        </label>`;
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
      <section class="test-q" aria-labelledby="qTitle">
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
        ${stimulus(f, ctx)}
        <p class="prompt-text">${f.item.prompt || ""}</p>
        ${inputFor(f)}
      </section>
      <aside class="palette" aria-label="Question navigator">
        <h2>Questions</h2>
        <div class="dots">
          ${T.flat.map((g, i) => {
            const done =
              isAnswered(g.item, T.rec.answers[g.item.id]) ||
              takesFor(`${T.test.id}:${g.item.id}`).length > 0;
            const fl = (T.rec.flags || []).includes(g.item.id);
            return html`<button
              type="button"
              class="dot ${i === T.rec.index ? "is-current" : ""} ${done ? "is-done" : ""} ${fl ? "is-flag" : ""}"
              data-jump="${i}"
              aria-label="Question ${i + 1}${done ? ", answered" : ""}${fl ? ", flagged" : ""}"
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
        const done =
          isAnswered(f.item, T.rec.answers[f.item.id]) ||
          takesFor(`${T.test.id}:${f.item.id}`).length > 0;
        return html`<li>
          <button
            type="button"
            class="review-row ${done ? "is-done" : "is-blank"}"
            data-jump="${i}"
          >
            <span
              >${i + 1}. ${f.section.domain} — ${f.item.title || f.item.skill || "Question"}</span
            ><span
              >${done ? "Answered" : "Not answered"}${(T.rec.flags || []).includes(f.item.id) ? " · ★" : ""}</span
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

function resultsHTML() {
  const r = T.rec.results;
  return html`<section class="panel results">
      <p class="eyebrow">Practice report${r.studentName ? ` · ${r.studentName}` : ""}</p>
      <h1 tabindex="-1">${T.test.title}</h1>
      ${r.pct != null ? html`<p class="big-score"><strong>${r.correct}/${r.total}</strong> questions right · ${bandOf(r.correct, r.total)}</p>` : ""}
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
  const id = ctx.route.testId;
  if (!T || T.test.id !== id) {
    const test = await loadTest(id).catch(() => null);
    if (!test)
      return {
        title: "Test not found",
        html: html`<section class="panel">
          <h1 tabindex="-1">We could not find that test.</h1>
          <a class="btn" href="${BASE}/tests">All practice tests</a>
        </section>`,
      };
    const rec = loadTestRecord(id);
    T = {
      test,
      flat: flatten(test),
      minutes: (test.sections || []).reduce((n, s) => n + (Number(s.estMinutes) || 8), 0),
      rec: { phase: "intro", index: 0, answers: {}, flags: [], ...rec },
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

function go(ctx, patch) {
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
    clearTestRecord(T.test.id);
    T.rec = { phase: "intro", index: 0, answers: {}, flags: [] };
    return go(ctx, {});
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
    announce("Test submitted.");
    return go(ctx, { phase: "results", results: grade() });
  }
  if (t.closest("[data-exit]")) {
    clearInterval(timerId);
    persist();
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
  const f = T.flat[T.rec.index];
  if (T.rec.phase !== "running" || !f) return;
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
