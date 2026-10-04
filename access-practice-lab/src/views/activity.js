// One practice activity (also the playlist player at /play?ids=…).
import {
  crumbsHTML,
  listenPlayerHTML,
  modelLadderHTML,
  recorderHTML,
  speakingChecksHTML,
  transcriptHTML,
  vocabHTML,
} from "../components.js";
import { findActivity, loadDomain, loadShared, ordered } from "../content.js";
import {
  SPEAKING_CHECKS,
  analyzeWriting,
  band,
  correctAnswerText,
  isAnswered,
  isCorrect,
  wordGoal,
} from "../grade.js";
import { evidenceLabel, strategyFor, taskCriteria, wordBank } from "../learning.js";
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer } from "../items.js";
import { visualsHTML } from "../media.js";
import { isRecording, takesFor } from "../recorder.js";
import { answerOf, loadRecord, saveRecord } from "../store.js";
import { invalidateActivity, startIndependentAttempt, updateActivityAnswer } from "../attempts.js";
import {
  BASE,
  DOMAIN_META,
  TIERS,
  announce,
  asList,
  bandLabel,
  html,
  raw,
  wordCount,
  storage,
} from "../util.js";
import { activityHref, roomHref } from "./room.js";

const IGN = raw("data-nsr-ignore");
// Transient per-visit check state: id → { ok, attempt, reveal }
const checked = new Map();
const writingChecks = new Map();
const tries = new Map(); // id → checks this visit (2nd miss reveals the answer)
const helpUsed = new Set();
let mode = "supported";
let validation = "";
let renderGeneration = 0;
let loading = false;
let cur = null; // { band, domain, level, activity, list, index, record, playlist }

async function resolve(ctx) {
  const r = ctx.route;
  if (r.view === "play") {
    const ids = r.ids;
    const index = Math.min(Math.max(0, r.index), Math.max(0, ids.length - 1));
    const found = ids.length ? await findActivity(ids[index]) : null;
    if (!found) return null;
    return {
      ...found,
      index: found.list.indexOf(found.activity),
      playlist: { ids, index, title: r.title },
    };
  }
  const data = await loadDomain(ctx.band, r.domain).catch(() => null);
  const L = data?.levels?.[r.level];
  if (!L) {
    const found = await findActivity(r.id, { domain: r.domain });
    return found ? { ...found, index: found.list.indexOf(found.activity) } : null;
  }
  const list = ordered(L);
  // Numeric links (/Listening/A/3) predate strand ordering and counted in file order.
  const wanted = /^\d+$/.test(r.id)
    ? L.activities[Math.min(Number(r.id), L.activities.length - 1)]?.id
    : r.id;
  let index = list.findIndex((a) => a.id === wanted);
  if (index < 0) {
    const found = await findActivity(r.id, { domain: r.domain });
    if (found) return { ...found, index: found.list.indexOf(found.activity) };
    index = 0;
  }
  return {
    band: ctx.band,
    domain: r.domain,
    level: r.level,
    data,
    list,
    index,
    activity: list[index],
  };
}

const isListening = (domain, a) => domain === "Listening" || a.listening;
const save = () => saveRecord(cur.band, cur.domain, cur.level, cur.record);

function stimulusHTML(a, ctx) {
  const listening = isListening(cur.domain, a);
  const c = checked.get(a.id);
  const answeredOnce = Boolean(c) || cur.record.complete.includes(a.id);
  return html`${listening && a.script ? listenPlayerHTML(a.id, a.script, { rate: ctx.prefs.rate }) : ""}
  ${listening && a.script && answeredOnce ? transcriptHTML(a.id, a.script) : ""} ${visualsHTML(a)}
  ${
    !listening && asList(a.passage).length
      ? html`<article class="passage">
          ${a.passageTitle ? html`<h3>${a.passageTitle}</h3>` : ""}${asList(a.passage).map((p) => html`<p>${p}</p>`)}
        </article>`
      : ""
  }
  ${
    a.prompt
      ? html`<div class="prompt">
          <p class="prompt-text">${a.prompt}</p>
          ${cur.domain !== "Reading" ? html`<button type="button" class="ghost small" data-say="${a.prompt}" aria-label="Read the question aloud">🔊 Hear question</button>` : ""}
        </div>`
      : ""
  }`;
}

