// Book Studio collaboration, the device side of the merge (pure; Node-testable). The server's rules are in
// shared/class-platform/book-merge.js; this file turns the editor's book into ops and applies the server's items back.
//
// The SHADOW is what this device knows the server holds: a Map item id → { id, kind, page, ord, data, rev, by,
// deleted }. A local change is whatever differs between the book and the shadow, so every editor action (typing,
// dragging, undo, a restored version) becomes element-level ops without hooking each action. Remote items are written
// into the book without disturbing what this device has not sent yet.
import { normalizeElement, normalizePage } from "./model.js";

export const META_ID = "meta";
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));
const live = (shadow, id) => {
  const s = shadow.get(id);
  return s && !s.deleted ? s : null;
};

/** The book-level fields every collaborator shares (status, feedback and submissions stay personal). */
export const metaOf = (book) => ({
  title: book.title,
  format: book.format,
  kind: book.kind,
  lang: book.lang,
  dir: book.dir,
  author: book.author || "",
});

export const pagePropsOf = (p) => ({
  bg: p.bg,
  bgArt: p.bgArt,
  narration: p.narration,
  prompt: p.prompt,
  frames: p.frames,
});

export function changedFields(before, after) {
  if (!before) return Object.keys(after);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    (k) => !same(before[k], after[k]),
  );
}

/**
 * Order numbers for `ids` in their local order. Known ords that are already increasing (the longest such run) are
 * kept, so moving one page or element changes only that item's ord; the rest get ords between their neighbours.
 */
export function assignOrds(ids, known) {
  const vals = ids.map((id) => known(id));
  const idx = [];
  vals.forEach((v, i) => Number.isFinite(v) && idx.push(i));
  const len = idx.map(() => 1);
  const prev = idx.map(() => -1);
  for (let a = 0; a < idx.length; a++)
    for (let b = 0; b < a; b++)
      if (vals[idx[b]] < vals[idx[a]] && len[b] + 1 > len[a]) {
        len[a] = len[b] + 1;
        prev[a] = b;
      }
  const keep = new Set();
  let best = -1;
  len.forEach((l, a) => {
    if (best < 0 || l > len[best]) best = a;
  });
  for (let a = best; a >= 0; a = prev[a]) keep.add(idx[a]);
  const out = new Map();
  for (let i = 0; i < ids.length;) {
    if (keep.has(i)) {
      out.set(ids[i], vals[i]);
      i++;
      continue;
    }
    let j = i;
    while (j < ids.length && !keep.has(j)) j++;
    const lo = i > 0 ? out.get(ids[i - 1]) : undefined;
    const hi = j < ids.length ? vals[j] : undefined;
    const k = j - i;
    if (lo !== undefined && hi !== undefined && (hi - lo) / (k + 1) < 1e-9)
      return new Map(ids.map((id, n) => [id, n + 1])); // worn-out gap: renumber the whole list
    for (let t = 0; t < k; t++)
      out.set(
        ids[i + t],
        lo === undefined && hi === undefined
          ? t + 1
          : lo === undefined
            ? hi - (k - t)
            : hi === undefined
              ? lo + t + 1
              : lo + ((hi - lo) * (t + 1)) / (k + 1),
      );
    i = j;
  }
  return out;
}

const pageOrdsOf = (book, shadow) =>
  assignOrds(
    book.pages.map((p) => p.id),
    (id) => (live(shadow, id)?.kind === "page" ? live(shadow, id).ord : undefined),
  );
const elementOrdsOf = (page, shadow) =>
  assignOrds(
    page.elements.map((e) => e.id),
    (id) => {
      const s = live(shadow, id);
      return s?.kind === "el" && s.page === page.id ? s.ord : undefined;
    },
  );

/** Every local change as ops, in a safe order: meta, pages, elements, element deletes, page deletes. */
export function diffBook(shadow, book) {
  const head = [];
  const els = [];
  const m = metaOf(book);
  const sm = live(shadow, META_ID);
  if (!sm || !same(sm.data, m)) {
    const fields = changedFields(sm?.data, m);
    head.push({
      type: "setMeta",
      id: META_ID,
      baseRev: shadow.get(META_ID)?.rev || 0,
      data: m,
      fields,
    });
  }
  const pageOrd = pageOrdsOf(book, shadow);
  const localIds = new Set();
  for (const p of book.pages) {
    localIds.add(p.id);
    const s = live(shadow, p.id);
    const data = clone(pagePropsOf(p));
    const ord = pageOrd.get(p.id);
    if (!s)
      head.push({ type: "upsertPage", id: p.id, baseRev: shadow.get(p.id)?.rev || 0, ord, data });
    else {
      const fields = changedFields(s.data, data);
      if (fields.length)
        head.push({
          type: "upsertPage",
          id: p.id,
          baseRev: s.rev,
          data,
          fields,
          ...(ord !== s.ord ? { ord } : {}),
        });
      else if (ord !== s.ord) head.push({ type: "movePage", id: p.id, baseRev: s.rev, ord });
    }
    const elOrd = elementOrdsOf(p, shadow);
    for (const e of p.elements) {
      localIds.add(e.id);
      const t = live(shadow, e.id);
      const ord2 = elOrd.get(e.id);
      if (!t) {
        els.push({
          type: "upsertElement",
          id: e.id,
          page: p.id,
          baseRev: shadow.get(e.id)?.rev || 0,
          ord: ord2,
          data: clone(e),
        });
        continue;
      }
      const fields = changedFields(t.data, e);
      if (fields.length || t.page !== p.id || t.ord !== ord2)
        els.push({
          type: "upsertElement",
          id: e.id,
          page: p.id,
          baseRev: t.rev,
          ord: ord2,
          data: clone(e),
          fields,
        });
    }
  }
  const delEls = [];
  const delPages = [];
  for (const [id, s] of shadow) {
    if (s.deleted || id === META_ID || localIds.has(id)) continue;
    if (s.kind === "page") delPages.push({ type: "deletePage", id, baseRev: s.rev });
    else if (s.kind === "el" && localIds.has(s.page))
      delEls.push({ type: "deleteElement", id, baseRev: s.rev });
  }
  return [...head, ...els, ...delEls, ...delPages];
}

