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
  if (!currentRangeIn(armed.host)) return;
  const { host, className } = armed;
  applyMark(host, className);
  setArmed(null);
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

// Build the toolbar for one annotatable text block.
function buildToolbar(host) {
  const bar = document.createElement("div");
  bar.className = "annot-bar";
  bar.setAttribute("role", "toolbar");
  bar.setAttribute("aria-label", "Mark up the problem");

  const tip = document.createElement("span");
  tip.className = "annot-tip";
  tip.textContent = "Select text then tap — or tap a tool, then select the text:";
  bar.append(tip);

  const buttons = [
    { cls: "annot-hl", label: "🖍️ Highlight" },
    { cls: "annot-ul", label: "U͟ Underline" },
    { cls: "annot-bd", label: "𝗕 Bold" },
  ];
  buttons.forEach(({ cls, label }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "annot-btn";
    btn.textContent = label;
    // aria-pressed advertises the armed state to assistive tech (toggle button).
    btn.setAttribute("aria-pressed", "false");
    // mousedown (not click) so a live text selection isn't lost to focus change.
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      // Direction (a): text already selected → apply immediately.
      if (currentRangeIn(host)) {
        applyMark(host, cls);
        setArmed(null);
        return;
      }
      // Direction (b): nothing selected → arm this tool (or disarm if re-tapped).
      if (armed && armed.host === host && armed.className === cls) {
        setArmed(null);
      } else {
        setArmed({ host, className: cls, btn });
      }
    });
    bar.append(btn);
  });

  const erase = document.createElement("button");
  erase.type = "button";
  erase.className = "annot-btn annot-erase";
  erase.textContent = "✕ Clear";
  erase.addEventListener("mousedown", (e) => {
    e.preventDefault();
    setArmed(null);
    clearMarks(host);
  });
  bar.append(erase);

  return bar;
}

// Attach a toolbar to a single text element.
function attach(host) {
  if (!host || host.dataset.annotateReady === "1") return;
  host.dataset.annotateReady = "1";
  host.classList.add("annotatable");
  const bar = buildToolbar(host);
  host.parentNode.insertBefore(bar, host);
}

// Public: enable annotation on every word-problem text block inside `root`.
export function enableWordProblemAnnotation(root = document) {
  ensureGlobalListeners();
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('[data-annotate="word-problem"]').forEach((el) => attach(el));
}
