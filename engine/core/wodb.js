// wodb.js — resolve and mount the lesson's Which One Doesn't Belong opener.
//
// The set library (data/wodb-sets.json) is keyed by MCCRS standard and fetched
// at runtime, matching how small-group-standards.js reads the standards
// registry: the engine bundle stays small and a content-only edit to the library
// ships without rebuilding the engine.
//
// Resolution is deliberately narrow. A lesson gets a WODB when it authors one
// inline, or when its standard has a set. There is no generic fallback set,
// because a WODB that is not about today's mathematics is worse than none — it
// spends the eight minutes of the lesson where attention is cheapest on
// something unconnected, and teaches students that the opener is filler.

import { renderWhichOneDoesntBelong } from "../components/which-one-doesnt-belong.js";
import { isTeacherMode } from "./teacher-mode.js";

let libraryPromise = null;

/** Fetch (once) the shared set library. Resolves to {} if it cannot be read. */
export function loadWodbLibrary() {
  if (!libraryPromise) {
    libraryPromise = fetch("/data/wodb-sets.json", { credentials: "omit" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d && d.sets) || {})
      .catch(() => ({}));
  }
  return libraryPromise;
}

/**
 * The set for this lesson, or null.
 *
 * An inline `config.wodb` always wins: an author who wrote a set for THIS lesson
 * knows more than the standard-level library does.
 */
export function resolveWodbSet(config, library) {
  const inline = config?.wodb;
  if (inline && Array.isArray(inline.items) && inline.items.length === 4) return inline;
  const standard = config?.standard;
  if (!standard || !library) return null;
  const set = library[standard];
  if (set && Array.isArray(set.items) && set.items.length === 4) return set;
  return null;
}

/**
 * Mount the opener into `host`. Resolves to true when a set actually rendered,
 * so a caller can tell "no set for this standard" from "failed to load".
 *
 * The response is stored through the lesson's own state (phase-scoped response
 * keys), so a student who leaves and comes back finds their quadrant and their
 * written reason still there — the reason is the artifact worth keeping.
 */
export async function mountWodbOpener(host, config, state, phaseId) {
  if (!host) return false;
  const library = await loadWodbLibrary();
  const set = resolveWodbSet(config, library);
  if (!set) return false;

  const details = document.createElement("details");
  details.className = "card card-teal wodb-card";
  details.open = true;
  const summary = document.createElement("summary");
  summary.style.cssText = "font-weight:700; cursor:pointer; list-style:none;";
  summary.textContent = "🧩 Which One Doesn't Belong?";
  details.append(summary);

  const body = document.createElement("div");
  details.append(body);

  renderWhichOneDoesntBelong(body, {
    prompt: set.prompt,
    items: set.items,
    reasons: set.reasons,
    store: {
      get: () => state?.getResponse?.(phaseId, "wodb") || null,
      set: (v) => state?.saveResponse?.(phaseId, "wodb", v),
    },
    onPick: () => {
      // Participation, not performance — see which-one-doesnt-belong.js. This
      // is the only signal the opener emits, and it carries no correctness.
      try {
        window.NTtelemetry?.track?.("wodb_pick", {
          standard: config?.standard || "",
        });
      } catch {
        /* telemetry is best-effort */
      }
    },
  });

  // Facilitation note, gated the same way every other teacher affordance in the
  // renderer is: a runtime isTeacherMode() check rather than a CSS class, so the
  // text is never in the student's DOM at all.
  if (set.teacherNote && isTeacherMode()) {
    const note = document.createElement("p");
    note.className = "wodb-teacher-note no-print";
    note.style.cssText =
      "margin-top:var(--sp-3); padding:var(--sp-3); border-left:4px solid var(--amber,#d97706); font-size:0.9rem;";
    const strong = document.createElement("strong");
    strong.textContent = "Facilitation: ";
    note.append(strong, document.createTextNode(set.teacherNote));
    details.append(note);
  }

  host.append(details);
  return true;
}

export default mountWodbOpener;
