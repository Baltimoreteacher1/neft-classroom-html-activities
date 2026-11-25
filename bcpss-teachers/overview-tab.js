// BCPSS Teacher Studio — Unit Overview tab (v2).
// One calm screen: what students will do, the mentor sentence, the frames, the words, the exit ticket.
// Teacher text is kept to short watch-outs. Everything is read from detail.studio (authored content).

import { DRAFT_NOTICE } from "../shared/bcpss-provenance.js";

const LEVEL_NAMES = { "1_2": "Starter", "3_4": "Core", "5_6": "Stretch" };

const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

const frameHtml = (frame) =>
  esc(frame).replace(/\[([^\]]+)\]/g, '<span class="ov-blank">$1</span>');

function provenanceBadge(p) {
  if (!p || p.state === "reviewed") return "";
  return `<p class="ov-provenance" data-provenance="${esc(p.state)}" role="note"><strong>${esc(p.label)}.</strong> ${esc(DRAFT_NOTICE)}</p>`;
}

function canDoSection(studio) {
  return `
    <section class="ov-cando" aria-label="Learning goals">
      <article class="ov-goal ov-goal--content">
        <h3>Content goal</h3>
        <p>${esc(studio.can_do.content)}</p>
      </article>
      <article class="ov-goal ov-goal--language">
        <h3>Language goal</h3>
        <p>${esc(studio.can_do.language)}</p>
      </article>
    </section>`;
}

function mentorSection(studio) {
  const { mentor } = studio;
  const chunks = mentor.chunks
    .map(
      (c, i) =>
        `<button type="button" class="ov-chunk ov-chunk--${esc(c.tone)}" data-ov-chunk="${i}" aria-pressed="false">${esc(c.text)}</button>`,
    )
    .join(" ");
  return `
    <section class="ov-mentor" aria-labelledby="ovMentorH">
      <div class="ov-head">
        <h3 id="ovMentorH">Mentor sentence</h3>
        <button type="button" class="ov-ghost" data-ov-speak="${esc(mentor.text)}">Read aloud</button>
      </div>
      <p class="ov-sentence" data-ov-sentence>${chunks}</p>
      <div class="ov-chunk-detail" data-ov-detail aria-live="polite">
        <p class="ov-gist"><strong>In plain words:</strong> ${esc(mentor.gist)}</p>
        <p class="ov-hint">Tap a color to see what that part does.</p>
      </div>
    </section>`;
}

function framesSection(studio, wida) {
  const key = `l${wida}`;
  const frames = studio.frames[key] || studio.frames.l3_4;
  return `
    <section class="ov-frames" aria-labelledby="ovFramesH">
      <div class="ov-head">
        <h3 id="ovFramesH">Sentence frames <span class="ov-level">${esc(LEVEL_NAMES[wida] || "Core")}</span></h3>
      </div>
      <ul class="ov-frame-list">${frames.map((f) => `<li>${frameHtml(f)}</li>`).join("")}</ul>
      <p class="ov-connectors"><span>Connector words</span>${studio.connectors.map((c) => `<b>${esc(c)}</b>`).join("")}</p>
    </section>`;
}

function vocabSection(studio) {
  const chips = studio.vocab
    .map(
      (v) =>
        `<li><b>${v.icon ? `<span aria-hidden="true">${esc(v.icon)}</span> ` : ""}${esc(v.term)}</b><span>${esc(v.def)}</span></li>`,
    )
    .join("");
  return `
    <section class="ov-vocab" aria-labelledby="ovVocabH">
      <div class="ov-head">
        <h3 id="ovVocabH">Words students will own</h3>
        <button type="button" class="ov-ghost" data-ov-tab="vocab">Open Visual Vocabulary</button>
      </div>
      <ul class="ov-vocab-list">${chips}</ul>
    </section>`;
}

function exitSection(studio) {
  const e = studio.exit_ticket;
  return `
    <section class="ov-exit" aria-labelledby="ovExitH">
      <h3 id="ovExitH">Exit ticket</h3>
      <p class="ov-exit-prompt">${esc(e.prompt)}</p>
      <p class="ov-exit-frame">${frameHtml(e.frame)}</p>
      <dl class="ov-rubric">
        <div><dt>Emerging</dt><dd>${esc(e.rubric.emerging)}</dd></div>
        <div><dt>Developing</dt><dd>${esc(e.rubric.developing)}</dd></div>
        <div><dt>Proficient</dt><dd>${esc(e.rubric.proficient)}</dd></div>
      </dl>
      <details class="ov-model"><summary>See a model answer</summary><p>${esc(e.model)}</p></details>
    </section>`;
}

function watchSection(studio) {
  const cards = studio.watchouts
    .map(
      (w) =>
        `<article><h4>${esc(w.group)}</h4><p>${esc(w.issue)}</p><p class="ov-fix"><b>Try:</b> ${esc(w.fix)}</p></article>`,
    )
    .join("");
  return `
    <section class="ov-watch" aria-labelledby="ovWatchH">
      <h3 id="ovWatchH">Watch for</h3>
      <div class="ov-watch-grid">${cards}
        <article class="ov-misconception"><h4>Common slip</h4><p>${esc(studio.misconception.pattern)}</p><p class="ov-fix"><b>Try:</b> ${esc(studio.misconception.redirect)}</p></article>
      </div>
    </section>`;
}

function transferSection(transfers) {
  if (!transfers?.length) return "";
  const items = transfers
    .slice(0, 4)
    .map(
      (t) =>
        `<li><button type="button" data-ov-unit="${esc(t.unit_id)}"><span>${esc(t.subject)} · Unit ${esc(t.unit_number)}</span><b>${esc(t.unit_title)}</b></button></li>`,
    )
    .join("");
  return `
    <section class="ov-transfer" aria-labelledby="ovTransferH">
      <h3 id="ovTransferH">Same language move in other subjects</h3>
      <ul class="ov-transfer-list">${items}</ul>
    </section>`;
}

export function renderOverview(panel, { detail, wida }) {
  const studio = detail?.studio;
  if (!studio) {
    panel.innerHTML = `<div class="bh-empty">This unit's Language Studio is being finished. Check back soon.</div>`;
    return;
  }
  panel.innerHTML = `<div class="ov">
    ${provenanceBadge(detail.provenance)}
    ${canDoSection(studio)}
    ${mentorSection(studio)}
    ${framesSection(studio, wida)}
    ${vocabSection(studio)}
    ${exitSection(studio)}
    ${watchSection(studio)}
    ${transferSection(detail.cross_subject_transfers)}
  </div>`;
  const root = panel.querySelector(".ov");
  const chunkDetail = root.querySelector("[data-ov-detail]");
  root.addEventListener("click", (event) => {
    const chunk = event.target.closest("[data-ov-chunk]");
    if (chunk) {
      const c = studio.mentor.chunks[Number(chunk.dataset.ovChunk)];
      for (const b of root.querySelectorAll("[data-ov-chunk]"))
        b.setAttribute("aria-pressed", String(b === chunk));
      chunkDetail.innerHTML = `<p class="ov-role ov-role--${esc(c.tone)}"><b>${esc(c.role)}</b></p><p>${esc(c.ask)}</p>`;
      return;
    }
    const speak = event.target.closest("[data-ov-speak]");
    if (speak && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(speak.dataset.ovSpeak));
    }
  });
}
