// One renderer for a book page, used by the editor canvas, bookshelf covers, the reader, print/PDF and cover export.
// Output is an HTML string. Positions are percentages and sizes are container-query units (cqw), so the same markup
// is correct at every size. Media must be preloaded (preloadMedia) before rendering; render stays synchronous.
import { ART } from "./art.js";
import { FONTS, FORMATS, ROLE_DEFAULTS, pick, plainText } from "./model.js";
import { cachedUrl, mediaUrl } from "./db.js";
import { bkIcon } from "./icons.js";
import { markVocab } from "./lang/vocab-mark.js";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

const artCache = new Map();
const ART_BY_KEY = new Map(ART.map((a) => [a.key, a]));
export const artInfo = (key) => ART_BY_KEY.get(key) || null;
/** A data: URL for a built-in illustration (isolated: ids and styles inside one drawing cannot leak). */
export function artSrc(key) {
  if (artCache.has(key)) return artCache.get(key);
  const a = ART_BY_KEY.get(key);
  const src = a ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(a.svg)}` : "";
  artCache.set(key, src);
  return src;
}

/** Fetch object URLs for every media id in the book so rendering can stay synchronous. */
export async function preloadMedia(book) {
  const ids = new Set();
  for (const p of book.pages) {
    if (p.narration) ids.add(p.narration);
    for (const e of p.elements)
      for (const k of ["media", "poster", "captions"]) if (e[k]) ids.add(e[k]);
  }
  await Promise.all([...ids].map((id) => mediaUrl(id).catch(() => "")));
}

const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

function textStyle(el) {
  const d = ROLE_DEFAULTS[el.role] || ROLE_DEFAULTS.body;
  const s = el.style || {};
  const parts = [
    `--s:${s.size ?? d.size}`,
    `font-family:${(FONTS[s.font || d.font] || FONTS.atkinson).css}`,
    `font-weight:${s.weight ?? d.weight}`,
    `line-height:${s.lineHeight ?? d.lineHeight}`,
  ];
  if (s.color) parts.push(`color:${s.color}`);
  if (s.align) parts.push(`text-align:${s.align}`);
  if (s.bg) parts.push(`background:${s.bg}`);
  if (s.columns > 1) parts.push(`column-count:${s.columns}`, "column-gap:4cqw");
  return parts.join(";").replace(/"/g, "'");
}

const SHAPE_PATHS = {
  triangle: "M50 2 L98 98 L2 98 Z",
  star: "M50 3 L61.8 36 L97 36.4 L68.6 57.6 L79.4 93 L50 71.6 L20.6 93 L31.4 57.6 L3 36.4 L38.2 36 Z",
  arrow: "M2 38 L64 38 L64 14 L98 50 L64 86 L64 62 L2 62 Z",
  heart:
    "M50 92 C20 70 2 52 2 30 C2 14 14 4 28 4 C38 4 46 10 50 18 C54 10 62 4 72 4 C86 4 98 14 98 30 C98 52 80 70 50 92 Z",
};

function shapeHTML(el) {
  const fill = el.fill === "none" ? "transparent" : el.fill;
  const stroke = el.stroke === "none" ? "transparent" : el.stroke;
  if (el.shape === "rect" || el.shape === "rounded" || el.shape === "ellipse") {
    const r = el.shape === "ellipse" ? "50%" : el.shape === "rounded" ? "3cqw" : "0";
    return `<div class="bk-shape-box" style="background:${fill};border:calc(${el.strokeW}*1cqw) solid ${stroke};border-radius:${r}"></div>`;
  }
  if (el.shape === "line")
    return `<svg class="bk-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><line x1="0" y1="50" x2="100" y2="50" stroke="${stroke === "transparent" ? fill : stroke}" vector-effect="non-scaling-stroke" style="stroke-width:calc(${Math.max(el.strokeW, 0.4)}*1cqw)"/></svg>`;
  return `<svg class="bk-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${SHAPE_PATHS[el.shape] || SHAPE_PATHS.triangle}" fill="${fill}" stroke="${stroke}" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke-width:calc(${el.strokeW}*1cqw)"/></svg>`;
}