function feedbackHTML(a) {
  const c = checked.get(a.id);
  if (!c) return "";
  if (c.ok)
    return html`<div class="feedback is-right" role="status">
      <p class="fb-title">✓ ${c.attempt === 1 ? "Correct!" : "You got it!"}</p>
      ${a.correct ? html`<p>${a.correct}</p>` : ""}
      ${a.extension ? html`<p class="fb-extra"><strong>Go further:</strong> ${a.extension}</p>` : ""}
      ${cur.domain === "Speaking" ? html`<p class="fb-extra"><strong>Now say it:</strong> record yourself saying the best answer.</p>` : ""}
    </div>`;
  if (c.reveal === "full" && mode === "supported")
    return html`<div class="feedback is-shown" role="status">
      <p class="fb-title">Here is the answer</p>
      <p><strong>${correctAnswerText(a)}</strong></p>
      ${a.support ? html`<p>${a.support}</p>` : ""}
      <button type="button" class="btn" data-retry>Try it again</button>
    </div>`;
  return html`<div class="feedback is-hint" role="status">
    <p class="fb-title">Not yet — try again</p>
    ${a.hint && mode === "supported" ? html`<p>${a.hint}</p>` : html`<p>Review the task, then try again. Switch to Learn with help for a clue.</p>`}
    <button type="button" class="btn" data-retry>Try again</button>
  </div>`;
}

function interactiveHTML(a) {
  const c = checked.get(a.id);
  const answer = answerOf(cur.record, a.id);
  const reveal = c ? (c.ok ? "mark" : c.reveal || "mark") : "none";
  return html`${inputHTML(a, answer, { reveal })}
  ${!c ? html`<button type="button" class="btn btn-primary btn-check" data-check ${isAnswered(a, answer ?? seedAnswer(a)) ? "" : raw("disabled")}>Check my answer</button>` : ""}
  ${feedbackHTML(a)}
  ${cur.domain === "Speaking" && c?.ok ? recorderHTML(a.id, { level: cur.level, recording: isRecording(a.id) }) : ""}`;
}

function speakingHTML(a) {
  const notes = cur.record.notes[a.id] || "";
  const hasTake = takesFor(a.id).length > 0 || cur.record.practiced[a.id];
  return html`${recorderHTML(a.id, { prompt: a.prompt, level: cur.level, recording: isRecording(a.id), models: hasTake && mode === "supported" ? a.models : null, activity: a })}
    ${!hasTake && a.models ? html`<p class="fine">Record or practice aloud with a partner, then hear sample answers in Learn with help mode.</p>` : ""}
    <label class="field">
      <span>${a.responseLabel || "Planning notes (optional)"}</span>
      <textarea
        rows="3"
        data-note
        placeholder="${a.responsePlaceholder || "Words or ideas I will say…"}"
        ${IGN}
      >
${notes}</textarea>
    </label>
    <section class="task-criteria"><h2>What to include</h2><ul>${taskCriteria(a).map((c) => html`<li>${c}</li>`)}</ul></section>
    ${speakingChecksHTML(cur.record.selfChecks[a.id] || {})}
    <label class="practiced"
      ><input
        type="checkbox"
        data-practiced
        ${cur.record.practiced[a.id] ? raw("checked") : ""}
        ${IGN}
      />
      I practiced out loud (with a partner or my teacher).</label
    >
    <button type="button" class="btn btn-primary" data-save-speaking>
      Save my speaking practice
    </button>
    ${cur.record.complete.includes(a.id) ? html`<p class="saved-note">✓ Practice evidence saved. The audio itself is not saved. Try again to add a useful detail.</p>` : ""}`;
}

