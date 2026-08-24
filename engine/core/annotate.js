// Word-problem annotation — lets students mark up the text of a word problem the
// way they would on paper: highlight key numbers, underline the question, bold a
// keyword. Active reading is a core math-literacy move (UIFR), so every rendered
// word problem (`[data-annotate="word-problem"]`) gets a small, kid-friendly
// toolbar above it.
//
// The toolbar works BOTH directions:
//   (a) Select text FIRST, then tap a tool → the mark applies to the selection.
//   (b) Tap a tool to ARM it (it lights up), then select/drag over text → the
//       mark applies when the selection finishes. Tapping the armed tool again
//       (or tapping a different tool) disarms/rearms.
// Re-applying the same tool to text that already carries that mark TOGGLES it off.
//
// Marks are spans wrapped around the live selection, so they survive textarea
// edits elsewhere on the page. They are intentionally in-session only (a fresh
// render starts clean) — this keeps the feature zero-risk for the lesson's
// save/resume state, which only persists typed responses.

const MARK_CLASSES = ["annot-hl", "annot-ul", "annot-bd"];
const MARK_SELECTOR = MARK_CLASSES.map((c) => `.${c}`).join(",");

// The currently-armed tool ({ host, className, btn }) or null. Set when a student
// taps a tool with no active selection ("tool first"); consumed when they then
// select text inside the same problem.
let armed = null;
let listenersReady = false;

// Return the live selection range if it is non-collapsed AND lies inside `host`.
function currentRangeIn(host) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!host.contains(range.commonAncestorContainer)) return null;
  return { sel, range };
}

// If the whole selection already sits inside a single mark of `className`,
// return that mark element (so a repeat tap can TOGGLE it off). Otherwise null.
function enclosingMark(range, className) {
  let node = range.commonAncestorContainer;
  if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
  return node && node.closest ? node.closest(`.${className}`) : null;
}

// Unwrap a single mark span, restoring its plain text in place.
function unwrap(span) {
  const parent = span.parentNode;
  if (!parent) return;
  while (span.firstChild) parent.insertBefore(span.firstChild, span);
  parent.removeChild(span);
  parent.normalize();
}

// Apply — or toggle off — a mark on the current selection within `host`.
function applyMark(host, className) {
  const found = currentRangeIn(host);
  if (!found) return false;
  const { sel, range } = found;

  // Toggle off: the selection already lives inside a mark of this kind → remove.
  const existing = enclosingMark(range, className);
  if (existing) {
    unwrap(existing);
    sel.removeAllRanges();
    return true;
  }

  const wrapper = document.createElement("span");
  wrapper.className = className;
  try {
    range.surroundContents(wrapper);
  } catch {
    // surroundContents throws when the range partially crosses an element
    // boundary (e.g. inline math). Fall back to extract → wrap → reinsert.
    try {
      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);
    } catch {
      return false;
    }
  }
  sel.removeAllRanges();
  return true;
}

// Unwrap every mark inside `host`, restoring the plain text.
function clearMarks(host) {
  host.querySelectorAll(MARK_SELECTOR).forEach((span) => unwrap(span));
}

// Reflect the armed tool visually + for assistive tech (aria-pressed), clearing
// any previously-armed button first.
function setArmed(next) {
  if (armed && armed.btn) {
    armed.btn.setAttribute("aria-pressed", "false");
    armed.btn.style.outline = "";
    armed.btn.style.outlineOffset = "";
  }
  armed = next;
  if (armed && armed.btn) {
    armed.btn.setAttribute("aria-pressed", "true");
    armed.btn.style.outline = "3px solid var(--teal, #2a9d8f)";
    armed.btn.style.outlineOffset = "2px";
  }
}

// When a tool is armed and the student finishes a selection inside that host,
// apply the armed mark and disarm.
function consumeArmed() {
  if (!armed) return;
  // The selection must be lesson text — not a drag that ended inside the dock
  // itself, and not inside a form control.
  if (!lessonRange()) return;
  const { host, className } = armed;
  applyMark(host, className);
  setArmed(null);
  setDockStatus("Mark added. Select more, or tap a tool again.");
}

// Attach the shared, document-level selection-complete listeners exactly once.
// They drive direction (b): apply the armed tool when the student releases a
// drag / keyboard selection.
function ensureGlobalListeners() {
  if (listenersReady) return;
  listenersReady = true;
  document.addEventListener("mouseup", consumeArmed);
  document.addEventListener("touchend", consumeArmed);
  document.addEventListener("keyup", (e) => {
    // Keyboard selection (Shift+Arrows / Shift+End …) — apply once released.
    if (armed && e.shiftKey === false) consumeArmed();
  });
}

/* ── The always-on dock ─────────────────────────────────────────────────────
   One small control, fixed to the edge of the viewport, present in EVERY phase
   of the lesson for students and teachers alike.

   It replaces the per-problem toolbars this module used to insert above each
   stem. Those only existed where a problem stem happened to render, so Launch,
   Learn It, Connect and Reflect — all of them text a student marks up — had no
   tools at all, and where they did appear it was a tip sentence plus four
   buttons above every single problem. One dock is both smaller and available
   everywhere, which is the whole point of a mark-up tool. */

const TOOLS = [
  { cls: "annot-hl", icon: "🖍️", label: "Highlight" },
  { cls: "annot-ul", icon: "U̲", label: "Underline" },
  { cls: "annot-bd", icon: "B", label: "Bold" },
];

let dock = null;

