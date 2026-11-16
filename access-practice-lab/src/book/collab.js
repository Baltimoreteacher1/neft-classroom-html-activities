// Book Studio: writing a book together with classmates (BOOK-STUDIO.md "Writing together"). Server:
// functions/_lib/class-platform/books.js (/api/class/books/*); merge rules: shared/class-platform/book-merge.js;
// the device half of the merge: collab-model.js.
//
// Only a learner who joined a class (/class) can share or join, and only inside that class. Every copy stays a
// normal Book Studio book on the device (it still autosaves, works offline and keeps Version history); the shared copy
// on the class server is the meeting point. While the editor is open and the tab is visible the device syncs every
// two seconds (polling, not instant); a hidden tab checks every fifteen. Pictures travel as small JPEGs; recordings
// and videos stay on the device that made them. Without the class server (503) solo Book Studio is unchanged.
import { API, request, studentHeaders } from "../../../shared/class-platform/client.js";
import { COLLAB } from "../../../shared/class-platform/book-merge.js";
import { loadLink } from "../class/link.js";
import { BASE } from "../util.js";
import {
  applyItems,
  bookFromItems,
  clientItem,
  diffBook,
  metaOf,
  pendingIds,
  shadowAfterOp,
} from "./collab-model.js";
import * as db from "./db.js";
import { bkIcon } from "./icons.js";
import { newId, normalizeBook } from "./model.js";
import { esc } from "./render.js";
import { sanitizeHtml } from "./sanitize.js";

/* ── network ─────────────────────────────────────────────────────────────── */

export function booksApi(link, fetchImpl = (...a) => fetch(...a)) {
  const headers = studentHeaders(link);
  const get = (path) => request(fetchImpl, `books/${path}`, { headers });
  const post = (path, body) =>
    request(fetchImpl, `books/${path}`, {
      method: "POST",
      headers,
      body: { code: link.code, ...body },
    });
  return {
    mine: () => get(`mine?code=${link.code}`),
    share: (meta) => post("share", { meta }),
    join: (bookCode) => post("join", { bookCode }),
    sync: (body) => post("sync", body),
    member: (bookId, studentId, change) => post("member", { bookId, studentId, ...change }),
    leave: (bookId) => post("leave", { bookId }),
    unshare: (bookId) => post("unshare", { bookId }),
    upload: (bookId, mediaId, data) => post("media", { bookId, mediaId, mime: "image/jpeg", data }),
    async picture(bookId, mediaId) {
      try {
        const res = await fetchImpl(
          `${API}/books/media?code=${link.code}&bookId=${bookId}&mediaId=${encodeURIComponent(mediaId)}`,
          { headers, credentials: "same-origin" },
        );
        return res.ok ? await res.blob() : null;
      } catch {
        return null;
      }
    },
  };
}

/** Plain-language reason for every error the books routes return. */
export function collabErrorText(tr, code, status) {
  if (status === 503 || code === "backend-not-configured")
    return tr(
      "Writing together is not available on this site right now. Your book still saves on this device.",
      "Escribir juntos no está disponible en este sitio ahora. Tu libro se sigue guardando en este dispositivo.",
    );
  const map = {
    "collab-off": tr(
      "Your teacher turned off writing together for this class.",
      "Tu docente desactivó escribir juntos en esta clase.",
    ),
    "book-not-found": tr(
      "No book in your class has that code. Check it with your classmate.",
      "Ningún libro de tu clase tiene ese código. Revísalo con tu compañero.",
    ),
    removed: tr(
      "Your teacher or the book's owner removed you from this book.",
      "Tu docente o el dueño del libro te quitó de este libro.",
    ),
    "not-member": tr(
      "You are no longer in this shared book.",
      "Ya no estás en este libro compartido.",
    ),
    "book-gone": tr(
      "This book is no longer shared with the class.",
      "Este libro ya no está compartido con la clase.",
    ),
    "too-many-books": tr(
      `You can share up to ${COLLAB.maxBooksPerOwner} books at a time. Stop sharing one first.`,
      `Puedes compartir hasta ${COLLAB.maxBooksPerOwner} libros a la vez. Deja de compartir uno primero.`,
    ),
    "book-full": tr(
      `This book already has ${COLLAB.maxMembers} writers.`,
      `Este libro ya tiene ${COLLAB.maxMembers} escritores.`,
    ),
    "book-too-large": tr(
      "This book is too big to share. Remove some drawings or pages.",
      "Este libro es demasiado grande para compartir. Quita algunos dibujos o páginas.",
    ),
    unauthorized: tr(
      "Your class sign-in did not work. Sign in again in My class.",
      "No funcionó tu ingreso a la clase. Vuelve a entrar en Mi clase.",
    ),
    offline: tr(
      "No connection. Your changes are saved on this device and will be shared when you are back online.",
      "Sin conexión. Tus cambios se guardan en este dispositivo y se compartirán cuando vuelvas a estar en línea.",
    ),
    "rate limited": tr("Too many tries. Wait a minute.", "Demasiados intentos. Espera un minuto."),
  };
  return (
    map[code] ||
    tr(
      "Could not reach your class. Your book is safe on this device.",
      "No se pudo conectar con tu clase. Tu libro está seguro en este dispositivo.",
    )
  );
}