function writingHTML(a) {
  const text = cur.record.notes[a.id] || "";
  const goal = wordGoal(cur.level);
  const bank = mode === "supported" ? wordBank(a).slice(0, 12) : [];
  const result = writingChecks.get(a.id);
  const usedWords = new Set(analyzeWriting(text, a, cur.level).usedWords);
  return html`${mode === "supported" && (bank.length || (a.frames || []).length) ? raw('<details class="writing-starters"><summary>Writing starters</summary>') : ""}${
      bank.length
        ? html`<ul class="wordbank" aria-label="Word bank">
            ${bank.map((w) => html`<li class="${usedWords.has(String(w).split("/")[0].trim().toLowerCase()) ? "is-used" : ""}">${w}</li>`)}
          </ul>`
        : ""
    }
    ${
      mode === "supported" && (a.frames || []).length
        ? html`<ul class="frames inline">
            ${a.frames.map((f) => html`<li>${f}</li>`)}
          </ul>`
        : ""
    }
    ${mode === "supported" && (bank.length || (a.frames || []).length) ? raw("</details>") : ""}
    <label class="field">
      <span>${a.responseLabel || "Your writing"}</span>
      <textarea
        rows="${cur.level === "C" ? 10 : 6}"
        data-note
        spellcheck="false"
        placeholder="${a.responsePlaceholder || "Write your answer here."}"
        ${IGN}
      >
${text}</textarea>
    </label>
    <p class="fine">Answer the question first. The word target is optional; useful details matter more than length.</p>
    <p class="meter">
      <span class="meter-bar"
        ><span
          style="width:${Math.min(100, Math.round((wordCount(text) / goal) * 100))}%"
        ></span></span
      ><span data-meter>${wordCount(text)} / about ${goal} words</span>
    </p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-check-writing>Check my writing</button>
      <button type="button" class="ghost" data-read-writing data-say="${text || "Write something first."}">
        🔊 Read my writing to me
      </button>
    </div>
    ${
      result
        ? html`<div class="feedback ${result.met >= 3 ? "is-right" : "is-hint"}" role="status">
              <p class="fb-title">Review your meaning first</p>
              <ul>${taskCriteria(a).map((c) => html`<li>${c}</li>`)}</ul>
              <p><strong>One next step:</strong> ${result.checks.find((c) => !c.ok)?.tip || "Read your answer aloud. Keep only details that help answer the question."}</p>
              <details><summary>Optional surface checks</summary>
              <ul class="checks">
                ${result.checks.map((c) => html`<li class="${c.ok ? "ok" : "todo"}">${c.ok ? "✓" : "○"} ${c.ok ? c.label : c.tip}</li>`)}
              </ul>
              </details>
              ${result.usedWords.length ? html`<p class="fine">Word-bank words you used: ${result.usedWords.join(", ")}</p>` : ""}
              <p class="fine">
                These checks notice surface features, not meaning or a score. Did you answer every part and include a specific detail? Ask your teacher for feedback.
              </p>
            </div>
            <label class="field"><span>What did you improve, or what did you check?</span><textarea data-reflection rows="2" data-nsr-ignore>${cur.record.reflections[a.id] || ""}</textarea></label>
            <button type="button" class="btn btn-primary" data-finish-writing>Save my reviewed writing</button>
            <details class="draft-history"><summary>Compare my first and current draft</summary><h3>First draft</h3><p>${cur.record.drafts[a.id]?.first || text}</p><h3>Current draft</h3><p>${text}</p></details>
            ${a.models && mode === "supported" ? modelLadderHTML(a.models, cur.level, a) : ""}`
        : ""
    }`;
}

function worksheetHTML(a) {
  return html`<div class="worksheet">
      ${(a.sheet || []).map(
        (s) =>
          html`<section>
            <h4>${s.heading}</h4>
            <ol class="ws-lines">
              ${(s.items || []).map((i) => html`<li>${i}<span class="ws-line" aria-hidden="true"></span></li>`)}
            </ol>
          </section>`,
      )}
      <p class="ws-name">Name: ______________________ Date: ____________</p>
    </div>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-print>🖨️ Print this page</button>
      <button type="button" class="ghost" data-mark-done>
        ${cur.record.complete.includes(a.id) ? "✓ Done" : "Mark as done"}
      </button>
    </div>`;
}

function answerZone(a) {
  if (a.type === "worksheet") return worksheetHTML(a);
  if (a.type === "constructed") return cur.domain === "Speaking" ? speakingHTML(a) : writingHTML(a);
  return interactiveHTML(a);
}

