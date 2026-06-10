// vocab-explore.js — Active, exploratory "Explore" experience for the vocab
// Word Wall. Instead of a passive flip-card, each term opens a guided
// sense-making loop where the student DOES something and gets feedback:
//
//   Step 1  Predict → Reveal      (activate prior knowledge)
//   Step 2  Example vs Non-example (instant feedback + one-line why)  [if data]
//   Step 3  Use-in-context cloze   (pick/fill the correct sentence)   [if data]
//   3D-shape terms                 task-driven shape-3d explorer
//   End     "You explored: [term]" confirmation
//
// All term/config strings are escaped or set via textContent (no XSS).
// Fully bilingual: shows English + Spanish term/definition when the optional
// `termEs` / `definitionEs` fields are present (English-only otherwise), plus a
// guarded 🔊 "Say it" that speaks en-US and a separate es-ES.
//
// Bilingual UX choice: English shown prominently with Spanish stacked beneath
// in a muted/italic style (no toggle) so newcomers see both at once.
//
// Public API (unchanged signatures):
//   exploreLabel(term)                 -> affordance button
//   openExplorer(host, term, {onClose})-> renders inline panel; returns { close }
//   resolveExplorer(term)              -> { kind: "shape3d"|"sensemaking", shape? }

import { resolveVocabImage, vocabImageAlt } from "../core/vocab-images.js";
import { renderShape3D } from "./shape-3d.js";
import {
  escapeHtml,
  buildSayItRow,
  bilingualTermEl,
  buildPredictReveal,
  buildExampleSort,
  buildUseInContext,
  buildConfirmation,
} from "./vocab-explore-tasks.js";

// ── Inject-once scoped polish ─────────────────────────────────────────────
// Additive, classroom-appropriate motion + depth for the Explore trigger and
// explorer panel. Uses only existing design tokens. EVERY animation/transition
// is disabled under prefers-reduced-motion (the reduce block at the bottom is
// the single gate). Injected once per document; idempotent and behavior-safe.
const EXPLORE_STYLE_ID = "vocab-explore-polish";
function ensureExploreStyles() {
  if (typeof document === "undefined") return;
  if (document.getElementById(EXPLORE_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = EXPLORE_STYLE_ID;
  style.textContent = `
    /* Explore trigger: hover/focus depth lift (token-driven). */
    .vocab-explore-trigger {
      transition: transform var(--duration-fast) var(--ease-out),
                  box-shadow var(--duration-fast) var(--ease-out),
                  background var(--duration-fast);
    }
    .vocab-explore-trigger:hover,
    .vocab-explore-trigger:focus-visible {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      background: #fff;
    }
    .vocab-explore-trigger:active {
      transform: translateY(0);
      box-shadow: var(--shadow-sm, var(--shadow-md));
    }
    /* Explorer panel: gentle reveal entrance. */
    @keyframes vocabExplorePanelIn {
      from { opacity: 0; transform: translateY(10px) scale(0.99); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .vocab-explore-panel {
      animation: vocabExplorePanelIn 0.3s var(--ease-out) both;
    }
    /* Mobile-friendly panel width: full-bleed, comfortable touch padding. */
    @media (max-width: 640px) {
      .vocab-explore-panel {
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
      }
    }
    /* Accessibility gate: disable all added motion under reduced-motion. */
    @media (prefers-reduced-motion: reduce) {
      .vocab-explore-trigger {
        transition: none;
      }
      .vocab-explore-trigger:hover,
      .vocab-explore-trigger:focus-visible,
      .vocab-explore-trigger:active {
        transform: none;
      }
      .vocab-explore-panel {
        animation: none;
      }
    }`;
  (document.head || document.documentElement).appendChild(style);
}

// ── Routing ───────────────────────────────────────────────────────────────
// Keyword -> 3D solid. Order matters (most specific first).
const SHAPE_KEYWORDS = [
  [/triangular\s*prism/, "triangular-prism"],
  [/rectangular\s*prism/, "rectangular-prism"],
  [/square\s*pyramid|pyramid|apex/, "square-pyramid"],
  [/\bcube\b|cubic/, "cube"],
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
  //    "sensemaking" | "flip" (legacy alias) | "shape3d:rectangular-prism" | "shape3d"
  const override =
    term && typeof term.explore === "string" ? term.explore.trim() : "";
  if (override) {
    if (override === "flip" || override === "sensemaking")
      return { kind: "sensemaking" };
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

  // 3) Default: active sense-making micro-loop.
  return { kind: "sensemaking" };
}

// ── Explore affordance button ───────────────────────────────────────────────
export function exploreLabel(term) {
  ensureExploreStyles();
  const route = resolveExplorer(term);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "vocab-explore-trigger";
  const verb =
    route.kind === "shape3d"
      ? "Build & count the 3D shape"
      : "Predict, sort, and use the word";
  btn.setAttribute("aria-label", `Explore ${term.term}: ${verb}`);
  btn.innerHTML = `
    <span aria-hidden="true" class="vocab-explore-icon">${route.kind === "shape3d" ? "🧊" : "🧠"}</span>
    <span class="vocab-explore-text">Explore</span>
    <span aria-hidden="true" class="vocab-explore-hint">${escapeHtml(verb)}</span>`;
  btn.style.cssText = `
    width:100%; display:flex; align-items:center; gap:var(--sp-2);
    padding:10px 14px; min-height:44px; cursor:pointer;
    border:2px dashed var(--teal); border-radius:var(--radius-md);
    background:var(--teal-light); color:var(--navy);
    font-family:var(--font-display); font-weight:800; font-size:0.95rem;
    transition:transform var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out), background var(--duration-fast);`;
  // Hover/focus depth is handled by the inject-once .vocab-explore-trigger
  // rules so it can be gated under prefers-reduced-motion (see ensureExploreStyles).
  return btn;
}

// ── Explorer panel (inline) ──────────────────────────────────────────────────
// Renders into `host` (cleared/replaced). Returns { close }.
export function openExplorer(host, term, { onClose, siblings } = {}) {
  ensureExploreStyles();
  host.innerHTML = "";
  const route = resolveExplorer(term);

  const panel = document.createElement("div");
  panel.className = "vocab-explore-panel";
  panel.setAttribute("role", "region");
  panel.setAttribute("aria-label", `Explore ${term.term}`);
  // Entrance animation + mobile width come from the inject-once
  // .vocab-explore-panel rules (gated under prefers-reduced-motion).
  panel.style.cssText = `
    display:flex; flex-direction:column; gap:var(--sp-3);`;

  // Header: bilingual title + Say-it + close.
  const head = document.createElement("div");
  head.style.cssText =
    "display:flex; align-items:flex-start; justify-content:space-between; gap:var(--sp-2); flex-wrap:wrap;";
  head.append(bilingualTermEl(term));
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn btn-secondary";
  closeBtn.style.cssText = "min-height:40px; padding:6px 14px;";
  closeBtn.setAttribute("aria-label", `Close explorer for ${term.term}`);
  closeBtn.innerHTML = "✕ Close";
  head.append(closeBtn);
  panel.append(head);

  // Bilingual "Say it" (EN + ES if Spanish present).
  panel.append(buildSayItRow({ en: term.term, es: term.termEs }));

  // Steps container.
  const steps = document.createElement("div");
  steps.style.cssText = "display:flex; flex-direction:column; gap:var(--sp-3);";
  panel.append(steps);

  let widget = null;
  if (route.kind === "shape3d") {
    const shapeHost = document.createElement("div");
    steps.append(shapeHost);
    widget = renderShape3D(shapeHost, {
      shape: route.shape,
      label: term.term,
      taskDriven: true,
    });
    // After the 3D tasks, still reinforce meaning + confirmation.
    steps.append(makeRevealCard(term));
    steps.append(buildConfirmation(term));
  } else {
    buildSenseMakingLoop(steps, term, siblings);
  }

  host.append(panel);

  // ── Focus trap ─────────────────────────────────────────────────────────
  // Keep keyboard focus inside the explorer panel while it is open. Tab /
  // Shift+Tab cycle through the panel's focusable controls; Escape closes.
  // Listener is bound on the panel and removed in close() — additive, with no
  // effect on mouse or non-keyboard interaction.
  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function focusableEls() {
    return Array.prototype.filter.call(
      panel.querySelectorAll(FOCUSABLE),
      (el) =>
        el.offsetWidth > 0 ||
        el.offsetHeight > 0 ||
        el === document.activeElement,
    );
  }
  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const els = focusableEls();
    if (els.length === 0) {
      e.preventDefault();
      return;
    }
    const first = els[0];
    const last = els[els.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || !panel.contains(active)) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      }
    } else if (active === last || !panel.contains(active)) {
      e.preventDefault();
      first.focus({ preventScroll: true });
    }
  }
  panel.addEventListener("keydown", onKeydown);

  function close() {
    panel.removeEventListener("keydown", onKeydown);
    if (widget && typeof widget.destroy === "function") widget.destroy();
    host.innerHTML = "";
    if (onClose) onClose();
  }
  closeBtn.addEventListener("click", close);
  closeBtn.focus({ preventScroll: true });

  return { close };
}

