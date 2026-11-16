/* =============================================================================
 * Book Studio collaboration — the merge rules (pure; no DOM, no D1, no clock).
 * Shared by the server (functions/_lib/class-platform/books.js) and its tests.
 * Docs: access-practice-lab/BOOK-STUDIO.md ("Writing together").
 * -----------------------------------------------------------------------------
 * A shared book is a set of ITEMS, each with its own revision:
 *   { id: "meta", kind: "meta" }                       title, format, kind, language, direction, author
 *   { id: <pageId>, kind: "page", ord }                one page's own properties (background, prompt, frames)
 *   { id: <elementId>, kind: "el", page, ord }         one element (text box, picture, shape, bubble, ...)
 * Order is a fractional `ord` per item (pages in the book, elements in their page), so two people adding or moving
 * different things never rewrite each other's order. The book has one monotonically increasing `rev`; every write
 * stamps the items it touched with the new rev and with who made it (`by`, a class student id).
 *
 * Ops (each names the item revision it was based on):
 *   setMeta       { baseRev, data, fields? }
 *   upsertPage    { id, baseRev, ord?, data, fields? }
 *   movePage      { id, baseRev, ord }
 *   deletePage    { id, baseRev }
 *   upsertElement { id, page, baseRev, ord?, data, fields? }
 *   deleteElement { id, baseRev }
 *
 * Rules (never a whole-document overwrite):
 *   - Up to date (baseRev >= item rev): the op's data replaces that one item.
 *   - Stale (someone changed the item since): only the fields this op changed (`fields`) are written onto the
 *     current item, so a move by one learner and typing by another both survive. The same field changed by two
 *     people: the later arrival at the server wins (predictable: server order).
 *   - A delete beats a stale edit: an edit based on a revision older than the delete is rejected; an edit made
 *     after seeing the delete (undo) brings the item back.
 *   - Deleting a page deletes its elements; an element edit on a deleted page is rejected.
 * ========================================================================== */

import {
  LIMITS as BOOK_LIMITS,
  FORMATS,
  KINDS,
  normalizeElement,
  normalizePage,
} from "../../access-practice-lab/src/book/model.js";
import { CODE_ALPHABET } from "./contract.js";

export const COLLAB = Object.freeze({
  /** A shared book nobody has opened or changed for this long is deleted (the class's own 120 days still apply). */
  retentionDays: 30,
  maxBooksPerOwner: 6,
  maxMembers: 12,
  maxOpsPerSync: 100,
  maxItemBytes: 64 * 1024,
  maxBookBytes: 2 * 1024 * 1024,
  maxPictures: 30,
  maxPictureBytes: 350 * 1024,
  maxPictureSide: 1200,
  /** A collaborator counts as "here" while their editor checked in this recently. */
  presenceMs: 30_000,
  pollMs: 2000,
  hiddenPollMs: 15_000,
  changesPage: 400,
  /** Deleted-item markers kept per book before the oldest are folded into a resync floor. */
  maxTombstones: 1500,
  pages: BOOK_LIMITS.pages,
  elementsPerPage: BOOK_LIMITS.elementsPerPage,
});

export const ROLES = Object.freeze(["owner", "editor", "viewer"]);
export const META_ID = "meta";
export const OP_TYPES = Object.freeze([
  "setMeta",
  "upsertPage",
  "movePage",
  "deletePage",
  "upsertElement",
  "deleteElement",
]);

export const isItemId = (id) => typeof id === "string" && /^[a-z0-9]{4,40}$/i.test(id);
export const isMediaId = (id) => typeof id === "string" && /^m[a-z0-9]{6,30}$/.test(id);
export const isCollabBookId = (id) => typeof id === "string" && /^k[a-f0-9]{12}$/.test(id);
const bookCodeRe = new RegExp(`^[${CODE_ALPHABET}]{6}$`);
export const isBookCode = (code) => typeof code === "string" && bookCodeRe.test(code);

/* ── rich text, server side ──────────────────────────────────────────────────
 * The same allow-list as access-practice-lab/src/book/sanitize.js, written as a tokenizer because a Pages Function
 * has no DOM. Every client also runs the DOM sanitizer on everything it receives, so this is the second of two
 * gates: it guarantees that what is stored and served can never carry a script, a handler or an outside resource. */
