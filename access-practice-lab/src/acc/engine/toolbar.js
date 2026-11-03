// ACCESS_Toolbar: the persistent assessment toolbar. Highlighter, line reader, magnifier, answer eliminator and
// mark-for-review, each doing real work on the live page:
//   Highlighter  native Selection/Range, three colours, wraps text nodes only (no text is removed), keyboard path via
//                "select with Shift+Arrows, then press a colour". Highlights are stored as offsets and re-applied after rerenders.
//   Line reader  two masks around a window; the window is a focusable slider. Masks are aria-hidden and pointer-transparent:
//                the text underneath stays in the DOM, in the accessibility tree and interactive.
//   Magnifier    100/125/150/200% by scaling the canvas root font size, so text REFLOWS (no CSS transform, nothing clips).
//   Eliminator   a per-choice toggle button; an eliminated choice stays a real, selectable control.
import { applyHighlights, safeSelection } from "./highlight-dom.js";
import { addHighlight, canEliminate, HIGHLIGHT_COLORS, isEliminated, removeIntersecting, toggleEliminated, ZOOM_LEVELS } from "./tool-state.js";

export const DEFAULT_PREFS = Object.freeze({ zoom: 100, lineReader: false, lineHeight: 64, linePos: 0.3, eliminator: false });

export class ACCESS_Toolbar {
  /**
   * @param {object} o
   * @param {HTMLElement} o.host        canvas root: receives data-zoom and --acc-zoom
   * @param {() => Record<string, HTMLElement>} o.getScopes  highlightable elements by scope id (paragraphs)
   * @param {() => HTMLElement|null} o.getLineHost  pane the line reader lives in
   * @param {object} o.state            tool state (highlights, eliminated) owned by the session
   * @param {object} [o.prefs]          saved preferences
   * @param {(prefs: object) => void} [o.onPrefs]
   * @param {() => void} [o.onState]
   * @param {(msg: string) => void} [o.announce]
   * @param {() => { marked: boolean, toggle: () => void } | null} [o.markControl]
   * @param {() => string} [o.stimulusKey]  id of the stimulus whose highlights are showing
   */
  constructor(o) {
    this.o = o;
    this.doc = o.host.ownerDocument;
    this.prefs = { ...DEFAULT_PREFS, ...(o.prefs || {}) };
    this.color = null; // active highlighter colour, or null
    this.pending = null; // last safe in-scope selection
    this.el = null;
    this.onSelection = () => this.captureSelection();
    // A press on the toolbar itself (Clear selected, a colour) is a command, never a new selection to highlight.
    this.onUp = (e) => !this.el?.contains(e.target) && this.applyPending(true);
    this.doc.addEventListener("selectionchange", this.onSelection);
    this.doc.addEventListener("pointerup", this.onUp);
    this.doc.addEventListener("keyup", this.onUp);
  }

  destroy() {
    this.doc.removeEventListener("selectionchange", this.onSelection);
    this.doc.removeEventListener("pointerup", this.onUp);
    this.doc.removeEventListener("keyup", this.onUp);
    this.lineEl?.remove();
    this.o.host.removeAttribute("data-zoom");
    this.o.host.style.removeProperty("--acc-zoom");
  }

  say(msg) {
    this.o.announce?.(msg);
  }
  savePrefs() {
    this.o.onPrefs?.({ ...this.prefs });
  }