function navHTML() {
  if (cur.playlist) {
    const { ids, index, title } = cur.playlist;
    const at = (i) =>
      `${BASE}/play?ids=${ids.join(",")}&i=${i}&grades=${cur.band}&mode=${mode}${title ? `&t=${encodeURIComponent(title)}` : ""}`;
    return html`<nav class="act-nav" aria-label="Playlist">
      ${index > 0 ? html`<a class="btn" href="${at(index - 1)}">← Previous</a>` : html`<span></span>`}
      <span class="act-count">${index + 1} of ${ids.length}</span>
      ${index < ids.length - 1 ? html`<a class="btn btn-primary" href="${at(index + 1)}">Next →</a>` : html`<a class="btn btn-primary" href="${BASE}/passport">Finish ✓</a>`}
    </nav>`;
  }
  const prev = cur.list[cur.index - 1];
  const next = cur.list[cur.index + 1];
  return html`<nav class="act-nav" aria-label="Activities">
    ${prev ? html`<a class="btn" href="${activityHref(cur.domain, cur.level, prev.id)}">← Previous</a>` : html`<span></span>`}
    <span class="act-count">${cur.index + 1} of ${cur.list.length}</span>
    ${next ? html`<a class="btn btn-primary" href="${activityHref(cur.domain, cur.level, next.id)}">Next →</a>` : html`<a class="btn btn-primary" href="${roomHref(cur.domain, cur.level)}">Back to the room ✓</a>`}
  </nav>`;
}

export async function render(ctx) {
  const generation = ++renderGeneration;
  loading = true;
  const snapshot = { band: ctx.band, route: { ...ctx.route }, prefs: { ...ctx.prefs } };
  const requestedMode = new URLSearchParams(location.search).get("mode");
  const found = await resolve(snapshot);
  const shared = await loadShared().catch(() => null);
  if (generation !== renderGeneration) return { title: "", html: "" };
  loading = false;
  if (!found?.activity)
    return {
      title: "Not found",
      html: html`<section class="panel">
        <h1 tabindex="-1">We could not find that activity.</h1>
        <p>It may have moved. Choose a skill from the lab home.</p>
        <a class="btn" href="${BASE}/">Lab home</a>
      </section>`,
    };
  const sameActivity = cur?.activity?.id === found.activity.id;
  cur = { ...found, record: loadRecord(found.band, found.domain, found.level) };
  if (!sameActivity) {
    checked.clear();
    writingChecks.clear();
    tries.clear();
    helpUsed.clear();
    validation = "";
  }
  const a = cur.activity;
  mode = requestedMode === "independent" ? "independent" : "supported";
  const meta = DOMAIN_META[cur.domain] || DOMAIN_META.Listening;
  const tier = TIERS[cur.level];
  const done = cur.record.complete.includes(a.id);
  return {
    title: a.title,
    html: html`${crumbsHTML([
        ["Lab", `${BASE}/`],
        [meta.room, roomHref(cur.domain, cur.level)],
        [a.title, null],
      ])}
      <article class="activity" style="--room:${cur.data.color || "#1f766f"}">
        <header class="act-head">
          <p class="eyebrow">
            <span aria-hidden="true">${meta.glyph}</span> ${meta.room} · ${tier?.name || cur.level}
            · ${bandLabel(cur.band)}${cur.playlist?.title ? ` · ${cur.playlist.title}` : ""}
          </p>
          <h1 tabindex="-1">
            ${a.title}${done ? html` <span class="done-badge">✓ Done</span>` : ""}
          </h1>
          <div class="directions">
            <p>${a.directions}</p>
            <button
              type="button"
              class="ghost small"
              data-say="${a.directions}"
              aria-label="Read the directions aloud"
            >
              🔊 Hear directions
            </button>
          </div>
        </header>
        <div class="activity-workspace">
        <section class="stimulus" aria-labelledby="sourceHeading"><h2 id="sourceHeading" class="workbook-heading"><span aria-hidden="true">1</span> ${isListening(cur.domain, a) ? "Listen and notice" : cur.domain === "Reading" ? "Read and notice" : "Look and plan"}</h2>${stimulusHTML(a, ctx)}</section>
        <div class="response-workspace"><h2 class="workbook-heading"><span aria-hidden="true">2</span> ${cur.domain === "Speaking" ? "Speak and review" : a.type === "worksheet" ? "Work on paper" : "Respond and review"}</h2>
        <fieldset class="practice-mode"><legend>Practice mode</legend>
          <label><input type="radio" name="practiceMode" value="supported" data-mode ${mode === "supported" ? raw("checked") : ""} data-nsr-ignore /> Learn with help</label>
          <label><input type="radio" name="practiceMode" value="independent" data-mode ${mode === "independent" ? raw("checked") : ""} data-nsr-ignore /> Try independently</label>
          <p class="fine">${mode === "independent" ? "Vocabulary, models and hints stay closed until you review. Replay and directions remain available. This is classroom practice, not a test simulation." : "Strategies and examples are available below. Help and retries are saved as supported practice."}</p></fieldset>
        ${mode === "supported" ? html`<details class="strategy" data-help><summary>First: try a strategy</summary><p>${strategyFor(cur.domain)}</p></details>${vocabHTML(a, shared, { focused: Boolean(checked.get(a.id) || writingChecks.get(a.id)) })}` : ""}
        ${!["constructed", "worksheet"].includes(a.type) && cur.record.results[a.id] ? html`<div class="fresh-attempt"><button type="button" class="btn" data-fresh-attempt>Start a fresh independent attempt</button><p class="fine">Save a summary of this attempt and clear its selected answers. Earlier help stays in your history; this is another try at the same task.</p></div>` : ""}
        <p id="answerValidation" role="alert" ${validation ? "" : raw("hidden")}>${validation}</p>
        <section class="answer-zone" aria-label="Your answer">${answerZone(a)}</section>
        </div></div>
        <p class="save-explainer">Writing and checklists save on this browser. Audio does not. <a href="${BASE}/passport">Saved work and transfer options</a></p>
      </article>
      ${cur.record.results[a.id] ? html`<p class="practice-evidence"><strong>Practice evidence:</strong> ${evidenceLabel(cur.record.results[a.id])}. This is not a proficiency score.</p>` : ""}
      ${navHTML()}`,
  };
}

