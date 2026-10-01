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
import { choiceTarget, inputHTML, reduceAnswer, seedAnswer } from "../items.js";
import { visualsHTML } from "../media.js";
import { isRecording, takesFor } from "../recorder.js";
import { answerOf, loadRecord, saveRecord } from "../store.js";
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
} from "../util.js";
import { activityHref, roomHref } from "./room.js";

const IGN = raw("data-nsr-ignore");
// Transient per-visit check state: id → { ok, attempt, reveal }
const checked = new Map();
const writingChecks = new Map();
const tries = new Map(); // id → checks this visit (2nd miss reveals the answer)
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
          ${cur.domain !== "Reading" ? html`<button type="button" class="ghost small" data-say="${a.prompt}" aria-label="Read the question aloud">🔊</button>` : ""}
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
  if (c.reveal === "full")
    return html`<div class="feedback is-shown" role="status">
      <p class="fb-title">Here is the answer</p>
      <p><strong>${correctAnswerText(a)}</strong></p>
      ${a.support ? html`<p>${a.support}</p>` : ""}
      <button type="button" class="btn" data-retry>Try it again</button>
    </div>`;
  return html`<div class="feedback is-hint" role="status">
    <p class="fb-title">Not yet — try again</p>
    ${a.hint ? html`<p>${a.hint}</p>` : ""}
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
  return html`${recorderHTML(a.id, { prompt: a.prompt, level: cur.level, recording: isRecording(a.id), models: hasTake ? a.models : null })}
    ${!hasTake && a.models ? html`<p class="fine">Record once, then you can hear sample answers at every level.</p>` : ""}
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
    ${cur.record.complete.includes(a.id) ? html`<p class="saved-note">✓ Saved. Try again any time to beat your last recording.</p>` : ""}`;
}

function writingHTML(a) {
  const text = cur.record.notes[a.id] || "";
  const goal = wordGoal(cur.level);
  const bank = [...(a.wordBank || []), ...(a.vocabulary || []).map((v) => v[0])].slice(0, 12);
  const result = writingChecks.get(a.id);
  const lower = text.toLowerCase();
  return html`${
      bank.length
        ? html`<ul class="wordbank" aria-label="Word bank">
            ${bank.map((w) => html`<li class="${lower.includes(String(w).toLowerCase()) ? "is-used" : ""}">${w}</li>`)}
          </ul>`
        : ""
    }
    ${
      (a.frames || []).length
        ? html`<ul class="frames inline">
            ${a.frames.map((f) => html`<li>${f}</li>`)}
          </ul>`
        : ""
    }
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
    <p class="meter">
      <span class="meter-bar"
        ><span
          style="width:${Math.min(100, Math.round((wordCount(text) / goal) * 100))}%"
        ></span></span
      ><span data-meter>${wordCount(text)} / about ${goal} words</span>
    </p>
    <div class="row-actions">
      <button type="button" class="btn btn-primary" data-check-writing>Check my writing</button>
      <button type="button" class="ghost" data-say="${text || "Write something first."}">
        🔊 Read my writing to me
      </button>
    </div>
    ${
      result
        ? html`<div class="feedback ${result.met >= 3 ? "is-right" : "is-hint"}" role="status">
              <p class="fb-title">
                ${result.met >= 3 ? "✓ Strong writing practice" : "Almost there"}
              </p>
              <ul class="checks">
                ${result.checks.map((c) => html`<li class="${c.ok ? "ok" : "todo"}">${c.ok ? "✓" : "○"} ${c.ok ? c.label : c.tip}</li>`)}
              </ul>
              ${result.usedWords.length ? html`<p class="fine">Word-bank words you used: ${result.usedWords.join(", ")}</p>` : ""}
              <p class="fine">
                Your teacher can read this for a real score — this is a practice check.
              </p>
            </div>
            ${a.models ? modelLadderHTML(a.models, cur.level) : ""}`
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
      `${BASE}/play?ids=${ids.join(",")}&i=${i}${title ? `&t=${encodeURIComponent(title)}` : ""}`;
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
  const found = await resolve(ctx);
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
  }
  const a = cur.activity;
  const meta = DOMAIN_META[cur.domain] || DOMAIN_META.Listening;
  const tier = TIERS[cur.level];
  const shared = await loadShared().catch(() => null);
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
              🔊
            </button>
          </div>
        </header>
        <section class="stimulus">${stimulusHTML(a, ctx)}</section>
        ${vocabHTML(a, shared)}
        <section class="answer-zone" aria-label="Your answer">${answerZone(a)}</section>
      </article>
      ${navHTML()}`,
  };
}

// ── interactions ──────────────────────────────────────────────────────────────
function setAnswer(a, next, ctx) {
  cur.record.answers[a.id] = next;
  save();
  ctx.rerender();
}

function check(a, ctx) {
  const answer = answerOf(cur.record, a.id) ?? seedAnswer(a);
  if (answer !== undefined && answerOf(cur.record, a.id) === undefined)
    cur.record.answers[a.id] = answer;
  const attempt = (cur.record.attempts[a.id] || 0) + 1;
  cur.record.attempts[a.id] = attempt;
  const ok = isCorrect(a, answer);
  const n = (tries.get(a.id) || 0) + 1;
  tries.set(a.id, n);
  checked.set(a.id, { ok, attempt: n, reveal: ok ? "mark" : n >= 2 ? "full" : "mark" });
  cur.record.results[a.id] = {
    ok,
    score: ok ? 1 : 0,
    total: 1,
    band: band(ok ? 1 : 0, 1),
    date: new Date().toISOString(),
    tries: n,
  };
  if (ok && !cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
  save();
  announce(ok ? "Correct!" : n >= 2 ? "Here is the answer." : "Not yet. Try again.");
  ctx.rerender();
}

export function onClick(e, ctx) {
  if (!cur) return;
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
  if (t.closest("[data-check]")) return check(a, ctx);
  if (t.closest("[data-retry]")) {
    checked.delete(a.id);
    ctx.rerender();
    return;
  }
  if (t.closest("[data-check-writing]")) {
    const text = cur.record.notes[a.id] || "";
    const result = analyzeWriting(text, a, cur.level);
    writingChecks.set(a.id, result);
    cur.record.results[a.id] = {
      score: result.met,
      total: result.checks.length,
      band: band(result.met, result.checks.length),
      words: result.words,
      date: new Date().toISOString(),
    };
    if (result.met >= 3 && !cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
    save();
    ctx.rerender();
    return;
  }
  if (t.closest("[data-save-speaking]")) {
    const checks = cur.record.selfChecks[a.id] || {};
    const n = SPEAKING_CHECKS.filter((c) => checks[c.id]).length;
    const practiced = takesFor(a.id).length > 0 || cur.record.practiced[a.id];
    cur.record.results[a.id] = {
      score: n,
      total: SPEAKING_CHECKS.length,
      band: band(n, SPEAKING_CHECKS.length),
      practiced: Boolean(practiced),
      date: new Date().toISOString(),
    };
    if (practiced && n >= 2) {
      if (!cur.record.complete.includes(a.id)) cur.record.complete.push(a.id);
      announce("Speaking practice saved.");
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
    save();
    ctx.rerender();
  }
}

export function onChange(e, ctx) {
  if (!cur) return;
  const a = cur.activity;
  const t = e.target;
  if ((t.matches("[data-ans-choice]") || t.matches("[data-ans-cloze]")) && !checked.get(a.id)) {
    const next = reduceAnswer(a, answerOf(cur.record, a.id), t);
    if (next !== undefined) return setAnswer(a, next, ctx);
  }
  if (t.matches("[data-selfcheck]")) {
    cur.record.selfChecks[a.id] = {
      ...(cur.record.selfChecks[a.id] || {}),
      [t.dataset.selfcheck]: t.checked,
    };
    save();
  }
  if (t.matches("[data-practiced]")) {
    cur.record.practiced[a.id] = t.checked;
    save();
    ctx.rerender();
  }
}

export function onInput(e) {
  if (!cur || !e.target.matches("[data-note]")) return;
  const a = cur.activity;
  cur.record.notes[a.id] = e.target.value;
  save();
  const meter = document.querySelector("[data-meter]");
  if (meter) {
    const goal = wordGoal(cur.level);
    const n = wordCount(e.target.value);
    meter.textContent = `${n} / about ${goal} words`;
    const bar = document.querySelector(".meter-bar > span");
    if (bar) bar.style.width = `${Math.min(100, Math.round((n / goal) * 100))}%`;
    const lower = e.target.value.toLowerCase();
    for (const li of document.querySelectorAll(".wordbank li"))
      li.classList.toggle("is-used", lower.includes(li.textContent.toLowerCase()));
  }
}
