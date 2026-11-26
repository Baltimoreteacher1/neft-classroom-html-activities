// Plan & Respond — "Check work" and "Reteach plan" views. State lives on the tab's state object (st).

import { feedbackSlipDoc, openPrint, reteachDoc } from "./companion-print.js";
import { PATHWAYS, buildReteachPlan } from "./reteach.js";
import { analyzeResponse, followUps } from "./work-check.js";

const esc = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
const blanks = (s) => esc(s).replace(/\[([^\]]+)\]/g, '<span class="cp-blank">$1</span>');

const list = (items, key = "text") =>
  `<ul class="cp-plain">${items.map((i) => `<li>${i.area ? `<b>${esc(i.area)}:</b> ` : ""}${esc(i[key] ?? i)}</li>`).join("")}</ul>`;

// ── Check work ──────────────────────────────────────────────────────────────

function resultView(st, detail) {
  const r = st.result;
  if (!r) return "";
  if (r.empty) return `<p class="cp-note" role="status">Paste a response first.</p>`;
  const follow = followUps(r, detail, st.level);
  return `
    <div class="cp-result" aria-live="polite">
      ${r.privacy.length ? `<p class="cp-note cp-note--warn" role="alert">${esc(r.privacy[0])}</p>` : ""}
      <div class="cp-two">
        <div class="cp-card"><h4>What the work shows</h4><p class="cp-muted">Counted from the words on the page.</p>${list(r.observed)}</div>
        <div class="cp-card cp-card--maybe"><h4>Things to check</h4><p class="cp-muted">These are guesses. You decide. Ask the student.</p>${r.possible.length ? list(r.possible) : `<p class="cp-muted">Nothing to flag from the text alone.</p>`}</div>
      </div>
      <div class="cp-card">
        <h4>Feedback for the student</h4>
        <p><b>Strength:</b> ${r.strengths.map(esc).join(" ")}</p>
        ${r.next.length ? `<p><b>Next step:</b> ${r.next.map(esc).join(" ")}</p>` : ""}
        <div class="cp-two">
          <div><h5>${esc(follow.revise.title)}</h5><ol>${follow.revise.steps.map((s) => `<li>${blanks(s)}</li>`).join("")}</ol></div>
          <div><h5>${esc(follow.fresh.title)}</h5><ol>${follow.fresh.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol></div>
        </div>
        <button type="button" class="cp-btn cp-btn--solid" data-cp-print="slip">Print feedback slip</button>
      </div>
    </div>`;
}

export function checkView(st, detail) {
  return `
    <div class="cp-check-view">
      <div class="cp-card">
        <h4>Check one piece of student work</h4>
        <p class="cp-muted">Paste one response with the name removed. It is read on this device only and is not saved or sent. This is a quick look at the words on the page, not a grade, a level or a diagnosis.</p>
        <label class="cp-label" for="cpTask">What was the task?</label>
        <select id="cpTask" class="cp-select" data-cp-task>
          <option value="exit" ${st.task === "exit" ? "selected" : ""}>The unit's exit ticket</option>
          <option value="open" ${st.task === "open" ? "selected" : ""}>Another question or writing task</option>
        </select>
        ${st.task === "exit" ? `<p class="cp-prompt"><b>Exit ticket:</b> ${esc(detail.studio.exit_ticket?.prompt || detail.studio.essential_question)}</p>` : ""}
        <label class="cp-label" for="cpText">Student response (no names)</label>
        <textarea id="cpText" class="cp-textarea" rows="6" data-cp-text autocomplete="off" spellcheck="false">${esc(st.text)}</textarea>
        <div class="cp-actions"><button type="button" class="cp-btn cp-btn--solid" data-cp-analyze="1">See what it shows</button><button type="button" class="cp-btn" data-cp-clear="1">Clear</button></div>
      </div>
      ${resultView(st, detail)}
    </div>`;
}

/** Returns true when the click was a check-work action. */
export function bindCheck(st, btn) {
  const { detail } = st.ctx;
  if (btn.dataset.cpAnalyze) {
    st.result = analyzeResponse(st.text, detail, { task: st.task });
    return true;
  }
  if (btn.dataset.cpClear) {
    st.text = "";
    st.result = null;
    return true;
  }
  if (btn.dataset.cpPrint === "slip" && st.result && !st.result.empty) {
    openPrint(
      feedbackSlipDoc(detail.unit, st.result, followUps(st.result, detail, st.level)),
      `feedback-${detail.unit.id}.html`,
    );
    return false;
  }
  return false;
}

// ── Reteach plan ────────────────────────────────────────────────────────────

