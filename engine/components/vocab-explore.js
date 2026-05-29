// vocab-explore.js — "Explore" affordance for the vocab Word Wall.
// Routes each term to an interactive explorer:
//   - geometry terms -> 3D shape explorer (shape-3d.js)
//   - everything else -> generic flip + "say it" card
// Dependency-free vanilla JS + the existing design-system CSS tokens.
//
// Public API:
//   exploreLabel(term)          -> "🔍 Explore" affordance button (focusable, ARIA)
//   openExplorer(host, term)    -> renders inline panel into host; returns { close }
//   resolveExplorer(term)       -> { kind: "shape3d"|"flip", shape? }

import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";
import { renderShape3D } from "./shape-3d.js";

// ── Routing ───────────────────────────────────────────────────────────────
// Keyword -> 3D solid. Order matters (most specific first).
const SHAPE_KEYWORDS = [
  [/triangular\s*prism/, "triangular-prism"],
  [/rectangular\s*prism/, "rectangular-prism"],
  [/square\s*pyramid|pyramid|apex/, "square-pyramid"],
  [/\bcube\b|cubic/, "cube"],
  // generic geometry vocab -> show a representative solid to explore the concept
  [/\bprism\b/, "rectangular-prism"],
  [/\bnet\b|surface\s*area|lateral/, "rectangular-prism"],
  [/\bface\b|\bedge\b|\bvert(ex|ices)\b/, "rectangular-prism"],
  [/\bvolume\b|three-dimensional|3d\b/, "rectangular-prism"],
];

const VALID_SHAPES = new Set([
  "cube",
  "rectangular-prism",
  "triangular-prism",
  "square-pyramid",
]);

export function resolveExplorer(term) {
  // 1) Explicit per-term override: term.explore
  //    "flip" | "shape3d:rectangular-prism" | "shape3d" (defaults to cube)
  const override =
    term && typeof term.explore === "string" ? term.explore.trim() : "";
  if (override) {
    if (override === "flip") return { kind: "flip" };
    if (override.startsWith("shape3d")) {
      const shape = override.split(":")[1]?.trim();
      return {
        kind: "shape3d",
        shape: VALID_SHAPES.has(shape) ? shape : "cube",
      };
    }
  }

  // 2) Keyword routing on term + definition.
  const text = `${term?.term || ""} ${term?.definition || ""}`.toLowerCase();
  for (const [re, shape] of SHAPE_KEYWORDS) {
    if (re.test(text)) return { kind: "shape3d", shape };
  }

  // 3) Default: generic flip / say-it card.
  return { kind: "flip" };
}

// ── Explore affordance button ───────────────────────────────────────────────
export function exploreLabel(term) {
  const route = resolveExplorer(term);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "vocab-explore-trigger";
  const verb = route.kind === "shape3d" ? "Spin the 3D shape" : "Flip & hear";
  btn.setAttribute("aria-label", `Explore ${term.term}: ${verb}`);
  btn.innerHTML = `
    <span aria-hidden="true" class="vocab-explore-icon">${route.kind === "shape3d" ? "🧊" : "🔍"}</span>
    <span class="vocab-explore-text">Explore</span>
    <span aria-hidden="true" class="vocab-explore-hint">${verb}</span>`;
  btn.style.cssText = `
    width:100%; display:flex; align-items:center; gap:var(--sp-2);
    padding:10px 14px; min-height:44px; cursor:pointer;
    border:2px dashed var(--teal); border-radius:var(--radius-md);
    background:var(--teal-light); color:var(--navy);
    font-family:var(--font-display); font-weight:800; font-size:0.95rem;
    transition:transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), background var(--duration-fast);`;
  btn.addEventListener("mouseenter", () => {
    btn.style.transform = "translateY(-1px)";
    btn.style.boxShadow = "var(--shadow-md)";
    btn.style.background = "#fff";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "";
    btn.style.boxShadow = "";
    btn.style.background = "var(--teal-light)";
  });
  return btn;
}

// ── Explorer panel (inline) ──────────────────────────────────────────────────
// Renders into `host` (we clear and replace it). Returns { close } where close
// invokes the provided onClose callback after tearing down.
export function openExplorer(host, term, { onClose } = {}) {
  host.innerHTML = "";
  const route = resolveExplorer(term);

  const panel = document.createElement("div");
  panel.className = "vocab-explore-panel";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", `Explore ${term.term}`);
  panel.style.cssText = `
    animation:phaseIn 0.3s var(--ease-out) both;
    display:flex; flex-direction:column; gap:var(--sp-3);`;

  // Header with title + close.
  const head = document.createElement("div");
  head.style.cssText =
    "display:flex; align-items:center; justify-content:space-between; gap:var(--sp-2);";
  const title = document.createElement("div");
  title.style.cssText =
    "font-family:var(--font-display); font-weight:800; font-size:1.15rem; color:var(--navy);";
  title.textContent = term.term;
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn btn-secondary";
  closeBtn.style.cssText = "min-height:40px; padding:6px 14px;";
  closeBtn.setAttribute("aria-label", `Close explorer for ${term.term}`);
  closeBtn.innerHTML = "✕ Close";
  head.append(title, closeBtn);
  panel.append(head);

  let widget = null;
  if (route.kind === "shape3d") {
    widget = renderShape3D(panel, { shape: route.shape, label: term.term });
  } else {
    renderFlipCard(panel, term);
  }

  host.append(panel);

  function close() {
    if (widget && typeof widget.destroy === "function") widget.destroy();
    host.innerHTML = "";
    if (onClose) onClose();
  }
  closeBtn.addEventListener("click", close);
  // Move focus to the close button so keyboard users land inside the panel.
  closeBtn.focus({ preventScroll: true });

  return { close };
}

