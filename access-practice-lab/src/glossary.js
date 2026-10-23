// Tap-a-word help: any word the lab has already taught somewhere (the vocabulary of every activity, with its
// kid-friendly definition and Spanish) can be opened in place while a learner reads a passage or a question.
//
// Rules this file keeps:
//  * Help is a support. It is only offered in supported mode, and opening one counts as opened help, so an
//    "on my own" result can never be contaminated (the caller records it).
//  * Glossed words are plain spans, never nested buttons (sentences are already role=button). Keyboard and
//    screen-reader users get the same help from the "Word help" list, which holds a real button per word.
//  * First occurrence of each word only, at most MAX per text, so a passage never turns into a wall of underlines.
import { html, toHtml } from "./util.js";

export const MAX_GLOSSED = 12;
const MIN_LENGTH = 4;

const matchers = new WeakMap();

function entriesOf(glossary) {
  if (!matchers.has(glossary)) {
    const list = [...(glossary?.terms || [])]
      .filter((t) => t.term && t.term.length >= MIN_LENGTH && t.def)
      .sort((a, b) => b.term.length - a.term.length || a.term.localeCompare(b.term));
    const byTerm = new Map(list.map((t) => [t.term, t]));
    const regexes = list.map((t) => {
      const body = t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]+");
      return [t, new RegExp(`(?<![\\p{L}\\p{N}])${body}(?:s|es)?(?![\\p{L}\\p{N}])`, "giu")];
    });
    matchers.set(glossary, { byTerm, regexes });
  }
  return matchers.get(glossary);
}

/** Glossary terms in `text`: longest first, no overlaps, first occurrence only, skipping `seen`. */
export function glossSpans(text, glossary, { seen = new Set(), limit = MAX_GLOSSED } = {}) {
  if (!glossary || !text) return [];
  const taken = [];
  for (const [entry, re] of entriesOf(glossary).regexes) {
    if (taken.length + seen.size >= limit) break;
    if (seen.has(entry.term)) continue;
    // The first occurrence that is not inside a longer phrase already glossed ("water" in "water cycle" is not it).
    for (const m of text.matchAll(re)) {
      const start = m.index;
      const end = start + m[0].length;
      if (taken.some((s) => start < s.end && end > s.start)) continue;
      taken.push({ term: entry.term, start, end });
      break;
    }
  }
  return taken.sort((a, b) => a.start - b.start);
}

/** `text` as html with the glossed words wrapped; `seen` collects the terms used so a caller can span sentences. */
export function glossInline(text, glossary, seen = new Set()) {
  const spans = glossSpans(text, glossary, { seen });
  if (!spans.length) return html`${text}`;
  const parts = [];
  let at = 0;
  for (const s of spans) {
    parts.push(html`${text.slice(at, s.start)}`);
    parts.push(
      html`<span class="gloss-word" data-gloss="${s.term}">${text.slice(s.start, s.end)}</span>`,
    );
    seen.add(s.term);
    at = s.end;
  }
  parts.push(html`${text.slice(at)}`);
  return parts;
}

/** Terms present in the given texts, for the keyboard-reachable "Word help" list. */
export function glossList(texts, glossary) {
  const seen = new Set();
  for (const t of texts) glossSpans(t, glossary, { seen }).forEach((s) => seen.add(s.term));
  return [...seen].map((term) => entriesOf(glossary).byTerm.get(term)).filter(Boolean);
}

export function glossListHTML(entries) {
  if (!entries.length) return "";
  return html`<details class="gloss-list">
    <summary>
      Word help · ${entries.length} word${entries.length === 1 ? "" : "s"} · Ayuda con palabras
    </summary>
    <ul>
      ${entries.map((e) => html`<li><button type="button" class="gloss-chip" data-gloss="${e.term}">${e.term}</button></li>`)}
    </ul>
  </details>`;
}

// ── the card ─────────────────────────────────────────────────────────────────
let card = null;
let opener = null;

export function closeGloss({ restoreFocus = true } = {}) {
  if (!card) return;
  card.remove();
  card = null;
  if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
  opener = null;
}

/** Open the card for `term`. Returns the entry shown, or null. */
export function openGloss(term, glossary, from) {
  const entry = entriesOf(glossary).byTerm.get(term);
  if (!entry) return null;
  closeGloss({ restoreFocus: false });
  opener = from || document.activeElement;
  card = document.createElement("section");
  card.id = "glossCard";
  card.className = "gloss-card";
  card.setAttribute("role", "dialog");
  card.setAttribute("aria-labelledby", "glossTerm");
  card.innerHTML = toHtml(
    html`<h2 id="glossTerm">
        <button
          type="button"
          class="say-word"
          data-say="${entry.term}"
          aria-label="Say ${entry.term}"
        >
          🔊
        </button>
        ${entry.term}
      </h2>
      <p>${entry.def}</p>
      ${
        entry.es
          ? html`<p lang="es">
              <button
                type="button"
                class="say-word"
                data-say-es="${entry.es}"
                aria-label="Escuchar ${entry.es}"
              >
                🔊
              </button>
              <strong>${entry.es}</strong>${entry.esDef ? html`: ${entry.esDef}` : ""}
            </p>`
          : ""
      }
      <button type="button" class="btn small" data-gloss-close>Close · Cerrar</button>`,
  );
  document.body.append(card);
  card.querySelector("[data-gloss-close]")?.focus({ preventScroll: true });
  return entry;
}

let mounted = false;

/** Close-button, Escape and route-change handling for the card. Called once by the app at start-up. */
export function mountGloss() {
  if (mounted) return;
  mounted = true;
  document.addEventListener("click", (e) => {
    if (e.target.closest?.("[data-gloss-close]")) closeGloss();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && card) {
      e.preventDefault();
      closeGloss();
    }
  });
  window.addEventListener("popstate", () => closeGloss({ restoreFocus: false }));
}