function stepBody(s) {
  const parts = [`<p>${esc(s.teacher)}</p>`];
  if (s.items)
    parts.push(
      `<ul class="cp-plain">${s.items.map((i) => `<li>${esc(i.q)}${i.a ? ` <span class="cp-muted">Answer: ${esc(i.a)}</span>` : ""}</li>`).join("")}</ul>`,
    );
  if (s.words)
    parts.push(
      `<ul class="cp-words">${s.words.map((w) => `<li><b>${esc(w.term)}</b>${w.es ? ` <i>${esc(w.es)}</i>` : ""}<span>${esc(w.def)}</span><span class="cp-muted">Example: ${esc(w.example)}</span></li>`).join("")}</ul>`,
    );
  if (s.lookFor) parts.push(`<p class="cp-muted"><b>Listen for:</b> ${esc(s.lookFor)}</p>`);
  if (s.mentor) parts.push(`<p class="cp-say">${esc(s.mentor)}</p>`);
  if (s.chunks)
    parts.push(
      `<ul class="cp-plain">${s.chunks.map((c) => `<li><b>${esc(c.text)}</b> ${esc(c.role)}. <span class="cp-muted">Ask: ${esc(c.ask)}</span></li>`).join("")}</ul>`,
    );
  if (s.prompt && ["guided", "fresh"].includes(s.id))
    parts.push(`<p><b>${s.id === "fresh" ? "Question" : "Big question"}:</b> ${esc(s.prompt)}</p>`);
  if (s.frame) parts.push(`<p><b>Frame:</b> ${blanks(s.frame)}</p>`);
  if (s.activity)
    parts.push(
      `<p><b>${esc(s.activity.title)}.</b> ${esc(s.activity.mission)}</p>${s.play ? `<a class="cp-btn cp-btn--solid" href="${esc(s.play)}" target="_blank" rel="noopener">Play this activity</a>` : ""}`,
    );
  if (s.rubric)
    parts.push(
      `<ul class="cp-plain">${Object.entries(s.rubric)
        .map(([k, v]) => `<li><b>${esc(k[0].toUpperCase() + k.slice(1))}:</b> ${esc(v)}</li>`)
        .join("")}</ul>`,
    );
  if (s.watch)
    parts.push(
      `<p class="cp-muted"><b>Watch for:</b> ${esc(s.watch.issue)} <b>Try:</b> ${esc(s.watch.fix)}</p>`,
    );
  if (s.id === "revise" && s.frames)
    parts.push(
      `<ul class="cp-plain">${s.frames.map((f) => `<li>${blanks(f)}</li>`).join("")}</ul>`,
    );
  if (s.link)
    parts.push(
      `<button type="button" class="cp-btn" data-cp-tab="${esc(s.link.tab)}">${esc(s.link.label)}</button>`,
    );
  return parts.join("");
}

export function reteachView(st, detail, before) {
  st.before = before;
  const plan = buildReteachPlan(detail, { pathway: st.pathway, wida: st.level, before });
  return `
    <div class="cp-reteach">
      <fieldset class="cp-field"><legend>What are you seeing?</legend>
        <div class="cp-chiprow">${PATHWAYS.map((p) => `<button type="button" class="cp-chip" data-cp-pathway="${p.id}" aria-pressed="${p.id === st.pathway}">${esc(p.label)}<small>${esc(p.hint)}</small></button>`).join("")}</div>
      </fieldset>
      <p class="cp-note">${st.pathway === "content" ? "A content difficulty is about the idea. The words may be fine. This plan re-teaches the concept." : "A language difficulty is about the words. The idea may be fine. This plan builds the language to say it. The task stays just as rigorous."} Same exit ticket either way. About ${plan.minutes} minutes.</p>
      <ol class="cp-steps">${plan.steps.map((s) => `<li class="cp-step"><div class="cp-step-head"><b>${esc(s.title)}</b><span>${esc(s.minutes)} min</span></div>${stepBody(s)}</li>`).join("")}</ol>
      <button type="button" class="cp-btn cp-btn--solid" data-cp-print="reteach">Print this plan</button>
    </div>`;
}

/** Returns true when the click was a reteach action that needs a redraw. */
export function bindReteach(st, btn) {
  if (btn.dataset.cpPathway) {
    st.pathway = btn.dataset.cpPathway;
    return true;
  }
  if (btn.dataset.cpPrint === "reteach") {
    const before = null;
    openPrint(
      reteachDoc(buildReteachPlan(st.ctx.detail, { pathway: st.pathway, wida: st.level, before })),
      `reteach-${st.ctx.detail.unit.id}.html`,
    );
    return false;
  }
  return false;
}
