// DOM side of the highlighter: translate a Range to text offsets, wrap offsets in <mark>, and unwrap again.
// Offsets are into the scope element's text, so they survive rerenders. Wrapping only splits and wraps text nodes:
// no text is removed or rewritten, so screen-reader text, paragraph numbers and answer controls are untouched.
const textNodes = (root) => {
  const walker = root.ownerDocument.createTreeWalker(root, 4 /* SHOW_TEXT */);
  const out = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) out.push(n);
  return out;
};

export function offsetsInScope(scope, range) {
  if (!scope.contains(range.startContainer) || !scope.contains(range.endContainer)) return null;
  const pre = scope.ownerDocument.createRange();
  pre.selectNodeContents(scope);
  pre.setEnd(range.startContainer, range.startOffset);
  const start = pre.toString().length;
  return { start, end: start + range.toString().length };
}

export function unwrapMarks(root) {
  for (const mark of [...root.querySelectorAll("mark[data-acc-hl]")]) {
    const parent = mark.parentNode;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
    parent.normalize();
  }
}

export function wrapOffsets(scope, { start, end, color, id }) {
  let pos = 0;
  for (const node of textNodes(scope)) {
    const len = node.nodeValue.length;
    const from = Math.max(start, pos);
    const to = Math.min(end, pos + len);
    if (to > from) {
      let target = node;
      if (from > pos) target = target.splitText(from - pos);
      if (to - from < target.nodeValue.length) target.splitText(to - from);
      const mark = scope.ownerDocument.createElement("mark");
      mark.className = `acc-hl acc-hl-${color}`;
      mark.dataset.accHl = id;
      mark.dataset.color = color;
      target.parentNode.insertBefore(mark, target);
      mark.appendChild(target);
    }
    pos += len;
    if (pos >= end) break;
  }
}

/** Rebuild every highlight for `scopes` ({ scopeId: element }) from the stored list. Safe to call repeatedly. */
export function applyHighlights(scopes, list) {
  for (const el of Object.values(scopes)) unwrapMarks(el);
  for (const h of list) {
    const el = scopes[h.scope];
    if (el) wrapOffsets(el, h);
  }
}

/** True when the range sits entirely inside one highlightable scope and touches no form control. */
export function safeSelection(range, scopes) {
  if (!range || range.collapsed) return null;
  for (const [id, el] of Object.entries(scopes)) {
    if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) continue;
    const frag = range.cloneContents();
    if (frag.querySelector("input,textarea,select,button,audio,video")) return null;
    const o = offsetsInScope(el, range);
    return o && o.end > o.start ? { scope: id, ...o } : null;
  }
  return null;
}