/** The region a mark may be made in: the lesson itself, never the chrome. */
function annotationRoot() {
  return document.getElementById("app") || document.body;
}

/** The live selection if it lies inside the lesson content and is not inside
 *  the dock or a form control (marking up a button's label helps nobody). */
function lessonRange() {
  const root = annotationRoot();
  if (!root) return null;
  const found = currentRangeIn(root);
  if (!found) return null;
  let node = found.range.commonAncestorContainer;
  if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
  if (!node || !node.closest) return null;
  if (node.closest(".annot-dock, input, textarea, select, button")) return null;
  return found;
}

function setDockStatus(text) {
  const status = dock && dock.querySelector(".annot-dock-status");
  if (status) status.textContent = text;
}

function buildDock() {
  const host = document.createElement("div");
  host.className = "annot-dock";
  host.dataset.open = "false";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "annot-dock-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Mark up this page — highlight, underline, bold");
  toggle.innerHTML = '<span aria-hidden="true">🖍️</span>';
  host.append(toggle);

  const panel = document.createElement("div");
  panel.className = "annot-dock-panel";
  panel.setAttribute("role", "toolbar");
  panel.setAttribute("aria-label", "Mark up this page");
  host.append(panel);

  for (const { cls, icon, label } of TOOLS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `annot-btn annot-dock-btn ${cls}-btn`;
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", `${label} selected words`);
    btn.innerHTML = `<span class="annot-dock-icon" aria-hidden="true">${icon}</span><span class="annot-dock-label">${label}</span>`;
    // mousedown, not click: a click would move focus first and drop the live
    // text selection the student just made.
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      const root = annotationRoot();
      if (lessonRange()) {
        applyMark(root, cls);
        setArmed(null);
        setDockStatus(`${label} added.`);
        return;
      }
      if (armed && armed.className === cls) {
        setArmed(null);
        setDockStatus("Select words in the lesson, then tap a tool.");
      } else {
        setArmed({ host: root, className: cls, btn });
        setDockStatus(`${label} is on — now select the words.`);
      }
    });
    panel.append(btn);
  }

  const erase = document.createElement("button");
  erase.type = "button";
  erase.className = "annot-btn annot-dock-btn annot-erase";
  erase.setAttribute("aria-label", "Clear all mark-up on this page");
  erase.innerHTML =
    '<span class="annot-dock-icon" aria-hidden="true">✕</span><span class="annot-dock-label">Clear</span>';
  erase.addEventListener("mousedown", (e) => {
    e.preventDefault();
    setArmed(null);
    clearMarks(annotationRoot());
    setDockStatus("Mark-up cleared.");
  });
  panel.append(erase);

  const status = document.createElement("span");
  status.className = "annot-dock-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Select words in the lesson, then tap a tool.";
  panel.append(status);

  toggle.addEventListener("click", () => {
    const open = host.dataset.open === "true";
    host.dataset.open = open ? "false" : "true";
    toggle.setAttribute("aria-expanded", open ? "false" : "true");
    if (open) setArmed(null);
  });

  return host;
}

/** Mount the dock once. Idempotent, so every render path may call it. */
function ensureDock() {
  if (dock && dock.isConnected) return dock;
  if (typeof document === "undefined" || !document.body) return null;
  const existing = document.querySelector(".annot-dock");
  if (existing) {
    dock = existing;
    return dock;
  }
  dock = buildDock();
  document.body.append(dock);
  return dock;
}

// Mark a text block as annotatable. The dock does the marking now, so this only
// records that the block is student text (the text cursor is the affordance).
function attach(host) {
  if (!host || host.dataset.annotateReady === "1") return;
  host.dataset.annotateReady = "1";
  host.classList.add("annotatable");
}

// Public: enable annotation on every word-problem text block inside `root`.
/** @param {Document|HTMLElement} [root] */
export function enableWordProblemAnnotation(root = document) {
  ensureGlobalListeners();
  ensureDock();
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll(ANNOTATABLE).forEach((el) => attach(el));
}

// What counts as annotatable. `data-annotate="word-problem"` is the explicit
// opt-in, but every rendered problem stem is text a student may need to mark up
// and only some renderers set the attribute — so the stem classes count too
// (the same set plain-language.js rewrites).
const ANNOTATABLE = '[data-annotate="word-problem"], .problem-stem, .sp-stem-text';

// Attach a toolbar to `node` (and any annotatable descendants) if it qualifies.
function attachWithin(node) {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) return;
  if (node.matches?.(ANNOTATABLE)) attach(node);
  if (node.querySelectorAll) node.querySelectorAll(ANNOTATABLE).forEach((el) => attach(el));
}

let observerReady = false;

// Public: enable annotation for the current AND all future word-problem blocks
// inside `root`. Lesson phases render lazily and adaptive practice regenerates
// problems on the fly, so a one-time scan can't cover every text-based problem.
// A single MutationObserver watches the subtree and wires up any stem marked
// `data-annotate="word-problem"` the moment it mounts — so highlight/underline/
// bold is available on EVERY text problem, whenever and however it appears.
export function observeWordProblemAnnotation(root = document.body) {
  ensureGlobalListeners();
  ensureDock();
  const host = root && root.nodeType ? root : document.body;
  if (!host) return;
  enableWordProblemAnnotation(host);
  if (observerReady) return;
  observerReady = true;
  const mo = new MutationObserver((records) => {
    for (const rec of records) rec.addedNodes.forEach(attachWithin);
  });
  mo.observe(host, { childList: true, subtree: true });
}
