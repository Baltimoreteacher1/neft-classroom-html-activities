import {
  resolveVocabImage,
  vocabImageAlt,
} from "../../engine/core/vocab-images.js";

// A vocab gate shown before a 3D level. Each entry uses the contract:
//   { term, definition, emoji, image }
// `image` is preferred; if a level omits it, resolveVocabImage supplies a real
// SVG. `emoji` is only the FINAL fallback when no SVG resolves.

export function prepareVocabEntry(entry) {
  const term = (entry && entry.term) || "";
  const definition = (entry && entry.definition) || "";
  const emoji = (entry && entry.emoji) || "";
  let image = entry && entry.image ? entry.image : "";
  if (!image) {
    image = resolveVocabImage(term) || "";
  }
  return { term, definition, emoji, image };
}

export function prepareVocabEntries(entries) {
  return (entries || []).map(prepareVocabEntry);
}

// Builds the visual element for a gate card: a real SVG image when available,
// falling back to the emoji glyph only when no image resolved.
function buildVisual(entry) {
  const wrap = document.createElement("div");
  wrap.className = "vg-visual";
  if (entry.image) {
    const img = document.createElement("img");
    img.src = entry.image;
    img.alt = vocabImageAlt(entry.term, entry.definition);
    img.loading = "lazy";
    img.className = "vg-img";
    img.addEventListener("error", () => {
      // SVG failed to load — fall back to emoji glyph.
      img.remove();
      if (entry.emoji) wrap.append(buildEmoji(entry.emoji));
    });
    wrap.append(img);
  } else if (entry.emoji) {
    wrap.append(buildEmoji(entry.emoji));
  }
  return wrap;
}

function buildEmoji(glyph) {
  const span = document.createElement("span");
  span.className = "vg-emoji";
  span.setAttribute("role", "img");
  span.textContent = glyph;
  return span;
}

// Renders the gate into a container. onUnlock is called when the player
// confirms they have studied the terms. Returns the prepared entries.
export function renderVocabGate(container, { terms, onUnlock } = {}) {
  const entries = prepareVocabEntries(terms);

  const panel = document.createElement("div");
  panel.className = "vocab-gate";

  const heading = document.createElement("h2");
  heading.className = "vg-heading";
  heading.textContent = "Vocabulary Gate";
  panel.append(heading);

  const sub = document.createElement("p");
  sub.className = "vg-sub";
  sub.textContent = "Learn these words to unlock the level.";
  panel.append(sub);

  const grid = document.createElement("div");
  grid.className = "vg-grid";

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "vg-card";

    card.append(buildVisual(entry));

    const term = document.createElement("div");
    term.className = "vg-term";
    term.textContent = entry.term;
    card.append(term);

    const def = document.createElement("div");
    def.className = "vg-def";
    def.textContent = entry.definition;
    card.append(def);

    grid.append(card);
  });

  panel.append(grid);

  const btn = document.createElement("button");
  btn.className = "vg-unlock";
  btn.textContent = "Unlock level →";
  btn.addEventListener("click", () => {
    if (typeof onUnlock === "function") onUnlock(entries);
  });
  panel.append(btn);

  container.append(panel);
  return entries;
}

export default renderVocabGate;