// A compact "here's the meaning" card (bilingual) used after the 3D explorer.
function makeRevealCard(term) {
  const card = document.createElement("div");
  card.style.cssText = `
    padding:var(--sp-3); background:var(--teal-light); border-radius:var(--radius-md);`;
  const h = document.createElement("div");
  h.style.cssText =
    "font-family:var(--font-display); font-weight:800; font-size:0.95rem; color:var(--navy); margin-bottom:4px;";
  h.textContent = "What it means";
  card.append(h);
  const en = document.createElement("p");
  en.style.cssText =
    "margin:0; font-size:0.95rem; line-height:1.6; color:var(--ink);";
  en.textContent = term.definition || "";
  card.append(en);
  if (term.definitionEs) {
    const es = document.createElement("p");
    es.lang = "es";
    es.style.cssText =
      "margin:6px 0 0; font-style:italic; color:var(--muted); border-left:3px solid var(--teal); padding-left:8px;";
    es.textContent = term.definitionEs;
    card.append(es);
  }
  return card;
}

// Build the generic, non-3D sense-making loop. Steps that lack config data are
// gracefully skipped, but Predict→Reveal always runs (uses definition + image).
function buildSenseMakingLoop(steps, term, siblings) {
  // Provide sibling definitions to the predict step for plausible distractors.
  const enriched = Object.assign({}, term, {
    __siblings: Array.isArray(siblings) ? siblings : [],
  });

  const img = document.createElement("img");
  img.src = resolveVocabImage(term.term);
  img.alt = vocabImageAlt(term.term, term.definition);
  img.loading = "lazy";

  const noop = () => {};

  steps.append(buildPredictReveal(enriched, { imageEl: img, onAdvance: noop }));

  const s2 = buildExampleSort(enriched, { onAdvance: noop });
  if (s2) steps.append(s2);

  const s3 = buildUseInContext(enriched, { onAdvance: noop });
  if (s3) steps.append(s3);

  steps.append(buildConfirmation(term));
}

export default openExplorer;
