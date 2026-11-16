// Book Studio exports and imports. Everything is built in the browser from the same page renderer and document model:
//   • Print / PDF: one printed sheet per book page at the book's own page size (the browser's "Save as PDF" keeps
//     text as real, selectable text).
//   • EPUB 3: a reflowable, accessible e-book in reading order (text, picture descriptions, recordings, video).
//   • Cover image (PNG, or SVG where the browser will not rasterise HTML).
//   • Book project (.langbook): the book's JSON plus every picture and recording, to back up or move devices.
//   • Share link: the words, illustrations and drawings packed into a link (pictures and recordings stay here).
import { zipStore } from "../../../assets/lib/zip-store.js";
import * as db from "./db.js";
import {
  FORMATS,
  bookText,
  cloneWithNewIds,
  mediaIds,
  migrate,
  normalizeBook,
  plainText,
  readingOrder,
} from "./model.js";
import { artSrc, esc, pageHTML, preloadMedia } from "./render.js";
import { sanitizeHtml } from "./sanitize.js";

const BOOK_CSS = "/access-practice-lab/book-studio.css";
const EXT = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "text/vtt": "vtt",
};
const extFor = (type) => EXT[(type || "").split(";")[0]] || "bin";
const safeName = (s) =>
  String(s || "book")
    .replace(/[^\p{L}\p{N} _-]+/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 60) || "book";

export function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

// ── print / PDF ──────────────────────────────────────────────────────────────

/** Print the book (or save as PDF from the print dialog). Resolves after the dialog closes. */
export async function printBook(book, { lang = "en" } = {}) {
  await preloadMedia(book);
  const fmt = FORMATS[book.format];
  const host = document.createElement("div");
  host.className = "bk-print-root";
  host.innerHTML = `<style>@page { size: ${fmt.pageCss}; margin: 0 }</style>${book.pages.map((p, i) => `<section class="bk-print-sheet">${pageHTML(book, p, { mode: "print", lang, label: `${i + 1}` })}</section>`).join("")}`;
  document.body.append(host);
  document.documentElement.classList.add("bk-printing");
  const previous = document.title;
  document.title = book.title;
  await Promise.all(
    [...host.querySelectorAll("img")].map((img) =>
      img.complete ? null : new Promise((r) => ((img.onload = r), (img.onerror = r))),
    ),
  );
  await document.fonts?.ready;
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener("afterprint", done);
      host.remove();
      document.documentElement.classList.remove("bk-printing");
      document.title = previous;
      resolve();
    };
    window.addEventListener("afterprint", done);
    window.print();
    // Safari fires afterprint late or not at all; the print is captured synchronously, so clean up after a moment.
    setTimeout(() => document.documentElement.classList.contains("bk-printing") && done(), 1500);
  });
}

// ── cover image ──────────────────────────────────────────────────────────────

const blobToDataUrl = (blob) =>
  new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => resolve("");
    r.readAsDataURL(blob);
  });

