// Text engine for the Vocabulary Reading tab: turns a passage into tappable vocabulary terms,
// word spans for read-aloud highlighting, cloze blanks and evidence highlights.

import { termRegex } from "./bcpss-term-match.js";

export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

export const countWords = (text) =>
  (String(text).match(/[A-Za-z0-9][A-Za-z0-9'’-]*/g) || []).length;

/** Non-overlapping vocabulary ranges in `text`, longest terms first. */
export function findTermRanges(text, vocab) {
  const taken = [];
  const sorted = [...vocab].sort((a, b) => b.term.length - a.term.length);
  for (const v of sorted) {
    for (const m of text.matchAll(termRegex(v.term))) {
      const start = m.index;
      const end = start + m[0].length;
      if (!taken.some((r) => start < r.end && end > r.start))
        taken.push({ start, end, term: v.term });
    }
  }
  return taken.sort((a, b) => a.start - b.start);
}

function wordSpans(text, base, cls = "") {
  return text.split(/(\s+)/).reduce(
    (acc, tok) => {
      const start = base + acc.pos;
      acc.pos += tok.length;
      if (!tok) return acc;
      if (/^\s+$/.test(tok)) acc.html += tok.includes("\n\n") ? "</p><p>" : tok.replace(/\n/g, " ");
      else
        acc.html += `<span class="vr-w${cls}" data-s="${start}" data-e="${start + tok.length}">${esc(tok)}</span>`;
      return acc;
    },
    { html: "", pos: 0 },
  ).html;
}

/**
 * Render the passage as HTML.
 * mode "read": vocabulary terms are buttons (optionally with a Spanish gloss).
 * mode "cloze": vocabulary terms become <select> blanks listing the word bank.
 */
export function renderPassage(
  text,
  vocab,
  {
    mode = "read",
    gloss = false,
    highlightVocab = true,
    evidence = "",
    bank = [],
    answers = {},
    checked = false,
  } = {},
) {
  const ranges = findTermRanges(text, vocab);
  const evStart = evidence ? text.toLowerCase().indexOf(evidence.toLowerCase()) : -1;
  const evEnd = evStart > -1 ? evStart + evidence.length : -1;
  const glossOf = new Map(vocab.map((v) => [v.term, v.cognate]));
  let html = "<p>";
  let cursor = 0;
  const plain = (from, to) => {
    if (to <= from) return;
    // Split at evidence boundaries so highlighted words carry the evidence class.
    const cuts = [from, to];
    if (evStart > from && evStart < to) cuts.push(evStart);
    if (evEnd > from && evEnd < to) cuts.push(evEnd);
    cuts.sort((a, b) => a - b);
    for (let i = 0; i < cuts.length - 1; i += 1) {
      const inEv = evStart > -1 && cuts[i] >= evStart && cuts[i + 1] <= evEnd;
      html += wordSpans(text.slice(cuts[i], cuts[i + 1]), cuts[i], inEv ? " vr-ev" : "");
    }
  };
  ranges.forEach((r, i) => {
    plain(cursor, r.start);
    const surface = text.slice(r.start, r.end);
    if (mode === "cloze") {
      const picked = answers[i] || "";
      const ok = checked ? picked.toLowerCase() === r.term.toLowerCase() : null;
      html += `<select class="vr-blank${ok === true ? " vr-right" : ok === false ? " vr-wrong" : ""}" data-vr-blank="${i}" data-answer="${esc(r.term)}" aria-label="Blank ${i + 1}"><option value="">choose…</option>${bank.map((b) => `<option value="${esc(b)}"${picked === b ? " selected" : ""}>${esc(b)}</option>`).join("")}</select>`;
    } else if (highlightVocab) {
      const g =
        gloss && glossOf.get(r.term)
          ? `<sup class="vr-gloss" lang="es">${esc(glossOf.get(r.term))}</sup>`
          : "";
      html += `<button type="button" class="vr-term" data-vr-term="${esc(r.term)}">${wordSpans(surface, r.start)}</button>${g}`;
    } else {
      html += wordSpans(surface, r.start);
    }
    cursor = r.end;
  });
  plain(cursor, text.length);
  return `${html}</p>`.replace(/<p><\/p>/g, "");
}

/** The sentence of `text` that contains the first use of `term`. */
export function sentenceWith(text, term) {
  const re = termRegex(term, "i");
  return (text.split(/(?<=[.!?])\s+/).find((s) => re.test(s)) || "").trim();
}

// ── Speech: whole-passage read-aloud with word highlighting, and echo reading ─────────────────

export function createReader(rootEl) {
  let timers = [];
  const clear = () => {
    for (const el of rootEl.querySelectorAll(".vr-now,.vr-sent"))
      el.classList.remove("vr-now", "vr-sent");
  };
  const mark = (selector, from, to, cls) => {
    for (const el of rootEl.querySelectorAll(selector)) {
      const s = Number(el.dataset.s);
      if (s >= from && s < to) el.classList.add(cls);
    }
  };
  const stop = () => {
    timers.forEach(clearTimeout);
    timers = [];
    try {
      window.speechSynthesis?.cancel();
    } catch {
      /* ignore */
    }
    clear();
  };
  const utter = (text, offset, rate, onEnd) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = rate;
    u.onboundary = (e) => {
      if (e.name && e.name !== "word") return;
      for (const el of rootEl.querySelectorAll(".vr-now")) el.classList.remove("vr-now");
      const at = offset + e.charIndex;
      for (const el of rootEl.querySelectorAll(".vr-w")) {
        if (Number(el.dataset.s) <= at && at < Number(el.dataset.e)) {
          el.classList.add("vr-now");
          break;
        }
      }
    };
    u.onend = onEnd;
    window.speechSynthesis.speak(u);
  };
  return {
    supported: "speechSynthesis" in window,
    stop,
    playAll(text, rate) {
      stop();
      utter(text, 0, rate, clear);
    },
    /** Echo reading: model one sentence, then pause so the student repeats it. */
    echo(text, rate, onDone) {
      stop();
      const sentences = [];
      for (const m of text.matchAll(/[^.!?]+[.!?]*/g))
        if (m[0].trim()) sentences.push({ s: m.index, t: m[0] });
      const next = (i) => {
        if (i >= sentences.length) {
          clear();
          onDone?.();
          return;
        }
        const { s, t } = sentences[i];
        clear();
        mark(".vr-w", s, s + t.length, "vr-sent");
        utter(t, s, rate, () =>
          timers.push(setTimeout(() => next(i + 1), Math.max(2200, countWords(t) * 650))),
        );
      };
      next(0);
    },
    speakWord(word, lang = "en-US") {
      if (!this.supported) return;
      const u = new SpeechSynthesisUtterance(word);
      u.lang = lang;
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    },
  };
}
