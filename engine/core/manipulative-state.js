//
// Every interactive visual in the lesson has been amnesiac: a student who spends
// four minutes building a tape diagram in Explore, then moves to Practice and
// comes back, finds it reset to the authored defaults. The model is treated as a
// demonstration that happens to be draggable, when the thing the student made is
// the actual evidence of their thinking.
//
// HOW MUCH IS KEPT, honestly: this persists the state a manipulative exposes
// through the DOM — the value of every input, select, and textarea inside the
// host, plus anything a component chooses to publish on a `[data-iv-state]`
// attribute. That covers the slider-and-field manipulatives (number lines, tape
// diagrams, the ratio/percent/power builders, histogram and box-plot builders,
// stat towers, step solver), which is most of the registry. It does NOT capture
// state that lives only inside a canvas or a WebGL scene — a rotated 3-D solid
// still comes back at its default angle. Rather than pretend otherwise, a
// component that wants exact restoration can publish `getState()`/`setState()`
// on the handle it already returns from the registry, and that path is preferred
// whenever it exists.
//
// The restore path dispatches real `input`/`change` events so components
// recompute their display from the restored values rather than needing to know
// this module exists. A re-entrancy flag stops those synthetic events from being
// saved back as fresh edits.

const SAVE_DEBOUNCE_MS = 400;

/**
 * A key that survives re-renders.
 *
 * Deliberately NOT the DOM order alone: phases re-render, and an ordinal-only key
 * would hand the tape diagram's saved state to whatever visual happened to mount
 * first next time. Keying on the visual KIND plus its ordinal among hosts of that
 * same kind means a lesson can hold three number lines and each keeps its own
 * work, while a lesson edit that adds an unrelated visual does not shuffle them.
 */
export function manipulativeKey(host, ordinalByKind) {
  const kind = host?.dataset?.visual || "unknown";
  return `manip_${kind}_${ordinalByKind}`;
}

/** Read the restorable state out of a mounted host. */
export function captureState(host) {
  if (!host) return null;
  // A component that publishes its own state knows better than the DOM scan.
  const own = host.__ivHandle?.getState?.();
  if (own && typeof own === "object") return { own };

  const fields = {};
  let found = 0;
  host.querySelectorAll("input, select, textarea").forEach((el, i) => {
    // Name by the most stable identifier available, falling back to position.
    const key = el.name || el.id || el.dataset.ivField || `f${i}`;
    if (el.type === "checkbox" || el.type === "radio") {
      fields[key] = el.checked ? "1" : "0";
    } else {
      fields[key] = el.value;
    }
    found += 1;
  });

  const published = host.getAttribute("data-iv-state");
  if (published) fields.__published = published;

  return found || published ? { fields } : null;
}

/** Push a captured snapshot back into a mounted host. */
export function restoreState(host, snapshot) {
  if (!host || !snapshot) return false;

  if (snapshot.own && host.__ivHandle?.setState) {
    try {
      host.__ivHandle.setState(snapshot.own);
      return true;
    } catch {
      return false;
    }
  }
  if (!snapshot.fields) return false;

  /** @type {HTMLElement} */ (host).dataset.ivRestoring = "1";
  try {
    const controls = host.querySelectorAll("input, select, textarea");
    controls.forEach((el, i) => {
      const key = el.name || el.id || el.dataset.ivField || `f${i}`;
      if (!(key in snapshot.fields)) return;
      const value = snapshot.fields[key];
      if (el.type === "checkbox" || el.type === "radio") {
        el.checked = value === "1";
      } else {
        el.value = value;
      }
      // Components listen for one or the other; firing both is what makes this
      // work without every component knowing about persistence.
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    if (snapshot.fields.__published != null) {
      host.setAttribute("data-iv-state", snapshot.fields.__published);
    }
    return true;
  } finally {
    delete (/** @type {HTMLElement} */ (host).dataset.ivRestoring);
  }
}

/**
 * Wire persistence for every mounted visual inside `root`.
 *
 * Idempotent per host. Safe to call before components have finished their async
 * mount: restoration is retried on the first interaction as well as on a short
 * delay, because a host whose fields do not exist yet cannot be filled.
 *
 * @param {Element} root
 * @param {{ state?: any, phaseId?: string }} [opts]
 */
export function attachManipulativePersistence(root, { state, phaseId } = {}) {
  if (!root || !state?.saveResponse || !state?.getResponse) return 0;
  const hosts =
    typeof root.querySelectorAll === "function"
      ? [...root.querySelectorAll(".interactive-visual[data-visual]")]
      : [];
  if (root.matches?.(".interactive-visual[data-visual]")) hosts.unshift(root);

  const seenByKind = new Map();
  let wired = 0;

  for (const host of hosts) {
    const kind = /** @type {HTMLElement} */ (host).dataset.visual;
    const ordinal = seenByKind.get(kind) || 0;
    seenByKind.set(kind, ordinal + 1);
    if (/** @type {HTMLElement} */ (host).dataset.ivPersist) continue;
    /** @type {HTMLElement} */ (host).dataset.ivPersist = "1";
    wired += 1;

    const key = manipulativeKey(host, ordinal);

    const save = () => {
      if (/** @type {HTMLElement} */ (host).dataset.ivRestoring) return;
      const snapshot = captureState(host);
      if (snapshot) state.saveResponse(phaseId, key, snapshot);
    };

    let timer = null;
    const debouncedSave = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(save, SAVE_DEBOUNCE_MS);
    };

    host.addEventListener("input", debouncedSave);
    host.addEventListener("change", debouncedSave);
    // Drag-driven manipulatives commit on pointer release without ever firing an
    // input event, so the model would save on nothing a student actually did.
    host.addEventListener("pointerup", debouncedSave);

    const saved = state.getResponse(phaseId, key);
    if (saved) {
      // The registry mounts asynchronously. Try now (cheap, usually a miss),
      // then once the microtask queue and one frame have drained.
      if (!restoreState(host, saved)) {
        setTimeout(() => restoreState(host, saved), 0);
        setTimeout(() => restoreState(host, saved), 250);
      }
    }
  }

  return wired;
}

export default attachManipulativePersistence;