const ALLOWED = new Set([
  "P",
  "BR",
  "B",
  "STRONG",
  "I",
  "EM",
  "U",
  "UL",
  "OL",
  "LI",
  "H2",
  "H3",
  "A",
  "SPAN",
  "DIV",
]);
const DROP_WITH_CONTENT = new Set([
  "SCRIPT",
  "STYLE",
  "IFRAME",
  "OBJECT",
  "EMBED",
  "TEMPLATE",
  "NOSCRIPT",
  "SVG",
  "MATH",
  "HEAD",
  "TITLE",
  "META",
  "LINK",
  "TEXTAREA",
  "XMP",
]);
const BLOCKISH = /^(H1|H4|H5|H6|BLOCKQUOTE|SECTION|ARTICLE|TABLE|TR)$/;
const COLOR = /^#[0-9a-f]{3,8}$/i;
const LANG = /^[a-z]{2,3}(-[A-Za-z]{2,4})?$/;
const TAG_RE =
  /<(\/?)([a-zA-Z][a-zA-Z0-9:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*\/?>/y;
const ATTR_RE = /([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
const ENTITY = /^&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/i;

const escAttr = (v) =>
  v
    .replace(/&(?!(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});)/gi, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const decodeBasic = (v) =>
  v
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");

function attrsOf(raw) {
  const out = {};
  for (const m of raw.matchAll(ATTR_RE)) {
    const name = m[1].toLowerCase();
    if (!(name in out)) out[name] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return out;
}

function escText(run) {
  let out = "";
  for (let i = 0; i < run.length; i++) {
    const c = run[i];
    if (c === "&") {
      const m = ENTITY.exec(run.slice(i, i + 40));
      if (m) {
        out += m[0];
        i += m[0].length - 1;
      } else out += "&amp;";
    } else if (c === ">") out += "&gt;";
    else out += c;
  }
  return out;
}

const colorFromStyle = (style) =>
  (/(?:^|;)\s*color:\s*(#[0-9a-f]{3,8})/i.exec(style || "") || [])[1] || "";

/** Sanitize stored rich text to the Book Studio subset without a DOM. */
export function sanitizeStoredHtml(input) {
  const s = String(input ?? "");
  let out = "";
  const stack = []; // emitted tag name, or null for a tag we dropped (its close is dropped too)
  let i = 0;
  while (i < s.length) {
    const lt = s.indexOf("<", i);
    if (lt < 0) {
      out += escText(s.slice(i));
      break;
    }
    if (lt > i) out += escText(s.slice(i, lt));
    i = lt;
    if (s.startsWith("<!--", i)) {
      const end = s.indexOf("-->", i + 4);
      i = end < 0 ? s.length : end + 3;
      continue;
    }
    TAG_RE.lastIndex = i;
    const m = TAG_RE.exec(s);
    if (!m) {
      out += "&lt;";
      i += 1;
      continue;
    }
    i = TAG_RE.lastIndex;
    const closing = m[1] === "/";
    const tag = m[2].toUpperCase();
    if (DROP_WITH_CONTENT.has(tag)) {
      if (!closing) {
        const end = s.toLowerCase().indexOf(`</${m[2].toLowerCase()}`, i);
        i = end < 0 ? s.length : Math.max(i, s.indexOf(">", end) + 1 || s.length);
      }
      continue;
    }
    let name = null;
    let attrs = "";
    if (tag === "BR") {
      if (!closing) out += "<br>";
      continue;
    }
    if (ALLOWED.has(tag)) {
      name = tag === "DIV" ? "p" : tag === "STRONG" ? "b" : tag === "EM" ? "i" : tag.toLowerCase();
      if (!closing && (tag === "A" || tag === "SPAN")) {
        const a = attrsOf(m[3]);
        if (tag === "A") {
          const href = decodeBasic(a.href || "").trim();
          if (/^https?:\/\//i.test(href))
            attrs = ` href="${escAttr(href.slice(0, 500))}" rel="noopener noreferrer" target="_blank"`;
        } else {
          const c = a["data-c"] || colorFromStyle(a.style);
          if (c && COLOR.test(c)) attrs += ` data-c="${c}"`;
          if (a.lang && LANG.test(a.lang)) attrs += ` lang="${a.lang}"`;
          if (a.dir === "rtl" || a.dir === "ltr") attrs += ` dir="${a.dir}"`;
          if (!attrs) name = null; // a bare span adds nothing
        }
      }
    } else if (tag === "FONT" && !closing) {
      const a = attrsOf(m[3]);
      const c = a.color || colorFromStyle(a.style);
      if (c && COLOR.test(c)) {
        name = "span";
        attrs = ` data-c="${c}"`;
      }
    } else if (BLOCKISH.test(tag)) name = "p";
    if (closing) {
      // Close up to the nearest matching open tag; a stray close is dropped.
      const at = stack.lastIndexOf(name ?? `!${tag}`);
      const idx = at >= 0 ? at : name ? stack.lastIndexOf(name) : -1;
      if (idx < 0) continue;
      while (stack.length > idx) {
        const t = stack.pop();
        if (t && !t.startsWith("!")) out += `</${t}>`;
      }
      continue;
    }
    if (name) {
      out += `<${name}${attrs}>`;
      stack.push(name);
    } else stack.push(`!${tag}`);
  }
  while (stack.length) {
    const t = stack.pop();
    if (t && !t.startsWith("!")) out += `</${t}>`;
  }
  return out;
}

/* ── item data, validated ──────────────────────────────────────────────────── */

const bytesOf = (value) => new TextEncoder().encode(JSON.stringify(value)).length;
const str = (v, max) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .slice(0, max);

export function cleanMeta(raw = {}) {
  return {
    title: str(raw.title, BOOK_LIMITS.titleChars).trim() || "My book",
    format: FORMATS[raw.format] ? raw.format : "portrait",
    kind: KINDS.some((k) => k.id === raw.kind) ? raw.kind : "blank",
    lang: ["en", "es", "bi"].includes(raw.lang) ? raw.lang : "en",
    dir: raw.dir === "rtl" ? "rtl" : "ltr",
    author: str(raw.author, 60),
  };
}

/** A page's own properties (its elements are separate items). */
export function cleanPageProps(raw = {}, id = "page") {
  const { bg, bgArt, narration, prompt, frames } = normalizePage({ ...raw, id, elements: [] });
  return { bg, bgArt, narration, prompt, frames };
}

export function cleanElementData(raw, id) {
  const el = normalizeElement({ ...(raw && typeof raw === "object" ? raw : {}), id });
  if (el.html != null) el.html = sanitizeStoredHtml(el.html);
  return el;
}

const isNum = (n) => typeof n === "number" && Number.isFinite(n) && Math.abs(n) < 1e12;
const cleanFields = (fields, data) =>
  Array.isArray(fields)
    ? [...new Set(fields.filter((f) => typeof f === "string" && Object.hasOwn(data, f)))]
    : null;

/**
 * Validate and normalize one sync's ops. Unknown shapes are a 400 for the whole request (a client bug is loud).
 * @returns {{ ok: true, ops: object[] } | { ok: false, error: string }}
 */
export function cleanOps(raw) {
  if (!Array.isArray(raw)) return { ok: false, error: "invalid-ops" };
  if (raw.length > COLLAB.maxOpsPerSync) return { ok: false, error: "too-many-ops" };
  const ops = [];
  for (const op of raw) {
    if (!op || typeof op !== "object" || !OP_TYPES.includes(op.type))
      return { ok: false, error: "invalid-op" };
    const baseRev = Number.isInteger(op.baseRev) && op.baseRev >= 0 ? op.baseRev : -1;
    if (baseRev < 0) return { ok: false, error: "invalid-base-rev" };
    const id = op.type === "setMeta" ? META_ID : op.id;
    if (op.type !== "setMeta" && !isItemId(id)) return { ok: false, error: "invalid-id" };
    if (op.ord !== undefined && !isNum(op.ord)) return { ok: false, error: "invalid-ord" };
    const out = { type: op.type, id, baseRev };
    if (op.ord !== undefined) out.ord = op.ord;
    if (op.type === "movePage" && out.ord === undefined) return { ok: false, error: "invalid-ord" };
    if (op.type === "setMeta") out.data = cleanMeta(op.data);
    if (op.type === "upsertPage") out.data = cleanPageProps(op.data, id);
    if (op.type === "upsertElement") {
      if (!isItemId(op.page)) return { ok: false, error: "invalid-page" };
      out.page = op.page;
      out.data = cleanElementData(op.data, id);
    }
    if (out.data) {
      if (bytesOf(out.data) > COLLAB.maxItemBytes) return { ok: false, error: "item-too-large" };
      const fields = cleanFields(op.fields, out.data);
      if (fields) out.fields = fields;
    }
    ops.push(out);
  }
  return { ok: true, ops };
}

/* ── the merge ─────────────────────────────────────────────────────────────── */

const KIND_OF = {
  setMeta: "meta",
  upsertPage: "page",
  movePage: "page",
  deletePage: "page",
  upsertElement: "el",
  deleteElement: "el",
};

/**
 * Apply validated ops to the current items. Pure: `state.items` (Map id → item) holds every item the ops touch
 * (plus every live element of a page being deleted); `state.pageCount` and `state.elCount` (Map pageId → n) are the
 * live counts. Nothing in `state` is mutated.
 *
 * @returns {{ results: object[], writes: Map<string, object> }} one result per op ({ i, id, status, reason?, item? }:
 *   status "applied" | "merged" | "rejected"; `item` is the authoritative item for merged and rejected ops), and
 *   every item to store, already stamped with `rev` and `by`.
 */
export function applyOps(state, ops, { rev, by }) {
  const items = new Map(state.items);
  const writes = new Map();
  let pageCount = state.pageCount || 0;
  const elCount = new Map(state.elCount || []);
  const results = [];
  const put = (item) => {
    const next = { ...item, rev, by };
    items.set(item.id, next);
    writes.set(item.id, next);
    return next;
  };
  const live = (it) => !!it && !it.deleted;
  const reject = (i, op, reason) => {
    const cur = items.get(op.id);
    results.push({ i, id: op.id, status: "rejected", reason, ...(cur ? { item: cur } : {}) });
  };

  ops.forEach((op, i) => {
    const kind = KIND_OF[op.type];
    const cur = items.get(op.id);
    if (cur && cur.kind !== kind) return reject(i, op, "wrong-kind");

    if (op.type === "deleteElement") {
      if (live(cur)) {
        put({ ...cur, data: null, deleted: true });
        elCount.set(cur.page, Math.max(0, (elCount.get(cur.page) || 1) - 1));
      }
      return results.push({ i, id: op.id, status: "applied" });
    }

    if (op.type === "deletePage") {
      if (live(cur)) {
        if (pageCount <= 1) return reject(i, op, "last-page");
        put({ ...cur, data: null, deleted: true });
        pageCount -= 1;
        for (const it of [...items.values()])
          if (it.kind === "el" && it.page === op.id && !it.deleted)
            put({ ...it, data: null, deleted: true });
        elCount.set(op.id, 0);
      }
      return results.push({ i, id: op.id, status: "applied" });
    }

    if (op.type === "movePage") {
      if (!live(cur)) return reject(i, op, cur ? "deleted" : "not-found");
      put({ ...cur, ord: op.ord });
      return results.push({ i, id: op.id, status: "applied" });
    }

    // Upserts: setMeta, upsertPage, upsertElement.
    if (cur?.deleted && op.baseRev < cur.rev) return reject(i, op, "deleted");
    if (kind === "el") {
      const page = items.get(op.page);
      if (!live(page))
        return reject(i, op, page?.deleted && op.baseRev < page.rev ? "page-deleted" : "no-page");
    }
    const fresh = !live(cur);
    if (fresh && kind === "page" && pageCount >= COLLAB.pages) return reject(i, op, "book-full");
    const targetPage = kind === "el" ? op.page : null;
    const movingIn = kind === "el" && (fresh || cur.page !== targetPage);
    if (movingIn && (elCount.get(targetPage) || 0) >= COLLAB.elementsPerPage)
      return reject(i, op, "page-full");

    const stale = !fresh && op.baseRev < cur.rev;
    let data = op.data;
    if (stale && op.fields) {
      data = { ...cur.data };
      for (const f of op.fields) data[f] = op.data[f];
      if (kind === "el") data = normalizeElement({ ...data, id: op.id });
    }
    const ord = op.ord !== undefined ? op.ord : (cur?.ord ?? 0);
    const next = put({
      id: op.id,
      kind,
      page: kind === "el" ? targetPage : "",
      ord: kind === "meta" ? 0 : ord,
      data,
      deleted: false,
    });
    if (kind === "page" && fresh) pageCount += 1;
    if (movingIn) {
      elCount.set(targetPage, (elCount.get(targetPage) || 0) + 1);
      if (!fresh) elCount.set(cur.page, Math.max(0, (elCount.get(cur.page) || 1) - 1));
    }
    results.push(
      stale && op.fields
        ? { i, id: op.id, status: "merged", item: next }
        : { i, id: op.id, status: "applied" },
    );
  });
  return { results, writes };
}

/** The live items in reading order: pages by ord, each page's elements by ord (ties broken by id). */
export function orderedBook(items) {
  const byOrd = (a, b) => a.ord - b.ord || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const list = [...items.values()].filter((it) => !it.deleted);
  const pages = list.filter((it) => it.kind === "page").sort(byOrd);
  return {
    meta: list.find((it) => it.kind === "meta")?.data || null,
    pages: pages.map((p) => ({
      id: p.id,
      ...p.data,
      elements: list
        .filter((it) => it.kind === "el" && it.page === p.id)
        .sort(byOrd)
        .map((it) => it.data),
    })),
  };
}

export const itemBytes = (data) => (data == null ? 0 : bytesOf(data));
