// The studio video card on the Language Page app's own routes (data/studio-videos.json `pages`).
// The routes come from studio-video-routes.js, generated from that manifest, so a route with no video
// costs one object lookup and no network request. The card markup is pre-rendered into that table by the generator
// (one builder, assets/studio-video/studio-video-markup.mjs), so it goes in with the screen, in the same frame (no
// layout shift); the player loads afterwards and upgrades it in place.
import { STUDIO_VIDEO_ROUTES, STUDIO_VIDEOS } from "./studio-video-routes.js";

const PLAYER = "/assets/studio-video/studio-video.js";
const STYLES = "/assets/studio-video/studio-video.css";

/**
 * Where a card goes on a screen: with `after` (a CSS selector, `up` parents higher) right after that element, so it
 * sits inside the section it is about; otherwise, or if the selector no longer matches, under the screen's heading
 * block: directly under the first <h1> and its lead paragraph, or climbing from the <h1> until the parent has three
 * or more children. With no <h1> it goes first in the container.
 */
function anchorOf(container, { after, up = 0 }) {
  let el = null;
  try {
    el = container.querySelector(after);
  } catch {
    el = null;
  }
  for (let i = 0; el && i < up; i += 1)
    el = el.parentElement && el.parentElement !== container ? el.parentElement : null;
  if (!el) console.warn(`[studio-video] anchor "${after}" not found; using the default place`);
  return el;
}

export function placeCard(container, html, entry = {}) {
  const anchor = entry.after ? anchorOf(container, entry) : null;
  if (anchor) {
    anchor.insertAdjacentHTML("afterend", html);
    return anchor.nextElementSibling;
  }
  let block = container.querySelector("h1");
  // Best spot: directly under the title and its lead paragraph, before controls and side cards.
  if (block?.nextElementSibling?.tagName === "P") {
    block.nextElementSibling.insertAdjacentHTML("afterend", html);
    return block.nextElementSibling.nextElementSibling;
  }
  while (
    block &&
    block.parentElement &&
    block.parentElement !== container &&
    block.parentElement.children.length < 3
  )
    block = block.parentElement;
  if (block && block !== container && block.parentElement) {
    block.insertAdjacentHTML("afterend", html);
    return block.nextElementSibling;
  }
  container.insertAdjacentHTML("afterbegin", html);
  return container.firstElementChild;
}

/** The card for a pathname (with its `after` / `up` placement), or null. "/x/" and "/x" are the same route. */
export function studioVideoFor(pathname) {
  const key = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const route = STUDIO_VIDEO_ROUTES[key];
  return route ? { ...STUDIO_VIDEOS[route.id], after: route.after, up: route.up } : null;
}

/**
 * Put the card on `root` when this route has one, in the same frame as the screen (no layout shift), then load the
 * player, which upgrades it in place. `isCurrent()` is checked after the player loads so a slow import cannot
 * leave work for the next screen.
 */
export async function mountStudioVideo(root, pathname, isCurrent = () => true) {
  const entry = studioVideoFor(pathname);
  if (!entry || root.querySelector(`studio-video[data-id="${entry.id}"]`)) return;
  if (!document.querySelector(`link[href="${STYLES}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = STYLES;
    document.head.append(link);
  }
  placeCard(root, entry.html, entry);
  try {
    await import(PLAYER);
    if (!isCurrent()) root.querySelector(`studio-video[data-id="${entry.id}"]`)?.remove();
  } catch (error) {
    // The video is an extra: a failed load must never break the practice screen (the card stays a poster link).
    console.warn("[access-lab] studio video player unavailable", error);
  }
}
