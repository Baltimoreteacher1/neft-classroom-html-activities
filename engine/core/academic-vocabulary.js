// academic-vocabulary.js — the Academic Vocabulary card, plus the two Notice &
// Wonder presentation decisions that sit next to it.
//
// These live in their own module rather than inside lesson-renderer.js so they
// can be unit-tested. lesson-renderer.js reaches `@engine/styles` through its
// import chain, a Vite alias that plain node cannot resolve, so nothing in that
// file is importable from `npm test` — which is precisely how both regressions
// this module fixes shipped unnoticed:
//
//   1. `renderNoticeAndWonder` printed `noticeAndWonder.context` as a visible
//      paragraph directly above the image, telling students what to see before
//      they looked, and separately used that same `context` as the image's alt
//      text — leaving the authored, purpose-written `imageAlt` unread on all 84
//      core lessons.
//   2. The graded "Vocabulary" phase was removed in 2f5b382fd on the grounds
//      that the separate Vocab Explorer tab covered it. That removed the only
//      student-facing surface for `config.vocabulary` inside the lesson; the
//      data stayed in every config and kept feeding term underlining, glossary
//      popups and teacher mode, but nothing listed the words for the student.
//
// See tools/notice-wonder-vocab.test.mjs.

// Local HTML escape. lesson-renderer.js has its own identical helper; this
// module deliberately does not import it, because importing anything from that
// file would drag the un-importable style chain back in and make this module
// untestable again — the exact problem it exists to solve.
function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// ── Notice & Wonder: should a visible caption render, and what is it? ────────
//
// Default is NO visible caption: the whole point of Notice & Wonder is that the
// student derives the scene from the image. A lesson that genuinely needs a
// caption opts in with `showCaption: true` and may supply its own `caption`.
//
// The opt-in is an explicit flag rather than "render `caption` when present"
// because three configs (6-4 and its two small-group variants) already carry a
// dormant `caption` that restates the problem's numbers. Keying off presence
// alone would newly reveal the math on exactly the kind of lesson this fixes.
export function noticeWonderCaption(nw) {
  if (!nw || typeof nw !== "object") return null;
  if (nw.showCaption !== true) return null;
  const text = String(nw.caption || nw.context || "").trim();
  return text || null;
}

// ── Notice & Wonder: the image's accessible name ─────────────────────────────
//
// `imageAlt` is authored to describe what is DRAWN; `context` is the framing
// prose that used to double as both the visible caption and the alt text. They
// are written for different jobs, so the alt must prefer `imageAlt`.
//
// `context` remains a fallback rather than being dropped: a lesson that authors
// an image and no `imageAlt` is better served by a wordy accessible name than
// by an empty one. Notice & Wonder images are instructional content, never
// decorative, so this never returns "".
export function noticeWonderImageAlt(nw, fallbacks = {}) {
  const pick = (v) => {
    const s = v == null ? "" : String(v).trim();
    return s || null;
  };
  return (
    pick(nw && nw.imageAlt) ||
    pick(nw && nw.context) ||
    pick(fallbacks.caption) ||
    pick(fallbacks.title) ||
    "Notice and Wonder data display"
  );
}

// A vocabulary entry is renderable when it has both a word and a meaning. An
// entry missing either is skipped rather than rendered blank.
export function renderableVocabulary(config) {
  const list = config && Array.isArray(config.vocabulary) ? config.vocabulary : [];
  return list.filter((v) => v && String(v.term || "").trim() && String(v.definition || "").trim());
}

// ── The Academic Vocabulary card ────────────────────────────────────────────
//
// A reading surface, NOT the old graded phase: no scoring, no XP, no phase
// index, so save/resume and the 8-phase structure are untouched.
//
// Deliberately not modal-first — the term and its meaning are legible on the
// page in both languages, and the popup (picture + fuller explanation) is an
// enhancement on top. `opts.wirePopups` is injected by the caller rather than
// imported so this module stays testable; when it is absent the card still
// renders and reads correctly, it simply has no popup.
//
// STRICT no-op when the lesson authors no usable vocabulary.
export function renderAcademicVocabulary(host, config, opts = {}) {
  const vocab = renderableVocabulary(config);
  if (!host || !vocab.length) return null;

  const card = document.createElement("section");
  card.className = "card av-card";
  card.setAttribute("aria-labelledby", "av-title");

  // <dl> so the term→meaning relationship is conveyed structurally rather than
  // by layout alone, and each Spanish string carries lang="es" so a screen
  // reader switches voice instead of reading Spanish in an English one.
  const rows = vocab
    .map((v, i) => {
      const termEs = v.termEs ? `<span class="av-term-es" lang="es">${esc(v.termEs)}</span>` : "";
      const defEs = v.definitionEs
        ? `<span class="av-def-es" lang="es">${esc(v.definitionEs)}</span>`
        : "";
      return `
        <div class="av-item">
          <dt class="av-term">
            <button type="button" class="obj-term" data-term-idx="${i}" aria-haspopup="dialog"
                    title="Tap for a picture and a simple meaning">${esc(v.term)}</button>
            ${termEs}
          </dt>
          <dd class="av-def">${esc(v.definition)}${defEs}</dd>
        </div>`;
    })
    .join("");

  card.innerHTML = `
    <h3 class="av-title" id="av-title">📘 Academic Vocabulary <span class="av-title-es" lang="es">· Vocabulario académico</span></h3>
    <p class="av-hint">Tap a word for a picture and a simple meaning. <span lang="es">Toca una palabra para ver una imagen y su significado.</span></p>
    <dl class="av-list">${rows}</dl>`;

  // Same array the buttons were indexed against, so data-term-idx resolves.
  if (typeof opts.wirePopups === "function") opts.wirePopups(card, vocab);
  host.append(card);
  return card;
}