// ── interactions ──────────────────────────────────────────────────────────────
function setAnswer(a, next, ctx) {
  updateActivityAnswer(cur.record, a.id, next);
  save();
  ctx.rerender();
}

function check(a, ctx) {
  const answer = answerOf(cur.record, a.id) ?? seedAnswer(a);
  if (!isAnswered(a, answer)) return;
  if (answer !== undefined && answerOf(cur.record, a.id) === undefined)
    cur.record.answers[a.id] = answer;
  const attempt = (cur.record.attempts[a.id] || 0) + 1;
  cur.record.attempts[a.id] = attempt;
  const ok = isCorrect(a, answer);
  const n = (tries.get(a.id) || 0) + 1;
  tries.set(a.id, n);
  checked.set(a.id, { ok, attempt: n, reveal: ok ? "mark" : n >= 2 && mode === "supported" ? "full" : "mark" });
  cur.record.results[a.id] = {
    ok,
    meaningful: true,
    evidence: ok ? ((helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])) || attempt > 1 ? "supported" : "independent") : "attempted",
    supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])),
    mode,
    score: ok ? 1 : 0,
    total: 1,
    band: band(ok ? 1 : 0, 1),
    date: new Date().toISOString(),
    tries: n,
  };
  cur.record.complete = cur.record.complete.filter((id) => id !== a.id);
  if (ok) cur.record.complete.push(a.id);
  save();
  announce(ok ? "Correct!" : n >= 2 && mode === "supported" ? "Here is the answer." : "Not yet. Try again.");
  ctx.rerender();
}