// ── Generic flip + say-it card ───────────────────────────────────────────────
function renderFlipCard(parent, term) {
  const stage = document.createElement("div");
  stage.style.cssText = "perspective:1000px;";

  const card = document.createElement("button");
  card.type = "button";
  card.className = "vocab-flip";
  card.setAttribute(
    "aria-label",
    `Flip card for ${term.term}. Front shows the word, back shows the meaning.`,
  );
  card.style.cssText = `
    position:relative; width:100%; min-height:220px; cursor:pointer;
    background:transparent; border:none; padding:0;
    transform-style:preserve-3d; transition:transform 0.55s var(--ease-spring);`;

  const faceBase = `
    position:absolute; inset:0; backface-visibility:hidden;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:var(--sp-2); padding:var(--sp-4); border-radius:var(--radius-md);
    border:1px solid var(--line);`;

  const front = document.createElement("div");
  front.style.cssText = faceBase + "background:var(--navy); color:#fff;";
  front.innerHTML = `
    <div style="font-family:var(--font-display); font-size:1.6rem; font-weight:800; text-align:center;">${escapeHtml(term.term)}</div>
    <div style="opacity:0.8; font-size:0.85rem;">Tap to flip ⤵</div>`;

  const back = document.createElement("div");
  back.style.cssText =
    faceBase + "background:#fff; transform:rotateY(180deg); text-align:center;";
  const img = document.createElement("img");
  img.src = resolveVocabImage(term.term);
  img.alt = vocabImageAlt(term.term, term.definition);
  img.loading = "lazy";
  img.style.cssText =
    "width:120px; aspect-ratio:4/3; object-fit:contain; border-radius:var(--radius-sm);";
  const def = document.createElement("div");
  def.style.cssText = "font-size:0.95rem; line-height:1.5; color:var(--ink);";
  def.textContent = term.definition;
  back.append(img, def);

  card.append(front, back);
  stage.append(card);
  parent.append(stage);

  let flipped = false;
  function flip() {
    flipped = !flipped;
    card.style.transform = flipped ? "rotateY(180deg)" : "";
    card.setAttribute("aria-pressed", String(flipped));
  }
  card.addEventListener("click", flip);

  // "Use it in a sentence" line.
  const sentence = buildSentence(term);
  const sentRow = document.createElement("p");
  sentRow.style.cssText = `
    margin:0; padding:var(--sp-3); background:var(--cream);
    border-radius:var(--radius-md); border:1px dashed var(--teal-light);
    font-size:0.95rem; line-height:1.5; color:var(--ink);`;
  sentRow.innerHTML = `<strong style="color:var(--teal);">Use it:</strong> ${escapeHtml(sentence)}`;
  parent.append(sentRow);

  // "Say it" button (speechSynthesis, guarded).
  const sayRow = document.createElement("div");
  sayRow.style.cssText = "display:flex; gap:var(--sp-2); flex-wrap:wrap;";
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const sayBtn = document.createElement("button");
  sayBtn.type = "button";
  sayBtn.className = "btn btn-amber";
  sayBtn.style.cssText = "min-height:44px;";
  if (supported) {
    sayBtn.innerHTML = "🔊 Say it";
    sayBtn.setAttribute(
      "aria-label",
      `Hear the word ${term.term} spoken aloud`,
    );
    sayBtn.addEventListener("click", () => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(term.term);
        u.rate = 0.9;
        window.speechSynthesis.speak(u);
      } catch (_) {
        /* no-op if speech fails */
      }
    });
  } else {
    sayBtn.innerHTML = "🔊 Say it";
    sayBtn.disabled = true;
    sayBtn.title = "Audio is not available in this browser.";
    sayBtn.setAttribute(
      "aria-label",
      "Say it — audio not available in this browser",
    );
  }
  sayRow.append(sayBtn);
  parent.append(sayRow);
}

// Build a simple, newcomer-friendly example sentence.
function buildSentence(term) {
  const word = term.term;
  const lower = word.charAt(0).toLowerCase() + word.slice(1);
  if (term.visual) {
    return `Example: "${stripTrailingPeriod(term.visual)}."`;
  }
  return `Example: "I can use ${lower} when I solve a math problem."`;
}

function stripTrailingPeriod(s) {
  return String(s || "").replace(/\.\s*$/, "");
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default openExplorer;