async function inlineMedia(htmlStr) {
  const urls = [...new Set(htmlStr.match(/blob:[^"')\s]+/g) || [])];
  for (const u of urls) {
    try {
      const data = await blobToDataUrl(await (await fetch(u)).blob());
      htmlStr = htmlStr.split(u).join(data);
    } catch {}
  }
  return htmlStr;
}

/** The cover as a PNG Blob (2× width 1200px). Falls back to an SVG Blob where canvases refuse HTML drawings. */
export async function coverImage(book, { width = 1200 } = {}) {
  await preloadMedia(book);
  const fmt = FORMATS[book.format];
  const height = Math.round(width / fmt.ratio);
  const css = await fetch(BOOK_CSS)
    .then((r) => r.text())
    .catch(() => "");
  const body = await inlineMedia(pageHTML(book, book.pages[0], { mode: "print" }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject x="0" y="0" width="${width}" height="${height}"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px"><style>${css.replace(/<\//g, "<\\/")}</style><div class="bk-export-frame" style="width:${width}px">${body}</div></div></foreignObject></svg>`;
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  try {
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    c.getContext("2d").drawImage(img, 0, 0);
    URL.revokeObjectURL(url);
    const png = await new Promise((r) => c.toBlob(r, "image/png"));
    if (png) return { blob: png, ext: "png" };
  } catch {}
  return { blob: svgBlob, ext: "svg" };
}

// ── EPUB 3 ───────────────────────────────────────────────────────────────────

const x = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
/** The stored rich text as XHTML (void tags closed, named entities removed). */
const xhtmlOf = (html) =>
  sanitizeHtml(html)
    .replace(/<br>/g, "<br/>")
    .replace(/&nbsp;/g, "&#160;")
    .replace(/ data-c="(#[0-9a-fA-F]{3,8})"/g, ' style="color:$1"');

/** Build an EPUB 3 file. Returns { blob, notes } where notes lists what the format could not keep. */
export async function buildEpub(book, { lang = "en" } = {}) {
  const files = { mimetype: "application/epub+zip" };
  const notes = new Set();
  const manifest = [];
  const spine = [];
  const media = {};
  const addMedia = async (id) => {
    if (!id || media[id]) return media[id] || "";
    const row = await db.getMedia(id);
    if (!row?.blob) return "";
    const name = `media/${id}.${extFor(row.type)}`;
    files[`OEBPS/${name}`] = new Uint8Array(await row.blob.arrayBuffer());
    manifest.push(`<item id="${id}" href="${name}" media-type="${x(row.type.split(";")[0])}"/>`);
    media[id] = name;
    return name;
  };
  const artFiles = {};
  const addArt = (key) => {
    if (artFiles[key]) return artFiles[key];
    const svg = decodeURIComponent(artSrc(key).replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
    if (!svg) return "";
    const name = `art/${key}.svg`;
    files[`OEBPS/${name}`] = svg;
    manifest.push(`<item id="art-${key}" href="${name}" media-type="image/svg+xml"/>`);
    artFiles[key] = name;
    return name;
  };
  const cover = await coverImage(book, { width: 900 }).catch(() => null);
  if (cover) {
    files[`OEBPS/cover.${cover.ext}`] = new Uint8Array(await cover.blob.arrayBuffer());
    manifest.push(
      `<item id="cover-image" href="cover.${cover.ext}" media-type="${cover.ext === "png" ? "image/png" : "image/svg+xml"}" properties="cover-image"/>`,
    );
  }
  const bookLang = book.lang === "es" ? "es" : "en";
  for (const [i, page] of book.pages.entries()) {
    const parts = [];
    if (page.bgArt)
      notes.add(
        "Page background pictures are left out of the e-book; pictures and illustrations on the page are kept.",
      );
    if (page.narration) {
      const src = await addMedia(page.narration);
      if (src) parts.push(`<p><audio controls="controls" src="${src}">Page narration</audio></p>`);
    }
    for (const el of readingOrder(page, book.dir)) {
      const lng = el.style?.lang
        ? ` xml:lang="${x(el.style.lang)}" lang="${x(el.style.lang)}"`
        : "";
      const dir = el.style?.dir ? ` dir="${el.style.dir}"` : "";
      if (el.type === "text") {
        if (!plainText(el.html)) continue;
        const tag = el.role === "title" ? "h1" : el.role === "heading" ? "h2" : "div";
        parts.push(
          `<${tag} class="${el.role}"${lng}${dir}>${tag === "div" ? xhtmlOf(el.html) : x(plainText(el.html))}</${tag}>`,
        );
      } else if (el.type === "bubble") {
        if (plainText(el.html))
          parts.push(
            `<blockquote class="bubble ${el.variant}"${lng}${dir}>${xhtmlOf(el.html)}</blockquote>`,
          );
      } else if (el.type === "image") {
        const src = await addMedia(el.media);
        if (src)
          parts.push(
            `<figure><img src="${src}" alt="${x(el.alt)}"/>${el.caption ? `<figcaption>${x(el.caption)}</figcaption>` : ""}</figure>`,
          );
      } else if (el.type === "art") {
        const src = addArt(el.art);
        if (src) parts.push(`<figure class="art"><img src="${src}" alt="${x(el.alt)}"/></figure>`);
      } else if (el.type === "audio") {
        const src = await addMedia(el.media);
        if (src)
          parts.push(
            `<figure class="audio"><audio controls="controls" src="${src}">${x(el.label)}</audio><figcaption>${x(el.label)}${el.transcript ? `: ${x(el.transcript)}` : ""}</figcaption></figure>`,
          );
      } else if (el.type === "video") {
        if (el.embed) {
          parts.push(
            `<p><a href="https://www.youtube.com/watch?v=${el.embed.id}">${x(el.title || "Video")} (YouTube)</a></p>`,
          );
          notes.add("YouTube videos become links in the e-book.");
          continue;
        }
        const src = await addMedia(el.media);
        const poster = await addMedia(el.poster);
        const track = await addMedia(el.captions);
        if (src)
          parts.push(
            `<figure class="video"><video controls="controls" src="${src}"${poster ? ` poster="${poster}"` : ""}>${track ? `<track kind="captions" src="${track}" srclang="${bookLang}" label="Captions" default="default"/>` : ""}${x(el.title)}</video>${el.title ? `<figcaption>${x(el.title)}</figcaption>` : ""}</figure>`,
          );
      }
    }
    if (page.elements.some((e) => e.type === "drawing" && e.strokes.length)) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">${page.elements
        .filter((e) => e.type === "drawing")
        .flatMap((e) =>
          e.strokes.map(
            (s) =>
              `<polyline fill="none" stroke="${s.color}" stroke-width="${s.size * 5}" stroke-linecap="round" stroke-linejoin="round" points="${s.pts.map((p) => `${(e.x * 10 + (p[0] * e.w) / 100).toFixed(0)},${(e.y * 10 + (p[1] * e.h) / 100).toFixed(0)}`).join(" ")}"/>`,
          ),
        )
        .join("")}</svg>`;
      const name = `art/drawing-${page.id}.svg`;
      files[`OEBPS/${name}`] = svg;
      manifest.push(`<item id="drawing-${page.id}" href="${name}" media-type="image/svg+xml"/>`);
      parts.push(
        `<figure class="drawing"><img src="${name}" alt="A drawing by the author"/></figure>`,
      );
    }
    if (page.elements.some((e) => e.type === "shape" || e.type === "panel"))
      notes.add(
        "Shapes and comic panel borders are part of the page design and are not repeated in the e-book.",
      );
    const name = `page-${String(i + 1).padStart(3, "0")}.xhtml`;
    files[`OEBPS/${name}`] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${bookLang}" lang="${bookLang}"${book.dir === "rtl" ? ' dir="rtl"' : ""}>
<head><meta charset="UTF-8"/><title>${x(book.title)} · ${i === 0 ? "Cover" : `Page ${i + 1}`}</title><link rel="stylesheet" href="book.css"/></head>
<body${i === 0 ? ' epub:type="cover"' : ""}><section id="p${i + 1}" style="background:${page.bg}" aria-label="${i === 0 ? "Cover" : `Page ${i + 1}`}">${parts.join("\n") || "<p></p>"}</section></body></html>`;
    manifest.push(`<item id="p${i + 1}" href="${name}" media-type="application/xhtml+xml"/>`);
    spine.push(`<itemref idref="p${i + 1}"/>`);
  }
  files["OEBPS/book.css"] =
    `body{font-family:"Atkinson Hyperlegible",system-ui,sans-serif;line-height:1.5;margin:0;padding:1em}section{padding:1em;border-radius:.5em}h1{font-family:Georgia,serif;font-size:2em;text-align:center}h2{font-family:Georgia,serif}figure{margin:1em 0;text-align:center}img,video{max-width:100%;height:auto}figure.art img{max-height:40vh}blockquote.bubble{border:2px solid #1b1f3b;border-radius:1em;padding:.6em 1em;margin:1em 0;background:#fff}blockquote.thought{border-style:dashed}blockquote.caption{border-radius:0;background:#fff3c4}.caption{font-size:.9em}figcaption{font-size:.9em;color:#3b3f5c}`;
  manifest.push('<item id="css" href="book.css" media-type="text/css"/>');
  files["OEBPS/nav.xhtml"] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${bookLang}" lang="${bookLang}"><head><meta charset="UTF-8"/><title>${x(book.title)}</title></head>
<body><nav epub:type="toc" id="toc"><h1>${x(book.title)}</h1><ol>${book.pages.map((_, i) => `<li><a href="page-${String(i + 1).padStart(3, "0")}.xhtml">${i === 0 ? "Cover" : `Page ${i + 1}`}</a></li>`).join("")}</ol></nav>
<nav epub:type="page-list" hidden="hidden"><ol>${book.pages.map((_, i) => `<li><a href="page-${String(i + 1).padStart(3, "0")}.xhtml#p${i + 1}">${i + 1}</a></li>`).join("")}</ol></nav></body></html>`;
  manifest.push(
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
  );
  const modes = new Set(["textual"]);
  if (Object.keys(media).length || Object.keys(artFiles).length) modes.add("visual");
  if (book.pages.some((p) => p.narration || p.elements.some((e) => e.type === "audio" && e.media)))
    modes.add("auditory");
  files["OEBPS/content.opf"] = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="uid" xml:lang="${bookLang}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="uid">urn:uuid:${uuidFrom(book.id)}</dc:identifier>
<dc:title>${x(book.title)}</dc:title>
<dc:creator>${x(book.author || "Student author")}</dc:creator>
<dc:language>${bookLang}</dc:language>
<dc:publisher>Book Studio · The Language Page</dc:publisher>
<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</meta>
${[...modes].map((m) => `<meta property="schema:accessMode">${m}</meta>`).join("\n")}
<meta property="schema:accessModeSufficient">textual</meta>
<meta property="schema:accessibilityFeature">alternativeText</meta>
<meta property="schema:accessibilityFeature">readingOrder</meta>
<meta property="schema:accessibilityFeature">tableOfContents</meta>
<meta property="schema:accessibilityHazard">none</meta>
<meta property="schema:accessibilitySummary">A reflowable e-book in reading order. Pictures carry the descriptions the author wrote; recordings carry written transcripts where the author added them.</meta>
</metadata>
<manifest>${manifest.join("\n")}</manifest>
<spine${book.dir === "rtl" ? ' page-progression-direction="rtl"' : ""}>${spine.join("")}</spine>
</package>`;
  files["META-INF/container.xml"] =
    `<?xml version="1.0" encoding="UTF-8"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>`;
  const missingAlt = book.pages
    .flatMap((p) => p.elements)
    .filter((e) => (e.type === "image" || e.type === "art") && !e.alt).length;
  if (missingAlt)
    notes.add(
      `${missingAlt} picture(s) have no description yet, so screen-reader users will not know what they show.`,
    );
  notes.add(
    "E-books flow text to fit the reader's screen, so the exact page layout is not kept. Use Print / PDF for the exact layout.",
  );
  return { blob: new Blob([zipStore(files)], { type: "application/epub+zip" }), notes: [...notes] };
}

function uuidFrom(id) {
  let h = "";
  for (let i = 0; h.length < 32; i++)
    h += ((id.charCodeAt(i % id.length) * (i + 7)) % 16).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

// ── book project (.langbook) ─────────────────────────────────────────────────

export async function exportProject(book) {
  const files = {
    "book.json": JSON.stringify(
      { app: "book-studio", format: 1, exportedAt: new Date().toISOString(), book },
      null,
      1,
    ),
  };
  const index = {};
  for (const id of mediaIds(book)) {
    const row = await db.getMedia(id);
    if (!row?.blob) continue;
    const name = `media/${id}.${extFor(row.type)}`;
    files[name] = new Uint8Array(await row.blob.arrayBuffer());
    index[id] = { file: name, type: row.type, kind: row.kind, name: row.name };
  }
  files["media.json"] = JSON.stringify(index);
  return new Blob([zipStore(files)], { type: "application/zip" });
}

/** Read a ZIP (stored or deflated entries) into { name: Uint8Array }. */
export async function readZip(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--)
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  if (eocd < 0) throw new Error("not-a-zip");
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out = {};
  const dec = new TextDecoder();
  for (let n = 0; n < count; n++) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error("bad-zip");
    const method = view.getUint16(p + 10, true);
    const csize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const local = view.getUint32(p + 42, true);
    const name = dec.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (name.includes("..") || name.startsWith("/")) continue;
    const lNameLen = view.getUint16(local + 26, true);
    const lExtraLen = view.getUint16(local + 28, true);
    const data = bytes.subarray(
      local + 30 + lNameLen + lExtraLen,
      local + 30 + lNameLen + lExtraLen + csize,
    );
    if (method === 0) out[name] = data;
    else if (method === 8 && typeof DecompressionStream !== "undefined")
      out[name] = new Uint8Array(
        await new Response(
          new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")),
        ).arrayBuffer(),
      );
  }
  return out;
}

/** Import a .langbook (or a book.json). Always creates a NEW book on this device (ids are renewed). */
export async function importProject(file) {
  if (file.size > 300 * 1024 * 1024) throw new Error("too-big");
  const buf = await file.arrayBuffer();
  let json;
  let entries = {};
  if (new Uint8Array(buf.slice(0, 2))[0] === 0x50) {
    entries = await readZip(buf);
    json = JSON.parse(new TextDecoder().decode(entries["book.json"] || new Uint8Array()));
  } else json = JSON.parse(new TextDecoder().decode(buf));
  const raw = json.book || json;
  const book = cloneWithNewIds(migrate(raw), { status: "draft" });
  // Sanitize every text on the way in.
  for (const p of book.pages) for (const e of p.elements) if (e.html) e.html = sanitizeHtml(e.html);
  const index = entries["media.json"]
    ? JSON.parse(new TextDecoder().decode(entries["media.json"]))
    : {};
  const remap = {};
  for (const [oldId, meta] of Object.entries(index)) {
    const data = entries[meta.file];
    if (!data || !/^(image|audio|video|text\/vtt)/.test(meta.type || "")) continue;
    remap[oldId] = await db.putMedia(book.id, new Blob([data], { type: meta.type }), {
      name: meta.name,
      kind: meta.kind,
    });
  }
  const fix = (id) => remap[id] || "";
  for (const p of book.pages) {
    p.narration = fix(p.narration);
    for (const e of p.elements)
      for (const k of ["media", "poster", "captions"]) if (e[k]) e[k] = fix(e[k]);
  }
  book.feedback = (raw.feedback || []).map((f) => {
    const oldIndex = (raw.pages || []).findIndex((pg) => pg.id === f.pageId);
    return { ...f, pageId: book.pages[oldIndex]?.id || "" };
  });
  book.title = book.title.slice(0, 80);
  return db.saveBook(normalizeBook(book));
}

// ── share link ───────────────────────────────────────────────────────────────

const unb64url = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function deflate(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Response(stream).text();
}

/** A read-only link carrying the book's words, illustrations and drawings (no uploaded media, no teacher notes). */
export async function shareLink(book, origin = location.origin) {
  const slim = JSON.parse(JSON.stringify(book));
  delete slim.feedback;
  delete slim.submission;
  delete slim.review;
  let dropped = 0;
  for (const p of slim.pages) {
    if (p.narration) dropped++;
    p.narration = "";
    p.elements = p.elements.filter((e) => {
      if (["image", "audio"].includes(e.type) && e.media) dropped++;
      if (e.type === "video" && e.media) dropped++;
      return !(["image", "audio"].includes(e.type) || (e.type === "video" && !e.embed));
    });
    delete p.prompt;
    delete p.frames;
  }
  const bin = await deflate(JSON.stringify(slim));
  let encoded = "";
  for (let i = 0; i < bin.length; i += 3 * 4096)
    encoded += btoa(String.fromCharCode(...bin.subarray(i, i + 3 * 4096)));
  encoded = encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return {
    url: `${origin}/access-practice-lab/book-studio/shared#b=${encoded}`,
    dropped,
    bytes: encoded.length,
  };
}

/** Open a shared link's book (hash fragment, never sent to a server). */
export async function readShared(hash) {
  const m = /[#&]b=([\w-]+)/.exec(hash || "");
  if (!m) return null;
  const book = migrate(JSON.parse(await inflate(unb64url(m[1]))));
  for (const p of book.pages) for (const e of p.elements) if (e.html) e.html = sanitizeHtml(e.html);
  return book;
}

export const fileBase = (book) => safeName(book.title);

/** The book as plain text for the teacher's review queue (capped by the class API at 4,000 characters). */
export function reviewText(book) {
  const text = bookText(book);
  return text.length > 3900 ? `${text.slice(0, 3880)}\n…` : text;
}

export { esc };