export function onClick(e, ctx) {
  if (!cur || loading) return;
  const a = cur.activity;
  const t = e.target;
  const choice = !checked.get(a.id) && choiceTarget(e);
  if (choice) {
    setAnswer(a, reduceAnswer(a, answerOf(cur.record, a.id), choice), ctx);
    return true;
  }
  if (["sort", "order", "hotText"].includes(a.type) && !checked.get(a.id)) {
    const next = reduceAnswer(a, answerOf(cur.record, a.id), t);
    if (next !== undefined && !t.matches("[data-ans-choice]")) return setAnswer(a, next, ctx);
  }
  if (t.closest("[data-fresh-attempt]")) {
    if (["constructed", "worksheet"].includes(a.type)) return;
    startIndependentAttempt(cur.record, a.id);
    checked.delete(a.id); tries.delete(a.id); helpUsed.delete(a.id);
    validation = "";
    save();
    const url = new URL(location.href);
    url.searchParams.set("mode", "independent");
    url.searchParams.set("grades", cur.band);
    ctx.navigate(url.pathname + url.search, { replace: true });
    announce("Fresh attempt started. Your previous attempt summary is in your Passport portfolio.");
    return;
  }
  if (t.closest("[data-check]")) return check(a, ctx);
  if (t.closest("[data-retry]")) {
    checked.delete(a.id);
    ctx.rerender();
    return;
  }
  if (t.closest("[data-finish-writing]")) {
    const text = cur.record.notes[a.id] || "";
    const reflection = cur.record.reflections[a.id] || "";
    if (!wordCount(text) || !wordCount(reflection)) {
      validation = "Write your answer and tell what you improved or checked first.";
      ctx.rerender(); return;
    }
    const revised = cur.record.drafts[a.id]?.first?.trim() !== text.trim();
    writingChecks.set(a.id, analyzeWriting(text, a, cur.level));
    cur.record.results[a.id] = { words: wordCount(text), meaningful: true, evidence: revised ? "revised" : "writing", mode, supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])), date: new Date().toISOString() };
    if (!cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
    validation = ""; save(); announce(storage.isVolatile ? "Reviewed writing kept in this tab. Export a Passport code before leaving." : "Reviewed writing saved. This is practice evidence, not a score."); ctx.rerender(); return;
  }
  if (t.closest("[data-check-writing]")) {
    const text = cur.record.notes[a.id] || "";
    if (!wordCount(text)) {
      validation = "Write a word, phrase, or sentence before checking your writing.";
      writingChecks.delete(a.id);
      Promise.resolve(ctx.rerender()).then(() => document.querySelector("[data-note]")?.focus());
      return;
    }
    validation = "";
    cur.record.drafts[a.id] ||= { first: text };
    const result = analyzeWriting(text, a, cur.level);
    writingChecks.set(a.id, result);
    cur.record.results[a.id] = {
      meaningful: true,
      evidence: "attempted",
      mode,
      supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])),
      words: result.words,
      date: new Date().toISOString(),
    };
    // Completion is a deliberate meaning review, never a surface-feature score.
    cur.record.complete = cur.record.complete.filter((id) => id !== a.id);
    save();
    ctx.rerender();
    return;
  }
  if (t.closest("[data-save-speaking]")) {
    const checks = cur.record.selfChecks[a.id] || {};
    const n = SPEAKING_CHECKS.filter((c) => checks[c.id]).length;
    const practiced = takesFor(a.id).length > 0 || cur.record.practiced[a.id];
    if (!practiced) { validation = "Record your answer or practice aloud with a partner first."; ctx.rerender(); return; }
    validation = "";
    cur.record.results[a.id] = {
      meaningful: true,
      evidence: takesFor(a.id).length ? "recorded" : "speaking",
      mode,
      supportUsed: (helpUsed.has(a.id) || Boolean(cur.record.supportUsed?.[a.id])),
      score: n,
      total: SPEAKING_CHECKS.length,
      band: band(n, SPEAKING_CHECKS.length),
      practiced: Boolean(practiced),
      date: new Date().toISOString(),
    };
    cur.record.complete = cur.record.complete.filter((id) => id !== a.id);
    if (practiced && n >= 2) {
      if (!cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
      announce(storage.isVolatile ? "Speaking practice kept in this tab. Export a Passport code before leaving." : "Speaking practice saved.");
    } else
      announce(
        practiced
          ? "Check at least two boxes on the checklist."
          : "Record your answer (or practice aloud) first.",
      );
    save();
    ctx.rerender();
    return;
  }
  if (t.closest("[data-mark-done]")) {
    const i = cur.record.complete.indexOf(a.id);
    i >= 0 ? cur.record.complete.splice(i, 1) : cur.record.complete.push(a.id);
    if (i < 0) cur.record.results[a.id] = { meaningful: true, evidence: "worksheet", date: new Date().toISOString() };
    else delete cur.record.results[a.id];
    save();
    ctx.rerender();
  }
}

