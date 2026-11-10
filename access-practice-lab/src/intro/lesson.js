// Featured Lesson (/start/lesson): Speak, Write, Improve in 10 minutes, anchored on one verified activity
// (FEATURED_LESSON.anchor in data.js; change that one field to feature another activity). Notice and Speak happen in the
// activity itself; Write, Improve and Share happen here, in two text boxes saved on this device. The only check is a plain
// word check for "because" and "for example": it cannot judge ideas, and the page says so.
import { html, icon, toHtml } from "../util.js";
import { DOWNLOADS, FEATURED_LESSON as L, ROUTES, USE_LESSON, absUrl, findActivityById } from "./data.js";
import { withReturn } from "./return-bar.js";
import { SAVED_NOTE, clearIntro, loadIntro, updateIntro } from "./state.js";
import { copyWithNote, introCrumbs, labHref } from "./ui.js";

const LEVELS = ["more", "some", "independent"];
const saved = () => loadIntro().lesson || {};
const save = (patch) => updateIntro("lesson", (x) => ({ ...x, ...patch }));

/** Word check only: a reason word and an example phrase. Never a judgment of meaning. */
export function checkResponse(text) {
  const t = String(text || "");
  return {
    words: (t.match(/[\p{L}\p{N}’']+/gu) || []).length,
    reason: /\b(because|since|so that)\b/i.test(t),
    example: /\b(for example|for instance|such as)\b/i.test(t),
  };
}

function cueHTML(draft, revised) {
  if (!draft.trim()) return html`<p class="in-note">Write your response first. Then press “Check for the cue.”</p>`;
  const c = checkResponse(revised || draft);
  return html`<ul class="in-checks" aria-live="polite">
    <li class="${c.reason ? "is-found" : ""}">${icon(c.reason ? "check" : "info")} Reason word (because): ${c.reason ? "found" : "not found yet"}</li>
    <li class="${c.example ? "is-found" : ""}">${icon(c.example ? "check" : "info")} Example phrase (For example): ${c.example ? "found" : "not found yet"}</li>
  </ul>
  <p class="fine">This check only looks for those words. It cannot tell whether your ideas are good, so read your response aloud too.</p>`;
}

function supportHTML(level) {
  const s = L.supports[level];
  return html`<div class="in-level" role="group" aria-label="Support choices">
    ${LEVELS.map((id) => html`<button type="button" class="in-seg" data-lesson-level="${id}" aria-pressed="${id === level}">${L.supports[id].name}</button>`)}
  </div>
  <ul>${s.items.map((i) => html`<li>${i}</li>`)}</ul>`;
}


function useLessonHTML(a) {
  const link = absUrl(USE_LESSON.studentRoute);
  return html`<section class="in-panel in-use" aria-labelledby="lsUse">
    <h2 id="lsUse">Use This Lesson</h2>
    <p class="fine">Everything here can go to students as is. The link opens the activity directly.</p>
    <div class="in-field"><label for="lsLink">Student activity link</label>
      <input id="lsLink" type="text" readonly value="${link}" />
      <p class="in-actions"><button type="button" class="btn btn-primary" data-lesson-copy-link>${icon("copy")}Copy Student Link</button>
      <a class="btn" href="${link}">Open ${a.name}${icon("external")}</a></p></div>
    <h3>Student directions</h3>
    <ol class="in-student-dir" data-lesson-directions>${USE_LESSON.studentDirections.map((d) => html`<li>${d}</li>`)}</ol>
    <p><button type="button" class="btn" data-lesson-copy-dir>${icon("copy")}Copy student directions</button></p>
    <dl class="in-facts">
      <dt>Materials</dt><dd>${USE_LESSON.materials.join("; ")}.</dd>
      <dt>Time</dt><dd>${USE_LESSON.time}.</dd>
      <dt>Language objective</dt><dd>${L.objective}</dd>
      <dt>Support options</dt><dd><ul>${Object.values(L.supports).map((x) => html`<li><strong>${x.name}:</strong> ${x.items[0]}</li>`)}</ul></dd>
      <dt>Quick check</dt><dd>${L.check.replace(/^Quick check: (.)/, (_, c) => c.toUpperCase())}</dd>
    </dl>
    <p class="fine" role="status" data-lesson-link-note></p>
    <p>No internet for the activity page? Print the backup: <a href="${DOWNLOADS.lessonBackup.pdf}">backup page (PDF)</a> · <a href="${DOWNLOADS.lessonBackup.docx}">editable (Word)</a>. It has the picture, the prompt, the directions and sample responses.</p>
  </section>`;
}

export async function render(ctx) {
  const st = saved();
  const level = LEVELS.includes(st.level) ? st.level : "more";
  const a = findActivityById(L.anchor);
  const tab = (n, step) => html`<h3>${n}. ${step.name} <span class="in-min">${step.minutes} min</span></h3>`;
  const [notice, speak, write, improve, share] = L.steps;
  return {
    title: `${L.label}: ${L.title}`,
    html: html`${introCrumbs(L.label)}
      <article class="in-page in-lesson" aria-labelledby="introTitle">
        <header class="in-head">
          <p class="eyebrow">${L.label} · ${L.minutes} minutes</p>
          <h1 id="introTitle" tabindex="-1">${L.title}</h1>
          <p class="in-lead"><strong>Language objective:</strong> ${L.objective}</p>
        </header>
        ${useLessonHTML(a)}
        <section class="in-panel in-prompt" aria-labelledby="lsPrompt">
          <h2 id="lsPrompt">The learner prompt</h2>
          <figure><img src="${L.picture.src}" alt="${L.picture.alt}" width="480" height="300" /><figcaption>${a.name}</figcaption></figure>
          <p class="in-quote">${L.prompt}</p>
          <p class="in-frame-line"><strong>Frame:</strong> ${L.frame}</p>
          <p><a class="btn btn-primary" href="${withReturn(labHref(a.route), "lesson")}">Open ${a.name}${icon("arrow-right")}</a></p>
          <p class="fine">Opens in this tab. It has a picture, a model student you can hear, and an optional recording. You can also use the picture and prompt here with a partner and skip the activity page.</p>
        </section>
        <ol class="in-lesson-steps">
          <li class="in-panel">${tab(1, notice)}<p><strong>You:</strong> ${notice.teacher}</p><p><strong>Students:</strong> ${notice.students}</p></li>
          <li class="in-panel">${tab(2, speak)}<p><strong>You:</strong> ${speak.teacher}</p><p><strong>Students:</strong> ${speak.students}</p></li>
          <li class="in-panel">${tab(3, write)}<p><strong>You:</strong> ${write.teacher}</p>
            <div class="in-field"><label for="lsDraft">Your written response</label><textarea id="lsDraft" rows="4" data-lesson-box="draft">${st.draft || ""}</textarea></div></li>
          <li class="in-panel">${tab(4, improve)}<p><strong>Feedback cue:</strong> ${L.cue}</p>
            <div class="in-field"><label for="lsRevised">Your revised response</label><textarea id="lsRevised" rows="4" data-lesson-box="revised">${st.revised ?? st.draft ?? ""}</textarea></div>
            <button type="button" class="btn" data-lesson-check>Check for the cue</button>
            <div data-lesson-cue>${cueHTML(st.draft || "", st.revised ?? st.draft ?? "")}</div></li>
          <li class="in-panel">${tab(5, share)}<p><strong>You:</strong> ${share.teacher}</p>
            <p class="in-actions"><button type="button" class="btn" data-lesson-copy>${icon("copy")}Copy both versions</button> <button type="button" class="btn" data-lesson-print>${icon("print")}Print</button></p>
            <p class="fine" role="status" data-lesson-note></p></li>
        </ol>
        <section class="in-panel" aria-labelledby="lsSupport"><h2 id="lsSupport">Choose a support level</h2>${supportHTML(level)}
          <p class="fine">Supports fade; the task stays the same. These are practical supports, not WIDA levels.</p></section>
        <details class="in-more"><summary>Example responses and quick check</summary>
          <p><strong>First response:</strong> ${L.sample.first}</p><p><strong>Improved response:</strong> ${L.sample.improved}</p><p>${L.sample.explanation}</p>
          <p>${L.check}</p><p><strong>Follow-up:</strong> ${L.followUp}</p></details>
        <details class="in-more"><summary>Teaching notes</summary><ul>${L.notes.map((n) => html`<li>${n}</li>`)}</ul></details>
        <nav class="in-nav" aria-label="Featured lesson links">
          <a class="btn ghost" href="${labHref(ROUTES.start)}">Back to Start Here</a>
          <a class="btn" href="${labHref(ROUTES.guide)}">Quick Guide</a>
        </nav>
        <footer class="in-foot"><p class="fine">${SAVED_NOTE}</p><button type="button" class="btn ghost small" data-lesson-clear>Clear my two boxes</button></footer>
      </article>`,
  };
}

function bothVersions() {
  const s = saved();
  return `First response:\n${s.draft || ""}\n\nRevised response:\n${s.revised ?? s.draft ?? ""}`;
}

export function onInput(e) {
  const box = e.target.closest?.("[data-lesson-box]");
  if (box) save({ [box.dataset.lessonBox]: box.value });
}

export function onClick(e, ctx) {
  const t = e.target;
  const level = t.closest?.("[data-lesson-level]");
  if (level) {
    save({ level: level.dataset.lessonLevel });
    ctx.rerender();
    return true;
  }
  if (t.closest?.("[data-lesson-copy-link]")) {
    copyWithNote(absUrl(USE_LESSON.studentRoute), document.querySelector("[data-lesson-link-note]"));
    return true;
  }
  if (t.closest?.("[data-lesson-copy-dir]")) {
    const text = USE_LESSON.studentDirections.map((d, i) => `${i + 1}. ${d}`).join("\n");
    copyWithNote(`${text}\n\n${absUrl(USE_LESSON.studentRoute)}`, document.querySelector("[data-lesson-link-note]"));
    return true;
  }
  if (t.closest?.("[data-lesson-check]")) {
    const s = saved();
    document.querySelector("[data-lesson-cue]").innerHTML = toHtml(cueHTML(s.draft || "", s.revised ?? s.draft ?? ""));
    return true;
  }
  if (t.closest?.("[data-lesson-print]")) {
    window.print();
    return true;
  }
  if (t.closest?.("[data-lesson-copy]")) {
    copyWithNote(bothVersions(), document.querySelector("[data-lesson-note]"));
    return true;
  }
  if (t.closest?.("[data-lesson-clear]")) {
    clearIntro("lesson");
    ctx.rerender();
    return true;
  }
  return false;
}