  // ── rendering ─────────────────────────────────────────────────────────────
  render() {
    const doc = this.doc;
    const bar = doc.createElement("div");
    bar.className = "acc-toolbar";
    bar.setAttribute("role", "toolbar");
    bar.setAttribute("aria-label", "Assessment tools");
    bar.setAttribute("aria-controls", "accCanvas");
    const group = (label, cls = "") => {
      const g = doc.createElement("div");
      g.className = `acc-tool-group ${cls}`;
      g.setAttribute("role", "group");
      g.setAttribute("aria-label", label);
      bar.append(g);
      return g;
    };
    const btn = (parent, text, { pressed = null, cls = "", title = "", onClick, extra = {} }) => {
      const b = doc.createElement("button");
      b.type = "button";
      b.className = `acc-btn acc-tool ${cls}`;
      b.textContent = text;
      if (title) b.title = title;
      if (pressed !== null) b.setAttribute("aria-pressed", String(pressed));
      for (const [k, v] of Object.entries(extra)) b.setAttribute(k, v);
      b.addEventListener("click", onClick);
      parent.append(b);
      return b;
    };

    const hl = group("Highlighter", "is-highlighter");
    this.colorButtons = Object.entries(HIGHLIGHT_COLORS).map(([key, def]) => {
      const b = btn(hl, def.label, { pressed: false, cls: `acc-swatch swatch-${key}`, title: `Highlight in ${def.label.toLowerCase()}`, onClick: () => this.pickColor(key), extra: { "data-tool": `hl-${key}` } });
      return [key, b];
    });
    btn(hl, "Clear selected", { title: "Remove the highlight on the selected text", onClick: () => this.clearSelected(), extra: { "data-tool": "hl-clear-selected" } });
    btn(hl, "Clear all", { title: "Remove all highlights in this passage", onClick: () => this.clearAll(), extra: { "data-tool": "hl-clear-all" } });

    const lr = group("Line reader");
    this.lrBtn = btn(lr, "Line reader", { pressed: this.prefs.lineReader, onClick: () => this.setLineReader(!this.prefs.lineReader), extra: { "data-tool": "line-reader" } });
    this.lrNarrow = btn(lr, "Narrower", { title: "Make the reading window shorter", onClick: () => this.resizeLine(-16), extra: { "data-tool": "line-narrow" } });
    this.lrWide = btn(lr, "Wider", { title: "Make the reading window taller", onClick: () => this.resizeLine(16), extra: { "data-tool": "line-wide" } });

    const mag = group("Magnifier");
    this.zoomButtons = ZOOM_LEVELS.map((z) => [z, btn(mag, `${z}%`, { pressed: this.prefs.zoom === z, title: `Text size ${z}%`, onClick: () => this.setZoom(z), extra: { "data-tool": `zoom-${z}` } })]);

    const el = group("Answer tools");
    this.elimBtn = btn(el, "Eliminate", { pressed: this.prefs.eliminator, title: "Show a cross-out button on each answer choice", onClick: () => this.setEliminator(!this.prefs.eliminator), extra: { "data-tool": "eliminator" } });
    const mc = this.o.markControl?.();
    this.markBtn = btn(el, "Mark for review", { pressed: Boolean(mc?.marked), onClick: () => this.toggleMark(), extra: { "data-tool": "mark" } });

    bar.addEventListener("keydown", (e) => this.toolbarKeys(e, bar));
    this.el = bar;
    this.rovingInit(bar);
    this.applyPrefsToDom();
    return bar;
  }