/** Ids this device has changed and not yet sent. */
export const pendingIds = (shadow, book) => new Set(diffBook(shadow, book).map((op) => op.id));

/** The shadow after the server applied one of this device's ops. */
export function shadowAfterOp(shadow, op, rev, by) {
  const cur = shadow.get(op.id);
  if (op.type === "deleteElement" || op.type === "deletePage") {
    if (cur) shadow.set(op.id, { ...cur, data: null, deleted: true, rev, by });
    if (op.type === "deletePage")
      for (const [id, s] of shadow)
        if (s.kind === "el" && s.page === op.id && !s.deleted)
          shadow.set(id, { ...s, data: null, deleted: true, rev, by });
    return;
  }
  const kind = op.type === "setMeta" ? "meta" : op.type === "upsertElement" ? "el" : "page";
  shadow.set(op.id, {
    id: op.id,
    kind,
    page: op.page || cur?.page || "",
    ord: op.ord ?? cur?.ord ?? 0,
    data: op.type === "movePage" ? cur?.data : clone(op.data),
    rev,
    by,
    deleted: false,
  });
}

/**
 * A server item in the exact shape this device stores, so a received item and the book never differ by formatting
 * alone. `sanitize` is the DOM rich-text sanitizer (sanitize.js) in the browser; every received text box passes it.
 */
export function clientItem(item, sanitize = (h) => h) {
  if (item.deleted || item.data == null) return { ...item, data: null };
  if (item.kind === "el") {
    const data = normalizeElement({ ...item.data, id: item.id });
    if (data.html != null) data.html = sanitize(data.html);
    return { ...item, data };
  }
  if (item.kind === "page") {
    const { bg, bgArt, narration, prompt, frames } = normalizePage({
      ...item.data,
      id: item.id,
      elements: [],
    });
    return { ...item, data: { bg, bgArt, narration, prompt, frames } };
  }
  return { ...item, data: { ...item.data } };
}

/**
 * Write received items into a book (mutates it). `before` is the shadow BEFORE these items were recorded: it gives
 * the order this device already has, so a local move that has not reached the server yet is not undone by sorting.
 * Items must already be in client shape (clientItem).
 */
export function applyItems(book, items, before = new Map()) {
  if (!items.length) return book;
  const pageKey = pageOrdsOf(book, before);
  const elKey = new Map();
  for (const p of book.pages) for (const [id, ord] of elementOrdsOf(p, before)) elKey.set(id, ord);
  const touched = new Set();
  let pagesMoved = false;
  for (const it of items) {
    if (it.kind === "meta" && it.data) Object.assign(book, it.data);
    if (it.kind !== "page") continue;
    pagesMoved = true;
    const at = book.pages.findIndex((p) => p.id === it.id);
    if (it.deleted) {
      if (at >= 0) book.pages.splice(at, 1);
      continue;
    }
    pageKey.set(it.id, it.ord);
    if (at >= 0) Object.assign(book.pages[at], clone(it.data));
    else book.pages.push({ id: it.id, ...clone(it.data), elements: [] });
  }
  for (const it of items) {
    if (it.kind !== "el") continue;
    for (const p of book.pages) {
      const at = p.elements.findIndex((e) => e.id === it.id);
      if (at >= 0) {
        p.elements.splice(at, 1);
        touched.add(p.id);
      }
    }
    if (it.deleted) continue;
    const target = book.pages.find((p) => p.id === it.page);
    if (!target) continue;
    elKey.set(it.id, it.ord);
    target.elements.push(clone(it.data));
    touched.add(target.id);
  }
  const byKey = (keys) => (a, b) => {
    const x = keys.get(a.id) ?? 0;
    const y = keys.get(b.id) ?? 0;
    return x - y || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  };
  if (pagesMoved) book.pages.sort(byKey(pageKey));
  for (const p of book.pages) if (touched.has(p.id)) p.elements.sort(byKey(elKey));
  return book;
}

/** A whole book from the server's items (joining a classmate's book). */
export function bookFromItems(items, base = {}) {
  const book = { ...base, pages: [] };
  applyItems(
    book,
    items.filter((it) => !it.deleted),
    new Map(),
  );
  return book;
}
