// Toolbar state, kept apart from the DOM so it survives rerenders, saves with the session and is unit-testable.
// highlights: { [stimulusId]: [{ id, scope, start, end, color }] }   (offsets into the scope element's text)
// eliminated: { [itemId]: [optionId] }
export const ZOOM_LEVELS = Object.freeze([100, 125, 150, 200]);
export const HIGHLIGHT_COLORS = Object.freeze({
  yellow: { label: "Yellow", token: "--acc-highlight-yellow" },
  blue: { label: "Blue", token: "--acc-highlight-blue" },
  green: { label: "Green", token: "--acc-highlight-green" },
});

export const emptyToolState = () => ({ highlights: {}, eliminated: {}, marks: [] });

export function normalizeToolState(raw) {
  const s = emptyToolState();
  if (!raw || typeof raw !== "object") return s;
  for (const [k, list] of Object.entries(raw.highlights || {}))
    s.highlights[k] = (Array.isArray(list) ? list : []).filter((h) => h && Number.isInteger(h.start) && Number.isInteger(h.end) && h.end > h.start && h.color in HIGHLIGHT_COLORS && typeof h.scope === "string");
  for (const [k, list] of Object.entries(raw.eliminated || {})) s.eliminated[k] = Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
  return s;
}

let counter = 0;
const nextId = () => `hl-${Date.now().toString(36)}-${(counter++).toString(36)}`;

/** Add a highlight; any part of an existing highlight in the same scope that it covers is replaced. */
export function addHighlight(list, { scope, start, end, color }) {
  if (!(end > start) || !(color in HIGHLIGHT_COLORS)) return list;
  const out = [];
  for (const h of list) {
    if (h.scope !== scope || h.end <= start || h.start >= end) {
      out.push(h);
      continue;
    }
    if (h.start < start) out.push({ ...h, id: h.id, end: start });
    if (h.end > end) out.push({ ...h, id: nextId(), start: end });
  }
  out.push({ id: nextId(), scope, start, end, color });
  return out.sort((a, b) => (a.scope === b.scope ? a.start - b.start : a.scope < b.scope ? -1 : 1));
}

/** "Clear selected": remove every highlight that overlaps the selected span (or contains the caret). */
export function removeIntersecting(list, { scope, start, end }) {
  const hi = end > start ? end : start + 1;
  return list.filter((h) => !(h.scope === scope && h.start < hi && h.end > start));
}

export function toggleEliminated(state, itemId, optionId) {
  const cur = new Set(state.eliminated[itemId] || []);
  const eliminated = !cur.has(optionId);
  eliminated ? cur.add(optionId) : cur.delete(optionId);
  state.eliminated[itemId] = [...cur];
  return eliminated;
}
export const isEliminated = (state, itemId, optionId) => (state.eliminated[itemId] || []).includes(optionId);

/** Never let the eliminator hide the last remaining choice: a test taker must always have something to select. */
export const canEliminate = (state, item, optionId) => {
  const total = item.options?.length || 0;
  const gone = state.eliminated[item.id] || [];
  return gone.includes(optionId) || total - gone.length > 1;
};
