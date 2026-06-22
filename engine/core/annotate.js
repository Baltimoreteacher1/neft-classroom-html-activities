// Word-problem annotation — lets students mark up the text of a word problem the
// way they would on paper: highlight key numbers, underline the question, bold a
// keyword. Active reading is a core math-literacy move (UIFR), so every rendered
// word problem (`[data-annotate="word-problem"]`) gets a small, kid-friendly
// toolbar above it.
//
// Marks are spans wrapped around the live selection, so they survive textarea
// edits elsewhere on the page. They are intentionally in-session only (a fresh
// render starts clean) — this keeps the feature zero-risk for the lesson's
// save/resume state, which only persists typed responses.

const MARK_CLASSES = ["annot-hl", "annot-ul", "annot-bd"];
const MARK_SELECTOR = MARK_CLASSES.map((c) => `.${c}`).join(",");

// Wrap the current selection (when it lies inside `host`) in a styled span.
function applyMark(host, className) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  // Ignore selections that stray outside this problem's text.
  if (!host.contains(range.commonAncestorContainer)) return false;

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
  host.querySelectorAll(MARK_SELECTOR).forEach((span) => {
    const parent = span.parentNode;
    if (!parent) return;
    while (span.firstChild) parent.insertBefore(span.firstChild, span);
    parent.removeChild(span);
    parent.normalize();
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
  tip.textContent = "Select text, then tap:";
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
    // mousedown (not click) so the text selection isn't lost to focus change.
    btn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      applyMark(host, cls);
    });
    bar.append(btn);
  });

  const erase = document.createElement("button");
  erase.type = "button";
  erase.className = "annot-btn annot-erase";
  erase.textContent = "✕ Clear";
  erase.addEventListener("mousedown", (e) => {
    e.preventDefault();
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
  const scope = root && root.querySelectorAll ? root : document;
  scope.querySelectorAll('[data-annotate="word-problem"]').forEach((el) => attach(el));
}
