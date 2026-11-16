// Book Studio editor state: the working copy of the book, undo/redo, the clipboard and autosave. No DOM here.
//
// Saving contract: every committed change writes a synchronous recovery copy (db.writeRecovery) and schedules an
// IndexedDB save. The status only reads "Saved" after that transaction commits. A failure keeps the recovery copy and
// offers "Try again". If another tab saved this book after we loaded it, the save is refused (db.ConflictError) and
// the learner chooses whose version to keep; nothing is silently overwritten.
import * as db from "./db.js";
import { duplicatePage, makeElement, newId, normalizeBook, normalizeElement } from "./model.js";

const HISTORY = 100;
const SAVE_DELAY = 700;
const VERSION_EVERY_MS = 10 * 60 * 1000;

export function createEditorState(book, { onChange, onStatus, onConflict, onCommit } = {}) {
  const S = {
    book: normalizeBook(book),
    pageIndex: 0,
    selected: null, // element id
    editingText: null, // element id whose text is being typed
    undo: [],
    redo: [],
    clipboard: null,
    status: { state: "saved", at: book.updatedAt },
    dirty: false,
    baseRev: book.rev,
    timer: 0,
    saving: null,
    lastVersionAt: Date.now(),
    seq: 0,
    readOnly: false, // a viewer of a shared class book (collab.js): local changes are refused
  };
  const snapshot = () => JSON.stringify(S.book);
  let lastSnap = snapshot();

  const setStatus = (state, extra = {}) => {
    S.status = { state, ...extra };
    onStatus?.(S.status);
  };

  async function saveNow() {
    clearTimeout(S.timer);
    if (S.saving) {
      await S.saving.catch(() => {});
      if (!S.dirty) return true;
    }
    if (!S.dirty) return true;
    setStatus("saving");
    const seqAtStart = S.seq;
    S.saving = db.saveBook(S.book, { baseRev: S.baseRev });
    try {
      const saved = await S.saving;
      S.baseRev = saved.rev;
      S.book.rev = saved.rev;
      S.book.updatedAt = saved.updatedAt;
      // Only clean if nothing changed while the save was in flight.
      if (S.seq === seqAtStart) S.dirty = false;
      else scheduleSave();
      if (Date.now() - S.lastVersionAt > VERSION_EVERY_MS) {
        S.lastVersionAt = Date.now();
        db.saveVersion(saved, "Autosaved version").catch(() => {});
      }
      setStatus(S.dirty ? "pending" : "saved", { at: saved.updatedAt });
      return true;
    } catch (error) {
      if (error instanceof db.ConflictError) {
        setStatus("conflict");
        onConflict?.(error.stored);
      } else setStatus("error", { message: String(error?.message || error) });
      return false;
    } finally {
      S.saving = null;
    }
  }

  function scheduleSave() {
    clearTimeout(S.timer);
    S.timer = setTimeout(saveNow, SAVE_DELAY);
    if (S.status.state !== "saving") setStatus("pending");
  }

  /** Record a change: push undo, write recovery, schedule save, notify. `render` false while typing. */
  function commit({ render = true, history = true, remote = false } = {}) {
    const snap = snapshot();
    if (snap === lastSnap) return;
    if (S.readOnly && !remote) {
      S.book = normalizeBook(JSON.parse(lastSnap));
      S.editingText = null;
      onChange?.({ render: true });
      return;
    }
    if (history) {
      S.undo.push(lastSnap);
      if (S.undo.length > HISTORY) S.undo.shift();
      S.redo = [];
    }
    lastSnap = snap;
    S.seq++;
    S.dirty = true;
    db.writeRecovery(S.book);
    scheduleSave();
    onChange?.({ render });
    if (!remote) onCommit?.();
  }

  function restore(snap) {
    const collab = S.book.collab;
    S.book = normalizeBook(JSON.parse(snap));
    S.book.rev = S.baseRev;
    S.book.collab = collab; // undo never moves this copy's place in a shared book
    lastSnap = snapshot();
    S.seq++;
    S.pageIndex = Math.min(S.pageIndex, S.book.pages.length - 1);
    if (S.selected && !page().elements.some((e) => e.id === S.selected)) S.selected = null;
    S.editingText = null;
    S.dirty = true;
    db.writeRecovery(S.book);
    scheduleSave();
    onChange?.({ render: true });
    onCommit?.();
  }

  const page = () => S.book.pages[S.pageIndex];
  const selectedEl = () =>
    S.selected ? page().elements.find((e) => e.id === S.selected) || null : null;

  const api = {
    S,
    page,
    selectedEl,
    commit,
    saveNow,
    snapshot,
    /** Accept the stored copy from another tab (conflict: "Use the other version"). */
    adopt(stored) {
      S.book = normalizeBook(stored);
      S.baseRev = stored.rev;
      lastSnap = snapshot();
      S.undo = [];
      S.redo = [];
      S.dirty = false;
      S.pageIndex = Math.min(S.pageIndex, S.book.pages.length - 1);
      S.selected = null;
      db.clearRecovery(S.book.id);
      setStatus("saved", { at: stored.updatedAt });
      onChange?.({ render: true });
    },
    /** Keep this tab's work over the other tab's (conflict: "Keep mine"). The other copy is kept as a version. */
    async overwrite(stored) {
      await db.saveVersion(stored, "Version from another tab").catch(() => {});
      S.baseRev = stored.rev;
      S.dirty = true;
      return saveNow();
    },
    undo() {
      if (!S.undo.length) return false;
      S.redo.push(lastSnap);
      restore(S.undo.pop());
      return true;
    },
    redo() {
      if (!S.redo.length) return false;
      S.undo.push(lastSnap);
      restore(S.redo.pop());
      return true;
    },
    canUndo: () => S.undo.length > 0,
    canRedo: () => S.redo.length > 0,

    // ── pages ──
    goPage(i) {
      S.pageIndex = Math.max(0, Math.min(S.book.pages.length - 1, i));
      S.selected = null;
      S.editingText = null;
    },
    addPage(p, at = S.pageIndex + 1) {
      S.book.pages.splice(at, 0, p);
      S.pageIndex = at;
      S.selected = null;
      commit();
    },
    duplicatePage(i = S.pageIndex) {
      api.addPage(duplicatePage(S.book.pages[i]), i + 1);
    },
    deletePage(i = S.pageIndex) {
      if (S.book.pages.length <= 1) return false;
      const removed = S.book.pages.splice(i, 1)[0];
      S.book.feedback = S.book.feedback.filter((f) => f.pageId !== removed.id);
      S.pageIndex = Math.min(i, S.book.pages.length - 1);
      S.selected = null;
      commit();
      return true;
    },
    movePage(from, to) {
      if (to < 0 || to >= S.book.pages.length || from === to) return false;
      const [p] = S.book.pages.splice(from, 1);
      S.book.pages.splice(to, 0, p);
      S.pageIndex = to;
      commit();
      return true;
    },

    // ── elements ──
    add(type, props = {}) {
      const el = makeElement(type, props);
      page().elements.push(el);
      S.selected = el.id;
      commit();
      return el;
    },
    update(id, patch, opts) {
      const els = page().elements;
      const i = els.findIndex((e) => e.id === id);
      if (i < 0) return null;
      els[i] = normalizeElement({
        ...els[i],
        ...patch,
        style: patch.style ? { ...els[i].style, ...patch.style } : els[i].style,
      });
      commit(opts);
      return els[i];
    },
    remove(id = S.selected) {
      const els = page().elements;
      const i = els.findIndex((e) => e.id === id);
      if (i < 0) return false;
      els.splice(i, 1);
      if (S.selected === id) S.selected = null;
      commit();
      return true;
    },
    duplicate(id = S.selected) {
      const el = page().elements.find((e) => e.id === id);
      if (!el) return null;
      const copy = normalizeElement({
        ...JSON.parse(JSON.stringify(el)),
        id: newId("e"),
        x: el.x + 3,
        y: el.y + 3,
        locked: false,
      });
      page().elements.push(copy);
      S.selected = copy.id;
      commit();
      return copy;
    },
    layer(id, where) {
      const els = page().elements;
      const i = els.findIndex((e) => e.id === id);
      if (i < 0) return;
      const [el] = els.splice(i, 1);
      const to =
        where === "front"
          ? els.length
          : where === "back"
            ? 0
            : where === "forward"
              ? Math.min(els.length, i + 1)
              : Math.max(0, i - 1);
      els.splice(to, 0, el);
      commit();
    },
    copy(id = S.selected) {
      const el = page().elements.find((e) => e.id === id);
      if (el) S.clipboard = JSON.parse(JSON.stringify(el));
      return !!el;
    },
    paste() {
      if (!S.clipboard) return null;
      const el = normalizeElement({
        ...S.clipboard,
        id: newId("e"),
        x: S.clipboard.x + 3,
        y: S.clipboard.y + 3,
      });
      page().elements.push(el);
      S.selected = el.id;
      S.clipboard = { ...S.clipboard, x: el.x, y: el.y };
      commit();
      return el;
    },
    align(id, how) {
      const el = page().elements.find((e) => e.id === id);
      if (!el) return;
      const patch = {
        left: { x: 4 },
        hcenter: { x: (100 - el.w) / 2 },
        right: { x: 96 - el.w },
        top: { y: 4 },
        vcenter: { y: (100 - el.h) / 2 },
        bottom: { y: 96 - el.h },
      }[how];
      if (patch) api.update(id, patch);
    },
    /**
     * Write a collaborator's changes (collab.js) into the book. The same change is written into every undo and redo
     * step, so Undo only ever takes back this learner's own edits, never a classmate's. Not an undo step itself.
     */
    applyRemote(mutate) {
      const pageId = page()?.id;
      mutate(S.book);
      const rebase = (snap) => {
        const b = JSON.parse(snap);
        mutate(b);
        return JSON.stringify(normalizeBook(b));
      };
      S.undo = S.undo.map(rebase);
      S.redo = S.redo.map(rebase);
      const at = S.book.pages.findIndex((p) => p.id === pageId);
      S.pageIndex = at >= 0 ? at : Math.min(S.pageIndex, S.book.pages.length - 1);
      const els = page().elements;
      if (S.selected && !els.some((e) => e.id === S.selected)) S.selected = null;
      if (S.editingText && !els.some((e) => e.id === S.editingText)) S.editingText = null;
      commit({ history: false, remote: true });
    },
    setBook(patch) {
      Object.assign(S.book, patch);
      commit();
    },
    destroy() {
      clearTimeout(S.timer);
    },
  };
  return api;
}
