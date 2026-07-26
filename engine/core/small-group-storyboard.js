// Presentation-only storyboard layer for small-group lessons.
// Wires theme art + one-shot scene enters without changing content or flow.

import { renderThemeIllustration } from "./theme-illustrations.js";

const REDUCED =
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

/** Humanize a theme slug for scene chips / captions (e.g. space-station → Space Station). */
export function themeDisplayName(theme) {
  if (!theme || typeof theme !== "string") return "";
  return theme
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// Optional authored art slot. When a lesson config carries a real illustration
// (`{ src, alt, decorative }` or a bare src string), render it as a lazy <img>
// with a graceful fallback: if the asset is missing or fails to load, call
// `onFallback` (which mounts the existing code-drawn theme SVG / emoji), so the
// studio is "art-ready" with zero regression until real art is commissioned.
// See docs/small-group-art-brief.md for the asset spec.
export function mountAuthoredArt(host, art, onFallback) {
  const spec = typeof art === "string" ? { src: art } : art || {};
  const src = spec.src;
  if (!host || !src || typeof src !== "string") return false;
  const img = document.createElement("img");
  img.className = "sg-art-img";
  img.src = src;
  img.loading = "lazy";
  img.decoding = "async";
  // Decorative art (no meaningful alt) is hidden from assistive tech; art that
  // conveys the scene keeps a real alt so screen-reader users get the context.
  if (spec.decorative || !spec.alt) {
    img.alt = "";
    img.setAttribute("aria-hidden", "true");
  } else {
    img.alt = spec.alt;
  }
  img.addEventListener("error", () => {
    img.remove();
    try {
      onFallback?.();
    } catch {
      /* fallback is best-effort */
    }
  });
  host.appendChild(img);
  return true;
}

/** Mark a section for scene enter; CSS plays when `.is-scene-in` is added. */
export function markScene(section, name, { enterSelector } = {}) {
  if (!section) return section;
  section.setAttribute("data-sg-scene", name);
  if (enterSelector) {
    section.querySelectorAll(enterSelector).forEach((node) => node.classList.add("sg-scene-enter"));
  } else {
    section.classList.add("sg-scene-enter");
  }
  return section;
}

/** Mount theme SVG into a host; returns false if theme unknown / host missing. */
export function mountThemeArt(host, theme, caption, figure) {
  if (!host || !theme) return false;
  try {
    renderThemeIllustration(host, theme, caption || "", figure);
    return true;
  } catch {
    return false;
  }
}

/**
 * Observe `[data-sg-scene]` nodes and fire a one-shot `.is-scene-in`.
 * Reduced-motion users get the settled class immediately (no animation).
 */
export function installStoryboardScenes(root = document) {
  const nodes = [...(root.querySelectorAll?.("[data-sg-scene]") || [])];
  if (!nodes.length) return () => {};

  const reveal = (node) => {
    if (node.classList.contains("is-scene-in")) return;
    node.classList.add("is-scene-in");
  };

  if (REDUCED || typeof IntersectionObserver !== "function") {
    nodes.forEach(reveal);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.18 },
  );

  nodes.forEach((node) => {
    // Already in view on first paint (hero / top of page).
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85 && rect.bottom > 0) reveal(node);
    else observer.observe(node);
  });

  return () => observer.disconnect();
}