/** Smooth a stroke through quadratic midpoints. Points are in element-local 0..1000 units. */
export function strokePath(pts) {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]} l0.1 0`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += ` Q${pts[i][0]} ${pts[i][1]} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  const last = pts.at(-1);
  return `${d} L${last[0]} ${last[1]}`;
}

export function drawingSVG(el) {
  const paths = el.strokes
    .map(
      (s) =>
        `<path d="${strokePath(s.pts)}" fill="none" stroke="${s.color}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" style="stroke-width:calc(${s.size}*0.5cqw)"/>`,
    )
    .join("");
  return `<svg class="bk-svg bk-drawing-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">${paths}</svg>`;
}

const TAILS = {
  "bottom-left": "M18 0 L8 22 L36 0 Z",
  "bottom-right": "M64 0 L92 22 L82 0 Z",
  "top-left": "M18 22 L8 0 L36 22 Z",
  "top-right": "M64 22 L92 0 L82 22 Z",
};

function bubbleHTML(el, ctx) {
  const tail =
    el.variant === "caption" || el.tail === "none"
      ? ""
      : el.variant === "thought"
        ? thoughtDots(el.tail)
        : TAILS[el.tail]
          ? `<svg class="bk-tail bk-tail-${el.tail}" viewBox="0 0 100 22" preserveAspectRatio="none" aria-hidden="true"><path d="${TAILS[el.tail]}" fill="${el.fill}" stroke="#1b1f3b" vector-effect="non-scaling-stroke" style="stroke-width:0.45cqw"/></svg>`
          : "";
  return `<div class="bk-bubble bk-bubble-${el.variant}" style="background:${el.fill}">${textBody(el, ctx)}</div>${tail}`;
}
function thoughtDots(tail) {
  const left = !/right/.test(tail);
  const top = /top/.test(tail);
  return `<span class="bk-thought-dots ${left ? "is-left" : "is-right"} ${top ? "is-top" : ""}" aria-hidden="true"><i></i><i></i></span>`;
}

function textBody(el, ctx) {
  const empty = !plainText(el.html);
  const ph = el.ph ? pick(el.ph, ctx.lang === "es" ? "es" : "en") : "";
  const lang = el.style?.lang ? ` lang="${esc(el.style.lang)}"` : "";
  const dir = el.style?.dir ? ` dir="${el.style.dir}"` : "";
  const editable = ctx.mode === "edit" ? ` data-text-of="${el.id}" spellcheck="true"` : "";
  if (empty && ctx.mode !== "edit") return "";
  // Colour swatches are stored as data-c (sanitized hex) and painted inline here.
  const body = el.html.replace(/ data-c="(#[0-9a-fA-F]{3,8})"/g, ' data-c="$1" style="color:$1"');
  const marked = ctx.vocab?.length && ctx.mode === "read" ? markVocab(body, ctx.vocab) : body;
  return `<div class="bk-txt"${lang}${dir}${editable}${empty && ph ? ` data-ph="${esc(ph)}"` : ""} style="${textStyle(el)}">${marked}</div>`;
}

function imageHTML(el, ctx) {
  const src = cachedUrl(el.media);
  if (!src) {
    if (ctx.mode !== "edit") return "";
    const ph = el.ph
      ? pick(el.ph, ctx.lang === "es" ? "es" : "en")
      : ctx.lang === "es"
        ? "Agrega una imagen"
        : "Add a picture";
    return `<div class="bk-slot">${bkIcon("image")}<span>${esc(ph)}</span></div>`;
  }
  const pos = el.crop
    ? `object-position:${el.crop.x}% ${el.crop.y}%;transform:scale(${el.crop.zoom});transform-origin:${el.crop.x}% ${el.crop.y}%`
    : "";
  const img = `<img src="${src}" alt="${esc(el.alt)}" style="object-fit:${el.fit};${pos}" draggable="false" />`;
  return el.caption
    ? `<figure class="bk-figure"><div class="bk-img-wrap">${img}</div><figcaption>${esc(el.caption)}</figcaption></figure>`
    : `<div class="bk-img-wrap">${img}</div>`;
}