export function onChange(e, ctx) {
  if (!cur || loading) return;
  const a = cur.activity;
  const t = e.target;
  if (t.matches("[data-mode]")) {
    const url = new URL(location.href); url.searchParams.set("mode", t.value); url.searchParams.set("grades", cur.band);
    ctx.navigate(url.pathname + url.search, { replace: true }); return;
  }
  if ((t.matches("[data-ans-choice]") || t.matches("[data-ans-cloze]")) && !checked.get(a.id)) {
    const next = reduceAnswer(a, answerOf(cur.record, a.id), t);
    if (next !== undefined) return setAnswer(a, next, ctx);
  }
  if (t.matches("[data-selfcheck]")) {
    invalidateActivity(cur.record, a.id);
    cur.record.selfChecks[a.id] = {
      ...(cur.record.selfChecks[a.id] || {}),
      [t.dataset.selfcheck]: t.checked,
    };
    save();
    ctx.rerender();
  }
  if (t.matches("[data-practiced]")) {
    invalidateActivity(cur.record, a.id);
    cur.record.practiced[a.id] = t.checked;
    save();
    ctx.rerender();
  }
}

export function onInput(e) {
  if (!cur || loading) return;
  if (e.target.matches("[data-reflection]")) {
    if (cur.record.reflections[cur.activity.id] !== e.target.value) {
      invalidateActivity(cur.record, cur.activity.id);
      document.querySelector(".done-badge")?.remove();
      const evidence = document.querySelector(".practice-evidence");
      if (evidence) evidence.textContent = "Reflection changed — review this version before marking it complete.";
    }
    cur.record.reflections[cur.activity.id] = e.target.value; save(); return;
  }
  if (!e.target.matches("[data-note]")) return;
  const a = cur.activity;
  if (cur.domain !== "Speaking" && cur.record.notes[a.id] !== e.target.value) {
    invalidateActivity(cur.record, a.id);
    document.querySelector(".done-badge")?.remove();
    writingChecks.delete(a.id);
    const evidence = document.querySelector(".practice-evidence");
    if (evidence) evidence.textContent = "Draft changed — review this version before marking it complete.";
    const feedback = document.querySelector(".feedback");
    if (feedback) feedback.hidden = true;
  }
  cur.record.notes[a.id] = e.target.value;
  save();
  const readButton = document.querySelector("[data-read-writing]");
  if (readButton) readButton.dataset.say = e.target.value || "Write something first.";
  const meter = document.querySelector("[data-meter]");
  if (meter) {
    const goal = wordGoal(cur.level);
    const n = wordCount(e.target.value);
    meter.textContent = `${n} / about ${goal} words`;
    const bar = document.querySelector(".meter-bar > span");
    if (bar) bar.style.width = `${Math.min(100, Math.round((n / goal) * 100))}%`;
    const usedWords = new Set(analyzeWriting(e.target.value, a, cur.level).usedWords);
    for (const li of document.querySelectorAll(".wordbank li"))
      li.classList.toggle("is-used", usedWords.has(li.textContent.split("/")[0].trim().toLowerCase()));
  }
}

export function mount(root) {
  const owner = cur;
  for (const details of root.querySelectorAll(".helpers, .strategy, .ladder, .transcript, .writing-starters")) {
    details.addEventListener("toggle", () => { if (details.open && details.isConnected && cur === owner) { helpUsed.add(cur.activity.id); cur.record.supportUsed ||= {}; cur.record.supportUsed[cur.activity.id] = true; save(); } });
  }
}

export function unmount() { renderGeneration++; loading = true; }
