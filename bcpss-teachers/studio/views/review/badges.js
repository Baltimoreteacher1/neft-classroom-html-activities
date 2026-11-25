// Provenance badges (Draft / In review / Reviewed) and the per-viewer "Reviewed units only" toggle.
// State comes from GET /api/review/summary, which carries aggregate states only. If it cannot be reached the
// cards simply show no badge and nothing is hidden: an unknown state is never treated as a draft.
import { h } from "../../core/dom.js";

export const REVIEWED_ONLY_KEY = "ewl_review_reviewed_only";
const LABEL = { draft: "Draft", in_review: "In review", reviewed: "Reviewed", retired: "Retired" };
const TIP = {
  draft: "No human reviewer has checked this yet.",
  in_review: "A human review has started, or the content changed since it was approved.",
  reviewed: "A named human reviewer approved every required check on the current content.",
  retired: "Retired from use.",
};
const TTL_MS = 60_000;

let cssLoaded = false;
export function ensureReviewCss() {
  if (cssLoaded || typeof document === "undefined") return;
  cssLoaded = true;
  if (!document.querySelector("link[data-st-rv-css]")) {
    document.head.append(h("link", { rel: "stylesheet", href: new URL("./review.css", import.meta.url).href, "data-st-rv-css": "1" }));
  }
}

export function reviewedOnly() {
  try {
    return globalThis.localStorage.getItem(REVIEWED_ONLY_KEY) === "1";
  } catch {
    return false;
  }
}

export function setReviewedOnly(on) {
  try {
    globalThis.localStorage.setItem(REVIEWED_ONLY_KEY, on ? "1" : "0");
  } catch {
    /* storage blocked: the choice lasts until the page closes */
  }
}

/** The badge element for one state. Text carries the meaning; colour is secondary. */
export function badge(state, { detail = "" } = {}) {
  ensureReviewCss();
  if (!LABEL[state]) return null;
  return h("span", { class: "st-rv-badge", "data-state": state, title: [TIP[state], detail].filter(Boolean).join(" ") }, LABEL[state]);
}

const cache = new Map();
async function getJson(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  const value = fetch(url, { headers: { Accept: "application/json" } })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cache.set(url, { at: Date.now(), value });
  const out = await value;
  if (!out) cache.delete(url);
  return out;
}

/** { unitId: state } for every unit, or null when the summary is unavailable. */
export async function loadUnitStates() {
  return (await getJson("/api/review/summary"))?.units ?? null;
}

/** { state, counts, blocks } for one unit, or null. */
export async function loadUnitSummary(unitId) {
  const out = await getJson(`/api/review/summary?unit=${encodeURIComponent(unitId)}`);
  return out?.state ? out : null;
}

/** Units to show: only reviewed ones when the toggle is on and states are known. Pure. */
export function visibleUnits(units, states, only) {
  if (!only || !states) return units;
  return units.filter((u) => states[u.id] === "reviewed");
}

/** The toggle control. `onChange(on)` runs after the choice is saved. */
export function reviewedOnlyToggle(onChange) {
  ensureReviewCss();
  const box = h("input", { type: "checkbox", id: "st-rv-only", class: "st-rv-check" });
  box.checked = reviewedOnly();
  box.addEventListener("change", () => {
    setReviewedOnly(box.checked);
    onChange(box.checked);
  });
  return h(
    "p",
    { class: "st-rv-toggle" },
    box,
    h("label", { for: "st-rv-only" }, "Reviewed units only"),
    h("span", { class: "st-rv-hint" }, " Hides units no human has finished reviewing."),
  );
}
