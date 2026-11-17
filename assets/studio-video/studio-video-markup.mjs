/**
 * Studio video card markup: ONE builder, used at build time (scripts/generate-studio-videos.mjs writes
 * it into mapped pages and the hubs) and in the browser (the Language Page app mounts it on its own
 * routes). Pure string functions: no DOM, no Node APIs, safe in both. The element then upgrades it
 * (studio-video.js); without JavaScript the card is a poster link and the description. No text sits under
 * the video (Joel 2026-11-17, data/product-decisions.json studio-video-no-text-under-video): the words are the
 * player's captions track.
 *
 * Entry shape: { id, brand, title, description, mp4, poster, vtt, durationSec, width, height, narrated?,
 *                cues: [{ start, text }], hub: { path, name } }
 */

export const POSTER_WIDTH = 1280;
export const POSTER_HEIGHT = 720;
export const STYLESHEET = "/assets/studio-video/studio-video.css";
export const SCRIPT = "/assets/studio-video/studio-video.js";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
export const esc = (value) => String(value).replace(/[&<>"']/g, (ch) => ESC[ch]);

/** "0:07" / "1:05". */
export function clock(seconds) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The card. `headingLevel` keeps the page's outline honest (h2 under a page h1, h3 inside a hub). */
export function cardHtml(entry, { headingLevel = 2 } = {}) {
  const h = `h${headingLevel}`;
  const id = `sv-${entry.id}`;
  const hub = entry.hub
    ? `<p class="sv-more"><a href="${esc(entry.hub.path)}">All ${esc(entry.hub.name)} videos</a></p>`
    : "";
  return `<studio-video class="sv" data-brand="${esc(entry.brand)}" data-id="${esc(entry.id)}" data-title="${esc(entry.title)}" data-mp4="${esc(entry.mp4)}" data-poster="${esc(entry.poster)}" data-vtt="${esc(entry.vtt)}" data-width="${entry.width}" data-height="${entry.height}"${entry.narrated ? ' data-narrated="true"' : ""}>
<div class="sv-copy"><p class="sv-eyebrow">Video &middot; ${clock(entry.durationSec)}</p><${h} class="sv-title" id="${id}-title">${esc(entry.title)}</${h}><p class="sv-desc" id="${id}-desc">${esc(entry.description)}</p></div>
<div class="sv-frame"><a class="sv-fallback" href="${esc(entry.mp4)}"><img class="sv-poster" src="${esc(entry.poster)}" width="${POSTER_WIDTH}" height="${POSTER_HEIGHT}" alt="" loading="lazy" decoding="async"><span class="sv-fallback-label">Play video: ${esc(entry.title)} (MP4)</span></a></div>
${hub}
</studio-video>`;
}

/** Everything a page needs once: the stylesheet and the (deferred, module) script. */
export const assetTags = () =>
  `<link rel="stylesheet" href="${STYLESHEET}">\n<script type="module" src="${SCRIPT}"></script>`;