  rovingInit(bar) {
    const buttons = [...bar.querySelectorAll("button")];
    buttons.forEach((b, i) => b.setAttribute("tabindex", i === 0 ? "0" : "-1"));
    bar.addEventListener("focusin", (e) => {
      if (e.target.matches("button")) buttons.forEach((b) => b.setAttribute("tabindex", b === e.target ? "0" : "-1"));
    });
  }
  toolbarKeys(e, bar) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const buttons = [...bar.querySelectorAll("button")];
    const i = buttons.indexOf(this.doc.activeElement);
    if (i < 0) return;
    const j = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
    buttons[j].focus();
    e.preventDefault();
  }

  /** Re-sync after the canvas rerenders (new item, new stimulus). */
  refresh() {
    this.applyHighlights();
    this.syncMark();
    this.positionLine();
  }

  // ── highlighter ───────────────────────────────────────────────────────────
  scopes() {
    return this.o.getScopes() || {};
  }
  listKey() {
    return this.o.stimulusKey?.() || "default";
  }
  list() {
    return (this.o.state.highlights[this.listKey()] ||= []);
  }
  applyHighlights() {
    const scopes = this.scopes();
    applyHighlights(scopes, this.list());
  }
  captureSelection() {
    const sel = this.doc.defaultView.getSelection?.();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const safe = safeSelection(sel.getRangeAt(0), this.scopes());
    if (safe) this.pending = safe;
  }
  pickColor(key) {
    // Clicking a colour with text selected highlights it now (the keyboard path); otherwise it arms the colour.
    // selectionchange is asynchronous, so read the live selection first; a stored one covers browsers that clear it on click.
    this.captureSelection();
    if (this.pending) {
      // One-shot: highlight the selection that is already made, without arming the colour for later selections.
      const armed = this.color;
      this.color = key;
      this.applyPending(false);
      this.color = armed;
      this.syncColors();
      return;
    }
    this.color = this.color === key ? null : key;
    this.syncColors();
    this.say(this.color ? `${HIGHLIGHT_COLORS[key].label} highlighter on. Select text to highlight it.` : "Highlighter off.");
  }
  syncColors() {
    for (const [key, b] of this.colorButtons || []) b.setAttribute("aria-pressed", String(this.color === key));
  }
  applyPending(requireArmed) {
    if (!this.pending || !this.color || (requireArmed && !this.color)) return;
    const p = this.pending;
    this.pending = null;
    this.o.state.highlights[this.listKey()] = addHighlight(this.list(), { ...p, color: this.color });
    this.applyHighlights();
    this.doc.defaultView.getSelection?.().removeAllRanges();
    this.o.onState?.();
    this.say(`${HIGHLIGHT_COLORS[this.color].label} highlight added.`);
  }
  clearSelected() {
    const sel = this.doc.defaultView.getSelection?.();
    const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
    const safe = range ? safeSelection(range, this.scopes()) || this.caretSpot(range) : this.pending;
    if (!safe) return this.say("Select highlighted text first, then press Clear selected.");
    const before = this.list().length;
    this.o.state.highlights[this.listKey()] = removeIntersecting(this.list(), safe);
    this.applyHighlights();
    this.o.onState?.();
    this.say(before === this.list().length ? "No highlight found at the selection." : "Highlight removed.");
  }
  caretSpot(range) {
    for (const [id, el] of Object.entries(this.scopes())) {
      if (!el.contains(range.startContainer)) continue;
      const pre = this.doc.createRange();
      pre.selectNodeContents(el);
      pre.setEnd(range.startContainer, range.startOffset);
      const at = pre.toString().length;
      return { scope: id, start: at, end: at };
    }
    return null;
  }
  clearAll() {
    const n = this.list().length;
    this.o.state.highlights[this.listKey()] = [];
    this.applyHighlights();
    this.o.onState?.();
    this.say(n ? "All highlights removed." : "There are no highlights to remove.");
  }

  // ── line reader ───────────────────────────────────────────────────────────
  setLineReader(on) {
    this.prefs.lineReader = on;
    this.lrBtn?.setAttribute("aria-pressed", String(on));
    this.ensureLine();
    this.savePrefs();
    this.say(on ? "Line reader on. Use the Up and Down arrow keys on the reader to move it." : "Line reader off.");
  }
  ensureLine() {
    const host = this.o.getLineHost?.();
    if (!host) return;
    if (!this.prefs.lineReader) {
      this.lineEl?.remove();
      this.lineEl = null;
      return;
    }
    if (this.lineEl?.isConnected) return this.positionLine();
    const d = this.doc;
    const root = d.createElement("div");
    root.className = "acc-lr";
    root.innerHTML = '<div class="acc-lr-mask is-top" aria-hidden="true"></div><div class="acc-lr-mask is-bottom" aria-hidden="true"></div>';
    const handle = d.createElement("div");
    handle.className = "acc-lr-handle";
    handle.tabIndex = 0;
    handle.setAttribute("role", "slider");
    handle.setAttribute("aria-label", "Line reader position");
    handle.setAttribute("aria-orientation", "vertical");
    handle.setAttribute("aria-valuemin", "0");
    handle.setAttribute("aria-valuemax", "100");
    handle.addEventListener("keydown", (e) => this.lineKeys(e));
    handle.addEventListener("pointerdown", (e) => this.lineDrag(e, handle));
    root.append(handle);
    host.append(root);
    this.lineEl = root;
    this.lineHandle = handle;
    this.positionLine();
  }
  lineMetrics() {
    const h = this.lineEl.parentElement.clientHeight || 1;
    const win = Math.min(this.prefs.lineHeight, h);
    const top = Math.round(Math.min(Math.max(0, this.prefs.linePos * h), h - win));
    return { h, win, top };
  }
  positionLine() {
    if (!this.lineEl?.isConnected) return;
    const { h, win, top } = this.lineMetrics();
    this.lineEl.style.setProperty("--lr-top", `${top}px`);
    this.lineEl.style.setProperty("--lr-win", `${win}px`);
    this.lineHandle.setAttribute("aria-valuenow", String(Math.round((top / Math.max(1, h - win)) * 100)));
  }
  moveLine(dy) {
    const { h, win, top } = this.lineMetrics();
    this.prefs.linePos = Math.min(Math.max(0, top + dy), h - win) / h;
    this.positionLine();
    this.savePrefs();
  }
  lineKeys(e) {
    const step = { ArrowUp: -24, ArrowDown: 24, PageUp: -120, PageDown: 120 }[e.key];
    if (step !== undefined) this.moveLine(step);
    else if (e.key === "Home") this.moveLine(-1e5);
    else if (e.key === "End") this.moveLine(1e5);
    else return;
    e.preventDefault();
  }
  lineDrag(e, handle) {
    handle.setPointerCapture?.(e.pointerId);
    const start = e.clientY;
    const startTop = this.lineMetrics().top;
    const move = (m) => {
      const { h, win } = this.lineMetrics();
      this.prefs.linePos = Math.min(Math.max(0, startTop + m.clientY - start), h - win) / h;
      this.positionLine();
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      this.savePrefs();
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
  }
  resizeLine(delta) {
    this.prefs.lineHeight = Math.min(Math.max(32, this.prefs.lineHeight + delta), 240);
    this.positionLine();
    this.savePrefs();
    this.say(`Reading window ${this.prefs.lineHeight} pixels tall.`);
  }

  // ── magnifier ─────────────────────────────────────────────────────────────
  setZoom(z) {
    if (!ZOOM_LEVELS.includes(z)) return;
    this.prefs.zoom = z;
    this.applyPrefsToDom();
    this.savePrefs();
    this.say(`Text size ${z} percent.`);
  }
  applyPrefsToDom() {
    const { host } = this.o;
    host.dataset.zoom = String(this.prefs.zoom);
    host.style.setProperty("--acc-zoom", String(this.prefs.zoom / 100));
    for (const [z, b] of this.zoomButtons || []) b.setAttribute("aria-pressed", String(this.prefs.zoom === z));
    host.dataset.eliminator = this.prefs.eliminator ? "on" : "off";
    this.elimBtn?.setAttribute("aria-pressed", String(this.prefs.eliminator));
    this.lrBtn?.setAttribute("aria-pressed", String(this.prefs.lineReader));
    this.ensureLine();
    this.positionLine();
  }

  // ── eliminator ────────────────────────────────────────────────────────────
  setEliminator(on) {
    this.prefs.eliminator = on;
    this.applyPrefsToDom();
    this.savePrefs();
    this.say(on ? "Answer eliminator on. Each choice has a cross-out button." : "Answer eliminator off.");
  }
  isEliminated(itemId, optionId) {
    return isEliminated(this.o.state, itemId, optionId);
  }
  /** Used by the choice renderers. Returns { eliminated, allowed }. */
  toggleChoice(item, optionId, letter) {
    if (!canEliminate(this.o.state, item, optionId)) {
      this.say("Keep at least one choice. You can restore a choice to eliminate another.");
      return { eliminated: false, allowed: false };
    }
    const eliminated = toggleEliminated(this.o.state, item.id, optionId);
    this.o.onState?.();
    this.say(eliminated ? `Choice ${letter} crossed out. You can still select it.` : `Choice ${letter} restored.`);
    return { eliminated, allowed: true };
  }

  // ── mark for review ───────────────────────────────────────────────────────
  toggleMark() {
    const mc = this.o.markControl?.();
    if (!mc) return;
    mc.toggle();
    this.syncMark();
    this.say(this.o.markControl().marked ? "Marked for review." : "Mark removed.");
  }
  syncMark() {
    const mc = this.o.markControl?.();
    this.markBtn?.setAttribute("aria-pressed", String(Boolean(mc?.marked)));
  }
}
