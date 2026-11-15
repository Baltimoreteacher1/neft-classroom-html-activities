/**
 * <studio-video>: the shared player card for videos made in the motion studio.
 *
 * Progressive enhancement over the markup in studio-video-markup.mjs. Without this script the card is a
 * poster link to the MP4, the description and the full captions text. With it:
 *   - nothing is downloaded until the card is near the viewport (IntersectionObserver), and then only
 *     the poster: the <video> is built with preload="none";
 *   - native controls, an English captions <track> read from the VTT (off until chosen: the films already show their words), and a real <button> that
 *     starts playback on a click or key press. Nothing ever autoplays, with or without sound;
 *   - prefers-reduced-motion: no animation or transition, and the captions text opens by default so
 *     the poster and the words are what the reader gets.
 * No dependencies, no third-party requests. See data/studio-videos.json for what appears where.
 */
import { cardHtml } from "./studio-video-markup.mjs";

const REDUCED = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () => typeof matchMedia === "function" && matchMedia(REDUCED).matches;

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';

let observer = null;
function lazily(el) {
  if (!("IntersectionObserver" in window)) return el.upgrade();
  observer ||= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        entry.target.upgrade();
      }
    },
    { rootMargin: "300px 0px" },
  );
  observer.observe(el);
}

class StudioVideo extends HTMLElement {
  connectedCallback() {
    if (this.upgraded || this.observed) return;
    this.observed = true;
    if (prefersReducedMotion()) {
      this.dataset.reducedMotion = "true";
      const transcript = this.querySelector(".sv-transcript");
      if (transcript) transcript.open = true;
    }
    lazily(this);
  }

  upgrade() {
    if (this.upgraded) return;
    const frame = this.querySelector(".sv-frame");
    const fallback = frame?.querySelector(".sv-fallback");
    if (!frame || !fallback) return;
    this.upgraded = true;
    const { mp4, poster, vtt, title, width, height, id } = this.dataset;

    const stage = document.createElement("div");
    stage.className = "sv-stage";

    const video = document.createElement("video");
    video.className = "sv-video";
    video.controls = true;
    video.preload = "none";
    video.muted = true; // click-to-play only; the films are silent
    video.playsInline = true;
    video.poster = poster;
    video.width = Number(width) || 1920;
    video.height = Number(height) || 1080;
    video.setAttribute("aria-label", title);
    video.setAttribute("aria-describedby", `sv-${id}-desc`);
    const source = document.createElement("source");
    source.src = mp4;
    source.type = "video/mp4";
    const track = document.createElement("track");
    track.kind = "captions";
    track.srclang = "en";
    track.label = "English captions";
    track.src = vtt;
    // The films carry their captions in the picture, so the track is NOT default: a showing track would
    // draw every line twice. It stays disabled until the viewer picks it in the player's captions menu.
    video.append(source, track);
    for (const t of video.textTracks) t.mode = "disabled";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "sv-play";
    button.setAttribute("aria-label", `Play video: ${title}`);
    button.innerHTML = PLAY_ICON;
    button.addEventListener("click", () => {
      video.play().catch(() => {
        // Playback refused (codec, policy): hand over to the native controls.
        button.hidden = true;
        video.focus();
      });
    });
    video.addEventListener("play", () => {
      button.hidden = true;
    });
    video.addEventListener("ended", () => {
      button.hidden = false;
    });

    stage.append(video, button);
    fallback.replaceWith(stage);
  }
}

if (!customElements.get("studio-video")) customElements.define("studio-video", StudioVideo);

/** Mount a card into `container` (used by the Language Page app on its own routes). */
/**
 * The card goes right under the page's heading block, so it is the first thing a visitor sees:
 * climb from the first <h1> until the parent has three or more children, and insert after that block.
 * With no <h1> (or a heading that is the whole container) it goes first in the container.
 */
export function mountStudioVideo(container, entry, options) {
  const html = cardHtml(entry, options);
  let block = container.querySelector("h1");
  // Best spot: directly under the title and its lead paragraph, before controls and side cards.
  if (block?.nextElementSibling?.tagName === "P") {
    block.nextElementSibling.insertAdjacentHTML("afterend", html);
    return block.nextElementSibling.nextElementSibling;
  }
  while (block && block.parentElement && block.parentElement !== container && block.parentElement.children.length < 3) block = block.parentElement;
  if (block && block !== container && block.parentElement) {
    block.insertAdjacentHTML("afterend", html);
    return block.nextElementSibling;
  }
  container.insertAdjacentHTML("afterbegin", html);
  return container.firstElementChild;
}