/* ── pictures ────────────────────────────────────────────────────────────── */

/** Any picture → a JPEG no larger than 1200 px on its long side and 350 KB (never upscaled). */
export async function shareableJpeg(blob) {
  const bitmap = await createImageBitmap(blob);
  try {
    for (let side = COLLAB.maxPictureSide; side >= 300; side = Math.round(side * 0.75)) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(bitmap.width * scale));
      c.height = Math.max(1, Math.round(bitmap.height * scale));
      const g = c.getContext("2d");
      g.fillStyle = "#ffffff"; // transparent PNG areas become white, not black
      g.fillRect(0, 0, c.width, c.height);
      g.drawImage(bitmap, 0, 0, c.width, c.height);
      for (const q of [0.82, 0.68, 0.55]) {
        const out = await new Promise((r) => c.toBlob(r, "image/jpeg", q));
        if (out && out.size <= COLLAB.maxPictureBytes) return out;
      }
    }
  } finally {
    bitmap.close?.();
  }
  return null;
}

async function toBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

/* ── presence colours and initials ───────────────────────────────────────── */

export const PEER_COLORS = 6;
export const peerColor = (studentId) => {
  let h = 0;
  for (const c of String(studentId)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % PEER_COLORS;
};
export const initials = (alias) => {
  const words = String(alias || "?").trim().split(/\s+/);
  return (words.length > 1 ? words.map((w) => w[0]).join("") : words[0]).slice(0, 2).toUpperCase();
};

/* ── loading a shared book onto this device ──────────────────────────────── */

/** Every item of a shared book, page after page of changes. */
async function fullLoad(api, bookId, presence) {
  const items = [];
  let since = 0;
  let res;
  for (let n = 0; n < 50; n++) {
    res = await api.sync({ bookId, since, presence });
    if (!res.ok) return res;
    items.push(...res.items);
    since = res.next;
    if (!res.more) break;
  }
  return { ...res, items, rev: since };
}

/** Download the shared pictures this device does not have yet. */
async function fetchPictures(api, bookId, book, onServer) {
  const want = new Set();
  for (const p of book.pages)
    for (const e of p.elements)
      if (e.type === "image" && e.media && onServer.has(e.media)) want.add(e.media);
  let got = 0;
  for (const id of want) {
    if (await db.getMedia(id)) continue;
    const blob = await api.picture(bookId, id);
    if (blob) {
      await db.putMediaWithId(id, book.id, blob);
      await db.mediaUrl(id);
      got++;
    }
  }
  return got;
}

/** Join a classmate's book by its code, or open a shared book that is not on this device yet. Returns the local id. */
export async function openSharedBook({ bookCode, bookId } = {}) {
  const link = loadLink();
  if (!link) return { ok: false, error: "no-class" };
  const api = booksApi(link);
  let id = bookId;
  let code = "";
  if (bookCode) {
    const joined = await api.join(bookCode);
    if (!joined.ok) return joined;
    id = joined.bookId;
    code = joined.bookCode;
  }
  const mine = (await db.listBooks()).find((b) => b.collab?.bookId === id);
  if (mine) return { ok: true, localId: mine.id };
  const all = await fullLoad(api, id, {});
  if (!all.ok) return all;
  const items = all.items.map((i) => clientItem(i, sanitizeHtml));
  const meta = items.find((i) => i.kind === "meta")?.data || {};
  const book = normalizeBook({
    ...bookFromItems(items, {}),
    ...meta,
    id: newId("b"),
    source: { kind: "class", id, label: "Shared with my class" },
    collab: { code: link.code, bookId: id, bookCode: code || all.bookCode || "", lastRev: all.rev },
  });
  const saved = await db.saveBook(book);
  await fetchPictures(api, id, saved, new Set(all.media || []));
  return { ok: true, localId: saved.id };
}

/** Share this book with the class (the learner pressed the button). */
export async function shareBook(E) {
  const link = loadLink();
  if (!link) return { ok: false, error: "no-class" };
  const { core } = E;
  const res = await booksApi(link).share(metaOf(core.S.book));
  if (!res.ok) return res;
  core.S.book.collab = {
    code: link.code,
    bookId: res.bookId,
    bookCode: res.bookCode,
    lastRev: res.rev,
  };
  core.commit({ history: false, remote: true });
  await core.saveNow();
  E.collab?.stop();
  E.collab = attachCollab(E);
  await E.collab.ready;
  return res;
}

/* ── the live session inside the editor ──────────────────────────────────── */

export function attachCollab(E) {
  const { core } = E;
  const S = core.S;
  const tr = E.I.S;
  const link = loadLink();
  const bar = E.$("[data-bk-collab]");
  const st = {
    shadow: new Map(),
    since: 0,
    role: "",
    owner: false,
    locked: false,
    members: [],
    presence: [],
    media: new Set(),
    failedMedia: new Set(),
    deferred: new Map(),
    state: "connecting",
    error: "",
    notice: "",
    busy: false,
    timer: 0,
    nudgeTimer: 0,
    stopped: false,
    loaded: false,
    pointer: false,
  };
  const bookId = S.book.collab?.bookId;
  const api = link ? booksApi(link) : null;
  const aliasOf = (id) =>
    st.members.find((m) => m.studentId === id)?.alias || tr("a classmate", "un compañero");
  const canEdit = () => st.role === "owner" || st.role === "editor";

  if (!link || link.code !== S.book.collab?.code) {
    st.state = "no-class";
    render();
    return { stop() {}, decorate() {}, idle() {}, nudge() {}, state: st };
  }

  const presence = () => ({
    pageId: core.page()?.id || "",
    selected: S.selected || "",
    editing: !!S.editingText,
  });

  function setReadOnly(on) {
    if (S.readOnly === on) return;
    S.readOnly = on;
    if (on && S.editingText) E.endTextEdit?.();
    const root = E.$("[data-bk-editor]");
    root.toggleAttribute("data-readonly", on);
    for (const sel of [".bk-addbar", "[data-bk-inspector]", "[data-bk-canvas]"])
      E.$(sel)?.toggleAttribute("inert", on);
    const title = E.$("[data-bk-title]");
    if (title) title.readOnly = on;
  }

  function detach(code) {
    stop();
    S.book.collab = null;
    core.commit({ history: false, remote: true });
    setReadOnly(false);
    st.state = "detached";
    st.error = code;
    render();
    E.banner(
      `<p>${bkIcon("book")} <strong>${esc(collabErrorText(tr, code))}</strong> ${esc(tr("Your copy stays in My books on this device.", "Tu copia se queda en Mis libros en este dispositivo."))}</p>`,
    );
  }

  /** Server items (client shape) → the book, rebasing undo; returns how many changed. */
  function writeIntoBook(items, before) {
    if (!items.length) return;
    core.applyRemote((book) => applyItems(book, items, before));
  }

  async function uploadPictures(ops) {
    for (const op of ops) {
      const media = op.type === "upsertElement" && op.data?.type === "image" ? op.data.media : "";
      if (!media || st.media.has(media) || st.failedMedia.has(media)) continue;
      const row = await db.getMedia(media);
      if (!row?.blob) continue; // a classmate's picture this device never had: theirs to share
      const jpeg = await shareableJpeg(row.blob).catch(() => null);
      const res = jpeg
        ? await api.upload(bookId, media, await toBase64(jpeg))
        : { ok: false, error: "invalid-picture" };
      if (res.ok) st.media.add(media);
      else if (res.error !== "offline") {
        st.failedMedia.add(media);
        st.notice =
          res.error === "too-many-pictures"
            ? tr(
                `Only ${COLLAB.maxPictures} pictures can be shared in one book. This picture stays on your device.`,
                `Solo se pueden compartir ${COLLAB.maxPictures} imágenes en un libro. Esta imagen se queda en tu dispositivo.`,
              )
            : tr(
                "A picture could not be shared. It stays on your device.",
                "No se pudo compartir una imagen. Se queda en tu dispositivo.",
              );
      } else return false;
    }
    return true;
  }

  function takeResponse(res) {
    st.role = res.role;
    st.owner = res.owner;
    st.locked = res.locked;
    st.members = res.members || [];
    st.presence = res.presence || [];
    st.media = new Set([...st.media, ...(res.media || [])]);
    setReadOnly(!canEdit());
  }

  async function firstLoad() {
    const all = await fullLoad(api, bookId, presence());
    if (!all.ok) return all;
    takeResponse(all);
    const items = all.items.map((i) => clientItem(i, sanitizeHtml));
    const lastRev = S.book.collab.lastRev || 0;
    // Items this device had already seen are the baseline; anything newer was changed by a classmate since.
    const seen = new Map(items.filter((i) => i.rev <= lastRev).map((i) => [i.id, i]));
    for (const it of items) st.shadow.set(it.id, it);
    const newer = items.filter((i) => i.rev > lastRev);
    if (newer.length && lastRev > 0)
      await db
        .saveVersion(
          S.book,
          tr("My copy before syncing with the class", "Mi copia antes de sincronizar con la clase"),
        )
        .catch(() => {});
    writeIntoBook(newer, seen);
    st.since = all.rev;
    S.book.collab.lastRev = all.rev;
    if (await fetchPictures(api, bookId, S.book, st.media)) E.renderAll();
    st.loaded = true;
    return all;
  }

  async function tick() {
    if (st.busy || st.stopped) return;
    st.busy = true;
    let again = false;
    try {
      if (!st.loaded) {
        const r = await firstLoad();
        if (!r.ok) return fail(r);
      }
      let ops = canEdit() ? diffBook(st.shadow, S.book) : [];
      if (!canEdit() && diffBook(st.shadow, S.book).length) {
        // A viewer's device returns to the shared copy (the editor already refuses changes).
        const fix = [...st.shadow.values()];
        writeIntoBook(fix, new Map());
      }
      if (ops.length && !(await uploadPictures(ops))) return fail({ error: "offline" });
      if (ops.length > COLLAB.maxOpsPerSync) {
        ops = ops.slice(0, COLLAB.maxOpsPerSync);
        again = true;
      }
      const res = await api.sync({ bookId, since: st.since, ops, presence: presence() });
      if (!res.ok) return fail(res);
      takeResponse(res);
      // 1. What happened to this device's ops.
      const before = new Map(st.shadow);
      const back = [];
      for (const r of res.results || []) {
        const op = ops[r.i];
        if (r.status === "applied") shadowAfterOp(st.shadow, op, res.opsRev, link.studentId);
        else {
          // Merged or refused: the server's copy is the truth; one it does not have is removed here.
          const it = r.item
            ? clientItem(r.item, sanitizeHtml)
            : { id: op.id, kind: kindOf(op), deleted: true, data: null };
          if (r.item) st.shadow.set(it.id, it);
          back.push(it);
        }
      }
      // 2. Classmates' changes since the last sync.
      if (res.resync) {
        st.loaded = false;
        again = true;
        return;
      }
      const incoming = (res.items || [])
        .filter((i) => !(res.opsRev && i.rev === res.opsRev))
        .map((i) => clientItem(i, sanitizeHtml));
      const pending = pendingIds(st.shadow, S.book);
      const apply = [...back];
      let hold = Number.POSITIVE_INFINITY;
      for (const it of incoming) {
        if (pending.has(it.id) && st.shadow.has(it.id)) {
          hold = Math.min(hold, it.rev - 1); // this device's unsent edit goes first; the server merges it
          continue;
        }
        if (it.id === S.editingText) {
          st.deferred.set(it.id, it); // never re-render the box someone is typing in
          st.notice = tr(
            `${aliasOf(it.by)} also changed this box. Their change will show when you finish typing.`,
            `${aliasOf(it.by)} también cambió este cuadro. Su cambio aparecerá cuando termines de escribir.`,
          );
          hold = Math.min(hold, it.rev - 1);
          continue;
        }
        st.shadow.set(it.id, it);
        apply.push(it);
      }
      if (!st.pointer) writeIntoBook(apply, before);
      else {
        // Mid-drag: keep the shadow as it was and fetch these again next time.
        for (const it of apply)
          if (before.has(it.id)) st.shadow.set(it.id, before.get(it.id));
          else st.shadow.delete(it.id);
        hold = Math.min(hold, st.since);
      }
      st.since = res.more ? res.next : res.rev;
      if (!st.pointer) S.book.collab.lastRev = Math.min(st.since, hold);
      if (res.more) again = true;
      st.state = "synced";
      st.error = "";
      if (apply.some((i) => i.kind === "el" && i.data?.type === "image"))
        fetchPictures(api, bookId, S.book, st.media).then((n) => n && E.renderCanvas());
    } catch (error) {
      console.error("[book-collab]", error);
      st.state = "error";
    } finally {
      st.busy = false;
      render();
      decorate();
      schedule(again ? 50 : undefined);
    }
  }

  const kindOf = (op) =>
    op.type === "setMeta" ? "meta" : op.type.endsWith("Element") ? "el" : "page";

  function fail(res) {
    const terminal = ["book-gone", "not-member", "removed"];
    if (terminal.includes(res.error)) return detach(res.error);
    st.state = res.error === "offline" ? "offline" : res.error === "collab-off" ? "off" : "error";
    st.error = res.error;
    st.errorStatus = res.httpStatus;
    if (res.error === "collab-off" || res.httpStatus === 503) setReadOnly(false);
  }

  function schedule(ms) {
    clearTimeout(st.timer);
    if (st.stopped) return;
    const wait =
      ms ?? (document.hidden ? COLLAB.hiddenPollMs : st.state === "offline" ? 6000 : COLLAB.pollMs);
    st.timer = setTimeout(tick, wait);
  }

  function nudge() {
    clearTimeout(st.nudgeTimer);
    st.nudgeTimer = setTimeout(() => (st.busy ? schedule(300) : tick()), 500);
  }

  /** The learner left the box they were typing in: show what classmates changed there meanwhile. */
  function idle() {
    if (!st.deferred.size) return;
    const pending = pendingIds(st.shadow, S.book);
    const before = new Map(st.shadow);
    const apply = [];
    for (const [id, it] of st.deferred) {
      if (id === S.editingText) continue;
      st.deferred.delete(id);
      if (pending.has(id)) continue; // their words and this learner's merge on the server; the result comes back
      st.shadow.set(id, it);
      apply.push(it);
    }
    st.notice = "";
    writeIntoBook(apply, before);
    render();
  }

  const onVisible = () => !document.hidden && schedule(0);
  const onDown = (e) => {
    if (e.target.closest?.("[data-bk-canvas]")) st.pointer = true;
  };
  const onUp = () => {
    if (!st.pointer) return;
    st.pointer = false;
    nudge();
  };
  document.addEventListener("visibilitychange", onVisible);
  E.root.addEventListener("pointerdown", onDown, true);
  window.addEventListener("pointerup", onUp, true);
  window.addEventListener("pointercancel", onUp, true);

  function stop() {
    st.stopped = true;
    clearTimeout(st.timer);
    clearTimeout(st.nudgeTimer);
    document.removeEventListener("visibilitychange", onVisible);
    E.root.removeEventListener("pointerdown", onDown, true);
    window.removeEventListener("pointerup", onUp, true);
    window.removeEventListener("pointercancel", onUp, true);
  }

  /** Soft locks and who-is-where marks on the canvas and the page list (attributes only; CSS draws them). */
  function decorate() {
    const root = E.root;
    for (const n of root.querySelectorAll("[data-bk-peer]")) {
      n.removeAttribute("data-bk-peer");
      n.removeAttribute("data-bk-peer-c");
      n.removeAttribute("data-bk-peer-editing");
    }
    for (const n of root.querySelectorAll("[data-bk-peers]")) n.removeAttribute("data-bk-peers");
    const pageId = core.page()?.id;
    const byPage = new Map();
    for (const p of st.presence) {
      byPage.set(p.pageId, [...(byPage.get(p.pageId) || []), initials(p.alias)]);
      if (p.pageId !== pageId || !p.selected) continue;
      const node = root.querySelector(
        `[data-bk-canvas] .bk-el[data-el="${CSS.escape(p.selected)}"]`,
      );
      if (!node) continue;
      node.setAttribute("data-bk-peer", p.editing ? `${p.alias} ✎` : p.alias);
      node.setAttribute("data-bk-peer-c", String(peerColor(p.studentId)));
      if (p.editing) node.setAttribute("data-bk-peer-editing", "");
    }
    S.book.pages.forEach((p, i) => {
      const who = byPage.get(p.id);
      if (who)
        root
          .querySelector(`[data-page-index="${i}"]`)
          ?.setAttribute("data-bk-peers", who.join(" "));
    });
  }

  function render() {
    if (!bar) return;
    bar.hidden = false;
    const here = st.presence;
    const status =
      st.state === "no-class"
        ? tr(
            "Shared book: sign in to its class in My class to sync.",
            "Libro compartido: entra a su clase en Mi clase para sincronizar.",
          )
        : st.state === "connecting"
          ? tr("Connecting to your class…", "Conectando con tu clase…")
          : st.state === "offline"
            ? tr("Offline · saved on this device", "Sin conexión · guardado en este dispositivo")
            : st.state === "off" || st.state === "error"
              ? collabErrorText(tr, st.error, st.errorStatus)
              : st.state === "detached"
                ? tr("Not shared", "No compartido")
                : st.locked
                  ? tr(
                      "View only · your teacher set this book to read-only",
                      "Solo lectura · tu docente lo puso en solo lectura",
                    )
                  : st.role === "viewer"
                    ? tr("View only", "Solo ver")
                    : here.length
                      ? tr(
                          `Writing together · ${here.length + 1} here`,
                          `Escribiendo juntos · ${here.length + 1} aquí`,
                        )
                      : tr(
                          "Shared with your class · synced",
                          "Compartido con tu clase · sincronizado",
                        );
    const sel = S.selected ? st.shadow.get(S.selected) : null;
    const by =
      sel && sel.by && sel.by !== link?.studentId
        ? tr(`Last changed by ${aliasOf(sel.by)}`, `Último cambio de ${aliasOf(sel.by)}`)
        : "";
    const pageNo = (id) => S.book.pages.findIndex((p) => p.id === id) + 1;
    bar.dataset.state = st.state;
    bar.innerHTML = `<span class="bk-collab-status">${bkIcon(st.role === "viewer" || st.locked ? "eye" : "share")}<span>${esc(status)}</span></span>
      ${
        here.length
          ? `<ul class="bk-peers" aria-label="${esc(tr("Classmates in this book", "Compañeros en este libro"))}">${here
              .map((p) => {
                const where = pageNo(p.pageId);
                const label = `${p.alias}${where ? `, ${tr("page", "página")} ${where}` : ""}${p.editing ? `, ${tr("typing", "escribiendo")}` : ""}`;
                return `<li class="bk-peer" data-bk-peer-c="${peerColor(p.studentId)}" title="${esc(label)}"><span aria-hidden="true">${esc(initials(p.alias))}</span><span class="sr-only">${esc(label)}</span></li>`;
              })
              .join("")}</ul>`
          : ""
      }
      ${by ? `<span class="bk-collab-by">${esc(by)}</span>` : ""}
      ${st.notice ? `<span class="bk-collab-note" role="status">${esc(st.notice)}</span>` : ""}`;
  }

  render();
  let markReady;
  const ready = new Promise((r) => {
    markReady = r;
  });
  tick().finally(() => markReady());
  return {
    ready,
    stop,
    decorate,
    idle,
    nudge,
    state: st,
    refresh: () => schedule(0),
    api,
    bookId,
    renderBar: render,
  };
}

/* ── "Write together" in Share & export ──────────────────────────────────── */

export function collabSectionHTML(E) {
  const tr = E.I.S;
  const S = E.core.S;
  const link = loadLink();
  const c = S.book.collab;
  const st = E.collab?.state;
  const head = `<h3>${bkIcon("share")} ${esc(tr("Write together with my class", "Escribir junto con mi clase"))}</h3>`;
  const media = `<p class="fine">${esc(tr("Classmates who join can write and draw in this book with you. Pictures are shared as smaller copies; recordings and videos stay on the device that made them.", "Los compañeros que se unan pueden escribir y dibujar en este libro contigo. Las imágenes se comparten en copias más pequeñas; las grabaciones y los videos se quedan en el dispositivo que los hizo."))}</p>`;
  if (!link)
    return `<section class="bk-collab-share">${head}${media}<p class="fine">${esc(tr("Join your class first in My class. Only classmates in your class can join.", "Primero únete a tu clase en Mi clase. Solo pueden unirse compañeros de tu clase."))} <a href="${BASE}/class">${esc(tr("My class", "Mi clase"))}</a></p></section>`;
  if (!c)
    return `<section class="bk-collab-share">${head}${media}<button type="button" class="btn btn-primary" data-bk-dlg="collab-share">${esc(tr("Share with my class", "Compartir con mi clase"))}</button></section>`;
  const members = st?.members || [];
  const owner = !!st?.owner;
  const rows = members
    .map((m) => {
      const you = m.studentId === link.studentId;
      const role =
        m.role === "owner"
          ? tr("owner", "dueño")
          : m.role === "viewer"
            ? tr("can view", "puede ver")
            : tr("can edit", "puede editar");
      const controls =
        owner && !you && m.role !== "owner"
          ? `<button type="button" class="btn small" data-bk-dlg="collab-role" data-student="${esc(m.studentId)}" data-role="${m.role === "viewer" ? "editor" : "viewer"}">${esc(m.role === "viewer" ? tr("Let them edit", "Dejar editar") : tr("Make view only", "Solo ver"))}</button><button type="button" class="btn small ghost" data-bk-dlg="collab-remove" data-student="${esc(m.studentId)}">${esc(tr("Remove", "Quitar"))}</button>`
          : "";
      return `<li><span class="bk-peer" data-bk-peer-c="${peerColor(m.studentId)}" aria-hidden="true">${esc(initials(m.alias))}</span><span><strong>${esc(m.alias)}${you ? ` (${esc(tr("you", "tú"))})` : ""}</strong> · ${esc(role)} · ${esc(tr(`${m.edits} changes`, `${m.edits} cambios`))}</span>${controls}</li>`;
    })
    .join("");
  return `<section class="bk-collab-share">${head}
    <p>${esc(tr("Book code", "Código del libro"))}: <strong class="bk-collab-code">${esc(c.bookCode)}</strong></p>
    <p class="fine">${esc(tr("Classmates open Book Studio, choose “Join a classmate's book” and type this code.", "Tus compañeros abren Book Studio, eligen “Unirme al libro de un compañero” y escriben este código."))}</p>
    ${rows ? `<ul class="bk-collab-members">${rows}</ul>` : ""}
    ${media}
    ${st?.loaded ? "" : `<p class="fine">${esc(tr("Connecting to your class…", "Conectando con tu clase…"))}</p>`}
    <div class="bk-btnrow" ${st?.loaded ? "" : "hidden"}>${owner ? `<button type="button" class="btn ghost" data-bk-dlg="collab-unshare">${esc(tr("Stop sharing", "Dejar de compartir"))}</button>` : `<button type="button" class="btn ghost" data-bk-dlg="collab-leave">${esc(tr("Leave this shared book", "Salir de este libro compartido"))}</button>`}</div>
  </section>`;
}

/** Actions from the Collaborate section. Returns the status message to show. */
export async function onCollabAction(E, act, btn) {
  const tr = E.I.S;
  const S = E.core.S;
  if (act === "collab-share") {
    const res = await shareBook(E);
    return res.ok
      ? tr(
          `Shared. Your book code is ${res.bookCode}.`,
          `Compartido. El código de tu libro es ${res.bookCode}.`,
        )
      : collabErrorText(tr, res.error, res.httpStatus);
  }
  const c = E.collab;
  if (!c?.api) return collabErrorText(tr, "unauthorized");
  if (act === "collab-role" || act === "collab-remove") {
    const res = await c.api.member(
      c.bookId,
      btn.dataset.student,
      act === "collab-remove" ? { remove: true } : { role: btn.dataset.role },
    );
    c.refresh();
    await new Promise((r) => setTimeout(r, 400));
    return res.ok ? tr("Updated.", "Actualizado.") : collabErrorText(tr, res.error, res.httpStatus);
  }
  if (act === "collab-unshare" || act === "collab-leave") {
    const res =
      act === "collab-unshare" ? await c.api.unshare(c.bookId) : await c.api.leave(c.bookId);
    if (!res.ok) return collabErrorText(tr, res.error, res.httpStatus);
    c.stop();
    E.collab = null;
    S.book.collab = null;
    S.readOnly = false;
    E.core.commit({ history: false, remote: true });
    E.$("[data-bk-collab]").hidden = true;
    return tr(
      "This book is not shared anymore. Your copy stays on this device.",
      "Este libro ya no está compartido. Tu copia se queda en este dispositivo.",
    );
  }
  return "";
}

/* ── the bookshelf: "Shared with my class" ───────────────────────────────── */

export async function mountShelfCollab(box, ctx, I, localBooks) {
  const tr = I.S;
  const link = loadLink();
  box.hidden = false;
  const head = `<div class="bk-shelf-head"><h2 id="bkCollabH">${esc(tr("Shared with my class", "Compartidos con mi clase"))}</h2></div>`;
  if (!link) {
    box.innerHTML = `${head}<p class="fine">${esc(tr("Join your class in My class to write books together with classmates.", "Únete a tu clase en Mi clase para escribir libros junto con tus compañeros."))} <a href="${BASE}/class">${esc(tr("My class", "Mi clase"))}</a></p>`;
    return;
  }
  const api = booksApi(link);
  const joinForm = `<form class="bk-collab-join" data-collab-join><label class="bk-field"><span>${esc(tr("Join a classmate's book: book code", "Unirme al libro de un compañero: código del libro"))}</span><input name="bookCode" maxlength="8" autocomplete="off" autocapitalize="characters" spellcheck="false" data-nsr-ignore /></label><button type="submit" class="btn">${esc(tr("Join", "Unirme"))}</button></form><p class="bk-status" role="status" data-collab-status></p>`;
  const draw = async () => {
    const res = await api.mine();
    if (!res.ok) {
      box.innerHTML = `${head}<p class="fine">${esc(collabErrorText(tr, res.error, res.httpStatus))}</p>`;
      return;
    }
    if (!res.enabled) {
      box.innerHTML = `${head}<p class="fine">${esc(collabErrorText(tr, "collab-off"))}</p>`;
      return;
    }
    const local = new Map(localBooks.filter((b) => b.collab).map((b) => [b.collab.bookId, b]));
    const roleText = (b) =>
      b.owner
        ? tr("You shared it", "Tú lo compartiste")
        : b.role === "viewer"
          ? tr("View only", "Solo ver")
          : tr("You can edit", "Puedes editar");
    box.innerHTML = `${head}
      ${
        res.books.length
          ? `<ul class="bk-collab-list">${res.books
              .map((b) => {
                const mine = local.get(b.bookId);
                return `<li><span><strong>${esc(b.title)}</strong><br /><span class="fine">${esc(tr(`by ${b.ownerAlias}`, `de ${b.ownerAlias}`))} · ${esc(roleText(b))} · ${esc(tr("code", "código"))} ${esc(b.bookCode)}</span></span>${mine ? `<a class="btn small btn-primary" href="${BASE}/book-studio/edit/${mine.id}">${esc(tr("Open", "Abrir"))}</a>` : `<button type="button" class="btn small btn-primary" data-collab-open="${esc(b.bookId)}">${esc(tr("Open", "Abrir"))}</button>`}</li>`;
              })
              .join("")}</ul>`
          : `<p class="fine">${esc(tr("No shared books yet. Open a book, choose Share & export, then “Share with my class”.", "Todavía no hay libros compartidos. Abre un libro, elige Compartir y exportar y luego “Compartir con mi clase”."))}</p>`
      }
      ${joinForm}`;
  };
  const say = (msg) => {
    const s = box.querySelector("[data-collab-status]");
    if (s) s.textContent = msg;
  };
  const open = async (args) => {
    say(tr("Opening the shared book…", "Abriendo el libro compartido…"));
    const res = await openSharedBook(args);
    if (res.ok) ctx.navigate(`${BASE}/book-studio/edit/${res.localId}`);
    else say(collabErrorText(tr, res.error, res.httpStatus));
  };
  box.addEventListener("submit", (e) => {
    const form = e.target.closest("[data-collab-join]");
    if (!form) return;
    e.preventDefault();
    const code = form.bookCode.value.trim();
    if (code) open({ bookCode: code });
  });
  box.addEventListener("click", (e) => {
    const b = e.target.closest("[data-collab-open]");
    if (b) open({ bookId: b.dataset.collabOpen });
  });
  box.innerHTML = `${head}<p class="fine">${esc(tr("Checking your class…", "Revisando tu clase…"))}</p>`;
  await draw();
}