function audioHTML(el, ctx) {
  const has = !!cachedUrl(el.media);
  const label = el.label || (ctx.lang === "es" ? "Escuchar" : "Listen");
  if (!has && ctx.mode !== "edit") return "";
  if (ctx.mode === "print" || ctx.mode === "thumb")
    return `<div class="bk-audio is-print"><span aria-hidden="true">♪</span> ${esc(label)}${el.seconds ? ` (${fmtTime(el.seconds)})` : ""}</div>`;
  const tag = ctx.mode === "edit" ? "div" : "button";
  const attrs =
    ctx.mode === "edit"
      ? ""
      : ` type="button" data-play-media="${el.media}" aria-label="${esc(`${label}${el.seconds ? `, ${fmtTime(el.seconds)}` : ""}`)}"`;
  return `<${tag} class="bk-audio${has ? "" : " is-empty"}"${attrs}>${bkIcon(has ? "play" : "mic")}<span>${esc(has ? label : ctx.lang === "es" ? "Graba aquí" : "Record here")}</span>${el.seconds ? `<small>${fmtTime(el.seconds)}</small>` : ""}</${tag}>`;
}

function videoHTML(el, ctx) {
  if (el.embed?.provider === "youtube") {
    if (ctx.mode === "read")
      return `<iframe class="bk-embed" src="https://www.youtube-nocookie.com/embed/${el.embed.id}?rel=0" title="${esc(el.title || "Video")}" allow="encrypted-media; picture-in-picture; fullscreen" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return `<div class="bk-video-ph"><img src="https://i.ytimg.com/vi/${el.embed.id}/hqdefault.jpg" alt="" loading="lazy"/><span>▶ ${esc(el.title || "YouTube video")}</span></div>`;
  }
  const src = cachedUrl(el.media);
  if (!src)
    return ctx.mode === "edit"
      ? `<div class="bk-slot"><span>${ctx.lang === "es" ? "Agrega un video" : "Add a video"}</span></div>`
      : "";
  if (ctx.mode === "print" || ctx.mode === "thumb") {
    const poster = cachedUrl(el.poster);
    return `<div class="bk-video-ph">${poster ? `<img src="${poster}" alt=""/>` : ""}<span>▶ ${esc(el.title || "Video")}</span></div>`;
  }
  const poster = cachedUrl(el.poster);
  const track = cachedUrl(el.captions)
    ? `<track kind="captions" src="${cachedUrl(el.captions)}" srclang="en" label="Captions" default />`
    : "";
  return `<video src="${src}"${poster ? ` poster="${poster}"` : ""} controls preload="metadata" playsinline title="${esc(el.title)}"${ctx.mode === "edit" ? ' tabindex="-1"' : ""}>${track}</video>`;
}

function elementInner(el, ctx) {
  switch (el.type) {
    case "text":
      return textBody(el, ctx);
    case "bubble":
      return bubbleHTML(el, ctx);
    case "image":
      return imageHTML(el, ctx);
    case "art": {
      const info = artInfo(el.art);
      return `<img class="bk-art${el.flip ? " is-flipped" : ""}" src="${artSrc(el.art)}" alt="${esc(el.alt || (info ? pick(info, ctx.lang === "es" ? "es" : "en") : ""))}" draggable="false" />`;
    }
    case "shape":
      return shapeHTML(el);
    case "panel":
      return `<div class="bk-panel-frame" style="background:${el.fill};border:calc(${el.strokeW}*1cqw) solid ${el.stroke};border-radius:calc(${el.radius}*1cqw)"></div>`;
    case "audio":
      return audioHTML(el, ctx);
    case "video":
      return videoHTML(el, ctx);
    case "drawing":
      return drawingSVG(el);
    default:
      return "";
  }
}

const MOUTH = {
  happy: "M7 14 Q12 19 17 14",
  worried: "M7 17 Q12 13 17 17",
  surprised: "M12 15 m-2 0 a2 2.4 0 1 0 4 0 a2 2.4 0 1 0 -4 0",
  angry: "M7 16 L17 16",
  sad: "M7 17 Q12 12 17 17",
  thinking: "M8 16 L15 15",
};
const BROW = { worried: "M6 7 L10 6 M18 7 L14 6", angry: "M6 6 L10 8 M18 6 L14 8", sad: "M6 7 L10 6 M18 7 L14 6", thinking: "M6 7 L10 6 M14 7 L18 6", surprised: "M6 5 L10 5 M14 5 L18 5" };
/** A small drawn face badge for a changed expression (decorative: the expression is also in the picture's description). */
export function exprFace(expr) {
  const m = MOUTH[expr];
  if (!m) return "";
  return `<svg class="bk-expr" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#fff3c4" stroke="#1b1f3b" stroke-width="1.2"/><circle cx="8.5" cy="10" r="1.2" fill="#1b1f3b"/><circle cx="15.5" cy="10" r="1.2" fill="#1b1f3b"/>${BROW[expr] ? `<path d="${BROW[expr]}" stroke="#1b1f3b" stroke-width="1" fill="none" stroke-linecap="round"/>` : ""}<path d="${m}" stroke="#1b1f3b" stroke-width="1.4" fill="${expr === "surprised" ? "#1b1f3b" : "none"}" stroke-linecap="round"/></svg>`;
}

export function elementHTML(el, ctx) {
  const inner = elementInner(el, ctx);
  if (!inner && ctx.mode !== "edit") return "";
  const style = `left:${el.x}%;top:${el.y}%;width:${el.w}%;height:${el.h}%${el.rot ? `;transform:rotate(${el.rot}deg)` : ""}`;
  const sel = ctx.mode === "edit" ? ` data-el="${el.id}" tabindex="-1"` : ` data-el="${el.id}"`;
  const roleAttr = el.type === "text" ? ` data-role="${el.role}"` : "";
  const hot = el.hotspot && ctx.mode !== "edit" && ctx.mode !== "print" && ctx.mode !== "thumb";
  const hotAttr = hot ? ` data-hotspot="${el.id}" role="button" tabindex="0" aria-label="${esc(el.hotspot.label || "Clickable object")}"` : "";
  const char = el.charId ? ` data-char="${esc(el.charId)}"` : "";
  const anim = el.anim && el.anim !== "none" && ctx.mode === "read" ? ` bk-enter-${el.anim}` : "";
  const face = el.expression && el.expression !== "neutral" ? exprFace(el.expression) : "";
  const hotMark = el.hotspot && ctx.mode === "edit" ? `<span class="bk-hot-flag" aria-hidden="true">${bkIcon("search")}</span>` : "";
  return `<div class="bk-el bk-t-${el.type}${el.locked ? " is-locked" : ""}${hot ? " bk-hot" : ""}${anim}"${roleAttr}${char}${hotAttr}${sel} style="${style}">${inner}${face}${hotMark}</div>`;
}

/**
 * A page as HTML. ctx: { mode: "edit" | "read" | "thumb" | "print", lang, pageNumber, dir }.
 * The page box keeps its format's aspect ratio; width is set by the caller's container.
 */
export function pageHTML(book, page, ctx = {}) {
  const fmt = FORMATS[book.format] || FORMATS.portrait;
  const c = { mode: "read", lang: "en", ...ctx };
  const bgArt = page.bgArt
    ? `<img class="bk-bg-art" src="${artSrc(page.bgArt)}" alt="" draggable="false" />`
    : "";
  const dir = book.dir === "rtl" ? ' dir="rtl"' : "";
  const label = c.label ? ` role="group" aria-label="${esc(c.label)}"` : "";
  return `<div class="bk-page bk-fmt-${book.format}${page.scene?.parallax && c.mode === "read" ? " bk-parallax" : ""}" data-page="${page.id}"${dir}${label} style="--ratio:${fmt.ratio};background:${page.bg}"><div class="bk-cam">${bgArt}${page.elements.map((e) => elementHTML(e, c)).join("")}</div>${page.scene?.ambience && c.mode === "read" ? `<div class="bk-amb bk-amb-${page.scene.ambience}" aria-hidden="true"></div>` : ""}</div>`;
}

/** Description of a page for assistive technology in the reader (reading order: text, pictures' descriptions). */
export function pageAltText(page) {
  return page.elements
    .filter((e) => (e.type === "image" || e.type === "art") && e.alt)
    .map((e) => e.alt)
    .join(". ");
}
